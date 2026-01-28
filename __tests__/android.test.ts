/**
 * Tests for Android integrations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MediaPipeLLMWrapper } from '../android/mp-llm-wrapper';
import { ExecuTorchFallback, SmartFallbackOrchestrator } from '../android/executorch-fallback';

describe('MediaPipe LLM Wrapper', () => {
  let wrapper: MediaPipeLLMWrapper;

  beforeAll(async () => {
    wrapper = new MediaPipeLLMWrapper({
      modelAssetPath: 'test-gemma-2b.bin',
    });
    await wrapper.initialize();
  });

  afterAll(async () => {
    await wrapper.close();
  });

  it('should initialize successfully', () => {
    expect(wrapper.isReady()).toBe(true);
  });

  it('should generate response', async () => {
    const response = await wrapper.generateResponse('Hello');
    
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });

  it('should get model info', () => {
    const info = wrapper.getModelInfo();
    
    expect(info.initialized).toBe(true);
    expect(info.modelPath).toBe('test-gemma-2b.bin');
  });
});

describe('ExecuTorch Fallback', () => {
  let fallback: ExecuTorchFallback;

  beforeAll(async () => {
    fallback = new ExecuTorchFallback({
      modelPath: 'test-model.pte',
      useXNNPACK: true,
    });
    await fallback.initialize();
  });

  afterAll(async () => {
    await fallback.close();
  });

  it('should initialize ExecuTorch', () => {
    expect(fallback.isReady()).toBe(true);
  });

  it('should run inference', async () => {
    const result = await fallback.runInference('Test input');
    
    expect(result.success).toBe(true);
    expect(result.output).toBeTruthy();
    expect(result.executionTimeMs).toBeGreaterThan(0);
  });

  it('should track fallback count', async () => {
    const statsBefore = fallback.getStats();
    
    await fallback.runInference('Test 1');
    await fallback.runInference('Test 2');
    
    const statsAfter = fallback.getStats();
    
    expect(statsAfter.fallbackCount).toBe(statsBefore.fallbackCount + 2);
  });
});

describe('Smart Fallback Orchestrator', () => {
  it('should fallback to ExecuTorch on primary failure', async () => {
    // Mock primary method that always fails
    const failingPrimary = {
      infer: async () => {
        throw new Error('Primary failed');
      },
    };

    const orchestrator = new SmartFallbackOrchestrator(
      failingPrimary,
      { modelPath: 'fallback.pte' }
    );

    await orchestrator.initialize();

    const result = await orchestrator.infer('Test query');
    
    expect(result).toBeTruthy();
  });
});
