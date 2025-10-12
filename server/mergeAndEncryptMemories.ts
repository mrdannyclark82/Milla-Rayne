#!/usr/bin/env tsx
/**
 * Merge and Encrypt Memories Script
 *
 * This script will:
 * 1. Merge all memories.txt backup files
 * 2. Deduplicate entries based on content
 * 3. Sort by timestamp
 * 4. Encrypt the merged memories
 * 5. Create a backup of the original
 *
 * Usage: npx tsx server/mergeAndEncryptMemories.ts [--force]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encrypt, getMemoryKey } from './crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_DIR = path.resolve(__dirname, '..', 'memory');
const MEMORIES_FILE = path.join(MEMORY_DIR, 'memories.txt');
const MERGED_FILE = path.join(MEMORY_DIR, 'merged_memories.txt');
const ENCRYPTED_FILE = path.join(MEMORY_DIR, 'memories_encrypted.txt');

interface MemoryEntry {
  timestamp: string;
  content: string;
  raw: string;
}

async function main() {
  const forceMode = process.argv.includes('--force');

  console.log('=== Memory Merge and Encryption Tool ===\n');

  if (!forceMode) {
    console.log('⚠️  Running in DRY RUN mode');
    console.log('   Use --force flag to apply changes\n');
  }

  // Verify MEMORY_KEY
  try {
    getMemoryKey();
    console.log('✓ MEMORY_KEY found and validated\n');
  } catch (error) {
    console.error('❌ MEMORY_KEY not set or invalid');
    console.error('Please set MEMORY_KEY in your .env file\n');
    process.exit(1);
  }

  // Find all memory files
  const memoryFiles = await findMemoryFiles();
  console.log(`Found ${memoryFiles.length} memory files to merge:\n`);

  // Parse and merge all memories
  const allMemories = await parseAllMemoryFiles(memoryFiles);
  console.log(`Parsed ${allMemories.length} total memory entries`);

  // Deduplicate
  const uniqueMemories = deduplicateMemories(allMemories);
  console.log(`After deduplication: ${uniqueMemories.length} unique entries`);

  // Sort by timestamp
  const sortedMemories = sortMemoriesByTimestamp(uniqueMemories);
  console.log('✓ Sorted memories by timestamp\n');

  if (forceMode) {
    // Create backup of original
    if (fs.existsSync(MEMORIES_FILE)) {
      const backupPath = `${MEMORIES_FILE}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      fs.copyFileSync(MEMORIES_FILE, backupPath);
      console.log(`✓ Created backup: ${path.basename(backupPath)}`);
    }

    // Write merged memories
    const mergedContent = sortedMemories.map((m) => m.raw).join('\n');
    fs.writeFileSync(MERGED_FILE, mergedContent);
    console.log(`✓ Created merged file: ${path.basename(MERGED_FILE)}`);

    // Encrypt the merged memories
    const memoryKey = getMemoryKey();
    const encryptedContent = encrypt(mergedContent, memoryKey);
    fs.writeFileSync(ENCRYPTED_FILE, encryptedContent);
    console.log(`✓ Created encrypted file: ${path.basename(ENCRYPTED_FILE)}`);

    // Replace original with merged content
    fs.writeFileSync(MEMORIES_FILE, mergedContent);
    console.log(
      `✓ Updated ${path.basename(MEMORIES_FILE)} with merged content`
    );

    console.log('\n=== Encryption Complete ===');
    console.log(`Total memories: ${sortedMemories.length}`);
    console.log(`Merged file: ${MERGED_FILE}`);
    console.log(`Encrypted file: ${ENCRYPTED_FILE}`);
  } else {
    console.log('\n=== Dry Run Summary ===');
    console.log(
      `Would merge ${allMemories.length} entries into ${uniqueMemories.length} unique memories`
    );
    console.log(`Would create: merged_memories.txt`);
    console.log(`Would create: memories_encrypted.txt`);
    console.log(`Would update: memories.txt`);
    console.log('\nRun with --force to apply changes');
  }
}

async function findMemoryFiles(): Promise<string[]> {
  const files = fs.readdirSync(MEMORY_DIR);
  const memoryFiles = files
    .filter(
      (file) =>
        file === 'memories.txt' ||
        file.startsWith('memories.txt.backup') ||
        file.startsWith('memories_backup_') ||
        file === 'memories (copy).txt'
    )
    .map((file) => path.join(MEMORY_DIR, file));

  return memoryFiles.sort();
}

async function parseAllMemoryFiles(files: string[]): Promise<MemoryEntry[]> {
  const allMemories: MemoryEntry[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const entries = parseMemoryContent(content);
      console.log(`  ${path.basename(file)}: ${entries.length} entries`);
      allMemories.push(...entries);
    } catch (error) {
      console.error(`  ❌ Error reading ${path.basename(file)}: ${error}`);
    }
  }

  return allMemories;
}

function parseMemoryContent(content: string): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to extract timestamp from various formats
    let timestamp = '';
    let memoryContent = trimmed;

    // Format: [2024-01-01 12:00:00] Memory content
    const timestampMatch = trimmed.match(
      /^\[(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\d]*Z?)\]\s*(.+)$/
    );
    if (timestampMatch) {
      timestamp = timestampMatch[1];
      memoryContent = timestampMatch[2];
    } else {
      // Try other common timestamp formats
      const altMatch = trimmed.match(
        /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\d]*Z?)\s*[:-]\s*(.+)$/
      );
      if (altMatch) {
        timestamp = altMatch[1];
        memoryContent = altMatch[2];
      }
    }

    entries.push({
      timestamp,
      content: memoryContent,
      raw: trimmed,
    });
  }

  return entries;
}

function deduplicateMemories(memories: MemoryEntry[]): MemoryEntry[] {
  const seen = new Set<string>();
  const unique: MemoryEntry[] = [];

  for (const memory of memories) {
    // Create a normalized version for deduplication
    const normalized = memory.content.toLowerCase().replace(/\s+/g, ' ').trim();

    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(memory);
    }
  }

  return unique;
}

function sortMemoriesByTimestamp(memories: MemoryEntry[]): MemoryEntry[] {
  return memories.sort((a, b) => {
    // Entries without timestamps go to the end
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;

    // Parse timestamps for comparison
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);

    // Invalid dates go to the end
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateA.getTime() - dateB.getTime();
  });
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
