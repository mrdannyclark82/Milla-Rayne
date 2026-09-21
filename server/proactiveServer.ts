/**
 * Proactive Features Server
 * Optional separate port (5001) for split-process setups.
 * Main app also mounts the same routes on :5000 for same-origin clients.
 */

import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response } from 'express';
import { registerProactiveRoutes } from './proactiveRoutes';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const PROACTIVE_PORT = parseInt(process.env.PROACTIVE_PORT || '5001', 10);

export async function initProactiveServer() {
  const app = express();

  // Enable trust proxy for proper IP detection
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Lighter rate limiting for proactive features. Skipped in development for
  // the same reason as the main server (server/index.ts): Vite's dev server
  // traffic can exhaust a fixed request budget unrelated to actual abuse.
  if (process.env.NODE_ENV !== 'development') {
    const rateLimitModule = await import('express-rate-limit');
    const rateLimit = rateLimitModule.default;
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // Higher limit for proactive polling
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);
  }

  // CORS configuration for proactive server
  const trustedOrigins = process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',')
    : [
        'http://localhost:5000',
        'http://localhost:5173',
        'http://127.0.0.1:5000',
      ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && trustedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', trustedOrigins[0]);
    }

    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        console.log(
          `[PROACTIVE] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`
        );
      }
    });
    next();
  });

  // Load token/goal state so /api/milla/tokens/rewards reflects disk unlocks.
  const { initializeTokenIncentive } = await import('./tokenIncentiveService');
  await initializeTokenIncentive();

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'proactive-features',
      port: PROACTIVE_PORT,
    });
  });

  // Register proactive routes
  registerProactiveRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}

// Only start server if not in test mode and this file is the entrypoint.
// Compare resolved paths so tsx/node relative argv still counts as main.
const __filename = fileURLToPath(import.meta.url);
const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMainModule =
  !!entry &&
  (entry === __filename ||
    entry === __filename.replace(/\.ts$/, '.js') ||
    path.basename(entry) === 'proactiveServer.ts' ||
    path.basename(entry) === 'proactiveServer.js');

if (process.env.NODE_ENV !== 'test' && isMainModule) {
  initProactiveServer()
    .then((httpServer) => {
      httpServer.listen(
        {
          port: PROACTIVE_PORT,
          host: '0.0.0.0',
        },
        () => {
          console.log(
            `✅ Proactive Features Server running on port ${PROACTIVE_PORT}`
          );
        }
      );
    })
    .catch((err) => {
      console.error('Failed to start proactive features server:', err);
      process.exit(1);
    });
}
