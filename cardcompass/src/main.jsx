import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import '@fontsource-variable/archivo/wdth.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/product.css';
import App from './App.jsx';
import { CartProvider } from './lib/cart.jsx';
import { HASH_ROUTER } from './lib/config.js';

// Stale tab after a deploy → reload once instead of a white page.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try {
    const last = Number(sessionStorage.getItem('cc_reload_at') || 0);
    if (Date.now() - last < 30000) return;
    sessionStorage.setItem('cc_reload_at', String(Date.now()));
  } catch { /* ignore */ }
  window.location.reload();
});

const Router = HASH_ROUTER ? HashRouter : BrowserRouter;
const basename = HASH_ROUTER ? undefined : (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CartProvider>
        <App />
      </CartProvider>
    </Router>
  </React.StrictMode>,
);
