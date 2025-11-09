/**
 * OAUTH SERVICE
 *
 * Handles OAuth 2.0 authentication flow for Google services.
 * Manages token storage, refresh, and validation.
 */

import { storage } from './storage.ts';
import type { InsertOAuthToken, OAuthToken } from '@shared/schema';
import { encrypt, decrypt } from './crypto.ts';

/**
 * OAuth configuration for Google
 */
interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

import { config } from './config.ts';

/**
 * Get Google OAuth configuration from environment
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: config.google.clientId || '',
    clientSecret: config.google.clientSecret || '',
    redirectUri: config.google.redirectUri || '',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.sharing',
      'profile',
      'email',
    ],
  };
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(redirectUriOverride?: string): string {
  const config = getGoogleOAuthConfig();
  const redirectUri = redirectUriOverride || config.redirectUri;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUriOverride?: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}> {
  const config = getGoogleOAuthConfig();
  const redirectUri = redirectUriOverride || config.redirectUri;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const config = getGoogleOAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Store OAuth token securely (encrypted)
 */
export async function storeOAuthToken(
  userId: string,
  provider: 'google',
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
  scope: string
): Promise<void> {
  const { getMemoryKey } = await import('./crypto');
  const memoryKey = getMemoryKey();

  // Encrypt sensitive tokens
  const encryptedAccessToken = encrypt(accessToken, memoryKey);
  const encryptedRefreshToken = refreshToken
    ? encrypt(refreshToken, memoryKey)
    : undefined;

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const tokenData: InsertOAuthToken = {
    userId,
    provider,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiresAt,
    scope,
  };

  // Check if token already exists for this user and provider
  const existingToken = await getOAuthToken(userId, provider);

  if (existingToken) {
    // Update existing token
    await (storage as any).updateOAuthToken(existingToken.id, tokenData);
  } else {
    // Create new token
    await (storage as any).createOAuthToken(tokenData);
  }
}

/**
 * Get OAuth token for user and provider
 */
export async function getOAuthToken(
  userId: string,
  provider: 'google'
): Promise<OAuthToken | null> {
  const token = await (storage as any).getOAuthToken(userId, provider);
  return token || null;
}

/**
 * Get valid access token (refresh if expired)
 */
export async function getValidAccessToken(
  userId: string,
  provider: 'google'
): Promise<string | null> {
  const { getMemoryKey } = await import('./crypto');
  const memoryKey = getMemoryKey();

  const token = await getOAuthToken(userId, provider);

  if (!token) {
    return null;
  }

  // Check if token is expired or about to expire (5 min buffer)
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (expiresAt.getTime() - now.getTime() > bufferTime) {
    // Token is still valid, decrypt and return
    return decrypt(token.accessToken, memoryKey);
  }

  // Token expired or about to expire, refresh it
  if (!token.refreshToken) {
    console.error('No refresh token available, user needs to re-authenticate');
    return null;
  }

  try {
    const decryptedRefreshToken = decrypt(token.refreshToken, memoryKey);
    const refreshed = await refreshAccessToken(decryptedRefreshToken);

    // Update token in storage
    await storeOAuthToken(
      userId,
      provider,
      refreshed.accessToken,
      decryptedRefreshToken, // Keep same refresh token
      refreshed.expiresIn,
      token.scope || ''
    );

    return refreshed.accessToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

/**
 * Delete OAuth token
 */
export async function deleteOAuthToken(
  userId: string,
  provider: 'google'
): Promise<void> {
  const token = await getOAuthToken(userId, provider);
  if (token) {
    await (storage as any).deleteOAuthToken(token.id);
  }
}

/**
 * Check if user is authenticated with Google
 */
export async function isGoogleAuthenticated(userId: string): Promise<boolean> {
  const token = await getOAuthToken(userId, 'google');
  return !!token;
}
