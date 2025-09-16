// Image generation is currently disabled since we're using Mistral AI which doesn't have image generation capabilities

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function generateImage(prompt: string): Promise<ImageGenerationResult> {
  // Image generation is disabled - return a friendly message
  return {
    success: false,
    error: "Image generation is currently unavailable. Mistral AI doesn't support image generation at this time."
  };
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
    /create\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export function formatImageResponse(prompt: string, success: boolean, imageUrl?: string, error?: string): string {
  if (success && imageUrl) {
    return `🎨 I've created an image based on your prompt: "${prompt}"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated using AI and should match your description. If you'd like me to create a variation or adjust anything, just let me know!`;
  } else {
    return `I'd love to create an image of "${prompt}" for you, babe, but image generation isn't available right now since we switched to Mistral AI. However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?`;
  }
}