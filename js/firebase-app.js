/**
 * EcoFin - Aplicação com Firebase
 * Versão completa com autenticação e banco de dados
 */

// Importar configuração do Firebase
// Este arquivo assume que o Firebase SDK foi carregado via CDN

class FirebaseApp {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.transactionManager = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Inicializar Firebase
            if (typeof firebase !== 'undefined' && firebaseConfig) {
                firebase.initializeApp(firebaseConfig);
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                
                // Configurar listener de autenticação
                this.auth.onAuthStateChanged((user) => {
                    this.handleAuthStateChange(user);
                });
                
                console.log('✅ Firebase inicializado com sucesso');
                this.isInitialized = true;
            } else {
                console.warn('⚠️ Firebase não disponível, usando modo demo');
                this.fallbackToDemo();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
            this.fallbackToDemo();
        }
    }
    
    fallbackToDemo() {
        // Usar a aplicação demo como fallback
        if (typeof SimpleApp !== 'undefined') {
            this.demoApp = new SimpleApp();
            console.log('🔄 Executando em modo demo');
        }
    }
    
    handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            this.initializeUserData();
            this.showDashboard();
            if (typeof Utils !== 'undefined') {
                Utils.showToast(`Bem-vindo, ${user.displayName || user.email}!`, 'success');
            }
        } else {
            this.currentUser = null;
            this.showLoginForm();
        }
    }
    
    async initializeUserData() {
        if (!this.currentUser) return;
        
        try {
            // Inicializar gerenciador de transações com Firebase
            this.transactionManager = new FirebaseTransactionManager(this.db, this.currentUser.uid);
            await this.transactionManager.initialize();
            
            // Atualizar dashboard
            this.updateDashboard();
            
        } catch (error) {
            console.error('Erro ao inicializar dados do usuário:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Erro ao carregar dados do usuário', 'error');
            }
        }
    }
    
    // Métodos de autenticação
    async signInWithEmail(email, password) {
        try {
            await this.auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Erro no login:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Erro no login: ' + error.message, 'error');
            }
        }
    }
    
    async signUpWithEmail(email, password, displayName) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Atualizar perfil do usuário
            if (displayName) {
                await result.user.updateProfile({ displayName });
            }
            
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Conta criada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Erro no cadastro: ' + error.message, 'error');
            }
        }
    }
    
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await this.auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Erro no login com Google:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Erro no login com Google: ' + error.message, 'error');
            }
        }
    }
    
    async signOut() {
        try {
            await this.auth.signOut();
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Logout realizado com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro no logout:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Erro no logout: ' + error.message, 'error');
            }
        }
    }
    
    // Interface do usuário
    showLoginForm() {
        const loginHtml = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div>
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Entre na sua conta EcoFin
                        </h2>
                    </div>
                    <form class="mt-8 space-y-6" id="login-form">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input id="email" name="email" type="email" required 
                                       class="relative block w-full px-3 py-2 border border-gray-300 rounded-t-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                                       placeholder="Email">
                            </div>
                            <div>
                                <input id="password" name="password" type="password" required 
                                       class="relative block w-full px-3 py-2 border border-gray-300 rounded-b-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                                       placeholder="Senha">
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <button type="submit" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Entrar
                            </button>
                            
                            <button type="button" id="google-signin" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <i class="fab fa-google mr-2"></i>
                                Entrar com Google
                            </button>
                            
                            <button type="button" id="demo-mode" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Modo Demo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.innerHTML = loginHtml;
        this.bindLoginEvents();
    }
    
    bindLoginEvents() {
        const loginForm = document.getElementById('login-form');
        const googleSignin = document.getElementById('google-signin');
        const demoMode = document.getElementById('demo-mode');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                this.signInWithEmail(email, password);
            });
        }
        
        if (googleSignin) {
            googleSignin.addEventListener('click', () => {
                this.signInWithGoogle();
            });
        }
        
        if (demoMode) {
            demoMode.addEventListener('click', () => {
                this.fallbackToDemo();
                this.showDashboard();
            });
        }
    }
    
    showDashboard() {
        // Restaurar o HTML original do dashboard
        window.location.reload();
    }
    
    updateDashboard() {
        if (this.transactionManager) {
            const summary = this.transactionManager.getFinancialSummary();
            
            // Atualizar elementos do dashboard
            const balanceElement = document.getElementById('current-balance');
            const incomeElement = document.getElementById('total-income');
            const expensesElement = document.getElementById('total-expenses');
            
            if (balanceElement && Utils) {
                balanceElement.textContent = Utils.formatCurrency(summary.balance);
            }
            
            if (incomeElement && Utils) {
                incomeElement.textContent = Utils.formatCurrency(summary.income);
            }
            
            if (expensesElement && Utils) {
                expensesElement.textContent = Utils.formatCurrency(summary.expenses);
            }
        }
    }
}

// Gerenciador de transações com Firebase
class FirebaseTransactionManager {
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
        this.transactions = [];
        this.listeners = [];
    }
    
    async initialize() {
        try {
            // Carregar transações do usuário
            const snapshot = await this.db
                .collection('transactions')
                .where('userId', '==', this.userId)
                .orderBy('date', 'desc')
                .get();
                
            this.transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`Carregadas ${this.transactions.length} transações`);
            this.notifyListeners();
            
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
        }
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.transactions));
    }
    
    getFinancialSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return {
            income,
            expenses,
            balance: income - expenses
        };
    }
    
    async addTransaction(transaction) {
        try {
            const newTransaction = {
                ...transaction,
                userId: this.userId,
                date: new Date().toISOString(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.db.collection('transactions').add(newTransaction);
            
            // Adicionar à lista local
            this.transactions.unshift({
                id: docRef.id,
                ...newTransaction
            });
            
            this.notifyListeners();
            
            if (Utils) {
                Utils.showToast('Transação adicionada com sucesso!', 'success');
            }
            
        } catch (error) {
            console.error('Erro ao adicionar transação:', error);
            if (Utils) {
                Utils.showToast('Erro ao adicionar transação', 'error');
            }
        }
    }
}

// Inicializar aplicação
let firebaseApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        firebaseApp = new FirebaseApp();
        window.firebaseApp = firebaseApp;
    });
} else {
    firebaseApp = new FirebaseApp();
    window.firebaseApp = firebaseApp;
}

console.log('Firebase App carregado');