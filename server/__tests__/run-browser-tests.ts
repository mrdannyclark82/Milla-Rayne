#!/usr/bin/env tsx

/**
 * MANUAL TEST RUNNER FOR BROWSER INTEGRATION
 *
 * This script provides a simple way to manually test browser integration
 * features without requiring a full test framework setup.
 */

console.log('\n🧪 Browser Integration Manual Test Runner\n');
console.log('='.repeat(60));

// Set up test environment
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_OAUTH_REDIRECT_URI = 'http://localhost:5000/oauth/callback';
process.env.MEMORY_KEY =
  'test-memory-key-with-at-least-32-characters-for-encryption-purposes';

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name: string, testFn: () => Promise<void> | void) {
  try {
    await testFn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.error(
      `   Error: ${error instanceof Error ? error.message : String(error)}`
    );
    testsFailed++;
  }
}

async function main() {
  console.log('\n📋 Test Suite: Browser Tool Detection\n');

  // Test 1: Calendar event detection
  await runTest('Detect calendar event requests', async () => {
    const { detectBrowserToolRequest } = await import(
      '../browserIntegrationService'
    );

    const tests = [
      'Add a dentist appointment to my calendar for Tuesday',
      'Schedule a meeting for tomorrow',
      'Create a calendar event for next week',
    ];

    tests.forEach((message) => {
      const result = detectBrowserToolRequest(message);
      if (result.tool !== 'add_calendar_event') {
        throw new Error(
          `Expected 'add_calendar_event' for "${message}", got ${result.tool}`
        );
      }
    });
  });

  // Test 2: Note detection
  await runTest('Detect note-taking requests', async () => {
    const { detectBrowserToolRequest } = await import(
      '../browserIntegrationService'
    );

    const tests = [
      'Add a note to remind me to call mom',
      'Create note: Buy groceries',
      'Save this note about the project',
    ];

    tests.forEach((message) => {
      const result = detectBrowserToolRequest(message);
      if (result.tool !== 'add_note') {
        throw new Error(
          `Expected 'add_note' for "${message}", got ${result.tool}`
        );
      }
    });
  });

  // Test 3: Website navigation detection
  await runTest('Detect website navigation requests', async () => {
    const { detectBrowserToolRequest } = await import(
      '../browserIntegrationService'
    );

    const tests = [
      'Open YouTube in the browser',
      'Navigate to google.com',
      'Open website http://example.com',
    ];

    tests.forEach((message) => {
      const result = detectBrowserToolRequest(message);
      if (result.tool !== 'navigate') {
        throw new Error(
          `Expected 'navigate' for "${message}", got ${result.tool}`
        );
      }
    });
  });

  // Test 4: No false positives
  await runTest('No false positives in normal conversation', async () => {
    const { detectBrowserToolRequest } = await import(
      '../browserIntegrationService'
    );

    const tests = [
      'How are you today?',
      'Tell me about your day',
      'I love you',
      'What do you think about this?',
    ];

    tests.forEach((message) => {
      const result = detectBrowserToolRequest(message);
      if (result.tool !== null) {
        throw new Error(
          `Expected null for normal message "${message}", got ${result.tool}`
        );
      }
    });
  });

  console.log('\n📋 Test Suite: Image Generation Keywords\n');

  // Test 5: Image generation detection
  await runTest('Detect image generation requests correctly', async () => {
    const { extractImagePrompt } = await import('../openrouterImageService');

    const tests = [
      { input: 'Create an image of a sunset', expected: 'a sunset' },
      { input: 'Draw a picture of a cat', expected: 'a cat' },
      { input: 'Generate an image of mountains', expected: 'mountains' },
    ];

    tests.forEach(({ input, expected }) => {
      const result = extractImagePrompt(input);
      if (result !== expected) {
        throw new Error(
          `Expected "${expected}" for "${input}", got "${result}"`
        );
      }
    });
  });

  // Test 6: No false triggers on "create"
  await runTest('No false image triggers on generic "create"', async () => {
    const { extractImagePrompt } = await import('../openrouterImageService');

    const tests = [
      'Create a calendar event for tomorrow',
      'Create a note about the meeting',
      'Create a task for grocery shopping',
    ];

    tests.forEach((input) => {
      const result = extractImagePrompt(input);
      // Should either be null or not match the full phrase
      if (
        result === 'a calendar event for tomorrow' ||
        result === 'a note about the meeting' ||
        result === 'a task for grocery shopping'
      ) {
        throw new Error(`Should not trigger image generation for: "${input}"`);
      }
    });
  });

  console.log('\n📋 Test Suite: Google Calendar API\n');

  // Test 7: Calendar API without token
  await runTest('Calendar API returns error without token', async () => {
    const { addEventToGoogleCalendar } = await import(
      '../googleCalendarService'
    );

    const result = await addEventToGoogleCalendar(
      'Test Event',
      'tomorrow',
      '2pm'
    );

    if (result.success !== false) {
      throw new Error('Expected failure without token');
    }
    if (result.error !== 'NO_TOKEN') {
      throw new Error(`Expected NO_TOKEN error, got ${result.error}`);
    }
  });

  console.log('\n📋 Test Suite: Google Tasks API\n');

  // Test 8: Tasks API without token
  await runTest('Tasks API returns error without token', async () => {
    const { addNoteToGoogleTasks } = await import('../googleTasksService');

    const result = await addNoteToGoogleTasks(
      'Shopping List',
      'Milk, bread, eggs'
    );

    if (result.success !== false) {
      throw new Error('Expected failure without token');
    }
    if (result.error !== 'NO_TOKEN') {
      throw new Error(`Expected NO_TOKEN error, got ${result.error}`);
    }
  });

  console.log('\n📋 Test Suite: OAuth Configuration\n');

  // Test 9: OAuth URL generation
  await runTest('OAuth URL generated correctly', async () => {
    const { getAuthorizationUrl } = await import('../oauthService');

    const authUrl = getAuthorizationUrl();

    if (!authUrl.includes('https://accounts.google.com/o/oauth2/v2/auth')) {
      throw new Error('Invalid OAuth URL base');
    }
    if (!authUrl.includes('client_id=test-client-id')) {
      throw new Error('Missing client_id in OAuth URL');
    }
    if (!authUrl.includes('calendar') || !authUrl.includes('tasks')) {
      throw new Error('Missing required scopes in OAuth URL');
    }
  });

  // Test 10: OAuth config validation
  await runTest('OAuth throws error without credentials', async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    try {
      // Re-import to get fresh module
      delete require.cache[require.resolve('./oauthService')];
      const { getGoogleOAuthConfig } = await import('../oauthService');
      getGoogleOAuthConfig();
      throw new Error('Should have thrown error for missing credentials');
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('OAuth credentials not configured')
      ) {
        throw new Error(`Wrong error thrown: ${error}`);
      }
    } finally {
      // Restore
      process.env.GOOGLE_CLIENT_ID = clientId;
      process.env.GOOGLE_CLIENT_SECRET = clientSecret;
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n💥 Test runner crashed:', error);
  process.exit(1);
});
