// server/dispatcher/fallback-dispatcher.ts - Multi-LLM fallback chain
import { gemmaMP } from '../../android/gemma-wrapper-mp';
import { gemini3R } from './gemini3-reason';

type LLMProvider = 'gemma-local' | 'gemini3' | 'ollama';

export async function dispatchQuery(
  query: string,
  preferred: LLMProvider = 'gemma-local'
): Promise<string> {
  try {
    // Note: Currently both 'gemma-local' and 'ollama' use gemmaMP wrapper
    // In the future, 'ollama' should integrate with the existing OfflineModelService
    // See: server/offlineModelService.ts for Ollama integration
    if (preferred === 'gemma-local' || preferred === 'ollama') {
      return await gemmaMP.generate(query);
    }
  } catch (e) {
    console.warn('Local Gemma failed, falling back to Gemini 3', e);
  }

  try {
    return await gemini3R.reason(query);
  } catch (e) {
    console.error('All LLM providers failed', e);
    throw new Error('All LLM providers failed');
  }
}
