# Milla-Rayne Quick Start Guide 🚀

## Current Status: ✅ RUNNING

Both servers are currently running and the application is accessible!

---

## Access Points

- **Web Interface**: http://localhost:5000
- **Proactive API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health

---

## Quick Commands

### Start/Stop Servers

```bash
# Start both servers (currently running)
npm run dev:all

# Start main server only
npm run dev

# Start proactive server only
npm run dev:proactive

# Stop servers
# Press Ctrl+C in the terminal where servers are running
# Or kill the process group
```

### Development

```bash
# Install dependencies
npm install

# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Database

```bash
# Push schema changes
npm run db:push

# Migrate memory data
npm run migrate:memory

# Encrypt existing data
npm run migrate:encrypt
```

### Production

```bash
# Build for production
npm run build

# Start production servers
npm run start:all
```

---

## Environment Configuration

All environment variables are already set in the sandbox. To modify:

1. Edit environment variables in the sandbox settings
2. Restart the servers for changes to take effect

Key variables:
- `PORT` - Main server port (default: 5000)
- `PROACTIVE_PORT` - Proactive server port (default: 5001)
- `OPENROUTER_API_KEY` - For AI responses (currently not set)
- `ENABLE_PREDICTIVE_UPDATES` - Daily suggestions (true/false)
- `ENABLE_PROACTIVE_MESSAGES` - Proactive messaging (true/false)

---

## Testing the Application

### Web Interface Test
1. Open http://localhost:5000 in your browser
2. Type a message in the chat input
3. Click send or press Enter
4. Milla should respond with a contextual message

### API Test
```bash
# Health check
curl http://localhost:5001/health

# Main server health
curl http://localhost:5000/health
```

---

## Troubleshooting

### Servers Not Starting
```bash
# Check if ports are in use
lsof -i :5000
lsof -i :5001

# Kill processes on ports
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5001)

# Restart servers
npm run dev:all
```

### Database Issues
```bash
# Delete and recreate database
rm -f memory/milla.db
npm run dev:all  # Will recreate on startup
```

### TypeScript Errors
```bash
# Check for errors
npm run check

# Most errors don't prevent runtime execution
# Fix them for production deployment
```

---

## Features Available

### ✅ Core Features
- Real-time chat with Milla
- Memory system (SQLite with encryption)
- Multi-personality modes
- Session tracking

### ✅ Agent System
- Coding Agent (automated fixes)
- Image Generation Agent
- Enhancement Search Agent
- Calendar Agent
- Tasks Agent
- Email Agent
- YouTube Agent

### ✅ Proactive Features
- Repository management
- Autonomous code improvements
- Feature discovery
- Sandbox environments
- Daily suggestions (if enabled)

### ✅ Advanced Features
- Voice interaction (if configured)
- YouTube analysis
- Visual recognition
- Smart home integration (if configured)
- Google services integration (if configured)

---

## Next Steps

1. **Add OpenRouter API Key** for full AI functionality:
   - Set `OPENROUTER_API_KEY` in environment
   - Restart servers

2. **Configure Optional Services**:
   - Google OAuth for calendar/email
   - ElevenLabs for voice
   - Firebase for additional features

3. **Fix TypeScript Errors** for production:
   ```bash
   npm run check
   # Fix reported errors
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

---

## Support

- **Documentation**: See README.md
- **Issues**: Check GitHub issues
- **Setup Complete**: See SETUP_COMPLETE.md for detailed setup info

---

**Last Updated**: December 16, 2025  
**Status**: Fully Operational ✅
