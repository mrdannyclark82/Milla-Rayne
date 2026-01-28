
# Milla-Rayne 🚀
**The Context-Aware AI Assistant**

Milla-Rayne is a pioneering digital intelligence platform designed as a devoted AI companion. It blends cutting-edge AI research with production-grade systems, offering a hybrid, decentralized, and edge-ready architecture for real-time, multimodal interaction.

---

## ✨ Key Features
- **Enhanced Web UI**: Modern "Futuristic Minimalist" interface featuring glassmorphism, neon accents (Cyan/Purple), and seamless 3D scene integration.
- **Smart AI Orchestration**: Robust multi-provider dispatch system with strict priority (OpenAI → Anthropic → xAI → Mistral → OpenRouter) and automatic fallback.
- **Poly-Model Synthesis**: Integrates Gemini, Mistral, OpenAI, xAI Grok, and more via secure dispatch.
- **🔒 Local LLM Support**: Run models locally with Ollama for complete privacy (see [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md))
- **🤖 Agentic AI Patterns**: Advanced iterative reasoning with multi-step task decomposition and self-verification
- **📱 On-Device AI**: Gemini Nano integration for offline text/image generation on Android with Gemma fallback
- **🎥 Multimodal Processing**: MediaPipe GenAI for vision and audio understanding (image analysis, speech-to-text)
- **Adaptive Multimodal Frontend**: React + Vite client with dynamic scenes, voice interaction, and visual recognition.
- **Edge Processing**: Native Android agent for sub-millisecond local tasks.
- **Enhanced Memory**: SQLite-based memory with encryption, session tracking, and usage analytics.
- **Voice Interaction**: Multi-provider TTS/STT with low latency and automatic fallback.
- **Repository Analysis**: Built-in tools to analyze GitHub repos, suggest improvements, and even create PRs.
- **Predictive Updates**: Monitors AI industry news and recommends relevant features.

---

## 📂 Project Structure
- `client/` – React frontend with adaptive scenes
- `server/` – Node.js + Express backend with Drizzle ORM
- `shared/` – Common utilities and types
- `memory/` – SQLite database and encrypted memory artifacts
- `android/` – Native Android app with Material Design 3
- `cli/` – Terminal-based chat interface

---

## 🚀 Quick Start

### Web App
```bash
npm install
cp .env.example .env   # Add your API keys
npm run dev:all        # Start both main server (5000) and proactive server (5001)
```
Open http://localhost:5000 to start chatting.

**Note**: The application now runs two servers:
- **Main Server (Port 5000)**: Handles core application features, chat, API routes
- **Proactive Server (Port 5001)**: Handles background proactive features to prevent rate limiting

To run servers separately:
```bash
npm run dev              # Main server only (port 5000)
npm run dev:proactive    # Proactive server only (port 5001)
```

### 🔒 Local LLM (Optional - For Privacy)
Want to run AI models locally for complete privacy?
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download a model
ollama pull gemma3:1b

# Enable in Milla
echo "ENABLE_LOCAL_MODEL=true" >> .env
echo "PREFER_LOCAL_MODEL=true" >> .env
```
See [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) for full instructions.

### CLI
```bash
npm run dev   # Start server
npm run cli   # Launch CLI
```

### Android
Open `android/` in Android Studio, configure server URL, and run on emulator/device.

### Docker
```bash
cp .env.example .env
docker-compose up
```
Or pull prebuilt image:
```bash
docker pull ghcr.io/mrdannyclark82/milla-rayne:latest
```

---

## 🧠 Advanced AI Capabilities

### Agentic AI Patterns
Milla-Rayne now includes advanced agentic AI dispatch for complex multi-step reasoning:

```typescript
// Server-side usage
import { agenticDispatch } from './server/agentic-dispatch';

const result = await agenticDispatch(
  'Analyze this codebase and suggest improvements',
  true, // Enable agentic mode
  { maxIterations: 5, requiresVerification: true }
);
```

Features:
- Iterative task decomposition with feedback loops
- Multi-step reasoning and planning
- Self-correction and verification
- Tool usage and external API integration

### On-Device AI (Android)
Gemini Nano integration enables offline AI capabilities on Android devices:

```typescript
// android/src/gemini-nano.ts
import { nano } from './gemini-nano';

await nano.init();
const result = await nano.generate({
  prompt: 'Explain quantum computing',
  maxTokens: 2048
});
```

Features:
- Offline text and image generation
- Automatic fallback to Gemma for unsupported operations
- Low-latency local inference
- 30%+ improvement in Android offline capabilities

### Multimodal Processing
MediaPipe GenAI integration for vision and audio understanding:

```typescript
// client/src/mediapipe-genai.ts
import { genai } from './mediapipe-genai';

// Vision analysis
const imageAnalysis = await genai.analyzeImage(imageFile, 'Describe this scene');

// Audio transcription
const transcript = await genai.audioToText(audioFile);
```

Features:
- Real-time vision understanding (object detection, scene analysis)
- Audio processing (speech-to-text, audio classification)
- Cross-modal generation
- Low-effort integration for vision/audio tasks

🧪 Development
Testing: npm test (Vitest)

Linting: npm run lint

Formatting: npm run format

Database: npm run db:push (Drizzle ORM migrations)

🔒 Security
API keys managed via .env (never commit secrets).

Optional AES-256-GCM encryption for memory data.

See SECURITY.md for details.

🤝 Contributing
Contributions are welcome!

Fork the repo

Create a feature branch

Submit a pull request

See CODE_OF_CONDUCT.md for community guidelines.

📜 License
This project is licensed under the MIT License – see LICENSE for details.

Code

---

## 📜 LICENSE (MIT)

```text
MIT License

Copyright (c) 2025 Danny Clark

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[...standard MIT text...]
