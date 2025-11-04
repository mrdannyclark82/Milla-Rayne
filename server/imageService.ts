import nodeFetch from 'node-fetch';
import { getHuggingFaceMCPService } from './huggingfaceMcpService.ts';
globalThis.fetch = nodeFetch as unknown as typeof fetch;

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate an image using Hugging Face Inference API with MCP integration
 * Model: philipp-zettl/UnfilteredAI-NSFW-gen-v2
 * @param prompt - Text description of the image to generate
 * @returns ImageGenerationResult with base64 encoded image or error
 */
export async function generateImage(
  prompt: string
): Promise<ImageGenerationResult> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    return {
      success: false,
      error:
        'Hugging Face API key is not configured. Please set HUGGINGFACE_API_KEY in your environment.',
    };
  }

  // Try using MCP service first
  const mcpService = getHuggingFaceMCPService();
  if (mcpService) {
    try {
      const mcpResult = await mcpService.generateImage(prompt, {
        numInferenceSteps: 30,
        guidanceScale: 7.5,
      });

      if (mcpResult.success && mcpResult.imageUrl) {
        return {
          success: true,
          imageUrl: mcpResult.imageUrl,
        };
      }
      // If MCP fails, fall back to direct API
      console.warn('MCP generation failed, falling back to direct API:', mcpResult.error);
    } catch (mcpError) {
      console.warn('MCP service error, falling back to direct API:', mcpError);
    }
  }

  // Fallback to direct API implementation
  try {
    const model =
      process.env.HUGGINGFACE_MODEL ||
      'philipp-zettl/UnfilteredAI-NSFW-gen-v2';
    const endpoint = `https://api-inference.huggingface.co/models/${model}`;
    const maxAttempts = 3;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle model loading case
          if (response.status === 503 && errorText.includes('loading')) {
            lastError = 'Model is currently loading. Please try again in a moment.';
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 2000 * attempt));
              continue;
            }
          } else {
            lastError = `Hugging Face API error (${response.status}): ${errorText}`;
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1000 * attempt));
              continue;
            }
          }
        } else {
          // Hugging Face returns the image as a blob
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Image = buffer.toString('base64');
          const imageUrl = `data:image/png;base64,${base64Image}`;

          return { success: true, imageUrl };
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Failed to generate image with Hugging Face.',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during image generation.',
    };
  }
}

export function extractImagePrompt(userMessage: string): string | null {
  const message = userMessage.toLowerCase();

  // Match patterns like "create an image of..." or "draw a picture of..."
  const patterns = [
    /create an image of\s+(.+)/i,
    /draw a picture of\s+(.+)/i,
    /generate an image of\s+(.+)/i,
    /make an image of\s+(.+)/i,
    /draw\s+(.+)/i,
    /create\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Format the image generation response with Milla's personality
 * @param prompt - The user's image prompt
 * @param success - Whether image generation succeeded
 * @param imageUrl - Base64 encoded image URL
 * @param error - Error message if generation failed
 * @returns Formatted response string
 */
export function formatImageResponse(
  prompt: string,
  success: boolean,
  imageUrl?: string,
  error?: string
): string {
  if (success && imageUrl) {
    return `🎨 I've created an image based on your prompt: "${prompt}"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated and should match your description. If you'd like me to create a variation or adjust anything, just let me know!`;
  } else {
    return `I'd love to create an image of "${prompt}" for you, babe, but image generation isn't available right now. ${error ? `Error: ${error}` : 'However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?'}`;
  }
}
