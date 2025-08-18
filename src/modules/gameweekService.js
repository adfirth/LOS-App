// Gameweek Service Module
// Centralized service for all gameweek operations and display logic

class GameweekService {
    constructor(db, deadlineService) {
        this.db = db;
        this.deadlineService = deadlineService;
        this.currentActiveGameweek = '1';
        this.currentActiveEdition = 1;
        this.gameweekCache = new Map(); // Cache gameweek data
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
    }

    // === CORE GAMEWEEK FUNCTIONS ===

    /**
     * Get the current active gameweek
     */
    getCurrentGameweek() {
        return this.currentActiveGameweek;
    }

    /**
     * Set the current active gameweek
     */
    setCurrentGameweek(gameweek) {
        this.currentActiveGameweek = gameweek;
        console.log(`🔧 Current gameweek set to: ${gameweek}`);
    }

    /**
     * Get the current active edition
     */
    getCurrentEdition() {
        return this.currentActiveEdition;
    }

    /**
     * Set the current active edition
     */
    setCurrentEdition(edition) {
        this.currentActiveEdition = edition;
        console.log(`🔧 Current edition set to: ${edition}`);
    }

    /**
     * Get all available gameweeks
     */
    getAllGameweeks() {
        return [
            { key: '1', label: 'Game Week 1', number: 1 },
            { key: '2', label: 'Game Week 2', number: 2 },
            { key: '3', label: 'Game Week 3', number: 3 },
            { key: '4', label: 'Game Week 4', number: 4 },
            { key: '5', label: 'Game Week 5', number: 5 },
            { key: '6', label: 'Game Week 6', number: 6 },
            { key: '7', label: 'Game Week 7', number: 7 },
            { key: '8', label: 'Game Week 8', number: 8 },
            { key: '9', label: 'Game Week 9', number: 9 },
            { key: '10', label: 'Game Week 10', number: 10 },
            { key: 'tiebreak', label: 'Tiebreak Round', number: 11 }
        ];
    }

    /**
     * Get gameweek by key
     */
    getGameweekByKey(key) {
        return this.getAllGameweeks().find(gw => gw.key === key);
    }

    /**
     * Get gameweek by number
     */
    getGameweekByNumber(number) {
        return this.getAllGameweeks().find(gw => gw.number === number);
    }

    /**
     * Get next gameweek
     */
    getNextGameweek(currentGameweek) {
        const currentNum = currentGameweek === 'tiebreak' ? 11 : parseInt(currentGameweek);
        const nextNum = currentNum + 1;
        
        if (nextNum > 11) return null;
        
        return nextNum === 11 ? 'tiebreak' : nextNum.toString();
    }

    /**
     * Get previous gameweek
     */
    getPreviousGameweek(currentGameweek) {
        const currentNum = currentGameweek === 'tiebreak' ? 11 : parseInt(currentGameweek);
        const prevNum = currentNum - 1;
        
        if (prevNum < 1) return null;
        
        return prevNum === 11 ? 'tiebreak' : prevNum.toString();
    }

    /**
     * Check if gameweek is valid
     */
    isValidGameweek(gameweek) {
        return this.getAllGameweeks().some(gw => gw.key === gameweek);
    }

    // === GAMEWEEK NAVIGATION ===

    /**
     * Navigate to a specific gameweek
     */
    async navigateToGameweek(gameweek, userData, userId) {
        if (!this.isValidGameweek(gameweek)) {
            console.error(`Invalid gameweek: ${gameweek}`);
            return false;
        }

        try {
            // Fetch fresh user data from database
            const freshUserDoc = await this.db.collection('users').doc(userId).get();
            const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : userData;
            
            // Update current gameweek
            this.setCurrentGameweek(gameweek);
            
            // Update UI displays
            this.updateGameweekDisplays(gameweek);
            
            // Update navigation buttons
            this.updateNavigationButtons(gameweek);
            
            // Update active tabs
            this.updateActiveTabs(gameweek);
            
            // Load fixtures for the selected gameweek
            if (window.loadFixturesForDeadline) {
                window.loadFixturesForDeadline(gameweek, freshUserData, userId);
            }
            
            console.log(`🔧 Navigated to gameweek ${gameweek}`);
            return true;
            
        } catch (error) {
            console.error('Error navigating to gameweek:', error);
            return false;
        }
    }

    /**
     * Navigate to next gameweek
     */
    async navigateToNextGameweek(userData, userId) {
        const currentGameweek = this.getCurrentGameweek();
        const nextGameweek = this.getNextGameweek(currentGameweek);
        
        if (nextGameweek) {
            return await this.navigateToGameweek(nextGameweek, userData, userId);
        }
        
        return false;
    }

    /**
     * Navigate to previous gameweek
     */
    async navigateToPreviousGameweek(userData, userId) {
        const currentGameweek = this.getCurrentGameweek();
        const prevGameweek = this.getPreviousGameweek(currentGameweek);
        
        if (prevGameweek) {
            return await this.navigateToGameweek(prevGameweek, userData, userId);
        }
        
        return false;
    }

    // === GAMEWEEK DISPLAY FUNCTIONS ===

    /**
     * Update all gameweek displays
     */
    updateGameweekDisplays(gameweek) {
        // Update desktop gameweek display
        const currentGameweekDisplay = document.querySelector('#current-gameweek-display');
        if (currentGameweekDisplay) {
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            currentGameweekDisplay.textContent = displayText;
        }

        // Update mobile gameweek display
        const mobileCurrentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
        if (mobileCurrentGameweekDisplay) {
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            mobileCurrentGameweekDisplay.textContent = displayText;
        }
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons(gameweek) {
        // Desktop navigation
        const prevButton = document.querySelector('#prev-gameweek');
        const nextButton = document.querySelector('#next-gameweek');
        this.updateNavigationButtonStates(prevButton, nextButton, gameweek);

        // Mobile navigation
        const mobilePrevButton = document.querySelector('#mobile-prev-gameweek');
        const mobileNextButton = document.querySelector('#mobile-next-gameweek');
        this.updateNavigationButtonStates(mobilePrevButton, mobileNextButton, gameweek);
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtonStates(prevButton, nextButton, gameweek) {
        if (!prevButton || !nextButton) return;
        
        const gameweekNum = gameweek === 'tiebreak' ? 11 : parseInt(gameweek);
        
        // Enable/disable previous button
        prevButton.disabled = gameweekNum <= 1;
        
        // Enable/disable next button
        nextButton.disabled = gameweekNum >= 11;
    }

    /**
     * Update active tabs
     */
    updateActiveTabs(gameweek) {
        // Desktop tabs
        const gameweekTabs = document.querySelectorAll('.gameweek-tab');
        this.updateActiveTabStates(gameweekTabs, gameweek);

        // Mobile tabs
        const mobileGameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
        this.updateActiveTabStates(mobileGameweekTabs, gameweek);
    }

    /**
     * Update active tab states
     */
    updateActiveTabStates(tabs, gameweek) {
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.gameweek === gameweek) {
                tab.classList.add('active');
            }
        });
    }

    /**
     * Update tab states based on deadlines
     */
    async updateTabStates(gameweekTabs) {
        for (const tab of gameweekTabs) {
            const gameweek = tab.dataset.gameweek;
            try {
                const isDeadlinePassed = await this.deadlineService.isDeadlinePassed(gameweek, this.currentActiveEdition);
                if (isDeadlinePassed) {
                    tab.classList.add('locked');
                } else {
                    tab.classList.remove('locked');
                }
            } catch (error) {
                console.error(`Error updating tab state for gameweek ${gameweek}:`, error);
            }
        }
    }

    // === GAMEWEEK INITIALIZATION ===

    /**
     * Initialize gameweek navigation
     */
    async initializeGameweekNavigation(currentGameWeek, userData, userId) {
        // Set current gameweek
        this.setCurrentGameweek(currentGameWeek);
        
        // Update displays
        this.updateGameweekDisplays(currentGameWeek);
        
        // Update navigation buttons
        this.updateNavigationButtons(currentGameWeek);
        
        // Update active tabs
        this.updateActiveTabs(currentGameWeek);
        
        // Set up event listeners
        this.setupGameweekEventListeners(currentGameWeek, userData, userId);
        
        // Update tab states based on deadlines
        const gameweekTabs = document.querySelectorAll('.gameweek-tab');
        await this.updateTabStates(gameweekTabs);
        
        console.log(`🔧 Gameweek navigation initialized for gameweek ${currentGameWeek}`);
    }

    /**
     * Initialize mobile gameweek navigation
     */
    async initializeMobileGameweekNavigation(currentGameWeek, userData, userId) {
        // Set current gameweek
        this.setCurrentGameweek(currentGameWeek);
        
        // Update displays
        this.updateGameweekDisplays(currentGameWeek);
        
        // Update navigation buttons
        this.updateNavigationButtons(currentGameWeek);
        
        // Update active tabs
        this.updateActiveTabs(currentGameWeek);
        
        // Set up mobile event listeners
        this.setupMobileGameweekEventListeners(currentGameWeek, userData, userId);
        
        // Update tab states based on deadlines
        const mobileGameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
        await this.updateTabStates(mobileGameweekTabs);
        
        console.log(`🔧 Mobile gameweek navigation initialized for gameweek ${currentGameWeek}`);
    }

    // === EVENT LISTENERS ===

    /**
     * Set up gameweek event listeners
     */
    setupGameweekEventListeners(currentGameWeek, userData, userId) {
        // Previous/Next buttons
        const prevButton = document.querySelector('#prev-gameweek');
        const nextButton = document.querySelector('#next-gameweek');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateToPreviousGameweek(userData, userId));
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateToNextGameweek(userData, userId));
        }
        
        // Gameweek tabs
        const gameweekTabs = document.querySelectorAll('.gameweek-tab');
        gameweekTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const gameweek = tab.dataset.gameweek;
                this.navigateToGameweek(gameweek, userData, userId);
            });
        });
    }

    /**
     * Set up mobile gameweek event listeners
     */
    setupMobileGameweekEventListeners(currentGameWeek, userData, userId) {
        // Previous/Next buttons
        const mobilePrevButton = document.querySelector('#mobile-prev-gameweek');
        const mobileNextButton = document.querySelector('#mobile-next-gameweek');
        
        if (mobilePrevButton) {
            mobilePrevButton.addEventListener('click', () => this.navigateToPreviousGameweek(userData, userId));
        }
        
        if (mobileNextButton) {
            mobileNextButton.addEventListener('click', () => this.navigateToNextGameweek(userData, userId));
        }
        
        // Gameweek tabs
        const mobileGameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
        mobileGameweekTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const gameweek = tab.dataset.gameweek;
                this.navigateToGameweek(gameweek, userData, userId);
            });
        });
    }

    // === TIEBREAK HANDLING ===

    /**
     * Check if tiebreak is enabled
     */
    async isTiebreakEnabled() {
        try {
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                return settings.tiebreak_enabled || false;
            }
            return false;
        } catch (error) {
            console.error('Error checking tiebreak status:', error);
            return false;
        }
    }

    /**
     * Handle tiebreak visibility
     */
    async handleTiebreakVisibility() {
        const tiebreakEnabled = await this.isTiebreakEnabled();
        
        // Desktop tiebreak tab
        const tiebreakTab = document.querySelector('.tiebreak-tab');
        if (tiebreakTab) {
            tiebreakTab.style.display = tiebreakEnabled ? 'inline-block' : 'none';
        }
        
        // Mobile tiebreak tab
        const mobileTiebreakTab = document.querySelector('.mobile-gameweek-tabs .tiebreak-tab');
        if (mobileTiebreakTab) {
            mobileTiebreakTab.style.display = tiebreakEnabled ? 'inline-block' : 'none';
        }
        
        // If tiebreak is disabled and current gameweek is tiebreak, switch to GW10
        if (!tiebreakEnabled && this.currentActiveGameweek === 'tiebreak') {
            console.log('🔧 Tiebreak disabled, switching to Game Week 10');
            this.setCurrentGameweek('10');
        }
    }

    // === CACHE MANAGEMENT ===

    /**
     * Clear gameweek cache
     */
    clearCache() {
        this.gameweekCache.clear();
        console.log('🔧 Gameweek cache cleared');
    }

    /**
     * Clear specific gameweek cache
     */
    clearGameweekCache(gameweek) {
        this.gameweekCache.delete(gameweek);
        console.log(`🔧 Gameweek cache cleared for ${gameweek}`);
    }
}

// Export the GameweekService class
export default GameweekService;
