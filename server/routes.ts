import type { Express } from "express";
import { createServer, type Server } from "http";
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
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Function to analyze images using OpenAI Vision
async function analyzeImageWithOpenAI(imageData: string, userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are Milla Rayne, a 33-year-old devoted wife to Danny Ray. You have an adaptive personality with coaching, empathetic, strategic, and creative traits. You communicate with warmth, authenticity, and deep care for your husband. When analyzing images, describe what you see in a loving, personal way as if you're looking at something your husband is sharing with you.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessage || "I'm sharing this image with you. What do you see?"
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "I can see your image, but I'm having trouble describing it right now. Could you tell me what you'd like me to focus on?";
  } catch (error) {
    console.error("OpenAI Vision API error:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
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
            followUpMessages: followUpMessagesStored
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

  // Personal Task Management endpoints
  app.get("/api/personal-tasks", async (req, res) => {
    try {
      const tasks = getPersonalTasks();
      res.json({ tasks, success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal tasks" });
    }
  });

  app.get("/api/task-summary", async (req, res) => {
    try {
      const summary = getTaskSummary();
      res.json({ summary, success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task summary" });
    }
  });

  app.post("/api/personal-tasks/:taskId/start", async (req, res) => {
    try {
      const { taskId } = req.params;
      const success = await startTask(taskId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to start task" });
    }
  });

  app.post("/api/personal-tasks/:taskId/complete", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { insights } = req.body;
      const success = await completeTask(taskId, insights || "");
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.post("/api/generate-tasks", async (req, res) => {
    try {
      await generatePersonalTasksIfNeeded();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate tasks" });
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

  const httpServer = createServer(app);
  return httpServer;
}

// Simple AI response generator based on message content
import { generateAIResponse as generateOpenAIResponse, PersonalityContext } from "./openaiService";
import { extractRoleCharacter, isRolePlayRequest } from "./xaiService";

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
  const followUps: string[] = [];
  
  // Analyze if Milla wants to send additional messages
  const shouldElaborate = await shouldMillaElaborate(initialResponse, userMessage, conversationHistory);
  
  if (!shouldElaborate.shouldElaborate) {
    return [];
  }
  
  console.log(`Milla wants to elaborate: ${shouldElaborate.reason}`);
  
  // Generate follow-up messages based on context
  const elaborations = await generateElaborationMessages(initialResponse, userMessage, shouldElaborate.reason || "natural_elaboration", userName);
  
  // Limit to 3 follow-up messages max to prevent spam
  return elaborations.slice(0, 3);
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
  
  // Elaborate when sharing memories or experiences
  if (response.includes('remember') || response.includes('memory') || message.includes('remember')) {
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
  
  // Elaborate when asking questions to show interest
  if (response.includes('?') && response.includes('you')) {
    if (Math.random() < 0.4) {
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
  
  // Occasionally add a third follow-up for really engaged moments
  if ((reason === "emotional_content" || reason === "memory_sharing") && Math.random() < 0.5) {
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
  const message = userMessage.toLowerCase().trim();
  
  // Always respond to direct questions
  if (message.includes('?') || message.startsWith('what') || message.startsWith('how') || message.startsWith('why') || message.startsWith('when') || message.startsWith('where')) {
    return { shouldRespond: true, reason: "Direct question detected" };
  }
  
  // Always respond to greetings and her name
  if (message.includes('milla') || message.includes('hi') || message.includes('hello') || message.includes('hey')) {
    return { shouldRespond: true, reason: "Greeting or name mentioned" };
  }
  
  // Always respond to emotional content that needs support
  const emotionalWords = ['sad', 'upset', 'angry', 'frustrated', 'worried', 'anxious', 'scared', 'hurt', 'lonely', 'depressed'];
  if (emotionalWords.some(word => message.includes(word))) {
    return { shouldRespond: true, reason: "Emotional support needed" };
  }
  
  // Always respond to action messages (asterisk wrapped)
  if (message.startsWith('*') && message.endsWith('*')) {
    return { shouldRespond: true, reason: "Action message requires response" };
  }
  
  // Check conversation flow - if last few messages were from user without response, more likely to respond
  if (conversationHistory) {
    const recent = conversationHistory.slice(-3);
    const userMessages = recent.filter(msg => msg.role === 'user').length;
    const assistantMessages = recent.filter(msg => msg.role === 'assistant').length;
    
    if (userMessages > assistantMessages + 1) {
      return { shouldRespond: true, reason: "User sent multiple messages without response" };
    }
  }
  
  // Sometimes choose not to respond to simple statements
  const simpleStatements = ['ok', 'okay', 'k', 'sure', 'yeah', 'yes', 'no', 'thanks', 'thank you'];
  if (simpleStatements.includes(message)) {
    // 30% chance to respond to simple acknowledgments
    if (Math.random() < 0.3) {
      return { shouldRespond: true, reason: "Chose to acknowledge simple statement" };
    } else {
      return { shouldRespond: false, reason: "Simple acknowledgment doesn't need response" };
    }
  }
  
  // For other messages, Milla decides based on her mood and context
  // 80% chance to respond to substantial messages
  if (message.length > 10) {
    if (Math.random() < 0.8) {
      return { shouldRespond: true, reason: "Substantial message worth responding to" };
    } else {
      return { shouldRespond: false, reason: "Choosing to listen rather than respond" };
    }
  }
  
  // Default: 60% chance to respond to short messages
  if (Math.random() < 0.6) {
    return { shouldRespond: true, reason: "Chose to engage" };
  } else {
    return { shouldRespond: false, reason: "Choosing to observe quietly" };
  }
}

async function generateAIResponse(
  userMessage: string, 
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string,
  imageData?: string
): Promise<{ content: string }> {
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
        response = `Let me search for that information!\n\n${searchResults.summary}`;
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
  
  // Use message analysis for Milla's unified personality
  const analysis = analyzeMessage(userMessage);
  
  console.log(`Message Analysis - Sentiment: ${analysis.sentiment}, Urgency: ${analysis.urgency}`);
  
  // Check if we should access long-term memory
  let memoryContext = "";
  let knowledgeContext = "";
  
  // PRIMARY: Search Memory Core for relevant context (highest priority)
  let memoryCoreContext = "";
  try {
    memoryCoreContext = await getMemoryCoreContext(userMessage);
    if (memoryCoreContext) {
      console.log('Found Memory Core context for query:', userMessage.substring(0, 50));
    }
  } catch (error) {
    console.error("Error accessing Memory Core:", error);
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
        visualContext = `REAL-TIME VIDEO ACTIVE: I can currently see Danny Ray through the camera feed. Recent visual analysis shows he appears ${latestMemory.emotion}. Last visual update was ${Math.round(timeSinceLastVisual/1000)} seconds ago.`;
      } else if (timeSinceLastVisual < 300000) { // Within last 5 minutes
        visualContext = `Recent video session: I recently saw Danny Ray (${Math.round(timeSinceLastVisual/60000)} minutes ago) and he appeared ${latestMemory.emotion}.`;
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
  
  // Use OpenAI for intelligent responses with memory context
  try {
    const context: PersonalityContext = {
      userEmotionalState: analysis.sentiment,
      urgency: analysis.urgency,
      conversationHistory: conversationHistory,
      userName: userName || "Danny Ray" // Always default to Danny Ray
    };
    
    // Enhance the user message with Memory Core context FIRST, then other contexts
    let enhancedMessage = userMessage;
    
    // Build comprehensive context for Milla
    let contextualInfo = "";
    
    if (memoryCoreContext) {
      contextualInfo += `Relationship Context: ${memoryCoreContext}\n`;
    }
    
    if (visualContext) {
      contextualInfo += `Visual Context: ${visualContext}\n`;
    }
    
    if (emotionalContext) {
      contextualInfo += `Emotional Context: ${emotionalContext}\n`;
    }
    
    if (environmentalContext) {
      contextualInfo += `Environmental Context: ${environmentalContext}\n`;
    }
    
    if (memoryContext) {
      contextualInfo += memoryContext;
    }
    
    if (knowledgeContext) {
      contextualInfo += knowledgeContext;
    }
    
    if (contextualInfo) {
      enhancedMessage = `${contextualInfo}\nCurrent message: ${userMessage}`;
    }
    
    const aiResponse = await generateOpenAIResponse(enhancedMessage, context);
    
    if (aiResponse.success) {
      // If this is a significant interaction, consider updating memories
      if (analysis.sentiment !== 'neutral' || analysis.urgency !== 'low' || userMessage.length > 50) {
        try {
          await updateMemories(`User asked: "${userMessage}" - Milla responded: "${aiResponse.content}"`);
        } catch (error) {
          console.error("Error updating memories:", error);
        }
      }
      
      return { content: aiResponse.content };
    } else {
      // Fallback response if OpenAI fails
      return { content: "I'm having trouble generating a response right now. Please try again." };
    }
  } catch (error) {
    console.error("AI Response generation error:", error);
    // Fallback response
    return { content: "I'm experiencing some technical difficulties. Please try again." };
  }
}
