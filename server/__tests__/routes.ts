import type { Express } from 'express';
import express from 'express';
import { createServer, type Server } from 'http';
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
import {
  analyzeYouTubeVideo,
  isValidYouTubeUrl,
  searchVideoMemories,
} from './youtubeAnalysisService';
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

// Track current scene location per session (simple in-memory for now)
let currentSceneLocation: SceneLocation = 'living_room';
let currentSceneMood: string = 'calm';
let currentSceneUpdatedAt: number = Date.now();

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize enhancement task system
  const { initializeEnhancementTaskSystem } = await import(
    './enhancementService'
  );
  await initializeEnhancementTaskSystem();

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
  app.get('/api/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50; // Default to last 50 messages
      const allMessages = await storage.getMessages();
      // Return only the most recent messages (last N messages)
      const recentMessages = allMessages.slice(-limit);
      res.json(recentMessages);
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

  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
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
      console.log(
        `Chat API: Processing message from client (${message.substring(0, 50)}...)`
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

      // Generate AI response using existing logic with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Response generation timeout')),
          30000
        )
      );

      const aiResponsePromise = generateAIResponse(message, [], 'Danny Ray');
      const aiResponse = (await Promise.race([
        aiResponsePromise,
        timeoutPromise,
      ])) as { content: string; reasoning?: string[] };

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

      res.json({
        response: aiResponse.content,
        ...(aiResponse.reasoning && { reasoning: aiResponse.reasoning }),
        sceneContext: {
          location: sceneContext.location,
          mood: sceneContext.mood,
          timeOfDay: sceneContext.timeOfDay,
        },
      });
    } catch (error) {
      console.error('Chat API error:', error);

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
            imageData
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

  // REMOVED - Personal Task Management endpoints (user rarely used them)
  // app.get("/api/personal-tasks", async (req, res) => { ... });
  // app.get("/api/task-summary", async (req, res) => { ... });
  // app.post("/api/personal-tasks/:taskId/start", async (req, res) => { ... });
  // app.post("/api/personal-tasks/:taskId/complete", async (req, res) => { ... });
  // app.post("/api/generate-tasks", async (req, res) => { ... });

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
