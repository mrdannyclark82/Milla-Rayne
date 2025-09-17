export interface SearchResult {
  title: string;
  url: string;
  description: string;
}
import { queryWolframAlpha } from "./wolframAlphaService";

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  summary: string;
}

export async function performWebSearch(query: string): Promise<SearchResponse | null> {
  // Try Wolfram Alpha first for factual/computational queries
  const WOLFRAM_APPID = process.env.WOLFRAM_ALPHA_APPID;
  if (WOLFRAM_APPID) {
    const wolframResult = await queryWolframAlpha(query, WOLFRAM_APPID);
    if (wolframResult) {
      return {
        query,
        results: [
          {
            title: "Wolfram Alpha Result",
            url: `https://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`,
            description: wolframResult
          }
        ],
        summary: wolframResult
      };
    }
  }

  // Fallback to Perplexity
  const API_KEY = process.env.PERPLEXITY_API_KEY;
  if (API_KEY) {
    try {
      console.log("Making Perplexity API request...");
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY.trim()}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "Be precise and concise."
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: "month",
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error:", response.status, errorText);
        console.log("Falling back to knowledge-based search");
        return generateKnowledgeBasedResponse(query);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const citations = data.citations || [];
        
        // Create results from citations for consistency
        const results: SearchResult[] = citations.slice(0, 3).map((citation: string, index: number) => ({
          title: `Source ${index + 1}`,
          url: citation,
          description: "Information source from Perplexity search"
        }));

        return {
          query,
          results,
          summary: content
        };
      } else {
        console.log("No results from Perplexity, falling back to knowledge base");
        return generateKnowledgeBasedResponse(query);
      }
    } catch (error) {
      console.error("Search error:", error);
      console.log("Falling back to knowledge-based search");
      return generateKnowledgeBasedResponse(query);
    }
  }

  // Fallback to knowledge base
  console.warn("No search API keys found, using knowledge base fallback");
  return generateKnowledgeBasedResponse(query);
}

function generateKnowledgeBasedResponse(query: string): SearchResponse {
  const normalizedQuery = query.toLowerCase();
  
  // Common knowledge responses
  const knowledgeBase: { [key: string]: string } = {
    "quantum computing": "Quantum computing is a revolutionary computing paradigm that uses quantum mechanical phenomena like superposition and entanglement to process information. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits (qubits) that can exist in multiple states simultaneously. This allows quantum computers to potentially solve certain complex problems exponentially faster than classical computers, particularly in areas like cryptography, optimization, and scientific simulation.",
    
    "artificial intelligence": "Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, perception, and decision-making. Modern AI includes machine learning, deep learning, and neural networks. AI is used in various applications including virtual assistants, autonomous vehicles, medical diagnosis, and content recommendation systems.",
    
    "machine learning": "Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions or decisions. Common types include supervised learning, unsupervised learning, and reinforcement learning.",
    
    "blockchain": "Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) that are linked and secured using cryptography. It's the underlying technology behind cryptocurrencies like Bitcoin and has applications in supply chain management, digital identity, and smart contracts.",
    
    "climate change": "Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, scientific evidence shows that human activities, particularly greenhouse gas emissions from burning fossil fuels, are the primary driver of climate change since the 1800s."
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
            description: "Comprehensive information from knowledge base"
          },
          {
            title: `Latest Research on ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            url: `https://scholar.google.com/search?q=${encodeURIComponent(key)}`,
            description: "Academic research and papers"
          },
          {
            title: `News and Updates about ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            url: `https://news.google.com/search?q=${encodeURIComponent(key)}`,
            description: "Latest news and developments"
          }
        ],
        summary: value
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
        description: "General web search results"
      },
      {
        title: `Wikipedia: ${query}`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
        description: "Encyclopedia information"
      },
      {
        title: `Academic Research: ${query}`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        description: "Scholarly articles and research"
      }
    ],
    summary: `I found several resources related to "${query}". While I don't have specific real-time information about this topic, I can direct you to reliable sources where you can find current and comprehensive information. The links above will take you to search results on Google, Wikipedia, and Google Scholar where you can explore this topic in depth.`
  };
}

// Removed createSearchSummary function as Perplexity provides direct AI-generated summaries

export function shouldPerformSearch(userMessage: string): boolean {
  const message = userMessage.toLowerCase();
  
  // Don't search for weather, image generation, personal queries, or other specific commands
  if (message.includes("weather") || 
      message.includes("create an image") || 
      message.includes("draw a picture") ||
      message.includes("generate an image") ||
      // Don't search for personal name queries
      message.includes("what is my name") ||
      message.includes("what's my name") ||
      message.includes("my name is") ||
      // Don't search for identity queries about Milla
      message.includes("what is your name") ||
      message.includes("who are you") ||
      // Don't search for personal conversation patterns
      message.includes("how are you") ||
      message.includes("how do you feel") ||
      message.includes("what are you doing") ||
      message.includes("how's your day") ||
      message.includes("good morning") ||
      message.includes("good afternoon") ||
      message.includes("good evening") ||
      message.includes("hello") ||
      message.match(/\bhi\b/) ||
      message.includes("hey ")) {
    return false;
  }

  // Search for questions and information requests - but be more specific
  const searchTriggers = [
    "what is the", "what are the", "who is the", "who are the", 
    "where is the", "where are the", "when is the", "when are the", 
    "why is the", "why are the",
    "tell me about", "explain", "define", "meaning of", "information about",
    "search for", "look up", "find information", "what do you know about",
    "can you find", "help me find", "i need to know about"
  ];

  return searchTriggers.some(trigger => message.includes(trigger));
}