/**
 * GOOGLE MAPS API SERVICE
 *
 * Provides Google Maps API integration using an API key.
 */

export interface MapsAPIResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

import { config } from './config';

const API_KEY = config.google.mapsApiKey;

/**
 * Get directions between two locations
 */
export async function getDirections(
  origin: string,
  destination: string
): Promise<MapsAPIResult> {
  if (!API_KEY) {
    return {
      success: false,
      message: 'Google Maps API key not configured.',
      error: 'NO_API_KEY',
    };
  }

  if (!origin || !destination) {
    return {
      success: false,
      message: 'Origin and destination cannot be empty.',
      error: 'INVALID_INPUT',
    };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error_message || 'Unknown error';
      return {
        success: false,
        message: `Failed to get directions: ${errorMessage}`,
        error: `API_ERROR: ${errorData.status || 'UNKNOWN'}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Directions retrieved successfully.',
      data: data,
    };
  } catch (error) {
    console.error('[Google Maps API] Error getting directions:', error);
    return {
      success: false,
      message: `An error occurred while getting directions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Find a place by query
 */
export async function findPlace(query: string): Promise<MapsAPIResult> {
  if (!API_KEY) {
    return {
      success: false,
      message: 'Google Maps API key not configured.',
      error: 'NO_API_KEY',
    };
  }

  if (!query) {
    return {
      success: false,
      message: 'Search query cannot be empty.',
      error: 'INVALID_INPUT',
    };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=formatted_address,name,rating,opening_hours&key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error_message || 'Unknown error';
      return {
        success: false,
        message: `Failed to find place: ${errorMessage}`,
        error: `API_ERROR: ${errorData.status || 'UNKNOWN'}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Place found successfully.',
      data: data,
    };
  } catch (error) {
    console.error('[Google Maps API] Error finding place:', error);
    return {
      success: false,
      message: `An error occurred while finding a place: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}
