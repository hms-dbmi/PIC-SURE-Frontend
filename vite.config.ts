import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { csp } from './csp.config.js';
import { configDefaults, type ViteUserConfig } from 'vitest/config';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    sveltekit({
      extensions: ['.svelte'],
      preprocess: [vitePreprocess()],
      compilerOptions: { runes: true },
      inspector: true,
      adapter: adapter(),
      csp,
    }),
  ];

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
      setupFiles: ['./tests/support/setup.ts'],
      // Undo vi.stubGlobal/vi.stubEnv after each test so stubs can't leak into later tests
      unstubGlobals: true,
      unstubEnvs: true,
      // Without `include`, vitest only reports files the tests import, so a new untested file
      // would be missing from lcov instead of showing 0%. Keep in step with coverage.include
      // in .github/risk/policy.json.
      coverage: {
        include: ['src/**/*.{ts,js,svelte}'],
        exclude: ['**/*.d.ts', '**/*.{test,spec}.{ts,js}'],
      },
      // Every Vitest file belongs to exactly one project; Playwright specs under
      // tests/end-to-end match neither, so a bare `vitest` never collects them.
      projects: [
        {
          extends: true,
          test: {
            name: 'node',
            environment: 'node',
            include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/support/**/*.test.ts'],
            exclude: [...configDefaults.exclude, '**/*.svelte.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'client',
            environment: 'happy-dom',
            include: ['src/**/*.svelte.test.ts'],
          },
        },
      ],
    } satisfies ViteUserConfig['test'],
    server: {
      // Forwards to `npm run mock-api` (tests/end-to-end/mock-server), which serves fixture
      // data from tests/support/mock-data.ts so `npm run dev` has something to talk to.
      // The double-slash variants cover VITE_ORIGIN values with a trailing slash (see
      // config/server/cache.ts, which builds `${ORIGIN}/${path}`). Dev-only: this never applies to
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
