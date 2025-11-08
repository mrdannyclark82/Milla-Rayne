# Memory System Migration Guide

## Overview

The Milla Rayne application has been upgraded from a file-based memory system (memories.txt) to a SQLite database. This provides better performance, structured data management, and enhanced session tracking.

## New Features

### 1. SQLite Database
- **Location**: `memory/milla.db`
- **Performance**: Faster queries with indexed lookups
- **Reliability**: ACID-compliant transactions
- **Scalability**: Can handle millions of messages efficiently

### 2. Session Tracking
The new system automatically tracks conversation sessions:
- **Session ID**: Unique identifier for each conversation session
- **Start/End Times**: Precise timestamps for session duration
- **Message Count**: Number of messages in each session
- **Last Messages**: Stores the last 2 messages for context
- **Auto-segmentation**: Sessions are automatically split after 30+ minute gaps

### 3. Usage Patterns
The system now tracks usage patterns to help Milla understand Danny Ray's habits:
- **Day of Week**: Which days are most active
- **Hour of Day**: Preferred conversation times
- **Session Frequency**: How often conversations occur
- **Message Volume**: Average messages per session

### 4. Enhanced Memory Schema
Each message now includes:
- Unique ID
- Content
- Role (user/assistant)
- Personality mode used
- Timestamp (with microsecond precision)
- Session ID
- User ID

## Migration Process

### Prerequisites
- Node.js and npm installed
- Existing `memory/memories.txt` file (optional)

### Step 1: Install Dependencies
The SQLite dependency has already been installed:
```bash
npm install
```

### Step 2: Run Migration Script
To migrate your existing memories.txt to SQLite:
```bash
npx tsx server/migrateToSqlite.ts
```

This will:
1. Read all messages from `memory/memories.txt`
2. Create the SQLite database at `memory/milla.db`
3. Create sessions based on message timestamps (30+ minute gaps = new session)
4. Analyze and store usage patterns
5. Create a backup of the original file
6. Display migration statistics

### Step 3: Verify Migration
The migration script will output:
- Number of messages migrated
- Number of sessions created
- Session statistics (average length, frequency)
- Top 5 usage patterns

Example output:
```
=== Migration Complete ===
Successfully migrated: 1500 messages
Errors: 0

=== Session Statistics ===
Total sessions: 42
Average session length: 15 minutes
Average time between sessions: 1440 minutes
Total messages: 1500
Average messages per session: 36

=== Top 5 Usage Patterns ===
Monday at 14:00 - 8 sessions, 288 messages
Wednesday at 19:00 - 7 sessions, 252 messages
...
```

### Step 4: Start the Application
```bash
npm run dev
```

The application will now automatically use the SQLite database.

## API Endpoints

### Session Management

#### Start a New Session
```
POST /api/session/start
Body: { "userId": "default-user" }
Response: { "success": true, "session": { "sessionId": "...", "startTime": "..." } }
```

#### End Current Session
```
POST /api/session/end
Body: { "sessionId": "...", "lastMessages": ["msg1", "msg2"] }
Response: { "success": true }
```

#### Get Session Statistics
```
GET /api/session/stats?userId=default-user
Response: {
  "success": true,
  "stats": {
    "totalSessions": 42,
    "averageSessionLength": 15.5,
    "averageTimeBetweenSessions": 1440,
    "totalMessages": 1500,
    "averageMessagesPerSession": 35.7
  }
}
```

#### Get Usage Patterns
```
GET /api/usage-patterns?userId=default-user
Response: {
  "success": true,
  "patterns": [
    {
      "dayOfWeek": "Monday",
      "hourOfDay": 14,
      "sessionCount": 8,
      "messageCount": 288
    },
    ...
  ]
}
```

## Rollback (If Needed)

If you need to rollback to the file-based system:

1. Stop the application
2. Edit `server/storage.ts`:
   ```typescript
   // Change from:
   import { SqliteStorage, type IStorage } from "./sqliteStorage";
   export const storage: IStorage = new SqliteStorage();
   
   // To:
   import { FileStorage, type IStorage } from "./fileStorage";
   export const storage: IStorage = new FileStorage();
   ```
3. Restart the application

Your original `memories.txt` file is backed up during migration as:
`memories.txt.migrated-backup-[timestamp]`

## Performance Benefits

- **Query Speed**: 10-100x faster for searching messages
- **Memory Usage**: More efficient memory management
- **Concurrent Access**: Supports multiple simultaneous operations
- **Data Integrity**: ACID transactions prevent data corruption
- **Indexing**: Fast lookups by timestamp, session, or user

## Maintenance

### Database Backup
Regular backups are recommended:
```bash
cp memory/milla.db memory/milla.db.backup-$(date +%Y%m%d)
```

### Database Size
Monitor database size:
```bash
ls -lh memory/milla.db
```

### Vacuum (Optional)
To optimize database size:
```bash
sqlite3 memory/milla.db "VACUUM;"
```

## Troubleshooting

### Migration Fails
- Check that `memory/memories.txt` exists and is valid JSON
- Ensure write permissions to the `memory/` directory
- Check disk space availability

### Database Locked
- Ensure only one instance of the application is running
- Close any SQLite browser tools

### Voice Features Not Working
- Ensure your browser supports Web Speech API
- Grant microphone permissions when prompted
- Use Chrome, Edge, or Safari (Firefox has limited support)

## Future Enhancements

The SQLite system is designed to support:
- Multi-user support with separate memory spaces
- Advanced analytics and insights
- Memory search and filtering
- Conversation export/import
- Emotional tone analysis over time
