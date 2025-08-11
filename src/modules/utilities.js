// Utilities Module - Common helper functions, date utilities, user utilities, and mock data generators
// This module consolidates all utility functions that were scattered throughout the original app.js

class UtilitiesManager {
    constructor() {
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
        console.log('🔧 Utilities Manager initialized');
    }

    // ===== DATE & TIME UTILITIES =====
    
    /**
     * Formats a deadline date with ordinal suffixes and readable format
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDeadlineDate(date) {
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
        const ordinalSuffix = this.getOrdinalSuffix(day);
        
        return `${displayHours}:${minutes}${ampm} ${dayOfWeek} ${day}${ordinalSuffix} ${month}`;
    }

    /**
     * Gets the ordinal suffix for a day number
     * @param {number} day - The day number
     * @returns {string} Ordinal suffix (st, nd, rd, th)
     */
    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    /**
     * Gets the deadline date for a specific gameweek
     * @param {string} gameweek - The gameweek number
     * @returns {Promise<Date|null>} Deadline date or null if not found
     */
    async getDeadlineDateForGameweek(gameweek) {
        try {
            // Handle tiebreak gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            // Try new structure first, then fallback to old structure
            let doc = await window.db.collection('fixtures').doc(editionGameweekKey).get();
            if (!doc.exists) {
                // Fallback to old structure for backward compatibility
                doc = await window.db.collection('fixtures').doc(gameweekKey).get();
            }
            
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });
                    return new Date(earliestFixture.date);
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting deadline date for gameweek:', error);
            return null;
        }
    }

    // ===== USER & EDITION UTILITIES =====
    
    /**
     * Gets the user's current edition from registration data
     * @param {Object} userData - User data object
     * @returns {string|number} Edition identifier
     */
    getUserEdition(userData) {
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

    /**
     * Gets all editions the user is registered for
     * @param {Object} userData - User data object
     * @returns {Array} Array of edition identifiers
     */
    getUserRegisteredEditions(userData) {
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

    /**
     * Gets the active gameweek from settings
     * @returns {string} Current active gameweek
     */
    getActiveGameweek() {
        return this.currentActiveGameweek;
    }

    /**
     * Sets the active gameweek
     * @param {string} gameweek - Gameweek to set as active
     */
    setActiveGameweek(gameweek) {
        this.currentActiveGameweek = gameweek;
    }

    /**
     * Sets the active edition
     * @param {number} edition - Edition to set as active
     */
    setActiveEdition(edition) {
        this.currentActiveEdition = edition;
    }

    // ===== TEAM & STATUS UTILITIES =====
    
    /**
     * Gets simple team status without Firebase calls
     * @param {string} teamName - Name of the team
     * @param {Object} userData - User data object
     * @param {string} currentGameWeek - Current gameweek
     * @param {string} userId - User ID
     * @returns {Object} Team status object
     */
    getTeamStatusSimple(teamName, userData, currentGameWeek, userId) {
        if (!userData || !userData.picks) {
            return { status: 'not_picked', lives: 2 };
        }
        
        const picks = userData.picks;
        let teamPicked = false;
        let pickGameweek = null;
        
        // Check if team was picked in any gameweek
        Object.keys(picks).forEach(gameweekKey => {
            if (picks[gameweekKey] === teamName) {
                teamPicked = true;
                pickGameweek = gameweekKey;
            }
        });
        
        if (!teamPicked) {
            return { status: 'not_picked', lives: userData.lives || 2 };
        }
        
        // Check if pick is still valid
        const pick = { team: teamName, gameweek: pickGameweek };
        const fixtures = this.getFixturesForGameweek(pickGameweek);
        
        if (fixtures && fixtures.length > 0) {
            const result = this.checkPickStillValid(pick, fixtures);
            if (result.valid) {
                return { status: 'picked', lives: userData.lives || 2, gameweek: pickGameweek };
            } else {
                return { status: 'eliminated', lives: 0, gameweek: pickGameweek };
            }
        }
        
        return { status: 'picked', lives: userData.lives || 2, gameweek: pickGameweek };
    }

    /**
     * Gets full team status with Firebase calls
     * @param {string} teamName - Name of the team
     * @param {Object} userData - User data object
     * @param {string} currentGameWeek - Current gameweek
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Team status object
     */
    async getTeamStatus(teamName, userData, currentGameWeek, userId) {
        try {
            // First try simple status
            const simpleStatus = this.getTeamStatusSimple(teamName, userData, currentGameWeek, userId);
            
            // If we have enough info, return simple status
            if (simpleStatus.status !== 'picked' || simpleStatus.gameweek === currentGameWeek) {
                return simpleStatus;
            }
            
            // Otherwise, fetch current fixtures to check validity
            const fixtures = await this.getFixturesForGameweek(currentGameWeek);
            if (fixtures && fixtures.length > 0) {
                const pick = { team: teamName, gameweek: simpleStatus.gameweek };
                const result = this.checkPickStillValid(pick, fixtures);
                if (result.valid) {
                    return { status: 'picked', lives: userData.lives || 2, gameweek: simpleStatus.gameweek };
                } else {
                    return { status: 'eliminated', lives: 0, gameweek: simpleStatus.gameweek };
                }
            }
            
            return simpleStatus;
        } catch (error) {
            console.error('Error getting team status:', error);
            return { status: 'error', lives: userData.lives || 2 };
        }
    }

    /**
     * Converts status codes to readable text
     * @param {string} status - Status code
     * @returns {string} Readable status text
     */
    getStatusDisplay(status) {
        const statusMap = {
            'NS': 'Not Started',
            'POSTP': 'Postponed',
            'KO': 'Kicked Off',
            'HT': 'Half-time',
            'FT': 'Full-time',
            'COMP': 'Completed'
        };
        return statusMap[status] || 'Not Started';
    }

    // ===== MOCK DATA UTILITIES =====
    
    /**
     * Generates mock fixture data for testing
     * @param {string} league - League identifier
     * @param {string} gameweek - Gameweek number
     * @returns {Array} Array of mock fixtures
     */
    getMockFixtures(league, gameweek) {
        const teams = [
            'Altrincham', 'Bromley', 'Chesterfield', 'Dagenham & Redbridge',
            'Eastleigh', 'FC Halifax Town', 'Gateshead', 'Hartlepool United',
            'Kidderminster Harriers', 'Maidenhead United', 'Oldham Athletic',
            'Oxford City', 'Rochdale', 'Solihull Moors', 'Southend United',
            'Wealdstone', 'Woking', 'Wrexham', 'Yeovil Town', 'York City'
        ];
        
        const fixtures = [];
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffledTeams.length; i += 2) {
            if (i + 1 < shuffledTeams.length) {
                fixtures.push({
                    homeTeam: shuffledTeams[i],
                    awayTeam: shuffledTeams[i + 1],
                    date: new Date(Date.now() + (Math.random() * 7 * 24 * 60 * 60 * 1000)),
                    venue: 'Home Ground',
                    status: 'NS'
                });
            }
        }
        
        return fixtures;
    }

    /**
     * Generates mock score data for existing fixtures
     * @param {Array} existingFixtures - Array of existing fixtures
     * @returns {Array} Array of fixtures with mock scores
     */
    getMockScores(existingFixtures) {
        if (!existingFixtures || !Array.isArray(existingFixtures)) {
            return [];
        }
        
        return existingFixtures.map(fixture => {
            const homeScore = Math.floor(Math.random() * 4);
            const awayScore = Math.floor(Math.random() * 4);
            
            return {
                ...fixture,
                homeScore: homeScore,
                awayScore: awayScore,
                status: 'FT'
            };
        });
    }

    /**
     * Generates mock round data for TheSportsDB API
     * @returns {Array} Array of mock rounds
     */
    getMockRounds() {
        return [
            { id: '1', name: 'Round 1' },
            { id: '2', name: 'Round 2' },
            { id: '3', name: 'Round 3' },
            { id: '4', name: 'Round 4' },
            { id: '5', name: 'Round 5' }
        ];
    }

    /**
     * Generates mock matchday data for Football Web Pages API
     * @returns {Array} Array of mock matchdays
     */
    getMockMatchdays() {
        return [
            { id: '1', name: 'Matchday 1' },
            { id: '2', name: 'Matchday 2' },
            { id: '3', name: 'Matchday 3' },
            { id: '4', name: 'Matchday 4' },
            { id: '5', name: 'Matchday 5' }
        ];
    }

    // ===== HELPER FUNCTIONS =====
    
    /**
     * Calculates similarity between two team names
     * @param {string} name1 - First team name
     * @param {string} name2 - Second team name
     * @returns {number} Similarity score (0-1)
     */
    calculateTeamNameSimilarity(name1, name2) {
        if (!name1 || !name2) return 0;
        
        const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalized1 = normalize(name1);
        const normalized2 = normalize(name2);
        
        if (normalized1 === normalized2) return 1;
        
        // Simple Levenshtein distance calculation
        const matrix = [];
        for (let i = 0; i <= normalized1.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= normalized2.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= normalized1.length; i++) {
            for (let j = 1; j <= normalized2.length; j++) {
                if (normalized1[i - 1] === normalized2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + 1
                    );
                }
            }
        }
        
        const distance = matrix[normalized1.length][normalized2.length];
        const maxLength = Math.max(normalized1.length, normalized2.length);
        return 1 - (distance / maxLength);
    }

    /**
     * Normalizes team names for comparison
     * @param {string} teamName - Team name to normalize
     * @returns {string} Normalized team name
     */
    normalizeTeamName(teamName) {
        if (!teamName) return '';
        
        return teamName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/fc|town|united|athletic|rovers|city|county/g, '');
    }

    /**
     * Groups fixtures by date
     * @param {Array} fixtures - Array of fixtures
     * @returns {Object} Fixtures grouped by date
     */
    groupFixturesByDate(fixtures) {
        if (!fixtures || !Array.isArray(fixtures)) {
            return {};
        }
        
        const grouped = {};
        fixtures.forEach(fixture => {
            const date = new Date(fixture.date);
            const dateKey = date.toDateString();
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(fixture);
        });
        
        return grouped;
    }

    // ===== REGISTRATION & DISPLAY UTILITIES =====
    
    /**
     * Shows registration closed message
     * @param {string} message - Message to display
     */
    showRegistrationClosed(message = 'Registration is currently closed') {
        const statusElement = document.getElementById('registration-window-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="registration-status">
                    <h3>Registration Closed</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Shows registration countdown timer
     * @param {Date} endDate - End date for countdown
     */
    showRegistrationCountdown(endDate) {
        const countdownElement = document.getElementById('registration-countdown');
        const timerElement = document.getElementById('countdown-timer');
        
        if (!countdownElement || !timerElement) return;
        
        countdownElement.style.display = 'block';
        
        const updateCountdown = () => {
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft <= 0) {
                timerElement.textContent = 'Registration Closed';
                return;
            }
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };
        
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        
        // Store interval for cleanup
        this.registrationCountdownInterval = interval;
    }

    /**
     * Shows next registration countdown timer
     * @param {Date} startDate - Start date for countdown
     */
    showNextRegistrationCountdown(startDate) {
        const nextCountdownElement = document.getElementById('next-registration-countdown');
        const nextTimerElement = document.getElementById('next-countdown-timer');
        
        if (!nextCountdownElement || !nextTimerElement) return;
        
        nextCountdownElement.style.display = 'block';
        
        const updateCountdown = () => {
            const now = new Date();
            const timeLeft = startDate - now;
            
            if (timeLeft <= 0) {
                nextTimerElement.textContent = 'Registration Open';
                return;
            }
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            nextTimerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };
        
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        
        // Store interval for cleanup
        this.nextRegistrationCountdownInterval = interval;
    }

    /**
     * Hides all registration countdown displays
     */
    hideRegistrationCountdowns() {
        const countdownElement = document.getElementById('registration-countdown');
        const nextCountdownElement = document.getElementById('next-registration-countdown');
        
        if (countdownElement) countdownElement.style.display = 'none';
        if (nextCountdownElement) nextCountdownElement.style.display = 'none';
        
        // Clear intervals
        if (this.registrationCountdownInterval) {
            clearInterval(this.registrationCountdownInterval);
        }
        if (this.nextRegistrationCountdownInterval) {
            clearInterval(this.nextRegistrationCountdownInterval);
        }
    }

    /**
     * Shows or hides the register button
     * @param {boolean} show - Whether to show the button
     */
    showRegisterButton(show) {
        const button = document.getElementById('register-now-button');
        if (button) {
            button.style.display = show ? 'inline-block' : 'none';
        }
    }

    // ===== MISCELLANEOUS UTILITIES =====
    
    /**
     * Resets As It Stands initialization flags
     */
    resetAsItStandsInitialization() {
        // Reset any initialization flags for the As It Stands tab
        window.asItStandsInitialized = false;
        window.asItStandsDataLoaded = false;
    }

    /**
     * Diagnoses As It Stands elements
     */
    diagnoseAsItStandsElements() {
        const elements = {
            'as-it-stands-tab': document.querySelector('[data-tab="as-it-stands"]'),
            'as-it-stands-content': document.querySelector('#as-it-stands-content'),
            'gameweek-selector': document.querySelector('#as-it-stands-gameweek-selector'),
            'standings-container': document.querySelector('#as-it-stands-standings')
        };
        
        console.log('As It Stands Elements Diagnosis:', elements);
        
        Object.entries(elements).forEach(([name, element]) => {
            if (element) {
                console.log(`✅ ${name}: Found`, element);
            } else {
                console.log(`❌ ${name}: Not found`);
            }
        });
    }

    /**
     * Manual testing function for As It Stands
     */
    testAsItStandsManually() {
        console.log('🧪 Manual testing of As It Stands functionality...');
        
        // Test element diagnosis
        this.diagnoseAsItStandsElements();
        
        // Test utility functions
        console.log('Testing utility functions...');
        console.log('getOrdinalSuffix(1):', this.getOrdinalSuffix(1));
        console.log('getOrdinalSuffix(2):', this.getOrdinalSuffix(2));
        console.log('getOrdinalSuffix(3):', this.getOrdinalSuffix(3));
        console.log('getOrdinalSuffix(4):', this.getOrdinalSuffix(4));
        
        console.log('Manual testing completed');
    }

    // ===== PICK VALIDATION UTILITIES =====
    
    /**
     * Checks if a pick is still valid
     * @param {Object} pick - Pick object
     * @param {Array} fixtures - Array of fixtures
     * @returns {Object} Validation result
     */
    checkPickStillValid(pick, fixtures) {
        if (!pick || !fixtures || !Array.isArray(fixtures)) {
            return { valid: false, reason: 'Invalid input' };
        }
        
        const fixture = fixtures.find(f => 
            f.homeTeam === pick.team || f.awayTeam === pick.team
        );
        
        if (!fixture) {
            return { valid: false, reason: 'Fixture not found' };
        }
        
        if (fixture.status === 'NS' || fixture.status === 'KO' || fixture.status === 'HT') {
            return { valid: true, reason: 'Game in progress or not started' };
        }
        
        if (fixture.status === 'FT' || fixture.status === 'COMP') {
            const homeScore = parseInt(fixture.homeScore) || 0;
            const awayScore = parseInt(fixture.awayScore) || 0;
            
            if (fixture.homeTeam === pick.team) {
                return { 
                    valid: homeScore > awayScore, 
                    reason: homeScore > awayScore ? 'Home team won' : 'Home team lost/drew'
                };
            } else if (fixture.awayTeam === pick.team) {
                return { 
                    valid: awayScore > homeScore, 
                    reason: awayScore > homeScore ? 'Away team won' : 'Away team lost/drew'
                };
            }
        }
        
        return { valid: false, reason: 'Unknown status' };
    }

    /**
     * Gets fixtures for a specific gameweek
     * @param {string} gameweek - Gameweek number
     * @returns {Promise<Array>} Array of fixtures
     */
    async getFixturesForGameweek(gameweek) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            let doc = await window.db.collection('fixtures').doc(editionGameweekKey).get();
            if (!doc.exists) {
                doc = await window.db.collection('fixtures').doc(gameweekKey).get();
            }
            
            if (doc.exists) {
                return doc.data().fixtures || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting fixtures for gameweek:', error);
            return [];
        }
    }

    // ===== INITIALIZATION & CLEANUP =====
    
    /**
     * Initializes the utilities manager
     */
    initializeUtilitiesManager() {
        console.log('🔧 Initializing Utilities Manager...');
        
        // Set up any event listeners or initialization logic here
        this.setupEventListeners();
        
        console.log('✅ Utilities Manager initialized successfully');
    }

    /**
     * Sets up event listeners for utility functions
     */
    setupEventListeners() {
        // Add any event listeners needed for utility functions
        console.log('🔧 Setting up utility event listeners...');
    }

    /**
     * Cleans up resources and intervals
     */
    cleanup() {
        console.log('🧹 Cleaning up Utilities Manager...');
        
        // Clear any intervals
        if (this.registrationCountdownInterval) {
            clearInterval(this.registrationCountdownInterval);
        }
        if (this.nextRegistrationCountdownInterval) {
            clearInterval(this.nextRegistrationCountdownInterval);
        }
        
        console.log('✅ Utilities Manager cleanup completed');
    }
}

// Export the class
export default UtilitiesManager;
