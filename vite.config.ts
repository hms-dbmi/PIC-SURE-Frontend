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
      // Forwards to `npm run mock-api` (tests/end-to-end/mock-server), which serves fixture
      // data from tests/end-to-end/mock-data.ts so `npm run dev` has something to talk to.
      // The double-slash variants cover VITE_ORIGIN values with a trailing slash (see
      // configCache.ts, which builds `${ORIGIN}/${path}`). Dev-only: this never applies to
      // Playwright's build+preview run (mode 'test'), which mocks routes per-test instead.
      proxy:
        mode === 'test'
          ? undefined
          : {
              '/picsure': 'http://localhost:9000',
              '//picsure': 'http://localhost:9000',
              '/psama': 'http://localhost:9000',
              '//psama': 'http://localhost:9000',
            },
    },
    plugins,
    build: {
      sourcemap: false,
    },
  };
});
