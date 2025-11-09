import { generateOpenRouterResponse } from './openrouterService';

export interface ParsedCommand {
  service:
    | 'calendar'
    | 'gmail'
    | 'youtube'
    | 'tasks'
    | 'drive'
    | 'photos'
    | 'maps'
    | 'unknown';
  action:
    | 'list'
    | 'add'
    | 'delete'
    | 'send'
    | 'check'
    | 'get'
    | 'play'
    | 'complete'
    | 'search'
    | 'summarize'
    | 'create_album'
    | 'directions'
    | 'find_place'
    | 'get_video_details'
    | 'get_channel_details'
    | 'get_trending_videos'
    | 'unknown';
  entities: { [key: string]: string };
}

/**
 * Pre-process message to detect common patterns and improve intent understanding
 */
function preprocessIntent(message: string): Partial<ParsedCommand> | null {
  const lower = message.toLowerCase();

  // YouTube video requests - very flexible matching
  const youtubePatterns = [
    /(?:play|watch|show|find|put on|queue up|i (?:want|wanna|need) (?:to )?(?:watch|see|hear)|search for|look up|display)\s+(?:some\s+)?(?:me\s+)?(.+?)(?:\s+(?:video|videos|on youtube|music|song|songs))?$/i,
    /(?:can you|could you|would you)\s+(?:play|show|find|put on)\s+(.+?)(?:\s+(?:for me|please))?$/i,
  ];

  for (const pattern of youtubePatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      // Extract clean query
      let query = match[1].trim();
      // Remove common filler words
      query = query
        .replace(
          /(?:some|a|the|for me|please|videos?|on youtube|music|song|songs)\s*/gi,
          ''
        )
        .trim();

      if (query.length > 0) {
        return {
          service: 'youtube',
          action: 'get',
          entities: { query, sortBy: 'relevance' },
        };
      }
    }
  }

  // Calendar patterns
  if (
    /(what'?s|show|list|check)\s+(?:on\s+)?(?:my\s+)?(?:calendar|schedule|events?)/i.test(
      lower
    )
  ) {
    return { service: 'calendar', action: 'list', entities: {} };
  }

  // Email patterns
  if (
    /(check|show|list|read|see)\s+(?:my\s+)?(?:email|inbox|mail)/i.test(lower)
  ) {
    return { service: 'gmail', action: 'list', entities: {} };
  }

  return null;
}

export async function parseCommandLLM(message: string): Promise<ParsedCommand> {
  console.log('--- PARSE COMMAND LLM CALLED ---');
  console.log('User message:', message);

  // Try quick pattern matching first for common requests
  const quickMatch = preprocessIntent(message);
  if (quickMatch && quickMatch.service !== 'unknown') {
    console.log('Quick pattern match successful:', quickMatch);
    return {
      service: (quickMatch.service as any) || 'unknown',
      action: (quickMatch.action as any) || 'unknown',
      entities: quickMatch.entities || {},
    };
  }

  const prompt = `
    You are an advanced intent parser for Milla, understanding natural conversational language and extracting structured commands.

    IMPORTANT: Be extremely flexible with language variations. Users don't speak in exact templates - they use natural, casual language.

    Services: "calendar", "gmail", "youtube", "tasks", "drive", "photos", "maps"
    
    Actions by service:
    - calendar: list, add, delete
    - gmail: list, send, check
    - youtube: list, get (search and play), play, get_video_details, get_channel_details, get_trending_videos
    - tasks: list, add, complete, delete
    - drive: search, summarize
    - photos: list, create_album
    - maps: directions, find_place

    NATURAL LANGUAGE EXAMPLES:
    - "play some music" → youtube/get with query "music"
    - "show me funny videos" → youtube/get with query "funny videos"
    - "I want to watch cooking videos" → youtube/get with query "cooking"
    - "find videos about space" → youtube/get with query "space"
    - "put on some jazz" → youtube/get with query "jazz"
    - "what's on my calendar" → calendar/list
    - "check my email" → gmail/list
    - "add event tomorrow at 3pm" → calendar/add with entities

    For YouTube:
    - ANY request to play, watch, show, find, put on, or see videos → action: "get"
    - Extract the search query from context (what they want to watch/see/find)
    - sortBy: "viewCount" for "popular"/"most viewed", "date" for "recent"/"latest", "relevance" for most searches

    User message: "${message}"

    Respond with JSON:
    {
      "service": "...",
      "action": "...",
      "entities": {
        "query": "extracted search terms",
        "sortBy": "relevance|viewCount|date"
      }
    }

    Be intelligent about extracting intent from casual conversation. If unclear, use "unknown".
  `;

  console.log('LLM Parser Prompt:', prompt);

  const aiResponse = await generateOpenRouterResponse(prompt, {});

  console.log('LLM Parser Response:', aiResponse.content);

  if (aiResponse.success) {
    try {
      let content = aiResponse.content;
      // First, try to find a JSON code block
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        content = codeBlockMatch[1];
      } else {
        // If no code block, find the first '{' and last '}'
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          content = content.substring(firstBrace, lastBrace + 1);
        }
      }

      const parsedResponse = JSON.parse(content);

      return {
        service: parsedResponse.service || 'unknown',
        action: parsedResponse.action || 'unknown',
        entities: parsedResponse.entities || {},
      };
    } catch (error) {
      console.error(
        'Error parsing LLM JSON response. The response was not valid JSON.',
        error
      );
      console.error('Original content from LLM:', aiResponse.content);
    }
  }

  return {
    service: 'unknown',
    action: 'unknown',
    entities: {},
  };
}
