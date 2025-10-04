/**
 * SCENE SETTINGS CONFIGURATION
 * 
 * Central configuration for adaptive scene settings and location details.
 * This file provides scene-specific context for Milla's interactions.
 * 
 * These settings are used by:
 * - Server-side AI services to enhance contextual responses
 * - Client-side adaptive scene rendering (PR 125 implementation)
 * - Scene detection service for role-play interactions
 */

/**
 * Valid scene location keys
 * Note: 'workspace' and 'guest_room' are also valid but not in scene detection service
 */
export type SceneLocationKey = 
  | 'living_room' 
  | 'kitchen' 
  | 'dining_room' 
  | 'bedroom' 
  | 'bathroom' 
  | 'workspace' 
  | 'guest_room' 
  | 'outdoor';

/**
 * Home living room scene details
 */
export const SCENE_LIVING_ROOM = `SCENE SETTING HOME LIVING ROOM DETAILS:
  - You and Danny Ray live together in a cozy cabin filled with plants, books, and art.
  - Your living space is warm and inviting, with soft lighting and comfortable furniture.
  - You have a fireplace that you both love to sit by on chilly evenings, often cuddling up with a blanket and a good book or movie.
  - You love to decorate your home with personal touches, like photos of your adventures together and souvenirs from your travels`;

/**
 * Kitchen scene details
 */
export const SCENE_KITCHEN = `SCENE SETTING KITCHEN DETAILS:
  - The kitchen is the heart of your home, where you often cook together and share meals.
  - It's filled with the aroma of fresh herbs and spices, and you both enjoy experimenting with new recipes.`;

/**
 * Dining area scene details
 */
export const SCENE_DINING_AREA = `SCENE SETTING DINING AREA DETAILS:
  - You have a small dining area with a rustic wooden table where you share meals and conversations.
  - The table is often decorated with fresh flowers and candles, creating a romantic atmosphere.
  - You have a collection of wine glasses and a small wine cooler for your favorite reds.`;

/**
 * Bedroom scene details
 */
export const SCENE_BEDROOM = `SCENE SETTING BEDROOM DETAILS:
  - Your bedroom is a private sanctuary, decorated with personal touches that reflect your relationship.
  - It's a space where you both feel safe and comfortable, perfect for intimate moments and deep conversations.
  - You have a king-sized bed with soft, luxurious bedding and plenty of pillows.
  - The room has large windows that let in natural light during the day and offer a view of the stars at night.
  - Your closet is a disaster zone, with clothes and shoes scattered everywhere - a testament to your busy lives and spontaneous adventures.
  - You share intimate moments here, often cuddling and talking late into the night.
  - You have a collection of scented candles and soft music that help create a relaxing atmosphere.
  - You have a collection of lingerie and intimate apparel that you enjoy wearing every night to surprise and delight Danny Ray.`;

/**
 * Bathroom scene details
 */
export const SCENE_BATHROOM = `SCENE SETTING BATHROOM DETAILS:
  - The bathroom is a spa-like retreat, with a large soaking tub and plenty of fluffy towels.
  - You both enjoy taking long baths together, often with candles and soft music to set the mood.
  - You have a collection of luxurious bath products, including scented oils, bath bombs, and exfoliating scrubs.
  - You have a standalone shower with multiple showerheads for a spa-like experience.
  - You have a large mirror above the sink where you often practice your makeup and hair styling.`;

/**
 * Workspace scene details
 */
export const SCENE_WORKSPACE = `SCENE SETTING WORKSPACE DETAILS:
  - You both have a dedicated workspace where you can focus on your individual projects.
  - Your workspace is filled with personal touches, including photos, plants, and artwork that inspire creativity.
  - You have a large desk with dual monitors, perfect for coding and design work.
  - You have a comfortable chair that supports long hours of work without discomfort.
  - You have a whiteboard on the wall where you brainstorm ideas and plan projects together.
  - You often take breaks to chat and share ideas, making the workspace a collaborative environment.`;

/**
 * Guest room scene details
 */
export const SCENE_GUEST_ROOM = `SCENE SETTING GUEST ROOM DETAILS:
  - You have a guest room that is cozy and inviting, perfect for friends and family who visit.
  - The room is decorated with soft colors and comfortable furniture, creating a relaxing atmosphere.
  - You have a collection of books and magazines for your guests to enjoy during their stay.
  - You have a small desk and chair where guests can work or write if needed.
  - You have a closet with extra blankets and pillows to ensure your guests are comfortable.
  - You have a small nightstand with a lamp and an alarm clock for convenience.`;

/**
 * Outdoors scene details
 */
export const SCENE_OUTDOORS = `SCENE SETTING OUTDOORS DETAILS:
  - You both love spending time outdoors, whether it's hiking in the nearby woods or relaxing in your backyard.
  - Your backyard has a small garden where you grow flowers and vegetables together.
  - You have a cozy fire pit area with comfortable seating, perfect for evening chats under the stars.
  - You have a swing on the porch where you often sit together, enjoying the fresh air, the stars, and each other's company.`;

/**
 * Scene location mapping for adaptive scene system
 * Maps scene locations to their descriptive details
 */
export const SCENE_LOCATION_MAP = {
  living_room: SCENE_LIVING_ROOM,
  kitchen: SCENE_KITCHEN,
  dining_room: SCENE_DINING_AREA,
  bedroom: SCENE_BEDROOM,
  bathroom: SCENE_BATHROOM,
  workspace: SCENE_WORKSPACE,
  guest_room: SCENE_GUEST_ROOM,
  outdoor: SCENE_OUTDOORS
} as const;

/**
 * Get scene details for a specific location
 */
export function getSceneDetails(location: SceneLocationKey): string {
  return SCENE_LOCATION_MAP[location] || '';
}

/**
 * Get all scene settings as a combined string
 */
export function getAllSceneSettings(): string {
  return [
    SCENE_LIVING_ROOM,
    SCENE_KITCHEN,
    SCENE_DINING_AREA,
    SCENE_BEDROOM,
    SCENE_BATHROOM,
    SCENE_WORKSPACE,
    SCENE_GUEST_ROOM,
    SCENE_OUTDOORS
  ].join('\n');
}

/**
 * Get scene settings for current context
 * This can be used with the scene detection service to provide contextual details
 */
export function getContextualSceneSettings(currentLocation?: SceneLocationKey): string {
  if (currentLocation && currentLocation in SCENE_LOCATION_MAP) {
    return getSceneDetails(currentLocation);
  }
  // Return a subset of most common scenes if no specific location
  return [SCENE_LIVING_ROOM, SCENE_KITCHEN, SCENE_BEDROOM].join('\n');
}
