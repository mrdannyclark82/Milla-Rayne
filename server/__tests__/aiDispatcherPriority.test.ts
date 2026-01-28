import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dispatchAIResponse } from '../aiDispatcherService';
import * as openaiChatService from '../openaiChatService';
import * as anthropicService from '../anthropicService';
import * as xaiService from '../xaiService';
import * as mistralService from '../mistralService';
import * as openrouterService from '../openrouterService';
import { config } from '../config';

// Mock all dependencies
vi.mock('../openaiChatService', () => ({ generateOpenAIResponse: vi.fn() }));
vi.mock('../anthropicService', () => ({ generateAnthropicResponse: vi.fn() }));
vi.mock('../xaiService', () => ({ generateXAIResponse: vi.fn(), PersonalityContext: {} }));
vi.mock('../mistralService', () => ({ generateMistralResponse: vi.fn() }));
vi.mock('../openrouterService', () => ({ generateOpenRouterResponse: vi.fn(), generateGrokResponse: vi.fn() }));
vi.mock('../geminiService', () => ({ generateGeminiResponse: vi.fn() }));
vi.mock('../memoryService', () => ({ searchMemoryCore: vi.fn().mockResolvedValue([]), getSemanticMemoryContext: vi.fn().mockResolvedValue('') }));
vi.mock('../xaiTracker', () => ({
  startReasoningSession: vi.fn().mockReturnValue('test-session-id'),
  trackCommandIntent: vi.fn(),
  trackToolSelection: vi.fn(),
  trackResponseGeneration: vi.fn(),
  addReasoningStep: vi.fn(),
}));
vi.mock('../storage', () => ({ storage: { getUserPreferredAIModel: vi.fn().mockRejectedValue(new Error('No preference')) } }));

describe('AI Dispatcher Priority Chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.localModel = { enabled: false, preferLocal: false };
    // Set ALL keys to ensure the chain tries everything
    config.openai = { apiKey: 'sk-test' };
    config.anthropic = { apiKey: 'sk-ant-test' };
    config.xai = { apiKey: 'xai-test' };
    config.mistral = { apiKey: 'mistral-test' };
    config.openrouter = { apiKey: 'or-test', grok1ApiKey: 'grok-test' };
  });

  afterEach(() => { vi.restoreAllMocks(); });

  const mockFail = (mockFn: any) => mockFn.mockResolvedValue({ success: false, error: 'Failed' });
  const mockSuccess = (mockFn: any, name: string) => mockFn.mockResolvedValue({ success: true, content: `${name} Response` });

  it('1. OpenAI succeeds -> Stop', async () => {
    mockSuccess(openaiChatService.generateOpenAIResponse as any, 'OpenAI');
    await dispatchAIResponse('Try OpenAI', { userId: 'u1', conversationHistory: [], userName: 'User' });
    expect(openaiChatService.generateOpenAIResponse).toHaveBeenCalled();
    expect(anthropicService.generateAnthropicResponse).not.toHaveBeenCalled();
  });

  it('2. OpenAI fails -> Anthropic succeeds -> Stop', async () => {
    mockFail(openaiChatService.generateOpenAIResponse as any);
    mockSuccess(anthropicService.generateAnthropicResponse as any, 'Anthropic');

    await dispatchAIResponse('Try Anthropic', { userId: 'u1', conversationHistory: [], userName: 'User' });

    expect(openaiChatService.generateOpenAIResponse).toHaveBeenCalled();
    expect(anthropicService.generateAnthropicResponse).toHaveBeenCalled();
    expect(xaiService.generateXAIResponse).not.toHaveBeenCalled();
  });

  it('3. OpenAI/Anthropic fail -> xAI succeeds -> Stop', async () => {
    mockFail(openaiChatService.generateOpenAIResponse as any);
    mockFail(anthropicService.generateAnthropicResponse as any);
    mockSuccess(xaiService.generateXAIResponse as any, 'xAI');

    await dispatchAIResponse('Try xAI', { userId: 'u1', conversationHistory: [], userName: 'User' });

    expect(openaiChatService.generateOpenAIResponse).toHaveBeenCalled();
    expect(anthropicService.generateAnthropicResponse).toHaveBeenCalled();
    expect(xaiService.generateXAIResponse).toHaveBeenCalled();
    expect(mistralService.generateMistralResponse).not.toHaveBeenCalled();
  });

  it('4. OpenAI/Anthropic/xAI fail -> Mistral succeeds -> Stop', async () => {
    mockFail(openaiChatService.generateOpenAIResponse as any);
    mockFail(anthropicService.generateAnthropicResponse as any);
    mockFail(xaiService.generateXAIResponse as any);
    mockSuccess(mistralService.generateMistralResponse as any, 'Mistral');

    await dispatchAIResponse('Try Mistral', { userId: 'u1', conversationHistory: [], userName: 'User' });

    expect(mistralService.generateMistralResponse).toHaveBeenCalled();
    expect(openrouterService.generateOpenRouterResponse).not.toHaveBeenCalled();
  });

  it('5. All primary fail -> OpenRouter succeeds', async () => {
    mockFail(openaiChatService.generateOpenAIResponse as any);
    mockFail(anthropicService.generateAnthropicResponse as any);
    mockFail(xaiService.generateXAIResponse as any);
    mockFail(mistralService.generateMistralResponse as any);
    mockSuccess(openrouterService.generateOpenRouterResponse as any, 'OpenRouter');

    await dispatchAIResponse('Try OpenRouter', { userId: 'u1', conversationHistory: [], userName: 'User' });

    expect(openrouterService.generateOpenRouterResponse).toHaveBeenCalled();
  });
});
