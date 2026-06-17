// Privacy-friendly, cookieless analytics — OFF by default.
//
// No cookies, no cross-site tracking, no personal data: we only ever send a
// coarse virtual path (e.g. "/pokemon/discover") so there's nothing to identify
// a user. Enable it by setting the env vars below (and add a line to the privacy
// policy). Two providers are supported; pick one:
//
//   Plausible (plausible.io, or self-hosted):
//     VITE_ANALYTICS_PROVIDER=plausible
//     VITE_ANALYTICS_DOMAIN=deine-domain.de
//     VITE_ANALYTICS_SRC=https://plausible.io/js/script.manual.js   (optional)
//
//   GoatCounter (goatcounter.com):
//     VITE_ANALYTICS_PROVIDER=goatcounter
//     VITE_ANALYTICS_GC_URL=https://DEINCODE.goatcounter.com/count
//
// Everything is wrapped so a blocked/offline analytics script can never break
// the app.

const env = import.meta.env;
const PROVIDER = env.VITE_ANALYTICS_PROVIDER || '';
const enabled = env.PROD && !!PROVIDER;

let ready = false;

const loadScript = (src, attrs = {}) => new Promise((resolve) => {
  try {
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  } catch { resolve(false); }
});

export async function initAnalytics() {
  if (!enabled || ready) return;
  ready = true;
  try {
    if (PROVIDER === 'plausible') {
      const domain = env.VITE_ANALYTICS_DOMAIN;
      if (!domain) return;
      // Manual mode so SPA view changes are counted explicitly (see trackView).
      window.plausible = window.plausible || function plausibleQueue() {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
      await loadScript(env.VITE_ANALYTICS_SRC || 'https://plausible.io/js/script.manual.js', { 'data-domain': domain });
    } else if (PROVIDER === 'goatcounter') {
      const url = env.VITE_ANALYTICS_GC_URL;
      if (!url) return;
      window.goatcounter = { no_onload: true }; // we trigger counts ourselves
      await loadScript('https://gc.zgo.at/count.js', { 'data-goatcounter': url });
    }
  } catch { /* analytics must never break the app */ }
}

// Count a coarse virtual pageview for a view change (no IDs, no PII).
export function trackView(path) {
  if (!enabled || !path) return;
  try {
    if (PROVIDER === 'plausible' && typeof window.plausible === 'function') {
      window.plausible('pageview', { u: window.location.origin + path });
    } else if (PROVIDER === 'goatcounter' && window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path, event: false });
    }
  } catch { /* ignore */ }
}
