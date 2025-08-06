// Football Web Pages Scraper for LOS App
// Updated to use Netlify Functions

class FootballWebPagesScraper {
    constructor() {
        this.baseUrl = window.location.origin; // Will be your Netlify domain
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Scrape Fixtures button
        const scrapeFixturesBtn = document.getElementById('scrape-fixtures-btn');
        if (scrapeFixturesBtn) {
            scrapeFixturesBtn.addEventListener('click', () => this.scrapeFixtures());
        }

        // Scrape Table button
        const scrapeTableBtn = document.getElementById('scrape-table-btn');
        if (scrapeTableBtn) {
            scrapeTableBtn.addEventListener('click', () => this.scrapeTable());
        }

        // Clear Data button
        const clearDataBtn = document.getElementById('clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearData());
        }
    }

    async scrapeFixtures() {
        this.showStatus('Scraping fixtures...', 'loading');
        
        try {
            if (this.isLocal) {
                // Use mock data for local testing
                this.showStatus('Local testing - using mock data', 'info');
                const mockFixtures = this.getMockFixtures();
                this.displayFixtures(mockFixtures);
                this.showStatus(`Local test: ${mockFixtures.length} mock fixtures loaded`, 'success');
                return;
            }

            const response = await fetch(`${this.baseUrl}/.netlify/functions/scrape-fixtures`);
            const data = await response.json();
            
            if (data.success) {
                this.displayFixtures(data.fixtures);
                this.showStatus(`Successfully scraped ${data.count} fixtures`, 'success');
            } else {
                this.showStatus('Failed to scrape fixtures: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Scraping error:', error);
            this.showStatus('Error scraping fixtures: ' + error.message, 'error');
        }
    }

    async scrapeTable() {
        this.showStatus('Scraping league table...', 'loading');
        
        try {
            if (this.isLocal) {
                // Use mock data for local testing
                this.showStatus('Local testing - using mock data', 'info');
                const mockTable = this.getMockTable();
                this.displayTable(mockTable);
                this.showStatus(`Local test: ${mockTable.length} mock teams loaded`, 'success');
                return;
            }

            const response = await fetch(`${this.baseUrl}/.netlify/functions/scrape-table`);
            const data = await response.json();
            
            if (data.success) {
                this.displayTable(data.table);
                this.showStatus(`Successfully scraped table with ${data.count} teams`, 'success');
            } else {
                this.showStatus('Failed to scrape table: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Table scraping error:', error);
            this.showStatus('Error scraping table: ' + error.message, 'error');
        }
    }

    getMockFixtures() {
        return [
            {
                homeTeam: 'Altrincham',
                awayTeam: 'Aldershot Town',
                date: '2025-08-09',
                time: '15:00'
            },
            {
                homeTeam: 'Boreham Wood',
                awayTeam: 'Rochdale',
                date: '2025-08-09',
                time: '15:00'
            },
            {
                homeTeam: 'Boston United',
                awayTeam: 'Morecambe',
                date: '2025-08-09',
                time: '15:00'
            },
            {
                homeTeam: 'Brackley Town',
                awayTeam: 'Eastleigh',
                date: '2025-08-09',
                time: '15:00'
            },
            {
                homeTeam: 'Braintree Town',
                awayTeam: 'Halifax Town',
                date: '2025-08-09',
                time: '15:00'
            }
        ];
    }

    getMockTable() {
        return [
            { position: 1, team: 'Altrincham', played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 12, goalsAgainst: 3, goalDifference: 9, points: 13 },
            { position: 2, team: 'Boreham Wood', played: 5, won: 3, drawn: 2, lost: 0, goalsFor: 8, goalsAgainst: 4, goalDifference: 4, points: 11 },
            { position: 3, team: 'Boston United', played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 9, goalsAgainst: 6, goalDifference: 3, points: 10 },
            { position: 4, team: 'Brackley Town', played: 5, won: 2, drawn: 3, lost: 0, goalsFor: 7, goalsAgainst: 4, goalDifference: 3, points: 9 },
            { position: 5, team: 'Braintree Town', played: 5, won: 2, drawn: 2, lost: 1, goalsFor: 6, goalsAgainst: 5, goalDifference: 1, points: 8 }
        ];
    }

    displayFixtures(fixtures) {
        const container = document.getElementById('scraped-fixtures');
        if (!container) return;

        if (fixtures.length === 0) {
            container.innerHTML = '<p>No fixtures found</p>';
            return;
        }

        let html = '<h4>Scraped Fixtures</h4>';
        html += '<div class="fixtures-table">';
        html += '<table><thead><tr><th>Home Team</th><th>Away Team</th><th>Date</th><th>Time</th></tr></thead><tbody>';
        
        fixtures.forEach(fixture => {
            html += `<tr>
                <td>${fixture.homeTeam}</td>
                <td>${fixture.awayTeam}</td>
                <td>${fixture.date}</td>
                <td>${fixture.time}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    displayTable(table) {
        const container = document.getElementById('scraped-table');
        if (!container) return;

        if (table.length === 0) {
            container.innerHTML = '<p>No table data found</p>';
            return;
        }

        let html = '<h4>Scraped League Table</h4>';
        html += '<div class="scores-table">';
        html += '<table><thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>';
        
        table.forEach(team => {
            html += `<tr>
                <td>${team.position}</td>
                <td>${team.team}</td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDifference}</td>
                <td>${team.points}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    clearData() {
        const fixturesContainer = document.getElementById('scraped-fixtures');
        const tableContainer = document.getElementById('scraped-table');
        
        if (fixturesContainer) fixturesContainer.innerHTML = '';
        if (tableContainer) tableContainer.innerHTML = '';
        
        this.showStatus('Data cleared', 'success');
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('scraper-status');
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }, 3000);
        }
    }
}

// Initialize scraper when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FootballWebPagesScraper();
}); 