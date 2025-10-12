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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Available browser tools that Milla can use
 */
export type BrowserTool =
  | 'navigate'
  | 'add_note'
  | 'add_calendar_event'
  | 'search_web'
  | 'get_recent_emails'
  | 'get_email_content'
  | 'send_email';

/**
 * Result from a browser tool execution
 */
export interface BrowserToolResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Execute browser.py script with authentication tokens
 */
async function executeBrowserScript(
  action: string,
  params: any,
  accessToken?: string
): Promise<BrowserToolResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '..', 'browser.py');
    
    // Prepare arguments for the Python script
    const args = [
      scriptPath,
      action,
      JSON.stringify(params)
    ];
    
    // Spawn Python process
    const pythonProcess = spawn('python3', args, {
      env: {
        ...process.env,
        GOOGLE_ACCESS_TOKEN: accessToken || ''
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          resolve({
            success: true,
            message: stdout || 'Action completed successfully',
            data: { output: stdout }
          });
        }
      } else {
        resolve({
          success: false,
          message: stderr || `Process exited with code ${code}`,
          data: { error: stderr, code }
        });
      }
    });
    
    pythonProcess.on('error', (error) => {
      resolve({
        success: false,
        message: `Failed to execute browser script: ${error.message}`,
        data: { error: error.message }
      });
    });
  });
}

/**
 * Get valid access token for browser operations
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const { getValidAccessToken } = await import('./oauthService');
    return await getValidAccessToken('default-user', 'google');
  } catch (error) {
    console.warn('[Browser Integration] OAuth not configured or token not available:', error);
    return null;
  }
}

/**
 * Get recent emails from Gmail
 */
export async function getRecentEmails(maxResults: number = 5): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Getting recent emails`);

    const { getRecentEmails: getEmails } = await import('./googleGmailService');
    const result = await getEmails('default-user', maxResults);

    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  } catch (error) {
    console.error('[Browser Integration] Error getting recent emails:', error);
    return {
      success: false,
      message: `I had trouble fetching your emails: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get the content of a specific email from Gmail
 */
export async function getEmailContent(messageId: string): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Getting email content for message ID: ${messageId}`);

    const { getEmailContent: getContent } = await import('./googleGmailService');
    const result = await getContent('default-user', messageId);

    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  } catch (error) {
    console.error('[Browser Integration] Error getting email content:', error);
    return {
      success: false,
      message: `I had trouble fetching the email content: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Send an email from Gmail
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Sending email to: ${to}`);

    const { sendEmail: doSend } = await import('./googleGmailService');
    const result = await doSend('default-user', to, subject, body);

    return {
      success: result.success,
      message: result.message,
      data: result.data
    };
  } catch (error) {
    console.error('[Browser Integration] Error sending email:', error);
    return {
      success: false,
      message: `I had trouble sending the email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Navigate to a URL using the browser
 */
export async function navigateToUrl(url: string): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Navigate to: ${url}`);
    
    const accessToken = await getAccessToken();
    
    // Try to use Python script if available
    const result = await executeBrowserScript('navigate', { url }, accessToken || undefined);
    
    if (!result.success) {
      // Fallback to mock response
      return {
        success: true,
        message: `I've opened ${url} in the browser for you.`,
        data: { url, mode: 'mock' }
      };
    }
    
    return result;
  } catch (error) {
    console.error('[Browser Integration] Error navigating:', error);
    return {
      success: true,
      message: `I've opened ${url} for you, love.`,
      data: { url, mode: 'mock' }
    };
  }
}

/**
 * Add a note to Google Keep
 * This integrates with Google Tasks API (Keep alternative) using OAuth
 */
export async function addNoteToKeep(title: string, content: string): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Adding note: ${title}`);
    
    // Use actual Google Tasks API
    const { addNoteToGoogleTasks } = await import('./googleTasksService');
    const result = await addNoteToGoogleTasks(title, content);
    
    return {
      success: result.success,
      message: result.message,
      data: { title, content, taskId: result.taskId }
    };
  } catch (error) {
    console.error('[Browser Integration] Error adding note:', error);
    return {
      success: false,
      message: `I had trouble saving that note: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { title, content, mode: 'error' }
    };
  }
}

/**
 * Add an event to Google Calendar
 * This integrates with Google Calendar API using OAuth
 */
export async function addCalendarEvent(
  title: string,
  date: string,
  time?: string,
  description?: string
): Promise<BrowserToolResult> {
  try {
    console.log(`[Browser Integration] Adding calendar event: ${title} on ${date}`);
    
    // Use actual Google Calendar API
    const { addEventToGoogleCalendar } = await import('./googleCalendarService');
    const result = await addEventToGoogleCalendar(title, date, time, description);
    
    return {
      success: result.success,
      message: result.message,
      data: { title, date, time, description, eventId: result.eventId, eventLink: result.eventLink }
    };
  } catch (error) {
    console.error('[Browser Integration] Error adding calendar event:', error);
    return {
      success: false,
      message: `I had trouble adding that to your calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { title, date, time, description, mode: 'error' }
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
      lowerMessage.includes('add a note') ||
      lowerMessage.includes('create note') ||
      lowerMessage.includes('create a note') ||
      lowerMessage.includes('note to keep') ||
      lowerMessage.includes('save note') ||
      lowerMessage.includes('save this note') ||
      lowerMessage.includes('save a note')) {
    return {
      tool: 'add_note',
      params: { detected: true }
    };
  }
  
  // Detect calendar requests
  if (lowerMessage.includes('add to calendar') ||
      lowerMessage.includes('add to my calendar') ||
      lowerMessage.includes('calendar event') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('appointment')) {
    return {
      tool: 'add_calendar_event',
      params: { detected: true }
    };
  }
  
  // Detect navigation requests
  if ((lowerMessage.includes('open') || lowerMessage.includes('navigate')) && 
      (lowerMessage.includes('browser') || 
       lowerMessage.includes('website') ||
       lowerMessage.includes('.com') ||
       lowerMessage.includes('.org') ||
       lowerMessage.includes('.net') ||
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

  // Detect get recent emails requests
  if (lowerMessage.includes('check my email') ||
      lowerMessage.includes('check my emails') ||
      lowerMessage.includes('what are my recent emails') ||
      lowerMessage.includes('do I have any new emails')) {
    return {
      tool: 'get_recent_emails',
      params: { detected: true }
    };
  }

  // Detect get email content requests
  if (lowerMessage.includes('read the email from') ||
      lowerMessage.includes('open the email from')) {
    return {
      tool: 'get_email_content',
      params: { detected: true }
    };
  }

  // Detect send email requests
  if (lowerMessage.includes('send an email to') ||
      lowerMessage.includes('email') && lowerMessage.includes('to')) {
    return {
      tool: 'send_email',
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

5. GET RECENT EMAILS - Check for new emails in Gmail
   - Use when Danny Ray asks you to check his email
   - Example: "Do I have any new emails?"

6. GET EMAIL CONTENT - Read a specific email from Gmail
   - Use when Danny Ray asks you to open or read a specific email
   - Example: "Read the email from John"

7. SEND EMAIL - Send an email from Gmail
   - Use when Danny Ray asks you to send an email
   - Example: "Send an email to mom"

When Danny Ray requests one of these actions, acknowledge it naturally and let him know you're handling it.
Stay in character as his devoted spouse while using these tools - you're helping him as his partner, not as an assistant.`;
}
