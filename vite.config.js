import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { configDefaults } from 'vitest/config';

// Set SINGLE=1 to bundle everything into one self-contained dist/index.html
// that can be opened directly from disk (file://) without a server.
const single = process.env.SINGLE === '1';

export default defineConfig({
  // Relative asset paths so the build works both on GitHub Pages (served under
  // /<repo>/) and when opened directly from disk.
  base: './',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: { chunkSizeWarningLimit: 900 },
  server: { host: true, port: 5173 },
  // km1-app/ is a separate project with its own test runners (Jest for the
  // Expo app, node:test for the database rules) and its own CI workflow
  // (km1-app.yml). Vitest here must not pick up its test files.
  test: { exclude: [...configDefaults.exclude, 'km1-app/**'] },
});
