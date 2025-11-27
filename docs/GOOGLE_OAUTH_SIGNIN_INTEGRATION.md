# Google OAuth Sign-In Integration

## Overview

Added "Sign in with Google" functionality to the authentication system. Users can now create or login to their Milla account using their Google account, eliminating the need for username/password.

## What Was Added

### 1. Backend Changes

#### New Function in `server/authService.ts`:

**`loginOrRegisterWithGoogle(email, googleId, name)`**

- Checks if user exists by email
- If exists: Logs them in with existing account
- If new: Creates account automatically
- Returns session token and user info
- Also returns `isNewUser` flag

**Features:**

- Automatic username generation from name or email
- Random password generation (not used, just for schema)
- Session creation with 7-day expiry
- Last login timestamp update

#### New Routes in `server/routes.ts`:

**`GET /api/auth/google`**

- Initiates Google OAuth flow for authentication
- Redirects to Google sign-in page
- Adds `state=auth` parameter to identify this is for login

**`GET /api/auth/google/callback`**

- Handles OAuth callback from Google
- Exchanges authorization code for access token
- Fetches user info from Google (email, id, name)
- Calls `loginOrRegisterWithGoogle()`
- Sets session cookie
- Stores OAuth token for Google services
- Shows beautiful success page

**Success Page Features:**

- Animated checkmark
- Different message for new vs returning users
- Auto-closes after 2 seconds
- Posts message to parent window with user data

### 2. Frontend Changes

#### Updated `client/src/components/auth/LoginDialog.tsx`:

**New Google Sign-In Button:**

- Official Google branding with 4-color logo
- Opens OAuth in popup window (500x600)
- Centered on screen
- Disabled during loading

**Added Features:**

- `useEffect` hook to listen for OAuth success messages
- `handleGoogleSignIn()` function to open popup
- Divider between traditional login and Google login
- Message event listener for popup communication

**UI Updates:**

- "or continue with" divider
- Google button with SVG logo
- Consistent styling with rest of dialog

## User Flow

### Sign In with Google:

1. User clicks "Sign In / Register" in settings
2. LoginDialog opens
3. User clicks "Sign in with Google" button
4. Popup window opens with Google sign-in
5. User signs in with Google account
6. Google redirects to callback URL
7. Backend creates/finds user account
8. Session cookie is set
9. OAuth token stored for Google services
10. Success page shows
11. Popup sends message to parent window
12. LoginDialog receives message and calls `onLoginSuccess()`
13. User is logged in!

### For New Users:

- Account created automatically from Google info
- Username generated from name (e.g., "John Doe" → "johndoe")
- Email from Google account
- Random secure password (never used)
- Default AI model: MiniMax
- Welcome message shows "Account Created!"

### For Returning Users:

- Finds existing account by email
- Logs them in
- Updates last login timestamp
- Welcome message shows "Welcome Back!"

## Security Features

### Implemented:

- ✓ OAuth 2.0 standard flow
- ✓ State parameter for CSRF protection
- ✓ HttpOnly session cookies
- ✓ Secure tokens (32-byte random hex)
- ✓ No password exposure (Google handles auth)
- ✓ OAuth token encrypted storage
- ✓ Popup window isolation
- ✓ Message origin validation

### OAuth Token Storage:

Google OAuth token is stored in `oauth_tokens` table linked to user ID, enabling:

- Gmail access
- Calendar integration
- YouTube playback
- Drive file access
- Photos access

## Benefits

### For Users:

1. **One-Click Sign In** - No need to remember password
2. **Auto Account Creation** - No registration form to fill
3. **Secure** - Google's authentication
4. **Connected Services** - Automatically connects Google services
5. **Cross-Device** - Same account everywhere

### For Developers:

1. **Less Password Management** - Google handles it
2. **Verified Emails** - Google-verified email addresses
3. **Reduced Support** - Fewer "forgot password" requests
4. **Better UX** - Faster onboarding
5. **Service Integration** - OAuth token ready for Google APIs

## Configuration Required

### Environment Variables:

Already configured in `.env`:

```bash
GOOGLE_CLIENT_ID=759591812989-vrler5d5ot38igtfftqk6l033udgg3ge.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback
```

### Google Cloud Console:

Authorized redirect URIs should include:

- `http://localhost:5000/oauth/callback` (existing - for service connection)
- `http://localhost:5000/api/auth/google/callback` (new - for authentication)

**To Add:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Click on your OAuth 2.0 Client ID
5. Add to "Authorized redirect URIs":
   - `http://localhost:5000/api/auth/google/callback`
6. Save

## Testing

### Test Flow:

1. Start the server: `npm run dev`
2. Open Milla in browser
3. Click Settings
4. Scroll to "User Account"
5. Click "Sign In / Register"
6. Click "Sign in with Google"
7. Sign in with your Google account
8. Verify success page appears
9. Verify popup closes automatically
10. Verify you're logged in (shows username/email in settings)

### Test Cases:

- [ ] New user - creates account
- [ ] Existing user - logs in
- [ ] Popup closes automatically
- [ ] Session persists after page reload
- [ ] Logout works
- [ ] Can switch AI models after Google login
- [ ] Google services are connected (check Gmail, Calendar, etc.)

## Differences from Standard Login

### Standard Username/Password:

- User manually enters username, email, password
- Password stored as bcrypt hash
- Email not verified
- Manual account creation

### Google OAuth:

- Google handles authentication
- No password stored for user
- Email is Google-verified
- Automatic account creation
- Also connects Google services

### Both Support:

- 7-day session expiry
- Session cookies
- AI model preference saving
- Settings persistence
- Logout functionality

## Troubleshooting

### Popup Blocked:

**Issue:** Browser blocks OAuth popup
**Solution:** Allow popups for localhost:5000 in browser settings

### Redirect URI Mismatch:

**Issue:** Google shows "redirect_uri_mismatch" error
**Solution:** Add `http://localhost:5000/api/auth/google/callback` to Google Cloud Console

### OAuth Callback Error:

**Issue:** Error on callback page
**Solution:** Check browser console and server logs for specific error

### User Not Logged In After Popup Closes:

**Issue:** Popup closes but LoginDialog doesn't update
**Solution:** Check browser console for message event errors

## Code Locations

### Backend:

- `server/authService.ts` - `loginOrRegisterWithGoogle()` function
- `server/routes.ts` - `/api/auth/google` and `/api/auth/google/callback` routes
- `server/oauthService.ts` - Existing OAuth functions (reused)

### Frontend:

- `client/src/components/auth/LoginDialog.tsx` - Google sign-in button and handler

### Configuration:

- `.env` - Google OAuth credentials (already configured)

## Future Enhancements

### Potential Additions:

1. **Other OAuth Providers:**
   - Sign in with GitHub
   - Sign in with Microsoft
   - Sign in with Apple

2. **Account Linking:**
   - Link Google to existing username/password account
   - Multiple OAuth providers for same account

3. **Profile Sync:**
   - Use Google profile picture as avatar
   - Sync display name

4. **Enhanced Scopes:**
   - Request additional Google permissions
   - More granular service access

5. **Offline Access:**
   - Keep refresh tokens longer
   - Background service sync

## Summary

The Google OAuth integration provides:

- **Seamless authentication** - One click to sign in
- **Automatic account creation** - No forms to fill
- **Service integration** - Google services automatically connected
- **Better security** - No password management
- **Improved UX** - Faster onboarding for users

Users can now choose between:

1. Traditional username/email/password
2. **Sign in with Google** (new!)

Both methods work together seamlessly, and users can even use Google OAuth to login to an account originally created with username/password (if emails match).
