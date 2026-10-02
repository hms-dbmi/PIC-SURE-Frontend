import { getAllProviderData } from '#lib/AuthProviderRegistry.ts';

export const load = async () => {
  const providers = getAllProviderData();
  return {
    providers: providers,
  };
};
