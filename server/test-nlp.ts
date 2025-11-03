/**
 * Test script for Natural Language Processing improvements
 * Run with: npx tsx server/test-nlp.ts
 */

// Mock the openrouterService since we're testing pattern matching
const mockOpenRouterResponse = async (prompt: string, context: any) => ({
  success: true,
  content: JSON.stringify({
    service: 'youtube',
    action: 'get',
    entities: { query: 'fallback test', sortBy: 'relevance' }
  })
});

// Replace the import temporarily for testing
const originalImport = require('./commandParserLLM');

// Test cases
const testCases = [
  // YouTube natural language tests
  { input: 'play some music', expected: { service: 'youtube', action: 'get', query: 'music' } },
  { input: 'watch cooking videos', expected: { service: 'youtube', action: 'get', query: 'cooking' } },
  { input: 'show me funny cat videos', expected: { service: 'youtube', action: 'get', query: 'funny cat' } },
  { input: 'I want to see space documentaries', expected: { service: 'youtube', action: 'get', query: 'space documentaries' } },
  { input: 'put on some jazz', expected: { service: 'youtube', action: 'get', query: 'jazz' } },
  { input: 'find workout videos', expected: { service: 'youtube', action: 'get', query: 'workout' } },
  { input: 'can you play beethoven', expected: { service: 'youtube', action: 'get', query: 'beethoven' } },
  { input: 'search for meditation music', expected: { service: 'youtube', action: 'get', query: 'meditation' } },
  
  // Calendar tests
  { input: "what's on my calendar", expected: { service: 'calendar', action: 'list' } },
  { input: 'show my schedule', expected: { service: 'calendar', action: 'list' } },
  { input: 'check my events', expected: { service: 'calendar', action: 'list' } },
  
  // Email tests
  { input: 'check my email', expected: { service: 'gmail', action: 'list' } },
  { input: 'show my inbox', expected: { service: 'gmail', action: 'list' } },
  { input: 'read my mail', expected: { service: 'gmail', action: 'list' } },
];

async function runTests() {
  console.log('🧪 Testing Natural Language Processing Improvements\n');
  console.log('=' .repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const { parseCommandLLM } = await import('./commandParserLLM');
    
    try {
      const result = await parseCommandLLM(testCase.input);
      
      const serviceMatch = result.service === testCase.expected.service;
      const actionMatch = result.action === testCase.expected.action;
      const queryMatch = !testCase.expected.query || 
                        result.entities.query?.toLowerCase().includes(testCase.expected.query.toLowerCase());
      
      const success = serviceMatch && actionMatch && queryMatch;
      
      if (success) {
        console.log(`✅ PASS: "${testCase.input}"`);
        console.log(`   → ${result.service}/${result.action}${result.entities.query ? ` query:"${result.entities.query}"` : ''}`);
        passed++;
      } else {
        console.log(`❌ FAIL: "${testCase.input}"`);
        console.log(`   Expected: ${testCase.expected.service}/${testCase.expected.action}${testCase.expected.query ? ` query:"${testCase.expected.query}"` : ''}`);
        console.log(`   Got: ${result.service}/${result.action}${result.entities.query ? ` query:"${result.entities.query}"` : ''}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: "${testCase.input}"`);
      console.log(`   ${error}`);
      failed++;
    }
    
    console.log('-'.repeat(70));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  console.log(`   Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (passed === testCases.length) {
    console.log('\n🎉 All tests passed! Natural language processing is working great!');
  } else if (passed > 0) {
    console.log('\n⚠️  Some tests failed. Pattern matching may need adjustment.');
  } else {
    console.log('\n❌ All tests failed. Check the implementation.');
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
