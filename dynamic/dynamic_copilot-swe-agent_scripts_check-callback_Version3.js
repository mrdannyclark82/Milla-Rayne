#!/usr/bin/env node
// Simple diagnostic that attempts to HEAD the callback endpoint and prints basic diagnostics.
// Usage: node scripts/check-callback.js <URL>
const url = process.argv[2] || process.env.CALLBACK_ENDPOINT;
if (!url) {
  console.error(
    'No callback endpoint provided. Usage: node scripts/check-callback.js <URL> or set CALLBACK_ENDPOINT env var.'
  );
  process.exit(2);
}
(async () => {
  try {
    console.log('Diagnosing callback endpoint:', url);
    // Node 20+ has global fetch. If not present, try to require undici.
    let fetchFn = global.fetch;
    if (typeof fetchFn !== 'function') {
      try {
        const { fetch: undiciFetch } = require('undici');
        fetchFn = undiciFetch;
        console.log('Using undici.fetch for diagnostics');
      } catch (err) {
        console.warn(
          'No global fetch and no undici found; falling back to http(s) via builtin modules'
        );
      }
    }
    if (typeof fetchFn === 'function') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetchFn(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      console.log('HEAD status:', res.status, res.statusText);
      console.log('Headers:');
      for (const [k, v] of res.headers) {
        console.log(`${k}: ${v}`);
      }
      process.exit(0);
    } else {
      // fallback: use http/https
      const { URL } = require('url');
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? require('https') : require('http');
      const opts = { method: 'HEAD', timeout: 10000 };
      const req = lib.request(u, opts, (res) => {
        console.log('HEAD status:', res.statusCode, res.statusMessage);
        console.log('Headers:');
        console.log(res.headers);
        process.exit(0);
      });
      req.on('error', (err) => {
        console.error('Request error:', err && err.stack ? err.stack : err);
        process.exit(1);
      });
      req.on('timeout', () => {
        console.error('Request timed out');
        req.destroy();
        process.exit(1);
      });
      req.end();
    }
  } catch (err) {
    console.error(
      'Diagnostic script error:',
      err && err.stack ? err.stack : err
    );
    process.exit(1);
  }
})();
