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
import { generateAnthropicResponse } from './anthropicService';
import { generateMistralResponse } from './mistralService';
import { storage } from './storage';
import { config } from './config';
import { generateOpenAIResponse } from './openaiChatService';
import { getSemanticMemoryContext, searchMemoryCore } from './memoryService';
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

// Response cache for avoiding duplicate AI calls
const responseCache = new Map<string, { response: AIResponse, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const MEMORY_RELEVANCE_THRESHOLD = 8.0;
const CONTENT_TRUNCATION_SHORT = 200;
const CONTENT_TRUNCATION_MEDIUM = 250;
const CONTENT_TRUNCATION_LONG = 300;

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
  sceneContext?: any;
  voiceContext?: VoiceAnalysisResult;
  ambientContext?: AmbientContext;
}

async function enrichContextWithSemanticRetrieval(
  userMessage: string,
  context: DispatchContext
): Promise<string> {
  const userId = context.userId || 'default-user';
  try {
    const memoryContext = await getSemanticMemoryContext(userMessage, userId);
    const youtubeResults = await semanticSearchVideos(userMessage, {
      userId,
      topK: 2,
      minSimilarity: 0.7,
    });

    let enrichedContext = '';
    if (memoryContext) enrichedContext += memoryContext;
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

function buildAVRagContext(context: DispatchContext): AVRagContext | null {
  try {
    const scene = validateSceneContext(context.sceneContext);
    const voice = validateVoiceContext(context.voiceContext);
    if (!scene && !voice) return null;
    return createAVContext(scene || undefined, voice || undefined);
  } catch (error) {
    console.error('Error building A/V-RAG context:', error);
    return null;
  }
}

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('youtube') || lowerMessage.includes('video')) return 'Video analysis or playback request';
  if (lowerMessage.includes('meditat') || lowerMessage.includes('relax')) return 'Meditation or relaxation request';
  if (lowerMessage.includes('search') || lowerMessage.includes('find')) return 'Information search request';
  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) return 'Programming or technical assistance';
  if (lowerMessage.includes('weather')) return 'Weather information request';
  if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule')) return 'Calendar or scheduling request';
  return 'General conversation';
}

function buildAmbientContextString(ambient: AmbientContext): string {
  const parts: string[] = [];
  if (ambient.motionState && ambient.motionState !== 'unknown') parts.push(`User is currently ${ambient.motionState}`);
  if (ambient.lightLevel !== undefined) {
    const lightDescription = ambient.lightLevel > 70 ? 'bright' : ambient.lightLevel > 30 ? 'moderate' : 'low';
    parts.push(`ambient light is ${lightDescription} (${ambient.lightLevel}%)`);
  }
  if (ambient.deviceContext.battery !== null) {
    parts.push(`device battery at ${ambient.deviceContext.battery}%${ambient.deviceContext.charging ? ' (charging)' : ''}`);
  }
  if (ambient.deviceContext.network) parts.push(`connected via ${ambient.deviceContext.network}`);
  if (ambient.location) parts.push(`location available`);
  if (parts.length === 0) return '';
  return `\n\n[Real-time Context: ${parts.join(', ')}]`;
}

function detectUICommand(userMessage: string, responseContent: string): UICommand | undefined {
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes('youtube') && (lowerMessage.includes('analyze') || lowerMessage.includes('video') || lowerMessage.includes('watch'))) {
    const videoIdMatch = userMessage.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
      return { action: 'SHOW_COMPONENT', componentName: 'VideoAnalysisPanel', data: { videoId: videoIdMatch[1] }, metadata: { reason: 'User requested YouTube video analysis', priority: 'high' } };
    }
  }
  if (lowerMessage.includes('meditat') || lowerMessage.includes('relax') || lowerMessage.includes('calm') || lowerMessage.includes('breathing')) {
    return { action: 'SHOW_COMPONENT', componentName: 'GuidedMeditation', data: { duration: lowerMessage.includes('quick') ? 5 : 10 }, metadata: { reason: 'User requested meditation or relaxation', priority: 'medium' } };
  }
  if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look up') || lowerMessage.includes('what do you know about')) {
    return { action: 'SHOW_COMPONENT', componentName: 'KnowledgeBaseSearch', data: { query: userMessage }, metadata: { reason: 'User requested knowledge base search', priority: 'medium' } };
  }
  if (lowerMessage.includes('note') || lowerMessage.includes('write down') || lowerMessage.includes('remember this')) {
    return { action: 'SHOW_COMPONENT', componentName: 'SharedNotepad', data: {}, metadata: { reason: 'User wants to take notes', priority: 'low' } };
  }
  return undefined;
}

function generateMemoryBasedResponse(
  userMessage: string,
  memoryResults: Array<{ entry: { content: string; speaker: string }; relevanceScore: number; matchedTerms: string[] } >,
  userName: string
): string {
  const lowerMessage = userMessage.toLowerCase();
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const truncate = (content: string, maxLength: number): string => content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  const topMemory = memoryResults[0];
  const greetings = ['Hey', 'Hi', 'Hello'];
  const transitions = ['I remember', 'From what I recall', 'Based on our conversations', 'I know from our history that'];
  const closings = ['Is there anything else you\'d like to know, love?', 'What else can I help you with, sweetheart?', 'Let me know if you need more details!', 'Feel free to ask if you want me to elaborate, babe.'];
  const greeting = pickRandom(greetings);
  const transition = pickRandom(transitions);
  const closing = pickRandom(closings);
  if (lowerMessage.includes('remember') || lowerMessage.includes('recall') || lowerMessage.includes('told you')) {
    return `${greeting} ${userName}! ${transition}, we talked about this before. ${truncate(topMemory.entry.content, CONTENT_TRUNCATION_SHORT)} ${closing}`;
  }
  if (lowerMessage.includes('what') && (lowerMessage.includes('said') || lowerMessage.includes('mentioned'))) {
    return `${transition}: ${truncate(topMemory.entry.content, CONTENT_TRUNCATION_LONG)} ${closing}`;
  }
  return `${greeting} ${userName}! ${transition}: ${truncate(topMemory.entry.content, CONTENT_TRUNCATION_MEDIUM)}\n\n${closing}`;
}

export async function dispatchAIResponse(
  userMessage: string,
  context: DispatchContext,
  maxTokens?: number,
  traceId?: string
): Promise<AIResponse> {
  const requestTraceId = traceId || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const cacheKey = `${userMessage.substring(0, 100)}-${context.userId || 'anon'}`;
  const cached = responseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`🔍 [TRACE:${requestTraceId}] Cache hit for key: ${cacheKey}`);
    return cached.response;
  }
  
  console.log(`🔍 [TRACE:${requestTraceId}] dispatchAIResponse - Starting`);
  const startTime = Date.now();
  const userId = context.userId || 'default-user';

  // Memory-First Check
  try {
    const memoryResults = await searchMemoryCore(userMessage, 5, userId);
    const topScore = memoryResults.length > 0 ? memoryResults[0].relevanceScore : 0;
    
    if (topScore >= MEMORY_RELEVANCE_THRESHOLD && memoryResults.length > 0) {
      console.log(`🧠 [TRACE:${requestTraceId}] Using memory-based response (score ${topScore.toFixed(2)})`);
      const memoryBasedResponse = generateMemoryBasedResponse(userMessage, memoryResults, context.userName);
      const response: AIResponse = { content: memoryBasedResponse, success: true, xaiSessionId: requestTraceId };
      responseCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    }
  } catch (error) {
    console.error(`🔍 [TRACE:${requestTraceId}] Memory search error:`, error);
  }

  const xaiSessionId = startReasoningSession(context.userId || 'anonymous');
  const intent = detectIntent(userMessage);
  trackCommandIntent(xaiSessionId, intent);

  // Context Enrichment
  let ambientContext: AmbientContext | null = null;
  if (context.userId) ambientContext = getAmbientContext(context.userId);
  let activePersona: ActiveUserPersona | null = null;
  if (context.userId) {
    try { activePersona = await generateActivePersona(context.userId, userMessage); } catch (e) { console.error(e); }
  }
  let adaptivePersona = null;
  try { const { getActivePersonaConfig } = await import('./selfEvolutionService'); adaptivePersona = getActivePersonaConfig(); } catch (e) {}
  
  const semanticContext = await enrichContextWithSemanticRetrieval(userMessage, context);
  const avContext = buildAVRagContext(context);

  let augmentedMessage = userMessage;
  if (adaptivePersona?.systemPromptModifier) augmentedMessage = `[PERSONA DIRECTIVE]: ${adaptivePersona.systemPromptModifier}\n\n` + augmentedMessage;
  if (activePersona) augmentedMessage = formatPersonaForPrompt(activePersona) + '\n\n' + augmentedMessage;
  if (semanticContext) augmentedMessage += `\n\n---\nContext from knowledge base:${semanticContext}`;
  if (avContext) augmentedMessage = enrichMessageWithAVContext(augmentedMessage, avContext);
  if (ambientContext) augmentedMessage += buildAmbientContextString(ambientContext);

  // === DYNAMIC MODEL SELECTION & FALLBACK CHAIN ===
  // Priority: OpenAI -> Anthropic -> xAI -> Mistral -> OpenRouter
  
  let response: AIResponse = { content: '', success: false };
  let modelUsed = 'none';

  // 0. Local Model Preference (Highest Priority if enabled)
  if (config.localModel?.enabled && config.localModel?.preferLocal) {
    console.log('🤖 Local model preference enabled');
    const { offlineService } = await import('./offlineModelService');
    const localResponse = await offlineService.generateResponse(augmentedMessage, '');
    if (localResponse.success) {
      response = { content: localResponse.content, success: true };
      modelUsed = 'local';
    }
  }

  // 1. OpenAI
  if (!response.success && config.openai.apiKey) {
    console.log('Trying OpenAI...');
    response = await generateOpenAIResponse(augmentedMessage, {
      conversationHistory: context.conversationHistory,
      userName: context.userName,
      userEmotionalState: context.userEmotionalState,
      urgency: context.urgency,
    } as any, maxTokens || 1024);
    if (response.success) modelUsed = 'openai';
  }

  // 2. Anthropic
  if (!response.success && config.anthropic?.apiKey) {
    console.log('Trying Anthropic...');
    response = await generateAnthropicResponse(augmentedMessage, {
      conversationHistory: context.conversationHistory,
      userEmotionalState: context.userEmotionalState,
      urgency: context.urgency,
      userName: context.userName,
    });
    if (response.success) modelUsed = 'anthropic';
  }

  // 3. xAI (Grok)
  if (!response.success && config.xai.apiKey) {
    console.log('Trying xAI...');
    response = await generateXAIResponse(augmentedMessage, {
      conversationHistory: context.conversationHistory,
      userEmotionalState: context.userEmotionalState,
      urgency: context.urgency,
      userName: context.userName,
    } as XAIPersonalityContext, maxTokens);
    if (response.success) modelUsed = 'xai';
  }

  // 4. Mistral
  if (!response.success && config.mistral?.apiKey) { 
    console.log('Trying Mistral...');
    response = await generateMistralResponse(augmentedMessage, {
      conversationHistory: context.conversationHistory,
      userEmotionalState: context.userEmotionalState,
      urgency: context.urgency,
      userName: context.userName,
    });
    if (response.success) modelUsed = 'mistral';
  }

  // 5. OpenRouter (Fallback for everything else)
  if (!response.success) {
    console.log('Falling back to OpenRouter...');
    response = await generateOpenRouterResponse(augmentedMessage, {
      conversationHistory: context.conversationHistory,
      userEmotionalState: context.userEmotionalState,
      urgency: context.urgency,
      userName: context.userName,
    } as OpenRouterContext, maxTokens);
    if (response.success) modelUsed = 'openrouter';
  }

  // Track response and detect UI commands
  if (response.success) {
    trackResponseGeneration(xaiSessionId, modelUsed, undefined, undefined);
    addReasoningStep(xaiSessionId, 'response', 'Model Selected', `Responded using ${modelUsed}`);

    const uiCommand = detectUICommand(userMessage, response.content || '');
    if (uiCommand) {
      response.uiCommand = uiCommand;
      addReasoningStep(xaiSessionId, 'response', 'UI Command Detected', JSON.stringify(uiCommand));
    }
  }

  response.xaiSessionId = xaiSessionId;
  responseCache.set(cacheKey, { response, timestamp: Date.now() });

  const duration = Date.now() - startTime;
  console.log(`🔍 [TRACE:${requestTraceId}] dispatchAIResponse - Completed in ${duration}ms. Model: ${modelUsed}`);

  return response;
}