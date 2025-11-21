import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateActivePersona,
  formatPersonaForPrompt,
  type ActiveUserPersona,
} from '../personaFusionService.js';
import * as profileService from '../profileService.js';
import * as memoryService from '../memoryService.js';
import * as realWorldInfoService from '../realWorldInfoService.js';

describe('PersonaFusionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateActivePersona', () => {
    it('should generate a complete Active User Persona', async () => {
      // Mock profile service
      vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        id: 'user123',
        name: 'Test User',
        interests: ['coding', 'AI', 'music'],
        preferences: {
          theme: 'dark',
          notifications: 'enabled',
        },
      });

      // Mock memory service
      vi.spyOn(memoryService, 'getSemanticMemoryContext').mockResolvedValue(
        'User discussed AI and machine learning topics recently. Showed interest in TypeScript development.'
      );

      // Mock real-world info service
      vi.spyOn(realWorldInfoService, 'getAmbientContext').mockReturnValue({
        motionState: 'stationary',
        lightLevel: 75,
        location: null,
        deviceContext: {
          battery: 85,
          charging: false,
          network: 'wifi',
        },
      });

      vi.spyOn(realWorldInfoService, 'getCurrentDateTime').mockReturnValue({
        date: 'Monday, January 15, 2024',
        time: '2:30:00 PM',
        timezone: 'America/New_York',
      });

      const persona = await generateActivePersona(
        'user123',
        'Tell me about AI'
      );

      expect(persona.userId).toBe('user123');
      expect(persona.profile.name).toBe('Test User');
      expect(persona.profile.interests).toHaveLength(3);
      expect(persona.profile.interests).toContain('coding');
      expect(persona.ambientContext.timeOfDay).toBe('2:30:00 PM');
      expect(persona.ambientContext.dateInfo).toBe('Monday, January 15, 2024');
      expect(persona.ambientContext.deviceState?.battery).toBe(85);
      expect(persona.ambientContext.motion).toBe('stationary');
      expect(persona.ambientContext.lightLevel).toBe('bright');
      expect(persona.personaSummary).toContain('Test User');
    });

    it('should handle missing profile gracefully', async () => {
      vi.spyOn(profileService, 'getProfile').mockResolvedValue(null);
      vi.spyOn(memoryService, 'getSemanticMemoryContext').mockResolvedValue('');
      vi.spyOn(realWorldInfoService, 'getAmbientContext').mockReturnValue(null);
      vi.spyOn(realWorldInfoService, 'getCurrentDateTime').mockReturnValue({
        date: 'Monday, January 15, 2024',
        time: '2:30:00 PM',
        timezone: 'America/New_York',
      });

      const persona = await generateActivePersona('user123');

      expect(persona.userId).toBe('user123');
      expect(persona.profile.name).toBe('User');
      expect(persona.profile.interests).toHaveLength(0);
    });

    it('should extract topics from memory context', async () => {
      vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        id: 'user123',
        name: 'Test User',
        interests: [],
        preferences: {},
      });

      vi.spyOn(memoryService, 'getSemanticMemoryContext').mockResolvedValue(
        'User talked about TypeScript and discussed React components. Interested in learning more.'
      );

      vi.spyOn(realWorldInfoService, 'getAmbientContext').mockReturnValue(null);
      vi.spyOn(realWorldInfoService, 'getCurrentDateTime').mockReturnValue({
        date: 'Monday, January 15, 2024',
        time: '2:30:00 PM',
        timezone: 'America/New_York',
      });

      const persona = await generateActivePersona(
        'user123',
        'Tell me about TypeScript'
      );

      expect(persona.memoryContext.relevantTopics).toContain('typescript');
      expect(persona.memoryContext.relevantTopics).toContain('react');
    });

    it('should extract emotional patterns', async () => {
      vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        id: 'user123',
        name: 'Test User',
        interests: [],
        preferences: {},
      });

      vi.spyOn(memoryService, 'getSemanticMemoryContext').mockResolvedValue(
        'User was excited about the new features and expressed joy about the progress.'
      );

      vi.spyOn(realWorldInfoService, 'getAmbientContext').mockReturnValue(null);
      vi.spyOn(realWorldInfoService, 'getCurrentDateTime').mockReturnValue({
        date: 'Monday, January 15, 2024',
        time: '2:30:00 PM',
        timezone: 'America/New_York',
      });

      const persona = await generateActivePersona('user123', 'How are you?');

      expect(persona.memoryContext.emotionalPatterns).toContain('positive');
    });
  });

  describe('formatPersonaForPrompt', () => {
    it('should format persona for AI system prompt', () => {
      const mockPersona: ActiveUserPersona = {
        userId: 'user123',
        timestamp: Date.now(),
        profile: {
          name: 'Test User',
          interests: ['coding', 'AI'],
          preferences: {
            theme: 'dark',
          },
          goals: [],
        },
        memoryContext: {
          recentInteractions:
            'User discussed AI topics and showed interest in coding.',
          relevantTopics: ['ai', 'coding'],
          emotionalPatterns: ['positive'],
        },
        ambientContext: {
          timeOfDay: '2:30:00 PM',
          dateInfo: 'Monday, January 15, 2024',
          motion: 'stationary',
          lightLevel: 'bright',
          deviceState: {
            battery: 85,
            charging: false,
          },
        },
        personaSummary:
          'User: Test User | Interests: coding, AI | Current time: 2:30:00 PM',
      };

      const formatted = formatPersonaForPrompt(mockPersona);

      expect(formatted).toContain('ACTIVE USER PERSONA');
      expect(formatted).toContain('USER PROFILE');
      expect(formatted).toContain('Test User');
      expect(formatted).toContain('coding, AI');
      expect(formatted).toContain('RELEVANT MEMORIES');
      expect(formatted).toContain('REAL-TIME CONTEXT');
      expect(formatted).toContain('2:30:00 PM');
      expect(formatted).toContain('stationary');
      expect(formatted).toContain('bright');
      expect(formatted).toContain('85%');
    });

    it('should handle minimal persona data', () => {
      const minimalPersona: ActiveUserPersona = {
        userId: 'user123',
        timestamp: Date.now(),
        profile: {
          name: 'User',
          interests: [],
          preferences: {},
          goals: [],
        },
        memoryContext: {
          recentInteractions: '',
          relevantTopics: [],
          emotionalPatterns: [],
        },
        ambientContext: {
          timeOfDay: '2:30:00 PM',
          dateInfo: 'Monday, January 15, 2024',
        },
        personaSummary: 'User: User | Current time: 2:30:00 PM',
      };

      const formatted = formatPersonaForPrompt(minimalPersona);

      expect(formatted).toContain('ACTIVE USER PERSONA');
      expect(formatted).toContain('User');
      expect(formatted).toContain('2:30:00 PM');
    });
  });
});
