/**
 * OpenRouter Image Generation Service using OpenRouter-hosted image preview models
 * We will attempt to use Google Gemini image preview via OpenRouter when available.
 */

import nodeFetch from 'node-fetch';
globalThis.fetch = (nodeFetch as unknown) as typeof fetch;

export interface OpenRouterImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate image (or an image preview/URL) using OpenRouter.
 * Preferred model: google/gemini-pro-vision
 * Falls back to generating an enhanced description if the model doesn't return an image URL.
 */
export async function generateImageWithGemini(prompt: string): Promise<OpenRouterImageGenerationResult> {
  // Use a provider-specific key if available, otherwise fall back to the general OpenRouter key
  const openrouterKey = process.env.OPENROUTER_GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return {
      success: false,
      error: "OpenRouter API key is not configured. Please set OPENROUTER_GEMINI_API_KEY or OPENROUTER_API_KEY in your environment."
    };
  }

  try {
    // Use Gemini to generate a detailed description that could be used for image generation
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "X-Title": "Milla Rayne AI Assistant - Image Generation",
      },
      body: JSON.stringify({
        // Attempt to use the Gemini image-preview model via OpenRouter which may return an image preview or image URL.
        model: "google/gemini-pro-vision",
        messages: [
          {
            role: "system",
            content: "You are an image generation assistant. When possible, generate an image preview or return a direct image URL that represents the user's prompt. If the model cannot return binary images, instead produce a JSON-safe enhanced image description with composition, lighting, colors, style, and other details."
          },
          {
            role: "user",
            content: `Generate an image for the following prompt: ${prompt}. If possible return an image URL or an inline base64-encoded image. If not possible, return a thorough, production-ready image description.`
          }
        ],
        max_tokens: 1400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter image API error:", response.status, errorData);
      return {
        success: false,
        error: `OpenRouter image API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
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

    const messageContent = data.choices[0].message.content || '';

    // If the model returned a JSON object or an image URL, try to extract it
    // Some OpenRouter-hosted image-preview models may return an image URL directly in the content
    const urlMatch = messageContent.match(/https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?/i);
    if (urlMatch) {
      return {
        success: true,
        imageUrl: urlMatch[0]
      };
    }

    // If the model returned base64 data URI, return it directly
    const dataUriMatch = messageContent.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/i);
    if (dataUriMatch) {
      return {
        success: true,
        imageUrl: dataUriMatch[0]
      };
    }

    // Otherwise treat the content as an enhanced description and return as a data:text URL
    console.log("OpenRouter generated enhanced image description (no direct image):", messageContent.substring(0, 200));
    return {
      success: true,
      imageUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(messageContent)}`,
      error: undefined
    };

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
  // Note: Removed generic /create\s+(.+)/ pattern to avoid false triggers for calendar events, notes, etc.
  const patterns = [
    /create an image of\s+(.+)/i,
    /draw a picture of\s+(.+)/i,
    /generate an image of\s+(.+)/i,
    /make an image of\s+(.+)/i,
    /draw\s+(.+)/i,
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
      return `🎨 I\'ve created an enhanced visual description based on your prompt \"${prompt}\" using Gemini:\n\n**Enhanced Image Description:**\n${description}\n\nWhile I can\'t generate actual images with Gemini (it\'s a language model), this detailed description could be used with other image generation tools. I can help you refine this description or discuss visual elements you\'d like to emphasize!`;
    } else {
      return `🎨 I\'ve created an image based on your prompt: \"${prompt}\"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated using Gemini through OpenRouter. If you\'d like me to create a variation or adjust anything, just let me know!`;
    }
  } else {
    return `I\'d love to create an image of \"${prompt}\" for you, babe, but I\'m having some trouble with image generation right now. ${error ? `Error: ${error}` : "However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?"}`;
  }
}
