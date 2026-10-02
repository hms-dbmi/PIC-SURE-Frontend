/**
 * Arbitrary build-time sources, typed loosely so they spread into any directive.
 * @param {string} name
 * @returns {any[]}
 */
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

/** @type {import('@sveltejs/kit/vite').Config['csp']} */
export const csp = {
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
};
