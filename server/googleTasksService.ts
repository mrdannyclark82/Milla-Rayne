/**
 * GOOGLE TASKS API SERVICE
 * 
 * Provides Google Tasks API integration using OAuth tokens.
 * Note: Google Keep doesn't have an official API, so we use Tasks API instead.
 * This allows users to create tasks/notes in Google Tasks.
 */

import { getValidAccessToken } from './oauthService';

export interface TaskItem {
  title: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';
}

export interface TasksAPIResult {
  success: boolean;
  message: string;
  taskId?: string;
  taskLink?: string;
  error?: string;
}

/**
 * Add a note/task to Google Tasks (Keep alternative)
 */
export async function addNoteToGoogleTasks(
  title: string,
  content: string,
  userId: string = 'default-user'
): Promise<TasksAPIResult> {
  try {
    console.log(`[Google Tasks API] Adding task: ${title}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message: "You need to connect your Google account first. Please authenticate via the OAuth settings.",
        error: 'NO_TOKEN'
      };
    }

    // First, get or create the default task list
    const taskListId = await getDefaultTaskList(accessToken);

    if (!taskListId) {
      return {
        success: false,
        message: "I couldn't access your Google Tasks. Please make sure Tasks API is enabled.",
        error: 'NO_TASK_LIST'
      };
    }

    // Create task object
    const task: TaskItem = {
      title: title,
      notes: content,
      status: 'needsAction'
    };

    // Call Google Tasks API to create the task
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google Tasks API] Error:', errorData);
      
      return {
        success: false,
        message: `I had trouble adding the task: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR'
      };
    }

    const createdTask = await response.json();

    return {
      success: true,
      message: `I've added "${title}" to your Google Tasks`,
      taskId: createdTask.id,
      taskLink: createdTask.selfLink
    };

  } catch (error) {
    console.error('[Google Tasks API] Error adding task:', error);
    return {
      success: false,
      message: `I encountered an error while adding the task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Get the default task list ID
 */
async function getDefaultTaskList(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      console.error('[Google Tasks API] Error getting task lists');
      return null;
    }

    const data = await response.json();
    
    // Return the first task list (usually "My Tasks")
    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }

    return null;

  } catch (error) {
    console.error('[Google Tasks API] Error getting task lists:', error);
    return null;
  }
}
