import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
});
