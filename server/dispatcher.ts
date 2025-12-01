import { OpenRouter } from 'openrouter'; // Assume existing import

class Dispatcher {
  private models = ['gemini', 'mistral', 'gemma-local'];

  async dispatch(query: string): Promise<string> {
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
