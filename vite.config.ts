import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import type { ViteUserConfig } from 'vitest/config';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig(async () => {
  const plugins: PluginOption[] = [tailwindcss(), sveltekit()];
  if (!isProd) {
    const { svelteTesting } = await import('@testing-library/svelte/vite');
    plugins.push(svelteTesting());
  }

  return {
    test: {
      setupFiles: ['./tests/component/setup.ts'],
    } satisfies ViteUserConfig['test'],
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
    plugins,
    build: {
      rollupOptions: {
        maxParallelFileOps: 10,
      },
      sourcemap: false,
    },
  };
});
