import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    // Unless noted, the options in this section are only applied to dev.
    // See more details here: https://vite.dev/config/server-options#server-proxy
    allowedHosts: ['.harvard.edu'],
    // Enable proxy for local dev mock servers
    // proxy: {
    //   '/picsure': 'http://localhost:9000',
    //   '//picsure': 'http://localhost:9000',
    //   '/psama': 'http://localhost:9000',
    //   '//psama': 'http://localhost:9000',
    // },
  },
  plugins: [tailwindcss(), sveltekit()],
  build: {
    rollupOptions: {
      maxParallelFileOps: 10,
    },
    sourcemap: true,
  },
});
