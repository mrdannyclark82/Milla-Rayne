/**
 * Voice provider types and interfaces for multi-provider TTS support
 * Supports web, Android, and future platform integrations
 */

/**
 * Supported voice providers
 */
export type VoiceProvider = 
  | 'browser-native'     // Web Speech API (default fallback)
  | 'google-cloud'       // Google Cloud Text-to-Speech
  | 'azure'              // Azure Cognitive Services TTS
  | 'elevenlabs'         // ElevenLabs TTS
  | 'coqui';             // Coqui TTS (local/self-hosted)

/**
 * Platform detection
 */
export type Platform = 'web' | 'android' | 'ios';

/**
 * Voice quality modes
 */
export type VoiceQuality = 
  | 'low-latency'        // Optimized for speed
  | 'high-fidelity';     // Optimized for quality

/**
 * Voice accent support
 */
export type VoiceAccent = 
  | 'en-US'              // General US English
  | 'en-US-Southern'     // US English (Southern)
  | 'en-US-Standard'     // US English (Standard)
  | 'en-GB'              // British English
  | 'en-AU';             // Australian English

/**
 * Voice configuration
 */
export interface VoiceConfig {
  provider: VoiceProvider;
  accent?: VoiceAccent;
  quality?: VoiceQuality;
  rate?: number;         // Speech rate (0.25 to 4.0)
  pitch?: number;        // Voice pitch (0.0 to 2.0)
  volume?: number;       // Volume (0.0 to 1.0)
  voiceName?: string;    // Specific voice name for provider
  streaming?: boolean;   // Enable streaming for low latency
}

/**
 * Voice provider capabilities
 */
export interface VoiceProviderCapabilities {
  provider: VoiceProvider;
  streaming: boolean;
  accents: VoiceAccent[];
  maxCharacters?: number;
  requiresApiKey: boolean;
  platforms: Platform[];
  latency: 'low' | 'medium' | 'high';
}

/**
 * Voice synthesis request
 */
export interface VoiceSynthesisRequest {
  text: string;
  config: VoiceConfig;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Voice provider response
 */
export interface VoiceSynthesisResponse {
  success: boolean;
  audioUrl?: string;      // For providers that return audio URLs
  audioData?: ArrayBuffer; // For providers that return raw audio
  error?: string;
}

/**
 * Voice cloning configuration (placeholder for future implementation)
 * NOTE: Voice cloning is disabled until proper consent workflow is implemented
 */
export interface VoiceCloneConfig {
  enabled: false;         // Always false until consent workflow added
  consentObtained: false; // Placeholder for consent tracking
  sampleAudioUrl?: string;
  targetVoiceName?: string;
}

/**
 * Voice persona configuration
 */
export interface VoicePersona {
  name: string;
  description: string;
  provider: VoiceProvider;
  voiceName: string;
  config: Partial<VoiceConfig>;
  cloneConfig?: VoiceCloneConfig;
}

/**
 * Provider fallback chain configuration
 */
export interface VoiceProviderChain {
  primary: VoiceProvider;
  fallbacks: VoiceProvider[];
  timeout?: number; // Timeout before trying fallback (ms)
}

/**
 * TTS Provider interface that all voice providers must implement
 * Defines the contract for the multi-provider TTS layer
 */
export interface ITTSProvider {
  /**
   * Synthesize speech from text
   * @param request - Voice synthesis request with text and configuration
   * @returns Promise resolving to synthesis response with success status
   */
  speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse>;

  /**
   * Cancel any ongoing speech synthesis
   */
  cancel(): void;
}
