/**
 * Feature Discovery Service
 *
 * Scans GitHub repositories, web sources, and YouTube for feature ideas and trends.
 * Generates feature suggestions based on similar repositories and current tech trends.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { searchRepositories } from './githubApiService';

// Interface for YouTube video search result
interface YouTubeVideo {
  id?: {
    videoId?: string;
  };
  videoId?: string;
  snippet?: {
    title?: string;
    description?: string;
  };
  title?: string;
  description?: string;
}

export interface DiscoveredFeature {
  id: string;
  name: string;
  description: string;
  source: 'github' | 'web' | 'youtube' | 'user_pattern';
  sourceUrl?: string;
  repositoryExample?: string;
  popularity: number; // 1-10 scale
  relevance: number; // 1-10 scale
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedValue: number; // 1-10 scale
  discoveredAt: number;
  status:
    | 'discovered'
    | 'analyzed'
    | 'planned'
    | 'in_sandbox'
    | 'implemented'
    | 'rejected';
  tags: string[];
  /** Honest grounding — empty/missing means do not auto-sandbox */
  evidence?: string;
  /** If false, list for review only — never auto-create sandboxes */
  actionable?: boolean;
}

export interface RepositoryInsight {
  repositoryUrl: string;
  repositoryName: string;
  stars: number;
  language: string;
  description?: string;
  topics?: string[];
  features: string[];
  interestingPatterns: string[];
  scannedAt: number;
  evidence?: string[];
}

class FeatureDiscoveryService {
  private discoveredFeatures: DiscoveredFeature[] = [];
  private scannedRepositories: RepositoryInsight[] = [];
  private readonly DISCOVERY_FILE = path.join(
    process.cwd(),
    'memory',
    'feature_discovery.json'
  );
  private readonly MAX_FEATURES_STORED = 200;
  private readonly SCAN_KEYWORDS = [
    'AI assistant',
    'chatbot',
    'voice assistant',
    'conversation AI',
    'personal assistant',
    'AI companion',
    'typescript react',
    'express server',
    'sqlite database',
  ];

  async initialize(): Promise<void> {
    await this.loadDiscoveryData();
    console.log('Feature Discovery Service initialized');
  }

  /**
   * Discover features from similar GitHub repositories
   */
  async discoverFromGitHub(limit: number = 10): Promise<DiscoveredFeature[]> {
    const newFeatures: DiscoveredFeature[] = [];

    try {
      // Search for similar repositories
      for (const keyword of this.SCAN_KEYWORDS.slice(0, 3)) {
        const results = await searchRepositories(keyword, 5);

        for (const repo of results.slice(0, Math.max(1, Math.ceil(limit / 3)))) {
          const insight = await this.analyzeRepository({
            url: repo.url,
            name: repo.name,
            stars: repo.stars || 0,
            language: repo.language,
            description: repo.description,
            topics: repo.topics,
          });
          if (insight) {
            this.scannedRepositories.push(insight);

            // Grounded suggestions only — no name-keyword feature farms
            const features = this.extractFeaturesFromInsight(insight);
            newFeatures.push(...features);
          }
        }
      }

      // Add to discovered features
      for (const feature of newFeatures) {
        const existing = this.discoveredFeatures.find(
          (f) =>
            f.name.toLowerCase() === feature.name.toLowerCase() &&
            f.source === feature.source
        );

        if (!existing) {
          this.discoveredFeatures.push(feature);
        }
      }

      // Keep only most relevant features
      if (this.discoveredFeatures.length > this.MAX_FEATURES_STORED) {
        this.discoveredFeatures = this.discoveredFeatures
          .sort(
            (a, b) => b.relevance * b.popularity - a.relevance * a.popularity
          )
          .slice(0, this.MAX_FEATURES_STORED);
      }

      await this.saveDiscoveryData();
      console.log(
        `Discovered ${newFeatures.length} grounded feature ideas from GitHub (no name-only theater)`
      );
    } catch (error) {
      console.error('Error discovering features from GitHub:', error);
    }

    return newFeatures;
  }

  /**
   * Analyze a repository using real metadata (description/topics/language).
   * Does NOT invent features from the repo name alone.
   */
  private async analyzeRepository(repo: {
    url: string;
    name: string;
    stars: number;
    language?: string | null;
    description?: string | null;
    topics?: string[];
  }): Promise<RepositoryInsight | null> {
    try {
      // Check if already scanned recently (within 7 days)
      const existing = this.scannedRepositories.find(
        (r) => r.repositoryUrl === repo.url
      );
      if (
        existing &&
        Date.now() - existing.scannedAt < 7 * 24 * 60 * 60 * 1000
      ) {
        return existing;
      }

      const description = (repo.description || '').trim();
      const topics = repo.topics || [];
      const evidence: string[] = [];
      if (description) evidence.push(`desc: ${description.slice(0, 200)}`);
      if (topics.length) evidence.push(`topics: ${topics.join(', ')}`);
      if (repo.language) evidence.push(`lang: ${repo.language}`);
      if (repo.stars > 0) evidence.push(`stars: ${repo.stars}`);

      // Without description/topics we refuse to invent features from the name
      if (!description && topics.length === 0) {
        console.log(
          `[FeatureDiscovery] Skip ${repo.name}: no description/topics (would be name-only theater)`
        );
        return null;
      }

      const insight: RepositoryInsight = {
        repositoryUrl: repo.url,
        repositoryName: repo.name,
        stars: repo.stars,
        language: repo.language || 'Unknown',
        description,
        topics,
        features: this.detectThemesFromEvidence(repo.name, description, topics),
        interestingPatterns: [],
        scannedAt: Date.now(),
        evidence,
      };

      return insight;
    } catch (error) {
      console.error(`Error analyzing repository ${repo.url}:`, error);
      return null;
    }
  }

  /**
   * Themes grounded in description/topics — at most a few, never a canned feature pack.
   */
  private detectThemesFromEvidence(
    name: string,
    description: string,
    topics: string[]
  ): string[] {
    const blob = `${name} ${description} ${topics.join(' ')}`.toLowerCase();
    const themes: string[] = [];

    const checks: Array<[RegExp, string]> = [
      [/\bvoice\b|\bspeech\b|\btts\b|\bstt\b/, 'voice interaction'],
      [/\bmemory\b|\brag\b|\bembed/, 'long-term memory / RAG'],
      [/\bcalendar\b|\bschedule\b/, 'calendar / scheduling'],
      [/\boauth\b|\bauth\b|\bsso\b/, 'authentication'],
      [/\breal-?time\b|\bwebsocket\b/, 'realtime updates'],
      [/\bagent\b|\bmulti-?agent\b/, 'agent orchestration'],
      [/\blocal\b|\boffline\b|\bollama\b/, 'local / offline models'],
    ];

    for (const [re, theme] of checks) {
      if (re.test(blob)) themes.push(theme);
    }

    // Cap — discovery is inspiration, not a shopping list
    return themes.slice(0, 2);
  }

  /**
   * Extract feature suggestions from repository insight (honest, non-actionable by default)
   */
  private extractFeaturesFromInsight(
    insight: RepositoryInsight
  ): DiscoveredFeature[] {
    const features: DiscoveredFeature[] = [];
    const evidence = (insight.evidence || []).join(' · ') || insight.description || '';

    // One grounded inspiration card per repo (not 5 fake product features)
    if (!insight.description && !(insight.topics && insight.topics.length)) {
      return [];
    }

    const themeBit =
      insight.features.length > 0
        ? ` Themes noted: ${insight.features.join(', ')}.`
        : '';
    const name = `Study ${insight.repositoryName}`;
    const popularity = Math.min(
      10,
      Math.floor(Math.log10(insight.stars + 1) * 2)
    );
    const relevance = this.calculateRelevance(
      insight.features[0] || insight.repositoryName,
      insight
    );

    features.push({
      id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: `${insight.repositoryName} (${insight.stars}★, ${insight.language}): ${
        insight.description || 'no description'
      }.${themeBit} Review only — not an auto-implement ticket.`,
      source: 'github',
      sourceUrl: insight.repositoryUrl,
      repositoryExample: insight.repositoryName,
      popularity,
      relevance,
      implementationComplexity: 'high',
      estimatedValue: Math.min(6, Math.floor((relevance + popularity) / 3)),
      discoveredAt: Date.now(),
      status: 'discovered',
      tags: ['inspiration', 'github', ...this.extractTags(insight.repositoryName)],
      evidence: evidence.slice(0, 400),
      // GitHub inspiration is NOT auto-sandboxable
      actionable: false,
    });

    return features;
  }

  /**
   * Calculate relevance of a feature to the current project
   */
  private calculateRelevance(
    featureName: string,
    insight: RepositoryInsight
  ): number {
    let relevance = 5; // Base relevance

    // Increase relevance for TypeScript projects
    if (
      insight.language === 'TypeScript' ||
      insight.language === 'JavaScript'
    ) {
      relevance += 2;
    }

    // Increase relevance for AI-related features
    if (
      featureName.toLowerCase().includes('ai') ||
      featureName.toLowerCase().includes('ml') ||
      featureName.toLowerCase().includes('nlp')
    ) {
      relevance += 2;
    }

    // Increase relevance for user experience features
    if (
      featureName.toLowerCase().includes('ux') ||
      featureName.toLowerCase().includes('ui') ||
      featureName.toLowerCase().includes('user')
    ) {
      relevance += 1;
    }

    return Math.min(10, relevance);
  }

  /**
   * Estimate implementation complexity
   */
  private estimateComplexity(featureName: string): 'low' | 'medium' | 'high' {
    const name = featureName.toLowerCase();

    if (
      name.includes('dashboard') ||
      name.includes('analytics') ||
      name.includes('ml')
    ) {
      return 'high';
    }

    if (
      name.includes('integration') ||
      name.includes('oauth') ||
      name.includes('websocket')
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract tags from feature name
   */
  private extractTags(featureName: string): string[] {
    const tags: string[] = [];
    const name = featureName.toLowerCase();

    const tagMappings = {
      ai: 'ai',
      voice: 'voice',
      chat: 'chat',
      analytics: 'analytics',
      mobile: 'mobile',
      'real-time': 'realtime',
      authentication: 'auth',
      dashboard: 'dashboard',
      notification: 'notifications',
      calendar: 'productivity',
    };

    for (const [keyword, tag] of Object.entries(tagMappings)) {
      if (name.includes(keyword)) {
        tags.push(tag);
      }
    }

    return tags.slice(0, 3);
  }

  /**
   * Discover features based on user interaction patterns
   */
  async discoverFromUserPatterns(
    patterns: any[]
  ): Promise<DiscoveredFeature[]> {
    const newFeatures: DiscoveredFeature[] = [];

    // Analyze what users are trying to do frequently
    const frequentActions = patterns
      .filter((p) => p.usageCount > 10)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    for (const pattern of frequentActions) {
      // If success rate is low, suggest improvements
      if (pattern.successRate < 0.8) {
        newFeatures.push({
          id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `Improve ${pattern.feature} Reliability`,
          description: `Enhance ${pattern.feature} to increase success rate from ${(pattern.successRate * 100).toFixed(1)}% to 95%+`,
          source: 'user_pattern',
          popularity: Math.floor(pattern.usageCount / 10),
          relevance: 10,
          implementationComplexity: 'medium',
          estimatedValue: 9,
          discoveredAt: Date.now(),
          status: 'discovered',
          tags: ['improvement', 'user-driven', 'actionable'],
          evidence: `usageCount=${pattern.usageCount} successRate=${pattern.successRate}`,
          actionable: true,
        });
      }

      // If response time is slow, suggest optimization
      if (pattern.averageDuration > 3000) {
        newFeatures.push({
          id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `Optimize ${pattern.feature} Performance`,
          description: `Speed up ${pattern.feature} from ${(pattern.averageDuration / 1000).toFixed(1)}s to under 2s`,
          source: 'user_pattern',
          popularity: Math.floor(pattern.usageCount / 10),
          relevance: 9,
          implementationComplexity: 'medium',
          estimatedValue: 8,
          discoveredAt: Date.now(),
          status: 'discovered',
          tags: ['performance', 'user-driven', 'actionable'],
          evidence: `usageCount=${pattern.usageCount} avgMs=${pattern.averageDuration}`,
          actionable: true,
        });
      }
    }

    // Add new features
    for (const feature of newFeatures) {
      const existing = this.discoveredFeatures.find(
        (f) => f.name === feature.name
      );
      if (!existing) {
        this.discoveredFeatures.push(feature);
      }
    }

    await this.saveDiscoveryData();
    return newFeatures;
  }

  /**
   * Discover features from web search results
   */
  async discoverFromWeb(
    searchTerms: string[] = ['AI assistant features', 'chatbot capabilities']
  ): Promise<DiscoveredFeature[]> {
    const newFeatures: DiscoveredFeature[] = [];

    try {
      const { performWebSearch } = await import('./searchService');

      for (const term of searchTerms) {
        const searchResponse = await performWebSearch(term);

        if (searchResponse && searchResponse.results) {
          for (const result of searchResponse.results.slice(0, 5)) {
            // Extract features from web search results
            const feature: DiscoveredFeature = {
              id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: this.extractFeatureNameFromText(result.title),
              description: result.description || result.title,
              source: 'web',
              sourceUrl: result.url,
              popularity: 5, // Base popularity for web sources
              relevance: this.calculateWebResultRelevance(
                result.title,
                result.description || ''
              ),
              implementationComplexity: 'medium',
              estimatedValue: 6,
              discoveredAt: Date.now(),
              status: 'discovered',
              tags: this.extractTagsFromText(
                result.title + ' ' + (result.description || '')
              ),
            };

            const existing = this.discoveredFeatures.find(
              (f) =>
                f.name.toLowerCase() === feature.name.toLowerCase() &&
                f.source === feature.source
            );

            if (!existing) {
              this.discoveredFeatures.push(feature);
              newFeatures.push(feature);
            }
          }
        }
      }

      await this.saveDiscoveryData();
      console.log(`Discovered ${newFeatures.length} features from web search`);
    } catch (error) {
      console.error('Error discovering features from web:', error);
    }

    return newFeatures;
  }

  /**
   * Discover features from YouTube videos
   */
  async discoverFromYouTube(
    searchTerms: string[] = ['AI assistant tutorial', 'chatbot features']
  ): Promise<DiscoveredFeature[]> {
    const newFeatures: DiscoveredFeature[] = [];

    try {
      const { searchVideos } = await import('./googleYoutubeService');

      for (const term of searchTerms) {
        const result = await searchVideos(undefined, term, 5);

        if (result.success && result.data) {
          for (const video of result.data as YouTubeVideo[]) {
            // Extract features from YouTube video titles and descriptions
            const feature: DiscoveredFeature = {
              id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: this.extractFeatureNameFromText(
                video.snippet?.title || video.title || 'Unknown Video'
              ),
              description: `Feature inspired by YouTube video: ${video.snippet?.title || video.title}`,
              source: 'youtube',
              sourceUrl: `https://youtube.com/watch?v=${video.id?.videoId || video.videoId}`,
              popularity: 5, // Default if views not available in search snippet
              relevance: this.calculateYouTubeRelevance(
                video.snippet?.title || '',
                video.snippet?.description || ''
              ),
              implementationComplexity: 'medium',
              estimatedValue: 7,
              discoveredAt: Date.now(),
              status: 'discovered',
              tags: this.extractTagsFromText(
                (video.snippet?.title || '') +
                  ' ' +
                  (video.snippet?.description || '')
              ),
            };

            const existing = this.discoveredFeatures.find(
              (f) =>
                f.name.toLowerCase() === feature.name.toLowerCase() &&
                f.source === feature.source
            );

            if (!existing) {
              this.discoveredFeatures.push(feature);
              newFeatures.push(feature);
            }
          }
        }
      }

      await this.saveDiscoveryData();
      console.log(`Discovered ${newFeatures.length} features from YouTube`);
    } catch (error) {
      console.error('Error discovering features from YouTube:', error);
    }

    return newFeatures;
  }

  /**
   * Extract feature name from text
   */
  private extractFeatureNameFromText(text: string): string {
    // Remove common words and extract meaningful feature name
    const cleaned = text
      .replace(/how to|tutorial|guide|top \d+|best|ultimate/gi, '')
      .trim();

    // Look for feature keywords
    const featureKeywords = [
      'voice',
      'speech',
      'chat',
      'message',
      'notification',
      'search',
      'analytics',
      'dashboard',
      'integration',
      'authentication',
      'calendar',
      'reminder',
      'task',
      'note',
      'export',
      'import',
      'sync',
      'backup',
    ];

    for (const keyword of featureKeywords) {
      if (cleaned.toLowerCase().includes(keyword)) {
        return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Feature Enhancement`;
      }
    }

    // Default: use first 50 characters
    return cleaned.substring(0, 50).trim() || 'New Feature Suggestion';
  }

  /**
   * Calculate relevance for web search results
   */
  private calculateWebResultRelevance(title: string, snippet: string): number {
    let relevance = 5;
    const text = (title + ' ' + snippet).toLowerCase();

    if (text.includes('ai') || text.includes('assistant')) relevance += 2;
    if (text.includes('typescript') || text.includes('react')) relevance += 1;
    if (text.includes('chat') || text.includes('conversation')) relevance += 1;
    if (text.includes('feature') || text.includes('capability')) relevance += 1;

    return Math.min(10, relevance);
  }

  /**
   * Calculate relevance for YouTube videos
   */
  private calculateYouTubeRelevance(
    title: string,
    description: string
  ): number {
    let relevance = 5;
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('ai') || text.includes('assistant')) relevance += 2;
    if (text.includes('tutorial') || text.includes('implementation'))
      relevance += 1;
    if (text.includes('typescript') || text.includes('react')) relevance += 1;
    if (text.includes('chat') || text.includes('bot')) relevance += 1;

    return Math.min(10, relevance);
  }

  /**
   * Extract tags from text
   */
  private extractTagsFromText(text: string): string[] {
    const tags: string[] = [];
    const textLower = text.toLowerCase();

    const tagMappings: Record<string, string> = {
      ai: 'ai',
      voice: 'voice',
      chat: 'chat',
      analytics: 'analytics',
      mobile: 'mobile',
      'real-time': 'realtime',
      auth: 'auth',
      dashboard: 'dashboard',
      notification: 'notifications',
      calendar: 'productivity',
      integration: 'integration',
      performance: 'performance',
    };

    for (const [keyword, tag] of Object.entries(tagMappings)) {
      if (textLower.includes(keyword)) {
        tags.push(tag);
      }
    }

    return tags.slice(0, 3);
  }

  /**
   * Get all discovered features
   */
  getDiscoveredFeatures(filters?: {
    status?: DiscoveredFeature['status'];
    source?: DiscoveredFeature['source'];
    minRelevance?: number;
    tags?: string[];
  }): DiscoveredFeature[] {
    let features = [...this.discoveredFeatures];

    if (filters) {
      if (filters.status) {
        features = features.filter((f) => f.status === filters.status);
      }
      if (filters.source) {
        features = features.filter((f) => f.source === filters.source);
      }
      if (filters.minRelevance) {
        features = features.filter(
          (f) => f.relevance >= (filters.minRelevance || 0)
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        features = features.filter((f) =>
          filters.tags!.some((tag) => f.tags.includes(tag))
        );
      }
    }

    return features.sort(
      (a, b) =>
        b.relevance * b.popularity * b.estimatedValue -
        a.relevance * a.popularity * a.estimatedValue
    );
  }

  /**
   * Get top feature recommendations
   * By default only **actionable** items (user-pattern / explicit).
   * GitHub inspiration stays discoverable via getDiscoveredFeatures but won't auto-promote.
   */
  getTopRecommendations(
    limit: number = 10,
    opts?: { actionableOnly?: boolean }
  ): DiscoveredFeature[] {
    const actionableOnly = opts?.actionableOnly !== false;
    let list = this.getDiscoveredFeatures({ status: 'discovered' });
    if (actionableOnly) {
      list = list.filter(
        (f) =>
          f.actionable === true ||
          f.source === 'user_pattern' ||
          (f.tags || []).includes('actionable')
      );
    }
    // Reject classic name-farm theater leftovers
    list = list.filter(
      (f) =>
        !/^Feature inspired by /i.test(f.description || '') &&
        !/^Real-time Chat$|^Message History$|^Chat Analytics$/i.test(f.name)
    );
    return list.slice(0, limit);
  }

  /**
   * Reject / purge non-actionable theater from the store
   */
  async purgeTheaterFeatures(): Promise<{ removed: number; kept: number }> {
    const before = this.discoveredFeatures.length;
    this.discoveredFeatures = this.discoveredFeatures.filter((f) => {
      if (/^Feature inspired by /i.test(f.description || '')) return false;
      if (
        /^(Real-time Chat|Message History|Chat Analytics|Voice Commands|Speech Recognition)$/i.test(
          f.name
        ) &&
        f.source === 'github'
      ) {
        return false;
      }
      return true;
    });
    await this.saveDiscoveryData();
    return {
      removed: before - this.discoveredFeatures.length,
      kept: this.discoveredFeatures.length,
    };
  }

  /**
   * Update feature status
   */
  async updateFeatureStatus(
    featureId: string,
    status: DiscoveredFeature['status']
  ): Promise<boolean> {
    const feature = this.discoveredFeatures.find((f) => f.id === featureId);
    if (feature) {
      feature.status = status;
      await this.saveDiscoveryData();
      return true;
    }
    return false;
  }

  /**
   * Get discovery statistics
   */
  getDiscoveryStatistics() {
    const features = this.discoveredFeatures;

    return {
      totalDiscovered: features.length,
      bySource: {
        github: features.filter((f) => f.source === 'github').length,
        web: features.filter((f) => f.source === 'web').length,
        youtube: features.filter((f) => f.source === 'youtube').length,
        userPattern: features.filter((f) => f.source === 'user_pattern').length,
      },
      byStatus: {
        discovered: features.filter((f) => f.status === 'discovered').length,
        analyzed: features.filter((f) => f.status === 'analyzed').length,
        planned: features.filter((f) => f.status === 'planned').length,
        inSandbox: features.filter((f) => f.status === 'in_sandbox').length,
        implemented: features.filter((f) => f.status === 'implemented').length,
        rejected: features.filter((f) => f.status === 'rejected').length,
      },
      byComplexity: {
        low: features.filter((f) => f.implementationComplexity === 'low')
          .length,
        medium: features.filter((f) => f.implementationComplexity === 'medium')
          .length,
        high: features.filter((f) => f.implementationComplexity === 'high')
          .length,
      },
      repositoriesScanned: this.scannedRepositories.length,
      averageRelevance:
        features.reduce((sum, f) => sum + f.relevance, 0) / features.length ||
        0,
      highValueFeatures: features.filter((f) => f.estimatedValue >= 8).length,
    };
  }

  /**
   * Load discovery data from file
   */
  private async loadDiscoveryData(): Promise<void> {
    try {
      const data = await fs.readFile(this.DISCOVERY_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.discoveredFeatures = parsed.features || [];
      this.scannedRepositories = parsed.repositories || [];
    } catch (error) {
      console.log('No existing discovery data found, starting fresh');
    }
  }

  /**
   * Save discovery data to file
   */
  private async saveDiscoveryData(): Promise<void> {
    try {
      const data = {
        features: this.discoveredFeatures,
        repositories: this.scannedRepositories,
        lastUpdated: Date.now(),
      };
      await fs.writeFile(this.DISCOVERY_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving discovery data:', error);
    }
  }
}

// Singleton instance
const discoveryService = new FeatureDiscoveryService();

export async function initializeFeatureDiscovery(): Promise<void> {
  await discoveryService.initialize();
}

export function discoverFromGitHub(
  limit?: number
): Promise<DiscoveredFeature[]> {
  return discoveryService.discoverFromGitHub(limit);
}

export function discoverFromUserPatterns(
  patterns: any[]
): Promise<DiscoveredFeature[]> {
  return discoveryService.discoverFromUserPatterns(patterns);
}

export function discoverFromWeb(
  searchTerms?: string[]
): Promise<DiscoveredFeature[]> {
  return discoveryService.discoverFromWeb(searchTerms);
}

export function discoverFromYouTube(
  searchTerms?: string[]
): Promise<DiscoveredFeature[]> {
  return discoveryService.discoverFromYouTube(searchTerms);
}

export function getDiscoveredFeatures(filters?: {
  status?: DiscoveredFeature['status'];
  source?: DiscoveredFeature['source'];
  minRelevance?: number;
  tags?: string[];
}): DiscoveredFeature[] {
  return discoveryService.getDiscoveredFeatures(filters);
}

export function getTopFeatureRecommendations(
  limit?: number,
  opts?: { actionableOnly?: boolean }
): DiscoveredFeature[] {
  return discoveryService.getTopRecommendations(limit, opts);
}

export function updateFeatureStatus(
  featureId: string,
  status: DiscoveredFeature['status']
): Promise<boolean> {
  return discoveryService.updateFeatureStatus(featureId, status);
}

export function getDiscoveryStatistics() {
  return discoveryService.getDiscoveryStatistics();
}

export function purgeTheaterFeatures(): Promise<{
  removed: number;
  kept: number;
}> {
  return discoveryService.purgeTheaterFeatures();
}

/** True only if feature is safe to auto-sandbox / auto-implement */
export function isFeatureActionable(feature: DiscoveredFeature): boolean {
  if (feature.actionable === false) return false;
  if (feature.actionable === true) return true;
  if (feature.source === 'user_pattern') return true;
  if ((feature.tags || []).includes('actionable')) return true;
  if (/^Feature inspired by /i.test(feature.description || '')) return false;
  if ((feature.tags || []).includes('inspiration')) return false;
  return false;
}
