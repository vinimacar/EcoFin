// Notification Manager
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.currentUser = null;
        this.settings = {
            budgetAlerts: true,
            expenseReminders: true,
            motivationalMessages: true,
            soundEnabled: true,
            pushEnabled: false
        };
        this.init();
    }

    init() {
        // Request notification permission
        this.requestPermission();
        
        // Listen for auth state changes
        if (window.AuthManager) {
            AuthManager.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.loadUserSettings();
                    this.startPeriodicChecks();
                }
            });
        }
        
        // Listen for transaction changes - with safety check
        if (window.TransactionManager && typeof window.TransactionManager.addListener === 'function') {
            window.TransactionManager.addListener((transactions) => {
                this.checkBudgetAlerts(transactions);
            });
        } else {
            // Retry after a delay if TransactionManager is not ready
            setTimeout(() => {
                if (window.TransactionManager && typeof window.TransactionManager.addListener === 'function') {
                    window.TransactionManager.addListener((transactions) => {
                        this.checkBudgetAlerts(transactions);
                    });
                }
            }, 200);
        }
        
        // Initialize notification container
        this.createNotificationContainer();
        
        // Show welcome message for new users
        this.showWelcomeMessage();
    }

    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                this.settings.pushEnabled = permission === 'granted';
            } catch (error) {
                console.warn('Notification permission request failed:', error);
            }
        }
    }

    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
        document.body.appendChild(container);
    }

    show(message, type = 'info', duration = 5000, actions = []) {
        const notification = {
            id: Utils.generateId(),
            message,
            type,
            timestamp: new Date(),
            actions
        };
        
        this.notifications.unshift(notification);
        this.renderNotification(notification, duration);
        
        // Play sound if enabled
        if (this.settings.soundEnabled) {
            this.playNotificationSound(type);
        }
        
        // Show browser notification if enabled
        if (this.settings.pushEnabled && type === 'warning') {
            this.showBrowserNotification(message, type);
        }
        
        return notification.id;
    }

    renderNotification(notification, duration) {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = this.getNotificationClasses(notification.type);
        
        const iconClass = this.getNotificationIcon(notification.type);
        const colorClass = this.getNotificationColor(notification.type);
        
        element.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <i class="${iconClass} ${colorClass}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                        ${notification.message}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ${Utils.formatDate(notification.timestamp, { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </p>
                    ${this.renderNotificationActions(notification.actions)}
                </div>
                <button 
                    onclick="NotificationManager.dismiss('${notification.id}')"
                    class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add animation
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        container.appendChild(element);
        
        // Animate in
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.3s ease-out';
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        });
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification.id);
            }, duration);
        }
    }

    renderNotificationActions(actions) {
        if (!actions || actions.length === 0) return '';
        
        return `
            <div class="flex space-x-2 mt-2">
                ${actions.map(action => `
                    <button 
                        onclick="${action.handler}"
                        class="text-xs px-2 py-1 rounded ${action.primary ? 
                            'bg-blue-500 text-white hover:bg-blue-600' : 
                            'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }"
                    >
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    dismiss(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (!element) return;
        
        // Animate out
        element.style.transition = 'all 0.3s ease-in';
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.remove();
        }, 300);
        
        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    getNotificationClasses(type) {
        const baseClasses = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm w-full';
        
        const typeClasses = {
            success: 'border-l-4 border-l-green-500',
            error: 'border-l-4 border-l-red-500',
            warning: 'border-l-4 border-l-yellow-500',
            info: 'border-l-4 border-l-blue-500'
        };
        
        return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: 'text-green-500',
            error: 'text-red-500',
            warning: 'text-yellow-500',
            info: 'text-blue-500'
        };
        
        return colors[type] || colors.info;
    }

    playNotificationSound(type) {
        try {
            // Create audio context for different notification sounds
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different types
            const frequencies = {
                success: 800,
                error: 400,
                warning: 600,
                info: 500
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    showBrowserNotification(message, type) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        const options = {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'ecofin-notification',
            requireInteraction: type === 'warning'
        };
        
        const notification = new Notification('EcoFin', options);
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    }

    // Budget and expense monitoring
    checkBudgetAlerts(transactions) {
        if (!this.settings.budgetAlerts || !this.currentUser) return;
        
        const currentMonth = new Date();
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth.getMonth() &&
                   transactionDate.getFullYear() === currentMonth.getFullYear();
        });
        
        const totalExpenses = Math.abs(monthTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));
        
        const totalIncome = monthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Check if expenses exceed 80% of income
        if (totalIncome > 0 && (totalExpenses / totalIncome) > 0.8) {
            this.show(
                `⚠️ Atenção! Você já gastou ${Math.round((totalExpenses / totalIncome) * 100)}% da sua receita mensal.`,
                'warning',
                8000,
                [
                    {
                        label: 'Ver Detalhes',
                        handler: 'DashboardManager.showExpenseBreakdown()',
                        primary: true
                    },
                    {
                        label: 'Dicas de Economia',
                        handler: 'NotificationManager.showSavingTips()'
                    }
                ]
            );
        }
        
        // Check for unusual spending patterns
        this.checkSpendingPatterns(monthTransactions);
    }

    checkSpendingPatterns(transactions) {
        const last7Days = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo && t.amount < 0;
        });
        
        const weeklyExpenses = Math.abs(last7Days.reduce((sum, t) => sum + t.amount, 0));
        
        // Get average weekly expenses from previous month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const lastMonthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === lastMonth.getMonth() &&
                   transactionDate.getFullYear() === lastMonth.getFullYear() &&
                   t.amount < 0;
        });
        
        const avgWeeklyExpenses = Math.abs(lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0)) / 4;
        
        // Alert if current week expenses are 50% higher than average
        if (avgWeeklyExpenses > 0 && weeklyExpenses > (avgWeeklyExpenses * 1.5)) {
            this.show(
                `📊 Seus gastos desta semana estão ${Math.round(((weeklyExpenses / avgWeeklyExpenses) - 1) * 100)}% acima da média.`,
                'warning',
                6000,
                [
                    {
                        label: 'Analisar Gastos',
                        handler: 'ChartManager.exportChart("category", "png")',
                        primary: true
                    }
                ]
            );
        }
    }

    // Periodic checks and reminders
    startPeriodicChecks() {
        // Check for expense reminders every hour
        setInterval(() => {
            this.checkExpenseReminders();
        }, 60 * 60 * 1000);
        
        // Show motivational messages daily
        setInterval(() => {
            this.showMotivationalMessage();
        }, 24 * 60 * 60 * 1000);
        
        // Initial check after 5 minutes
        setTimeout(() => {
            this.checkExpenseReminders();
        }, 5 * 60 * 1000);
    }

    checkExpenseReminders() {
        if (!this.settings.expenseReminders) return;
        
        const now = new Date();
        const today = now.toDateString();
        
        // Check if user has recorded any transactions today
        if (window.TransactionManager) {
            const todayTransactions = TransactionManager.transactions.filter(t => {
                return new Date(t.date).toDateString() === today;
            });
            
            // Remind to record expenses if none recorded and it's after 6 PM
            if (todayTransactions.length === 0 && now.getHours() >= 18) {
                this.show(
                    '💡 Lembrete: Não se esqueça de registrar suas despesas de hoje!',
                    'info',
                    6000,
                    [
                        {
                            label: 'Adicionar Despesa',
                            handler: 'TransactionManager.showAddModal("expense")',
                            primary: true
                        }
                    ]
                );
            }
        }
    }

    showMotivationalMessage() {
        if (!this.settings.motivationalMessages) return;
        
        const messages = [
            '🌟 Cada real economizado é um passo em direção aos seus sonhos!',
            '💪 Você está no controle das suas finanças. Continue assim!',
            '🎯 Pequenas economias hoje se tornam grandes conquistas amanhã.',
            '📈 Acompanhar seus gastos é o primeiro passo para a liberdade financeira.',
            '💡 Dica: Revise seus gastos semanalmente para manter o foco.',
            '🏆 Parabéns por cuidar bem do seu dinheiro!',
            '🌱 Seus hábitos financeiros estão crescendo. Continue cultivando!',
            '⭐ Lembre-se: não é quanto você ganha, mas quanto você guarda.'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        this.show(randomMessage, 'info', 8000);
    }

    showSavingTips() {
        const tips = [
            '💡 Dica: Use a regra 50-30-20 (50% necessidades, 30% desejos, 20% poupança)',
            '🛒 Faça uma lista antes de ir às compras e siga-a rigorosamente',
            '☕ Prepare seu café em casa - pode economizar até R$ 100/mês',
            '🚗 Use transporte público ou carona quando possível',
            '💳 Evite compras por impulso - espere 24h antes de comprar',
            '📱 Cancele assinaturas que você não usa regularmente',
            '🍽️ Cozinhe mais em casa - é mais saudável e econômico',
            '💰 Automatize sua poupança - transfira um valor fixo todo mês'
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        this.show(randomTip, 'info', 10000);
    }

    showWelcomeMessage() {
        // Show welcome message for new users (only once)
        const hasSeenWelcome = localStorage.getItem('ecofin-welcome-seen');
        
        if (!hasSeenWelcome) {
            setTimeout(() => {
                this.show(
                    '🎉 Bem-vindo ao EcoFin! Sua jornada para a liberdade financeira começa aqui.',
                    'success',
                    8000,
                    [
                        {
                            label: 'Começar Tour',
                            handler: 'NotificationManager.startTour()',
                            primary: true
                        }
                    ]
                );
                
                localStorage.setItem('ecofin-welcome-seen', 'true');
            }, 2000);
        }
    }

    startTour() {
        // Simple tour implementation
        const tourSteps = [
            {
                element: '#balance-card',
                message: 'Aqui você vê seu saldo atual em tempo real'
            },
            {
                element: '#add-transaction-btn',
                message: 'Use este botão para adicionar receitas e despesas'
            },
            {
                element: '#main-chart',
                message: 'Acompanhe suas finanças com gráficos interativos'
            }
        ];
        
        let currentStep = 0;
        
        const showStep = () => {
            if (currentStep >= tourSteps.length) return;
            
            const step = tourSteps[currentStep];
            const element = document.querySelector(step.element);
            
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    this.show(
                        step.message,
                        'info',
                        5000,
                        [
                            {
                                label: currentStep < tourSteps.length - 1 ? 'Próximo' : 'Finalizar',
                                handler: `NotificationManager.nextTourStep(${currentStep + 1})`,
                                primary: true
                            }
                        ]
                    );
                }, 500);
            }
        };
        
        window.NotificationManager.nextTourStep = (step) => {
            currentStep = step;
            if (currentStep < tourSteps.length) {
                showStep();
            }
        };
        
        showStep();
    }

    // Settings management
    async loadUserSettings() {
        if (!this.currentUser) return;
        
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.settings = { ...this.settings, ...userData.notificationSettings };
            }
        } catch (error) {
            console.warn('Could not load notification settings:', error);
        }
    }

    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.currentUser) {
            try {
                await db.collection('users').doc(this.currentUser.uid).update({
                    notificationSettings: this.settings
                });
            } catch (error) {
                console.warn('Could not save notification settings:', error);
            }
        }
    }

    // Clear all notifications
    clearAll() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
        this.notifications = [];
    }

    // Get notification history
    getHistory(limit = 50) {
        return this.notifications.slice(0, limit);
    }
}

// Initialize Notification Manager
const notificationManager = new NotificationManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.NotificationManager = notificationManager;
}

// Global error handler integration
window.addEventListener('error', (event) => {
    if (window.NotificationManager) {
        NotificationManager.show(
            'Ocorreu um erro inesperado. Tente recarregar a página.',
            'error',
            8000
        );
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    if (window.NotificationManager) {
        NotificationManager.show(
            'Erro de conexão. Verifique sua internet.',
            'warning',
            6000
        );
    }
});