// Defensive wrapper for sending callbacks. Uses global fetch (Node 20+) or undici if available.
// This prevents mixing WebSocket/browser APIs and avoids calling .connect() on the wrong object.
const DEFAULT_TIMEOUT_MS = 15000;

async function sendCallback(url, body = undefined, options = {}) {
  if (!url) {
    throw new Error('sendCallback requires a url');
  }
  // Determine fetch implementation
  let fetchFn = global.fetch;
  if (typeof fetchFn !== 'function') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: undiciFetch } = require('undici');
      fetchFn = undiciFetch;
    } catch (e) {
      // no fetch available
      throw new Error('No global fetch and undici not installed; cannot send callback');
    }
  }

  // Defensive guard: if caller accidentally passed a WebSocket-like object, log and throw
  if (typeof url !== 'string') {
    console.error('sendCallback received non-string url:', typeof url);
    throw new TypeError('url must be a string');
  }

  const controller = new (global.AbortController || require('abort-controller'))();
  const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions = {
    method: body ? 'POST' : 'HEAD',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  };

  try {
    const res = await fetchFn(url, fetchOptions);
    clearTimeout(timer);
    let text = '';
    try { text = await (res.text ? res.text() : Promise.resolve('')); } catch (_) { text = ''; }
    return { ok: res.ok, status: res.status, statusText: res.statusText, body: text };
  } catch (err) {
    clearTimeout(timer);
    // Re-throw with more context
    err.message = `sendCallback failed for ${url}: ${err.message}`;
    throw err;
  }
}

module.exports = { sendCallback };