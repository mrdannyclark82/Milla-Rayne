import { HfInference } from '@huggingface/inference';

/**
 * Hugging Face MCP Service
 * Provides integration with Hugging Face models through Model Context Protocol
 */

export interface HuggingFaceMCPConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface TextGenerationOptions {
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  doSample?: boolean;
}

export interface ImageGenerationOptions {
  numInferenceSteps?: number;
  guidanceScale?: number;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export interface MCPTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface MCPImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Hugging Face MCP Service Class
 * Handles text generation, image generation, and model interactions
 */
export class HuggingFaceMCPService {
  private client: HfInference;
  private config: HuggingFaceMCPConfig;

  constructor(config: HuggingFaceMCPConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 60000,
      ...config,
    };

    this.client = new HfInference(this.config.apiKey);
  }

  /**
   * Generate text using a Hugging Face language model
   * @param prompt - Text prompt for generation
   * @param options - Generation parameters
   * @returns MCPTextResponse with generated text or error
   */
  async generateText(
    prompt: string,
    options: TextGenerationOptions = {}
  ): Promise<MCPTextResponse> {
    try {
      const model = this.config.model || 'mistralai/Mistral-7B-Instruct-v0.2';

      const response = await this.client.textGeneration({
        model,
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxNewTokens || 500,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.95,
          top_k: options.topK || 50,
          repetition_penalty: options.repetitionPenalty || 1.1,
          do_sample: options.doSample !== false,
          return_full_text: false,
        },
      });

      return {
        success: true,
        text: response.generated_text,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error during text generation',
      };
    }
  }

  /**
   * Generate an image using a Hugging Face diffusion model
   * @param prompt - Text description of the image
   * @param options - Image generation parameters
   * @returns MCPImageResponse with base64 image or error
   */
  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<MCPImageResponse> {
    try {
      const model =
        this.config.model || 'philipp-zettl/UnfilteredAI-NSFW-gen-v2';

      const blob = await this.client.textToImage({
        model,
        inputs: prompt,
        parameters: {
          num_inference_steps: options.numInferenceSteps || 30,
          guidance_scale: options.guidanceScale || 7.5,
          negative_prompt: options.negativePrompt,
          width: options.width,
          height: options.height,
        },
      }) as unknown as Blob;

      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error during image generation',
      };
    }
  }

  /**
   * List available models for a given task
   * @param task - Task type (text-generation, text-to-image, etc.)
   * @returns Array of model IDs
   */
  async listModels(task?: string): Promise<string[]> {
    try {
      // Note: The Inference API doesn't have a direct list models endpoint
      // This is a placeholder for common models
      const commonModels: Record<string, string[]> = {
        'text-generation': [
          'mistralai/Mistral-7B-Instruct-v0.2',
          'meta-llama/Llama-2-7b-chat-hf',
          'bigscience/bloom-7b1',
        ],
        'text-to-image': [
          'philipp-zettl/UnfilteredAI-NSFW-gen-v2',
          'stabilityai/stable-diffusion-2-1',
          'runwayml/stable-diffusion-v1-5',
        ],
      };

      return task && commonModels[task] ? commonModels[task] : [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Check if a model is currently loaded and ready
   * @param modelId - Model ID to check
   * @returns Boolean indicating if model is ready
   */
  async checkModelStatus(modelId: string): Promise<boolean> {
    try {
      // Simple check by attempting a minimal inference
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: 'test' }),
        }
      );

      return response.ok || response.status === 503; // 503 means loading
    } catch (error) {
      return false;
    }
  }
}

import { config } from './config';

/**
 * Create a Hugging Face MCP service instance
 * @returns HuggingFaceMCPService instance or null if API key not configured
 */
export function createHuggingFaceMCPService(): HuggingFaceMCPService | null {
  const apiKey = config.huggingface.apiKey;

  if (!apiKey) {
    console.warn(
      'HUGGINGFACE_API_KEY not configured. Hugging Face MCP service disabled.'
    );
    return null;
  }

  return new HuggingFaceMCPService({
    apiKey,
    model: config.huggingface.model,
  });
}

// Singleton instance
let mcpServiceInstance: HuggingFaceMCPService | null = null;

/**
 * Get the global Hugging Face MCP service instance
 * @returns HuggingFaceMCPService instance or null
 */
export function getHuggingFaceMCPService(): HuggingFaceMCPService | null {
  if (!mcpServiceInstance) {
    mcpServiceInstance = createHuggingFaceMCPService();
  }
  return mcpServiceInstance;
}
