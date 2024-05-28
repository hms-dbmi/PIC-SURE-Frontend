import type { AuthData } from '$lib/models/AuthProvider';

const providerRegistry: AuthData[] = [];

export function registerProvider(providerModule: AuthData) {
  if (!providerModule.name) {
    throw new Error('Provider name is required');
  }
  if (!providerModule.enabled) {
    throw new Error('Provider must be enabled');
  }
  let existingProviders = providerRegistry.find(
    (provider) => provider.name === providerModule.name,
  );
  console.log('Existing Providers:', existingProviders);
  if (existingProviders && existingProviders.length > 0) {
    existingProviders.forEach((provider) => {
      if ((provider.connection = providerModule.connection)) {
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
