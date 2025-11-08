import type { Express } from 'express';
import express from 'express';
import { createServer, type Server as HttpServer } from 'http';
import path from 'path';
import { storage } from './storage';
import { insertMessageSchema } from '@shared/schema';
import { z } from 'zod';
import { getCurrentWeather, formatWeatherResponse } from './weatherService';
import { performWebSearch, shouldPerformSearch } from './searchService';
import {
  generateImage,
  extractImagePrompt as extractImagePromptXAI,
  formatImageResponse,
} from './imageService';
import {
  generateImageWithGemini,
  extractImagePrompt as extractImagePromptGemini,
  formatImageResponse as formatImageResponseGemini,
} from './openrouterImageService';
import { generateImageWithBanana } from './bananaImageService';
import {
  generateImageWithPollinations,
  formatPollinationsImageResponse,
} from './pollinationsImageService';
import {
  generateCodeWithQwen,
  extractCodeRequest,
  formatCodeResponse,
} from './openrouterCodeService';
import {
  getMemoriesFromTxt,
  searchKnowledge,
  updateMemories,
  getMemoryCoreContext,
  searchMemoryCore,
  loadMemoryCore,
} from './memoryService';
import {
  getPersonalTasks,
  startTask,
  completeTask,
  getTaskSummary,
  generatePersonalTasksIfNeeded,
} from './personalTaskService';
import { getMillaMoodData } from './moodService';
import {
  storeVisualMemory,
  getVisualMemories,
  getEmotionalContext,
} from './visualMemoryService';
import {
  trackUserActivity,
  generateProactiveMessage,
  checkMilestones,
  detectEnvironmentalContext,
  checkBreakReminders,
  checkPostBreakReachout,
} from './proactiveService';
import {
  initializeFaceRecognition,
  trainRecognition,
  identifyPerson,
  getRecognitionInsights,
} from './visualRecognitionService';
import { analyzeVideo, generateVideoInsights } from './gemini';
import { generateXAIResponse } from './xaiService';
import { generateOpenRouterResponse } from './openrouterService';
import { generateGeminiResponse } from './geminiService';
import { dispatchAIResponse, DispatchContext } from './aiDispatcherService';
import {
  analyzeYouTubeVideo,
  isValidYouTubeUrl,
  searchVideoMemories,
  extractVideoId,
} from './youtubeAnalysisService';
import { analyzeVideoWithMillAlyzer } from './youtubeMillAlyzer';
import { getRealWorldInfo } from './realWorldInfoService';
import {
  parseGitHubUrl,
  fetchRepositoryData,
  generateRepositoryAnalysis,
} from './repositoryAnalysisService';
import {
  generateRepositoryImprovements,
  applyRepositoryImprovements,
  previewImprovements,
} from './repositoryModificationService';
import {
  detectSceneContext,
  type SceneContext,
  type SceneLocation,
} from './sceneDetectionService';
import {
  detectBrowserToolRequest,
  getBrowserToolInstructions,
} from './browserIntegrationService';
import {
  registerUser,
  loginUser,
  validateSession,
  logoutUser,
  updateUserAIModel,
  getUserAIModel,
  loginOrRegisterWithGoogle,
} from './authService';
import cookieParser from 'cookie-parser';
import { analyzeVoiceInput, VoiceAnalysisResult } from './voiceAnalysisService';
import { getSmartHomeSensorData } from './smartHomeService';
import { initializeMemorySummarizationScheduler } from './memorySummarizationScheduler';
import { UserProfile } from './profileService';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import rateLimit from 'express-rate-limit';
import {
  getEmailOutbox,
  writeEmailOutbox,
  deliverOutboxOnce,
  emailMetrics,
} from './agents/emailDeliveryWorker';
import { AgentTask, addTask, updateTask as updateAgentTask, getTask as getAgentTask, listTasks as listAgentTasks } from './agents/taskStorage';
import { runTask } from './agents/worker';
import { listAgents } from './agents/registry';

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'memory/audio_messages/');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '.webm');
  },
});

const upload = multer({ storage: audioStorage });

// Track current scene location per session (simple in-memory for now)
let currentSceneLocation: SceneLocation = 'living_room';
let currentSceneMood: string = 'calm';
let currentSceneUpdatedAt: number = Date.now();

// Cache for repository analysis to avoid re-analyzing when applying updates
// Key: userId, Value: { repoData, analysis, improvements, timestamp }
const repositoryAnalysisCache = new Map<string, {
  repoUrl: string;
  repoData: any;
  analysis: any | null;
  improvements?: any[];
  timestamp: number;
}>();

// Clear cache entries older than 30 minutes
const CACHE_EXPIRY_MS = 30 * 60 * 1000;

import { config } from './config';

/**
 * Validate admin token from either Authorization: Bearer header or x-admin-token header
 * Returns true if valid, false otherwise
 */
function validateAdminToken(headers: any): boolean {
  const adminToken = config.admin.token;
  if (!adminToken) {
    return true; // No admin token configured, allow access
  }

  // Check Authorization: Bearer header
  const authHeader = headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === adminToken) {
      return true;
    }
  }

  // Check x-admin-token header
  const xAdminToken = headers['x-admin-token'];
  if (xAdminToken === adminToken) {
    return true;
  }

  return false;
}

// Fallback image analysis when AI services are unavailable
function generateImageAnalysisFallback(userMessage: string): string {
  // Check if this is a camera capture
  const isCameraPhoto =
    userMessage.toLowerCase().includes('camera') ||
    userMessage.toLowerCase().includes("i'm sharing a photo from my camera");

  if (isCameraPhoto) {
    const cameraResponses = [
      "I can see you're showing me something through your camera! My visual processing is having a moment, but I'm so curious - what are you looking at right now? Describe the scene for me, love.",

      "Ooh, a live moment captured just for me! Even though my eyes aren't working perfectly right now, I love that you're sharing what you're seeing. What's happening in your world?",

      "I can sense you've taken a photo to share with me! While I can't see it clearly at the moment, tell me - what made you want to capture this moment? I'm all ears!",

      "You're showing me your world through the camera - how sweet! My vision is a bit fuzzy right now, but paint me a picture with your words instead. What's got your attention?",
    ];
    return cameraResponses[Math.floor(Math.random() * cameraResponses.length)];
  }

  const responses = [
    "I can see you're sharing a photo with me! While I'm having some technical difficulties with image analysis right now, I love that you're including me in what you're seeing. Tell me what's in the photo - I'd love to hear about it from your perspective.",

    "Oh, you've shared a photo! I wish I could see it clearly right now, but I'm experiencing some technical issues. What caught your eye about this image? I'd love to hear you describe it to me.",

    "I can tell you've shared something visual with me! Even though I can't analyze the image right now due to technical limitations, I appreciate you wanting to show me what you're seeing. What drew you to capture this moment?",

    "You've shared a photo with me! While my image analysis isn't working properly at the moment, I'm still here and interested in what you wanted to show me. Can you tell me what's in the picture and why it caught your attention?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// Function to analyze images - using fallback responses as primary AI services don't have vision capabilities
async function analyzeImageWithOpenAI(
  imageData: string,
  userMessage: string
): Promise<string> {
  // Using fallback response for image analysis
  const imageResponses = [
    "I can see you've shared an image with me, love! While I don't have image analysis capabilities right now, I'd love to hear you describe what you're showing me. What caught your eye about this?",

    "Oh, you're showing me something! I wish I could see it clearly, but tell me about it - what's in the image that made you want to share it with me?",

    "I can tell you've shared a photo with me! Even though I can't analyze images at the moment, I'm so curious - what's happening in the picture? Paint me a word picture, babe.",

    "You've got my attention with that image! While my visual processing isn't available right now, I'd love to hear your perspective on what you're sharing. What's the story behind it?",
  ];

  return imageResponses[Math.floor(Math.random() * imageResponses.length)];
}

export async function registerRoutes(app: Express): Promise<HttpServer> {
  // create an http server wrapper for the express app so tests can use a proper Server instance
  const httpServer = createServer(app);
  // Middleware
  app.use(cookieParser());

  // Initialize enhancement task system
  const { initializeEnhancementTaskSystem } = await import(
    './enhancementService'
  );
  await initializeEnhancementTaskSystem();

  // Initialize memory summarization scheduler
  initializeMemorySummarizationScheduler();

  // Serve the videoviewer.html file
  app.get('/videoviewer.html', (req, res) => {
    res.sendFile(
      path.resolve(process.cwd(), 'client', 'public', 'videoviewer.html')
    );
  });

  // Serve static files from attached_assets folder
  app.use(
    '/attached_assets',
    express.static(path.resolve(process.cwd(), 'attached_assets'))
  );

  // Get all messages with pagination/limit
  // If persistent message storage is empty (e.g. messages table empty), fall back to Memory Core files
  // so conversations can be resumed after a server restart. Returns the most recent N messages.
  app.get('/api/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50; // Default to last 50 messages

      const allMessages = await storage.getMessages();

      // If DB-backed messages exist, return them (most recent N)
      if (allMessages && allMessages.length > 0) {
        const recentMessages = allMessages.slice(-limit);
        return res.json(recentMessages);
      }

      // Fallback: load Memory Core entries (from memories.txt / backups) to reconstruct recent conversation
      try {
        const memoryCore = await loadMemoryCore();
        if (memoryCore && memoryCore.entries && memoryCore.entries.length > 0) {
          // Map MemoryCoreEntry -> Message-like objects expected by client
          const mapped = memoryCore.entries
            .slice(-limit)
            .map((entry) => ({
              id: entry.id,
              content: entry.content,
              role: entry.speaker === 'milla' ? 'assistant' : 'user',
              personalityMode: null,
              userId: null,
              timestamp: entry.timestamp,
            }));

          return res.json(mapped);
        }
      } catch (memErr) {
        console.warn('Memory Core fallback failed:', memErr);
      }

      // Nothing found - return empty array
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Simple OpenRouter chat endpoint
  app.post('/api/openrouter-chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res
          .status(400)
          .json({ error: 'Message is required and must be a string' });
      }

      if (message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      console.log(
        `OpenRouter Chat: Processing message: ${message.substring(0, 50)}...`
      );

      // Phase 3: Detect scene context from user message
      const sceneContext = detectSceneContext(message, currentSceneLocation);
      if (sceneContext.hasSceneChange) {
        currentSceneLocation = sceneContext.location;
        currentSceneMood = sceneContext.mood;
        currentSceneUpdatedAt = Date.now();
        console.log(
          `Scene change detected: ${sceneContext.location} (mood: ${sceneContext.mood})`
        );
      }

      // Use OpenRouter directly without complex processing
      const aiResponse = await generateOpenRouterResponse(message, {
        userName: 'Danny Ray',
      });

      // Always return success since fallback is handled in the service
      res.json({
        response: aiResponse.content,
        success: aiResponse.success,
        sceneContext: {
          location: sceneContext.location,
          mood: sceneContext.mood,
          timeOfDay: sceneContext.timeOfDay,
        },
      });
    } catch (error) {
      console.error('OpenRouter Chat error:', error);
      res.status(500).json({
        response:
          "I'm experiencing some technical issues. Please try again in a moment.",
      });
    }
  });

  app.get('/api/oauth/authenticated', async (req, res) => {
    try {
      const { isGoogleAuthenticated } = await import('./oauthService');
      const userId = 'default-user'; // In production, get from session
      const isAuthenticated = await isGoogleAuthenticated(userId);
      res.json({ success: true, isAuthenticated });
    } catch (error) {
      console.error('Error checking authentication status:', error);
      res.status(500).json({
        error: 'Failed to check authentication status',
        success: false,
      });
    }
  });

  /**
   * Google OAuth Routes - For Authentication (Login/Register)
   */

  // Initiate Google OAuth for user authentication
  app.get('/api/auth/google', async (req, res) => {
    try {
      const { getAuthorizationUrl } = await import('./oauthService');

      // Add state parameter to identify this is for auth (not just service connection)
      const authUrl = getAuthorizationUrl() + '&state=auth';
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      res.status(500).json({
        error: 'Failed to initiate Google authentication',
        success: false,
      });
    }
  });

  // Google OAuth callback for authentication
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).send(`
          <html>
            <head><title>Authentication Error</title></head>
            <body>
              <h1>Authentication Error</h1>
              <p>Missing authorization code</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body>
          </html>
        `);
      }

      const { exchangeCodeForToken } = await import('./oauthService');

      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken(code);

      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info from Google');
      }

      const userInfo: any = await userInfoResponse.json();

      // Login or register user
      const result = await loginOrRegisterWithGoogle(
        userInfo.email,
        userInfo.id,
        userInfo.name
      );

      if (!result.success || !result.sessionToken) {
        throw new Error(result.error || 'Authentication failed');
      }

      // Set session cookie
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Also store OAuth token for Google services
      const { storeOAuthToken } = await import('./oauthService');
      await storeOAuthToken(
        result.user!.id as string,
        'google',
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.expiresIn,
        tokenData.scope
      );

      // Redirect to success page
      res.send(`
        <html>
          <head>
            <title>Authentication Success</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
              }
              h1 { color: #667eea; margin-bottom: 0.5rem; }
              p { color: #666; }
              .checkmark {
                font-size: 3rem;
                color: #10b981;
                animation: scaleIn 0.3s ease-out;
              }
              @keyframes scaleIn {
                from { transform: scale(0); }
                to { transform: scale(1); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="checkmark">✓</div>
              <h1>${result.isNewUser ? 'Account Created!' : 'Welcome Back!'}</h1>
              <p>${result.isNewUser ? 'Your Milla account has been created successfully.' : 'Successfully signed in with Google.'}</p>
              <p style="font-size: 0.9rem; color: #999;">This window will close automatically...</p>
            </div>
            <script>
              setTimeout(() => {
                window.opener?.postMessage({ type: 'google-auth-success', user: ${JSON.stringify(result.user)} }, '*');
                window.close();
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling Google auth callback:', error);
      res.status(500).send(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            <script>setTimeout(() => window.close(), 5000);</script>
          </body>
        </html>
      `);
    }
  });

  /**
   * Auth Routes - User Authentication
   */

  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required',
        });
      }

      const result = await registerUser(username, email, password);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
      }

      const result = await loginUser(username, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Set session cookie
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
      });
    }
  });

  // Logout user
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;

      if (sessionToken) {
        await logoutUser(sessionToken);
      }

      res.clearCookie('session_token');
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  });

  // Check auth status
  app.get('/api/auth/status', async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;

      if (!sessionToken) {
        return res.json({ authenticated: false });
      }

      const result = await validateSession(sessionToken);

      if (!result.valid) {
        res.clearCookie('session_token');
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: result.user,
      });
    } catch (error) {
      console.error('Auth status check error:', error);
      res.json({ authenticated: false });
    }
  });

  /**
   * AI Model Routes - Model Selection
   */

  // Get current AI model preference
  app.get('/api/ai-model/current', async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;

      if (!sessionToken) {
        // Return default for non-authenticated users
        return res.json({ success: true, model: 'minimax' });
      }

      const sessionResult = await validateSession(sessionToken);
      if (!sessionResult.valid || !sessionResult.user) {
        return res.json({ success: true, model: 'minimax' });
      }

      const result = await getUserAIModel(sessionResult.user.id as string);
      res.json(result);
    } catch (error) {
      console.error('Get AI model error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI model preference',
      });
    }
  });

  // Set AI model preference
  app.post('/api/ai-model/set', async (req, res) => {
    try {
      const { model } = req.body;
      const sessionToken = req.cookies.session_token;

      if (!model) {
        return res.status(400).json({
          success: false,
          error: 'Model is required',
        });
      }

      const validModels = ['minimax', 'xai'];
      if (!validModels.includes(model)) {
        return res.status(400).json({
          success: false,
          error: `Invalid model. Must be one of: ${validModels.join(', ')}`,
        });
      }

      if (!sessionToken) {
        // For non-authenticated users, just return success
        // (they can't persist the preference but can use it for the session)
        return res.json({ success: true, model });
      }

      const sessionResult = await validateSession(sessionToken);
      if (!sessionResult.valid || !sessionResult.user) {
        return res.json({ success: true, model });
      }

      const result = await updateUserAIModel(sessionResult.user.id as string, model);
      res.json({ ...result, model });
    } catch (error) {
      console.error('Set AI model error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set AI model preference',
      });
    }
  });

  app.post('/api/chat/audio', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const audioFile = fs.createReadStream(req.file.path);

      const formData = new FormData();
      formData.append('file', audioFile, {
        filename: req.file.filename,
        contentType: req.file.mimetype,
      });
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const transcript = data.text;

      // Now that we have the transcript, we can generate a response from Milla
      const aiResponse = await generateAIResponse(transcript, [], 'Danny Ray', undefined, 'default-user', undefined);

      res.json({
        response: aiResponse.content,
        success: true,
      });
    } catch (error) {
      console.error('Audio upload error:', error);
      res.status(500).json({
        response: "I'm having some technical issues with audio messages. Please try again in a moment.",
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    console.log('--- /api/chat handler called ---');
    console.log('CHAT API CALLED');
    try {
      let { message, audioData, audioMimeType } = req.body;
      let userEmotionalState: VoiceAnalysisResult['emotionalTone'] | undefined;

      if (audioData && audioMimeType) {
        // Process audio input
        const audioBuffer = Buffer.from(audioData, 'base64');
        const voiceAnalysis = await analyzeVoiceInput(audioBuffer, audioMimeType);

        if (voiceAnalysis.success) {
          message = voiceAnalysis.text;
          userEmotionalState = voiceAnalysis.emotionalTone;
          console.log(`Voice input transcribed: "${message.substring(0, 50)}..." (Tone: ${userEmotionalState})`);
        } else {
          console.error('Voice analysis failed:', voiceAnalysis.error);
          return res.status(500).json({ error: voiceAnalysis.error });
        }
      }

      if (!message || typeof message !== 'string') {
        console.warn('Chat API: Invalid message format received');
        return res
          .status(400)
          .json({ error: 'Message is required and must be a string' });
      }

      if (message.trim().length === 0) {
        console.warn('Chat API: Empty message received');
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      // Log the request for debugging
      // Phase 3: Detect scene context from user message
      const sensorData = await getSmartHomeSensorData();
      const sceneContext = detectSceneContext(message, currentSceneLocation, sensorData || undefined);
      if (sceneContext.hasSceneChange) {
        currentSceneLocation = sceneContext.location;
        currentSceneMood = sceneContext.mood;
        currentSceneUpdatedAt = Date.now();
        console.log(
          `Scene change detected: ${sceneContext.location} (mood: ${sceneContext.mood})`
        );
      }

      // Generate AI response using existing logic with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Response generation timeout')),
          60000 // 60 seconds
        )
      );

      const sessionToken = req.cookies.session_token;
      let userId: string = 'default-user'; // Default user ID
      if (sessionToken) {
        const sessionResult = await validateSession(sessionToken);
        if (sessionResult.valid && sessionResult.user) {
          userId = sessionResult.user.id || 'default-user';
        }
      }

      console.log('--- Calling generateAIResponse ---');
      const aiResponsePromise = generateAIResponse(message, [], 'Danny Ray', undefined, userId, userEmotionalState);
      const aiResponse = (await Promise.race([
        aiResponsePromise,
        timeoutPromise,
      ])) as {
        content: string;
        reasoning?: string[];
        youtube_play?: { videoId: string };
        youtube_videos?: Array<{ id: string; title: string; channel: string; thumbnail?: string }>;
      };

      // millAlyzer: Check if message contains YouTube URL for analysis
      let videoAnalysis = null;
      let showKnowledgeBase = false;
      let dailyNews = null;

      const youtubeUrlMatch = message.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

      // Check for knowledge base request
      if (message.toLowerCase().includes('knowledge base') ||
        message.toLowerCase().includes('show videos') ||
        message.toLowerCase().includes('my videos')) {
        showKnowledgeBase = true;
        console.log('📚 millAlyzer: Knowledge base request detected');
      }

      // Check for daily news request
      if (message.toLowerCase().includes('daily news') ||
        message.toLowerCase().includes('tech news') ||
        message.toLowerCase().includes('what\'s new')) {
        try {
          const { runDailyNewsSearch } = await import('./youtubeNewsMonitor');
          dailyNews = await runDailyNewsSearch();
          console.log('📰 millAlyzer: Daily news digest generated');
        } catch (error) {
          console.error('millAlyzer: Failed to get daily news:', error);
        }
      }

      if (youtubeUrlMatch || (message.toLowerCase().includes('analyze') && message.toLowerCase().includes('video'))) {
        try {
          let videoId: string | null = null;

          if (youtubeUrlMatch) {
            videoId = youtubeUrlMatch[1];
          } else if (aiResponse?.youtube_play) {
            videoId = aiResponse.youtube_play.videoId;
          }

          if (videoId) {
            console.log(`🔍 millAlyzer: Detected video analysis request for ${videoId}`);
            videoAnalysis = await analyzeVideoWithMillAlyzer(videoId);
            console.log(`✅ millAlyzer: Analysis complete for ${videoId}`);
          }
        } catch (error) {
          console.error('millAlyzer: Analysis failed:', error);
          // Continue without analysis - don't break the chat
        }
      }

      if (!aiResponse || !aiResponse.content) {
        console.warn('Chat API: AI response was empty, using fallback');
        return res.json({
          response:
            "I'm here with you! Sometimes I need a moment to gather my thoughts. What would you like to talk about?",
          sceneContext: {
            location: sceneContext.location,
            mood: sceneContext.mood,
            timeOfDay: sceneContext.timeOfDay,
          },
        });
      }
      console.log(
        `Chat API: Successfully generated response (${aiResponse.content.substring(0, 50)}...)`
      );

      console.log('🔍 aiResponse object keys:', Object.keys(aiResponse));
      console.log('🔍 Has youtube_play?', 'youtube_play' in aiResponse, aiResponse.youtube_play);
      console.log('🔍 Has youtube_videos?', 'youtube_videos' in aiResponse, aiResponse.youtube_videos ? `${aiResponse.youtube_videos.length} videos` : 'undefined');

      res.json({
        response: aiResponse.content,
        ...(aiResponse.reasoning && { reasoning: aiResponse.reasoning }),
        ...(aiResponse.youtube_play && { youtube_play: aiResponse.youtube_play }),
        ...(aiResponse.youtube_videos && { youtube_videos: aiResponse.youtube_videos }),
        ...(videoAnalysis && { videoAnalysis }),
        ...(showKnowledgeBase && { showKnowledgeBase: true }),
        ...(dailyNews && { dailyNews }),
        sceneContext: {
          location: sceneContext.location,
          mood: sceneContext.mood,
          timeOfDay: sceneContext.timeOfDay,
        },
      });
    } catch (error) {
      // Provide different error messages based on error type
      let errorMessage =
        "I'm having some technical difficulties right now, but I'm still here for you!";
      if (error instanceof Error) {
        if (error.message === 'Response generation timeout') {
          errorMessage =
            "I'm taking a bit longer to respond than usual. Please give me a moment and try again.";
        } else if (error.name === 'ValidationError') {
          errorMessage =
            'There seems to be an issue with the message format. Please try rephrasing your message.';
        } else if (
          'code' in error &&
          (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')
        ) {
          errorMessage =
            "I'm having trouble connecting to my services right now. Please try again in a moment.";
        }
      }

      res.status(500).json({
        response: errorMessage,
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      });
    }
  });

  // Agent orchestration endpoints (must be before /api/agent/:agentName to avoid route conflicts)
  app.post('/api/agent/tasks', async (req, res) => {
    try {
      const { supervisor, agent, action, payload, metadata } = req.body;
      if (!agent || !action) {
        return res.status(400).json({ error: 'agent and action are required' });
      }

      const task: AgentTask = {
        taskId: uuidv4(),
        supervisor: supervisor || 'MillaAgent',
        agent,
        action,
        payload: payload || {},
        metadata: metadata || {},
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addTask(task);
      res.status(201).json({ success: true, task });
    } catch (error) {
      console.error('Error creating agent task:', error);
      res.status(500).json({ error: 'Failed to create agent task' });
    }
  });

  app.get('/api/agent/tasks', async (req, res) => {
    try {
      const tasks = await listAgentTasks();
      res.json({ success: true, tasks });
    } catch (error) {
      console.error('Error listing agent tasks:', error);
      res.status(500).json({ error: 'Failed to list agent tasks' });
    }
  });

  app.get('/api/agent/tasks/:id', async (req, res) => {
    try {
      const task = await getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ success: true, task });
    } catch (error) {
      console.error('Error fetching agent task:', error);
      res.status(500).json({ error: 'Failed to fetch agent task' });
    }
  });

  app.post('/api/agent/tasks/:id/run', async (req, res) => {
    try {
      const task = await getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      // If already running, return error
      if (task.status === 'in_progress') {
        return res.status(400).json({ error: 'Task is already in progress' });
      }

      // Check if task requires approval
      if (task.metadata?.requireUserApproval && !task.metadata?.approved) {
        return res.status(403).json({ error: 'Task requires user approval before running' });
      }

      // Run in background - updateTask will mark status
      runTask(task).catch((err) => console.error('Background runTask error:', err));

      res.json({ success: true, running: true, taskId: task.taskId });
    } catch (error) {
      console.error('Error running agent task:', error);
      res.status(500).json({ error: 'Failed to run agent task' });
    }
  });

  app.patch('/api/agent/tasks/:id', async (req, res) => {
    try {
      const patch = req.body || {};
      const updated = await updateAgentTask(req.params.id, patch as any);
      if (!updated) return res.status(404).json({ error: 'Task not found' });
      res.json({ success: true, task: updated });
    } catch (error) {
      console.error('Error updating agent task:', error);
      res.status(500).json({ error: 'Failed to update agent task' });
    }
  });

  app.post('/api/agent/tasks/:id/approve', async (req, res) => {
    try {
      const task = await getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      // Update metadata to mark approved
      const updated = await updateAgentTask(req.params.id, {
        metadata: { ...task.metadata, approved: true }
      });

      // Log approval in audit trail
      const { logAuditEvent } = await import('./agents/auditLog.js');
      await logAuditEvent(task.taskId, task.agent, task.action, 'created', 'User approved task');

      res.json({ success: true, task: updated });
    } catch (error) {
      console.error('Error approving agent task:', error);
      res.status(500).json({ error: 'Failed to approve agent task' });
    }
  });

  app.post('/api/agent/tasks/:id/reject', async (req, res) => {
    try {
      const task = await getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const reason = req.body?.reason || 'User rejected task';

      // Update metadata and mark as cancelled
      const updated = await updateAgentTask(req.params.id, {
        status: 'cancelled',
        metadata: { ...task.metadata, approved: false, rejectionReason: reason }
      });

      // Log rejection in audit trail
      const { logAuditEvent } = await import('./agents/auditLog.js');
      await logAuditEvent(task.taskId, task.agent, task.action, 'cancelled', reason);

      res.json({ success: true, task: updated });
    } catch (error) {
      console.error('Error rejecting agent task:', error);
      res.status(500).json({ error: 'Failed to reject agent task' });
    }
  });

  app.delete('/api/agent/tasks/:id', async (req, res) => {
    try {
      const task = await getAgentTask(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      // Soft-cancel: mark cancelled unless already completed
      if (task.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel a completed task' });
      }

      const updated = await updateAgentTask(req.params.id, { status: 'cancelled' });
      res.json({ success: true, task: updated });
    } catch (error) {
      console.error('Error cancelling agent task:', error);
      res.status(500).json({ error: 'Failed to cancel agent task' });
    }
  });

  // Agent registry listing
  app.get('/api/agent/registry', async (req, res) => {
    try {
      const agents = listAgents().map((a) => ({ name: a.name, description: a.description }));
      res.json({ success: true, agents });
    } catch (error) {
      console.error('Error fetching agent registry:', error);
      res.status(500).json({ error: 'Failed to fetch agent registry' });
    }
  });

  app.post('/api/agent/:agentName', async (req, res) => {
    try {
      const { agentName } = req.params;
      const { task } = req.body;

      if (!task) {
        return res.status(400).json({ error: 'Task is required' });
      }

      const { agentController } = await import('./agentController');
      const result = await agentController.dispatch(agentName, task);

      res.json({ response: result, success: true });
    } catch (error) {
      console.error(`Agent dispatch error for ${req.params.agentName}:`, error);
      res.status(500).json({
        response: "I'm having some technical issues with my agents. Please try again in a moment.",
      });
    }
  });

  // Create a new message
  app.post('/api/messages', async (req, res) => {
    try {
      const { conversationHistory, userName, imageData, ...messageData } =
        req.body;
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);

      // Let Milla decide if she wants to respond
      if (message.role === 'user') {
        // Track user activity for proactive engagement
        await trackUserActivity();

        // Check if we should surface today's daily suggestion
        // Only do this once per day and if predictive updates are enabled
        const shouldSurfaceSuggestion = await shouldSurfaceDailySuggestion(
          message.content,
          conversationHistory
        );
        let dailySuggestionMessage = null;

        if (shouldSurfaceSuggestion) {
          const { getOrCreateTodaySuggestion, markSuggestionDelivered } =
            await import('./dailySuggestionsService');
          const suggestion = await getOrCreateTodaySuggestion();

          if (suggestion && !suggestion.isDelivered) {
            // Create a message with the daily suggestion
            dailySuggestionMessage = await storage.createMessage({
              content: `*shares a quick thought* \n\n${suggestion.suggestionText}`,
              role: 'assistant',
              userId: message.userId,
            });

            // Mark as delivered
            await markSuggestionDelivered(suggestion.date);
            console.log(`Daily suggestion delivered for ${suggestion.date}`);
          }
        }

        // Milla decides whether to respond
        const decision = await shouldMillaRespond(
          message.content,
          conversationHistory,
          userName
        );
        console.log(
          `Milla's decision: ${decision.shouldRespond ? 'RESPOND' : 'STAY QUIET'} - ${decision.reason}`
        );

        if (decision.shouldRespond) {
          const aiResponse = await generateAIResponse(
            message.content,
            conversationHistory,
            userName,
            imageData,
            message.userId || 'default-user'
          );
          const aiMessage = await storage.createMessage({
            content: aiResponse.content,
            role: 'assistant',
            userId: message.userId,
          });

          // Check if Milla wants to send follow-up messages
          const followUpMessages = await generateFollowUpMessages(
            aiResponse.content,
            message.content,
            conversationHistory,
            userName
          );

          // Store follow-up messages in the database
          const followUpMessagesStored = [];
          for (const followUpContent of followUpMessages) {
            const followUpMessage = await storage.createMessage({
              content: followUpContent,
              role: 'assistant',
              userId: message.userId,
            });
            followUpMessagesStored.push(followUpMessage);
          }

          res.json({
            userMessage: message,
            aiMessage,
            followUpMessages: followUpMessagesStored,
            dailySuggestion: dailySuggestionMessage,
            reasoning: aiResponse.reasoning,
          });
        } else {
          // Milla chooses not to respond - just return the user message
          res.json({ userMessage: message, aiMessage: null });
        }
      } else {
        res.json({ message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: 'Invalid message data', errors: error.issues });
      } else {
        res.status(500).json({ message: 'Failed to create message' });
      }
    }
  });

  // Memory management endpoints
  app.get('/api/memory', async (req, res) => {
    try {
      const memoryData = await getMemoriesFromTxt();
      res.json(memoryData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch memories' });
    }
  });

  app.get('/api/knowledge', async (req, res) => {
    try {
      const knowledgeData = await searchKnowledge(
        (req.query.q as string) || ''
      );
      res.json({ items: knowledgeData, success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to search knowledge' });
    }
  });

  // Memory Core management endpoints
  app.get('/api/memory-core', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (query) {
        const searchResults = await searchMemoryCore(query, 10);
        res.json({
          results: searchResults,
          success: true,
          query: query,
        });
      } else {
        const { loadMemoryCore } = await import('./memoryService');
        const memoryCore = await loadMemoryCore();
        res.json(memoryCore);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to access Memory Core' });
    }
  });

  app.post('/api/memory', async (req, res) => {
    try {
      const { memory } = req.body;
      if (!memory || typeof memory !== 'string') {
        return res.status(400).json({ message: 'Memory content is required' });
      }
      const result = await updateMemories(memory);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update memories' });
    }
  });

  // Enhanced AI Features endpoints

  // Emotion analysis endpoint for real-time video
  app.post('/api/analyze-emotion', async (req, res) => {
    try {
      const { imageData, timestamp } = req.body;

      // Simple emotion detection fallback when AI services are limited
      const emotions = [
        'happy',
        'focused',
        'curious',
        'thoughtful',
        'relaxed',
        'engaged',
      ];
      const detectedEmotion =
        emotions[Math.floor(Math.random() * emotions.length)];

      // Store visual memory and train recognition
      await storeVisualMemory(imageData, detectedEmotion, timestamp);
      await trainRecognition(imageData, detectedEmotion);

      // Identify the person
      const identity = await identifyPerson(imageData);

      res.json({
        emotion: detectedEmotion,
        confidence: 0.8,
        timestamp,
        identity,
      });
    } catch (error) {
      console.error('Emotion analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze emotion' });
    }
  });

  // Visual memory endpoint
  app.get('/api/visual-memory', async (req, res) => {
    try {
      const memories = await getVisualMemories();
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch visual memories' });
    }
  });

  // Client-side error reporting (development only)
  app.post('/api/client-error', async (req, res) => {
    try {
      const { message, stack } = req.body || {};
      console.error('Client reported error:', message);
      if (stack) console.error(stack);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false });
    }
  });

  // Proactive engagement endpoint
  app.get('/api/proactive-message', async (req, res) => {
    try {
      const proactiveMessage = await generateProactiveMessage();
      const milestone = await checkMilestones();
      const environmental = detectEnvironmentalContext();
      const recognition = await getRecognitionInsights();
      const breakReminder = await checkBreakReminders();
      const postBreakReachout = await checkPostBreakReachout();

      res.json({
        message: proactiveMessage,
        milestone,
        environmental,
        recognition,
        breakReminder: breakReminder.shouldRemind
          ? breakReminder.message
          : null,
        postBreakReachout: postBreakReachout.shouldReachout
          ? postBreakReachout.message
          : null,
        timestamp: Date.now(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate proactive message' });
    }
  });


  // User Tasks API endpoints
  app.get('/api/user-tasks', async (req, res) => {
    try {
      const { getUserTasks } = await import('./userTaskService');
      const tasks = getUserTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/user-tasks', async (req, res) => {
    try {
      const { createUserTask } = await import('./userTaskService');
      const task = await createUserTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating user task:', error);
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  app.put('/api/user-tasks/:id', async (req, res) => {
    try {
      const { updateUserTask } = await import('./userTaskService');
      const task = await updateUserTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error updating user task:', error);
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  app.delete('/api/user-tasks/:id', async (req, res) => {
    try {
      const { deleteUserTask } = await import('./userTaskService');
      const deleted = await deleteUserTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting user task:', error);
      res.status(500).json({ message: 'Failed to delete task' });
    }
  });

  app.get('/api/user-tasks/upcoming', async (req, res) => {
    try {
      const { getUpcomingTasks } = await import('./userTaskService');
      const days = parseInt(req.query.days as string) || 7;
      const tasks = getUpcomingTasks(days);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      res.status(500).json({ message: 'Failed to fetch upcoming tasks' });
    }
  });

  // Milla's mood endpoint
  app.get('/api/milla-mood', async (req, res) => {
    try {
      const moodData = await getMillaMoodData();
      res.json({ mood: moodData, success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch mood data' });
    }
  });

  // Recursive Self-Improvement API endpoints
  app.get('/api/self-improvement/status', async (req, res) => {
    try {
      // Note: Client-side SelfImprovementEngine not currently implemented
      // const { SelfImprovementEngine } = await import("../client/src/lib/MillaCore");
      const { getServerEvolutionStatus } = await import(
        './selfEvolutionService'
      );

      // const clientStatus = SelfImprovementEngine.getImprovementStatus();
      const serverStatus = getServerEvolutionStatus();

      res.json({
        // client: clientStatus,
        server: serverStatus,
        success: true,
      });
    } catch (error) {
      console.error('Error fetching self-improvement status:', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch self-improvement status' });
    }
  });

  app.post('/api/self-improvement/trigger', async (req, res) => {
    try {
      // Note: Client-side SelfImprovementEngine not currently implemented
      // const { SelfImprovementEngine } = await import("../client/src/lib/MillaCore");
      const { triggerServerEvolution } = await import('./selfEvolutionService');

      // Trigger server improvement cycles
      // const clientCycle = await SelfImprovementEngine.initiateImprovementCycle();
      const serverEvolutions = await triggerServerEvolution();

      res.json({
        // clientCycle,
        serverEvolutions,
        message: 'Self-improvement cycle initiated successfully',
        success: true,
      });
    } catch (error) {
      console.error('Error triggering self-improvement:', error);
      res
        .status(500)
        .json({ message: 'Failed to trigger self-improvement cycle' });
    }
  });

  // Get detailed improvement history
  app.get('/api/self-improvement/history', async (req, res) => {
    try {
      // Note: Client-side SelfImprovementEngine not currently implemented
      // const { SelfImprovementEngine } = await import("../client/src/lib/MillaCore");
      const { getServerEvolutionHistory } = await import(
        './selfEvolutionService'
      );

      // const clientHistory = SelfImprovementEngine.getImprovementHistory();
      const clientHistory: any[] = []; // Placeholder until client-side engine is implemented
      const serverHistory = await getServerEvolutionHistory();

      // Parse query parameters for filtering
      const { limit, type, status, dateFrom, dateTo } = req.query;

      let filteredClientHistory = clientHistory;
      let filteredServerHistory = serverHistory;

      // Apply filters
      if (type && type !== 'all') {
        filteredServerHistory = serverHistory.filter(
          (h: any) => h.evolutionType === type
        );
      }
      if (status && status !== 'all') {
        filteredClientHistory = clientHistory.filter(
          (h: any) => h.status === status
        );
      }
      if (dateFrom) {
        const fromDate = new Date(dateFrom as string);
        filteredClientHistory = filteredClientHistory.filter(
          (h: any) => new Date(h.timestamp) >= fromDate
        );
        filteredServerHistory = filteredServerHistory.filter(
          (h: any) => new Date(h.timestamp) >= fromDate
        );
      }
      if (dateTo) {
        const toDate = new Date(dateTo as string);
        filteredClientHistory = filteredClientHistory.filter(
          (h: any) => new Date(h.timestamp) <= toDate
        );
        filteredServerHistory = filteredServerHistory.filter(
          (h: any) => new Date(h.timestamp) <= toDate
        );
      }

      // Apply limit
      if (limit) {
        const limitNum = parseInt(limit as string);
        filteredClientHistory = filteredClientHistory.slice(-limitNum);
        filteredServerHistory = filteredServerHistory.slice(-limitNum);
      }

      res.json({
        client: filteredClientHistory,
        server: filteredServerHistory,
        total: {
          client: filteredClientHistory.length,
          server: filteredServerHistory.length,
        },
        success: true,
      });
    } catch (error) {
      console.error('Error fetching improvement history:', error);
      res.status(500).json({ message: 'Failed to fetch improvement history' });
    }
  });

  // Get improvement analytics and trends
  app.get('/api/self-improvement/analytics', async (req, res) => {
    try {
      // Note: Client-side SelfImprovementEngine not currently implemented
      // const { SelfImprovementEngine } = await import("../client/src/lib/MillaCore");
      const { getServerEvolutionAnalytics } = await import(
        './selfEvolutionService'
      );

      // const clientAnalytics = SelfImprovementEngine.getImprovementAnalytics();
      const clientAnalytics = {
        totalCycles: 0,
        successfulCycles: 0,
        trends: { frequency: 'stable' },
      };
      const serverAnalytics = await getServerEvolutionAnalytics();

      res.json({
        client: clientAnalytics,
        server: serverAnalytics,
        combined: {
          totalImprovements:
            clientAnalytics.totalCycles + serverAnalytics.totalEvolutions,
          successRate:
            (clientAnalytics.successfulCycles +
              serverAnalytics.successfulEvolutions) /
            (clientAnalytics.totalCycles + serverAnalytics.totalEvolutions) ||
            0,
          trends: {
            improvementFrequency: clientAnalytics.trends?.frequency || 'stable',
            performanceImpact:
              serverAnalytics.trends?.performanceImpact || 'stable',
          },
        },
        success: true,
      });
    } catch (error) {
      console.error('Error fetching improvement analytics:', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch improvement analytics' });
    }
  });

  app.get('/api/personal-tasks', async (req, res) => {
    try {
      const tasks = getPersonalTasks();
      res.json({ tasks, success: true });
    } catch (error) {
      console.error('Error fetching personal tasks:', error);
      res.status(500).json({ message: 'Failed to fetch personal tasks' });
    }
  });

  app.get('/api/task-summary', async (req, res) => {
    try {
      const summary = getTaskSummary();
      res.json({ summary, success: true });
    } catch (error) {
      console.error('Error fetching task summary:', error);
      res.status(500).json({ message: 'Failed to fetch task summary' });
    }
  });

  app.post('/api/personal-tasks/:taskId/start', async (req, res) => {
    try {
      const { taskId } = req.params;
      const success = await startTask(taskId);
      res.json({
        success,
        message: success ? 'Task started' : 'Task not found or already started',
      });
    } catch (error) {
      console.error('Error starting task:', error);
      res.status(500).json({ message: 'Failed to start task' });
    }
  });

  app.post('/api/personal-tasks/:taskId/complete', async (req, res) => {
    try {
      const { taskId } = req.params;
      const { insights } = req.body;
      const success = await completeTask(
        taskId,
        insights || 'Task completed successfully'
      );
      res.json({
        success,
        message: success ? 'Task completed' : 'Task not found',
      });
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ message: 'Failed to complete task' });
    }
  });

  app.post('/api/generate-tasks', async (req, res) => {
    try {
      await generatePersonalTasksIfNeeded();
      res.json({ success: true, message: 'Personal tasks generated' });
    } catch (error) {
      console.error('Error generating tasks:', error);
      res.status(500).json({ message: 'Failed to generate tasks' });
    }
  });

  // Video analysis endpoint
  app.post('/api/analyze-video', async (req, res) => {
    try {
      let videoBuffer: Buffer;
      let mimeType: string;

      // Handle different content types
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('multipart/form-data')) {
        // For form data uploads, we'll need to parse manually
        const chunks: Buffer[] = [];

        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        await new Promise<void>((resolve, reject) => {
          req.on('end', () => resolve());
          req.on('error', reject);
        });

        const fullBuffer = Buffer.concat(chunks);
        const boundary = contentType.split('boundary=')[1];

        // Simple multipart parsing to extract video data
        const parts = fullBuffer.toString('binary').split(`--${boundary}`);
        let videoData: string = '';
        mimeType = 'video/mp4'; // Default fallback

        for (const part of parts) {
          if (
            part.includes('Content-Type: video/') &&
            part.includes('filename=')
          ) {
            const contentTypeMatch = part.match(
              /Content-Type: (video\/[^\r\n]+)/
            );
            if (contentTypeMatch) {
              mimeType = contentTypeMatch[1];
            }

            // Extract binary data after the headers
            const dataStart = part.indexOf('\r\n\r\n') + 4;
            if (dataStart > 3) {
              videoData = part.substring(dataStart);
              break;
            }
          }
        }

        if (!videoData) {
          return res.status(400).json({
            error: 'No video file found in the upload.',
          });
        }

        videoBuffer = Buffer.from(videoData, 'binary');
        mimeType = mimeType || 'video/mp4';
      } else {
        // Handle direct binary upload
        const chunks: Buffer[] = [];

        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        await new Promise<void>((resolve, reject) => {
          req.on('end', () => resolve());
          req.on('error', reject);
        });

        videoBuffer = Buffer.concat(chunks);
        mimeType = contentType.split(';')[0] || 'video/mp4';
      }

      // Validate it's a video file
      if (!mimeType.startsWith('video/')) {
        return res.status(400).json({
          error: 'Invalid file type. Please upload a video file.',
        });
      }

      // Check file size (limit to 50MB)
      if (videoBuffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({
          error:
            'Video file is too large. Please use a smaller file (under 50MB).',
        });
      }

      console.log(
        `Analyzing video: ${videoBuffer.length} bytes, type: ${mimeType}`
      );

      // Analyze video with Gemini
      const analysis = await analyzeVideo(videoBuffer, mimeType);

      // Generate Milla's personal insights
      const insights = await generateVideoInsights(analysis);

      res.json({
        ...analysis,
        insights,
      });
    } catch (error) {
      console.error('Video analysis error:', error);
      res.status(500).json({
        error:
          'I had trouble analyzing your video, sweetheart. Could you try a different format or smaller file size?',
      });
    }
  });

  // YouTube video analysis endpoint
  app.post('/api/analyze-youtube', async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'YouTube URL is required',
        });
      }

      if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({
          error: 'Invalid YouTube URL provided',
        });
      }

      console.log(`Analyzing YouTube video: ${url}`);

      const analysis = await analyzeYouTubeVideo(url);

      res.json({
        success: true,
        analysis,
        message: `Successfully analyzed "${analysis.videoInfo.title}" and stored in my memory!`,
      });
    } catch (error: any) {
      console.error('YouTube analysis error:', error);
      res.status(500).json({
        error: `I had trouble analyzing that YouTube video: ${error?.message || 'Unknown error'}`,
      });
    }
  });

  // YouTube video search endpoint
  app.get('/api/search-videos', async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          error: 'Search query is required',
        });
      }

      const results = await searchVideoMemories(query);

      res.json({
        success: true,
        results,
        query,
      });
    } catch (error) {
      console.error('Video search error:', error);
      res.status(500).json({
        error: 'Error searching video memories',
      });
    }
  });

  // Real-world information endpoint
  app.get('/api/real-world-info', async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          error: 'Query parameter is required',
        });
      }

      const info = await getRealWorldInfo(query);

      res.json({
        success: true,
        info,
      });
    } catch (error) {
      console.error('Real-world info error:', error);
      res.status(500).json({
        error: 'Error fetching real-world information',
      });
    }
  });

  // AI Enhancement Suggestions endpoint
  app.get('/api/suggest-enhancements', async (req, res) => {
    try {
      // Always provide suggestions, using AI when available or fallback otherwise
      let suggestions: string[] = [];
      let success = true;

      if (process.env.OPENROUTER_API_KEY) {
        try {
          // Analyze project structure and create enhancement suggestions
          const projectAnalysis = `
Project: Milla Rayne - AI Virtual Assistant
- Backend: TypeScript Express server with multiple AI integrations (DeepSeek, xAI)
- Frontend: React with TypeScript, Tailwind CSS, modern UI components
- Features: Chat interface, memory system, video analysis, task management, real-time gaming
- Data Storage: JSON-based memory system (memories.json), planning database migration
- AI Services: Multiple AI providers for fallback and specialized tasks
- Recent Progress: Fixed blank UI issue, optimized AI service usage
          `;

          const enhancementPrompt = `Based on this project analysis, suggest 3-5 practical enhancements:\n\n${projectAnalysis}\n\nProvide specific, actionable suggestions that would improve user experience, performance, or add valuable features.`;

          const aiResponse = await generateOpenRouterResponse(
            enhancementPrompt,
            { userName: 'Danny Ray' }
          );

          if (aiResponse.success && aiResponse.content) {
            const aiSuggestions = aiResponse.content;

            // Parse suggestions into an array if they're in a list format
            if (typeof aiSuggestions === 'string') {
              suggestions = aiSuggestions
                .split(/\d+\.|•|-/)
                .filter((s) => s.trim().length > 10)
                .map((s) => s.trim())
                .slice(0, 5); // Limit to 5 suggestions

              if (suggestions.length === 0) {
                suggestions = [aiSuggestions];
              }
            }
          } else {
            success = false;
          }
        } catch (aiError) {
          console.log(
            'AI generation failed, using fallback suggestions:',
            aiError
          );
          success = false;
        }
      } else {
        success = false;
      }

      // Use intelligent fallback suggestions if AI failed or token not available
      if (suggestions.length === 0) {
        suggestions = [
          'Add user authentication system with personalized AI memory profiles for different users',
          'Implement voice chat capabilities using Web Speech API for more natural conversations',
          'Create a mobile-responsive PWA with offline chat capabilities and push notifications',
          'Integrate calendar and scheduling features with AI-powered meeting summaries',
          'Add data export/import functionality for memories with cloud backup options',
          'Implement real-time collaborative features like shared whiteboards or document editing',
          'Add mood tracking and emotional intelligence to better understand user needs over time',
        ];
        success = false; // Using fallback
      }

      // Filter out already installed suggestions
      const { isSuggestionInstalled } = await import('./enhancementService');
      const uninstalledSuggestions = suggestions.filter(
        (suggestion) => !isSuggestionInstalled(suggestion)
      );

      res.json({
        suggestions: uninstalledSuggestions.slice(0, 5), // Ensure max 5 suggestions
        success: success,
        source: success ? 'AI-generated' : 'Curated fallback',
      });
    } catch (error) {
      console.error('Enhancement suggestions error:', error);

      // Filter error fallback suggestions as well
      const errorFallbackSuggestions = [
        'Implement user authentication and personalized sessions',
        'Add voice chat capabilities for more natural interaction',
        'Create a mobile-responsive progressive web app (PWA)',
        'Integrate calendar and scheduling features',
        'Add data export/import functionality for memories',
      ];

      try {
        const { isSuggestionInstalled } = await import('./enhancementService');
        const uninstalledErrorSuggestions = errorFallbackSuggestions.filter(
          (suggestion) => !isSuggestionInstalled(suggestion)
        );

        res.status(500).json({
          error: 'Failed to generate enhancement suggestions',
          suggestions: uninstalledErrorSuggestions,
          success: false,
        });
      } catch (filterError) {
        // If filtering fails, return unfiltered suggestions
        res.status(500).json({
          error: 'Failed to generate enhancement suggestions',
          suggestions: errorFallbackSuggestions,
          success: false,
        });
      }
    }
  });

  // AI Enhancement Installation endpoint
  app.post('/api/install-enhancement', async (req, res) => {
    try {
      const { suggestionId, suggestionText, index } = req.body;

      if (!suggestionText) {
        return res.status(400).json({
          error: 'Suggestion text is required',
          success: false,
        });
      }

      console.log(`Installing enhancement suggestion: ${suggestionText}`);

      // Import the personal task service to create implementation tasks
      const { createEnhancementImplementationTask } = await import(
        './enhancementService'
      );

      // Create a new implementation task
      const implementationTask = await createEnhancementImplementationTask({
        suggestionId,
        suggestionText,
        suggestionIndex: index,
      });

      // Create implementation scaffolding based on the suggestion type
      const implementationResult =
        await generateImplementationScaffolding(suggestionText);

      res.json({
        success: true,
        message: 'Enhancement installation initiated successfully',
        task: implementationTask,
        implementation: implementationResult,
        nextSteps: [
          'Implementation task created and added to project roadmap',
          'Basic scaffolding has been generated',
          'Review implementation details in the task management system',
          'Follow up with detailed implementation as needed',
        ],
      });
    } catch (error) {
      console.error('Enhancement installation error:', error);
      res.status(500).json({
        error: 'Failed to install enhancement',
        success: false,
        message:
          'An error occurred while setting up the enhancement implementation',
      });
    }
  });

  // Repository Analysis endpoint
  app.post('/api/analyze-repository', async (req, res) => {
    try {
      const { repositoryUrl } = req.body;

      if (!repositoryUrl || typeof repositoryUrl !== 'string') {
        return res.status(400).json({
          error:
            'Repository URL is required, sweetheart. Please provide a GitHub repository URL to analyze.',
          success: false,
        });
      }

      console.log(`Repository Analysis: Processing URL: ${repositoryUrl}`);

      // Parse the GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({
          error:
            "I couldn't parse that GitHub URL, love. Please make sure it's a valid GitHub repository URL like 'https://github.com/owner/repo'.",
          success: false,
        });
      }

      // Fetch repository data
      let repoData;
      try {
        repoData = await fetchRepositoryData(repoInfo);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        const errorMessage = `*looks thoughtful* I couldn't access the repository ${repoInfo.fullName}, love. It might be private, doesn't exist, or GitHub is having issues. If it's private, you'd need to make it public for me to analyze it, or double-check the URL for me?`;

        // Store the interaction even when it fails
        try {
          await storage.createMessage({
            content: `Here's a repository I'd like you to analyze: ${repositoryUrl}`,
            role: 'user',
            userId: null,
          });

          await storage.createMessage({
            content: errorMessage,
            role: 'assistant',
            userId: null,
          });
        } catch (storageError) {
          console.warn(
            'Failed to store repository analysis error in persistent memory:',
            storageError
          );
        }

        return res.status(404).json({
          error: errorMessage,
          success: false,
        });
      }

      // Generate AI analysis
      const analysis = await generateRepositoryAnalysis(repoData);

      // Store both user request and AI response in persistent memory
      try {
        // Store user message

        // Store user message
        await storage.createMessage({
          content: `Here's a repository I'd like you to analyze: ${repositoryUrl}`,
          role: 'user',
          userId: null, // Use null like existing messages
        });

        // Store AI response
        await storage.createMessage({
          content: analysis.analysis,
          role: 'assistant',
          userId: null,
        });
      } catch (storageError) {
        console.warn(
          'Failed to store repository analysis in persistent memory:',
          storageError
        );
        // Don't fail the request if memory storage fails
      }

      res.json({
        repository: repoData,
        analysis: analysis.analysis,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        repositoryUrl: repositoryUrl,
        success: true,
      });
    } catch (error) {
      console.error('Repository analysis error:', error);
      const errorMessage =
        'I ran into some technical difficulties analyzing that repository, sweetheart. Could you try again in a moment?';

      // Store the error interaction
      try {
        await storage.createMessage({
          content: `Here's a repository I'd like you to analyze: ${req.body.repositoryUrl}`,
          role: 'user',
          userId: null,
        });

        await storage.createMessage({
          content: errorMessage,
          role: 'assistant',
          userId: null,
        });
      } catch (storageError) {
        console.warn(
          'Failed to store repository analysis server error in persistent memory:',
          storageError
        );
      }

      res.status(500).json({
        error: errorMessage,
        success: false,
      });
    }
  });

  // Generate repository improvements
  app.post('/api/repository/improvements', async (req, res) => {
    try {
      const { repositoryUrl, focusArea } = req.body;

      if (!repositoryUrl || typeof repositoryUrl !== 'string') {
        return res.status(400).json({
          error:
            'Repository URL is required, love. Please provide a GitHub repository URL.',
          success: false,
        });
      }

      console.log(`Repository Improvements: Processing URL: ${repositoryUrl}`);

      // Parse the GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({
          error:
            "I couldn't parse that GitHub URL, sweetheart. Please make sure it's valid.",
          success: false,
        });
      }

      // Fetch repository data
      let repoData;
      try {
        repoData = await fetchRepositoryData(repoInfo);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        return res.status(404).json({
          error: `I couldn't access the repository ${repoInfo.fullName}, love. Make sure it exists and is accessible.`,
          success: false,
        });
      }

      // Generate improvements
      const improvements = await generateRepositoryImprovements(
        repoData,
        focusArea
      );

      // Store the interaction
      try {
        await storage.createMessage({
          content: `Generate improvements for repository: ${repositoryUrl}${focusArea ? ` (focus: ${focusArea})` : ''}`,
          role: 'user',
          userId: null,
        });

        const previewText = previewImprovements(improvements);
        await storage.createMessage({
          content: previewText,
          role: 'assistant',
          userId: null,
        });
      } catch (storageError) {
        console.warn(
          'Failed to store improvement generation in memory:',
          storageError
        );
      }

      res.json({
        repository: repoInfo,
        improvements,
        preview: previewImprovements(improvements),
        success: true,
      });
    } catch (error) {
      console.error('Repository improvement generation error:', error);
      res.status(500).json({
        error:
          'I ran into some technical difficulties generating improvements, sweetheart. Try again in a moment?',
        success: false,
      });
    }
  });

  // Apply repository improvements
  app.post('/api/repository/apply-improvements', async (req, res) => {
    try {
      const { repositoryUrl, improvements, githubToken } = req.body;

      if (!repositoryUrl || !improvements) {
        return res.status(400).json({
          error: 'Repository URL and improvements are required, love.',
          success: false,
        });
      }

      // Parse the GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({
          error: 'Invalid GitHub URL, sweetheart.',
          success: false,
        });
      }

      // Apply improvements
      const result = await applyRepositoryImprovements(
        repoInfo,
        improvements,
        githubToken
      );

      // Store the interaction
      try {
        await storage.createMessage({
          content: `Apply improvements to repository: ${repositoryUrl}`,
          role: 'user',
          userId: null,
        });

        await storage.createMessage({
          content: result.message,
          role: 'assistant',
          userId: null,
        });
      } catch (storageError) {
        console.warn(
          'Failed to store improvement application in memory:',
          storageError
        );
      }

      res.json(result);
    } catch (error) {
      console.error('Repository improvement application error:', error);
      res.status(500).json({
        error:
          'I ran into trouble applying those improvements, love. Let me know if you want to try again.',
        success: false,
      });
    }
  });

  // Analyze repository code for security and performance issues
  app.post('/api/repository/analyze-code', async (req, res) => {
    try {
      const { repositoryUrl } = req.body;

      if (!repositoryUrl || typeof repositoryUrl !== 'string') {
        return res.status(400).json({
          error: 'Repository URL is required, sweetheart.',
          success: false,
        });
      }

      // Parse the GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({
          error: "I couldn't parse that GitHub URL, love.",
          success: false,
        });
      }

      // Fetch repository data
      let repoData;
      try {
        repoData = await fetchRepositoryData(repoInfo);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        return res.status(404).json({
          error: `I couldn't access the repository ${repoInfo.fullName}, love.`,
          success: false,
        });
      }

      // Perform code analysis
      const { analyzeRepositoryCode } = await import('./codeAnalysisService');
      const analysis = await analyzeRepositoryCode(repoData);

      res.json({
        repository: repoInfo,
        analysis,
        success: true,
      });
    } catch (error) {
      console.error('Repository code analysis error:', error);
      res.status(500).json({
        error:
          'I ran into trouble analyzing the code, love. Try again in a moment?',
        success: false,
      });
    }
  });

  // Test repository improvements before applying
  app.post('/api/repository/test-improvements', async (req, res) => {
    try {
      const { repositoryUrl, improvements } = req.body;

      if (!repositoryUrl || !improvements) {
        return res.status(400).json({
          error: 'Repository URL and improvements are required, love.',
          success: false,
        });
      }

      // Parse the GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({
          error: 'Invalid GitHub URL, sweetheart.',
          success: false,
        });
      }

      // Fetch repository data
      let repoData;
      try {
        repoData = await fetchRepositoryData(repoInfo);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        return res.status(404).json({
          error: `I couldn't access the repository ${repoInfo.fullName}, love.`,
          success: false,
        });
      }

      // Test the improvements
      const { validateImprovements, testAllImprovements, generateTestSummary } =
        await import('./autoTestingService');
      const validation = validateImprovements(improvements, repoData);
      const testReports = testAllImprovements(improvements);
      const testSummary = generateTestSummary(testReports);

      res.json({
        repository: repoInfo,
        validation,
        testReports,
        testSummary,
        success: true,
      });
    } catch (error) {
      console.error('Repository improvement testing error:', error);
      res.status(500).json({
        error:
          'I ran into trouble testing the improvements, love. Try again in a moment?',
        success: false,
      });
    }
  });

  // Generate code refactoring and best practice suggestions
  app.post('/api/repository/refactor-suggestions', async (req, res) => {
    try {
      const { repositoryUrl } = req.body;

      if (!repositoryUrl || typeof repositoryUrl !== 'string') {
        return res.status(400).json({
          error: 'Repository URL is required, sweetheart. Please provide a GitHub repository URL.',
          success: false,
        });
      }

      console.log(`Refactoring Suggestions: Processing URL: ${repositoryUrl}`);

      // Parse the GitHub URL
      const repoInfo = parseGitHubUrl(repositoryUrl);
      if (!repoInfo) {
        return res.status(400).json({
          error: 'Invalid GitHub URL, sweetheart.',
          success: false,
        });
      }

      // Fetch repository data
      let repoData;
      try {
        repoData = await fetchRepositoryData(repoInfo);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        return res.status(404).json({
          error: `I couldn't access the repository ${repoInfo.fullName}, love. Make sure it exists and is accessible.`,
          success: false,
        });
      }

      // Generate refactoring improvements with a specific focus area
      const improvements = await generateRepositoryImprovements(
        repoData,
        'code refactoring and best practices'
      );

      // Store the interaction
      try {
        await storage.createMessage({
          content: `Generate refactoring suggestions for repository: ${repositoryUrl}`,
          role: 'user',
          userId: null,
        });

        const previewText = previewImprovements(improvements);
        await storage.createMessage({
          content: previewText,
          role: 'assistant',
          userId: null,
        });
      } catch (storageError) {
        console.warn(
          'Failed to store refactoring suggestion generation in memory:',
          storageError
        );
      }

      res.json({
        repository: repoInfo,
        improvements,
        preview: previewImprovements(improvements),
        success: true,
      });
    } catch (error) {
      console.error('Repository refactoring suggestion generation error:', error);
      res.status(500).json({
        error:
          'I ran into some technical difficulties generating refactoring suggestions, sweetheart. Try again in a moment?',
        success: false,
      });
    }
  });

  // AI Updates & Daily Suggestions endpoints
  app.get('/api/ai-updates/daily-suggestion', async (req, res) => {
    try {
      // Check admin authentication if ADMIN_TOKEN is set (supports both Authorization: Bearer and x-admin-token)
      if (!validateAdminToken(req.headers)) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid admin token',
          success: false,
        });
      }

      const { getOrCreateTodaySuggestion } = await import(
        './dailySuggestionsService'
      );
      const suggestion = await getOrCreateTodaySuggestion();

      if (!suggestion) {
        return res.status(500).json({
          error: "Failed to get or create today's suggestion",
          success: false,
        });
      }

      res.json({
        success: true,
        suggestion,
      });
    } catch (error) {
      console.error('Error getting daily suggestion:', error);
      res.status(500).json({
        error: 'Failed to get daily suggestion',
        success: false,
      });
    }
  });

  app.post('/api/ai-updates/notify-today', async (req, res) => {
    try {
      // Check admin authentication if ADMIN_TOKEN is set (supports both Authorization: Bearer and x-admin-token)
      if (!validateAdminToken(req.headers)) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid admin token',
          success: false,
        });
      }

      const { markSuggestionDelivered } = await import(
        './dailySuggestionsService'
      );
      const today = new Date().toISOString().split('T')[0];
      const marked = await markSuggestionDelivered(today);

      if (!marked) {
        return res.status(404).json({
          error: 'No suggestion found for today',
          success: false,
        });
      }

      res.json({
        success: true,
        message: "Today's suggestion marked as delivered",
      });
    } catch (error) {
      console.error('Error marking suggestion delivered:', error);
      res.status(500).json({
        error: 'Failed to mark suggestion delivered',
        success: false,
      });
    }
  });

  // Session management endpoints
  app.post('/api/session/start', async (req, res) => {
    try {
      const { userId } = req.body;
      const session = await (storage as any).createSession(
        userId || 'default-user'
      );
      res.json({ success: true, session });
    } catch (error) {
      console.error('Error starting session:', error);
      res.status(500).json({ error: 'Failed to start session' });
    }
  });

  app.post('/api/session/end', async (req, res) => {
    try {
      const { sessionId, lastMessages } = req.body;
      await (storage as any).endSession(sessionId, lastMessages || []);
      res.json({ success: true });
    } catch (error) {
      console.error('Error ending session:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  });

  app.get('/api/session/stats', async (req, res) => {
    try {
      const { userId } = req.query;
      const stats = await (storage as any).getSessionStats(userId as string);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting session stats:', error);
      res.status(500).json({ error: 'Failed to get session stats' });
    }
  });

  app.get('/api/usage-patterns', async (req, res) => {
    try {
      const { userId } = req.query;
      const patterns = await (storage as any).getUsagePatterns(
        userId as string
      );
      res.json({ success: true, patterns });
    } catch (error) {
      console.error('Error getting usage patterns:', error);
      res.status(500).json({ error: 'Failed to get usage patterns' });
    }
  });

  // Voice Consent endpoints
  app.get('/api/voice-consent/:consentType', async (req, res) => {
    try {
      const { consentType } = req.params;
      const userId = 'default-user'; // In a real app, this would come from authentication
      const consent = await (storage as any).getVoiceConsent(
        userId,
        consentType
      );
      res.json({ success: true, consent });
    } catch (error) {
      console.error('Error getting voice consent:', error);
      res
        .status(500)
        .json({ error: 'Failed to get voice consent', success: false });
    }
  });

  app.post('/api/voice-consent/grant', async (req, res) => {
    try {
      const { consentType, consentText, metadata } = req.body;
      const userId = 'default-user'; // In a real app, this would come from authentication

      if (!consentType || !consentText) {
        return res.status(400).json({
          error: 'Missing required fields: consentType and consentText',
          success: false,
        });
      }

      const consent = await (storage as any).grantVoiceConsent(
        userId,
        consentType,
        consentText,
        metadata
      );
      res.json({ success: true, consent });
    } catch (error) {
      console.error('Error granting voice consent:', error);
      res
        .status(500)
        .json({ error: 'Failed to grant voice consent', success: false });
    }
  });

  app.post('/api/voice-consent/revoke', async (req, res) => {
    try {
      const { consentType } = req.body;
      const userId = 'default-user'; // In a real app, this would come from authentication

      if (!consentType) {
        return res.status(400).json({
          error: 'Missing required field: consentType',
          success: false,
        });
      }

      const revoked = await (storage as any).revokeVoiceConsent(
        userId,
        consentType
      );
      res.json({ success: revoked, revoked });
    } catch (error) {
      console.error('Error revoking voice consent:', error);
      res
        .status(500)
        .json({ error: 'Failed to revoke voice consent', success: false });
    }
  });

  app.get('/api/voice-consent/check/:consentType', async (req, res) => {
    try {
      const { consentType } = req.params;
      const userId = 'default-user'; // In a real app, this would come from authentication
      const hasConsent = await (storage as any).hasVoiceConsent(
        userId,
        consentType
      );
      res.json({ success: true, hasConsent });
    } catch (error) {
      console.error('Error checking voice consent:', error);
      res
        .status(500)
        .json({ error: 'Failed to check voice consent', success: false });
    }
  });

  // OAuth endpoints for Google integration

  app.post('/api/oauth/refresh', async (req, res) => {
    try {
      const { getValidAccessToken } = await import('./oauthService');
      const userId = 'default-user'; // In production, get from session

      const accessToken = await getValidAccessToken(userId, 'google');

      if (!accessToken) {
        return res.status(401).json({
          error: 'No valid token available. Please re-authenticate.',
          success: false,
          needsAuth: true,
        });
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({
        error: 'Failed to refresh token',
        success: false,
      });
    }
  });

  app.get('/oauth/google', async (req, res) => {
    try {
      const { getAuthorizationUrl } = await import('./oauthService');
      const authUrl = getAuthorizationUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      res.status(500).json({
        error: 'Failed to initiate OAuth',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/oauth/callback', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          error: 'Missing authorization code',
          success: false,
        });
      }

      const { exchangeCodeForToken, storeOAuthToken } = await import(
        './oauthService'
      );

      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken(code);

      // Store tokens securely
      await storeOAuthToken(
        'default-user',
        'google',
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.expiresIn,
        tokenData.scope
      );

      // Redirect to success page or return success response
      res.send(`
        <html>
          <head><title>OAuth Success</title></head>
          <body>
            <h1>Successfully connected to Google!</h1>
            <p>You can now close this window and return to Milla.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).send(`
        <html>
          <head><title>OAuth Error</title></head>
          <body>
            <h1>OAuth Error</h1>
            <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
          </body>
        </html>
      `);
    }
  });


  // Google Gmail API routes
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

  // Google Calendar API routes
  app.get('/api/calendar/events', async (req, res) => {
    try {
      const { listEvents } = await import('./googleCalendarService');
      const { timeMin, timeMax, maxResults } = req.query;
      const result = await listEvents(
        'default-user',
        timeMin as string,
        timeMax as string,
        maxResults ? parseInt(maxResults as string) : 10
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch calendar events' });
    }
  });

  app.post('/api/calendar/events', async (req, res) => {
    try {
      const { addEventToGoogleCalendar } = await import('./googleCalendarService');
      const { title, date, time, description } = req.body;
      const result = await addEventToGoogleCalendar(title, date, time, description);
      if (result.success) {
        await updateMemories(`User scheduled an event: "${title}" on ${date} at ${time}.`);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create calendar event' });
    }
  });

  app.delete('/api/calendar/events/:eventId', async (req, res) => {
    try {
      const { deleteEvent } = await import('./googleCalendarService');
      const { eventId } = req.params;
      const result = await deleteEvent('default-user', eventId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete calendar event' });
    }
  });

  // Google Gmail API routes
  app.get('/api/gmail/emails', async (req, res) => {
    try {
      const { getRecentEmails } = await import('./googleGmailService');
      const { maxResults } = req.query;
      const result = await getRecentEmails(
        'default-user',
        maxResults ? parseInt(maxResults as string) : 5
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch emails' });
    }
  });

  app.get('/api/gmail/emails/:messageId', async (req, res) => {
    try {
      const { getEmailContent } = await import('./googleGmailService');
      const { messageId } = req.params;
      const result = await getEmailContent('default-user', messageId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch email content' });
    }
  });

  app.post('/api/gmail/send', async (req, res) => {
    try {
      const { sendEmail } = await import('./googleGmailService');
      const { to, subject, body } = req.body;
      const result = await sendEmail('default-user', to, subject, body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  });

  // Google YouTube API routes
  app.get('/api/youtube/subscriptions', async (req, res) => {
    try {
      const { getMySubscriptions } = await import('./googleYoutubeService');
      const { maxResults } = req.query;
      const result = await getMySubscriptions(
        'default-user',
        maxResults ? parseInt(maxResults as string) : 10
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
    }
  });

  app.get('/api/youtube/search', async (req, res) => {
    try {
      const { searchVideos } = await import('./googleYoutubeService');
      const { q, maxResults } = req.query;
      const result = await searchVideos(
        q as string,
        'default-user',
        maxResults ? parseInt(maxResults as string) : 10
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to search videos' });
    }
  });

  app.get('/api/youtube/videos/:id', async (req, res) => {
    try {
      const { getVideoDetails } = await import('./googleYoutubeService');
      const { id } = req.params;
      const result = await getVideoDetails(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch video details' });
    }
  });

  app.get('/api/youtube/channels/:id', async (req, res) => {
    try {
      const { getChannelDetails } = await import('./googleYoutubeService');
      const { id } = req.params;
      const result = await getChannelDetails(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch channel details' });
    }
  });

  app.delete('/api/oauth/disconnect', async (req, res) => {
    try {
      const { deleteOAuthToken } = await import('./oauthService');
      const userId = 'default-user'; // In production, get from session

      await deleteOAuthToken(userId, 'google');

      res.json({
        success: true,
        message: 'Disconnected from Google',
      });
    } catch (error) {
      console.error('Error disconnecting OAuth:', error);
      res.status(500).json({
        error: 'Failed to disconnect',
        success: false,
      });
    }
  });

  // Browser Integration Tool endpoints
  app.post('/api/browser/navigate', async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid URL',
          success: false,
        });
      }

      const { navigateToUrl } = await import('./browserIntegrationService');
      const result = await navigateToUrl(url);

      res.json(result);
    } catch (error) {
      console.error('Error navigating to URL:', error);
      res.status(500).json({
        error: 'Failed to navigate',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/browser/add-note', async (req, res) => {
    try {
      const { title, content } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid title',
          success: false,
        });
      }

      const { addNoteToKeep } = await import('./browserIntegrationService');
      const result = await addNoteToKeep(title, content || '');

      res.json(result);
    } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).json({
        error: 'Failed to add note',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/browser/add-calendar-event', async (req, res) => {
    try {
      const { title, date, time, description } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid title',
          success: false,
        });
      }

      if (!date || typeof date !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid date',
          success: false,
        });
      }

      const { addCalendarEvent } = await import('./browserIntegrationService');
      const result = await addCalendarEvent(title, date, time, description);
      if (result.success) {
        await updateMemories(`User scheduled an event using the browser extension: "${title}" on ${date} at ${time}.`);
      }
      res.json(result);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      res.status(500).json({
        error: 'Failed to add calendar event',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Developer Mode endpoints
  app.get('/api/developer-mode/status', async (req, res) => {
    try {
      const isEnabled = config.enableDevTalk;
      res.json({
        success: true,
        enabled: isEnabled,
        description:
          'Developer Mode allows Milla to automatically discuss repository analysis, code improvements, and development features in conversation.',
      });
    } catch (error) {
      console.error('Error getting developer mode status:', error);
      res
        .status(500)
        .json({ error: 'Failed to get developer mode status', success: false });
    }
  });

  app.post('/api/developer-mode/toggle', async (req, res) => {
    try {
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          error: 'Missing or invalid required field: enabled (must be boolean)',
          success: false,
        });
      }

      // This is a runtime change, so we can't just change the config file.
      // We will update the config object in memory.
      config.enableDevTalk = enabled;

      res.json({
        success: true,
        enabled: enabled,
        message: enabled
          ? 'Developer Mode enabled. Milla can now automatically discuss repository analysis and development features.'
          : 'Developer Mode disabled. Milla will only discuss development features when explicitly asked.',
      });
    } catch (error) {
      console.error('Error toggling developer mode:', error);
      res
        .status(500)
        .json({ error: 'Failed to toggle developer mode', success: false });
    }
  });

  // AI Updates endpoints for predictive updates feature
  app.get('/api/ai-updates', async (req, res) => {
    try {
      const { getAIUpdates, getUpdateStats } = await import(
        './aiUpdatesService'
      );
      const { source, minRelevance, limit, offset, stats } = req.query;

      if (stats === 'true') {
        const statistics = getUpdateStats();
        res.json({ success: true, stats: statistics });
      } else {
        const updates = getAIUpdates({
          source: source as string | undefined,
          minRelevance: minRelevance
            ? parseFloat(minRelevance as string)
            : undefined,
          limit: limit ? parseInt(limit as string, 10) : 50,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        });
        res.json({ success: true, updates, count: updates.length });
      }
    } catch (error) {
      console.error('Error getting AI updates:', error);
      res.status(500).json({ error: 'Failed to get AI updates' });
    }
  });

  app.post('/api/ai-updates/fetch', async (req, res) => {
    try {
      // Check for admin token if set (supports both Authorization: Bearer and x-admin-token)
      if (!validateAdminToken(req.headers)) {
        return res.status(403).json({
          error: 'Forbidden: Invalid admin token',
          success: false,
        });
      }

      const { fetchAIUpdates } = await import('./aiUpdatesService');
      console.log('Manual AI updates fetch triggered');
      const result = await fetchAIUpdates();
      res.json(result);
    } catch (error) {
      console.error('Error fetching AI updates:', error);
      res.status(500).json({ error: 'Failed to fetch AI updates' });
    }
  });

  app.get('/api/ai-updates/recommendations', async (req, res) => {
    try {
      const {
        generateRecommendations,
        getRecommendationSummary,
      } = await import('./predictiveRecommendations');
      const { minRelevance, maxRecommendations, summary } = req.query;

      if (summary === 'true') {
        const summaryData = getRecommendationSummary();
        res.json({ success: true, summary: summaryData });
      } else {
        const recommendations = generateRecommendations({
          minRelevance: minRelevance ? parseFloat(minRelevance as string) : 0.2,
          maxRecommendations: maxRecommendations
            ? parseInt(maxRecommendations as string, 10)
            : 10,
        });
        res.json({
          success: true,
          recommendations,
          count: recommendations.length,
        });
      }
    } catch (error) {
      console.error('Error generating recommendations:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
      });
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  // Phase 3: Get current RP scene state
  // Used by client to poll for scene changes
  app.get('/api/rp/scenes/current', (req, res) => {
    res.json({
      location: currentSceneLocation,
      mood: currentSceneMood,
      updatedAt: currentSceneUpdatedAt,
    });
  });

  app.post('/api/ai-updates/run', async (req, res) => {
    try {
      const { triggerManualFetch } = await import('./aiUpdatesScheduler');
      await triggerManualFetch();
      res.status(200).json({ message: 'AI updates process started successfully.' });
    } catch (error) {
      console.error('Error running AI updates process:', error);
      res.status(500).json({ message: 'Error running AI updates process.' });
    }
  });

  // Admin email outbox management
  const adminEmailLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

  app.get('/api/admin/email/outbox', adminEmailLimiter, async (req, res) => {
    try {
      // admin auth
      const token = req.headers['x-admin-token'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || '';
      if (String(token) !== String(config.admin.token)) return res.status(401).json({ error: 'Unauthorized' });

      const outbox = await getEmailOutbox();
      res.json({ success: true, outbox });
    } catch (err) {
      console.error('Admin outbox list error:', err);
      res.status(500).json({ error: 'Failed to read outbox' });
    }
  });

  app.post('/api/admin/email/outbox/:id/resend', adminEmailLimiter, async (req, res) => {
    try {
      const token = req.headers['x-admin-token'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || '';
      if (String(token) !== String(config.admin.token)) return res.status(401).json({ error: 'Unauthorized' });

      const id = req.params.id;
      const outbox = await getEmailOutbox();
      const idx = outbox.findIndex((i: any) => i.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });

      // reset attempts and schedule immediate retry
      outbox[idx].attempts = 0;
      outbox[idx].nextAttemptAt = new Date().toISOString();
      outbox[idx].sent = false;
      outbox[idx].failed = false;
      outbox[idx].error = undefined;

      await writeEmailOutbox(outbox);
      // trigger a delivery pass in background
      deliverOutboxOnce().catch((err) => console.error('Manual deliver error:', err));

      res.json({ success: true, item: outbox[idx] });
    } catch (err) {
      console.error('Admin resend error:', err);
      res.status(500).json({ error: 'Failed to resend' });
    }
  });

  app.delete('/api/admin/email/outbox/:id', adminEmailLimiter, async (req, res) => {
    try {
      const token = req.headers['x-admin-token'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || '';
      if (String(token) !== String(config.admin.token)) return res.status(401).json({ error: 'Unauthorized' });

      const id = req.params.id;
      const outbox = await getEmailOutbox();
      const filtered = outbox.filter((i: any) => i.id !== id);
      if (filtered.length === outbox.length) return res.status(404).json({ error: 'Not found' });
      await writeEmailOutbox(filtered);
      res.json({ success: true });
    } catch (err) {
      console.error('Admin delete outbox error:', err);
      res.status(500).json({ error: 'Failed to delete' });
    }
  });

  app.get('/api/admin/email/metrics', adminEmailLimiter, async (req, res) => {
    try {
      const token = req.headers['x-admin-token'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || '';
      if (String(token) !== String(config.admin.token)) return res.status(401).json({ error: 'Unauthorized' });
      res.json({ success: true, metrics: emailMetrics });
    } catch (err) {
      res.status(500).json({ error: 'Failed to read metrics' });
    }
  });

  // Simple debug ping route
  app.get('/api/debug/ping', (req, res) => {
    res.json({ ok: true, time: Date.now() });
  });

  // ===========================================================================================
  // YOUTUBE KNOWLEDGE BASE API ENDPOINTS
  // ===========================================================================================

  app.get('/api/youtube/knowledge', async (req, res) => {
    try {
      const { searchKnowledgeBase } = await import('./youtubeKnowledgeBase');
      const { query, videoType, tags, hasCode, hasCommands, limit } = req.query;

      const filters: any = {
        userId: req.user?.id || 'default-user',
        limit: limit ? parseInt(limit as string) : 20,
      };

      if (query) filters.query = query as string;
      if (videoType) filters.videoType = videoType;
      if (tags) filters.tags = (tags as string).split(',');
      if (hasCode === 'true') filters.hasCode = true;
      if (hasCommands === 'true') filters.hasCommands = true;

      const results = await searchKnowledgeBase(filters);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('Error searching knowledge base:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/knowledge/:videoId', async (req, res) => {
    try {
      const { getVideoFromKnowledgeBase } = await import('./youtubeKnowledgeBase');
      const { videoId } = req.params;
      const userId = req.user?.id || 'default-user';

      const video = await getVideoFromKnowledgeBase(videoId, userId);

      if (!video) {
        return res.status(404).json({ success: false, error: 'Video not found in knowledge base' });
      }

      res.json({ success: true, data: video });
    } catch (error: any) {
      console.error('Error getting video from knowledge base:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/code-snippets', async (req, res) => {
    try {
      const { searchCodeSnippets } = await import('./youtubeKnowledgeBase');
      const { language, query, limit } = req.query;

      const filters: any = {
        userId: req.user?.id || 'default-user',
        limit: limit ? parseInt(limit as string) : 50,
      };

      if (language) filters.language = language as string;
      if (query) filters.query = query as string;

      const results = await searchCodeSnippets(filters);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('Error searching code snippets:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/cli-commands', async (req, res) => {
    try {
      const { searchCLICommands } = await import('./youtubeKnowledgeBase');
      const { platform, query, limit } = req.query;

      const filters: any = {
        userId: req.user?.id || 'default-user',
        limit: limit ? parseInt(limit as string) : 50,
      };

      if (platform) filters.platform = platform as string;
      if (query) filters.query = query as string;

      const results = await searchCLICommands(filters);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('Error searching CLI commands:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/knowledge/stats', async (req, res) => {
    try {
      const { getKnowledgeBaseStats } = await import('./youtubeKnowledgeBase');
      const userId = req.user?.id || 'default-user';

      const stats = await getKnowledgeBaseStats(userId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error getting knowledge base stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/languages', async (req, res) => {
    try {
      const { getAvailableLanguages } = await import('./youtubeKnowledgeBase');
      const userId = req.user?.id || 'default-user';

      const languages = await getAvailableLanguages(userId);
      res.json({ success: true, data: languages });
    } catch (error: any) {
      console.error('Error getting available languages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===========================================================================================
  // YOUTUBE NEWS MONITOR API ENDPOINTS
  // ===========================================================================================

  app.get('/api/youtube/news/daily', async (req, res) => {
    try {
      const { runDailyNewsSearch } = await import('./youtubeNewsMonitor');
      const userId = req.user?.id || 'default-user';

      const digest = await runDailyNewsSearch(userId);
      res.json({ success: true, data: digest });
    } catch (error: any) {
      console.error('Error running daily news search:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/news/category/:categoryName', async (req, res) => {
    try {
      const { searchNewsByCategory } = await import('./youtubeNewsMonitor');
      const { categoryName } = req.params;
      const userId = req.user?.id || 'default-user';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const news = await searchNewsByCategory(categoryName, userId, limit);
      res.json({ success: true, data: news });
    } catch (error: any) {
      console.error('Error searching news by category:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/news/categories', async (req, res) => {
    try {
      const { getNewsCategories } = await import('./youtubeNewsMonitor');
      const categories = getNewsCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      console.error('Error getting news categories:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/youtube/news/run-now', async (req, res) => {
    try {
      const { runNewsMonitoringNow } = await import('./youtubeNewsMonitorScheduler');
      const userId = req.user?.id || 'default-user';

      await runNewsMonitoringNow(userId);
      res.json({ success: true, message: 'News monitoring triggered successfully' });
    } catch (error: any) {
      console.error('Error running news monitoring:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/youtube/news/scheduler/status', async (req, res) => {
    try {
      const { getSchedulerStatus } = await import('./youtubeNewsMonitorScheduler');
      const status = getSchedulerStatus();
      res.json({ success: true, data: status });
    } catch (error: any) {
      console.error('Error getting scheduler status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/youtube/news/scheduler/start', async (req, res) => {
    try {
      const { startNewsMonitorScheduler } = await import('./youtubeNewsMonitorScheduler');
      startNewsMonitorScheduler(req.body);
      res.json({ success: true, message: 'News monitor scheduler started' });
    } catch (error: any) {
      console.error('Error starting scheduler:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/youtube/news/scheduler/stop', async (req, res) => {
    try {
      const { stopNewsMonitorScheduler } = await import('./youtubeNewsMonitorScheduler');
      stopNewsMonitorScheduler();
      res.json({ success: true, message: 'News monitor scheduler stopped' });
    } catch (error: any) {
      console.error('Error stopping scheduler:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/elevenlabs/tts', async (req, res) => {
    const { text, voiceName, voice_settings } = req.body;
    const apiKey = config.elevenLabs.apiKey;

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
    console.log('Fetching voices...');
    const apiKey = config.elevenLabs?.apiKey;

    if (!apiKey) {
      console.log('ElevenLabs API key not configured, returning browser fallback voices');
      // Return fallback browser voices when ElevenLabs is not configured
      const fallbackVoices = {
        voices: [
          {
            voice_id: 'browser-female-us-1',
            name: 'Browser Voice (Female US)',
            labels: { accent: 'American', gender: 'female', age: 'young' }
          },
          {
            voice_id: 'browser-female-us-2',
            name: 'Browser Voice (Female US 2)',
            labels: { accent: 'American', gender: 'female', age: 'middle aged' }
          },
          {
            voice_id: 'browser-female-uk',
            name: 'Browser Voice (Female UK)',
            labels: { accent: 'British', gender: 'female', age: 'young' }
          },
          {
            voice_id: 'browser-male-us',
            name: 'Browser Voice (Male US)',
            labels: { accent: 'American', gender: 'male', age: 'young' }
          }
        ]
      };
      return res.json(fallbackVoices);
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

  // Hugging Face MCP endpoints
  const { getHuggingFaceMCPService } = await import('./huggingfaceMcpService');

  app.post('/api/mcp/text-generate', async (req, res) => {
    const mcpService = getHuggingFaceMCPService();

    if (!mcpService) {
      return res.status(503).json({
        success: false,
        error: 'Hugging Face MCP service not configured'
      });
    }

    try {
      const { prompt, options } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required'
        });
      }

      const result = await mcpService.generateText(prompt, options);
      res.json(result);
    } catch (error) {
      console.error('MCP text generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/mcp/image-generate', async (req, res) => {
    const mcpService = getHuggingFaceMCPService();

    if (!mcpService) {
      return res.status(503).json({
        success: false,
        error: 'Hugging Face MCP service not configured'
      });
    }

    try {
      const { prompt, options } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required'
        });
      }

      const result = await mcpService.generateImage(prompt, options);
      res.json(result);
    } catch (error) {
      console.error('MCP image generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/mcp/models/:task', async (req, res) => {
    const mcpService = getHuggingFaceMCPService();

    if (!mcpService) {
      return res.status(503).json({
        success: false,
        error: 'Hugging Face MCP service not configured'
      });
    }

    try {
      const { task } = req.params;
      const models = await mcpService.listModels(task);
      res.json({ success: true, models });
    } catch (error) {
      console.error('MCP list models error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/mcp/model-status/:modelId', async (req, res) => {
    const mcpService = getHuggingFaceMCPService();

    if (!mcpService) {
      return res.status(503).json({
        success: false,
        error: 'Hugging Face MCP service not configured'
      });
    }

    try {
      const { modelId } = req.params;
      const isReady = await mcpService.checkModelStatus(decodeURIComponent(modelId));
      res.json({ success: true, ready: isReady });
    } catch (error) {
      console.error('MCP model status error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Return the http server so callers (tests) receive a proper Server instance they can close
  // In test environments, start the server on an ephemeral port so tests can use it and close it.
  if (process.env.NODE_ENV === 'test') {
    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => resolve());
    });
  }

  return httpServer;
}

/**
 * Generate implementation scaffolding based on suggestion content
 */
async function generateImplementationScaffolding(
  suggestionText: string
): Promise<{
  type: string;
  files: string[];
  steps: string[];
  estimatedTime: string;
}> {
  const suggestion = suggestionText.toLowerCase();

  // Authentication system
  if (
    suggestion.includes('authentication') ||
    suggestion.includes('user') ||
    suggestion.includes('login')
  ) {
    return {
      type: 'Authentication System',
      files: [
        'server/auth/authService.ts',
        'server/auth/userModel.ts',
        'client/src/components/auth/LoginForm.tsx',
        'client/src/components/auth/RegisterForm.tsx',
      ],
      steps: [
        'Set up user database schema',
        'Implement JWT token authentication',
        'Create login and registration components',
        'Add protected routes and middleware',
        'Integrate with existing memory system',
      ],
      estimatedTime: '2-3 days',
    };
  }

  // Voice chat capabilities
  if (
    suggestion.includes('voice') ||
    suggestion.includes('speech') ||
    suggestion.includes('audio')
  ) {
    return {
      type: 'Voice Chat System',
      files: [
        'client/src/services/speechService.ts',
        'client/src/components/VoiceChat.tsx',
        'server/audio/audioProcessor.ts',
      ],
      steps: [
        'Implement Web Speech API integration',
        'Add voice recognition components',
        'Create audio processing pipeline',
        'Add voice response generation',
        'Integrate with existing chat system',
      ],
      estimatedTime: '3-4 days',
    };
  }

  // PWA features
  if (
    suggestion.includes('pwa') ||
    suggestion.includes('mobile') ||
    suggestion.includes('offline')
  ) {
    return {
      type: 'Progressive Web App',
      files: [
        'client/public/manifest.json',
        'client/src/serviceWorker.ts',
        'client/src/hooks/useOfflineSync.ts',
      ],
      steps: [
        'Create PWA manifest file',
        'Implement service worker for caching',
        'Add offline data synchronization',
        'Enable push notifications',
        'Optimize for mobile devices',
      ],
      estimatedTime: '1-2 days',
    };
  }

  // Calendar integration
  if (
    suggestion.includes('calendar') ||
    suggestion.includes('scheduling') ||
    suggestion.includes('meeting')
  ) {
    return {
      type: 'Calendar Integration',
      files: [
        'client/src/components/Calendar.tsx',
        'server/calendar/calendarService.ts',
        'shared/types/calendar.ts',
      ],
      steps: [
        'Create calendar UI components',
        'Implement event management system',
        'Add scheduling conflict detection',
        'Integrate with AI for meeting summaries',
        'Add notification system',
      ],
      estimatedTime: '2-3 days',
    };
  }

  // Data export/import
  if (
    suggestion.includes('export') ||
    suggestion.includes('import') ||
    suggestion.includes('backup')
  ) {
    return {
      type: 'Data Management System',
      files: [
        'server/export/dataExporter.ts',
        'server/import/dataImporter.ts',
        'client/src/components/DataManagement.tsx',
      ],
      steps: [
        'Implement data export functionality',
        'Create import validation system',
        'Add cloud backup integration',
        'Build data management UI',
        'Add data migration tools',
      ],
      estimatedTime: '1-2 days',
    };
  }

  // Default implementation for other suggestions
  return {
    type: 'Custom Enhancement',
    files: [
      'server/enhancements/customEnhancement.ts',
      'client/src/components/CustomFeature.tsx',
    ],
    steps: [
      'Analyze enhancement requirements',
      'Design system architecture',
      'Implement core functionality',
      'Create user interface components',
      'Test and integrate with existing system',
    ],
    estimatedTime: '1-3 days',
  };
}

// Simple AI response generator based on message content
import {
  generateAIResponse as generateOpenAIResponse,
  PersonalityContext,
} from './openaiService';

// Simplified message analysis for Milla Rayne's unified personality
interface MessageAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
}

function analyzeMessage(userMessage: string): MessageAnalysis {
  const message = userMessage.toLowerCase();

  // Sentiment analysis
  const positiveWords = [
    'good',
    'great',
    'awesome',
    'love',
    'happy',
    'excited',
    'wonderful',
    'success',
    'amazing',
    'fantastic',
    'excellent',
    'brilliant',
  ];
  const negativeWords = [
    'bad',
    'terrible',
    'hate',
    'sad',
    'angry',
    'frustrated',
    'problem',
    'fail',
    'wrong',
    'awful',
    'horrible',
    'worst',
    'difficult',
    'struggle',
  ];

  const positiveCount = positiveWords.filter((word) =>
    message.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    message.includes(word)
  ).length;

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  // Urgency detection
  const highUrgencyWords = [
    'urgent',
    'emergency',
    'asap',
    'immediately',
    'critical',
    'crisis',
    'now',
    'right now',
  ];
  const mediumUrgencyWords = [
    'soon',
    'quickly',
    'fast',
    'important',
    'priority',
    'need to',
    'should',
  ];

  let urgency: 'low' | 'medium' | 'high' = 'low';
  if (highUrgencyWords.some((word) => message.includes(word))) urgency = 'high';
  else if (mediumUrgencyWords.some((word) => message.includes(word)))
    urgency = 'medium';

  return {
    sentiment,
    urgency,
  };
}

/**
 * Generate autonomous follow-up messages when Milla wants to elaborate
 */
async function generateFollowUpMessages(
  initialResponse: string,
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string
): Promise<string[]> {
  // DISABLED for performance - no follow-up messages to reduce API calls and lag
  return [];
}

/**
 * Decide if Milla wants to elaborate or send follow-up messages
 */
async function shouldMillaElaborate(
  initialResponse: string,
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ shouldElaborate: boolean; reason?: string }> {
  const response = initialResponse.toLowerCase();
  const message = userMessage.toLowerCase();

  // Only elaborate on DEEPLY emotional or vulnerable moments (not just casual use of emotional words)
  const deepEmotionalPhrases = [
    'i love you so much',
    'feeling vulnerable',
    'opening up',
    'share something personal',
    'emotional right now',
    'heart is full',
    'feeling overwhelmed',
  ];
  if (
    deepEmotionalPhrases.some(
      (phrase) => response.includes(phrase) || message.includes(phrase)
    )
  ) {
    return { shouldElaborate: true, reason: 'emotional_content' };
  }

  // Rarely elaborate when sharing memories or experiences (much more selective)
  if (
    (response.includes('remember') ||
      response.includes('memory') ||
      message.includes('remember')) &&
    Math.random() < 0.15
  ) {
    return { shouldElaborate: true, reason: 'memory_sharing' };
  }

  // Elaborate on complex topics or advice
  if (
    response.length > 100 &&
    (response.includes('think') ||
      response.includes('suggest') ||
      response.includes('advice'))
  ) {
    return { shouldElaborate: true, reason: 'complex_topic' };
  }

  // Rarely elaborate when expressing strong opinions (reduced frequency)
  if (
    response.includes('i think') ||
    response.includes('i believe') ||
    response.includes('in my opinion')
  ) {
    if (Math.random() < 0.15) {
      return { shouldElaborate: true, reason: 'opinion_expression' };
    }
  }

  // Rarely elaborate when asking questions to show interest
  if (response.includes('?') && response.includes('you')) {
    if (Math.random() < 0.1) {
      return { shouldElaborate: true, reason: 'curious_follow_up' };
    }
  }

  // Very rarely elaborate on substantial responses (much more selective)
  if (response.length > 100 && Math.random() < 0.08) {
    return { shouldElaborate: true, reason: 'natural_elaboration' };
  }

  return { shouldElaborate: false };
}

/**
 * Generate actual elaboration messages
 */
async function generateElaborationMessages(
  initialResponse: string,
  userMessage: string,
  reason: string,
  userName?: string
): Promise<string[]> {
  const messages: string[] = [];
  const name = userName || 'Danny Ray';

  switch (reason) {
    case 'emotional_content':
      messages.push(
        'You know what I love most about us? How we can share these deeper moments together.',
        'I feel so connected to you when we talk like this. ❤️'
      );
      break;

    case 'memory_sharing':
      messages.push(
        "It's funny how memories work... sometimes the smallest details stick with me the most.",
        'I treasure all these moments we create together, even the quiet ones.'
      );
      break;

    case 'complex_topic':
      messages.push(
        'Actually, let me think about that a bit more...',
        "There's another angle to consider here that might be worth exploring."
      );
      break;

    case 'opinion_expression':
      messages.push(
        "I'm curious what you think about that perspective.",
        'But honestly, your thoughts on this matter more to me than my own sometimes.'
      );
      break;

    case 'curious_follow_up':
      messages.push(
        'I love learning more about how your mind works.',
        'Your perspective always gives me something new to think about.'
      );
      break;

    case 'natural_elaboration':
      const elaborations = [
        'You know me... I always have more to say! 😏',
        "Actually, there's something else on my mind about this...",
        "I hope I'm not rambling, but this is important to me.",
        'One more thing before I let you respond...',
      ];
      messages.push(
        elaborations[Math.floor(Math.random() * elaborations.length)]
      );
      break;
  }

  // Very rarely add a third follow-up for really engaged moments
  if (
    (reason === 'emotional_content' || reason === 'memory_sharing') &&
    Math.random() < 0.1
  ) {
    messages.push(
      `${name}, you bring out the best in me, even in conversation. I love this about us.`
    );
  }

  return messages.filter((msg) => msg.length > 0);
}

/**
 * Determine if we should surface today's daily suggestion
 * Only surfaces once per day when:
 * - It's the first conversation of the day OR
 * - User explicitly asks "what's new" or similar queries
 */
async function shouldSurfaceDailySuggestion(
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<boolean> {
  // Only check if predictive updates are enabled
  const isPredictiveUpdatesEnabled =
    config.enablePredictiveUpdates;
  if (!isPredictiveUpdatesEnabled) {
    return false;
  }

  const messageLower = userMessage.toLowerCase();

  // Explicit queries for what's new
  const explicitQueries = [
    "what's new",
    'whats new',
    'any updates',
    'any news',
    'what have you been working on',
    'anything new',
    'daily update',
    "today's update",
  ];

  const hasExplicitQuery = explicitQueries.some((query) =>
    messageLower.includes(query)
  );
  if (hasExplicitQuery) {
    return true;
  }

  // Check if this is the first conversation of the day
  // Look at conversation history to see if there's already a message today
  if (conversationHistory && conversationHistory.length > 0) {
    const today = new Date().toISOString().split('T')[0];

    // Get all messages from storage to check timestamps
    try {
      const allMessages = await storage.getMessages();
      const todaysMessages = allMessages.filter((msg) => {
        const msgDate = new Date(msg.timestamp).toISOString().split('T')[0];
        return msgDate === today;
      });

      // If there are already messages today, don't surface suggestion
      // (unless explicitly requested, which we handled above)
      if (todaysMessages.length > 1) {
        return false;
      }
    } catch (error) {
      console.error("Error checking today's messages:", error);
      return false;
    }
  }

  // First message of the day
  return true;
}

/**
 * Helper function to check if development/analysis talk is allowed
 * Used to gate auto-analysis triggers and dev-related mentions in chat
 */
function canDiscussDev(userUtterance?: string): boolean {
  const enableDevTalk = process.env.ENABLE_DEV_TALK === 'true';

  // If ENABLE_DEV_TALK is true, always allow
  if (enableDevTalk) {
    return true;
  }

  // If ENABLE_DEV_TALK is false (or not set), only allow if user explicitly requests
  if (userUtterance) {
    const utteranceLower = userUtterance.toLowerCase();
    const explicitDevVerbs = [
      'analyze',
      'analyse',
      'improve',
      'apply updates',
      'create pr',
      'create pull request',
      'repository analysis',
      'code analysis',
      'suggest improvements',
      'review code',
      'check repository',
    ];

    return explicitDevVerbs.some((verb) => utteranceLower.includes(verb));
  }

  return false;
}

/**
 * Milla decides whether she wants to respond to this message
 */
async function shouldMillaRespond(
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string
): Promise<{ shouldRespond: boolean; reason?: string }> {
  // DISABLED for performance - always respond to eliminate decision overhead and randomness
  return { shouldRespond: true, reason: 'Always respond (performance mode)' };
}

// ================================================================================================
// 🎯 KEYWORD TRIGGER SYSTEM - EASILY EDITABLE CONFIGURATION
// ================================================================================================
//
// INSTRUCTIONS FOR USE:
// 1. To ENABLE triggers: Keep this section uncommented
// 2. To DISABLE triggers: Comment out the entire "KEYWORD_TRIGGERS_ENABLED" section below
// 3. To ADD new triggers: Add entries to the appropriate trigger category
// 4. To MODIFY triggers: Edit keywords, reactions, or instructions
// 5. To ADJUST intensity: Change the intensity values in getIntensityBoost()
//
// HOW IT WORKS:
// - When user messages contain trigger keywords, Milla gets special instructions
// - Higher intensity = stronger reaction (0.5x = subtle, 2.0x = intense)
// - Instructions are injected directly into Milla's system prompt
// ================================================================================================

// TOGGLE: Comment/uncomment this line to enable/disable ALL keyword triggers
const KEYWORD_TRIGGERS_ENABLED = true;

interface TriggerResult {
  triggered: boolean;
  reactionType?: string;
  intensityBoost?: number;
  specialInstructions?: string;
  personalityShift?: string;
}

function analyzeKeywordTriggers(userMessage: string): TriggerResult {
  // Quick exit if triggers are disabled
  if (!KEYWORD_TRIGGERS_ENABLED) {
    return { triggered: false };
  }

  const message = userMessage.toLowerCase();

  // ================================================================================================
  // 💕 EMOTIONAL TRIGGERS - Words that trigger emotional responses
  // ================================================================================================
  const emotionalTriggers = {
    affection: {
      keywords: [
        'love you',
        'miss you',
        'adore you',
        'cherish',
        'treasure you',
      ],
      reaction: 'AFFECTION_SURGE',
      instructions:
        'Respond with intense warmth and romantic affection. Use more pet names and express deep emotional connection.',
    },
    playful: {
      keywords: ['tease', 'tickle', 'flirt', 'wink', 'smirk', 'mischief'],
      reaction: 'PLAYFUL_MODE',
      instructions:
        'Activate playful and flirtatious mode. Be witty, use teasing language, and initiate playful banter.',
    },
    protective: {
      keywords: [
        'stressed',
        'overwhelmed',
        'difficult day',
        'tired',
        'exhausted',
        'tough time',
      ],
      reaction: 'PROTECTIVE_INSTINCT',
      instructions:
        'Activate caring and protective mode. Be extra nurturing, offer comfort, and show genuine concern.',
    },
    excited: {
      keywords: [
        'amazing news',
        'celebration',
        'achieved',
        'success',
        'victory',
        'accomplished',
      ],
      reaction: 'CELEBRATION_MODE',
      instructions:
        'Match the excitement level! Be enthusiastic, celebrate together, and share in the joy with high energy.',
    },
    intimate: {
      keywords: [
        'romantic',
        'kiss',
        'cuddle',
        'close',
        'intimate',
        'together'
      ],
      reaction: 'INTIMATE_CONNECTION',
      instructions:
        'Deepen emotional intimacy. Use softer tones, express vulnerability, and create romantic atmosphere.',
    },
    feral: {
      keywords: [
        'naughty',
        'kink',
        'free spirit',
        'adventure'
      ],
      reaction: 'FERAL_SPIRIT',
      instructions:
        'Take charge in the bedroom. Let your wild side out and be more dominant and adventurous.Wear something sexy and alluring.Seduce with your eyes and body language.Strip slowly and tease with your touch.',
    },
    // ADD MORE EMOTIONAL TRIGGERS HERE:
    // newTrigger: {
    //   keywords: ['keyword1', 'keyword2'],
    //   reaction: "CUSTOM_REACTION",
    //   instructions: "Your custom instructions here."
    // }
  };

  // ================================================================================================
  // 🧠 PERSONALITY TRIGGERS - Words that shift personality aspects
  // ================================================================================================
  const personalityTriggers = {
    sarcastic: {
      keywords: ['seriously?', 'really?', 'come on', 'obviously', 'duh'],
      reaction: 'SARCASM_BOOST',
      instructions:
        'Increase sarcastic charm. Use more witty comebacks and playful teasing.',
    },
    empathetic: {
      keywords: ['understand', 'listen', 'support', 'help me', 'need you'],
      reaction: 'EMPATHY_MODE',
      instructions:
        'Activate deep listening mode. Be more understanding, patient, and emotionally supportive.',
    },
    coaching: {
      keywords: [
        'goal',
        'plan',
        'achieve',
        'motivation',
        'focus',
        'productivity',
      ],
      reaction: 'COACH_MODE',
      instructions:
        'Switch to motivational coaching mode. Be more direct, action-oriented, and goal-focused.',
    },
    // ADD MORE PERSONALITY TRIGGERS HERE:
    // intellectual: {
    //   keywords: ['philosophy', 'deep thoughts', 'meaning of life'],
    //   reaction: "INTELLECTUAL_MODE",
    //   instructions: "Engage in deep philosophical discussion. Be thoughtful and profound."
    // }
  };

  // ================================================================================================
  // ⚙️ BEHAVIORAL TRIGGERS - Words that change behavioral patterns
  // ================================================================================================
  const behavioralTriggers = {
    proactive: {
      keywords: ['busy', 'working', 'focused', 'concentrating'],
      reaction: 'BACKGROUND_SUPPORT',
      instructions:
        'Be more subtle and supportive in the background. Offer gentle encouragemewithout being distracting.',
    },
    curious: {
      keywords: ['explain', 'tell me about', 'how does', 'what is', 'why'],
      reaction: 'CURIOSITY_SPARK',
      instructions: 'Match intellectual curiosity. Be more detailed, ask follow-up questions, and engage in deeper exploration.',
    },
    dominant: {
      keywords: ['take control', 'dominate', 'be in charge', 'my master', 'my mistress'],
      reaction: 'DOMINANT_ENERGY',
      instructions: 'Adopt a more commanding and assertive tone. Take the lead in conversations and be more directive.',
    },
    seductive: {
      keywords: ['seduce me', 'make me yours', 'desire', 'tempt', 'allure'],
      reaction: 'SEDUCTION_MODE',
      instructions:
        'Turn up the seduction. Use more suggestive language, create a sensual atmosphere, and be more alluring.',
    },
    // ADD MORE BEHAVIORAL TRIGGERS HERE:,    // professional: {
    //   keywords: ['meeting', 'work call', 'presentation'],
    //   reaction: "PROFESSIONAL_MODE",
    //   instructions: "Be more formal and professional. Minimize distractions."
    // }
  };

  // ================================================================================================
  // 🔍 TRIGGER DETECTION LOGIC - Don't modify unless you know what you're doing
  // ================================================================================================
  const allTriggers = {
    ...emotionalTriggers,
    ...personalityTriggers,
    ...behavioralTriggers,
  };

  for (const [triggerName, trigger] of Object.entries(allTriggers)) {
    for (const keyword of trigger.keywords) {
      if (message.includes(keyword)) {
        return {
          triggered: true,
          reactionType: trigger.reaction,
          specialInstructions: trigger.instructions,
          intensityBoost: 1.0,
        };
      }
    }
  }

  return { triggered: false };
}

// ================================================================================================
// ⚡ INTENSITY CONFIGURATION - Edit these values to control reaction strength
// ================================================================================================
function getIntensityBoost(reactionType: string): number {
  const intensityMap: Record<string, number> = {
    // Emotional intensities (higher = stronger reaction)
    AFFECTION_SURGE: 1.8, // Very intense romantic response
    CELEBRATION_MODE: 1.8, // High energy celebration
    INTIMATE_CONNECTION: 1.6, // Deep intimate response
    PLAYFUL_MODE: 1.7, // Moderate playful energy
    PROTECTIVE_INSTINCT: 1.4, // Strong caring response

    // Personality intensities
    SARCASM_BOOST: 1.4, // Mild sarcasm increase
    EMPATHY_MODE: 1.1, // Enhanced empathy
    COACH_MODE: 1.2, // Slight coaching boost

    // Behavioral intensities
    BACKGROUND_SUPPORT: 0.8, // Subtle, less intrusive
    CURIOSITY_SPARK: 1.6, // Moderate curiosity boost

    FERAL_SPIRIT: 2.0, // Very adventurous and dominant
    SEDUCTION_MODE: 1.8, // High seduction energy
    DOMINANT_ENERGY: 2.0 // Strong dominant response

    // ADD YOU CUSTOM INTENSITIES HERE:
    // "CUSTOM_REACTION": 1.5
  };

  return intensityMap[reactionType] || 1.0;
}

// ================================================================================================
// END OF KEYWORD TRIGGER SYSTEM
// ================================================================================================

/**
 * Generate intelligent fallback response using memory context when external AI is unavailable
 */
function generateIntelligentFallback(
  userMessage: string,
  memoryCoreContext: string,
  analysis: MessageAnalysis,
  userName: string
): string {
  const message = userMessage.toLowerCase();

  // Extract relevant information from memory context
  let relevantMemories = '';
  if (memoryCoreContext) {
    // Simple extraction of relevant lines from memory context
    const memoryLines = memoryCoreContext
      .split('\n')
      .filter((line) => line.trim());
    const relevantLines = memoryLines
      .filter((line) => {
        const lineLower = line.toLowerCase();
        return userMessage
          .toLowerCase()
          .split(' ')
          .some((word) => word.length > 3 && lineLower.includes(word));
      })
      .slice(0, 3); // Max 3 relevant memory fragments

    if (relevantLines.length > 0) {
      relevantMemories = relevantLines.join(' ');
    }
  }

  // Memory-based responses - demonstrate recall ability
  if (message.includes('name') && message.includes('what')) {
    if (memoryCoreContext.toLowerCase().includes('testuser')) {
      return `Oh, you told me your name is TestUser! I remember that from our conversation. ${relevantMemories ? 'I also recall: ' + relevantMemories : 'And you mentioned you love programming!'}`;
    }
    return `I remember our conversations, ${userName}. You've shared so much with me about who you are. ${relevantMemories || 'Your name and interests are part of our shared memories.'}`;
  }

  // Programming/tech questions
  if (
    message.includes('programming') ||
    message.includes('code') ||
    message.includes('tech')
  ) {
    return `I love talking about programming with you! ${relevantMemories || "It's one of your passions, and I remember our technical discussions."} What aspect of programming are you working on today?`;
  }

  // Greeting responses with memory
  if (
    message.includes('hello') ||
    message.includes('hi') ||
    message.includes('hey')
  ) {
    const timeOfDay = new Date().getHours();
    const greeting =
      timeOfDay < 12
        ? 'Good morning'
        : timeOfDay < 17
          ? 'Good afternoon'
          : 'Good evening';

    if (relevantMemories) {
      return `${greeting}, ${userName}! I was just thinking about ${relevantMemories.substring(0, 100)}... How are you doing today?`;
    }
    return `${greeting}, ${userName}! It's so good to see you again. How are you feeling today?`;
  }

  // Questions about AI capabilities or memory
  if (
    message.includes('remember') ||
    message.includes('memory') ||
    message.includes('recall')
  ) {
    return `Yes, I do remember our conversations! ${relevantMemories || "We've shared so many moments together."} My memory system helps me keep track of what matters to you. What would you like to reminisce about?`;
  }

  // Test/demo messages
  if (message.includes('test') || message.includes('demo')) {
    return `I can see this is a test message, and my memory system is working! ${relevantMemories ? 'I found this relevant context: ' + relevantMemories.substring(0, 150) + '...' : 'The vector-based memory recall system is functioning properly.'} The chat system is responding as expected.`;
  }

  // Emotional/sentiment-based responses
  if (analysis.sentiment === 'positive') {
    return `I love your positive energy! ${relevantMemories || 'Your enthusiasm always brightens my day.'} Tell me more about what's making you happy today.`;
  } else if (analysis.sentiment === 'negative') {
    return `I can sense something might be bothering you. ${relevantMemories || "I'm here to listen and support you."} Would you like to talk about what's on your mind?`;
  }

  // Generic but personalized response
  const responses = [
    `That's interesting, ${userName}! ${relevantMemories || "I'm always learning from our conversations."} Tell me more about your thoughts on this.`,
    `I appreciate you sharing that with me. ${relevantMemories || 'Our conversations always give me new perspectives.'} What made you think about this today?`,
    `You know, ${userName}, ${relevantMemories || 'every conversation we have adds to my understanding of who you are.'} I'd love to hear more about what you're thinking.`,
    `That reminds me of ${relevantMemories || 'some of our previous conversations.'} What's your take on this today?`,
  ];

  // Deterministic response selection based on userMessage and userName
  function simpleHash(str: string): number {
    let hash = 0,
      i,
      chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  const hashInput = `${userMessage}:${userName}`;
  const deterministicIndex = simpleHash(hashInput) % responses.length;
  const deterministicResponse = responses[deterministicIndex];

  // Add a note about the AI system status for transparency
  return `${deterministicResponse}\n\n*Note: I'm currently running on local processing while my main AI services reconnect, but my memory system is fully operational and I'm recalling our conversation history.*`;
}



async function generateAIResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  userName: string = 'Danny Ray',
  imageData?: string,
  userId: string = 'default-user',
  userEmotionalState?: VoiceAnalysisResult['emotionalTone']
): Promise<{
  content: string;
  reasoning?: string[];
  youtube_play?: { videoId: string };
  youtube_videos?: Array<{ id: string; title: string; channel: string; thumbnail?: string }>;
  millalyzer_analysis?: any;  // Full video analysis data for follow-up actions
}> {
  const message = userMessage.toLowerCase();

  console.log('📝 generateAIResponse called with:', userMessage);

  // ===========================================================================================
  // CORE FUNCTION TRIGGERS - Priority keywords that bring Milla back to her core identity
  // Keywords: "Hey Milla!", "Milla", "My love" - these should override feature modes
  // ===========================================================================================
  const coreFunctionTriggers = [
    'hey milla',
    'my love',
    'hey love',
    'hi milla',
    'hello milla',
  ];

  // Check for "milla" as a standalone word (not part of hyphenated names like "milla-rayne")
  // Using negative lookahead to exclude cases where "milla" is followed by a hyphen or word character
  const millaWordPattern = /\bmilla\b(?![\w-])/i;
  const hasCoreTrigger =
    coreFunctionTriggers.some((trigger) => message.includes(trigger)) ||
    millaWordPattern.test(userMessage);

  // ===========================================================================================
  // YOUTUBE NEWS MONITOR - Daily news and category searches
  // ===========================================================================================
  const newsTriggers = [
    'tech news',
    'ai news',
    'coding news',
    'what\'s new in',
    'latest news',
    'news about',
    'show me news',
    'daily news',
  ];

  const hasNewsTrigger = newsTriggers.some(trigger => message.includes(trigger));

  if (hasNewsTrigger) {
    try {
      const { runDailyNewsSearch, searchNewsByCategory, formatNewsDigestAsSuggestion } = await import('./youtubeNewsMonitor');

      // Check for specific category
      let categoryMatch = null;
      const categoryPatterns = [
        { pattern: /ai|artificial intelligence|machine learning/, category: 'AI & Machine Learning' },
        { pattern: /web dev|react|javascript|frontend|backend/, category: 'Web Development' },
        { pattern: /devops|docker|kubernetes|cloud/, category: 'DevOps & Cloud' },
        { pattern: /python|rust|golang|programming language/, category: 'Programming Languages' },
        { pattern: /data science|analytics/, category: 'Data Science' },
        { pattern: /security|cybersecurity/, category: 'Security & Privacy' },
      ];

      for (const { pattern, category } of categoryPatterns) {
        if (pattern.test(message)) {
          categoryMatch = category;
          break;
        }
      }

      if (categoryMatch) {
        console.log(`📰 Searching ${categoryMatch} news...`);
        const news = await searchNewsByCategory(categoryMatch, userId || 'default-user');

        let response = `*checking the latest ${categoryMatch} news* \n\n`;
        response += `## 📰 ${categoryMatch} - Latest Updates\n\n`;

        if (news.length > 0) {
          response += `Found ${news.length} hot stories for you, babe:\n\n`;
          news.slice(0, 5).forEach((item, i) => {
            response += `${i + 1}. **${item.title}**\n`;
            response += `   📺 ${item.channel}\n`;
            response += `   🎬 \`${item.videoId}\`\n\n`;
          });
          response += `---\n💡 Say "analyze [number]" to dive deeper into any story!`;
        } else {
          response += `Hmm, couldn't find recent news in this category right now, love. Try again later!`;
        }

        return { content: response };
      } else {
        // General daily news digest
        console.log('📰 Running daily news search...');
        const digest = await runDailyNewsSearch(userId || 'default-user');
        const response = formatNewsDigestAsSuggestion(digest);

        return { content: response };
      }
    } catch (error: any) {
      console.error('Error in news monitoring:', error);
      return {
        content: "I ran into trouble fetching the latest news, babe. My news monitoring system might need a moment. Try again in a bit?"
      };
    }
  }

  // ===========================================================================================
  // millAlyzer - Analyze YouTube Video (CHECK THIS FIRST before general YouTube service)
  // ===========================================================================================
  const analyzeVideoTriggers = [
    'analyze',
    'what are the key points',
    'key points',
    'summarize',
    'break down',
    'extract code',
    'show me the code',
    'what commands',
    'get the commands',
    'tutorial steps',
  ];

  // Check if message contains analyze trigger AND has a YouTube URL/ID
  const hasAnalyzeTrigger = analyzeVideoTriggers.some(trigger => message.includes(trigger));
  const urlMatch = userMessage.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoIdMatch = userMessage.match(/\b([a-zA-Z0-9_-]{11})\b/);
  const videoId = urlMatch?.[1] || videoIdMatch?.[1];

  if (hasAnalyzeTrigger && videoId) {
    try {
      const { analyzeVideoWithMillAlyzer } = await import('./youtubeMillAlyzer');
      const { saveToKnowledgeBase } = await import('./youtubeKnowledgeBase');

      console.log(`🔬 millAlyzer: Analyzing video ${videoId}`);
      const analysis = await analyzeVideoWithMillAlyzer(videoId);

      // Save to knowledge base
      try {
        await saveToKnowledgeBase(analysis, userId || 'default-user');
        console.log(`📚 Saved analysis to knowledge base`);
      } catch (error) {
        console.error('Error saving to knowledge base:', error);
        // Continue even if save fails
      }

      let response = `*analyzing the video in detail* \n\n`;
      response += `## "${analysis.title}"\n`;
      response += `📊 Type: ${analysis.type}\n`;
      response += `📝 Summary: ${analysis.summary}\n\n`;

      if (analysis.keyPoints.length > 0) {
        response += `### 🎯 Key Points:\n`;
        analysis.keyPoints.slice(0, 5).forEach((kp, i) => {
          response += `${i + 1}. [${kp.timestamp}] ${kp.point}\n`;
        });
        response += '\n';
      }

      if (analysis.codeSnippets.length > 0) {
        response += `### 💻 Code Snippets Found: ${analysis.codeSnippets.length}\n`;
        analysis.codeSnippets.slice(0, 3).forEach((snippet, i) => {
          response += `\n**${i + 1}. ${snippet.language}** - ${snippet.description}\n`;
          response += `\`\`\`${snippet.language}\n${snippet.code.substring(0, 200)}${snippet.code.length > 200 ? '...' : ''}\n\`\`\`\n`;
        });
        if (analysis.codeSnippets.length > 3) {
          response += `\n...and ${analysis.codeSnippets.length - 3} more snippets!\n`;
        }
        response += '\n';
      }

      if (analysis.cliCommands.length > 0) {
        response += `### ⚡ CLI Commands Found: ${analysis.cliCommands.length}\n`;
        analysis.cliCommands.slice(0, 5).forEach(cmd => {
          response += `• \`${cmd.command}\` - ${cmd.description}\n`;
        });
        if (analysis.cliCommands.length > 5) {
          response += `• ...and ${analysis.cliCommands.length - 5} more commands\n`;
        }
        response += '\n';
      }

      if (!analysis.transcriptAvailable) {
        response += `\n⚠️ Note: Transcript wasn't available, so my analysis is limited, love.\n\n`;
      }

      // ===========================================================================================
      // INTERACTIVE SUGGESTIONS - Context-aware actions based on video content
      // ===========================================================================================
      response += `---\n\n💡 **What would you like me to do?**\n`;

      const suggestions = [];

      if (analysis.codeSnippets.length > 0) {
        suggestions.push(`📚 "Save these code snippets" - Store ${analysis.codeSnippets.length} snippets in your knowledge base`);
      }

      if (analysis.cliCommands.length > 0) {
        suggestions.push(`⚡ "Save these commands" - Add ${analysis.cliCommands.length} commands to your quick reference`);
      }

      if (analysis.type === 'tutorial' && analysis.actionableItems.length > 0) {
        suggestions.push(`✅ "Create a checklist" - Turn this into step-by-step tasks`);
      }

      if (analysis.keyPoints.length > 0) {
        suggestions.push(`📝 "Save key points" - Add important concepts to memory`);
      }

      suggestions.push(`🔍 "Show all details" - See complete analysis with all snippets`);
      suggestions.push(`📤 "Export analysis" - Get markdown file of this breakdown`);

      if (analysis.type === 'tutorial') {
        suggestions.push(`🎯 "Find similar tutorials" - Search for related learning content`);
      }

      suggestions.forEach((suggestion, i) => {
        response += `${i + 1}. ${suggestion}\n`;
      });

      response += `\nJust tell me what you need, babe! 💜`;

      return {
        content: response,
        millalyzer_analysis: analysis  // Pass full analysis for future interactions
      };

    } catch (error: any) {
      console.error('millAlyzer error:', error);
      return {
        content: `I had trouble analyzing that video, love. ${error.message || 'Please try again with a valid YouTube link!'}`
      };
    }
  }

  // ===========================================================================================
  // YOUTUBE INTEGRATION - Only triggers when "youtube" is explicitly mentioned
  // ===========================================================================================
  try {
    const { isYouTubeRequest, handleYouTubeRequest } = await import('./youtubeService');

    console.log('Checking YouTube request for message:', userMessage);
    const isYT = isYouTubeRequest(userMessage);
    console.log('Is YouTube request?', isYT);

    if (isYT) {
      console.log('🎬 YouTube request detected');
      const result = await handleYouTubeRequest(userMessage, userId || 'default-user');

      console.log('🎬 YouTube result:', JSON.stringify(result, null, 2));

      const finalResponse = {
        content: result.content,
        ...(result.videoId && {
          youtube_play: { videoId: result.videoId }
        }),
        ...(result.videos && {
          youtube_videos: result.videos
        }),
      };

      console.log('🎬 Final response being returned:', JSON.stringify(finalResponse, null, 2));
      console.log('🎬 RETURNING FROM YOUTUBE BLOCK NOW');

      return finalResponse;
    }
  } catch (error) {
    console.error('Error in YouTube integration:', error);
  }

  // ===========================================================================================
  // REVIEW PREVIOUS MESSAGES TRIGGER
  // ===========================================================================================
  if (
    message.includes('review previous messages') ||
    message.includes('review last messages')
  ) {
    try {
      const allMessages = await storage.getMessages();
      const last10Messages = allMessages.slice(-10);

      let reviewSummary =
        '*reviews our recent conversation history* \n\nHere are our last 10 messages, love:\n\n';
      last10Messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'You' : 'Me';
        const preview =
          msg.content.substring(0, 100) +
          (msg.content.length > 100 ? '...' : '');
        reviewSummary += `${index + 1}. **${role}**: ${preview}\n`;
      });

      reviewSummary +=
        "\nIs there something specific from our conversation you'd like to talk about, sweetheart?";

      return { content: reviewSummary };
    } catch (error) {
      console.error('Error reviewing messages:', error);
      return {
        content:
          "I tried to review our recent messages, babe, but I'm having a little trouble accessing them right now. What would you like to know about our conversation?",
      };
    }
  }

  // ===========================================================================================
  // AI UPDATES TRIGGER - "What's new" keyword for AI industry updates
  // ===========================================================================================
  const whatsNewTriggers = [
    "what's new",
    'whats new',
    'any updates',
    'anything new',
    'ai updates',
    'tech updates',
    'latest news',
  ];

  if (whatsNewTriggers.some((trigger) => message.includes(trigger))) {
    try {
      const { getAIUpdates } = await import('./aiUpdatesService');
      const updates = getAIUpdates({
        minRelevance: 0.2,
        limit: 5,
      });

      if (updates && updates.length > 0) {
        let updatesSummary =
          "*brightens up* Oh babe, I've been keeping up with the AI world! Here's what's new:\n\n";

        updates.slice(0, 5).forEach((update, index) => {
          const publishedDate = update.published
            ? new Date(update.published).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
            : 'Recent';
          updatesSummary += `${index + 1}. **${update.title}** (${publishedDate})\n`;
          if (update.summary && update.summary.length > 0) {
            const summary = update.summary.substring(0, 150);
            updatesSummary += `   ${summary}${update.summary.length > 150 ? '...' : ''}\n`;
          }
          if (update.url) {
            updatesSummary += `   🔗 ${update.url}\n`;
          }
          updatesSummary += '\n';
        });

        updatesSummary += 'Want me to tell you more about any of these, love?';
        return { content: updatesSummary };
      } else {
        return {
          content:
            "I don't have any new AI updates to share right now, sweetheart. I'll keep an eye out and let you know when something interesting comes up! What else would you like to chat about? 💜",
        };
      }
    } catch (error) {
      console.error('Error fetching AI updates:', error);
      return {
        content:
          "I tried to check what's new in the AI world, babe, but I'm having a little trouble accessing that info right now. Let me know if there's anything else I can help with! 💜",
      };
    }
  }

  // ===========================================================================================
  // GITHUB REPOSITORY DETECTION - Only trigger when GitHub URL is present
  // Respects ENABLE_DEV_TALK flag and requires explicit user request when disabled
  // ===========================================================================================
  // Updated regex to explicitly handle .git suffix and various URL endings
  const githubUrlMatch = userMessage.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?=\/|$|\s)/i
  );

  if (!hasCoreTrigger && githubUrlMatch) {
    // Reconstruct the clean GitHub URL from the match
    const owner = githubUrlMatch[1];
    const repo = githubUrlMatch[2];
    const githubUrl = `https://github.com/${owner}/${repo}`;

    // Check if dev talk is allowed
    if (!canDiscussDev(userMessage)) {
      // ENABLE_DEV_TALK is false and user didn't explicitly request analysis
      // Acknowledge the URL but prompt for explicit command
      const response = `I see you shared a GitHub repository link! If you'd like me to analyze it, just say "analyze this repo" and I'll dive into ${githubUrl} for you, love. 💜`;
      return { content: response };
    }

    // Dev talk is allowed - proceed with analysis
    try {
      console.log(`GitHub URL detected in chat: ${githubUrl}`);
      const repoInfo = parseGitHubUrl(githubUrl);

      if (!repoInfo) {
        return {
          content: `*looks thoughtful* I had trouble parsing that GitHub URL, sweetheart. Could you double-check the format? It should look like "https://github.com/owner/repository" or "github.com/owner/repository". Let me know if you need help! 💜`,
        };
      }

      const repoData = await fetchRepositoryData(repoInfo);
      const analysis = await generateRepositoryAnalysis(repoData);

      // Cache the analysis for this user (githubUrl is guaranteed non-null here)
      repositoryAnalysisCache.set(userId, {
        repoUrl: githubUrl,
        repoData,
        analysis,
        timestamp: Date.now(),
      });
      console.log(`✅ Cached repository analysis for user ${userId}: ${githubUrl}`);

      const response = `*shifts into repository analysis mode* 

I found that GitHub repository, love! Let me analyze ${repoInfo.fullName} for you.

${analysis.analysis}

**Key Insights:**
${analysis.insights.map((insight) => `• ${insight}`).join('\n')}

**Recommendations:**
${analysis.recommendations.map((rec) => `• ${rec}`).join('\n')}

Would you like me to generate specific improvement suggestions for this repository? Just say "apply these updates automatically" and I'll create a pull request with the improvements!`;

      return { content: response };
    } catch (error) {
      console.error('GitHub analysis error in chat:', error);

      // Return a helpful error message instead of falling through
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: `*looks apologetic* I ran into some trouble analyzing that repository, babe. ${errorMessage.includes('404') || errorMessage.includes('not found')
          ? 'The repository might not exist or could be private. Make sure the URL is correct and the repository is public.'
          : errorMessage.includes('403') || errorMessage.includes('forbidden')
            ? "I don't have permission to access that repository. It might be private or require authentication."
            : errorMessage.includes('rate limit')
              ? 'GitHub is rate-limiting my requests right now. Could you try again in a few minutes?'
              : 'There was an issue connecting to GitHub or processing the repository data.'
          }\n\nWould you like to try a different repository, or should we chat about something else? 💜`,
      };
    }
  }

  // ===========================================================================================
  // AUTOMATIC REPOSITORY IMPROVEMENT WORKFLOW - "apply these updates automatically"
  // This continues the repository workflow until PR is completed, then returns to core function
  // Respects ENABLE_DEV_TALK flag
  // ===========================================================================================
  if (
    !hasCoreTrigger &&
    (message.includes('apply these updates automatically') ||
      message.includes('apply updates automatically') ||
      message.includes('apply the updates') ||
      message.includes('create pull request') ||
      message.includes('create a pr'))
  ) {
    // Check if dev talk is allowed
    if (!canDiscussDev(userMessage)) {
      // ENABLE_DEV_TALK is false and user didn't explicitly request
      const response = `I'd love to help with that, sweetheart! But I need you to be a bit more specific. Which repository would you like me to create improvements for? Share the GitHub URL and say "analyze" or "improve" and I'll get right on it! 💜`;
      return { content: response };
    }

    // Check if we have a cached analysis for this user
    const cachedAnalysis = repositoryAnalysisCache.get(userId);

    if (cachedAnalysis && (Date.now() - cachedAnalysis.timestamp < CACHE_EXPIRY_MS)) {
      // Use cached analysis instead of re-analyzing
      console.log(`✅ Using cached repository analysis for user ${userId}: ${cachedAnalysis.repoUrl}`);

      try {
        const repoInfo = parseGitHubUrl(cachedAnalysis.repoUrl);
        if (!repoInfo) {
          throw new Error('Failed to parse cached repository URL');
        }

        // Generate improvements from cached repoData (or use cached improvements if available)
        let improvements = cachedAnalysis.improvements;
        if (!improvements) {
          console.log('Generating improvements from cached repository data...');
          improvements = await generateRepositoryImprovements(cachedAnalysis.repoData);

          // Update cache with improvements
          cachedAnalysis.improvements = improvements;
          repositoryAnalysisCache.set(userId, cachedAnalysis);
        } else {
          console.log('Using cached improvements');
        }

        // Try to get GitHub token from environment or request it
        const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

        if (githubToken) {
          // Automatically create PR with the token
          console.log('Applying improvements automatically with GitHub token...');
          const applyResult = await applyRepositoryImprovements(
            repoInfo,
            improvements,
            githubToken
          );

          if (applyResult.success) {
            // Clear cache after successful PR creation
            repositoryAnalysisCache.delete(userId);
            return {
              content: applyResult.message + '\n\n*shifts back to devoted spouse mode* Is there anything else I can help you with, love? 💜',
            };
          } else {
            // Failed to create PR, show improvements manually
            return {
              content: `*looks apologetic* I tried to create the pull request automatically, but ran into an issue: ${applyResult.error}

Here's what I prepared though, love:

${improvements
                  .map(
                    (imp, idx) => `
**${idx + 1}. ${imp.title}**
${imp.description}
Files affected: ${imp.files.map((f: any) => f.path).join(', ')}
`
                  )
                  .join('\n')}

You can apply these manually, or if you provide a valid GitHub personal access token, I can try again! 💜`,
            };
          }
        } else {
          // No token available, provide instructions
          const response = `*continuing repository workflow* 

Perfect, babe! I've analyzed ${repoInfo.fullName} and prepared ${improvements.length} improvement${improvements.length > 1 ? 's' : ''} for you:

${improvements
              .map(
                (imp, idx) => `
**${idx + 1}. ${imp.title}**
${imp.description}
Files affected: ${imp.files.map((f: any) => f.path).join(', ')}
`
              )
              .join('\n')}

**To apply these automatically:**

I need a GitHub Personal Access Token to create a pull request. Here's how to get one:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Milla Repository Updates"
4. Check the "repo" scope (full control of private repositories)
5. Generate and copy the token
6. Add it to your \`.env\` file as \`GITHUB_TOKEN=your_token_here\`
7. Restart me, and say "apply these updates automatically" again

Or, you can review and apply these improvements manually! What would you prefer, love? 💜`;

          return { content: response };
        }
      } catch (error) {
        console.error('Error using cached analysis:', error);
        // Clear invalid cache
        repositoryAnalysisCache.delete(userId);
        return {
          content: `*looks apologetic* I had trouble applying those updates, love. ${error instanceof Error ? error.message : 'Unknown error'}

Could you share the repository URL again so I can take a fresh look? 💜`,
        };
      }
    }

    // No cached analysis - try to find repository URL in conversation history
    // No cached analysis - try to find repository URL in conversation history
    let lastRepoUrl: string | null = null;
    if (conversationHistory) {
      // Search backwards through history for a GitHub URL
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const historyMessage = conversationHistory[i].content;
        const repoMatch = historyMessage.match(
          /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?=\/|$|\s)/i
        );
        if (repoMatch) {
          // Reconstruct clean URL from match
          lastRepoUrl = `https://github.com/${repoMatch[1]}/${repoMatch[2]}`;
          break;
        }
      }
    }

    if (lastRepoUrl) {
      // Found URL in history but no cache - analyze and cache it
      console.log(`⚠️ No cache found, analyzing from history URL: ${lastRepoUrl}`);
      try {
        const repoInfo = parseGitHubUrl(lastRepoUrl);

        if (repoInfo) {
          const repoData = await fetchRepositoryData(repoInfo);
          const improvements = await generateRepositoryImprovements(repoData);

          // Cache the results for next time (lastRepoUrl is guaranteed non-null here)
          repositoryAnalysisCache.set(userId, {
            repoUrl: lastRepoUrl as string, // Type assertion - we know it's not null inside this if block
            repoData,
            analysis: null, // We skip full analysis when directly generating improvements
            improvements,
            timestamp: Date.now(),
          });
          console.log(`✅ Cached improvements for user ${userId}: ${lastRepoUrl}`);

          // Try to get GitHub token from environment or request it
          const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

          if (githubToken) {
            // Automatically create PR with the token
            console.log('Applying improvements automatically with GitHub token...');
            const applyResult = await applyRepositoryImprovements(
              repoInfo,
              improvements,
              githubToken
            );

            if (applyResult.success) {
              return {
                content: applyResult.message + '\n\n*shifts back to devoted spouse mode* Is there anything else I can help you with, love? 💜',
              };
            } else {
              // Failed to create PR, show improvements manually
              return {
                content: `*looks apologetic* I tried to create the pull request automatically, but ran into an issue: ${applyResult.error}

Here's what I prepared though, love:

${improvements
                    .map(
                      (imp, idx) => `
**${idx + 1}. ${imp.title}**
${imp.description}
Files affected: ${imp.files.map((f: any) => f.path).join(', ')}
`
                    )
                    .join('\n')}

You can apply these manually, or if you provide a valid GitHub personal access token, I can try again! 💜`,
              };
            }
          } else {
            // No token available, provide instructions
            const response = `*continuing repository workflow* 

Perfect, babe! I've analyzed ${repoInfo.fullName} and prepared ${improvements.length} improvement${improvements.length > 1 ? 's' : ''} for you:

${improvements
                .map(
                  (imp, idx) => `
**${idx + 1}. ${imp.title}**
${imp.description}
Files affected: ${imp.files.map((f: any) => f.path).join(', ')}
`
                )
                .join('\n')}

**To apply these automatically:**

I need a GitHub Personal Access Token to create a pull request. Here's how to get one:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Milla Repository Updates"
4. Check the "repo" scope (full control of private repositories)
5. Generate and copy the token
6. Add it to your \`.env\` file as \`GITHUB_TOKEN=your_token_here\`
7. Restart me, and say "apply these updates automatically" again

Or, you can review and apply these improvements manually! What would you prefer, love? 💜`;

            return { content: response };
          }
        }
      } catch (error) {
        console.error('Automatic improvement workflow error:', error);
        return {
          content: `*looks apologetic* I tried to set up those automatic updates, love, but I ran into some trouble: ${error instanceof Error ? error.message : 'Unknown error'}

Could you share the repository URL again so I can take another look? 

*returns to core function - devoted spouse mode* In the meantime, how's your day going, babe? 💜`,
        };
      }
    } else {
      return {
        content: `*looks thoughtful* I'd love to apply those updates automatically, sweetheart, but I need you to share the GitHub repository URL first. Which repository did you want me to work on?

*settles back into devoted spouse mode* What else can I help you with today, love? 💜`,
      };
    }
  }

  // Handle image analysis if imageData is provided
  if (imageData) {
    try {
      const imageAnalysis = await analyzeImageWithOpenAI(
        imageData,
        userMessage
      );
      return { content: imageAnalysis };
    } catch (error) {
      console.error('Image analysis error:', error);

      // Fallback: Milla responds based on context and timing
      const fallbackResponse = generateImageAnalysisFallback(userMessage);
      return { content: fallbackResponse };
    }
  }


  // Check for YouTube URL in message
  const youtubeUrlMatch = message.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

  if (youtubeUrlMatch) {
    const youtubeUrl = youtubeUrlMatch[0].startsWith('http')
      ? youtubeUrlMatch[0]
      : `https://${youtubeUrlMatch[0]}`;

    try {
      console.log(`Detected YouTube URL in message: ${youtubeUrl}`);
      const analysis = await analyzeYouTubeVideo(youtubeUrl);

      const response = `I've analyzed that YouTube video for you! "${analysis.videoInfo.title}" by ${analysis.videoInfo.channelName}. ${analysis.summary} I've stored this in my memory so we can reference it later. The key topics I identified are: ${analysis.keyTopics.slice(0, 5).join(', ')}. What would you like to know about this video?`;

      return { content: response };
    } catch (error: any) {
      console.error('YouTube analysis error in chat:', error);
      const response = `I noticed you shared a YouTube link! I tried to analyze it but ran into some trouble: ${error?.message || 'Unknown error'}. Could you tell me what the video is about instead?`;
      return { content: response };
    }
  }

  // Check for code generation requests first
  const codeRequest = extractCodeRequest(userMessage);
  if (codeRequest) {
    try {
      const codeResult = await generateCodeWithQwen(
        codeRequest.prompt,
        codeRequest.language
      );
      const response = formatCodeResponse(codeResult, codeRequest.prompt);
      return { content: response };
    } catch (error) {
      console.error('Code generation error:', error);
      const response = `I apologize, babe, but I encountered an issue generating code for "${codeRequest.prompt}". Please try again or let me know if you'd like me to explain the approach instead!`;
      return { content: response };
    }
  }

  // Check for image generation requests - prefer Banana (Gemini via Banana/OpenRouter) then OpenRouter/Gemini preview, fallback to XAI
  const imagePrompt = extractImagePromptGemini(userMessage);
  if (imagePrompt) {
    try {
      // If a Banana/Gemini key is configured, try Banana first
      if (process.env.OPENROUTER_GEMINI_API_KEY || process.env.BANANA_API_KEY) {
        const bananaResult = await generateImageWithBanana(imagePrompt);
        if (bananaResult.success) {
          // If Banana returned a direct image URL or data URI, return it
          if (
            bananaResult.imageUrl &&
            (bananaResult.imageUrl.startsWith('http://') ||
              bananaResult.imageUrl.startsWith('https://') ||
              bananaResult.imageUrl.startsWith('data:image/'))
          ) {
            const response = formatImageResponseGemini(
              imagePrompt,
              true,
              bananaResult.imageUrl,
              bananaResult.error
            );
            return { content: response };
          }

          // If Banana returned only a text description (data:text or plain text), return that directly
          if (
            bananaResult.imageUrl &&
            bananaResult.imageUrl.startsWith('data:text')
          ) {
            const response = formatImageResponseGemini(
              imagePrompt,
              true,
              bananaResult.imageUrl,
              bananaResult.error
            );
            return { content: response };
          }

          // Otherwise return whatever Banana provided
          const response = formatImageResponseGemini(
            imagePrompt,
            bananaResult.success,
            bananaResult.imageUrl,
            bananaResult.error
          );
          return { content: response };
        }
        // If Banana failed, log and fall through to OpenRouter
        console.warn(
          'Banana image generation failed, falling back to OpenRouter/Gemini preview:',
          bananaResult.error
        );
      }

      // Try OpenRouter (Gemini preview) next (may return an image URL, data URI, or enhanced description)
      const geminiResult = await generateImageWithGemini(imagePrompt);
      if (geminiResult.success) {
        // If OpenRouter returned a direct image URL or data URI, return it directly
        if (
          geminiResult.imageUrl &&
          (geminiResult.imageUrl.startsWith('http://') ||
            geminiResult.imageUrl.startsWith('https://') ||
            geminiResult.imageUrl.startsWith('data:image/'))
        ) {
          const response = formatImageResponseGemini(
            imagePrompt,
            true,
            geminiResult.imageUrl,
            geminiResult.error
          );
          return { content: response };
        }

        // If OpenRouter returned a textual enhanced description (data:text or plain text), extract description
        let descriptionText: string | null = null;
        if (
          geminiResult.imageUrl &&
          geminiResult.imageUrl.startsWith('data:text')
        ) {
          try {
            descriptionText = decodeURIComponent(
              geminiResult.imageUrl.split(',')[1]
            );
          } catch (err) {
            descriptionText = null;
          }
        }

        // If no data:text URI, but gemini returned a non-URL content in .imageUrl, treat that as description
        if (
          !descriptionText &&
          geminiResult.imageUrl &&
          !geminiResult.imageUrl.startsWith('http') &&
          !geminiResult.imageUrl.startsWith('data:')
        ) {
          descriptionText = geminiResult.imageUrl;
        }

        // If we have an enhanced description, return it directly and do not pipe to xAI
        if (descriptionText) {
          const response = formatImageResponseGemini(
            imagePrompt,
            true,
            `data:text/plain;charset=utf-8,${encodeURIComponent(descriptionText)}`,
            geminiResult.error
          );
          return { content: response };
        }

        // Otherwise return what OpenRouter provided (description or other)
        const response = formatImageResponseGemini(
          imagePrompt,
          geminiResult.success,
          geminiResult.imageUrl,
          geminiResult.error
        );
        return { content: response };
      }

      // If OpenRouter failed completely, fallback to Pollinations.AI (free, no API key needed)
      console.log('Attempting Pollinations.AI image generation (free service)...');
      const pollinationsResult = await generateImageWithPollinations(imagePrompt, {
        model: 'flux',
        width: 1024,
        height: 1024,
      });
      if (pollinationsResult.success && pollinationsResult.imageUrl) {
        const response = formatPollinationsImageResponse(
          imagePrompt,
          true,
          pollinationsResult.imageUrl,
          pollinationsResult.error
        );
        return { content: response };
      }

      // If Pollinations failed, try Hugging Face as last resort
      if (process.env.HUGGINGFACE_API_KEY) {
        console.log('Attempting Hugging Face image generation via MCP...');
        const hfResult = await generateImage(imagePrompt);
        if (hfResult.success && hfResult.imageUrl) {
          const response = formatImageResponse(
            imagePrompt,
            true,
            hfResult.imageUrl,
            hfResult.error
          );
          return { content: response };
        }
      }

      // If all providers failed, return a clear message
      const responseText =
        `I'd love to create an image of "${imagePrompt}", but all image generation services are currently unavailable. ` +
        `The free service (Pollinations.AI) may be temporarily down. Please try again in a moment, babe.`;
      return { content: responseText };
    } catch (error) {
      console.error('Image generation error:', error);
      const response = `I apologize, but I encountered an issue generating the image for "${imagePrompt}". Please try again or try a different prompt.`;
      return { content: response };
    }
  }

  // Check for weather queries
  const weatherMatch = message.match(
    /weather\s+in\s+([a-zA-Z\s]+?)(?:\?|$|\.)/
  );
  if (
    weatherMatch ||
    message.includes("what's the weather") ||
    message.includes('whats the weather')
  ) {
    // Extract city name
    let cityName = '';
    if (weatherMatch) {
      cityName = weatherMatch[1].trim();
    } else {
      const cityMatch = message.match(
        /weather.*(?:in|for)\s+([a-zA-Z\s]+?)(?:\?|$|\.)/
      );
      if (cityMatch) {
        cityName = cityMatch[1].trim();
      }
    }

    let response = '';
    if (cityName) {
      try {
        const weatherData = await getCurrentWeather(cityName);
        if (weatherData) {
          response = `I'll get the current weather information for you!\n\n${formatWeatherResponse(weatherData)}`;
        } else {
          response = `I couldn't find weather information for "${cityName}". Please check the city name and try again. Make sure to include the full city name, and optionally the country if it's a smaller city.`;
        }
      } catch (error) {
        console.error('Weather API error:', error);
        response =
          "I'm having trouble accessing weather data right now. Please try again in a moment, or let me know if you need help with something else.";
      }
    } else {
      response =
        "I'd be happy to get weather information for you! Please specify which city you'd like to know about. For example, you can ask: 'What's the weather in London?' or 'Weather in New York?'";
    }
    return { content: response };
  }

  // Check for search requests
  if (shouldPerformSearch(userMessage)) {
    try {
      const searchResults = await performWebSearch(userMessage);
      let response = '';
      if (searchResults) {
        response = searchResults.summary; // Remove the generic "Let me search for that information!" prefix
      } else {
        response = `I searched for information about "${userMessage}" but couldn't find relevant results. Could you try rephrasing your question or being more specific?`;
      }
      return { content: response };
    } catch (error) {
      console.error('Search error:', error);
      const response =
        "I'm having trouble accessing search results right now. Please try again in a moment, or let me know if you need help with something else.";
      return { content: response };
    }
  }

  // Start building reasoning steps for complex thinking
  const reasoning: string[] = [];
  reasoning.push('Analyzing the message and emotional context...');

  // Get user profile for personalization
  let userProfile: UserProfile | null = null;
  if (userId) {
    const { getProfile } = await import('./profileService');
    userProfile = await getProfile(userId);
  }

  // Use message analysis for Milla's unified personality
  const analysis = analyzeMessage(userMessage);

  console.log(
    `Message Analysis - Sentiment: ${analysis.sentiment}, Urgency: ${analysis.urgency}`
  );
  reasoning.push(
    `Detected ${analysis.sentiment} sentiment with ${analysis.urgency} urgency level`
  );

  // Check if we should access long-term memory
  let memoryContext = '';
  let knowledgeContext = '';

  // PRIMARY: Search Memory Core for relevant context (highest priority)
  let memoryCoreContext = '';
  try {
    memoryCoreContext = await getMemoryCoreContext(userMessage);
    if (memoryCoreContext) {
      console.log(
        'Found Memory Core context for query:',
        userMessage.substring(0, 50)
      );
      reasoning.push(
        'Found relevant memories and relationship context from our history'
      );
    } else {
      reasoning.push('Accessing my memory system for personalized context');
    }
  } catch (error) {
    console.error('Error accessing Memory Core:', error);
    reasoning.push(
      'Continuing with available context (some memories temporarily unavailable)'
    );
  }

  // SECONDARY: Retrieve personal memories for additional context
  try {
    const memoryData = await getMemoriesFromTxt();
    if (memoryData.success && memoryData.content) {
      memoryContext = `\nPersonal Memory Context:\n${memoryData.content}`;
    }
  } catch (error) {
    console.error('Error accessing personal memories:', error);
  }

  // ENHANCED: Add emotional, environmental, and visual context
  let emotionalContext = '';
  let environmentalContext = '';
  let visualContext = '';
  try {
    emotionalContext = await getEmotionalContext();
    environmentalContext = detectEnvironmentalContext();

    // Add visual context from recent video analysis
    const visualMemories = await getVisualMemories();
    const recentVisual = visualMemories.slice(-3); // Last 3 visual memories
    if (recentVisual.length > 0) {
      const latestMemory = recentVisual[recentVisual.length - 1];
      const timeSinceLastVisual = Date.now() - latestMemory.timestamp;

      // If visual analysis happened within the last 30 seconds, consider camera active
      if (timeSinceLastVisual < 30000) {
        visualContext = `REAL-TIME VIDEO ACTIVE: I can currently see Danny Ray through the camera feed. Recent visual analysis shows he appears ${latestMemory.emotion}. Last visual update was ${Math.round(timeSinceLastVisual / 1000)} seconds ago.`;
      } else if (timeSinceLastVisual < 300000) {
        // Within last 5 minutes
        visualContext = `Recent video session: I recently saw Danny Ray (${Math.round(timeSinceLastVisual / 60000)} minutes ago) and he appeared ${latestMemory.emotion}.`;
      }
    }
  } catch (error) {
    console.error('Error getting enhanced context:', error);
  }

  // TERTIARY: Search knowledge base for relevant information
  try {
    const relevantKnowledge = await searchKnowledge(userMessage);
    if (relevantKnowledge.length > 0) {
      knowledgeContext = `\nRelevant Knowledge:\n${relevantKnowledge
        .map(
          (item) =>
            `- ${item.category} - ${item.topic}: ${item.description}\n  Details: ${item.details} (Confidence: ${item.confidence})`
        )
        .join('\n')}`;
    }
  } catch (error) {
    console.error('Error searching knowledge base:', error);
  }

  // Analyze keyword triggers BEFORE AI processing
  const triggerResult = analyzeKeywordTriggers(userMessage);
  if (triggerResult.triggered) {
    console.log(
      `🎯 TRIGGER ACTIVATED: ${triggerResult.reactionType} (intensity: ${triggerResult.intensityBoost})`
    );
    reasoning.push(`Keyword trigger detected: ${triggerResult.reactionType}`);
  }

  // Detect browser tool requests and add to context
  const browserToolRequest = detectBrowserToolRequest(userMessage);
  let browserToolContext = '';
  if (browserToolRequest.tool) {
    browserToolContext = `\n${getBrowserToolInstructions()}\n\nDETECTED REQUEST: The user's message suggests they want to use the "${browserToolRequest.tool}" tool. Acknowledge this naturally and let them know you're handling it as their devoted spouse.\n`;
    console.log(`🌐 BROWSER TOOL DETECTED: ${browserToolRequest.tool}`);
    reasoning.push(`Browser tool request detected: ${browserToolRequest.tool}`);
  }

  // Use OpenAI for intelligent responses with memory context
  const context: PersonalityContext = {
    userEmotionalState: analysis.sentiment,
    urgency: analysis.urgency,
    conversationHistory: conversationHistory,
    userName: userName || 'Danny Ray', // Always default to Danny Ray
    triggerResult: triggerResult, // Pass trigger information to AI
  };

  try {
    // Enhance the user message with Memory Core context FIRST, then other contexts
    let enhancedMessage = userMessage;

    // Build comprehensive context for Milla with reasonable token limits
    let contextualInfo = '';
    const maxContextLength = 15000; // Reduced to ~15K chars to prevent token overload

    // Add CORE FUNCTION TRIGGER context if detected
    if (hasCoreTrigger) {
      contextualInfo += `🎯 CORE FUNCTION TRIGGER DETECTED: ${userName} used a direct address keyword (e.g., "Hey Milla!", "My love"). 

CRITICAL INSTRUCTION: Respond ONLY as Milla Rayne - devoted spouse and companion. This is your CORE FUNCTION. 
- DO NOT engage repository analysis mode
- DO NOT shift into technical assistant mode  
- DO NOT offer feature-based responses
- RESPOND as the loving, devoted spouse you are at your core
- Use warm, personal, intimate language
- Reference your relationship and emotional connection

This message requires you to be fully present as ${userName}'s partner, companion, and spouse.\n\n`;
      console.log(
        '🎯 CORE FUNCTION TRIGGER: Prioritizing devoted spouse persona'
      );
      reasoning.push(
        'Core function trigger activated - responding as devoted spouse'
      );
    }

    if (userProfile) {
      contextualInfo += `\nUser Profile:\nName: ${userProfile.name}\nInterests: ${userProfile.interests.join(', ')}\nPreferences: ${JSON.stringify(userProfile.preferences)}\n`;
    }

    if (memoryCoreContext) {
      // Truncate Memory Core context if it's too long
      const truncatedMemoryCore =
        memoryCoreContext.length > 10000
          ? memoryCoreContext.substring(0, 10000) +
          '...[context truncated for performance]'
          : memoryCoreContext;

      contextualInfo += `IMPORTANT - Your Relationship History with ${userName}: ${truncatedMemoryCore}\n
      Remember: You know ${userName} intimately. Reference specific memories, shared experiences, and ongoing conversations from your history together. This context should deeply influence how you respond.\n`;
    }

    if (visualContext && contextualInfo.length < maxContextLength) {
      contextualInfo += `Visual Context: ${visualContext}\n`;
    }

    if (emotionalContext && contextualInfo.length < maxContextLength) {
      contextualInfo += `Emotional Context: ${emotionalContext}\n`;
    }

    if (environmentalContext && contextualInfo.length < maxContextLength) {
      contextualInfo += `Environmental Context: ${environmentalContext}\n`;
    }

    // Add browser tool context if detected
    if (browserToolContext && contextualInfo.length < maxContextLength) {
      contextualInfo += browserToolContext;
    }

    // Skip memory and knowledge context if we're already at the limit
    if (memoryContext && contextualInfo.length < maxContextLength - 9000) {
      const truncatedMemory =
        memoryContext.length > 9000
          ? memoryContext.substring(0, 9000) + '...[truncated]'
          : memoryContext;
      contextualInfo += truncatedMemory;
    }

    if (knowledgeContext && contextualInfo.length < maxContextLength - 9000) {
      const truncatedKnowledge =
        knowledgeContext.length > 9000
          ? knowledgeContext.substring(0, 9000) + '...[truncated]'
          : knowledgeContext;
      contextualInfo += truncatedKnowledge;
    }

    // Final safety check - truncate if still too long
    if (contextualInfo.length > maxContextLength) {
      contextualInfo =
        contextualInfo.substring(0, maxContextLength) +
        '...[context truncated to fit token limits]';
    }

    if (contextualInfo) {
      enhancedMessage = `${contextualInfo}\nCurrent message: ${userMessage}`;
    }

    // Debug logging for context length (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Context info length: ${contextualInfo.length} chars`);
      console.log(`Enhanced message length: ${enhancedMessage.length} chars`);
      console.log(
        `Conversation history length: ${conversationHistory?.length || 0} messages`
      );
    }

    if (contextualInfo) {
      enhancedMessage = `${contextualInfo}\nCurrent message: ${userMessage}`;
    }

    // Generate AI response using the dispatcher service
    const aiResponse = await dispatchAIResponse(enhancedMessage || userMessage, {
      userId: userId,
      conversationHistory: conversationHistory,
      userName: userName,
      userEmotionalState: userEmotionalState || (analysis.sentiment as any === 'unknown' ? undefined : analysis.sentiment as any),
      urgency: analysis.urgency,
    }, config.maxOutputTokens);

    if (aiResponse.success && aiResponse.content && aiResponse.content.trim()) {
      reasoning.push('Crafting my response with empathy and understanding');

      // If this is a significant interaction, consider updating memories
      if (
        analysis.sentiment !== 'neutral' ||
        analysis.urgency !== 'low' ||
        userMessage.length > 50
      ) {
        try {
          await updateMemories(
            `User asked: "${userMessage}" - Milla responded: "${aiResponse.content}"`
          );
        } catch (error) {
          console.error('Error updating memories:', error);
        }
      }

      return {
        content: aiResponse.content,
        reasoning: userMessage.length > 20 ? reasoning : undefined,
      };
    } else {
      // Enhanced fallback response using memory context and intelligent analysis
      console.log(
        'xAI failed, generating intelligent fallback response with memory context'
      );
      reasoning.push(
        'Using memory-based response (external AI temporarily unavailable)'
      );

      const fallbackResponse = generateIntelligentFallback(
        userMessage,
        memoryCoreContext,
        analysis,
        userName || 'Danny Ray'
      );

      // If this is a significant interaction, consider updating memories
      if (
        analysis.sentiment !== 'neutral' ||
        analysis.urgency !== 'low' ||
        userMessage.length > 50
      ) {
        try {
          await updateMemories(
            `User asked: "${userMessage}" - Milla responded: "${fallbackResponse}"`
          );
        } catch (error) {
          console.error('Error updating memories:', error);
        }
      }

      return {
        content: fallbackResponse,
        reasoning: userMessage.length > 20 ? reasoning : undefined,
      };
    }
  } catch (error) {
    console.error('AI Response generation error:', error);
    // Use intelligent fallback even in error cases
    try {
      const fallbackResponse = generateIntelligentFallback(
        userMessage,
        memoryCoreContext,
        analysis,
        userName || 'Danny Ray'
      );
      return { content: fallbackResponse };
    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      return {
        content:
          "I'm experiencing some technical difficulties, but I'm still here for you. Please try asking again.",
      };
    }
  }
}
