// Deadline Service Module
// Single source of truth for all deadline operations across the application

class DeadlineService {
    constructor(db, editionService = null) {
        this.db = db;
        this.editionService = editionService;
        this.deadlineCache = new Map(); // Cache deadlines to avoid repeated database calls
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
    }

    // === CORE DEADLINE FUNCTIONS ===

    /**
     * Get the deadline for a specific gameweek and edition
     * This is the SINGLE source of truth for deadline data
     */
    async getDeadlineForGameweek(gameweek, edition = null, userData = null, userId = null) {
        // If no edition provided, try to get it from EditionService
        if (edition === null && this.editionService) {
            edition = this.editionService.getCurrentUserEdition();
        }
        
        // Fallback to edition 1 if still no edition
        if (edition === null) {
            edition = 1;
        }
        
        const cacheKey = `${edition}_${gameweek}`;
        
        // Check cache first
        if (this.deadlineCache.has(cacheKey)) {
            const cached = this.deadlineCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.deadline;
            }
        }

        try {
            // Handle tiebreak gameweek
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${edition}_${gameweekKey}`;
            
            console.log(`🔧 DeadlineService: Fetching deadline for ${editionGameweekKey}`);
            
            // Try new structure first, then fallback to old structure
            let doc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            if (!doc.exists) {
                // Fallback to old structure for backward compatibility
                doc = await this.db.collection('fixtures').doc(gameweekKey).get();
                if (doc.exists) {
                    console.log(`🔧 DeadlineService: Using fallback structure for ${gameweekKey}`);
                }
            }
            
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                if (fixtures && fixtures.length > 0) {
                    // Find the earliest fixture (deadline)
                    const earliestFixture = fixtures.reduce((earliest, fixture) => {
                        const fixtureDate = this.createFixtureDateTime(fixture);
                        const earliestDate = this.createFixtureDateTime(earliest);
                        return fixtureDate < earliestDate ? fixture : earliest;
                    });

                    // Create the deadline datetime object
                    const deadline = this.createFixtureDateTime(earliestFixture);
                    
                    // Cache the result
                    this.deadlineCache.set(cacheKey, {
                        deadline: deadline,
                        timestamp: Date.now()
                    });
                    
                    console.log(`🔧 DeadlineService: Deadline found for ${editionGameweekKey}:`, deadline);
                    return deadline;
                }
            }
            
            console.log(`🔧 DeadlineService: No deadline found for ${editionGameweekKey}`);
            return null;
        } catch (error) {
            console.error('Error getting deadline for gameweek:', error);
            return null;
        }
    }

    /**
     * Check if deadline has passed for a gameweek
     */
    async isDeadlinePassed(gameweek, edition = null, userData = null, userId = null) {
        const deadline = await this.getDeadlineForGameweek(gameweek, edition, userData, userId);
        if (!deadline) return false;
        
        const now = new Date();
        return deadline <= now;
    }

    /**
     * Get formatted deadline string for display
     */
    async getFormattedDeadline(gameweek, edition = null, userData = null, userId = null, format = 'short') {
        const deadline = await this.getDeadlineForGameweek(gameweek, edition, userData, userId);
        if (!deadline) return 'No deadline set';
        
        switch (format) {
            case 'short':
                return deadline.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/London'
                });
            case 'long':
                return deadline.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/London'
                });
            case 'relative':
                return this.getRelativeDeadline(deadline);
            default:
                return deadline.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/London'
                });
        }
    }

    // === HELPER FUNCTIONS ===

    /**
     * Create a proper datetime object from fixture data
     * This is the SINGLE place where fixture dates are converted to Date objects
     */
    createFixtureDateTime(fixture) {
        if (!fixture.date) return null;
        
        let dateString = fixture.date;
        
        // If the date already contains time (has 'T' or ':'), use it as-is
        if (dateString.includes('T') || dateString.includes(':')) {
            // Date already has time component, use it directly
            return new Date(dateString);
        }
        
        // If no time component, check if we have kickOffTime
        if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
            // Combine date with kick-off time
            dateString = `${fixture.date}T${fixture.kickOffTime}`;
        } else {
            // Fallback: If no kick-off time, assume 15:00 (3 PM) for Saturday fixtures
            dateString = `${fixture.date}T15:00:00`;
        }
        
        return new Date(dateString);
    }

    /**
     * Get relative deadline (e.g., "2 days", "3 hours", "Deadline passed")
     */
    getRelativeDeadline(deadline) {
        const now = new Date();
        const timeDiff = deadline.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
            return 'Deadline passed';
        } else if (daysDiff === 0) {
            const hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
            if (hoursDiff <= 0) {
                const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
                return `${minutesDiff} minutes`;
            }
            return `${hoursDiff} hours`;
        } else if (daysDiff === 1) {
            return 'Tomorrow';
        } else {
            return `${daysDiff} days`;
        }
    }

    /**
     * Clear deadline cache (useful when fixtures are updated)
     */
    clearCache() {
        this.deadlineCache.clear();
        console.log('🔧 Deadline cache cleared');
    }

    /**
     * Clear specific gameweek cache
     */
    clearGameweekCache(gameweek, edition = 1) {
        const cacheKey = `${edition}_${gameweek}`;
        this.deadlineCache.delete(cacheKey);
        console.log(`🔧 Deadline cache cleared for ${edition}_${gameweek}`);
    }

    // === BATCH OPERATIONS ===

    /**
     * Batch check deadlines for multiple gameweeks
     */
    async batchCheckDeadlines(gameweeks, edition = 1) {
        const results = {};
        const promises = gameweeks.map(async (gameweek) => {
            const isDeadlinePassed = await this.isDeadlinePassed(gameweek, edition);
            results[gameweek] = isDeadlinePassed;
        });
        
        await Promise.all(promises);
        return results;
    }

    /**
     * Get deadlines for all gameweeks
     */
    async getAllDeadlines(edition = 1) {
        const gameweeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'tiebreak'];
        const deadlines = {};
        
        for (const gameweek of gameweeks) {
            deadlines[gameweek] = await this.getDeadlineForGameweek(gameweek, edition);
        }
        
        return deadlines;
    }
}

// Export the DeadlineService class
export default DeadlineService;
