// Chart Manager
class ChartManager {
    constructor() {
        this.charts = {};
        this.currentUser = null;
        this.transactions = [];
        this.init();
    }

    init() {
        // Listen for auth state changes
        if (window.AuthManager) {
            AuthManager.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.initializeCharts();
                }
            });
        }
        
        // Listen for transaction changes - with safety check
        if (window.TransactionManager && typeof window.TransactionManager.addListener === 'function') {
            window.TransactionManager.addListener((transactions) => {
                this.transactions = transactions;
                this.updateCharts(transactions);
            });
        } else {
            // Retry after a delay if TransactionManager is not ready
            setTimeout(() => {
                if (window.TransactionManager && typeof window.TransactionManager.addListener === 'function') {
                    window.TransactionManager.addListener((transactions) => {
                        this.transactions = transactions;
                        this.updateCharts(transactions);
                    });
                }
            }, 200);
        }
    }

    initializeCharts() {
        // Initialize main chart
        this.createMainChart();
        
        // Initialize category chart (if container exists)
        this.createCategoryChart();
        
        // Initialize trend chart (if container exists)
        this.createTrendChart();
    }

    createMainChart() {
        const canvas = document.getElementById('main-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.main) {
            this.charts.main.destroy();
        }
        
        this.charts.main = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [],
                        borderColor: APP_CONFIG.colors.success,
                        backgroundColor: APP_CONFIG.colors.success + '20',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Despesas',
                        data: [],
                        borderColor: APP_CONFIG.colors.danger,
                        backgroundColor: APP_CONFIG.colors.danger + '20',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Receitas vs Despesas - Últimos 30 dias',
                        color: this.getTextColor()
                    },
                    legend: {
                        labels: {
                            color: this.getTextColor()
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: this.getTextColor()
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    y: {
                        ticks: {
                            color: this.getTextColor(),
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    createCategoryChart() {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ef4444', '#f97316', '#eab308', '#22c55e',
                        '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
                        '#f59e0b', '#10b981'
                    ],
                    borderWidth: 2,
                    borderColor: this.getBorderColor()
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Gastos por Categoria',
                        color: this.getTextColor()
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.getTextColor(),
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = Utils.formatCurrency(context.parsed);
                                const percentage = Math.round((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }
        
        this.charts.trend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Saldo Mensal',
                        data: [],
                        backgroundColor: function(context) {
                            const value = context.parsed.y;
                            return value >= 0 ? APP_CONFIG.colors.success + '80' : APP_CONFIG.colors.danger + '80';
                        },
                        borderColor: function(context) {
                            const value = context.parsed.y;
                            return value >= 0 ? APP_CONFIG.colors.success : APP_CONFIG.colors.danger;
                        },
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Tendência de Saldo - Últimos 6 meses',
                        color: this.getTextColor()
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Saldo: ' + Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: this.getTextColor()
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    y: {
                        ticks: {
                            color: this.getTextColor(),
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    }
                }
            }
        });
    }

    updateCharts(transactions) {
        if (!transactions || transactions.length === 0) {
            this.clearCharts();
            return;
        }
        
        // Update main chart with daily data
        this.updateMainChart(transactions);
        
        // Update category chart
        this.updateCategoryChart(transactions);
        
        // Update trend chart
        this.updateTrendChart(transactions);
    }

    updateMainChart(transactions) {
        if (!this.charts.main) return;
        
        // Get last 30 days of data
        const last30Days = this.getLast30DaysData(transactions);
        
        const labels = last30Days.map(day => {
            return new Date(day.date).toLocaleDateString('pt-BR', { 
                month: 'short', 
                day: 'numeric' 
            });
        });
        
        const incomeData = last30Days.map(day => day.income);
        const expenseData = last30Days.map(day => Math.abs(day.expenses));
        
        this.charts.main.data.labels = labels;
        this.charts.main.data.datasets[0].data = incomeData;
        this.charts.main.data.datasets[1].data = expenseData;
        
        this.charts.main.update('none');
    }

    updateCategoryChart(transactions) {
        if (!this.charts.category) return;
        
        // Get current month expenses by category
        const currentMonth = new Date();
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth.getMonth() &&
                   transactionDate.getFullYear() === currentMonth.getFullYear() &&
                   t.amount < 0; // Only expenses
        });
        
        const categoryTotals = {};
        monthTransactions.forEach(transaction => {
            const category = transaction.category;
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += Math.abs(transaction.amount);
        });
        
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 categories
        
        const labels = sortedCategories.map(([categoryId]) => {
            const categoryInfo = this.getCategoryInfo(categoryId, 'expense');
            return categoryInfo.name;
        });
        
        const data = sortedCategories.map(([,amount]) => amount);
        
        this.charts.category.data.labels = labels;
        this.charts.category.data.datasets[0].data = data;
        
        this.charts.category.update('none');
    }

    updateTrendChart(transactions) {
        if (!this.charts.trend) return;
        
        // Get last 6 months of data
        const monthlyData = this.getMonthlyTrendData(transactions);
        
        const labels = monthlyData.map(month => {
            return new Date(month.year, month.month).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'short'
            });
        });
        
        const balanceData = monthlyData.map(month => month.balance);
        
        this.charts.trend.data.labels = labels;
        this.charts.trend.data.datasets[0].data = balanceData;
        
        this.charts.trend.update('none');
    }

    getLast30DaysData(transactions) {
        const days = [];
        const today = new Date();
        
        // Create array of last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dayTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.toDateString() === date.toDateString();
            });
            
            const income = dayTransactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = dayTransactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + t.amount, 0);
            
            days.push({
                date: date.toISOString().split('T')[0],
                income,
                expenses
            });
        }
        
        return days;
    }

    getMonthlyTrendData(transactions) {
        const months = [];
        const today = new Date();
        
        // Create array of last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const monthTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getFullYear() === year &&
                       transactionDate.getMonth() === month;
            });
            
            const income = monthTransactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = Math.abs(monthTransactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + t.amount, 0));
            
            months.push({
                year,
                month,
                income,
                expenses,
                balance: income - expenses
            });
        }
        
        return months;
    }

    getCategoryInfo(categoryId, type) {
        const categories = APP_CONFIG.categories[type] || [];
        const category = categories.find(cat => cat.id === categoryId);
        
        return category || {
            name: 'Outros',
            icon: type === 'income' ? 'fas fa-plus-circle' : 'fas fa-minus-circle'
        };
    }

    clearCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.data) {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update('none');
            }
        });
    }

    // Theme-aware color helpers
    getTextColor() {
        return document.documentElement.classList.contains('dark') ? '#f9fafb' : '#1f2937';
    }

    getGridColor() {
        return document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb';
    }

    getBorderColor() {
        return document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff';
    }

    // Update chart colors when theme changes
    updateChartColors() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.options) {
                // Update text colors
                if (chart.options.plugins?.title) {
                    chart.options.plugins.title.color = this.getTextColor();
                }
                
                if (chart.options.plugins?.legend?.labels) {
                    chart.options.plugins.legend.labels.color = this.getTextColor();
                }
                
                // Update scale colors
                if (chart.options.scales) {
                    Object.values(chart.options.scales).forEach(scale => {
                        if (scale.ticks) {
                            scale.ticks.color = this.getTextColor();
                        }
                        if (scale.grid) {
                            scale.grid.color = this.getGridColor();
                        }
                    });
                }
                
                // Update border colors for doughnut charts
                if (chart.config.type === 'doughnut') {
                    chart.data.datasets.forEach(dataset => {
                        dataset.borderColor = this.getBorderColor();
                    });
                }
                
                chart.update('none');
            }
        });
    }

    // Export chart as image
    exportChart(chartName, format = 'png') {
        const chart = this.charts[chartName];
        if (!chart) {
            ErrorHandler.showError('Gráfico não encontrado');
            return;
        }
        
        try {
            const canvas = chart.canvas;
            const url = canvas.toDataURL(`image/${format}`);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ecofin-${chartName}-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            if (window.NotificationManager) {
                NotificationManager.show('Gráfico exportado com sucesso!', 'success');
            }
            
        } catch (error) {
            ErrorHandler.handle(error, 'Export Chart');
        }
    }

    // Resize charts when window resizes
    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    // Destroy all charts
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize Chart Manager
const chartManager = new ChartManager();

// Listen for theme changes to update chart colors
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            setTimeout(() => chartManager.updateChartColors(), 100);
        }
    });
    
    // Listen for window resize
    window.addEventListener('resize', Utils.debounce(() => {
        chartManager.handleResize();
    }, 250));
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ChartManager = chartManager;
}