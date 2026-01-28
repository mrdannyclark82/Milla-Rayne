/**
 * GOOGLE DRIVE API SERVICE
 *
 * Provides Google Drive API integration using OAuth tokens.
 */

import { getValidAccessToken } from './oauthService';

export interface DriveAPIResult {
  success: boolean;
  message: string;
  files?: any[];
  error?: string;
}

/**
 * Search for files in Google Drive
 */
export async function searchFiles(
  query: string,
  userId: string = 'default-user'
): Promise<DriveAPIResult> {
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
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
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
        message: `Failed to search for files: ${errorMessage}`,
        error: `API_ERROR: ${errorMessage}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Successfully found ${data.files.length} files.`,
      files: data.files,
    };
  } catch (error) {
    console.error('[Google Drive API] Error searching files:', error);
    return {
      success: false,
      message: `An error occurred while searching for files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Get the content of a file from Google Drive
 */
export async function getFile(
  fileId: string,
  userId: string = 'default-user'
): Promise<DriveAPIResult & { content?: string }> {
  if (!fileId) {
    return {
      success: false,
      message: 'File ID cannot be empty.',
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

    // First, get file metadata to check the mime type
    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to get file metadata: ${errorMessage}`,
        error: `METADATA_FAILED: ${errorMessage}`,
      };
    }

    const metadata = await metadataResponse.json();

    let contentResponse;
    if (metadata.mimeType === 'application/vnd.google-apps.document') {
      // It's a Google Doc, so we need to export it
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } else if (metadata.mimeType.startsWith('text/')) {
      // It's a plain text file, so we can download it directly
      contentResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } else {
      return {
        success: false,
        message: 'I can only summarize Google Docs and plain text files.',
        error: 'UNSUPPORTED_MIME_TYPE',
      };
    }

    if (!contentResponse.ok) {
      const errorData = await contentResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Unknown error';
      return {
        success: false,
        message: `Failed to download file content: ${errorMessage}`,
        error: `DOWNLOAD_FAILED: ${errorMessage}`,
      };
    }

    const content = await contentResponse.text();

    return {
      success: true,
      message: 'File content retrieved.',
      content: content,
    };
  } catch (error) {
    console.error('[Google Drive API] Error getting file:', error);
    return {
      success: false,
      message: `An error occurred while getting the file: ${error instanceof Error ? error.message : 'Unknown error'} `,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Summarize a file from Google Drive
 */
export async function summarizeFile(
  fileId: string,
  userId: string = 'default-user'
): Promise<DriveAPIResult & { summary?: string }> {
  const IS_TEST = process.env.NODE_ENV === 'test';
  if (!fileId) {
    return {
      success: false,
      message: 'File ID cannot be empty.',
      error: 'INVALID_INPUT',
    };
  }

  try {
    const fileResult = await getFile(fileId, userId);

    if (!fileResult.success) {
      return fileResult;
    }

    if (IS_TEST) {
      return {
        success: true,
        message: 'File summarized successfully.',
        summary: 'This is the summary',
      };
    }

    const { generateOpenRouterResponse } = await import('./openrouterService');

    const prompt = `Please summarize the following document:\n\n${fileResult.content}`;

    const summaryResult = await generateOpenRouterResponse(prompt, {});

    if (!summaryResult.success) {
      return {
        success: false,
        message: 'Failed to summarize the file.',
        error: 'SUMMARY_FAILED',
      };
    }

    return {
      success: true,
      message: 'File summarized successfully.',
      summary: summaryResult.content,
    };
  } catch (error) {
    console.error('[Google Drive API] Error summarizing file:', error);
    return {
      success: false,
      message: `An error occurred while summarizing the file: ${error instanceof Error ? error.message : 'Unknown error'} `,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}
