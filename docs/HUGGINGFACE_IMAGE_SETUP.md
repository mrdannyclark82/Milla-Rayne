# Hugging Face Image Generation & MCP Setup

The image generation service has been updated to use the Hugging Face model `philipp-zettl/UnfilteredAI-NSFW-gen-v2` with **Model Context Protocol (MCP)** integration.

## Configuration

### 1. Get a Hugging Face API Key

1. Create an account at [Hugging Face](https://huggingface.co/)
2. Go to Settings → Access Tokens
3. Create a new token with `read` permissions
4. Copy the token

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
HUGGINGFACE_API_KEY=hf_your_api_key_here
HUGGINGFACE_MODEL=philipp-zettl/UnfilteredAI-NSFW-gen-v2
```

The `HUGGINGFACE_MODEL` variable is optional and defaults to `philipp-zettl/UnfilteredAI-NSFW-gen-v2`.

## Model Context Protocol (MCP) Integration

The system now includes **Hugging Face MCP** for enhanced model interaction capabilities.

### What is MCP?

Model Context Protocol provides a standardized interface for interacting with AI models, offering:

- **Unified API**: Consistent interface across different model types
- **Advanced Features**: Text generation, image generation, model listing, and status checking
- **Fallback Support**: Automatic fallback to direct API if MCP fails
- **Better Error Handling**: Improved retry logic and error messages

### MCP Features Available

1. **Text Generation** - Generate text using Hugging Face language models
2. **Image Generation** - Generate images using diffusion models
3. **Model Listing** - List available models for specific tasks
4. **Model Status** - Check if a model is loaded and ready

### Installed Packages

- `@modelcontextprotocol/sdk` - Core MCP SDK
- `huggingface-mcp-server` - Hugging Face MCP server
- `@huggingface/inference` - Hugging Face Inference client

## API Endpoints

### MCP Endpoints

#### 1. Text Generation

```
POST /api/mcp/text-generate
Body: {
  "prompt": "Your text prompt here",
  "options": {
    "maxNewTokens": 500,
    "temperature": 0.7,
    "topP": 0.95
  }
}
```

#### 2. Image Generation

```
POST /api/mcp/image-generate
Body: {
  "prompt": "Your image description",
  "options": {
    "numInferenceSteps": 30,
    "guidanceScale": 7.5,
    "negativePrompt": "Optional negative prompt"
  }
}
```

#### 3. List Models

```
GET /api/mcp/models/:task
Example: GET /api/mcp/models/text-to-image
```

#### 4. Check Model Status

```
GET /api/mcp/model-status/:modelId
Example: GET /api/mcp/model-status/philipp-zettl%2FUnfilteredAI-NSFW-gen-v2
```

## How It Works

### Image Service Flow

1. **MCP First**: Attempts to generate using the MCP service
2. **Fallback**: If MCP fails, falls back to direct Hugging Face API
3. **Retry Logic**: Up to 3 attempts with exponential backoff
4. **Model Loading**: Handles 503 responses when model is loading (cold start)

### Architecture

```
User Request
    ↓
imageService.generateImage()
    ↓
├─→ HuggingFaceMCPService (Primary)
│   └─→ @huggingface/inference client
│       └─→ Hugging Face API
│
└─→ Direct API Call (Fallback)
    └─→ node-fetch
        └─→ Hugging Face API
```

## Usage

Users can request image generation with commands like:

- "create an image of..."
- "draw a picture of..."
- "generate an image of..."
- "make an image of..."

The system will automatically detect these patterns and generate the image using Hugging Face via MCP.

## Parameters

### Image Generation Parameters

- `num_inference_steps`: 30 (quality vs speed tradeoff)
- `guidance_scale`: 7.5 (how closely to follow the prompt)
- `negative_prompt`: Optional (what to avoid in the image)
- `width`: Optional (image width in pixels)
- `height`: Optional (image height in pixels)

### Text Generation Parameters

- `maxNewTokens`: 500 (maximum tokens to generate)
- `temperature`: 0.7 (randomness, 0-1)
- `topP`: 0.95 (nucleus sampling)
- `topK`: 50 (top-k sampling)
- `repetitionPenalty`: 1.1 (penalize repetition)

These can be adjusted when calling the API or in `server/huggingfaceMcpService.ts`.

## Error Handling

The service handles:

- Missing API key (returns helpful error message)
- Model loading delays (automatic retry with backoff)
- API errors (detailed error messages)
- Network failures (retry logic)
- MCP service unavailable (automatic fallback to direct API)

## Technical Details

### Files Created/Modified

- **Created**: `server/huggingfaceMcpService.ts` - MCP service implementation
- **Modified**: `server/imageService.ts` - Updated to use MCP with fallback
- **Modified**: `server/routes.ts` - Added MCP API endpoints
- **Updated**: `package.json` - Added MCP dependencies

### Dependencies

- **@modelcontextprotocol/sdk**: Core MCP implementation
- **huggingface-mcp-server**: Hugging Face-specific MCP server
- **@huggingface/inference**: Official Hugging Face TypeScript client
- **node-fetch**: Already in package.json (for fallback)

### Response Format

- **Images**: Base64-encoded PNG images as data URLs
- **Text**: Plain text responses
- **Status**: Boolean indicating model readiness
- **Models**: Array of model IDs for specific tasks

### Milla's Persona

Response messages maintain Milla's companion personality, ensuring all interactions feel natural and aligned with her character as a devoted partner rather than a generic assistant.

## Development Notes

### Service Initialization

The MCP service is initialized as a singleton on first use:

```typescript
import { getHuggingFaceMCPService } from './huggingfaceMcpService';

const mcpService = getHuggingFaceMCPService(); // Returns instance or null
```

### Testing MCP Integration

You can test the MCP endpoints using curl:

```bash
# Text generation
curl -X POST http://localhost:5000/api/mcp/text-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a short story about..."}'

# Image generation
curl -X POST http://localhost:5000/api/mcp/image-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset over mountains"}'

# List models
curl http://localhost:5000/api/mcp/models/text-to-image

# Check model status
curl http://localhost:5000/api/mcp/model-status/philipp-zettl%2FUnfilteredAI-NSFW-gen-v2
```

## Troubleshooting

### MCP Service Not Available

If you see "Hugging Face MCP service not configured":

- Verify `HUGGINGFACE_API_KEY` is set in `.env`
- Restart the server after adding the API key

### Image Generation Fails

- Check if the model is loaded (may take 10-30 seconds on first request)
- Verify your API key has the correct permissions
- Check server logs for detailed error messages

### Fallback to Direct API

If MCP consistently falls back to direct API:

- This is normal behavior when MCP has issues
- The service will still work via the fallback mechanism
- Check logs for MCP-specific errors
