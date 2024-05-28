import { getAllProviders } from '$lib/login-registry';

export const load = async () => {
  const providers = getAllProviders();
  return {
    providers: providers,
  };
};
