// Football Web Pages API Configuration
// 
// Football Web Pages API via RapidAPI
// Documentation: https://rapidapi.com/football-web-pages1-football-web-pages-default/api/football-web-pages1
// Requires RapidAPI subscription and API key

const FOOTBALL_WEBPAGES_CONFIG = {
    BASE_URL: 'https://football-web-pages1.p.rapidapi.com',
    // API key from environment variable for security
    // Get it from: https://rapidapi.com/football-web-pages1-football-web-pages-default/api/football-web-pages1
    RAPIDAPI_KEY: import.meta.env.VITE_RAPIDAPI_KEY || '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef', // Fallback for development
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
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        FOOTBALL_WEBPAGES_CONFIG, 
        FOOTBALL_WEBPAGES_LEAGUE_IDS,
        FOOTBALL_WEBPAGES_SEASON_IDS
    };
} 