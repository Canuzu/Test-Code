// Lightweight, dependency-free error reporting — OFF by default.
//
// Enable by setting ONE of these (build env):
//   VITE_SENTRY_DSN=https://<key>@<host>/<projectId>     → sends Sentry events
//   VITE_ERROR_ENDPOINT=https://your-endpoint            → POSTs a JSON payload
//
// We capture uncaught errors, unhandled promise rejections and React render
// errors (via reportError(), called from the error boundary). Everything is
// throttled, de-duplicated and capped per session, scrubbed of query strings
// (which can carry tokens), and wrapped so reporting can never itself break the
// app. No cookies, no PII beyond the error text + a coarse URL path.

const env = import.meta.env;
const DSN = env.VITE_SENTRY_DSN || '';
const ENDPOINT = env.VITE_ERROR_ENDPOINT || '';
const RELEASE = env.VITE_APP_VERSION || '0.0.0';
const enabled = env.PROD && (!!DSN || !!ENDPOINT);

const MAX_EVENTS = 25;          // hard cap per page session (flood guard)
const DEDUPE_MS = 10000;        // drop the same message within this window
let sent = 0;
const lastSeen = new Map();

// --- Sentry DSN → ingest URL ----------------------------------------------
function parseDsn(dsn) {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, '');
    const publicKey = u.username;
    if (!projectId || !publicKey) return null;
    const path = u.pathname.slice(0, u.pathname.lastIndexOf('/'));
    return { url: `${u.protocol}//${u.host}${path}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`, publicKey };
  } catch { return null; }
}
const sentry = DSN ? parseDsn(DSN) : null;

const uuid = () => {
  try { return crypto.randomUUID().replace(/-/g, ''); }
  catch { return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''); }
};

// Strip the query string (tokens) but keep origin + path for context.
const safeUrl = () => { try { return location.origin + location.pathname + location.hash; } catch { return ''; } };

function sendSentry({ name, message, stack }) {
  const eventId = uuid();
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    release: RELEASE,
    environment: 'production',
    exception: { values: [{ type: name || 'Error', value: message || '' }] },
    request: { url: safeUrl() },
    extra: { stack: stack || '' },
  };
  const body = `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: DSN })}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}`;
  fetch(sentry.url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/x-sentry-envelope' } }).catch(() => {});
}

function sendEndpoint(payload) {
  fetch(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ ...payload, url: safeUrl(), release: RELEASE, ts: Date.now(), ua: navigator.userAgent }),
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});
}

export function reportError(error, context) {
  if (!enabled) return;
  try {
    const name = error?.name || 'Error';
    const message = String(error?.message || error || 'Unknown error');
    const stack = error?.stack || '';
    const key = `${name}:${message}`;
    const now = Date.now();
    if (sent >= MAX_EVENTS) return;
    if (lastSeen.has(key) && now - lastSeen.get(key) < DEDUPE_MS) return;
    lastSeen.set(key, now);
    sent += 1;
    const payload = { name, message, stack, context: context || undefined };
    if (sentry) sendSentry(payload); else if (ENDPOINT) sendEndpoint(payload);
  } catch { /* reporting must never throw */ }
}

export function initErrorReporting() {
  if (!enabled) return;
  try {
    window.addEventListener('error', (e) => {
      if (e?.error) reportError(e.error, { source: 'window.onerror' });
      else reportError(new Error(e?.message || 'Script error'), { source: 'window.onerror' });
    });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e?.reason;
      reportError(r instanceof Error ? r : new Error(typeof r === 'string' ? r : 'Unhandled rejection'), { source: 'unhandledrejection' });
    });
  } catch { /* ignore */ }
}
