// Status Service Module
// Centralized service for all status messages and notifications

class StatusService {
    constructor() {
        this.statusElements = new Map();
        this.statusTimeouts = new Map();
        this.defaultTimeout = 5000; // 5 seconds
    }

    // === CORE STATUS FUNCTIONS ===

    /**
     * Show a success status message
     */
    showSuccess(elementId, message, timeout = this.defaultTimeout) {
        this.showStatus(elementId, message, 'success', timeout);
    }

    /**
     * Show an error status message
     */
    showError(elementId, message, timeout = this.defaultTimeout) {
        this.showStatus(elementId, message, 'error', timeout);
    }

    /**
     * Show an info status message
     */
    showInfo(elementId, message, timeout = this.defaultTimeout) {
        this.showStatus(elementId, message, 'info', timeout);
    }

    /**
     * Show a warning status message
     */
    showWarning(elementId, message, timeout = this.defaultTimeout) {
        this.showStatus(elementId, message, 'warning', timeout);
    }

    /**
     * Clear a status message
     */
    clearStatus(elementId) {
        const element = this.getStatusElement(elementId);
        if (element) {
            element.textContent = '';
            element.className = 'status-message';
        }
        
        // Clear any existing timeout
        if (this.statusTimeouts.has(elementId)) {
            clearTimeout(this.statusTimeouts.get(elementId));
            this.statusTimeouts.delete(elementId);
        }
    }

    // === PRIVATE METHODS ===

    /**
     * Show a status message with specified type
     */
    showStatus(elementId, message, type, timeout) {
        const element = this.getStatusElement(elementId);
        if (!element) {
            console.warn(`Status element not found: ${elementId}`);
            return;
        }

        // Clear any existing timeout
        this.clearStatus(elementId);

        // Set the message and styling
        element.textContent = message;
        element.className = `status-message status-${type}`;

        // Auto-clear after timeout
        if (timeout > 0) {
            const timeoutId = setTimeout(() => {
                this.clearStatus(elementId);
            }, timeout);
            this.statusTimeouts.set(elementId, timeoutId);
        }
    }

    /**
     * Get or create a status element
     */
    getStatusElement(elementId) {
        if (this.statusElements.has(elementId)) {
            return this.statusElements.get(elementId);
        }

        let element = document.getElementById(elementId);
        if (!element) {
            // Try to find by class or create if needed
            element = document.querySelector(`[data-status-id="${elementId}"]`);
        }

        if (element) {
            this.statusElements.set(elementId, element);
            return element;
        }

        return null;
    }

    // === SPECIALIZED STATUS FUNCTIONS ===

    /**
     * Show fixture operation status
     */
    showFixtureStatus(elementId, operation, count, gameweek, timeout = this.defaultTimeout) {
        const message = `✅ Successfully ${operation} ${count} fixtures from Game Week ${gameweek}`;
        this.showSuccess(elementId, message, timeout);
    }

    /**
     * Show fixture operation error
     */
    showFixtureError(elementId, operation, error, timeout = this.defaultTimeout) {
        const message = `❌ Error ${operation} fixtures: ${error.message}`;
        this.showError(elementId, message, timeout);
    }

    /**
     * Show settings save status
     */
    showSettingsStatus(elementId, success, error = null, timeout = this.defaultTimeout) {
        if (success) {
            this.showSuccess(elementId, 'Settings saved successfully!', timeout);
        } else {
            this.showError(elementId, `Error saving settings: ${error?.message || 'Unknown error'}`, timeout);
        }
    }

    /**
     * Show pick status
     */
    showPickStatus(elementId, hasPick, teamName = null, timeout = this.defaultTimeout) {
        if (hasPick && teamName) {
            this.showSuccess(elementId, `Pick made: ${teamName}`, timeout);
        } else {
            this.showInfo(elementId, 'No pick made yet', timeout);
        }
    }

    // === BATCH OPERATIONS ===

    /**
     * Clear all status messages
     */
    clearAllStatuses() {
        for (const [elementId] of this.statusElements) {
            this.clearStatus(elementId);
        }
    }

    /**
     * Set timeout for all status messages
     */
    setDefaultTimeout(timeout) {
        this.defaultTimeout = timeout;
    }
}

// Export the StatusService class
export default StatusService;
