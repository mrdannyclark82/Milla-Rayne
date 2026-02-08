import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshAccessTokenIfExpired } from '../authService';
import * as oauthService from '../oauthService';

// Mock the oauthService module
vi.mock('../oauthService', () => ({
  getValidAccessToken: vi.fn(),
}));

describe('refreshAccessTokenIfExpired', () => {
  const userId = 'user-123';
  const oldToken = 'old-access-token';
  const refreshToken = 'refresh-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getValidAccessToken and return success when token is valid/refreshed', async () => {
    const newToken = 'new-access-token';
    vi.mocked(oauthService.getValidAccessToken).mockResolvedValue(newToken);

    const result = await refreshAccessTokenIfExpired(
      userId,
      oldToken,
      refreshToken
    );

    expect(oauthService.getValidAccessToken).toHaveBeenCalledWith(
      userId,
      'google'
    );
    expect(result).toEqual({
      success: true,
      newAccessToken: newToken,
    });
  });

  it('should return error when getValidAccessToken returns null', async () => {
    vi.mocked(oauthService.getValidAccessToken).mockResolvedValue(null);

    const result = await refreshAccessTokenIfExpired(
      userId,
      oldToken,
      refreshToken
    );

    expect(oauthService.getValidAccessToken).toHaveBeenCalledWith(
      userId,
      'google'
    );
    // Note: implementation details might vary on error message, checking structure
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle errors from getValidAccessToken', async () => {
    const error = new Error('Network error');
    vi.mocked(oauthService.getValidAccessToken).mockRejectedValue(error);

    const result = await refreshAccessTokenIfExpired(
      userId,
      oldToken,
      refreshToken
    );

    expect(oauthService.getValidAccessToken).toHaveBeenCalledWith(
      userId,
      'google'
    );
    expect(result.success).toBe(false);
    // The current stub catches errors and returns success: false with error message
    expect(result.error).toContain('Network error');
  });
});
