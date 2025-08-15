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
    // Parse parameters from either query string (GET) or body (POST)
    let league, season, matchday, fixtures, startDate, endDate;
    
    if (event.httpMethod === 'POST') {
      // Parse from POST body
      console.log('Processing POST request with body:', event.body);
      const body = JSON.parse(event.body || '{}');
      league = body.league;
      season = body.season;
      matchday = body.matchday;
      fixtures = body.fixtures;
      startDate = body.startDate;
      endDate = body.endDate;
      console.log('Parsed POST parameters:', { 
        league, 
        season, 
        matchday, 
        fixtures: fixtures ? 'provided' : 'not provided', 
        fixturesType: typeof fixtures,
        fixturesIsArray: Array.isArray(fixtures),
        fixturesLength: fixtures ? fixtures.length : 'N/A',
        startDate, 
        endDate 
      });
    } else {
      // Parse from query string (GET)
      const params = event.queryStringParameters || {};
      league = params.league;
      season = params.season;
      matchday = params.matchday;
      fixtures = params.fixtures;
      startDate = params.startDate;
      endDate = params.endDate;
      console.log('Parsed GET parameters:', { league, season, matchday, fixtures: fixtures ? 'provided' : 'not provided', startDate, endDate });
    }
    
    console.log('Final parameters:', { league, season, matchday, fixtures: fixtures ? 'provided' : 'not provided', startDate, endDate });
    
    // Check if we have the required parameters for either approach
    const hasOldParams = league && season && matchday;
    const hasNewParams = league && startDate && endDate && Array.isArray(fixtures);
    
    console.log('Parameter validation:', { hasOldParams, hasNewParams, league: !!league, startDate: !!startDate, endDate: !!endDate, fixtures: !!fixtures, fixturesType: typeof fixtures, fixturesLength: fixtures ? fixtures.length : 'N/A', isArray: Array.isArray(fixtures) });
    
    if (!hasOldParams && !hasNewParams) {
      console.log('Missing required parameters. Returning 400 error.');
      console.log('Debug info - league:', league, 'startDate:', startDate, 'endDate:', endDate, 'fixtures:', fixtures, 'isArray:', Array.isArray(fixtures));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters. Need either: league, season, matchday OR league, startDate, endDate, fixtures (must be an array)',
          receivedParams: { league, season, matchday, startDate, endDate, hasFixtures: !!fixtures, fixturesType: typeof fixtures, isArray: Array.isArray(fixtures) }
        })
      };
    }

    // Validate API key
    if (!process.env.VITE_RAPIDAPI_KEY) {
      console.error('VITE_RAPIDAPI_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'API configuration error - please contact administrator'
        })
      };
    }

    // Input validation
    if (hasOldParams) {
      if (!Number.isInteger(parseInt(league)) || parseInt(league) < 1) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid league parameter - must be a positive integer'
          })
        };
      }
      if (!Number.isInteger(parseInt(matchday)) || parseInt(matchday) < 1) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid matchday parameter - must be a positive integer'
          })
        };
      }
    }

    if (hasNewParams) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid date format - must be YYYY-MM-DD'
          })
        };
      }
      
      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Start date must be before or equal to end date'
          })
        };
      }
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
          'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY,
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
          'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'football-web-pages1.p.rapidapi.com'
        }
      };
    }

    console.log('Making API request with config:', JSON.stringify(config, null, 2));

    const response = await axios(config);
    const data = response.data;

    console.log('API response received:', JSON.stringify(data, null, 2));

    // Add detailed logging for the first fixture to understand structure
    if (data.fixtures && data.fixtures.length > 0) {
      console.log('First fixture structure:', JSON.stringify(data.fixtures[0], null, 2));
      if (data.fixtures[0].match) {
        console.log('First match structure:', JSON.stringify(data.fixtures[0].match, null, 2));
        if (data.fixtures[0].match.home) {
          console.log('Home team structure:', JSON.stringify(data.fixtures[0].match.home, null, 2));
          console.log('Home team keys:', Object.keys(data.fixtures[0].match.home));
        }
        if (data.fixtures[0].match.away) {
          console.log('Away team structure:', JSON.stringify(data.fixtures[0].match.away, null, 2));
          console.log('Away team keys:', Object.keys(data.fixtures[0].match.away));
        }
      }
    }

    if (!data || !data.fixtures) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          fixtures: [],
          count: 0,
          message: 'No fixtures found for the specified parameters',
          scrapedAt: new Date().toISOString()
        })
      };
    }

    // Parse existing fixtures if provided (for new approach)
    let existingFixtures = [];
    if (hasNewParams && Array.isArray(fixtures)) {
      try {
        // Handle both string (from GET) and object (from POST) formats
        if (typeof fixtures === 'string') {
          existingFixtures = JSON.parse(decodeURIComponent(fixtures));
        } else {
          existingFixtures = fixtures; // Already an object from POST
        }
        console.log('Parsed existing fixtures:', existingFixtures.length);
        console.log('First fixture sample:', existingFixtures[0]);
      } catch (error) {
        console.error('Error parsing existing fixtures:', error);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to parse fixtures data',
            message: error.message
          })
        };
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

      // Fix half-time score mapping - check multiple possible locations
      let homeScoreHT = null;
      let awayScoreHT = null;
      
      // Try different possible locations for half-time scores
      if (homeTeam.halfTimeScore !== undefined && awayTeam.halfTimeScore !== undefined) {
        homeScoreHT = parseInt(homeTeam.halfTimeScore) || null;
        awayScoreHT = parseInt(awayTeam.halfTimeScore) || null;
        console.log(`Found half-time scores in halfTimeScore fields: ${homeScoreHT}-${awayScoreHT}`);
      } else if (match.halfTimeScore) {
        // If there's a single half-time score field, try to parse it
        const htScore = match.halfTimeScore.toString();
        const parts = htScore.split('-');
        if (parts.length === 2) {
          homeScoreHT = parseInt(parts[0]) || null;
          awayScoreHT = parseInt(parts[1]) || null;
          console.log(`Found half-time scores in match.halfTimeScore: ${homeScoreHT}-${awayScoreHT}`);
        }
      } else if (homeTeam.ht && awayTeam.ht) {
        // Alternative field names
        homeScoreHT = parseInt(homeTeam.ht) || null;
        awayScoreHT = parseInt(awayTeam.ht) || null;
        console.log(`Found half-time scores in ht fields: ${homeScoreHT}-${awayScoreHT}`);
      } else if (homeTeam.halfTime && awayTeam.halfTime) {
        // Another possible field name
        homeScoreHT = parseInt(homeTeam.halfTime) || null;
        awayScoreHT = parseInt(awayTeam.halfTime) || null;
        console.log(`Found half-time scores in halfTime fields: ${homeScoreHT}-${awayScoreHT}`);
      } else if (match.halfTime) {
        // Single half-time field in match
        const htScore = match.halfTime.toString();
        const parts = htScore.split('-');
        if (parts.length === 2) {
          homeScoreHT = parseInt(parts[0]) || null;
          awayScoreHT = parseInt(parts[1]) || null;
          console.log(`Found half-time scores in match.halfTime: ${homeScoreHT}-${awayScoreHT}`);
        }
      } else {
        console.log(`No half-time scores found for ${homeTeam.name} vs ${awayTeam.name}`);
        console.log('Available home team fields:', Object.keys(homeTeam));
        console.log('Available away team fields:', Object.keys(awayTeam));
        console.log('Available match fields:', Object.keys(match));
        
        // Set to null when no half-time scores are found
        // This allows the frontend to preserve existing values
        homeScoreHT = null;
        awayScoreHT = null;
      }

      // Ensure scores are properly parsed
      const homeScore = parseInt(homeTeam.score) || 0;
      const awayScore = parseInt(awayTeam.score) || 0;

      return {
        homeTeam: homeTeam.name || '',
        awayTeam: awayTeam.name || '',
        homeScore: homeScore,
        awayScore: awayScore,
        homeScoreHT: homeScoreHT,
        awayScoreHT: awayScoreHT,
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
        return existingFixtures.some(existingFixture => {
          // Improve team name matching with multiple strategies
          const homeMatch = 
            existingFixture.homeTeam === apiFixture.homeTeam ||
            existingFixture.homeTeam.toLowerCase() === apiFixture.homeTeam.toLowerCase() ||
            existingFixture.homeTeam.replace(/[^a-zA-Z]/g, '').toLowerCase() === apiFixture.homeTeam.replace(/[^a-zA-Z]/g, '').toLowerCase();
          
          const awayMatch = 
            existingFixture.awayTeam === apiFixture.awayTeam ||
            existingFixture.awayTeam.toLowerCase() === apiFixture.awayTeam.toLowerCase() ||
            existingFixture.awayTeam.replace(/[^a-zA-Z]/g, '').toLowerCase() === apiFixture.awayTeam.replace(/[^a-zA-Z]/g, '').toLowerCase();
          
          return homeMatch && awayMatch;
        });
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
