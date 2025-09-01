import { promises as fs } from 'fs';
import path from 'path';

interface VisualMemory {
  id: string;
  timestamp: number;
  emotion: string;
  confidence: number;
  imageHash: string;
  date: string;
  timeOfDay: string;
}

const VISUAL_MEMORY_FILE = path.join(process.cwd(), 'memory', 'visual_memories.json');

// Ensure the memory directory exists
async function ensureMemoryDirectory() {
  const memoryDir = path.dirname(VISUAL_MEMORY_FILE);
  try {
    await fs.access(memoryDir);
  } catch {
    await fs.mkdir(memoryDir, { recursive: true });
  }
}

// Generate a simple hash for image data comparison
function generateImageHash(imageData: string): string {
  return imageData.substring(imageData.indexOf(',') + 1, imageData.indexOf(',') + 20);
}

// Store visual memory
export async function storeVisualMemory(
  imageData: string, 
  emotion: string, 
  timestamp: number
): Promise<void> {
  try {
    await ensureMemoryDirectory();
    
    const memory: VisualMemory = {
      id: `visual_${timestamp}`,
      timestamp,
      emotion,
      confidence: 0.8,
      imageHash: generateImageHash(imageData),
      date: new Date(timestamp).toLocaleDateString(),
      timeOfDay: new Date(timestamp).toLocaleTimeString()
    };

    let memories: VisualMemory[] = [];
    
    try {
      const existingData = await fs.readFile(VISUAL_MEMORY_FILE, 'utf-8');
      memories = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet, start with empty array
    }

    memories.push(memory);
    
    // Keep only the last 100 visual memories to prevent file bloat
    if (memories.length > 100) {
      memories = memories.slice(-100);
    }

    await fs.writeFile(VISUAL_MEMORY_FILE, JSON.stringify(memories, null, 2));
    
    // Also add to main memory stream
    const memoryText = `Visual Memory: Detected ${emotion} emotion at ${new Date(timestamp).toLocaleString()}. Danny Ray was expressing ${emotion} feelings during our video interaction.`;
    
    const { updateMemories } = await import('./memoryService');
    await updateMemories(memoryText);
    
  } catch (error) {
    console.error('Error storing visual memory:', error);
  }
}

// Get visual memories
export async function getVisualMemories(): Promise<VisualMemory[]> {
  try {
    await ensureMemoryDirectory();
    const data = await fs.readFile(VISUAL_MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Get recent emotion trends
export async function getEmotionTrends(): Promise<{ emotion: string; count: number }[]> {
  const memories = await getVisualMemories();
  const recentMemories = memories.filter(m => 
    Date.now() - m.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
  );
  
  const emotionCounts: Record<string, number> = {};
  recentMemories.forEach(memory => {
    emotionCounts[memory.emotion] = (emotionCounts[memory.emotion] || 0) + 1;
  });
  
  return Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);
}

// Get contextual emotion insights for AI responses
export async function getEmotionalContext(): Promise<string> {
  const trends = await getEmotionTrends();
  const recentMemories = await getVisualMemories();
  
  if (recentMemories.length === 0) {
    return "";
  }
  
  const lastMemory = recentMemories[recentMemories.length - 1];
  const topEmotion = trends[0];
  
  if (topEmotion && topEmotion.count > 2) {
    return `Recent visual analysis shows Danny Ray has been mostly ${topEmotion.emotion} today. His last observed emotion was ${lastMemory.emotion}.`;
  }
  
  return `Last observed Danny Ray's emotion: ${lastMemory.emotion} at ${lastMemory.timeOfDay}.`;
}