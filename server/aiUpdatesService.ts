/**
 * AI Updates Service
 * Fetches and parses AI news/updates from curated RSS sources
 */

import Parser from 'rss-parser';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', 'memory', 'milla.db');

export interface AIUpdate {
  id: string;
  title: string;
  url: string;
  source: string;
  published: Date | null;
  summary: string | null;
  tags: string | null;
  relevance: number;
  createdAt: Date;
}

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
}

// Default RSS sources
const DEFAULT_SOURCES = [
  'https://openai.com/blog/rss.xml',
  'https://x.ai/blog/rss',
  'https://perplexity.ai/blog/rss',
  'https://huggingface.co/blog/feed.xml',
  'https://github.blog/changelog/feed/',
];

// Optional HackerNews RSS for LLM/AI topics
const OPTIONAL_SOURCES = [
  'https://hnrss.org/newest?q=LLM+OR+AI+OR+OpenAI+OR+Anthropic',
];

// Keywords for relevance scoring (based on project stack/features)
const RELEVANCE_KEYWORDS = [
  'openrouter',
  'xai',
  'qwen',
  'deepseek',
  'sqlite',
  'voice',
  'tts',
  'stt',
  'github actions',
  'security',
  'api',
  'typescript',
  'react',
  'express',
  'websocket',
  'llm',
  'gpt',
  'claude',
  'mistral',
  'grok',
];

const MAX_ITEMS_PER_SOURCE = 200;

/**
 * Get configured RSS sources from environment or use defaults
 */
function getConfiguredSources(): string[] {
  const envSources = process.env.AI_UPDATES_SOURCES;
  if (envSources) {
    return envSources
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return DEFAULT_SOURCES;
}

/**
 * Compute relevance score for an update based on keywords
 */
function computeRelevance(title: string, summary: string): number {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;

  for (const keyword of RELEVANCE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      score += 1;
    }
  }

  // Normalize to 0-1 range
  return Math.min(score / RELEVANCE_KEYWORDS.length, 1.0);
}

/**
 * Extract tags from title and summary
 */
function extractTags(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  const foundTags = RELEVANCE_KEYWORDS.filter((keyword) =>
    text.includes(keyword.toLowerCase())
  );
  return foundTags.join(', ');
}

/**
 * Fetch and parse RSS feed with timeout and retries
 */
async function fetchRSSFeed(url: string, retries = 3): Promise<RSSItem[]> {
  const parser = new Parser({
    timeout: 10000, // 10 second timeout
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching RSS from ${url} (attempt ${attempt}/${retries})`);
      const feed = await parser.parseURL(url);
      return feed.items as RSSItem[];
    } catch (error) {
      console.error(
        `Error fetching RSS from ${url} (attempt ${attempt}):`,
        error
      );
      if (attempt === retries) {
        return [];
      }
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return [];
}

/**
 * Get database instance
 */
function getDB(): Database.Database {
  return new Database(DB_PATH);
}

/**
 * Store update in database (dedupe by URL)
 */
function storeUpdate(
  db: Database.Database,
  update: Omit<AIUpdate, 'id' | 'createdAt'>
): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO ai_updates (id, title, url, source, published, summary, tags, relevance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      randomUUID(),
      update.title,
      update.url,
      update.source,
      update.published ? update.published.toISOString() : null,
      update.summary,
      update.tags,
      update.relevance
    );

    return result.changes > 0;
  } catch (error) {
    console.error('Error storing update:', error);
    return false;
  }
}

/**
 * Cleanup old updates per source (keep last N items)
 */
function cleanupOldUpdates(
  db: Database.Database,
  source: string,
  keepLast: number = MAX_ITEMS_PER_SOURCE
): void {
  try {
    const stmt = db.prepare(`
      DELETE FROM ai_updates 
      WHERE id IN (
        SELECT id FROM ai_updates 
        WHERE source = ? 
        ORDER BY published DESC, created_at DESC 
        LIMIT -1 OFFSET ?
      )
    `);
    stmt.run(source, keepLast);
  } catch (error) {
    console.error('Error cleaning up old updates:', error);
  }
}

/**
 * Fetch updates from all configured sources
 */
export async function fetchAIUpdates(): Promise<{
  success: boolean;
  itemsAdded: number;
  errors: string[];
}> {
  const sources = getConfiguredSources();
  const db = getDB();
  let itemsAdded = 0;
  const errors: string[] = [];

  console.log(`Fetching AI updates from ${sources.length} sources...`);

  for (const sourceUrl of sources) {
    try {
      const items = await fetchRSSFeed(sourceUrl);

      for (const item of items) {
        if (!item.title || !item.link) {
          continue;
        }

        const summary = item.contentSnippet || item.content || '';
        const published = item.isoDate || item.pubDate;

        const update = {
          title: item.title,
          url: item.link,
          source: sourceUrl,
          published: published ? new Date(published) : null,
          summary: summary.substring(0, 1000), // Limit summary length
          tags: extractTags(item.title, summary),
          relevance: computeRelevance(item.title, summary),
        };

        if (storeUpdate(db, update)) {
          itemsAdded++;
        }
      }

      // Cleanup old updates for this source
      cleanupOldUpdates(db, sourceUrl);
    } catch (error) {
      const errorMsg = `Failed to fetch from ${sourceUrl}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  db.close();

  console.log(`Fetch complete: ${itemsAdded} new items added`);
  return {
    success: errors.length < sources.length,
    itemsAdded,
    errors,
  };
}

/**
 * Get stored AI updates with optional filters
 */
export function getAIUpdates(options: {
  source?: string;
  minRelevance?: number;
  limit?: number;
  offset?: number;
}): AIUpdate[] {
  const db = getDB();

  try {
    // Inspect table columns so we can support alternate schemas (legacy vs current)
    const cols = db.prepare("PRAGMA table_info('ai_updates')").all() as {
      name: string;
    }[];
    const colSet = new Set(cols.map((c) => c.name));

    // Build SELECT list with aliases to the expected field names used elsewhere in the code
    const selectParts: string[] = [];
    selectParts.push('id');
    selectParts.push('title');

    if (colSet.has('url')) {
      selectParts.push('url');
    } else {
      selectParts.push("'' AS url");
    }

    if (colSet.has('source')) {
      selectParts.push('source');
    } else {
      selectParts.push("'' AS source");
    }

    if (colSet.has('published')) {
      selectParts.push('published');
    } else {
      selectParts.push('NULL AS published');
    }

    if (colSet.has('summary')) {
      selectParts.push('summary');
    } else if (colSet.has('description')) {
      selectParts.push('description AS summary');
    } else {
      selectParts.push("'' AS summary");
    }

    if (colSet.has('tags')) {
      selectParts.push('tags');
    } else if (colSet.has('metadata')) {
      selectParts.push('metadata AS tags');
    } else {
      selectParts.push("'' AS tags");
    }

    if (colSet.has('relevance')) {
      selectParts.push('relevance');
    } else if (colSet.has('relevance_score')) {
      selectParts.push('relevance_score AS relevance');
    } else {
      selectParts.push('0 AS relevance');
    }

    if (colSet.has('created_at')) {
      selectParts.push('created_at');
    } else if (colSet.has('createdAt')) {
      selectParts.push('createdAt AS created_at');
    } else {
      selectParts.push('CURRENT_TIMESTAMP AS created_at');
    }

    // Start building query
    let query = `SELECT ${selectParts.join(', ')} FROM ai_updates WHERE 1=1`;
    const params: any[] = [];

    // Add source filter only if real source column exists
    if (options.source && colSet.has('source')) {
      query += ' AND source = ?';
      params.push(options.source);
    }

    // Add relevance filter using the actual column if available
    if (options.minRelevance !== undefined) {
      if (colSet.has('relevance')) {
        query += ' AND relevance >= ?';
        params.push(options.minRelevance);
      } else if (colSet.has('relevance_score')) {
        query += ' AND relevance_score >= ?';
        params.push(options.minRelevance);
      } else {
        // no-op: table doesn't support relevance filtering
      }
    }

    // ORDER BY: prefer published if present, otherwise created_at
    if (colSet.has('published')) {
      query += ' ORDER BY published DESC, created_at DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url || '',
      source: row.source || '',
      published: row.published ? new Date(row.published) : null,
      summary: row.summary || '',
      tags: row.tags || '',
      relevance: Number(row.relevance) || 0,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    }));
  } finally {
    db.close();
  }
}

/**
 * Get update count by source
 */
export function getUpdateStats(): {
  source: string;
  count: number;
  avgRelevance: number;
}[] {
  const db = getDB();

  const stmt = db.prepare(`
    SELECT source, COUNT(*) as count, AVG(relevance) as avgRelevance
    FROM ai_updates
    GROUP BY source
    ORDER BY count DESC
  `);

  const rows = stmt.all() as any[];
  db.close();

  return rows.map((row) => ({
    source: row.source,
    count: row.count,
    avgRelevance: row.avgRelevance || 0,
  }));
}
