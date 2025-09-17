/**
 * EcoFin - Aplicação Simplificada
 * Versão demo funcional sem Firebase
 */

// Dados demo
const demoData = {
    user: {
        uid: 'demo-user',
        email: 'demo@ecofin.com',
        displayName: 'Usuário Demo'
    },
    transactions: [
        {
            id: 'demo-1',
            type: 'income',
            amount: 5000,
            category: 'Salário',
            description: 'Salário mensal',
            date: '2024-01-01'
        },
        {
            id: 'demo-2',
            type: 'expense',
            amount: 800,
            category: 'Alimentação',
            description: 'Supermercado',
            date: '2024-01-05'
        },
        {
            id: 'demo-3',
            type: 'expense',
            amount: 1200,
            category: 'Moradia',
            description: 'Aluguel',
            date: '2024-01-10'
        }
    ]
};

// Gerenciador de transações simplificado
class SimpleTransactionManager {
    constructor() {
        this.transactions = [...demoData.transactions];
        this.listeners = [];
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
    
    getFinancialSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            balance: income - expenses,
            income,
            expenses
        };
    }
    
    addTransaction(transaction) {
        const newTransaction = {
            ...transaction,
            id: 'demo-' + Date.now(),
            date: transaction.date || new Date().toISOString().split('T')[0]
        };
        
        this.transactions.unshift(newTransaction);
        this.notifyListeners();
        
        // Simular toast notification
        console.log('Transação adicionada:', newTransaction.description);
    }
}

// Aplicação principal
class SimpleApp {
    constructor() {
        this.transactionManager = new SimpleTransactionManager();
        this.init();
    }
    
    init() {
        this.transactionManager.addListener(() => this.updateDashboard());
        this.updateDashboard();
        this.bindEvents();
    }
    
    updateDashboard() {
        const summary = this.transactionManager.getFinancialSummary();
        
        // Atualizar cards do dashboard
        const balanceEl = document.getElementById('current-balance');
        const incomeEl = document.getElementById('total-income');
        const expensesEl = document.getElementById('total-expenses');
        
        if (balanceEl) balanceEl.textContent = this.formatCurrency(summary.balance);
        if (incomeEl) incomeEl.textContent = this.formatCurrency(summary.income);
        if (expensesEl) expensesEl.textContent = this.formatCurrency(summary.expenses);
        
        this.updateRecentTransactions();
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    }
    
    updateRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        if (!container) return;
        
        const recentTransactions = this.transactionManager.transactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-receipt text-4xl mb-4"></i>
                    <p>Nenhuma transação encontrada</p>
                    <p class="text-sm">Adicione sua primeira receita ou despesa</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <i class="fas ${transaction.type === 'income' ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'}"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${transaction.description}</p>
                        <p class="text-sm text-gray-500">${transaction.category} • ${this.formatDate(transaction.date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </p>
                </div>
            </div>
        `).join('');
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    bindEvents() {
        // Botões de adicionar transação
        const addIncomeBtn = document.getElementById('add-income-btn');
        const addExpenseBtn = document.getElementById('add-expense-btn');
        
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => {
                this.showAddTransactionDemo('income');
            });
        }
        
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                this.showAddTransactionDemo('expense');
            });
        }
    }
    
    showAddTransactionDemo(type) {
        // Simular adição de transação demo
        const demoTransaction = {
            type: type,
            amount: Math.floor(Math.random() * 1000) + 100,
            category: type === 'income' ? 'Freelance' : 'Compras',
            description: type === 'income' ? 'Trabalho freelance' : 'Compras diversas'
        };
        
        this.transactionManager.addTransaction(demoTransaction);
        
        // Simular notificação
        console.log(`${type === 'income' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
    }
    
    showWelcomeMessage() {
        console.log('Bem-vindo ao EcoFin! Aplicação carregada em modo demo.');
    }
}

// Inicializar aplicação
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.simpleApp = new SimpleApp();
    });
} else {
    window.simpleApp = new SimpleApp();
}

console.log('SimpleApp carregado com sucesso');