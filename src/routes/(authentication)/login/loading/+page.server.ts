import { getAllProviderData } from '$lib/AuthProviderRegistry';

export const load = async () => {
  const providers = getAllProviderData();
  return {
    providers: providers,
  };
};
