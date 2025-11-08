# Hugging Face MCP Quick Reference

## Overview

The Hugging Face Model Context Protocol (MCP) integration provides a unified interface for AI model interactions.

## Environment Setup

```bash
# Required
HUGGINGFACE_API_KEY=hf_your_api_key_here

# Optional (defaults shown)
HUGGINGFACE_MODEL=philipp-zettl/UnfilteredAI-NSFW-gen-v2
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         User Request (Chat/API)             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         imageService.generateImage()         │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
┌──────────────┐  ┌──────────────┐
│  MCP Service │  │  Direct API  │
│   (Primary)  │  │  (Fallback)  │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌─────────────────────────────────┐
│  Hugging Face Inference API     │
└─────────────────────────────────┘
```

## API Endpoints

### 1. Generate Image (MCP)

**Endpoint**: `POST /api/mcp/image-generate`

**Request**:
```json
{
  "prompt": "A beautiful sunset over mountains",
  "options": {
    "numInferenceSteps": 30,
    "guidanceScale": 7.5,
    "negativePrompt": "ugly, blurry, low quality",
    "width": 512,
    "height": 512
  }
}
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KG..."
}
```

### 2. Generate Text (MCP)

**Endpoint**: `POST /api/mcp/text-generate`

**Request**:
```json
{
  "prompt": "Write a short story about a robot",
  "options": {
    "maxNewTokens": 500,
    "temperature": 0.7,
    "topP": 0.95,
    "topK": 50
  }
}
```

**Response**:
```json
{
  "success": true,
  "text": "Once upon a time, there was a robot named..."
}
```

### 3. List Models

**Endpoint**: `GET /api/mcp/models/:task`

**Examples**:
- `GET /api/mcp/models/text-to-image`
- `GET /api/mcp/models/text-generation`

**Response**:
```json
{
  "success": true,
  "models": [
    "philipp-zettl/UnfilteredAI-NSFW-gen-v2",
    "stabilityai/stable-diffusion-2-1",
    "runwayml/stable-diffusion-v1-5"
  ]
}
```

### 4. Check Model Status

**Endpoint**: `GET /api/mcp/model-status/:modelId`

**Example**:
```
GET /api/mcp/model-status/philipp-zettl%2FUnfilteredAI-NSFW-gen-v2
```

**Response**:
```json
{
  "success": true,
  "ready": true
}
```

## Service Usage (Server-Side)

### Import the Service

```typescript
import { getHuggingFaceMCPService } from './huggingfaceMcpService.ts';

const mcpService = getHuggingFaceMCPService();
```

### Generate an Image

```typescript
const result = await mcpService.generateImage(
  'A beautiful landscape',
  {
    numInferenceSteps: 30,
    guidanceScale: 7.5,
    negativePrompt: 'ugly, blurry'
  }
);

if (result.success) {
  console.log('Image URL:', result.imageUrl);
} else {
  console.error('Error:', result.error);
}
```

### Generate Text

```typescript
const result = await mcpService.generateText(
  'Write a poem about the ocean',
  {
    maxNewTokens: 200,
    temperature: 0.8,
    topP: 0.9
  }
);

if (result.success) {
  console.log('Generated text:', result.text);
} else {
  console.error('Error:', result.error);
}
```

### Check Model Status

```typescript
const isReady = await mcpService.checkModelStatus(
  'philipp-zettl/UnfilteredAI-NSFW-gen-v2'
);

console.log('Model ready:', isReady);
```

## Parameters Reference

### Image Generation Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `numInferenceSteps` | number | 30 | Quality vs speed (10-50) |
| `guidanceScale` | number | 7.5 | Prompt adherence (1-20) |
| `negativePrompt` | string | - | What to avoid |
| `width` | number | - | Image width (px) |
| `height` | number | - | Image height (px) |

### Text Generation Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxNewTokens` | number | 500 | Max tokens to generate |
| `temperature` | number | 0.7 | Randomness (0-1) |
| `topP` | number | 0.95 | Nucleus sampling (0-1) |
| `topK` | number | 50 | Top-k sampling |
| `repetitionPenalty` | number | 1.1 | Penalize repetition |
| `doSample` | boolean | true | Enable sampling |

## cURL Examples

### Generate Image
```bash
curl -X POST http://localhost:5000/api/mcp/image-generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A sunset over the ocean",
    "options": {
      "numInferenceSteps": 30,
      "guidanceScale": 7.5
    }
  }'
```

### Generate Text
```bash
curl -X POST http://localhost:5000/api/mcp/text-generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about coding",
    "options": {
      "maxNewTokens": 100,
      "temperature": 0.8
    }
  }'
```

### List Models
```bash
curl http://localhost:5000/api/mcp/models/text-to-image
```

### Check Model Status
```bash
curl http://localhost:5000/api/mcp/model-status/philipp-zettl%2FUnfilteredAI-NSFW-gen-v2
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

Common errors:
- **503**: MCP service not configured (missing API key)
- **400**: Bad request (missing required parameters)
- **500**: Server error (API failure, network issue)

## Fallback Behavior

The image generation service uses MCP as primary with automatic fallback:

1. **Attempt MCP**: Try generating via MCP service
2. **Log Warning**: If MCP fails, log the error
3. **Fallback**: Automatically use direct Hugging Face API
4. **Retry Logic**: Up to 3 attempts with exponential backoff

This ensures high availability even if MCP has issues.

## Files

- `server/huggingfaceMcpService.ts` - MCP service implementation
- `server/imageService.ts` - Image generation with MCP integration
- `server/routes.ts` - API endpoints for MCP

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.20.1",
  "huggingface-mcp-server": "^1.0.26",
  "@huggingface/inference": "^4.11.3"
}
```

## Troubleshooting

### Service Not Available
```
Error: Hugging Face MCP service not configured
```
**Solution**: Verify `HUGGINGFACE_API_KEY` is set in `.env`

### Model Loading
```
Error: Model is currently loading. Please try again in a moment.
```
**Solution**: Wait 10-30 seconds and retry (cold start)

### Import Errors
If you see module import errors, ensure you're using the correct extension:
```typescript
// Correct
import { getHuggingFaceMCPService } from './huggingfaceMcpService.ts';

// Or without extension in some setups
import { getHuggingFaceMCPService } from './huggingfaceMcpService';
```

## Best Practices

1. **Always check if service is available** before using
2. **Handle both success and error cases**
3. **Use appropriate timeouts** for long-running requests
4. **Leverage the fallback mechanism** for reliability
5. **Monitor model loading times** and cache when possible
6. **Use negative prompts** for better image quality
7. **Adjust temperature** based on desired creativity level
