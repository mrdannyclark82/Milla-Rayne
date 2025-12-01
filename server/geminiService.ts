/**
 * Gemini AI Service
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config';
import { performWebSearch, SearchResult } from './searchService'; // Import the search service

export interface GeminiResponse {
  content: string;
  success: boolean;
  error?: string;
  toolExecuted?: boolean; // Indicate if a tool was executed
}

// Define the tool for Gemini
const searchTool = {
  function_declarations: [
    {
      name: 'performWebSearch',
      description: 'Performs a web search to find information online.',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: {
            type: 'STRING',
            description: 'The search query string.',
          },
        },
        required: ['query'],
      },
    },
  ],
};

export async function generateGeminiResponse(
  userMessage: string,
  // conversationHistory: Array<{ role: 'user' | 'model'; content: string }> // Not used in this basic implementation but useful for full chat context
): Promise<GeminiResponse> {
  try {
    if (!config.gemini || !config.gemini.apiKey) {
      return {
        content: 'Gemini API key not configured',
        success: false,
        error: 'Missing GEMINI API key',
      };
    }

    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: [searchTool] });

    // Start a chat session with the model
    const chat = model.startChat({});
    
    // Send the user message
    const result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Check for tool calls
    if (response.functionCall) {
      const functionCall = response.functionCall;
      let toolResult: SearchResult[] | null = null;
      let toolExecuted = false;

      if (functionCall.name === 'performWebSearch') {
        toolExecuted = true;
        console.log('Gemini called performWebSearch with query:', functionCall.args.query);
        const searchResponse = await performWebSearch(functionCall.args.query);
        toolResult = searchResponse; // Pass the whole searchResponse object
      }

      if (toolExecuted && toolResult) {
        // Send the tool response back to the model
        const toolResponseResult = await chat.sendMessage([
          {
            functionCall: functionCall,
          },
          {
            functionResponse: {
              name: functionCall.name,
              response: { result: toolResult }, // Gemini expects 'response' to be an object with a 'result' property
            },
          },
        ]);
        response = toolResponseResult.response; // Get the final response from Gemini
        const text = response.text();
        return {
          content: text,
          success: true,
          toolExecuted: true,
        };
      } else if (toolExecuted && !toolResult) {
        return {
          content: 'The search tool was called but returned no results.',
          success: false,
          toolExecuted: true,
        };
      }
    }

    const text = response.text();

    return {
      content: text,
      success: true,
      toolExecuted: false,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      content:
        "I'm having trouble connecting to the Gemini service right now. Please try again in a moment.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

