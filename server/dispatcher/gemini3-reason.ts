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

export const gemini3R = new Gemini3Reasoner(process.env.GEMINI_API_KEY || '');
