// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.init();
    }

    init() {
        // Setup auth state listener only if auth is available
        if (typeof auth !== 'undefined' && auth) {
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.handleAuthStateChange(user);
            });
        } else {
            console.log('🔧 Auth running in demo mode');
            // Simulate logged out state in demo mode
            this.currentUser = null;
            this.handleAuthStateChange(null);
        }

        this.bindEvents();
        this.setupGoogleProvider();
        
        console.log('✅ AuthManager initialized');
    }

    setupGoogleProvider() {
        this.googleProvider = new firebase.auth.GoogleAuthProvider();
        this.googleProvider.addScope('profile');
        this.googleProvider.addScope('email');
    }

    bindEvents() {
        // Auth form submission
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Tab switching
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => this.switchToLogin());
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', () => this.switchToRegister());
        }

        // Google authentication
        const googleAuthBtn = document.getElementById('google-auth');
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.signOut());
        }

        // User menu toggle
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userMenu = document.getElementById('user-menu');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('hidden');
            });

            // Close menu when clicking outside
            document.addEventListener('click', () => {
                userMenu.classList.add('hidden');
            });
        }
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const isLogin = document.getElementById('login-tab').classList.contains('border-emerald-500');
        
        const submitBtn = document.getElementById('auth-submit');
        const originalText = submitBtn.innerHTML;
        
        try {
            Utils.showLoading(submitBtn);
            
            if (isLogin) {
                await this.signInWithEmail(email, password);
            } else {
                await this.signUpWithEmail(email, password, name);
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Authentication');
        } finally {
            Utils.hideLoading(submitBtn, originalText);
        }
    }

    async signInWithEmail(email, password) {
        if (typeof auth !== 'undefined' && auth) {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            await this.updateUserProfile(userCredential.user);
            return userCredential.user;
        } else {
            // Demo mode - simulate successful login
            console.log('🔧 Demo login with email:', email);
            const demoUser = { uid: 'demo-user', email: email, displayName: 'Demo User' };
            this.currentUser = demoUser;
            this.handleAuthStateChange(demoUser);
            return demoUser;
        }
    }

    async signUpWithEmail(email, password, displayName) {
        if (typeof auth !== 'undefined' && auth) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }
            
            // Create user document in Firestore
            await this.createUserDocument(userCredential.user, { displayName });
            
            return userCredential.user;
        } else {
            // Demo mode - simulate successful signup
            console.log('🔧 Demo signup with email:', email);
            const demoUser = { uid: 'demo-user-new', email: email, displayName: displayName || 'Demo User' };
            this.currentUser = demoUser;
            this.handleAuthStateChange(demoUser);
            return demoUser;
        }
    }

    async signInWithGoogle() {
        try {
            if (typeof auth !== 'undefined' && auth && this.googleProvider) {
                const result = await auth.signInWithPopup(this.googleProvider);
                await this.createUserDocument(result.user);
                return result.user;
            } else {
                // Demo mode - simulate Google login
                console.log('🔧 Demo Google login');
                const demoUser = { uid: 'demo-google-user', email: 'demo@google.com', displayName: 'Demo Google User' };
                this.currentUser = demoUser;
                this.handleAuthStateChange(demoUser);
                return demoUser;
            }
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                ErrorHandler.handle(error, 'Google Authentication');
            }
        }
    }

    async signOut() {
        try {
            if (typeof auth !== 'undefined' && auth) {
                await auth.signOut();
            } else {
                // Demo mode - simulate signout
                console.log('🔧 Demo signout');
                this.currentUser = null;
                this.handleAuthStateChange(null);
            }
            // Clear local storage
            Utils.storage.remove('userPreferences');
            Utils.storage.remove('cachedTransactions');
        } catch (error) {
            ErrorHandler.handle(error, 'Sign Out');
        }
    }

    async createUserDocument(user, additionalData = {}) {
        if (!user) return;
        
        const userRef = db.collection('users').doc(user.uid);
        const snapshot = await userRef.get();
        
        if (!snapshot.exists) {
            const { displayName, email, photoURL } = user;
            const createdAt = new Date();
            
            const userData = {
                displayName: displayName || additionalData.displayName || 'Usuário',
                email,
                photoURL: photoURL || null,
                createdAt,
                updatedAt: createdAt,
                preferences: {
                    currency: 'BRL',
                    theme: 'light',
                    notifications: {
                        email: true,
                        push: true,
                        budgetAlerts: true
                    },
                    monthlyBudget: 0
                },
                stats: {
                    totalTransactions: 0,
                    totalIncome: 0,
                    totalExpenses: 0,
                    currentBalance: 0
                },
                ...additionalData
            };
            
            try {
                await userRef.set(userData);
                console.log('User document created successfully');
            } catch (error) {
                console.error('Error creating user document:', error);
            }
        }
    }

    async updateUserProfile(user) {
        if (!user) return;
        
        const userRef = db.collection('users').doc(user.uid);
        
        try {
            await userRef.update({
                lastLoginAt: new Date(),
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    }

    handleAuthStateChange(user) {
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const loadingScreen = document.getElementById('loading-screen');
        
        if (user) {
            // User is signed in
            this.updateUserUI(user);
            
            if (authSection) authSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            
            // Initialize dashboard
            if (window.DashboardManager) {
                DashboardManager.init(user);
            }
            
            // Load user data
            this.loadUserData(user);
            
        } else {
            // User is signed out
            if (authSection) authSection.classList.remove('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
        }
        
        // Hide loading screen
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
        }
        
        // Notify listeners
        this.authStateListeners.forEach(listener => listener(user));
    }

    updateUserUI(user) {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar) {
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=10b981&color=fff`;
        }
        
        if (userName) {
            userName.textContent = user.displayName || user.email.split('@')[0];
        }
    }

    async loadUserData(user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Store user preferences
                Utils.storage.set('userPreferences', userData.preferences);
                
                // Apply theme
                if (userData.preferences?.theme) {
                    ThemeManager.setTheme(userData.preferences.theme);
                }
                
                // Update monthly goal display
                const monthlyGoal = document.getElementById('monthly-goal');
                if (monthlyGoal && userData.preferences?.monthlyBudget) {
                    monthlyGoal.textContent = Utils.formatCurrency(userData.preferences.monthlyBudget);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    switchToLogin() {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const nameField = document.getElementById('name-field');
        const submitBtn = document.getElementById('auth-submit');
        
        loginTab.classList.add('border-emerald-500', 'text-emerald-600');
        loginTab.classList.remove('border-gray-200', 'text-gray-500');
        
        registerTab.classList.remove('border-emerald-500', 'text-emerald-600');
        registerTab.classList.add('border-gray-200', 'text-gray-500');
        
        nameField.classList.add('hidden');
        submitBtn.textContent = 'Entrar';
    }

    switchToRegister() {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const nameField = document.getElementById('name-field');
        const submitBtn = document.getElementById('auth-submit');
        
        registerTab.classList.add('border-emerald-500', 'text-emerald-600');
        registerTab.classList.remove('border-gray-200', 'text-gray-500');
        
        loginTab.classList.remove('border-emerald-500', 'text-emerald-600');
        loginTab.classList.add('border-gray-200', 'text-gray-500');
        
        nameField.classList.remove('hidden');
        submitBtn.textContent = 'Cadastrar';
    }

    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        
        // Call immediately with current state
        callback(this.currentUser);
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    async updateUserPreferences(preferences) {
        if (!this.currentUser) return;
        
        try {
            const userRef = db.collection('users').doc(this.currentUser.uid);
            await userRef.update({
                preferences: preferences,
                updatedAt: new Date()
            });
            
            Utils.storage.set('userPreferences', preferences);
        } catch (error) {
            ErrorHandler.handle(error, 'Update Preferences');
        }
    }

    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            if (window.NotificationManager) {
                NotificationManager.show('Email de recuperação enviado!', 'success');
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Password Reset');
        }
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AuthManager = authManager;
}