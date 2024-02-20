import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default (mode: string) => {
  // Extends 'process.env.*' with VITE_*-variables from '.env.(mode=production|development)'
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return defineConfig({
    plugins: [sveltekit(), purgeCss()],
  });
};
