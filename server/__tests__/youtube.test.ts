/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { getMySubscriptions } from '../googleYoutubeService';

describe('YouTube Connectivity', () => {
  it('should be able to fetch subscriptions', async () => {
    const result = await getMySubscriptions('default-user');
    console.log('YouTube auth test result:', result);
    expect(result.success).toBe(true);
  });
});
