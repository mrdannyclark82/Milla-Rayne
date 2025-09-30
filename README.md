# Milla Rayne - AI Companion

A virtual AI assistant with an adaptive personality, featuring a modern UI with full-screen background and multiple AI service integrations.

## Features

- **Modern UI**: Chat interface positioned to showcase full-screen background image
- **Multiple AI Services**: Primary OpenRouter integration with Mistral, xAI, and OpenAI fallbacks
- **AI Enhancement Suggestions**: Powered by Mistral via GitHub Models API
- **Memory System**: Maintains conversation context and relationship history
- **Real-time Chat**: Instant messaging with personality-aware responses
- **Visual Recognition**: Video analysis and face recognition capabilities
- **Repository Analysis**: Analyze GitHub repositories to understand codebase structure and quality
- **Repository Improvements**: Generate actionable improvement suggestions for GitHub repositories

## AI Service Configuration

### Primary Chat Service: OpenRouter
- **Model**: `deepseek/deepseek-chat-v3.1:free` (DeepSeek Chat)
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
   GITHUB_TOKEN=your_actual_github_token_here
   XAI_API_KEY=your_actual_xai_key_here
   MISTRAL_API_KEY=your_actual_mistral_key_here
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
- **OpenRouter**: [openrouter.ai](https://openrouter.ai) - Primary AI service
- **Mistral**: [console.mistral.ai](https://console.mistral.ai) - Fallback AI service  
- **xAI**: [console.x.ai](https://console.x.ai) - Alternative AI service
- **GitHub**: [github.com/settings/tokens](https://github.com/settings/tokens) - For repository analysis

## 🔧 Repository Analysis & Improvement

Milla can analyze GitHub repositories and suggest specific improvements to enhance your codebase.

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

### What Milla Can Do

- **Analyze Repository Structure**: Understand the codebase architecture and organization
- **Identify Improvements**: Suggest specific file changes and enhancements
- **Generate Documentation**: Recommend README improvements and documentation additions
- **Code Quality**: Suggest .gitignore files, CI/CD workflows, and best practices
- **Actionable Recommendations**: Provide specific file paths, changes, and commit messages

### API Endpoints

- `POST /api/analyze-repository` - Analyze a GitHub repository
  - Body: `{ "repositoryUrl": "https://github.com/owner/repo" }`
  
- `POST /api/repository/improvements` - Generate improvement suggestions
  - Body: `{ "repositoryUrl": "https://github.com/owner/repo", "focusArea": "optional" }`
  
- `POST /api/repository/apply-improvements` - Get instructions for applying improvements
  - Body: `{ "repositoryUrl": "...", "improvements": [...], "githubToken": "optional" }`

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
       
       [more suggestions...]
```
