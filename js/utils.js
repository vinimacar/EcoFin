/**
 * EcoFin - Utilities
 * Funções utilitárias para a aplicação
 */

class Utils {
    // Formatação de moeda
    static formatCurrency(value, currency = 'BRL') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    // Formatação de data
    static formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString('pt-BR');
        } else if (format === 'long') {
            return d.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return d.toLocaleDateString('pt-BR');
    }

    // Validação de email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validação de valor monetário
    static isValidAmount(value) {
        return !isNaN(value) && parseFloat(value) > 0;
    }

    // Gerar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Debounce
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // LocalStorage helpers
    static setLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return defaultValue;
        }
    }

    // Calcular porcentagem
    static calculatePercentage(value, total) {
        return total > 0 ? (value / total) * 100 : 0;
    }

    // Truncar texto
    static truncateText(text, maxLength = 50) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Capitalizar primeira letra
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Detectar mobile
    static isMobile() {
        return window.innerWidth <= 768;
    }

    // Animar elemento
    static animateElement(element, animation, duration = 300) {
        if (!element) return;
        
        element.style.animation = `${animation} ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    // Mostrar loading
    static showLoading(element = null) {
        if (element) {
            element.disabled = true;
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
        } else {
            // Criar overlay de loading global
            let loadingOverlay = document.getElementById('loading-overlay');
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'loading-overlay';
                loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                loadingOverlay.innerHTML = `
                    <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                        <i class="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
                        <span class="text-gray-700">Carregando...</span>
                    </div>
                `;
                document.body.appendChild(loadingOverlay);
            }
            loadingOverlay.classList.remove('hidden');
        }
    }

    // Esconder loading
    static hideLoading(element = null, originalText = '') {
        if (element) {
            element.disabled = false;
            element.innerHTML = originalText;
        } else {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    // Mostrar toast/notificação
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';

        toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Remover após duração
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

// Disponibilizar globalmente apenas se window existir
if (typeof window !== 'undefined' && !window.Utils) {
    window.Utils = Utils;
    console.log('Utils carregado com sucesso');
}