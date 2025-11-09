import { getValidAccessToken } from './oauthService.ts';

export interface YouTubeAPIResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export async function getMySubscriptions(
  userId: string = 'default-user',
  maxResults: number = 10
): Promise<YouTubeAPIResult> {
  try {
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: 'You need to connect your Google account first.',
        error: 'NO_TOKEN',
      };
    }

    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      mine: 'true',
      maxResults: maxResults.toString(),
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to fetch subscriptions: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `I found ${data.items.length} subscriptions for you, honey.`,
      data: data.items,
    };
  } catch (error) {
    console.error('[Google YouTube API] Error fetching subscriptions:', error);
    return {
      success: false,
      message: `I had a little trouble getting your subscriptions, sweetie. Here's what happened: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

export async function getVideoDetails(
  videoId: string,
  userId: string = 'default-user'
): Promise<YouTubeAPIResult> {
  if (!videoId) {
    return {
      success: false,
      message: 'Video ID cannot be empty.',
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

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to fetch video details: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully fetched details for video "${data.items[0].snippet.title}".`,
      data: data.items[0],
    };
  } catch (error) {
    console.error('[Google YouTube API] Error fetching video details:', error);
    return {
      success: false,
      message: `An error occurred while fetching video details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

export async function searchVideos(
  userId: string = 'default-user',
  query: string,
  maxResults: number = 5,
  order: string = 'relevance'
): Promise<YouTubeAPIResult> {
  if (!query) {
    return {
      success: false,
      message: 'Search query cannot be empty.',
      error: 'INVALID_INPUT',
    };
  }

  try {
    // Try using Google API key first (doesn't require OAuth)
    const apiKey =
      process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLOUD_TTS_API_KEY;

    if (apiKey) {
      console.log('Using YouTube Data API with API key for search:', query);
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        maxResults: maxResults.toString(),
        type: 'video',
        order: order,
        key: apiKey,
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          'YouTube search successful, found',
          data.items?.length || 0,
          'results'
        );
        return {
          success: true,
          message: 'Search successful',
          data: data.items || [],
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('YouTube API error with key:', errorData);
      }
    }

    // Fall back to OAuth if API key doesn't work or isn't available
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message:
          'You need to connect your Google account first, or add a GOOGLE_API_KEY to your .env file.',
        error: 'NO_TOKEN',
      };
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      maxResults: maxResults.toString(),
      type: 'video',
      order: order,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to search videos: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully found ${data.items.length} videos.`,
      data: data.items,
    };
  } catch (error) {
    console.error('[Google YouTube API] Error searching videos:', error);
    return {
      success: false,
      message: `An error occurred while searching videos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

export async function getChannelDetails(
  channelId: string,
  userId: string = 'default-user'
): Promise<YouTubeAPIResult> {
  if (!channelId) {
    return {
      success: false,
      message: 'Channel ID cannot be empty.',
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

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: channelId,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to fetch channel details: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully fetched details for channel "${data.items[0].snippet.title}".`,
      data: data.items[0],
    };
  } catch (error) {
    console.error(
      '[Google YouTube API] Error fetching channel details:',
      error
    );
    return {
      success: false,
      message: `An error occurred while fetching channel details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

export async function getTrendingVideos(
  userId: string = 'default-user',
  regionCode: string = 'US',
  maxResults: number = 10
): Promise<YouTubeAPIResult> {
  try {
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: 'You need to connect your Google account first.',
        error: 'NO_TOKEN',
      };
    }

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      regionCode: regionCode,
      maxResults: maxResults.toString(),
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to fetch trending videos: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully fetched ${data.items.length} trending videos.`,
      data: data.items,
    };
  } catch (error) {
    console.error(
      '[Google YouTube API] Error fetching trending videos:',
      error
    );
    return {
      success: false,
      message: `An error occurred while fetching trending videos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}
