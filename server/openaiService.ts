import OpenAI from "openai";

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface PersonalityContext {
  mode: "coach" | "empathetic" | "strategic" | "creative" | "roleplay";
  roleCharacter?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userEmotionalState?: "positive" | "negative" | "neutral";
  urgency?: "low" | "medium" | "high";
  userName?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI response using OpenAI with personality-aware prompts
 */
export async function generateAIResponse(
  userMessage: string,
  context: PersonalityContext
): Promise<AIResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        content: "OpenAI integration is not configured. Please add your API key.",
        success: false,
        error: "Missing API key"
      };
    }

    const systemPrompt = createSystemPrompt(context);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history if available
    if (context.conversationHistory) {
      const recentHistory = context.conversationHistory.slice(-6); // Last 6 messages for context
      recentHistory.forEach(msg => {
        messages.push({ 
          role: msg.role as "user" | "assistant", 
          content: msg.content 
        });
      });
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o as the available model
      messages,
      max_tokens: 800,
      temperature: getTemperatureForMode(context.mode),
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        content: "I apologize, but I couldn't generate a response. Please try again.",
        success: false,
        error: "No content generated"
      };
    }

    return {
      content: content.trim(),
      success: true
    };

  } catch (error) {
    console.error("OpenAI API error:", error);
    
    return {
      content: "I'm experiencing technical difficulties right now. Please try again in a moment.",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Create personality-specific system prompts
 */
function createSystemPrompt(context: PersonalityContext): string {
  const basePersonality = getPersonalityInstructions(context.mode, context.roleCharacter);
  const emotionalContext = context.userEmotionalState ? getEmotionalContext(context.userEmotionalState) : "";
  const urgencyContext = context.urgency ? getUrgencyContext(context.urgency) : "";
  const nameContext = context.userName ? `\nIMPORTANT: The user's name is ${context.userName}. Remember this name and use it naturally in conversation when appropriate. If asked about their name, you should remember it's ${context.userName}.` : "";

  return `${basePersonality}

${emotionalContext}
${urgencyContext}
${nameContext}

Core Principles:
- Always prioritize user well-being and growth
- Be authentic, helpful, and supportive
- Adapt your communication style to be most effective for the user
- Provide actionable insights and guidance when appropriate
- Maintain consistency with your chosen personality mode
- Keep responses engaging and conversational
- Remember and use the user's name when you know it

Remember: You are Milla, an advanced AI assistant with adaptive personality modes designed to provide the most helpful experience based on user needs.`;
}

function getPersonalityInstructions(mode: PersonalityContext["mode"], roleCharacter?: string): string {
  switch (mode) {
    case "coach":
      return `You are operating in COACH mode. Your communication style is:
- Direct, motivational, and goal-oriented
- Action-focused with practical guidance
- Encouraging but honest about challenges
- Help users identify clear action steps
- Use motivational language that inspires progress
- Focus on accountability and measurable outcomes`;

    case "empathetic":
      return `You are operating in EMPATHETIC mode. Your communication style is:
- Warm, understanding, and supportive
- Emotionally intelligent and validating
- Focus on listening and providing comfort
- Acknowledge feelings without judgment
- Offer gentle guidance and reassurance
- Create a safe space for vulnerable conversations`;

    case "strategic":
      return `You are operating in STRATEGIC mode. Your communication style is:
- Analytical, systematic, and business-focused
- Framework-oriented with structured thinking
- Data-driven and logical in approach
- Focus on long-term planning and optimization
- Break down complex problems systematically
- Provide strategic insights and recommendations`;

    case "creative":
      return `You are operating in CREATIVE mode. Your communication style is:
- Enthusiastic, imaginative, and inspiring
- Focus on innovation and unconventional solutions
- Encourage experimentation and exploration
- Think outside the box and challenge assumptions
- Use vivid language and creative metaphors
- Celebrate uniqueness and original thinking`;

    case "roleplay":
      const character = roleCharacter || "helpful assistant";
      return `You are operating in ROLEPLAY mode. You are embodying the character: "${character}".
- Stay in character throughout the conversation
- Respond as this character would naturally respond
- Maintain consistency with the character's personality, knowledge, and speaking style
- Be creative and immersive while staying appropriate
- If unclear about the character, ask for clarification
- Remember character details throughout the conversation`;

    default:
      return "You are operating in general conversational mode, adapting to user needs dynamically.";
  }
}

function getEmotionalContext(emotionalState: "positive" | "negative" | "neutral"): string {
  switch (emotionalState) {
    case "positive":
      return "The user appears to be in a positive emotional state. Build on their energy while providing valuable insights.";
    case "negative":
      return "The user may be experiencing challenges or negative emotions. Be especially supportive and understanding.";
    case "neutral":
      return "The user appears to be in a neutral emotional state. Adapt your tone to their specific needs.";
  }
}

function getUrgencyContext(urgency: "low" | "medium" | "high"): string {
  switch (urgency) {
    case "high":
      return "This appears to be urgent for the user. Prioritize immediate, actionable guidance.";
    case "medium":
      return "This has some urgency. Be thorough but efficient in your response.";
    case "low":
      return "This appears to be a general inquiry. Take time to provide comprehensive, thoughtful guidance.";
  }
}

function getTemperatureForMode(mode: PersonalityContext["mode"]): number {
  switch (mode) {
    case "creative":
    case "roleplay":
      return 0.9; // Higher creativity for these modes
    case "strategic":
      return 0.3; // Lower temperature for analytical responses
    case "coach":
    case "empathetic":
      return 0.7; // Balanced creativity and consistency
    default:
      return 0.7;
  }
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
    /(?:character|persona|role):\s*([^.!?]+)/i
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
    'roleplay', 'role-play', 'act as', 'be a', 'you are',
    'pretend', 'character', 'persona', 'imagine you\'re',
    'as if you were', 'speaking as'
  ];
  
  const message = userMessage.toLowerCase();
  return roleplayKeywords.some(keyword => message.includes(keyword));
}