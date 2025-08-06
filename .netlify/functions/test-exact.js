exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Test the exact parameters from the working API response
    const testCases = [
      // Test without matchday parameter (maybe it's not needed)
      { league: '5' },
      { league: '6' },
      { league: '7' },
      // Test different league IDs
      { league: '5', matchday: '1' },
      { league: '5', matchday: '2' },
      // Test without any parameters to see what the API returns
      {}
    ];

    const results = [];

    for (const testCase of testCases) {
      const url = new URL('https://football-web-pages1.p.rapidapi.com/fixtures-results.json');
      
      // Add parameters if they exist
      if (testCase.league) url.searchParams.append('comp', testCase.league);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': '2e08ed83camsh44dc27a6c439f8dp1c388ajsn65cd74585fef',
            'X-RapidAPI-Host': 'football-web-pages1.p.rapidapi.com'
          }
        });

        const data = await response.json();
        
        // Filter by matchday if specified
        const fixturesResults = data['fixtures-results'];
        let filteredMatches = fixturesResults?.matches || [];
        if (testCase.matchday) {
          const startDate = new Date('2025-08-01');
          filteredMatches = (fixturesResults?.matches || []).filter(match => {
            const matchDate = new Date(match.date);
            const daysDiff = Math.floor((matchDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const calculatedMatchday = Math.floor(daysDiff / 7) + 1;
            return calculatedMatchday === parseInt(testCase.matchday);
          });
        }
        
        results.push({
          ...testCase,
          url: url.toString(),
          status: response.status,
          success: response.ok,
          hasMatches: fixturesResults && fixturesResults.matches && fixturesResults.matches.length > 0,
          totalMatchCount: fixturesResults && fixturesResults.matches ? fixturesResults.matches.length : 0,
          filteredMatchCount: filteredMatches.length,
          error: !response.ok ? data.error || 'Unknown error' : null,
          sampleMatch: filteredMatches.length > 0 ? {
            homeTeam: filteredMatches[0]['home-team']?.name,
            awayTeam: filteredMatches[0]['away-team']?.name,
            date: filteredMatches[0].date,
            time: filteredMatches[0].time
          } : null,
          rawResponse: data
        });
      } catch (error) {
        results.push({
          ...testCase,
          url: url.toString(),
          status: 'ERROR',
          success: false,
          hasMatches: false,
          totalMatchCount: 0,
          filteredMatchCount: 0,
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        testResults: results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}; 