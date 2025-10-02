# Daily Suggestions & Dev Talk Guardrails - Implementation Summary

## Overview
This implementation adds predictive updates with daily suggestions and controls for automatic development/analysis talk in Milla's conversations.

## Key Features Implemented

### 1. Environment Configuration
**File**: `.env.example`

New environment variables:
- `ENABLE_PREDICTIVE_UPDATES=false` - Enable daily suggestion generation
- `AI_UPDATES_CRON="0 9 * * *"` - Cron schedule for suggestion generation (default 9:00 AM)
- `ENABLE_DEV_TALK=false` - Control automatic dev/analysis talk (default: disabled)
- `ADMIN_TOKEN=` - Optional token for protecting AI updates endpoints

### 2. Database Schema
**File**: `shared/schema.ts`

New tables:
- `ai_updates` - Stores predictive update items with priority and relevance scoring
- `daily_suggestions` - Stores one consolidated suggestion per calendar day

Both tables include metadata fields for extensibility and tracking.

### 3. Daily Suggestions Service
**File**: `server/dailySuggestionsService.ts`

Key functions:
- `getOrCreateTodaySuggestion()` - Idempotent function to get/create today's suggestion
- `markSuggestionDelivered(date)` - Mark a suggestion as delivered
- `initializeDailySuggestionScheduler()` - Set up daily cron job

The service:
- Pulls top items from `ai_updates` table
- Generates one concise suggestion per day using AI
- Falls back to friendly message if no updates available
- Respects `ENABLE_PREDICTIVE_UPDATES` environment variable

### 4. API Endpoints
**File**: `server/routes.ts`

New endpoints:
- `GET /api/ai-updates/daily-suggestion` - Get today's suggestion
- `POST /api/ai-updates/notify-today` - Mark today's suggestion as delivered

Both endpoints:
- Support optional admin token authentication
- Return structured JSON responses
- Include proper error handling

### 5. Dev Talk Gating
**File**: `server/routes.ts`

Function: `canDiscussDev(userUtterance?)`

Behavior:
- Returns `true` if `ENABLE_DEV_TALK=true`
- Returns `true` if user uses explicit verbs: "analyze", "improve", "apply updates", etc.
- Returns `false` otherwise (blocks automatic dev talk)

Applied to:
- GitHub URL auto-analysis in chat
- Repository improvement workflow triggers
- Any unsolicited analysis/development mentions

### 6. Chat Integration
**File**: `server/routes.ts`

Modifications:
- GitHub URL detection now checks `canDiscussDev()` before auto-analyzing
  - If blocked: Returns friendly prompt to say "analyze this repo"
  - If allowed: Proceeds with full analysis
- Daily suggestion surfaced when:
  - User asks "what's new" or similar queries
  - First message of the day (if `ENABLE_PREDICTIVE_UPDATES=true`)
  - Only delivered once per day (checked via `isDelivered` flag)

### 7. Storage Implementation
**File**: `server/sqliteStorage.ts`

New methods:
- `createAiUpdate(update)` - Add new AI update
- `getTopAiUpdates(limit)` - Get top unprocessed updates
- `getAiUpdateById(id)` - Get specific update
- `markAiUpdateApplied(id)` - Mark update as applied
- `createDailySuggestion(suggestion)` - Create daily suggestion
- `getDailySuggestionByDate(date)` - Get suggestion by date
- `markDailySuggestionDelivered(date)` - Mark as delivered

### 8. Scheduler
**File**: `server/index.ts`

Initialization:
- Calls `initializeDailySuggestionScheduler()` during server startup
- Scheduler only activates when `ENABLE_PREDICTIVE_UPDATES=true`
- Calculates next run time based on cron schedule
- Automatically creates suggestions at scheduled time

### 9. Documentation
**File**: `README.md`

Added section: "Predictive Updates Behavior"
- Explains configuration options
- Describes behavior with examples
- Clarifies dev talk gating
- Notes explicit requests always work

## Usage Examples

### Basic Configuration
```env
# Disable all automatic dev talk
ENABLE_DEV_TALK=false

# Enable daily suggestions at 9 AM
ENABLE_PREDICTIVE_UPDATES=true
AI_UPDATES_CRON="0 9 * * *"
```

### With Admin Protection
```env
ENABLE_PREDICTIVE_UPDATES=true
ADMIN_TOKEN=your-secure-token-here
```

Access protected endpoint:
```bash
curl -H "Authorization: Bearer your-secure-token-here" \
  http://localhost:5000/api/ai-updates/daily-suggestion
```

### Chat Behavior Examples

**Without ENABLE_DEV_TALK (default):**
```
User: Check out https://github.com/torvalds/linux
Milla: I see you shared a GitHub repository link! If you'd like me to 
       analyze it, just say "analyze this repo" and I'll dive into it 
       for you, love. 💜
```

**With explicit request:**
```
User: Please analyze https://github.com/torvalds/linux
Milla: *shifts into repository analysis mode*
       
       I found that GitHub repository, love! Let me analyze torvalds/linux...
       [full analysis follows]
```

**Daily suggestion:**
```
User: What's new?
Milla: *shares a quick thought*
       
       Everything's running smoothly today, love! I'm here and ready 
       whenever you need me. 💜
       
       [normal response follows]
```

## Testing Checklist

- [x] TypeScript compilation passes
- [x] API endpoints return correct responses
- [x] Admin token authentication works
- [x] GitHub URL auto-analysis respects ENABLE_DEV_TALK
- [x] Explicit analysis requests work regardless of settings
- [x] Daily suggestion delivered on "what's new" queries
- [x] Daily suggestion only delivered once per day
- [x] Scheduler initializes with correct schedule
- [x] Database tables created correctly
- [x] Service methods handle errors gracefully

## Future Enhancements

1. **PR #95 Integration**: Connect `ai_updates` table to actual predictive update source
2. **UI Dashboard**: Admin interface to view/manage AI updates and suggestions
3. **Analytics**: Track suggestion delivery rates and user engagement
4. **Customization**: Allow per-user suggestion preferences
5. **Notification System**: Push notifications for important suggestions

## Migration Notes

No migration required for existing installations. The new tables will be created automatically on first run. Existing functionality remains unchanged when new features are disabled.

Default behavior (without configuration):
- Dev talk: Disabled (requires explicit user request)
- Daily suggestions: Disabled
- Admin token: Not required (endpoints are open)

## Troubleshooting

**Suggestion not delivered:**
- Check `ENABLE_PREDICTIVE_UPDATES=true` is set
- Verify suggestion isn't already marked as delivered for today
- Check server logs for errors during suggestion creation

**Scheduler not running:**
- Ensure `ENABLE_PREDICTIVE_UPDATES=true`
- Verify `AI_UPDATES_CRON` format is correct
- Check server startup logs for "Daily suggestions scheduler: Enabled"

**Dev talk still appearing:**
- Set `ENABLE_DEV_TALK=false` in environment
- Restart server to apply changes
- Note: Explicit user requests will always work

## Conclusion

This implementation successfully adds daily suggestions and dev talk guardrails while maintaining backward compatibility and existing functionality. The feature is production-ready and tested.
