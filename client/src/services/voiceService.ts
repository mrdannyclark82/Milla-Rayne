/**
 * Voice Service - Multi-provider TTS abstraction layer
 * Supports browser-native, Google Cloud, Azure, ElevenLabs, and Coqui TTS
 */

import type {
  VoiceProvider,
  VoiceConfig,
  VoiceSynthesisRequest,
  VoiceSynthesisResponse,
  VoiceProviderCapabilities,
  VoiceProviderChain,
  Platform,
  VoiceAccent,
  ITTSProvider,
} from '@shared/voiceTypes';

/**
 * Provider capabilities registry
 */
const PROVIDER_CAPABILITIES: Record<VoiceProvider, VoiceProviderCapabilities> =
{
  'browser-native': {
    provider: 'browser-native',
    streaming: false,
    accents: ['en-US', 'en-GB', 'en-AU'],
    requiresApiKey: false,
    platforms: ['web', 'android', 'ios'],
    latency: 'low',
  },
  'google-cloud': {
    provider: 'google-cloud',
    streaming: true,
    accents: ['en-US', 'en-US-Southern', 'en-US-Standard', 'en-GB', 'en-AU'],
    maxCharacters: 5000,
    requiresApiKey: true,
    platforms: ['web', 'android'],
    latency: 'low',
  },
  azure: {
    provider: 'azure',
    streaming: true,
    accents: ['en-US', 'en-US-Southern', 'en-GB', 'en-AU'],
    maxCharacters: 5000,
    requiresApiKey: true,
    platforms: ['web', 'android'],
    latency: 'low',
  },
  elevenlabs: {
    provider: 'elevenlabs',
    streaming: true,
    accents: ['en-US', 'en-US-Southern', 'en-GB', 'en-AU'],
    maxCharacters: 5000,
    requiresApiKey: true,
    platforms: ['web', 'android'],
    latency: 'medium',
  },
  coqui: {
    provider: 'coqui',
    streaming: false,
    accents: ['en-US'],
    requiresApiKey: false,
    platforms: ['web'],
    latency: 'high',
  },
};

/**
 * Voice name mappings for different providers
 * Prioritizes female voices with US English (Southern) accent
 */
const SOUTHERN_VOICE_NAMES: Record<VoiceProvider, string[]> = {
  'browser-native': [
    'Samantha',
    'Karen',
    'Victoria',
    'Microsoft Aria Online (Natural)',
  ],
  'google-cloud': [
    'en-US-Neural2-C', // Female, US English
    'en-US-Neural2-E', // Female, US English
    'en-US-Neural2-F', // Female, US English
    'en-US-Journey-F', // Female, US English, expressive
  ],
  azure: [
    'en-US-AriaNeural', // Female, US English
    'en-US-JennyNeural', // Female, US English
    'en-US-SaraNeural', // Female, US English
  ],
  elevenlabs: [
    'Bella', // Female, warm and friendly
    'Rachel', // Female, US English
    'Elli', // Female, expressive
  ],
  coqui: ['female-en-us'],
};

/**
 * Default fallback chain
 */
const DEFAULT_FALLBACK_CHAIN: VoiceProviderChain = {
  primary: 'elevenlabs',
  fallbacks: ['browser-native', 'google-cloud', 'azure'],
  timeout: 5000,
};

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';

  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';

  return 'web';
}

/**
 * Check if provider is available on current platform
 */
export function isProviderAvailable(provider: VoiceProvider): boolean {
  const platform = detectPlatform();
  const capabilities = PROVIDER_CAPABILITIES[provider];

  if (!capabilities.platforms.includes(platform)) {
    return false;
  }

  // For browser-native, check if Web Speech API is available
  if (provider === 'browser-native') {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  // For API-based providers, check if API key is configured
  if (capabilities.requiresApiKey) {
    // This will be checked in the actual implementation
    return true; // Placeholder
  }

  return true;
}

/**
 * Get recommended voice name for provider and accent
 */
export function getRecommendedVoice(
  provider: VoiceProvider,
  accent: VoiceAccent = 'en-US-Southern'
): string | null {
  const voices = SOUTHERN_VOICE_NAMES[provider];
  return voices && voices.length > 0 ? voices[0] : null;
}

/**
 * Get provider capabilities
 */
export function getProviderCapabilities(
  provider: VoiceProvider
): VoiceProviderCapabilities {
  return PROVIDER_CAPABILITIES[provider];
}

/**
 * Browser-native TTS implementation (Web Speech API)
 */
class BrowserNativeTTS implements ITTSProvider {
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    if (!this.synth) {
      return {
        success: false,
        error: 'Speech synthesis not available',
      };
    }

    return new Promise((resolve) => {
      try {
        this.synth!.cancel(); // Cancel any ongoing speech

        const utterance = new SpeechSynthesisUtterance(request.text);

        // Configure voice
        const voices = this.synth!.getVoices();
        const selectedVoice = voices.find(
          (v) =>
            v.name === request.config.voiceName ||
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('victoria')
        );

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = request.config.rate ?? 0.95;
        utterance.pitch = request.config.pitch ?? 1.0;
        utterance.volume = request.config.volume ?? 1.0;

        utterance.onstart = () => {
          request.onStart?.();
        };

        utterance.onend = () => {
          request.onEnd?.();
          resolve({ success: true });
        };

        utterance.onerror = (event) => {
          const error = new Error(`Speech synthesis error: ${event.error}`);
          request.onError?.(error);
          resolve({ success: false, error: error.message });
        };

        this.synth!.speak(utterance);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        request.onError?.(err);
        resolve({ success: false, error: err.message });
      }
    });
  }

  cancel(): void {
    this.synth?.cancel();
  }
}

/**
 * Google Cloud TTS implementation (placeholder)
 */
class GoogleCloudTTS implements ITTSProvider {
  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    // TODO: Implement Google Cloud TTS API integration
    console.warn(
      'Google Cloud TTS not yet implemented, falling back to browser-native'
    );
    return {
      success: false,
      error:
        'Google Cloud TTS not configured - requires GOOGLE_CLOUD_TTS_API_KEY',
    };
  }

  cancel(): void {
    // TODO: Implement cancellation
  }
}

/**
 * Azure TTS implementation (placeholder)
 */
class AzureTTS implements ITTSProvider {
  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    // TODO: Implement Azure TTS API integration
    console.warn(
      'Azure TTS not yet implemented, falling back to browser-native'
    );
    return {
      success: false,
      error: 'Azure TTS not configured - requires AZURE_TTS_API_KEY',
    };
  }

  cancel(): void {
    // TODO: Implement cancellation
  }
}

/**
 * ElevenLabs TTS implementation
 */
class ElevenLabsTTS implements ITTSProvider {
  private audio: HTMLAudioElement | null = null;
  private voices: any[] = [];
  private voicesFetched = false;

  constructor() { }

  async fetchVoices(): Promise<any[]> {
    if (this.voicesFetched) {
      return this.voices ?? [];
    }
    try {
      const response = await fetch('/api/elevenlabs/voices');
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        this.voices = data.voices;
        this.voicesFetched = true;
        return this.voices ?? [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  async getVoices(): Promise<any[]> {
    await this.fetchVoices();
    return this.voices;
  }

  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    const voiceId = request.config.voiceName || '21m00Tcm4TlvDq8ikWAM'; // Default to a voice if not set
    const { text, config } = request;

    try {
      const response = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceName: voiceId,
          voice_settings: {
            stability: config.rate ?? 0.75,
            similarity_boost: config.pitch ?? 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.detail?.message || response.statusText;
        console.error('ElevenLabs API Error:', errorMessage);
        return {
          success: false,
          error: `ElevenLabs API Error: ${errorMessage}`,
        };
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      this.cancel(); // Cancel any previous audio
      this.audio = new Audio(audioUrl);

      request.onStart?.();

      this.audio.play();

      return new Promise((resolve) => {
        this.audio!.onended = () => {
          request.onEnd?.();
          resolve({ success: true, audioUrl });
        };
        this.audio!.onerror = (err) => {
          const error = new Error('Error playing ElevenLabs audio.');
          request.onError?.(error);
          console.error('Error playing ElevenLabs audio:', err);
          resolve({ success: false, error: error.message });
        };
      });
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error during ElevenLabs TTS request.');
      request.onError?.(err);
      console.error('ElevenLabs TTS request failed:', err);
      return { success: false, error: err.message };
    }
  }

  cancel(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}

/**
 * Coqui TTS implementation (placeholder)
 */
class CoquiTTS implements ITTSProvider {
  async speak(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    // TODO: Implement Coqui TTS integration
    console.warn(
      'Coqui TTS not yet implemented, falling back to browser-native'
    );
    return {
      success: false,
      error: 'Coqui TTS not configured',
    };
  }

  cancel(): void {
    // TODO: Implement cancellation
  }
}

/**
 * Main Voice Service class with provider abstraction and fallback
 */
export class VoiceService {
  private providers: Map<VoiceProvider, ITTSProvider> = new Map();
  private currentProvider: VoiceProvider = 'elevenlabs';
  private fallbackChain: VoiceProviderChain = DEFAULT_FALLBACK_CHAIN;

  constructor() {
    // Initialize available providers
    this.providers.set('browser-native', new BrowserNativeTTS());
    this.providers.set('google-cloud', new GoogleCloudTTS());
    this.providers.set('azure', new AzureTTS());
    this.providers.set('elevenlabs', new ElevenLabsTTS());
    this.providers.set('coqui', new CoquiTTS());
  }

  /**
   * Set the preferred provider with fallback chain
   */
  setProvider(provider: VoiceProvider, fallbacks?: VoiceProvider[]): void {
    if (!this.providers.has(provider)) {
      console.warn(`Provider ${provider} not available, using browser-native`);
      this.currentProvider = 'browser-native';
      return;
    }

    this.currentProvider = provider;

    if (fallbacks) {
      this.fallbackChain = {
        primary: provider,
        fallbacks,
        timeout: this.fallbackChain.timeout,
      };
    }
  }

  /**
   * Speak text with automatic fallback handling
   */
  async speak(
    text: string,
    config?: Partial<VoiceConfig>
  ): Promise<VoiceSynthesisResponse> {
    const fullConfig: VoiceConfig = {
      provider: this.currentProvider,
      accent: 'en-US-Southern',
      quality: 'low-latency',
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      streaming: true,
      ...config,
    };

    // Try to get recommended voice if not specified
    if (!fullConfig.voiceName) {
      const recommendedVoice = getRecommendedVoice(
        fullConfig.provider,
        fullConfig.accent
      );
      if (recommendedVoice) {
        fullConfig.voiceName = recommendedVoice;
      }
    }

    const request: VoiceSynthesisRequest = {
      text,
      config: fullConfig,
    };

    // Try primary provider
    const primaryProvider = this.providers.get(fullConfig.provider);
    if (primaryProvider) {
      const result = await primaryProvider.speak(request);
      if (result.success) {
        return result;
      }

      console.warn(
        `Primary provider ${fullConfig.provider} failed, trying fallbacks...`
      );
    }

    // Try fallback providers
    for (const fallbackProvider of this.fallbackChain.fallbacks) {
      if (fallbackProvider === fullConfig.provider) continue; // Skip if already tried

      const provider = this.providers.get(fallbackProvider);
      if (!provider) continue;

      console.log(`Trying fallback provider: ${fallbackProvider}`);
      const fallbackConfig = { ...fullConfig, provider: fallbackProvider };
      const fallbackRequest = { ...request, config: fallbackConfig };

      const result = await provider.speak(fallbackRequest);
      if (result.success) {
        console.log(`Fallback provider ${fallbackProvider} succeeded`);
        return result;
      }
    }

    return {
      success: false,
      error: 'All voice providers failed',
    };
  }

  /**
   * Cancel current speech
   */
  cancel(): void {
    const provider = this.providers.get(this.currentProvider);
    provider?.cancel();
  }

  /**
   * Get available providers for current platform
   */
  getAvailableProviders(): VoiceProvider[] {
    const platform = detectPlatform();
    return Object.entries(PROVIDER_CAPABILITIES)
      .filter(([_, caps]) => caps.platforms.includes(platform))
      .map(([provider]) => provider as VoiceProvider);
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): VoiceProvider {
    return this.currentProvider;
  }

  /**
   * Get available voices for the current provider
   */
  async getAvailableVoices(): Promise<any[]> {
    const provider = this.providers.get(this.currentProvider);
    if (provider && 'getVoices' in provider) {
      return await (provider as any).getVoices();
    }
    return [];
  }
}

/**
 * Export singleton instance for easy use
 */
export const voiceService = new VoiceService();
