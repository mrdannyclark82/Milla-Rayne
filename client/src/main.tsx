import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Environment guard - ensure critical environment is loaded before rendering
// In Vite, import.meta.env is always defined, but we check for proper initialization
const envLoaded = typeof import.meta.env !== 'undefined' && import.meta.env.MODE !== undefined;
if (!envLoaded) {
  const FallbackUI = () => (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>Environment Configuration Error</h1>
      <p>The application environment is not properly configured.</p>
      <p>Please refresh the page or contact support if the issue persists.</p>
    </div>
  );
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <FallbackUI />
    </React.StrictMode>
  );
  throw new Error('Environment not properly loaded');
}

// Global client-side error reporter (development helper)
if (import.meta.env.DEV) {
  window.addEventListener('error', (evt) => {
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: evt.error?.message || evt.message,
          stack: evt.error?.stack || null,
        }),
      });
    } catch (_) {}
  });

  window.addEventListener('unhandledrejection', (evt) => {
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: evt.reason?.message || String(evt.reason),
          stack: evt.reason?.stack || null,
        }),
      });
    } catch (_) {}
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
