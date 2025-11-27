# 🔒 API Key Security Guide

## ❌ What NOT to Do (The Problem)

**NEVER store API keys directly in your code or commit them to git!**

```env
# ❌ DON'T DO THIS - This gets committed to the public repository
OPENROUTER_API_KEY=sk-or-v1-abc123...  # This becomes publicly visible!
```

When you commit API keys to a public repository:

1. **Keys become publicly visible** to anyone on the internet
2. **GitHub/providers automatically detect and revoke** the keys for security
3. **Your keys get "cancelled out"** immediately after committing
4. **Malicious actors** can find and abuse your keys

## ✅ What TO Do (The Solution)

### For Local Development

1. **Use `.env` files** (automatically ignored by git):

   ```bash
   cp .env.example .env
   # Edit .env with your real keys - this file won't be committed
   ```

2. **Verify git ignores your .env**:
   ```bash
   git check-ignore .env  # Should output: .env
   ```

### For Production/Deployment

**Store keys as environment variables or secrets:**

- **Replit**: Use the Secrets tab in your repl
- **Vercel**: Environment Variables in project settings
- **Heroku**: Config Vars in app settings
- **GitHub Actions**: Repository Secrets
- **Docker**: Environment variables or secrets management

## 🆘 Already Committed Keys by Mistake?

### Immediate Steps:

1. **Remove from git tracking**:

   ```bash
   git rm --cached .env
   ```

2. **Replace with placeholders** in your local file:

   ```env
   # .env (local file)
   OPENROUTER_API_KEY=your_key_here  # Safe placeholder
   ```

3. **Get new API keys** (old ones are likely already revoked):
   - [OpenRouter](https://openrouter.ai) - Generate new API key
   - [Mistral](https://console.mistral.ai) - Create new key
   - [xAI](https://console.x.ai) - Get fresh key

4. **Commit the fix**:
   ```bash
   git add .gitignore
   git commit -m "Remove API keys from version control and improve security"
   ```

## 🛡️ Prevention Tips

1. **Always check** what you're committing:

   ```bash
   git diff --staged  # Review changes before committing
   ```

2. **Use git hooks** to prevent accidental commits of sensitive files

3. **Keep `.gitignore` updated** with environment file patterns

4. **Use environment templates** (like `.env.example`) for team setup

## 📋 Getting API Keys

- **OpenRouter**: [openrouter.ai](https://openrouter.ai) - Primary AI service
- **Mistral**: [console.mistral.ai](https://console.mistral.ai) - Fallback AI service
- **xAI**: [console.x.ai](https://console.x.ai) - Alternative AI service
- **GitHub**: [github.com/settings/tokens](https://github.com/settings/tokens) - For repository analysis

## ℹ️ System Behavior

The Milla Rayne AI assistant gracefully handles missing API keys:

- **With keys**: Full AI-powered responses
- **Without keys**: Intelligent fallback responses and curated suggestions
- **Partial keys**: Uses available services and falls back for others

This means you can develop and test the application even without all API keys configured.
