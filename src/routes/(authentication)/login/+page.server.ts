import { getAllProviderData } from '#lib/auth/providerRegistry.ts';
import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';

export const load = async () => {
  let providers = getAllProviderData();
  const altProviders: AuthData[] = [];
  providers = providers.reduce((mainProviders: AuthData[], current: AuthData) => {
    if (current.alt) {
      altProviders.push(current);
    } else {
      mainProviders.push(current);
    }
    return mainProviders;
  }, []);
  return {
    providers: providers,
    altProviders: altProviders,
  };
};
