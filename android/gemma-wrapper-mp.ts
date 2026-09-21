// android/gemma-wrapper-mp.ts - MediaPipe Gemma wrapper
import {
  FilesetResolver,
  LlmInference,
  LlmInferenceOptions,
} from '@mediapipe/tasks-genai';

interface MediaPipeLLMOptions {
  maxTokens?: number;
}

// Interface to allow for both real and mock implementations if needed
interface MediaPipeLLM {
  infer(prompt: string, options: MediaPipeLLMOptions): Promise<string>;
}

class MediaPipeLLMImpl implements MediaPipeLLM {
  private inference: LlmInference;

  constructor(inference: LlmInference) {
    this.inference = inference;
  }

  async infer(prompt: string, options: MediaPipeLLMOptions): Promise<string> {
    // LlmInference.generateResponse returns a string promise
    // It might throw if not initialized, but we handle that in wrapper
    try {
      return await this.inference.generateResponse(prompt);
    } catch (error) {
      console.error('MediaPipe inference failed:', error);
      throw error;
    }
  }
}

// Mock implementation - kept as fallback or for testing
class MockMediaPipeLLM implements MediaPipeLLM {
  constructor(private model: string) {
    console.log(`MockMediaPipeLLM: Initialized with model ${model}`);
  }

  async infer(prompt: string, options: MediaPipeLLMOptions): Promise<string> {
    console.log(
      `MockMediaPipeLLM: Inferring with prompt (${prompt.length} chars), maxTokens: ${options.maxTokens}`
    );
    return `Mock response for: ${prompt.substring(0, 50)}...`;
  }
}

export class GemmaMPWrapper {
  private llm: MediaPipeLLM | null = null;
  private isInitializing: boolean = false;

  async setup(modelPath: string = 'gemma-2b-it-gpu-int4.bin') {
    if (this.llm || this.isInitializing) return;

    this.isInitializing = true;
    try {
      console.log(
        `GemmaMP: Initializing MediaPipe LLM with model: ${modelPath}`
      );

      // Check if we are in a browser environment
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        throw new Error(
          'MediaPipe LLM requires a browser environment with fetch support.'
        );
      }

      const filesetResolver = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      );

      const llmInference = await LlmInference.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: modelPath,
          },
          maxTokens: 512, // Default max tokens
          temperature: 0.8,
          topK: 40,
          randomSeed: 0,
        }
      );

      this.llm = new MediaPipeLLMImpl(llmInference);
      console.log(`GemmaMP: Loaded ${modelPath} via MediaPipe`);
    } catch (error) {
      console.error(
        'GemmaMP: Initialization failed, falling back to mock.',
        error
      );
      // Fallback to mock if initialization fails (e.g., in Node.js or if model not found)
      this.llm = new MockMediaPipeLLM(modelPath);
    } finally {
      this.isInitializing = false;
    }
  }

  async generate(prompt: string, maxTokens: number = 512): Promise<string> {
    if (!this.llm) {
      await this.setup();
    }

    // Safety check in case setup failed and didn't set llm (shouldn't happen with fallback)
    if (!this.llm) {
      throw new Error('GemmaMP: LLM not initialized.');
    }

    return this.llm.infer(prompt, { maxTokens });
  }
}

export const gemmaMP = new GemmaMPWrapper();
