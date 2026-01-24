/**
 * Tests for Gemma3 AI Edge Integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Gemma3AIEdge } from '../locallm/gemma3-ai-edge';
import { Gemma3nMobile } from '../locallm/gemma3n-mobile';

describe('Gemma3 AI Edge', () => {
  let gemma3: Gemma3AIEdge;

  beforeAll(async () => {
    gemma3 = new Gemma3AIEdge({
      modelPath: 'test-model.tflite',
    });
    await gemma3.initialize();
  });

  afterAll(async () => {
    await gemma3.unload();
  });

  it('should initialize successfully', () => {
    expect(gemma3.isReady()).toBe(true);
  });

  it('should run inference', async () => {
    const result = await gemma3.infer('Hello, how are you?');
    
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('should cache results', async () => {
    const prompt = 'Test caching';
    
    const result1 = await gemma3.infer(prompt);
    const result2 = await gemma3.infer(prompt);
    
    // Second call should be faster (cached)
    expect(result2.latencyMs).toBeLessThan(result1.latencyMs);
  });

  it('should handle multiple inferences', async () => {
    const prompts = ['Question 1', 'Question 2', 'Question 3'];
    
    const results = await Promise.all(
      prompts.map(prompt => gemma3.infer(prompt))
    );
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.text).toBeTruthy();
    });
  });
});

describe('Gemma3n Mobile', () => {
  let gemma3n: Gemma3nMobile;

  beforeAll(async () => {
    gemma3n = new Gemma3nMobile({
      modelPath: 'test-model-quantized.tflite',
      quantized: true,
    });
    await gemma3n.initialize();
  });

  afterAll(async () => {
    await gemma3n.unload();
  });

  it('should initialize for mobile', () => {
    expect(gemma3n.isReady()).toBe(true);
  });

  it('should run mobile inference', async () => {
    const result = await gemma3n.infer('Mobile test query');
    
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.memoryUsedMB).toBeGreaterThanOrEqual(0);
  });

  it('should truncate long prompts', async () => {
    const longPrompt = 'A'.repeat(1000);
    const result = await gemma3n.infer(longPrompt);
    
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
  });

  it('should track inference count', async () => {
    const statsBefore = gemma3n.getStats();
    
    await gemma3n.infer('Test 1');
    await gemma3n.infer('Test 2');
    
    const statsAfter = gemma3n.getStats();
    
    expect(statsAfter.inferenceCount).toBe(statsBefore.inferenceCount + 2);
  });

  it('should report quantization in stats', () => {
    const stats = gemma3n.getStats();
    
    expect(stats.quantized).toBe(true);
    expect(stats.memoryLimit).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  it('should work with both Gemma3 and Gemma3n', async () => {
    const gemma3 = new Gemma3AIEdge({ modelPath: 'test.tflite' });
    const gemma3n = new Gemma3nMobile({ modelPath: 'test-mobile.tflite' });

    await gemma3.initialize();
    await gemma3n.initialize();

    const prompt = 'Integration test';
    
    const [result1, result2] = await Promise.all([
      gemma3.infer(prompt),
      gemma3n.infer(prompt),
    ]);

    expect(result1.text).toBeTruthy();
    expect(result2.text).toBeTruthy();

    await gemma3.unload();
    await gemma3n.unload();
  });
});
