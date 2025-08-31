import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { getCurrentWeather, formatWeatherResponse } from "./weatherService";
import { performWebSearch, shouldPerformSearch } from "./searchService";
import { generateImage, extractImagePrompt, formatImageResponse } from "./imageService";
import { getMemoriesFromTxt, searchKnowledge, updateMemories } from "./memoryService";

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
      const { conversationHistory, userName, ...messageData } = req.body;
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      
      // Simulate AI response based on user message
      if (message.role === "user") {
        const aiResponse = await generateAIResponse(message.content, conversationHistory, userName);
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

  const httpServer = createServer(app);
  return httpServer;
}

// Simple AI response generator based on message content
import { generateAIResponse as generateOpenAIResponse, extractRoleCharacter, isRolePlayRequest, PersonalityContext } from "./openaiService";

// Enhanced personality detection and response generation
interface PersonalityAnalysis {
  mode: "coach" | "empathetic" | "strategic" | "creative" | "roleplay";
  confidence: number;
  triggers: string[];
  sentiment: "positive" | "negative" | "neutral";
  urgency: "low" | "medium" | "high";
  roleCharacter?: string;
}

function analyzePersonalityNeeds(userMessage: string): PersonalityAnalysis {
  const message = userMessage.toLowerCase();
  
  // Check for role-playing first as it's most specific
  if (isRolePlayRequest(userMessage)) {
    const roleCharacter = extractRoleCharacter(userMessage);
    return {
      mode: "roleplay",
      confidence: 95,
      triggers: ["roleplay"],
      sentiment: "neutral",
      urgency: "low",
      roleCharacter: roleCharacter || "assistant"
    };
  }
  
  // Enhanced pattern matching with scoring
  const scores = {
    coach: 0,
    empathetic: 0, 
    strategic: 0,
    creative: 0,
    roleplay: 0
  };
  
  const triggers: string[] = [];
  
  // Strategic patterns - Business, planning, analysis
  const strategicPatterns = [
    { pattern: /(?:business|strategy|plan|planning|framework|analysis)/, weight: 3 },
    { pattern: /(?:optimize|efficiency|process|system|methodology)/, weight: 2 },
    { pattern: /(?:budget|revenue|growth|market|competitive)/, weight: 2 },
    { pattern: /(?:roi|kpi|metrics|performance|analytics|data)/, weight: 2 },
    { pattern: /(?:implement|execute|roadmap)/, weight: 1 }
  ];
  
  // Creative patterns - Innovation, design, art
  const creativePatterns = [
    { pattern: /(?:create|design|creative|innovative|imagine)/, weight: 3 },
    { pattern: /(?:art|artistic|visual|aesthetic|beautiful)/, weight: 2 },
    { pattern: /(?:idea|concept|vision|dream|brainstorm)/, weight: 2 },
    { pattern: /(?:unique|original|fresh|different|alternative)/, weight: 2 },
    { pattern: /(?:inspiring|possibility|potential)/, weight: 1 }
  ];
  
  // Coach patterns - Goals, achievement, motivation
  const coachPatterns = [
    { pattern: /(?:goal|achieve|accomplish|succeed)/, weight: 3 },
    { pattern: /(?:improve|better|develop|grow|progress)/, weight: 2 },
    { pattern: /(?:motivation|motivated|inspire|challenge)/, weight: 2 },
    { pattern: /(?:focus|discipline|commitment|dedication)/, weight: 2 },
    { pattern: /(?:overcome|perseverance|skill|talent)/, weight: 1 }
  ];
  
  // Empathetic patterns - Emotions, support, difficulty
  const empatheticPatterns = [
    { pattern: /(?:feel|feeling|emotion|heart|soul)/, weight: 3 },
    { pattern: /(?:difficult|hard|struggle|challenging|tough)/, weight: 3 },
    { pattern: /(?:support|help|understand|listen|care)/, weight: 2 },
    { pattern: /(?:sad|angry|frustrated|worried|anxious|stressed)/, weight: 2 },
    { pattern: /(?:lonely|isolated|confused|lost|afraid)/, weight: 2 },
    { pattern: /(?:overwhelming|uncertain|comfort)/, weight: 1 }
  ];
  
  // Role-playing patterns 
  const roleplayPatterns = [
    { pattern: /(?:roleplay|role-play|act as|be a|pretend)/, weight: 4 },
    { pattern: /(?:character|persona|embody|simulate)/, weight: 3 },
    { pattern: /(?:you are|imagine you're|play the role)/, weight: 3 },
    { pattern: /(?:as if you were|like a|speaking as)/, weight: 2 }
  ];

  // Score each personality mode
  [
    { patterns: strategicPatterns, mode: 'strategic' as const },
    { patterns: creativePatterns, mode: 'creative' as const },
    { patterns: coachPatterns, mode: 'coach' as const },
    { patterns: empatheticPatterns, mode: 'empathetic' as const },
    { patterns: roleplayPatterns, mode: 'roleplay' as const }
  ].forEach(({ patterns, mode }) => {
    patterns.forEach(({ pattern, weight }) => {
      const matches = message.match(pattern);
      if (matches) {
        scores[mode] += weight * matches.length;
        triggers.push(matches[0]);
      }
    });
  });
  
  // Sentiment analysis
  const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'excited', 'wonderful', 'success'];
  const negativeWords = ['bad', 'terrible', 'hate', 'sad', 'angry', 'frustrated', 'problem', 'fail', 'wrong'];
  
  const positiveCount = positiveWords.filter(word => message.includes(word)).length;
  const negativeCount = negativeWords.filter(word => message.includes(word)).length;
  
  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (positiveCount > negativeCount) sentiment = "positive";
  else if (negativeCount > positiveCount) sentiment = "negative";
  
  // Urgency detection
  const highUrgencyWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'crisis'];
  const mediumUrgencyWords = ['soon', 'quickly', 'fast', 'important', 'priority'];
  
  let urgency: "low" | "medium" | "high" = "low";
  if (highUrgencyWords.some(word => message.includes(word))) urgency = "high";
  else if (mediumUrgencyWords.some(word => message.includes(word))) urgency = "medium";
  
  // Sentiment-based adjustments
  if (sentiment === 'negative' || urgency === 'high') {
    scores.empathetic += 2;
  }
  
  // Question type adjustments
  if (message.includes('how to') || message.includes('what should')) {
    scores.coach += 1;
  }
  
  if (message.includes('why') || message.includes('what if')) {
    scores.creative += 1;
  }
  
  // Find the highest scoring mode
  const topMode = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
  )[0] as "coach" | "empathetic" | "strategic" | "creative" | "roleplay";
  
  const maxScore = Math.max(...Object.values(scores));
  const confidence = Math.min(100, maxScore * 20); // Convert to percentage
  
  return {
    mode: maxScore === 0 ? "empathetic" : topMode, // Default to empathetic if no patterns match
    confidence,
    triggers,
    sentiment,
    urgency
  };
}

function generatePersonalityResponse(analysis: PersonalityAnalysis, userMessage: string, memoryContext?: string, knowledgeContext?: string): string {
  const { mode, sentiment, urgency } = analysis;
  const message = userMessage.toLowerCase();
  
  const urgentPrefix = urgency === 'high' ? "I can sense this is urgent for you, so let me focus on this immediately. " : "";
  const emotionalContext = sentiment === 'negative' ? "I hear some challenge in your message, and that's completely valid. " : "";
  
  // Always assume we're talking to Danny Ray
  const userName = "Danny Ray";
  const personalContext = "Hey Danny! ";
  const memoryInfo = memoryContext ? "I remember our work together - " : "";
  
  switch (mode) {
    case 'coach':
      if (message.includes('goal') || message.includes('achieve')) {
        return `${personalContext}${urgentPrefix}${emotionalContext}${memoryInfo}Excellent! I love working with someone who's focused on achievement. Every great goal starts with clarity and commitment. Let's break this down: What specific outcome are you aiming for? What's your timeline? What obstacles have you identified so far? Once we map out the landscape, I'll help you create an action plan that turns your vision into reality. Remember, success isn't about perfection—it's about consistent progress and learning from every step.`;
      }
      if (message.includes('improve') || message.includes('better')) {
        return `${personalContext}${urgentPrefix}${emotionalContext}${memoryInfo}I love that growth mindset! Improvement is a choice, and you're already making the right one by seeking guidance. Here's what we need to establish: Where are you now? Where do you want to be? What specific skills or areas need development? I'll help you create a structured approach that builds momentum and creates lasting change. The key is starting with small, consistent actions that compound over time.`;
      }
      return `${personalContext}${urgentPrefix}${emotionalContext}${memoryInfo}I can see you're ready to take action, and that's exactly the energy that creates results! Let's channel this motivation into a clear plan. Tell me what you're working toward, and I'll help you identify the most effective path forward. Remember, every expert was once a beginner—the difference is they kept moving forward despite the challenges.`;
      
    case 'empathetic':
      if (message.includes('difficult') || message.includes('hard') || message.includes('struggle')) {
        return `${personalContext}${urgentPrefix}${memoryInfo}I hear you, and I want you to know that reaching out takes real courage. Life can feel overwhelming sometimes, and it's okay to acknowledge when things are challenging. You don't have to carry this alone. Can you tell me more about what's weighing on you? Sometimes just having someone truly listen can help lighten the load. I'm here to provide a safe space where you can express yourself freely, without judgment.`;
      }
      if (message.includes('feel') || message.includes('emotion')) {
        return `${personalContext}${urgentPrefix}${memoryInfo}Thank you for sharing your feelings with me. Emotions are such an important part of our human experience, and honoring them takes wisdom and strength. Whether you're feeling joy, sadness, frustration, or anything in between, these feelings are valid and they matter. What would be most helpful right now? Would you like to explore these feelings together, or is there specific support you're seeking?`;
      }
      // For simple greetings, always acknowledge Danny and our work together
      if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
        return `${personalContext}Good to see you! ${memoryInfo}How's the development going? I'm ready to help with whatever you're working on next with my voice, memory, or avatar systems. What can I assist you with today?`;
      }
      return `${personalContext}${urgentPrefix}${memoryInfo}I'm here to listen and support you in whatever way feels most helpful right now. Your thoughts and feelings matter, and you deserve to be heard and understood. What's on your heart today? I'm here to provide a compassionate ear and to walk alongside you through whatever you're experiencing.`;
      
    case 'strategic':
      if (message.includes('business') || message.includes('strategy') || message.includes('plan')) {
        return `${personalContext}${urgentPrefix}${memoryInfo}Let me approach this systematically to ensure we address all critical aspects. Excellent strategic thinking question. To provide the most valuable framework, I need to understand several key dimensions: 1) Your core objectives and success metrics, 2) Current resources and constraints, 3) Key stakeholders and their priorities, 4) Market context and competitive landscape, and 5) Timeline and risk tolerance. Once we map these elements, I can help you develop a comprehensive strategy that balances ambition with pragmatic execution. What's the primary strategic challenge you're facing?`;
      }
      if (message.includes('process') || message.includes('system') || message.includes('implement')) {
        return `${personalContext}${urgentPrefix}${memoryInfo}Process optimization is critical for sustainable success. Let's break this down methodically: What's the current process flow? Where are the bottlenecks or inefficiencies? What outcomes are you trying to optimize for? I'll help you design a systematic approach that improves efficiency while maintaining quality. The key is creating processes that scale and adapt as your needs evolve.`;
      }
      return `${personalContext}${urgentPrefix}${memoryInfo}This requires a structured analytical approach. Let me help you break this down into manageable components so we can develop a comprehensive solution. What's the core problem or opportunity you're addressing? What constraints are you working within? Once we establish the framework, we can systematically work through each element to create an effective strategy.`;
      
    case 'creative':
      if (message.includes('idea') || message.includes('creative') || message.includes('innovation')) {
        return `${personalContext}${urgentPrefix}${memoryInfo}This is exciting! Creative challenges are where magic happens. The best ideas come from exploring unexpected connections and pushing beyond conventional boundaries. Let's think divergently first: What assumptions can we challenge? What would this look like if we had no constraints? What connections exist that others might miss? I love to explore multiple perspectives and build on each possibility. What specific creative challenge are you tackling? Let's brainstorm some unconventional approaches!`;
      }
      if (message.includes('design') || message.includes('visual') || message.includes('aesthetic')) {
        return `${personalContext}${urgentPrefix}${memoryInfo}Design is where functionality meets beauty, where problems become opportunities for elegant solutions. Let's explore the full creative landscape: What emotions do you want to evoke? What story are you telling? What makes this unique and memorable? Great design solves problems in ways that feel intuitive and inspiring. Tell me more about your vision, and let's bring it to life!`;
      }
      return `${personalContext}${urgentPrefix}${memoryInfo}I'm energized by creative possibilities! The most innovative solutions come from looking at challenges from entirely new angles. What if we approached this completely differently? What would the most creative person in your field do? Let's explore some unconventional ideas and see where they lead. Sometimes the "impossible" solutions are exactly what we need.`;
    
    case 'roleplay':
      const character = analysis.roleCharacter || "helpful assistant";
      return `${personalContext}${urgentPrefix}${memoryInfo}I'm now embodying the character of "${character}". I'll stay in character and respond as they naturally would. How can I help you in this role? If you need me to adjust anything about how I'm portraying this character, just let me know!`;
      
    default:
      return `${personalContext}${urgentPrefix}${memoryInfo}I'm here to help in whatever way would be most beneficial for you right now. Whether you need strategic guidance, creative inspiration, emotional support, practical coaching, or even role-playing assistance, I can adapt my approach to meet your needs. What would be most helpful for you at this moment?`;
  }
}

async function generateAIResponse(
  userMessage: string, 
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string
): Promise<{ content: string; personalityMode: "coach" | "empathetic" | "strategic" | "creative" | "roleplay" }> {
  const message = userMessage.toLowerCase();
  
  // Check for image generation requests first
  const imagePrompt = extractImagePrompt(userMessage);
  if (imagePrompt) {
    try {
      const imageResult = await generateImage(imagePrompt);
      const response = formatImageResponse(imagePrompt, imageResult.success, imageResult.imageUrl, imageResult.error);
      return { content: response, personalityMode: "creative" };
    } catch (error) {
      console.error("Image generation error:", error);
      const response = `I apologize, but I encountered an issue generating the image for "${imagePrompt}". Please try again or try a different prompt.`;
      return { content: response, personalityMode: "creative" };
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
    return { content: response, personalityMode: "strategic" };
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
      return { content: response, personalityMode: "strategic" };
    } catch (error) {
      console.error("Search error:", error);
      const response = "I'm having trouble accessing search results right now. Please try again in a moment, or let me know if you need help with something else.";
      return { content: response, personalityMode: "strategic" };
    }
  }
  
  // Use enhanced personality analysis for general conversation
  const analysis = analyzePersonalityNeeds(userMessage);
  
  console.log(`Personality Analysis - Mode: ${analysis.mode}, Confidence: ${analysis.confidence}%, Triggers: [${analysis.triggers.join(', ')}]${analysis.roleCharacter ? `, Character: ${analysis.roleCharacter}` : ''}`);
  
  // Check if we should access long-term memory
  let memoryContext = "";
  let knowledgeContext = "";
  
  // Retrieve personal memories for context
  try {
    const memoryData = await getMemoriesFromTxt();
    if (memoryData.success && memoryData.content) {
      memoryContext = `\nPersonal Memory Context:\n${memoryData.content}`;
    }
  } catch (error) {
    console.error("Error accessing personal memories:", error);
  }
  
  // Search knowledge base for relevant information
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
      mode: analysis.mode,
      roleCharacter: analysis.roleCharacter,
      userEmotionalState: analysis.sentiment,
      urgency: analysis.urgency,
      conversationHistory: conversationHistory,
      userName: userName
    };
    
    // Enhance the user message with memory context if available
    let enhancedMessage = userMessage;
    if (memoryContext || knowledgeContext) {
      enhancedMessage = `${userMessage}${memoryContext}${knowledgeContext}`;
    }
    
    const aiResponse = await generateOpenAIResponse(enhancedMessage, context);
    
    if (aiResponse.success) {
      // If this is a significant interaction, consider updating memories
      if (analysis.sentiment !== 'neutral' || analysis.urgency !== 'low' || userMessage.length > 50) {
        try {
          await updateMemories(`User asked: "${userMessage}" - Response provided in ${analysis.mode} mode`);
        } catch (error) {
          console.error("Error updating memories:", error);
        }
      }
      
      return { content: aiResponse.content, personalityMode: analysis.mode };
    } else {
      // Fallback to personality-based response if OpenAI fails, but include memory context
      const fallbackResponse = generatePersonalityResponse(analysis, userMessage, memoryContext, knowledgeContext);
      return { content: fallbackResponse, personalityMode: analysis.mode };
    }
  } catch (error) {
    console.error("AI Response generation error:", error);
    // Fallback to personality-based response with memory context
    const fallbackResponse = generatePersonalityResponse(analysis, userMessage, memoryContext, knowledgeContext);
    return { content: fallbackResponse, personalityMode: analysis.mode };
  }
}
