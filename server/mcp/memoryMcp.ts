/**
 * Memory MCP Service
 * Enhanced memory operations through MCP protocol
 */

import { db } from '../db.js';
import { memories, Message } from '../../shared/schema.js';
import { eq, like, desc } from 'drizzle-orm';

export interface MemoryEntry {
  id: number;
  userId: number;
  content: string;
  metadata?: any;
  createdAt: Date;
  importance?: number;
}

export class MemoryMCPService {
  /**
   * Store a memory with metadata
   */
  async storeMemory(
    userId: number, 
    content: string, 
    metadata?: any, 
    importance = 5
  ): Promise<MemoryEntry> {
    const [memory] = await db.insert(memories).values({
      userId,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      importance,
      createdAt: new Date(),
    }).returning();

    return {
      id: memory.id,
      userId: memory.userId,
      content: memory.content,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : undefined,
      createdAt: memory.createdAt,
      importance: memory.importance || undefined,
    };
  }

  /**
   * Retrieve memories by search query
   */
  async searchMemories(userId: number, query: string, limit = 10): Promise<MemoryEntry[]> {
    const results = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt))
      .limit(limit);

    // Simple text search - in production, use vector embeddings
    const filtered = results.filter(m => 
      m.content.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.map(m => ({
      id: m.id,
      userId: m.userId,
      content: m.content,
      metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
      createdAt: m.createdAt,
      importance: m.importance || undefined,
    }));
  }

  /**
   * Retrieve recent memories
   */
  async getRecentMemories(userId: number, limit = 20): Promise<MemoryEntry[]> {
    const results = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt))
      .limit(limit);

    return results.map(m => ({
      id: m.id,
      userId: m.userId,
      content: m.content,
      metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
      createdAt: m.createdAt,
      importance: m.importance || undefined,
    }));
  }

  /**
   * Get important memories (high importance score)
   */
  async getImportantMemories(userId: number, threshold = 7, limit = 10): Promise<MemoryEntry[]> {
    const results = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.importance), desc(memories.createdAt))
      .limit(limit);

    const filtered = results.filter(m => (m.importance || 0) >= threshold);

    return filtered.map(m => ({
      id: m.id,
      userId: m.userId,
      content: m.content,
      metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
      createdAt: m.createdAt,
      importance: m.importance || undefined,
    }));
  }

  /**
   * Update memory importance
   */
  async updateImportance(memoryId: number, importance: number): Promise<void> {
    await db
      .update(memories)
      .set({ importance })
      .where(eq(memories.id, memoryId));
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: number): Promise<void> {
    await db.delete(memories).where(eq(memories.id, memoryId));
  }

  /**
   * Get memory by ID
   */
  async getMemoryById(memoryId: number): Promise<MemoryEntry | null> {
    const [memory] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, memoryId))
      .limit(1);

    if (!memory) return null;

    return {
      id: memory.id,
      userId: memory.userId,
      content: memory.content,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : undefined,
      createdAt: memory.createdAt,
      importance: memory.importance || undefined,
    };
  }

  /**
   * Tag a memory with metadata
   */
  async tagMemory(memoryId: number, tags: string[]): Promise<void> {
    const memory = await this.getMemoryById(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    const metadata = memory.metadata || {};
    metadata.tags = tags;

    await db
      .update(memories)
      .set({ metadata: JSON.stringify(metadata) })
      .where(eq(memories.id, memoryId));
  }
}

let memoryService: MemoryMCPService | null = null;

export function getMemoryMCPService(): MemoryMCPService {
  if (!memoryService) {
    memoryService = new MemoryMCPService();
  }
  return memoryService;
}
