import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default () => {
  return defineConfig({
    plugins: [sveltekit(), purgeCss()],
    build: {
      rollupOptions: {
        maxParallelFileOps: 10,
      },
    },
  });
};
