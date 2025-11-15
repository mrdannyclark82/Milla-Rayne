/**
 * SQLite Storage Implementation
 * Enhanced memory system with session tracking, usage patterns, and timestamps
 */

import Database from 'better-sqlite3';
import type {
  User,
  InsertUser,
  Message,
  InsertMessage,
  AiUpdate,
  InsertAiUpdate,
  DailySuggestion,
  InsertDailySuggestion,
  UserSession,
  MemorySummary,
  InsertMemorySummary,
  YoutubeKnowledge,
  InsertYoutubeKnowledge,
} from '../shared/schema';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { encrypt, decrypt, isEncryptionEnabled, getMemoryKey } from './crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'memory', 'milla.db');

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  updateUserAIModel(userId: string, model: string): Promise<void>;

  // User Session methods
  createUserSession(session: any): Promise<any>;
  getUserSessionByToken(token: string): Promise<any | null>;
  deleteUserSession(sessionId: string): Promise<void>;

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
  createDailySuggestion(
    suggestion: InsertDailySuggestion
  ): Promise<DailySuggestion>;
  getDailySuggestionByDate(date: string): Promise<DailySuggestion | null>;
  markDailySuggestionDelivered(date: string): Promise<boolean>;

  // Voice Consent methods
  getVoiceConsent(
    userId: string,
    consentType: string
  ): Promise<VoiceConsent | null>;
  grantVoiceConsent(
    userId: string,
    consentType: string,
    consentText: string,
    metadata?: any
  ): Promise<VoiceConsent>;
  revokeVoiceConsent(userId: string, consentType: string): Promise<boolean>;
  hasVoiceConsent(userId: string, consentType: string): Promise<boolean>;

  // OAuth Token methods
  createOAuthToken(token: any): Promise<any>;
  getOAuthToken(userId: string, provider: string): Promise<any | null>;
  updateOAuthToken(id: string, token: any): Promise<void>;
  deleteOAuthToken(id: string): Promise<void>;

  // Memory Summaries methods
  createMemorySummary(summary: InsertMemorySummary): Promise<MemorySummary>;
  getMemorySummaries(userId: string, limit?: number): Promise<MemorySummary[]>;
  searchMemorySummaries(
    userId: string,
    query: string,
    limit?: number
  ): Promise<MemorySummary[]>;

  // YouTube Knowledge Base methods
  saveYoutubeKnowledge(
    knowledge: InsertYoutubeKnowledge
  ): Promise<YoutubeKnowledge>;
  getYoutubeKnowledgeByVideoId(
    videoId: string,
    userId: string
  ): Promise<YoutubeKnowledge | null>;
  searchYoutubeKnowledge(filters: any): Promise<YoutubeKnowledge[]>;
  incrementYoutubeWatchCount(videoId: string, userId: string): Promise<void>;
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
    console.debug('sqlite: creating users table');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        preferred_ai_model TEXT DEFAULT 'minimax',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )
    `);

    // Create user_sessions table
    console.debug('sqlite: creating user_sessions table');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create enhanced messages table with session tracking
    console.debug('sqlite: creating messages table');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        personality_mode TEXT CHECK(personality_mode IN ('coach', 'empathetic', 'strategic', 'creative', 'roleplay')),
        display_role TEXT,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        session_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // If the messages table exists from an older schema, ensure the display_role
    // column is present. SQLite doesn't support DROP COLUMN easily, but ADD COLUMN
    // is supported and harmless if the column already exists.
    try {
      const msgCols = this.db.prepare("PRAGMA table_info('messages')").all() as { name: string }[];
      const hasDisplayRole = msgCols.some((c) => c.name === 'display_role');
      if (!hasDisplayRole) {
        console.log('sqlite: migrating messages table to add display_role column');
        this.db.exec(`ALTER TABLE messages ADD COLUMN display_role TEXT`);
      }
    } catch (err) {
      console.warn('sqlite: warning while ensuring messages.display_role column', err);
    }

    // Create sessions table for tracking conversation sessions
    console.debug('sqlite: creating sessions table');
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
    console.debug('sqlite: creating usage_patterns table');
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

    // Create AI updates table for predictive updates feature
    // AI updates table is defined later with the full schema (description, category, priority, etc.)

    // Create indexes for better query performance (moved to after ai_updates full schema)

    // Create ai_updates table for predictive updates (RSS feed data)
    // Check if table exists with old schema and migrate if needed
    console.debug('sqlite: creating ai_updates table');

    // Check if ai_updates table exists and has the correct schema
    const tableInfo = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ai_updates'"
      )
      .get() as { name: string } | undefined;

    if (tableInfo) {
      // Table exists, check if it has the 'source' column (new schema)
      const columns = this.db
        .prepare("PRAGMA table_info('ai_updates')")
        .all() as { name: string }[];
      const hasSourceColumn = columns.some((col) => col.name === 'source');

      if (!hasSourceColumn) {
        // Old schema detected, migrate to new RSS feed structure
        console.log(
          'sqlite: migrating ai_updates table to new schema (RSS feed structure)'
        );

        // Drop old indexes first to prevent "no such column" errors
        // The old schema had indexes on 'priority', 'applied_at', 'category' columns
        // which don't exist in the new RSS feed schema
        this.db.exec(`
          DROP INDEX IF EXISTS idx_ai_updates_priority;
          DROP INDEX IF EXISTS idx_ai_updates_applied;
          DROP INDEX IF EXISTS idx_ai_updates_category;
        `);

        // Now drop and recreate the table with new schema
        this.db.exec('DROP TABLE IF EXISTS ai_updates');
      }
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_updates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL,
        published TEXT,
        summary TEXT,
        tags TEXT,
        relevance REAL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create suggestion_updates table for daily AI improvement suggestions
    console.debug('sqlite: creating suggestion_updates table');
    // Ensure migration compatibility: older schema may have used 'relevance' or 'relevance_score'
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS suggestion_updates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT,
        source TEXT,
        description TEXT,
        category TEXT,
        priority INTEGER DEFAULT 5,
        relevance_score REAL DEFAULT 0,
        metadata TEXT,
        published DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        applied_at DATETIME
      )
    `);

    // If an older column 'relevance' exists, migrate values into 'relevance_score' and drop the old column
    try {
      const cols = this.db
        .prepare("PRAGMA table_info('suggestion_updates')")
        .all() as { name: string }[];
      const hasRelevance = cols.some((c) => c.name === 'relevance');
      const hasRelevanceScore = cols.some((c) => c.name === 'relevance_score');

      if (hasRelevance && !hasRelevanceScore) {
        console.log(
          'sqlite: migrating suggestion_updates.relevance -> relevance_score'
        );
        // Add the new column
        this.db.exec(
          `ALTER TABLE suggestion_updates ADD COLUMN relevance_score REAL DEFAULT 0`
        );
        // Copy data
        this.db.exec(
          `UPDATE suggestion_updates SET relevance_score = relevance`
        );
        // Note: SQLite doesn't support DROP COLUMN prior to 3.35.0 in many environments, so we leave 'relevance' present.
      }
    } catch (err) {
      console.warn('sqlite: warning during suggestion_updates migration', err);
    }

    // Create daily_suggestions table
    console.debug('sqlite: creating daily_suggestions table');
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

    // Create voice_consent table
    console.debug('sqlite: creating voice_consent table');
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

    // Create oauth_tokens table
    console.debug('sqlite: creating oauth_tokens table');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default-user',
        provider TEXT NOT NULL CHECK(provider IN ('google')),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at DATETIME NOT NULL,
        scope TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, provider)
      )
    `);

    // Create memory_summaries table
    console.debug('sqlite: creating memory_summaries table');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_summaries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary_text TEXT NOT NULL,
        topics TEXT, -- Stored as JSON string
        emotional_tone TEXT CHECK(emotional_tone IN ('positive', 'negative', 'neutral')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create youtube_knowledge_base table
    console.debug('sqlite: creating youtube_knowledge_base table');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS youtube_knowledge_base (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        channel_name TEXT,
        duration INTEGER,
        video_type TEXT NOT NULL CHECK(video_type IN ('tutorial', 'news', 'discussion', 'entertainment', 'other')),
        summary TEXT NOT NULL,
        key_points TEXT, -- Stored as JSON string
        code_snippets TEXT, -- Stored as JSON string
        cli_commands TEXT, -- Stored as JSON string
        actionable_items TEXT, -- Stored as JSON string
        tags TEXT, -- Stored as JSON string array
        transcript_available INTEGER NOT NULL DEFAULT 0,
        analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        watch_count INTEGER NOT NULL DEFAULT 0,
        user_id TEXT DEFAULT 'default-user'
      )
    `);

    // Create indexes for ai_updates and daily_suggestions
    console.debug('sqlite: creating indexes');
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_updates_source ON ai_updates(source, published DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_updates_relevance ON ai_updates(relevance DESC);
      CREATE INDEX IF NOT EXISTS idx_suggestion_updates_priority ON suggestion_updates(priority DESC, relevance_score DESC);
      CREATE INDEX IF NOT EXISTS idx_suggestion_updates_applied ON suggestion_updates(applied_at);
      CREATE INDEX IF NOT EXISTS idx_daily_suggestions_date ON daily_suggestions(date);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_youtube_knowledge_video_id ON youtube_knowledge_base(video_id);
      CREATE INDEX IF NOT EXISTS idx_youtube_knowledge_user_id ON youtube_knowledge_base(user_id);
      CREATE INDEX IF NOT EXISTS idx_youtube_knowledge_type ON youtube_knowledge_base(video_type);
      CREATE INDEX IF NOT EXISTS idx_youtube_knowledge_analyzed_at ON youtube_knowledge_base(analyzed_at DESC);
    `);

    const encryptionStatus = isEncryptionEnabled() ? 'enabled' : 'disabled';
    console.log(
      `SQLite database initialized at: ${DB_PATH} (encryption: ${encryptionStatus})`
    );

    // Ensure default user exists for consent storage
    this.ensureDefaultUser();
  }

  private ensureDefaultUser(): void {
    try {
      const stmt = this.db.prepare('SELECT id FROM users WHERE id = ?');
      const existing = stmt.get('default-user');

      if (!existing) {
        // Insert a default user with a non-null email to satisfy the schema
        const insertStmt = this.db.prepare(`
          INSERT INTO users (id, username, email, password, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        // Use a clearly local/internal email to avoid collisions with real accounts
        insertStmt.run(
          'default-user',
          'default',
          'default@localhost',
          'default'
        );
        console.log('Default user created for consent storage');
      }
    } catch (error) {
      console.error('Error ensuring default user:', error);
    }
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
      INSERT INTO users (id, username, email, password, preferred_ai_model)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      user.username,
      user.email,
      user.password,
      user.preferredAiModel || 'minimax'
    );

    const newUser = {
      id,
      username: user.username,
      email: user.email,
      password: user.password, // This will be omitted from the return value
      preferredAiModel: user.preferredAiModel || 'minimax',
      createdAt: new Date(),
      lastLoginAt: null,
    };

     
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(userId);
  }

  async updateUserAIModel(userId: string, model: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users SET preferred_ai_model = ? WHERE id = ?
    `);
    stmt.run(model, userId);
  }

  // User Session methods
  async createUserSession(session: any): Promise<any> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, session_token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(
      id,
      session.userId,
      session.sessionToken,
      session.expiresAt.toISOString()
    );
    return { id, ...session };
  }

  async getUserSessionByToken(token: string): Promise<UserSession | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM user_sessions WHERE session_token = ?'
    );
    const session = stmt.get(token) as UserSession | undefined;
    return session || null;
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE id = ?');
    stmt.run(sessionId);
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const timestamp = new Date();

    // Encrypt message content before storing (when encryption enabled)
    const encryptedContent = isEncryptionEnabled()
      ? encrypt(message.content, getMemoryKey())
      : message.content;

    const stmt = this.db.prepare(`
      INSERT INTO messages (id, content, role, personality_mode, display_role, timestamp, user_id, session_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT id FROM sessions WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1))
    `);

    stmt.run(
      id,
      encryptedContent,
      message.role,
      message.personalityMode || null,
      message.displayRole || null,
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
      displayRole: message.displayRole || null,
      personalityMode: message.personalityMode || null,
      timestamp,
      userId: message.userId || null,
    };
  }

  async getMessages(userId?: string): Promise<Message[]> {
    let stmt;
    let messages;
    if (userId) {
      stmt = this.db.prepare(
        'SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp ASC'
      );
      messages = stmt.all(userId) as any[];
    } else {
      stmt = this.db.prepare('SELECT * FROM messages ORDER BY timestamp ASC');
      messages = stmt.all() as any[];
    }

    return messages.map((msg) => ({
      ...msg,
      content: isEncryptionEnabled()
        ? decrypt(msg.content, getMemoryKey())
        : msg.content, // Decrypt content on read
      timestamp: new Date(msg.timestamp),
      personalityMode: msg.personality_mode,
      displayRole: msg.display_role || null,
      userId: msg.user_id,
    }));
  }

  async getMessageById(id: string): Promise<Message | undefined> {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    const msg = stmt.get(id) as any;

    if (!msg) return undefined;

    return {
      ...msg,
      content: isEncryptionEnabled()
        ? decrypt(msg.content, getMemoryKey())
        : msg.content, // Decrypt content on read
      timestamp: new Date(msg.timestamp),
      personalityMode: msg.personality_mode,
      displayRole: msg.display_role || null,
      userId: msg.user_id,
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
    const dayOfWeek = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
    });
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
      messageCount: 0,
    };
  }

  async endSession(
    sessionId: string,
    lastMessages: string[] = []
  ): Promise<void> {
    const endTime = new Date();

    // Get session start time to calculate duration
    const sessionStmt = this.db.prepare(
      'SELECT start_time FROM sessions WHERE id = ?'
    );
    const session = sessionStmt.get(sessionId) as any;

    if (!session) return;

    const startTime = new Date(session.start_time);
    const durationMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    const lastTwoMessages = lastMessages.slice(-2).join(' ||| ');

    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET end_time = ?,
          session_duration_minutes = ?,
          last_two_messages = ?
      WHERE id = ?
    `);
    stmt.run(
      endTime.toISOString(),
      durationMinutes,
      lastTwoMessages,
      sessionId
    );
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
        const diff =
          (new Date(sessions[i].start_time).getTime() -
            new Date(sessions[i - 1].start_time).getTime()) /
          (1000 * 60);
        timeDiffs.push(diff);
      }
      avgTimeBetween = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    }

    return {
      totalSessions: stats.total_sessions || 0,
      averageSessionLength: stats.avg_session_length || 0,
      averageTimeBetweenSessions: avgTimeBetween,
      totalMessages: stats.total_messages || 0,
      averageMessagesPerSession:
        stats.total_sessions > 0
          ? stats.total_messages / stats.total_sessions
          : 0,
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
    return patterns.map((p) => ({
      dayOfWeek: p.day_of_week,
      hourOfDay: p.hour_of_day,
      sessionCount: p.session_count,
      messageCount: p.message_count,
    }));
  }

  // AI Updates methods (for suggestion_updates table)
  async createAiUpdate(update: InsertAiUpdate): Promise<AiUpdate> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO suggestion_updates (id, title, description, category, priority, relevance, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const metadataStr = update.metadata
      ? JSON.stringify(update.metadata)
      : null;
    stmt.run(
      id,
      update.title,
      update.description,
      update.category,
      update.priority,
      update.relevanceScore,
      metadataStr
    );

    const created = await this.getAiUpdateById(id);
    if (!created) {
      throw new Error('Failed to create AI update');
    }
    return created;
  }

  async getTopAiUpdates(limit: number): Promise<AiUpdate[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM suggestion_updates
      WHERE applied_at IS NULL
      ORDER BY priority DESC, relevance DESC, created_at DESC
      LIMIT ?
    `);

    const updates = stmt.all(limit) as any[];
    return updates.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      category: u.category,
      priority: u.priority,
      relevanceScore: u.relevance,
      metadata: u.metadata ? JSON.parse(u.metadata) : null,
      createdAt: new Date(u.created_at),
      appliedAt: u.applied_at ? new Date(u.applied_at) : null,
    }));
  }

  async getAiUpdateById(id: string): Promise<AiUpdate | undefined> {
    const stmt = this.db.prepare(
      'SELECT * FROM suggestion_updates WHERE id = ?'
    );
    const update = stmt.get(id) as any;

    if (!update) return undefined;

    return {
      id: update.id,
      title: update.title,
      description: update.description,
      category: update.category,
      priority: update.priority,
      relevanceScore: update.relevance,
      metadata: update.metadata ? JSON.parse(update.metadata) : null,
      createdAt: new Date(update.created_at),
      appliedAt: update.applied_at ? new Date(update.applied_at) : null,
    };
  }

  async markAiUpdateApplied(id: string): Promise<void> {
    const stmt = this.db.prepare(
      'UPDATE suggestion_updates SET applied_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(id);
  }

  // Daily Suggestions methods
  async createDailySuggestion(
    suggestion: InsertDailySuggestion
  ): Promise<DailySuggestion> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO daily_suggestions (id, date, suggestion_text, metadata, created_at, is_delivered)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `);

    const metadataStr = suggestion.metadata
      ? JSON.stringify(suggestion.metadata)
      : null;
    stmt.run(id, suggestion.date, suggestion.suggestionText, metadataStr);

    const created = await this.getDailySuggestionByDate(suggestion.date);
    if (!created) {
      throw new Error('Failed to create daily suggestion');
    }
    return created;
  }

  async getDailySuggestionByDate(
    date: string
  ): Promise<DailySuggestion | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM daily_suggestions WHERE date = ?'
    );
    const suggestion = stmt.get(date) as any;

    if (!suggestion) return null;

    return {
      id: suggestion.id,
      date: suggestion.date,
      suggestionText: suggestion.suggestion_text,
      metadata: suggestion.metadata ? JSON.parse(suggestion.metadata) : null,
      createdAt: new Date(suggestion.created_at),
      deliveredAt: suggestion.delivered_at
        ? new Date(suggestion.delivered_at)
        : null,
      isDelivered: suggestion.is_delivered === 1,
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
  async getVoiceConsent(
    userId: string,
    consentType: string
  ): Promise<VoiceConsent | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM voice_consent WHERE user_id = ? AND consent_type = ?'
    );
    const consent = stmt.get(userId, consentType) as any;

    if (!consent) return null;

    return {
      id: consent.id,
      userId: consent.user_id,
      consentType: consent.consent_type as
        | 'voice_cloning'
        | 'voice_persona'
        | 'voice_synthesis',
      granted: consent.granted === 1,
      grantedAt: consent.granted_at ? new Date(consent.granted_at) : undefined,
      revokedAt: consent.revoked_at ? new Date(consent.revoked_at) : undefined,
      consentText: consent.consent_text,
      metadata: consent.metadata ? JSON.parse(consent.metadata) : null,
      createdAt: new Date(consent.created_at),
    };
  }

  async grantVoiceConsent(
    userId: string,
    consentType: string,
    consentText: string,
    metadata?: any
  ): Promise<VoiceConsent> {
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
      throw new Error('Failed to grant voice consent');
    }
    return updated;
  }

  async revokeVoiceConsent(
    userId: string,
    consentType: string
  ): Promise<boolean> {
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

  // OAuth Token methods
  async createOAuthToken(token: any): Promise<any> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO oauth_tokens (id, user_id, provider, access_token, refresh_token, expires_at, scope, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      id,
      token.userId || 'default-user',
      token.provider,
      token.accessToken,
      token.refreshToken || null,
      token.expiresAt.toISOString(),
      token.scope || null
    );

    return this.getOAuthToken(token.userId || 'default-user', token.provider);
  }

  async getOAuthToken(userId: string, provider: string): Promise<any | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM oauth_tokens WHERE user_id = ? AND provider = ?'
    );
    const token = stmt.get(userId, provider) as any;

    if (!token) return null;

    return {
      id: token.id,
      userId: token.user_id,
      provider: token.provider,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(token.expires_at),
      scope: token.scope,
      createdAt: new Date(token.created_at),
      updatedAt: new Date(token.updated_at),
    };
  }

  async updateOAuthToken(id: string, token: any): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE oauth_tokens 
      SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      token.accessToken,
      token.refreshToken || null,
      token.expiresAt.toISOString(),
      token.scope || null,
      id
    );
  }

  async deleteOAuthToken(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM oauth_tokens WHERE id = ?');
    stmt.run(id);
  }

  // Memory Summaries methods
  async createMemorySummary(
    summary: InsertMemorySummary
  ): Promise<MemorySummary> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO memory_summaries (id, user_id, title, summary_text, topics, emotional_tone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      summary.userId,
      summary.title,
      summary.summaryText,
      summary.topics ? JSON.stringify(summary.topics) : null,
      summary.emotionalTone || null
    );

    const created = await this.getMemorySummaryById(id);
    if (!created) {
      throw new Error('Failed to create memory summary');
    }
    return created;
  }

  async getMemorySummaries(
    userId: string,
    limit: number = 10
  ): Promise<MemorySummary[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM memory_summaries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    const summaries = stmt.all(userId, limit) as any[];

    return summaries.map((s) => ({
      id: s.id,
      userId: s.user_id,
      title: s.title,
      summaryText: s.summary_text,
      topics: s.topics ? JSON.parse(s.topics) : [],
      emotionalTone: s.emotional_tone,
      createdAt: new Date(s.created_at),
      updatedAt: new Date(s.updated_at),
    }));
  }

  async searchMemorySummaries(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<MemorySummary[]> {
    const searchTerms = query
      .toLowerCase()
      .split(' ')
      .map((term) => `%${term}%`);
    const placeholders = searchTerms
      .map(() => 'summary_text LIKE ? OR title LIKE ? OR topics LIKE ?')
      .join(' OR ');
    const params: string[] = [];
    searchTerms.forEach((term) => params.push(term, term, term));

    const stmt = this.db.prepare(`
      SELECT * FROM memory_summaries 
      WHERE user_id = ? AND (${placeholders})
      ORDER BY created_at DESC LIMIT ?
    `);
    const summaries = stmt.all(userId, ...params, limit) as any[];

    return summaries.map((s) => ({
      id: s.id,
      userId: s.user_id,
      title: s.title,
      summaryText: s.summary_text,
      topics: s.topics ? JSON.parse(s.topics) : [],
      emotionalTone: s.emotional_tone,
      financialSummary: null,
      medicalNotes: null,
      createdAt: new Date(s.created_at),
      updatedAt: new Date(s.updated_at),
    }));
  }

  private async getMemorySummaryById(
    id: string
  ): Promise<MemorySummary | undefined> {
    const stmt = this.db.prepare('SELECT * FROM memory_summaries WHERE id = ?');
    const summary = stmt.get(id) as any;
    if (!summary) return undefined;
    return {
      id: summary.id,
      userId: summary.user_id,
      title: summary.title,
      summaryText: summary.summary_text,
      topics: summary.topics ? JSON.parse(summary.topics) : [],
      emotionalTone: summary.emotional_tone,
      financialSummary: null,
      medicalNotes: null,
      createdAt: new Date(summary.created_at),
      updatedAt: new Date(summary.updated_at),
    };
  }

  // ===========================================================================================
  // YOUTUBE KNOWLEDGE BASE METHODS
  // ===========================================================================================

  async saveYoutubeKnowledge(
    knowledge: InsertYoutubeKnowledge
  ): Promise<YoutubeKnowledge> {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO youtube_knowledge_base (
        id, video_id, title, channel_name, duration, video_type, summary,
        key_points, code_snippets, cli_commands, actionable_items, tags,
        transcript_available, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(video_id) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        key_points = excluded.key_points,
        code_snippets = excluded.code_snippets,
        cli_commands = excluded.cli_commands,
        actionable_items = excluded.actionable_items,
        tags = excluded.tags,
        analyzed_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      id,
      knowledge.videoId,
      knowledge.title,
      knowledge.channelName || null,
      knowledge.duration || null,
      knowledge.videoType,
      knowledge.summary,
      knowledge.keyPoints ? JSON.stringify(knowledge.keyPoints) : null,
      knowledge.codeSnippets ? JSON.stringify(knowledge.codeSnippets) : null,
      knowledge.cliCommands ? JSON.stringify(knowledge.cliCommands) : null,
      knowledge.actionableItems
        ? JSON.stringify(knowledge.actionableItems)
        : null,
      knowledge.tags ? JSON.stringify(knowledge.tags) : null,
      knowledge.transcriptAvailable ? 1 : 0,
      knowledge.userId || 'default-user'
    );

    const saved = await this.getYoutubeKnowledgeByVideoId(
      knowledge.videoId,
      knowledge.userId || 'default-user'
    );
    if (!saved) {
      throw new Error('Failed to save YouTube knowledge');
    }
    return saved;
  }

  async getYoutubeKnowledgeByVideoId(
    videoId: string,
    userId: string
  ): Promise<YoutubeKnowledge | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM youtube_knowledge_base WHERE video_id = ? AND user_id = ?'
    );
    const video = stmt.get(videoId, userId) as any;

    if (!video) return null;

    return this.parseYoutubeKnowledge(video);
  }

  async searchYoutubeKnowledge(filters: any): Promise<YoutubeKnowledge[]> {
    let query = 'SELECT * FROM youtube_knowledge_base WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.videoType) {
      query += ' AND video_type = ?';
      params.push(filters.videoType);
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ' AND (';
      const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
      query += tagConditions + ')';
      filters.tags.forEach((tag: string) => params.push(`%"${tag}"%`));
    }

    if (filters.hasCode) {
      query += ' AND code_snippets IS NOT NULL AND code_snippets != "[]"';
    }

    if (filters.hasCommands) {
      query += ' AND cli_commands IS NOT NULL AND cli_commands != "[]"';
    }

    if (filters.query) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${filters.query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY analyzed_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    const videos = stmt.all(...params) as any[];

    return videos.map((v) => this.parseYoutubeKnowledge(v));
  }

  async incrementYoutubeWatchCount(
    videoId: string,
    userId: string
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE youtube_knowledge_base 
      SET watch_count = watch_count + 1 
      WHERE video_id = ? AND user_id = ?
    `);
    stmt.run(videoId, userId);
  }

  private parseYoutubeKnowledge(row: any): YoutubeKnowledge {
    return {
      id: row.id,
      videoId: row.video_id,
      title: row.title,
      channelName: row.channel_name,
      duration: row.duration,
      videoType: row.video_type,
      summary: row.summary,
      keyPoints: row.key_points ? JSON.parse(row.key_points) : [],
      codeSnippets: row.code_snippets ? JSON.parse(row.code_snippets) : [],
      cliCommands: row.cli_commands ? JSON.parse(row.cli_commands) : [],
      actionableItems: row.actionable_items
        ? JSON.parse(row.actionable_items)
        : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      transcriptAvailable: row.transcript_available === 1,
      analyzedAt: new Date(row.analyzed_at),
      watchCount: row.watch_count,
      userId: row.user_id,
    };
  }

  // Helper method to close database connection
  close(): void {
    this.db.close();
  }

  // ========================================================================
  // P3.4: CRDT (Conflict-free Replicated Data Type) Placeholder
  // ========================================================================
  
  /**
   * P3.4: Merge operation for CRDT-based distributed synchronization
   * 
   * This is where CRDT logic would be implemented for decentralized
   * data synchronization across multiple devices without conflicts.
   * 
   * CRDT Types to Consider:
   * - LWW (Last-Write-Wins) Register: For simple fields with timestamps
   * - OR-Set (Observed-Remove Set): For add/remove collections
   * - G-Counter: For increment-only counters
   * - PN-Counter: For increment/decrement counters
   * - RGA (Replicated Growable Array): For ordered lists
   * 
   * Implementation Steps (TODO):
   * 1. Add vector clock or Lamport timestamp to each record
   * 2. Track operation history with causality
   * 3. Implement merge function for each data type
   * 4. Handle concurrent updates deterministically
   * 5. Propagate changes to other replicas
   * 
   * Example Schema Changes Needed:
   * ```sql
   * ALTER TABLE messages ADD COLUMN vector_clock TEXT;
   * ALTER TABLE messages ADD COLUMN site_id TEXT;
   * ALTER TABLE messages ADD COLUMN operation_type TEXT;
   * CREATE TABLE crdt_operations (
   *   id TEXT PRIMARY KEY,
   *   table_name TEXT,
   *   record_id TEXT,
   *   operation TEXT,
   *   vector_clock TEXT,
   *   site_id TEXT,
   *   timestamp INTEGER
   * );
   * ```
   * 
   * @param localData - Data from this device
   * @param remoteData - Data from remote device
   * @returns Merged data with conflicts resolved
   */
  mergeCRDT(localData: any, remoteData: any): any {
    console.log('📡 [CRDT] Merge operation called (STUB)');
    console.log('📡 [CRDT] Local entries:', Object.keys(localData).length);
    console.log('📡 [CRDT] Remote entries:', Object.keys(remoteData).length);
    
    // STUB: In production, implement actual CRDT merge logic
    // For now, return a simple last-write-wins merge
    
    const merged = { ...localData };
    
    for (const [key, remoteValue] of Object.entries(remoteData)) {
      const localValue = localData[key];
      
      // TODO: Replace with proper CRDT merge based on type
      // - For LWW: Compare timestamps, keep newer
      // - For OR-Set: Union of additions, apply removals
      // - For Counters: Sum increments, handle decrements
      // - For RGA: Merge ordered lists preserving causality
      
      if (!localValue) {
        // New entry from remote
        merged[key] = remoteValue;
        console.log(`📡 [CRDT] Added new entry: ${key}`);
      } else if (this.shouldKeepRemoteValue(localValue, remoteValue)) {
        // Remote is newer/preferred
        merged[key] = remoteValue;
        console.log(`📡 [CRDT] Updated entry: ${key}`);
      } else {
        // Keep local value
        console.log(`📡 [CRDT] Kept local entry: ${key}`);
      }
    }
    
    console.log('📡 [CRDT] Merge complete:', Object.keys(merged).length, 'entries');
    return merged;
  }
  
  /**
   * P3.4: Helper to determine if remote value should be kept (STUB)
   * In production, would use vector clocks or Lamport timestamps
   */
  private shouldKeepRemoteValue(localValue: any, remoteValue: any): boolean {
    // STUB: Simple timestamp comparison
    // TODO: Implement proper causality checking with vector clocks
    
    const localTimestamp = localValue.timestamp || localValue.updated_at || 0;
    const remoteTimestamp = remoteValue.timestamp || remoteValue.updated_at || 0;
    
    // LWW (Last-Write-Wins) strategy
    if (remoteTimestamp > localTimestamp) {
      return true;
    }
    
    // If timestamps equal, use deterministic tie-breaking
    // (e.g., higher site_id wins)
    if (remoteTimestamp === localTimestamp) {
      const localSiteId = localValue.site_id || '';
      const remoteSiteId = remoteValue.site_id || '';
      return remoteSiteId > localSiteId;
    }
    
    return false;
  }
  
  /**
   * P3.4: Sync state with remote replica (STUB)
   * Would be called periodically or on connection to sync devices
   */
  async syncWithReplica(replicaUrl: string): Promise<{ success: boolean; synced: number }> {
    console.log(`📡 [CRDT] Syncing with replica: ${replicaUrl} (STUB)`);
    
    // TODO: Implement actual sync protocol
    // 1. Get local vector clock
    // 2. Send to remote replica
    // 3. Receive missing operations from remote
    // 4. Apply CRDT merge for each operation
    // 5. Send local operations that remote is missing
    // 6. Update vector clock
    
    // STUB: Return mock success
    return {
      success: true,
      synced: 0, // Number of operations synced
    };
  }
}

