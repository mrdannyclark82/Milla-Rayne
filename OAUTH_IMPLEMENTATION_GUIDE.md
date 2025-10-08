# OAuth Implementation Guide

## Overview

The Milla Rayne system now includes a complete OAuth 2.0 implementation for Google services integration. This enables authenticated access to Google Keep, Google Calendar, and other Google services through browser automation.

## Features Implemented

### 1. OAuth 2.0 Flow ✅
- **Authorization URL Generation**: Creates Google OAuth consent screen URLs
- **Token Exchange**: Exchanges authorization codes for access/refresh tokens
- **Token Refresh**: Automatically refreshes expired tokens
- **Secure Storage**: Tokens are encrypted at rest using AES-256-GCM encryption

### 2. Database Schema ✅
A new `oauth_tokens` table has been added to store OAuth credentials:
- `id` - Unique token identifier
- `user_id` - Associated user (defaults to 'default-user')
- `provider` - OAuth provider (currently 'google')
- `access_token` - Encrypted access token
- `refresh_token` - Encrypted refresh token
- `expires_at` - Token expiration timestamp
- `scope` - OAuth scopes granted
- `created_at` - Token creation timestamp
- `updated_at` - Last update timestamp

### 3. OAuth Service (`server/oauthService.ts`) ✅
Core service handling OAuth operations:
- `getAuthorizationUrl()` - Generate OAuth consent URL
- `exchangeCodeForToken(code)` - Exchange auth code for tokens
- `refreshAccessToken(refreshToken)` - Refresh expired tokens
- `storeOAuthToken(...)` - Store tokens securely (encrypted)
- `getOAuthToken(userId, provider)` - Retrieve stored tokens
- `getValidAccessToken(userId, provider)` - Get valid token (auto-refresh if needed)
- `deleteOAuthToken(userId, provider)` - Remove stored tokens

### 4. OAuth Routes ✅
REST API endpoints for OAuth management:

#### `GET /oauth/google`
Redirects user to Google OAuth consent screen.

#### `GET /oauth/callback`
Handles OAuth callback after user grants consent:
- Exchanges authorization code for tokens
- Stores encrypted tokens in database
- Shows success page

#### `POST /api/oauth/refresh`
Manually trigger token refresh (tokens auto-refresh when needed).

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

#### `GET /api/oauth/status`
Check OAuth connection status.

**Response:**
```json
{
  "success": true,
  "connected": true,
  "provider": "google",
  "expiresAt": "2025-10-08T12:00:00.000Z"
}
```

#### `DELETE /api/oauth/disconnect`
Disconnect Google account.

**Response:**
```json
{
  "success": true,
  "message": "Disconnected from Google"
}
```

### 5. Browser Integration Service (`server/browserIntegrationService.ts`) ✅
Updated to spawn Python processes with authentication:
- Retrieves valid access tokens automatically
- Passes tokens to `browser.py` via environment variables
- Handles Python process responses
- Falls back to mock responses if OAuth not configured

### 6. PR Memory Storage ✅
Created dedicated folder structure at `memory/pr_memories/`:
- Stores PR-specific conversations separately from personal memories
- Each PR has its own JSON file: `pr-{number}.json`
- Maintains context across different pull requests

## Setup Instructions

### Prerequisites
1. Google Cloud Project with OAuth 2.0 credentials
2. Enabled APIs: Google Calendar API, Google Keep API
3. Python 3 with Playwright installed (for browser automation)

### Environment Configuration

Add to your `.env` file:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback

# Memory Encryption (required for token security)
MEMORY_KEY=your_64_character_hex_key_here
```

Generate a secure `MEMORY_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Google Calendar API
   - Google Keep API (if available)
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/oauth/callback`
   - Copy Client ID and Client Secret

### Testing

Run the OAuth service test:
```bash
npx tsx scripts/test-oauth-service.ts
```

All tests should pass ✅

## Usage

### 1. Connect Google Account

Navigate to:
```
http://localhost:5000/oauth/google
```

This will:
1. Redirect to Google consent screen
2. User grants permissions
3. Callback stores encrypted tokens
4. Shows success message

### 2. Use Browser Integration

The browser integration service automatically uses stored tokens:

```typescript
import { addNoteToKeep, addCalendarEvent } from './browserIntegrationService';

// Add note to Google Keep
await addNoteToKeep('Shopping List', 'Milk, Eggs, Bread');

// Add calendar event
await addCalendarEvent(
  'Dentist Appointment',
  '2025-10-15',
  '14:00',
  'Annual checkup'
);
```

### 3. Check Connection Status

```bash
curl http://localhost:5000/api/oauth/status
```

### 4. Disconnect

```bash
curl -X DELETE http://localhost:5000/api/oauth/disconnect
```

## Security Features

✅ **Token Encryption**: All tokens encrypted with AES-256-GCM
✅ **Automatic Refresh**: Tokens auto-refresh 5 minutes before expiration
✅ **Environment Variables**: Credentials never committed to git
✅ **HTTPS Ready**: OAuth redirect URIs support HTTPS in production
✅ **User Isolation**: Tokens tied to user IDs (multi-user ready)

## Architecture

```
┌─────────────────┐
│  OAuth Routes   │
│  /oauth/google  │
│  /oauth/callback│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OAuth Service  │
│  - Token Store  │
│  - Auto Refresh │
│  - Encryption   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  SQLite Storage │◄─────┤  Schema (Drizzle)│
│  oauth_tokens   │      │  oauth_tokens    │
└────────┬────────┘      └──────────────────┘
         │
         │
         ▼
┌─────────────────────────┐
│ Browser Integration     │
│ - Gets valid token      │
│ - Spawns Python process │
│ - Passes token via env  │
└─────────┬───────────────┘
          │
          ▼
    ┌─────────────┐
    │  browser.py │
    │  Playwright │
    └─────────────┘
```

## Python Integration

The `browser.py` script has been updated to support OAuth access tokens and provides a CLI interface for browser automation actions.

### Command-Line Interface

The script can be invoked from the command line with the following syntax:

```bash
python3 browser.py <action> <params_json>
```

Where:
- `<action>`: The action to perform (`navigate`, `add_calendar_event`, `add_note`)
- `<params_json>`: JSON string with action parameters
- `GOOGLE_ACCESS_TOKEN`: Environment variable containing the OAuth access token

### Supported Actions

#### 1. Navigate to URL
```bash
export GOOGLE_ACCESS_TOKEN="your_access_token"
python3 browser.py navigate '{"url":"https://example.com"}'
```

**Response:**
```json
{"success": true, "message": "Successfully navigated to https://example.com. The current page title is: 'Example Domain'"}
```

#### 2. Add Calendar Event
```bash
export GOOGLE_ACCESS_TOKEN="your_access_token"
python3 browser.py add_calendar_event '{"title":"Meeting","date":"2025-10-15","time":"14:00","description":"Team sync"}'
```

**Parameters:**
- `title` (required): Event title
- `date` (required): Event date in YYYY-MM-DD format
- `time` (optional): Event time in HH:MM format
- `description` (optional): Event description

**Response:**
```json
{"success": true, "message": "Successfully added calendar event: Meeting", "data": {"title": "Meeting", "date": "2025-10-15", "time": "14:00"}}
```

#### 3. Add Note to Google Keep
```bash
export GOOGLE_ACCESS_TOKEN="your_access_token"
python3 browser.py add_note '{"title":"Shopping List","content":"Milk, Eggs, Bread"}'
```

**Parameters:**
- `title` (required): Note title
- `content` (required): Note content

**Response:**
```json
{"success": true, "message": "Successfully added note to Keep: Shopping List", "data": {"title": "Shopping List", "content": "Milk, Eggs, Bread"}}
```

### Browser Automation Flow

1. **Token Retrieval**: `browserIntegrationService.ts` gets a valid access token using `getValidAccessToken()`
2. **Process Spawn**: Service spawns Python process with action and parameters
3. **Environment Setup**: Access token passed via `GOOGLE_ACCESS_TOKEN` environment variable
4. **Browser Launch**: Playwright launches Chromium with authentication context
5. **Authentication**: Access token set as cookies for Google domains
6. **Action Execution**: Requested action performed (navigate, calendar, keep)
7. **Result Return**: JSON result returned via stdout to Node.js service

### Implementation Details

The `browser.py` script now includes:
- `access_token` parameter in `BrowserAgentTool.__init__()`
- Browser context creation with authentication support
- `_set_google_auth()` method to configure Google OAuth cookies
- `add_calendar_event()` method for Google Calendar integration
- `add_note_to_keep()` method for Google Keep integration
- `execute_action()` CLI handler for command-line invocation

## Troubleshooting

### "Google OAuth credentials not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Verify `.env` file is being loaded (not `.env.example`)
- Ensure environment variables are being loaded by the server (restart server after updating `.env`)

### OAuth endpoint redirects to Google but shows error
- Verify redirect URI matches exactly in Google Cloud Console and `.env`
- Check that Google Calendar API is enabled in Google Cloud Console
- Ensure OAuth consent screen is configured with correct scopes

### `/api/oauth/status` shows "connected: false"
This means no OAuth token is stored yet. User needs to:
1. Navigate to `http://localhost:5000/oauth/google` 
2. Complete Google OAuth consent flow
3. After successful authorization, check status again

### "No valid token available"
- User needs to connect their Google account via `/oauth/google`
- Check token expiration with `/api/oauth/status`
- Try manual refresh with `POST /api/oauth/refresh`

### "Failed to refresh token"
- Refresh token may be invalid or revoked
- User needs to re-authenticate via `/oauth/google`

### Browser automation not working (calendar/web navigation)
- Ensure Playwright is installed: `pip install playwright`
- Install Chromium browser: `playwright install chromium`
- Verify `browser.py` can be executed: `python3 browser.py navigate '{"url":"https://google.com"}'`
- Check that user has completed OAuth flow (access token must be available)
- Review server logs for Python process errors

### Foreign key constraint errors
- Ensure default user exists in database
- Storage initialization should create 'default-user' automatically

## Next Steps

1. **Production Deployment**:
   - Update `GOOGLE_OAUTH_REDIRECT_URI` to production URL
   - Use HTTPS for all OAuth flows
   - Set up proper user authentication

2. **Browser Automation** ✅:
   - ✅ Install Playwright: `pip install playwright && playwright install chromium`
   - ✅ Updated `browser.py` to use access token via CLI interface
   - ✅ Implemented Keep/Calendar automation logic with authenticated browsing
   - Note: Requires user to complete OAuth flow via `/oauth/google` before using automation features

3. **Multi-User Support**:
   - Add proper user authentication
   - Tie OAuth tokens to authenticated user sessions
   - Implement per-user token management UI

## API Reference

See detailed API documentation in the code:
- `server/oauthService.ts` - OAuth service methods
- `server/routes.ts` - OAuth route handlers
- `server/sqliteStorage.ts` - Storage layer methods
- `shared/schema.ts` - Database schema definitions

---

**Status**: ✅ Fully Implemented and Tested
**Ready for**: Production OAuth setup and browser automation integration
