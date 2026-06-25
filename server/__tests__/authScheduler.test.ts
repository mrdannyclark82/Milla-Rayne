import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleTokenRotation, refreshAccessTokenIfExpired } from '../authService';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getActiveUserSessions: vi.fn(),
    getOAuthToken: vi.fn(),
  },
}));

// Mock oauthService
// Since it is imported dynamically in authService, we need to ensure the mock is picked up.
// Using vi.mock at the top level should work for dynamic imports as well in Vitest.
vi.mock('../oauthService', () => ({
  getValidAccessToken: vi.fn(),
}));

describe('Auth Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleTokenRotation', () => {
    it('should do nothing if no active sessions', async () => {
      vi.mocked(storage.getActiveUserSessions).mockResolvedValue([]);

      await scheduleTokenRotation();

      expect(storage.getActiveUserSessions).toHaveBeenCalled();
      expect(storage.getOAuthToken).not.toHaveBeenCalled();
    });

    it('should check tokens for active users', async () => {
      const mockSessions = [
        { userId: 'user1', sessionToken: 'token1', expiresAt: new Date(), createdAt: new Date(), id: 's1' },
        { userId: 'user2', sessionToken: 'token2', expiresAt: new Date(), createdAt: new Date(), id: 's2' },
      ];
      vi.mocked(storage.getActiveUserSessions).mockResolvedValue(mockSessions);
      vi.mocked(storage.getOAuthToken).mockResolvedValue(null);

      await scheduleTokenRotation();

      expect(storage.getActiveUserSessions).toHaveBeenCalled();
      expect(storage.getOAuthToken).toHaveBeenCalledWith('user1', 'google');
      expect(storage.getOAuthToken).toHaveBeenCalledWith('user2', 'google');
    });

    it('should refresh token if expiring soon', async () => {
      const userId = 'user1';
      const mockSessions = [
        { userId, sessionToken: 'token1', expiresAt: new Date(), createdAt: new Date(), id: 's1' }
      ];

      const expiringSoon = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now
      const mockToken = {
        id: 't1',
        userId,
        provider: 'google',
        accessToken: 'old_access',
        refreshToken: 'refresh_token',
        expiresAt: expiringSoon,
        scope: 'scope',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(storage.getActiveUserSessions).mockResolvedValue(mockSessions);
      vi.mocked(storage.getOAuthToken).mockResolvedValue(mockToken as any);

      // We need to spy on refreshAccessTokenIfExpired to verify it's called?
      // It's exported from the same module, so spying on it directly might not work if it's called internally.
      // But we can verify side effects.
      // refreshAccessTokenIfExpired calls getValidAccessToken from oauthService.

      const oauthService = await import('../oauthService');
      vi.mocked(oauthService.getValidAccessToken).mockResolvedValue('new_access_token');

      await scheduleTokenRotation();

      expect(storage.getOAuthToken).toHaveBeenCalledWith(userId, 'google');
      expect(oauthService.getValidAccessToken).toHaveBeenCalledWith(userId, 'google');
    });

    it('should NOT refresh token if NOT expiring soon', async () => {
      const userId = 'user1';
      const mockSessions = [
        { userId, sessionToken: 'token1', expiresAt: new Date(), createdAt: new Date(), id: 's1' }
      ];

      const expiringLater = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const mockToken = {
        id: 't1',
        userId,
        provider: 'google',
        accessToken: 'valid_access',
        expiresAt: expiringLater,
        scope: 'scope',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(storage.getActiveUserSessions).mockResolvedValue(mockSessions);
      vi.mocked(storage.getOAuthToken).mockResolvedValue(mockToken as any);

      const oauthService = await import('../oauthService');

      await scheduleTokenRotation();

      expect(storage.getOAuthToken).toHaveBeenCalledWith(userId, 'google');
      expect(oauthService.getValidAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessTokenIfExpired', () => {
    it('should delegate to getValidAccessToken', async () => {
      const userId = 'user1';
      const oauthService = await import('../oauthService');
      vi.mocked(oauthService.getValidAccessToken).mockResolvedValue('new_token');

      const result = await refreshAccessTokenIfExpired(userId, 'old', 'refresh');

      expect(oauthService.getValidAccessToken).toHaveBeenCalledWith(userId, 'google');
      expect(result).toEqual({ success: true, newAccessToken: 'new_token' });
    });

    it('should return failure if getValidAccessToken returns null', async () => {
      const userId = 'user1';
      const oauthService = await import('../oauthService');
      vi.mocked(oauthService.getValidAccessToken).mockResolvedValue(null);

      const result = await refreshAccessTokenIfExpired(userId, 'old', 'refresh');

      expect(oauthService.getValidAccessToken).toHaveBeenCalledWith(userId, 'google');
      expect(result.success).toBe(false);
    });
  });
});
