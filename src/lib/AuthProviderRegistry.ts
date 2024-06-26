import type { AuthData } from '$lib/models/AuthProvider';
import AuthProvider from '$lib/models/AuthProvider';

const providerDataRegistry: AuthData[] = [];

export function registerProviderData(providerModule: AuthData) {
  if (!providerModule.name) {
    throw new Error('Provider name is required');
  }

  if (!providerModule.enabled) {
    throw new Error('Provider must be enabled');
  }

  const existingProvider = providerDataRegistry.find(
    (provider) => provider.name === providerModule.name,
  );
  // TODO: Check other properties for conflicts
  if (
    existingProvider &&
    existingProvider.connection &&
    providerModule.connection &&
    existingProvider.connection === providerModule.connection
  ) {
    throw new Error(`Provider "${providerModule.name}" is already registered`);
  }
  console.log('Registering new provider:  \n', providerModule);
  providerDataRegistry.push(providerModule);
}

export function getProviderData(providerName: string) {
  return providerDataRegistry.find((provider) => provider.name === providerName);
}

export function getAllProviderData() {
  return providerDataRegistry;
}

export async function createInstance(authData: AuthData): Promise<AuthProvider> {
  try {
    const providerModule = await import(`./auth/${authData.type}.ts`);
    const ProviderClass = providerModule.default;
    const providerInstance = new ProviderClass(authData);
    return providerInstance;
  } catch (e) {
    console.error('Failed to register provider:', e);
    return new AuthProvider(authData); //TODO - return an error of somekind
  }
}
