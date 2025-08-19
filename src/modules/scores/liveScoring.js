// Live Scoring Module
// Handles real-time score updates, auto-updates, and live score management

export class LiveScoring {
    constructor(db, currentActiveEdition = 1) {
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        this.autoUpdateInterval = null;
        this.realTimeUpdateInterval = null;
        this.isLoadingScores = false; // Flag to prevent multiple simultaneous loads
    }

    // Initialize live scoring functionality
    initializeLiveScoring() {
        console.log('Initializing live scoring...');
        this.setupEventListeners();
    }

    // Set up event listeners for live scoring functionality
    setupEventListeners() {
        // Auto score update buttons
        const startAutoUpdatesBtn = document.querySelector('#start-auto-updates-btn');
        const stopAutoUpdatesBtn = document.querySelector('#stop-auto-updates-btn');
        const statusDiv = document.querySelector('#auto-update-status');

        if (startAutoUpdatesBtn) {
            startAutoUpdatesBtn.addEventListener('click', () => {
                const gameweek = document.querySelector('#score-gameweek-select')?.value;
                if (gameweek) {
                    this.startAutoScoreUpdates(gameweek);
                    if (statusDiv) {
                        statusDiv.innerHTML = '<p class="success">✅ Auto score updates started. Checking every minute for half-time (45+ min) and full-time (105+ min) scores.</p>';
                    }
                }
            });
        }

        if (stopAutoUpdatesBtn) {
            stopAutoUpdatesBtn.addEventListener('click', () => {
                this.stopAutoScoreUpdates();
                if (statusDiv) {
                    statusDiv.innerHTML = '<p class="info">⏹️ Auto score updates stopped.</p>';
                }
            });
        }

        // Refresh scores button
        const refreshScoresBtn = document.querySelector('#refresh-scores-btn');
        if (refreshScoresBtn) {
            refreshScoresBtn.addEventListener('click', () => this.loadScoresForGameweek());
        }
    }

    // Load scores for a specific gameweek
    loadScoresForGameweek() {
        // Prevent multiple simultaneous loads
        if (this.isLoadingScores) {
            console.log('Scores already loading, skipping duplicate call');
            return Promise.resolve([]);
        }
        
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        
        // For player dashboard, use current active gameweek if no score selector found
        let gameweek;
        if (!scoreGameweekSelect) {
            // Check if we're in player dashboard (no admin panel)
            const isPlayerDashboard = !document.querySelector('#admin-panel');
            if (isPlayerDashboard) {
                // Use current active gameweek from app settings
                gameweek = window.app?.currentActiveGameweek || '1';
                console.log('Player dashboard detected, using current active gameweek:', gameweek);
            } else {
                console.log('Score gameweek select not found, skipping scores load');
                return Promise.resolve([]);
            }
        } else {
            gameweek = scoreGameweekSelect.value;
        }
        
        // Find the appropriate scores container
        let container = document.querySelector('#scores-container'); // Admin panel
        if (!container) {
            // Try player dashboard containers
            container = document.querySelector('#desktop-scores-display') || document.querySelector('#mobile-scores-display');
        }
        
        if (!container) {
            console.log('Scores container not found, skipping scores load');
            return Promise.resolve([]);
        }
        
        console.log(`loadScoresForGameweek called - gameweek: ${gameweek}, currentActiveEdition: ${this.currentActiveEdition}`);
        
        this.isLoadingScores = true;
        
        // Clear existing scores more thoroughly
        container.innerHTML = '';
        container.textContent = '';
        
        // Return a promise that resolves with the fixtures data
        return new Promise((resolve, reject) => {
            // Add a small delay to ensure DOM is cleared before loading new content
            setTimeout(async () => {
                try {
                    const fixtures = await this.loadScoresContent(gameweek, container);
                    resolve(fixtures);
                } catch (error) {
                    // Reset loading flag on error
                    this.isLoadingScores = false;
                    reject(error);
                } finally {
                    // Ensure loading flag is always reset
                    this.isLoadingScores = false;
                }
            }, 10);
        });
    }
    
        // Separate function to load the actual scores content
    async loadScoresContent(gameweek, container) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
        
        console.log(`Looking for fixtures in: ${editionGameweekKey}`);
        
        try {
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            
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
                    this.db.collection('fixtures').doc(editionGameweekKey).update({
                        fixtures: updatedFixtures
                    }).catch(error => {
                        console.error('Error updating fixtures with initialized fields:', error);
                    });
                }
                
                // Only add score rows if we're NOT in admin scores tab
                // Admin scores tab is handled by renderAdminScores to prevent duplication
                const isAdminScoresTab = document.querySelector('#scores-container') && 
                                       document.querySelector('#scores-container').closest('.gameweek-fixtures-section');
                
                if (!isAdminScoresTab) {
                    updatedFixtures.forEach((fixture, index) => {
                        this.addScoreRow(fixture, index);
                    });
                } else {
                    console.log('🔧 Admin scores tab detected - skipping addScoreRow to prevent duplication');
                }
                
                console.log(`✅ Scores loaded successfully for ${updatedFixtures.length} fixtures`);
                
                // Reset loading flag
                this.isLoadingScores = false;
                
                // Return the fixtures data
                return updatedFixtures;
            } else {
                // No fixtures found for this edition and gameweek - don't fall back to old structure
                console.log(`No fixtures found for Edition ${this.currentActiveEdition} Game Week ${gameweek} - not falling back to old structure`);
                container.innerHTML = `<p>No fixtures found for Edition ${this.currentActiveEdition} Game Week ${gameweek}. Please add fixtures first.</p>`;
                
                // Reset loading flag
                this.isLoadingScores = false;
                
                // Return empty array
                return [];
            }
        } catch (error) {
            console.error('Error loading scores from new structure:', error);
            container.innerHTML = `<p>Error loading fixtures for Edition ${this.currentActiveEdition} Game Week ${gameweek}. Please try again.</p>`;
            
            // Reset loading flag on error too
            this.isLoadingScores = false;
            
            // Re-throw the error
            throw error;
        }
    }

    // Add a score row for a fixture
    addScoreRow(fixture, index) {
        // Find the appropriate scores container
        let container = document.querySelector('#scores-container'); // Admin panel
        if (!container) {
            // Try player dashboard containers
            container = document.querySelector('#desktop-scores-display') || document.querySelector('#mobile-scores-display');
        }
        
        if (!container) {
            console.log('No scores container found for addScoreRow');
            return;
        }
        
        const scoreRow = document.createElement('div');
        scoreRow.className = 'score-row';
        
        // Format match time properly
        const matchTime = fixture.time ? fixture.time : (fixture.matchTime || 'TBC');
        
        // Determine which scores to show based on match status
        const isCompleted = fixture.completed || fixture.status === 'FT' || fixture.status === 'COMP';
        const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.homeScoreHT !== undefined && fixture.awayScoreHT !== null && fixture.awayScoreHT !== undefined;
        const hasFullTimeScores = fixture.homeScore !== null && fixture.homeScore !== undefined && fixture.awayScore !== null && fixture.awayScore !== undefined;
        
        // Show current score if we have any scores and match is not completed
        const hasCurrentScores = fixture.homeScore !== null && fixture.homeScore !== undefined && fixture.awayScore !== null && fixture.awayScore !== undefined;
        const showCurrentScore = !isCompleted && hasCurrentScores;
        
        // Show full-time scores only if match is completed and we have scores
        const showFullTimeScore = isCompleted && hasFullTimeScores;
        
        // Debug logging
        console.log(`Fixture ${index}: ${fixture.homeTeam} vs ${fixture.awayTeam}`, {
            homeScore: fixture.homeScore,
            awayScore: fixture.awayScore,
            hasCurrentScores,
            showCurrentScore,
            showFullTimeScore,
            isCompleted,
            status: fixture.status
        });
        
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
        
        const fullTimeHtml = showFullTimeScore ? `
                    <div class="full-time-scores">
                        <label>Full Time:</label>
                        <input type="number" class="home-score" placeholder="Home" value="${fixture.homeScore !== null && fixture.homeScore !== undefined ? fixture.homeScore : ''}" min="0">
                        <span>-</span>
                        <input type="number" class="away-score" placeholder="Away" value="${fixture.awayScore !== null && fixture.awayScore !== undefined ? fixture.awayScore : ''}" min="0">
                    </div>
                    ` : '';
        
        scoreRow.innerHTML = `
            <div class="score-inputs">
                <div class="fixture-info">
                    <span class="fixture-display">${fixture.homeTeam} vs ${fixture.awayTeam}</span>
                    <span class="match-time">${matchTime}</span>
                    <span class="match-status ${fixture.status || 'NS'}">${this.getStatusDisplay(fixture.status)}</span>
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
                        <option value="POSTP" ${fixture.status === 'POSTP' ? 'selected' : ''}>Postponed</option>
                        <option value="KO" ${fixture.status === 'KO' ? 'selected' : ''}>Kicked Off</option>
                        <option value="HT" ${fixture.status === 'HT' ? 'selected' : ''}>Half-time</option>
                        <option value="FT" ${fixture.status === 'FT' ? 'selected' : ''}>Full-time</option>
                        <option value="COMP" ${fixture.status === 'COMP' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
        `;
        
        container.appendChild(scoreRow);
    }

    // Helper function to display match status
    getStatusDisplay(status) {
        const statusMap = {
            'NS': 'Not Started',
            'POSTP': 'Postponed',
            'KO': 'Kicked Off',
            '1H': 'First Half',
            'HT': 'Half Time',
            '2H': 'Second Half',
            'FT': 'Full Time',
            'AET': 'Extra Time',
            'PEN': 'Penalties',
            'COMP': 'Completed',
            'LIVE': 'Live'
        };
        return statusMap[status] || status || 'Unknown';
    }

    // Start auto score updates
    startAutoScoreUpdates(gameweek) {
        console.log(`Starting auto score updates for gameweek ${gameweek}`);
        
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
        
        this.autoUpdateInterval = setInterval(() => {
            this.performAutoScoreUpdate(gameweek);
        }, 60000); // Check every minute
    }

    // Stop auto score updates
    stopAutoScoreUpdates() {
        console.log('Stopping auto score updates');
        
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
        }
    }

    // Perform auto score update
    async performAutoScoreUpdate(gameweek) {
        console.log(`Performing auto score update for gameweek ${gameweek}`);
        
        try {
            // This would implement the actual score update logic
            // For now, just log the attempt
            console.log('Auto score update logic not yet implemented');
        } catch (error) {
            console.error('Error during auto score update:', error);
        }
    }

    // Start real-time score updates
    startRealTimeScoreUpdates(gameweek) {
        console.log(`Starting real-time score updates for gameweek ${gameweek}`);
        
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }
        
        this.realTimeUpdateInterval = setInterval(() => {
            this.performRealTimeUpdate(gameweek);
        }, 30000); // Check every 30 seconds
    }

    // Stop real-time score updates
    stopRealTimeScoreUpdates() {
        console.log('Stopping real-time score updates');
        
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
            this.realTimeUpdateInterval = null;
        }
    }

    // Perform real-time update
    async performRealTimeUpdate(gameweek) {
        console.log(`Performing real-time update for gameweek ${gameweek}`);
        
        try {
            // This would implement the real-time score update logic
            // For now, just log the attempt
            console.log('Real-time update logic not yet implemented');
        } catch (error) {
            console.error('Error during real-time update:', error);
        }
    }

    // Cleanup resources
    cleanup() {
        this.stopAutoScoreUpdates();
        this.stopRealTimeScoreUpdates();
    }
}
