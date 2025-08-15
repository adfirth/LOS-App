// Main Admin Manager
// Orchestrates all admin functionality modules

import { UserManagement } from './userManagement.js';
import { TeamOperations } from './teamOperations.js';
import { Scheduling } from './scheduling.js';
import { Audit } from './audit.js';

export class AdminManager {
    constructor(db, fixturesManager = null, scoresManager = null) {
        this.db = db;
        this.fixturesManager = fixturesManager;
        this.scoresManager = scoresManager;
        
        // Initialize module instances
        this.userManagement = new UserManagement(db);
        this.teamOperations = new TeamOperations(db);
        this.scheduling = new Scheduling(db);
        this.audit = new Audit(db);
        
        // State tracking
        this.adminManagementInitialized = false;
        this.adminDashboardInitialized = false;
        this.adminTabsInitialized = false;
        this.fixtureManagementInitialized = false;
        this.registrationManagementInitialized = false;
        this.competitionSettingsInitialized = false;
        
        // Current active edition and gameweek
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
        
        // Method to update the current active edition
        this.updateCurrentActiveEdition = (edition) => {
            this.currentActiveEdition = edition;
            this.userManagement.updateCurrentActiveEdition(edition);
            this.teamOperations.updateCurrentActiveEdition(edition);
            this.scheduling.updateCurrentActiveEdition(edition);
            console.log(`AdminManager: Updated currentActiveEdition to ${edition}`);
        };
        
        // Method to update the current active gameweek
        this.updateCurrentActiveGameweek = (gameweek) => {
            this.currentActiveGameweek = gameweek;
            this.teamOperations.updateCurrentActiveGameweek(gameweek);
            this.scheduling.updateCurrentActiveGameweek(gameweek);
            console.log(`AdminManager: Updated currentActiveGameweek to ${gameweek}`);
        };
    }

    // Initialize admin management
    initializeAdminManagement() {
        if (this.adminManagementInitialized) {
            console.log('Admin management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing admin management...');
        this.adminManagementInitialized = true;
        
        this.setupEventListeners();
    }

    // Initialize admin page
    initializeAdminPage() {
        console.log('🚀 Initializing admin page...');
        
        // Initialize competition settings
        this.scheduling.initializeCompetitionSettings();
        
        // Build admin dashboard to ensure all functions are exposed
        this.buildAdminDashboard();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Ensure Save Settings button is properly enabled and has event listener
        this.ensureSaveSettingsButtonReady();
        
        // Initialize Football Web Pages API integration for admin interface
        this.initializeAdminApiIntegration();
        
        // Initialize audit functionality
        this.audit.initializeAudit();
        
        console.log('✅ Admin page initialization complete');
    }

    // Ensure Save Settings button is ready
    ensureSaveSettingsButtonReady() {
        console.log('🔧 Ensuring Save Settings button is ready...');
        
        const saveSettingsBtn = document.querySelector('#save-settings-btn');
        if (!saveSettingsBtn) {
            console.error('Save Settings button not found');
            return;
        }
        
        // Force enable the button
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.style.pointerEvents = 'auto';
        saveSettingsBtn.style.opacity = '1';
        saveSettingsBtn.style.cursor = 'pointer';
        saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
        saveSettingsBtn.style.color = 'var(--dark-text)';
        saveSettingsBtn.classList.remove('disabled');
        saveSettingsBtn.removeAttribute('disabled');
        
        // Remove any existing event listeners and re-attach
        saveSettingsBtn.removeEventListener('click', (e) => this.scheduling.saveCompetitionSettings(e));
        saveSettingsBtn.addEventListener('click', (e) => this.scheduling.saveCompetitionSettings(e));
        
        console.log('✅ Save Settings button is ready and enabled');
        console.log('Button disabled state:', saveSettingsBtn.disabled);
        console.log('Button pointer-events:', saveSettingsBtn.style.pointerEvents);
        console.log('Button opacity:', saveSettingsBtn.style.opacity);
        console.log('Button cursor:', saveSettingsBtn.style.cursor);
        console.log('Button background color:', saveSettingsBtn.style.backgroundColor);
        console.log('Button text color:', saveSettingsBtn.style.textColor);
        console.log('Button classes:', saveSettingsBtn.className);
        console.log('Button attributes:', Array.from(saveSettingsBtn.attributes).map(attr => `${attr.name}="${attr.value}"`));
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('🔧 Setting up admin management event listeners...');
        
        // Set up settings event listeners
        this.setupSettingsEventListeners();
        
        // Set up API suspension event listeners
        this.setupApiSuspensionEventListeners();
        
        // Set up quick edition selector
        this.scheduling.setupQuickEditionSelector();
        
        // Set up As It Stands functionality
        this.teamOperations.setupAsItStandsFunctionality();
        
        // Set up admin tabs
        this.setupAdminTabs();
        
        // Set up player management event listeners
        this.setupPlayerManagementEventListeners();
        
        console.log('✅ Admin management event listeners setup complete');
    }

    // Setup settings event listeners
    setupSettingsEventListeners() {
        console.log('🔧 Setting up settings event listeners...');
        
        // Set up save settings button monitoring
        this.setupSaveSettingsButtonMonitoring();
        
        console.log('✅ Settings event listeners setup complete');
    }

    // Setup API suspension event listeners
    setupApiSuspensionEventListeners() {
        console.log('🔧 Setting up API suspension event listeners...');
        
        const apiSuspensionContainer = document.querySelector('#api-suspension-container');
        if (!apiSuspensionContainer) {
            console.log('API suspension container not found');
            return;
        }
        
        // Load current API suspension settings
        this.loadApiSuspensionSettings();
        
        // Set up form submission
        const form = document.querySelector('#api-suspension-form');
        if (form) {
            form.addEventListener('submit', (e) => this.saveApiSuspensionSettings(e));
        }
        
        console.log('✅ API suspension event listeners setup complete');
    }

    // Setup save settings button monitoring
    setupSaveSettingsButtonMonitoring() {
        console.log('🔧 Setting up save settings button monitoring...');
        
        // Monitor for changes in competition settings form
        const competitionForm = document.querySelector('#competition-settings-form');
        if (competitionForm) {
            const formElements = competitionForm.querySelectorAll('input, select, textarea');
            
            formElements.forEach(element => {
                element.addEventListener('change', () => {
                    this.enableSaveSettingsButton();
                });
                
                element.addEventListener('input', () => {
                    this.enableSaveSettingsButton();
                });
            });
        }
        
        console.log('✅ Save settings button monitoring setup complete');
    }

    // Setup player management event listeners
    setupPlayerManagementEventListeners() {
        console.log('🔧 Setting up player management event listeners...');
        
        // Player management stat cards
        const totalRegistrationsCard = document.querySelector('#total-registrations-card');
        const currentEditionCard = document.querySelector('#current-edition-card');
        const archivedPlayersCard = document.querySelector('#archived-players-card');
        
        if (totalRegistrationsCard) {
            totalRegistrationsCard.addEventListener('click', () => {
                this.userManagement.showPlayerManagement('total');
            });
        }
        
        if (currentEditionCard) {
            currentEditionCard.addEventListener('click', () => {
                this.userManagement.showPlayerManagement('current');
            });
        }
        
        if (archivedPlayersCard) {
            archivedPlayersCard.addEventListener('click', () => {
                this.userManagement.showPlayerManagement('archived');
            });
        }
        
        // Check orphaned accounts button
        const checkOrphanedAccountsBtn = document.querySelector('#check-orphaned-accounts');
        if (checkOrphanedAccountsBtn) {
            checkOrphanedAccountsBtn.addEventListener('click', () => {
                this.userManagement.checkOrphanedAccounts();
            });
        }
        
        // Firebase Auth help button
        const firebaseAuthHelpBtn = document.querySelector('#firebase-auth-help');
        if (firebaseAuthHelpBtn) {
            firebaseAuthHelpBtn.addEventListener('click', () => {
                this.userManagement.showFirebaseAuthDeletionInstructions();
            });
        }
        
        // Close player management modal
        const closePlayerManagementBtn = document.querySelector('#close-player-management');
        if (closePlayerManagementBtn) {
            closePlayerManagementBtn.addEventListener('click', () => {
                this.userManagement.closePlayerManagement();
            });
        }
        
        // Search players button
        const searchPlayersBtn = document.querySelector('#search-players-btn');
        if (searchPlayersBtn) {
            searchPlayersBtn.addEventListener('click', () => {
                this.userManagement.searchPlayers();
            });
        }
        
        // Close player edit modal
        const closePlayerEditBtn = document.querySelector('#close-player-edit');
        if (closePlayerEditBtn) {
            closePlayerEditBtn.addEventListener('click', () => {
                this.userManagement.closePlayerEdit();
            });
        }
        
        // Cancel player edit button
        const cancelPlayerEditBtn = document.querySelector('#cancel-player-edit');
        if (cancelPlayerEditBtn) {
            cancelPlayerEditBtn.addEventListener('click', () => {
                this.userManagement.closePlayerEdit();
            });
        }
        
        // Reload page button
        const reloadPageBtn = document.querySelector('#reload-page-btn');
        if (reloadPageBtn) {
            reloadPageBtn.addEventListener('click', () => {
                location.reload();
            });
        }
        
        console.log('✅ Player management event listeners setup complete');
    }

    // Enable save settings button
    enableSaveSettingsButton() {
        const saveSettingsBtn = document.querySelector('#save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.style.opacity = '1';
            saveSettingsBtn.style.cursor = 'pointer';
            saveSettingsBtn.classList.remove('disabled');
        }
    }

    // Load API suspension settings
    async loadApiSuspensionSettings() {
        try {
            console.log('Loading API suspension settings...');
            
            const settingsDoc = await this.db.collection('settings').doc('apiSuspension').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                this.updateApiSuspensionDisplay(settings);
                console.log('✅ API suspension settings loaded');
            } else {
                console.log('No API suspension settings found, using defaults');
                this.updateApiSuspensionDisplay({
                    footballWebPages: false,
                    theSportsDb: false,
                    reason: '',
                    suspendedUntil: null
                });
            }
            
        } catch (error) {
            console.error('❌ Error loading API suspension settings:', error);
            this.updateApiSuspensionDisplay({
                footballWebPages: false,
                theSportsDb: false,
                reason: '',
                suspendedUntil: null
            });
        }
    }

    // Update API suspension display
    updateApiSuspensionDisplay(settings) {
        const footballWebPagesCheckbox = document.querySelector('#football-web-pages-suspended');
        if (footballWebPagesCheckbox) {
            footballWebPagesCheckbox.checked = settings.footballWebPages || false;
        }
        
        const theSportsDbCheckbox = document.querySelector('#the-sports-db-suspended');
        if (theSportsDbCheckbox) {
            theSportsDbCheckbox.checked = settings.theSportsDb || false;
        }
        
        const reasonInput = document.querySelector('#api-suspension-reason');
        if (reasonInput) {
            reasonInput.value = settings.reason || '';
        }
        
        const suspendedUntilInput = document.querySelector('#api-suspended-until');
        if (suspendedUntilInput && settings.suspendedUntil) {
            suspendedUntilInput.value = settings.suspendedUntil;
        }
    }

    // Save API suspension settings
    async saveApiSuspensionSettings(event) {
        if (event) event.preventDefault();
        
        try {
            console.log('🔧 Saving API suspension settings...');
            
            const settings = {
                footballWebPages: document.querySelector('#football-web-pages-suspended')?.checked || false,
                theSportsDb: document.querySelector('#the-sports-db-suspended')?.checked || false,
                reason: document.querySelector('#api-suspension-reason')?.value || '',
                suspendedUntil: document.querySelector('#api-suspended-until')?.value || null,
                lastUpdated: new Date()
            };
            
            // Save to database
            await this.db.collection('settings').doc('apiSuspension').set(settings);
            
            console.log('✅ API suspension settings saved successfully');
            alert('API suspension settings saved successfully!');
            
            // Log the action
            await this.audit.logAdminAction('API suspension settings updated', settings);
            
        } catch (error) {
            console.error('❌ Error saving API suspension settings:', error);
            alert('Error saving API suspension settings: ' + error.message);
        }
    }

    // Check if API is suspended
    async isApiSuspended(apiName) {
        try {
            const settingsDoc = await this.db.collection('settings').doc('apiSuspension').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                
                if (apiName === 'footballWebPages' && settings.footballWebPages) {
                    return this.checkSuspensionExpiry(settings.suspendedUntil);
                }
                
                if (apiName === 'theSportsDb' && settings.theSportsDb) {
                    return this.checkSuspensionExpiry(settings.suspendedUntil);
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('Error checking API suspension status:', error);
            return false;
        }
    }

    // Check suspension expiry
    checkSuspensionExpiry(suspendedUntil) {
        if (!suspendedUntil) return true; // Suspended indefinitely
        
        const expiryDate = new Date(suspendedUntil);
        const now = new Date();
        
        return now < expiryDate;
    }

    // Build admin dashboard
    buildAdminDashboard(settings) {
        console.log('🔧 Building admin dashboard...');
        
        const adminDashboard = document.querySelector('#admin-dashboard');
        if (!adminDashboard) {
            console.error('Admin dashboard container not found');
            return;
        }
        
        // Build dashboard content
        this.buildDashboardContent(adminDashboard, settings);
        
        console.log('✅ Admin dashboard built successfully');
    }

    // Build dashboard content
    buildDashboardContent(container, settings) {
        // This method would build the actual dashboard content
        // Implementation depends on your specific dashboard requirements
        console.log('Building dashboard content...');
    }

    // Load registration data for the registration tab
    async loadRegistrationData() {
        try {
            console.log('🔧 Loading registration data...');
            
            // Load registration settings
            if (this.registrationManager) {
                await this.registrationManager.loadRegistrationSettings();
            }
            
            // Load registration statistics
            await this.loadRegistrationStatistics();
            
            console.log('✅ Registration data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading registration data:', error);
        }
    }

    // Load registration statistics
    async loadRegistrationStatistics() {
        try {
            console.log('🔧 Loading registration statistics...');
            
            // Get total active registrations (excluding archived)
            const activeUsersQuery = await this.db.collection('users').where('status', '==', 'active').get();
            const totalActive = activeUsersQuery.size;
            
            // Get current edition registrations
            const currentEdition = this.getCurrentActiveEdition();
            const currentEditionUsersQuery = await this.db.collection('users')
                .where('status', '==', 'active')
                .where('editions', 'array-contains', currentEdition)
                .get();
            const currentEditionCount = currentEditionUsersQuery.size;
            
            // Get archived users count
            const archivedUsersQuery = await this.db.collection('users').where('status', '==', 'archived').get();
            const archivedCount = archivedUsersQuery.size;
            
            // Update the UI
            const totalRegistrationsElement = document.querySelector('#total-registrations');
            const currentEditionElement = document.querySelector('#current-edition-registrations');
            const archivedElement = document.querySelector('#archived-players-count');
            
            if (totalRegistrationsElement) {
                totalRegistrationsElement.textContent = totalActive;
            }
            if (currentEditionElement) {
                currentEditionElement.textContent = currentEditionCount;
            }
            if (archivedElement) {
                archivedElement.textContent = archivedCount;
            }
            
            console.log(`✅ Registration statistics loaded: ${totalActive} active, ${currentEditionCount} current edition, ${archivedCount} archived`);
            
        } catch (error) {
            console.error('❌ Error loading registration statistics:', error);
        }
    }

    // Get current active edition
    getCurrentActiveEdition() {
        // This should get the current active edition from settings
        // For now, return a default value
        return 1;
    }

    // Setup admin tabs
    setupAdminTabs() {
        console.log('🔧 Setting up admin tabs...');
        
        const tabContainer = document.querySelector('#admin-tabs');
        if (!tabContainer) {
            console.log('Admin tabs container not found');
            return;
        }
        
        // Set up tab switching
        this.setupTabSwitching();
        
        // Set up tab content
        this.setupTabContent();
        
        console.log('✅ Admin tabs setup complete');
    }

    // Setup tab switching
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.admin-tab');
        const tabContents = document.querySelectorAll('.admin-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    // Switch tab
    switchTab(targetTab) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.admin-tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show target tab content
        const targetContent = document.querySelector(`#${targetTab}-content`);
        if (targetContent) {
            targetContent.style.display = 'block';
        }
        
        // Add active class to target tab
        const targetTabElement = document.querySelector(`[data-tab="${targetTab}"]`);
        if (targetTabElement) {
            targetTabElement.classList.add('active');
        }
        
        // Load tab-specific content
        this.loadTabContent(targetTab);
    }

    // Load tab content
    loadTabContent(tabName) {
        switch (tabName) {
            case 'user-management':
                this.userManagement.showPlayerManagement('total');
                break;
            case 'team-operations':
                this.teamOperations.loadStandings();
                break;
            case 'scheduling':
                this.scheduling.loadCurrentCompetitionSettings();
                break;
            case 'audit':
                this.audit.loadAuditLogs();
                break;
            default:
                console.log(`No specific content for tab: ${tabName}`);
        }
    }

    // Setup tab content
    setupTabContent() {
        // Initialize default tab
        this.switchTab('user-management');
    }

    // Initialize fixture management
    initializeFixtureManagement() {
        if (this.fixtureManagementInitialized) {
            console.log('Fixture management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing fixture management...');
        this.fixtureManagementInitialized = true;
        
        // Set up fixture management event listeners
        this.setupFixtureManagementEventListeners();
        
        console.log('✅ Fixture management initialized');
    }

    // Setup fixture management event listeners
    setupFixtureManagementEventListeners() {
        console.log('🔧 Setting up fixture management event listeners...');
        
        const addFixtureBtn = document.querySelector('#add-fixture-btn');
        if (addFixtureBtn) {
            addFixtureBtn.addEventListener('click', () => this.fixturesManager.addFixtureRow());
        }
        
        const saveFixturesBtn = document.querySelector('#save-fixtures-btn');
        if (saveFixturesBtn) {
            saveFixturesBtn.addEventListener('click', () => this.fixturesManager.saveFixtures());
        }
        
        const checkFixturesBtn = document.querySelector('#check-fixtures-btn');
        if (checkFixturesBtn) {
            checkFixturesBtn.addEventListener('click', () => this.fixturesManager.checkFixtures());
        }
        
        console.log('✅ Fixture management event listeners setup complete');
    }

    // Initialize registration management
    initializeRegistrationManagement() {
        if (this.registrationManagementInitialized) {
            console.log('Registration management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing registration management...');
        this.registrationManagementInitialized = true;
        
        // Set up registration management functionality
        this.setupRegistrationManagement();
        
        console.log('✅ Registration management initialized');
    }

    // Setup registration management
    setupRegistrationManagement() {
        console.log('🔧 Setting up registration management...');
        
        // This would set up registration management functionality
        // Implementation depends on your specific requirements
        
        console.log('✅ Registration management setup complete');
    }

    // Initialize admin API integration
    initializeAdminApiIntegration() {
        console.log('🔧 Initializing admin API integration...');
        
        // This would initialize API integration for the admin interface
        // Implementation depends on your specific API requirements
        
        console.log('✅ Admin API integration initialized');
    }

    // Initialize enhanced vidiprinter
    initializeEnhancedVidiprinter() {
        console.log('🔧 Initializing enhanced vidiprinter...');
        
        // This would initialize the enhanced vidiprinter functionality
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter initialized');
    }

    // Start enhanced vidiprinter
    async startEnhancedVidiprinter() {
        console.log('🔧 Starting enhanced vidiprinter...');
        
        // This would start the enhanced vidiprinter
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter started');
    }

    // Stop enhanced vidiprinter
    stopEnhancedVidiprinter() {
        console.log('🔧 Stopping enhanced vidiprinter...');
        
        // This would stop the enhanced vidiprinter
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter stopped');
    }

    // Clear enhanced vidiprinter feed
    clearEnhancedVidiprinterFeed() {
        console.log('🔧 Clearing enhanced vidiprinter feed...');
        
        // This would clear the enhanced vidiprinter feed
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter feed cleared');
    }

    // Reset test edition players to 2 lives
    async resetTestLives() {
        if (!confirm('Are you sure you want to reset all TEST EDITION players to 2 lives? This will only affect players in the test edition.')) return;
        
        try {
            const statusElement = document.querySelector('#reset-status');
            if (statusElement) {
                statusElement.textContent = 'Resetting test players...';
                statusElement.style.color = '#007bff';
            }
            
            const usersSnapshot = await this.db.collection('users').get();
            const batch = this.db.batch();
            let resetCount = 0;
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                // Only reset players in test edition
                if (userData.status === 'active' && userData.edition === 'test') {
                    batch.update(doc.ref, {
                        lives: 2,
                        lastUpdated: new Date()
                    });
                    resetCount++;
                }
            });
            
            await batch.commit();
            
            if (statusElement) {
                statusElement.textContent = `✅ Reset ${resetCount} test edition players to 2 lives successfully!`;
                statusElement.style.color = '#28a745';
            } else {
                alert(`✅ Reset ${resetCount} test edition players to 2 lives successfully!`);
            }
            
            console.log(`✅ Reset ${resetCount} test edition players to 2 lives`);
            
        } catch (error) {
            console.error('Error resetting test player lives:', error);
            const statusElement = document.querySelector('#reset-status');
            if (statusElement) {
                statusElement.textContent = `❌ Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
            } else {
                alert('Error resetting test player lives: ' + error.message);
            }
        }
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 AdminManager cleanup started');
        
        // Cleanup all modules
        this.userManagement.cleanup();
        this.teamOperations.cleanup();
        this.scheduling.cleanup();
        this.audit.cleanup();
        
        console.log('🧹 AdminManager cleanup completed');
    }
}
