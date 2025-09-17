/**
 * EcoFin - Transaction Manager
 * Gerenciamento de transações financeiras
 */

class TransactionManager {
    constructor() {
        this.transactions = [];
        this.listeners = [];
        this.isDemo = !window.db; // Modo demo se não há Firebase
        this.init();
    }

    init() {
        if (this.isDemo) {
            // Carregar dados demo
            this.transactions = window.DemoData ? window.DemoData.getTransactions() : [];
            console.log('TransactionManager: Modo demo ativado');
        }
    }

    // Adicionar listener para mudanças
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    // Remover listener
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // Notificar listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.transactions);
            } catch (error) {
                console.error('Erro ao notificar listener:', error);
            }
        });
    }

    // Adicionar transação
    async addTransaction(transaction) {
        try {
            const newTransaction = {
                id: this.generateId(),
                ...transaction,
                date: new Date(transaction.date),
                userId: this.getCurrentUserId()
            };

            if (this.isDemo) {
                this.transactions.push(newTransaction);
                this.saveToLocalStorage();
            } else {
                // Implementação Firebase aqui quando disponível
                console.log('Firebase não disponível, usando modo demo');
                this.transactions.push(newTransaction);
            }

            this.notifyListeners();
            return newTransaction;
        } catch (error) {
            console.error('Erro ao adicionar transação:', error);
            throw error;
        }
    }

    // Obter todas as transações
    async getTransactions(userId = null) {
        try {
            if (this.isDemo) {
                return this.transactions.filter(t => 
                    !userId || t.userId === userId
                );
            } else {
                // Implementação Firebase aqui quando disponível
                return this.transactions;
            }
        } catch (error) {
            console.error('Erro ao obter transações:', error);
            return [];
        }
    }

    // Atualizar transação
    async updateTransaction(id, updates) {
        try {
            const index = this.transactions.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Transação não encontrada');
            }

            this.transactions[index] = {
                ...this.transactions[index],
                ...updates,
                updatedAt: new Date()
            };

            if (this.isDemo) {
                this.saveToLocalStorage();
            }

            this.notifyListeners();
            return this.transactions[index];
        } catch (error) {
            console.error('Erro ao atualizar transação:', error);
            throw error;
        }
    }

    // Deletar transação
    async deleteTransaction(id) {
        try {
            const index = this.transactions.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error('Transação não encontrada');
            }

            this.transactions.splice(index, 1);

            if (this.isDemo) {
                this.saveToLocalStorage();
            }

            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Erro ao deletar transação:', error);
            throw error;
        }
    }

    // Obter resumo financeiro
    getFinancialSummary(userId = null) {
        const userTransactions = this.transactions.filter(t => 
            !userId || t.userId === userId
        );

        const income = userTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = userTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expenses,
            balance: income - expenses,
            totalTransactions: userTransactions.length
        };
    }

    // Obter transações por categoria
    getTransactionsByCategory(userId = null) {
        const userTransactions = this.transactions.filter(t => 
            !userId || t.userId === userId
        );

        const categories = {};
        userTransactions.forEach(transaction => {
            const category = transaction.category || 'Outros';
            if (!categories[category]) {
                categories[category] = {
                    income: 0,
                    expense: 0,
                    total: 0
                };
            }
            categories[category][transaction.type] += transaction.amount;
            categories[category].total += transaction.type === 'income' ? 
                transaction.amount : -transaction.amount;
        });

        return categories;
    }

    // Gerar ID único
    generateId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Obter ID do usuário atual
    getCurrentUserId() {
        if (window.AuthManager && window.AuthManager.currentUser) {
            return window.AuthManager.currentUser.uid;
        }
        return 'demo-user';
    }

    // Salvar no localStorage (modo demo)
    saveToLocalStorage() {
        try {
            localStorage.setItem('ecofin_transactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    // Carregar do localStorage (modo demo)
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('ecofin_transactions');
            if (saved) {
                this.transactions = JSON.parse(saved).map(t => ({
                    ...t,
                    date: new Date(t.date)
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
        }
    }
}

// Criar instância global
window.TransactionManager = new TransactionManager();

console.log('TransactionManager carregado com sucesso');