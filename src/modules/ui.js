// UI Module
// Handles all user interface components, display logic, and responsive design functionality

class UIManager {
    constructor(db) {
        this.db = db;
        this.uiManagementInitialized = false;
        this.vidiprinterInterval = null;
        this.vidiprinterData = [];
        this.isVidiprinterRunning = false;
        this.autoScrollEnabled = true;
    }

    // Initialize UI management
    initializeUIManagement() {
        if (this.uiManagementInitialized) {
            console.log('UI management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing UI management...');
        this.uiManagementInitialized = true;
        
        this.setupEventListeners();
        this.initializeTestimonialModal();
        this.initializeRegistrationWindowDisplay();
        this.initializeVidiprinter();
    }

    // Set up event listeners for UI functionality
    setupEventListeners() {
        // Testimonial toggle
        const testimonialToggle = document.querySelector('.testimonial-toggle');
        if (testimonialToggle) {
            testimonialToggle.addEventListener('click', () => this.toggleTestimonials());
        }
    }

    // Modal management
    showModal(content) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = content;
        
        // Add to page
        document.body.appendChild(modalOverlay);
        
        // Add event listener to close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeUserDetailsModal();
            }
        });
    }

    closeUserDetailsModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // Tab management
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
                this.handleTabContentLoad(targetTab);
            });
        });
    }

    initializeDesktopTabs() {
        console.log('Initializing desktop tabs...');
        const tabButtons = document.querySelectorAll('.desktop-tabs .desktop-tab-btn');
        const tabPanes = document.querySelectorAll('.desktop-tab-content .desktop-tab-pane');
        
        console.log(`Found ${tabButtons.length} desktop tab buttons and ${tabPanes.length} desktop tab panes`);
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                console.log(`Desktop tab clicked: ${targetTab}`);
                
                // Remove active class from all tabs and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                button.classList.add('active');
                const targetPane = document.getElementById(`desktop-${targetTab}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
                
                // Load content based on tab
                this.handleTabContentLoad(targetTab);
            });
        });
    }

    // Handle tab content loading
    handleTabContentLoad(targetTab) {
        if (targetTab === 'as-it-stands') {
            console.log('As It Stands tab clicked');
            // Run diagnostics first
            if (typeof diagnoseAsItStandsElements === 'function') {
                diagnoseAsItStandsElements();
            }
            // Only initialize if not already done
            if (!window.asItStandsInitialized_desktop && !window.asItStandsInitialized_mobile) {
                if (typeof initializeAsItStandsTab === 'function') {
                    initializeAsItStandsTab('desktop');
                }
            }
        } else if (targetTab === 'scores') {
            if (typeof loadPlayerScores === 'function') {
                loadPlayerScores().then(async fixtures => {
                    console.log('loadPlayerScores returned:', fixtures);
                    // Get current gameweek for display
                    const currentGameweek = getActiveGameweek();
                    if (typeof renderPlayerScores === 'function') {
                        await renderPlayerScores(fixtures, currentGameweek);
                    }
                    if (typeof renderMobilePlayerScores === 'function') {
                        renderMobilePlayerScores(fixtures, currentGameweek);
                    }
                }).catch(error => {
                    console.error('Error loading player scores:', error);
                    if (typeof showNoScoresMessage === 'function') {
                        showNoScoresMessage();
                    }
                });
            }
        } else if (targetTab === 'vidiprinter') {
            if (typeof initializePlayerVidiprinter === 'function') {
                initializePlayerVidiprinter();
            }
        }
    }

    // Dashboard rendering
    async renderDashboard(user) {
        // Initialize both mobile and desktop tabs
        console.log('Starting tab initialization...');
        this.initializeMobileTabs();
        console.log('Mobile tabs initialized');
        this.initializeDesktopTabs();
        console.log('Desktop tabs initialized');
        
        // Run diagnostics to check DOM elements
        console.log('Dashboard rendered, running As It Stands diagnostics...');
        setTimeout(() => {
            console.log('Running delayed diagnostics...');
            if (typeof diagnoseAsItStandsElements === 'function') {
                diagnoseAsItStandsElements();
            }
        }, 1000);
        
        // Pre-load all deadlines for this user's edition to avoid individual calls during rendering
        const userDoc = await this.db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userEdition = this.getUserEdition(userData);
            const allGameweeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'tiebreak'];
            if (typeof batchCheckDeadlines === 'function') {
                await batchCheckDeadlines(allGameweeks, userEdition);
            }
        }
        
        const welcomeMessage = document.querySelector('#welcome-message');
        const mobileWelcomeMessage = document.querySelector('#mobile-welcome-message');
        const livesRemaining = document.querySelector('#lives-remaining');
        const mobileLivesRemaining = document.querySelector('#mobile-lives-remaining');
        const desktopLivesRemaining = document.querySelector('#desktop-lives-remaining');
        const picksHistoryContainer = document.querySelector('#picks-history');
        const mobilePicksHistoryContainer = document.querySelector('#mobile-picks-history');
        const desktopPicksHistoryContainer = document.querySelector('#desktop-picks-history');
        const logoutButtonContainer = document.querySelector('#user-logged-in-view');
        const fixturesDisplayContainer = document.querySelector('#fixtures-display-container');
        const mobileFixturesDisplayContainer = document.querySelector('#mobile-fixtures-display-container');
        const gameweekNavigation = document.querySelector('#gameweek-navigation');
        const mobileGameweekNavigation = document.querySelector('#mobile-gameweek-navigation');

        if (logoutButtonContainer) logoutButtonContainer.style.display = 'block';
        if (gameweekNavigation) gameweekNavigation.style.display = 'block';
        if (mobileGameweekNavigation) mobileGameweekNavigation.style.display = 'block';

        try {
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            if (!settingsDoc.exists) {
                console.error("CRITICAL: Settings document not found!");
                return;
            }
            const settings = settingsDoc.data();
            const currentGameWeek = settings.active_gameweek;

            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Get user's edition from registration data
                const userEdition = this.getUserEdition(userData);
                const userRegisteredEditions = this.getUserRegisteredEditions(userData);
                
                // Show edition selection if user is registered for multiple editions
                this.setupEditionSelection(userData, userEdition, userRegisteredEditions, user.uid);
                
                // Update edition displays
                this.updateEditionDisplays(userEdition);
                
                // Update welcome messages for both desktop and mobile
                if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${userData.displayName}!`;
                if (mobileWelcomeMessage) mobileWelcomeMessage.textContent = `Welcome, ${userData.displayName}!`;
                
                // Display card status based on lives remaining
                this.updateLivesDisplay(userData, livesRemaining, mobileLivesRemaining, desktopLivesRemaining);

                // Render pick history for desktop, mobile, and legacy (only if containers exist)
                if (typeof renderPickHistory === 'function') {
                    if (picksHistoryContainer) {
                        await renderPickHistory(userData.picks || {}, picksHistoryContainer, user.uid, userData);
                    }
                    if (mobilePicksHistoryContainer) {
                        await renderPickHistory(userData.picks || {}, mobilePicksHistoryContainer, user.uid, userData);
                    }
                    if (desktopPicksHistoryContainer) {
                        await renderPickHistory(userData.picks || {}, desktopPicksHistoryContainer, user.uid, userData);
                    }
                }
                
                // Initialize gameweek navigation for both desktop and mobile
                if (typeof initializeGameweekNavigation === 'function') {
                    initializeGameweekNavigation(currentGameWeek, userData, user.uid);
                }
                if (typeof initializeMobileGameweekNavigation === 'function') {
                    initializeMobileGameweekNavigation(currentGameWeek, userData, user.uid);
                }
                
                // Check for auto-picks needed
                if (typeof checkAndAssignAutoPicks === 'function') {
                    checkAndAssignAutoPicks(userData, currentGameWeek, user.uid);
                }
                
                // Load fixtures for current gameweek to get deadline (with user data)
                if (typeof loadFixturesForDeadline === 'function') {
                    loadFixturesForDeadline(currentGameWeek, userData, user.uid);
                }
                
                // Load mobile fixtures for current gameweek
                if (typeof loadMobileFixturesForDeadline === 'function') {
                    loadMobileFixturesForDeadline(currentGameWeek, userData, user.uid);
                }
                
                // Update pick status headers for both desktop and mobile
                if (typeof updatePickStatusHeader === 'function') {
                    updatePickStatusHeader(currentGameWeek, userData, user.uid);
                }
                if (typeof updateMobilePickStatusHeader === 'function') {
                    updateMobilePickStatusHeader(currentGameWeek, userData, user.uid);
                }
                
                // Load player scores for current gameweek
                if (typeof loadPlayerScores === 'function') {
                    loadPlayerScores();
                }
                
                // Initialize enhanced vidiprinter
                if (typeof initializeEnhancedVidiprinter === 'function') {
                    initializeEnhancedVidiprinter();
                }
                
                // Start deadline checker
                if (typeof startDeadlineChecker === 'function') {
                    startDeadlineChecker();
                }
            } else {
                console.warn('User document not found for:', user.uid);
            }
        } catch (error) {
            console.error("Error rendering dashboard:", error);
        }
    }

    // Setup edition selection
    setupEditionSelection(userData, userEdition, userRegisteredEditions, userId) {
        if (userRegisteredEditions.length > 1) {
            const desktopContainer = document.getElementById('edition-selection-container');
            const mobileContainer = document.getElementById('mobile-edition-selection-container');
            const desktopSelector = document.getElementById('dashboard-edition-selector');
            const mobileSelector = document.getElementById('mobile-dashboard-edition-selector');
            
            if (desktopContainer && mobileContainer) {
                desktopContainer.style.display = 'block';
                mobileContainer.style.display = 'block';
                
                // Populate edition selectors
                if (desktopSelector && mobileSelector) {
                    desktopSelector.innerHTML = '';
                    mobileSelector.innerHTML = '';
                    
                    userRegisteredEditions.forEach(edition => {
                        const optionText = edition === 'test' ? 'Test Weeks' : `Edition ${edition}`;
                        const optionValue = edition;
                        
                        const desktopOption = document.createElement('option');
                        desktopOption.value = optionValue;
                        desktopOption.textContent = optionText;
                        if (edition === userEdition) {
                            desktopOption.selected = true;
                        }
                        desktopSelector.appendChild(desktopOption);
                        
                        const mobileOption = document.createElement('option');
                        mobileOption.value = optionValue;
                        mobileOption.textContent = optionText;
                        if (edition === userEdition) {
                            mobileOption.selected = true;
                        }
                        mobileSelector.appendChild(mobileOption);
                    });
                }
                
                // Add event listeners for save buttons
                const desktopSaveBtn = document.getElementById('save-edition-preference');
                const mobileSaveBtn = document.getElementById('mobile-save-edition-preference');
                
                if (desktopSaveBtn) {
                    desktopSaveBtn.onclick = () => {
                        if (typeof saveEditionPreference === 'function') {
                            saveEditionPreference(desktopSelector.value, userId);
                        }
                    };
                }
                if (mobileSaveBtn) {
                    mobileSaveBtn.onclick = () => {
                        if (typeof saveEditionPreference === 'function') {
                            saveEditionPreference(mobileSelector.value, userId);
                        }
                    };
                }
            }
        }
    }

    // Update edition displays
    updateEditionDisplays(userEdition) {
        document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
            if (el) {
                if (userEdition === 'test') {
                    el.textContent = 'Test Weeks';
                } else {
                    el.textContent = `Edition ${userEdition}`;
                }
            }
        });
    }

    // Update lives display
    updateLivesDisplay(userData, livesRemaining, mobileLivesRemaining, desktopLivesRemaining) {
        let cardDisplay = '';
        if (userData.lives === 2) {
            cardDisplay = '<p style="text-align: center; margin-top: 10px; color: #28a745; font-weight: bold;">All is well, you haven\'t got a card yet</p>';
        } else if (userData.lives === 1) {
            cardDisplay = '<img src="images/Yellow Card.png" alt="Yellow Card" style="width: 240px; height: 240px; display: block; margin: 0 auto; margin-top: 10px;">';
        } else if (userData.lives === 0) {
            cardDisplay = '<img src="images/redcard.png" alt="Red Card" style="width: 240px; height: 240px; display: block; margin: 0 auto; margin-top: 10px;">';
        }
        
        // Update lives remaining for desktop, mobile, and legacy
        if (livesRemaining) livesRemaining.innerHTML = cardDisplay;
        if (mobileLivesRemaining) mobileLivesRemaining.innerHTML = cardDisplay;
        if (desktopLivesRemaining) desktopLivesRemaining.innerHTML = cardDisplay;
    }

    // Get user's edition
    getUserEdition(userData) {
        if (userData.defaultEdition) {
            return userData.defaultEdition;
        }
        
        if (userData.registeredEditions && userData.registeredEditions.length > 0) {
            return userData.registeredEditions[0];
        }
        
        return 1; // Default to Edition 1
    }

    // Get user's registered editions
    getUserRegisteredEditions(userData) {
        if (userData.registeredEditions && Array.isArray(userData.registeredEditions)) {
            return userData.registeredEditions;
        }
        return [];
    }

    // Testimonial modal functionality
    initializeTestimonialModal() {
        // Create modal dynamically and append to document body
        let modal = document.getElementById('imageModal');
        let modalImg = document.getElementById('modalImage');
        let closeBtn = document.querySelector('.modal-close');
        
        // If modal doesn't exist, create it dynamically
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'modal';
            modal.style.cssText = 'display: none; position: fixed !important; z-index: 999999 !important; left: 0 !important; top: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.8) !important; backdrop-filter: blur(5px) !important;';
            
            closeBtn = document.createElement('span');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = 'position: absolute !important; top: -50px !important; right: 0 !important; color: white !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; padding: 0 !important; line-height: 1 !important; z-index: 1000000 !important;';
            
            modalImg = document.createElement('img');
            modalImg.className = 'modal-content';
            modalImg.id = 'modalImage';
            modalImg.style.cssText = 'position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; max-width: 90% !important; max-height: 90% !important; border-radius: 12px !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important; z-index: 1000001 !important;';
            
            modal.appendChild(closeBtn);
            modal.appendChild(modalImg);
            document.body.appendChild(modal);
        }
        
        const testimonialImages = document.querySelectorAll('.testimonial-image');
        
        // Add click event to all testimonial images
        testimonialImages.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = 'block';
                modalImg.src = this.src;
                modalImg.alt = this.alt;
            });
        });
        
        // Close modal when clicking the close button
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside the image
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }

    // Toggle testimonials
    toggleTestimonials() {
        const testimonials = document.getElementById('mobile-testimonials');
        const toggleIcon = document.querySelector('.toggle-icon');
        const toggleText = document.querySelector('.toggle-text');
        
        if (testimonials && toggleIcon && toggleText) {
            if (testimonials.style.display === 'block') {
                testimonials.style.display = 'none';
                toggleIcon.textContent = '▼';
                toggleText.textContent = 'What Our Players Say...';
            } else {
                testimonials.style.display = 'block';
                toggleIcon.textContent = '▲';
                toggleText.textContent = 'Hide Testimonials';
            }
        }
    }

    // Registration window display functionality
    async initializeRegistrationWindowDisplay() {
        await this.updateRegistrationWindowDisplay();
        // Update every minute
        setInterval(() => this.updateRegistrationWindowDisplay(), 60000);
    }

    async updateRegistrationWindowDisplay() {
        try {
            // Ensure database is available before proceeding
            if (!this.db) {
                console.warn('Database not available yet, skipping registration window display update');
                return;
            }
            
            const settingsDoc = await this.db.collection('settings').doc(`registration_edition_${window.currentActiveEdition || 1}`).get();
            if (!settingsDoc.exists) {
                this.hideRegistrationCountdowns();
                this.showRegisterButton(false);
                return;
            }

            const settings = settingsDoc.data();
            const now = new Date();
            
            // Check if registration is currently open
            if (typeof checkRegistrationWindow === 'function') {
                const isCurrentlyOpen = await checkRegistrationWindow();
                
                if (isCurrentlyOpen) {
                    // Registration is open - show countdown to end
                    const endDate = settings.endDate ? new Date(settings.endDate.toDate()) : null;
                    if (endDate) {
                        this.showRegistrationCountdown(endDate);
                    } else {
                        this.hideRegistrationCountdowns();
                    }
                    this.showRegisterButton(true);
                } else {
                    // Registration is closed - check for next window
                    const nextStartDate = settings.nextStartDate ? new Date(settings.nextStartDate.toDate()) : null;
                    if (nextStartDate && nextStartDate > now) {
                        this.showNextRegistrationCountdown(nextStartDate);
                    } else {
                        this.hideRegistrationCountdowns();
                    }
                    this.showRegisterButton(false);
                }
            }
        } catch (error) {
            console.error('Error updating registration window display:', error);
            this.hideRegistrationCountdowns();
            this.showRegisterButton(false);
        }
    }

    showRegistrationCountdown(endDate) {
        const countdownDiv = document.querySelector('#registration-countdown');
        const nextCountdownDiv = document.querySelector('#next-registration-countdown');
        const timerSpan = document.querySelector('#countdown-timer');
        
        if (countdownDiv && timerSpan) {
            countdownDiv.style.display = 'block';
            if (nextCountdownDiv) nextCountdownDiv.style.display = 'none';
            
            // Update countdown every second
            const updateCountdown = () => {
                const now = new Date();
                const timeLeft = endDate - now;
                
                if (timeLeft <= 0) {
                    // Registration window has ended
                    this.hideRegistrationCountdowns();
                    this.showRegisterButton(false);
                    // Refresh the display to check for next window
                    setTimeout(() => this.updateRegistrationWindowDisplay(), 1000);
                    return;
                }
                
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                
                let countdownText = '';
                if (days > 0) countdownText += `${days}d `;
                if (hours > 0 || days > 0) countdownText += `${hours}h `;
                if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `;
                countdownText += `${seconds}s`;
                
                timerSpan.textContent = countdownText;
            };
            
            updateCountdown();
            // Update every second
            setInterval(updateCountdown, 1000);
        }
    }

    showNextRegistrationCountdown(startDate) {
        const countdownDiv = document.querySelector('#registration-countdown');
        const nextCountdownDiv = document.querySelector('#next-registration-countdown');
        const nextTimerSpan = document.querySelector('#next-countdown-timer');
        
        if (nextCountdownDiv && nextTimerSpan) {
            nextCountdownDiv.style.display = 'block';
            if (countdownDiv) countdownDiv.style.display = 'none';
            
            // Update countdown every second
            const updateCountdown = () => {
                const now = new Date();
                const timeLeft = startDate - now;
                
                if (timeLeft <= 0) {
                    // Next registration window has started
                    this.hideRegistrationCountdowns();
                    // Refresh the display to check current window
                    setTimeout(() => this.updateRegistrationWindowDisplay(), 1000);
                    return;
                }
                
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                
                let countdownText = '';
                if (days > 0) countdownText += `${days}d `;
                if (hours > 0 || days > 0) countdownText += `${hours}h `;
                if (minutes > 0 || hours > 0 || days > 0) countdownText += `${minutes}m `;
                countdownText += `${seconds}s`;
                
                nextTimerSpan.textContent = countdownText;
            };
            
            updateCountdown();
            // Update every second
            setInterval(updateCountdown, 1000);
        }
    }

    hideRegistrationCountdowns() {
        const countdownDiv = document.querySelector('#registration-countdown');
        const nextCountdownDiv = document.querySelector('#next-registration-countdown');
        
        if (countdownDiv) countdownDiv.style.display = 'none';
        if (nextCountdownDiv) nextCountdownDiv.style.display = 'none';
    }

    showRegisterButton(show) {
        const registerButton = document.querySelector('#register-now-button');
        if (registerButton) {
            registerButton.style.display = show ? 'inline-block' : 'none';
        }
    }

    // Vidiprinter functionality
    initializeVidiprinter() {
        console.log('Initializing Vidiprinter...');
        const startBtn = document.querySelector('#start-vidiprinter-btn');
        const stopBtn = document.querySelector('#stop-vidiprinter-btn');
        const clearBtn = document.querySelector('#clear-vidiprinter-btn');
        const autoScrollBtn = document.querySelector('#auto-scroll-toggle');
        const compSelect = document.querySelector('#vidiprinter-comp');
        const refreshRateSelect = document.querySelector('#vidiprinter-refresh-rate');
        
        console.log('Vidiprinter elements found:', {
            startBtn: !!startBtn,
            stopBtn: !!stopBtn,
            clearBtn: !!clearBtn,
            autoScrollBtn: !!autoScrollBtn,
            compSelect: !!compSelect,
            refreshRateSelect: !!refreshRateSelect
        });

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startVidiprinter());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopVidiprinter());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearVidiprinterFeed());
        }
        
        if (autoScrollBtn) {
            autoScrollBtn.addEventListener('click', () => this.toggleAutoScroll());
        }
        
        if (compSelect) {
            compSelect.addEventListener('change', () => {
                if (this.isVidiprinterRunning) {
                    this.stopVidiprinter();
                    setTimeout(() => this.startVidiprinter(), 100);
                }
            });
        }
        
        if (refreshRateSelect) {
            refreshRateSelect.addEventListener('change', () => {
                if (this.isVidiprinterRunning) {
                    this.stopVidiprinter();
                    setTimeout(() => this.startVidiprinter(), 100);
                }
            });
        }
    }

    async startVidiprinter() {
        if (this.isVidiprinterRunning) {
            console.log('Vidiprinter is already running');
            return;
        }

        console.log('Starting vidiprinter...');
        this.isVidiprinterRunning = true;

        const startBtn = document.querySelector('#start-vidiprinter-btn');
        const stopBtn = document.querySelector('#stop-vidiprinter-btn');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        // Start the vidiprinter update loop
        this.vidiprinterInterval = setInterval(async () => {
            try {
                await this.performVidiprinterUpdate();
            } catch (error) {
                console.error('Error during vidiprinter update:', error);
            }
        }, 30000); // Update every 30 seconds

        // Perform initial update
        await this.performVidiprinterUpdate();
    }

    stopVidiprinter() {
        if (!this.isVidiprinterRunning) {
            console.log('Vidiprinter is not running');
            return;
        }

        console.log('Stopping vidiprinter...');
        this.isVidiprinterRunning = false;

        if (this.vidiprinterInterval) {
            clearInterval(this.vidiprinterInterval);
            this.vidiprinterInterval = null;
        }

        const startBtn = document.querySelector('#start-vidiprinter-btn');
        const stopBtn = document.querySelector('#stop-vidiprinter-btn');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }

    async performVidiprinterUpdate() {
        try {
            if (typeof fetchVidiprinterData === 'function') {
                const data = await fetchVidiprinterData();
                if (data && data.length > 0) {
                    this.processVidiprinterData(data);
                }
            }
        } catch (error) {
            console.error('Error performing vidiprinter update:', error);
        }
    }

    processVidiprinterData(vidiprinterEvents) {
        if (!Array.isArray(vidiprinterEvents)) {
            console.warn('Invalid vidiprinter data received:', vidiprinterEvents);
            return;
        }

        console.log(`Processing ${vidiprinterEvents.length} vidiprinter events`);

        vidiprinterEvents.forEach(event => {
            if (event && event.text) {
                this.addVidiprinterEntry(event.text, event.type || 'status');
            }
        });
    }

    addVidiprinterEntry(text, type = 'status') {
        const feed = document.querySelector('#vidiprinter-feed');
        if (!feed) {
            console.warn('Vidiprinter feed element not found');
            return;
        }

        const entry = document.createElement('div');
        entry.className = `vidiprinter-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString('en-GB', { 
            timeZone: 'Europe/London',
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        entry.innerHTML = `
            <span class="timestamp">${timestamp}</span>
            <span class="text">${text}</span>
        `;

        feed.appendChild(entry);

        // Auto-scroll if enabled
        if (this.autoScrollEnabled) {
            feed.scrollTop = feed.scrollHeight;
        }

        // Limit entries to prevent memory issues
        const maxEntries = 100;
        while (feed.children.length > maxEntries) {
            feed.removeChild(feed.firstChild);
        }
    }

    clearVidiprinterFeed() {
        const feed = document.querySelector('#vidiprinter-feed');
        if (feed) {
            feed.innerHTML = '';
        }
    }

    toggleAutoScroll() {
        this.autoScrollEnabled = !this.autoScrollEnabled;
        const autoScrollBtn = document.querySelector('#auto-scroll-toggle');
        if (autoScrollBtn) {
            autoScrollBtn.textContent = this.autoScrollEnabled ? 'Disable Auto-scroll' : 'Enable Auto-scroll';
        }
        
        if (this.autoScrollEnabled) {
            const feed = document.querySelector('#vidiprinter-feed');
            if (feed) {
                feed.scrollTop = feed.scrollHeight;
            }
        }
    }

    // Cleanup resources
    cleanup() {
        this.stopVidiprinter();
        if (this.vidiprinterInterval) {
            clearInterval(this.vidiprinterInterval);
            this.vidiprinterInterval = null;
        }
    }
}

// Export the UIManager class
export default UIManager;
