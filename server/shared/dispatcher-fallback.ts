// Precise fallback with Gemma 3n priority
export const smartDispatch = async (prompt: string, preferred: string = 'gemma') => {
  if (preferred === 'gemma' && await isOffline()) {
    return await ollamaGenerate(prompt, 'gemma3n:2b'); // quantized
  }
  // ... existing chain with LiteRT hook
};