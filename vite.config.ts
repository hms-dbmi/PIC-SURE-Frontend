import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    allowedHosts: ['.harvard.edu'],
  },
  plugins: [tailwindcss(), sveltekit()],
  build: {
    rollupOptions: {
      maxParallelFileOps: 10,
    },
    sourcemap: true,
  },
});
