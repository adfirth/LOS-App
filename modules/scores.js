// Scores Module
// Handles all score-related functionality including management, processing, calculations, and results

class ScoresManager {
    constructor(db) {
        this.db = db;
        this.scoresManagementInitialized = false;
        this.processedGameweeks = new Set();
        this.autoUpdateInterval = null;
        this.realTimeUpdateInterval = null;
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
            saveScoresBtn.addEventListener('click', () => this.saveScores());
        }

        // Score gameweek selector
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        if (scoreGameweekSelect) {
            scoreGameweekSelect.addEventListener('change', () => this.loadScoresForGameweek());
        }

        // Import Football WebPages scores button
        const importFootballWebPagesScoresBtn = document.querySelector('#import-football-webpages-scores-btn');
        if (importFootballWebPagesScoresBtn) {
            importFootballWebPagesScoresBtn.addEventListener('click', () => {
                const gameweek = scoreGameweekSelect.value;
                this.importScoresFromFootballWebPages(gameweek);
            });
        }

        // Refresh scores button
        const refreshScoresBtn = document.querySelector('#refresh-scores-btn');
        if (refreshScoresBtn) {
            refreshScoresBtn.addEventListener('click', () => this.loadScoresForGameweek());
        }

        // Scores file input
        const scoresFileInput = document.querySelector('#scores-file-input');
        if (scoresFileInput) {
            scoresFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const gameweek = scoreGameweekSelect.value;
                this.importScoresFromFile(file, gameweek);
            });
        }

        // Auto score update buttons
        const startAutoUpdatesBtn = document.querySelector('#start-auto-updates-btn');
        const stopAutoUpdatesBtn = document.querySelector('#stop-auto-updates-btn');
        const statusDiv = document.querySelector('#auto-update-status');

        if (startAutoUpdatesBtn) {
            startAutoUpdatesBtn.addEventListener('click', () => {
                const gameweek = scoreGameweekSelect.value;
                this.startAutoScoreUpdates(gameweek);
                if (statusDiv) {
                    statusDiv.innerHTML = '<p class="success">✅ Auto score updates started. Checking every minute for half-time (45+ min) and full-time (105+ min) scores.</p>';
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
    }

    // Initialize scores display
    initializeScoresDisplay() {
        // Only load if the required elements exist
        if (document.querySelector('#score-gameweek-select') && document.querySelector('#scores-container')) {
            // Load initial scores for the current edition
            if (typeof this.loadScoresForGameweek === 'function') {
                this.loadScoresForGameweek();
            }
        }
    }

    // Load scores for a specific gameweek
    loadScoresForGameweek() {
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        const container = document.querySelector('#scores-container');
        
        if (!scoreGameweekSelect) {
            console.log('Score gameweek select not found, skipping scores load');
            return;
        }
        
        if (!container) {
            console.log('Scores container not found, skipping scores load');
            return;
        }
        
        const gameweek = scoreGameweekSelect.value;
        
        console.log(`loadScoresForGameweek called - gameweek: ${gameweek}, currentActiveEdition: ${window.currentActiveEdition}`);
        
        container.innerHTML = ''; // Clear existing scores
        
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
        
        console.log(`Looking for fixtures in: ${editionGameweekKey}`);
        
        this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
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
                
                updatedFixtures.forEach((fixture, index) => {
                    this.addScoreRow(fixture, index);
                });
            } else {
                // No fixtures found for this edition and gameweek - don't fall back to old structure
                console.log(`No fixtures found for Edition ${window.currentActiveEdition} Game Week ${gameweek} - not falling back to old structure`);
                container.innerHTML = `<p>No fixtures found for Edition ${window.currentActiveEdition} Game Week ${gameweek}. Please add fixtures first.</p>`;
            }
        }).catch(error => {
            console.error('Error loading scores from new structure:', error);
            container.innerHTML = `<p>Error loading fixtures for Edition ${window.currentActiveEdition} Game Week ${gameweek}. Please try again.</p>`;
        });
    }

    // Add a score row for a fixture
    addScoreRow(fixture, index) {
        const container = document.querySelector('#scores-container');
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
        
        // Debug logging
        console.log(`Fixture ${index}: ${fixture.homeTeam} vs ${fixture.awayTeam}`, {
            homeScore: fixture.homeScore,
            awayScore: fixture.awayScore,
            hasCurrentScores,
            showCurrentScore,
            isCompleted,
            status: fixture.status
        });
        
        // Additional debug for HTML generation
        if (showCurrentScore) {
            console.log(`Fixture ${index}: Current score section should be visible`);
        } else {
            console.log(`Fixture ${index}: Current score section hidden - isCompleted: ${isCompleted}, hasCurrentScores: ${hasCurrentScores}`);
        }
        
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
        
        const fullTimeHtml = (hasFullTimeScores || !isCompleted) ? `
                    <div class="full-time-scores">
                        <label>Full Time:</label>
                        <input type="number" class="home-score" placeholder="Home" value="${fixture.homeScore !== null && fixture.homeScore !== undefined ? fixture.homeScore : ''}" min="0">
                        <span>-</span>
                        <input type="number" class="away-score" placeholder="Away" value="${fixture.awayScore !== null && fixture.awayScore !== undefined ? fixture.awayScore : ''}" min="0">
                    </div>
                    ` : '';
        
        // Debug HTML generation
        if (showCurrentScore) {
            console.log(`Fixture ${index}: Current score HTML:`, currentScoreHtml);
            console.log(`Fixture ${index}: Raw score values - homeScore: "${fixture.homeScore}" (type: ${typeof fixture.homeScore}), awayScore: "${fixture.awayScore}" (type: ${typeof fixture.awayScore})`);
        }
        
        // Debug half-time scores
        console.log(`Fixture ${index}: Half-time score values - homeScoreHT: "${fixture.homeScoreHT}" (type: ${typeof fixture.homeScoreHT}), awayScoreHT: "${fixture.awayScoreHT}" (type: ${typeof fixture.awayScoreHT})`);
        console.log(`Fixture ${index}: Half-time HTML:`, halfTimeHtml);
        
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

    // Save scores for a gameweek
    saveScores() {
        const gameweek = document.querySelector('#score-gameweek-select').value;
        const scoreRows = document.querySelectorAll('.score-row');
        const updatedFixtures = [];

        console.log(`saveScores called - gameweek: ${gameweek}, currentActiveEdition: ${window.currentActiveEdition}`);

        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
        
        console.log(`Attempting to save scores for ${editionGameweekKey}`);
        this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                console.log(`Found ${fixtures.length} fixtures for ${editionGameweekKey}`);
                
                scoreRows.forEach((row, index) => {
                    if (fixtures[index]) {
                        // Handle current scores (if present)
                        const currentHomeScore = row.querySelector('.home-score-current');
                        const currentAwayScore = row.querySelector('.away-score-current');
                        
                        // Use current score if available, otherwise use full-time score
                        let homeScore, awayScore;
                        if (currentHomeScore && currentAwayScore) {
                            homeScore = currentHomeScore.value;
                            awayScore = currentAwayScore.value;
                        } else {
                            const homeScoreElement = row.querySelector('.home-score');
                            const awayScoreElement = row.querySelector('.away-score');
                            homeScore = homeScoreElement ? homeScoreElement.value : null;
                            awayScore = awayScoreElement ? awayScoreElement.value : null;
                        }
                        
                        const homeScoreHTElement = row.querySelector('.home-score-ht');
                        const awayScoreHTElement = row.querySelector('.away-score-ht');
                        const completedElement = row.querySelector('.fixture-completed');
                        const statusElement = row.querySelector('.match-status-select');
                        
                        const homeScoreHT = homeScoreHTElement ? homeScoreHTElement.value : null;
                        const awayScoreHT = awayScoreHTElement ? awayScoreHTElement.value : null;
                        const completed = completedElement ? completedElement.checked : false;
                        const status = statusElement ? statusElement.value : 'FT';
                        
                        updatedFixtures.push({
                            ...fixtures[index],
                            homeScore: homeScore ? parseInt(homeScore) : null,
                            awayScore: awayScore ? parseInt(awayScore) : null,
                            homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
                            awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
                            completed: completed,
                            status: status
                        });
                    }
                });

                this.db.collection('fixtures').doc(editionGameweekKey).update({
                    fixtures: updatedFixtures
                }).then(() => {
                    const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
                    alert(`Scores saved for ${displayText}`);
                    // Process results to update lives
                    this.processResults(gameweek, updatedFixtures);
                }).catch(error => {
                    console.error('Error saving scores:', error);
                    alert('Error saving scores');
                });
            } else {
                console.log(`No fixtures document found for ${editionGameweekKey} - checking old structure`);
                
                // Fallback to old structure
                this.db.collection('fixtures').doc(gameweekKey).get().then(oldDoc => {
                    if (oldDoc.exists) {
                        const fixtures = oldDoc.data().fixtures;
                        console.log(`Found ${fixtures.length} fixtures in old structure for ${gameweekKey}`);
                        
                        scoreRows.forEach((row, index) => {
                            if (fixtures[index]) {
                                // Handle current scores (if present)
                                const currentHomeScore = row.querySelector('.home-score-current');
                                const currentAwayScore = row.querySelector('.away-score-current');
                                
                                // Use current score if available, otherwise use full-time score
                                let homeScore, awayScore;
                                if (currentHomeScore && currentAwayScore) {
                                    homeScore = currentHomeScore.value;
                                    awayScore = currentAwayScore.value;
                                } else {
                                    const homeScoreElement = row.querySelector('.home-score');
                                    const awayScoreElement = row.querySelector('.away-score');
                                    homeScore = homeScoreElement ? homeScoreElement.value : null;
                                    awayScore = awayScoreElement ? awayScoreElement.value : null;
                                }
                                
                                const homeScoreHTElement = row.querySelector('.home-score-ht');
                                const awayScoreHTElement = row.querySelector('.away-score-ht');
                                const completedElement = row.querySelector('.fixture-completed');
                                const statusElement = row.querySelector('.match-status-select');
                                
                                const homeScoreHT = homeScoreHTElement ? homeScoreHTElement.value : null;
                                const awayScoreHT = awayScoreHTElement ? awayScoreHTElement.value : null;
                                const completed = completedElement ? completedElement.checked : false;
                                const status = statusElement ? statusElement.value : 'FT';
                                
                                fixtures[index] = {
                                    ...fixtures[index],
                                    homeScore: homeScore ? parseInt(homeScore) : null,
                                    awayScore: awayScore ? parseInt(awayScore) : null,
                                    homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
                                    awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
                                    completed: completed,
                                    status: status
                                };
                            }
                        });

                        // Save to old structure
                        this.db.collection('fixtures').doc(gameweekKey).update({
                            fixtures: fixtures
                        }).then(() => {
                            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
                            alert(`Scores saved for ${displayText}`);
                            // Process results to update lives
                            this.processResults(gameweek, fixtures);
                        }).catch(error => {
                            console.error('Error saving scores to old structure:', error);
                            alert('Error saving scores');
                        });
                    } else {
                        console.log(`No fixtures document found in old structure either - creating empty document`);
                        
                        // Create empty fixtures array for this gameweek
                        const emptyFixtures = [];
                        
                        // Create the document with empty fixtures
                        this.db.collection('fixtures').doc(editionGameweekKey).set({
                            fixtures: emptyFixtures
                        }).then(() => {
                            console.log(`Created empty fixtures document for ${editionGameweekKey}`);
                            alert(`Created empty fixtures document for ${gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`}. Please add fixtures first, then save scores.`);
                        }).catch(error => {
                            console.error('Error creating fixtures document:', error);
                            alert('Error creating fixtures document. Please try again.');
                        });
                    }
                }).catch(oldError => {
                    console.error('Error checking old structure:', oldError);
                    alert('Error accessing fixtures. Please try again.');
                });
            }
        }).catch(error => {
            console.error('Error accessing fixtures document:', error);
            alert('Error accessing fixtures. Please try again.');
        });
    }

    // Process results and update player lives
    processResults(gameweek, fixtures) {
        // This function processes the results and deducts lives from players
        // who picked losing teams
        const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
        console.log(`Processing results for ${displayText}`);
        
        // Check if this gameweek has already been processed
        if (this.processedGameweeks.has(gameweek)) {
            console.log(`Gameweek ${gameweek} has already been processed, skipping to prevent duplicate life deduction`);
            return;
        }
        
        // Only process if we have completed fixtures
        const completedFixtures = fixtures.filter(fixture => fixture.completed && fixture.homeScore !== null && fixture.awayScore !== null);
        
        if (completedFixtures.length === 0) {
            console.log('No completed fixtures to process');
            return;
        }
        
        // Mark this gameweek as processed
        this.processedGameweeks.add(gameweek);
        console.log(`Marking gameweek ${gameweek} as processed`);
        
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        
        // Get all users and their picks for this gameweek
        this.db.collection('users').get().then(querySnapshot => {
            querySnapshot.forEach(userDoc => {
                const userData = userDoc.data();
                
                // Get user's edition to determine the correct pick key
                const userEdition = this.getUserEdition(userData);
                const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;
                
                // Try new structure first, then fallback to old structure
                let userPick = userData.picks && userData.picks[editionGameweekKey];
                if (!userPick && userData.picks && userData.picks[gameweekKey]) {
                    userPick = userData.picks[gameweekKey];
                    console.log(`Using old pick structure for user ${userData.displayName}`);
                }
                
                if (!userPick) {
                    console.log(`No pick found for user ${userData.displayName} in ${editionGameweekKey} or ${gameweekKey}`);
                    return;
                }
                
                console.log(`Processing results for ${userData.displayName}: picked ${userPick} in ${editionGameweekKey}`);
                
                // Check if the user's pick lost any matches
                let livesLost = 0;
                
                completedFixtures.forEach(fixture => {
                    const homeTeam = fixture.homeTeam;
                    const awayTeam = fixture.awayTeam;
                    const homeScore = fixture.homeScore;
                    const awayScore = fixture.awayScore;
                    
                    // Determine the winner (or if it's a draw)
                    let winner = null;
                    if (homeScore > awayScore) {
                        winner = homeTeam;
                    } else if (awayScore > homeScore) {
                        winner = awayTeam;
                    }
                    
                    // If there's a winner and the user's pick is the loser, they lose a life
                    if (winner && winner !== userPick) {
                        if (userPick === homeTeam || userPick === awayTeam) {
                            livesLost++;
                            console.log(`${userData.displayName} loses a life: picked ${userPick}, ${winner} won`);
                        }
                    }
                });
                
                // Update user's lives if they lost any
                if (livesLost > 0) {
                    const currentLives = userData.lives || 2;
                    const newLives = Math.max(0, currentLives - livesLost);
                    
                    this.db.collection('users').doc(userDoc.id).update({
                        lives: newLives
                    }).then(() => {
                        console.log(`${userData.displayName}: ${currentLives} → ${newLives} lives (lost ${livesLost})`);
                    }).catch(error => {
                        console.error(`Error updating lives for ${userData.displayName}:`, error);
                    });
                } else {
                    console.log(`${userData.displayName} didn't lose any lives this gameweek`);
                }
            });
        }).catch(error => {
            console.error('Error processing results:', error);
        });
    }

    // Get user's edition
    getUserEdition(userData) {
        if (userData.defaultEdition) {
            return userData.defaultEdition;
        }
        
        if (userData.registeredEditions && userData.registeredEditions.length > 0) {
            return userData.registeredEditions[0];
        }
        
        return 1; // Default to Edition 1
    }

    // Import scores from file
    async importScoresFromFile(file, gameweek) {
        console.log('importScoresFromFile called with gameweek:', gameweek);
        
        try {
            const text = await file.text();
            const scores = JSON.parse(text);
            
            if (Array.isArray(scores)) {
                console.log(`Importing ${scores.length} scores from file`);
                // Process the imported scores
                // This would need to be implemented based on the file format
            } else {
                console.error('Invalid file format: expected array of scores');
                alert('Invalid file format. Please check the file and try again.');
            }
        } catch (error) {
            console.error('Error importing scores from file:', error);
            alert('Error importing scores: ' + error.message);
        }
    }

    // Import scores from Football WebPages API
    async importScoresFromFootballWebPages(gameweek) {
        console.log(`Importing scores from Football WebPages for gameweek ${gameweek}`);
        
        try {
            // This would implement the Football WebPages API integration
            // For now, just log the attempt
            console.log('Football WebPages API integration not yet implemented');
        } catch (error) {
            console.error('Error importing scores from Football WebPages:', error);
        }
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

    // Load player scores for scores tab
    async loadPlayerScores() {
        try {
            const gameweek = window.currentActiveGameweek;
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                console.log(`Found ${fixtures.length} fixtures for player scores`);
                return fixtures;
            } else {
                console.log('No fixtures found for player scores');
                return [];
            }
        } catch (error) {
            console.error('Error loading player scores:', error);
            return [];
        }
    }

    // Render player scores for scores tab
    async renderPlayerScores(fixtures, gameweek) {
        try {
            this.renderDesktopPlayerScores(fixtures, gameweek);
            this.renderMobilePlayerScores(fixtures, gameweek);
        } catch (error) {
            console.error('Error rendering player scores:', error);
        }
    }

    // Render desktop player scores
    renderDesktopPlayerScores(fixtures, gameweek) {
        console.log('renderDesktopPlayerScores called with:', { fixtures, gameweek });
        
        const desktopScoresDisplay = document.querySelector('#desktop-scores-display');
        if (!desktopScoresDisplay) {
            console.error('Desktop scores display element not found');
            return;
        }
        
        if (!fixtures || fixtures.length === 0) {
            console.log('No fixtures to render for desktop');
            return;
        }
        
        // Sort fixtures by date
        const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let scoresHTML = `
            <div class="scores-header">
                <h4>Game Week ${gameweek === 'tiebreak' ? 'Tiebreak' : gameweek} Results</h4>
            </div>
            <div class="scores-container">
        `;
        
        for (const fixture of sortedFixtures) {
            const fixtureDate = new Date(fixture.date);
            const homeBadge = this.getTeamBadge(fixture.homeTeam);
            const awayBadge = this.getTeamBadge(fixture.awayTeam);
            
            const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}" class="team-badge">` : '';
            const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}" class="team-badge">` : '';
            
            // Determine score display
            let scoreDisplay = '';
            let statusClass = '';
            
            if (fixture.completed || fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                // Full-time result with half-time scores if available
                const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
                scoreDisplay = `
                    <div class="score-result">
                        <span class="score">${fixture.homeScore || 0}</span>
                        <span class="score-separator">-</span>
                        <span class="score">${fixture.awayScore || 0}</span>
                    </div>
                    ${hasHalfTimeScores ? `
                        <div class="half-time-scores">
                            <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                        </div>
                    ` : ''}
                `;
                statusClass = 'completed';
            } else if (fixture.status === 'HT' && fixture.homeScoreHT !== null && fixture.awayScoreHT !== null) {
                // Half-time result
                scoreDisplay = `
                    <div class="score-result">
                        <span class="score">${fixture.homeScoreHT}</span>
                        <span class="score-separator">-</span>
                        <span class="score">${fixture.awayScoreHT}</span>
                        <span class="score-status">HT</span>
                    </div>
                `;
                statusClass = 'half-time';
            } else if (fixture.status === '1H' || fixture.status === '2H' || fixture.status === 'LIVE') {
                // Live match with current scores and half-time if available
                const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
                scoreDisplay = `
                    <div class="score-result">
                        <span class="score">${fixture.homeScore || 0}</span>
                        <span class="score-separator">-</span>
                        <span class="score">${fixture.awayScore || 0}</span>
                        <span class="score-status live">LIVE</span>
                    </div>
                    ${hasHalfTimeScores ? `
                        <div class="half-time-scores">
                            <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                        </div>
                    ` : ''}
                `;
                statusClass = 'live';
            } else {
                // Not started
                scoreDisplay = `
                    <div class="score-result">
                        <span class="score-placeholder">vs</span>
                    </div>
                `;
                statusClass = 'not-started';
            }
            
            scoresHTML += `
                <div class="score-fixture ${statusClass}">
                    <div class="fixture-teams">
                        <div class="team home-team">
                            ${homeBadgeHtml}
                            <span class="team-name">${fixture.homeTeam}</span>
                        </div>
                        ${scoreDisplay}
                        <div class="team away-team">
                            <span class="team-name">${fixture.awayTeam}</span>
                            ${awayBadgeHtml}
                        </div>
                    </div>
                    <div class="fixture-info">
                        <div class="fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div class="fixture-status">${this.getStatusDisplay(fixture.status)}</div>
                    </div>
                </div>
            `;
        }
        
        scoresHTML += '</div>';
        desktopScoresDisplay.innerHTML = scoresHTML;
    }

    // Render mobile player scores
    renderMobilePlayerScores(fixtures, gameweek) {
        console.log('renderMobilePlayerScores called with:', { fixtures, gameweek });
        
        const mobileScoresDisplay = document.querySelector('#mobile-scores-display');
        if (!mobileScoresDisplay) {
            console.error('Mobile scores display element not found');
            return;
        }
        
        if (!fixtures || fixtures.length === 0) {
            console.log('No fixtures to render for mobile');
            return;
        }
        
        // Sort fixtures by date
        const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let scoresHTML = `
            <div class="mobile-scores-header">
                <h4>Game Week ${gameweek === 'tiebreak' ? 'Tiebreak' : gameweek} Results</h4>
            </div>
            <div class="mobile-scores-container">
        `;
        
        for (const fixture of sortedFixtures) {
            const fixtureDate = new Date(fixture.date);
            const homeBadge = this.getTeamBadge(fixture.homeTeam);
            const awayBadge = this.getTeamBadge(fixture.awayTeam);
            
            const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}" class="team-badge">` : '';
            const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}" class="team-badge">` : '';
            
            // Determine score display
            let scoreDisplay = '';
            let statusClass = '';
            
            if (fixture.completed || fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                // Full-time result with half-time scores if available
                const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
                scoreDisplay = `
                    <div class="mobile-score-result">
                        <span class="mobile-score">${fixture.homeScore || 0}</span>
                        <span class="mobile-score-separator">-</span>
                        <span class="mobile-score">${fixture.awayScore || 0}</span>
                    </div>
                    ${hasHalfTimeScores ? `
                        <div class="mobile-half-time-scores">
                            <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
                        </div>
                    ` : ''}
                `;
                statusClass = 'completed';
            } else if (fixture.status === 'HT' && fixture.homeScoreHT !== null && fixture.awayScoreHT !== null) {
                // Half-time result
                scoreDisplay = `
                    <div class="mobile-score-result">
                        <span class="mobile-score">${fixture.homeScoreHT}</span>
                        <span class="mobile-score-separator">-</span>
                        <span class="mobile-score">${fixture.awayScoreHT}</span>
                        <span class="mobile-score-status">HT</span>
                    </div>
                `;
                statusClass = 'half-time';
            } else if (fixture.status === '1H' || fixture.status === '2H' || fixture.status === 'LIVE') {
                // Live match with current scores and half-time if available
                const hasHalfTimeScores = fixture.homeScoreHT !== null && fixture.awayScoreHT !== null;
                scoreDisplay = `
                    <div class="mobile-score-result">
                        <span class="mobile-score">${fixture.homeScore || 0}</span>
                        <span class="mobile-score-separator">-</span>
                        <span class="mobile-score">${fixture.awayScore || 0}</span>
                        <span class="mobile-score-status live">LIVE</span>
                    </div>
                    ${hasHalfTimeScores ? `
                        <div class="mobile-half-time-scores">
                            <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</span>
                        </div>
                    ` : ''}
                `;
                statusClass = 'live';
            } else {
                // Not started
                scoreDisplay = `
                    <div class="mobile-score-result">
                        <span class="mobile-score-placeholder">vs</span>
                    </div>
                `;
                statusClass = 'not-started';
            }
            
            scoresHTML += `
                <div class="mobile-score-fixture ${statusClass}">
                    <div class="mobile-fixture-teams">
                        <div class="mobile-team home-team">
                            ${homeBadgeHtml}
                            <span class="mobile-team-name">${fixture.homeTeam}</span>
                        </div>
                        ${scoreDisplay}
                        <div class="mobile-team away-team">
                            <span class="mobile-team-name">${fixture.awayTeam}</span>
                            ${awayBadgeHtml}
                        </div>
                    </div>
                    <div class="mobile-fixture-info">
                        <div class="mobile-fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="mobile-fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div class="mobile-fixture-status">${this.getStatusDisplay(fixture.status)}</div>
                    </div>
                </div>
            `;
        }
        
        scoresHTML += '</div>';
        mobileScoresDisplay.innerHTML = scoresHTML;
    }

    // Show no scores message
    showNoScoresMessage(edition = null) {
        const desktopScoresDisplay = document.querySelector('#desktop-scores-display');
        const mobileScoresDisplay = document.querySelector('#mobile-scores-display');
        
        let noScoresMessage = '';
        
        if (edition === 'test') {
            noScoresMessage = `
                <div class="no-scores-message">
                    <h3>Test Edition - No Fixtures Available</h3>
                    <p>This is the test edition. No fixtures have been created yet.</p>
                    <p>To see scores, you would need to:</p>
                    <ul>
                        <li>Create fixtures in the admin panel</li>
                        <li>Or switch to a different edition that has fixtures</li>
                    </ul>
                    <p>For now, you can explore the other tabs to see how the app works!</p>
                </div>
            `;
        } else {
            noScoresMessage = `
                <div class="no-scores-message">
                    <p>No scores available for this gameweek yet.</p>
                    <p>Scores will appear here once matches are played and results are updated.</p>
                </div>
            `;
        }
        
        if (desktopScoresDisplay) {
            desktopScoresDisplay.innerHTML = noScoresMessage;
        }
        if (mobileScoresDisplay) {
            mobileScoresDisplay.innerHTML = noScoresMessage;
        }
    }

    // Get team badge (placeholder - would need to be implemented)
    getTeamBadge(teamName) {
        // This would return the URL to the team's badge image
        // For now, return null
        return null;
    }

    // Check if pick is still valid
    checkPickStillValid(pick, fixtures) {
        const completedFixtures = fixtures.filter(f => f.status === 'completed' && f.homeScore !== null && f.awayScore !== null);
        
        for (const fixture of completedFixtures) {
            const homeScore = fixture.homeScore;
            const awayScore = fixture.awayScore;
            
            if (homeScore > awayScore && fixture.awayTeam === pick) {
                return false; // Pick lost
            } else if (awayScore > homeScore && fixture.homeTeam === pick) {
                return false; // Pick lost
            } else if (homeScore === awayScore) {
                // Draw - pick is still valid
            }
        }
        
        return true; // Pick is still valid
    }

    // Calculate pick result
    calculatePickResult(pick, fixtures) {
        const completedFixtures = fixtures.filter(f => f.status === 'completed' && f.homeScore !== null && f.awayScore !== null);
        
        for (const fixture of completedFixtures) {
            const homeScore = fixture.homeScore;
            const awayScore = fixture.awayScore;
            
            if (homeScore > awayScore && fixture.awayTeam === pick) {
                return 'lost'; // Pick lost
            } else if (awayScore > homeScore && fixture.homeTeam === pick) {
                return 'lost'; // Pick lost
            } else if (homeScore === awayScore) {
                return 'draw'; // Draw
            }
        }
        
        return 'valid'; // Pick is still valid
    }

    // Cleanup resources
    cleanup() {
        this.stopAutoScoreUpdates();
        this.stopRealTimeScoreUpdates();
        this.processedGameweeks.clear();
    }
}

// Export the ScoresManager class
export default ScoresManager;
