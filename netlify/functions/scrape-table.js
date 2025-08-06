const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const url = 'https://www.footballwebpages.co.uk/national-league/table';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const table = [];

    // Extract table data
    $('.league-table tbody tr').each((index, element) => {
      const position = $(element).find('.position').text().trim();
      const team = $(element).find('.team').text().trim();
      const played = $(element).find('.played').text().trim();
      const won = $(element).find('.won').text().trim();
      const drawn = $(element).find('.drawn').text().trim();
      const lost = $(element).find('.lost').text().trim();
      const goalsFor = $(element).find('.goals-for').text().trim();
      const goalsAgainst = $(element).find('.goals-against').text().trim();
      const goalDifference = $(element).find('.goal-difference').text().trim();
      const points = $(element).find('.points').text().trim();

      if (team) {
        table.push({
          position: parseInt(position) || index + 1,
          team,
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        table,
        count: table.length,
        scrapedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Table scraping error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to scrape league table',
        message: error.message
      })
    };
  }
}; 