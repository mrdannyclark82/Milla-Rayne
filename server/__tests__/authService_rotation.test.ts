import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockGetActiveUserSessions, mockGetOAuthToken, mockUpdateOAuthToken } =
  vi.hoisted(() => {
    return {
      mockGetActiveUserSessions: vi.fn(),
      mockGetOAuthToken: vi.fn(),
      mockUpdateOAuthToken: vi.fn(),
    };
  });

vi.mock('../storage', () => ({
  storage: {
    getActiveUserSessions: mockGetActiveUserSessions,
    getOAuthToken: mockGetOAuthToken,
    updateOAuthToken: mockUpdateOAuthToken,
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    createUserSession: vi.fn(),
    updateUserLastLogin: vi.fn(),
    updateUserAIModel: vi.fn(),
  },
}));

// Mock other dependencies to avoid errors
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));
vi.mock('crypto', () => ({
  default: { randomBytes: vi.fn(() => ({ toString: () => 'mock-token' })) },
}));

import { scheduleTokenRotation } from '../authService';

describe('scheduleTokenRotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not do anything if no active sessions', async () => {
    mockGetActiveUserSessions.mockResolvedValue([]);
    await scheduleTokenRotation();
    expect(mockGetActiveUserSessions).toHaveBeenCalled();
    expect(mockGetOAuthToken).not.toHaveBeenCalled();
  });

  it('should check tokens for active users', async () => {
    mockGetActiveUserSessions.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);
    mockGetOAuthToken.mockResolvedValue(null);

    await scheduleTokenRotation();

    expect(mockGetOAuthToken).toHaveBeenCalledWith('user-1', 'google');
    expect(mockGetOAuthToken).toHaveBeenCalledWith('user-2', 'google');
  });

  it('should dedup users', async () => {
    mockGetActiveUserSessions.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-1' },
    ]);
    mockGetOAuthToken.mockResolvedValue(null);

    await scheduleTokenRotation();

    expect(mockGetOAuthToken).toHaveBeenCalledTimes(1);
    expect(mockGetOAuthToken).toHaveBeenCalledWith('user-1', 'google');
  });

  it('should update token if it is expiring soon', async () => {
    const userId = 'user-expiring';
    const now = new Date('2023-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const expiringSoon = new Date(now.getTime() + 4 * 60 * 1000); // 4 minutes from now

    mockGetActiveUserSessions.mockResolvedValue([{ userId }]);
    mockGetOAuthToken.mockResolvedValue({
      id: 'token-id',
      userId,
      accessToken: 'old-access-token',
      refreshToken: 'refresh-token',
      expiresAt: expiringSoon,
    });

    await scheduleTokenRotation();

    expect(mockGetOAuthToken).toHaveBeenCalledWith(userId, 'google');

    // refreshAccessTokenIfExpired should return newExpiresAt = expiresAt + 1 hour (mocked behavior)
    // So updateOAuthToken should be called
    expect(mockUpdateOAuthToken).toHaveBeenCalledWith(
      'token-id',
      expect.objectContaining({
        accessToken: 'old-access-token', // Stub returns same token
        // expiresAt should be updated
      })
    );

    const updateCall = mockUpdateOAuthToken.mock.calls[0];
    const updatedToken = updateCall[1];
    expect(updatedToken.expiresAt.getTime()).toBeGreaterThan(
      expiringSoon.getTime()
    );
  });

  it('should NOT update token if it is NOT expiring soon', async () => {
    const userId = 'user-ok';
    const now = new Date('2023-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const notExpiring = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    mockGetActiveUserSessions.mockResolvedValue([{ userId }]);
    mockGetOAuthToken.mockResolvedValue({
      id: 'token-id',
      userId,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: notExpiring,
    });

    await scheduleTokenRotation();

    expect(mockGetOAuthToken).toHaveBeenCalledWith(userId, 'google');
    expect(mockUpdateOAuthToken).not.toHaveBeenCalled();
  });
});
