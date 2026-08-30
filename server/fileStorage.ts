import {
  type User,
  type InsertUser,
  type Message,
  type InsertMessage,
} from '@shared/schema';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_FILE_PATH = path.resolve(
  __dirname,
  '..',
  'memory',
  'memories.txt'
);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId?: string): Promise<Message[]>;
  getMessageById(id: string): Promise<Message | undefined>;
}

export class FileStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;
  private initPromise: Promise<void>;
  private saveQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.initPromise = this.loadMessages();
  }

  // This function loads messages from the file with improved integrity checking
  private async loadMessages(): Promise<void> {
    try {
      // Use fs.promises.readFile instead of fs.readFileSync
      // We wrap in try/catch to handle ENOENT (file not found)
      let fileContent: string;
      try {
        fileContent = await fs.promises.readFile(MEMORY_FILE_PATH, 'utf8');
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.log('No memories file found. Starting fresh.');
          return;
        }
        throw err;
      }

      // Enhanced file content validation
      if (!fileContent || fileContent.trim().length === 0) {
        console.log(
          'Memories file is empty. Starting fresh with empty messages.'
        );
        return;
      }

      // Check if the file content looks like valid JSON
      const trimmedContent = fileContent.trim();
      if (!trimmedContent.startsWith('[') && !trimmedContent.startsWith('{')) {
        console.log(
          'Existing memories file is not in JSON format. Starting fresh with empty messages.'
        );
        await this.backupFile(MEMORY_FILE_PATH, 'non-json format');
        return;
      }

      // Validate JSON structure more thoroughly
      let messages: any[];
      try {
        messages = JSON.parse(fileContent);
      } catch (parseError) {
        console.error(
          'JSON parsing failed:',
          parseError instanceof Error ? parseError.message : String(parseError)
        );
        await this.backupFile(MEMORY_FILE_PATH, 'json parsing error');
        return;
      }

      // Validate that we have an array of valid message objects
      if (!Array.isArray(messages)) {
        console.log('Memories file does not contain an array. Starting fresh.');
        await this.backupFile(MEMORY_FILE_PATH, 'not an array');
        return;
      }

      // Load and validate each message
      let loadedCount = 0;
      messages.forEach((msg, index) => {
        try {
          if (msg && typeof msg === 'object' && msg.id && msg.content) {
            const processedMessage: Message = {
              ...msg,
              timestamp: new Date(msg.timestamp || new Date()),
            };
            this.messages.set(msg.id, processedMessage);
            loadedCount++;
          } else {
            console.warn(`Skipping invalid message at index ${index}:`, msg);
          }
        } catch (msgError) {
          console.warn(
            `Error processing message at index ${index}:`,
            msgError instanceof Error ? msgError.message : String(msgError)
          );
        }
      });

      console.log(
        `Successfully loaded ${loadedCount} valid messages from file (${messages.length} total entries).`
      );
    } catch (error) {
      console.error('Error loading messages from file:', error);
      console.log('Starting with empty messages.');
      await this.backupFile(MEMORY_FILE_PATH, 'general error');
    }
  }

  // Helper method to backup problematic files
  private async backupFile(filePath: string, reason: string) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup-${timestamp}`;
      await fs.promises.copyFile(filePath, backupPath);
      console.log(
        `Backed up problematic file to ${backupPath} (reason: ${reason})`
      );
    } catch (backupError) {
      console.error('Failed to backup problematic file:', backupError);
    }
  }

  // This function saves all messages to the file with improved error handling
  // Uses a queue to ensure sequential writes
  private async saveMessages(): Promise<void> {
    const operation = async () => {
      // Create a temporary file first to avoid corruption during write
      // Use a unique name to avoid collision between concurrent saves
      const tempPath = MEMORY_FILE_PATH + '.' + randomUUID() + '.tmp';

      try {
        const messagesArray = Array.from(this.messages.values());
        const jsonData = JSON.stringify(messagesArray, null, 2);

        await fs.promises.writeFile(tempPath, jsonData, 'utf8');

        // Verify the file was written correctly by parsing it
        const verificationContent = await fs.promises.readFile(
          tempPath,
          'utf8'
        );
        const verification = JSON.parse(verificationContent);
        if (Array.isArray(verification)) {
          // Only replace the original file if the temp file is valid
          // Rename is atomic on POSIX systems
          await fs.promises.rename(tempPath, MEMORY_FILE_PATH);
        } else {
          throw new Error('Invalid JSON structure in temporary file');
        }
      } catch (error) {
        console.error('Error saving messages to file:', error);
        // Clean up temporary file if it exists
        try {
          await fs.promises.unlink(tempPath);
        } catch (cleanupError: any) {
          // Ignore ENOENT (file not found) if it was already gone/not created
          if (cleanupError.code !== 'ENOENT') {
            console.error('Failed to clean up temporary file:', cleanupError);
          }
        }
        // Don't throw the error to prevent breaking the application flow
      }
    };

    // Queue the operation
    // We append to the queue and catch any errors from the operation so the queue doesn't break
    const nextPromise = this.saveQueue.then(operation);
    this.saveQueue = nextPromise;
    return nextPromise;
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.initPromise;
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.initPromise;
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.initPromise;
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      lastLoginAt: null,
      preferredAiModel: insertUser.preferredAiModel || null,
    };
    this.users.set(id, user);
    await this.saveMessages();
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    await this.initPromise;
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      personalityMode: insertMessage.personalityMode || null,
      displayRole: insertMessage.displayRole || null,
      userId: insertMessage.userId || null,
    };
    this.messages.set(id, message);
    await this.saveMessages();
    return message;
  }

  async getMessages(userId?: string): Promise<Message[]> {
    await this.initPromise;
    try {
      const allMessages = Array.from(this.messages.values());
      if (userId) {
        return allMessages.filter(
          (message) => message.userId === userId || message.userId === null
        );
      }
      // Ensure timestamps are Date objects before sorting
      return allMessages.sort((a, b) => {
        const timestampA =
          a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timestampB =
          b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timestampA.getTime() - timestampB.getTime();
      });
    } catch (error) {
      console.error('Error in getMessages:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getMessageById(id: string): Promise<Message | undefined> {
    await this.initPromise;
    return this.messages.get(id);
  }
}
