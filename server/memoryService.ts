import { promises as fs } from 'fs';
import { join } from 'path';

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

/**
 * Read memories from the local txt file in the /memory folder
 */
export async function getMemoriesFromTxt(): Promise<MemoryData> {
  try {
    const memoryPath = join(process.cwd(), 'memory', 'memories.txt');
    
    // Check if file exists
    try {
      await fs.access(memoryPath);
    } catch (error) {
      return {
        content: '',
        success: false,
        error: 'Memory file not found'
      };
    }

    // Read the entire content of the file
    const content = await fs.readFile(memoryPath, 'utf-8');
    
    return {
      content: content.trim(),
      success: true
    };

  } catch (error) {
    console.error('Error reading memory file:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reading memory file'
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
        error: 'Knowledge file not found'
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
      
      if (fact.toLowerCase().includes('milla') || fact.toLowerCase().includes('ai') || fact.toLowerCase().includes('chatbot')) {
        category = 'Relationship';
        topic = 'Milla';
      } else if (fact.toLowerCase().includes('love') || fact.toLowerCase().includes('feel')) {
        category = 'Emotions'; 
        topic = 'Feelings';
      } else if (fact.toLowerCase().includes('work') || fact.toLowerCase().includes('develop') || fact.toLowerCase().includes('code')) {
        category = 'Technical';
        topic = 'Development';
      } else if (fact.toLowerCase().includes('family') || fact.toLowerCase().includes('son') || fact.toLowerCase().includes('daughter')) {
        category = 'Family';
        topic = 'Relationships';
      }
      
      items.push({
        category,
        topic,
        description: fact.substring(0, 100) + (fact.length > 100 ? '...' : ''),
        details: fact,
        confidence: 'high'
      });
    }

    return {
      items,
      success: true
    };

  } catch (error) {
    console.error('Error reading knowledge file:', error);
    return {
      items: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reading knowledge file'
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

// Global memory core cache
let memoryCoreCache: MemoryCoreData | null = null;
let memoryCoreLastLoaded: number = 0;
const MEMORY_CORE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased for performance)

/**
 * Load and parse the entire Milla backup file into a searchable Memory Core
 * This function runs at application startup and caches results
 */
export async function loadMemoryCore(): Promise<MemoryCoreData> {
  const startTime = Date.now();
  try {
    // Check cache first
    const now = Date.now();
    if (memoryCoreCache && (now - memoryCoreLastLoaded) < MEMORY_CORE_CACHE_TTL) {
      console.log('Using cached Memory Core data');
      const endTime = Date.now();
      console.log(`Memory Core cache access latency: ${endTime - startTime}ms`);
      return memoryCoreCache;
    }

  console.log('Loading Memory Core from memories.txt as primary source...');
    
    // Try to load from memories.txt first (primary source)
    try {
      const result = await loadMemoryCoreFromExistingFiles();
      if (result.success && result.entries.length > 0) {
        console.log(`Successfully loaded Memory Core from memories.txt: ${result.entries.length} entries`);
        
        // Cache the result
        memoryCoreCache = result;
        memoryCoreLastLoaded = now;
        
  const endTime = Date.now();
  console.log(`Memory Core loaded from memories.txt latency: ${endTime - startTime}ms`);
  return result;
      }
    } catch (error) {
      console.log('Failed to load from memories.txt, trying backup files...');
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
      'conversation_history.txt'
    ];
    
    let backupContent = '';
    let foundBackupFile = false;
    
    for (const filename of backupFiles) {
      try {
        const filePath = join(memoryPath, filename);
        await fs.access(filePath);
        backupContent = await fs.readFile(filePath, 'utf-8');
        console.log(`Successfully loaded Memory Core from backup file: ${filename}`);
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
        success: true
      };
    }

    // Parse the backup content
    const entries = parseBackupContent(backupContent);
    
    const result: MemoryCoreData = {
      entries,
      totalEntries: entries.length,
      success: true
    };
    
    // Cache the result
    memoryCoreCache = result;
    memoryCoreLastLoaded = now;
    
    console.log(`Memory Core loaded from backup: ${entries.length} entries`);
  const endTime = Date.now();
  console.log(`Memory Core loaded from backup latency: ${endTime - startTime}ms`);
  return result;
    
  } catch (error) {
    console.error('Error loading Memory Core:', error);
    
    // Final fallback - empty memory core
    const endTime = Date.now();
    console.log(`Memory Core error fallback latency: ${endTime - startTime}ms`);
    return {
      entries: [],
      totalEntries: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
          searchableContent: (parts[2] + ' ' + (parts[3] || '')).toLowerCase()
        };
        
        // Extract topics and emotional tone
        entry.topics = extractTopics(entry.content);
        entry.emotionalTone = detectEmotionalTone(entry.content);
        
        entries.push(entry);
        continue;
      }
    }
    
    // Handle text format - look for conversation patterns
    if (trimmedLine.toLowerCase().includes('user:') || trimmedLine.toLowerCase().includes('danny')) {
      // Save previous entry if exists
      if (currentEntry.content) {
        entries.push(createMemoryEntry(currentEntry, entryId++));
        currentEntry = {};
      }
      
      currentEntry.speaker = 'user';
      currentEntry.content = trimmedLine.replace(/^(user:|danny:?)/i, '').trim();
    } else if (trimmedLine.toLowerCase().includes('milla:') || trimmedLine.toLowerCase().includes('assistant:')) {
      // Save previous entry if exists
      if (currentEntry.content) {
        entries.push(createMemoryEntry(currentEntry, entryId++));
        currentEntry = {};
      }
      
      currentEntry.speaker = 'milla';
      currentEntry.content = trimmedLine.replace(/^(milla:|assistant:)/i, '').trim();
    } else if (currentEntry.content) {
      // Continue building current entry
      currentEntry.content += ' ' + trimmedLine;
    } else {
      // Standalone line - treat as context or general memory
      currentEntry = {
        speaker: 'user',
        content: trimmedLine,
        context: 'general_memory'
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
 */
function createMemoryEntry(partial: Partial<MemoryCoreEntry>, id: number): MemoryCoreEntry {
  const entry: MemoryCoreEntry = {
    id: `entry_${id}`,
    timestamp: partial.timestamp || new Date().toISOString(),
    speaker: partial.speaker || 'user',
    content: partial.content || '',
    context: partial.context,
    searchableContent: (partial.content || '').toLowerCase()
  };
  
  entry.topics = extractTopics(entry.content);
  entry.emotionalTone = detectEmotionalTone(entry.content);
  
  return entry;
}

/**
 * Load Memory Core from existing memory files when no backup is available
 */
async function loadMemoryCoreFromExistingFiles(): Promise<MemoryCoreData> {
  try {
    const entries: MemoryCoreEntry[] = [];
    let entryId = 1;
    
    // Load from memories.txt
    const memoriesData = await getMemoriesFromTxt();
    if (memoriesData.success && memoriesData.content) {
      const memoryLines = memoriesData.content.split('\n');
      for (const line of memoryLines) {
        if (line.trim() && line.length > 10) {
          entries.push({
            id: `memory_${entryId++}`,
            timestamp: new Date().toISOString(),
            speaker: 'user',
            content: line.trim(),
            context: 'memory_file',
            searchableContent: line.trim().toLowerCase(),
            topics: extractTopics(line),
            emotionalTone: detectEmotionalTone(line)
          });
        }
      }
    }
    
    // Load from knowledge.csv
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
          emotionalTone: detectEmotionalTone(item.details)
        });
      }
    }
    
    return {
      entries,
      totalEntries: entries.length,
      success: true
    };
    
  } catch (error) {
    console.error('Error loading Memory Core from existing files:', error);
    return {
      entries: [],
      totalEntries: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Search Memory Core for relevant entries based on query
 */
export async function searchMemoryCore(query: string, limit: number = 10): Promise<MemorySearchResult[]> {
  // Ensure Memory Core is loaded
  const memoryCore = await loadMemoryCore();
  if (!memoryCore.success || memoryCore.entries.length === 0) {
    return [];
  }
  
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  const results: MemorySearchResult[] = [];
  
  for (const entry of memoryCore.entries) {
    let relevanceScore = 0;
    const matchedTerms: string[] = [];
    
    // Score based on exact matches
    for (const term of searchTerms) {
      if (entry.searchableContent.includes(term)) {
        relevanceScore += 3;
        matchedTerms.push(term);
      }
      
      // Boost score for topic matches
      if (entry.topics?.some(topic => topic.toLowerCase().includes(term))) {
        relevanceScore += 2;
      }
      
      // Boost score for context matches
      if (entry.context?.toLowerCase().includes(term)) {
        relevanceScore += 1;
      }
    }
    
    // Add partial word matches
    for (const term of searchTerms) {
      const words = entry.searchableContent.split(' ');
      for (const word of words) {
        if (word.includes(term) && !matchedTerms.includes(term)) {
          relevanceScore += 1;
          matchedTerms.push(term);
        }
      }
    }
    
    // Boost recent entries slightly
    const entryAge = Date.now() - new Date(entry.timestamp).getTime();
    const daysSinceEntry = entryAge / (1000 * 60 * 60 * 24);
    if (daysSinceEntry < 30) {
      relevanceScore += 0.5;
    }
    
    if (relevanceScore > 0) {
      results.push({
        entry,
        relevanceScore,
        matchedTerms
      });
    }
  }
  
  // Sort by relevance and return top results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Extract topics from content using keyword analysis
 */
function extractTopics(content: string): string[] {
  const topics: string[] = [];
  const text = content.toLowerCase();
  
  // Define topic keywords
  const topicKeywords = {
    'relationship': ['love', 'relationship', 'together', 'partner', 'romance', 'dating'],
    'work': ['work', 'job', 'career', 'professional', 'business', 'project'],
    'family': ['family', 'mother', 'father', 'son', 'daughter', 'parent', 'child'],
    'technology': ['technology', 'computer', 'software', 'coding', 'programming', 'ai'],
    'emotions': ['feel', 'emotion', 'sad', 'happy', 'angry', 'excited', 'worried'],
    'goals': ['goal', 'plan', 'future', 'dream', 'aspiration', 'objective'],
    'health': ['health', 'medical', 'doctor', 'exercise', 'wellness', 'fitness'],
    'creative': ['art', 'music', 'writing', 'creative', 'design', 'artistic']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

/**
 * Detect emotional tone of content
 */
function detectEmotionalTone(content: string): string {
  const text = content.toLowerCase();
  
  const positiveWords = ['happy', 'excited', 'love', 'great', 'wonderful', 'amazing', 'good', 'excellent'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'terrible', 'bad', 'hate', 'awful'];
  const neutralWords = ['think', 'consider', 'maybe', 'perhaps', 'question', 'wondering'];
  
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;
  const neutralCount = neutralWords.filter(word => text.includes(word)).length;
  
  if (positiveCount > negativeCount && positiveCount > 0) return 'positive';
  if (negativeCount > positiveCount && negativeCount > 0) return 'negative';
  if (neutralCount > 0) return 'neutral';
  
  return 'neutral';
}

/**
 * Get Memory Core context for a user query
 */
export async function getMemoryCoreContext(query: string): Promise<string> {
  const searchResults = await searchMemoryCore(query, 5);
  
  if (searchResults.length === 0) {
    return '';
  }
  
  const contextEntries = searchResults.map(result => {
    const entry = result.entry;
    const speaker = entry.speaker === 'milla' ? 'Milla' : 'Danny';
    return `[${speaker}]: ${entry.content}`;
  });
  
  return `\nRelevant Memory Context:\n${contextEntries.join('\n')}\n`;
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
    const searchableText = `${item.category} ${item.topic} ${item.description} ${item.details}`.toLowerCase();

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
    .map(entry => entry.item);
}

/**
 * Update the memories file with new information
 */
export async function updateMemories(newMemory: string): Promise<{ success: boolean; error?: string }> {
  try {
    const memoryPath = join(process.cwd(), 'memory', 'memories.txt');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Read existing content
    let existingContent = '';
    try {
      existingContent = await fs.readFile(memoryPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, will create new one
    }

    // Append new memory with timestamp
    const updatedContent = existingContent + `\n\n[${timestamp}] ${newMemory}`;
    
    // Write back to file
    await fs.writeFile(memoryPath, updatedContent, 'utf-8');
    
    // Invalidate memory core cache to force reload
    memoryCoreCache = null;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating memories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating memories'
    };
  }
}