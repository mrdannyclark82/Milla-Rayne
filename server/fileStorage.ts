import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_FILE_PATH = path.resolve(__dirname, '..', 'memory', 'memories.txt');

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

  // This function loads messages from the file
  private loadMessages() {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');
        // Check if the file content is valid JSON
        if (fileContent.trim().startsWith('[') || fileContent.trim().startsWith('{')) {
          const messages: Message[] = JSON.parse(fileContent);
          messages.forEach(msg => {
            this.messages.set(msg.id, msg);
          });
          console.log(`Loaded ${this.messages.size} messages from file.`);
        } else {
          console.log("Existing memories file is not in JSON format. Starting fresh with empty messages.");
          // Backup the old file
          const backupPath = MEMORY_FILE_PATH + '.backup';
          fs.copyFileSync(MEMORY_FILE_PATH, backupPath);
          console.log(`Backed up existing memories to ${backupPath}`);
        }
      } catch (error) {
        console.error('Error loading messages from file:', error);
        console.log('Starting with empty messages.');
        // Backup the problematic file
        const backupPath = MEMORY_FILE_PATH + '.backup';
        try {
          fs.copyFileSync(MEMORY_FILE_PATH, backupPath);
          console.log(`Backed up problematic file to ${backupPath}`);
        } catch (backupError) {
          console.error('Failed to backup problematic file:', backupError);
        }
      }
    } else {
      console.log("No memories file found. Starting fresh.");
    }
  }

  // This function saves all messages to the file
  private saveMessages() {
    const messagesArray = Array.from(this.messages.values());
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(messagesArray, null, 2), 'utf8');
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
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
    const allMessages = Array.from(this.messages.values());
    if (userId) {
      return allMessages.filter(message => message.userId === userId || message.userId === null);
    }
    return allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMessageById(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }
}