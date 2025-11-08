import { generateXAIResponse, PersonalityContext as XAIPersonalityContext } from './xaiService';
import { generateOpenRouterResponse, generateGrokResponse, OpenRouterContext } from './openrouterService';
import { generateGeminiResponse } from './geminiService';
import { storage } from './storage';
import { config } from './config';
import { generateOpenAIResponse } from './openaiChatService';

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface DispatchContext {
  userId: string | null;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userName: string;
  userEmotionalState?: 'positive' | 'negative' | 'neutral';
  urgency?: 'low' | 'medium' | 'high';
}

export async function dispatchAIResponse(
  userMessage: string,
  context: DispatchContext,
  maxTokens?: number
): Promise<AIResponse> {
  // Default model selection. Respect CHAT_PROVIDER environment variable when present.
  let preferredModel: string | undefined = 'xai'; // fallback default

  const envProvider = (process.env.CHAT_PROVIDER || '').toLowerCase();
  if (envProvider) {
    // Map common env values to internal model keys
    switch (envProvider) {
      case 'openai':
        // Only prefer OpenAI if API key configured
        if (config.openai?.apiKey) {
          preferredModel = 'openai';
        } else if (process.env.OPENAI_API_KEY) {
          preferredModel = 'openai';
        } else {
          console.warn('CHAT_PROVIDER set to OpenAI but OPENAI API key is missing. Falling back to defaults.');
        }
        break;
      case 'openrouter':
        preferredModel = 'openrouter';
        break;
      case 'gemini':
        preferredModel = 'gemini';
        break;
      case 'xai':
        preferredModel = 'xai';
        break;
      default:
        // leave default as-is
        break;
    }
  }

  if (context.userId) {
    const userModelPreference = await storage.getUserAIModel(context.userId);
    if (userModelPreference.success && userModelPreference.model) {
      preferredModel = userModelPreference.model;
    }
  }

  // --- Dynamic Model Selection Logic ---
  // This is where the intelligence for switching models based on context will go.
  // For now, it will primarily respect user preference, with basic contextual overrides.

  let modelToUse = preferredModel;

  // Example contextual override: if message contains "code" or "repository", suggest Grok
  // Contextual override: prefer Grok for code/repository-related requests, BUT do not override
  // when an explicit provider preference is set to OpenAI (or another explicit provider).
  const messageLower = userMessage.toLowerCase();
  if (
    (messageLower.includes('code') || messageLower.includes('repository')) &&
    modelToUse !== 'openai' &&
    preferredModel !== 'openai'
  ) {
    modelToUse = 'grok';
  }
  // Add more sophisticated logic here based on intent, emotional state, etc.

  console.log(`Dispatching AI response using model: ${modelToUse} (preferred: ${preferredModel})`);

  switch (modelToUse) {
    case 'openai':
      // Use OpenAI chat wrapper
      return generateOpenAIResponse(
        userMessage,
        context.conversationHistory,
        context.userName,
        maxTokens || 1024
      ).then((r) => ({ content: r.content, success: r.success, error: r.error }));

    case 'xai':
      return generateXAIResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as XAIPersonalityContext, maxTokens);
    case 'gemini':
      return generateGeminiResponse(userMessage);
    case 'grok':
      return generateGrokResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as OpenRouterContext, maxTokens);
    case 'minimax': // Minimax is handled by OpenRouterService
    case 'venice': // Venice is handled by OpenRouterService
    case 'deepseek': // Deepseek is handled by OpenRouterService
    default:
      // Default to OpenRouter (Minimax) if no specific model is chosen or if it's an unknown model
      return generateOpenRouterResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as OpenRouterContext, maxTokens);
  }
}
