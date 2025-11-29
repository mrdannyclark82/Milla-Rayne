/**
 * A/V-RAG Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  extractSceneContext,
  getAtmosphericContext,
  extractVoiceContext,
  getEmpatheticGuidance,
  buildAVRagContext,
  enrichMessageWithAVContext,
  validateSceneContext,
  validateVoiceContext,
  createAVContext,
  type SceneContextData,
} from '../avRagService';
import type { VoiceAnalysisResult } from '../voiceAnalysisService';

describe('A/V-RAG Service', () => {
  describe('Scene Context Extraction', () => {
    it('should extract meaningful context from scene data', () => {
      const scene: SceneContextData = {
        timeOfDay: 'night',
        appState: 'chatting',
        location: 'workspace',
        weatherEffect: 'rain',
        performanceMode: 'balanced',
        reducedMotion: false,
        isBackgrounded: false,
      };

      const context = extractSceneContext(scene);

      expect(context).toContain('nighttime');
      expect(context).toContain('workspace');
      expect(context).toContain('rain');
      expect(context).toContain('actively chatting');
    });

    it('should include user preference indicators', () => {
      const scene: SceneContextData = {
        timeOfDay: 'day',
        appState: 'idle',
        location: 'front_door',
        weatherEffect: 'none',
        performanceMode: 'balanced',
        reducedMotion: true,
        isBackgrounded: true,
      };

      const context = extractSceneContext(scene);

      expect(context).toContain('reduced motion');
      expect(context).toContain('background');
    });

    it('should handle all time of day values', () => {
      const times: Array<SceneContextData['timeOfDay']> = [
        'dawn',
        'day',
        'dusk',
        'night',
      ];

      times.forEach((time) => {
        const scene: SceneContextData = {
          timeOfDay: time,
          appState: 'idle',
          location: 'workspace',
          weatherEffect: 'none',
          performanceMode: 'balanced',
          reducedMotion: false,
          isBackgrounded: false,
        };

        const context = extractSceneContext(scene);
        expect(context.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Atmospheric Context', () => {
    it('should generate atmospheric descriptions', () => {
      const scene: SceneContextData = {
        timeOfDay: 'night',
        appState: 'chatting',
        location: 'workspace',
        weatherEffect: 'rain',
        performanceMode: 'balanced',
        reducedMotion: false,
        isBackgrounded: false,
      };

      const atmosphere = getAtmosphericContext(scene);

      expect(atmosphere).toContain('night');
      expect(atmosphere).toContain('rain');
    });

    it('should handle different weather effects', () => {
      const effects: Array<SceneContextData['weatherEffect']> = [
        'none',
        'rain',
        'snow',
        'fog',
      ];

      effects.forEach((effect) => {
        const scene: SceneContextData = {
          timeOfDay: 'day',
          appState: 'idle',
          location: 'workspace',
          weatherEffect: effect,
          performanceMode: 'balanced',
          reducedMotion: false,
          isBackgrounded: false,
        };

        const atmosphere = getAtmosphericContext(scene);
        expect(atmosphere.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Voice Context Extraction', () => {
    it('should extract emotional context from positive voice', () => {
      const voice: VoiceAnalysisResult = {
        text: 'I love this!',
        emotionalTone: 'positive',
        success: true,
      };

      const context = extractVoiceContext(voice);

      expect(context).toContain('positive');
      expect(context).toContain('upbeat');
    });

    it('should extract emotional context from negative voice', () => {
      const voice: VoiceAnalysisResult = {
        text: 'This is difficult',
        emotionalTone: 'negative',
        success: true,
      };

      const context = extractVoiceContext(voice);

      expect(context).toContain('down');
    });

    it('should handle neutral tone', () => {
      const voice: VoiceAnalysisResult = {
        text: 'Tell me about the weather',
        emotionalTone: 'neutral',
        success: true,
      };

      const context = extractVoiceContext(voice);

      expect(context).toContain('neutral');
    });

    it('should return empty string for failed analysis', () => {
      const voice: VoiceAnalysisResult = {
        text: '',
        emotionalTone: 'unknown',
        success: false,
        error: 'Analysis failed',
      };

      const context = extractVoiceContext(voice);

      expect(context).toBe('');
    });
  });

  describe('Empathetic Guidance', () => {
    it('should provide guidance for positive emotion', () => {
      const voice: VoiceAnalysisResult = {
        text: 'Great day!',
        emotionalTone: 'positive',
        success: true,
      };

      const guidance = getEmpatheticGuidance(voice);

      expect(guidance).toContain('positive energy');
    });

    it('should provide guidance for negative emotion', () => {
      const voice: VoiceAnalysisResult = {
        text: 'Feeling down',
        emotionalTone: 'negative',
        success: true,
      };

      const guidance = getEmpatheticGuidance(voice);

      expect(guidance).toContain('supportive');
      expect(guidance).toContain('compassionate');
    });

    it('should return empty for unknown emotion', () => {
      const voice: VoiceAnalysisResult = {
        text: '',
        emotionalTone: 'unknown',
        success: false,
      };

      const guidance = getEmpatheticGuidance(voice);

      expect(guidance).toBe('');
    });
  });

  describe('Contextual Prompt Building', () => {
    it('should build complete A/V-RAG context', () => {
      const scene: SceneContextData = {
        timeOfDay: 'dusk',
        appState: 'chatting',
        location: 'workspace',
        weatherEffect: 'rain',
        performanceMode: 'balanced',
        reducedMotion: false,
        isBackgrounded: false,
      };

      const voice: VoiceAnalysisResult = {
        text: 'Can you help me?',
        emotionalTone: 'neutral',
        success: true,
      };

      const avContext = createAVContext(scene, voice);
      const contextString = buildAVRagContext(avContext);

      expect(contextString).toContain('[Scene Context]');
      expect(contextString).toContain('[Voice Analysis]');
      expect(contextString).toContain('[Response Guidance]');
    });

    it('should handle missing voice context', () => {
      const scene: SceneContextData = {
        timeOfDay: 'day',
        appState: 'idle',
        location: 'workspace',
        weatherEffect: 'none',
        performanceMode: 'balanced',
        reducedMotion: false,
        isBackgrounded: false,
      };

      const avContext = createAVContext(scene, undefined);
      const contextString = buildAVRagContext(avContext);

      expect(contextString).toContain('[Scene Context]');
      expect(contextString).not.toContain('[Voice Analysis]');
    });

    it('should handle missing scene context', () => {
      const voice: VoiceAnalysisResult = {
        text: 'Hello',
        emotionalTone: 'positive',
        success: true,
      };

      const avContext = createAVContext(undefined, voice);
      const contextString = buildAVRagContext(avContext);

      expect(contextString).not.toContain('[Scene Context]');
      expect(contextString).toContain('[Voice Analysis]');
    });

    it('should return empty string when no context available', () => {
      const avContext = createAVContext(undefined, undefined);
      const contextString = buildAVRagContext(avContext);

      expect(contextString).toBe('');
    });
  });

  describe('Message Enrichment', () => {
    it('should enrich message with A/V context', () => {
      const scene: SceneContextData = {
        timeOfDay: 'night',
        appState: 'chatting',
        location: 'workspace',
        weatherEffect: 'rain',
        performanceMode: 'balanced',
        reducedMotion: false,
        isBackgrounded: false,
      };

      const voice: VoiceAnalysisResult = {
        text: 'Can you help?',
        emotionalTone: 'neutral',
        success: true,
      };

      const avContext = createAVContext(scene, voice);
      const originalMessage = 'What is the weather like?';
      const enrichedMessage = enrichMessageWithAVContext(
        originalMessage,
        avContext
      );

      expect(enrichedMessage).toContain(originalMessage);
      expect(enrichedMessage).toContain('Contextual awareness');
    });

    it('should return original message when no context', () => {
      const avContext = createAVContext(undefined, undefined);
      const originalMessage = 'What is the weather like?';
      const enrichedMessage = enrichMessageWithAVContext(
        originalMessage,
        avContext
      );

      expect(enrichedMessage).toBe(originalMessage);
    });
  });

  describe('Context Validation', () => {
    it('should validate correct scene context', () => {
      const scene = {
        timeOfDay: 'night',
        appState: 'chatting',
        location: 'workspace',
        weatherEffect: 'rain',
        performanceMode: 'balanced',
        reducedMotion: false,
        isBackgrounded: false,
      };

      const validated = validateSceneContext(scene);

      expect(validated).not.toBeNull();
      expect(validated?.timeOfDay).toBe('night');
    });

    it('should reject invalid timeOfDay', () => {
      const scene = {
        timeOfDay: 'invalid',
        appState: 'chatting',
        location: 'workspace',
        weatherEffect: 'none',
      };

      const validated = validateSceneContext(scene);

      expect(validated).toBeNull();
    });

    it('should reject invalid appState', () => {
      const scene = {
        timeOfDay: 'day',
        appState: 'invalid',
        location: 'workspace',
        weatherEffect: 'none',
      };

      const validated = validateSceneContext(scene);

      expect(validated).toBeNull();
    });

    it('should validate correct voice context', () => {
      const voice = {
        text: 'Hello',
        emotionalTone: 'positive',
        success: true,
      };

      const validated = validateVoiceContext(voice);

      expect(validated).not.toBeNull();
      expect(validated?.emotionalTone).toBe('positive');
    });

    it('should reject invalid emotionalTone', () => {
      const voice = {
        text: 'Hello',
        emotionalTone: 'invalid',
        success: true,
      };

      const validated = validateVoiceContext(voice);

      expect(validated).toBeNull();
    });

    it('should handle null input gracefully', () => {
      expect(validateSceneContext(null)).toBeNull();
      expect(validateVoiceContext(null)).toBeNull();
    });
  });
});
