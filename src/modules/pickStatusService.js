// Pick Status Service Module
// Centralized service for all pick status operations and display logic

class PickStatusService {
    constructor(db, deadlineService) {
        this.db = db;
        this.deadlineService = deadlineService;
        this.pickStatusCache = new Map(); // Cache pick status to avoid repeated calculations
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache timeout
    }

    // === CORE PICK STATUS FUNCTIONS ===

    /**
     * Get the complete pick status for a team in a specific gameweek
     * This is the SINGLE source of truth for pick status logic
     */
    async getTeamPickStatus(teamName, userData, currentGameWeek, userId) {
        const cacheKey = `${userId}_${currentGameWeek}_${teamName}`;
        
        // Check cache first
        if (this.pickStatusCache.has(cacheKey)) {
            const cached = this.pickStatusCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.status;
            }
        }

        try {
            // Basic validation
            if (!teamName || !userData || !currentGameWeek || !userId) {
                console.log('🔍 PickStatusService: Missing required data:', { teamName, userData: !!userData, currentGameWeek, userId });
                return { status: 'normal', clickable: false, reason: 'No user data' };
            }

            const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
            const currentPick = userData.picks && userData.picks[gameweekKey];

            // Debug logging
            console.log('🔍 PickStatusService: Checking pick status for:', {
                teamName,
                currentGameWeek,
                gameweekKey,
                currentPick,
                allPicks: userData.picks,
                userId
            });

            // Check if this is the current pick for this gameweek
            if (currentPick === teamName) {
                const status = { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
                this.cachePickStatus(cacheKey, status);
                return status;
            }

            // Check if team is picked in another gameweek
            const existingPicks = Object.values(userData.picks || {});
            if (existingPicks.includes(teamName)) {
                const pickedGameweek = this.findPickedGameweek(userData.picks, teamName);
                if (pickedGameweek) {
                    const pickedGameweekNum = pickedGameweek === 'gwtiebreak' ? 'tiebreak' : pickedGameweek.replace('gw', '');
                    const userEdition = this.getUserEdition(userData);
                    
                    // Check if deadline has passed for the picked gameweek
                    const isDeadlinePassed = await this.deadlineService.isDeadlinePassed(pickedGameweekNum, userEdition);
                    
                    if (isDeadlinePassed) {
                        const status = { 
                            status: 'completed-pick', 
                            clickable: false, 
                            reason: `Picked in completed ${pickedGameweekNum}` 
                        };
                        this.cachePickStatus(cacheKey, status);
                        return status;
                    } else {
                        const status = { 
                            status: 'future-pick', 
                            clickable: true, 
                            reason: `Picked in future ${pickedGameweekNum}` 
                        };
                        this.cachePickStatus(cacheKey, status);
                        return status;
                    }
                }
            }

            // Check if deadline has passed for current gameweek
            const userEdition = this.getUserEdition(userData);
            const deadlinePassed = await this.deadlineService.isDeadlinePassed(currentGameWeek, userEdition);
            
            if (deadlinePassed) {
                const status = { status: 'deadline-passed', clickable: false, reason: 'Deadline passed' };
                this.cachePickStatus(cacheKey, status);
                return status;
            }

            // Team is available for picking
            const status = { status: 'available', clickable: true, reason: 'Available for picking' };
            this.cachePickStatus(cacheKey, status);
            return status;

        } catch (error) {
            console.error('Error getting team pick status:', error);
            // Fallback to simple status
            return { status: 'available', clickable: true, reason: 'Available for picking' };
        }
    }

    /**
     * Get simple pick status (for performance-critical operations)
     */
    getTeamPickStatusSimple(teamName, userData, currentGameWeek, userId) {
        try {
            // Basic validation
            if (!teamName || !userData || !currentGameWeek || !userId) {
                return { status: 'normal', clickable: false, reason: 'No user data' };
            }
            
            const gameweekKey = currentGameWeek === 'tiebreak' ? 'gwtiebreak' : `gw${currentGameWeek}`;
            const currentPick = userData.picks && userData.picks[gameweekKey];
            
            // Simple check for current pick
            if (currentPick === teamName) {
                return { status: 'current-pick', clickable: false, reason: 'Current pick for this gameweek' };
            }
            
            // Simple check for existing picks
            const existingPicks = Object.values(userData.picks || {});
            if (existingPicks.includes(teamName)) {
                return { status: 'future-pick', clickable: true, reason: 'Picked in another gameweek' };
            }
            
            // Default to available
            return { status: 'available', clickable: true, reason: 'Available for picking' };
            
        } catch (error) {
            console.error('Error in getTeamPickStatusSimple:', error);
            return { status: 'available', clickable: true, reason: 'Available for picking' };
        }
    }

    /**
     * Get pick status for all teams in a gameweek
     */
    async getAllTeamPickStatuses(teams, userData, currentGameWeek, userId) {
        const statuses = {};
        
        for (const team of teams) {
            statuses[team] = await this.getTeamPickStatus(team, userData, currentGameWeek, userId);
        }
        
        return statuses;
    }

    // === PICK OPERATIONS ===

    /**
     * Make a pick for a team in a gameweek
     */
    async makePick(teamName, gameweek, userId) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            
            // Check if deadline has passed
            const deadlinePassed = await this.deadlineService.isDeadlinePassed(gameweek);
            if (deadlinePassed) {
                throw new Error('Deadline has passed for this gameweek');
            }

            // Save the pick to database
            await this.db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: teamName
            });

            // Clear relevant caches
            this.clearPickStatusCache(userId, gameweek);
            
            return { success: true, message: `Pick saved: ${teamName} for Game Week ${gameweek}` };
        } catch (error) {
            console.error('Error making pick:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Remove a pick for a gameweek
     */
    async removePick(gameweek, userId) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            
            // Check if deadline has passed
            const deadlinePassed = await this.deadlineService.isDeadlinePassed(gameweek);
            if (deadlinePassed) {
                throw new Error('Cannot remove pick - deadline has passed for this gameweek');
            }

            // Remove the pick from database
            await this.db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: this.db.FieldValue.delete()
            });

            // Clear relevant caches
            this.clearPickStatusCache(userId, gameweek);
            
            return { success: true, message: 'Pick removed successfully' };
        } catch (error) {
            console.error('Error removing pick:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Release a team from a future gameweek
     */
    async releaseFuturePick(teamName, gameweek, userId) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            
            // Check if deadline has passed
            const deadlinePassed = await this.deadlineService.isDeadlinePassed(gameweek);
            if (deadlinePassed) {
                throw new Error('Cannot release pick - deadline has passed for this gameweek');
            }

            // Remove the pick from database
            await this.db.collection('users').doc(userId).update({
                [`picks.${gameweekKey}`]: this.db.FieldValue.delete()
            });

            // Clear relevant caches
            this.clearPickStatusCache(userId, gameweek);
            
            return { success: true, message: `Future pick released: ${teamName} from Game Week ${gameweek}` };
        } catch (error) {
            console.error('Error releasing future pick:', error);
            return { success: false, message: error.message };
        }
    }

    // === PICK DISPLAY FUNCTIONS ===

    /**
     * Update pick status header for a gameweek
     */
    async updatePickStatusHeader(gameweek, userData, userId, isMobile = false) {
        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const currentPick = userData.picks && userData.picks[gameweekKey];
            
            // Check if deadline has passed
            const userEdition = this.getUserEdition(userData);
            const deadlinePassed = await this.deadlineService.isDeadlinePassed(gameweek, userEdition);
            
            if (deadlinePassed) {
                this.hidePickStatusHeader(isMobile);
                return;
            }
            
            // Show pick status header
            this.showPickStatusHeader(isMobile);
            
            if (currentPick) {
                this.displayPickStatus(currentPick, true, isMobile);
            } else {
                this.displayPickStatus(null, false, isMobile);
            }
            
        } catch (error) {
            console.error('Error updating pick status header:', error);
        }
    }

    /**
     * Display pick status in the UI
     */
    displayPickStatus(teamName, hasPick, isMobile = false) {
        const prefix = isMobile ? 'mobile' : '';
        const pickStatusDisplay = document.querySelector(`#${prefix}-pick-status-display`);
        const pickStatusHeader = document.querySelector(`.${prefix}-deadline-section .pick-status-header`);
        
        if (!pickStatusDisplay || !pickStatusHeader) return;
        
        if (hasPick && teamName) {
            pickStatusDisplay.textContent = `Saved Pick: ${teamName}`;
            pickStatusDisplay.className = 'pick-status-text saved';
            pickStatusHeader.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
            pickStatusHeader.style.borderColor = 'rgba(40, 167, 69, 0.3)';
        } else {
            pickStatusDisplay.textContent = '⚠️ Make your pick before the deadline!';
            pickStatusDisplay.className = 'pick-status-text prompt';
            pickStatusHeader.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
            pickStatusHeader.style.borderColor = 'rgba(220, 53, 69, 0.3)';
        }
    }

    // === HELPER FUNCTIONS ===

    /**
     * Find which gameweek a team was picked in
     */
    findPickedGameweek(picks, teamName) {
        for (const [key, pick] of Object.entries(picks || {})) {
            if (pick === teamName) {
                return key;
            }
        }
        return null;
    }

    /**
     * Get user edition from user data
     */
    getUserEdition(userData) {
        if (!userData) {
            console.log('🔍 PickStatusService: No user data provided, defaulting to edition 1');
            return 1;
        }
        
        // Check if user has a preferred edition set
        if (userData.preferredEdition) {
            console.log('🔍 PickStatusService: Using preferred edition:', userData.preferredEdition);
            return userData.preferredEdition;
        }
        
        // Check registrations to find which edition they're registered for
        if (userData.registrations) {
            console.log('🔍 PickStatusService: Checking registrations:', userData.registrations);
            
            // Check for Edition 1 first
            if (userData.registrations.edition1) {
                console.log('🔍 PickStatusService: Found Edition 1 registration');
                return '1';
            }
            // Check for Test Weeks
            if (userData.registrations.editiontest) {
                console.log('🔍 PickStatusService: Found Test Weeks registration');
                return 'test';
            }
            // Check for other editions
            for (const [editionKey, isRegistered] of Object.entries(userData.registrations)) {
                if (isRegistered && editionKey !== 'edition1' && editionKey !== 'editiontest') {
                    const editionNumber = editionKey.replace('edition', '');
                    console.log('🔍 PickStatusService: Found other edition registration:', editionNumber);
                    return editionNumber;
                }
            }
        }
        
        // Legacy fallbacks
        if (userData.edition) {
            console.log('🔍 PickStatusService: Using legacy edition field:', userData.edition);
            return userData.edition;
        }
        
        if (userData.registeredEditions && userData.registeredEditions.length > 0) {
            console.log('🔍 PickStatusService: Using legacy registeredEditions:', userData.registeredEditions[0]);
            return userData.registeredEditions[0];
        }
        
        console.log('🔍 PickStatusService: No edition found, defaulting to edition 1');
        return 1; // Default to edition 1
    }

    /**
     * Show pick status header
     */
    showPickStatusHeader(isMobile = false) {
        const prefix = isMobile ? 'mobile' : '';
        const pickStatusDisplay = document.querySelector(`#${prefix}-pick-status-display`);
        const pickStatusHeader = document.querySelector(`.${prefix}-deadline-section .pick-status-header`);
        
        if (pickStatusDisplay) pickStatusDisplay.style.display = 'block';
        if (pickStatusHeader) pickStatusHeader.style.display = 'block';
    }

    /**
     * Hide pick status header
     */
    hidePickStatusHeader(isMobile = false) {
        const prefix = isMobile ? 'mobile' : '';
        const pickStatusDisplay = document.querySelector(`#${prefix}-pick-status-display`);
        const pickStatusHeader = document.querySelector(`.${prefix}-deadline-section .pick-status-header`);
        
        if (pickStatusDisplay) pickStatusDisplay.style.display = 'none';
        if (pickStatusHeader) pickStatusHeader.style.display = 'none';
    }

    // === CACHE MANAGEMENT ===

    /**
     * Cache pick status result
     */
    cachePickStatus(cacheKey, status) {
        this.pickStatusCache.set(cacheKey, {
            status: status,
            timestamp: Date.now()
        });
    }

    /**
     * Clear pick status cache for a user and gameweek
     */
    clearPickStatusCache(userId, gameweek) {
        const keysToDelete = [];
        for (const [key] of this.pickStatusCache) {
            if (key.startsWith(`${userId}_${gameweek}_`)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.pickStatusCache.delete(key));
        console.log(`🔧 Pick status cache cleared for user ${userId}, gameweek ${gameweek}`);
    }

    /**
     * Clear all pick status cache
     */
    clearAllPickStatusCache() {
        this.pickStatusCache.clear();
        console.log('🔧 All pick status cache cleared');
    }
}

// Export the PickStatusService class
export default PickStatusService;

