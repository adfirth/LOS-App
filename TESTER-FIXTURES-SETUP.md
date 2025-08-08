# Tester Fixtures Setup Guide

## Overview

The tester system now supports separate fixtures for testers. Testers will see "Test Week 1" and "Test Week 2" with their own dedicated fixtures, completely separate from the main competition.

## How It Works

### Database Structure

Tester fixtures are stored in separate database documents:

- **Test Week 1**: `fixtures/tester_edition_gw1`
- **Test Week 2**: `fixtures/tester_edition_gw2`

### User Experience

- **Testers**: See "Test Week 1" and "Test Week 2" with 🧪 icon
- **Regular Users**: See "Game Week 1" and "Game Week 2" (main competition)
- **Visual Indicators**: Testers get green text and 🧪 icons for their game weeks

## Setting Up Tester Fixtures

### Option 1: Manual Database Setup

1. **Go to Firebase Console** → Firestore Database
2. **Create new documents** in the `fixtures` collection:
   - Document ID: `tester_edition_gw1`
   - Document ID: `tester_edition_gw2`

3. **Add fixture data** to each document:
   ```json
   {
     "fixtures": [
       {
         "homeTeam": "Test Team A",
         "awayTeam": "Test Team B", 
         "date": "2024-01-15T15:00:00Z",
         "venue": "Test Stadium",
         "status": "NS"
       },
       {
         "homeTeam": "Test Team C",
         "awayTeam": "Test Team D",
         "date": "2024-01-16T19:45:00Z", 
         "venue": "Test Arena",
         "status": "NS"
       }
     ]
   }
   ```

### Option 2: Admin Panel Setup (Recommended)

1. **Login as admin** and go to the admin panel
2. **Navigate to Fixture Management**
3. **Create tester fixtures** using the existing fixture management tools
4. **Save as tester edition** fixtures

## Fixture Format

Each fixture should include:

```json
{
  "homeTeam": "Team Name",
  "awayTeam": "Team Name", 
  "date": "ISO 8601 date string",
  "venue": "Stadium Name",
  "status": "NS" // NS = Not Started, 1H = First Half, HT = Half Time, FT = Full Time
}
```

## Testing the System

### 1. Set Up Test Fixtures
- Create tester fixtures in the database
- Use different teams and dates from main competition

### 2. Promote a User to Tester
- Go to Admin Panel → Registration Management
- Click "Make Tester" for a test user

### 3. Verify Tester Experience
- Login as tester
- Should see "Test Week 1" and "Test Week 2" with 🧪 icons
- Should see tester-specific fixtures
- Should be able to make picks for test weeks

### 4. Verify Regular User Experience
- Login as regular user
- Should see "Game Week 1" and "Game Week 2" (no special styling)
- Should see main competition fixtures

## Example Test Fixtures

### Test Week 1 Example:
```json
{
  "fixtures": [
    {
      "homeTeam": "Alpha United",
      "awayTeam": "Beta City",
      "date": "2024-01-15T15:00:00Z",
      "venue": "Test Stadium 1",
      "status": "NS"
    },
    {
      "homeTeam": "Gamma Rovers", 
      "awayTeam": "Delta Athletic",
      "date": "2024-01-16T19:45:00Z",
      "venue": "Test Arena 1",
      "status": "NS"
    }
  ]
}
```

### Test Week 2 Example:
```json
{
  "fixtures": [
    {
      "homeTeam": "Echo Wanderers",
      "awayTeam": "Foxtrot United", 
      "date": "2024-01-22T15:00:00Z",
      "venue": "Test Stadium 2",
      "status": "NS"
    },
    {
      "homeTeam": "Golf Rangers",
      "awayTeam": "Hotel Athletic",
      "date": "2024-01-23T19:45:00Z",
      "venue": "Test Arena 2", 
      "status": "NS"
    }
  ]
}
```

## Benefits

### Complete Isolation
- Testers have their own fixtures
- No interference with main competition
- Safe testing environment

### Visual Distinction
- Clear indicators for tester content
- Easy to identify test vs production data
- Professional appearance

### Flexible Management
- Easy to update tester fixtures
- Can test different scenarios
- Independent from main competition

## Troubleshooting

### Testers See Regular Fixtures
- Check if `tester_edition_gw1` and `tester_edition_gw2` exist in database
- Verify user has `isTester: true` in their profile
- Check browser console for errors

### No Fixtures Displayed
- Verify fixture documents exist in Firestore
- Check fixture data format is correct
- Ensure dates are in ISO 8601 format

### Visual Indicators Not Showing
- Check CSS is loaded properly
- Verify `tester-gameweek` class is applied
- Check browser console for JavaScript errors

## Next Steps

1. **Set up tester fixtures** in the database
2. **Promote test users** to tester status
3. **Test the system** with different scenarios
4. **Monitor tester activity** and feedback
5. **Update fixtures** as needed for testing

The system is now ready for isolated tester fixtures! 🧪
