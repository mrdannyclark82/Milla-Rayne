import type { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async route handler to catch errors and pass them to Express error middleware
 */
export const asyncHandler = (fn: AsyncRequestHandler) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};
