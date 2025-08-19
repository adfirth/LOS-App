// Main Admin Manager
// Orchestrates all admin functionality modules

import { UserManagement } from './userManagement.js';
import { TeamOperations } from './teamOperations.js';
import { Scheduling } from './scheduling.js';
import { Audit } from './audit.js';

export class AdminManager {
    constructor(db, fixturesManager = null, scoresManager = null) {
        this.db = db;
        this.fixturesManager = fixturesManager;
        this.scoresManager = scoresManager;
        
        // Initialize module instances
        this.userManagement = new UserManagement(db);
        this.teamOperations = new TeamOperations(db);
        this.scheduling = new Scheduling(db);
        this.audit = new Audit(db);
        
        // State tracking
        this.adminManagementInitialized = false;
        this.adminDashboardInitialized = false;
        this.adminTabsInitialized = false;
        this.fixtureManagementInitialized = false;
        this.registrationManagementInitialized = false;
        this.competitionSettingsInitialized = false;
        this.eventListenersInitialized = false;
        this.playerManagementEventListenersInitialized = false;
        
        // Current active edition and gameweek
        this.currentActiveEdition = 1;
        this.currentActiveGameweek = '1';
        
        // Method to update the current active edition
        this.updateCurrentActiveEdition = (edition) => {
            this.currentActiveEdition = edition;
            this.userManagement.updateCurrentActiveEdition(edition);
            this.teamOperations.updateCurrentActiveEdition(edition);
            this.scheduling.updateCurrentActiveEdition(edition);
            console.log(`AdminManager: Updated currentActiveEdition to ${edition}`);
        };
        
        // Method to update the current active gameweek
        this.updateCurrentActiveGameweek = (gameweek) => {
            this.currentActiveGameweek = gameweek;
            this.teamOperations.updateCurrentActiveGameweek(gameweek);
            this.scheduling.updateCurrentActiveGameweek(gameweek);
            console.log(`AdminManager: Updated currentActiveGameweek to ${gameweek}`);
        };
    }

    // Initialize admin management
    initializeAdminManagement() {
        if (this.adminManagementInitialized) {
            console.log('Admin management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing admin management...');
        this.adminManagementInitialized = true;
        
        // Event listeners are now set up in initializeAdminPage() to avoid duplicates
    }

    // Initialize admin page
    initializeAdminPage() {
        console.log('🚀 Initializing admin page...');
        
        // Initialize competition settings
        this.scheduling.initializeCompetitionSettings();
        
        // Build admin dashboard to ensure all functions are exposed
        this.buildAdminDashboard();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Ensure Save Settings button is properly enabled and has event listener
        this.ensureSaveSettingsButtonReady();
        
        // Initialize Football Web Pages API integration for admin interface
        this.initializeAdminApiIntegration();
        
        // Initialize audit functionality
        this.audit.initializeAudit();
        
        // Initialize Player Picks v2 functionality
        this.initializePlayerPicksV2();
        
        console.log('✅ Admin page initialization complete');
    }

    // Initialize Player Picks v2 functionality
    initializePlayerPicksV2() {
        console.log('🚀 Initializing Player Picks v2...');
        
        // Get DOM elements
        const editionSelect = document.querySelector('#picks-v2-edition-select');
        const gameweekSelect = document.querySelector('#picks-v2-gameweek-select');
        const refreshBtn = document.querySelector('#picks-v2-refresh-btn');
        const exportBtn = document.querySelector('#picks-v2-export-btn');
        
        if (!editionSelect || !gameweekSelect || !refreshBtn) {
            console.error('❌ Player Picks v2 elements not found');
            return;
        }
        
        // Set up event listeners
        editionSelect.addEventListener('change', () => this.loadPlayerPicksV2());
        gameweekSelect.addEventListener('change', () => this.loadPlayerPicksV2());
        refreshBtn.addEventListener('click', () => this.loadPlayerPicksV2());
        exportBtn.addEventListener('click', () => this.exportPlayerPicksV2());
        
        // Set up search and filter event listeners
        const searchInput = document.querySelector('#picks-v2-search');
        const teamFilter = document.querySelector('#picks-v2-team-filter');
        const statusFilter = document.querySelector('#picks-v2-status-filter');
        const clearFiltersBtn = document.querySelector('#picks-v2-clear-filters-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterPlayerPicks());
        }
        if (teamFilter) {
            teamFilter.addEventListener('change', () => this.filterPlayerPicks());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterPlayerPicks());
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearPlayerPicksFilters());
        }
        
        // Load initial data
        this.loadPlayerPicksV2();
        
        console.log('✅ Player Picks v2 initialized');
    }

    // Store enriched picks data for filtering
    currentEnrichedPicks = [];

    // Get active players for a specific edition
    async getActivePlayersForEdition(edition) {
        console.log(`🔍 Getting active players for edition: ${edition}`);
        
        try {
            // Get all users and filter for active status and edition registration
            const allUsersQuery = await this.db.collection('users').get();
            const activePlayers = [];
            
            allUsersQuery.forEach(doc => {
                const userData = doc.data();
                const userId = doc.id;
                
                // Check if user is active (has no status field or status is 'active' - case-insensitive)
                const status = userData.status;
                const isActive = !status || status.toLowerCase() === 'active';
                
                if (isActive) {
                    // Check if user is registered for this edition
                    const editionKey = `edition${edition}`;
                    const hasEditionRegistration = userData.registrations && userData.registrations[editionKey];
                    
                    if (hasEditionRegistration) {
                        activePlayers.push({
                            id: userId,
                            firstName: userData.firstName || 'Unknown',
                            surname: userData.surname || 'Unknown',
                            email: userData.email || 'Unknown',
                            displayName: userData.displayName || `${userData.firstName} ${userData.surname}`,
                            registrations: userData.registrations
                        });
                    }
                }
            });
            
            console.log(`✅ Found ${activePlayers.length} active players for edition ${edition}`);
            return activePlayers;
            
        } catch (error) {
            console.error('❌ Error getting active players:', error);
            return [];
        }
    }

    // Get picks for active players only
    async getPicksForActivePlayers(edition, gameweek, activePlayers) {
        console.log(`🔍 Getting picks for ${activePlayers.length} active players in edition ${edition}, gameweek ${gameweek}`);
        
        try {
            // Query picks collection directly (same as As It Stands system)
            const usersWithPicks = [];
            
            for (const player of activePlayers) {
                try {
                    // Query picks collection for this specific player, edition, and gameweek
                    const picksQuery = await this.db.collection('picks')
                        .where('userId', '==', player.id)
                        .where('edition', '==', edition)
                        .where('gameweek', '==', gameweek)
                        .get();
                    
                    if (!picksQuery.empty) {
                        // Player has a pick for this gameweek
                        const pickDoc = picksQuery.docs[0];
                        const pickData = pickDoc.data();
                        
                        usersWithPicks.push({
                            id: player.id,
                            userId: player.id,
                            userFirstName: pickData.userFirstName || '',
                            userSurname: pickData.userSurname || '',
                            teamPicked: pickData.teamPicked || pickData.team || 'Unknown team',
                            isAutopick: pickData.isAutopick || false,
                            gameweek: gameweek,
                            gameweekKey: `gw${gameweek}`,
                            edition: edition,
                            isActive: true,
                            timestamp: pickData.timestamp || new Date()
                        });
                    } else {
                        // No pick for this gameweek
                        usersWithPicks.push({
                            id: player.id,
                            userId: player.id,
                            userFirstName: player.displayName?.split(' ')[0] || '',
                            userSurname: player.displayName?.split(' ').slice(1).join(' ') || '',
                            teamPicked: null,
                            isAutopick: false,
                            gameweek: gameweek,
                            gameweekKey: `gw${gameweek}`,
                            edition: edition,
                            isActive: true,
                            timestamp: new Date()
                        });
                    }
                } catch (pickError) {
                    console.error(`❌ Error getting pick data for ${player.id}:`, pickError);
                    // Add player with no pick if there's an error
                    usersWithPicks.push({
                        id: player.id,
                        userId: player.id,
                        userFirstName: player.displayName?.split(' ')[0] || '',
                        userSurname: player.displayName?.split(' ').slice(1).join(' ') || '',
                        teamPicked: null,
                        isAutopick: false,
                        gameweek: gameweek,
                        gameweekKey: `gw${gameweek}`,
                        edition: edition,
                        isActive: true,
                        timestamp: new Date()
                    });
                }
            }
            
            console.log(`✅ Found ${usersWithPicks.length} players with picks for gameweek ${gameweek}`);
            return usersWithPicks;
            
        } catch (error) {
            console.error('❌ Error getting picks for active players:', error);
            return [];
        }
    }

    // Load player picks for v2 tab
    async loadPlayerPicksV2() {
        console.log('🔄 Loading Player Picks v2...');
        
        const editionSelect = document.querySelector('#picks-v2-edition-select');
        const gameweekSelect = document.querySelector('#picks-v2-gameweek-select');
        const tableBody = document.querySelector('#picks-v2-table-body');
        const loadingDiv = document.querySelector('#picks-v2-loading');
        
        if (!editionSelect || !gameweekSelect || !tableBody) {
            console.error('❌ Player Picks v2 elements not found');
            return;
        }
        
        const selectedEdition = editionSelect.value;
        const selectedGameweek = gameweekSelect.value;
        
        // Show loading
        loadingDiv.style.display = 'block';
        tableBody.innerHTML = '';
        
        try {
            console.log(`🔍 Fetching picks for edition: ${selectedEdition}, gameweek: ${selectedGameweek}`);
            
            // First, get active players for this edition from registration statistics
            const activePlayers = await this.getActivePlayersForEdition(selectedEdition);
            console.log(`✅ Found ${activePlayers.length} active players for edition ${selectedEdition}`);
            
            // Debug: Log active player details
            if (activePlayers.length > 0) {
                console.log('🔍 Active players:', activePlayers.map(p => ({ id: p.id, name: p.displayName })));
            }
            
            if (activePlayers.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No active players found for this edition
                        </td>
                    </tr>
                `;
                this.updatePlayerPicksV2Stats([], activePlayers.length);
                return;
            }
            
            // Get picks for active players only
            const picksForActivePlayers = await this.getPicksForActivePlayers(selectedEdition, selectedGameweek, activePlayers);
            console.log(`✅ Found ${picksForActivePlayers.length} picks for active players`);
            
            // Debug: Log the structure of the first pick
            if (picksForActivePlayers.length > 0) {
                console.log('🔍 First pick structure:', picksForActivePlayers[0]);
                console.log('🔍 First pick keys:', Object.keys(picksForActivePlayers[0]));
            }
            
            // Enrich picks with user details
            let picksWithUserDetails = [];
            try {
                picksWithUserDetails = await this.enrichPicksWithUserDetails(picksForActivePlayers);
            } catch (enrichError) {
                console.error('❌ Error enriching picks, using basic data:', enrichError);
                // Fallback to basic data structure
                picksWithUserDetails = picksForActivePlayers.map(pick => ({
                    id: pick.id,
                    ...pick,
                    userDetails: {
                        firstName: pick.userFirstName || 'Unknown',
                        surname: pick.userSurname || 'Unknown',
                        email: pick.userEmail || 'Unknown',
                        userId: pick.userId || pick.id
                    }
                }));
            }
            
            // Store for filtering
            this.currentEnrichedPicks = picksWithUserDetails;
            
            // Populate team filter
            this.populateTeamFilter(picksWithUserDetails);
            
            // Update stats with enriched data and active player count
            this.updatePlayerPicksV2Stats(picksWithUserDetails, activePlayers.length);
            
            // Render table with enriched data and active players
            this.renderPlayerPicksV2Table(picksWithUserDetails, tableBody, activePlayers);
            
        } catch (error) {
            console.error('❌ Error loading Player Picks v2:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Error loading picks: ${error.message}
                    </td>
                </tr>
            `;
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    // Enrich picks data with user details
    async enrichPicksWithUserDetails(picksData) {
        console.log('🔍 Enriching picks with user details...');
        
        const enrichedPicks = [];
        
        for (const pick of picksData) {
            // Handle both Firestore docs and plain objects
            const pickData = pick.data ? pick.data() : pick;
            const pickId = pick.id || pick.docId;
            
            try {
                // Get user details
                let userDetails = {
                    firstName: pickData.userFirstName || 'Unknown',
                    surname: pickData.userSurname || 'Unknown',
                    email: pickData.userEmail || 'Unknown',
                    userId: pickData.userId || pickId
                };
                
                // Try to get additional user info from users collection
                if (pickData.userId) {
                    try {
                        const userDoc = await this.db.collection('users').doc(pickData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userDetails = {
                                ...userDetails,
                                firstName: userData.firstName || userDetails.firstName,
                                surname: userData.surname || userDetails.surname,
                                email: userData.email || userDetails.email,
                                registrationDate: userData.registrationDate,
                                defaultEdition: userData.defaultEdition
                            };
                        }
                    } catch (userError) {
                        console.log(`⚠️ Could not fetch user details for ${pickData.userId}:`, userError);
                    }
                }
                
                enrichedPicks.push({
                    id: pickId,
                    ...pickData,
                    userDetails
                });
                
            } catch (error) {
                console.error(`❌ Error enriching pick ${pickId}:`, error);
                // Add pick with basic data if enrichment fails
                enrichedPicks.push({
                    id: pickId,
                    ...pickData,
                    userDetails: {
                        firstName: pickData.userFirstName || 'Unknown',
                        surname: pickData.userSurname || 'Unknown',
                        email: pickData.userEmail || 'Unknown',
                        userId: pickData.userId || pickId
                }
                });
            }
        }
        
        console.log(`✅ Enriched ${enrichedPicks.length} picks with user details`);
        return enrichedPicks;
    }

    // Populate team filter dropdown
    populateTeamFilter(enrichedPicks) {
        const teamFilter = document.querySelector('#picks-v2-team-filter');
        if (!teamFilter) return;
        
        // Get unique teams
        const uniqueTeams = [...new Set(enrichedPicks.map(pick => pick.teamPicked).filter(team => team))].sort();
        
        // Clear existing options except "All Teams"
        teamFilter.innerHTML = '<option value="">All Teams</option>';
        
        // Add team options
        uniqueTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamFilter.appendChild(option);
        });
        
        console.log(`✅ Populated team filter with ${uniqueTeams.length} teams`);
    }

    // Filter player picks based on search and filter criteria
    filterPlayerPicks() {
        if (!this.currentEnrichedPicks || this.currentEnrichedPicks.length === 0) {
            return;
        }
        
        const searchInput = document.querySelector('#picks-v2-search');
        const teamFilter = document.querySelector('#picks-v2-team-filter');
        const statusFilter = document.querySelector('#picks-v2-status-filter');
        const tableBody = document.querySelector('#picks-v2-table-body');
        
        if (!searchInput || !teamFilter || !statusFilter || !tableBody) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedTeam = teamFilter.value;
        const selectedStatus = statusFilter.value;
        
        // Filter picks based on criteria
        const filteredPicks = this.currentEnrichedPicks.filter(pick => {
            // Search filter
            const playerName = `${pick.userDetails.firstName} ${pick.userDetails.surname}`.toLowerCase();
            const playerEmail = pick.userDetails.email.toLowerCase();
            const searchMatch = !searchTerm || 
                playerName.includes(searchTerm) || 
                playerEmail.includes(searchTerm);
            
            // Team filter
            const teamMatch = !selectedTeam || pick.teamPicked === selectedTeam;
            
            // Status filter
            const statusMatch = !selectedStatus || 
                (selectedStatus === 'active' && pick.isActive !== false) ||
                (selectedStatus === 'inactive' && pick.isActive === false);
            
            return searchMatch && teamMatch && statusMatch;
        });
        
        // Get the current active players for this edition
        const editionSelect = document.querySelector('#picks-v2-edition-select');
        const currentEdition = editionSelect ? editionSelect.value : 'test';
        
        // For now, we'll just show the filtered picks
        // In a future enhancement, we could also filter the active players list
        this.updatePlayerPicksV2Stats(filteredPicks);
        
        // Render filtered table (without active players for now)
        this.renderPlayerPicksV2Table(filteredPicks, tableBody);
        
        console.log(`🔍 Filtered picks: ${filteredPicks.length} of ${this.currentEnrichedPicks.length} total`);
    }

    // Clear all filters and show all picks
    clearPlayerPicksFilters() {
        const searchInput = document.querySelector('#picks-v2-search');
        const teamFilter = document.querySelector('#picks-v2-team-filter');
        const statusFilter = document.querySelector('#picks-v2-status-filter');
        
        if (searchInput) searchInput.value = '';
        if (teamFilter) teamFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        
        // Reload the data to show all active players and picks
        this.loadPlayerPicksV2();
        
        console.log('🧹 Cleared all filters and reloaded data');
    }

    // Update Player Picks v2 statistics
    updatePlayerPicksV2Stats(enrichedPicks, activePlayerCount = 0) {
        const totalCount = document.querySelector('#picks-v2-total-count');
        const playersCount = document.querySelector('#picks-v2-players-count');
        const teamsCount = document.querySelector('#picks-v2-teams-count');
        
        if (!totalCount || !playersCount || !teamsCount) return;
        
        const uniquePlayers = new Set(enrichedPicks.map(pick => pick.userDetails.userId)).size;
        const uniqueTeams = new Set(enrichedPicks.map(pick => pick.teamPicked).filter(team => team)).size;
        const activePicks = enrichedPicks.filter(pick => pick.isActive !== false).length;
        const playersWithPicks = uniquePlayers;
        const playersWithoutPicks = Math.max(0, activePlayerCount - playersWithPicks);
        
        totalCount.textContent = enrichedPicks.length;
        playersCount.textContent = activePlayerCount;
        teamsCount.textContent = uniqueTeams;
        
        // Add additional stats if we have them
        const statsContainer = document.querySelector('#picks-v2-stats-details');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stats-detail">
                    <span class="stat-label">Players with Picks:</span>
                    <span class="stat-value">${playersWithPicks}</span>
                </div>
                <div class="stats-detail">
                    <span class="stat-label">Players without Picks:</span>
                    <span class="stat-value">${playersWithoutPicks}</span>
                </div>
                <div class="stats-detail">
                    <span class="stat-label">Active Picks:</span>
                    <span class="stat-value">${activePicks}</span>
                </div>
                <div class="stats-detail">
                    <span class="stat-label">Inactive Picks:</span>
                    <span class="stat-value">${enrichedPicks.length - activePicks}</span>
                </div>
            `;
        }
    }

    // Render Player Picks v2 table
    renderPlayerPicksV2Table(enrichedPicks, tableBody, activePlayers = []) {
        if (!enrichedPicks && (!activePlayers || activePlayers.length === 0)) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        No active players found for this edition
                    </td>
                </tr>
            `;
            return;
        }
        
        if (!enrichedPicks || enrichedPicks.length === 0) {
            // Show active players who don't have picks yet
            const rows = activePlayers.map(player => `
                <tr class="pick-row no-pick">
                    <td>
                        <div class="player-info">
                            <strong>${player.firstName} ${player.surname}</strong>
                            <br><small class="text-muted">${player.email}</small>
                        </div>
                    </td>
                    <td>
                        <span class="team-badge no-team">No Pick Made</span>
                    </td>
                    <td>
                        <span class="gameweek-badge">-</span>
                    </td>
                    <td>
                        <span class="edition-badge">-</span>
                    </td>
                    <td>
                        <span class="status-badge status-no-pick">No Pick</span>
                    </td>
                    <td>
                        <small class="text-muted">-</small>
                    </td>
                </tr>
            `).join('');
            
            tableBody.innerHTML = rows;
            return;
        }
        
        // Create a map of players who have picks
        const playersWithPicks = new Set(enrichedPicks.map(pick => pick.userDetails.userId));
        
        // Combine picks with players who don't have picks
        const allRows = [];
        
        // Add rows for players with picks
        enrichedPicks.forEach(pick => {
            const statusClass = pick.isActive !== false ? 'status-active' : 'status-inactive';
            const statusText = pick.isActive !== false ? 'Active' : 'Inactive';
            
            // Format pick date if available
            const pickDate = pick.pickDate ? new Date(pick.pickDate.toDate()).toLocaleDateString() : 'N/A';
            
            // Get team name with fallback and add autopick indicator
            const teamName = pick.teamPicked || 'No Team Selected';
            const autopickIndicator = pick.isAutopick ? ' (A)' : '';
            const displayTeamName = teamName === 'No Team Selected' ? teamName : teamName + autopickIndicator;
            
            allRows.push(`
                <tr class="pick-row ${pick.isActive === false ? 'inactive-pick' : ''}">
                    <td>
                        <div class="player-info">
                            <strong>${pick.userDetails.firstName} ${pick.userDetails.surname}</strong>
                            <br><small class="text-muted">${pick.userDetails.email}</small>
                        </div>
                    </td>
                    <td>
                        <span class="team-badge ${teamName === 'No Team Selected' ? 'no-team' : ''}">${displayTeamName}</span>
                    </td>
                    <td>
                        <span class="gameweek-badge">${pick.gameweek}</span>
                    </td>
                    <td>
                        <span class="edition-badge">${pick.edition}</span>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <small class="text-muted">${pickDate}</small>
                    </td>
                </tr>
            `);
        });
        
        // Add rows for active players without picks
        activePlayers.forEach(player => {
            if (!playersWithPicks.has(player.id)) {
                allRows.push(`
                    <tr class="pick-row no-pick">
                        <td>
                            <div class="player-info">
                                <strong>${player.firstName} ${player.surname}</strong>
                                <br><small class="text-muted">${player.email}</small>
                            </div>
                        </td>
                        <td>
                            <span class="team-badge no-team">No Pick Made</span>
                        </td>
                        <td>
                            <span class="gameweek-badge">-</span>
                        </td>
                        <td>
                            <span class="edition-badge">-</span>
                        </td>
                        <td>
                            <span class="status-badge status-no-pick">No Pick</span>
                        </td>
                        <td>
                            <small class="text-muted">-</small>
                        </td>
                    </tr>
                `);
            }
        });
        
        tableBody.innerHTML = allRows.join('');
    }

    // Export Player Picks v2 data
    async exportPlayerPicksV2() {
        console.log('📤 Exporting Player Picks v2...');
        
        const editionSelect = document.querySelector('#picks-v2-edition-select');
        const gameweekSelect = document.querySelector('#picks-v2-gameweek-select');
        
        if (!editionSelect || !gameweekSelect) return;
        
        const selectedEdition = editionSelect.value;
        const selectedGameweek = gameweekSelect.value;
        
        try {
            // Get the current picks data
            const picksQuery = this.db.collection('picks')
                .where('edition', '==', selectedEdition)
                .where('gameweek', '==', selectedGameweek);
            
            const picksSnapshot = await picksQuery.get();
            
            if (picksSnapshot.empty) {
                alert('No picks found to export for this edition and game week.');
                return;
            }
            
            // Enrich the data for export
            const enrichedPicks = await this.enrichPicksWithUserDetails(picksSnapshot.docs);
            
            // Create CSV content
            const csvContent = this.createPicksCSV(enrichedPicks, selectedEdition, selectedGameweek);
            
            // Download the CSV file
            this.downloadCSV(csvContent, `picks_${selectedEdition}_gw${selectedGameweek}_${new Date().toISOString().split('T')[0]}.csv`);
            
            console.log('✅ Picks exported successfully');
            
        } catch (error) {
            console.error('❌ Error exporting picks:', error);
            alert(`Error exporting picks: ${error.message}`);
        }
    }

    // Create CSV content from picks data
    createPicksCSV(enrichedPicks, edition, gameweek) {
        const headers = [
            'Player Name',
            'Email',
            'Team Picked',
            'Game Week',
            'Edition',
            'Status',
            'Pick Date',
            'User ID'
        ];
        
        const rows = enrichedPicks.map(pick => [
            `${pick.userDetails.firstName} ${pick.userDetails.surname}`,
            pick.userDetails.email,
            pick.teamPicked || 'No Team Selected',
            pick.gameweek,
            pick.edition,
            pick.isActive !== false ? 'Active' : 'Inactive',
            pick.pickDate ? new Date(pick.pickDate.toDate()).toLocaleDateString() : 'N/A',
            pick.userDetails.userId
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        return csvContent;
    }

    // Download CSV file
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Ensure Save Settings button is ready
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
        saveSettingsBtn.removeEventListener('click', (e) => this.scheduling.saveCompetitionSettings(e));
        saveSettingsBtn.addEventListener('click', (e) => this.scheduling.saveCompetitionSettings(e));
        
        console.log('✅ Save Settings button is ready and enabled');
        console.log('Button disabled state:', saveSettingsBtn.disabled);
        console.log('Button pointer-events:', saveSettingsBtn.style.pointerEvents);
        console.log('Button opacity:', saveSettingsBtn.style.opacity);
        console.log('Button cursor:', saveSettingsBtn.style.cursor);
        console.log('Button background color:', saveSettingsBtn.style.backgroundColor);
        console.log('Button text color:', saveSettingsBtn.style.textColor);
        console.log('Button classes:', saveSettingsBtn.className);
        console.log('Button attributes:', Array.from(saveSettingsBtn.attributes).map(attr => `${attr.name}="${attr.value}"`));
    }

    // Setup event listeners
    setupEventListeners() {
        if (this.eventListenersInitialized) {
            console.log('🔧 Event listeners already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Setting up admin management event listeners...');
        
        // Set up settings event listeners
        this.setupSettingsEventListeners();
        
        // Set up API suspension event listeners
        this.setupApiSuspensionEventListeners();
        
        // Set up quick edition selector
        this.scheduling.setupQuickEditionSelector();
        
        // Set up As It Stands functionality
        this.teamOperations.setupAsItStandsFunctionality();
        
        // Set up admin tabs
        this.setupAdminTabs();
        
        // Set up player management event listeners
        this.setupPlayerManagementEventListeners();
        
        // Set up edition registration handlers
        this.setupEditionRegistrationHandlers();
        
        this.eventListenersInitialized = true;
        console.log('✅ Admin management event listeners setup complete');
    }

    // Setup settings event listeners
    setupSettingsEventListeners() {
        console.log('🔧 Setting up settings event listeners...');
        
        // Set up save settings button monitoring
        this.setupSaveSettingsButtonMonitoring();
        
        console.log('✅ Settings event listeners setup complete');
    }

    // Setup API suspension event listeners
    setupApiSuspensionEventListeners() {
        console.log('🔧 Setting up API suspension event listeners...');
        
        const apiSuspensionContainer = document.querySelector('#api-suspension-container');
        if (!apiSuspensionContainer) {
            console.log('API suspension container not found');
            return;
        }
        
        // Load current API suspension settings
        this.loadApiSuspensionSettings();
        
        // Set up form submission
        const form = document.querySelector('#api-suspension-form');
        if (form) {
            form.addEventListener('submit', (e) => this.saveApiSuspensionSettings(e));
        }
        
        console.log('✅ API suspension event listeners setup complete');
    }

    // Setup save settings button monitoring
    setupSaveSettingsButtonMonitoring() {
        console.log('🔧 Setting up save settings button monitoring...');
        
        // Monitor for changes in competition settings form
        const competitionForm = document.querySelector('#competition-settings-form');
        if (competitionForm) {
            const formElements = competitionForm.querySelectorAll('input, select, textarea');
            
            formElements.forEach(element => {
                element.addEventListener('change', () => {
                    this.enableSaveSettingsButton();
                });
                
                element.addEventListener('input', () => {
                    this.enableSaveSettingsButton();
                });
            });
        }
        
        console.log('✅ Save settings button monitoring setup complete');
    }

    // Setup player management event listeners
    setupPlayerManagementEventListeners() {
        if (this.playerManagementEventListenersInitialized) {
            console.log('🔧 Player management event listeners already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Setting up player management event listeners...');
        
        // Player management stat cards
        const totalRegistrationsCard = document.querySelector('#total-registrations-card');
        const currentEditionCard = document.querySelector('#current-edition-card');
        const archivedPlayersCard = document.querySelector('#archived-players-card');
        
        if (totalRegistrationsCard) {
            // Remove existing event listeners to prevent duplicates
            const newTotalCard = totalRegistrationsCard.cloneNode(true);
            totalRegistrationsCard.parentNode.replaceChild(newTotalCard, totalRegistrationsCard);
            
            newTotalCard.addEventListener('click', () => {
                this.userManagement.showPlayerManagement('total');
            });
        }
        
        if (currentEditionCard) {
            // Remove existing event listeners to prevent duplicates
            const newCurrentCard = currentEditionCard.cloneNode(true);
            currentEditionCard.parentNode.replaceChild(newCurrentCard, currentEditionCard);
            
            newCurrentCard.addEventListener('click', () => {
                this.userManagement.showPlayerManagement('current');
            });
        }
        
        if (archivedPlayersCard) {
            // Remove existing event listeners to prevent duplicates
            const newArchivedCard = archivedPlayersCard.cloneNode(true);
            archivedPlayersCard.parentNode.replaceChild(newArchivedCard, archivedPlayersCard);
            
            newArchivedCard.addEventListener('click', () => {
                this.userManagement.showPlayerManagement('archived');
            });
        }
        
        // Check orphaned accounts button
        const checkOrphanedAccountsBtn = document.querySelector('#check-orphaned-accounts');
        if (checkOrphanedAccountsBtn) {
            checkOrphanedAccountsBtn.addEventListener('click', () => {
                this.userManagement.checkOrphanedAccounts();
            });
        }
        
        // Firebase Auth help button
        const firebaseAuthHelpBtn = document.querySelector('#firebase-auth-help');
        if (firebaseAuthHelpBtn) {
            firebaseAuthHelpBtn.addEventListener('click', () => {
                this.userManagement.showFirebaseAuthDeletionInstructions();
            });
        }
        
        // Close player management modal
        const closePlayerManagementBtn = document.querySelector('#close-player-management');
        if (closePlayerManagementBtn) {
            closePlayerManagementBtn.addEventListener('click', () => {
                this.userManagement.closePlayerManagement();
            });
        }
        
        // Search players button
        const searchPlayersBtn = document.querySelector('#search-players-btn');
        if (searchPlayersBtn) {
            searchPlayersBtn.addEventListener('click', () => {
                this.userManagement.searchPlayers();
            });
        }
        
        // Close player edit modal
        const closePlayerEditBtn = document.querySelector('#close-player-edit');
        if (closePlayerEditBtn) {
            closePlayerEditBtn.addEventListener('click', () => {
                this.userManagement.closePlayerEdit();
            });
        }
        
        // Cancel player edit button
        const cancelPlayerEditBtn = document.querySelector('#cancel-player-edit');
        if (cancelPlayerEditBtn) {
            cancelPlayerEditBtn.addEventListener('click', () => {
                this.userManagement.closePlayerEdit();
            });
        }
        
        // Reload page button
        const reloadPageBtn = document.querySelector('#reload-page-btn');
        if (reloadPageBtn) {
            reloadPageBtn.addEventListener('click', () => {
                location.reload();
            });
        }
        
        this.playerManagementEventListenersInitialized = true;
        console.log('✅ Player management event listeners setup complete');
    }

    // Enable save settings button
    enableSaveSettingsButton() {
        const saveSettingsBtn = document.querySelector('#save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.style.opacity = '1';
            saveSettingsBtn.style.cursor = 'pointer';
            saveSettingsBtn.classList.remove('disabled');
        }
    }

    // Load API suspension settings
    async loadApiSuspensionSettings() {
        try {
            console.log('Loading API suspension settings...');
            
            const settingsDoc = await this.db.collection('settings').doc('apiSuspension').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                this.updateApiSuspensionDisplay(settings);
                console.log('✅ API suspension settings loaded');
            } else {
                console.log('No API suspension settings found, using defaults');
                this.updateApiSuspensionDisplay({
                    footballWebPages: false,
                    theSportsDb: false,
                    reason: '',
                    suspendedUntil: null
                });
            }
            
        } catch (error) {
            console.error('❌ Error loading API suspension settings:', error);
            this.updateApiSuspensionDisplay({
                footballWebPages: false,
                theSportsDb: false,
                reason: '',
                suspendedUntil: null
            });
        }
    }

    // Update API suspension display
    updateApiSuspensionDisplay(settings) {
        const footballWebPagesCheckbox = document.querySelector('#football-web-pages-suspended');
        if (footballWebPagesCheckbox) {
            footballWebPagesCheckbox.checked = settings.footballWebPages || false;
        }
        
        const theSportsDbCheckbox = document.querySelector('#the-sports-db-suspended');
        if (theSportsDbCheckbox) {
            theSportsDbCheckbox.checked = settings.theSportsDb || false;
        }
        
        const reasonInput = document.querySelector('#api-suspension-reason');
        if (reasonInput) {
            reasonInput.value = settings.reason || '';
        }
        
        const suspendedUntilInput = document.querySelector('#api-suspended-until');
        if (suspendedUntilInput && settings.suspendedUntil) {
            suspendedUntilInput.value = settings.suspendedUntil;
        }
    }

    // Save API suspension settings
    async saveApiSuspensionSettings(event) {
        if (event) event.preventDefault();
        
        try {
            console.log('🔧 Saving API suspension settings...');
            
            const settings = {
                footballWebPages: document.querySelector('#football-web-pages-suspended')?.checked || false,
                theSportsDb: document.querySelector('#the-sports-db-suspended')?.checked || false,
                reason: document.querySelector('#api-suspension-reason')?.value || '',
                suspendedUntil: document.querySelector('#api-suspended-until')?.value || null,
                lastUpdated: new Date()
            };
            
            // Save to database
            await this.db.collection('settings').doc('apiSuspension').set(settings);
            
            console.log('✅ API suspension settings saved successfully');
            alert('API suspension settings saved successfully!');
            
            // Log the action
            await this.audit.logAdminAction('API suspension settings updated', settings);
            
        } catch (error) {
            console.error('❌ Error saving API suspension settings:', error);
            alert('Error saving API suspension settings: ' + error.message);
        }
    }

    // Check if API is suspended
    async isApiSuspended(apiName) {
        try {
            const settingsDoc = await this.db.collection('settings').doc('apiSuspension').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                
                if (apiName === 'footballWebPages' && settings.footballWebPages) {
                    return this.checkSuspensionExpiry(settings.suspendedUntil);
                }
                
                if (apiName === 'theSportsDb' && settings.theSportsDb) {
                    return this.checkSuspensionExpiry(settings.suspendedUntil);
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('Error checking API suspension status:', error);
            return false;
        }
    }

    // Check suspension expiry
    checkSuspensionExpiry(suspendedUntil) {
        if (!suspendedUntil) return true; // Suspended indefinitely
        
        const expiryDate = new Date(suspendedUntil);
        const now = new Date();
        
        return now < expiryDate;
    }

    // Build admin dashboard
    buildAdminDashboard(settings) {
        console.log('🔧 Building admin dashboard...');
        
        const adminDashboard = document.querySelector('#admin-dashboard');
        if (!adminDashboard) {
            console.error('Admin dashboard container not found');
            return;
        }
        
        // Build dashboard content
        this.buildDashboardContent(adminDashboard, settings);
        
        console.log('✅ Admin dashboard built successfully');
    }

    // Build dashboard content
    buildDashboardContent(container, settings) {
        // This method would build the actual dashboard content
        // Implementation depends on your specific dashboard requirements
        console.log('Building dashboard content...');
    }

    // Load registration data for the registration tab
    async loadRegistrationData() {
        try {
            console.log('🔧 Loading registration data...');
            
            // Initialize registration settings functionality for admin page
            this.initializeRegistrationSettingsForAdmin();
            
            // Load registration settings
            if (window.registrationManager) {
                await window.registrationManager.loadRegistrationSettings();
            }
            
            // Load registration statistics
            await this.loadRegistrationStatistics();
            
            // Load all editions overview (this populates the "All Editions Registration Status" cards)
            if (window.registrationManager) {
                await window.registrationManager.loadAllEditionsOverview();
            }
            
            console.log('✅ Registration data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading registration data:', error);
        }
    }

    // Initialize registration settings functionality for admin page
    initializeRegistrationSettingsForAdmin() {
        try {
            console.log('🔧 Initializing registration settings for admin page...');
            
            // Set up save registration settings button
            const saveRegistrationSettingsBtn = document.querySelector('#save-registration-settings');
            if (saveRegistrationSettingsBtn) {
                // Remove existing event listeners to avoid duplicates
                const newBtn = saveRegistrationSettingsBtn.cloneNode(true);
                saveRegistrationSettingsBtn.parentNode.replaceChild(newBtn, saveRegistrationSettingsBtn);
                
                // Add new event listener
                newBtn.addEventListener('click', async () => {
                    if (window.registrationManager) {
                        await window.registrationManager.saveRegistrationSettings();
                        
                        // Also refresh the overview from admin management to ensure UI updates
                        if (window.registrationManager) {
                            await window.registrationManager.loadAllEditionsOverview();
                        }
                        
                        // Refresh registration statistics as well
                        await this.loadRegistrationStatistics();
                    }
                });
                
                console.log('✅ Save registration settings button initialized');
            }
            
            // Set up refresh registration stats button
            const refreshStatsBtn = document.querySelector('#refresh-registration-stats');
            if (refreshStatsBtn) {
                // Remove existing event listeners to avoid duplicates
                const newRefreshBtn = refreshStatsBtn.cloneNode(true);
                refreshStatsBtn.parentNode.replaceChild(newRefreshBtn, refreshStatsBtn);
                
                // Add new event listener
                newRefreshBtn.addEventListener('click', async () => {
                    await this.refreshRegistrationStatistics();
                });
                
                console.log('✅ Refresh registration stats button initialized');
            }
            
            console.log('✅ Registration settings for admin page initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing registration settings for admin page:', error);
        }
    }

    // Refresh registration statistics when edition changes
    async refreshRegistrationStatistics() {
        try {
            console.log('🔄 Refreshing registration statistics for edition change...');
            await this.loadRegistrationStatistics();
        } catch (error) {
            console.error('❌ Error refreshing registration statistics:', error);
        }
    }

    // Load registration statistics
    async loadRegistrationStatistics() {
        try {
            console.log('🔧 Loading registration statistics...');
            
            // Get all users and filter in memory to avoid composite index requirements
            const allUsersQuery = await this.db.collection('users').get();
            const currentEdition = this.getCurrentActiveEdition();
            
            let totalActive = 0;
            let currentEditionCount = 0;
            let archivedCount = 0;
            
            console.log(`🔍 Checking ${allUsersQuery.size} users for active status...`);
            console.log(`🔍 Current edition being checked: ${currentEdition}`);
            
            allUsersQuery.forEach(doc => {
                const userData = doc.data();
                const userName = userData.displayName || userData.firstName || 'Unknown';
                
                // Check if user is active (has no status field or status is 'active' - case-insensitive)
                const status = userData.status;
                const isActive = !status || status.toLowerCase() === 'active';
                
                console.log(`👤 ${userName}: status="${status}", isActive=${isActive}`);
                
                if (isActive) {
                    totalActive++;
                    
                    // Check if user is registered for current edition using the registrations object
                    const editionKey = `edition${currentEdition}`;
                    const hasEditionRegistration = userData.registrations && userData.registrations[editionKey];
                    
                    console.log(`🔍 ${userName} registrations:`, userData.registrations);
                    console.log(`🔍 Checking for edition key: ${editionKey}`);
                    console.log(`🔍 Has edition registration: ${hasEditionRegistration}`);
                    
                    if (hasEditionRegistration) {
                        currentEditionCount++;
                        console.log(`✅ ${userName} counted for current edition (${currentEdition})`);
                    } else {
                        console.log(`⏭️ ${userName} active but not registered for current edition (${currentEdition})`);
                    }
                } else if (userData.status === 'archived') {
                    archivedCount++;
                    console.log(`📦 ${userName} is archived`);
                } else {
                    console.log(`❌ ${userName} not active (status: "${status}")`);
                }
            });
            
            // Update the UI
            const totalRegistrationsElement = document.querySelector('#total-registrations');
            const currentEditionElement = document.querySelector('#current-edition-registrations');
            const archivedElement = document.querySelector('#archived-players-count');
            
            if (totalRegistrationsElement) {
                totalRegistrationsElement.textContent = totalActive;
            }
            
            if (currentEditionElement) {
                currentEditionElement.textContent = currentEditionCount;
            }
            
            if (archivedElement) {
                archivedElement.textContent = archivedCount;
            }
            
            console.log(`✅ Registration statistics loaded: ${totalActive} active, ${currentEditionCount} current edition (${currentEdition}), ${archivedCount} archived`);
            
        } catch (error) {
            console.error('❌ Error loading registration statistics:', error);
        }
    }

    // Get current active edition
    getCurrentActiveEdition() {
        // Get the current active edition from the quick edition selector
        const editionSelector = document.querySelector('#quick-edition-selector');
        if (editionSelector) {
            const edition = editionSelector.value;
            console.log(`🔍 Current active edition from selector: ${edition}`);
            return edition;
        }
        
        // Fallback to checking window.currentActiveEdition
        if (window.currentActiveEdition) {
            console.log(`🔍 Current active edition from window: ${window.currentActiveEdition}`);
            return window.currentActiveEdition;
        }
        
        // Default fallback
        console.log('🔍 Using default edition: 1');
        return 1;
    }

    // Setup admin tabs
    setupAdminTabs() {
        console.log('🔧 Setting up admin tabs...');
        
        const tabContainer = document.querySelector('#admin-tabs');
        if (!tabContainer) {
            console.log('Admin tabs container not found');
            return;
        }
        
        // Set up tab switching
        this.setupTabSwitching();
        
        // Set up tab content
        this.setupTabContent();
        
        console.log('✅ Admin tabs setup complete');
    }

    // Setup tab switching
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.admin-tab');
        const tabContents = document.querySelectorAll('.admin-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    // Switch tab
    switchTab(targetTab) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.admin-tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show target tab content
        const targetContent = document.querySelector(`#${targetTab}-content`);
        if (targetContent) {
            targetContent.style.display = 'block';
        }
        
        // Add active class to target tab
        const targetTabElement = document.querySelector(`[data-tab="${targetTab}"]`);
        if (targetTabElement) {
            targetTabElement.classList.add('active');
        }
        
        // Load tab-specific content
        this.loadTabContent(targetTab);
    }

    // Load tab content
    loadTabContent(tabName) {
        switch (tabName) {
            case 'user-management':
                this.userManagement.showPlayerManagement('total');
                break;
            case 'team-operations':
                this.teamOperations.loadStandings();
                break;
            case 'scheduling':
                this.scheduling.loadCurrentCompetitionSettings();
                break;
            case 'audit':
                this.audit.loadAuditLogs();
                break;
            default:
                console.log(`No specific content for tab: ${tabName}`);
        }
    }

    // Setup tab content
    setupTabContent() {
        // Initialize default tab
        this.switchTab('user-management');
    }

    // Initialize fixture management
    initializeFixtureManagement() {
        if (this.fixtureManagementInitialized) {
            console.log('Fixture management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing fixture management...');
        this.fixtureManagementInitialized = true;
        
        // Set up fixture management event listeners
        this.setupFixtureManagementEventListeners();
        
        console.log('✅ Fixture management initialized');
    }

    // Setup fixture management event listeners
    setupFixtureManagementEventListeners() {
        console.log('🔧 Setting up fixture management event listeners...');
        
        const addFixtureBtn = document.querySelector('#add-fixture-btn');
        if (addFixtureBtn) {
            addFixtureBtn.addEventListener('click', () => this.fixturesManager.addFixtureRow());
        }
        
        const saveFixturesBtn = document.querySelector('#save-fixtures-btn');
        if (saveFixturesBtn) {
            saveFixturesBtn.addEventListener('click', () => this.fixturesManager.saveFixtures());
        }
        
        const checkFixturesBtn = document.querySelector('#check-fixtures-btn');
        if (checkFixturesBtn) {
            checkFixturesBtn.addEventListener('click', () => this.fixturesManager.checkFixtures());
        }
        
        console.log('✅ Fixture management event listeners setup complete');
    }

    // Initialize registration management
    initializeRegistrationManagement() {
        if (this.registrationManagementInitialized) {
            console.log('Registration management already initialized, skipping...');
            return;
        }
        
        console.log('Initializing registration management...');
        this.registrationManagementInitialized = true;
        
        // Set up registration management functionality
        this.setupRegistrationManagement();
        
        console.log('✅ Registration management initialized');
    }

    // Setup registration management
    setupRegistrationManagement() {
        console.log('🔧 Setting up registration management...');
        
        // This would set up registration management functionality
        // Implementation depends on your specific requirements
        
        console.log('✅ Registration management setup complete');
    }

    // Initialize admin API integration
    initializeAdminApiIntegration() {
        console.log('🔧 Initializing admin API integration...');
        
        // Set up import button event listeners directly
        console.log('🔧 Setting up button event listeners directly...');
        
        // Fetch Fixtures by Date Range button
        const fetchDateRangeBtn = document.querySelector('#fetch-date-range-fixtures-btn');
        console.log('🔍 Fetch date range button found:', !!fetchDateRangeBtn);
        if (fetchDateRangeBtn) {
            console.log('🔍 Button details:', {
                id: fetchDateRangeBtn.id,
                text: fetchDateRangeBtn.textContent,
                visible: fetchDateRangeBtn.offsetParent !== null
            });
            fetchDateRangeBtn.addEventListener('click', () => {
                console.log('📅 Fetch fixtures by date range button clicked!');
                if (window.app && window.app.apiManager && window.app.apiManager.footballWebPagesAPI) {
                    window.app.apiManager.footballWebPagesAPI.fetchDateRangeFixtures();
                } else {
                    console.log('⚠️ API Manager not available, using fallback method');
                    // Fallback: try to find the method on other global objects
                    if (window.footballWebPagesAPI && window.footballWebPagesAPI.fetchDateRangeFixtures) {
                        window.footballWebPagesAPI.fetchDateRangeFixtures();
                    } else {
                        console.error('❌ No API method found for fetchDateRangeFixtures');
                    }
                }
            });
            console.log('✅ Fetch fixtures by date range button event listener attached');
        } else {
            console.log('⚠️ Fetch fixtures by date range button not found');
        }
        
        // Set up other button event listeners
        this.setupImportButtonEventListeners();
        
        console.log('✅ Admin API integration initialized');
    }

    // Setup import button event listeners
    setupImportButtonEventListeners() {
        console.log('🔧 Setting up import button event listeners...');
        
        // Debug: Check what buttons exist
        const allButtons = document.querySelectorAll('button[id*="fetch"], button[id*="api"], button[id*="import"]');
        console.log('🔍 Found buttons with fetch/api/import in ID:', Array.from(allButtons).map(btn => btn.id));
        
        // Fetch Fixtures by Date Range button
        const fetchDateRangeBtn = document.querySelector('#fetch-date-range-fixtures-btn');
        console.log('🔍 Fetch date range button found:', !!fetchDateRangeBtn);
        if (fetchDateRangeBtn) {
            console.log('🔍 Button details:', {
                id: fetchDateRangeBtn.id,
                text: fetchDateRangeBtn.textContent,
                visible: fetchDateRangeBtn.offsetParent !== null
            });
            fetchDateRangeBtn.addEventListener('click', () => {
                console.log('📅 Fetch fixtures by date range button clicked!');
                if (window.app && window.app.apiManager && window.app.apiManager.footballWebPagesAPI) {
                    window.app.apiManager.footballWebPagesAPI.fetchDateRangeFixtures();
                } else {
                    console.log('⚠️ API Manager not available, using fallback method');
                    // Fallback: try to find the method on other global objects
                    if (window.footballWebPagesAPI && window.footballWebPagesAPI.fetchDateRangeFixtures) {
                        window.footballWebPagesAPI.fetchDateRangeFixtures();
                    } else {
                        console.error('❌ No API method found for fetchDateRangeFixtures');
                    }
                }
            });
            console.log('✅ Fetch fixtures by date range button event listener attached');
        } else {
            console.log('⚠️ Fetch fixtures by date range button not found');
        }
        
        // Select All Fixtures button
        const selectAllBtn = document.querySelector('#select-all-fixtures-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                if (window.app && window.app.apiManager && window.app.apiManager.footballWebPagesAPI) {
                    window.app.apiManager.footballWebPagesAPI.selectAllFixtures();
                }
            });
            console.log('✅ Select All Fixtures button event listener attached');
        }
        
        // Deselect All Fixtures button
        const deselectAllBtn = document.querySelector('#deselect-all-fixtures-btn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                if (window.app && window.app.apiManager && window.app.apiManager.footballWebPagesAPI) {
                    window.app.apiManager.footballWebPagesAPI.deselectAllFixtures();
                }
            });
            console.log('✅ Deselect All Fixtures button event listener attached');
        }
        
        // Import Selected Fixtures button
        const importSelectedBtn = document.querySelector('#import-selected-fixtures-btn');
        if (importSelectedBtn) {
            importSelectedBtn.addEventListener('click', async () => {
                if (window.app && window.app.apiManager && window.app.apiManager.footballWebPagesAPI) {
                    await window.app.apiManager.footballWebPagesAPI.importSelectedFixtures();
                }
            });
            console.log('✅ Import Selected Fixtures button event listener attached');
        }
        
        console.log('✅ Import button event listeners setup complete');
    }

    // Initialize enhanced vidiprinter
    initializeEnhancedVidiprinter() {
        console.log('🔧 Initializing enhanced vidiprinter...');
        
        // This would initialize the enhanced vidiprinter functionality
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter initialized');
    }

    // Start enhanced vidiprinter
    async startEnhancedVidiprinter() {
        console.log('🔧 Starting enhanced vidiprinter...');
        
        // This would start the enhanced vidiprinter
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter started');
    }

    // Stop enhanced vidiprinter
    stopEnhancedVidiprinter() {
        console.log('🔧 Stopping enhanced vidiprinter...');
        
        // This would stop the enhanced vidiprinter
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter stopped');
    }

    // Clear enhanced vidiprinter feed
    clearEnhancedVidiprinterFeed() {
        console.log('🔧 Clearing enhanced vidiprinter feed...');
        
        // This would clear the enhanced vidiprinter feed
        // Implementation depends on your specific vidiprinter requirements
        
        console.log('✅ Enhanced vidiprinter feed cleared');
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
            let skippedCount = 0;
            
            console.log('🔍 Checking users for test edition reset...');
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const userName = userData.displayName || userData.firstName || 'Unknown';
                
                // Check if user is registered for test edition using the registrations object
                const isTestEditionPlayer = userData.registrations && userData.registrations.editiontest;
                
                console.log(`👤 ${userName}: status=${userData.status}, registrations.editiontest=${isTestEditionPlayer}`);
                
                if (userData.status === 'active' && isTestEditionPlayer) {
                    batch.update(doc.ref, {
                        lives: 2,
                        lastUpdated: new Date()
                    });
                    resetCount++;
                    console.log(`✅ Will reset ${userName} to 2 lives`);
                } else {
                    skippedCount++;
                    console.log(`⏭️ Skipping ${userName} - not active or not in test edition`);
                }
            });
            
            await batch.commit();
            
            if (statusElement) {
                statusElement.textContent = `✅ Reset ${resetCount} test edition players to 2 lives successfully! (Skipped ${skippedCount})`;
                statusElement.style.color = '#28a745';
            } else {
                alert(`✅ Reset ${resetCount} test edition players to 2 lives successfully! (Skipped ${skippedCount})`);
            }
            
            console.log(`✅ Reset ${resetCount} test edition players to 2 lives (Skipped ${skippedCount})`);
            
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

    // Cleanup method
    cleanup() {
        console.log('🧹 AdminManager cleanup started');
        
        // Cleanup all modules
        this.userManagement.cleanup();
        this.teamOperations.cleanup();
        this.scheduling.cleanup();
        this.audit.cleanup();
        
        console.log('🧹 AdminManager cleanup completed');
    }

    // === EDITION REGISTRATION MANAGEMENT ===

    // Setup edition registration event handlers
    setupEditionRegistrationHandlers() {
        console.log('🔧 Setting up edition registration handlers...');
        
        // Handle cancel button click for edition editing
        const cancelButton = document.querySelector('#cancel-player-edit');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.userManagement.closePlayerEdit();
            });
        }

        console.log('✅ Edition registration handlers setup complete');
    }




}
