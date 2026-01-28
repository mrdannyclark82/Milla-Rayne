import type { Request, Response, NextFunction } from 'express';
import { validateSession } from '../authService';

/**
 * Middleware to require authentication
 * Returns 401 if session is missing or invalid
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionResult = await validateSession(sessionToken);

  if (!sessionResult.valid || !sessionResult.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = sessionResult.user;
  next();
}

/**
 * Middleware that optionally populates req.user if a valid session exists
 * Does NOT block the request if unauthenticated
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies.session_token;

  if (sessionToken) {
    const sessionResult = await validateSession(sessionToken);
    if (sessionResult.valid && sessionResult.user) {
      req.user = sessionResult.user;
    }
  }

  next();
}
