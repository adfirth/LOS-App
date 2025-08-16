/**
 * Application State Management
 * Centralizes application state to replace global variables
 */
export class AppState {
    constructor() {
        this.state = {
            currentActiveEdition: 'test',
            currentActiveGameweek: '1',
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            notifications: []
        };
        
        this.listeners = new Map();
        this.history = [];
        this.maxHistory = 50;
    }

    /**
     * Get current state
     * @param {string} key - Optional key to get specific state property
     * @returns {any} - Current state or specific property
     */
    get(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }

    /**
     * Update state
     * @param {Object|Function} update - Object with updates or function that receives current state
     * @param {string} action - Optional action name for debugging
     */
    set(update, action = 'state-update') {
        const previousState = { ...this.state };
        
        if (typeof update === 'function') {
            this.state = { ...this.state, ...update(this.state) };
        } else {
            this.state = { ...this.state, ...update };
        }

        // Add to history
        this.addToHistory(previousState, action);

        // Notify listeners
        this.notifyListeners(previousState);
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch (optional)
     * @param {Function} callback - Function to call when state changes
     * @returns {Function} - Unsubscribe function
     */
    subscribe(key, callback) {
        if (typeof key === 'function') {
            callback = key;
            key = null;
        }

        const id = Math.random().toString(36).substr(2, 9);
        this.listeners.set(id, { key, callback });

        return () => {
            this.listeners.delete(id);
        };
    }

    /**
     * Notify all listeners of state changes
     * @param {Object} previousState - Previous state for comparison
     */
    notifyListeners(previousState) {
        this.listeners.forEach(({ key, callback }) => {
            if (key) {
                // Only notify if specific key changed
                if (this.state[key] !== previousState[key]) {
                    callback(this.state[key], previousState[key]);
                }
            } else {
                // Notify for any change
                callback(this.state, previousState);
            }
        });
    }

    /**
     * Add state change to history
     * @param {Object} previousState - Previous state
     * @param {string} action - Action that caused the change
     */
    addToHistory(previousState, action) {
        this.history.push({
            timestamp: Date.now(),
            action,
            previousState,
            currentState: { ...this.state }
        });

        // Keep history size manageable
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Get state history
     * @returns {Array} - Array of state changes
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.set({
            currentActiveEdition: 1,
            currentActiveGameweek: '1',
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            notifications: []
        }, 'state-reset');
    }

    /**
     * Set current active edition
     * @param {number} edition - Edition number
     */
    setActiveEdition(edition) {
        this.set({ currentActiveEdition: edition }, 'set-active-edition');
    }

    /**
     * Set current active gameweek
     * @param {string} gameweek - Gameweek identifier
     */
    setActiveGameweek(gameweek) {
        this.set({ currentActiveGameweek: gameweek }, 'set-active-gameweek');
    }

    /**
     * Set user authentication state
     * @param {Object} user - User object
     * @param {boolean} isAuthenticated - Authentication status
     */
    setAuthState(user, isAuthenticated) {
        this.set({ user, isAuthenticated }, 'set-auth-state');
    }

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading status
     */
    setLoading(isLoading) {
        this.set({ isLoading }, 'set-loading');
    }

    /**
     * Set error state
     * @param {string|null} error - Error message or null to clear
     */
    setError(error) {
        this.set({ error }, 'set-error');
    }

    /**
     * Add notification
     * @param {Object} notification - Notification object
     */
    addNotification(notification) {
        const notifications = [...this.state.notifications, {
            id: Date.now(),
            timestamp: Date.now(),
            ...notification
        }];
        this.set({ notifications }, 'add-notification');
    }

    /**
     * Remove notification
     * @param {string} id - Notification ID
     */
    removeNotification(id) {
        const notifications = this.state.notifications.filter(n => n.id !== id);
        this.set({ notifications }, 'remove-notification');
    }

    /**
     * Clear all notifications
     */
    clearNotifications() {
        this.set({ notifications: [] }, 'clear-notifications');
    }
}

// Create singleton instance
export const appState = new AppState();

// Export for backward compatibility
export default appState;
