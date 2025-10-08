# OAuth Quick Reference

## Quick Start

### 1. Configure Environment
```bash
# Add to .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback
MEMORY_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 2. Start Server
```bash
npm run dev
```

### 3. Connect Google Account
Navigate to: `http://localhost:5000/oauth/google`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/google` | GET | Initiate OAuth flow |
| `/oauth/callback` | GET | Handle OAuth callback |
| `/api/oauth/status` | GET | Check connection status |
| `/api/oauth/refresh` | POST | Manually refresh token |
| `/api/oauth/disconnect` | DELETE | Disconnect account |

## Usage Examples

### Check Status
```bash
curl http://localhost:5000/api/oauth/status
```

### Add Note (TypeScript)
```typescript
import { addNoteToKeep } from './server/browserIntegrationService';
await addNoteToKeep('Shopping', 'Milk, Eggs, Bread');
```

### Add Calendar Event (TypeScript)
```typescript
import { addCalendarEvent } from './server/browserIntegrationService';
await addCalendarEvent('Meeting', '2025-10-15', '14:00');
```

### Via Chat
**User:** "Add a note to buy groceries"  
**Milla:** "*smiles* I've added that to your Google Keep, love!"

## File Structure

```
server/
├── oauthService.ts         # OAuth logic
├── routes.ts               # OAuth routes
├── browserIntegrationService.ts  # Browser automation
└── sqliteStorage.ts        # Token storage

shared/
└── schema.ts               # oauth_tokens table

memory/
└── pr_memories/            # PR memory storage
    └── README.md

scripts/
└── test-oauth-service.ts   # Tests
```

## Security

✅ All tokens encrypted with AES-256-GCM  
✅ Auto-refresh 5 min before expiry  
✅ Environment variables for secrets  
✅ HTTPS ready for production  

## Testing

```bash
npx tsx scripts/test-oauth-service.ts
```

Expected: ✅ All OAuth service tests passed!

## Documentation

- `OAUTH_IMPLEMENTATION_GUIDE.md` - Complete technical guide
- `OAUTH_USAGE_EXAMPLE.md` - Practical examples
- `README.md` - Project overview

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "OAuth credentials not configured" | Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET |
| "No valid token available" | Visit /oauth/google to connect |
| "Failed to refresh token" | Re-authenticate via /oauth/google |

## Next Steps

1. Set up Google Cloud Project
2. Enable Calendar & Keep APIs
3. Create OAuth credentials
4. Install Python + Playwright
5. Update browser.py to use tokens

---

**Status:** ✅ Ready for production OAuth setup
