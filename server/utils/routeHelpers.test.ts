import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from './routeHelpers';
import type { Request, Response, NextFunction } from 'express';

describe('Route Helpers', () => {
  describe('asyncHandler', () => {
    it('should call the handler and resolve', async () => {
      const handler = vi.fn().mockResolvedValue('success');
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn();

      await asyncHandler(handler)(req, res, next);

      expect(handler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch errors and call next', async () => {
      const error = new Error('test error');
      const handler = vi.fn().mockRejectedValue(error);
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn();

      await asyncHandler(handler)(req, res, next);

      expect(handler).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
