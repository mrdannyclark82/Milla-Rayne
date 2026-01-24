import { OpenRouter } from 'openrouter'; // Assume existing import
import { agenticDispatch } from './agentic-dispatch';

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
        if (model === 'gemma-local' && !navigator.onLine) {
          return await localGemmaInference(query); // Offline fallback
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
