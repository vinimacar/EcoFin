# 💰 EcoFin - Gestão de Orçamento Pessoal

> Aplicação web moderna e responsiva para gestão de orçamento pessoal com IA, cotações em tempo real e análises inteligentes.

![EcoFin Banner](https://img.shields.io/badge/EcoFin-v1.0.0-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/ecofin)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)

## 🚀 Funcionalidades Principais

### 💼 Gestão de Orçamento
- ✅ **Cadastro de receitas e despesas** com categorização inteligente
- 📊 **Visualização do saldo atual** e histórico mensal
- 📈 **Gráficos interativos** de entradas e saídas (Chart.js)
- 🔄 **Atualizações dinâmicas** em tempo real
- 📱 **Interface responsiva** (desktop, tablet, mobile)

### 🔔 Notificações Inteligentes
- ⚠️ **Alertas de gastos excessivos** baseados no orçamento
- 📝 **Lembretes para registrar despesas**
- 💡 **Mensagens motivacionais** para economia
- 🎯 **Notificações de metas** financeiras

### 🌟 Diferenciais Premium
- 💎 **Dicas de investimento** baseadas no saldo mensal
- 💱 **Cotações em tempo real** (USD, EUR, BRL, BTC, ETH)
- 🤖 **Assistente IA financeiro** para planejamento e análises
- 📊 **Insights inteligentes** de gastos e tendências
- 🌙 **Dark mode** e temas personalizáveis

### 📱 PWA (Progressive Web App)
- 🔄 **Funcionamento offline** básico
- 📲 **Instalação no dispositivo**
- 🔄 **Sincronização automática** quando online
- ⚡ **Performance otimizada** com Service Worker

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica moderna
- **CSS3** com **Twind** - Estilização utilitária
- **JavaScript ES6+** - Lógica da aplicação
- **Chart.js** - Gráficos interativos
- **Font Awesome** - Ícones modernos

### Backend & Serviços
- **Firebase Authentication** - Autenticação segura
- **Firestore Database** - Banco de dados NoSQL
- **Firebase Hosting** - Hospedagem otimizada
- **Service Worker** - Cache e funcionalidades offline

### APIs Externas
- **ExchangeRate API** - Cotações de moedas tradicionais
- **CoinGecko API** - Cotações de criptomoedas
- **OpenAI API** - Assistente IA (opcional)

### Deploy & DevOps
- **Vercel** - Deploy automático
- **GitHub** - Controle de versão
- **PWA** - Progressive Web App

## 📁 Estrutura do Projeto

```
EcoFin/
├── 📄 index.html              # Página principal
├── 📄 manifest.json           # Configuração PWA
├── 📄 sw.js                   # Service Worker
├── 📄 README.md               # Documentação
├── 📁 js/
│   ├── 📄 config.js           # Configurações gerais
│   ├── 📄 app.js              # Controlador principal
│   ├── 📄 auth.js             # Gerenciamento de autenticação
│   ├── 📄 transactions.js     # Gestão de transações
│   ├── 📄 dashboard.js        # Dashboard e estatísticas
│   ├── 📄 charts.js           # Gráficos interativos
│   ├── 📄 notifications.js    # Sistema de notificações
│   ├── 📄 currency.js         # Cotações de moedas
│   └── 📄 ai-assistant.js     # Assistente IA
└── 📁 assets/
    ├── 📁 icons/              # Ícones PWA
    └── 📁 images/             # Imagens da aplicação
```

## 🚀 Como Executar

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet (para APIs externas)
- Conta Firebase (para backend)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/ecofin.git
cd ecofin
```

### 2. Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication** (Email/Senha e Google)
4. Ative **Firestore Database**
5. Copie as configurações do projeto
6. Substitua as configurações em `js/config.js`:

```javascript
const firebaseConfig = {
    apiKey: "sua-api-key",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "sua-app-id"
};
```

### 3. Configuração de APIs (Opcional)

Para funcionalidades premium, configure as APIs em `js/config.js`:

```javascript
const CONFIG = {
    // ... outras configurações
    apis: {
        openai: 'sua-openai-api-key', // Para assistente IA
        // APIs de cotação são gratuitas e não precisam de chave
    }
};
```

### 4. Executar Localmente

#### Opção 1: Servidor HTTP Simples
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (com http-server)
npx http-server -p 8000
```

#### Opção 2: Live Server (VS Code)
1. Instale a extensão "Live Server"
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

### 5. Acessar a Aplicação
Abra o navegador e acesse: `http://localhost:8000`

## 🌐 Deploy no Vercel

### Deploy Automático
1. Faça fork deste repositório
2. Conecte sua conta GitHub ao Vercel
3. Importe o projeto no Vercel
4. Configure as variáveis de ambiente (se necessário)
5. Deploy automático a cada push!

### Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📊 Estrutura do Banco de Dados (Firestore)

```
users/
  {userId}/
    profile/
      - name: string
      - email: string
      - createdAt: timestamp
      - settings: object
    
    transactions/
      {transactionId}/
        - description: string
        - amount: number
        - category: string
        - type: 'income' | 'expense'
        - date: timestamp
        - createdAt: timestamp
    
    notifications/
      {notificationId}/
        - title: string
        - message: string
        - type: string
        - read: boolean
        - createdAt: timestamp
    
    settings/
      - currency: string
      - budget: number
      - notifications: object
      - theme: 'light' | 'dark'
```

## 🎨 Personalização

### Temas
O EcoFin suporta temas claro e escuro. Para personalizar:

1. Edite as variáveis CSS em `index.html`
2. Modifique as cores em `js/config.js`
3. Atualize os ícones em `manifest.json`

### Categorias
Personalize as categorias de transações em `js/config.js`:

```javascript
const CONFIG = {
    categories: {
        income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
        expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer']
    }
};
```

## 🔧 Funcionalidades Avançadas

### Exportação de Dados
- **PDF**: Relatórios mensais
- **Excel**: Planilhas detalhadas
- **CSV**: Dados brutos
- **JSON**: Backup completo

### Integração com IA
O assistente IA pode:
- Analisar padrões de gastos
- Sugerir otimizações no orçamento
- Fornecer dicas de investimento
- Responder perguntas financeiras

### Notificações Push
- Alertas de orçamento
- Lembretes de pagamentos
- Dicas financeiras diárias
- Relatórios semanais

## 📱 Instalação como PWA

### Desktop
1. Abra o EcoFin no Chrome/Edge
2. Clique no ícone de instalação na barra de endereços
3. Confirme a instalação

### Mobile
1. Abra no navegador móvel
2. Toque em "Adicionar à tela inicial"
3. Confirme a instalação

## 🔒 Segurança

- ✅ **Autenticação Firebase** - Segurança enterprise
- ✅ **HTTPS obrigatório** - Comunicação criptografada
- ✅ **Regras Firestore** - Acesso controlado aos dados
- ✅ **Validação client-side** - Prevenção de dados inválidos
- ✅ **Sanitização de inputs** - Proteção contra XSS

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Roadmap

### v1.1.0
- [ ] Integração com bancos (Open Banking)
- [ ] Metas financeiras avançadas
- [ ] Compartilhamento familiar
- [ ] Relatórios personalizados

### v1.2.0
- [ ] Machine Learning para previsões
- [ ] Integração com cartões de crédito
- [ ] Planejamento de aposentadoria
- [ ] Simulador de investimentos

### v2.0.0
- [ ] Versão mobile nativa
- [ ] Sincronização multi-dispositivo
- [ ] Consultoria financeira IA
- [ ] Marketplace de produtos financeiros

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [Seu Perfil](https://linkedin.com/in/seu-perfil)
- Email: seu.email@exemplo.com

## 🙏 Agradecimentos

- [Firebase](https://firebase.google.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Deploy e hospedagem
- [Chart.js](https://www.chartjs.org/) - Gráficos interativos
- [Twind](https://twind.dev/) - CSS utilitário
- [Font Awesome](https://fontawesome.com/) - Ícones
- [ExchangeRate API](https://exchangerate.host/) - Cotações de moedas
- [CoinGecko](https://www.coingecko.com/) - Cotações de criptomoedas

---

<div align="center">
  <p>Feito com ❤️ para ajudar você a ter controle total das suas finanças!</p>
  <p>⭐ Se este projeto te ajudou, considere dar uma estrela!</p>
</div>

## 📞 Suporte

Encontrou um bug ou tem uma sugestão?
- 🐛 [Reportar Bug](https://github.com/seu-usuario/ecofin/issues/new?template=bug_report.md)
- 💡 [Sugerir Feature](https://github.com/seu-usuario/ecofin/issues/new?template=feature_request.md)
- 💬 [Discussões](https://github.com/seu-usuario/ecofin/discussions)

## 📊 Status do Projeto

![GitHub last commit](https://img.shields.io/github/last-commit/seu-usuario/ecofin)
![GitHub issues](https://img.shields.io/github/issues/seu-usuario/ecofin)
![GitHub pull requests](https://img.shields.io/github/issues-pr/seu-usuario/ecofin)
![GitHub stars](https://img.shields.io/github/stars/seu-usuario/ecofin)
![GitHub forks](https://img.shields.io/github/forks/seu-usuario/ecofin)

---

**EcoFin v1.0.0** - Transformando a gestão financeira pessoal! 🚀💰