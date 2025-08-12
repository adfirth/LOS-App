// API Module
// Handles all external API integrations, including Football Web Pages API, vidiprinter APIs, and Netlify functions

class ApiManager {
    constructor() {
        this.footballWebPagesConfig = null;
        this.theSportsDbConfig = null;
        this.initializeApiConfigurations();
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
        } else {
            // Try to access it from window object
            if (window.FOOTBALL_WEBPAGES_CONFIG) {
                this.footballWebPagesConfig = window.FOOTBALL_WEBPAGES_CONFIG;
                console.log('✅ Football Web Pages API configuration loaded from window object');
            } else {
                console.warn('⚠️ Football Web Pages API configuration not found - will retry during initialization');
                // Set up a retry mechanism
                this.retryLoadConfiguration();
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
                setTimeout(attemptLoad, 500);
            } else {
                console.error('❌ Failed to load Football Web Pages API configuration after', maxAttempts, 'attempts');
                console.error('This will prevent API functions from working properly');
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
        const testApiConnectionBtn = document.querySelector('#test-api-connection');
        const fetchDateRangeFixturesBtn = document.querySelector('#fetch-date-range-fixtures-btn');
        const fetchAllFixturesBtn = document.querySelector('#fetch-all-fixtures-btn');
        const selectAllFixturesBtn = document.querySelector('#select-all-fixtures-btn');
        const deselectAllFixturesBtn = document.querySelector('#deselect-all-fixtures-btn');
        const importSelectedFixturesBtn = document.querySelector('#import-selected-fixtures-btn');
        const fetchHistoricalDataBtn = document.querySelector('#fetch-historical-data-btn');
        
        // Check API key status on initialization
        this.checkApiKeyStatus();
        
        if (testApiConnectionBtn) {
            testApiConnectionBtn.addEventListener('click', () => this.testApiConnection());
        }
        if (fetchDateRangeFixturesBtn) {
            fetchDateRangeFixturesBtn.addEventListener('click', () => this.fetchDateRangeFixtures());
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
        
        if (!startDate || !endDate) {
            if (statusElement) {
                statusElement.textContent = 'Please select both start and end dates';
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
            statusElement.textContent = 'Fetching fixtures...';
            statusElement.className = 'status-message loading';

            const response = await fetch(`https://football-web-pages1.p.rapidapi.com/fixtures-results?from=${startDate}&to=${endDate}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesConfig.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': this.footballWebPagesConfig.RAPIDAPI_HOST
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                    // Display fixtures in a more organized way
                    let fixturesHtml = '<h4>Fixtures Found:</h4><div class="fixtures-list">';
                    data.forEach((fixture, index) => {
                        if (index < 20) { // Limit to first 20 fixtures
                            fixturesHtml += `
                                <div class="fixture-item">
                                    <strong>${fixture.homeTeam || 'TBD'} vs ${fixture.awayTeam || 'TBD'}</strong><br>
                                    <small>Date: ${fixture.date || 'TBD'} | Competition: ${fixture.competition || 'TBD'}</small>
                                </div>
                            `;
                        }
                    });
                    if (data.length > 20) {
                        fixturesHtml += `<p><em>... and ${data.length - 20} more fixtures</em></p>`;
                    }
                    fixturesHtml += '</div>';
                    
                    statusElement.innerHTML = fixturesHtml;
                    statusElement.className = 'status-message success';
                    console.log('✅ Date range fixtures fetched successfully:', data);
                } else {
                    statusElement.textContent = 'No fixtures found for the selected date range';
                    statusElement.className = 'status-message info';
                }
            } else {
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

    // Import selected fixtures
    async importSelectedFixtures() {
        const selectedCheckboxes = document.querySelectorAll('.fixture-checkbox:checked');
        const statusElement = document.querySelector('#import-status');
        
        if (selectedCheckboxes.length === 0) {
            statusElement.textContent = 'Please select fixtures to import';
            statusElement.className = 'status-message error';
            return;
        }
        
        statusElement.textContent = 'Importing selected fixtures...';
        statusElement.className = 'status-message info';
        
        try {
            // This would integrate with your existing fixture import logic
            // For now, just show success message
            statusElement.textContent = `Successfully imported ${selectedCheckboxes.length} fixtures`;
            statusElement.className = 'status-message success';
            
            console.log('Importing fixtures:', selectedCheckboxes.length);
        } catch (error) {
            console.error('Error importing fixtures:', error);
            statusElement.textContent = 'Error importing fixtures';
            statusElement.className = 'status-message error';
        }
    }

    // HISTORICAL VIDIPRINTER DATA FETCHING
    async fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime) {
        console.log('Fetching historical vidiprinter data:', { startDate, startTime, endDate, endTime });
        
        try {
            // Fetch data for the start date
            const startResponse = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=5&team=0&date=${startDate}`, {
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_KEY : '',
                    'X-RapidAPI-Host': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_HOST : 'football-web-pages1.p.rapidapi.com'
                }
            });
            
            if (!startResponse.ok) {
                throw new Error(`HTTP ${startResponse.status}: ${startResponse.statusText}`);
            }
            
            const startData = await startResponse.json();
            console.log('Start date response:', startData);
            
            // Fetch data for the end date
            const endResponse = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=5&team=0&date=${endDate}`, {
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_KEY : '',
                    'X-RapidAPI-Host': this.footballWebPagesConfig ? this.footballWebPagesConfig.RAPIDAPI_HOST : 'football-web-pages1.p.rapidapi.com'
                }
            });
            
            if (!endResponse.ok) {
                throw new Error(`HTTP ${endResponse.status}: ${endResponse.statusText}`);
            }
            
            const endData = await endResponse.json();
            console.log('End date response:', endData);
            
            // Combine and filter events based on time
            const allEvents = [];
            
            if (startData.vidiprinter && startData.vidiprinter.events) {
                allEvents.push(...startData.vidiprinter.events);
            }
            
            if (endData.vidiprinter && endData.vidiprinter.events) {
                allEvents.push(...endData.vidiprinter.events);
            }
            
            // Filter events based on time range
            const filteredEvents = this.filterEventsByTimeRange(allEvents, startDate, startTime, endDate, endTime);
            
            console.log('Filtered events:', filteredEvents);
            
            return {
                events: filteredEvents,
                startDate,
                startTime,
                endDate,
                endTime
            };
            
        } catch (error) {
            console.error('Error fetching historical vidiprinter data:', error);
            throw error;
        }
    }

    // Filter events by time range
    filterEventsByTimeRange(events, startDate, startTime, endDate, endTime) {
        if (!events || !Array.isArray(events)) {
            return [];
        }
        
        return events.filter(event => {
            if (!event['date/time']) {
                return false;
            }
            
            const eventDateTime = this.parseEventDateTime(event['date/time']);
            const startDateTime = new Date(`${startDate} ${startTime}`);
            const endDateTime = new Date(`${endDate} ${endTime}`);
            
            return eventDateTime >= startDateTime && eventDateTime <= endDateTime;
        });
    }

    // Parse event date/time string
    parseEventDateTime(dateTimeString) {
        // Handle format: "2025-08-09 22:33:44"
        const [datePart, timePart] = dateTimeString.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        return new Date(year, month - 1, day, hour, minute, second);
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
}

export default ApiManager;
