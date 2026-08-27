import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Deployment-specific CSP sources, space-separated, set at build time. Empty for BDC and
// the AIO - their policy is fully covered by the directives below. AIM-AHEAD sets these to
// add its own domains without widening every other deployment's policy.
const extra = (name) => {
  const sources = (process.env[name] ?? '').split(/\s+/).filter(Boolean);
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
    // The CSP for HTML responses is owned here, not by httpd, because killing 'unsafe-inline'
    // needs a per-response nonce and httpd cannot produce one that matches what SvelteKit
    // renders. The vhosts set a strict default-src 'none' floor for everything that arrives
    // without a CSP (the API, static assets, httpd's own error pages) and defer to this one.
    // Nonce mode is required, not preferred: app.html seeds Plotly's stylesheet element with
    // %sveltekit.nonce%, and SvelteKit rejects that placeholder under prerendering.
    csp: {
      mode: 'nonce',
      directives: {
        'default-src': ['self'],
        'base-uri': ['self'],
        'object-src': ['none'],
        // Neither form-action nor base-uri falls back to default-src; ZAP flags their absence.
        // form-action is safe for login: every IdP handoff is a top-level window.location
        // navigation, which form-action does not govern, and no <form> here sets an action.
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        // Icon fonts are inlined as data: URIs by the build; font-src falls back to
        // default-src 'self', which does not cover data:, so they need saying explicitly.
        // The current production policy omits this and blocks them.
        'font-src': ['self', 'data:'],
        'script-src': ['self', 'https://*.googletagmanager.com', ...extra('CSP_EXTRA_SCRIPT_SRC')],
        'style-src': ['self', ...extra('CSP_EXTRA_STYLE_SRC')],
        // Injected <style> elements stay nonce-only via style-src above; this covers style
        // ATTRIBUTES, which have no nonce mechanism in CSP at all. Skeleton's <Toaster> renders
        // one server-side on every page (data-scope="toast"), from inside the library, so there
        // is no CSSOM seam to route it through. Our own code no longer relies on this - see the
        // css() attachment in $lib/utilities/style - but the exception cannot be dropped while
        // Skeleton owns that markup. script-src carries no exception of any kind.
        'style-src-attr': ['unsafe-inline'],
        'img-src': [
          'self',
          // No bundled asset needs data:, but branding.logo.src is runtime config and an
          // operator may supply a data: URI; blob: is for generated plot images.
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
