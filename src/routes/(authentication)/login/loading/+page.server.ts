import { getAllProviderData } from '$lib/login-registry';

export const load = async () => {
  const providers = getAllProviderData();
  return {
    providers: providers,
  };
};
