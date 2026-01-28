// server/dispatcher/gemini3-reason.ts - Gemini 3 edge reasoning fallback
import { GoogleGenerativeAI } from '@google/generative-ai';

export class Gemini3Reasoner {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async reason(query: string): Promise<string> {
    // Using Gemini 1.5 Flash as upgrade path to Gemini 3 when available
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(query);
    return result.response.text();
  }
}

// Export a function to get the reasoner instance with proper validation
export function getGemini3Reasoner(): Gemini3Reasoner {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini3Reasoner] Warning: GEMINI_API_KEY not set in environment variables. Gemini 3 fallback will not work.');
  }
  return new Gemini3Reasoner(apiKey || '');
}

// Export singleton instance for backwards compatibility
export const gemini3R = getGemini3Reasoner();
