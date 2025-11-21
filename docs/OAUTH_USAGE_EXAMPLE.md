# OAuth Flow Example

This document demonstrates how to use the OAuth implementation with real examples.

## 1. Initial Setup

First, make sure you have configured your `.env` file:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefghijk
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback
MEMORY_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

## 2. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 3. Connect Google Account

### Option A: Browser

Open your browser and navigate to:

```
http://localhost:5000/oauth/google
```

### Option B: Using curl

```bash
# This will show the redirect URL
curl -L http://localhost:5000/oauth/google
```

You'll be redirected to Google's consent screen where you can:

1. Sign in to your Google account
2. Review the permissions Milla is requesting:
   - Google Calendar access
   - Google Keep access
   - Profile and email
3. Click "Allow"

After granting consent, you'll be redirected back to:

```
http://localhost:5000/oauth/callback?code=4/0A...
```

The callback will:

1. Exchange the authorization code for tokens
2. Encrypt and store the tokens in the database
3. Show a success page

## 4. Check Connection Status

```bash
curl http://localhost:5000/api/oauth/status
```

**Response:**

```json
{
  "success": true,
  "connected": true,
  "provider": "google",
  "expiresAt": "2025-10-08T03:25:22.926Z"
}
```

## 5. Using Browser Integration

Once connected, Milla can use the browser integration service with your Google account:

### Example: Add Note to Google Keep

In your application code:

```typescript
import { addNoteToKeep } from './server/browserIntegrationService';

const result = await addNoteToKeep('Grocery List', 'Milk, Eggs, Bread, Butter');

console.log(result.message);
// Output: "I've added a note to your Google Keep: 'Grocery List'"
```

### Example: Add Calendar Event

```typescript
import { addCalendarEvent } from './server/browserIntegrationService';

const result = await addCalendarEvent(
  'Team Meeting',
  '2025-10-15',
  '10:00',
  'Weekly sync with the team'
);

console.log(result.message);
// Output: "I've added 'Team Meeting' to your Google Calendar for 2025-10-15 at 10:00"
```

### Example: Via Chat (AI Integration)

Simply talk to Milla:

**User:** "Add a note to remind me to buy groceries"

**Milla:** "_smiles_ Of course, love! I've added that note to your Google Keep."

Behind the scenes:

1. AI detects "add note" request
2. Calls `addNoteToKeep()` function
3. Service retrieves valid OAuth token
4. Spawns Python process with token
5. Python script authenticates and creates note
6. Response returned to Milla
7. Milla confirms with natural response

## 6. Token Auto-Refresh

Tokens are automatically refreshed when they expire. No manual intervention needed!

When you call any browser integration function:

```typescript
const result = await addNoteToKeep('Test', 'Content');
```

The service will:

1. Check if token is expired (or expiring soon)
2. If expired, automatically refresh using refresh token
3. Update database with new token
4. Use fresh token for the request

## 7. Manual Token Refresh

If needed, you can manually trigger a refresh:

```bash
curl -X POST http://localhost:5000/api/oauth/refresh
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

## 8. Disconnect Account

To disconnect your Google account:

```bash
curl -X DELETE http://localhost:5000/api/oauth/disconnect
```

**Response:**

```json
{
  "success": true,
  "message": "Disconnected from Google"
}
```

This will:

1. Delete all stored tokens from database
2. Require re-authentication for future Google operations

## 9. Error Handling

### Not Connected

If user tries to use Google services without connecting:

```typescript
const result = await addNoteToKeep('Test', 'Content');

if (!result.success && result.data?.needsAuth) {
  console.log('Please connect your Google account first');
  console.log('Visit: http://localhost:5000/oauth/google');
}
```

### Token Expired (No Refresh Token)

If refresh token is missing or invalid:

```json
{
  "error": "No valid token available. Please re-authenticate.",
  "success": false,
  "needsAuth": true
}
```

User needs to reconnect via `/oauth/google`

## 10. Security Considerations

✅ **All tokens are encrypted** at rest using AES-256-GCM
✅ **Tokens auto-refresh** to maintain valid session
✅ **HTTPS recommended** for production
✅ **Environment variables** keep secrets safe
✅ **Per-user isolation** ready for multi-user deployment

## Complete Flow Diagram

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Visit /oauth/google
     ▼
┌──────────────────┐
│  Milla Server    │
│  Redirects to    │
│  Google OAuth    │
└────┬─────────────┘
     │
     │ 2. User grants consent
     ▼
┌──────────────────┐
│  Google OAuth    │
│  Redirects back  │
│  with auth code  │
└────┬─────────────┘
     │
     │ 3. /oauth/callback?code=...
     ▼
┌──────────────────┐
│  OAuth Service   │
│  - Exchange code │
│  - Encrypt tokens│
│  - Store in DB   │
└────┬─────────────┘
     │
     │ 4. Success page shown
     ▼
┌──────────────────┐
│  User sees       │
│  "Connected!"    │
└──────────────────┘
```

## Browser Integration Flow

```
┌────────────────┐
│  Chat/API Call │
└───────┬────────┘
        │
        │ addNoteToKeep('Title', 'Content')
        ▼
┌──────────────────────┐
│  Browser Integration │
│  Service             │
└───────┬──────────────┘
        │
        │ 1. Get valid token
        ▼
┌──────────────────────┐
│  OAuth Service       │
│  - Checks expiration │
│  - Auto-refreshes    │
│  - Returns token     │
└───────┬──────────────┘
        │
        │ 2. Token retrieved
        ▼
┌──────────────────────┐
│  Spawn Python Process│
│  GOOGLE_ACCESS_TOKEN │
│  = encrypted_token   │
└───────┬──────────────┘
        │
        │ 3. Python executes
        ▼
┌──────────────────────┐
│  browser.py          │
│  - Uses Playwright   │
│  - Authenticates     │
│  - Creates note      │
│  - Returns result    │
└───────┬──────────────┘
        │
        │ 4. Result returned
        ▼
┌──────────────────────┐
│  Service responds    │
│  to caller           │
└──────────────────────┘
```

## Testing

Run the complete OAuth test suite:

```bash
npx tsx scripts/test-oauth-service.ts
```

Expected output:

```
🧪 Testing OAuth Service...

✓ Test 1: Checking storage methods exist
  All storage methods exist ✓

✓ Test 2: Creating test OAuth token
  Token created with ID: ...
  ✓

✓ Test 3: Retrieving OAuth token
  Token retrieved successfully ✓
  ✓

✓ Test 4: Updating OAuth token
  Token updated successfully ✓
  ✓

✓ Test 5: Deleting OAuth token
  Token deleted successfully ✓

✅ All OAuth service tests passed!
```

---

**Ready to use!** 🎉

For production deployment, update the redirect URI in both:

1. Your `.env` file: `GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/oauth/callback`
2. Google Cloud Console OAuth credentials
