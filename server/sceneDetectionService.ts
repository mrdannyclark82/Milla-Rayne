/**
 * Scene Detection Service for Role-Play Scenes Phase 3
 * 
 * Parses user messages for italic star markers (*action*) and detects scene changes.
 * Returns scene metadata including location, mood, and time of day.
 * 
 * Integrates with centralized scene settings from shared/sceneSettings.ts
 */

import { getSceneDetails, getContextualSceneSettings } from "@shared/sceneSettings";

export type SceneLocation = 
  | 'living_room' 
  | 'bedroom' 
  | 'kitchen' 
  | 'bathroom'
  | 'front_door'
  | 'dining_room'
  | 'outdoor'
  | 'car'
  | 'unknown';

export type SceneMood = 'calm' | 'energetic' | 'romantic' | 'mysterious' | 'playful';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface SceneContext {
  location: SceneLocation;
  mood: SceneMood;
  timeOfDay: TimeOfDay;
  action?: string;
  hasSceneChange: boolean;
}

/**
 * Extract action markers from user message (text between asterisks)
 */
export function extractActionMarkers(message: string): string[] {
  const actionPattern = /\*([^*]+)\*/g;
  const actions: string[] = [];
  let match;
  
  while ((match = actionPattern.exec(message)) !== null) {
    actions.push(match[1].trim());
  }
  
  return actions;
}

/**
 * Detect scene location from action text and full message context
 */
export function detectLocation(action: string, fullMessage?: string): SceneLocation {
  const actionLower = action.toLowerCase();
  const fullLower = fullMessage ? fullMessage.toLowerCase() : actionLower;
  
  // More specific location keywords to avoid false triggers from common words
  // Use longer phrases and more contextual terms
  const locationKeywords: Record<SceneLocation, string[]> = {
    living_room: ['living room', 'sits on the couch', 'on the sofa', 'in the tv room', 'watching tv'],
    bedroom: ['in the bedroom', 'goes to bed', 'lies down in bed', 'go to the bedroom', 'sleeping in bed'],
    kitchen: ['in the kitchen', 'cooking in the', 'opens the fridge', 'at the stove', 'preparing food'],
    bathroom: ['in the bathroom', 'takes a shower', 'in the bath', 'washing up'],
    front_door: ['walks in through', 'at the front door', 'opens the front door', 'arrives home', 'comes in the door'],
    dining_room: ['in the dining room', 'sits at the dining table', 'eating at the table'],
    outdoor: ['goes outside', 'in the garden', 'in the yard', 'steps outside', 'on the patio'],
    car: ['gets in the car', 'in the car', 'driving the car', 'in the vehicle'],
    unknown: []
  };
  
  // Check for each location's keywords in action first (higher priority)
  for (const [location, keywords] of Object.entries(locationKeywords)) {
    if (location === 'unknown') continue;
    
    for (const keyword of keywords) {
      if (actionLower.includes(keyword)) {
        return location as SceneLocation;
      }
    }
  }
  
  // Then check in full message (lower priority, only if action didn't match)
  for (const [location, keywords] of Object.entries(locationKeywords)) {
    if (location === 'unknown') continue;
    
    for (const keyword of keywords) {
      if (fullLower.includes(keyword)) {
        return location as SceneLocation;
      }
    }
  }
  
  return 'unknown';
}

/**
 * Detect mood from action and context
 */
export function detectMood(action: string, messageContext: string): SceneMood {
  const combined = (action + ' ' + messageContext).toLowerCase();
  
  // Mood keywords
  const moodKeywords: Record<SceneMood, string[]> = {
    romantic: ['kiss', 'embrace', 'cuddle', 'love', 'gentle', 'softly', 'tenderly'],
    playful: ['playfully', 'giggles', 'laughs', 'teasing', 'winks', 'smirks', 'grins'],
    energetic: ['jumps', 'runs', 'rushes', 'excitedly', 'bounces', 'energetic'],
    mysterious: ['quietly', 'slowly', 'sneaks', 'whispers', 'dimly', 'shadows'],
    calm: ['sits', 'walks', 'relaxes', 'peaceful', 'calmly', 'breathes']
  };
  
  // Count matches for each mood
  const moodScores: Record<SceneMood, number> = {
    romantic: 0,
    playful: 0,
    energetic: 0,
    mysterious: 0,
    calm: 0
  };
  
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        moodScores[mood as SceneMood]++;
      }
    }
  }
  
  // Return mood with highest score, default to calm
  const maxMood = Object.entries(moodScores).reduce((max, [mood, score]) => 
    score > max[1] ? [mood, score] : max
  , ['calm', 0] as [string, number]);
  
  return maxMood[0] as SceneMood;
}

/**
 * Get current time of day
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/**
 * Detect scene context from user message
 * This is the main function to call from routes
 */
export function detectSceneContext(
  userMessage: string, 
  previousLocation: SceneLocation = 'unknown'
): SceneContext {
  const actions = extractActionMarkers(userMessage);
  
  // If no actions found, maintain previous location with current time/mood
  if (actions.length === 0) {
    return {
      location: previousLocation,
      mood: 'calm',
      timeOfDay: getCurrentTimeOfDay(),
      hasSceneChange: false
    };
  }
  
  // Process the first action (most relevant)
  const primaryAction = actions[0];
  const detectedLocation = detectLocation(primaryAction, userMessage);
  const detectedMood = detectMood(primaryAction, userMessage);
  
  // Determine if there was a scene change
  const hasSceneChange = detectedLocation !== 'unknown' && detectedLocation !== previousLocation;
  
  // If location is unknown, keep previous location
  const finalLocation = detectedLocation !== 'unknown' ? detectedLocation : previousLocation;
  
  return {
    location: finalLocation,
    mood: detectedMood,
    timeOfDay: getCurrentTimeOfDay(),
    action: primaryAction,
    hasSceneChange
  };
}

/**
 * Map location to mood suggestion (for background adaptation)
 * This helps provide a more immersive scene by suggesting mood based on location
 */
export function getLocationMoodSuggestion(location: SceneLocation): SceneMood {
  const locationMoodMap: Record<SceneLocation, SceneMood> = {
    living_room: 'calm',
    bedroom: 'romantic',
    kitchen: 'energetic',
    bathroom: 'calm',
    front_door: 'energetic',
    dining_room: 'calm',
    outdoor: 'playful',
    car: 'energetic',
    unknown: 'calm'
  };
  
  return locationMoodMap[location];
}

/**
 * Get scene description details for a detected location
 * This integrates with the centralized scene settings
 */
export function getSceneDescription(location: SceneLocation): string {
  // Map scene detection locations to centralized scene settings
  const locationMap: Record<string, string> = {
    'living_room': 'living_room',
    'bedroom': 'bedroom',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'dining_room': 'dining_room',
    'outdoor': 'outdoor',
    'front_door': 'living_room', // Front door leads to living room
    'car': 'outdoor', // Car is considered outdoor
    'workspace': 'workspace',
    'guest_room': 'guest_room'
  };

  const mappedLocation = locationMap[location];
  if (mappedLocation) {
    try {
      return getSceneDetails(mappedLocation as any) || '';
    } catch (error) {
      console.warn(`Could not get scene details for location: ${location}`, error);
      return '';
    }
  }
  
  return '';
}

/**
 * Get contextual scene settings for current detected scene
 * Useful for AI services to enhance responses with scene-specific details
 */
export function getSceneContextSettings(sceneContext: SceneContext): string {
  if (sceneContext.location === 'unknown') {
    return getContextualSceneSettings();
  }
  
  return getSceneDescription(sceneContext.location) || getContextualSceneSettings();
}
