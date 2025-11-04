# AI Service Configuration Summary

## Available AI Services

Milla Rayne uses multiple AI services for different purposes:

### 1. **xAI (Grok-4-Fast-Reasoning)** - Primary Conversational AI
- **Used for**: Main chat responses, personality interactions
- **Model**: `grok-4-fast-reasoning` (configurable via `XAI_MODEL` env var)
- **Default**: `grok-beta` if not specified
- **Config**: `XAI_API_KEY`
- **Service file**: `server/xaiService.ts`
- **Token limit**: 800 tokens output (default), configurable via `MAX_OUTPUT_TOKENS`
- **Temperature**: 0.8
- **Notes**: This is the main AI that powers Milla's personality with fast reasoning capabilities

### 2. **OpenRouter (MiniMax-M2)** - Fallback Conversational AI
- **Used for**: Conversational fallback, some specialized features
- **Model**: `minimax/minimax-m2:free` (configurable via `MINIMAX_MODEL`)
- **Config**: `OPENROUTER_MINIMAX_API_KEY` or `OPENROUTER_API_KEY`
- **Service file**: `server/openrouterService.ts`
- **Token limit**: 400 tokens output (default)
- **Temperature**: 0.8
- **Frequency penalty**: 0.6 (reduces repetition)
- **Presence penalty**: 0.4 (encourages new topics)

### 3. **OpenRouter (Grok-1-Fast)** - Repository Analysis
- **Used for**: GitHub repository analysis ONLY
- **Model**: Configurable via `OPENROUTER_GROK1_MODEL` (currently: x-ai/grok-code-fast-1)
- **Default**: `x-ai/grok-1-fast` if not specified
- **Config**: `OPENROUTER_GROK1_API_KEY` (falls back to `OPENROUTER_API_KEY`)
- **Service file**: `server/repositoryAnalysisService.ts` (calls `openrouterService.ts`)
- **Token limit**: 1000 tokens output
- **Temperature**: 0.7
- **Function**: `generateGrokResponse()`
- **Notes**: Uses xAI's Grok-1-Fast for fast code analysis via OpenRouter

### 4. **OpenRouter (Gemini)** - Image Generation/Enhancement
- **Used for**: Enhanced image descriptions, image generation fallback
- **Config**: `OPENROUTER_GEMINI_API_KEY`
- **Service file**: `server/openrouterImageService.ts`

### 5. **Gemini Direct** - Image Analysis
- **Used for**: Direct Gemini API calls for image analysis
- **Config**: `GEMINI_API_KEY`
- **Service file**: Various image services

### 6. **Qwen (via OpenRouter)** - Code Generation
- **Used for**: Code generation requests
- **Service file**: `server/openrouterCodeService.ts`

### 7. **Hugging Face** - Image Generation
- **Used for**: AI image generation (fallback)
- **Config**: `HUGGINGFACE_API_KEY`, `HUGGINGFACE_MODEL`

### 8. **Banana** - Image Generation
- **Used for**: Primary image generation
- **Config**: `BANANA_API_KEY`, `BANANA_API_URL`, etc.

## Service Priority Flow

### For Chat Messages:
1. **xAI (Grok-4-Fast-Reasoning)** - Primary (configurable)
2. **OpenRouter (MiniMax-M2)** - Fallback if xAI fails
3. **Intelligent fallback** - Pattern-based responses if both fail

### For Repository Analysis:
1. **OpenRouter (Grok-1-Fast)** - Primary (uses dedicated API key)
2. **Manual analysis** - Fallback if OpenRouter fails

### For Image Generation:
1. **Banana** - Try first if configured
2. **OpenRouter (Gemini)** - Secondary
3. **Pollinations.AI** - Free fallback (no API key needed)
4. **Hugging Face** - Last resort if configured

## Token Management

### Input (System Prompt):
- **Persona**: ~500-1000 tokens
- **Scene settings**: ~200-500 tokens
- **Memory context**: Limited to relevant memories only
- **Context info**: Max 15K characters (~3750 tokens)
- **Conversation history**: Last 4 messages (xAI) or 2 messages (OpenRouter)
- **REMOVED**: Project file structure (was adding ~50K+ tokens!)

### Output:
- **Default**: 1024 tokens (configurable via `MAX_OUTPUT_TOKENS` env var)
- **xAI default**: 800 tokens
- **OpenRouter default**: 400 tokens
- **Grok Code**: 1000 tokens

## Recent Fix: Token Overflow

**Problem**: System prompt was including entire project file structure (3,346+ files) in every message, causing 250K+ token messages.

**Solution**: Removed the file structure injection from `xaiService.ts`:
```typescript
// REMOVED THIS SECTION:
### YOUR PROJECT FILE STRUCTURE:
---
${projectFileStructure.join('\n')}
---
```

This reduced system prompt size by ~50,000+ tokens per message!

## Environment Variables

Required for full functionality:
```bash
# Primary AI
XAI_API_KEY=your_xai_key
XAI_MODEL=grok-4-fast-reasoning              # The actual Grok-4 model with fast reasoning

# Repository Analysis (OpenRouter with Grok)
OPENROUTER_GROK1_API_KEY=your_grok1_key      # Dedicated key for Grok 1 Fast
OPENROUTER_GROK1_MODEL=x-ai/grok-code-fast-1 # Default: x-ai/grok-1-fast

# Fallback conversational AI
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MINIMAX_API_KEY=your_minimax_key  # MiniMax-specific key

# Optional specialized services
OPENROUTER_GEMINI_API_KEY=your_gemini_key    # For image services
GEMINI_API_KEY=your_gemini_direct_key        # Direct Gemini API
HUGGINGFACE_API_KEY=your_hf_key              # Image generation
BANANA_API_KEY=your_banana_key               # Image generation

# Configuration
MAX_OUTPUT_TOKENS=1024                        # Default: 1024
MINIMAX_MODEL=minimax/minimax-m2:free        # Default model for OpenRouter
```

## Notes

- **NO OpenAI usage** - Repository analysis uses Grok via OpenRouter, not OpenAI
- xAI is the primary conversational engine with better personality
- OpenRouter provides multiple model options and fallback capabilities
- Image generation has multiple fallback layers for reliability
- Token limits are intentionally conservative to reduce costs and latency
