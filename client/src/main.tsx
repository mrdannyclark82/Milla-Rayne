import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Environment guard - ensure environment is loaded before rendering
const envLoaded = typeof import.meta.env !== 'undefined';
if (!envLoaded) {
  const FallbackUI = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Environment Not Loaded</h1>
      <p>Please refresh the page or check your configuration.</p>
    </div>
  );
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <FallbackUI />
    </React.StrictMode>
  );
  throw new Error('Environment not loaded');
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
