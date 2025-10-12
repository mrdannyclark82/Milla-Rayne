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
      message: `Successfully fetched ${data.items.length} subscriptions.`,
      data: data.items,
    };
  } catch (error) {
    console.error('[Google YouTube API] Error fetching subscriptions:', error);
    return {
      success: false,
      message: `An error occurred while fetching subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}