import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default () => {
  return defineConfig({
    server: {
      allowedHosts: ['.harvard.edu'],
    },
    plugins: [sveltekit(), purgeCss()],
    build: {
      rollupOptions: {
        maxParallelFileOps: 10,
      },
      sourcemap: false,
    },
  });
};
