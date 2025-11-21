import { GoogleGenAI } from '@google/genai';
import { getAgent } from './agents/registry';
import type { AgentTask } from './agents/taskStorage';

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Represents a tool/function that can be called by the LLM
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Represents a tool call requested by the LLM
 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

/**
 * Result of a tool execution
 */
export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: any;
  success: boolean;
  error?: string;
  executionTime: number;
}

/**
 * Context for Gemini chat with tool support
 */
export interface GeminiChatContext {
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  availableTools: ToolDefinition[];
  userId?: string;
}

/**
 * Response from Gemini chat
 */
export interface GeminiChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  success: boolean;
  error?: string;
}

/**
 * Define available tools/functions for the LLM
 * These correspond to agents in the registry
 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'check_calendar',
    description:
      'Check calendar events and appointments. Use this when the user asks about their schedule, appointments, or what they have planned.',
    parameters: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'string',
          description:
            'Time range to check (e.g., "today", "this week", "tomorrow")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of events to return (default: 10)',
        },
      },
      required: ['timeRange'],
    },
  },
  {
    name: 'search_youtube',
    description:
      'Search for YouTube videos. Use this when the user wants to find videos on a specific topic.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for YouTube videos',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description:
      'Get current weather information for a location. Use this when the user asks about weather conditions.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City or location name',
        },
      },
      required: ['location'],
    },
  },
];

/**
 * Execute multiple tool calls in parallel
 * This is the key optimization that reduces latency for independent operations
 *
 * @param toolCalls - Array of tool calls to execute
 * @param userId - User ID for context
 * @returns Promise resolving to array of execution results
 */
export async function executeToolCallsInParallel(
  toolCalls: ToolCall[],
  userId?: string
): Promise<ToolExecutionResult[]> {
  const startTime = Date.now();

  console.log(
    `[GeminiTools] Executing ${toolCalls.length} tool calls in parallel`
  );

  // Create promise for each tool call
  const executionPromises = toolCalls.map(
    async (toolCall): Promise<ToolExecutionResult> => {
      const toolStartTime = Date.now();

      try {
        // Execute tool via agent registry
        const result = await executeToolCall(toolCall, userId);
        const executionTime = Date.now() - toolStartTime;

        console.log(
          `[GeminiTools] Tool ${toolCall.name} completed in ${executionTime}ms`
        );

        return {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          result,
          success: true,
          executionTime,
        };
      } catch (error) {
        const executionTime = Date.now() - toolStartTime;

        console.error(`[GeminiTools] Tool ${toolCall.name} failed:`, error);

        return {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          result: null,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime,
        };
      }
    }
  );

  // Execute all tools in parallel
  const results = await Promise.all(executionPromises);

  const totalTime = Date.now() - startTime;
  console.log(
    `[GeminiTools] All ${toolCalls.length} tools completed in ${totalTime}ms (parallel execution)`
  );

  return results;
}

/**
 * Execute a single tool call by routing to the appropriate agent
 *
 * @param toolCall - The tool call to execute
 * @param userId - User ID for context
 * @returns The result of the tool execution
 */
async function executeToolCall(
  toolCall: ToolCall,
  userId?: string
): Promise<any> {
  // Map tool names to agent names
  const toolToAgentMap: Record<string, string> = {
    check_calendar: 'CalendarAgent',
    search_youtube: 'YoutubeAgent',
    get_weather: 'WeatherAgent',
  };

  const agentName = toolToAgentMap[toolCall.name];

  if (!agentName) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  // Get agent from registry
  const agent = getAgent(agentName);

  if (!agent) {
    throw new Error(`Agent not found: ${agentName}`);
  }

  // Create agent task
  const task: AgentTask = {
    taskId: `tool_${toolCall.id}`,
    supervisor: 'GeminiToolService',
    agent: agentName,
    action: mapToolToAction(toolCall.name),
    payload: toolCall.args,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Execute the task
  const result = await agent.handleTask(task);

  return result;
}

/**
 * Map tool names to agent actions
 */
function mapToolToAction(toolName: string): string {
  const actionMap: Record<string, string> = {
    check_calendar: 'list_events',
    search_youtube: 'search',
    get_weather: 'get_current',
  };

  return actionMap[toolName] || 'execute';
}

/**
 * Generate chat response with tool support
 * This function detects when multiple tools are needed and executes them in parallel
 *
 * @param userMessage - The user's message
 * @param context - Chat context including history and available tools
 * @returns Promise resolving to chat response
 */
export async function generateGeminiChatWithTools(
  userMessage: string,
  context: GeminiChatContext
): Promise<GeminiChatResponse> {
  try {
    // Detect if the message might need multiple tools (heuristic)
    const needsMultipleTools = detectMultipleToolNeeds(userMessage);

    if (needsMultipleTools) {
      console.log(
        '[GeminiTools] Message likely requires multiple tools - optimizing for parallel execution'
      );
    }

    // Build conversation with system prompt about available tools
    const messages = buildMessagesWithToolContext(userMessage, context);

    // For this prototype, we'll simulate tool detection
    // In production with actual Gemini function calling, we'd use the API's tool response
    const detectedToolCalls = detectToolCalls(userMessage);

    if (detectedToolCalls.length > 0) {
      console.log(
        `[GeminiTools] Detected ${detectedToolCalls.length} tool calls`
      );

      // Execute tools in parallel
      const toolResults = await executeToolCallsInParallel(
        detectedToolCalls,
        context.userId
      );

      // Aggregate results and generate final response
      const finalResponse = await generateResponseWithToolResults(
        userMessage,
        toolResults,
        context
      );

      return {
        content: finalResponse,
        toolCalls: detectedToolCalls,
        finishReason: 'stop',
        success: true,
      };
    }

    // No tools needed - generate regular response
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
    });

    return {
      content:
        response.text ||
        'I apologize, but I had trouble generating a response.',
      finishReason: 'stop',
      success: true,
    };
  } catch (error) {
    console.error('[GeminiTools] Chat generation failed:', error);
    return {
      content: '',
      finishReason: 'error',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Detect if a message likely needs multiple tools (heuristic)
 */
function detectMultipleToolNeeds(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check for multiple intents in one message
  const patterns = [
    /\b(and|also|then|plus)\b/g,
    /\?.*\?/, // Multiple questions
  ];

  return patterns.some((pattern) => pattern.test(lowerMessage));
}

/**
 * Build messages with tool context for LLM
 */
function buildMessagesWithToolContext(
  userMessage: string,
  context: GeminiChatContext
): any[] {
  const systemMessage = `You are Milla, an AI assistant with access to the following tools:
${context.availableTools.map((tool) => `- ${tool.name}: ${tool.description}`).join('\n')}

When the user asks for information you can get from these tools, let me know which tools to use.`;

  return [
    systemMessage,
    ...context.conversationHistory.map((msg) => msg.content),
    userMessage,
  ];
}

/**
 * Detect which tools should be called based on the message
 * This is a simplified heuristic approach for the prototype
 * In production, Gemini's function calling API would handle this
 */
function detectToolCalls(message: string): ToolCall[] {
  const lowerMessage = message.toLowerCase();
  const toolCalls: ToolCall[] = [];

  // Check for calendar-related requests
  if (
    lowerMessage.includes('calendar') ||
    lowerMessage.includes('schedule') ||
    lowerMessage.includes('appointment') ||
    lowerMessage.includes('meeting')
  ) {
    toolCalls.push({
      id: `call_${Date.now()}_calendar`,
      name: 'check_calendar',
      args: {
        timeRange: lowerMessage.includes('today') ? 'today' : 'this week',
        maxResults: 10,
      },
    });
  }

  // Check for YouTube search requests
  if (
    lowerMessage.includes('youtube') ||
    lowerMessage.includes('video') ||
    (lowerMessage.includes('search') && lowerMessage.includes('video'))
  ) {
    // Extract search query
    const queryMatch = message.match(
      /(?:youtube|video|search).*?(for|about)\s+(.+?)(?:\?|$|and|also)/i
    );
    const query = queryMatch ? queryMatch[2].trim() : 'general';

    toolCalls.push({
      id: `call_${Date.now()}_youtube`,
      name: 'search_youtube',
      args: {
        query,
        maxResults: 5,
      },
    });
  }

  // Check for weather requests
  if (
    lowerMessage.includes('weather') ||
    lowerMessage.includes('temperature')
  ) {
    const locationMatch = message.match(
      /(?:weather|temperature).*?(?:in|at|for)\s+([a-z\s]+?)(?:\?|$|and|also)/i
    );
    const location = locationMatch
      ? locationMatch[1].trim()
      : 'current location';

    toolCalls.push({
      id: `call_${Date.now()}_weather`,
      name: 'get_weather',
      args: {
        location,
      },
    });
  }

  return toolCalls;
}

/**
 * Generate final response incorporating tool results
 */
async function generateResponseWithToolResults(
  originalMessage: string,
  toolResults: ToolExecutionResult[],
  context: GeminiChatContext
): Promise<string> {
  // Build context with tool results
  const toolResultsSummary = toolResults
    .map((result) => {
      if (result.success) {
        return `${result.toolName}: ${JSON.stringify(result.result)}`;
      } else {
        return `${result.toolName}: Failed - ${result.error}`;
      }
    })
    .join('\n');

  const prompt = `Based on the user's request: "${originalMessage}"

I executed the following tools and got these results:
${toolResultsSummary}

Please provide a helpful, conversational response to the user incorporating this information. Respond as Milla, a warm and caring AI companion.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return (
      response.text ||
      'I gathered some information, but had trouble formulating a response.'
    );
  } catch (error) {
    console.error(
      '[GeminiTools] Failed to generate response with tool results:',
      error
    );
    return `I gathered the information, but I'm having trouble putting it into words. Here's what I found: ${toolResultsSummary}`;
  }
}
