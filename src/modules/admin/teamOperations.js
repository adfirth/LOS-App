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
        
        const refreshStandingsBtn = document.querySelector('#refresh-standings-btn');
        if (refreshStandingsBtn) {
            refreshStandingsBtn.addEventListener('click', () => this.loadStandings());
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
            // Find the As It Stands content container - look for the content div, not the tab
            const contentContainer = deviceType === 'desktop' 
                ? document.querySelector('.as-it-stands-content')
                : document.querySelector('.mobile-as-it-stands-content');
                
            if (!contentContainer) {
                console.warn(`❌ As It Stands content container not found for ${deviceType}`);
                return;
            }
            
            // Set up event listeners for existing selectors
            this.setupExistingSelectors(deviceType);
            
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
        
        // Find the correct gameweek selector based on device type
        const gameweekSelectorClass = deviceType === 'desktop' ? '.gameweek-selector' : '.mobile-gameweek-selector';
        let gameweekSelector = container.querySelector(gameweekSelectorClass);
        
        if (!gameweekSelector) {
            console.log(`Creating gameweek selector for ${deviceType}...`);
            gameweekSelector = document.createElement('div');
            gameweekSelector.className = deviceType === 'desktop' ? 'gameweek-selector' : 'mobile-gameweek-selector';
            
            const selectId = deviceType === 'desktop' ? 'desktop-as-it-stands-gameweek' : 'mobile-as-it-stands-gameweek';
            gameweekSelector.innerHTML = `
                <label for="${selectId}">Select Game Week:</label>
                <select id="${selectId}">
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
                select.addEventListener('change', this.handleGameweekChange.bind(this));
            }
        } else {
            console.log(`Gameweek selector already exists for ${deviceType}`);
            
            // Add event listener to existing selector
            const select = gameweekSelector.querySelector('select');
            if (select) {
                // Remove any existing listeners to prevent duplicates
                select.removeEventListener('change', this.handleGameweekChange);
                select.addEventListener('change', this.handleGameweekChange.bind(this));
                console.log(`✅ Added event listener to existing ${deviceType} gameweek selector`);
            }
        }
        
        // Find the correct display container based on device type
        const displayId = deviceType === 'desktop' ? 'desktop-as-it-stands-display' : 'mobile-as-it-stands-display';
        let standingsContainer = container.querySelector(`#${displayId}`);
        
        if (!standingsContainer) {
            console.log(`Creating standings display for ${deviceType}...`);
            standingsContainer = document.createElement('div');
            standingsContainer.id = displayId;
            standingsContainer.innerHTML = '<p>Loading standings...</p>';
            container.appendChild(standingsContainer);
        } else {
            console.log(`Standings display already exists for ${deviceType}`);
        }
        
        console.log(`✅ As It Stands elements created for ${deviceType}`);
    }

    // Load standings
    async loadStandings() {
        try {
            console.log('🔧 Loading standings...');
            
            // Get current edition and gameweek from DOM selectors
            // For player dashboard, prioritize the current active edition (test) and gameweek
            let currentEdition = document.querySelector('#standings-edition-select')?.value;
            let currentGameweek = document.querySelector('#standings-gameweek-select')?.value;
            
            // If not found in admin panel, try dashboard selectors
            if (!currentEdition) {
                // For player dashboard, use the current active edition (test) which has the picks
                currentEdition = 'test'; // Use test edition which has the actual picks
            }
            if (!currentGameweek) {
                currentGameweek = document.querySelector('#desktop-as-it-stands-gameweek')?.value || 
                                 document.querySelector('#mobile-as-it-stands-gameweek')?.value || 
                                 '1'; // Default to gameweek 1
            }
            
            console.log(`Current edition: ${currentEdition}, Current gameweek: ${currentGameweek}`);
            console.log(`🔍 Edition selector value:`, document.querySelector('#standings-edition-select')?.value);
            console.log(`🔍 Gameweek selector value:`, document.querySelector('#standings-gameweek-select')?.value);
            console.log(`🔍 Desktop gameweek value:`, document.querySelector('#desktop-as-it-stands-gameweek')?.value);
            console.log(`🔍 Mobile gameweek value:`, document.querySelector('#mobile-as-it-stands-gameweek')?.value);
            
            // Get all non-archived players (including active, Active, and undefined status)
            const playersSnapshot = await this.db.collection('users').get();
            
            const players = [];
            playersSnapshot.forEach(doc => {
                const userData = doc.data();
                // Only include active users (case-insensitive) or users with undefined status
                if (userData.status !== 'archived' && 
                    (userData.status === 'active' || 
                     userData.status === 'Active' || 
                     userData.status === undefined || 
                     userData.status === null)) {
                    players.push({
                        id: doc.id,
                        ...userData
                    });
                    console.log(`Including player: ${userData.displayName} (${userData.email}) - status: ${userData.status}`);
                } else {
                    console.log(`Excluding player: ${userData.displayName} (${userData.email}) - status: ${userData.status}`);
                }
            });
            
            console.log(`Found ${players.length} active players`);
            
            // Get fixtures for current gameweek
            const gameweekKey = currentGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameweek}`;
            const editionGameweekKey = `edition${currentEdition}_${gameweekKey}`;
            
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
            
            // Update the title
            const titleElement = document.querySelector('#standings-title');
            if (titleElement) {
                titleElement.textContent = `Current Standings - Edition ${currentEdition}, Game Week ${currentGameweek}`;
            }
            
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
            let currentEdition = document.querySelector('#standings-edition-select')?.value;
            if (!currentEdition) {
                // For player dashboard, use the current active edition (test) which has the picks
                currentEdition = 'test'; // Use test edition which has the actual picks
            }
            
            console.log(`🔍 Looking for picks for player ${player.displayName} - Edition: ${currentEdition}, Gameweek: ${gameweek}`);
            
            try {
                // Query picks collection for this specific player, edition, and gameweek
                const picksQuery = await this.db.collection('picks')
                    .where('userId', '==', player.id)
                    .where('edition', '==', currentEdition)
                    .where('gameweek', '==', gameweek)
                    .get();
                
                if (!picksQuery.empty) {
                    const pickDoc = picksQuery.docs[0];
                    const pickData = pickDoc.data();
                    console.log(`✅ Pick found for ${player.displayName}:`, pickData);
                    
                    // Set the picks data in the expected format
                    playerStanding.picks = {
                        team: pickData.teamPicked || pickData.team || 'No pick'
                    };
                } else {
                    console.log(`❌ No pick found for player ${player.displayName} in edition ${currentEdition}, gameweek ${gameweek}`);
                    playerStanding.picks = { team: 'No pick' };
                }
            } catch (error) {
                console.log(`❌ Error fetching picks for player ${player.displayName}:`, error);
                playerStanding.picks = { team: 'No pick' };
            }
            
            // Calculate points based on picks and fixtures
            if (fixtures.length > 0 && playerStanding.picks.team) {
                const pickedTeam = playerStanding.picks.team;
                const fixture = fixtures.find(f => 
                    f.homeTeam === pickedTeam || f.awayTeam === pickedTeam
                );
                
                if (fixture) {
                    // Store fixture status for result determination
                    playerStanding.fixtureStatus = fixture.status;
                    
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
                        // Match not finished - no points awarded yet
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
        const totalPlayers = standings.length;
        const activePlayers = standings.filter(p => !p.eliminated).length;
        const eliminatedPlayers = totalPlayers - activePlayers;
        const averageLives = totalPlayers > 0 ? (standings.reduce((sum, p) => sum + (p.lives || 0), 0) / totalPlayers).toFixed(1) : '0.0';
        
        // Update the existing elements (admin panel)
        const totalPlayersElement = document.querySelector('#total-players-count');
        const survivorsElement = document.querySelector('#survivors-count');
        const eliminatedElement = document.querySelector('#eliminated-count');
        const averageLivesElement = document.querySelector('#average-lives');
        
        if (totalPlayersElement) totalPlayersElement.textContent = totalPlayers;
        if (survivorsElement) survivorsElement.textContent = activePlayers;
        if (eliminatedElement) eliminatedElement.textContent = eliminatedPlayers;
        if (averageLivesElement) averageLivesElement.textContent = averageLives;
        
        console.log(`✅ Updated standings summary: ${totalPlayers} total, ${activePlayers} survivors, ${eliminatedPlayers} eliminated, ${averageLives} avg lives`);
    }

    // Render standings table
    renderStandingsTable(standings) {
        // Update admin panel table
        const standingsBody = document.querySelector('#standings-body');
        if (standingsBody) {
            if (!standings || standings.length === 0) {
                standingsBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-trophy" style="font-size: 2rem; color: #ffc107; margin-bottom: 1rem;"></i>
                            <p>No standings data available</p>
                        </td>
                    </tr>
                `;
            } else {
                let tableHtml = '';
                
                standings.forEach((player, index) => {
                    const position = index + 1;
                    const pickedTeam = player.picks.team || 'No pick';
                    let result = 'Pending';
                    
                    if (player.picks.team && player.picks.team !== 'No pick') {
                        if (player.fixtureStatus === 'FT') {
                            // Match finished - show actual result
                            if (player.totalPoints === 3) {
                                result = 'Win';
                            } else if (player.totalPoints === 1) {
                                result = 'Draw';
                            } else {
                                result = 'Loss';
                            }
                        } else {
                            // Match not finished - show pending
                            result = 'Pending';
                        }
                    } else {
                        result = 'No Pick';
                    }
                    
                    tableHtml += `
                        <tr>
                            <td>${position}</td>
                            <td>${player.displayName}</td>
                            <td>${player.email || 'No email'}</td>
                            <td>${player.lives || 0}</td>
                            <td>${pickedTeam}</td>
                            <td>${result}</td>
                            <td>${player.eliminated ? 'Eliminated' : 'Active'}</td>
                            <td>-</td>
                        </tr>
                    `;
                });
                
                standingsBody.innerHTML = tableHtml;
            }
            console.log(`✅ Rendered admin standings table with ${standings.length} players`);
        }
        
        // Update player dashboard displays
        const desktopDisplay = document.querySelector('#desktop-as-it-stands-display');
        const mobileDisplay = document.querySelector('#mobile-as-it-stands-display');
        
        const createStandingsHtml = (standings) => {
            if (!standings || standings.length === 0) {
                return `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-trophy" style="font-size: 2rem; color: #ffc107; margin-bottom: 1rem;"></i>
                        <p>No standings data available</p>
                    </div>
                `;
            }
            
            let html = `
                <div class="standings-summary" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <h4>Summary</h4>
                    <p><strong>Total Players:</strong> ${standings.length}</p>
                    <p><strong>Survivors:</strong> ${standings.filter(p => !p.eliminated).length}</p>
                    <p><strong>Eliminated:</strong> ${standings.filter(p => p.eliminated).length}</p>
                    <p><strong>Average Lives:</strong> ${(standings.reduce((sum, p) => sum + (p.lives || 0), 0) / standings.length).toFixed(1)}</p>
                </div>
                <div class="standings-table">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e9ecef;">
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Pos</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Player</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Lives</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Pick</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Result</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            standings.forEach((player, index) => {
                const position = index + 1;
                const pickedTeam = player.picks.team || 'No pick';
                let result = 'Pending';
                
                if (player.picks.team && player.picks.team !== 'No pick') {
                    if (player.fixtureStatus === 'FT') {
                        // Match finished - show actual result
                        if (player.totalPoints === 3) {
                            result = 'Win';
                        } else if (player.totalPoints === 1) {
                            result = 'Draw';
                        } else {
                            result = 'Loss';
                        }
                    } else {
                        // Match not finished - show pending
                        result = 'Pending';
                    }
                } else {
                    result = 'No Pick';
                }
                
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${position}</td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">${player.displayName}</td>
                        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${player.lives || 0}</td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">${pickedTeam}</td>
                        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${result}</td>
                        <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${player.eliminated ? 'Eliminated' : 'Active'}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            return html;
        };
        
        if (desktopDisplay) {
            desktopDisplay.innerHTML = createStandingsHtml(standings);
            console.log(`✅ Updated desktop standings display`);
        }
        
        if (mobileDisplay) {
            mobileDisplay.innerHTML = createStandingsHtml(standings);
            console.log(`✅ Updated mobile standings display`);
        }
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

    // Set up event listeners for existing selectors
    setupExistingSelectors(deviceType) {
        console.log(`🔧 Setting up existing selectors for ${deviceType}...`);
        
        // Set up gameweek selector
        const gameweekSelectorId = deviceType === 'desktop' 
            ? '#desktop-as-it-stands-gameweek' 
            : '#mobile-as-it-stands-gameweek';
        const gameweekSelect = document.querySelector(gameweekSelectorId);
        
        if (gameweekSelect) {
            // Remove any existing listeners to prevent duplicates
            gameweekSelect.removeEventListener('change', this.handleGameweekChange);
            gameweekSelect.addEventListener('change', this.handleGameweekChange.bind(this));
            console.log(`✅ Added event listener to ${deviceType} gameweek selector`);
        } else {
            console.warn(`❌ Gameweek selector not found: ${gameweekSelectorId}`);
        }
        
        // Update Active Edition display
        const activeEditionId = deviceType === 'desktop' 
            ? '#desktop-active-edition' 
            : '#mobile-active-edition';
        const activeEditionSpan = document.querySelector(activeEditionId);
        
        if (activeEditionSpan) {
            activeEditionSpan.textContent = 'Test Weeks';
            console.log(`✅ Updated ${deviceType} active edition display`);
        } else {
            console.warn(`❌ Active edition span not found: ${activeEditionId}`);
        }
    }

    // Handle gameweek change
    handleGameweekChange(event) {
        const newGameweek = event.target.value;
        console.log(`🔄 Gameweek changed to: ${newGameweek}`);
        this.currentActiveGameweek = newGameweek;
        this.loadStandings();
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 TeamOperations cleanup completed');
    }
}
