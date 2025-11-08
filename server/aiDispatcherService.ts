import { generateXAIResponse, PersonalityContext as XAIPersonalityContext } from './xaiService';
import { generateOpenRouterResponse, generateGrokResponse, OpenRouterContext } from './openrouterService';
import { generateGeminiResponse } from './geminiService';
import { generateAIResponse as generateOpenAIResponse } from './openaiService';
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
  console.log('--- dispatchAIResponse called ---');
  let preferredModel: string | undefined = 'openai'; // Default model (changed to openai)

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

  // Example contextual override: if message contains specific programming keywords, suggest Grok
  const codeKeywords = ['github repository', 'pull request', 'git commit', 'code review', 'programming'];
  const hasCodeContext = codeKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

  if (hasCodeContext && config.openrouter?.grok1ApiKey) {
    modelToUse = 'grok';
  }

  // Agent command override
  const agentMatch = userMessage.match(/^agent\s+(\w+)\s+(.*)/i);
  if (agentMatch) {
    const [, agentName, task] = agentMatch;
    console.log(`Dispatching to agent: ${agentName} with task: ${task}`);
    const { agentController } = await import('./agentController');
    const result = await agentController.dispatch(agentName, task);
    return { content: result, success: true };
  }
  // Add more sophisticated logic here based on intent, emotional state, etc.

  console.log(`Dispatching AI response using model: ${modelToUse} (preferred: ${preferredModel})`);

  console.log(`--- Dispatching to model: ${modelToUse} ---`);

  let response: AIResponse;

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
      response = await generateXAIResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as XAIPersonalityContext, maxTokens);
      break;
    case 'gemini':
      response = await generateGeminiResponse(userMessage);
      break;

    case 'openai':
      response = await generateOpenAIResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as OpenRouterContext, maxTokens);
      break;
    case 'grok':
      response = await generateGrokResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as OpenRouterContext, maxTokens);
      break;
    case 'minimax': // Minimax is handled by OpenRouterService
    case 'venice': // Venice is handled by OpenRouterService
    case 'deepseek': // Deepseek is handled by OpenRouterService
    default:
      // Default to OpenRouter (Minimax) if no specific model is chosen or if it's an unknown model
      response = await generateOpenRouterResponse(userMessage, {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as OpenRouterContext, maxTokens);
      break;
  }

  // If the primary model failed, try fallback providers
  if (!response.success && modelToUse === 'openai') {
    console.log('OpenAI failed (possibly rate limited), falling back to OpenRouter...');
    response = await generateOpenRouterResponse(userMessage, {
      conversationHistory: context.conversationHistory,
      userEmotionalState: context.userEmotionalState,
      urgency: context.urgency,
      userName: context.userName,
    } as OpenRouterContext, maxTokens);
  }

  return response;
}
