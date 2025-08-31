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
    
    return { success: true };
  } catch (error) {
    console.error('Error updating memories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating memories'
    };
  }
}