/**
 * YouTube News Monitor Service
 *
 * Automates daily searches for AI, tech, and coding news on YouTube.
 * Integrates with knowledge base and daily suggestions system.
 *
 * Sprint 3 Features:
 * - Automated daily news searches
 * - AI/coding news categorization
 * - Integration with daily suggestions
 * - News filtering and ranking
 * - Trending topic detection
 */

import { searchVideos } from './googleYoutubeService';
import { saveToKnowledgeBase } from './youtubeKnowledgeBase';
import { analyzeVideoWithMillAlyzer } from './youtubeMillAlyzer';
import { storage } from './storage';

// ===========================================================================================
// TYPES
// ===========================================================================================

export interface NewsCategory {
  name: string;
  keywords: string[];
  priority: number;
}

export interface NewsItem {
  videoId: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail?: string;
  category: string;
  relevanceScore: number;
  viewCount?: number;
}

export interface DailyNewsDigest {
  date: string;
  categories: Record<string, NewsItem[]>;
  topStories: NewsItem[];
  totalVideos: number;
  analysisCount: number;
}

// ===========================================================================================
// NEWS CATEGORIES & KEYWORDS
// ===========================================================================================

export const NEWS_CATEGORIES: NewsCategory[] = [
  {
    name: 'AI & Machine Learning',
    keywords: [
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'neural network',
      'GPT',
      'ChatGPT',
      'Claude',
      'Gemini',
      'LLM',
      'AI news',
      'AI breakthrough',
      'OpenAI',
      'Anthropic',
      'Google AI',
    ],
    priority: 10,
  },
  {
    name: 'Web Development',
    keywords: [
      'react',
      'nextjs',
      'vue',
      'angular',
      'javascript',
      'typescript',
      'web development',
      'frontend',
      'backend',
      'full stack',
      'node.js',
      'deno',
      'bun',
    ],
    priority: 8,
  },
  {
    name: 'DevOps & Cloud',
    keywords: [
      'kubernetes',
      'docker',
      'AWS',
      'Azure',
      'GCP',
      'cloud computing',
      'devops',
      'CI/CD',
      'terraform',
      'deployment',
      'serverless',
    ],
    priority: 7,
  },
  {
    name: 'Programming Languages',
    keywords: [
      'python',
      'rust',
      'go',
      'golang',
      'java',
      'c++',
      'programming',
      'coding',
      'new language',
      'language update',
    ],
    priority: 6,
  },
  {
    name: 'Data Science',
    keywords: [
      'data science',
      'data analysis',
      'pandas',
      'numpy',
      'jupyter',
      'data visualization',
      'analytics',
      'big data',
    ],
    priority: 7,
  },
  {
    name: 'Security & Privacy',
    keywords: [
      'cybersecurity',
      'security breach',
      'vulnerability',
      'encryption',
      'privacy',
      'hacking',
      'infosec',
      'zero-day',
    ],
    priority: 9,
  },
  {
    name: 'Tech Industry',
    keywords: [
      'tech news',
      'startup',
      'silicon valley',
      'tech layoffs',
      'tech earnings',
      'product launch',
      'tech conference',
    ],
    priority: 5,
  },
];

// ===========================================================================================
// DAILY NEWS SEARCH
// ===========================================================================================

/**
 * Run daily news search across all categories
 */
export async function runDailyNewsSearch(
  userId: string = 'default-user'
): Promise<DailyNewsDigest> {
  console.log('📰 Starting daily YouTube news search...');

  const today = new Date().toISOString().split('T')[0];
  const digest: DailyNewsDigest = {
    date: today,
    categories: {},
    topStories: [],
    totalVideos: 0,
    analysisCount: 0,
  };

  // Search each category
  for (const category of NEWS_CATEGORIES) {
    console.log(`🔍 Searching: ${category.name}`);

    try {
      const categoryNews = await searchCategoryNews(category, userId);

      if (categoryNews.length > 0) {
        digest.categories[category.name] = categoryNews;
        digest.totalVideos += categoryNews.length;

        // Add top story from high-priority categories to top stories
        if (category.priority >= 8 && categoryNews.length > 0) {
          digest.topStories.push(categoryNews[0]);
        }
      }
    } catch (error) {
      console.error(`Error searching ${category.name}:`, error);
      // Continue with other categories
    }
  }

  // Sort top stories by relevance
  digest.topStories.sort((a, b) => b.relevanceScore - a.relevanceScore);
  digest.topStories = digest.topStories.slice(0, 5);

  console.log(
    `✅ Daily news search complete: ${digest.totalVideos} videos found`
  );

  return digest;
}

/**
 * Search news for a specific category
 */
async function searchCategoryNews(
  category: NewsCategory,
  userId: string
): Promise<NewsItem[]> {
  const results: NewsItem[] = [];

  // Build search query from top keywords
  const searchQuery = category.keywords.slice(0, 3).join(' OR ');
  const timeFilter = getTimeFilterQuery(); // Last 24 hours

  try {
    const searchResult = await searchVideos(
      userId,
      `${searchQuery} ${timeFilter}`,
      10,
      'date' // Sort by most recent
    );

    if (searchResult.success && searchResult.data) {
      for (const video of searchResult.data) {
        const newsItem: NewsItem = {
          videoId: video.id.videoId,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          thumbnail: video.snippet.thumbnails?.medium?.url,
          category: category.name,
          relevanceScore: calculateRelevance(video.snippet, category),
        };

        results.push(newsItem);
      }
    }
  } catch (error) {
    console.error(`Error searching category ${category.name}:`, error);
  }

  // Sort by relevance and return top 5
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

/**
 * Calculate relevance score for a video based on category keywords
 */
function calculateRelevance(snippet: any, category: NewsCategory): number {
  let score = 0;
  const text = `${snippet.title} ${snippet.description}`.toLowerCase();

  // Check keyword matches
  category.keywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
    }
  });

  // Boost for category priority
  score += category.priority;

  // Boost for recent videos (within last 24 hours)
  const publishedDate = new Date(snippet.publishedAt);
  const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) {
    score += 20;
  } else if (hoursAgo < 48) {
    score += 10;
  }

  return score;
}

/**
 * Get time filter for YouTube search (last 24-48 hours)
 */
function getTimeFilterQuery(): string {
  // YouTube search supports time-based filters
  // Using publishedAfter parameter in actual API calls
  return 'today OR yesterday';
}

// ===========================================================================================
// AUTO-ANALYSIS OF TOP NEWS
// ===========================================================================================

/**
 * Automatically analyze top news stories and save to knowledge base
 */
export async function analyzeTopNews(
  digest: DailyNewsDigest,
  userId: string = 'default-user',
  maxAnalyze: number = 3
): Promise<number> {
  console.log(`🔬 Auto-analyzing top ${maxAnalyze} news stories...`);

  let analyzedCount = 0;

  for (const story of digest.topStories.slice(0, maxAnalyze)) {
    try {
      console.log(`📊 Analyzing: ${story.title}`);

      // Run millAlyzer analysis
      const analysis = await analyzeVideoWithMillAlyzer(story.videoId);

      // Save to knowledge base
      await saveToKnowledgeBase(analysis, userId);

      analyzedCount++;
      console.log(`✅ Analyzed and saved: ${story.title}`);
    } catch (error) {
      console.error(`Error analyzing ${story.title}:`, error);
      // Continue with next story
    }
  }

  console.log(
    `🎯 Auto-analysis complete: ${analyzedCount}/${maxAnalyze} stories analyzed`
  );
  return analyzedCount;
}

// ===========================================================================================
// DAILY SUGGESTION INTEGRATION
// ===========================================================================================

/**
 * Format news digest as daily suggestion
 */
export function formatNewsDigestAsSuggestion(digest: DailyNewsDigest): string {
  let suggestion = `📰 **Your Daily Tech News Digest** (${digest.date})\n\n`;
  suggestion += `Found ${digest.totalVideos} new videos across ${Object.keys(digest.categories).length} categories, love!\n\n`;

  // Top Stories
  if (digest.topStories.length > 0) {
    suggestion += `### 🔥 Top Stories:\n\n`;
    digest.topStories.forEach((story, i) => {
      suggestion += `${i + 1}. **${story.title}**\n`;
      suggestion += `   📺 ${story.channel} • ${story.category}\n`;
      suggestion += `   🎬 \`${story.videoId}\`\n\n`;
    });
  }

  // Category Breakdown
  const sortedCategories = Object.entries(digest.categories)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  if (sortedCategories.length > 0) {
    suggestion += `### 📚 By Category:\n\n`;
    sortedCategories.forEach(([categoryName, videos]) => {
      suggestion += `**${categoryName}** (${videos.length} videos)\n`;
      videos.slice(0, 2).forEach((v) => {
        suggestion += `• ${v.title}\n`;
      });
      suggestion += '\n';
    });
  }

  suggestion += `---\n💡 Say "analyze [video title]" to dive deeper into any story!\n`;
  suggestion += `📊 Or "show me AI news" to explore a specific category.`;

  return suggestion;
}

/**
 * Create and store daily suggestion from news digest
 */
export async function createDailySuggestionFromNews(
  digest: DailyNewsDigest
): Promise<void> {
  const suggestionText = formatNewsDigestAsSuggestion(digest);

  const metadata = {
    type: 'youtube_news_digest',
    totalVideos: digest.totalVideos,
    categories: Object.keys(digest.categories),
    topStories: digest.topStories.map((s) => s.videoId),
    analyzedCount: digest.analysisCount,
  };

  try {
    await storage.createDailySuggestion({
      date: digest.date,
      suggestionText,
      metadata,
    });
    console.log('✅ Created daily suggestion from news digest');
  } catch (error) {
    console.error('Error creating daily suggestion:', error);
    throw error;
  }
}

// ===========================================================================================
// SCHEDULED NEWS MONITORING
// ===========================================================================================

/**
 * Run complete daily news monitoring cycle
 */
export async function runDailyNewsMonitoring(
  userId: string = 'default-user'
): Promise<DailyNewsDigest> {
  console.log('🚀 Running daily news monitoring cycle...');

  try {
    // 1. Search for news across all categories
    const digest = await runDailyNewsSearch(userId);

    // 2. Auto-analyze top stories
    const analyzedCount = await analyzeTopNews(digest, userId, 3);
    digest.analysisCount = analyzedCount;

    // 3. Create daily suggestion
    await createDailySuggestionFromNews(digest);

    console.log('✅ Daily news monitoring complete!');
    console.log(`   📊 ${digest.totalVideos} videos found`);
    console.log(`   🔬 ${digest.analysisCount} stories analyzed`);
    console.log(`   📝 Daily suggestion created`);

    return digest;
  } catch (error) {
    console.error('Error in daily news monitoring:', error);
    throw error;
  }
}

// ===========================================================================================
// CATEGORY-SPECIFIC SEARCHES
// ===========================================================================================

/**
 * Search news for a specific category on demand
 */
export async function searchNewsByCategory(
  categoryName: string,
  userId: string = 'default-user',
  limit: number = 10
): Promise<NewsItem[]> {
  const category = NEWS_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (!category) {
    throw new Error(`Unknown category: ${categoryName}`);
  }

  return await searchCategoryNews(category, userId);
}

/**
 * Get available news categories
 */
export function getNewsCategories(): string[] {
  return NEWS_CATEGORIES.map((c) => c.name).sort();
}

/**
 * Search across multiple categories
 */
export async function searchMultipleCategories(
  categoryNames: string[],
  userId: string = 'default-user'
): Promise<Record<string, NewsItem[]>> {
  const results: Record<string, NewsItem[]> = {};

  for (const categoryName of categoryNames) {
    try {
      const news = await searchNewsByCategory(categoryName, userId);
      results[categoryName] = news;
    } catch (error) {
      console.error(`Error searching category ${categoryName}:`, error);
      results[categoryName] = [];
    }
  }

  return results;
}
