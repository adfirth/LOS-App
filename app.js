// Main Application Entry Point
// This file orchestrates the application and imports modular components

import AuthManager from './modules/auth.js';
import RegistrationManager from './modules/registration.js';
import FixturesManager from './modules/fixtures.js';
import ScoresManager from './modules/scores.js';
import UIManager from './modules/ui.js';
import GameLogicManager from './modules/gameLogic.js';
import MobileNavigationManager from './modules/mobileNavigation.js';
import AdminManagementManager from './modules/adminManagement.js';
import DatabaseManager from './modules/database.js'; // New Database Module import
import ApiManager from './modules/api.js'; // New API Module import
import UtilitiesManager from './modules/utilities.js'; // New Utilities Module import

// Global application state
class App {
    constructor() {
        this.db = null;
        this.auth = null;
        this.authManager = null;
        this.registrationManager = null;
        this.fixturesManager = null;
        this.scoresManager = null;
        this.uiManager = null;
        this.gameLogicManager = null;
        this.mobileNavigationManager = null;
        this.adminManagementManager = null;
        this.databaseManager = null; // New Database Manager
        this.apiManager = null; // New API Manager
        this.utilitiesManager = null; // New Utilities Manager
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
        this.initialized = false;
    }

    // Initialize the application
    async initialize() {
        try {
            console.log('🚀 Initializing LOS App...');
            
            // Wait for Firebase to be available
            await this.waitForFirebase();
            
                                                                   // Initialize managers
                        this.authManager = new AuthManager();
                        this.registrationManager = new RegistrationManager(this.db);
                        this.fixturesManager = new FixturesManager(this.db);
                        this.scoresManager = new ScoresManager(this.db);
                        this.uiManager = new UIManager(this.db);
                        this.gameLogicManager = new GameLogicManager(this.db);
                        this.mobileNavigationManager = new MobileNavigationManager(this.db);
                        this.adminManagementManager = new AdminManagementManager(this.db);
                        this.databaseManager = new DatabaseManager(); // Initialize Database Manager
                        this.apiManager = new ApiManager(); // Initialize API Manager
                        this.utilitiesManager = new UtilitiesManager(); // Initialize Utilities Manager
                        
                        // Initialize auth manager
                        await this.authManager.initialize(this.db, this.auth);
                        
                        // Initialize registration manager
                        this.registrationManager.initializeRegistrationManagement();
                        
                        // Initialize fixtures manager
                        this.fixturesManager.initializeFixtureManagement();
                        
                        // Initialize scores manager
                        this.scoresManager.initializeScoresManagement();
                        
                        // Initialize UI manager
                        this.uiManager.initializeUIManagement();
                        
                        // Initialize game logic manager
                        this.gameLogicManager.initializeGameLogicManagement();
                        
                        // Initialize mobile navigation manager
                        this.mobileNavigationManager.initializeMobileNavigationManagement();
                        
                        // Initialize admin management manager
                        this.adminManagementManager.initializeAdminManagement();
                        
                        // Initialize database manager
                        this.databaseManager.initializeDatabaseManager();
                        
                        // Initialize API manager
                        this.apiManager.initializeApiManager();
                        
                        // Initialize utilities manager
                        this.utilitiesManager.initializeUtilitiesManager();
            
            // Set up global references for backward compatibility
            this.setupGlobalReferences();
            
            // Load competition settings
            await this.loadCompetitionSettings();
            
            // Initialize page-specific functionality
            this.initializePageSpecificFeatures();
            
            this.initialized = true;
            console.log('✅ LOS App initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing LOS App:', error);
        }
    }

    // Wait for Firebase to be available
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.db && window.auth) {
                    this.db = window.db;
                    this.auth = window.auth;
                    console.log('✅ Firebase references available');
                    resolve();
                } else {
                    console.log('⏳ Waiting for Firebase...');
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

                               // Set up global references for backward compatibility
                setupGlobalReferences() {
                    // Global managers
                    window.authManager = this.authManager;
                    window.registrationManager = this.registrationManager;
                    window.fixturesManager = this.fixturesManager;
                    window.scoresManager = this.scoresManager;
                    window.uiManager = this.uiManager;
                    window.gameLogicManager = this.gameLogicManager;
                    window.mobileNavigationManager = this.mobileNavigationManager;
                                window.adminManagementManager = this.adminManagementManager;
            window.databaseManager = this.databaseManager; // Expose Database Manager
            window.apiManager = this.apiManager; // Expose API Manager
            window.utilitiesManager = this.utilitiesManager; // Expose Utilities Manager
        
        // Global app instance
        window.app = this;
        
        // Global variables
        window.currentActiveEdition = this.currentActiveEdition;
        window.currentActiveGameweek = this.currentActiveGameweek;
        
        // Global functions for backward compatibility
        this.setupGlobalFunctions();
        
        console.log('🔗 Global references set up for backward compatibility');
    }

    // Set up global functions for backward compatibility
    setupGlobalFunctions() {
        // Fixtures-related functions
        window.initializeFixtureManagement = () => this.fixturesManager.initializeFixtureManagement();
        window.addFixtureRow = () => this.fixturesManager.addFixtureRow();
        window.removeFixtureRow = (button) => this.fixturesManager.removeFixtureRow(button);
        window.saveFixtures = () => this.fixturesManager.saveFixtures();
        window.checkFixtures = () => this.fixturesManager.checkFixtures();
        window.loadFixturesForGameweek = () => this.fixturesManager.loadFixturesForGameweek();
        window.loadFixturesForDeadline = (gameweek, userData, userId) => this.fixturesManager.loadFixturesForDeadline(gameweek, userData, userId);
        window.loadMobileFixturesForDeadline = (gameweek, userData, userId) => this.fixturesManager.loadMobileFixturesForDeadline(gameweek, userData, userId);
        window.switchToFixturesTab = () => this.fixturesManager.switchToFixturesTab();
        window.renderFixturesDisplay = (fixtures, userData, gameweek, userId) => this.fixturesManager.renderFixturesDisplay(fixtures, userData, gameweek, userId);
        window.renderMobileFixturesDisplay = (fixtures, userData, gameweek, userId) => this.fixturesManager.renderMobileFixturesDisplay(fixtures, userData, gameweek, userId);
        window.renderAsItStandsStandings = (players, fixtures, gameweek, edition, platform) => this.fixturesManager.renderAsItStandsStandings(players, fixtures, gameweek, edition, platform);
        window.loadCurrentGameweekFixtures = () => this.fixturesManager.loadCurrentGameweekFixtures();
        window.saveFootballWebPagesSettings = () => this.fixturesManager.saveFootballWebPagesSettings();
        
        // Scores-related functions
        window.loadScoresForGameweek = () => this.scoresManager.loadScoresForGameweek();
        window.saveScores = () => this.scoresManager.saveScores();
        window.renderPlayerScores = (fixtures, gameweek) => this.scoresManager.renderPlayerScores(fixtures, gameweek);
        window.renderDesktopPlayerScores = (fixtures, gameweek) => this.scoresManager.renderDesktopPlayerScores(fixtures, gameweek);
        window.renderMobilePlayerScores = (fixtures, gameweek) => this.scoresManager.renderMobilePlayerScores(fixtures, gameweek);
        window.checkPickStillValid = (pick, fixtures) => this.scoresManager.checkPickStillValid(pick, fixtures);
        window.calculatePickResult = (pick, fixtures) => this.scoresManager.calculatePickResult(pick, fixtures);
        window.processResults = (gameweek, fixtures) => this.scoresManager.processResults(gameweek, fixtures);
        window.startAutoScoreUpdates = (gameweek) => this.scoresManager.startAutoScoreUpdates(gameweek);
        window.stopAutoScoreUpdates = () => this.scoresManager.stopAutoScoreUpdates();
        window.startRealTimeScoreUpdates = (gameweek) => this.scoresManager.startRealTimeScoreUpdates(gameweek);
        window.stopRealTimeScoreUpdates = () => this.scoresManager.stopRealTimeScoreUpdates();
        window.importScoresFromFootballWebPages = (gameweek) => this.scoresManager.importScoresFromFootballWebPages(gameweek);
        window.importScoresFromFile = (file, gameweek) => this.scoresManager.importScoresFromFile(file, gameweek);
        
        // UI-related functions
        window.showModal = (content) => this.uiManager.showModal(content);
        window.closeUserDetailsModal = () => this.uiManager.closeUserDetailsModal();
        window.initializeDesktopTabs = () => this.uiManager.initializeDesktopTabs();
        window.renderDashboard = (user) => this.uiManager.renderDashboard(user);
        window.initializeTestimonialModal = () => this.uiManager.initializeTestimonialModal();
        window.initializeRegistrationWindowDisplay = () => this.uiManager.initializeRegistrationWindowDisplay();
        window.updateRegistrationWindowDisplay = () => this.uiManager.updateRegistrationWindowDisplay();
        window.showRegistrationCountdown = (endDate) => this.uiManager.showRegistrationCountdown(endDate);
        window.showNextRegistrationCountdown = (startDate) => this.uiManager.showNextRegistrationCountdown(startDate);
        window.hideRegistrationCountdowns = () => this.uiManager.hideRegistrationCountdowns();
        window.showRegisterButton = (show) => this.uiManager.showRegisterButton(show);
        window.initializeVidiprinter = () => this.uiManager.initializeVidiprinter();
        window.startVidiprinter = () => this.uiManager.startVidiprinter();
        window.stopVidiprinter = () => this.uiManager.stopVidiprinter();
        window.clearVidiprinterFeed = () => this.uiManager.clearVidiprinterFeed();
        window.toggleAutoScroll = () => this.uiManager.toggleAutoScroll();
        
        // Game Logic-related functions
        window.generatePickHistory = (picks) => this.gameLogicManager.generatePickHistory(picks);
        window.renderPickHistory = (picks, container, userId, userData) => this.gameLogicManager.renderPickHistory(picks, container, userId, userData);
        window.initializeGameweekNavigation = (currentGameWeek, userData, userId) => this.gameLogicManager.initializeGameweekNavigation(currentGameWeek, userData, userId);
        window.updateNavigationButtons = (currentGameWeek, prevButton, nextButton) => this.gameLogicManager.updateNavigationButtons(currentGameWeek, prevButton, nextButton);
        window.updateActiveTab = (currentGameWeek, gameweekTabs) => this.gameLogicManager.updateActiveTab(currentGameWeek, gameweekTabs);
        window.updateTabStates = (gameweekTabs) => this.gameLogicManager.updateTabStates(gameweekTabs);
        window.navigateGameweek = (currentGameWeek, direction, userData, userId) => this.gameLogicManager.navigateGameweek(currentGameWeek, direction, userData, userId);
        window.navigateToGameweek = (gameweek, userData, userId) => this.gameLogicManager.navigateToGameweek(gameweek, userData, userId);
        window.removePick = (userId, gameweekKey) => this.gameLogicManager.removePick(userId, gameweekKey);
        window.makePick = (userId, gameweek) => this.gameLogicManager.makePick(userId, gameweek);
        window.selectTeamAsTempPick = (teamName, gameweek, userId) => this.gameLogicManager.selectTeamAsTempPick(teamName, gameweek, userId);
        window.refreshDisplayAfterPickUpdate = (gameweek, userId) => this.gameLogicManager.refreshDisplayAfterPickUpdate(gameweek, userId);
        window.saveTempPick = (gameweek, userId) => this.gameLogicManager.saveTempPick(gameweek, userId);
        window.releaseFuturePick = (teamName, gameweek, userId) => this.gameLogicManager.releaseFuturePick(teamName, gameweek, userId);
        window.selectTeamAsPick = (teamName, gameweek, userId) => this.gameLogicManager.selectTeamAsPick(teamName, gameweek, userId);
        window.checkAndAssignAutoPicks = (userData, currentGameWeek, userId) => this.gameLogicManager.checkAndAssignAutoPicks(userData, currentGameWeek, userId);
        window.assignAutoPick = (userData, gameweek, userId) => this.gameLogicManager.assignAutoPick(userData, gameweek, userId);
        window.getDeadlineDateForGameweek = (gameweek) => this.gameLogicManager.getDeadlineDateForGameweek(gameweek);
        window.formatDeadlineDate = (date) => this.gameLogicManager.formatDeadlineDate(date);
        window.getOrdinalSuffix = (day) => this.gameLogicManager.getOrdinalSuffix(day);
        window.checkDeadlineForGameweek = (gameweek, edition) => this.gameLogicManager.checkDeadlineForGameweek(gameweek, edition);
        window.startDeadlineChecker = () => this.gameLogicManager.startDeadlineChecker();
        window.batchCheckDeadlines = (gameweeks, edition) => this.gameLogicManager.batchCheckDeadlines(gameweeks, edition);
        window.getTeamStatusSimple = (teamName, userData, currentGameWeek, userId) => this.gameLogicManager.getTeamStatusSimple(teamName, userData, currentGameWeek, userId);
        window.getTeamStatus = (teamName, userData, currentGameWeek, userId) => this.gameLogicManager.getTeamStatus(teamName, userData, currentGameWeek, userId);
        window.getUserEdition = (userData) => this.gameLogicManager.getUserEdition(userData);
        window.getUserRegisteredEditions = (userData) => this.gameLogicManager.getUserRegisteredEditions(userData);
        window.getActiveGameweek = () => this.gameLogicManager.getActiveGameweek();
        
        // Mobile Navigation-related functions
        window.initializeMobileTabs = () => this.mobileNavigationManager.initializeMobileTabs();
        window.loadMobileFixturesForDeadline = (gameweek, userData, userId) => this.mobileNavigationManager.loadMobileFixturesForDeadline(gameweek, userData, userId);
        window.renderMobileFixturesDisplay = (fixtures, userData, currentGameWeek, userId) => this.mobileNavigationManager.renderMobileFixturesDisplay(fixtures, userData, currentGameWeek, userId);
        window.updateMobilePickStatusHeader = (gameweek, userData, userId) => this.mobileNavigationManager.updateMobilePickStatusHeader(gameweek, userData, userId);
        window.initializeMobileGameweekNavigation = (currentGameWeek, userData, userId) => this.mobileNavigationManager.initializeMobileGameweekNavigation(currentGameWeek, userData, userId);
        window.updateMobileNavigationButtons = (currentGameWeek, prevButton, nextButton) => this.mobileNavigationManager.updateMobileNavigationButtons(currentGameWeek, prevButton, nextButton);
        window.updateMobileActiveTab = (currentGameWeek, gameweekTabs) => this.mobileNavigationManager.updateMobileActiveTab(currentGameWeek, gameweekTabs);
        window.updateMobileTabStates = (gameweekTabs) => this.mobileNavigationManager.updateMobileTabStates(gameweekTabs);
        window.navigateMobileGameweek = (currentGameWeek, direction, userData, userId) => this.mobileNavigationManager.navigateMobileGameweek(currentGameWeek, direction, userData, userId);
        window.navigateToMobileGameweek = (gameweek, userData, userId) => this.mobileNavigationManager.navigateToMobileGameweek(gameweek, userData, userId);
        window.renderMobilePlayerScores = (fixtures, gameweek) => this.mobileNavigationManager.renderMobilePlayerScores(fixtures, gameweek);
        window.toggleTestimonials = () => this.mobileNavigationManager.toggleTestimonials();
        window.switchToFixturesTab = () => this.mobileNavigationManager.switchToFixturesTab();
        
        // Admin Management-related functions
        window.buildAdminDashboard = (settings) => this.adminManagementManager.buildAdminDashboard(settings);
        window.showPlayerManagement = (type) => this.adminManagementManager.showPlayerManagement(type);
        window.closePlayerManagement = () => this.adminManagementManager.closePlayerManagement();
        window.closePlayerEdit = () => this.adminManagementManager.closePlayerEdit();
        window.loadPlayersForManagement = () => this.adminManagementManager.loadPlayersForManagement();
        window.displayPlayers = (players) => this.adminManagementManager.displayPlayers(players);
        window.searchPlayers = () => this.adminManagementManager.searchPlayers();
        window.filterPlayers = () => this.adminManagementManager.filterPlayers();
        window.editPlayer = (playerId) => this.adminManagementManager.editPlayer(playerId);
        window.savePlayerEdit = (event) => this.adminManagementManager.savePlayerEdit(event);
        window.archivePlayer = (playerId) => this.adminManagementManager.archivePlayer(playerId);
        window.unarchivePlayer = (playerId) => this.adminManagementManager.unarchivePlayer(playerId);
        window.addToTestWeeks = (playerId) => this.adminManagementManager.addToTestWeeks(playerId);
        window.deletePlayer = (playerId) => this.adminManagementManager.deletePlayer(playerId);
        window.resetAllPlayerLives = () => this.adminManagementManager.resetAllPlayerLives();
        window.generateTestScores = () => this.adminManagementManager.generateTestScores();
        window.initializeEnhancedVidiprinter = () => this.adminManagementManager.initializeEnhancedVidiprinter();
        window.startEnhancedVidiprinter = () => this.adminManagementManager.startEnhancedVidiprinter();
        window.stopEnhancedVidiprinter = () => this.adminManagementManager.stopEnhancedVidiprinter();
        window.clearEnhancedVidiprinterFeed = () => this.adminManagementManager.clearEnhancedVidiprinterFeed();
        
        // Database-related functions
        window.initializeDatabase = () => this.databaseManager.initializeDatabase();
        window.checkAndInitializeDatabase = () => this.databaseManager.checkAndInitializeDatabase();
        window.getUserDocument = (userId) => this.databaseManager.getUserDocument(userId);
        window.updateUserDocument = (userId, updateData) => this.databaseManager.updateUserDocument(userId, updateData);
        window.saveEditionPreference = (edition, userId) => this.databaseManager.saveEditionPreference(edition, userId);
        window.saveUserDefaultEdition = (userId) => this.databaseManager.saveUserDefaultEdition(userId);
        window.getAllUsers = () => this.databaseManager.getAllUsers();
        window.getUsersByEdition = (edition) => this.databaseManager.getUsersByEdition(edition);
        window.getUsersOrderedByName = (limit) => this.databaseManager.getUsersOrderedByName(limit);
        window.getSettingsDocument = (docId) => this.databaseManager.getSettingsDocument(docId);
        window.setSettingsDocument = (docId, settings) => this.databaseManager.setSettingsDocument(docId, settings);
        window.getRegistrationSettings = (edition) => this.databaseManager.getRegistrationSettings(edition);
        window.setRegistrationSettings = (edition, settings) => this.databaseManager.setRegistrationSettings(edition, settings);
        window.getFixturesDocument = (gameweekKey) => this.databaseManager.getFixturesDocument(gameweekKey);
        window.updateFixturesDocument = (gameweekKey, fixturesData) => this.databaseManager.updateFixturesDocument(gameweekKey, fixturesData);
        window.deleteFixturesDocument = (gameweekKey) => this.databaseManager.deleteFixturesDocument(gameweekKey);
        window.updateUserPick = (userId, gameweekKey, pickData) => this.databaseManager.updateUserPick(userId, gameweekKey, pickData);
        window.removeUserPick = (userId, gameweekKey) => this.databaseManager.removeUserPick(userId, gameweekKey);
        window.getUserPicks = (userId) => this.databaseManager.getUserPicks(userId);
        window.updateUserRegistration = (userId, edition, registrationData) => this.databaseManager.updateUserRegistration(userId, edition, registrationData);
        window.removeUserRegistration = (userId, edition) => this.databaseManager.removeUserRegistration(userId, edition);
        window.checkAdminStatus = (userId) => this.databaseManager.checkAdminStatus(userId);
        window.updateUserStatus = (userId, status, additionalData) => this.databaseManager.updateUserStatus(userId, status, additionalData);
        window.resetAllPlayerLives = () => this.databaseManager.resetAllPlayerLives();
        window.batchUpdateUsers = (updates) => this.databaseManager.batchUpdateUsers(updates);
        window.batchDeleteUsers = (userIds) => this.databaseManager.batchDeleteUsers(userIds);
        window.startRealTimeScoreUpdates = (gameweek, callback) => this.databaseManager.startRealTimeScoreUpdates(gameweek, callback);
        window.stopRealTimeScoreUpdates = () => this.databaseManager.stopRealTimeScoreUpdates();
        window.startEnhancedVidiprinter = (callback) => this.databaseManager.startEnhancedVidiprinter(callback);
        window.stopEnhancedVidiprinter = () => this.databaseManager.stopEnhancedVidiprinter();
        window.startDeadlineChecker = (callback) => this.databaseManager.startDeadlineChecker(callback);
        window.stopDeadlineChecker = () => this.databaseManager.stopDeadlineChecker();
        window.startAdminSessionMonitoring = (userId, timeoutCallback, warningCallback) => this.databaseManager.startAdminSessionMonitoring(userId, timeoutCallback, warningCallback);
        window.stopAdminSessionMonitoring = () => this.databaseManager.stopAdminSessionMonitoring();
        window.startAdminTokenRefresh = (user, refreshCallback) => this.databaseManager.startAdminTokenRefresh(user, refreshCallback);
        window.stopAdminTokenRefresh = () => this.databaseManager.stopAdminTokenRefresh();
        window.getDatabaseReference = () => this.databaseManager.getDatabaseReference();
        window.isDatabaseInitialized = () => this.databaseManager.isDatabaseInitialized();
        
        // API-related functions
        window.initializeFootballWebPagesAPI = () => this.apiManager.initializeFootballWebPagesAPI();
        window.testApiConnection = () => this.apiManager.testApiConnection();
        window.checkApiKeyStatus = () => this.apiManager.checkApiKeyStatus();
        window.fetchAvailableMatchdays = (league, season) => this.apiManager.fetchAvailableMatchdays(league, season);
        window.fetchSingleFixtures = (league, season, matchday) => this.apiManager.fetchSingleFixtures(league, season, matchday);
        window.fetchSingleScores = (league, season, matchday) => this.apiManager.fetchSingleScores(league, season, matchday);
        window.fetchDateRangeFixtures = (league, season, startDate, endDate) => this.apiManager.fetchDateRangeFixtures(league, season, startDate, endDate);
        window.fetchAllFixtures = (league, season) => this.apiManager.fetchAllFixtures(league, season);
        window.fetchFixturesFromFootballWebPages = (league, season, matchday, startDate, endDate) => this.apiManager.fetchFixturesFromFootballWebPages(league, season, matchday, startDate, endDate);
        window.fetchScoresFromFootballWebPages = (league, season, matchday, existingFixtures) => this.apiManager.fetchScoresFromFootballWebPages(league, season, matchday, existingFixtures);
        // Note: TheSportsDB API functions removed - using Football Web Pages API instead
        window.fetchEnhancedVidiprinterData = (competition, team, date) => this.apiManager.fetchEnhancedVidiprinterData(competition, team, date);
        window.fetchVidiprinterData = (competition) => this.apiManager.fetchVidiprinterData(competition);
        window.fetchScoresViaNetlify = (league, season, matchday, fixtures, startDate, endDate) => this.apiManager.fetchScoresViaNetlify(league, season, matchday, fixtures, startDate, endDate);
        window.selectAllFixtures = () => this.apiManager.selectAllFixtures();
        window.deselectAllFixtures = () => this.apiManager.deselectAllFixtures();
        window.importSelectedFixtures = () => this.apiManager.importSelectedFixtures();
        window.importFixturesToCurrentGameweek = (fixtures) => this.apiManager.importFixturesToCurrentGameweek(fixtures);
        
        // Utilities-related functions
        window.formatDeadlineDate = (date) => this.utilitiesManager.formatDeadlineDate(date);
        window.getOrdinalSuffix = (day) => this.utilitiesManager.getOrdinalSuffix(day);
        window.getDeadlineDateForGameweek = (gameweek) => this.utilitiesManager.getDeadlineDateForGameweek(gameweek);
        window.getUserEdition = (userData) => this.utilitiesManager.getUserEdition(userData);
        window.getUserRegisteredEditions = (userData) => this.utilitiesManager.getUserRegisteredEditions(userData);
        window.getActiveGameweek = () => this.utilitiesManager.getActiveGameweek();
        window.setActiveGameweek = (gameweek) => this.utilitiesManager.setActiveGameweek(gameweek);
        window.setActiveEdition = (edition) => this.utilitiesManager.setActiveEdition(edition);
        window.getTeamStatusSimple = (teamName, userData, currentGameWeek, userId) => this.utilitiesManager.getTeamStatusSimple(teamName, userData, currentGameWeek, userId);
        window.getTeamStatus = (teamName, userData, currentGameWeek, userId) => this.utilitiesManager.getTeamStatus(teamName, userData, currentGameWeek, userId);
        window.getStatusDisplay = (status) => this.utilitiesManager.getStatusDisplay(status);
        window.getMockFixtures = (league, gameweek) => this.utilitiesManager.getMockFixtures(league, gameweek);
        window.getMockScores = (existingFixtures) => this.utilitiesManager.getMockScores(existingFixtures);
        window.getMockRounds = () => this.utilitiesManager.getMockRounds();
        window.getMockMatchdays = () => this.utilitiesManager.getMockMatchdays();
        window.calculateTeamNameSimilarity = (name1, name2) => this.utilitiesManager.calculateTeamNameSimilarity(name1, name2);
        window.normalizeTeamName = (teamName) => this.utilitiesManager.normalizeTeamName(teamName);
        window.groupFixturesByDate = (fixtures) => this.utilitiesManager.groupFixturesByDate(fixtures);
        window.showRegistrationClosed = (message) => this.utilitiesManager.showRegistrationClosed(message);
        window.showRegistrationCountdown = (endDate) => this.utilitiesManager.showRegistrationCountdown(endDate);
        window.showNextRegistrationCountdown = (startDate) => this.utilitiesManager.showNextRegistrationCountdown(startDate);
        window.hideRegistrationCountdowns = () => this.utilitiesManager.hideRegistrationCountdowns();
        window.showRegisterButton = (show) => this.utilitiesManager.showRegisterButton(show);
        window.resetAsItStandsInitialization = () => this.utilitiesManager.resetAsItStandsInitialization();
        window.diagnoseAsItStandsElements = () => this.utilitiesManager.diagnoseAsItStandsElements();
        window.testAsItStandsManually = () => this.utilitiesManager.testAsItStandsManually();
        window.checkPickStillValid = (pick, fixtures) => this.utilitiesManager.checkPickStillValid(pick, fixtures);
        
        // Auth-related functions
        window.initializeAuthListener = () => this.authManager.initializeAuthListener();
        window.startAdminTokenRefresh = (user) => this.authManager.startAdminTokenRefresh(user);
        window.stopAdminTokenRefresh = () => this.authManager.stopAdminTokenRefresh();
        window.checkAdminStatusFromStorage = () => this.authManager.checkAdminStatusFromStorage();
        
        // CRITICAL: Expose initializeAdminPage in multiple ways to ensure it's available
        window.initializeAdminPage = () => {
            if (this.authManager && typeof this.authManager.initializeAdminPage === 'function') {
                return this.authManager.initializeAdminPage();
            } else {
                console.error('AuthManager not ready yet, retrying in 100ms');
                setTimeout(() => window.initializeAdminPage(), 100);
            }
        };
        
        // Also expose it directly in global scope for admin page compatibility
        window.initializeAdminPage = () => {
            if (this.authManager && typeof this.authManager.initializeAdminPage === 'function') {
                return this.authManager.initializeAdminPage();
            } else {
                console.error('AuthManager not ready yet, retrying in 100ms');
                setTimeout(() => window.initializeAdminPage(), 100);
            }
        };
        
        // CRITICAL: Make it available without window prefix for admin page compatibility
        window.initializeAdminPage = () => {
            if (this.authManager && typeof this.authManager.initializeAdminPage === 'function') {
                return this.authManager.initializeAdminPage();
            } else {
                console.error('AuthManager not ready yet, retrying in 100ms');
                setTimeout(() => window.initializeAdminPage(), 100);
            }
        };
        
        window.showAdminLoginForm = () => this.authManager.showAdminLoginForm();
        window.loadAdminPanelSettings = () => this.authManager.loadAdminPanelSettings();
        window.showSettingsError = (message) => this.authManager.showSettingsError(message);
        window.startAdminSessionMonitoring = () => this.authManager.startAdminSessionMonitoring();
        window.stopAdminSessionMonitoring = () => this.authManager.stopAdminSessionMonitoring();
        window.showSessionTimeoutWarning = () => this.authManager.showSessionTimeoutWarning();
        window.extendAdminSession = () => this.authManager.extendAdminSession();
        window.handleAdminSessionTimeout = () => this.authManager.handleAdminSessionTimeout();
        window.initializeAdminPageVisibilityHandling = () => this.authManager.initializeAdminPageVisibilityHandling();
        window.initializeAdminLoginHandlers = () => this.authManager.initializeAdminLoginHandlers();
        window.handleAdminLogin = (e) => this.authManager.handleAdminLogin(e);
        window.handleAdminLogout = () => this.authManager.handleAdminLogout();
        
        // Registration-related functions
        window.updateRegistrationPageEdition = () => this.registrationManager.updateRegistrationPageEdition();
        window.updateEditionDisplay = () => this.registrationManager.updateEditionDisplay();
        window.getUserEdition = (userData) => this.registrationManager.getUserEdition(userData);
        window.getUserRegisteredEditions = (userData) => this.registrationManager.getUserRegisteredEditions(userData);
        window.saveEditionPreference = (edition, userId) => this.registrationManager.saveEditionPreference(edition, userId);
        window.updateUserDefaultEdition = (userId, edition) => this.registrationManager.updateUserDefaultEdition(userId, edition);
        window.saveUserDefaultEdition = (userId) => this.registrationManager.saveUserDefaultEdition(userId);
        window.loadCurrentEditionForRegistration = () => this.registrationManager.loadCurrentEditionForRegistration();
        window.checkRegistrationWindow = (edition) => this.registrationManager.checkRegistrationWindow(edition);
        window.showRegistrationClosed = (message) => this.registrationManager.showRegistrationClosed(message);
        window.initializeRegistrationManagement = () => this.registrationManager.initializeRegistrationManagement();
        window.loadRegistrationSettings = () => this.registrationManager.loadRegistrationSettings();
        window.loadEditionRegistrationSettings = () => this.registrationManager.loadEditionRegistrationSettings();
        window.loadAllEditionsOverview = () => this.registrationManager.loadAllEditionsOverview();
        window.saveRegistrationSettings = () => this.registrationManager.saveRegistrationSettings();
        window.refreshRegistrationStats = () => this.registrationManager.refreshRegistrationStats();
        window.updateRegistrationList = () => this.registrationManager.updateRegistrationList();
        window.viewUserDetails = (userId) => this.registrationManager.viewUserDetails(userId);
        window.generateRegistrationHistory = (registrations) => this.registrationManager.generateRegistrationHistory(registrations);
        window.showModal = (content) => this.registrationManager.showModal(content);
        window.closeUserDetailsModal = () => this.registrationManager.closeUserDetailsModal();
        
        // Competition settings functions
        window.loadCompetitionSettings = () => this.loadCompetitionSettings();
        window.saveCompetitionSettings = () => this.saveCompetitionSettings();
        
        console.log('🔧 Global functions set up for backward compatibility');
        console.log('🔍 Debug: initializeAdminPage available?', typeof window.initializeAdminPage);
        console.log('🔍 Debug: window.initializeAdminPage =', window.initializeAdminPage);
        console.log('🔍 Debug: this.authManager =', this.authManager);
        console.log('🔍 Debug: this.authManager.initializeAdminPage =', this.authManager ? typeof this.authManager.initializeAdminPage : 'N/A');
        
        // CRITICAL: Ensure initializeAdminPage is available in global scope
        if (typeof window.initializeAdminPage === 'function') {
            // Make it available without window prefix for admin page compatibility
            window.initializeAdminPage = window.initializeAdminPage;
            console.log('✅ initializeAdminPage function is now available globally');
            
            // CRITICAL: Also expose it directly in global scope
            window.initializeAdminPage = window.initializeAdminPage;
            console.log('✅ initializeAdminPage function is now available in global scope');
        } else {
            console.error('❌ initializeAdminPage function is NOT available!');
        }
        
        // Final verification
        console.log('🔍 Final check - initializeAdminPage type:', typeof initializeAdminPage);
        console.log('🔍 Final check - window.initializeAdminPage type:', typeof window.initializeAdminPage);
        
        // CRITICAL: Force expose in global scope
        if (typeof window.initializeAdminPage === 'function') {
            window.initializeAdminPage = window.initializeAdminPage;
            console.log('🔍 Force check - initializeAdminPage available globally:', typeof initializeAdminPage);
        }
    }

    // Load competition settings
    async loadCompetitionSettings() {
        try {
            console.log('Loading competition settings...');
            const settingsDoc = await this.db.collection('settings').doc('competition').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                console.log('Settings loaded:', settings);
                
                // Update global variables
                window.currentActiveEdition = settings.active_edition || 1;
                window.currentActiveGameweek = settings.active_gameweek || '1';
                
                // Update local variables
                this.currentActiveEdition = window.currentActiveEdition;
                this.currentActiveGameweek = window.currentActiveGameweek;
                
                console.log('Global variables updated - Edition:', window.currentActiveEdition, 'Gameweek:', window.currentActiveGameweek);
                
                // Update UI elements if they exist
                const editionSelect = document.querySelector('#active-edition');
                const gameweekSelect = document.querySelector('#active-gameweek');
                
                if (editionSelect) {
                    editionSelect.value = window.currentActiveEdition;
                    console.log('Edition select updated to:', window.currentActiveEdition);
                }
                
                if (gameweekSelect) {
                    gameweekSelect.value = window.currentActiveGameweek;
                    console.log('Gameweek select updated to:', window.currentActiveGameweek);
                }
                
                return settings;
            } else {
                console.log('No competition settings found, creating defaults...');
                return await this.createDefaultSettings();
            }
        } catch (error) {
            console.error('Error loading competition settings:', error);
            return null;
        }
    }

    // Save competition settings
    async saveCompetitionSettings() {
        try {
            console.log('Saving competition settings...');
            
            const editionSelect = document.querySelector('#active-edition');
            const gameweekSelect = document.querySelector('#active-gameweek');
            
            if (!editionSelect || !gameweekSelect) {
                console.error('Required select elements not found');
                return false;
            }
            
            const newEdition = parseInt(editionSelect.value);
            const newGameweek = gameweekSelect.value;
            
            console.log('New settings - Edition:', newEdition, 'Gameweek:', newGameweek);
            
            // Update global variables
            window.currentActiveEdition = newEdition;
            window.currentActiveGameweek = newGameweek;
            
            // Update local variables
            this.currentActiveEdition = newEdition;
            this.currentActiveGameweek = newGameweek;
            
            // Save to database
            await this.db.collection('settings').doc('competition').set({
                active_edition: newEdition,
                active_gameweek: newGameweek,
                last_updated: new Date()
            });
            
            console.log('Settings saved successfully');
            console.log('Global variables updated - Edition:', window.currentActiveEdition, 'Gameweek:', window.currentActiveGameweek);
            
            return true;
        } catch (error) {
            console.error('Error saving competition settings:', error);
            return false;
        }
    }

    // Create default settings
    async createDefaultSettings() {
        try {
            console.log('Creating default competition settings...');
            
            const defaultSettings = {
                active_edition: 1,
                active_gameweek: '1',
                last_updated: new Date()
            };
            
            await this.db.collection('settings').doc('competition').set(defaultSettings);
            
            // Update global variables
            window.currentActiveEdition = defaultSettings.active_edition;
            window.currentActiveGameweek = defaultSettings.active_gameweek;
            
            // Update local variables
            this.currentActiveEdition = defaultSettings.active_edition;
            this.currentActiveGameweek = defaultSettings.active_gameweek;
            
            console.log('Default settings created and global variables updated');
            return defaultSettings;
        } catch (error) {
            console.error('Error creating default settings:', error);
            return null;
        }
    }

    // Initialize page-specific features
    initializePageSpecificFeatures() {
        // Check current page and initialize appropriate features
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'admin':
                console.log('🔧 Initializing admin page features...');
                // Admin-specific initialization
                break;
            case 'dashboard':
                console.log('🔧 Initializing dashboard features...');
                // Dashboard-specific initialization
                break;
            case 'register':
                console.log('🔧 Initializing registration page features...');
                // Registration-specific initialization
                break;
            default:
                console.log('🔧 Initializing general page features...');
                // General initialization
                break;
        }
    }

    // Get current page identifier
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('admin')) return 'admin';
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('register')) return 'register';
        if (path.includes('login')) return 'login';
        return 'general';
    }

               // Cleanup method
           cleanup() {
               if (this.fixturesManager) {
                   this.fixturesManager.cleanup();
               }
               if (this.scoresManager) {
                   this.scoresManager.cleanup();
               }
               if (this.uiManager) {
                   this.uiManager.cleanup();
               }
               if (this.gameLogicManager) {
                   this.gameLogicManager.cleanup();
               }
                               if (this.mobileNavigationManager) {
                    this.mobileNavigationManager.cleanup();
                }
                if (this.adminManagementManager) {
                    this.adminManagementManager.cleanup();
                }
                if (this.databaseManager) {
                    this.databaseManager.cleanup();
                }
                if (this.apiManager) {
                    this.apiManager.cleanup();
                }
                if (this.utilitiesManager) {
                    this.utilitiesManager.cleanup();
                }
                console.log('🧹 App cleanup completed');
           }
}

// Create and initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new App();
    await window.app.initialize();
});

// Export for use in other modules
export default App;
