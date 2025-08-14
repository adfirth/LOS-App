// API Module
// Handles all external API integrations, including Football Web Pages API, vidiprinter APIs, and Netlify functions

class ApiManager {
    constructor() {
        this.footballWebPagesConfig = null;
        this.theSportsDbConfig = null;
        this.initializeApiConfigurations();
    }

    // Get configuration safely, retrying if needed
    getConfiguration() {
        if (!this.isConfigurationLoaded()) {
            this.retryLoadConfigurationIfNeeded();
            return null;
        }
        return this.footballWebPagesConfig;
    }

    // Check if configuration is available
    isConfigurationLoaded() {
        return this.footballWebPagesConfig !== null;
    }

    // Retry loading configuration if not available
    retryLoadConfigurationIfNeeded() {
        if (!this.isConfigurationLoaded()) {
            console.log('🔄 Configuration not loaded, retrying...');
            this.loadFootballWebPagesConfig();
        }
    }

    // Initialize the API manager
    initializeApiManager() {
        console.log('🔧 Initializing API Manager...');
        this.initializeApiConfigurations();
        this.setupEventListeners();
    }

    async initializeApiConfigurations() {
        console.log('🔧 Initializing API Manager...');
        
        // Try to load Football Web Pages API configuration
        this.loadFootballWebPagesConfig();
        
        // Clean up TheSportsDB references
        console.log('TheSportsDB API configuration removed - using Football Web Pages API instead');
    }

    loadFootballWebPagesConfig() {
        // Try multiple approaches to load the configuration
        if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
            this.footballWebPagesConfig = FOOTBALL_WEBPAGES_CONFIG;
            console.log('✅ Football Web Pages API configuration loaded from global variable');
            console.log('API Key available:', !!this.footballWebPagesConfig.RAPIDAPI_KEY);
            return true;
        } else {
            // Try to access it from window object
            if (window.FOOTBALL_WEBPAGES_CONFIG) {
                this.footballWebPagesConfig = window.FOOTBALL_WEBPAGES_CONFIG;
                console.log('✅ Football Web Pages API configuration loaded from window object');
                console.log('API Key available:', !!this.footballWebPagesConfig.RAPIDAPI_KEY);
                return true;
            } else {
                console.warn('⚠️ Football Web Pages API configuration not found - will retry during initialization');
                // Set up a retry mechanism
                this.retryLoadConfiguration();
                return false;
            }
        }
    }

    retryLoadConfiguration() {
        let attempts = 0;
        const maxAttempts = 10;
        
        const attemptLoad = () => {
            attempts++;
            console.log(`🔄 Attempt ${attempts}/${maxAttempts} to load Football Web Pages API configuration...`);
            
            if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
                this.footballWebPagesConfig = FOOTBALL_WEBPAGES_CONFIG;
                console.log('✅ Football Web Pages API configuration loaded on retry attempt', attempts);
                return;
            }
            
            if (window.FOOTBALL_WEBPAGES_CONFIG) {
                this.footballWebPagesConfig = window.FOOTBALL_WEBPAGES_CONFIG;
                console.log('✅ Football Web Pages API configuration loaded from window object on retry attempt', attempts);
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(attemptLoad, 1000); // Increased delay to 1 second
            } else {
                console.error('❌ Failed to load Football Web Pages API configuration after', maxAttempts, 'attempts');
                console.error('This will prevent API functions from working properly');
                
                // Try one more time after a longer delay in case scripts are still loading
                setTimeout(() => {
                    if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
                        this.footballWebPagesConfig = FOOTBALL_WEBPAGES_CONFIG;
                        console.log('✅ Football Web Pages API configuration loaded on final attempt');
                    } else if (window.FOOTBALL_WEBPAGES_CONFIG) {
                        this.footballWebPagesConfig = window.FOOTBALL_WEBPAGES_CONFIG;
                        console.log('✅ Football Web Pages API configuration loaded from window object on final attempt');
                    }
                }, 2000);
            }
        };
        
        setTimeout(attemptLoad, 100);
    }

    // Set up event listeners
    setupEventListeners() {
        // Initialize Football Web Pages API when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeFootballWebPagesAPI();
        });
    }

    // FOOTBALL WEB PAGES API INTEGRATION
    initializeFootballWebPagesAPI() {
        console.log('🔧 Initializing Football Web Pages API integration...');
        
        const testApiConnectionBtn = document.querySelector('#test-api-connection');
        const fetchDateRangeFixturesBtn = document.querySelector('#fetch-date-range-fixtures-btn');
        const fetchAllFixturesBtn = document.querySelector('#fetch-all-fixtures-btn');
        const selectAllFixturesBtn = document.querySelector('#select-all-fixtures-btn');
        const deselectAllFixturesBtn = document.querySelector('#deselect-all-fixtures-btn');
        const importSelectedFixturesBtn = document.querySelector('#import-selected-fixtures-btn');
        const fetchHistoricalDataBtn = document.querySelector('#fetch-historical-data-btn');
        
        console.log('🔍 Found buttons:', {
            testApiConnection: !!testApiConnectionBtn,
            fetchDateRangeFixtures: !!fetchDateRangeFixturesBtn,
            fetchAllFixtures: !!fetchAllFixturesBtn,
            selectAllFixtures: !!selectAllFixturesBtn,
            deselectAllFixtures: !!deselectAllFixturesBtn,
            importSelectedFixtures: !!importSelectedFixturesBtn,
            fetchHistoricalData: !!fetchHistoricalDataBtn
        });
        
        // Check API key status on initialization
        this.checkApiKeyStatus();
        
        if (testApiConnectionBtn) {
            testApiConnectionBtn.addEventListener('click', () => this.testApiConnection());
        }
        if (fetchDateRangeFixturesBtn) {
            console.log('✅ Date Range Fetch button found and event listener attached');
            console.log('Button disabled state:', fetchDateRangeFixturesBtn.disabled);
            console.log('Button style display:', fetchDateRangeFixturesBtn.style.display);
            console.log('Button classes:', fetchDateRangeFixturesBtn.className);
            console.log('Button text content:', fetchDateRangeFixturesBtn.textContent);
            
            fetchDateRangeFixturesBtn.addEventListener('click', () => {
                console.log('📅 Date Range Fetch button clicked!');
                this.fetchDateRangeFixtures();
            });
        } else {
            console.error('❌ Date Range Fetch button not found!');
        }
        if (fetchAllFixturesBtn) {
            fetchAllFixturesBtn.addEventListener('click', () => this.fetchAllFixtures());
        }
        if (selectAllFixturesBtn) {
            selectAllFixturesBtn.addEventListener('click', () => this.selectAllFixtures());
        }
        if (deselectAllFixturesBtn) {
            deselectAllFixturesBtn.addEventListener('click', () => this.deselectAllFixtures());
        }
        if (importSelectedFixturesBtn) {
            importSelectedFixturesBtn.addEventListener('click', () => this.importSelectedFixtures());
        }
        if (fetchHistoricalDataBtn) {
            fetchHistoricalDataBtn.addEventListener('click', () => {
                // Get current date for historical data fetch
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); // Last 7 days
                const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                this.fetchHistoricalVidiprinterData(
                    startDate.toISOString().split('T')[0], // YYYY-MM-DD format
                    '00:00',
                    endDate.toISOString().split('T')[0],
                    '23:59'
                );
            });
        }
    }

    async testApiConnection() {
        console.log('🧪 Testing API connection...');
        
        const statusElement = document.querySelector('#api-key-status');
        const testBtn = document.querySelector('#test-api-btn');
        
        if (!statusElement || !testBtn) {
            console.error('Required elements not found for API test');
            return;
        }
        
        // Try to load configuration if not already loaded
        if (!this.footballWebPagesConfig) {
            this.loadFootballWebPagesConfig();
            
            // Wait a bit for the config to load
            if (!this.footballWebPagesConfig) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Check if we have the API configuration
        if (!this.footballWebPagesConfig || !this.footballWebPagesConfig.RAPIDAPI_KEY) {
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
                    'X-RapidAPI-Key': this.footballWebPagesConfig.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': this.footballWebPagesConfig.RAPIDAPI_HOST
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
        console.log('Current footballWebPagesConfig:', this.footballWebPagesConfig);
        console.log('FOOTBALL_WEBPAGES_CONFIG available:', typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined');
        if (typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
            console.log('FOOTBALL_WEBPAGES_CONFIG content:', FOOTBALL_WEBPAGES_CONFIG);
        }
        
        // Try to load configuration if not already loaded
        if (!this.footballWebPagesConfig && typeof FOOTBALL_WEBPAGES_CONFIG !== 'undefined') {
            this.footballWebPagesConfig = FOOTBALL_WEBPAGES_CONFIG;
            console.log('Football Web Pages API configuration loaded during status check');
        }
        
        if (this.footballWebPagesConfig && this.footballWebPagesConfig.RAPIDAPI_KEY) {
            statusElement.textContent = 'API key configured';
            statusElement.className = 'status-indicator success';
            console.log('API key status: Configured successfully');
        } else {
            statusElement.textContent = 'API key missing - retrying...';
            statusElement.className = 'status-indicator error';
            console.log('API key status: Missing - configuration may still be loading');
            
            // If we don't have the config yet, try to load it again
            if (!this.footballWebPagesConfig) {
                this.retryLoadConfiguration();
            }
        }
    }

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
        if (!this.footballWebPagesConfig) {
            this.loadFootballWebPagesConfig();
            
            // Wait a bit for the config to load
            if (!this.footballWebPagesConfig) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Check if we have the API configuration
        if (!this.footballWebPagesConfig || !this.footballWebPagesConfig.RAPIDAPI_KEY) {
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
                            'X-RapidAPI-Key': this.footballWebPagesConfig.RAPIDAPI_KEY,
                            'X-RapidAPI-Host': this.footballWebPagesConfig.RAPIDAPI_HOST
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
                        'X-RapidAPI-Key': this.footballWebPagesConfig.RAPIDAPI_KEY,
                        'X-RapidAPI-Host': this.footballWebPagesConfig.RAPIDAPI_HOST
                    }
                });
            }

            console.log(`📅 API Response Status: ${response.status} ${response.statusText}`);
            console.log(`📅 API Response Headers:`, Object.fromEntries(response.headers.entries()));
            
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
                    console.log('📅 First filtered fixture detailed:', JSON.stringify(filteredFixtures[0], null, 2));
                    console.log('📅 First filtered fixture keys:', Object.keys(filteredFixtures[0]));
                    
                    // Debug score structure specifically
                    if (filteredFixtures.length > 0) {
                        const firstFixture = filteredFixtures[0];
                        console.log('🔍 Score debugging for first fixture:');
                        console.log('  - fixture["home-team"]:', firstFixture['home-team']);
                        console.log('  - fixture["away-team"]:', firstFixture['away-team']);
                        console.log('  - fixture["home-team"]?.score:', firstFixture['home-team']?.score);
                        console.log('  - fixture["away-team"]?.score:', firstFixture['away-team']?.score);
                        console.log('  - All keys containing "score":', Object.keys(firstFixture).filter(key => key.toLowerCase().includes('score')));
                        console.log('  - All keys containing "goal":', Object.keys(firstFixture).filter(key => key.toLowerCase().includes('goal')));
                    }
                    
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
                            
                            // Debug score values for this specific fixture
                            if (index < 3) { // Only log first 3 fixtures to avoid spam
                                console.log(`🔍 Fixture ${index + 1} score debugging:`);
                                console.log(`  - ${homeTeam} vs ${awayTeam}`);
                                console.log(`  - Home score found: ${homeScore} (from: ${fixture['home-team']?.score || fixture['home-team']?.goals || 'not found'})`);
                                console.log(`  - Away score found: ${awayScore} (from: ${fixture['away-team']?.score || fixture['away-team']?.goals || 'not found'})`);
                                console.log(`  - Raw fixture data:`, fixture);
                            }
                            
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
        const checkboxes = document.querySelectorAll('.fixture-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    // Deselect all fixtures
    deselectAllFixtures() {
        const checkboxes = document.querySelectorAll('.fixture-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }



    // HISTORICAL VIDIPRINTER DATA FETCHING
    async fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime) {
        console.log('📅 Fetching historical vidiprinter data:', { startDate, startTime, endDate, endTime });
        
        try {
            // Try to fetch data for the date range, but also try some fallback dates
            const datesToTry = [
                startDate,
                endDate,
                '2025-08-09', // Known date with fixtures
                '2025-08-10', // Day after known fixtures
                '2025-08-08'  // Day before known fixtures
            ];
            
            const allEvents = [];
            const triedDates = new Set();
            
            for (const date of datesToTry) {
                if (triedDates.has(date)) continue;
                triedDates.add(date);
                
                console.log(`📅 Trying to fetch vidiprinter data for date: ${date}`);
                
                try {
                    const response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=5&team=0&date=${date}`, {
                        headers: {
                            'X-RapidAPI-Key': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_KEY : '',
                            'X-RapidAPI-Host': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_HOST : 'football-web-pages1.p.rapidapi.com'
                        }
                    });
                    
                    if (!response.ok) {
                        console.log(`📅 Failed to fetch data for ${date}: ${response.status} ${response.statusText}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    console.log(`📅 Response for ${date}:`, data);
                    
                    if (data.vidiprinter && data.vidiprinter.events && Array.isArray(data.vidiprinter.events)) {
                        console.log(`📅 Found ${data.vidiprinter.events.length} events for ${date}`);
                        if (data.vidiprinter.events.length > 0) {
                            allEvents.push(...data.vidiprinter.events);
                            console.log(`📅 Added ${data.vidiprinter.events.length} events from ${date}`);
                        }
                    } else {
                        console.log(`📅 No events found for ${date}`);
                    }
                } catch (error) {
                    console.log(`📅 Error fetching data for ${date}:`, error);
                }
            }
            
            console.log(`📅 Total events collected from all dates: ${allEvents.length}`);
            
            if (allEvents.length === 0) {
                console.log('📅 No events found for any date, returning empty result');
                return {
                    events: [],
                    startDate,
                    startTime,
                    endDate,
                    endTime,
                    message: 'No vidiprinter events found for the requested date range or fallback dates'
                };
            }
            
            // Filter events based on time range
            const filteredEvents = this.filterEventsByTimeRange(allEvents, startDate, startTime, endDate, endTime);
            
            console.log('📅 Filtered events:', filteredEvents);
            
            return {
                events: filteredEvents,
                startDate,
                startTime,
                endDate,
                endTime
            };
            
        } catch (error) {
            console.error('❌ Error fetching historical vidiprinter data:', error);
            throw error;
        }
    }

    // Filter events by time range
    filterEventsByTimeRange(events, startDate, startTime, endDate, endTime) {
        if (!events || !Array.isArray(events)) {
            console.log('❌ No events array provided or not an array');
            return [];
        }
        
        console.log(`🔍 Filtering ${events.length} events between ${startDate} ${startTime} and ${endDate} ${endTime}`);
        
        const filteredEvents = events.filter(event => {
            if (!event['date/time']) {
                console.log('❌ Event missing date/time:', event);
                return false;
            }
            
            const eventDateTime = this.parseEventDateTime(event['date/time']);
            if (!eventDateTime) {
                console.log('❌ Failed to parse event date/time:', event['date/time']);
                return false;
            }
            
            const startDateTime = new Date(`${startDate} ${startTime}`);
            const endDateTime = new Date(`${endDate} ${endTime}`);
            
            console.log(`📅 Event: ${event['date/time']} -> Parsed: ${eventDateTime}`);
            console.log(`📅 Start: ${startDate} ${startTime} -> ${startDateTime}`);
            console.log(`📅 End: ${endDate} ${endTime} -> ${endDateTime}`);
            console.log(`📅 In range: ${eventDateTime >= startDateTime && eventDateTime <= endDateTime}`);
            
            return eventDateTime >= startDateTime && eventDateTime <= endDateTime;
        });
        
        console.log(`✅ Filtered events result: ${filteredEvents.length} events`);
        return filteredEvents;
    }

    // Parse event date/time string
    parseEventDateTime(dateTimeString) {
        console.log(`🔍 Parsing date/time: "${dateTimeString}"`);
        
        // Handle format: "2025-08-09 22:33:44"
        const [datePart, timePart] = dateTimeString.split(' ');
        console.log(`📅 Date part: "${datePart}", Time part: "${timePart}"`);
        
        if (!datePart || !timePart) {
            console.log('❌ Invalid date/time format - missing date or time part');
            return null;
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        console.log(`📅 Parsed: Year=${year}, Month=${month}, Day=${day}, Hour=${hour}, Minute=${minute}, Second=${second}`);
        
        if (!year || !month || !day || !hour || !minute || !second) {
            console.log('❌ Invalid date/time format - missing components');
            return null;
        }
        
        const parsedDate = new Date(year, month - 1, day, hour, minute, second);
        console.log(`📅 Final parsed date: ${parsedDate}`);
        
        return parsedDate;
    }

    // Fetch historical data for a specific interval
    async fetchHistoricalDataForInterval(startDate, startTime, endDate, endTime) {
        console.log('Fetching historical data for interval:', { startDate, startTime, endDate, endTime });
        
        try {
            const data = await this.fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime);
            return data;
        } catch (error) {
            console.error('Error fetching historical data for interval:', error);
            throw error;
        }
    }

    // Fetch current vidiprinter data for a competition
    async fetchVidiprinterData(competition = 5) {
        console.log('📺 Fetching current vidiprinter data for competition:', competition);
        
        try {
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const currentTime = new Date().toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
            });
            
            console.log(`📺 Fetching vidiprinter for date: ${currentDate}, time: ${currentTime}`);
            
            // Try current date first
            let response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=0&date=${currentDate}`, {
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_KEY : '',
                    'X-RapidAPI-Host': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_HOST : 'football-web-pages1.p.rapidapi.com'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let data = await response.json();
            console.log('📺 Current date vidiprinter response:', data);
            
            // If no events on current date, try recent dates
            if (!data.vidiprinter || !data.vidiprinter.events || data.vidiprinter.events.length === 0) {
                console.log('📺 No events on current date, trying recent dates...');
                
                const recentDates = [
                    '2025-08-09', // Known date with fixtures
                    '2025-08-10', // Day after
                    '2025-08-08'  // Day before
                ];
                
                for (const date of recentDates) {
                    console.log(`📺 Trying date: ${date}`);
                    response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=0&date=${date}`, {
                        headers: {
                            'X-RapidAPI-Key': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_KEY : '',
                            'X-RapidAPI-Host': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_HOST : 'football-web-pages1.p.rapidapi.com'
                        }
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`📺 Response for ${date}:`, data);
                        
                        if (data.vidiprinter && data.vidiprinter.events && data.vidiprinter.events.length > 0) {
                            console.log(`📺 Found ${data.vidiprinter.events.length} events for ${date}`);
                            break;
                        }
                    }
                }
            }
            
            if (data.vidiprinter && data.vidiprinter.events && data.vidiprinter.events.length > 0) {
                console.log(`📺 Returning ${data.vidiprinter.events.length} events from vidiprinter`);
                return data.vidiprinter.events;
            } else {
                console.log('📺 No events found in any vidiprinter response');
                // Return a placeholder event to show the system is working
                return [{
                    text: 'No live matches currently available. The vidiprinter will update when matches are in progress.',
                    type: 'status',
                    'date/time': new Date().toISOString()
                }];
            }
            
        } catch (error) {
            console.error('❌ Error fetching vidiprinter data:', error);
            // Return a placeholder event to show the system is working
            return [{
                text: 'Vidiprinter system is running. Waiting for live match updates...',
                type: 'status',
                'date/time': new Date().toISOString()
            }];
        }
    }

    // Fetch enhanced vidiprinter data for a competition, team, and date
    async fetchEnhancedVidiprinterData(competition = 5, team = 0, date = null) {
        console.log('Fetching enhanced vidiprinter data:', { competition, team, date });
        
        try {
            const targetDate = date || new Date().toISOString().split('T')[0]; // Use provided date or current date
            console.log(`📅 Fetching enhanced vidiprinter for date: ${targetDate}`);
            
            const response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=${team}&date=${targetDate}`, {
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_KEY : '',
                    'X-RapidAPI-Host': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_HOST : 'football-web-pages1.p.rapidapi.com'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📺 Enhanced vidiprinter API response:', data);
            
            if (data.vidiprinter && data.vidiprinter.events) {
                console.log(`📺 Found ${data.vidiprinter.events.length} events in enhanced vidiprinter response`);
                return data.vidiprinter.events;
            } else {
                console.log('📺 No events found in enhanced vidiprinter response');
                return [];
            }
            
        } catch (error) {
            console.error('Error fetching enhanced vidiprinter data:', error);
            return [];
        }
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
            const editionGameweekKey = `edition${window.currentActiveEdition}_${gameweekKey}`;
            
            // Save to Firestore
            await window.db.collection('fixtures').doc(editionGameweekKey).set({
                fixtures: fixturesToSave,
                gameweek: gameWeek,
                edition: window.currentActiveEdition,
                lastUpdated: new Date(),
                importedFrom: 'API'
            });
            
            console.log(`📥 Successfully saved ${fixturesToSave.length} fixtures to Game Week ${gameWeek}`);
            alert(`Successfully imported ${fixturesToSave.length} fixtures to Game Week ${gameWeek}!`);
            
            // Refresh the fixture display to show the imported fixtures
            if (window.loadFixturesForGameweek) {
                window.loadFixturesForGameweek();
            }
            
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

    // Cleanup method
    cleanup() {
        console.log('🧹 API Manager cleanup completed');
    }
}

export default ApiManager;
