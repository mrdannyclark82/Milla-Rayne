/**
 * Gemini Image Generation Service using google/gemini-2.5-flash-image-preview via OpenRouter
 */

import nodeFetch from 'node-fetch';
globalThis.fetch = (nodeFetch as unknown) as typeof fetch;

export interface GeminiImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate image using google/gemini-2.5-flash-image-preview via OpenRouter
 */
export async function generateImageWithGemini(prompt: string): Promise<GeminiImageGenerationResult> {
  if (!process.env.OPENROUTER_GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return {
      success: false,
      error: "OpenRouter Gemini API key is not configured. Please set OPENROUTER_GEMINI_API_KEY or OPENROUTER_API_KEY in your environment."
    };
  }

  try {
    // Use Gemini 2.5 Flash Image Preview for image generation via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_GEMINI_API_KEY || process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Milla Rayne AI Assistant - Gemini Image Generation",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview", // Gemini 2.5 Flash Image Preview model
        messages: [
          {
            role: "user",
            content: `Generate an image: ${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter Gemini image API error:", response.status, errorData);
      
      return {
        success: false,
        error: `OpenRouter Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenRouter Gemini response format:", data);
      return {
        success: false,
        error: "Invalid response format from OpenRouter Gemini"
      };
    }

    const message = data.choices[0].message;
    
    // Check if the response contains an image URL or generated content
    // Gemini image models may return the image in different formats
    let imageUrl: string | undefined;
    
    // Check for image URL in the content
    if (message.content) {
      // Look for markdown image syntax
      const imageMatch = message.content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
      if (imageMatch && imageMatch[1]) {
        imageUrl = imageMatch[1];
      } else {
        // Look for plain URLs that might be images
        const urlMatch = message.content.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/i);
        if (urlMatch && urlMatch[1]) {
          imageUrl = urlMatch[1];
        }
      }
    }

    // Check for image in attachments or other fields
    if (!imageUrl && message.attachments && message.attachments.length > 0) {
      imageUrl = message.attachments[0].url;
    }

    if (imageUrl) {
      console.log("Gemini generated image URL:", imageUrl);
      return {
        success: true,
        imageUrl: imageUrl,
        error: undefined
      };
    } else {
      // If no image URL found, return the text content as a description fallback
      console.log("Gemini response (no image URL found):", message.content);
      return {
        success: false,
        error: "Gemini did not return an image URL. Model may not support image generation or returned text instead."
      };
    }

  } catch (error) {
    console.error("OpenRouter Gemini image service error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during OpenRouter Gemini image generation"
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
    return `🎨 I've created an image based on your prompt: "${prompt}"

![Generated Image](${imageUrl})

The image has been generated using Google Gemini 2.5 Flash Image Preview through OpenRouter. If you'd like me to create a variation or adjust anything, just let me know!`;
  } else {
    return `I'd love to create an image of "${prompt}" for you, babe, but I'm having some trouble with Gemini image generation right now. ${error ? `Error: ${error}` : "However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?"}`;
  }
}
