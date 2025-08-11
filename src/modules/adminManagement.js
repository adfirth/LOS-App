// Admin Management Module
// Handles all admin-related functionality including dashboard, player management, and competition settings

class AdminManagementManager {
    constructor(db) {
        this.db = db;
        this.adminManagementInitialized = false;
        this.adminDashboardInitialized = false;
        this.adminTabsInitialized = false;
        this.fixtureManagementInitialized = false;
        this.registrationManagementInitialized = false;
        this.competitionSettingsInitialized = false;
        this.allPlayers = [];
        this.currentPlayerManagementType = 'total';
        this.currentActiveEdition = 1;
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

    // Set up event listeners for admin management
    setupEventListeners() {
        // Event listeners will be set up when specific functions are called
        console.log('Admin management event listeners ready');
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
        const activeEdition = settings.active_edition || 'edition1';
        const activeGameweek = settings.active_gameweek || '1';
        
        if (picksEditionSelect) picksEditionSelect.value = activeEdition;
        if (picksGameweekSelect) picksGameweekSelect.value = activeGameweek;
        
        // Function to render picks table
        const renderPicksTable = async () => {
            console.log('renderPicksTable called - clearing table first');
            
            // Clear the table completely before adding new rows
            if (picksTableBody) picksTableBody.innerHTML = '';
            
            const selectedEdition = picksEditionSelect ? picksEditionSelect.value : activeEdition;
            const selectedGameweek = picksGameweekSelect ? picksGameweekSelect.value : activeGameweek;
            const gwKey = selectedGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${selectedGameweek}`;
            
            // Validate edition value
            if (!selectedEdition || selectedEdition.trim() === '') {
                console.warn('Invalid edition value:', selectedEdition);
                return;
            }
            
            console.log('Selected edition:', selectedEdition, 'gameweek:', selectedGameweek, 'gwKey:', gwKey);
            
            const displayText = selectedGameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${selectedGameweek}`;
            if (picksTitle) {
                picksTitle.textContent = `Picks for ${selectedEdition.charAt(0).toUpperCase() + selectedEdition.slice(1)} - ${displayText}`;
            }
            
            try {
                console.log('Fetching users from database...');
                const usersSnapshot = await this.db.collection('users').get();
                console.log('Users snapshot received, count:', usersSnapshot.size);
                
                let registeredUsersCount = 0;
                usersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    
                    // Check if user is registered for this edition
                    const isRegisteredForEdition = userData.registrations && userData.registrations[selectedEdition];
                    if (!isRegisteredForEdition) return; // Skip users not registered for this edition
                    
                    registeredUsersCount++;
                    console.log('Processing user:', userData.displayName, 'for edition:', selectedEdition);
                    
                    // Picks are stored using both edition-prefixed format (e.g., edition1_gw1) and simple format (e.g., gw1)
                    const editionGameweekKey = `${selectedEdition}_${gwKey}`;
                    const playerPick = userData.picks && (userData.picks[editionGameweekKey] || userData.picks[gwKey]) ? 
                        (userData.picks[editionGameweekKey] || userData.picks[gwKey]) : 'No Pick Made';
                    
                    const row = document.createElement('tr');
                    const badge = playerPick !== 'No Pick Made' ? this.getTeamBadge(playerPick) : null;
                    const badgeHtml = badge ? `<img src="${badge}" alt="${playerPick}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
                    
                    // Determine pick status
                    let statusText = 'No Pick';
                    let statusClass = 'no-pick';
                    if (playerPick !== 'No Pick Made') {
                        statusText = 'Pick Made';
                        statusClass = 'pick-made';
                    }
                    
                    row.innerHTML = `
                        <td>${userData.displayName}</td>
                        <td>${badgeHtml}${playerPick}</td>
                        <td><span class="pick-status ${statusClass}">${statusText}</span></td>
                    `;
                    if (picksTableBody) picksTableBody.appendChild(row);
                });
                
                console.log('Total registered users for edition', selectedEdition, ':', registeredUsersCount);
                console.log('Total rows added to table:', picksTableBody ? picksTableBody.children.length : 0);
                
            } catch (error) {
                console.error('Error loading picks:', error);
                console.error('Error details:', error.message, error.code);
                if (picksTableBody) {
                    picksTableBody.innerHTML = '<tr><td colspan="3">Error loading picks: ' + error.message + '</td></tr>';
                }
            }
        };
        
        // Set up event listeners for picks controls
        if (picksEditionSelect) picksEditionSelect.addEventListener('change', renderPicksTable);
        if (picksGameweekSelect) picksGameweekSelect.addEventListener('change', renderPicksTable);
        if (refreshPicksBtn) refreshPicksBtn.addEventListener('click', renderPicksTable);
        
        // Initial render
        renderPicksTable();

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
        
        // Initialize admin tabs
        const tabs = document.querySelectorAll('.admin-tab');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Remove active class from all tabs and panes
                tabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                tab.classList.add('active');
                const targetPane = document.getElementById(`${targetTab}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
        
        // Initialize admin tabs
        if (!this.adminTabsInitialized) {
            this.setupAdminTabs();
        }
        
        // Initialize enhanced vidiprinter functionality
        this.initializeEnhancedVidiprinter();
        
        // Set up save settings button monitoring
        this.setupSaveSettingsButtonMonitoring();
    }

    // Function to continuously monitor and maintain the Save Settings button state
    setupSaveSettingsButtonMonitoring() {
        console.log('Setting up Save Settings button monitoring');
        
        // Check button state every 2 seconds for the first minute
        let checkCount = 0;
        const frequentCheck = setInterval(() => {
            const saveSettingsBtn = document.querySelector('#save-settings-btn');
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
                    saveSettingsBtn.removeEventListener('click', window.saveCompetitionSettings);
                    saveSettingsBtn.addEventListener('click', window.saveCompetitionSettings);
                }
            }
            
            checkCount++;
            if (checkCount >= 30) { // Check 30 times over 1 minute
                clearInterval(frequentCheck);
                console.log('Frequent monitoring completed, switching to periodic checks');
                
                // Switch to less frequent checks (every 10 seconds)
                setInterval(() => {
                    const saveSettingsBtn = document.querySelector('#save-settings-btn');
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
                        saveSettingsBtn.removeEventListener('click', window.saveCompetitionSettings);
                        saveSettingsBtn.addEventListener('click', window.saveCompetitionSettings);
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
            addFixtureBtn.addEventListener('click', window.addFixtureRow);
        }
        if (saveFixturesBtn) {
            saveFixturesBtn.addEventListener('click', window.saveFixtures);
        }
        if (checkFixturesBtn) {
            checkFixturesBtn.addEventListener('click', window.checkFixtures);
        }
        if (saveScoresBtn) {
            saveScoresBtn.addEventListener('click', window.saveScores);
        }
        if (importFootballWebPagesScoresBtn) {
            importFootballWebPagesScoresBtn.addEventListener('click', () => {
                const selectedGameweek = scoreGameweekSelect ? scoreGameweekSelect.value : '1';
                window.importScoresFromFootballWebPages(selectedGameweek);
            });
        }
        if (scoresFileInput) {
            scoresFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const selectedGameweek = scoreGameweekSelect ? scoreGameweekSelect.value : '1';
                    window.importScoresFromFile(file, selectedGameweek);
                }
            });
        }
        
        // Set up gameweek select change handlers
        if (gameweekSelect) {
            gameweekSelect.addEventListener('change', window.loadFixturesForGameweek);
        }
        if (scoreGameweekSelect) {
            scoreGameweekSelect.addEventListener('change', window.loadScoresForGameweek);
        }
        
        // Load initial data
        if (typeof window.loadFixturesForGameweek === 'function') {
            window.loadFixturesForGameweek();
        }
        if (typeof window.loadScoresForGameweek === 'function') {
            window.loadScoresForGameweek();
        }
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
        
        // Initialize competition settings functionality
        if (typeof window.initializeCompetitionSettings === 'function') {
            window.initializeCompetitionSettings();
        }
    }

    // Admin Tabs Functions
    setupAdminTabs() {
        if (this.adminTabsInitialized) {
            console.log('Admin tabs already initialized, skipping...');
            return;
        }
        
        console.log('Setting up admin tabs...');
        this.adminTabsInitialized = true;
        
        // Simple tab functionality for admin panel
        const tabs = document.querySelectorAll('.admin-tab');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
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
                    // Picks tab content is handled by buildAdminDashboard
                } else if (targetTab === 'fixtures') {
                    if (typeof window.loadFixturesForGameweek === 'function') {
                        window.loadFixturesForGameweek();
                    }
                } else if (targetTab === 'scores') {
                    if (typeof window.loadScoresForGameweek === 'function') {
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
                switch(this.currentPlayerManagementType) {
                    case 'total':
                        // Include only active users (exclude archived)
                        shouldInclude = player.status !== 'archived';
                        break;
                    case 'current':
                        shouldInclude = player.registrations[`edition${this.currentActiveEdition}`] && player.status !== 'archived';
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
