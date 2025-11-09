import { describe, it, expect, vi } from 'vitest';
import { searchPhotos, createAlbum } from '../googlePhotosService';
import * as oauth from '../oauthService';

vi.mock('../oauthService');

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Google Photos Service', () => {
  describe('searchPhotos', () => {
    it('should return photos on successful search', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mediaItems: [{ id: '1', filename: 'Test Photo' }],
          }),
      });

      const result = await searchPhotos('test query');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems?.[0].filename).toBe('Test Photo');
    });
  });

  describe('createAlbum', () => {
    it('should return album on successful creation', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'album_id', title: 'Test Album' }),
      });

      const result = await createAlbum('Test Album');

      expect(result.success).toBe(true);
      expect(result.album?.title).toBe('Test Album');
    });
  });
});
