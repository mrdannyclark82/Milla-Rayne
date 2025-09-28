# Milla Rayne - AI Companion

A virtual AI assistant with an adaptive personality, featuring a modern UI with full-screen background and multiple AI service integrations.

## Features

- **Modern UI**: Chat interface positioned to showcase full-screen background image
- **Multiple AI Services**: Primary OpenRouter integration with Mistral, xAI, and OpenAI fallbacks
- **AI Enhancement Suggestions**: Powered by Mistral via GitHub Models API
- **Memory System**: Maintains conversation context and relationship history
- **Real-time Chat**: Instant messaging with personality-aware responses
- **Visual Recognition**: Video analysis and face recognition capabilities

## AI Service Configuration

### Primary Chat Service: OpenRouter
- **Model**: `nousresearch/hermes-3-llama-3.1-405b` (Venice: Uncensored)
- **Endpoint**: `/api/chat` and `/api/openrouter-chat`
- **Setup**: Add `OPENROUTER_API_KEY=your_key_here` to `.env`
- **Fallback**: Intelligent contextual responses when API key not configured

### Enhancement Suggestions: Mistral
- **Model**: `mistral-ai/mistral-medium-2505` via GitHub Models
- **Endpoint**: `/api/suggest-enhancements`
- **Setup**: Add `GITHUB_TOKEN=your_token_here` to `.env`
- **Fallback**: Curated project enhancement suggestions

### Additional Services Available
- **xAI Grok**: `XAI_API_KEY` - Alternative AI service
- **Mistral Direct**: `MISTRAL_API_KEY` - Direct Mistral integration
- **OpenAI/Perplexity**: `PERPLEXITY_API_KEY` - Additional AI option

### API Key Setup

Create a `.env` file with your API keys:

```env
OPENROUTER_API_KEY=your_openrouter_key_here
GITHUB_TOKEN=your_github_token_here
XAI_API_KEY=your_xai_key_here
MISTRAL_API_KEY=your_mistral_key_here
```

**Note**: The system works without API keys using intelligent fallback responses.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5000` to start chatting with Milla!
