/**
 * GOOGLE GMAIL API SERVICE
 *
 * Provides Google Gmail API integration using OAuth tokens.
 * This service uses the Google Gmail REST API to read and send emails.
 */

import { getValidAccessToken } from './oauthService';

export interface GmailAPIResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Get a list of recent emails from Google Mail
 */
export async function getRecentEmails(
  userId: string = 'default-user',
  maxResults: number = 5
): Promise<GmailAPIResult> {
  try {
    console.log(`[Google Gmail API] Fetching recent emails`);

    // Get valid access token
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: "You need to connect your Google account first. Please authenticate via the OAuth settings.",
        error: 'NO_TOKEN'
      };
    }

    // Call Google Gmail API to get a list of message IDs
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google Gmail API] Error:', errorData);

      return {
        success: false,
        message: `I had trouble fetching your emails: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR'
      };
    }

    const data = await response.json();

    // Fetch the full message details for each message ID
    const messages = await Promise.all(
      data.messages.map(async (message: any) => {
        const msgResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        return msgResponse.json();
      })
    );

    return {
      success: true,
      message: `I've fetched your ${messages.length} most recent emails.`,
      data: messages,
    };

  } catch (error) {
    console.error('[Google Gmail API] Error fetching emails:', error);
    return {
      success: false,
      message: `I encountered an error while fetching your emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Get the content of a specific email
 */
export async function getEmailContent(
  userId: string = 'default-user',
  messageId: string
): Promise<GmailAPIResult> {
  try {
    console.log(`[Google Gmail API] Fetching email content for message ID: ${messageId}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: "You need to connect your Google account first. Please authenticate via the OAuth settings.",
        error: 'NO_TOKEN'
      };
    }

    // Call Google Gmail API to get the full message
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google Gmail API] Error:', errorData);

      return {
        success: false,
        message: `I had trouble fetching the email: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR'
      };
    }

    const message = await response.json();

    return {
      success: true,
      message: `I've fetched the email content.`,
      data: message,
    };

  } catch (error) {
    console.error('[Google Gmail API] Error fetching email content:', error);
    return {
      success: false,
      message: `I encountered an error while fetching the email content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Send an email
 */
export async function sendEmail(
  userId: string = 'default-user',
  to: string,
  subject: string,
  body: string
): Promise<GmailAPIResult> {
  try {
    console.log(`[Google Gmail API] Sending email to: ${to}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: "You need to connect your Google account first. Please authenticate via the OAuth settings.",
        error: 'NO_TOKEN'
      };
    }

    const email = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    // Call Google Gmail API to send the email
    const response = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: Buffer.from(email).toString('base64url'),
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google Gmail API] Error:', errorData);

      return {
        success: false,
        message: `I had trouble sending the email: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR'
      };
    }

    const sentMessage = await response.json();

    return {
      success: true,
      message: `I've sent the email to ${to}.`,
      data: sentMessage,
    };

  } catch (error) {
    console.error('[Google Gmail API] Error sending email:', error);
    return {
      success: false,
      message: `I encountered an error while sending the email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}