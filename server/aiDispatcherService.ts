import {
  generateXAIResponse,
  PersonalityContext as XAIPersonalityContext,
} from './xaiService';
import {
  generateOpenRouterResponse,
  generateGrokResponse,
  OpenRouterContext,
} from './openrouterService';
import { generateGeminiResponse } from './geminiService';
import { storage } from './storage';
import { config } from './config';
import { generateOpenAIResponse } from './openaiChatService';
import { getSemanticMemoryContext } from './memoryService';
import { semanticSearchVideos } from './youtubeKnowledgeBase';
import { 
  type AVRagContext, 
  enrichMessageWithAVContext,
  validateSceneContext,
  validateVoiceContext,
  createAVContext 
} from './avRagService';
import type { VoiceAnalysisResult } from './voiceAnalysisService';

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
  // A/V-RAG context
  sceneContext?: any;
  voiceContext?: VoiceAnalysisResult;
}

/**
 * Enrich context with semantic retrieval from vector database
 */
async function enrichContextWithSemanticRetrieval(
  userMessage: string,
  context: DispatchContext
): Promise<string> {
  const userId = context.userId || 'default-user';
  
  try {
    // Get semantic memory context
    const memoryContext = await getSemanticMemoryContext(userMessage, userId);
    
    // Search for relevant YouTube knowledge
    const youtubeResults = await semanticSearchVideos(userMessage, {
      userId,
      topK: 2,
      minSimilarity: 0.7,
    });
    
    let enrichedContext = '';
    
    if (memoryContext) {
      enrichedContext += memoryContext;
    }
    
    if (youtubeResults.length > 0) {
      const youtubeParts = youtubeResults.map((result, index) => 
        `YouTube Knowledge ${index + 1} (${result.video.title}, relevance: ${(result.similarity * 100).toFixed(1)}%):\n${result.video.summary}`
      );
      enrichedContext += `\n\nRelevant YouTube knowledge:\n${youtubeParts.join('\n\n')}`;
    }
    
    return enrichedContext;
  } catch (error) {
    console.error('Error enriching context with semantic retrieval:', error);
    return '';
  }
}

/**
 * Build A/V-RAG context from scene and voice data
 */
function buildAVRagContext(context: DispatchContext): AVRagContext | null {
  try {
    const scene = validateSceneContext(context.sceneContext);
    const voice = validateVoiceContext(context.voiceContext);
    
    if (!scene && !voice) {
      return null;
    }
    
    return createAVContext(scene || undefined, voice || undefined);
  } catch (error) {
    console.error('Error building A/V-RAG context:', error);
    return null;
  }
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
      const userModelPreference = await (
        storage as any
      ).getUserPreferredAIModel?.(context.userId);
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
  const codeKeywords = [
    'github repository',
    'pull request',
    'git commit',
    'code review',
    'programming',
  ];
  const hasCodeContext = codeKeywords.some((keyword) =>
    userMessage.toLowerCase().includes(keyword)
  );

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

  console.log(
    `Dispatching AI response using model: ${modelToUse} (preferred: ${preferredModel})`
  );

  console.log(`--- Dispatching to model: ${modelToUse} ---`);

  // Enrich context with semantic retrieval (V-RAG)
  const semanticContext = await enrichContextWithSemanticRetrieval(userMessage, context);
  
  // Build A/V-RAG context from scene and voice data
  const avContext = buildAVRagContext(context);
  
  // Augment user message with all context layers
  let augmentedMessage = userMessage;
  
  // Add semantic context
  if (semanticContext) {
    augmentedMessage += `\n\n---\nContext from knowledge base:${semanticContext}`;
  }
  
  // Add A/V context
  if (avContext) {
    augmentedMessage = enrichMessageWithAVContext(augmentedMessage, avContext);
    console.log('✅ Enhanced with A/V-RAG context (scene + voice)');
  }

  let response: AIResponse;

  switch (modelToUse) {
    case 'openai':
      // Use OpenAI chat wrapper (supports both conversation array or full PersonalityContext)
      response = await generateOpenAIResponse(
        augmentedMessage,
        {
          conversationHistory: context.conversationHistory,
          userName: context.userName,
          userEmotionalState: context.userEmotionalState,
          urgency: context.urgency,
        } as any,
        maxTokens || 1024
      );
      break;

    case 'xai':
      response = await generateXAIResponse(
        augmentedMessage,
        {
          conversationHistory: context.conversationHistory,
          userEmotionalState: context.userEmotionalState,
          urgency: context.urgency,
          userName: context.userName,
        } as XAIPersonalityContext,
        maxTokens
      );
      break;
    case 'gemini':
      response = await generateGeminiResponse(augmentedMessage);
      break;

    case 'grok':
      response = await generateGrokResponse(
        augmentedMessage,
        {
          conversationHistory: context.conversationHistory,
          userEmotionalState: context.userEmotionalState,
          urgency: context.urgency,
          userName: context.userName,
        } as OpenRouterContext,
        maxTokens
      );
      break;
    case 'minimax': // Minimax is handled by OpenRouterService
    case 'venice': // Venice is handled by OpenRouterService
    case 'deepseek': // Deepseek is handled by OpenRouterService
    default:
      // Default to OpenRouter (Minimax) if no specific model is chosen or if it's an unknown model
      response = await generateOpenRouterResponse(
        augmentedMessage,
        {
          conversationHistory: context.conversationHistory,
          userEmotionalState: context.userEmotionalState,
          urgency: context.urgency,
          userName: context.userName,
        } as OpenRouterContext,
        maxTokens
      );
      break;
  }

  // If the primary model failed, try fallback providers
  if (!response.success && modelToUse === 'openai') {
    console.log(
      'OpenAI failed (possibly rate limited), falling back to OpenRouter...'
    );
    response = await generateOpenRouterResponse(
      augmentedMessage,
      {
        conversationHistory: context.conversationHistory,
        userEmotionalState: context.userEmotionalState,
        urgency: context.urgency,
        userName: context.userName,
      } as OpenRouterContext,
      maxTokens
    );
  }

  return response;
}
