import React from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './pages/Landing';
import './index.css';

/**
 * Landing Page Demo Entry Point
 * 
 * This file can be used to preview the Landing page in isolation.
 * To use it, temporarily modify vite.config.ts to point to this file
 * or create a separate build configuration.
 */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Landing />
  </React.StrictMode>
);
