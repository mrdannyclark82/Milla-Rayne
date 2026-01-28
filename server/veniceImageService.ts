import OpenAI from 'openai';
import { config } from './config';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

let veniceClient: OpenAI | null = null;

function getVeniceClient() {
  if (!veniceClient && process.env.VENICE_API_KEY) {
    try {
      veniceClient = new OpenAI({
        baseURL: 'https://api.venice.ai/api/v1',
        apiKey: process.env.VENICE_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize Venice client for images:', error);
    }
  }
  return veniceClient;
}

export async function generateImageWithVenice(
  prompt: string
): Promise<ImageGenerationResult> {
  const client = getVeniceClient();
  if (!client) {
    return {
      success: false,
      error: 'Venice client not initialized. Check VENICE_API_KEY.',
    };
  }

  try {
    const response = await client.images.generate({
      model: "fluency", // Venice default or specific model
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    if (response.data && response.data.length > 0 && response.data[0].url) {
        return {
            success: true,
            imageUrl: response.data[0].url
        };
    }

    return {
        success: false,
        error: "No image URL returned from Venice."
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
