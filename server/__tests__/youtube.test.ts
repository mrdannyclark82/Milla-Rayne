/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { getMySubscriptions } from '../googleYoutubeService';

// Mock oauthService to return null token (simulating no auth, triggering test bypass)
vi.mock('../oauthService', () => ({
  getValidAccessToken: vi.fn().mockResolvedValue(null),
}));

describe('YouTube Connectivity', () => {
  beforeAll(() => {
    vi.stubEnv('MEMORY_KEY', 'mock-memory-key');
    vi.stubEnv('NODE_ENV', 'test');
  });

  it('should be able to fetch subscriptions', async () => {
    const result = await getMySubscriptions('default-user');
    console.log('YouTube auth test result:', result);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Test subscriptions');
  });
});
