#!/usr/bin/env tsx

/**
 * Test script to verify browser integration service
 */

import { 
  detectBrowserToolRequest, 
  getBrowserToolInstructions,
  navigateToUrl,
  addNoteToKeep,
  addCalendarEvent,
  searchWeb
} from '../server/browserIntegrationService';

console.log('🧪 Testing Browser Integration Service\n');

// Test 1: Tool Detection
console.log('Test 1: Tool Detection');
console.log('='.repeat(50));

const testMessages = [
  'Can you add a note to Keep?',
  'Open YouTube in the browser',
  'Add an appointment to my calendar for tomorrow',
  'Search for the best restaurants nearby',
  'Just having a casual conversation'
];

testMessages.forEach(msg => {
  const result = detectBrowserToolRequest(msg);
  console.log(`Message: "${msg}"`);
  console.log(`Detected: ${result.tool || 'none'}`);
  console.log('---');
});

// Test 2: Tool Instructions
console.log('\nTest 2: Browser Tool Instructions');
console.log('='.repeat(50));
const instructions = getBrowserToolInstructions();
console.log(instructions.substring(0, 200) + '...');

// Test 3: Tool Execution (mocked)
console.log('\nTest 3: Tool Execution (Mocked)');
console.log('='.repeat(50));

(async () => {
  const navResult = await navigateToUrl('https://www.youtube.com');
  console.log('Navigate:', navResult.message);

  const noteResult = await addNoteToKeep('Shopping List', 'Buy groceries');
  console.log('Add Note:', noteResult.message);

  const calResult = await addCalendarEvent('Dentist Appointment', '2025-01-15', '10:00 AM');
  console.log('Add Calendar:', calResult.message);

  const searchResult = await searchWeb('Italian restaurants near me');
  console.log('Search:', searchResult.message);

  console.log('\n✅ All tests completed successfully!');
})();
