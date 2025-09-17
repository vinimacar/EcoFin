// Currency Manager
class CurrencyManager {
    constructor() {
        this.rates = {};
        this.baseCurrency = 'BRL';
        this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'BRL', 'BTC'];
        this.lastUpdate = null;
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.apiEndpoints = {
            primary: 'https://api.exchangerate-api.com/v4/latest/',
            fallback: 'https://api.fixer.io/latest',
            crypto: 'https://api.coingecko.com/api/v3/simple/price'
        };
        this.init();
    }

    init() {
        // Load cached rates
        this.loadCachedRates();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Initial fetch
        this.fetchRates();
        
        // Create currency widget
        this.createCurrencyWidget();
    }

    async fetchRates() {
        try {
            Utils.showLoading('Atualizando cotações...');
            
            // Fetch traditional currencies
            const traditionalRates = await this.fetchTraditionalRates();
            
            // Fetch crypto rates
            const cryptoRates = await this.fetchCryptoRates();
            
            // Combine rates
            this.rates = {
                ...traditionalRates,
                ...cryptoRates,
                timestamp: Date.now()
            };
            
            this.lastUpdate = new Date();
            
            // Cache rates
            this.cacheRates();
            
            // Update UI
            this.updateCurrencyWidget();
            
            // Notify success
            if (window.NotificationManager) {
                NotificationManager.show(
                    '💱 Cotações atualizadas com sucesso!',
                    'success',
                    3000
                );
            }
            
        } catch (error) {
            console.error('Error fetching currency rates:', error);
            
            if (window.NotificationManager) {
                NotificationManager.show(
                    '⚠️ Erro ao atualizar cotações. Usando dados em cache.',
                    'warning',
                    5000
                );
            }
            
        } finally {
            Utils.hideLoading();
        }
    }

    async fetchTraditionalRates() {
        try {
            // Try primary API first with BRL as base
            const response = await fetch(`${this.apiEndpoints.primary}${this.baseCurrency}`);
            
            if (!response.ok) {
                throw new Error('Primary API failed');
            }
            
            const data = await response.json();
            
            // Since BRL is base, other currencies show how much 1 BRL is worth
            return {
                USD: data.rates.USD || 0.20,
                EUR: data.rates.EUR || 0.18,
                GBP: data.rates.GBP || 0.16,
                JPY: data.rates.JPY || 30.0,
                CAD: data.rates.CAD || 0.27,
                AUD: data.rates.AUD || 0.30,
                CHF: data.rates.CHF || 0.18,
                BRL: 1 // Base currency
            };
            
        } catch (error) {
            console.warn('Primary API failed, trying fallback:', error);
            return this.fetchFallbackRates();
        }
    }

    async fetchFallbackRates() {
        try {
            // Fallback to exchangerate.host API with BRL as base
            const response = await fetch('https://api.exchangerate.host/latest?base=BRL&symbols=USD,EUR,GBP,JPY,CAD,AUD,CHF');
            
            if (!response.ok) {
                throw new Error('Fallback API failed');
            }
            
            const data = await response.json();
            
            return {
                USD: data.rates.USD || 0.20,
                EUR: data.rates.EUR || 0.18,
                GBP: data.rates.GBP || 0.16,
                JPY: data.rates.JPY || 30.0,
                CAD: data.rates.CAD || 0.27,
                AUD: data.rates.AUD || 0.30,
                CHF: data.rates.CHF || 0.18,
                BRL: 1
            };
            
        } catch (error) {
            console.warn('Fallback API failed, using default rates:', error);
            
            // Return default rates as last resort (approximate values)
            return {
                USD: 0.20, // 1 BRL ≈ 0.20 USD
                EUR: 0.18, // 1 BRL ≈ 0.18 EUR
                GBP: 0.16, // 1 BRL ≈ 0.16 GBP
                JPY: 30.0, // 1 BRL ≈ 30 JPY
                CAD: 0.27, // 1 BRL ≈ 0.27 CAD
                AUD: 0.30, // 1 BRL ≈ 0.30 AUD
                CHF: 0.18, // 1 BRL ≈ 0.18 CHF
                BRL: 1
            };
        }
    }

    async fetchCryptoRates() {
        try {
            const response = await fetch(
                `${this.apiEndpoints.crypto}?ids=bitcoin&vs_currencies=brl`
            );
            
            if (!response.ok) {
                throw new Error('Crypto API failed');
            }
            
            const data = await response.json();
            
            return {
                BTC: 1 / data.bitcoin.brl // Convert to BRL base
            };
            
        } catch (error) {
            console.warn('Crypto API failed, using default rate:', error);
            
            return {
                BTC: 1 / 200000 // Default: 1 BRL = 0.000005 BTC (approximate)
            };
        }
    }

    createCurrencyWidget() {
        // Check if widget container exists
        let container = document.getElementById('currency-widget');
        
        if (!container) {
            // Create widget container
            container = document.createElement('div');
            container.id = 'currency-widget';
            container.className = 'fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-40 max-w-xs';
            
            // Add to page
            document.body.appendChild(container);
        }
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                    <i class="fas fa-exchange-alt mr-2 text-blue-500"></i>
                    Cotações
                </h3>
                <button 
                    onclick="CurrencyManager.toggleWidget()"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Minimizar"
                >
                    <i class="fas fa-minus"></i>
                </button>
            </div>
            
            <div id="currency-rates" class="space-y-2">
                <!-- Rates will be populated here -->
            </div>
            
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span class="text-xs text-gray-500 dark:text-gray-400" id="last-update">
                    Carregando...
                </span>
                <button 
                    onclick="CurrencyManager.fetchRates()"
                    class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                    title="Atualizar"
                >
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        `;
        
        // Check if widget should be minimized
        const isMinimized = localStorage.getItem('currency-widget-minimized') === 'true';
        if (isMinimized) {
            this.minimizeWidget();
        }
    }

    updateCurrencyWidget() {
        const ratesContainer = document.getElementById('currency-rates');
        if (!ratesContainer) return;
        
        // Atualizar timestamp
        const timestampElement = document.getElementById('currency-last-update');
        if (timestampElement) {
            timestampElement.textContent = new Date().toLocaleString('pt-BR');
        }
        
        // Limpar container
        ratesContainer.innerHTML = '';
        
        // Ordem de exibição das moedas
        const displayOrder = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'BTC'];
        
        // Criar cards para cada moeda
        displayOrder.forEach(currency => {
            if (currency !== this.baseCurrency && this.rates[currency]) {
                const card = this.createCurrencyCard(currency, this.rates[currency]);
                ratesContainer.appendChild(card);
            }
        });
    }

    getCurrencySymbol(currency) {
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CAD: 'C$',
            AUD: 'A$',
            CHF: 'CHF',
            BRL: 'R$',
            BTC: '₿'
        };
        
        return symbols[currency] || currency;
    }

    formatRate(rate, currency) {
        if (!rate) return 'N/A';
        
        if (currency === 'BTC') {
            return rate.toFixed(8);
        }
        
        if (currency === 'JPY') {
            return rate.toFixed(2); // Yen typically doesn't use decimals, but showing 2 for precision
        }
        
        return rate.toFixed(4);
    }

    getRateTrend(currency) {
        // Get previous rate from cache to calculate trend
        const cachedRates = this.getCachedRates();
        if (!cachedRates || !cachedRates[currency]) return 0;
        
        const currentRate = this.rates[currency];
        const previousRate = cachedRates[currency];
        
        if (!currentRate || !previousRate) return 0;
        
        return ((currentRate - previousRate) / previousRate) * 100;
    }

    toggleWidget() {
        const widget = document.getElementById('currency-widget');
        if (!widget) return;
        
        const isMinimized = widget.classList.contains('minimized');
        
        if (isMinimized) {
            this.expandWidget();
        } else {
            this.minimizeWidget();
        }
    }

    minimizeWidget() {
        const widget = document.getElementById('currency-widget');
        if (!widget) return;
        
        widget.classList.add('minimized');
        widget.style.height = '60px';
        widget.style.overflow = 'hidden';
        
        // Hide content except header
        const ratesContainer = document.getElementById('currency-rates');
        const footer = widget.querySelector('.border-t');
        
        if (ratesContainer) ratesContainer.style.display = 'none';
        if (footer) footer.style.display = 'none';
        
        // Change minimize button to expand
        const toggleBtn = widget.querySelector('button[onclick="CurrencyManager.toggleWidget()"]');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
            toggleBtn.title = 'Expandir';
        }
        
        localStorage.setItem('currency-widget-minimized', 'true');
    }

    expandWidget() {
        const widget = document.getElementById('currency-widget');
        if (!widget) return;
        
        widget.classList.remove('minimized');
        widget.style.height = 'auto';
        widget.style.overflow = 'visible';
        
        // Show content
        const ratesContainer = document.getElementById('currency-rates');
        const footer = widget.querySelector('.border-t');
        
        if (ratesContainer) ratesContainer.style.display = 'block';
        if (footer) footer.style.display = 'flex';
        
        // Change expand button to minimize
        const toggleBtn = widget.querySelector('button[onclick="CurrencyManager.toggleWidget()"]');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
            toggleBtn.title = 'Minimizar';
        }
        
        localStorage.setItem('currency-widget-minimized', 'false');
    }

    createCurrencyCard(currency, rate) {
        const card = document.createElement('div');
        card.className = 'text-center p-3 bg-white rounded-lg border hover:shadow-md transition-shadow';
        
        const symbol = this.getCurrencySymbol(currency);
        const formattedRate = this.formatRate(rate, currency);
        
        // Cores diferentes para diferentes tipos de moeda
        let currencyColor = 'text-blue-600';
        if (currency === 'BTC') currencyColor = 'text-orange-500';
        else if (['EUR', 'GBP'].includes(currency)) currencyColor = 'text-purple-600';
        else if (['JPY', 'CAD', 'AUD', 'CHF'].includes(currency)) currencyColor = 'text-green-600';
        
        card.innerHTML = `
            <div class="text-lg font-bold ${currencyColor}">${currency}</div>
            <div class="text-sm font-semibold text-gray-800">${symbol} ${formattedRate}</div>
            <div class="text-xs text-gray-500">por R$ 1</div>
        `;
        
        return card;
    }

    // Currency conversion methods
    convert(amount, fromCurrency, toCurrency) {
        if (!this.rates[fromCurrency] || !this.rates[toCurrency]) {
            console.warn('Currency rates not available for conversion');
            return amount;
        }
        
        // Convert to base currency first, then to target currency
        const baseAmount = amount / this.rates[fromCurrency];
        return baseAmount * this.rates[toCurrency];
    }

    formatCurrency(amount, currency = this.baseCurrency) {
        const symbol = this.getCurrencySymbol(currency);
        
        if (currency === 'BTC') {
            return `${symbol} ${amount.toFixed(8)}`;
        }
        
        return `${symbol} ${amount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // Cache management
    cacheRates() {
        try {
            localStorage.setItem('ecofin-currency-rates', JSON.stringify({
                rates: this.rates,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Could not cache currency rates:', error);
        }
    }

    loadCachedRates() {
        try {
            const cached = localStorage.getItem('ecofin-currency-rates');
            if (cached) {
                const data = JSON.parse(cached);
                
                // Check if cache is not too old (max 1 hour)
                const maxAge = 60 * 60 * 1000; // 1 hour
                if (Date.now() - data.timestamp < maxAge) {
                    this.rates = data.rates;
                    this.lastUpdate = new Date(data.timestamp);
                    
                    // Update widget with cached data
                    setTimeout(() => this.updateCurrencyWidget(), 100);
                }
            }
        } catch (error) {
            console.warn('Could not load cached currency rates:', error);
        }
    }

    getCachedRates() {
        try {
            const cached = localStorage.getItem('ecofin-currency-rates-previous');
            return cached ? JSON.parse(cached).rates : null;
        } catch (error) {
            return null;
        }
    }

    startPeriodicUpdates() {
        // Update rates every 5 minutes
        setInterval(() => {
            this.fetchRates();
        }, this.updateInterval);
        
        // Update widget every minute to refresh "last updated" time
        setInterval(() => {
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement && this.lastUpdate) {
                const minutesAgo = Math.floor((Date.now() - this.lastUpdate.getTime()) / 60000);
                if (minutesAgo > 0) {
                    lastUpdateElement.textContent = `Há ${minutesAgo} min`;
                }
            }
        }, 60000);
    }

    // Investment suggestions based on currency trends
    getInvestmentSuggestions() {
        const suggestions = [];
        
        Object.entries(this.rates).forEach(([currency, rate]) => {
            if (currency === 'timestamp' || currency === this.baseCurrency) return;
            
            const trend = this.getRateTrend(currency);
            
            if (Math.abs(trend) > 2) { // Significant movement (>2%)
                const direction = trend > 0 ? 'alta' : 'baixa';
                const action = trend > 0 ? 'considere vender' : 'pode ser oportunidade de compra';
                
                suggestions.push({
                    currency,
                    trend,
                    direction,
                    message: `${currency} em ${direction} (${Math.abs(trend).toFixed(2)}%) - ${action}`
                });
            }
        });
        
        return suggestions;
    }

    showInvestmentAlert() {
        const suggestions = this.getInvestmentSuggestions();
        
        if (suggestions.length > 0 && window.NotificationManager) {
            suggestions.forEach(suggestion => {
                NotificationManager.show(
                    `💡 ${suggestion.message}`,
                    'info',
                    8000,
                    [
                        {
                            label: 'Ver Mais',
                            handler: 'CurrencyManager.showDetailedAnalysis()'
                        }
                    ]
                );
            });
        }
    }

    showDetailedAnalysis() {
        const suggestions = this.getInvestmentSuggestions();
        
        if (suggestions.length === 0) {
            if (window.NotificationManager) {
                NotificationManager.show(
                    '📊 Mercado estável. Nenhuma oportunidade significativa detectada.',
                    'info',
                    5000
                );
            }
            return;
        }
        
        // Create detailed analysis modal or notification
        const analysisText = suggestions.map(s => 
            `• ${s.currency}: ${s.direction} de ${Math.abs(s.trend).toFixed(2)}%`
        ).join('\n');
        
        if (window.NotificationManager) {
            NotificationManager.show(
                `📈 Análise de Mercado:\n${analysisText}`,
                'info',
                10000
            );
        }
    }

    // Export rates for reports
    exportRates() {
        const data = {
            rates: this.rates,
            lastUpdate: this.lastUpdate,
            baseCurrency: this.baseCurrency,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecofin-currency-rates-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.NotificationManager) {
            NotificationManager.show(
                '💾 Cotações exportadas com sucesso!',
                'success',
                3000
            );
        }
    }

    // Cleanup
    destroy() {
        const widget = document.getElementById('currency-widget');
        if (widget) {
            widget.remove();
        }
    }
}

// Initialize Currency Manager
const currencyManager = new CurrencyManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CurrencyManager = currencyManager;
}

// Listen for visibility changes to pause/resume updates
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause updates to save resources
        console.log('Currency updates paused (page hidden)');
    } else {
        // Page is visible, resume updates
        console.log('Currency updates resumed (page visible)');
        if (window.CurrencyManager) {
            // Fetch fresh rates when page becomes visible
            setTimeout(() => CurrencyManager.fetchRates(), 1000);
        }
    }
});
