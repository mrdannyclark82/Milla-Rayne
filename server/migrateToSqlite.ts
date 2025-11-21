/**
 * Migration script to transfer data from memories.txt to SQLite database
 * Run this script once to migrate existing memories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SqliteStorage } from './sqliteStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_FILE_PATH = path.resolve(
  __dirname,
  '..',
  'memory',
  'memories.txt'
);

async function migrateMemories() {
  console.log('Starting migration from memories.txt to SQLite...');

  if (!fs.existsSync(MEMORY_FILE_PATH)) {
    console.log('No memories.txt file found. Nothing to migrate.');
    return;
  }

  const storage = new SqliteStorage();

  try {
    const fileContent = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');

    let messages: Array<any> | null = null;

    // Try to parse as JSON array (new format). If that fails, attempt
    // to parse legacy plain-text memories and convert them into an
    // array of message objects. If parsing still fails, wrap the
    // entire file as a single message so migration can proceed.
    try {
      messages = JSON.parse(fileContent);
      if (!Array.isArray(messages)) {
        console.warn(
          'memories.txt parsed as JSON but is not an array — falling back to legacy parsing'
        );
        messages = null;
      }
    } catch (jsonErr) {
      console.log('memories.txt is not valid JSON; attempting legacy parse...');
      messages = null;
    }

    if (!messages) {
      // Try to extract timestamped entries like: [2025-08-31] ...
      const legacyMessages: Array<any> = [];
      const timestampLineRe = /^\s*\[(\d{4}-\d{2}-\d{2})\]\s*(.*)$/gm;
      let match: RegExpExecArray | null;

      // Collect per-line timestamped entries
      while ((match = timestampLineRe.exec(fileContent)) !== null) {
        const date = match[1];
        const rest = match[2].trim();
        legacyMessages.push({
          content: rest || '(no content)',
          role: 'user',
          timestamp: date,
        });
      }

      if (legacyMessages.length > 0) {
        messages = legacyMessages;
        console.log(
          `Legacy parse: extracted ${legacyMessages.length} timestamped messages`
        );
      } else {
        // As a last resort, split into chunks separated by two newlines and
        // treat each chunk as a message. This preserves as much content as possible.
        const chunks = fileContent
          .split(/\n\s*\n+/)
          .map((c) => c.trim())
          .filter(Boolean);
        if (chunks.length === 0) {
          console.error(
            'memories.txt appears empty after trimming — nothing to migrate'
          );
          return;
        }
        messages = chunks.map((chunk) => ({
          content: chunk,
          role: 'user',
          timestamp: new Date().toISOString(),
        }));
        console.log(
          `Legacy parse: converted ${chunks.length} text chunks into messages`
        );
      }
    }

    console.log(`Found ${messages.length} messages to migrate`);

    let migratedCount = 0;
    let errorCount = 0;
    let currentSessionId: string | null = null;
    let lastTimestamp: Date | null = null;
    const DEFAULT_USER_ID = 'default-user';

    // Create a default user for migration
    try {
      await storage.createUser({
        email: 'danny@millarayne.com',
        username: 'Danny Ray',
        password: 'migrated',
      });
      console.log('Created default user for migration');
    } catch (error) {
      console.log('Default user may already exist, continuing...');
    }

    // Start first session
    const firstSession = await storage.createSession(DEFAULT_USER_ID);
    currentSessionId = firstSession.sessionId;

    for (const msg of messages) {
      try {
        if (!msg.content || !msg.role) {
          console.warn('Skipping invalid message:', msg);
          errorCount++;
          continue;
        }

        const messageTimestamp = msg.timestamp
          ? new Date(msg.timestamp)
          : new Date();

        // Check if we should start a new session (gap > 30 minutes)
        if (lastTimestamp && currentSessionId) {
          const timeDiff =
            (messageTimestamp.getTime() - lastTimestamp.getTime()) /
            (1000 * 60);
          if (timeDiff > 30) {
            // End current session
            await storage.endSession(currentSessionId, [msg.content]);
            // Start new session
            const newSession = await storage.createSession(DEFAULT_USER_ID);
            currentSessionId = newSession.sessionId;
            console.log(
              `Started new session after ${Math.round(timeDiff)} minute gap`
            );
          }
        }

        // Map legacy roles to human-friendly names during migration.
        // Store as 'Milla' for assistant messages and 'Danny Ray' for user messages
        // to preserve conversational context in the new DB.
        // Keep DB-level role values compatible with existing schema constraints
        // ('assistant'|'user'), but store a human-friendly display role in
        // `display_role` so UI/analytics can show 'Milla'/'Danny Ray'.
        const roleForDb = (() => {
          if (!msg.role) return 'user';
          const r = String(msg.role).toLowerCase();
          return r === 'assistant' ? 'assistant' : 'user';
        })();

        const displayRole = (() => {
          if (!msg.role) return 'Danny Ray';
          const r = String(msg.role).toLowerCase();
          if (r === 'assistant') return 'Milla';
          if (r === 'user') return 'Danny Ray';
          if (r.includes('milla') || r.includes('danny') || r.includes('ray'))
            return msg.role;
          return 'Danny Ray';
        })();

        // Create the message (role uses DB-safe value; displayRole preserves human name)
        await storage.createMessage({
          content: msg.content,
          role: roleForDb,
          displayRole,
          personalityMode: msg.personalityMode || undefined,
          userId: DEFAULT_USER_ID,
        });

        lastTimestamp = messageTimestamp;
        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(`Migrated ${migratedCount} messages...`);
        }
      } catch (error) {
        console.error('Error migrating message:', error);
        errorCount++;
      }
    }

    // End the last session
    if (currentSessionId) {
      await storage.endSession(currentSessionId);
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated: ${migratedCount} messages`);
    console.log(`Errors: ${errorCount}`);

    // Show session stats
    const stats = await storage.getSessionStats(DEFAULT_USER_ID);
    console.log('\n=== Session Statistics ===');
    console.log(`Total sessions: ${stats.totalSessions}`);
    console.log(
      `Average session length: ${Math.round(stats.averageSessionLength)} minutes`
    );
    console.log(
      `Average time between sessions: ${Math.round(stats.averageTimeBetweenSessions)} minutes`
    );
    console.log(`Total messages: ${stats.totalMessages}`);
    console.log(
      `Average messages per session: ${Math.round(stats.averageMessagesPerSession)}`
    );

    // Show usage patterns
    const patterns = await storage.getUsagePatterns(DEFAULT_USER_ID);
    console.log('\n=== Top 5 Usage Patterns ===');
    patterns.slice(0, 5).forEach((p) => {
      console.log(
        `${p.dayOfWeek} at ${p.hourOfDay}:00 - ${p.sessionCount} sessions, ${p.messageCount} messages`
      );
    });

    // Create backup of original file
    const backupPath =
      MEMORY_FILE_PATH +
      '.migrated-backup-' +
      new Date().toISOString().replace(/:/g, '-');
    fs.copyFileSync(MEMORY_FILE_PATH, backupPath);
    console.log(`\nOriginal file backed up to: ${backupPath}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    storage.close();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMemories()
    .then(() => {
      console.log('\nMigration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error);
      process.exit(1);
    });
}

export { migrateMemories };
