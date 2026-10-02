import { getAllProviderData } from '#lib/AuthProviderRegistry.js';

export const load = async () => {
  const providers = getAllProviderData();
  return {
    providers: providers,
  };
};
