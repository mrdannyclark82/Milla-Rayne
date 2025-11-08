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
    const messages = JSON.parse(fileContent);

    if (!Array.isArray(messages)) {
      console.error('memories.txt does not contain a valid array');
      return;
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

        // Create the message
        await storage.createMessage({
          content: msg.content,
          role:
            msg.role === 'user' || msg.role === 'assistant'
              ? msg.role
              : 'assistant',
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
