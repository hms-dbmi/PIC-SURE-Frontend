import { LocalServer } from './paths';

import type { ConfigCache } from './models/Configuration';
import { mapFeatures, mapSettings, mapBranding } from './models/Configuration';

export { routes } from './routes';

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

export const auth = {
  auth0Tenant: import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab',
};

let loading = $state(Promise.resolve());
let features = $state(mapFeatures([]));
let settings = $state(mapSettings([]));
let branding = $state(mapBranding(PROJECT_HOSTNAME, []));
let configError = $state<string | null>(null);
let configRequest: Promise<void> | null = null;

export const config = {
  get loading() {
    return loading;
  },
  get features() {
    return features;
  },
  get settings() {
    return settings;
  },
  get branding() {
    return branding;
  },
  get error() {
    return configError;
  },
};

export async function getConfigs(): Promise<void> {
  if (configRequest) return configRequest;
  configRequest = import('./api')
    .then((api) => api.get(LocalServer.Configs))
    .then((configResp: ConfigCache) => {
      configResp.features.length > 0 && (features = mapFeatures(configResp.features));
      configResp.settings.length > 0 && (settings = mapSettings(configResp.settings));
      configResp.branding.length > 0 &&
        (branding = mapBranding(PROJECT_HOSTNAME, configResp.branding));
    })
    .catch(() => {
      configError = 'Configuration could not be loaded. Some features may be unavailable.';
    });
  loading = configRequest;
  return configRequest;
}
