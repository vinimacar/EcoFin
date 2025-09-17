/**
 * Sistema de Gerenciamento de Transações Financeiras
 * Gerencia receitas e despesas com armazenamento local
 */

// Classe para gerenciar transações
class TransactionManager {
    constructor() {
        this.storageKey = 'ecofin_transactions';
        this.categoriesKey = 'ecofin_categories';
        this.transactions = this.loadTransactions();
        this.customCategories = this.loadCustomCategories();
    }

    loadTransactions() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveTransactions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.transactions));
    }

    loadCustomCategories() {
        const stored = localStorage.getItem(this.categoriesKey);
        return stored ? JSON.parse(stored) : {
            income: [],
            expense: []
        };
    }

    saveCustomCategories() {
        localStorage.setItem(this.categoriesKey, JSON.stringify(this.customCategories));
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

    // Métodos para gerenciar categorias personalizadas
    addCustomCategory(type, categoryKey, categoryName) {
        if (!['income', 'expense'].includes(type)) {
            throw new Error('Tipo deve ser "income" ou "expense"');
        }

        // Verificar se a categoria já existe
        const existingCategory = this.customCategories[type].find(cat => cat.key === categoryKey);
        if (existingCategory) {
            throw new Error('Categoria já existe');
        }

        this.customCategories[type].push({
            key: categoryKey,
            name: categoryName,
            createdAt: new Date().toISOString()
        });

        this.saveCustomCategories();
        return { key: categoryKey, name: categoryName };
    }

    removeCustomCategory(type, categoryKey) {
        if (!['income', 'expense'].includes(type)) {
            throw new Error('Tipo deve ser "income" ou "expense"');
        }

        this.customCategories[type] = this.customCategories[type].filter(cat => cat.key !== categoryKey);
        this.saveCustomCategories();
    }

    getCustomCategories(type) {
        if (type) {
            return this.customCategories[type] || [];
        }
        return this.customCategories;
    }

    getAllCategories(type) {
        const defaultCategories = this.getDefaultCategories(type);
        const customCategories = this.getCustomCategories(type);
        
        return {
            default: defaultCategories,
            custom: customCategories,
            all: [...defaultCategories, ...customCategories]
        };
    }

    getDefaultCategories(type) {
        const incomeCategories = [
            { key: 'salario', name: 'Salário' },
            { key: 'freelance', name: 'Freelance' },
            { key: 'investimentos', name: 'Investimentos' },
            { key: 'vendas', name: 'Vendas' },
            { key: 'bonus', name: 'Bônus' }
        ];

        const expenseCategories = [
            { key: 'alimentacao', name: 'Alimentação' },
            { key: 'transporte', name: 'Transporte' },
            { key: 'moradia', name: 'Moradia' },
            { key: 'saude', name: 'Saúde' },
            { key: 'educacao', name: 'Educação' },
            { key: 'lazer', name: 'Lazer' },
            { key: 'roupas', name: 'Roupas' },
            { key: 'servicos', name: 'Serviços' },
            { key: 'outros', name: 'Outros' }
        ];

        if (type === 'income') return incomeCategories;
        if (type === 'expense') return expenseCategories;
        return { income: incomeCategories, expense: expenseCategories };
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
        
        // Inicializar categorias nos selects
        this.updateCategorySelects();
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
        
        // Event listeners para gerenciamento de categorias
        const manageIncomeCategoriesBtn = document.getElementById('manage-income-categories');
        const manageExpenseCategoriesBtn = document.getElementById('manage-expense-categories');
        const closeCategoriesModal = document.getElementById('close-categories-modal');
        const closeCategoriesModalBtn = document.getElementById('close-categories-modal-btn');
        const incomeCategoriesTab = document.getElementById('income-categories-tab');
        const expenseCategoriesTab = document.getElementById('expense-categories-tab');
        const addIncomeCategoryBtn = document.getElementById('add-income-category');
        const addExpenseCategoryBtn = document.getElementById('add-expense-category');
        
        // Event listeners para adicionar categorias inline
        const addIncomeCategoryInlineBtn = document.getElementById('add-income-category-inline');
        const addExpenseCategoryInlineBtn = document.getElementById('add-expense-category-inline');
        const saveIncomeCategoryInlineBtn = document.getElementById('save-income-category-inline');
        const saveExpenseCategoryInlineBtn = document.getElementById('save-expense-category-inline');
        const cancelIncomeCategoryInlineBtn = document.getElementById('cancel-income-category-inline');
        const cancelExpenseCategoryInlineBtn = document.getElementById('cancel-expense-category-inline');
        
        if (closeIncomeBtn) closeIncomeBtn.addEventListener('click', () => this.closeIncomeModal());
        if (closeExpenseBtn) closeExpenseBtn.addEventListener('click', () => this.closeExpenseModal());
        if (cancelIncomeBtn) cancelIncomeBtn.addEventListener('click', () => this.closeIncomeModal());
        if (cancelExpenseBtn) cancelExpenseBtn.addEventListener('click', () => this.closeExpenseModal());
        
        // Event listeners para gerenciamento de categorias
        if (manageIncomeCategoriesBtn) manageIncomeCategoriesBtn.addEventListener('click', () => this.openCategoriesModal('income'));
        if (manageExpenseCategoriesBtn) manageExpenseCategoriesBtn.addEventListener('click', () => this.openCategoriesModal('expense'));
        if (closeCategoriesModal) closeCategoriesModal.addEventListener('click', () => this.closeCategoriesModal());
        if (closeCategoriesModalBtn) closeCategoriesModalBtn.addEventListener('click', () => this.closeCategoriesModal());
        if (incomeCategoriesTab) incomeCategoriesTab.addEventListener('click', () => this.switchCategoriesTab('income'));
        if (expenseCategoriesTab) expenseCategoriesTab.addEventListener('click', () => this.switchCategoriesTab('expense'));
        if (addIncomeCategoryBtn) addIncomeCategoryBtn.addEventListener('click', () => this.addNewCategory('income'));
        if (addExpenseCategoryBtn) addExpenseCategoryBtn.addEventListener('click', () => this.addNewCategory('expense'));
        
        // Event listeners para adicionar categorias inline
         if (addIncomeCategoryInlineBtn) addIncomeCategoryInlineBtn.addEventListener('click', () => this.showInlineCategoryForm('income'));
         if (addExpenseCategoryInlineBtn) addExpenseCategoryInlineBtn.addEventListener('click', () => this.showInlineCategoryForm('expense'));
         if (saveIncomeCategoryInlineBtn) saveIncomeCategoryInlineBtn.addEventListener('click', () => this.saveInlineCategory('income'));
         if (saveExpenseCategoryInlineBtn) saveExpenseCategoryInlineBtn.addEventListener('click', () => this.saveInlineCategory('expense'));
         if (cancelIncomeCategoryInlineBtn) cancelIncomeCategoryInlineBtn.addEventListener('click', () => this.hideInlineCategoryForm('income'));
         if (cancelExpenseCategoryInlineBtn) cancelExpenseCategoryInlineBtn.addEventListener('click', () => this.hideInlineCategoryForm('expense'));
         
         // Event listeners para tecla Enter nos campos inline
         const incomeKeyInput = document.getElementById('income-new-category-key');
         const incomeNameInput = document.getElementById('income-new-category-name');
         const expenseKeyInput = document.getElementById('expense-new-category-key');
         const expenseNameInput = document.getElementById('expense-new-category-name');
         
         if (incomeKeyInput) incomeKeyInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') this.saveInlineCategory('income');
         });
         if (incomeNameInput) incomeNameInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') this.saveInlineCategory('income');
         });
         if (expenseKeyInput) expenseKeyInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') this.saveInlineCategory('expense');
         });
         if (expenseNameInput) expenseNameInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') this.saveInlineCategory('expense');
         });

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
            if (e.target.id === 'categories-modal') {
                this.closeCategoriesModal();
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
        // Buscar nas categorias padrão
        const allDefaultCategories = this.getDefaultCategories();
        const allCategories = [...allDefaultCategories.income, ...allDefaultCategories.expense];
        
        const defaultCategory = allCategories.find(cat => cat.key === category);
        if (defaultCategory) {
            return defaultCategory.name;
        }
        
        // Buscar nas categorias personalizadas
        const allCustomCategories = [...this.customCategories.income, ...this.customCategories.expense];
        const customCategory = allCustomCategories.find(cat => cat.key === category);
        if (customCategory) {
            return customCategory.name;
        }
        
        // Retornar a categoria original se não encontrar
        return category;
    }

    // Métodos para gerenciar modal de categorias
    openCategoriesModal(activeTab = 'income') {
        const modal = document.getElementById('categories-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.switchCategoriesTab(activeTab);
            this.loadCategoriesInModal();
        }
    }

    closeCategoriesModal() {
        const modal = document.getElementById('categories-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    switchCategoriesTab(tabType) {
        const incomeTab = document.getElementById('income-categories-tab');
        const expenseTab = document.getElementById('expense-categories-tab');
        const incomeContent = document.getElementById('income-categories-content');
        const expenseContent = document.getElementById('expense-categories-content');

        if (tabType === 'income') {
            incomeTab.classList.add('border-green-500', 'text-green-600');
            incomeTab.classList.remove('border-transparent', 'text-gray-500');
            expenseTab.classList.add('border-transparent', 'text-gray-500');
            expenseTab.classList.remove('border-red-500', 'text-red-600');
            incomeContent.classList.remove('hidden');
            expenseContent.classList.add('hidden');
        } else {
            expenseTab.classList.add('border-red-500', 'text-red-600');
            expenseTab.classList.remove('border-transparent', 'text-gray-500');
            incomeTab.classList.add('border-transparent', 'text-gray-500');
            incomeTab.classList.remove('border-green-500', 'text-green-600');
            expenseContent.classList.remove('hidden');
            incomeContent.classList.add('hidden');
        }
    }

    loadCategoriesInModal() {
        this.loadCategoriesForType('income');
        this.loadCategoriesForType('expense');
        this.updateCategorySelects();
    }

    loadCategoriesForType(type) {
        const listContainer = document.getElementById(`${type}-categories-list`);
        if (!listContainer) return;

        const allCategories = this.getAllCategories(type);
        const defaultCategories = this.getDefaultCategories(type);
        
        listContainer.innerHTML = '';

        allCategories.forEach(category => {
            const isDefault = defaultCategories.some(def => def.key === category.key);
            const categoryElement = this.createCategoryElement(category, type, isDefault);
            listContainer.appendChild(categoryElement);
        });
    }

    createCategoryElement(category, type, isDefault) {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-gray-50 rounded border';
        
        const color = type === 'income' ? 'green' : 'red';
        
        div.innerHTML = `
            <div class="flex items-center">
                <span class="font-medium text-gray-900">${category.name}</span>
                <span class="ml-2 text-xs text-gray-500">(${category.key})</span>
                ${isDefault ? '<span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Padrão</span>' : ''}
            </div>
            ${!isDefault ? `<button onclick="transactionManager.removeCategoryFromModal('${type}', '${category.key}')" 
                class="text-${color}-600 hover:text-${color}-800 text-sm">
                <i class="fas fa-trash"></i>
            </button>` : ''}
        `;
        
        return div;
    }

    addNewCategory(type) {
        const keyInput = document.getElementById(`new-${type}-category-key`);
        const nameInput = document.getElementById(`new-${type}-category-name`);
        
        if (!keyInput || !nameInput) return;
        
        const key = keyInput.value.trim().toLowerCase();
        const name = nameInput.value.trim();
        
        if (!key || !name) {
            this.showErrorMessage('Por favor, preencha a chave e o nome da categoria.');
            return;
        }
        
        // Validar formato da chave (apenas letras, números e underscore)
        if (!/^[a-z0-9_]+$/.test(key)) {
            this.showErrorMessage('A chave deve conter apenas letras minúsculas, números e underscore.');
            return;
        }
        
        try {
            this.addCustomCategory(type, key, name);
            keyInput.value = '';
            nameInput.value = '';
            this.loadCategoriesForType(type);
            this.updateCategorySelects();
            this.showSuccessMessage(`Categoria "${name}" adicionada com sucesso!`);
        } catch (error) {
            this.showErrorMessage(error.message);
        }
    }

    removeCategoryFromModal(type, categoryKey) {
        if (confirm('Tem certeza que deseja remover esta categoria?')) {
            try {
                this.removeCustomCategory(type, categoryKey);
                this.loadCategoriesForType(type);
                this.updateCategorySelects();
                this.showSuccessMessage('Categoria removida com sucesso!');
            } catch (error) {
                this.showErrorMessage(error.message);
            }
        }
    }

    updateCategorySelects() {
        this.populateCategorySelect('income-category', 'income');
        this.populateCategorySelect('expense-category', 'expense');
    }

    populateCategorySelect(selectId, type) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        const categories = this.getAllCategories(type);
        
        // Limpar opções existentes (exceto a primeira)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Adicionar categorias
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.key;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        // Restaurar valor selecionado se ainda existir
        if (currentValue && categories.some(cat => cat.key === currentValue)) {
            select.value = currentValue;
        }
    }
    
    // Métodos para gerenciar formulários inline de categorias
    showInlineCategoryForm(type) {
        const formId = `${type}-new-category-form`;
        const form = document.getElementById(formId);
        if (form) {
            form.classList.remove('hidden');
            // Focar no primeiro campo
            const keyInput = document.getElementById(`${type}-new-category-key`);
            if (keyInput) keyInput.focus();
        }
    }
    
    hideInlineCategoryForm(type) {
        const formId = `${type}-new-category-form`;
        const form = document.getElementById(formId);
        if (form) {
            form.classList.add('hidden');
            // Limpar campos
            const keyInput = document.getElementById(`${type}-new-category-key`);
            const nameInput = document.getElementById(`${type}-new-category-name`);
            if (keyInput) keyInput.value = '';
            if (nameInput) nameInput.value = '';
        }
    }
    
    saveInlineCategory(type) {
         const keyInput = document.getElementById(`${type}-new-category-key`);
         const nameInput = document.getElementById(`${type}-new-category-name`);
         
         if (!keyInput || !nameInput) return;
         
         const key = keyInput.value.trim().toLowerCase();
         const name = nameInput.value.trim();
         
         if (!key || !name) {
             alert('Por favor, preencha tanto a chave quanto o nome da categoria.');
             return;
         }
         
         // Validar formato da chave (apenas letras, números e underscore)
         if (!/^[a-z0-9_]+$/.test(key)) {
             alert('A chave deve conter apenas letras minúsculas, números e underscore.');
             return;
         }
         
         // Verificar se a categoria já existe
         const defaultCategories = type === 'income' ? this.incomeCategories : this.expenseCategories;
         const customCategories = this.getCustomCategories(type);
         
         if (defaultCategories[key] || customCategories[key]) {
             alert('Esta categoria já existe. Escolha uma chave diferente.');
             return;
         }
         
         // Salvar categoria personalizada
         customCategories[key] = name;
         localStorage.setItem(`custom${type.charAt(0).toUpperCase() + type.slice(1)}Categories`, JSON.stringify(customCategories));
         
         // Atualizar selects
         this.updateCategorySelects();
         
         // Selecionar a nova categoria no select
         const selectId = `${type}-category`;
         const select = document.getElementById(selectId);
         if (select) {
             select.value = key;
         }
         
         // Esconder formulário
         this.hideInlineCategoryForm(type);
         
         // Mostrar notificação de sucesso
         if (this.notifications) {
             this.notifications.show(`Categoria "${name}" adicionada com sucesso!`, 'success');
         }
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

// Funções para gerenciar Dados Pessoais
function savePersonalData() {
    const form = document.getElementById('personal-data-form');
    const formData = new FormData(form);
    
    const personalData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        birthdate: formData.get('birthdate'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipcode: formData.get('zipcode'),
        profession: formData.get('profession'),
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('ecofin_personal_data', JSON.stringify(personalData));
    alert('Dados pessoais salvos com sucesso!');
    document.getElementById('personal-data-modal').classList.add('hidden');
}

function loadPersonalData() {
    const stored = localStorage.getItem('ecofin_personal_data');
    if (stored) {
        const data = JSON.parse(stored);
        document.getElementById('personal-name').value = data.name || '';
        document.getElementById('personal-email').value = data.email || '';
        document.getElementById('personal-phone').value = data.phone || '';
        document.getElementById('personal-birthdate').value = data.birthdate || '';
        document.getElementById('personal-address').value = data.address || '';
        document.getElementById('personal-city').value = data.city || '';
        document.getElementById('personal-state').value = data.state || '';
        document.getElementById('personal-zipcode').value = data.zipcode || '';
        document.getElementById('personal-profession').value = data.profession || '';
    }
}

// Funções para gerenciar Agenda
function saveAgendaEvent() {
    const form = document.getElementById('agenda-form');
    const formData = new FormData(form);
    
    const event = {
        id: Date.now().toString(),
        date: formData.get('date'),
        time: formData.get('time'),
        title: formData.get('title'),
        description: formData.get('description'),
        type: formData.get('type'),
        createdAt: new Date().toISOString()
    };
    
    const events = getAgendaEvents();
    events.push(event);
    localStorage.setItem('ecofin_agenda', JSON.stringify(events));
    
    alert('Evento adicionado com sucesso!');
    form.reset();
    loadAgendaEvents();
}

function getAgendaEvents() {
    const stored = localStorage.getItem('ecofin_agenda');
    return stored ? JSON.parse(stored) : [];
}

function loadAgendaEvents() {
    const events = getAgendaEvents();
    const eventsList = document.getElementById('agenda-events-list');
    
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                <p>Nenhum evento agendado</p>
            </div>
        `;
        return;
    }
    
    // Ordenar eventos por data e hora
    events.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });
    
    eventsList.innerHTML = events.map(event => `
        <div class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h5 class="font-medium text-gray-900">${event.title}</h5>
                    <p class="text-sm text-gray-600 mt-1">
                        <i class="fas fa-calendar mr-1"></i>${formatDate(event.date)}
                        <i class="fas fa-clock ml-3 mr-1"></i>${event.time}
                    </p>
                    ${event.description ? `<p class="text-sm text-gray-500 mt-1">${event.description}</p>` : ''}
                    <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-2">
                        ${getEventTypeLabel(event.type)}
                    </span>
                </div>
                <button onclick="removeAgendaEvent('${event.id}')" class="text-red-500 hover:text-red-700 ml-2">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function removeAgendaEvent(eventId) {
    if (confirm('Tem certeza que deseja remover este evento?')) {
        const events = getAgendaEvents().filter(event => event.id !== eventId);
        localStorage.setItem('ecofin_agenda', JSON.stringify(events));
        loadAgendaEvents();
    }
}

function getEventTypeLabel(type) {
    const types = {
        'reuniao': 'Reunião',
        'compromisso': 'Compromisso',
        'evento': 'Evento',
        'lembrete': 'Lembrete',
        'tarefa': 'Tarefa',
        'outro': 'Outro'
    };
    return types[type] || type;
}

// Funções para gerenciar Pagamentos
function savePayment() {
    const form = document.getElementById('payments-form');
    const formData = new FormData(form);
    
    const payment = {
        id: Date.now().toString(),
        amount: parseFloat(formData.get('amount')),
        dueDate: formData.get('dueDate'),
        description: formData.get('description'),
        category: formData.get('category'),
        status: formData.get('status'),
        notes: formData.get('notes'),
        createdAt: new Date().toISOString()
    };
    
    const payments = getPayments();
    payments.push(payment);
    localStorage.setItem('ecofin_payments', JSON.stringify(payments));
    
    alert('Pagamento adicionado com sucesso!');
    form.reset();
    loadPayments();
}

function getPayments() {
    const stored = localStorage.getItem('ecofin_payments');
    return stored ? JSON.parse(stored) : [];
}

function loadPayments() {
    const payments = getPayments();
    const paymentsList = document.getElementById('payments-list');
    
    if (payments.length === 0) {
        paymentsList.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-receipt text-3xl mb-2"></i>
                <p>Nenhum pagamento cadastrado</p>
            </div>
        `;
        return;
    }
    
    // Ordenar pagamentos por data de vencimento
    payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    paymentsList.innerHTML = payments.map(payment => `
        <div class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex justify-between items-center">
                        <h5 class="font-medium text-gray-900">${payment.description}</h5>
                        <span class="font-bold text-lg ${payment.status === 'pago' ? 'text-green-600' : 'text-red-600'}">
                            R$ ${payment.amount.toFixed(2)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">
                        <i class="fas fa-calendar mr-1"></i>Vencimento: ${formatDate(payment.dueDate)}
                        <i class="fas fa-tag ml-3 mr-1"></i>${getPaymentCategoryLabel(payment.category)}
                    </p>
                    ${payment.notes ? `<p class="text-sm text-gray-500 mt-1">${payment.notes}</p>` : ''}
                    <div class="flex justify-between items-center mt-2">
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${
                            payment.status === 'pago' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'atrasado' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }">
                            ${getPaymentStatusLabel(payment.status)}
                        </span>
                        <div class="flex space-x-2">
                            ${payment.status !== 'pago' ? `<button onclick="markAsPaid('${payment.id}')" class="text-green-500 hover:text-green-700 text-sm">
                                <i class="fas fa-check"></i> Marcar como Pago
                            </button>` : ''}
                            <button onclick="removePayment('${payment.id}')" class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function markAsPaid(paymentId) {
    const payments = getPayments();
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'pago';
        payment.paidAt = new Date().toISOString();
        localStorage.setItem('ecofin_payments', JSON.stringify(payments));
        loadPayments();
    }
}

function removePayment(paymentId) {
    if (confirm('Tem certeza que deseja remover este pagamento?')) {
        const payments = getPayments().filter(payment => payment.id !== paymentId);
        localStorage.setItem('ecofin_payments', JSON.stringify(payments));
        loadPayments();
    }
}

function filterPayments(status) {
    const payments = getPayments();
    let filteredPayments = payments;
    
    if (status !== 'all') {
        filteredPayments = payments.filter(payment => payment.status === status);
    }
    
    const paymentsList = document.getElementById('payments-list');
    
    if (filteredPayments.length === 0) {
        paymentsList.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-receipt text-3xl mb-2"></i>
                <p>Nenhum pagamento encontrado</p>
            </div>
        `;
        return;
    }
    
    // Ordenar pagamentos por data de vencimento
    filteredPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    paymentsList.innerHTML = filteredPayments.map(payment => `
        <div class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex justify-between items-center">
                        <h5 class="font-medium text-gray-900">${payment.description}</h5>
                        <span class="font-bold text-lg ${payment.status === 'pago' ? 'text-green-600' : 'text-red-600'}">
                            R$ ${payment.amount.toFixed(2)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">
                        <i class="fas fa-calendar mr-1"></i>Vencimento: ${formatDate(payment.dueDate)}
                        <i class="fas fa-tag ml-3 mr-1"></i>${getPaymentCategoryLabel(payment.category)}
                    </p>
                    ${payment.notes ? `<p class="text-sm text-gray-500 mt-1">${payment.notes}</p>` : ''}
                    <div class="flex justify-between items-center mt-2">
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${
                            payment.status === 'pago' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'atrasado' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }">
                            ${getPaymentStatusLabel(payment.status)}
                        </span>
                        <div class="flex space-x-2">
                            ${payment.status !== 'pago' ? `<button onclick="markAsPaid('${payment.id}')" class="text-green-500 hover:text-green-700 text-sm">
                                <i class="fas fa-check"></i> Marcar como Pago
                            </button>` : ''}
                            <button onclick="removePayment('${payment.id}')" class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getPaymentCategoryLabel(category) {
    const categories = {
        'moradia': 'Moradia',
        'alimentacao': 'Alimentação',
        'transporte': 'Transporte',
        'saude': 'Saúde',
        'educacao': 'Educação',
        'lazer': 'Lazer',
        'servicos': 'Serviços',
        'outros': 'Outros'
    };
    return categories[category] || category;
}

function getPaymentStatusLabel(status) {
    const statuses = {
        'pendente': 'Pendente',
        'pago': 'Pago',
        'atrasado': 'Atrasado',
        'cancelado': 'Cancelado'
    };
    return statuses[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Instância global
let transactionModal;
document.addEventListener('DOMContentLoaded', () => {
    transactionModal = new TransactionModal();
    
    // Event listeners para Dados Pessoais
    const personalDataModal = document.getElementById('personal-data-modal');
    const personalDataForm = document.getElementById('personal-data-form');
    const closePersonalDataModal = document.getElementById('close-personal-data-modal');
    const cancelPersonalData = document.getElementById('cancel-personal-data');
    
    if (closePersonalDataModal) {
        closePersonalDataModal.addEventListener('click', () => {
            personalDataModal.classList.add('hidden');
        });
    }
    
    if (cancelPersonalData) {
        cancelPersonalData.addEventListener('click', () => {
            personalDataModal.classList.add('hidden');
        });
    }
    
    if (personalDataForm) {
        personalDataForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePersonalData();
        });
    }
    
    // Event listeners para Agenda
    const agendaModal = document.getElementById('agenda-modal');
    const agendaForm = document.getElementById('agenda-form');
    const closeAgendaModal = document.getElementById('close-agenda-modal');
    const closeAgenda = document.getElementById('close-agenda');
    const clearAgendaForm = document.getElementById('clear-agenda-form');
    
    if (closeAgendaModal) {
        closeAgendaModal.addEventListener('click', () => {
            agendaModal.classList.add('hidden');
        });
    }
    
    if (closeAgenda) {
        closeAgenda.addEventListener('click', () => {
            agendaModal.classList.add('hidden');
        });
    }
    
    if (clearAgendaForm) {
        clearAgendaForm.addEventListener('click', () => {
            agendaForm.reset();
        });
    }
    
    if (agendaForm) {
        agendaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAgendaEvent();
        });
    }
    
    // Event listeners para Pagamentos
    const paymentsModal = document.getElementById('payments-modal');
    const paymentsForm = document.getElementById('payments-form');
    const closePaymentsModal = document.getElementById('close-payments-modal');
    const closePayments = document.getElementById('close-payments');
    const clearPaymentsForm = document.getElementById('clear-payments-form');
    
    if (closePaymentsModal) {
        closePaymentsModal.addEventListener('click', () => {
            paymentsModal.classList.add('hidden');
        });
    }
    
    if (closePayments) {
        closePayments.addEventListener('click', () => {
            paymentsModal.classList.add('hidden');
        });
    }
    
    if (clearPaymentsForm) {
        clearPaymentsForm.addEventListener('click', () => {
            paymentsForm.reset();
        });
    }
    
    if (paymentsForm) {
        paymentsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePayment();
        });
    }
    
    // Filtros de pagamentos
    const filterPending = document.getElementById('filter-pending');
    const filterPaid = document.getElementById('filter-paid');
    const filterAll = document.getElementById('filter-all');
    
    if (filterPending) {
        filterPending.addEventListener('click', () => filterPayments('pendente'));
    }
    
    if (filterPaid) {
        filterPaid.addEventListener('click', () => filterPayments('pago'));
    }
    
    if (filterAll) {
        filterAll.addEventListener('click', () => filterPayments('all'));
    }
    
    // Carregar dados ao inicializar
    loadPersonalData();
    loadAgendaEvents();
    loadPayments();
});

// Expor classes globalmente
window.TransactionManager = TransactionManager;
window.TransactionModal = TransactionModal;
