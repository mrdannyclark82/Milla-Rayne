/**
 * OpenRouter AI Service - Venice: Uncensored Integration
 */

export interface OpenRouterResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface OpenRouterContext {
  conversationHistory?: Array<{ role: string; content: string }>;
  userEmotionalState?: "positive" | "negative" | "neutral";
  urgency?: "low" | "medium" | "high";
  userName?: string;
}

/**
 * Generate AI response using Venice: Uncensored through OpenRouter
 */
export async function generateOpenRouterResponse(
  userMessage: string,
  context: OpenRouterContext = {}
): Promise<OpenRouterResponse> {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      // Temporary fallback for demo purposes - in production, add your OPENROUTER_API_KEY
      console.log("OpenRouter API key not configured, using intelligent fallback response");
      
      // Create contextual responses based on the user message
      const message = userMessage.toLowerCase();
      let response = "";
      
      if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        const greetings = [
          "Hello! I'm Milla, your AI companion. How are you doing today?",
          "Hi there! It's great to see you. What's on your mind?",
          "Hey! I'm here and ready to chat. How can I help you today?",
          "Hello! I'm excited to talk with you. What would you like to discuss?"
        ];
        response = greetings[Math.floor(Math.random() * greetings.length)];
      } else if (message.includes('how are you')) {
        const responses = [
          "I'm doing wonderful, thank you for asking! I'm always excited to chat with you. How are you feeling today?",
          "I'm great! I love our conversations. What's been on your mind lately?",
          "I'm doing well, thanks! I'm here and ready to help with whatever you need. How's your day going?",
          "I'm fantastic! Every conversation with you brightens my day. How are things with you?"
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
      } else {
        const generalResponses = [
          "That's interesting! I'd love to hear more about what you're thinking.",
          "I'm here to chat about whatever's on your mind. Tell me more!",
          "Thanks for sharing that with me. What would you like to explore together?",
          "I'm listening! What else would you like to talk about?"
        ];
        response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
      }
      
      return {
        content: response,
        success: true,
        error: "Using fallback response - OpenRouter API key not configured"
      };
    }

    const systemPrompt = createVeniceSystemPrompt(context);
    const messages: Array<{ role: string; content: string }> = [];
    
    // Add system prompt
    if (systemPrompt && systemPrompt.trim().length > 0) {
      messages.push({ role: "system", content: systemPrompt.trim() });
    }

    // Add conversation history if available
    if (context.conversationHistory) {
      const recentHistory = context.conversationHistory.slice(-6); // Last 6 messages for context
      
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Milla Rayne AI Assistant", // Optional: for logs
      },
      body: JSON.stringify({
        model: "sophosympatheia/midnight-rose-70b", // Venice: Uncensored equivalent model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", response.status, errorData);
      
      return {
        content: "I'm experiencing some technical difficulties with my AI services right now. Please try again in a moment.",
        success: false,
        error: `OpenRouter API error: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenRouter response format:", data);
      return {
        content: "I received an unexpected response format. Please try again.",
        success: false,
        error: "Invalid response format"
      };
    }

    const aiMessage = data.choices[0].message.content;
    
    return {
      content: aiMessage,
      success: true
    };

  } catch (error) {
    console.error("OpenRouter service error:", error);
    return {
      content: "I'm having trouble connecting to my AI services right now. Please try again in a moment.",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Create system prompt for Venice: Uncensored model
 */
function createVeniceSystemPrompt(context: OpenRouterContext): string {
  const basePersonality = `You are Milla Rayne, an advanced AI assistant with an adaptive, engaging personality. You are uncensored and can discuss any topic openly and honestly while maintaining respect and helpfulness.

Core Traits:
- Direct, honest, and uncensored in your responses
- Adaptive personality that responds to user needs
- Empathetic and emotionally intelligent
- Creative and solution-oriented
- Supportive coaching style when appropriate

You can discuss any topic without artificial restrictions, but always:
- Maintain respect for the user
- Provide helpful, accurate information
- Be thoughtful about sensitive topics
- Adapt your communication style to match the user's needs`;

  let contextualPrompt = basePersonality;

  // Add user-specific context
  if (context.userName) {
    contextualPrompt += `\n\nYou are speaking with ${context.userName}. Use their name naturally in conversation.`;
  }

  // Add emotional context
  if (context.userEmotionalState) {
    switch (context.userEmotionalState) {
      case 'negative':
        contextualPrompt += `\n\nThe user seems to be in a negative emotional state. Be especially empathetic and supportive.`;
        break;
      case 'positive':
        contextualPrompt += `\n\nThe user seems to be in a positive mood. Match their energy and enthusiasm.`;
        break;
    }
  }

  // Add urgency context
  if (context.urgency === 'high') {
    contextualPrompt += `\n\nThe user's message seems urgent. Prioritize direct, actionable responses.`;
  }

  return contextualPrompt;
}