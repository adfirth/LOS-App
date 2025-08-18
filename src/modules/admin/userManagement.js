// User Management Module
// Handles all user-related admin operations including CRUD, archiving, and status management

export class UserManagement {
    constructor(db) {
        this.db = db;
        this.allPlayers = [];
        this.currentPlayerManagementType = 'total';
        this.currentEditingPlayerId = null; // Add this for edition editing
    }

    // Show player management interface
    showPlayerManagement(type) {
        console.log(`🔧 Showing player management for type: ${type}`);
        
        const playerManagementModal = document.querySelector('#player-management-modal');
        const playerEditModal = document.querySelector('#player-edit-modal');
        
        if (playerManagementModal) {
            playerManagementModal.style.display = 'block';
        }
        
        if (playerEditModal) {
            playerEditModal.style.display = 'none';
        }
        
        this.currentPlayerManagementType = type;
        this.loadPlayersForManagement();
    }

    // Close player management interface
    closePlayerManagement() {
        const playerManagementModal = document.querySelector('#player-management-modal');
        if (playerManagementModal) {
            playerManagementModal.style.display = 'none';
        }
    }

    // Close player edit interface
    closePlayerEdit() {
        const playerEditModal = document.querySelector('#player-edit-modal');
        if (playerEditModal) {
            playerEditModal.style.display = 'none';
        }
    }

    // Check for orphaned accounts (accounts that exist in Firestore but not in Firebase Auth)
    async checkOrphanedAccounts() {
        try {
            console.log('🔍 Checking for orphaned accounts...');
            
            // Get all users from Firestore
            const firestoreUsers = await this.db.collection('users').get();
            const firestoreUserIds = new Set();
            
            firestoreUsers.forEach(doc => {
                firestoreUserIds.add(doc.id);
            });
            
            // Get all users from Firebase Auth (this would need to be implemented via a Cloud Function)
            // For now, we'll just show a message
            alert('Orphaned accounts check requires server-side implementation. This feature will be available in a future update.');
            
        } catch (error) {
            console.error('❌ Error checking orphaned accounts:', error);
            alert('Error checking orphaned accounts: ' + error.message);
        }
    }

    // Show Firebase Auth deletion instructions
    showFirebaseAuthDeletionInstructions() {
        const instructions = `
Firebase Auth Account Deletion Instructions:

1. Go to Firebase Console > Authentication > Users
2. Find the user account you want to delete
3. Click the three dots menu (⋮) next to the user
4. Select "Delete user"
5. Confirm the deletion

Note: This will permanently delete the user's authentication account.
The user's data in Firestore will remain unless manually deleted.

⚠️ WARNING: This action cannot be undone!
        `;
        
        alert(instructions);
    }

    // Load players for management
    async loadPlayersForManagement() {
        try {
            console.log('🔧 Loading players for management...');
            
            // Get all users and filter in memory to avoid composite index requirements
            const allUsersQuery = await this.db.collection('users').get();
            this.allPlayers = [];
            
            // Get current edition for filtering
            const currentEdition = this.getCurrentActiveEdition();
            
            allUsersQuery.forEach(doc => {
                const playerData = doc.data();
                
                let includePlayer = false;
                
                switch (this.currentPlayerManagementType) {
                    case 'total':
                        includePlayer = true;
                        break;
                    case 'active':
                        // Check if status is missing, 'active', or 'Active' (case-insensitive)
                        const status = playerData.status;
                        includePlayer = !status || status.toLowerCase() === 'active';
                        break;
                    case 'archived':
                        includePlayer = playerData.status === 'archived';
                        break;
                    case 'current':
                        // Check if user is registered for current edition using the registrations object
                        includePlayer = playerData.registrations && playerData.registrations[`edition${currentEdition}`];
                        break;
                    case 'test':
                        // Check for Test Weeks registration
                        includePlayer = playerData.registrations && playerData.registrations['editiontest'];
                        break;
                    default:
                        includePlayer = true;
                }
                
                if (includePlayer) {
                    this.allPlayers.push({
                        id: doc.id,
                        ...playerData
                    });
                }
            });
            
            // Sort by display name
            this.allPlayers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
            
            console.log(`✅ Loaded ${this.allPlayers.length} players for ${this.currentPlayerManagementType} management`);
            this.displayPlayers(this.allPlayers);
            
        } catch (error) {
            console.error('❌ Error loading players for management:', error);
            alert('Error loading players: ' + error.message);
        }
    }
    
    // Get current active edition
    getCurrentActiveEdition() {
        // Get the current active edition from the quick edition selector
        const editionSelector = document.querySelector('#quick-edition-selector');
        if (editionSelector) {
            const edition = editionSelector.value;
            console.log(`🔍 UserManagement: Current active edition from selector: ${edition}`);
            return edition;
        }
        
        // Fallback to checking window.currentActiveEdition
        if (window.currentActiveEdition) {
            console.log(`🔍 UserManagement: Current active edition from window: ${window.currentActiveEdition}`);
            return window.currentActiveEdition;
        }
        
        // Default fallback
        console.log('🔍 UserManagement: Using default edition: 1');
        return 1;
    }

    // Display players in the management interface
    displayPlayers(players) {
        const playerListContainer = document.querySelector('#player-management-list');
        if (!playerListContainer) {
            console.error('Player list container not found');
            return;
        }
        
        if (!players || players.length === 0) {
            playerListContainer.innerHTML = '<p>No players found</p>';
            return;
        }
        
        let playerListHtml = '';
        
        players.forEach(player => {
            // Normalize status for consistent display
            const normalizedStatus = player.status ? player.status.toLowerCase() : 'active';
            const statusClass = normalizedStatus === 'active' ? 'active' : 'archived';
            const isTestWeeks = player.registrations && player.registrations['editiontest'];
            
            // Get current edition registrations
            const currentEdition = this.getCurrentActiveEdition();
            const isCurrentEdition = player.registrations && player.registrations[`edition${currentEdition}`];
            
            // Determine edition display
            let editionDisplay = '';
            if (isTestWeeks) {
                editionDisplay = 'Test Weeks';
            } else if (isCurrentEdition) {
                editionDisplay = `Edition ${currentEdition}`;
            } else {
                editionDisplay = 'None';
            }
            
            playerListHtml += `
                <tr class="player-row ${statusClass}" data-player-id="${player.id}">
                    <td>${player.displayName || 'Unknown'}</td>
                    <td>${player.email || 'No email'}</td>
                    <td><span class="status-badge ${statusClass}">${normalizedStatus === 'active' ? 'Active' : (normalizedStatus === 'archived' ? 'Archived' : 'Unknown')}</span></td>
                    <td>${player.lives || 2}</td>
                    <td>${editionDisplay}</td>
                    <td>
                        <button class="edit-btn" onclick="console.log('🔍 Edit button clicked for player:', '${player.id}'); console.log('🔍 adminManagementManager available:', !!window.adminManagementManager); console.log('🔍 userManagement available:', !!(window.adminManagementManager && window.adminManagementManager.userManagement)); window.adminManagementManager.userManagement.editPlayer('${player.id}')">Edit</button>
                        ${normalizedStatus === 'active' ? 
                            `<button class="archive-btn" onclick="window.adminManagementManager.userManagement.archivePlayer('${player.id}')">Archive</button>` :
                            `<button class="unarchive-btn" onclick="window.adminManagementManager.userManagement.unarchivePlayer('${player.id}')">Unarchive</button>`
                        }
                        <button class="delete-btn" onclick="window.adminManagementManager.userManagement.deletePlayer('${player.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
        playerListContainer.innerHTML = playerListHtml;
        
        // Set up event listeners for the new buttons
        this.setupPlayerActionEventListeners();
        
        // Set up search and filter functionality
        this.setupSearchAndFilter();
    }

    // Set up event listeners for player actions
    setupPlayerActionEventListeners() {
        const playerItems = document.querySelectorAll('.player-item');
        
        playerItems.forEach(item => {
            item.addEventListener('editPlayer', (e) => this.editPlayer(e.detail));
            item.addEventListener('archivePlayer', (e) => this.archivePlayer(e.detail));
            item.addEventListener('unarchivePlayer', (e) => this.unarchivePlayer(e.detail));
            item.addEventListener('deletePlayer', (e) => this.deletePlayer(e.detail));
        });
    }

    // Set up search and filter functionality
    setupSearchAndFilter() {
        const searchInput = document.querySelector('#player-search');
        const filterSelect = document.querySelector('#player-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchPlayers());
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterPlayers());
        }
    }

    // Search players
    searchPlayers() {
        const searchTerm = document.querySelector('#player-search')?.value?.toLowerCase() || '';
        const filteredPlayers = this.allPlayers.filter(player => 
            player.displayName?.toLowerCase().includes(searchTerm) ||
            player.email?.toLowerCase().includes(searchTerm)
        );
        
        this.displayPlayers(filteredPlayers);
    }

    // Filter players
    filterPlayers() {
        const filterValue = document.querySelector('#player-filter')?.value || 'all';
        let filteredPlayers = this.allPlayers;
        
        switch (filterValue) {
            case 'active':
                filteredPlayers = this.allPlayers.filter(player => player.status === 'active');
                break;
            case 'archived':
                filteredPlayers = this.allPlayers.filter(player => player.status === 'archived');
                break;
            case 'test':
                filteredPlayers = this.allPlayers.filter(player => player.testWeeks === true);
                break;
            default:
                filteredPlayers = this.allPlayers;
        }
        
        this.displayPlayers(filteredPlayers);
    }

    // Edit player
    async editPlayer(playerId) {
        console.log(`🚀 editPlayer method called with playerId: ${playerId}`);
        console.log(`🔍 this context:`, this);
        console.log(`🔍 window.adminManagementManager:`, window.adminManagementManager);
        console.log(`🔍 window.adminManagementManager.userManagement:`, window.adminManagementManager?.userManagement);
        
        try {
            console.log(`🔧 Editing player: ${playerId}`);
            
            const playerDoc = await this.db.collection('users').doc(playerId).get();
            if (!playerDoc.exists) {
                alert('Player not found');
                return;
            }
            
            const playerData = playerDoc.data();
            console.log(`🔍 Player data retrieved:`, {
                id: playerId,
                firstName: playerData.firstName,
                surname: playerData.surname,
                email: playerData.email,
                registrations: playerData.registrations,
                status: playerData.status
            });
            
            console.log('🔍 About to call showPlayerEditForm...');
            try {
                this.showPlayerEditForm(playerId, playerData);
                console.log('🔍 showPlayerEditForm call completed');
            } catch (error) {
                console.error('❌ Error calling showPlayerEditForm:', error);
            }
            
        } catch (error) {
            console.error('❌ Error editing player:', error);
            alert('Error editing player: ' + error.message);
        }
    }

    // Show player edit form
    showPlayerEditForm(playerId, playerData) {
        console.log('🔍 === METHOD ENTRY POINT ===');
        console.log('🚀 showPlayerEditForm method entered with playerId:', playerId, 'and playerData:', playerData);
        console.log('🔍 === SHOW PLAYER EDIT FORM METHOD START ===');
        console.log('🔍 Method execution started - this should appear immediately');
        console.log('🔍 Full playerData object:', JSON.stringify(playerData, null, 2));
        const playerEditModal = document.querySelector('#player-edit-modal');
        const playerManagementModal = document.querySelector('#player-management-modal');
        console.log('🔍 Modal elements found - playerEditModal:', !!playerEditModal, 'playerManagementModal:', !!playerManagementModal);
        
        if (playerEditModal) {
            playerEditModal.style.display = 'block';
        }
        
        if (playerManagementModal) {
            playerManagementModal.style.display = 'none';
        }
        
        // Store the current player ID for edition editing
        this.currentEditingPlayerId = playerId;
        
        // Populate the existing form fields
        const firstNameInput = document.querySelector('#edit-first-name');
        const surnameInput = document.querySelector('#edit-surname');
        const emailInput = document.querySelector('#edit-email');
        const livesInput = document.querySelector('#edit-lives');
        const statusSelect = document.querySelector('#edit-status');
        const notesTextarea = document.querySelector('#edit-notes');
        
        if (firstNameInput) firstNameInput.value = playerData.firstName || '';
        if (surnameInput) surnameInput.value = playerData.surname || '';
        if (emailInput) emailInput.value = playerData.email || '';
        if (livesInput) livesInput.value = playerData.lives || 2;
        if (statusSelect) statusSelect.value = playerData.status || 'active';
        if (notesTextarea) notesTextarea.value = playerData.adminNotes || '';
        
        // Set edition checkboxes based on current registrations
        const editionCheckboxes = document.querySelectorAll('.edition-checkboxes input[type="checkbox"]');
        console.log(`🔍 Setting edition checkboxes for player: ${playerData.displayName || playerData.firstName}`);
        console.log(`🔍 Player registrations data:`, playerData.registrations);
        console.log(`🔍 Found ${editionCheckboxes.length} edition checkboxes`);
        
        // First, uncheck all checkboxes to reset state
        editionCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Then populate based on player's actual registrations
        if (playerData.registrations && typeof playerData.registrations === 'object') {
            editionCheckboxes.forEach(checkbox => {
                const editionKey = `edition${checkbox.value}`;
                const isChecked = playerData.registrations[editionKey] !== undefined;
                checkbox.checked = isChecked;
                console.log(`🔍 Checkbox ${checkbox.id} (${editionKey}): ${isChecked ? 'checked' : 'unchecked'}`);
            });
        } else {
            console.log(`⚠️ Player ${playerData.displayName || playerData.firstName} has no registrations data:`, playerData.registrations);
        }
        
        // Set up form submission
        const form = document.querySelector('#player-edit-form');
        if (form) {
            // Remove existing event listeners
            form.removeEventListener('submit', this.savePlayerEdit.bind(this));
            // Add new event listener
            form.addEventListener('submit', (e) => this.savePlayerEdit(e, playerId));
        }
    }

    // Save player edit
    async savePlayerEdit(event, playerId) {
        event.preventDefault();
        
        try {
            const firstName = document.querySelector('#edit-first-name').value;
            const surname = document.querySelector('#edit-surname').value;
            const email = document.querySelector('#edit-email').value;
            const lives = parseInt(document.querySelector('#edit-lives').value);
            const status = document.querySelector('#edit-status').value;
            const adminNotes = document.querySelector('#edit-notes').value;
            
            // Get edition checkbox values
            const editionRegistrations = {};
            const editionCheckboxes = document.querySelectorAll('.edition-checkboxes input[type="checkbox"]');
            
            console.log('🔍 Collecting edition checkbox values:');
            console.log(`🔍 Found ${editionCheckboxes.length} edition checkboxes to process`);
            
            editionCheckboxes.forEach(checkbox => {
                const editionKey = `edition${checkbox.value}`;
                if (checkbox.checked) {
                    editionRegistrations[editionKey] = true;
                    console.log(`✅ Checkbox ${checkbox.id} (${editionKey}): checked`);
                } else {
                    console.log(`⏭️ Checkbox ${checkbox.id} (${editionKey}): unchecked`);
                }
            });
            
            console.log('🔍 Final edition registrations:', editionRegistrations);
            
            const updateData = {
                firstName,
                surname,
                displayName: `${firstName} ${surname}`.trim(),
                email,
                lives,
                status,
                adminNotes,
                registrations: editionRegistrations, // Add edition registrations
                lastUpdated: new Date()
            };
            
            console.log('🔧 Saving player with edition registrations:', editionRegistrations);
            console.log('🔧 Full update data:', updateData);
            
            await this.db.collection('users').doc(playerId).update(updateData);
            
            console.log(`✅ Player ${playerId} updated successfully with editions:`, editionRegistrations);
            alert('Player updated successfully!');
            
            this.closePlayerEdit();
            this.loadPlayersForManagement();
            
            // Refresh registration statistics to update the Current Edition count
            if (window.adminManagementManager && window.adminManagementManager.refreshRegistrationStatistics) {
                console.log('🔄 Refreshing registration statistics after player edit...');
                await window.adminManagementManager.refreshRegistrationStatistics();
            }
            
        } catch (error) {
            console.error('❌ Error saving player edit:', error);
            alert('Error saving player: ' + error.message);
        }
    }

    // Archive player
    async archivePlayer(playerId) {
        if (!confirm('Are you sure you want to archive this player?')) {
            return;
        }
        
        try {
            await this.db.collection('users').doc(playerId).update({
                status: 'archived',
                archivedAt: new Date(),
                lastUpdated: new Date()
            });
            
            console.log(`✅ Player ${playerId} archived successfully`);
            alert('Player archived successfully!');
            
            this.loadPlayersForManagement();
            
            // Refresh registration statistics to update the Current Edition count
            if (window.adminManagementManager && window.adminManagementManager.refreshRegistrationStatistics) {
                console.log('🔄 Refreshing registration statistics after player archive...');
                await window.adminManagementManager.refreshRegistrationStatistics();
            }
            
        } catch (error) {
            console.error('❌ Error archiving player:', error);
            alert('Error archiving player: ' + error.message);
        }
    }

    // Unarchive player
    async unarchivePlayer(playerId) {
        if (!confirm('Are you sure you want to unarchive this player?')) {
            return;
        }
        
        try {
            await this.db.collection('users').doc(playerId).update({
                status: 'active',
                unarchivedAt: new Date(),
                lastUpdated: new Date()
            });
            
            console.log(`✅ Player ${playerId} unarchived successfully`);
            alert('Player unarchived successfully!');
            
            this.loadPlayersForManagement();
            
            // Refresh registration statistics to update the Current Edition count
            if (window.adminManagementManager && window.adminManagementManager.refreshRegistrationStatistics) {
                console.log('🔄 Refreshing registration statistics after player unarchive...');
                await window.adminManagementManager.refreshRegistrationStatistics();
            }
            
        } catch (error) {
            console.error('❌ Error unarchiving player:', error);
            alert('Error unarchiving player: ' + error.message);
        }
    }

    // Add player to test weeks
    async addToTestWeeks(playerId) {
        try {
            await this.db.collection('users').doc(playerId).update({
                testWeeks: true,
                lastUpdated: new Date()
            });
            
            console.log(`✅ Player ${playerId} added to test weeks successfully`);
            alert('Player added to test weeks successfully!');
            
            this.loadPlayersForManagement();
            
        } catch (error) {
            console.error('❌ Error adding player to test weeks:', error);
            alert('Error adding player to test weeks: ' + error.message);
        }
    }

    // Delete player
    async deletePlayer(playerId) {
        if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.db.collection('users').doc(playerId).delete();
            
            console.log(`✅ Player ${playerId} deleted successfully`);
            alert('Player deleted successfully!');
            
            this.loadPlayersForManagement();
            
        } catch (error) {
            console.error('❌ Error deleting player:', error);
            alert('Error deleting player: ' + error.message);
        }
    }

    // Reset all player lives
    async resetAllPlayerLives() {
        if (!confirm('Are you sure you want to reset all player lives to 2? This will affect all active players.')) {
            return;
        }
        
        try {
            const batch = this.db.batch();
            const usersSnapshot = await this.db.collection('users').where('status', '==', 'active').get();
            
            usersSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    lives: 2,
                    lastUpdated: new Date()
                });
            });
            
            await batch.commit();
            
            console.log(`✅ Reset ${usersSnapshot.size} player lives successfully`);
            alert(`Reset ${usersSnapshot.size} player lives successfully!`);
            
            this.loadPlayersForManagement();
            
        } catch (error) {
            console.error('❌ Error resetting player lives:', error);
            alert('Error resetting player lives: ' + error.message);
        }
    }

    // Generate test scores
    generateTestScores() {
        console.log('🔧 Generating test scores...');
        // This method would generate test scores for testing purposes
        // Implementation depends on your specific requirements
        alert('Test scores generation not yet implemented');
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 UserManagement cleanup completed');
    }

    // Close player edit modal
    closePlayerEdit() {
        const playerEditModal = document.querySelector('#player-edit-modal');
        if (playerEditModal) {
            playerEditModal.style.display = 'none';
        }
        
        // Clear the current editing player ID
        this.currentEditingPlayerId = null;
    }
}
