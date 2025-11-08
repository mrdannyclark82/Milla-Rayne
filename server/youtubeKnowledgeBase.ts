/**
 * YouTube Knowledge Base Service
 *
 * Stores and retrieves analyzed YouTube videos with searchable content.
 * Provides code snippet library, command reference, and learning path tracking.
 *
 * Sprint 2 Features:
 * - Store millAlyzer results in database
 * - Search analyzed videos by content, tags, or type
 * - Code snippet library with language filtering
 * - CLI command reference with platform filtering
 * - Auto-tagging based on content analysis
 */

import { storage } from './storage';
import type { VideoAnalysis } from './youtubeMillAlyzer';
import type { InsertYoutubeKnowledge, YoutubeKnowledge } from '@shared/schema';

// ===========================================================================================
// TYPES
// ===========================================================================================

export interface SearchFilters {
  query?: string;
  videoType?: 'tutorial' | 'news' | 'discussion' | 'entertainment' | 'other';
  tags?: string[];
  hasCode?: boolean;
  hasCommands?: boolean;
  userId?: string;
  limit?: number;
}

export interface CodeSnippetSearchFilters {
  language?: string;
  query?: string;
  userId?: string;
  limit?: number;
}

export interface CLICommandSearchFilters {
  platform?: 'linux' | 'mac' | 'windows' | 'all';
  query?: string;
  userId?: string;
  limit?: number;
}

// ===========================================================================================
// SAVE ANALYSIS TO KNOWLEDGE BASE
// ===========================================================================================

/**
 * Stores a video analysis in the knowledge base
 */
export async function saveToKnowledgeBase(
  analysis: VideoAnalysis,
  userId: string = 'default-user'
): Promise<YoutubeKnowledge> {
  console.log(`📚 Saving video ${analysis.videoId} to knowledge base...`);

  // Auto-generate tags from content
  const tags = generateTags(analysis);

  const knowledgeEntry: InsertYoutubeKnowledge = {
    videoId: analysis.videoId,
    title: analysis.title,
    videoType: analysis.type,
    summary: analysis.summary,
    keyPoints: analysis.keyPoints,
    codeSnippets: analysis.codeSnippets,
    cliCommands: analysis.cliCommands,
    actionableItems: analysis.actionableItems,
    tags,
    transcriptAvailable: analysis.transcriptAvailable,
    userId,
  };

  try {
    const saved = await storage.saveYoutubeKnowledge(knowledgeEntry);
    console.log(`✅ Saved video "${analysis.title}" to knowledge base`);
    return saved;
  } catch (error) {
    console.error('Error saving to knowledge base:', error);
    throw error;
  }
}

/**
 * Auto-generates tags from video analysis content
 */
function generateTags(analysis: VideoAnalysis): string[] {
  const tags = new Set<string>();

  // Add type as tag
  tags.add(analysis.type);

  // Extract programming languages from code snippets
  analysis.codeSnippets.forEach((snippet) => {
    tags.add(snippet.language.toLowerCase());
  });

  // Extract tools from CLI commands
  analysis.cliCommands.forEach((cmd) => {
    const command = cmd.command.toLowerCase();

    // Common tools
    if (command.startsWith('npm')) tags.add('npm');
    if (command.startsWith('docker')) tags.add('docker');
    if (command.startsWith('git')) tags.add('git');
    if (command.startsWith('python') || command.startsWith('pip'))
      tags.add('python');
    if (command.startsWith('node')) tags.add('nodejs');
    if (command.startsWith('yarn')) tags.add('yarn');
    if (command.startsWith('cargo')) tags.add('rust');
    if (command.startsWith('go ')) tags.add('golang');
    if (command.startsWith('kubectl')) tags.add('kubernetes');
    if (command.startsWith('terraform')) tags.add('terraform');
  });

  // Extract keywords from title and summary
  const text = `${analysis.title} ${analysis.summary}`.toLowerCase();

  const keywords = [
    'api',
    'rest',
    'graphql',
    'database',
    'frontend',
    'backend',
    'react',
    'vue',
    'angular',
    'nextjs',
    'express',
    'fastify',
    'mongodb',
    'postgresql',
    'mysql',
    'redis',
    'aws',
    'azure',
    'gcp',
    'cloud',
    'ci/cd',
    'devops',
    'testing',
    'deployment',
    'machine learning',
    'ai',
    'data science',
    'authentication',
    'security',
    'encryption',
  ];

  keywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      tags.add(keyword.replace(/\s+/g, '-'));
    }
  });

  return Array.from(tags);
}

// ===========================================================================================
// SEARCH KNOWLEDGE BASE
// ===========================================================================================

/**
 * Search the knowledge base with flexible filters
 */
export async function searchKnowledgeBase(
  filters: SearchFilters
): Promise<YoutubeKnowledge[]> {
  console.log('🔍 Searching knowledge base with filters:', filters);

  try {
    const results = await storage.searchYoutubeKnowledge(filters);
    console.log(`✅ Found ${results.length} videos matching search criteria`);
    return results;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    throw error;
  }
}

/**
 * Get a specific video from the knowledge base
 */
export async function getVideoFromKnowledgeBase(
  videoId: string,
  userId: string = 'default-user'
): Promise<YoutubeKnowledge | null> {
  try {
    const video = await storage.getYoutubeKnowledgeByVideoId(videoId, userId);

    if (video) {
      // Increment watch count
      await storage.incrementYoutubeWatchCount(videoId, userId);
    }

    return video;
  } catch (error) {
    console.error('Error getting video from knowledge base:', error);
    return null;
  }
}

// ===========================================================================================
// CODE SNIPPET LIBRARY
// ===========================================================================================

/**
 * Search code snippets across all analyzed videos
 */
export async function searchCodeSnippets(
  filters: CodeSnippetSearchFilters
): Promise<Array<{ video: YoutubeKnowledge; snippet: any }>> {
  console.log('💻 Searching code snippets with filters:', filters);

  try {
    const videos = await storage.searchYoutubeKnowledge({
      hasCode: true,
      userId: filters.userId,
      limit: filters.limit || 50,
    });

    const results: Array<{ video: YoutubeKnowledge; snippet: any }> = [];

    videos.forEach((video) => {
      const snippets = (video.codeSnippets as any[]) || [];

      snippets.forEach((snippet) => {
        let matches = true;

        // Filter by language
        if (
          filters.language &&
          snippet.language?.toLowerCase() !== filters.language.toLowerCase()
        ) {
          matches = false;
        }

        // Filter by query in code or description
        if (filters.query) {
          const searchText =
            `${snippet.code} ${snippet.description}`.toLowerCase();
          if (!searchText.includes(filters.query.toLowerCase())) {
            matches = false;
          }
        }

        if (matches) {
          results.push({ video, snippet });
        }
      });
    });

    console.log(`✅ Found ${results.length} code snippets`);
    return results;
  } catch (error) {
    console.error('Error searching code snippets:', error);
    throw error;
  }
}

/**
 * Get all unique programming languages in knowledge base
 */
export async function getAvailableLanguages(
  userId: string = 'default-user'
): Promise<string[]> {
  const videos = await storage.searchYoutubeKnowledge({
    hasCode: true,
    userId,
  });

  const languages = new Set<string>();

  videos.forEach((video) => {
    const snippets = (video.codeSnippets as any[]) || [];
    snippets.forEach((snippet) => {
      if (snippet.language) {
        languages.add(snippet.language);
      }
    });
  });

  return Array.from(languages).sort();
}

// ===========================================================================================
// CLI COMMAND REFERENCE
// ===========================================================================================

/**
 * Search CLI commands across all analyzed videos
 */
export async function searchCLICommands(
  filters: CLICommandSearchFilters
): Promise<Array<{ video: YoutubeKnowledge; command: any }>> {
  console.log('⚡ Searching CLI commands with filters:', filters);

  try {
    const videos = await storage.searchYoutubeKnowledge({
      hasCommands: true,
      userId: filters.userId,
      limit: filters.limit || 50,
    });

    const results: Array<{ video: YoutubeKnowledge; command: any }> = [];

    videos.forEach((video) => {
      const commands = (video.cliCommands as any[]) || [];

      commands.forEach((command) => {
        let matches = true;

        // Filter by platform
        if (
          filters.platform &&
          command.platform !== filters.platform &&
          command.platform !== 'all'
        ) {
          matches = false;
        }

        // Filter by query in command or description
        if (filters.query) {
          const searchText =
            `${command.command} ${command.description}`.toLowerCase();
          if (!searchText.includes(filters.query.toLowerCase())) {
            matches = false;
          }
        }

        if (matches) {
          results.push({ video, command });
        }
      });
    });

    console.log(`✅ Found ${results.length} CLI commands`);
    return results;
  } catch (error) {
    console.error('Error searching CLI commands:', error);
    throw error;
  }
}

// ===========================================================================================
// STATISTICS & INSIGHTS
// ===========================================================================================

/**
 * Get knowledge base statistics for a user
 */
export async function getKnowledgeBaseStats(userId: string = 'default-user') {
  const allVideos = await storage.searchYoutubeKnowledge({
    userId,
    limit: 1000,
  });

  const stats = {
    totalVideos: allVideos.length,
    byType: {
      tutorial: 0,
      news: 0,
      discussion: 0,
      entertainment: 0,
      other: 0,
    },
    totalCodeSnippets: 0,
    totalCLICommands: 0,
    totalKeyPoints: 0,
    topLanguages: [] as Array<{ language: string; count: number }>,
    topTags: [] as Array<{ tag: string; count: number }>,
    recentlyAnalyzed: [] as YoutubeKnowledge[],
  };

  const languageCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  allVideos.forEach((video) => {
    // Count by type
    stats.byType[video.videoType]++;

    // Count snippets, commands, points
    const snippets = (video.codeSnippets as any[]) || [];
    const commands = (video.cliCommands as any[]) || [];
    const keyPoints = (video.keyPoints as any[]) || [];

    stats.totalCodeSnippets += snippets.length;
    stats.totalCLICommands += commands.length;
    stats.totalKeyPoints += keyPoints.length;

    // Count languages
    snippets.forEach((snippet) => {
      const lang = snippet.language;
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    // Count tags
    const tags = (video.tags as string[]) || [];
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Top languages
  stats.topLanguages = Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top tags
  stats.topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recently analyzed (last 5)
  stats.recentlyAnalyzed = allVideos
    .sort(
      (a, b) =>
        new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
    )
    .slice(0, 5);

  return stats;
}

/**
 * Get recommended videos based on user's knowledge base
 */
export async function getRecommendedVideos(
  userId: string = 'default-user',
  limit: number = 5
) {
  // Get user's most common tags
  const stats = await getKnowledgeBaseStats(userId);
  const topTags = stats.topTags.slice(0, 3).map((t) => t.tag);

  if (topTags.length === 0) {
    return [];
  }

  // Search for videos with those tags (excluding already analyzed ones)
  const allAnalyzed = await storage.searchYoutubeKnowledge({
    userId,
    limit: 1000,
  });
  const analyzedVideoIds = new Set(allAnalyzed.map((v) => v.videoId));

  // This would integrate with YouTube search API to find new videos
  // For now, return empty - this is a placeholder for future enhancement
  return [];
}
