# MCP Services Implementation Guide

## 🎯 Overview

Milla-Rayne now includes **6 integrated MCP (Model Context Protocol) services** that enhance AI capabilities with file operations, GitHub integration, web search, browser automation, database queries, and enhanced memory.

## 📦 Installed Services

### 1. **Filesystem MCP** 📁
- **Status**: ✅ Implemented & Active by default
- **Purpose**: Secure file system operations
- **Capabilities**:
  - Read/write files
  - List directories
  - Search files by pattern
  - Create/delete files and directories
  - Path security (sandboxed to allowed paths)

### 2. **GitHub MCP** 🐙
- **Status**: ✅ Implemented (requires GITHUB_TOKEN)
- **Purpose**: Enhanced GitHub operations
- **Capabilities**:
  - Search repositories
  - Get file contents
  - Create issues and PRs
  - List commits
  - Search code across GitHub
  - List repository contents

### 3. **Memory MCP** 🧠
- **Status**: ✅ Implemented & Active by default
- **Purpose**: Advanced memory management
- **Capabilities**:
  - Store memories with metadata
  - Search memories by query
  - Retrieve recent/important memories
  - Tag and categorize memories
  - Importance-based retrieval

### 4. **Brave Search MCP** 🔍
- **Status**: ✅ Implemented (requires BRAVE_SEARCH_API_KEY)
- **Purpose**: Real-time web search
- **Capabilities**:
  - Web search
  - News search
  - Image search
  - Query suggestions (autocomplete)

### 5. **Puppeteer MCP** 🎭
- **Status**: ✅ Implemented (optional)
- **Purpose**: Browser automation
- **Capabilities**:
  - Take screenshots
  - Extract page content
  - Click elements
  - Fill forms
  - Execute JavaScript
  - Get all links from pages

### 6. **Postgres MCP** 🐘
- **Status**: ✅ Implemented (requires DATABASE_URL)
- **Purpose**: Direct database operations
- **Capabilities**:
  - Execute raw SQL queries
  - List tables
  - Describe table structures
  - Get row counts
  - Transaction support
  - Database analytics

## 🚀 Quick Start

### Installation

All MCP services are already implemented! No package installation needed.

### Configuration

1. **Copy environment template**:
```bash
cp .env.example .env
```

2. **Enable desired services in `.env`**:

```bash
# Always enabled (no API key needed)
MCP_FILESYSTEM_ENABLED=true
MCP_MEMORY_ENABLED=true

# Requires GITHUB_TOKEN
MCP_GITHUB_ENABLED=true
GITHUB_TOKEN=ghp_your_token_here

# Requires Brave API key
MCP_BRAVE_SEARCH_ENABLED=true
BRAVE_SEARCH_API_KEY=your_key_here

# Optional services
MCP_PUPPETEER_ENABLED=true
MCP_POSTGRES_ENABLED=true
```

3. **Start the server**:
```bash
npm run dev
```

## 📚 API Reference

### Filesystem MCP

#### Read File
```bash
POST /api/mcp/filesystem/read
Content-Type: application/json

{
  "path": "/path/to/file.txt"
}
```

#### Write File
```bash
POST /api/mcp/filesystem/write
Content-Type: application/json

{
  "path": "/path/to/file.txt",
  "content": "Hello, World!"
}
```

#### List Directory
```bash
POST /api/mcp/filesystem/list
Content-Type: application/json

{
  "path": "/path/to/directory"
}
```

#### Search Files
```bash
POST /api/mcp/filesystem/search
Content-Type: application/json

{
  "pattern": "**/*.ts",
  "basePath": "/project"
}
```

### GitHub MCP

#### Search Repositories
```bash
POST /api/mcp/github/search-repos
Content-Type: application/json

{
  "query": "react hooks",
  "limit": 10
}
```

#### Get File Contents
```bash
POST /api/mcp/github/get-file
Content-Type: application/json

{
  "owner": "facebook",
  "repo": "react",
  "path": "README.md",
  "ref": "main"
}
```

#### Search Code
```bash
POST /api/mcp/github/search-code
Content-Type: application/json

{
  "query": "useState language:typescript",
  "limit": 10
}
```

### Memory MCP

#### Store Memory
```bash
POST /api/mcp/memory/store
Content-Type: application/json

{
  "userId": 1,
  "content": "Important conversation about AI",
  "metadata": {
    "tags": ["ai", "conversation"],
    "category": "technical"
  },
  "importance": 8
}
```

#### Search Memories
```bash
POST /api/mcp/memory/search
Content-Type: application/json

{
  "userId": 1,
  "query": "AI conversation",
  "limit": 10
}
```

### Brave Search MCP

#### Web Search
```bash
POST /api/mcp/brave/search
Content-Type: application/json

{
  "query": "latest AI developments",
  "limit": 10
}
```

#### News Search
```bash
POST /api/mcp/brave/news
Content-Type: application/json

{
  "query": "artificial intelligence",
  "limit": 10
}
```

### Puppeteer MCP

#### Take Screenshot
```bash
POST /api/mcp/puppeteer/screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "fullPage": true,
    "type": "png"
  }
}
```

#### Extract Page Content
```bash
POST /api/mcp/puppeteer/extract
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Postgres MCP

#### Execute Query
```bash
POST /api/mcp/postgres/query
Content-Type: application/json

{
  "sql": "SELECT * FROM users LIMIT 10",
  "params": []
}
```

#### List Tables
```bash
GET /api/mcp/postgres/tables
```

#### Describe Table
```bash
POST /api/mcp/postgres/describe
Content-Type: application/json

{
  "tableName": "users",
  "schema": "public"
}
```

## 🔒 Security

### Path Sandboxing (Filesystem)
- All file operations are restricted to `MCP_FILESYSTEM_ALLOWED_PATHS`
- Defaults to project root directory
- Prevents directory traversal attacks

### API Key Management
- All API keys stored in `.env` (never committed)
- Services gracefully handle missing keys
- Clear error messages for configuration issues

### Database Security (Postgres)
- Uses Drizzle ORM for query safety
- Parameterized queries prevent SQL injection
- Transaction support for atomic operations

## 🧪 Testing

### Test Filesystem MCP
```bash
curl -X POST http://localhost:5000/api/mcp/filesystem/list \
  -H "Content-Type: application/json" \
  -d '{"path": "."}'
```

### Test GitHub MCP
```bash
curl -X POST http://localhost:5000/api/mcp/github/search-repos \
  -H "Content-Type: application/json" \
  -d '{"query": "react", "limit": 5}'
```

### Test Memory MCP
```bash
curl -X POST http://localhost:5000/api/mcp/memory/search \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "query": "test", "limit": 5}'
```

## 📊 Service Status Monitoring

Check which services are enabled:

```bash
# In your Node.js application
import { config } from './server/config.js';

console.log('MCP Services Status:');
console.log('- Filesystem:', config.mcp.filesystem.enabled);
console.log('- GitHub:', config.mcp.github.enabled);
console.log('- Memory:', config.mcp.memory.enabled);
console.log('- Brave Search:', config.mcp.braveSearch.enabled);
console.log('- Puppeteer:', config.mcp.puppeteer.enabled);
console.log('- Postgres:', config.mcp.postgres.enabled);
```

## 🎨 Integration Examples

### Example: AI-Powered Code Analysis

```typescript
import { getFilesystemMCPService, getGitHubMCPService } from './server/mcp';

// Search for TypeScript files
const fsService = getFilesystemMCPService();
const files = await fsService.searchFiles('**/*.ts');

// Analyze GitHub repository
const ghService = getGitHubMCPService();
const repos = await ghService.searchRepositories('typescript AI');
```

### Example: Context-Aware Memory

```typescript
import { getMemoryMCPService } from './server/mcp';

const memService = getMemoryMCPService();

// Store important conversation
await memService.storeMemory(userId, conversationText, {
  tags: ['coding', 'help'],
  emotion: 'excited',
}, 9);

// Retrieve context for AI
const context = await memService.getImportantMemories(userId, 7);
```

### Example: Real-Time Web Intelligence

```typescript
import { getBraveSearchMCPService } from './server/mcp';

const searchService = getBraveSearchMCPService();

// Get latest news
const news = await searchService.newsSearch('AI developments');

// Web search for context
const results = await searchService.webSearch(userQuery);
```

## 🔧 Troubleshooting

### Service Not Available
```
Error: Service not configured
```
**Solution**: Check `.env` file for required API keys and enable flags.

### Permission Denied (Filesystem)
```
Error: Access denied: path is outside allowed paths
```
**Solution**: Add path to `MCP_FILESYSTEM_ALLOWED_PATHS` in `.env`.

### GitHub API Rate Limiting
```
Error: API rate limit exceeded
```
**Solution**: Ensure `GITHUB_TOKEN` is set for authenticated requests (higher rate limits).

### Puppeteer Launch Failed
```
Error: Failed to launch browser
```
**Solution**: Install required dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Or let Puppeteer install bundled Chromium
npx puppeteer browsers install chrome
```

## 📈 Performance Tips

1. **Filesystem**: Use `searchFiles` with specific patterns to avoid large results
2. **GitHub**: Cache repository data to reduce API calls
3. **Memory**: Use importance-based retrieval for faster context gathering
4. **Brave Search**: Limit results to what you need
5. **Puppeteer**: Reuse browser instances when making multiple requests
6. **Postgres**: Use indexes and limit query results

## 🚀 Next Steps

1. **Enable services** you need in `.env`
2. **Get API keys** for external services (Brave, GitHub)
3. **Test endpoints** with curl or Postman
4. **Integrate with AI** for enhanced capabilities
5. **Monitor logs** for service health

## 📖 Additional Resources

- [MCP Quick Reference](./MCP_QUICK_REFERENCE.md) - Hugging Face MCP
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Brave Search API](https://brave.com/search/api/)
- [Puppeteer Documentation](https://pptr.dev/)

---

**Status**: ✅ All 6 MCP Services Implemented and Ready to Use!
