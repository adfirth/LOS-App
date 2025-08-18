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

    // Mobile fixtures display rendering function
    async renderMobileFixturesDisplay(fixtures, userData = null, currentGameWeek = null, userId = null) {
        const fixturesDisplay = document.querySelector('#mobile-fixtures-display');
        
        if (!fixtures || fixtures.length === 0) {
            fixturesDisplay.innerHTML = '<p>No fixtures available for this gameweek.</p>';
            return;
        }

        // Sort fixtures by date
        const sortedFixtures = fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let fixturesHTML = '';
        
        for (const fixture of sortedFixtures) {
            const fixtureDate = new Date(fixture.date);

            const homeBadge = this.getTeamBadge(fixture.homeTeam);
            const awayBadge = this.getTeamBadge(fixture.awayTeam);
            
            const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${fixture.homeTeam}">` : '';
            const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${fixture.awayTeam}">` : '';

            // Check if user has already picked either team for this gameweek
            const gameweekKey = currentGameWeek ? (currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`) : null;
            const currentPick = userData && gameweekKey ? userData.picks && userData.picks[gameweekKey] : null;
            
            // Determine if teams are clickable (not already picked and deadline hasn't passed)
            const isClickable = userData && currentGameWeek && userId;
            
            // Check if teams are already picked by user in other gameweeks
            const existingPicks = userData ? Object.values(userData.picks || {}) : [];
            
            // Check if deadline has passed for this gameweek
            let deadlinePassed = false;
            if (currentGameWeek && userData) {
                const userEdition = this.getUserEdition(userData);
                try {
                    deadlinePassed = await this.checkDeadlineForGameweek(currentGameWeek, userEdition);
                } catch (error) {
                    console.error('Error checking deadline for mobile fixtures:', error);
                    deadlinePassed = false;
                }
            }
            
            // Use EnhancedPickManager for team status if available, otherwise fallback to simple logic
            let homeTeamStatus, awayTeamStatus;
            
            if (window.enhancedPickManager) {
                // Use fallback status for now - we'll update asynchronously
                homeTeamStatus = {
                    status: 'available',
                    clickable: true,
                    tooltip: 'Click to pick this team',
                    classes: 'team-pick-button available',
                    action: 'pick'
                };
                awayTeamStatus = {
                    status: 'available',
                    clickable: true,
                    tooltip: 'Click to pick this team',
                    classes: 'team-pick-button available',
                    action: 'pick'
                };
            } else {
                // Fallback to simple logic if EnhancedPickManager not available
                if (currentPick === fixture.homeTeam) {
                    homeTeamStatus = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
                } else if (existingPicks.includes(fixture.homeTeam)) {
                    homeTeamStatus = { status: 'future-pick', clickable: !deadlinePassed, reason: deadlinePassed ? 'Deadline passed' : 'Picked in another gameweek' };
                } else {
                    homeTeamStatus = { status: 'available', clickable: !deadlinePassed, reason: deadlinePassed ? 'Deadline passed' : 'Available for picking' };
                }
                
                if (currentPick === fixture.awayTeam) {
                    awayTeamStatus = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
                } else if (existingPicks.includes(fixture.awayTeam)) {
                    awayTeamStatus = { status: 'future-pick', clickable: !deadlinePassed, reason: deadlinePassed ? 'Deadline passed' : 'Picked in another gameweek' };
                } else {
                    awayTeamStatus = { status: 'available', clickable: !deadlinePassed, reason: deadlinePassed ? 'Deadline passed' : 'Available for picking' };
                }
            }
            
            // Apply status classes to team buttons
            const homeTeamClasses = homeTeamStatus.classes || `team-pick-button ${homeTeamStatus.status}`;
            const awayTeamClasses = awayTeamStatus.classes || `team-pick-button ${awayTeamStatus.status}`;
            
            // Add deadline-passed class if deadline has passed (fallback only)
            if (!window.enhancedPickManager && deadlinePassed) {
                homeTeamClasses += ' deadline-passed';
                awayTeamClasses += ' deadline-passed';
            }
            
            // Determine if teams are clickable and create tooltips
            const homeTeamClickable = homeTeamStatus.clickable;
            const awayTeamClickable = awayTeamStatus.clickable;
            const homeTeamTooltip = homeTeamStatus.tooltip || homeTeamStatus.reason;
            const awayTeamTooltip = awayTeamStatus.tooltip || awayTeamStatus.reason;
            
            const homeTeamClickAttr = homeTeamClickable ? `onclick="window.enhancedPickManager.handleTeamSelection('${fixture.homeTeam}', ${currentGameWeek}, '${userId}')"` : '';
            const awayTeamClickAttr = awayTeamClickable ? `onclick="window.enhancedPickManager.handleTeamSelection('${fixture.awayTeam}', ${currentGameWeek}, '${userId}')"` : '';
            const homeTeamTitleAttr = homeTeamTooltip ? `title="${homeTeamTooltip}"` : '';
            const awayTeamTitleAttr = awayTeamTooltip ? `title="${awayTeamTooltip}"` : '';

            fixturesHTML += `
                <div class="fixture-item">
                    <div class="fixture-teams">
                        <button class="${homeTeamClasses}" ${homeTeamClickAttr} ${homeTeamTitleAttr} ${!homeTeamClickable ? 'disabled' : ''}>
                            ${homeBadgeHtml}${fixture.homeTeam}
                            ${currentPick === fixture.homeTeam ? '<span class="pick-indicator">✓</span>' : ''}
                        </button>
                        <div class="fixture-vs">vs</div>
                        <button class="${awayTeamClasses}" ${awayTeamClickAttr} ${awayTeamTitleAttr} ${!awayTeamClickable ? 'disabled' : ''}>
                            ${awayBadgeHtml}${fixture.awayTeam}
                            ${currentPick === fixture.awayTeam ? '<span class="pick-indicator">✓</span>' : ''}
                        </button>
                    </div>
                    <div class="fixture-datetime">
                        <div class="fixture-time">${fixtureDate.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="fixture-date">${fixtureDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div class="fixture-status">
                        <span class="status-badge ${fixture.status || 'NS'}">${this.getStatusDisplay(fixture.status)}</span>
                    </div>
                </div>
            `;
        }

        fixturesDisplay.innerHTML = fixturesHTML;
        
        // Now update team statuses asynchronously if EnhancedPickManager is available
        if (window.enhancedPickManager) {
            this.updateMobileTeamStatusesAsync(fixtures, currentGameWeek, userData, userId);
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
            }
        } catch (error) {
            console.error('Error updating mobile team statuses asynchronously:', error);
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
