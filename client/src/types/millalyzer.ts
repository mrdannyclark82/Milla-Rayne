/**
 * millAlyzer Type Definitions
 *
 * Type definitions for YouTube video analysis, news monitoring,
 * and knowledge base features.
 */

export interface VideoAnalysis {
  videoId: string;
  title: string;
  type: 'tutorial' | 'news' | 'discussion' | 'entertainment' | 'other';
  keyPoints: KeyPoint[];
  actionableItems: ActionableItem[];
  codeSnippets: CodeSnippet[];
  cliCommands: CLICommand[];
  summary: string;
  analysisDate: string;
  transcriptAvailable: boolean;
}

export interface KeyPoint {
  timestamp: string;
  point: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ActionableItem {
  type: 'step' | 'tip' | 'warning' | 'resource';
  content: string;
  order?: number;
  dependencies?: string[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  description: string;
  timestamp?: string;
  copyable: true;
}

export interface CLICommand {
  command: string;
  description: string;
  platform: 'linux' | 'mac' | 'windows' | 'all';
  timestamp?: string;
  copyable: true;
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

export interface YoutubeKnowledge {
  id: string;
  videoId: string;
  title: string;
  channelName?: string;
  duration?: number;
  videoType: 'tutorial' | 'news' | 'discussion' | 'entertainment' | 'other';
  summary: string;
  keyPoints: KeyPoint[];
  codeSnippets: CodeSnippet[];
  cliCommands: CLICommand[];
  actionableItems: ActionableItem[];
  tags: string[];
  transcriptAvailable: boolean;
  analyzedAt: Date;
  watchCount: number;
  userId: string;
}

export interface KnowledgeBaseStats {
  totalVideos: number;
  byType: Record<string, number>;
  totalCodeSnippets: number;
  totalCLICommands: number;
  topLanguages: Array<{ language: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  recentVideos: Array<{ videoId: string; title: string; analyzedAt: Date }>;
}

export interface SearchKnowledgeParams {
  query?: string;
  videoType?: 'tutorial' | 'news' | 'discussion' | 'entertainment' | 'other';
  tags?: string[];
  hasCode?: boolean;
  hasCommands?: boolean;
  limit?: number;
}

export interface SearchCodeSnippetsParams {
  language?: string;
  query?: string;
  limit?: number;
}

export interface SearchCLICommandsParams {
  platform?: 'linux' | 'mac' | 'windows' | 'all';
  query?: string;
  limit?: number;
}
