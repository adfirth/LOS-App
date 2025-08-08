// Tester Configuration
// This file contains the list of tester email addresses and related settings

const TESTER_CONFIG = {
    // List of tester email addresses (case-insensitive)
    testerEmails: [
        'tester1@example.com',
        'tester2@example.com',
        'tester3@example.com',
        // Add more tester emails as needed
        // You can also add specific domains for easier management
        // '@yourdomain.com' // This would allow all emails from yourdomain.com
    ],
    
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
    }
};

// Function to check if an email is a tester email
function isTesterEmail(email) {
    if (!email) return false;
    
    const emailLower = email.toLowerCase();
    
    // Check exact email matches
    if (TESTER_CONFIG.testerEmails.includes(emailLower)) {
        return true;
    }
    
    // Check domain matches (for wildcard domains)
    for (const testerEmail of TESTER_CONFIG.testerEmails) {
        if (testerEmail.startsWith('@') && emailLower.endsWith(testerEmail)) {
            return true;
        }
    }
    
    return false;
}

// Function to get tester features
function getTesterFeatures() {
    return TESTER_CONFIG.testerFeatures;
}

// Function to get regular user restrictions
function getRegularUserRestrictions() {
    return TESTER_CONFIG.regularUserRestrictions;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TESTER_CONFIG,
        isTesterEmail,
        getTesterFeatures,
        getRegularUserRestrictions
    };
}
