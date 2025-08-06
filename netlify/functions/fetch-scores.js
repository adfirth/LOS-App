const axios = require('axios');

exports.handler = async (event, context) => {
  console.log('Function called with event:', JSON.stringify(event, null, 2));
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
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
    // Parse query parameters
    const { league, season, matchday, fixtures, startDate, endDate } = event.queryStringParameters || {};
    
    console.log('Parameters:', { league, season, matchday, fixtures: fixtures ? 'provided' : 'not provided', startDate, endDate });
    
    // Check if we have the required parameters for either approach
    const hasOldParams = league && season && matchday;
    const hasNewParams = league && startDate && endDate && fixtures;
    
    if (!hasOldParams && !hasNewParams) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters. Need either: league, season, matchday OR league, startDate, endDate, fixtures'
        })
      };
    }

    // Football Web Pages API configuration
    let config;
    
    if (hasNewParams) {
      // New approach: Use date range to fetch fixtures
      config = {
        method: 'GET',
        url: 'https://football-web-pages1.p.rapidapi.com/fixtures-results',
        params: {
          comp: league,
          season: '2025-2026', // Default season for date range approach
          from: startDate,
          to: endDate
        },
        headers: {
          'X-RapidAPI-Key': '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef',
          'X-RapidAPI-Host': 'football-web-pages1.p.rapidapi.com'
        }
      };
    } else {
      // Old approach: Use matchday
      config = {
        method: 'GET',
        url: 'https://football-web-pages1.p.rapidapi.com/fixtures-results',
        params: {
          comp: league,
          season: season,
          matchday: matchday
        },
        headers: {
          'X-RapidAPI-Key': '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef',
          'X-RapidAPI-Host': 'football-web-pages1.p.rapidapi.com'
        }
      };
    }

    console.log('Making API request with config:', JSON.stringify(config, null, 2));

    const response = await axios(config);
    const data = response.data;

    console.log('API response received:', JSON.stringify(data, null, 2));

    if (!data || !data.fixtures) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No fixtures found for the specified parameters'
        })
      };
    }

    // Parse existing fixtures if provided (for new approach)
    let existingFixtures = [];
    if (hasNewParams && fixtures) {
      try {
        existingFixtures = JSON.parse(decodeURIComponent(fixtures));
        console.log('Parsed existing fixtures:', existingFixtures.length);
      } catch (error) {
        console.error('Error parsing existing fixtures:', error);
      }
    }
    
    // Transform the API response to match our app's format
    let transformedFixtures = data.fixtures.map(fixture => {
      const match = fixture.match || {};
      const homeTeam = match.home || {};
      const awayTeam = match.away || {};
      
      // Determine match status and calculate appropriate refresh interval
      let status = 'scheduled';
      let refreshInterval = 300000; // 5 minutes default
      
      if (match.status) {
        status = match.status.toLowerCase();
        
        // Check if match is in progress
        if (status === 'live' || status === 'in progress') {
          // Check if we're in the last 5 minutes of the match
          const matchTime = match.time || '';
          if (matchTime.includes('85') || matchTime.includes('86') || 
              matchTime.includes('87') || matchTime.includes('88') || 
              matchTime.includes('89') || matchTime.includes('90')) {
            refreshInterval = 60000; // 1 minute for last 5 minutes
          } else {
            refreshInterval = 300000; // 5 minutes during match
          }
        } else if (status === 'full time' || status === 'finished') {
          refreshInterval = 0; // No refresh needed for completed matches
        }
      }

      return {
        homeTeam: homeTeam.name || '',
        awayTeam: awayTeam.name || '',
        homeScore: homeTeam.score || 0,
        awayScore: awayTeam.score || 0,
        homeScoreHT: homeTeam.halfTimeScore || 0,
        awayScoreHT: awayTeam.halfTimeScore || 0,
        status: status,
        date: match.date || '',
        time: match.time || '',
        venue: match.venue || '',
        completed: status === 'full time' || status === 'finished',
        refreshInterval: refreshInterval
      };
    });
    
    // Filter fixtures to only include those that match existing fixtures (for new approach)
    if (hasNewParams && existingFixtures.length > 0) {
      transformedFixtures = transformedFixtures.filter(apiFixture => {
        return existingFixtures.some(existingFixture => 
          existingFixture.homeTeam === apiFixture.homeTeam && 
          existingFixture.awayTeam === apiFixture.awayTeam
        );
      });
      console.log('Filtered fixtures to match existing:', transformedFixtures.length);
    }

    const result = {
      success: true,
      fixtures: transformedFixtures,
      count: transformedFixtures.length,
      refreshInterval: Math.min(...transformedFixtures.map(f => f.refreshInterval).filter(i => i > 0)),
      scrapedAt: new Date().toISOString()
    };

    console.log('Returning result:', JSON.stringify(result, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch scores',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
