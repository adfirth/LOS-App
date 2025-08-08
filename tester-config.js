// Tester Configuration
// This file contains settings for the admin-promoted tester system

const TESTER_CONFIG = {
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
        showTesterStatus: true
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TESTER_CONFIG,
        isUserTester,
        getTesterFeatures,
        getRegularUserRestrictions,
        getAdminSettings
    };
}
