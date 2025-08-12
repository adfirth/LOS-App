// Authentication Module
// Handles all user authentication, admin checks, and session management

class AuthManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.adminStatus = false;
        this.adminUserId = null;
        this.tokenRefreshInterval = null;
        this.sessionCheckInterval = null;
        this.sessionWarningInterval = null;
    }

    // Initialize the auth manager
    async initialize(db, auth) {
        this.db = db;
        this.auth = auth;
        this.setupAuthListener();
        this.setupAdminPageHandling();
    }

    // Set up Firebase auth state listener
    setupAuthListener() {
        if (!this.auth) {
            console.warn('Firebase auth not available yet, retrying in 100ms');
            setTimeout(() => this.setupAuthListener(), 100);
            return;
        }

        this.auth.onAuthStateChanged(user => {
            console.log('Auth state changed - User:', user ? user.email : 'null');
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    // Handle authentication state changes
    async handleAuthStateChange(user) {
        try {
            if (user) {
                await this.handleUserSignIn(user);
            } else {
                this.handleUserSignOut();
            }
        } catch (error) {
            console.error('Error in auth state change handler:', error);
        }
    }

    // Handle user sign in
    async handleUserSignIn(user) {
        // Ensure database is initialized
        if (!this.db && window.db) {
            this.db = window.db;
        }

        const onIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        const onDashboardPage = window.location.pathname.endsWith('dashboard.html');
        const onAdminPage = window.location.pathname.endsWith('admin.html');

        if (onDashboardPage) {
            // Reset initialization flags when user logs in
            if (window.resetAsItStandsInitialization) {
                window.resetAsItStandsInitialization();
            }
            if (window.renderDashboard) {
                await window.renderDashboard(user);
            }
        }

        if (onAdminPage) {
            await this.handleAdminPageAccess(user);
        }
    }

    // Handle user sign out
    handleUserSignOut() {
        console.log('User signed out');
        this.clearAdminStatus();
        this.stopAdminTokenRefresh();
        this.stopAdminSessionMonitoring();

        if (window.location.pathname.endsWith('admin.html')) {
            this.showAdminLoginForm();
        }
    }

    // Handle admin page access
    async handleAdminPageAccess(user) {
        console.log('On admin page, checking admin status for user:', user.uid);
        
        // Hide loading message first
        const loadingElement = document.querySelector('#admin-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Hide login form initially
        const loginForm = document.querySelector('#admin-login-form');
        if (loginForm) {
            loginForm.style.display = 'none';
        }

        try {
            const adminDoc = await this.db.collection('users').doc(user.uid).get();
            
            if (adminDoc.exists && adminDoc.data().isAdmin === true) {
                await this.grantAdminAccess(user);
            } else {
                this.denyAdminAccess();
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
            this.showAdminError('Error verifying admin status. Please try again.');
        }
    }

    // Grant admin access
    async grantAdminAccess(user) {
        console.log("Admin access granted.");
        
        // Store admin status
        this.adminStatus = true;
        this.adminUserId = user.uid;
        sessionStorage.setItem('adminStatus', 'true');
        sessionStorage.setItem('adminUserId', user.uid);

        // Hide login form and show admin panel
        const loginForm = document.querySelector('#admin-login-form');
        if (loginForm) {
            loginForm.style.display = 'none';
        }
        
        const adminPanel = document.querySelector('#admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'flex';
        }

        // Initialize admin functionality
        this.initializeAdminLoginHandlers();
        this.startAdminTokenRefresh(user);
        this.startAdminSessionMonitoring();

        // Load settings and render admin panel
        await this.loadAdminPanelSettings();
    }

    // Deny admin access
    denyAdminAccess() {
        console.log("Admin access denied for user:", this.currentUser?.email);
        this.clearAdminStatus();
        
        this.showAdminError('Access denied. You do not have admin privileges.');
        
        // Redirect to home page after a delay
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 3000);
    }

    // Show admin error
    showAdminError(message) {
        const errorElement = document.querySelector('#admin-error');
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.innerHTML = `<p>${message}</p>`;
        }
    }

    // Show admin login form
    showAdminLoginForm() {
        const loadingElement = document.querySelector('#admin-loading');
        const loginForm = document.querySelector('#admin-login-form');
        const adminPanel = document.querySelector('#admin-panel');
        const errorElement = document.querySelector('#admin-error');

        if (loadingElement) loadingElement.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';

        this.initializeAdminLoginHandlers();
    }

    // Initialize admin login handlers
    initializeAdminLoginHandlers() {
        const adminLoginForm = document.querySelector('#admin-login-form-element');
        const adminLogoutBtn = document.querySelector('#admin-logout-btn');

        if (adminLoginForm) {
            adminLoginForm.removeEventListener('submit', this.handleAdminLogin.bind(this));
            adminLoginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        }

        if (adminLogoutBtn) {
            adminLogoutBtn.removeEventListener('click', this.handleAdminLogout.bind(this));
            adminLogoutBtn.addEventListener('click', this.handleAdminLogout.bind(this));
        }
    }

    // Handle admin login
    async handleAdminLogin(e) {
        e.preventDefault();
        console.log('Admin login form submitted');

        const email = document.querySelector('#admin-login-email').value;
        const password = document.querySelector('#admin-login-password').value;
        const errorMessage = document.querySelector('#admin-error-message');

        // Clear previous error
        errorMessage.textContent = '';

        try {
            // Show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';

            // Sign in with Firebase
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check admin status
            const adminDoc = await this.db.collection('users').doc(user.uid).get();

            if (!adminDoc.exists || adminDoc.data().isAdmin !== true) {
                await this.auth.signOut();
                errorMessage.textContent = 'Access denied. You do not have admin privileges.';
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }

            // Login successful - auth state change will handle the rest
            console.log('Admin login successful');

        } catch (error) {
            console.error('Admin login error:', error);
            this.handleAdminLoginError(error, errorMessage, submitButton, originalText);
        }
    }

    // Handle admin login errors
    handleAdminLoginError(error, errorMessage, submitButton, originalText) {
        let errorMessageText = 'Login failed: ';
        
        if (error.code === 'auth/user-not-found') {
            errorMessageText += 'User not found. Please check your email address.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessageText += 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessageText += 'Invalid email address format.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessageText += 'Too many failed attempts. Please try again later.';
        } else {
            errorMessageText += error.message;
        }

        errorMessage.textContent = errorMessageText;

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    // Handle admin logout
    async handleAdminLogout() {
        event.preventDefault();
        event.stopPropagation();

        console.log('Admin logout initiated');

        // Clear all admin-related intervals
        this.stopAdminTokenRefresh();
        this.stopAdminSessionMonitoring();

        // Clear admin status
        this.clearAdminStatus();

        // Show loading state
        const logoutBtn = event.target;
        const originalText = logoutBtn.innerHTML;
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';

        try {
            await this.auth.signOut();
            console.log('Admin logged out successfully, redirecting to home page');

            // Show success message and redirect
            this.showLogoutSuccessMessage();
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);

        } catch (error) {
            console.error('Logout error:', error);
            this.handleLogoutError(error, logoutBtn, originalText);
        }
    }

    // Show logout success message
    showLogoutSuccessMessage() {
        const successMessage = document.createElement('div');
        successMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 2rem; color: #155724; z-index: 9999; text-align: center;';
        successMessage.innerHTML = '<i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br><strong>Logged out successfully!</strong><br>Redirecting to home page...';
        document.body.appendChild(successMessage);
    }

    // Handle logout error
    handleLogoutError(error, logoutBtn, originalText) {
        logoutBtn.disabled = false;
        logoutBtn.innerHTML = originalText;

        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 2rem; color: #721c24; z-index: 9999; text-align: center;';
        errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br><strong>Logout failed!</strong><br>${error.message}<br><br><button onclick="this.parentElement.remove()" style="padding: 0.5rem 1rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>`;
        document.body.appendChild(errorMessage);
    }

    // Admin token refresh mechanism
    startAdminTokenRefresh(user) {
        this.stopAdminTokenRefresh();
        
        this.tokenRefreshInterval = setInterval(async () => {
            try {
                if (user) {
                    const token = await user.getIdToken(true);
                    console.log('Admin token refreshed successfully');
                    
                    // Verify admin status is still valid
                    if (this.adminStatus) {
                        const doc = await this.db.collection('users').doc(user.uid).get();
                        if (!doc.exists || doc.data().isAdmin !== true) {
                            console.log('Admin status revoked, logging out');
                            this.clearAdminStatus();
                            await this.auth.signOut();
                            window.location.href = '/index.html';
                        }
                    }
                }
            } catch (error) {
                console.error('Error refreshing admin token:', error);
                try {
                    await this.auth.signOut();
                    window.location.href = '/index.html';
                } catch (logoutError) {
                    console.error('Error during logout after token refresh failure:', logoutError);
                }
            }
        }, 50 * 60 * 1000); // 50 minutes

        console.log('Admin token refresh started');
    }

    stopAdminTokenRefresh() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
            console.log('Admin token refresh stopped');
        }
    }

    // Admin session management
    startAdminSessionMonitoring() {
        let lastActivity = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        // Track user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });

        // Check session timeout every minute
        this.sessionCheckInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity > sessionTimeout) {
                console.log('Admin session timed out due to inactivity');
                this.handleAdminSessionTimeout();
            }
        }, 60 * 1000);

        // Show session timeout warning at 25 minutes
        this.sessionWarningInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity > (sessionTimeout - 5 * 60 * 1000)) {
                this.showSessionTimeoutWarning();
            }
        }, 60 * 1000);

        console.log('Admin session monitoring started');
    }

    stopAdminSessionMonitoring() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
        if (this.sessionWarningInterval) {
            clearInterval(this.sessionWarningInterval);
            this.sessionWarningInterval = null;
        }
        console.log('Admin session monitoring stopped');
    }

    // Session timeout handling
    showSessionTimeoutWarning() {
        if (sessionStorage.getItem('sessionWarningShown')) {
            return;
        }

        sessionStorage.setItem('sessionWarningShown', 'true');

        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; color: #856404; z-index: 9999; max-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        warningDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem; color: #f39c12;"></i>
                <strong>Session Timeout Warning</strong>
            </div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Your admin session will expire in 5 minutes due to inactivity.</p>
            <button onclick="window.authManager.extendAdminSession()" style="padding: 0.5rem 1rem; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
                Extend Session
            </button>
            <button onclick="this.parentElement.remove()" style="padding: 0.5rem 1rem; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Dismiss
            </button>
        `;

        document.body.appendChild(warningDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warningDiv.parentElement) {
                warningDiv.remove();
            }
        }, 10000);
    }

    extendAdminSession() {
        // Update last activity time
        document.dispatchEvent(new Event('mousemove'));

        // Remove warning
        const warnings = document.querySelectorAll('div[style*="position: fixed"]');
        warnings.forEach(warning => {
            if (warning.innerHTML.includes('Session Timeout Warning')) {
                warning.remove();
            }
        });

        // Show confirmation
        const confirmDiv = document.createElement('div');
        confirmDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 1rem; color: #155724; z-index: 9999; max-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        confirmDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <i class="fas fa-check-circle" style="margin-right: 0.5rem; color: #28a745;"></i>
                <strong>Session Extended</strong>
            </div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Your admin session has been extended.</p>
        `;

        document.body.appendChild(confirmDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (confirmDiv.parentElement) {
                confirmDiv.remove();
            }
        }, 3000);
    }

    handleAdminSessionTimeout() {
        console.log('Handling admin session timeout');

        this.stopAdminSessionMonitoring();
        this.stopAdminTokenRefresh();
        this.clearAdminStatus();

        // Show timeout message
        const timeoutDiv = document.createElement('div');
        timeoutDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 2rem; color: #721c24; z-index: 9999; text-align: center; max-width: 400px;';
        timeoutDiv.innerHTML = `
            <i class="fas fa-clock" style="font-size: 3rem; margin-bottom: 1rem; color: #dc3545;"></i>
            <h3>Session Expired</h3>
            <p>Your admin session has expired due to inactivity. You will be redirected to the login page.</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-redo"></i> Return to Login
            </button>
        `;

        document.body.appendChild(timeoutDiv);

        // Redirect after 5 seconds
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

    // Clear admin status
    clearAdminStatus() {
        this.adminStatus = false;
        this.adminUserId = null;
        sessionStorage.removeItem('adminStatus');
        sessionStorage.removeItem('adminUserId');
        sessionStorage.removeItem('sessionWarningShown');
    }

    // Check admin status from storage
    checkAdminStatusFromStorage() {
        const adminStatus = sessionStorage.getItem('adminStatus');
        const adminUserId = sessionStorage.getItem('adminUserId');

        if (adminStatus === 'true' && adminUserId) {
            if (this.auth && this.auth.currentUser && this.auth.currentUser.uid === adminUserId) {
                return true;
            } else {
                this.clearAdminStatus();
            }
        }
        return false;
    }

    // Load admin panel settings
    async loadAdminPanelSettings() {
        try {
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                console.log('Settings loaded successfully:', settingsData);

                // Store settings globally for other functions to access
                window.settings = settingsData;

                // Update global variables
                window.currentActiveEdition = settingsData.active_edition || 1;
                window.currentActiveGameweek = settingsData.active_gameweek || '1';

                if (typeof window.buildAdminDashboard === 'function') {
                    window.buildAdminDashboard(settingsData);
                } else {
                    console.warn('buildAdminDashboard function not available');
                }
            } else {
                console.warn('Settings document not found, creating default settings');
                await this.createDefaultSettings();
            }
        } catch (error) {
            console.error('Error loading admin panel settings:', error);
            this.showSettingsError('Failed to load competition settings');
        }
    }

    // Create default settings
    async createDefaultSettings() {
        const defaultSettings = {
            active_edition: 1,
            active_gameweek: '1',
            lastUpdated: new Date().toISOString()
        };

        try {
            await this.db.collection('settings').doc('currentCompetition').set(defaultSettings);
            console.log('Default settings created');

            window.settings = defaultSettings;

            window.currentActiveEdition = defaultSettings.active_edition;
            window.currentActiveGameweek = defaultSettings.active_gameweek;

            if (typeof window.buildAdminDashboard === 'function') {
                window.buildAdminDashboard(defaultSettings);
            }
        } catch (createError) {
            console.error('Error creating default settings:', createError);
            this.showSettingsError('Failed to create default settings');
        }
    }

    // Show settings error
    showSettingsError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #721c24;';
        errorDiv.innerHTML = `<strong>Settings Error:</strong> ${message}<br><button onclick="this.parentElement.remove()" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Dismiss</button>`;

        const adminPanel = document.querySelector('#admin-panel');
        if (adminPanel) {
            adminPanel.insertBefore(errorDiv, adminPanel.firstChild);
        }
    }

    // Setup admin page handling
    setupAdminPageHandling() {
        if (window.location.pathname.endsWith('admin.html')) {
            this.initializeAdminPage();
            this.initializeAdminPageVisibilityHandling();
        }
    }

    // Initialize admin page
    async initializeAdminPage() {
        console.log('Initializing admin page...');

        if (!this.db && window.db) {
            this.db = window.db;
        }

        if (!this.db) {
            console.error('Database not available, retrying in 100ms');
            setTimeout(() => this.initializeAdminPage(), 100);
            return;
        }

        // Show loading state initially
        this.showAdminLoadingState();

        // Check if user is already authenticated and has admin status
        if (this.auth && this.auth.currentUser) {
            console.log('User already authenticated, checking admin status...');
            const user = this.auth.currentUser;

            try {
                const adminDoc = await this.db.collection('users').doc(user.uid).get();
                if (adminDoc.exists && adminDoc.data().isAdmin === true) {
                    await this.grantAdminAccess(user);
                } else {
                    this.showAdminLoginForm();
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                this.showAdminLoginForm();
            }
        } else {
            console.log('No user authenticated, showing login form');
            this.showAdminLoginForm();
        }
    }

    // Show admin loading state
    showAdminLoadingState() {
        const loadingElement = document.querySelector('#admin-loading');
        const loginForm = document.querySelector('#admin-login-form');
        const adminPanel = document.querySelector('#admin-panel');
        const errorElement = document.querySelector('#admin-error');

        if (loadingElement) loadingElement.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
    }

    // Initialize admin page visibility handling
    initializeAdminPageVisibilityHandling() {
        let hiddenTime = 0;
        const maxHiddenTime = 15 * 60 * 1000; // 15 minutes

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                hiddenTime = Date.now();
                console.log('Admin page hidden, starting hidden time tracking');
            } else {
                if (hiddenTime > 0) {
                    const timeHidden = Date.now() - hiddenTime;
                    console.log('Admin page visible again, was hidden for', Math.round(timeHidden / 1000), 'seconds');

                    if (timeHidden > maxHiddenTime) {
                        console.log('Page was hidden too long, logging out admin');
                        this.handleAdminSessionTimeout();
                    } else {
                        hiddenTime = 0;
                    }
                }
            }
        });

        // Handle window focus/blur for additional security
        window.addEventListener('blur', () => {
            if (document.hidden) {
                hiddenTime = Date.now();
            }
        });

        window.addEventListener('focus', () => {
            if (hiddenTime > 0) {
                const timeHidden = Date.now() - hiddenTime;
                if (timeHidden > maxHiddenTime) {
                    this.handleAdminSessionTimeout();
                } else {
                    hiddenTime = 0;
                }
            }
        });
    }
}

// Export the AuthManager class
export default AuthManager;
