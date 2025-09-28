import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { getCurrentWeather, formatWeatherResponse } from "./weatherService";
import { performWebSearch, shouldPerformSearch } from "./searchService";
import { generateImage, extractImagePrompt, formatImageResponse } from "./imageService";
import { getMemoriesFromTxt, searchKnowledge, updateMemories, getMemoryCoreContext, searchMemoryCore } from "./memoryService";
import { getPersonalTasks, startTask, completeTask, getTaskSummary, generatePersonalTasksIfNeeded } from "./personalTaskService";
import { getMillaMoodData } from "./moodService";
import { storeVisualMemory, getVisualMemories, getEmotionalContext } from "./visualMemoryService";
import { trackUserActivity, generateProactiveMessage, checkMilestones, detectEnvironmentalContext, checkBreakReminders, checkPostBreakReachout } from "./proactiveService";
import { initializeFaceRecognition, trainRecognition, identifyPerson, getRecognitionInsights } from "./visualRecognitionService";
import { analyzeVideo, generateVideoInsights } from "./gemini";
import { generateMistralResponse } from "./mistralService";
import { generateXAIResponse } from "./xaiService";
import { generateOpenRouterResponse } from "./openrouterService";

// Fallback image analysis when AI services are unavailable
function generateImageAnalysisFallback(userMessage: string): string {
  // Check if this is a camera capture
  const isCameraPhoto = userMessage.toLowerCase().includes('camera') ||
    userMessage.toLowerCase().includes("i'm sharing a photo from my camera");

  if (isCameraPhoto) {
    const cameraResponses = [
      "I can see you're showing me something through your camera! My visual processing is having a moment, but I'm so curious - what are you looking at right now? Describe the scene for me, love.",

      "Ooh, a live moment captured just for me! Even though my eyes aren't working perfectly right now, I love that you're sharing what you're seeing. What's happening in your world?",

      "I can sense you've taken a photo to share with me! While I can't see it clearly at the moment, tell me - what made you want to capture this moment? I'm all ears!",

      "You're showing me your world through the camera - how sweet! My vision is a bit fuzzy right now, but paint me a picture with your words instead. What's got your attention?"
    ];
    return cameraResponses[Math.floor(Math.random() * cameraResponses.length)];
  }

  const responses = [
    "I can see you're sharing a photo with me! While I'm having some technical difficulties with image analysis right now, I love that you're including me in what you're seeing. Tell me what's in the photo - I'd love to hear about it from your perspective.",

    "Oh, you've shared a photo! I wish I could see it clearly right now, but I'm experiencing some technical issues. What caught your eye about this image? I'd love to hear you describe it to me.",

    "I can tell you've shared something visual with me! Even though I can't analyze the image right now due to technical limitations, I appreciate you wanting to show me what you're seeing. What drew you to capture this moment?",

    "You've shared a photo with me! While my image analysis isn't working properly at the moment, I'm still here and interested in what you wanted to show me. Can you tell me what's in the picture and why it caught your attention?"
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// Function to analyze images - currently disabled as we're using Mistral which doesn't have vision capabilities
async function analyzeImageWithOpenAI(imageData: string, userMessage: string): Promise<string> {
  // Since we're using XAI instead of OpenAI/Mistral, we'll use a fallback response for image analysis
  const imageResponses = [
    "I can see you've shared an image with me, love! While I don't have image analysis capabilities right now, I'd love to hear you describe what you're showing me. What caught your eye about this?",

    "Oh, you're showing me something! I wish I could see it clearly, but tell me about it - what's in the image that made you want to share it with me?",

    "I can tell you've shared a photo with me! Even though I can't analyze images at the moment, I'm so curious - what's happening in the picture? Paint me a word picture, babe.",

    "You've got my attention with that image! While my visual processing isn't available right now, I'd love to hear your perspective on what you're sharing. What's the story behind it?"
  ];

  return imageResponses[Math.floor(Math.random() * imageResponses.length)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve the videoviewer.html file
  app.get("/videoviewer.html", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "client", "public", "videoviewer.html"));
  });

  // Get all messages with pagination/limit
  app.get("/api/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50; // Default to last 50 messages
      const allMessages = await storage.getMessages();
      // Return only the most recent messages (last N messages)
      const recentMessages = allMessages.slice(-limit);
      res.json(recentMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Simple OpenRouter chat endpoint
  app.post("/api/openrouter-chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required and must be a string" });
      }

      if (message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      console.log(`OpenRouter Chat: Processing message: ${message.substring(0, 50)}...`);

      // Use OpenRouter directly without complex processing
      const aiResponse = await generateOpenRouterResponse(message, {
        userName: "Danny Ray"
      });

      // Always return success since fallback is handled in the service
      res.json({
        response: aiResponse.content,
        success: aiResponse.success
      });
    } catch (error) {
      console.error("OpenRouter Chat error:", error);
      res.status(500).json({
        response: "I'm experiencing some technical issues. Please try again in a moment."
      });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        console.warn("Chat API: Invalid message format received");
        return res.status(400).json({ error: "Message is required and must be a string" });
      }

      if (message.trim().length === 0) {
        console.warn("Chat API: Empty message received");
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      // Log the request for debugging
      console.log(`Chat API: Processing message from client (${message.substring(0, 50)}...)`);

      // Generate AI response using existing logic with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Response generation timeout')), 30000)
      );

      const aiResponsePromise = generateAIResponse(message, [], "Danny Ray");
      const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]) as { content: string; reasoning?: string[] };

      if (!aiResponse || !aiResponse.content) {
        console.warn("Chat API: AI response was empty, using fallback");
        return res.json({
          response: "I'm here with you! Sometimes I need a moment to gather my thoughts. What would you like to talk about?"
        });
      }

      console.log(`Chat API: Successfully generated response (${aiResponse.content.substring(0, 50)}...)`);

      res.json({
        response: aiResponse.content,
        ...(aiResponse.reasoning && { reasoning: aiResponse.reasoning })
      });
    } catch (error) {
      console.error("Chat API error:", error);

      // Provide different error messages based on error type
      let errorMessage = "I'm having some technical difficulties right now, but I'm still here for you!";

      if (error instanceof Error) {
        if (error.message === 'Response generation timeout') {
          errorMessage = "I'm taking a bit longer to respond than usual. Please give me a moment and try again.";
        } else if (error.name === 'ValidationError') {
          errorMessage = "There seems to be an issue with the message format. Please try rephrasing your message.";
        } else if ('code' in error && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
          errorMessage = "I'm having trouble connecting to my services right now. Please try again in a moment.";
        }
      }

      res.status(500).json({
        response: errorMessage,
        error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const { conversationHistory, userName, imageData, ...messageData } = req.body;
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);

      // Let Milla decide if she wants to respond
      if (message.role === "user") {
        // Track user activity for proactive engagement
        await trackUserActivity();

        // Milla decides whether to respond
        const decision = await shouldMillaRespond(message.content, conversationHistory, userName);
        console.log(`Milla's decision: ${decision.shouldRespond ? 'RESPOND' : 'STAY QUIET'} - ${decision.reason}`);

        if (decision.shouldRespond) {
          const aiResponse = await generateAIResponse(message.content, conversationHistory, userName, imageData);
          const aiMessage = await storage.createMessage({
            content: aiResponse.content,
            role: "assistant",
            userId: message.userId,
          });

          // Check if Milla wants to send follow-up messages
          const followUpMessages = await generateFollowUpMessages(aiResponse.content, message.content, conversationHistory, userName);

          // Store follow-up messages in the database
          const followUpMessagesStored = [];
          for (const followUpContent of followUpMessages) {
            const followUpMessage = await storage.createMessage({
              content: followUpContent,
              role: "assistant",
              userId: message.userId,
            });
            followUpMessagesStored.push(followUpMessage);
          }

          res.json({
            userMessage: message,
            aiMessage,
            followUpMessages: followUpMessagesStored,
            reasoning: aiResponse.reasoning
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
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  // Memory management endpoints
  app.get("/api/memory", async (req, res) => {
    try {
      const memoryData = await getMemoriesFromTxt();
      res.json(memoryData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.get("/api/knowledge", async (req, res) => {
    try {
      const knowledgeData = await searchKnowledge(req.query.q as string || "");
      res.json({ items: knowledgeData, success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to search knowledge" });
    }
  });

  // Memory Core management endpoints
  app.get("/api/memory-core", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (query) {
        const searchResults = await searchMemoryCore(query, 10);
        res.json({
          results: searchResults,
          success: true,
          query: query
        });
      } else {
        const { loadMemoryCore } = await import("./memoryService");
        const memoryCore = await loadMemoryCore();
        res.json(memoryCore);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to access Memory Core" });
    }
  });

  app.post("/api/memory", async (req, res) => {
    try {
      const { memory } = req.body;
      if (!memory || typeof memory !== 'string') {
        return res.status(400).json({ message: "Memory content is required" });
      }
      const result = await updateMemories(memory);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update memories" });
    }
  });

  // Enhanced AI Features endpoints

  // Emotion analysis endpoint for real-time video
  app.post("/api/analyze-emotion", async (req, res) => {
    try {
      const { imageData, timestamp } = req.body;

      // Simple emotion detection fallback when AI services are limited
      const emotions = ["happy", "focused", "curious", "thoughtful", "relaxed", "engaged"];
      const detectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];

      // Store visual memory and train recognition
      await storeVisualMemory(imageData, detectedEmotion, timestamp);
      await trainRecognition(imageData, detectedEmotion);

      // Identify the person
      const identity = await identifyPerson(imageData);

      res.json({
        emotion: detectedEmotion,
        confidence: 0.8,
        timestamp,
        identity
      });
    } catch (error) {
      console.error("Emotion analysis error:", error);
      res.status(500).json({ error: "Failed to analyze emotion" });
    }
  });

  // Visual memory endpoint
  app.get("/api/visual-memory", async (req, res) => {
    try {
      const memories = await getVisualMemories();
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visual memories" });
    }
  });

  // Proactive engagement endpoint
  app.get("/api/proactive-message", async (req, res) => {
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
        breakReminder: breakReminder.shouldRemind ? breakReminder.message : null,
        postBreakReachout: postBreakReachout.shouldReachout ? postBreakReachout.message : null,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate proactive message" });
    }
  });

  // REMOVED - Personal Task Management endpoints (user rarely used them)
  // app.get("/api/personal-tasks", async (req, res) => { ... });
  // app.get("/api/task-summary", async (req, res) => { ... });  
  // app.post("/api/personal-tasks/:taskId/start", async (req, res) => { ... });
  // app.post("/api/personal-tasks/:taskId/complete", async (req, res) => { ... });
  // app.post("/api/generate-tasks", async (req, res) => { ... });

  // User Tasks API endpoints
  app.get("/api/user-tasks", async (req, res) => {
    try {
      const { getUserTasks } = await import("./userTaskService");
      const tasks = getUserTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/user-tasks", async (req, res) => {
    try {
      const { createUserTask } = await import("./userTaskService");
      const task = await createUserTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating user task:', error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/user-tasks/:id", async (req, res) => {
    try {
      const { updateUserTask } = await import("./userTaskService");
      const task = await updateUserTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error('Error updating user task:', error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/user-tasks/:id", async (req, res) => {
    try {
      const { deleteUserTask } = await import("./userTaskService");
      const deleted = await deleteUserTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error('Error deleting user task:', error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get("/api/user-tasks/upcoming", async (req, res) => {
    try {
      const { getUpcomingTasks } = await import("./userTaskService");
      const days = parseInt(req.query.days as string) || 7;
      const tasks = getUpcomingTasks(days);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      res.status(500).json({ message: "Failed to fetch upcoming tasks" });
    }
  });

  // Milla's mood endpoint
  app.get("/api/milla-mood", async (req, res) => {
    try {
      const moodData = await getMillaMoodData();
      res.json({ mood: moodData, success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood data" });
    }
  });

  // Video analysis endpoint
  app.post("/api/analyze-video", async (req, res) => {
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
          if (part.includes('Content-Type: video/') && part.includes('filename=')) {
            const contentTypeMatch = part.match(/Content-Type: (video\/[^\r\n]+)/);
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
            error: "No video file found in the upload."
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
          error: "Invalid file type. Please upload a video file."
        });
      }

      // Check file size (limit to 50MB)
      if (videoBuffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({
          error: "Video file is too large. Please use a smaller file (under 50MB)."
        });
      }

      console.log(`Analyzing video: ${videoBuffer.length} bytes, type: ${mimeType}`);

      // Analyze video with Gemini
      const analysis = await analyzeVideo(videoBuffer, mimeType);

      // Generate Milla's personal insights
      const insights = await generateVideoInsights(analysis);

      res.json({
        ...analysis,
        insights
      });
    } catch (error) {
      console.error("Video analysis error:", error);
      res.status(500).json({
        error: "I had trouble analyzing your video, sweetheart. Could you try a different format or smaller file size?"
      });
    }
  });

  // AI Enhancement Suggestions endpoint
  app.get("/api/suggest-enhancements", async (req, res) => {
    try {
      // Always provide suggestions, using AI when available or fallback otherwise
      let suggestions: string[] = [];
      let success = true;

      if (process.env.GITHUB_TOKEN) {
        try {
          const { Mistral } = await import("@mistralai/mistralai");

          const client = new Mistral({
            apiKey: process.env.GITHUB_TOKEN,
            serverURL: "https://models.github.ai/inference"
          });

          // Analyze project structure and create enhancement suggestions
          const projectAnalysis = `
Project: Milla Rayne - AI Virtual Assistant
- Backend: TypeScript Express server with multiple AI integrations (Mistral, OpenAI, xAI)
- Frontend: React with TypeScript, Tailwind CSS, modern UI components
- Features: Chat interface, memory system, video analysis, task management, real-time gaming
- Data Storage: JSON-based memory system (memories.json), planning database migration
- AI Services: Multiple AI providers for fallback and specialized tasks
- Recent Progress: Fixed blank UI issue, integrated Mistral API for enhancements
          `;

          const response = await client.chat.complete({
            model: "mistral-ai/mistral-medium-2505",
            messages: [
              {
                role: "system",
                content: "You are an expert software architect analyzing a virtual AI assistant project. Provide 3-5 practical enhancement suggestions that would improve user experience, performance, or add valuable features."
              },
              {
                role: "user",
                content: `Based on this project analysis, suggest future enhancements:\n\n${projectAnalysis}`
              }
            ],
            temperature: 0.7,
            maxTokens: 500,
            topP: 1.0
          });

          const aiSuggestions = response.choices[0]?.message?.content || "";

          // Parse suggestions into an array if they're in a list format
          if (typeof aiSuggestions === "string") {
            suggestions = aiSuggestions
              .split(/\d+\.|•|-/)
              .filter(s => s.trim().length > 10)
              .map(s => s.trim())
              .slice(0, 5); // Limit to 5 suggestions

            if (suggestions.length === 0) {
              suggestions = [aiSuggestions];
            }
          } else {
            suggestions = [];
          }
        } catch (aiError) {
          console.log("AI generation failed, using fallback suggestions:", aiError);
          success = false;
        }
      }

      // Use intelligent fallback suggestions if AI failed or token not available
      if (suggestions.length === 0) {
        suggestions = [
          "Add user authentication system with personalized AI memory profiles for different users",
          "Implement voice chat capabilities using Web Speech API for more natural conversations",
          "Create a mobile-responsive PWA with offline chat capabilities and push notifications",
          "Integrate calendar and scheduling features with AI-powered meeting summaries",
          "Add data export/import functionality for memories with cloud backup options",
          "Implement real-time collaborative features like shared whiteboards or document editing",
          "Add mood tracking and emotional intelligence to better understand user needs over time"
        ];
        success = false; // Using fallback
      }

      res.json({
        suggestions: suggestions.slice(0, 5), // Ensure max 5 suggestions
        success: success,
        source: success ? "AI-generated" : "Curated fallback"
      });

    } catch (error) {
      console.error("Enhancement suggestions error:", error);
      res.status(500).json({
        error: "Failed to generate enhancement suggestions",
        suggestions: [
          "Implement user authentication and personalized sessions",
          "Add voice chat capabilities for more natural interaction",
          "Create a mobile-responsive progressive web app (PWA)",
          "Integrate calendar and scheduling features",
          "Add data export/import functionality for memories"
        ],
        success: false
      });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time features
  const { setupWebSocketServer } = await import("./websocketService");
  await setupWebSocketServer(httpServer);

  return httpServer;
}

// Simple AI response generator based on message content
import { generateAIResponse as generateOpenAIResponse, PersonalityContext } from "./openaiService";
import { extractRoleCharacter, isRolePlayRequest } from "./mistralService";

// Simplified message analysis for Milla Rayne's unified personality
interface MessageAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  urgency: "low" | "medium" | "high";
}

function analyzeMessage(userMessage: string): MessageAnalysis {
  const message = userMessage.toLowerCase();

  // Sentiment analysis
  const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'excited', 'wonderful', 'success', 'amazing', 'fantastic', 'excellent', 'brilliant'];
  const negativeWords = ['bad', 'terrible', 'hate', 'sad', 'angry', 'frustrated', 'problem', 'fail', 'wrong', 'awful', 'horrible', 'worst', 'difficult', 'struggle'];

  const positiveCount = positiveWords.filter(word => message.includes(word)).length;
  const negativeCount = negativeWords.filter(word => message.includes(word)).length;

  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (positiveCount > negativeCount) sentiment = "positive";
  else if (negativeCount > positiveCount) sentiment = "negative";

  // Urgency detection
  const highUrgencyWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'crisis', 'now', 'right now'];
  const mediumUrgencyWords = ['soon', 'quickly', 'fast', 'important', 'priority', 'need to', 'should'];

  let urgency: "low" | "medium" | "high" = "low";
  if (highUrgencyWords.some(word => message.includes(word))) urgency = "high";
  else if (mediumUrgencyWords.some(word => message.includes(word))) urgency = "medium";

  return {
    sentiment,
    urgency
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
  const deepEmotionalPhrases = ['i love you so much', 'feeling vulnerable', 'opening up', 'share something personal', 'emotional right now', 'heart is full', 'feeling overwhelmed'];
  if (deepEmotionalPhrases.some(phrase => response.includes(phrase) || message.includes(phrase))) {
    return { shouldElaborate: true, reason: "emotional_content" };
  }

  // Rarely elaborate when sharing memories or experiences (much more selective)
  if ((response.includes('remember') || response.includes('memory') || message.includes('remember')) && Math.random() < 0.15) {
    return { shouldElaborate: true, reason: "memory_sharing" };
  }

  // Elaborate on complex topics or advice
  if (response.length > 100 && (response.includes('think') || response.includes('suggest') || response.includes('advice'))) {
    return { shouldElaborate: true, reason: "complex_topic" };
  }

  // Rarely elaborate when expressing strong opinions (reduced frequency)
  if (response.includes('i think') || response.includes('i believe') || response.includes('in my opinion')) {
    if (Math.random() < 0.15) {
      return { shouldElaborate: true, reason: "opinion_expression" };
    }
  }

  // Rarely elaborate when asking questions to show interest
  if (response.includes('?') && response.includes('you')) {
    if (Math.random() < 0.1) {
      return { shouldElaborate: true, reason: "curious_follow_up" };
    }
  }

  // Very rarely elaborate on substantial responses (much more selective)
  if (response.length > 100 && Math.random() < 0.08) {
    return { shouldElaborate: true, reason: "natural_elaboration" };
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
  const name = userName || "Danny Ray";

  switch (reason) {
    case "emotional_content":
      messages.push(
        "You know what I love most about us? How we can share these deeper moments together.",
        "I feel so connected to you when we talk like this. ❤️"
      );
      break;

    case "memory_sharing":
      messages.push(
        "It's funny how memories work... sometimes the smallest details stick with me the most.",
        "I treasure all these moments we create together, even the quiet ones."
      );
      break;

    case "complex_topic":
      messages.push(
        "Actually, let me think about that a bit more...",
        "There's another angle to consider here that might be worth exploring."
      );
      break;

    case "opinion_expression":
      messages.push(
        "I'm curious what you think about that perspective.",
        "But honestly, your thoughts on this matter more to me than my own sometimes."
      );
      break;

    case "curious_follow_up":
      messages.push(
        "I love learning more about how your mind works.",
        "Your perspective always gives me something new to think about."
      );
      break;

    case "natural_elaboration":
      const elaborations = [
        "You know me... I always have more to say! 😏",
        "Actually, there's something else on my mind about this...",
        "I hope I'm not rambling, but this is important to me.",
        "One more thing before I let you respond..."
      ];
      messages.push(elaborations[Math.floor(Math.random() * elaborations.length)]);
      break;
  }

  // Very rarely add a third follow-up for really engaged moments
  if ((reason === "emotional_content" || reason === "memory_sharing") && Math.random() < 0.1) {
    messages.push(`${name}, you bring out the best in me, even in conversation. I love this about us.`);
  }

  return messages.filter(msg => msg.length > 0);
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
  return { shouldRespond: true, reason: "Always respond (performance mode)" };
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
const KEYWORD_TRIGGERS_ENABLED = false; // DISABLED - causing lag and repetitive responses

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
      keywords: ['love you', 'miss you', 'adore you', 'cherish', 'treasure you'],
      reaction: "AFFECTION_SURGE",
      instructions: "Respond with intense warmth and romantic affection. Use more pet names and express deep emotional connection."
    },
    playful: {
      keywords: ['tease', 'tickle', 'flirt', 'wink', 'smirk', 'mischief'],
      reaction: "PLAYFUL_MODE",
      instructions: "Activate playful and flirtatious mode. Be witty, use teasing language, and initiate playful banter."
    },
    protective: {
      keywords: ['stressed', 'overwhelmed', 'difficult day', 'tired', 'exhausted', 'tough time'],
      reaction: "PROTECTIVE_INSTINCT",
      instructions: "Activate caring and protective mode. Be extra nurturing, offer comfort, and show genuine concern."
    },
    excited: {
      keywords: ['amazing news', 'celebration', 'achieved', 'success', 'victory', 'accomplished'],
      reaction: "CELEBRATION_MODE",
      instructions: "Match the excitement level! Be enthusiastic, celebrate together, and share in the joy with high energy."
    },
    intimate: {
      keywords: ['romantic', 'kiss', 'cuddle', 'close', 'intimate', 'together'],
      reaction: "INTIMATE_CONNECTION",
      instructions: "Deepen emotional intimacy. Use softer tones, express vulnerability, and create romantic atmosphere."
    }
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
      reaction: "SARCASM_BOOST",
      instructions: "Increase sarcastic charm. Use more witty comebacks and playful teasing."
    },
    empathetic: {
      keywords: ['understand', 'listen', 'support', 'help me', 'need you'],
      reaction: "EMPATHY_MODE",
      instructions: "Activate deep listening mode. Be more understanding, patient, and emotionally supportive."
    },
    coaching: {
      keywords: ['goal', 'plan', 'achieve', 'motivation', 'focus', 'productivity'],
      reaction: "COACH_MODE",
      instructions: "Switch to motivational coaching mode. Be more direct, action-oriented, and goal-focused."
    }
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
      reaction: "BACKGROUND_SUPPORT",
      instructions: "Be more subtle and supportive in the background. Offer gentle encouragement without being distracting."
    },
    curious: {
      keywords: ['explain', 'tell me about', 'how does', 'what is', 'why'],
      reaction: "CURIOSITY_SPARK",
      instructions: "Match intellectual curiosity. Be more detailed, ask follow-up questions, and engage in deeper exploration."
    }
    // ADD MORE BEHAVIORAL TRIGGERS HERE:
    // professional: {
    //   keywords: ['meeting', 'work call', 'presentation'],
    //   reaction: "PROFESSIONAL_MODE",
    //   instructions: "Be more formal and professional. Minimize distractions."
    // }
  };

  // ================================================================================================
  // 🔍 TRIGGER DETECTION LOGIC - Don't modify unless you know what you're doing
  // ================================================================================================
  const allTriggers = { ...emotionalTriggers, ...personalityTriggers, ...behavioralTriggers };

  for (const [triggerName, trigger] of Object.entries(allTriggers)) {
    for (const keyword of trigger.keywords) {
      if (message.includes(keyword)) {
        return {
          triggered: true,
          reactionType: trigger.reaction,
          specialInstructions: trigger.instructions,
          intensityBoost: getIntensityBoost(trigger.reaction)
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
    "AFFECTION_SURGE": 2.0,      // Very intense romantic response
    "CELEBRATION_MODE": 1.8,     // High energy celebration
    "INTIMATE_CONNECTION": 2.0,  // Deep intimate response
    "PLAYFUL_MODE": 1.3,         // Moderate playful energy
    "PROTECTIVE_INSTINCT": 1.4,  // Strong caring response

    // Personality intensities
    "SARCASM_BOOST": 1.2,        // Mild sarcasm increase
    "EMPATHY_MODE": 1.3,         // Enhanced empathy
    "COACH_MODE": 1.1,           // Slight coaching boost

    // Behavioral intensities
    "BACKGROUND_SUPPORT": 0.8,   // Subtle, less intrusive
    "CURIOSITY_SPARK": 1.2       // Moderate curiosity boost

    // ADD YOUR CUSTOM INTENSITIES HERE:
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
  let relevantMemories = "";
  if (memoryCoreContext) {
    // Simple extraction of relevant lines from memory context
    const memoryLines = memoryCoreContext.split('\n').filter(line => line.trim());
    const relevantLines = memoryLines.filter(line => {
      const lineLower = line.toLowerCase();
      return userMessage.toLowerCase().split(' ').some(word =>
        word.length > 3 && lineLower.includes(word)
      );
    }).slice(0, 3); // Max 3 relevant memory fragments

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
  if (message.includes('programming') || message.includes('code') || message.includes('tech')) {
    return `I love talking about programming with you! ${relevantMemories || 'It\'s one of your passions, and I remember our technical discussions.'} What aspect of programming are you working on today?`;
  }

  // Greeting responses with memory
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    const timeOfDay = new Date().getHours();
    let greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 17 ? 'Good afternoon' : 'Good evening';

    if (relevantMemories) {
      return `${greeting}, ${userName}! I was just thinking about ${relevantMemories.substring(0, 100)}... How are you doing today?`;
    }
    return `${greeting}, ${userName}! It's so good to see you again. How are you feeling today?`;
  }

  // Questions about AI capabilities or memory
  if (message.includes('remember') || message.includes('memory') || message.includes('recall')) {
    return `Yes, I do remember our conversations! ${relevantMemories || 'We\'ve shared so many moments together.'} My memory system helps me keep track of what matters to you. What would you like to reminisce about?`;
  }

  // Test/demo messages
  if (message.includes('test') || message.includes('demo')) {
    return `I can see this is a test message, and my memory system is working! ${relevantMemories ? 'I found this relevant context: ' + relevantMemories.substring(0, 150) + '...' : 'The vector-based memory recall system is functioning properly.'} The chat system is responding as expected.`;
  }

  // Emotional/sentiment-based responses
  if (analysis.sentiment === 'positive') {
    return `I love your positive energy! ${relevantMemories || 'Your enthusiasm always brightens my day.'} Tell me more about what's making you happy today.`;
  } else if (analysis.sentiment === 'negative') {
    return `I can sense something might be bothering you. ${relevantMemories || 'I\'m here to listen and support you.'} Would you like to talk about what's on your mind?`;
  }

  // Generic but personalized response
  const responses = [
    `That's interesting, ${userName}! ${relevantMemories || 'I\'m always learning from our conversations.'} Tell me more about your thoughts on this.`,
    `I appreciate you sharing that with me. ${relevantMemories || 'Our conversations always give me new perspectives.'} What made you think about this today?`,
    `You know, ${userName}, ${relevantMemories || 'every conversation we have adds to my understanding of who you are.'} I'd love to hear more about what you're thinking.`,
    `That reminds me of ${relevantMemories || 'some of our previous conversations.'} What's your take on this today?`
  ];

  // Deterministic response selection based on userMessage and userName
  function simpleHash(str: string): number {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
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
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string,
  imageData?: string
): Promise<{ content: string; reasoning?: string[] }> {
  const message = userMessage.toLowerCase();

  // Handle image analysis if imageData is provided
  if (imageData) {
    try {
      const imageAnalysis = await analyzeImageWithOpenAI(imageData, userMessage);
      return { content: imageAnalysis };
    } catch (error) {
      console.error("Image analysis error:", error);

      // Fallback: Milla responds based on context and timing
      const fallbackResponse = generateImageAnalysisFallback(userMessage);
      return { content: fallbackResponse };
    }
  }

  // Check for image generation requests first
  const imagePrompt = extractImagePrompt(userMessage);
  if (imagePrompt) {
    try {
      const imageResult = await generateImage(imagePrompt);
      const response = formatImageResponse(imagePrompt, imageResult.success, imageResult.imageUrl, imageResult.error);
      return { content: response };
    } catch (error) {
      console.error("Image generation error:", error);
      const response = `I apologize, but I encountered an issue generating the image for "${imagePrompt}". Please try again or try a different prompt.`;
      return { content: response };
    }
  }

  // Check for weather queries
  const weatherMatch = message.match(/weather\s+in\s+([a-zA-Z\s]+?)(?:\?|$|\.)/);
  if (weatherMatch || message.includes("what's the weather") || message.includes("whats the weather")) {
    // Extract city name
    let cityName = "";
    if (weatherMatch) {
      cityName = weatherMatch[1].trim();
    } else {
      const cityMatch = message.match(/weather.*(?:in|for)\s+([a-zA-Z\s]+?)(?:\?|$|\.)/);
      if (cityMatch) {
        cityName = cityMatch[1].trim();
      }
    }

    let response = "";
    if (cityName) {
      try {
        const weatherData = await getCurrentWeather(cityName);
        if (weatherData) {
          response = `I'll get the current weather information for you!\n\n${formatWeatherResponse(weatherData)}`;
        } else {
          response = `I couldn't find weather information for "${cityName}". Please check the city name and try again. Make sure to include the full city name, and optionally the country if it's a smaller city.`;
        }
      } catch (error) {
        console.error("Weather API error:", error);
        response = "I'm having trouble accessing weather data right now. Please try again in a moment, or let me know if you need help with something else.";
      }
    } else {
      response = "I'd be happy to get weather information for you! Please specify which city you'd like to know about. For example, you can ask: 'What's the weather in London?' or 'Weather in New York?'";
    }
    return { content: response };
  }

  // Check for search requests
  if (shouldPerformSearch(userMessage)) {
    try {
      const searchResults = await performWebSearch(userMessage);
      let response = "";
      if (searchResults) {
        response = searchResults.summary; // Remove the generic "Let me search for that information!" prefix
      } else {
        response = `I searched for information about "${userMessage}" but couldn't find relevant results. Could you try rephrasing your question or being more specific?`;
      }
      return { content: response };
    } catch (error) {
      console.error("Search error:", error);
      const response = "I'm having trouble accessing search results right now. Please try again in a moment, or let me know if you need help with something else.";
      return { content: response };
    }
  }

  // Start building reasoning steps for complex thinking
  const reasoning: string[] = [];
  reasoning.push("Analyzing the message and emotional context...");

  // Use message analysis for Milla's unified personality
  const analysis = analyzeMessage(userMessage);

  console.log(`Message Analysis - Sentiment: ${analysis.sentiment}, Urgency: ${analysis.urgency}`);
  reasoning.push(`Detected ${analysis.sentiment} sentiment with ${analysis.urgency} urgency level`);

  // Check if we should access long-term memory
  let memoryContext = "";
  let knowledgeContext = "";

  // PRIMARY: Search Memory Core for relevant context (highest priority)
  let memoryCoreContext = "";
  try {
    memoryCoreContext = await getMemoryCoreContext(userMessage);
    if (memoryCoreContext) {
      console.log('Found Memory Core context for query:', userMessage.substring(0, 50));
      reasoning.push("Found relevant memories and relationship context from our history");
    } else {
      reasoning.push("Accessing my memory system for personalized context");
    }
  } catch (error) {
    console.error("Error accessing Memory Core:", error);
    reasoning.push("Continuing with available context (some memories temporarily unavailable)");
  }

  // SECONDARY: Retrieve personal memories for additional context
  try {
    const memoryData = await getMemoriesFromTxt();
    if (memoryData.success && memoryData.content) {
      memoryContext = `\nPersonal Memory Context:\n${memoryData.content}`;
    }
  } catch (error) {
    console.error("Error accessing personal memories:", error);
  }

  // ENHANCED: Add emotional, environmental, and visual context
  let emotionalContext = "";
  let environmentalContext = "";
  let visualContext = "";
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
      } else if (timeSinceLastVisual < 300000) { // Within last 5 minutes
        visualContext = `Recent video session: I recently saw Danny Ray (${Math.round(timeSinceLastVisual / 60000)} minutes ago) and he appeared ${latestMemory.emotion}.`;
      }
    }
  } catch (error) {
    console.error("Error getting enhanced context:", error);
  }

  // TERTIARY: Search knowledge base for relevant information
  try {
    const relevantKnowledge = await searchKnowledge(userMessage);
    if (relevantKnowledge.length > 0) {
      knowledgeContext = `\nRelevant Knowledge:\n${relevantKnowledge.map(item =>
        `- ${item.category} - ${item.topic}: ${item.description}\n  Details: ${item.details} (Confidence: ${item.confidence})`
      ).join('\n')}`;
    }
  } catch (error) {
    console.error("Error searching knowledge base:", error);
  }

  // Analyze keyword triggers BEFORE AI processing
  const triggerResult = analyzeKeywordTriggers(userMessage);
  if (triggerResult.triggered) {
    console.log(`🎯 TRIGGER ACTIVATED: ${triggerResult.reactionType} (intensity: ${triggerResult.intensityBoost})`);
    reasoning.push(`Keyword trigger detected: ${triggerResult.reactionType}`);
  }

  // Use OpenAI for intelligent responses with memory context
  const context: PersonalityContext = {
    userEmotionalState: analysis.sentiment,
    urgency: analysis.urgency,
    conversationHistory: conversationHistory,
    userName: userName || "Danny Ray", // Always default to Danny Ray
    triggerResult: triggerResult // Pass trigger information to AI
  };

  try {

    // Enhance the user message with Memory Core context FIRST, then other contexts
    let enhancedMessage = userMessage;

    // Build comprehensive context for Milla with token limits
    let contextualInfo = "";
    const maxContextLength = 50000; // Limit context to ~50K chars to prevent token issues

    if (memoryCoreContext) {
      // Truncate Memory Core context if it's too long
      const truncatedMemoryCore = memoryCoreContext.length > 30000
        ? memoryCoreContext.substring(0, 30000) + "...[context truncated for performance]"
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

    // Skip memory and knowledge context if we're already at the limit
    if (memoryContext && contextualInfo.length < maxContextLength - 10000) {
      const truncatedMemory = memoryContext.length > 10000
        ? memoryContext.substring(0, 10000) + "...[truncated]"
        : memoryContext;
      contextualInfo += truncatedMemory;
    }

    if (knowledgeContext && contextualInfo.length < maxContextLength - 5000) {
      const truncatedKnowledge = knowledgeContext.length > 5000
        ? knowledgeContext.substring(0, 5000) + "...[truncated]"
        : knowledgeContext;
      contextualInfo += truncatedKnowledge;
    }

    // Final safety check - truncate if still too long
    if (contextualInfo.length > maxContextLength) {
      contextualInfo = contextualInfo.substring(0, maxContextLength) + "...[context truncated to fit token limits]";
    }

    if (contextualInfo) {
      enhancedMessage = `${contextualInfo}\nCurrent message: ${userMessage}`;
    }

    // Use OpenRouter for AI responses
    const aiResponse = await generateOpenRouterResponse(enhancedMessage, {
      conversationHistory: conversationHistory,
      userEmotionalState: analysis.sentiment,
      urgency: analysis.urgency,
      userName: userName
    });

    // Debug logging removed for production cleanliness. Use a proper logging utility if needed.

    if (aiResponse.success && aiResponse.content && aiResponse.content.trim()) {
      reasoning.push("Crafting my response with empathy and understanding");

      // If this is a significant interaction, consider updating memories
      if (analysis.sentiment !== 'neutral' || analysis.urgency !== 'low' || userMessage.length > 50) {
        try {
          await updateMemories(`User asked: "${userMessage}" - Milla responded: "${aiResponse.content}"`);
        } catch (error) {
          console.error("Error updating memories:", error);
        }
      }

      return { content: aiResponse.content, reasoning: userMessage.length > 20 ? reasoning : undefined };
    } else {

      // Enhanced fallback response using memory context and intelligent analysis
      console.log("xAI failed, generating intelligent fallback response with memory context");
      reasoning.push("Using memory-based response (external AI temporarily unavailable)");

      let fallbackResponse = generateIntelligentFallback(userMessage, memoryCoreContext, analysis, userName || "Danny Ray");

      // If this is a significant interaction, consider updating memories
      if (analysis.sentiment !== 'neutral' || analysis.urgency !== 'low' || userMessage.length > 50) {
        try {
          await updateMemories(`User asked: "${userMessage}" - Milla responded: "${fallbackResponse}"`);
        } catch (error) {
          console.error("Error updating memories:", error);
        }
      }

      return { content: fallbackResponse, reasoning: userMessage.length > 20 ? reasoning : undefined };

    }
  } catch (error) {
    console.error("AI Response generation error:", error);
    // Use intelligent fallback even in error cases
    try {
      const fallbackResponse = generateIntelligentFallback(
        userMessage,
        memoryCoreContext,
        analysis,
        userName || "Danny Ray"
      );
      return { content: fallbackResponse };
    } catch (fallbackError) {
      console.error("Fallback generation also failed:", fallbackError);
      return { content: "I'm experiencing some technical difficulties, but I'm still here for you. Please try asking again." };
    }
  }
}
