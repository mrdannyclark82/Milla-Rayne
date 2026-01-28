import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Middleware to validate admin token
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = config.admin.token;
  if (!adminToken) {
    return next(); // No admin token configured, allow access
  }

  const authHeader = req.headers.authorization;
  const xAdminToken = req.headers['x-admin-token'];

  let token = '';
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (xAdminToken && typeof xAdminToken === 'string') {
    token = xAdminToken;
  }

  if (token === adminToken) {
    return next();
  }

  res.status(403).json({ error: 'Unauthorized' });
}
