import { describe, it, expect, vi } from 'vitest';
import { getMySubscriptions, getVideoDetails, searchVideos, getChannelDetails, getTrendingVideos } from '../googleYoutubeService';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

describe('Google YouTube Service', () => {
  describe('getMySubscriptions', () => {
    it('should return subscriptions on successful request', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const accessToken = 'test_token';
      const result = await getMySubscriptions(accessToken);
      expect(result).toEqual({ items: [] });
    });
  });

  describe('getVideoDetails', () => {
    it('should return video details on successful request', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const videoId = 'test_video_id';
      const result = await getVideoDetails(videoId);
      expect(result).toEqual({ items: [] });
    });
  });

  describe('searchVideos', () => {
    it('should return videos on successful search', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const query = 'test query';
      const result = await searchVideos(query);
      expect(result).toEqual({ items: [] });
    });
  });

  describe('getChannelDetails', () => {
    it('should return channel details on successful request', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const channelId = 'test_channel_id';
      const result = await getChannelDetails(channelId);
      expect(result).toEqual({ items: [] });
    });
  });

  describe('getTrendingVideos', () => {
    it('should return trending videos on successful request', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const result = await getTrendingVideos();
      expect(result).toEqual({ items: [] });
    });
  });
});