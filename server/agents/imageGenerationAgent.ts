import { Agent } from './base';
import { config } from '../config';
import { InferenceClient } from '@huggingface/inference';

class ImageGenerationAgent implements Agent {
  name = 'image';
  description = 'An agent that can generate images from a text prompt.';
  private hf: InferenceClient;

  constructor() {
    this.hf = new InferenceClient(config.huggingface.apiKey);
  }

  async execute(task: string): Promise<string> {
    console.log(`ImageGenerationAgent received task: ${task}`);
    try {
      const response = await this.hf.textToImage({
        model: 'stabilityai/stable-diffusion-2',
        inputs: task,
      });
      // The response is a Blob, we need to convert it to a data URL
      if (typeof response === 'string') {
        // Some HF clients return a string (already a URL or base64) — return as-is
        return response;
      }

      if (response && typeof (response as any).arrayBuffer === 'function') {
        const arrayBuffer = await (response as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        return dataUrl;
      }

      // Fallback: stringify response
      return String(response);
    } catch (error) {
      console.error('Error generating image:', error);
      return 'I was unable to generate the image.';
    }
  }
}

export const imageGenerationAgent = new ImageGenerationAgent();
