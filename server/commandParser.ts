export interface ParsedCommand {
  service: 'calendar' | 'gmail' | 'youtube' | null;
  action: 'list' | 'add' | 'delete' | 'send' | 'check' | 'get' | null;
  entities: { [key: string]: string };
}

export function parseCommand(message: string): ParsedCommand {
  const lowerMessage = message.toLowerCase();
  const result: ParsedCommand = {
    service: null,
    action: null,
    entities: {},
  };

  // Calendar
  if (lowerMessage.includes('calendar') || lowerMessage.includes('event') || lowerMessage.includes('schedule')) {
    result.service = 'calendar';
    if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('what is on')) {
      result.action = 'list';
    } else if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      result.action = 'add';
      const titleMatch = lowerMessage.match(/(?:add|create) event (.*?) (?:on|at)/);
      if (titleMatch) result.entities.title = titleMatch[1];
      const dateMatch = lowerMessage.match(/on ([\w\s\d]+?)(?:at|$)/);
      if (dateMatch) result.entities.date = dateMatch[1].trim();
      const timeMatch = lowerMessage.match(/at ([\w\s\d:]+)/);
      if (timeMatch) result.entities.time = timeMatch[1].trim();
    } else if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      result.action = 'delete';
    }
  }

  // Gmail
  else if (lowerMessage.includes('email') || lowerMessage.includes('mail') || lowerMessage.includes('inbox')) {
    result.service = 'gmail';
    if (lowerMessage.includes('list') || lowerMessage.includes('check') || lowerMessage.includes('show')) {
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

  // YouTube
  else if (lowerMessage.includes('youtube') || lowerMessage.includes('subscriptions')) {
    result.service = 'youtube';
    if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
      result.action = 'list';
    }
  }

  return result;
}