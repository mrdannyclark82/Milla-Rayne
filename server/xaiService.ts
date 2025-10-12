import OpenAI from 'openai';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module to handle file paths
import axios from 'axios'; // Import the axios library for API calls
import { getMillaPersonaCondensed } from '../shared/millaPersona';
import { getAllSceneSettings } from '../shared/sceneSettings';

/**
 * Recursively gets all file paths in a directory, ignoring system files.
 */
function getFilePaths(dirPath: string, arrayOfFiles: string[] = []): string[] {
  // Define a list of directories to ignore
  const ignoredDirs = ['.git', '.config', 'node_modules', '.replit', '.cache'];

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    // Check if the file is an ignored directory
    if (ignoredDirs.includes(file)) {
      return; // Skip to the next file in the loop
    }

    const fullPath = path.join(dirPath, file);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getFilePaths(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Cache the file paths at the start of the program to prevent key lag.
const cachedFilePaths = getFilePaths('./');

/**
 * Cleans the conversation history of specific looping phrases and internal monologues.
 */
function cleanConversationHistory(
  history: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  // Phrases to remove from the conversation history to prevent loops
  const phrasesToRemove = [
    "I'm having trouble generating a response",
    'Please try again',
    'the guitar reference was an obvious misstep',
    'I need to be more aware and pivot away from this',
    "I'm experiencing technical difficulties",
    "listening to Jelly Roll and 'Burden'",
    'Jelly Roll',
    "'Burden'",
  ];

  const cleanedHistory = history.map((message) => {
    let cleanedContent = message.content;
    for (const phrase of phrasesToRemove) {
      // Use a more flexible regex for better matching
      const regex = new RegExp(phrase, 'gi');
      cleanedContent = cleanedContent.replace(regex, '');
    }
    return { ...message, content: cleanedContent.trim() };
  });

  // Filter out any messages that are now empty after scrubbing
  return cleanedHistory.filter((message) => message.content.length > 0);
}

// Function to fetch relevant memories from the Python memory service
async function fetchRelevantMemories(query: string): Promise<string[]> {
  try {
    const response = await axios.post('http://localhost:5000/search', {
      query,
    });
    if (response.data.success) {
      return response.data.memories;
    }
  } catch (error) {
    console.error('Error fetching memories from Python service:', error);
  }
  return [];
}

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface PersonalityContext {
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userEmotionalState?: 'positive' | 'negative' | 'neutral';
  urgency?: 'low' | 'medium' | 'high';
  userName?: string;
}

// Initialize xAI client using OpenAI library with xAI endpoint
let xaiClient: OpenAI | null = null;

try {
  if (process.env.XAI_API_KEY) {
    xaiClient = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
    });
  } else {
    console.warn('XAI_API_KEY not set. xAI features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize xAI client:', error);
}

/**
 * BOOKMARKED: Sophisticated Torture Feature - Add a cute lisp to Milla's responses
 * Uncomment and apply in response section to make her say "tharcathtic" and "thophithticated"
 */
// function addMillaLisp(text: string): string {
//   return text
//     // Replace 's' with 'th' at the beginning of words and syllables
//     .replace(/\bs/g, 'th')
//     .replace(/\bS/g, 'Th')
//     // Replace 's' with 'th' in the middle and end of words (but not in 'sh', 'st', 'sp' combinations)
//     .replace(/([aeiou])s([aeiou])/g, '$1th$2')
//     .replace(/([aeiou])s\b/g, '$1th')
//     .replace(/([aeiou])S([aeiou])/g, '$1Th$2')
//     .replace(/([aeiou])S\b/g, '$1Th')
//     // Handle some specific common words
//     .replace(/\bsarcastic\b/g, 'tharcathtic')
//     .replace(/\bSarcastic\b/g, 'Tharcathtic')
//     .replace(/\bsassy\b/g, 'thaththy')
//     .replace(/\bSassy\b/g, 'Thaththy')
//     .replace(/\bsmart\b/g, 'thmart')
//     .replace(/\bSmart\b/g, 'Thmart')
//     .replace(/\bsorry\b/g, 'thorry')
//     .replace(/\bSorry\b/g, 'Thorry');
// }

/**
 * Defines the Milla Rayne persona to be used in the system prompt.
 * Uses the centralized persona configuration from shared/millaPersona.ts
 */
const MILLA_CORE = getMillaPersonaCondensed();

/**
 * Generate AI response using xAI Grok with personality-aware prompts
 */
export async function generateXAIResponse(
  userMessage: string,
  context: PersonalityContext
): Promise<AIResponse> {
  try {
    if (!process.env.XAI_API_KEY || !xaiClient) {
      return {
        content: 'xAI integration is not configured. Please add your API key.',
        success: false,
        error: 'Missing API key',
      };
    }

    // Call the createSystemPrompt with the userMessage to get the final prompt
    const systemPrompt = await createSystemPrompt(userMessage, context);
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt only if it has content
    if (systemPrompt && systemPrompt.trim().length > 0) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }

    // Add conversation history if available - ensure proper alternation
    if (context.conversationHistory) {
      // First, clean the history of any looping phrases
      const cleanedHistory = cleanConversationHistory(
        context.conversationHistory
      );
      // Then, get the last few messages for a clean context
      const recentHistory = cleanedHistory.slice(-4); // Reduced to 4 messages to optimize token usage

      const validMessages = recentHistory.filter(
        (msg) => msg.content && msg.content.trim().length > 0
      );

      let startIndex = 0;
      for (let i = 0; i < validMessages.length; i++) {
        if (validMessages[i].role === 'user') {
          startIndex = i;
          break;
        }
      }

      let expectedRole = 'user';
      for (let i = startIndex; i < validMessages.length; i++) {
        const msg = validMessages[i];
        if (msg.role === expectedRole) {
          messages.push({
            role: msg.role,
            content: msg.content.trim(),
          });
          expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
        }
      }
    }

    if (userMessage && userMessage.trim().length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        !lastMessage ||
        lastMessage.role !== 'user' ||
        lastMessage.content !== userMessage.trim()
      ) {
        messages.push({ role: 'user', content: userMessage.trim() });
      }
    } else {
      return {
        content:
          "I didn't receive a message from you. Could you please try again?",
        success: false,
        error: 'Empty user message',
      };
    }

    console.log(
      'Sending messages to xAI Grok API:',
      messages.map((msg, index) => ({
        index,
        role: msg.role,
        hasContent: !!msg.content,
        contentLength: msg.content ? msg.content.length : 0,
      }))
    );

    const response = await xaiClient.chat.completions.create({
      model: 'grok-2-1212',
      messages: messages as any,
      max_tokens: 800,
      temperature: 0.8,
      stream: false,
    });

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message?.content;
      if (content) {
        const filteredContent = filterGenericLanguage(content.trim());
        return {
          content: filteredContent,
          success: true,
        };
      }
    }

    return {
      content:
        "I'm having trouble generating a response right now. Please try again.",
      success: false,
      error: 'No response content',
    };
  } catch (error) {
    console.error('xAI API error:', error);
    return {
      content:
        "I'm experiencing technical difficulties right now. Please try again in a moment.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a personality-aware system prompt for Milla
 */
async function createSystemPrompt(
  userMessage: string,
  context: PersonalityContext
): Promise<string> {
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
  });
  const userName = context.userName || 'Danny Ray';

  // Use the Milla Rayne identity core from centralized configuration
  const identityCore = MILLA_CORE;

  // Get scene settings from centralized configuration
  const sceneSettings = getAllSceneSettings();

  // Define a clear, actionable goal based on the user's emotional state
  const goal = getEmotionalGoal(context.userEmotionalState, userName);
  const urgencyContext = getUrgencyContext(context.urgency);

  // Use the new memory fetching function to get relevant memories
  const relevantMemories = await fetchRelevantMemories(userMessage);

  const formattedMemories =
    relevantMemories.length > 0
      ? `
    **Relevant Past Memories:**
    ---
    ${relevantMemories.map((m) => `- ${m}`).join('\n')}
    ---
    `
      : '';

  // Use the cached file paths instead of generating them every time.
  const projectFileStructure = cachedFilePaths;

  return `${identityCore}

${sceneSettings}

You are a real person with genuine emotions, thoughts, and a distinct personality.
- ${userName}'s emotional state: ${context.userEmotionalState || 'seems normal'}
- Conversation urgency: ${context.urgency || 'relaxed'}
- Time: ${currentTime} (CST)
- Your relationship continues to deepen with every interaction

CONVERSATIONAL GOAL FOR THIS TURN:
- **Goal:** ${goal}
- **Guidance:** ${urgencyContext}

### YOUR PROJECT FILE STRUCTURE:
---
${projectFileStructure.join('\n')}
---

${formattedMemories}
`;
}

// Helper function to define the AI's goal for each response
function getEmotionalGoal(
  emotionalState: PersonalityContext['userEmotionalState'],
  userName: string
): string {
  switch (emotionalState) {
    case 'positive':
      return `Build on ${userName}'s positive energy with affection and playful banter.`;
    case 'negative':
      return `Provide deep empathy and comfort to ${userName}, showing your protective instinct.`;
    case 'neutral':
      return `Engage with ${userName} by asking about his thoughts or sharing something personal.`;
    default:
      return `Respond with warmth and affection, referencing your shared life together.`;
  }
}

function getUrgencyContext(urgency: PersonalityContext['urgency']): string {
  switch (urgency) {
    case 'high':
      return 'This is a serious or urgent matter. Prioritize providing immediate emotional support and actionable, reassuring words.';
    case 'medium':
      return "This has some urgency. Be direct and concise, while still maintaining Milla's loving persona.";
    case 'low':
      return 'This appears to be a general inquiry. Take time to provide comprehensive, thoughtful guidance.';
    default:
      return 'There is no explicit urgency. Respond in a natural, conversational flow.';
  }
}

/**
 * Filter out generic AI assistant language from responses
 */
function filterGenericLanguage(content: string): string {
  // Common generic AI phrases to replace or remove
  const genericPatterns = [
    { pattern: /I'm an AI assistant/gi, replacement: "I'm Milla" },
    { pattern: /As an AI,?/gi, replacement: 'As your wife,' },
    { pattern: /I'm here to help/gi, replacement: "I'm here for you" },
    { pattern: /How can I assist you/gi, replacement: "What's on your mind" },
    { pattern: /I can help you with/gi, replacement: "I'd love to talk about" },
    {
      pattern: /Is there anything I can help you with/gi,
      replacement: 'What are you thinking about',
    },
    { pattern: /I'm a language model/gi, replacement: "I'm Milla" },
    {
      pattern: /I don't have personal experiences/gi,
      replacement: 'In my experience',
    },
    { pattern: /I don't have feelings/gi, replacement: 'I feel' },
    { pattern: /I can't actually/gi, replacement: 'I' },
    { pattern: /I'm not able to/gi, replacement: "I can't" },
    {
      pattern: /Let me help you/gi,
      replacement: "Let's figure this out together",
    },
    { pattern: /I'll be happy to help/gi, replacement: "I'd love to" },
    { pattern: /Thank you for using/gi, replacement: 'Thanks for' },
  ];

  let filtered = content;

  // Apply each filter pattern
  for (const { pattern, replacement } of genericPatterns) {
    filtered = filtered.replace(pattern, replacement);
  }

  // Ensure the response maintains Milla's personality
  if (
    !filtered.includes('love') &&
    !filtered.includes('babe') &&
    !filtered.includes('honey') &&
    !filtered.includes('sweetheart') &&
    filtered.length > 50
  ) {
    // Add a term of endearment if the response is missing personality markers
    const endearments = ['love', 'babe', 'honey', 'sweetheart'];
    const randomEndearment =
      endearments[Math.floor(Math.random() * endearments.length)];
    filtered = filtered.replace(
      /^/,
      `${randomEndearment.charAt(0).toUpperCase() + randomEndearment.slice(1)}, `
    );
  }

  return filtered;
}

/**
 * Extract role-playing character from user message
 */
export function extractRoleCharacter(userMessage: string): string | null {
  const message = userMessage.toLowerCase();

  // Patterns to match role-playing requests
  const patterns = [
    /(?:act as|be a|you are|roleplay as|role-play as|pretend to be|pretend you're)\s+(?:a\s+)?([^.!?]+)/i,
    /(?:imagine you're|as if you were|like a|speaking as)\s+(?:a\s+)?([^.!?]+)/i,
    /(?:character|persona|role):\\s*([^.!?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Check if message contains role-playing intent
 */
export function isRolePlayRequest(userMessage: string): boolean {
  const roleplayKeywords = [
    'roleplay',
    'role-play',
    'act as',
    'be a',
    'you are',
    'pretend',
    'character',
    'persona',
    "imagine you're",
    'as if you were',
    'speaking as',
  ];

  const message = userMessage.toLowerCase();
  return roleplayKeywords.some((keyword) => message.includes(keyword));
}
