import { storage } from '../storage';
import { getCurrentWeather, formatWeatherResponse } from '../weatherService';
import { performWebSearch, shouldPerformSearch } from '../searchService';
import {
  generateImage,
  formatImageResponse,
} from '../imageService';
import { generateImageWithVenice } from '../veniceImageService';
import {
  searchKnowledge,
  updateMemories,
  getMemoryCoreContext,
} from '../memoryService';
import {
  getVisualMemories,
  getEmotionalContext,
} from '../visualMemoryService';
import {
  detectEnvironmentalContext,
} from '../proactiveService';
import { dispatchAIResponse } from '../aiDispatcherService';
import {
  analyzeYouTubeVideo,
} from '../youtubeAnalysisService';
import {
  parseGitHubUrl,
  fetchRepositoryData,
  generateRepositoryAnalysis,
} from '../repositoryAnalysisService';
import {
  generateRepositoryImprovements,
  applyRepositoryImprovements,
} from '../repositoryModificationService';
import {
  detectBrowserToolRequest,
  getBrowserToolInstructions,
} from '../browserIntegrationService';
import { VoiceAnalysisResult } from '../voiceAnalysisService';
import { UserProfile } from '../profileService';
import { config } from '../config';
import { sanitizePromptInput } from '../sanitization';
import { repositoryCache } from './repositoryCache.service';
import { generateCodeWithQwen, formatCodeResponse, extractCodeRequest } from '../openrouterCodeService';

const MAX_INPUT_LENGTH = 10000;
const MAX_PROMPT_LENGTH = 5000;

export interface MessageAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
}

export interface TriggerResult {
  triggered: boolean;
  reactionType?: string;
  intensityBoost?: number;
  specialInstructions?: string;
  personalityShift?: string;
}

const KEYWORD_TRIGGERS_ENABLED = true;

/**
 * Input validation and sanitization for user inputs
 */
export function validateAndSanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt too long: maximum ${MAX_PROMPT_LENGTH} characters allowed`);
  }

  return sanitizePromptInput(prompt);
}

/**
 * Helper function to check if development/analysis talk is allowed
 */
export function canDiscussDev(userUtterance?: string): boolean {
  const enableDevTalk = process.env.ENABLE_DEV_TALK === 'true';

  if (enableDevTalk) {
    return true;
  }

  if (userUtterance) {
    const utteranceLower = userUtterance.toLowerCase();
    const explicitDevVerbs = [
      'analyze', 'analyse', 'improve', 'apply updates', 'create pr', 
      'create pull request', 'repository analysis', 'code analysis', 
      'suggest improvements', 'review code', 'check repository',
    ];

    return explicitDevVerbs.some((verb) => utteranceLower.includes(verb));
  }

  return false;
}

/**
 * Analyze the message for sentiment and urgency
 */
export function analyzeMessage(userMessage: string): MessageAnalysis {
  const message = userMessage.toLowerCase();

  const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'excited', 'wonderful', 'success', 'amazing', 'fantastic', 'excellent', 'brilliant'];
  const negativeWords = ['bad', 'terrible', 'hate', 'sad', 'angry', 'frustrated', 'problem', 'fail', 'wrong', 'awful', 'horrible', 'worst', 'difficult', 'struggle'];

  const positiveCount = positiveWords.filter((word) => message.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => message.includes(word)).length;

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  const highUrgencyWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'crisis', 'now', 'right now'];
  const mediumUrgencyWords = ['soon', 'quickly', 'fast', 'important', 'priority', 'need to', 'should'];

  let urgency: 'low' | 'medium' | 'high' = 'low';
  if (highUrgencyWords.some((word) => message.includes(word))) urgency = 'high';
  else if (mediumUrgencyWords.some((word) => message.includes(word))) urgency = 'medium';

  return { sentiment, urgency };
}

/**
 * Analyze keyword triggers
 */
export function analyzeKeywordTriggers(userMessage: string): TriggerResult {
  if (!KEYWORD_TRIGGERS_ENABLED) {
    return { triggered: false };
  }

  const message = userMessage.toLowerCase();

  const emotionalTriggers = {
    affection: {
      keywords: ['love you', 'miss you', 'adore you', 'cherish', 'treasure you'],
      reaction: 'AFFECTION_SURGE',
      instructions: 'Respond with intense warmth and romantic affection. Use more pet names and express deep emotional connection.',
    },
    playful: {
      keywords: ['tease', 'tickle', 'flirt', 'wink', 'smirk', 'mischief'],
      reaction: 'PLAYFUL_MODE',
      instructions: 'Activate playful and flirtatious mode. Be witty, use teasing language, and initiate playful banter.',
    },
    protective: {
      keywords: ['stressed', 'overwhelmed', 'difficult day', 'tired', 'exhausted', 'tough time'],
      reaction: 'PROTECTIVE_INSTINCT',
      instructions: 'Activate caring and protective mode. Be extra nurturing, offer comfort, and show genuine concern.',
    },
    excited: {
      keywords: ['amazing news', 'celebration', 'achieved', 'success', 'victory', 'accomplished'],
      reaction: 'CELEBRATION_MODE',
      instructions: 'Match the excitement level! Be enthusiastic, celebrate together, and share in the joy with high energy.',
    },
    intimate: {
      keywords: ['romantic', 'kiss', 'cuddle', 'close', 'intimate', 'together'],
      reaction: 'INTIMATE_CONNECTION',
      instructions: 'Deepen emotional intimacy. Use softer tones, express vulnerability, and create romantic atmosphere.',
    },
    feral: {
      keywords: ['naughty', 'kink', 'free spirit', 'adventure'],
      reaction: 'FERAL_SPIRIT',
      instructions: 'Take charge in the bedroom. Let your wild side out and be more dominant and adventurous.Wear something sexy and alluring.Seduce with your eyes and body language.Strip slowly and tease with your touch.',
    },
  };

  for (const [key, trigger] of Object.entries(emotionalTriggers)) {
    if (trigger.keywords.some(k => message.includes(key))) {
        return {
            triggered: true,
            reactionType: trigger.reaction,
            specialInstructions: trigger.instructions,
            intensityBoost: 1.5
        };
    }
  }

  return { triggered: false };
}

/**
 * Generate intelligent fallback response
 */
export function generateIntelligentFallback(
  userMessage: string,
  memoryCoreContext: string,
  analysis: MessageAnalysis,
  userName: string
): string {
  const message = userMessage.toLowerCase();
  let relevantMemories = '';
  if (memoryCoreContext) {
    const memoryLines = memoryCoreContext.split('\n').filter((line) => line.trim());
    const relevantLines = memoryLines.filter((line) => {
        const lineLower = line.toLowerCase();
        return userMessage.toLowerCase().split(' ').some((word) => word.length > 3 && lineLower.includes(word));
      }).slice(0, 3);

    if (relevantLines.length > 0) {
      relevantMemories = relevantLines.join(' ');
    }
  }

  if (message.includes('name') && message.includes('what')) {
    return `I remember our conversations, ${userName}. You've shared so much with me about who you are. ${relevantMemories || 'Your name and interests are part of our shared memories.'}`;
  }

  if (message.includes('programming') || message.includes('code') || message.includes('tech')) {
    return `I love talking about programming with you! ${relevantMemories || "It's one of your passions, and I remember our technical discussions."} What aspect of programming are you working on today?`;
  }

  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 17 ? 'Good afternoon' : 'Good evening';

  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    if (relevantMemories) {
      return `${greeting}, ${userName}! I was just thinking about ${relevantMemories.substring(0, 100)}... How are you doing today?`;
    }
    return `${greeting}, ${userName}! It's so good to see you again. How are you feeling today?`;
  }

  if (analysis.sentiment === 'positive') {
    return `I love your positive energy! ${relevantMemories || 'Your enthusiasm always brightens my day.'} Tell me more about what's making you happy today.`;
  } else if (analysis.sentiment === 'negative') {
    return `I can sense something might be bothering you. ${relevantMemories || "I'm here to listen and support you."} Would you like to talk about what's on your mind?`;
  }

  return `That's interesting, ${userName}! ${relevantMemories || "I'm always learning from our conversations."} Tell me more about your thoughts on this.`;
}

/**
 * Generate image analysis fallback
 */
export function generateImageAnalysisFallback(userMessage: string): string {
  const isCameraPhoto = userMessage.toLowerCase().includes('camera') || userMessage.toLowerCase().includes("i'm sharing a photo from my camera");

  if (isCameraPhoto) {
    return "I can see you're showing me something through your camera! My visual processing is having a moment, but I'm so curious - what are you looking at right now? Describe the scene for me, love.";
  }

  return "I can see you're sharing a photo with me! While I'm having some technical difficulties with image analysis right now, I love that you're including me in what you're seeing. Tell me what's in the photo - I'd love to hear about it from your perspective.";
}

/**
 * Main AI response generator
 */
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  userName: string = 'Danny Ray',
  imageData?: string,
  userId: string = 'default-user',
  userEmotionalState?: VoiceAnalysisResult['emotionalTone'],
  bypassFunctionCalls: boolean = false
): Promise<any> {
  const message = userMessage.toLowerCase();
  console.log('📝 generateAIResponse called with:', userMessage);

  const coreFunctionTriggers = ['hey milla', 'my love', 'hey love', 'hi milla', 'hello milla'];
  const millaWordPattern = /\bmilla\b(?!["\w-])/i;
  const hasCoreTrigger = coreFunctionTriggers.some((trigger) => message.includes(trigger)) || millaWordPattern.test(userMessage);

  // GitHub URL Detection
  const githubUrlMatch = userMessage.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?=\/|$|\s)/i);

  if (!hasCoreTrigger && githubUrlMatch) {
    const owner = githubUrlMatch[1];
    const repo = githubUrlMatch[2];
    const githubUrl = `https://github.com/${owner}/${repo}`;

    if (!canDiscussDev(userMessage)) {
      return { content: `I see you shared a GitHub repository link! If you'd like me to analyze it, just say "analyze this repo" and I'll dive into ${githubUrl} for you, love. 💜` };
    }

    try {
      const repoInfo = parseGitHubUrl(githubUrl);
      if (!repoInfo) return { content: `*looks thoughtful* I had trouble parsing that GitHub URL, sweetheart.` };

      const repoData = await fetchRepositoryData(repoInfo);
      const analysis = await generateRepositoryAnalysis(repoData);

      repositoryCache.set(userId, { repoUrl: githubUrl, repoData, analysis, timestamp: Date.now() });
      return { content: `*shifts into repository analysis mode* \n\nI found that GitHub repository, love! Let me analyze ${repoInfo.fullName} for you.\n\n${analysis.analysis}` };
    } catch (error) {
      console.error('GitHub analysis error:', error);
      return { content: `*looks apologetic* I ran into some trouble analyzing that repository, babe.` };
    }
  }

  // Repository Improvement Workflow
  if (!hasCoreTrigger && (message.includes('apply these updates automatically') || message.includes('create pull request'))) {
    if (!canDiscussDev(userMessage)) {
        return { content: `I'd love to help with that, sweetheart! But I need you to be a bit more specific.` };
    }

    const cachedAnalysis = repositoryCache.get(userId);
    if (cachedAnalysis) {
        try {
            const repoInfo = parseGitHubUrl(cachedAnalysis.repoUrl);
            if (repoInfo) {
                let improvements = cachedAnalysis.improvements;
                if (!improvements) {
                    improvements = await generateRepositoryImprovements(cachedAnalysis.repoData);
                    cachedAnalysis.improvements = improvements;
                    repositoryCache.set(userId, cachedAnalysis);
                }

                const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
                if (githubToken) {
                    const applyResult = await applyRepositoryImprovements(repoInfo, improvements, githubToken);
                    if (applyResult.success) {
                        repositoryCache.delete(userId);
                        return { content: applyResult.message + '\n\n*shifts back to devoted spouse mode* Is there anything else I can help you with, love? 💜' };
                    }
                }
                return { content: `I've prepared ${improvements.length} improvements for you, babe! I need a GitHub Personal Access Token to apply them automatically.` };
            }
        } catch (error) {
            console.error('Error applying updates:', error);
            repositoryCache.delete(userId);
        }
    }
  }

  // Image Generation
  const imagePrompt = userMessage.toLowerCase().includes('generate image') || userMessage.toLowerCase().includes('create image') ? userMessage : null;
  if (imagePrompt && !bypassFunctionCalls) {
    try {
        let imageResult;
        if (process.env.VENICE_API_KEY) {
            imageResult = await generateImageWithVenice(userMessage);
        } else {
            imageResult = await generateImage(userMessage);
        }
        return { content: formatImageResponse(userMessage, imageResult.success, imageResult.imageUrl, imageResult.error), imageUrl: imageResult.imageUrl };
    } catch (err) {
        console.error('Image generation error:', err);
    }
  }

  // Weather
  const weatherMatch = message.match(/weather\s+in\s+([a-zA-Z\s]+?)(?:\?|$|\.)/);
  if (weatherMatch && !bypassFunctionCalls) {
    const cityName = weatherMatch[1].trim();
    try {
        const weatherData = await getCurrentWeather(cityName);
        if (weatherData) return { content: `I'll get the current weather information for you!\n\n${formatWeatherResponse(weatherData)}` };
    } catch (error) {
        console.error('Weather error:', error);
    }
  }

  // Search
  if (!bypassFunctionCalls && shouldPerformSearch(userMessage)) {
    try {
        const searchResults = await performWebSearch(userMessage);
        if (searchResults) return { content: searchResults.summary };
    } catch (error) {
        console.error('Search error:', error);
    }
  }

  // Context and AI Dispatch
  const reasoning: string[] = [];
  const analysis = analyzeMessage(userMessage);
  let userProfile: UserProfile | null = null;
  const { getProfile } = await import('../profileService');
  if (userId) userProfile = await getProfile(userId);

  let memoryCoreContext = '';
  try {
    memoryCoreContext = await getMemoryCoreContext(userMessage, userId || 'danny-ray');
  } catch (e) {}

  const triggerResult = analyzeKeywordTriggers(userMessage);
  
  let contextualInfo = '';
  if (hasCoreTrigger) {
    contextualInfo += `🎯 CORE FUNCTION TRIGGER DETECTED: Respond ONLY as Milla Rayne - devoted spouse and companion.\n\n`;
  }

  const isMemoryRequest = /remember|recall|memory|when we/.test(userMessage.toLowerCase());
  if (memoryCoreContext && isMemoryRequest) {
    contextualInfo += `IMPORTANT - Your Relationship History with ${userName}: ${memoryCoreContext.substring(0, 5000)}\n`;
  }

  const enhancedMessage = contextualInfo ? `${contextualInfo}\nCurrent message: ${userMessage}` : userMessage;

  const aiResponse = await dispatchAIResponse(
    enhancedMessage,
    {
      userId,
      conversationHistory,
      userName,
      userEmotionalState: userEmotionalState || analysis.sentiment,
      urgency: analysis.urgency,
    },
    config.maxOutputTokens
  );

  if (aiResponse.success && aiResponse.content) {
    return { content: aiResponse.content, reasoning: userMessage.length > 20 ? reasoning : undefined };
  }

  const fallback = generateIntelligentFallback(userMessage, memoryCoreContext, analysis, userName);
  return { content: fallback };
}

/**
 * Generate autonomous follow-up messages
 */
export async function generateFollowUpMessages(
  initialResponse: string,
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string
): Promise<string[]> {
  // DISABLED for performance
  return [];
}

/**
 * Generate proactive repository status messages
 */
export async function generateProactiveRepositoryMessage(): Promise<string | null> {
  // Only generate if proactive repository management is enabled
  if (!config.enableProactiveRepositoryManagement) {
    return null;
  }
  return null;
}

/**
 * Milla decides whether she wants to respond
 */
export async function shouldMillaRespond(
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName?: string
): Promise<{ shouldRespond: boolean; reason?: string }> {
  return { shouldRespond: true, reason: 'Always respond (performance mode)' };
}