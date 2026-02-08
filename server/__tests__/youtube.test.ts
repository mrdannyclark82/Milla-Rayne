/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';

// Mock config
vi.mock('../config', () => ({
  config: {
    memory: {
      key: 'test-key',
    },
    google: {
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret',
    },
  },
}));

import { getMySubscriptions } from '../googleYoutubeService';

describe('YouTube Connectivity', () => {
  process.env.MEMORY_KEY = '01234567890123456789012345678901';

  it('should be able to fetch subscriptions', async () => {
    const result = await getMySubscriptions('default-user');
    console.log('YouTube auth test result:', result);
    expect(result.success).toBe(true);
  });
});
