// Teams configuration - imported from teams-config.js

// Global database reference
let db;

// Global variable to track current active edition
let currentActiveEdition = 1;
let currentEditionName = "Edition 1";
// Global variable to track current active gameweek
let currentActiveGameweek = '1';
// The allTeams array is now defined in TEAMS_CONFIG.allTeams

// Initialize database reference when DOM is ready
function initializeDatabase() {
    if (window.db) {
        db = window.db;
        console.log('Database reference initialized');
    } else {
        console.warn('Database not available yet, retrying in 100ms');
        setTimeout(initializeDatabase, 100);
    }
}

// Also try to initialize database when Firebase becomes available
function checkAndInitializeDatabase() {
    if (window.db && !db) {
        db = window.db;
        console.log('Database reference initialized in checkAndInitializeDatabase');
    }
}

// Initialize database when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDatabase);

// Initialize auth listener when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAuthListener);

// Set up periodic database check for admin page
if (window.location.pathname.endsWith('admin.html')) {
    setInterval(checkAndInitializeDatabase, 100);
}

// Helper function to get the active gameweek from settings
function getActiveGameweek() {
    return currentActiveGameweek;
}

// --- AUTH STATE & LOGOUT LOGIC (GLOBAL) ---
// Wait for Firebase to be initialized before setting up auth listener
function initializeAuthListener() {
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            console.log('Auth state changed - User:', user ? user.email : 'null');
            
            // Ensure database is initialized
            checkAndInitializeDatabase();
            
            try {
                const onIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
                const onDashboardPage = window.location.pathname.endsWith('dashboard.html');
                const onAdminPage = window.location.pathname.endsWith('admin.html'); // NEW

                if (user) {
                    // User is signed in
                    if (onIndexPage) { /* ... */ }
                    if (onDashboardPage) { renderDashboard(user).catch(console.error); }
                    
                    // Admin Page Security Check
                    if (onAdminPage) {
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
                        
                        // Start token refresh mechanism for admin users
                        startAdminTokenRefresh(user);
                        
                        // Add error handling for admin check
                        db.collection('users').doc(user.uid).get().then(doc => {
                            console.log('Admin check result - doc exists:', doc.exists, 'isAdmin:', doc.exists ? doc.data().isAdmin : 'N/A');
                            if (doc.exists && doc.data().isAdmin === true) {
                                // User is an admin, show the panel
                                console.log("Admin access granted.");
                                
                                // Store admin status in session storage for persistence
                                sessionStorage.setItem('adminStatus', 'true');
                                sessionStorage.setItem('adminUserId', user.uid);
                                
                                // Hide login form and show admin panel
                                const loginForm = document.querySelector('#admin-login-form');
                                if (loginForm) {
                                    loginForm.style.display = 'none';
                                }
                                document.querySelector('#admin-panel').style.display = 'flex';
                                
                                // Initialize admin login handlers (for logout button)
                                if (typeof initializeAdminLoginHandlers === 'function') {
                                    initializeAdminLoginHandlers();
                                }
                                
                                // Fetch settings and pass them to the render function
                                console.log('Fetching settings from database...');
                                db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
                                    console.log('Settings document received:', settingsDoc.exists ? 'exists' : 'not found');
                                                            if (settingsDoc.exists) {
                            const settingsData = settingsDoc.data();
                            console.log('Settings data:', settingsData);
                            buildAdminDashboard();
                        } else {
                                        console.error("Settings document not found!");
                                    }
                                }).catch(error => {
                                    console.error("Error fetching settings:", error);
                                    // Show error message to user
                                    const errorElement = document.querySelector('#admin-error');
                                    if (errorElement) {
                                        errorElement.style.display = 'block';
                                        errorElement.innerHTML = '<p>Error loading admin panel settings. Please refresh the page.</p>';
                                    }
                                });
                            } else {
                                // User is not an admin
                                console.log("Admin access denied for user:", user.email);
                                sessionStorage.removeItem('adminStatus');
                                sessionStorage.removeItem('adminUserId');
                                
                                // Show error and redirect
                                const errorElement = document.querySelector('#admin-error');
                                if (errorElement) {
                                    errorElement.style.display = 'block';
                                    errorElement.innerHTML = '<p>Access denied. You do not have admin privileges.</p>';
                                }
                                
                                // Redirect to home page after a delay
                                setTimeout(() => {
                                    window.location.href = '/index.html';
                                }, 3000);
                            }
                        }).catch(error => {
                            console.error("Error checking admin status:", error);
                            // Show error message
                            const errorElement = document.querySelector('#admin-error');
                            if (errorElement) {
                                errorElement.style.display = 'block';
                                errorElement.innerHTML = '<p>Error verifying admin status. Please try again.</p>';
                            }
                        });
                    }
                } else {
                    // User is signed out
                    console.log('User signed out');
                    
                    // Clear admin status from session storage
                    sessionStorage.removeItem('adminStatus');
                    sessionStorage.removeItem('adminUserId');
                    
                    // Stop any admin token refresh
                    stopAdminTokenRefresh();
                    
                    if (onAdminPage) {
                        // Show login form and hide admin panel
                        const loginForm = document.querySelector('#admin-login-form');
                        const adminPanel = document.querySelector('#admin-panel');
                        const loadingElement = document.querySelector('#admin-loading');
                        const errorElement = document.querySelector('#admin-error');
                        
                        if (loginForm) {
                            loginForm.style.display = 'block';
                        }
                        if (adminPanel) {
                            adminPanel.style.display = 'none';
                        }
                        if (loadingElement) {
                            loadingElement.style.display = 'none';
                        }
                        if (errorElement) {
                            errorElement.style.display = 'none';
                        }
                    }
                }
            } catch (error) {
                console.error('Error in auth state change handler:', error);
            }
        });
    } else {
        console.warn('Firebase auth not available yet, retrying in 100ms');
        setTimeout(initializeAuthListener, 100);
    }
}

// Admin token refresh mechanism
function startAdminTokenRefresh(user) {
    // Clear any existing interval
    stopAdminTokenRefresh();
    
    // Set up token refresh every 50 minutes (tokens expire after 1 hour)
    window.adminTokenRefreshInterval = setInterval(async () => {
        try {
            if (user) {
                const token = await user.getIdToken(true); // Force refresh
                console.log('Admin token refreshed successfully');
                
                // Verify admin status is still valid
                const adminStatus = sessionStorage.getItem('adminStatus');
                if (adminStatus === 'true') {
                    const doc = await db.collection('users').doc(user.uid).get();
                    if (!doc.exists || doc.data().isAdmin !== true) {
                        console.log('Admin status revoked, logging out');
                        sessionStorage.removeItem('adminStatus');
                        sessionStorage.removeItem('adminUserId');
                        await window.auth.signOut();
                        window.location.href = '/index.html';
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing admin token:', error);
            // If token refresh fails, log out the user
            try {
                await window.auth.signOut();
                window.location.href = '/index.html';
            } catch (logoutError) {
                console.error('Error during logout after token refresh failure:', logoutError);
            }
        }
    }, 50 * 60 * 1000); // 50 minutes
    
    console.log('Admin token refresh started');
}

function stopAdminTokenRefresh() {
    if (window.adminTokenRefreshInterval) {
        clearInterval(window.adminTokenRefreshInterval);
        window.adminTokenRefreshInterval = null;
        console.log('Admin token refresh stopped');
    }
}

// Check if user has admin status from session storage
function checkAdminStatusFromStorage() {
    const adminStatus = sessionStorage.getItem('adminStatus');
    const adminUserId = sessionStorage.getItem('adminUserId');
    
    if (adminStatus === 'true' && adminUserId) {
        // Verify the stored admin status is still valid
        if (window.auth && window.auth.currentUser && window.auth.currentUser.uid === adminUserId) {
            return true;
        } else {
            // Clear invalid stored status
            sessionStorage.removeItem('adminStatus');
            sessionStorage.removeItem('adminUserId');
        }
    }
    return false;
}

// Initialize admin page with proper error handling
function initializeAdminPage() {
    console.log('Initializing admin page...');
    
    // Ensure database is initialized before proceeding
    if (!db && window.db) {
        db = window.db;
        console.log('Database reference initialized in initializeAdminPage');
    }
    
    if (!db) {
        console.error('Database not available, retrying in 100ms');
        setTimeout(initializeAdminPage, 100);
        return;
    }
    
    // Show loading state initially
    const loadingElement = document.querySelector('#admin-loading');
    const loginForm = document.querySelector('#admin-login-form');
    const adminPanel = document.querySelector('#admin-panel');
    const errorElement = document.querySelector('#admin-error');
    
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    if (loginForm) {
        loginForm.style.display = 'none';
    }
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Check if user is already authenticated and has admin status
    if (window.auth && window.auth.currentUser) {
        console.log('User already authenticated, checking admin status...');
        const user = window.auth.currentUser;
        
        // Check admin status from database
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().isAdmin === true) {
                console.log('User is admin, showing admin panel');
                
                // Store admin status
                sessionStorage.setItem('adminStatus', 'true');
                sessionStorage.setItem('adminUserId', user.uid);
                
                // Start token refresh and session monitoring
                startAdminTokenRefresh(user);
                startAdminSessionMonitoring();
                
                // Hide loading and show admin panel
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                if (adminPanel) {
                    adminPanel.style.display = 'flex';
                }
                
                // Initialize admin panel
                if (typeof initializeAdminLoginHandlers === 'function') {
                    initializeAdminLoginHandlers();
                }
                
                // Load settings and render panel
                loadAdminPanelSettings();
            } else {
                console.log('User is not admin, showing login form');
                showAdminLoginForm();
            }
        }).catch(error => {
            console.error('Error checking admin status:', error);
            showAdminLoginForm();
        });
    } else {
        console.log('No user authenticated, showing login form');
        showAdminLoginForm();
    }
}

// Show admin login form
function showAdminLoginForm() {
    const loadingElement = document.querySelector('#admin-loading');
    const loginForm = document.querySelector('#admin-login-form');
    const adminPanel = document.querySelector('#admin-panel');
    const errorElement = document.querySelector('#admin-error');
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (loginForm) {
        loginForm.style.display = 'block';
    }
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Initialize login handlers
    if (typeof initializeAdminLoginHandlers === 'function') {
        initializeAdminLoginHandlers();
    }
}

// Load admin panel settings
async function loadAdminPanelSettings() {
    // Ensure database is initialized before proceeding
    if (!db && window.db) {
        db = window.db;
        console.log('Database reference initialized in loadAdminPanelSettings');
    }
    
    if (!db) {
        console.error('Database not available in loadAdminPanelSettings');
        return;
    }
    
    try {
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        if (settingsDoc.exists) {
            const settingsData = settingsDoc.data();
            console.log('Settings loaded successfully:', settingsData);
            
            // Store settings globally for other functions to access
            window.settings = settingsData;
            
            // Update global variables
            if (settingsData.active_edition) {
                currentActiveEdition = settingsData.active_edition;
            }
            if (settingsData.active_gameweek) {
                currentActiveGameweek = settingsData.active_gameweek;
            }
            
            if (typeof buildAdminDashboard === 'function') {
                buildAdminDashboard(settingsData);
            } else {
                console.warn('buildAdminDashboard function not available');
            }
        } else {
            console.warn('Settings document not found, creating default settings');
            // Create default settings if they don't exist
            const defaultSettings = {
                activeEdition: 1,
                activeGameweek: '1',
                lastUpdated: new Date().toISOString()
            };
            
            try {
                await db.collection('settings').doc('currentCompetition').set(defaultSettings);
                console.log('Default settings created');
                
                // Store default settings globally
                window.settings = defaultSettings;
                
                // Update global variables
                if (defaultSettings.active_edition) {
                    currentActiveEdition = defaultSettings.active_edition;
                }
                if (defaultSettings.active_gameweek) {
                    currentActiveGameweek = defaultSettings.active_gameweek;
                }
                
                if (typeof buildAdminDashboard === 'function') {
                    buildAdminDashboard(defaultSettings);
                }
            } catch (createError) {
                console.error('Error creating default settings:', createError);
                showSettingsError('Failed to create default settings');
            }
        }
    } catch (error) {
        console.error('Error loading admin panel settings:', error);
        showSettingsError('Failed to load competition settings');
    }
}

// Show settings error message
function showSettingsError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #721c24;';
    errorDiv.innerHTML = '<strong>Settings Error:</strong> ' + message + '<br><button onclick="this.parentElement.remove()" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Dismiss</button>';
    
    const adminPanel = document.querySelector('#admin-panel');
    if (adminPanel) {
        adminPanel.insertBefore(errorDiv, adminPanel.firstChild);
    }
}

// Admin session management
function startAdminSessionMonitoring() {
    // Monitor for user activity
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
    window.adminSessionCheckInterval = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        
        if (timeSinceLastActivity > sessionTimeout) {
            console.log('Admin session timed out due to inactivity');
            handleAdminSessionTimeout();
        }
    }, 60 * 1000); // Check every minute
    
    // Show session timeout warning at 25 minutes
    window.adminSessionWarningInterval = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        
        if (timeSinceLastActivity > (sessionTimeout - 5 * 60 * 1000)) { // 25 minutes
            showSessionTimeoutWarning();
        }
    }, 60 * 1000);
    
    console.log('Admin session monitoring started');
}

function stopAdminSessionMonitoring() {
    if (window.adminSessionCheckInterval) {
        clearInterval(window.adminSessionCheckInterval);
        window.adminSessionCheckInterval = null;
    }
    if (window.adminSessionWarningInterval) {
        clearInterval(window.adminSessionWarningInterval);
        window.adminSessionWarningInterval = null;
    }
    console.log('Admin session monitoring stopped');
}

function showSessionTimeoutWarning() {
    // Only show warning once per session
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
        <button onclick="extendAdminSession()" style="padding: 0.5rem 1rem; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
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

function extendAdminSession() {
    // Update last activity time
    if (window.adminSessionCheckInterval) {
        // This will trigger the activity update in the next check
        document.dispatchEvent(new Event('mousemove'));
    }
    
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

function handleAdminSessionTimeout() {
    console.log('Handling admin session timeout');
    
    // Stop all monitoring
    stopAdminSessionMonitoring();
    stopAdminTokenRefresh();
    
    // Clear session storage
    sessionStorage.removeItem('adminStatus');
    sessionStorage.removeItem('adminUserId');
    sessionStorage.removeItem('sessionWarningShown');
    
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

// Handle page visibility changes for admin session
function initializeAdminPageVisibilityHandling() {
    let hiddenTime = 0;
    const maxHiddenTime = 15 * 60 * 1000; // 15 minutes
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page became hidden
            hiddenTime = Date.now();
            console.log('Admin page hidden, starting hidden time tracking');
        } else {
            // Page became visible
            if (hiddenTime > 0) {
                const timeHidden = Date.now() - hiddenTime;
                console.log('Admin page visible again, was hidden for', Math.round(timeHidden / 1000), 'seconds');
                
                if (timeHidden > maxHiddenTime) {
                    console.log('Page was hidden too long, logging out admin');
                    handleAdminSessionTimeout();
                } else {
                    // Reset hidden time
                    hiddenTime = 0;
                }
            }
        }
    });
    
    // Also handle window focus/blur for additional security
    window.addEventListener('blur', () => {
        if (document.hidden) {
            hiddenTime = Date.now();
        }
    });
    
    window.addEventListener('focus', () => {
        if (hiddenTime > 0) {
            const timeHidden = Date.now() - hiddenTime;
            if (timeHidden > maxHiddenTime) {
                handleAdminSessionTimeout();
            } else {
                hiddenTime = 0;
            }
        }
    });
}

// Initialize admin page visibility handling when admin page loads
if (typeof window !== 'undefined' && window.location && window.location.pathname.endsWith('admin.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for Firebase to be ready
        setTimeout(() => {
            if (typeof initializeAdminPageVisibilityHandling === 'function') {
                initializeAdminPageVisibilityHandling();
            }
        }, 1000);
    });
}

// --- ADMIN LOGIN FORM HANDLER ---
function initializeAdminLoginHandlers() {
    console.log('Initializing admin login handlers...');
    
    const adminLoginForm = document.querySelector('#admin-login-form-element');
    const adminLogoutBtn = document.querySelector('#admin-logout-btn');
    
    console.log('Found admin login form:', !!adminLoginForm);
    console.log('Found admin logout button:', !!adminLogoutBtn);
    
    if (adminLoginForm) {
        // Remove existing event listener to prevent duplicates
        adminLoginForm.removeEventListener('submit', handleAdminLogin);
        adminLoginForm.addEventListener('submit', handleAdminLogin);
        console.log('Admin login form event listener added');
    }
    
    if (adminLogoutBtn) {
        // Remove existing event listener to prevent duplicates
        adminLogoutBtn.removeEventListener('click', handleAdminLogout);
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
        console.log('Admin logout button event listener added');
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    console.log('Admin login form submitted');
    
    const email = document.querySelector('#admin-login-email').value;
    const password = document.querySelector('#admin-login-password').value;
    const errorMessage = document.querySelector('#admin-error-message');
    
    console.log('Form values - Email:', email, 'Password length:', password.length);
    
    // Clear previous error
    errorMessage.textContent = '';
    
    console.log('Attempting admin login with email:', email);
    
    // Check if auth is available
    if (!window.auth) {
        console.error('Firebase auth not available');
        errorMessage.textContent = 'Error: Authentication service not available';
        return;
    }
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        // Sign in with Firebase
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        console.log('Admin login successful');
        console.log('User credential:', userCredential);
        
        // Check admin status immediately
        const user = userCredential.user;
        const adminDoc = await db.collection('users').doc(user.uid).get();
        
        if (!adminDoc.exists || adminDoc.data().isAdmin !== true) {
            // User is not an admin, sign them out and show error
            await window.auth.signOut();
            errorMessage.textContent = 'Access denied. You do not have admin privileges.';
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        // User is an admin, store status and proceed
        sessionStorage.setItem('adminStatus', 'true');
        sessionStorage.setItem('adminUserId', user.uid);
        
        // Start token refresh and session monitoring
        startAdminTokenRefresh(user);
        startAdminSessionMonitoring();
        
        // Hide login form and show admin panel
        const loginForm = document.querySelector('#admin-login-form');
        const loadingElement = document.querySelector('#admin-loading');
        const errorElement = document.querySelector('#admin-error');
        
        if (loginForm) {
            loginForm.style.display = 'none';
        }
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        document.querySelector('#admin-panel').style.display = 'flex';
        
        // Initialize admin login handlers
        if (typeof initializeAdminLoginHandlers === 'function') {
            initializeAdminLoginHandlers();
        }
        
        // Fetch settings and render admin panel
        try {
            const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
            if (settingsDoc.exists) {
                buildAdminDashboard();
            } else {
                console.error("Settings document not found!");
                // Show warning but don't block access
                const warningElement = document.createElement('div');
                warningElement.style.cssText = 'background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #856404;';
                warningElement.innerHTML = '<strong>Warning:</strong> Competition settings not found. Some features may not work properly.';
                document.querySelector('#admin-panel').insertBefore(warningElement, document.querySelector('#admin-panel').firstChild);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Show error but don't block access
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #721c24;';
            errorDiv.innerHTML = '<strong>Error:</strong> Failed to load competition settings. Please refresh the page.';
            document.querySelector('#admin-panel').insertBefore(errorDiv, document.querySelector('#admin-panel').firstChild);
        }
        
    } catch (error) {
        console.error('Admin login error:', error);
        
        // Provide more specific error messages
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
        
        // Re-enable submit button
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Admin Login';
        }
    }
}

function handleAdminLogout() {
    // Prevent this from being treated as a tab click
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Admin logout initiated');
    
    // Clear all admin-related intervals
    stopAdminTokenRefresh();
    stopAdminSessionMonitoring();
    
    if (window.adminButtonStateCheckInterval) {
        clearInterval(window.adminButtonStateCheckInterval);
        window.adminButtonStateCheckInterval = null;
    }
    
    // Clear admin status from session storage
    sessionStorage.removeItem('adminStatus');
    sessionStorage.removeItem('adminUserId');
    sessionStorage.removeItem('sessionWarningShown');
    
    // Show loading state on logout button
    const logoutBtn = event.target;
    const originalText = logoutBtn.innerHTML;
    logoutBtn.disabled = true;
    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
    
    // Sign out from Firebase
    if (window.auth) {
        window.auth.signOut().then(() => {
            console.log('Admin logged out successfully, redirecting to home page');
            
            // Show success message briefly before redirect
            const successMessage = document.createElement('div');
            successMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 2rem; color: #155724; z-index: 9999; text-align: center;';
            successMessage.innerHTML = '<i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br><strong>Logged out successfully!</strong><br>Redirecting to home page...';
            document.body.appendChild(successMessage);
            
            // Redirect to home page after a brief delay
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        }).catch((error) => {
            console.error('Logout error:', error);
            
            // Re-enable logout button
            logoutBtn.disabled = false;
            logoutBtn.innerHTML = originalText;
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 2rem; color: #721c24; z-index: 9999; text-align: center;';
            errorMessage.innerHTML = '<i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br><strong>Logout failed!</strong><br>' + error.message + '<br><br><button onclick="this.parentElement.remove()" style="padding: 0.5rem 1rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>';
            document.body.appendChild(errorMessage);
        });
    } else {
        console.error('Firebase auth not available for logout');
        // Re-enable logout button
        logoutBtn.disabled = false;
        logoutBtn.innerHTML = originalText;
        
        // Force redirect
        window.location.href = '/index.html';
    }
}

// --- REGISTRATION LOGIC ---
let currentEdition = 1;

// Function to update edition displays on registration page
function updateRegistrationPageEdition() {
    document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
        if (el) {
            if (currentActiveEdition === 'test') {
                el.textContent = 'Test Weeks';
            } else {
                el.textContent = `Edition ${currentActiveEdition}`;
            }
        }
    });
    
    // Update registration information based on current active edition
    const registrationInfo = document.getElementById('registration-info');
    if (registrationInfo) {
        if (currentActiveEdition === 'test') {
            registrationInfo.innerHTML = `
                <h4>Registration Information</h4>
                <p><strong>Status:</strong> By invitation only</p>
            `;
        } else {
            registrationInfo.innerHTML = `
                <h4>Registration Information</h4>
                <p><strong>Entry Fee:</strong> £10 per edition</p>
                <p><strong>Prize Pool:</strong> 50% of total entry fees</p>
                <p><strong>Format:</strong> 10 game weeks</p>
            `;
        }
    }
}

// Function to update edition display based on selection
function updateEditionDisplay() {
    const editionSelection = document.getElementById('edition-selection');
    if (!editionSelection) return;
    
    const selectedEdition = editionSelection.value;
    let displayText = 'Edition 1'; // Default
    
    if (selectedEdition === 'test') {
        displayText = 'Test Weeks';
    } else if (selectedEdition === '1') {
        displayText = 'Edition 1';
    }
    
    // Update all edition displays
    document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
        if (el) {
            el.textContent = displayText;
        }
    });
    
    // Update registration information based on edition selection
    const registrationInfo = document.getElementById('registration-info');
    if (registrationInfo) {
        if (selectedEdition === 'test') {
            registrationInfo.innerHTML = `
                <h4>Registration Information</h4>
                <p><strong>Status:</strong> By invitation only</p>
            `;
        } else {
            registrationInfo.innerHTML = `
                <h4>Registration Information</h4>
                <p><strong>Entry Fee:</strong> £10 per edition</p>
                <p><strong>Prize Pool:</strong> 50% of total entry fees</p>
                <p><strong>Format:</strong> 10 game weeks</p>
            `;
        }
    }
}

// Function to get user's edition from registration data
function getUserEdition(userData) {
    if (!userData || !userData.registrations) {
        return 1; // Default to Edition 1 if no registration data
    }
    
    // If user has a preferred edition set, use that
    if (userData.preferredEdition) {
        return userData.preferredEdition;
    }
    
    // Check for Test Weeks registration first
    if (userData.registrations.editiontest) {
        return 'test';
    }
    
    // Check for Edition 1 registration
    if (userData.registrations.edition1) {
        return 1;
    }
    
    // Check for other editions (2, 3, 4, etc.)
    for (let i = 2; i <= 10; i++) {
        if (userData.registrations[`edition${i}`]) {
            return i;
        }
    }
    
    return 1; // Default to Edition 1
}

// Function to get all editions user is registered for
function getUserRegisteredEditions(userData) {
    if (!userData || !userData.registrations) {
        return [];
    }
    
    const editions = [];
    Object.keys(userData.registrations).forEach(editionKey => {
        if (editionKey.startsWith('edition')) {
            const edition = editionKey.replace('edition', '');
            editions.push(edition);
        }
    });
    
    return editions;
}

// Function to save user's edition preference
async function saveEditionPreference(edition, userId) {
    try {
        await db.collection('users').doc(userId).update({
            preferredEdition: edition
        });
        
        // Show success message
        alert(`Edition preference saved! You are now participating in ${edition === 'test' ? 'Test Weeks' : `Edition ${edition}`}.`);
        
        // Reload the page to update fixtures and displays
        window.location.reload();
    } catch (error) {
        console.error('Error saving edition preference:', error);
        alert('Error saving edition preference. Please try again.');
    }
}

// Function to update user's default edition (admin function)
function updateUserDefaultEdition(userId, edition) {
    // Store the selected edition temporarily
    window.tempUserEdition = edition;
}

// Function to save user's default edition (admin function)
async function saveUserDefaultEdition(userId) {
    try {
        const edition = window.tempUserEdition || '';
        
        await db.collection('users').doc(userId).update({
            preferredEdition: edition || null
        });
        
        // Show success message
        const editionText = edition === 'test' ? 'Test Weeks' : edition === '1' ? 'Edition 1' : 'No default';
        alert(`Default edition updated to: ${editionText}`);
        
        // Refresh the user details modal to show updated selection
        viewUserDetails(userId);
        
    } catch (error) {
        console.error('Error saving user default edition:', error);
        alert('Error saving default edition. Please try again.');
    }
}

// Function to load current edition and update registration page
async function loadCurrentEditionForRegistration() {
    try {
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            currentActiveEdition = settings.active_edition || 1;
            updateRegistrationPageEdition();
        }
    } catch (error) {
        console.error('Error loading current edition for registration:', error);
    }
}

// Check registration window status
async function checkRegistrationWindow(edition = null) {
    try {
        // Use provided edition or fall back to current active edition
        const editionToCheck = edition || currentActiveEdition;
        const settingsDoc = await db.collection('settings').doc(`registration_edition_${editionToCheck}`).get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            // Update edition displays
            document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
                if (el) el.textContent = currentActiveEdition;
            });
            
            if (!settings.enabled) {
                const editionText = editionToCheck === 'test' ? 'Test Weeks' : `Edition ${editionToCheck}`;
                showRegistrationClosed(`${editionText} registration is currently closed`);
                return false;
            }
            
            const now = new Date();
            const startDate = settings.startDate ? new Date(settings.startDate.toDate()) : null;
            const endDate = settings.endDate ? new Date(settings.endDate.toDate()) : null;
            
            if (startDate && now < startDate) {
                const editionText = editionToCheck === 'test' ? 'Test Weeks' : `Edition ${editionToCheck}`;
                showRegistrationClosed(`${editionText} registration opens on ` + startDate.toLocaleDateString());
                return false;
            }
            
            if (endDate && now > endDate) {
                const editionText = editionToCheck === 'test' ? 'Test Weeks' : `Edition ${editionToCheck}`;
                showRegistrationClosed(`${editionText} registration closed on ` + endDate.toLocaleDateString());
                return false;
            }
            
            return true;
        }
        return true; // Default to open if no settings
    } catch (error) {
        console.error('Error checking registration window:', error);
        return true; // Default to open on error
    }
}



function showRegistrationClosed(message = 'Registration is currently closed') {
    const closedDiv = document.querySelector('#registration-closed');
    const registerForm = document.querySelector('#register-form');
    const reRegisterForm = document.querySelector('#re-register-form');
    
    if (closedDiv) {
        closedDiv.querySelector('p').textContent = message;
        closedDiv.style.display = 'block';
    }
    if (registerForm) registerForm.style.display = 'none';
    if (reRegisterForm) reRegisterForm.style.display = 'none';
}

// --- REGISTRATION MANAGEMENT FUNCTIONS ---
function initializeRegistrationManagement() {
    console.log('Initializing registration management...');
    
    const saveRegistrationSettingsBtn = document.querySelector('#save-registration-settings');
    const refreshStatsBtn = document.querySelector('#refresh-registration-stats');
    
    console.log('Save settings button found:', !!saveRegistrationSettingsBtn);
    console.log('Refresh stats button found:', !!refreshStatsBtn);
    
    if (saveRegistrationSettingsBtn) {
        saveRegistrationSettingsBtn.addEventListener('click', saveRegistrationSettings);
        console.log('Save settings event listener added');
    }
    
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', refreshRegistrationStats);
        console.log('Refresh stats event listener added');
    } else {
        console.error('Refresh stats button not found!');
    }
    
    // Load current settings
    loadRegistrationSettings();
    refreshRegistrationStats();
}

async function loadRegistrationSettings() {
    try {
        // Load settings for the currently selected edition
        await loadEditionRegistrationSettings();
        // Load overview of all editions
        await loadAllEditionsOverview();
    } catch (error) {
        console.error('Error loading registration settings:', error);
    }
}

async function loadEditionRegistrationSettings() {
    try {
        const editionForSettings = document.querySelector('#edition-for-settings');
        const editionNumber = editionForSettings ? parseInt(editionForSettings.value) : 1;
        
        const settingsDoc = await db.collection('settings').doc(`registration_edition_${editionNumber}`).get();
            
            const enabledCheckbox = document.querySelector('#registration-enabled');
            const startDateInput = document.querySelector('#registration-start-date');
            const endDateInput = document.querySelector('#registration-end-date');
        const nextStartDateInput = document.querySelector('#next-registration-start-date');
        const editionSettingsTitle = document.querySelector('#edition-settings-title');
        
        // Update the title
        if (editionSettingsTitle) {
            if (editionNumber === 'test') {
            editionSettingsTitle.textContent = `Test Weeks Registration Settings`;
        } else {
            editionSettingsTitle.textContent = `Edition ${editionNumber} Registration Settings`;
        }
        }
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            if (enabledCheckbox) enabledCheckbox.checked = settings.enabled || false;
            if (startDateInput && settings.startDate) {
                const startDate = new Date(settings.startDate.toDate());
                // Format date in local timezone instead of UTC
                const year = startDate.getFullYear();
                const month = String(startDate.getMonth() + 1).padStart(2, '0');
                const day = String(startDate.getDate()).padStart(2, '0');
                const hours = String(startDate.getHours()).padStart(2, '0');
                const minutes = String(startDate.getMinutes()).padStart(2, '0');
                startDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else if (startDateInput) {
                startDateInput.value = '';
            }
            if (endDateInput && settings.endDate) {
                const endDate = new Date(settings.endDate.toDate());
                // Format date in local timezone instead of UTC
                const year = endDate.getFullYear();
                const month = String(endDate.getMonth() + 1).padStart(2, '0');
                const day = String(endDate.getDate()).padStart(2, '0');
                const hours = String(endDate.getHours()).padStart(2, '0');
                const minutes = String(endDate.getMinutes()).padStart(2, '0');
                endDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else if (endDateInput) {
                endDateInput.value = '';
            }
            if (nextStartDateInput && settings.nextStartDate) {
                const nextStartDate = new Date(settings.nextStartDate.toDate());
                // Format date in local timezone instead of UTC
                const year = nextStartDate.getFullYear();
                const month = String(nextStartDate.getMonth() + 1).padStart(2, '0');
                const day = String(nextStartDate.getDate()).padStart(2, '0');
                const hours = String(nextStartDate.getHours()).padStart(2, '0');
                const minutes = String(nextStartDate.getMinutes()).padStart(2, '0');
                nextStartDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else if (nextStartDateInput) {
                nextStartDateInput.value = '';
            }
        } else {
            // Clear all fields if no settings exist for this edition
            if (enabledCheckbox) enabledCheckbox.checked = false;
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            if (nextStartDateInput) nextStartDateInput.value = '';
        }
    } catch (error) {
        console.error('Error loading edition registration settings:', error);
    }
}

async function loadAllEditionsOverview() {
    try {
        const editions = [1, 2, 3, 4, 'test'];
        for (const edition of editions) {
            const statusCard = document.querySelector(`#edition-${edition}-status`);
            if (!statusCard) continue;
            
            const settingsDoc = await db.collection('settings').doc(`registration_edition_${edition}`).get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                const now = new Date();
                
                let statusText = 'Not configured';
                let dateRange = 'No dates set';
                let statusClass = '';
                
                if (settings.enabled && settings.startDate && settings.endDate) {
                    const startDate = new Date(settings.startDate.toDate());
                    const endDate = new Date(settings.endDate.toDate());
                    
                    dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                    
                    if (now >= startDate && now <= endDate) {
                        statusText = 'Registration Open';
                        statusClass = 'active';
                    } else if (now < startDate) {
                        statusText = 'Upcoming';
                        statusClass = 'upcoming';
                    } else {
                        statusText = 'Registration Closed';
                        statusClass = 'closed';
                    }
                }
                
                statusCard.className = `edition-status-card ${statusClass}`;
                statusCard.querySelector('.status-text').textContent = statusText;
                statusCard.querySelector('.date-range').textContent = dateRange;
            } else {
                statusCard.className = 'edition-status-card';
                statusCard.querySelector('.status-text').textContent = 'Not configured';
                statusCard.querySelector('.date-range').textContent = 'No dates set';
            }
        }
    } catch (error) {
        console.error('Error loading all editions overview:', error);
    }
}

async function saveRegistrationSettings() {
    const editionForSettings = document.querySelector('#edition-for-settings');
    const enabledCheckbox = document.querySelector('#registration-enabled');
    const startDateInput = document.querySelector('#registration-start-date');
    const endDateInput = document.querySelector('#registration-end-date');
    const nextStartDateInput = document.querySelector('#next-registration-start-date');
    const statusElement = document.querySelector('#registration-settings-status');
    
    const editionNumber = editionForSettings ? editionForSettings.value : 1;
    
    try {
        const settings = {
            enabled: enabledCheckbox ? enabledCheckbox.checked : false,
            edition: editionNumber,
            lastUpdated: new Date()
        };
        
        if (startDateInput && startDateInput.value) {
            settings.startDate = new Date(startDateInput.value);
        }
        
        if (endDateInput && endDateInput.value) {
            settings.endDate = new Date(endDateInput.value);
        }
        
        if (nextStartDateInput && nextStartDateInput.value) {
            settings.nextStartDate = new Date(nextStartDateInput.value);
        }
        
        await db.collection('settings').doc(`registration_edition_${editionNumber}`).set(settings);
        
        if (statusElement) {
            const editionText = editionNumber === 'test' ? 'Test Weeks' : `Edition ${editionNumber}`;
            statusElement.textContent = `${editionText} registration settings saved successfully!`;
            statusElement.className = 'status-message success';
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }, 3000);
        }
        
        // Refresh the overview
        await loadAllEditionsOverview();
        
        console.log(`Edition ${editionNumber} registration settings saved:`, settings);
    } catch (error) {
        console.error('Error saving registration settings:', error);
        if (statusElement) {
            statusElement.textContent = 'Error saving settings: ' + error.message;
            statusElement.className = 'status-message error';
        }
    }
}

async function refreshRegistrationStats() {
    console.log('refreshRegistrationStats called');
    try {
        const usersSnapshot = await db.collection('users').get();
        let totalUsers = 0;
        let currentEditionRegistrations = 0;
        let previousEditionsRegistrations = 0;
        let activePlayers = 0;
        
        const currentEdition = currentActiveEdition;
        
        let archivedUsers = 0;
        let activeUsers = 0;
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            
            // Count all users in the database
            totalUsers++;
            
            // Count by status
            if (userData.status === 'archived') {
                archivedUsers++;
            } else {
                activeUsers++;
            }
            
            if (userData.registrations) {
                // Only count current edition registrations for active users
                if (userData.registrations[`edition${currentEdition}`] && userData.status !== 'archived') {
                    currentEditionRegistrations++;
                }
                
                // Count registrations from previous editions (excluding archived users)
                if (userData.status !== 'archived') {
                    const previousEditions = Object.keys(userData.registrations).filter(edition => {
                        const editionNum = parseInt(edition.replace('edition', ''));
                        return editionNum < currentEdition;
                    });
                    previousEditionsRegistrations += previousEditions.length;
                }
            }
            
            // Count active players (those with lives > 0)
            if (userData.lives > 0) {
                activePlayers++;
            }
        });
        
        console.log('Registration stats breakdown:', {
            totalUsers,
            activeUsers,
            archivedUsers,
            currentEditionRegistrations,
            previousEditionsRegistrations,
            activePlayers
        });
        
        // Update display
        const totalElement = document.querySelector('#total-registrations');
        const currentElement = document.querySelector('#current-edition-registrations');
        const archivedElement = document.querySelector('#archived-players-count');
        
        if (totalElement) totalElement.textContent = activeUsers;
        if (currentElement) currentElement.textContent = currentEditionRegistrations;
        if (archivedElement) archivedElement.textContent = archivedUsers;
        
        // Update registration list
        await updateRegistrationList();
        
    } catch (error) {
        console.error('Error refreshing registration stats:', error);
    }
}

async function updateRegistrationList() {
    try {
        const usersSnapshot = await db.collection('users').orderBy('firstName').limit(20).get();
        const tbody = document.querySelector('#registration-list-body');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const row = document.createElement('tr');
            
            const name = `${userData.firstName || ''} ${userData.surname || ''}`.trim();
            const email = userData.email || '';
            const paymentMethod = userData.paymentMethod || 'Not specified';
            
            // Get latest registration
            let latestEdition = 'None';
            let registrationDate = 'N/A';
            
            if (userData.registrations) {
                const editions = Object.keys(userData.registrations);
                if (editions.length > 0) {
                    const latest = editions.sort().pop();
                    latestEdition = latest.replace('edition', 'Edition ');
                    registrationDate = userData.registrations[latest].registrationDate.toDate().toLocaleDateString();
                }
            }
            
            row.innerHTML = `
                <td>${name}</td>
                <td>${email}</td>
                <td>${latestEdition}</td>
                <td>${registrationDate}</td>
                <td>${paymentMethod}</td>
                <td>
                    <button class="secondary-button" onclick="viewUserDetails('${doc.id}')">View</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error updating registration list:', error);
    }
}

async function viewUserDetails(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('User not found');
            return;
        }
        
        const userData = userDoc.data();
        
        // Create modal content
        const modalContent = `
            <div class="user-details-modal">
                <div class="modal-header">
                    <h3>User Details</h3>
                    <button class="close-modal" onclick="closeUserDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-info">
                        <h4>Personal Information</h4>
                        <p><strong>Name:</strong> ${userData.firstName || ''} ${userData.surname || ''}</p>
                        <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
                        <p><strong>Display Name:</strong> ${userData.displayName || 'N/A'}</p>
                        <p><strong>Payment Method:</strong> ${userData.paymentMethod || 'Not specified'}</p>
                        <p><strong>Lives Remaining:</strong> ${userData.lives !== undefined ? userData.lives : 'N/A'}</p>
                    </div>
                    
                    <div class="registration-history">
                        <h4>Registration History</h4>
                        ${generateRegistrationHistory(userData.registrations || {})}
                    </div>
                    
                    <div class="pick-history">
                        <h4>Pick History</h4>
                        ${generatePickHistory(userData.picks || {})}
                    </div>
                    
                    <div class="edition-settings">
                        <h4>Edition Settings</h4>
                        <div class="edition-controls">
                            <label for="default-edition-${doc.id}">Default Edition:</label>
                            <select id="default-edition-${doc.id}" onchange="updateUserDefaultEdition('${doc.id}', this.value)">
                                <option value="">No Default Set</option>
                                <option value="1" ${userData.preferredEdition === 1 ? 'selected' : ''}>Edition 1</option>
                                <option value="test" ${userData.preferredEdition === 'test' ? 'selected' : ''}>Test Weeks</option>
                            </select>
                            <button class="secondary-button" onclick="saveUserDefaultEdition('${doc.id}')">Save Default</button>
                        </div>
                        <p class="edition-help">This sets which edition the user sees by default when they log in.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Create and show modal
        showModal(modalContent);
        
    } catch (error) {
        console.error('Error fetching user details:', error);
        alert('Error loading user details');
    }
}

function generateRegistrationHistory(registrations) {
    if (Object.keys(registrations).length === 0) {
        return '<p>No registrations found</p>';
    }
    
    let html = '<div class="registration-list">';
    Object.keys(registrations).sort().forEach(edition => {
        const reg = registrations[edition];
        const editionName = edition.replace('edition', 'Edition ');
        const date = reg.registrationDate ? reg.registrationDate.toDate().toLocaleDateString() : 'N/A';
        html += `
            <div class="registration-item">
                <strong>${editionName}:</strong> ${date}
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function generatePickHistory(picks) {
    if (Object.keys(picks).length === 0) {
        return '<p>No picks made yet</p>';
    }
    
    let html = '<div class="pick-list">';
    const gameweeks = [
        { key: 'gw1', label: 'Game Week 1' },
        { key: 'gw2', label: 'Game Week 2' },
        { key: 'gw3', label: 'Game Week 3' },
        { key: 'gw4', label: 'Game Week 4' },
        { key: 'gw5', label: 'Game Week 5' },
        { key: 'gw6', label: 'Game Week 6' },
        { key: 'gw7', label: 'Game Week 7' },
        { key: 'gw8', label: 'Game Week 8' },
        { key: 'gw9', label: 'Game Week 9' },
        { key: 'gw10', label: 'Game Week 10' },
        { key: 'gwtiebreak', label: 'Tiebreak Round' }
    ];
    
    gameweeks.forEach(gw => {
        const pick = picks[gw.key];
        const badge = pick ? getTeamBadge(pick) : null;
        const badgeHtml = badge ? `<img src="${badge}" alt="${pick}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
        html += `
            <div class="pick-item">
                <strong>${gw.label}:</strong> ${pick ? badgeHtml + pick : 'No pick made'}
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function showModal(content) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = content;
    
    // Add to page
    document.body.appendChild(modalOverlay);
    
    // Add event listener to close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeUserDetailsModal();
        }
    });
}

function closeUserDetailsModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}



// --- TABBED INTERFACE FUNCTIONS ---

// Mobile Tabbed Interface Functions
function initializeMobileTabs() {
    const tabButtons = document.querySelectorAll('.mobile-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.mobile-tab-content .tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            button.classList.add('active');
            const targetPane = document.getElementById(`${targetTab}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // Load content based on tab
            if (targetTab === 'as-it-stands') {
                initializeAsItStandsTab('mobile');
            } else if (targetTab === 'scores') {
                loadPlayerScores().then(async fixtures => {
                    console.log('loadPlayerScores returned:', fixtures);
                    // Get current gameweek for display
                    const currentGameweek = getActiveGameweek();
                    await renderPlayerScores(fixtures, currentGameweek);
                    renderMobilePlayerScores(fixtures, currentGameweek);
                }).catch(error => {
                    console.error('Error loading player scores:', error);
                    showNoScoresMessage();
                });
            } else if (targetTab === 'vidiprinter') {
                initializePlayerVidiprinter();
            }
        });
    });
}

// Desktop Tabbed Interface Functions
function initializeDesktopTabs() {
    const tabButtons = document.querySelectorAll('.desktop-tabs .desktop-tab-btn');
    const tabPanes = document.querySelectorAll('.desktop-tab-content .desktop-tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            button.classList.add('active');
            const targetPane = document.getElementById(`desktop-${targetTab}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // Load content based on tab
            if (targetTab === 'as-it-stands') {
                initializeAsItStandsTab('desktop');
            } else if (targetTab === 'scores') {
                loadPlayerScores().then(async fixtures => {
                    console.log('loadPlayerScores returned:', fixtures);
                    // Get current gameweek for display
                    const currentGameweek = getActiveGameweek();
                    await renderPlayerScores(fixtures, currentGameweek);
                    renderMobilePlayerScores(fixtures, currentGameweek);
                }).catch(error => {
                    console.error('Error loading player scores:', error);
                    showNoScoresMessage();
                });
            } else if (targetTab === 'vidiprinter') {
                initializePlayerVidiprinter();
            }
        });
    });
}

// --- FUNCTION to build the dashboard ---
async function renderDashboard(user) {
    // Initialize both mobile and desktop tabs
    initializeMobileTabs();
    initializeDesktopTabs();
    
    // Pre-load all deadlines for this user's edition to avoid individual calls during rendering
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        const userEdition = getUserEdition(userData);
        const allGameweeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'tiebreak'];
        await batchCheckDeadlines(allGameweeks, userEdition);
    }
    
    const welcomeMessage = document.querySelector('#welcome-message');
    const mobileWelcomeMessage = document.querySelector('#mobile-welcome-message');
    const livesRemaining = document.querySelector('#lives-remaining');
    const mobileLivesRemaining = document.querySelector('#mobile-lives-remaining');
    const desktopLivesRemaining = document.querySelector('#desktop-lives-remaining');
    const picksHistoryContainer = document.querySelector('#picks-history');
    const mobilePicksHistoryContainer = document.querySelector('#mobile-picks-history');
    const desktopPicksHistoryContainer = document.querySelector('#desktop-picks-history');
    const logoutButtonContainer = document.querySelector('#user-logged-in-view');
    const fixturesDisplayContainer = document.querySelector('#fixtures-display-container');
    const mobileFixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
    const gameweekNavigation = document.querySelector('#gameweek-navigation');
    const mobileGameweekNavigation = document.querySelector('#mobile-gameweek-navigation');

    if (logoutButtonContainer) logoutButtonContainer.style.display = 'block';
    if (gameweekNavigation) gameweekNavigation.style.display = 'block';
    if (mobileGameweekNavigation) mobileGameweekNavigation.style.display = 'block';

    try {
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        if (!settingsDoc.exists) {
            console.error("CRITICAL: Settings document not found!");
            return;
        }
        const settings = settingsDoc.data();
        const currentGameWeek = settings.active_gameweek;

        const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Get user's edition from registration data
                const userEdition = getUserEdition(userData);
                const userRegisteredEditions = getUserRegisteredEditions(userData);
                
                // Show edition selection if user is registered for multiple editions
                if (userRegisteredEditions.length > 1) {
                    const desktopContainer = document.getElementById('edition-selection-container');
                    const mobileContainer = document.getElementById('mobile-edition-selection-container');
                    const desktopSelector = document.getElementById('dashboard-edition-selector');
                    const mobileSelector = document.getElementById('mobile-dashboard-edition-selector');
                    
                    if (desktopContainer && mobileContainer) {
                        desktopContainer.style.display = 'block';
                        mobileContainer.style.display = 'block';
                        
                        // Populate edition selectors
                        if (desktopSelector && mobileSelector) {
                            desktopSelector.innerHTML = '';
                            mobileSelector.innerHTML = '';
                            
                            userRegisteredEditions.forEach(edition => {
                                const optionText = edition === 'test' ? 'Test Weeks' : `Edition ${edition}`;
                                const optionValue = edition;
                                
                                const desktopOption = document.createElement('option');
                                desktopOption.value = optionValue;
                                desktopOption.textContent = optionText;
                                if (edition === userEdition) {
                                    desktopOption.selected = true;
                                }
                                desktopSelector.appendChild(desktopOption);
                                
                                const mobileOption = document.createElement('option');
                                mobileOption.value = optionValue;
                                mobileOption.textContent = optionText;
                                if (edition === userEdition) {
                                    mobileOption.selected = true;
                                }
                                mobileSelector.appendChild(mobileOption);
                            });
                        }
                        
                        // Add event listeners for save buttons
                        const desktopSaveBtn = document.getElementById('save-edition-preference');
                        const mobileSaveBtn = document.getElementById('mobile-save-edition-preference');
                        
                        if (desktopSaveBtn) {
                            desktopSaveBtn.onclick = () => saveEditionPreference(desktopSelector.value, user.uid);
                        }
                        if (mobileSaveBtn) {
                            mobileSaveBtn.onclick = () => saveEditionPreference(mobileSelector.value, user.uid);
                        }
                    }
                }
                
                // Update edition displays
                document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
                    if (el) {
                        if (userEdition === 'test') {
                            el.textContent = 'Test Weeks';
                        } else {
                            el.textContent = `Edition ${userEdition}`;
                        }
                    }
                });
                
                // Update welcome messages for both desktop and mobile
                if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${userData.displayName}!`;
                if (mobileWelcomeMessage) mobileWelcomeMessage.textContent = `Welcome, ${userData.displayName}!`;
            
            // Display card status based on lives remaining
            let cardDisplay = '';
            if (userData.lives === 2) {
                cardDisplay = '<p style="text-align: center; margin-top: 10px; color: #28a745; font-weight: bold;">All is well, you haven\'t got a card yet</p>';
            } else if (userData.lives === 1) {
                cardDisplay = '<img src="images/Yellow Card.png" alt="Yellow Card" style="width: 240px; height: 240px; display: block; margin: 0 auto; margin-top: 10px;">';
            } else if (userData.lives === 0) {
                cardDisplay = '<img src="images/redcard.png" alt="Red Card" style="width: 240px; height: 240px; display: block; margin: 0 auto; margin-top: 10px;">';
            }
            
            // Update lives remaining for desktop, mobile, and legacy
            if (livesRemaining) livesRemaining.innerHTML = cardDisplay;
            if (mobileLivesRemaining) mobileLivesRemaining.innerHTML = cardDisplay;
            if (desktopLivesRemaining) desktopLivesRemaining.innerHTML = cardDisplay;

            // Render pick history for desktop, mobile, and legacy (only if containers exist)
            if (picksHistoryContainer) {
                await renderPickHistory(userData.picks || {}, picksHistoryContainer, user.uid, userData);
            }
            if (mobilePicksHistoryContainer) {
                await renderPickHistory(userData.picks || {}, mobilePicksHistoryContainer, user.uid, userData);
            }
            if (desktopPicksHistoryContainer) {
                await renderPickHistory(userData.picks || {}, desktopPicksHistoryContainer, user.uid, userData);
            }
            
            // Initialize gameweek navigation for both desktop and mobile
            initializeGameweekNavigation(currentGameWeek, userData, user.uid);
            initializeMobileGameweekNavigation(currentGameWeek, userData, user.uid);
            
            // Check for auto-picks needed
            checkAndAssignAutoPicks(userData, currentGameWeek, user.uid);
            
            // Load fixtures for current gameweek to get deadline (with user data)
            loadFixturesForDeadline(currentGameWeek, userData, user.uid);
            

        }
    } catch (error) {
        console.error("Error rendering dashboard:", error);
    }
}



async function renderPickHistory(picks, container, userId, userData = null) {
    // Check if container exists before proceeding
    if (!container) {
        console.warn('renderPickHistory: Container is null, skipping render');
        return;
    }
    
    container.innerHTML = '';
    
    // Always show all gameweeks (GW1-10 and Tiebreak)
    const allGameWeeks = [
        { key: 'gw1', label: 'GW 1' },
        { key: 'gw2', label: 'GW 2' },
        { key: 'gw3', label: 'GW 3' },
        { key: 'gw4', label: 'GW 4' },
        { key: 'gw5', label: 'GW 5' },
        { key: 'gw6', label: 'GW 6' },
        { key: 'gw7', label: 'GW 7' },
        { key: 'gw8', label: 'GW 8' },
        { key: 'gw9', label: 'GW 9' },
        { key: 'gw10', label: 'GW 10' },
        { key: 'gwtiebreak', label: 'Tiebreak' }
    ];

    // Process each gameweek sequentially
    for (const gameweek of allGameWeeks) {
        const pickItem = document.createElement('div');
        pickItem.className = 'pick-item';
        
        const pickInfo = document.createElement('div');
        pickInfo.className = 'pick-info';
        
        const pickAction = document.createElement('div');
        pickAction.className = 'pick-action';
        
        const teamName = picks[gameweek.key];
                    const gameweekNumber = gameweek.key === 'gwtiebreak' ? 'tiebreak' : gameweek.key.replace('gw', '');
            // Get user's edition to check the correct deadline
            const userEdition = userData ? getUserEdition(userData) : null;
            const isDeadlinePassed = await checkDeadlineForGameweek(gameweekNumber, userEdition);
        
        if (teamName) {
            // User has made a pick for this gameweek
            const badge = getTeamBadge(teamName);
            const badgeHtml = badge ? `<img src="${badge}" alt="${teamName}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
            pickInfo.innerHTML = `<strong><a href="#" onclick="navigateToGameweek('${gameweekNumber}', userData, '${userId}'); return false;" class="gameweek-link">${gameweek.label}</a>:</strong> ${badgeHtml}${teamName}`;
            
            // Check if deadline has passed for this gameweek
            if (isDeadlinePassed) {
                pickAction.innerHTML = '<button class="locked-pick-btn">Locked</button>';
            } else {
                pickAction.innerHTML = `<button class="release-pick-btn" onclick="removePick('${userId}', '${gameweek.key}')">Release</button>`;
            }
        } else {
            // No pick made - show deadline date
            getDeadlineDateForGameweek(gameweekNumber).then(deadlineDate => {
                if (deadlineDate) {
                    // Format date as DD/MM/YY
                    const day = deadlineDate.getDate().toString().padStart(2, '0');
                    const month = (deadlineDate.getMonth() + 1).toString().padStart(2, '0');
                    const year = deadlineDate.getFullYear().toString().slice(-2);
                    const formattedDate = `${day}/${month}/${year}`;
                    
                    pickInfo.innerHTML = `<strong><a href="#" onclick="navigateToGameweek('${gameweekNumber}', userData, '${userId}'); return false;" class="gameweek-link">${gameweek.label}</a>:</strong> ${formattedDate}`;
                } else {
                    pickInfo.innerHTML = `<strong><a href="#" onclick="navigateToGameweek('${gameweekNumber}', userData, '${userId}'); return false;" class="gameweek-link">${gameweek.label}</a>:</strong> TBD`;
                }
            
            // Check if deadline has passed
            if (isDeadlinePassed) {
                pickAction.innerHTML = '<button class="locked-pick-btn">Locked</button>';
            } else {
                pickAction.innerHTML = `<button class="make-pick-btn" onclick="makePick('${userId}', '${gameweekNumber}')">Make Pick</button>`;
            }
            }).catch(() => {
                pickInfo.innerHTML = `<strong><a href="#" onclick="navigateToGameweek('${gameweekNumber}', userData, '${userId}'); return false;" class="gameweek-link">${gameweek.label}</a>:</strong> TBD`;
                pickAction.innerHTML = `<button class="make-pick-btn" onclick="makePick('${userId}', '${gameweekNumber}')">Make Pick</button>`;
            });
        }
        
        pickItem.appendChild(pickInfo);
        pickItem.appendChild(pickAction);
        container.appendChild(pickItem);
    }
}

// --- GAME WEEK NAVIGATION FUNCTIONS ---
function initializeGameweekNavigation(currentGameWeek, userData, userId) {
    const currentGameweekDisplay = document.querySelector('#current-gameweek-display');
    const prevButton = document.querySelector('#prev-gameweek');
    const nextButton = document.querySelector('#next-gameweek');
    const gameweekTabs = document.querySelectorAll('.gameweek-tab');
    const tiebreakTab = document.querySelector('.tiebreak-tab');
    
    // Check if tiebreak is enabled in admin settings
    db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            const tiebreakEnabled = settings.tiebreak_enabled || false;
            
            // Show/hide tiebreak tab based on admin setting
            if (tiebreakTab) {
                if (tiebreakEnabled) {
                    tiebreakTab.style.display = 'inline-block';
                } else {
                    tiebreakTab.style.display = 'none';
                    // If tiebreak is disabled and current gameweek is tiebreak, switch to GW10
                    if (currentGameWeek === 'tiebreak') {
                        navigateToGameweek('10', userData, userId);
                        return;
                    }
                }
            }
        }
    });
    
    // Set current gameweek display
    const displayText = currentGameWeek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${currentGameWeek}`;
    currentGameweekDisplay.textContent = displayText;
    
    // Update navigation buttons
    updateNavigationButtons(currentGameWeek, prevButton, nextButton);
    
    // Update active tab
    updateActiveTab(currentGameWeek, gameweekTabs);
    
    // Add event listeners
    prevButton.addEventListener('click', () => navigateGameweek(currentGameWeek, -1, userData, userId));
    nextButton.addEventListener('click', () => navigateGameweek(currentGameWeek, 1, userData, userId));
    
    // Add tab click listeners
    gameweekTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const gameweek = tab.dataset.gameweek;
            navigateToGameweek(gameweek, userData, userId);
        });
    });
    
    // Update tab states based on deadlines
    updateTabStates(gameweekTabs);
}

function updateNavigationButtons(currentGameWeek, prevButton, nextButton) {
    const gameweekNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
    
    // Enable/disable previous button
    prevButton.disabled = gameweekNum <= 1;
    
    // Enable/disable next button - allow navigation up to tiebreak (11)
    nextButton.disabled = gameweekNum >= 11;
}

function updateActiveTab(currentGameWeek, gameweekTabs) {
    gameweekTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.gameweek === currentGameWeek) {
            tab.classList.add('active');
        }
    });
}

function updateTabStates(gameweekTabs) {
    gameweekTabs.forEach(tab => {
        const gameweek = tab.dataset.gameweek;
        checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
                    if (isDeadlinePassed) {
            tab.classList.add('locked');
        } else {
            tab.classList.remove('locked');
        }
        });
    });
}

function navigateGameweek(currentGameWeek, direction, userData, userId) {
    const currentNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
    const newNum = currentNum + direction;
    
    if (newNum < 1 || newNum > 11) return;
    
    const newGameweek = newNum === 11 ? 'tiebreak' : newNum.toString();
    navigateToGameweek(newGameweek, userData, userId);
}

async function navigateToGameweek(gameweek, userData, userId) {
    try {
        // Fetch fresh user data from database to ensure we have the latest picks
        const freshUserDoc = await db.collection('users').doc(userId).get();
        const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : userData;
        
        // Update current gameweek display
        const currentGameweekDisplay = document.querySelector('#current-gameweek-display');
        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
        currentGameweekDisplay.textContent = displayText;
        
        // Update navigation buttons
        const prevButton = document.querySelector('#prev-gameweek');
        const nextButton = document.querySelector('#next-gameweek');
        updateNavigationButtons(gameweek, prevButton, nextButton);
        
        // Update event listeners with the new gameweek
        if (prevButton) {
            // Remove existing event listeners
            prevButton.replaceWith(prevButton.cloneNode(true));
            const newPrevButton = document.querySelector('#prev-gameweek');
            newPrevButton.addEventListener('click', () => navigateGameweek(gameweek, -1, freshUserData, userId));
        }
        
        if (nextButton) {
            // Remove existing event listeners
            nextButton.replaceWith(nextButton.cloneNode(true));
            const newNextButton = document.querySelector('#next-gameweek');
            newNextButton.addEventListener('click', () => navigateGameweek(gameweek, 1, freshUserData, userId));
        }
        
        // Update active tab
        const gameweekTabs = document.querySelectorAll('.gameweek-tab');
        updateActiveTab(gameweek, gameweekTabs);
        
        // Load fixtures for the selected gameweek with fresh data
        loadFixturesForDeadline(gameweek, freshUserData, userId);
        
        console.log(`Navigated to gameweek ${gameweek} with fresh user data`);
    } catch (error) {
        console.error('Error navigating to gameweek:', error);
        // Fallback to original behavior if there's an error
        loadFixturesForDeadline(gameweek, userData, userId);
    }
}

function removePick(userId, gameweekKey) {
    if (confirm('Are you sure you want to remove this pick?')) {
        const gameweek = gameweekKey.replace('gw', '');
        
        // Check if deadline has passed
        checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
            if (isDeadlinePassed) {
                alert('Cannot remove pick - deadline has passed for this gameweek.');
                return;
            }
            
            // Remove the pick from Firestore
            const updateData = {};
            updateData[`picks.${gameweekKey}`] = db.FieldValue.delete();
            
            db.collection('users').doc(userId).update(updateData).then(() => {
                // Refresh the dashboard
                firebase.auth().onAuthStateChanged(user => {
                    if (user) {
                        renderDashboard(user).catch(console.error);
                    }
                });
            }).catch(error => {
                console.error('Error removing pick:', error);
                alert('Error removing pick. Please try again.');
            });
        });
    }
}

function makePick(userId, gameweek) {
    // Fetch user data and navigate to the gameweek
    db.collection('users').doc(userId).get().then(userDoc => {
        if (userDoc.exists) {
            const userData = userDoc.data();
            navigateToGameweek(gameweek, userData, userId);
            
            // Switch to the Fixtures tab
            switchToFixturesTab();
        }
    }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Error loading gameweek. Please try again.');
    });
}

// Function to programmatically switch to the Fixtures tab
function switchToFixturesTab() {
    // Switch mobile tab to fixtures
    const mobileTabButtons = document.querySelectorAll('.mobile-tabs .tab-btn');
    const mobileTabPanes = document.querySelectorAll('.mobile-tab-content .tab-pane');
    
    mobileTabButtons.forEach(btn => btn.classList.remove('active'));
    mobileTabPanes.forEach(pane => pane.classList.remove('active'));
    
    const mobileFixturesTab = document.querySelector('.mobile-tabs .tab-btn[data-tab="fixtures"]');
    const mobileFixturesPane = document.getElementById('fixtures-tab');
    
    if (mobileFixturesTab) mobileFixturesTab.classList.add('active');
    if (mobileFixturesPane) mobileFixturesPane.classList.add('active');
    
    // Switch desktop tab to fixtures
    const desktopTabButtons = document.querySelectorAll('.desktop-tabs .desktop-tab-btn');
    const desktopTabPanes = document.querySelectorAll('.desktop-tab-content .desktop-tab-pane');
    
    desktopTabButtons.forEach(btn => btn.classList.remove('active'));
    desktopTabPanes.forEach(pane => pane.classList.remove('active'));
    
    const desktopFixturesTab = document.querySelector('.desktop-tabs .desktop-tab-btn[data-tab="fixtures"]');
    const desktopFixturesPane = document.getElementById('desktop-fixtures-tab');
    
    if (desktopFixturesTab) desktopFixturesTab.classList.add('active');
    if (desktopFixturesPane) desktopFixturesPane.classList.add('active');
}

// --- DEADLINE AND AUTO-PICK FUNCTIONS ---
function loadFixturesForDeadline(gameweek, userData = null, userId = null) {
    const fixturesDisplayContainer = document.querySelector('#fixtures-display-container');
    const deadlineDate = document.querySelector('#deadline-date');
    const deadlineStatus = document.querySelector('#deadline-status');
    const fixturesDisplay = document.querySelector('#fixtures-display');

    // Handle tiebreak gameweek
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    
    // Determine user's edition from registration data
    const userEdition = getUserEdition(userData);
    const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;

    // Load edition-specific fixtures only
    db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
        if (doc.exists) {
            const fixtures = doc.data().fixtures;
            if (fixtures && fixtures.length > 0) {
                // Find the earliest fixture (deadline)
                const earliestFixture = fixtures.reduce((earliest, fixture) => {
                    const fixtureDate = new Date(fixture.date);
                    const earliestDate = new Date(earliest.date);
                    return fixtureDate < earliestDate ? fixture : earliest;
                });

                // Display deadline
                const deadlineDateObj = new Date(earliestFixture.date);
                const formattedDeadline = formatDeadlineDate(deadlineDateObj);
                
                deadlineDate.textContent = formattedDeadline;
                
                // Check if deadline has passed
                const now = new Date();
                const timeUntilDeadline = deadlineDateObj - now;
                
                // Check if all fixtures in this gameweek are completed
                const allFixturesCompleted = fixtures.every(fixture => 
                    fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
                );
                
                // Check if all fixtures have finished (have a status) but may not be fully completed
                const allFixturesFinished = fixtures.every(fixture => 
                    fixture.status && fixture.status !== 'NS' && fixture.status !== '1H' && fixture.status !== 'HT' && fixture.status !== '2H'
                );
                
                if (allFixturesCompleted) {
                    deadlineStatus.textContent = 'Complete (Results confirmed and cards issued)';
                    deadlineStatus.className = 'complete';
                    deadlineStatus.style.color = '#0c5460';
                } else if (allFixturesFinished && timeUntilDeadline <= 0) {
                    deadlineStatus.textContent = 'Locked (Matches are complete)';
                    deadlineStatus.className = 'locked';
                    deadlineStatus.style.color = '#721c24';
                } else if (timeUntilDeadline <= 0) {
                    deadlineStatus.textContent = 'Locked (Matches are underway)';
                    deadlineStatus.className = 'locked';
                    deadlineStatus.style.color = '#721c24';
                } else {
                    deadlineStatus.textContent = 'Active (Pick updates allowed)';
                    deadlineStatus.className = 'active';
                    deadlineStatus.style.color = '#28a745';
                }

                // Update pick status header
                updatePickStatusHeader(gameweek, userData, userId);

                // Display fixtures
                renderFixturesDisplay(fixtures, userData, gameweek, userId);
                fixturesDisplayContainer.style.display = 'block';
            }
        } else {
            fixturesDisplayContainer.style.display = 'none';
        }
    });
}

// Mobile fixtures loading function
function loadMobileFixturesForDeadline(gameweek, userData = null, userId = null) {
    const fixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
    const deadlineDate = document.querySelector('#mobile-deadline-date');
    const deadlineStatus = document.querySelector('#mobile-deadline-status');
    const fixturesDisplay = document.querySelector('#mobile-fixtures-display');

    // Handle tiebreak gameweek
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    
    // Determine user's edition from registration data
    const userEdition = getUserEdition(userData);
    const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;

    // Load edition-specific fixtures only
    db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
        if (doc.exists) {
            const fixtures = doc.data().fixtures;
            if (fixtures && fixtures.length > 0) {
                // Find the earliest fixture (deadline)
                const earliestFixture = fixtures.reduce((earliest, fixture) => {
                    const fixtureDate = new Date(fixture.date);
                    const earliestDate = new Date(earliest.date);
                    return fixtureDate < earliestDate ? fixture : earliest;
                });

                // Display deadline
                const deadlineDateObj = new Date(earliestFixture.date);
                const formattedDeadline = formatDeadlineDate(deadlineDateObj);
                
                if (deadlineDate) deadlineDate.textContent = formattedDeadline;
                
                // Check if deadline has passed
                const now = new Date();
                const timeUntilDeadline = deadlineDateObj - now;
                
                // Check if all fixtures in this gameweek are completed
                const allFixturesCompleted = fixtures.every(fixture => 
                    fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
                );
                
                // Check if all fixtures have finished (have a status) but may not be fully completed
                const allFixturesFinished = fixtures.every(fixture => 
                    fixture.status && fixture.status !== 'NS' && fixture.status !== '1H' && fixture.status !== 'HT' && fixture.status !== '2H'
                );
                
                if (allFixturesCompleted) {
                    if (deadlineStatus) {
                        deadlineStatus.textContent = 'Complete (Results confirmed and cards issued)';
                        deadlineStatus.className = 'complete';
                        deadlineStatus.style.color = '#0c5460';
                    }
                } else if (allFixturesFinished && timeUntilDeadline <= 0) {
                    if (deadlineStatus) {
                        deadlineStatus.textContent = 'Locked (Matches are complete)';
                        deadlineStatus.className = 'locked';
                        deadlineStatus.style.color = '#721c24';
                    }
                } else if (timeUntilDeadline <= 0) {
                    if (deadlineStatus) {
                        deadlineStatus.textContent = 'Locked (Matches are underway)';
                        deadlineStatus.className = 'locked';
                        deadlineStatus.style.color = '#721c24';
                    }
                } else {
                    if (deadlineStatus) {
                        deadlineStatus.textContent = 'Active (Pick updates allowed)';
                        deadlineStatus.className = 'active';
                        deadlineStatus.style.color = '#28a745';
                    }
                }

                // Update pick status header
                updateMobilePickStatusHeader(gameweek, userData, userId);

                // Display fixtures
                renderMobileFixturesDisplay(fixtures, userData, gameweek, userId);
                if (fixturesDisplayContainer) fixturesDisplayContainer.style.display = 'block';
            }
        } else {
            if (fixturesDisplayContainer) fixturesDisplayContainer.style.display = 'none';
        }
    });
}

// Function to update the mobile pick status header
function updateMobilePickStatusHeader(gameweek, userData, userId) {
    const pickStatusDisplay = document.querySelector('#mobile-pick-status-display');
    const pickStatusHeader = document.querySelector('.mobile-deadline-section .pick-status-header');
    
    if (!pickStatusDisplay || !pickStatusHeader) {
        return;
    }
    
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const currentPick = userData && userData.picks && userData.picks[gameweekKey];
    
    if (currentPick) {
        // User has made a pick for this gameweek
        pickStatusDisplay.textContent = `Saved Pick: ${currentPick}`;
        pickStatusDisplay.className = 'pick-status-text saved';
        pickStatusHeader.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        pickStatusHeader.style.borderColor = 'rgba(40, 167, 69, 0.3)';
    } else {
        // No pick made yet - show prompt
        pickStatusDisplay.textContent = '⚠️ Make your pick before the deadline!';
        pickStatusDisplay.className = 'pick-status-text prompt';
        pickStatusHeader.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        pickStatusHeader.style.borderColor = 'rgba(220, 53, 69, 0.3)';
    }
}

// Function to update the pick status header
function updatePickStatusHeader(gameweek, userData, userId) {
    const pickStatusDisplay = document.querySelector('#pick-status-display');
    const pickStatusHeader = document.querySelector('.pick-status-header');
    
    if (!pickStatusDisplay || !pickStatusHeader) {
        return;
    }
    
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const currentPick = userData && userData.picks && userData.picks[gameweekKey];
    
    if (currentPick) {
        // User has made a pick for this gameweek
        pickStatusDisplay.textContent = `Saved Pick: ${currentPick}`;
        pickStatusDisplay.className = 'pick-status-text saved';
        pickStatusHeader.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        pickStatusHeader.style.borderColor = 'rgba(40, 167, 69, 0.3)';
    } else {
        // No pick made yet - show prompt
        pickStatusDisplay.textContent = '⚠️ Make your pick before the deadline!';
        pickStatusDisplay.className = 'pick-status-text prompt';
        pickStatusHeader.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        pickStatusHeader.style.borderColor = 'rgba(220, 53, 69, 0.3)';
    }
}

// Function to determine team status for improved UI
// Global cache for deadline checks to avoid repeated Firebase calls
const deadlineCache = new Map();
// Global cache for batch deadline checks
const batchDeadlineCache = new Map();

// NEW: Batch deadline checking function
async function batchCheckDeadlines(gameweeks, edition) {
    // Ensure database is available
    if (!db && window.db) {
        db = window.db;
        console.log('Database reference initialized in batchCheckDeadlines');
    }
    
    if (!db) {
        console.error('Database not available in batchCheckDeadlines');
        return {};
    }
    
    const cacheKey = `batch_${edition}`;
    
    // Check if we have a recent batch cache
    if (batchDeadlineCache.has(cacheKey)) {
        const cached = batchDeadlineCache.get(cacheKey);
        const now = Date.now();
        if (now - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
            return cached.results;
        }
    }
    
    // Fetch all deadlines in one operation
    const results = {};
    const promises = [];
    
    for (const gameweek of gameweeks) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${edition}_${gameweekKey}`;
        
        const promise = db.collection('fixtures').doc(editionGameweekKey).get()
            .then(doc => {
                if (!doc.exists) {
                    // Fallback to old structure
                    return db.collection('fixtures').doc(gameweekKey).get();
                }
                return doc;
            })
            .then(doc => {
                if (doc.exists) {
                    const fixtures = doc.data().fixtures;
                    if (fixtures && fixtures.length > 0) {
                        const earliestFixture = fixtures.reduce((earliest, fixture) => {
                            const fixtureDate = new Date(fixture.date);
                            const earliestDate = new Date(earliest.date);
                            return fixtureDate < earliestDate ? fixture : earliest;
                        });
                        const deadlineDate = new Date(earliestFixture.date);
                        const now = new Date();
                        return { gameweek, isDeadlinePassed: deadlineDate <= now };
                    }
                }
                return { gameweek, isDeadlinePassed: false };
            })
            .catch(error => {
                console.log('Batch deadline check error for gameweek:', gameweek, error);
                return { gameweek, isDeadlinePassed: false };
            });
        
        promises.push(promise);
    }
    
    try {
        const batchResults = await Promise.all(promises);
        batchResults.forEach(result => {
            results[result.gameweek] = result.isDeadlinePassed;
        });
        
        // Cache the results
        batchDeadlineCache.set(cacheKey, {
            results,
            timestamp: Date.now()
        });
        
        // Clear cache after 5 minutes
        setTimeout(() => batchDeadlineCache.delete(cacheKey), 5 * 60 * 1000);
        
        return results;
    } catch (error) {
        console.log('Batch deadline check failed:', error);
        return {};
    }
}

// Optimized function to get team status without Firebase calls for simple cases
function getTeamStatusSimple(teamName, userData, currentGameWeek, userId) {
    // Simple fallback implementation to avoid any complex logic that might cause issues
    try {
        // Basic validation
        if (!teamName || !userData || !currentGameWeek || !userId) {
            return { status: 'normal', clickable: false, reason: 'No user data' };
        }
        
        // Simple check for current pick
        const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
        const currentPick = userData.picks && userData.picks[gameweekKey];
        
        if (currentPick === teamName) {
            return { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
        }
        
        // Simple check for existing picks
        const existingPicks = Object.values(userData.picks || {});
        if (existingPicks.includes(teamName)) {
            return { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
        }
        
        // Default to available
        return { status: 'available', clickable: true, reason: 'Available for picking' };
        
    } catch (error) {
        console.error('Error in getTeamStatusSimple:', error);
        return { status: 'available', clickable: true, reason: 'Available for picking' };
    }
}

async function getTeamStatus(teamName, userData, currentGameWeek, userId) {
    if (!userData || !currentGameWeek || !userId) {
        return { status: 'normal', clickable: false, reason: 'No user data' };
    }
    
    const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
    const currentPick = userData.picks && userData.picks[gameweekKey];
    
    // Check if this is the current pick for this gameweek
    if (currentPick === teamName) {
        return { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
    }
    
    // Check if team is picked in another gameweek
    const existingPicks = Object.values(userData.picks || {});
    if (existingPicks.includes(teamName)) {
        // Find which gameweek this team was picked in
        let pickedGameweek = null;
        for (const [key, pick] of Object.entries(userData.picks || {})) {
            if (pick === teamName) {
                pickedGameweek = key;
                break;
            }
        }
        
        if (pickedGameweek) {
            // Use batch deadline checking instead of individual calls
            const pickedGameweekNum = pickedGameweek === 'gwtiebreak' ? 'tiebreak' : pickedGameweek.replace('gw', '');
            const userEdition = getUserEdition(userData);
            
            // Get all unique gameweeks from user's picks for batch processing
            const userGameweeks = Object.keys(userData.picks || {}).map(key => 
                key === 'gwtiebreak' ? 'tiebreak' : key.replace('gw', '')
            );
            
            // Use batch deadline checking with fallback
            let isDeadlinePassed = false;
            try {
                const deadlineResults = await batchCheckDeadlines(userGameweeks, userEdition);
                isDeadlinePassed = deadlineResults[pickedGameweekNum] || false;
            } catch (error) {
                console.log('Batch deadline check failed, using fallback:', error);
                // Fallback to simple logic - assume future pick if we can't determine
                return { status: 'future-pick', clickable: true, reason: `Picked in future ${pickedGameweek}` };
            }
            
            if (isDeadlinePassed) {
                return { status: 'completed-pick', clickable: false, reason: `Picked in completed ${pickedGameweek}` };
            } else {
                return { status: 'future-pick', clickable: true, reason: `Picked in future ${pickedGameweek}` };
            }
        }
    }
    
    // Team is available for picking
    return { status: 'available', clickable: true, reason: 'Available for picking' };
}

function renderFixturesDisplay(fixtures, userData = null, currentGameWeek = null, userId = null) {
    console.log('renderFixturesDisplay called with:', { fixtures, userData, currentGameWeek, userId });
    
    const fixturesDisplay = document.querySelector('#fixtures-display');
    
    if (!fixtures || fixtures.length === 0) {
        fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
        return;
    }

    // Sort fixtures by date
    const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let fixturesHTML = '';
    
    for (const fixture of sortedFixtures) {
        const fixtureDate = new Date(fixture.date);

        const homeBadge = getTeamBadge(fixture.homeTeam);
        const awayBadge = getTeamBadge(fixture.awayTeam);
        
        const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}">` : '';
        const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}">` : '';

        // Check if user has already picked either team for this gameweek
        const gameweekKey = currentGameWeek ? (currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`) : null;
        const currentPick = userData && gameweekKey ? userData.picks && userData.picks[gameweekKey] : null;
        
        // Determine if teams are clickable (not already picked and deadline hasn't passed)
        const isClickable = userData && currentGameWeek && userId;
        
        // Check if teams are already picked by user in other gameweeks
        const existingPicks = userData ? Object.values(userData.picks || {}) : [];
        
        // Calculate team pick status (minimal debugging)
        const homeTeamPicked = existingPicks.includes(fixture.homeTeam) && currentPick !== fixture.homeTeam;
        const awayTeamPicked = existingPicks.includes(fixture.awayTeam) && currentPick !== fixture.awayTeam;
        

        
        // Create team pick buttons with improved status classes
        let homeTeamClasses = 'team-pick-button';
        let awayTeamClasses = 'team-pick-button';
        
        // Use simple status checking to avoid async calls during rendering
        // Inline logic to avoid function call issues
        let homeTeamStatus, awayTeamStatus;
        
        // Simple inline logic for home team
        if (currentPick === fixture.homeTeam) {
            homeTeamStatus = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
        } else if (existingPicks.includes(fixture.homeTeam)) {
            homeTeamStatus = { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
        } else {
            homeTeamStatus = { status: 'available', clickable: true, reason: 'Available for picking' };
        }
        
        // Simple inline logic for away team
        if (currentPick === fixture.awayTeam) {
            awayTeamStatus = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
        } else if (existingPicks.includes(fixture.awayTeam)) {
            awayTeamStatus = { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
        } else {
            awayTeamStatus = { status: 'available', clickable: true, reason: 'Available for picking' };
        }
        
        // Apply status classes to team buttons
        homeTeamClasses += ` ${homeTeamStatus.status}`;
        awayTeamClasses += ` ${awayTeamStatus.status}`;
        
        // Determine if teams are clickable based on their status and create tooltips
        let homeTeamClickable = homeTeamStatus.clickable;
        let awayTeamClickable = awayTeamStatus.clickable;
        let homeTeamTooltip = homeTeamStatus.reason;
        let awayTeamTooltip = awayTeamStatus.reason;
        
        const homeTeamClickAttr = homeTeamClickable ? `onclick="selectTeamAsTempPick('${fixture.homeTeam}', ${currentGameWeek}, '${userId}')"` : '';
        const awayTeamClickAttr = awayTeamClickable ? `onclick="selectTeamAsTempPick('${fixture.awayTeam}', ${currentGameWeek}, '${userId}')"` : '';
        const homeTeamTitleAttr = homeTeamTooltip ? `title="${homeTeamTooltip}"` : '';
        const awayTeamTitleAttr = awayTeamTooltip ? `title="${awayTeamTooltip}"` : '';

        fixturesHTML += `
            <div class="fixture-item">
                <div class="fixture-teams">
                    <button class="${homeTeamClasses}" ${homeTeamClickAttr} ${homeTeamTitleAttr} ${!homeTeamClickable ? 'disabled' : ''}>
                        ${homeBadgeHtml}${fixture.homeTeam}
                        ${currentPick === fixture.homeTeam ? '<span class="pick-indicator">✓</span>' : ''}
                    </button>
                    <div class="fixture-vs">vs</div>
                    <button class="${awayTeamClasses}" ${awayTeamClickAttr} ${awayTeamTitleAttr} ${!awayTeamClickable ? 'disabled' : ''}>
                        ${awayBadgeHtml}${fixture.awayTeam}
                        ${currentPick === fixture.awayTeam ? '<span class="pick-indicator">✓</span>' : ''}
                    </button>
                </div>
                <div class="fixture-datetime">
                    <div class="fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
            </div>
        `;
    }

    fixturesDisplay.innerHTML = fixturesHTML;
}

// Mobile fixtures display rendering function
function renderMobileFixturesDisplay(fixtures, userData = null, currentGameWeek = null, userId = null) {
    const fixturesDisplay = document.querySelector('#mobile-fixtures-display');
    
    if (!fixtures || fixtures.length === 0) {
        fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
        return;
    }

    // Sort fixtures by date
    const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let fixturesHTML = '';
    
    for (const fixture of sortedFixtures) {
        const fixtureDate = new Date(fixture.date);

        const homeBadge = getTeamBadge(fixture.homeTeam);
        const awayBadge = getTeamBadge(fixture.awayTeam);
        
        const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}">` : '';
        const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}">` : '';

        // Check if user has already picked either team for this gameweek
        const gameweekKey = currentGameWeek ? (currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`) : null;
        const currentPick = userData && gameweekKey ? userData.picks && userData.picks[gameweekKey] : null;
        
        // Determine if teams are clickable (not already picked and deadline hasn't passed)
        const isClickable = userData && currentGameWeek && userId;
        
        // Check if teams are already picked by user in other gameweeks
        const existingPicks = userData ? Object.values(userData.picks || {}) : [];
        

        
        // Create team pick buttons with improved status classes
        let homeTeamClasses = 'team-pick-button';
        let awayTeamClasses = 'team-pick-button';
        
        // Use simple status checking to avoid async calls during rendering
        // Inline logic to avoid function call issues
        let homeTeamStatus, awayTeamStatus;
        
        // Simple inline logic for home team
        if (currentPick === fixture.homeTeam) {
            homeTeamStatus = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
        } else if (existingPicks.includes(fixture.homeTeam)) {
            homeTeamStatus = { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
        } else {
            homeTeamStatus = { status: 'available', clickable: true, reason: 'Available for picking' };
        }
        
        // Simple inline logic for away team
        if (currentPick === fixture.awayTeam) {
            awayTeamStatus = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
        } else if (existingPicks.includes(fixture.awayTeam)) {
            awayTeamStatus = { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
        } else {
            awayTeamStatus = { status: 'available', clickable: true, reason: 'Available for picking' };
        }
        
        // Apply status classes to team buttons
        homeTeamClasses += ` ${homeTeamStatus.status}`;
        awayTeamClasses += ` ${awayTeamStatus.status}`;
        
        // Determine if teams are clickable based on their status and create tooltips
        let homeTeamClickable = homeTeamStatus.clickable;
        let awayTeamClickable = awayTeamStatus.clickable;
        let homeTeamTooltip = homeTeamStatus.reason;
        let awayTeamTooltip = awayTeamStatus.reason;
        
        const homeTeamClickAttr = homeTeamClickable ? `onclick="selectTeamAsTempPick('${fixture.homeTeam}', ${currentGameWeek}, '${userId}')"` : '';
        const awayTeamClickAttr = awayTeamClickable ? `onclick="selectTeamAsTempPick('${fixture.awayTeam}', ${currentGameWeek}, '${userId}')"` : '';
        const homeTeamTitleAttr = homeTeamTooltip ? `title="${homeTeamTooltip}"` : '';
        const awayTeamTitleAttr = awayTeamTooltip ? `title="${awayTeamTooltip}"` : '';

        fixturesHTML += `
            <div class="fixture-item">
                <div class="fixture-teams">
                    <button class="${homeTeamClasses}" ${homeTeamClickAttr} ${homeTeamTitleAttr} ${!homeTeamClickable ? 'disabled' : ''}>
                        ${homeBadgeHtml}${fixture.homeTeam}
                        ${currentPick === fixture.homeTeam ? '<span class="pick-indicator">✓</span>' : ''}
                    </button>
                    <div class="fixture-vs">vs</div>
                    <button class="${awayTeamClasses}" ${awayTeamClickAttr} ${awayTeamTitleAttr} ${!awayTeamClickable ? 'disabled' : ''}>
                        ${awayBadgeHtml}${fixture.awayTeam}
                        ${currentPick === fixture.awayTeam ? '<span class="pick-indicator">✓</span>' : ''}
                    </button>
                </div>
                <div class="fixture-datetime">
                    <div class="fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
            </div>
        `;
    }

    fixturesDisplay.innerHTML = fixturesHTML;
}

// Function to handle temporary team selection from fixtures display
async function selectTeamAsTempPick(teamName, gameweek, userId) {
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    
    try {
        // Check if user has already picked this team in another gameweek
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('User not found.');
            return;
        }
        
        const userData = userDoc.data();
        const existingPicks = Object.values(userData.picks || {});
        
        if (existingPicks.includes(teamName)) {
            // Find which gameweek this team was picked in
            let pickedGameweek = null;
            for (const [key, pick] of Object.entries(userData.picks || {})) {
                if (pick === teamName) {
                    pickedGameweek = key;
                    break;
                }
            }
            
            if (pickedGameweek) {
                const pickedGameweekNum = pickedGameweek === 'gwtiebreak' ? 'tiebreak' : pickedGameweek.replace('gw', '');
                
                // Offer to release the old pick and save the new one
                if (confirm(`You have picked ${teamName} for Game Week ${pickedGameweekNum}. Would you like to release this pick and select ${teamName} for Game Week ${gameweek}?`)) {
                    const oldGameweekKey = pickedGameweek;
                    
                    await db.collection('users').doc(userId).update({
                        [`picks.${oldGameweekKey}`]: db.FieldValue.delete(),
                        [`picks.${gameweekKey}`]: teamName
                    });
                    
                    console.log(`Pick released and new pick saved: ${teamName} for Game Week ${gameweek}`);
                    
                    // Refresh the display with updated data
                    await refreshDisplayAfterPickUpdate(gameweek, userId);
                }
                return;
            }
        }
        
        // Team is available for picking - show confirmation popup
        if (confirm(`Would you like to pick ${teamName} for Game Week ${gameweek}?`)) {
            await db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: teamName
            });
            
            console.log(`Pick saved: ${teamName} for Game Week ${gameweek}`);
            
            // Refresh the display with updated data
            await refreshDisplayAfterPickUpdate(gameweek, userId);
        }
    } catch (error) {
        console.error('Error in selectTeamAsTempPick:', error);
        alert('Error processing pick. Please try again.');
    }
}

// Helper function to refresh display after pick update
async function refreshDisplayAfterPickUpdate(gameweek, userId) {
    try {
        const updatedUserDoc = await db.collection('users').doc(userId).get();
        if (updatedUserDoc.exists) {
            const updatedUserData = updatedUserDoc.data();
            
            // Get the current gameweek being viewed from the active tab
            const activeTab = document.querySelector('.gameweek-tab.active');
            const currentViewedGameweek = activeTab ? activeTab.getAttribute('data-gameweek') : gameweek;
            
            // Refresh the desktop display with updated data for the current viewed gameweek
            loadFixturesForDeadline(currentViewedGameweek, updatedUserData, userId);
            
            // Refresh the mobile display with updated data for the current viewed gameweek
            loadMobileFixturesForDeadline(currentViewedGameweek, updatedUserData, userId);
            
            // Update the pick status headers with updated data for the current viewed gameweek
            updatePickStatusHeader(currentViewedGameweek, updatedUserData, userId);
            updateMobilePickStatusHeader(currentViewedGameweek, updatedUserData, userId);
            
            // Refresh the pick history sidebars with updated data
            const picksHistoryContainer = document.querySelector('#picks-history');
            const mobilePicksHistoryContainer = document.querySelector('#mobile-picks-history');
            const desktopPicksHistoryContainer = document.querySelector('#desktop-picks-history');
            
            if (picksHistoryContainer) {
                renderPickHistory(updatedUserData.picks || {}, picksHistoryContainer, userId, updatedUserData);
            }
            if (mobilePicksHistoryContainer) {
                renderPickHistory(updatedUserData.picks || {}, mobilePicksHistoryContainer, userId, updatedUserData);
            }
            if (desktopPicksHistoryContainer) {
                renderPickHistory(updatedUserData.picks || {}, desktopPicksHistoryContainer, userId, updatedUserData);
            }
            
            console.log(`Display refreshed for gameweek ${currentViewedGameweek} with updated user data`);
        }
    } catch (error) {
        console.error('Error refreshing display:', error);
    }
}

// Function to save temporary pick to database
function saveTempPick(gameweek, userId) {
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const tempPickKey = `tempPick_${userId}_${gameweek}`;
    const tempPick = sessionStorage.getItem(tempPickKey);
    
    if (!tempPick) {
        alert('No temporary pick to save.');
        return;
    }
    
    // Check if deadline has passed
    checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
        if (isDeadlinePassed) {
            alert('Deadline has passed for this gameweek. Picks are locked.');
            return;
        }
        
        // Save the pick to database
        db.collection('users').doc(userId).update({
            [`picks.${gameweekKey}`]: tempPick
        }).then(() => {
            console.log(`Pick saved: ${tempPick} for Game Week ${gameweek}`);
            
            // Clear temporary pick from sessionStorage
            sessionStorage.removeItem(tempPickKey);
            
            // Refresh both the pick history sidebar and the fixtures display
            db.collection('users').doc(userId).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Refresh the pick history sidebar
                    const picksHistoryContainer = document.querySelector('#picks-history');
                    if (picksHistoryContainer) {
                        renderPickHistory(userData.picks || {}, picksHistoryContainer, userId, userData);
                    }
                    
                    // Refresh the fixtures display to update the save button
                    // Use the gameweek that was passed to this function, not the settings
                    loadFixturesForDeadline(gameweek, userData, userId);
                    
                    // Update the pick status header
                    updatePickStatusHeader(gameweek, userData, userId);
                }
            }).catch(console.error);
        }).catch(error => {
            console.error('Error saving pick:', error);
            alert('Error saving pick. Please try again.');
        });
    });
}

// Function to release a future pick
function releaseFuturePick(teamName, gameweek, userId) {
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    
    // Confirm the release
    if (!confirm(`Are you sure you want to release ${teamName} from Game Week ${gameweek}?`)) {
        return;
    }
    
    // Remove the pick from database
    db.collection('users').doc(userId).update({
                    [`picks.${gameweekKey}`]: db.FieldValue.delete()
    }).then(() => {
        console.log(`Future pick released: ${teamName} from Game Week ${gameweek}`);
        
        // Refresh the display
        db.collection('users').doc(userId).get().then(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Refresh the pick history sidebar
                const picksHistoryContainer = document.querySelector('#picks-history');
                if (picksHistoryContainer) {
                    renderPickHistory(userData.picks || {}, picksHistoryContainer, userId, userData);
                }
                
                // Refresh the fixtures display - we need to get the current gameweek from the page
                const currentGameWeek = document.querySelector('.gameweek-tab.active')?.getAttribute('data-gameweek') || '1';
                loadFixturesForDeadline(currentGameWeek, userData, userId);
            }
        }).catch(console.error);
    }).catch(error => {
        console.error('Error releasing future pick:', error);
        alert('Error releasing pick. Please try again.');
    });
}

// Function to handle team selection from fixtures display (legacy function - keeping for compatibility)
function selectTeamAsPick(teamName, gameweek, userId) {
    // Redirect to new temporary pick system
    selectTeamAsTempPick(teamName, gameweek, userId);
}

function checkAndAssignAutoPicks(userData, currentGameWeek, userId) {
    const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
    
    // Check if user already has a pick for current gameweek
    if (userData.picks && userData.picks[gameweekKey]) {
        return; // User already has a pick
    }

    // Check if deadline has passed
    db.collection('fixtures').doc(gameweekKey).get().then(doc => {
        if (doc.exists) {
            const fixtures = doc.data().fixtures;
            if (fixtures && fixtures.length > 0) {
                const earliestFixture = fixtures.reduce((earliest, fixture) => {
                    const fixtureDate = new Date(fixture.date);
                    const earliestDate = new Date(earliest.date);
                    return fixtureDate < earliestDate ? fixture : earliest;
                });

                const deadlineDate = new Date(earliestFixture.date);
                const now = new Date();

                if (deadlineDate <= now) {
                    // Deadline has passed, assign auto-pick
                    assignAutoPick(userData, currentGameWeek, userId);
                }
            }
        }
    });
}

function assignAutoPick(userData, gameweek, userId) {
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const existingPicks = userData.picks || {};
    const pickedTeams = Object.values(existingPicks);
    
    // Find the next available team alphabetically that hasn't been picked
    const availableTeams = TEAMS_CONFIG.allTeams.filter(team => !pickedTeams.includes(team));
    
    if (availableTeams.length > 0) {
        const autoPick = availableTeams[0]; // First alphabetical team
        
        db.collection('users').doc(userId).update({
            [`picks.${gameweekKey}`]: autoPick
        }).then(() => {
            console.log(`Auto-pick assigned: ${autoPick} for Game Week ${gameweek}`);
            // Refresh the dashboard to show the auto-pick
            renderDashboard({ uid: userId }).catch(console.error);
        }).catch(error => {
            console.error('Error assigning auto-pick:', error);
        });
    }
}

function getDeadlineDateForGameweek(gameweek) {
    return new Promise((resolve) => {
        // Handle tiebreak gameweek
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        
        // Try new structure first, then fallback to old structure
        db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (!doc.exists) {
                // Fallback to old structure for backward compatibility
                return db.collection('fixtures').doc(gameweekKey).get();
            }
            return doc;
        }).then(doc => {
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });

                    const deadlineDate = new Date(earliestFixture.date);
                    resolve(deadlineDate);
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        }).catch(() => {
            resolve(null);
        });
    });
}

function formatDeadlineDate(date) {
    if (!date) return 'TBD';
    
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    
    // Get day of week and date
    const dayOfWeek = date.toLocaleDateString('en-GB', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'long' });
    
    // Add ordinal suffix to day
    const ordinalSuffix = getOrdinalSuffix(day);
    
    return `${displayHours}:${minutes}${ampm} ${dayOfWeek} ${day}${ordinalSuffix} ${month}`;
}

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function checkDeadlineForGameweek(gameweek, edition = null) {
    return new Promise((resolve) => {
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.log('checkDeadlineForGameweek timeout for:', gameweek, edition);
            resolve(false);
        }, 5000); // 5 second timeout
        
        // Handle tiebreak gameweek
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        // Use provided edition or fall back to current active edition
        const editionToUse = edition || currentActiveEdition;
        const editionGameweekKey = `edition${editionToUse}_${gameweekKey}`;
        
        // Try new structure first, then fallback to old structure
        db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (!doc.exists) {
                // Fallback to old structure for backward compatibility
                return db.collection('fixtures').doc(gameweekKey).get();
            }
            return doc;
        }).then(doc => {
            clearTimeout(timeout);
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });

                    const deadlineDate = new Date(earliestFixture.date);
                    const now = new Date();
                    const isDeadlinePassed = deadlineDate <= now;
                    resolve(isDeadlinePassed);
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        }).catch((error) => {
            clearTimeout(timeout);
            console.log('checkDeadlineForGameweek error:', error);
            resolve(false);
        });
    });
}

function startDeadlineChecker() {
    // Check for deadlines every minute
    setInterval(() => {
        db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                const currentGameWeek = settings.active_gameweek;
                
                // Check if deadline has passed for current gameweek
                checkDeadlineForGameweek(currentGameWeek).then(isDeadlinePassed => {
                    if (isDeadlinePassed) {
                        // Check all users for auto-picks needed
                        db.collection('users').get().then(querySnapshot => {
                            querySnapshot.forEach(doc => {
                                const userData = doc.data();
                                const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                                
                                // If user doesn't have a pick for current gameweek, assign auto-pick
                                if (!userData.picks || !userData.picks[gameweekKey]) {
                                    assignAutoPick(userData, currentGameWeek, doc.id);
                                }
                            });
                        });
                    }
                });
            }
        });
    }, 60000); // Check every minute
}

// As It Stands Tab Functions
function initializeAsItStandsTab(platform) {
    console.log(`Initializing As It Stands tab for ${platform}`);
    
    // Populate gameweek selector
    populateAsItStandsGameweekSelector(platform);
    
    // Add event listener for gameweek selection
    const gameweekSelector = document.getElementById(`${platform === 'mobile' ? 'mobile-' : 'desktop-'}as-it-stands-gameweek`);
    if (gameweekSelector) {
        gameweekSelector.addEventListener('change', (e) => {
            const selectedGameweek = e.target.value;
            if (selectedGameweek) {
                loadAsItStandsData(selectedGameweek, platform);
            }
        });
    }
}

async function populateAsItStandsGameweekSelector(platform) {
    const selectorId = `${platform === 'mobile' ? 'mobile-' : 'desktop-'}as-it-stands-gameweek`;
    const selector = document.getElementById(selectorId);
    
    if (!selector) return;
    
    try {
        // Get current user's edition
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        const userEdition = getUserEdition(userData);
        
        // Get all gameweeks for this edition
        const allGameweeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'tiebreak'];
        
        // Clear existing options
        selector.innerHTML = '<option value="">Select Game Week</option>';
        
        // Add gameweek options
        allGameweeks.forEach(gameweek => {
            const option = document.createElement('option');
            option.value = gameweek;
            option.textContent = gameweek === 'tiebreak' ? 'Tiebreak' : `Game Week ${gameweek}`;
            selector.appendChild(option);
        });
        
        // Set default to current active gameweek if available
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            const currentGameWeek = settings.active_gameweek;
            if (currentGameWeek && allGameweeks.includes(currentGameWeek.toString())) {
                selector.value = currentGameWeek.toString();
                // Load data for current gameweek
                loadAsItStandsData(currentGameWeek.toString(), platform);
            }
        }
        
    } catch (error) {
        console.error('Error populating gameweek selector:', error);
        selector.innerHTML = '<option value="">Error loading game weeks</option>';
    }
}

async function loadAsItStandsData(gameweek, platform) {
    console.log(`Loading As It Stands data for gameweek ${gameweek} on ${platform}`);
    
    const displayId = `${platform === 'mobile' ? 'mobile-' : 'desktop-'}as-it-stands-display`;
    const display = document.getElementById(displayId);
    
    if (!display) return;
    
    display.innerHTML = '<p>Loading standings...</p>';
    
    try {
        // Get current user's edition
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            display.innerHTML = '<p>Please log in to view standings.</p>';
            return;
        }
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) {
            display.innerHTML = '<p>User data not found.</p>';
            return;
        }
        
        const userData = userDoc.data();
        const userEdition = getUserEdition(userData);
        
        // Get all players in this edition
        const usersSnapshot = await db.collection('users').get();
        const players = [];
        
        usersSnapshot.forEach(doc => {
            const playerData = doc.data();
            const playerEdition = getUserEdition(playerData);
            
            // Only include players in the same edition
            if (playerEdition === userEdition) {
                players.push({
                    id: doc.id,
                    ...playerData
                });
            }
        });
        
        // Get fixtures for this gameweek
        const fixturesDoc = await db.collection('fixtures').doc(`edition${userEdition}_gw${gameweek}`).get();
        let fixtures = [];
        
        if (fixturesDoc.exists) {
            fixtures = fixturesDoc.data().fixtures || [];
        }
        
        // Render the standings
        await renderAsItStandsStandings(players, fixtures, gameweek, userEdition, platform);
        
    } catch (error) {
        console.error('Error loading As It Stands data:', error);
        display.innerHTML = '<p>Error loading standings. Please try again.</p>';
    }
}

async function renderAsItStandsStandings(players, fixtures, gameweek, edition, platform) {
    const displayId = `${platform === 'mobile' ? 'mobile-' : 'desktop-'}as-it-stands-display`;
    const display = document.getElementById(displayId);
    
    if (!display) return;
    
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const editionGameweekKey = `edition${edition}_${gameweekKey}`;
    
    // Determine gameweek status
    let gameweekStatus = 'upcoming';
    let statusDescription = 'Game week has not started yet';
    
    // Get current active gameweek from settings
    let currentActiveGameweek = '1';
    try {
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        if (settingsDoc.exists) {
            currentActiveGameweek = settingsDoc.data().active_gameweek || '1';
        }
    } catch (error) {
        console.error('Error getting current active gameweek:', error);
    }
    
    // Check if this gameweek has started based on active gameweek setting
    const gameweekNum = gameweek === 'tiebreak' ? 11 : parseInt(gameweek);
    const currentGameweekNum = currentActiveGameweek === 'tiebreak' ? 11 : parseInt(currentActiveGameweek);
    
    if (gameweekNum <= currentGameweekNum) {
        if (fixtures.length > 0) {
            const hasStarted = fixtures.some(f => f.status === 'live' || f.status === 'completed');
            const hasCompleted = fixtures.some(f => f.status === 'completed');
            
            if (hasCompleted) {
                gameweekStatus = 'completed';
                statusDescription = 'Game week completed - final results shown';
            } else if (hasStarted) {
                gameweekStatus = 'live';
                statusDescription = 'Game week in progress - live standings shown';
            } else {
                gameweekStatus = 'upcoming';
                statusDescription = 'Game week has started but no matches played yet';
            }
        } else {
            gameweekStatus = 'upcoming';
            statusDescription = 'Game week has started but no fixtures loaded yet';
        }
    } else {
        gameweekStatus = 'future';
        statusDescription = 'Game week has not started yet';
    }
    
    // Create standings table
    let html = `
        <div class="as-it-stands-header">
            <h3>${gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`}</h3>
            <p class="gameweek-status ${gameweekStatus}">${statusDescription}</p>
        </div>
        <div class="standings-table-container">
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Player</th>
                        <th>Pick</th>
                        <th>Card Status</th>
                        <th>As It Stands</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort players by lives remaining (descending) and then by display name
    players.sort((a, b) => {
        if (b.lives !== a.lives) {
            return b.lives - a.lives;
        }
        return a.displayName.localeCompare(b.displayName);
    });
    
    players.forEach((player, index) => {
        const position = index + 1;
        const playerPick = player.picks && (player.picks[editionGameweekKey] || player.picks[gameweekKey]);
        const pickDisplay = playerPick || 'No pick made';
        
        // Get card status display
        let cardStatus = '';
        if (player.lives === 2) {
            cardStatus = '<span class="card-status safe">🟢 Safe</span>';
        } else if (player.lives === 1) {
            cardStatus = '<span class="card-status warning">🟡 Yellow Card</span>';
        } else if (player.lives === 0) {
            cardStatus = '<span class="card-status eliminated">🔴 Eliminated</span>';
        }
        
        // Calculate "As It Stands" status
        let asItStandsStatus = '';
        if (gameweekStatus === 'upcoming') {
            asItStandsStatus = '<span class="status pending">⏳ Pending</span>';
        } else if (gameweekStatus === 'live') {
            if (playerPick && fixtures.length > 0) {
                // Check if the picked team is still in contention
                const pickStillValid = checkPickStillValid(playerPick, fixtures);
                if (pickStillValid) {
                    asItStandsStatus = '<span class="status safe">✅ Still Safe</span>';
                } else {
                    asItStandsStatus = '<span class="status danger">❌ Pick Lost</span>';
                }
            } else {
                asItStandsStatus = '<span class="status pending">⏳ No Pick</span>';
            }
        } else if (gameweekStatus === 'completed') {
            if (playerPick && fixtures.length > 0) {
                const pickResult = calculatePickResult(playerPick, fixtures);
                if (pickResult === 'win') {
                    asItStandsStatus = '<span class="status success">✅ Survived</span>';
                } else {
                    asItStandsStatus = '<span class="status eliminated">❌ Eliminated</span>';
                }
            } else {
                asItStandsStatus = '<span class="status eliminated">❌ No Pick</span>';
            }
        }
        
        html += `
            <tr class="player-row ${player.lives === 0 ? 'eliminated' : ''}">
                <td class="position">${position}</td>
                <td class="player-name">${player.displayName}</td>
                <td class="player-pick">${pickDisplay}</td>
                <td class="card-status-cell">${cardStatus}</td>
                <td class="as-it-stands-status">${asItStandsStatus}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    display.innerHTML = html;
}

function checkPickStillValid(pick, fixtures) {
    // Check if the picked team has lost any completed matches
    const completedFixtures = fixtures.filter(f => f.status === 'completed' && f.homeScore !== null && f.awayScore !== null);
    
    for (const fixture of completedFixtures) {
        if (fixture.homeTeam === pick || fixture.awayTeam === pick) {
            const homeScore = fixture.homeScore;
            const awayScore = fixture.awayScore;
            
            if (homeScore > awayScore && fixture.awayTeam === pick) {
                // Away team (picked team) lost
                return false;
            } else if (awayScore > homeScore && fixture.homeTeam === pick) {
                // Home team (picked team) lost
                return false;
            } else if (homeScore === awayScore) {
                // It's a draw - picked team is still safe
                return true;
            }
        }
    }
    
    return true;
}

function calculatePickResult(pick, fixtures) {
    const completedFixtures = fixtures.filter(f => f.status === 'completed' && f.homeScore !== null && f.awayScore !== null);
    
    for (const fixture of completedFixtures) {
        if (fixture.homeTeam === pick || fixture.awayTeam === pick) {
            const homeScore = fixture.homeScore;
            const awayScore = fixture.awayScore;
            
            if (homeScore > awayScore && fixture.homeTeam === pick) {
                // Home team (picked team) won
                return 'win';
            } else if (awayScore > homeScore && fixture.awayTeam === pick) {
                // Away team (picked team) won
                return 'win';
            } else if (homeScore === awayScore) {
                // It's a draw - picked team is eliminated
                return 'lose';
            }
        }
    }
    
    return 'lose'; // If no completed fixtures found, assume loss
}

// --- FUNCTION to build the admin dashboard ---
function buildAdminDashboard(settings) {
    // Store the observer so it can be disconnected later if needed
    // window.saveButtonObserver = saveButtonObserver; // Removed undefined variable reference
    
    // Ensure settings is available - use parameter, global settings, or defaults
    if (!settings) {
        if (window.settings) {
            settings = window.settings;
            console.log('Using global settings in buildAdminDashboard');
        } else {
            console.warn('No settings provided to buildAdminDashboard, using defaults');
            settings = {
                active_gameweek: '1',
                active_edition: 'edition1'
            };
        }
    }
    
    // Initialize picks controls
    const picksEditionSelect = document.querySelector('#picks-edition-select');
    const picksGameweekSelect = document.querySelector('#picks-gameweek-select');
    const refreshPicksBtn = document.querySelector('#refresh-picks-btn');
    const picksTitle = document.querySelector('#picks-title');
    const picksTableBody = document.querySelector('#admin-picks-body');
    
    // Set default values
    picksEditionSelect.value = settings.active_edition || 'edition1';
    picksGameweekSelect.value = settings.active_gameweek || '1';
    
    // Function to render picks table
    async function renderPicksTable() {
        console.log('renderPicksTable called - clearing table first');
        
        // Clear the table completely before adding new rows
        picksTableBody.innerHTML = '';
        
        const selectedEdition = picksEditionSelect.value;
        const selectedGameweek = picksGameweekSelect.value;
        const gwKey = selectedGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${selectedGameweek}`;
        
        console.log('Selected edition:', selectedEdition, 'gameweek:', selectedGameweek, 'gwKey:', gwKey);
        
        const displayText = selectedGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${selectedGameweek}`;
        picksTitle.textContent = `Picks for ${selectedEdition.charAt(0).toUpperCase() + selectedEdition.slice(1)} - ${displayText}`;
        
        try {
            console.log('Fetching users from database...');
            const usersSnapshot = await db.collection('users').get();
            console.log('Users snapshot received, count:', usersSnapshot.size);
            
            let registeredUsersCount = 0;
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                
                // Check if user is registered for this edition
                const isRegisteredForEdition = userData.registrations && userData.registrations[selectedEdition];
                if (!isRegisteredForEdition) return; // Skip users not registered for this edition
                
                registeredUsersCount++;
                console.log('Processing user:', userData.displayName, 'for edition:', selectedEdition);
                
                // Picks are stored using the simple gwKey format (e.g., gw1, gw2), not edition-prefixed
                const playerPick = userData.picks && userData.picks[gwKey] ? userData.picks[gwKey] : 'No Pick Made';
                
                const row = document.createElement('tr');
                const badge = playerPick !== 'No Pick Made' ? getTeamBadge(playerPick) : null;
                const badgeHtml = badge ? `<img src="${badge}" alt="${playerPick}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
                
                // Determine pick status
                let statusText = 'No Pick';
                let statusClass = 'no-pick';
                if (playerPick !== 'No Pick Made') {
                    statusText = 'Pick Made';
                    statusClass = 'pick-made';
                }
                
                row.innerHTML = `
                    <td>${userData.displayName}</td>
                    <td>${badgeHtml}${playerPick}</td>
                    <td><span class="pick-status ${statusClass}">${statusText}</span></td>
                `;
                picksTableBody.appendChild(row);
            });
            
            console.log('Total registered users for edition', selectedEdition, ':', registeredUsersCount);
            console.log('Total rows added to table:', picksTableBody.children.length);
            
        } catch (error) {
            console.error('Error loading picks:', error);
            console.error('Error details:', error.message, error.code);
            picksTableBody.innerHTML = '<tr><td colspan="3">Error loading picks: ' + error.message + '</td></tr>';
        }
    }
    
    // Set up event listeners for picks controls
    picksEditionSelect.addEventListener('change', renderPicksTable);
    picksGameweekSelect.addEventListener('change', renderPicksTable);
    refreshPicksBtn.addEventListener('click', renderPicksTable);
    
    // Initial render
    renderPicksTable();

    // Initialize fixture management
    initializeFixtureManagement();
    
    // Load initial fixtures for the current edition
    if (typeof loadFixturesForGameweek === 'function') {
        loadFixturesForGameweek();
    }
    
    // Load initial scores for the current edition
    if (typeof loadScoresForGameweek === 'function') {
        loadScoresForGameweek();
    }
    
    // Initialize registration management
    initializeRegistrationManagement();
    
    // Initialize admin tabs
    const tabs = document.querySelectorAll('.admin-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            const targetPane = document.getElementById(`${targetTab}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
    
    // Initialize admin tabs
    initializeAdminTabs();
    
    // Initialize enhanced vidiprinter functionality
    initializeEnhancedVidiprinter();
}

// Function to continuously monitor and maintain the Save Settings button state
function setupSaveSettingsButtonMonitoring() {
    console.log('Setting up Save Settings button monitoring');
    
    // Check button state every 2 seconds for the first minute
    let checkCount = 0;
    const frequentCheck = setInterval(() => {
        const saveSettingsBtn = document.querySelector('#save-settings-btn');
        if (saveSettingsBtn) {
            if (saveSettingsBtn.disabled || saveSettingsBtn.style.pointerEvents === 'none') {
                console.log(`Frequent check ${checkCount + 1}: Save Settings button was disabled, re-enabling`);
                
                // Re-enable the button
                saveSettingsBtn.disabled = false;
                saveSettingsBtn.style.pointerEvents = 'auto';
                saveSettingsBtn.style.opacity = '1';
                saveSettingsBtn.style.cursor = 'pointer';
                saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
                saveSettingsBtn.style.color = 'var(--dark-text)';
                
                // Remove any disabled classes or attributes
                saveSettingsBtn.classList.remove('disabled');
                saveSettingsBtn.removeAttribute('disabled');
                
                // Re-attach event listener
                saveSettingsBtn.removeEventListener('click', saveCompetitionSettings);
                saveSettingsBtn.addEventListener('click', saveCompetitionSettings);
            }
        }
        
        checkCount++;
        if (checkCount >= 30) { // Check 30 times over 1 minute
            clearInterval(frequentCheck);
            console.log('Frequent monitoring completed, switching to periodic checks');
            
            // Switch to less frequent checks (every 10 seconds)
            setInterval(() => {
                const saveSettingsBtn = document.querySelector('#save-settings-btn');
                if (saveSettingsBtn && (saveSettingsBtn.disabled || saveSettingsBtn.style.pointerEvents === 'none')) {
                    console.log('Periodic check: Save Settings button was disabled, re-enabling');
                    
                    // Re-enable the button
                    saveSettingsBtn.disabled = false;
                    saveSettingsBtn.style.pointerEvents = 'auto';
                    saveSettingsBtn.style.opacity = '1';
                    saveSettingsBtn.style.cursor = 'pointer';
                    saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
                    saveSettingsBtn.style.color = 'var(--dark-text)';
                    
                    // Remove any disabled classes or attributes
                    saveSettingsBtn.classList.remove('disabled');
                    saveSettingsBtn.removeAttribute('disabled');
                    
                    // Re-attach event listener
                    saveSettingsBtn.removeEventListener('click', saveCompetitionSettings);
                    saveSettingsBtn.addEventListener('click', saveCompetitionSettings);
                }
            }, 10000); // Check every 10 seconds
        }
    }, 2000); // Check every 2 seconds
}

// --- FIXTURE MANAGEMENT FUNCTIONS ---
function initializeFixtureManagement() {
    // Set up event listeners for fixture management
    const addFixtureBtn = document.querySelector('#add-fixture-btn');
    const saveFixturesBtn = document.querySelector('#save-fixtures-btn');
    const checkFixturesBtn = document.querySelector('#check-fixtures-btn');
    const saveScoresBtn = document.querySelector('#save-scores-btn');
    const gameweekSelect = document.querySelector('#gameweek-select');
    const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
    
    // Enhanced score management buttons
    const importFootballWebPagesScoresBtn = document.querySelector('#import-football-webpages-scores-btn');
    const scoresFileInput = document.querySelector('#scores-file-input');

    if (addFixtureBtn) {
        addFixtureBtn.addEventListener('click', addFixtureRow);
    }
    if (saveFixturesBtn) {
        saveFixturesBtn.addEventListener('click', saveFixtures);
    }
    if (checkFixturesBtn) {
        checkFixturesBtn.addEventListener('click', checkFixtures);
    }
    if (saveScoresBtn) {
        saveScoresBtn.addEventListener('click', saveScores);
    }
    if (gameweekSelect) {
        gameweekSelect.addEventListener('change', loadFixturesForGameweek);
    }
    if (scoreGameweekSelect) {
        scoreGameweekSelect.addEventListener('change', loadScoresForGameweek);
    }
    
    // Enhanced score management event listeners
    if (importFootballWebPagesScoresBtn) {
        importFootballWebPagesScoresBtn.addEventListener('click', () => {
            const gameweek = scoreGameweekSelect.value;
            importScoresFromFootballWebPages(gameweek);
        });
    }
    
    // Refresh scores display button
    const refreshScoresBtn = document.querySelector('#refresh-scores-btn');
    if (refreshScoresBtn) {
        refreshScoresBtn.addEventListener('click', () => {
            loadScoresForGameweek();
        });
    }
    
    if (scoresFileInput) {
        scoresFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const gameweek = scoreGameweekSelect.value;
                importScoresFromFile(file, gameweek);
                e.target.value = ''; // Reset file input
            }
        });
    }
    

    
    // Auto score update buttons
    const startAutoUpdateBtn = document.querySelector('#start-auto-update-btn');
    const stopAutoUpdateBtn = document.querySelector('#stop-auto-update-btn');
    
    if (startAutoUpdateBtn) {
        startAutoUpdateBtn.addEventListener('click', () => {
            const gameweek = scoreGameweekSelect.value;
            startAutoScoreUpdates(gameweek);
            
            const statusDiv = document.getElementById('auto-update-status');
            statusDiv.innerHTML = '<p class="success">✅ Auto score updates started. Checking every minute for half-time (45+ min) and full-time (105+ min) scores.</p>';
        });
    }
    
    if (stopAutoUpdateBtn) {
        stopAutoUpdateBtn.addEventListener('click', () => {
            stopAutoScoreUpdates();
            
            const statusDiv = document.getElementById('auto-update-status');
            statusDiv.innerHTML = '<p class="info">⏹️ Auto score updates stopped.</p>';
        });
    }
    
    // Football Web Pages API settings
    const footballWebPagesLeague = document.querySelector('#football-webpages-league');
    const footballWebPagesSeason = document.querySelector('#football-webpages-season');
    const saveApiSettingsBtn = document.querySelector('#save-api-settings-btn');
    
    if (saveApiSettingsBtn) {
        saveApiSettingsBtn.addEventListener('click', saveFootballWebPagesSettings);
    }
    
    // Load current API settings
    loadFootballWebPagesSettings();

    // Initialize new fixture management tools
    initializeFixtureManagementTools();

    // Add initial fixture row
    addFixtureRow();
    
    // Load existing fixtures for current gameweek
    loadFixturesForGameweek();
    loadScoresForGameweek();
    
    // Initialize Football Web Pages API integration
    initializeFootballWebPagesAPI();
    
    // Initialize competition settings
    initializeCompetitionSettings();
    
    // Start periodic deadline checking
    startDeadlineChecker();
}

// --- MOBILE GAMEWEEK NAVIGATION FUNCTIONS ---
function initializeMobileGameweekNavigation(currentGameWeek, userData, userId) {
    const currentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
    const prevButton = document.querySelector('#mobile-prev-gameweek');
    const nextButton = document.querySelector('#mobile-next-gameweek');
    const gameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
    const tiebreakTab = document.querySelector('.mobile-gameweek-tabs .tiebreak-tab');
    
    // Check if tiebreak is enabled in admin settings
    db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            const tiebreakEnabled = settings.tiebreak_enabled || false;
            
            // Show/hide tiebreak tab based on admin setting
            if (tiebreakTab) {
                if (tiebreakEnabled) {
                    tiebreakTab.style.display = 'inline-block';
                } else {
                    tiebreakTab.style.display = 'none';
                    // If tiebreak is disabled and current gameweek is tiebreak, switch to GW10
                    if (currentGameWeek === 'tiebreak') {
                        navigateToMobileGameweek('10', userData, userId);
                        return;
                    }
                }
            }
        }
    });
    
    // Set current gameweek display
    const displayText = currentGameWeek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${currentGameWeek}`;
    if (currentGameweekDisplay) currentGameweekDisplay.textContent = displayText;
    
    // Update navigation buttons
    updateMobileNavigationButtons(currentGameWeek, prevButton, nextButton);
    
    // Update active tab
    updateMobileActiveTab(currentGameWeek, gameweekTabs);
    
    // Add event listeners
    if (prevButton) {
        prevButton.addEventListener('click', () => navigateMobileGameweek(currentGameWeek, -1, userData, userId));
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => navigateMobileGameweek(currentGameWeek, 1, userData, userId));
    }
    
    // Add tab click listeners
    gameweekTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const gameweek = tab.dataset.gameweek;
            navigateToMobileGameweek(gameweek, userData, userId);
        });
    });
    
    // Update tab states based on deadlines
    updateMobileTabStates(gameweekTabs);
}

function updateMobileNavigationButtons(currentGameWeek, prevButton, nextButton) {
    if (!prevButton || !nextButton) return;
    
    const gameweekNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
    
    // Enable/disable previous button
    prevButton.disabled = gameweekNum <= 1;
    
    // Enable/disable next button - allow navigation up to tiebreak (11)
    nextButton.disabled = gameweekNum >= 11;
}

function updateMobileActiveTab(currentGameWeek, gameweekTabs) {
    gameweekTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.gameweek === currentGameWeek) {
            tab.classList.add('active');
        }
    });
}

function updateMobileTabStates(gameweekTabs) {
    gameweekTabs.forEach(tab => {
        const gameweek = tab.dataset.gameweek;
        checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
            if (isDeadlinePassed) {
                tab.classList.add('locked');
            } else {
                tab.classList.remove('locked');
            }
        });
    });
}

function navigateMobileGameweek(currentGameWeek, direction, userData, userId) {
    const currentNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
    const newNum = currentNum + direction;
    
    if (newNum < 1 || newNum > 11) return;
    
    const newGameweek = newNum === 11 ? 'tiebreak' : newNum.toString();
    navigateToMobileGameweek(newGameweek, userData, userId);
}

async function navigateToMobileGameweek(gameweek, userData, userId) {
    try {
        // Fetch fresh user data from database to ensure we have the latest picks
        const freshUserDoc = await db.collection('users').doc(userId).get();
        const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : userData;
        
        // Update current gameweek display
        const currentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
        if (currentGameweekDisplay) currentGameweekDisplay.textContent = displayText;
        
        // Update navigation buttons
        const prevButton = document.querySelector('#mobile-prev-gameweek');
        const nextButton = document.querySelector('#mobile-next-gameweek');
        updateMobileNavigationButtons(gameweek, prevButton, nextButton);
        
        // Update event listeners with the new gameweek
        if (prevButton) {
            // Remove existing event listeners
            prevButton.replaceWith(prevButton.cloneNode(true));
            const newPrevButton = document.querySelector('#mobile-prev-gameweek');
            newPrevButton.addEventListener('click', () => navigateMobileGameweek(gameweek, -1, freshUserData, userId));
        }
        
        if (nextButton) {
            // Remove existing event listeners
            nextButton.replaceWith(nextButton.cloneNode(true));
            const newNextButton = document.querySelector('#mobile-next-gameweek');
            newNextButton.addEventListener('click', () => navigateMobileGameweek(gameweek, 1, freshUserData, userId));
        }
        
        // Update active tab
        const gameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
        updateMobileActiveTab(gameweek, gameweekTabs);
        
        // Load fixtures for the selected gameweek with fresh data
        loadMobileFixturesForDeadline(gameweek, freshUserData, userId);
        
        console.log(`Navigated to mobile gameweek ${gameweek} with fresh user data`);
    } catch (error) {
        console.error('Error navigating to mobile gameweek:', error);
        // Fallback to original behavior if there's an error
        loadMobileFixturesForDeadline(gameweek, userData, userId);
    }
}

// --- COMPETITION SETTINGS FUNCTIONS ---
function initializeCompetitionSettings() {
    // Ensure database is available
    if (!db && window.db) {
        db = window.db;
        console.log('Database reference initialized in initializeCompetitionSettings');
    }
    
    const saveSettingsBtn = document.querySelector('#save-settings-btn');
    const resetTestLivesBtn = document.querySelector('#reset-test-lives-btn');
    const activeGameweekSelect = document.querySelector('#active-gameweek-select');
    
    console.log('initializeCompetitionSettings called');
    console.log('Save Settings button found:', !!saveSettingsBtn);
    
    if (saveSettingsBtn) {
        console.log('Save Settings button found, setting up...');
        
        // Ensure button is completely enabled and clickable
        const enableButton = () => {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.style.pointerEvents = 'auto';
            saveSettingsBtn.style.opacity = '1';
            saveSettingsBtn.style.cursor = 'pointer';
            saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
            saveSettingsBtn.style.color = 'var(--dark-text)';
            
            // Remove any disabled attributes or classes
            saveSettingsBtn.removeAttribute('disabled');
            saveSettingsBtn.classList.remove('disabled');
            
            // Remove any existing event listeners to prevent duplicates
            saveSettingsBtn.removeEventListener('click', saveCompetitionSettings);
            saveSettingsBtn.addEventListener('click', saveCompetitionSettings);
            
            console.log('Save Settings button fully enabled and event listener attached');
        };
        
        // Enable immediately
        enableButton();
        
        // Enable after a short delay to catch any late changes
        setTimeout(enableButton, 50);
        
        // Enable after a longer delay to ensure all initialization is complete
        setTimeout(enableButton, 200);
        
        // Set up a more frequent check for the first few seconds
        let checkCount = 0;
        const frequentCheck = setInterval(() => {
            if (saveSettingsBtn.disabled || saveSettingsBtn.style.pointerEvents === 'none') {
                console.log(`Frequent check ${checkCount + 1}: Button was disabled, re-enabling`);
                enableButton();
            }
            checkCount++;
            if (checkCount >= 10) { // Check 10 times over 5 seconds
                clearInterval(frequentCheck);
            }
        }, 500);
        
    } else {
        console.warn('Save Settings button not found!');
    }
    
    if (resetTestLivesBtn) {
        resetTestLivesBtn.addEventListener('click', async () => {
            const statusElement = document.querySelector('#reset-status');
            if (statusElement) {
                statusElement.textContent = 'Resetting players...';
                statusElement.className = 'status-message info';
            }
            
            try {
                await resetAllPlayerLives();
                if (statusElement) {
                    statusElement.textContent = 'Successfully reset all test players to 2 lives!';
                    statusElement.className = 'status-message success';
                }
            } catch (error) {
                if (statusElement) {
                    statusElement.textContent = 'Error resetting players: ' + error.message;
                    statusElement.className = 'status-message error';
                }
            }
        });
    }
    
    // Load current settings
    loadCompetitionSettings();
}

function loadCompetitionSettings() {
    // Ensure database is available
    if (!db && window.db) {
        db = window.db;
        console.log('Database reference initialized in loadCompetitionSettings');
    }
    
    const activeEditionSelect = document.querySelector('#active-edition-select');
    const activeGameweekSelect = document.querySelector('#active-gameweek-select');
    const statusMessage = document.querySelector('#settings-status');
    
    if (!db) {
        console.error('Database not available in loadCompetitionSettings');
        return;
    }
    
    db.collection('settings').doc('currentCompetition').get().then(doc => {
        if (doc.exists) {
            const settings = doc.data();
            if (activeEditionSelect) {
                activeEditionSelect.value = settings.active_edition || 1;
            }
            // Update global variable
            currentActiveEdition = settings.active_edition || 1;
            
            // Update the active edition display
            const editionDisplay = document.querySelector('#current-edition-display');
            if (editionDisplay) {
                if (currentActiveEdition === 'test') {
                    editionDisplay.textContent = 'Test Weeks';
                } else {
                    editionDisplay.textContent = `Edition ${currentActiveEdition}`;
                }
            }
            if (activeGameweekSelect) {
                activeGameweekSelect.value = settings.active_gameweek || 1;
            }
            // Update global variable
            currentActiveGameweek = settings.active_gameweek || '1';
            if (statusMessage) {
                const editionText = `Edition ${settings.active_edition || 1}`;
                const gameweekText = settings.active_gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${settings.active_gameweek || 1}`;
                statusMessage.textContent = `Current active: ${editionText}, ${gameweekText}`;
                statusMessage.className = 'status-message success';
            }
        } else {
            // Create default settings if they don't exist
            db.collection('settings').doc('currentCompetition').set({
                active_edition: 1,
                active_gameweek: 1
            }).then(() => {
                if (activeEditionSelect) {
                    activeEditionSelect.value = 1;
                }
                if (activeGameweekSelect) {
                    activeGameweekSelect.value = 1;
                }
                // Update global variable
                currentActiveGameweek = '1';
                if (statusMessage) {
                    statusMessage.textContent = 'Settings initialized with Edition 1, Game Week 1';
                    statusMessage.className = 'status-message success';
                }
            });
        }
    });
}

function saveCompetitionSettings() {
    console.log('=== saveCompetitionSettings FUNCTION CALLED ===');
    console.log('Function execution started at:', new Date().toISOString());
    console.log('Current database reference:', db);
    console.log('Window database reference:', window.db);
    
    // Ensure database is available
    if (!db && window.db) {
        db = window.db;
        console.log('Database reference initialized in saveCompetitionSettings');
    }
    
    const activeEditionSelect = document.querySelector('#active-edition-select');
    const activeGameweekSelect = document.querySelector('#active-gameweek-select');
    const statusMessage = document.querySelector('#settings-status');
    const saveSettingsBtn = document.querySelector('#save-settings-btn');
    
    console.log('Active edition select found:', !!activeEditionSelect);
    console.log('Active gameweek select found:', !!activeGameweekSelect);
    
    if (!activeEditionSelect || !activeGameweekSelect) {
        console.warn('Required select elements not found, returning early');
        return;
    }
    
    // Temporarily disable the button to prevent double-clicks
    if (saveSettingsBtn) {
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.style.cursor = 'not-allowed';
        saveSettingsBtn.textContent = 'Saving...';
    }
    
    const newActiveEdition = activeEditionSelect.value;
    const newActiveGameweek = activeGameweekSelect.value;
    
    // Update global variable
    currentActiveEdition = newActiveEdition;
    
    db.collection('settings').doc('currentCompetition').update({
        active_edition: newActiveEdition,
        active_gameweek: newActiveGameweek
    }).then(() => {
        if (statusMessage) {
            const editionText = `Edition ${newActiveEdition}`;
            const gameweekText = newActiveGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${newActiveGameweek}`;
            statusMessage.textContent = `Active settings updated to ${editionText}, ${gameweekText}`;
            statusMessage.className = 'status-message success';
        }
        
        // Update the active edition display
        const editionDisplay = document.querySelector('#current-edition-display');
        if (editionDisplay) {
            if (newActiveEdition === 'test') {
                editionDisplay.textContent = 'Test Weeks';
            } else {
                editionDisplay.textContent = `Edition ${newActiveEdition}`;
            }
        }
        
        // Re-enable the button
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.style.cursor = 'pointer';
            saveSettingsBtn.textContent = 'Save Settings';
        }
        
        // Refresh the admin panel to show updated data for the new edition
        db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
            if (settingsDoc.exists) {
                buildAdminDashboard();
            }
        });
        
        // Refresh fixtures display for the new edition
        if (typeof loadFixturesForGameweek === 'function') {
            loadFixturesForGameweek();
        }
        
        // Refresh scores display for the new edition
        if (typeof loadScoresForGameweek === 'function') {
            loadScoresForGameweek();
        }
    }).catch(error => {
        console.error('Error saving settings:', error);
        if (statusMessage) {
            statusMessage.textContent = 'Error saving settings';
            statusMessage.className = 'status-message error';
        }
        
        // Re-enable the button on error
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.style.cursor = 'pointer';
            saveSettingsBtn.textContent = 'Save Settings';
        }
    });
}

function addFixtureRow() {
    const container = document.querySelector('#fixtures-container');
    const fixtureRow = document.createElement('div');
    fixtureRow.className = 'fixture-row';
    
    let optionsHTML = '<option value="">-- Select Team --</option>';
    TEAMS_CONFIG.allTeams.forEach(team => {
        const badge = getTeamBadge(team);
        const badgeHtml = badge ? `<img src="${badge}" alt="${team}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
        optionsHTML += `<option value="${team}">${badgeHtml}${team}</option>`;
    });

    fixtureRow.innerHTML = `
        <div class="fixture-inputs">
            <select class="home-team">
                ${optionsHTML}
            </select>
            <span>vs</span>
            <select class="away-team">
                ${optionsHTML}
            </select>
            <input type="date" class="fixture-date" placeholder="Date">
            <input type="time" class="fixture-time" placeholder="Time">
            <button class="remove-fixture-btn" onclick="removeFixtureRow(this)">Remove</button>
        </div>
    `;
    
    container.appendChild(fixtureRow);
}

// Add missing importScoresFromFile function
async function importScoresFromFile(file, gameweek) {
    console.log('importScoresFromFile called with gameweek:', gameweek);
    
    try {
        const text = await file.text();
        const scores = JSON.parse(text);
        
        if (Array.isArray(scores)) {
            console.log(`Importing ${scores.length} scores from file`);
            // Here you would process the scores and update the database
            // For now, just log them
            scores.forEach((score, index) => {
                console.log(`Score ${index + 1}:`, score);
            });
        } else {
            console.error('Invalid scores format - expected array');
        }
    } catch (error) {
        console.error('Error importing scores from file:', error);
    }
}

function removeFixtureRow(button) {
    button.closest('.fixture-row').remove();
}

function saveFixtures() {
    const gameweek = document.querySelector('#gameweek-select').value;
    const fixtureRows = document.querySelectorAll('.fixture-row');
    const fixtures = [];

    fixtureRows.forEach(row => {
        const homeTeam = row.querySelector('.home-team').value;
        const awayTeam = row.querySelector('.away-team').value;
        const date = row.querySelector('.fixture-date').value;
        const time = row.querySelector('.fixture-time').value;

        if (homeTeam && awayTeam && date) {
            // Combine date and time into a single datetime string
            const dateTime = time ? `${date}T${time}` : `${date}T15:00`; // Default to 3 PM if no time specified
            
            fixtures.push({
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                date: dateTime,
                homeScore: null,
                awayScore: null,
                completed: false
            });
        }
    });

    // Check for duplicate teams
    const allTeams = [];
    const duplicateTeams = [];
    
    fixtures.forEach(fixture => {
        if (allTeams.includes(fixture.homeTeam)) {
            if (!duplicateTeams.includes(fixture.homeTeam)) {
                duplicateTeams.push(fixture.homeTeam);
            }
        } else {
            allTeams.push(fixture.homeTeam);
        }
        
        if (allTeams.includes(fixture.awayTeam)) {
            if (!duplicateTeams.includes(fixture.awayTeam)) {
                duplicateTeams.push(fixture.awayTeam);
            }
        } else {
            allTeams.push(fixture.awayTeam);
        }
    });

    // If duplicate teams found, show error and prevent saving
    if (duplicateTeams.length > 0) {
        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
        alert(`Unable to save fixtures for ${displayText}. The following teams appear more than once:\n\n${duplicateTeams.join(', ')}\n\nEach team can only appear once per game week.`);
        return;
    }

    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const gameweekValue = gameweek === 'tiebreak' ? 'tiebreak' : parseInt(gameweek);
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        
    if (fixtures.length > 0) {
        // Save fixtures to new edition-based structure
        db.collection('fixtures').doc(editionGameweekKey).set({
            gameweek: gameweekValue,
            edition: currentActiveEdition,
            fixtures: fixtures
        }).then(() => {
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            alert(`Fixtures saved for Edition ${currentActiveEdition}, ${displayText}`);
        }).catch(error => {
            console.error('Error saving fixtures:', error);
            alert('Error saving fixtures');
        });
    } else {
        // Delete the document if no fixtures (effectively clearing all fixtures)
        db.collection('fixtures').doc(editionGameweekKey).delete().then(() => {
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            alert(`All fixtures cleared for Edition ${currentActiveEdition}, ${displayText}`);
        }).catch(error => {
            console.error('Error clearing fixtures:', error);
            alert('Error clearing fixtures');
        });
    }
}

async function checkFixtures() {
    const gameweek = document.querySelector('#gameweek-select').value;
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const validationResults = document.querySelector('#fixture-validation-results');
    const validationStatus = document.querySelector('#validation-status');
    const validationDetails = document.querySelector('#validation-details');
    
    // Show validation results section
    validationResults.style.display = 'block';
    validationStatus.innerHTML = '<p>Checking fixtures against Football Web Pages API...</p>';
    validationDetails.innerHTML = '';
    
    try {
        // Get saved fixtures from database - try new structure first, then fallback to old
        const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        let fixtureDoc = await db.collection('fixtures').doc(editionGameweekKey).get();
        
        if (!fixtureDoc.exists) {
            // Fallback to old structure
            fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
        }
        
        if (!fixtureDoc.exists) {
            validationStatus.innerHTML = '<p class="error">No fixtures found for this game week.</p>';
            return;
        }
        
        const savedFixtures = fixtureDoc.data().fixtures;
        
        if (savedFixtures.length === 0) {
            validationStatus.innerHTML = '<p class="error">No fixtures found for this game week.</p>';
            return;
        }
        
        // Get date range for API query
        const dates = savedFixtures.map(fixture => new Date(fixture.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const startDate = minDate.toISOString().split('T')[0];
        const endDate = maxDate.toISOString().split('T')[0];
        
        // Fetch fixtures from Football Web Pages API for the date range
        const apiFixtures = await fetchFixturesFromFootballWebPages(5, '2025-2026', null, startDate, endDate);
        
        if (apiFixtures.length === 0) {
            validationStatus.innerHTML = '<p class="error">No fixtures found in API for the date range.</p>';
            return;
        }
        
        // Compare saved fixtures with API fixtures
        const validationResults = [];
        let validCount = 0;
        let invalidCount = 0;
        
        savedFixtures.forEach(savedFixture => {
            const savedDate = new Date(savedFixture.date);
            const savedDateStr = savedDate.toISOString().split('T')[0];
            const savedTime = savedDate.toTimeString().split(' ')[0].substring(0, 5);
            
            // Find matching API fixture
            const matchingApiFixture = apiFixtures.find(apiFixture => {
                const apiDate = new Date(apiFixture.date);
                const apiDateStr = apiDate.toISOString().split('T')[0];
                const apiTime = apiDate.toTimeString().split(' ')[0].substring(0, 5);
                
                // Check if teams match (allowing for slight name variations)
                const homeTeamMatch = normalizeTeamName(apiFixture.homeTeam) === normalizeTeamName(savedFixture.homeTeam);
                const awayTeamMatch = normalizeTeamName(apiFixture.awayTeam) === normalizeTeamName(savedFixture.awayTeam);
                
                return homeTeamMatch && awayTeamMatch && apiDateStr === savedDateStr;
            });
            
            if (matchingApiFixture) {
                const apiDate = new Date(matchingApiFixture.date);
                const apiTime = apiDate.toTimeString().split(' ')[0].substring(0, 5);
                
                const dateMatch = savedDateStr === apiDate.toISOString().split('T')[0];
                const timeMatch = savedTime === apiTime;
                const homeTeamMatch = normalizeTeamName(matchingApiFixture.homeTeam) === normalizeTeamName(savedFixture.homeTeam);
                const awayTeamMatch = normalizeTeamName(matchingApiFixture.awayTeam) === normalizeTeamName(savedFixture.awayTeam);
                
                if (dateMatch && timeMatch && homeTeamMatch && awayTeamMatch) {
                    validationResults.push({
                        fixture: savedFixture,
                        status: 'valid',
                        message: 'All details match API data'
                    });
                    validCount++;
                } else {
                    const issues = [];
                    if (!dateMatch) issues.push('Date mismatch');
                    if (!timeMatch) issues.push('Time mismatch');
                    if (!homeTeamMatch) issues.push('Home team name mismatch');
                    if (!awayTeamMatch) issues.push('Away team name mismatch');
                    
                    validationResults.push({
                        fixture: savedFixture,
                        status: 'invalid',
                        message: `Issues: ${issues.join(', ')}`,
                        apiFixture: matchingApiFixture
                    });
                    invalidCount++;
                }
            } else {
                validationResults.push({
                    fixture: savedFixture,
                    status: 'not_found',
                    message: 'Fixture not found in API data'
                });
                invalidCount++;
            }
        });
        
        // Display results
        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
        validationStatus.innerHTML = `
            <p class="summary">
                <strong>Validation Summary for ${displayText}:</strong><br>
                ✅ Valid: ${validCount} | ❌ Issues: ${invalidCount} | 📊 Total: ${savedFixtures.length}
            </p>
        `;
        
        // Display detailed results
        let detailsHtml = '<div class="validation-table">';
        detailsHtml += '<table><thead><tr><th>Fixture</th><th>Status</th><th>Details</th></tr></thead><tbody>';
        
        validationResults.forEach(result => {
            const savedDate = new Date(result.fixture.date);
            const dateStr = savedDate.toLocaleDateString('en-GB', { 
                timeZone: 'Europe/London',
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            const timeStr = savedDate.toLocaleTimeString('en-GB', { 
                timeZone: 'Europe/London',
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            let statusClass = '';
            let statusIcon = '';
            
            switch (result.status) {
                case 'valid':
                    statusClass = 'valid';
                    statusIcon = '✅';
                    break;
                case 'invalid':
                    statusClass = 'invalid';
                    statusIcon = '⚠️';
                    break;
                case 'not_found':
                    statusClass = 'not-found';
                    statusIcon = '❌';
                    break;
            }
            
            detailsHtml += `
                <tr class="${statusClass}">
                    <td>${result.fixture.homeTeam} vs ${result.fixture.awayTeam}<br><small>${dateStr} ${timeStr}</small></td>
                    <td>${statusIcon} ${result.status.replace('_', ' ').toUpperCase()}</td>
                    <td>${result.message}</td>
                </tr>
            `;
        });
        
        detailsHtml += '</tbody></table></div>';
        validationDetails.innerHTML = detailsHtml;
        
        // Add correction options if there are invalid fixtures
        if (invalidCount > 0) {
            const correctionHtml = `
                <div class="correction-options">
                    <h4>🔧 Correction Options</h4>
                    <p>Found ${invalidCount} fixtures with issues. You can:</p>
                    <button onclick="checkGamesOnSameDates()" class="cta-button">
                        🔍 Check Games on Same Dates
                    </button>
                    <button onclick="autoCorrectFixtures()" class="cta-button">
                        🔄 Auto-Correct Fixtures
                    </button>
                    <div id="correction-results"></div>
                </div>
            `;
            validationDetails.innerHTML += correctionHtml;
        }
        
    } catch (error) {
        console.error('Error checking fixtures:', error);
        validationStatus.innerHTML = `<p class="error">Error checking fixtures: ${error.message}</p>`;
    }
}

// Function to check for games on the same dates as invalid fixtures
async function checkGamesOnSameDates() {
    const gameweek = document.querySelector('#gameweek-select').value;
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const correctionResults = document.querySelector('#correction-results');
    
    correctionResults.innerHTML = '<p>🔍 Checking for games on the same dates...</p>';
    
    try {
        // Get saved fixtures from database
        const fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
        if (!fixtureDoc.exists) {
            correctionResults.innerHTML = '<p class="error">No fixtures found for this game week.</p>';
            return;
        }
        
        const savedFixtures = fixtureDoc.data().fixtures;
        
        // Get date range for API query
        const dates = savedFixtures.map(fixture => new Date(fixture.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const startDate = minDate.toISOString().split('T')[0];
        const endDate = maxDate.toISOString().split('T')[0];
        
        // Fetch all fixtures from Football Web Pages API for the date range
        const apiFixtures = await fetchFixturesFromFootballWebPages(5, '2025-2026', null, startDate, endDate);
        
        if (apiFixtures.length === 0) {
            correctionResults.innerHTML = '<p class="error">No fixtures found in API for the date range.</p>';
            return;
        }
        
        // Group API fixtures by date
        const fixturesByDate = {};
        apiFixtures.forEach(fixture => {
            const date = new Date(fixture.date);
            const dateStr = date.toISOString().split('T')[0];
            if (!fixturesByDate[dateStr]) {
                fixturesByDate[dateStr] = [];
            }
            fixturesByDate[dateStr].push(fixture);
        });
        
        // Find potential matches for each saved fixture
        let resultsHtml = '<div class="same-date-games">';
        resultsHtml += '<h5>🎯 Potential Matches Found:</h5>';
        
        savedFixtures.forEach((savedFixture, index) => {
            const savedDate = new Date(savedFixture.date);
            const savedDateStr = savedDate.toISOString().split('T')[0];
            const savedTime = savedDate.toTimeString().split(' ')[0].substring(0, 5);
            
            const sameDateFixtures = fixturesByDate[savedDateStr] || [];
            
            if (sameDateFixtures.length > 0) {
                resultsHtml += `
                    <div class="fixture-correction">
                        <h6>📅 ${savedDate.toLocaleDateString('en-GB', { 
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })} - ${savedFixture.homeTeam} vs ${savedFixture.awayTeam}</h6>
                        <p><strong>Current:</strong> ${savedTime} | <strong>Status:</strong> ${savedFixture.status || 'Unknown'}</p>
                        <div class="potential-matches">
                            <p><strong>Available games on this date:</strong></p>
                            <table class="correction-table">
                                <thead>
                                    <tr><th>Time</th><th>Home Team</th><th>Away Team</th><th>Venue</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                `;
                
                sameDateFixtures.forEach(apiFixture => {
                    const apiDate = new Date(apiFixture.date);
                    const apiTime = apiDate.toTimeString().split(' ')[0].substring(0, 5);
                    const isExactMatch = normalizeTeamName(apiFixture.homeTeam) === normalizeTeamName(savedFixture.homeTeam) &&
                                       normalizeTeamName(apiFixture.awayTeam) === normalizeTeamName(savedFixture.awayTeam);
                    
                    resultsHtml += `
                        <tr class="${isExactMatch ? 'exact-match' : 'potential-match'}">
                            <td>${apiTime}</td>
                            <td>${apiFixture.homeTeam}</td>
                            <td>${apiFixture.awayTeam}</td>
                            <td>${apiFixture.venue || 'N/A'}</td>
                            <td>
                                <button onclick="replaceFixture(${index}, '${apiFixture.homeTeam}', '${apiFixture.awayTeam}', '${apiFixture.date}', '${apiFixture.venue || ''}')" 
                                        class="small-button ${isExactMatch ? 'exact-match-btn' : 'replace-btn'}">
                                    ${isExactMatch ? '✅ Use Exact Match' : '🔄 Replace'}
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                resultsHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            } else {
                resultsHtml += `
                    <div class="fixture-correction">
                        <h6>📅 ${savedDate.toLocaleDateString('en-GB', { 
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })} - ${savedFixture.homeTeam} vs ${savedFixture.awayTeam}</h6>
                        <p class="no-matches">❌ No games found on this date in the API</p>
                    </div>
                `;
            }
        });
        
        resultsHtml += '</div>';
        correctionResults.innerHTML = resultsHtml;
        
    } catch (error) {
        console.error('Error checking games on same dates:', error);
        correctionResults.innerHTML = `<p class="error">Error checking games: ${error.message}</p>`;
    }
}

// Function to replace a fixture with API data
async function replaceFixture(index, homeTeam, awayTeam, date, venue) {
    const gameweek = document.querySelector('#gameweek-select').value;
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    
    try {
        // Get current fixtures
        const fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
        if (!fixtureDoc.exists) {
            alert('No fixtures found for this game week.');
            return;
        }
        
        const fixtures = fixtureDoc.data().fixtures;
        
        // Update the specific fixture
        fixtures[index] = {
            ...fixtures[index], // Keep existing data
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            date: date,
            venue: venue
        };
        
        // Save updated fixtures
        await db.collection('fixtures').doc(gameweekKey).update({
            fixtures: fixtures
        });
        
        // Refresh the display
        loadFixturesForGameweek();
        
        // Show success message
        const correctionResults = document.querySelector('#correction-results');
        correctionResults.innerHTML = `
            <div class="success-message">
                ✅ Fixture ${index + 1} updated successfully!<br>
                <strong>${homeTeam} vs ${awayTeam}</strong><br>
                <small>Date: ${new Date(date).toLocaleDateString('en-GB')}</small>
            </div>
        `;
        
        // Re-run fixture check after a short delay
        setTimeout(() => {
            checkFixtures();
        }, 2000);
        
    } catch (error) {
        console.error('Error replacing fixture:', error);
        alert(`Error replacing fixture: ${error.message}`);
    }
}

// Function to auto-correct fixtures based on best matches
async function autoCorrectFixtures() {
    const gameweek = document.querySelector('#gameweek-select').value;
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const correctionResults = document.querySelector('#correction-results');
    
    correctionResults.innerHTML = '<p>🔄 Auto-correcting fixtures...</p>';
    
    try {
        // Get saved fixtures from database
        const fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
        if (!fixtureDoc.exists) {
            correctionResults.innerHTML = '<p class="error">No fixtures found for this game week.</p>';
            return;
        }
        
        const savedFixtures = fixtureDoc.data().fixtures;
        
        // Get date range for API query
        const dates = savedFixtures.map(fixture => new Date(fixture.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const startDate = minDate.toISOString().split('T')[0];
        const endDate = maxDate.toISOString().split('T')[0];
        
        // Fetch all fixtures from Football Web Pages API for the date range
        const apiFixtures = await fetchFixturesFromFootballWebPages(5, '2025-2026', null, startDate, endDate);
        
        if (apiFixtures.length === 0) {
            correctionResults.innerHTML = '<p class="error">No fixtures found in API for the date range.</p>';
            return;
        }
        
        let correctedCount = 0;
        const updatedFixtures = [...savedFixtures];
        
        // Try to find best matches for each saved fixture
        savedFixtures.forEach((savedFixture, index) => {
            const savedDate = new Date(savedFixture.date);
            const savedDateStr = savedDate.toISOString().split('T')[0];
            
            // Find best match from API fixtures
            let bestMatch = null;
            let bestScore = 0;
            
            apiFixtures.forEach(apiFixture => {
                const apiDate = new Date(apiFixture.date);
                const apiDateStr = apiDate.toISOString().split('T')[0];
                
                if (apiDateStr === savedDateStr) {
                    // Calculate match score based on team name similarity
                    const homeTeamScore = calculateTeamNameSimilarity(apiFixture.homeTeam, savedFixture.homeTeam);
                    const awayTeamScore = calculateTeamNameSimilarity(apiFixture.awayTeam, savedFixture.awayTeam);
                    const totalScore = (homeTeamScore + awayTeamScore) / 2;
                    
                    if (totalScore > bestScore && totalScore > 0.7) { // Only consider good matches
                        bestScore = totalScore;
                        bestMatch = apiFixture;
                    }
                }
            });
            
            if (bestMatch) {
                updatedFixtures[index] = {
                    ...savedFixture, // Keep existing data
                    homeTeam: bestMatch.homeTeam,
                    awayTeam: bestMatch.awayTeam,
                    date: bestMatch.date,
                    venue: bestMatch.venue || savedFixture.venue
                };
                correctedCount++;
            }
        });
        
        // Save updated fixtures
        await db.collection('fixtures').doc(gameweekKey).update({
            fixtures: updatedFixtures
        });
        
        // Refresh the display
        loadFixturesForGameweek();
        
        // Show results
        correctionResults.innerHTML = `
            <div class="success-message">
                ✅ Auto-corrected ${correctedCount} out of ${savedFixtures.length} fixtures!<br>
                <small>Based on team name similarity and date matching.</small>
            </div>
        `;
        
        // Re-run fixture check after a short delay
        setTimeout(() => {
            checkFixtures();
        }, 2000);
        
    } catch (error) {
        console.error('Error auto-correcting fixtures:', error);
        correctionResults.innerHTML = `<p class="error">Error auto-correcting fixtures: ${error.message}</p>`;
    }
}

// Helper function to calculate team name similarity
function calculateTeamNameSimilarity(name1, name2) {
    const normalized1 = normalizeTeamName(name1);
    const normalized2 = normalizeTeamName(name2);
    
    if (normalized1 === normalized2) return 1.0;
    
    // Simple similarity calculation (can be improved with more sophisticated algorithms)
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    
    let commonWords = 0;
    words1.forEach(word1 => {
        if (words2.includes(word1)) {
            commonWords++;
        }
    });
    
    return commonWords / Math.max(words1.length, words2.length);
}

// Helper function to normalize team names for comparison
function normalizeTeamName(teamName) {
    return teamName.toLowerCase()
        .replace(/fc\s+/g, '')  // Remove "FC "
        .replace(/\s+fc$/g, '') // Remove " FC" at end
        .replace(/\s+/g, ' ')   // Normalize spaces
        .trim();
}

// --- FIXTURE MANAGEMENT TOOLS FUNCTIONS ---
function initializeFixtureManagementTools() {
    const reallocateFixturesBtn = document.querySelector('#reallocate-fixtures-btn');
    const deleteAllFixturesBtn = document.querySelector('#delete-all-fixtures-btn');
    
    if (reallocateFixturesBtn) {
        reallocateFixturesBtn.addEventListener('click', reallocateFixtures);
    }
    
    if (deleteAllFixturesBtn) {
        deleteAllFixturesBtn.addEventListener('click', deleteAllFixtures);
    }
}

async function reallocateFixtures() {
    const sourceGameweek = document.querySelector('#source-gameweek').value;
    const targetGameweek = document.querySelector('#target-gameweek').value;
    const statusElement = document.querySelector('#reallocate-status');
    
    if (sourceGameweek === targetGameweek) {
        statusElement.textContent = 'Source and target game weeks must be different.';
        statusElement.className = 'status-message error';
        return;
    }
    
    if (!sourceGameweek || !targetGameweek) {
        statusElement.textContent = 'Please select both source and target game weeks.';
        statusElement.className = 'status-message error';
        return;
    }
    
    statusElement.textContent = 'Reallocating fixtures...';
    statusElement.className = 'status-message info';
    
    try {
        const sourceKey = sourceGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${sourceGameweek}`;
        const targetKey = targetGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${targetGameweek}`;
        
        // Get source fixtures
        const sourceDoc = await db.collection('fixtures').doc(sourceKey).get();
        
        if (!sourceDoc.exists) {
            statusElement.textContent = `No fixtures found in ${sourceGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${sourceGameweek}`}.`;
            statusElement.className = 'status-message error';
            return;
        }
        
        const sourceData = sourceDoc.data();
        const fixtures = sourceData.fixtures;
        
        if (!fixtures || fixtures.length === 0) {
            statusElement.textContent = `No fixtures found in ${sourceGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${sourceGameweek}`}.`;
            statusElement.className = 'status-message error';
            return;
        }
        
        // Update target gameweek with source fixtures
        await db.collection('fixtures').doc(targetKey).set({
            gameweek: targetGameweek === 'tiebreak' ? 'tiebreak' : parseInt(targetGameweek),
            fixtures: fixtures
        });
        
        // Delete source fixtures
        await db.collection('fixtures').doc(sourceKey).delete();
        
        const sourceDisplay = sourceGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${sourceGameweek}`;
        const targetDisplay = targetGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${targetGameweek}`;
        
        statusElement.textContent = `Successfully reallocated ${fixtures.length} fixtures from ${sourceDisplay} to ${targetDisplay}.`;
        statusElement.className = 'status-message success';
        
        // Refresh the current fixture display if we're on the fixtures tab
        const currentGameweekSelect = document.querySelector('#gameweek-select');
        if (currentGameweekSelect && currentGameweekSelect.value === targetGameweek) {
            loadFixturesForGameweek();
        }
        
    } catch (error) {
        console.error('Error reallocating fixtures:', error);
        statusElement.textContent = 'Error reallocating fixtures: ' + error.message;
        statusElement.className = 'status-message error';
    }
}

async function deleteAllFixtures() {
    const deleteGameweek = document.querySelector('#delete-gameweek').value;
    const statusElement = document.querySelector('#delete-status');
    
    if (!deleteGameweek) {
        statusElement.textContent = 'Please select a game week to delete.';
        statusElement.className = 'status-message error';
        return;
    }
    
    // Confirm deletion
    const gameweekDisplay = deleteGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${deleteGameweek}`;
    const confirmMessage = `Are you sure you want to delete ALL fixtures from ${gameweekDisplay}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    statusElement.textContent = 'Deleting fixtures...';
    statusElement.className = 'status-message info';
    
    try {
        const gameweekKey = deleteGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${deleteGameweek}`;
        
        // Check if fixtures exist
        const doc = await db.collection('fixtures').doc(gameweekKey).get();
        
        if (!doc.exists) {
            statusElement.textContent = `No fixtures found in ${gameweekDisplay}.`;
            statusElement.className = 'status-message error';
            return;
        }
        
        // Delete the fixtures
        await db.collection('fixtures').doc(gameweekKey).delete();
        
        statusElement.textContent = `Successfully deleted all fixtures from ${gameweekDisplay}.`;
        statusElement.className = 'status-message success';
        
        // Refresh the current fixture display if we're on the fixtures tab
        const currentGameweekSelect = document.querySelector('#gameweek-select');
        if (currentGameweekSelect && currentGameweekSelect.value === deleteGameweek) {
            loadFixturesForGameweek();
        }
        
    } catch (error) {
        console.error('Error deleting fixtures:', error);
        statusElement.textContent = 'Error deleting fixtures: ' + error.message;
        statusElement.className = 'status-message error';
    }
}

// --- FOOTBALL WEB PAGES API INTEGRATION ---
function initializeFootballWebPagesAPI() {
    const testApiConnectionBtn = document.querySelector('#test-api-connection');
    const fetchDateRangeFixturesBtn = document.querySelector('#fetch-date-range-fixtures-btn');
    const fetchAllFixturesBtn = document.querySelector('#fetch-all-fixtures-btn');
    const selectAllFixturesBtn = document.querySelector('#select-all-fixtures-btn');
    const deselectAllFixturesBtn = document.querySelector('#deselect-all-fixtures-btn');
    const importSelectedFixturesBtn = document.querySelector('#import-selected-fixtures-btn');
    
    // Check API key status on initialization
    checkApiKeyStatus();
    
    if (testApiConnectionBtn) {
        testApiConnectionBtn.addEventListener('click', testApiConnection);
    }
    if (fetchDateRangeFixturesBtn) {
        fetchDateRangeFixturesBtn.addEventListener('click', fetchDateRangeFixtures);
    }
    if (fetchAllFixturesBtn) {
        fetchAllFixturesBtn.addEventListener('click', fetchAllFixtures);
    }
    if (selectAllFixturesBtn) {
        selectAllFixturesBtn.addEventListener('click', selectAllFixtures);
    }
    if (deselectAllFixturesBtn) {
        deselectAllFixturesBtn.addEventListener('click', deselectAllFixtures);
    }
    if (importSelectedFixturesBtn) {
        importSelectedFixturesBtn.addEventListener('click', importSelectedFixtures);
    }
}

async function testApiConnection() {
    const statusElement = document.querySelector('#api-key-status');
    const testBtn = document.querySelector('#test-api-connection');
    
    statusElement.textContent = 'Testing connection...';
    statusElement.className = 'status-indicator checking';
    testBtn.disabled = true;
    
    try {
        // Test with the fixtures-results endpoint to check if the key is valid
        const response = await fetch(`${FOOTBALL_WEBPAGES_CONFIG.BASE_URL}/fixtures-results.json?comp=5`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_KEY,
                'X-RapidAPI-Host': FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_HOST
            }
        });
        
        if (response.ok) {
            statusElement.textContent = 'API key valid ✓';
            statusElement.className = 'status-indicator valid';
        } else {
            statusElement.textContent = 'API key invalid ✗';
            statusElement.className = 'status-indicator invalid';
        }
    } catch (error) {
        console.error('API connection test failed:', error);
        statusElement.textContent = 'Connection failed ✗';
        statusElement.className = 'status-indicator invalid';
    } finally {
        testBtn.disabled = false;
    }
}

function checkApiKeyStatus() {
    const statusElement = document.querySelector('#api-key-status');
    
    if (FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
        statusElement.textContent = 'API key not configured ✗';
        statusElement.className = 'status-indicator invalid';
    } else {
        statusElement.textContent = 'API key configured ✓';
        statusElement.className = 'status-indicator valid';
    }
}

async function fetchAvailableMatchdays() {
    const league = document.querySelector('#setup-league').value;
    const season = document.querySelector('#setup-season').value;
    const statusElement = document.querySelector('#setup-status');
    
    if (!league || !season) {
        statusElement.innerHTML = '<p>Please select league and season.</p>';
        return;
    }
    
    statusElement.innerHTML = '<p>Fetching available matchdays...</p>';
    
    try {
        const matchdays = await fetchMatchdaysFromFootballWebPages(league, season);
        
        if (matchdays.length > 0) {
            displayMatchdaysSelection(matchdays);
            statusElement.innerHTML = `<p>Found ${matchdays.length} matchdays.</p>`;
        } else {
            statusElement.innerHTML = '<p>No matchdays found for the selected criteria.</p>';
        }
    } catch (error) {
        console.error('Error fetching matchdays:', error);
        statusElement.innerHTML = `<p>Error fetching matchdays: ${error.message}</p>`;
    }
}

async function fetchSingleFixtures() {
    const league = document.querySelector('#single-league').value;
    const season = document.querySelector('#single-season').value;
    const matchday = document.querySelector('#single-matchday').value;
    const statusElement = document.querySelector('#football-webpages-status');
    
    if (!league || !season || !matchday) {
        statusElement.innerHTML = '<p>Please select league, season, and matchday.</p>';
        return;
    }
    
    statusElement.innerHTML = '<p>Fetching fixtures...</p>';
    
    try {
        const fixtures = await fetchFixturesFromFootballWebPages(league, season, matchday);
        
        if (fixtures.length > 0) {
            statusElement.innerHTML = `
                <p>Found ${fixtures.length} fixtures:</p>
                <div class="fixtures-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Home Team</th>
                                <th>Away Team</th>
                                <th>Date</th>
                                <th>Time (BST)</th>
                                <th>Venue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fixtures.map(fixture => {
                                const fixtureDate = new Date(fixture.date);
                                const bstTime = fixtureDate.toLocaleTimeString('en-GB', { 
                                    timeZone: 'Europe/London',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });
                                const bstDate = fixtureDate.toLocaleDateString('en-GB', { 
                                    timeZone: 'Europe/London',
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                });
                                
                                return `
                                    <tr>
                                        <td>${fixture.homeTeam}</td>
                                        <td>${fixture.awayTeam}</td>
                                        <td>${bstDate}</td>
                                        <td>${bstTime}</td>
                                        <td>${fixture.venue || 'TBC'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <button id="import-fixtures-btn" class="cta-button">Import to Current Gameweek</button>
            `;
            
            // Store fixtures for import
            window.currentFixtures = fixtures;
            
            // Add import event listener
            document.querySelector('#import-fixtures-btn').addEventListener('click', () => {
                importFixturesToCurrentGameweek(fixtures);
            });
        } else {
            statusElement.innerHTML = '<p>No fixtures found for the selected criteria.</p>';
        }
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        statusElement.innerHTML = `<p>Error fetching fixtures: ${error.message}</p>`;
    }
}

async function fetchSingleScores() {
    const league = document.querySelector('#single-league').value;
    const season = document.querySelector('#single-season').value;
    const matchday = document.querySelector('#single-matchday').value;
    const statusElement = document.querySelector('#football-webpages-status');
    
    statusElement.innerHTML = '<p>Fetching scores...</p>';
    
    try {
        // Handle tiebreak gameweek
        const gameweekKey = matchday === 'tiebreak' ? 'gwtiebreak' : `gw${matchday}`;
        
        // First get existing fixtures
        const fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
        
        if (!fixtureDoc.exists) {
            const displayText = matchday === 'tiebreak' ? 'Tiebreak Round' : `Matchday ${matchday}`;
            statusElement.innerHTML = `<p>No fixtures found for ${displayText}. Please fetch fixtures first.</p>`;
            return;
        }
        
        const existingFixtures = fixtureDoc.data().fixtures;
        const updatedFixtures = await fetchScoresFromFootballWebPages(league, season, matchday, existingFixtures);
        
        // Save updated fixtures with scores
        await db.collection('fixtures').doc(gameweekKey).update({
            fixtures: updatedFixtures
        });
        
        const displayText = matchday === 'tiebreak' ? 'Tiebreak Round' : `Matchday ${matchday}`;
        statusElement.innerHTML = `<p>Successfully updated scores for ${displayText}</p>`;
        
        // Process results and deduct lives
        processResults(matchday, updatedFixtures);
        
        // Refresh the score display
        loadScoresForGameweek();
    } catch (error) {
        console.error('API error:', error);
        statusElement.innerHTML = `<p>Error fetching scores: ${error.message}</p>`;
    }
}

async function fetchDateRangeFixtures() {
    const league = document.querySelector('#date-range-league').value;
    const season = document.querySelector('#date-range-season').value;
    const startDate = document.querySelector('#start-date').value;
    const endDate = document.querySelector('#end-date').value;
    const statusElement = document.querySelector('#football-webpages-status');
    
    if (!league || !season) {
        statusElement.innerHTML = '<p>Please select league and season.</p>';
        return;
    }
    
    if (!startDate && !endDate) {
        statusElement.innerHTML = '<p>Please select at least one date (start date or end date).</p>';
        return;
    }
    
    statusElement.innerHTML = '<p>Fetching fixtures for date range...</p>';
    
    try {
        const fixtures = await fetchFixturesFromFootballWebPages(league, season, null, startDate, endDate);
        
        if (fixtures.length > 0) {
            // Group fixtures by date for better display
            const fixturesByDate = groupFixturesByDate(fixtures);
            
            statusElement.innerHTML = `
                <p>Found ${fixtures.length} fixtures for the selected date range:</p>
                <div class="fixtures-table">
                    <table>
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="select-all-fixtures" checked></th>
                                <th>Date</th>
                                <th>Home Team</th>
                                <th>Away Team</th>
                                <th>Time (BST)</th>
                                <th>Venue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fixtures.map((fixture, index) => {
                                const fixtureDate = new Date(fixture.date);
                                const bstTime = fixtureDate.toLocaleTimeString('en-GB', { 
                                    timeZone: 'Europe/London',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });
                                const bstDate = fixtureDate.toLocaleDateString('en-GB', { 
                                    timeZone: 'Europe/London',
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                });
                                
                                return `
                                    <tr>
                                        <td><input type="checkbox" class="fixture-checkbox" value="${index}" checked></td>
                                        <td>${bstDate}</td>
                                        <td>${fixture.homeTeam}</td>
                                        <td>${fixture.awayTeam}</td>
                                        <td>${bstTime}</td>
                                        <td>${fixture.venue || 'TBC'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            // Store fixtures for import
            window.currentFixtures = fixtures;
            
            // Show import controls
            document.querySelector('#import-controls').style.display = 'block';
            
            // Add select all functionality
            const selectAllCheckbox = document.querySelector('#select-all-fixtures');
            const fixtureCheckboxes = document.querySelectorAll('.fixture-checkbox');
            
            selectAllCheckbox.addEventListener('change', (e) => {
                fixtureCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
            
            // Update select all when individual checkboxes change
            fixtureCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const allChecked = Array.from(fixtureCheckboxes).every(cb => cb.checked);
                    selectAllCheckbox.checked = allChecked;
                });
            });
        } else {
            statusElement.innerHTML = '<p>No fixtures found for the selected date range.</p>';
            document.querySelector('#import-controls').style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        statusElement.innerHTML = `<p>Error fetching fixtures: ${error.message}</p>`;
        document.querySelector('#import-controls').style.display = 'none';
    }
}

async function fetchAllFixtures() {
    const league = document.querySelector('#date-range-league').value;
    const season = document.querySelector('#date-range-season').value;
    const statusElement = document.querySelector('#football-webpages-status');
    
    if (!league || !season) {
        statusElement.innerHTML = '<p>Please select league and season.</p>';
        return;
    }
    
    statusElement.innerHTML = '<p>Fetching all fixtures (this may take a moment)...</p>';
    
    try {
        const fixtures = await fetchFixturesFromFootballWebPages(league, season, null);
        
        if (fixtures.length > 0) {
            // Group fixtures by date for better display
            const fixturesByDate = groupFixturesByDate(fixtures);
            
            statusElement.innerHTML = `
                <p>Found ${fixtures.length} fixtures total:</p>
                <div class="fixtures-table">
                    <table>
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="select-all-fixtures" checked></th>
                                <th>Date</th>
                                <th>Home Team</th>
                                <th>Away Team</th>
                                <th>Time (BST)</th>
                                <th>Venue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fixtures.map((fixture, index) => {
                                const fixtureDate = new Date(fixture.date);
                                const bstTime = fixtureDate.toLocaleTimeString('en-GB', { 
                                    timeZone: 'Europe/London',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });
                                const bstDate = fixtureDate.toLocaleDateString('en-GB', { 
                                    timeZone: 'Europe/London',
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                });
                                
                                return `
                                    <tr>
                                        <td><input type="checkbox" class="fixture-checkbox" value="${index}" checked></td>
                                        <td>${bstDate}</td>
                                        <td>${fixture.homeTeam}</td>
                                        <td>${fixture.awayTeam}</td>
                                        <td>${bstTime}</td>
                                        <td>${fixture.venue || 'TBC'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            // Store fixtures for import
            window.currentFixtures = fixtures;
            
            // Show import controls
            document.querySelector('#import-controls').style.display = 'block';
            
            // Add select all functionality
            const selectAllCheckbox = document.querySelector('#select-all-fixtures');
            const fixtureCheckboxes = document.querySelectorAll('.fixture-checkbox');
            
            selectAllCheckbox.addEventListener('change', (e) => {
                fixtureCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
            
            // Update select all when individual checkboxes change
            fixtureCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const allChecked = Array.from(fixtureCheckboxes).every(cb => cb.checked);
                    selectAllCheckbox.checked = allChecked;
                });
            });
        } else {
            statusElement.innerHTML = '<p>No fixtures found.</p>';
            document.querySelector('#import-controls').style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        statusElement.innerHTML = `<p>Error fetching fixtures: ${error.message}</p>`;
        document.querySelector('#import-controls').style.display = 'none';
    }
}

function groupFixturesByDate(fixtures) {
    const grouped = {};
    fixtures.forEach(fixture => {
        const date = new Date(fixture.date).toDateString();
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(fixture);
    });
    return grouped;
}

function selectAllFixtures() {
    const fixtureCheckboxes = document.querySelectorAll('.fixture-checkbox');
    const selectAllCheckbox = document.querySelector('#select-all-fixtures');
    
    fixtureCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    selectAllCheckbox.checked = true;
}

function deselectAllFixtures() {
    const fixtureCheckboxes = document.querySelectorAll('.fixture-checkbox');
    const selectAllCheckbox = document.querySelector('#select-all-fixtures');
    
    fixtureCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    selectAllCheckbox.checked = false;
}

async function importSelectedFixtures() {
    const selectedCheckboxes = document.querySelectorAll('.fixture-checkbox:checked');
    const importGameweek = document.querySelector('#import-gameweek-select').value;
    
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one fixture to import.');
        return;
    }
    
    if (!window.currentFixtures) {
        alert('No fixtures available to import. Please fetch fixtures first.');
        return;
    }
    
    // Get selected fixtures
    const selectedFixtures = [];
    selectedCheckboxes.forEach(checkbox => {
        const index = parseInt(checkbox.value);
        if (window.currentFixtures[index]) {
            selectedFixtures.push(window.currentFixtures[index]);
        }
    });
    
    if (selectedFixtures.length === 0) {
        alert('No valid fixtures selected for import.');
        return;
    }
    
    // Import to selected game week
    const gameweekKey = importGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${importGameweek}`;
    const gameweekValue = importGameweek === 'tiebreak' ? 'tiebreak' : parseInt(importGameweek);
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
    
    try {
        await db.collection('fixtures').doc(editionGameweekKey).set({
            gameweek: gameweekValue,
            edition: currentActiveEdition,
            fixtures: selectedFixtures
        });
        
        const displayText = importGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${importGameweek}`;
        alert(`Successfully imported ${selectedFixtures.length} fixtures to Edition ${currentActiveEdition}, ${displayText}`);
        
        // Refresh the fixture display if we're on the fixtures tab
        const currentGameweek = document.querySelector('#gameweek-select').value;
        if (currentGameweek === importGameweek) {
            loadFixturesForGameweek();
        }
    } catch (error) {
        console.error('Error importing fixtures:', error);
        alert('Error importing fixtures: ' + error.message);
    }
}

async function fetchFixturesFromSelectedMatchdays() {
    const gameweek = document.querySelector('#setup-gameweek-select').value;
    const league = document.querySelector('#setup-league').value;
    const season = document.querySelector('#setup-season').value;
    const statusElement = document.querySelector('#setup-status');
    
    // Get selected matchdays
    const selectedMatchdays = [];
    document.querySelectorAll('#matchdays-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
        if (checkbox.value !== 'select-all') {
            selectedMatchdays.push(checkbox.value);
        }
    });
    
    if (selectedMatchdays.length === 0) {
        statusElement.innerHTML = '<p>Please select at least one matchday.</p>';
        return;
    }
    
    statusElement.innerHTML = '<p>Fetching fixtures from selected matchdays...</p>';
    
    try {
        let allFixtures = [];
        
        for (const matchday of selectedMatchdays) {
            const fixtures = await fetchFixturesFromFootballWebPages(league, season, matchday);
            allFixtures = allFixtures.concat(fixtures);
        }
        
        if (allFixtures.length > 0) {
            // Save to database
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const gameweekValue = gameweek === 'tiebreak' ? 'tiebreak' : parseInt(gameweek);
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            
            await db.collection('fixtures').doc(editionGameweekKey).set({
                gameweek: gameweekValue,
                edition: currentActiveEdition,
                fixtures: allFixtures,
                league: league,
                season: season
            });
            
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            statusElement.innerHTML = `<p>Successfully fetched ${allFixtures.length} fixtures for Edition ${currentActiveEdition}, ${displayText}</p>`;
            
            // Refresh the fixture display
            loadFixturesForGameweek();
        } else {
            statusElement.innerHTML = '<p>No fixtures found for the selected matchdays.</p>';
        }
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        statusElement.innerHTML = `<p>Error fetching fixtures: ${error.message}</p>`;
    }
}

function displayMatchdaysSelection(matchdays) {
    const container = document.querySelector('#matchdays-checkboxes');
    const selectionDiv = document.querySelector('#matchdays-selection');
    
    let html = `
        <div class="matchday-checkbox-item select-all-item">
            <input type="checkbox" id="select-all-matchdays" value="select-all">
            <label for="select-all-matchdays"><strong>Select All Matchdays</strong></label>
        </div>
    `;
    
    matchdays.forEach(matchday => {
        const matchdayId = `matchday-${matchday.id}`;
        html += `
            <div class="matchday-checkbox-item">
                <input type="checkbox" id="${matchdayId}" value="${matchday.id}">
                <label for="${matchdayId}">${matchday.name}</label>
            </div>
        `;
    });
    
    container.innerHTML = html;
    selectionDiv.style.display = 'block';
    
    // Add select all functionality
    const selectAllCheckbox = document.querySelector('#select-all-matchdays');
    const matchdayCheckboxes = document.querySelectorAll('#matchdays-checkboxes input[type="checkbox"]:not([value="select-all"])');
    
    selectAllCheckbox.addEventListener('change', function() {
        matchdayCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    
    // Update select all when individual checkboxes change
    matchdayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(matchdayCheckboxes).every(cb => cb.checked);
            const someChecked = Array.from(matchdayCheckboxes).some(cb => cb.checked);
            
            if (allChecked) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (someChecked) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        });
    });
}

async function importFixturesToCurrentGameweek(fixtures) {
    const gameweek = document.querySelector('#gameweek-select').value;
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const gameweekValue = gameweek === 'tiebreak' ? 'tiebreak' : parseInt(gameweek);
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
    
    try {
        await db.collection('fixtures').doc(editionGameweekKey).set({
            gameweek: gameweekValue,
            edition: currentActiveEdition,
            fixtures: fixtures
        });
        
        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
        alert(`Successfully imported ${fixtures.length} fixtures to Edition ${currentActiveEdition}, ${displayText}`);
        
        // Refresh the fixture display
        loadFixturesForGameweek();
    } catch (error) {
        console.error('Error importing fixtures:', error);
        alert('Error importing fixtures: ' + error.message);
    }
}

async function fetchAvailableRounds() {
    const league = document.querySelector('#setup-league').value;
    const season = document.querySelector('#setup-season').value;
    const statusDiv = document.querySelector('#setup-status');

    statusDiv.innerHTML = '<p>🔄 Fetching available rounds from TheSportsDB...</p>';
    console.log(`Fetching available rounds for league ${league}, season ${season}`);

    try {
        const rounds = await fetchAvailableRoundsFromTheSportsDB(league, season);
        if (rounds.length > 0) {
            displayRoundsSelection(rounds);
            statusDiv.innerHTML = `<p class="success">✅ Successfully fetched ${rounds.length} available rounds for ${season} season.</p>`;
        } else {
            statusDiv.innerHTML = `<p class="error">❌ No available rounds found in TheSportsDB for National League ${season}.</p>`;
        }
    } catch (error) {
        console.error('API error:', error);
        statusDiv.innerHTML = `<p class="error">❌ Error fetching available rounds: ${error.message}</p>`;
    }
}

function displayRoundsSelection(rounds) {
    const roundsSelection = document.querySelector('#rounds-selection');
    const roundsCheckboxes = document.querySelector('#rounds-checkboxes');
    
    roundsCheckboxes.innerHTML = '';
    
    // Add a "Select All" checkbox
    const selectAllItem = document.createElement('div');
    selectAllItem.className = 'round-checkbox-item select-all-item';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-rounds';
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'select-all-rounds';
    selectAllLabel.textContent = 'Select All Rounds';
    selectAllLabel.style.fontWeight = 'bold';
    
    selectAllItem.appendChild(selectAllCheckbox);
    selectAllItem.appendChild(selectAllLabel);
    roundsCheckboxes.appendChild(selectAllItem);
    
    // Add event listener for select all
    selectAllCheckbox.addEventListener('change', (e) => {
        const allCheckboxes = document.querySelectorAll('#rounds-checkboxes input[type="checkbox"]:not(#select-all-rounds)');
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });
    
    // Create a container for regular rounds (excluding Tiebreak)
    const regularRoundsContainer = document.createElement('div');
    regularRoundsContainer.className = 'regular-rounds-container';
    regularRoundsContainer.style.display = 'grid';
    regularRoundsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
    regularRoundsContainer.style.gap = '8px';
    regularRoundsContainer.style.marginBottom = '15px';
    
    // Add regular rounds (1-46)
    rounds.forEach(round => {
        if (round !== 'Tiebreak') {
            const checkboxItem = document.createElement('div');
            checkboxItem.className = 'round-checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `round-${round}`;
            checkbox.value = round;
            
            const label = document.createElement('label');
            label.htmlFor = `round-${round}`;
            label.textContent = round;
            
            checkboxItem.appendChild(checkbox);
            checkboxItem.appendChild(label);
            regularRoundsContainer.appendChild(checkboxItem);
        }
    });
    
    roundsCheckboxes.appendChild(regularRoundsContainer);
    
    // Add Tiebreak round separately
    const tiebreakItem = document.createElement('div');
    tiebreakItem.className = 'round-checkbox-item tiebreak-item';
    tiebreakItem.style.borderTop = '1px solid #ccc';
    tiebreakItem.style.paddingTop = '10px';
    tiebreakItem.style.marginTop = '10px';
    
    const tiebreakCheckbox = document.createElement('input');
    tiebreakCheckbox.type = 'checkbox';
    tiebreakCheckbox.id = 'round-Tiebreak';
    tiebreakCheckbox.value = 'Tiebreak';
    
    const tiebreakLabel = document.createElement('label');
    tiebreakLabel.htmlFor = 'round-Tiebreak';
    tiebreakLabel.textContent = 'Tiebreak';
    tiebreakLabel.style.fontWeight = 'bold';
    tiebreakLabel.style.color = '#d32f2f';
    
    tiebreakItem.appendChild(tiebreakCheckbox);
    tiebreakItem.appendChild(tiebreakLabel);
    roundsCheckboxes.appendChild(tiebreakItem);
    
    roundsSelection.style.display = 'block';
}

async function fetchFixturesFromSelectedRounds() {
    const gameweek = document.querySelector('#setup-gameweek-select').value;
    const league = document.querySelector('#setup-league').value;
    const season = document.querySelector('#setup-season').value;
    const statusDiv = document.querySelector('#setup-status');
    
    // Get selected rounds
    const selectedRounds = Array.from(document.querySelectorAll('#rounds-checkboxes input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedRounds.length === 0) {
        statusDiv.innerHTML = '<p class="error">❌ Please select at least one round to fetch fixtures.</p>';
        return;
    }

    statusDiv.innerHTML = '<p class="info">🔄 Fetching fixtures for selected rounds from TheSportsDB...</p>';
    console.log(`Fetching fixtures for gameweek ${gameweek}, league ${league}, season ${season}, rounds: ${selectedRounds.join(', ')}`);

    try {
        const allFixtures = [];
        
        // Fetch fixtures for each selected round
        for (const round of selectedRounds) {
            const roundNumber = round.replace('Round ', '');
            const fixtures = await fetchFixturesFromTheSportsDB(league, season, roundNumber);
            allFixtures.push(...fixtures);
        }
        
        if (allFixtures.length > 0) {
            // Handle tiebreak gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const gameweekValue = gameweek === 'tiebreak' ? 'tiebreak' : parseInt(gameweek);
            
            // Save fetched fixtures to database
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            await db.collection('fixtures').doc(editionGameweekKey).set({
                gameweek: gameweekValue,
                edition: currentActiveEdition,
                fixtures: allFixtures,
                league: league,
                season: season,
                rounds: selectedRounds
            });
            
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            statusDiv.innerHTML = `<p class="success">✅ Successfully fetched ${allFixtures.length} fixtures for Edition ${currentActiveEdition}, ${displayText} from ${selectedRounds.length} round(s) (${season} season)</p>`;
            
            // Refresh the fixture display
            loadFixturesForGameweek();
        } else {
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            statusDiv.innerHTML = `<p class="error">❌ No fixtures found in TheSportsDB for ${displayText} from selected rounds. Using mock data for demonstration.</p>`;
        }
    } catch (error) {
        console.error('API error:', error);
        statusDiv.innerHTML = `<p class="error">❌ Error fetching fixtures: ${error.message}</p>`;
    }
}

// Firebase Connection Test Function
async function testFirebaseConnection() {
    console.log('=== Firebase Connection Test ===');
    
    try {
        // Test 1: Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK not loaded');
            return false;
        }
        console.log('✅ Firebase SDK loaded');
        
        // Test 2: Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error('❌ Firebase not initialized');
            return false;
        }
        console.log('✅ Firebase initialized');
        
        // Test 3: Check if auth is available
        if (!window.auth) {
            console.error('❌ Firebase Auth not available');
            return false;
        }
        console.log('✅ Firebase Auth available');
        
        // Test 4: Check if Firestore is available
        if (!window.db) {
            console.error('❌ Firestore not available');
            return false;
        }
        console.log('✅ Firestore available');
        
        // Test 5: Test Firestore connection with a simple read
        console.log('Testing Firestore connection...');
        const testDoc = await window.db.collection('users').limit(1).get();
        console.log('✅ Firestore connection successful - read test passed');
        
        // Test 6: Check current user state
        const currentUser = window.auth.currentUser;
        if (currentUser) {
            console.log('✅ User authenticated:', currentUser.email);
        } else {
            console.log('ℹ️ No user currently authenticated');
        }
        
        console.log('=== All Firebase tests passed! ===');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

// Make the test function globally available
window.testFirebaseConnection = testFirebaseConnection;

async function fetchFixturesFromTheSportsDB(league, season, round) {
    // TheSportsDB configuration
    const BASE_URL = THESPORTSDB_CONFIG.BASE_URL;
    
    try {
        console.log(`Fetching fixtures for league ${league}, season ${season}, round ${round}`);
        
        // TheSportsDB uses a different endpoint structure
        // We'll use the events endpoint with league and season
        const url = `${BASE_URL}/eventsround.php?id=${league}&s=${season}&r=${round}`;
        console.log(`TheSportsDB URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET'
        });
        
        console.log(`TheSportsDB Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`TheSportsDB Error response: ${errorText}`);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`TheSportsDB Response data:`, data);
        
        if (data.events && data.events.length > 0) {
            console.log(`Found ${data.events.length} fixtures`);
            console.log('Sample event data:', data.events[0]);
            return data.events.map(event => {
                // TheSportsDB provides dateEvent and timeEvent separately
                // Combine them into a proper datetime string
                const dateEvent = event.dateEvent;
                const timeEvent = event.timeEvent || '15:00:00'; // Default to 3 PM if no time
                
                // Ensure time is in HH:MM:SS format
                let formattedTime = timeEvent;
                if (timeEvent && timeEvent.length === 5) {
                    // If time is in HH:MM format, add seconds
                    formattedTime = timeEvent + ':00';
                } else if (!timeEvent || timeEvent.length === 0) {
                    // If no time provided, default to 3 PM
                    formattedTime = '15:00:00';
                }
                
                // Create a proper datetime string in ISO format
                // TheSportsDB times are typically in local time, so we'll assume UK time
                const dateTime = `${dateEvent}T${formattedTime}`;
                
                console.log(`Fixture: ${event.strHomeTeam} vs ${event.strAwayTeam}, Date: ${dateEvent}, Time: ${timeEvent}, Formatted Time: ${formattedTime}, Combined: ${dateTime}`);
                
                // Test the datetime parsing to ensure it's valid
                const testDate = new Date(dateTime);
                console.log(`Parsed datetime: ${testDate.toISOString()}, UK time: ${testDate.toLocaleString('en-GB', { timeZone: 'Europe/London' })}`);
                
                return {
                    homeTeam: event.strHomeTeam,
                    awayTeam: event.strAwayTeam,
                    date: dateTime, // Now includes both date and time
                    homeScore: event.intHomeScore,
                    awayScore: event.intAwayScore,
                    completed: event.strStatus === 'Match Finished',
                    fixtureId: event.idEvent
                };
            });
        }
        
        console.log('No fixtures found in TheSportsDB response');
        return [];
        
    } catch (error) {
        console.error('TheSportsDB request failed:', error);
        console.log('Falling back to mock data');
        // Fallback to mock data for demonstration
        return getMockFixtures(league, round);
    }
}

async function fetchScoresFromTheSportsDB(league, season, round, existingFixtures) {
    // TheSportsDB configuration
    const BASE_URL = THESPORTSDB_CONFIG.BASE_URL;
    
    try {
        console.log(`Fetching scores for league ${league}, season ${season}, round ${round}`);
        
        // Use the same endpoint as fixtures since TheSportsDB includes scores
        const url = `${BASE_URL}/eventsround.php?id=${league}&s=${season}&r=${round}`;
        console.log(`TheSportsDB URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
            // Update existing fixtures with scores
            const updatedFixtures = existingFixtures.map(existingFixture => {
                const apiEvent = data.events.find(e => e.idEvent === existingFixture.fixtureId);
                if (apiEvent) {
                    return {
                        ...existingFixture,
                        homeScore: apiEvent.intHomeScore,
                        awayScore: apiEvent.intAwayScore,
                        completed: apiEvent.strStatus === 'Match Finished'
                    };
                }
                return existingFixture;
            });
            
            return updatedFixtures;
        }
        
        return existingFixtures;
        
    } catch (error) {
        console.error('TheSportsDB request failed:', error);
        console.log('Falling back to mock data');
        // Fallback to mock data for demonstration
        return getMockScores(existingFixtures);
    }
}

async function fetchAvailableRoundsFromTheSportsDB(league, season) {
    // TheSportsDB configuration
    const BASE_URL = THESPORTSDB_CONFIG.BASE_URL;
    
    try {
        console.log(`Fetching available rounds for league ${league}, season ${season}`);
        
        // Try different approaches to get all rounds
        // First, try with a larger limit parameter
        let url = `${BASE_URL}/eventsseason.php?id=${league}&s=${season}&limit=1000`;
        console.log(`TheSportsDB URL (with limit): ${url}`);
        
        let response = await fetch(url, {
            method: 'GET'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`TheSportsDB Error response: ${errorText}`);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        let data = await response.json();
        console.log(`TheSportsDB Response data (with limit):`, data);
        
        // If we still don't get all rounds, try fetching by individual rounds
        if (data.events && data.events.length > 0) {
            const uniqueRounds = new Set();
            
            data.events.forEach(event => {
                if (event.intRound) {
                    uniqueRounds.add(`Round ${event.intRound}`);
                }
            });
            
            // If we only got a few rounds, try fetching individual rounds
            if (uniqueRounds.size < 10) {
                console.log('Limited rounds found, trying individual round fetching...');
                
                // Try to fetch rounds 1-46 individually
                for (let round = 1; round <= 46; round++) {
                    try {
                        const roundUrl = `${BASE_URL}/eventsround.php?id=${league}&s=${season}&r=${round.toString().padStart(2, '0')}`;
                        console.log(`Trying round ${round}: ${roundUrl}`);
                        
                        const roundResponse = await fetch(roundUrl);
                        if (roundResponse.ok) {
                            const roundData = await roundResponse.json();
                            if (roundData.events && roundData.events.length > 0) {
                                uniqueRounds.add(`Round ${round}`);
                                console.log(`Found events for Round ${round}`);
                            }
                        }
                    } catch (roundError) {
                        console.log(`No data for Round ${round}:`, roundError.message);
                    }
                }
            }
            
            // Convert to array and sort
            const rounds = Array.from(uniqueRounds).sort((a, b) => {
                const aNum = parseInt(a.replace('Round ', ''));
                const bNum = parseInt(b.replace('Round ', ''));
                return aNum - bNum;
            });
            
            // Add tiebreak round
            rounds.push('Tiebreak');
            
            console.log(`Found ${rounds.length} rounds:`, rounds);
            console.log(`Round numbers found:`, Array.from(uniqueRounds).map(r => parseInt(r.replace('Round ', ''))).sort((a, b) => a - b));
            return rounds;
        }
        
        console.log('No events found for TheSportsDB');
        return getMockRounds();
        
    } catch (error) {
        console.error('TheSportsDB request failed:', error);
        console.log('Falling back to mock data');
        // Fallback to mock data for demonstration
        return getMockRounds();
    }
}



// Helper functions for TheSportsDB integration
// Note: TheSportsDB uses rounds instead of gameweeks, so we don't need date calculations

// Mock data fallback functions
function getMockFixtures(league, gameweek) {
    const mockFixtures = {
        '1': [ // Premier League
            { homeTeam: 'Arsenal', awayTeam: 'Chelsea', date: '2024-01-15T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 1 },
            { homeTeam: 'Manchester United', awayTeam: 'Liverpool', date: '2024-01-15T17:30:00', homeScore: null, awayScore: null, completed: false, fixtureId: 2 },
            { homeTeam: 'Manchester City', awayTeam: 'Tottenham', date: '2024-01-15T20:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 3 }
        ],
        '5': [ // National League 2025/26
            { homeTeam: 'Altrincham', awayTeam: 'York City', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 4 },
            { homeTeam: 'Southend United', awayTeam: 'Woking', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 5 },
            { homeTeam: 'Boreham Wood', awayTeam: 'Bromley', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 6 },
            { homeTeam: 'FC Halifax Town', awayTeam: 'Gateshead', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 7 },
            { homeTeam: 'Solihull Moors', awayTeam: 'Brackley Town', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 8 },
            { homeTeam: 'Braintree Town', awayTeam: 'Eastleigh', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 9 },
            { homeTeam: 'Aldershot Town', awayTeam: 'Carlisle United', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 10 },
            { homeTeam: 'Boston United', awayTeam: 'Forest Green Rovers', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 11 },
            { homeTeam: 'Hartlepool United', awayTeam: 'Morecambe', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 12 },
            { homeTeam: 'Rochdale', awayTeam: 'Scunthorpe United', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 13 },
            { homeTeam: 'Sutton United', awayTeam: 'Tamworth', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 14 },
            { homeTeam: 'Wealdstone', awayTeam: 'Yeovil Town', date: '2025-08-09T15:00:00', homeScore: null, awayScore: null, completed: false, fixtureId: 15 }
        ]
    };
    
    return mockFixtures[league] || [];
}

function getMockScores(existingFixtures) {
    const mockScores = [
        { homeScore: 2, awayScore: 1, completed: true },
        { homeScore: 0, awayScore: 0, completed: true },
        { homeScore: 1, awayScore: 3, completed: true }
    ];
    
    return existingFixtures.map((fixture, index) => ({
        ...fixture,
        ...(mockScores[index] || { homeScore: null, awayScore: null, completed: false })
    }));
}

function getMockRounds() {
    const mockRounds = [];
    for (let i = 1; i <= 46; i++) { // National League has up to 46 rounds
        const roundName = `Round ${i}`;
        mockRounds.push(roundName);
    }
    mockRounds.push('Tiebreak'); // Add tiebreak round
    return mockRounds;
}

// --- NEW: LEAGUE TABLE LOGIC ---
if (window.location.pathname.endsWith('table.html')) {
    const tableBody = document.querySelector('#league-table-body');
    
    // First get the current gameweek from settings
    db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
        if (!settingsDoc.exists) {
            console.error("CRITICAL: Settings document not found!");
            return;
        }
        const settings = settingsDoc.data();
        const currentGameWeek = settings.active_gameweek;
        const currentGameWeekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
        
        // Then get all users
    db.collection('users').get().then(querySnapshot => {
        let players = [];
        querySnapshot.forEach(doc => {
            players.push(doc.data());
        });

        // Sort players by lives remaining (descending)
        players.sort((a, b) => b.lives - a.lives);

        players.forEach(playerData => {
            const row = document.createElement('tr');
            
                // Determine status based on lives remaining
                let status = '';
                let statusClass = '';
                if (playerData.lives === 2) {
                    status = 'Safe';
                    statusClass = 'status-in';
                } else if (playerData.lives === 1) {
                    status = 'On the edge';
                    statusClass = 'status-edge';
                } else if (playerData.lives === 0) {
                    status = "It's all over";
                    statusClass = 'status-out';
                }
                
                // Get the current gameweek pick
                const currentPick = playerData.picks && playerData.picks[currentGameWeekKey] ? playerData.picks[currentGameWeekKey] : 'No Pick';

                // Calculate card display based on lives lost (starting with 2 lives)
                const livesLost = 2 - playerData.lives;
                let cardDisplay = '';
                if (livesLost === 0) {
                    cardDisplay = ''; // Blank for no lives lost
                } else if (livesLost === 1) {
                    cardDisplay = '🟨'; // Yellow rectangle for 1 life lost
                } else if (livesLost === 2) {
                    cardDisplay = '🟥'; // Red rectangle for 2 lives lost
                }

                const badge = currentPick !== 'No Pick' ? getTeamBadge(currentPick) : null;
                const badgeHtml = badge ? `<img src="${badge}" alt="${currentPick}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
            row.innerHTML = `
                <td>${playerData.displayName}</td>
                    <td>${cardDisplay}</td>
                <td><span class="${statusClass}">${status}</span></td>
                    <td>${badgeHtml}${currentPick}</td>
            `;
            tableBody.appendChild(row);
            });
        });
    });
}
// --- LOGOUT LOGIC ---
const logoutButton = document.querySelector('#logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            window.location.href = '/index.html';
        });
    });
}

// Initialize registration page
if (window.location.pathname.endsWith('register.html')) {
    checkRegistrationWindow();
    
    // Form switching logic
    const showReRegister = document.querySelector('#show-re-register');
    const showNewRegister = document.querySelector('#show-new-register');
    const registerForm = document.querySelector('#register-form');
    const reRegisterForm = document.querySelector('#re-register-form');
    
    if (showReRegister) {
        showReRegister.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            reRegisterForm.style.display = 'block';
        });
    }
    
    if (showNewRegister) {
        showNewRegister.addEventListener('click', (e) => {
            e.preventDefault();
            reRegisterForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }
}

        // Initialize testimonial image modal functionality
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            initializeTestimonialModal();
        }

// Initialize registration window display for index page
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    initializeRegistrationWindowDisplay();
}

// New registration form handler
const registerForm = document.querySelector('#register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.querySelector('#register-firstname').value;
        const surname = document.querySelector('#register-surname').value;
        const ageVerified = document.querySelector('#register-age-verified').value;
        const email = document.querySelector('#register-email').value;
        const selectedEdition = document.querySelector('#edition-selection').value;
        
        // Validate edition selection
        if (!selectedEdition) {
            errorMessage.textContent = 'Please select an edition to register for';
            return;
        }
        
        // Check registration window for the selected edition
        if (!(await checkRegistrationWindow(selectedEdition))) {
            return;
        }
        const mobile = document.querySelector('#register-mobile').value;
        const password = document.querySelector('#register-password').value;
        const confirmPassword = document.querySelector('#register-confirm-password').value;
        const paymentMethod = document.querySelector('#register-payment').value;
        const emailConsent = document.querySelector('#register-email-consent').checked;
        const whatsappConsent = document.querySelector('#register-whatsapp-consent').checked;
        const termsConsent = document.querySelector('#register-terms').checked;
        const errorMessage = document.querySelector('#error-message');

        // Validation
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            return;
        }
        
        if (!termsConsent) {
            errorMessage.textContent = 'You must agree to the terms and conditions';
            return;
        }
        
        if (!emailConsent) {
            errorMessage.textContent = 'You must consent to receive emails about the competition';
            return;
        }
        
        if (!ageVerified) {
            errorMessage.textContent = 'Please confirm your age (must be 16 or older)';
            return;
        }
        
        if (ageVerified === 'no') {
            errorMessage.textContent = 'You must be 16 or older to register for this competition';
            return;
        }

        // Additional validation
        if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long';
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorMessage.textContent = 'Please enter a valid email address';
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            await db.collection('users').doc(user.uid).set({
                firstName: firstName,
                surname: surname,
                displayName: `${firstName} ${surname}`,
                email: email,
                mobile: mobile,
                ageVerified: ageVerified === 'yes',
                paymentMethod: paymentMethod,
                emailConsent: emailConsent,
                whatsappConsent: whatsappConsent,
                lives: 2,
                picks: {},
                registrations: {
                    [`edition${selectedEdition}`]: {
                        registrationDate: new Date(),
                        paymentMethod: paymentMethod,
                        emailConsent: emailConsent,
                        whatsappConsent: whatsappConsent
                    }
                },
                // Note: Edition will be determined dynamically based on tester status
                isAdmin: false
                // isTester will be set via admin panel after registration
            });
            
            window.location.href = '/dashboard.html';
        } catch (err) {
            console.error('Registration error:', err);
            
            // Provide more specific error messages
            let errorText = 'Registration failed. Please try again.';
            
            if (err.code === 'auth/email-already-in-use') {
                errorText = 'This email address is already registered. Please use the "I\'m already registered" option.';
            } else if (err.code === 'auth/invalid-email') {
                errorText = 'Please enter a valid email address.';
            } else if (err.code === 'auth/weak-password') {
                errorText = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
            } else if (err.code === 'auth/operation-not-allowed') {
                errorText = 'Email/password accounts are not enabled. Please contact support.';
            } else if (err.code === 'auth/network-request-failed') {
                errorText = 'Network error. Please check your internet connection and try again.';
            } else if (err.message) {
                errorText = err.message;
            }
            
            errorMessage.textContent = errorText;
        }
    });
}

// Re-registration form handler
const reRegisterForm = document.querySelector('#re-register-form');
if (reRegisterForm) {
    reRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.querySelector('#re-register-email').value;
        const selectedEdition = document.querySelector('#edition-selection').value;
        
        // Validate edition selection
        if (!selectedEdition) {
            errorMessage.textContent = 'Please select an edition to register for';
            return;
        }
        
        // Check registration window for the selected edition
        if (!(await checkRegistrationWindow(selectedEdition))) {
            return;
        }
        const password = document.querySelector('#re-register-password').value;
        const paymentMethod = document.querySelector('#re-register-payment').value;
        const emailConsent = document.querySelector('#re-register-email-consent').checked;
        const whatsappConsent = document.querySelector('#re-register-whatsapp-consent').checked;
        const termsConsent = document.querySelector('#re-register-terms').checked;
        const errorMessage = document.querySelector('#re-register-error-message');

        // Validation
        if (!termsConsent) {
            errorMessage.textContent = 'You must agree to the terms and conditions';
            return;
        }
        
        if (!emailConsent) {
            errorMessage.textContent = 'You must consent to receive emails about the competition';
            return;
        }

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user data for new edition
            await db.collection('users').doc(user.uid).update({
                paymentMethod: paymentMethod,
                emailConsent: emailConsent,
                whatsappConsent: whatsappConsent,
                [`registrations.edition${selectedEdition}`]: {
                    registrationDate: new Date(),
                    paymentMethod: paymentMethod,
                    emailConsent: emailConsent,
                    whatsappConsent: whatsappConsent
                }
            });
            
            window.location.href = '/dashboard.html';
        } catch (err) {
            console.error('Re-registration error:', err);
            
            // Provide more specific error messages
            let errorText = 'Login failed. Please try again.';
            
            if (err.code === 'auth/user-not-found') {
                errorText = 'No account found with this email address. Please use the "New Registration" option.';
            } else if (err.code === 'auth/wrong-password') {
                errorText = 'Incorrect password. Please try again.';
            } else if (err.code === 'auth/invalid-email') {
                errorText = 'Please enter a valid email address.';
            } else if (err.code === 'auth/user-disabled') {
                errorText = 'This account has been disabled. Please contact support.';
            } else if (err.code === 'auth/too-many-requests') {
                errorText = 'Too many failed login attempts. Please try again later.';
            } else if (err.code === 'auth/network-request-failed') {
                errorText = 'Network error. Please check your internet connection and try again.';
            } else if (err.message) {
                errorText = err.message;
            }
            
            errorMessage.textContent = errorText;
        }
    });
}

// --- LOGIN LOGIC ---
const loginForm = document.querySelector('#login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#login-email').value;
        const password = document.querySelector('#login-password').value;
        const errorMessage = document.querySelector('#error-message');
        
        auth.signInWithEmailAndPassword(email, password).then(cred => {
            window.location.href = '/dashboard.html';
        }).catch(err => {
            errorMessage.textContent = err.message;
        });
    });
}

// Age verification button handlers
document.addEventListener('DOMContentLoaded', function() {
    const ageYesBtn = document.getElementById('age-yes-btn');
    const ageNoBtn = document.getElementById('age-no-btn');
    const ageVerifiedInput = document.getElementById('register-age-verified');
    
    if (ageYesBtn && ageNoBtn && ageVerifiedInput) {
        ageYesBtn.addEventListener('click', function() {
            // Remove selected class from both buttons
            ageYesBtn.classList.remove('selected');
            ageNoBtn.classList.remove('selected');
            
            // Add selected class to yes button
            ageYesBtn.classList.add('selected');
            
            // Set the hidden input value
            ageVerifiedInput.value = 'yes';
        });
        
        ageNoBtn.addEventListener('click', function() {
            // Remove selected class from both buttons
            ageYesBtn.classList.remove('selected');
            ageNoBtn.classList.remove('selected');
            
            // Add selected class to no button
            ageNoBtn.classList.add('selected');
            
            // Set the hidden input value
            ageVerifiedInput.value = 'no';
        });
    }
});

// --- TEST SCORE GENERATION AND ENHANCED SCORE MANAGEMENT ---

// Generate test scores for multiple gameweeks
function generateTestScores() {
    const testScores = {
        gw1: [
            { homeTeam: "Altrincham", awayTeam: "Barnet", homeScore: 2, awayScore: 1, homeScoreHT: 1, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Bromley", awayTeam: "Chesterfield", homeScore: 0, awayScore: 2, homeScoreHT: 0, awayScoreHT: 1, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Dagenham & Redbridge", awayTeam: "Eastleigh", homeScore: 1, awayScore: 1, homeScoreHT: 0, awayScoreHT: 1, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Gateshead", awayTeam: "Halifax", homeScore: 3, awayScore: 0, homeScoreHT: 2, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Hartlepool", awayTeam: "Kidderminster", homeScore: 1, awayScore: 0, homeScoreHT: 0, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" }
        ],
        gw2: [
            { homeTeam: "Maidenhead", awayTeam: "Oldham", homeScore: 0, awayScore: 1, homeScoreHT: 0, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Rochdale", awayTeam: "Solihull", homeScore: 2, awayScore: 2, homeScoreHT: 1, awayScoreHT: 1, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Southend", awayTeam: "Sutton", homeScore: 1, awayScore: 0, homeScoreHT: 1, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Wealdstone", awayTeam: "Woking", homeScore: 0, awayScore: 3, homeScoreHT: 0, awayScoreHT: 1, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "York", awayTeam: "Aldershot", homeScore: 2, awayScore: 1, homeScoreHT: 1, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" }
        ],
        gw3: [
            { homeTeam: "Boreham Wood", awayTeam: "Braintree", homeScore: 1, awayScore: 1, homeScoreHT: 0, awayScoreHT: 1, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Dorking", awayTeam: "Ebbsfleet", homeScore: 0, awayScore: 2, homeScoreHT: 0, awayScoreHT: 1, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Fylde", awayTeam: "Grimsby", homeScore: 2, awayScore: 0, homeScoreHT: 1, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Maidstone", awayTeam: "Oxford City", homeScore: 3, awayScore: 1, homeScoreHT: 2, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" },
            { homeTeam: "Tamworth", awayTeam: "Wrexham", homeScore: 0, awayScore: 1, homeScoreHT: 0, awayScoreHT: 0, completed: true, matchTime: "15:00", status: "FT" }
        ]
    };
    
    return testScores;
}







async function importScoresFromFootballWebPages(gameweek) {
    try {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        const statusDiv = document.querySelector('#realtime-status');
        
        if (statusDiv) {
            statusDiv.innerHTML = '<p>🔄 Importing scores from Football Web Pages API...</p>';
        }
        
        // Get current fixtures to determine matchday - try new structure first, then fallback to old
        let fixtureDoc = await db.collection('fixtures').doc(editionGameweekKey).get();
        if (!fixtureDoc.exists) {
            // Fallback to old structure
            fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
        }
        if (!fixtureDoc.exists) {
            if (statusDiv) statusDiv.innerHTML = '<p>❌ No fixtures found for this gameweek</p>';
            return;
        }
        
        const existingFixtures = fixtureDoc.data().fixtures;
        if (!existingFixtures || existingFixtures.length === 0) {
            if (statusDiv) statusDiv.innerHTML = '<p>❌ No fixtures found for this gameweek</p>';
            return;
        }
        
        // Get league from the current settings
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        const settings = settingsDoc.exists ? settingsDoc.data() : {};
        const league = settings.footballWebPagesLeague || '5'; // Default to National League
        
        // Calculate matchday from the first fixture's date
        const firstFixture = existingFixtures[0];
        const fixtureDate = new Date(firstFixture.date);
        const seasonStart = new Date('2025-08-01');
        const matchday = Math.ceil((fixtureDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const season = '2025-2026';
        
        console.log('Using old API format:', { league, season, matchday });
        
        const response = await fetch(`/.netlify/functions/fetch-scores?league=${league}&season=${season}&matchday=${matchday}`);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON. The Netlify function may not be deployed correctly.');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch scores from API');
        }
        
        // Merge API data with existing fixtures to preserve original time format
        console.log('API fixtures received:', data.fixtures);
        console.log('Existing fixtures:', existingFixtures);
        
        const mergedFixtures = existingFixtures.map(existingFixture => {
            const apiFixture = data.fixtures.find(api => 
                api.homeTeam === existingFixture.homeTeam && 
                api.awayTeam === existingFixture.awayTeam
            );
            
            console.log(`Looking for match: ${existingFixture.homeTeam} vs ${existingFixture.awayTeam}`);
            console.log(`Existing fixture HT scores: ${existingFixture.homeScoreHT}-${existingFixture.awayScoreHT}`);
            console.log(`Found API fixture:`, apiFixture);
            
            if (apiFixture) {
                // Merge API data with existing fixture, preserving original time
                // Only update half-time scores if API provides non-null values (null means no data)
                // If API returns 0 for both scores, it might mean no data rather than actual 0-0
                let homeScoreHT, awayScoreHT;
                
                if (apiFixture.homeScoreHT !== null && apiFixture.homeScoreHT !== undefined) {
                    // API provided a value, use it
                    homeScoreHT = apiFixture.homeScoreHT;
                    awayScoreHT = apiFixture.awayScoreHT;
                } else {
                    // API provided null/undefined, preserve existing values
                    homeScoreHT = existingFixture.homeScoreHT;
                    awayScoreHT = existingFixture.awayScoreHT;
                }
                
                const mergedFixture = {
                    ...existingFixture, // Keep original data (including time format)
                    homeScore: apiFixture.homeScore,
                    awayScore: apiFixture.awayScore,
                    homeScoreHT: homeScoreHT,
                    awayScoreHT: awayScoreHT,
                    status: apiFixture.status,
                    completed: apiFixture.completed
                };
                
                console.log(`Merged fixture:`, mergedFixture);
                console.log(`Half-time score logic - API: ${apiFixture.homeScoreHT}-${apiFixture.awayScoreHT}, Existing: ${existingFixture.homeScoreHT}-${existingFixture.awayScoreHT}, Final: ${homeScoreHT}-${awayScoreHT}`);
                console.log(`HT Score Decision - API homeScoreHT: ${apiFixture.homeScoreHT} (type: ${typeof apiFixture.homeScoreHT}), API awayScoreHT: ${apiFixture.awayScoreHT} (type: ${typeof apiFixture.awayScoreHT})`);
                console.log(`HT Score Decision - Using API values: ${apiFixture.homeScoreHT !== null && apiFixture.homeScoreHT !== undefined ? 'YES' : 'NO'}`);
                console.log(`HT Score Decision - Final values: homeScoreHT=${homeScoreHT} (type: ${typeof homeScoreHT}), awayScoreHT=${awayScoreHT} (type: ${typeof awayScoreHT})`);
                
                // Additional debugging: Check if this looks like real half-time data
                const hasRealHTData = apiFixture.homeScoreHT !== null && apiFixture.homeScoreHT !== undefined && 
                                    (apiFixture.homeScoreHT > 0 || apiFixture.awayScoreHT > 0 || 
                                     (apiFixture.homeScoreHT === 0 && apiFixture.awayScoreHT === 0 && apiFixture.status === 'HT'));
                console.log(`HT Score Decision - Has real HT data: ${hasRealHTData} (status: ${apiFixture.status})`);
                return mergedFixture;
            }
            
            console.log(`No API match found for ${existingFixture.homeTeam} vs ${existingFixture.awayTeam}`);
            return existingFixture; // Keep unchanged if no API match found
        });
        
        // Update fixtures with merged data - use the same structure as the source
        const targetDoc = fixtureDoc.ref;
        await targetDoc.update({
            fixtures: mergedFixtures
        });
        
        console.log('Updated fixtures with scores:', mergedFixtures);
        console.log('Sample API fixture with half-time scores:', data.fixtures.find(f => f.homeScoreHT || f.awayScoreHT));
        
        // Log a summary of half-time score updates
        const htUpdates = mergedFixtures.filter(f => f.homeScoreHT !== 0 || f.awayScoreHT !== 0);
        console.log(`Half-time scores found for ${htUpdates.length} fixtures:`, htUpdates.map(f => `${f.homeTeam} vs ${f.awayTeam}: ${f.homeScoreHT}-${f.awayScoreHT}`));
        
        // Debug: Log all fixtures and their HT scores
        console.log('=== DEBUG: All fixtures and their HT scores ===');
        mergedFixtures.forEach((fixture, index) => {
            console.log(`${index + 1}. ${fixture.homeTeam} vs ${fixture.awayTeam}: HT=${fixture.homeScoreHT}-${fixture.awayScoreHT} (types: ${typeof fixture.homeScoreHT}, ${typeof fixture.awayScoreHT})`);
        });
        console.log('=== END DEBUG ===');
        
        // Log a summary of which fixtures actually received non-zero half-time score updates
        const nonZeroHTUpdates = mergedFixtures.filter(f => f.homeScoreHT !== 0 || f.awayScoreHT !== 0);
        console.log(`Fixtures with non-zero HT scores: ${nonZeroHTUpdates.length}/${mergedFixtures.length}`);
        if (nonZeroHTUpdates.length > 0) {
            console.log('Non-zero HT scores:', nonZeroHTUpdates.map(f => `${f.homeTeam} vs ${f.awayTeam}: ${f.homeScoreHT}-${f.awayScoreHT}`));
        }
        
        // Refresh the display with a small delay to ensure database update is complete
        setTimeout(() => {
            loadScoresForGameweek();
        }, 500);
        
        // Process results for completed matches
        const completedFixtures = data.fixtures.filter(f => f.completed);
        if (completedFixtures.length > 0) {
            processResults(gameweek, data.fixtures);
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = `<p>✅ Successfully imported ${data.count} fixtures from Football Web Pages API</p>`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }
        
    } catch (error) {
        console.error('Error importing scores from Football Web Pages:', error);
        const statusDiv = document.querySelector('#realtime-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<p>❌ Error importing scores: ${error.message}</p>`;
        }
    }
}

// Real-time score updates from Football Web Pages API
async function startRealTimeScoreUpdates(gameweek) {
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
    const statusDiv = document.querySelector('#realtime-status');
    
    if (statusDiv) {
        statusDiv.innerHTML = '<p>🔄 Starting real-time score updates from Football Web Pages API...</p>';
    }
    
    // Get current fixtures from database to determine matchday - try new structure first, then fallback to old
    let fixtureDoc = await db.collection('fixtures').doc(editionGameweekKey).get();
    if (!fixtureDoc.exists) {
        // Fallback to old structure
        fixtureDoc = await db.collection('fixtures').doc(gameweekKey).get();
    }
    if (!fixtureDoc.exists) {
        if (statusDiv) statusDiv.innerHTML = '<p>❌ No fixtures found for this gameweek</p>';
        return;
    }
    
    const existingFixtures = fixtureDoc.data().fixtures;
    if (!existingFixtures || existingFixtures.length === 0) {
        if (statusDiv) statusDiv.innerHTML = '<p>❌ No fixtures found for this gameweek</p>';
        return;
    }
    
    // Determine the matchday from the first fixture's date
    const firstFixture = existingFixtures[0];
    const fixtureDate = new Date(firstFixture.date);
    const matchday = Math.ceil((fixtureDate.getTime() - new Date('2025-08-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    // Get league from the current settings
    const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const league = settings.footballWebPagesLeague || '5'; // Default to National League
    
    let currentInterval = 300000; // Default 5 minutes
    let updateInterval;
    
    const performUpdate = async () => {
        try {
            // Calculate matchday from the first fixture's date for the old API format
            const firstFixture = existingFixtures[0];
            const fixtureDate = new Date(firstFixture.date);
            const seasonStart = new Date('2025-08-01');
            const matchday = Math.ceil((fixtureDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const season = '2025-2026';
            
            // Fetch latest scores from Football Web Pages API using the old GET format
            const response = await fetch(`/.netlify/functions/fetch-scores?league=${league}&season=${season}&matchday=${matchday}`);
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON. The Netlify function may not be deployed correctly.');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch scores');
            }
            
            const apiFixtures = data.fixtures;
            
            if (apiFixtures && apiFixtures.length > 0) {
                // Merge API data with existing fixtures to preserve original time format
                const mergedFixtures = existingFixtures.map(existingFixture => {
                    const apiFixture = apiFixtures.find(api => 
                        api.homeTeam === existingFixture.homeTeam && 
                        api.awayTeam === existingFixture.awayTeam
                    );
                    
                    if (apiFixture) {
                        // Merge API data with existing fixture, preserving original time and HT scores
                        let homeScoreHT, awayScoreHT;
                        
                        if (apiFixture.homeScoreHT !== null && apiFixture.homeScoreHT !== undefined) {
                            // API provided a value, use it
                            homeScoreHT = apiFixture.homeScoreHT;
                            awayScoreHT = apiFixture.awayScoreHT;
                        } else {
                            // API provided null/undefined, preserve existing values
                            homeScoreHT = existingFixture.homeScoreHT;
                            awayScoreHT = existingFixture.awayScoreHT;
                        }
                        
                        const updatedFixture = {
                            ...existingFixture, // Keep original data (including time format)
                            homeScore: apiFixture.homeScore,
                            awayScore: apiFixture.awayScore,
                            homeScoreHT: homeScoreHT,
                            awayScoreHT: awayScoreHT,
                            status: apiFixture.status,
                            completed: apiFixture.completed
                        };
                        
                        console.log(`Real-time update - ${existingFixture.homeTeam} vs ${existingFixture.awayTeam}: API HT=${apiFixture.homeScoreHT}-${apiFixture.awayScoreHT}, Existing HT=${existingFixture.homeScoreHT}-${existingFixture.awayScoreHT}, Final HT=${homeScoreHT}-${awayScoreHT}`);
                        
                        return updatedFixture;
                    }
                    return existingFixture; // Keep unchanged if no API match found
                });
                
                // Check if any scores have changed
                let hasChanges = false;
                mergedFixtures.forEach((fixture, index) => {
                    if (existingFixtures[index]) {
                        const existing = existingFixtures[index];
                        if (fixture.homeScore !== existing.homeScore || 
                            fixture.awayScore !== existing.awayScore ||
                            fixture.homeScoreHT !== existing.homeScoreHT ||
                            fixture.awayScoreHT !== existing.awayScoreHT ||
                            fixture.status !== existing.status) {
                            hasChanges = true;
                        }
                    }
                });
                
                if (hasChanges) {
                    // Update database with merged data - use the same structure as the source
                    const targetDoc = fixtureDoc.ref;
                    await targetDoc.update({
                        fixtures: mergedFixtures
                    });
                    
                    // Process results for completed matches
                    const completedFixtures = mergedFixtures.filter(f => f.completed);
                    if (completedFixtures.length > 0) {
                        processResults(gameweek, mergedFixtures);
                    }
                    
                    // Refresh display
                    loadScoresForGameweek();
                    
                    if (statusDiv) {
                        statusDiv.innerHTML = `<p>✅ Scores updated at ${new Date().toLocaleTimeString()}</p>`;
                    }
                } else {
                    if (statusDiv) {
                        statusDiv.innerHTML = `<p>⏳ No changes detected. Last check: ${new Date().toLocaleTimeString()}</p>`;
                    }
                }
                
                // Update interval based on match status
                const newInterval = data.refreshInterval || 300000;
                if (newInterval !== currentInterval) {
                    currentInterval = newInterval;
                    clearInterval(updateInterval);
                    
                    if (currentInterval > 0) {
                        updateInterval = setInterval(performUpdate, currentInterval);
                        if (statusDiv) {
                            const intervalMinutes = currentInterval / 60000;
                            statusDiv.innerHTML += `<p>🔄 Updated refresh interval to ${intervalMinutes} minute${intervalMinutes !== 1 ? 's' : ''}</p>`;
                        }
                    } else {
                        if (statusDiv) {
                            statusDiv.innerHTML = '<p>🏁 All matches completed. Updates stopped.</p>';
                        }
                        return;
                    }
                }
            }
            
        } catch (error) {
            console.error('Error in real-time update:', error);
            if (statusDiv) {
                statusDiv.innerHTML = `<p>❌ Update error: ${error.message}</p>`;
            }
        }
    };
    
    // Start the first update immediately
    await performUpdate();
    
    // Set up interval for subsequent updates
    updateInterval = setInterval(performUpdate, currentInterval);
    
    // Store the interval ID so it can be stopped later
    window.currentUpdateInterval = updateInterval;
}

// Stop real-time updates
function stopRealTimeScoreUpdates() {
    if (window.currentUpdateInterval) {
        clearInterval(window.currentUpdateInterval);
        window.currentUpdateInterval = null;
        
        const statusDiv = document.querySelector('#realtime-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<p>⏹️ Real-time updates stopped</p>';
        }
    }
}

// Football Web Pages API Settings Functions
async function loadFootballWebPagesSettings() {
    try {
        const settingsDoc = await db.collection('settings').doc('currentCompetition').get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            
            const leagueSelect = document.querySelector('#football-webpages-league');
            const seasonSelect = document.querySelector('#football-webpages-season');
            
            if (leagueSelect && settings.footballWebPagesLeague) {
                leagueSelect.value = settings.footballWebPagesLeague;
            }
            
            if (seasonSelect && settings.footballWebPagesSeason) {
                seasonSelect.value = settings.footballWebPagesSeason;
            }
        }
    } catch (error) {
        console.error('Error loading Football Web Pages settings:', error);
    }
}

async function saveFootballWebPagesSettings() {
    try {
        const leagueSelect = document.querySelector('#football-webpages-league');
        const seasonSelect = document.querySelector('#football-webpages-season');
        const statusDiv = document.querySelector('#api-settings-status');
        
        if (!leagueSelect || !seasonSelect) {
            if (statusDiv) statusDiv.innerHTML = '<p>❌ Settings controls not found</p>';
            return;
        }
        
        const league = leagueSelect.value;
        const season = seasonSelect.value;
        
        // Update settings in database
        await db.collection('settings').doc('currentCompetition').update({
            footballWebPagesLeague: league,
            footballWebPagesSeason: season
        });
        
        if (statusDiv) {
            statusDiv.innerHTML = '<p>✅ API settings saved successfully</p>';
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
        
        console.log('Football Web Pages API settings saved:', { league, season });
        
    } catch (error) {
        console.error('Error saving Football Web Pages settings:', error);
        const statusDiv = document.querySelector('#api-settings-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<p>❌ Error saving settings: ${error.message}</p>`;
        }
    }
}

// Admin Panel Tab Functionality
function initializeAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            const targetPane = document.getElementById(`${targetTab}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Initialize admin tabs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminTabs();
    // Load current edition for registration page
    loadCurrentEditionForRegistration();
    
    // Add edition selection event listener
    const editionSelection = document.getElementById('edition-selection');
    if (editionSelection) {
        editionSelection.addEventListener('change', updateEditionDisplay);
    }
});

// Simple tab functionality for admin panel
function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            const targetPane = document.getElementById(`${targetTab}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // Initialize Vidiprinter if that tab was clicked
            if (targetTab === 'vidiprinter') {
                console.log('Vidiprinter tab clicked - initializing...');
                initializeVidiprinter();
            }
            
            // Check and fix Save Settings button if settings tab was clicked
            if (targetTab === 'settings') {
                console.log('Settings tab clicked - checking Save Settings button...');
                setTimeout(() => {
                    const saveSettingsBtn = document.querySelector('#save-settings-btn');
                    if (saveSettingsBtn) {
                        console.log('Settings tab: Force enabling Save Settings button');
                        saveSettingsBtn.disabled = false;
                        saveSettingsBtn.style.pointerEvents = 'auto';
                        saveSettingsBtn.style.opacity = '1';
                        saveSettingsBtn.style.cursor = 'pointer';
                        saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
                        saveSettingsBtn.style.color = 'var(--dark-text)';
                    }
                }, 100);
            }
        });
    });
}

// Call setup function when admin panel is shown
document.addEventListener('DOMContentLoaded', () => {
    // Set up tabs when admin panel becomes visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const adminPanel = document.getElementById('admin-panel');
                if (adminPanel && adminPanel.style.display !== 'none') {
                    setupAdminTabs();
                    // Initialize Vidiprinter when admin panel is shown
                    initializeVidiprinter();
                }
            }
        });
    });
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        observer.observe(adminPanel, { attributes: true });
    }
    
    // Also initialize Vidiprinter when the page loads (in case admin panel is already visible)
    setTimeout(() => {
        initializeVidiprinter();
    }, 1000);
});

// Function to load gameweek deadlines for sidebar
async function loadGameweekDeadlines() {
    const deadlinesContainer = document.querySelector('#gameweek-deadlines');
    if (!deadlinesContainer) return;
    
    let deadlinesHTML = '';
    const gameweeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'tiebreak'];
    
    for (const gameweek of gameweeks) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        
        try {
            // Try new structure first, then fallback to old structure
            let doc = await db.collection('fixtures').doc(editionGameweekKey).get();
            if (!doc.exists) {
                // Fallback to old structure for backward compatibility
                doc = await db.collection('fixtures').doc(gameweekKey).get();
            }
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    // Find the earliest fixture (deadline)
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });
                    
                    const deadlineDate = new Date(earliestFixture.date);
                    const formattedDeadline = formatDeadlineDate(deadlineDate);
                    const gameweekLabel = gameweek === 'tiebreak' ? 'Tiebreak' : `GW ${gameweek}`;
                    
                    deadlinesHTML += `
                        <div class="gameweek-deadline">
                            <div class="gameweek-label">${gameweekLabel}:</div>
                            <p class="deadline-text">${formattedDeadline}</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error(`Error loading deadline for ${gameweek}:`, error);
        }
    }
    
    if (deadlinesHTML === '') {
        deadlinesHTML = '<p>No deadlines available.</p>';
    }
    
    deadlinesContainer.innerHTML = deadlinesHTML;
}

// Core Football Web Pages API functions
async function fetchMatchdaysFromFootballWebPages(league, season) {
    try {
        console.log(`Fetching matchdays for league ${league}, season ${season}`);
        
        // Since the current API doesn't have a separate matchdays endpoint,
        // we'll return mock data for now. The fixtures-results endpoint
        // returns all fixtures for a competition, not organized by matchdays.
        
        // For now, return mock matchdays to allow the UI to work
        return getMockMatchdays();
        
        // TODO: In the future, we could fetch fixtures and group them by date
        // to create matchdays, but for now this allows the UI to function
    } catch (error) {
        console.error('Error fetching matchdays from Football Web Pages:', error);
        // Fallback to mock data for demonstration
        return getMockMatchdays();
    }
}

async function fetchFixturesFromFootballWebPages(league, season, matchday, startDate = null, endDate = null) {
    try {
        console.log(`Fetching fixtures for league ${league}, season ${season}, matchday ${matchday}`);
        
        // Use the fixtures-results endpoint as shown in the curl command
        const url = `${FOOTBALL_WEBPAGES_CONFIG.BASE_URL}/fixtures-results.json?comp=${league}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_KEY,
                'X-RapidAPI-Host': FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_HOST
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Football Web Pages fixtures response:', data);
        
        // Parse the response structure as shown in the curl output
        if (data && data['fixtures-results'] && data['fixtures-results'].matches) {
            let fixtures = data['fixtures-results'].matches.map(match => {
                // Convert date and time to GMT
                const matchDate = match.date || new Date().toISOString().split('T')[0];
                const matchTime = match.time || '15:00';
                
                // Create a proper datetime string in GMT
                const gmtDateTime = `${matchDate}T${matchTime}:00`;
                
                return {
                    homeTeam: match['home-team']?.name || 'Unknown',
                    awayTeam: match['away-team']?.name || 'Unknown',
                    date: gmtDateTime,
                    homeScore: match['home-team']?.score || null,
                    awayScore: match['away-team']?.score || null,
                    completed: match.status?.short === 'FT' || match.status?.short === 'AET' || match.status?.short === 'PEN',
                    fixtureId: match.id,
                    time: matchTime,
                    venue: match.venue,
                    originalDate: matchDate // Keep original date for filtering
                };
            });
            
            // Filter by date range if provided
            if (startDate || endDate) {
                fixtures = fixtures.filter(fixture => {
                    const fixtureDate = new Date(fixture.date);
                    
                    // For start date, include the entire day (00:00:00)
                    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                    
                    // For end date, include the entire day (23:59:59)
                    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
                    
                    if (start && end) {
                        return fixtureDate >= start && fixtureDate <= end;
                    } else if (start) {
                        return fixtureDate >= start;
                    } else if (end) {
                        return fixtureDate <= end;
                    }
                    return true;
                });
            }
            
            return fixtures;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching fixtures from Football Web Pages:', error);
        // Fallback to mock data for demonstration
        return getMockFixtures(league, matchday);
    }
}

async function fetchScoresFromFootballWebPages(league, season, matchday, existingFixtures) {
    try {
        console.log(`Fetching scores for league ${league}, season ${season}, matchday ${matchday}`);
        
        // Use the fixtures-results endpoint as shown in the curl command
        const url = `${FOOTBALL_WEBPAGES_CONFIG.BASE_URL}/fixtures-results.json?comp=${league}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_KEY,
                'X-RapidAPI-Host': FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_HOST
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Football Web Pages scores response:', data);
        
        // Parse the response structure as shown in the curl output
        if (data && data['fixtures-results'] && data['fixtures-results'].matches) {
            // Update existing fixtures with scores
            return existingFixtures.map(fixture => {
                const match = data['fixtures-results'].matches.find(m => 
                    (m['home-team']?.name === fixture.homeTeam && m['away-team']?.name === fixture.awayTeam) ||
                    m.id === fixture.fixtureId
                );
                
                if (match) {
                    return {
                        ...fixture,
                        homeScore: match['home-team']?.score || fixture.homeScore,
                        awayScore: match['away-team']?.score || fixture.awayScore,
                        completed: match.status?.short === 'FT' || match.status?.short === 'AET' || match.status?.short === 'PEN' || fixture.completed
                    };
                }
                
                return fixture;
            });
        }
        
        return existingFixtures;
    } catch (error) {
        console.error('Error fetching scores from Football Web Pages:', error);
        // Return existing fixtures unchanged
        return existingFixtures;
    }
}

// Mock data functions for fallback
function getMockMatchdays() {
    return [
        { id: 1, name: 'Matchday 1', number: 1 },
        { id: 2, name: 'Matchday 2', number: 2 },
        { id: 3, name: 'Matchday 3', number: 3 },
        { id: 4, name: 'Matchday 4', number: 4 },
        { id: 5, name: 'Matchday 5', number: 5 },
        { id: 6, name: 'Matchday 6', number: 6 },
        { id: 7, name: 'Matchday 7', number: 7 },
        { id: 8, name: 'Matchday 8', number: 8 },
        { id: 9, name: 'Matchday 9', number: 9 },
        { id: 10, name: 'Matchday 10', number: 10 }
    ];
}

function loadFixturesForGameweek() {
    const gameweek = document.querySelector('#gameweek-select').value;
    const container = document.querySelector('#fixtures-container');
    
    container.innerHTML = ''; // Clear existing fixtures
    
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
    
    // First try the new edition-based structure
    db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
        if (doc.exists) {
            const fixtures = doc.data().fixtures;
            fixtures.forEach(fixture => {
                addFixtureRowWithData(fixture);
            });
        } else {
            // Only allow fallback to old structure for Edition 1
            if (currentActiveEdition == 1) {
                console.log(`Edition 1 - trying old structure fallback for ${gameweekKey}`);
                db.collection('fixtures').doc(gameweekKey).get().then(oldDoc => {
                    if (oldDoc.exists) {
                        const fixtures = oldDoc.data().fixtures;
            fixtures.forEach(fixture => {
                addFixtureRowWithData(fixture);
            });
        } else {
            // Add one empty row if no fixtures exist
            addFixtureRow();
        }
                }).catch(oldError => {
                    console.error('Error loading fixtures from old structure:', oldError);
                    addFixtureRow();
                });
            } else {
                // For other editions, don't fall back to old structure
                console.log(`Edition ${currentActiveEdition} - no fixtures found, not falling back to old structure`);
                addFixtureRow();
            }
        }
    }).catch(error => {
        console.error('Error loading fixtures from new structure:', error);
        // Only allow fallback to old structure for Edition 1
        if (currentActiveEdition == 1) {
            db.collection('fixtures').doc(gameweekKey).get().then(doc => {
                if (doc.exists) {
                    const fixtures = doc.data().fixtures;
                    fixtures.forEach(fixture => {
                        addFixtureRowWithData(fixture);
                    });
                } else {
                    addFixtureRow();
                }
            }).catch(oldError => {
                console.error('Error loading fixtures from old structure:', oldError);
                addFixtureRow();
            });
        } else {
            addFixtureRow();
        }
    });
}

function addFixtureRowWithData(fixture) {
    const container = document.querySelector('#fixtures-container');
    const fixtureRow = document.createElement('div');
    fixtureRow.className = 'fixture-row';
    
    let optionsHTML = '<option value="">-- Select Team --</option>';
    TEAMS_CONFIG.allTeams.forEach(team => {
        const homeSelected = team === fixture.homeTeam ? 'selected' : '';
        const awaySelected = team === fixture.awayTeam ? 'selected' : '';
        const badge = getTeamBadge(team);
        const badgeHtml = badge ? `<img src="${badge}" alt="${team}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
        optionsHTML += `<option value="${team}">${badgeHtml}${team}</option>`;
    });

    // Parse the date and time from the fixture
    const fixtureDate = new Date(fixture.date);
    const dateValue = fixtureDate.toISOString().split('T')[0];
    const timeValue = fixtureDate.toTimeString().split(' ')[0].substring(0, 5);

    fixtureRow.innerHTML = `
        <div class="fixture-inputs">
            <select class="home-team">
                ${optionsHTML}
            </select>
            <span>vs</span>
            <select class="away-team">
                ${optionsHTML}
            </select>
            <input type="date" class="fixture-date" value="${dateValue}">
            <input type="time" class="fixture-time" value="${timeValue}">
            <button class="remove-fixture-btn" onclick="removeFixtureRow(this)">Remove</button>
        </div>
    `;
    
    // Set the selected values
    fixtureRow.querySelector('.home-team').value = fixture.homeTeam;
    fixtureRow.querySelector('.away-team').value = fixture.awayTeam;
    
    container.appendChild(fixtureRow);
}

function loadScoresForGameweek() {
    const gameweek = document.querySelector('#score-gameweek-select').value;
    const container = document.querySelector('#scores-container');
    
    console.log(`loadScoresForGameweek called - gameweek: ${gameweek}, currentActiveEdition: ${currentActiveEdition}`);
    
    container.innerHTML = ''; // Clear existing scores
    
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
    
    console.log(`Looking for fixtures in: ${editionGameweekKey}`);
    
    db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
        if (doc.exists) {
            const fixtures = doc.data().fixtures;
            
            // Initialize missing half-time score fields for fixtures that don't have them
            const updatedFixtures = fixtures.map(fixture => {
                // Ensure homeScoreHT and awayScoreHT fields exist
                if (fixture.homeScoreHT === undefined) {
                    fixture.homeScoreHT = null;
                }
                if (fixture.awayScoreHT === undefined) {
                    fixture.awayScoreHT = null;
                }
                return fixture;
            });
            
            // Update the database with the initialized fields if any were missing
            const needsUpdate = fixtures.some(fixture => 
                fixture.homeScoreHT === undefined || fixture.awayScoreHT === undefined
            );
            
            if (needsUpdate) {
                console.log('Initializing missing half-time score fields in database');
                db.collection('fixtures').doc(editionGameweekKey).update({
                    fixtures: updatedFixtures
                }).catch(error => {
                    console.error('Error updating fixtures with initialized fields:', error);
                });
            }
            
            updatedFixtures.forEach((fixture, index) => {
                addScoreRow(fixture, index);
            });
        } else {
            // No fixtures found for this edition and gameweek - don't fall back to old structure
            console.log(`No fixtures found for Edition ${currentActiveEdition} Game Week ${gameweek} - not falling back to old structure`);
            container.innerHTML = `<p>No fixtures found for Edition ${currentActiveEdition} Game Week ${gameweek}. Please add fixtures first.</p>`;
        }
    }).catch(error => {
        console.error('Error loading scores from new structure:', error);
        container.innerHTML = `<p>Error loading fixtures for Edition ${currentActiveEdition} Game Week ${gameweek}. Please try again.</p>`;
    });
}

function addScoreRow(fixture, index) {
    const container = document.querySelector('#scores-container');
    const scoreRow = document.createElement('div');
    scoreRow.className = 'score-row';
    
    // Format match time properly
    const matchTime = fixture.time ? fixture.time : (fixture.matchTime || 'TBC');
    
    // Determine which scores to show based on match status
    const isCompleted = fixture.completed || fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN';
    const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.homeScoreHT !== undefined && fixture.awayScoreHT !== null && fixture.awayScoreHT !== undefined;
    const hasFullTimeScores = fixture.homeScore !== null && fixture.homeScore !== undefined && fixture.awayScore !== null && fixture.awayScore !== undefined;
    
    // Show current score if we have any scores and match is not completed
    const hasCurrentScores = fixture.homeScore !== null && fixture.homeScore !== undefined && fixture.awayScore !== null && fixture.awayScore !== undefined;
    const showCurrentScore = !isCompleted && hasCurrentScores;
    
    // Debug logging
    console.log(`Fixture ${index}: ${fixture.homeTeam} vs ${fixture.awayTeam}`, {
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        hasCurrentScores,
        showCurrentScore,
        isCompleted,
        status: fixture.status
    });
    
    // Additional debug for HTML generation
    if (showCurrentScore) {
        console.log(`Fixture ${index}: Current score section should be visible`);
    } else {
        console.log(`Fixture ${index}: Current score section hidden - isCompleted: ${isCompleted}, hasCurrentScores: ${hasCurrentScores}`);
    }
    
    const currentScoreHtml = showCurrentScore ? `
                <div class="current-scores">
                    <label>Current Score:</label>
                    <input type="number" class="home-score-current" placeholder="Home" value="${fixture.homeScore !== null && fixture.homeScore !== undefined ? fixture.homeScore : ''}" min="0">
                    <span>-</span>
                    <input type="number" class="away-score-current" placeholder="Away" value="${fixture.awayScore !== null && fixture.awayScore !== undefined ? fixture.awayScore : ''}" min="0">
                </div>
                ` : '';
    
    const halfTimeHtml = (hasHalfTimeScores || !isCompleted) ? `
                <div class="half-time-scores">
                    <label>Half Time:</label>
                    <input type="number" class="home-score-ht" placeholder="HT" value="${fixture.homeScoreHT !== null && fixture.homeScoreHT !== undefined ? fixture.homeScoreHT : ''}" min="0">
                    <span>-</span>
                    <input type="number" class="away-score-ht" placeholder="HT" value="${fixture.awayScoreHT !== null && fixture.awayScoreHT !== undefined ? fixture.awayScoreHT : ''}" min="0">
                </div>
                ` : '';
    
    const fullTimeHtml = (hasFullTimeScores || !isCompleted) ? `
                <div class="full-time-scores">
                    <label>Full Time:</label>
                    <input type="number" class="home-score" placeholder="Home" value="${fixture.homeScore !== null && fixture.homeScore !== undefined ? fixture.homeScore : ''}" min="0">
                    <span>-</span>
                    <input type="number" class="away-score" placeholder="Away" value="${fixture.awayScore !== null && fixture.awayScore !== undefined ? fixture.awayScore : ''}" min="0">
                </div>
                ` : '';
    
    // Debug HTML generation
    if (showCurrentScore) {
        console.log(`Fixture ${index}: Current score HTML:`, currentScoreHtml);
        console.log(`Fixture ${index}: Raw score values - homeScore: "${fixture.homeScore}" (type: ${typeof fixture.homeScore}), awayScore: "${fixture.awayScore}" (type: ${typeof fixture.awayScore})`);
    }
    
    // Debug half-time scores
    console.log(`Fixture ${index}: Half-time score values - homeScoreHT: "${fixture.homeScoreHT}" (type: ${typeof fixture.homeScoreHT}), awayScoreHT: "${fixture.awayScoreHT}" (type: ${typeof fixture.awayScoreHT})`);
    console.log(`Fixture ${index}: Half-time HTML:`, halfTimeHtml);
    
    scoreRow.innerHTML = `
        <div class="score-inputs">
            <div class="fixture-info">
                <span class="fixture-display">${fixture.homeTeam} vs ${fixture.awayTeam}</span>
                <span class="match-time">${matchTime}</span>
                <span class="match-status ${fixture.status || 'NS'}">${getStatusDisplay(fixture.status)}</span>
            </div>
            <div class="score-section">
                ${currentScoreHtml}
                ${halfTimeHtml}
                ${fullTimeHtml}
            </div>
            <div class="match-controls">
                <input type="checkbox" class="fixture-completed" ${isCompleted ? 'checked' : ''}>
                <label>Completed</label>
                <select class="match-status-select">
                    <option value="NS" ${fixture.status === 'NS' ? 'selected' : ''}>Not Started</option>
                    <option value="1H" ${fixture.status === '1H' ? 'selected' : ''}>First Half</option>
                    <option value="HT" ${fixture.status === 'HT' ? 'selected' : ''}>Half Time</option>
                    <option value="2H" ${fixture.status === '2H' ? 'selected' : ''}>Second Half</option>
                    <option value="FT" ${fixture.status === 'FT' ? 'selected' : ''}>Full Time</option>
                    <option value="AET" ${fixture.status === 'AET' ? 'selected' : ''}>After Extra Time</option>
                    <option value="PEN" ${fixture.status === 'PEN' ? 'selected' : ''}>Penalties</option>
                    <option value="POSTP" ${fixture.status === 'POSTP' ? 'selected' : ''}>Postponed</option>
                    <option value="CANC" ${fixture.status === 'CANC' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        </div>
    `;
    
    container.appendChild(scoreRow);
}

// Helper function to display match status
function getStatusDisplay(status) {
    const statusMap = {
        'NS': 'Not Started',
        '1H': 'First Half',
        'HT': 'Half Time',
        '2H': 'Second Half',
        'FT': 'Full Time',
        'AET': 'After Extra Time',
        'PEN': 'Penalties',
        'POSTP': 'Postponed',
        'CANC': 'Cancelled'
    };
    return statusMap[status] || 'Not Started';
}

// Enhanced Vidiprinter functionality for game week updates
let enhancedVidiprinterInterval = null;
let enhancedVidiprinterData = [];
let isEnhancedVidiprinterRunning = false;
let currentGameweekFixtures = [];
let lastProcessedEvents = new Set();

// Initialize Enhanced Vidiprinter functionality
function initializeEnhancedVidiprinter() {
    console.log('Initializing Enhanced Vidiprinter...');
    
    // Set up event listeners for enhanced vidiprinter controls
    const startBtn = document.querySelector('#start-enhanced-vidiprinter-btn');
    const stopBtn = document.querySelector('#stop-enhanced-vidiprinter-btn');
    const clearBtn = document.querySelector('#clear-enhanced-vidiprinter-btn');
    const compSelect = document.querySelector('#enhanced-vidiprinter-comp');
    const teamSelect = document.querySelector('#enhanced-vidiprinter-team');
    const refreshRateSelect = document.querySelector('#enhanced-vidiprinter-refresh-rate');
    
    if (startBtn) startBtn.addEventListener('click', startEnhancedVidiprinter);
    if (stopBtn) stopBtn.addEventListener('click', stopEnhancedVidiprinter);
    if (clearBtn) clearBtn.addEventListener('click', clearEnhancedVidiprinterFeed);
    
    // Auto-restart if settings change
    if (compSelect) {
        compSelect.addEventListener('change', () => {
            if (isEnhancedVidiprinterRunning) {
                stopEnhancedVidiprinter();
                setTimeout(startEnhancedVidiprinter, 1000);
            }
        });
    }
    
    if (teamSelect) {
        teamSelect.addEventListener('change', () => {
            if (isEnhancedVidiprinterRunning) {
                stopEnhancedVidiprinter();
                setTimeout(startEnhancedVidiprinter, 1000);
            }
        });
    }
    
    if (refreshRateSelect) {
        refreshRateSelect.addEventListener('change', () => {
            if (isEnhancedVidiprinterRunning) {
                stopEnhancedVidiprinter();
                setTimeout(startEnhancedVidiprinter, 1000);
            }
        });
    }
}

// Start Enhanced Vidiprinter feed with game week integration
async function startEnhancedVidiprinter() {
    if (isEnhancedVidiprinterRunning) return;
    
    const startBtn = document.querySelector('#start-enhanced-vidiprinter-btn');
    const stopBtn = document.querySelector('#stop-enhanced-vidiprinter-btn');
    const statusText = document.querySelector('#enhanced-vidiprinter-status-text');
    const connectionIndicator = document.querySelector('#enhanced-vidiprinter-connection-status');
    const feed = document.querySelector('#enhanced-vidiprinter-feed');
    const compSelect = document.querySelector('#enhanced-vidiprinter-comp');
    const teamSelect = document.querySelector('#enhanced-vidiprinter-team');
    const refreshRateSelect = document.querySelector('#enhanced-vidiprinter-refresh-rate');
    
    if (!feed || !compSelect) {
        console.error('Enhanced Vidiprinter elements not found');
        return;
    }
    
    try {
        isEnhancedVidiprinterRunning = true;
        
        // Update UI state
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (statusText) statusText.textContent = 'Running';
        if (connectionIndicator) connectionIndicator.className = 'connection-indicator connected';
        
        // Clear placeholder and add initial message
        const placeholder = feed.querySelector('.enhanced-vidiprinter-placeholder');
        if (placeholder) placeholder.remove();
        
        addEnhancedVidiprinterEntry('Enhanced Vidiprinter started - connecting to Football Web Pages API...', 'status');
        
        const competition = compSelect.value || '5';
        const team = teamSelect ? teamSelect.value || '0' : '0';
        const refreshRate = refreshRateSelect ? parseInt(refreshRateSelect.value) || 30000 : 30000;
        
        console.log('Starting Enhanced Vidiprinter with competition:', competition, 'team:', team, 'refresh rate:', refreshRate);
        
        // Load current game week fixtures for targeted updates
        await loadCurrentGameweekFixtures();
        
        // Fetch initial data
        await fetchEnhancedVidiprinterData(competition, team);
        
        // Set up interval for regular updates
        enhancedVidiprinterInterval = setInterval(async () => {
            if (isEnhancedVidiprinterRunning) {
                await fetchEnhancedVidiprinterData(competition, team);
            }
        }, refreshRate);
        
        console.log('Enhanced Vidiprinter started successfully');
        
    } catch (error) {
        console.error('Error starting Enhanced Vidiprinter:', error);
        addEnhancedVidiprinterEntry('Failed to connect to Enhanced Vidiprinter API', 'status');
        stopEnhancedVidiprinter();
    }
}

// Stop Enhanced Vidiprinter feed
function stopEnhancedVidiprinter() {
    if (!isEnhancedVidiprinterRunning) return;
    
    const startBtn = document.querySelector('#start-enhanced-vidiprinter-btn');
    const stopBtn = document.querySelector('#stop-enhanced-vidiprinter-btn');
    const statusText = document.querySelector('#enhanced-vidiprinter-status-text');
    const connectionIndicator = document.querySelector('#enhanced-vidiprinter-connection-status');
    
    isEnhancedVidiprinterRunning = false;
    
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (statusText) statusText.textContent = 'Stopped';
    if (connectionIndicator) connectionIndicator.className = 'connection-indicator disconnected';
    
    if (enhancedVidiprinterInterval) {
        clearInterval(enhancedVidiprinterInterval);
        enhancedVidiprinterInterval = null;
    }
    
    addEnhancedVidiprinterEntry('Enhanced Vidiprinter stopped', 'status');
    console.log('Enhanced Vidiprinter stopped');
}

// Load current game week fixtures for targeted updates
async function loadCurrentGameweekFixtures() {
    try {
        const currentGameweek = getActiveGameweek();
        if (!currentGameweek) {
            console.log('No active game week found');
            return;
        }
        
        // Fetch fixtures for current game week from Firebase
        const fixturesDoc = await db.collection('fixtures').doc(`gameweek_${currentGameweek}`).get();
        if (fixturesDoc.exists) {
            currentGameweekFixtures = fixturesDoc.data().fixtures || [];
            console.log(`Loaded ${currentGameweekFixtures.length} fixtures for game week ${currentGameweek}`);
        }
    } catch (error) {
        console.error('Error loading current game week fixtures:', error);
    }
}

// Fetch Enhanced Vidiprinter data with game week targeting
async function fetchEnhancedVidiprinterData(competition = '5', team = '0', date = null) {
    try {
        // Use current date if none specified
        if (!date) {
            const today = new Date();
            date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
        
        // Build API URL with enhanced parameters
        let apiUrl = `https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=${team}&date=${date}`;
        
        console.log('Fetching Enhanced Vidiprinter data from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'football-web-pages1.p.rapidapi.com',
                'x-rapidapi-key': '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Enhanced Vidiprinter API response:', data);
        
        if (data && data.vidiprinter && data.vidiprinter.events && Array.isArray(data.vidiprinter.events)) {
            console.log('Processing', data.vidiprinter.events.length, 'enhanced events');
            processEnhancedVidiprinterData(data.vidiprinter.events, competition, team, date);
        } else {
            console.log('No Enhanced Vidiprinter data available');
        }
        
    } catch (error) {
        console.error('Error fetching Enhanced Vidiprinter data:', error);
        const connectionIndicator = document.querySelector('#enhanced-vidiprinter-connection-status');
        if (connectionIndicator) {
            connectionIndicator.className = 'connection-indicator error';
        }
        addEnhancedVidiprinterEntry(`API Error: ${error.message}`, 'status');
    }
}

// Process Enhanced Vidiprinter data with game week integration
function processEnhancedVidiprinterData(vidiprinterEvents, competition, team, date) {
    if (!Array.isArray(vidiprinterEvents)) return;
    
    vidiprinterEvents.forEach(event => {
        if (!event || !event.text) return;
        
        // Create unique event identifier to prevent duplicates
        const eventId = `${event.text}_${event.time || ''}_${date}`;
        if (lastProcessedEvents.has(eventId)) return;
        
        lastProcessedEvents.add(eventId);
        enhancedVidiprinterData.push(event.text);
        
        // Determine entry type and priority based on content and relevance
        let entryType = 'update';
        let priority = 'normal';
        const text = event.text.toLowerCase();
        const eventType = event.type ? event.type.toLowerCase() : '';
        
        // Categorize events by type
        if (text.includes('goal') || text.includes('scored') || text.includes('goal!')) {
            entryType = 'goal';
            priority = 'high';
        } else if (text.includes('red card') || text.includes('sent off')) {
            entryType = 'red-card';
            priority = 'high';
        } else if (text.includes('yellow card') || text.includes('booked')) {
            entryType = 'yellow-card';
            priority = 'medium';
        } else if (text.includes('substitution') || text.includes('subbed') || text.includes('replaced')) {
            entryType = 'substitution';
            priority = 'medium';
        } else if (text.includes('kick-off') || text.includes('kick off')) {
            entryType = 'kick-off';
            priority = 'high';
        } else if (text.includes('half-time') || text.includes('half time')) {
            entryType = 'half-time';
            priority = 'high';
        } else if (text.includes('full-time') || text.includes('full time') || text.includes('final whistle')) {
            entryType = 'full-time';
            priority = 'high';
        } else if (text.includes('penalty') || text.includes('penalty kick')) {
            entryType = 'penalty';
            priority = 'high';
        } else if (text.includes('injury') || text.includes('injured')) {
            entryType = 'injury';
            priority = 'medium';
        } else if (text.includes('corner') || text.includes('corner kick')) {
            entryType = 'corner';
            priority = 'low';
        } else if (text.includes('free kick')) {
            entryType = 'free-kick';
            priority = 'low';
        }
        
        // Check if event is relevant to current game week
        const isRelevantToGameweek = checkEventRelevance(event.text, currentGameweekFixtures);
        
        // Add event with enhanced information
        addEnhancedVidiprinterEntry(event.text, entryType, priority, isRelevantToGameweek, event);
        
        // Update scores if this is a goal event
        if (entryType === 'goal') {
            updateScoresFromEvent(event.text, currentGameweekFixtures);
        }
    });
    
    // Limit processed events to prevent memory issues
    if (lastProcessedEvents.size > 1000) {
        const eventsArray = Array.from(lastProcessedEvents);
        lastProcessedEvents = new Set(eventsArray.slice(-500));
    }
}

// Check if an event is relevant to current game week fixtures
function checkEventRelevance(eventText, fixtures) {
    if (!fixtures || fixtures.length === 0) return false;
    
    const text = eventText.toLowerCase();
    
    return fixtures.some(fixture => {
        const homeTeam = fixture.homeTeam ? fixture.homeTeam.toLowerCase() : '';
        const awayTeam = fixture.awayTeam ? fixture.awayTeam.toLowerCase() : '';
        
        return homeTeam && text.includes(homeTeam) || 
               awayTeam && text.includes(awayTeam);
    });
}

// Update scores based on goal events
function updateScoresFromEvent(eventText, fixtures) {
    if (!fixtures || fixtures.length === 0) return;
    
    const text = eventText.toLowerCase();
    
    fixtures.forEach((fixture, index) => {
        const homeTeam = fixture.homeTeam ? fixture.homeTeam.toLowerCase() : '';
        const awayTeam = fixture.awayTeam ? fixture.awayTeam.toLowerCase() : '';
        
        // Check if this event involves either team
        if (text.includes(homeTeam) || text.includes(awayTeam)) {
            // Extract score information from event text
            const scoreMatch = eventText.match(/(\d+)-(\d+)/);
            if (scoreMatch) {
                const homeScore = parseInt(scoreMatch[1]);
                const awayScore = parseInt(scoreMatch[2]);
                
                // Update fixture scores if they've changed
                if (fixture.homeScore !== homeScore || fixture.awayScore !== awayScore) {
                    fixture.homeScore = homeScore;
                    fixture.awayScore = awayScore;
                    fixture.lastUpdated = new Date().toISOString();
                    
                    // Trigger UI update for this fixture
                    updateFixtureScoreDisplay(fixture, index);
                }
            }
        }
    });
}

// Update fixture score display in the UI
function updateFixtureScoreDisplay(fixture, index) {
    // Find and update score displays in various parts of the UI
    const scoreElements = document.querySelectorAll(`[data-fixture-index="${index}"] .score-display`);
    scoreElements.forEach(element => {
        element.textContent = `${fixture.homeScore}-${fixture.awayScore}`;
        element.classList.add('score-updated');
        
        // Remove highlight after a few seconds
        setTimeout(() => {
            element.classList.remove('score-updated');
        }, 3000);
    });
    
    console.log(`Updated score display for ${fixture.homeTeam} vs ${fixture.awayTeam}: ${fixture.homeScore}-${fixture.awayScore}`);
}

// Add entry to Enhanced Vidiprinter feed
function addEnhancedVidiprinterEntry(text, type = 'update', priority = 'normal', isRelevant = false, eventData = null) {
    const feed = document.querySelector('#enhanced-vidiprinter-feed');
    if (!feed) return;
    
    const timestamp = new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const entry = document.createElement('div');
    entry.className = `enhanced-vidiprinter-entry ${type} priority-${priority}`;
    
    if (isRelevant) {
        entry.classList.add('gameweek-relevant');
    }
    
    // Add match time if available
    let matchTime = '';
    if (eventData && eventData.time) {
        matchTime = `<span class="match-time">${eventData.time}</span>`;
    }
    
    entry.innerHTML = `
        <span class="enhanced-vidiprinter-timestamp">${timestamp}</span>
        ${matchTime}
        <span class="enhanced-vidiprinter-text">${text}</span>
        ${isRelevant ? '<span class="relevance-indicator">🎯</span>' : ''}
    `;
    
    feed.appendChild(entry);
    
    // Auto-scroll to bottom
    feed.scrollTop = feed.scrollHeight;
    
    // Limit feed to last 100 entries
    const entries = feed.querySelectorAll('.enhanced-vidiprinter-entry');
    if (entries.length > 100) {
        entries[0].remove();
    }
    
    // Add visual feedback for high priority events
    if (priority === 'high') {
        entry.classList.add('highlight');
        setTimeout(() => entry.classList.remove('highlight'), 2000);
    }
}

// Clear Enhanced Vidiprinter feed
function clearEnhancedVidiprinterFeed() {
    const feed = document.querySelector('#enhanced-vidiprinter-feed');
    if (feed) {
        feed.innerHTML = `
            <div class="enhanced-vidiprinter-placeholder">
                <i class="fas fa-tv"></i>
                <p>Enhanced Vidiprinter feed will appear here</p>
                <p>Click Start to begin receiving live updates</p>
            </div>
        `;
    }
    
    // Clear data arrays
    enhancedVidiprinterData = [];
    lastProcessedEvents.clear();
    currentGameweekFixtures = [];
}

// ... existing code ...

function saveScores() {
    const gameweek = document.querySelector('#score-gameweek-select').value;
    const scoreRows = document.querySelectorAll('.score-row');
    const updatedFixtures = [];

    console.log(`saveScores called - gameweek: ${gameweek}, currentActiveEdition: ${currentActiveEdition}`);

    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
    
    console.log(`Attempting to save scores for ${editionGameweekKey}`);
    db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
        if (doc.exists) {
            const fixtures = doc.data().fixtures;
            console.log(`Found ${fixtures.length} fixtures for ${editionGameweekKey}`);
            
            scoreRows.forEach((row, index) => {
                if (fixtures[index]) {
                    // Handle current scores (if present)
                    const currentHomeScore = row.querySelector('.home-score-current');
                    const currentAwayScore = row.querySelector('.away-score-current');
                    
                    // Use current score if available, otherwise use full-time score
                    let homeScore, awayScore;
                    if (currentHomeScore && currentAwayScore) {
                        homeScore = currentHomeScore.value;
                        awayScore = currentAwayScore.value;
                    } else {
                        const homeScoreElement = row.querySelector('.home-score');
                        const awayScoreElement = row.querySelector('.away-score');
                        homeScore = homeScoreElement ? homeScoreElement.value : null;
                        awayScore = awayScoreElement ? awayScoreElement.value : null;
                    }
                    
                    const homeScoreHTElement = row.querySelector('.home-score-ht');
                    const awayScoreHTElement = row.querySelector('.away-score-ht');
                    const completedElement = row.querySelector('.fixture-completed');
                    const statusElement = row.querySelector('.match-status-select');
                    
                    const homeScoreHT = homeScoreHTElement ? homeScoreHTElement.value : null;
                    const awayScoreHT = awayScoreHTElement ? awayScoreHTElement.value : null;
                    const completed = completedElement ? completedElement.checked : false;
                    const status = statusElement ? statusElement.value : 'FT';
                    
                    updatedFixtures.push({
                        ...fixtures[index],
                        homeScore: homeScore ? parseInt(homeScore) : null,
                        awayScore: awayScore ? parseInt(awayScore) : null,
                        homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
                        awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
                        completed: completed,
                        status: status
                    });
                }
            });

            db.collection('fixtures').doc(editionGameweekKey).update({
                fixtures: updatedFixtures
            }).then(() => {
                const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
                alert(`Scores saved for ${displayText}`);
                // Process results to update lives
                processResults(gameweek, updatedFixtures);
            }).catch(error => {
                console.error('Error saving scores:', error);
                alert('Error saving scores');
            });
        } else {
            console.log(`No fixtures document found for ${editionGameweekKey} - checking old structure`);
            
            // Fallback to old structure
            db.collection('fixtures').doc(gameweekKey).get().then(oldDoc => {
                if (oldDoc.exists) {
                    const fixtures = oldDoc.data().fixtures;
                    console.log(`Found ${fixtures.length} fixtures in old structure for ${gameweekKey}`);
                    
                    scoreRows.forEach((row, index) => {
                        if (fixtures[index]) {
                            // Handle current scores (if present)
                            const currentHomeScore = row.querySelector('.home-score-current');
                            const currentAwayScore = row.querySelector('.away-score-current');
                            
                            // Use current score if available, otherwise use full-time score
                            let homeScore, awayScore;
                            if (currentHomeScore && currentAwayScore) {
                                homeScore = currentHomeScore.value;
                                awayScore = currentAwayScore.value;
                            } else {
                                const homeScoreElement = row.querySelector('.home-score');
                                const awayScoreElement = row.querySelector('.away-score');
                                homeScore = homeScoreElement ? homeScoreElement.value : null;
                                awayScore = awayScoreElement ? awayScoreElement.value : null;
                            }
                            
                            const homeScoreHTElement = row.querySelector('.home-score-ht');
                            const awayScoreHTElement = row.querySelector('.away-score-ht');
                            const completedElement = row.querySelector('.fixture-completed');
                            const statusElement = row.querySelector('.match-status-select');
                            
                            const homeScoreHT = homeScoreHTElement ? homeScoreHTElement.value : null;
                            const awayScoreHT = awayScoreHTElement ? awayScoreHTElement.value : null;
                            const completed = completedElement ? completedElement.checked : false;
                            const status = statusElement ? statusElement.value : 'FT';
                            
                            fixtures[index] = {
                                ...fixtures[index],
                                homeScore: homeScore ? parseInt(homeScore) : null,
                                awayScore: awayScore ? parseInt(awayScore) : null,
                                homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
                                awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
                                completed: completed,
                                status: status
                            };
                        }
                    });

                    // Save to old structure
                    db.collection('fixtures').doc(gameweekKey).update({
                        fixtures: fixtures
                    }).then(() => {
                        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
                        alert(`Scores saved for ${displayText}`);
                        // Process results to update lives
                        processResults(gameweek, fixtures);
                    }).catch(error => {
                        console.error('Error saving scores to old structure:', error);
                        alert('Error saving scores');
                    });
                } else {
                    console.log(`No fixtures document found in old structure either - creating empty document`);
                    
                    // Create empty fixtures array for this gameweek
                    const emptyFixtures = [];
                    
                    // Create the document with empty fixtures
                    db.collection('fixtures').doc(editionGameweekKey).set({
                        fixtures: emptyFixtures
                    }).then(() => {
                        console.log(`Created empty fixtures document for ${editionGameweekKey}`);
                        alert(`Created empty fixtures document for ${gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`}. Please add fixtures first, then save scores.`);
                    }).catch(error => {
                        console.error('Error creating fixtures document:', error);
                        alert('Error creating fixtures document. Please try again.');
                    });
                }
            }).catch(oldError => {
                console.error('Error checking old structure:', oldError);
                alert('Error accessing fixtures. Please try again.');
            });
        }
    }).catch(error => {
        console.error('Error accessing fixtures document:', error);
        alert('Error accessing fixtures. Please try again.');
    });
}

// Track which gameweeks have been processed to prevent duplicate processing
let processedGameweeks = new Set();

// Function to reset all players' lives to 2 for testing
async function resetAllPlayerLives() {
    try {
        console.log('Resetting all players to 2 lives...');
        const usersSnapshot = await db.collection('users').get();
        let resetCount = 0;
        
        const updatePromises = usersSnapshot.docs.map(async (doc) => {
            const userData = doc.data();
            console.log(`Checking user: ${userData.displayName}, registeredEditions:`, userData.registeredEditions);
            console.log(`User data keys:`, Object.keys(userData));
            
            // Check if user is registered for test edition or has test picks
            const hasTestRegistration = userData.registeredEditions && userData.registeredEditions.includes('test');
            const hasTestPicks = (userData.picks && (userData.picks.editiontest_gw1 || userData.picks.editiontest_gw2 || userData.picks.editiontest_gw3)) || 
                                (userData.editiontest_gw1 || userData.editiontest_gw2 || userData.editiontest_gw3) ||
                                (userData.picks && (userData.picks.gw1 || userData.picks.gw2 || userData.picks.gw3));
            
            // Since we're in the test edition, any user with picks is likely a test user
            const hasAnyPicks = userData.picks && Object.keys(userData.picks).length > 0;
            
            console.log(`${userData.displayName} - hasTestRegistration: ${hasTestRegistration}, hasTestPicks: ${hasTestPicks}`);
            console.log(`${userData.displayName} - picks object:`, userData.picks);
            console.log(`${userData.displayName} - picks.editiontest_gw1:`, userData.picks ? userData.picks.editiontest_gw1 : 'no picks object');
            console.log(`${userData.displayName} - picks.gw1:`, userData.picks ? userData.picks.gw1 : 'no picks object');
            console.log(`${userData.displayName} - picks.gw2:`, userData.picks ? userData.picks.gw2 : 'no picks object');
            console.log(`${userData.displayName} - picks.gw3:`, userData.picks ? userData.picks.gw3 : 'no picks object');
            
            if (hasTestRegistration || hasTestPicks || hasAnyPicks) {
                await db.collection('users').doc(doc.id).update({
                    lives: 2
                });
                resetCount++;
                console.log(`Reset ${userData.displayName} to 2 lives (test user)`);
            } else {
                console.log(`Skipping ${userData.displayName} - not a test user`);
            }
        });
        
        await Promise.all(updatePromises);
        console.log(`Successfully reset ${resetCount} players to 2 lives`);
        
        // Clear the processed gameweeks set so we can test again
        processedGameweeks.clear();
        console.log('Cleared processed gameweeks set');
        
        alert(`Successfully reset ${resetCount} players to 2 lives and cleared processed gameweeks`);
        
    } catch (error) {
        console.error('Error resetting player lives:', error);
        alert('Error resetting player lives: ' + error.message);
    }
}

function processResults(gameweek, fixtures) {
    // This function processes the results and deducts lives from players
    // who picked losing teams
    const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
    console.log(`Processing results for ${displayText}`);
    
    // Check if this gameweek has already been processed
    if (processedGameweeks.has(gameweek)) {
        console.log(`Gameweek ${gameweek} has already been processed, skipping to prevent duplicate life deduction`);
        return;
    }
    
    // Only process if we have completed fixtures
    const completedFixtures = fixtures.filter(fixture => fixture.completed && fixture.homeScore !== null && fixture.awayScore !== null);
    
    if (completedFixtures.length === 0) {
        console.log('No completed fixtures to process');
        return;
    }
    
    // Mark this gameweek as processed
    processedGameweeks.add(gameweek);
    console.log(`Marking gameweek ${gameweek} as processed`);
    
    const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
    
    // Get all users and their picks for this gameweek
    db.collection('users').get().then(querySnapshot => {
        querySnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            
            // Get user's edition to determine the correct pick key
            const userEdition = getUserEdition(userData);
            const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;
            
            // Try new structure first, then fallback to old structure
            let userPick = userData.picks && userData.picks[editionGameweekKey];
            if (!userPick && userData.picks && userData.picks[gameweekKey]) {
                userPick = userData.picks[gameweekKey];
                console.log(`Using old pick structure for user ${userData.displayName}`);
            }
            
            if (!userPick) {
                console.log(`No pick found for user ${userData.displayName} in ${editionGameweekKey} or ${gameweekKey}`);
                return;
            }
            
            console.log(`Processing results for ${userData.displayName}: picked ${userPick} in ${editionGameweekKey}`);
            
            // Check if the user's pick lost any matches
            let livesLost = 0;
            
            completedFixtures.forEach(fixture => {
                const homeTeam = fixture.homeTeam;
                const awayTeam = fixture.awayTeam;
                const homeScore = fixture.homeScore;
                const awayScore = fixture.awayScore;
                
                // Determine the winner (or if it's a draw)
                let winner = null;
                if (homeScore > awayScore) {
                    winner = homeTeam;
                } else if (awayScore > homeScore) {
                    winner = awayTeam;
                }
                // If it's a draw, winner remains null
                
                // Check if the user picked the losing team OR if their pick was involved in a draw
                if (winner !== null && userPick === (winner === homeTeam ? awayTeam : homeTeam)) {
                    // Player picked the losing team
                    livesLost++;
                    console.log(`${userData.displayName} lost a life: picked ${userPick} but ${winner} won (${homeScore}-${awayScore})`);
                } else if (winner === null && (userPick === homeTeam || userPick === awayTeam)) {
                    // It's a draw AND the player picked one of the teams involved
                    livesLost++;
                    console.log(`${userData.displayName} lost a life: picked ${userPick} and the match was a draw (${homeScore}-${awayScore})`);
                } else if (winner !== null) {
                    // Player picked the winning team
                    console.log(`${userData.displayName} didn't lose a life: picked ${userPick}, ${winner} won (${homeScore}-${awayScore})`);
                } else {
                    // It's a draw but the player didn't pick either team involved
                    console.log(`${userData.displayName} didn't lose a life: picked ${userPick}, but the draw was ${homeTeam} vs ${awayTeam} (${homeScore}-${awayScore})`);
                }
            });
            
            // Update the user's lives if they lost any
            if (livesLost > 0) {
                const newLives = Math.max(0, userData.lives - livesLost);
                console.log(`${userData.displayName} - Current lives: ${userData.lives}, Lives lost this gameweek: ${livesLost}, New total: ${newLives}`);
                db.collection('users').doc(userDoc.id).update({
                    lives: newLives
                }).then(() => {
                    console.log(`${userData.displayName} lost ${livesLost} life(s). New total: ${newLives}`);
                }).catch(error => {
                    console.error(`Error updating lives for ${userData.displayName}:`, error);
                });
            } else {
                console.log(`${userData.displayName} didn't lose any lives this gameweek (current lives: ${userData.lives})`);
            }
        });
    }).catch(error => {
        console.error('Error processing results:', error);
    });
}

// Mobile testimonial toggle function
function toggleTestimonials() {
    const button = document.querySelector('.testimonial-toggle');
    const content = document.getElementById('mobile-testimonials');
    
    if (button && content) {
        const isActive = content.classList.contains('active');
        
        if (isActive) {
        content.classList.remove('active');
        button.classList.remove('active');
    } else {
        content.classList.add('active');
        button.classList.add('active');
        }
    }
}

// Player Management Functions
let currentPlayerManagementType = 'total';
let allPlayers = [];

function showPlayerManagement(type) {
    console.log('showPlayerManagement called with type:', type);
    console.log('Current player management type before update:', currentPlayerManagementType);
    
    currentPlayerManagementType = type;
    console.log('Current player management type after update:', currentPlayerManagementType);
    
    const modal = document.getElementById('player-management-modal');
    const title = document.getElementById('player-management-title');
    
    console.log('Modal element found:', !!modal);
    console.log('Title element found:', !!title);
    
    // Set title based on type
    switch(type) {
        case 'total':
            title.textContent = 'Active Registrations - Player Management';
            break;
        case 'current':
            title.textContent = 'Current Edition - Player Management';
            break;
        case 'archived':
            title.textContent = 'Archived Players - Player Management';
            break;
        default:
            console.warn('Unknown player management type:', type);
            break;
    }
    
    console.log('Setting modal display to flex');
    modal.style.display = 'flex';
    
    console.log('Calling loadPlayersForManagement...');
    loadPlayersForManagement();
    console.log('loadPlayersForManagement called');
}

function closePlayerManagement() {
    const modal = document.getElementById('player-management-modal');
    modal.style.display = 'none';
}

function closePlayerEdit() {
    const modal = document.getElementById('player-edit-modal');
    modal.style.display = 'none';
}

async function loadPlayersForManagement() {
    console.log('loadPlayersForManagement called');
    console.log('Current management type:', currentPlayerManagementType);
    console.log('Current active edition:', currentActiveEdition);
    
    try {
        console.log('Fetching users from database...');
        const usersSnapshot = await db.collection('users').get();
        console.log('Users snapshot received, size:', usersSnapshot.size);
        
        allPlayers = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const player = {
                id: doc.id,
                firstName: userData.firstName || '',
                surname: userData.surname || '',
                email: userData.email || '',
                lives: userData.lives || 0,
                status: userData.status || 'active',
                registrations: userData.registrations || {},
                adminNotes: userData.adminNotes || '',
                registrationDate: userData.registrationDate || null
            };
            
            console.log('Processing player:', player.firstName, player.surname, 'Status:', player.status);
            
            // Filter based on current management type
            let shouldInclude = false;
            switch(currentPlayerManagementType) {
                case 'total':
                    // Include only active users (exclude archived)
                    shouldInclude = player.status !== 'archived';
                    break;
                case 'current':
                    shouldInclude = player.registrations[`edition${currentActiveEdition}`] && player.status !== 'archived';
                    break;
                case 'archived':
                    // Show only archived players
                    shouldInclude = player.status === 'archived';
                    break;
            }
            
            console.log('Player should be included:', shouldInclude, 'Reason:', currentPlayerManagementType);
            
            if (shouldInclude) {
                allPlayers.push(player);
                console.log('Player added to allPlayers array');
            }
        });
        
        console.log('Total players found:', allPlayers.length);
        console.log('Calling displayPlayers...');
        displayPlayers(allPlayers);
        console.log('displayPlayers called');
        
    } catch (error) {
        console.error('Error loading players for management:', error);
    }
}

function displayPlayers(players) {
    console.log('displayPlayers called with players:', players);
    console.log('Number of players to display:', players.length);
    
    const tbody = document.getElementById('player-management-list');
    console.log('Table body element found:', !!tbody);
    console.log('Table body element:', tbody);
    
    if (!tbody) {
        console.error('Table body element not found!');
        return;
    }
    
    console.log('Clearing table body innerHTML');
    tbody.innerHTML = '';
    
    if (currentPlayerManagementType === 'archived' && players.length === 0) {
        console.log('No archived players found, showing message');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No archived players found</td></tr>';
        return;
    }
    
    if (players.length === 0) {
        console.log('No players found, showing message');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No players found</td></tr>';
        return;
    }
    
    console.log('Starting to render player rows...');
    players.forEach((player, index) => {
        console.log(`Rendering player ${index + 1}:`, player.firstName, player.surname);
        
        const row = document.createElement('tr');
        const name = `${player.firstName} ${player.surname}`.trim();
        const statusClass = player.status === 'active' ? 'player-status-active' : 'player-status-archived';
        const statusText = player.status === 'active' ? 'Active' : 'Archived';
        
        // Get latest edition
        let latestEdition = 'None';
        if (player.registrations && Object.keys(player.registrations).length > 0) {
            const editions = Object.keys(player.registrations);
            const latest = editions.sort().pop();
            latestEdition = latest.replace('edition', 'Edition ');
        }
        
        // Check if player is already in Test Weeks
        const isInTestWeeks = player.registrations && player.registrations.editiontest;
        
        // Get card emoji based on lives
        const getLivesDisplay = (lives) => {
            if (lives === 0) {
                return '<span style="color: #dc3545; font-size: 1.2em;">🟥</span> <span style="color: #dc3545; font-weight: bold;">ELIMINATED</span>';
            } else if (lives === 1) {
                return '<span style="color: #ffc107; font-size: 1.2em;">🟨</span> <span style="color: #ffc107; font-weight: bold;">1 Life</span>';
            } else if (lives === 2) {
                return '<span style="color: #28a745; font-size: 1.2em;">🟢</span> <span style="color: #28a745; font-weight: bold;">2 Lives</span>';
            } else {
                return `<span style="color: #6c757d;">${lives} Lives</span>`;
            }
        };
        
        row.innerHTML = `
            <td>${name}</td>
            <td>${player.email}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${getLivesDisplay(player.lives)}</td>
            <td>${latestEdition}</td>
            <td class="player-action-buttons">
                <button class="edit-player-btn" onclick="editPlayer('${player.id}')">Edit</button>
                ${!isInTestWeeks ? 
                    `<button class="add-test-weeks-btn" onclick="addToTestWeeks('${player.id}')" style="background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-left: 4px; font-size: 12px;">Add to Test Weeks</button>` :
                    `<span style="color: #28a745; font-size: 12px; margin-left: 4px;">✓ Test Weeks</span>`
                }
                ${player.status === 'active' ? 
                    `<button class="archive-player-btn" onclick="archivePlayer('${player.id}')">Archive</button>` :
                    `<button class="unarchive-player-btn" onclick="unarchivePlayer('${player.id}')">Unarchive</button>
                     <button class="delete-player-btn" onclick="deletePlayer('${player.id}')">Delete</button>`
                }
            </td>
        `;
        
        console.log(`Appending row for player ${index + 1} to table body`);
        tbody.appendChild(row);
    });
    
    console.log('Finished rendering all player rows');
}

function searchPlayers() {
    const searchTerm = document.getElementById('player-search').value.toLowerCase();
    const filteredPlayers = allPlayers.filter(player => {
        const name = `${player.firstName} ${player.surname}`.toLowerCase();
        const email = player.email.toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });
    displayPlayers(filteredPlayers);
}

function filterPlayers() {
    const statusFilter = document.getElementById('player-status-filter').value;
    let filteredPlayers = allPlayers;
    
    if (statusFilter !== 'all') {
        filteredPlayers = allPlayers.filter(player => player.status === statusFilter);
    }
    
    displayPlayers(filteredPlayers);
}

async function editPlayer(playerId) {
    console.log('editPlayer called with ID:', playerId);
    
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) {
        console.error('Player not found:', playerId);
        return;
    }
    
    console.log('Found player:', player);
    
    // Populate edit form
    document.getElementById('edit-first-name').value = player.firstName;
    document.getElementById('edit-surname').value = player.surname;
    document.getElementById('edit-email').value = player.email;
    document.getElementById('edit-lives').value = player.lives;
    document.getElementById('edit-status').value = player.status;
    document.getElementById('edit-notes').value = player.adminNotes;
    
    // Populate edition checkboxes based on player's registrations
    const editions = player.registrations || {};
    document.getElementById('edit-edition-1').checked = !!editions.edition1;
    document.getElementById('edit-edition-2').checked = !!editions.edition2;
    document.getElementById('edit-edition-3').checked = !!editions.edition3;
    document.getElementById('edit-edition-4').checked = !!editions.edition4;
    document.getElementById('edit-edition-test').checked = !!editions.editiontest;
    
    // Store player ID for save operation
    const form = document.getElementById('player-edit-form');
    form.setAttribute('data-player-id', playerId);
    
    // Attach form submission event listener if not already attached
    if (!form.hasAttribute('data-event-listener-attached')) {
        console.log('Attaching form submission event listener');
        form.addEventListener('submit', savePlayerEdit);
        form.setAttribute('data-event-listener-attached', 'true');
    }
    
    // Show edit modal
    document.getElementById('player-edit-modal').style.display = 'flex';
    console.log('Edit modal displayed');
}

async function savePlayerEdit(event) {
    console.log('savePlayerEdit called!');
    event.preventDefault();
    
    console.log('Form submitted, checking authentication...');
    
    // Check if user is still authenticated before proceeding
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error('User not authenticated during save operation');
        alert('Authentication error. Please refresh the page and try again.');
        return;
    }
    
    console.log('User authenticated:', currentUser.email);
    console.log('Current auth state - User:', currentUser.uid, 'Email:', currentUser.email);
    
    const playerId = event.target.getAttribute('data-player-id');
    console.log('Player ID from form:', playerId);
    if (!playerId) {
        console.error('No player ID found in form');
        return;
    }
    
    try {
        // Refresh the authentication token to prevent expiration issues
        try {
            await currentUser.getIdToken(true);
            console.log('Authentication token refreshed successfully');
        } catch (tokenError) {
            console.warn('Could not refresh token, proceeding with current token:', tokenError);
        }
        
        // Verify admin status before proceeding
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists || userDoc.data().isAdmin !== true) {
            console.error('User lost admin privileges during save operation');
            alert('Admin access lost. Please refresh the page and try again.');
            return;
        }
        
        // Get current player data to preserve existing registrations
        const playerDoc = await db.collection('users').doc(playerId).get();
        const currentData = playerDoc.data();
        const currentRegistrations = currentData.registrations || {};
        
        // Build registration updates based on checkboxes
        const registrationUpdates = {};
        const editionCheckboxes = [
            { id: 'edit-edition-1', key: 'edition1' },
            { id: 'edit-edition-2', key: 'edition2' },
            { id: 'edit-edition-3', key: 'edition3' },
            { id: 'edit-edition-4', key: 'edition4' },
            { id: 'edit-edition-test', key: 'editiontest' }
        ];
        
        editionCheckboxes.forEach(({ id, key }) => {
            const isChecked = document.getElementById(id).checked;
            if (isChecked && !currentRegistrations[key]) {
                // Add registration if checked and not already registered
                registrationUpdates[`registrations.${key}`] = {
                    registrationDate: new Date(),
                    paymentMethod: 'Admin Added',
                    emailConsent: true,
                    whatsappConsent: true
                };
            } else if (!isChecked && currentRegistrations[key]) {
                // Remove registration if unchecked and currently registered
                registrationUpdates[`registrations.${key}`] = db.FieldValue.delete();
            }
        });
        
        const firstName = document.getElementById('edit-first-name').value;
        const surname = document.getElementById('edit-surname').value;
        
        const updates = {
            firstName: firstName,
            surname: surname,
            displayName: `${firstName} ${surname}`,
            email: document.getElementById('edit-email').value,
            lives: parseInt(document.getElementById('edit-lives').value),
            status: document.getElementById('edit-status').value,
            adminNotes: document.getElementById('edit-notes').value,
            lastUpdated: new Date(),
            ...registrationUpdates
        };
        
        console.log('About to perform database update with:', updates);
        
        // Perform the update with additional error handling
        await db.collection('users').doc(playerId).update(updates);
        
        console.log('Database update completed successfully');
        
        // Update local data
        const playerIndex = allPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            allPlayers[playerIndex] = { ...allPlayers[playerIndex], ...updates };
        }
        
        // Refresh display
        displayPlayers(allPlayers);
        
        // Close modal
        closePlayerEdit();
        
        // Show success message
        alert('Player updated successfully!');
        
    } catch (error) {
        console.error('Error updating player:', error);
        
        // Check if it's an authentication error
        if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
            alert('Authentication error. Please refresh the page and try again.');
        } else if (error.code === 'unavailable') {
            alert('Database temporarily unavailable. Please try again in a moment.');
        } else {
            alert('Error updating player: ' + error.message);
        }
    }
}

async function archivePlayer(playerId) {
    if (!confirm('Are you sure you want to archive this player?')) return;
    
    // Check if user is still authenticated before proceeding
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error('User not authenticated during archive operation');
        alert('Authentication error. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Refresh the authentication token to prevent expiration issues
        try {
            await currentUser.getIdToken(true);
            console.log('Authentication token refreshed successfully');
        } catch (tokenError) {
            console.warn('Could not refresh token, proceeding with current token:', tokenError);
        }
        
        await db.collection('users').doc(playerId).update({
            status: 'archived',
            archivedDate: new Date(),
            lastUpdated: new Date()
        });
        
        // Update local data
        const playerIndex = allPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            allPlayers[playerIndex].status = 'archived';
        }
        
        // Refresh display
        displayPlayers(allPlayers);
        
        alert('Player archived successfully!');
        
    } catch (error) {
        console.error('Error archiving player:', error);
        alert('Error archiving player: ' + error.message);
    }
}

async function unarchivePlayer(playerId) {
    if (!confirm('Are you sure you want to unarchive this player?')) return;
    
    // Check if user is still authenticated before proceeding
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error('User not authenticated during unarchive operation');
        alert('Authentication error. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Refresh the authentication token to prevent expiration issues
        try {
            await currentUser.getIdToken(true);
            console.log('Authentication token refreshed successfully');
        } catch (tokenError) {
            console.warn('Could not refresh token, proceeding with current token:', tokenError);
        }
        
        await db.collection('users').doc(playerId).update({
            status: 'active',
            unarchivedDate: new Date(),
            lastUpdated: new Date()
        });
        
        // Update local data
        const playerIndex = allPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            allPlayers[playerIndex].status = 'active';
        }
        
        // Refresh display
        displayPlayers(allPlayers);
        
        alert('Player unarchived successfully!');
        
    } catch (error) {
        console.error('Error unarchiving player:', error);
        alert('Error unarchiving player: ' + error.message);
    }
}

async function addToTestWeeks(playerId) {
    if (!confirm('Add this player to Test Weeks edition?')) return;
    
    // Check if user is still authenticated before proceeding
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error('User not authenticated during add to test weeks operation');
        alert('Authentication error. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Refresh the authentication token to prevent expiration issues
        try {
            await currentUser.getIdToken(true);
            console.log('Authentication token refreshed successfully');
        } catch (tokenError) {
            console.warn('Could not refresh token, proceeding with current token:', tokenError);
        }
        
        await db.collection('users').doc(playerId).update({
            [`registrations.editiontest`]: {
                registrationDate: new Date(),
                paymentMethod: 'Admin Added',
                emailConsent: true,
                whatsappConsent: true
            },
            lastUpdated: new Date()
        });
        
        // Update local data
        const playerIndex = allPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            if (!allPlayers[playerIndex].registrations) {
                allPlayers[playerIndex].registrations = {};
            }
            allPlayers[playerIndex].registrations.editiontest = {
                registrationDate: new Date(),
                paymentMethod: 'Admin Added',
                emailConsent: true,
                whatsappConsent: true
            };
        }
        
        // Refresh display
        displayPlayers(allPlayers);
        
        alert('Player added to Test Weeks successfully!');
        
    } catch (error) {
        console.error('Error adding player to Test Weeks:', error);
        alert('Error adding player to Test Weeks: ' + error.message);
    }
}

async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to PERMANENTLY DELETE this player? This action cannot be undone and will remove all their data from the database.')) return;
    
    // Check if user is still authenticated before proceeding
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error('User not authenticated during delete operation');
        alert('Authentication error. Please refresh the page and try again.');
        return;
    }
    
    try {
        // Refresh the authentication token to prevent expiration issues
        try {
            await currentUser.getIdToken(true);
            console.log('Authentication token refreshed successfully');
        } catch (tokenError) {
            console.warn('Could not refresh token, proceeding with current token:', tokenError);
        }
        // Get player info for confirmation
        const player = allPlayers.find(p => p.id === playerId);
        if (!player) {
            alert('Player not found!');
            return;
        }
        
        // Final confirmation with player details
        const finalConfirm = confirm(`Are you absolutely sure you want to delete ${player.firstName} ${player.surname} (${player.email})?\n\nThis will:\n- Delete their Firestore document\n- Remove all their picks and registration data\n- This action is PERMANENT and cannot be undone\n\nIMPORTANT: Their Firebase Authentication account will remain active. You may need to manually delete it from Firebase Console to prevent them from logging in.`);
        
        if (!finalConfirm) return;
        
        // Delete from Firestore
        await db.collection('users').doc(playerId).delete();
        
        // Remove from local data
        const playerIndex = allPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            allPlayers.splice(playerIndex, 1);
        }
        
        // Refresh display
        displayPlayers(allPlayers);
        
        // Refresh statistics
        await refreshRegistrationStats();
        
        alert(`Player deleted successfully!\n\nNote: Their Firebase Authentication account (${player.email}) may still be active. To completely prevent login access, you may need to manually delete their account from Firebase Console → Authentication → Users.`);
        
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player: ' + error.message);
    }
}

// Initialize player management event listeners
document.addEventListener('DOMContentLoaded', function() {
    const playerEditForm = document.getElementById('player-edit-form');
    if (playerEditForm) {
        playerEditForm.addEventListener('submit', savePlayerEdit);
    }
});

// Function to check for orphaned Firebase Auth accounts
async function checkOrphanedAccounts() {
    try {
        console.log('Checking for orphaned Firebase Auth accounts...');
        
        // Get all users from Firebase Auth (requires admin SDK, but we can try a workaround)
        // Note: This is a limited approach since we can't directly list Firebase Auth users from client-side
        
        // Instead, let's check if we can find the specific email in our database
        const emailToCheck = 'adam.firth1@nhs.net';
        const usersSnapshot = await db.collection('users').where('email', '==', emailToCheck).get();
        
        if (usersSnapshot.empty) {
            console.log(`Email ${emailToCheck} not found in Firestore database`);
            console.log('This suggests the user exists in Firebase Auth but not in Firestore');
            console.log('Possible solutions:');
            console.log('1. Try logging in with this email to see if the account exists');
            console.log('2. Use Firebase Console to manually delete the orphaned account');
            console.log('3. Contact Firebase support if needed');
        } else {
            console.log(`Email ${emailToCheck} found in Firestore:`, usersSnapshot.docs[0].data());
        }
        
    } catch (error) {
        console.error('Error checking orphaned accounts:', error);
    }
}

// Function to attempt login with orphaned email to verify account exists
async function testOrphanedAccountLogin(email, password) {
    try {
        console.log(`Attempting to login with ${email} to verify account exists...`);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful - account exists in Firebase Auth:', userCredential.user);
        
        // Check if user document exists in Firestore
        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        if (userDoc.exists) {
            console.log('User document exists in Firestore:', userDoc.data());
        } else {
            console.log('User document does NOT exist in Firestore - this is an orphaned account');
            console.log('You can either:');
            console.log('1. Delete the account from Firebase Console');
            console.log('2. Create the missing Firestore document manually');
        }
        
        // Sign out
        await auth.signOut();
        
    } catch (error) {
        console.error('Login failed:', error);
        if (error.code === 'auth/user-not-found') {
            console.log('Account does not exist in Firebase Auth');
        } else if (error.code === 'auth/wrong-password') {
            console.log('Account exists but password is incorrect');
        }
    }
}

// Function to show instructions for deleting Firebase Auth accounts
function showFirebaseAuthDeletionInstructions() {
    const instructions = `
IMPORTANT: Firebase Authentication Account Deletion

When you delete a player from the database, their Firebase Authentication account remains active. This means they could still potentially log in even though their data has been removed.

To completely remove a user's access:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Authentication → Users
4. Find the user's email address
5. Click the three dots (⋮) next to their account
6. Select "Delete account"
7. Confirm the deletion

This will permanently remove their ability to log in to the application.

Note: This must be done manually as client-side code cannot delete Firebase Auth accounts for security reasons.
    `;
    
    alert(instructions);
}

// Testimonial Image Modal Functions
function initializeTestimonialModal() {
    // Create modal dynamically and append to document body
    let modal = document.getElementById('imageModal');
    let modalImg = document.getElementById('modalImage');
    let closeBtn = document.querySelector('.modal-close');
    
    // If modal doesn't exist, create it dynamically
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.style.cssText = 'display: none; position: fixed !important; z-index: 999999 !important; left: 0 !important; top: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.8) !important; backdrop-filter: blur(5px) !important;';
        
        closeBtn = document.createElement('span');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'position: absolute !important; top: -50px !important; right: 0 !important; color: white !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; padding: 0 !important; line-height: 1 !important; z-index: 1000000 !important;';
        
        modalImg = document.createElement('img');
        modalImg.className = 'modal-content';
        modalImg.id = 'modalImage';
        modalImg.style.cssText = 'position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; max-width: 90% !important; max-height: 90% !important; border-radius: 12px !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important; z-index: 1000001 !important;';
        
        modal.appendChild(closeBtn);
        modal.appendChild(modalImg);
        document.body.appendChild(modal);
    }
    
    const testimonialImages = document.querySelectorAll('.testimonial-image');
    
    // Add click event to all testimonial images
    testimonialImages.forEach(img => {
        img.addEventListener('click', function() {
            modal.style.display = 'block';
            modalImg.src = this.src;
            modalImg.alt = this.alt;
        });
    });
    
    // Close modal when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}





// Registration Window Display Functions
async function initializeRegistrationWindowDisplay() {
    await updateRegistrationWindowDisplay();
    // Update every minute
    setInterval(updateRegistrationWindowDisplay, 60000);
}

async function updateRegistrationWindowDisplay() {
    try {
        const settingsDoc = await db.collection('settings').doc(`registration_edition_${currentActiveEdition}`).get();
        if (!settingsDoc.exists) {
            hideRegistrationCountdowns();
            showRegisterButton(false);
            return;
        }

        const settings = settingsDoc.data();
        const now = new Date();
        
        // Check if registration is currently open
        const isCurrentlyOpen = await checkRegistrationWindow();
        
        if (isCurrentlyOpen) {
            // Registration is open - show countdown to end
            const endDate = settings.endDate ? new Date(settings.endDate.toDate()) : null;
            if (endDate) {
                showRegistrationCountdown(endDate);
            } else {
                hideRegistrationCountdowns();
            }
            showRegisterButton(true);
        } else {
            // Registration is closed - check for next window
            const nextStartDate = settings.nextStartDate ? new Date(settings.nextStartDate.toDate()) : null;
            if (nextStartDate && nextStartDate > now) {
                showNextRegistrationCountdown(nextStartDate);
            } else {
                hideRegistrationCountdowns();
            }
            showRegisterButton(false);
        }
    } catch (error) {
        console.error('Error updating registration window display:', error);
        hideRegistrationCountdowns();
        showRegisterButton(false);
    }
}

function showRegistrationCountdown(endDate) {
    const countdownDiv = document.querySelector('#registration-countdown');
    const nextCountdownDiv = document.querySelector('#next-registration-countdown');
    const timerSpan = document.querySelector('#countdown-timer');
    
    if (countdownDiv && timerSpan) {
        countdownDiv.style.display = 'block';
        if (nextCountdownDiv) nextCountdownDiv.style.display = 'none';
        
        // Update countdown every second
        const updateCountdown = () => {
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft <= 0) {
                // Registration window has ended
                hideRegistrationCountdowns();
                showRegisterButton(false);
                // Refresh the display to check for next window
                setTimeout(updateRegistrationWindowDisplay, 1000);
                return;
            }
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            let countdownText = '';
            if (days > 0) countdownText += `${days}d `;
            if (hours > 0 || days > 0) countdownText += `${hours}h `;
            if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `;
            countdownText += `${seconds}s`;
            
            timerSpan.textContent = countdownText;
        };
        
        updateCountdown();
        // Update every second
        setInterval(updateCountdown, 1000);
    }
}

function showNextRegistrationCountdown(startDate) {
    const countdownDiv = document.querySelector('#registration-countdown');
    const nextCountdownDiv = document.querySelector('#next-registration-countdown');
    const nextTimerSpan = document.querySelector('#next-countdown-timer');
    
    if (nextCountdownDiv && nextTimerSpan) {
        nextCountdownDiv.style.display = 'block';
        if (countdownDiv) countdownDiv.style.display = 'none';
        
        // Update countdown every second
        const updateCountdown = () => {
            const now = new Date();
            const timeLeft = startDate - now;
            
            if (timeLeft <= 0) {
                // Next registration window has started
                hideRegistrationCountdowns();
                // Refresh the display to check current window
                setTimeout(updateRegistrationWindowDisplay, 1000);
                return;
            }
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            let countdownText = '';
            if (days > 0) countdownText += `${days}d `;
            if (hours > 0 || days > 0) countdownText += `${hours}h `;
            if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `;
            countdownText += `${seconds}s`;
            
            nextTimerSpan.textContent = countdownText;
        };
        
        updateCountdown();
        // Update every second
        setInterval(updateCountdown, 1000);
    }
}

function hideRegistrationCountdowns() {
    const countdownDiv = document.querySelector('#registration-countdown');
    const nextCountdownDiv = document.querySelector('#next-registration-countdown');
    
    if (countdownDiv) countdownDiv.style.display = 'none';
    if (nextCountdownDiv) nextCountdownDiv.style.display = 'none';
}

function showRegisterButton(show) {
    const registerButton = document.querySelector('#register-now-button');
    if (registerButton) {
        registerButton.style.display = show ? 'inline-block' : 'none';
    }
}

// Vidiprinter functionality
let vidiprinterInterval = null;
let vidiprinterData = [];
let isVidiprinterRunning = false;
let autoScrollEnabled = true;

// Initialize Vidiprinter functionality
function initializeVidiprinter() {
    console.log('Initializing Vidiprinter...');
    const startBtn = document.querySelector('#start-vidiprinter-btn');
    const stopBtn = document.querySelector('#stop-vidiprinter-btn');
    const clearBtn = document.querySelector('#clear-vidiprinter-btn');
    const autoScrollBtn = document.querySelector('#auto-scroll-toggle');
    const compSelect = document.querySelector('#vidiprinter-comp');
    const refreshRateSelect = document.querySelector('#vidiprinter-refresh-rate');
    
    console.log('Vidiprinter elements found:', {
        startBtn: !!startBtn,
        stopBtn: !!stopBtn,
        clearBtn: !!clearBtn,
        autoScrollBtn: !!autoScrollBtn,
        compSelect: !!compSelect,
        refreshRateSelect: !!refreshRateSelect
    });

    if (startBtn) {
        startBtn.addEventListener('click', startVidiprinter);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopVidiprinter);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearVidiprinterFeed);
    }
    
    if (autoScrollBtn) {
        autoScrollBtn.addEventListener('click', toggleAutoScroll);
    }
    
    if (compSelect) {
        compSelect.addEventListener('change', () => {
            if (isVidiprinterRunning) {
                stopVidiprinter();
                setTimeout(startVidiprinter, 1000);
            }
        });
    }
    
    if (refreshRateSelect) {
        refreshRateSelect.addEventListener('change', () => {
            if (isVidiprinterRunning) {
                stopVidiprinter();
                setTimeout(startVidiprinter, 1000);
            }
        });
    }
}

// Start Vidiprinter feed
async function startVidiprinter() {
    if (isVidiprinterRunning) return;
    
    const startBtn = document.querySelector('#start-vidiprinter-btn');
    const stopBtn = document.querySelector('#stop-vidiprinter-btn');
    const statusText = document.querySelector('#vidiprinter-status-text');
    const connectionIndicator = document.querySelector('#vidiprinter-connection-status');
    const feed = document.querySelector('#vidiprinter-feed');
    const compSelect = document.querySelector('#vidiprinter-comp');
    const refreshRateSelect = document.querySelector('#vidiprinter-refresh-rate');
    
    if (!startBtn || !stopBtn || !statusText || !connectionIndicator || !feed) {
        console.error('Vidiprinter elements not found');
        return;
    }
    
    const competition = compSelect ? compSelect.value : '5';
    const refreshRate = refreshRateSelect ? parseInt(refreshRateSelect.value) : 10000;
    
    isVidiprinterRunning = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    statusText.textContent = 'Connecting...';
    connectionIndicator.className = 'connection-indicator';
    
    // Clear placeholder if it exists
    const placeholder = feed.querySelector('.vidiprinter-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Add initial status message
    addVidiprinterEntry('Vidiprinter started - connecting to Football Web Pages API...', 'status');
    
    try {
        console.log('Starting Vidiprinter with competition:', competition);
        // Initial fetch
        await fetchVidiprinterData(competition);
        
        // Update status
        statusText.textContent = 'Connected - receiving live updates';
        connectionIndicator.className = 'connection-indicator connected';
        
        // Start interval
        vidiprinterInterval = setInterval(async () => {
            if (isVidiprinterRunning) {
                await fetchVidiprinterData(competition);
            }
        }, refreshRate);
        
    } catch (error) {
        console.error('Error starting Vidiprinter:', error);
        statusText.textContent = 'Connection failed';
        connectionIndicator.className = 'connection-indicator error';
        addVidiprinterEntry('Failed to connect to Vidiprinter API', 'status');
        stopVidiprinter();
    }
}

// Stop Vidiprinter feed
function stopVidiprinter() {
    if (!isVidiprinterRunning) return;
    
    const startBtn = document.querySelector('#start-vidiprinter-btn');
    const stopBtn = document.querySelector('#stop-vidiprinter-btn');
    const statusText = document.querySelector('#vidiprinter-status-text');
    const connectionIndicator = document.querySelector('#vidiprinter-connection-status');
    
    isVidiprinterRunning = false;
    
    if (vidiprinterInterval) {
        clearInterval(vidiprinterInterval);
        vidiprinterInterval = null;
    }
    
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (statusText) statusText.textContent = 'Ready to start';
    if (connectionIndicator) connectionIndicator.className = 'connection-indicator';
    
    addVidiprinterEntry('Vidiprinter stopped', 'status');
}

// Fetch Vidiprinter data from Football Web Pages API
async function fetchVidiprinterData(competition = '5') {
    try {
        const response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'football-web-pages1.p.rapidapi.com',
                'x-rapidapi-key': '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Vidiprinter API response:', data);
        
        if (data && data.vidiprinter && data.vidiprinter.events && Array.isArray(data.vidiprinter.events)) {
            console.log('Processing', data.vidiprinter.events.length, 'events');
            processVidiprinterData(data.vidiprinter.events);
        } else {
            console.log('No Vidiprinter data available');
        }
        
    } catch (error) {
        console.error('Error fetching Vidiprinter data:', error);
        const connectionIndicator = document.querySelector('#vidiprinter-connection-status');
        if (connectionIndicator) {
            connectionIndicator.className = 'connection-indicator error';
        }
        addVidiprinterEntry(`API Error: ${error.message}`, 'status');
    }
}

// Process Vidiprinter data and add new entries
function processVidiprinterData(vidiprinterEvents) {
    if (!Array.isArray(vidiprinterEvents)) return;
    
    vidiprinterEvents.forEach(event => {
        if (event && event.text && !vidiprinterData.includes(event.text)) {
            vidiprinterData.push(event.text);
            
            // Determine entry type based on content and event type
            let entryType = 'status';
            const text = event.text.toLowerCase();
            const eventType = event.type ? event.type.toLowerCase() : '';
            
            if (text.includes('goal') || text.includes('scored')) {
                entryType = 'goal';
            } else if (text.includes('card') || text.includes('yellow') || text.includes('red')) {
                entryType = 'card';
            } else if (text.includes('substitution') || text.includes('subbed')) {
                entryType = 'substitution';
            } else if (text.includes('kick-off') || text.includes('full-time') || text.includes('half-time')) {
                entryType = 'match';
            } else if (eventType.includes('league-table') || text.includes('table') || text.includes('relegated') || text.includes('promoted')) {
                entryType = 'match'; // League table updates
            }
            
            addVidiprinterEntry(event.text, entryType);
        }
    });
}

// Add entry to Vidiprinter feed
function addVidiprinterEntry(text, type = 'status') {
    const feed = document.querySelector('#vidiprinter-feed');
    if (!feed) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `vidiprinter-entry ${type}`;
    
    entry.innerHTML = `
        <span class="vidiprinter-timestamp">${timestamp}</span>
        ${text}
    `;
    
    feed.appendChild(entry);
    
    // Auto-scroll to bottom if enabled
    if (autoScrollEnabled) {
        feed.scrollTop = feed.scrollHeight;
    }
    
    // Limit feed to last 100 entries
    const entries = feed.querySelectorAll('.vidiprinter-entry');
    if (entries.length > 100) {
        entries[0].remove();
    }
}

// Clear Vidiprinter feed
function clearVidiprinterFeed() {
    const feed = document.querySelector('#vidiprinter-feed');
    if (feed) {
        feed.innerHTML = `
            <div class="vidiprinter-placeholder">
                <i class="fas fa-tv"></i>
                <p>Feed cleared - click "Start Vidiprinter" to begin receiving live match updates</p>
            </div>
        `;
    }
    vidiprinterData = [];
}

// Toggle auto-scroll
function toggleAutoScroll() {
    const autoScrollBtn = document.querySelector('#auto-scroll-toggle');
    const feed = document.querySelector('#vidiprinter-feed');
    
    autoScrollEnabled = !autoScrollEnabled;
    
    if (autoScrollBtn) {
        if (autoScrollEnabled) {
            autoScrollBtn.classList.add('active');
            autoScrollBtn.textContent = 'Auto-scroll';
        } else {
            autoScrollBtn.classList.remove('active');
            autoScrollBtn.textContent = 'Auto-scroll';
        }
    }
    
    if (autoScrollEnabled && feed) {
        feed.scrollTop = feed.scrollHeight;
    }
}

function renderDesktopPlayerScores(fixtures, gameweek) {
    console.log('renderDesktopPlayerScores called with:', { fixtures, gameweek });
    
    const desktopScoresDisplay = document.querySelector('#desktop-scores-display');
    if (!desktopScoresDisplay) {
        console.error('Desktop scores display element not found');
        return;
    }
    
    if (!fixtures || fixtures.length === 0) {
        console.log('No fixtures to render for desktop');
        return;
    }
    
    // Sort fixtures by date
    const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let scoresHTML = `
        <div class="scores-header">
            <h4>Game Week ${gameweek === 'tiebreak' ? 'Tiebreak' : gameweek} Results</h4>
        </div>
        <div class="scores-container">
    `;
    
    for (const fixture of sortedFixtures) {
        const fixtureDate = new Date(fixture.date);
        const homeBadge = getTeamBadge(fixture.homeTeam);
        const awayBadge = getTeamBadge(fixture.awayTeam);
        
        const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}" class="team-badge">` : '';
        const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}" class="team-badge">` : '';
        
        // Determine score display
        let scoreDisplay = '';
        let statusClass = '';
        
        if (fixture.completed || fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
            // Full-time result with half-time scores if available
            const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
            scoreDisplay = `
                <div class="score-result">
                    <span class="score">${fixture.homeScore || 0}</span>
                    <span class="score-separator">-</span>
                    <span class="score">${fixture.awayScore || 0}</span>
                </div>
                ${hasHalfTimeScores ? `
                    <div class="half-time-scores">
                        <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                    </div>
                ` : ''}
            `;
            statusClass = 'completed';
        } else if (fixture.status === 'HT' && fixture.homeScoreHT !== null && fixture.awayScoreHT !== null) {
            // Half-time result
            scoreDisplay = `
                <div class="score-result">
                    <span class="score">${fixture.homeScoreHT}</span>
                    <span class="score-separator">-</span>
                    <span class="score">${fixture.awayScoreHT}</span>
                    <span class="score-status">HT</span>
                </div>
            `;
            statusClass = 'half-time';
        } else if (fixture.status === '1H' || fixture.status === '2H' || fixture.status === 'LIVE') {
            // Live match with current scores and half-time if available
            const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
            scoreDisplay = `
                <div class="score-result">
                    <span class="score">${fixture.homeScore || 0}</span>
                    <span class="score-separator">-</span>
                    <span class="score">${fixture.awayScore || 0}</span>
                    <span class="score-status live">LIVE</span>
                </div>
                ${hasHalfTimeScores ? `
                    <div class="half-time-scores">
                        <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                    </div>
                ` : ''}
            `;
            statusClass = 'live';
        } else {
            // Not started
            scoreDisplay = `
                <div class="score-result">
                    <span class="score-placeholder">vs</span>
                </div>
            `;
            statusClass = 'not-started';
        }
        
        scoresHTML += `
            <div class="score-fixture ${statusClass}">
                <div class="fixture-teams">
                    <div class="team home-team">
                        ${homeBadgeHtml}
                        <span class="team-name">${fixture.homeTeam}</span>
                    </div>
                    ${scoreDisplay}
                    <div class="team away-team">
                        <span class="team-name">${fixture.awayTeam}</span>
                        ${awayBadgeHtml}
                    </div>
                </div>
                <div class="fixture-info">
                    <div class="fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div class="fixture-status">${getStatusDisplay(fixture.status)}</div>
                </div>
            </div>
        `;
    }
    
    scoresHTML += '</div>';
    desktopScoresDisplay.innerHTML = scoresHTML;
}

function renderMobilePlayerScores(fixtures, gameweek) {
    console.log('renderMobilePlayerScores called with:', { fixtures, gameweek });
    
    const mobileScoresDisplay = document.querySelector('#mobile-scores-display');
    if (!mobileScoresDisplay) {
        console.error('Mobile scores display element not found');
        return;
    }
    
    if (!fixtures || fixtures.length === 0) {
        console.log('No fixtures to render for mobile');
        return;
    }
    
    // Sort fixtures by date
    const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let scoresHTML = `
        <div class="mobile-scores-header">
            <h4>Game Week ${gameweek === 'tiebreak' ? 'Tiebreak' : gameweek} Results</h4>
        </div>
        <div class="mobile-scores-container">
    `;
    
    for (const fixture of sortedFixtures) {
        const fixtureDate = new Date(fixture.date);
        const homeBadge = getTeamBadge(fixture.homeTeam);
        const awayBadge = getTeamBadge(fixture.awayTeam);
        
        const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}" class="team-badge">` : '';
        const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}" class="team-badge">` : '';
        
        // Determine score display
        let scoreDisplay = '';
        let statusClass = '';
        
        if (fixture.completed || fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
            // Full-time result with half-time scores if available
            const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
            scoreDisplay = `
                <div class="mobile-score-result">
                    <span class="mobile-score">${fixture.homeScore || 0}</span>
                    <span class="mobile-score-separator">-</span>
                    <span class="mobile-score">${fixture.awayScore || 0}</span>
                </div>
                ${hasHalfTimeScores ? `
                    <div class="mobile-half-time-scores">
                        <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                    </div>
                ` : ''}
            `;
            statusClass = 'completed';
        } else if (fixture.status === 'HT' && fixture.homeScoreHT !== null && fixture.awayScoreHT !== null) {
            // Half-time result
            scoreDisplay = `
                <div class="mobile-score-result">
                    <span class="mobile-score">${fixture.homeScoreHT}</span>
                    <span class="mobile-score-separator">-</span>
                    <span class="mobile-score">${fixture.awayScoreHT}</span>
                    <span class="mobile-score-status">HT</span>
                </div>
            `;
            statusClass = 'half-time';
        } else if (fixture.status === '1H' || fixture.status === '2H' || fixture.status === 'LIVE') {
            // Live match with current scores and half-time if available
            const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
            scoreDisplay = `
                <div class="mobile-score-result">
                    <span class="mobile-score">${fixture.homeScore || 0}</span>
                    <span class="mobile-score-separator">-</span>
                    <span class="mobile-score">${fixture.awayScore || 0}</span>
                    <span class="mobile-score-status live">LIVE</span>
                </div>
                ${hasHalfTimeScores ? `
                    <div class="mobile-half-time-scores">
                        <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                    </div>
                ` : ''}
            `;
            statusClass = 'live';
        } else {
            // Not started
            scoreDisplay = `
                <div class="mobile-score-result">
                    <span class="mobile-score-placeholder">vs</span>
                </div>
            `;
            statusClass = 'not-started';
        }
        
        scoresHTML += `
            <div class="mobile-score-fixture ${statusClass}">
                <div class="mobile-fixture-teams">
                    <div class="mobile-team home-team">
                        ${homeBadgeHtml}
                        <span class="mobile-team-name">${fixture.homeTeam}</span>
                    </div>
                    ${scoreDisplay}
                    <div class="mobile-team away-team">
                        <span class="mobile-team-name">${fixture.awayTeam}</span>
                        ${awayBadgeHtml}
                    </div>
                </div>
                <div class="mobile-fixture-info">
                    <div class="mobile-fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="mobile-fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div class="mobile-fixture-status">${getStatusDisplay(fixture.status)}</div>
                </div>
            </div>
        `;
    }
    
    scoresHTML += '</div>';
    mobileScoresDisplay.innerHTML = scoresHTML;
}

function showNoScoresMessage(edition = null) {
    const desktopScoresDisplay = document.querySelector('#desktop-scores-display');
    const mobileScoresDisplay = document.querySelector('#mobile-scores-display');
    
    let noScoresMessage = '';
    
    if (edition === 'test') {
        noScoresMessage = `
            <div class="no-scores-message">
                <h3>Test Edition - No Fixtures Available</h3>
                <p>This is the test edition. No fixtures have been created yet.</p>
                <p>To see scores, you would need to:</p>
                <ul>
                    <li>Create fixtures in the admin panel</li>
                    <li>Or switch to a different edition that has fixtures</li>
                </ul>
                <p>For now, you can explore the other tabs to see how the app works!</p>
            </div>
        `;
    } else {
        noScoresMessage = `
            <div class="no-scores-message">
                <p>No scores available for this gameweek yet.</p>
                <p>Scores will appear here once matches are played and results are updated.</p>
            </div>
        `;
    }
    
    if (desktopScoresDisplay) {
        desktopScoresDisplay.innerHTML = noScoresMessage;
    }
    if (mobileScoresDisplay) {
        mobileScoresDisplay.innerHTML = noScoresMessage;
    }
}

// ... (rest of the code remains unchanged)

// Add entry to player vidiprinter feed
function addPlayerVidiprinterEntry(text, type = 'update') {
    const desktopFeed = document.getElementById('desktop-vidiprinter-display');
    const mobileFeed = document.getElementById('mobile-vidiprinter-display');
    
    const timestamp = new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const entry = document.createElement('div');
    entry.className = `player-vidiprinter-entry ${type}`;
    entry.innerHTML = `
        <span class="player-vidiprinter-timestamp">${timestamp}</span>
        <span class="player-vidiprinter-text">${text}</span>
    `;
    
    // Add to both desktop and mobile feeds
    if (desktopFeed) {
        // Remove placeholder if it exists
        const placeholder = desktopFeed.querySelector('.player-vidiprinter-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        desktopFeed.appendChild(entry);
        desktopFeed.scrollTop = desktopFeed.scrollHeight;
    }
    
    if (mobileFeed) {
        // Remove placeholder if it exists
        const placeholder = mobileFeed.querySelector('.player-vidiprinter-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        mobileFeed.appendChild(entry);
        mobileFeed.scrollTop = mobileFeed.scrollHeight;
    }
    
    // Keep only last 50 entries to prevent memory issues
    const entries = desktopFeed ? desktopFeed.querySelectorAll('.player-vidiprinter-entry') : 
                   mobileFeed ? mobileFeed.querySelectorAll('.player-vidiprinter-entry') : [];
    
    if (entries.length > 50) {
        entries[0].remove();
    }
}