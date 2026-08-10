/**
 * Proactive API Client
 *
 * Default: same-origin (main app on :5000 mounts proactive routes).
 * Optional split-server: set VITE_PROACTIVE_BASE_URL (e.g. http://localhost:5001).
 */

const PROACTIVE_BASE_URL = (
  import.meta.env.VITE_PROACTIVE_BASE_URL ?? ''
).replace(/\/$/, '');

/**
 * Make a request to the proactive features API
 */
export async function proactiveApiRequest(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = PROACTIVE_BASE_URL ? `${PROACTIVE_BASE_URL}${path}` : path;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

/**
 * Convenience method for GET requests
 */
export async function proactiveGet<T = any>(endpoint: string): Promise<T> {
  const response = await proactiveApiRequest(endpoint);
  if (!response.ok) {
    throw new Error(`Proactive API error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Convenience method for POST requests
 */
export async function proactivePost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await proactiveApiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`Proactive API error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Check if the proactive API is available
 */
export async function checkProactiveServerHealth(): Promise<boolean> {
  try {
    // Split-server exposes /health; main app exposes the rewards route instead.
    const probe = PROACTIVE_BASE_URL
      ? '/health'
      : '/api/milla/tokens/rewards';
    const response = await proactiveApiRequest(probe);
    return response.ok;
  } catch (error) {
    console.error('Proactive server health check failed:', error);
    return false;
  }
}
