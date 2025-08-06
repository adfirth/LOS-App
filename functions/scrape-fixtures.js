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
    const url = 'https://www.footballwebpages.co.uk/national-league';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const fixtures = [];

    // Extract fixtures from the page
    $('.fixture').each((index, element) => {
      const homeTeam = $(element).find('.home-team').text().trim();
      const awayTeam = $(element).find('.away-team').text().trim();
      const date = $(element).find('.date').text().trim();
      const time = $(element).find('.time').text().trim();

      if (homeTeam && awayTeam) {
        fixtures.push({
          homeTeam,
          awayTeam,
          date,
          time,
          fullDate: `${date} ${time}`
        });
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fixtures,
        count: fixtures.length,
        scrapedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Scraping error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to scrape fixtures',
        message: error.message
      })
    };
  }
}; 