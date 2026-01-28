import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, optionalAuth } from './auth.middleware';
import { validateSession } from '../authService';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../authService', () => ({
  validateSession: vi.fn(),
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should call next if session is valid', async () => {
      req.cookies = { session_token: 'valid-token' };
      vi.mocked(validateSession).mockResolvedValue({
        valid: true,
        user: { id: 'user-123', username: 'testuser', email: 'test@example.com' } as any,
      });

      await requireAuth(req as Request, res as Response, next);

      expect(validateSession).toHaveBeenCalledWith('valid-token');
      expect((req as any).user).toBeDefined();
      expect((req as any).user.id).toBe('user-123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no session token', async () => {
      await requireAuth(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unauthorized' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if session is invalid', async () => {
      req.cookies = { session_token: 'invalid-token' };
      vi.mocked(validateSession).mockResolvedValue({ valid: false });

      await requireAuth(req as Request, res as Response, next);

      expect(validateSession).toHaveBeenCalledWith('invalid-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should populate user if session is valid', async () => {
      req.cookies = { session_token: 'valid-token' };
      vi.mocked(validateSession).mockResolvedValue({
        valid: true,
        user: { id: 'user-123', username: 'testuser', email: 'test@example.com' } as any,
      });

      await optionalAuth(req as Request, res as Response, next);

      expect(validateSession).toHaveBeenCalledWith('valid-token');
      expect((req as any).user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should call next without user if no token', async () => {
      await optionalAuth(req as Request, res as Response, next);

      expect(validateSession).not.toHaveBeenCalled();
      expect((req as any).user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should call next without user if token invalid', async () => {
      req.cookies = { session_token: 'invalid-token' };
      vi.mocked(validateSession).mockResolvedValue({ valid: false });

      await optionalAuth(req as Request, res as Response, next);

      expect((req as any).user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
