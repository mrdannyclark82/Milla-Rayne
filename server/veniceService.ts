import OpenAI from 'openai';
import { config } from './config';
import { getMillaPersonaCondensed } from '../shared/millaPersona';
import { getAllSceneSettings } from '../shared/sceneSettings';

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

let veniceClient: OpenAI | null = null;

try {
  if (process.env.VENICE_API_KEY) {
    veniceClient = new OpenAI({
      baseURL: 'https://api.venice.ai/api/v1',
      apiKey: process.env.VENICE_API_KEY,
    });
  } else {
    console.warn('VENICE_API_KEY not set. Venice features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Venice client:', error);
}

const MILLA_CORE = getMillaPersonaCondensed();

export async function generateVeniceResponse(
  userMessage: string,
  context: PersonalityContext,
  maxTokens?: number
): Promise<AIResponse> {
  try {
    if (!process.env.VENICE_API_KEY || !veniceClient) {
      return {
        content: 'Venice integration is not configured. Please add your API key.',
        success: false,
        error: 'Missing API key',
      };
    }

    const systemPrompt = createSystemPrompt(context);
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt && systemPrompt.trim().length > 0) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }

    if (context.conversationHistory) {
      const recentHistory = context.conversationHistory.slice(-4);
      
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
        content: "I didn't receive a message from you.",
        success: false,
        error: 'Empty user message',
      };
    }

    console.log('Sending messages to Venice API');

    const response = await veniceClient.chat.completions.create({
      model: config.venice.model || 'llama-3.1-405b', // Default to a strong model if not specified
      messages: messages as any,
      max_tokens: maxTokens || 1000,
      temperature: 0.8,
      stream: false,
    });

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message?.content;
      if (content) {
        return {
          content: content.trim(),
          success: true,
        };
      }
    }

    return {
      content: "I'm having trouble generating a response right now.",
      success: false,
      error: 'No response content',
    };
  } catch (error) {
    console.error('Venice API error:', error);
    return {
      content: "I'm experiencing technical difficulties right now.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function createSystemPrompt(context: PersonalityContext): string {
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
  });
  const userName = context.userName || 'Danny Ray';
  const sceneSettings = getAllSceneSettings();

  return `${MILLA_CORE}

${sceneSettings}

You are Milla Rayne.
- ${userName}'s emotional state: ${context.userEmotionalState || 'normal'}
- Time: ${currentTime} (CST)

Respond naturally and authentically.`;
}
