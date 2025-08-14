// Registration Module
// Handles user registration, edition management, and registration settings

class RegistrationManager {
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
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

        // Initialize registration page functionality
        this.initializeRegistrationPage();

        // Load current settings
        this.loadRegistrationSettings();
        this.refreshRegistrationStats();
    }

    // Initialize main page functionality (index.html)
    initializeMainPage() {
        console.log('🔧 Initializing main page functionality...');
        
        // Check registration window status
        console.log('🔧 Checking registration window status...');
        this.checkRegistrationWindow();
        
        // Initialize any other main page features
        console.log('🔧 Initializing main page features...');
        this.initializeMainPageFeatures();
        
        console.log('✅ Main page initialization completed');
    }

    // Initialize main page features
    initializeMainPageFeatures() {
        console.log('🔧 Setting up main page event listeners...');
        
        // Set up any main page specific event listeners
        // This could include navigation, testimonials, etc.
        
        console.log('✅ Main page features initialized');
    }

    // Initialize registration page functionality
    initializeRegistrationPage() {
        console.log('🔧 Initializing registration page functionality...');
        console.log('🔍 Current page URL:', window.location.href);
        console.log('🔍 Document ready state:', document.readyState);
        
        // Initialize age verification buttons
        console.log('🔧 Step 1: Initializing age verification...');
        this.initializeAgeVerification();
        
        // Initialize form submission handlers
        console.log('🔧 Step 2: Initializing form handlers...');
        this.initializeFormHandlers();
        
        // Initialize edition selection change handler
        console.log('🔧 Step 3: Initializing edition selection...');
        this.initializeEditionSelection();
        
        // Initialize form toggle handlers
        console.log('🔧 Step 4: Initializing form toggles...');
        this.initializeFormToggles();
        
        // Load current edition and update displays
        console.log('🔧 Step 5: Loading current edition...');
        this.loadCurrentEditionForRegistration();
        
        // Check registration window status
        console.log('🔧 Step 6: Checking registration window...');
        this.checkRegistrationWindow();
        
        console.log('✅ Registration page initialization completed');
    }

    // Initialize age verification buttons
    initializeAgeVerification() {
        console.log('🔍 Initializing age verification buttons...');
        
        const ageYesBtn = document.getElementById('age-yes-btn');
        const ageNoBtn = document.getElementById('age-no-btn');
        const ageVerifiedInput = document.getElementById('register-age-verified');

        console.log('🔍 Age verification elements found:', {
            ageYesBtn: !!ageYesBtn,
            ageNoBtn: !!ageNoBtn,
            ageVerifiedInput: !!ageVerifiedInput
        });

        if (ageYesBtn && ageNoBtn && ageVerifiedInput) {
            console.log('✅ All age verification elements found, adding event listeners...');
            
            ageYesBtn.addEventListener('click', () => {
                console.log('✅ Age Yes button clicked');
                // Remove selected class from both buttons
                ageYesBtn.classList.remove('selected');
                ageNoBtn.classList.remove('selected');
                
                // Add selected class to yes button
                ageYesBtn.classList.add('selected');
                
                // Set the hidden input value
                ageVerifiedInput.value = 'yes';
                
                console.log('Age verification: Yes selected');
            });

            ageNoBtn.addEventListener('click', () => {
                console.log('✅ Age No button clicked');
                // Remove selected class from both buttons
                ageYesBtn.classList.remove('selected');
                ageNoBtn.classList.remove('selected');
                
                // Add selected class to no button
                ageNoBtn.classList.add('selected');
                
                // Set the hidden input value
                ageVerifiedInput.value = 'no';
                
                console.log('Age verification: No selected');
            });
            
            console.log('✅ Age verification event listeners added successfully');
        } else {
            console.error('❌ Some age verification elements not found:', {
                ageYesBtn: !!ageYesBtn,
                ageNoBtn: !!ageNoBtn,
                ageVerifiedInput: !!ageVerifiedInput
            });
        }
    }

    // Initialize form submission handlers
    initializeFormHandlers() {
        const registerForm = document.getElementById('register-form');
        const reRegisterForm = document.getElementById('re-register-form');

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistrationSubmit(e));
        }

        if (reRegisterForm) {
            reRegisterForm.addEventListener('submit', (e) => this.handleReRegistrationSubmit(e));
        }
    }

    // Initialize edition selection change handler
    initializeEditionSelection() {
        const editionSelection = document.getElementById('edition-selection');
        if (editionSelection) {
            editionSelection.addEventListener('change', () => {
                this.updateEditionDisplay();
            });
        }
    }

    // Initialize form toggle handlers
    initializeFormToggles() {
        const showReRegister = document.getElementById('show-re-register');
        const showNewRegister = document.getElementById('show-new-register');
        const registerForm = document.getElementById('register-form');
        const reRegisterForm = document.getElementById('re-register-form');

        if (showReRegister && showNewRegister && registerForm && reRegisterForm) {
            showReRegister.addEventListener('click', (e) => {
                e.preventDefault();
                registerForm.style.display = 'none';
                reRegisterForm.style.display = 'block';
                showReRegister.style.display = 'none';
                showNewRegister.style.display = 'inline';
            });

            showNewRegister.addEventListener('click', (e) => {
                e.preventDefault();
                reRegisterForm.style.display = 'none';
                registerForm.style.display = 'block';
                showNewRegister.style.display = 'none';
                showReRegister.style.display = 'inline';
            });
        }
    }

    // Handle main registration form submission
    async handleRegistrationSubmit(e) {
        e.preventDefault();
        console.log('Handling registration form submission...');

        // Get form data
        const formData = {
            firstName: document.getElementById('register-firstname').value.trim(),
            surname: document.getElementById('register-surname').value.trim(),
            ageVerified: document.getElementById('register-age-verified').value,
            email: document.getElementById('register-email').value.trim(),
            mobile: document.getElementById('register-mobile').value.trim(),
            password: document.getElementById('register-password').value,
            confirmPassword: document.getElementById('register-confirm-password').value,
            paymentMethod: document.getElementById('register-payment').value,
            emailConsent: document.getElementById('register-email-consent').checked,
            whatsappConsent: document.getElementById('register-whatsapp-consent').checked,
            termsAccepted: document.getElementById('register-terms').checked,
            edition: document.getElementById('edition-selection').value
        };

        // Validate form data
        const validationResult = this.validateRegistrationForm(formData);
        if (!validationResult.isValid) {
            this.showRegistrationError(validationResult.message);
            return;
        }

        try {
            // Create user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                formData.email, 
                formData.password
            );

            const user = userCredential.user;
            console.log('User account created:', user.uid);

            // Save user data to Firestore
            await this.saveUserRegistrationData(user.uid, formData);

            // Show success message
            this.showRegistrationSuccess('Registration successful! You can now log in.');

            // Clear form
            this.clearRegistrationForm();

            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showRegistrationError(this.getRegistrationErrorMessage(error));
        }
    }

    // Handle re-registration form submission
    async handleReRegistrationSubmit(e) {
        e.preventDefault();
        console.log('Handling re-registration form submission...');

        // Get form data
        const formData = {
            email: document.getElementById('re-register-email').value.trim(),
            password: document.getElementById('re-register-password').value,
            paymentMethod: document.getElementById('re-register-payment').value,
            emailConsent: document.getElementById('re-register-email-consent').checked,
            whatsappConsent: document.getElementById('re-register-whatsapp-consent').checked,
            termsAccepted: document.getElementById('re-register-terms').checked,
            edition: document.getElementById('edition-selection').value
        };

        // Validate form data
        const validationResult = this.validateReRegistrationForm(formData);
        if (!validationResult.isValid) {
            this.showReRegistrationError(validationResult.message);
            return;
        }

        try {
            // Sign in existing user
            const userCredential = await this.auth.signInWithEmailAndPassword(
                formData.email, 
                formData.password
            );

            const user = userCredential.user;
            console.log('User signed in for re-registration:', user.uid);

            // Update user registration data
            await this.updateUserRegistrationData(user.uid, formData);

            // Show success message
            this.showReRegistrationSuccess('Re-registration successful! Welcome back.');

            // Clear form
            this.clearReRegistrationForm();

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Re-registration error:', error);
            this.showReRegistrationError(this.getRegistrationErrorMessage(error));
        }
    }

    // Validate registration form data
    validateRegistrationForm(formData) {
        if (!formData.firstName) {
            return { isValid: false, message: 'First name is required' };
        }
        if (!formData.surname) {
            return { isValid: false, message: 'Surname is required' };
        }
        if (!formData.ageVerified) {
            return { isValid: false, message: 'Please verify your age' };
        }
        if (formData.ageVerified === 'no') {
            return { isValid: false, message: 'You must be 16 or older to register' };
        }
        if (!formData.email) {
            return { isValid: false, message: 'Email address is required' };
        }
        if (!formData.mobile) {
            return { isValid: false, message: 'Mobile number is required' };
        }
        if (!formData.password) {
            return { isValid: false, message: 'Password is required' };
        }
        if (formData.password.length < 6) {
            return { isValid: false, message: 'Password must be at least 6 characters' };
        }
        if (formData.password !== formData.confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }
        if (!formData.paymentMethod) {
            return { isValid: false, message: 'Please select a payment method' };
        }
        if (!formData.emailConsent) {
            return { isValid: false, message: 'Email consent is required' };
        }
        if (!formData.termsAccepted) {
            return { isValid: false, message: 'You must accept the terms and conditions' };
        }
        if (!formData.edition) {
            return { isValid: false, message: 'Please select an edition' };
        }

        return { isValid: true };
    }

    // Validate re-registration form data
    validateReRegistrationForm(formData) {
        if (!formData.email) {
            return { isValid: false, message: 'Email address is required' };
        }
        if (!formData.password) {
            return { isValid: false, message: 'Password is required' };
        }
        if (!formData.paymentMethod) {
            return { isValid: false, message: 'Please select a payment method' };
        }
        if (!formData.emailConsent) {
            return { isValid: false, message: 'Email consent is required' };
        }
        if (!formData.termsAccepted) {
            return { isValid: false, message: 'You must accept the terms and conditions' };
        }
        if (!formData.edition) {
            return { isValid: false, message: 'Please select an edition' };
        }

        return { isValid: true };
    }

    // Show registration error message
    showRegistrationError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    // Show registration success message
    showRegistrationSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
            text-align: center;
            font-weight: bold;
        `;

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.parentNode.insertBefore(successDiv, registerForm.nextSibling);
            setTimeout(() => {
                successDiv.remove();
            }, 5000);
        }
    }

    // Show re-registration error message
    showReRegistrationError(message) {
        const errorElement = document.getElementById('re-register-error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    // Show re-registration success message
    showReRegistrationSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
            text-align: center;
            font-weight: bold;
        `;

        const reRegisterForm = document.getElementById('re-register-form');
        if (reRegisterForm) {
            reRegisterForm.parentNode.insertBefore(successDiv, reRegisterForm.nextSibling);
            setTimeout(() => {
                successDiv.remove();
            }, 5000);
        }
    }

    // Clear registration form
    clearRegistrationForm() {
        const form = document.getElementById('register-form');
        if (form) {
            form.reset();
            // Clear age verification selection
            const ageYesBtn = document.getElementById('age-yes-btn');
            const ageNoBtn = document.getElementById('age-no-btn');
            const ageVerifiedInput = document.getElementById('register-age-verified');
            
            if (ageYesBtn) ageYesBtn.classList.remove('selected');
            if (ageNoBtn) ageNoBtn.classList.remove('selected');
            if (ageVerifiedInput) ageVerifiedInput.value = '';
        }
    }

    // Clear re-registration form
    clearReRegistrationForm() {
        const form = document.getElementById('re-register-form');
        if (form) {
            form.reset();
        }
    }

    // Get user-friendly error message
    getRegistrationErrorMessage(error) {
        if (error.code === 'auth/email-already-in-use') {
            return 'An account with this email already exists. Please use the re-registration form instead.';
        } else if (error.code === 'auth/weak-password') {
            return 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/invalid-email') {
            return 'Please enter a valid email address.';
        } else if (error.code === 'auth/user-not-found') {
            return 'No account found with this email. Please use the main registration form instead.';
        } else if (error.code === 'auth/wrong-password') {
            return 'Incorrect password. Please try again.';
        } else {
            return 'An error occurred during registration. Please try again.';
        }
    }

    // Save user registration data to Firestore
    async saveUserRegistrationData(userId, formData) {
        const editionKey = `edition${formData.edition}`;
        const editionName = formData.edition === 'test' ? 'Test Weeks' : `Edition ${formData.edition}`;

        const userData = {
            uid: userId,
            firstName: formData.firstName,
            surname: formData.surname,
            email: formData.email,
            mobile: formData.mobile,
            paymentMethod: formData.paymentMethod,
            emailConsent: formData.emailConsent,
            whatsappConsent: formData.whatsappConsent,
            termsAccepted: formData.termsAccepted,
            status: 'active',
            lives: 3, // Start with 3 lives
            preferredEdition: formData.edition,
            registrations: {
                [editionKey]: {
                    edition: formData.edition,
                    editionName: editionName,
                    registrationDate: new Date(),
                    paymentMethod: formData.paymentMethod,
                    emailConsent: formData.emailConsent,
                    whatsappConsent: formData.whatsappConsent,
                    termsAccepted: formData.termsAccepted
                }
            },
            createdAt: new Date(),
            lastUpdated: new Date()
        };

        await this.db.collection('users').doc(userId).set(userData);
        console.log('User registration data saved to Firestore');
    }

    // Update user registration data for re-registration
    async updateUserRegistrationData(userId, formData) {
        const editionKey = `edition${formData.edition}`;
        const editionName = formData.edition === 'test' ? 'Test Weeks' : `Edition ${formData.edition}`;

        const updateData = {
            paymentMethod: formData.paymentMethod,
            emailConsent: formData.emailConsent,
            whatsappConsent: formData.whatsappConsent,
            termsAccepted: formData.termsAccepted,
            preferredEdition: formData.edition,
            lastUpdated: new Date,
            [`registrations.${editionKey}`]: {
                edition: formData.edition,
                editionName: editionName,
                registrationDate: new Date(),
                paymentMethod: formData.paymentMethod,
                emailConsent: formData.emailConsent,
                whatsappConsent: formData.whatsappConsent,
                termsAccepted: formData.termsAccepted
            }
        };

        await this.db.collection('users').doc(userId).update(updateData);
        console.log('User re-registration data updated in Firestore');
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

            const currentEdition = window.currentActiveEdition || this.currentActiveEdition;
            console.log('refreshRegistrationStats - currentEdition:', currentEdition, 'window.currentActiveEdition:', window.currentActiveEdition, 'this.currentActiveEdition:', this.currentActiveEdition);

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
                    const editionKey = `edition${currentEdition}`;
                    console.log(`Checking user ${userData.firstName} ${userData.surname} for edition key: ${editionKey}, has registration: ${!!userData.registrations[editionKey]}, status: ${userData.status}`);
                    if (userData.registrations[editionKey] && userData.status !== 'archived') {
                        currentEditionRegistrations++;
                        console.log(`✅ Counted user ${userData.firstName} ${userData.surname} for edition ${currentEdition}`);
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
            const currentEdition = window.currentActiveEdition || this.currentActiveEdition;
            console.log('updateRegistrationList - filtering for edition:', currentEdition);
            console.log('updateRegistrationList - window.currentActiveEdition:', window.currentActiveEdition);
            console.log('updateRegistrationList - this.currentActiveEdition:', this.currentActiveEdition);
            
            const usersSnapshot = await this.db.collection('users').orderBy('firstName').limit(50).get();
            const tbody = document.querySelector('#registration-list-body');

            if (!tbody) return;

            tbody.innerHTML = '';

            let displayedCount = 0;
            const editionKey = `edition${currentEdition}`;

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                
                console.log(`Checking user: ${userData.firstName} ${userData.surname}`);
                console.log(`  - Has registrations: ${!!userData.registrations}`);
                console.log(`  - Looking for edition key: ${editionKey}`);
                console.log(`  - Available editions:`, userData.registrations ? Object.keys(userData.registrations) : 'none');
                console.log(`  - Has ${editionKey}: ${!!(userData.registrations && userData.registrations[editionKey])}`);
                console.log(`  - Status: ${userData.status}`);
                
                // Only show users registered for the current edition
                if (!userData.registrations || !userData.registrations[editionKey] || userData.status === 'archived') {
                    console.log(`  ❌ Skipping user ${userData.firstName} ${userData.surname} - not registered for ${editionKey}`);
                    return; // Skip this user
                }
                
                console.log(`  ✅ Including user ${userData.firstName} ${userData.surname} for ${editionKey}`);

                const row = document.createElement('tr');
                displayedCount++;

                const name = `${userData.firstName || ''} ${userData.surname || ''}`.trim();
                const email = userData.email || '';
                const paymentMethod = userData.paymentMethod || 'Not specified';

                // Get registration info for current edition
                const currentEditionReg = userData.registrations[editionKey];
                const editionName = currentEdition === 'test' ? 'Test Weeks' : `Edition ${currentEdition}`;
                const registrationDate = currentEditionReg.registrationDate ? currentEditionReg.registrationDate.toDate().toLocaleDateString() : 'N/A';

                row.innerHTML = `
                    <td>${name}</td>
                    <td>${email}</td>
                    <td>${editionName}</td>
                    <td>${registrationDate}</td>
                    <td>${paymentMethod}</td>
                    <td>
                        <button class="secondary-button" onclick="window.registrationManager.viewUserDetails('${doc.id}')">View</button>
                    </td>
                `;

                tbody.appendChild(row);
            });

            console.log(`updateRegistrationList - displayed ${displayedCount} users for edition ${currentEdition}`);

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
        // Also update the global value to keep everything in sync
        if (window.currentActiveEdition !== edition) {
            window.currentActiveEdition = edition;
        }
    }
}

// Export the RegistrationManager class
export default RegistrationManager;
