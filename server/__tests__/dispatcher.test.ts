import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchQuery } from '../dispatcher/fallback-dispatcher';
import { gemmaMP } from '../../android/gemma-wrapper-mp';
import { gemini3R } from '../dispatcher/gemini3-reason';

// Mock the dependencies
vi.mock('../../android/gemma-wrapper-mp', () => ({
  gemmaMP: {
    generate: vi.fn(),
  },
}));

vi.mock('../dispatcher/gemini3-reason', () => ({
  gemini3R: {
    reason: vi.fn(),
  },
}));

describe('Fallback Dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use gemma-local as default provider', async () => {
    const mockResponse = 'Response from Gemma';
    vi.mocked(gemmaMP.generate).mockResolvedValue(mockResponse);

    const result = await dispatchQuery('Test query');

    expect(gemmaMP.generate).toHaveBeenCalledWith('Test query');
    expect(result).toBe(mockResponse);
  });

  it('should fallback to gemini3 when gemma fails', async () => {
    const mockGemini3Response = 'Response from Gemini 3';
    vi.mocked(gemmaMP.generate).mockRejectedValue(new Error('Gemma failed'));
    vi.mocked(gemini3R.reason).mockResolvedValue(mockGemini3Response);

    const result = await dispatchQuery('Test query');

    expect(gemmaMP.generate).toHaveBeenCalled();
    expect(gemini3R.reason).toHaveBeenCalledWith('Test query');
    expect(result).toBe(mockGemini3Response);
  });

  it('should throw error when all providers fail', async () => {
    vi.mocked(gemmaMP.generate).mockRejectedValue(new Error('Gemma failed'));
    vi.mocked(gemini3R.reason).mockRejectedValue(new Error('Gemini failed'));

    await expect(dispatchQuery('Test query')).rejects.toThrow(
      'All LLM providers failed'
    );
  });

  it('should use gemini3 when specified as preferred provider', async () => {
    const mockGemini3Response = 'Response from Gemini 3';
    vi.mocked(gemini3R.reason).mockResolvedValue(mockGemini3Response);

    const result = await dispatchQuery('Test query', 'gemini3');

    expect(gemmaMP.generate).not.toHaveBeenCalled();
    expect(gemini3R.reason).toHaveBeenCalledWith('Test query');
    expect(result).toBe(mockGemini3Response);
  });

  it('should try ollama provider and fallback to gemini3', async () => {
    const mockGemini3Response = 'Response from Gemini 3';
    vi.mocked(gemmaMP.generate).mockRejectedValue(new Error('Ollama failed'));
    vi.mocked(gemini3R.reason).mockResolvedValue(mockGemini3Response);

    const result = await dispatchQuery('Test query', 'ollama');

    expect(gemmaMP.generate).toHaveBeenCalled();
    expect(gemini3R.reason).toHaveBeenCalledWith('Test query');
    expect(result).toBe(mockGemini3Response);
  });
});
