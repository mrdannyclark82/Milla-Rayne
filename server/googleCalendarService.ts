/**
 * GOOGLE CALENDAR API SERVICE
 *
 * Provides actual Google Calendar API integration using OAuth tokens.
 * This service uses the Google Calendar REST API to create events.
 */

import { getValidAccessToken } from './oauthService';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export interface CalendarAPIResult {
  success: boolean;
  message: string;
  eventId?: string;
  eventLink?: string;
  error?: string;
}

/**
 * Add an event to Google Calendar using the Calendar API
 */
export async function addEventToGoogleCalendar(
  title: string,
  date: string,
  time?: string,
  description?: string,
  userId: string = 'default-user'
): Promise<CalendarAPIResult> {
  try {
    console.log(`[Google Calendar API] Adding event: ${title} on ${date}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(userId, 'google');

    if (!accessToken) {
      return {
        success: false,
        message:
          'You need to connect your Google account first. Please authenticate via the OAuth settings.',
        error: 'NO_TOKEN',
      };
    }

    // Parse date and time into ISO 8601 format
    const eventDateTime = parseDateTime(date, time);

    if (!eventDateTime.start || !eventDateTime.end) {
      return {
        success: false,
        message:
          "I couldn't parse the date and time. Please provide a clearer format.",
        error: 'PARSE_ERROR',
      };
    }

    // Create event object
    const event: CalendarEvent = {
      summary: title,
      description: description || '',
      start: {
        dateTime: eventDateTime.start,
        timeZone: 'America/New_York', // Default timezone, should be configurable
      },
      end: {
        dateTime: eventDateTime.end,
        timeZone: 'America/New_York',
      },
    };

    // Call Google Calendar API
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Google Calendar API] Error:', errorData);

      return {
        success: false,
        message: `I had trouble adding the event to your calendar: ${errorData.error?.message || 'Unknown error'}`,
        error: errorData.error?.message || 'API_ERROR',
      };
    }

    const createdEvent = await response.json();

    return {
      success: true,
      message: `I've added "${title}" to your Google Calendar for ${date}${time ? ` at ${time}` : ''}`,
      eventId: createdEvent.id,
      eventLink: createdEvent.htmlLink,
    };
  } catch (error) {
    console.error('[Google Calendar API] Error adding event:', error);
    return {
      success: false,
      message: `I encountered an error while adding the event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Parse date and time strings into ISO 8601 format
 * Handles various input formats like:
 * - "tomorrow", "next Tuesday", "December 25"
 * - "10am", "2:30pm", "14:00"
 */
function parseDateTime(
  dateStr: string,
  timeStr?: string
): {
  start: string | null;
  end: string | null;
} {
  try {
    const now = new Date();
    let targetDate = new Date();

    // Parse relative dates
    const dateLower = dateStr.toLowerCase().trim();

    if (dateLower === 'today') {
      targetDate = new Date(now);
    } else if (dateLower === 'tomorrow') {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (dateLower.startsWith('next ')) {
      // Handle "next Monday", "next week", etc.
      const dayName = dateLower.replace('next ', '');
      targetDate = getNextWeekday(dayName);
    } else {
      // Try to parse as a standard date
      targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) {
        // If parsing failed, return null
        return { start: null, end: null };
      }
    }

    // Parse time
    let hours = 9; // Default to 9am
    let minutes = 0;

    if (timeStr) {
      const timeResult = parseTimeString(timeStr);
      if (timeResult) {
        hours = timeResult.hours;
        minutes = timeResult.minutes;
      }
    }

    // Set the time on the target date
    targetDate.setHours(hours, minutes, 0, 0);

    // Create end time (1 hour later by default)
    const endDate = new Date(targetDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      start: targetDate.toISOString(),
      end: endDate.toISOString(),
    };
  } catch (error) {
    console.error('[Google Calendar API] Error parsing date/time:', error);
    return { start: null, end: null };
  }
}

/**
 * Parse time string like "10am", "2:30pm", "14:00"
 */
function parseTimeString(
  timeStr: string
): { hours: number; minutes: number } | null {
  const timeLower = timeStr.toLowerCase().trim();

  // Handle formats like "10am", "2pm"
  const ampmMatch = timeLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3];

    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  // Handle 24-hour format like "14:00"
  const militaryMatch = timeLower.match(/(\d{1,2}):(\d{2})/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    return { hours, minutes };
  }

  return null;
}

/**
 * Get next occurrence of a weekday
 */
function getNextWeekday(dayName: string): Date {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const targetDay = days.indexOf(dayName.toLowerCase());

  if (targetDay === -1) {
    // If not a valid day name, return tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  const today = new Date();
  const currentDay = today.getDay();

  // Calculate days until target day
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week
  }

  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + daysUntil);

  return targetDate;
}
