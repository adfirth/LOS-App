// Database Module
// Handles all database operations, user management, settings management, and real-time updates

class DatabaseManager {
    constructor() {
        this.db = null;
        this.databaseInitialized = false;
        this.adminSessionMonitoring = null;
        this.adminTokenRefresh = null;
        this.realTimeScoreUpdates = null;
        this.enhancedVidiprinter = null;
        this.deadlineChecker = null;
    }

    // Initialize database manager
    initializeDatabaseManager() {
        if (this.databaseInitialized) {
            console.log('Database manager already initialized, skipping...');
            return;
        }
        
        console.log('Initializing database manager...');
        this.databaseInitialized = true;
        
        this.initializeDatabase();
        this.setupEventListeners();
    }

    // Initialize database reference
    initializeDatabase() {
        if (window.db) {
            this.db = window.db;
            console.log('Database reference initialized');
        } else {
            console.warn('Database not available yet, retrying in 100ms');
            setTimeout(() => this.initializeDatabase(), 100);
        }
    }

    // Check and initialize database when Firebase becomes available
    checkAndInitializeDatabase() {
        if (window.db && !this.db) {
            this.db = window.db;
            console.log('Database reference initialized in checkAndInitializeDatabase');
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Initialize database when DOM is ready
        document.addEventListener('DOMContentLoaded', () => this.initializeDatabase());
        
        // Set up periodic database check for admin page
        if (window.location.pathname.endsWith('admin.html')) {
            setInterval(() => this.checkAndInitializeDatabase(), 100);
        }
    }

    // Database Operations - User Management
    async getUserDocument(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            return doc;
        } catch (error) {
            console.error('Error getting user document:', error);
            throw error;
        }
    }

    async updateUserDocument(userId, updateData) {
        try {
            await this.db.collection('users').doc(userId).update(updateData);
            console.log('User document updated successfully');
        } catch (error) {
            console.error('Error updating user document:', error);
            throw error;
        }
    }

    async saveEditionPreference(edition, userId) {
        try {
            await this.db.collection('users').doc(userId).update({
                defaultEdition: edition,
                lastUpdated: new Date()
            });
            console.log('Edition preference saved successfully');
        } catch (error) {
            console.error('Error saving edition preference:', error);
            throw error;
        }
    }

    async saveUserDefaultEdition(userId) {
        try {
            await this.db.collection('users').doc(userId).update({
                defaultEdition: window.currentActiveEdition,
                lastUpdated: new Date()
            });
            console.log('User default edition saved successfully');
        } catch (error) {
            console.error('Error saving user default edition:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            return usersSnapshot;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    async getUsersByEdition(edition) {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const users = [];
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.registrations && userData.registrations[edition]) {
                    users.push({ id: doc.id, ...userData });
                }
            });
            return users;
        } catch (error) {
            console.error('Error getting users by edition:', error);
            throw error;
        }
    }

    async getUsersOrderedByName(limit = 20) {
        try {
            const usersSnapshot = await this.db.collection('users').orderBy('firstName').limit(limit).get();
            return usersSnapshot;
        } catch (error) {
            console.error('Error getting users ordered by name:', error);
            throw error;
        }
    }

    // Database Operations - Settings Management
    async getSettingsDocument(docId = 'currentCompetition') {
        try {
            const settingsDoc = await this.db.collection('settings').doc(docId).get();
            return settingsDoc;
        } catch (error) {
            console.error('Error getting settings document:', error);
            throw error;
        }
    }

    async setSettingsDocument(docId, settings) {
        try {
            await this.db.collection('settings').doc(docId).set(settings);
            console.log('Settings document set successfully');
        } catch (error) {
            console.error('Error setting settings document:', error);
            throw error;
        }
    }

    async getRegistrationSettings(edition) {
        try {
            const settingsDoc = await this.db.collection('settings').doc(`registration_edition_${edition}`).get();
            return settingsDoc;
        } catch (error) {
            console.error('Error getting registration settings:', error);
            throw error;
        }
    }

    async setRegistrationSettings(edition, settings) {
        try {
            await this.db.collection('settings').doc(`registration_edition_${edition}`).set(settings);
            console.log('Registration settings saved successfully');
        } catch (error) {
            console.error('Error saving registration settings:', error);
            throw error;
        }
    }

    // Database Operations - Fixtures & Scores
    async getFixturesDocument(gameweekKey) {
        try {
            const fixturesDoc = await this.db.collection('fixtures').doc(gameweekKey).get();
            return fixturesDoc;
        } catch (error) {
            console.error('Error getting fixtures document:', error);
            throw error;
        }
    }

    async updateFixturesDocument(gameweekKey, fixturesData) {
        try {
            await this.db.collection('fixtures').doc(gameweekKey).set(fixturesData);
            console.log('Fixtures document updated successfully');
        } catch (error) {
            console.error('Error updating fixtures document:', error);
            throw error;
        }
    }

    async deleteFixturesDocument(gameweekKey) {
        try {
            await this.db.collection('fixtures').doc(gameweekKey).delete();
            console.log('Fixtures document deleted successfully');
        } catch (error) {
            console.error('Error deleting fixtures document:', error);
            throw error;
        }
    }

    // Database Operations - Picks Management
    async updateUserPick(userId, gameweekKey, pickData) {
        try {
            const updateData = {};
            updateData[`picks.${gameweekKey}`] = pickData;
            
            await this.db.collection('users').doc(userId).update(updateData);
            console.log('User pick updated successfully');
        } catch (error) {
            console.error('Error updating user pick:', error);
            throw error;
        }
    }

    async removeUserPick(userId, gameweekKey) {
        try {
            const updateData = {};
            updateData[`picks.${gameweekKey}`] = this.db.FieldValue.delete();
            
            await this.db.collection('users').doc(userId).update(updateData);
            console.log('User pick removed successfully');
        } catch (error) {
            console.error('Error removing user pick:', error);
            throw error;
        }
    }

    async getUserPicks(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                return userDoc.data().picks || {};
            }
            return {};
        } catch (error) {
            console.error('Error getting user picks:', error);
            throw error;
        }
    }

    // Database Operations - Registration Management
    async updateUserRegistration(userId, edition, registrationData) {
        try {
            const updateData = {};
            updateData[`registrations.${edition}`] = registrationData;
            
            await this.db.collection('users').doc(userId).update(updateData);
            console.log('User registration updated successfully');
        } catch (error) {
            console.error('Error updating user registration:', error);
            throw error;
        }
    }

    async removeUserRegistration(userId, edition) {
        try {
            const updateData = {};
            updateData[`registrations.${edition}`] = this.db.FieldValue.delete();
            
            await this.db.collection('users').doc(userId).update(updateData);
            console.log('User registration removed successfully');
        } catch (error) {
            console.error('Error removing user registration:', error);
            throw error;
        }
    }

    // Database Operations - Admin Management
    async checkAdminStatus(userId) {
        try {
            const adminDoc = await this.db.collection('users').doc(userId).get();
            if (adminDoc.exists && adminDoc.data().isAdmin === true) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            throw error;
        }
    }

    async updateUserStatus(userId, status, additionalData = {}) {
        try {
            const updateData = {
                status: status,
                lastUpdated: new Date(),
                ...additionalData
            };
            
            if (status === 'archived') {
                updateData.archivedDate = new Date();
            } else if (status === 'active') {
                updateData.unarchivedDate = new Date();
            }
            
            await this.db.collection('users').doc(userId).update(updateData);
            console.log('User status updated successfully');
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }

    async resetAllPlayerLives() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const batch = this.db.batch();
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.status === 'active') {
                    batch.update(doc.ref, {
                        lives: 2,
                        lastUpdated: new Date()
                    });
                }
            });
            
            await batch.commit();
            console.log('All player lives reset successfully');
        } catch (error) {
            console.error('Error resetting player lives:', error);
            throw error;
        }
    }

    // Database Operations - Batch Operations
    async batchUpdateUsers(updates) {
        try {
            const batch = this.db.batch();
            
            updates.forEach(update => {
                const userRef = this.db.collection('users').doc(update.userId);
                batch.update(userRef, update.data);
            });
            
            await batch.commit();
            console.log('Batch update completed successfully');
        } catch (error) {
            console.error('Error in batch update:', error);
            throw error;
        }
    }

    async batchDeleteUsers(userIds) {
        try {
            const batch = this.db.batch();
            
            userIds.forEach(userId => {
                const userRef = this.db.collection('users').doc(userId);
                batch.delete(userRef);
            });
            
            await batch.commit();
            console.log('Batch delete completed successfully');
        } catch (error) {
            console.error('Error in batch delete:', error);
            throw error;
        }
    }

    // Real-time Updates & Monitoring
    startRealTimeScoreUpdates(gameweek, callback) {
        try {
            if (this.realTimeScoreUpdates) {
                this.stopRealTimeScoreUpdates();
            }
            
            const gameweekKey = `gw${gameweek}`;
            this.realTimeScoreUpdates = this.db.collection('fixtures').doc(gameweekKey)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const fixtures = doc.data();
                        if (callback && typeof callback === 'function') {
                            callback(fixtures);
                        }
                    }
                }, (error) => {
                    console.error('Real-time score updates error:', error);
                });
            
            console.log('Real-time score updates started for gameweek:', gameweek);
        } catch (error) {
            console.error('Error starting real-time score updates:', error);
        }
    }

    stopRealTimeScoreUpdates() {
        try {
            if (this.realTimeScoreUpdates) {
                this.realTimeScoreUpdates();
                this.realTimeScoreUpdates = null;
                console.log('Real-time score updates stopped');
            }
        } catch (error) {
            console.error('Error stopping real-time score updates:', error);
        }
    }

    startEnhancedVidiprinter(callback) {
        try {
            if (this.enhancedVidiprinter) {
                this.stopEnhancedVidiprinter();
            }
            
            this.enhancedVidiprinter = this.db.collection('vidiprinter')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .onSnapshot((snapshot) => {
                    const events = [];
                    snapshot.forEach(doc => {
                        events.push({ id: doc.id, ...doc.data() });
                    });
                    
                    if (callback && typeof callback === 'function') {
                        callback(events);
                    }
                }, (error) => {
                    console.error('Enhanced vidiprinter error:', error);
                });
            
            console.log('Enhanced vidiprinter started');
        } catch (error) {
            console.error('Error starting enhanced vidiprinter:', error);
        }
    }

    stopEnhancedVidiprinter() {
        try {
            if (this.enhancedVidiprinter) {
                this.enhancedVidiprinter();
                this.enhancedVidiprinter = null;
                console.log('Enhanced vidiprinter stopped');
            }
        } catch (error) {
            console.error('Error stopping enhanced vidiprinter:', error);
        }
    }

    startDeadlineChecker(callback) {
        try {
            if (this.deadlineChecker) {
                clearInterval(this.deadlineChecker);
            }
            
            this.deadlineChecker = setInterval(() => {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 60000); // Check every minute
            
            console.log('Deadline checker started');
        } catch (error) {
            console.error('Error starting deadline checker:', error);
        }
    }

    stopDeadlineChecker() {
        try {
            if (this.deadlineChecker) {
                clearInterval(this.deadlineChecker);
                this.deadlineChecker = null;
                console.log('Deadline checker stopped');
            }
        } catch (error) {
            console.error('Error stopping deadline checker:', error);
        }
    }

    // Admin Session Management
    startAdminSessionMonitoring(userId, timeoutCallback, warningCallback) {
        try {
            if (this.adminSessionMonitoring) {
                this.stopAdminSessionMonitoring();
            }
            
            let lastActivity = Date.now();
            const sessionTimeout = 30 * 60 * 1000; // 30 minutes
            const warningTime = 25 * 60 * 1000; // 25 minutes
            
            const updateActivity = () => {
                lastActivity = Date.now();
            };
            
            // Update activity on user interaction
            document.addEventListener('click', updateActivity);
            document.addEventListener('keypress', updateActivity);
            document.addEventListener('scroll', updateActivity);
            
            this.adminSessionMonitoring = setInterval(() => {
                const timeSinceActivity = Date.now() - lastActivity;
                
                if (timeSinceActivity >= sessionTimeout) {
                    this.stopAdminSessionMonitoring();
                    if (timeoutCallback && typeof timeoutCallback === 'function') {
                        timeoutCallback();
                    }
                } else if (timeSinceActivity >= warningTime && timeSinceActivity < sessionTimeout) {
                    if (warningCallback && typeof warningCallback === 'function') {
                        warningCallback();
                    }
                }
            }, 1000); // Check every second
            
            console.log('Admin session monitoring started');
        } catch (error) {
            console.error('Error starting admin session monitoring:', error);
        }
    }

    stopAdminSessionMonitoring() {
        try {
            if (this.adminSessionMonitoring) {
                clearInterval(this.adminSessionMonitoring);
                this.adminSessionMonitoring = null;
                
                // Remove event listeners
                document.removeEventListener('click', this.updateActivity);
                document.removeEventListener('keypress', this.updateActivity);
                document.removeEventListener('scroll', this.updateActivity);
                
                console.log('Admin session monitoring stopped');
            }
        } catch (error) {
            console.error('Error stopping admin session monitoring:', error);
        }
    }

    startAdminTokenRefresh(user, refreshCallback) {
        try {
            if (this.adminTokenRefresh) {
                this.stopAdminTokenRefresh();
            }
            
            this.adminTokenRefresh = setInterval(async () => {
                try {
                    await user.getIdToken(true);
                    if (refreshCallback && typeof refreshCallback === 'function') {
                        refreshCallback();
                    }
                } catch (error) {
                    console.error('Error refreshing admin token:', error);
                }
            }, 10 * 60 * 1000); // Refresh every 10 minutes
            
            console.log('Admin token refresh started');
        } catch (error) {
            console.error('Error starting admin token refresh:', error);
        }
    }

    stopAdminTokenRefresh() {
        try {
            if (this.adminTokenRefresh) {
                clearInterval(this.adminTokenRefresh);
                this.adminTokenRefresh = null;
                console.log('Admin token refresh stopped');
            }
        } catch (error) {
            console.error('Error stopping admin token refresh:', error);
        }
    }

    // Utility Functions
    getDatabaseReference() {
        return this.db;
    }

    isDatabaseInitialized() {
        return this.db !== null;
    }

    // Cleanup method
    cleanup() {
        this.stopRealTimeScoreUpdates();
        this.stopEnhancedVidiprinter();
        this.stopDeadlineChecker();
        this.stopAdminSessionMonitoring();
        this.stopAdminTokenRefresh();
        
        this.databaseInitialized = false;
        console.log('Database Manager cleanup completed');
    }
}

// Export the DatabaseManager class
export default DatabaseManager;
