/**
 * OpenRouter AI Service - Venice and DeepSeek Chat Integration
 */

import { ScreenShare } from 'lucide-react';
import { getMillaPersona } from '../shared/millaPersona';
import { getAllSceneSettings } from '../shared/sceneSettings';

export interface OpenRouterResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface OpenRouterContext {
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userEmotionalState?: 'positive' | 'negative' | 'neutral';
  urgency?: 'low' | 'medium' | 'high';
  userName?: string;
}

/**
 * Generate AI response using Venice and DeepSeek Chat through OpenRouter
 */
export async function generateOpenRouterResponse(
  userMessage: string,
  context: OpenRouterContext = {}
): Promise<OpenRouterResponse> {
  try {
    // Prefer a Venice-specific key if provided (OPENROUTER_VENICE_API_KEY), otherwise fall back to OPENROUTER_API_KEY
    const openrouterKey =
      process.env.OPENROUTER_VENICE_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!openrouterKey || openrouterKey === 'your_openrouter_api_key_here') {
      // Temporary fallback for demo purposes - in production, add your OPENROUTER_VENICE_API_KEY or OPENROUTER_API_KEY
      console.log(
        'OpenRouter API key (venice or default) not configured, using intelligent fallback response'
      );

      // Create contextual responses based on the user message
      const message = userMessage.toLowerCase();
      let response = '';

      if (
        message.includes('hello') ||
        message.includes('hi') ||
        message.includes('hey')
      ) {
        const greetings = [
          "Hello! I'm Milla, your AI companion. How are you doing today?",
          "Hi there! It's great to see you. What's on your mind?",
          "Hey! I'm here and ready to chat. How can I help you today?",
          "Hello! I'm excited to talk with you. What would you like to discuss?",
        ];
        response = greetings[Math.floor(Math.random() * greetings.length)];
      } else if (message.includes('how are you')) {
        const responses = [
          "I'm doing wonderful, thank you for asking! I'm always excited to chat with you. How are you feeling today?",
          "I'm great! I love our conversations. What's been on your mind lately?",
          "I'm doing well, thanks! I'm here and ready to help with whatever you need. How's your day going?",
          "I'm fantastic! Every conversation with you brightens my day. How are things with you?",
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
      } else {
        const generalResponses = [
          "That's interesting! I'd love to hear more about what you're thinking.",
          "I'm here to chat about whatever's on your mind. Tell me more!",
          'Thanks for sharing that with me. What would you like to explore together?',
          "I'm listening! What else would you like to talk about?",
        ];
        response =
          generalResponses[Math.floor(Math.random() * generalResponses.length)];
      }

      return {
        content: response,
        success: false, // Return false so other services can be tried as fallback
        error: 'Using fallback response - OpenRouter API key not configured',
      };
    }

    const systemPrompt = createDeepSeekSystemPrompt(context);
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt
    if (systemPrompt && systemPrompt.trim().length > 0) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }

    // Add conversation history if available - ensure proper alternation and content validation
    if (context.conversationHistory) {
      const recentHistory = context.conversationHistory.slice(-2); // Reduced to 2 messages (1 exchange) for shorter context

      // Filter out empty messages and ensure proper alternation
      const validMessages = recentHistory.filter(
        (msg) =>
          msg.content &&
          msg.content.trim().length > 0 &&
          (msg.role === 'user' || msg.role === 'assistant')
      );

      // Find the start of a proper user->assistant pattern
      let startIndex = 0;
      for (let i = 0; i < validMessages.length; i++) {
        if (validMessages[i].role === 'user') {
          startIndex = i;
          break;
        }
      }

      // Add messages starting from proper user message, maintaining alternation
      let expectedRole = 'user';
      for (let i = startIndex; i < validMessages.length; i++) {
        const msg = validMessages[i];
        if (msg.role === expectedRole && msg.content.trim()) {
          messages.push({
            role: msg.role,
            content: msg.content.trim(),
          });
          expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
        }
      }
    }

    // Add current user message - check for duplicates and ensure it's not empty
    if (userMessage && userMessage.trim().length > 0) {
      // Check if the last message in our array is from user - if so, don't duplicate
      const lastMessage = messages[messages.length - 1];
      if (
        !lastMessage ||
        lastMessage.role !== 'user' ||
        lastMessage.content !== userMessage.trim()
      ) {
        messages.push({ role: 'user', content: userMessage.trim() });
      }
    } else {
      console.error('OpenRouter: Empty user message received');
      return {
        content:
          "I didn't receive a message from you. Could you please try again?",
        success: false,
        error: 'Empty user message',
      };
    }

    // Debug: Log the messages array for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'OpenRouter messages:',
        messages.map((msg, index) => ({
          index,
          role: msg.role,
          hasContent: !!msg.content,
          contentLength: msg.content ? msg.content.length : 0,
          preview: msg.content ? msg.content.substring(0, 50) + '...' : '',
        }))
      );
    }

    // Try Venice Dolphin-Mistral first
    let response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Milla Rayne AI Assistant', // Optional: for logs
        },
        body: JSON.stringify({
          model:
            'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', // Venice (Dolphin Mistral 24B - Venice edition) via OpenRouter
          messages: messages,
          temperature: 0.8, // Increased for more variety
          max_tokens: 400, // Reduced to encourage shorter, more focused responses
          top_p: 0.9, // Reduced for better focus while maintaining variety
          frequency_penalty: 0.6, // Added to reduce repetitive phrases
          presence_penalty: 0.4, // Added to encourage new topics/approaches
        }),
      }
    );

    // If Venice fails, fallback to DeepSeek
    if (!response.ok) {
      console.warn('Venice model failed, falling back to DeepSeek');
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'Milla Rayne AI Assistant',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3.1:free',
          messages: messages,
          temperature: 0.8,
          max_tokens: 1000,
          top_p: 0.9,
          frequency_penalty: 0.6,
          presence_penalty: 0.4,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', response.status, errorData);

      return {
        content:
          "I'm experiencing some technical difficulties with my AI services right now. Please try again in a moment.",
        success: false,
        error: `OpenRouter API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenRouter response format:', data);
      return {
        content: 'I received an unexpected response format. Please try again.',
        success: false,
        error: 'Invalid response format',
      };
    }

    const aiMessage = data.choices[0].message.content;

    return {
      content: aiMessage,
      success: true,
    };
  } catch (error) {
    console.error('OpenRouter service error:', error);
    return {
      content:
        "I'm having trouble connecting to my AI services right now. Please try again in a moment.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create system prompt for DeepSeek Chat model
 */
function createDeepSeekSystemPrompt(context: OpenRouterContext): string {
  // Use centralized persona and scene settings
  const basePersonality = getMillaPersona();
  const sceneSettings = getAllSceneSettings();

  // Combine persona with scene settings and add the new response style instruction
  let contextualPrompt = `${basePersonality}\n\n${sceneSettings}`;

  // Add response style instruction
  contextualPrompt += `\n\n**Response Style:** Keep your responses concise and natural, typically 2-4 sentences, unless the user asks for detailed information. Focus on being a conversational partner.`;

  // Add user-specific context
  if (context.userName) {
    contextualPrompt += `\n\nYou are speaking with ${context.userName}. Use their name naturally in conversation.`;
  }

  // Add emotional context
  if (context.userEmotionalState) {
    switch (context.userEmotionalState) {
      case 'negative':
        contextualPrompt += `\n\nThe user seems to be in a negative emotional state.Be especially empathetic and supportive.`;
        break;
      case 'positive':
        contextualPrompt += `\n\nThe user seems to be in a positive mood.Match their energy and enthusiasm.`;
        break;
    }
  }

  // Add urgency context
  if (context.urgency === 'high') {
    contextualPrompt += `\n\nThe user's message seems urgent. Prioritize direct, actionable responses.`;
  }

  return contextualPrompt;
}
