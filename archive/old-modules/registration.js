// Registration Module
// Handles user registration, edition management, and registration settings

class RegistrationManager {
    constructor(db) {
        this.db = db;
        this.currentActiveEdition = 1;
        this.currentEditionName = "Edition 1";
        this.registrationManagementInitialized = false;
    }

    // Initialize registration management
    initializeRegistrationManagement() {
        if (this.registrationManagementInitialized) {
            console.log('Registration management already initialized, skipping...');
            return;
        }

        console.log('Initializing registration management...');
        this.registrationManagementInitialized = true;

        const saveRegistrationSettingsBtn = document.querySelector('#save-registration-settings');
        const refreshStatsBtn = document.querySelector('#refresh-registration-stats');

        if (saveRegistrationSettingsBtn) {
            saveRegistrationSettingsBtn.addEventListener('click', this.saveRegistrationSettings.bind(this));
        }

        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', this.refreshRegistrationStats.bind(this));
        }

        // Load current settings
        this.loadRegistrationSettings();
        this.refreshRegistrationStats();
    }

    // Load registration settings
    async loadRegistrationSettings() {
        try {
            await this.loadEditionRegistrationSettings();
            await this.loadAllEditionsOverview();
        } catch (error) {
            console.error('Error loading registration settings:', error);
        }
    }

    // Load edition-specific registration settings
    async loadEditionRegistrationSettings() {
        try {
            const editionForSettings = document.querySelector('#edition-for-settings');
            const editionNumber = editionForSettings ? parseInt(editionForSettings.value) : 1;

            const settingsDoc = await this.db.collection('settings').doc(`registration_edition_${editionNumber}`).get();

            const enabledCheckbox = document.querySelector('#registration-enabled');
            const startDateInput = document.querySelector('#registration-start-date');
            const endDateInput = document.querySelector('#registration-end-date');
            const nextStartDateInput = document.querySelector('#next-registration-start-date');
            const editionSettingsTitle = document.querySelector('#edition-settings-title');

            // Update the title
            if (editionSettingsTitle) {
                if (editionNumber === 'test') {
                    editionSettingsTitle.textContent = `Test Weeks Registration Settings`;
                } else {
                    editionSettingsTitle.textContent = `Edition ${editionNumber} Registration Settings`;
                }
            }

            if (settingsDoc.exists) {
                const settings = settingsDoc.data();

                if (enabledCheckbox) enabledCheckbox.checked = settings.enabled || false;
                if (startDateInput && settings.startDate) {
                    const startDate = new Date(settings.startDate.toDate());
                    startDateInput.value = this.formatDateForInput(startDate);
                } else if (startDateInput) {
                    startDateInput.value = '';
                }
                if (endDateInput && settings.endDate) {
                    const endDate = new Date(settings.endDate.toDate());
                    endDateInput.value = this.formatDateForInput(endDate);
                } else if (endDateInput) {
                    endDateInput.value = '';
                }
                if (nextStartDateInput && settings.nextStartDate) {
                    const nextStartDate = new Date(settings.nextStartDate.toDate());
                    nextStartDateInput.value = this.formatDateForInput(nextStartDate);
                } else if (nextStartDateInput) {
                    nextStartDateInput.value = '';
                }
            } else {
                // Clear all fields if no settings exist for this edition
                if (enabledCheckbox) enabledCheckbox.checked = false;
                if (startDateInput) startDateInput.value = '';
                if (endDateInput) endDateInput.value = '';
                if (nextStartDateInput) nextStartDateInput.value = '';
            }
        } catch (error) {
            console.error('Error loading edition registration settings:', error);
        }
    }

    // Load overview of all editions
    async loadAllEditionsOverview() {
        try {
            const editions = [1, 2, 3, 4, 'test'];
            for (const edition of editions) {
                const statusCard = document.querySelector(`#edition-${edition}-status`);
                if (!statusCard) continue;

                const settingsDoc = await this.db.collection('settings').doc(`registration_edition_${edition}`).get();

                if (settingsDoc.exists) {
                    const settings = settingsDoc.data();
                    const now = new Date();

                    let statusText = 'Not configured';
                    let dateRange = 'No dates set';
                    let statusClass = '';

                    if (settings.enabled && settings.startDate && settings.endDate) {
                        const startDate = new Date(settings.startDate.toDate());
                        const endDate = new Date(settings.endDate.toDate());

                        dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

                        if (now >= startDate && now <= endDate) {
                            statusText = 'Registration Open';
                            statusClass = 'active';
                        } else if (now < startDate) {
                            statusText = 'Upcoming';
                            statusClass = 'upcoming';
                        } else {
                            statusText = 'Registration Closed';
                            statusClass = 'closed';
                        }
                    }

                    statusCard.className = `edition-status-card ${statusClass}`;
                    statusCard.querySelector('.status-text').textContent = statusText;
                    statusCard.querySelector('.date-range').textContent = dateRange;
                } else {
                    statusCard.className = 'edition-status-card';
                    statusCard.querySelector('.status-text').textContent = 'Not configured';
                    statusCard.querySelector('.date-range').textContent = 'No dates set';
                }
            }
        } catch (error) {
            console.error('Error loading all editions overview:', error);
        }
    }

    // Save registration settings
    async saveRegistrationSettings() {
        const editionForSettings = document.querySelector('#edition-for-settings');
        const enabledCheckbox = document.querySelector('#registration-enabled');
        const startDateInput = document.querySelector('#registration-start-date');
        const endDateInput = document.querySelector('#registration-end-date');
        const nextStartDateInput = document.querySelector('#next-registration-start-date');
        const statusElement = document.querySelector('#registration-settings-status');

        const editionNumber = editionForSettings ? editionForSettings.value : 1;

        try {
            const settings = {
                enabled: enabledCheckbox ? enabledCheckbox.checked : false,
                edition: editionNumber,
                lastUpdated: new Date()
            };

            if (startDateInput && startDateInput.value) {
                settings.startDate = new Date(startDateInput.value);
            }

            if (endDateInput && endDateInput.value) {
                settings.endDate = new Date(endDateInput.value);
            }

            if (nextStartDateInput && nextStartDateInput.value) {
                settings.nextStartDate = new Date(nextStartDateInput.value);
            }

            await this.db.collection('settings').doc(`registration_edition_${editionNumber}`).set(settings);

            if (statusElement) {
                const editionText = editionNumber === 'test' ? 'Test Weeks' : `Edition ${editionNumber}`;
                statusElement.textContent = `${editionText} registration settings saved successfully!`;
                statusElement.className = 'status-message success';
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                }, 3000);
            }

            // Refresh the overview
            await this.loadAllEditionsOverview();

            console.log(`Edition ${editionNumber} registration settings saved:`, settings);
        } catch (error) {
            console.error('Error saving registration settings:', error);
            if (statusElement) {
                statusElement.textContent = 'Error saving settings: ' + error.message;
                statusElement.className = 'status-message error';
            }
        }
    }

    // Refresh registration statistics
    async refreshRegistrationStats() {
        console.log('refreshRegistrationStats called');
        try {
            const usersSnapshot = await this.db.collection('users').get();
            let totalUsers = 0;
            let currentEditionRegistrations = 0;
            let previousEditionsRegistrations = 0;
            let activePlayers = 0;

            const currentEdition = this.currentActiveEdition;

            let archivedUsers = 0;
            let activeUsers = 0;

            usersSnapshot.forEach(doc => {
                const userData = doc.data();

                // Count all users in the database
                totalUsers++;

                // Count by status
                if (userData.status === 'archived') {
                    archivedUsers++;
                } else {
                    activeUsers++;
                }

                if (userData.registrations) {
                    // Only count current edition registrations for active users
                    if (userData.registrations[`edition${currentEdition}`] && userData.status !== 'archived') {
                        currentEditionRegistrations++;
                    }

                    // Count registrations from previous editions (excluding archived users)
                    if (userData.status !== 'archived') {
                        const previousEditions = Object.keys(userData.registrations).filter(edition => {
                            const editionNum = parseInt(edition.replace('edition', ''));
                            return editionNum < currentEdition;
                        });
                        previousEditionsRegistrations += previousEditions.length;
                    }
                }

                // Count active players (those with lives > 0)
                if (userData.lives > 0) {
                    activePlayers++;
                }
            });

            console.log('Registration stats breakdown:', {
                totalUsers,
                activeUsers,
                archivedUsers,
                currentEditionRegistrations,
                previousEditionsRegistrations,
                activePlayers
            });

            // Update display
            const totalElement = document.querySelector('#total-registrations');
            const currentElement = document.querySelector('#current-edition-registrations');
            const archivedElement = document.querySelector('#archived-players-count');

            if (totalElement) totalElement.textContent = activeUsers;
            if (currentElement) currentElement.textContent = currentEditionRegistrations;
            if (archivedElement) archivedElement.textContent = archivedUsers;

            // Update registration list
            await this.updateRegistrationList();

        } catch (error) {
            console.error('Error refreshing registration stats:', error);
        }
    }

    // Update registration list
    async updateRegistrationList() {
        try {
            const usersSnapshot = await this.db.collection('users').orderBy('firstName').limit(20).get();
            const tbody = document.querySelector('#registration-list-body');

            if (!tbody) return;

            tbody.innerHTML = '';

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const row = document.createElement('tr');

                const name = `${userData.firstName || ''} ${userData.surname || ''}`.trim();
                const email = userData.email || '';
                const paymentMethod = userData.paymentMethod || 'Not specified';

                // Get latest registration
                let latestEdition = 'None';
                let registrationDate = 'N/A';

                if (userData.registrations) {
                    const editions = Object.keys(userData.registrations);
                    if (editions.length > 0) {
                        const latest = editions.sort().pop();
                        latestEdition = latest.replace('edition', 'Edition ');
                        registrationDate = userData.registrations[latest].registrationDate.toDate().toLocaleDateString();
                    }
                }

                row.innerHTML = `
                    <td>${name}</td>
                    <td>${email}</td>
                    <td>${latestEdition}</td>
                    <td>${registrationDate}</td>
                    <td>${paymentMethod}</td>
                    <td>
                        <button class="secondary-button" onclick="window.registrationManager.viewUserDetails('${doc.id}')">View</button>
                    </td>
                `;

                tbody.appendChild(row);
            });

        } catch (error) {
            console.error('Error updating registration list:', error);
        }
    }

    // View user details
    async viewUserDetails(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                alert('User not found');
                return;
            }

            const userData = userDoc.data();

            // Create modal content
            const modalContent = `
                <div class="user-details-modal">
                    <div class="modal-header">
                        <h3>User Details</h3>
                        <button class="close-modal" onclick="window.registrationManager.closeUserDetailsModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="user-info">
                            <h4>Personal Information</h4>
                            <p><strong>Name:</strong> ${userData.firstName || ''} ${userData.surname || ''}</p>
                            <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
                            <p><strong>Display Name:</strong> ${userData.displayName || 'N/A'}</p>
                            <p><strong>Payment Method:</strong> ${userData.paymentMethod || 'Not specified'}</p>
                            <p><strong>Lives Remaining:</strong> ${userData.lives !== undefined ? userData.lives : 'N/A'}</p>
                        </div>
                        
                        <div class="registration-history">
                            <h4>Registration History</h4>
                            ${this.generateRegistrationHistory(userData.registrations || {})}
                        </div>
                        
                        <div class="pick-history">
                            <h4>Pick History</h4>
                            ${this.generatePickHistory(userData.picks || {})}
                        </div>
                        
                        <div class="edition-settings">
                            <h4>Edition Settings</h4>
                            <div class="edition-controls">
                                <label for="default-edition-${userId}">Default Edition:</label>
                                <select id="default-edition-${userId}" onchange="window.registrationManager.updateUserDefaultEdition('${userId}', this.value)">
                                    <option value="">No Default Set</option>
                                    <option value="1" ${userData.preferredEdition === 1 ? 'selected' : ''}>Edition 1</option>
                                    <option value="test" ${userData.preferredEdition === 'test' ? 'selected' : ''}>Test Weeks</option>
                                </select>
                                <button class="secondary-button" onclick="window.registrationManager.saveUserDefaultEdition('${userId}')">Save Default</button>
                            </div>
                            <p class="edition-help">This sets which edition the user sees by default when they log in.</p>
                        </div>
                    </div>
                </div>
            `;

            // Create and show modal
            this.showModal(modalContent);

        } catch (error) {
            console.error('Error fetching user details:', error);
            alert('Error loading user details');
        }
    }

    // Generate registration history HTML
    generateRegistrationHistory(registrations) {
        if (Object.keys(registrations).length === 0) {
            return '<p>No registrations found</p>';
        }

        let html = '<div class="registration-list">';
        Object.keys(registrations).sort().forEach(edition => {
            const reg = registrations[edition];
            const editionName = edition.replace('edition', 'Edition ');
            const date = reg.registrationDate ? reg.registrationDate.toDate().toLocaleDateString() : 'N/A';
            html += `
                <div class="registration-item">
                    <strong>${editionName}:</strong> ${date}
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

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
            const badge = pick ? this.getTeamBadge(pick) : null;
            const badgeHtml = badge ? `<img src="${badge}" alt="${pick}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;">` : '';
            html += `
                <div class="pick-item">
                    <strong>${gw.label}:</strong> ${pick ? badgeHtml + pick : 'No pick made'}
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Show modal
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
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                window.registrationManager.closeUserDetailsModal();
            }
        });
    }

    // Close user details modal
    closeUserDetailsModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    // Update user's default edition (admin function)
    updateUserDefaultEdition(userId, edition) {
        // Store the selected edition temporarily
        window.tempUserEdition = edition;
    }

    // Save user's default edition (admin function)
    async saveUserDefaultEdition(userId) {
        try {
            const edition = window.tempUserEdition || '';

            await this.db.collection('users').doc(userId).update({
                preferredEdition: edition || null
            });

            // Show success message
            const editionText = edition === 'test' ? 'Test Weeks' : edition === '1' ? 'Edition 1' : 'No default';
            alert(`Default edition updated to: ${editionText}`);

            // Refresh the user details modal to show updated selection
            this.viewUserDetails(userId);

        } catch (error) {
            console.error('Error saving user default edition:', error);
            alert('Error saving default edition. Please try again.');
        }
    }

    // Check registration window status
    async checkRegistrationWindow(edition = null) {
        try {
            // Use provided edition or fall back to current active edition
            const editionToCheck = edition || this.currentActiveEdition;
            const settingsDoc = await this.db.collection('settings').doc(`registration_edition_${editionToCheck}`).get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();

                // Update edition displays
                document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
                    if (el) el.textContent = this.currentActiveEdition;
                });

                if (!settings.enabled) {
                    const editionText = editionToCheck === 'test' ? 'Test Weeks' : `Edition ${editionToCheck}`;
                    this.showRegistrationClosed(`${editionText} registration is currently closed`);
                    return false;
                }

                const now = new Date();
                const startDate = settings.startDate ? new Date(settings.startDate.toDate()) : null;
                const endDate = settings.endDate ? new Date(settings.endDate.toDate()) : null;

                if (startDate && now < startDate) {
                    const editionText = editionToCheck === 'test' ? 'Test Weeks' : `Edition ${editionToCheck}`;
                    this.showRegistrationClosed(`${editionText} registration opens on ` + startDate.toLocaleDateString());
                    return false;
                }

                if (endDate && now > endDate) {
                    const editionText = editionToCheck === 'test' ? 'Test Weeks' : `Edition ${editionToCheck}`;
                    this.showRegistrationClosed(`${editionText} registration closed on ` + endDate.toLocaleDateString());
                    return false;
                }

                return true;
            }
            return true; // Default to open if no settings
        } catch (error) {
            console.error('Error checking registration window:', error);
            return true; // Default to open on error
        }
    }

    // Show registration closed message
    showRegistrationClosed(message = 'Registration is currently closed') {
        const closedDiv = document.querySelector('#registration-closed');
        const registerForm = document.querySelector('#register-form');
        const reRegisterForm = document.querySelector('#re-register-form');

        if (closedDiv) {
            closedDiv.querySelector('p').textContent = message;
            closedDiv.style.display = 'block';
        }
        if (registerForm) registerForm.style.display = 'none';
        if (reRegisterForm) reRegisterForm.style.display = 'none';
    }

    // Update edition displays on registration page
    updateRegistrationPageEdition() {
        document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
            if (el) {
                if (this.currentActiveEdition === 'test') {
                    el.textContent = 'Test Weeks';
                } else {
                    el.textContent = `Edition ${this.currentActiveEdition}`;
                }
            }
        });

        // Update registration information based on current active edition
        const registrationInfo = document.getElementById('registration-info');
        if (registrationInfo) {
            if (this.currentActiveEdition === 'test') {
                registrationInfo.innerHTML = `
                    <h4>Registration Information</h4>
                    <p><strong>Status:</strong> By invitation only</p>
                `;
            } else {
                registrationInfo.innerHTML = `
                    <h4>Registration Information</h4>
                    <p><strong>Entry Fee:</strong> £10 per edition</p>
                    <p><strong>Prize Pool:</strong> 50% of total entry fees</p>
                    <p><strong>Format:</strong> 10 game weeks</p>
                `;
            }
        }
    }

    // Update edition display based on selection
    updateEditionDisplay() {
        const editionSelection = document.getElementById('edition-selection');
        if (!editionSelection) return;

        const selectedEdition = editionSelection.value;
        let displayText = 'Edition 1'; // Default

        if (selectedEdition === 'test') {
            displayText = 'Test Weeks';
        } else if (selectedEdition === '1') {
            displayText = 'Edition 1';
        }

        // Update all edition displays
        document.querySelectorAll('#current-edition-display, #submit-edition-display, #re-submit-edition-display, #sidebar-edition-display').forEach(el => {
            if (el) {
                el.textContent = displayText;
            }
        });

        // Update registration information based on edition selection
        const registrationInfo = document.getElementById('registration-info');
        if (registrationInfo) {
            if (selectedEdition === 'test') {
                registrationInfo.innerHTML = `
                    <h4>Registration Information</h4>
                    <p><strong>Status:</strong> By invitation only</p>
                `;
            } else {
                registrationInfo.innerHTML = `
                    <h4>Registration Information</h4>
                    <p><strong>Entry Fee:</strong> £10 per edition</p>
                    <p><strong>Prize Pool:</strong> 50% of total entry fees</p>
                    <p><strong>Format:</strong> 10 game weeks</p>
                `;
            }
        }
    }

    // Get user's edition from registration data
    getUserEdition(userData) {
        if (!userData || !userData.registrations) {
            return 1; // Default to Edition 1 if no registration data
        }

        // If user has a preferred edition set, use that
        if (userData.preferredEdition) {
            return userData.preferredEdition;
        }

        // Check for Test Weeks registration first
        if (userData.registrations.editiontest) {
            return 'test';
        }

        // Check for Edition 1 registration
        if (userData.registrations.edition1) {
            return 1;
        }

        // Check for other editions (2, 3, 4, etc.)
        for (let i = 2; i <= 10; i++) {
            if (userData.registrations[`edition${i}`]) {
                return i;
            }
        }

        return 1; // Default to Edition 1
    }

    // Get all editions user is registered for
    getUserRegisteredEditions(userData) {
        if (!userData || !userData.registrations) {
            return [];
        }

        const editions = [];
        Object.keys(userData.registrations).forEach(editionKey => {
            if (editionKey.startsWith('edition')) {
                const edition = editionKey.replace('edition', '');
                editions.push(edition);
            }
        });

        return editions;
    }

    // Save user's edition preference
    async saveEditionPreference(edition, userId) {
        try {
            await this.db.collection('users').doc(userId).update({
                preferredEdition: edition
            });

            // Show success message
            alert(`Edition preference saved! You are now participating in ${edition === 'test' ? 'Test Weeks' : `Edition ${edition}`}.`);

            // Reload the page to update fixtures and displays
            window.location.reload();
        } catch (error) {
            console.error('Error saving edition preference:', error);
            alert('Error saving edition preference. Please try again.');
        }
    }

    // Load current edition and update registration page
    async loadCurrentEditionForRegistration() {
        try {
            const settingsDoc = await this.db.collection('settings').doc('currentCompetition').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                this.currentActiveEdition = settings.active_edition || 1;
                this.updateRegistrationPageEdition();
            }
        } catch (error) {
            console.error('Error loading current edition for registration:', error);
        }
    }

    // Format date for input fields
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Get team badge (placeholder - should be implemented based on your team system)
    getTeamBadge(teamName) {
        // This should return the actual team badge URL
        // For now, returning null as placeholder
        return null;
    }

    // Set current active edition
    setCurrentActiveEdition(edition) {
        this.currentActiveEdition = edition;
        this.currentEditionName = edition === 'test' ? 'Test Weeks' : `Edition ${edition}`;
    }
}

// Export the RegistrationManager class
export default RegistrationManager;
