export async function polyDispatch(prompt: string, options = {}) {
  const providers = ['gemini', 'openai', 'xai', 'ollama'];
  for (const p of providers) {
    try {
      return await dispatchTo(p, prompt, options);
    } catch (e) {
      console.log(`Fallback from ${p}`);
    }
  }
  throw new Error('All providers failed');
}