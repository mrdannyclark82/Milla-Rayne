import { type Express } from 'express';
import { registerAuthRoutes } from './auth.routes';
import { registerChatRoutes } from './chat.routes';
import { registerAgentRoutes } from './agent.routes';
import { registerMediaRoutes } from './media.routes';
import { registerSystemRoutes } from './system.routes';
import { registerMemoryRoutes } from './memory.routes';
import { registerMonitoringRoutes } from './monitoring.routes';
import { registerSandboxRoutes } from './sandbox.routes';
import { registerGoogleRoutes } from './google.routes';
import { registerGoogleTtsRoutes } from './google-tts.routes';
import { registerTTSRoutes } from './tts.routes';
import { registerPersonalTaskRoutes } from './personalTask.routes';
import { registerMerchRoutes } from './merch.routes';

/**
 * Main router that aggregates all modular routes
 */
export function registerModularRoutes(app: Express) {
  // Authentication routes
  registerAuthRoutes(app);

  // Chat and AI routes
  registerChatRoutes(app);

  // Agent and Task routes
  registerAgentRoutes(app);

  // Media and Analysis routes
  registerMediaRoutes(app);

  // Memory and Messaging routes
  registerMemoryRoutes(app);

  // Monitoring and System routes
  registerSystemRoutes(app);
  registerMonitoringRoutes(app);

  // Sandbox and Google routes
  registerSandboxRoutes(app);
  registerGoogleRoutes(app);
  registerGoogleTtsRoutes(app);
  registerTTSRoutes(app);
  registerPersonalTaskRoutes(app);

  // Merch routes
  registerMerchRoutes(app);

  return app;
}
