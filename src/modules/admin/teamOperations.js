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
            // For player dashboard, prioritize the current active edition from EditionService
            let currentEdition = document.querySelector('#standings-edition-select')?.value;
            let currentGameweek = document.querySelector('#standings-gameweek-select')?.value;
            
            // If not found in admin panel, try dashboard selectors or EditionService
            if (!currentEdition) {
                // For player dashboard, use the current active edition from EditionService
                if (window.editionService && window.editionService.getCurrentUserEdition) {
                    currentEdition = window.editionService.getCurrentUserEdition();
                } else {
                    currentEdition = 'test'; // Fallback to test edition
                }
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
            
            // Calculate cumulative effect of all gameweeks up to the current one
            for (let gw = 1; gw <= parseInt(gameweek); gw++) {
                const currentGameweek = gw.toString();
                
                // Get fixtures for this gameweek
                const gameweekKey = currentGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameweek}`;
                
                // Get the current edition from EditionService instead of hardcoding
                let currentEdition = 'test'; // Default fallback
                if (window.editionService && window.editionService.getCurrentUserEdition) {
                    currentEdition = window.editionService.getCurrentUserEdition();
                } else {
                    // Fallback: try to get from DOM selectors
                    currentEdition = document.querySelector('#standings-edition-select')?.value || 
                                   document.querySelector('#desktop-as-it-stands-gameweek')?.closest('.gameweek-selector')?.querySelector('select')?.value ||
                                   'test';
                }
                
                const editionKey = `edition${currentEdition}`;
                const fixtureDocKey = `${editionKey}_${gameweekKey}`;
                
                const fixtureDoc = await this.db.collection('fixtures').doc(fixtureDocKey).get();
                const currentFixtures = fixtureDoc.exists ? fixtureDoc.data().fixtures || [] : [];
                
                // Get player pick for this gameweek
                try {
                    const picksQuery = await this.db.collection('picks')
                        .where('userId', '==', player.id)
                        .where('edition', '==', currentEdition)
                        .where('gameweek', '==', currentGameweek)
                        .get();
                    
                    if (!picksQuery.empty) {
                        const pickDoc = picksQuery.docs[0];
                        const pickData = pickDoc.data();
                        const pickedTeam = pickData.teamPicked || pickData.team;
                        
                        // Find the fixture for this pick
                        const fixture = currentFixtures.find(f => 
                            f.homeTeam === pickedTeam || f.awayTeam === pickedTeam
                        );
                        
                        if (fixture && (fixture.status === 'FT' || fixture.completed === true)) {
                            // Match finished, calculate result
                            const homeScore = parseInt(fixture.homeScore) || 0;
                            const awayScore = parseInt(fixture.awayScore) || 0;
                            
                            if (pickedTeam === fixture.homeTeam) {
                                if (homeScore > awayScore) {
                                    playerStanding.totalPoints += 3; // Win
                                } else if (homeScore === awayScore) {
                                    playerStanding.totalPoints += 1; // Draw
                                    playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                                } else {
                                    playerStanding.totalPoints += 0; // Loss
                                    playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                                }
                            } else {
                                if (awayScore > homeScore) {
                                    playerStanding.totalPoints += 3; // Win
                                } else if (awayScore === homeScore) {
                                    playerStanding.totalPoints += 1; // Draw
                                    playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                                } else {
                                    playerStanding.totalPoints += 0; // Loss
                                    playerStanding.lives = Math.max(0, playerStanding.lives - 1);
                                }
                            }
                            
                            if (playerStanding.lives === 0) {
                                playerStanding.eliminated = true;
                                break; // Player is eliminated, no need to check further gameweeeks
                            }
                        }
                    }
                } catch (error) {
                    console.log(`❌ Error processing gameweek ${currentGameweek} for ${player.displayName}:`, error);
                }
            }
            
            // Get the pick for the current gameweek (for display purposes)
            let currentEdition = document.querySelector('#standings-edition-select')?.value;
            if (!currentEdition) {
                // Try to get from EditionService, fallback to test
                if (window.editionService && window.editionService.getCurrentUserEdition) {
                    currentEdition = window.editionService.getCurrentUserEdition();
                } else {
                    currentEdition = 'test';
                }
            }
            
            try {
                const picksQuery = await this.db.collection('picks')
                    .where('userId', '==', player.id)
                    .where('edition', '==', currentEdition)
                    .where('gameweek', '==', gameweek)
                    .get();
                
                if (!picksQuery.empty) {
                    const pickDoc = picksQuery.docs[0];
                    const pickData = pickDoc.data();
                    
                    // Check if this is player dashboard (not admin) and deadline hasn't passed
                    const isPlayerDashboard = !document.querySelector('#admin-panel');
                    
                    if (isPlayerDashboard) {
                        const deadlinePassed = await this.checkDeadlineForGameweek(gameweek, currentEdition);
                        if (deadlinePassed) {
                            playerStanding.picks = {
                                team: pickData.teamPicked || pickData.team || 'No pick'
                            };
                        } else {
                            playerStanding.picks = {
                                team: 'To be revealed'
                            };
                        }
                    } else {
                        playerStanding.picks = {
                            team: pickData.teamPicked || pickData.team || 'No pick'
                        };
                    }
                } else {
                    playerStanding.picks = { team: 'No pick' };
                }
            } catch (error) {
                playerStanding.picks = { team: 'No pick' };
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
        
        console.log(`✅ Calculated cumulative standings for ${standings.length} players up to gameweek ${gameweek}`);
        return standings;
    }

    // Update standings summary
    updateStandingsSummary(standings) {
        const totalPlayers = standings.length;
        const unscathedPlayers = standings.filter(p => p.lives === 2 && !p.eliminated).length;
        const yellowCardPlayers = standings.filter(p => p.lives === 1 && !p.eliminated).length;
        const redCardPlayers = standings.filter(p => p.eliminated).length;
        
        // Update the existing elements (admin panel)
        const totalPlayersElement = document.querySelector('#total-players-count');
        const unscathedElement = document.querySelector('#survivors-count'); // Reuse existing element
        const yellowCardsElement = document.querySelector('#eliminated-count'); // Reuse existing element
        const redCardsElement = document.querySelector('#average-lives'); // Reuse existing element
        
        if (totalPlayersElement) totalPlayersElement.textContent = totalPlayers;
        if (unscathedElement) unscathedElement.textContent = unscathedPlayers;
        if (yellowCardsElement) yellowCardsElement.textContent = yellowCardPlayers;
        if (redCardsElement) redCardsElement.textContent = redCardPlayers;
        
        console.log(`✅ Updated standings summary: ${totalPlayers} total, ${unscathedPlayers} unscathed, ${yellowCardPlayers} yellow cards, ${redCardPlayers} red cards`);
    }

    // Render standings table
    renderStandingsTable(standings) {
        // Update admin panel table
        const standingsBody = document.querySelector('#standings-body');
        if (standingsBody) {
            if (!standings || standings.length === 0) {
                standingsBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-trophy" style="font-size: 2rem; color: #ffc107; margin-bottom: 1rem;"></i>
                            <p>No standings data available</p>
                        </td>
                    </tr>
                `;
            } else {
                let tableHtml = '';
                
                standings.forEach((player, index) => {
                    const pickedTeam = player.picks.team || 'No pick';
                    let result = 'Pending';
                    
                    if (player.picks.team && player.picks.team !== 'No pick' && player.picks.team !== 'To be revealed') {
                        // For completed gameweeks, show the actual result based on totalPoints
                        // Since we're calculating cumulative standings, we can determine the result from the points
                        if (player.totalPoints > 0) {
                            // Player has points, so they must have won or drawn
                            if (player.totalPoints >= 3) {
                                result = 'Win';
                            } else if (player.totalPoints >= 1) {
                                result = 'Draw';
                            } else {
                                result = 'Loss';
                            }
                        } else {
                            // No points means either no games played yet or all losses
                            // Check if this is a completed gameweek by looking at the current gameweek
                            const currentGameweek = document.querySelector('#standings-gameweek-select')?.value || 
                                                  document.querySelector('#desktop-as-it-stands-gameweek')?.value ||
                                                  document.querySelector('#mobile-as-it-stands-gameweek')?.value;
                            
                            if (currentGameweek && parseInt(currentGameweek) >= 1) {
                                // For GW1 and GW2, we know the games are completed
                                result = 'Loss'; // If they have 0 points and games are complete, it's a loss
                            } else {
                                result = 'Pending';
                            }
                        }
                    } else {
                        // For future gameweeks, show "Pending" instead of "No pick" or "To be revealed"
                        result = 'Pending';
                    }
                    
                    // Determine card status
                    let cardStatus = '';
                    if (player.eliminated) {
                        cardStatus = '🟥';
                    } else if (player.lives === 1) {
                        cardStatus = '🟨';
                    }
                    
                    // Add strike-through styling for eliminated players
                    const strikeThroughStyle = player.eliminated ? 'text-decoration: line-through; opacity: 0.6;' : '';
                    
                    tableHtml += `
                        <tr style="${strikeThroughStyle}">
                            <td>${player.displayName}</td>
                            <td>${player.email || 'No email'}</td>
                            <td>${player.lives || 0}</td>
                            <td>${pickedTeam}</td>
                            <td>${result}</td>
                            <td>${cardStatus}</td>
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
            
            const unscathedPlayers = standings.filter(p => p.lives === 2 && !p.eliminated).length;
            const yellowCardPlayers = standings.filter(p => p.lives === 1 && !p.eliminated).length;
            const redCardPlayers = standings.filter(p => p.eliminated).length;
            
            let html = `
                <div class="standings-summary" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <h4>Summary</h4>
                    <p><strong>Total Players:</strong> ${standings.length}</p>
                    <p><strong>Unscathed:</strong> ${unscathedPlayers}</p>
                    <p><strong>Yellow Cards:</strong> ${yellowCardPlayers}</p>
                    <p><strong>Red Cards:</strong> ${redCardPlayers}</p>
                </div>
                <div class="standings-table">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e9ecef;">
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Player</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Lives</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Pick</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Result</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Current Card Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            standings.forEach((player, index) => {
                const position = index + 1;
                const pickedTeam = player.picks.team || 'No pick';
                let result = 'Pending';
                
                if (player.picks.team && player.picks.team !== 'No pick' && player.picks.team !== 'To be revealed') {
                    // For completed gameweeks, show the actual result based on totalPoints
                    // Since we're calculating cumulative standings, we can determine the result from the points
                    if (player.totalPoints > 0) {
                        // Player has points, so they must have won or drawn
                        if (player.totalPoints >= 3) {
                            result = 'Win';
                        } else if (player.totalPoints >= 1) {
                            result = 'Draw';
                        } else {
                            result = 'Loss';
                        }
                    } else {
                        // No points means either no games played yet or all losses
                        // Check if this is a completed gameweek by looking at the current gameweek
                        const currentGameweek = document.querySelector('#standings-gameweek-select')?.value || 
                                              document.querySelector('#desktop-as-it-stands-gameweek')?.value ||
                                              document.querySelector('#mobile-as-it-stands-gameweek')?.value;
                        
                        if (currentGameweek && parseInt(currentGameweek) >= 1) {
                            // For GW1 and GW2, we know the games are completed
                            result = 'Loss'; // If they have 0 points and games are complete, it's a loss
                        } else {
                            result = 'Pending';
                        }
                    }
                } else {
                    // For future gameweeks, show "Pending" instead of "No pick" or "To be revealed"
                    result = 'Pending';
                }
                
                    // Determine card status
                    let cardStatus = '';
                    if (player.eliminated) {
                        cardStatus = '🟥';
                    } else if (player.lives === 1) {
                        cardStatus = '🟨';
                    }
                    
                    // Add strike-through styling for eliminated players
                    const strikeThroughStyle = player.eliminated ? 'text-decoration: line-through; opacity: 0.6;' : '';
                    
                    html += `
                        <tr style="${strikeThroughStyle}">
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${player.displayName}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${player.lives || 0}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${pickedTeam}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${result}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${cardStatus}</td>
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
            // Get the current edition display name from EditionService
            let editionDisplayName = 'Test Weeks'; // Default fallback
            if (window.editionService && window.editionService.getCurrentUserEdition) {
                const currentEdition = window.editionService.getCurrentUserEdition();
                editionDisplayName = window.editionService.getEditionDisplayName(currentEdition);
            }
            activeEditionSpan.textContent = editionDisplayName;
            console.log(`✅ Updated ${deviceType} active edition display to: ${editionDisplayName}`);
        } else {
            console.warn(`❌ Active edition span not found: ${activeEditionId}`);
        }
    }

    // Handle gameweek change
    handleGameweekChange(event) {
        const newGameweek = event.target.value;
        console.log(`🔄 Gameweek changed to: ${newGameweek}`);
        this.currentActiveGameweek = newGameweek;
        
        // Update all gameweek selectors to keep them in sync
        const allGameweekSelectors = [
            '#desktop-as-it-stands-gameweek',
            '#mobile-as-it-stands-gameweek',
            '#standings-gameweek-select'
        ];
        
        allGameweekSelectors.forEach(selectorId => {
            const selector = document.querySelector(selectorId);
            if (selector && selector.value !== newGameweek) {
                selector.value = newGameweek;
                console.log(`✅ Updated ${selectorId} to ${newGameweek}`);
            }
        });
        
        this.loadStandings();
    }

    // Check if deadline has passed for a gameweek
    async checkDeadlineForGameweek(gameweek, edition = null) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            // Get the current edition from EditionService if not provided
            let currentEdition = edition;
            if (!currentEdition && window.editionService && window.editionService.getCurrentUserEdition) {
                currentEdition = window.editionService.getCurrentUserEdition();
            }
            const editionKey = currentEdition ? `edition${currentEdition}` : 'editiontest';
            const documentKey = `${editionKey}_${gameweekKey}`;
            
            console.log(`🔍 Checking deadline for: ${documentKey}`);
            
            const fixtureDoc = await this.db.collection('fixtures').doc(documentKey).get();
            if (!fixtureDoc.exists) {
                console.log(`❌ No fixtures document found for ${documentKey}`);
                return false;
            }
            
            const fixtureData = fixtureDoc.data();
            if (!fixtureData || !fixtureData.fixtures || fixtureData.fixtures.length === 0) {
                console.log(`❌ No fixtures data found for ${documentKey}`);
                return false;
            }
            
            // Find the earliest fixture (deadline)
            const fixtures = fixtureData.fixtures;
            let earliestFixture = null;
            let earliestDate = null;
            
            for (const fixture of fixtures) {
                if (fixture.date && fixture.kickOffTime) {
                    const dateString = `${fixture.date}T${fixture.kickOffTime}`;
                    const fixtureDate = new Date(dateString);
                    
                    if (!earliestDate || fixtureDate < earliestDate) {
                        earliestDate = fixtureDate;
                        earliestFixture = fixture;
                    }
                }
            }
            
            if (!earliestFixture || !earliestDate) {
                console.log(`❌ No valid fixture dates found for ${documentKey}`);
                return false;
            }
            
            const now = new Date();
            const deadlinePassed = now >= earliestDate;
            
            console.log(`🔍 Deadline check: ${earliestDate.toLocaleString()} vs ${now.toLocaleString()} = ${deadlinePassed ? 'PASSED' : 'NOT PASSED'}`);
            
            return deadlinePassed;
            
        } catch (error) {
            console.error(`❌ Error checking deadline for gameweek ${gameweek}:`, error);
            return false;
        }
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 TeamOperations cleanup completed');
    }
}
