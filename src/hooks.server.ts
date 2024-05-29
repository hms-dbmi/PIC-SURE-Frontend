import { registerProviderData } from './lib/login-registry';
import type { AuthData } from './lib/models/AuthProvider';

const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';

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
          const configKey = key.replace(providerConfigPrefix, '').toLowerCase();
          authProviderConfigInterface[configKey?.toLocaleLowerCase()] = import.meta.env[key];
        });
      authProviderConfigInterface.enabled = true;
      authProviderConfigInterface.name = uppercaseProviderName;
      console.log('authProviderConfigInterface:', authProviderConfigInterface);
      registerProviderData(authProviderConfigInterface);
    } catch (error) {
      console.error(`Error registering auth provider "${uppercaseProviderName}":`, error);
    }
  }
}

registerEnabledProviders(enabledProviders, PROVIDER_PREFIX);
