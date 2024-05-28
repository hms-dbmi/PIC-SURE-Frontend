import type { AuthData } from '$lib/models/AuthProvider';

const providerRegistry: AuthData[] = [];

export function registerProvider(providerModule: AuthData) {
  if (!providerModule.name) {
    throw new Error('Provider name is required');
  }
  if (!providerModule.enabled) {
    throw new Error('Provider must be enabled');
  }
  const existingProviders = providerRegistry.find(
    (provider) => provider.name === providerModule.name,
  );
  console.log('Existing Providers:', existingProviders);
  if (existingProviders && existingProviders.length > 0) {
    existingProviders.forEach((provider: AuthData) => {
      if (
        provider.connection &&
        providerModule.connection &&
        provider.connection === providerModule.connection
      ) {
        throw new Error(`Provider "${providerModule.name}" is already registered`);
      }
    });
  }
  providerRegistry.push(providerModule);
}

export function getProvider(providerName: string) {
  return providerRegistry.find((provider) => provider.name === providerName);
}

export function getAllProviders() {
  return providerRegistry;
}
