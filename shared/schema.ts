import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  preferredAiModel: varchar('preferred_ai_model', {
    enum: ['minimax', 'venice', 'deepseek', 'xai', 'gemini', 'grok'],
  }).default('minimax'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const userSessions = pgTable('user_sessions', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  content: text('content').notNull(),
  role: varchar('role', { enum: ['user', 'assistant'] }).notNull(),
  personalityMode: varchar('personality_mode', {
    enum: ['coach', 'empathetic', 'strategic', 'creative', 'roleplay'],
  }),
  displayRole: text('display_role'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userId: varchar('user_id'),
});

export const aiUpdates = pgTable('ai_updates', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: varchar('category', {
    enum: ['feature', 'enhancement', 'optimization', 'bugfix', 'documentation'],
  }).notNull(),
  priority: integer('priority').notNull().default(5), // 1-10 scale
  relevanceScore: integer('relevance_score').default(0),
  metadata: jsonb('metadata'), // For storing additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
  appliedAt: timestamp('applied_at'),
});

export const dailySuggestions = pgTable('daily_suggestions', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  date: varchar('date').notNull().unique(), // Format: YYYY-MM-DD
  suggestionText: text('suggestion_text').notNull(),
  metadata: jsonb('metadata'), // Store related ai_updates ids, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at'),
  isDelivered: boolean('is_delivered').notNull().default(false),
});

export const oauthTokens = pgTable('oauth_tokens', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().default('default-user'),
  provider: varchar('provider', { enum: ['google'] }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at').notNull(),
  scope: text('scope'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const memorySummaries = pgTable('memory_summaries', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summaryText: text('summary_text').notNull(),
  topics: jsonb('topics'), // Array of strings
  emotionalTone: varchar('emotional_tone', {
    enum: ['positive', 'negative', 'neutral'],
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertMemorySummarySchema = createInsertSchema(memorySummaries).pick({
  userId: true,
  title: true,
  summaryText: true,
  topics: true,
  emotionalTone: true,
});

export type InsertMemorySummary = z.infer<typeof insertMemorySummarySchema>;
export type MemorySummary = typeof memorySummaries.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  preferredAiModel: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions);

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
  personalityMode: true,
  displayRole: true,
  userId: true,
});

export const insertAiUpdateSchema = createInsertSchema(aiUpdates).pick({
  title: true,
  description: true,
  category: true,
  priority: true,
  relevanceScore: true,
  metadata: true,
});

export const insertDailySuggestionSchema = createInsertSchema(
  dailySuggestions
).pick({
  date: true,
  suggestionText: true,
  metadata: true,
});

export const insertOAuthTokenSchema = createInsertSchema(oauthTokens).pick({
  userId: true,
  provider: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
  scope: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAiUpdate = z.infer<typeof insertAiUpdateSchema>;
export type AiUpdate = typeof aiUpdates.$inferSelect;
export type InsertDailySuggestion = z.infer<typeof insertDailySuggestionSchema>;
export type DailySuggestion = typeof dailySuggestions.$inferSelect;
export type InsertOAuthToken = z.infer<typeof insertOAuthTokenSchema>;
export type OAuthToken = typeof oauthTokens.$inferSelect;

// ===========================================================================================
// YOUTUBE KNOWLEDGE BASE SCHEMA
// ===========================================================================================

export const youtubeKnowledgeBase = pgTable('youtube_knowledge_base', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  videoId: varchar('video_id', { length: 20 }).notNull().unique(),
  title: text('title').notNull(),
  channelName: text('channel_name'),
  duration: integer('duration'), // in seconds
  videoType: varchar('video_type', {
    enum: ['tutorial', 'news', 'discussion', 'entertainment', 'other'],
  }).notNull(),
  summary: text('summary').notNull(),
  keyPoints: jsonb('key_points'), // KeyPoint[]
  codeSnippets: jsonb('code_snippets'), // CodeSnippet[]
  cliCommands: jsonb('cli_commands'), // CLICommand[]
  actionableItems: jsonb('actionable_items'), // ActionableItem[]
  tags: jsonb('tags'), // string[] - auto-generated from content
  transcriptAvailable: boolean('transcript_available').notNull().default(false),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
  watchCount: integer('watch_count').notNull().default(0),
  userId: varchar('user_id').default('default-user'),
});

export const insertYoutubeKnowledgeSchema = createInsertSchema(youtubeKnowledgeBase).pick({
  videoId: true,
  title: true,
  channelName: true,
  duration: true,
  videoType: true,
  summary: true,
  keyPoints: true,
  codeSnippets: true,
  cliCommands: true,
  actionableItems: true,
  tags: true,
  transcriptAvailable: true,
  userId: true,
});

export type InsertYoutubeKnowledge = z.infer<typeof insertYoutubeKnowledgeSchema>;
export type YoutubeKnowledge = typeof youtubeKnowledgeBase.$inferSelect;
