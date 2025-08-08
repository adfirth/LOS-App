// Tester Configuration
// This file contains settings for the admin-promoted tester system

const TESTER_CONFIG = {
    // Tester edition settings
    testerEdition: {
        enabled: true,
        editionNumber: 'tester', // Special edition for testers
        name: 'Tester Edition',
        description: 'Special edition for testing features and functionality'
    },
    
    // Regular edition for non-testers
    regularEdition: {
        editionNumber: 1,
        name: 'Edition 1',
        description: 'Main competition edition'
    },
    
    // Tester-specific game weeks and fixtures
    testerGameWeeks: {
        enabled: true,
        gameWeeks: [
            {
                number: '1',
                name: 'Test Week 1',
                description: 'First test game week for trial fixtures',
                fixtures: [] // Will be populated from database
            },
            {
                number: '2', 
                name: 'Test Week 2',
                description: 'Second test game week for trial fixtures',
                fixtures: [] // Will be populated from database
            }
        ]
    },
    
    // Trial game weeks that testers can access
    trialGameWeeks: ['1', '2'],
    
    // Features that testers have access to
    testerFeatures: {
        scores: true,
        vidiprinter: true,
        liveUpdates: true
    },
    
    // Regular user restrictions
    regularUserRestrictions: {
        scores: false,
        vidiprinter: false,
        liveUpdates: false
    },
    
    // Admin panel settings
    adminSettings: {
        showTesterToggle: true,
        showTesterStatus: true,
        showEditionInfo: true,
        showTesterFixtures: true
    }
};

// Function to check if a user is a tester (now handled via database)
async function isUserTester(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData.isTester === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking tester status:', error);
        return false;
    }
}

// Function to get the appropriate edition for a user
async function getUserEdition(userId) {
    try {
        const isTester = await isUserTester(userId);
        
        if (isTester && TESTER_CONFIG.testerEdition.enabled) {
            return {
                editionNumber: TESTER_CONFIG.testerEdition.editionNumber,
                name: TESTER_CONFIG.testerEdition.name,
                description: TESTER_CONFIG.testerEdition.description,
                isTesterEdition: true
            };
        } else {
            return {
                editionNumber: TESTER_CONFIG.regularEdition.editionNumber,
                name: TESTER_CONFIG.regularEdition.name,
                description: TESTER_CONFIG.regularEdition.description,
                isTesterEdition: false
            };
        }
    } catch (error) {
        console.error('Error getting user edition:', error);
        // Default to regular edition on error
        return {
            editionNumber: TESTER_CONFIG.regularEdition.editionNumber,
            name: TESTER_CONFIG.regularEdition.name,
            description: TESTER_CONFIG.regularEdition.description,
            isTesterEdition: false
        };
    }
}

// Function to get tester-specific fixtures for a gameweek
async function getTesterFixtures(gameweek) {
    try {
        if (!TESTER_CONFIG.testerGameWeeks.enabled) {
            return null; // Use regular fixtures if tester fixtures disabled
        }
        
        // Get fixtures from tester edition database
        const fixturesDoc = await db.collection('fixtures').doc(`tester_edition_gw${gameweek}`).get();
        if (fixturesDoc.exists) {
            return fixturesDoc.data().fixtures || [];
        }
        
        return []; // Return empty array if no fixtures found
    } catch (error) {
        console.error('Error getting tester fixtures:', error);
        return null; // Fall back to regular fixtures
    }
}

// Function to get the appropriate fixtures for a user and gameweek
async function getUserFixtures(userId, gameweek) {
    try {
        const isTester = await isUserTester(userId);
        
        if (isTester && TESTER_CONFIG.testerGameWeeks.enabled) {
            // Get tester-specific fixtures
            const testerFixtures = await getTesterFixtures(gameweek);
            if (testerFixtures && testerFixtures.length > 0) {
                return {
                    fixtures: testerFixtures,
                    isTesterFixtures: true,
                    gameweekName: `Test Week ${gameweek}`,
                    edition: 'tester'
                };
            }
        }
        
        // Fall back to regular fixtures
        const regularFixturesDoc = await db.collection('fixtures').doc(`edition1_gw${gameweek}`).get();
        if (regularFixturesDoc.exists) {
            return {
                fixtures: regularFixturesDoc.data().fixtures || [],
                isTesterFixtures: false,
                gameweekName: `Game Week ${gameweek}`,
                edition: 1
            };
        }
        
        return {
            fixtures: [],
            isTesterFixtures: false,
            gameweekName: `Game Week ${gameweek}`,
            edition: 1
        };
    } catch (error) {
        console.error('Error getting user fixtures:', error);
        return {
            fixtures: [],
            isTesterFixtures: false,
            gameweekName: `Game Week ${gameweek}`,
            edition: 1
        };
    }
}

// Function to get tester features
function getTesterFeatures() {
    return TESTER_CONFIG.testerFeatures;
}

// Function to get regular user restrictions
function getRegularUserRestrictions() {
    return TESTER_CONFIG.regularUserRestrictions;
}

// Function to get admin settings
function getAdminSettings() {
    return TESTER_CONFIG.adminSettings;
}

// Function to get tester edition config
function getTesterEditionConfig() {
    return TESTER_CONFIG.testerEdition;
}

// Function to get regular edition config
function getRegularEditionConfig() {
    return TESTER_CONFIG.regularEdition;
}

// Function to get tester game weeks config
function getTesterGameWeeksConfig() {
    return TESTER_CONFIG.testerGameWeeks;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TESTER_CONFIG,
        isUserTester,
        getUserEdition,
        getUserFixtures,
        getTesterFixtures,
        getTesterFeatures,
        getRegularUserRestrictions,
        getAdminSettings,
        getTesterEditionConfig,
        getRegularEditionConfig,
        getTesterGameWeeksConfig
    };
}
