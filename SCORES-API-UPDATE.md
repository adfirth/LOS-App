# Scores Tab Update - Football Web Pages API Integration

## Overview
The scores tab in the admin panel has been updated to use the Football Web Pages API instead of TheSportsDB, with intelligent dynamic refresh intervals based on match status.

## Key Features Added

### 1. Dynamic Refresh Intervals
- **5 minutes** during normal match play
- **1 minute** during the last 5 minutes of a match (85th minute onwards)
- **No updates** for completed matches

### 2. Football Web Pages API Integration
- New Netlify function: `netlify/functions/fetch-scores.js`
- Real-time score fetching from Football Web Pages API via RapidAPI
- Automatic match status detection and interval adjustment

### 3. Enhanced Admin Interface
- New API configuration section in the scores tab
- League and season selection controls
- Real-time status updates with interval information
- Responsive design for mobile devices

## Files Modified

### 1. `netlify/functions/fetch-scores.js` (NEW)
- Handles API requests to Football Web Pages API
- Transforms API response to match app format
- Calculates appropriate refresh intervals based on match status
- Returns fixtures with refresh interval information

### 2. `app.js`
- Updated `startRealTimeScoreUpdates()` function to use Football Web Pages API
- Added `loadFootballWebPagesSettings()` and `saveFootballWebPagesSettings()` functions
- Enhanced real-time update logic with dynamic intervals
- Added API settings event listeners

### 3. `admin.html`
- Added Football Web Pages API configuration section
- League and season selection dropdowns
- Save API settings button
- Status message display

### 4. `style.css`
- Added styles for `.football-webpages-config` section
- Added styles for `.api-config-controls`
- Responsive design for mobile devices
- Consistent styling with existing admin interface

### 5. `test-scores-api.html` (NEW)
- Test page to demonstrate API functionality
- Real-time update simulation
- Interactive testing interface

## API Configuration

### Supported Leagues
- National League (ID: 5)
- National League North (ID: 6)
- National League South (ID: 7)

### Supported Seasons
- 2025/26
- 2024/25
- 2023/24

### API Endpoint
```
/.netlify/functions/fetch-scores?league={league}&season={season}&matchday={matchday}
```

## How It Works

### 1. Match Status Detection
The system analyzes the match status and time to determine the appropriate refresh interval:

```javascript
if (status === 'live' || status === 'in progress') {
    if (matchTime.includes('85') || matchTime.includes('86') || 
        matchTime.includes('87') || matchTime.includes('88') || 
        matchTime.includes('89') || matchTime.includes('90')) {
        refreshInterval = 60000; // 1 minute
    } else {
        refreshInterval = 300000; // 5 minutes
    }
} else if (status === 'full time' || status === 'finished') {
    refreshInterval = 0; // No updates
}
```

### 2. Dynamic Interval Updates
The system automatically adjusts the refresh interval based on the API response:

```javascript
const newInterval = data.refreshInterval || 300000;
if (newInterval !== currentInterval) {
    currentInterval = newInterval;
    clearInterval(updateInterval);
    
    if (currentInterval > 0) {
        updateInterval = setInterval(performUpdate, currentInterval);
    }
}
```

### 3. Real-time Status Updates
The admin interface shows:
- Current update status
- Last update time
- Current refresh interval
- Number of fixtures updated

## Usage Instructions

### 1. Configure API Settings
1. Go to Admin Panel → Scores Tab
2. Select the appropriate League and Season
3. Click "Save API Settings"

### 2. Start Real-time Updates
1. Select the desired Game Week
2. Click "Start Real-time Updates"
3. Monitor the status for updates and interval changes

### 3. Stop Updates
- Click "Stop Real-time Updates" to manually stop
- Updates automatically stop when all matches are completed

## Benefits

### 1. More Accurate Data
- Direct integration with Football Web Pages API
- Real-time score updates during matches
- Better match status detection

### 2. Intelligent Updates
- Reduces API calls during quiet periods
- Increases frequency during critical match moments
- Automatically stops when no longer needed

### 3. Better User Experience
- Clear status indicators
- Responsive design
- Easy configuration

### 4. Cost Effective
- Optimized API usage
- Automatic interval management
- Reduced unnecessary requests

## Testing

Use the `test-scores-api.html` file to:
- Test API connectivity
- Verify data transformation
- Simulate real-time updates
- Check interval changes

## Future Enhancements

1. **Match-specific intervals**: Different intervals for different match types
2. **Custom intervals**: Allow admins to set custom refresh rates
3. **Notification system**: Alert admins of significant score changes
4. **Historical data**: Store and display update history
5. **Performance metrics**: Track API response times and success rates

## Technical Notes

- The system uses the existing RapidAPI key from `football-webpages-config.js`
- Matchday calculation is based on fixture dates relative to season start
- All times are handled in the local timezone
- Error handling includes automatic retry logic
- The system gracefully handles API rate limits 