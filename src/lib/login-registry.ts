import type { AuthData } from '$lib/models/AuthProvider';

const providerRegistry: AuthData[]  = [];

export function registerProvider(providerModule: AuthData) {
  if (!providerModule.name) {
    throw new Error('Provider name is required');
  }
  if (!providerModule.enabled) {
    throw new Error('Provider must be enabled');
  }
  if (providerRegistry.find(provider => provider.name === providerModule.name)) {
    throw new Error(`Provider "${providerModule.name}" is already registered`);
  }
  providerRegistry.push(providerModule);
}

export function getProvider(providerName: string) {
  return providerRegistry.find(provider => provider.name === providerName);
}

export function getAllProviders() {
  return providerRegistry;
}