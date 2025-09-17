/**
 * EcoFin - Demo Data
 * Dados de demonstração para o modo offline
 */

class DemoData {
    static getTransactions() {
        return [
            {
                id: 'demo-1',
                type: 'income',
                amount: 5000,
                category: 'Salário',
                description: 'Salário mensal',
                date: new Date(2024, 0, 1),
                userId: 'demo-user'
            },
            {
                id: 'demo-2',
                type: 'expense',
                amount: 800,
                category: 'Alimentação',
                description: 'Supermercado',
                date: new Date(2024, 0, 5),
                userId: 'demo-user'
            },
            {
                id: 'demo-3',
                type: 'expense',
                amount: 1200,
                category: 'Moradia',
                description: 'Aluguel',
                date: new Date(2024, 0, 10),
                userId: 'demo-user'
            },
            {
                id: 'demo-4',
                type: 'income',
                amount: 1500,
                category: 'Freelance',
                description: 'Projeto web',
                date: new Date(2024, 0, 15),
                userId: 'demo-user'
            },
            {
                id: 'demo-5',
                type: 'expense',
                amount: 300,
                category: 'Transporte',
                description: 'Combustível',
                date: new Date(2024, 0, 20),
                userId: 'demo-user'
            }
        ];
    }

    static getUser() {
        return {
            uid: 'demo-user',
            email: 'demo@ecofin.com',
            displayName: 'Usuário Demo',
            photoURL: 'images/user-avatar.svg'
        };
    }

    static getCurrencyRates() {
        return {
            USD: { rate: 5.20, change: 0.02 },
            EUR: { rate: 5.65, change: -0.01 },
            BTC: { rate: 250000, change: 0.05 },
            ETH: { rate: 12000, change: 0.03 }
        };
    }

    static getBudgets() {
        return {
            'Alimentação': { limit: 1000, spent: 800 },
            'Transporte': { limit: 500, spent: 300 },
            'Lazer': { limit: 400, spent: 150 },
            'Moradia': { limit: 1500, spent: 1200 }
        };
    }

    static getFinancialTips() {
        return [
            'Mantenha uma reserva de emergência equivalente a 6 meses de gastos.',
            'Invista pelo menos 10% da sua renda mensal.',
            'Revise seus gastos mensalmente para identificar oportunidades de economia.',
            'Diversifique seus investimentos para reduzir riscos.',
            'Quite primeiro as dívidas com juros mais altos.'
        ];
    }
}

// Tornar disponível globalmente
window.DemoData = DemoData;