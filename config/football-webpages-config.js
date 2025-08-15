// Football Web Pages API Configuration
// 
// Football Web Pages API via RapidAPI
// Documentation: https://rapidapi.com/football-web-pages1-football-web-pages-default/api/football-web-pages1
// Requires RapidAPI subscription and API key

// Helper function to get environment variable safely
function getEnvVar(key, fallback) {
    // Check if we're in a Node.js environment (Netlify functions)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || fallback;
    }
    
    // For browser environment, check multiple possible sources
    if (typeof window !== 'undefined') {
        // Check if the environment variable is available in window object
        if (window[key]) {
            return window[key];
        }
        
        // Check if there's a global environment variables object
        if (window.ENV && window.ENV[key]) {
            return window.ENV[key];
        }
        
        // Check if there's a config object with the key
        if (window.CONFIG && window.CONFIG[key]) {
            return window.CONFIG[key];
        }
    }
    
    return fallback;
}

// For development/testing, you can set the API key directly here
// Remove this in production and use environment variables
const DEV_API_KEY = '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef';

const FOOTBALL_WEBPAGES_CONFIG = {
    BASE_URL: 'https://football-web-pages1.p.rapidapi.com',
    // API key should be stored in environment variables
    // Get it from: https://rapidapi.com/football-web-pages1-football-web-pages-default/api/football-web-pages1
    RAPIDAPI_KEY: getEnvVar('VITE_RAPIDAPI_KEY', DEV_API_KEY), // Use environment variable or fallback to dev key
    RAPIDAPI_HOST: 'football-web-pages1.p.rapidapi.com'
};

// League IDs for Football Web Pages API
// These are the competition IDs used by the API
const FOOTBALL_WEBPAGES_LEAGUE_IDS = {
    PREMIER_LEAGUE: 1,
    CHAMPIONSHIP: 2,
    LEAGUE_ONE: 3,
    LEAGUE_TWO: 4,
    NATIONAL_LEAGUE: 5, // This is the main National League
    NATIONAL_LEAGUE_NORTH: 6, // National League North
    NATIONAL_LEAGUE_SOUTH: 7  // National League South
};

// Season IDs - these may need to be updated each season
const FOOTBALL_WEBPAGES_SEASON_IDS = {
    '2025-2026': '2025-26',
    '2024-2025': '2024-25',
    '2023-2024': '2023-24'
};

// Ensure the config is available in the browser global scope
if (typeof window !== 'undefined') {
    window.FOOTBALL_WEBPAGES_CONFIG = FOOTBALL_WEBPAGES_CONFIG;
    window.FOOTBALL_WEBPAGES_LEAGUE_IDS = FOOTBALL_WEBPAGES_LEAGUE_IDS;
    window.FOOTBALL_WEBPAGES_SEASON_IDS = FOOTBALL_WEBPAGES_SEASON_IDS;
    console.log('✅ Football Web Pages API configuration exposed to window object');
    console.log('🔑 API Key status:', FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_KEY === 'YOUR_API_KEY_HERE' ? '⚠️ Using fallback - set VITE_RAPIDAPI_KEY' : '✅ API key configured');
    console.log('🔑 API Key value:', FOOTBALL_WEBPAGES_CONFIG.RAPIDAPI_KEY.substring(0, 10) + '...');
}

// Also expose as global variables for modules that expect them
if (typeof window !== 'undefined') {
    // Make them available as global variables (not just window properties)
    window.FOOTBALL_WEBPAGES_CONFIG = FOOTBALL_WEBPAGES_CONFIG;
    window.FOOTBALL_WEBPAGES_LEAGUE_IDS = FOOTBALL_WEBPAGES_LEAGUE_IDS;
    window.FOOTBALL_WEBPAGES_SEASON_IDS = FOOTBALL_WEBPAGES_SEASON_IDS;
    
    // Also try to make them available as global variables (for older module access patterns)
    try {
        // This is a fallback for modules that might try to access them directly
        if (typeof FOOTBALL_WEBPAGES_CONFIG === 'undefined') {
            // Note: This won't work in strict mode, but it's worth trying
            console.log('⚠️ Attempting to expose config as global variable (may not work in strict mode)');
        }
    } catch (e) {
        console.log('ℹ️ Config available via window.FOOTBALL_WEBPAGES_CONFIG');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        FOOTBALL_WEBPAGES_CONFIG, 
        FOOTBALL_WEBPAGES_LEAGUE_IDS,
        FOOTBALL_WEBPAGES_SEASON_IDS
    };
} 