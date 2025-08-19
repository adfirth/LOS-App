// Statistics Engine Module
// Handles score processing, result calculations, player lives management, and statistics

export class StatisticsEngine {
    constructor(db, currentActiveEdition = 1, currentActiveGameweek = '1') {
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        this.currentActiveGameweek = currentActiveGameweek;
        this.processedGameweeks = new Set();
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

    // Load player scores for scores tab
    async loadPlayerScores() {
        try {
            const gameweek = this.currentActiveGameweek;
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
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

    // Render admin scores for admin scores tab (prevents duplication)
    renderAdminScores(fixtures, gameweek) {
        console.log('🔧 renderAdminScores called with:', { fixtures, gameweek });
        
        const adminScoresContainer = document.querySelector('#scores-container');
        if (!adminScoresContainer) {
            console.error('Admin scores container not found');
            return;
        }
        
        // Clear any existing content to prevent duplication
        console.log('🔧 Clearing existing scores container content');
        adminScoresContainer.innerHTML = '';
        
        if (!fixtures || fixtures.length === 0) {
            adminScoresContainer.innerHTML = '<p class="no-fixtures-message">No fixtures found for this gameweek</p>';
            return;
        }
        
        // Sort fixtures by date
        const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let adminScoresHTML = `
            <div class="admin-fixtures-header">
                <h5>Game Week ${gameweek === 'tiebreak' ? 'Tiebreak' : gameweek} Fixtures</h5>
                <p class="fixtures-count">${sortedFixtures.length} fixture(s) to manage</p>
                <div class="admin-fixtures-controls">
                    <button class="complete-all-btn" onclick="window.app.scoresManager.statisticsEngine.completeAllFixtures('${gameweek}')">
                        <i class="fas fa-check-double"></i> Complete All Fixtures
                    </button>
                    <p class="var-review-note">
                        <i class="fas fa-video"></i> Provisional results are under VAR review until gameweek is completed
                    </p>
                </div>
            </div>
        `;
        
        for (const fixture of sortedFixtures) {
            const fixtureDate = new Date(fixture.date);
            const homeBadge = this.getTeamBadge(fixture.homeTeam);
            const awayBadge = this.getTeamBadge(fixture.awayTeam);
            
            const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}" class="team-badge">` : '';
            const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}" class="team-badge">` : '';
            
            // Determine match status and styling
            let statusClass = '';
            let statusText = '';
            
            if (fixture.completed || fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                statusClass = 'completed';
                statusText = 'Completed';
            } else if (fixture.status === 'HT') {
                statusClass = 'half-time';
                statusText = 'Half Time';
            } else if (fixture.status === '1H' || fixture.status === '2H' || fixture.status === 'LIVE') {
                statusClass = 'live';
                statusText = 'Live';
            } else {
                statusClass = 'not-started';
                statusText = 'Not Started';
            }
            
            adminScoresHTML += `
                <div class="admin-fixture-row ${statusClass}">
                    <div class="fixture-info">
                        <div class="fixture-teams">
                            <div class="team home-team">
                                ${homeBadgeHtml}
                                <span class="team-name">${fixture.homeTeam}</span>
                            </div>
                            <div class="fixture-vs">vs</div>
                            <div class="team away-team">
                                <span class="team-name">${fixture.awayTeam}</span>
                                ${awayBadgeHtml}
                            </div>
                        </div>
                        <div class="fixture-details">
                            <div class="fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                            <div class="fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                            <div class="fixture-status ${statusClass}">${statusText}</div>
                        </div>
                    </div>
                    
                    <div class="score-inputs">
                                                 <div class="score-section">
                             <label>Full Time Score:</label>
                             <div class="score-input-group">
                                 <input type="number" class="home-score" data-fixture-id="${fixture.id}" data-team="home" min="0" value="${fixture.homeScore || ''}" placeholder="0">
                                 <span class="score-separator">-</span>
                                 <input type="number" class="away-score" data-fixture-id="${fixture.id}" data-team="away" min="0" value="${fixture.awayScore || ''}" placeholder="0">
                             </div>
                         </div>
                         
                         <div class="score-section">
                             <label>Half Time Score:</label>
                             <div class="score-input-group">
                                 <input type="number" class="home-score-ht" data-fixture-id="${fixture.id}" data-team="home" data-type="ht" min="0" value="${fixture.homeScoreHT || ''}" placeholder="0">
                                 <span class="score-separator">-</span>
                                 <input type="number" class="away-score-ht" data-fixture-id="${fixture.id}" data-team="away" data-type="ht" min="0" value="${fixture.awayScoreHT || ''}" placeholder="0">
                             </div>
                         </div>
                        
                        <div class="match-controls">
                                                         <select class="match-status" data-fixture-id="${fixture.id}">
                                 <option value="NS" ${fixture.status === 'NS' ? 'selected' : ''}>Not Started</option>
                                 <option value="POSTP" ${fixture.status === 'POSTP' ? 'selected' : ''}>Postponed</option>
                                 <option value="1H" ${fixture.status === '1H' ? 'selected' : ''}>First Half</option>
                                 <option value="HT" ${fixture.status === 'HT' ? 'selected' : ''}>Half Time</option>
                                 <option value="2H" ${fixture.status === '2H' ? 'selected' : ''}>Second Half</option>
                                 <option value="FT" ${fixture.status === 'FT' ? 'selected' : ''}>Full Time</option>
                             </select>
                            
                            <div class="completion-controls">
                                <input type="checkbox" class="match-complete" data-fixture-id="${fixture.id}" ${fixture.completed ? 'checked' : ''}>
                                <label>Complete</label>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        adminScoresHTML += '</div>';
        adminScoresContainer.innerHTML = adminScoresHTML;
        
        // Set up event listeners for the admin interface
        this.setupAdminScoreEventListeners();
    }

    // Set up event listeners for admin score inputs
    setupAdminScoreEventListeners() {
        const adminContainer = document.querySelector('#scores-container');
        if (!adminContainer) return;
        
        // Score input event listeners
        const scoreInputs = adminContainer.querySelectorAll('input[type="number"]');
        scoreInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleScoreInputChange(e);
            });
        });
        
        // Match status change listeners
        const statusSelects = adminContainer.querySelectorAll('.match-status');
        statusSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleMatchStatusChange(e);
            });
        });
        
        // Completion checkbox listeners
        const completionCheckboxes = adminContainer.querySelectorAll('.match-complete');
        completionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleMatchCompletionChange(e);
            });
        });
    }

    // Handle score input changes
    handleScoreInputChange(event) {
        const input = event.target;
        const fixtureId = input.dataset.fixtureId;
        const team = input.dataset.team;
        const type = input.dataset.type || 'ft';
        const value = parseInt(input.value) || 0;
        
        console.log(`Score input changed: Fixture ${fixtureId}, ${team} team, ${type} score: ${value}`);
        // TODO: Update fixture data and trigger save
    }

    // Handle match status changes
    handleMatchStatusChange(event) {
        const select = event.target;
        const fixtureId = select.dataset.fixtureId;
        const newStatus = select.value;
        
        console.log(`Match status changed: Fixture ${fixtureId}, new status: ${newStatus}`);
        // TODO: Update fixture status and trigger save
    }

    // Handle match completion changes
    handleMatchCompletionChange(event) {
        const checkbox = event.target;
        const fixtureId = checkbox.dataset.fixtureId;
        const completed = checkbox.checked;
        
        console.log(`Match completion changed: Fixture ${fixtureId}, completed: ${completed}`);
        // TODO: Update fixture completion status and trigger save
    }

    // Complete all fixtures for a gameweek
    async completeAllFixtures(gameweek) {
        console.log(`Completing all fixtures for gameweek ${gameweek}`);
        
        try {
            // Get all fixtures for this gameweek
            const fixtures = await this.loadPlayerScores();
            if (!fixtures || fixtures.length === 0) {
                console.log('No fixtures found to complete');
                return;
            }

            // Mark all fixtures as completed
            const updatedFixtures = fixtures.map(fixture => ({
                ...fixture,
                completed: true,
                status: fixture.status === 'NS' ? 'FT' : fixture.status // Set status to FT if not started
            }));

            // Update the fixtures in the database
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            await this.db.collection('fixtures').doc(editionGameweekKey).update({
                fixtures: updatedFixtures
            });

            console.log(`Successfully completed all ${updatedFixtures.length} fixtures for gameweek ${gameweek}`);
            
            // Process results to update player lives
            this.processResults(gameweek, updatedFixtures);
            
            // Refresh the admin display
            this.renderAdminScores(updatedFixtures, gameweek);
            
            // Show success message
            alert(`✅ All fixtures for Game Week ${gameweek} have been completed!\n\nPlayer lives have been updated and the gameweek is now locked in.`);
            
        } catch (error) {
            console.error('Error completing all fixtures:', error);
            alert(`❌ Error completing fixtures: ${error.message}`);
        }
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

    // Get team badge (placeholder - would need to be implemented)
    getTeamBadge(teamName) {
        // This would return the URL to the team's badge image
        // For now, return null
        return null;
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

    // Cleanup resources
    cleanup() {
        this.processedGameweeks.clear();
    }
}
