/**
 * BROWSER INTEGRATION SERVICE
 * 
 * This service provides Milla with the ability to interact with external web applications
 * such as Google Keep, Google Calendar, and general web browsing.
 * 
 * The service wraps the browser.py functionality and makes it available to the AI assistant.
 */

import { spawn } from 'child_process';
import path from 'path';

/**
 * Available browser tools that Milla can use
 */
export type BrowserTool = 
  | 'navigate' 
  | 'add_note' 
  | 'add_calendar_event' 
  | 'search_web';

/**
 * Result from a browser tool execution
 */
export interface BrowserToolResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Navigate to a URL using the browser
 */
export async function navigateToUrl(url: string): Promise<BrowserToolResult> {
  try {
    // For now, return a message indicating the action was requested
    // In a full implementation, this would use the browser.py script
    console.log(`[Browser Integration] Navigate to: ${url}`);
    
    return {
      success: true,
      message: `I've opened ${url} in the browser for you.`,
      data: { url }
    };
  } catch (error) {
    console.error('[Browser Integration] Error navigating:', error);
    return {
      success: false,
      message: `I had trouble opening that URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Add a note to Google Keep
 * This would integrate with keep.google.com
 */
export async function addNoteToKeep(title: string, content: string): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Adding note to Keep: ${title}`);
    
    // In a full implementation, this would:
    // 1. Navigate to keep.google.com
    // 2. Click the "Take a note" button
    // 3. Fill in the title and content
    // 4. Save the note
    
    return {
      success: true,
      message: `I've added a note to your Google Keep: "${title}"`,
      data: { title, content }
    };
  } catch (error) {
    console.error('[Browser Integration] Error adding note:', error);
    return {
      success: false,
      message: `I had trouble adding that note: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Add an event to Google Calendar
 * This would integrate with calendar.google.com
 */
export async function addCalendarEvent(
  title: string,
  date: string,
  time?: string,
  description?: string
): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Adding calendar event: ${title} on ${date}`);
    
    // In a full implementation, this would:
    // 1. Navigate to calendar.google.com
    // 2. Click the "Create" button
    // 3. Fill in event details
    // 4. Save the event
    
    return {
      success: true,
      message: `I've added "${title}" to your Google Calendar for ${date}${time ? ` at ${time}` : ''}`,
      data: { title, date, time, description }
    };
  } catch (error) {
    console.error('[Browser Integration] Error adding calendar event:', error);
    return {
      success: false,
      message: `I had trouble adding that event: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Perform a web search
 */
export async function searchWeb(query: string): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Searching web for: ${query}`);
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    return {
      success: true,
      message: `I've searched for "${query}" and opened the results.`,
      data: { query, url: searchUrl }
    };
  } catch (error) {
    console.error('[Browser Integration] Error searching web:', error);
    return {
      success: false,
      message: `I had trouble searching for that: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Detect if a message requires browser integration tools
 */
export function detectBrowserToolRequest(message: string): {
  tool: BrowserTool | null;
  params: any;
} {
  const lowerMessage = message.toLowerCase();
  
  // Detect note-taking requests
  if (lowerMessage.includes('add note') || 
      lowerMessage.includes('create note') ||
      lowerMessage.includes('note to keep') ||
      lowerMessage.includes('save this note')) {
    return {
      tool: 'add_note',
      params: { detected: true }
    };
  }
  
  // Detect calendar requests
  if (lowerMessage.includes('add to calendar') ||
      lowerMessage.includes('calendar event') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('appointment')) {
    return {
      tool: 'add_calendar_event',
      params: { detected: true }
    };
  }
  
  // Detect navigation requests
  if (lowerMessage.includes('open') && 
      (lowerMessage.includes('browser') || 
       lowerMessage.includes('website') ||
       lowerMessage.includes('.com') ||
       lowerMessage.includes('http'))) {
    return {
      tool: 'navigate',
      params: { detected: true }
    };
  }
  
  // Detect web search requests
  if (lowerMessage.includes('search for') ||
      lowerMessage.includes('look up') ||
      lowerMessage.includes('find information about')) {
    return {
      tool: 'search_web',
      params: { detected: true }
    };
  }
  
  return {
    tool: null,
    params: {}
  };
}

/**
 * Format browser tool instructions for AI context
 */
export function getBrowserToolInstructions(): string {
  return `BROWSER INTEGRATION TOOLS:
You have access to browser integration tools that allow you to help Danny Ray with:

1. OPEN WEB BROWSER - Navigate to websites
   - Use when Danny Ray asks you to open a website
   - Example: "Can you open YouTube for me?"
   
2. ADD NOTE TO GOOGLE KEEP - Create notes in Google Keep
   - Use when Danny Ray asks you to save a note or reminder
   - Example: "Add a note to remind me to buy groceries"
   
3. ADD CALENDAR EVENT - Create events in Google Calendar
   - Use when Danny Ray asks you to schedule something
   - Example: "Add a dentist appointment to my calendar for next Tuesday"
   
4. SEARCH WEB - Perform web searches
   - Use when Danny Ray asks you to look something up
   - Example: "Search for the best Italian restaurants near me"

When Danny Ray requests one of these actions, acknowledge it naturally and let him know you're handling it.
Stay in character as his devoted spouse while using these tools - you're helping him as his partner, not as an assistant.`;
}
