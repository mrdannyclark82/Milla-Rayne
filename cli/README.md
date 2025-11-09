# Milla CLI

A command-line interface for Milla Rayne, your AI companion in the terminal.

## Features

- 💬 **Interactive Chat**: Chat with Milla directly from your terminal
- 📜 **Conversation History**: View and load recent conversations
- 🎨 **Colorful Interface**: Beautiful ANSI color-coded messages
- 🌐 **Server Integration**: Connects to the Milla server API
- ⚡ **Quick Commands**: Built-in commands for common actions

## Installation

The CLI is included with the Milla Rayne project. No additional installation required.

## Usage

### Start the Server

First, make sure the Milla server is running:

```bash
npm run dev
```

### Launch the CLI

In a separate terminal, run:

```bash
npm run cli
```

Or directly with:

```bash
npx tsx cli/milla-cli.ts
```

## Commands

While chatting with Milla, you can use these commands:

- `/help` - Show help information
- `/history` - View conversation history
- `/clear` - Clear the screen
- `/exit` or `quit` - Exit the CLI

## Examples

```
You: Hello Milla!
Milla: Hey love! How are you doing today?

You: /history
--- Conversation History ---
You: Hello Milla! 10:30:45 AM
Milla: Hey love! How are you doing today? 10:30:47 AM

You: Tell me a joke
Milla: Why don't scientists trust atoms? Because they make up everything! 😄

You: /exit
Milla: Take care, love! Chat with you soon. 💜
```

## Configuration

The CLI reads configuration from the `.env` file in the project root:

```env
API_URL=http://localhost:5000  # Optional, defaults to localhost:5000
```

## Requirements

- Node.js 18+
- Running Milla server instance
- Terminal with ANSI color support

## Troubleshooting

### Cannot Connect to Server

If you see:

```
⚠ Warning: Could not connect to Milla server at http://localhost:5000
```

Make sure the server is running:

```bash
npm run dev
```

### Colors Not Displaying

Most modern terminals support ANSI colors. If colors aren't showing:

- Use a terminal that supports ANSI escape codes (iTerm2, Windows Terminal, etc.)
- Check your terminal color settings

## Development

The CLI is built with TypeScript and uses:

- `readline` for interactive input
- `axios` for API communication
- ANSI escape codes for colors

To modify the CLI, edit `cli/milla-cli.ts` and run:

```bash
npx tsx cli/milla-cli.ts
```

## Features Coming Soon

- 🎙️ Voice input support
- 📝 Save conversations to file
- 🔔 Desktop notifications
- 🌓 Theme customization

## License

MIT - Part of the Milla Rayne project
