/**
 * Enhanced Pick Manager - Handles saved picks and locked picks functionality
 * Manages the complex logic for pick availability, saved picks, and locked picks
 */
class EnhancedPickManager {
    constructor() {
        this.db = window.db;
        console.log('🔧 EnhancedPickManager: Initialized');
    }

    /**
     * Get the status of a team for a specific gameweek
     * @param {string} teamName - Name of the team
     * @param {string} gameweek - Current gameweek being viewed
     * @param {Object} userData - User data including picks
     * @param {Array} fixtures - Fixtures for the current gameweek
     * @returns {Object} Team status object
     */
    getTeamStatus(teamName, gameweek, userData, fixtures) {
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
        const currentPick = userData.picks[gameweekKey] || null;
        const gameweekStatus = this.getGameweekStatus(fixtures, gameweek);
        const lockedPicks = this.getLockedPicks(userData.picks, gameweek);
        const savedPicks = this.getSavedPicks(userData.picks, gameweek);

        // Check if this is the current pick for this gameweek
        if (currentPick === teamName) {
            const canChange = gameweekStatus === 'not-started';
            return {
                status: 'current-pick',
                clickable: canChange,
                tooltip: canChange ? 'Current pick - click to change' : 'Current pick for this gameweek (locked)',
                classes: `team-pick-button current-pick ${canChange ? 'changeable' : 'locked'}`,
                action: canChange ? 'change' : 'locked'
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
            return {
                status: 'saved-pick',
                clickable: true,
                tooltip: `Picked for ${savedGameweek} - click to release and pick for ${gameweek}`,
                classes: 'team-pick-button saved-pick',
                action: 'release-and-pick',
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
     * Get saved picks (picks made for future gameweeks)
     * @param {Object} picks - User's picks object
     * @param {string} currentGameweek - Current gameweek being viewed
     * @returns {Array} Array of team names that are saved for future gameweeks
     */
    getSavedPicks(picks, currentGameweek) {
        if (!picks) return [];

        const savedPicks = [];
        const currentGameweekNum = parseInt(currentGameweek);

        Object.entries(picks).forEach(([gameweekKey, team]) => {
            if (gameweekKey === 'gwtiebreak') return;

            let gameweekNum;
            if (gameweekKey.startsWith('gw')) {
                gameweekNum = parseInt(gameweekKey.replace('gw', ''));
            } else {
                gameweekNum = parseInt(gameweekKey);
            }

            // If this pick is for a future gameweek, it's a saved pick
            if (gameweekNum > currentGameweekNum) {
                savedPicks.push(team);
            }
        });

        return savedPicks;
    }

    /**
     * Get locked picks (picks that can't be changed due to deadlines)
     * @param {Object} picks - User's picks object
     * @param {string} currentGameweek - Current gameweek being viewed
     * @returns {Array} Array of team names that are locked
     */
    getLockedPicks(picks, currentGameweek) {
        if (!picks) return [];

        const lockedPicks = [];
        const now = new Date();

        Object.entries(picks).forEach(([gameweekKey, team]) => {
            if (gameweekKey === 'gwtiebreak') return;

            let gameweekNum;
            if (gameweekKey.startsWith('gw')) {
                gameweekNum = parseInt(gameweekKey.replace('gw', ''));
            } else {
                gameweekNum = parseInt(gameweekKey);
            }

            // Check if this gameweek's deadline has passed
            let shouldLock = false;

            if (gameweekKey === 'gw1') {
                const gw1Deadline = new Date('2025-08-09T15:00:00');
                shouldLock = now >= gw1Deadline;
            } else if (gameweekKey === 'gw2') {
                const gw2Deadline = new Date('2025-08-16T12:30:00');
                shouldLock = now >= gw2Deadline;
            } else if (gameweekKey === 'gw3') {
                const gw3Deadline = new Date('2025-08-19T19:45:00');
                shouldLock = now >= gw3Deadline;
            } else if (gameweekNum && gameweekNum < parseInt(currentGameweek)) {
                // For other gameweeks, use numeric comparison as fallback
                shouldLock = true;
            }

            if (shouldLock) {
                lockedPicks.push(team);
            }
        });

        return lockedPicks;
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

        // Special handling for Test Weeks
        if (gameweek === '3') {
            const gw3Deadline = new Date('2025-08-19T19:45:00');
            if (now >= gw3Deadline) {
                const allCompleted = fixtures.every(fixture =>
                    fixture.status && (fixture.status === 'FT' || fixture.status === 'AET' || fixture.status === 'PEN')
                );
                return allCompleted ? 'completed' : 'in-progress';
            } else {
                return 'not-started';
            }
        }

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
     * @param {Object} userData - User data
     * @param {Array} fixtures - Fixtures for the current gameweek
     */
    async handleTeamSelection(teamName, gameweek, userId, userData, fixtures) {
        const teamStatus = this.getTeamStatus(teamName, gameweek, userData, fixtures);
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;

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
                await this.changeCurrentPick(teamName, gameweek, userId, userData.picks[gameweekKey]);
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
    }

    /**
     * Make a new pick for a gameweek
     * @param {string} teamName - Team to pick
     * @param {string} gameweek - Gameweek to pick for
     * @param {string} userId - User ID
     */
    async makeNewPick(teamName, gameweek, userId) {
        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        
        if (confirm(`Would you like to pick ${teamName} for ${gameweek === 'tiebreak' ? 'Tiebreak' : `Game Week ${gameweek}`}?`)) {
            try {
                await this.db.collection('users').doc(userId).update({
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
        
        if (confirm(`You currently have ${currentTeam} selected for ${gameweek === 'tiebreak' ? 'Tiebreak' : `Game Week ${gameweek}`}. Would you like to change your pick to ${newTeam}?`)) {
            try {
                await this.db.collection('users').doc(userId).update({
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
        
        // Get current user data to find the original gameweek key
        const userDoc = await this.db.collection('users').doc(userId).get();
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
                await this.db.collection('users').doc(userId).update({
                    [`picks.${originalGameweekKey}`]: this.db.FieldValue.delete(),
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
            const updatedUserDoc = await this.db.collection('users').doc(userId).get();
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
