import { generateXAIResponse, PersonalityContext as XAIPersonalityContext } from './xaiService';
import { generateOpenRouterResponse, generateGrokResponse, OpenRouterContext } from './openrouterService';
import { generateGeminiResponse } from './geminiService';
import { storage } from './storage';
import { config } from './config';

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
  let preferredModel: string | undefined = 'xai'; // Default model (changed to xai since minimax has 404 errors)

  if (context.userId) {
    // Try to get user model preference (optional method)
    try {
      const userModelPreference = await (storage as any).getUserPreferredAIModel?.(context.userId);
      if (userModelPreference?.model) {
        preferredModel = userModelPreference.model;
      }
    } catch {
      // Method doesn't exist, use default
    }
  }

  // --- Dynamic Model Selection Logic ---
  // This is where the intelligence for switching models based on context will go.
  // For now, it will primarily respect user preference, with basic contextual overrides.

  let modelToUse = preferredModel;

  // Example contextual override: if message contains "code" or "repository", suggest Grok
  if (userMessage.toLowerCase().includes('code') || userMessage.toLowerCase().includes('repository')) {
    modelToUse = 'grok';
  }
  // Add more sophisticated logic here based on intent, emotional state, etc.

  console.log(`Dispatching AI response using model: ${modelToUse} (preferred: ${preferredModel})`);

  switch (modelToUse) {
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
