/**
 * Sistema de Gerenciamento de Transações Financeiras
 * Gerencia receitas e despesas com armazenamento local
 */

// Classe para gerenciar transações
class TransactionManager {
    constructor() {
        this.storageKey = 'ecofin_transactions';
        this.transactions = this.loadTransactions();
    }

    loadTransactions() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveTransactions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.transactions));
    }

    addTransaction(transaction) {
        const newTransaction = {
            id: Date.now().toString(),
            type: transaction.type, // 'income' ou 'expense'
            amount: parseFloat(transaction.amount),
            category: transaction.category,
            description: transaction.description,
            date: transaction.date,
            createdAt: new Date().toISOString()
        };
        
        this.transactions.push(newTransaction);
        this.saveTransactions();
        return newTransaction;
    }

    getTransactions() {
        return this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getTransactionsByType(type) {
        return this.transactions.filter(t => t.type === type);
    }

    getTransactionsByCategory(category) {
        return this.transactions.filter(t => t.category === category);
    }

    getTransactionsByDateRange(startDate, endDate) {
        return this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
    }

    removeTransaction(transactionId) {
        this.transactions = this.transactions.filter(t => t.id !== transactionId);
        this.saveTransactions();
    }

    updateTransaction(transactionId, updatedData) {
        const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
            this.transactions[transactionIndex] = { 
                ...this.transactions[transactionIndex], 
                ...updatedData,
                amount: parseFloat(updatedData.amount || this.transactions[transactionIndex].amount)
            };
            this.saveTransactions();
            return this.transactions[transactionIndex];
        }
        return null;
    }

    getTotalIncome() {
        return this.transactions
            .filter(t => t.type === 'income')
            .reduce((total, t) => total + t.amount, 0);
    }

    getTotalExpenses() {
        return this.transactions
            .filter(t => t.type === 'expense')
            .reduce((total, t) => total + t.amount, 0);
    }

    getBalance() {
        return this.getTotalIncome() - this.getTotalExpenses();
    }

    getMonthlyData(year, month) {
        const monthTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });

        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((total, t) => total + t.amount, 0);

        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((total, t) => total + t.amount, 0);

        return { income, expenses, balance: income - expenses, transactions: monthTransactions };
    }

    getCategoryTotals(type) {
        const categoryTotals = {};
        this.transactions
            .filter(t => t.type === type)
            .forEach(t => {
                if (!categoryTotals[t.category]) {
                    categoryTotals[t.category] = 0;
                }
                categoryTotals[t.category] += t.amount;
            });
        return categoryTotals;
    }

    clearAllTransactions() {
        this.transactions = [];
        this.saveTransactions();
    }
}

// Classe para gerenciar os modais de transações
class TransactionModal {
    constructor() {
        this.transactionManager = new TransactionManager();
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultDates();
        this.updateDashboard();
        this.loadRecentTransactions();
    }

    bindEvents() {
        // Botões para abrir modais
        const addIncomeBtn = document.getElementById('add-income-btn');
        const addExpenseBtn = document.getElementById('add-expense-btn');
        
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.openIncomeModal());
        }
        
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openExpenseModal());
        }

        // Botões para fechar modais
        const closeIncomeBtn = document.getElementById('close-income-modal');
        const closeExpenseBtn = document.getElementById('close-expense-modal');
        const cancelIncomeBtn = document.getElementById('cancel-income');
        const cancelExpenseBtn = document.getElementById('cancel-expense');
        
        if (closeIncomeBtn) closeIncomeBtn.addEventListener('click', () => this.closeIncomeModal());
        if (closeExpenseBtn) closeExpenseBtn.addEventListener('click', () => this.closeExpenseModal());
        if (cancelIncomeBtn) cancelIncomeBtn.addEventListener('click', () => this.closeIncomeModal());
        if (cancelExpenseBtn) cancelExpenseBtn.addEventListener('click', () => this.closeExpenseModal());

        // Formulários
        const incomeForm = document.getElementById('income-form');
        const expenseForm = document.getElementById('expense-form');
        
        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addIncome();
            });
        }
        
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addExpense();
            });
        }

        // Fechar modal clicando fora
        document.addEventListener('click', (e) => {
            if (e.target.id === 'income-modal') {
                this.closeIncomeModal();
            }
            if (e.target.id === 'expense-modal') {
                this.closeExpenseModal();
            }
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const incomeDateInput = document.getElementById('income-date');
        const expenseDateInput = document.getElementById('expense-date');
        
        if (incomeDateInput) incomeDateInput.value = today;
        if (expenseDateInput) expenseDateInput.value = today;
    }

    openIncomeModal() {
        const modal = document.getElementById('income-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Focar no primeiro campo
            const firstInput = modal.querySelector('input[type="number"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeIncomeModal() {
        const modal = document.getElementById('income-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.resetIncomeForm();
        }
    }

    openExpenseModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Focar no primeiro campo
            const firstInput = modal.querySelector('input[type="number"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeExpenseModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.resetExpenseForm();
        }
    }

    resetIncomeForm() {
        const form = document.getElementById('income-form');
        if (form) {
            form.reset();
            this.setDefaultDates();
        }
    }

    resetExpenseForm() {
        const form = document.getElementById('expense-form');
        if (form) {
            form.reset();
            this.setDefaultDates();
        }
    }

    addIncome() {
        const form = document.getElementById('income-form');
        if (form) {
            const formData = new FormData(form);
            const transaction = {
                type: 'income',
                amount: formData.get('amount'),
                category: formData.get('category'),
                description: formData.get('description'),
                date: formData.get('date')
            };

            // Validações
            if (!this.validateTransaction(transaction)) {
                return;
            }

            this.transactionManager.addTransaction(transaction);
            this.closeIncomeModal();
            this.updateDashboard();
            this.loadRecentTransactions();
            this.showSuccessMessage('Receita adicionada com sucesso!');
        }
    }

    addExpense() {
        const form = document.getElementById('expense-form');
        if (form) {
            const formData = new FormData(form);
            const transaction = {
                type: 'expense',
                amount: formData.get('amount'),
                category: formData.get('category'),
                description: formData.get('description'),
                date: formData.get('date')
            };

            // Validações
            if (!this.validateTransaction(transaction)) {
                return;
            }

            this.transactionManager.addTransaction(transaction);
            this.closeExpenseModal();
            this.updateDashboard();
            this.loadRecentTransactions();
            this.showSuccessMessage('Despesa adicionada com sucesso!');
        }
    }

    validateTransaction(transaction) {
        if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
            this.showErrorMessage('Valor deve ser maior que zero!');
            return false;
        }

        if (!transaction.category) {
            this.showErrorMessage('Categoria é obrigatória!');
            return false;
        }

        if (!transaction.description || transaction.description.trim() === '') {
            this.showErrorMessage('Descrição é obrigatória!');
            return false;
        }

        if (!transaction.date) {
            this.showErrorMessage('Data é obrigatória!');
            return false;
        }

        // Verificar se a data não é no futuro
        const transactionDate = new Date(transaction.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Fim do dia atual
        
        if (transactionDate > today) {
            this.showErrorMessage('Não é possível adicionar transações no futuro!');
            return false;
        }

        return true;
    }

    updateDashboard() {
        const balance = this.transactionManager.getBalance();
        const totalIncome = this.transactionManager.getTotalIncome();
        const totalExpenses = this.transactionManager.getTotalExpenses();

        // Atualizar elementos do dashboard
        const balanceElement = document.getElementById('current-balance');
        const incomeElement = document.getElementById('total-income');
        const expensesElement = document.getElementById('total-expenses');

        if (balanceElement) {
            balanceElement.textContent = this.formatCurrency(balance);
            // Adicionar classe de cor baseada no saldo
            balanceElement.className = balance >= 0 ? 'text-lg font-medium text-green-600' : 'text-lg font-medium text-red-600';
        }

        if (incomeElement) {
            incomeElement.textContent = this.formatCurrency(totalIncome);
        }

        if (expensesElement) {
            expensesElement.textContent = this.formatCurrency(totalExpenses);
        }
    }

    loadRecentTransactions() {
        const transactions = this.transactionManager.getTransactions().slice(0, 10); // Últimas 10 transações
        const container = document.getElementById('recent-transactions');
        
        if (container) {
            if (transactions.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma transação encontrada</p>';
            } else {
                container.innerHTML = transactions.map(transaction => this.createTransactionElement(transaction)).join('');
            }
        }
    }

    createTransactionElement(transaction) {
        const typeIcon = transaction.type === 'income' ? '↗' : '↙';
        const typeColor = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
        const categoryName = this.getCategoryName(transaction.category);
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border" data-transaction-id="${transaction.id}">
                <div class="flex items-center space-x-3">
                    <div class="${typeColor} font-bold text-lg">${typeIcon}</div>
                    <div>
                        <p class="font-medium text-gray-900">${transaction.description}</p>
                        <p class="text-sm text-gray-500">${categoryName} • ${this.formatDate(transaction.date)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="font-semibold ${typeColor}">${this.formatCurrency(transaction.amount)}</span>
                    <button onclick="transactionModal.removeTransaction('${transaction.id}')" 
                            class="text-red-500 hover:text-red-700 ml-2">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }

    removeTransaction(transactionId) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.transactionManager.removeTransaction(transactionId);
            this.updateDashboard();
            this.loadRecentTransactions();
            this.showSuccessMessage('Transação removida com sucesso!');
        }
    }

    getCategoryName(category) {
        const categories = {
            // Receitas
            'salario': 'Salário',
            'freelance': 'Freelance',
            'investimentos': 'Investimentos',
            'vendas': 'Vendas',
            'bonus': 'Bônus',
            // Despesas
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'moradia': 'Moradia',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'lazer': 'Lazer',
            'roupas': 'Roupas',
            'servicos': 'Serviços',
            'outros': 'Outros'
        };
        return categories[category] || category;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Inicializar quando o DOM estiver carregado
let transactionModal;
document.addEventListener('DOMContentLoaded', () => {
    transactionModal = new TransactionModal();
});

// Expor classes globalmente
window.TransactionManager = TransactionManager;
window.TransactionModal = TransactionModal;
