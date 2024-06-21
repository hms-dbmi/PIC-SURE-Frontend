import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default (mode: string) => {
  return defineConfig({
    plugins: [sveltekit(), purgeCss()],
  });
};
