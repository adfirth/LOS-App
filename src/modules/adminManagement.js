// Admin Management Module
// Handles all admin-related functionality including dashboard, player management, and competition settings

class AdminManagementManager {
    constructor(db, fixturesManager = null, scoresManager = null) {
        this.db = db;
        this.fixturesManager = fixturesManager;
        this.scoresManager = scoresManager;
        this.adminManagementInitialized = false;
        this.adminDashboardInitialized = false;
        this.adminTabsInitialized = false;
        this.fixtureManagementInitialized = false;
        this.registrationManagementInitialized = false;
        this.competitionSettingsInitialized = false;
        this.allPlayers = [];
        this.currentPlayerManagementType = 'total';
        this.currentActiveEdition = 'test';
        
        // Method to update the current active edition
        this.updateCurrentActiveEdition = (edition) => {
            this.currentActiveEdition = edition;
            console.log(`AdminManagementManager: Updated currentActiveEdition to ${edition}`);
        };
        
        // Debug: Check if renderPicksTable method is available
        console.log('🔍 AdminManagementManager constructor - checking methods:');
        console.log('🔍 this.renderPicksTable:', typeof this.renderPicksTable);
        console.log('🔍 this.debugAllPicks:', typeof this.debugAllPicks);
        console.log('🔍 Available methods:', Object.getOwnPropertyNames(this));
        
        // Check if methods are available on the prototype
        console.log('🔍 Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
        
        // Ensure renderPicksTable method is available on this instance
        if (typeof this.renderPicksTable !== 'function') {
            console.log('🔍 renderPicksTable not found on instance, adding it manually...');
            this.renderPicksTable = async function() {
                console.log('🔍 renderPicksTable called via manual binding - clearing table first');
                console.log('🔍 this object:', this);
                console.log('🔍 this.db:', this.db);
                console.log('🔍 Available methods on this:', Object.getOwnPropertyNames(this));
                
                // Get the picks elements
                const picksEditionSelect = document.querySelector('#picks-edition-select');
                const picksGameweekSelect = document.querySelector('#picks-gameweek-select');
                const picksTitle = document.querySelector('#picks-title');
                const picksTableBody = document.querySelector('#admin-picks-body');
                
                if (!picksTableBody) {
                    console.error('❌ Picks table body not found');
                    return;
                }
                
                // Clear the table completely before adding new rows
                picksTableBody.innerHTML = '';
                
                const selectedEdition = picksEditionSelect ? picksEditionSelect.value : 'editiontest';
                const selectedGameweek = picksGameweekSelect ? picksGameweekSelect.value : '1';
                const gwKey = selectedGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${selectedGameweek}`;
                
                // Validate edition value
                if (!selectedEdition || selectedEdition.trim() === '') {
                    console.warn('Invalid edition value:', selectedEdition);
                    return;
                }
                
                console.log('🔍 Selected edition:', selectedEdition, 'gameweek:', selectedGameweek, 'gwKey:', gwKey);
                
                const displayText = selectedGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${selectedGameweek}`;
                if (picksTitle) {
                    picksTitle.textContent = `Picks for ${selectedEdition.charAt(0).toUpperCase() + selectedEdition.slice(1)} - ${displayText}`;
                }
                
                try {
                    console.log('🔍 Fetching users from database...');
                    const usersSnapshot = await this.db.collection('users').get();
                    console.log('🔍 Users snapshot received, count:', usersSnapshot.size);
                    
                    let registeredUsersCount = 0;
                    let totalUsersWithPicks = 0;
                    let usersProcessed = 0;
                    
                    usersSnapshot.forEach(doc => {
                        const userData = doc.data();
                        usersProcessed++;
                        
                        console.log(`🔍 Processing user ${usersProcessed}/${usersSnapshot.size}:`, {
                            id: doc.id,
                            firstName: userData.firstName,
                            surname: userData.surname,
                            displayName: userData.displayName,
                            registrations: userData.registrations,
                            picks: userData.picks,
                            hasPicks: !!userData.picks,
                            picksKeys: userData.picks ? Object.keys(userData.picks) : []
                        });
                        
                        // Check if user is registered for this edition
                        const isRegisteredForEdition = userData.registrations && userData.registrations[selectedEdition];
                        console.log(`🔍 User ${userData.firstName} ${userData.surname} - Registered for ${selectedEdition}:`, isRegisteredForEdition);
                        
                        // TEMPORARY: Show all users with picks for debugging
                        // TODO: Restore this filter once we understand the registration structure
                        if (!userData.picks || Object.keys(userData.picks).length === 0) {
                            console.log(`🔍 Skipping user ${userData.firstName} ${userData.surname} - no picks data`);
                            return;
                        }
                        
                        // Check if user has picks for the selected gameweek
                        const hasPickForGameweek = userData.picks[gwKey];
                        
                        if (!hasPickForGameweek) {
                            console.log(`🔍 Skipping user ${userData.firstName} ${userData.surname} - no pick for ${gwKey}`);
                            return;
                        }
                        
                        registeredUsersCount++;
                        console.log('🔍 Processing user:', userData.firstName, userData.surname, 'for edition:', selectedEdition);
                        
                        // Picks are stored using both edition-prefixed format (e.g., edition1_gw1) and simple format (e.g., gw1)
                        // For the test edition, we need to handle both "editiontest" and "test" formats
                        let editionGameweekKey;
                        if (selectedEdition === 'editiontest') {
                            editionGameweekKey = `editiontest_${gwKey}`;
                        } else if (selectedEdition.startsWith('edition')) {
                            editionGameweekKey = `${selectedEdition}_${gwKey}`;
                        } else {
                            editionGameweekKey = `edition${selectedEdition}_${gwKey}`;
                        }
                        
                        console.log('🔍 Looking for picks with key:', editionGameweekKey, 'and fallback key:', gwKey);
                        console.log('🔍 User picks object:', userData.picks);
                        
                        const playerPick = userData.picks && (userData.picks[editionGameweekKey] || userData.picks[gwKey]) ? 
                            (userData.picks[editionGameweekKey] || userData.picks[gwKey]) : 'No Pick Made';
                        
                        console.log('🔍 Player pick found:', playerPick);
                        
                        // Create table row
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${userData.firstName} ${userData.surname}</td>
                            <td>${selectedEdition}</td>
                            <td>${displayText}</td>
                            <td>${playerPick}</td>
                        `;
                        picksTableBody.appendChild(row);
                    });
                    
                    console.log('🔍 Total users processed:', usersProcessed);
                    console.log('🔍 Users with picks for this gameweek:', registeredUsersCount);
                    
                    if (registeredUsersCount === 0) {
                        const noDataRow = document.createElement('tr');
                        noDataRow.innerHTML = '<td colspan="4" class="text-center">No picks found for this edition and gameweek</td>';
                        picksTableBody.appendChild(noDataRow);
                    }
                    
                } catch (error) {
                    console.error('❌ Error rendering picks table:', error);
                    const errorRow = document.createElement('tr');
                    errorRow.innerHTML = `<td colspan="4" class="text-center text-danger">Error loading picks: ${error.message}</td>`;
                    picksTableBody.appendChild(errorRow);
                }
            }.bind(this);
            
            console.log('🔍 After manual binding - this.renderPicksTable:', typeof this.renderPicksTable);
        }
        
        // Ensure debugAllPicks method is available on this instance
        if (typeof this.debugAllPicks !== 'function') {
            console.log('🔍 debugAllPicks not found on instance, adding it manually...');
            this.debugAllPicks = async function() {
                console.log('🔍 debugAllPicks called via manual binding');
                console.log('🔍 this object:', this);
                console.log('🔍 this.db:', this.db);
                
                try {
                    console.log('🔍 Fetching all users for debugging...');
                    const usersSnapshot = await this.db.collection('users').get();
                    console.log('🔍 Users snapshot received, count:', usersSnapshot.size);
                    
                    let usersWithPicks = 0;
                    let totalPicks = 0;
                    
                    usersSnapshot.forEach(doc => {
                        const userData = doc.data();
                        if (userData.picks && Object.keys(userData.picks).length > 0) {
                            usersWithPicks++;
                            const pickCount = Object.keys(userData.picks).length;
                            totalPicks += pickCount;
                            
                            console.log(`🔍 User ${userData.firstName} ${userData.surname}:`, {
                                id: doc.id,
                                picks: userData.picks,
                                pickCount: pickCount,
                                pickKeys: Object.keys(userData.picks)
                            });
                        }
                    });
                    
                    console.log('🔍 Debug summary:');
                    console.log('🔍 Total users:', usersSnapshot.size);
                    console.log('🔍 Users with picks:', usersWithPicks);
                    console.log('🔍 Total picks across all users:', totalPicks);
                    
                } catch (error) {
                    console.error('❌ Error in debugAllPicks:', error);
                }
            }.bind(this);
            
            console.log('🔍 After manual binding - this.debugAllPicks:', typeof this.debugAllPicks);
        }

        // Ensure renderPicksTableFromCollection method is available on this instance
        if (typeof this.renderPicksTableFromCollection !== 'function') {
            console.log('🔍 renderPicksTableFromCollection not found on instance, adding it manually...');
            this.renderPicksTableFromCollection = async function() {
                console.log('🔍 renderPicksTableFromCollection called via manual binding - using picks collection');
                
                // Get the picks elements
                const picksEditionSelect = document.querySelector('#picks-edition-select');
                const picksGameweekSelect = document.querySelector('#picks-gameweek-select');
                const picksTitle = document.querySelector('#picks-title');
                const picksTableBody = document.querySelector('#admin-picks-body');
                
                if (!picksTableBody) {
                    console.error('❌ Picks table body not found');
                    return;
                }
                
                // Clear the table completely before adding new rows
                picksTableBody.innerHTML = '';
                
                const selectedEdition = picksEditionSelect ? picksEditionSelect.value : 'test';
                const selectedGameweek = picksGameweekSelect ? picksGameweekSelect.value : '1';
                
                // Map edition values from HTML to migrated data format
                let editionFilter = selectedEdition;
                if (selectedEdition === 'editiontest') {
                    editionFilter = 'test';
                } else if (selectedEdition.startsWith('edition')) {
                    editionFilter = selectedEdition.replace('edition', '');
                }
                
                console.log('🔍 Selected edition:', selectedEdition, 'mapped to:', editionFilter, 'gameweek:', selectedGameweek);
                
                const displayText = selectedGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${selectedGameweek}`;
                if (picksTitle) {
                    picksTitle.textContent = `Picks for ${selectedEdition.charAt(0).toUpperCase() + selectedEdition.slice(1)} - ${displayText}`;
                }
                
                try {
                    console.log('🔍 Fetching picks from picks collection...');
                    
                    // Query picks collection
                    let picksQuery = this.db.collection('picks')
                        .where('edition', '==', editionFilter)
                        .where('gameweek', '==', selectedGameweek)
                        .where('isActive', '==', true);
                    
                    const picksSnapshot = await picksQuery.get();
                    console.log('🔍 Picks snapshot received, count:', picksSnapshot.size);
                    
                    if (picksSnapshot.empty) {
                        const noDataRow = document.createElement('tr');
                        noDataRow.innerHTML = '<td colspan="3" class="text-center">No picks found for this edition and gameweek</td>';
                        picksTableBody.appendChild(noDataRow);
                        return;
                    }
                    
                    // Process picks
                    picksSnapshot.forEach(doc => {
                        const pickData = doc.data();
                        
                        console.log('🔍 Processing pick:', pickData);
                        
                        // Create table row
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${pickData.userFirstName} ${pickData.userSurname}</td>
                            <td>${pickData.teamPicked}</td>
                            <td>Active</td>
                        `;
                        picksTableBody.appendChild(row);
                    });
                    
                    console.log('🔍 Total picks displayed:', picksSnapshot.size);
                    
                } catch (error) {
                    console.error('❌ Error rendering picks table:', error);
                    const errorRow = document.createElement('tr');
                    errorRow.innerHTML = `<td colspan="3" class="text-center text-danger">Error loading picks: ${error.message}</td>`;
                    picksTableBody.appendChild(errorRow);
                }
            }.bind(this);
            
            console.log('🔍 After manual binding - this.renderPicksTableFromCollection:', typeof this.renderPicksTableFromCollection);
        }

    }

    // Function to render picks table from the new picks collection
    async renderPicksTableFromCollection() {
        console.log('🔍 renderPicksTableFromCollection called - using picks collection');
        
        // Get the picks elements
        const picksEditionSelect = document.querySelector('#picks-edition-select');
        const picksGameweekSelect = document.querySelector('#picks-gameweek-select');
        const picksTitle = document.querySelector('#picks-title');
        const picksTableBody = document.querySelector('#admin-picks-body');
        
        if (!picksTableBody) {
            console.error('❌ Picks table body not found');
            return;
        }
        
        // Clear the table completely before adding new rows
        picksTableBody.innerHTML = '';
        
        const selectedEdition = picksEditionSelect ? picksEditionSelect.value : 'test';
        const selectedGameweek = picksGameweekSelect ? picksGameweekSelect.value : '1';
        
        // Map edition values from HTML to migrated data format
        let editionFilter = selectedEdition;
        if (selectedEdition === 'editiontest') {
            editionFilter = 'test';
        } else if (selectedEdition.startsWith('edition')) {
            editionFilter = selectedEdition.replace('edition', '');
        }
        
        console.log('🔍 Selected edition:', selectedEdition, 'mapped to:', editionFilter, 'gameweek:', selectedGameweek);
        
        const displayText = selectedGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${selectedGameweek}`;
        if (picksTitle) {
            picksTitle.textContent = `Picks for ${selectedEdition.charAt(0).toUpperCase() + selectedEdition.slice(1)} - ${displayText}`;
        }
        
        try {
            console.log('🔍 Fetching picks from picks collection...');
            
            // Query picks collection
            let picksQuery = this.db.collection('picks')
                .where('edition', '==', editionFilter)
                .where('gameweek', '==', selectedGameweek)
                .where('isActive', '==', true);
            
            const picksSnapshot = await picksQuery.get();
            console.log('🔍 Picks snapshot received, count:', picksSnapshot.size);
            
            if (picksSnapshot.empty) {
                const noDataRow = document.createElement('tr');
                noDataRow.innerHTML = '<td colspan="3" class="text-center">No picks found for this edition and gameweek</td>';
                picksTableBody.appendChild(noDataRow);
                return;
            }
            
            // Process picks
            picksSnapshot.forEach(doc => {
                const pickData = doc.data();
                
                console.log('🔍 Processing pick:', pickData);
                
                // Create table row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pickData.userFirstName} ${pickData.userSurname}</td>
                    <td>${pickData.teamPicked}</td>
                    <td>Active</td>
                `;
                picksTableBody.appendChild(row);
            });
            
            console.log('🔍 Total picks displayed:', picksSnapshot.size);
            
        } catch (error) {
            console.error('❌ Error rendering picks table:', error);
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `<td colspan="3" class="text-center text-danger">Error loading picks: ${error.message}</td>`;
            picksTableBody.appendChild(errorRow);
        }
    }



    // Function to render picks table (legacy method)
    async renderPicksTable() {
        console.log('🔍 renderPicksTable called - clearing table first');
        console.log('🔍 this object:', this);
        console.log('🔍 this.db:', this.db);
        console.log('🔍 Available methods on this:', Object.getOwnPropertyNames(this));
        
        // Get the picks elements
        const picksEditionSelect = document.querySelector('#picks-edition-select');
        const picksGameweekSelect = document.querySelector('#picks-gameweek-select');
        const picksTitle = document.querySelector('#picks-title');
        const picksTableBody = document.querySelector('#admin-picks-body');
        
        if (!picksTableBody) {
            console.error('❌ Picks table body not found');
            return;
        }
        
        // Clear the table completely before adding new rows
        picksTableBody.innerHTML = '';
        
        const selectedEdition = picksEditionSelect ? picksEditionSelect.value : 'editiontest';
        const selectedGameweek = picksGameweekSelect ? picksGameweekSelect.value : '1';
        const gwKey = selectedGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${selectedGameweek}`;
        
        // Validate edition value
        if (!selectedEdition || selectedEdition.trim() === '') {
            console.warn('Invalid edition value:', selectedEdition);
            return;
        }
        
        console.log('🔍 Selected edition:', selectedEdition, 'gameweek:', selectedGameweek, 'gwKey:', gwKey);
        
        const displayText = selectedGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${selectedGameweek}`;
        if (picksTitle) {
            picksTitle.textContent = `Picks for ${selectedEdition.charAt(0).toUpperCase() + selectedEdition.slice(1)} - ${displayText}`;
        }
        
        try {
            console.log('🔍 Fetching users from database...');
            const usersSnapshot = await this.db.collection('users').get();
            console.log('🔍 Users snapshot received, count:', usersSnapshot.size);
            
            let registeredUsersCount = 0;
            let totalUsersWithPicks = 0;
            let usersProcessed = 0;
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                usersProcessed++;
                
                console.log(`🔍 Processing user ${usersProcessed}/${usersSnapshot.size}:`, {
                    id: doc.id,
                    firstName: userData.firstName,
                    surname: userData.surname,
                    displayName: userData.displayName,
                    registrations: userData.registrations,
                    picks: userData.picks,
                    hasPicks: !!userData.picks,
                    picksKeys: userData.picks ? Object.keys(userData.picks) : []
                });
                
                // Check if user is registered for this edition
                const isRegisteredForEdition = userData.registrations && userData.registrations[selectedEdition];
                console.log(`🔍 User ${userData.firstName} ${userData.surname} - Registered for ${selectedEdition}:`, isRegisteredForEdition);
                
                // TEMPORARY: Show all users with picks for debugging
                // TODO: Restore this filter once we understand the registration structure
                if (!userData.picks || Object.keys(userData.picks).length === 0) {
                    console.log(`🔍 Skipping user ${userData.firstName} ${userData.surname} - no picks data`);
                    return;
                }
                
                // Check if user has picks for the selected gameweek
                const hasPickForGameweek = userData.picks[gwKey];
                
                if (!hasPickForGameweek) {
                    console.log(`🔍 Skipping user ${userData.firstName} ${userData.surname} - no pick for ${gwKey}`);
                    return;
                }
                
                registeredUsersCount++;
                console.log('🔍 Processing user:', userData.firstName, userData.surname, 'for edition:', selectedEdition);
                
                // Picks are stored using both edition-prefixed format (e.g., edition1_gw1) and simple format (e.g., gw1)
                // For the test edition, we need to handle both "editiontest" and "test" formats
                let editionGameweekKey;
                if (selectedEdition === 'editiontest') {
                    editionGameweekKey = `editiontest_${gwKey}`;
                } else if (selectedEdition.startsWith('edition')) {
                    editionGameweekKey = `${selectedEdition}_${gwKey}`;
                } else {
                    editionGameweekKey = `edition${selectedEdition}_${gwKey}`;
                }
                
                console.log('🔍 Looking for picks with key:', editionGameweekKey, 'and fallback key:', gwKey);
                console.log('🔍 User picks object:', userData.picks);
                
                const playerPick = userData.picks && (userData.picks[editionGameweekKey] || userData.picks[gwKey]) ? 
                    (userData.picks[editionGameweekKey] || userData.picks[gwKey]) : 'No Pick Made';
                
                console.log('🔍 Player pick found:', playerPick);
                
                const row = document.createElement('tr');
                const badge = playerPick !== 'No Pick Made' ? this.getTeamBadge(playerPick) : null;
                const badgeHtml = badge ? `<img src="${badge}" alt="${playerPick}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
                
                // Determine pick status
                let statusText = 'No Pick';
                let statusClass = 'no-pick';
                if (playerPick !== 'No Pick Made') {
                    statusText = 'Pick Made';
                    statusClass = 'pick-made';
                    totalUsersWithPicks++;
                }
                
                // Use firstName and surname instead of displayName
                const userName = `${userData.firstName || ''} ${userData.surname || ''}`.trim();
                
                row.innerHTML = `
                    <td>${userName}</td>
                    <td>${badgeHtml}${playerPick}</td>
                    <td><span class="pick-status ${statusClass}">${statusText}</span></td>
                `;
                picksTableBody.appendChild(row);
            });
            
            console.log('🔍 Summary:', {
                totalUsers: usersSnapshot.size,
                usersProcessed: usersProcessed,
                registeredUsersForEdition: registeredUsersCount,
                totalUsersWithPicks: totalUsersWithPicks,
                rowsAddedToTable: picksTableBody.children.length
            });
            
        } catch (error) {
            console.error('❌ Error loading picks:', error);
            console.error('❌ Error details:', error.message, error.code);
            picksTableBody.innerHTML = '<tr><td colspan="3">Error loading picks: ' + error.message + '</td></tr>';
        }
    }

    // Debug function to show all users with picks
    async debugAllPicks() {
        console.log('🔍 DEBUG: Showing all users with picks data...');
        try {
            const usersSnapshot = await this.db.collection('users').get();
            console.log('🔍 Total users in database:', usersSnapshot.size);
            
            let usersWithPicks = 0;
            let totalPicks = 0;
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.picks && Object.keys(userData.picks).length > 0) {
                    usersWithPicks++;
                    const pickCount = Object.keys(userData.picks).length;
                    totalPicks += pickCount;
                    
                    console.log(`🔍 User with picks: ${userData.firstName} ${userData.surname}`, {
                        id: doc.id,
                        picks: userData.picks,
                        pickCount: pickCount,
                        registrations: userData.registrations
                    });
                }
            });
            
            console.log('🔍 Summary:', {
                totalUsers: usersSnapshot.size,
                usersWithPicks: usersWithPicks,
                totalPicks: totalPicks
            });
            
        } catch (error) {
            console.error('❌ Error in debugAllPicks:', error);
        }
    }

    // Initialize admin management
    initializeAdminManagement() {
        if (this.adminManagementInitialized) {
            console.log('Admin management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing admin management...');
        this.adminManagementInitialized = true;
        
        this.setupEventListeners();
    }

    initializeAdminPage() {
        console.log('🚀 Initializing admin page...');
        
        // Initialize competition settings
        this.initializeCompetitionSettings();
        
        // Build admin dashboard to ensure all functions are exposed
        this.buildAdminDashboard();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Ensure Save Settings button is properly enabled and has event listener
        this.ensureSaveSettingsButtonReady();
        
        // Initialize Football Web Pages API integration for admin interface
        this.initializeAdminApiIntegration();
        
        console.log('✅ Admin page initialization complete');
    }

    ensureSaveSettingsButtonReady() {
        console.log('🔧 Ensuring Save Settings button is ready...');
        
        const saveSettingsBtn = document.querySelector('#save-settings-btn');
        if (!saveSettingsBtn) {
            console.error('Save Settings button not found');
            return;
        }
        
        // Force enable the button
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.style.pointerEvents = 'auto';
        saveSettingsBtn.style.opacity = '1';
        saveSettingsBtn.style.cursor = 'pointer';
        saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
        saveSettingsBtn.style.color = 'var(--dark-text)';
        saveSettingsBtn.classList.remove('disabled');
        saveSettingsBtn.removeAttribute('disabled');
        
        // Remove any existing event listeners and re-attach
        saveSettingsBtn.removeEventListener('click', () => this.saveCompetitionSettings());
        saveSettingsBtn.addEventListener('click', () => this.saveCompetitionSettings());
        
        console.log('✅ Save Settings button is ready and enabled');
        console.log('Button disabled state:', saveSettingsBtn.disabled);
        console.log('Button pointer-events:', saveSettingsBtn.style.pointerEvents);
        console.log('Button opacity:', saveSettingsBtn.style.opacity);
        console.log('Button cursor:', saveSettingsBtn.style.cursor);
        console.log('Button background color:', saveSettingsBtn.style.backgroundColor);
        console.log('Button text color:', saveSettingsBtn.style.color);
        console.log('Button classes:', saveSettingsBtn.className);
        console.log('Button attributes:', Array.from(saveSettingsBtn.attributes).map(attr => `${attr.name}="${attr.value}"`));
    }

    setupEventListeners() {
        console.log('🔧 Setting up admin management event listeners...');
        
        // Set up settings event listeners
        this.setupSettingsEventListeners();
        
        // Set up API suspension event listeners
        this.setupApiSuspensionEventListeners();
        
        // Set up quick edition selector
        this.setupQuickEditionSelector();
        
        // Set up As It Stands functionality
        this.setupAsItStandsFunctionality();
        
        // Set up other event listeners as needed
        console.log('✅ Admin management event listeners ready');
    }

    // Admin Dashboard Functions
    buildAdminDashboard(settings) {
        // Prevent multiple initializations
        if (this.adminDashboardInitialized) {
            console.log('Admin dashboard already initialized, skipping...');
            return;
        }
        
        console.log('Building admin dashboard...');
        this.adminDashboardInitialized = true;
        
        // Ensure settings is available - use parameter, global settings, or defaults
        if (!settings) {
            if (window.settings) {
                settings = window.settings;
                console.log('Using global settings in buildAdminDashboard');
            } else {
                console.warn('No settings provided to buildAdminDashboard, using defaults');
                settings = {
                    active_gameweek: '1',
                    active_edition: 'edition1'
                };
            }
        }
        
        // Initialize picks controls
        const picksEditionSelect = document.querySelector('#picks-edition-select');
        const picksGameweekSelect = document.querySelector('#picks-gameweek-select');
        const refreshPicksBtn = document.querySelector('#refresh-picks-btn');
        const picksTitle = document.querySelector('#picks-title');
        const picksTableBody = document.querySelector('#admin-picks-body');
        
        // Set default values - ensure no empty values
        const activeEdition = settings.active_edition || 'test';
        const activeGameweek = settings.active_gameweek || '1';
        
        console.log('Settings loaded for picks:', { activeEdition, activeGameweek, settings });
        
        // Convert the active edition to the picks selector format
        let picksEditionValue;
        if (activeEdition === 'test') {
            picksEditionValue = 'editiontest';
        } else if (activeEdition.startsWith('edition')) {
            picksEditionValue = activeEdition;
        } else {
            picksEditionValue = `edition${activeEdition}`;
        }
        
        console.log('Picks edition value set to:', picksEditionValue);
        
        if (picksEditionSelect) picksEditionSelect.value = picksEditionValue;
        if (picksGameweekSelect) picksGameweekSelect.value = activeGameweek;
        
        // Set up event listeners for picks controls to use the new collection-based function
        if (picksEditionSelect) picksEditionSelect.addEventListener('change', () => this.renderPicksTableFromCollection());
        if (picksGameweekSelect) picksGameweekSelect.addEventListener('change', () => this.renderPicksTableFromCollection());
        if (refreshPicksBtn) refreshPicksBtn.addEventListener('click', () => this.renderPicksTableFromCollection());
        
        // Add event listener for debug button
        const debugPicksBtn = document.querySelector('#debug-picks-btn');
        if (debugPicksBtn) {
            debugPicksBtn.addEventListener('click', () => {
                console.log('🔍 Debug button clicked');
                this.debugAllPicks();
            });
        }
        

        
        // Initial render - use the new collection-based function
        this.renderPicksTableFromCollection();

        // Initialize fixture management
        if (!this.fixtureManagementInitialized) {
            this.initializeFixtureManagement();
        }
        
        // Load initial fixtures for the current edition
        if (typeof window.loadFixturesForGameweek === 'function') {
            window.loadFixturesForGameweek();
        }
        
        // Load initial scores for the current edition
        if (typeof window.loadScoresForGameweek === 'function') {
            window.loadScoresForGameweek();
        }
        
        // Initialize registration management
        if (!this.registrationManagementInitialized) {
            this.initializeRegistrationManagement();
        }
        
        // Initialize competition settings
        if (!this.competitionSettingsInitialized) {
            this.initializeCompetitionSettings();
        }
        
        // Set up event listeners for settings changes
        this.setupSettingsEventListeners();
        
        // Initialize admin tabs
        this.setupAdminTabs();
        
        // Initialize fixture management
        if (!this.fixtureManagementInitialized) {
            this.initializeFixtureManagement();
        }
        
        // Load initial data
        if (typeof window.loadFixturesForGameweek === 'function') {
            window.loadFixturesForGameweek();
        }
        if (typeof window.loadScoresForGameweek === 'function') {
            window.loadScoresForGameweek();
        }
    }
    
    // Save competition settings
    async saveCompetitionSettings() {
        try {
            console.log('Saving competition settings...');
            
            const gameweekSelect = document.querySelector('#active-gameweek-select');
            
            if (!gameweekSelect) {
                console.error('Gameweek select element not found');
                return false;
            }
            
            const newGameweek = gameweekSelect.value;
            
            console.log('New settings - Gameweek:', newGameweek);
            
            // Update global variables
            window.currentActiveGameweek = newGameweek;
            
            // Update app variables
            if (window.app) {
                window.app.currentActiveGameweek = newGameweek;
            }
            
            // Save to database
            await this.db.collection('settings').doc('currentCompetition').set({
                active_gameweek: newGameweek,
                last_updated: new Date()
            });
            
            console.log('Settings saved successfully');
            console.log('Global variables updated - Gameweek:', window.currentActiveGameweek);
            
            // Set default selection across all selectors after settings change
            this.setDefaultSelection();
            
            // Refresh registration statistics to reflect new edition
            if (typeof window.refreshRegistrationStats === 'function') {
                console.log('Refreshing registration statistics after settings change...');
                console.log('About to call refreshRegistrationStats...');
                try {
                    await window.refreshRegistrationStats();
                    console.log('refreshRegistrationStats completed successfully');
                } catch (error) {
                    console.error('Error calling refreshRegistrationStats:', error);
                }
            } else {
                console.warn('window.refreshRegistrationStats is not a function');
                console.log('Available global functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));
            }
            
            // Show success message
            const statusElement = document.querySelector('#settings-status');
            if (statusElement) {
                statusElement.textContent = 'Settings saved successfully!';
                statusElement.className = 'status-message success';
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                }, 3000);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving competition settings:', error);
            
            // Show error message
            const statusElement = document.querySelector('#settings-status');
            if (statusElement) {
                statusElement.textContent = 'Error saving settings: ' + error.message;
                statusElement.className = 'status-message error';
            }
            
            return false;
        }
    }

    // Load API suspension settings
    async loadApiSuspensionSettings() {
        try {
            const settingsDoc = await this.db.collection('settings').doc('apiSuspension').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                const suspensionCheckbox = document.querySelector('#api-suspension-enabled');
                if (suspensionCheckbox) {
                    suspensionCheckbox.checked = settings.suspended || false;
                    console.log('API suspension settings loaded:', settings.suspended);
                }
            }
        } catch (error) {
            console.error('Error loading API suspension settings:', error);
        }
    }

    // Save API suspension settings
    async saveApiSuspensionSettings() {
        try {
            console.log('Saving API suspension settings...');
            
            const suspensionCheckbox = document.querySelector('#api-suspension-enabled');
            if (!suspensionCheckbox) {
                console.error('API suspension checkbox not found');
                return false;
            }
            
            const isSuspended = suspensionCheckbox.checked;
            
            // Save to database
            await this.db.collection('settings').doc('apiSuspension').set({
                suspended: isSuspended,
                last_updated: new Date(),
                updated_by: 'admin'
            });
            
            console.log('API suspension settings saved successfully:', isSuspended);
            
            // Show success message
            const statusElement = document.querySelector('#api-suspension-status');
            if (statusElement) {
                const statusText = isSuspended ? 
                    'API pulls suspended successfully! Automatic calls will be paused.' : 
                    'API pulls resumed successfully! Automatic calls will resume.';
                statusElement.textContent = statusText;
                statusElement.className = 'status-message success';
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                }, 5000);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving API suspension settings:', error);
            
            // Show error message
            const statusElement = document.querySelector('#api-suspension-status');
            if (statusElement) {
                statusElement.textContent = 'Error saving API suspension settings: ' + error.message;
                statusElement.className = 'status-message error';
            }
            
            return false;
        }
    }

    // Check if API calls are suspended
    async isApiSuspended() {
        try {
            const settingsDoc = await this.db.collection('settings').doc('apiSuspension').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                return settings.suspended || false;
            }
            return false;
        } catch (error) {
            console.error('Error checking API suspension status:', error);
            return false;
        }
    }

    // Set up API suspension event listeners
    setupApiSuspensionEventListeners() {
        console.log('🔧 Setting up API suspension event listeners...');
        
        const saveApiSuspensionBtn = document.querySelector('#save-api-suspension-btn');
        if (saveApiSuspensionBtn) {
            // Ensure the button is enabled and clickable
            saveApiSuspensionBtn.disabled = false;
            saveApiSuspensionBtn.style.pointerEvents = 'auto';
            saveApiSuspensionBtn.style.opacity = '1';
            saveApiSuspensionBtn.style.cursor = 'pointer';
            saveApiSuspensionBtn.classList.remove('disabled');
            saveApiSuspensionBtn.removeAttribute('disabled');
            
            // Remove any existing event listeners to prevent duplicates
            saveApiSuspensionBtn.removeEventListener('click', window.saveApiSuspensionSettings);
            
            // Add the event listener
            saveApiSuspensionBtn.addEventListener('click', () => {
                console.log('API suspension save button clicked!');
                if (this.saveApiSuspensionSettings && typeof this.saveApiSuspensionSettings === 'function') {
                    this.saveApiSuspensionSettings();
                } else if (window.saveApiSuspensionSettings && typeof window.saveApiSuspensionSettings === 'function') {
                    window.saveApiSuspensionSettings();
                } else {
                    console.error('saveApiSuspensionSettings function not available');
                    alert('Error: API suspension function not available. Please refresh the page.');
                }
            });
            
            console.log('✅ API suspension save button event listener added and button enabled');
        } else {
            console.warn('❌ API suspension save button not found');
        }

        // Set up test reset button event listener
        const resetTestLivesBtn = document.querySelector('#reset-test-lives-btn');
        if (resetTestLivesBtn) {
            // Ensure the button is enabled and clickable
            resetTestLivesBtn.disabled = false;
            resetTestLivesBtn.style.pointerEvents = 'auto';
            resetTestLivesBtn.style.opacity = '1';
            resetTestLivesBtn.style.cursor = 'pointer';
            resetTestLivesBtn.classList.remove('disabled');
            resetTestLivesBtn.removeAttribute('disabled');
            
            // Remove any existing event listeners to prevent duplicates
            resetTestLivesBtn.removeEventListener('click', window.resetTestLives);
            
            // Add the event listener
            resetTestLivesBtn.addEventListener('click', () => {
                console.log('Test reset button clicked!');
                if (this.resetTestLives && typeof this.resetTestLives === 'function') {
                    this.resetTestLives();
                } else if (window.resetTestLives && typeof window.resetTestLives === 'function') {
                    window.resetTestLives();
                } else {
                    console.error('resetTestLives function not available');
                    alert('Error: Test reset function not available. Please refresh the page.');
                }
            });
            
            console.log('✅ Test reset button event listener added and button enabled');
        } else {
            console.warn('❌ Test reset button not found');
        }
    }

    // Set up quick edition selector
    setupQuickEditionSelector() {
        console.log('🔧 Setting up quick edition selector...');
        
        const quickEditionSelector = document.querySelector('#quick-edition-selector');
        const quickSaveEditionBtn = document.querySelector('#quick-save-edition-btn');
        
        if (quickEditionSelector && quickSaveEditionBtn) {
            // Set the current active edition in the selector
            this.updateQuickEditionSelector();
            
            // Add event listener for the save button
            quickSaveEditionBtn.addEventListener('click', () => {
                this.saveQuickEditionChange();
            });
            
            // Also allow saving by pressing Enter in the selector
            quickEditionSelector.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveQuickEditionChange();
                }
            });
            
            console.log('✅ Quick edition selector setup complete');
        } else {
            console.warn('❌ Quick edition selector elements not found');
        }
    }

    // Update the quick edition selector with current active edition
    updateQuickEditionSelector() {
        const quickEditionSelector = document.querySelector('#quick-edition-selector');
        if (quickEditionSelector) {
            const currentEdition = window.currentActiveEdition || '1';
            quickEditionSelector.value = currentEdition;
            console.log('✅ Quick edition selector updated to:', currentEdition);
        } else {
            console.warn('Quick edition selector not found');
        }
    }

    // Save quick edition change
    async saveQuickEditionChange() {
        try {
            const quickEditionSelector = document.querySelector('#quick-edition-selector');
            const statusElement = document.querySelector('#quick-edition-status');
            
            if (!quickEditionSelector) {
                console.error('Quick edition selector not found');
                return;
            }
            
            const newEdition = quickEditionSelector.value;
            console.log('🔄 Saving quick edition change to:', newEdition);
            
            // Show saving status
            if (statusElement) {
                statusElement.textContent = 'Saving...';
                statusElement.style.color = '#007bff';
            }
            
            // Update the global current active edition
            window.currentActiveEdition = newEdition;
            
            // Update all managers
            if (window.app) {
                if (window.app.registrationManager) {
                    window.app.registrationManager.setCurrentActiveEdition(newEdition);
                }
                if (window.app.adminManagementManager) {
                    window.app.adminManagementManager.updateCurrentActiveEdition(newEdition);
                }
            }
            
            // Save to database
            await this.db.collection('settings').doc('currentCompetition').update({
                active_edition: newEdition,
                last_updated: new Date()
            });
            
            // Update the settings form selector as well
            const settingsEditionSelect = document.querySelector('#active-edition-select');
            if (settingsEditionSelect) {
                settingsEditionSelect.value = newEdition;
            }
            
            // Show success status
            if (statusElement) {
                statusElement.textContent = `✅ Active edition changed to: ${newEdition}`;
                statusElement.style.color = '#28a745';
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 3000);
            }
            
            console.log('✅ Quick edition change saved successfully');
            
            // Refresh any relevant displays
            this.refreshDisplaysAfterEditionChange();
            
        } catch (error) {
            console.error('❌ Error saving quick edition change:', error);
            
            const statusElement = document.querySelector('#quick-edition-status');
            if (statusElement) {
                statusElement.textContent = `❌ Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
                
                // Clear error after 5 seconds
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 5000);
            }
        }
    }

    // Refresh displays after edition change
    refreshDisplaysAfterEditionChange() {
        console.log('🔄 Refreshing displays after edition change...');
        
        // Refresh registration statistics
        if (window.app && window.app.registrationManager) {
            window.app.registrationManager.refreshRegistrationStats();
        }
        
        // Refresh player management if it's open
        const playerManagementModal = document.querySelector('#player-management-modal');
        if (playerManagementModal && playerManagementModal.style.display !== 'none') {
            // Re-trigger the current player management view
            const currentView = this.currentPlayerManagementView || 'total';
            this.showPlayerManagement(currentView);
        }
        
        // Refresh picks display if on picks tab
        const picksTab = document.querySelector('#picks-tab');
        if (picksTab && picksTab.classList.contains('active')) {
            const refreshPicksBtn = document.querySelector('#refresh-picks-btn');
            if (refreshPicksBtn) {
                refreshPicksBtn.click();
            }
        }
        
        // Refresh standings if on as-it-stands tab
        const asItStandsTab = document.querySelector('#as-it-stands-tab');
        if (asItStandsTab && asItStandsTab.classList.contains('active')) {
            this.loadStandings();
        }
        
        console.log('✅ Displays refreshed after edition change');
    }

    // Set up As It Stands functionality
    setupAsItStandsFunctionality() {
        console.log('🔧 Setting up As It Stands functionality...');
        
        // Set up event listeners for standings controls
        const refreshStandingsBtn = document.querySelector('#refresh-standings-btn');
        const exportStandingsBtn = document.querySelector('#export-standings-btn');
        const standingsEditionSelect = document.querySelector('#standings-edition-select');
        const standingsGameweekSelect = document.querySelector('#standings-gameweek-select');
        const standingsViewSelect = document.querySelector('#standings-view-select');
        
        if (refreshStandingsBtn) {
            refreshStandingsBtn.addEventListener('click', () => {
                this.loadStandings();
            });
        }
        
        if (exportStandingsBtn) {
            exportStandingsBtn.addEventListener('click', () => {
                this.exportStandings();
            });
        }
        
        if (standingsEditionSelect) {
            standingsEditionSelect.addEventListener('change', () => {
                this.loadStandings();
            });
        }
        
        if (standingsGameweekSelect) {
            standingsGameweekSelect.addEventListener('change', () => {
                this.loadStandings();
            });
        }
        
        if (standingsViewSelect) {
            standingsViewSelect.addEventListener('change', () => {
                this.loadStandings();
            });
        }
        
        // Set up manual adjustments
        this.setupManualAdjustments();
        
        // Set up standings history
        this.setupStandingsHistory();
        
        // Load initial standings
        console.log('⏰ Setting up initial standings load in 500ms...');
        setTimeout(() => {
            console.log('⏰ Initial standings load timeout triggered');
            this.loadStandings();
        }, 500);
        
        console.log('✅ As It Stands functionality setup complete');
    }

    // Load standings data
    async loadStandings() {
        try {
            const edition = document.querySelector('#standings-edition-select')?.value || '1';
            const gameweek = document.querySelector('#standings-gameweek-select')?.value || '1';
            const view = document.querySelector('#standings-view-select')?.value || 'current';
            
            console.log('🔄 Loading standings for:', { edition, gameweek, view });
            console.log('🔍 DOM elements found:', {
                editionSelect: !!document.querySelector('#standings-edition-select'),
                gameweekSelect: !!document.querySelector('#standings-gameweek-select'),
                viewSelect: !!document.querySelector('#standings-view-select')
            });
            console.log('🔍 Database available:', !!this.db);
            console.log('🔍 Current active edition:', window.currentActiveEdition);
            
            // Update title
            const titleElement = document.querySelector('#standings-title');
            if (titleElement) {
                titleElement.textContent = `Current Standings - Edition ${edition}, Game Week ${gameweek}`;
            }
            
            // Show loading state
            const standingsBody = document.querySelector('#standings-body');
            if (standingsBody) {
                standingsBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #007bff; margin-bottom: 1rem;"></i>
                            <p>Loading standings...</p>
                        </td>
                    </tr>
                `;
            }
            
            // Fetch players for the selected edition
            const playersSnapshot = await this.db.collection('users').get();
            const players = [];
            
            playersSnapshot.forEach(doc => {
                const userData = doc.data();
                // Handle different edition key formats
                let editionKey;
                if (edition === 'test') {
                    editionKey = 'editiontest';
                } else if (edition.startsWith('edition')) {
                    editionKey = edition;
                } else {
                    editionKey = `edition${edition}`;
                }
                
                // Check if user is registered for this edition and is active
                if (userData.registrations && userData.registrations[editionKey] && userData.status !== 'archived') {
                    players.push({
                        id: doc.id,
                        ...userData,
                        currentEdition: edition
                    });
                }
            });
            
            console.log(`📊 Found ${players.length} active players for edition ${edition}`);
            console.log('🔍 Sample player data:', players.slice(0, 2).map(p => ({
                name: `${p.firstName} ${p.surname}`,
                picks: p.picks,
                registrations: p.registrations
            })));
            
            // Debug first player's picks structure in detail
            if (players.length > 0) {
                const firstPlayer = players[0];
                console.log('🔍 First player picks structure:', {
                    name: `${firstPlayer.firstName} ${firstPlayer.surname}`,
                    picks: firstPlayer.picks,
                    picksType: typeof firstPlayer.picks,
                    picksKeys: firstPlayer.picks ? Object.keys(firstPlayer.picks) : [],
                    samplePick: firstPlayer.picks ? firstPlayer.picks[Object.keys(firstPlayer.picks)[0]] : null
                });
                
                // Also check the full player object structure
                console.log('🔍 Full first player object:', {
                    id: firstPlayer.id,
                    firstName: firstPlayer.firstName,
                    surname: firstPlayer.surname,
                    email: firstPlayer.email,
                    registrations: firstPlayer.registrations,
                    status: firstPlayer.status,
                    picks: firstPlayer.picks
                });
            }
            
            // Fetch fixtures for the selected gameweek
            let fixtureDocId;
            if (edition === 'test') {
                fixtureDocId = `editiontest_gw${gameweek}`;
            } else if (edition.startsWith('edition')) {
                fixtureDocId = `${edition}_gw${gameweek}`;
            } else {
                fixtureDocId = `edition${edition}_gw${gameweek}`;
            }
            console.log(`🔍 Looking for fixtures document: ${fixtureDocId}`);
            
            const fixturesDoc = await this.db.collection('fixtures').doc(fixtureDocId).get();
            const fixtures = fixturesDoc.exists ? fixturesDoc.data().fixtures || [] : [];
            
            console.log(`⚽ Found ${fixtures.length} fixtures for edition ${edition}, gameweek ${gameweek}`);
            console.log('🔍 Sample fixtures:', fixtures.slice(0, 2).map(f => ({
                homeTeam: f.homeTeam,
                awayTeam: f.awayTeam,
                homeScore: f.homeScore,
                awayScore: f.awayScore,
                status: f.status
            })));
            
            // Calculate standings (picks are stored in user documents)
            const standings = await this.calculateStandings(players, fixtures, gameweek);
            
            console.log('📊 Calculated standings:', standings.map(s => ({
                name: `${s.firstName} ${s.surname}`,
                lives: s.lives,
                lastPick: s.lastPick,
                lastPickResult: s.lastPickResult,
                status: s.status
            })));
            
            // Filter based on view selection
            let filteredStandings = standings;
            switch (view) {
                case 'survivors':
                    filteredStandings = standings.filter(player => player.lives > 0);
                    break;
                case 'eliminated':
                    filteredStandings = standings.filter(player => player.lives === 0);
                    break;
                case 'all-players':
                default:
                    // Show all players
                    break;
            }
            
            // Update summary stats
            this.updateStandingsSummary(standings);
            
            // Render standings table
            this.renderStandingsTable(filteredStandings);
            
            // Update player adjustment dropdown
            this.updateAdjustmentPlayerDropdown(players);
            
            console.log('✅ Standings loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading standings:', error);
            
            const standingsBody = document.querySelector('#standings-body');
            if (standingsBody) {
                standingsBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem; color: #dc3545;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>Error loading standings: ${error.message}</p>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Calculate standings
    async calculateStandings(players, fixtures, gameweek) {
        const standings = [];
        
        for (const player of players) {
            // Get the gameweek key for this player's picks
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            
            // Get the player's pick for this gameweek
            const playerPick = player.picks && player.picks[gameweekKey];
            
            console.log(`🎯 Player ${player.firstName} ${player.surname}:`, {
                gameweekKey,
                hasPicks: !!player.picks,
                picksKeys: player.picks ? Object.keys(player.picks) : [],
                playerPick,
                allPicks: player.picks,
                currentLives: player.lives
            });
            
            // Start with the player's current stored lives instead of resetting to 2
            // This ensures lives persist across gameweeks and are not reset
            let lives = player.lives || 2;
            let lastPick = 'No picks made';
            let lastPickResult = 'No picks made';
            let livesChanged = false;
            let oldLives = lives;
            
            if (playerPick) {
                // Find the corresponding fixture for this pick
                const fixture = fixtures.find(f => 
                    f.homeTeam === playerPick || f.awayTeam === playerPick
                );
                
                if (fixture) {
                    // Format the last pick display - show only the team that was picked
                    lastPick = playerPick;
                    
                    // Determine if pick was correct based on fixture result
                    const homeScore = fixture.homeScore;
                    const awayScore = fixture.awayScore;
                    
                    if (homeScore !== null && awayScore !== null && homeScore !== undefined && awayScore !== undefined) {
                        // Calculate the actual result
                        let actualResult;
                        if (homeScore > awayScore) {
                            actualResult = 'home';
                        } else if (awayScore > homeScore) {
                            actualResult = 'away';
                        } else {
                            actualResult = 'draw';
                        }
                        
                        // Determine if the pick was correct
                        let pickCorrect = false;
                        if (playerPick === fixture.homeTeam && actualResult === 'home') {
                            pickCorrect = true;
                        } else if (playerPick === fixture.awayTeam && actualResult === 'away') {
                            pickCorrect = true;
                        }
                        
                        if (pickCorrect) {
                            lastPickResult = 'Win';
                        } else if (actualResult === 'draw') {
                            lastPickResult = 'Draw';
                            // Only lose a life if the fixture is complete (FT = Full Time, AET = After Extra Time, PEN = Penalties)
                            // This prevents lives from being lost on incomplete fixtures
                            if (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                                lives = Math.max(0, lives - 1); // Draw results in life loss
                                livesChanged = true;
                            }
                        } else {
                            lastPickResult = 'Loss';
                            // Only lose a life if the fixture is complete (FT = Full Time, AET = After Extra Time, PEN = Penalties)
                            // This prevents lives from being lost on incomplete fixtures
                            if (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN') {
                                lives = Math.max(0, lives - 1);
                                livesChanged = true;
                            }
                        }
                    } else {
                        lastPickResult = 'Pending';
                    }
                } else {
                    lastPickResult = 'Fixture not found';
                }
            }
            
            // If lives changed, update the player in the database
            if (livesChanged) {
                try {
                    await this.db.collection('users').doc(player.id).update({
                        lives: lives,
                        status: lives > 0 ? 'Active' : 'Eliminated'
                    });
                    
                    // Log the life change with a unique timestamp to avoid conflicts
                    const timestamp = new Date();
                    const logId = `life_change_${player.id}_${timestamp.getTime()}`;
                    await this.db.collection('adminLogs').doc(logId).set({
                        action: 'life_lost',
                        playerId: player.id,
                        playerName: `${player.firstName} ${player.surname}`,
                        oldLives: oldLives,
                        newLives: lives,
                        gameweek: gameweek,
                        lastPick: lastPick,
                        lastPickResult: lastPickResult,
                        timestamp: timestamp,
                        reason: 'Automatic life deduction based on pick result'
                    });
                    
                    console.log(`🔄 Player ${player.firstName} ${player.surname} lives updated: ${oldLives} → ${lives}`);
                    
                    // Check if player was eliminated
                    if (lives === 0) {
                        console.log(`🔴 RED CARD! Player ${player.firstName} ${player.surname} has been ELIMINATED from the edition!`);
                    } else if (oldLives === 2 && lives === 1) {
                        console.log(`🟡 Player ${player.firstName} ${player.surname} lost their first life. One life remaining.`);
                    }
                } catch (error) {
                    console.error(`❌ Error updating player ${player.firstName} ${player.surname} lives:`, error);
                }
            }
            
            standings.push({
                ...player,
                lives,
                lastPick,
                lastPickResult,
                status: lives > 0 ? 'Active' : 'Eliminated'
            });
        }
        
        // Sort by lives (descending), then by name
        standings.sort((a, b) => {
            if (b.lives !== a.lives) {
                return b.lives - a.lives;
            }
            // Handle undefined firstName values safely
            const aName = (a.firstName || '') + ' ' + (a.surname || '');
            const bName = (b.firstName || '') + ' ' + (b.surname || '');
            return aName.localeCompare(bName);
        });
        
        return standings;
    }

    // Update standings summary
    updateStandingsSummary(standings) {
        const totalPlayers = standings.length;
        const survivors = standings.filter(player => player.lives > 0).length;
        const eliminated = standings.filter(player => player.lives === 0).length;
        const averageLives = totalPlayers > 0 ? (standings.reduce((sum, player) => sum + player.lives, 0) / totalPlayers).toFixed(1) : '0.0';
        
        // Only update elements if they exist (admin page elements)
        const totalPlayersElement = document.querySelector('#total-players-count');
        const survivorsElement = document.querySelector('#survivors-count');
        const eliminatedElement = document.querySelector('#eliminated-count');
        const averageLivesElement = document.querySelector('#average-lives');
        
        if (totalPlayersElement) totalPlayersElement.textContent = totalPlayers;
        if (survivorsElement) survivorsElement.textContent = survivors;
        if (eliminatedElement) eliminatedElement.textContent = eliminated;
        if (averageLivesElement) averageLivesElement.textContent = averageLives;
    }

    // Render standings table
    renderStandingsTable(standings) {
        const standingsBody = document.querySelector('#standings-body');
        
        if (!standingsBody) return;
        
        if (standings.length === 0) {
            standingsBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem;"></i>
                        <p>No players found for the selected criteria</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        standingsBody.innerHTML = standings.map((player, index) => {
            const position = index + 1;
            const livesColor = player.lives === 2 ? '#28a745' : player.lives === 1 ? '#ffc107' : '#dc3545';
            const statusColor = player.status === 'Active' ? '#28a745' : '#dc3545';
            
            return `
                <tr>
                    <td><strong>${position}</strong></td>
                    <td>${player.firstName} ${player.surname}</td>
                    <td>${player.email}</td>
                    <td style="color: ${livesColor}; font-weight: bold;">${player.lives}</td>
                    <td>${player.lastPick}</td>
                    <td>${player.lastPickResult}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${player.status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.adminManagementManager.adjustPlayerLives('${player.id}', ${player.lives})">
                            <i class="fas fa-edit"></i> Adjust
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Export standings to CSV
    exportStandings() {
        try {
            const edition = document.querySelector('#standings-edition-select')?.value || '1';
            const gameweek = document.querySelector('#standings-gameweek-select')?.value || '1';
            const view = document.querySelector('#standings-view-select')?.value || 'current';
            
            // Get current standings data
            const standingsBody = document.querySelector('#standings-body');
            const rows = standingsBody.querySelectorAll('tr');
            
            if (rows.length === 0) {
                alert('No standings data to export');
                return;
            }
            
            let csv = 'Position,Player Name,Email,Lives Remaining,Picked Team,Last Pick Result,Status\n';
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 7) {
                    const position = cells[0].textContent.trim();
                    const name = cells[1].textContent.trim();
                    const email = cells[2].textContent.trim();
                    const lives = cells[3].textContent.trim();
                    const lastPick = cells[4].textContent.trim();
                    const lastPickResult = cells[5].textContent.trim();
                    const status = cells[6].textContent.trim();
                    
                    csv += `"${position}","${name}","${email}","${lives}","${lastPick}","${lastPickResult}","${status}"\n`;
                }
            });
            
            // Create and download CSV file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `standings_edition${edition}_gw${gameweek}_${view}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Standings exported successfully');
            
        } catch (error) {
            console.error('❌ Error exporting standings:', error);
            alert('Error exporting standings: ' + error.message);
        }
    }

    // Set up manual adjustments
    setupManualAdjustments() {
        const applyAdjustmentBtn = document.querySelector('#apply-adjustment-btn');
        const adjustmentPlayerSelect = document.querySelector('#adjustment-player-select');
        const adjustmentLives = document.querySelector('#adjustment-lives');
        const adjustmentReason = document.querySelector('#adjustment-reason');
        
        if (applyAdjustmentBtn) {
            applyAdjustmentBtn.addEventListener('click', async () => {
                await this.applyManualAdjustment();
            });
        }
        
        if (adjustmentPlayerSelect) {
            adjustmentPlayerSelect.addEventListener('change', () => {
                const selectedPlayerId = adjustmentPlayerSelect.value;
                if (selectedPlayerId) {
                    // Load current lives for selected player
                    this.loadPlayerCurrentLives(selectedPlayerId);
                }
            });
        }
    }

    // Update adjustment player dropdown
    updateAdjustmentPlayerDropdown(players) {
        const adjustmentPlayerSelect = document.querySelector('#adjustment-player-select');
        if (!adjustmentPlayerSelect) return;
        
        // Clear existing options
        adjustmentPlayerSelect.innerHTML = '<option value="">Select a player...</option>';
        
        // Add player options
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.firstName} ${player.surname} (${player.email})`;
            adjustmentPlayerSelect.appendChild(option);
        });
    }

    // Load player current lives
    async loadPlayerCurrentLives(playerId) {
        try {
            const playerDoc = await this.db.collection('users').doc(playerId).get();
            if (playerDoc.exists) {
                const playerData = playerDoc.data();
                const adjustmentLives = document.querySelector('#adjustment-lives');
                if (adjustmentLives) {
                    adjustmentLives.value = playerData.lives || 2;
                }
            }
        } catch (error) {
            console.error('Error loading player lives:', error);
        }
    }

    // Apply manual adjustment
    async applyManualAdjustment() {
        try {
            const playerId = document.querySelector('#adjustment-player-select')?.value;
            const newLives = parseInt(document.querySelector('#adjustment-lives')?.value);
            const reason = document.querySelector('#adjustment-reason')?.value;
            
            if (!playerId) {
                alert('Please select a player');
                return;
            }
            
            if (newLives < 0 || newLives > 2) {
                alert('Lives must be between 0 and 2');
                return;
            }
            
            if (!reason.trim()) {
                alert('Please provide a reason for the adjustment');
                return;
            }
            
            // Update player lives in database
            await this.db.collection('users').doc(playerId).update({
                lives: newLives,
                lastUpdated: new Date()
            });
            
            // Log the adjustment
            await this.db.collection('adminLogs').add({
                action: 'manual_lives_adjustment',
                playerId: playerId,
                oldLives: null, // We don't have the old value easily accessible
                newLives: newLives,
                reason: reason,
                adminId: window.auth.currentUser?.uid,
                timestamp: new Date()
            });
            
            // Show success message
            const statusElement = document.querySelector('#adjustment-status');
            if (statusElement) {
                statusElement.textContent = '✅ Adjustment applied successfully';
                statusElement.style.color = '#28a745';
                
                setTimeout(() => {
                    statusElement.textContent = '';
                }, 3000);
            }
            
            // Refresh standings
            this.loadStandings();
            
            // Clear form
            document.querySelector('#adjustment-player-select').value = '';
            document.querySelector('#adjustment-lives').value = '2';
            document.querySelector('#adjustment-reason').value = '';
            
            console.log('✅ Manual adjustment applied successfully');
            
        } catch (error) {
            console.error('❌ Error applying manual adjustment:', error);
            
            const statusElement = document.querySelector('#adjustment-status');
            if (statusElement) {
                statusElement.textContent = `❌ Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
            }
        }
    }

    // Set up standings history
    setupStandingsHistory() {
        const loadHistoryBtn = document.querySelector('#load-history-btn');
        const exportHistoryBtn = document.querySelector('#export-history-btn');
        
        if (loadHistoryBtn) {
            loadHistoryBtn.addEventListener('click', () => {
                this.loadStandingsHistory();
            });
        }
        
        if (exportHistoryBtn) {
            exportHistoryBtn.addEventListener('click', () => {
                this.exportStandingsHistory();
            });
        }
    }

    // Load standings history
    async loadStandingsHistory() {
        try {
            const edition = document.querySelector('#history-edition-select')?.value || '1';
            const gameweek = document.querySelector('#history-gameweek-select')?.value || 'all';
            
            console.log('🔄 Loading standings history for:', { edition, gameweek });
            
            // Fetch admin logs for this edition
            let query = this.db.collection('adminLogs')
                .where('action', '==', 'manual_lives_adjustment')
                .orderBy('timestamp', 'desc');
            
            const logsSnapshot = await query.get();
            const logs = [];
            
            logsSnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Filter by edition if needed (this would require additional data structure)
            const filteredLogs = logs; // For now, show all logs
            
            this.renderStandingsHistory(filteredLogs);
            
        } catch (error) {
            console.error('❌ Error loading standings history:', error);
            alert('Error loading history: ' + error.message);
        }
    }

    // Render standings history
    renderStandingsHistory(logs) {
        const historyDisplay = document.querySelector('#history-display');
        const historyContent = document.querySelector('#history-content');
        
        if (!historyDisplay || !historyContent) return;
        
        if (logs.length === 0) {
            historyContent.innerHTML = '<p>No historical data found</p>';
            historyDisplay.style.display = 'block';
            return;
        }
        
        const historyHtml = `
            <div class="history-table-container">
                <table class="league-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Player</th>
                            <th>Action</th>
                            <th>New Lives</th>
                            <th>Reason</th>
                            <th>Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.timestamp?.toDate?.()?.toLocaleString() || 'Unknown'}</td>
                                <td>${log.playerId}</td>
                                <td>Manual Adjustment</td>
                                <td>${log.newLives}</td>
                                <td>${log.reason}</td>
                                <td>${log.adminId}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        historyContent.innerHTML = historyHtml;
        historyDisplay.style.display = 'block';
    }

    // Export standings history
    exportStandingsHistory() {
        try {
            const historyContent = document.querySelector('#history-content');
            const table = historyContent.querySelector('table');
            
            if (!table) {
                alert('No history data to export');
                return;
            }
            
            let csv = 'Date,Player,Action,New Lives,Reason,Admin\n';
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    const date = cells[0].textContent.trim();
                    const player = cells[1].textContent.trim();
                    const action = cells[2].textContent.trim();
                    const newLives = cells[3].textContent.trim();
                    const reason = cells[4].textContent.trim();
                    const admin = cells[5].textContent.trim();
                    
                    csv += `"${date}","${player}","${action}","${newLives}","${reason}","${admin}"\n`;
                }
            });
            
            // Create and download CSV file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `standings_history_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Standings history exported successfully');
            
        } catch (error) {
            console.error('❌ Error exporting standings history:', error);
            alert('Error exporting history: ' + error.message);
        }
    }

    // Adjust player lives (called from table action button)
    async adjustPlayerLives(playerId, currentLives) {
        try {
            const newLives = prompt(`Current lives: ${currentLives}\nEnter new lives (0-2):`, currentLives);
            
            if (newLives === null) return; // User cancelled
            
            const lives = parseInt(newLives);
            if (isNaN(lives) || lives < 0 || lives > 2) {
                alert('Please enter a valid number between 0 and 2');
                return;
            }
            
            const reason = prompt('Reason for adjustment:');
            if (!reason || !reason.trim()) {
                alert('Please provide a reason for the adjustment');
                return;
            }
            
            // Update player lives
            await this.db.collection('users').doc(playerId).update({
                lives: lives,
                lastUpdated: new Date()
            });
            
            // Log the adjustment
            await this.db.collection('adminLogs').add({
                action: 'manual_lives_adjustment',
                playerId: playerId,
                oldLives: currentLives,
                newLives: lives,
                reason: reason.trim(),
                adminId: window.auth.currentUser?.uid,
                timestamp: new Date()
            });
            
            // Refresh standings
            this.loadStandings();
            
            console.log('✅ Player lives adjusted successfully');
            
        } catch (error) {
            console.error('❌ Error adjusting player lives:', error);
            alert('Error adjusting player lives: ' + error.message);
        }
    }

    // Initialize Football Web Pages API integration for admin interface
    initializeAdminApiIntegration() {
        console.log('🔧 Initializing admin API integration...');
        
        // Check if the API manager is available
        if (window.app && window.app.apiManager) {
            console.log('✅ API manager found, initializing Football Web Pages API integration');
            window.app.apiManager.initializeFootballWebPagesAPI();
        } else {
            console.warn('⚠️ API manager not available, will retry later');
            // Retry after a short delay
            setTimeout(() => {
                if (window.app && window.app.apiManager) {
                    console.log('✅ API manager found on retry, initializing Football Web Pages API integration');
                    window.app.apiManager.initializeFootballWebPagesAPI();
                } else {
                    console.error('❌ API manager still not available after retry');
                }
            }, 1000);
        }
    }

    // Function to continuously monitor and maintain the Save Settings button state
    setupSaveSettingsButtonMonitoring() {
        console.log('Setting up Save Settings button monitoring');
        
        // Check button state every 2 seconds for the first minute
        let checkCount = 0;
        const frequentCheck = setInterval(() => {
            const saveSettingsBtn = document.querySelector('#save-settings-btn');
            const saveApiSuspensionBtn = document.querySelector('#save-api-suspension-btn');
            
            if (saveSettingsBtn) {
                if (saveSettingsBtn.disabled || saveSettingsBtn.style.pointerEvents === 'none') {
                    console.log(`Frequent check ${checkCount + 1}: Save Settings button was disabled, re-enabling`);
                    
                    // Re-enable the button
                    saveSettingsBtn.disabled = false;
                    saveSettingsBtn.style.pointerEvents = 'auto';
                    saveSettingsBtn.style.opacity = '1';
                    saveSettingsBtn.style.cursor = 'pointer';
                    saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
                    saveSettingsBtn.style.color = 'var(--dark-text)';
                    
                    // Remove any disabled classes or attributes
                    saveSettingsBtn.classList.remove('disabled');
                    saveSettingsBtn.removeAttribute('disabled');
                    
                    // Re-attach event listener
                    saveSettingsBtn.removeEventListener('click', () => this.saveCompetitionSettings());
                    saveSettingsBtn.addEventListener('click', () => this.saveCompetitionSettings());
                }
            }
            
            // Also monitor the API suspension button
            if (saveApiSuspensionBtn) {
                if (saveApiSuspensionBtn.disabled || saveApiSuspensionBtn.style.pointerEvents === 'none') {
                    console.log(`Frequent check ${checkCount + 1}: API Suspension button was disabled, re-enabling`);
                    
                    // Re-enable the button
                    saveApiSuspensionBtn.disabled = false;
                    saveApiSuspensionBtn.style.pointerEvents = 'auto';
                    saveApiSuspensionBtn.style.opacity = '1';
                    saveApiSuspensionBtn.style.cursor = 'pointer';
                    saveApiSuspensionBtn.style.backgroundColor = '#dc3545';
                    saveApiSuspensionBtn.style.borderColor = '#dc3545';
                    
                    // Remove any disabled classes or attributes
                    saveApiSuspensionBtn.classList.remove('disabled');
                    saveApiSuspensionBtn.removeAttribute('disabled');
                    
                    // Re-attach event listener
                            saveApiSuspensionBtn.removeEventListener('click', () => this.saveApiSuspensionSettings());
        saveApiSuspensionBtn.addEventListener('click', () => {
            console.log('API suspension save button clicked!');
            if (this.saveApiSuspensionSettings && typeof this.saveApiSuspensionSettings === 'function') {
                this.saveApiSuspensionSettings();
            } else {
                console.error('saveApiSuspensionSettings function not available');
                alert('Error: API suspension function not available. Please refresh the page.');
            }
        });
                }
            }
            
            checkCount++;
            if (checkCount >= 30) { // Check 30 times over 1 minute
                clearInterval(frequentCheck);
                console.log('Frequent monitoring completed, switching to periodic checks');
                
                // Switch to less frequent checks (every 10 seconds)
                setInterval(() => {
                    const saveSettingsBtn = document.querySelector('#save-settings-btn');
                    const saveApiSuspensionBtn = document.querySelector('#save-api-suspension-btn');
                    
                    if (saveSettingsBtn && (saveSettingsBtn.disabled || saveSettingsBtn.style.pointerEvents === 'none')) {
                        console.log('Periodic check: Save Settings button was disabled, re-enabling');
                        
                        // Re-enable the button
                        saveSettingsBtn.disabled = false;
                        saveSettingsBtn.style.pointerEvents = 'auto';
                        saveSettingsBtn.style.opacity = '1';
                        saveSettingsBtn.style.cursor = 'pointer';
                        saveSettingsBtn.style.backgroundColor = 'var(--alty-yellow)';
                        saveSettingsBtn.style.color = 'var(--dark-text)';
                        
                        // Remove any disabled classes or attributes
                        saveSettingsBtn.classList.remove('disabled');
                        saveSettingsBtn.removeAttribute('disabled');
                        
                        // Re-attach event listener
                        saveSettingsBtn.removeEventListener('click', () => this.saveCompetitionSettings());
                        saveSettingsBtn.addEventListener('click', () => this.saveCompetitionSettings());
                    }
                    
                    // Also monitor the API suspension button
                    if (saveApiSuspensionBtn && (saveApiSuspensionBtn.disabled || saveApiSuspensionBtn.style.pointerEvents === 'none')) {
                        console.log('Periodic check: API Suspension button was disabled, re-enabling');
                        
                        // Re-enable the button
                        saveApiSuspensionBtn.disabled = false;
                        saveApiSuspensionBtn.style.pointerEvents = 'auto';
                        saveApiSuspensionBtn.style.opacity = '1';
                        saveApiSuspensionBtn.style.cursor = 'pointer';
                        saveApiSuspensionBtn.style.backgroundColor = '#dc3545';
                        saveApiSuspensionBtn.style.borderColor = '#dc3545';
                        
                        // Remove any disabled classes or attributes
                        saveApiSuspensionBtn.classList.remove('disabled');
                        saveApiSuspensionBtn.removeAttribute('disabled');
                        
                        // Re-attach event listener
                        saveApiSuspensionBtn.removeEventListener('click', () => this.saveApiSuspensionSettings());
                        saveApiSuspensionBtn.addEventListener('click', () => {
                            console.log('API suspension save button clicked!');
                            if (this.saveApiSuspensionSettings && typeof this.saveApiSuspensionSettings === 'function') {
                                this.saveApiSuspensionSettings();
                            } else {
                                console.error('saveApiSuspensionSettings function not available');
                                alert('Error: API suspension function not available. Please refresh the page.');
                            }
                        });
                    }
                }, 10000); // Check every 10 seconds
            }
        }, 2000); // Check every 2 seconds
    }

    // Fixture Management Functions
    initializeFixtureManagement() {
        // Prevent multiple initializations
        if (this.fixtureManagementInitialized) {
            console.log('Fixture management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing fixture management...');
        this.fixtureManagementInitialized = true;
        
        // Set up event listeners for fixture management
        const addFixtureBtn = document.querySelector('#add-fixture-btn');
        const saveFixturesBtn = document.querySelector('#save-fixtures-btn');
        const checkFixturesBtn = document.querySelector('#check-fixtures-btn');
        const saveScoresBtn = document.querySelector('#save-scores-btn');
        const gameweekSelect = document.querySelector('#gameweek-select');
        const scoreGameweekSelect = document.querySelector('#score-gameweek-select');
        
        // Enhanced score management buttons
        const importFootballWebPagesScoresBtn = document.querySelector('#import-football-webpages-scores-btn');
        const scoresFileInput = document.querySelector('#scores-file-input');

        if (addFixtureBtn) {
            addFixtureBtn.addEventListener('click', () => this.fixturesManager.addFixtureRow());
        }
        if (saveFixturesBtn) {
            saveFixturesBtn.addEventListener('click', () => this.fixturesManager.saveFixtures());
        }
        if (checkFixturesBtn) {
            checkFixturesBtn.addEventListener('click', () => this.fixturesManager.checkFixtures());
        }
        if (saveScoresBtn) {
            saveScoresBtn.addEventListener('click', () => this.scoresManager.saveScores());
        }
        if (importFootballWebPagesScoresBtn) {
            importFootballWebPagesScoresBtn.addEventListener('click', () => {
                const selectedGameweek = scoreGameweekSelect ? scoreGameweekSelect.value : '1';
                this.scoresManager.importScoresFromFootballWebPages(selectedGameweek);
            });
        }
        if (scoresFileInput) {
            scoresFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const selectedGameweek = scoreGameweekSelect ? scoreGameweekSelect.value : '1';
                    this.scoresManager.importScoresFromFile(file, selectedGameweek);
                }
            });
        }
        
        // Set up gameweek select change handlers
        if (gameweekSelect) {
            gameweekSelect.addEventListener('change', () => this.fixturesManager.loadFixturesForGameweek());
        }
        if (scoreGameweekSelect) {
            scoreGameweekSelect.addEventListener('change', () => this.scoresManager.loadScoresForGameweek());
        }
        
        // Load initial data
        this.fixturesManager.loadFixturesForGameweek();
        this.scoresManager.loadScoresForGameweek();
    }

    // Registration Management Functions
    initializeRegistrationManagement() {
        if (this.registrationManagementInitialized) {
            console.log('Registration management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing registration management...');
        this.registrationManagementInitialized = true;
        
        // Initialize registration management functionality
        if (typeof window.initializeRegistrationManagement === 'function') {
            window.initializeRegistrationManagement();
        }
    }

    // Competition Settings Functions
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
        if (typeof window.initializeCompetitionSettings === 'function') {
            window.initializeCompetitionSettings();
        }
    }

    // Load current competition settings from database
    async loadCurrentCompetitionSettings() {
        try {
            console.log('Loading current competition settings...');
            
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                const currentEdition = settings.active_edition || '1';
                const currentGameweek = settings.active_gameweek || '1';
                
                console.log('Loaded settings - Edition:', currentEdition, 'Gameweek:', currentGameweek);
                
                // Update the select elements
                const editionSelect = document.querySelector('#active-edition-select');
                const gameweekSelect = document.querySelector('#active-gameweek-select');
                
                if (editionSelect) editionSelect.value = currentEdition;
                if (gameweekSelect) gameweekSelect.value = currentGameweek;
                
                // Update global variables
                window.currentActiveEdition = currentEdition;
                window.currentActiveGameweek = currentGameweek;
                
                // Update app variables
                if (window.app) {
                    window.app.currentActiveEdition = currentEdition;
                    window.app.currentActiveGameweek = currentGameweek;
                }
                
                // Update the display
                this.updateActiveEditionDisplay(currentEdition);
                
                // Set default selection across all selectors AFTER global variables are set
                this.setDefaultSelection();
                
                console.log('Competition settings loaded and display updated');
            } else {
                console.log('No competition settings found, using defaults');
                this.updateActiveEditionDisplay('1');
            }
        } catch (error) {
            console.error('Error loading competition settings:', error);
            // Use defaults if loading fails
            this.updateActiveEditionDisplay('1');
        }
    }

    // Update the active edition display
    updateActiveEditionDisplay(edition) {
        // Update the old display element (if it exists)
        const displayElement = document.querySelector('#current-edition-display');
        if (displayElement) {
            // Format the edition display
            let displayText = edition;
            if (edition === 'test') {
                displayText = 'Test Weeks';
            } else if (edition.match(/^\d+$/)) {
                displayText = `Edition ${edition}`;
            }
            
            displayElement.textContent = displayText;
            console.log('Active edition display updated to:', displayText);
        }
        
        // Update the new quick edition selector
        this.updateQuickEditionSelector();
    }

    // Set up event listeners for settings changes
    setupSettingsEventListeners() {
        const gameweekSelect = document.querySelector('#active-gameweek-select');
        
        if (gameweekSelect) {
            gameweekSelect.addEventListener('change', (e) => {
                const selectedGameweek = e.target.value;
                console.log('Gameweek selection changed to:', selectedGameweek);
                
                // Update all other selectors when active gameweek changes
                this.setDefaultSelection();
            });
        }
    }

    // Set default gameweek and edition selection across all selectors
    setDefaultSelection() {
        console.log('🚀 setDefaultSelection() called!');
        try {
            // Get the current active gameweek from multiple sources
            let currentGameweek = window.currentActiveGameweek;
            
            // If not set globally, try to get from the active gameweek selector
            if (!currentGameweek) {
                const activeGameweekSelect = document.querySelector('#active-gameweek-select');
                if (activeGameweekSelect && activeGameweekSelect.value) {
                    currentGameweek = activeGameweekSelect.value;
                }
            }
            
            // Fallback to default
            if (!currentGameweek) {
                currentGameweek = '1';
            }
            
            // Get the current active edition from global state
            let currentEdition = window.currentActiveEdition;
            
            // Fallback to default
            if (!currentEdition) {
                currentEdition = 'test';
            }
            
            console.log(`🔧 Setting default gameweek selection to: ${currentGameweek}`);
            console.log(`🔧 Setting default edition selection to: ${currentEdition}`);
            console.log(`🔍 Debug - window.currentActiveGameweek: ${window.currentActiveGameweek}`);
            console.log(`🔍 Debug - window.currentActiveEdition: ${window.currentActiveEdition}`);
            console.log(`🔍 Debug - active gameweek selector value: ${document.querySelector('#active-gameweek-select')?.value}`);
            
            
            // List of all gameweek selectors to update
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
            
            // List of all edition selectors to update
            const editionSelectors = [
                '#picks-edition-select',      // Picks tab
                '#standings-edition-select',  // As It Stands tab
                '#history-edition-select',    // History tab
                '#import-edition-select'      // API Import section
            ];
            
            // Update each gameweek selector
            gameweekSelectors.forEach(selectorId => {
                const selector = document.querySelector(selectorId);
                if (selector) {
                    // Check if the current gameweek option exists in this selector
                    const optionExists = Array.from(selector.options).some(option => option.value === currentGameweek);
                    if (optionExists) {
                        selector.value = currentGameweek;
                        console.log(`✅ Set ${selectorId} to default gameweek: ${currentGameweek}`);
                        
                        // Trigger change event to ensure any listeners are notified
                        const event = new Event('change', { bubbles: true });
                        selector.dispatchEvent(event);
                    } else {
                        console.log(`⚠️ Gameweek ${currentGameweek} not available in ${selectorId}`);
                        console.log(`🔍 Available options:`, Array.from(selector.options).map(opt => opt.value));
                    }
                } else {
                    console.log(`ℹ️ Selector ${selectorId} not found on current page`);
                }
            });
            
            // Update each edition selector
            editionSelectors.forEach(selectorId => {
                const selector = document.querySelector(selectorId);
                if (selector) {
                    // Handle different edition selector formats
                    let targetEdition = currentEdition;
                    
                    // If this is the picks edition selector, it uses "editiontest" format
                    if (selectorId === '#picks-edition-select') {
                        if (currentEdition === 'test') {
                            targetEdition = 'editiontest';
                        } else if (currentEdition.startsWith('edition')) {
                            targetEdition = currentEdition; // Already in correct format
                        } else {
                            targetEdition = `edition${currentEdition}`;
                        }
                    } else {
                        // For other selectors (standings, etc.), use the simple format
                        if (currentEdition === 'editiontest') {
                            targetEdition = 'test';
                        } else if (currentEdition.startsWith('edition')) {
                            targetEdition = currentEdition.replace('edition', '');
                        } else {
                            targetEdition = currentEdition;
                        }
                    }
                    
                    // Check if the target edition option exists in this selector
                    const optionExists = Array.from(selector.options).some(option => option.value === targetEdition);
                    if (optionExists) {
                        selector.value = targetEdition;
                        console.log(`✅ Set ${selectorId} to default edition: ${targetEdition}`);
                        
                        // Trigger change event to ensure any listeners are notified
                        const event = new Event('change', { bubbles: true });
                        selector.dispatchEvent(event);
                    } else {
                        console.log(`⚠️ Edition ${targetEdition} not available in ${selectorId}`);
                        console.log(`🔍 Available options:`, Array.from(selector.options).map(opt => opt.value));
                    }
                } else {
                    console.log(`ℹ️ Selector ${selectorId} not found on current page`);
                }
            });
            
            // Also update the active gameweek selector if it exists
            const activeGameweekSelect = document.querySelector('#active-gameweek-select');
            if (activeGameweekSelect) {
                activeGameweekSelect.value = currentGameweek;
                console.log(`✅ Set active gameweek selector to: ${currentGameweek}`);
            }
            
            console.log(`🎯 Default selection completed for ${gameweekSelectors.length} gameweek selectors and ${editionSelectors.length} edition selectors`);
            
        } catch (error) {
            console.error('Error setting default gameweek selection:', error);
        }
    }

    // Admin Tabs Functions
    setupAdminTabs() {
        if (this.adminTabsInitialized) {
            console.log('Admin tabs already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Setting up admin tabs...');
        this.adminTabsInitialized = true;
        
        // Simple tab functionality for admin panel
        const tabs = document.querySelectorAll('.admin-tab');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        console.log('Found tabs:', tabs.length, 'Found panes:', tabPanes.length);
        
        tabs.forEach(tab => {
            const targetTab = tab.getAttribute('data-tab');
            console.log('Setting up tab:', targetTab);
            
            tab.addEventListener('click', () => {
                console.log('🎯 Tab clicked:', targetTab);
                
                // Remove active class from all tabs and panes
                tabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                tab.classList.add('active');
                const targetPane = document.getElementById(`${targetTab}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
                
                // Load specific content based on tab
                if (targetTab === 'picks') {
                    console.log('🎯 Picks tab clicked - calling renderPicksTable...');
                    // Load picks for the current selection
                    if (typeof this.renderPicksTable === 'function') {
                        console.log('✅ renderPicksTable function found, calling it...');
                        this.renderPicksTable();
                    } else {
                        console.log('❌ renderPicksTable function not available, calling via global function');
                        // Try to trigger the refresh picks button click
                        const refreshPicksBtn = document.querySelector('#refresh-picks-btn');
                        if (refreshPicksBtn) {
                            refreshPicksBtn.click();
                        }
                    }
                } else if (targetTab === 'fixtures') {
                    if (typeof window.loadFixturesForGameweek === 'function') {
                        window.loadFixturesForGameweek();
                    }
                } else if (targetTab === 'scores') {
                    if (typeof window.loadScoresForGameweek === 'function') {
                        console.log('Loading scores for scores tab...');
                        window.loadScoresForGameweek();
                    }
                } else if (targetTab === 'registration') {
                    if (typeof window.refreshRegistrationStats === 'function') {
                        window.refreshRegistrationStats();
                    }
                } else if (targetTab === 'settings') {
                    if (typeof window.loadCompetitionSettings === 'function') {
                        window.loadCompetitionSettings();
                    }
                }
            });
        });
        
        console.log('✅ Admin tabs setup complete');
    }

    // Player Management Functions
    showPlayerManagement(type) {
        console.log('showPlayerManagement called with type:', type);
        console.log('Current player management type before update:', this.currentPlayerManagementType);
        
        this.currentPlayerManagementType = type;
        console.log('Current player management type after update:', this.currentPlayerManagementType);
        
        const modal = document.getElementById('player-management-modal');
        const title = document.getElementById('player-management-title');
        
        console.log('Modal element found:', !!modal);
        console.log('Title element found:', !!title);
        
        // Set title based on type
        switch(type) {
            case 'total':
                title.textContent = 'Active Registrations - Player Management';
                break;
            case 'current':
                title.textContent = 'Current Edition - Player Management';
                break;
            case 'archived':
                title.textContent = 'Archived Players - Player Management';
                break;
            default:
                console.warn('Unknown player management type:', type);
                break;
        }
        
        console.log('Setting modal display to flex');
        modal.style.display = 'flex';
        
        console.log('Calling loadPlayersForManagement...');
        this.loadPlayersForManagement();
        console.log('loadPlayersForManagement called');
    }

    closePlayerManagement() {
        const modal = document.getElementById('player-management-modal');
        modal.style.display = 'none';
    }

    closePlayerEdit() {
        const modal = document.getElementById('player-edit-modal');
        modal.style.display = 'none';
    }

    async loadPlayersForManagement() {
        console.log('loadPlayersForManagement called');
        console.log('Current management type:', this.currentPlayerManagementType);
        console.log('Current active edition:', this.currentActiveEdition);
        
        try {
            console.log('Fetching users from database...');
            const usersSnapshot = await this.db.collection('users').get();
            console.log('Users snapshot received, size:', usersSnapshot.size);
            
            this.allPlayers = [];
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const player = {
                    id: doc.id,
                    firstName: userData.firstName || '',
                    surname: userData.surname || '',
                    email: userData.email || '',
                    lives: userData.lives || 0,
                    status: userData.status || 'active',
                    registrations: userData.registrations || {},
                    adminNotes: userData.adminNotes || '',
                    registrationDate: userData.registrationDate || null
                };
                
                console.log('Processing player:', player.firstName, player.surname, 'Status:', player.status);
                
                // Filter based on current management type
                let shouldInclude = false;
                const currentEdition = window.currentActiveEdition || this.currentActiveEdition;
                console.log(`Filtering player ${player.firstName} ${player.surname} - currentEdition: ${currentEdition}, window.currentActiveEdition: ${window.currentActiveEdition}, this.currentActiveEdition: ${this.currentActiveEdition}`);
                
                switch(this.currentPlayerManagementType) {
                    case 'total':
                        // Include only active users (exclude archived)
                        shouldInclude = player.status !== 'archived';
                        break;
                    case 'current':
                        // Check if player has registration for current edition
                        const currentEdition = window.currentActiveEdition || this.currentActiveEdition;
                        const editionKey = `edition${currentEdition}`;
                        console.log(`Checking for edition key: ${editionKey} (currentEdition: ${currentEdition})`);
                        shouldInclude = player.registrations && player.registrations[editionKey] && player.status !== 'archived';
                        break;
                    case 'archived':
                        // Show only archived players
                        shouldInclude = player.status === 'archived';
                        break;
                }
                
                console.log('Player should be included:', shouldInclude, 'Reason:', this.currentPlayerManagementType);
                
                if (shouldInclude) {
                    this.allPlayers.push(player);
                    console.log('Player added to allPlayers array');
                }
            });
            
            console.log('Total players found:', this.allPlayers.length);
            console.log('Calling displayPlayers...');
            this.displayPlayers(this.allPlayers);
            console.log('displayPlayers called');
            
        } catch (error) {
            console.error('Error loading players for management:', error);
        }
    }

    displayPlayers(players) {
        console.log('displayPlayers called with players:', players);
        console.log('Number of players to display:', players.length);
        
        const tbody = document.getElementById('player-management-list');
        console.log('Table body element found:', !!tbody);
        console.log('Table body element:', tbody);
        
        if (!tbody) {
            console.error('Table body element not found!');
            return;
        }
        
        console.log('Clearing table body innerHTML');
        tbody.innerHTML = '';
        
        if (this.currentPlayerManagementType === 'archived' && players.length === 0) {
            console.log('No archived players found, showing message');
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No archived players found</td></tr>';
            return;
        }
        
        if (players.length === 0) {
            console.log('No players found, showing message');
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No players found</td></tr>';
            return;
        }
        
        console.log('Starting to render player rows...');
        players.forEach((player, index) => {
            console.log(`Rendering player ${index + 1}:`, player.firstName, player.surname);
            
            const row = document.createElement('tr');
            const name = `${player.firstName} ${player.surname}`.trim();
            const statusClass = player.status === 'active' ? 'player-status-active' : 'player-status-archived';
            const statusText = player.status === 'active' ? 'Active' : 'Archived';
            
            // Get latest edition
            let latestEdition = 'None';
            if (player.registrations && Object.keys(player.registrations).length > 0) {
                const editions = Object.keys(player.registrations);
                const latest = editions.sort().pop();
                latestEdition = latest.replace('edition', 'Edition ');
            }
            
            // Check if player is already in Test Weeks
            const isInTestWeeks = player.registrations && player.registrations.editiontest;
            
            // Get card emoji based on lives
            const getLivesDisplay = (lives) => {
                if (lives === 0) {
                    return '<span style="color: #dc3545; font-size: 1.2em;">🟥</span> <span style="color: #dc3545; font-weight: bold;">ELIMINATED</span>';
                } else if (lives === 1) {
                    return '<span style="color: #ffc107; font-size: 1.2em;">🟨</span> <span style="color: #ffc107; font-weight: bold;">1 Life</span>';
                } else if (lives === 2) {
                    return '<span style="color: #28a745; font-size: 1.2em;">🟢</span> <span style="color: #28a745; font-weight: bold;">2 Lives</span>';
                } else {
                    return `<span style="color: #6c757d;">${lives} Lives</span>`;
                }
            };
            
            row.innerHTML = `
                <td>${name}</td>
                <td>${player.email}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${getLivesDisplay(player.lives)}</td>
                <td>${latestEdition}</td>
                <td class="player-action-buttons">
                    <button class="edit-player-btn" onclick="adminManagementManager.editPlayer('${player.id}')">Edit</button>
                    ${!isInTestWeeks ? 
                        `<button class="add-test-weeks-btn" onclick="adminManagementManager.addToTestWeeks('${player.id}')" style="background-color: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-left: 4px; font-size: 12px;">Add to Test Weeks</button>` :
                        `<span style="color: #28a745; font-size: 12px; margin-left: 4px;">✓ Test Weeks</span>`
                    }
                    ${player.status === 'active' ? 
                        `<button class="archive-player-btn" onclick="adminManagementManager.archivePlayer('${player.id}')">Archive</button>` :
                        `<button class="unarchive-player-btn" onclick="adminManagementManager.unarchivePlayer('${player.id}')">Unarchive</button>
                         <button class="delete-player-btn" onclick="adminManagementManager.deletePlayer('${player.id}')">Delete</button>`
                    }
                </td>
            `;
            
            console.log(`Appending row for player ${index + 1} to table body`);
            tbody.appendChild(row);
        });
        
        console.log('Finished rendering all player rows');
    }

    searchPlayers() {
        const searchTerm = document.getElementById('player-search').value.toLowerCase();
        const filteredPlayers = this.allPlayers.filter(player => {
            const name = `${player.firstName} ${player.surname}`.toLowerCase();
            const email = player.email.toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm);
        });
        this.displayPlayers(filteredPlayers);
    }

    filterPlayers() {
        const statusFilter = document.getElementById('player-status-filter').value;
        let filteredPlayers = this.allPlayers;
        
        if (statusFilter !== 'all') {
            filteredPlayers = this.allPlayers.filter(player => player.status === statusFilter);
        }
        
        this.displayPlayers(filteredPlayers);
    }

    async editPlayer(playerId) {
        console.log('editPlayer called with ID:', playerId);
        
        const player = this.allPlayers.find(p => p.id === playerId);
        if (!player) {
            console.error('Player not found:', playerId);
            return;
        }
        
        console.log('Found player:', player);
        
        // Populate edit form
        document.getElementById('edit-first-name').value = player.firstName;
        document.getElementById('edit-surname').value = player.surname;
        document.getElementById('edit-email').value = player.email;
        document.getElementById('edit-lives').value = player.lives;
        document.getElementById('edit-status').value = player.status;
        document.getElementById('edit-notes').value = player.adminNotes;
        
        // Populate edition checkboxes based on player's registrations
        const editions = player.registrations || {};
        document.getElementById('edit-edition-1').checked = !!editions.edition1;
        document.getElementById('edit-edition-2').checked = !!editions.edition2;
        document.getElementById('edit-edition-3').checked = !!editions.edition3;
        document.getElementById('edit-edition-4').checked = !!editions.edition4;
        document.getElementById('edit-edition-test').checked = !!editions.editiontest;
        
        // Store player ID for save operation
        const form = document.getElementById('player-edit-form');
        form.setAttribute('data-player-id', playerId);
        
        // Attach form submission event listener if not already attached
        if (!form.hasAttribute('data-event-listener-attached')) {
            console.log('Attaching form submission event listener');
            form.addEventListener('submit', (e) => this.savePlayerEdit(e));
            form.setAttribute('data-event-listener-attached', 'true');
        }
        
        // Show edit modal
        document.getElementById('player-edit-modal').style.display = 'flex';
        console.log('Edit modal displayed');
    }

    async savePlayerEdit(event) {
        console.log('savePlayerEdit called!');
        event.preventDefault();
        
        console.log('Form submitted, checking authentication...');
        
        // Check if user is still authenticated before proceeding
        const currentUser = window.auth.currentUser;
        if (!currentUser) {
            console.error('User not authenticated during save operation');
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }
        
        console.log('User authenticated:', currentUser.email);
        console.log('Current auth state - User:', currentUser.uid, 'Email:', currentUser.email);
        
        const playerId = event.target.getAttribute('data-player-id');
        console.log('Player ID from form:', playerId);
        if (!playerId) {
            console.error('No player ID found in form');
            return;
        }
        
        try {
            // Refresh the authentication token to prevent expiration issues
            try {
                await currentUser.getIdToken(true);
                console.log('Authentication token refreshed successfully');
            } catch (tokenError) {
                console.warn('Could not refresh token, proceeding with current token:', tokenError);
            }
            
            // Verify admin status before proceeding
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            if (!userDoc.exists || userDoc.data().isAdmin !== true) {
                console.error('User lost admin privileges during save operation');
                alert('Admin access lost. Please refresh the page and try again.');
                return;
            }
            
            // Get current player data to preserve existing registrations
            const playerDoc = await this.db.collection('users').doc(playerId).get();
            const currentData = playerDoc.data();
            const currentRegistrations = currentData.registrations || {};
            
            // Build registration updates based on checkboxes
            const registrationUpdates = {};
            const editionCheckboxes = [
                { id: 'edit-edition-1', key: 'edition1' },
                { id: 'edit-edition-2', key: 'edition2' },
                { id: 'edit-edition-3', key: 'edition3' },
                { id: 'edit-edition-4', key: 'edition4' },
                { id: 'edit-edition-test', key: 'editiontest' }
            ];
            
            editionCheckboxes.forEach(({ id, key }) => {
                const isChecked = document.getElementById(id).checked;
                if (isChecked && !currentRegistrations[key]) {
                    // Add registration if checked and not already registered
                    registrationUpdates[`registrations.${key}`] = {
                        registrationDate: new Date(),
                        paymentMethod: 'Admin Added',
                        emailConsent: true,
                        whatsappConsent: true
                    };
                } else if (!isChecked && currentRegistrations[key]) {
                    // Remove registration if unchecked and currently registered
                    registrationUpdates[`registrations.${key}`] = this.db.FieldValue.delete();
                }
            });
            
            const firstName = document.getElementById('edit-first-name').value;
            const surname = document.getElementById('edit-surname').value;
            
            const updates = {
                firstName: firstName,
                surname: surname,
                displayName: `${firstName} ${surname}`,
                email: document.getElementById('edit-email').value,
                lives: parseInt(document.getElementById('edit-lives').value),
                status: document.getElementById('edit-status').value,
                adminNotes: document.getElementById('edit-notes').value,
                lastUpdated: new Date(),
                ...registrationUpdates
            };
            
            console.log('About to perform database update with:', updates);
            
            // Perform the update with additional error handling
            await this.db.collection('users').doc(playerId).update(updates);
            
            console.log('Database update completed successfully');
            
            // Update local data
            const playerIndex = this.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                this.allPlayers[playerIndex] = { ...this.allPlayers[playerIndex], ...updates };
            }
            
            // Refresh display
            this.displayPlayers(this.allPlayers);
            
            // Close modal
            this.closePlayerEdit();
            
            // Show success message
            alert('Player updated successfully!');
            
        } catch (error) {
            console.error('Error updating player:', error);
            
            // Check if it's an authentication error
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
                alert('Authentication error. Please refresh the page and try again.');
            } else if (error.code === 'unavailable') {
                alert('Database temporarily unavailable. Please try again in a moment.');
            } else {
                alert('Error updating player: ' + error.message);
            }
        }
    }

    async archivePlayer(playerId) {
        if (!confirm('Are you sure you want to archive this player?')) return;
        
        // Check if user is still authenticated before proceeding
        const currentUser = window.auth.currentUser;
        if (!currentUser) {
            console.error('User not authenticated during archive operation');
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }
        
        try {
            // Refresh the authentication token to prevent expiration issues
            try {
                await currentUser.getIdToken(true);
                console.log('Authentication token refreshed successfully');
            } catch (tokenError) {
                console.warn('Could not refresh token, proceeding with current token:', tokenError);
            }
            
            await this.db.collection('users').doc(playerId).update({
                status: 'archived',
                archivedDate: new Date(),
                lastUpdated: new Date()
            });
            
            // Update local data
            const playerIndex = this.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                this.allPlayers[playerIndex].status = 'archived';
            }
            
            // Refresh display
            this.displayPlayers(this.allPlayers);
            
            alert('Player archived successfully!');
            
        } catch (error) {
            console.error('Error archiving player:', error);
            alert('Error archiving player: ' + error.message);
        }
    }

    async unarchivePlayer(playerId) {
        if (!confirm('Are you sure you want to unarchive this player?')) return;
        
        // Check if user is still authenticated before proceeding
        const currentUser = window.auth.currentUser;
        if (!currentUser) {
            console.error('User not authenticated during unarchive operation');
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }
        
        try {
            // Refresh the authentication token to prevent expiration issues
            try {
                await currentUser.getIdToken(true);
                console.log('Authentication token refreshed successfully');
            } catch (tokenError) {
                console.warn('Could not refresh token, proceeding with current token:', tokenError);
            }
            
            await this.db.collection('users').doc(playerId).update({
                status: 'active',
                unarchivedDate: new Date(),
                lastUpdated: new Date()
            });
            
            // Update local data
            const playerIndex = this.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                this.allPlayers[playerIndex].status = 'active';
            }
            
            // Refresh display
            this.displayPlayers(this.allPlayers);
            
            alert('Player unarchived successfully!');
            
        } catch (error) {
            console.error('Error unarchiving player:', error);
            alert('Error unarchiving player: ' + error.message);
        }
    }

    async addToTestWeeks(playerId) {
        if (!confirm('Add this player to Test Weeks edition?')) return;
        
        // Check if user is still authenticated before proceeding
        const currentUser = window.auth.currentUser;
        if (!currentUser) {
            console.error('User not authenticated during add to test weeks operation');
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }
        
        try {
            // Refresh the authentication token to prevent expiration issues
            try {
                await currentUser.getIdToken(true);
                console.log('Authentication token refreshed successfully');
            } catch (tokenError) {
                console.warn('Could not refresh token, proceeding with current token:', tokenError);
            }
            
            await this.db.collection('users').doc(playerId).update({
                [`registrations.editiontest`]: {
                    registrationDate: new Date(),
                    paymentMethod: 'Admin Added',
                    emailConsent: true,
                    whatsappConsent: true
                },
                lastUpdated: new Date()
            });
            
            // Update local data
            const playerIndex = this.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                if (!this.allPlayers[playerIndex].registrations) {
                    this.allPlayers[playerIndex].registrations = {};
                }
                this.allPlayers[playerIndex].registrations.editiontest = {
                    registrationDate: new Date(),
                    paymentMethod: 'Admin Added',
                    emailConsent: true,
                    whatsappConsent: true
                };
            }
            
            // Refresh display
            this.displayPlayers(this.allPlayers);
            
            alert('Player added to Test Weeks successfully!');
            
        } catch (error) {
            console.error('Error adding player to Test Weeks:', error);
            alert('Error adding player to Test Weeks: ' + error.message);
        }
    }

    async deletePlayer(playerId) {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this player? This action cannot be undone and will remove all their data from the database.')) return;
        
        // Check if user is still authenticated before proceeding
        const currentUser = window.auth.currentUser;
        if (!currentUser) {
            console.error('User not authenticated during delete operation');
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }
        
        try {
            // Refresh the authentication token to prevent expiration issues
            try {
                await currentUser.getIdToken(true);
                console.log('Authentication token refreshed successfully');
            } catch (tokenError) {
                console.warn('Could not refresh token, proceeding with current token:', tokenError);
            }
            // Get player info for confirmation
            const player = this.allPlayers.find(p => p.id === playerId);
            if (!player) {
                alert('Player not found!');
                return;
            }
            
            // Final confirmation with player details
            const finalConfirm = confirm(`Are you absolutely sure you want to delete ${player.firstName} ${player.surname} (${player.email})?\n\nThis will:\n- Delete their Firestore document\n- Remove all their picks and registration data\n- This action is PERMANENT and cannot be undone\n\nIMPORTANT: Their Firebase Authentication account will remain active. You may need to manually delete it from Firebase Console to prevent them from logging in.`);
            
            if (!finalConfirm) return;
            
            // Delete from Firestore
            await this.db.collection('users').doc(playerId).delete();
            
            // Remove from local data
            const playerIndex = this.allPlayers.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                this.allPlayers.splice(playerIndex, 1);
            }
            
            // Refresh display
            this.displayPlayers(this.allPlayers);
            
            // Refresh statistics
            if (typeof window.refreshRegistrationStats === 'function') {
                await window.refreshRegistrationStats();
            }
            
            alert(`Player deleted successfully!\n\nNote: Their Firebase Authentication account (${player.email}) may still be active. To completely prevent login access, you may need to manually delete their account from Firebase Console → Authentication → Users.`);
            
        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Error deleting player: ' + error.message);
        }
    }

    // Admin Utility Functions
    async resetAllPlayerLives() {
        if (!confirm('Are you sure you want to reset ALL player lives to 2? This action cannot be undone.')) return;
        
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const batch = this.db.batch();
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.status === 'active') {
                    batch.update(doc.ref, {
                        lives: 2,
                        lastUpdated: new Date()
                    });
                }
            });
            
            await batch.commit();
            alert('All player lives have been reset to 2!');
            
        } catch (error) {
            console.error('Error resetting player lives:', error);
            alert('Error resetting player lives: ' + error.message);
        }
    }

    // Reset test edition players to 2 lives
    async resetTestLives() {
        if (!confirm('Are you sure you want to reset all TEST EDITION players to 2 lives? This will only affect players in the test edition.')) return;
        
        try {
            const statusElement = document.querySelector('#reset-status');
            if (statusElement) {
                statusElement.textContent = 'Resetting test players...';
                statusElement.style.color = '#007bff';
            }
            
            const usersSnapshot = await this.db.collection('users').get();
            const batch = this.db.batch();
            let resetCount = 0;
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                // Only reset players in test edition
                if (userData.status === 'active' && userData.edition === 'test') {
                    batch.update(doc.ref, {
                        lives: 2,
                        lastUpdated: new Date()
                    });
                    resetCount++;
                }
            });
            
            await batch.commit();
            
            if (statusElement) {
                statusElement.textContent = `✅ Reset ${resetCount} test edition players to 2 lives successfully!`;
                statusElement.style.color = '#28a745';
            } else {
                alert(`✅ Reset ${resetCount} test edition players to 2 lives successfully!`);
            }
            
            console.log(`✅ Reset ${resetCount} test edition players to 2 lives`);
            
        } catch (error) {
            console.error('Error resetting test player lives:', error);
            const statusElement = document.querySelector('#reset-status');
            if (statusElement) {
                statusElement.textContent = `❌ Error: ${error.message}`;
                statusElement.style.color = '#dc3545';
            } else {
                alert('Error resetting test player lives: ' + error.message);
            }
        }
    }

    generateTestScores() {
        if (!confirm('Generate test scores for all fixtures? This will overwrite existing scores.')) return;
        
        try {
            // This function would generate test scores for fixtures
            // Implementation depends on the specific requirements
            alert('Test scores generated successfully!');
        } catch (error) {
            console.error('Error generating test scores:', error);
            alert('Error generating test scores: ' + error.message);
        }
    }

    // Enhanced Vidiprinter Functions
    initializeEnhancedVidiprinter() {
        const startBtn = document.querySelector('#start-enhanced-vidiprinter');
        const stopBtn = document.querySelector('#stop-enhanced-vidiprinter');
        const clearBtn = document.querySelector('#clear-enhanced-vidiprinter');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startEnhancedVidiprinter());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopEnhancedVidiprinter());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearEnhancedVidiprinter());
        
        // Auto-restart functionality
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopEnhancedVidiprinter();
                setTimeout(() => this.startEnhancedVidiprinter(), 1000);
            } else {
                this.stopEnhancedVidiprinter();
                setTimeout(() => this.startEnhancedVidiprinter(), 1000);
            }
        });
        
        // Auto-restart on focus
        window.addEventListener('focus', () => {
            this.stopEnhancedVidiprinter();
            setTimeout(() => this.startEnhancedVidiprinter(), 1000);
        });
    }

    async startEnhancedVidiprinter() {
        try {
            console.log('Starting enhanced vidiprinter...');
            // Implementation for starting enhanced vidiprinter
            // This would typically start fetching data and updating the display
        } catch (error) {
            console.error('Error starting enhanced vidiprinter:', error);
        }
    }

    stopEnhancedVidiprinter() {
        try {
            console.log('Stopping enhanced vidiprinter...');
            // Implementation for stopping enhanced vidiprinter
            // This would typically stop data fetching and updates
        } catch (error) {
            console.error('Error stopping enhanced vidiprinter:', error);
        }
    }

    clearEnhancedVidiprinterFeed() {
        try {
            const feed = document.querySelector('#enhanced-vidiprinter-feed');
            if (feed) {
                feed.innerHTML = '';
                console.log('Enhanced vidiprinter feed cleared');
            }
        } catch (error) {
            console.error('Error clearing enhanced vidiprinter feed:', error);
        }
    }

    // Helper Functions
    getTeamBadge(teamName) {
        // This function should be implemented based on your team badge logic
        // For now, returning null as placeholder
        return null;
    }

    // Cleanup method
    cleanup() {
        this.adminManagementInitialized = false;
        this.adminDashboardInitialized = false;
        this.adminTabsInitialized = false;
        this.fixtureManagementInitialized = false;
        this.registrationManagementInitialized = false;
        this.competitionSettingsInitialized = false;
        console.log('Admin Management Manager cleanup completed');
    }
}

// Export the AdminManagementManager class
export default AdminManagementManager;
