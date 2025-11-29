# SQLite Migration Fix - Summary

## Issue

Users with existing databases were encountering the following error when starting the server:

```
SqliteError: no such column: priority
    at Database.exec (/workspaces/Milla-Rayne/node_modules/better-sqlite3/lib/methods/wrappers.js:9:14)
    at SqliteStorage.initializeDatabase (/workspaces/Milla-Rayne/server/sqliteStorage.ts:198:13)
```

## Root Cause

The `ai_updates` table schema was changed from a general-purpose AI updates table (with columns: `description`, `category`, `priority`) to an RSS feed structure (with columns: `url`, `source`, `published`, `summary`, `tags`).

While the migration code detected old schemas and dropped the table, it didn't explicitly drop the **old indexes** that referenced columns that no longer exist in the new schema. This could cause errors in certain edge cases where:

1. Old indexes exist referencing `priority`, `applied_at`, or `category` columns
2. The system tries to create new indexes or perform operations
3. SQLite throws an error because it encounters references to non-existent columns

## Solution

The fix explicitly drops old indexes before dropping and recreating the table:

```typescript
if (!hasSourceColumn) {
  // Old schema detected, migrate to new RSS feed structure
  console.log(
    'sqlite: migrating ai_updates table to new schema (RSS feed structure)'
  );

  // Drop old indexes first to prevent "no such column" errors
  // The old schema had indexes on 'priority', 'applied_at', 'category' columns
  // which don't exist in the new RSS feed schema
  this.db.exec(`
    DROP INDEX IF EXISTS idx_ai_updates_priority;
    DROP INDEX IF EXISTS idx_ai_updates_applied;
    DROP INDEX IF EXISTS idx_ai_updates_category;
  `);

  // Now drop and recreate the table with new schema
  this.db.exec('DROP TABLE IF EXISTS ai_updates');
}
```

## Changes Made

- **File**: `server/sqliteStorage.ts`
- **Lines**: 185-190
- **Change**: Added explicit `DROP INDEX IF EXISTS` statements for old indexes before dropping the table

## Testing

The fix has been verified with the following scenarios:

1. ✅ Fresh database initialization (no migration needed)
2. ✅ Old schema with `priority` column (migration executed successfully)
3. ✅ Database already using new schema (no unnecessary migration)
4. ✅ Old schema with data and indexes (migration successful, no errors)

## Impact

- **Breaking**: No - the migration preserves the new schema structure
- **Data Loss**: Yes - data in the old `ai_updates` table is lost during migration (this is expected as the schema is completely different)
- **Backwards Compatible**: Yes - handles all database states correctly

## Notes

- The separate `suggestion_updates` table continues to store daily AI improvement suggestions with `priority`, `description`, and `category` columns
- The new `ai_updates` table is now dedicated to RSS feed data from external sources
- Old indexes are dropped using `IF EXISTS` to ensure the operation is idempotent
