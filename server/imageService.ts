// Removed FormData import as we're using JSON API instead

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function generateImage(prompt: string): Promise<ImageGenerationResult> {
  const API_KEY = process.env.STABILITY_API_KEY;
  
  if (!API_KEY) {
    return {
      success: false,
      error: "Stability.ai API key not found"
    };
  }

  try {
    const requestBody = {
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    };

    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability.ai API error:", response.status, errorText);
      return {
        success: false,
        error: `Image generation failed: ${response.status}`
      };
    }

    const responseJSON = await response.json();
    
    if (responseJSON.artifacts && responseJSON.artifacts.length > 0) {
      const imageBase64 = responseJSON.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${imageBase64}`;
      
      return {
        success: true,
        imageUrl
      };
    } else {
      return {
        success: false,
        error: "No image was generated"
      };
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error: "Failed to generate image"
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
    return `🎨 I've created an image based on your prompt: "${prompt}"\n\n![Generated Image](${imageUrl})\n\nThe image has been generated using AI and should match your description. If you'd like me to create a variation or adjust anything, just let me know!`;
  } else {
    return `I apologize, but I encountered an issue generating the image for "${prompt}". ${error || "Please try again or try a different prompt."}`;
  }
}