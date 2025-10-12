import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

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
