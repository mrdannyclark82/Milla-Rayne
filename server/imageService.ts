

import OpenAI from "openai";
import nodeFetch from 'node-fetch';
globalThis.fetch = (nodeFetch as unknown) as typeof fetch;


export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function generateImage(prompt: string): Promise<ImageGenerationResult> {
  if (!process.env.XAI_API_KEY) {
    return {
      success: false,
      error: "XAI API key is not configured. Please set XAI_API_KEY in your environment."
    };
  }
  try {
    // Try the XAI image endpoint with a couple of retries and flexible response parsing
    const endpoint = process.env.XAI_IMAGE_ENDPOINT || 'https://api.xai.com/v1/images/generations';
    const maxAttempts = 2;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.XAI_API_KEY}`
          },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `XAI image API error: ${errorText}`;
          // Small backoff before retry
          if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 300 * attempt));
          continue;
        }

        const data = await response.json().catch(() => ({}));

        // Flexible parsing for several possible XAI/OpenAI-like response shapes
        // 1) data.imageUrl
        if (data && (data.imageUrl || data.url)) {
          return { success: true, imageUrl: (data.imageUrl || data.url) };
        }

        // 2) data.data[0].b64_json (openai compatibility)
        if (data && Array.isArray(data.data) && data.data[0] && data.data[0].b64_json) {
          const b64 = data.data[0].b64_json;
          return { success: true, imageUrl: `data:image/png;base64,${b64}` };
        }

        // 3) data.output[0].image_url or data.output[0].url
        if (data && Array.isArray(data.output) && data.output[0] && (data.output[0].image_url || data.output[0].url)) {
          return { success: true, imageUrl: (data.output[0].image_url || data.output[0].url) };
        }

        // 4) Some APIs return a top-level 'images' array with urls
        if (data && Array.isArray(data.images) && data.images[0] && (data.images[0].url || data.images[0].imageUrl)) {
          return { success: true, imageUrl: (data.images[0].url || data.images[0].imageUrl) };
        }

        // 5) If the response is a string that contains a URL
        if (typeof data === 'string') {
          const urlMatch = data.match(/https?:\/\/[^\s]+/i);
          if (urlMatch) return { success: true, imageUrl: urlMatch[0] };
        }

        // If no image was returned, capture any textual description to return as an informative error
        const maybeText = (data && (data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.description || data.detail)) || JSON.stringify(data).slice(0, 1000);
        lastError = `XAI did not return an image URL. Response summary: ${maybeText}`;
        if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 300 * attempt));
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 300 * attempt));
      }
    }

    return { success: false, error: lastError || "XAI did not return an image URL." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during XAI image generation."
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
    return `🎨 I've created an image based on your prompt: "${prompt}"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated using XAI and should match your description. If you'd like me to create a variation or adjust anything, just let me know!`;
  } else {
    return `I'd love to create an image of "${prompt}" for you, babe, but image generation isn't available right now. ${error ? `Error: ${error}` : "However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?"}`;
  }
}