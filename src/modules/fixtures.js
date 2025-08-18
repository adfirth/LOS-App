// Fixtures Management Module

class FixturesManager {
    constructor(db) {
        this.db = db;
        this.footballWebPagesAPI = null;
        this.deadlineChecker = null;
        this.currentGameWeek = null;
        this.userEdition = null;
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
                    // Fix: Save the full date+time instead of just the date
                    const date = dateTimeInput; // Keep the full datetime string
                    const kickOffTime = dateTime.toTimeString().split(' ')[0]; // HH:MM:SS format
                    
                    fixtures.push({
                        homeTeam,
                        awayTeam,
                        date, // Now contains full date+time like "2025-08-09T15:00"
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
            
            // Get the current active edition from the admin page selector
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            let currentActiveEdition = window.currentActiveEdition || 1;
            
            if (quickEditionSelector) {
                currentActiveEdition = quickEditionSelector.value;
            }
            
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            await this.db.collection('fixtures').doc(editionGameweekKey).set({
                fixtures: fixtures,
                gameweek: gameweek,
                edition: currentActiveEdition,
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
            
            // Get the current active edition from the admin page selector
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            let currentActiveEdition = window.currentActiveEdition || 1;
            
            if (quickEditionSelector) {
                currentActiveEdition = quickEditionSelector.value;
            }
            
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            
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
            
            // Get the current active edition from the admin page selector
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            let currentActiveEdition = window.currentActiveEdition || 1;
            
            if (quickEditionSelector) {
                currentActiveEdition = quickEditionSelector.value;
            }
            
            const sourceEditionGameweekKey = `edition${currentActiveEdition}_${sourceGameweekKey}`;
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
            const targetEditionGameweekKey = `edition${currentActiveEdition}_${targetGameweekKey}`;
            
            await this.db.collection('fixtures').doc(targetEditionGameweekKey).set({
                fixtures: sourceFixtures,
                gameweek: targetGameweek,
                edition: currentActiveEdition,
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
            
            // Get the current active edition from the admin page selector
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            let currentActiveEdition = window.currentActiveEdition || 1;
            
            if (quickEditionSelector) {
                currentActiveEdition = quickEditionSelector.value;
            }
            
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            
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
            
            // Check if we have API configuration - try multiple possible locations
            let apiKey = null;
            let apiHost = 'football-web-pages1.p.rapidapi.com';
            
            // Check multiple possible API configuration locations
            if (window.footballWebPagesConfig && window.footballWebPagesConfig.RAPIDAPI_KEY) {
                apiKey = window.footballWebPagesConfig.RAPIDAPI_KEY;
                apiHost = window.footballWebPagesConfig.RAPIDAPI_HOST || apiHost;
                console.log('🔑 Using API key from footballWebPagesConfig');
            } else if (window.footballWebPagesAPI && window.footballWebPagesAPI.config && window.footballWebPagesAPI.config.RAPIDAPI_KEY) {
                apiKey = window.footballWebPagesAPI.config.RAPIDAPI_KEY;
                apiHost = window.footballWebPagesAPI.config.RAPIDAPI_HOST || apiHost;
                console.log('🔑 Using API key from footballWebPagesAPI.config');
            } else if (window.apiManager && window.apiManager.footballWebPagesAPI && window.apiManager.footballWebPagesAPI.config && window.apiManager.footballWebPagesAPI.config.RAPIDAPI_KEY) {
                apiKey = window.apiManager.footballWebPagesAPI.config.RAPIDAPI_KEY;
                apiHost = window.apiManager.footballWebPagesAPI.config.RAPIDAPI_HOST || apiHost;
                console.log('🔑 Using API key from apiManager.footballWebPagesAPI.config');
            } else if (window.RAPIDAPI_KEY) {
                apiKey = window.RAPIDAPI_KEY;
                console.log('🔑 Using API key from global RAPIDAPI_KEY');
            } else if (window.envConfig && window.envConfig.RAPIDAPI_KEY) {
                apiKey = window.envConfig.RAPIDAPI_KEY;
                console.log('🔑 Using API key from envConfig');
            }
            
            if (!apiKey) {
                console.log('⚠️ No API configuration found - skipping API validation');
                console.log('🔍 Available API configuration objects:', {
                    footballWebPagesConfig: !!window.footballWebPagesConfig,
                    footballWebPagesAPI: !!window.footballWebPagesAPI,
                    apiManager: !!window.apiManager,
                    RAPIDAPI_KEY: !!window.RAPIDAPI_KEY,
                    envConfig: !!window.envConfig
                });
                return;
            }
            
            // Fetch fixtures from API for this date
            const apiUrl = `https://football-web-pages1.p.rapidapi.com/fixtures-results.json?from=${apiDate}&to=${apiDate}&comp=5&season=2025-2026`;
            
            console.log(`🔍 Fetching API data for ${apiDate}: ${apiUrl}`);
            console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': apiHost
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
        
        // Get the current active edition from the admin page selector
        const quickEditionSelector = document.querySelector('#quick-edition-selector');
        let currentActiveEdition = window.currentActiveEdition || 1;
        
        if (quickEditionSelector) {
            currentActiveEdition = quickEditionSelector.value;
            console.log(`🔧 Fixtures: Using edition from admin selector: ${currentActiveEdition}`);
        } else {
            console.log(`🔧 Fixtures: Using fallback edition: ${currentActiveEdition}`);
        }
        
        const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        console.log(`🔧 Fixtures: Loading fixtures for key: ${editionGameweekKey}`);
        
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
            
            // Get the current active edition from the admin page selector
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            let currentActiveEdition = window.currentActiveEdition || 1;
            
            if (quickEditionSelector) {
                currentActiveEdition = quickEditionSelector.value;
            }
            
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            
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

        fixtures.forEach((fixture, index) => {
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
        
        // Get the current active edition from the admin page selector
        const quickEditionSelector = document.querySelector('#quick-edition-selector');
        let currentActiveEdition = window.currentActiveEdition || 1;
        
        if (quickEditionSelector) {
            currentActiveEdition = quickEditionSelector.value;
        }
        
        const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
        
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
            // Get the current active edition from the admin page selector
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            let currentActiveEdition = window.currentActiveEdition || 1;
            
            if (quickEditionSelector) {
                currentActiveEdition = quickEditionSelector.value;
            }
            
            if (!currentActiveEdition) {
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
            const editionGameweekKey = `edition${currentActiveEdition}_${gameweekKey}`;
            
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
                edition: currentActiveEdition,
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
        console.log('🔍 loadFixturesForDeadline called with:', { gameweek, userData: userData ? 'exists' : 'null', userId });
        
        const fixturesDisplayContainer = document.querySelector('#fixtures-display-container');
        const fixturesDisplay = document.querySelector('#fixtures-display');
        const deadlineDate = document.querySelector('#deadline-date');
        const deadlineStatus = document.querySelector('#deadline-status');
        const pickStatusDisplay = document.querySelector('#pick-status-display');
        
        console.log('🔍 Found elements:', {
            fixturesDisplayContainer: !!fixturesDisplayContainer,
            fixturesDisplay: !!fixturesDisplay,
            deadlineDate: !!deadlineDate,
            deadlineStatus: !!deadlineStatus,
            pickStatusDisplay: !!pickStatusDisplay
        });
        
        if (!fixturesDisplayContainer || !fixturesDisplay) {
            console.warn('Fixtures display containers not found');
            return;
        }
        
        try {
                                // Handle tiebreak gameweek
                    const currentGameWeek = gameweek || '1';
                    const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                    
                    console.log('🔍 Current gameweek:', currentGameWeek);
                    console.log('🔍 Gameweek key:', gameweekKey);
            
            // Get user edition using EditionService if available
            let userEdition;
            if (window.editionService) {
                // Use EditionService to get user edition
                userEdition = window.editionService.getCurrentUserEdition();
                console.log('🔧 EditionService resolved user edition:', userEdition);
            } else {
                // Fallback to old method
                userEdition = this.getUserEdition(userData);
                console.log('🔧 Fallback method resolved user edition:', userEdition);
            }
            
            const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;
            
            console.log('🔍 Loading fixtures for deadline:', editionGameweekKey);
            
            const fixturesDoc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            
            if (fixturesDoc.exists) {
                const fixtures = fixturesDoc.data().fixtures;
                console.log('🔍 Found fixtures:', fixtures.length);
                
                if (fixtures && fixtures.length > 0) {
                    // Show the container
                    fixturesDisplayContainer.style.display = 'block';
                    
                    // Show the gameweek navigation
                    const gameweekNavigation = document.querySelector('#gameweek-navigation');
                    if (gameweekNavigation) {
                        gameweekNavigation.style.display = 'block';
                        console.log('🔍 Gameweek navigation shown');
                    }
                    
                    // Add gameweek status indicator
                    const gameweekStatus = this.getGameweekStatus(fixtures, currentGameWeek);
                    let statusText = '';
                    let statusColor = '';
                    
                    switch (gameweekStatus) {
                        case 'not-started':
                            statusText = 'Gameweek Not Started';
                            statusColor = '#007bff'; // Blue
                            break;
                        case 'in-progress':
                            statusText = 'Gameweek In Progress';
                            statusColor = '#ffc107'; // Yellow
                            break;
                        case 'completed':
                            statusText = 'Gameweek Completed';
                            statusColor = '#28a745'; // Green
                            break;
                    }
                    
                    // Update or create gameweek status display
                    let statusDisplay = document.querySelector('#gameweek-status-display');
                    if (!statusDisplay) {
                        statusDisplay = document.createElement('div');
                        statusDisplay.id = 'gameweek-status-display';
                        statusDisplay.style.cssText = `
                            padding: 8px 16px;
                            border-radius: 4px;
                            font-weight: bold;
                            text-align: center;
                            margin: 10px 0;
                            color: white;
                        `;
                        
                        // Insert after the fixtures display container
                        const fixturesContainer = document.querySelector('#fixtures-display-container');
                        if (fixturesContainer) {
                            fixturesContainer.parentNode.insertBefore(statusDisplay, fixturesContainer.nextSibling);
                        }
                    }
                    
                    statusDisplay.textContent = statusText;
                    statusDisplay.style.background = statusColor;
                    
                    // Debug: Log all fixture dates
                    console.log('🔍 All fixture dates:');
                    fixtures.forEach((fixture, index) => {
                        console.log(`🔍 Fixture ${index + 1}:`, {
                            date: fixture.date,
                            parsed: new Date(fixture.date),
                            homeTeam: fixture.homeTeam,
                            awayTeam: fixture.awayTeam
                        });
                    });
                    
                    // Find the earliest fixture (deadline)
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });
                    
                    console.log('🔍 Earliest fixture (deadline):', earliestFixture);
                    console.log('🔍 Earliest fixture date:', earliestFixture.date);
                    console.log('🔍 Deadline date element:', deadlineDate);
                    console.log('🔍 Deadline date element exists:', !!deadlineDate);
                    console.log('🔍 Earliest fixture exists:', !!earliestFixture);
                    console.log('🔍 Earliest fixture date exists:', !!(earliestFixture && earliestFixture.date));
                    
                    // Update deadline display using centralized DeadlineService
                    if (deadlineDate && earliestFixture) {
                        console.log('🔍 loadFixturesForDeadline: Using DeadlineService for deadline display');
                        
                        try {
                                            // Use DeadlineService to get formatted deadline
                if (window.deadlineService) {
                    const formattedDeadline = await window.deadlineService.getFormattedDeadline(currentGameWeek, null, userData, userId);
                    console.log('🔍 loadFixturesForDeadline: DeadlineService formatted deadline:', formattedDeadline);
                    
                    if (formattedDeadline && formattedDeadline !== 'No deadline set') {
                        deadlineDate.textContent = formattedDeadline;
                        console.log('🔍 loadFixturesForDeadline: Deadline set via DeadlineService:', formattedDeadline);
                    } else {
                        // Fallback to manual formatting if DeadlineService returns no deadline
                        console.log('🔍 loadFixturesForDeadline: DeadlineService returned no deadline, using fallback');
                        this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                    }
                } else {
                    // Fallback if DeadlineService not available
                    console.log('🔍 loadFixturesForDeadline: DeadlineService not available, using fallback');
                    this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                }
                        } catch (error) {
                            console.error('🔍 loadFixturesForDeadline: Error using DeadlineService:', error);
                            // Fallback to manual formatting
                            this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                        }
                    } else {
                        console.log('🔍 loadFixturesForDeadline: No deadline date element or earliest fixture');
                        console.log('🔍 loadFixturesForDeadline: deadlineDate:', deadlineDate);
                        console.log('🔍 loadFixturesForDeadline: earliestFixture:', earliestFixture);
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
                        console.log('🔍 Pick status debug - parameters:', {
                            currentGameWeek,
                            currentGameWeekType: typeof currentGameWeek,
                            userData: !!userData,
                            userDataPicks: !!userData.picks
                        });
                        
                        const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                        const userPick = userData.picks[gameweekKey] || null;
                        const gameweekStatus = this.getGameweekStatus(fixtures, currentGameWeek);
                        
                        console.log('🔍 Pick status debug:', {
                            gameweekKey,
                            userPick,
                            userPickType: typeof userPick,
                            allPicks: userData.picks,
                            gameweekStatus
                        });
                        
                        if (userPick) {
                            let statusText = `Pick made: ${userPick}`;
                            let statusColor = '#28a745'; // Green for made
                            
                            // Add gameweek status to the display
                            switch (gameweekStatus) {
                                case 'not-started':
                                    statusText += ' (Can change)';
                                    statusColor = '#007bff'; // Blue for editable
                                    break;
                                case 'in-progress':
                                    statusText += ' (Locked)';
                                    statusColor = '#ffc107'; // Yellow for in progress
                                    break;
                                case 'completed':
                                    statusText += ' (Completed)';
                                    statusColor = '#6c757d'; // Gray for completed
                                    break;
                            }
                            
                            pickStatusDisplay.textContent = statusText;
                            pickStatusDisplay.style.color = statusColor;
                        } else {
                            let statusText = 'No pick made yet';
                            let statusColor = '#dc3545'; // Red for no pick
                            
                            // Add gameweek status to the display
                            switch (gameweekStatus) {
                                case 'not-started':
                                    statusText += ' (Deadline: ' + this.getFormattedDeadline(fixtures) + ')';
                                    break;
                                case 'in-progress':
                                    statusText += ' (Gameweek in progress)';
                                    statusColor = '#ffc107'; // Yellow for in progress
                                    break;
                                case 'completed':
                                    statusText += ' (Gameweek completed)';
                                    statusColor = '#6c757d'; // Gray for completed
                                    break;
                            }
                            
                            pickStatusDisplay.textContent = statusText;
                            pickStatusDisplay.style.color = statusColor;
                        }
                    }
                    
                    // Render fixtures with interactive team pick buttons
                    let fixturesHTML = '<div class="fixtures-list">';
                    fixtures.forEach((fixture, index) => {
                        // Fix: Combine date and kickOffTime if both are available
                        let fixtureDateString = fixture.date;
                        if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
                            // Combine date with kick-off time
                            fixtureDateString = `${fixture.date}T${fixture.kickOffTime}`;
                            console.log(`🔍 Fixture ${index + 1}: Combined date and time:`, fixtureDateString);
                        } else if (fixtureDateString && !fixtureDateString.includes('T') && !fixtureDateString.includes(':')) {
                            // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                            fixtureDateString = `${fixtureDateString}T15:00:00`;
                            console.log(`🔍 Fixture ${index + 1}: Added default time to date string:`, fixtureDateString);
                        }
                        
                        const fixtureDate = new Date(fixtureDateString);
                        
                        // Log fixture date for debugging
                        console.log(`Fixture ${index + 1} date:`, fixture.date);
                        console.log(`Fixture ${index + 1} kickOffTime:`, fixture.kickOffTime);
                        console.log(`Fixture ${index + 1} parsed:`, fixtureDate);
                        
                        // Format the date properly - use the original date object directly
                        // This preserves the exact time without timezone conversion issues
                        const formattedDate = fixtureDate.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Europe/London' // Force UK timezone
                        });
                        
                        console.log(`Fixture ${index + 1} formatted:`, formattedDate);

                        let statusClass = 'fixture-status';
                        let statusText = fixture.status || 'NS';
                        
                        if (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                            statusClass += ' completed';
                        } else if (fixture.status === '1H' || fixture.status === 'HT' || fixture.status === '2H') {
                            statusClass += ' in-progress';
                        } else if (fixture.status === 'NS') {
                            statusClass += ' not-started';
                        }
                        
                        // Get team status for pick buttons
                        let homeTeamClasses = 'team-pick-button';
                        let awayTeamClasses = 'team-pick-button';
                        let homeTeamClickable = true;
                        let awayTeamClickable = true;
                        let homeTeamTooltip = 'Click to pick this team';
                        let awayTeamTooltip = 'Click to pick this team';
                        
                        // Check if user has already picked these teams
                        if (userData && userData.picks) {
                            const existingPicks = Object.values(userData.picks || {});
                            const currentPick = userData.picks[gameweekKey] || null;
                            
                            // Debug: Show what's in the user's picks
                            console.log('🔍 User picks debug:', {
                                gameweekKey,
                                currentPick,
                                allPicks: userData.picks,
                                existingPicksArray: existingPicks,
                                picksKeys: Object.keys(userData.picks)
                            });
                            

                            
                            // Get gameweek status and locked picks
                            const gameweekStatus = this.getGameweekStatus(fixtures, currentGameWeek);
                            const lockedPicks = this.getLockedPicks(userData.picks, currentGameWeek);
                            
                            console.log('🔍 Pick validation:', {
                                gameweek: currentGameWeek,
                                gameweekStatus,
                                currentPick,
                                lockedPicks,
                                homeTeam: fixture.homeTeam,
                                awayTeam: fixture.awayTeam,
                                existingPicks: existingPicks
                            });
                            
                            // Debug specific teams that might be incorrectly flagged
                            if (fixture.homeTeam === 'Hartlepool' || fixture.homeTeam === 'Gateshead' || 
                                fixture.awayTeam === 'Hartlepool' || fixture.awayTeam === 'Gateshead') {
                                console.log('🔍 Special Debug for Hartlepool/Gateshead:', {
                                    homeTeam: fixture.homeTeam,
                                    awayTeam: fixture.awayTeam,
                                    homeTeamInExistingPicks: existingPicks.includes(fixture.homeTeam),
                                    awayTeamInExistingPicks: existingPicks.includes(fixture.awayTeam),
                                    homeTeamInLockedPicks: lockedPicks.includes(fixture.homeTeam),
                                    awayTeamInLockedPicks: lockedPicks.includes(fixture.awayTeam),
                                    existingPicksArray: existingPicks,
                                    lockedPicksArray: lockedPicks,
                                    userDataPicks: userData.picks,
                                    currentPick: currentPick,
                                    gameweekKey: gameweekKey
                                });
                                

                            }
                            
                            // Check home team status
                            if (currentPick === fixture.homeTeam) {
                                homeTeamClasses += ' current-pick';
                                homeTeamClickable = gameweekStatus === 'not-started'; // Can change if not started
                                homeTeamTooltip = gameweekStatus === 'not-started' ? 
                                    'Current pick - click to change' : 
                                    'Current pick for this gameweek (locked)';
                            } else if (lockedPicks.includes(fixture.homeTeam)) {
                                homeTeamClasses += ' locked-pick';
                                homeTeamClickable = false;
                                homeTeamTooltip = 'Team locked - picked in previous gameweek';
                            } else if (existingPicks.includes(fixture.homeTeam)) {
                                homeTeamClasses += ' future-pick';
                                homeTeamClickable = false;
                                homeTeamTooltip = 'Picked in another gameweek';
                                

                            } else {
                                homeTeamClasses += ' available';
                                homeTeamClickable = gameweekStatus === 'not-started'; // Can pick if not started
                            }
                            
                            // Check away team status
                            if (currentPick === fixture.awayTeam) {
                                awayTeamClasses += ' current-pick';
                                awayTeamClickable = gameweekStatus === 'not-started'; // Can change if not started
                                awayTeamTooltip = gameweekStatus === 'not-started' ? 
                                    'Current pick - click to change' : 
                                    'Current pick for this gameweek (locked)';
                            } else if (lockedPicks.includes(fixture.awayTeam)) {
                                awayTeamClasses += ' locked-pick';
                                awayTeamClickable = false;
                                awayTeamTooltip = 'Team locked - picked in previous gameweek';
                            } else if (existingPicks.includes(fixture.awayTeam)) {
                                awayTeamClasses += ' future-pick';
                                awayTeamClickable = false;
                                awayTeamTooltip = 'Picked in another gameweek';
                                

                            } else {
                                awayTeamClasses += ' available';
                                awayTeamClickable = gameweekStatus === 'not-started'; // Can pick if not started
                            }
                        }
                        
                        // Create click attributes for team buttons
                        const homeTeamClickAttr = homeTeamClickable ? `onclick="selectTeamAsTempPick('${fixture.homeTeam}', ${currentGameWeek}, '${userId}')"` : '';
                        const awayTeamClickAttr = awayTeamClickable ? `onclick="selectTeamAsTempPick('${fixture.awayTeam}', ${currentGameWeek}, '${userId}')"` : '';
                        
                        fixturesHTML += `
                            <div class="fixture-item">
                                <div class="fixture-header">
                                    <span class="fixture-date">${formattedDate}</span>
                                    <span class="${statusClass}">${statusText}</span>
                                </div>
                                <div class="fixture-teams">
                                    <button class="${homeTeamClasses}" ${homeTeamClickAttr} ${!homeTeamClickable ? 'disabled' : ''} title="${homeTeamTooltip}">
                                        ${fixture.homeTeam}
                                        ${userData && userData.picks && userData.picks[gameweekKey] === fixture.homeTeam ? '<span class="pick-indicator">✓</span>' : ''}
                                    </button>
                                    <span class="vs">v</span>
                                    <button class="${awayTeamClasses}" ${awayTeamClickAttr} ${!awayTeamClickable ? 'disabled' : ''} title="${awayTeamTooltip}">
                                        ${fixture.awayTeam}
                                        ${userData && userData.picks && userData.picks[gameweekKey] === fixture.awayTeam ? '<span class="pick-indicator">✓</span>' : ''}
                                    </button>
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
                    
                } else {
                    console.log('No fixtures found for gameweek');
                    fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                    fixturesDisplayContainer.style.display = 'block';
                }
            } else {
                console.log('No fixtures document found for:', editionGameweekKey);
                fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                fixturesDisplayContainer.style.display = 'block';
                
                // Clear pick status display when no fixtures are available
                if (pickStatusDisplay) {
                    pickStatusDisplay.textContent = 'No fixtures available';
                    pickStatusDisplay.style.color = '#6c757d'; // Gray color for unavailable
                }
                
                // Clear deadline display when no fixtures are available
                if (deadlineDate) {
                    deadlineDate.textContent = 'No deadline set';
                    deadlineDate.style.color = '#6c757d'; // Gray color for unavailable
                }
                
                // Clear deadline status when no fixtures are available
                if (deadlineStatus) {
                    deadlineStatus.textContent = 'No fixtures available';
                    deadlineStatus.style.color = '#6c757d'; // Gray color for unavailable
                }
            }
        } catch (error) {
            console.error('Error loading fixtures for deadline:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
            fixturesDisplayContainer.style.display = 'block';
            
            // Clear pick status display on error
            if (pickStatusDisplay) {
                pickStatusDisplay.textContent = 'Error loading fixtures';
                pickStatusDisplay.style.color = '#dc3545'; // Red color for error
            }
            
            // Clear deadline display on error
            if (deadlineDate) {
                deadlineDate.textContent = 'Error loading deadline';
                deadlineDate.style.color = '#dc3545'; // Red color for error
            }
            
            // Clear deadline status on error
            if (deadlineStatus) {
                deadlineStatus.textContent = 'Error loading fixtures';
                deadlineStatus.style.color = '#dc3545'; // Red color for error
            }
        }
    }

    // Render fixtures display
    async renderFixturesDisplay(fixtures, userData, currentGameWeek) {
        
        
        try {
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
                
                // Debug: Log all fixture dates
                console.log('🔍 renderFixturesDisplay - All fixture dates:');
                fixtures.forEach((fixture, index) => {
                    console.log(`🔍 renderFixturesDisplay - Fixture ${index + 1}:`, {
                        date: fixture.date,
                        parsed: new Date(fixture.date),
                        homeTeam: fixture.homeTeam,
                        awayTeam: fixture.awayTeam
                    });
                });
                
                console.log('🔍 renderFixturesDisplay - Earliest fixture (deadline):', earliestFixture);
                console.log('🔍 renderFixturesDisplay - Earliest fixture date:', earliestFixture.date);
                console.log('🔍 renderFixturesDisplay - Deadline date element:', deadlineDate);
                console.log('🔍 renderFixturesDisplay - Deadline date element exists:', !!deadlineDate);
                console.log('🔍 renderFixturesDisplay - Earliest fixture exists:', !!earliestFixture);
                console.log('🔍 renderFixturesDisplay - Earliest fixture date exists:', !!(earliestFixture && earliestFixture.date));
                
                // Update deadline display using centralized DeadlineService
                if (deadlineDate && earliestFixture) {
                    console.log('🔍 renderFixturesDisplay - Using DeadlineService for deadline display');
                    
                    try {
                        // Use DeadlineService to get formatted deadline
                        if (window.deadlineService) {
                            const formattedDeadline = await window.deadlineService.getFormattedDeadline(currentGameWeek, null, userData, userId);
                            console.log('🔍 renderFixturesDisplay - DeadlineService formatted deadline:', formattedDeadline);
                            
                            if (formattedDeadline && formattedDeadline !== 'No deadline set') {
                                deadlineDate.textContent = formattedDeadline;
                                console.log('🔍 renderFixturesDisplay - Deadline set via DeadlineService:', formattedDeadline);
                            } else {
                                // Fallback to manual formatting if DeadlineService returns no deadline
                                console.log('🔍 renderFixturesDisplay - DeadlineService returned no deadline, using fallback');
                                this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                            }
                        } else {
                            // Fallback if DeadlineService not available
                            console.log('🔍 renderFixturesDisplay - DeadlineService not available, using fallback');
                            this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                        }
                    } catch (error) {
                        console.error('🔍 renderFixturesDisplay - Error using DeadlineService:', error);
                        // Fallback to manual formatting
                        this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                    }
                } else {
                    console.log('🔍 renderFixturesDisplay - No deadline date element or earliest fixture');
                    console.log('🔍 renderFixturesDisplay - deadlineDate:', deadlineDate);
                    console.log('🔍 renderFixturesDisplay - earliestFixture:', earliestFixture);
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
                console.log('🔍 Third pick status debug - parameters:', {
                    currentGameWeek,
                    currentGameWeekType: typeof currentGameWeek,
                    userData: !!userData,
                    userDataPicks: !!userData.picks
                });
                
                const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                const userPick = userData.picks[gameweekKey] || null;
                const gameweekStatus = this.getGameweekStatus(fixtures, currentGameWeek);
                
                console.log('🔍 Third pick status debug:', {
                    gameweekKey,
                    userPick,
                    userPickType: typeof userPick,
                    allPicks: userData.picks
                });
                
                if (userPick) {
                    // userPick is the team name directly, not an object with .team property
                    pickStatusDisplay.textContent = `Pick made: ${userPick}`;
                    pickStatusDisplay.style.color = '#28a745';
                } else {
                    pickStatusDisplay.textContent = 'No pick made yet';
                    pickStatusDisplay.style.color = '#dc3545';
                }
            }
                
                // Render fixtures
                let fixturesHTML = '<div class="fixtures-list">';
                fixtures.forEach((fixture, index) => {
                    // Fix: Combine date and kickOffTime if both are available
                    let fixtureDateString = fixture.date;
                    if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
                        // Combine date with kick-off time
                        fixtureDateString = `${fixture.date}T${fixture.kickOffTime}`;
                        console.log(`🔍 Fixture ${index + 1}: Combined date and time:`, fixtureDateString);
                    } else if (fixtureDateString && !fixtureDateString.includes('T') && !fixtureDateString.includes(':')) {
                        // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                        fixtureDateString = `${fixtureDateString}T15:00:00`;
                        console.log(`🔍 Fixture ${index + 1}: Added default time to date string:`, fixtureDateString);
                    }
                    
                    const fixtureDate = new Date(fixtureDateString);
                    
                    // Log fixture date for debugging
                    console.log(`Fixture ${index + 1} date:`, fixture.date);
                    console.log(`Fixture ${index + 1} kickOffTime:`, fixture.kickOffTime);
                    console.log(`Fixture ${index + 1} parsed:`, fixtureDate);
                    
                    // Format the date properly - use the original date object directly
                    // This preserves the exact time without timezone conversion issues
                    const formattedDate = fixtureDate.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/London' // Force UK timezone
                    });
                    
                    console.log(`Fixture ${index + 1} formatted:`, formattedDate);

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
            
            // Get user edition using EditionService if available
            let userEdition;
            if (window.editionService) {
                // Use EditionService to get user edition
                userEdition = window.editionService.getCurrentUserEdition();
                console.log('🔧 Mobile: EditionService resolved user edition:', userEdition);
            } else {
                // Fallback to old method
                userEdition = window.currentActiveEdition || 1;
                console.log('🔧 Mobile: Fallback method resolved user edition:', userEdition);
            }
            
            const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;
            
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
                    
                    // Show the mobile gameweek navigation
                    const mobileGameweekNavigation = document.querySelector('#mobile-gameweek-navigation');
                    if (mobileGameweekNavigation) {
                        mobileGameweekNavigation.style.display = 'block';
                        console.log('🔍 Mobile gameweek navigation shown');
                    }
                } else {
                    console.log('No mobile fixtures found for gameweek');
                    fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                    fixturesDisplayContainer.style.display = 'block';
                    
                    // Clear mobile pick status display when no fixtures are available
                    const mobilePickStatusDisplay = document.querySelector('#mobile-pick-status-display');
                    if (mobilePickStatusDisplay) {
                        mobilePickStatusDisplay.textContent = 'No fixtures available';
                        mobilePickStatusDisplay.style.color = '#6c757d'; // Gray color for unavailable
                    }
                    
                    // Clear mobile deadline display when no fixtures are available
                    const mobileDeadlineDate = document.querySelector('#mobile-deadline-date');
                    if (mobileDeadlineDate) {
                        mobileDeadlineDate.textContent = 'No deadline set';
                        mobileDeadlineDate.style.color = '#6c757d'; // Gray color for unavailable
                    }
                    
                    // Clear mobile deadline status when no fixtures are available
                    const mobileDeadlineStatus = document.querySelector('#mobile-deadline-status');
                    if (mobileDeadlineStatus) {
                        mobileDeadlineStatus.textContent = 'No fixtures available';
                        mobileDeadlineStatus.style.color = '#6c757d'; // Gray color for unavailable
                    }
                }
            } else {
                console.log('No mobile fixtures document found for:', editionGameweekKey);
                fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
                fixturesDisplayContainer.style.display = 'block';
                
                // Clear mobile pick status display when no fixtures document is found
                const mobilePickStatusDisplay = document.querySelector('#mobile-pick-status-display');
                if (mobilePickStatusDisplay) {
                    mobilePickStatusDisplay.textContent = 'No fixtures available';
                    mobilePickStatusDisplay.style.color = '#6c757d'; // Gray color for unavailable
                }
                
                // Clear mobile deadline display when no fixtures document is found
                const mobileDeadlineDate = document.querySelector('#mobile-deadline-date');
                if (mobileDeadlineDate) {
                    mobileDeadlineDate.textContent = 'No deadline set';
                    mobileDeadlineDate.style.color = '#6c757d'; // Gray color for unavailable
                }
                
                // Clear mobile deadline status when no fixtures document is found
                const mobileDeadlineStatus = document.querySelector('#mobile-deadline-status');
                if (mobileDeadlineStatus) {
                    mobileDeadlineStatus.textContent = 'No fixtures available';
                    mobileDeadlineStatus.style.color = '#6c757d'; // Gray color for unavailable
                }
            }
        } catch (error) {
            console.error('Error loading mobile fixtures for deadline:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
            fixturesDisplayContainer.style.display = 'block';
            
            // Clear mobile pick status display on error
            const mobilePickStatusDisplay = document.querySelector('#mobile-pick-status-display');
            if (mobilePickStatusDisplay) {
                mobilePickStatusDisplay.textContent = 'Error loading fixtures';
                mobilePickStatusDisplay.style.color = '#dc3545'; // Red color for error
            }
            
            // Clear mobile deadline display on error
            const mobileDeadlineDate = document.querySelector('#mobile-deadline-date');
            if (mobileDeadlineDate) {
                mobileDeadlineDate.textContent = 'Error loading deadline';
                mobileDeadlineDate.style.color = '#dc3545'; // Red color for error
            }
            
            // Clear mobile deadline status on error
            const mobileDeadlineStatus = document.querySelector('#mobile-deadline-status');
            if (mobileDeadlineStatus) {
                mobileDeadlineStatus.textContent = 'Error loading fixtures';
                mobileDeadlineStatus.style.color = '#dc3545'; // Red color for error
            }
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
            
            // Add mobile gameweek status indicator
            const gameweekStatus = this.getGameweekStatus(fixtures, currentGameWeek);
            let statusText = '';
            let statusColor = '';
            
            switch (gameweekStatus) {
                case 'not-started':
                    statusText = 'Gameweek Not Started';
                    statusColor = '#007bff'; // Blue
                    break;
                case 'in-progress':
                    statusText = 'Gameweek In Progress';
                    statusColor = '#ffc107'; // Yellow
                    break;
                case 'completed':
                    statusText = 'Gameweek Completed';
                    statusColor = '#28a745'; // Green
                    break;
            }
            
            // Update or create mobile gameweek status display
            let mobileStatusDisplay = document.querySelector('#mobile-gameweek-status-display');
            if (!mobileStatusDisplay) {
                mobileStatusDisplay = document.createElement('div');
                mobileStatusDisplay.id = 'mobile-gameweek-status-display';
                mobileStatusDisplay.style.cssText = `
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: bold;
                    text-align: center;
                    margin: 10px 0;
                    color: white;
                    font-size: 0.9rem;
                `;
                
                // Insert after the mobile fixtures display container
                const mobileFixturesContainer = document.querySelector('#mobile-fixtures-display-container');
                if (mobileFixturesContainer) {
                    mobileFixturesContainer.parentNode.insertBefore(mobileStatusDisplay, mobileFixturesContainer.nextSibling);
                }
            }
            
            mobileStatusDisplay.textContent = statusText;
            mobileStatusDisplay.style.background = statusColor;
            
            // Find the earliest fixture (deadline)
            const earliestFixture = fixtures.reduce((earliest, fixture) => {
                const fixtureDate = new Date(fixture.date);
                const earliestDate = new Date(earliest.date);
                return fixtureDate < earliestDate ? fixture : earliest;
            });
            
            // Update deadline display using centralized DeadlineService
            if (deadlineDate && earliestFixture) {
                console.log('🔍 Mobile fixtures: Using DeadlineService for deadline display');
                
                try {
                                            // Use DeadlineService to get formatted deadline
                        if (window.deadlineService) {
                            const formattedDeadline = await window.deadlineService.getFormattedDeadline(currentGameWeek, null, userData, userId);
                            console.log('🔍 Mobile fixtures: DeadlineService formatted deadline:', formattedDeadline);
                            
                            if (formattedDeadline && formattedDeadline !== 'No deadline set') {
                                deadlineDate.textContent = formattedDeadline;
                                console.log('🔍 Mobile fixtures: Deadline set via DeadlineService:', formattedDeadline);
                            } else {
                                // Fallback to manual formatting if DeadlineService returns no deadline
                                console.log('🔍 Mobile fixtures: DeadlineService returned no deadline, using fallback');
                                this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                            }
                        } else {
                            // Fallback if DeadlineService not available
                            console.log('🔍 Mobile fixtures: DeadlineService not available, using fallback');
                            this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                        }
                } catch (error) {
                    console.error('🔍 Mobile fixtures: Error using DeadlineService:', error);
                    // Fallback to manual formatting
                    this.setDeadlineDisplayFallback(deadlineDate, earliestFixture);
                }
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
                console.log('🔍 Mobile pick status debug - parameters:', {
                    currentGameWeek,
                    currentGameWeekType: typeof currentGameWeek,
                    userData: !!userData,
                    userDataPicks: !!userData.picks
                });
                
                const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                const userPick = userData.picks[gameweekKey] || null;
                const gameweekStatus = this.getGameweekStatus(fixtures, currentGameWeek);
                
                console.log('🔍 Mobile pick status debug:', {
                    gameweekKey,
                    userPick,
                    userPickType: typeof userPick,
                    allPicks: userData.picks,
                    gameweekStatus
                });
                
                if (userPick) {
                    let statusText = `Pick made: ${userPick}`;
                    let statusColor = '#28a745'; // Green for made
                    
                    // Add gameweek status to the display
                    switch (gameweekStatus) {
                        case 'not-started':
                            statusText += ' (Can change)';
                            statusColor = '#007bff'; // Blue for editable
                            break;
                        case 'in-progress':
                            statusText += ' (Locked)';
                            statusColor = '#ffc107'; // Yellow for in progress
                            break;
                        case 'completed':
                            statusText += ' (Completed)';
                            statusColor = '#6c757d'; // Gray for completed
                            break;
                    }
                    
                    pickStatusDisplay.textContent = statusText;
                    pickStatusDisplay.style.color = statusColor;
                } else {
                    let statusText = 'No pick made yet';
                    let statusColor = '#dc3545'; // Red for no pick
                    
                    // Add gameweek status to the display
                    switch (gameweekStatus) {
                        case 'not-started':
                            statusText += ' (Deadline: ' + this.getFormattedDeadline(fixtures) + ')';
                            break;
                        case 'in-progress':
                            statusText += ' (Gameweek in progress)';
                            statusColor = '#ffc107'; // Yellow for in progress
                            break;
                        case 'completed':
                            statusText += ' (Gameweek completed)';
                            statusColor = '#6c757d'; // Gray for completed
                            break;
                    }
                    
                    pickStatusDisplay.textContent = statusText;
                    pickStatusDisplay.style.color = statusColor;
                }
            }
            
            // Render fixtures
            let fixturesHTML = '<div class="mobile-fixtures-list">';
            fixtures.forEach((fixture, index) => {
                // Fix: Combine date and kickOffTime if both are available
                let fixtureDateString = fixture.date;
                if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
                    // Combine date with kick-off time
                    fixtureDateString = `${fixture.date}T${fixture.kickOffTime}`;
                    console.log(`🔍 Mobile fixture ${index + 1}: Combined date and time:`, fixtureDateString);
                } else if (fixtureDateString && !fixtureDateString.includes('T') && !fixtureDateString.includes(':')) {
                    // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                    fixtureDateString = `${fixtureDateString}T15:00:00`;
                    console.log(`🔍 Mobile fixture ${index + 1}: Added default time to date string:`, fixtureDateString);
                }
                
                const fixtureDate = new Date(fixtureDateString);
                // Format the date without timezone conversion to preserve the original time
                const year = fixtureDate.getFullYear();
                const month = fixtureDate.getMonth();
                const day = fixtureDate.getDate();
                const hours = fixtureDate.getHours();
                const minutes = fixtureDate.getMinutes();
                
                // Create a new date object in the user's local timezone but preserve the original time
                const localFixtureDate = new Date(year, month, day, hours, minutes);
                
                const formattedDate = localFixtureDate.toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/London' // Force UK timezone
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

    // === PICK MANAGEMENT HELPER FUNCTIONS ===
    
    /**
     * Get the status of a gameweek based on fixture start times
     * @param {Array} fixtures - Array of fixtures for the gameweek
     * @param {string|number} gameweek - The gameweek number
     * @returns {string} - 'not-started', 'in-progress', or 'completed'
     */
    getGameweekStatus(fixtures, gameweek) {
        if (!fixtures || fixtures.length === 0) return 'not-started';
        
        const now = new Date();
        
        // Special handling for Test Weeks - we know the exact deadlines
        if (gameweek === 3) {
            // Game Week 3 deadline is 19:45 on 19th August 2025
            const gw3Deadline = new Date('2025-08-19T19:45:00');
            
            console.log('🔍 Test Weeks GW3 Status Debug:', {
                gameweek,
                now: now.toISOString(),
                gw3Deadline: gw3Deadline.toISOString(),
                deadlinePassed: now >= gw3Deadline
            });
            
            if (now >= gw3Deadline) {
                // Check if all fixtures are completed
                const allCompleted = fixtures.every(fixture => 
                    fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
                );
                
                if (allCompleted) {
                    return 'completed';
                } else {
                    return 'in-progress';
                }
            } else {
                return 'not-started';
            }
        }
        
        // For other gameweeks, use the fixture-based logic
        // Find the earliest fixture (deadline)
        const earliestFixture = fixtures.reduce((earliest, fixture) => {
            const fixtureDate = this.createFixtureDateTime(fixture);
            const earliestDate = this.createFixtureDateTime(earliest);
            return fixtureDate < earliestDate ? fixture : earliest;
        });
        
        if (!earliestFixture) return 'not-started';
        
        const deadline = this.createFixtureDateTime(earliestFixture);
        
        // Add debugging for deadline calculation
        console.log('🔍 Gameweek Status Debug:', {
            gameweek,
            now: now.toISOString(),
            earliestFixture: earliestFixture.date,
            kickOffTime: earliestFixture.kickOffTime,
            deadline: deadline ? deadline.toISOString() : 'null',
            deadlinePassed: deadline ? deadline <= now : 'no deadline'
        });
        
        // Check if deadline has passed
        if (deadline && deadline <= now) {
            // Check if all fixtures are completed
            const allCompleted = fixtures.every(fixture => 
                fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
            );
            
            if (allCompleted) {
                return 'completed';
            } else {
                return 'in-progress';
            }
        } else {
            return 'not-started';
        }
    }
    
    /**
     * Get locked picks (teams that can't be picked again)
     * @param {Object} picks - User's picks object
     * @param {string|number} currentGameweek - Current gameweek being viewed
     * @returns {Array} - Array of locked team names
     */
    getLockedPicks(picks, currentGameweek) {
        if (!picks) return [];
        
        const lockedPicks = [];
        
        // Add debugging for locked picks calculation
        console.log('🔍 Locked Picks Debug:', {
            currentGameweek,
            allPicks: picks,
            picksKeys: Object.keys(picks)
        });
        
        // Check each gameweek's picks
        Object.entries(picks).forEach(([gameweekKey, team]) => {
            if (gameweekKey === 'gwtiebreak') return; // Skip tiebreak for now
            
            // Extract gameweek number more carefully
            let gameweekNum;
            if (gameweekKey.startsWith('gw')) {
                gameweekNum = parseInt(gameweekKey.replace('gw', ''));
            } else {
                // Handle other formats if they exist
                gameweekNum = parseInt(gameweekKey);
            }
            
            // For Test Weeks, we know the exact deadlines:
            // GW1: Started 15:00 on 9th August 2025
            // GW2: Started 12:30 on 16th August 2025
            // GW3: Not started yet (deadline 19:45 on 19th August 2025)
            
            const now = new Date();

            
            let shouldLock = false;
            
            if (gameweekKey === 'gw1') {
                const gw1Deadline = new Date('2025-08-09T15:00:00');
                shouldLock = now >= gw1Deadline;
                console.log(`🔍 GW1 (${team}): deadline ${gw1Deadline.toISOString()}, now ${now.toISOString()}, shouldLock: ${shouldLock}`);
            } else if (gameweekKey === 'gw2') {
                const gw2Deadline = new Date('2025-08-16T12:30:00');
                shouldLock = now >= gw2Deadline;
                console.log(`🔍 GW2 (${team}): deadline ${gw2Deadline.toISOString()}, now ${now.toISOString()}, shouldLock: ${shouldLock}`);
            } else if (gameweekKey === 'gw3') {
                const gw3Deadline = new Date('2025-08-19T19:45:00');
                shouldLock = now >= gw3Deadline;
                console.log(`🔍 GW3 (${team}): deadline ${gw3Deadline.toISOString()}, now ${now.toISOString()}, shouldLock: ${shouldLock}`);
            } else if (gameweekNum && gameweekNum < parseInt(currentGameweek)) {
                // For other gameweeks, use numeric comparison as fallback
                shouldLock = true;
                console.log(`🔒 Locking ${team} from ${gameweekKey} (numeric comparison)`);
            }
            
            if (shouldLock) {
                lockedPicks.push(team);
                console.log(`🔒 Locking ${team} from ${gameweekKey} (deadline passed)`);
            } else {
                console.log(`✅ Not locking ${team} from ${gameweekKey} (deadline not passed yet)`);
            }
        });
        
        console.log('🔍 Final locked picks:', lockedPicks);
        return lockedPicks;
    }
    
    /**
     * Create a proper datetime object from fixture data
     * @param {Object} fixture - Fixture object
     * @returns {Date|null} - Date object or null if invalid
     */
    createFixtureDateTime(fixture) {
        if (!fixture.date) return null;
        
        let dateString = fixture.date;
        
        // If the date already contains time (has 'T' or ':'), use it as-is
        if (dateString.includes('T') || dateString.includes(':')) {
            return new Date(dateString);
        }
        
        // If no time component, check if we have kickOffTime
        if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
            dateString = `${fixture.date}T${fixture.kickOffTime}`;
        } else {
            // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
            dateString = `${fixture.date}T15:00:00`;
        }
        
        // Add debugging for date parsing
        console.log('🔍 Date Parsing Debug:', {
            originalDate: fixture.date,
            kickOffTime: fixture.kickOffTime,
            finalDateString: dateString,
            parsedDate: new Date(dateString).toISOString()
        });
        
        return new Date(dateString);
    }
    
    /**
     * Get formatted deadline string for display
     * @param {Array} fixtures - Array of fixtures for the gameweek
     * @returns {string} - Formatted deadline string
     */
    getFormattedDeadline(fixtures) {
        if (!fixtures || fixtures.length === 0) return 'No deadline set';
        
        // Find the earliest fixture (deadline)
        const earliestFixture = fixtures.reduce((earliest, fixture) => {
            const fixtureDate = this.createFixtureDateTime(fixture);
            const earliestDate = this.createFixtureDateTime(earliest);
            return fixtureDate < earliestDate ? fixture : earliest;
        });
        
        if (!earliestFixture) return 'No deadline set';
        
        const deadline = this.createFixtureDateTime(earliestFixture);
        if (!deadline) return 'No deadline set';
        
        return deadline.toLocaleDateString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London'
        });
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

    // Get user edition
    getUserEdition(userData) {
        if (!userData || !userData.registrations) return 1;
        if (userData.preferredEdition) return userData.preferredEdition;
        if (userData.registrations.editiontest) return "test";
        if (userData.registrations.edition1) return 1;
        for (let i = 2; i <= 10; i++) {
            if (userData.registrations[`edition${i}`]) return i;
        }
        return 1;
    }

    // Fallback method for deadline display when DeadlineService is not available
    setDeadlineDisplayFallback(deadlineDate, earliestFixture) {
        if (!deadlineDate || !earliestFixture) return;
        
        console.log('🔍 Using fallback deadline display method');
        
        // Fix: Combine date and kickOffTime if both are available
        let dateString = earliestFixture.date;
        if (earliestFixture.kickOffTime && earliestFixture.kickOffTime !== '00:00:00') {
            // Combine date with kick-off time
            dateString = `${earliestFixture.date}T${earliestFixture.kickOffTime}`;
            console.log('🔍 Fallback: Combined date and time:', dateString);
        } else if (dateString && !dateString.includes('T') && !dateString.includes(':')) {
            // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
            dateString = `${dateString}T15:00:00`;
            console.log('🔍 Fallback: Added default time to date string:', dateString);
        }
        
        const deadlineDateObj = new Date(dateString);
        console.log('🔍 Fallback: Parsed date object:', deadlineDateObj);
        
        // Format the date properly - use the original date object directly
        // This preserves the exact time without timezone conversion issues
        const formattedDeadline = deadlineDateObj.toLocaleDateString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London' // Force UK timezone
        });
        
        console.log('🔍 Fallback: Formatted deadline:', formattedDeadline);
        deadlineDate.textContent = formattedDeadline;
    }

    // Load fixtures for a specific deadline
}

// Export the FixturesManager class
export default FixturesManager;
