/**
 * Tests for Memory Evolution Engine
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemoryEvolutionEngine } from '../memory/evolution-engine';

describe('Memory Evolution Engine', () => {
  let engine: MemoryEvolutionEngine;

  beforeAll(async () => {
    engine = new MemoryEvolutionEngine({
      consolidationInterval: 1000, // 1 second for testing
      importanceDecayRate: 0.95,
      pruneThreshold: 0.1,
      maxMemories: 100,
    });
    await engine.initialize();
  });

  afterAll(async () => {
    await engine.shutdown();
  });

  it('should add memories', async () => {
    const id = await engine.addMemory('Test memory', ['test'], 0.8);
    
    expect(id).toBeTruthy();
    expect(id.startsWith('mem_')).toBe(true);
  });

  it('should access and boost memory importance', async () => {
    const id = await engine.addMemory('Important memory', ['important'], 0.5);
    
    const memory1 = await engine.accessMemory(id);
    expect(memory1).toBeTruthy();
    expect(memory1!.accessCount).toBe(1);

    const memory2 = await engine.accessMemory(id);
    expect(memory2!.accessCount).toBe(2);
    expect(memory2!.importance).toBeGreaterThan(memory1!.importance);
  });

  it('should search memories', async () => {
    await engine.addMemory('JavaScript is great', ['programming'], 0.7);
    await engine.addMemory('Python is awesome', ['programming'], 0.8);
    await engine.addMemory('Cooking recipes', ['food'], 0.6);

    const results = await engine.searchMemories('programming', 5);
    
    expect(results.length).toBeGreaterThan(0);
    results.forEach(memory => {
      const hasTag = memory.tags.includes('programming');
      const hasContent = memory.content.toLowerCase().includes('programming');
      expect(hasTag || hasContent).toBe(true);
    });
  });

  it('should get statistics', () => {
    const stats = engine.getStats();

    expect(stats.totalMemories).toBeGreaterThan(0);
    expect(stats.averageImportance).toBeGreaterThan(0);
    expect(stats.averageImportance).toBeLessThanOrEqual(1);
  });

  it('should handle memory limit', async () => {
    // Add many memories
    for (let i = 0; i < 110; i++) {
      await engine.addMemory(`Memory ${i}`, [], 0.5);
    }

    const stats = engine.getStats();
    expect(stats.totalMemories).toBeLessThanOrEqual(100);
  });
});
