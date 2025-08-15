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
        
        const editionSelector = document.querySelector('#quick-edition-selector');
        if (!editionSelector) {
            console.log('Quick edition selector not found');
            return;
        }
        
        console.log('✅ Found edition selector:', editionSelector);
        console.log('🔍 Selector properties:', {
            disabled: editionSelector.disabled,
            style: editionSelector.style.cssText,
            className: editionSelector.className,
            type: editionSelector.type
        });
        
        // Remove any existing event listeners to prevent duplicates
        const newSelector = editionSelector.cloneNode(true);
        editionSelector.parentNode.replaceChild(newSelector, editionSelector);
        
        // Load available editions
        this.loadAvailableEditions();
        
        // Set up change handler
        newSelector.addEventListener('change', (e) => {
            console.log('🔄 Edition selector change event triggered');
            this.saveQuickEditionChange();
        });
        
        // Ensure the selector looks and behaves like a dropdown
        newSelector.style.appearance = 'auto';
        newSelector.style.webkitAppearance = 'auto';
        newSelector.style.mozAppearance = 'auto';
        newSelector.style.cursor = 'pointer';
        newSelector.style.pointerEvents = 'auto';
        newSelector.style.opacity = '1';
        newSelector.style.disabled = false;
        
        // Set current selection
        this.updateQuickEditionSelector();
        
        // Mark as initialized
        this.editionSelectorInitialized = true;
        
        console.log('✅ Quick edition selector setup complete');
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
            '#picks-gameweek-select',     // Picks tab
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
                    { id: 1, name: 'Edition 1', active: true },
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
            
        } catch (error) {
            console.error('❌ Error loading editions:', error);
        }
    }

    // Update quick edition selector
    updateQuickEditionSelector() {
        const editionSelector = document.querySelector('#quick-edition-selector');
        if (!editionSelector) return;
        
        editionSelector.value = this.currentActiveEdition;
        console.log(`✅ Updated edition selector to ${this.currentActiveEdition}`);
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
            
            // Ensure selector remains interactive and looks like a dropdown
            editionSelector.disabled = false;
            editionSelector.style.pointerEvents = 'auto';
            editionSelector.style.opacity = '1';
            editionSelector.style.cursor = 'pointer';
            editionSelector.style.appearance = 'auto';
            editionSelector.style.webkitAppearance = 'auto';
            editionSelector.style.mozAppearance = 'auto';
            editionSelector.style.backgroundImage = 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")';
            editionSelector.style.backgroundRepeat = 'no-repeat';
            editionSelector.style.backgroundPosition = 'right 8px center';
            editionSelector.style.backgroundSize = '12px auto';
            editionSelector.style.paddingRight = '30px';
            
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
        const editionDisplay = document.querySelector('#active-edition-display');
        if (editionDisplay) {
            editionDisplay.textContent = `Edition ${edition}`;
        }
        
        // Update any other edition-related displays
        const editionElements = document.querySelectorAll('[data-edition-display]');
        editionElements.forEach(element => {
            element.textContent = `Edition ${edition}`;
        });
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
                selector.style.backgroundImage = 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")';
                selector.style.backgroundRepeat = 'no-repeat';
                selector.style.backgroundPosition = 'right 8px center';
                selector.style.backgroundSize = '12px auto';
                selector.style.paddingRight = '30px';
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
    
    // Cleanup method
    cleanup() {
        console.log('🧹 Scheduling cleanup completed');
    }
}
