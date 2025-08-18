// Mobile Navigation Module
// Handles all mobile-specific functionality including tabs, navigation, fixtures, and scores

class MobileNavigationManager {
    constructor(db) {
        this.db = db;
        this.mobileNavigationInitialized = false;
    }

    // Initialize mobile navigation management
    initializeMobileNavigationManagement() {
        if (this.mobileNavigationInitialized) {
            console.log('Mobile navigation management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing mobile navigation management...');
        this.mobileNavigationInitialized = true;
        
        this.setupEventListeners();
    }

    // Set up event listeners for mobile navigation
    setupEventListeners() {
        // Event listeners will be set up when specific functions are called
        console.log('Mobile navigation event listeners ready');
    }

    // Mobile Tabbed Interface Functions
    initializeMobileTabs() {
        console.log('Initializing mobile tabs...');
        const tabButtons = document.querySelectorAll('.mobile-tabs .tab-btn');
        const tabPanes = document.querySelectorAll('.mobile-tab-content .tab-pane');
        
        console.log(`Found ${tabButtons.length} mobile tab buttons and ${tabPanes.length} mobile tab panes`);
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                console.log(`Mobile tab clicked: ${targetTab}`);
                
                // Remove active class from all tabs and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                button.classList.add('active');
                const targetPane = document.getElementById(`${targetTab}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
                
                // Load content based on tab
                if (targetTab === 'as-it-stands') {
                    console.log('Mobile As It Stands tab clicked');
                    // Run diagnostics first
                    if (window.diagnoseAsItStandsElements) {
                        window.diagnoseAsItStandsElements();
                    }
                    // Only initialize if not already done
                    if (!window.asItStandsInitialized_mobile) {
                        if (window.initializeAsItStandsTab) {
                            window.initializeAsItStandsTab('mobile');
                        }
                    }
                } else if (targetTab === 'scores') {
                    if (window.loadPlayerScores) {
                        window.loadPlayerScores().then(async fixtures => {
                            console.log('loadPlayerScores returned:', fixtures);
                            // Get current gameweek for display
                            const currentGameweek = window.getActiveGameweek ? window.getActiveGameweek() : '1';
                            if (window.renderPlayerScores) {
                                await window.renderPlayerScores(fixtures, currentGameweek);
                            }
                            this.renderMobilePlayerScores(fixtures, currentGameweek);
                        }).catch(error => {
                            console.error('Error loading player scores:', error);
                            if (window.showNoScoresMessage) {
                                window.showNoScoresMessage();
                            }
                        });
                    }
                } else if (targetTab === 'vidiprinter') {
                    if (window.initializePlayerVidiprinter) {
                        window.initializePlayerVidiprinter();
                    }
                }
            });
        });
    }

    // Mobile fixtures loading function
    loadMobileFixturesForDeadline(gameweek, userData = null, userId = null) {
        const fixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
        const deadlineDate = document.querySelector('#mobile-deadline-date');
        const deadlineStatus = document.querySelector('#mobile-deadline-status');
        const fixturesDisplay = document.querySelector('#mobile-fixtures-display');

        // Handle tiebreak gameweek
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        
        // Determine user's edition from registration data
        const userEdition = this.getUserEdition(userData);
        const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;

        // Load edition-specific fixtures only
        this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    // Find the earliest fixture (deadline)
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });

                    // Display deadline
                    // Fix: Combine date and kickOffTime if both are available
                    let dateString = earliestFixture.date;
                    if (earliestFixture.kickOffTime && earliestFixture.kickOffTime !== '00:00:00') {
                        // Combine date with kick-off time
                        dateString = `${earliestFixture.date}T${earliestFixture.kickOffTime}`;
                        console.log('🔍 Mobile: Combined date and time:', dateString);
                    } else if (dateString && !dateString.includes('T') && !dateString.includes(':')) {
                        // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                        dateString = `${dateString}T15:00:00`;
                        console.log('🔍 Mobile: Added default time to date string:', dateString);
                    }
                    
                    const deadlineDateObj = new Date(dateString);
                    const formattedDeadline = this.formatDeadlineDate(deadlineDateObj);
                    
                    if (deadlineDate) deadlineDate.textContent = formattedDeadline;
                    
                    // Check if deadline has passed
                    const now = new Date();
                    const timeUntilDeadline = deadlineDateObj - now;
                    
                    // Check if all fixtures in this gameweek are completed
                    const allFixturesCompleted = fixtures.every(fixture => 
                        fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
                    );
                    
                    // Check if all fixtures have finished (have a status) but may not be fully completed
                    const allFixturesFinished = fixtures.every(fixture => 
                        fixture.status && fixture.status !== 'NS' && fixture.status !== '1H' && fixture.status !== 'HT' && fixture.status !== '2H'
                    );
                    
                    if (allFixturesCompleted) {
                        if (deadlineStatus) {
                            deadlineStatus.textContent = 'Complete (Results confirmed and cards issued)';
                            deadlineStatus.className = 'complete';
                            deadlineStatus.style.color = '#0c5460';
                        }
                    } else if (allFixturesFinished && timeUntilDeadline <= 0) {
                        if (deadlineStatus) {
                            deadlineStatus.textContent = 'Locked (Matches are complete)';
                            deadlineStatus.className = 'locked';
                            deadlineStatus.style.color = '#721c24';
                        }
                    } else if (timeUntilDeadline <= 0) {
                        if (deadlineStatus) {
                            deadlineStatus.textContent = 'Locked (Matches are underway)';
                            deadlineStatus.className = 'locked';
                            deadlineStatus.style.color = '#721c24';
                        }
                    } else {
                        if (deadlineStatus) {
                            deadlineStatus.textContent = 'Active (Pick updates allowed)';
                            deadlineStatus.className = 'active';
                            deadlineStatus.style.color = '#28a745';
                        }
                    }

                    // Update pick status header
                    this.updateMobilePickStatusHeader(gameweek, userData, userId).catch(error => {
                        console.error('Error updating mobile pick status header:', error);
                    });

                    // Display fixtures
                    this.renderMobileFixturesDisplay(fixtures, userData, gameweek, userId);
                    if (fixturesDisplayContainer) fixturesDisplayContainer.style.display = 'block';
                }
            } else {
                if (fixturesDisplayContainer) fixturesDisplayContainer.style.display = 'none';
            }
        });
    }

    // Load mobile fixtures for deadline
    async loadMobileFixturesForDeadline(gameweek, userData = null, userId = null) {
        console.log('🔧 Mobile Navigation: loadMobileFixturesForDeadline called with:', { gameweek, userData: !!userData, userId });
        
        const fixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
        console.log('🔧 Mobile Navigation: fixturesDisplayContainer found:', !!fixturesDisplayContainer);
        if (!fixturesDisplayContainer) {
            console.error('🔧 Mobile Navigation: fixturesDisplayContainer not found');
            return;
        }

        const fixturesDisplay = document.querySelector('#mobile-fixtures-display');
        console.log('🔧 Mobile Navigation: fixturesDisplay found:', !!fixturesDisplay);
        if (!fixturesDisplay) {
            console.error('🔧 Mobile Navigation: fixturesDisplay found');
            return;
        }
        
        // Check if gameweek is valid
        if (!gameweek) {
            console.log('🔧 Mobile Navigation: gameweek is undefined');
            return;
        }

        try {
            // Use the same format as the main app.js file
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            
            // Get user edition using EditionService if available
            let userEdition;
            if (window.editionService) {
                // Use EditionService to get user edition
                userEdition = window.editionService.getCurrentUserEdition();
                console.log('🔧 Mobile Navigation: EditionService resolved user edition:', userEdition);
            } else {
                // Fallback to old method
                userEdition = window.currentActiveEdition || 1;
                console.log('🔧 Mobile Navigation: Fallback method resolved user edition:', userEdition);
            }
            
            const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;
            
            console.log('🔧 Mobile Navigation: Loading mobile fixtures for deadline:', editionGameweekKey);
            
            // Load edition-specific fixtures only
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            console.log('🔧 Mobile Navigation: Fixtures document exists:', doc.exists);
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                console.log('🔧 Mobile Navigation: Fixtures data:', fixtures ? fixtures.length : 'null');
                if (fixtures && fixtures.length > 0) {
                    console.log('🔧 Mobile Navigation: Found mobile fixtures:', fixtures.length);
                    
                    // Always render fixtures - let the render method handle status display
                    console.log('🔧 Mobile Navigation: Calling renderMobileFixturesDisplay...');
                    this.renderMobileFixturesDisplay(fixtures, userData, gameweek, userId);
                    console.log('🔧 Mobile Navigation: Setting container display to block');
                    fixturesDisplayContainer.style.display = 'block';
                    
                    // Update mobile pick status header and deadline info
                    console.log('🔧 Mobile Navigation: Updating mobile pick status header...');
                    this.updateMobilePickStatusHeader(gameweek, userData, userId).catch(error => {
                        console.error('🔧 Mobile Navigation: Error updating mobile pick status header:', error);
                    });
                    
                    // Show the mobile gameweek navigation
                    const mobileGameweekNavigation = document.querySelector('#mobile-gameweek-navigation');
                    if (mobileGameweekNavigation) {
                        mobileGameweekNavigation.style.display = 'block';
                        console.log('🔧 Mobile Navigation: Mobile gameweek navigation shown');
                    }
                } else {
                    console.log('🔧 Mobile Navigation: No mobile fixtures found for gameweek');
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
                console.log('🔧 Mobile Navigation: No mobile fixtures document found for:', editionGameweekKey);
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
            console.error('🔧 Mobile Navigation: Error loading mobile fixtures for deadline:', error);
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

    // Mobile fixtures display rendering function
    async renderMobileFixturesDisplay(fixtures, userData = null, currentGameWeek = null, userId = null) {
        console.log('🔧 Mobile Navigation: renderMobileFixturesDisplay called with:', {
            fixturesCount: fixtures ? fixtures.length : 0,
            userData: !!userData,
            currentGameWeek,
            userId
        });
        
        const fixturesDisplay = document.querySelector('#mobile-fixtures-display');
        console.log('🔧 Mobile Navigation: fixturesDisplay element found:', !!fixturesDisplay);
        
        if (!fixturesDisplay) {
            console.error('🔧 Mobile Navigation: #mobile-fixtures-display element not found');
            return;
        }
        
        if (!fixtures || fixtures.length === 0) {
            console.log('🔧 Mobile Navigation: No fixtures available');
            fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
            return;
        }

        try {
            // Create fixtures display with single dropdown approach
            let fixturesHTML = '<div class="mobile-fixtures-container">';
            
            // Add fixtures list first (display only, no picker buttons)
            fixturesHTML += '<div class="mobile-fixtures-list">';
            fixtures.forEach((fixture, index) => {
                // Fix: Combine date and kickOffTime if both are available
                let fixtureDateString = fixture.date;
                if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
                    // Combine date with kick-off time
                    fixtureDateString = `${fixture.date}T${fixture.kickOffTime}`;
                    console.log(`🔧 Mobile Navigation: Fixture ${index + 1}: Combined date and time:`, fixtureDateString);
                } else if (fixtureDateString && !fixtureDateString.includes('T') && !fixtureDateString.includes(':')) {
                    // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                    fixtureDateString = `${fixtureDateString}T15:00:00`;
                    console.log(`🔧 Mobile Navigation: Fixture ${index + 1}: Added default time to date string:`, fixtureDateString);
                }
                
                const fixtureDate = new Date(fixtureDateString);
                
                // Format the date properly
                const formattedDate = fixtureDate.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/London'
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
            
            // Add single team picker dropdown for all teams
            fixturesHTML += `
                <div class="mobile-team-picker-section">
                    <div class="mobile-team-picker-header">
                        <h4>Select Your Pick</h4>
                    </div>
                    <div class="mobile-team-picker-dropdown-container">
                        <select id="mobile-team-picker-dropdown" class="mobile-team-picker-dropdown" data-gameweek="${currentGameWeek}" data-user-id="${userId}">
                            <option value="">Choose a team...</option>
                        </select>
                    </div>
                </div>
            `;
            
            fixturesHTML += '</div>';
            fixturesDisplay.innerHTML = fixturesHTML;
            
            // Setup the single team picker dropdown
            this.setupMobileTeamPickerDropdown(fixtures, userData, currentGameWeek, userId);
            
            console.log('🔧 Mobile Navigation: Mobile fixtures display rendered successfully');
            
        } catch (error) {
            console.error('🔧 Mobile Navigation: Error rendering mobile fixtures display:', error);
            fixturesDisplay.innerHTML = '<p>Error loading fixtures. Please try again.</p>';
        }
    }

    /**
     * Setup the single mobile team picker dropdown with all teams alphabetically
     */
    async setupMobileTeamPickerDropdown(fixtures, userData, currentGameWeek, userId) {
        console.log('🔧 Mobile Navigation: Setting up single team picker dropdown');
        
        const dropdown = document.querySelector('#mobile-team-picker-dropdown');
        if (!dropdown) {
            console.error('🔧 Mobile Navigation: Mobile team picker dropdown not found');
            return;
        }

        try {
            // Get all unique teams from fixtures
            const allTeams = new Set();
            fixtures.forEach(fixture => {
                allTeams.add(fixture.homeTeam);
                allTeams.add(fixture.awayTeam);
            });

            // Sort teams alphabetically
            const sortedTeams = Array.from(allTeams).sort();

            // Get current pick for this gameweek
            const gameweekKey = currentGameWeek ? (currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`) : null;
            const currentPick = userData && gameweekKey ? userData.picks && userData.picks[gameweekKey] : null;

            // Clear existing options except the first one
            dropdown.innerHTML = '<option value="">Choose a team...</option>';

            // Add teams to dropdown with proper status
            for (const team of sortedTeams) {
                let teamStatus = 'available';
                let isClickable = true;
                let statusText = 'Available for picking';
                let statusClass = 'available';

                if (window.enhancedPickManager) {
                    // Use EnhancedPickManager to get team status
                    try {
                        const status = await window.enhancedPickManager.getTeamStatus(team, currentGameWeek, userData, fixtures);
                        teamStatus = status.status;
                        isClickable = status.clickable;
                        statusText = status.tooltip || status.reason || 'Available for picking';
                        
                        // Map status to CSS class
                        if (status.status === 'current-pick') {
                            statusClass = 'current-pick';
                        } else if (status.status === 'saved-pick') {
                            statusClass = status.clickable ? 'saved-pick transferable' : 'saved-pick locked';
                        } else if (status.status === 'locked-pick') {
                            statusClass = 'locked-pick';
                        } else {
                            statusClass = status.clickable ? 'available pickable' : 'available unavailable';
                        }
                    } catch (error) {
                        console.error('🔧 Mobile Navigation: Error getting team status for', team, error);
                        // Fallback to available
                        teamStatus = 'available';
                        isClickable = true;
                        statusText = 'Available for picking';
                        statusClass = 'available pickable';
                    }
                } else {
                    // Fallback logic if EnhancedPickManager not available
                    if (currentPick === team) {
                        teamStatus = 'current-pick';
                        isClickable = false;
                        statusText = 'Current pick for this gameweek';
                        statusClass = 'current-pick';
                    } else if (userData && userData.picks && Object.values(userData.picks).includes(team)) {
                        teamStatus = 'saved-pick';
                        isClickable = true;
                        statusText = 'Picked in another gameweek';
                        statusClass = 'saved-pick transferable';
                    } else {
                        teamStatus = 'available';
                        isClickable = true;
                        statusText = 'Available for picking';
                        statusClass = 'available pickable';
                    }
                }

                // Create option element
                const option = document.createElement('option');
                option.value = team;
                option.textContent = team;
                option.className = `dropdown-option ${statusClass}`;
                option.disabled = !isClickable;
                option.title = statusText;

                // Mark as selected if this is the current pick
                if (currentPick === team) {
                    option.selected = true;
                }

                dropdown.appendChild(option);
            }

            // Add event listener for dropdown changes
            dropdown.addEventListener('change', async (event) => {
                const selectedTeam = event.target.value;
                console.log('🔧 Mobile Navigation: Team selected in dropdown:', selectedTeam);

                if (selectedTeam === '') {
                    // Clear pick
                    if (confirm('Are you sure you want to clear your pick for this gameweek?')) {
                        await this.clearPickForGameweek(currentGameWeek, userId);
                    } else {
                        // Reset dropdown to previous value
                        event.target.value = currentPick || '';
                    }
                } else {
                    // Make pick
                    if (window.enhancedPickManager) {
                        await window.enhancedPickManager.handleTeamSelection(selectedTeam, currentGameWeek, userId);
                    }
                }
            });

            console.log('🔧 Mobile Navigation: Single team picker dropdown setup complete');

        } catch (error) {
            console.error('🔧 Mobile Navigation: Error setting up mobile team picker dropdown:', error);
        }
    }

    /**
     * Clear pick for a specific gameweek
     */
    async clearPickForGameweek(gameweek, userId) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const db = this.getDb();
            
            await db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: db.FieldValue.delete()
            });
            
            console.log('🔧 Mobile Navigation: Pick cleared for gameweek:', gameweek);
            
            // Refresh the display
            if (window.updateMobilePickStatusHeader) {
                window.updateMobilePickStatusHeader(gameweek, null, userId);
            }
            
        } catch (error) {
            console.error('🔧 Mobile Navigation: Error clearing pick for gameweek:', error);
        }
    }

    /**
     * Setup event listeners for mobile dropdown pickers
     */
    setupDropdownEventListeners() {
        const dropdowns = document.querySelectorAll('.team-pick-dropdown');
        console.log('🔧 Mobile Navigation: Found dropdowns:', dropdowns.length);
        
        dropdowns.forEach((dropdown, index) => {
            console.log(`🔧 Mobile Navigation: Setting up dropdown ${index + 1}:`, {
                fixtureId: dropdown.dataset.fixtureId,
                gameweek: dropdown.dataset.gameweek,
                userId: dropdown.dataset.userId
            });
            dropdown.addEventListener('change', async (event) => {
                const selectedValue = event.target.value;
                const gameweek = event.target.dataset.gameweek;
                const userId = event.target.dataset.userId;
                
                if (selectedValue === '') {
                    // Clear pick
                    if (confirm('Are you sure you want to clear your pick for this fixture?')) {
                        await this.clearPickForFixture(gameweek, userId);
                    } else {
                        // Reset dropdown to previous value
                        event.target.value = event.target.dataset.previousValue || '';
                    }
                } else {
                    // Make pick
                    if (window.enhancedPickManager) {
                        await window.enhancedPickManager.handleTeamSelection(selectedValue, gameweek, userId);
                    }
                }
                
                // Store current value for next change
                event.target.dataset.previousValue = selectedValue;
            });
        });
    }
    
    /**
     * Clear pick for a specific fixture
     * @param {string} gameweek - Gameweek
     * @param {string} userId - User ID
     */
    async clearPickForFixture(gameweek, userId) {
        try {
            const db = this.db;
            if (!db) {
                console.error('Database not available');
                return;
            }
            
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            
            await db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: db.FieldValue.delete()
            });
            
            console.log(`✅ Pick cleared for ${gameweekKey}`);
            
            // Refresh the display
            if (window.loadMobileFixturesForDeadline) {
                window.loadMobileFixturesForDeadline(gameweek, null, userId);
            }
        } catch (error) {
            console.error('Error clearing pick:', error);
            alert('Error clearing pick. Please try again.');
        }
    }

    /**
     * Update team statuses asynchronously using EnhancedPickManager for mobile
     * @param {Array} fixtures - Array of fixtures
     * @param {string} currentGameWeek - Current gameweek
     * @param {Object} userData - User data
     * @param {string} userId - User ID
     */
    async updateMobileTeamStatusesAsync(fixtures, currentGameWeek, userData, userId) {
        if (!window.enhancedPickManager) return;
        
        try {
            for (const fixture of fixtures) {
                // Get async team statuses
                const homeTeamStatus = await window.enhancedPickManager.getTeamStatus(fixture.homeTeam, currentGameWeek, userData, fixtures);
                const awayTeamStatus = await window.enhancedPickManager.getTeamStatus(fixture.awayTeam, currentGameWeek, userData, fixtures);
                
                // Find the team buttons for this fixture
                const homeTeamButton = document.querySelector(`button[onclick*="${fixture.homeTeam}"]`);
                const awayTeamButton = document.querySelector(`button[onclick*="${fixture.awayTeam}"]`);
                
                if (homeTeamButton) {
                    this.updateMobileTeamButton(homeTeamButton, homeTeamStatus, fixture.homeTeam, currentGameWeek, userId);
                }
                
                if (awayTeamButton) {
                    this.updateMobileTeamButton(awayTeamButton, awayTeamStatus, fixture.awayTeam, currentGameWeek, userId);
                }
                
                // Update dropdown for this fixture
                const dropdown = document.querySelector(`select[data-fixture-id="${fixture.homeTeam}-${fixture.awayTeam}"]`);
                if (dropdown) {
                    this.updateMobileDropdown(dropdown, homeTeamStatus, awayTeamStatus, fixture, currentGameWeek, userId);
                }
            }
        } catch (error) {
            console.error('Error updating mobile team statuses asynchronously:', error);
        }
    }
    
    /**
     * Update a mobile dropdown with the correct status
     * @param {HTMLElement} dropdown - The dropdown element
     * @param {Object} homeTeamStatus - Home team status object
     * @param {Object} awayTeamStatus - Away team status object
     * @param {Object} fixture - Fixture object
     * @param {string} currentGameWeek - Current gameweek
     * @param {string} userId - User ID
     */
    updateMobileDropdown(dropdown, homeTeamStatus, awayTeamStatus, fixture, currentGameWeek, userId) {
        const currentPick = dropdown.value;
        
        // Update dropdown options based on team statuses
        const options = dropdown.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === fixture.homeTeam) {
                option.disabled = !homeTeamStatus.clickable;
                option.className = `dropdown-option ${homeTeamStatus.status}`;
                option.textContent = `${fixture.homeTeam} (Home) ${homeTeamStatus.status === 'current-pick' ? '✓' : homeTeamStatus.status === 'saved-pick' ? '💾' : homeTeamStatus.status === 'locked-pick' ? '🔒' : ''}`;
            } else if (option.value === fixture.awayTeam) {
                option.disabled = !awayTeamStatus.clickable;
                option.className = `dropdown-option ${awayTeamStatus.status}`;
                option.textContent = `${fixture.awayTeam} (Away) ${awayTeamStatus.status === 'current-pick' ? '✓' : awayTeamStatus.status === 'saved-pick' ? '💾' : awayTeamStatus.status === 'locked-pick' ? '🔒' : ''}`;
            }
        });
        
        // Update dropdown styling based on current pick status
        dropdown.className = 'team-pick-dropdown';
        if (currentPick === fixture.homeTeam) {
            dropdown.classList.add(homeTeamStatus.status);
        } else if (currentPick === fixture.awayTeam) {
            dropdown.classList.add(awayTeamStatus.status);
        } else {
            dropdown.classList.add('available');
        }
    }

    /**
     * Update a mobile team button with the correct status
     * @param {HTMLElement} button - The team button element
     * @param {Object} teamStatus - Team status object from EnhancedPickManager
     * @param {string} teamName - Team name
     * @param {string} currentGameWeek - Current gameweek
     * @param {string} userId - User ID
     */
    updateMobileTeamButton(button, teamStatus, teamName, currentGameWeek, userId) {
        // Update classes
        button.className = teamStatus.classes;
        
        // Update clickable state
        if (teamStatus.clickable) {
            button.onclick = () => window.enhancedPickManager.handleTeamSelection(teamName, currentGameWeek, userId);
            button.disabled = false;
        } else {
            button.onclick = null;
            button.disabled = true;
        }
        
        // Update tooltip
        button.title = teamStatus.tooltip;
        
        // Update visual indicators
        const pickIndicator = button.querySelector('.pick-indicator');
        const savedPickIndicator = button.querySelector('.saved-pick-indicator');
        const lockedPickIndicator = button.querySelector('.locked-pick-indicator');
        
        // Remove existing indicators
        if (pickIndicator) pickIndicator.remove();
        if (savedPickIndicator) savedPickIndicator.remove();
        if (lockedPickIndicator) lockedPickIndicator.remove();
        
        // Add appropriate indicator
        if (teamStatus.status === 'current-pick') {
            const indicator = document.createElement('span');
            indicator.className = 'pick-indicator';
            indicator.textContent = '✓';
            button.appendChild(indicator);
        } else if (teamStatus.status === 'saved-pick') {
            const indicator = document.createElement('span');
            indicator.className = 'saved-pick-indicator';
            indicator.textContent = '💾';
            button.appendChild(indicator);
        } else if (teamStatus.status === 'locked-pick') {
            const indicator = document.createElement('span');
            indicator.className = 'locked-pick-indicator';
            indicator.textContent = '🔒';
            button.appendChild(indicator);
        }
    }

    // Function to update the mobile pick status header
    async updateMobilePickStatusHeader(gameweek, userData, userId) {
        const pickStatusDisplay = document.querySelector('#mobile-pick-status-display');
        const pickStatusHeader = document.querySelector('.mobile-deadline-section .pick-status-header');
        
        if (!pickStatusDisplay || !pickStatusHeader) {
            return;
        }
        
        // Check if deadline has passed for this gameweek
        const isDeadlinePassed = await this.checkDeadlineForGameweek(gameweek);
        
        if (isDeadlinePassed) {
            // Deadline has passed - hide pick information
            pickStatusDisplay.style.display = 'none';
            pickStatusHeader.style.display = 'none';
            return;
        }
        
        // Show pick status header
        pickStatusHeader.style.display = 'block';
        pickStatusDisplay.style.display = 'block';
        
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const currentPick = userData && userData.picks && userData.picks[gameweekKey];
        
        if (currentPick) {
            // User has made a pick for this gameweek
            pickStatusDisplay.textContent = `Saved Pick: ${currentPick}`;
            pickStatusDisplay.className = 'pick-status-text saved';
            pickStatusHeader.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
            pickStatusHeader.style.borderColor = 'rgba(40, 167, 69, 0.3)';
        } else {
            // No pick made yet - show prompt
            pickStatusDisplay.textContent = '⚠️ Make your pick before the deadline!';
            pickStatusDisplay.className = 'pick-status-text prompt';
            pickStatusHeader.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
            pickStatusHeader.style.borderColor = 'rgba(220, 53, 69, 0.3)';
        }
    }

    // Mobile gameweek navigation functions
    initializeMobileGameweekNavigation(currentGameWeek, userData, userId) {
        const currentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
        const prevButton = document.querySelector('#mobile-prev-gameweek');
        const nextButton = document.querySelector('#mobile-next-gameweek');
        const gameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
        const tiebreakTab = document.querySelector('.mobile-gameweek-tabs .tiebreak-tab');
        
        // Check if tiebreak is enabled in admin settings
        this.db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                const tiebreakEnabled = settings.tiebreak_enabled || false;
                
                // Show/hide tiebreak tab based on admin setting
                if (tiebreakTab) {
                    if (tiebreakEnabled) {
                        tiebreakTab.style.display = 'inline-block';
                    } else {
                        tiebreakTab.style.display = 'none';
                        // If tiebreak is disabled and current gameweek is tiebreak, switch to GW10
                        if (currentGameWeek === 'tiebreak') {
                            this.navigateToMobileGameweek('10', userData, userId);
                            return;
                        }
                    }
                }
            }
        });
        
        // Set current gameweek display
        const displayText = currentGameWeek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${currentGameWeek}`;
        if (currentGameweekDisplay) currentGameweekDisplay.textContent = displayText;
        
        // Update navigation buttons
        this.updateMobileNavigationButtons(currentGameWeek, prevButton, nextButton);
        
        // Update active tab
        this.updateMobileActiveTab(currentGameWeek, gameweekTabs);
        
        // Add event listeners
        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateMobileGameweek(currentGameWeek, -1, userData, userId));
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateMobileGameweek(currentGameWeek, 1, userData, userId));
        }
        
        // Add tab click listeners
        gameweekTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const gameweek = tab.dataset.gameweek;
                this.navigateToMobileGameweek(gameweek, userData, userId);
            });
        });
        
        // Update tab states based on deadlines
        this.updateMobileTabStates(gameweekTabs);
    }

    updateMobileNavigationButtons(currentGameWeek, prevButton, nextButton) {
        if (!prevButton || !nextButton) return;
        
        const gameweekNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
        
        // Enable/disable previous button
        prevButton.disabled = gameweekNum <= 1;
        
        // Enable/disable next button - allow navigation up to tiebreak (11)
        nextButton.disabled = gameweekNum >= 11;
    }

    updateMobileActiveTab(currentGameWeek, gameweekTabs) {
        gameweekTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.gameweek === currentGameWeek) {
                tab.classList.add('active');
            }
        });
    }

    updateMobileTabStates(gameweekTabs) {
        gameweekTabs.forEach(tab => {
            const gameweek = tab.dataset.gameweek;
            this.checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
                if (isDeadlinePassed) {
                    tab.classList.add('locked');
                } else {
                    tab.classList.remove('locked');
                }
            });
        });
    }

    navigateMobileGameweek(currentGameWeek, direction, userData, userId) {
        const currentNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
        const newNum = currentNum + direction;
        
        if (newNum < 1 || newNum > 11) return;
        
        const newGameweek = newNum === 11 ? 'tiebreak' : newNum.toString();
        this.navigateToMobileGameweek(newGameweek, userData, userId);
    }

    async navigateToMobileGameweek(gameweek, userData, userId) {
        try {
            // Fetch fresh user data from database to ensure we have the latest picks
            const freshUserDoc = await this.db.collection('users').doc(userId).get();
            const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : userData;
            
            // Update current gameweek display
            const currentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            if (currentGameweekDisplay) currentGameweekDisplay.textContent = displayText;
            
            // Update navigation buttons
            const prevButton = document.querySelector('#mobile-prev-gameweek');
            const nextButton = document.querySelector('#mobile-next-gameweek');
            this.updateMobileNavigationButtons(gameweek, prevButton, nextButton);
            
            // Update event listeners with the new gameweek
            if (prevButton) {
                // Remove existing event listeners
                prevButton.replaceWith(prevButton.cloneNode(true));
                const newPrevButton = document.querySelector('#mobile-prev-gameweek');
                newPrevButton.addEventListener('click', () => this.navigateMobileGameweek(gameweek, -1, freshUserData, userId));
            }
            
            if (nextButton) {
                // Remove existing event listeners
                nextButton.replaceWith(nextButton.cloneNode(true));
                const newNextButton = document.querySelector('#mobile-next-gameweek');
                newNextButton.addEventListener('click', () => this.navigateMobileGameweek(gameweek, 1, freshUserData, userId));
            }
            
            // Update active tab
            const gameweekTabs = document.querySelectorAll('.mobile-gameweek-tabs .gameweek-tab');
            this.updateMobileActiveTab(gameweek, gameweekTabs);
            
            // Load fixtures for the selected gameweek with fresh data
            this.loadMobileFixturesForDeadline(gameweek, freshUserData, userId);
            
            console.log(`Navigated to mobile gameweek ${gameweek} with fresh user data`);
        } catch (error) {
            console.error('Error navigating to mobile gameweek:', error);
        }
    }

    // Mobile player scores rendering function
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
                            <small>Half Time: ${fixture.homeScoreHT} - ${fixture.awayScoreHT}</small>
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

    // Mobile testimonial toggle function
    toggleTestimonials() {
        const button = document.querySelector('.testimonial-toggle');
        const content = document.getElementById('mobile-testimonials');
        
        if (button && content) {
            const isActive = content.classList.contains('active');
            
            if (isActive) {
                content.classList.remove('active');
                button.classList.remove('active');
            } else {
                content.classList.add('active');
                button.classList.add('active');
            }
        }
    }

    // Switch mobile tab to fixtures (used by other modules)
    switchToFixturesTab() {
        // Switch mobile tab to fixtures
        const mobileTabButtons = document.querySelectorAll('.mobile-tabs .tab-btn');
        const mobileTabPanes = document.querySelectorAll('.mobile-tab-content .tab-pane');
        
        mobileTabButtons.forEach(btn => btn.classList.remove('active'));
        mobileTabPanes.forEach(pane => pane.classList.remove('active'));
        
        const mobileFixturesTab = document.querySelector('.mobile-tabs .tab-btn[data-tab="fixtures"]');
        const mobileFixturesPane = document.getElementById('fixtures-tab');
        
        if (mobileFixturesTab) mobileFixturesTab.classList.add('active');
        if (mobileFixturesPane) mobileFixturesPane.classList.add('active');
    }

    // Helper functions
    getUserEdition(userData) {
        if (!userData || !userData.registrations) return 1;
        
        // Check if user has registered for current edition
        if (userData.registrations[`edition${this.currentActiveEdition}`]) {
            return this.currentActiveEdition;
        }
        
        // Check for any registered edition
        for (let i = 1; i <= 5; i++) {
            if (userData.registrations[`edition${i}`]) {
                return i;
            }
        }
        
        return 1; // Default to edition 1
    }

    async checkDeadlineForGameweek(gameweek, edition = null) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionKey = edition ? `edition${edition}` : 'edition1';
            const docKey = `${editionKey}_${gameweekKey}`;
            
            const doc = await this.db.collection('fixtures').doc(docKey).get();
            if (!doc.exists) return false;
            
            const fixtures = doc.data().fixtures;
            if (!fixtures || fixtures.length === 0) return false;
            
            // Find the earliest fixture (deadline)
            const earliestFixture = fixtures.reduce((earliest, fixture) => {
                const fixtureDate = new Date(fixture.date);
                const earliestDate = new Date(earliest.date);
                return fixtureDate < earliestDate ? fixture : earliest;
            });
            
            // Fix: Combine date and kickOffTime if both are available
            let dateString = earliestFixture.date;
            if (earliestFixture.kickOffTime && earliestFixture.kickOffTime !== '00:00:00') {
                // Combine date with kick-off time
                dateString = `${earliestFixture.date}T${earliestFixture.kickOffTime}`;
                console.log('🔍 MobileNav checkDeadlineForGameweek: Combined date and time:', dateString);
            } else if (dateString && !dateString.includes('T') && !dateString.includes(':')) {
                // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                dateString = `${dateString}T15:00:00`;
                console.log('🔍 MobileNav checkDeadlineForGameweek: Added default time to date string:', dateString);
            }
            
            const deadlineDate = new Date(dateString);
            const now = new Date();
            
            return now >= deadlineDate;
        } catch (error) {
            console.error('Error checking deadline for gameweek:', error);
            return false;
        }
    }

    formatDeadlineDate(date) {
        // Log the date for debugging
        console.log('MobileNav - Original date:', date);
        console.log('MobileNav - Date object:', new Date(date));
        console.log('MobileNav - UTC time:', new Date(date).toISOString());
        console.log('MobileNav - Local time:', new Date(date).toString());
        
        const day = new Date(date).getDate();
        const month = new Date(date).toLocaleDateString('en-GB', { 
            month: 'long',
            timeZone: 'Europe/London'
        });
        const year = new Date(date).getFullYear();
        const time = new Date(date).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Europe/London'
        });
        
        const ordinalSuffix = this.getOrdinalSuffix(day);
        
        const formattedDate = `${day}${ordinalSuffix} ${month} ${year} at ${time}`;
        console.log('MobileNav - Formatted date:', formattedDate);
        
        return formattedDate;
    }

    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    getTeamBadge(teamName) {
        // This function should be implemented based on your team badge logic
        // For now, returning null as placeholder
        return null;
    }

    getStatusDisplay(status) {
        const statusMap = {
            'NS': 'Not Started',
            '1H': 'First Half',
            'HT': 'Half Time',
            '2H': 'Second Half',
            'FT': 'Full Time',
            'AET': 'Extra Time',
            'PEN': 'Penalties',
            'LIVE': 'Live'
        };
        return statusMap[status] || status || 'Not Started';
    }

    // Cleanup method
    cleanup() {
        this.mobileNavigationInitialized = false;
        console.log('Mobile Navigation Manager cleanup completed');
    }
}

// Export the MobileNavigationManager class
export default MobileNavigationManager;
