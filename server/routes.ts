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
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      return { content: "I can see you've shared an image with me, but I'm having trouble analyzing it right now. Could you describe what you'd like me to know about it?" };
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
    
    if (memoryCoreContext) {
      // Memory Core takes priority - use it to inform Milla's personality and responses
      enhancedMessage = `Based on our conversation history and relationship: ${memoryCoreContext}\n\nCurrent message: ${userMessage}`;
    } else if (memoryContext || knowledgeContext) {
      enhancedMessage = `${userMessage}${memoryContext}${knowledgeContext}`;
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
