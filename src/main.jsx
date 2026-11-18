import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import './index.css';
import { initAnalytics } from './lib/analytics.js';
import { initErrorReporting } from './lib/errorReporting.js';

// Error monitoring + privacy-friendly analytics (both no-ops unless configured).
initErrorReporting();
initAnalytics();

// A stale tab after a deploy can request chunk/CSS files that no longer exist:
// reload once to pick up the new build instead of rendering a white page.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try {
    const last = Number(sessionStorage.getItem('kwde_chunk_reloaded_at') || 0);
    if (Date.now() - last < 30000) return;
    sessionStorage.setItem('kwde_chunk_reloaded_at', String(Date.now()));
  } catch { /* storage blocked */ }
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register the service worker for offline support (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
