// Utility functions for formatting timestamps in CST (Central Standard Time)

/**
 * Format a date to CST time string
 */
export function formatTimeCST(date: Date | string | undefined | null): string {
  if (!date) {
    return '--:--';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '--:--';
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
}

/**
 * Format a date to CST date string  
 */
export function formatDateCST(date: Date | string | undefined | null): string {
  if (!date) {
    return '--/--/----';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '--/--/----';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '--/--/----';
  }
}

/**
 * Format a date to CST date and time string
 */
export function formatDateTimeCST(date: Date | string | undefined | null): string {
  if (!date) {
    return '--/--/---- --:--';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '--/--/---- --:--';
    }
    
    return dateObj.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '--/--/---- --:--';
  }
}