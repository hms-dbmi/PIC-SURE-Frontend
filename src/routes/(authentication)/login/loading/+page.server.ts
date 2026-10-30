import { getAllProviderData } from '#lib/auth/providerRegistry.ts';

export const load = async () => {
  const providers = getAllProviderData();
  return {
    providers: providers,
  };
};
