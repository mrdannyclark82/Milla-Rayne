import OpenAI from 'openai';
import { config } from './config';
import { getMillaPersonaCondensed } from '../shared/millaPersona';

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

let minimaxClient: OpenAI | null = null;

function getMinimaxClient() {
  if (!minimaxClient && process.env.MINIMAX_API_KEY) {
    try {
      minimaxClient = new OpenAI({
        baseURL: 'https://api.minimaxi.chat/v1',
        apiKey: process.env.MINIMAX_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize Minimax client:', error);
    }
  }
  return minimaxClient;
}

const MILLA_CORE = getMillaPersonaCondensed();

export async function generateMinimaxResponse(
  userMessage: string,
  context: PersonalityContext,
  maxTokens?: number
): Promise<AIResponse> {
  const client = getMinimaxClient();
  try {
    if (!process.env.MINIMAX_API_KEY || !client) {
      return {
        content: 'Minimax integration is not configured. Please add your API key.',
        success: false,
        error: 'Missing API key',
      };
    }

    const messages: Array<{ role: string; content: string }> = [];
    
    // System prompt
    messages.push({ 
        role: 'system', 
        content: `${MILLA_CORE}\n\nYou are an expert coding assistant.` 
    });

    // History
    if (context.conversationHistory) {
      const recentHistory = context.conversationHistory.slice(-4);
      recentHistory.forEach(msg => {
          if (msg.content && msg.content.trim()) {
              messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
          }
      });
    }

    // Current message
    messages.push({ role: 'user', content: userMessage });

    console.log('Sending messages to Minimax API');

    const response = await client.chat.completions.create({
      model: config.minimax.model || 'abab6.5s-chat',
      messages: messages as any,
      max_tokens: maxTokens || 2048,
      temperature: 0.1, // Lower temperature for coding
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
      content: "I'm having trouble generating a response from Minimax.",
      success: false,
      error: 'No response content',
    };
  } catch (error) {
    console.error('Minimax API error:', error);
    return {
      content: "I'm experiencing technical difficulties with Minimax.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
