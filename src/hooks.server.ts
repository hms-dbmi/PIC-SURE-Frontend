import type { HandleServerError } from '@sveltejs/kit';
import { registerProviderData } from './lib/AuthProviderRegistry';
import type { AuthData } from './lib/models/AuthProvider';

const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';

// Runs when the server starts. Registers all enabled auth providers in the .env file.
// Providers are registered in the AuthProviderRegistry on the server and used to build
// AuthProvider instances for each psrovider when required during login/logout.
const enabledProviders = Object.keys(import.meta.env)
  .filter((key) => key.startsWith(PROVIDER_PREFIX) && import.meta.env[key] === 'true')
  .map((key) => key.replace(PROVIDER_PREFIX, '').toUpperCase());
console.log('enabledProviders:', enabledProviders);

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
          authProviderConfigInterface[configKey] = import.meta.env[key];
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

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  console.error('Server error: ', error, event, status, message);
  return {
    message: message || 'An unknown server error occurred.',
  };
};
