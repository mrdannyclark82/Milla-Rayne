/**
 * Real World Information Service
 *
 * This service provides access to current, real-world information including
 * news, weather, current events, and other dynamic data sources.
 */

import { SearchResponse } from './searchService';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface WeatherInfo {
  location: string;
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  forecast: string;
}

export interface RealWorldInfoResponse {
  type: 'news' | 'weather' | 'current_events' | 'facts';
  data: any;
  sources: string[];
  lastUpdated: string;
}

/**
 * Gets current news headlines
 */
export async function getCurrentNews(topic?: string): Promise<NewsArticle[]> {
  // For now, return sample data. In production, this would integrate with news APIs
  const sampleNews: NewsArticle[] = [
    {
      title: 'Global Technology Trends in 2024',
      description:
        'Recent developments in AI, quantum computing, and renewable energy are shaping the future.',
      url: 'https://example.com/tech-trends',
      publishedAt: new Date().toISOString(),
      source: 'Tech News Today',
    },
    {
      title: 'Climate Action Updates',
      description:
        'International efforts to address climate change show promising developments.',
      url: 'https://example.com/climate-action',
      publishedAt: new Date().toISOString(),
      source: 'Environmental News',
    },
  ];

  if (topic) {
    return sampleNews.filter(
      (article) =>
        article.title.toLowerCase().includes(topic.toLowerCase()) ||
        article.description.toLowerCase().includes(topic.toLowerCase())
    );
  }

  return sampleNews;
}

/**
 * Gets weather information for a location
 */
export async function getWeatherInfo(
  location: string = 'general'
): Promise<WeatherInfo> {
  // Sample weather data - in production, integrate with weather APIs
  return {
    location: location,
    temperature: '22°C (72°F)',
    condition: 'Partly Cloudy',
    humidity: '65%',
    windSpeed: '8 km/h',
    forecast:
      'Clear skies expected for the next few days with temperatures ranging from 18-25°C',
  };
}

/**
 * Gets current date and time information
 */
export function getCurrentDateTime(): {
  date: string;
  time: string;
  timezone: string;
} {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: now.toLocaleTimeString('en-US'),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Gets real-world facts and current information
 */
export function getRealWorldFacts(): string[] {
  return [
    'The world population is currently over 8 billion people (as of 2024).',
    'Renewable energy now accounts for more than 30% of global electricity generation.',
    'There are currently over 5,000 active satellites orbiting Earth.',
    'The International Space Station has been continuously occupied since November 2000.',
    'Over 4.9 billion people worldwide use the internet as of 2024.',
    'Electric vehicles represent approximately 10% of global car sales as of 2024.',
    'There are 195 recognized countries in the world today.',
    'The latest version of the periodic table contains 118 confirmed elements.',
  ];
}

/**
 * Provides contextual real-world information based on query
 */
export async function getRealWorldInfo(query: string): Promise<SearchResponse> {
  const normalizedQuery = query.toLowerCase();
  const currentDateTime = getCurrentDateTime();

  // Check for time/date queries
  if (
    normalizedQuery.includes('time') ||
    normalizedQuery.includes('date') ||
    normalizedQuery.includes('today')
  ) {
    return {
      query,
      results: [
        {
          title: 'Current Date and Time',
          url: '',
          description: `Today is ${currentDateTime.date}. Current time: ${currentDateTime.time} (${currentDateTime.timezone})`,
        },
      ],
      summary: `Current information: Today is ${currentDateTime.date} and the time is ${currentDateTime.time} in ${currentDateTime.timezone}.`,
    };
  }

  // Check for weather queries
  if (normalizedQuery.includes('weather')) {
    const weatherInfo = await getWeatherInfo();
    return {
      query,
      results: [
        {
          title: 'Current Weather Information',
          url: '',
          description: `${weatherInfo.condition}, ${weatherInfo.temperature}. ${weatherInfo.forecast}`,
        },
      ],
      summary: `Weather update: ${weatherInfo.condition} with temperature at ${weatherInfo.temperature}. ${weatherInfo.forecast}`,
    };
  }

  // Check for news queries
  if (
    normalizedQuery.includes('news') ||
    normalizedQuery.includes('current events')
  ) {
    const news = await getCurrentNews();
    return {
      query,
      results: news.map((article) => ({
        title: article.title,
        url: article.url,
        description: article.description,
      })),
      summary: `Recent news headlines: ${news.map((article) => article.title).join('; ')}`,
    };
  }

  // Check for world facts
  if (
    normalizedQuery.includes('world') ||
    normalizedQuery.includes('global') ||
    normalizedQuery.includes('current')
  ) {
    const facts = getRealWorldFacts();
    return {
      query,
      results: [
        {
          title: 'Current World Facts',
          url: '',
          description: facts.join(' '),
        },
      ],
      summary: `Here are some current world facts: ${facts.slice(0, 3).join(' ')}`,
    };
  }

  // Default response with current context
  return {
    query,
    results: [
      {
        title: 'Real-World Context',
        url: '',
        description: `As of ${currentDateTime.date}, I can provide current information about news, weather, world facts, and more. Try asking about specific topics like "current news", "weather", or "world facts".`,
      },
    ],
    summary: `For real-world information as of ${currentDateTime.date}, I can help with current news, weather, world facts, and other up-to-date information. What specific information are you looking for?`,
  };
}

/**
 * Integrates real-world information with existing search service
 */
export async function enhanceSearchWithRealWorldInfo(
  originalResponse: SearchResponse
): Promise<SearchResponse> {
  const realWorldInfo = await getRealWorldInfo(originalResponse.query);

  // Combine results
  const enhancedResults = [
    ...originalResponse.results,
    ...realWorldInfo.results,
  ];
  const enhancedSummary = `${originalResponse.summary}\n\nAdditional current information: ${realWorldInfo.summary}`;

  return {
    query: originalResponse.query,
    results: enhancedResults,
    summary: enhancedSummary,
  };
}

/**
 * Mobile Sensor Data Interfaces
 */
export interface SensorData {
  userId: string;
  timestamp: number;
  userMotionState: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
  ambientLightLevel: number;
  nearbyBluetoothDevices: string[];
  batteryLevel?: number;
  isCharging?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  networkType?: 'wifi' | 'cellular' | 'none';
}

export interface AmbientContext {
  userId: string;
  lastUpdated: number;
  motionState: string;
  lightLevel: number;
  deviceContext: {
    battery: number | null;
    charging: boolean;
    network: string | null;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  nearbyDevices: string[];
}

// In-memory store for ambient context (could be moved to database for persistence)
const ambientContextStore = new Map<string, AmbientContext>();

/**
 * Update ambient context from mobile sensor data
 */
export function updateAmbientContext(userId: string, data: SensorData): void {
  const context: AmbientContext = {
    userId,
    lastUpdated: Date.now(),
    motionState: data.userMotionState,
    lightLevel: data.ambientLightLevel,
    deviceContext: {
      battery: data.batteryLevel ?? null,
      charging: data.isCharging ?? false,
      network: data.networkType ?? null,
    },
    location: data.location
      ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        }
      : null,
    nearbyDevices: data.nearbyBluetoothDevices,
  };

  ambientContextStore.set(userId, context);
  // Use parameterized logging to avoid format string injection
  console.log('📱 Updated ambient context for user:', userId, {
    motion: context.motionState,
    light: context.lightLevel,
    battery: context.deviceContext.battery,
  });
}

/**
 * Get current ambient context for a user
 */
export function getAmbientContext(userId: string): AmbientContext | null {
  const context = ambientContextStore.get(userId);

  // Return null if context is older than 5 minutes
  if (context && Date.now() - context.lastUpdated > 5 * 60 * 1000) {
    ambientContextStore.delete(userId);
    return null;
  }

  return context ?? null;
}
