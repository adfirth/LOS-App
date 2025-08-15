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
    
    if (!league) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameter: league'
        })
      };
    }

    // Football Web Pages API configuration using the correct endpoint
    const url = new URL('https://football-web-pages1.p.rapidapi.com/fixtures-results.json');
    url.searchParams.append('comp', league);
    
    // Add date range parameters if provided to limit the API response
    if (startDate) {
      url.searchParams.append('from', startDate);
    }
    if (endDate) {
      url.searchParams.append('to', endDate);
    }

    console.log('Making API request to:', url.toString());

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY || '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef',
        'X-RapidAPI-Host': 'football-web-pages1.p.rapidapi.com'
      }
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('API response received:', JSON.stringify(data, null, 2));

    // Check for matches in the correct nested structure
    const fixturesResults = data['fixtures-results'];
    if (!fixturesResults || !fixturesResults.matches) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No matches found for the specified parameters',
          data: data
        })
      };
    }

    // Filter matches by specific fixtures (now that we have date-limited API response)
    let filteredMatches = fixturesResults.matches;
    
    if (fixtures) {
      // Parse the fixtures JSON to get specific matches to filter by
      try {
        const targetFixtures = JSON.parse(decodeURIComponent(fixtures));
        console.log('Filtering by specific fixtures:', targetFixtures.length);
        
        // Create a set of unique match identifiers for faster lookup
        const targetMatches = new Set();
        targetFixtures.forEach(fixture => {
          const matchKey = `${fixture.homeTeam} vs ${fixture.awayTeam}`;
          targetMatches.add(matchKey);
        });
        
        // Filter API matches to only include those that match our saved fixtures
        filteredMatches = fixturesResults.matches.filter(match => {
          const homeTeam = match['home-team']?.name || '';
          const awayTeam = match['away-team']?.name || '';
          const matchKey = `${homeTeam} vs ${awayTeam}`;
          return targetMatches.has(matchKey);
        });
        
        console.log('Filtered to specific fixtures:', filteredMatches.length);
        console.log('API response was limited by date range, so filtering is more efficient');
      } catch (error) {
        console.error('Error parsing fixtures parameter:', error);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid fixtures parameter format'
          })
        };
      }
    } else if (matchday) {
      // Fallback to date-based filtering if no specific fixtures provided
      const startDate = new Date('2025-08-01');
      filteredMatches = fixturesResults.matches.filter(match => {
        const matchDate = new Date(match.date);
        const daysDiff = Math.floor((matchDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const calculatedMatchday = Math.floor(daysDiff / 7) + 1;
        return calculatedMatchday === parseInt(matchday);
      });
      console.log('Filtered by matchday:', filteredMatches.length);
    }

    // Transform the API response to match our app's format
    console.log('Transforming matches:', filteredMatches.length);
    const transformedFixtures = filteredMatches.map(match => {
      const homeTeam = match['home-team'] || {};
      const awayTeam = match['away-team'] || {};
      
      console.log('Processing match:', { homeTeam: homeTeam.name, awayTeam: awayTeam.name, date: match.date });
      
      // Determine match status and calculate appropriate refresh interval
      let status = 'scheduled';
      let refreshInterval = 300000; // 5 minutes default
      
      // Check if match has a status (status is an object with short/full properties)
      if (match.status) {
        const statusText = match.status.short || match.status.full || '';
        status = statusText.toLowerCase();
        
        // Check if match is in progress
        if (status.includes('live') || status.includes('in progress') || status.includes('kick off')) {
          // Check if we're in the last 5 minutes of the match
          const matchTime = match.time || '';
          if (matchTime.includes('85') || matchTime.includes('86') || 
              matchTime.includes('87') || matchTime.includes('88') || 
              matchTime.includes('89') || matchTime.includes('90')) {
            refreshInterval = 60000; // 1 minute for last 5 minutes
          } else {
            refreshInterval = 300000; // 5 minutes during match
          }
        } else if (status.includes('full time') || status.includes('finished')) {
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
        refreshInterval: refreshInterval,
        // Add a flag to indicate this is API data that should be merged
        isApiData: true
      };
    });

    console.log('Transformed fixtures count:', transformedFixtures.length);
    console.log('Sample transformed fixture:', transformedFixtures[0]);

    const result = {
      success: true,
      fixtures: transformedFixtures,
      count: transformedFixtures.length,
      refreshInterval: transformedFixtures.length > 0 ? 
        Math.min(...transformedFixtures.map(f => f.refreshInterval).filter(i => i > 0)) || 300000 : 300000,
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
