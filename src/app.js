// Main Application Entry Point
// This file orchestrates the application and imports modular components

console.log('🔍 src/app.js file is being loaded and parsed...');

import AuthManager from './modules/auth.js';
import RegistrationManager from './modules/registration.js';
import FixturesManager from './modules/fixtures.js';
import ScoresManager from './modules/scores/index.js';
import UIManager from './modules/ui.js';
import GameLogicManager from './modules/gameLogic.js';
import MobileNavigationManager from './modules/mobileNavigation.js';
import { AdminManager } from './modules/admin/index.js';
import DatabaseManager from './modules/database.js'; // New Database Module import
import ApiManager from './modules/api/index.js'; // New modular API Module import
import UtilitiesManager, { DOMReadyManager } from './modules/utilities.js'; // New Utilities Module import
import { appState } from './modules/state.js'; // New State Management import

console.log('🔍 Imports completed, about to define App class...');

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
        this.domReadyManager = null; // New DOM Ready Manager
        this.initialized = false;
        
        // Use state management instead of global variables
        this.state = appState;
    }

    // Initialize the app
    async initialize() {
        try {
            console.log('🚀 Initializing LOS App...');
            
            // Initialize DOM ready manager
            this.domReadyManager = new DOMReadyManager();
            
            // Wait for Firebase to be available
            await this.waitForFirebase();
            
            // Initialize managers
            await this.initializeManagers();
            
            // Initialize page-specific functionality
            await this.initializePageSpecificFeatures();
            
            // Expose admin functions globally for admin.html
            this.exposeAdminFunctionsGlobally();
            
            console.log('✅ LOS App initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing LOS App:', error);
            this.state.setError(error.message);
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

    // Initialize all managers
    async initializeManagers() {
        // Initialize managers
        this.authManager = new AuthManager();
        this.registrationManager = new RegistrationManager(this.db, this.auth);
        this.fixturesManager = new FixturesManager(this.db);
        this.apiManager = new ApiManager(this.db, this.state.get('currentActiveEdition')); // Initialize API Manager first
        this.scoresManager = new ScoresManager(this.db, this.state.get('currentActiveEdition'), this.state.get('currentActiveGameweek'), this.apiManager);
        this.uiManager = new UIManager(this.db);
        this.gameLogicManager = new GameLogicManager(this.db);
        this.mobileNavigationManager = new MobileNavigationManager(this.db);
        this.adminManagementManager = new AdminManager(this.db, this.fixturesManager, this.scoresManager);
        this.databaseManager = new DatabaseManager(); // Initialize Database Manager
        this.utilitiesManager = new UtilitiesManager(); // Initialize Utilities Manager
        
        // Initialize auth manager
        await this.authManager.initialize(this.db, this.auth);
        
        // Initialize fixtures manager
        this.fixturesManager.initializeFixtureManagement();
        
        // Initialize API manager first (needed by scores manager)
        this.apiManager.initializeApiManager();
        
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
        
        // Initialize utilities manager
        this.utilitiesManager.initializeUtilitiesManager();
        
        // Set up global references for backward compatibility
        this.setupGlobalReferences();
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
        window.adminManagementManager = this.adminManagementManager; // Expose Admin Management Manager
        
        // Global app instance
        window.app = this;
        
        // Global variables for backward compatibility
        window.currentActiveEdition = this.state.get('currentActiveEdition');
        window.currentActiveGameweek = this.state.get('currentActiveGameweek');
        
        // Global functions for backward compatibility
        this.setupGlobalFunctions();
        
        console.log('🔗 Global references set up for backward compatibility');
    }

    // Set up global functions for backward compatibility
    setupGlobalFunctions() {
        // Fixtures-related functions - REMOVED: Now handled by FixturesManager event listeners
        // window.initializeFixtureManagement = () => this.fixturesManager.initializeFixtureManagement();
        // window.addFixtureRow = () => this.fixturesManager.addFixtureRow();
        // window.removeFixtureRow = (button) => this.fixturesManager.removeFixtureRow(button);
        // window.saveFixtures = () => this.fixturesManager.saveFixtures();
        // window.checkFixtures = () => this.fixturesManager.checkFixtures();
        // window.editFixtures = () => this.fixturesManager.editFixtures();
        // window.switchToViewMode = () => this.fixturesManager.switchToViewMode();
        // window.loadFixturesForGameweek = () => this.fixturesManager.loadFixturesForGameweek();
        // window.reallocateFixtures = () => this.fixturesManager.reallocateFixtures();
        // window.deleteAllFixtures = () => this.fixturesManager.deleteAllFixtures();
        // window.loadFixturesForDeadline = (gameweek, userData, userId) => this.fixturesManager.loadFixturesForDeadline(gameweek, userData, userId);
        // window.loadMobileFixturesForDeadline = (gameweek, userData, userId) => this.fixturesManager.loadMobileFixturesForDeadline(gameweek, userData, userId);
        // window.switchToFixturesTab = () => this.fixturesManager.switchToFixturesTab();
        // window.renderFixturesDisplay = (fixtures, userData, gameweek, userId) => this.fixturesManager.renderFixturesDisplay(fixtures, userData, gameweek, userId);
        // window.renderMobileFixturesDisplay = (fixtures, userData, gameweek, userId) => this.fixturesManager.renderMobileFixturesDisplay(fixtures, userData, gameweek, userId);
        // window.renderAsItStandsStandings = (players, fixtures, gameweek, edition, platform) => this.fixturesManager.renderAsItStandsStandings(players, fixtures, gameweek, edition, platform);
        // window.loadCurrentGameweekFixtures = () => this.fixturesManager.loadCurrentGameweekFixtures();
        // window.saveFootballWebPagesSettings = () => this.fixturesManager.saveFootballWebPagesSettings();
        
                       // Scores-related functions - REMOVED: Now handled by ScoresManager event listeners
               // window.loadScoresForGameweek = () => this.scoresManager.loadScoresForGameweek();
               // window.saveScores = () => this.scoresManager.saveScores();
               // window.renderPlayerScores = (fixtures, gameweek) => this.scoresManager.renderPlayerScores(fixtures, gameweek);
               // window.renderDesktopPlayerScores = (fixtures, gameweek) => this.scoresManager.renderDesktopPlayerScores(fixtures, gameweek);
               // window.renderMobilePlayerScores = (fixtures, gameweek) => this.scoresManager.renderMobilePlayerScores(fixtures, gameweek);
               // window.checkPickStillValid = (pick, fixtures) => this.scoresManager.checkPickStillValid(pick, fixtures);
               // window.calculatePickResult = (pick, fixtures) => this.scoresManager.calculatePickResult(pick, fixtures);
               // window.processResults = (gameweek, fixtures) => this.scoresManager.processResults(gameweek, fixtures);
               // window.startAutoScoreUpdates = (gameweek) => this.scoresManager.startAutoScoreUpdates(gameweek);
               // window.stopAutoScoreUpdates = () => this.scoresManager.stopAutoScoreUpdates();
               // window.startRealTimeScoreUpdates = (gameweek) => this.scoresManager.startRealTimeScoreUpdates(gameweek);
               // window.stopRealTimeScoreUpdates = () => this.scoresManager.stopRealTimeScoreUpdates();
               // window.importScoresFromFootballWebPages = (gameweek) => this.scoresManager.importScoresFromFootballWebPages(gameweek);
               // window.importScoresFromFile = (file, gameweek) => this.scoresManager.importScoresFromFile(file, gameweek);
               // window.testFootballWebPagesAPI = () => this.scoresManager.testFootballWebPagesAPI();
               
                       // UI-related functions - REMOVED: Now handled by UIManager event listeners
        // window.showModal = (content) => this.uiManager.showModal(content);
        // window.closeUserDetailsModal = () => this.uiManager.closeUserDetailsModal();
        // window.initializeDesktopTabs = () => this.uiManager.initializeDesktopTabs();
        // window.renderDashboard = (user) => this.uiManager.renderDashboard(user);
        // window.initializeTestimonialModal = () => this.uiManager.initializeTestimonialModal();
        // window.initializeRegistrationWindowDisplay = () => this.uiManager.initializeRegistrationWindowDisplay();
        // window.updateRegistrationWindowDisplay = () => this.uiManager.updateRegistrationWindowDisplay();
        // window.showRegistrationCountdown = (endDate) => this.uiManager.showRegistrationCountdown(endDate);
        // window.showNextRegistrationCountdown = (startDate) => this.uiManager.showNextRegistrationCountdown(startDate);
        // window.hideRegistrationCountdowns = () => this.uiManager.hideRegistrationCountdowns();
        // window.showRegisterButton = (show) => this.uiManager.showRegisterButton(show);
        // window.initializeVidiprinter = () => this.uiManager.initializeVidiprinter();
        // window.startVidiprinter = () => this.uiManager.startVidiprinter();
        // window.stopVidiprinter = () => this.uiManager.stopVidiprinter();
        // window.clearVidiprinterFeed = () => this.uiManager.clearVidiprinterFeed();
        // window.toggleAutoScroll = () => this.uiManager.toggleAutoScroll();
        
        // Game Logic-related functions - REMOVED: Now handled by GameLogicManager directly
        // window.generatePickHistory = (picks) => this.gameLogicManager.generatePickHistory(picks);
        // window.renderPickHistory = (picks, container, userId, userData) => this.gameLogicManager.renderPickHistory(picks, container, userId, userData);
        // window.initializeGameweekNavigation = (currentGameWeek, userData, userId) => this.gameLogicManager.initializeGameweekNavigation(currentGameWeek, userData, userId);
        // window.initializeMobileGameweekNavigation = (currentGameWeek, userData, userId) => this.mobileNavigationManager.initializeMobileGameweekNavigation(currentGameWeek, userData, userId);
        // window.navigateToGameweek = (gameweek, userData, userId) => this.gameLogicManager.navigateToGameweek(gameweek, userData, userId);
        // window.navigateGameweek = (currentGameWeek, direction, userData, userId) => this.gameLogicManager.navigateGameweek(currentGameWeek, direction, userData, userId);
        // window.checkAndAssignAutoPicks = (userData, currentGameWeek, userId) => this.gameLogicManager.checkAndAssignAutoPicks(userData, currentGameWeek, userId);
        // window.updatePickStatusHeader = (currentGameWeek, userData, userId) => this.gameLogicManager.updatePickStatusHeader(currentGameWeek, userData, userId);
        // window.updateMobilePickStatusHeader = (currentGameWeek, userData, userId) => this.mobileNavigationManager.updateMobilePickStatusHeader(currentGameWeek, userData, userId);
        // window.startDeadlineChecker = () => this.gameLogicManager.startDeadlineChecker();
        // window.initializeEnhancedVidiprinter = () => this.gameLogicManager.initializeEnhancedVidiprinter();
        // window.updateNavigationButtons = (currentGameWeek, prevButton, nextButton) => this.gameLogicManager.updateNavigationButtons(currentGameWeek, prevButton, nextButton);
        // window.updateActiveTab = (currentGameWeek, gameweekTabs) => this.gameLogicManager.updateActiveTab(currentGameWeek, gameweekTabs);
        // window.updateTabStates = (gameweekTabs) => this.gameLogicManager.updateTabStates(gameweekTabs);
        // window.navigateGameweek = (currentGameWeek, direction, userData, userId) => this.gameLogicManager.navigateGameweek(currentGameWeek, direction, userData, userId);
        // window.removePick = (userId, gameweekKey) => this.gameLogicManager.removePick(userId, gameweekKey);
        // window.makePick = (userId, gameweek) => this.gameLogicManager.makePick(userId, gameweek);
        // window.selectTeamAsTempPick = (teamName, gameweek, userId) => this.gameLogicManager.selectTeamAsTempPick(teamName, gameweek, userId);
        // window.refreshDisplayAfterPickUpdate = (gameweek, userId) => this.gameLogicManager.refreshDisplayAfterPickUpdate(gameweek, userId);
        // window.saveTempPick = (gameweek, userId) => this.gameLogicManager.saveTempPick(gameweek, userId);
        // window.releaseFuturePick = (teamName, gameweek, userId) => this.gameLogicManager.releaseFuturePick(teamName, gameweek, userId);
        // window.selectTeamAsPick = (teamName, gameweek, userId) => this.gameLogicManager.selectTeamAsPick(teamName, gameweek, userId);
        // window.assignAutoPick = (userData, gameweek, userId) => this.gameLogicManager.assignAutoPick(userData, gameweek, userId);
        // window.getDeadlineDateForGameweek = (gameweek) => this.gameLogicManager.getDeadlineDateForGameweek(gameCode);
        // window.formatDeadlineDate = (date) => this.gameLogicManager.formatDeadlineDate(date);
        // window.getOrdinalSuffix = (day) => this.gameLogicManager.getOrdinalSuffix(day);
        // window.checkDeadlineForGameweek = (gameweek, edition) => this.gameLogicManager.checkDeadlineForGameweek(gameweek, edition);
        // window.batchCheckDeadlines = (gameweeks, edition) => this.gameLogicManager.batchCheckDeadlines(gameweeks, edition);
        // window.getTeamStatusSimple = (teamName, userData, currentGameWeek, userId) => this.gameLogicManager.getTeamStatusSimple(teamName, userData, currentGameWeek, userId);
        // window.getTeamStatus = (teamName, userData, currentGameWeek, userId) => this.gameLogicManager.getTeamStatus(teamName, userData, currentGameWeek, userId);
        // window.getUserEdition = (userData) => this.gameLogicManager.getUserEdition(userData);
        // window.getUserRegisteredEditions = (userData) => this.gameLogicManager.getUserRegisteredEditions(userData);
        // window.getActiveGameweek = () => this.gameLogicManager.getActiveGameweek();
        
        // Mobile Navigation-related functions - REMOVED: Now handled by MobileNavigationManager directly
        // window.initializeMobileTabs = () => this.mobileNavigationManager.initializeMobileTabs();
        // window.loadMobileFixturesForDeadline = (gameweek, userData, userId) => this.mobileNavigationManager.loadMobileFixturesForDeadline(gameweek, userData, userId);
        // window.renderMobileFixturesDisplay = (fixtures, userData, currentGameWeek, userId) => this.mobileNavigationManager.renderMobileFixturesDisplay(fixtures, userData, currentGameWeek, userId);
        // window.updateMobilePickStatusHeader = (gameweek, userData, userId) => this.mobileNavigationManager.updateMobilePickStatusHeader(gameweek, userData, userId);
        // window.initializeMobileGameweekNavigation = (currentGameWeek, userData, userId) => this.mobileNavigationManager.initializeMobileGameweekNavigation(currentGameWeek, userData, userId);
        // window.updateMobileNavigationButtons = (currentGameWeek, prevButton, nextButton) => this.mobileNavigationManager.updateMobileNavigationButtons(currentGameWeek, prevButton, nextButton);
        // window.updateMobileActiveTab = (currentGameWeek, gameweekTabs) => this.mobileNavigationManager.updateMobileActiveTab(currentGameWeek, gameweekTabs);
        // window.updateMobileTabStates = (gameweekTabs) => this.mobileNavigationManager.updateMobileTabStates(gameweekTabs);
        // window.navigateMobileGameweek = (currentGameWeek, direction, userData, userId) => this.mobileNavigationManager.navigateMobileGameweek(currentGameWeek, direction, userData, userId);
        // window.navigateToMobileGameweek = (gameweek, userData, userId) => this.mobileNavigationManager.navigateToMobileGameweek(gameweek, userData, userId);
        // window.renderMobilePlayerScores = (fixtures, gameweek) => this.mobileNavigationManager.renderMobilePlayerScores(fixtures, gameweek);
        // window.toggleTestimonials = () => this.mobileNavigationManager.toggleTestimonials();
        // window.switchToFixturesTab = () => this.mobileNavigationManager.switchToFixturesTab();
        
                 // Admin Management-related functions - REMOVED: Now handled by AdminManagementManager directly
         // window.buildAdminDashboard = (settings) => this.adminManagementManager.buildAdminDashboard(settings);
         // window.showPlayerManagement = (type) => this.adminManagementManager.showPlayerManagement(type);
         // window.closePlayerManagement = () => this.adminManagementManager.closePlayerManagement();
         // window.closePlayerEdit = () => this.adminManagementManager.closePlayerEdit();
         // window.loadPlayersForManagement = () => this.adminManagementManager.loadPlayersForManagement();
         // window.displayPlayers = (players) => this.adminManagementManager.displayPlayers(players);
         // window.searchPlayers = () => this.adminManagementManager.searchPlayers();
         // window.filterPlayers = () => this.adminManagementManager.filterPlayers();
         // window.editPlayer = (playerId) => this.adminManagementManager.editPlayer(playerId);
         // window.savePlayerEdit = (event) => this.adminManagementManager.savePlayerEdit(event);
         // window.archivePlayer = (playerId) => this.adminManagementManager.archivePlayer(playerId);
         // window.unarchivePlayer = (playerId) => this.adminManagementManager.unarchivePlayer(playerId);
         // window.addToTestWeeks = (playerId) => this.adminManagementManager.addToTestWeeks(playerId);
         // window.deletePlayer = (playerId) => this.adminManagementManager.deletePlayer(playerId);
         // window.resetAllPlayerLives = () => this.adminManagementManager.resetAllPlayerLives();
         window.resetTestLives = () => this.adminManagementManager.resetTestLives();
         window.saveApiSuspensionSettings = () => this.adminManagementManager.saveApiSuspensionSettings();
         // window.generateTestScores = () => this.adminManagementManager.generateTestScores();
         // window.initializeEnhancedVidiprinter = () => this.adminManagementManager.initializeEnhancedVidiprinter();
         // window.startEnhancedVidiprinter = () => this.adminManagementManager.startEnhancedVidiprinter();
         // window.stopEnhancedVidiprinter = () => this.adminManagementManager.stopEnhancedVidiprinter();
         // window.clearEnhancedVidiprinterFeed = () => this.adminManagementManager.clearEnhancedVidiprinterFeed();
         // window.saveCompetitionSettings = () => this.adminManagementManager.saveCompetitionSettings();
        
        // Database-related functions - REMOVED: Now handled by DatabaseManager directly
        // window.initializeDatabase = () => this.databaseManager.initializeDatabase();
        // window.checkAndInitializeDatabase = () => this.databaseManager.checkAndInitializeDatabase();
        // window.getUserDocument = (userId) => this.databaseManager.getUserDocument(userId);
        // window.updateUserDocument = (userId, updateData) => this.databaseManager.updateUserDocument(userId, updateData);
        // window.saveEditionPreference = (edition, userId) => this.databaseManager.saveEditionPreference(edition, userId);
        // window.saveUserDefaultEdition = (userId) => this.databaseManager.saveUserDefaultEdition(userId);
        // window.getAllUsers = () => this.databaseManager.getAllUsers();
        // window.getUsersByEdition = (edition) => this.databaseManager.getUsersByEdition(edition);
        // window.getUsersOrderedByName = (limit) => this.databaseManager.getUsersOrderedByName(limit);
        // window.getSettingsDocument = (docId) => this.databaseManager.getSettingsDocument(docId);
        // window.setSettingsDocument = (docId, settings) => this.databaseManager.setSettingsDocument(docId, settings);
        // window.getRegistrationSettings = (edition) => this.databaseManager.getRegistrationSettings(edition);
        // window.setRegistrationSettings = (edition, settings) => this.databaseManager.setRegistrationSettings(edition, settings);
        // window.getFixturesDocument = (gameweekKey) => this.databaseManager.getFixturesDocument(gameweekKey);
        // window.updateFixturesDocument = (gameweekKey, fixturesData) => this.databaseManager.updateFixturesDocument(gameweekKey, fixturesData);
        // window.deleteFixturesDocument = (gameweekKey) => this.databaseManager.deleteFixturesDocument(gameweekKey);
        // window.updateUserPick = (userId, gameweekKey, pickData) => this.databaseManager.updateUserPick(userId, gameweekKey, pickData);
        // window.removeUserPick = (userId, gameweekKey) => this.databaseManager.removeUserPick(userId, gameweekKey);
        // window.getUserPicks = (userId) => this.databaseManager.getUserPicks(userId);
        // window.updateUserRegistration = (userId, edition, registrationData) => this.databaseManager.updateUserRegistration(userId, edition, registrationData);
        // window.removeUserRegistration = (userId, edition) => this.databaseManager.removeUserRegistration(userId, edition);
        // window.checkAdminStatus = (userId) => this.databaseManager.checkAdminStatus(userId);
        // window.updateUserStatus = (userId, status, additionalData) => this.databaseManager.updateUserStatus(userId, status, additionalData);
        // window.resetAllPlayerLives = () => this.databaseManager.resetAllPlayerLives();
        // window.batchUpdateUsers = (updates) => this.databaseManager.batchUpdateUsers(updates);
        // window.batchDeleteUsers = (userIds) => this.databaseManager.batchDeleteUsers(userIds);
        // window.startRealTimeScoreUpdates = (gameweek, callback) => this.databaseManager.startRealTimeScoreUpdates(gameweek, callback);
        // window.stopRealTimeScoreUpdates = () => this.databaseManager.stopRealTimeScoreUpdates();
        // window.startEnhancedVidiprinter = (callback) => this.databaseManager.startEnhancedVidiprinter(callback);
        // window.stopEnhancedVidiprinter = () => this.databaseManager.stopEnhancedVidiprinter();
        // window.startDeadlineChecker = (callback) => this.databaseManager.startDeadlineChecker(callback);
        // window.stopDeadlineChecker = () => this.databaseManager.stopDeadlineChecker();
        // window.startAdminSessionMonitoring = (userId, timeoutCallback, warningCallback) => this.databaseManager.startAdminSessionMonitoring(userId, timeoutCallback, warningCallback);
        // window.stopAdminSessionMonitoring = () => this.databaseManager.stopAdminSessionMonitoring();
        // window.startAdminTokenRefresh = (user, refreshCallback) => this.databaseManager.startAdminTokenRefresh(user, refreshCallback);
        // window.stopAdminTokenRefresh = () => this.databaseManager.stopAdminTokenRefresh();
        // window.getDatabaseReference = () => this.databaseManager.getDatabaseReference();
        // window.isDatabaseInitialized = () => this.databaseManager.isDatabaseInitialized();
        
        // API-related functions - REMOVED: Now handled by ApiManager directly
        // window.initializeFootballWebPagesAPI = () => this.apiManager.initializeFootballWebPagesAPI();
        // window.testApiConnection = () => this.apiManager.testApiConnection();
        // window.checkApiKeyStatus = () => this.apiManager.checkApiKeyStatus();
        // window.fetchAvailableMatchdays = (league, season) => this.apiManager.fetchAvailableMatchdays(league, season);
        // window.fetchSingleFixtures = (league, season, matchday) => this.apiManager.fetchSingleFixtures(league, season, matchday);
        // window.fetchSingleScores = (league, season, matchday) => this.apiManager.fetchSingleScores(league, season, matchday);
        // window.fetchDateRangeFixtures = (league, season, startDate, endDate) => this.apiManager.fetchDateRangeFixtures(league, season, startDate, endDate);
        // window.fetchAllFixtures = (league, season) => this.apiManager.fetchAllFixtures(league, season);
        // window.fetchFixturesFromFootballWebPages = (league, season, matchday, startDate, endDate) => this.apiManager.fetchFixturesFromFootballWebPages(league, season, matchday, startDate, endDate);
        // window.fetchScoresFromFootballWebPages = (league, season, matchday, existingFixtures) => this.apiManager.fetchScoresFromFootballWebPages(league, season, matchday, existingFixtures);
        // Note: TheSportsDB API functions removed - using Football Web Pages API instead
        // window.fetchEnhancedVidiprinterData = (competition, team, date) => this.apiManager.fetchEnhancedVidiprinterData(competition, team, date);
        // window.fetchVidiprinterData = (competition) => this.apiManager.fetchVidiprinterData(competition);
        // window.fetchScoresViaNetlify = (league, season, matchday, fixtures, startDate, endDate) => this.apiManager.fetchScoresViaNetlify(league, season, matchday, fixtures, startDate, endDate);
        // window.selectAllFixtures = () => this.apiManager.selectAllFixtures();
        // window.deselectAllFixtures = () => this.apiManager.deselectAllFixtures();
        // window.importSelectedFixtures = () => this.apiManager.importSelectedFixtures();
        // window.importFixturesToCurrentGameweek = (fixtures) => this.apiManager.importFixturesToCurrentGameweek(fixtures);
        
        // Utilities-related functions - REMOVED: Now handled by UtilitiesManager directly
        // window.formatDeadlineDate = (date) => this.utilitiesManager.formatDeadlineDate(date);
        // window.getOrdinalSuffix = (day) => this.utilitiesManager.getOrdinalSuffix(day);
        // window.getDeadlineDateForGameweek = (gameweek) => this.utilitiesManager.getDeadlineDateForGameweek(gameweek);
        // window.getUserEdition = (userData) => this.utilitiesManager.getUserEdition(userData);
        // window.getUserRegisteredEditions = (userData) => this.utilitiesManager.getUserRegisteredEditions(userData);
        // window.getActiveGameweek = () => this.utilitiesManager.getActiveGameweek();
        // window.setActiveGameweek = (gameweek) => this.utilitiesManager.setActiveGameweek(gameweek);
        // window.setActiveEdition = (edition) => this.utilitiesManager.setActiveEdition(edition);
        // window.getTeamStatusSimple = (teamName, userData, currentGameWeek, userId) => this.utilitiesManager.getTeamStatusSimple(teamName, userData, currentGameWeek, userId);
        // window.getTeamStatus = (teamName, userData, currentGameWeek, userId) => this.utilitiesManager.getTeamStatus(teamName, userData, currentGameWeek, userId);
        // window.getStatusDisplay = (status) => this.utilitiesManager.getStatusDisplay(status);
        // window.getMockFixtures = (league, gameweek) => this.utilitiesManager.getMockFixtures(league, gameweek);
        // window.getMockScores = (existingFixtures) => this.utilitiesManager.getMockScores(existingFixtures);
        // window.getMockRounds = () => this.utilitiesManager.getMockRounds();
        // window.getMockMatchdays = () => this.utilitiesManager.getMockMatchdays();
        // window.calculateTeamNameSimilarity = (name1, name2) => this.utilitiesManager.calculateTeamNameSimilarity(name1, name2);
        // window.normalizeTeamName = (teamName) => this.utilitiesManager.normalizeTeamName(teamName);
        // window.groupFixturesByDate = (fixtures) => this.utilitiesManager.groupFixturesByDate(fixtures);
        // window.showRegistrationClosed = (message) => this.utilitiesManager.showRegistrationClosed(message);
        // window.showRegistrationCountdown = (endDate) => this.utilitiesManager.showRegistrationCountdown(endDate);
        // window.showNextRegistrationCountdown = (startDate) => this.utilitiesManager.showNextRegistrationCountdown(startDate);
        // window.hideRegistrationCountdowns = () => this.utilitiesManager.hideRegistrationCountdowns();
        // window.showRegisterButton = (show) => this.utilitiesManager.showRegisterButton(show);
        // window.resetAsItStandsInitialization = () => this.utilitiesManager.resetAsItStandsInitialization();
        // window.diagnoseAsItStandsElements = () => this.utilitiesManager.diagnoseAsItStandsElements();
        // window.testAsItStandsManually = () => this.utilitiesManager.testAsItStandsManually();
        // window.checkPickStillValid = (pick, fixtures) => this.utilitiesManager.checkPickStillValid(pick, fixtures);
        
        // Auth-related functions - REMOVED: Now handled by AuthManager directly
        // window.initializeAuthListener = () => this.authManager.initializeAuthListener();
        // window.startAdminTokenRefresh = (user) => this.authManager.startAdminTokenRefresh(user);
        // window.stopAdminTokenRefresh = () => this.authManager.stopAdminTokenRefresh();
        // window.checkAdminStatusFromStorage = () => this.authManager.checkAdminStatusFromStorage();
        // window.initializeAdminPage = () => this.authManager.initializeAdminPage();
        // window.showAdminLoginForm = () => this.authManager.showAdminLoginForm();
        // window.loadAdminPanelSettings = () => this.authManager.loadAdminPanelSettings();
        // window.showSettingsError = (message) => this.authManager.showSettingsError(message);
        // window.startAdminSessionMonitoring = () => this.authManager.startAdminSessionMonitoring();
        // window.stopAdminSessionMonitoring = () => this.authManager.stopAdminSessionMonitoring();
        // window.showSessionTimeoutWarning = () => this.authManager.showSessionTimeoutWarning();
        // window.extendAdminSession = () => this.authManager.extendAdminSession();
        // window.handleAdminSessionTimeout = () => this.authManager.handleAdminSessionTimeout();
        // window.initializeAdminPageVisibilityHandling = () => this.authManager.initializeAdminPageVisibilityHandling();
        // window.initializeAdminLoginHandlers = () => this.authManager.initializeAdminLoginHandlers();
        // window.handleAdminLogin = (e) => this.authManager.handleAdminLogin(e);
        // window.handleAdminLogout = () => this.authManager.handleAdminLogout();
        
        // Registration-related functions - REMOVED: Now handled by RegistrationManager directly
        // window.updateRegistrationPageEdition = () => this.registrationManager.updateRegistrationPageEdition();
        // window.updateEditionDisplay = () => this.registrationManager.updateEditionDisplay();
        // window.getUserEdition = (userData) => this.registrationManager.getUserEdition(userData);
        // window.getUserRegisteredEditions = (userData) => this.registrationManager.getUserRegisteredEditions(userData);
        // window.saveEditionPreference = (edition, userId) => this.registrationManager.saveEditionPreference(edition, userId);
        // window.updateUserDefaultEdition = (userId, edition) => this.registrationManager.updateUserDefaultEdition(userId, edition);
        // window.saveUserDefaultEdition = (userId) => this.registrationManager.saveUserDefaultEdition(userId);
        // window.loadCurrentEditionForRegistration = () => this.registrationManager.loadCurrentEditionForRegistration();
        // window.checkRegistrationWindow = (edition) => this.registrationManager.checkRegistrationWindow(edition);
        // window.showRegistrationClosed = (message) => this.registrationManager.showRegistrationClosed(message);
        // window.initializeRegistrationManagement = () => this.registrationManager.initializeRegistrationManagement();
        // window.loadRegistrationSettings = () => this.registrationManager.loadRegistrationSettings();
        window.loadEditionRegistrationSettings = () => this.registrationManager.loadEditionRegistrationSettings();
        // window.loadAllEditionsOverview = () => this.registrationManager.loadAllEditionsOverview();
        // window.saveRegistrationSettings = () => this.registrationManager.saveRegistrationSettings();
        // window.refreshRegistrationStats = () => this.registrationManager.refreshRegistrationStats();
        // window.updateRegistrationList = () => this.registrationManager.updateRegistrationList();
        // window.viewUserDetails = (userId) => this.registrationManager.viewUserDetails(userId);
        // window.generateRegistrationHistory = (registrations) => this.registrationManager.generateRegistrationHistory(registrations);
        // window.showModal = (content) => this.registrationManager.showModal(content);
        // window.closeUserDetailsModal = () => this.registrationManager.closeUserDetailsModal();
        
        // Fixture management functions - REMOVED: Now handled by FixturesManager event listeners
        // window.saveFixtures = () => this.fixturesManager.saveFixtures();
        // window.checkFixtures = () => this.fixturesManager.checkFixtures();
        // window.editFixtures = () => this.fixturesManager.editFixtures();
        // window.switchToViewMode = () => this.fixturesManager.switchToViewMode();
        // window.loadFixturesForGameweek = () => this.fixturesManager.loadFixturesForGameweek();
        // window.addFixtureRow = () => this.fixturesManager.addFixtureRow();
        // window.reallocateFixtures = () => this.fixturesManager.reallocateFixtures();
        // window.deleteAllFixtures = () => this.fixturesManager.deleteAllFixtures();
        
        console.log('🔧 Global functions set up for backward compatibility');
    }

    // Expose admin functions globally for admin.html
    exposeAdminFunctionsGlobally() {
        // Expose admin functions to global scope for admin.html
        window.adminManagementManager = this.adminManagementManager;
        window.authManager = this.authManager;
        window.registrationManager = this.registrationManager;
        window.fixturesManager = this.fixturesManager;
        window.scoresManager = this.scoresManager;
        window.uiManager = this.uiManager;
        window.gameLogicManager = this.gameLogicManager;
        window.mobileNavigationManager = this.mobileNavigationManager;
        window.databaseManager = this.databaseManager;
        window.apiManager = this.apiManager;
        window.utilitiesManager = this.utilitiesManager;
        
        // Expose specific admin functions - REMOVED: Now handled by AuthManager directly
        // window.initializeAdminLoginHandlers = () => this.authManager.initializeAdminLoginHandlers();
        // window.handleAdminLogin = (e) => this.authManager.handleAdminLogin(e);
        // window.handleAdminLogout = () => this.authManager.handleAdminLogout();
        // window.extendAdminSession = () => this.authManager.extendAdminSession();
        
        console.log('🔧 Exposing admin functions globally...');
        console.log('Available global functions:', {
            adminManagementManager: typeof window.adminManagementManager,
            authManager: typeof window.authManager,
            registrationManager: typeof window.registrationManager,
            fixturesManager: typeof window.fixturesManager,
            scoresManager: typeof window.scoresManager,
            uiManager: typeof window.uiManager,
            gameLogicManager: typeof window.gameLogicManager,
            mobileNavigationManager: typeof window.mobileNavigationManager,
            databaseManager: typeof window.databaseManager,
            apiManager: typeof window.apiManager,
            utilitiesManager: typeof window.utilitiesManager,
            initializeAdminLoginHandlers: typeof window.initializeAdminLoginHandlers,
            app: typeof window.app
        });
    }

    // Initialize page-specific features
    async initializePageSpecificFeatures() {
        // Check current page and initialize appropriate features
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'admin':
                console.log('🔧 Initializing admin page features...');
                // Admin-specific initialization
                if (this.adminManagementManager) {
                    console.log('🔧 Initializing admin management...');
                    this.adminManagementManager.initializeAdminPage();
                }
                break;
            case 'dashboard':
                console.log('🔧 Initializing dashboard features...');
                // Dashboard-specific initialization
                if (this.authManager && this.authManager.currentUser) {
                    console.log('🔧 User authenticated, initializing dashboard...');
                    // Initialize dashboard for authenticated user
                    if (this.uiManager && typeof this.uiManager.renderDashboard === 'function') {
                        await this.uiManager.renderDashboard(this.authManager.currentUser);
                    }
                } else {
                    console.log('🔧 No authenticated user, redirecting to login...');
                    // Redirect to login if not authenticated
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1000);
                }
                break;
            case 'register':
                console.log('🔧 Initializing registration page features...');
                // Registration-specific initialization
                if (this.registrationManager) {
                    this.registrationManager.initializeRegistrationManagement();
                }
                break;
            case 'login':
                console.log('🔧 Initializing login page features...');
                // Login-specific initialization
                if (this.authManager) {
                    this.authManager.initializeLoginPage();
                }
                // Initialize registration management for login page first
                if (this.registrationManager) {
                    console.log('🔧 Initializing login page registration management...');
                    this.registrationManager.initializeRegistrationManagement();
                }
                // Initialize registration window display for login page after a short delay to ensure managers are ready
                if (this.uiManager) {
                    console.log('🔧 Initializing login page registration window display...');
                    setTimeout(() => {
                        this.uiManager.initializeRegistrationWindowDisplay();
                    }, 500);
                }
                break;
            default:
                console.log('🔧 Initializing general page features...');
                // General initialization - this is the main page (index.html)
                if (this.registrationManager) {
                    console.log('🔧 Initializing main page registration features...');
                    this.registrationManager.initializeMainPage();
                }
                break;
        }
    }

    // Get current page identifier
    getCurrentPage() {
        const path = window.location.pathname;
        const url = window.location.href;
        
        // Check for login in both pathname and full URL (for Netlify routing)
        if (path.includes('admin') || url.includes('admin')) return 'admin';
        if (path.includes('dashboard') || url.includes('dashboard')) return 'dashboard';
        if (path.includes('register') || url.includes('register')) return 'register';
        if (path.includes('login') || url.includes('login')) return 'login';
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

console.log('🔍 App class defined, about to set up DOMContentLoaded listener...');

// Create and initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new App();
    await window.app.initialize();
});

// Export for use in other modules
export default App;

// Also expose App class globally for admin.html
window.App = App;
