import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default () => {
  return defineConfig({
    server: {
      allowedHosts: ['.harvard.edu'],
    },
    plugins: [sveltekit()],
    build: {
      rollupOptions: {
        maxParallelFileOps: 10,
      },
      sourcemap: false,
    },
  });
};
