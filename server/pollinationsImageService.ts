/**
 * Pollinations.AI Image Generation Service
 * Free, unlimited image generation without API keys
 * https://pollinations.ai/
 */

export interface PollinationsImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate an image using Pollinations.AI
 * This service is completely free and requires no API key
 * @param prompt - Text description of the image to generate
 * @param options - Optional generation parameters
 * @returns PollinationsImageResult with image URL or error
 */
export async function generateImageWithPollinations(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    seed?: number;
    model?: 'flux' | 'flux-realism' | 'flux-anime' | 'flux-3d' | 'turbo';
    nologo?: boolean;
    private?: boolean;
  } = {}
): Promise<PollinationsImageResult> {
  try {
    const {
      width = 1024,
      height = 1024,
      model = 'flux',
      nologo = true,
      private: isPrivate = true,
      seed,
    } = options;

    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);

    // Build query parameters
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (model) params.set('model', model);
    if (nologo) params.set('nologo', 'true');
    if (isPrivate) params.set('private', 'true');
    if (seed) params.set('seed', seed.toString());

    // Pollinations.AI direct image URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    console.log('[Pollinations.AI] Generating image:', imageUrl);

    // Verify the image is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to generate image: HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error('[Pollinations.AI] Error:', error);
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
 * Format the image generation response with Milla's personality
 */
export function formatPollinationsImageResponse(
  prompt: string,
  success: boolean,
  imageUrl?: string,
  error?: string
): string {
  if (success && imageUrl) {
    return `🎨 I've created an image based on your prompt: "${prompt}"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated, babe. If you'd like me to create a variation or adjust anything, just let me know!`;
  } else {
    return `I'd love to create an image of "${prompt}" for you, but something went wrong. ${error ? `Error: ${error}` : 'However, I can help you brainstorm ideas or describe what the image might look like! What would you like to explore instead?'}`;
  }
}
