// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgU7J-2M2bfa_dFsQ6Ps8DAYOM-ify8Hg",
  authDomain: "ecofin-c974e.firebaseapp.com",
  projectId: "ecofin-c974e",
  storageBucket: "ecofin-c974e.firebasestorage.app",
  messagingSenderId: "378572542594",
  appId: "1:378572542594:web:56d60845dc92b76ad79a9b",
  measurementId: "G-R13KTT1YF2"
};

// Initialize Firebase
try {
    // Verificar se Firebase está disponível
    if (typeof firebase !== 'undefined') {
        // Se estiver em modo demo, não inicializar Firebase real
        if (firebaseConfig.demoMode) {
            console.log('🔧 Running in DEMO mode - Firebase disabled');
            console.log('📝 To enable Firebase: Update firebaseConfig in js/config.js with your real Firebase credentials');
        } else {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        }
    } else {
        console.log('⚠️ Firebase SDK not loaded - running in offline mode');
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.log('🔧 Running in DEMO mode due to Firebase error');
}

// Firebase services - only initialize if Firebase is available and not in demo mode
let auth, db, storage;

if (typeof firebase !== 'undefined' && !firebaseConfig.demoMode) {
    try {
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
    } catch (error) {
        console.warn('Firebase services not available:', error.message);
    }
}

// App Configuration
const APP_CONFIG = {
    name: 'EcoFin',
    version: '1.0.0',
    currency: 'BRL',
    locale: 'pt-BR',
    
    // API Endpoints
    apis: {
        exchangeRate: 'https://api.exchangerate-api.com/v4/latest/BRL',
        openai: 'https://api.openai.com/v1/chat/completions' // Configure com sua chave
    },
    
    // Categories for transactions
    categories: {
        income: [
            { id: 'salary', name: 'Salário', icon: 'fas fa-briefcase' },
            { id: 'freelance', name: 'Freelance', icon: 'fas fa-laptop' },
            { id: 'investment', name: 'Investimentos', icon: 'fas fa-chart-line' },
            { id: 'bonus', name: 'Bônus', icon: 'fas fa-gift' },
            { id: 'other-income', name: 'Outros', icon: 'fas fa-plus-circle' }
        ],
        expense: [
            { id: 'food', name: 'Alimentação', icon: 'fas fa-utensils' },
            { id: 'transport', name: 'Transporte', icon: 'fas fa-car' },
            { id: 'entertainment', name: 'Entretenimento', icon: 'fas fa-film' },
            { id: 'health', name: 'Saúde', icon: 'fas fa-heartbeat' },
            { id: 'education', name: 'Educação', icon: 'fas fa-graduation-cap' },
            { id: 'shopping', name: 'Compras', icon: 'fas fa-shopping-bag' },
            { id: 'bills', name: 'Contas', icon: 'fas fa-file-invoice' },
            { id: 'rent', name: 'Aluguel', icon: 'fas fa-home' },
            { id: 'other-expense', name: 'Outros', icon: 'fas fa-minus-circle' }
        ]
    },
    
    // Notification settings
    notifications: {
        budgetWarning: 0.8, // 80% of budget
        budgetDanger: 0.95,  // 95% of budget
        reminderInterval: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    },
    
    // Chart colors
    colors: {
        primary: '#10b981',
        success: '#059669',
        danger: '#dc2626',
        warning: '#d97706',
        info: '#2563eb',
        light: '#f3f4f6',
        dark: '#1f2937'
    }
};

// Utils will be loaded from utils.js

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = Utils.storage.get('theme', 'light');
        this.setTheme(savedTheme);
        this.bindEvents();
    },
    
    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.classList.remove('dark');
        }
        Utils.storage.set('theme', theme);
    },
    
    toggleTheme() {
        const currentTheme = Utils.storage.get('theme', 'light');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },
    
    bindEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
};

// Error Handler
const ErrorHandler = {
    handle(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = 'Ocorreu um erro inesperado.';
        
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    message = 'Senha incorreta.';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Este email já está em uso.';
                    break;
                case 'auth/weak-password':
                    message = 'A senha deve ter pelo menos 6 caracteres.';
                    break;
                case 'auth/invalid-email':
                    message = 'Email inválido.';
                    break;
                case 'permission-denied':
                    message = 'Você não tem permissão para esta ação.';
                    break;
                case 'unavailable':
                    message = 'Serviço temporariamente indisponível.';
                    break;
                default:
                    message = error.message || message;
            }
        }
        
        this.showError(message);
    },
    
    showError(message) {
        // Show error notification
        if (window.NotificationManager) {
            NotificationManager.show(message, 'error');
        } else {
            alert(message);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG, Utils, ThemeManager, ErrorHandler };
}