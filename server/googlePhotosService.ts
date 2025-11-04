/**
 * GOOGLE PHOTOS API SERVICE
 *
 * Provides Google Photos API integration using OAuth tokens.
 */

import { getValidAccessToken } from './oauthService';

export interface PhotosAPIResult {
  success: boolean;
  message: string;
  mediaItems?: any[];
  album?: any;
  error?: string;
}

/**
 * Search for photos in Google Photos
 */
export async function searchPhotos(
  query: string,
  userId: string = 'default-user'
): Promise<PhotosAPIResult> {
  if (!query) {
    return {
      success: false,
      message: 'Search query cannot be empty.',
      error: 'INVALID_INPUT',
    };
  }

  try {
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: 'You need to connect your Google account first.',
        error: 'NO_TOKEN',
      };
    }

    const response = await fetch(
      'https://photoslibrary.googleapis.com/v1/mediaItems:search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters: { contentFilter: { includedContentCategories: [query] } } }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to search for photos: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully found ${data.mediaItems ? data.mediaItems.length : 0} photos.`,
      mediaItems: data.mediaItems,
    };
  } catch (error) {
    console.error('[Google Photos API] Error searching photos:', error);
    return {
      success: false,
      message: `An error occurred while searching for photos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Create an album in Google Photos
 */
export async function createAlbum(
  title: string,
  userId: string = 'default-user'
): Promise<PhotosAPIResult> {
  if (!title) {
    return {
      success: false,
      message: 'Album title cannot be empty.',
      error: 'INVALID_INPUT',
    };
  }

  try {
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: 'You need to connect your Google account first.',
        error: 'NO_TOKEN',
      };
    }

    const response = await fetch(
      'https://photoslibrary.googleapis.com/v1/albums',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ album: { title } }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to create album: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully created album "${data.title}".`,
      album: data,
    };
  } catch (error) {
    console.error('[Google Photos API] Error creating album:', error);
    return {
      success: false,
      message: `An error occurred while creating the album: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}