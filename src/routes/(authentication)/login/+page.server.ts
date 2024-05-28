import { getAllProviders } from '$lib/login-registry';
import type { AuthData } from '$lib/models/AuthProvider';

function serializeMap(map: Map<any, any>) {
  return Array.from(map.entries()).map(([key, value]) => [
    JSON.stringify(key), // Convert key to string
    value,
  ]);
}

export const load = async () => {
  const providers = getAllProviders();
  console.log('Providers:', providers);
  return {
    providers: providers,
  };
};
