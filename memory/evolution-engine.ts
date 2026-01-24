/**
 * Memory Evolution Engine
 * Manages memory consolidation, pruning, and evolution over time
 * Implements forgetting curves and importance scoring
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface Memory {
  id: string;
  content: string;
  timestamp: number;
  importance: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  associations: string[];
}

interface EvolutionConfig {
  consolidationInterval: number; // ms
  importanceDecayRate: number;
  accessBoost: number;
  pruneThreshold: number;
  maxMemories: number;
}

export class MemoryEvolutionEngine {
  private memories: Map<string, Memory> = new Map();
  private config: EvolutionConfig;
  private evolutionInterval: NodeJS.Timeout | null = null;
  private historyPath: string;

  constructor(config?: Partial<EvolutionConfig>) {
    this.config = {
      consolidationInterval: 3600000, // 1 hour
      importanceDecayRate: 0.95,
      accessBoost: 1.1,
      pruneThreshold: 0.1,
      maxMemories: 10000,
      ...config,
    };

    this.historyPath = path.join(process.cwd(), 'memory', 'evolution_history.json');
  }

  /**
   * Initialize the evolution engine
   */
  async initialize(): Promise<void> {
    try {
      console.log('[MemoryEvolution] Initializing...');
      
      // Load existing memories
      await this.loadMemories();

      // Start evolution cycle
      this.startEvolutionCycle();

      console.log('[MemoryEvolution] Initialized with', this.memories.size, 'memories');
    } catch (error) {
      console.error('[MemoryEvolution] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Add a new memory
   */
  async addMemory(content: string, tags: string[] = [], importance: number = 0.5): Promise<string> {
    const id = this.generateId();
    const memory: Memory = {
      id,
      content,
      timestamp: Date.now(),
      importance,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      associations: [],
    };

    this.memories.set(id, memory);
    console.log(`[MemoryEvolution] Added memory ${id} with importance ${importance}`);

    // Check if we need to prune
    if (this.memories.size > this.config.maxMemories) {
      await this.pruneMemories();
    }

    return id;
  }

  /**
   * Access a memory (increases importance)
   */
  async accessMemory(id: string): Promise<Memory | null> {
    const memory = this.memories.get(id);
    if (!memory) return null;

    memory.accessCount++;
    memory.lastAccessed = Date.now();
    memory.importance = Math.min(1.0, memory.importance * this.config.accessBoost);

    console.log(`[MemoryEvolution] Accessed memory ${id}, new importance: ${memory.importance.toFixed(3)}`);

    return memory;
  }

  /**
   * Search memories by content or tags
   */
  async searchMemories(query: string, limit: number = 10): Promise<Memory[]> {
    const queryLower = query.toLowerCase();
    const results: Memory[] = [];

    for (const memory of this.memories.values()) {
      // Simple relevance scoring
      let score = 0;

      if (memory.content.toLowerCase().includes(queryLower)) {
        score += 0.5;
      }

      if (memory.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        score += 0.3;
      }

      if (score > 0) {
        results.push(memory);
      }
    }

    // Sort by importance and score
    results.sort((a, b) => b.importance - a.importance);

    return results.slice(0, limit);
  }

  /**
   * Start the evolution cycle
   */
  private startEvolutionCycle(): void {
    this.evolutionInterval = setInterval(async () => {
      await this.evolveMemories();
    }, this.config.consolidationInterval);

    console.log('[MemoryEvolution] Evolution cycle started');
  }

  /**
   * Evolve memories (decay importance, consolidate, prune)
   */
  private async evolveMemories(): Promise<void> {
    console.log('[MemoryEvolution] Starting evolution cycle...');
    
    const now = Date.now();
    let decayed = 0;
    let pruned = 0;

    // Decay importance over time
    for (const memory of this.memories.values()) {
      const timeSinceAccess = now - memory.lastAccessed;
      const daysSinceAccess = timeSinceAccess / (1000 * 60 * 60 * 24);

      // Apply exponential decay based on time
      const decayFactor = Math.pow(this.config.importanceDecayRate, daysSinceAccess);
      memory.importance *= decayFactor;

      if (memory.importance > 0.01) {
        decayed++;
      }
    }

    // Prune low-importance memories
    pruned = await this.pruneMemories();

    // Save evolved state
    await this.saveMemories();

    console.log(`[MemoryEvolution] Evolution complete: ${decayed} decayed, ${pruned} pruned, ${this.memories.size} remaining`);
  }

  /**
   * Prune memories below importance threshold
   */
  private async pruneMemories(): Promise<number> {
    const beforeSize = this.memories.size;
    const toPrune: string[] = [];

    for (const [id, memory] of this.memories.entries()) {
      if (memory.importance < this.config.pruneThreshold) {
        toPrune.push(id);
      }
    }

    // Remove low-importance memories
    toPrune.forEach(id => this.memories.delete(id));

    const pruned = beforeSize - this.memories.size;
    if (pruned > 0) {
      console.log(`[MemoryEvolution] Pruned ${pruned} low-importance memories`);
    }

    return pruned;
  }

  /**
   * Load memories from disk
   */
  private async loadMemories(): Promise<void> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      const memoriesArray: Memory[] = JSON.parse(data);
      
      this.memories.clear();
      memoriesArray.forEach(memory => {
        this.memories.set(memory.id, memory);
      });

      console.log(`[MemoryEvolution] Loaded ${this.memories.size} memories from disk`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('[MemoryEvolution] No existing memory file found, starting fresh');
      } else {
        console.error('[MemoryEvolution] Failed to load memories:', error);
      }
    }
  }

  /**
   * Save memories to disk
   */
  private async saveMemories(): Promise<void> {
    try {
      const memoriesArray = Array.from(this.memories.values());
      await fs.writeFile(this.historyPath, JSON.stringify(memoriesArray, null, 2));
      console.log(`[MemoryEvolution] Saved ${memoriesArray.length} memories to disk`);
    } catch (error) {
      console.error('[MemoryEvolution] Failed to save memories:', error);
    }
  }

  /**
   * Generate unique memory ID
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get evolution statistics
   */
  getStats() {
    const importances = Array.from(this.memories.values()).map(m => m.importance);
    return {
      totalMemories: this.memories.size,
      averageImportance: importances.reduce((a, b) => a + b, 0) / importances.length || 0,
      maxImportance: Math.max(...importances, 0),
      minImportance: Math.min(...importances, 1),
    };
  }

  /**
   * Stop evolution cycle and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
      this.evolutionInterval = null;
    }

    await this.saveMemories();
    console.log('[MemoryEvolution] Shutdown complete');
  }
}

// Export singleton instance
export const memoryEvolution = new MemoryEvolutionEngine();
