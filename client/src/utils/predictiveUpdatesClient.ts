/**
 * Predictive Updates Client
 * Handles client-side toggles and API calls for predictive updates feature
 */

const PREDICTIVE_UPDATES_KEY = 'milla.predictiveUpdates.enabled';
const DAILY_SUGGESTIONS_KEY = 'milla.dailySuggestions.schedulerEnabled';

/**
 * Get predictive updates enabled state
 */
export function getPredictiveUpdatesEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const value = localStorage.getItem(PREDICTIVE_UPDATES_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading predictive updates setting:', error);
    return false;
  }
}

/**
 * Set predictive updates enabled state
 */
export function setPredictiveUpdatesEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREDICTIVE_UPDATES_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving predictive updates setting:', error);
  }
}

/**
 * Get daily suggestions scheduler enabled state
 */
export function getDailySuggestionsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const value = localStorage.getItem(DAILY_SUGGESTIONS_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading daily suggestions setting:', error);
    return false;
  }
}

/**
 * Set daily suggestions scheduler enabled state
 */
export function setDailySuggestionsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DAILY_SUGGESTIONS_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving daily suggestions setting:', error);
  }
}

/**
 * Fetch today's daily suggestion from server
 */
export async function fetchDailySuggestion(): Promise<{
  success: boolean;
  suggestion?: any;
  error?: string;
}> {
  try {
    const response = await fetch('/api/ai-updates/daily-suggestion');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching daily suggestion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Manually trigger AI updates fetch
 * Optional adminToken for protected endpoints
 */
export async function manualFetchAIUpdates(adminToken?: string): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const response = await fetch('/api/ai-updates/fetch', {
      method: 'POST',
      headers
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error manually fetching AI updates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
