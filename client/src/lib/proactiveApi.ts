/**
 * Proactive API Client
 * Handles API calls to the proactive features server (port 5001)
 */

const PROACTIVE_PORT = import.meta.env.VITE_PROACTIVE_PORT || '5001';
const PROACTIVE_BASE_URL = import.meta.env.VITE_PROACTIVE_BASE_URL || `http://localhost:${PROACTIVE_PORT}`;

/**
 * Make a request to the proactive features server
 */
export async function proactiveApiRequest(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  // Remove leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Construct full URL
  const url = `${PROACTIVE_BASE_URL}/${path}`;
  
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
 * Check if the proactive server is available
 */
export async function checkProactiveServerHealth(): Promise<boolean> {
  try {
    const response = await proactiveApiRequest('/health');
    return response.ok;
  } catch (error) {
    console.error('Proactive server health check failed:', error);
    return false;
  }
}
