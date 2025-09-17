// Main Application Controller
class EcoFinApp {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.managers = {};
        this.init();
    }

    async init() {
        try {
            // Show initial loading
            this.showInitialLoading();
            
            // Initialize Firebase
            await this.initializeFirebase();
            
            // Initialize managers
            this.initializeManagers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            
            // Setup PWA
            this.setupPWA();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading
            this.hideInitialLoading();
            
            console.log('🎉 EcoFin App initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize EcoFin App:', error);
            this.showInitializationError(error);
        }
    }

    showInitialLoading() {
        const loadingElement = document.getElementById('loading-screen');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            
            // Update loading messages
            const messages = [
                'Inicializando EcoFin...',
                'Conectando ao Firebase...',
                'Carregando módulos...',
                'Preparando interface...',
                'Quase pronto!'
            ];
            
            let messageIndex = 0;
            const messageElement = loadingElement.querySelector('.loading-message');
            
            const updateMessage = () => {
                if (messageElement && messageIndex < messages.length) {
                    messageElement.textContent = messages[messageIndex];
                    messageIndex++;
                }
            };
            
            updateMessage();
            this.loadingInterval = setInterval(updateMessage, 800);
        }
    }

    hideInitialLoading() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        
        const loadingElement = document.getElementById('loading-screen');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 500);
        }
    }

    async initializeFirebase() {
        try {
            // Check if we're in demo mode
            if (window.firebaseConfig && window.firebaseConfig.demoMode) {
                console.log('🔧 Firebase disabled in demo mode');
                return;
            }
            
            // Firebase should be initialized by the config
            if (typeof firebase === 'undefined') {
                console.log('⚠️ Firebase SDK not available - running in offline mode');
                return;
            }
            
            // Test Firebase connection only if not in demo mode
            if (firebase.apps.length > 0) {
                console.log('✅ Firebase already initialized');
            } else {
                console.log('⚠️ Firebase not initialized - running in demo mode');
            }
            
        } catch (error) {
            console.warn('⚠️ Firebase connection issue - continuing in demo mode:', error.message);
            // Don't throw error, just continue in demo mode
        }
    }

    async initializeManagers() {
        try {
            console.log('🚀 Inicializando managers...');
            
            // Initialize managers in order (demo mode)
            this.managers.auth = new AuthManager();
            window.AuthManager = this.managers.auth;
            
            // Wait a bit for TransactionManager to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Initialize other managers only if TransactionManager is ready
            if (typeof TransactionManager !== 'undefined') {
                this.managers.transactions = new TransactionManager();
                this.managers.dashboard = new DashboardManager();
                this.managers.charts = new ChartManager();
                this.managers.notifications = new NotificationManager();
                this.managers.currency = new CurrencyManager();
                this.managers.ai = new AIAssistant();
                
                // Make managers globally available
                window.TransactionManager = this.managers.transactions;
                window.DashboardManager = this.managers.dashboard;
                window.ChartManager = this.managers.charts;
                window.NotificationManager = this.managers.notifications;
                window.CurrencyManager = this.managers.currency;
                window.AIAssistant = this.managers.ai;
            }
            
            console.log('✅ Todos os managers inicializados com sucesso (modo demo)');
            
        } catch (error) {
            console.error('❌ Falha na inicialização dos managers:', error);
            // Don't use ErrorHandler if it's not available
            if (window.ErrorHandler) {
                ErrorHandler.handle(error, 'Manager Initialization');
            }
            console.log('🔧 Continuando em modo demo');
        }
    }

    setupEventListeners() {
        // Auth state changes
        if (this.managers.auth) {
            this.managers.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.handleAuthStateChange(user);
            });
        }
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });
        
        window.addEventListener('online', () => {
            this.handleOnlineStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleOnlineStatusChange(false);
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Navigation
        this.setupNavigation();
        
        // Modal events
        this.setupModalEvents();
        
        // Form submissions
        this.setupFormEvents();
        
        console.log('✅ Event listeners setup complete');
    }

    setupNavigation() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // Navigation links
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    setupModalEvents() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeAllModals();
            }
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Modal close buttons
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
    }

    setupFormEvents() {
        // Transaction form
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit(e);
            });
        }
        
        // Auth forms
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }
    }

    initializeUI() {
        // Set initial theme
        this.initializeTheme();
        
        // Show appropriate section based on auth state
        if (this.currentUser) {
            this.showSection('dashboard');
        } else {
            this.showSection('auth');
        }
        
        // Initialize tooltips
        this.initializeTooltips();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('✅ UI initialized');
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Notify chart manager to update colors
        if (this.managers.charts && this.managers.charts.updateChartColors) {
            setTimeout(() => this.managers.charts.updateChartColors(), 100);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New transaction
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (this.currentUser) {
                    this.showAddTransactionModal();
                }
            }
            
            // Ctrl/Cmd + D: Dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (this.currentUser) {
                    this.showSection('dashboard');
                }
            }
            
            // Ctrl/Cmd + /: Toggle AI Assistant
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                if (this.currentUser && this.managers.ai) {
                    this.managers.ai.toggleChat();
                }
            }
        });
    }

    initializeTooltips() {
        // Simple tooltip implementation
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('title'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.className = 'absolute bg-gray-900 text-white text-xs rounded py-1 px-2 z-50';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            console.log('✅ User authenticated:', user.email);
            this.showSection('dashboard');
            
            // Welcome notification
            if (this.managers.notifications) {
                this.managers.notifications.show(
                    `Bem-vindo de volta, ${user.displayName || user.email}!`,
                    'success',
                    5000
                );
            }
            
        } else {
            console.log('ℹ️ User signed out');
            this.showSection('auth');
            
            // Clear user data
            this.clearUserData();
        }
    }

    handleOnlineStatusChange(isOnline) {
        if (this.managers.notifications) {
            if (isOnline) {
                this.managers.notifications.show(
                    '🌐 Conexão restaurada!',
                    'success',
                    3000
                );
                
                // Sync data when back online
                this.syncData();
                
            } else {
                this.managers.notifications.show(
                    '⚠️ Sem conexão. Funcionando offline.',
                    'warning',
                    5000
                );
            }
        }
        
        // Update UI to reflect online status
        document.body.classList.toggle('offline', !isOnline);
    }

    handleBeforeUnload() {
        // Save any pending data
        if (this.managers.transactions) {
            // Auto-save any draft transactions
            this.managers.transactions.saveDrafts();
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show requested section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Section-specific actions
        switch (sectionName) {
            case 'dashboard':
                if (this.managers.dashboard) {
                    this.managers.dashboard.refresh();
                }
                break;
                
            case 'transactions':
                if (this.managers.transactions) {
                    this.managers.transactions.loadTransactions();
                }
                break;
        }
    }

    showAddTransactionModal(type = 'expense') {
        if (this.managers.transactions) {
            this.managers.transactions.showAddModal(type);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    async handleLogin(event) {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (this.managers.auth) {
            await this.managers.auth.signInWithEmail(email, password);
        }
    }

    async handleRegister(event) {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        
        if (this.managers.auth) {
            await this.managers.auth.signUpWithEmail(email, password, name);
        }
    }

    async handleTransactionSubmit(event) {
        const formData = new FormData(event.target);
        
        const transactionData = {
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date'),
            type: formData.get('type')
        };
        
        // Make amount negative for expenses
        if (transactionData.type === 'expense') {
            transactionData.amount = -Math.abs(transactionData.amount);
        }
        
        if (this.managers.transactions) {
            await this.managers.transactions.addTransaction(transactionData);
        }
        
        // Close modal and reset form
        this.closeAllModals();
        event.target.reset();
    }

    async logout() {
        if (this.managers.auth) {
            await this.managers.auth.signOut();
        }
    }

    clearUserData() {
        // Clear sensitive data when user logs out
        if (this.managers.transactions) {
            this.managers.transactions.clearData();
        }
        
        if (this.managers.dashboard) {
            this.managers.dashboard.clearData();
        }
        
        if (this.managers.charts) {
            this.managers.charts.clearCharts();
        }
    }

    async syncData() {
        // Sync data when connection is restored
        if (!navigator.onLine || !this.currentUser) return;
        
        try {
            if (this.managers.transactions) {
                await this.managers.transactions.syncOfflineData();
            }
            
            if (this.managers.currency) {
                await this.managers.currency.fetchRates();
            }
            
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
        
        // Handle install prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallPrompt(deferredPrompt);
        });
        
        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('✅ EcoFin installed as PWA');
            
            if (this.managers.notifications) {
                this.managers.notifications.show(
                    '🎉 EcoFin instalado com sucesso!',
                    'success',
                    5000
                );
            }
        });
    }

    showInstallPrompt(deferredPrompt) {
        if (this.managers.notifications) {
            this.managers.notifications.show(
                '📱 Instale o EcoFin para uma melhor experiência!',
                'info',
                8000,
                [
                    {
                        label: 'Instalar',
                        handler: () => {
                            deferredPrompt.prompt();
                            deferredPrompt.userChoice.then((choiceResult) => {
                                if (choiceResult.outcome === 'accepted') {
                                    console.log('User accepted the install prompt');
                                }
                                deferredPrompt = null;
                            });
                        },
                        primary: true
                    }
                ]
            );
        }
    }

    showInitializationError(error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed inset-0 bg-red-50 dark:bg-red-900 flex items-center justify-center z-50';
        errorContainer.innerHTML = `
            <div class="text-center p-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                <h1 class="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
                    Erro de Inicialização
                </h1>
                <p class="text-red-700 dark:text-red-200 mb-4">
                    ${error.message || 'Falha ao inicializar a aplicação'}
                </p>
                <button 
                    onclick="location.reload()"
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                    Tentar Novamente
                </button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }

    // Public API methods
    getManager(name) {
        return this.managers[name];
    }

    isUserAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Export data for backup
    async exportAllData() {
        if (!this.currentUser) return null;
        
        const data = {
            user: {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName
            },
            transactions: [],
            settings: {},
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Get transactions
        if (this.managers.transactions) {
            data.transactions = this.managers.transactions.getAllTransactions();
        }
        
        // Get settings
        if (this.managers.notifications) {
            data.settings.notifications = this.managers.notifications.settings;
        }
        
        return data;
    }

    // Import data from backup
    async importData(data) {
        if (!this.currentUser || !data) return false;
        
        try {
            // Import transactions
            if (data.transactions && this.managers.transactions) {
                await this.managers.transactions.importTransactions(data.transactions);
            }
            
            // Import settings
            if (data.settings && this.managers.notifications) {
                await this.managers.notifications.updateSettings(data.settings.notifications);
            }
            
            return true;
            
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.EcoFinApp = new EcoFinApp();
    });
} else {
    window.EcoFinApp = new EcoFinApp();
}

// Export for global access
if (typeof window !== 'undefined') {
    window.EcoFinApp = window.EcoFinApp || EcoFinApp;
}