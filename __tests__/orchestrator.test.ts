/**
 * Tests for Orchestrator
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Orchestrator } from '../conductor/orchestrator';

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeAll(async () => {
    orchestrator = new Orchestrator({
      defaultModel: 'gemini-flash',
      fallbackChain: ['gemini-flash', 'gemini-pro', 'local-gemma3'],
      enableCaching: true,
      maxConcurrentRequests: 3,
    });
    await orchestrator.initialize();
  });

  it('should initialize successfully', async () => {
    const stats = orchestrator.getStats();
    
    expect(stats.modelHealth).toBeDefined();
    expect(Object.keys(stats.modelHealth).length).toBeGreaterThan(0);
  });

  it('should execute task with fallback', async () => {
    const result = await orchestrator.execute({
      type: 'query',
      input: { prompt: 'Test query' },
      priority: 1,
    });

    expect(result.taskId).toBeTruthy();
    expect(result.success).toBeDefined();
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('should cache results', async () => {
    const task = {
      type: 'query',
      input: { prompt: 'Caching test' },
      priority: 1,
    };

    const result1 = await orchestrator.execute(task);
    const result2 = await orchestrator.execute(task);

    // Second call should use cache
    const stats = orchestrator.getStats();
    expect(stats.cachedResults).toBeGreaterThan(0);
  });

  it('should get statistics', () => {
    const stats = orchestrator.getStats();

    expect(stats.activeRequests).toBeGreaterThanOrEqual(0);
    expect(stats.cachedResults).toBeGreaterThanOrEqual(0);
    expect(stats.modelHealth).toBeDefined();
  });

  it('should clear cache', () => {
    orchestrator.clearCache();
    
    const stats = orchestrator.getStats();
    expect(stats.cachedResults).toBe(0);
  });
});
