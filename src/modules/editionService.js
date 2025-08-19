// Firebase is initialized globally in firebase-init.js
// No need to import - db is available as window.db

/**
 * EditionService - Manages user's active edition and available editions
 */
class EditionService {
    constructor() {
        this.currentUserEdition = null;
        this.availableEditions = [];
        this.editionSelectorElement = null;
        console.log('🔧 EditionService: Constructor called');
    }

    /**
     * Initialize the service with user data
     */
    async initializeWithUser(userData, userId) {
        console.log('🔧 EditionService: Initializing with user data:', { userId, userData });
        
        if (!userData || !userData.registrations) {
            console.log('🔧 EditionService: No user data or registrations found');
            return;
        }

        // Get the user's preferred edition from their profile
        const userProfileRef = window.db.collection('users').doc(userId);
        const userProfileDoc = await userProfileRef.get();
        
        if (userProfileDoc.exists) {
            const userProfile = userProfileDoc.data();
            this.currentUserEdition = userProfile.preferredEdition || this.getDefaultEdition(userData);
            console.log('🔧 EditionService: User preferred edition from profile:', this.currentUserEdition);
        } else {
            this.currentUserEdition = this.getDefaultEdition(userData);
            console.log('🔧 EditionService: No user profile found, using default edition:', this.currentUserEdition);
        }

        // Get available editions
        this.availableEditions = await this.getUserAvailableEditions(userData, this.currentUserEdition);
        console.log('🔧 EditionService: Available editions:', this.availableEditions);

        // If user has multiple editions and no preferred edition set, set the first one
        if (this.availableEditions.length > 1 && !this.currentUserEdition) {
            this.currentUserEdition = this.availableEditions[0].key;
            console.log('🔧 EditionService: Setting first available edition as default:', this.currentUserEdition);
        }

        console.log('🔧 EditionService: Initialization complete. Current edition:', this.currentUserEdition);
        
        // Update all active edition displays after initialization
        this.updateAllActiveEditionDisplays();
    }

    /**
     * Get default edition from user registrations
     */
    getDefaultEdition(userData) {
        if (!userData || !userData.registrations) {
            return null;
        }

        // Find the first edition the user is registered for
        for (const [editionKey, isRegistered] of Object.entries(userData.registrations)) {
            if (isRegistered) {
                const editionNumber = editionKey.replace('edition', '');
                console.log('🔧 EditionService: Default edition found:', editionNumber);
                return editionNumber;
            }
        }

        return null;
    }

    /**
     * Create the edition selector in the specified container
     */
    async createEditionSelector(userData, userId, containerSelector) {
        console.log('🔧 EditionService: Creating edition selector in container:', containerSelector);
        
        // Handle both desktop and mobile containers
        // Enhanced mobile detection for devices like OnePlus 12
        const isMobile = containerSelector === '#mobile-edition-selector-container';
        
        // Additional mobile detection for devices that might not be caught by CSS media queries
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isOnePlus = userAgent.includes('oneplus') || userAgent.includes('one plus');
        const isHighResMobile = window.innerWidth <= 1440 && isMobileDevice; // OnePlus 12 and similar devices
        
        console.log('🔧 EditionService: Enhanced mobile detection:', {
            containerSelector,
            isMobile,
            userAgent: userAgent.substring(0, 100) + '...',
            isMobileDevice,
            isOnePlus,
            isHighResMobile,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        });
        const desktopContainer = document.querySelector('#edition-selector-container');
        const mobileContainer = document.querySelector('#mobile-edition-selector-container');
        
        console.log('🔧 EditionService: Mobile detection:', { isMobile, containerSelector });
        console.log('🔧 EditionService: Containers found:', { 
            desktopContainer: !!desktopContainer, 
            mobileContainer: !!mobileContainer 
        });
        console.log('🔧 EditionService: Container selector passed:', containerSelector);
        console.log('🔧 EditionService: Mobile container element:', mobileContainer);
        console.log('🔧 EditionService: Desktop container element:', desktopContainer);
        
        // Use the appropriate container based on the selector
        let container;
        if (isMobile) {
            container = mobileContainer;
            console.log('🔧 EditionService: Using mobile container');
        } else {
            container = desktopContainer;
            console.log('🔧 EditionService: Using desktop container');
        }
        
        if (!container) {
            console.error('❌ Edition selector container not found:', containerSelector);
            return;
        }
        
        // Check if we already have an edition selector in this container
        const existingSelector = isMobile ? 
            container.querySelector('#mobile-dashboard-edition-selector') : 
            container.querySelector('#dashboard-edition-selector');
        if (existingSelector) {
            console.log('🔧 EditionService: Existing edition selector found, removing old one...');
            existingSelector.remove();
        }
        
        console.log('🔧 EditionService: Container found:', container);
        console.log('🔧 EditionService: Container innerHTML before:', container.innerHTML.substring(0, 100) + '...');

        // Get available editions for this user
        const availableEditions = await this.getUserAvailableEditions(userData, this.currentUserEdition);
        console.log('🔧 EditionService: Available editions:', availableEditions);
        console.log('🔧 EditionService: Available editions length:', availableEditions.length);
        console.log('🔧 EditionService: Current user edition:', this.currentUserEdition);

        if (availableEditions.length <= 1) {
            console.log('🔧 EditionService: User only has one edition, showing status only');
            // Instead of hiding completely, show a status display
            const statusHTML = `
                <div class="edition-selector-wrapper ${isMobile ? 'mobile-edition-selector' : 'desktop-edition-selector'}" style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #155724; font-size: ${isMobile ? '1rem' : '1.1rem'};">Current Edition:</h4>
                    <div style="padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.9rem; color: #155724; border-left: 3px solid #28a745;">
                        <strong>${this.getEditionDisplayName(this.currentUserEdition)}</strong>
                    </div>
                    <p style="margin: 0.5rem 0 0 0; font-size: ${isMobile ? '0.85rem' : '0.9rem'}; color: #6c757d;">
                        You are registered for this edition only.
                    </p>
                </div>
            `;
            
            container.innerHTML = statusHTML;
            container.style.display = 'block';
            return;
        }

        // Create the edition selector HTML based on whether it's mobile or desktop
        let selectorHTML;
        if (isMobile) {
            // Mobile Edition Selector
            selectorHTML = `
                <div class="edition-selector-wrapper mobile-edition-selector" style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #155724; font-size: 1rem;">Select Active Edition:</h4>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <select id="mobile-dashboard-edition-selector" style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; background: white;">
                            ${availableEditions.map(edition => {
                                const selected = edition.key === this.currentUserEdition ? 'selected' : '';
                                return `<option value="${edition.key}" ${selected}>${edition.label}</option>`;
                            }).join('')}
                        </select>
                        <button id="mobile-save-edition-preference" style="width: 100%; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: bold;">Save Edition</button>
                    </div>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #6c757d;">
                        You can change your preferred edition at any time. This affects which fixtures and scores you see.
                    </p>
                    <div id="mobile-edition-status" style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85rem; color: #6c757d;">
                        Current edition: <strong>${this.getEditionDisplayName(this.currentUserEdition)}</strong>
                    </div>
                </div>
            `;
        } else {
            // Desktop Edition Selector
            selectorHTML = `
                <div class="edition-selector-wrapper desktop-edition-selector" style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #155724; font-size: 1.1rem;">Select Active Edition:</h4>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <select id="dashboard-edition-selector" style="padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; min-width: 200px; background: white;">
                            ${availableEditions.map(edition => {
                                const selected = edition.key === this.currentUserEdition ? 'selected' : '';
                                console.log(`🔧 EditionService: Creating option for edition ${edition.key} (${edition.label}) - selected: ${selected}`);
                                return `<option value="${edition.key}" ${selected}>${edition.label}</option>`;
                            }).join('')}
                        </select>
                        <button id="save-edition-preference" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;">Save Edition</button>
                    </div>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #6c757d;">
                        You can change your preferred edition at any time. This affects which fixtures and scores you see.
                    </p>
                    <div id="edition-status" style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85rem; color: #6c757d;">
                        Current edition: <strong>${this.getEditionDisplayName(this.currentUserEdition)}</strong>
                    </div>
                </div>
            `;
        }
        
        console.log('🔧 EditionService: Generated selector HTML:', selectorHTML);

        // Clear the container first
        container.innerHTML = '';
        
        // Create the DOM elements properly instead of using innerHTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = selectorHTML;
        
        // Move the elements from temp div to container
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }
        
        // Show the container since it now has content
        container.style.display = 'block';
        
        // Debug: Check if mobile edition selector was created
        if (isMobile) {
            const mobileSelect = container.querySelector('#mobile-dashboard-edition-selector');
            const mobileButton = container.querySelector('#mobile-save-edition-preference');
            console.log('🔧 EditionService: Mobile edition selector created:', {
                container: !!container,
                select: !!mobileSelect,
                button: !!mobileButton,
                selectId: mobileSelect ? mobileSelect.id : 'not found',
                buttonId: mobileButton ? mobileButton.id : 'not found',
                containerHTML: container.innerHTML.substring(0, 200) + '...'
            });
            
            // Add test click handlers for debugging
            if (mobileSelect) {
                mobileSelect.addEventListener('click', (e) => {
                    console.log('🔧 EditionService: MOBILE SELECT CLICKED!', e);
                });
                mobileSelect.addEventListener('touchstart', (e) => {
                    console.log('🔧 EditionService: MOBILE SELECT TOUCHED!', e);
                });
            }
            
            if (mobileButton) {
                mobileButton.addEventListener('click', (e) => {
                    console.log('🔧 EditionService: MOBILE BUTTON CLICKED!', e);
                });
                mobileButton.addEventListener('touchstart', (e) => {
                    console.log('🔧 EditionService: MOBILE BUTTON TOUCHED!', e);
                });
            }
        } else {
            console.log('🔧 EditionService: Desktop edition selector created (not mobile)');
        }
        

        
        console.log('🔧 EditionService: Container HTML set and displayed');
        
        // Update the status display
        this.updateEditionStatusDisplay();
        
        // Add a mutation observer to detect if something else modifies our select element
        const selectElement = container.querySelector('#dashboard-edition-selector');
        const currentEdition = this.currentUserEdition; // Store current edition for use in callbacks
        if (selectElement) {
            // Make the select element read-only to prevent external modification
            Object.defineProperty(selectElement, 'innerHTML', {
                get: function() {
                    return this._innerHTML || '';
                },
                set: function(value) {
                    // Only allow setting if it's our own restoration code
                    if (this._isRestoring) {
                        this._innerHTML = value;
                        return;
                    }
                    
                    // Block external modifications
                    console.log('🔧 EditionService: BLOCKED external innerHTML modification:', value);
                    console.log('🔧 EditionService: Stack trace:', new Error().stack);
                    
                    // Restore our options immediately
                    this._isRestoring = true;
                    this.innerHTML = '';
                    availableEditions.forEach(edition => {
                        const option = document.createElement('option');
                        option.value = edition.key;
                        option.textContent = edition.label;
                        if (edition.key === currentEdition) {
                            option.selected = true;
                        }
                        this.appendChild(option);
                    });
                    this._isRestoring = false;
                }
            });
        }
        
        // Set up event listeners for the edition selector
        this.setupEditionSelectorEventListeners(availableEditions, isMobile);
        
        console.log('🔧 EditionService: Edition selector creation complete');
    }

    /**
     * Create the global edition selector for the player dashboard
     */
    async createGlobalEditionSelector(userData, userId) {
        console.log('🔧 EditionService: Creating global edition selector');
        
        const globalContainer = document.querySelector('#global-edition-selector');
        if (!globalContainer) {
            console.error('❌ Global edition selector container not found');
            return;
        }

        // Get available editions for this user
        const availableEditions = await this.getUserAvailableEditions(userData, this.currentUserEdition);
        console.log('🔧 EditionService: Available editions for global selector:', availableEditions);

        if (availableEditions.length <= 1) {
            console.log('🔧 EditionService: User only has one edition, hiding global selector');
            globalContainer.style.display = 'none';
            return;
        }

        // Show the global selector
        globalContainer.style.display = 'block';

        // Populate the dropdown
        const dropdown = globalContainer.querySelector('#global-edition-selector-dropdown');
        if (dropdown) {
            dropdown.innerHTML = availableEditions.map(edition => {
                const selected = edition.key === this.currentUserEdition ? 'selected' : '';
                return `<option value="${edition.key}" ${selected}>${edition.label}</option>`;
            }).join('');
        }

        // Update the status display
        this.updateGlobalEditionStatus();

        // Set up event listeners
        this.setupGlobalEditionSelectorEventListeners(availableEditions);

        console.log('🔧 EditionService: Global edition selector created successfully');
    }

    /**
     * Update the edition selector (e.g., when user data changes)
     */
    async updateEditionSelector(userData, userId) {
        console.log('🔧 EditionService: Updating edition selector');
        await this.createEditionSelector(userData, userId);
    }

    /**
     * Set the user's preferred edition
     */
    async setUserEdition(userId, edition) {
        console.log('🔧 EditionService: Setting user edition:', { userId, edition });
        
        try {
            // Update the user's profile in Firestore
            const userProfileRef = window.db.collection('users').doc(userId);
            await userProfileRef.update({
                preferredEdition: edition,
                lastUpdated: new Date()
            });
            
            // Update local state
            this.currentUserEdition = edition;
            
            // Update the status display
            this.updateEditionStatusDisplay();
            
            // Update all active edition displays across the dashboard
            this.updateAllActiveEditionDisplays();

            console.log('🔧 EditionService: Edition updated successfully');
            return true;
        } catch (error) {
            console.error('❌ EditionService: Error updating edition:', error);
            throw error;
        }
    }

    /**
     * Get the current user edition
     */
    getCurrentUserEdition() {
        return this.currentUserEdition;
    }

    /**
     * Refresh the page content when edition changes
     */
    async refreshPageContent(newEdition) {
        console.log('🔧 EditionService: Refreshing page content for edition:', newEdition);
        
        try {
            // Get the current gameweek from the fixtures display
            const currentGameweekElement = document.querySelector('#current-gameweek-display');
            let currentGameweek = 1; // Default to gameweek 1
            
            if (currentGameweekElement) {
                const gameweekText = currentGameweekElement.textContent;
                const match = gameweekText.match(/Game Week (\d+)/);
                if (match) {
                    currentGameweek = parseInt(match[1]);
                }
            }
            
            console.log('🔧 EditionService: Current gameweek detected:', currentGameweek);
            
            // Update the current user edition
            this.currentUserEdition = newEdition;
            
            // Reload fixtures for the current gameweek (both desktop and mobile)
            if (window.loadFixturesForDeadline && typeof window.loadFixturesForDeadline === 'function') {
                console.log('🔧 EditionService: Calling loadFixturesForDeadline with gameweek:', currentGameweek);
                await window.loadFixturesForDeadline(currentGameweek);
            } else {
                console.log('🔧 EditionService: loadFixturesForDeadline function not available');
            }
            
            // Reload mobile fixtures for the current gameweek
            if (window.loadMobileFixturesForDeadline && typeof window.loadMobileFixturesForDeadline === 'function') {
                console.log('🔧 EditionService: Calling loadMobileFixturesForDeadline with gameweek:', currentGameweek);
                await window.loadMobileFixturesForDeadline(currentGameweek);
            } else {
                console.log('🔧 EditionService: loadMobileFixturesForDeadline function not available');
            }
            
            console.log('🔧 EditionService: Page content refresh complete');
        } catch (error) {
            console.error('❌ EditionService: Error refreshing page content:', error);
        }
    }

    /**
     * Get the display name for an edition
     */
    getEditionDisplayName(edition) {
        if (edition === 'test') {
            return 'Test Weeks';
        }
        if (edition == 1) { // Use == to handle both string and number
            console.log(`🔧 EditionService: Returning 'Edition 1' for edition: ${edition}`);
            return 'Edition 1';
        }
        
        const result = `Edition ${edition}`;
        console.log(`🔧 EditionService: Returning '${result}' for edition: ${edition}`);
        return result;
    }

    /**
     * Clear current edition (for logout)
     */
    clearCurrentEdition() {
        this.currentUserEdition = null;
        this.availableEditions = [];
        this.editionSelectorElement = null;
        console.log('🔧 EditionService: Current edition cleared');
    }

    // Get user's available editions (synchronous version)
    getUserAvailableEditions(userData, currentEdition = null) {
        if (!userData || !userData.registrations) {
            return [];
        }

        const availableEditions = [];
        
        console.log('🔧 EditionService: getUserAvailableEditions - userData.registrations:', userData.registrations);
        
        // Check each possible edition
        Object.keys(userData.registrations).forEach(editionKey => {
            if (userData.registrations[editionKey]) {
                const editionNumber = editionKey.replace('edition', '');
                console.log(`🔧 EditionService: Processing edition key: ${editionKey} -> editionNumber: ${editionNumber}`);
                
                const displayName = this.getEditionDisplayName(editionNumber);
                console.log(`🔧 EditionService: Display name for ${editionNumber}: ${displayName}`);
                
                availableEditions.push({
                    key: editionNumber,
                    label: displayName,
                    displayName: displayName
                });
            }
        });

        console.log('🔧 EditionService: Final available editions:', availableEditions);
        return availableEditions;
    }

    // Set up event listeners for the edition selector
    setupEditionSelectorEventListeners(availableEditions, isMobile) {
        console.log('🔧 EditionService: Setting up event listeners for user:', availableEditions);
        
        // Get both desktop and mobile elements
        const desktopSelect = document.querySelector('#dashboard-edition-selector');
        const mobileSelect = document.querySelector('#mobile-dashboard-edition-selector');
        const desktopSaveButton = document.querySelector('#save-edition-preference');
        const mobileSaveButton = document.querySelector('#mobile-save-edition-preference');
        
        console.log('🔧 EditionService: Found desktop select:', !!desktopSelect);
        console.log('🔧 EditionService: Found mobile select:', !!mobileSelect);
        console.log('🔧 EditionService: Found desktop save button:', !!desktopSaveButton);
        console.log('🔧 EditionService: Found mobile save button:', !!mobileSaveButton);
        
        // Set up event listeners for both selectors
        [desktopSelect, mobileSelect].forEach((selectElement, index) => {
            if (!selectElement) {
                console.log(`🔧 EditionService: Select element ${index === 0 ? 'desktop' : 'mobile'} not found, skipping...`);
                return;
            }
            
            const isMobile = index === 1;
            const saveButton = isMobile ? mobileSaveButton : desktopSaveButton;
            const selectorType = isMobile ? 'mobile' : 'desktop';
            
            console.log(`🔧 EditionService: Setting up ${selectorType} edition selector event listeners`);
            
            // Store initial value to detect changes
            const initialValue = selectElement.value;
            console.log(`🔧 EditionService: Initial ${selectorType} select value:`, initialValue);
            
            // Add change event listener
            selectElement.addEventListener('change', async (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} CHANGE EVENT FIRED!`);
                console.log(`🔧 EditionService: ${selectorType} event details:`, {
                    type: e.type,
                    isTrusted: e.isTrusted,
                    target: e.target,
                    targetValue: e.target.value,
                    targetSelectedIndex: e.target.selectedIndex,
                    bubbles: e.bubbles,
                    cancelable: e.cancelable,
                    initialValue: initialValue,
                    valueChanged: e.target.value !== initialValue
                });
                
                const newEdition = e.target.value;
                console.log(`🔧 EditionService: ${selectorType} edition changed to:`, newEdition);
                
                try {
                    await this.setUserEdition(userId, newEdition);
                    console.log(`🔧 EditionService: ${selectorType} edition updated successfully`);
                    
                    // Refresh the page content
                    this.refreshPageContent(newEdition);
                } catch (error) {
                    console.error(`❌ EditionService: Error updating ${selectorType} edition:`, error);
                }
            });
            
            // Add other event listeners for debugging
            selectElement.addEventListener('input', (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} INPUT EVENT FIRED!`);
            });
            
            selectElement.addEventListener('click', (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} CLICK EVENT FIRED!`);
            });
            
            selectElement.addEventListener('mousedown', (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} MOUSEDOWN EVENT FIRED!`);
            });
            
            selectElement.addEventListener('focus', (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} FOCUS EVENT FIRED!`);
            });
            
            selectElement.addEventListener('blur', (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} BLUR EVENT FIRED!`);
            });
            
            selectElement.addEventListener('keydown', (e) => {
                console.log(`🔧 EditionService: ${selectorType.toUpperCase()} KEYDOWN EVENT FIRED!`);
            });
            
            // Add periodic monitoring of the select value
            let lastKnownValue = selectElement.value;
            const valueMonitor = setInterval(() => {
                const currentValue = selectElement.value;
                if (currentValue !== lastKnownValue) {
                    console.log(`🔧 EditionService: ${selectorType.toUpperCase()} VALUE CHANGE DETECTED via monitoring!`, {
                        previousValue: lastKnownValue,
                        currentValue: currentValue,
                        initialValue: initialValue,
                        timestamp: new Date().toISOString()
                    });
                    lastKnownValue = currentValue;
                    
                    if (currentValue !== initialValue) {
                        console.log(`🔧 EditionService: Triggering change handler for ${selectorType} monitored change...`);
                        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }, 1000);
            
            selectElement._valueMonitor = valueMonitor;
        });
        
        // Set up save button event listeners
        [desktopSaveButton, mobileSaveButton].forEach((saveButton, index) => {
            if (!saveButton) {
                console.log(`🔧 EditionService: Save button ${index === 0 ? 'desktop' : 'mobile'} not found, skipping...`);
                return;
            }
            
            const isMobile = index === 1;
            const selectorType = isMobile ? 'mobile' : 'desktop';
            const selectElement = isMobile ? mobileSelect : desktopSelect;
            
            console.log(`🔧 EditionService: Setting up ${selectorType} save button event listener`);
            
            saveButton.addEventListener('click', async () => {
                if (selectElement) {
                    const newEdition = selectElement.value;
                    console.log(`🔧 EditionService: ${selectorType} save button clicked for edition:`, newEdition);
                    
                    try {
                        await this.setUserEdition(userId, newEdition);
                        console.log(`🔧 EditionService: ${selectorType} edition saved successfully`);
                        
                        // Show success message
                        saveButton.textContent = 'Saved!';
                        saveButton.style.background = '#28a745';
                        setTimeout(() => {
                            saveButton.textContent = 'Save Edition';
                            saveButton.style.background = '#007bff';
                        }, 2000);
                        
                        // Refresh the page content
                        this.refreshPageContent(newEdition);
                    } catch (error) {
                        console.error(`❌ EditionService: Error saving ${selectorType} edition:`, error);
                        saveButton.textContent = 'Error!';
                        saveButton.style.background = '#dc3545';
                        setTimeout(() => {
                            saveButton.textContent = 'Save Edition';
                            saveButton.style.background = '#007bff';
                        }, 2000);
                    }
                } else {
                    console.error(`❌ EditionService: ${selectorType} select element not found when save button clicked`);
                }
            });
            
            // Enable save button when select changes
            if (selectElement) {
                selectElement.addEventListener('change', (e) => {
                    console.log(`🔧 EditionService: ${selectorType} save button change handler triggered`);
                    saveButton.textContent = 'Save Edition';
                    saveButton.style.background = '#007bff';
                    saveButton.style.color = '#fff';
                });
            }
        });
        
        console.log('🔧 EditionService: Event listeners setup complete');
    }

    /**
     * Update the edition status display
     */
    updateEditionStatusDisplay() {
        const statusElement = document.querySelector('#edition-status');
        const mobileStatusElement = document.querySelector('#mobile-edition-status');
        
        if (statusElement) {
            statusElement.innerHTML = `Current edition: <strong>${this.getEditionDisplayName(this.currentUserEdition)}</strong>`;
        }
        
        if (mobileStatusElement) {
            mobileStatusElement.innerHTML = `Current edition: <strong>${this.getEditionDisplayName(this.currentUserEdition)}</strong>`;
        }
    }

    /**
     * Update the global edition status display
     */
    updateGlobalEditionStatus() {
        const globalStatusElement = document.querySelector('#global-edition-status');
        if (globalStatusElement) {
            globalStatusElement.innerHTML = `Current edition: <strong>${this.getEditionDisplayName(this.currentUserEdition)}</strong>`;
        }
    }

    /**
     * Update all active edition displays across the dashboard
     */
    updateAllActiveEditionDisplays() {
        const editionDisplayName = this.getEditionDisplayName(this.currentUserEdition);
        console.log('🔧 EditionService: Updating all active edition displays to:', editionDisplayName);
        console.log('🔧 EditionService: Current user edition:', this.currentUserEdition);
        
        // Update desktop active edition displays
        const desktopActiveEdition = document.querySelector('#desktop-active-edition');
        const desktopScoresActiveEdition = document.querySelector('#desktop-scores-active-edition');
        const mobileActiveEdition = document.querySelector('#mobile-active-edition');
        const mobileScoresActiveEdition = document.querySelector('#mobile-scores-active-edition');
        
        console.log('🔧 EditionService: Found elements:', {
            desktopActiveEdition: !!desktopActiveEdition,
            desktopScoresActiveEdition: !!desktopScoresActiveEdition,
            mobileActiveEdition: !!mobileActiveEdition,
            mobileScoresActiveEdition: !!mobileScoresActiveEdition
        });
        
        if (desktopActiveEdition) {
            desktopActiveEdition.textContent = editionDisplayName;
            console.log('✅ Updated desktop-active-edition to:', editionDisplayName);
        } else {
            console.log('❌ desktop-active-edition element not found');
        }
        
        if (desktopScoresActiveEdition) {
            desktopScoresActiveEdition.textContent = editionDisplayName;
            console.log('✅ Updated desktop-scores-active-edition to:', editionDisplayName);
        } else {
            console.log('❌ desktop-scores-active-edition element not found');
        }
        
        if (mobileActiveEdition) {
            mobileActiveEdition.textContent = editionDisplayName;
            console.log('✅ Updated mobile-active-edition to:', editionDisplayName);
        } else {
            console.log('❌ mobile-active-edition element not found');
        }
        
        if (mobileScoresActiveEdition) {
            mobileScoresActiveEdition.textContent = editionDisplayName;
            console.log('✅ Updated mobile-scores-active-edition to:', editionDisplayName);
        } else {
            console.log('❌ mobile-scores-active-edition element not found');
        }
        
        // Also update any other edition displays that might exist
        const allEditionDisplays = document.querySelectorAll('[id*="active-edition"], [id*="edition-display"]');
        console.log('🔧 EditionService: Found additional edition displays:', allEditionDisplays.length);
        allEditionDisplays.forEach(element => {
            if (element.id.includes('active-edition') || element.id.includes('edition-display')) {
                element.textContent = editionDisplayName;
                console.log(`✅ Updated ${element.id} to:`, editionDisplayName);
            }
        });
    }

    /**
     * Set up event listeners for the global edition selector
     */
    setupGlobalEditionSelectorEventListeners(availableEditions) {
        console.log('🔧 EditionService: Setting up global edition selector event listeners');
        
        const dropdown = document.querySelector('#global-edition-selector-dropdown');
        const saveButton = document.querySelector('#global-save-edition-btn');
        
        if (!dropdown || !saveButton) {
            console.error('❌ Global edition selector elements not found');
            return;
        }

        // Handle edition selection change
        dropdown.addEventListener('change', (e) => {
            console.log('🔧 EditionService: Global edition selector changed to:', e.target.value);
            saveButton.textContent = 'Save Edition';
            saveButton.style.background = '#007bff';
            saveButton.style.color = '#fff';
        });

        // Handle save button click
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const selectedEdition = dropdown.value;
            console.log('🔧 EditionService: Global save button clicked for edition:', selectedEdition);
            
            try {
                // Save the edition preference to the user's profile
                const userRef = window.db.collection('users').doc(window.authManager?.currentUser?.uid);
                await userRef.update({
                    preferredEdition: selectedEdition
                });
                
                console.log('✅ EditionService: Edition preference saved to database');
                
                // Update the current edition
                this.currentUserEdition = selectedEdition;
                
                // Update the scores manager's edition to match
                this.updateScoresManagerEdition();
                
                // Update all displays
                this.updateAllActiveEditionDisplays();
                this.updateGlobalEditionStatus();
                
                // Show success message
                saveButton.textContent = 'Saved!';
                saveButton.style.background = '#28a745';
                saveButton.style.color = '#fff';
                
                // Refresh all dashboard content
                await this.refreshAllDashboardContent(selectedEdition);
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    saveButton.textContent = 'Save Edition';
                    saveButton.style.background = '#007bff';
                    saveButton.style.color = '#fff';
                }, 2000);
                
            } catch (error) {
                console.error('❌ EditionService: Error saving edition preference:', error);
                saveButton.textContent = 'Error!';
                saveButton.style.background = '#dc3545';
                saveButton.style.color = '#fff';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    saveButton.textContent = 'Save Edition';
                    saveButton.style.background = '#007bff';
                    saveButton.style.color = '#fff';
                }, 2000);
            }
        });
        
        console.log('🔧 EditionService: Global edition selector event listeners setup complete');
    }

    /**
     * Update the scores manager's currentActiveEdition to match the current user edition
     */
    updateScoresManagerEdition() {
        if (window.app && window.app.scoresManager) {
            // Update the scores manager's currentActiveEdition
            window.app.scoresManager.currentActiveEdition = this.currentUserEdition;
            console.log('🔧 EditionService: Updated scores manager currentActiveEdition to:', this.currentUserEdition);
            
            // Also update the liveScoring component if it exists
            if (window.app.scoresManager.liveScoring) {
                window.app.scoresManager.liveScoring.currentActiveEdition = this.currentUserEdition;
                console.log('🔧 EditionService: Updated liveScoring currentActiveEdition to:', this.currentUserEdition);
            }
            
            // Update the historyManager if it exists
            if (window.app.scoresManager.historyManager) {
                window.app.scoresManager.historyManager.currentActiveEdition = this.currentUserEdition;
                console.log('🔧 EditionService: Updated historyManager currentActiveEdition to:', this.currentUserEdition);
            }
            
            // Update the statisticsEngine if it exists
            if (window.app.scoresManager.statisticsEngine) {
                window.app.scoresManager.statisticsEngine.currentActiveEdition = this.currentUserEdition;
                console.log('🔧 EditionService: Updated statisticsEngine currentActiveEdition to:', this.currentUserEdition);
            }
        } else {
            console.log('🔧 EditionService: Scores manager not available for edition update');
        }
        
        // Also update the game logic manager's active edition
        if (window.app && window.app.gameLogicManager) {
            window.app.gameLogicManager.setActiveEdition(this.currentUserEdition);
            console.log('🔧 EditionService: Updated game logic manager currentActiveEdition to:', this.currentUserEdition);
        } else {
            console.log('🔧 EditionService: Game logic manager not available for edition update');
        }
    }

    /**
     * Refresh all dashboard content when edition changes
     */
    async refreshAllDashboardContent(newEdition) {
        console.log('🔧 EditionService: Refreshing all dashboard content for edition:', newEdition);
        
        try {
            // Get the current gameweek from the fixtures display
            const currentGameweekElement = document.querySelector('#current-gameweek-display');
            let currentGameweek = 1; // Default to gameweek 1
            
            if (currentGameweekElement) {
                const gameweekText = currentGameweekElement.textContent;
                const match = gameweekText.match(/Game Week (\d+)/);
                if (match) {
                    currentGameweek = parseInt(match[1]);
                }
            }
            
            console.log('🔧 EditionService: Current gameweek detected:', currentGameweek);
            
            // Update the current user edition
            this.currentUserEdition = newEdition;
            
            // Update the scores manager's edition to match
            this.updateScoresManagerEdition();
            
            // Get fresh user data to ensure we have the latest picks for the new edition
            let currentUser = null;
            if (window.authManager && window.authManager.currentUser) {
                currentUser = window.authManager.currentUser;
            } else if (window.authManager && window.authManager.currentUser?.uid) {
                // Try to get user data from Firebase
                try {
                    const userDoc = await window.db.collection('users').doc(window.authManager.currentUser.uid).get();
                    if (userDoc.exists) {
                        currentUser = { uid: window.authManager.currentUser.uid, ...userDoc.data() };
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
            
            console.log('🔧 EditionService: Current user data for refresh:', currentUser);
            
            // Refresh fixtures for the current gameweek (both desktop and mobile) with user data
            if (window.loadFixturesForDeadline && typeof window.loadFixturesForDeadline === 'function') {
                console.log('🔧 EditionService: Refreshing fixtures for gameweek:', currentGameweek);
                if (currentUser) {
                    await window.loadFixturesForDeadline(currentGameweek, currentUser, currentUser.uid);
                } else {
                    await window.loadFixturesForDeadline(currentGameweek);
                }
            } else {
                console.log('🔧 EditionService: loadFixturesForDeadline function not available');
            }
            
            // Refresh mobile fixtures for the current gameweek with user data
            if (window.loadMobileFixturesForDeadline && typeof window.loadMobileFixturesForDeadline === 'function') {
                console.log('🔧 EditionService: Refreshing mobile fixtures for gameweek:', currentGameweek);
                if (currentUser) {
                    await window.loadMobileFixturesForDeadline(currentGameweek, currentUser, currentUser.uid);
                } else {
                    await window.loadMobileFixturesForDeadline(currentGameweek);
                }
            } else {
                console.log('🔧 EditionService: loadMobileFixturesForDeadline function not available');
            }
            
            // Refresh scores for the current gameweek
            if (window.loadScoresForGameweek && typeof window.loadScoresForGameweek === 'function') {
                console.log('🔧 EditionService: Refreshing scores for gameweek:', currentGameweek);
                await window.loadScoresForGameweek();
            } else {
                console.log('🔧 EditionService: loadScoresForGameweek function not available');
            }
            
            // Refresh as-it-stands data for the current gameweek
            await this.refreshAsItStandsData(currentGameweek);
            
            // Refresh picks data with current user data
            await this.refreshPicksData(currentGameweek, currentUser);
            
            // Force a refresh of the pick status headers to update styling
            await this.refreshPickStatusHeaders(currentGameweek, currentUser);
            
            console.log('🔧 EditionService: All dashboard content refresh complete');
        } catch (error) {
            console.error('❌ EditionService: Error refreshing dashboard content:', error);
        }
    }

    /**
     * Refresh as-it-stands data for a specific gameweek
     */
    async refreshAsItStandsData(gameweek) {
        console.log('🔧 EditionService: Refreshing as-it-stands data for gameweek:', gameweek);
        
        try {
            // Trigger as-it-stands data refresh for both desktop and mobile
            const desktopGameweekSelect = document.querySelector('#desktop-as-it-stands-gameweek');
            const mobileGameweekSelect = document.querySelector('#mobile-as-it-stands-gameweek');
            
            if (desktopGameweekSelect) {
                desktopGameweekSelect.value = gameweek;
                // Trigger change event to refresh data
                desktopGameweekSelect.dispatchEvent(new Event('change'));
            }
            
            if (mobileGameweekSelect) {
                mobileGameweekSelect.value = gameweek;
                // Trigger change event to refresh data
                mobileGameweekSelect.dispatchEvent(new Event('change'));
            }
            
            console.log('🔧 EditionService: As-it-stands data refresh triggered');
        } catch (error) {
            console.error('❌ EditionService: Error refreshing as-it-stands data:', error);
        }
    }

    /**
     * Refresh picks data for a specific gameweek
     */
    async refreshPicksData(gameweek, userData = null) {
        console.log('🔧 EditionService: Refreshing picks data for gameweek:', gameweek);
        
        try {
            // Use provided user data or fall back to auth manager
            let currentUser = userData;
            if (!currentUser && window.authManager && window.authManager.currentUser) {
                currentUser = window.authManager.currentUser;
            }
            
            if (!currentUser) {
                console.log('🔧 EditionService: No user data available for picks refresh');
                return;
            }
            
            console.log('🔧 EditionService: Refreshing picks with user data:', currentUser);
            console.log('🔧 EditionService: Current user picks:', currentUser.picks);
            console.log('🔧 EditionService: Current edition:', this.currentUserEdition);
            
            // Ensure we have the latest user data from Firebase for the current edition
            try {
                const freshUserDoc = await window.db.collection('users').doc(currentUser.uid).get();
                if (freshUserDoc.exists) {
                    const freshUserData = freshUserDoc.data();
                    console.log('🔧 EditionService: Fresh user data from Firebase:', freshUserData);
                    console.log('🔧 EditionService: Fresh user picks:', freshUserData.picks);
                    
                    // Use the fresh user data for rendering
                    currentUser = { uid: currentUser.uid, ...freshUserData };
                }
            } catch (error) {
                console.error('Error fetching fresh user data:', error);
            }
            
            // Refresh picks display for both desktop and mobile
            if (window.app && window.app.gameLogicManager) {
                // Refresh desktop picks
                const desktopPicksContainer = document.querySelector('#desktop-picks-history');
                if (desktopPicksContainer) {
                    console.log('🔧 EditionService: Rendering desktop picks with data:', currentUser.picks);
                    await window.app.gameLogicManager.renderPickHistory(
                        currentUser.picks || {},
                        desktopPicksContainer,
                        currentUser.uid,
                        currentUser
                    );
                }
                
                // Refresh mobile picks
                const mobilePicksContainer = document.querySelector('#mobile-picks-history');
                if (mobilePicksContainer) {
                    console.log('🔧 EditionService: Rendering mobile picks with data:', currentUser.picks);
                    await window.app.gameLogicManager.renderPickHistory(
                        currentUser.picks || {},
                        mobilePicksContainer,
                        currentUser.uid,
                        currentUser
                    );
                }
            }
            
            console.log('🔧 EditionService: Picks data refresh complete');
        } catch (error) {
            console.error('❌ EditionService: Error refreshing picks data:', error);
        }
    }
    
    /**
     * Refresh pick status headers to update styling and status displays
     */
    async refreshPickStatusHeaders(gameweek, userData = null) {
        console.log('🔧 EditionService: Refreshing pick status headers for gameweek:', gameweek);
        
        try {
            // Use provided user data or fall back to auth manager
            let currentUser = userData;
            if (!currentUser && window.authManager && window.authManager.currentUser) {
                currentUser = window.authManager.currentUser;
            }
            
            if (!currentUser) {
                console.log('🔧 EditionService: No user data available for pick status refresh');
                return;
            }
            
            // Update desktop pick status header
            if (window.updatePickStatusHeader && typeof window.updatePickStatusHeader === 'function') {
                try {
                    await window.updatePickStatusHeader(gameweek, currentUser, currentUser.uid);
                    console.log('🔧 EditionService: Desktop pick status header updated');
                } catch (error) {
                    console.error('Error updating desktop pick status header:', error);
                }
            }
            
            // Update mobile pick status header
            if (window.updateMobilePickStatusHeader && typeof window.updateMobilePickStatusHeader === 'function') {
                try {
                    await window.updateMobilePickStatusHeader(gameweek, currentUser, currentUser.uid);
                    console.log('🔧 EditionService: Mobile pick status header updated');
                } catch (error) {
                    console.error('Error updating mobile pick status header:', error);
                }
            }
            
            console.log('🔧 EditionService: Pick status headers refresh complete');
        } catch (error) {
            console.error('❌ EditionService: Error refreshing pick status headers:', error);
        }
    }


}

// Export the EditionService class
export default EditionService;
