import { OpenRouter } from 'openrouter'; // Assume existing import
import { agenticDispatch } from './agentic-dispatch';

// Placeholder for local Gemma inference - implement based on actual local model setup
async function localGemmaInference(query: string): Promise<string> {
  // TODO: Implement local Gemma inference using Ollama or similar
  throw new Error('Local Gemma inference not yet implemented');
}

class Dispatcher {
  private models = ['gemini', 'mistral', 'gemma-local'];

  async dispatch(query: string, useAgenticMode: boolean = false): Promise<string> {
    // Use agentic dispatch for complex multi-step queries
    if (useAgenticMode) {
      try {
        const result = await agenticDispatch(query, true, {
          maxIterations: 5,
          requiresVerification: true,
        });
        return result.answer;
      } catch (e) {
        console.error('Agentic dispatch failed, falling back to standard:', e);
        // Fall through to standard dispatch
      }
    }

    // Standard model fallback chain
    for (const model of this.models) {
      try {
        if (model === 'gemma-local') {
          // Attempt local inference for offline scenarios
          // Note: This is a server-side operation, not browser-based
          return await localGemmaInference(query);
        }
        return await OpenRouter.invoke(model, query);
      } catch (e) {
        console.error(`Fallback from ${model}: ${e}`);
      }
    }
    throw new Error('All models failed');
  }
}

export const dispatcher = new Dispatcher();
