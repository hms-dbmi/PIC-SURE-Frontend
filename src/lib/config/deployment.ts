// Per-deployment values baked in at build time (each stack builds its own image).

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

export const AUTH0_TENANT: string = import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab';

// Cloudflare Turnstile site key for the public API key form; empty disables the widget.
// A function rather than a constant so tests can stub the env var per case.
export function turnstileSiteKey(): string {
  return import.meta.env?.VITE_TURNSTILE_SITE_KEY || '';
}
