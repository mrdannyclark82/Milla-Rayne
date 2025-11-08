# Browser Automation Setup Guide

## 🎯 Quick Fix for Your Issue

If you're seeing `{"success":true,"connected":false,"provider":null,"expiresAt":null}` when calling `/api/oauth/status`, it means **you haven't completed the OAuth connection yet**, even though your environment variables are set.

### The Solution (3 Steps)

#### 1. Verify Your Environment Variables
Make sure your `.env` file (NOT `.env.example`) has these values:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback
MEMORY_KEY=your_64_character_hex_key_here
```

**Generate MEMORY_KEY if you haven't:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Complete the OAuth Flow
Having the credentials in `.env` is only step 1. You **must** complete the OAuth flow to get access tokens:

```bash
# Start your server
npm run dev

# In your browser, navigate to:
http://localhost:5000/oauth/google
```

This will:
1. Redirect you to Google's consent screen
2. Ask you to grant permissions for Calendar and Keep
3. Redirect back to your app with tokens
4. Store encrypted tokens in your database

**You should see:** "Successfully connected to Google!" page

#### 3. Verify Connection
```bash
curl http://localhost:5000/api/oauth/status
```

**You should now see:**
```json
{
  "success": true,
  "connected": true,
  "provider": "google",
  "expiresAt": "2025-10-08T12:00:00.000Z"
}
```

---

## 🌐 Browser Automation Features

Once connected, Milla can:
- **Open websites** for you in a browser
- **Add events to Google Calendar**
- **Create notes in Google Keep**

### Prerequisites

1. **Python 3** installed
2. **Playwright** installed:
```bash
pip install playwright
playwright install chromium
```

### How It Works

When you ask Milla to:
- "Open YouTube for me"
- "Add a dentist appointment to my calendar for Tuesday at 2pm"
- "Create a note reminding me to buy groceries"

The system will:
1. Get your valid OAuth token from the database
2. Spawn a Python process running `browser.py`
3. Pass the access token via environment variable
4. Use Playwright to automate the browser action
5. Return the result to you

### Testing Browser Automation Directly

You can test the browser automation directly with the CLI:

```bash
# 1. Get your access token (you'll need this for testing)
# Your token is encrypted in the database, but you can get it via the API
# For testing, you can use a placeholder or complete the OAuth flow

# 2. Test navigation
export GOOGLE_ACCESS_TOKEN="your_token_here"
python3 browser.py navigate '{"url":"https://youtube.com"}'

# 3. Test calendar event
python3 browser.py add_calendar_event '{"title":"Test Event","date":"2025-10-20","time":"14:00"}'

# 4. Test Google Keep note
python3 browser.py add_note '{"title":"Test Note","content":"This is a test"}'
```

### Expected Output

**Success:**
```json
{
  "success": true,
  "message": "Successfully added calendar event: Test Event",
  "data": {"title": "Test Event", "date": "2025-10-20", "time": "14:00"}
}
```

**No Token:**
```json
{
  "success": false,
  "message": "Authentication required. Please provide a Google OAuth access token."
}
```

---

## 🐛 Troubleshooting

### Issue: OAuth credentials not loading

**Problem:** Server logs show "Google OAuth credentials not configured"

**Solution:**
1. Verify `.env` file exists (not just `.env.example`)
2. Restart the server after updating `.env`
3. Check environment variable loading:
```bash
# In your server code, add:
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
```

### Issue: Status shows connected:false

**Problem:** `/api/oauth/status` returns `connected: false`

**Solution:** 
You haven't completed the OAuth flow. Navigate to:
```
http://localhost:5000/oauth/google
```

### Issue: Browser automation fails

**Problem:** Calendar events or webpage navigation don't work

**Checklist:**
- [ ] Playwright installed: `pip install playwright`
- [ ] Chromium browser installed: `playwright install chromium`
- [ ] OAuth flow completed (status shows connected:true)
- [ ] Python 3 available: `python3 --version`
- [ ] browser.py executable: `python3 browser.py navigate '{"url":"https://google.com"}'`

**Common Error:** `ModuleNotFoundError: No module named 'playwright'`
```bash
# Install playwright
pip install playwright
# Install browser
playwright install chromium
```

### Issue: Calendar events not showing up

**Problem:** Command succeeds but event doesn't appear in Google Calendar

**Possible Causes:**
1. Google Calendar selectors may have changed (Google updates UI frequently)
2. Authentication may not be properly set
3. Calendar may be loading slowly

**Debug Steps:**
1. Run browser.py with `headless=False` to see what's happening:
   - Edit `browser.py` line where `BrowserAgentTool` is created
   - Change `headless=True` to `headless=False`
2. Check browser automation logs in server console
3. Verify manual calendar creation works at calendar.google.com

---

## 📖 Architecture Overview

```
User Request
    ↓
Milla's AI (mistralService.ts)
    ↓
Detects browser action needed
    ↓
browserIntegrationService.ts
    ↓
Gets valid OAuth token (auto-refresh if expired)
    ↓
Spawns Python process: python3 browser.py <action> <params>
    ↓
browser.py (Playwright)
    ├─ Launches Chromium browser
    ├─ Sets Google OAuth cookies
    ├─ Performs action (navigate/calendar/keep)
    └─ Returns JSON result
    ↓
Result sent back to user
```

## 🔐 Security Notes

- OAuth tokens are **encrypted** at rest using AES-256-GCM
- Tokens **auto-refresh** 5 minutes before expiration
- Access tokens passed to Python via **environment variables** (not command line)
- Never commit `.env` file (it's in `.gitignore`)

## 📚 Related Documentation

- **OAUTH_IMPLEMENTATION_GUIDE.md** - Complete technical implementation details
- **OAUTH_QUICK_REFERENCE.md** - Quick API reference and examples
- **OAUTH_USAGE_EXAMPLE.md** - Practical usage examples
- **README.md** - Main project documentation

## ✅ Success Checklist

- [ ] `.env` file created with Google OAuth credentials
- [ ] MEMORY_KEY generated and added to `.env`
- [ ] Server started with `npm run dev`
- [ ] Visited `http://localhost:5000/oauth/google` and completed OAuth flow
- [ ] Status endpoint shows `connected: true`
- [ ] Playwright installed: `pip install playwright && playwright install chromium`
- [ ] Tested browser.py: `python3 browser.py navigate '{"url":"https://google.com"}'`
- [ ] Browser automation works through Milla's chat interface

## 🚀 Next Steps

1. **Complete OAuth setup** (steps 1-5 above)
2. **Test basic browser automation** through Milla's chat
3. **Customize browser.py** for your specific use cases if needed
4. **Review logs** if anything doesn't work as expected

---

**Need Help?** Check the troubleshooting section above or review the related documentation files.
