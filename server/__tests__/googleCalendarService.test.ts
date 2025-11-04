import { describe, it, expect, vi } from 'vitest';
import { listEvents, deleteEvent, addEventToGoogleCalendar } from '../googleCalendarService';
import * as oauth from '../oauthService';

vi.mock('../oauthService');

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Google Calendar Service', () => {
  describe('listEvents', () => {
    it('should return events on successful request', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [{ summary: 'Test Event' }] }),
      });

      const result = await listEvents();

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
    });
  });

  describe('deleteEvent', () => {
    it('should return success on successful deletion', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({ status: 204 });

      const result = await deleteEvent('default-user', 'event_id');

      expect(result.success).toBe(true);
    });
  });

  describe('addEventToGoogleCalendar', () => {
    it('should return event on successful creation', async () => {
      vi.mocked(oauth.getValidAccessToken).mockResolvedValue('test_token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'event_id', summary: 'Test Event' }),
      });

      const result = await addEventToGoogleCalendar('Test Event', '2025-10-26');

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event_id');
    });
  });
});