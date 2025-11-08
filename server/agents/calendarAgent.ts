import { registerAgent } from './registry';
import { AgentTask } from './taskStorage';
import {
  addEventToGoogleCalendar,
  listEvents,
  deleteEvent,
  CalendarAPIResult,
} from '../googleCalendarService';
import { z } from 'zod';

/**
 * CalendarAgent - Domain agent for Google Calendar operations
 * Wraps googleCalendarService to provide task-based calendar management
 */
async function handleTask(task: AgentTask): Promise<any> {
  const { action, payload } = task;
  const userId = (payload as any)?.userId || 'default-user';

  if (action === 'create_event') {
    const schema = z.object({
      title: z.string(),
      date: z.string(),
      time: z.string().optional(),
      description: z.string().optional(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    const result: CalendarAPIResult = await addEventToGoogleCalendar(
      parsed.title,
      parsed.date,
      parsed.time,
      parsed.description,
      parsed.userId || userId
    );

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      eventId: result.eventId,
      eventLink: result.eventLink,
      message: result.message,
    };
  }

  if (action === 'list_events') {
    const schema = z.object({
      timeMin: z.string().optional(),
      timeMax: z.string().optional(),
      maxResults: z.number().optional(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    const result = await listEvents(
      parsed.userId || userId,
      parsed.timeMin,
      parsed.timeMax,
      parsed.maxResults
    );

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      events: result.events || [],
      message: result.message,
    };
  }

  if (action === 'delete_event') {
    const schema = z.object({
      eventId: z.string(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    const result = await deleteEvent(parsed.userId || userId, parsed.eventId);

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      message: result.message,
    };
  }

  // update_event not yet implemented in googleCalendarService; stub for now
  if (action === 'update_event') {
    throw new Error('update_event action not yet implemented in CalendarAgent');
  }

  throw new Error(`Unknown action for CalendarAgent: ${action}`);
}

// Register the agent in the registry on module load
registerAgent({
  name: 'CalendarAgent',
  description: 'Manages Google Calendar events: create, list, delete',
  handleTask,
});

export { handleTask };
export default { handleTask };
