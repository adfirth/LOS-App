// Team Operations Module
// Handles team management, picks, standings, and manual adjustments

export class TeamOperations {
    constructor(db) {
        this.db = db;
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
    }

    // Update current active edition
    updateCurrentActiveEdition(edition) {
        this.currentActiveEdition = edition;
        console.log(`TeamOperations: Updated currentActiveEdition to ${edition}`);
    }

    // Update current active gameweek
    updateCurrentActiveGameweek(gameweek) {
        this.currentActiveGameweek = gameweek;
        console.log(`TeamOperations: Updated currentActiveGameweek to ${gameweek}`);
    }

    // Setup As It Stands functionality
    setupAsItStandsFunctionality() {
        console.log('🔧 Setting up As It Stands functionality...');
        
        const asItStandsBtn = document.querySelector('#as-it-stands-btn');
        if (asItStandsBtn) {
            asItStandsBtn.addEventListener('click', () => this.loadStandings());
        }
        
        const exportStandingsBtn = document.querySelector('#export-standings-btn');
        if (exportStandingsBtn) {
            exportStandingsBtn.addEventListener('click', () => this.exportStandings());
        }
        
        const manualAdjustmentBtn = document.querySelector('#manual-adjustment-btn');
        if (manualAdjustmentBtn) {
            manualAdjustmentBtn.addEventListener('click', () => this.setupManualAdjustments());
        }
        
        const standingsHistoryBtn = document.querySelector('#standings-history-btn');
        if (standingsHistoryBtn) {
            standingsHistoryBtn.addEventListener('click', () => this.setupStandingsHistory());
        }
        
        console.log('✅ As It Stands functionality setup complete');
    }

    // Initialize As It Stands tab
    initializeAsItStandsTab(deviceType = 'desktop') {
        console.log(`🔧 Initializing As It Stands tab for ${deviceType}...`);
        
        try {
            // Find the As It Stands content container
            const contentContainer = document.querySelector(`#${deviceType}-as-it-stands-tab`);
            if (!contentContainer) {
                console.warn(`❌ As It Stands content container not found for ${deviceType}`);
                return;
            }
            
            // Create missing elements if they don't exist
            this.createAsItStandsElements(contentContainer, deviceType);
            
            // Load initial standings
            this.loadStandings();
            
            console.log(`✅ As It Stands tab initialized for ${deviceType}`);
            
        } catch (error) {
            console.error(`❌ Error initializing As It Stands tab for ${deviceType}:`, error);
        }
    }

    // Create missing As It Stands elements
    createAsItStandsElements(container, deviceType) {
        console.log(`🔧 Creating As It Stands elements for ${deviceType}...`);
        
        // Create gameweek selector if it doesn't exist
        let gameweekSelector = container.querySelector('.gameweek-selector');
        if (!gameweekSelector) {
            gameweekSelector = document.createElement('div');
            gameweekSelector.className = 'gameweek-selector';
            gameweekSelector.innerHTML = `
                <label for="standings-gameweek">Select Gameweek:</label>
                <select id="standings-gameweek">
                    <option value="1">Game Week 1</option>
                    <option value="2">Game Week 2</option>
                    <option value="3">Game Week 3</option>
                    <option value="4">Game Week 4</option>
                    <option value="5">Game Week 5</option>
                    <option value="6">Game Week 6</option>
                    <option value="7">Game Week 7</option>
                    <option value="8">Game Week 8</option>
                    <option value="9">Game Week 9</option>
                    <option value="10">Game Week 10</option>
                    <option value="tiebreak">Tiebreak Round</option>
                </select>
            `;
            container.appendChild(gameweekSelector);
            
            // Add event listener for gameweek change
            const select = gameweekSelector.querySelector('select');
            if (select) {
                select.addEventListener('change', () => {
                    this.currentActiveGameweek = select.value;
                    this.loadStandings();
                });
            }
        }
        
        // Create standings container if it doesn't exist
        let standingsContainer = container.querySelector('.standings-container');
        if (!standingsContainer) {
            standingsContainer = document.createElement('div');
            standingsContainer.className = 'standings-container';
            standingsContainer.innerHTML = '<p>Loading standings...</p>';
            container.appendChild(standingsContainer);
        }
        
        // Create standings summary if it doesn't exist
        let standingsSummary = container.querySelector('.standings-summary');
        if (!standingsSummary) {
            standingsSummary = document.createElement('div');
            standingsSummary.className = 'standings-summary';
            standingsSummary.innerHTML = '<p>Loading summary...</p>';
            container.appendChild(standingsSummary);
        }
        
        console.log(`✅ As It Stands elements created for ${deviceType}`);
    }

    // Load standings
    async loadStandings() {
        try {
            console.log('🔧 Loading standings...');
            
            // Get current gameweek
            const currentGameweek = this.currentActiveGameweek;
            console.log(`Current gameweek: ${currentGameweek}`);
            
            // Get all active players
            const playersSnapshot = await this.db.collection('users')
                .where('status', '==', 'active')
                .get();
            
            const players = [];
            playersSnapshot.forEach(doc => {
                players.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`Found ${players.length} active players`);
            
            // Get fixtures for current gameweek
            const gameweekKey = currentGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            const fixturesDoc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            let fixtures = [];
            
            if (fixturesDoc.exists) {
                const fixturesData = fixturesDoc.data();
                fixtures = fixturesData.fixtures || [];
                console.log(`Found ${fixtures.length} fixtures for gameweek ${currentGameweek}`);
            } else {
                console.log(`No fixtures found for gameweek ${currentGameweek}`);
            }
            
            // Calculate standings
            const standings = await this.calculateStandings(players, fixtures, currentGameweek);
            
            // Update displays
            this.updateStandingsSummary(standings);
            this.renderStandingsTable(standings);
            
            console.log('✅ Standings loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading standings:', error);
            alert('Error loading standings: ' + error.message);
        }
    }

    // Calculate standings
    async calculateStandings(players, fixtures, gameweek) {
        console.log(`🔧 Calculating standings for gameweek ${gameweek}...`);
        
        const standings = [];
        
        for (const player of players) {
            const playerStanding = {
                id: player.id,
                displayName: player.displayName || 'Unknown',
                email: player.email || 'No email',
                lives: player.lives || 2,
                status: player.status || 'active',
                picks: {},
                totalPoints: 0,
                eliminated: false
            };
            
            // Get player picks for this gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            try {
                const picksDoc = await this.db.collection('picks').doc(player.id).get();
                if (picksDoc.exists) {
                    const picksData = picksDoc.data();
                    playerStanding.picks = picksData[editionGameweekKey] || {};
                }
            } catch (error) {
                console.log(`No picks found for player ${player.id} in gameweek ${gameweek}`);
            }
            
            // Calculate points based on picks and fixtures
            if (fixtures.length > 0 && playerStanding.picks.team) {
                const pickedTeam = playerStanding.picks.team;
                const fixture = fixtures.find(f => 
                    f.homeTeam === pickedTeam || f.awayTeam === pickedTeam
                );
                
                if (fixture) {
                    if (fixture.status === 'FT') {
                        // Match finished, calculate result
                        const homeScore = parseInt(fixture.homeScore) || 0;
                        const awayScore = parseInt(fixture.awayScore) || 0;
                        
                        if (pickedTeam === fixture.homeTeam) {
                            if (homeScore > awayScore) {
                                playerStanding.totalPoints = 3; // Win
                            } else if (homeScore === awayScore) {
                                playerStanding.totalPoints = 1; // Draw
                                playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                            } else {
                                playerStanding.totalPoints = 0; // Loss
                                playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                            }
                        } else {
                            if (awayScore > homeScore) {
                                playerStanding.totalPoints = 3; // Win
                            } else if (awayScore === homeScore) {
                                playerStanding.totalPoints = 1; // Draw
                                playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                            } else {
                                playerStanding.totalPoints = 0; // Loss
                                playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                            }
                        }
                        
                        if (playerStanding.lives === 0) {
                            playerStanding.eliminated = true;
                        }
                    } else {
                        // Match not finished
                        playerStanding.totalPoints = 0;
                    }
                }
            }
            
            standings.push(playerStanding);
        }
        
        // Sort standings by points (descending), then by lives (descending), then by name
        standings.sort((a, b) => {
            if (a.totalPoints !== b.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            if (a.lives !== b.lives) {
                return b.lives - a.lives;
            }
            return a.displayName.localeCompare(b.displayName);
        });
        
        console.log(`✅ Calculated standings for ${standings.length} players`);
        return standings;
    }

    // Update standings summary
    updateStandingsSummary(standings) {
        const summaryContainer = document.querySelector('#standings-summary');
        if (!summaryContainer) return;
        
        const totalPlayers = standings.length;
        const activePlayers = standings.filter(p => !p.eliminated).length;
        const eliminatedPlayers = totalPlayers - activePlayers;
        
        summaryContainer.innerHTML = `
            <div class="standings-summary">
                <h3>Standings Summary</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Total Players:</span>
                        <span class="stat-value">${totalPlayers}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Active Players:</span>
                        <span class="stat-value active">${activePlayers}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Eliminated:</span>
                        <span class="stat-value eliminated">${eliminatedPlayers}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render standings table
    renderStandingsTable(standings) {
        const tableContainer = document.querySelector('#standings-table-container');
        if (!tableContainer) return;
        
        if (!standings || standings.length === 0) {
            tableContainer.innerHTML = '<p>No standings data available</p>';
            return;
        }
        
        let tableHtml = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Player</th>
                        <th>Picked Team</th>
                        <th>Result</th>
                        <th>Points</th>
                        <th>Lives</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        standings.forEach((player, index) => {
            const position = index + 1;
            const positionClass = position <= 3 ? 'top-three' : '';
            const statusClass = player.eliminated ? 'eliminated' : 'active';
            
            const pickedTeam = player.picks.team || 'No pick';
            let result = 'Pending';
            let resultClass = 'pending';
            
            if (player.totalPoints > 0) {
                if (player.totalPoints === 3) {
                    result = 'Win';
                    resultClass = 'win';
                } else if (player.totalPoints === 1) {
                    result = 'Draw';
                    resultClass = 'draw';
                }
            } else if (player.picks.team) {
                result = 'Loss';
                resultClass = 'loss';
            }
            
            tableHtml += `
                <tr class="${positionClass} ${statusClass}">
                    <td class="position">${position}</td>
                    <td class="player-name">${player.displayName}</td>
                    <td class="picked-team">${pickedTeam}</td>
                    <td class="result ${resultClass}">${result}</td>
                    <td class="points">${player.totalPoints}</td>
                    <td class="lives">${player.lives}</td>
                    <td class="status ${statusClass}">${player.eliminated ? 'Eliminated' : 'Active'}</td>
                </tr>
            `;
        });
        
        tableHtml += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = tableHtml;
    }

    // Export standings
    exportStandings() {
        console.log('🔧 Exporting standings...');
        
        const tableContainer = document.querySelector('#standings-table-container');
        if (!tableContainer) {
            alert('No standings table to export');
            return;
        }
        
        const table = tableContainer.querySelector('table');
        if (!table) {
            alert('No standings table found');
            return;
        }
        
        // Convert table to CSV
        const csv = this.tableToCSV(table);
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `standings-gameweek-${this.currentActiveGameweek}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        console.log('✅ Standings exported successfully');
    }

    // Convert table to CSV
    tableToCSV(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const csv = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => {
                let text = cell.textContent || cell.innerText || '';
                text = text.replace(/"/g, '""');
                return `"${text}"`;
            }).join(',');
        }).join('\n');
        
        return csv;
    }

    // Setup manual adjustments
    setupManualAdjustments() {
        console.log('🔧 Setting up manual adjustments...');
        
        const adjustmentContainer = document.querySelector('#manual-adjustment-container');
        if (!adjustmentContainer) {
            console.error('Manual adjustment container not found');
            return;
        }
        
        adjustmentContainer.style.display = 'block';
        
        // Load players for adjustment dropdown
        this.updateAdjustmentPlayerDropdown([]);
        
        // Set up form submission
        const form = document.querySelector('#manual-adjustment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.applyManualAdjustment(e));
        }
    }

    // Update adjustment player dropdown
    async updateAdjustmentPlayerDropdown(players) {
        const playerSelect = document.querySelector('#adjustment-player-select');
        if (!playerSelect) return;
        
        if (players.length === 0) {
            // Load players if not provided
            try {
                const playersSnapshot = await this.db.collection('users')
                    .where('status', '==', 'active')
                    .orderBy('displayName')
                    .get();
                
                players = [];
                playersSnapshot.forEach(doc => {
                    players.push({
                        id: doc.id,
                        displayName: doc.data().displayName || 'Unknown'
                    });
                });
            } catch (error) {
                console.error('Error loading players for adjustment dropdown:', error);
                return;
            }
        }
        
        playerSelect.innerHTML = '<option value="">Select a player...</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.displayName;
            playerSelect.appendChild(option);
        });
    }

    // Load player current lives
    async loadPlayerCurrentLives(playerId) {
        try {
            const playerDoc = await this.db.collection('users').doc(playerId).get();
            if (playerDoc.exists) {
                const playerData = playerDoc.data();
                const livesInput = document.querySelector('#adjustment-lives-input');
                if (livesInput) {
                    livesInput.value = playerData.lives || 2;
                }
            }
        } catch (error) {
            console.error('Error loading player lives:', error);
        }
    }

    // Apply manual adjustment
    async applyManualAdjustment(event) {
        event.preventDefault();
        
        try {
            const playerId = document.querySelector('#adjustment-player-select').value;
            const newLives = parseInt(document.querySelector('#adjustment-lives-input').value);
            const reason = document.querySelector('#adjustment-reason').value;
            
            if (!playerId) {
                alert('Please select a player');
                return;
            }
            
            if (newLives < 0 || newLives > 2) {
                alert('Lives must be between 0 and 2');
                return;
            }
            
            // Update player lives
            await this.db.collection('users').doc(playerId).update({
                lives: newLives,
                lastUpdated: new Date()
            });
            
            // Log the adjustment
            await this.db.collection('adjustmentLogs').add({
                playerId,
                oldLives: 0, // We don't have the old value easily accessible
                newLives,
                reason,
                adjustedBy: 'admin', // This should come from auth context
                adjustedAt: new Date()
            });
            
            console.log(`✅ Manual adjustment applied: Player ${playerId} lives set to ${newLives}`);
            alert('Manual adjustment applied successfully!');
            
            // Hide the adjustment container
            const adjustmentContainer = document.querySelector('#manual-adjustment-container');
            if (adjustmentContainer) {
                adjustmentContainer.style.display = 'none';
            }
            
            // Refresh standings if they're currently displayed
            if (document.querySelector('#standings-table-container')) {
                this.loadStandings();
            }
            
        } catch (error) {
            console.error('❌ Error applying manual adjustment:', error);
            alert('Error applying adjustment: ' + error.message);
        }
    }

    // Setup standings history
    setupStandingsHistory() {
        console.log('🔧 Setting up standings history...');
        
        const historyContainer = document.querySelector('#standings-history-container');
        if (!historyContainer) {
            console.error('Standings history container not found');
            return;
        }
        
        historyContainer.style.display = 'block';
        
        // Load standings history
        this.loadStandingsHistory();
    }

    // Load standings history
    async loadStandingsHistory() {
        try {
            console.log('🔧 Loading standings history...');
            
            const logsSnapshot = await this.db.collection('adjustmentLogs')
                .orderBy('adjustedAt', 'desc')
                .limit(50)
                .get();
            
            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.renderStandingsHistory(logs);
            
        } catch (error) {
            console.error('❌ Error loading standings history:', error);
            alert('Error loading standings history: ' + error.message);
        }
    }

    // Render standings history
    renderStandingsHistory(logs) {
        const historyContainer = document.querySelector('#standings-history-container');
        if (!historyContainer) return;
        
        if (!logs || logs.length === 0) {
            historyContainer.innerHTML = '<p>No adjustment history found</p>';
            return;
        }
        
        let historyHtml = `
            <h3>Standings Adjustment History</h3>
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Player</th>
                        <th>Old Lives</th>
                        <th>New Lives</th>
                        <th>Reason</th>
                        <th>Adjusted By</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        logs.forEach(log => {
            const date = log.adjustedAt?.toDate?.() || log.adjustedAt || new Date();
            const formattedDate = date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString();
            
            historyHtml += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${log.playerId}</td>
                    <td>${log.oldLives}</td>
                    <td>${log.newLives}</td>
                    <td>${log.reason || 'No reason provided'}</td>
                    <td>${log.adjustedBy || 'Unknown'}</td>
                </tr>
            `;
        });
        
        historyHtml += `
                </tbody>
            </table>
            <button id="export-history-btn" class="export-btn">Export History</button>
        `;
        
        historyContainer.innerHTML = historyHtml;
        
        // Set up export button
        const exportBtn = document.querySelector('#export-history-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStandingsHistory(logs));
        }
    }

    // Export standings history
    exportStandingsHistory(logs) {
        console.log('🔧 Exporting standings history...');
        
        if (!logs || logs.length === 0) {
            alert('No history data to export');
            return;
        }
        
        // Convert logs to CSV
        const csv = this.logsToCSV(logs);
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `standings-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        console.log('✅ Standings history exported successfully');
    }

    // Convert logs to CSV
    logsToCSV(logs) {
        const headers = ['Date', 'Player ID', 'Old Lives', 'New Lives', 'Reason', 'Adjusted By'];
        const csv = [headers.join(',')];
        
        logs.forEach(log => {
            const date = log.adjustedAt?.toDate?.() || log.adjustedAt || new Date();
            const formattedDate = date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString();
            
            const row = [
                formattedDate,
                log.playerId || '',
                log.oldLives || '',
                log.newLives || '',
                (log.reason || '').replace(/"/g, '""'),
                log.adjustedBy || ''
            ].map(field => `"${field}"`).join(',');
            
            csv.push(row);
        });
        
        return csv.join('\n');
    }

    // Adjust player lives
    async adjustPlayerLives(playerId, currentLives) {
        try {
            const newLives = Math.max(0, Math.min(2, currentLives));
            
            await this.db.collection('users').doc(playerId).update({
                lives: newLives,
                lastUpdated: new Date()
            });
            
            console.log(`✅ Player ${playerId} lives adjusted to ${newLives}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error adjusting player lives:', error);
            return false;
        }
    }

    // Get team badge
    getTeamBadge(teamName) {
        // This method would return the team badge image URL
        // Implementation depends on your team badge system
        return null;
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 TeamOperations cleanup completed');
    }
}
