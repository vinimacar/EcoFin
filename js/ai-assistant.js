// AI Assistant Manager
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.currentUser = null;
        this.userFinancialData = null;
        this.apiKey = null; // Will be set by user or environment
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-3.5-turbo';
        this.maxTokens = 500;
        this.init();
    }

    init() {
        // Create chat interface
        this.createChatInterface();
        
        // Listen for auth state changes
        if (window.AuthManager) {
            AuthManager.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    this.loadConversationHistory();
                    this.loadUserFinancialData();
                }
            });
        }
        
        // Listen for transaction changes to update financial data - with safety check
        if (window.TransactionManager && typeof window.TransactionManager.addListener === 'function') {
            window.TransactionManager.addListener((transactions) => {
                this.updateFinancialData(transactions);
            });
        } else {
            // Retry after a delay if TransactionManager is not ready
            setTimeout(() => {
                if (window.TransactionManager && typeof window.TransactionManager.addListener === 'function') {
                    window.TransactionManager.addListener((transactions) => {
                        this.updateFinancialData(transactions);
                    });
                }
            }, 200);
        }
        
        // Load API key from environment or prompt user
        this.loadAPIKey();
    }

    createChatInterface() {
        // Create floating chat button
        const chatButton = document.createElement('button');
        chatButton.id = 'ai-chat-button';
        chatButton.className = 'fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-50 transition-all duration-300';
        chatButton.innerHTML = '<i class="fas fa-robot text-xl"></i>';
        chatButton.onclick = () => this.toggleChat();
        document.body.appendChild(chatButton);
        
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'ai-chat-container';
        chatContainer.className = 'fixed bottom-20 right-4 w-96 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-40 transform translate-y-full opacity-0 transition-all duration-300';
        chatContainer.style.display = 'none';
        
        chatContainer.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <i class="fas fa-robot text-white text-sm"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">Assistente IA</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400" id="ai-status">Online</p>
                        </div>
                    </div>
                    <button 
                        onclick="AIAssistant.toggleChat()"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Messages -->
                <div id="ai-messages" class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div class="flex items-start space-x-2">
                        <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-robot text-white text-xs"></i>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-xs">
                            <p class="text-sm text-gray-900 dark:text-white">
                                Olá! Sou seu assistente financeiro pessoal. Como posso ajudá-lo hoje?
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Input -->
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex space-x-2">
                        <input 
                            type="text" 
                            id="ai-input"
                            placeholder="Digite sua pergunta..."
                            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            onkeypress="if(event.key==='Enter') AIAssistant.sendMessage()"
                        >
                        <button 
                            onclick="AIAssistant.sendMessage()"
                            class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 transition-colors"
                            id="ai-send-btn"
                        >
                            <i class="fas fa-paper-plane text-sm"></i>
                        </button>
                    </div>
                    
                    <!-- Quick actions -->
                    <div class="flex flex-wrap gap-1 mt-2" id="ai-quick-actions">
                        <button onclick="AIAssistant.quickAction('budget')" class="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">💰 Orçamento</button>
                        <button onclick="AIAssistant.quickAction('savings')" class="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">💡 Dicas</button>
                        <button onclick="AIAssistant.quickAction('analysis')" class="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">📊 Análise</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatContainer);
    }

    toggleChat() {
        const container = document.getElementById('ai-chat-container');
        const button = document.getElementById('ai-chat-button');
        
        if (!container || !button) return;
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            container.style.display = 'block';
            setTimeout(() => {
                container.classList.remove('translate-y-full', 'opacity-0');
                container.classList.add('translate-y-0', 'opacity-100');
            }, 10);
            
            button.innerHTML = '<i class="fas fa-times text-xl"></i>';
            
            // Focus input
            setTimeout(() => {
                const input = document.getElementById('ai-input');
                if (input) input.focus();
            }, 300);
            
        } else {
            container.classList.remove('translate-y-0', 'opacity-100');
            container.classList.add('translate-y-full', 'opacity-0');
            
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
            
            button.innerHTML = '<i class="fas fa-robot text-xl"></i>';
        }
    }

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        
        if (!input || !input.value.trim()) return;
        
        const message = input.value.trim();
        input.value = '';
        
        // Add user message to chat
        this.addMessageToChat(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Disable send button
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
        }
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessageToChat(response, 'ai');
            
            // Save conversation
            this.saveConversation(message, response);
            
        } catch (error) {
            console.error('AI Assistant error:', error);
            
            this.hideTypingIndicator();
            
            this.addMessageToChat(
                'Desculpe, ocorreu um erro. Tente novamente ou verifique sua conexão.',
                'ai',
                'error'
            );
            
        } finally {
            // Re-enable send button
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane text-sm"></i>';
            }
        }
    }

    async getAIResponse(userMessage) {
        // Check if API key is available
        if (!this.apiKey) {
            return this.getOfflineResponse(userMessage);
        }
        
        // Prepare context with user's financial data
        const context = this.buildFinancialContext();
        
        const messages = [
            {
                role: 'system',
                content: `Você é um assistente financeiro pessoal especializado em ajudar com orçamento, economia e investimentos. ${context}
                
                Diretrizes:
                - Seja conciso e prático
                - Use emojis quando apropriado
                - Forneça conselhos específicos baseados nos dados do usuário
                - Mantenha um tom amigável e encorajador
                - Responda em português brasileiro
                - Limite suas respostas a 150 palavras`
            },
            ...this.conversationHistory.slice(-5), // Last 5 messages for context
            {
                role: 'user',
                content: userMessage
            }
        ];
        
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                max_tokens: this.maxTokens,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    getOfflineResponse(userMessage) {
        // Fallback responses when AI API is not available
        const message = userMessage.toLowerCase();
        
        // Budget-related questions
        if (message.includes('orçamento') || message.includes('budget')) {
            return this.getBudgetAdvice();
        }
        
        // Savings questions
        if (message.includes('economizar') || message.includes('poupar') || message.includes('guardar')) {
            return this.getSavingsAdvice();
        }
        
        // Investment questions
        if (message.includes('investir') || message.includes('investimento') || message.includes('aplicar')) {
            return this.getInvestmentAdvice();
        }
        
        // Analysis questions
        if (message.includes('análise') || message.includes('gastos') || message.includes('despesas')) {
            return this.getAnalysisAdvice();
        }
        
        // Default response
        return `💡 Posso ajudá-lo com:

• 💰 Planejamento de orçamento
• 💡 Dicas de economia
• 📊 Análise de gastos
• 🎯 Estratégias de investimento

O que gostaria de saber?`;
    }

    getBudgetAdvice() {
        if (!this.userFinancialData) {
            return '💰 Para um orçamento eficaz, use a regra 50-30-20: 50% para necessidades, 30% para desejos e 20% para poupança. Registre suas transações para que eu possa dar conselhos mais específicos!';
        }
        
        const { totalIncome, totalExpenses, balance } = this.userFinancialData;
        const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
        
        if (expenseRatio > 80) {
            return `⚠️ Seus gastos representam ${expenseRatio.toFixed(1)}% da sua receita. Recomendo revisar despesas não essenciais e criar um plano de redução de custos.`;
        } else if (expenseRatio > 60) {
            return `💡 Seus gastos estão em ${expenseRatio.toFixed(1)}% da receita. Está no caminho certo! Tente economizar mais 10% para fortalecer sua reserva.`;
        } else {
            return `🎉 Excelente controle! Seus gastos são ${expenseRatio.toFixed(1)}% da receita. Continue assim e considere investir o excedente.`;
        }
    }

    getSavingsAdvice() {
        const tips = [
            '☕ Prepare café em casa - economia de até R$ 100/mês',
            '🛒 Faça lista de compras e evite impulsos',
            '📱 Revise assinaturas mensais desnecessárias',
            '🚗 Use transporte público quando possível',
            '💡 Automatize sua poupança - "pague-se primeiro"',
            '🍽️ Cozinhe mais em casa - mais saudável e econômico'
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        return `💡 Dica de economia:\n\n${randomTip}\n\nPequenas mudanças geram grandes resultados!`;
    }

    getInvestmentAdvice() {
        if (!this.userFinancialData || this.userFinancialData.balance <= 0) {
            return '🎯 Antes de investir, foque em:\n\n1. Quitar dívidas de alto juros\n2. Criar reserva de emergência (6 meses de gastos)\n3. Depois considere investimentos de baixo risco';
        }
        
        return '📈 Com saldo positivo, considere:\n\n• Tesouro Direto (baixo risco)\n• CDB/LCI/LCA (renda fixa)\n• Fundos de investimento\n\nSempre diversifique e invista apenas o que pode perder!';
    }

    getAnalysisAdvice() {
        if (!this.userFinancialData) {
            return '📊 Para análise detalhada, preciso de mais dados. Registre suas transações e eu poderei identificar padrões e oportunidades de economia!';
        }
        
        const { topCategories } = this.userFinancialData;
        
        if (topCategories && topCategories.length > 0) {
            const topCategory = topCategories[0];
            return `📊 Sua maior categoria de gastos é "${topCategory.name}" com ${Utils.formatCurrency(topCategory.amount)}. Analise se há oportunidades de redução nesta área.`;
        }
        
        return '📊 Continue registrando transações para análises mais detalhadas. Quanto mais dados, melhores insights posso fornecer!';
    }

    quickAction(action) {
        const actions = {
            budget: 'Como posso melhorar meu orçamento mensal?',
            savings: 'Quais são as melhores dicas para economizar dinheiro?',
            analysis: 'Analise meus gastos e me dê sugestões de melhoria.'
        };
        
        const input = document.getElementById('ai-input');
        if (input && actions[action]) {
            input.value = actions[action];
            this.sendMessage();
        }
    }

    addMessageToChat(message, sender, type = 'normal') {
        const messagesContainer = document.getElementById('ai-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-2';
        
        if (sender === 'user') {
            messageDiv.className += ' flex-row-reverse space-x-reverse';
            messageDiv.innerHTML = `
                <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
                <div class="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                    <p class="text-sm">${message}</p>
                </div>
            `;
        } else {
            const bgColor = type === 'error' ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-700';
            const textColor = type === 'error' ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white';
            
            messageDiv.innerHTML = `
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="${bgColor} rounded-lg p-3 max-w-xs">
                    <p class="text-sm ${textColor}">${message.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('ai-messages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex items-start space-x-2';
        typingDiv.innerHTML = `
            <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-xs"></i>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    buildFinancialContext() {
        if (!this.userFinancialData) {
            return 'O usuário ainda não possui dados financeiros registrados.';
        }
        
        const { totalIncome, totalExpenses, balance, topCategories } = this.userFinancialData;
        
        let context = `Dados financiais do usuário (mês atual):
`;
        context += `- Receita total: ${Utils.formatCurrency(totalIncome)}
`;
        context += `- Despesas totais: ${Utils.formatCurrency(Math.abs(totalExpenses))}
`;
        context += `- Saldo: ${Utils.formatCurrency(balance)}
`;
        
        if (topCategories && topCategories.length > 0) {
            context += `- Principais categorias de gastos: ${topCategories.slice(0, 3).map(cat => 
                `${cat.name} (${Utils.formatCurrency(cat.amount)})`
            ).join(', ')}`;
        }
        
        return context;
    }

    updateFinancialData(transactions) {
        if (!transactions || transactions.length === 0) {
            this.userFinancialData = null;
            return;
        }
        
        // Calculate current month data
        const currentMonth = new Date();
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth.getMonth() &&
                   transactionDate.getFullYear() === currentMonth.getFullYear();
        });
        
        const totalIncome = monthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = monthTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = totalIncome + totalExpenses;
        
        // Calculate top categories
        const categoryTotals = {};
        monthTransactions.filter(t => t.amount < 0).forEach(t => {
            if (!categoryTotals[t.category]) {
                categoryTotals[t.category] = 0;
            }
            categoryTotals[t.category] += Math.abs(t.amount);
        });
        
        const topCategories = Object.entries(categoryTotals)
            .map(([categoryId, amount]) => ({
                id: categoryId,
                name: this.getCategoryName(categoryId),
                amount
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        
        this.userFinancialData = {
            totalIncome,
            totalExpenses,
            balance,
            topCategories,
            transactionCount: monthTransactions.length
        };
    }

    getCategoryName(categoryId) {
        const allCategories = [...APP_CONFIG.categories.income, ...APP_CONFIG.categories.expense];
        const category = allCategories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Outros';
    }

    saveConversation(userMessage, aiResponse) {
        this.conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
        );
        
        // Keep only last 20 messages
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
        
        // Save to localStorage
        if (this.currentUser) {
            try {
                localStorage.setItem(
                    `ecofin-ai-conversation-${this.currentUser.uid}`,
                    JSON.stringify(this.conversationHistory)
                );
            } catch (error) {
                console.warn('Could not save conversation history:', error);
            }
        }
    }

    loadConversationHistory() {
        if (!this.currentUser) return;
        
        try {
            const saved = localStorage.getItem(`ecofin-ai-conversation-${this.currentUser.uid}`);
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load conversation history:', error);
            this.conversationHistory = [];
        }
    }

    loadAPIKey() {
        // Try to load from environment or localStorage
        this.apiKey = localStorage.getItem('ecofin-openai-key') || null;
        
        // If no API key, show setup message
        if (!this.apiKey) {
            setTimeout(() => {
                if (window.NotificationManager) {
                    NotificationManager.show(
                        '🤖 Configure sua chave da OpenAI para usar o assistente IA completo.',
                        'info',
                        8000,
                        [
                            {
                                label: 'Configurar',
                                handler: 'AIAssistant.showAPIKeySetup()',
                                primary: true
                            }
                        ]
                    );
                }
            }, 5000);
        }
    }

    showAPIKeySetup() {
        const apiKey = prompt(
            'Cole sua chave da API OpenAI:\n\n' +
            '1. Acesse https://platform.openai.com/api-keys\n' +
            '2. Crie uma nova chave\n' +
            '3. Cole aqui (será salva localmente)\n\n' +
            'Deixe em branco para usar modo offline.'
        );
        
        if (apiKey && apiKey.trim()) {
            this.apiKey = apiKey.trim();
            localStorage.setItem('ecofin-openai-key', this.apiKey);
            
            if (window.NotificationManager) {
                NotificationManager.show(
                    '✅ Chave da API configurada! Assistente IA ativado.',
                    'success',
                    5000
                );
            }
            
            // Update status
            const statusElement = document.getElementById('ai-status');
            if (statusElement) {
                statusElement.textContent = 'IA Ativada';
            }
        }
    }

    clearConversation() {
        this.conversationHistory = [];
        
        // Clear chat messages
        const messagesContainer = document.getElementById('ai-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="flex items-start space-x-2">
                    <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-robot text-white text-xs"></i>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-xs">
                        <p class="text-sm text-gray-900 dark:text-white">
                            Conversa limpa! Como posso ajudá-lo?
                        </p>
                    </div>
                </div>
            `;
        }
        
        // Clear from storage
        if (this.currentUser) {
            localStorage.removeItem(`ecofin-ai-conversation-${this.currentUser.uid}`);
        }
    }

    destroy() {
        const chatContainer = document.getElementById('ai-chat-container');
        const chatButton = document.getElementById('ai-chat-button');
        
        if (chatContainer) chatContainer.remove();
        if (chatButton) chatButton.remove();
    }
}

// Initialize AI Assistant
const aiAssistant = new AIAssistant();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AIAssistant = aiAssistant;
}