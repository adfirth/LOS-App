// TheSportsDB Configuration
// 
// TheSportsDB is a free sports API that provides football data
// No API key required - completely free to use
// Documentation: https://www.thesportsdb.com/documentation

const THESPORTSDB_CONFIG = {
    BASE_URL: 'https://www.thesportsdb.com/api/v1/json/3',
    // No API key required - completely free
    // Version 3 of the API is the current stable version
};

// League IDs for TheSportsDB
const THESPORTSDB_LEAGUE_IDS = {
    PREMIER_LEAGUE: 4328,
    CHAMPIONSHIP: 4329,
    LEAGUE_ONE: 4396,
    LEAGUE_TWO: 4397,
    NATIONAL_LEAGUE: 4590
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { THESPORTSDB_CONFIG, THESPORTSDB_LEAGUE_IDS };
} 