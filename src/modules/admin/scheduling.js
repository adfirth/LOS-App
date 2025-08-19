// Scheduling Module
// Handles gameweek management, deadlines, and competition settings

export class Scheduling {
    constructor(db) {
        this.db = db;
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
    }

    // Update current active edition
    updateCurrentActiveEdition(edition) {
        this.currentActiveEdition = edition;
        console.log(`Scheduling: Updated currentActiveEdition to ${edition}`);
    }

    // Update current active gameweek
    updateCurrentActiveGameweek(gameweek) {
        this.currentActiveGameweek = gameweek;
        console.log(`Scheduling: Updated currentActiveGameweek to ${gameweek}`);
    }

    // Setup quick edition selector
    setupQuickEditionSelector() {
        // Prevent multiple initializations
        if (this.editionSelectorInitialized) {
            console.log('🔄 Edition selector already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Setting up quick edition selector...');
        
        // Use a more robust approach - try multiple times if elements aren't found
        const setupElements = () => {
            const editionSelector = document.querySelector('#quick-edition-selector');
            const quickSaveEditionBtn = document.querySelector('#quick-save-edition-btn');
            
            if (!editionSelector) {
                console.log('❌ Quick edition selector not found, will retry...');
                return false;
            }
            
            if (!quickSaveEditionBtn) {
                console.log('❌ Quick save edition button not found, will retry...');
                return false;
            }
            
            console.log('✅ Found both elements');
            
            // Load available editions
            this.loadAvailableEditions();
            
            // Set up change handler for the selector
            editionSelector.addEventListener('change', (e) => {
                console.log('🔄 Edition selector change event triggered');
                
                // Reset Active Week to 1 when edition changes
                const newEdition = editionSelector.value;
                this.resetActiveWeekForNewEdition(newEdition);
                
                // Update Registration Window Status IMMEDIATELY for the new edition
                console.log(`🔧 Immediately updating registration window status for edition: ${newEdition}`);
                this.updateRegistrationWindowStatus(newEdition);
                
                // Save the edition change and then refresh statistics
                this.saveQuickEditionChange().then(() => {
                    // Update Registration Window Status AGAIN after saving to ensure consistency
                    console.log(`🔧 Updating registration window status again after save for edition: ${newEdition}`);
                    this.updateRegistrationWindowStatus(newEdition);
                    
                    // Refresh registration statistics AFTER the edition change is saved
                    if (window.adminManagementManager && window.adminManagementManager.refreshRegistrationStatistics) {
                        console.log('🔄 Refreshing registration statistics after edition change...');
                        window.adminManagementManager.refreshRegistrationStatistics();
                    }
                }).catch((error) => {
                    console.error('❌ Error saving edition change:', error);
                    // Even if save fails, we still want to update the display
                    this.updateRegistrationWindowStatus(newEdition);
                });
            });
            
            // Set up save button event listener
            console.log('🔧 Setting up save button event listener...');
            
            // Remove any existing event listeners
            const newButton = quickSaveEditionBtn.cloneNode(true);
            quickSaveEditionBtn.parentNode.replaceChild(newButton, quickSaveEditionBtn);
            
            // Get the new button reference
            const freshButton = document.querySelector('#quick-save-edition-btn');
            
            freshButton.addEventListener('click', (e) => {
                console.log('🔄 Quick save edition button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                // Show immediate feedback
                const originalText = freshButton.textContent;
                freshButton.textContent = 'Saving...';
                freshButton.disabled = true;
                
                // Call the save method
                this.saveQuickEditionChange().then(() => {
                    // Show success feedback
                    freshButton.textContent = 'Saved!';
                    freshButton.style.backgroundColor = '#28a745';
                    freshButton.style.color = 'white';
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        freshButton.textContent = originalText;
                        freshButton.style.backgroundColor = '';
                        freshButton.style.color = '';
                        freshButton.disabled = false;
                    }, 2000);
                }).catch((error) => {
                    // Show error feedback
                    freshButton.textContent = 'Error!';
                    freshButton.style.backgroundColor = '#dc3545';
                    freshButton.style.color = 'white';
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        freshButton.textContent = originalText;
                        freshButton.style.backgroundColor = '';
                        freshButton.style.color = '';
                        freshButton.disabled = false;
                    }, 3000);
                });
            });
            
            console.log('✅ Save button event listeners attached');
            
            // Also allow saving by pressing Enter in the selector
            editionSelector.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('🔄 Enter key pressed in edition selector');
                    this.saveQuickEditionChange();
                }
            });
            
            // Ensure the selector looks and behaves like a dropdown
            editionSelector.style.appearance = 'auto';
            editionSelector.style.webkitAppearance = 'auto';
            editionSelector.style.mozAppearance = 'auto';
            editionSelector.style.cursor = 'pointer';
            editionSelector.style.pointerEvents = 'auto';
            editionSelector.style.opacity = '1';
            editionSelector.disabled = false;
            
            // Remove any custom background image to avoid double arrows
            editionSelector.style.backgroundImage = 'none';
            editionSelector.style.backgroundRepeat = 'no-repeat';
            editionSelector.style.backgroundPosition = 'right 8px center';
            editionSelector.style.backgroundSize = '12px auto';
            editionSelector.style.paddingRight = '8px';
            
            // Ensure the save button is enabled and clickable
            quickSaveEditionBtn.disabled = false;
            quickSaveEditionBtn.style.pointerEvents = 'auto';
            quickSaveEditionBtn.style.opacity = '1';
            quickSaveEditionBtn.style.cursor = 'pointer';
            
            // Set current selection
            this.updateQuickEditionSelector();
            
            console.log('✅ Quick edition selector and save button setup complete');
            return true;
        };
        
        // Try to set up elements immediately
        if (!setupElements()) {
            // If elements aren't found, retry after a short delay
            console.log('🔄 Elements not found, retrying in 100ms...');
            setTimeout(() => {
                if (!setupElements()) {
                    console.log('🔄 Elements still not found, retrying in 500ms...');
                    setTimeout(() => {
                        if (!setupElements()) {
                            console.error('❌ Failed to find elements after multiple retries');
                        }
                    }, 500);
                }
            }, 100);
        }
        
        // Mark as initialized
        this.editionSelectorInitialized = true;
    }

    // Setup active gameweek selector
    setupActiveGameweekSelector() {
        console.log('🔧 Setting up active gameweek selector...');
        
        const gameweekSelector = document.querySelector('#active-gameweek-select');
        if (!gameweekSelector) {
            console.log('❌ Active gameweek selector not found - checking for alternatives...');
            
            // Try alternative selectors
            const alternativeSelectors = [
                '#active-gameweek-select',
                '#gameweek-select',
                'select[id*="gameweek"]',
                'select[id*="week"]'
            ];
            
            for (const selector of alternativeSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`✅ Found alternative selector: ${selector}`);
                    break;
                }
            }
            
            return;
        }
        
        console.log('✅ Found active gameweek selector:', gameweekSelector);
        
        // Load available gameweeks
        this.loadAvailableGameweeks();
        
        // Set up change handler
        gameweekSelector.addEventListener('change', (e) => this.handleGameweekChange(e));
        
        // Set current selection
        this.updateActiveGameweekSelector();
        
        console.log('✅ Active gameweek selector setup complete');
    }

    // Load available gameweeks
    async loadAvailableGameweeks() {
        try {
            const gameweekSelector = document.querySelector('#active-gameweek-select');
            if (!gameweekSelector) {
                console.log('❌ Gameweek selector not found in loadAvailableGameweeks');
                return;
            }
            
            console.log('🔧 Loading gameweeks into selector:', gameweekSelector);
            
            // Clear existing options
            gameweekSelector.innerHTML = '';
            console.log('✅ Cleared existing options');
            
            // Add gameweek options (1-10)
            for (let i = 1; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i.toString();
                option.textContent = `Week ${i}`;
                gameweekSelector.appendChild(option);
                console.log(`✅ Added option: Week ${i}`);
            }
            
            console.log(`✅ Loaded ${gameweekSelector.options.length} gameweek options`);
            console.log('🔍 Final selector HTML:', gameweekSelector.innerHTML);
            
        } catch (error) {
            console.error('❌ Error loading gameweeks:', error);
        }
    }

    // Update active gameweek selector
    updateActiveGameweekSelector() {
        const gameweekSelector = document.querySelector('#active-gameweek-select');
        if (!gameweekSelector) return;
        
        gameweekSelector.value = this.currentActiveGameweek;
        console.log(`✅ Updated gameweek selector to ${this.currentActiveGameweek}`);
    }

    // Handle gameweek change
    async handleGameweekChange(e) {
        const selectedGameweek = e.target.value;
        console.log('Gameweek selection changed to:', selectedGameweek);
        
        // Update current active gameweek
        this.currentActiveGameweek = selectedGameweek;
        
        // Update global variables
        if (window.currentActiveGameweek !== undefined) {
            window.currentActiveGameweek = selectedGameweek;
        }
        
        if (window.app && window.app.currentActiveGameweek !== undefined) {
            window.app.currentActiveGameweek = selectedGameweek;
        }
        
        // Update all other gameweek selectors
        this.setDefaultGameweekSelection();
        
        // Save the change to database
        await this.saveGameweekChange(selectedGameweek);
    }

    // Save gameweek change to database
    async saveGameweekChange(gameweek) {
        try {
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            let settings = {};
            
            if (settingsDoc.exists) {
                settings = settingsDoc.data();
            }
            
            settings.active_gameweek = gameweek;
            settings.last_updated = new Date();
            
            await this.db.collection('settings').doc('currentCompetition').set(settings);
            console.log(`✅ Gameweek change saved to database: ${gameweek}`);
            
        } catch (error) {
            console.error('❌ Error saving gameweek change:', error);
        }
    }

    // Set default gameweek selection across all selectors
    setDefaultGameweekSelection() {
        console.log('🔧 Setting default gameweek selection...');
        
        const gameweekSelectors = [
            '#gameweek-select',           // Fixtures tab
            '#score-gameweek-select',     // Scores tab

            '#standings-gameweek-select', // As It Stands tab
            '#history-gameweek-select',   // History tab
            '#import-gameweek-select',    // API Import section
            '#source-gameweek',           // Reallocate fixtures source
            '#target-gameweek',           // Reallocate fixtures target
            '#delete-gameweek'            // Delete fixtures
        ];
        
        gameweekSelectors.forEach(selectorId => {
            const selector = document.querySelector(selectorId);
            if (selector) {
                const optionExists = Array.from(selector.options).some(option => option.value === this.currentActiveGameweek);
                if (optionExists) {
                    selector.value = this.currentActiveGameweek;
                    console.log(`✅ Set ${selectorId} to default gameweek: ${this.currentActiveGameweek}`);
                    
                    // Trigger change event to ensure any listeners are notified
                    const event = new Event('change', { bubbles: true });
                    selector.dispatchEvent(event);
                } else {
                    console.log(`⚠️ Gameweek ${this.currentActiveGameweek} not available in ${selectorId}`);
                }
            }
        });
    }

    // Load available editions
    async loadAvailableEditions() {
        try {
            const editionSelector = document.querySelector('#quick-edition-selector');
            if (!editionSelector) return;
            
            // Get editions from settings
            const settingsDoc = await this.db.collection('settings').doc('editions').get();
            let editions = [];
            
            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                editions = settingsData.editions || [];
            }
            
            // If no editions in settings, create default ones
            if (editions.length === 0) {
                editions = [
                    { id: 1, name: 'Edition 1', active: true },
                    { id: 2, name: 'Edition 2', active: false },
                    { id: 3, name: 'Edition 3', active: false },
                    { id: 4, name: 'Edition 4', active: false },
                    { id: 'test', name: 'Test Weeks', active: false }
                ];
                
                // Save default editions
                await this.db.collection('settings').doc('editions').set({
                    editions,
                    lastUpdated: new Date()
                });
            } else {
                // Check if we need to add missing editions
                const requiredEditions = [
                    { id: 1, name: 'Edition 1', active: false },
                    { id: 2, name: 'Edition 2', active: false },
                    { id: 3, name: 'Edition 3', active: false },
                    { id: 4, name: 'Edition 4', active: false },
                    { id: 'test', name: 'Test Weeks', active: false }
                ];
                
                let needsUpdate = false;
                requiredEditions.forEach(required => {
                    const exists = editions.find(e => e.id === required.id);
                    if (!exists) {
                        editions.push(required);
                        needsUpdate = true;
                    }
                });
                
                if (needsUpdate) {
                    // Save updated editions
                    await this.db.collection('settings').doc('editions').set({
                        editions,
                        lastUpdated: new Date()
                    });
                    console.log('✅ Added missing editions to database');
                }
            }
            
            // Populate selector
            editionSelector.innerHTML = '';
            editions.forEach(edition => {
                const option = document.createElement('option');
                option.value = edition.id;
                option.textContent = edition.name;
                editionSelector.appendChild(option);
            });
            
            console.log(`✅ Loaded ${editions.length} editions`);
            
            // Load current active edition from database
            await this.loadCurrentActiveEdition();
            
        } catch (error) {
            console.error('❌ Error loading editions:', error);
        }
    }

    // Load current active edition from database
    async loadCurrentActiveEdition() {
        try {
            const currentEditionDoc = await this.db.collection('settings').doc('currentActiveEdition').get();
            
            if (currentEditionDoc.exists) {
                const data = currentEditionDoc.data();
                this.currentActiveEdition = data.edition || 1;
                console.log(`✅ Loaded current active edition: ${this.currentActiveEdition}`);
            } else {
                // Set default edition if none exists
                this.currentActiveEdition = 1;
                console.log('⚠️ No current active edition found, using default: 1');
                
                // Save default to database
                await this.db.collection('settings').doc('currentActiveEdition').set({
                    edition: 1,
                    lastUpdated: new Date()
                });
            }
            
            // Update the selector to reflect the loaded edition
            this.updateQuickEditionSelector();
            
        } catch (error) {
            console.error('❌ Error loading current active edition:', error);
            this.currentActiveEdition = 1;
        }
    }

    // Update quick edition selector
    updateQuickEditionSelector() {
        const editionSelector = document.querySelector('#quick-edition-selector');
        if (!editionSelector) return;
        
        editionSelector.value = this.currentActiveEdition;
        console.log(`✅ Updated edition selector to ${this.currentActiveEdition}`);
        
        // Update registration window status for the current edition
        console.log(`🔧 Updating registration window status for current edition: ${this.currentActiveEdition}`);
        this.updateRegistrationWindowStatus(this.currentActiveEdition);
    }

    // Force refresh registration window status
    async forceRefreshRegistrationWindowStatus() {
        console.log(`🔧 Force refreshing registration window status for edition: ${this.currentActiveEdition}`);
        await this.updateRegistrationWindowStatus(this.currentActiveEdition);
    }

    // Save quick edition change
    async saveQuickEditionChange() {
        try {
            const editionSelector = document.querySelector('#quick-edition-selector');
            if (!editionSelector) return;
            
            const newEdition = editionSelector.value;
            if (newEdition === this.currentActiveEdition) return;
            
            // Handle test edition specially
            const editionValue = newEdition === 'test' ? 'test' : parseInt(newEdition);
            
            console.log(`🔧 Changing active edition from ${this.currentActiveEdition} to ${editionValue}`);
            
            // Update local state
            this.currentActiveEdition = editionValue;
            
            // Update global state
            if (window.currentActiveEdition !== undefined) {
                window.currentActiveEdition = editionValue;
            }
            
            if (window.app) {
                window.app.currentActiveEdition = editionValue;
            }
            
            // Update settings in database
            await this.db.collection('settings').doc('currentActiveEdition').set({
                edition: editionValue,
                lastUpdated: new Date()
            });
            
            console.log(`✅ Active edition changed to ${editionValue}`);
            
            // Reset Active Week to 1 for the new edition
            this.resetActiveWeekForNewEdition(editionValue);
            
            // Ensure selector remains interactive and looks like a dropdown
            editionSelector.disabled = false;
            editionSelector.style.pointerEvents = 'auto';
            editionSelector.style.opacity = '1';
            editionSelector.style.cursor = 'pointer';
            editionSelector.style.appearance = 'auto';
            editionSelector.style.webkitAppearance = 'auto';
            editionSelector.style.mozAppearance = 'auto';
            
            // Remove any custom background image to avoid double arrows
            editionSelector.style.backgroundImage = 'none';
            editionSelector.style.backgroundRepeat = 'no-repeat';
            editionSelector.style.backgroundPosition = 'right 8px center';
            editionSelector.style.backgroundSize = '12px auto';
            editionSelector.style.paddingRight = '8px';
            
            console.log('✅ Edition selector remains interactive after change');
            
            // Log selector state after change
            console.log('🔍 Selector state after change:', {
                disabled: editionSelector.disabled,
                style: editionSelector.style.cssText,
                className: editionSelector.className,
                value: editionSelector.value
            });
            
            // Set up periodic check to ensure selector stays interactive
            this.ensureSelectorInteractive(editionSelector);
            
            // Refresh displays
            this.refreshDisplaysAfterEditionChange();
            
        } catch (error) {
            console.error('❌ Error saving edition change:', error);
            alert('Error changing edition: ' + error.message);
        }
    }

    // Refresh displays after edition change
    refreshDisplaysAfterEditionChange() {
        console.log('🔧 Refreshing displays after edition change...');
        
        // Update edition display
        this.updateActiveEditionDisplay(this.currentActiveEdition);
        
        // Refresh registration statistics to reflect the new edition
        if (window.adminManagementManager && window.adminManagementManager.refreshRegistrationStatistics) {
            console.log('🔄 Refreshing registration statistics after edition change...');
            window.adminManagementManager.refreshRegistrationStatistics();
        }
        
        // Refresh any standings displays
        const standingsContainer = document.querySelector('#standings-table-container');
        if (standingsContainer && standingsContainer.innerHTML !== '') {
            // Trigger standings refresh if standings are currently displayed
            const asItStandsBtn = document.querySelector('#as-it-stands-btn');
            if (asItStandsBtn) {
                asItStandsBtn.click();
            }
        }
        
        // Refresh any other relevant displays
        this.refreshOtherDisplays();
        
        console.log('✅ Displays refreshed after edition change');
    }

    // Update active edition display
    updateActiveEditionDisplay(edition) {
        // Update the quick edition selector to reflect the new edition
        const quickEditionSelector = document.querySelector('#quick-edition-selector');
        if (quickEditionSelector) {
            quickEditionSelector.value = edition;
        }
        
        // Update any other edition-related displays
        const editionElements = document.querySelectorAll('[data-edition-display]');
        editionElements.forEach(element => {
            element.textContent = `Edition ${edition}`;
        });
        
        console.log(`✅ Updated edition display to: ${edition}`);
    }

    // Refresh other displays
    refreshOtherDisplays() {
        // This method would refresh any other displays that depend on the current edition
        // Implementation depends on your specific UI requirements
        console.log('Refreshing other displays...');
    }

    // Initialize competition settings
    initializeCompetitionSettings() {
        if (this.competitionSettingsInitialized) {
            console.log('Competition settings already initialized, skipping...');
            return;
        }
        
        console.log('Initializing competition settings...');
        this.competitionSettingsInitialized = true;
        
        // Load current settings and update display
        this.loadCurrentCompetitionSettings();
        
        // Initialize competition settings functionality
        this.setupCompetitionSettingsUI();
    }

    // Load current competition settings
    async loadCurrentCompetitionSettings() {
        try {
            console.log('Loading current competition settings...');
            
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                this.updateCompetitionSettingsDisplay(settings);
                console.log('✅ Competition settings loaded');
            } else {
                console.log('No competition settings found, using defaults');
                this.updateCompetitionSettingsDisplay(this.getDefaultCompetitionSettings());
            }
            
        } catch (error) {
            console.error('❌ Error loading competition settings:', error);
            this.updateCompetitionSettingsDisplay(this.getDefaultCompetitionSettings());
        }
    }

    // Get default competition settings
    getDefaultCompetitionSettings() {
        return {
            tiebreak_enabled: false,
            registration_open: false,
            registration_start_date: null,
            registration_end_date: null,
            current_gameweek: 1,
            total_gameweeks: 10,
            lives_per_player: 2
        };
    }

    // Update competition settings display
    updateCompetitionSettingsDisplay(settings) {
        // Update form fields with current settings
        const tiebreakCheckbox = document.querySelector('#tiebreak-enabled');
        if (tiebreakCheckbox) {
            tiebreakCheckbox.checked = settings.tiebreak_enabled || false;
        }
        
        const registrationCheckbox = document.querySelector('#registration-open');
        if (registrationCheckbox) {
            registrationCheckbox.checked = settings.registration_open || false;
        }
        
        const startDateInput = document.querySelector('#registration-start-date');
        if (startDateInput && settings.registration_start_date) {
            startDateInput.value = settings.registration_start_date;
        }
        
        const endDateInput = document.querySelector('#registration-end-date');
        if (endDateInput && settings.registration_end_date) {
            endDateInput.value = settings.registration_end_date;
        }
        
        const currentGameweekInput = document.querySelector('#current-gameweek');
        if (currentGameweekInput) {
            currentGameweekInput.value = settings.current_gameweek || 1;
        }
        
        const totalGameweeksInput = document.querySelector('#total-gameweeks');
        if (totalGameweeksInput) {
            totalGameweeksInput.value = settings.total_gameweeks || 10;
        }
        
        const livesPerPlayerInput = document.querySelector('#lives-per-player');
        if (livesPerPlayerInput) {
            livesPerPlayerInput.value = settings.lives_per_player || 2;
        }
    }

    // Setup competition settings UI
    setupCompetitionSettingsUI() {
        console.log('🔧 Setting up competition settings UI...');
        
        // Set up form submission
        const form = document.querySelector('#competition-settings-form');
        if (form) {
            form.addEventListener('submit', (e) => this.saveCompetitionSettings(e));
        }
        
        // Set up active gameweek selector
        this.setupActiveGameweekSelector();
        
        // Set up quick edition selector
        this.setupQuickEditionSelector();
        
        // Set up individual field change handlers
        this.setupSettingsFieldHandlers();
        

        
        console.log('✅ Competition settings UI setup complete');
    }

    // Setup settings field handlers
    setupSettingsFieldHandlers() {
        // Tiebreak enabled checkbox
        const tiebreakCheckbox = document.querySelector('#tiebreak-enabled');
        if (tiebreakCheckbox) {
            tiebreakCheckbox.addEventListener('change', () => this.handleTiebreakChange());
        }
        
        // Registration open checkbox
        const registrationCheckbox = document.querySelector('#registration-open');
        if (registrationCheckbox) {
            registrationCheckbox.addEventListener('change', () => this.handleRegistrationChange());
        }
        
        // Date inputs
        const startDateInput = document.querySelector('#registration-start-date');
        if (startDateInput) {
            startDateInput.addEventListener('change', () => this.handleDateChange());
        }
        
        const endDateInput = document.querySelector('#registration-end-date');
        if (endDateInput) {
            endDateInput.addEventListener('change', () => this.handleDateChange());
        }
    }
    
    
    
    // Reset Active Week when edition changes
    resetActiveWeekForNewEdition(newEdition) {
        console.log(`🔧 Resetting Active Week for new edition: ${newEdition}`);
        
        // Reset to week 1 for the new edition
        this.currentActiveGameweek = '1';
        
        // Update global state
        if (window.currentActiveGameweek !== undefined) {
            window.currentActiveGameweek = '1';
        }
        
        if (window.app) {
            window.app.currentActiveGameweek = '1';
        }
        
        // Update the Active Week selector
        const activeGameweekSelector = document.querySelector('#active-gameweek-select');
        if (activeGameweekSelector) {
            activeGameweekSelector.value = '1';
            console.log('✅ Reset Active Week selector to Week 1');
        }
        
        // Update the Competition Settings current gameweek field
        const currentGameweekInput = document.querySelector('#current-gameweek');
        if (currentGameweekInput) {
            currentGameweekInput.value = '1';
            console.log('✅ Reset Competition Settings current gameweek to 1');
        }
        
        // Update all other gameweek selectors to maintain consistency
        this.setDefaultGameweekSelection();
        
        console.log(`✅ Active Week reset to 1 for edition: ${newEdition}`);
    }
    
    // Handle tiebreak change
    handleTiebreakChange() {
        const tiebreakCheckbox = document.querySelector('#tiebreak-enabled');
        if (tiebreakCheckbox) {
            const enabled = tiebreakCheckbox.checked;
            console.log(`Tiebreak ${enabled ? 'enabled' : 'disabled'}`);
            
            // Update UI elements that depend on tiebreak
            this.updateTiebreakUI(enabled);
        }
    }

    // Handle registration change
    handleRegistrationChange() {
        const registrationCheckbox = document.querySelector('#registration-open');
        if (registrationCheckbox) {
            const open = registrationCheckbox.checked;
            console.log(`Registration ${open ? 'opened' : 'closed'}`);
            
            // Update UI elements that depend on registration status
            this.updateRegistrationUI(open);
        }
    }

    // Handle date change
    handleDateChange() {
        const startDateInput = document.querySelector('#registration-start-date');
        const endDateInput = document.querySelector('#registration-end-date');
        
        if (startDateInput && endDateInput) {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                if (start >= end) {
                    alert('Registration start date must be before end date');
                    endDateInput.value = '';
                }
            }
        }
    }

    // Update tiebreak UI
    updateTiebreakUI(enabled) {
        const tiebreakElements = document.querySelectorAll('[data-tiebreak-dependent]');
        tiebreakElements.forEach(element => {
            if (enabled) {
                element.style.display = '';
                element.disabled = false;
            } else {
                element.style.display = 'none';
                element.disabled = true;
            }
        });
    }

    // Update registration UI
    updateRegistrationUI(open) {
        const registrationElements = document.querySelectorAll('[data-registration-dependent]');
        registrationElements.forEach(element => {
            if (open) {
                element.style.display = '';
                element.disabled = false;
            } else {
                element.style.display = 'none';
                element.disabled = true;
            }
        });
    }

    // Save competition settings
    async saveCompetitionSettings(event) {
        event.preventDefault();
        
        try {
            console.log('🔧 Saving competition settings...');
            
            const settings = {
                tiebreak_enabled: document.querySelector('#tiebreak-enabled')?.checked || false,
                registration_open: document.querySelector('#registration-open')?.checked || false,
                registration_start_date: document.querySelector('#registration-start-date')?.value || null,
                registration_end_date: document.querySelector('#registration-end-date')?.value || null,
                current_gameweek: parseInt(document.querySelector('#current-gameweek')?.value) || 1,
                total_gameweeks: parseInt(document.querySelector('#total-gameweeks')?.value) || 10,
                lives_per_player: parseInt(document.querySelector('#lives-per-player')?.value) || 2,
                lastUpdated: new Date()
            };
            
            // Validate settings
            if (settings.current_gameweek < 1 || settings.current_gameweek > settings.total_gameweeks) {
                alert('Current gameweek must be between 1 and total gameweeks');
                return;
            }
            
            if (settings.lives_per_player < 1 || settings.lives_per_player > 5) {
                alert('Lives per player must be between 1 and 5');
                return;
            }
            
            // Save to database
            await this.db.collection('settings').doc('currentCompetition').set(settings);
            
            console.log('✅ Competition settings saved successfully');
            alert('Competition settings saved successfully!');
            
            // Update local state
            this.currentActiveGameweek = settings.current_gameweek.toString();
            
            // Update global state
            if (window.currentActiveGameweek !== undefined) {
                window.currentActiveGameweek = settings.current_gameweek.toString();
            }
            
            if (window.app) {
                window.app.currentActiveGameweek = settings.current_gameweek.toString();
            }
            
            // Refresh displays
            this.refreshDisplaysAfterSettingsChange();
            
            // Auto-load fixtures for the new active edition and gameweek
            this.autoLoadFixturesAfterSettingsChange();
            
        } catch (error) {
            console.error('❌ Error saving competition settings:', error);
            alert('Error saving settings: ' + error.message);
        }
    }

    // Refresh displays after settings change
    refreshDisplaysAfterSettingsChange() {
        console.log('🔧 Refreshing displays after settings change...');
        
        // Update gameweek display
        this.updateGameweekDisplay();
        
        // Update other relevant displays
        this.updateOtherDisplays();
        
        console.log('✅ Displays refreshed after settings change');
    }

    // Update gameweek display
    updateGameweekDisplay() {
        const gameweekDisplay = document.querySelector('#current-gameweek-display');
        if (gameweekDisplay) {
            gameweekDisplay.textContent = `Game Week ${this.currentActiveGameweek}`;
        }
        
        // Update any other gameweek-related displays
        const gameweekElements = document.querySelectorAll('[data-gameweek-display]');
        gameweekElements.forEach(element => {
            element.textContent = `Game Week ${this.currentActiveGameweek}`;
        });
    }

    // Update other displays
    updateOtherDisplays() {
        // This method would update any other displays that depend on the settings
        // Implementation depends on your specific UI requirements
        console.log('Updating other displays...');
    }

    // Auto-load fixtures after settings change
    async autoLoadFixturesAfterSettingsChange() {
        console.log('🔧 Auto-loading fixtures after settings change...');
        
        try {
            // Check if we're on the fixtures tab
            const fixturesTab = document.querySelector('#fixtures-tab');
            if (!fixturesTab || fixturesTab.style.display === 'none') {
                console.log('Not on fixtures tab, skipping auto-load');
                return;
            }
            
            // Check if fixtures manager is available
            if (window.app && window.app.fixturesManager) {
                console.log('✅ Fixtures manager found, auto-loading fixtures...');
                
                // Update the edition selector to match the new active edition
                const quickEditionSelector = document.querySelector('#quick-edition-selector');
                if (quickEditionSelector) {
                    quickEditionSelector.value = this.currentActiveEdition;
                    console.log(`Updated edition selector to: ${this.currentActiveEdition}`);
                }
                
                // Update the gameweek selector to match the new active gameweek
                const gameweekSelect = document.querySelector('#gameweek-select');
                if (gameweekSelect) {
                    gameweekSelect.value = this.currentActiveGameweek;
                    console.log(`Updated gameweek selector to: ${this.currentActiveGameweek}`);
                }
                
                // Auto-load fixtures for the new edition and gameweek
                await window.app.fixturesManager.loadFixturesForGameweek();
                
                console.log('✅ Fixtures auto-loaded successfully');
                
                // Show a subtle notification that fixtures were updated
                this.showFixturesAutoLoadNotification();
                
            } else {
                console.log('⚠️ Fixtures manager not available, cannot auto-load fixtures');
            }
            
        } catch (error) {
            console.error('❌ Error auto-loading fixtures:', error);
        }
    }

    // Show notification that fixtures were auto-loaded
    showFixturesAutoLoadNotification() {
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.className = 'fixtures-auto-load-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            Fixtures updated for Edition ${this.currentActiveEdition}, Game Week ${this.currentActiveGameweek}
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--teal-light), var(--teal-medium));
            color: var(--teal-secondary);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--teal-primary);
            box-shadow: 0 4px 12px rgba(94, 165, 152, 0.2);
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Set default selection
    setDefaultSelection() {
        console.log('🔧 Setting default selection...');
        
        // Set default edition
        this.currentActiveEdition = 1;
        
        // Set default gameweek
        this.currentActiveGameweek = '1';
        
        // Update global state
        if (window.currentActiveEdition !== undefined) {
            window.currentActiveEdition = 1;
        }
        
        if (window.currentActiveGameweek !== undefined) {
            window.currentActiveGameweek = '1';
        }
        
        if (window.app) {
            window.app.currentActiveEdition = 1;
            window.app.currentActiveGameweek = '1';
        }
        
        console.log('✅ Default selection set');
    }

    // Ensure selector stays interactive
    ensureSelectorInteractive(selector) {
        if (!selector) return;
        
        // Check every 100ms for 2 seconds to ensure selector stays interactive
        let checkCount = 0;
        const maxChecks = 20;
        
        const checkInterval = setInterval(() => {
            checkCount++;
            
            // Log detailed selector state
            const computedStyle = window.getComputedStyle(selector);
            const isDisabled = selector.disabled;
            const pointerEvents = selector.style.pointerEvents || computedStyle.pointerEvents;
            const opacity = selector.style.opacity || computedStyle.opacity;
            const cursor = selector.style.cursor || computedStyle.cursor;
            const display = selector.style.display || computedStyle.display;
            const visibility = selector.style.visibility || computedStyle.visibility;
            const appearance = selector.style.appearance || computedStyle.appearance;
            const webkitAppearance = selector.style.webkitAppearance || computedStyle.webkitAppearance;
            const mozAppearance = selector.style.mozAppearance || computedStyle.mozAppearance;
            
            console.log(`🔍 Selector state check ${checkCount}:`);
            console.log(`  - disabled: ${isDisabled}`);
            console.log(`  - pointerEvents: ${pointerEvents}`);
            console.log(`  - opacity: ${opacity}`);
            console.log(`  - cursor: ${cursor}`);
            console.log(`  - display: ${display}`);
            console.log(`  - visibility: ${visibility}`);
            console.log(`  - appearance: ${appearance}`);
            console.log(`  - webkitAppearance: ${webkitAppearance}`);
            console.log(`  - mozAppearance: ${mozAppearance}`);
            console.log(`  - style.cssText: ${selector.style.cssText}`);
            console.log(`  - className: ${selector.className}`);
            console.log(`  - tagName: ${selector.tagName}`);
            console.log(`  - type: ${selector.type}`);
            console.log(`  - computed classes: ${selector.classList.toString()}`);
            console.log(`  - parent element: ${selector.parentElement?.tagName} ${selector.parentElement?.className}`);
            
            if (selector.disabled || selector.style.pointerEvents === 'none' || selector.style.opacity === '0') {
                console.log(`🔄 Selector became non-interactive (check ${checkCount}), re-enabling...`);
                selector.disabled = false;
                selector.style.pointerEvents = 'auto';
                selector.style.opacity = '1';
                selector.style.cursor = 'pointer';
            }
            
            // Force dropdown appearance
            if (selector.style.appearance !== 'auto' || selector.style.webkitAppearance !== 'auto') {
                console.log(`🔄 Forcing dropdown appearance (check ${checkCount})...`);
                selector.style.appearance = 'auto';
                selector.style.webkitAppearance = 'auto';
                selector.style.mozAppearance = 'auto';
                
                // Remove any custom background image to avoid double arrows
                selector.style.backgroundImage = 'none';
                selector.style.backgroundRepeat = 'no-repeat';
                selector.style.backgroundPosition = 'right 8px center';
                selector.style.backgroundSize = '12px auto';
                selector.style.paddingRight = '8px';
            }
            
            // Check if selector is being styled as a button (which would cause visual locking)
            const hasButtonLikeStyling = selector.style.backgroundColor === 'var(--alty-yellow)' ||
                                       selector.style.textAlign === 'center' ||
                                       selector.style.borderRadius === '8px' ||
                                       selector.style.borderRadius === '12px' ||
                                       selector.style.borderRadius === '16px' ||
                                       selector.style.borderRadius === '20px' ||
                                       selector.style.borderRadius === '24px';
            
            if (hasButtonLikeStyling) {
                console.log(`⚠️ Selector has button-like styling (check ${checkCount}), resetting to dropdown...`);
                                 console.log(`🔍 Button-like properties detected:`, {
                     backgroundColor: selector.style.backgroundColor,
                     textAlign: selector.style.textAlign,
                     borderRadius: selector.style.borderRadius
                 });
                 // Reset to standard dropdown styling
                 selector.style.borderRadius = '4px';
                 selector.style.backgroundColor = 'white';
                 selector.style.textAlign = 'left';
                 selector.style.border = '1px solid #ccc';
                 selector.style.padding = '4px 30px 4px 8px';
                 selector.style.cursor = 'pointer';
                 selector.style.appearance = 'auto';
                 selector.style.webkitAppearance = 'auto';
                 selector.style.mozAppearance = 'auto';
            }
            
            // Check if element is still a select element
            if (selector.tagName !== 'SELECT') {
                console.log(`⚠️ Element is no longer a SELECT element! Current tagName: ${selector.tagName}`);
                // Try to find the original select element
                const originalSelector = document.querySelector('#quick-edition-selector');
                if (originalSelector && originalSelector.tagName === 'SELECT') {
                    console.log('🔄 Found original SELECT element, switching back...');
                    selector = originalSelector;
                }
            }
            
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.log('✅ Selector interactive state monitoring completed');
            }
        }, 100);
    }

    // Update Registration Window Status based on selected edition
    async updateRegistrationWindowStatus(edition) {
        try {
            console.log(`🔧 Updating Registration Window Status for edition: ${edition}`);
            
            // Get the registration window status container
            const statusContainer = document.querySelector('#registration-window-status');
            if (!statusContainer) {
                console.log('⚠️ Registration window status container not found');
                return;
            }

            // Clear any existing fallback message first
            const existingFallback = document.querySelector('#registration-fallback-message');
            if (existingFallback) {
                existingFallback.remove();
            }

            // Hide any existing countdown sections
            this.hideRegistrationCountdowns();

            // Get registration settings for the selected edition
            const settingsDoc = await this.db.collection('settings').doc(`registration_edition_${edition}`).get();
            
            if (!settingsDoc.exists) {
                console.log(`⚠️ No registration settings found for edition ${edition}`);
                // Show a fallback message instead of hiding everything
                this.showFallbackRegistrationMessage(edition, 'No registration settings configured');
                return;
            }

            const settings = settingsDoc.data();
            const now = new Date();

            // Check if registration is enabled
            if (!settings.enabled) {
                console.log(`⚠️ Registration is disabled for edition ${edition}`);
                this.hideRegistrationCountdowns();
                this.showFallbackRegistrationMessage(edition, 'Registration is currently disabled');
                return;
            }

            // Check if registration is currently open
            if (settings.startDate && settings.endDate) {
                const startDate = new Date(settings.startDate.toDate());
                const endDate = new Date(settings.endDate.toDate());

                if (now >= startDate && now <= endDate) {
                    // Registration is currently open
                    console.log(`✅ Registration is currently open for edition ${edition}`);
                    this.showCurrentRegistrationCountdown(endDate);
                    this.hideNextRegistrationCountdown();
                } else if (now < startDate) {
                    // Registration hasn't started yet
                    console.log(`⏰ Registration hasn't started yet for edition ${edition}`);
                    this.hideCurrentRegistrationCountdown();
                    this.showNextRegistrationCountdown(startDate);
                } else {
                    // Registration has ended
                    console.log(`❌ Registration period has ended for edition ${edition}`);
                    this.hideRegistrationCountdowns();
                    this.showFallbackRegistrationMessage(edition, 'Registration period has ended');
                }
            } else {
                // Registration is enabled but dates are not configured
                console.log(`⚠️ Registration is enabled but dates are not configured for edition ${edition}`);
                this.hideRegistrationCountdowns();
                this.showFallbackRegistrationMessage(edition, 'Registration is enabled but dates are not configured');
            }

            // Add a visual indicator that the status was updated
            const updateIndicator = document.createElement('div');
            updateIndicator.style.cssText = 'background: #28a745; color: white; padding: 0.5rem; margin-top: 0.5rem; border-radius: 4px; font-size: 0.8rem; text-align: center;';
            updateIndicator.textContent = `✅ Status updated for Edition ${edition} at ${new Date().toLocaleTimeString()}`;
            
            // Remove any existing indicators
            const existingIndicators = statusContainer.querySelectorAll('[data-update-indicator]');
            existingIndicators.forEach(indicator => indicator.remove());
            
            // Add the new indicator
            updateIndicator.setAttribute('data-update-indicator', 'true');
            statusContainer.appendChild(updateIndicator);
            
            // Remove the indicator after 5 seconds
            setTimeout(() => {
                if (updateIndicator.parentNode) {
                    updateIndicator.remove();
                }
            }, 5000);

        } catch (error) {
            console.error('Error updating registration window status:', error);
            this.showFallbackRegistrationMessage(edition, 'Error loading registration settings');
        }
    }

    // Show current registration countdown
    showCurrentRegistrationCountdown(endDate) {
        const currentCountdown = document.querySelector('#registration-countdown');
        const nextCountdown = document.querySelector('#next-registration-countdown');
        
        if (currentCountdown) {
            currentCountdown.style.display = 'block';
            this.startCountdownTimer(endDate, '#countdown-timer');
        }
        
        if (nextCountdown) {
            nextCountdown.style.display = 'none';
        }
    }

    // Show next registration countdown
    showNextRegistrationCountdown(startDate) {
        const currentCountdown = document.querySelector('#registration-countdown');
        const nextCountdown = document.querySelector('#next-registration-countdown');
        
        if (nextCountdown) {
            nextCountdown.style.display = 'block';
            this.startCountdownTimer(startDate, '#next-countdown-timer');
        }
        
        if (currentCountdown) {
            currentCountdown.style.display = 'none';
        }
    }

    // Hide all registration countdowns
    hideRegistrationCountdowns() {
        const currentCountdown = document.querySelector('#registration-countdown');
        const nextCountdown = document.querySelector('#next-registration-countdown');
        
        if (currentCountdown) currentCountdown.style.display = 'none';
        if (nextCountdown) nextCountdown.style.display = 'none';
    }

    // Hide current registration countdown
    hideCurrentRegistrationCountdown() {
        const currentCountdown = document.querySelector('#registration-countdown');
        if (currentCountdown) currentCountdown.style.display = 'none';
    }

    // Hide next registration countdown
    hideNextRegistrationCountdown() {
        const nextCountdown = document.querySelector('#next-registration-countdown');
        if (nextCountdown) nextCountdown.style.display = 'none';
    }

    // Start countdown timer
    startCountdownTimer(targetDate, timerElementId) {
        const timerElement = document.querySelector(timerElementId);
        if (!timerElement) return;

        const updateTimer = () => {
            const now = new Date();
            const timeLeft = targetDate - now;

            if (timeLeft <= 0) {
                timerElement.textContent = 'Time expired';
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            if (hours > 0) timeString += `${hours}h `;
            if (minutes > 0) timeString += `${minutes}m `;
            timeString += `${seconds}s`;

            timerElement.textContent = timeString;
        };

        // Update immediately and then every second
        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        // Store the interval ID so we can clear it later if needed
        timerElement.dataset.countdownInterval = interval;
    }
    
    // Cleanup method
    cleanup() {
        console.log('🧹 Scheduling cleanup completed');
    }

    // Show fallback message when no registration settings are found or registration is disabled
    showFallbackRegistrationMessage(edition, message) {
        const currentCountdown = document.querySelector('#registration-countdown');
        const nextCountdown = document.querySelector('#next-registration-countdown');
        
        // Hide both countdown sections
        if (currentCountdown) currentCountdown.style.display = 'none';
        if (nextCountdown) nextCountdown.style.display = 'none';
        
        // Create or update fallback message
        let fallbackMessage = document.querySelector('#registration-fallback-message');
        if (!fallbackMessage) {
            fallbackMessage = document.createElement('div');
            fallbackMessage.id = 'registration-fallback-message';
            fallbackMessage.style.cssText = 'padding: 1rem; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; margin-top: 1rem;';
            
            const statusContainer = document.querySelector('#registration-window-status');
            if (statusContainer) {
                statusContainer.appendChild(fallbackMessage);
            }
        }
        
        fallbackMessage.innerHTML = `
            <h5 style="color: #6c757d; margin-bottom: 0.5rem;">Registration Status for Edition ${edition}</h5>
            <p style="color: #6c757d; margin-bottom: 0.5rem; font-size: 0.9rem;">
                <strong>Status:</strong> ${message}
            </p>
            <p style="color: #6c757d; font-size: 0.8rem; margin: 0;">
                ${message === 'Registration is currently disabled' ? 
                    'To enable registration, check the "Enable Registration" checkbox in the Competition Settings tab.' :
                    'Registration settings need to be configured in the admin panel for this edition.'
                }
            </p>
        `;
        fallbackMessage.style.display = 'block';
    }
}
