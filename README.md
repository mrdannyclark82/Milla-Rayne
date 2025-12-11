
# Milla-Rayne 🚀
**The Context-Aware AI Assistant**

Milla-Rayne is a pioneering digital intelligence platform designed as a devoted AI companion. It blends cutting-edge AI research with production-grade systems, offering a hybrid, decentralized, and edge-ready architecture for real-time, multimodal interaction.

---

## ✨ Key Features
- **Poly-Model Synthesis**: Integrates Gemini, Mistral, OpenAI, xAI Grok, and more via secure dispatch.
- **🔒 Local LLM Support**: Run models locally with Ollama for complete privacy (see [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md))
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
npm run dev
```
Open http://localhost:5000 to start chatting.

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
