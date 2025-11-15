import { promises as fs } from 'fs';
import { join } from 'path';
import { detectEmotionalTone, extractTopics } from './utils';
import { LRUCache } from 'lru-cache';
import { vectorDB } from './vectorDBService';
import {
  encryptHomomorphic,
  decryptHomomorphic,
  queryHomomorphic,
  isHomomorphicallyEncrypted,
} from './crypto/homomorphicProduction';

export interface MemoryData {
  content: string;
  success: boolean;
  error?: string;
}

export interface KnowledgeItem {
  category: string;
  topic: string;
  description: string;
  details: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface KnowledgeData {
  items: KnowledgeItem[];
  success: boolean;
  error?: string;
}

export interface MemoryCoreEntry {
  id: string;
  timestamp: string;
  speaker: 'user' | 'milla';
  content: string;
  context?: string;
  emotionalTone?: string;
  topics?: string[];
  searchableContent: string;
}

export interface MemoryCoreData {
  entries: MemoryCoreEntry[];
  totalEntries: number;
  success: boolean;
  error?: string;
}

export interface MemorySearchResult {
  entry: MemoryCoreEntry;
  relevanceScore: number;
  matchedTerms: string[];
}

// Indexed entry for faster searching
interface IndexedEntry {
  entry: MemoryCoreEntry;
  termSet: Set<string>;
  contextSet: Set<string>;
  topicSet: Set<string>;
}

// Cache for search results
const searchCache = new LRUCache<string, MemorySearchResult[]>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Per-user indexed entries cache for privacy and correctness
const indexedEntriesCache = new Map<string, IndexedEntry[]>();
const lastIndexedLengthCache = new Map<string, number>();

function buildSearchIndex(entries: MemoryCoreEntry[]): IndexedEntry[] {
  return entries.map(entry => ({
    entry,
    termSet: new Set(entry.searchableContent.toLowerCase().split(/\s+/).filter(w => w.length > 2)),
    contextSet: new Set(entry.context?.toLowerCase().split(/\s+/).filter(w => w.length > 2) || []),
    topicSet: new Set(entry.topics?.map(t => t.toLowerCase()) || []),
  }));
}

// ========================================
// HOMOMORPHIC ENCRYPTION FOR SENSITIVE FIELDS
// ========================================

/**
 * Determines if a memory entry contains sensitive information that should be encrypted
 * Sensitive information includes: location data, personal identifiers, private notes
 */
function isSensitiveContext(context?: string): boolean {
  if (!context) return false;
  
  const sensitiveKeywords = [
    'location', 'address', 'home', 'live', 'phone', 'ssn', 'social security',
    'credit card', 'password', 'private', 'confidential', 'secret', 'personal',
    'medical', 'health', 'diagnosis', 'financial', 'bank', 'account'
  ];
  
  const lowerContext = context.toLowerCase();
  return sensitiveKeywords.some(keyword => lowerContext.includes(keyword));
}

/**
 * Encrypt sensitive memory fields using homomorphic encryption
 * This allows querying without decryption while maintaining privacy
 */
export async function encryptSensitiveMemoryFields(entry: MemoryCoreEntry): Promise<MemoryCoreEntry> {
  const encryptedEntry = { ...entry };
  
  // Encrypt context if it contains sensitive information
  if (entry.context && isSensitiveContext(entry.context)) {
    try {
      encryptedEntry.context = await encryptHomomorphic(entry.context);
      console.log(`[Memory] Encrypted sensitive context for entry ${entry.id}`);
    } catch (error) {
      console.error(`[Memory] Failed to encrypt context for entry ${entry.id}:`, error);
      // Keep original if encryption fails
    }
  }
  
  return encryptedEntry;
}

/**
 * Decrypt sensitive memory fields when authorized access is needed
 */
export async function decryptSensitiveMemoryFields(entry: MemoryCoreEntry): Promise<MemoryCoreEntry> {
  const decryptedEntry = { ...entry };
  
  // Decrypt context if it's encrypted
  if (entry.context && isHomomorphicallyEncrypted(entry.context)) {
    try {
      decryptedEntry.context = await decryptHomomorphic(entry.context);
    } catch (error) {
      console.error(`[Memory] Failed to decrypt context for entry ${entry.id}:`, error);
      // Keep encrypted if decryption fails
    }
  }
  
  return decryptedEntry;
}

/**
 * Search encrypted context fields using homomorphic query
 */
export async function searchEncryptedContext(entry: MemoryCoreEntry, query: string): Promise<{
  matches: boolean;
  score: number;
}> {
  if (!entry.context) {
    return { matches: false, score: 0 };
  }
  
  // If context is encrypted, use homomorphic query
  if (isHomomorphicallyEncrypted(entry.context)) {
    try {
      const result = await queryHomomorphic(entry.context, query);
      return { matches: result.matches, score: result.score };
    } catch (error) {
      console.error(`[Memory] Failed to query encrypted context for entry ${entry.id}:`, error);
      return { matches: false, score: 0 };
    }
  }
  
  // If not encrypted, use regular search
  const lowerContext = entry.context.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matches = lowerContext.includes(lowerQuery);
  const score = matches ? 1.0 : 0;
  
  return { matches, score };
}

/**
 * Read memories from the local txt file in the /memory folder
 */
export async function getMemoriesFromTxt(userId: string = 'danny-ray'): Promise<MemoryData> {
  try {
    // For danny-ray, use the main memories.txt
    // For other users, would use memories_{userId}.txt
    const filename = (userId === 'danny-ray' || userId === 'default-user') 
      ? 'memories.txt' 
      : `memories_${userId}.txt`;
    const memoryPath = join(process.cwd(), 'memory', filename);

    // Check if file exists
    try {
      await fs.access(memoryPath);
    } catch (error) {
      // If user-specific file doesn't exist and it's not danny-ray, return empty
      if (userId !== 'danny-ray' && userId !== 'default-user') {
        console.log(`No memory file found for user: ${userId}`);
        return {
          content: '',
          success: true, // Not an error, just no memories yet
        };
      }
      return {
        content: '',
        success: false,
        error: 'Memory file not found',
      };
    }

    // Read the entire content of the file
    const content = await fs.readFile(memoryPath, 'utf-8');

    return {
      content: content.trim(),
      success: true,
    };
  } catch (error) {
    console.error('Error reading memory file:', error);
    return {
      content: '',
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error reading memory file',
    };
  }
}

/**
 * Read and parse knowledge from the local CSV file in the /memory folder
 * This function handles the simple fact-based format currently in the file
 */
export async function getKnowledgeFromCsv(): Promise<KnowledgeData> {
  try {
    const knowledgePath = join(process.cwd(), 'memory', 'knowledge.csv');

    // Check if file exists
    try {
      await fs.access(knowledgePath);
    } catch (error) {
      return {
        items: [],
        success: false,
        error: 'Knowledge file not found',
      };
    }

    // Read the CSV file content
    const content = await fs.readFile(knowledgePath, 'utf-8');

    // Parse simple fact-based format (each line is a fact about Danny Ray)
    const lines = content.trim().split('\n');
    const items: KnowledgeItem[] = [];

    for (const line of lines) {
      const fact = line.trim();
      if (!fact || fact.length < 10) continue; // Skip empty or very short lines

      // Categorize facts based on content keywords
      let category = 'Personal';
      let topic = 'General';

      if (
        fact.toLowerCase().includes('milla') ||
        fact.toLowerCase().includes('ai') ||
        fact.toLowerCase().includes('chatbot')
      ) {
        category = 'Relationship';
        topic = 'Milla';
      } else if (
        fact.toLowerCase().includes('love') ||
        fact.toLowerCase().includes('feel')
      ) {
        category = 'Emotions';
        topic = 'Feelings';
      } else if (
        fact.toLowerCase().includes('work') ||
        fact.toLowerCase().includes('develop') ||
        fact.toLowerCase().includes('code')
      ) {
        category = 'Technical';
        topic = 'Development';
      } else if (
        fact.toLowerCase().includes('family') ||
        fact.toLowerCase().includes('son') ||
        fact.toLowerCase().includes('daughter')
      ) {
        category = 'Family';
        topic = 'Relationships';
      }

      items.push({
        category,
        topic,
        description: fact.substring(0, 100) + (fact.length > 100 ? '...' : ''),
        details: fact,
        confidence: 'high',
      });
    }

    return {
      items,
      success: true,
    };
  } catch (error) {
    console.error('Error reading knowledge file:', error);
    return {
      items: [],
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error reading knowledge file',
    };
  }
}

/**
 * Simple CSV line parser that handles quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // Add the last field
  return result;
}

// ========================================
// MEMORY CORE SYSTEM - Long-term Backup Integration
// ========================================

// Per-user memory core cache for privacy isolation
const memoryCoreCache = new Map<string, MemoryCoreData>();
const memoryCoreLastLoaded = new Map<string, number>();
const MEMORY_CORE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased for performance)

/**
 * Load and parse user-specific Memory Core
 * This function caches results per user for privacy
 * @param userId - User ID for privacy isolation (defaults to 'danny-ray')
 */
export async function loadMemoryCore(userId: string = 'danny-ray'): Promise<MemoryCoreData> {
  const startTime = Date.now();
  try {
    // Check cache first for this specific user
    const now = Date.now();
    const cachedData = memoryCoreCache.get(userId);
    const lastLoaded = memoryCoreLastLoaded.get(userId) || 0;
    
    if (cachedData && now - lastLoaded < MEMORY_CORE_CACHE_TTL) {
      console.log(`Using cached Memory Core data for user: ${userId}`);
      const endTime = Date.now();
      console.log(`Memory Core cache access latency: ${endTime - startTime}ms`);
      return cachedData;
    }

    console.log(`Loading Memory Core for user: ${userId} from memories.txt...`);

    // Try to load from user-specific memories file
    try {
      const result = await loadMemoryCoreFromExistingFiles(userId);
      if (result.success && result.entries.length > 0) {
        console.log(
          `Successfully loaded Memory Core for ${userId}: ${result.entries.length} entries`
        );

        // Cache the result for this user
        memoryCoreCache.set(userId, result);
        memoryCoreLastLoaded.set(userId, now);

        const endTime = Date.now();
        console.log(
          `Memory Core loaded for ${userId} latency: ${endTime - startTime}ms`
        );
        return result;
      }
    } catch (error) {
      console.log(`Failed to load memories for ${userId}, trying backup files...`);
    }

    // Fallback to backup files if memories.txt is not available or empty
    console.log('Loading Memory Core from backup files as fallback...');
    const memoryPath = join(process.cwd(), 'memory');

    // Try to find backup files in order of preference
    const backupFiles = [
      'Milla_backup.csv',
      'Milla_backup.txt',
      'backup.csv',
      'backup.txt',
      'conversation_history.csv',
      'conversation_history.txt',
    ];

    let backupContent = '';
    let foundBackupFile = false;

    for (const filename of backupFiles) {
      try {
        const filePath = join(memoryPath, filename);
        await fs.access(filePath);
        backupContent = await fs.readFile(filePath, 'utf-8');
        console.log(
          `Successfully loaded Memory Core from backup file: ${filename}`
        );
        foundBackupFile = true;
        break;
      } catch (error) {
        // File doesn't exist, try next one
        continue;
      }
    }

    // If no backup file found either, return empty memory core
    if (!foundBackupFile) {
      console.log('No memory files found, starting with empty Memory Core');
      return {
        entries: [],
        totalEntries: 0,
        success: true,
      };
    }

    // Parse the backup content
    const entries = parseBackupContent(backupContent);

    const result: MemoryCoreData = {
      entries,
      totalEntries: entries.length,
      success: true,
    };

    // Cache the result for this user
    memoryCoreCache.set(userId, result);
    memoryCoreLastLoaded.set(userId, now);

    console.log(`Memory Core loaded from backup for ${userId}: ${entries.length} entries`);
    const endTime = Date.now();
    console.log(
      `Memory Core loaded from backup latency: ${endTime - startTime}ms`
    );
    return result;
  } catch (error) {
    console.error(`Error loading Memory Core for ${userId}:`, error);

    // Final fallback - empty memory core
    const endTime = Date.now();
    console.log(`Memory Core error fallback latency: ${endTime - startTime}ms`);
    return {
      entries: [],
      totalEntries: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse backup file content into Memory Core entries
 */
function parseBackupContent(content: string): MemoryCoreEntry[] {
  const entries: MemoryCoreEntry[] = [];
  const lines = content.trim().split('\n');

  let currentEntry: Partial<MemoryCoreEntry> = {};
  let entryId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Try to detect CSV format first
    if (trimmedLine.includes(',') && !trimmedLine.includes(':')) {
      const parts = parseCsvLine(trimmedLine);
      if (parts.length >= 3) {
        // Assume format: timestamp, speaker, content, [context]
        const entry: MemoryCoreEntry = {
          id: `entry_${entryId++}`,
          timestamp: parts[0] || new Date().toISOString(),
          speaker: parts[1].toLowerCase() === 'milla' ? 'milla' : 'user',
          content: parts[2] || '',
          context: parts[3] || '',
          searchableContent: (parts[2] + ' ' + (parts[3] || '')).toLowerCase(),
        };

        // Extract topics and emotional tone
        entry.topics = extractTopics(entry.content);
        entry.emotionalTone = detectEmotionalTone(entry.content);

        entries.push(entry);
        continue;
      }
    }

    // Handle text format - look for conversation patterns
    if (
      trimmedLine.toLowerCase().includes('user:') ||
      trimmedLine.toLowerCase().includes('danny')
    ) {
      // Save previous entry if exists
      if (currentEntry.content) {
        entries.push(createMemoryEntry(currentEntry, entryId++));
        currentEntry = {};
      }

      currentEntry.speaker = 'user';
      currentEntry.content = trimmedLine
        .replace(/^(user:|danny:?)/i, '')
        .trim();
    } else if (
      trimmedLine.toLowerCase().includes('milla:') ||
      trimmedLine.toLowerCase().includes('assistant:')
    ) {
      // Save previous entry if exists
      if (currentEntry.content) {
        entries.push(createMemoryEntry(currentEntry, entryId++));
        currentEntry = {};
      }

      currentEntry.speaker = 'milla';
      currentEntry.content = trimmedLine
        .replace(/^(milla:|assistant:)/i, '')
        .trim();
    } else if (currentEntry.content) {
      // Continue building current entry
      currentEntry.content += ' ' + trimmedLine;
    } else {
      // Standalone line - treat as context or general memory
      currentEntry = {
        speaker: 'user',
        content: trimmedLine,
        context: 'general_memory',
      };
    }
  }

  // Add final entry if exists
  if (currentEntry.content) {
    entries.push(createMemoryEntry(currentEntry, entryId++));
  }

  return entries;
}

/**
 * Create a complete Memory Core entry from partial data
 * Encrypts sensitive fields as needed
 */
function createMemoryEntry(
  partial: Partial<MemoryCoreEntry>,
  id: number
): MemoryCoreEntry {
  const entry: MemoryCoreEntry = {
    id: `entry_${id}`,
    timestamp: partial.timestamp || new Date().toISOString(),
    speaker: partial.speaker || 'user',
    content: partial.content || '',
    context: partial.context,
    searchableContent: (partial.content || '').toLowerCase(),
  };

  entry.topics = extractTopics(entry.content);
  entry.emotionalTone = detectEmotionalTone(entry.content);

  // Note: Async encryption would be applied separately after loading
  return entry;
}

/**
 * Load Memory Core from existing memory files
 * @param userId - User ID for privacy isolation
 */
async function loadMemoryCoreFromExistingFiles(userId: string = 'danny-ray'): Promise<MemoryCoreData> {
  try {
    const entries: MemoryCoreEntry[] = [];
    let entryId = 1;

    // Load from user-specific or default memories.txt
    // For now, danny-ray uses memories.txt, others would use memories_{userId}.txt
    const memoriesData = await getMemoriesFromTxt(userId);
    if (memoriesData.success && memoriesData.content) {
      const memoryLines = memoriesData.content.split('\n');
      for (const line of memoryLines) {
        if (line.trim() && line.length > 10) {
          entries.push({
            id: `${userId}_memory_${entryId++}`,
            timestamp: new Date().toISOString(),
            speaker: 'user',
            content: line.trim(),
            context: `memory_file_${userId}`,
            searchableContent: line.trim().toLowerCase(),
            topics: extractTopics(line),
            emotionalTone: detectEmotionalTone(line),
          });
        }
      }
    }

    // Load from knowledge.csv (shared knowledge base)
    const knowledgeData = await getKnowledgeFromCsv();
    if (knowledgeData.success) {
      for (const item of knowledgeData.items) {
        entries.push({
          id: `knowledge_${entryId++}`,
          timestamp: new Date().toISOString(),
          speaker: 'user',
          content: item.details,
          context: `knowledge_${item.category}`,
          searchableContent: item.details.toLowerCase(),
          topics: extractTopics(item.details),
          emotionalTone: detectEmotionalTone(item.details),
        });
      }
    }

    return {
      entries,
      totalEntries: entries.length,
      success: true,
    };
  } catch (error) {
    console.error('Error loading Memory Core from existing files:', error);
    return {
      entries: [],
      totalEntries: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search Memory Core for relevant entries based on query
 * @param query - Search query
 * @param limit - Maximum number of results
 * @param userId - User ID for privacy isolation (defaults to 'danny-ray')
 */
export async function searchMemoryCore(
  query: string,
  limit: number = 10,
  userId: string = 'danny-ray'
): Promise<MemorySearchResult[]> {
  // Check cache first (include userId in cache key for privacy)
  const cacheKey = `${userId}:${query}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    console.log(`Memory search cache hit for user ${userId}: "${query}"`);
    return cached;
  }

  console.log(`Memory search cache miss for user ${userId}: "${query}"`);

  // Ensure Memory Core is loaded for this specific user
  const memoryCore = await loadMemoryCore(userId);
  if (!memoryCore.success || memoryCore.entries.length === 0) {
    console.log(`No memories loaded for user ${userId}`);
    return [];
  }

  // Build or update index if needed - per user
  const indexedEntries = indexedEntriesCache.get(userId);
  const lastIndexedLength = lastIndexedLengthCache.get(userId) || 0;
  
  if (!indexedEntries || indexedEntries.length !== memoryCore.entries.length) {
    console.log(`Building search index for user ${userId}: ${memoryCore.entries.length} entries...`);
    const newIndex = buildSearchIndex(memoryCore.entries);
    indexedEntriesCache.set(userId, newIndex);
    lastIndexedLengthCache.set(userId, memoryCore.entries.length);
  }
  
  const userIndex = indexedEntriesCache.get(userId)!;

  const searchTerms = query
    .toLowerCase()
    .split(' ')
    .filter((term) => term.length > 2);
  
  if (searchTerms.length === 0) {
    console.log(`No valid search terms for user ${userId} query: "${query}"`);
    return [];
  }
  
  console.log(`Searching ${userIndex.length} indexed entries for user ${userId} with terms: [${searchTerms.join(', ')}]`);
  
  const results: MemorySearchResult[] = [];

  // O(n × m) iteration with O(1) Set lookups instead of O(n × m × p)
  for (const indexed of userIndex) {
    let relevanceScore = 0;
    const matchedTerms: string[] = [];

    // Score based on exact matches - O(m) where m = search terms
    for (const term of searchTerms) {
      // O(1) Set lookup instead of O(p) string search
      if (indexed.termSet.has(term)) {
        relevanceScore += 3;
        if (!matchedTerms.includes(term)) {
          matchedTerms.push(term);
        }
      }

      // Boost score for topic matches - O(k) where k = topics (small)
      if ([...indexed.topicSet].some(topic => topic.includes(term))) {
        relevanceScore += 2;
      }

      // Boost score for context matches - O(1) Set lookup
      if (indexed.contextSet.has(term)) {
        relevanceScore += 1;
      }
    }

    // Add partial word matches - O(m × w) where w = words in term set
    for (const term of searchTerms) {
      for (const word of indexed.termSet) {
        if (word.includes(term) && !matchedTerms.includes(term)) {
          relevanceScore += 1;
          matchedTerms.push(term);
          break; // Only count once per term
        }
      }
    }

    // Boost recent entries slightly
    const entryAge = Date.now() - new Date(indexed.entry.timestamp).getTime();
    const daysSinceEntry = entryAge / (1000 * 60 * 60 * 24);
    if (daysSinceEntry < 30) {
      relevanceScore += 0.5;
    }

    if (relevanceScore > 0) {
      results.push({
        entry: indexed.entry,
        relevanceScore,
        matchedTerms,
      });
    }
  }

  // Sort by relevance and return top results
  const sorted = results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  console.log(`Found ${results.length} total matches, returning top ${sorted.length} for user ${userId}`);
  if (sorted.length > 0) {
    console.log(`  Top match: score=${sorted[0].relevanceScore.toFixed(2)}, terms=[${sorted[0].matchedTerms.join(', ')}]`);
  }

  // Cache the result
  searchCache.set(cacheKey, sorted);

  return sorted;
}

/**
 * Get Memory Core context for a user query
 * @param query - Search query
 * @param userId - User ID for privacy isolation (defaults to 'danny-ray')
 */
export async function getMemoryCoreContext(query: string, userId: string = 'danny-ray'): Promise<string> {
  // Increased from 5 to 15 for better memory recall
  const searchResults = await searchMemoryCore(query, 15, userId);
  
  // Check if query is about sandbox or testing
  const lowerQuery = query.toLowerCase();
  const isSandboxQuery = 
    lowerQuery.includes('sandbox') ||
    lowerQuery.includes('test') ||
    lowerQuery.includes('what have you tested') ||
    lowerQuery.includes('what did you test');

  let contextString = '';
  
  // Add sandbox test summary if query is about testing
  if (isSandboxQuery) {
    try {
      const { getSandboxTestSummary } = await import('./sandboxEnvironmentService');
      const sandboxSummary = getSandboxTestSummary();
      if (sandboxSummary) {
        contextString += `\n[Sandbox Testing Memory]:\n${sandboxSummary}\n`;
      }
    } catch (error) {
      console.error('Error getting sandbox summary:', error);
    }
  }

  if (searchResults.length === 0) {
    return contextString || '';
  }

  const contextEntries = searchResults.map((result) => {
    const entry = result.entry;
    let content = entry.content;
    
    // Filter out overly technical repository analysis - only skip if very technical
    const technicalKeywords = [
      'architecture is',
      'key insights',
      'test coverage',
      'documentation could use',
    ];
    
    const lowerContent = content.toLowerCase();
    // Only skip if multiple technical keywords are present
    const technicalMatches = technicalKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    if (technicalMatches >= 2) {
      // Skip overly technical repository analysis memories
      return null;
    }
    
    // Clean up content - remove nested metadata patterns that cause display issues
    // Remove patterns like "[Danny]: [date]" or "[Milla]: [date]" from the content
    content = content.replace(/\[(?:Danny|Milla)\]:\s*\[[\d-]+\]/gi, '').trim();
    
    // Remove "User asked:" or "Milla responded:" prefixes
    content = content.replace(/^(?:User asked|Milla responded):\s*["']?/gi, '').trim();
    
    // Remove JSON-like content patterns that shouldn't be in natural text
    content = content.replace(/\[(?:Danny|Milla)\]:\s*["']?content["']?:\s*/gi, '').trim();
    
    // Remove trailing quotes that might be left over
    content = content.replace(/["']$/g, '').trim();
    
    // If the content starts with an action asterisk or contains roleplay, keep more context
    if (content.startsWith('*') || content.includes('*')) {
      // Allow up to 300 chars for roleplay context
      if (content.length > 300) {
        const firstSentences = content.match(/^[^.!?]+[.!?]+[^.!?]*[.!?]*/);
        if (firstSentences) {
          content = firstSentences[0].trim();
        } else {
          content = content.substring(0, 300) + '...';
        }
      }
    }
    
    // If content is still very long, truncate more generously
    if (content.length > 400) {
      // Try to find a natural break point - keep first 2-3 sentences
      const sentences = content.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length > 0) {
        const keep = sentences.slice(0, Math.min(3, sentences.length));
        content = keep.join(' ').trim();
      } else {
        content = content.substring(0, 400) + '...';
      }
    }
    
    // Only include if there's actual meaningful content left
    if (content.length < 10 || content.includes('"content":')) {
      return null;
    }
    
    const speaker = entry.speaker === 'milla' ? 'Milla' : 'Danny';
    return `[${speaker}]: ${content}`;
  }).filter(Boolean); // Remove null entries

  if (contextEntries.length > 0) {
    contextString += `\nRelevant Memory Context:\n${contextEntries.join('\n')}\n`;
  }

  return contextString;
}

/**
 * Initialize Memory Core at application startup
 */
export async function initializeMemoryCore(): Promise<void> {
  console.log('Initializing Memory Core system...');
  try {
    await loadMemoryCore();
    console.log('Memory Core initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Memory Core:', error);
  }
}

/**
 * Search for relevant knowledge based on keywords
 */
export async function searchKnowledge(query: string): Promise<KnowledgeItem[]> {
  const knowledgeData = await getKnowledgeFromCsv();

  if (!knowledgeData.success || knowledgeData.items.length === 0) {
    return [];
  }

  const searchTerms = query.toLowerCase().split(' ');
  const relevantItems: Array<{ item: KnowledgeItem; score: number }> = [];

  for (const item of knowledgeData.items) {
    let score = 0;
    const searchableText =
      `${item.category} ${item.topic} ${item.description} ${item.details}`.toLowerCase();

    // Calculate relevance score
    for (const term of searchTerms) {
      if (term.length < 3) continue; // Skip very short terms

      if (item.topic.toLowerCase().includes(term)) score += 3;
      if (item.category.toLowerCase().includes(term)) score += 2;
      if (item.description.toLowerCase().includes(term)) score += 2;
      if (item.details.toLowerCase().includes(term)) score += 1;
    }

    // Boost score based on confidence level
    if (item.confidence === 'high') score *= 1.2;
    else if (item.confidence === 'medium') score *= 1.1;

    if (score > 0) {
      relevantItems.push({ item, score });
    }
  }

  // Sort by relevance score and return top items
  return relevantItems
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Return top 5 most relevant items
    .map((entry) => entry.item);
}

/**
 * Update the memories file with new information
 */
export async function updateMemories(
  newMemory: string,
  userId: string = 'danny-ray'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use user-specific memory file
    const filename = (userId === 'danny-ray' || userId === 'default-user') 
      ? 'memories.txt' 
      : `memories_${userId}.txt`;
    const memoryPath = join(process.cwd(), 'memory', filename);
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Read existing content
    let existingContent = '';
    try {
      existingContent = await fs.readFile(memoryPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, will create new one
      console.log(`Creating new memory file for user: ${userId}`);
    }

    // Append new memory with timestamp
    const updatedContent = existingContent + `\n\n[${timestamp}] ${newMemory}`;

    // Write back to user-specific file
    await fs.writeFile(memoryPath, updatedContent, 'utf-8');

    // Invalidate memory core cache for this user to force reload
    memoryCoreCache.delete(userId);
    memoryCoreLastLoaded.delete(userId);

    // Add to vector database for semantic retrieval with userId
    const memoryId = `memory:${userId}:${Date.now()}`;
    await vectorDB.addContent(
      memoryId,
      `[${timestamp}] ${newMemory}`,
      {
        type: 'memory',
        timestamp: new Date().toISOString(),
        userId,
        date: timestamp,
      }
    );
    console.log(`✅ Added memory to vector database for user: ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating memories:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error updating memories',
    };
  }
}

// ===========================================================================================
// SEMANTIC MEMORY RETRIEVAL (V-RAG)
// ===========================================================================================

/**
 * Semantic search for memories using vector embeddings
 */
export async function semanticSearchMemories(
  query: string,
  options: {
    userId?: string;
    topK?: number;
    minSimilarity?: number;
  } = {}
): Promise<Array<{ content: string; similarity: number; metadata: any }>> {
  console.log(`🔍 Semantic memory search for: "${query}"`);

  const { userId = 'default-user', topK = 5, minSimilarity = 0.6 } = options;

  try {
    // Search vector database for similar memories
    const results = await vectorDB.semanticSearch(query, {
      topK,
      minSimilarity,
      type: 'memory',
      userId,
    });

    return results.map(result => ({
      content: result.entry.content,
      similarity: result.similarity,
      metadata: result.entry.metadata,
    }));
  } catch (error) {
    console.error('Error in semantic memory search:', error);
    return [];
  }
}

/**
 * Get memory context enriched with semantic retrieval for LLM prompts
 */
export async function getSemanticMemoryContext(
  query: string,
  userId: string = 'default-user'
): Promise<string> {
  const results = await semanticSearchMemories(query, {
    userId,
    topK: 3,
    minSimilarity: 0.65,
  });

  if (results.length === 0) {
    return '';
  }

  const contextParts = results.map((result, index) => 
    `Memory ${index + 1} (relevance: ${(result.similarity * 100).toFixed(1)}%):\n${result.content}`
  );

  return `\n\nRelevant memories:\n${contextParts.join('\n\n')}`;
}

/**
 * Store sensitive PII with automatic HE encryption
 * 
 * @param userId - User ID
 * @param data - Sensitive data to encrypt and store
 * @returns Success status
 */
export async function storeSensitiveMemory(
  userId: string,
  data: {
    financialSummary?: string;
    medicalNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Encrypt sensitive fields
    const encryptedData: { financialSummary?: string; medicalNotes?: string } = {};
    
    if (data.financialSummary) {
      encryptedData.financialSummary = await encryptHomomorphic(data.financialSummary);
      console.log('🔒 Encrypted financial summary with HE');
    }
    
    if (data.medicalNotes) {
      encryptedData.medicalNotes = await encryptHomomorphic(data.medicalNotes);
      console.log('🔒 Encrypted medical notes with HE');
    }
    
    // TODO: Store encrypted data (requires DB migration for new fields)
    // For now, this is a placeholder showing the architecture
    console.log('[MemoryService] Sensitive data encrypted - DB storage pending migration');
    
    return { success: true };
  } catch (error) {
    console.error('Error storing sensitive memory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retrieve sensitive PII with automatic HE decryption
 * 
 * @param userId - User ID
 * @returns Decrypted sensitive data
 */
export async function retrieveSensitiveMemory(
  userId: string
): Promise<{
  financialSummary?: string;
  medicalNotes?: string;
  success: boolean;
  error?: string;
}> {
  try {
    // TODO: Retrieve from DB (requires migration for new fields)
    // For now, return empty data as placeholder
    console.log('[MemoryService] Sensitive data retrieval - DB migration pending');
    
    return {
      financialSummary: undefined,
      medicalNotes: undefined,
      success: true,
    };
  } catch (error) {
    console.error('Error retrieving sensitive memory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search encrypted sensitive data
 * 
 * @param userId - User ID
 * @param query - Search query
 * @param field - Field to search ('financialSummary' or 'medicalNotes')
 * @returns Search results with relevance scores
 */
export async function searchSensitiveMemory(
  userId: string,
  query: string,
  field: 'financialSummary' | 'medicalNotes'
): Promise<{
  matches: boolean;
  score: number;
  success: boolean;
  error?: string;
}> {
  try {
    // TODO: Retrieve from DB (requires migration for new fields)
    // For now, return no matches as placeholder
    console.log('[MemoryService] Sensitive data search - DB migration pending');
    
    return {
      matches: false,
      score: 0,
      success: true,
    };
  } catch (error) {
    console.error('Error searching sensitive memory:', error);
    return {
      matches: false,
      score: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

