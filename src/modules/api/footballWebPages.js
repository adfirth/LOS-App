// Football Web Pages API Module
// Handles all Football Web Pages API integrations, including fixtures, scores, and vidiprinter data

export class FootballWebPagesAPI {
    constructor(db = null, currentActiveEdition = 1) {
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        this.config = null;
        this.initializeConfiguration();
    }

    // Initialize configuration
    initializeConfiguration() {
        this.loadConfiguration();
    }

    // Load configuration from global variables
    loadConfiguration() {
        // First try to access from window object (most reliable)
        if (typeof window !== 'undefined' && window.FOOTBALL_WEBPAGES_CONFIG) {
            this.config = window.FOOTBALL_WEBPAGES_CONFIG;
            console.log('✅ Football Web Pages API configuration loaded from window object');
            console.log('API Key available:', !!this.config.RAPIDAPI_KEY);
            return true;
        }
        
        // Fallback: try to access as global variable (may not work in strict mode)
        if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
            this.config = FOOTBALL_WEBPAGES_CONFIG;
            console.log('✅ Football Web Pages API configuration loaded from global variable');
            console.log('API Key available:', !!this.config.RAPIDAPI_KEY);
            return true;
        }
        
        console.warn('⚠️ Football Web Pages API configuration not found - will retry during initialization');
        this.retryLoadConfiguration();
        return false;
    }

    // Retry loading configuration with exponential backoff
    retryLoadConfiguration() {
        let attempts = 0;
        const maxAttempts = 10;
        
        const attemptLoad = () => {
            attempts++;
            console.log(`🔄 Attempt ${attempts}/${maxAttempts} to load Football Web Pages API configuration...`);
            
            // First try window object (most reliable)
            if (typeof window !== 'undefined' && window.FOOTBALL_WEBPAGES_CONFIG) {
                this.config = window.FOOTBALL_WEBPAGES_CONFIG;
                console.log('✅ Football Web Pages API configuration loaded from window object on retry attempt', attempts);
                return;
            }
            
            // Fallback: try global variable
            if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
                this.config = FOOTBALL_WEBPAGES_CONFIG;
                console.log('✅ Football Web Pages API configuration loaded on retry attempt', attempts);
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(attemptLoad, 1000);
            } else {
                console.error('❌ Failed to load Football Web Pages API configuration after', maxAttempts, 'attempts');
                console.error('This will prevent API functions from working properly');
                
                // Try one more time after a longer delay
                setTimeout(() => {
                    if (typeof window !== 'undefined' && window.FOOTBALL_WEBPAGES_CONFIG) {
                        this.config = window.FOOTBALL_WEBPAGES_CONFIG;
                        console.log('✅ Football Web Pages API configuration loaded from window object on final attempt');
                    } else if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
                        this.config = FOOTBALL_WEBPAGES_CONFIG;
                        console.log('✅ Football Web Pages API configuration loaded on final attempt');
                    }
                }, 2000);
            }
        };
        
        setTimeout(attemptLoad, 100);
    }

    // Check if configuration is available
    isConfigurationLoaded() {
        return this.config !== null;
    }

    // Get configuration safely
    getConfiguration() {
        if (!this.isConfigurationLoaded()) {
            this.retryLoadConfiguration();
            return null;
        }
        return this.config;
    }

    // Test API connection
    async testApiConnection() {
        console.log('🧪 Testing Football Web Pages API connection...');
        
        const statusElement = document.querySelector('#api-key-status');
        const testBtn = document.querySelector('#test-api-btn');
        
        if (!statusElement || !testBtn) {
            console.error('Required elements not found for API test');
            return;
        }
        
        // Try to load configuration if not already loaded
        if (!this.config) {
            this.loadConfiguration();
            
            // Wait a bit for the config to load
            if (!this.config) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Check if we have the API configuration
        if (!this.config || !this.config.RAPIDAPI_KEY) {
            statusElement.textContent = 'API key not configured - please refresh the page';
            statusElement.className = 'status-indicator error';
            console.error('API configuration not available for test connection');
            return;
        }

        try {
            statusElement.textContent = 'Testing connection...';
            statusElement.className = 'status-indicator loading';
            testBtn.disabled = true;

            const response = await fetch('https://football-web-pages1.p.rapidapi.com/fixtures-results', {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.config.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': this.config.RAPIDAPI_HOST
                }
            });

            if (response.ok) {
                const data = await response.json();
                statusElement.textContent = `✅ API connection successful! Received ${data.length || 0} items`;
                statusElement.className = 'status-indicator success';
                console.log('✅ API test successful:', data);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ API test failed:', error);
            statusElement.textContent = `❌ API connection failed: ${error.message}`;
            statusElement.className = 'status-indicator error';
        } finally {
            testBtn.disabled = false;
        }
    }

    // Check API key status
    checkApiKeyStatus() {
        const statusElement = document.querySelector('#api-key-status');
        if (!statusElement) return;
        
        console.log('checkApiKeyStatus called');
        console.log('Current config:', this.config);
        console.log('FOOTBALL_WEBPAGES_CONFIG available:', typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined');
        
        // Try to load configuration if not already loaded
        if (!this.config && typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
            this.config = FOOTBALL_WEBPAGES_CONFIG;
            console.log('Football Web Pages API configuration loaded during status check');
        }
        
        if (this.config && this.config.RAPIDAPI_KEY) {
            statusElement.textContent = 'API key configured';
            statusElement.className = 'status-indicator success';
            console.log('API key status: Configured successfully');
        } else {
            statusElement.textContent = 'API key missing - retrying...';
            statusElement.className = 'status-indicator error';
            console.log('API key status: Missing - configuration may still be loading');
            
            // If we don't have the config yet, try to load it again
            if (!this.config) {
                this.retryLoadConfiguration();
            }
        }
    }

    // Fetch fixtures by date range
    async fetchDateRangeFixtures() {
        console.log('📅 Fetching fixtures by date range...');
        
        const startDate = document.querySelector('#start-date').value;
        const endDate = document.querySelector('#end-date').value;
        const statusElement = document.querySelector('#fetch-status');
        const league = document.querySelector('#date-range-league').value;
        const season = document.querySelector('#date-range-season').value;
        
        if (!startDate || !endDate) {
            if (statusElement) {
                statusElement.textContent = 'Please select both start and end dates';
                statusElement.className = 'status-message error';
            }
            return;
        }
        
        if (!league || !season) {
            if (statusElement) {
                statusElement.textContent = 'Please select both league and season';
                statusElement.className = 'status-message error';
            }
            return;
        }

        if (!statusElement) {
            console.error('Fetch status element not found');
            return;
        }

        // Try to load configuration if not already loaded
        if (!this.config) {
            this.loadConfiguration();
            
            // Wait a bit for the config to load
            if (!this.config) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Check if we have the API configuration
        if (!this.config || !this.config.RAPIDAPI_KEY) {
            statusElement.textContent = 'API key not configured - please refresh the page';
            statusElement.className = 'status-message error';
            console.error('API configuration not available for date range fetch');
            return;
        }

        try {
            console.log(`📅 Fetching fixtures with parameters: league=${league}, season=${season}, startDate=${startDate}, endDate=${endDate}`);
            
            // Try different date formats - the API might expect DD/MM/YYYY or MM/DD/YYYY
            const dateFormats = [
                startDate, // YYYY-MM-DD (original)
                startDate.split('-').reverse().join('/'), // DD/MM/YYYY
                startDate.split('-').slice(1).concat(startDate.split('-')[0]).join('/'), // MM/DD/YYYY
            ];
            
            console.log(`📅 Trying date formats:`, dateFormats);
            console.log(`📅 Note: You're searching for ${startDate} (${new Date(startDate).toLocaleDateString()})`);
            console.log(`📅 If you meant September 8th, 2025, use 2025-09-08 instead`);
            
            statusElement.textContent = 'Fetching fixtures...';
            statusElement.className = 'status-message loading';

            // Try date range query first, then fall back to league-only if needed
            let response;
            let successfulFormat = null;
            
            for (const dateFormat of dateFormats) {
                try {
                    console.log(`📅 Trying date format: ${dateFormat}`);
                    
                    // First attempt: Date range query with current format
                    response = await fetch(`https://football-web-pages1.p.rapidapi.com/fixtures-results.json?from=${dateFormat}&to=${dateFormat}&comp=${league}&season=${season}`, {
                        method: 'GET',
                        headers: {
                            'X-RapidAPI-Key': this.config.RAPIDAPI_KEY,
                            'X-RapidAPI-Host': this.config.RAPIDAPI_HOST
                        }
                    });
                    
                    if (response.ok) {
                        successfulFormat = dateFormat;
                        console.log(`✅ Date range query successful with format: ${dateFormat}`);
                        break;
                    } else {
                        console.log(`❌ Date range query failed with format ${dateFormat}: ${response.status} ${response.statusText}`);
                    }
                } catch (fetchError) {
                    console.log(`❌ Date range query error with format ${dateFormat}:`, fetchError);
                }
            }
            
            // If no date format worked, fall back to league-only query
            if (!successfulFormat) {
                console.log('All date range queries failed, trying league-only query...');
                response = await fetch(`https://football-web-pages1.p.rapidapi.com/fixtures-results.json?comp=${league}&round=0&team=0`, {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': this.config.RAPIDAPI_KEY,
                        'X-RapidAPI-Host': this.config.RAPIDAPI_HOST
                    }
                });
            }

            console.log(`📅 API Response Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`📅 API Response Data:`, data);
                
                // Handle the actual API response structure: {fixtures-results: {...}}
                let fixtures = [];
                if (data['fixtures-results']) {
                    const fixturesData = data['fixtures-results'];
                    console.log(`📅 Fixtures data structure:`, fixturesData);
                    
                    // Check if fixtures is an array or needs to be extracted
                    if (Array.isArray(fixturesData)) {
                        fixtures = fixturesData;
                    } else if (fixturesData.fixtures && Array.isArray(fixturesData.fixtures)) {
                        fixtures = fixturesData.fixtures;
                    } else if (fixturesData.matches && Array.isArray(fixturesData.matches)) {
                        fixtures = fixturesData.matches;
                    } else {
                        // Try to find any array in the response
                        const keys = Object.keys(fixturesData);
                        console.log(`📅 Available keys in fixtures-results:`, keys);
                        
                        for (const key of keys) {
                            if (Array.isArray(fixturesData[key])) {
                                fixtures = fixturesData[key];
                                console.log(`📅 Found fixtures array in key: ${key}`);
                                break;
                            }
                        }
                    }
                }
                
                console.log(`📅 Extracted fixtures:`, fixtures);
                
                if (fixtures && fixtures.length > 0) {
                    // Filter fixtures to only show those matching the selected date range
                    const filteredFixtures = fixtures.filter(fixture => {
                        const fixtureDate = fixture.date;
                        if (!fixtureDate) return false;
                        
                        // Check if fixture date falls within the selected range
                        const fixtureDateObj = new Date(fixtureDate);
                        const startDateObj = new Date(startDate);
                        const endDateObj = new Date(endDate);
                        
                        // Set time to start of day for accurate comparison
                        startDateObj.setHours(0, 0, 0, 0);
                        endDateObj.setHours(23, 59, 59, 999);
                        fixtureDateObj.setHours(0, 0, 0, 0);
                        
                        return fixtureDateObj >= startDateObj && fixtureDateObj <= endDateObj;
                    });
                    
                    console.log(`📅 Filtered fixtures for date range ${startDate} to ${endDate}:`, filteredFixtures.length);
                    
                    if (filteredFixtures.length === 0) {
                        statusElement.innerHTML = `<h4>No Fixtures Found</h4><p>No fixtures found for the date range ${startDate} to ${endDate}.</p>`;
                        statusElement.className = 'status-message info';
                        return;
                    }
                    
                    // Display fixtures in a more organized way
                    let fixturesHtml = `<h4>Fixtures Found for ${startDate} to ${endDate}:</h4><div class="fixtures-list">`;
                    
                    // Log the first few filtered fixtures to see their structure
                    console.log('📅 First 3 filtered fixtures structure:', filteredFixtures.slice(0, 3));
                    
                    filteredFixtures.forEach((fixture, index) => {
                        if (index < 20) { // Limit to first 20 fixtures
                            // Use the correct property names from the API response
                            const homeTeam = fixture['home-team']?.name || fixture.homeTeam || fixture.home || fixture.homeTeamName || fixture.home_team || fixture.home_team_name || fixture.team1 || fixture.team1Name || 'TBD';
                            const awayTeam = fixture['away-team']?.name || fixture.awayTeam || fixture.away || fixture.awayTeamName || fixture.away_team || fixture.away_team_name || fixture.team2 || fixture.team2Name || 'TBD';
                            
                            // Use the correct property names from the API response
                            const matchDate = fixture.date || fixture.matchDate || fixture.fixtureDate || fixture.match_date || fixture.fixture_date || fixture.dateTime || fixture.date_time || 'TBD';
                            
                            // Use the correct property names from the API response
                            const competition = fixture.competition?.name || fixture.competition || fixture.comp || fixture.league || fixture.competitionName || fixture.leagueName || 'TBD';
                            
                            // Extract additional fixture information
                            const time = fixture.time || 'TBD';
                            const referee = fixture.referee || 'TBD';
                            const attendance = fixture.attendance || 'TBD';
                            const venue = fixture.venue || 'TBD';
                            const matchId = fixture.id || 'TBD';
                            
                            // Enhanced score extraction with more fallback options
                            let homeScore = fixture['home-team']?.score || 
                                          fixture['home-team']?.goals || 
                                          fixture.homeScore || 
                                          fixture.homeGoals || 
                                          fixture.home_score || 
                                          fixture.home_goals || 
                                          fixture.score1 || 
                                          fixture.goals1 || 
                                          fixture.ht_score?.split('-')[0] || // Half-time score
                                          fixture.ft_score?.split('-')[0] || // Full-time score
                                          fixture.score?.split('-')[0] || // General score
                                          'TBD';
                            
                            let awayScore = fixture['away-team']?.score || 
                                          fixture['away-team']?.goals || 
                                          fixture.awayScore || 
                                          fixture.awayGoals || 
                                          fixture.away_score || 
                                          fixture.away_goals || 
                                          fixture.score2 || 
                                          fixture.goals2 || 
                                          fixture.ht_score?.split('-')[1] || // Half-time score
                                          fixture.ft_score?.split('-')[1] || // Full-time score
                                          fixture.score?.split('-')[1] || // General score
                                          'TBD';
                            
                            const status = fixture.status?.full || fixture.status?.short || 'TBD';
                            
                            fixturesHtml += `
                                <div class="fixture-item">
                                    <input type="checkbox" id="fixture-${index}" class="fixture-checkbox" data-fixture='${JSON.stringify(fixture)}'>
                                    <label for="fixture-${index}">
                                        <strong>${homeTeam} vs ${awayTeam}</strong><br>
                                        <small>Date: ${matchDate} | Time: ${time} | Competition: ${competition}</small><br>
                                        <small>Venue: ${venue} | Match ID: ${matchId}</small><br>
                                        <small>Referee: ${referee} | Attendance: ${attendance}</small><br>
                                        <small>Score: ${homeScore} - ${awayScore} | Status: ${status}</small>
                                    </label>
                                </div>
                            `;
                        }
                    });
                    if (filteredFixtures.length > 20) {
                        fixturesHtml += `<p><em>... and ${filteredFixtures.length - 20} more fixtures</em></p>`;
                    }
                    fixturesHtml += '</div>';
                    
                    statusElement.innerHTML = fixturesHtml;
                    statusElement.className = 'status-message success';
                    console.log(`✅ Date range fixtures fetched successfully: ${filteredFixtures.length} fixtures for ${startDate} to ${endDate}`);
                    
                    // Show the import controls
                    const importControls = document.querySelector('#import-controls');
                    if (importControls) {
                        importControls.style.display = 'block';
                        console.log('✅ Import controls displayed');
                    }
                } else {
                    statusElement.textContent = 'No fixtures found for the selected date range';
                    statusElement.className = 'status-message info';
                    console.log('No fixtures found in API response');
                }
            } else {
                const errorText = await response.text();
                console.error(`📅 API Error Response: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Date range fetch failed:', error);
            statusElement.textContent = `❌ Failed to fetch fixtures: ${error.message}`;
            statusElement.className = 'status-message error';
        }
    }

    // Fetch all fixtures
    async fetchAllFixtures() {
        const fixturesContainer = document.querySelector('#fixtures-container');
        const statusElement = document.querySelector('#fetch-status');
        
        if (!fixturesContainer || !statusElement) {
            console.error('Required elements not found for all fixtures fetch');
            return;
        }
        
        statusElement.textContent = 'Fetching all fixtures...';
        statusElement.className = 'status-message info';
        
        try {
            const response = await fetch('/.netlify/functions/fetch-scores?comp=5&team=0');
            
            if (response.ok) {
                const data = await response.json();
                this.displayFixtures(data.fixtures || [], fixturesContainer);
                statusElement.textContent = `Found ${data.fixtures ? data.fixtures.length : 0} fixtures`;
                statusElement.className = 'status-message success';
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching all fixtures:', error);
            statusElement.textContent = 'Error fetching fixtures';
            statusElement.className = 'status-message error';
        }
    }

    // Display fixtures in the container
    displayFixtures(fixtures, container) {
        if (!Array.isArray(fixtures) || fixtures.length === 0) {
            container.innerHTML = '<p>No fixtures found</p>';
            return;
        }
        
        container.innerHTML = '';
        
        fixtures.forEach((fixture, index) => {
            const fixtureElement = document.createElement('div');
            fixtureElement.className = 'fixture-item';
            fixtureElement.innerHTML = `
                <input type="checkbox" id="fixture-${index}" value="${index}" class="fixture-checkbox">
                <label for="fixture-${index}">
                    ${fixture.homeTeam} vs ${fixture.awayTeam} - ${fixture.date}
                </label>
            `;
            container.appendChild(fixtureElement);
        });
    }

    // Select all fixtures
    selectAllFixtures() {
        console.log('✅ Selecting all fixtures...');
        const checkboxes = document.querySelectorAll('.fixture-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = true);
        console.log(`✅ Selected ${checkboxes.length} fixtures`);
    }
    
    // Deselect all fixtures
    deselectAllFixtures() {
        console.log('❌ Deselecting all fixtures...');
        const checkboxes = document.querySelectorAll('.fixture-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = false);
        console.log(`❌ Deselected ${checkboxes.length} fixtures`);
    }

    // Import selected fixtures to a game week
    async importSelectedFixtures() {
        console.log('📥 Importing selected fixtures...');
        
        const selectedFixtures = [];
        const checkboxes = document.querySelectorAll('.fixture-checkbox:checked');
        
        if (checkboxes.length === 0) {
            alert('Please select at least one fixture to import.');
            return;
        }
        
        const gameWeek = document.querySelector('#import-gameweek-select').value;
        if (!gameWeek) {
            alert('Please select a game week to import to.');
            return;
        }
        
        checkboxes.forEach(checkbox => {
            try {
                const fixtureData = JSON.parse(checkbox.dataset.fixture);
                selectedFixtures.push(fixtureData);
            } catch (error) {
                console.error('Error parsing fixture data:', error);
            }
        });
        
        console.log(`📥 Importing ${selectedFixtures.length} fixtures to Game Week ${gameWeek}:`, selectedFixtures);
        
        try {
            // Convert API fixture format to database format
            const fixturesToSave = selectedFixtures.map(fixture => ({
                homeTeam: fixture['home-team']?.name || fixture.homeTeam || 'TBD',
                awayTeam: fixture['away-team']?.name || fixture.awayTeam || 'TBD',
                date: fixture.date || fixture.match?.date || 'TBD',
                kickOffTime: fixture.time || 'TBD', // Extract time from API response
                venue: fixture.venue || 'TBD',
                status: 'NS', // Not Started
                matchId: fixture.id || fixture.match?.id || null,
                competition: fixture.competition?.name || 'National League'
            }));
            
            // Use the same format as the fixtures manager
            const gameweekKey = gameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${gameWeek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            // Save to Firestore
            if (this.db) {
                await this.db.collection('fixtures').doc(editionGameweekKey).set({
                    fixtures: fixturesToSave,
                    gameweek: gameWeek,
                    edition: this.currentActiveEdition,
                    lastUpdated: new Date(),
                    importedFrom: 'API'
                });
            } else {
                console.error('Database not available for saving fixtures');
                throw new Error('Database not available');
            }
            
            console.log(`📥 Successfully saved ${fixturesToSave.length} fixtures to Game Week ${gameWeek}`);
            alert(`Successfully imported ${fixturesToSave.length} fixtures to Game Week ${gameWeek}!`);
            
            // Refresh the fixture display to show the imported fixtures
            // Note: This will need to be handled by the calling code
            console.log('Fixtures imported successfully. Please refresh the fixture display manually.');
            
            // Uncheck all checkboxes after import
            checkboxes.forEach(checkbox => checkbox.checked = false);
            
            // Update status message if available
            const statusElement = document.querySelector('#import-status');
            if (statusElement) {
                statusElement.textContent = `Successfully imported ${fixturesToSave.length} fixtures to Game Week ${gameWeek}`;
                statusElement.className = 'status-message success';
            }
            
        } catch (error) {
            console.error('Error importing fixtures:', error);
            alert('Error importing fixtures: ' + error.message);
            
            // Update status message if available
            const statusElement = document.querySelector('#import-status');
            if (statusElement) {
                statusElement.textContent = 'Error importing fixtures: ' + error.message;
                statusElement.className = 'status-message error';
            }
        }
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 Football Web Pages API cleanup completed');
    }
}
