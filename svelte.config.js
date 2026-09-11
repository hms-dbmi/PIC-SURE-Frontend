import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

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

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte'],
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess()],
  compilerOptions: {
    runes: true,
  },
  vitePlugin: {
    inspector: true,
  },
  kit: {
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
        'script-src': ['self', 'https://*.googletagmanager.com', ...extra('CSP_EXTRA_SCRIPT_SRC')],
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
  },
};
export default config;
