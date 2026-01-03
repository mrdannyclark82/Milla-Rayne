import { Ollama } from 'ollama';
import { OpenAI } from 'openai';

export async function dispatchQuery(query: string, preferLocal: boolean) {
  if (preferLocal && process.env.ENABLE_LOCAL_MODEL) {
    try {
      const ollama = new Ollama();
      return await ollama.generate({ model: 'gemma:2b', prompt: query });
    } catch (e) {
      console.error('Local fallback failed:', e);
    }
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: query }],
  });
}
