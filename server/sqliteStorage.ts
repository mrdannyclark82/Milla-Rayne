/**
 * SQLite Storage Implementation
 * Enhanced memory system with session tracking, usage patterns, and timestamps
 */

import Database from 'better-sqlite3';
import { type User, type InsertUser, type Message, type InsertMessage, type AiUpdate, type InsertAiUpdate, type DailySuggestion, type InsertDailySuggestion } from "@shared/schema";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { encrypt, decrypt, isEncryptionEnabled } from "./crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'memory', 'milla.db');

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId?: string): Promise<Message[]>;
  getMessageById(id: string): Promise<Message | undefined>;
  
  // Enhanced session tracking methods
  createSession(userId: string): Promise<SessionInfo>;
  endSession(sessionId: string, lastMessages: string[]): Promise<void>;
  getSessionStats(userId?: string): Promise<SessionStats>;
  getUsagePatterns(userId?: string): Promise<UsagePattern[]>;

  // AI Updates methods
  createAiUpdate(update: InsertAiUpdate): Promise<AiUpdate>;
  getTopAiUpdates(limit: number): Promise<AiUpdate[]>;
  getAiUpdateById(id: string): Promise<AiUpdate | undefined>;
  markAiUpdateApplied(id: string): Promise<void>;

  // Daily Suggestions methods
  createDailySuggestion(suggestion: InsertDailySuggestion): Promise<DailySuggestion>;
  getDailySuggestionByDate(date: string): Promise<DailySuggestion | null>;
  markDailySuggestionDelivered(date: string): Promise<boolean>;

  // Voice Consent methods
  getVoiceConsent(userId: string, consentType: string): Promise<VoiceConsent | null>;
  grantVoiceConsent(userId: string, consentType: string, consentText: string, metadata?: any): Promise<VoiceConsent>;
  revokeVoiceConsent(userId: string, consentType: string): Promise<boolean>;
  hasVoiceConsent(userId: string, consentType: string): Promise<boolean>;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  lastTwoMessages?: string[];
}

export interface SessionStats {
  totalSessions: number;
  averageSessionLength: number; // in minutes
  averageTimeBetweenSessions: number; // in minutes
  totalMessages: number;
  averageMessagesPerSession: number;
}

export interface UsagePattern {
  dayOfWeek: string;
  hourOfDay: number;
  sessionCount: number;
  messageCount: number;
}

export interface VoiceConsent {
  id: string;
  userId: string;
  consentType: 'voice_cloning' | 'voice_persona' | 'voice_synthesis';
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  consentText: string;
  metadata?: any;
  createdAt: Date;
}

export class SqliteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    // Ensure memory directory exists
    const memoryDir = path.dirname(DB_PATH);
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');

    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create enhanced messages table with session tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        personality_mode TEXT CHECK(personality_mode IN ('coach', 'empathetic', 'strategic', 'creative', 'roleplay')),
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        session_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Create sessions table for tracking conversation sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        message_count INTEGER DEFAULT 0,
        last_two_messages TEXT,
        session_duration_minutes REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create usage patterns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        day_of_week TEXT NOT NULL,
        hour_of_day INTEGER NOT NULL,
        session_count INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, day_of_week, hour_of_day)
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
    `);

    // Create ai_updates table for predictive updates
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_updates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('feature', 'enhancement', 'optimization', 'bugfix', 'documentation')),
        priority INTEGER NOT NULL DEFAULT 5,
        relevance_score INTEGER DEFAULT 0,
        metadata TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        applied_at DATETIME
      )
    `);

    // Create daily_suggestions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_suggestions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        suggestion_text TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        delivered_at DATETIME,
        is_delivered INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Create indexes for ai_updates and daily_suggestions
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_updates_priority ON ai_updates(priority DESC, relevance_score DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_updates_applied ON ai_updates(applied_at);
      CREATE INDEX IF NOT EXISTS idx_daily_suggestions_date ON daily_suggestions(date);
    `);

    // Create voice_consent table for tracking user consent for voice cloning/personas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS voice_consent (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        consent_type TEXT NOT NULL CHECK(consent_type IN ('voice_cloning', 'voice_persona', 'voice_synthesis')),
        granted INTEGER NOT NULL DEFAULT 0,
        granted_at DATETIME,
        revoked_at DATETIME,
        consent_text TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, consent_type)
      )
    `);

    // Create index for voice_consent
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_voice_consent_user ON voice_consent(user_id);
      CREATE INDEX IF NOT EXISTS idx_voice_consent_type ON voice_consent(consent_type);
    `);

    const encryptionStatus = isEncryptionEnabled() ? 'enabled' : 'disabled';
    console.log(`SQLite database initialized at: ${DB_PATH} (encryption: ${encryptionStatus})`);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as any;
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as any;
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, password) 
      VALUES (?, ?, ?)
    `);
    stmt.run(id, user.username, user.password);
    
    return {
      id,
      username: user.username,
      password: user.password
    };
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const timestamp = new Date();
    
    // Encrypt message content before storing
    const encryptedContent = encrypt(message.content);
    
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, content, role, personality_mode, timestamp, user_id, session_id) 
      VALUES (?, ?, ?, ?, ?, ?, (SELECT id FROM sessions WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1))
    `);
    
    stmt.run(
      id,
      encryptedContent,
      message.role,
      message.personalityMode || null,
      timestamp.toISOString(),
      message.userId || null,
      message.userId || null
    );

    // Update session message count
    if (message.userId) {
      const updateStmt = this.db.prepare(`
        UPDATE sessions 
        SET message_count = message_count + 1
        WHERE user_id = ? AND end_time IS NULL
      `);
      updateStmt.run(message.userId);
    }

    return {
      id,
      content: message.content, // Return original plaintext
      role: message.role,
      personalityMode: message.personalityMode || null,
      timestamp,
      userId: message.userId || null
    };
  }

  async getMessages(userId?: string): Promise<Message[]> {
    let stmt;
    let messages;
    if (userId) {
      stmt = this.db.prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp ASC');
      messages = stmt.all(userId) as any[];
    } else {
      stmt = this.db.prepare('SELECT * FROM messages ORDER BY timestamp ASC');
      messages = stmt.all() as any[];
    }
    
    return messages.map(msg => ({
      ...msg,
      content: decrypt(msg.content), // Decrypt content on read
      timestamp: new Date(msg.timestamp),
      personalityMode: msg.personality_mode,
      userId: msg.user_id
    }));
  }

  async getMessageById(id: string): Promise<Message | undefined> {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    const msg = stmt.get(id) as any;
    
    if (!msg) return undefined;
    
    return {
      ...msg,
      content: decrypt(msg.content), // Decrypt content on read
      timestamp: new Date(msg.timestamp),
      personalityMode: msg.personality_mode,
      userId: msg.user_id
    };
  }

  // Session tracking methods
  async createSession(userId: string): Promise<SessionInfo> {
    const sessionId = randomUUID();
    const startTime = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, start_time) 
      VALUES (?, ?, ?)
    `);
    stmt.run(sessionId, userId, startTime.toISOString());

    // Update usage patterns
    const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' });
    const hourOfDay = startTime.getHours();

    const patternStmt = this.db.prepare(`
      INSERT INTO usage_patterns (user_id, day_of_week, hour_of_day, session_count, message_count)
      VALUES (?, ?, ?, 1, 0)
      ON CONFLICT(user_id, day_of_week, hour_of_day) 
      DO UPDATE SET 
        session_count = session_count + 1,
        last_updated = CURRENT_TIMESTAMP
    `);
    patternStmt.run(userId, dayOfWeek, hourOfDay);

    return {
      sessionId,
      userId,
      startTime,
      messageCount: 0
    };
  }

  async endSession(sessionId: string, lastMessages: string[] = []): Promise<void> {
    const endTime = new Date();
    
    // Get session start time to calculate duration
    const sessionStmt = this.db.prepare('SELECT start_time FROM sessions WHERE id = ?');
    const session = sessionStmt.get(sessionId) as any;
    
    if (!session) return;
    
    const startTime = new Date(session.start_time);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    const lastTwoMessages = lastMessages.slice(-2).join(' ||| ');
    
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET end_time = ?,
          session_duration_minutes = ?,
          last_two_messages = ?
      WHERE id = ?
    `);
    stmt.run(endTime.toISOString(), durationMinutes, lastTwoMessages, sessionId);
  }

  async getSessionStats(userId?: string): Promise<SessionStats> {
    let stmt;
    if (userId) {
      stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_sessions,
          AVG(session_duration_minutes) as avg_session_length,
          SUM(message_count) as total_messages
        FROM sessions 
        WHERE user_id = ? AND end_time IS NOT NULL
      `);
    } else {
      stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_sessions,
          AVG(session_duration_minutes) as avg_session_length,
          SUM(message_count) as total_messages
        FROM sessions 
        WHERE end_time IS NOT NULL
      `);
    }
    
    const stats = stmt.get(userId) as any;
    
    // Calculate average time between sessions
    let avgTimeBetween = 0;
    const timeStmt = userId
      ? this.db.prepare(`
          SELECT start_time 
          FROM sessions 
          WHERE user_id = ? AND end_time IS NOT NULL 
          ORDER BY start_time ASC
        `)
      : this.db.prepare(`
          SELECT start_time 
          FROM sessions 
          WHERE end_time IS NOT NULL 
          ORDER BY start_time ASC
        `);
    
    const sessions = timeStmt.all(userId) as any[];
    if (sessions.length > 1) {
      const timeDiffs: number[] = [];
      for (let i = 1; i < sessions.length; i++) {
        const diff = (new Date(sessions[i].start_time).getTime() - new Date(sessions[i - 1].start_time).getTime()) / (1000 * 60);
        timeDiffs.push(diff);
      }
      avgTimeBetween = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    }

    return {
      totalSessions: stats.total_sessions || 0,
      averageSessionLength: stats.avg_session_length || 0,
      averageTimeBetweenSessions: avgTimeBetween,
      totalMessages: stats.total_messages || 0,
      averageMessagesPerSession: stats.total_sessions > 0 ? stats.total_messages / stats.total_sessions : 0
    };
  }

  async getUsagePatterns(userId?: string): Promise<UsagePattern[]> {
    let stmt;
    if (userId) {
      stmt = this.db.prepare(`
        SELECT day_of_week, hour_of_day, session_count, message_count
        FROM usage_patterns
        WHERE user_id = ?
        ORDER BY session_count DESC
      `);
    } else {
      stmt = this.db.prepare(`
        SELECT day_of_week, hour_of_day, SUM(session_count) as session_count, SUM(message_count) as message_count
        FROM usage_patterns
        GROUP BY day_of_week, hour_of_day
        ORDER BY session_count DESC
      `);
    }
    
    const patterns = stmt.all(userId) as any[];
    return patterns.map(p => ({
      dayOfWeek: p.day_of_week,
      hourOfDay: p.hour_of_day,
      sessionCount: p.session_count,
      messageCount: p.message_count
    }));
  }

  // AI Updates methods
  async createAiUpdate(update: InsertAiUpdate): Promise<AiUpdate> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO ai_updates (id, title, description, category, priority, relevance_score, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const metadataStr = update.metadata ? JSON.stringify(update.metadata) : null;
    stmt.run(id, update.title, update.description, update.category, update.priority, update.relevanceScore, metadataStr);
    
    const created = await this.getAiUpdateById(id);
    if (!created) {
      throw new Error("Failed to create AI update");
    }
    return created;
  }

  async getTopAiUpdates(limit: number): Promise<AiUpdate[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_updates
      WHERE applied_at IS NULL
      ORDER BY priority DESC, relevance_score DESC, created_at DESC
      LIMIT ?
    `);
    
    const updates = stmt.all(limit) as any[];
    return updates.map(u => ({
      id: u.id,
      title: u.title,
      description: u.description,
      category: u.category,
      priority: u.priority,
      relevanceScore: u.relevance_score,
      metadata: u.metadata ? JSON.parse(u.metadata) : null,
      createdAt: new Date(u.created_at),
      appliedAt: u.applied_at ? new Date(u.applied_at) : null
    }));
  }

  async getAiUpdateById(id: string): Promise<AiUpdate | undefined> {
    const stmt = this.db.prepare('SELECT * FROM ai_updates WHERE id = ?');
    const update = stmt.get(id) as any;
    
    if (!update) return undefined;
    
    return {
      id: update.id,
      title: update.title,
      description: update.description,
      category: update.category,
      priority: update.priority,
      relevanceScore: update.relevance_score,
      metadata: update.metadata ? JSON.parse(update.metadata) : null,
      createdAt: new Date(update.created_at),
      appliedAt: update.applied_at ? new Date(update.applied_at) : null
    };
  }

  async markAiUpdateApplied(id: string): Promise<void> {
    const stmt = this.db.prepare('UPDATE ai_updates SET applied_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  }

  // Daily Suggestions methods
  async createDailySuggestion(suggestion: InsertDailySuggestion): Promise<DailySuggestion> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO daily_suggestions (id, date, suggestion_text, metadata, created_at, is_delivered)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `);
    
    const metadataStr = suggestion.metadata ? JSON.stringify(suggestion.metadata) : null;
    stmt.run(id, suggestion.date, suggestion.suggestionText, metadataStr);
    
    const created = await this.getDailySuggestionByDate(suggestion.date);
    if (!created) {
      throw new Error("Failed to create daily suggestion");
    }
    return created;
  }

  async getDailySuggestionByDate(date: string): Promise<DailySuggestion | null> {
    const stmt = this.db.prepare('SELECT * FROM daily_suggestions WHERE date = ?');
    const suggestion = stmt.get(date) as any;
    
    if (!suggestion) return null;
    
    return {
      id: suggestion.id,
      date: suggestion.date,
      suggestionText: suggestion.suggestion_text,
      metadata: suggestion.metadata ? JSON.parse(suggestion.metadata) : null,
      createdAt: new Date(suggestion.created_at),
      deliveredAt: suggestion.delivered_at ? new Date(suggestion.delivered_at) : null,
      isDelivered: suggestion.is_delivered === 1
    };
  }

  async markDailySuggestionDelivered(date: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE daily_suggestions 
      SET delivered_at = CURRENT_TIMESTAMP, is_delivered = 1 
      WHERE date = ?
    `);
    const result = stmt.run(date);
    return result.changes > 0;
  }

  // Voice Consent methods
  async getVoiceConsent(userId: string, consentType: string): Promise<VoiceConsent | null> {
    const stmt = this.db.prepare('SELECT * FROM voice_consent WHERE user_id = ? AND consent_type = ?');
    const consent = stmt.get(userId, consentType) as any;
    
    if (!consent) return null;
    
    return {
      id: consent.id,
      userId: consent.user_id,
      consentType: consent.consent_type as 'voice_cloning' | 'voice_persona' | 'voice_synthesis',
      granted: consent.granted === 1,
      grantedAt: consent.granted_at ? new Date(consent.granted_at) : undefined,
      revokedAt: consent.revoked_at ? new Date(consent.revoked_at) : undefined,
      consentText: consent.consent_text,
      metadata: consent.metadata ? JSON.parse(consent.metadata) : null,
      createdAt: new Date(consent.created_at)
    };
  }

  async grantVoiceConsent(userId: string, consentType: string, consentText: string, metadata?: any): Promise<VoiceConsent> {
    const id = randomUUID();
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    
    // Check if consent record already exists
    const existing = await this.getVoiceConsent(userId, consentType);
    
    if (existing) {
      // Update existing record
      const stmt = this.db.prepare(`
        UPDATE voice_consent 
        SET granted = 1, granted_at = CURRENT_TIMESTAMP, revoked_at = NULL, consent_text = ?, metadata = ?
        WHERE user_id = ? AND consent_type = ?
      `);
      stmt.run(consentText, metadataStr, userId, consentType);
    } else {
      // Insert new record
      const stmt = this.db.prepare(`
        INSERT INTO voice_consent (id, user_id, consent_type, granted, granted_at, consent_text, metadata, created_at)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
      `);
      stmt.run(id, userId, consentType, consentText, metadataStr);
    }
    
    const updated = await this.getVoiceConsent(userId, consentType);
    if (!updated) {
      throw new Error("Failed to grant voice consent");
    }
    return updated;
  }

  async revokeVoiceConsent(userId: string, consentType: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE voice_consent 
      SET granted = 0, revoked_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND consent_type = ?
    `);
    const result = stmt.run(userId, consentType);
    return result.changes > 0;
  }

  async hasVoiceConsent(userId: string, consentType: string): Promise<boolean> {
    const consent = await this.getVoiceConsent(userId, consentType);
    return consent !== null && consent.granted && !consent.revokedAt;
  }

  // Helper method to close database connection
  close(): void {
    this.db.close();
  }
}
