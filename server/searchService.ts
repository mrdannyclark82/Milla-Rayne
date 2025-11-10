import { LRUCache } from 'lru-cache';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}
import { queryWolframAlpha } from './wolframAlphaService';
import {
  getRealWorldInfo,
  enhanceSearchWithRealWorldInfo,
} from './realWorldInfoService';

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  summary: string;
}

// Cache for search results with 15-minute TTL
const searchCache = new LRUCache<string, SearchResponse>({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15 minutes
});

export async function performWebSearch(
  query: string
): Promise<SearchResponse | null> {
  // Normalize query for better cache hits
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check cache first
  const cached = searchCache.get(normalizedQuery);
  if (cached) {
    console.log(`Search cache hit for: "${query}"`);
    return cached;
  }

  console.log(`Search cache miss for: "${query}"`);

  // Try real-world information first for current/contextual queries
  const realWorldQuery = normalizedQuery;
  if (
    realWorldQuery.includes('current') ||
    realWorldQuery.includes('today') ||
    realWorldQuery.includes('news') ||
    realWorldQuery.includes('weather') ||
    realWorldQuery.includes('time') ||
    realWorldQuery.includes('date')
  ) {
    const realWorldResponse = await getRealWorldInfo(query);
    if (realWorldResponse.results.length > 0) {
      searchCache.set(normalizedQuery, realWorldResponse);
      return realWorldResponse;
    }
  }

  // Try Wolfram Alpha first for factual/computational queries
  const WOLFRAM_APPID = process.env.WOLFRAM_ALPHA_APPID;
  if (WOLFRAM_APPID) {
    const wolframResult = await queryWolframAlpha(query, WOLFRAM_APPID);
    if (wolframResult) {
      const baseResponse = {
        query,
        results: [
          {
            title: 'Wolfram Alpha Result',
            url: `https://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`,
            description: wolframResult,
          },
        ],
        summary: wolframResult,
      };

      // Enhance with real-world info
      const enhancedResponse = await enhanceSearchWithRealWorldInfo(baseResponse);
      searchCache.set(normalizedQuery, enhancedResponse);
      return enhancedResponse;
    }
  }

  // Fallback to Perplexity
  const API_KEY = process.env.PERPLEXITY_API_KEY;
  if (API_KEY) {
    try {
      console.log('Making Perplexity API request...');
      const response = await fetch(
        'https://api.perplexity.ai/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'Be precise and concise.',
              },
              {
                role: 'user',
                content: query,
              },
            ],
            max_tokens: 500,
            temperature: 0.2,
            top_p: 0.9,
            return_images: false,
            return_related_questions: false,
            search_recency_filter: 'month',
            stream: false,
            presence_penalty: 0,
            frequency_penalty: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, errorText);
        console.log('Falling back to knowledge-based search');
        return generateKnowledgeBasedResponse(query);
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const citations = data.citations || [];

        // Create results from citations for consistency
        const results: SearchResult[] = citations
          .slice(0, 3)
          .map((citation: string, index: number) => ({
            title: `Source ${index + 1}`,
            url: citation,
            description: 'Information source from Perplexity search',
          }));

        const response = {
          query,
          results,
          summary: content,
        };
        
        searchCache.set(normalizedQuery, response);
        return response;
      } else {
        console.log(
          'No results from Perplexity, falling back to knowledge base'
        );
        const fallbackResponse = generateKnowledgeBasedResponse(query);
        const enhancedResponse = await enhanceSearchWithRealWorldInfo(fallbackResponse);
        searchCache.set(normalizedQuery, enhancedResponse);
        return enhancedResponse;
      }
    } catch (error) {
      console.error('Search error:', error);
      console.log('Falling back to knowledge-based search');
      const fallbackResponse = generateKnowledgeBasedResponse(query);
      const enhancedResponse = await enhanceSearchWithRealWorldInfo(fallbackResponse);
      searchCache.set(normalizedQuery, enhancedResponse);
      return enhancedResponse;
    }
  }

  // Fallback to knowledge base
  console.warn('No search API keys found, using knowledge base fallback');
  const fallbackResponse = generateKnowledgeBasedResponse(query);
  const enhancedResponse = await enhanceSearchWithRealWorldInfo(fallbackResponse);
  searchCache.set(normalizedQuery, enhancedResponse);
  return enhancedResponse;
}

function generateKnowledgeBasedResponse(query: string): SearchResponse {
  const normalizedQuery = query.toLowerCase();

  // Common knowledge responses
  const knowledgeBase: { [key: string]: string } = {
    'quantum computing':
      'Quantum computing is a revolutionary computing paradigm that uses quantum mechanical phenomena like superposition and entanglement to process information. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits (qubits) that can exist in multiple states simultaneously. This allows quantum computers to potentially solve certain complex problems exponentially faster than classical computers, particularly in areas like cryptography, optimization, and scientific simulation.',

    'artificial intelligence':
      'Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, perception, and decision-making. Modern AI includes machine learning, deep learning, and neural networks. AI is used in various applications including virtual assistants, autonomous vehicles, medical diagnosis, and content recommendation systems.',

    'machine learning':
      'Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions or decisions. Common types include supervised learning, unsupervised learning, and reinforcement learning.',

    blockchain:
      "Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) that are linked and secured using cryptography. It's the underlying technology behind cryptocurrencies like Bitcoin and has applications in supply chain management, digital identity, and smart contracts.",

    'climate change':
      'Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, scientific evidence shows that human activities, particularly greenhouse gas emissions from burning fossil fuels, are the primary driver of climate change since the 1800s.',

    'current events':
      'For the most current events and news, I recommend checking reliable news sources like BBC, Reuters, AP News, or NPR. These sources provide up-to-date information on global and local events, politics, economics, and social issues.',

    weather:
      'Weather information varies by location and changes frequently. For current weather conditions and forecasts, check local weather services, weather.com, or your local meteorological service.',

    cryptocurrency:
      'Cryptocurrency is a digital or virtual currency secured by cryptography. Bitcoin, Ethereum, and other cryptocurrencies use blockchain technology for decentralized transactions. The market is highly volatile and regulatory frameworks are still evolving globally.',

    'space exploration':
      'Space exploration involves the investigation of outer space through manned and unmanned spacecraft. Recent developments include Mars rovers, the James Webb Space Telescope, commercial spaceflight companies like SpaceX, and international cooperation through the International Space Station.',

    'renewable energy':
      'Renewable energy comes from natural sources that replenish themselves, including solar, wind, hydroelectric, geothermal, and biomass energy. These technologies are increasingly important for reducing carbon emissions and achieving energy independence.',
  };

  // Check for direct matches
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (normalizedQuery.includes(key)) {
      return {
        query,
        results: [
          {
            title: `Understanding ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            url: `https://wikipedia.org/wiki/${key.replace(' ', '_')}`,
            description: 'Comprehensive information from knowledge base',
          },
          {
            title: `Latest Research on ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            url: `https://scholar.google.com/search?q=${encodeURIComponent(key)}`,
            description: 'Academic research and papers',
          },
          {
            title: `News and Updates about ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            url: `https://news.google.com/search?q=${encodeURIComponent(key)}`,
            description: 'Latest news and developments',
          },
        ],
        summary: value,
      };
    }
  }

  // General response for unknown queries
  return {
    query,
    results: [
      {
        title: `Search Results for "${query}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        description: 'General web search results',
      },
      {
        title: `Wikipedia: ${query}`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
        description: 'Encyclopedia information',
      },
      {
        title: `Academic Research: ${query}`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        description: 'Scholarly articles and research',
      },
    ],
    summary: `I found several resources related to "${query}". While I don't have specific real-time information about this topic, I can direct you to reliable sources where you can find current and comprehensive information. The links above will take you to search results on Google, Wikipedia, and Google Scholar where you can explore this topic in depth.`,
  };
}

// Removed createSearchSummary function as Perplexity provides direct AI-generated summaries

export function shouldPerformSearch(userMessage: string): boolean {
  const message = userMessage.toLowerCase().trim();

  // Don't search for weather, image generation, personal queries, or other specific commands
  if (
    message.includes('weather') ||
    message.includes('create an image') ||
    message.includes('draw a picture') ||
    message.includes('generate an image') ||
    // Don't search for personal name queries
    message.includes('what is my name') ||
    message.includes("what's my name") ||
    message.includes('my name is') ||
    // Don't search for identity queries about Milla
    message.includes('what is your name') ||
    message.includes('who are you') ||
    // Don't search for personal conversation patterns
    message.includes('how are you') ||
    message.includes('how do you feel') ||
    message.includes('what are you doing') ||
    message.includes("how's your day") ||
    message.includes('good morning') ||
    message.includes('good afternoon') ||
    message.includes('good evening') ||
    message.includes('hello') ||
    message.match(/\bhi\b/) ||
    message.includes('hey ') ||
    // Don't search for conversational responses
    message.includes('thank you') ||
    message.includes('thanks') ||
    message.includes('yes') ||
    message.includes('no') ||
    message.includes('okay') ||
    message.includes('ok') ||
    message.includes('sure') ||
    message.includes('great') ||
    message.includes('awesome') ||
    message.includes('cool') ||
    message.includes('nice') ||
    message.length < 10
  ) {
    // Very short messages are likely conversational
    return false;
  }

  // Only search for very explicit search requests - must be specific and deliberate
  const searchTriggers = [
    'search for',
    'look up',
    'find information about',
    'what do you know about',
    'can you search for',
    'help me find information about',
    'i need to know about',
    'research about',
    'find me information on',
  ];

  return searchTriggers.some((trigger) => message.includes(trigger));
}
