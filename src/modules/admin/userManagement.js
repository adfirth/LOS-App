// User Management Module
// Handles all user-related admin operations including CRUD, archiving, and status management

export class UserManagement {
    constructor(db) {
        this.db = db;
        this.allPlayers = [];
        this.currentPlayerManagementType = 'total';
    }

    // Show player management interface
    showPlayerManagement(type) {
        console.log(`🔧 Showing player management for type: ${type}`);
        
        const playerManagementDiv = document.querySelector('#player-management');
        const playerEditDiv = document.querySelector('#player-edit');
        
        if (playerManagementDiv) {
            playerManagementDiv.style.display = 'block';
        }
        
        if (playerEditDiv) {
            playerEditDiv.style.display = 'none';
        }
        
        this.currentPlayerManagementType = type;
        this.loadPlayersForManagement();
    }

    // Close player management interface
    closePlayerManagement() {
        const playerManagementDiv = document.querySelector('#player-management');
        if (playerManagementDiv) {
            playerManagementDiv.style.display = 'none';
        }
    }

    // Close player edit interface
    closePlayerEdit() {
        const playerEditDiv = document.querySelector('#player-edit');
        if (playerEditDiv) {
            playerEditDiv.style.display = 'none';
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
            
            let playersQuery;
            
            switch (this.currentPlayerManagementType) {
                case 'total':
                    playersQuery = this.db.collection('users').orderBy('displayName');
                    break;
                case 'active':
                    playersQuery = this.db.collection('users').where('status', '==', 'active').orderBy('displayName');
                    break;
                case 'archived':
                    playersQuery = this.db.collection('users').where('status', '==', 'archived').orderBy('displayName');
                    break;
                case 'test':
                    playersQuery = this.db.collection('users').where('testWeeks', '==', true).orderBy('displayName');
                    break;
                default:
                    playersQuery = this.db.collection('users').orderBy('displayName');
            }
            
            const querySnapshot = await playersQuery.get();
            this.allPlayers = [];
            
            querySnapshot.forEach(doc => {
                const playerData = doc.data();
                this.allPlayers.push({
                    id: doc.id,
                    ...playerData
                });
            });
            
            console.log(`✅ Loaded ${this.allPlayers.length} players for ${this.currentPlayerManagementType} management`);
            this.displayPlayers(this.allPlayers);
            
        } catch (error) {
            console.error('❌ Error loading players for management:', error);
            alert('Error loading players: ' + error.message);
        }
    }

    // Display players in the management interface
    displayPlayers(players) {
        const playerListContainer = document.querySelector('#player-list-container');
        if (!playerListContainer) {
            console.error('Player list container not found');
            return;
        }
        
        if (!players || players.length === 0) {
            playerListContainer.innerHTML = '<p>No players found</p>';
            return;
        }
        
        let playerListHtml = `
            <div class="player-list-header">
                <h3>Players (${players.length})</h3>
                <div class="player-list-controls">
                    <input type="text" id="player-search" placeholder="Search players..." class="search-input">
                    <select id="player-filter" class="filter-select">
                        <option value="all">All Players</option>
                        <option value="active">Active Only</option>
                        <option value="archived">Archived Only</option>
                        <option value="test">Test Weeks Only</option>
                    </select>
                </div>
            </div>
            <div class="player-list">
        `;
        
        players.forEach(player => {
            const statusClass = player.status === 'active' ? 'active' : 'archived';
            const testWeeksClass = player.testWeeks ? 'test-weeks' : '';
            
            playerListHtml += `
                <div class="player-item ${statusClass} ${testWeeksClass}" data-player-id="${player.id}">
                    <div class="player-info">
                        <div class="player-name">${player.displayName || 'Unknown'}</div>
                        <div class="player-email">${player.email || 'No email'}</div>
                        <div class="player-status">
                            <span class="status-badge ${statusClass}">${player.status || 'unknown'}</span>
                            ${player.testWeeks ? '<span class="test-badge">Test Weeks</span>' : ''}
                        </div>
                    </div>
                    <div class="player-actions">
                        <button class="edit-btn" onclick="this.parentElement.parentElement.querySelector('.edit-player-btn').click()">
                            Edit
                        </button>
                        <button class="edit-player-btn" style="display: none;" onclick="this.closest('.player-item').dispatchEvent(new CustomEvent('editPlayer', {detail: '${player.id}'}))">
                            Edit Player
                        </button>
                        ${player.status === 'active' ? 
                            `<button class="archive-btn" onclick="this.closest('.player-item').dispatchEvent(new CustomEvent('archivePlayer', {detail: '${player.id}'}))">Archive</button>` :
                            `<button class="unarchive-btn" onclick="this.closest('.player-item').dispatchEvent(new CustomEvent('unarchivePlayer', {detail: '${player.id}'}))">Unarchive</button>`
                        }
                        <button class="delete-btn" onclick="this.closest('.player-item').dispatchEvent(new CustomEvent('deletePlayer', {detail: '${player.id}'}))">Delete</button>
                    </div>
                </div>
            `;
        });
        
        playerListHtml += '</div>';
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
        try {
            console.log(`🔧 Editing player: ${playerId}`);
            
            const playerDoc = await this.db.collection('users').doc(playerId).get();
            if (!playerDoc.exists) {
                alert('Player not found');
                return;
            }
            
            const playerData = playerDoc.data();
            this.showPlayerEditForm(playerId, playerData);
            
        } catch (error) {
            console.error('❌ Error editing player:', error);
            alert('Error editing player: ' + error.message);
        }
    }

    // Show player edit form
    showPlayerEditForm(playerId, playerData) {
        const playerEditDiv = document.querySelector('#player-edit');
        const playerManagementDiv = document.querySelector('#player-management');
        
        if (playerEditDiv) {
            playerEditDiv.style.display = 'block';
        }
        
        if (playerManagementDiv) {
            playerManagementDiv.style.display = 'none';
        }
        
        const editForm = document.querySelector('#player-edit-form');
        if (editForm) {
            editForm.innerHTML = `
                <h3>Edit Player: ${playerData.displayName || 'Unknown'}</h3>
                <form id="edit-player-form">
                    <input type="hidden" id="edit-player-id" value="${playerId}">
                    
                    <div class="form-group">
                        <label for="edit-display-name">Display Name:</label>
                        <input type="text" id="edit-display-name" value="${playerData.displayName || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-email">Email:</label>
                        <input type="email" id="edit-email" value="${playerData.email || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-status">Status:</label>
                        <select id="edit-status">
                            <option value="active" ${playerData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="archived" ${playerData.status === 'archived' ? 'selected' : ''}>Archived</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="edit-test-weeks" ${playerData.testWeeks ? 'checked' : ''}>
                            Test Weeks Player
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-lives">Current Lives:</label>
                        <input type="number" id="edit-lives" value="${playerData.lives || 2}" min="0" max="2">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="save-btn">Save Changes</button>
                        <button type="button" class="cancel-btn" onclick="this.closest('#player-edit').dispatchEvent(new CustomEvent('closePlayerEdit'))">Cancel</button>
                    </div>
                </form>
            `;
            
            // Set up form submission
            const form = document.querySelector('#edit-player-form');
            if (form) {
                form.addEventListener('submit', (e) => this.savePlayerEdit(e));
            }
            
            // Set up close button
            const closeBtn = document.querySelector('#player-edit');
            if (closeBtn) {
                closeBtn.addEventListener('closePlayerEdit', () => this.closePlayerEdit());
            }
        }
    }

    // Save player edit
    async savePlayerEdit(event) {
        event.preventDefault();
        
        try {
            const playerId = document.querySelector('#edit-player-id').value;
            const displayName = document.querySelector('#edit-display-name').value;
            const email = document.querySelector('#edit-email').value;
            const status = document.querySelector('#edit-status').value;
            const testWeeks = document.querySelector('#edit-test-weeks').checked;
            const lives = parseInt(document.querySelector('#edit-lives').value);
            
            const updateData = {
                displayName,
                email,
                status,
                testWeeks,
                lives,
                lastUpdated: new Date()
            };
            
            await this.db.collection('users').doc(playerId).update(updateData);
            
            console.log(`✅ Player ${playerId} updated successfully`);
            alert('Player updated successfully!');
            
            this.closePlayerEdit();
            this.loadPlayersForManagement();
            
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
}
