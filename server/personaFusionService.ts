/**
 * Persona Fusion Service
 *
 * Creates a unified, hyper-contextualized snapshot of the user by synthesizing:
 * 1. Long-term goals and preferences (from profileService)
 * 2. Vector/semantic memories (from memoryService)
 * 3. Real-time ambient context (from realWorldInfoService)
 *
 * This service bridges Phase III and Phase IV for true personalization.
 */

import { getProfile, type UserProfile } from './profileService';
import { getSemanticMemoryContext } from './memoryService';
import {
  getAmbientContext,
  type AmbientContext,
  getCurrentDateTime,
} from './realWorldInfoService';

export interface ActiveUserPersona {
  userId: string;
  timestamp: number;

  // Long-term profile data
  profile: {
    name: string;
    interests: string[];
    preferences: Record<string, string>;
    goals?: string[];
  };

  // Relevant semantic memories
  memoryContext: {
    recentInteractions: string;
    relevantTopics: string[];
    emotionalPatterns: string[];
  };

  // Real-time ambient data
  ambientContext: {
    timeOfDay: string;
    dateInfo: string;
    location?: {
      available: boolean;
      general?: string;
    };
    deviceState?: {
      battery?: number;
      charging?: boolean;
      network?: string;
    };
    motion?: string;
    lightLevel?: string;
  };

  // Synthesized persona summary
  personaSummary: string;
}

/**
 * Generate an Active User Persona for the current moment
 *
 * This function synthesizes data from multiple sources to create a rich,
 * contextualized understanding of the user's current state, preferences,
 * and environment.
 */
export async function generateActivePersona(
  userId: string,
  currentMessage?: string
): Promise<ActiveUserPersona> {
  console.log(`Generating Active Persona for user: ${userId}`);

  // 1. Fetch long-term profile data
  const profile = await getProfile(userId);
  const profileData = {
    name: profile?.name || 'User',
    interests: profile?.interests || [],
    preferences: profile?.preferences || {},
    goals: [], // Could be extended with goal tracking
  };

  // 2. Fetch relevant semantic memories
  const memoryContextData: {
    recentInteractions: string;
    relevantTopics: string[];
    emotionalPatterns: string[];
  } = {
    recentInteractions: '',
    relevantTopics: [],
    emotionalPatterns: [],
  };

  try {
    if (currentMessage) {
      const memoryContext = await getSemanticMemoryContext(
        currentMessage,
        userId
      );
      memoryContextData.recentInteractions = memoryContext || '';

      // Extract topics from memory context
      const topics = extractTopicsFromMemory(memoryContext || '');
      memoryContextData.relevantTopics = topics;

      // Extract emotional patterns
      const emotions = extractEmotionalPatterns(memoryContext || '');
      memoryContextData.emotionalPatterns = emotions;
    }
  } catch (error) {
    console.error('Error fetching semantic memory context:', error);
  }

  // 3. Fetch real-time ambient context
  const ambientData = getAmbientContext(userId);
  const dateTime = getCurrentDateTime();

  const ambientContextData = {
    timeOfDay: dateTime.time,
    dateInfo: dateTime.date,
    location: ambientData?.location
      ? {
          available: true,
          general: 'Location available',
        }
      : undefined,
    deviceState: {
      battery: ambientData?.deviceContext.battery || undefined,
      charging: ambientData?.deviceContext.charging,
      network: ambientData?.deviceContext.network || undefined,
    },
    motion:
      ambientData?.motionState && ambientData.motionState !== 'unknown'
        ? ambientData.motionState
        : undefined,
    lightLevel:
      ambientData?.lightLevel !== undefined
        ? describeLightLevel(ambientData.lightLevel)
        : undefined,
  };

  // 4. Synthesize persona summary
  const personaSummary = synthesizePersonaSummary({
    profile: profileData,
    memory: memoryContextData,
    ambient: ambientContextData,
  });

  const persona: ActiveUserPersona = {
    userId,
    timestamp: Date.now(),
    profile: profileData,
    memoryContext: memoryContextData,
    ambientContext: ambientContextData,
    personaSummary,
  };

  console.log(`✅ Active Persona generated for ${profileData.name}`);

  return persona;
}

/**
 * Extract topics from memory context
 */
function extractTopicsFromMemory(memoryContext: string): string[] {
  const topics: string[] = [];

  // Look for common topic patterns in the memory context
  const topicPatterns = [
    /about (\w+)/gi,
    /discussed (\w+)/gi,
    /talked about (\w+)/gi,
    /interested in (\w+)/gi,
  ];

  for (const pattern of topicPatterns) {
    const matches = memoryContext.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 3) {
        topics.push(match[1].toLowerCase());
      }
    }
  }

  return [...new Set(topics)].slice(0, 5);
}

/**
 * Extract emotional patterns from memory context
 */
function extractEmotionalPatterns(memoryContext: string): string[] {
  const emotions: string[] = [];

  const emotionalKeywords = {
    positive: [
      'happy',
      'excited',
      'joy',
      'grateful',
      'love',
      'wonderful',
      'great',
    ],
    negative: ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'upset'],
    neutral: ['calm', 'relaxed', 'peaceful', 'content'],
  };

  const lowerContext = memoryContext.toLowerCase();

  for (const [category, keywords] of Object.entries(emotionalKeywords)) {
    for (const keyword of keywords) {
      if (lowerContext.includes(keyword)) {
        emotions.push(category);
        break;
      }
    }
  }

  return [...new Set(emotions)];
}

/**
 * Describe light level in human-readable terms
 */
function describeLightLevel(level: number): string {
  if (level > 70) return 'bright';
  if (level > 30) return 'moderate';
  return 'low';
}

/**
 * Synthesize a comprehensive persona summary
 */
function synthesizePersonaSummary(data: {
  profile: ActiveUserPersona['profile'];
  memory: ActiveUserPersona['memoryContext'];
  ambient: ActiveUserPersona['ambientContext'];
}): string {
  const parts: string[] = [];

  // User identity
  parts.push(`User: ${data.profile.name}`);

  // Interests and preferences
  if (data.profile.interests.length > 0) {
    parts.push(`Interests: ${data.profile.interests.join(', ')}`);
  }

  // Current time context
  parts.push(
    `Current time: ${data.ambient.timeOfDay} on ${data.ambient.dateInfo}`
  );

  // Recent topics
  if (data.memory.relevantTopics.length > 0) {
    parts.push(`Recent topics: ${data.memory.relevantTopics.join(', ')}`);
  }

  // Emotional state
  if (data.memory.emotionalPatterns.length > 0) {
    parts.push(
      `Emotional patterns: ${data.memory.emotionalPatterns.join(', ')}`
    );
  }

  // Environmental context
  if (data.ambient.motion) {
    parts.push(`Activity: ${data.ambient.motion}`);
  }

  if (data.ambient.lightLevel) {
    parts.push(`Environment: ${data.ambient.lightLevel} lighting`);
  }

  // Device state
  if (data.ambient.deviceState?.battery !== undefined) {
    const batteryStatus = data.ambient.deviceState.charging
      ? `${data.ambient.deviceState.battery}% (charging)`
      : `${data.ambient.deviceState.battery}%`;
    parts.push(`Device battery: ${batteryStatus}`);
  }

  return parts.join(' | ');
}

/**
 * Format Active Persona for inclusion in AI system prompt
 */
export function formatPersonaForPrompt(persona: ActiveUserPersona): string {
  const sections: string[] = [];

  sections.push('=== ACTIVE USER PERSONA ===\n');

  // Profile section
  sections.push('USER PROFILE:');
  sections.push(`- Name: ${persona.profile.name}`);
  if (persona.profile.interests.length > 0) {
    sections.push(`- Interests: ${persona.profile.interests.join(', ')}`);
  }
  if (Object.keys(persona.profile.preferences).length > 0) {
    sections.push(`- Preferences:`);
    for (const [key, value] of Object.entries(persona.profile.preferences)) {
      sections.push(`  * ${key}: ${value}`);
    }
  }
  sections.push('');

  // Memory context section
  if (persona.memoryContext.recentInteractions) {
    sections.push('RELEVANT MEMORIES:');
    sections.push(persona.memoryContext.recentInteractions);
    sections.push('');
  }

  // Ambient context section
  sections.push('REAL-TIME CONTEXT:');
  sections.push(`- Current time: ${persona.ambientContext.timeOfDay}`);
  sections.push(`- Date: ${persona.ambientContext.dateInfo}`);

  if (persona.ambientContext.motion) {
    sections.push(`- User activity: ${persona.ambientContext.motion}`);
  }

  if (persona.ambientContext.lightLevel) {
    sections.push(`- Lighting: ${persona.ambientContext.lightLevel}`);
  }

  if (persona.ambientContext.deviceState?.battery !== undefined) {
    const batteryInfo = persona.ambientContext.deviceState.charging
      ? `${persona.ambientContext.deviceState.battery}% (charging)`
      : `${persona.ambientContext.deviceState.battery}%`;
    sections.push(`- Device battery: ${batteryInfo}`);
  }

  sections.push('');
  sections.push('=== END PERSONA ===\n');

  return sections.join('\n');
}
