// Main Scores Manager
// Orchestrates all score functionality modules

import { LiveScoring } from './liveScoring.js';
import { StatisticsEngine } from './statisticsEngine.js';
import { HistoryManager } from './historyManager.js';

export class ScoresManager {
    constructor(db, currentActiveEdition = 1, currentActiveGameweek = '1', apiManager = null) {
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        this.currentActiveGameweek = currentActiveGameweek;
        this.apiManager = apiManager;
        this.scoresManagementInitialized = false;

        // Initialize module instances
        this.liveScoring = new LiveScoring(db, currentActiveEdition);
        this.statisticsEngine = new StatisticsEngine(db, currentActiveEdition, currentActiveGameweek);
        this.historyManager = new HistoryManager(db, currentActiveEdition, apiManager);
    }

    // Initialize scores management
    initializeScoresManagement() {
        if (this.scoresManagementInitialized) {
            console.log('Scores management already initialized, skipping...');
            return;
        }
        
        // Check if we're on a page that needs scores management
        const hasScoresElements = document.querySelector('#score-gameweek-select') || document.querySelector('#scores-container');
        if (!hasScoresElements) {
            console.log('Scores management elements not found on this page, skipping...');
            return;
        }
        
        console.log('Initializing scores management...');
        this.scoresManagementInitialized = true;
        
        this.setupEventListeners();
        this.initializeScoresDisplay();
    }

    // Set up event listeners for scores functionality
    setupEventListeners() {
        // Save scores button
        const saveScoresBtn = document.querySelector('#save-scores-btn');
        if (saveScoresBtn) {
            saveScoresBtn.addEventListener('click', () => this.historyManager.saveScores());
        }

        // Score gameweek selector
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        if (scoreGameweekSelect) {
            scoreGameweekSelect.addEventListener('change', () => this.liveScoring.loadScoresForGameweek());
        }

        // Import Football WebPages scores button
        const importFootballWebPagesScoresBtn = document.querySelector('#import-football-webpages-scores-btn');
        if (importFootballWebPagesScoresBtn) {
            importFootballWebPagesScoresBtn.addEventListener('click', () => {
                const gameweek = scoreGameweekSelect.value;
                this.historyManager.importScoresFromFootballWebPages(gameweek);
            });
        }

        // Scores file input
        const scoresFileInput = document.querySelector('#scores-file-input');
        if (scoresFileInput) {
            scoresFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const gameweek = scoreGameweekSelect.value;
                this.historyManager.importScoresFromFile(file, gameweek);
            });
        }

        // Initialize live scoring event listeners
        this.liveScoring.initializeLiveScoring();
    }

    // Initialize scores display
    initializeScoresDisplay() {
        // Only load if the required elements exist
        if (document.querySelector('#score-gameweek-select') && document.querySelector('#scores-container')) {
            // Load initial scores for the current edition
            if (typeof this.liveScoring.loadScoresForGameweek === 'function') {
                this.liveScoring.loadScoresForGameweek();
            }
        }
    }

    // Delegate methods to appropriate modules

    // Live Scoring methods
    loadScoresForGameweek() {
        return this.liveScoring.loadScoresForGameweek();
    }

    addScoreRow(fixture, index) {
        return this.liveScoring.addScoreRow(fixture, index);
    }

    startAutoScoreUpdates(gameweek) {
        return this.liveScoring.startAutoScoreUpdates(gameweek);
    }

    stopAutoScoreUpdates() {
        return this.liveScoring.stopAutoScoreUpdates();
    }

    startRealTimeScoreUpdates(gameweek) {
        return this.liveScoring.startRealTimeScoreUpdates(gameweek);
    }

    stopRealTimeScoreUpdates() {
        return this.liveScoring.stopRealTimeScoreUpdates();
    }

    // Statistics Engine methods
    processResults(gameweek, fixtures) {
        return this.statisticsEngine.processResults(gameweek, fixtures);
    }

    getUserEdition(userData) {
        return this.statisticsEngine.getUserEdition(userData);
    }

    checkPickStillValid(pick, fixtures) {
        return this.statisticsEngine.checkPickStillValid(pick, fixtures);
    }

    calculatePickResult(pick, fixtures) {
        return this.statisticsEngine.calculatePickResult(pick, fixtures);
    }

    loadPlayerScores() {
        return this.statisticsEngine.loadPlayerScores();
    }

    renderPlayerScores(fixtures, gameweek) {
        return this.statisticsEngine.renderPlayerScores(fixtures, gameweek);
    }

    renderDesktopPlayerScores(fixtures, gameweek) {
        return this.statisticsEngine.renderDesktopPlayerScores(fixtures, gameweek);
    }

    renderMobilePlayerScores(fixtures, gameweek) {
        return this.statisticsEngine.renderMobilePlayerScores(fixtures, gameweek);
    }

    showNoScoresMessage(edition = null) {
        return this.statisticsEngine.showNoScoresMessage(edition);
    }

    // History Manager methods
    saveScores() {
        // Save scores and process results using the callback
        this.historyManager.saveScores((gameweek, fixtures) => {
            this.statisticsEngine.processResults(gameweek, fixtures);
        });
    }

    importScoresFromFile(file, gameweek) {
        return this.historyManager.importScoresFromFile(file, gameweek);
    }

    importScoresFromFootballWebPages(gameweek) {
        return this.historyManager.importScoresFromFootballWebPages(gameweek);
    }

    testFootballWebPagesAPI() {
        return this.historyManager.testFootballWebPagesAPI();
    }

    // Utility methods that are shared
    getStatusDisplay(status) {
        // This method exists in both LiveScoring and StatisticsEngine, so we can use either
        return this.liveScoring.getStatusDisplay(status);
    }

    getTeamBadge(teamName) {
        // This method exists in StatisticsEngine
        return this.statisticsEngine.getTeamBadge(teamName);
    }

    // Cleanup resources
    cleanup() {
        this.liveScoring.cleanup();
        this.statisticsEngine.cleanup();
        this.historyManager.cleanup();
        this.scoresManagementInitialized = false;
    }
}

// Export the ScoresManager class as default
export default ScoresManager;
