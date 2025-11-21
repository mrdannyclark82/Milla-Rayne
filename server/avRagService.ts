/**
 * A/V-RAG Service (Audio/Visual Retrieval-Augmented Generation)
 *
 * Integrates real-time scene data and voice tone/emotion analysis
 * into LLM prompts for contextually-aware responses.
 *
 * Features:
 * - Scene context extraction (time of day, location, weather, app state)
 * - Voice emotion analysis integration
 * - Contextual prompt building
 * - Multi-modal context enrichment
 */

import type { VoiceAnalysisResult } from './voiceAnalysisService';

// Scene context types (matching SceneContext.tsx)
export interface SceneContextData {
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  appState: 'idle' | 'chatting' | 'listening' | 'thinking' | 'error';
  location: string;
  weatherEffect: 'none' | 'rain' | 'snow' | 'fog';
  performanceMode: 'quality' | 'balanced' | 'performance';
  reducedMotion: boolean;
  isBackgrounded: boolean;
  theme?: {
    palette: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
    };
    gradientAngle: number;
    animationSpeed: number;
    parallaxIntensity: number;
  };
}

export interface AVRagContext {
  scene?: SceneContextData;
  voice?: VoiceAnalysisResult;
  timestamp: string;
}

// ===========================================================================================
// SCENE CONTEXT EXTRACTION
// ===========================================================================================

/**
 * Extract meaningful context from scene data for LLM prompts
 */
export function extractSceneContext(scene: SceneContextData): string {
  const contextParts: string[] = [];

  // Time of day context
  const timeDescriptions = {
    dawn: 'early morning (dawn)',
    day: 'daytime',
    dusk: 'evening (dusk)',
    night: 'nighttime',
  };
  contextParts.push(`Current time: ${timeDescriptions[scene.timeOfDay]}`);

  // Location context
  if (scene.location) {
    contextParts.push(`Location context: ${scene.location}`);
  }

  // Weather effects
  if (scene.weatherEffect && scene.weatherEffect !== 'none') {
    contextParts.push(`Weather effect: ${scene.weatherEffect}`);
  }

  // App state - indicates what user is doing
  const stateDescriptions = {
    idle: 'User is idle',
    chatting: 'User is actively chatting',
    listening: 'User is listening/waiting',
    thinking: 'Processing user request',
    error: 'Error state',
  };
  contextParts.push(stateDescriptions[scene.appState]);

  // User preferences
  if (scene.reducedMotion) {
    contextParts.push('User prefers reduced motion/animations');
  }

  if (scene.isBackgrounded) {
    contextParts.push('App is in background (user may be multitasking)');
  }

  return contextParts.join('. ');
}

/**
 * Get atmospheric context based on scene
 */
export function getAtmosphericContext(scene: SceneContextData): string {
  const { timeOfDay, weatherEffect } = scene;

  // Combine time and weather for atmospheric description
  const atmospheres: Record<string, Record<string, string>> = {
    dawn: {
      none: 'the peaceful early morning light',
      rain: 'a gentle morning rain',
      snow: 'a serene snowy dawn',
      fog: 'a misty morning atmosphere',
    },
    day: {
      none: 'the bright daylight',
      rain: 'a rainy afternoon',
      snow: 'a snowy day',
      fog: 'a foggy day',
    },
    dusk: {
      none: 'the warm evening light',
      rain: 'an evening rain',
      snow: 'a snowy evening',
      fog: 'a foggy dusk',
    },
    night: {
      none: 'the quiet nighttime',
      rain: 'a rainy night',
      snow: 'a snowy night',
      fog: 'a foggy night',
    },
  };

  return atmospheres[timeOfDay][weatherEffect] || 'the current environment';
}

// ===========================================================================================
// VOICE EMOTION INTEGRATION
// ===========================================================================================

/**
 * Extract emotional context from voice analysis
 */
export function extractVoiceContext(voice: VoiceAnalysisResult): string {
  const contextParts: string[] = [];

  if (!voice.success) {
    return '';
  }

  // Emotional tone
  const emotionDescriptions = {
    positive: 'User sounds positive and upbeat',
    negative: 'User may be feeling down or stressed',
    neutral: 'User has a calm, neutral tone',
    unknown: '',
  };

  if (voice.emotionalTone !== 'unknown') {
    contextParts.push(emotionDescriptions[voice.emotionalTone]);
  }

  return contextParts.join('. ');
}

/**
 * Get empathetic response guidance based on voice emotion
 */
export function getEmpatheticGuidance(voice: VoiceAnalysisResult): string {
  if (!voice.success || voice.emotionalTone === 'unknown') {
    return '';
  }

  const guidance = {
    positive: 'Match their positive energy and enthusiasm',
    negative: 'Be extra supportive and compassionate',
    neutral: 'Maintain a balanced, helpful tone',
  };

  return guidance[voice.emotionalTone] || '';
}

// ===========================================================================================
// CONTEXTUAL PROMPT BUILDING
// ===========================================================================================

/**
 * Build enriched contextual input for LLM from A/V data
 */
export function buildAVRagContext(avContext: AVRagContext): string {
  const contextSections: string[] = [];

  // Scene context
  if (avContext.scene) {
    const sceneCtx = extractSceneContext(avContext.scene);
    const atmosphere = getAtmosphericContext(avContext.scene);

    contextSections.push(
      `[Scene Context] ${sceneCtx}. The atmosphere is ${atmosphere}.`
    );
  }

  // Voice/emotion context
  if (avContext.voice && avContext.voice.success) {
    const voiceCtx = extractVoiceContext(avContext.voice);
    const guidance = getEmpatheticGuidance(avContext.voice);

    if (voiceCtx) {
      contextSections.push(`[Voice Analysis] ${voiceCtx}.`);
    }

    if (guidance) {
      contextSections.push(`[Response Guidance] ${guidance}.`);
    }
  }

  if (contextSections.length === 0) {
    return '';
  }

  return `\n\n---\nContextual awareness:\n${contextSections.join('\n')}`;
}

/**
 * Enrich user message with A/V context for LLM
 */
export function enrichMessageWithAVContext(
  userMessage: string,
  avContext: AVRagContext
): string {
  const contextString = buildAVRagContext(avContext);

  if (!contextString) {
    return userMessage;
  }

  return `${userMessage}${contextString}`;
}

/**
 * Create A/V context from available data
 */
export function createAVContext(
  scene?: SceneContextData,
  voice?: VoiceAnalysisResult
): AVRagContext {
  return {
    scene,
    voice,
    timestamp: new Date().toISOString(),
  };
}

// ===========================================================================================
// CONTEXT VALIDATION
// ===========================================================================================

/**
 * Validate and sanitize scene context data
 */
export function validateSceneContext(scene: any): SceneContextData | null {
  if (!scene) return null;

  // Validate required fields
  const validTimeOfDay = ['dawn', 'day', 'dusk', 'night'];
  const validAppState = ['idle', 'chatting', 'listening', 'thinking', 'error'];
  const validWeather = ['none', 'rain', 'snow', 'fog'];

  if (!validTimeOfDay.includes(scene.timeOfDay)) {
    console.warn('Invalid timeOfDay in scene context');
    return null;
  }

  if (!validAppState.includes(scene.appState)) {
    console.warn('Invalid appState in scene context');
    return null;
  }

  return {
    timeOfDay: scene.timeOfDay,
    appState: scene.appState,
    location: scene.location || 'unknown',
    weatherEffect: validWeather.includes(scene.weatherEffect)
      ? scene.weatherEffect
      : 'none',
    performanceMode: scene.performanceMode || 'balanced',
    reducedMotion: Boolean(scene.reducedMotion),
    isBackgrounded: Boolean(scene.isBackgrounded),
    theme: scene.theme,
  };
}

/**
 * Validate voice analysis result
 */
export function validateVoiceContext(voice: any): VoiceAnalysisResult | null {
  if (!voice || typeof voice !== 'object') return null;

  const validEmotions = ['positive', 'negative', 'neutral', 'unknown'];

  if (!validEmotions.includes(voice.emotionalTone)) {
    console.warn('Invalid emotionalTone in voice context');
    return null;
  }

  return {
    text: voice.text || '',
    emotionalTone: voice.emotionalTone,
    success: Boolean(voice.success),
    error: voice.error,
  };
}

// ===========================================================================================
// EXAMPLE USAGE
// ===========================================================================================

/**
 * Example of how to use A/V-RAG in a chat handler
 */
export function exampleUsage() {
  const sceneData: SceneContextData = {
    timeOfDay: 'night',
    appState: 'chatting',
    location: 'workspace',
    weatherEffect: 'rain',
    performanceMode: 'balanced',
    reducedMotion: false,
    isBackgrounded: false,
  };

  const voiceData: VoiceAnalysisResult = {
    text: 'I need help with my code',
    emotionalTone: 'neutral',
    success: true,
  };

  const avContext = createAVContext(sceneData, voiceData);
  const userMessage = 'Can you help me debug this function?';
  const enrichedMessage = enrichMessageWithAVContext(userMessage, avContext);

  console.log('Original:', userMessage);
  console.log('Enriched:', enrichedMessage);
}
