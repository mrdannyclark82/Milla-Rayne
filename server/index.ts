import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { initializeMemoryCore } from './memoryService';
import { initializePersonalTaskSystem } from './personalTaskService';
import { initializeServerSelfEvolution } from './selfEvolutionService';
import crypto from 'crypto';

// Polyfill crypto.getRandomValues for Node.js
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (buffer: any) => crypto.randomFillSync(buffer),
  } as Crypto;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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

(async () => {
  // Initialize Memory Core system at startup
  await initializeMemoryCore();

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

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  app.get('/api/env', (req, res) => {
    res.json({
      // Nothing to see here
    });
  });

  app.post('/api/elevenlabs/tts', async (req, res) => {
    const { text, voiceName, voice_settings } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'ElevenLabs API key not configured' });
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceName}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const audioBlob = await response.blob();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(await audioBlob.arrayBuffer()));
    } catch (error) {
      res.status(500).json({ error: 'Error proxying ElevenLabs TTS request' });
    }
  });

  app.get('/api/elevenlabs/voices', async (req, res) => {
    console.log('Fetching ElevenLabs voices...');
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error('ElevenLabs API key not configured');
      return res
        .status(500)
        .json({ error: 'ElevenLabs API key not configured' });
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      console.log('ElevenLabs API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ElevenLabs API error:', errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      console.log('ElevenLabs voices fetched successfully');
      res.json(data);
    } catch (error) {
      console.error('Error proxying ElevenLabs voices request:', error);
      res
        .status(500)
        .json({ error: 'Error proxying ElevenLabs voices request' });
    }
  });

  app.get('/api/gmail/recent', async (req, res) => {
    const { getRecentEmails } = await import('./googleGmailService');
    const result = await getRecentEmails(
      'default-user',
      Number(req.query.maxResults)
    );
    res.json(result);
  });

  app.get('/api/gmail/content', async (req, res) => {
    const { getEmailContent } = await import('./googleGmailService');
    const result = await getEmailContent(
      'default-user',
      String(req.query.messageId)
    );
    res.json(result);
  });

  app.post('/api/gmail/send', async (req, res) => {
    const { to, subject, body } = req.body;
    const { sendEmail } = await import('./googleGmailService');
    const result = await sendEmail('default-user', to, subject, body);
    res.json(result);
  });

  server.listen(
    {
      port,
      host: '0.0.0.0',
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
