import { describe, it, expect, beforeEach } from 'vitest';
import { GemmaMPWrapper } from '../../android/gemma-wrapper-mp';

describe('GemmaMPWrapper', () => {
  let wrapper: GemmaMPWrapper;

  beforeEach(() => {
    wrapper = new GemmaMPWrapper();
  });

  it('should initialize with default model', async () => {
    await wrapper.setup();
    // The wrapper should be ready after setup
    expect(wrapper).toBeDefined();
  });

  it('should initialize with custom model', async () => {
    await wrapper.setup('gemma-7b');
    expect(wrapper).toBeDefined();
  });

  it('should generate response', async () => {
    const prompt = 'Hello, how are you?';
    const response = await wrapper.generate(prompt);
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('should generate response with custom max tokens', async () => {
    const prompt = 'Tell me a story';
    const maxTokens = 256;
    const response = await wrapper.generate(prompt, maxTokens);
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  it('should auto-setup if generate called before setup', async () => {
    const newWrapper = new GemmaMPWrapper();
    const response = await newWrapper.generate('Test query');
    
    expect(response).toBeDefined();
  });
});
