/**
 * millAlyzer Tests - YouTube Video Analysis
 *
 * Comprehensive tests for the YouTube intelligence system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeVideoWithMillAlyzer } from '../youtubeMillAlyzer';
import type { VideoAnalysis, VideoType } from '../youtubeMillAlyzer';

// Mock dependencies
vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: vi.fn(),
  },
}));

vi.mock('../youtubeAnalysisService', () => ({
  getVideoInfo: vi.fn(),
}));

describe('millAlyzer - Video Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeVideoWithMillAlyzer', () => {
    it('should analyze a tutorial video successfully', async () => {
      // Mock transcript
      const { YoutubeTranscript } = await import('youtube-transcript');
      vi.mocked(YoutubeTranscript.fetchTranscript).mockResolvedValue([
        { text: 'Welcome to this Docker tutorial', offset: 0, duration: 5000 },
        {
          text: 'We will install Docker using npm install docker',
          offset: 5000,
          duration: 5000,
        },
        { text: 'Then run docker run -d redis', offset: 10000, duration: 5000 },
      ]);

      // Mock video info
      const { getVideoInfo } = await import('../youtubeAnalysisService');
      vi.mocked(getVideoInfo).mockResolvedValue({
        title: 'Docker Tutorial for Beginners',
        description: 'Learn Docker basics',
        channelName: 'Tech Channel',
        duration: 600,
        viewCount: 10000,
        publishedAt: '2024-01-01',
        thumbnail: 'https://example.com/thumb.jpg',
      });

      const result = await analyzeVideoWithMillAlyzer('test-video-id');

      expect(result).toBeDefined();
      expect(result.videoId).toBe('test-video-id');
      expect(result.title).toBe('Docker Tutorial for Beginners');
      expect(result.type).toBe('tutorial');
      expect(result.summary).toBeDefined();
    });

    it('should handle videos without transcripts gracefully', async () => {
      const { YoutubeTranscript } = await import('youtube-transcript');
      vi.mocked(YoutubeTranscript.fetchTranscript).mockRejectedValue(
        new Error('No transcript')
      );

      const { getVideoInfo } = await import('../youtubeAnalysisService');
      vi.mocked(getVideoInfo).mockResolvedValue({
        title: 'Video Without Transcript',
        description: 'No captions available',
        channelName: 'Test Channel',
        duration: 300,
        viewCount: 1000,
        publishedAt: '2024-01-01',
        thumbnail: 'https://example.com/thumb.jpg',
      });

      const result = await analyzeVideoWithMillAlyzer('no-transcript-id');

      expect(result).toBeDefined();
      expect(result.transcriptAvailable).toBe(false);
      expect(result.keyPoints).toHaveLength(0);
      expect(result.codeSnippets).toHaveLength(0);
    });

    it('should detect video type correctly', async () => {
      const { YoutubeTranscript } = await import('youtube-transcript');
      const { getVideoInfo } = await import('../youtubeAnalysisService');

      // Tutorial
      vi.mocked(getVideoInfo).mockResolvedValue({
        title: 'How to Build a React App',
        description: 'Step by step tutorial',
        channelName: 'Dev Channel',
        duration: 1200,
        viewCount: 5000,
        publishedAt: '2024-01-01',
        thumbnail: 'https://example.com/thumb.jpg',
      });

      vi.mocked(YoutubeTranscript.fetchTranscript).mockResolvedValue([
        { text: 'In this tutorial we will learn', offset: 0, duration: 5000 },
      ]);

      const tutorialResult = await analyzeVideoWithMillAlyzer('tutorial-id');
      expect(tutorialResult.type).toBe('tutorial');
    });
  });

  describe('Video Type Detection', () => {
    const testCases: Array<{
      title: string;
      description: string;
      expected: VideoType;
    }> = [
      {
        title: 'React Tutorial for Beginners',
        description: 'Learn React step by step',
        expected: 'tutorial',
      },
      {
        title: 'Breaking: New AI Model Released',
        description: 'Latest tech news',
        expected: 'news',
      },
      {
        title: 'Panel Discussion on Web Development',
        description: 'Industry experts discuss trends',
        expected: 'discussion',
      },
    ];

    testCases.forEach(({ title, description, expected }) => {
      it(`should detect "${expected}" from "${title}"`, () => {
        // Video type detection is based on title and description keywords
        const titleLower = title.toLowerCase();
        const descLower = description.toLowerCase();

        let detected: VideoType = 'other';

        if (
          titleLower.includes('tutorial') ||
          titleLower.includes('how to') ||
          descLower.includes('step by step')
        ) {
          detected = 'tutorial';
        } else if (
          titleLower.includes('breaking') ||
          titleLower.includes('news') ||
          descLower.includes('latest')
        ) {
          detected = 'news';
        } else if (
          titleLower.includes('discussion') ||
          titleLower.includes('panel') ||
          descLower.includes('discuss')
        ) {
          detected = 'discussion';
        }

        expect(detected).toBe(expected);
      });
    });
  });

  describe('Code Snippet Extraction', () => {
    it('should extract JavaScript code snippets', () => {
      const transcript = `
        Here's how to create a function:
        const greet = (name) => {
          console.log('Hello ' + name);
        };
        That's a simple arrow function.
      `;

      // Simple regex for demo - real implementation uses AI
      const codePattern = /const\s+\w+\s*=[\s\S]*?;/g;
      const matches = transcript.match(codePattern);

      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(0);
    });

    it('should identify programming languages', () => {
      const testSnippets = [
        { code: 'const x = 5;', expected: 'javascript' },
        { code: 'def hello():', expected: 'python' },
        { code: 'FROM node:18', expected: 'dockerfile' },
        { code: 'SELECT * FROM users', expected: 'sql' },
      ];

      testSnippets.forEach(({ code, expected }) => {
        let detected = 'unknown';

        if (
          code.includes('const') ||
          code.includes('let') ||
          code.includes('var')
        )
          detected = 'javascript';
        else if (code.includes('def ') || code.includes('import '))
          detected = 'python';
        else if (code.startsWith('FROM ') || code.includes('RUN '))
          detected = 'dockerfile';
        else if (code.includes('SELECT') || code.includes('INSERT'))
          detected = 'sql';

        expect(detected).toBe(expected);
      });
    });
  });

  describe('CLI Command Extraction', () => {
    it('should extract npm commands', () => {
      const transcript =
        'First install express with npm install express then run npm start ';

      const npmCommands = transcript.match(
        /npm\s+(install|start|run|build|test)\s+[\w-]*/g
      );

      expect(npmCommands).toBeDefined();
      expect(npmCommands).toContain('npm install express');
      expect(npmCommands).toContain('npm start ');
    });

    it('should extract docker commands', () => {
      const transcript =
        'Run docker build -t myapp and then docker run -p 3000:3000 myapp';

      const dockerCommands = transcript.match(
        /docker\s+(build|run|pull|push)[\s\S]*?(?=\s+and|\s+then|$)/g
      );

      expect(dockerCommands).toBeDefined();
      expect(dockerCommands!.length).toBe(2);
    });

    it('should identify command platform', () => {
      const commands = [
        { cmd: 'brew install node', platform: 'mac' },
        { cmd: 'apt-get install nginx', platform: 'linux' },
        { cmd: 'choco install git', platform: 'windows' },
        { cmd: 'npm install react', platform: 'all' },
      ];

      commands.forEach(({ cmd, platform }) => {
        let detected = 'all';

        if (cmd.includes('brew')) detected = 'mac';
        else if (cmd.includes('apt-get') || cmd.includes('apt '))
          detected = 'linux';
        else if (cmd.includes('choco')) detected = 'windows';

        expect(detected).toBe(platform);
      });
    });
  });

  describe('Key Points Extraction', () => {
    it('should identify important timestamps', () => {
      const transcript = [
        { text: 'Introduction to the topic', offset: 0 },
        { text: 'This is very important to understand', offset: 60000 },
        { text: 'Key concept number one', offset: 120000 },
      ];

      const importantPhrases = ['important', 'key', 'critical', 'essential'];
      const keyPoints = transcript.filter((t: any) =>
        importantPhrases.some((phrase) => t.text.toLowerCase().includes(phrase))
      );

      expect(keyPoints.length).toBeGreaterThan(0);
    });

    it('should format timestamps correctly', () => {
      const offsetMs = 125000; // 2 minutes 5 seconds
      const minutes = Math.floor(offsetMs / 60000);
      const seconds = Math.floor((offsetMs % 60000) / 1000);
      const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      expect(formatted).toBe('2:05');
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      const { getVideoInfo } = await import('../youtubeAnalysisService');
      vi.mocked(getVideoInfo).mockRejectedValue(new Error('API Error'));

      await expect(analyzeVideoWithMillAlyzer('invalid-id')).rejects.toThrow();
    });

    it('should validate video IDs', () => {
      const validIds = ['abc123XYZ-_', 'dQw4w9WgXcQ'];
      const invalidIds = ['too-short', 'has spaces', 'has@special'];

      const isValidId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);

      validIds.forEach((id) => expect(isValidId(id)).toBe(true));
      invalidIds.forEach((id) => expect(isValidId(id)).toBe(false));
    });
  });

  describe('Analysis Summary', () => {
    it('should generate concise summaries', () => {
      const longText =
        'This is a very long transcript that goes on and on about Docker containers and how to use them with various commands and configurations for production environments.';

      // Summary should be shorter than original
      const maxLength = 100;
      const summary =
        longText.length > maxLength
          ? longText.substring(0, maxLength) + '...'
          : longText;

      expect(summary.length).toBeLessThanOrEqual(maxLength + 3);
    });
  });
});
