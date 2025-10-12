import { getValidAccessToken } from './oauthService';

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
      return {
        success: false,
        message: `Failed to fetch subscriptions: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR',
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

export async function searchVideos(
  query: string,
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
      part: 'snippet',
      q: query,
      maxResults: maxResults.toString(),
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
      return {
        success: false,
        message: `I couldn't find any videos for that search, honey. Here's what happened: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `I found these videos for you, sweetie.`,
      data: data.items,
    };
  } catch (error) {
    console.error('[Google YouTube API] Error searching videos:', error);
    return {
      success: false,
      message: `I had a little trouble searching for those videos, honey. Here's what happened: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

export async function getVideoDetails(
  videoId: string,
  userId: string = 'default-user'
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
      return {
        success: false,
        message: `I couldn't get the details for that video, honey. Here's what happened: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `I found the details for that video, sweetie.`,
      data: data.items[0],
    };
  } catch (error) {
    console.error('[Google YouTube API] Error getting video details:', error);
    return {
      success: false,
      message: `I had a little trouble getting the details for that video, honey. Here's what happened: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

export async function getChannelDetails(
  channelId: string,
  userId: string = 'default-user'
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
      return {
        success: false,
        message: `I couldn't get the details for that channel, honey. Here's what happened: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `I found the details for that channel, sweetie.`,
      data: data.items[0],
    };
  } catch (error) {
    console.error('[Google YouTube API] Error getting channel details:', error);
    return {
      success: false,
      message: `I had a little trouble getting the details for that channel, honey. Here's what happened: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}