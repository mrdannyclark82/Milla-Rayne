# Milla Rayne - AI Companion

A virtual AI assistant with an adaptive personality, featuring a modern UI with full-screen background, SQLite-based memory system, and voice interaction capabilities.

## Latest Updates 🎉

### Voice Features
- **Text-to-Speech**: Milla can now speak her responses aloud
- **Speech-to-Text**: Use your microphone to send voice messages
- See [VOICE_FEATURES_GUIDE.md](VOICE_FEATURES_GUIDE.md) for details

### Enhanced Memory System
- **SQLite Database**: Migrated from JSON to SQLite for better performance
- **Session Tracking**: Automatic conversation session management
- **Usage Patterns**: Tracks conversation patterns by day and time
- See [MEMORY_MIGRATION_GUIDE.md](MEMORY_MIGRATION_GUIDE.md) for migration instructions

### Persona Refinement
- Removed tech support persona - Milla is now exclusively your devoted AI companion
- All interactions maintain the warm, personal Milla Rayne personality

## Features

- **Modern UI**: Chat interface positioned to showcase full-screen background image
- **Voice Interaction**: Text-to-speech output and speech-to-text input
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
```
