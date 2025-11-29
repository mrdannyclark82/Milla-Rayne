import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  monitorTaskAlignment,
  formatFeedbackForContext,
} from '../metacognitiveService';
import type { AgentTask } from '../agents/taskStorage';
import * as profileService from '../profileService';
import * as geminiService from '../geminiService';

// Mock the dependencies
vi.mock('../profileService');
vi.mock('../geminiService');

describe('metacognitiveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('monitorTaskAlignment', () => {
    it('should return null if no user profile exists', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(null);

      const task: AgentTask = {
        taskId: 'test-1',
        supervisor: 'user',
        agent: 'YouTubeAgent',
        action: 'search',
        payload: { query: 'music' },
        status: 'completed',
        metadata: { userId: 'test-user' },
      };

      const result = await monitorTaskAlignment(task);
      expect(result).toBeNull();
    });

    it('should return null for pending tasks', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({
        id: 'test-user',
        name: 'Test User',
        interests: ['AI', 'coding'],
        preferences: {},
      });

      const task: AgentTask = {
        taskId: 'test-1',
        supervisor: 'user',
        agent: 'YouTubeAgent',
        action: 'search',
        payload: { query: 'music' },
        status: 'pending',
        metadata: { userId: 'test-user' },
      };

      const result = await monitorTaskAlignment(task);
      expect(result).toBeNull();
    });

    it('should detect alignment for tasks matching user interests', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({
        id: 'test-user',
        name: 'Test User',
        interests: ['AI', 'coding'],
        preferences: {},
      });

      vi.mocked(geminiService.generateGeminiResponse).mockResolvedValue({
        content: JSON.stringify({
          aligned: true,
          confidence: 0.9,
          reasoning: 'Task aligns with user interests in AI',
        }),
        success: true,
      });

      const task: AgentTask = {
        taskId: 'test-1',
        supervisor: 'user',
        agent: 'YouTubeAgent',
        action: 'search',
        payload: { query: 'AI tutorials' },
        status: 'completed',
        metadata: { userId: 'test-user' },
      };

      const result = await monitorTaskAlignment(task);
      expect(result).toBeNull();
    });

    it('should return feedback for misaligned tasks', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({
        id: 'test-user',
        name: 'Test User',
        interests: ['fitness', 'health'],
        preferences: { dietary: 'vegan' },
      });

      vi.mocked(geminiService.generateGeminiResponse).mockResolvedValue({
        content: JSON.stringify({
          aligned: false,
          confidence: 0.8,
          reasoning: 'Task conflicts with user dietary preferences',
          feedback: {
            type: 'warning',
            message:
              'This recipe contains meat products, which conflicts with your vegan preferences.',
            suggestedAction: 'Search for vegan recipes instead',
            confidence: 0.85,
          },
        }),
        success: true,
      });

      const task: AgentTask = {
        taskId: 'test-1',
        supervisor: 'user',
        agent: 'RecipeAgent',
        action: 'search',
        payload: { query: 'beef stew recipe' },
        status: 'completed',
        metadata: { userId: 'test-user' },
      };

      const result = await monitorTaskAlignment(task);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('warning');
      expect(result?.message).toContain('vegan');
    });

    it('should handle LLM errors gracefully', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({
        id: 'test-user',
        name: 'Test User',
        interests: ['music'],
        preferences: {},
      });

      vi.mocked(geminiService.generateGeminiResponse).mockResolvedValue({
        content: '',
        success: false,
        error: 'API error',
      });

      const task: AgentTask = {
        taskId: 'test-1',
        supervisor: 'user',
        agent: 'YouTubeAgent',
        action: 'search',
        payload: { query: 'music' },
        status: 'completed',
        metadata: { userId: 'test-user' },
      };

      const result = await monitorTaskAlignment(task);
      expect(result).toBeNull();
    });
  });

  describe('formatFeedbackForContext', () => {
    it('should format feedback with all fields', () => {
      const feedback = {
        type: 'correction' as const,
        message: 'Task is misaligned with user goals',
        suggestedAction: 'Try a different approach',
        confidence: 0.85,
        reasoning: 'User prefers different content',
      };

      const formatted = formatFeedbackForContext(feedback);
      expect(formatted).toContain('CORRECTION');
      expect(formatted).toContain('Task is misaligned with user goals');
      expect(formatted).toContain('Try a different approach');
      expect(formatted).toContain('85%');
    });

    it('should format feedback without suggested action', () => {
      const feedback = {
        type: 'warning' as const,
        message: 'Potential misalignment detected',
        confidence: 0.7,
        reasoning: 'Task may not align',
      };

      const formatted = formatFeedbackForContext(feedback);
      expect(formatted).toContain('WARNING');
      expect(formatted).toContain('Potential misalignment detected');
      expect(formatted).toContain('70%');
    });
  });
});
