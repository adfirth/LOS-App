# Football Web Pages Scraper Setup

This document explains how to set up and use the Football Web Pages scraper for the LOS App.

## Overview

The scraper system consists of two parts:
1. **Frontend Scraper** (`football-webpages-scraper.js`) - Integrated into the admin panel
2. **Backend Proxy** (`scraper-proxy.js`) - Server-side proxy to handle CORS and actual web scraping

## Setup Instructions

### Option 1: Using the Proxy Server (Recommended)

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start the Proxy Server
```bash
npm start
```

The server will run on `http://localhost:3001`

#### 3. Access the Scraper
1. Open your LOS App admin panel
2. Navigate to the "Football Web Pages Scraper" section
3. Click "Scrape Current Fixtures" or "Scrape Latest Scores"

### Option 2: Using Mock Data Only

If you don't want to run the proxy server, the scraper will automatically fall back to mock data based on the current National League fixtures.

## Features

### Fixture Scraping
- Scrapes current fixtures from https://www.footballwebpages.co.uk/national-league
- Extracts match dates, times, teams, and status
- Handles postponed matches and score updates

### Score Scraping
- Filters completed matches with final scores
- Updates match status to "FT" (Full Time)
- Provides score data for result processing

### Data Import
- Preview scraped data before importing
- Import fixtures directly to the current gameweek
- Automatic conversion to your app's data format

## API Endpoints

When the proxy server is running, these endpoints are available:

- `GET /api/health` - Health check
- `GET /api/scrape-fixtures` - Scrape current fixtures
- `GET /api/scrape-table` - Scrape league table

## Data Format

### Fixtures
```json
{
  "date": "2025-08-09",
  "time": "15:00",
  "homeTeam": "Altrincham",
  "awayTeam": "Aldershot Town",
  "status": "Scheduled",
  "score": "v",
  "homeScore": null,
  "awayScore": null,
  "matchId": "538333"
}
```

### Scores
```json
{
  "matchId": "538333",
  "homeTeam": "Altrincham",
  "awayTeam": "Aldershot Town",
  "homeScore": 2,
  "awayScore": 1,
  "status": "FT",
  "date": "2025-08-09"
}
```

## Troubleshooting

### Proxy Server Not Starting
- Check if Node.js is installed (version 14 or higher)
- Ensure all dependencies are installed with `npm install`
- Check if port 3001 is available

### CORS Errors
- The proxy server includes CORS headers for common development ports
- If using a different port, update the CORS configuration in `scraper-proxy.js`

### No Data Retrieved
- Check if the Football Web Pages website is accessible
- Verify the website structure hasn't changed
- Check browser console for error messages

### Mock Data Only
- If the proxy server is not running, the scraper will use mock data
- This is useful for testing the interface without external dependencies

## Development

### Adding New Features
1. Update the proxy server parsing logic in `scraper-proxy.js`
2. Modify the frontend scraper in `football-webpages-scraper.js`
3. Update the CSS styles in `style.css` if needed

### Testing
- Use `npm run dev` for development with auto-restart
- Test with both proxy server running and not running
- Verify data import functionality

## Security Notes

- The proxy server is for development use only
- In production, consider rate limiting and authentication
- Respect the target website's robots.txt and terms of service
- Add proper error handling and logging

## Integration with LOS App

The scraper integrates seamlessly with your existing LOS App:

1. **Admin Panel Integration** - Added to the fixture management section
2. **Firebase Integration** - Imports data directly to your Firebase database
3. **Team Validation** - Uses your existing team configuration
4. **Gameweek Management** - Respects your current gameweek settings

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify the proxy server is running and accessible
3. Test the health endpoint: `http://localhost:3001/api/health`
4. Check the Football Web Pages website is accessible 