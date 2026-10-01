import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import type { ViteUserConfig } from 'vitest/config';

const isProd = process.env.NODE_ENV === 'production';

const extra = (name) => {
  const sources = (process.env[name] ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((source) => source.replace(/^'(.*)'$/, '$1'));
  const unsafe = sources.filter((source) => source.startsWith('unsafe-'));

  if (unsafe.length) {
    throw new Error(`${name} must not reintroduce ${unsafe.join(', ')} (ALS-9583)`);
  }

  return sources;
};

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    sveltekit({
      extensions: ['.svelte'],
      // Consult https://kit.svelte.dev/docs/integrations#preprocessors
      // for more information about preprocessors
      preprocess: [vitePreprocess()],
      compilerOptions: { runes: true },
      vitePlugin: { inspector: true },
      // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
      // If your environment is not supported or you settled on a specific environment, switch out the adapter.
      // See https://kit.svelte.dev/docs/adapters for more information about adapters.
      adapter: adapter({ addressHeader: 'X-Forwarded-For' }),

      csp: {
        mode: 'nonce',
        directives: {
          'default-src': ['self'],
          'base-uri': ['self'],
          'object-src': ['none'],
          'form-action': ['self'],
          'frame-ancestors': ['none'],
          'font-src': ['self', 'data:'],
          'script-src': [
            'self',
            'https://*.googletagmanager.com',
            // Turnstile loads api.js and renders its challenge in an iframe from this origin
            'https://challenges.cloudflare.com',
            ...extra('CSP_EXTRA_SCRIPT_SRC'),
          ],
          'frame-src': ['self', 'https://challenges.cloudflare.com'],
          'style-src': ['self', ...extra('CSP_EXTRA_STYLE_SRC')],
          'style-src-attr': ['unsafe-inline'],
          'img-src': [
            'self',
            'data:',
            'blob:',
            'https://*.google-analytics.com',
            'https://*.googletagmanager.com',
            ...extra('CSP_EXTRA_IMG_SRC'),
          ],
          'connect-src': [
            'self',
            'https://*.google-analytics.com',
            'https://*.analytics.google.com',
            'https://*.googletagmanager.com',
            ...extra('CSP_EXTRA_CONNECT_SRC'),
          ],
        },
      },
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
