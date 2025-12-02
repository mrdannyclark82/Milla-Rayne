import {
  generateXAIResponse,
  PersonalityContext as XAIPersonalityContext,
} from './xaiService';

const responseCache = new Map<string, { response: AIResponse, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  createAVContext,
} from './avRagService';
import type { VoiceAnalysisResult } from './voiceAnalysisService';
import type { UICommand } from '../shared/schema';
import {
  startReasoningSession,
  trackCommandIntent,
  trackToolSelection,
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
  createAVContext,
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
import { getAmbientContext, type AmbientContext } from './realWorldInfoService';
import {
  generateActivePersona,
  formatPersonaForPrompt,
  type ActiveUserPersona,
} from './personaFusionService';

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
  // Real-time ambient context
  ambientContext?: AmbientContext;
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
      const youtubeParts = youtubeResults.map(
        (result, index) =>
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

/**
 * Build ambient context string from mobile sensor data
 */
function buildAmbientContextString(ambient: AmbientContext): string {
  const parts: string[] = [];

  // Motion state
  if (ambient.motionState && ambient.motionState !== 'unknown') {
    parts.push(`User is currently ${ambient.motionState}`);
  }

  // Light level
  if (ambient.lightLevel !== undefined) {
    const lightDescription =
      ambient.lightLevel > 70
        ? 'bright'
        : ambient.lightLevel > 30
          ? 'moderate'
          : 'low';
    parts.push(`ambient light is ${lightDescription} (${ambient.lightLevel}%)`);
  }

  // Battery and charging
  if (ambient.deviceContext.battery !== null) {
    parts.push(
      `device battery at ${ambient.deviceContext.battery}%${ambient.deviceContext.charging ? ' (charging)' : ''}`
    );
  }

  // Network
  if (ambient.deviceContext.network) {
    parts.push(`connected via ${ambient.deviceContext.network}`);
  }

  // Location (general info without revealing specific coordinates)
  if (ambient.location) {
    parts.push(`location available`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\n[Real-time Context: ${parts.join(', ')}]`;
}

export async function dispatchAIResponse(
  userMessage: string,
  context: DispatchContext,
  maxTokens?: number,
  traceId?: string // P1.5: Add optional trace ID parameter
): Promise<AIResponse> {
  // P1.5: Generate trace ID if not provided
  const requestTraceId = traceId || `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const cacheKey = `${userMessage}-${JSON.stringify(context)}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`🔍 [TRACE:${requestTraceId}] Cache hit for key: ${cacheKey}`);
    return cached.response;
  }
  console.log(`🔍 [TRACE:${requestTraceId}] dispatchAIResponse - Starting`);
  console.log(
    `🔍 [TRACE:${requestTraceId}] User: ${context.userId || 'anonymous'}, Message length: ${userMessage.length}`
  );

  const startTime = Date.now();

  // Start XAI reasoning session
  const xaiSessionId = startReasoningSession(context.userId || 'anonymous');
  console.log(`🔍 [TRACE:${requestTraceId}] XAI Session: ${xaiSessionId}`);

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
    addReasoningStep(
      xaiSessionId,
      'tools',
      'Model Selection',
      'Selected Grok for code-related query'
    );
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

  // Fetch real-time ambient context from mobile sensors
  let ambientContext: AmbientContext | null = null;
  if (context.userId) {
    ambientContext = getAmbientContext(context.userId);
    if (ambientContext) {
      context.ambientContext = ambientContext;
      addReasoningStep(
        xaiSessionId,
        'tools',
        'Ambient Context Retrieved',
        `Motion: ${ambientContext.motionState}, Light: ${ambientContext.lightLevel}%`,
        { ambientContext }
      );
      console.log('📱 Using real-time ambient context:', {
        motion: ambientContext.motionState,
        light: ambientContext.lightLevel,
      });
    }
  }

  // Generate Active User Persona (Phase III/IV Bridge)
  let activePersona: ActiveUserPersona | null = null;
  if (context.userId) {
    try {
      activePersona = await generateActivePersona(context.userId, userMessage);
      addReasoningStep(
        xaiSessionId,
        'tools',
        'Active Persona Generated',
        `Synthesized persona for ${activePersona.profile.name}`,
        { personaSummary: activePersona.personaSummary }
      );
      console.log(
        '🎭 Active User Persona generated:',
        activePersona.personaSummary
      );
    } catch (error) {
      console.error('Error generating active persona:', error);
    }
  }

  // Get Adaptive Persona Configuration (Phase IV - A/B Testing)
  let adaptivePersona = null;
  const conversationStartTime = Date.now();
  try {
    const { getActivePersonaConfig } = await import('./selfEvolutionService');
    adaptivePersona = getActivePersonaConfig();
    addReasoningStep(
      xaiSessionId,
      'tools',
      'Adaptive Persona Selected',
      `Using ${adaptivePersona.name} persona (${adaptivePersona.style})`,
      {
        personaId: adaptivePersona.id,
        temperature: adaptivePersona.temperature,
      }
    );
    console.log(
      `🧠 Adaptive Persona: ${adaptivePersona.name} (temp: ${adaptivePersona.temperature})`
    );
  } catch (error) {
    console.error('Error getting adaptive persona:', error);
  }

  // Enrich context with semantic retrieval (V-RAG)
  const semanticStartTime = Date.now();
  const semanticContext = await enrichContextWithSemanticRetrieval(
    userMessage,
    context
  );
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

  // Add Adaptive Persona System Prompt Modifier (Phase IV)
  if (adaptivePersona && adaptivePersona.systemPromptModifier) {
    augmentedMessage =
      `[PERSONA DIRECTIVE]: ${adaptivePersona.systemPromptModifier}\n\n` +
      augmentedMessage;
    console.log('✅ Enhanced with Adaptive Persona directive');
  }

  // Add Active User Persona (if available)
  if (activePersona) {
    const personaPrompt = formatPersonaForPrompt(activePersona);
    augmentedMessage = personaPrompt + '\n\n' + augmentedMessage;
    console.log('✅ Enhanced with Active User Persona');
  }

  // Add semantic context
  if (semanticContext) {
    augmentedMessage += `\n\n---\nContext from knowledge base:${semanticContext}`;
  }

  // Add A/V context
  if (avContext) {
    augmentedMessage = enrichMessageWithAVContext(augmentedMessage, avContext);
    console.log('✅ Enhanced with A/V-RAG context (scene + voice)');
  }

  // Add real-time ambient context from mobile sensors
  if (ambientContext) {
    augmentedMessage += buildAmbientContextString(ambientContext);
    console.log('✅ Enhanced with real-time ambient context');
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
    addReasoningStep(
      xaiSessionId,
      'response',
      'Fallback Triggered',
      'Primary model failed, falling back to OpenRouter'
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

  // Track response generation
  trackResponseGeneration(
    xaiSessionId,
    modelToUse || 'openai',
    undefined,
    undefined
  );

  // Generate UI commands based on user message and response content
  const uiCommand = detectUICommand(userMessage, response.content || '');
  if (uiCommand) {
    response.uiCommand = uiCommand;
    addReasoningStep(
      xaiSessionId,
      'response',
      'UI Command Detected',
      JSON.stringify(uiCommand)
    );
    console.log('✨ Generated UI command:', uiCommand);
  }

  // Attach XAI session ID to response
  response.xaiSessionId = xaiSessionId;

  // Record Adaptive Persona Test Result (Phase IV - A/B Testing)
  if (adaptivePersona && context.userId) {
    const conversationEndTime = Date.now();
    const responseTime = conversationEndTime - conversationStartTime;

    // Calculate outcome metrics
    const taskCompletionRate = response.success ? 0.95 : 0.3; // Inferred from success
    const userSatisfactionScore = response.success ? 4.0 : 2.0; // Estimated (will be updated by surveys)
    const engagementLevel = response.content
      ? Math.min(response.content.length / 500, 1.0)
      : 0.5;

    try {
      const { recordPersonaTestResult } = await import(
        './selfEvolutionService'
      );
      await recordPersonaTestResult(
        adaptivePersona.id,
        xaiSessionId, // Use XAI session as conversation ID
        context.userId,
        {
          taskCompletionRate,
          userSatisfactionScore,
          responseTime,
          engagementLevel,
        },
        response.success ? 'success' : 'failure'
      );
      console.log(
        `📊 Recorded persona test result for ${adaptivePersona.name}`
      );
    } catch (error) {
      console.error('Error recording persona test result:', error);
    }
  }

  // P1.5: Log end of trace with duration
  const duration = Date.now() - startTime;
  console.log(
    `🔍 [TRACE:${requestTraceId}] dispatchAIResponse - Completed in ${duration}ms`
  );
responseCache.set(cacheKey, { response, timestamp: Date.now() });
  console.log(
    `🔍 [TRACE:${requestTraceId}] Model: ${modelToUse}, Success: ${response.success}`
  );

  return response;
}

/**
 * Detect if the user message or AI response should trigger a UI command
 */
function detectUICommand(
  userMessage: string,
  responseContent: string
): UICommand | undefined {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = responseContent.toLowerCase();

  // Detect YouTube video analysis requests
  if (
    lowerMessage.includes('youtube') &&
    (lowerMessage.includes('analyze') ||
      lowerMessage.includes('video') ||
      lowerMessage.includes('watch'))
  ) {
    // Extract video ID if present in the message
    const videoIdMatch = userMessage.match(
      /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
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
