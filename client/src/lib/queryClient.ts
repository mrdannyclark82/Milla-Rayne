/**
 * API request utility for making HTTP requests to the server
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  ...args: any[]
): Promise<T> {
  // Handle legacy 3-parameter format: apiRequest(method, endpoint, body)
  let url: string;
  let requestOptions: RequestInit;

  if (
    typeof options === 'object' &&
    options !== null &&
    !('method' in options) &&
    !('headers' in options)
  ) {
    // Legacy format: apiRequest(method, endpoint, body)
    const method = endpoint;
    url = options as any as string;
    const body = args[2];

    requestOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    url = url.startsWith('http')
      ? url
      : `/api${url.startsWith('/') ? url : '/' + url}`;
  } else {
    // Modern format: apiRequest(endpoint, options)
    url = endpoint.startsWith('http')
      ? endpoint
      : `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }));
    throw new Error(
      error.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
