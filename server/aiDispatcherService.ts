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
import type { UICommand } from '../shared/schema';
import {
  startReasoningSession,
  trackCommandIntent,
  trackToolSelection,
  trackMemoryRetrieval,
  trackResponseGeneration,
  getReasoningData,
  addReasoningStep,
  type XAIData,
} from './xaiTracker';

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
  uiCommand?: UICommand;
  xaiSessionId?: string;
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

/**
 * Detect user intent from message for XAI tracking
 */
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('youtube') || lowerMessage.includes('video')) {
    return 'Video analysis or playback request';
  }
  if (lowerMessage.includes('meditat') || lowerMessage.includes('relax')) {
    return 'Meditation or relaxation request';
  }
  if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
    return 'Information search request';
  }
  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return 'Programming or technical assistance';
  }
  if (lowerMessage.includes('weather')) {
    return 'Weather information request';
  }
  if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule')) {
    return 'Calendar or scheduling request';
  }
  
  return 'General conversation';
}

export async function dispatchAIResponse(
  userMessage: string,
  context: DispatchContext,
  maxTokens?: number
): Promise<AIResponse> {
  console.log('--- dispatchAIResponse called ---');
  
  // Start XAI reasoning session
  const xaiSessionId = startReasoningSession(context.userId || 'anonymous');
  
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
  // Track command intent
  const intent = detectIntent(userMessage);
  trackCommandIntent(xaiSessionId, intent);
  
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
    addReasoningStep(xaiSessionId, 'tools', 'Model Selection', 'Selected Grok for code-related query');
  }

  // Agent command override
  const agentMatch = userMessage.match(/^agent\s+(\w+)\s+(.*)/i);
  if (agentMatch) {
    const [, agentName, task] = agentMatch;
    console.log(`Dispatching to agent: ${agentName} with task: ${task}`);
    trackToolSelection(xaiSessionId, [`Agent: ${agentName}`]);
    const { agentController } = await import('./agentController');
    const result = await agentController.dispatch(agentName, task);
    return { 
      content: result, 
      success: true,
      xaiSessionId,
    };
  }
  // Add more sophisticated logic here based on intent, emotional state, etc.

  console.log(
    `Dispatching AI response using model: ${modelToUse} (preferred: ${preferredModel})`
  );

  console.log(`--- Dispatching to model: ${modelToUse} ---`);

  // Enrich context with semantic retrieval (V-RAG)
  const semanticStartTime = Date.now();
  const semanticContext = await enrichContextWithSemanticRetrieval(userMessage, context);
  const semanticEndTime = Date.now();
  
  // Track memory retrieval
  if (semanticContext) {
    addReasoningStep(
      xaiSessionId,
      'memory',
      'Semantic Context Retrieved',
      `Retrieved relevant context (${semanticEndTime - semanticStartTime}ms)`,
      { processingTime: semanticEndTime - semanticStartTime }
    );
  }
  
  // Build A/V-RAG context from scene and voice data
  const avContext = buildAVRagContext(context);
  
  // Track A/V context if available
  if (avContext) {
    const avTools = [];
    if (avContext.scene) avTools.push('Scene Detection');
    if (avContext.voice) avTools.push('Voice Analysis');
    trackToolSelection(xaiSessionId, avTools);
  }
  
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
    addReasoningStep(xaiSessionId, 'response', 'Fallback Triggered', 'Primary model failed, falling back to OpenRouter');
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

  // Track response generation
  trackResponseGeneration(xaiSessionId, modelToUse, undefined, undefined);

  // Generate UI commands based on user message and response content
  const uiCommand = detectUICommand(userMessage, response.content);
  if (uiCommand) {
    response.uiCommand = uiCommand;
    addReasoningStep(xaiSessionId, 'response', 'UI Command Detected', JSON.stringify(uiCommand));
    console.log('✨ Generated UI command:', uiCommand);
  }

  // Attach XAI session ID to response
  response.xaiSessionId = xaiSessionId;

  return response;
}

/**
 * Detect if the user message or AI response should trigger a UI command
 */
function detectUICommand(userMessage: string, responseContent: string): UICommand | undefined {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = responseContent.toLowerCase();
  
  // Detect YouTube video analysis requests
  if (
    lowerMessage.includes('youtube') && 
    (lowerMessage.includes('analyze') || lowerMessage.includes('video') || lowerMessage.includes('watch'))
  ) {
    // Extract video ID if present in the message
    const videoIdMatch = userMessage.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
      return {
        action: 'SHOW_COMPONENT',
        componentName: 'VideoAnalysisPanel',
        data: {
          videoId: videoIdMatch[1],
        },
        metadata: {
          reason: 'User requested YouTube video analysis',
          priority: 'high',
        },
      };
    }
  }
  
  // Detect meditation/relaxation requests
  if (
    lowerMessage.includes('meditat') ||
    lowerMessage.includes('relax') ||
    lowerMessage.includes('calm') ||
    lowerMessage.includes('breathing')
  ) {
    return {
      action: 'SHOW_COMPONENT',
      componentName: 'GuidedMeditation',
      data: {
        duration: lowerMessage.includes('quick') ? 5 : 10,
      },
      metadata: {
        reason: 'User requested meditation or relaxation',
        priority: 'medium',
      },
    };
  }
  
  // Detect knowledge base search requests
  if (
    lowerMessage.includes('search') ||
    lowerMessage.includes('find') ||
    lowerMessage.includes('look up') ||
    lowerMessage.includes('what do you know about')
  ) {
    return {
      action: 'SHOW_COMPONENT',
      componentName: 'KnowledgeBaseSearch',
      data: {
        query: userMessage,
      },
      metadata: {
        reason: 'User requested knowledge base search',
        priority: 'medium',
      },
    };
  }
  
  // Detect note-taking requests
  if (
    lowerMessage.includes('note') ||
    lowerMessage.includes('write down') ||
    lowerMessage.includes('remember this')
  ) {
    return {
      action: 'SHOW_COMPONENT',
      componentName: 'SharedNotepad',
      data: {},
      metadata: {
        reason: 'User wants to take notes',
        priority: 'low',
      },
    };
  }
  
  return undefined;
}
