# Security Documentation

## Critical Security Update

**IMPORTANT**: API keys have been moved from hardcoded values to environment variables for security.

## Environment Variables Required

### Firebase Configuration
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

### RapidAPI Configuration
- `VITE_RAPIDAPI_KEY` - Your RapidAPI key for Football Web Pages API

## Setup Instructions

### For Netlify Deployment:
1. Go to your Netlify Site Dashboard
2. Navigate to **Site settings > Build & deploy > Environment**
3. Add each environment variable with its corresponding value
4. Redeploy your site

### For Local Development:
1. Copy `env.example` to `.env`
2. Fill in your actual API keys
3. **NEVER commit the `.env` file to version control**

## Security Benefits

- ✅ API keys are no longer exposed in source code
- ✅ Different keys can be used for different environments
- ✅ Keys can be rotated without code changes
- ✅ Follows security best practices

## Fallback Values

The code includes fallback values for development purposes, but these should not be used in production. Always set proper environment variables.

## Monitoring

- Monitor your API usage regularly
- Set up alerts for unusual API activity
- Rotate API keys periodically
- Use different keys for different environments (dev/staging/prod)
