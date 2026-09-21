import OpenAI from 'openai';
import { config } from './config';
import type { PersonalityContext } from './openaiService';
import { createSystemPrompt } from './openaiService';

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

// Initialize OpenAI client lazily
function createClient(): OpenAI | null {
  const apiKey = config.openai.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) return null;
  return new OpenAI({ apiKey });
}

/**
 * Generate a chat response using OpenAI's Chat Completions API.
 * This is a minimal wrapper used when the application is configured to
 * use OpenAI as the default chat provider.
 */
export async function generateOpenAIResponse(
  userMessage: string,
  // Accept either a conversation history (legacy callers) or a full PersonalityContext
  conversationHistoryOrContext:
    | Array<{ role: 'user' | 'assistant'; content: string }>
    | PersonalityContext = [],
  userNameOrMaxTokens: string | number = 'Danny Ray',
  maxTokensArg: number = 1024
): Promise<AIResponse> {
  try {
    const client = createClient();
    if (!client) {
      return {
        content: 'OpenAI API key not configured',
        success: false,
        error: 'Missing OPENAI_API_KEY',
      };
    }
    // Normalize parameters to a PersonalityContext and conversationHistory
    let conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
    }> = [];
    let userName = 'Danny Ray';
    let maxTokens = maxTokensArg || 1024;
    let personaContext: PersonalityContext = {} as PersonalityContext;

    if (Array.isArray(conversationHistoryOrContext)) {
      conversationHistory = conversationHistoryOrContext;
      if (typeof userNameOrMaxTokens === 'string')
        userName = userNameOrMaxTokens;
      if (typeof userNameOrMaxTokens === 'number')
        maxTokens = userNameOrMaxTokens;
      personaContext = { conversationHistory, userName } as PersonalityContext;
    } else {
      // It's a PersonalityContext
      personaContext = conversationHistoryOrContext as PersonalityContext;
      conversationHistory = personaContext.conversationHistory || [];
      if (personaContext.userName) userName = personaContext.userName;
      if (typeof userNameOrMaxTokens === 'number')
        maxTokens = userNameOrMaxTokens;
    }

    // Build the full system prompt using the project's Milla persona
    const systemPrompt = createSystemPrompt(personaContext);

    // Build messages: include last few conversation messages for context
    const recent = conversationHistory
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...recent,
      { role: 'user', content: userMessage },
    ];

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const resp = await client.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: maxTokens,
      temperature: 0.8,
    });

    const content = resp?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        content: "I couldn't generate a response right now.",
        success: false,
        error: 'No content',
      };
    }

    return { content: String(content).trim(), success: true };
  } catch (err: any) {
    console.error('OpenAI chat error:', err);
    return {
      content: "I'm having trouble connecting to OpenAI right now.",
      success: false,
      error: err?.message || String(err),
    };
  }
}

export default generateOpenAIResponse;
