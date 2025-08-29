import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId?: string): Promise<Message[]>;
  getMessageById(id: string): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    
    // Initialize with default welcome message
    const welcomeMessage: Message = {
      id: randomUUID(),
      content: "Hello! I'm Milla, your advanced AI assistant. I'm designed with an adaptive personality matrix that allows me to adjust my communication style based on your needs - whether you need a strategic coach, an empathetic listener, or a creative partner. My core principles prioritize your privacy, well-being, and growth. I communicate with a blend of honest insights and strategic empathy. How can I assist you today?",
      role: "assistant",
      personalityMode: "empathetic",
      timestamp: new Date(),
      userId: null,
    };
    this.messages.set(welcomeMessage.id, welcomeMessage);
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
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
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

export const storage = new MemStorage();
