import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production (cardcompass.de) is served from the domain root with pretty URLs.
// The GitHub-Pages design preview lives under /Test-Code/cardcompass/, uses hash
// routing and is kept out of search engines (see package.json "build:preview").
const preview = process.env.VITE_PREVIEW === '1';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cc-robots',
      transformIndexHtml: (html) => html.replace('<!--cc:robots-->', preview ? '<meta name="robots" content="noindex, nofollow" />' : ''),
    },
  ],
  base: process.env.CC_BASE || '/',
  build: { chunkSizeWarningLimit: 700 },
});
