// Button Text Service Module
// Centralized service for all button text changes and state management

class ButtonTextService {
    constructor() {
        this.buttonStates = new Map(); // Track button states
        this.originalTexts = new Map(); // Store original button text
        this.loadingStates = new Map(); // Track loading states
    }

    // === CORE BUTTON TEXT FUNCTIONS ===

    /**
     * Set button text
     */
    setButtonText(buttonId, text, preserveOriginal = true) {
        const button = this.getButton(buttonId);
        if (!button) {
            console.warn(`Button not found: ${buttonId}`);
            return false;
        }

        // Store original text if not already stored
        if (preserveOriginal && !this.originalTexts.has(buttonId)) {
            this.originalTexts.set(buttonId, button.textContent);
        }

        button.textContent = text;
        this.buttonStates.set(buttonId, text);
        
        return true;
    }

    /**
     * Get button text
     */
    getButtonText(buttonId) {
        const button = this.getButton(buttonId);
        return button ? button.textContent : null;
    }

    /**
     * Restore original button text
     */
    restoreOriginalText(buttonId) {
        const originalText = this.originalTexts.get(buttonId);
        if (originalText) {
            this.setButtonText(buttonId, originalText, false);
            this.buttonStates.delete(buttonId);
            return true;
        }
        return false;
    }

    /**
     * Set button to loading state
     */
    setButtonLoading(buttonId, loadingText = 'Loading...') {
        const button = this.getButton(buttonId);
        if (!button) return false;

        // Store current text as original if not already stored
        if (!this.originalTexts.has(buttonId)) {
            this.originalTexts.set(buttonId, button.textContent);
        }

        // Set loading state
        button.textContent = loadingText;
        button.disabled = true;
        this.loadingStates.set(buttonId, true);
        
        return true;
    }

    /**
     * Restore button from loading state
     */
    restoreButtonFromLoading(buttonId) {
        const button = this.getButton(buttonId);
        if (!button) return false;

        // Restore original text
        this.restoreOriginalText(buttonId);
        
        // Re-enable button
        button.disabled = false;
        this.loadingStates.delete(buttonId);
        
        return true;
    }

    // === SPECIALIZED BUTTON FUNCTIONS ===

    /**
     * Set sign-in button states
     */
    setSignInButtonLoading(buttonId) {
        return this.setButtonLoading(buttonId, 'Signing in...');
    }

    setSignInButtonReady(buttonId) {
        return this.restoreButtonFromLoading(buttonId);
    }

    /**
     * Set login button states
     */
    setLoginButtonLoading(buttonId) {
        return this.setButtonLoading(buttonId, 'Logging in...');
    }

    setLoginButtonReady(buttonId) {
        return this.restoreButtonFromLoading(buttonId);
    }

    /**
     * Set logout button states
     */
    setLogoutButtonLoading(buttonId) {
        return this.setButtonLoading(buttonId, 'Logging out...');
    }

    setLogoutButtonReady(buttonId) {
        return this.restoreButtonFromLoading(buttonId);
    }

    /**
     * Set save button states
     */
    setSaveButtonLoading(buttonId) {
        return this.setButtonLoading(buttonId, 'Saving...');
    }

    setSaveButtonReady(buttonId) {
        return this.restoreButtonFromLoading(buttonId);
    }

    /**
     * Set submit button states
     */
    setSubmitButtonLoading(buttonId) {
        return this.setButtonLoading(buttonId, 'Submitting...');
    }

    setSubmitButtonReady(buttonId) {
        return this.restoreButtonFromLoading(buttonId);
    }

    /**
     * Set reset button states
     */
    setResetButtonLoading(buttonId) {
        return this.setButtonLoading(buttonId, 'Resetting...');
    }

    setResetButtonReady(buttonId) {
        return this.restoreButtonFromLoading(buttonId);
    }

    // === TOGGLE BUTTON FUNCTIONS ===

    /**
     * Toggle button text between two states
     */
    toggleButtonText(buttonId, text1, text2) {
        const currentText = this.getButtonText(buttonId);
        const newText = currentText === text1 ? text2 : text1;
        return this.setButtonText(buttonId, newText);
    }

    /**
     * Toggle auto-scroll button
     */
    toggleAutoScrollButton(buttonId, isEnabled) {
        const text = isEnabled ? 'Disable Auto-scroll' : 'Enable Auto-scroll';
        return this.setButtonText(buttonId, text);
    }

    /**
     * Toggle testimonial button
     */
    toggleTestimonialButton(buttonId, isExpanded) {
        const text = isExpanded ? 'Hide Testimonials' : 'What Our Players Say...';
        return this.setButtonText(buttonId, text);
    }

    // === FORM BUTTON FUNCTIONS ===

    /**
     * Set form button to processing state
     */
    setFormButtonProcessing(buttonId, action = 'Processing') {
        return this.setButtonLoading(buttonId, `${action}...`);
    }

    /**
     * Set form button to success state
     */
    setFormButtonSuccess(buttonId, message = 'Success!') {
        const button = this.getButton(buttonId);
        if (!button) return false;

        button.textContent = message;
        button.disabled = true;
        
        // Auto-restore after 3 seconds
        setTimeout(() => {
            this.restoreButtonFromLoading(buttonId);
        }, 3000);
        
        return true;
    }

    /**
     * Set form button to error state
     */
    setFormButtonError(buttonId, errorMessage = 'Error occurred') {
        const button = this.getButton(buttonId);
        if (!button) return false;

        button.textContent = errorMessage;
        button.disabled = true;
        
        // Auto-restore after 5 seconds
        setTimeout(() => {
            this.restoreButtonFromLoading(buttonId);
        }, 5000);
        
        return true;
    }

    // === BATCH OPERATIONS ===

    /**
     * Set multiple buttons to loading state
     */
    setMultipleButtonsLoading(buttonIds, loadingText = 'Loading...') {
        const results = {};
        buttonIds.forEach(buttonId => {
            results[buttonId] = this.setButtonLoading(buttonId, loadingText);
        });
        return results;
    }

    /**
     * Restore multiple buttons from loading state
     */
    restoreMultipleButtonsFromLoading(buttonIds) {
        const results = {};
        buttonIds.forEach(buttonId => {
            results[buttonId] = this.restoreButtonFromLoading(buttonId);
        });
        return results;
    }

    /**
     * Set multiple buttons text
     */
    setMultipleButtonsText(buttonTextMap) {
        const results = {};
        for (const [buttonId, text] of Object.entries(buttonTextMap)) {
            results[buttonId] = this.setButtonText(buttonId, text);
        }
        return results;
    }

    // === UTILITY FUNCTIONS ===

    /**
     * Get button element
     */
    getButton(buttonId) {
        // Try by ID first
        let button = document.getElementById(buttonId);
        
        // Try by selector if ID doesn't work
        if (!button) {
            button = document.querySelector(buttonId);
        }
        
        // Try by data attribute
        if (!button) {
            button = document.querySelector(`[data-button-id="${buttonId}"]`);
        }
        
        return button;
    }

    /**
     * Check if button is in loading state
     */
    isButtonLoading(buttonId) {
        return this.loadingStates.has(buttonId);
    }

    /**
     * Get all button states
     */
    getAllButtonStates() {
        return Object.fromEntries(this.buttonStates);
    }

    /**
     * Get all original texts
     */
    getAllOriginalTexts() {
        return Object.fromEntries(this.originalTexts);
    }

    /**
     * Clear all button states
     */
    clearAllButtonStates() {
        this.buttonStates.clear();
        this.originalTexts.clear();
        this.loadingStates.clear();
        console.log('🔧 All button states cleared');
    }

    /**
     * Reset button to original state
     */
    resetButton(buttonId) {
        const button = this.getButton(buttonId);
        if (!button) return false;

        // Restore original text
        this.restoreOriginalText(buttonId);
        
        // Re-enable button
        button.disabled = false;
        
        // Clear loading state
        this.loadingStates.delete(buttonId);
        
        return true;
    }

    /**
     * Reset all buttons to original state
     */
    resetAllButtons() {
        const buttonIds = Array.from(this.buttonStates.keys());
        const results = {};
        
        buttonIds.forEach(buttonId => {
            results[buttonId] = this.resetButton(buttonId);
        });
        
        return results;
    }
}

// Export the ButtonTextService class
export default ButtonTextService;

