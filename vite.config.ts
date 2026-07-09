import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import type { ViteUserConfig } from 'vitest/config';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [tailwindcss(), sveltekit()];
  if (!isProd) {
    const { svelteTesting } = await import('@testing-library/svelte/vite');
    plugins.push(svelteTesting());
  }

  return {
    // Vite always loads the root .env unconditionally, on top of whatever .env.[mode]
    // provides - which lets the real (gitignored) root .env leak into e2e builds even
    // though Playwright loads .env.test on its own. Playwright's webServer command passes
    // --mode test (see playwright.config.ts), so redirect envDir to a folder with no .env
    // files for that mode; the values Playwright needs are already in process.env via its
    // own dotenv.config() call, which always wins over file-based env anyway.
    envDir: mode === 'test' ? './tests/end-to-end/env-isolated' : import.meta.dirname,
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
      sourcemap: false,
    },
  };
});
