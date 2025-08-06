// Server-side proxy for Football Web Pages scraping
// This can be run as a Node.js server to handle CORS and scraping

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://your-domain.com'],
    credentials: true
}));

app.use(express.json());

// Scrape fixtures from Football Web Pages
app.get('/api/scrape-fixtures', async (req, res) => {
    try {
        const url = 'https://www.footballwebpages.co.uk/national-league';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const fixtures = [];

        // Parse the fixtures table
        $('table tbody tr').each((index, element) => {
            const $row = $(element);
            const $cells = $row.find('td');
            
            if ($cells.length >= 4) {
                const dateText = $cells.eq(0).text().trim();
                const status = $cells.eq(1).text().trim();
                const homeTeam = $cells.eq(2).text().trim();
                const score = $cells.eq(3).text().trim();
                const awayTeam = $cells.eq(4).text().trim();
                
                // Extract match ID from link if available
                const matchLink = $cells.eq(2).find('a').attr('href');
                const matchId = matchLink ? matchLink.split('/').pop() : null;
                
                // Parse date
                const dateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                let formattedDate = null;
                if (dateMatch) {
                    const [, day, month, year] = dateMatch;
                    formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                
                // Parse time
                const timeMatch = dateText.match(/(\d{1,2}):(\d{2})/);
                const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : null;
                
                // Parse score if available
                let homeScore = null;
                let awayScore = null;
                if (score && score !== 'v' && score !== 'P') {
                    const scoreMatch = score.match(/(\d+)-(\d+)/);
                    if (scoreMatch) {
                        homeScore = parseInt(scoreMatch[1]);
                        awayScore = parseInt(scoreMatch[2]);
                    }
                }
                
                fixtures.push({
                    date: formattedDate,
                    time: time,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    status: status,
                    score: score,
                    homeScore: homeScore,
                    awayScore: awayScore,
                    matchId: matchId
                });
            }
        });

        res.json({
            success: true,
            fixtures: fixtures,
            scrapedAt: new Date().toISOString(),
            source: 'Football Web Pages',
            url: url
        });

    } catch (error) {
        console.error('Error scraping fixtures:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Scrape league table
app.get('/api/scrape-table', async (req, res) => {
    try {
        const url = 'https://www.footballwebpages.co.uk/national-league';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const tableData = [];

        // Parse the league table
        $('table.league-table tbody tr').each((index, element) => {
            const $row = $(element);
            const $cells = $row.find('td');
            
            if ($cells.length >= 8) {
                const position = $cells.eq(0).text().trim();
                const team = $cells.eq(1).text().trim();
                const played = $cells.eq(2).text().trim();
                const won = $cells.eq(3).text().trim();
                const drawn = $cells.eq(4).text().trim();
                const lost = $cells.eq(5).text().trim();
                const goalsFor = $cells.eq(6).text().trim();
                const goalsAgainst = $cells.eq(7).text().trim();
                const goalDifference = $cells.eq(8).text().trim();
                const points = $cells.eq(9).text().trim();
                
                tableData.push({
                    position: parseInt(position) || 0,
                    team: team,
                    played: parseInt(played) || 0,
                    won: parseInt(won) || 0,
                    drawn: parseInt(drawn) || 0,
                    lost: parseInt(lost) || 0,
                    goalsFor: parseInt(goalsFor) || 0,
                    goalsAgainst: parseInt(goalsAgainst) || 0,
                    goalDifference: parseInt(goalDifference) || 0,
                    points: parseInt(points) || 0
                });
            }
        });

        res.json({
            success: true,
            table: tableData,
            scrapedAt: new Date().toISOString(),
            source: 'Football Web Pages'
        });

    } catch (error) {
        console.error('Error scraping table:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Football Web Pages Scraper Proxy'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Scraper proxy server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Fixtures endpoint: http://localhost:${PORT}/api/scrape-fixtures`);
    console.log(`Table endpoint: http://localhost:${PORT}/api/scrape-table`);
});

module.exports = app; 