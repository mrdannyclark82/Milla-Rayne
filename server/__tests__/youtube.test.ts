/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { getMySubscriptions } from '../googleYoutubeService';

describe('YouTube Connectivity', () => {
  beforeAll(() => {
    process.env.MEMORY_KEY = 'test-key-012345678901234567890123456789012';
  });

  it('should be able to fetch subscriptions', async () => {
    const result = await getMySubscriptions('default-user');
    console.log('YouTube auth test result:', result);
    expect(result.success).toBe(true);
  });
});
