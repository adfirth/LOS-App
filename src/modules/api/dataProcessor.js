// Data Processor Module
// Handles data processing, transformation, and utility functions for API data

export class DataProcessor {
    constructor() {
        // Initialize any data processing utilities
    }

    // Convert API fixture format to database format
    convertApiFixtureToDatabase(fixture) {
        return {
            homeTeam: fixture['home-team']?.name || fixture.homeTeam || 'TBD',
            awayTeam: fixture['away-team']?.name || fixture.awayTeam || 'TBD',
            date: fixture.date || fixture.match?.date || 'TBD',
            kickOffTime: fixture.time || 'TBD',
            venue: fixture.venue || 'TBD',
            status: 'NS', // Not Started
            matchId: fixture.id || fixture.match?.id || null,
            competition: fixture.competition?.name || 'National League'
        };
    }

    // Extract scores from API fixture with multiple fallback methods
    extractScores(fixture) {
        let homeScore = null;
        let awayScore = null;
        let homeScoreHT = null;
        let awayScoreHT = null;

        // Method 1: Direct score properties from home-team/away-team objects
        if (fixture['home-team'] && fixture['away-team']) {
            homeScore = fixture['home-team'].score ?? fixture['home-team'].goals ?? fixture['home-team'].result;
            awayScore = fixture['away-team'].score ?? fixture['away-team'].goals ?? fixture['away-team'].result;
        }

        // Method 2: Alternative score properties
        if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
            homeScore = fixture.homeScore ?? fixture.homeGoals ?? fixture.score1 ?? fixture.home_result;
            awayScore = fixture.awayScore ?? fixture.awayGoals ?? fixture.score2 ?? fixture.away_result;
        }

        // Method 3: Split score strings (most common format)
        if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
            // Try full-time score first
            if (fixture.ft_score && fixture.ft_score.includes('-')) {
                const ftParts = fixture.ft_score.split('-');
                homeScore = parseInt(ftParts[0].trim());
                awayScore = parseInt(ftParts[1].trim());
            }

            // Try general score field
            if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && fixture.score && fixture.score.includes('-')) {
                const scoreParts = fixture.score.split('-');
                homeScore = parseInt(scoreParts[0].trim());
                awayScore = parseInt(scoreParts[1].trim());
            }

            // Try result field
            if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && fixture.result && fixture.result.includes('-')) {
                const resultParts = fixture.result.split('-');
                homeScore = parseInt(resultParts[0].trim());
                awayScore = parseInt(resultParts[1].trim());
            }
        }

        // Method 4: Check for individual goal properties
        if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
            homeScore = fixture.homeGoals ?? fixture.goals1 ?? fixture.home_goals;
            awayScore = fixture.awayGoals ?? fixture.goals2 ?? fixture.away_goals;
        }

        // Method 5: Check for any numeric score-like properties
        if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
            // Look for any property that might contain scores
            const possibleScoreProps = ['score', 'result', 'goals', 'ft_score', 'ht_score', 'final_score'];
            for (const prop of possibleScoreProps) {
                if (fixture[prop] && typeof fixture[prop] === 'string' && fixture[prop].includes('-')) {
                    const parts = fixture[prop].split('-');
                    if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                        homeScore = parseInt(parts[0].trim());
                        awayScore = parseInt(parts[1].trim());
                        break;
                    }
                }
            }
        }

        // Extract half-time scores
        // Method 1: Check home-team and away-team objects for half-time-score
        if (fixture['home-team'] && fixture['away-team']) {
            homeScoreHT = fixture['home-team']['half-time-score'] ?? fixture['home-team']['ht_score'] ?? fixture['home-team']['half_time_score'];
            awayScoreHT = fixture['away-team']['half-time-score'] ?? fixture['away-team']['ht_score'] ?? fixture['away-team']['half_time_score'];
        }

        // Method 2: Check top-level properties
        if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
            if (fixture.ht_score && fixture.ht_score.includes('-')) {
                const htParts = fixture.ht_score.split('-');
                homeScoreHT = parseInt(htParts[0].trim());
                awayScoreHT = parseInt(htParts[1].trim());
            } else if (fixture.half_time_score && fixture.half_time_score.includes('-')) {
                const htParts = fixture.half_time_score.split('-');
                homeScoreHT = parseInt(htParts[0].trim());
                awayScoreHT = parseInt(htParts[1].trim());
            } else if (fixture.ht_result && fixture.ht_result.includes('-')) {
                const htParts = fixture.ht_result.split('-');
                homeScoreHT = parseInt(htParts[0].trim());
                awayScoreHT = parseInt(htParts[1].trim());
            }
        }

        // Method 3: Check for halfTimeScore properties (from netlify function)
        if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
            if (fixture.halfTimeScore && fixture.halfTimeScore.includes('-')) {
                const htParts = fixture.halfTimeScore.split('-');
                homeScoreHT = parseInt(htParts[0].trim());
                awayScoreHT = parseInt(htParts[1].trim());
            }
        }

        // Method 4: Check for halfTime properties (from netlify function)
        if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
            if (fixture.halfTime && fixture.halfTime.includes('-')) {
                const htParts = fixture.halfTime.split('-');
                homeScoreHT = parseInt(htParts[0].trim());
                awayScoreHT = parseInt(htParts[1].trim());
            }
        }

        // Method 5: Check for ht properties (from netlify function)
        if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
            if (fixture.ht && fixture.ht.includes('-')) {
                const htParts = fixture.ht.split('-');
                homeScoreHT = parseInt(htParts[0].trim());
                awayScoreHT = parseInt(htParts[1].trim());
            }
        }

        // Method 6: Check for any property containing 'half' or 'ht' that might have scores
        if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
            const possibleHTProps = ['halfTimeScore', 'halfTime', 'ht', 'ht_score', 'half_time_score', 'ht_result', 'halfTimeResult'];
            for (const prop of possibleHTProps) {
                if (fixture[prop] && typeof fixture[prop] === 'string' && fixture[prop].includes('-')) {
                    const parts = fixture[prop].split('-');
                    if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                        homeScoreHT = parseInt(parts[0].trim());
                        awayScoreHT = parseInt(parts[1].trim());
                        break;
                    }
                }
            }
        }

        // Convert to numbers and handle invalid values
        homeScore = homeScore !== null && homeScore !== undefined && homeScore !== '' ? parseInt(homeScore) : null;
        awayScore = awayScore !== null && awayScore !== undefined && awayScore !== '' ? parseInt(awayScore) : null;
        homeScoreHT = homeScoreHT !== null && homeScoreHT !== undefined && homeScoreHT !== '' ? parseInt(homeScoreHT) : null;
        awayScoreHT = awayScoreHT !== null && awayScoreHT !== undefined && awayScoreHT !== '' ? parseInt(awayScoreHT) : null;

        return {
            homeScore,
            awayScore,
            homeScoreHT,
            awayScoreHT
        };
    }

    // Extract team names from API fixture with multiple fallback methods
    extractTeamNames(fixture) {
        const homeTeam = fixture['home-team']?.name || 
                        fixture.homeTeam || 
                        fixture.home || 
                        fixture.homeTeamName || 
                        fixture.home_team || 
                        fixture.home_team_name || 
                        fixture.team1 || 
                        fixture.team1Name || 
                        'TBD';

        const awayTeam = fixture['away-team']?.name || 
                        fixture.awayTeam || 
                        fixture.away || 
                        fixture.awayTeamName || 
                        fixture.away_team || 
                        fixture.away_team_name || 
                        fixture.team2 || 
                        fixture.team2Name || 
                        'TBD';

        return { homeTeam, awayTeam };
    }

    // Extract match information from API fixture
    extractMatchInfo(fixture) {
        const matchDate = fixture.date || 
                         fixture.matchDate || 
                         fixture.fixtureDate || 
                         fixture.match_date || 
                         fixture.fixture_date || 
                         fixture.dateTime || 
                         fixture.date_time || 
                         'TBD';

        const competition = fixture.competition?.name || 
                          fixture.competition || 
                          fixture.comp || 
                          fixture.league || 
                          fixture.competitionName || 
                          fixture.leagueName || 
                          'TBD';

        const time = fixture.time || 'TBD';
        const referee = fixture.referee || 'TBD';
        const attendance = fixture.attendance || 'TBD';
        const venue = fixture.venue || 'TBD';
        const matchId = fixture.id || 'TBD';

        return {
            matchDate,
            competition,
            time,
            referee,
            attendance,
            venue,
            matchId
        };
    }

    // Extract status from API fixture
    extractStatus(fixture) {
        let status = fixture.status?.full || 
                    fixture.status?.short || 
                    fixture.status || 
                    'NS';

        // If we have full-time scores, automatically set status to FT
        if (fixture.homeScore !== null && fixture.awayScore !== null) {
            status = 'FT';
        }

        return status;
    }

    // Filter fixtures by date range
    filterFixturesByDateRange(fixtures, startDate, endDate) {
        if (!Array.isArray(fixtures) || fixtures.length === 0) {
            return [];
        }

        return fixtures.filter(fixture => {
            const fixtureDate = fixture.date;
            if (!fixtureDate) return false;

            // Check if fixture date falls within the selected range
            const fixtureDateObj = new Date(fixtureDate);
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            // Set time to start of day for accurate comparison
            startDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(23, 59, 59, 999);
            fixtureDateObj.setHours(0, 0, 0, 0);

            return fixtureDateObj >= startDateObj && fixtureDateObj <= endDateObj;
        });
    }

    // Parse event date/time string
    parseEventDateTime(dateTimeString) {
        if (!dateTimeString || typeof dateTimeString !== 'string') {
            return null;
        }

        // Handle format: "2025-08-09 22:33:44"
        const [datePart, timePart] = dateTimeString.split(' ');
        
        if (!datePart || !timePart) {
            return null;
        }

        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');

        if (!year || !month || !day || !hour || !minute || !second) {
            return null;
        }

        return new Date(year, month - 1, day, hour, minute, second);
    }

    // Filter events by time range
    filterEventsByTimeRange(events, startDate, startTime, endDate, endTime) {
        if (!events || !Array.isArray(events)) {
            return [];
        }

        return events.filter(event => {
            if (!event['date/time']) {
                return false;
            }

            const eventDateTime = this.parseEventDateTime(event['date/time']);
            if (!eventDateTime) {
                return false;
            }

            const startDateTime = new Date(`${startDate} ${startTime}`);
            const endDateTime = new Date(`${endDate} ${endTime}`);

            return eventDateTime >= startDateTime && eventDateTime <= endDateTime;
        });
    }

    // Generate fixtures HTML for display
    generateFixturesHTML(fixtures, startDate, endDate, maxDisplay = 20) {
        if (!fixtures || fixtures.length === 0) {
            return '<p>No fixtures found</p>';
        }

        let fixturesHtml = `<h4>Fixtures Found for ${startDate} to ${endDate}:</h4><div class="fixtures-list">`;

        fixtures.forEach((fixture, index) => {
            if (index < maxDisplay) {
                const { homeTeam, awayTeam } = this.extractTeamNames(fixture);
                const { matchDate, competition, time, venue, matchId, referee, attendance } = this.extractMatchInfo(fixture);
                const { homeScore, awayScore } = this.extractScores(fixture);
                const status = this.extractStatus(fixture);

                fixturesHtml += `
                    <div class="fixture-item">
                        <input type="checkbox" id="fixture-${index}" class="fixture-checkbox" data-fixture='${JSON.stringify(fixture)}'>
                        <label for="fixture-${index}">
                            <strong>${homeTeam} vs ${awayTeam}</strong><br>
                            <small>Date: ${matchDate} | Time: ${time} | Competition: ${competition}</small><br>
                            <small>Venue: ${venue} | Match ID: ${matchId}</small><br>
                            <small>Referee: ${referee} | Attendance: ${attendance}</small><br>
                            <small>Score: ${homeScore || 'TBD'} - ${awayScore || 'TBD'} | Status: ${status}</small>
                        </label>
                    </div>
                `;
            }
        });

        if (fixtures.length > maxDisplay) {
            fixturesHtml += `<p><em>... and ${fixtures.length - maxDisplay} more fixtures</em></p>`;
        }

        fixturesHtml += '</div>';
        return fixturesHtml;
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 Data Processor cleanup completed');
    }
}
