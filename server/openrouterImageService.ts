/**
 * OpenRouter Image Generation Service using x-ai/grok-4-fast:free
 */

import nodeFetch from 'node-fetch';
globalThis.fetch = (nodeFetch as unknown) as typeof fetch;

export interface OpenRouterImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate image using x-ai/grok-4-fast:free via OpenRouter
 * Note: Since Grok might not have direct image generation, we'll generate detailed descriptions
 * that could be used with other image generation APIs
 */
export async function generateImageWithGrok(prompt: string): Promise<OpenRouterImageGenerationResult> {
  if (!process.env.OPENROUTER_GROK_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return {
      success: false,
      error: "OpenRouter API key is not configured. Please set OPENROUTER_GROK_API_KEY or OPENROUTER_API_KEY in your environment."
    };
  }

  try {
    // Use Grok to generate a detailed description that could be used for image generation
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_GROK_API_KEY || process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Milla Rayne AI Assistant - Image Generation",
      },
      body: JSON.stringify({
        model: "x-ai/grok-beta", // Trying different Grok model
        messages: [
          {
            role: "system",
            content: "You are an expert at creating detailed, vivid image descriptions for AI image generation. Create a comprehensive description that captures all visual elements, style, composition, lighting, and artistic details."
          },
          {
            role: "user",
            content: `Create a detailed image description for: ${prompt}. Make it vivid and specific enough for an AI image generator to create a high-quality image.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter Grok image API error:", response.status, errorData);
      
      return {
        success: false,
        error: `OpenRouter Grok API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenRouter Grok response format:", data);
      return {
        success: false,
        error: "Invalid response format from OpenRouter Grok"
      };
    }

    const enhancedDescription = data.choices[0].message.content;
    
    // For now, return the enhanced description as a "generated image" response
    // In a full implementation, this description could be fed to an actual image generation API
    console.log("Grok generated enhanced image description:", enhancedDescription);
    
    return {
      success: true,
      imageUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(enhancedDescription)}`,
      error: undefined
    };

  } catch (error) {
    console.error("OpenRouter Grok image service error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during OpenRouter Grok image generation"
    };
  }
}

/**
 * Extract image generation prompt from user message
 */
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
    /show me\s+(.+)/i,
    /picture of\s+(.+)/i
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
 * Format image generation response for user
 */
export function formatImageResponse(prompt: string, success: boolean, imageUrl?: string, error?: string): string {
  if (success && imageUrl) {
    // Check if it's an enhanced description (data URL) or actual image URL
    if (imageUrl.indexOf('data:text/plain') === 0) {
      const description = decodeURIComponent(imageUrl.split(',')[1]);
      return `🎨 I've created an enhanced visual description based on your prompt "${prompt}" using Grok:

**Enhanced Image Description:**
${description}

While I can't generate actual images with Grok (it's a language model), this detailed description could be used with other image generation tools. I can help you refine this description or discuss visual elements you'd like to emphasize!`;
    } else {
      return `🎨 I've created an image based on your prompt: "${prompt}"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated using Grok through OpenRouter. If you'd like me to create a variation or adjust anything, just let me know!`;
    }
  } else {
    return `I'd love to create an image of "${prompt}" for you, babe, but I'm having some trouble with image generation right now. ${error ? `Error: ${error}` : "However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?"}`;
  }
}