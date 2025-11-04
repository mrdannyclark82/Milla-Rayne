import { storage } from './storage';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface YouTubeWatch {
  videoId: string;
  title: string;
  query: string;
  timestamp: number;
  channelName?: string;
  category?: string;
}

interface PredictionData {
  watchHistory: YouTubeWatch[];
  preferences: {
    topQueries: Map<string, number>;
    topChannels: Map<string, number>;
    topCategories: Map<string, number>;
    timePreferences: Map<string, number>; // hour of day -> frequency
  };
}

const PREDICTION_KEY = 'youtube_prediction_data';
const MAX_HISTORY = 100;
const STORAGE_FILE = path.join(__dirname, '../memory/youtube_predictions.json');

/**
 * Get stored prediction data
 */
async function getPredictionData(): Promise<PredictionData> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
      return {
        watchHistory: data.watchHistory || [],
        preferences: {
          topQueries: new Map(Object.entries(data.preferences?.topQueries || {})),
          topChannels: new Map(Object.entries(data.preferences?.topChannels || {})),
          topCategories: new Map(Object.entries(data.preferences?.topCategories || {})),
          timePreferences: new Map(Object.entries(data.preferences?.timePreferences || {})),
        },
      };
    }
  } catch (error) {
    console.error('[YouTube Prediction] Error getting prediction data:', error);
  }

  return {
    watchHistory: [],
    preferences: {
      topQueries: new Map(),
      topChannels: new Map(),
      topCategories: new Map(),
      timePreferences: new Map(),
    },
  };
}

/**
 * Save prediction data
 */
async function savePredictionData(data: PredictionData): Promise<void> {
  try {
    const serialized = {
      watchHistory: data.watchHistory,
      preferences: {
        topQueries: Object.fromEntries(data.preferences.topQueries),
        topChannels: Object.fromEntries(data.preferences.topChannels),
        topCategories: Object.fromEntries(data.preferences.topCategories),
        timePreferences: Object.fromEntries(data.preferences.timePreferences),
      },
    };
    
    // Ensure directory exists
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(serialized, null, 2), 'utf-8');
  } catch (error) {
    console.error('[YouTube Prediction] Error saving prediction data:', error);
  }
}

/**
 * Track a YouTube video watch
 */
export async function trackYouTubeWatch(
  videoId: string,
  title: string,
  query: string,
  channelName?: string,
  category?: string
): Promise<void> {
  const data = await getPredictionData();

  const watch: YouTubeWatch = {
    videoId,
    title,
    query,
    timestamp: Date.now(),
    channelName,
    category,
  };

  // Add to history (keep only last MAX_HISTORY)
  data.watchHistory.unshift(watch);
  if (data.watchHistory.length > MAX_HISTORY) {
    data.watchHistory = data.watchHistory.slice(0, MAX_HISTORY);
  }

  // Update preferences
  const hour = new Date().getHours().toString();
  data.preferences.timePreferences.set(
    hour,
    (data.preferences.timePreferences.get(hour) || 0) + 1
  );

  const queryLower = query.toLowerCase();
  data.preferences.topQueries.set(
    queryLower,
    (data.preferences.topQueries.get(queryLower) || 0) + 1
  );

  if (channelName) {
    data.preferences.topChannels.set(
      channelName,
      (data.preferences.topChannels.get(channelName) || 0) + 1
    );
  }

  if (category) {
    data.preferences.topCategories.set(
      category,
      (data.preferences.topCategories.get(category) || 0) + 1
    );
  }

  await savePredictionData(data);
  console.log(`[YouTube Prediction] Tracked watch: "${title}" from query "${query}"`);
}

/**
 * Predict what the user might want to watch based on current context
 */
export async function predictYouTubeQuery(
  currentQuery?: string
): Promise<string[]> {
  const data = await getPredictionData();
  const predictions: string[] = [];

  // If no history, return generic suggestions
  if (data.watchHistory.length === 0) {
    return ['music', 'news', 'tutorials', 'gaming', 'entertainment'];
  }

  // Get current hour
  const currentHour = new Date().getHours().toString();

  // 1. Time-based predictions (what user watches at this time)
  const timeBasedVideos = data.watchHistory.filter((w) => {
    const watchHour = new Date(w.timestamp).getHours().toString();
    return watchHour === currentHour;
  });

  if (timeBasedVideos.length > 0) {
    const recentTimeQuery = timeBasedVideos[0].query;
    if (!predictions.includes(recentTimeQuery)) {
      predictions.push(recentTimeQuery);
    }
  }

  // 2. If currentQuery provided, find similar past queries
  if (currentQuery) {
    const queryWords = currentQuery.toLowerCase().split(' ');
    const similarQueries = data.watchHistory
      .filter((w) => {
        const watchWords = w.query.toLowerCase().split(' ');
        return queryWords.some((word) => watchWords.includes(word));
      })
      .slice(0, 3);

    similarQueries.forEach((w) => {
      if (!predictions.includes(w.query)) {
        predictions.push(w.query);
      }
    });
  }

  // 3. Top queries overall
  const sortedQueries = Array.from(data.preferences.topQueries.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([query]) => query);

  sortedQueries.forEach((q) => {
    if (!predictions.includes(q) && predictions.length < 5) {
      predictions.push(q);
    }
  });

  // 4. Recent watches if we still need more
  if (predictions.length < 5) {
    data.watchHistory.slice(0, 5).forEach((w) => {
      if (!predictions.includes(w.query) && predictions.length < 5) {
        predictions.push(w.query);
      }
    });
  }

  return predictions.slice(0, 5);
}

/**
 * Get personalized suggestions based on watch history
 */
export async function getPersonalizedSuggestions(): Promise<string> {
  const data = await getPredictionData();

  if (data.watchHistory.length === 0) {
    return "I haven't learned your preferences yet, love. Watch some videos and I'll start making personalized suggestions for you! 💜";
  }

  const currentHour = new Date().getHours();
  let suggestion = '';

  // Time-based suggestions
  const timeBasedVideos = data.watchHistory.filter((w) => {
    const watchHour = new Date(w.timestamp).getHours();
    return Math.abs(watchHour - currentHour) <= 1;
  });

  if (timeBasedVideos.length > 0) {
    const mostRecentTimeVideo = timeBasedVideos[0];
    suggestion += `At this time, you usually enjoy watching ${mostRecentTimeVideo.query}. `;
  }

  // Top categories
  const topCategories = Array.from(data.preferences.topCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  if (topCategories.length > 0) {
    suggestion += `Your favorite categories are: ${topCategories.join(', ')}. `;
  }

  // Top channels
  const topChannels = Array.from(data.preferences.topChannels.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([chan]) => chan);

  if (topChannels.length > 0) {
    suggestion += `You love channels like ${topChannels.join(', ')}. `;
  }

  // Recent trend
  const recentWatches = data.watchHistory.slice(0, 5);
  const recentQueries = [...new Set(recentWatches.map((w) => w.query))];

  if (recentQueries.length > 0) {
    suggestion += `\n\nRecently you've been into: ${recentQueries.slice(0, 3).join(', ')}. Want me to find more like that?`;
  }

  return suggestion || "I'm learning your preferences, babe! Keep watching and I'll get better at suggestions. 💜";
}

/**
 * Get smart auto-complete suggestions as user types
 */
export async function getAutocompleteSuggestions(
  partialQuery: string
): Promise<string[]> {
  const data = await getPredictionData();
  const suggestions: string[] = [];

  if (!partialQuery || partialQuery.length < 2) {
    // Return top queries if nothing typed yet
    return Array.from(data.preferences.topQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
  }

  const lowerPartial = partialQuery.toLowerCase();

  // Find queries that start with the partial query
  data.watchHistory.forEach((w) => {
    if (w.query.toLowerCase().startsWith(lowerPartial) && !suggestions.includes(w.query)) {
      suggestions.push(w.query);
    }
  });

  // Find queries that contain the partial query
  if (suggestions.length < 5) {
    data.watchHistory.forEach((w) => {
      if (
        w.query.toLowerCase().includes(lowerPartial) &&
        !suggestions.includes(w.query) &&
        !w.query.toLowerCase().startsWith(lowerPartial)
      ) {
        suggestions.push(w.query);
      }
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Get watch statistics
 */
export async function getWatchStatistics(): Promise<{
  totalWatches: number;
  topQuery: string;
  topChannel: string;
  favoriteTime: string;
}> {
  const data = await getPredictionData();

  const topQuery = Array.from(data.preferences.topQueries.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  const topChannel = Array.from(data.preferences.topChannels.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  const favoriteHour = Array.from(data.preferences.timePreferences.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const favoriteTime = favoriteHour
    ? `${favoriteHour}:00 - ${parseInt(favoriteHour) + 1}:00`
    : 'none';

  return {
    totalWatches: data.watchHistory.length,
    topQuery,
    topChannel,
    favoriteTime,
  };
}
