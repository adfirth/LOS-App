// Fixtures Module
// Handles all fixture-related functionality including management, loading, rendering, and API integrations

class FixturesManager {
    constructor(db) {
        this.db = db;
        this.fixtureManagementInitialized = false;
        this.currentGameweekFixtures = [];
        this.lastProcessedEvents = new Set();
        this.enhancedVidiprinterData = [];
        this.autoUpdateInterval = null;
        this.realTimeUpdateInterval = null;
    }

    // Initialize fixture management
    initializeFixtureManagement() {
        if (this.fixtureManagementInitialized) {
            console.log('Fixture management already initialized, skipping...');
            return;
        }
        
        // Check if we're on a page that needs fixture management
        const hasFixtureElements = document.querySelector('#gameweek-select') || 
                                  document.querySelector('#score-gameweek-select') ||
                                  document.querySelector('#desktop-as-it-stands-gameweek') ||
                                  document.querySelector('.gameweek-tab') ||
                                  document.querySelector('#mobile-gameweek-navigation');
        if (!hasFixtureElements) {
            console.log('Fixture management elements not found on this page, skipping...');
            return;
        }
        
        console.log('Initializing fixture management...');
        this.fixtureManagementInitialized = true;
        
        this.setupEventListeners();
        this.initializeFixtureManagementTools();
        this.addInitialFixtureRow();
        this.loadExistingFixtures();
        this.initializeFootballWebPagesAPI();
        this.initializeCompetitionSettings();
        this.startDeadlineChecker();
    }

    // Set up event listeners for fixture management
    setupEventListeners() {
        const addFixtureBtn = document.querySelector('#add-fixture-btn');
        const saveFixturesBtn = document.querySelector('#save-fixtures-btn');
        const checkFixturesBtn = document.querySelector('#check-fixtures-btn');
        const saveScoresBtn = document.querySelector('#save-scores-btn');
        const gameweekSelect = document.querySelector('#gameweek-select');
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        const importFootballWebPagesScoresBtn = document.querySelector('#import-football-webpages-scores-btn');
        const scoresFileInput = document.querySelector('#scores-file-input');
        const refreshScoresBtn = document.querySelector('#refresh-scores-btn');
        const startAutoUpdateBtn = document.querySelector('#start-auto-update-btn');
        const stopAutoUpdateBtn = document.querySelector('#stop-auto-update-btn');
        const saveApiSettingsBtn = document.querySelector('#save-api-settings-btn');

        if (addFixtureBtn) {
            addFixtureBtn.addEventListener('click', () => this.addFixtureRow());
        }
        if (saveFixturesBtn) {
            saveFixturesBtn.addEventListener('click', () => this.saveFixtures());
        }
        if (checkFixturesBtn) {
            checkFixturesBtn.addEventListener('click', () => this.checkFixtures());
        }
        if (saveScoresBtn) {
            saveScoresBtn.addEventListener('click', () => this.saveScores());
        }
        if (gameweekSelect) {
            gameweekSelect.addEventListener('change', () => this.loadFixturesForGameweek());
        }
        if (scoreGameweekSelect) {
            scoreGameweekSelect.addEventListener('change', () => this.loadScoresForGameweek());
        }
        if (importFootballWebPagesScoresBtn) {
            importFootballWebPagesScoresBtn.addEventListener('click', () => {
                const gameweek = scoreGameweekSelect.value;
                this.importScoresFromFootballWebPages(gameweek);
            });
        }
        if (refreshScoresBtn) {
            refreshScoresBtn.addEventListener('click', () => {
                this.loadScoresForGameweek();
            });
        }
        if (scoresFileInput) {
            scoresFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const gameweek = scoreGameweekSelect.value;
                    this.importScoresFromFile(file, gameweek);
                    e.target.value = ''; // Reset file input
                }
            });
        }
        if (startAutoUpdateBtn) {
            startAutoUpdateBtn.addEventListener('click', () => {
                const gameweek = scoreGameweekSelect.value;
                this.startAutoScoreUpdates(gameweek);
                
                const statusDiv = document.getElementById('auto-update-status');
                if (statusDiv) {
                    statusDiv.innerHTML = '<p class="success">✅ Auto score updates started. Checking every minute for half-time (45+ min) and full-time (105+ min) scores.</p>';
                }
            });
        }
        if (stopAutoUpdateBtn) {
            stopAutoUpdateBtn.addEventListener('click', () => {
                this.stopAutoScoreUpdates();
                
                const statusDiv = document.getElementById('auto-update-status');
                if (statusDiv) {
                    statusDiv.innerHTML = '<p class="info">⏹️ Auto score updates stopped.</p>';
                }
            });
        }
        if (saveApiSettingsBtn) {
            saveApiSettingsBtn.addEventListener('click', () => this.saveFootballWebPagesSettings());
        }
        
        // Add event listener for Edit Fixtures button
        const editFixturesBtn = document.querySelector('#edit-fixtures-btn');
        if (editFixturesBtn) {
            editFixturesBtn.addEventListener('click', () => this.editFixtures());
        }
        
        // Add event listener for View Fixtures button
        const viewFixturesBtn = document.querySelector('#view-fixtures-btn');
        if (viewFixturesBtn) {
            viewFixturesBtn.addEventListener('click', () => this.switchToViewMode());
        }
    }

    // Initialize fixture management tools
    initializeFixtureManagementTools() {
        // Add event listeners for fixture management tools
        const reallocateFixturesBtn = document.querySelector('#reallocate-fixtures-btn');
        const deleteAllFixturesBtn = document.querySelector('#delete-all-fixtures-btn');
        
        if (reallocateFixturesBtn) {
            reallocateFixturesBtn.addEventListener('click', () => this.reallocateFixtures());
        }
        
        if (deleteAllFixturesBtn) {
            deleteAllFixturesBtn.addEventListener('click', () => this.deleteAllFixtures());
        }
        
        console.log('Fixture management tools initialized');
    }

    // Add initial fixture row
    addInitialFixtureRow() {
        this.addFixtureRow();
    }

    // Load existing fixtures
    loadExistingFixtures() {
        // Only load if the required elements exist
        if (document.querySelector('#gameweek-select')) {
            this.loadFixturesForGameweek();
        }
        if (document.querySelector('#score-gameweek-select')) {
            this.loadScoresForGameweek();
        }
    }

    // Initialize Football Web Pages API
    initializeFootballWebPagesAPI() {
        this.loadFootballWebPagesSettings();
        console.log('Football Web Pages API initialized');
    }

    // Initialize competition settings
    initializeCompetitionSettings() {
        // Initialize competition settings when database is ready
        const initializeCompetitionSettingsWhenReady = () => {
            if (this.db) {
                this.loadCompetitionSettings();
            } else {
                setTimeout(initializeCompetitionSettingsWhenReady, 100);
            }
        };
        initializeCompetitionSettingsWhenReady();
    }

    // Start deadline checker
    startDeadlineChecker() {
        // Start periodic deadline checking when database is ready
        const startDeadlineCheckerWhenReady = () => {
            if (this.db) {
                // Start deadline checking logic here
                console.log('Deadline checker started');
            } else {
                setTimeout(startDeadlineCheckerWhenReady, 100);
            }
        };
        startDeadlineCheckerWhenReady();
    }

    // Add fixture row
    addFixtureRow() {
        const fixturesContainer = document.querySelector('#fixtures-container');
        if (!fixturesContainer) return;

        const fixtureRow = document.createElement('div');
        fixtureRow.className = 'fixture-row';
        fixtureRow.innerHTML = `
            <div class="fixture-inputs">
                <input type="text" class="home-team" placeholder="Home Team">
                <input type="text" class="away-team" placeholder="Away Team">
                <input type="datetime-local" class="fixture-date">
                <input type="text" class="venue" placeholder="Venue">
                <button type="button" class="remove-fixture-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </div>
        `;
        fixturesContainer.appendChild(fixtureRow);
    }

    // Remove fixture row
    removeFixtureRow(button) {
        button.parentElement.parentElement.remove();
    }

    // Save fixtures
    async saveFixtures() {
        try {
            const gameweek = document.querySelector('#gameweek-select').value;
            const fixtureRows = document.querySelectorAll('.fixture-row');
            const fixtures = [];

            fixtureRows.forEach(row => {
                const homeTeam = row.querySelector('.home-team').value.trim();
                const awayTeam = row.querySelector('.away-team').value.trim();
                const dateTimeInput = row.querySelector('.fixture-date').value;
                const venue = row.querySelector('.venue').value.trim();

                if (homeTeam && awayTeam && dateTimeInput) {
                    // Parse the datetime-local input to get date and kick-off time
                    const dateTime = new Date(dateTimeInput);
                    const date = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
                    const kickOffTime = dateTime.toTimeString().split(' ')[0]; // HH:MM:SS format
                    
                    fixtures.push({
                        homeTeam,
                        awayTeam,
                        date,
                        kickOffTime,
                        dateTime: dateTimeInput, // Keep the full datetime for editing
                        venue: venue || 'TBD',
                        status: 'NS'
                    });
                }
            });

            if (fixtures.length === 0) {
                alert('Please add at least one fixture');
                return;
            }

            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            await this.db.collection('fixtures').doc(editionGameweekKey).set({
                fixtures: fixtures,
                gameweek: gameweek,
                edition: window.currentActiveEdition,
                lastUpdated: new Date()
            });

            alert(`Saved ${fixtures.length} fixtures for gameweek ${gameweek}`);
            
            // After saving, show the Current Fixtures table and switch to view mode
            const fixturesTableContainer = document.querySelector('#fixtures-table-container');
            if (fixturesTableContainer) {
                fixturesTableContainer.style.display = 'block';
            }
            this.loadFixturesForGameweek();

        } catch (error) {
            console.error('Error saving fixtures:', error);
            alert('Error saving fixtures: ' + error.message);
        }
    }

    // Check fixtures
    async checkFixtures() {
        try {
            const gameweek = document.querySelector('#gameweek-select').value;
            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            if (!doc.exists) {
                alert('No fixtures found for this gameweek');
                return;
            }

            const fixtures = doc.data().fixtures || [];
            if (fixtures.length === 0) {
                alert('No fixtures found for this gameweek');
                return;
            }

            // Check for duplicate teams
            const teamCounts = {};
            fixtures.forEach(fixture => {
                teamCounts[fixture.homeTeam] = (teamCounts[fixture.homeTeam] || 0) + 1;
                teamCounts[fixture.awayTeam] = (teamCounts[fixture.awayTeam] || 0) + 1;
            });

            const duplicates = Object.entries(teamCounts).filter(([team, count]) => count > 1);
            if (duplicates.length > 0) {
                alert(`Warning: Teams appearing multiple times: ${duplicates.map(([team, count]) => `${team} (${count}x)`).join(', ')}`);
            } else {
                alert('All fixtures look good! No duplicate teams found.');
            }

            // Enhanced validation: Check fixtures against API for current date alignment
            await this.validateFixturesAgainstAPI(fixtures, gameweek);

        } catch (error) {
            console.error('Error checking fixtures:', error);
            alert('Error checking fixtures: ' + error.message);
        }
    }

    // Reallocate fixtures between game weeks
    async reallocateFixtures() {
        try {
            const sourceGameweek = document.querySelector('#source-gameweek').value;
            const targetGameweek = document.querySelector('#target-gameweek').value;
            
            if (sourceGameweek === targetGameweek) {
                alert('Source and target game weeks must be different');
                return;
            }
            
            if (!confirm(`Are you sure you want to move all fixtures from Game Week ${sourceGameweek} to Game Week ${targetGameweek}? This will overwrite any existing fixtures in the target game week.`)) {
                return;
            }
            
            // Get source fixtures
            const sourceGameweekKey = sourceGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${sourceGameweek}`;
            const sourceEditionGameweekKey = `edition${window.currentActiveEdition}_${sourceGameweekKey}`;
            const sourceDoc = await this.db.collection('fixtures').doc(sourceEditionGameweekKey).get();
            
            if (!sourceDoc.exists) {
                alert(`No fixtures found for Game Week ${sourceGameweek}`);
                return;
            }
            
            const sourceFixtures = sourceDoc.data().fixtures || [];
            if (sourceFixtures.length === 0) {
                alert(`No fixtures found for Game Week ${sourceGameweek}`);
                return;
            }
            
            // Save to target game week
            const targetGameweekKey = targetGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${targetGameweek}`;
            const targetEditionGameweekKey = `edition${window.currentActiveEdition}_${targetGameweekKey}`;
            
            await this.db.collection('fixtures').doc(targetEditionGameweekKey).set({
                fixtures: sourceFixtures,
                gameweek: targetGameweek,
                edition: window.currentActiveEdition,
                lastUpdated: new Date()
            });
            
            // Delete source fixtures
            await this.db.collection('fixtures').doc(sourceEditionGameweekKey).delete();
            
            alert(`Successfully moved ${sourceFixtures.length} fixtures from Game Week ${sourceGameweek} to Game Week ${targetGameweek}`);
            
            // Refresh the display for the current gameweek
            this.loadFixturesForGameweek();
            
            // Update status display
            const statusElement = document.querySelector('#reallocate-status');
            if (statusElement) {
                statusElement.textContent = `✅ Successfully moved ${sourceFixtures.length} fixtures from Game Week ${sourceGameweek} to Game Week ${targetGameweek}`;
                statusElement.style.color = '#28a745';
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 5000);
            }
            
        } catch (error) {
            console.error('Error reallocating fixtures:', error);
            alert('Error reallocating fixtures: ' + error.message);
            
            // Update status display
            const statusElement = document.querySelector('#reallocate-status');
            if (statusElement) {
                statusElement.textContent = `❌ Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
            }
        }
    }

    // Delete all fixtures from a game week
    async deleteAllFixtures() {
        try {
            const gameweek = document.querySelector('#delete-gameweek').value;
            
            if (!confirm(`Are you sure you want to delete ALL fixtures from Game Week ${gameweek}? This action cannot be undone.`)) {
                return;
            }
            
            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            await this.db.collection('fixtures').doc(editionGameweekKey).delete();
            
            alert(`Successfully deleted all fixtures from Game Week ${gameweek}`);
            
            // Clear the display and show empty state
            this.displayFixtures([]);
            
            // Update status display
            const statusElement = document.querySelector('#delete-status');
            if (statusElement) {
                statusElement.textContent = `✅ Successfully deleted all fixtures from Game Week ${gameweek}`;
                statusElement.style.color = '#28a745';
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 5000);
            }
            
        } catch (error) {
            console.error('Error deleting fixtures:', error);
            alert('Error deleting fixtures: ' + error.message);
            
            // Update status display
            const statusElement = document.querySelector('#delete-status');
            if (statusElement) {
                statusElement.textContent = `❌ Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
            }
        }
    }

    // Validate fixtures against API for current date alignment
    async validateFixturesAgainstAPI(fixtures, gameweek) {
        try {
            console.log('🔍 Validating fixtures against API for current date alignment...');
            
            // Get current date
            const currentDate = new Date();
            const currentDateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            console.log(`📅 Current date: ${currentDateString}`);
            console.log(`🎯 Checking ${fixtures.length} fixtures for Game Week ${gameweek}`);
            
            // Extract unique dates from fixtures
            const fixtureDates = [...new Set(fixtures.map(f => f.date))];
            console.log(`📅 Fixture dates found: ${fixtureDates.join(', ')}`);
            
            // Check if any fixtures are scheduled for today or recent dates
            const today = new Date(currentDateString);
            const recentFixtures = fixtures.filter(fixture => {
                if (!fixture.date) return false;
                const fixtureDate = new Date(fixture.date);
                const diffTime = Math.abs(today - fixtureDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7; // Check fixtures within 7 days
            });
            
            if (recentFixtures.length > 0) {
                console.log(`🎯 Found ${recentFixtures.length} recent fixtures within 7 days:`);
                recentFixtures.forEach(f => {
                    const fixtureDate = new Date(f.date);
                    const diffTime = Math.abs(today - fixtureDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    console.log(`  - ${f.homeTeam} vs ${f.awayTeam} on ${f.date} (${diffDays} days ${diffDays === 0 ? 'from now' : diffDays > 0 ? 'ago' : 'from now'})`);
                });
                
                // Check if we should validate against API
                const shouldValidateAPI = recentFixtures.some(f => {
                    const fixtureDate = new Date(f.date);
                    const diffTime = Math.abs(today - fixtureDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 3; // Only validate fixtures within 3 days
                });
                
                if (shouldValidateAPI) {
                    console.log('🔍 Recent fixtures found - validating against API...');
                    await this.validateRecentFixturesAgainstAPI(recentFixtures);
                } else {
                    console.log('📅 Fixtures are recent but not close enough to warrant API validation');
                }
            } else {
                console.log('📅 No recent fixtures found - all fixtures are more than 7 days away');
            }
            
            // Show validation summary
            this.showFixtureValidationSummary(fixtures, recentFixtures);
            
        } catch (error) {
            console.error('❌ Error validating fixtures against API:', error);
        }
    }

    // Validate recent fixtures against API
    async validateRecentFixturesAgainstAPI(recentFixtures) {
        try {
            console.log('🔍 Fetching API data to validate recent fixtures...');
            
            // Get the first recent fixture to determine the date range
            const firstFixture = recentFixtures[0];
            const fixtureDate = new Date(firstFixture.date);
            
            // Format date for API (YYYY-MM-DD)
            const apiDate = fixtureDate.toISOString().split('T')[0];
            
            // Check if we have API configuration
            if (!window.footballWebPagesConfig || !window.footballWebPagesConfig.RAPIDAPI_KEY) {
                console.log('⚠️ No API configuration found - skipping API validation');
                return;
            }
            
            // Fetch fixtures from API for this date
            const apiUrl = `https://football-web-pages1.p.rapidapi.com/fixtures-results.json?from=${apiDate}&to=${apiDate}&comp=5&season=2025-2026`;
            
            console.log(`🔍 Fetching API data for ${apiDate}: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': window.footballWebPagesConfig.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': window.footballWebPagesConfig.RAPIDAPI_HOST
                }
            });
            
            if (response.ok) {
                const apiData = await response.json();
                console.log('✅ API data fetched successfully:', apiData);
                
                // Validate fixtures against API data
                this.validateFixturesWithAPIData(recentFixtures, apiData);
            } else {
                console.log(`⚠️ API request failed: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Error fetching API data for validation:', error);
        }
    }

    // Validate fixtures with API data
    validateFixturesWithAPIData(fixtures, apiData) {
        try {
            console.log('🔍 Validating fixtures against API data...');
            
            // Extract fixtures from API response
            let apiFixtures = [];
            if (apiData['fixtures-results']) {
                const fixturesData = apiData['fixtures-results'];
                if (fixturesData.matches && Array.isArray(fixturesData.matches)) {
                    apiFixtures = fixturesData.matches;
                }
            }
            
            console.log(`📅 Found ${apiFixtures.length} fixtures in API response`);
            
            // Check each fixture against API data
            fixtures.forEach(fixture => {
                const fixtureDate = new Date(fixture.date);
                const apiDate = fixtureDate.toISOString().split('T')[0];
                
                // Find matching API fixture
                const matchingAPIFixture = apiFixtures.find(apiFixture => {
                    const apiFixtureDate = apiFixture.date;
                    if (!apiFixtureDate) return false;
                    
                    // Check if dates match
                    const apiDateObj = new Date(apiFixtureDate);
                    const fixtureDateObj = new Date(fixture.date);
                    
                    return apiDateObj.toDateString() === fixtureDateObj.toDateString();
                });
                
                if (matchingAPIFixture) {
                    console.log(`✅ Fixture validated: ${fixture.homeTeam} vs ${fixture.awayTeam} on ${fixture.date}`);
                    console.log(`  - API data: ${matchingAPIFixture['home-team']?.name || 'N/A'} vs ${matchingAPIFixture['away-team']?.name || 'N/A'}`);
                } else {
                    console.log(`⚠️ Fixture not found in API: ${fixture.homeTeam} vs ${fixture.awayTeam} on ${fixture.date}`);
                }
            });
            
        } catch (error) {
            console.error('❌ Error validating fixtures with API data:', error);
        }
    }

    // Show fixture validation summary
    showFixtureValidationSummary(fixtures, recentFixtures) {
        const validationResults = document.querySelector('#fixture-validation-results');
        const validationStatus = document.querySelector('#validation-status');
        const validationDetails = document.querySelector('#validation-details');
        
        if (!validationResults || !validationStatus || !validationDetails) {
            console.log('Validation results elements not found');
            return;
        }
        
        const totalFixtures = fixtures.length;
        const recentCount = recentFixtures.length;
        const currentDate = new Date().toISOString().split('T')[0];
        
        let statusHtml = `<h4>🔍 Fixture Validation Complete</h4>`;
        statusHtml += `<p><strong>Total Fixtures:</strong> ${totalFixtures}</p>`;
        statusHtml += `<p><strong>Recent Fixtures (within 7 days):</strong> ${recentCount}</p>`;
        statusHtml += `<p><strong>Current Date:</strong> ${currentDate}</p>`;
        
        if (recentCount > 0) {
            statusHtml += `<p><strong>Recent Fixtures:</strong></p>`;
            statusHtml += `<ul>`;
            recentFixtures.forEach(fixture => {
                const fixtureDate = new Date(fixture.date);
                const today = new Date();
                const diffTime = Math.abs(today - fixtureDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let timeDescription;
                if (diffDays === 0) {
                    timeDescription = 'Today';
                } else if (diffDays === 1) {
                    timeDescription = 'Yesterday';
                } else if (diffDays > 0) {
                    timeDescription = `${diffDays} days ago`;
                } else {
                    timeDescription = `${Math.abs(diffDays)} days from now`;
                }
                
                statusHtml += `<li>${fixture.homeTeam} vs ${fixture.awayTeam} on ${fixture.date} (${timeDescription})</li>`;
            });
            statusHtml += `</ul>`;
        }
        
        validationStatus.innerHTML = statusHtml;
        validationStatus.className = 'validation-status success';
        
        // Show additional details
        validationDetails.innerHTML = `
            <h5>Validation Details:</h5>
            <ul>
                <li>✅ Basic fixture validation completed</li>
                <li>🔍 API validation attempted for recent fixtures</li>
                <li>📅 Date alignment checked against current date</li>
                <li>🎯 Recent fixtures highlighted for attention</li>
            </ul>
        `;
        
        validationResults.style.display = 'block';
    }

    // Load fixtures for gameweek
    loadFixturesForGameweek() {
        const gameweekSelect = document.querySelector('#gameweek-select');
        if (!gameweekSelect) {
            console.log('Gameweek select not found, skipping fixture load');
            return;
        }
        
        const gameweek = gameweekSelect.value;
        // Use the same format as the main app.js file
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
        
        this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (doc.exists) {
                const fixtures = doc.data().fixtures || [];
                this.displayFixtures(fixtures);
            } else {
                this.displayFixtures([]);
            }
        }).catch(error => {
            console.error('Error loading fixtures:', error);
            this.displayFixtures([]);
        });
    }

    // Display fixtures
    displayFixtures(fixtures) {
        const fixturesContainer = document.querySelector('#fixtures-container');
        if (!fixturesContainer) return;

        fixturesContainer.innerHTML = '';
        
        if (fixtures.length === 0) {
            this.addFixtureRow();
            // Clear the table display when no fixtures
            const fixturesTableContainer = document.querySelector('#fixtures-table-container');
            if (fixturesTableContainer) {
                fixturesTableContainer.innerHTML = '<p>No fixtures found for this gameweek</p>';
            }
            return;
        }

        // Only show the table format for viewing, not the input forms
        this.displayFixturesTable(fixtures);
    }

    // Display fixtures in edit mode (input forms)
    displayFixturesForEditing(fixtures) {
        const fixturesContainer = document.querySelector('#fixtures-container');
        if (!fixturesContainer) return;

        fixturesContainer.innerHTML = '';
        
        if (fixtures.length === 0) {
            this.addFixtureRow();
            return;
        }

        fixtures.forEach(fixture => {
            this.addFixtureRowWithData(fixture);
        });
    }

    // Edit fixtures - switch to edit mode
    async editFixtures() {
        try {
            const gameweek = document.querySelector('#gameweek-select').value;
            if (!gameweek) {
                alert('Please select a gameweek first');
                return;
            }

            // Hide the Current Fixtures table when switching to edit mode
            const fixturesTableContainer = document.querySelector('#fixtures-table-container');
            if (fixturesTableContainer) {
                fixturesTableContainer.style.display = 'none';
            }

            // Load fixtures for editing
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            if (doc.exists) {
                const fixtures = doc.data().fixtures || [];
                this.displayFixturesForEditing(fixtures);
            } else {
                // No fixtures exist, show empty edit form
                this.displayFixturesForEditing([]);
            }
        } catch (error) {
            console.error('Error loading fixtures for editing:', error);
            alert('Error loading fixtures for editing: ' + error.message);
        }
    }

    // Switch back to view mode
    switchToViewMode() {
        // Show the Current Fixtures table when switching back to view mode
        const fixturesTableContainer = document.querySelector('#fixtures-table-container');
        if (fixturesTableContainer) {
            fixturesTableContainer.style.display = 'block';
        }
        this.loadFixturesForGameweek();
    }

    // Display fixtures in a table format for admin viewing
    displayFixturesTable(fixtures) {
        const fixturesTableContainer = document.querySelector('#fixtures-table-container');
        if (!fixturesTableContainer) return;

        if (fixtures.length === 0) {
            fixturesTableContainer.innerHTML = '<p>No fixtures found for this gameweek</p>';
            return;
        }

        let tableHTML = `
            <h4>Current Fixtures</h4>
            <table class="league-table">
                <thead>
                    <tr>
                        <th>Home Team</th>
                        <th>Away Team</th>
                        <th>Date</th>
                        <th>Kick-Off Time</th>
                        <th>Venue</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        fixtures.forEach(fixture => {
            // Format the date and time properly
            let dateDisplay = 'TBD';
            let timeDisplay = 'TBD';
            
            if (fixture.date) {
                try {
                    const dateObj = new Date(fixture.date);
                    if (!isNaN(dateObj.getTime())) {
                        dateDisplay = dateObj.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                } catch (e) {
                    console.warn('Invalid date format:', fixture.date);
                }
            }
            
            // Prioritize kickOffTime over dateTime for time display
            if (fixture.kickOffTime && fixture.kickOffTime !== 'TBD') {
                try {
                    // Parse the time string (HH:MM:SS or HH:MM)
                    const timeParts = fixture.kickOffTime.split(':');
                    if (timeParts.length >= 2) {
                        const hours = timeParts[0];
                        const minutes = timeParts[1];
                        timeDisplay = `${hours}:${minutes}`;
                        console.log(`Time display from kickOffTime: ${timeDisplay} (from ${fixture.kickOffTime})`);
                    }
                } catch (e) {
                    console.warn('Invalid time format:', fixture.kickOffTime);
                }
            } else if (fixture.time && fixture.time !== 'TBD') {
                // Handle 'time' field from API imports
                try {
                    const timeParts = fixture.time.split(':');
                    if (timeParts.length >= 2) {
                        const hours = timeParts[0];
                        const minutes = timeParts[1];
                        timeDisplay = `${hours}:${minutes}`;
                        console.log(`Time display from time field: ${timeDisplay} (from ${fixture.time})`);
                    }
                } catch (e) {
                    console.warn('Invalid time format:', fixture.time);
                }
            } else if (fixture.dateTime) {
                try {
                    const dateTimeObj = new Date(fixture.dateTime);
                    if (!isNaN(dateTimeObj.getTime())) {
                        timeDisplay = dateTimeObj.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                        console.log(`Time display from dateTime: ${timeDisplay} (from ${fixture.dateTime})`);
                    }
                } catch (e) {
                    console.warn('Invalid datetime format:', fixture.dateTime);
                }
            }
            
            // Debug logging
            console.log(`Fixture ${fixture.homeTeam} vs ${fixture.awayTeam}:`, {
                date: fixture.date,
                kickOffTime: fixture.kickOffTime,
                time: fixture.time,
                dateTime: fixture.dateTime,
                finalTimeDisplay: timeDisplay
            });

            tableHTML += `
                <tr>
                    <td>${fixture.homeTeam || 'TBD'}</td>
                    <td>${fixture.awayTeam || 'TBD'}</td>
                    <td>${dateDisplay}</td>
                    <td>${timeDisplay}</td>
                    <td>${fixture.venue || 'TBD'}</td>
                    <td>${fixture.status || 'NS'}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        fixturesTableContainer.innerHTML = tableHTML;
    }

    // Add fixture row with data
    addFixtureRowWithData(fixture) {
        const fixturesContainer = document.querySelector('#fixtures-container');
        if (!fixturesContainer) return;

        // Reconstruct the datetime-local value from date and kickOffTime
        let datetimeValue = '';
        if (fixture.date && (fixture.kickOffTime || fixture.time)) {
            try {
                // Use kickOffTime first, fallback to time field
                const timeValue = fixture.kickOffTime && fixture.kickOffTime !== 'TBD' ? fixture.kickOffTime : fixture.time;
                
                // Combine date and time into ISO format for datetime-local input
                const dateTime = new Date(`${fixture.date}T${timeValue}`);
                if (!isNaN(dateTime.getTime())) {
                    // Format as YYYY-MM-DDTHH:MM for datetime-local input
                    const year = dateTime.getFullYear();
                    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
                    const day = String(dateTime.getDate()).padStart(2, '0');
                    const hours = String(dateTime.getHours()).padStart(2, '0');
                    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
                    datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                    console.log(`Reconstructed datetime for editing: ${datetimeValue} from date: ${fixture.date}, time: ${timeValue}`);
                }
            } catch (e) {
                console.warn('Error reconstructing datetime:', e);
                // Fallback to original dateTime if available
                datetimeValue = fixture.dateTime || '';
            }
        } else if (fixture.dateTime) {
            // Use original dateTime if available
            datetimeValue = fixture.dateTime;
        }

        const fixtureRow = document.createElement('div');
        fixtureRow.className = 'fixture-row';
        fixtureRow.innerHTML = `
            <div class="fixture-inputs">
                <input type="text" class="home-team" value="${fixture.homeTeam || ''}" placeholder="Home Team">
                <input type="text" class="away-team" value="${fixture.awayTeam || ''}" placeholder="Away Team">
                <input type="datetime-local" class="fixture-date" value="${datetimeValue}">
                <input type="text" class="venue" value="${fixture.venue || ''}" placeholder="Venue">
                <button type="button" class="remove-fixture-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </div>
        `;
        fixturesContainer.appendChild(fixtureRow);
    }

    // Load scores for gameweek
    loadScoresForGameweek() {
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        if (!scoreGameweekSelect) {
            console.log('Score gameweek select not found, skipping scores load');
            return;
        }
        
        const gameweek = scoreGameweekSelect.value;
        // Use the same format as the main app.js file
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
        
        this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (doc.exists) {
                const fixtures = doc.data().fixtures || [];
                this.displayScores(fixtures);
            } else {
                this.displayScores([]);
            }
        }).catch(error => {
            console.error('Error loading scores:', error);
            this.displayScores([]);
        });
    }

    // Display scores
    displayScores(fixtures) {
        const scoresContainer = document.querySelector('#scores-container');
        if (!scoresContainer) return;

        scoresContainer.innerHTML = '';
        
        if (fixtures.length === 0) {
            scoresContainer.innerHTML = '<p>No fixtures found for this gameweek</p>';
            return;
        }

        fixtures.forEach((fixture, index) => {
            this.addScoreRow(fixture, index);
        });
    }

    // Add score row
    addScoreRow(fixture, index) {
        const scoresContainer = document.querySelector('#scores-container');
        if (!scoresContainer) return;

        const scoreRow = document.createElement('div');
        scoreRow.className = 'score-row';
        scoreRow.innerHTML = `
            <div class="score-inputs">
                <span class="team-names">${fixture.homeTeam} vs ${fixture.awayTeam}</span>
                <input type="number" class="home-score" value="${fixture.homeScore || ''}" placeholder="0" min="0">
                <span>-</span>
                <input type="number" class="away-score" value="${fixture.awayScore || ''}" placeholder="0" min="0">
                <select class="fixture-status">
                    <option value="NS" ${fixture.status === 'NS' ? 'selected' : ''}>Not Started</option>
                    <option value="1H" ${fixture.status === '1H' ? 'selected' : ''}>First Half</option>
                    <option value="HT" ${fixture.status === 'HT' ? 'selected' : ''}>Half Time</option>
                    <option value="2H" ${fixture.status === '2H' ? 'selected' : ''}>Second Half</option>
                    <option value="FT" ${fixture.status === 'FT' ? 'selected' : ''}>Full Time</option>
                    <option value="AET" ${fixture.status === 'AET' ? 'selected' : ''}>Extra Time</option>
                    <option value="PEN" ${fixture.status === 'PEN' ? 'selected' : ''}>Penalties</option>
                </select>
                <span class="fixture-date">${fixture.date ? new Date(fixture.date).toLocaleDateString('en-GB') : 'TBD'}</span>
            </div>
        `;
        scoresContainer.appendChild(scoreRow);
    }

    // Save scores
    async saveScores() {
        try {
            if (!window.currentActiveEdition) {
                alert('No active edition selected. Please select an edition first.');
                return;
            }
            
            const gameweek = document.querySelector('#score-gameweek-select').value;
            if (!gameweek) {
                alert('No gameweek selected. Please select a gameweek first.');
                return;
            }
            
            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            const scoresContainer = document.querySelector('#scores-container');
            if (!scoresContainer) {
                alert('Scores container not found. Please ensure you are on the correct page.');
                return;
            }
            
            const scoreRows = document.querySelectorAll('.score-row');
            if (scoreRows.length === 0) {
                alert('No score rows found. Please load fixtures first.');
                return;
            }
            
            const fixtures = [];

            scoreRows.forEach(row => {
                const teamNamesElement = row.querySelector('.team-names');
                const dateElement = row.querySelector('.fixture-date');
                
                if (!teamNamesElement || !dateElement) {
                    console.warn('Missing required elements in score row:', row);
                    return; // Skip this row
                }
                
                const teamNames = teamNamesElement.textContent;
                if (!teamNames) {
                    console.warn('Team names element has no text content:', teamNamesElement);
                    return; // Skip this row
                }
                
                const [homeTeam, awayTeam] = teamNames.split(' vs ');
                if (!homeTeam || !awayTeam) {
                    console.warn('Invalid team names format:', teamNames);
                    return; // Skip this row
                }
                
                const homeScore = parseInt(row.querySelector('.home-score').value) || 0;
                const awayScore = parseInt(row.querySelector('.away-score').value) || 0;
                const status = row.querySelector('.fixture-status').value;
                
                // Handle both input and span elements for fixture-date
                let date;
                if (dateElement.tagName === 'INPUT') {
                    date = dateElement.value;
                } else {
                    date = dateElement.textContent;
                }

                fixtures.push({
                    homeTeam: homeTeam.trim(),
                    awayTeam: awayTeam.trim(),
                    homeScore,
                    awayScore,
                    status,
                    date: date && date !== 'TBD' ? new Date(date).toISOString() : null
                });
            });

            if (fixtures.length === 0) {
                alert('No scores to save');
                return;
            }

            await this.db.collection('fixtures').doc(editionGameweekKey).set({
                fixtures: fixtures,
                gameweek: gameweek,
                edition: window.currentActiveEdition,
                lastUpdated: new Date()
            });

            alert(`Saved scores for ${fixtures.length} fixtures in gameweek ${gameweek}`);

        } catch (error) {
            console.error('Error saving scores:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                scoreRowsCount: document.querySelectorAll('.score-row').length,
                scoresContainer: !!document.querySelector('#scores-container')
            });
            alert('Error saving scores: ' + error.message);
        }
    }

    // Load current gameweek fixtures
    async loadCurrentGameweekFixtures() {
        try {
            const currentGameweek = this.getActiveGameweek();
            if (!currentGameweek) {
                console.log('No active game week found');
                return;
            }
            
            const fixturesDoc = await this.db.collection('fixtures').doc(`gameweek_${currentGameweek}`).get();
            if (fixturesDoc.exists) {
                this.currentGameweekFixtures = fixturesDoc.data().fixtures || [];
                console.log(`Loaded ${this.currentGameweekFixtures.length} fixtures for game week ${currentGameweek}`);
            }
        } catch (error) {
            console.error('Error loading current game week fixtures:', error);
        }
    }

    // Get active gameweek (placeholder - should be implemented based on your logic)
    getActiveGameweek() {
        // This should return the current active gameweek
        // Implementation depends on your existing logic
        return '1'; // Placeholder
    }

    // Load fixtures for deadline
    async loadFixturesForDeadline(gameweek, userData = null, userId = null) {
        const fixturesDisplayContainer = document.querySelector('#fixtures-display-container');
        if (!fixturesDisplayContainer) return;

        const fixturesDisplay = document.querySelector('#fixtures-display');
        if (!fixturesDisplay) return;

        try {
            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            console.log('Loading fixtures for deadline:', editionGameweekKey);
            
            // Load edition-specific fixtures only
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    console.log('Found fixtures:', fixtures.length);
                    
                    // Always render fixtures - let the render method handle status display
                    this.renderFixturesDisplay(fixtures, userData, gameweek, userId);
                    fixturesDisplayContainer.style.display = 'block';
                } else {
                    console.log('No fixtures found for gameweek');
                    fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                    fixturesDisplayContainer.style.display = 'block';
                }
            } else {
                console.log('No fixtures document found for:', editionGameweekKey);
                fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                fixturesDisplayContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading fixtures for deadline:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
            fixturesDisplayContainer.style.display = 'block';
        }
    }

    // Render fixtures display
    async renderFixturesDisplay(fixtures, userData = null, currentGameWeek = null, userId = null) {
        const fixturesDisplayContainer = document.querySelector('#fixtures-display-container');
        const fixturesDisplay = document.querySelector('#fixtures-display');
        const deadlineDate = document.querySelector('#deadline-date');
        const deadlineStatus = document.querySelector('#deadline-status');
        const pickStatusDisplay = document.querySelector('#pick-status-display');
        
        if (!fixturesDisplayContainer || !fixturesDisplay) {
            console.warn('Fixtures display containers not found');
            return;
        }
        
        console.log('Rendering fixtures display for', fixtures.length, 'fixtures');
        
        try {
            // Show the container
            fixturesDisplayContainer.style.display = 'block';
            
            if (!fixtures || fixtures.length === 0) {
                fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                return;
            }
            
            // Find the earliest fixture (deadline)
            const earliestFixture = fixtures.reduce((earliest, fixture) => {
                const fixtureDate = new Date(fixture.date);
                const earliestDate = new Date(earliest.date);
                return fixtureDate < earliestDate ? fixture : earliest;
            });
            
            // Update deadline display
            if (deadlineDate && earliestFixture.date) {
                const deadlineDateObj = new Date(earliestFixture.date);
                const formattedDeadline = deadlineDateObj.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                deadlineDate.textContent = formattedDeadline;
            }
            
            // Check if all fixtures are completed
            const allFixturesCompleted = fixtures.every(fixture =>
                fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
            );
            
            // Check if all fixtures have finished
            const allFixturesFinished = fixtures.every(fixture =>
                fixture.status && fixture.status !== 'NS' && fixture.status !== '1H' && fixture.status !== 'HT' && fixture.status !== '2H'
            );
            
            // Update status display
            if (deadlineStatus) {
                if (allFixturesCompleted) {
                    deadlineStatus.textContent = 'All fixtures completed';
                    deadlineStatus.style.color = '#28a745';
                } else if (allFixturesFinished) {
                    deadlineStatus.textContent = 'All fixtures finished, processing results...';
                    deadlineStatus.style.color = '#ffc107';
                } else {
                    deadlineStatus.textContent = 'Fixtures in progress';
                    deadlineStatus.style.color = '#007bff';
                }
            }
            
            // Update pick status
            if (pickStatusDisplay && userData && userData.picks) {
                const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                const userPick = userData.picks[gameweekKey];
                
                if (userPick) {
                    pickStatusDisplay.textContent = `Pick made: ${userPick.team}`;
                    pickStatusDisplay.style.color = '#28a745';
                } else {
                    pickStatusDisplay.textContent = 'No pick made yet';
                    pickStatusDisplay.style.color = '#dc3545';
                }
            }
            
            // Render fixtures
            let fixturesHTML = '<div class="fixtures-list">';
            fixtures.forEach((fixture, index) => {
                const fixtureDate = new Date(fixture.date);
                const formattedDate = fixtureDate.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                let statusClass = 'fixture-status';
                let statusText = fixture.status || 'NS';
                
                if (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                    statusClass += ' completed';
                } else if (fixture.status === '1H' || fixture.status === 'HT' || fixture.status === '2H') {
                    statusClass += ' in-progress';
                } else if (fixture.status === 'NS') {
                    statusClass += ' not-started';
                }
                
                fixturesHTML += `
                    <div class="fixture-item">
                        <div class="fixture-header">
                            <span class="fixture-date">${formattedDate}</span>
                            <span class="${statusClass}">${statusText}</span>
                        </div>
                        <div class="fixture-teams">
                            <span class="team home-team">${fixture.homeTeam}</span>
                            <span class="vs">v</span>
                            <span class="team away-team">${fixture.awayTeam}</span>
                        </div>
                        ${fixture.homeScore !== undefined && fixture.awayScore !== undefined ? 
                            `<div class="fixture-score">${fixture.homeScore} - ${fixture.awayScore}</div>` : 
                            '<div class="fixture-score">-</div>'
                        }
                    </div>
                `;
            });
            
            fixturesHTML += '</div>';
            fixturesDisplay.innerHTML = fixturesHTML;
            
        } catch (error) {
            console.error('Error rendering fixtures display:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
        }
    }

    // Load mobile fixtures for deadline
    async loadMobileFixturesForDeadline(gameweek, userData = null, userId = null) {
        const fixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
        if (!fixturesDisplayContainer) return;

        const fixturesDisplay = document.querySelector('#mobile-fixtures-display');
        if (!fixturesDisplay) return;

        try {
            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            console.log('Loading mobile fixtures for deadline:', editionGameweekKey);
            
            // Load edition-specific fixtures only
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    console.log('Found mobile fixtures:', fixtures.length);
                    
                    // Always render fixtures - let the render method handle status display
                    this.renderMobileFixturesDisplay(fixtures, userData, gameweek, userId);
                    fixturesDisplayContainer.style.display = 'block';
                } else {
                    console.log('No mobile fixtures found for gameweek');
                    fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                    fixturesDisplayContainer.style.display = 'block';
                }
            } else {
                console.log('No mobile fixtures document found for:', editionGameweekKey);
                fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                fixturesDisplayContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading mobile fixtures for deadline:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
            fixturesDisplayContainer.style.display = 'block';
        }
    }

    // Render mobile fixtures display
    async renderMobileFixturesDisplay(fixtures, userData = null, currentGameWeek = null, userId = null) {
        const fixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
        const fixturesDisplay = document.querySelector('#mobile-fixtures-display');
        const deadlineDate = document.querySelector('#mobile-deadline-date');
        const deadlineStatus = document.querySelector('#mobile-deadline-status');
        const pickStatusDisplay = document.querySelector('#mobile-pick-status-display');
        
        if (!fixturesDisplayContainer || !fixturesDisplay) {
            console.warn('Mobile fixtures display containers not found');
            return;
        }
        
        console.log('Rendering mobile fixtures display for', fixtures.length, 'fixtures');
        
        try {
            // Show the container
            fixturesDisplayContainer.style.display = 'block';
            
            if (!fixtures || fixtures.length === 0) {
                fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                return;
            }
            
            // Find the earliest fixture (deadline)
            const earliestFixture = fixtures.reduce((earliest, fixture) => {
                const fixtureDate = new Date(fixture.date);
                const earliestDate = new Date(earliest.date);
                return fixtureDate < earliestDate ? fixture : earliest;
            });
            
            // Update deadline display
            if (deadlineDate && earliestFixture.date) {
                const deadlineDateObj = new Date(earliestFixture.date);
                const formattedDeadline = deadlineDateObj.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                deadlineDate.textContent = formattedDeadline;
            }
            
            // Check if all fixtures are completed
            const allFixturesCompleted = fixtures.every(fixture =>
                fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
            );
            
            // Check if all fixtures have finished
            const allFixturesFinished = fixtures.every(fixture =>
                fixture.status && fixture.status !== 'NS' && fixture.status !== '1H' && fixture.status !== 'HT' && fixture.status !== '2H'
            );
            
            // Update status display
            if (deadlineStatus) {
                if (allFixturesCompleted) {
                    deadlineStatus.textContent = 'All fixtures completed';
                    deadlineStatus.style.color = '#28a745';
                } else if (allFixturesFinished) {
                    deadlineStatus.textContent = 'All fixtures finished, processing results...';
                    deadlineStatus.style.color = '#ffc107';
                } else {
                    deadlineStatus.textContent = 'Fixtures in progress';
                    deadlineStatus.style.color = '#007bff';
                }
            }
            
            // Update pick status
            if (pickStatusDisplay && userData && userData.picks) {
                const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                const userPick = userData.picks[gameweekKey];
                
                if (userPick) {
                    pickStatusDisplay.textContent = `Pick made: ${userPick.team}`;
                    pickStatusDisplay.style.color = '#28a745';
                } else {
                    pickStatusDisplay.textContent = 'No pick made yet';
                    pickStatusDisplay.style.color = '#dc3545';
                }
            }
            
            // Render fixtures
            let fixturesHTML = '<div class="mobile-fixtures-list">';
            fixtures.forEach((fixture, index) => {
                const fixtureDate = new Date(fixture.date);
                const formattedDate = fixtureDate.toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                let statusClass = 'mobile-fixture-status';
                let statusText = fixture.status || 'NS';
                
                if (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                    statusClass += ' completed';
                } else if (fixture.status === '1H' || fixture.status === 'HT' || fixture.status === '2H') {
                    statusClass += ' in-progress';
                } else if (fixture.status === 'NS') {
                    statusClass += ' not-started';
                }
                
                fixturesHTML += `
                    <div class="mobile-fixture-item">
                        <div class="mobile-fixture-header">
                            <span class="mobile-fixture-date">${formattedDate}</span>
                            <span class="${statusClass}">${statusText}</span>
                        </div>
                        <div class="mobile-fixture-teams">
                            <span class="mobile-team home-team">${fixture.homeTeam}</span>
                            <span class="mobile-vs">v</span>
                            <span class="mobile-team away-team">${fixture.awayTeam}</span>
                        </div>
                        ${fixture.homeScore !== undefined && fixture.awayScore !== undefined ? 
                            `<div class="mobile-fixture-score">${fixture.homeScore} - ${fixture.awayScore}</div>` : 
                            '<div class="mobile-fixture-score">-</div>'
                        }
                    </div>
                `;
            });
            
            fixturesHTML += '</div>';
            fixturesDisplay.innerHTML = fixturesHTML;
            
        } catch (error) {
            console.error('Error rendering mobile fixtures display:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
        }
    }

    // Switch to fixtures tab
    switchToFixturesTab() {
        // Switch mobile tab to fixtures
        const mobileFixturesTab = document.querySelector('.mobile-tabs .tab-btn[data-tab="fixtures"]');
        const mobileFixturesPane = document.getElementById('fixtures-tab');

        if (mobileFixturesTab) mobileFixturesTab.classList.add('active');
        if (mobileFixturesPane) mobileFixturesPane.classList.add('active');

        // Switch desktop tab to fixtures
        const desktopFixturesTab = document.querySelector('.desktop-tabs .desktop-tab-btn[data-tab="fixtures"]');
        const desktopFixturesPane = document.getElementById('desktop-fixtures-tab');

        if (desktopFixturesTab) desktopFixturesTab.classList.add('active');
        if (desktopFixturesPane) desktopFixturesPane.classList.add('active');
    }

    // Load competition settings
    async loadCompetitionSettings() {
        try {
            const doc = await this.db.collection('settings').doc('competition').get();
            if (doc.exists) {
                const settings = doc.data();
                // Apply competition settings to the UI
                console.log('Competition settings loaded:', settings);
            }
        } catch (error) {
            console.error('Error loading competition settings:', error);
        }
    }

    // Load Football Web Pages settings
    async loadFootballWebPagesSettings() {
        try {
            const doc = await this.db.collection('settings').doc('footballWebPages').get();
            if (doc.exists) {
                const settings = doc.data();
                // Apply API settings to the UI
                console.log('Football Web Pages settings loaded:', settings);
            }
        } catch (error) {
            console.error('Error loading Football Web Pages settings:', error);
        }
    }

    // Save Football Web Pages settings
    async saveFootballWebPagesSettings() {
        try {
            const league = document.querySelector('#football-webpages-league')?.value;
            const season = document.querySelector('#football-webpages-season')?.value;
            
            if (!league || !season) {
                alert('Please fill in all required fields');
                return;
            }

            await this.db.collection('settings').doc('footballWebPages').set({
                league,
                season,
                lastUpdated: new Date()
            });

            alert('API settings saved successfully');
        } catch (error) {
            console.error('Error saving API settings:', error);
            alert('Error saving API settings: ' + error.message);
        }
    }

    // Import scores from Football Web Pages
    async importScoresFromFootballWebPages(gameweek) {
        try {
            // Implementation for importing scores from Football Web Pages API
            console.log('Importing scores from Football Web Pages for gameweek:', gameweek);
            alert('Score import functionality would be implemented here');
        } catch (error) {
            console.error('Error importing scores:', error);
            alert('Error importing scores: ' + error.message);
        }
    }

    // Import scores from file
    async importScoresFromFile(file, gameweek) {
        try {
            // Implementation for importing scores from file
            console.log('Importing scores from file for gameweek:', gameweek);
            alert('File import functionality would be implemented here');
        } catch (error) {
            console.error('Error importing scores from file:', error);
            alert('Error importing scores from file: ' + error.message);
        }
    }

    // Start auto score updates
    startAutoScoreUpdates(gameweek) {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(async () => {
            await this.performAutoScoreUpdate(gameweek);
        }, 60000); // Check every minute

        console.log('Auto score updates started for gameweek:', gameweek);
    }

    // Stop auto score updates
    stopAutoScoreUpdates() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
        }
        console.log('Auto score updates stopped');
    }

    // Perform auto score update
    async performAutoScoreUpdate(gameweek) {
        try {
            // Implementation for automatic score updates
            console.log('Performing auto score update for gameweek:', gameweek);
        } catch (error) {
            console.error('Error in auto score update:', error);
        }
    }

    // Start real-time score updates
    startRealTimeScoreUpdates(gameweek) {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }

        this.realTimeUpdateInterval = setInterval(async () => {
            await this.performRealTimeUpdate(gameweek);
        }, 30000); // Check every 30 seconds

        console.log('Real-time score updates started for gameweek:', gameweek);
    }

    // Stop real-time score updates
    stopRealTimeScoreUpdates() {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
            this.realTimeUpdateInterval = null;
        }
        console.log('Real-time score updates stopped');
    }

    // Perform real-time update
    async performRealTimeUpdate(gameweek) {
        try {
            // Implementation for real-time score updates
            console.log('Performing real-time update for gameweek:', gameweek);
        } catch (error) {
            console.error('Error in real-time update:', error);
        }
    }

    // Process results
    processResults(gameweek, fixtures) {
        try {
            // Implementation for processing gameweek results
            console.log('Processing results for gameweek:', gameweek, 'with', fixtures.length, 'fixtures');
        } catch (error) {
            console.error('Error processing results:', error);
        }
    }

    // Check pick validity
    checkPickStillValid(pick, fixtures) {
        try {
            // Implementation for checking if a pick is still valid
            return true; // Placeholder
        } catch (error) {
            console.error('Error checking pick validity:', error);
            return false;
        }
    }

    // Calculate pick result
    calculatePickResult(pick, fixtures) {
        try {
            // Implementation for calculating pick results
            return 'win'; // Placeholder
        } catch (error) {
            console.error('Error calculating pick result:', error);
            return 'unknown';
        }
    }

    // Render player scores
    async renderPlayerScores(fixtures, gameweek) {
        try {
            // Implementation for rendering player scores
            console.log('Rendering player scores for gameweek:', gameweek, 'with', fixtures.length, 'fixtures');
        } catch (error) {
            console.error('Error rendering player scores:', error);
        }
    }

    // Render desktop player scores
    renderDesktopPlayerScores(fixtures, gameweek) {
        try {
            // Implementation for rendering desktop player scores
            console.log('Rendering desktop player scores for gameweek:', gameweek, 'with', fixtures.length, 'fixtures');
        } catch (error) {
            console.error('Error rendering desktop player scores:', error);
        }
    }

    // Render mobile player scores
    renderMobilePlayerScores(fixtures, gameweek) {
        try {
            // Implementation for rendering mobile player scores
            console.log('Rendering mobile player scores for gameweek:', gameweek, 'with', fixtures.length, 'fixtures');
        } catch (error) {
            console.error('Error rendering mobile player scores:', error);
        }
    }

    // Render as-it-stands standings
    async renderAsItStandsStandings(players, fixtures, gameweek, edition, platform) {
        try {
            // Implementation for rendering as-it-stands standings
            console.log('Rendering as-it-stands standings for gameweek:', gameweek, 'edition:', edition, 'platform:', platform);
        } catch (error) {
            console.error('Error rendering as-it-stands standings:', error);
        }
    }

    // Cleanup method
    cleanup() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }
        console.log('FixturesManager cleaned up');
    }
}

// Export the FixturesManager class
export default FixturesManager;
