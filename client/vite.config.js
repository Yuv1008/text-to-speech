import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Read env vars (.env / .env.example) from the project root instead of client/,
// so client and server share one documented set of variables (see ../.env.example).
export default defineConfig({
  plugins: [react()],
  envDir: fileURLToPath(new URL('..', import.meta.url)),
});
