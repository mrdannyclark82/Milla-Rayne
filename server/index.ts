import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { registerModularRoutes } from './routes/index';
import { setupVite, serveStatic, log } from './vite';
import { initializeMemoryCore } from './memoryService';
import { initializePersonalTaskSystem } from './personalTaskService';
import { initializeServerSelfEvolution } from './selfEvolutionService';
import { createServer } from 'http';
import crypto from 'crypto';
import { initializeAIUpdatesScheduler } from './aiUpdatesScheduler';
import { agentController } from './agentController';
import { codingAgent } from './agents/codingAgent';
import { imageGenerationAgent } from './agents/imageGenerationAgent';
import { enhancementSearchAgent } from './agents/enhancementSearchAgent';

// Polyfill crypto.getRandomValues for Node.js
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (buffer: any) => crypto.randomFillSync(buffer),
  } as Crypto;
}

export async function initApp() {
  const app = express();
  // Do not create the http server here; let registerRoutes create and return the server.
  let httpServer = null;

  // Enable trust proxy for proper IP detection behind proxies (fixes X-Forwarded-For warning)
  app.set('trust proxy', 1);

  // Add Helmet security middleware
  try {
    const helmet = (await import('helmet')).default;
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for development
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }));
    console.log('[Security] Helmet middleware enabled');
  } catch (error) {
    console.warn('[Security] Helmet not available, continuing without it');
  }

  // Input size limits to prevent DoS attacks
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  // Enable gzip compression for all responses (20-30% size reduction)
  app.use(compression());

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Add rate limiting to prevent abuse
  const rateLimitModule = await import('express-rate-limit');
  const rateLimit = rateLimitModule.default;
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use(limiter);

  // CORS Policy - Allow all origins in development for Replit preview
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // In development, allow all origins for Replit preview compatibility
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }

    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Trace-Id'
    );
    res.header(
      'Access-Control-Max-Age',
      '3600' // Cache preflight for 1 hour
    );

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    // P1.5: Distributed Tracing - Generate unique trace ID for request
    const traceId =
      (req.headers['x-trace-id'] as string) ||
      `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-trace-id'] = traceId;
    res.setHeader('X-Trace-Id', traceId);

    console.log(`🔍 [TRACE:${traceId}] ${req.method} ${path} - Started`);

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (path.startsWith('/api')) {
        let logLine = `🔍 [TRACE:${traceId}] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + '…';
        }

        log(logLine);
      }
    });

    next();
  });

  if (!globalThis.crypto) {
    globalThis.crypto = {
      getRandomValues: (buffer: any) => crypto.randomFillSync(buffer),
    } as Crypto;
  }

  // Initialize Memory Core system at startup
  await initializeMemoryCore();

  // Initialize Mood Background Service
  const { initializeMoodBackgroundService } = await import('./moodBackgroundService');
  await initializeMoodBackgroundService();

  // Initialize User Tasks system
  const { initializeUserTasks } = await import('./userTaskService');
  await initializeUserTasks();

  // Initialize Personal Task system for self-improvement
  await initializePersonalTaskSystem();

  // Initialize Server Self-Evolution system
  await initializeServerSelfEvolution();

  // Initialize Visual Recognition system
  const { initializeFaceRecognition } = await import(
    './visualRecognitionService'
  );
  await initializeFaceRecognition();

  // Initialize Enhancement Task system
  const { initializeEnhancementTaskSystem } = await import(
    './enhancementService'
  );
  await initializeEnhancementTaskSystem();

  // Initialize Daily Suggestions Scheduler
  const { initializeDailySuggestionScheduler } = await import(
    './dailySuggestionsService'
  );
  initializeDailySuggestionScheduler();

  // Initialize AI Updates Scheduler
  const { initializeAIUpdatesScheduler } = await import('./aiUpdatesScheduler');
  initializeAIUpdatesScheduler();

  // Initialize Proactive Repository Ownership System
  const { initializeUserAnalytics } = await import(
    './userInteractionAnalyticsService'
  );
  await initializeUserAnalytics();

  const { initializeSandboxEnvironment } = await import(
    './sandboxEnvironmentService'
  );
  await initializeSandboxEnvironment();

  const { initializeFeatureDiscovery } = await import(
    './featureDiscoveryService'
  );
  await initializeFeatureDiscovery();

  const { initializeTokenIncentive } = await import('./tokenIncentiveService');
  await initializeTokenIncentive();

  const { initializeProactiveManager } = await import(
    './proactiveRepositoryManagerService'
  );
  await initializeProactiveManager();

  // Initialize Enhanced Features
  const { initializeAutomatedPR } = await import('./automatedPRService');
  await initializeAutomatedPR();

  const { initializeUserSurveys } = await import(
    './userSatisfactionSurveyService'
  );
  await initializeUserSurveys();

  const { initializePerformanceProfiling } = await import(
    './performanceProfilingService'
  );
  await initializePerformanceProfiling();

  console.log(
    '✅ Proactive Repository Ownership System initialized (with enhancements)'
  );

  // Register agents
  agentController.registerAgent(codingAgent);
  agentController.registerAgent(imageGenerationAgent);
  agentController.registerAgent(enhancementSearchAgent);
  // Register Milla supervisor agent
  const { millaAgent } = await import('./agents/millaAgent');
  agentController.registerAgent(millaAgent);

  // Register CalendarAgent for calendar operations
  await import('./agents/calendarAgent'); // Self-registers via registry
  console.log('✅ CalendarAgent registered and ready');

  // Register TasksAgent for Google Tasks operations
  await import('./agents/tasksAgent'); // Self-registers via registry
  console.log('✅ TasksAgent registered and ready');

  // Register EmailAgent for email operations
  await import('./agents/emailAgent'); // Self-registers via registry
  console.log('✅ EmailAgent registered and ready');

  // Register YouTubeAgent for video analysis
  await import('./agents/youtubeAgent'); // Self-registers via registry
  console.log('✅ YouTubeAgent registered and ready');

  // Start email delivery loop if enabled
  const { startEmailDeliveryLoop } = await import(
    './agents/emailDeliveryWorker'
  );
  startEmailDeliveryLoop();

  // Admin endpoints for email delivery (manual trigger)
  // We'll register a small route here rather than a separate file to keep changes minimal.
  app.post('/api/admin/email/deliver', async (req, res) => {
    try {
      const { config } = await import('./config');
      const adminToken = config.admin.token;
      if (adminToken) {
        const authHeader =
          (req.headers.authorization as string) || req.headers['x-admin-token'];
        let tokenValue = '';
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
          tokenValue = authHeader.substring(7);
        else if (typeof authHeader === 'string') tokenValue = authHeader;
        if (tokenValue !== adminToken)
          return res.status(403).json({ error: 'Unauthorized' });
      }

      const { deliverOutboxOnce } = await import(
        './agents/emailDeliveryWorker'
      );
      const summary = await deliverOutboxOnce();
      res.json({ success: true, summary });
    } catch (error) {
      console.error('Admin deliver error:', error);
      res.status(500).json({ success: false, error: 'Delivery failed' });
    }
  });

  // Register API routes BEFORE Vite setup to prevent catch-all interference
  // registerModularRoutes will return the express app
  await registerModularRoutes(app);
  httpServer = createServer(app);

  // Setup sensor data WebSocket for mobile clients
  const { setupSensorDataWebSocket } = await import('./websocketService');
  await setupSensorDataWebSocket(httpServer);
  console.log('✅ Mobile sensor data WebSocket initialized');

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get('env') === 'development') {
    await setupVite(app, httpServer);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ message });
    throw err;
  });

  if (app.get('env') !== 'development') {
    serveStatic(app);
  }

  app.get('/api/env', (req, res) => {
    res.json({
      // Nothing to see here
    });
  });

  return httpServer;
}

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
// this serves both the API and the client.
// It is the only port that is not firewalled.
const port = parseInt(process.env.PORT || '5000', 10);

// Only auto-start the server when not running tests. Tests will call registerRoutes or initApp directly.
if (process.env.NODE_ENV !== 'test') {
  initApp().then((httpServer) => {
    httpServer.listen(
      {
        port,
        host: '0.0.0.0',
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      }
    );
  });
}
