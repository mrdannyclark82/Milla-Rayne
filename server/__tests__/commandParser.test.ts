import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock the Gemini client to prevent top-level initialization errors
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      getGenerativeModel() {
        return {
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => '{"service": "profile", "action": "update", "entities": {"name": "John Doe"}}',
              functionCalls: [],
            },
          }),
        };
      }
    },
  };
});

import { parseCommand } from '../commandParser';

beforeAll(() => {
  vi.stubEnv('GEMINI_API_KEY', 'mock-key');
});

describe('commandParser', () => {
  it('should parse "my name is" command', async () => {
    const command = 'my name is John Doe';
    const parsed = await parseCommand(command);
    expect(parsed.service).toBe('profile');
    expect(parsed.action).toBe('update');
    expect(parsed.entities.name).toBe('John Doe');
  });

  it('should parse "i like" command', async () => {
    const command = 'i like AI';
    const parsed = await parseCommand(command);
    expect(parsed.service).toBe('profile');
    expect(parsed.action).toBe('update');
    expect(parsed.entities.interest).toBe('AI');
  });
});
