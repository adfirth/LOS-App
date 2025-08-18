/**
 * Enhanced Pick Manager - Handles saved picks and locked picks functionality
 * Manages the complex logic for pick availability, saved picks, and locked picks
 */
class EnhancedPickManager {
    constructor() {
        console.log('🔧 EnhancedPickManager: Initialized');
    }

    /**
     * Get the Firebase database reference
     * @returns {Object} Firebase database reference
     */
    getDb() {
        if (window.db) {
            return window.db;
        }
        if (window.app && window.app.db) {
            return window.app.db;
        }
        console.error('🔧 EnhancedPickManager: No database reference available');
        return null;
    }

    /**
     * Get the status of a team for a specific gameweek
     * @param {string} teamName - Name of the team
     * @param {string} gameweek - Current gameweek being viewed
     * @param {Object} userData - User data including picks
     * @param {Array} fixtures - Fixtures for the current gameweek
     * @returns {Promise<Object>} Team status object
     */
    async getTeamStatus(teamName, gameweek, userData, fixtures) {
        if (!userData || !userData.picks) {
            return {
                status: 'available',
                clickable: true,
                tooltip: 'Click to pick this team',
                classes: 'team-pick-button available',
                action: 'pick'
            };
        }

        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const currentPickData = userData.picks[gameweekKey] || null;
        const currentPick = currentPickData && typeof currentPickData === 'object' ? currentPickData.team : currentPickData;
        const isAutopick = currentPickData && currentPickData.isAutopick;
        const gameweekStatus = this.getGameweekStatus(fixtures, gameweek);
        const lockedPicks = await this.getLockedPicks(userData.picks, gameweek);
        const savedPicks = this.getSavedPicks(userData.picks, gameweek);

        // Check if this is the current pick for this gameweek
        if (currentPick === teamName) {
            const canChange = gameweekStatus === 'not-started';
            const autopickIndicator = isAutopick ? ' (A)' : '';
            return {
                status: 'current-pick',
                clickable: canChange,
                tooltip: canChange ? 
                    `Current pick${autopickIndicator} - click to change` : 
                    `Current pick${autopickIndicator} for this gameweek (locked)`,
                classes: `team-pick-button current-pick ${canChange ? 'changeable' : 'locked'} ${isAutopick ? 'autopick' : ''}`,
                action: canChange ? 'change' : 'locked',
                isAutopick: isAutopick
            };
        }

        // Check if team is locked (picked in a previous gameweek that has passed deadline)
        if (lockedPicks.includes(teamName)) {
            const lockedGameweek = this.getGameweekWhereTeamPicked(teamName, userData.picks);
            return {
                status: 'locked-pick',
                clickable: false,
                tooltip: `Team locked - picked for ${lockedGameweek} (deadline passed)`,
                classes: 'team-pick-button locked-pick',
                action: 'locked'
            };
        }

        // Check if team is saved for a future gameweek
        if (savedPicks.includes(teamName)) {
            const savedGameweek = this.getGameweekWhereTeamPicked(teamName, userData.picks);
            
            // Only allow saved picks to be clickable if the current gameweek hasn't started
            const canTransfer = gameweekStatus === 'not-started';
            
            return {
                status: 'saved-pick',
                clickable: canTransfer,
                tooltip: canTransfer ? 
                    `Picked for ${savedGameweek} - click to release and pick for ${gameweek}` : 
                    `Picked for ${savedGameweek} - cannot transfer (gameweek locked)`,
                classes: `team-pick-button saved-pick ${canTransfer ? 'transferable' : 'locked'}`,
                action: canTransfer ? 'release-and-pick' : 'locked',
                savedGameweek: savedGameweek
            };
        }

        // Check if team is available for picking
        const canPick = gameweekStatus === 'not-started';
        return {
            status: 'available',
            clickable: canPick,
            tooltip: canPick ? 'Click to pick this team' : 'Gameweek has started - cannot pick',
            classes: `team-pick-button available ${canPick ? 'pickable' : 'unavailable'}`,
            action: canPick ? 'pick' : 'unavailable'
        };
    }

    /**
     * Get saved picks (picks made for other gameweeks - not the current one being viewed)
     * @param {Object} picks - User's picks object
     * @param {string} currentGameweek - Current gameweek being viewed
     * @returns {Array} Array of team names that are saved for other gameweeks
     */
    getSavedPicks(picks, currentGameweek) {
        if (!picks) return [];

        const savedPicks = [];
        const currentGameweekNum = parseInt(currentGameweek);

        Object.entries(picks).forEach(([gameweekKey, teamData]) => {
            if (gameweekKey === 'gwtiebreak') return;

            let gameweekNum;
            if (gameweekKey.startsWith('gw')) {
                gameweekNum = parseInt(gameweekKey.replace('gw', ''));
            } else {
                gameweekNum = parseInt(gameweekKey);
            }

            // If this pick is for a different gameweek (not the current one being viewed), it's a saved pick
            if (gameweekNum !== currentGameweekNum) {
                const teamName = teamData && typeof teamData === 'object' ? teamData.team : teamData;
                if (teamName) {
                    savedPicks.push(teamName);
                }
            }
        });

        return savedPicks;
    }

    /**
     * Get locked picks (picks that can't be changed due to deadlines)
     * @param {Object} picks - User's picks object
     * @param {string} currentGameweek - Current gameweek being viewed
     * @returns {Promise<Array>} Array of team names that are locked
     */
    async getLockedPicks(picks, currentGameweek) {
        if (!picks) return [];

        const lockedPicks = [];
        const now = new Date();
        
        // Get current edition
        const userEdition = window.editionService ? window.editionService.getCurrentUserEdition() : 1;

        // Check each pick against its deadline from the database
        for (const [gameweekKey, teamData] of Object.entries(picks)) {
            if (gameweekKey === 'gwtiebreak') continue;

            let gameweekNum;
            if (gameweekKey.startsWith('gw')) {
                gameweekNum = parseInt(gameweekKey.replace('gw', ''));
            } else {
                gameweekNum = parseInt(gameweekKey);
            }

            // Extract team name from pick data (handles both old string format and new object format)
            const teamName = teamData && typeof teamData === 'object' ? teamData.team : teamData;
            if (!teamName) continue;

            // Check if this gameweek's deadline has passed by querying the database
            const isDeadlinePassed = await this.checkDeadlineForGameweek(gameweekNum.toString(), userEdition);
            
            if (isDeadlinePassed) {
                lockedPicks.push(teamName);
                console.log(`🔒 Locking ${teamName} from ${gameweekKey} (deadline passed)`);
            } else {
                // console.log(`✅ Not locking ${teamName} from ${gameweekKey} (deadline not passed yet)`);
            }
        }

        // console.log('🔍 Final locked picks:', lockedPicks);
        return lockedPicks;
    }

    /**
     * Check if deadline has passed for a specific gameweek and edition
     * @param {string} gameweek - Gameweek number
     * @param {number|string} edition - Edition number
     * @returns {Promise<boolean>} True if deadline has passed
     */
    async checkDeadlineForGameweek(gameweek, edition = null) {
        const db = this.getDb();
        if (!db) {
            console.error('🔧 EnhancedPickManager: No database reference available for deadline check');
            return false;
        }

        try {
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionKey = `edition${edition || 1}_${gameweekKey}`;
            
            // console.log(`🔍 EnhancedPickManager: Checking deadline for ${editionKey}`);
            
            const fixturesDoc = await db.collection('fixtures').doc(editionKey).get();
            if (!fixturesDoc.exists) {
                console.log(`🔍 EnhancedPickManager: No fixtures found for ${editionKey}`);
                return false;
            }

            const fixturesData = fixturesDoc.data();
            const fixtures = fixturesData.fixtures || [];
            
            if (fixtures.length === 0) {
                console.log(`🔍 EnhancedPickManager: No fixtures in document for ${editionKey}`);
                return false;
            }

            // Find the earliest fixture (deadline)
            const earliestFixture = fixtures.reduce((earliest, fixture) => {
                const fixtureDate = this.createFixtureDateTime(fixture);
                const earliestDate = this.createFixtureDateTime(earliest);
                return fixtureDate < earliestDate ? fixture : earliest;
            });

            if (!earliestFixture || !earliestFixture.date) {
                console.log(`🔍 EnhancedPickManager: No valid fixture date found for ${editionKey}`);
                return false;
            }

            const deadline = this.createFixtureDateTime(earliestFixture);
            const now = new Date();
            
            const isDeadlinePassed = deadline <= now;
            // console.log(`🔍 EnhancedPickManager: ${editionKey} deadline ${deadline.toISOString()}, now ${now.toISOString()}, passed: ${isDeadlinePassed}`);
            
            return isDeadlinePassed;
        } catch (error) {
            console.error('🔧 EnhancedPickManager: Error checking deadline for gameweek:', error);
            return false;
        }
    }

    /**
     * Get the gameweek where a team was picked
     * @param {string} teamName - Name of the team
     * @param {Object} picks - User's picks object
     * @returns {string} Gameweek where the team was picked
     */
    getGameweekWhereTeamPicked(teamName, picks) {
        if (!picks) return null;

        for (const [gameweekKey, team] of Object.entries(picks)) {
            if (team === teamName) {
                if (gameweekKey === 'gwtiebreak') {
                    return 'Tiebreak';
                }
                const gameweekNum = gameweekKey.replace('gw', '');
                return `Game Week ${gameweekNum}`;
            }
        }

        return null;
    }

    /**
     * Get gameweek status (not-started, in-progress, completed)
     * @param {Array} fixtures - Fixtures for the gameweek
     * @param {string} gameweek - Gameweek number
     * @returns {string} Gameweek status
     */
    getGameweekStatus(fixtures, gameweek) {
        if (!fixtures || fixtures.length === 0) return 'not-started';

        const now = new Date();

        // Find the earliest fixture (deadline)
        const earliestFixture = fixtures.reduce((earliest, fixture) => {
            const fixtureDate = this.createFixtureDateTime(fixture);
            const earliestDate = this.createFixtureDateTime(earliest);
            return fixtureDate < earliestDate ? fixture : earliest;
        });

        if (!earliestFixture) return 'not-started';

        const deadline = this.createFixtureDateTime(earliestFixture);

        if (deadline && deadline <= now) {
            const allCompleted = fixtures.every(fixture =>
                fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
            );
            return allCompleted ? 'completed' : 'in-progress';
        } else {
            return 'not-started';
        }
    }

    /**
     * Create a proper datetime object from fixture data
     * @param {Object} fixture - Fixture object
     * @returns {Date|null} - Date object or null if invalid
     */
    createFixtureDateTime(fixture) {
        if (!fixture.date) return null;

        let dateString = fixture.date;

        if (dateString.includes('T') || dateString.includes(':')) {
            return new Date(dateString);
        }

        if (fixture.kickOffTime && fixture.kickOffTime !== '00:00:00') {
            dateString = `${fixture.date}T${fixture.kickOffTime}`;
        } else {
            dateString = `${fixture.date}T15:00:00`;
        }

        return new Date(dateString);
    }

    /**
     * Handle team selection with enhanced logic
     * @param {string} teamName - Name of the team being selected
     * @param {string} gameweek - Gameweek being viewed
     * @param {string} userId - User ID
     */
    async handleTeamSelection(teamName, gameweek, userId) {
        const db = this.getDb();
        if (!db) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }

        try {
            // Get current user data
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                alert('User data not found. Please refresh the page.');
                return;
            }
            const userData = userDoc.data();

            // Get fixtures for the current gameweek
            const userEdition = window.editionService ? window.editionService.getCurrentUserEdition() : 1;
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${userEdition}_${gameweekKey}`;
            
            const fixturesDoc = await db.collection('fixtures').doc(editionGameweekKey).get();
            const fixtures = fixturesDoc.exists ? fixturesDoc.data().fixtures || [] : [];

            const teamStatus = await this.getTeamStatus(teamName, gameweek, userData, fixtures);
            const currentGameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;

            console.log('🔧 EnhancedPickManager: Team selection:', {
                teamName,
                gameweek,
                teamStatus,
                action: teamStatus.action
            });

            switch (teamStatus.action) {
                case 'pick':
                    await this.makeNewPick(teamName, gameweek, userId);
                    break;

                case 'change':
                    await this.changeCurrentPick(teamName, gameweek, userId, userData.picks[currentGameweekKey]);
                    break;

                case 'release-and-pick':
                    await this.releaseAndPick(teamName, gameweek, userId, teamStatus.savedGameweek);
                    break;

                case 'locked':
                    alert('This pick cannot be changed - the gameweek deadline has passed.');
                    break;

                case 'unavailable':
                    alert('Picks are not available for this gameweek - it has already started.');
                    break;

                default:
                    console.error('Unknown team action:', teamStatus.action);
            }
        } catch (error) {
            console.error('Error handling team selection:', error);
            alert('Error processing pick. Please try again.');
        }
    }

    /**
     * Make a new pick for a gameweek
     * @param {string} teamName - Team to pick
     * @param {string} gameweek - Gameweek to pick for
     * @param {string} userId - User ID
     */
    async makeNewPick(teamName, gameweek, userId) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const db = this.getDb();
        
        if (!db) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }
        
        if (confirm(`Would you like to pick ${teamName} for ${gameweek === 'tiebreak' ? 'Tiebreak' : `Game Week ${gameweek}`}?`)) {
            try {
                await db.collection('users').doc(userId).update({
                    [`picks.${gameweekKey}`]: teamName
                });

                console.log(`✅ Pick saved: ${teamName} for ${gameweekKey}`);
                await this.refreshDisplayAfterPickUpdate(gameweek, userId);
            } catch (error) {
                console.error('Error making pick:', error);
                alert('Error saving pick. Please try again.');
            }
        }
    }

    /**
     * Change the current pick for a gameweek
     * @param {string} newTeam - New team to pick
     * @param {string} gameweek - Gameweek to change pick for
     * @param {string} userId - User ID
     * @param {string} currentTeam - Current team picked
     */
    async changeCurrentPick(newTeam, gameweek, userId, currentTeam) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const db = this.getDb();
        
        if (!db) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }
        
        if (confirm(`You currently have ${currentTeam} selected for ${gameweek === 'tiebreak' ? 'Tiebreak' : `Game Week ${gameweek}`}. Would you like to change your pick to ${newTeam}?`)) {
            try {
                await db.collection('users').doc(userId).update({
                    [`picks.${gameweekKey}`]: newTeam
                });

                console.log(`✅ Pick changed from ${currentTeam} to ${newTeam} for ${gameweekKey}`);
                await this.refreshDisplayAfterPickUpdate(gameweek, userId);
            } catch (error) {
                console.error('Error changing pick:', error);
                alert('Error changing pick. Please try again.');
            }
        }
    }

    /**
     * Release a saved pick and make a new pick
     * @param {string} teamName - Team to release and pick
     * @param {string} newGameweek - New gameweek to pick for
     * @param {string} userId - User ID
     * @param {string} savedGameweek - Gameweek where team was originally saved
     */
    async releaseAndPick(teamName, newGameweek, userId, savedGameweek) {
        const newGameweekKey = newGameweek === 'tiebreak' ? 'gwtiebreak' : `gw${newGameweek}`;
        const db = this.getDb();
        
        if (!db) {
            alert('Database connection not available. Please refresh the page.');
            return;
        }
        
        // Get current user data to find the original gameweek key
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.error('User not found');
            return;
        }
        
        const userData = userDoc.data();
        let originalGameweekKey = null;
        
        // Find the original gameweek key where this team was picked
        for (const [key, value] of Object.entries(userData.picks || {})) {
            if (value === teamName) {
                originalGameweekKey = key;
                break;
            }
        }

        if (!originalGameweekKey) {
            console.error('Could not find original gameweek key for team:', teamName);
            return;
        }

        if (confirm(`You have picked ${teamName} for ${savedGameweek}. Would you like to release this pick and select ${teamName} for ${newGameweek === 'tiebreak' ? 'Tiebreak' : `Game Week ${newGameweek}`}?`)) {
            try {
                await db.collection('users').doc(userId).update({
                    [`picks.${originalGameweekKey}`]: db.FieldValue.delete(),
                    [`picks.${newGameweekKey}`]: teamName
                });

                console.log(`✅ Pick released from ${originalGameweekKey} and saved to ${newGameweekKey}: ${teamName}`);
                await this.refreshDisplayAfterPickUpdate(newGameweek, userId);
            } catch (error) {
                console.error('Error releasing and picking:', error);
                alert('Error processing pick change. Please try again.');
            }
        }
    }

    /**
     * Refresh the display after a pick update
     * @param {string} gameweek - Current gameweek being viewed
     * @param {string} userId - User ID
     */
    async refreshDisplayAfterPickUpdate(gameweek, userId) {
        try {
            const db = this.getDb();
            if (!db) {
                console.error('Database connection not available for refresh');
                return;
            }
            
            const updatedUserDoc = await db.collection('users').doc(userId).get();
            if (updatedUserDoc.exists) {
                const updatedUserData = updatedUserDoc.data();

                // Refresh both desktop and mobile displays
                if (window.loadFixturesForDeadline) {
                    window.loadFixturesForDeadline(gameweek, updatedUserData, userId);
                }

                if (window.loadMobileFixturesForDeadline) {
                    window.loadMobileFixturesForDeadline(gameweek, updatedUserData, userId);
                }

                console.log('✅ Display refreshed after pick update');
            }
        } catch (error) {
            console.error('Error refreshing display:', error);
        }
    }
}

// Export the EnhancedPickManager class
export default EnhancedPickManager;
