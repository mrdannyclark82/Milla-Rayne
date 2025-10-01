import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeMemoryCore } from "./memoryService";
import { initializePersonalTaskSystem } from "./personalTaskService";
import { initializeServerSelfEvolution } from "./selfEvolutionService";
import crypto from 'crypto';

// Polyfill crypto.getRandomValues for Node.js
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (buffer: any) => crypto.randomFillSync(buffer)
  } as Crypto;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
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

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (buffer: any) => crypto.randomFillSync(buffer)
  } as Crypto;
}

(async () => {
  // Initialize Memory Core system at startup
  await initializeMemoryCore();
  
  // Initialize User Tasks system
  const { initializeUserTasks } = await import("./userTaskService");
  await initializeUserTasks();
  
  // Initialize Personal Task system for self-improvement
  await initializePersonalTaskSystem();
  
  // Initialize Server Self-Evolution system
  await initializeServerSelfEvolution();
  
  // Initialize Visual Recognition system
  const { initializeFaceRecognition } = await import("./visualRecognitionService");
  await initializeFaceRecognition();
  
  // Initialize Enhancement Task system
  const { initializeEnhancementTaskSystem } = await import("./enhancementService");
  await initializeEnhancementTaskSystem();
  

  // Initialize Daily Suggestions Scheduler
  const { initializeDailySuggestionScheduler } = await import("./dailySuggestionsService");
  initializeDailySuggestionScheduler();

  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
