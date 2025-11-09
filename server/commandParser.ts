import { parseCalendarCommand } from './gemini';

export interface ParsedCommand {
  service: 'calendar' | 'gmail' | 'youtube' | 'profile' | null;
  action:
    | 'list'
    | 'add'
    | 'delete'
    | 'send'
    | 'check'
    | 'get'
    | 'update'
    | null;
  entities: { [key: string]: string };
}

export async function parseCommand(message: string): Promise<ParsedCommand> {
  const lowerMessage = message.toLowerCase();
  const result: ParsedCommand = {
    service: null,
    action: null,
    entities: {},
  };

  // Calendar
  if (
    lowerMessage.includes('calendar') ||
    lowerMessage.includes('event') ||
    lowerMessage.includes('schedule')
  ) {
    result.service = 'calendar';
    if (
      lowerMessage.includes('list') ||
      lowerMessage.includes('show') ||
      lowerMessage.includes('what is on')
    ) {
      result.action = 'list';
    } else if (
      lowerMessage.includes('add') ||
      lowerMessage.includes('create')
    ) {
      result.action = 'add';
      const calendarEntities = await parseCalendarCommand(message);
      if (calendarEntities) {
        result.entities.title = calendarEntities.title;
        result.entities.date = calendarEntities.date;
        result.entities.time = calendarEntities.time;
      }
    } else if (
      lowerMessage.includes('delete') ||
      lowerMessage.includes('remove')
    ) {
      result.action = 'delete';
    }
  }

  // Gmail
  else if (
    lowerMessage.includes('email') ||
    lowerMessage.includes('mail') ||
    lowerMessage.includes('inbox')
  ) {
    result.service = 'gmail';
    if (
      lowerMessage.includes('list') ||
      lowerMessage.includes('check') ||
      lowerMessage.includes('show')
    ) {
      result.action = 'list';
    } else if (lowerMessage.includes('send')) {
      result.action = 'send';
      const toMatch = lowerMessage.match(/to ([\w\s\d@.]+)/);
      if (toMatch) result.entities.to = toMatch[1].trim();
      const subjectMatch = lowerMessage.match(/subject (.*?)(?:and body|$)/);
      if (subjectMatch) result.entities.subject = subjectMatch[1].trim();
      const bodyMatch = lowerMessage.match(/body (.*)/);
      if (bodyMatch) result.entities.body = bodyMatch[1].trim();
    }
  }

  // YouTube - flexible natural language matching
  else if (
    lowerMessage.includes('youtube') ||
    lowerMessage.includes('subscriptions') ||
    lowerMessage.includes('play') ||
    lowerMessage.includes('watch') ||
    lowerMessage.includes('show me') ||
    lowerMessage.includes('find') ||
    lowerMessage.includes('put on') ||
    lowerMessage.includes('search for')
  ) {
    result.service = 'youtube';

    if (
      lowerMessage.includes('list') ||
      lowerMessage.includes('my subscriptions')
    ) {
      result.action = 'list';
    } else if (
      lowerMessage.includes('play') ||
      lowerMessage.includes('watch') ||
      lowerMessage.includes('show me') ||
      lowerMessage.includes('find') ||
      lowerMessage.includes('put on') ||
      lowerMessage.includes('search')
    ) {
      result.action = 'get';

      // Extract search query using flexible patterns
      let query = '';

      // Try various patterns to extract the search query
      const patterns = [
        /(?:play|watch|show me|find|put on|search for)\s+(?:some\s+)?(?:me\s+)?(.+?)(?:\s+(?:video|videos|on youtube|music|song))?$/i,
        /(?:i want to|i wanna|i'd like to)\s+(?:watch|see|hear)\s+(.+)$/i,
      ];

      for (const pattern of patterns) {
        const match = lowerMessage.match(pattern);
        if (match && match[1]) {
          query = match[1].trim();
          // Remove common filler words
          query = query
            .replace(
              /(?:some|a|the|for me|please|video|videos|on youtube|music|song)\s*/gi,
              ''
            )
            .trim();
          break;
        }
      }

      // If no pattern matched, use everything after the trigger word
      if (!query) {
        const triggerWords = [
          'play',
          'watch',
          'show me',
          'find',
          'put on',
          'search for',
        ];
        for (const trigger of triggerWords) {
          if (lowerMessage.includes(trigger)) {
            const parts = lowerMessage.split(trigger);
            if (parts[1]) {
              query = parts[1].trim();
              break;
            }
          }
        }
      }

      if (query) {
        result.entities.query = query;
        result.entities.sortBy = 'relevance';

        // Adjust sorting based on keywords
        if (
          lowerMessage.includes('popular') ||
          lowerMessage.includes('most viewed')
        ) {
          result.entities.sortBy = 'viewCount';
        } else if (
          lowerMessage.includes('recent') ||
          lowerMessage.includes('latest') ||
          lowerMessage.includes('new')
        ) {
          result.entities.sortBy = 'date';
        }
      }
    }
  }

  // Profile
  else if (lowerMessage.startsWith('my name is')) {
    result.service = 'profile';
    result.action = 'update';
    result.entities.name = message.substring('my name is'.length).trim();
  } else if (lowerMessage.startsWith('i like')) {
    result.service = 'profile';
    result.action = 'update';
    result.entities.interest = message.substring('i like'.length).trim();
  }

  return result;
}
