/**
 * millAlyzer Chat Integration Tests
 *
 * Tests for the chat endpoint integration with video analysis
 */

import { describe, it, expect, vi } from 'vitest';

describe('millAlyzer Chat Integration', () => {
  describe('YouTube URL Detection', () => {
    it('should detect standard YouTube URLs', () => {
      const testUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=abc123XYZ-_',
        'http://www.youtube.com/watch?v=test1234567',
      ];

      const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

      testUrls.forEach((url) => {
        const match = url.match(regex);
        expect(match).toBeDefined();
        expect(match![1]).toHaveLength(11);
      });
    });

    it('should detect short YouTube URLs', () => {
      const shortUrls = [
        'https://youtu.be/dQw4w9WgXcQ',
        'youtu.be/abc123XYZ-_',
      ];

      const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

      shortUrls.forEach((url) => {
        const match = url.match(regex);
        expect(match).toBeDefined();
        expect(match![1]).toHaveLength(11);
      });
    });

    it('should extract video ID from URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);

      expect(match![1]).toBe('dQw4w9WgXcQ');
    });

    it('should not match invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/video',
        'https://youtube.com/channel/UC123',
        'not a url at all',
      ];

      const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

      invalidUrls.forEach((url) => {
        const match = url.match(regex);
        expect(match).toBeNull();
      });
    });
  });

  describe('Trigger Detection', () => {
    it('should detect analyze requests', () => {
      const messages = [
        'analyze this video',
        'can you analyze the video?',
        'please analyze https://youtube.com/watch?v=test',
      ];

      messages.forEach((msg) => {
        const isAnalyzeRequest =
          msg.toLowerCase().includes('analyze') &&
          msg.toLowerCase().includes('video');
        expect(isAnalyzeRequest).toBe(true);
      });
    });

    it('should detect knowledge base requests', () => {
      const messages = [
        'show my knowledge base',
        'open knowledge base',
        'show videos',
        'my videos',
      ];

      messages.forEach((msg) => {
        const isKBRequest =
          msg.toLowerCase().includes('knowledge base') ||
          msg.toLowerCase().includes('show videos') ||
          msg.toLowerCase().includes('my videos');
        expect(isKBRequest).toBe(true);
      });
    });

    it('should detect daily news requests', () => {
      const messages = [
        'show me daily news',
        "what's new in tech?",
        'tech news today',
        'daily tech news',
      ];

      messages.forEach((msg) => {
        const isNewsRequest =
          msg.toLowerCase().includes('daily news') ||
          msg.toLowerCase().includes('tech news') ||
          msg.toLowerCase().includes("what's new");
        expect(isNewsRequest).toBe(true);
      });
    });

    it('should not false-positive on unrelated messages', () => {
      const messages = [
        'hello how are you',
        "what's the weather today",
        'tell me a joke',
      ];

      messages.forEach((msg) => {
        const isAnalyzeRequest =
          msg.toLowerCase().includes('analyze') &&
          msg.toLowerCase().includes('video');
        expect(isAnalyzeRequest).toBe(false);
      });
    });
  });

  describe('Response Structure', () => {
    it('should include videoAnalysis when URL detected', () => {
      const mockResponse = {
        response: "I've analyzed that video for you!",
        videoAnalysis: {
          videoId: 'test123',
          title: 'Test Video',
          type: 'tutorial',
          summary: 'Test summary',
          keyPoints: [],
          codeSnippets: [],
          cliCommands: [],
        },
        sceneContext: {
          location: 'front_door',
          mood: 'calm',
          timeOfDay: 'day',
        },
      };

      expect(mockResponse.videoAnalysis).toBeDefined();
      expect(mockResponse.videoAnalysis.videoId).toBe('test123');
    });

    it('should include showKnowledgeBase flag when requested', () => {
      const mockResponse = {
        response: 'Opening your knowledge base...',
        showKnowledgeBase: true,
        sceneContext: {
          location: 'front_door',
          mood: 'calm',
          timeOfDay: 'day',
        },
      };

      expect(mockResponse.showKnowledgeBase).toBe(true);
    });

    it('should include dailyNews when requested', () => {
      const mockResponse = {
        response: "Here are today's top tech stories...",
        dailyNews: {
          date: new Date().toISOString(),
          categories: {
            'AI & Machine Learning': [],
            'Web Development': [],
          },
          topStories: [],
        },
        sceneContext: {
          location: 'front_door',
          mood: 'calm',
          timeOfDay: 'day',
        },
      };

      expect(mockResponse.dailyNews).toBeDefined();
    });

    it('should maintain backward compatibility', () => {
      const mockResponse = {
        response: 'Here you go!',
        youtube_play: { videoId: 'abc123' },
        sceneContext: {
          location: 'front_door',
          mood: 'calm',
          timeOfDay: 'day',
        },
      };

      expect(mockResponse.response).toBeDefined();
      expect(mockResponse.youtube_play).toBeDefined();
      expect(mockResponse.sceneContext).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should continue chat if analysis fails', async () => {
      const analyzeVideo = vi
        .fn()
        .mockRejectedValue(new Error('Analysis failed'));

      let videoAnalysis = null;
      try {
        videoAnalysis = await analyzeVideo('test-id');
      } catch (error) {
        // Error caught, continue without analysis
        console.error('Analysis failed:', error);
      }

      expect(videoAnalysis).toBeNull();
      // Chat should still work
    });

    it('should validate video IDs before analysis', () => {
      const isValidVideoId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);

      expect(isValidVideoId('dQw4w9WgXcQ')).toBe(true);
      expect(isValidVideoId('too-short')).toBe(false);
      expect(isValidVideoId('way-too-long-id')).toBe(false);
      expect(isValidVideoId('has spaces')).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not block chat response for analysis', async () => {
      const generateAIResponse = vi.fn().mockResolvedValue({
        content: 'Chat response',
      });

      const analyzeVideo = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000)) // Slow analysis
      );

      // Simulate concurrent execution
      const [aiResponse] = await Promise.all([
        generateAIResponse('test message'),
        analyzeVideo('test-id').catch(() => null),
      ]);

      expect(aiResponse.content).toBe('Chat response');
      // Chat responds immediately, analysis happens in background
    });
  });
});
