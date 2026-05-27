import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Set SINGLE=1 to bundle everything into one self-contained dist/index.html
// that can be opened directly from disk (file://) without a server.
const single = process.env.SINGLE === '1';

export default defineConfig({
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  server: { host: true, port: 5173 },
});
