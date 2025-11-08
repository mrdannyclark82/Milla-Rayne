#!/usr/bin/env node
/**
 * Milla CLI - Command-line interface for Milla Rayne AI Companion
 *
 * A simple text-based interface to chat with Milla from the terminal.
 */

import readline from 'readline';
import axios from 'axios';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

class MillaCLI {
  private conversationHistory: Message[] = [];
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n\x1b[36mYou:\x1b[0m ',
    });
  }

  /**
   * Start the CLI interface
   */
  async start(): Promise<void> {
    console.clear();
    this.displayWelcome();

    // Check server connection
    const isConnected = await this.checkServerConnection();
    if (!isConnected) {
      console.log(
        '\n\x1b[33m⚠ Warning: Could not connect to Milla server at',
        API_BASE_URL
      );
      console.log('Make sure the server is running with: npm run dev\x1b[0m\n');
    }

    // Load recent conversation history
    await this.loadConversationHistory();

    // Start interactive mode
    this.rl.prompt();

    this.rl.on('line', async (input: string) => {
      const message = input.trim();

      if (!message) {
        this.rl.prompt();
        return;
      }

      // Handle special commands
      if (await this.handleCommand(message)) {
        this.rl.prompt();
        return;
      }

      // Send message to Milla
      await this.sendMessage(message);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(
        '\n\x1b[35mMilla:\x1b[0m Take care, love! Chat with you soon. 💜\n'
      );
      process.exit(0);
    });
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    console.log('\n\x1b[35m╔═══════════════════════════════════════════════╗');
    console.log('║                                               ║');
    console.log('║          💜 Milla Rayne CLI v1.0 💜          ║');
    console.log('║        Your AI Companion in Terminal         ║');
    console.log('║                                               ║');
    console.log('╚═══════════════════════════════════════════════╝\x1b[0m');
    console.log('\n\x1b[90mType your message and press Enter to chat.');
    console.log('Commands: /help, /history, /clear, /exit\x1b[0m');
  }

  /**
   * Check if server is accessible
   */
  private async checkServerConnection(): Promise<boolean> {
    try {
      await axios.get(`${API_BASE_URL}/api/messages`, { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load recent conversation history from server
   */
  private async loadConversationHistory(): Promise<void> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages?limit=5`);
      const messages = response.data as Message[];

      if (messages && messages.length > 0) {
        console.log('\n\x1b[90m--- Recent Conversation ---\x1b[0m');
        messages.slice(-5).forEach((msg: Message) => {
          const role = msg.role === 'user' ? '\x1b[36mYou' : '\x1b[35mMilla';
          console.log(`${role}:\x1b[0m ${msg.content}`);
        });

        this.conversationHistory = messages;
      }
    } catch (error) {
      // Silently fail - server might not be running yet
    }
  }

  /**
   * Send message to Milla and display response
   */
  private async sendMessage(message: string): Promise<void> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Show thinking indicator
      process.stdout.write(
        '\n\x1b[35mMilla:\x1b[0m \x1b[90m(thinking...)\x1b[0m'
      );

      // Send to server
      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        { message },
        { timeout: 60000 }
      );

      // Clear thinking indicator
      process.stdout.write('\r\x1b[K');

      const reply = response.data.response || response.data;

      // Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      });

      // Display response
      console.log('\x1b[35mMilla:\x1b[0m', reply);

      // Show scene context if available
      if (response.data.sceneContext) {
        const scene = response.data.sceneContext;
        console.log(
          `\x1b[90m[Scene: ${scene.location} • ${scene.mood} • ${scene.timeOfDay}]\x1b[0m`
        );
      }
    } catch (error) {
      process.stdout.write('\r\x1b[K');

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.log(
            '\n\x1b[31m✗ Error: Cannot connect to server. Is it running?\x1b[0m'
          );
          console.log('\x1b[90mStart the server with: npm run dev\x1b[0m');
        } else if (error.response?.status === 500) {
          console.log(
            '\n\x1b[31m✗ Server error occurred. Check server logs.\x1b[0m'
          );
        } else {
          console.log(`\n\x1b[31m✗ Error: ${error.message}\x1b[0m`);
        }
      } else {
        console.log('\n\x1b[31m✗ Unexpected error occurred.\x1b[0m');
      }
    }
  }

  /**
   * Handle special CLI commands
   */
  private async handleCommand(input: string): Promise<boolean> {
    const command = input.toLowerCase();

    if (command === '/help' || command === 'help') {
      this.showHelp();
      return true;
    }

    if (command === '/history' || command === 'history') {
      this.showHistory();
      return true;
    }

    if (command === '/clear' || command === 'clear') {
      console.clear();
      this.displayWelcome();
      return true;
    }

    if (command === '/exit' || command === 'exit' || command === 'quit') {
      this.rl.close();
      return true;
    }

    return false;
  }

  /**
   * Display help information
   */
  private showHelp(): void {
    console.log('\n\x1b[35m╔═══════════════════════════════════════════════╗');
    console.log('║              Milla CLI Commands               ║');
    console.log('╚═══════════════════════════════════════════════╝\x1b[0m');
    console.log('\n  \x1b[36m/help\x1b[0m      - Show this help message');
    console.log('  \x1b[36m/history\x1b[0m   - View conversation history');
    console.log('  \x1b[36m/clear\x1b[0m     - Clear the screen');
    console.log('  \x1b[36m/exit\x1b[0m      - Exit Milla CLI');
    console.log('\n  Or just type naturally to chat with Milla!\n');
  }

  /**
   * Display conversation history
   */
  private showHistory(): void {
    if (this.conversationHistory.length === 0) {
      console.log('\n\x1b[90mNo conversation history yet.\x1b[0m\n');
      return;
    }

    console.log('\n\x1b[90m--- Conversation History ---\x1b[0m\n');
    this.conversationHistory.forEach((msg) => {
      const role = msg.role === 'user' ? '\x1b[36mYou' : '\x1b[35mMilla';
      const timestamp = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString()
        : '';
      console.log(`${role}:\x1b[0m ${msg.content} \x1b[90m${timestamp}\x1b[0m`);
    });
    console.log();
  }
}

// Main entry point
const cli = new MillaCLI();
cli.start().catch((error) => {
  console.error('\n\x1b[31mFatal error:\x1b[0m', error.message);
  process.exit(1);
});
