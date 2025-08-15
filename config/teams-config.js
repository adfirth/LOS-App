// 2025/26 National League Teams Configuration
// Teams and their badges from TheSportsDB

const TEAMS_CONFIG = {
    // Team names for dropdowns and display
    allTeams: [
        "Aldershot Town", "Altrincham", "Boreham Wood", "Boston United", "Brackley Town", "Braintree Town",
        "Carlisle United", "Eastleigh", "Forest Green Rovers", "Gateshead", "FC Halifax Town", "Hartlepool United",
        "Morecambe", "Rochdale", "Scunthorpe United", "Solihull Moors", "Southend United", "Sutton United",
        "Tamworth", "Truro City", "Wealdstone", "Woking", "Yeovil Town", "York City"
    ],
    
    // Team badges from TheSportsDB (actual working URLs from the league page)
    teamBadges: {
        "Aldershot Town": "https://r2.thesportsdb.com/images/media/team/badge/0ai9i31694237091.png",
        "Altrincham": "https://r2.thesportsdb.com/images/media/team/badge/j103791655904826.png",
        "Boreham Wood": "https://r2.thesportsdb.com/images/media/team/badge/8h5d4s1512067942.png",
        "Boston United": "https://r2.thesportsdb.com/images/media/team/badge/gqjn141578137225.png",
        "Brackley Town": "https://r2.thesportsdb.com/images/media/team/badge/qb7aha1512068030.png",
        "Braintree Town": "https://r2.thesportsdb.com/images/media/team/badge/08f7ss1512142657.png",
        "Carlisle United": "https://r2.thesportsdb.com/images/media/team/badge/wqqpuy1423804947.png",
        "Eastleigh": "https://r2.thesportsdb.com/images/media/team/badge/kibn8h1675955584.png",
        "Forest Green Rovers": "https://r2.thesportsdb.com/images/media/team/badge/jbgjqk1505824045.png",
        "Gateshead": "https://r2.thesportsdb.com/images/media/team/badge/maxonw1486738829.png",
        "FC Halifax Town": "https://r2.thesportsdb.com/images/media/team/badge/s11p8q1689067978.png",
        "Hartlepool United": "https://r2.thesportsdb.com/images/media/team/badge/eh9d4l1689067886.png",
        "Morecambe": "https://r2.thesportsdb.com/images/media/team/badge/qaerfb1624973578.png",
        "Rochdale": "https://r2.thesportsdb.com/images/media/team/badge/uqwwxr1424032561.png",
        "Scunthorpe United": "https://r2.thesportsdb.com/images/media/team/badge/ljf0ce1685771026.png",
        "Solihull Moors": "https://r2.thesportsdb.com/images/media/team/badge/kywmkn1677523511.png",
        "Southend United": "https://r2.thesportsdb.com/images/media/team/badge/oafwr01601809319.png",
        "Sutton United": "https://r2.thesportsdb.com/images/media/team/badge/3xxw321514563737.png/medium",
        "Tamworth": "https://r2.thesportsdb.com/images/media/team/badge/7j70n31603398291.png",
        "Truro City": "https://r2.thesportsdb.com/images/media/team/badge/5ucbxf1718211366.png/medium",
        "Wealdstone": "https://r2.thesportsdb.com/images/media/team/badge/hqy3vu1510314795.png/medium",
        "Woking": "https://r2.thesportsdb.com/images/media/team/badge/xlx9rl1635868737.png",
        "Yeovil Town": "https://r2.thesportsdb.com/images/media/team/badge/gtnmbz1716916577.png",
        "York City": "https://r2.thesportsdb.com/images/media/team/badge/qv0j5n1684734883.png"
    },
    
    // Team IDs from TheSportsDB (for API calls)
    teamIds: {
        "Aldershot Town": "134401",
        "Altrincham": "135959",
        "Boreham Wood": "135968",
        "Boston United": "137701",
        "Brackley Town": "135966",
        "Braintree Town": "135967",
        "Carlisle United": "134360",
        "Eastleigh": "135963",
        "Forest Green Rovers": "135901",
        "Gateshead": "134765",
        "FC Halifax Town": "134486",
        "Hartlepool United": "134372",
        "Morecambe": "134369",
        "Rochdale": "134364",
        "Scunthorpe United": "133810",
        "Solihull Moors": "136002",
        "Southend United": "134209",
        "Sutton United": "136003",
        "Tamworth": "140380",
        "Truro City": "136150",
        "Wealdstone": "135975",
        "Woking": "135999",
        "Yeovil Town": "134300",
        "York City": "134383"
    }
};

// Helper function to get team badge URL
function getTeamBadge(teamName) {
    return TEAMS_CONFIG.teamBadges[teamName] || null;
}

// Helper function to get team ID
function getTeamId(teamName) {
    return TEAMS_CONFIG.teamIds[teamName] || null;
}

// Helper function to create team option with badge
function createTeamOption(teamName, selected = false) {
    const badge = getTeamBadge(teamName);
    const badgeHtml = badge ? `<img src="${badge}" alt="${teamName}" class="team-badge" style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle;">` : '';
    
    return `<option value="${teamName}" ${selected ? 'selected' : ''}>
        ${badgeHtml}${teamName}
    </option>`;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TEAMS_CONFIG, getTeamBadge, getTeamId, createTeamOption };
} 