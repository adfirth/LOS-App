// Main API Manager
// Orchestrates all API functionality modules

import { FootballWebPagesAPI } from './footballWebPages.js';
import { VidiprinterAPI } from './vidiprinter.js';
import { DataProcessor } from './dataProcessor.js';

export class ApiManager {
    constructor(db = null, currentActiveEdition = 1) {
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        
        // Initialize module instances
        this.footballWebPagesAPI = new FootballWebPagesAPI(db, currentActiveEdition);
        this.vidiprinterAPI = new VidiprinterAPI(this.footballWebPagesAPI);
        this.dataProcessor = new DataProcessor();
        
        // Legacy properties for backward compatibility
        this.footballWebPagesConfig = null;
        this.theSportsDbConfig = null;
    }

    // Initialize the API manager
    initializeApiManager() {
        console.log('🔧 Initializing API Manager...');
        this.initializeApiConfigurations();
        this.setupEventListeners();
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
        // Initialize Football Web Pages API when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeFootballWebPagesAPI();
        });
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
        
        if (testApiConnectionBtn) {
            testApiConnectionBtn.addEventListener('click', () => this.footballWebPagesAPI.testApiConnection());
        }
        if (fetchDateRangeFixturesBtn) {
            console.log('✅ Date Range Fetch button found and event listener attached');
            fetchDateRangeFixturesBtn.addEventListener('click', () => {
                console.log('📅 Date Range Fetch button clicked!');
                this.footballWebPagesAPI.fetchDateRangeFixtures();
            });
        } else {
            console.error('❌ Date Range Fetch button not found!');
        }
        if (fetchAllFixturesBtn) {
            fetchAllFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.fetchAllFixtures());
        }
        if (selectAllFixturesBtn) {
            selectAllFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.selectAllFixtures());
        }
        if (deselectAllFixturesBtn) {
            deselectAllFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.deselectAllFixtures());
        }
        if (importSelectedFixturesBtn) {
            importSelectedFixturesBtn.addEventListener('click', () => this.footballWebPagesAPI.importSelectedFixtures());
        }
        if (fetchHistoricalDataBtn) {
            fetchHistoricalDataBtn.addEventListener('click', () => {
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
