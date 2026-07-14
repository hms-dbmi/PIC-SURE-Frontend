import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { registerProviderData } from './lib/AuthProviderRegistry';
import type { AuthData } from './lib/models/AuthProvider';
import { getConfig } from './lib/server/configCache';

const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';

// Runs when the server starts. Registers all enabled auth providers in the .env file.
// Providers are registered in the AuthProviderRegistry on the server and used to build
// AuthProvider instances for each psrovider when required during login/logout.
const enabledProviders = Object.keys(import.meta.env)
  .filter((key) => key.startsWith(PROVIDER_PREFIX) && import.meta.env[key] === 'true')
  .map((key) => key.replace(PROVIDER_PREFIX, '').toUpperCase())
  .filter((key) => !key.includes('_'));

async function registerEnabledProviders(enabledProviders: string[], viteProviderPrefix: string) {
  for (const providerName of enabledProviders) {
    const uppercaseProviderName = providerName.toUpperCase();
    const providerConfigPrefix = `${viteProviderPrefix}${uppercaseProviderName}_`;
    try {
      const authProviderConfigInterface = {} as AuthData;

      Object.keys(import.meta.env)
        .filter((key) => key.startsWith(providerConfigPrefix))
        .map((key) => {
          const configKey = key.replace(providerConfigPrefix, '')?.toLowerCase();
          const value =
            import.meta.env[key] === 'true'
              ? true
              : import.meta.env[key] === 'false'
                ? false
                : import.meta.env[key];
          authProviderConfigInterface[configKey] = value;
        });
      authProviderConfigInterface.enabled = true;
      authProviderConfigInterface.name = uppercaseProviderName;
      registerProviderData(authProviderConfigInterface);
    } catch (error) {
      console.error(`Error registering auth provider "${uppercaseProviderName}":`, error);
    }
  }
}

registerEnabledProviders(enabledProviders, PROVIDER_PREFIX);

// In test mode (Playwright's --mode test build), +layout.server.ts can apply a
// per-request config override read from a cookie. configuration.svelte.ts's config
// state is a module-scope singleton though - concurrent requests handled by this one
// process would otherwise be able to interleave between "apply override" and
// "render", leaking one test's config into another's SSR output. Serializing
// request handling here closes that window. No-op outside test mode - production
// config never varies per request, so nothing needs it.
let requestQueue: Promise<unknown> = Promise.resolve();

export const handle: Handle = async ({ event, resolve }) => {
  if (import.meta.env.MODE !== 'test') return resolve(event);

  const result = requestQueue.then(() => resolve(event));
  requestQueue = result.catch(() => {});
  return result;
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  console.error('Server error: ', error, event, status, message);
  return {
    message: message || 'An unknown server error occurred.',
  };
};

export const init: ServerInit = async () => {
  // Pre-warm the cache when server starts, in dev mode it's on first request.
  // Skipped in test mode: e2e tests supply config per-request via a cookie (see
  // +layout.server.ts's TEST_CONFIG_COOKIE handling), so the real API is never
  // consulted there - pre-warming here would just block server startup retrying
  // against a URL that doesn't resolve in the test environment (VITE_ORIGIN is
  // intentionally blank in .env.test).
  if (import.meta.env.MODE === 'test') return;
  await getConfig();
};
