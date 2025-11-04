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

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.loadMessages();
  }

  // This function loads messages from the file with improved integrity checking
  private loadMessages() {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');

        // Enhanced file content validation
        if (!fileContent || fileContent.trim().length === 0) {
          console.log(
            'Memories file is empty. Starting fresh with empty messages.'
          );
          return;
        }

        // Check if the file content looks like valid JSON
        const trimmedContent = fileContent.trim();
        if (
          !trimmedContent.startsWith('[') &&
          !trimmedContent.startsWith('{')
        ) {
          console.log(
            'Existing memories file is not in JSON format. Starting fresh with empty messages.'
          );
          this.backupFile(MEMORY_FILE_PATH, 'non-json format');
          return;
        }

        // Validate JSON structure more thoroughly
        let messages: any[];
        try {
          messages = JSON.parse(fileContent);
        } catch (parseError) {
          console.error(
            'JSON parsing failed:',
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          );
          this.backupFile(MEMORY_FILE_PATH, 'json parsing error');
          return;
        }

        // Validate that we have an array of valid message objects
        if (!Array.isArray(messages)) {
          console.log(
            'Memories file does not contain an array. Starting fresh.'
          );
          this.backupFile(MEMORY_FILE_PATH, 'not an array');
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
        this.backupFile(MEMORY_FILE_PATH, 'general error');
      }
    } else {
      console.log('No memories file found. Starting fresh.');
    }
  }

  // Helper method to backup problematic files
  private backupFile(filePath: string, reason: string) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup-${timestamp}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(
        `Backed up problematic file to ${backupPath} (reason: ${reason})`
      );
    } catch (backupError) {
      console.error('Failed to backup problematic file:', backupError);
    }
  }

  // This function saves all messages to the file with improved error handling
  private saveMessages() {
    try {
      const messagesArray = Array.from(this.messages.values());
      const jsonData = JSON.stringify(messagesArray, null, 2);

      // Create a temporary file first to avoid corruption during write
      const tempPath = MEMORY_FILE_PATH + '.tmp';
      fs.writeFileSync(tempPath, jsonData, 'utf8');

      // Verify the file was written correctly by parsing it
      const verification = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
      if (Array.isArray(verification)) {
        // Only replace the original file if the temp file is valid
        fs.renameSync(tempPath, MEMORY_FILE_PATH);
      } else {
        throw new Error('Invalid JSON structure in temporary file');
      }
    } catch (error) {
      console.error('Error saving messages to file:', error);
      // Clean up temporary file if it exists
      const tempPath = MEMORY_FILE_PATH + '.tmp';
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupError) {
          console.error('Failed to clean up temporary file:', cleanupError);
        }
      }
      // Don't throw the error to prevent breaking the application
      // The messages are still in memory and will be saved on next successful write
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      lastLoginAt: null,
    };
    this.users.set(id, user);
    this.saveMessages();
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      personalityMode: insertMessage.personalityMode || null,
      userId: insertMessage.userId || null,
    };
    this.messages.set(id, message);
    this.saveMessages();
    return message;
  }

  async getMessages(userId?: string): Promise<Message[]> {
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
    return this.messages.get(id);
  }
}
