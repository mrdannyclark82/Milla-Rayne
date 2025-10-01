/**
 * One-time encryption migration script
 * Encrypts existing persisted data in SQLite database and visual_memories.json
 * 
 * Usage: 
 *   npx tsx server/encryptMigration.ts [--force]
 * 
 * Environment:
 *   MEMORY_KEY - Required encryption key (min 32 characters)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { encrypt, isEncrypted, getMemoryKey } from './crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'memory', 'milla.db');
const VISUAL_MEMORY_PATH = path.resolve(__dirname, '..', 'memory', 'visual_memories.json');

interface MigrationStats {
  messagesTotal: number;
  messagesEncrypted: number;
  messagesSkipped: number;
  sessionsTotal: number;
  sessionsEncrypted: number;
  sessionsSkipped: number;
  visualMemoryEncrypted: boolean;
  errors: string[];
}

async function encryptMessages(db: Database.Database, memoryKey: string, dryRun: boolean): Promise<{ total: number; encrypted: number; skipped: number; errors: string[] }> {
  const stats = { total: 0, encrypted: 0, skipped: 0, errors: [] as string[] };
  
  try {
    // Get all messages
    const messages = db.prepare('SELECT id, content FROM messages').all() as Array<{ id: string; content: string }>;
    stats.total = messages.length;
    
    console.log(`Found ${stats.total} messages in database`);
    
    if (dryRun) {
      console.log('[DRY RUN] Would encrypt messages...');
      messages.forEach(msg => {
        if (!isEncrypted(msg.content)) {
          stats.encrypted++;
        } else {
          stats.skipped++;
        }
      });
    } else {
      // Prepare update statement
      const updateStmt = db.prepare('UPDATE messages SET content = ? WHERE id = ?');
      
      // Process each message
      for (const message of messages) {
        try {
          if (isEncrypted(message.content)) {
            stats.skipped++;
            continue;
          }
          
          const encrypted = encrypt(message.content, memoryKey);
          updateStmt.run(encrypted, message.id);
          stats.encrypted++;
          
          if (stats.encrypted % 100 === 0) {
            console.log(`  Encrypted ${stats.encrypted}/${stats.total} messages...`);
          }
        } catch (error) {
          const errorMsg = `Failed to encrypt message ${message.id}: ${error instanceof Error ? error.message : String(error)}`;
          stats.errors.push(errorMsg);
          console.error(`  ⚠️  ${errorMsg}`);
        }
      }
    }
    
    console.log(`Messages: ${stats.encrypted} encrypted, ${stats.skipped} skipped, ${stats.errors.length} errors`);
  } catch (error) {
    const errorMsg = `Failed to process messages: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
  
  return stats;
}

async function encryptSessions(db: Database.Database, memoryKey: string, dryRun: boolean): Promise<{ total: number; encrypted: number; skipped: number; errors: string[] }> {
  const stats = { total: 0, encrypted: 0, skipped: 0, errors: [] as string[] };
  
  try {
    // Get all sessions with last_two_messages
    const sessions = db.prepare("SELECT id, last_two_messages FROM sessions WHERE last_two_messages IS NOT NULL AND last_two_messages != ''").all() as Array<{ id: string; last_two_messages: string }>;
    stats.total = sessions.length;
    
    console.log(`Found ${stats.total} sessions with last_two_messages`);
    
    if (dryRun) {
      console.log('[DRY RUN] Would encrypt session messages...');
      sessions.forEach(session => {
        if (!isEncrypted(session.last_two_messages)) {
          stats.encrypted++;
        } else {
          stats.skipped++;
        }
      });
    } else {
      // Prepare update statement
      const updateStmt = db.prepare('UPDATE sessions SET last_two_messages = ? WHERE id = ?');
      
      // Process each session
      for (const session of sessions) {
        try {
          if (isEncrypted(session.last_two_messages)) {
            stats.skipped++;
            continue;
          }
          
          const encrypted = encrypt(session.last_two_messages, memoryKey);
          updateStmt.run(encrypted, session.id);
          stats.encrypted++;
        } catch (error) {
          const errorMsg = `Failed to encrypt session ${session.id}: ${error instanceof Error ? error.message : String(error)}`;
          stats.errors.push(errorMsg);
          console.error(`  ⚠️  ${errorMsg}`);
        }
      }
    }
    
    console.log(`Sessions: ${stats.encrypted} encrypted, ${stats.skipped} skipped, ${stats.errors.length} errors`);
  } catch (error) {
    const errorMsg = `Failed to process sessions: ${error instanceof Error ? error.message : String(error)}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
  
  return stats;
}

async function encryptVisualMemories(memoryKey: string, dryRun: boolean): Promise<{ encrypted: boolean; error?: string }> {
  try {
    if (!fs.existsSync(VISUAL_MEMORY_PATH)) {
      console.log('No visual_memories.json file found, skipping');
      return { encrypted: false };
    }
    
    const fileContent = await fs.promises.readFile(VISUAL_MEMORY_PATH, 'utf-8');
    
    // Check if already encrypted
    if (isEncrypted(fileContent)) {
      console.log('visual_memories.json is already encrypted, skipping');
      return { encrypted: false };
    }
    
    if (dryRun) {
      console.log('[DRY RUN] Would encrypt visual_memories.json');
      return { encrypted: true };
    }
    
    // Validate JSON before encrypting
    try {
      JSON.parse(fileContent);
    } catch {
      console.error('⚠️  visual_memories.json is not valid JSON, skipping');
      return { encrypted: false, error: 'Invalid JSON' };
    }
    
    // Create backup
    const backupPath = `${VISUAL_MEMORY_PATH}.backup-${Date.now()}`;
    await fs.promises.copyFile(VISUAL_MEMORY_PATH, backupPath);
    console.log(`Created backup: ${path.basename(backupPath)}`);
    
    // Encrypt and save
    const encrypted = encrypt(fileContent, memoryKey);
    await fs.promises.writeFile(VISUAL_MEMORY_PATH, encrypted, 'utf-8');
    console.log('visual_memories.json encrypted successfully');
    
    return { encrypted: true };
  } catch (error) {
    const errorMsg = `Failed to encrypt visual_memories.json: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ ${errorMsg}`);
    return { encrypted: false, error: errorMsg };
  }
}

async function runMigration() {
  console.log('=== Encryption Migration ===\n');
  
  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force');
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const dryRun = isDevelopment && !forceFlag;
  
  if (dryRun) {
    console.log('⚠️  Running in DRY RUN mode (development environment)');
    console.log('   No changes will be made to the database');
    console.log('   Use --force flag to apply changes in development\n');
  }
  
  // Validate MEMORY_KEY
  let memoryKey: string;
  try {
    memoryKey = getMemoryKey();
    console.log('✓ MEMORY_KEY found and validated\n');
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    console.error('\nPlease set MEMORY_KEY in your .env file:');
    console.error('  MEMORY_KEY=your-secure-key-here (min 32 characters)\n');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('Continuing in dry-run mode for development...\n');
      memoryKey = 'a'.repeat(32); // Dummy key for dry run
    }
  }
  
  const stats: MigrationStats = {
    messagesTotal: 0,
    messagesEncrypted: 0,
    messagesSkipped: 0,
    sessionsTotal: 0,
    sessionsEncrypted: 0,
    sessionsSkipped: 0,
    visualMemoryEncrypted: false,
    errors: []
  };
  
  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.log('No SQLite database found, skipping database migration');
  } else {
    console.log('Opening database:', DB_PATH, '\n');
    const db = new Database(DB_PATH);
    
    try {
      // Start transaction for atomicity
      if (!dryRun) {
        db.exec('BEGIN TRANSACTION');
      }
      
      // Encrypt messages
      console.log('--- Encrypting Messages ---');
      const messageStats = await encryptMessages(db, memoryKey, dryRun);
      stats.messagesTotal = messageStats.total;
      stats.messagesEncrypted = messageStats.encrypted;
      stats.messagesSkipped = messageStats.skipped;
      stats.errors.push(...messageStats.errors);
      console.log();
      
      // Encrypt sessions
      console.log('--- Encrypting Session Data ---');
      const sessionStats = await encryptSessions(db, memoryKey, dryRun);
      stats.sessionsTotal = sessionStats.total;
      stats.sessionsEncrypted = sessionStats.encrypted;
      stats.sessionsSkipped = sessionStats.skipped;
      stats.errors.push(...sessionStats.errors);
      console.log();
      
      // Commit transaction
      if (!dryRun) {
        db.exec('COMMIT');
      }
    } catch (error) {
      if (!dryRun) {
        db.exec('ROLLBACK');
      }
      console.error('❌ Migration failed, rolled back changes');
      throw error;
    } finally {
      db.close();
    }
  }
  
  // Encrypt visual memories
  console.log('--- Encrypting Visual Memories ---');
  const visualResult = await encryptVisualMemories(memoryKey, dryRun);
  stats.visualMemoryEncrypted = visualResult.encrypted;
  if (visualResult.error) {
    stats.errors.push(visualResult.error);
  }
  console.log();
  
  // Print summary
  console.log('=== Migration Summary ===');
  console.log(`Messages: ${stats.messagesEncrypted} encrypted, ${stats.messagesSkipped} already encrypted (${stats.messagesTotal} total)`);
  console.log(`Sessions: ${stats.sessionsEncrypted} encrypted, ${stats.sessionsSkipped} already encrypted (${stats.sessionsTotal} total)`);
  console.log(`Visual memories: ${stats.visualMemoryEncrypted ? 'encrypted' : 'not encrypted or already encrypted'}`);
  console.log(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Migration completed with errors:');
    stats.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  } else if (dryRun) {
    console.log('\n✓ Dry run completed successfully');
    console.log('  Run with --force to apply changes');
  } else {
    console.log('\n✓ Migration completed successfully');
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };
