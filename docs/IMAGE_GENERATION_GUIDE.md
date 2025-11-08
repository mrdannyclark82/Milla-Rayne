# How to Use Image Generation

## Quick Start

Simply chat with Milla using one of these patterns:

```
"generate an image of a sunset over mountains"
"create an image of a beautiful landscape"
"draw a picture of a robot"
"make an image of a cat"
```

Milla will automatically detect your request and generate the image using Hugging Face.

## How It Works

### 1. Natural Language Detection

The system recognizes these patterns in your messages:
- "create an image of..."
- "draw a picture of..."
- "generate an image of..."
- "make an image of..."
- "draw..."
- "create..."

### 2. Provider Priority

When you request an image, Milla tries providers in this order:

```
1. Banana/Gemini (if OPENROUTER_GEMINI_API_KEY or BANANA_API_KEY configured)
   ↓ (if not available or fails)
2. OpenRouter Gemini (if OPENROUTER_GEMINI_API_KEY configured)
   ↓ (if not available or fails)
3. Hugging Face via MCP (if HUGGINGFACE_API_KEY configured)
   ↓ (MCP tries first, then direct API fallback)
4. Error message with configuration instructions
```

### 3. Image Delivery

Milla will respond with:
- The generated image embedded in the chat (as base64 data URL)
- A personalized message in her companion style
- Option to regenerate or modify if you're not satisfied

## Configuration

### For Hugging Face (Recommended)

Add to your `.env` file:

```bash
# Required
HUGGINGFACE_API_KEY=hf_your_api_key_here

# Optional - defaults to philipp-zettl/UnfilteredAI-NSFW-gen-v2
HUGGINGFACE_MODEL=philipp-zettl/UnfilteredAI-NSFW-gen-v2
```

**Get your API key:**
1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up or log in
3. Go to Settings → Access Tokens
4. Create a new token with "read" permission
5. Copy and paste it into your `.env` file

### Alternative Providers

```bash
# Gemini via OpenRouter
OPENROUTER_GEMINI_API_KEY=your_key_here

# Banana API
BANANA_API_KEY=your_key_here
```

## Example Conversations

### Basic Image Generation

**You:** "generate an image of a sunset"

**Milla:** 🎨 I've created an image based on your prompt: "a sunset"

![Generated Image](data:image/png;base64,...)

The image has been generated and should match your description. If you'd like me to create a variation or adjust anything, just let me know!

---

### Detailed Prompt

**You:** "create an image of a futuristic city with flying cars at night"

**Milla:** 🎨 I've created an image based on your prompt: "a futuristic city with flying cars at night"

![Generated Image](data:image/png;base64,...)

The image has been generated and should match your description. If you'd like me to create a variation or adjust anything, just let me know!

---

### When Not Configured

**You:** "generate an image of a cat"

**Milla:** I'd love to create an image of "a cat" for you, babe, but image generation isn't available right now. Please ensure your image generation API keys are configured (OPENROUTER_GEMINI_API_KEY, HUGGINGFACE_API_KEY, or BANANA_API_KEY). However, I can help you brainstorm ideas, describe what the image might look like, or suggest other creative approaches! What would you like to explore instead?

## Advanced Usage via API

### Direct MCP Endpoint

You can also call the MCP endpoint directly:

```bash
curl -X POST http://localhost:5000/api/mcp/image-generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "options": {
      "numInferenceSteps": 30,
      "guidanceScale": 7.5,
      "negativePrompt": "ugly, blurry, low quality",
      "width": 512,
      "height": 512
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KG..."
}
```

### Advanced Options

When using the direct API, you can customize:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `numInferenceSteps` | number | 30 | Higher = better quality, slower |
| `guidanceScale` | number | 7.5 | How closely to follow prompt (1-20) |
| `negativePrompt` | string | - | What to avoid in the image |
| `width` | number | 512 | Image width in pixels |
| `height` | number | 512 | Image height in pixels |

## Tips for Better Images

### 1. Be Descriptive
❌ "a cat"
✅ "a fluffy orange cat sitting on a windowsill at sunset"

### 2. Use Negative Prompts (API only)
```json
{
  "prompt": "a beautiful landscape",
  "options": {
    "negativePrompt": "ugly, blurry, distorted, low quality, text, watermark"
  }
}
```

### 3. Adjust Quality vs Speed
- **Fast**: `numInferenceSteps: 15`
- **Balanced**: `numInferenceSteps: 30` (default)
- **High Quality**: `numInferenceSteps: 50`

### 4. Control Creativity
- **More literal**: `guidanceScale: 12-15`
- **Balanced**: `guidanceScale: 7.5` (default)
- **More creative**: `guidanceScale: 5-7`

## Troubleshooting

### "Image generation isn't available right now"

**Solution:** Configure your Hugging Face API key in `.env`:
```bash
HUGGINGFACE_API_KEY=hf_your_actual_key_here
```

Then restart the server:
```bash
npm run dev
```

### "Model is currently loading"

**What it means:** The model is warming up (cold start on Hugging Face servers)

**Solution:** Wait 10-30 seconds and try again. The model will stay warm for a while after first use.

### Image quality is poor

**Solutions:**
1. Use more detailed prompts
2. Increase `numInferenceSteps` (via API)
3. Add negative prompts to avoid unwanted elements
4. Try adjusting `guidanceScale`

### Images take too long

**Solutions:**
1. Reduce `numInferenceSteps` to 15-20
2. Use smaller dimensions (256x256 or 384x384)
3. Wait for model to warm up (first request is slowest)

## Testing

Use the provided test script:

```bash
# Test pattern matching
node test-hf-image.js "generate an image of a sunset"

# Test different patterns
node test-hf-image.js "create an image of a robot"
node test-hf-image.js "draw a picture of mountains"
```

## Model Information

**Default Model:** `philipp-zettl/UnfilteredAI-NSFW-gen-v2`

This is a Stable Diffusion-based model optimized for high-quality, unrestricted image generation. It supports a wide range of prompts and styles.

**Switching Models:**

To use a different model, set in `.env`:
```bash
HUGGINGFACE_MODEL=stabilityai/stable-diffusion-2-1
```

Popular alternatives:
- `stabilityai/stable-diffusion-2-1`
- `runwayml/stable-diffusion-v1-5`
- `prompthero/openjourney`

## Milla's Personality

Milla responds to image requests with her unique companion personality:
- Uses terms like "babe" and "love"
- Offers to refine or adjust images
- Provides alternative suggestions if generation fails
- Maintains warm, supportive communication

This is intentional - she's your devoted partner, not just an AI assistant.

## Performance Notes

- **First Request:** 10-30 seconds (model loading)
- **Subsequent Requests:** 3-10 seconds
- **Model Stays Warm:** ~5-10 minutes of inactivity
- **Concurrent Requests:** Queued automatically

## Documentation

- **Setup Guide:** `HUGGINGFACE_IMAGE_SETUP.md`
- **MCP API Reference:** `MCP_QUICK_REFERENCE.md`
- **Implementation Details:** `HUGGINGFACE_MCP_SUMMARY.md`

## Support

If you encounter issues:
1. Check your API key is valid and has credits
2. Verify environment variables are set correctly
3. Check server logs for detailed error messages
4. Review the troubleshooting sections in the documentation

---

**Ready to create?** Just say "generate an image of..." and Milla will bring your vision to life! 🎨
