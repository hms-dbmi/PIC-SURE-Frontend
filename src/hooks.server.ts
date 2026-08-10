import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { registerProviderData } from './lib/AuthProviderRegistry';
import type { AuthData } from './lib/models/AuthProvider';
import { getConfig } from './lib/server/configCache';
import { runWithConfig } from './lib/configuration.svelte';

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

// Wraps each request in an isolated config store so concurrent requests can't
// observe each other's config (see configuration.svelte.ts).
export const handle: Handle = async ({ event, resolve }) => {
  return runWithConfig(() => resolve(event));
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  console.error('Server error: ', error, event, status, message);
  return {
    message: message || 'An unknown server error occurred.',
  };
};

export const init: ServerInit = () => {
  // Skipped in test mode: e2e tests supply config per-request via cookie, and
  // VITE_ORIGIN is blank in .env.test so the real API won't resolve anyway.
  if (import.meta.env.MODE === 'test') return;

  // Not awaited: delaying init() would hold up the server accepting traffic.
  // Requests that arrive early share the in-flight fetch via configCache.
  getConfig();
};
