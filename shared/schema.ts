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
  password: text('password').notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
  personalityMode: true,
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
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAiUpdate = z.infer<typeof insertAiUpdateSchema>;
export type AiUpdate = typeof aiUpdates.$inferSelect;
export type InsertDailySuggestion = z.infer<typeof insertDailySuggestionSchema>;
export type DailySuggestion = typeof dailySuggestions.$inferSelect;
export type InsertOAuthToken = z.infer<typeof insertOAuthTokenSchema>;
export type OAuthToken = typeof oauthTokens.$inferSelect;
