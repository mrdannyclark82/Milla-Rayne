

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
    // Example XAI image generation call (update endpoint/params as needed)
    const response = await fetch(process.env.XAI_IMAGE_ENDPOINT || 'https://api.xai.com/v1/images/generations', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `XAI image API error: ${errorText}` };
    }
    const data = await response.json();
    if (data && data.imageUrl) {
      return { success: true, imageUrl: data.imageUrl };
    } else {
      return { success: false, error: "XAI did not return an image URL." };
    }
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