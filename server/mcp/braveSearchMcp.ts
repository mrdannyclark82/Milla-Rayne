/**
 * Brave Search MCP Service
 * Web search through Brave Search API
 */

import { config } from '../config.js';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  publishedDate?: string;
}

export class BraveSearchMCPService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.search.brave.com/res/v1';

  constructor() {
    this.apiKey = config.mcp?.braveSearch?.apiKey;
  }

  /**
   * Check if Brave Search is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Web search
   */
  async webSearch(query: string, limit = 10): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/web/search?q=${encodeURIComponent(query)}&count=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      publishedDate: result.age,
    }));
  }

  /**
   * News search
   */
  async newsSearch(query: string, limit = 10): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/news/search?q=${encodeURIComponent(query)}&count=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return (data.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      publishedDate: result.age,
    }));
  }

  /**
   * Image search
   */
  async imageSearch(query: string, limit = 10): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/images/search?q=${encodeURIComponent(query)}&count=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results || [];
  }

  /**
   * Suggest queries (autocomplete)
   */
  async suggest(query: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Brave Search API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/suggest?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data[1] || [];
  }
}

let braveSearchService: BraveSearchMCPService | null = null;

export function getBraveSearchMCPService(): BraveSearchMCPService {
  if (!braveSearchService) {
    braveSearchService = new BraveSearchMCPService();
  }
  return braveSearchService;
}
