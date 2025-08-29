import { search } from "duck-duck-scrape";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  summary: string;
}

// Simple rate limiting to prevent DuckDuckGo from blocking requests
let lastSearchTime = 0;
const SEARCH_DELAY = 2000; // 2 seconds between searches

export async function performWebSearch(query: string): Promise<SearchResponse | null> {
  try {
    // Rate limiting: ensure at least 2 seconds between searches
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;
    if (timeSinceLastSearch < SEARCH_DELAY) {
      await new Promise(resolve => setTimeout(resolve, SEARCH_DELAY - timeSinceLastSearch));
    }
    lastSearchTime = Date.now();

    // Use DuckDuckGo search with safe search disabled
    const searchResults = await search(query, {
      safeSearch: 0 as any, // DuckDuckGo library expects 0 for off
      region: "us-en",
      count: 3
    });

    if (!searchResults.results || searchResults.results.length === 0) {
      return null;
    }

    // Extract top 3 results
    const results: SearchResult[] = searchResults.results.slice(0, 3).map((result: any) => ({
      title: result.title || "No title",
      url: result.url || "",
      description: result.description || "No description available"
    }));

    // Create a summary of the results
    const summary = createSearchSummary(query, results);

    return {
      query,
      results,
      summary
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

function createSearchSummary(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return `I couldn't find any relevant information about "${query}". You might want to try rephrasing your question or being more specific.`;
  }

  let summary = `Here's what I found about "${query}":\n\n`;

  results.forEach((result, index) => {
    summary += `**${index + 1}. ${result.title}**\n`;
    summary += `${result.description}\n`;
    summary += `🔗 [Read more](${result.url})\n\n`;
  });

  summary += `These results should help answer your question. If you need more specific information, feel free to ask me to search for something more targeted!`;

  return summary;
}

export function shouldPerformSearch(userMessage: string): boolean {
  const message = userMessage.toLowerCase();
  
  // Don't search for weather, image generation, or other specific commands
  if (message.includes("weather") || 
      message.includes("create an image") || 
      message.includes("draw a picture") ||
      message.includes("generate an image")) {
    return false;
  }

  // Search for questions and information requests
  const searchTriggers = [
    "what is", "what are", "who is", "who are", "where is", "where are",
    "when is", "when are", "how is", "how are", "why is", "why are",
    "tell me about", "explain", "define", "meaning of", "information about",
    "search for", "look up", "find information", "what do you know about",
    "can you find", "help me find", "i need to know", "do you know"
  ];

  return searchTriggers.some(trigger => message.includes(trigger));
}