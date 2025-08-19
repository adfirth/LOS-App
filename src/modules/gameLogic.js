// Game Logic Module
// Handles all core game mechanics, pick management, navigation, and game logic functionality

class GameLogicManager {
    constructor(db) {
        this.db = db;
        this.gameLogicInitialized = false;
        this.deadlineCheckerInterval = null;
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
    }

    // Initialize game logic management
    initializeGameLogicManagement() {
        if (this.gameLogicInitialized) {
            console.log('Game logic management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing game logic management...');
        this.gameLogicInitialized = true;
        
        this.setupEventListeners();
        this.startDeadlineChecker();
    }

    // Setup event listeners for game logic
    setupEventListeners() {
        console.log('Setting up game logic event listeners...');
        // Event listeners will be set up by the calling code
    }

    // --- PICK MANAGEMENT FUNCTIONS ---

    // Generate pick history HTML
    generatePickHistory(picks) {
        if (Object.keys(picks).length === 0) {
            return '<p>No picks made yet</p>';
        }
        
        let html = '<div class="pick-list">';
        const gameweeks = [
            { key: 'gw1', label: 'Game Week 1' },
            { key: 'gw2', label: 'Game Week 2' },
            { key: 'gw3', label: 'Game Week 3' },
            { key: 'gw4', label: 'Game Week 4' },
            { key: 'gw5', label: 'Game Week 5' },
            { key: 'gw6', label: 'Game Week 6' },
            { key: 'gw7', label: 'Game Week 7' },
            { key: 'gw8', label: 'Game Week 8' },
            { key: 'gw9', label: 'Game Week 9' },
            { key: 'gw10', label: 'Game Week 10' },
            { key: 'gwtiebreak', label: 'Tiebreak Round' }
        ];
        
        gameweeks.forEach(gw => {
            const pick = picks[gw.key];
            let teamName = 'No pick made';
            let isAutopick = false;
            
            if (pick) {
                // Handle new pick object format
                if (typeof pick === 'string') {
                    teamName = pick;
                    isAutopick = false;
                } else if (pick && typeof pick === 'object') {
                    teamName = pick.team || 'Unknown team';
                    isAutopick = pick.isAutopick || false;
                } else {
                    teamName = 'Unknown team';
                    isAutopick = false;
                }
            }
            
            const badge = teamName !== 'No pick made' ? this.getTeamBadge(teamName) : null;
            const badgeHtml = badge ? `<img src="${badge}" alt="${teamName}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
            const autopickIndicator = isAutopick ? ' (A)' : '';
            
            html += `
                <div class="pick-item">
                    <strong>${gw.label}:</strong> ${teamName !== 'No pick made' ? badgeHtml + teamName + autopickIndicator : teamName}
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Render pick history
    async renderPickHistory(picks, container, userId, userData = null) {
        if (!container) {
            console.error('Pick history container not found');
            return;
        }

        try {
            const pickHistoryHtml = this.generatePickHistory(picks);
            container.innerHTML = pickHistoryHtml;
        } catch (error) {
            console.error('Error rendering pick history:', error);
            container.innerHTML = '<p>Error loading pick history</p>';
        }
    }

    // --- GAMEWEEK NAVIGATION FUNCTIONS ---

    // Initialize gameweek navigation
    initializeGameweekNavigation(currentGameWeek, userData, userId) {
        const currentGameweekDisplay = document.querySelector('#current-gameweek-display');
        const prevButton = document.querySelector('#prev-gameweek');
        const nextButton = document.querySelector('#next-gameweek');
        const gameweekTabs = document.querySelectorAll('.gameweek-tab');
        const tiebreakTab = document.querySelector('.tiebreak-tab');
        
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
                            this.navigateToGameweek('10', userData, userId);
                            return;
                        }
                    }
                }
            }
        });
        
        // Set current gameweek display
        const displayText = currentGameWeek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${currentGameWeek}`;
        if (currentGameweekDisplay) {
            currentGameweekDisplay.textContent = displayText;
        }
        
        // Update navigation buttons
        this.updateNavigationButtons(currentGameWeek, prevButton, nextButton);
        
        // Update active tab
        this.updateActiveTab(currentGameWeek, gameweekTabs);
        
        // Add event listeners
        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateGameweek(currentGameWeek, -1, userData, userId));
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateGameweek(currentGameWeek, 1, userData, userId));
        }
        
        // Add tab click listeners
        gameweekTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const gameweek = tab.dataset.gameweek;
                this.navigateToGameweek(gameweek, userData, userId);
            });
        });
        
        // Update tab states based on deadlines
        this.updateTabStates(gameweekTabs);
    }

    // Update navigation buttons
    updateNavigationButtons(currentGameWeek, prevButton, nextButton) {
        if (!prevButton || !nextButton) return;
        
        const gameweekNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
        
        // Enable/disable previous button
        prevButton.disabled = gameweekNum <= 1;
        
        // Enable/disable next button - allow navigation up to tiebreak (11)
        nextButton.disabled = gameweekNum >= 11;
    }

    // Update active tab
    updateActiveTab(currentGameWeek, gameweekTabs) {
        gameweekTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.gameweek === currentGameWeek) {
                tab.classList.add('active');
            }
        });
    }

    // Update tab states
    updateTabStates(gameweekTabs) {
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

    // Navigate gameweek
    navigateGameweek(currentGameWeek, direction, userData, userId) {
        const currentNum = currentGameWeek === 'tiebreak' ? 11 : parseInt(currentGameWeek);
        const newNum = currentNum + direction;
        
        if (newNum < 1 || newNum > 11) return;
        
        const newGameweek = newNum === 11 ? 'tiebreak' : newNum.toString();
        this.navigateToGameweek(newGameweek, userData, userId);
    }

    // Navigate to specific gameweek
    async navigateToGameweek(gameweek, userData, userId) {
        try {
            // Fetch fresh user data from database to ensure we have the latest picks
            const freshUserDoc = await this.db.collection('users').doc(userId).get();
            const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : userData;
            
            // Update current gameweek display (both desktop and mobile)
            const currentGameweekDisplay = document.querySelector('#current-gameweek-display');
            const mobileCurrentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            
            if (currentGameweekDisplay) {
                currentGameweekDisplay.textContent = displayText;
            }
            
            if (mobileCurrentGameweekDisplay) {
                mobileCurrentGameweekDisplay.textContent = displayText;
            }
            
            // Update navigation buttons
            const prevButton = document.querySelector('#prev-gameweek');
            const nextButton = document.querySelector('#next-gameweek');
            this.updateNavigationButtons(gameweek, prevButton, nextButton);
            
            // Update event listeners with the new gameweek
            if (prevButton) {
                // Remove existing event listeners
                prevButton.replaceWith(prevButton.cloneNode(true));
                const newPrevButton = document.querySelector('#prev-gameweek');
                newPrevButton.addEventListener('click', () => this.navigateGameweek(gameweek, -1, freshUserData, userId));
            }
            
            if (nextButton) {
                // Remove existing event listeners
                nextButton.replaceWith(nextButton.cloneNode(true));
                const newNextButton = document.querySelector('#next-gameweek');
                newNextButton.addEventListener('click', () => this.navigateGameweek(gameweek, 1, freshUserData, userId));
            }
            
            // Update active tab
            const gameweekTabs = document.querySelectorAll('.gameweek-tab');
            this.updateActiveTab(gameweek, gameweekTabs);
            
            // Load fixtures for the selected gameweek with fresh data (both desktop and mobile)
            // This will be handled by the fixtures manager
            if (window.loadFixturesForDeadline) {
                window.loadFixturesForDeadline(gameweek, freshUserData, userId);
            }
            
            // Load mobile fixtures for the selected gameweek
            if (window.loadMobileFixturesForDeadline) {
                window.loadMobileFixturesForDeadline(gameweek, freshUserData, userId);
            }
            
            console.log(`Navigated to gameweek ${gameweek} with fresh user data`);
        } catch (error) {
            console.error('Error navigating to gameweek:', error);
            // Fallback to original behavior if there's an error
            if (window.loadFixturesForDeadline) {
                window.loadFixturesForDeadline(gameweek, userData, userId);
            }
        }
    }

    // Initialize mobile gameweek navigation
    initializeMobileGameweekNavigation(currentGameWeek, userData, userId) {
        console.log('Initializing mobile gameweek navigation for gameweek:', currentGameWeek);
        
        // Ensure currentGameWeek has a valid value
        const gameweek = currentGameWeek || '1';
        console.log('🔧 Mobile navigation: Using gameweek:', gameweek);
        
        // Get all mobile gameweek tab buttons (they use the same class as desktop)
        const mobileGameweekButtons = document.querySelectorAll('#mobile-gameweek-navigation .gameweek-tab');
        
        if (mobileGameweekButtons.length === 0) {
            console.log('No mobile gameweek buttons found');
            return;
        }
        
        // Set active gameweek
        this.setActiveGameweek(gameweek);
        
        // Add click event listeners to all mobile gameweek buttons
        mobileGameweekButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetGameweek = button.getAttribute('data-gameweek');
                console.log('Navigating to mobile gameweek:', targetGameweek);
                this.navigateToGameweek(targetGameweek, userData, userId);
            });
        });
        
        // Also set up the mobile navigation controls (prev/next buttons)
        const mobilePrevButton = document.querySelector('#mobile-prev-gameweek');
        const mobileNextButton = document.querySelector('#mobile-next-gameweek');
        const mobileCurrentGameweekDisplay = document.querySelector('#mobile-current-gameweek-display');
        
        if (mobileCurrentGameweekDisplay) {
            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
            mobileCurrentGameweekDisplay.textContent = displayText;
            console.log('🔧 Mobile navigation: Set display text to:', displayText);
        } else {
            console.error('🔧 Mobile navigation: mobile-current-gameweek-display element not found');
        }
        
        if (mobilePrevButton) {
            mobilePrevButton.addEventListener('click', () => this.navigateGameweek(gameweek, -1, userData, userId));
        }
        
        if (mobileNextButton) {
            mobileNextButton.addEventListener('click', () => this.navigateGameweek(gameweek, 1, userData, userId));
        }
        
        console.log('Mobile gameweek navigation initialized');
    }

    // --- PICK OPERATIONS ---

    // Remove pick
    removePick(userId, gameweekKey) {
        if (confirm('Are you sure you want to remove this pick?')) {
            const gameweek = gameweekKey.replace('gw', '');
            
            // Check if deadline has passed
            this.checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
                if (isDeadlinePassed) {
                    alert('Cannot remove pick - deadline has passed for this gameweek.');
                    return;
                }
                
                // Remove the pick from Firestore
                const updateData = {};
                updateData[`picks.${gameweekKey}`] = this.db.FieldValue.delete();
                
                this.db.collection('users').doc(userId).update(updateData).then(() => {
                    // Refresh the dashboard
                    firebase.auth().onAuthStateChanged(user => {
                        if (user && window.renderDashboard) {
                            window.renderDashboard(user).catch(console.error);
                        }
                    });
                }).catch(error => {
                    console.error('Error removing pick:', error);
                    alert('Error removing pick. Please try again.');
                });
            });
        }
    }

    // Make pick
    makePick(userId, gameweek) {
        // Fetch user data and navigate to the gameweek
        this.db.collection('users').doc(userId).get().then(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.navigateToGameweek(gameweek, userData, userId);
                
                // Switch to the Fixtures tab
                if (window.switchToFixturesTab) {
                    window.switchToFixturesTab();
                }
            }
        }).catch(error => {
            console.error('Error making pick:', error);
            alert('Error loading user data. Please try again.');
        });
    }

    // Select team as temporary pick
    async selectTeamAsTempPick(teamName, gameweek, userId) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        
        try {
            // Check if user has already picked this team in another gameweek
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                alert('User not found.');
                return;
            }
            
            const userData = userDoc.data();
            const currentPick = userData.picks?.[gameweekKey];
            
            // Check if this is a pick change for the current gameweek
            if (currentPick && currentPick !== teamName) {
                // User is changing their pick for the current gameweek
                if (confirm(`You currently have ${currentPick} selected for Game Week ${gameweek}. Would you like to change your pick to ${teamName}?`)) {
                    await this.db.collection('users').doc(userId).update({
                        [`picks.${gameweekKey}`]: teamName
                    });
                    
                    console.log(`Pick changed from ${currentPick} to ${teamName} for Game Week ${gameweek}`);
                    
                    // Refresh the display with updated data
                    await this.refreshDisplayAfterPickUpdate(gameweek, userId);
                }
                return;
            }
            
            // Check if user has already picked this team in another gameweek
            const existingPicks = Object.values(userData.picks || {});
            
            if (existingPicks.includes(teamName)) {
                // Find which gameweek this team was picked in
                let pickedGameweek = null;
                for (const [key, pick] of Object.entries(userData.picks || {})) {
                    if (pick === teamName) {
                        pickedGameweek = key;
                        break;
                    }
                }
                
                if (pickedGameweek) {
                    const pickedGameweekNum = pickedGameweek === 'gwtiebreak' ? 'tiebreak' : pickedGameweek.replace('gw', '');
                    
                    // Offer to release the old pick and save the new one
                    if (confirm(`You have picked ${teamName} for Game Week ${pickedGameweekNum}. Would you like to release this pick and select ${teamName} for Game Week ${gameweek}?`)) {
                        const oldGameweekKey = pickedGameweek;
                        
                        await this.db.collection('users').doc(userId).update({
                            [`picks.${oldGameweekKey}`]: this.db.FieldValue.delete(),
                            [`picks.${gameweekKey}`]: teamName
                        });
                        
                        console.log(`Pick released and new pick saved: ${teamName} for Game Week ${gameweek}`);
                        
                        // Refresh the display with updated data
                        await this.refreshDisplayAfterPickUpdate(gameweek, userId);
                    }
                    return;
                }
            }
            
            // Team is available for picking - show confirmation popup
            if (confirm(`Would you like to pick ${teamName} for Game Week ${gameweek}?`)) {
                await this.db.collection('users').doc(userId).update({
                    [`picks.${gameweekKey}`]: teamName
                });
                
                console.log(`Pick saved: ${teamName} for Game Week ${gameweek}`);
                
                // Refresh the display with updated data
                await this.refreshDisplayAfterPickUpdate(gameweek, userId);
            }
        } catch (error) {
            console.error('Error in selectTeamAsTempPick:', error);
            alert('Error processing pick. Please try again.');
        }
    }

    // Refresh display after pick update
    async refreshDisplayAfterPickUpdate(gameweek, userId) {
        try {
            const updatedUserDoc = await this.db.collection('users').doc(userId).get();
            if (updatedUserDoc.exists) {
                const updatedUserData = updatedUserDoc.data();
                
                // Get the current gameweek being viewed from the active tab
                const activeTab = document.querySelector('.gameweek-tab.active');
                const currentViewedGameweek = activeTab ? activeTab.getAttribute('data-gameweek') : gameweek;
                
                // Refresh the desktop display with updated data for the current viewed gameweek
                if (window.loadFixturesForDeadline) {
                    window.loadFixturesForDeadline(currentViewedGameweek, updatedUserData, userId);
                }
                
                // Refresh the mobile display with updated data for the current viewed gameweek
                if (window.loadMobileFixturesForDeadline) {
                    window.loadMobileFixturesForDeadline(currentViewedGameweek, updatedUserData, userId);
                }
                
                // Update the pick status headers with updated data for the current viewed gameweek
                if (window.updatePickStatusHeader) {
                    window.updatePickStatusHeader(currentViewedGameweek, updatedUserData, userId).catch(error => {
                        console.error('Error updating pick status header:', error);
                    });
                }
                if (window.updateMobilePickStatusHeader) {
                    window.updateMobilePickStatusHeader(currentViewedGameweek, updatedUserData, userId).catch(error => {
                        console.error('Error updating mobile pick status header:', error);
                    });
                }
                
                // Refresh the pick history sidebars with updated data
                const picksHistoryContainer = document.querySelector('#picks-history');
                const mobilePicksHistoryContainer = document.querySelector('#mobile-picks-history');
                const desktopPicksHistoryContainer = document.querySelector('#desktop-picks-history');
                
                if (picksHistoryContainer) {
                    this.renderPickHistory(updatedUserData.picks || {}, picksHistoryContainer, userId, updatedUserData);
                }
                if (mobilePicksHistoryContainer) {
                    this.renderPickHistory(updatedUserData.picks || {}, mobilePicksHistoryContainer, userId, updatedUserData);
                }
                if (desktopPicksHistoryContainer) {
                    this.renderPickHistory(updatedUserData.picks || {}, desktopPicksHistoryContainer, userId, updatedUserData);
                }
                
                console.log(`Display refreshed for gameweek ${currentViewedGameweek} with updated user data`);
            }
        } catch (error) {
            console.error('Error refreshing display:', error);
        }
    }

    // Save temporary pick
    saveTempPick(gameweek, userId) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const tempPickKey = `tempPick_${userId}_${gameweek}`;
        const tempPick = sessionStorage.getItem(tempPickKey);
        
        if (!tempPick) {
            alert('No temporary pick to save.');
            return;
        }
        
        // Check if deadline has passed
        this.checkDeadlineForGameweek(gameweek).then(isDeadlinePassed => {
            if (isDeadlinePassed) {
                alert('Deadline has passed for this gameweek. Picks are locked.');
                return;
            }
            
            // Save the pick to database
            this.db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: tempPick
            }).then(() => {
                console.log(`Pick saved: ${tempPick} for Game Week ${gameweek}`);
                
                // Clear temporary pick from sessionStorage
                sessionStorage.removeItem(tempPickKey);
                
                // Refresh both the pick history sidebar and the fixtures display
                this.db.collection('users').doc(userId).get().then(userDoc => {
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        
                        // Refresh the pick history sidebar (desktop)
                        const picksHistoryContainer = document.querySelector('#picks-history');
                        if (picksHistoryContainer) {
                            this.renderPickHistory(userData.picks || {}, picksHistoryContainer, userId, userData);
                        }
                        
                        // Refresh the mobile pick history
                        const mobilePicksHistoryContainer = document.querySelector('#mobile-picks-history');
                        if (mobilePicksHistoryContainer) {
                            this.renderPickHistory(userData.picks || {}, mobilePicksHistoryContainer, userId, userData);
                        }
                        
                        // Refresh the desktop pick history
                        const desktopPicksHistoryContainer = document.querySelector('#desktop-picks-history');
                        if (desktopPicksHistoryContainer) {
                            this.renderPickHistory(userData.picks || {}, desktopPicksHistoryContainer, userId, userData);
                        }
                        
                        // Refresh the fixtures display to update the save button
                        if (window.loadFixturesForDeadline) {
                            window.loadFixturesForDeadline(gameweek, userData, userId);
                        }
                        
                        // Update the pick status header
                        if (window.updatePickStatusHeader) {
                            window.updatePickStatusHeader(gameweek, userData, userId).catch(error => {
                                console.error('Error updating pick status header:', error);
                            });
                        }
                    }
                }).catch(console.error);
            }).catch(error => {
                console.error('Error saving pick:', error);
                alert('Error saving pick. Please try again.');
            });
        });
    }

    // Release future pick
    releaseFuturePick(teamName, gameweek, userId) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        
        // Confirm the release
        if (!confirm(`Are you sure you want to release ${teamName} from Game Week ${gameweek}?`)) {
            return;
        }
        
        // Remove the pick from database
        this.db.collection('users').doc(userId).update({
            [`picks.${gameweekKey}`]: this.db.FieldValue.delete()
        }).then(() => {
            console.log(`Future pick released: ${teamName} from Game Week ${gameweek}`);
            
            // Refresh the display
            this.db.collection('users').doc(userId).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Refresh the pick history sidebar
                    const picksHistoryContainer = document.querySelector('#picks-history');
                    if (picksHistoryContainer) {
                        this.renderPickHistory(userData.picks || {}, picksHistoryContainer, userId, userData);
                    }
                    
                    // Refresh the fixtures display - we need to get the current gameweek from the page
                    const currentGameWeek = document.querySelector('.gameweek-tab.active')?.getAttribute('data-gameweek') || '1';
                    if (window.loadFixturesForDeadline) {
                        window.loadFixturesForDeadline(currentGameWeek, userData, userId);
                    }
                }
            }).catch(console.error);
        }).catch(error => {
            console.error('Error releasing future pick:', error);
            alert('Error releasing pick. Please try again.');
        });
    }

    // Select team as pick (legacy function - keeping for compatibility)
    selectTeamAsPick(teamName, gameweek, userId) {
        // Redirect to new temporary pick system
        this.selectTeamAsTempPick(teamName, gameweek, userId);
    }

    // --- AUTO-PICK FUNCTIONS ---

    // Check and assign auto picks
    async checkAndAssignAutoPicks(userData, currentGameWeek, userId) {
        const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
        
        // Check if user already has a pick for current gameweek
        if (userData.picks && userData.picks[gameweekKey]) {
            return; // User already has a pick
        }

        // Check if deadline has passed using the new edition-based structure
        try {
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            console.log(`🔍 GameLogic: Checking autopick for ${editionGameweekKey}`);
            
            const doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                console.log(`🔍 GameLogic: Found ${fixtures?.length || 0} fixtures for ${editionGameweekKey}`);
                
                if (fixtures && fixtures.length > 0) {
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = new Date(fixture.date);
                        const earliestDate = new Date(earliest.date);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });

                    // Combine date and kickOffTime if both are available
                    let dateString = earliestFixture.date;
                    if (earliestFixture.kickOffTime && earliestFixture.kickOffTime !== '00:00:00') {
                        dateString = `${earliestFixture.date}T${earliestFixture.kickOffTime}`;
                        console.log('🔍 GameLogic auto-pick: Combined date and time:', dateString);
                    } else if (dateString && !dateString.includes('T') && !dateString.includes(':')) {
                        // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                        dateString = `${earliestFixture.date}T15:00:00`;
                        console.log('🔍 GameLogic auto-pick: Added default time to date string:', dateString);
                    }
                    
                    const deadlineDate = new Date(dateString);
                    const now = new Date();
                    
                    console.log(`🔍 GameLogic: Deadline: ${deadlineDate.toISOString()}, Now: ${now.toISOString()}, Passed: ${deadlineDate <= now}`);

                    if (deadlineDate <= now) {
                        // Deadline has passed, assign auto-pick
                        console.log(`🔍 GameLogic: Deadline passed for GW${currentGameWeek}, assigning auto-pick for user ${userId}`);
                        await this.assignAutoPick(userData, currentGameWeek, userId);
                    } else {
                        console.log(`🔍 GameLogic: Deadline not passed yet for GW${currentGameWeek}`);
                    }
                }
            } else {
                console.log(`🔍 GameLogic: No fixtures document found for ${editionGameweekKey}`);
            }
        } catch (error) {
            console.error('Error checking auto-pick deadline:', error);
        }
    }

    // Manual test function for autopicks (for testing purposes)
    async testAutopickForUser(userId, gameweek) {
        console.log(`🧪 Testing autopick for user ${userId} in GW${gameweek}`);
        
        try {
            // Get user data
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                console.error('User not found:', userId);
                return;
            }
            
            const userData = userDoc.data();
            console.log('User data:', userData);
            
            // Check if user already has a pick for this gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            if (userData.picks && userData.picks[gameweekKey]) {
                console.log(`User already has pick for ${gameweekKey}:`, userData.picks[gameweekKey]);
                return;
            }
            
            // Force assign autopick
            console.log('Forcing autopick assignment...');
            await this.assignAutoPick(userData, gameweek, userId);
            
        } catch (error) {
            console.error('Error testing autopick:', error);
        }
    }

    // Assign auto pick
    async assignAutoPick(userData, gameweek, userId) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        
        try {
            // Get teams playing in this specific gameweek
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            const fixturesDoc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            
            if (!fixturesDoc.exists) {
                console.error(`No fixtures found for ${editionGameweekKey}`);
                return;
            }
            
            const fixtures = fixturesDoc.data().fixtures || [];
            const teamsInGameweek = [];
            
            // Extract all teams playing in this gameweek
            fixtures.forEach(fixture => {
                if (fixture.homeTeam && !teamsInGameweek.includes(fixture.homeTeam)) {
                    teamsInGameweek.push(fixture.homeTeam);
                }
                if (fixture.awayTeam && !teamsInGameweek.includes(fixture.awayTeam)) {
                    teamsInGameweek.push(fixture.awayTeam);
                }
            });
            
            // Sort teams alphabetically
            teamsInGameweek.sort();
            
            let autoPick = null;
            
            if (gameweek === 1 || gameweek === '1') {
                // GW1: First team alphabetically from teams playing in GW1
                autoPick = teamsInGameweek[0];
                console.log(`🔍 GameLogic: GW1 autopick - first team alphabetically: ${autoPick}`);
            } else {
                // GW2+: Next available team based on previous gameweek pick
                const previousGameweek = parseInt(gameweek) - 1;
                const previousGameweekKey = `gw${previousGameweek}`;
                const previousPick = userData.picks?.[previousGameweekKey];
                
                if (previousPick) {
                    // Find the next team alphabetically after the previous pick
                    const previousPickIndex = teamsInGameweek.indexOf(previousPick);
                    if (previousPickIndex !== -1 && previousPickIndex < teamsInGameweek.length - 1) {
                        autoPick = teamsInGameweek[previousPickIndex + 1];
                    } else {
                        // If previous pick was last alphabetically, wrap to first
                        autoPick = teamsInGameweek[0];
                    }
                    console.log(`🔍 GameLogic: GW${gameweek} autopick - based on previous pick ${previousPick}: ${autoPick}`);
                } else {
                    // No previous pick, fall back to first team alphabetically
                    autoPick = teamsInGameweek[0];
                    console.log(`🔍 GameLogic: GW${gameweek} autopick - no previous pick, using first team: ${autoPick}`);
                }
            }
            
            if (autoPick) {
                // Mark this as an autopick with 'A' indicator
                const autoPickData = {
                    team: autoPick,
                    isAutopick: true,
                    assignedAt: new Date(),
                    gameweek: gameweek
                };
                
                await this.db.collection('users').doc(userId).update({
                    [`picks.${gameweekKey}`]: autoPickData
                });
                
                console.log(`✅ Auto-pick assigned: ${autoPick} for Game Week ${gameweek} (marked as autopick)`);
                
                // Refresh the dashboard to show the auto-pick
                if (window.renderDashboard) {
                    window.renderDashboard({ uid: userId }).catch(console.error);
                }
            } else {
                console.error('No teams available for autopick in gameweek', gameweek);
            }
        } catch (error) {
            console.error('Error assigning auto-pick:', error);
        }
    }

    // --- DEADLINE MANAGEMENT ---

    // Get deadline date for gameweek
    getDeadlineDateForGameweek(gameweek) {
        return new Promise((resolve) => {
            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
                console.log('getDeadlineDateForGameweek timeout for:', gameweek);
                resolve(null);
            }, 5000); // 5 second timeout
            
            // Handle tiebreak gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
            
            // Try new structure first, then fallback to old structure
            this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
                if (!doc.exists) {
                    // Fallback to old structure for backward compatibility
                    return this.db.collection('fixtures').doc(gameweekKey).get();
                }
                return doc;
            }).then(doc => {
                clearTimeout(timeout);
                if (doc.exists) {
                    const fixtures = doc.data().fixtures;
                    if (fixtures && fixtures.length > 0) {
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
                            console.log('🔍 GameLogic getDeadlineDateForGameweek: Combined date and time:', dateString);
                        } else if (dateString && !dateString.includes('T') && !dateString.includes(':')) {
                            // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                            dateString = `${dateString}T15:00:00`;
                            console.log('🔍 GameLogic getDeadlineDateForGameweek: Added default time to date string:', dateString);
                        }
                        
                        resolve(new Date(dateString));
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            }).catch((error) => {
                clearTimeout(timeout);
                console.log('getDeadlineDateForGameweek error:', error);
                resolve(null);
            });
        });
    }

    // Format deadline date
    formatDeadlineDate(date) {
        if (!date) return 'No deadline set';
        
        const now = new Date();
        const deadline = new Date(date);
        const timeDiff = deadline.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
            return 'Deadline passed';
        } else if (daysDiff === 0) {
            const hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
            if (hoursDiff <= 0) {
                const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
                return `${minutesDiff} minutes`;
            }
            return `${hoursDiff} hours`;
        } else if (daysDiff === 1) {
            return 'Tomorrow';
        } else {
            return `${daysDiff} days`;
        }
    }

    // Get ordinal suffix for day
    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    // Check deadline for gameweek
    checkDeadlineForGameweek(gameweek, edition = null) {
        return new Promise((resolve) => {
            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
                console.log('checkDeadlineForGameweek timeout for:', gameweek, edition);
                resolve(false);
            }, 5000); // 5 second timeout
            
            // Handle tiebreak gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            // Use provided edition or fall back to current active edition
            const editionToUse = edition || this.currentActiveEdition;
            const editionGameweekKey = `edition${editionToUse}_${gameweekKey}`;
            
            // Try new structure first, then fallback to old structure
            this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
                if (!doc.exists) {
                    // Fallback to old structure for backward compatibility
                    return this.db.collection('fixtures').doc(gameweekKey).get();
                }
                return doc;
            }).then(doc => {
                clearTimeout(timeout);
                if (doc.exists) {
                    const fixtures = doc.data().fixtures;
                    if (fixtures && fixtures.length > 0) {
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
                            console.log('🔍 GameLogic checkDeadlineForGameweek: Combined date and time:', dateString);
                        } else if (dateString && !dateString.includes('T') && !dateString.includes(':')) {
                            // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
                            dateString = `${dateString}T15:00:00`;
                            console.log('🔍 GameLogic checkDeadlineForGameweek: Added default time to date string:', dateString);
                        }
                        
                        const deadlineDate = new Date(dateString);
                        const now = new Date();
                        const isDeadlinePassed = deadlineDate <= now;
                        resolve(isDeadlinePassed);
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            }).catch((error) => {
                clearTimeout(timeout);
                console.log('checkDeadlineForGameweek error:', error);
                resolve(false);
            });
        });
    }

    // Start deadline checker
    startDeadlineChecker() {
        // Check for deadlines every minute
        this.deadlineCheckerInterval = setInterval(() => {
            this.db.collection('settings').doc('currentCompetition').get().then(settingsDoc => {
                if (settingsDoc.exists) {
                    const settings = settingsDoc.data();
                    const currentGameWeek = settings.active_gameweek;
                    
                    // Check if deadline has passed for current gameweek
                    this.checkDeadlineForGameweek(currentGameWeek).then(isDeadlinePassed => {
                        if (isDeadlinePassed) {
                            // Check all users for auto-picks needed
                            this.db.collection('users').get().then(querySnapshot => {
                                querySnapshot.forEach(doc => {
                                    const userData = doc.data();
                                    const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
                                    
                                    // If user doesn't have a pick for current gameweek, assign auto-pick
                                    if (!userData.picks || !userData.picks[gameweekKey]) {
                                        this.assignAutoPick(userData, currentGameWeek, doc.id);
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }, 60000); // Check every minute
    }

    // Batch check deadlines
    async batchCheckDeadlines(gameweeks, edition) {
        const results = {};
        const promises = gameweeks.map(async (gameweek) => {
            const isDeadlinePassed = await this.checkDeadlineForGameweek(gameweek, edition);
            results[gameweek] = isDeadlinePassed;
        });
        
        await Promise.all(promises);
        return results;
    }

    // --- TEAM STATUS FUNCTIONS ---

    // Get team status simple
    getTeamStatusSimple(teamName, userData, currentGameWeek, userId) {
        // Simple fallback implementation to avoid any complex logic that might cause issues
        try {
            // Basic validation
            if (!teamName || !userData || !currentGameWeek || !userId) {
                return { status: 'normal', clickable: false, reason: 'No user data' };
            }
            
            // Simple check for current pick
            const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
            const currentPick = userData.picks && userData.picks[gameweekKey];
            
            if (currentPick === teamName) {
                return { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
            }
            
            // Simple check for existing picks
            const existingPicks = Object.values(userData.picks || {});
            if (existingPicks.includes(teamName)) {
                return { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
            }
            
            // Default to available
            return { status: 'available', clickable: true, reason: 'Available for picking' };
            
        } catch (error) {
            console.error('Error in getTeamStatusSimple:', error);
            return { status: 'available', clickable: true, reason: 'Available for picking' };
        }
    }

    // Get team status
    async getTeamStatus(teamName, userData, currentGameWeek, userId) {
        if (!userData || !currentGameWeek || !userId) {
            return { status: 'normal', clickable: false, reason: 'No user data' };
        }
        
        const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
        const currentPick = userData.picks && userData.picks[gameweekKey];
        
        // Check if this is the current pick for this gameweek
        if (currentPick === teamName) {
            return { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
        }
        
        // Check if team is picked in another gameweek
        const existingPicks = Object.values(userData.picks || {});
        if (existingPicks.includes(teamName)) {
            // Find which gameweek this team was picked in
            let pickedGameweek = null;
            for (const [key, pick] of Object.entries(userData.picks || {})) {
                if (pick === teamName) {
                    pickedGameweek = key;
                    break;
                }
            }
            
            if (pickedGameweek) {
                // Use batch deadline checking instead of individual calls
                const pickedGameweekNum = pickedGameweek === 'gwtiebreak' ? 'tiebreak' : pickedGameweek.replace('gw', '');
                const userEdition = this.getUserEdition(userData);
                
                // Get all unique gameweeks from user's picks for batch processing
                const userGameweeks = Object.keys(userData.picks || {}).map(key => 
                    key === 'gwtiebreak' ? 'tiebreak' : key.replace('gw', '')
                );
                
                // Use batch deadline checking with fallback
                let isDeadlinePassed = false;
                try {
                    const deadlineResults = await this.batchCheckDeadlines(userGameweeks, userEdition);
                    isDeadlinePassed = deadlineResults[pickedGameweekNum] || false;
                } catch (error) {
                    console.log('Batch deadline check failed, using fallback:', error);
                    // Fallback to simple logic - assume future pick if we can't determine
                    return { status: 'future-pick', clickable: true, reason: `Picked in future ${pickedGameweek}` };
                }
                
                if (isDeadlinePassed) {
                    return { status: 'completed-pick', clickable: false, reason: `Picked in completed ${pickedGameweek}` };
                } else {
                    return { status: 'future-pick', clickable: true, reason: `Picked in future ${pickedGameweek}` };
                }
            }
        }
        
        // Team is available for picking
        return { status: 'available', clickable: true, reason: 'Available for picking' };
    }

    // --- HELPER FUNCTIONS ---

    // Get user edition
    getUserEdition(userData) {
        if (!userData) return 1;
        
        // Check if user has a specific edition preference
        if (userData.edition) {
            return userData.edition;
        }
        
        // Check if user has registered editions
        if (userData.registeredEditions && userData.registeredEditions.length > 0) {
            return userData.registeredEditions[0]; // Return first registered edition
        }
        
        // Default to current active edition
        return this.currentActiveEdition;
    }

    // Get user registered editions
    getUserRegisteredEditions(userData) {
        if (!userData) return [];
        
        if (userData.registeredEditions && Array.isArray(userData.registeredEditions)) {
            return userData.registeredEditions;
        }
        
        return [];
    }

    // Get team badge
    getTeamBadge(teamName) {
        // This function should return the team badge image URL
        // For now, return null - this will be handled by the calling code
        return null;
    }

    // Get active gameweek
    getActiveGameweek() {
        return this.currentActiveGameweek;
    }

    // Set active gameweek
    setActiveGameweek(gameweek) {
        this.currentActiveGameweek = gameweek;
    }

    // Set active edition
    setActiveEdition(edition) {
        this.currentActiveEdition = edition;
    }

    // --- CLEANUP ---

    // Cleanup method
    cleanup() {
        if (this.deadlineCheckerInterval) {
            clearInterval(this.deadlineCheckerInterval);
            this.deadlineCheckerInterval = null;
        }
        console.log('🧹 Game Logic Manager cleanup completed');
    }
}

// Export the GameLogicManager class
export default GameLogicManager;

