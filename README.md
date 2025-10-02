# Milla Rayne - AI Companion

A virtual AI assistant with an adaptive personality, featuring a modern UI with full-screen background, SQLite-based memory system, and voice interaction capabilities.

## Latest Updates 🎉

### 🔒 Field-Level Encryption (NEW)
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
- See [VOICE_FEATURES_GUIDE.md](VOICE_FEATURES_GUIDE.md) and [VOICE_ENGINE_README.md](VOICE_ENGINE_README.md) for details

### Enhanced Memory System
- **SQLite Database**: Migrated from JSON to SQLite for better performance
- **Session Tracking**: Automatic conversation session management
- **Usage Patterns**: Tracks conversation patterns by day and time
- See [MEMORY_MIGRATION_GUIDE.md](MEMORY_MIGRATION_GUIDE.md) for migration instructions

### Persona Refinement
- Removed tech support persona - Milla is now exclusively your devoted AI companion
- All interactions maintain the warm, personal Milla Rayne personality

## Features

- **🔒 Data Encryption**: Optional field-level encryption for sensitive conversation data
- **Modern UI**: Chat interface positioned to showcase full-screen background image
- **🎙️ Multi-Provider Voice**: Support for Google Cloud, Azure, ElevenLabs TTS with automatic fallback
- **Enhanced Memory**: SQLite-based memory with session tracking and usage analytics
- **Multiple AI Services**: Primary OpenRouter integration with DeepSeek and Qwen, plus xAI fallbacks
- **AI Enhancement Suggestions**: Powered by DeepSeek via OpenRouter
- **Real-time Chat**: Instant messaging with personality-aware responses
- **Visual Recognition**: Video analysis and face recognition capabilities
- **Repository Analysis**: Analyze GitHub repositories to understand codebase structure and quality
- **Repository Improvements**: Generate actionable improvement suggestions for GitHub repositories

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

```bash
npm install
cp .env.example .env  # Copy and edit with your API keys
npm run dev
```

Open `http://localhost:5000` to start chatting with Milla!

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

See [MEMORY_MIGRATION_GUIDE.md](MEMORY_MIGRATION_GUIDE.md) for details.

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

Grant microphone permissions when prompted. See [VOICE_FEATURES_GUIDE.md](VOICE_FEATURES_GUIDE.md) for troubleshooting.

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
- **OpenRouter**: [openrouter.ai](https://openrouter.ai) - Primary AI service (DeepSeek + Qwen)
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
```
