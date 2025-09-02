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
import { storeVisualMemory, getVisualMemories, getEmotionalContext } from "./visualMemoryService";
import { trackUserActivity, generateProactiveMessage, checkMilestones, detectEnvironmentalContext } from "./proactiveService";
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
      
      // Simulate AI response based on user message
      if (message.role === "user") {
        // Track user activity for proactive engagement
        await trackUserActivity();
        
        const aiResponse = await generateAIResponse(message.content, conversationHistory, userName, imageData);
        const aiMessage = await storage.createMessage({
          content: aiResponse.content,
          role: "assistant",
          userId: message.userId,
        });
        
        res.json({ userMessage: message, aiMessage });
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
      
      res.json({ 
        message: proactiveMessage,
        milestone,
        environmental,
        recognition,
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

  const httpServer = createServer(app);
  return httpServer;
}

// Simple AI response generator based on message content
import { generateAIResponse as generateOpenAIResponse, extractRoleCharacter, isRolePlayRequest, PersonalityContext } from "./openaiService";

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
