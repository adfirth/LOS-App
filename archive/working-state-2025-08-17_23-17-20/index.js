// Main API Manager
// Orchestrates all API functionality modules

console.log('🔍 Loading ApiManager class...');

import { FootballWebPagesAPI } from './footballWebPages.js';
import { VidiprinterAPI } from './vidiprinter.js';
import { DataProcessor } from './dataProcessor.js';

export class ApiManager {
    constructor(db = null, currentActiveEdition = 1) {
        console.log('🚀 ApiManager constructor called!');
        console.log('🚀 db:', db);
        console.log('🚀 currentActiveEdition:', currentActiveEdition);
        
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        
        // Initialize module instances
        this.footballWebPagesAPI = new FootballWebPagesAPI(db, currentActiveEdition);
        this.vidiprinterAPI = new VidiprinterAPI(this.footballWebPagesAPI);
        this.dataProcessor = new DataProcessor();
        
        // Legacy properties for backward compatibility
        this.footballWebPagesConfig = null;
        this.theSportsDbConfig = null;
        
        // Initialize the API manager immediately
        console.log('🚀 About to call initializeApiManager...');
        this.initializeApiManager();
        console.log('🚀 Constructor completed');
    }

    // Initialize the API manager
    initializeApiManager() {
        console.log('🔧 Initializing API Manager...');
        this.initializeApiConfigurations();
        console.log('🔧 About to call setupEventListeners...');
        console.log('🔧 this.setupEventListeners exists:', typeof this.setupEventListeners);
        this.setupEventListeners();
        console.log('🔧 setupEventListeners completed');
    }

    // Initialize API configurations
    async initializeApiConfigurations() {
        console.log('🔧 Initializing API configurations...');
        
        // Initialize Football Web Pages API configuration
        this.footballWebPagesAPI.initializeConfiguration();
        
        // Clean up TheSportsDB references
        console.log('TheSportsDB API configuration removed - using Football Web Pages API instead');
        
        // Set legacy properties for backward compatibility
        this.footballWebPagesConfig = this.footballWebPagesAPI.config;
    }

    // Get configuration safely (legacy method)
    getConfiguration() {
        return this.footballWebPagesAPI.getConfiguration();
    }

    // Check if configuration is available (legacy method)
    isConfigurationLoaded() {
        return this.footballWebPagesAPI.isConfigurationLoaded();
    }

    // Retry loading configuration if needed (legacy method)
    retryLoadConfigurationIfNeeded() {
        this.footballWebPagesAPI.retryLoadConfiguration();
    }

    // Set up event listeners
    setupEventListeners() {
        console.log('🔧 setupEventListeners method called!');
        console.log('🔧 About to call initializeFootballWebPagesAPI...');
        console.log('🔧 this.initializeFootballWebPagesAPI exists:', typeof this.initializeFootballWebPagesAPI);
        // Initialize Football Web Pages API immediately (DOM is already ready)
        this.initializeFootballWebPagesAPI();
        console.log('🔧 initializeFootballWebPagesAPI completed');
    }

    // Initialize Football Web Pages API integration
    initializeFootballWebPagesAPI() {
        console.log('🔧 Initializing Football Web Pages API integration...');
        
        const testApiConnectionBtn = document.querySelector('#test-api-connection');
        const fetchDateRangeFixturesBtn = document.querySelector('#fetch-date-range-fixtures-btn');
        const fetchAllFixturesBtn = document.querySelector('#fetch-all-fixtures-btn');
        const selectAllFixturesBtn = document.querySelector('#select-all-fixtures-btn');
        const deselectAllFixturesBtn = document.querySelector('#deselect-all-fixtures-btn');
        const importSelectedFixturesBtn = document.querySelector('#import-selected-fixtures-btn');
        const fetchHistoricalDataBtn = document.querySelector('#fetch-historical-data-btn');
        
        console.log('🔍 Found buttons:', {
            testApiConnection: !!testApiConnectionBtn,
            fetchDateRangeFixtures: !!fetchDateRangeFixturesBtn,
            fetchAllFixtures: !!fetchAllFixturesBtn,
            selectAllFixtures: !!selectAllFixturesBtn,
            deselectAllFixtures: !!deselectAllFixturesBtn,
            importSelectedFixtures: !!importSelectedFixturesBtn,
            fetchHistoricalData: !!fetchHistoricalDataBtn
        });
        
        // Check API key status on initialization
        this.footballWebPagesAPI.checkApiKeyStatus();
        
        // Check again after a delay to ensure buttons are enabled once config is loaded
        setTimeout(() => {
            this.footballWebPagesAPI.checkApiKeyStatus();
        }, 1000);
        
        // Set up button event listeners immediately
        console.log('🔧 About to call setupButtonEventListeners...');
        console.log('🔧 this.setupButtonEventListeners exists:', typeof this.setupButtonEventListeners);
        console.log('🔧 this object keys:', Object.keys(this));
        this.setupButtonEventListeners();
        
        // Retry setting up button event listeners after a delay (in case buttons load later)
        setTimeout(() => {
            console.log('🔄 Retrying button event listener setup...');
            this.setupButtonEventListeners();
        }, 2000);
        
        // Also retry when switching to fixtures tab
        document.addEventListener('click', (e) => {
            if (e.target && e.target.getAttribute('data-tab') === 'fixtures') {
                console.log('🔄 Fixtures tab clicked, retrying button event listener setup...');
                setTimeout(() => {
                    this.setupButtonEventListeners();
                }, 500);
            }
        });
    }
    
    // Set up button event listeners (extracted method for retry functionality)
    setupButtonEventListeners() {
        console.log('🚀 setupButtonEventListeners method called!');
        console.log('🚀 this object in method:', this);
        const testApiConnectionBtn = document.querySelector('#test-api-connection');
        const fetchDateRangeFixturesBtn = document.querySelector('#fetch-date-range-fixtures-btn');
        const fetchAllFixturesBtn = document.querySelector('#fetch-all-fixtures-btn');
        const selectAllFixturesBtn = document.querySelector('#select-all-fixtures-btn');
        const deselectAllFixturesBtn = document.querySelector('#deselect-all-fixtures-btn');
        const importSelectedFixturesBtn = document.querySelector('#import-selected-fixtures-btn');
        const fetchHistoricalDataBtn = document.querySelector('#fetch-historical-data-btn');
        
        console.log('🔍 Setting up button event listeners:', {
            testApiConnection: !!testApiConnectionBtn,
            fetchDateRangeFixtures: !!fetchDateRangeFixturesBtn,
            fetchAllFixtures: !!fetchAllFixturesBtn,
            selectAllFixtures: !!selectAllFixturesBtn,
            deselectAllFixtures: !!deselectAllFixturesBtn,
            importSelectedFixtures: !!importSelectedFixturesBtn,
            fetchHistoricalData: !!fetchHistoricalDataBtn
        });
        
        if (testApiConnectionBtn) {
            // Remove existing event listener to avoid duplicates
            testApiConnectionBtn.replaceWith(testApiConnectionBtn.cloneNode(true));
            const newTestApiConnectionBtn = document.querySelector('#test-api-connection');
            newTestApiConnectionBtn.addEventListener('click', () => this.footballWebPagesAPI.testApiConnection());
        }
        
        if (fetchDateRangeFixturesBtn) {
            console.log('✅ Date Range Fetch button found and event listener attached');
            // Remove existing event listener to avoid duplicates
            fetchDateRangeFixturesBtn.replaceWith(fetchDateRangeFixturesBtn.cloneNode(true));
            const newFetchDateRangeFixturesBtn = document.querySelector('#fetch-date-range-fixtures-btn');
            newFetchDateRangeFixturesBtn.addEventListener('click', () => {
                console.log('📅 Date Range Fetch button clicked!');
                this.footballWebPagesAPI.fetchDateRangeFixtures();
            });
        } else {
            console.log('⚠️ Date Range Fetch button not found - will retry later');
        }
        
        if (fetchAllFixturesBtn) {
            // Remove existing event listener to avoid duplicates
            fetchAllFixturesBtn.replaceWith(fetchAllFixturesBtn.cloneNode(true));
            const newFetchAllFixturesBtn = document.querySelector('#fetch-all-fixtures-btn');
            newFetchAllFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.fetchAllFixtures());
        }
        
        if (selectAllFixturesBtn) {
            // Remove existing event listener to avoid duplicates
            selectAllFixturesBtn.replaceWith(selectAllFixturesBtn.cloneNode(true));
            const newSelectAllFixturesBtn = document.querySelector('#select-all-fixtures-btn');
            newSelectAllFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.selectAllFixtures());
        }
        
        if (deselectAllFixturesBtn) {
            // Remove existing event listener to avoid duplicates
            deselectAllFixturesBtn.replaceWith(deselectAllFixturesBtn.cloneNode(true));
            const newDeselectAllFixturesBtn = document.querySelector('#deselect-all-fixtures-btn');
            newDeselectAllFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.deselectAllFixtures());
        }
        
        if (importSelectedFixturesBtn) {
            // Remove existing event listener to avoid duplicates
            importSelectedFixturesBtn.replaceWith(importSelectedFixturesBtn.cloneNode(true));
            const newImportSelectedFixturesBtn = document.querySelector('#import-selected-fixtures-btn');
            newImportSelectedFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.importSelectedFixtures());
        }
        
        if (fetchHistoricalDataBtn) {
            // Remove existing event listener to avoid duplicates
            fetchHistoricalDataBtn.replaceWith(fetchHistoricalDataBtn.cloneNode(true));
            const newFetchHistoricalDataBtn = document.querySelector('#fetch-historical-data-btn');
            newFetchHistoricalDataBtn.addEventListener('click', () => {
                // Get current date for historical data fetch
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); // Last 7 days
                const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                this.vidiprinterAPI.fetchHistoricalVidiprinterData(
                    startDate.toISOString().split('T')[0], // YYYY-MM-DD format
                    '00:00',
                    endDate.toISOString().split('T')[0],
                    '23:59'
                );
            });
        }
    }

    // Delegate methods to appropriate modules

    // Football Web Pages API methods
    testApiConnection() {
        return this.footballWebPagesAPI.testApiConnection();
    }

    checkApiKeyStatus() {
        return this.footballWebPagesAPI.checkApiKeyStatus();
    }

    fetchDateRangeFixtures() {
        return this.footballWebPagesAPI.fetchDateRangeFixtures();
    }

    fetchAllFixtures() {
        return this.footballWebPagesAPI.fetchAllFixtures();
    }

    displayFixtures(fixtures, container) {
        return this.footballWebPagesAPI.displayFixtures(fixtures, container);
    }

    selectAllFixtures() {
        return this.footballWebPagesAPI.selectAllFixtures();
    }

    deselectAllFixtures() {
        return this.footballWebPagesAPI.deselectAllFixtures();
    }

    importSelectedFixtures() {
        return this.footballWebPagesAPI.importSelectedFixtures();
    }

    // Vidiprinter API methods
    fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime) {
        return this.vidiprinterAPI.fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime);
    }

    filterEventsByTimeRange(events, startDate, startTime, endDate, endTime) {
        return this.vidiprinterAPI.filterEventsByTimeRange(events, startDate, startTime, endDate, endTime);
    }

    parseEventDateTime(dateTimeString) {
        return this.vidiprinterAPI.parseEventDateTime(dateTimeString);
    }

    fetchHistoricalDataForInterval(startDate, startTime, endDate, endTime) {
        return this.vidiprinterAPI.fetchHistoricalDataForInterval(startDate, startTime, endDate, endTime);
    }

    fetchVidiprinterData(competition = 5) {
        return this.vidiprinterAPI.fetchVidiprinterData(competition);
    }

    fetchEnhancedVidiprinterData(competition = 5, team = 0, date = null) {
        return this.vidiprinterAPI.fetchEnhancedVidiprinterData(competition, team, date);
    }

    // Initialize player vidiprinter functionality
    initializePlayerVidiprinter() {
        console.log('🔧 Initializing player vidiprinter...');
        
        // This method can be used to set up any player-specific vidiprinter features
        // For now, it's a placeholder that can be expanded later
        
        console.log('✅ Player vidiprinter initialized');
    }

    // Data Processor methods
    convertApiFixtureToDatabase(fixture) {
        return this.dataProcessor.convertApiFixtureToDatabase(fixture);
    }

    extractScores(fixture) {
        return this.dataProcessor.extractScores(fixture);
    }

    extractTeamNames(fixture) {
        return this.dataProcessor.extractTeamNames(fixture);
    }

    extractMatchInfo(fixture) {
        return this.dataProcessor.extractMatchInfo(fixture);
    }

    extractStatus(fixture) {
        return this.dataProcessor.extractStatus(fixture);
    }

    filterFixturesByDateRange(fixtures, startDate, endDate) {
        return this.dataProcessor.filterFixturesByDateRange(fixtures, startDate, endDate);
    }

    generateFixturesHTML(fixtures, startDate, endDate, maxDisplay = 20) {
        return this.dataProcessor.generateFixturesHTML(fixtures, startDate, endDate, maxDisplay);
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 API Manager cleanup started...');
        this.footballWebPagesAPI.cleanup();
        this.vidiprinterAPI.cleanup();
        this.dataProcessor.cleanup();
        console.log('🧹 API Manager cleanup completed');
    }
}

// Export the ApiManager class as default
export default ApiManager;
