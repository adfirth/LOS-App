# TheSportsDB Integration Setup Guide

The Last One Standing app now uses TheSportsDB to automatically fetch fixtures and scores. This provides free, reliable football data without requiring an API key.

## Features

- **Completely Free**: No API key required, no rate limits
- **Current Data**: Access to 2025/26 National League season
- **Round-based**: Uses proper round structure (r01, r02, etc.)
- **Real-time**: Live scores and match status updates

## Setup

### 1. No API Key Required

Unlike API-Football, TheSportsDB is completely free and doesn't require any registration or API key.

### 2. Configuration

The configuration is already set up in `thesportsdb-config.js`:

```javascript
const THESPORTSDB_CONFIG = {
    BASE_URL: 'https://www.thesportsdb.com/api/v1/json/3'
};

const THESPORTSDB_LEAGUE_IDS = {
    NATIONAL_LEAGUE: 4590
};
```

### 3. Available Leagues

Currently configured for:
- **National League** (ID: 4590) - English 5th tier

## Usage

### Admin Panel

1. Navigate to the admin panel
2. Select "National League" from the league dropdown
3. Choose the season (2025/26, 2024/25, or 2023/24)
4. Select the round number (1-10)
5. Click "Fetch Fixtures" to get fixtures for that round
6. Click "Fetch Scores" to update scores for completed matches

### API Endpoints Used

- **Fixtures**: `/eventsround.php?id={league}&s={season}&r={round}`
- **Scores**: Same endpoint (scores are included with fixtures)

### Data Structure

TheSportsDB returns events in this format:
```json
{
  "events": [
    {
      "idEvent": "2284586",
      "strHomeTeam": "Altrincham",
      "strAwayTeam": "Aldershot Town",
      "dateEvent": "2025-08-09",
      "intHomeScore": null,
      "intAwayScore": null,
      "strStatus": "Not Started",
      "intRound": "1"
    }
  ]
}
```

## Advantages over API-Football

1. **No API Key**: Completely free, no registration required
2. **No Rate Limits**: Unlimited requests
3. **Current Season**: 2025/26 National League data available
4. **Round Structure**: Proper round-based organization
5. **CORS Friendly**: Works directly in browsers

## Testing

Use `test-thesportsdb.html` to verify the integration is working:

1. Open `test-thesportsdb.html` in your browser
2. Click "Test TheSportsDB Connection"
3. Verify that fixtures are returned for National League 2025/26 Round 1

## Troubleshooting

### No Fixtures Found
- Check that the season and round combination exists
- Try different rounds (1-10)
- Verify the league ID is correct (4590 for National League)

### API Errors
- Check your internet connection
- Verify the API endpoint is accessible
- Check browser console for detailed error messages

### Data Issues
- TheSportsDB data is community-maintained
- Some rounds may have incomplete data
- Fallback to mock data is available for testing

## Migration from API-Football

The switch to TheSportsDB involved:
1. Replacing API configuration files
2. Updating HTML form elements
3. Modifying JavaScript functions
4. Updating CSS class names
5. Removing API key dependencies

## Support

For TheSportsDB specific issues, refer to their [documentation](https://www.thesportsdb.com/documentation).

The integration provides a robust, free alternative to paid football APIs while maintaining all the functionality needed for the Last One Standing competition. 