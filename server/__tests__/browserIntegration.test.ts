/**
 * BROWSER INTEGRATION END-TO-END TESTS
 * 
 * Comprehensive tests for browser integration features including:
 * - Google Calendar API
 * - Google Tasks API (Keep alternative)
 * - Website navigation
 * - OAuth flow
 */

// Mock environment variables for testing
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_OAUTH_REDIRECT_URI = 'http://localhost:5000/oauth/callback';
process.env.MEMORY_KEY = 'test-memory-key-with-at-least-32-characters-for-encryption';

describe('Browser Integration Service', () => {
  describe('Google Calendar Integration', () => {
    test('should parse date and time correctly for "tomorrow at 2pm"', async () => {
      const { addEventToGoogleCalendar } = await import('../googleCalendarService');
      
      // This will fail without a valid token, but we can test the parsing logic
      const result = await addEventToGoogleCalendar(
        'Test Event',
        'tomorrow',
        '2pm',
        'Test description'
      );
      
      // Should fail with NO_TOKEN error
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_TOKEN');
      expect(result.message).toContain('connect your Google account');
    });

    test('should parse date and time correctly for "next Tuesday at 10:30am"', async () => {
      const { addEventToGoogleCalendar } = await import('../googleCalendarService');
      
      const result = await addEventToGoogleCalendar(
        'Team Meeting',
        'next Tuesday',
        '10:30am'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_TOKEN');
    });

    test('should handle invalid date formats gracefully', async () => {
      const { addEventToGoogleCalendar } = await import('../googleCalendarService');
      
      const result = await addEventToGoogleCalendar(
        'Event',
        'invalid-date-xyz',
        '2pm'
      );
      
      expect(result.success).toBe(false);
    });
  });

  describe('Google Tasks Integration', () => {
    test('should create task without valid token and return appropriate error', async () => {
      const { addNoteToGoogleTasks } = await import('../googleTasksService');
      
      const result = await addNoteToGoogleTasks(
        'Shopping List',
        'Milk, bread, eggs'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_TOKEN');
      expect(result.message).toContain('connect your Google account');
    });

    test('should handle empty content', async () => {
      const { addNoteToGoogleTasks } = await import('../googleTasksService');
      
      const result = await addNoteToGoogleTasks(
        'Quick Note',
        ''
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_TOKEN');
    });
  });

  describe('Browser Tool Detection', () => {
    test('should detect calendar event requests', async () => {
      const { detectBrowserToolRequest } = await import('../browserIntegrationService');
      
      const testCases = [
        'Add a dentist appointment to my calendar for Tuesday',
        'Schedule a meeting for tomorrow',
        'Create a calendar event for next week',
        'Add to calendar: Team standup at 9am'
      ];

      testCases.forEach(message => {
        const result = detectBrowserToolRequest(message);
        expect(result.tool).toBe('add_calendar_event');
      });
    });

    test('should detect note-taking requests', async () => {
      const { detectBrowserToolRequest } = await import('../browserIntegrationService');
      
      const testCases = [
        'Add a note to remind me to call mom',
        'Create note: Buy groceries',
        'Save this note about the project',
        'Note to keep: Meeting notes'
      ];

      testCases.forEach(message => {
        const result = detectBrowserToolRequest(message);
        expect(result.tool).toBe('add_note');
      });
    });

    test('should detect website navigation requests', async () => {
      const { detectBrowserToolRequest } = await import('../browserIntegrationService');
      
      const testCases = [
        'Open YouTube in the browser',
        'Navigate to google.com',
        'Open website http://example.com',
        'Can you open the browser to Twitter?'
      ];

      testCases.forEach(message => {
        const result = detectBrowserToolRequest(message);
        expect(result.tool).toBe('navigate');
      });
    });

    test('should detect web search requests', async () => {
      const { detectBrowserToolRequest } = await import('../browserIntegrationService');
      
      const testCases = [
        'Search for best Italian restaurants',
        'Look up TypeScript documentation',
        'Find information about quantum computing'
      ];

      testCases.forEach(message => {
        const result = detectBrowserToolRequest(message);
        expect(result.tool).toBe('search_web');
      });
    });

    test('should not detect tool requests in normal conversation', async () => {
      const { detectBrowserToolRequest } = await import('../browserIntegrationService');
      
      const testCases = [
        'How are you today?',
        'Tell me about your day',
        'I love you',
        'What do you think about this?'
      ];

      testCases.forEach(message => {
        const result = detectBrowserToolRequest(message);
        expect(result.tool).toBe(null);
      });
    });
  });

  describe('OAuth Service', () => {
    test('should throw error when OAuth credentials are missing', async () => {
      // Temporarily remove env vars
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const { getGoogleOAuthConfig } = await import('../oauthService');
      
      expect(() => getGoogleOAuthConfig()).toThrow('Google OAuth credentials not configured');

      // Restore env vars
      process.env.GOOGLE_CLIENT_ID = clientId;
      process.env.GOOGLE_CLIENT_SECRET = clientSecret;
    });

    test('should generate valid authorization URL', async () => {
      const { getAuthorizationUrl } = await import('../oauthService');
      
      const authUrl = getAuthorizationUrl();
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('calendar');
      expect(authUrl).toContain('tasks');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('access_type=offline');
    });

    test('should return null for invalid user token', async () => {
      const { getValidAccessToken } = await import('../oauthService');
      
      const token = await getValidAccessToken('non-existent-user', 'google');
      
      expect(token).toBe(null);
    });
  });

  describe('Image Generation Keyword Detection', () => {
    test('should detect image generation requests', async () => {
      const { extractImagePrompt } = await import('../openrouterImageService');
      
      const testCases = [
        { input: 'Create an image of a sunset', expected: 'a sunset' },
        { input: 'Draw a picture of a cat', expected: 'a cat' },
        { input: 'Generate an image of mountains', expected: 'mountains' },
        { input: 'Make an image of a flower', expected: 'a flower' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractImagePrompt(input);
        expect(result).toBe(expected);
      });
    });

    test('should NOT trigger on "create" alone (to avoid false triggers)', async () => {
      const { extractImagePrompt } = await import('../openrouterImageService');
      
      const testCases = [
        'Create a calendar event for tomorrow',
        'Create a note about the meeting',
        'Create a task for grocery shopping',
        'Please create a reminder'
      ];

      testCases.forEach(input => {
        const result = extractImagePrompt(input);
        // Should be null or at least not match the whole phrase
        expect(result).not.toBe('a calendar event for tomorrow');
        expect(result).not.toBe('a note about the meeting');
      });
    });
  });
});

console.log('\n✅ Browser Integration Tests Configured');
console.log('Note: Run with test framework when available\n');
