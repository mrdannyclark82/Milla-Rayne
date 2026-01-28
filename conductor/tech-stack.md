# Tech Stack - Milla-Rayne

## 1.0 Core Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Drizzle ORM
- **Authentication:** Custom (bcryptjs, cookie-parser)

## 2.0 Core Frontend
- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, Bootstrap (fallback/specific components)
- **UI Components:** Radix UI, Lucide React
- **3D Engine:** Three.js (via @react-three/fiber and @react-three/drei)

## 3.0 Database & Storage
- **Local/Development Database:** SQLite (via better-sqlite3)
- **Production Database:** PostgreSQL
- **Vector Storage:** Pinecone / ChromaDB
- **Caching:** Redis (Upstash)

## 4.0 AI & Intelligence
- **Primary Models:** OpenAI (GPT-4o), Anthropic (Claude 3.5), xAI (Grok), Mistral, OpenRouter (DeepSeek, Qwen, Gemini)
- **Local LLM Support:** Ollama integration, Local TFLite (Gemma)
- **Multimodal:** TensorFlow.js (Vision), Google/OpenAI TTS/STT, ElevenLabs TTS

## 5.0 DevOps & Tooling
- **Containerization:** Docker, Docker Compose
- **Testing:** Vitest
- **Linting & Formatting:** ESLint, Prettier
- **CI/CD:** GitHub Actions
