
/**
 * Gemini AI Service
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config';

export interface GeminiResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function generateGeminiResponse(
  userMessage: string,
): Promise<GeminiResponse> {
  try {
    if (!config.gemini || !config.gemini.apiKey) {
      return { content: 'Gemini API key not configured', success: false, error: 'Missing GEMINI API key' };
    }

    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      success: true,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      content: "I'm having trouble connecting to the Gemini service right now. Please try again in a moment.",
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
