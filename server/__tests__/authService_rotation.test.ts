import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleTokenRotation } from '../authService';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getActiveUserSessions: vi.fn(),
    getOAuthToken: vi.fn(),
  },
}));

// Mock oauthService
vi.mock('../oauthService', () => ({
  getValidAccessToken: vi.fn(),
}));

describe('authService - scheduleTokenRotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch active sessions and refresh tokens for users with Google tokens', async () => {
    const mockSessions = [
      { userId: 'user-1' },
      { userId: 'user-2' },
      { userId: 'user-1' }, // Duplicate user
    ];

    (storage.getActiveUserSessions as any).mockResolvedValue(mockSessions);

    (storage.getOAuthToken as any).mockImplementation((userId: string, provider: string) => {
      if (userId === 'user-1' && provider === 'google') {
        return Promise.resolve({ accessToken: 'old-token-1', refreshToken: 'ref-1' });
      }
      return Promise.resolve(null);
    });

    const { getValidAccessToken } = await import('../oauthService');
    (getValidAccessToken as any).mockResolvedValue('new-token-1');

    await scheduleTokenRotation();

    expect(storage.getActiveUserSessions).toHaveBeenCalled();
    expect(storage.getOAuthToken).toHaveBeenCalledWith('user-1', 'google');
    expect(storage.getOAuthToken).toHaveBeenCalledWith('user-2', 'google');

    // Should only call getValidAccessToken for users that HAVE a token in storage
    expect(getValidAccessToken).toHaveBeenCalledTimes(1);
    expect(getValidAccessToken).toHaveBeenCalledWith('user-1', 'google');
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (storage.getActiveUserSessions as any).mockRejectedValue(new Error('DB Error'));

    // Should not throw
    await scheduleTokenRotation();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Token rotation scheduler error:'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
