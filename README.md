# Milla-Rayne: The Context-Aware AI Assistant 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)](https://www.typescriptlang.org/)
[![CI](https://github.com/mrdannyclark82/Milla-Rayne/workflows/CI/badge.svg)](https://github.com/mrdannyclark82/Milla-Rayne/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mrdannyclark82/Milla-Rayne/branch/main/graph/badge.svg)](https://codecov.io/gh/mrdannyclark82/Milla-Rayne)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-✓-blue.svg)](CODE_OF_CONDUCT.md)

>Milla-Rayne is a pioneering digital intelligence platform, architected as an assistant. Its core design pushes the boundaries of human-computer interaction, weaving together cutting-edge AI research with hardened, production-grade systems.



🌐 Architectural Zenith: Hybrid, Decentralized, and Edge-Ready
Milla-Rayne runs on an intrinsically flexible, hybrid architecture designed for zero-latency performance and maximum reach.
Poly-Model Synthesis: Integrates a multitude of state-of-the-art foundation models (Gemini, Mistral, OpenAI, specialized local models) through a secure and optimized dispatch layer, enabling a best-of-breed approach to every cognitive task.
Adaptive Multimodal Frontend: The client application provides a sensory-rich, high-fidelity visual experience, dynamically adapting its virtual environment (SceneManager.tsx) and integrating real-time weather and environmental data for deep context.
Edge Processing: The native mobile application includes a local edge agent (LocalEdgeAgent.kt), enabling critical real-time processing and sensor fusion directly on the user's device, minimizing reliance on remote servers and ensuring sub-millisecond response times for local tasks.

🔒 Cryptographic Assurance: Privacy and Data Integrity
Trust is built into the foundation. Milla-Rayne features advanced cryptographic layers to protect user data and computational integrity.
Zero-Knowledge State: Incorporates Homomorphic Encryption capabilities to allow the system to perform complex analyses on user data in an encrypted state, maintaining cryptographic assurance of privacy for sensitive profile details and memory artifacts.
Hardened Repository Management: An automated system monitors the entire repository, proactively managing enhancements, security audits, and deployment integrity, ensuring a robust and continuously evolving codebase.


## 📑 Table of Contents

- [Latest Updates](#latest-updates-)
- [Platforms](#available-platforms)
  - [Web App](#-web-app)
  - [CLI](#-cli)
  - [Android](#-android-app)
- [Key Features](#-key-features)
- [Quick Start](#quick-start)
  - [Web App](#web-app-default)
  - [CLI](#cli-version)
  - [Android](#android-app)
  - [Docker Deployment](#-docker-deployment)
- [Configuration](#ai-service-configuration)
- [Development](#development)
  - [CI/CD](#cicd-pipeline)
  - [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

**Available on multiple platforms:**

- 🌐 **Web App**: Modern React-based web interface
- 💻 **CLI**: Terminal-based chat interface
- 📱 **Android**: Native Android app

## Latest Updates 🎉

### 🤖 Proactive Repository Ownership (NEW)

- **Autonomous Improvement**: Milla takes ownership of maintaining and improving the repository
- **Token Incentives**: Earns tokens for bug fixes, features, and optimizations
- **Sandbox Testing**: Safe feature experimentation without breaking main build
- **User-Driven**: Improvements based on interaction patterns and user satisfaction
- **Proactive Communication**: Shares progress, goals, and repository health updates
- See [PROACTIVE_REPOSITORY_OWNERSHIP.md](docs/PROACTIVE_REPOSITORY_OWNERSHIP.md) for complete details

### 🔒 Field-Level Encryption

- **Data Privacy**: Optional AES-256-GCM encryption for message content at rest
- **Zero Impact**: No performance penalty, backward compatible with existing data
- **Easy Setup**: Just add `MEMORY_KEY` to your `.env` file
- See [SECURITY.md](SECURITY.md) for setup instructions

### Voice Features

- **Multi-Provider TTS**: Support for Google Cloud, Azure, ElevenLabs, and browser-native voices
- **US English (Southern) Accent**: Prioritized natural, expressive female voices
- **Low Latency**: Optimized for conversational response times
- **Automatic Fallback**: Seamless switching between providers
- **Speech-to-Text**: Use your microphone to send voice messages
- See [VOICE_FEATURES_GUIDE.md](docs/VOICE_FEATURES_GUIDE.md) and [VOICE_ENGINE_README.md](docs/VOICE_ENGINE_README.md) for details

### Enhanced Memory System

- **SQLite Database**: Migrated from JSON to SQLite for better performance
- **Session Tracking**: Automatic conversation session management
- **Usage Patterns**: Tracks conversation patterns by day and time
- See [MEMORY_MIGRATION_GUIDE.md](docs/MEMORY_MIGRATION_GUIDE.md) for migration instructions

### Persona Refinement

- Removed tech support persona - Milla is now exclusively your devoted AI companion
- All interactions maintain the warm, personal Milla Rayne personality

## Available Platforms

### 🌐 Web App
- Modern React-based web interface with full-screen backgrounds
- Real-time chat with adaptive scenes
- Voice interaction support (TTS & STT)
- Visual memory and face recognition
- GitHub repository analysis

**Quick Start**: `npm run dev` → Open `http://localhost:5000`

### 💻 CLI
- Terminal-based chat interface
- Colorful ANSI-formatted messages
- Conversation history viewing
- Interactive commands (/help, /history, /clear, /exit)
- Connects to the same backend server

**Quick Start**: `npm run cli` (requires server running)  
**Documentation**: [cli/README.md](cli/README.md)

### 📱 Android App
- Native Android app with Material Design 3
- Offline conversation storage with Room database
- Beautiful gradient backgrounds
- Smooth message animations
- Retrofit-based API client

**Quick Start**: Open `android/` in Android Studio  
**Documentation**: [android/APP_README.md](android/APP_README.md)

## ✨ Key Features

### 🔐 Privacy & Security
- **Field-Level Encryption**: AES-256-GCM encryption for sensitive conversation data
- **Local Storage**: All data stored locally with SQLite database
- **No Cloud Lock-in**: Works with multiple AI providers or self-hosted models

### 🎨 User Experience
- **Modern UI**: Beautiful chat interface with full-screen backgrounds
- **Adaptive Scenes**: Dynamic CSS animated gradients that change with context
- **Multi-Platform**: Web, CLI, and native Android app
- **Real-time Chat**: Instant messaging with personality-aware responses

### 🎙️ Voice Interaction
- **Multi-Provider TTS**: Support for Google Cloud, Azure, ElevenLabs, and browser-native voices
- **Speech-to-Text**: Use your microphone for voice input
- **Low Latency**: Optimized for natural conversation flow
- **Automatic Fallback**: Seamless provider switching

### 🧠 Intelligence
- **Enhanced Memory**: SQLite-based memory with session tracking and usage analytics
- **Multiple AI Providers**: OpenRouter (DeepSeek, Qwen), xAI (Grok), Mistral, and more
- **Visual Recognition**: Video analysis and face recognition capabilities
- **Code Generation**: Specialized Qwen Coder model for programming tasks
- **Proactive Ownership**: Milla autonomously maintains and improves the repository

### 🔧 Developer Features
- **Repository Analysis**: Analyze GitHub repositories for structure and quality
- **AI Suggestions**: Automated code improvement recommendations
- **Sandbox Testing**: Safe feature experimentation without admin tokens
- **Token Incentives**: Rewards system for improvements and bug fixes
- **User Analytics**: Track patterns and measure success through engagement
- **Extensible**: Easy to add new AI providers and features
- **Well-Documented**: Comprehensive guides and API documentation

## AI Service Configuration

### Primary Chat Service: OpenRouter (DeepSeek)

- **Model**: `deepseek/deepseek-chat-v3.1:free` (DeepSeek Chat)
- **Endpoint**: `/api/chat` and `/api/openrouter-chat`
- **Setup**: Add `OPENROUTER_API_KEY=your_key_here` to `.env`
- **Fallback**: Intelligent contextual responses when API key not configured
- **Use**: All message and chat requests

### Code Generation Service: OpenRouter (Qwen)

- **Model**: `qwen/qwen-2.5-coder-32b-instruct` (Qwen Coder)
- **Endpoint**: `/api/chat` (automatically detects code requests)
- **Setup**: Add `OPENROUTER_API_KEY=your_key_here` to `.env`
- **Use**: All code generation requests

### Enhancement Suggestions: OpenRouter (DeepSeek)

- **Model**: `deepseek/deepseek-chat-v3.1:free` (DeepSeek Chat)
- **Endpoint**: `/api/suggest-enhancements`
- **Setup**: Add `OPENROUTER_API_KEY=your_key_here` to `.env`
- **Fallback**: Curated project enhancement suggestions

### Image Generation Service: OpenRouter (Gemini)

- **Model**: `google/gemini-pro-vision` (Gemini Pro Vision)
- **Endpoint**: `/api/chat` (automatically detects image generation requests)
- **Setup**: Add `OPENROUTER_GEMINI_API_KEY=your_key_here` to `.env`
- **Fallback**: Enhanced descriptions using Gemini language model
- **Use**: Create images from text prompts (e.g., "create an image of a sunset")

### Additional Services Available

- **xAI Grok**: `XAI_API_KEY` - Alternative AI service for specialized tasks
- **OpenAI/Perplexity**: `PERPLEXITY_API_KEY` - Additional AI option

### API Key Setup

🚨 **CRITICAL SECURITY WARNING**:

- **NEVER** commit actual API keys to version control!
- If you accidentally commit API keys, they become publicly visible and will be automatically revoked by providers
- Always use `.env` files for local development (they are git-ignored)

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual API keys:

   ```env
   OPENROUTER_API_KEY=your_actual_openrouter_key_here
   OPENROUTER_GEMINI_API_KEY=your_actual_openrouter_gemini_key_here
   XAI_API_KEY=your_actual_xai_key_here
   ```

3. **Verify** your `.env` file is git-ignored:
   ```bash
   git check-ignore .env  # Should output: .env
   ```

**🆘 If you already committed API keys by mistake:**

1. Remove the file from git tracking: `git rm --cached .env`
2. Replace real keys with placeholders in your local `.env`
3. Get new API keys from your providers (old ones are likely revoked)
4. Commit the removal: `git commit -m "Remove API keys from version control"`

**Note**: The system works without API keys using intelligent fallback responses.

## Quick Start

### Web App (Default)

```bash
npm install
cp .env.example .env  # Copy and edit with your API keys
npm run dev
```

Open `http://localhost:5000` to start chatting with Milla!

### CLI Version

For a terminal-based interface:

```bash
# Start the server in one terminal
npm run dev

# In another terminal, start the CLI
npm run cli
```

See [cli/README.md](cli/README.md) for CLI documentation.

### Android App

To build and run the Android app:

1. Open the `android` directory in Android Studio
2. Configure the server URL in `app/src/main/res/values/strings.xml`
3. Build and run on an emulator or device

See [android/APP_README.md](android/APP_README.md) for complete setup instructions.

### 🐳 Docker Deployment

Run Milla Rayne with Docker for easy deployment:

```bash
# Using Docker Compose (recommended)
cp .env.example .env  # Edit with your API keys
docker-compose up

# Or build and run manually
docker build -t milla-rayne .
docker run -p 5000:5000 --env-file .env milla-rayne
```

**Pre-built images available:**
```bash
docker pull ghcr.io/mrdannyclark82/milla-rayne:latest
```

See [CICD_DOCUMENTATION.md](CICD_DOCUMENTATION.md) for detailed Docker documentation.

### First-Time Setup

If you have existing conversation data in `memory/memories.txt`:

```bash
# Migrate to SQLite (one-time operation)
npm run migrate:memory
```

This will:

- Convert your memories.txt to SQLite database
- Create session tracking
- Analyze usage patterns
- Backup your original file

See [MEMORY_MIGRATION_GUIDE.md](docs/MEMORY_MIGRATION_GUIDE.md) for details.

### Predictive Updates Behavior

Milla can share daily improvement suggestions when enabled:

**Configuration** (in `.env`):

- `ENABLE_PREDICTIVE_UPDATES=true` - Enable daily suggestions feature
- `AI_UPDATES_CRON="0 9 * * *"` - Schedule (default: 9:00 AM daily)
- `ENABLE_DEV_TALK=false` - Control automatic development/analysis talk
- `ADMIN_TOKEN=your_token` - Optional token for accessing AI updates API

**Behavior**:

- **Daily Suggestion**: Milla shares one concise suggestion per day when you first chat
- **Manual Control**: Ask "what's new?" to see today's suggestion anytime
- **Dev Talk Gating**: When `ENABLE_DEV_TALK=false` (default):
  - GitHub URLs won't trigger automatic analysis
  - Milla won't mention development capabilities unless you explicitly ask
  - Use phrases like "analyze this repo" or "improve this code" to activate analysis features
- **Explicit Requests Always Work**: Analysis endpoints and explicit commands always function regardless of settings

This keeps Milla focused on her core companion personality while making development features available on-demand.

### Voice Features Setup

Voice features work out of the box with supported browsers:

- ✅ Chrome/Edge (full support)
- ✅ Safari (full support)
- ⚠️ Firefox (limited support)

Grant microphone permissions when prompted. See [VOICE_FEATURES_GUIDE.md](docs/VOICE_FEATURES_GUIDE.md) for troubleshooting.

### Adaptive Scene Backgrounds

The application supports dynamic backgrounds that adapt to the conversation context:

#### Background Modes

1. **CSS Animated (Default)**: Dynamic gradient animations that respond to mood, time of day, and location
2. **Static Image**: Photo-realistic backgrounds for specific rooms/locations
3. **Auto**: Intelligently switches between CSS and static images based on context

#### Adding Custom Room Backgrounds

1. **Prepare your images**:
   - Recommended resolution: 1920x1080 or higher
   - Format: JPG or PNG
   - Optimize for web (target < 500KB per image)

2. **Use the naming convention**:

   ```
   /client/public/assets/scenes/
   ├── living_room.jpg              # Base living room image
   ├── living_room-night.jpg        # Night time variant
   ├── kitchen.jpg                  # Kitchen image
   ├── bedroom-night.jpg            # Bedroom at night
   └── ... (more rooms)
   ```

3. **Supported locations**: living_room, bedroom, kitchen, bathroom, dining_room, outdoor, car, front_door

4. **Time-of-day variants** (optional):
   - `{location}-morning.jpg` - Early morning (6am-10am)
   - `{location}-day.jpg` - Daytime (10am-5pm)
   - `{location}-dusk.jpg` - Evening (5pm-8pm)
   - `{location}-night.jpg` - Nighttime (8pm-6am)

5. **Toggle background mode** in Scene Settings:
   - Open the Scene dialog (gear icon)
   - Select "Background Mode"
   - Choose between CSS Animated, Static Image, or Auto

For complete documentation, see `/client/public/assets/scenes/README.md`

**Example**: Adding a living room background:

```bash
# Copy your image to the scenes directory
cp my-living-room.jpg /client/public/assets/scenes/living_room.jpg

# Optional: Add time-specific variants
cp my-living-room-night.jpg /client/public/assets/scenes/living_room-night.jpg
```

The system will automatically detect and use the images when:

- Background mode is set to "Static Image" or "Auto"
- User navigates to that location in roleplay (e.g., `*walks into the living room*`)
- Time of day matches a variant (if available)

If no image exists, the system gracefully falls back to CSS animated backgrounds.

## 🔒 Security & API Key Management

This project requires API keys for full functionality. **NEVER commit actual API keys to version control.**

### For Local Development:

1. Use `.env` file (automatically ignored by git)
2. Copy from `.env.example` template
3. Replace placeholder values with your actual keys

### For Production/Deployment:

- **Replit**: Use the Secrets tab in your repl
- **Vercel**: Use Environment Variables in project settings
- **Heroku**: Use Config Vars in app settings
- **GitHub Actions**: Use Repository Secrets
- **Docker**: Use environment variables or secrets management

### Data Encryption at Rest (Optional but Recommended)

Protect your conversation data with field-level encryption:

1. **Generate an encryption key:**

   ```bash
   openssl rand -base64 32
   ```

2. **Add to your `.env` file:**

   ```env
   MEMORY_KEY=your_generated_key_here
   ```

3. **Restart the application** - all new messages will be encrypted automatically

**Benefits:**

- ✅ AES-256-GCM encryption with authentication
- ✅ Protects personal data in SQLite database
- ✅ No performance impact
- ✅ Backward compatible with existing data
- ✅ Repository analysis features continue to work

**Important:** Store your `MEMORY_KEY` securely - encrypted data cannot be recovered without it!

See [SECURITY.md](SECURITY.md) for detailed security documentation.

### API Key Sources:

- **OpenRouter**: [openrouter.ai](https://openrouter.ai) - Primary AI service (DeepSeek + Qwen + Gemini Image Generation)
- **xAI**: [console.x.ai](https://console.x.ai) - Alternative AI service
- **GitHub**: [github.com/settings/tokens](https://github.com/settings/tokens) - For repository analysis

### Memory Encryption Key (MEMORY_KEY)

Milla encrypts sensitive conversation data using AES-256-GCM encryption. You need to set a `MEMORY_KEY` environment variable.

#### Initial Setup

1. **Generate a secure key**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add to your `.env` file**:

   ```env
   MEMORY_KEY=your_generated_64_character_hex_key_here
   ```

3. **Run the encryption migration** (one-time):
   ```bash
   npx tsx server/encryptMigration.ts
   ```

This will encrypt all existing messages in the SQLite database and visual_memories.json file.

#### Key Rotation

If you need to change your encryption key:

1. **Decrypt with old key**: Set old `MEMORY_KEY` in `.env`
2. **Export data**: Back up your `memory/milla.db` and `memory/visual_memories.json`
3. **Generate new key**: Use the command above
4. **Update `.env`**: Replace `MEMORY_KEY` with new key
5. **Re-run migration**: `npx tsx server/encryptMigration.ts` to re-encrypt with new key

⚠️ **Important**:

- Keep your `MEMORY_KEY` secure and backed up
- Changing the key without proper migration will make existing data unreadable
- The key must be at least 32 characters long

#### Verification

After running the migration, verify encryption:

```bash
# Check that messages start with "enc:v1:"
sqlite3 memory/milla.db "SELECT content FROM messages LIMIT 1;"

# Check visual memories (should show encrypted data)
head -c 50 memory/visual_memories.json
```

### GitHub Token for Private Repositories

To analyze private GitHub repositories, configure a GitHub Personal Access Token:

#### Setup Instructions

1. **Create token**: Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. **Click** "Generate new token (classic)"
3. **Set name**: e.g., "Milla Repository Analysis"
4. **Select scopes**:
   - ✅ `repo` - Full control of private repositories (includes repo:read)
   - ✅ `workflow` - Update GitHub Action workflows (optional)
   - For public repos only: `public_repo` is sufficient
5. **Generate** and copy the token (starts with `ghp_`)
6. **Add to `.env`**:
   ```env
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```

#### Usage

- **Public repos**: Work without token (but token improves API rate limits)
- **Private repos**: Require token with `repo` scope
- **Error messages**: If you see 403/404 errors, check:
  - Token is set correctly
  - Token has necessary permissions
  - Repository name is correct
  - You have access to the repository

#### Token Security

⚠️ **Never commit your GitHub token to version control!**

- Tokens grant write access to your repositories
- Rotate tokens regularly for security
- Revoke tokens you're no longer using
- Store tokens in environment variables only

## 🔧 Repository Analysis & Improvement

Milla can analyze GitHub repositories and suggest specific improvements to enhance your codebase, with advanced features including:

- **🔒 Security Scanning**: Identifies potential security vulnerabilities
- **⚡ Performance Analysis**: Detects performance bottlenecks and optimization opportunities
- **🧪 Automated Testing**: Validates suggested changes before applying them
- **🤖 Automatic Pull Requests**: Creates PRs directly via GitHub API
- **📝 Language-Specific Patterns**: Provides best practices for different programming languages

### How to Use

1. **Analyze a Repository**: Simply paste a GitHub repository URL in the chat
   ```
   https://github.com/username/repository
   ```
2. **Get Improvement Suggestions**: After analysis, ask Milla to suggest improvements

   ```
   suggest improvements
   improve this repo
   enhance the code
   ```

3. **Automatic PR Creation** (New!): Provide a GitHub token to create pull requests automatically
   ```
   Apply these changes with my token: ghp_...
   ```

### What Milla Can Do

- **Analyze Repository Structure**: Understand the codebase architecture and organization
- **Security Scanning**: Detect hardcoded credentials, SQL injection risks, XSS vulnerabilities
- **Performance Analysis**: Identify inefficient code patterns and optimization opportunities
- **Code Quality**: Check for code smells, commented code, and maintainability issues
- **Language-Specific Suggestions**: TypeScript, JavaScript, Python, Java, Go best practices
- **Generate Documentation**: Recommend README improvements and documentation additions
- **CI/CD Automation**: Suggest GitHub Actions workflows with security scanning
- **Security Policy**: Generate SECURITY.md for vulnerability reporting
- **Automated Testing**: Validate improvements before applying them
- **GitHub API Integration**: Create pull requests automatically with proper testing

### API Endpoints

- `POST /api/analyze-repository` - Analyze a GitHub repository
  - Body: `{ "repositoryUrl": "https://github.com/owner/repo" }`
- `POST /api/repository/improvements` - Generate improvement suggestions
  - Body: `{ "repositoryUrl": "https://github.com/owner/repo", "focusArea": "optional" }`
  - Focus areas: `"security"`, `"performance"`, `"documentation"`, etc.
- `POST /api/repository/analyze-code` - Perform deep code analysis (New!)
  - Body: `{ "repositoryUrl": "https://github.com/owner/repo" }`
  - Returns: Security issues, performance issues, code quality issues, language-specific suggestions
- `POST /api/repository/test-improvements` - Test improvements before applying (New!)
  - Body: `{ "repositoryUrl": "...", "improvements": [...] }`
  - Returns: Validation results, test reports, risk assessment
- `POST /api/repository/apply-improvements` - Apply improvements via GitHub API (Enhanced!)
  - Body: `{ "repositoryUrl": "...", "improvements": [...], "githubToken": "optional" }`
  - With token: Creates pull request automatically
  - Without token: Provides manual instructions

### GitHub Token Setup (for Automatic PRs)

To enable automatic pull request creation, you need a GitHub Personal Access Token:

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Milla Repository Improvements")
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)
7. Add to your `.env` file:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   ```

**Security Note**: The token allows write access to your repositories. Keep it secret!

### Example Workflow

```
User: https://github.com/myusername/myproject
Milla: *analyzes the repository*
       I can see this is a TypeScript project with...
       [analysis details]

       💡 Would you like me to suggest improvements?

User: yes, suggest improvements
Milla: *generates improvement suggestions*

       1. Add comprehensive README
          - Create/update README.md with setup instructions
          - Files: README.md
          - Reason: Good documentation helps users understand the project

       2. Add .gitignore file
          - Prevent committing sensitive files
          - Files: .gitignore
          - Reason: Protects API keys and prevents node_modules in git

       3. Add CI/CD workflow with security scanning
          - Automate testing and security analysis
          - Files: .github/workflows/ci.yml
          - Reason: Catches bugs and vulnerabilities early

       [more suggestions...]

User: Apply these changes automatically
Milla: *creates pull request via GitHub API*

       🎉 Pull request created!
       🔗 https://github.com/myusername/myproject/pull/42

       The PR includes:
       ✅ All syntax tests passed
       ⚠️ 2 warnings (review recommended)
       📊 Risk level: Low
```

### Code Analysis Features

#### Security Scanning

- Detects hardcoded passwords and API keys (CWE-798)
- Identifies eval() usage and code injection risks (CWE-95)
- Finds XSS vulnerabilities from innerHTML (CWE-79)
- Checks for insecure random number generation (CWE-338)
- Language-specific security patterns for JS, TS, Python, Java, Go

#### Performance Analysis

- DOM queries inside loops
- High-frequency intervals
- Inefficient string concatenation
- Array operations in loops
- JSON.parse(JSON.stringify()) deep cloning

#### Code Quality

- Long functions (>100 lines)
- Unresolved TODO/FIXME comments
- Excessive commented-out code
- Language-specific best practices

#### Automated Testing

- Syntax validation (JSON, YAML, Markdown, JS/TS)
- File size checks
- Risk assessment (low/medium/high)
- Impact estimation (lines changed, files modified)
- Comprehensive test reports

## 🔮 Predictive Updates

Milla can automatically track AI industry updates from curated sources and generate actionable feature recommendations tailored to this project.

### Overview

The predictive updates system:

- **Fetches AI news**: Monitors RSS feeds from OpenAI, xAI, Perplexity, HuggingFace, GitHub Changelog, and more
- **Computes relevance**: Analyzes updates based on project stack (OpenRouter, xAI, SQLite, voice features, etc.)
- **Generates recommendations**: Converts relevant updates into concrete implementation suggestions
- **Scheduled updates**: Optionally runs on a configurable cron schedule

### Setup

1. **Enable the feature** in your `.env`:

   ```env
   ENABLE_PREDICTIVE_UPDATES=true
   ```

2. **Configure sources** (optional - defaults to OpenAI, xAI, Perplexity, HuggingFace, GitHub):

   ```env
   AI_UPDATES_SOURCES=https://openai.com/blog/rss.xml,https://x.ai/blog/rss
   ```

3. **Set up scheduling** (optional - leave empty to disable automatic fetching):

   ```env
   # Fetch daily at midnight
   AI_UPDATES_CRON=0 0 * * *

   # Or every 6 hours
   AI_UPDATES_CRON=0 */6 * * *

   # Or weekly on Monday at 9am
   AI_UPDATES_CRON=0 9 * * 1
   ```

4. **Secure admin endpoint** (optional - if set, fetch endpoint requires this token):
   ```env
   ADMIN_TOKEN=your_secure_token_here
   ```

### API Endpoints

#### Get AI Updates

```http
GET /api/ai-updates?source=&minRelevance=0.3&limit=50
```

List stored AI updates with optional filtering.

Query parameters:

- `source` (optional): Filter by source URL
- `minRelevance` (optional): Minimum relevance score (0-1)
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset
- `stats=true` (optional): Get statistics instead of updates

Response:

```json
{
  "success": true,
  "updates": [
    {
      "id": "uuid",
      "title": "OpenAI releases new GPT model",
      "url": "https://...",
      "source": "https://openai.com/blog/rss.xml",
      "published": "2025-01-15T10:00:00Z",
      "summary": "...",
      "tags": "openai, gpt, api",
      "relevance": 0.75,
      "createdAt": "2025-01-15T10:05:00Z"
    }
  ],
  "count": 1
}
```

#### Trigger Manual Fetch

```http
POST /api/ai-updates/fetch
Headers: X-Admin-Token: your_token (if ADMIN_TOKEN is set)
```

Manually trigger a fetch of all configured sources.

Response:

```json
{
  "success": true,
  "itemsAdded": 42,
  "errors": []
}
```

#### Get Recommendations

```http
GET /api/ai-updates/recommendations?minRelevance=0.2&maxRecommendations=10
```

Generate actionable recommendations from stored updates.

Query parameters:

- `minRelevance` (optional): Minimum relevance threshold (default: 0.2)
- `maxRecommendations` (optional): Max recommendations (default: 10)
- `summary=true` (optional): Get summary statistics instead

Response:

```json
{
  "success": true,
  "recommendations": [
    {
      "title": "Consider integrating new AI model: GPT-5 Released",
      "rationale": "A new or updated AI model has been announced...",
      "suggestedChanges": [
        "server/openrouterService.ts - Add new model endpoint",
        "server/routes.ts - Update model selection logic",
        "README.md - Document new model capability"
      ],
      "confidence": 0.85,
      "sourceUpdates": ["https://..."]
    }
  ],
  "count": 1
}
```

### How to Act on Recommendations

1. **Review recommendations**: Call `/api/ai-updates/recommendations` to see suggestions
2. **Evaluate relevance**: Check the `confidence` score and `rationale`
3. **Implement changes**: Follow `suggestedChanges` to update your codebase
4. **Create PRs**: Use GitHub or the repository modification feature to apply changes

### Example Workflow

```bash
# Enable predictive updates
echo "ENABLE_PREDICTIVE_UPDATES=true" >> .env

# Manually fetch updates
curl -X POST http://localhost:5000/api/ai-updates/fetch

# View all updates
curl http://localhost:5000/api/ai-updates?limit=10

# Get recommendations
curl http://localhost:5000/api/ai-updates/recommendations

# Get statistics
curl http://localhost:5000/api/ai-updates?stats=true
```

### Relevance Scoring

Updates are scored based on keywords matching the project's technology stack:

- **Keywords**: OpenRouter, xAI, Qwen, DeepSeek, SQLite, voice, TTS, STT, GitHub Actions, security, API, TypeScript, React, Express, WebSocket, LLM, GPT, Claude, Mistral, Grok

Higher relevance scores indicate updates more likely to benefit this project.

### Non-Goals

- ❌ No UI components in this release (API-only)
- ❌ No automatic PR creation on updates (use repository modification feature separately)
- ❌ No real-time push notifications (polling-based via API)

## Development

This document provides a comprehensive overview of the Milla Rayne project, its architecture, and development practices to guide future interactions and development.

### Project Overview

Milla Rayne is a virtual AI companion with an adaptive personality. It features a modern user interface, a persistent memory system, and voice interaction capabilities. The project is built as a full-stack TypeScript application with a client-server architecture.

### Key Technologies

- **Backend:** Node.js, Express.js, TypeScript
- **Frontend:** React, Vite, Tailwind CSS
- **Database:** SQLite, managed with Drizzle ORM
- **AI/ML:** Integrations with multiple AI services including OpenRouter (DeepSeek, Qwen, Gemini), xAI, and OpenAI. It also uses TensorFlow.js for client-side visual recognition.
- **Testing:** Vitest for unit and integration tests.
- **Linting & Formatting:** ESLint and Prettier.

### Core Features

- **AI Companion:** A personality-driven AI assistant for conversation.
- **Persistent Memory:** Uses an SQLite database to remember past conversations and user details, with support for AES-256-GCM encryption.
- **Voice Interaction:** Supports Text-to-Speech (TTS) and Speech-to-Text (STT) using various providers.
- **Adaptive Scenes:** Dynamically changes UI backgrounds based on conversational context.
- **Repository Analysis:** Can analyze GitHub repositories to provide improvement suggestions and even create Pull Requests.
- **Predictive Updates:** Monitors AI news and suggests relevant feature updates for the project itself.
- **Self-Evolution:** Contains services for self-improvement and task management.

### Building and Running

The project uses `npm` for package management and running scripts.

#### Initial Setup

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create the environment configuration file by copying the example:
    ```bash
    cp .env.example .env
    ```
3.  Fill in the `.env` file with the necessary API keys for AI services, database encryption, and GitHub. The application has fallback mechanisms if keys are not provided.
4.  If you have existing data in `memory/memories.txt`, migrate it to the SQLite database:
    ```bash
    npm run migrate:memory
    ```

#### Development

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

#### Production

To build and run the application in production mode:

1.  Build the client and server:
    ```bash
    npm run build
    ```
2.  Start the production server:
    ```bash
    npm run start
    ```

#### Testing and Code Quality

- **Run tests:**
  ```bash
  npm test
  ```
- **Lint files:**
  ```bash
  npm run lint
  ```
- **Format files:**
  ```bash
  npm run format
  ```

#### Database

The project uses Drizzle ORM for database management.

- To apply schema changes to the database:
  ```bash
  npm run db:push
  ```

### Development Conventions

#### Code Style

Code style is enforced by ESLint and Prettier. Please run `npm run format` and `npm run lint` before committing changes.

#### File Structure

- `server/`: Contains all backend source code.
  - `server/index.ts`: The main entry point for the server.
  - `server/routes.ts`: Defines the API routes.
  - `server/*Service.ts`: Core logic for different features (e.g., `memoryService.ts`, `voiceService.ts`).
- `client/`: Contains all frontend source code (React + Vite).
  - `client/src/main.tsx`: The main entry point for the React application.
- `shared/`: Contains code and types shared between the client and server.
- `memory/`: Contains the SQLite database (`milla.db`) and other memory-related files.
- `docs/`: Contains detailed documentation and specifications for various features.
- `.env`: Environment variables for configuration (API keys, feature flags). This file is ignored by git.

#### API

The backend exposes a RESTful API under the `/api/` path. The routes are defined in `server/routes.ts`. The server is responsible for handling all AI service calls, database interactions, and business logic.

## Development

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

#### Automated Workflows

- **CI**: Runs on every push and PR
  - Linting and formatting checks
  - TypeScript type checking
  - Unit tests with coverage
  - Build verification
  - Matrix testing on Node.js 18.x and 20.x

- **PR Checks**: Comprehensive checks for pull requests
  - Code quality analysis
  - Security audits
  - Bundle size reporting
  - Test coverage reporting

- **CodeQL**: Security vulnerability scanning
  - Weekly automated scans
  - JavaScript/TypeScript and Python analysis

- **Release**: Automated release management
  - Triggered by version tags (`v*.*.*`)
  - Builds Docker images
  - Creates GitHub releases with artifacts

See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) for complete CI/CD setup guide.

### Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

**Coverage Goals:**
- Lines: 80%+
- Functions: 80%+
- Branches: 80%+
- Statements: 80%+

View coverage reports:
- Locally: `coverage/index.html`
- Online: [Codecov Dashboard](https://codecov.io/gh/mrdannyclark82/Milla-Rayne)

### Code Quality

```bash
# Run linter
npm run lint

# Check formatting
npm run format -- --check

# Auto-fix formatting
npm run format

# TypeScript type check
npm run check
```

### Docker Development

```bash
# Build image locally
docker build -t milla-rayne:dev .

# Run with docker-compose
docker-compose up

# Run in development mode with volume mounting
docker-compose -f docker-compose.dev.yml up  # (if available)

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## Documentation

### Living API Documentation

Comprehensive API documentation is automatically generated from the TypeScript source code using TypeDoc and deployed to GitHub Pages with every push to the main branch.

**📚 View the API Documentation:**
- **Live Docs:** [https://mrdannyclark82.github.io/Milla-Rayne/api-docs/](https://mrdannyclark82.github.io/Milla-Rayne/api-docs/)
- **Status:** [![Documentation](https://img.shields.io/badge/docs-live-brightgreen)](https://mrdannyclark82.github.io/Milla-Rayne/api-docs/)

The documentation includes:
- ✅ Full API reference for all services and agents
- ✅ Type definitions and interfaces
- ✅ Function signatures and parameters
- ✅ Usage examples and descriptions
- ✅ Automatically updated on every deployment

### Generating Documentation Locally

To generate and view the documentation on your local machine:

```bash
# Generate documentation
npm run docs:generate

# Watch mode (auto-regenerates on file changes)
npm run docs:watch

# Open the generated docs in your browser
open docs/api/index.html
```

The documentation is generated from TypeScript source files in:
- `server/` - Backend services, agents, and APIs
- `shared/` - Shared types and utilities

### Additional Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[SECURITY.md](SECURITY.md)** - Security policies and reporting
- **[docs/](docs/)** - Detailed feature documentation and guides

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository** and clone it locally
2. **Create a branch** for your feature: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to your fork**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with a clear description of your changes

### Guidelines

- Follow the existing code style (enforced by ESLint and Prettier)
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful and constructive in discussions

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Good First Issues

Looking for somewhere to start? Check out issues labeled `good-first-issue` in the issue tracker.

## Security

Security is a top priority for this project. If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the details to the repository maintainers
3. Allow time for the issue to be addressed before public disclosure

See [SECURITY.md](SECURITY.md) for more information about:
- Security features (field-level encryption, memory security)
- Best practices for API key management
- How to report vulnerabilities
- Security update policy

**Before making this repository public**, please review:
- [SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md) - Critical security items to address
- Rotate all exposed API keys
- Review git history for sensitive data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Liability and warranty disclaimers apply

## Acknowledgments

- Built with [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Express](https://expressjs.com/)
- AI powered by multiple providers including OpenRouter, xAI, and Mistral
- Voice synthesis via Google Cloud TTS, Azure TTS, and ElevenLabs
- Memory system built on [SQLite](https://www.sqlite.org/) with [Drizzle ORM](https://orm.drizzle.team/)

## Support

- 📖 **Documentation**: Check the `/docs` directory for detailed guides
- 💬 **Discussions**: Use GitHub Discussions for questions and community chat
- 🐛 **Bug Reports**: Open an issue with the `bug` label
- 💡 **Feature Requests**: Open an issue with the `enhancement` label

## Roadmap

See [REPOSITORY_ENHANCEMENT_GUIDE.md](REPOSITORY_ENHANCEMENT_GUIDE.md) for future plans and enhancement ideas.

---

**Made with ❤️ by the Milla Rayne community**
