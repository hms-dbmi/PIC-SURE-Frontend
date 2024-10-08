import type { LayoutServerLoad } from './$types';
import { getAllProviderData } from '$lib/AuthProviderRegistry.ts';

export const load: LayoutServerLoad = async () => {
  const providers = getAllProviderData();
  return {
    providers: providers,
  };
};
