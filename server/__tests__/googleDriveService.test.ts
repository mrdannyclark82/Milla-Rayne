import { describe, it, expect, vi } from 'vitest';
import { searchFiles, summarizeFile } from '../googleDriveService';
import * as oauth from '../oauthService';

vi.mock('../oauthService');

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Google Drive Service', () => {
  describe('searchFiles', () => {
    it('should return files on successful search', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ files: [{ id: '1', name: 'Test File' }] }),
      });

      const result = await searchFiles('test query');

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files?.[0].name).toBe('Test File');
    });

    it('should return error if no access token', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue(null);

      const result = await searchFiles('test query');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_TOKEN');
    });

    it('should return error on API failure', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'API Error' } }),
      });

      const result = await searchFiles('test query');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API_ERROR');
    });
  });

  describe('summarizeFile', () => {
    it('should return summary on successful summarization', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch
        .mockResolvedValueOnce({
          // for getFile metadata
          ok: true,
          json: () => Promise.resolve({ mimeType: 'text/plain' }),
        })
        .mockResolvedValueOnce({
          // for getFile content
          ok: true,
          text: () => Promise.resolve('This is the file content'),
        })
        .mockResolvedValueOnce({
          // for summarizeFile
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: 'This is the summary' } }],
            }),
        });

      const result = await summarizeFile('file_id');

      expect(result.success).toBe(true);
      expect(result.summary).toBe('This is the summary');
    });
  });
});
