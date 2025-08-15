# Netlify Function Deployment Guide

## Overview
The new `fetch-scores.js` Netlify function needs to be properly deployed to work with the Football Web Pages API integration.

## Files Required

### 1. `netlify/functions/fetch-scores.js`
This function handles API requests to the Football Web Pages API and returns formatted fixture data.

### 2. `netlify/functions/package.json`
Make sure this file includes the required dependencies:

```json
{
  "name": "netlify-functions",
  "version": "1.0.0",
  "description": "Netlify functions for LOS App",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12"
  },
  "devDependencies": {},
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

## Deployment Steps

### 1. Local Testing
Before deploying, test the function locally:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Navigate to your project directory
cd "LOS App"

# Start local development server
netlify dev
```

### 2. Test the Function
Once the local server is running, test the function:

```bash
# Test with curl
curl "http://localhost:8888/.netlify/functions/fetch-scores?league=5&season=2025-26&matchday=1"

# Or use the test page
# Open test-scores-api.html in your browser
```

### 3. Deploy to Netlify
Deploy your site to Netlify:

```bash
# Build and deploy
netlify deploy --prod
```

### 4. Verify Deployment
After deployment, verify the function is working:

1. Go to your Netlify dashboard
2. Navigate to Functions tab
3. Check that `fetch-scores` function is listed
4. Test the function URL: `https://your-site.netlify.app/.netlify/functions/fetch-scores?league=5&season=2025-26&matchday=1`

## Troubleshooting

### Common Issues

#### 1. Function Not Found (404)
- Ensure the function file is in the correct location: `netlify/functions/fetch-scores.js`
- Check that the function name matches the filename
- Verify the function is properly exported

#### 2. Module Not Found Errors
- Ensure `package.json` includes required dependencies
- Run `npm install` in the functions directory
- Check that dependencies are compatible with Netlify's Node.js version

#### 3. CORS Errors
- The function includes CORS headers, but if you're still getting errors:
- Check that the `Access-Control-Allow-Origin` header is set to `*`
- Verify the function handles OPTIONS requests

#### 4. API Key Issues
- Ensure the RapidAPI key is valid
- Check that the API key has the correct permissions
- Verify the API endpoint is accessible

### Testing the Function

#### Manual Test
```bash
curl -X GET \
  "https://your-site.netlify.app/.netlify/functions/fetch-scores?league=5&season=2025-26&matchday=1" \
  -H "Content-Type: application/json"
```

#### Expected Response
```json
{
  "success": true,
  "fixtures": [
    {
      "homeTeam": "Altrincham",
      "awayTeam": "Aldershot Town",
      "homeScore": 2,
      "awayScore": 1,
      "homeScoreHT": 1,
      "awayScoreHT": 0,
      "status": "full time",
      "date": "2025-08-09",
      "time": "15:00",
      "venue": "Moss Lane",
      "completed": true,
      "refreshInterval": 0
    }
  ],
  "count": 1,
  "refreshInterval": 300000,
  "scrapedAt": "2025-01-27T10:30:00.000Z"
}
```

## Environment Variables

If you need to use environment variables for the API key:

1. Add to your Netlify environment variables:
   - Go to Site settings > Environment variables
   - Add `RAPIDAPI_KEY` with your API key value

2. Update the function to use the environment variable:
```javascript
headers: {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
  'X-RapidAPI-Host': 'football-web-pages1.p.rapidapi.com'
}
```

## Monitoring

### Function Logs
Monitor function performance in Netlify dashboard:
- Go to Functions tab
- Click on `fetch-scores` function
- View invocation logs and performance metrics

### Error Tracking
Common errors to watch for:
- API rate limiting
- Invalid parameters
- Network timeouts
- JSON parsing errors

## Performance Optimization

### Caching
Consider implementing caching for API responses:
```javascript
// Add cache headers
headers: {
  'Cache-Control': 'max-age=300', // 5 minutes
  'Access-Control-Allow-Origin': '*',
  // ... other headers
}
```

### Rate Limiting
Implement rate limiting to avoid API quota issues:
```javascript
// Add rate limiting logic
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

## Security Considerations

1. **API Key Protection**: Keep your RapidAPI key secure
2. **Input Validation**: Validate all input parameters
3. **Error Handling**: Don't expose sensitive information in error messages
4. **CORS**: Configure CORS appropriately for your domain

## Support

If you encounter issues:
1. Check the Netlify function logs
2. Verify the API endpoint is accessible
3. Test with the provided test page
4. Check the browser console for detailed error messages 