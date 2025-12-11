import { describe, it, expect, vi } from 'vitest';
import {
  getMySubscriptions,
  getVideoDetails,
  searchVideos,
  getChannelDetails,
  getTrendingVideos,
} from '../googleYoutubeService';
import * as oauthService from '../oauthService';

describe('Google YouTube Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMySubscriptions', () => {
    it('should return subscriptions on successful request', async () => {
      vi.spyOn(oauthService, 'getValidAccessToken').mockResolvedValue('test_access_token');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const result = await getMySubscriptions('default-user');
      expect(result).toEqual({
        success: true,
        message: 'I found 0 subscriptions for you, honey.',
        data: [],
      });
    });
  });

  describe('getVideoDetails', () => {
    it('should return video details on successful request', async () => {
      vi.spyOn(oauthService, 'getValidAccessToken').mockResolvedValue('test_access_token');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [{ snippet: { title: 'Test Video' } }] }),
      } as Response);

      const videoId = 'test_video_id';
      const result = await getVideoDetails(videoId, 'default-user');
      expect(result).toEqual({
        success: true,
        message: 'Successfully fetched details for video "Test Video".',
        data: { snippet: { title: 'Test Video' } },
      });
    });
  });

  describe('searchVideos', () => {
    it('should return videos on successful search', async () => {
      vi.spyOn(oauthService, 'getValidAccessToken').mockResolvedValue('test_access_token');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const query = 'test query';
      const result = await searchVideos('default-user', query);
      expect(result).toEqual({
        success: true,
        message: 'Search successful',
        data: [],
      });
    });
  });

  describe('getChannelDetails', () => {
    it('should return channel details on successful request', async () => {
      vi.spyOn(oauthService, 'getValidAccessToken').mockResolvedValue('test_access_token');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [{ snippet: { title: 'Test Channel' } }] }),
      } as Response);

      const channelId = 'test_channel_id';
      const result = await getChannelDetails(channelId, 'default-user');
      expect(result).toEqual({
        success: true,
        message: 'Successfully fetched details for channel "Test Channel".',
        data: { snippet: { title: 'Test Channel' } },
      });
    });
  });

  describe('getTrendingVideos', () => {
    it('should return trending videos on successful request', async () => {
      vi.spyOn(oauthService, 'getValidAccessToken').mockResolvedValue('test_access_token');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response);

      const result = await getTrendingVideos();
      expect(result).toEqual({
        success: true,
        message: 'Successfully fetched 0 trending videos.',
        data: [],
      });
    });
  });
});
