import { describe, it, expect, vi } from 'vitest';
import { getDirections, findPlace } from '../googleMapsService';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

describe('Google Maps Service', () => {
  describe('getDirections', () => {
    it('should return directions on successful request', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ routes: [{ legs: [{ steps: [] }] }] }),
      } as Response);

      const origin = 'A';
      const destination = 'B';
      const result = await getDirections(origin, destination);
      expect(result).toEqual({ routes: [{ legs: [{ steps: [] }] }] });
    });
  });

  describe('findPlace', () => {
    it('should return place on successful request', async () => {
      const { fetch } = await import('undici');
      (fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ name: 'Place A' }] }),
      } as Response);

      const query = 'Place A';
      const result = await findPlace(query);
      expect(result).toEqual({ candidates: [{ name: 'Place A' }] });
    });
  });
});