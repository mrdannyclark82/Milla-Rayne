/**
 * Proactive Features Server
 * Runs on a separate port (5001) to avoid rate limiting issues
 * with the main application server
 */

import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response } from 'express';
import { registerProactiveRoutes } from './proactiveRoutes';
import { createServer } from 'http';

const PROACTIVE_PORT = parseInt(process.env.PROACTIVE_PORT || '5001', 10);

export async function initProactiveServer() {
  const app = express();
  
  // Enable trust proxy for proper IP detection
  app.set('trust proxy', 1);
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Lighter rate limiting for proactive features
  const rateLimitModule = await import('express-rate-limit');
  const rateLimit = rateLimitModule.default;
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Higher limit for proactive polling
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  
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
        console.log(`[PROACTIVE] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
    next();
  });
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'proactive-features', port: PROACTIVE_PORT });
  });
  
  // Register proactive routes
  registerProactiveRoutes(app);
  
  const httpServer = createServer(app);
  
  return httpServer;
}

// Only start server if not in test mode and not imported as a module
// ES module compatible check
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (process.env.NODE_ENV !== 'test' && isMainModule) {
  initProactiveServer().then((httpServer) => {
    httpServer.listen(
      {
        port: PROACTIVE_PORT,
        host: '0.0.0.0',
      },
      () => {
        console.log(`✅ Proactive Features Server running on port ${PROACTIVE_PORT}`);
      }
    );
  });
}
