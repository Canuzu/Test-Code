# Security

## Posture
- **Static frontend** on GitHub Pages — no app server, no server-side secrets in
  the bundle. The Supabase anon key is a public, RLS-protected client key.
- **Content Security Policy** is set via a `<meta>` tag in `index.html` (Pages
  can't send headers): scripts are limited to our own bundle plus the optional
  analytics/Stripe hosts; `object-src 'none'`, `base-uri 'self'`. `img-src` and
  `connect-src` stay `https:`-wide so the card-image CDNs and the per-project
  Supabase/analytics endpoints keep working.
- **Service worker** only caches same-origin assets; cross-origin requests pass
  through untouched.

## Operator tasks before / around launch
These need access to the Supabase/Stripe dashboards and can't be done in the repo:

- [ ] **Verify Supabase Row Level Security (RLS).** Every user-data table must
      have RLS enabled with policies that scope rows to `auth.uid()`. Test that a
      logged-in user cannot read another user's rows. See `docs/BACKEND.md`.
- [ ] **Stripe: switch from test to live mode** (live keys + live Price ID in the
      build env) and confirm the webhook endpoint + signing secret are the live
      ones. Do a real low-value end-to-end purchase + refund.
- [ ] **Clickjacking header.** `frame-ancestors` / `X-Frame-Options` can't be set
      from a `<meta>` tag — set them at the CDN / custom-domain layer (e.g.
      Cloudflare) once a custom domain is in place.

## Known, accepted issues
- `npm audit` reports a high-severity advisory in **esbuild/vite**. These are
  **dev-only build tooling** (the dev server's SSRF), not shipped to users and
  not present in the deployed static site. The fix requires a major Vite upgrade
  (breaking); deferred until a deliberate tooling bump, as there is no production
  exposure.

## Reporting
Found a vulnerability? Please email the address in the Impressum (see the app
footer) rather than opening a public issue.
