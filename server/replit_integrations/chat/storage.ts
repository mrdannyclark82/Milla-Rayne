export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<ChatMessage[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<ChatMessage>;
}

class MemoryChatStorage implements IChatStorage {
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, ChatMessage[]> = new Map();
  private nextConversationId = 1;
  private nextMessageId = 1;

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createConversation(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.nextConversationId++,
      title,
      createdAt: new Date(),
    };
    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.conversations.delete(id);
    this.messages.delete(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<ChatMessage[]> {
    return this.messages.get(conversationId) || [];
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: this.nextMessageId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    const msgs = this.messages.get(conversationId) || [];
    msgs.push(message);
    this.messages.set(conversationId, msgs);
    return message;
  }
}

export const chatStorage: IChatStorage = new MemoryChatStorage();

