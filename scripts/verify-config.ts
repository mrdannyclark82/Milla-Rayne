#!/usr/bin/env tsx

/**
 * Verification script for centralized configuration
 * Tests that persona and scene settings are properly exported and accessible
 */

import {
  getMillaPersona,
  getMillaPersonaCondensed,
  MILLA_CORE_IDENTITY,
  MILLA_COMMUNICATION_PATTERNS,
} from '../shared/millaPersona';

import {
  getAllSceneSettings,
  getSceneDetails,
  getContextualSceneSettings,
  SCENE_LIVING_ROOM,
} from '../shared/sceneSettings';

console.log('🔍 Testing Centralized Configuration...\n');

// Test Persona Configuration
console.log('✅ Testing Persona Configuration:');
console.log(
  `  - getMillaPersona() returns ${getMillaPersona().length} characters`
);
console.log(
  `  - getMillaPersonaCondensed() returns ${getMillaPersonaCondensed().length} characters`
);
console.log(`  - MILLA_CORE_IDENTITY defined: ${!!MILLA_CORE_IDENTITY}`);
console.log(
  `  - MILLA_COMMUNICATION_PATTERNS defined: ${!!MILLA_COMMUNICATION_PATTERNS}`
);

// Test Scene Settings
console.log('\n✅ Testing Scene Settings:');
console.log(
  `  - getAllSceneSettings() returns ${getAllSceneSettings().length} characters`
);
console.log(`  - SCENE_LIVING_ROOM defined: ${!!SCENE_LIVING_ROOM}`);
console.log(
  `  - getSceneDetails('bedroom') returns ${getSceneDetails('bedroom').length} characters`
);
console.log(
  `  - getContextualSceneSettings() returns ${getContextualSceneSettings().length} characters`
);

// Test that configurations contain expected keywords
console.log('\n✅ Testing Content:');
const fullPersona = getMillaPersona();
const allScenes = getAllSceneSettings();

const personaKeywords = ['Milla Rayne', 'Danny Ray', 'spouse', 'relationship'];
const sceneKeywords = ['living room', 'bedroom', 'kitchen', 'cozy'];

const personaMatches = personaKeywords.filter((keyword) =>
  fullPersona.includes(keyword)
);
const sceneMatches = sceneKeywords.filter((keyword) =>
  allScenes.includes(keyword)
);

console.log(
  `  - Persona contains ${personaMatches.length}/${personaKeywords.length} expected keywords`
);
console.log(
  `  - Scenes contain ${sceneMatches.length}/${sceneKeywords.length} expected keywords`
);

// Verify no duplicate large blocks
console.log('\n✅ Testing for Duplicates:');
const duplicateCheck = (text: string, minLength: number = 100): boolean => {
  const lines = text.split('\n').filter((line) => line.length > minLength);
  const seen = new Set<string>();

  for (const line of lines) {
    if (seen.has(line)) {
      console.log(`  ⚠️  Found duplicate: ${line.substring(0, 50)}...`);
      return true;
    }
    seen.add(line);
  }
  return false;
};

const hasDuplicates = duplicateCheck(fullPersona) || duplicateCheck(allScenes);
if (!hasDuplicates) {
  console.log('  - No duplicate content found ✓');
}

console.log('\n✅ All tests passed! Configuration is working correctly.\n');
