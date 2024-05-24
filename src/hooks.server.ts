import { registerProvider } from './lib/login-registry';
import type AuthProvider from './lib/models/AuthProvider';
import type { AuthData, AuthProviderConstructor } from './lib/models/AuthProvider';

function mapProviderToData<T extends AuthProvider>(provider: T): Extract<T, AuthData> {
  return provider as Extract<T, AuthData>; 
}

const providerPrefix = 'VITE_AUTH_PROVIDER_MODULE_';
const enabledProviders = Object.keys(import.meta.env)
  .filter(key => key.startsWith(providerPrefix) && import.meta.env[key] === 'true')
  .map(key => key.replace(providerPrefix, '').toUpperCase());
console.log('Enabled providers:', enabledProviders);
for (const providerName of enabledProviders) {
  const uppercaseProviderName = providerName.toUpperCase();
  const providerConfigPrefix = `VITE_AUTH_PROVIDER_MODULE_${uppercaseProviderName}_`;
  try {
    const providerModule = await import(`./lib/auth/${uppercaseProviderName}.ts`);
    const ProviderClass = providerModule.default as AuthProviderConstructor;
    const providerInstance = new ProviderClass() as AuthProvider;
    Object.keys(import.meta.env).filter(key => key.startsWith(providerConfigPrefix)).map(key => {
      const configKey = key.replace(providerConfigPrefix, '').toLowerCase();
      providerInstance[configKey?.toLocaleLowerCase()] = import.meta.env[key];
    });
    providerInstance.enabled = true;
    providerInstance.name = uppercaseProviderName;
    let config = providerInstance.getConfig();
    registerProvider(config);
  } catch (error) {
    console.error(`Error registering auth provider "${uppercaseProviderName}":`, error);
  }
}
