/**
 * Sistema de Gerenciamento de Dados Pessoais
 * Gerencia dados pessoais, agenda de compromissos e controle de pagamentos
 */

// Classe para gerenciar dados pessoais
class PersonalDataManager {
    constructor() {
        this.storageKey = 'ecofin_personal_data';
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {
            name: '',
            email: '',
            phone: '',
            address: ''
        };
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    updatePersonalData(personalData) {
        this.data = { ...this.data, ...personalData };
        this.saveData();
        return this.data;
    }

    getPersonalData() {
        return this.data;
    }

    clearData() {
        this.data = {
            name: '',
            email: '',
            phone: '',
            address: ''
        };
        this.saveData();
    }
}

// Classe para gerenciar agenda de compromissos
class ScheduleManager {
    constructor() {
        this.storageKey = 'ecofin_schedule';
        this.events = this.loadEvents();
    }

    loadEvents() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveEvents() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    }

    addEvent(event) {
        const newEvent = {
            id: Date.now().toString(),
            title: event.title,
            date: event.date,
            time: event.time,
            description: event.description || '',
            createdAt: new Date().toISOString()
        };
        this.events.push(newEvent);
        this.saveEvents();
        return newEvent;
    }

    getEvents() {
        return this.events.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    }

    removeEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.saveEvents();
    }

    updateEvent(eventId, updatedData) {
        const eventIndex = this.events.findIndex(event => event.id === eventId);
        if (eventIndex !== -1) {
            this.events[eventIndex] = { ...this.events[eventIndex], ...updatedData };
            this.saveEvents();
            return this.events[eventIndex];
        }
        return null;
    }

    getUpcomingEvents(days = 7) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date + ' ' + event.time);
            return eventDate >= now && eventDate <= futureDate;
        });
    }
}

// Classe para gerenciar pagamentos
class PaymentManager {
    constructor() {
        this.storageKey = 'ecofin_payments';
        this.payments = this.loadPayments();
    }

    loadPayments() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    savePayments() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.payments));
    }

    addPayment(payment) {
        const newPayment = {
            id: Date.now().toString(),
            title: payment.title,
            amount: parseFloat(payment.amount),
            dueDate: payment.dueDate,
            type: payment.type, // 'pagar' ou 'receber'
            status: payment.status || 'pendente', // 'pendente', 'pago', 'atrasado'
            description: payment.description || '',
            createdAt: new Date().toISOString()
        };
        this.payments.push(newPayment);
        this.savePayments();
        return newPayment;
    }

    getPayments() {
        return this.payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    removePayment(paymentId) {
        this.payments = this.payments.filter(payment => payment.id !== paymentId);
        this.savePayments();
    }

    updatePayment(paymentId, updatedData) {
        const paymentIndex = this.payments.findIndex(payment => payment.id === paymentId);
        if (paymentIndex !== -1) {
            this.payments[paymentIndex] = { ...this.payments[paymentIndex], ...updatedData };
            this.savePayments();
            return this.payments[paymentIndex];
        }
        return null;
    }

    markAsPaid(paymentId) {
        return this.updatePayment(paymentId, { status: 'pago', paidAt: new Date().toISOString() });
    }

    getOverduePayments() {
        const today = new Date().toISOString().split('T')[0];
        return this.payments.filter(payment => 
            payment.status === 'pendente' && payment.dueDate < today
        );
    }

    getUpcomingPayments(days = 7) {
        const today = new Date();
        const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
        const todayStr = today.toISOString().split('T')[0];
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        return this.payments.filter(payment => 
            payment.status === 'pendente' && 
            payment.dueDate >= todayStr && 
            payment.dueDate <= futureDateStr
        );
    }

    getTotalToPay() {
        return this.payments
            .filter(payment => payment.type === 'pagar' && payment.status === 'pendente')
            .reduce((total, payment) => total + payment.amount, 0);
    }

    getTotalToReceive() {
        return this.payments
            .filter(payment => payment.type === 'receber' && payment.status === 'pendente')
            .reduce((total, payment) => total + payment.amount, 0);
    }
}

// Classe principal para gerenciar o modal de dados pessoais
class PersonalDataModal {
    constructor() {
        this.personalDataManager = new PersonalDataManager();
        this.scheduleManager = new ScheduleManager();
        this.paymentManager = new PaymentManager();
        this.currentTab = 'personal';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPersonalData();
        this.loadSchedule();
        this.loadPayments();
    }

    bindEvents() {
        // Botão para abrir modal
        const personalDataBtn = document.getElementById('personal-data-btn');
        if (personalDataBtn) {
            personalDataBtn.addEventListener('click', () => this.openModal());
        }

        // Botão para fechar modal
        const closeBtn = document.getElementById('close-personal-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Formulários
        this.bindFormEvents();
    }

    bindFormEvents() {
        // Formulário de dados pessoais
        const personalForm = document.getElementById('personal-form');
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePersonalData();
            });
        }

        // Formulário de agenda
        const scheduleForm = document.getElementById('schedule-form');
        if (scheduleForm) {
            scheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addScheduleEvent();
            });
        }

        // Formulário de pagamentos
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPayment();
            });
        }
    }

    openModal() {
        const modal = document.getElementById('personal-data-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.switchTab('personal');
        }
    }

    closeModal() {
        const modal = document.getElementById('personal-data-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Atualizar botões das tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
            activeBtn.classList.add('bg-blue-500', 'text-white');
        }

        // Mostrar conteúdo da tab
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const activeContent = document.getElementById(`${tab}-tab`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
    }

    loadPersonalData() {
        const data = this.personalDataManager.getPersonalData();
        const form = document.getElementById('personal-form');
        if (form) {
            form.querySelector('#personal-name').value = data.name || '';
            form.querySelector('#personal-email').value = data.email || '';
            form.querySelector('#personal-phone').value = data.phone || '';
            form.querySelector('#personal-address').value = data.address || '';
        }
    }

    savePersonalData() {
        const form = document.getElementById('personal-form');
        if (form) {
            const formData = new FormData(form);
            const personalData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address')
            };
            
            // Validações
            if (!personalData.name.trim()) {
                this.showErrorMessage('Nome é obrigatório!');
                return;
            }
            
            if (personalData.email && !this.isValidEmail(personalData.email)) {
                this.showErrorMessage('Email inválido!');
                return;
            }
            
            if (personalData.phone && !this.isValidPhone(personalData.phone)) {
                this.showErrorMessage('Telefone inválido! Use o formato (XX) XXXXX-XXXX');
                return;
            }
            
            this.personalDataManager.updatePersonalData(personalData);
            this.showSuccessMessage('Dados pessoais salvos com sucesso!');
        }
    }

    loadSchedule() {
        const events = this.scheduleManager.getEvents();
        const container = document.getElementById('schedule-list');
        if (container) {
            container.innerHTML = events.length === 0 ? 
                '<p class="text-gray-500 text-center py-4">Nenhum compromisso agendado</p>' :
                events.map(event => this.createEventElement(event)).join('');
        }
    }

    createEventElement(event) {
        return `
            <div class="bg-gray-50 p-3 rounded-lg border" data-event-id="${event.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-900">${event.title}</h4>
                        <p class="text-sm text-gray-600">${event.date} às ${event.time}</p>
                        ${event.description ? `<p class="text-sm text-gray-500 mt-1">${event.description}</p>` : ''}
                    </div>
                    <button onclick="personalDataModal.removeScheduleEvent('${event.id}')" 
                            class="text-red-500 hover:text-red-700">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    addScheduleEvent() {
        const form = document.getElementById('schedule-form');
        if (form) {
            const formData = new FormData(form);
            const event = {
                title: formData.get('title'),
                date: formData.get('date'),
                time: formData.get('time'),
                description: formData.get('description')
            };
            
            // Validações
            if (!event.title.trim()) {
                this.showErrorMessage('Título do compromisso é obrigatório!');
                return;
            }
            
            if (!event.date) {
                this.showErrorMessage('Data do compromisso é obrigatória!');
                return;
            }
            
            if (!event.time) {
                this.showErrorMessage('Horário do compromisso é obrigatório!');
                return;
            }
            
            // Verificar se a data não é no passado
            const eventDateTime = new Date(event.date + ' ' + event.time);
            const now = new Date();
            if (eventDateTime < now) {
                this.showErrorMessage('Não é possível agendar compromissos no passado!');
                return;
            }
            
            this.scheduleManager.addEvent(event);
            this.loadSchedule();
            form.reset();
            this.showSuccessMessage('Compromisso adicionado com sucesso!');
        }
    }

    removeScheduleEvent(eventId) {
        this.scheduleManager.removeEvent(eventId);
        this.loadSchedule();
        this.showSuccessMessage('Compromisso removido com sucesso!');
    }

    loadPayments() {
        const payments = this.paymentManager.getPayments();
        const container = document.getElementById('payments-list');
        if (container) {
            container.innerHTML = payments.length === 0 ? 
                '<p class="text-gray-500 text-center py-4">Nenhum pagamento cadastrado</p>' :
                payments.map(payment => this.createPaymentElement(payment)).join('');
        }
    }

    createPaymentElement(payment) {
        const statusColor = {
            'pendente': 'bg-yellow-100 text-yellow-800',
            'pago': 'bg-green-100 text-green-800',
            'atrasado': 'bg-red-100 text-red-800'
        };
        
        const typeColor = payment.type === 'pagar' ? 'text-red-600' : 'text-green-600';
        const typeIcon = payment.type === 'pagar' ? '↗' : '↙';
        
        return `
            <div class="bg-gray-50 p-3 rounded-lg border" data-payment-id="${payment.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-medium text-gray-900">${payment.title}</h4>
                            <span class="${typeColor} font-bold">${typeIcon}</span>
                        </div>
                        <p class="text-lg font-semibold ${typeColor}">R$ ${payment.amount.toFixed(2)}</p>
                        <p class="text-sm text-gray-600">Vencimento: ${payment.dueDate}</p>
                        ${payment.description ? `<p class="text-sm text-gray-500 mt-1">${payment.description}</p>` : ''}
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${statusColor[payment.status]} mt-2">
                            ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        ${payment.status === 'pendente' ? 
                            `<button onclick="personalDataModal.markPaymentAsPaid('${payment.id}')" 
                                    class="text-green-500 hover:text-green-700 text-sm">
                                Marcar como Pago
                            </button>` : ''}
                        <button onclick="personalDataModal.removePayment('${payment.id}')" 
                                class="text-red-500 hover:text-red-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addPayment() {
        const form = document.getElementById('payment-form');
        if (form) {
            const formData = new FormData(form);
            const payment = {
                title: formData.get('title'),
                amount: formData.get('amount'),
                dueDate: formData.get('dueDate'),
                type: formData.get('type'),
                description: formData.get('description')
            };
            
            // Validações
            if (!payment.title.trim()) {
                this.showErrorMessage('Título do pagamento é obrigatório!');
                return;
            }
            
            if (!payment.amount || parseFloat(payment.amount) <= 0) {
                this.showErrorMessage('Valor deve ser maior que zero!');
                return;
            }
            
            if (!payment.dueDate) {
                this.showErrorMessage('Data de vencimento é obrigatória!');
                return;
            }
            
            if (!payment.type) {
                this.showErrorMessage('Tipo de pagamento é obrigatório!');
                return;
            }
            
            this.paymentManager.addPayment(payment);
            this.loadPayments();
            form.reset();
            this.showSuccessMessage('Pagamento adicionado com sucesso!');
        }
    }

    removePayment(paymentId) {
        this.paymentManager.removePayment(paymentId);
        this.loadPayments();
        this.showSuccessMessage('Pagamento removido com sucesso!');
    }

    markPaymentAsPaid(paymentId) {
        this.paymentManager.markAsPaid(paymentId);
        this.loadPayments();
        this.showSuccessMessage('Pagamento marcado como pago!');
    }

    showSuccessMessage(message) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        // Criar elemento de notificação de erro
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover após 4 segundos (um pouco mais para erros)
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // Remove todos os caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        // Verifica se tem 10 ou 11 dígitos (com ou sem DDD)
        return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    }
}

// Inicializar quando o DOM estiver carregado
let personalDataModal;
document.addEventListener('DOMContentLoaded', () => {
    personalDataModal = new PersonalDataModal();
});

// Expor classes globalmente para uso em outros scripts
window.PersonalDataManager = PersonalDataManager;
window.ScheduleManager = ScheduleManager;
window.PaymentManager = PaymentManager;
window.PersonalDataModal = PersonalDataModal;
