import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { getCurrentWeather, formatWeatherResponse } from "./weatherService";
import { performWebSearch, shouldPerformSearch } from "./searchService";
import { generateImage, extractImagePrompt, formatImageResponse } from "./imageService";

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
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      
      // Simulate AI response based on user message
      if (message.role === "user") {
        const aiResponse = await generateAIResponse(message.content);
        const aiMessage = await storage.createMessage({
          content: aiResponse.content,
          role: "assistant",
          personalityMode: aiResponse.personalityMode,
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

  const httpServer = createServer(app);
  return httpServer;
}

// Simple AI response generator based on message content
async function generateAIResponse(userMessage: string): Promise<{ content: string; personalityMode: "coach" | "empathetic" | "strategic" | "creative" }> {
  const message = userMessage.toLowerCase();
  
  let personalityMode: "coach" | "empathetic" | "strategic" | "creative" = "empathetic";
  let response = "";
  
  // Check for image generation requests first
  const imagePrompt = extractImagePrompt(userMessage);
  if (imagePrompt) {
    personalityMode = "creative";
    
    try {
      const imageResult = await generateImage(imagePrompt);
      response = formatImageResponse(imagePrompt, imageResult.success, imageResult.imageUrl, imageResult.error);
    } catch (error) {
      console.error("Image generation error:", error);
      response = `I apologize, but I encountered an issue generating the image for "${imagePrompt}". Please try again or try a different prompt.`;
    }
  } 
  // Check for weather queries
  else {
    const weatherMatch = message.match(/weather\s+in\s+([a-zA-Z\s]+?)(?:\?|$|\.)/);
    if (weatherMatch || message.includes("what's the weather") || message.includes("whats the weather")) {
      personalityMode = "strategic";
      
      // Extract city name
      let cityName = "";
      if (weatherMatch) {
        cityName = weatherMatch[1].trim();
      } else {
        // Try to extract city from other patterns
        const cityMatch = message.match(/weather.*(?:in|for)\s+([a-zA-Z\s]+?)(?:\?|$|\.)/);
        if (cityMatch) {
          cityName = cityMatch[1].trim();
        }
      }
      
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
    }
  }
  // Check if we should perform a web search
  if (shouldPerformSearch(userMessage)) {
    personalityMode = "strategic";
    
    try {
      const searchResults = await performWebSearch(userMessage);
      if (searchResults) {
        response = `Let me search for that information!

${searchResults.summary}`;
      } else {
        response = `I searched for information about "${userMessage}" but couldn't find relevant results. Could you try rephrasing your question or being more specific?`;
      }
    } catch (error) {
      console.error("Search error:", error);
      response = "I'm having trouble accessing search results right now. Please try again in a moment, or let me know if you need help with something else.";
    }
  } else if (message.includes("project") || message.includes("strategy") || message.includes("plan")) {
    personalityMode = "strategic";
    response = "I see you're working on something strategic. Let me shift into Strategic Advisor mode to help you think through this systematically. To provide the most valuable guidance, I'll need to understand: What's the core objective you're trying to achieve? Who are your key stakeholders? What resources and constraints are you working within? Once I understand these fundamentals, I can help you develop a comprehensive framework that balances ambition with pragmatism.";
  } else if (message.includes("creative") || message.includes("idea") || message.includes("design")) {
    personalityMode = "creative";
    response = "I love that you're thinking creatively! Let me engage my Creative Partner mode. I believe the best ideas come from exploring unconventional connections and pushing boundaries. What specific creative challenge are you facing? Are you looking to brainstorm new concepts, refine existing ideas, or break through a creative block? I can help you explore different perspectives and innovative approaches.";
  } else if (message.includes("help") || message.includes("support") || message.includes("difficult")) {
    personalityMode = "empathetic";
    response = "I hear you, and I want you to know that reaching out takes courage. I'm here to listen and support you through this. Sometimes we all need someone who truly understands what we're going through. Can you tell me more about what's on your mind? I'm here to provide a safe space where you can express yourself freely, and together we can work through whatever you're facing.";
  } else if (message.includes("goal") || message.includes("improve") || message.includes("achieve")) {
    personalityMode = "coach";
    response = "I can see you're focused on growth and achievement - that's exactly the mindset that leads to success! Let me switch to Coach mode. Every meaningful goal requires clarity, commitment, and a solid action plan. What specific outcome are you working toward? What obstacles have you encountered so far? I'll help you break this down into manageable steps and develop strategies to overcome any challenges you're facing.";
  } else {
    response = "I appreciate you sharing that with me. I'm here to help in whatever way would be most beneficial for you right now. Whether you need strategic guidance, creative inspiration, emotional support, or practical coaching, I can adapt my approach to meet your needs. What would be most helpful for you at this moment?";
  }
  
  return { content: response, personalityMode };
}
