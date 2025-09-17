// Dashboard Manager
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.stats = {
            totalIncome: 0,
            totalExpenses: 0,
            currentBalance: 0,
            monthlyGoal: 0
        };
        this.init();
    }

    init() {
        this.bindEvents();
        
        // Listen for auth state changes
        if (window.AuthManager) {
            AuthManager.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.loadDashboard();
                }
            });
        }
        
        // Listen for transaction changes
        if (window.TransactionManager) {
            TransactionManager.addListener((transactions) => {
                this.updateDashboardStats(transactions);
                this.updateRecentTransactions(transactions);
            });
        }
    }

    bindEvents() {
        // Refresh button (if exists)
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Month navigation (if exists)
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        }
    }

    async loadDashboard() {
        if (!this.currentUser) return;
        
        try {
            // Load user preferences and stats
            await this.loadUserData();
            
            // Initialize currency rates
            if (window.CurrencyManager) {
                CurrencyManager.loadRates();
            }
            
            // Initialize charts
            if (window.ChartManager) {
                ChartManager.init();
            }
            
            // Load notifications
            if (window.NotificationManager) {
                NotificationManager.checkBudgetAlerts();
            }
            
        } catch (error) {
            ErrorHandler.handle(error, 'Dashboard Load');
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Update stats
                if (userData.stats) {
                    this.stats = {
                        totalIncome: userData.stats.totalIncome || 0,
                        totalExpenses: userData.stats.totalExpenses || 0,
                        currentBalance: userData.stats.currentBalance || 0,
                        monthlyGoal: userData.preferences?.monthlyBudget || 0
                    };
                }
                
                // Update UI
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateDashboardStats(transactions) {
        // Calculate current month stats
        const currentMonth = new Date();
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth.getMonth() &&
                   transactionDate.getFullYear() === currentMonth.getFullYear();
        });
        
        const monthlyIncome = monthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = Math.abs(monthTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));
        
        const monthlyBalance = monthlyIncome - monthlyExpenses;
        
        // Update stats
        this.stats = {
            totalIncome: monthlyIncome,
            totalExpenses: monthlyExpenses,
            currentBalance: monthlyBalance,
            monthlyGoal: this.stats.monthlyGoal
        };
        
        // Update display
        this.updateStatsDisplay();
        
        // Check budget alerts
        this.checkBudgetAlerts(monthlyExpenses);
        
        // Update charts
        if (window.ChartManager) {
            ChartManager.updateCharts(transactions);
        }
    }

    updateStatsDisplay() {
        // Update balance card
        const currentBalance = document.getElementById('current-balance');
        if (currentBalance) {
            currentBalance.textContent = Utils.formatCurrency(this.stats.currentBalance);
            
            // Add color based on balance
            currentBalance.className = this.stats.currentBalance >= 0 ? 
                'text-2xl font-bold text-emerald-600' : 
                'text-2xl font-bold text-red-600';
        }
        
        // Update income card
        const totalIncome = document.getElementById('total-income');
        if (totalIncome) {
            totalIncome.textContent = Utils.formatCurrency(this.stats.totalIncome);
        }
        
        // Update expenses card
        const totalExpenses = document.getElementById('total-expenses');
        if (totalExpenses) {
            totalExpenses.textContent = Utils.formatCurrency(this.stats.totalExpenses);
        }
        
        // Update monthly goal card
        const monthlyGoal = document.getElementById('monthly-goal');
        if (monthlyGoal) {
            monthlyGoal.textContent = Utils.formatCurrency(this.stats.monthlyGoal);
        }
        
        // Update progress indicators
        this.updateProgressIndicators();
    }

    updateProgressIndicators() {
        // Budget progress
        if (this.stats.monthlyGoal > 0) {
            const budgetUsed = (this.stats.totalExpenses / this.stats.monthlyGoal) * 100;
            const progressBar = document.getElementById('budget-progress');
            
            if (progressBar) {
                progressBar.style.width = `${Math.min(budgetUsed, 100)}%`;
                
                // Change color based on usage
                if (budgetUsed >= 95) {
                    progressBar.className = 'h-2 bg-red-500 rounded-full transition-all duration-300';
                } else if (budgetUsed >= 80) {
                    progressBar.className = 'h-2 bg-yellow-500 rounded-full transition-all duration-300';
                } else {
                    progressBar.className = 'h-2 bg-emerald-500 rounded-full transition-all duration-300';
                }
            }
            
            // Update percentage text
            const budgetPercentage = document.getElementById('budget-percentage');
            if (budgetPercentage) {
                budgetPercentage.textContent = `${Math.round(budgetUsed)}% do orçamento usado`;
            }
        }
    }

    updateRecentTransactions(transactions) {
        const recentTransactionsContainer = document.getElementById('recent-transactions');
        if (!recentTransactionsContainer) return;
        
        const recentTransactions = transactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            recentTransactionsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-receipt text-4xl mb-4"></i>
                    <p>Nenhuma transação encontrada</p>
                    <p class="text-sm">Adicione sua primeira receita ou despesa</p>
                </div>
            `;
            return;
        }
        
        recentTransactionsContainer.innerHTML = recentTransactions.map(transaction => {
            const categoryInfo = this.getCategoryInfo(transaction.category, transaction.type);
            const isIncome = transaction.amount > 0;
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}">
                            <i class="${categoryInfo.icon} ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"></i>
                        </div>
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white">${transaction.description}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                ${categoryInfo.name} • ${Utils.formatDate(transaction.date)}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}">
                            ${isIncome ? '+' : ''}${Utils.formatCurrency(transaction.amount)}
                        </span>
                        <div class="flex space-x-1">
                            <button onclick="TransactionManager.openTransactionModal('${transaction.type}', ${JSON.stringify(transaction).replace(/"/g, '&quot;')})" 
                                    class="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                                <i class="fas fa-edit text-xs"></i>
                            </button>
                            <button onclick="TransactionManager.deleteTransaction('${transaction.id}')" 
                                    class="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Excluir">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getCategoryInfo(categoryId, type) {
        const categories = APP_CONFIG.categories[type] || [];
        const category = categories.find(cat => cat.id === categoryId);
        
        return category || {
            name: 'Outros',
            icon: type === 'income' ? 'fas fa-plus-circle' : 'fas fa-minus-circle'
        };
    }

    checkBudgetAlerts(monthlyExpenses) {
        if (this.stats.monthlyGoal <= 0) return;
        
        const budgetUsed = monthlyExpenses / this.stats.monthlyGoal;
        const warningThreshold = APP_CONFIG.notifications.budgetWarning;
        const dangerThreshold = APP_CONFIG.notifications.budgetDanger;
        
        if (budgetUsed >= dangerThreshold) {
            this.showBudgetAlert(
                'Orçamento Excedido!',
                `Você já gastou ${Utils.calculatePercentage(monthlyExpenses, this.stats.monthlyGoal)}% do seu orçamento mensal.`,
                'danger'
            );
        } else if (budgetUsed >= warningThreshold) {
            this.showBudgetAlert(
                'Atenção ao Orçamento',
                `Você já gastou ${Utils.calculatePercentage(monthlyExpenses, this.stats.monthlyGoal)}% do seu orçamento mensal.`,
                'warning'
            );
        }
    }

    showBudgetAlert(title, message, type) {
        // Check if we've already shown this alert recently
        const lastAlert = Utils.storage.get('lastBudgetAlert');
        const now = Date.now();
        
        if (lastAlert && (now - lastAlert) < APP_CONFIG.notifications.reminderInterval) {
            return; // Don't spam alerts
        }
        
        if (window.NotificationManager) {
            NotificationManager.show(`${title}: ${message}`, type);
            Utils.storage.set('lastBudgetAlert', now);
        }
    }

    async refreshDashboard() {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refresh-dashboard');
            if (refreshBtn) {
                Utils.showLoading(refreshBtn);
            }
            
            // Reload data
            await this.loadUserData();
            
            if (window.TransactionManager) {
                await TransactionManager.loadTransactions();
            }
            
            if (window.CurrencyManager) {
                await CurrencyManager.loadRates();
            }
            
            // Show success message
            if (window.NotificationManager) {
                NotificationManager.show('Dashboard atualizado!', 'success');
            }
            
        } catch (error) {
            ErrorHandler.handle(error, 'Dashboard Refresh');
        } finally {
            const refreshBtn = document.getElementById('refresh-dashboard');
            if (refreshBtn) {
                Utils.hideLoading(refreshBtn, '<i class="fas fa-sync-alt"></i>');
            }
        }
    }

    navigateMonth(direction) {
        // This would implement month navigation
        // For now, just show a message
        if (window.NotificationManager) {
            NotificationManager.show('Navegação por mês em desenvolvimento!', 'info');
        }
    }

    // Investment tips based on balance
    getInvestmentTips() {
        const balance = this.stats.currentBalance;
        const tips = [];
        
        if (balance > 10000) {
            tips.push({
                title: 'Diversifique seus investimentos',
                description: 'Com esse saldo, considere diversificar entre renda fixa e variável.',
                icon: 'fas fa-chart-pie'
            });
        } else if (balance > 5000) {
            tips.push({
                title: 'Considere a Reserva de Emergência',
                description: 'Mantenha 6 meses de gastos em uma reserva de emergência.',
                icon: 'fas fa-shield-alt'
            });
        } else if (balance > 1000) {
            tips.push({
                title: 'Comece com Renda Fixa',
                description: 'Inicie seus investimentos com produtos de renda fixa.',
                icon: 'fas fa-piggy-bank'
            });
        } else {
            tips.push({
                title: 'Foque na Economia',
                description: 'Concentre-se em economizar antes de investir.',
                icon: 'fas fa-coins'
            });
        }
        
        return tips;
    }

    // Spending insights
    getSpendingInsights(transactions) {
        const insights = [];
        const categoryTotals = {};
        
        // Calculate spending by category
        transactions
            .filter(t => t.amount < 0)
            .forEach(t => {
                if (!categoryTotals[t.category]) {
                    categoryTotals[t.category] = 0;
                }
                categoryTotals[t.category] += Math.abs(t.amount);
            });
        
        // Find highest spending category
        const highestCategory = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (highestCategory) {
            const categoryInfo = this.getCategoryInfo(highestCategory[0], 'expense');
            insights.push({
                title: 'Maior Gasto',
                description: `Sua maior despesa é em ${categoryInfo.name}: ${Utils.formatCurrency(highestCategory[1])}`,
                icon: categoryInfo.icon
            });
        }
        
        return insights;
    }

    // Export data functionality
    async exportData(format = 'json') {
        if (!this.currentUser) return;
        
        try {
            const transactions = TransactionManager.getTransactions();
            const userData = {
                user: {
                    name: this.currentUser.displayName,
                    email: this.currentUser.email
                },
                stats: this.stats,
                transactions: transactions,
                exportDate: new Date().toISOString()
            };
            
            let content, filename, mimeType;
            
            switch (format) {
                case 'json':
                    content = JSON.stringify(userData, null, 2);
                    filename = `ecofin-export-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'csv':
                    content = this.convertToCSV(transactions);
                    filename = `ecofin-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                    
                default:
                    throw new Error('Formato não suportado');
            }
            
            // Create and download file
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (window.NotificationManager) {
                NotificationManager.show('Dados exportados com sucesso!', 'success');
            }
            
        } catch (error) {
            ErrorHandler.handle(error, 'Export Data');
        }
    }

    convertToCSV(transactions) {
        const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
        const rows = transactions.map(t => [
            t.date,
            t.description,
            t.category,
            t.type === 'income' ? 'Receita' : 'Despesa',
            t.amount
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    // Public getters
    getStats() {
        return { ...this.stats };
    }
}

// Initialize Dashboard Manager
const dashboardManager = new DashboardManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DashboardManager = dashboardManager;
}