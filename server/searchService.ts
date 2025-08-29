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

export async function performWebSearch(query: string): Promise<SearchResponse | null> {
  const API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!API_KEY) {
    throw new Error("Perplexity API key not found");
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful search assistant. Provide accurate, current information and include relevant sources."
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      const citations = data.citations || [];
      
      // Create mock results from citations for consistency
      const results: SearchResult[] = citations.slice(0, 3).map((citation: string, index: number) => ({
        title: `Search Result ${index + 1}`,
        url: citation,
        description: "Source from Perplexity search"
      }));

      return {
        query,
        results,
        summary: content
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

// Removed createSearchSummary function as Perplexity provides direct AI-generated summaries

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