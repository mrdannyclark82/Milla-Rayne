# Google OAuth & API Integration Setup Guide

This guide explains how to set up Google OAuth integration for Milla to access Google Calendar and Google Tasks.

## Quick Start

To enable Google integration features (calendar events, notes/tasks, website navigation), you need to:

1. Create a Google Cloud Project
2. Enable necessary APIs
3. Create OAuth credentials
4. Configure environment variables
5. Test the integration

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Required APIs

Enable the following APIs in your project:

- **Google Calendar API**: For creating calendar events
- **Google Tasks API**: For creating tasks/notes (Keep alternative)

To enable APIs:
1. Go to "APIs & Services" > "Library"
2. Search for each API
3. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen if not done:
   - User Type: External (for testing) or Internal (for organization)
   - App name: "Milla Rayne"
   - Support email: Your email
   - Scopes: Add Calendar and Tasks scopes
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: "Milla Rayne Web Client"
   - Authorized redirect URIs:
     - `http://localhost:5000/oauth/callback` (for local development)
     - Add your production URL when deploying
5. Download the credentials JSON or copy Client ID and Client Secret

### 4. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback

# Encryption key for token storage (required)
MEMORY_KEY=generate_a_random_32_character_string_here
```

To generate a secure MEMORY_KEY:
```bash
openssl rand -hex 32
```

### 5. Test OAuth Flow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the OAuth initiation endpoint:
   ```
   http://localhost:5000/oauth/google
   ```

3. You should be redirected to Google's consent screen
4. Grant the requested permissions
5. You'll be redirected back with a success message
6. Your OAuth tokens are now securely stored

### 6. Test Integration Features

Once authenticated, try these commands in the chat:

- **Calendar**: "Add a dentist appointment to my calendar for next Tuesday at 10am"
- **Notes/Tasks**: "Add a note to remind me to buy groceries"
- **Navigation**: "Open YouTube in the browser"

## API Endpoints

### OAuth Endpoints

- **`GET /oauth/google`**: Initiate OAuth flow
- **`GET /oauth/callback`**: OAuth callback handler
- **`GET /api/oauth/status`**: Check OAuth status
- **`POST /api/oauth/refresh`**: Manually refresh token
- **`DELETE /api/oauth/disconnect`**: Disconnect Google account

### Browser Integration Endpoints

- **`POST /api/browser/add-calendar-event`**
  ```json
  {
    "title": "Meeting",
    "date": "tomorrow",
    "time": "2pm",
    "description": "Team standup"
  }
  ```

- **`POST /api/browser/add-note`**
  ```json
  {
    "title": "Shopping List",
    "content": "Milk, bread, eggs"
  }
  ```

- **`POST /api/browser/navigate`**
  ```json
  {
    "url": "https://www.youtube.com"
  }
  ```

## How It Works

### OAuth Flow

1. User clicks `/oauth/google` or Milla prompts for authentication
2. User is redirected to Google consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Backend exchanges code for access & refresh tokens
6. Tokens are encrypted and stored in database
7. Access token is used for API calls
8. Refresh token is used to get new access tokens when expired

### Token Management

- **Access tokens** expire after 1 hour
- **Refresh tokens** are long-lived (can be revoked by user)
- Tokens are automatically refreshed when needed (5-minute buffer)
- All tokens are encrypted using AES-256-GCM before storage

### API Integration

#### Google Calendar API
- Creates events using Calendar API v3
- Supports natural language date/time parsing
- Default event duration: 1 hour
- Timezone: America/New_York (configurable in code)

#### Google Tasks API
- Creates tasks in the default task list
- Used as alternative to Google Keep (which has no public API)
- Tasks include title and notes/description

## Supported Date/Time Formats

The integration understands various natural language formats:

- **Relative dates**: "today", "tomorrow", "next Tuesday"
- **Specific dates**: "December 25", "2024-12-25"
- **Times**: "2pm", "14:00", "10:30am"

Examples:
- "tomorrow at 2pm"
- "next Monday at 9:30am"
- "December 25 at noon"

## Troubleshooting

### "OAuth credentials not configured" error

**Solution**: Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`

### "No valid token available" error

**Solution**: User needs to authenticate via `/oauth/google` first

### "Failed to refresh token" error

**Solutions**:
- User may need to re-authenticate (token was revoked)
- Check that refresh token is properly stored
- Verify OAuth credentials are correct

### Database errors

**Solution**: Make sure `MEMORY_KEY` is set (required for token encryption)

### "Tasks API not enabled" error

**Solution**: Enable Google Tasks API in Google Cloud Console

### Redirect URI mismatch

**Solution**: Make sure the redirect URI in Google Cloud Console matches `GOOGLE_OAUTH_REDIRECT_URI` in `.env`

## Security Best Practices

1. **Never commit credentials** to source control
2. **Use HTTPS** in production for OAuth redirect URI
3. **Rotate MEMORY_KEY** periodically
4. **Implement user consent** before accessing Google services
5. **Audit OAuth scopes** - only request what you need
6. **Monitor API usage** to detect anomalies

## Testing

Run the comprehensive test suite:

```bash
npx tsx server/__tests__/run-browser-tests.ts
```

This tests:
- Browser tool detection
- Image generation keyword filtering
- Google Calendar API integration
- Google Tasks API integration
- OAuth URL generation

## Production Deployment

When deploying to production:

1. Update `GOOGLE_OAUTH_REDIRECT_URI` to your production URL
2. Add production redirect URI to Google Cloud Console
3. Use HTTPS for all OAuth endpoints
4. Set appropriate CORS policies
5. Implement rate limiting for API endpoints
6. Monitor OAuth token usage and errors
7. Set up proper logging for debugging

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google Tasks API Documentation](https://developers.google.com/tasks/reference/rest)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google API Console](https://console.developers.google.com/)

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test OAuth flow manually by visiting `/oauth/google`
4. Run the test suite to identify specific failures
5. Check Google Cloud Console for API quota and errors
