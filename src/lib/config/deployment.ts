// Per-deployment values baked in at build time (each stack builds its own image).

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

export const AUTH0_TENANT: string = import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab';

// Read per call, not at import, so tests can stub VITE_TURNSTILE_SITE_KEY per case.
export function turnstileSiteKey(): string {
  return import.meta.env?.VITE_TURNSTILE_SITE_KEY || '';
}
