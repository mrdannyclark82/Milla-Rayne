# Settings Panel and Proactive Features Fix

This document describes the fixes implemented to resolve the white screen issue in the Settings panel and the "too many requests" error related to proactive features.

## Issues Fixed

### 1. Settings Panel White Screen

**Problem**: When clicking the Settings button, users would see a white screen instead of the settings interface.

**Root Cause**: A syntax error in `SettingsPanel.tsx` line 926 where `\n\n` was rendered as literal text instead of being interpreted as whitespace.

**Solution**: 
- Removed the `\n\n` literal string from the JSX
- Verified all component imports and dependencies are correct
- Fixed TypeScript configuration error in `server/config.ts`

**Files Changed**:
- `client/src/components/SettingsPanel.tsx` - Fixed syntax error
- `server/config.ts` - Fixed missing closing brace

### 2. "Too Many Requests" Error

**Problem**: Users were experiencing rate limiting errors due to proactive features making frequent API calls to the main server on port 5000.

**Root Cause**: All API routes, including high-frequency proactive polling endpoints, were served from the same server with a restrictive rate limit (100 requests per 15 minutes).

**Solution**:
- Created a separate Express server (`proactiveServer.ts`) that runs on port 5001
- Moved all proactive feature routes (`/api/milla/*`) to the new server
- Configured higher rate limits for the proactive server (500 requests per 15 minutes)
- Updated client code to use the new proactive server for relevant API calls

**Files Changed**:
- `server/proactiveServer.ts` - New server for proactive features (port 5001)
- `server/routes.ts` - Commented out proactive routes registration
- `client/src/lib/proactiveApi.ts` - New utility for proactive API calls
- `client/src/components/scene/SceneSettingsPanel.tsx` - Updated to use proactive API
- `package.json` - Added new scripts for running both servers
- `.env.example` - Documented new `PROACTIVE_PORT` variable
- `README.md` - Updated with new server architecture
- `client/vite.config.ts` - Fixed duplicate build configuration

## Architecture Changes

### Before
```
┌─────────────────────────┐
│   Main Server (5000)    │
│  - All API routes       │
│  - Proactive routes     │
│  - Rate limit: 100/15m  │
└─────────────────────────┘
```

### After
```
┌─────────────────────────┐     ┌──────────────────────────┐
│   Main Server (5000)    │     │ Proactive Server (5001)  │
│  - Core API routes      │     │  - /api/milla/* routes   │
│  - Chat endpoints       │     │  - High-frequency polls  │
│  - Rate limit: 100/15m  │     │  - Rate limit: 500/15m   │
└─────────────────────────┘     └──────────────────────────┘
```

## Usage

### Running Both Servers Together (Recommended)
```bash
npm run dev:all
```

This starts:
- Main server on port 5000
- Proactive server on port 5001

### Running Servers Separately
```bash
# Terminal 1 - Main server
npm run dev

# Terminal 2 - Proactive server  
npm run dev:proactive
```

### Production
```bash
# Build both servers
npm run build

# Start in production
npm run start:all
```

## Environment Variables

Add to your `.env` file:

```bash
# Main application server port (default: 5000)
PORT=5000

# Proactive features server port (default: 5001)
PROACTIVE_PORT=5001
```

## Testing

A test script is provided to verify all changes:

```bash
./test-fixes.sh
```

This checks:
1. Port availability (5000, 5001)
2. TypeScript compilation
3. Proactive server file exists
4. Proactive API client exists
5. .env.example documentation
6. package.json scripts
7. SettingsPanel.tsx syntax fix

## Migration Notes

If you have existing code that calls proactive endpoints:

**Before:**
```typescript
const response = await fetch('/api/milla/tokens/rewards');
```

**After:**
```typescript
import { proactiveGet } from '@/lib/proactiveApi';
const data = await proactiveGet('/api/milla/tokens/rewards');
```

## Endpoints Moved to Proactive Server

All endpoints under `/api/milla/` are now handled by the proactive server:

- `/api/milla/analytics/*` - User analytics
- `/api/milla/sandboxes/*` - Sandbox management
- `/api/milla/features/*` - Feature discovery
- `/api/milla/tokens/*` - Token incentives
- `/api/milla/health` - Repository health
- `/api/milla/actions/*` - Proactive actions
- `/api/milla/prs/*` - Automated PRs
- `/api/milla/surveys/*` - User surveys
- `/api/milla/performance/*` - Performance profiling

## Benefits

1. **Settings Panel**: Now loads correctly without white screen errors
2. **Rate Limiting**: Proactive features no longer cause "too many requests" errors
3. **Scalability**: Proactive server can be scaled independently
4. **Performance**: Main server has reduced load
5. **Monitoring**: Easier to monitor and debug proactive features separately

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 5000 and 5001
lsof -ti:5000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
```

### Proactive Server Not Starting
Check that:
1. Port 5001 is available
2. `PROACTIVE_PORT` is set in `.env` (or defaults to 5001)
3. All dependencies are installed: `npm install`

### Settings Still Showing White Screen
1. Clear browser cache
2. Check browser console for errors
3. Verify the SettingsPanel.tsx fix is applied
4. Check that main server is running on port 5000
