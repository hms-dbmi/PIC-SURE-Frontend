import * as api from './api';
import { LocalServer } from './paths';

import type { ConfigCache } from './models/Configuration';
import { mapFeatures, mapSettings, getBrandingFromJSON, defaults } from './models/Configuration';

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
let branding = $state(defaults.branding);
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
  branding = getBrandingFromJSON(PROJECT_HOSTNAME);
  configRequest = api
    .get(LocalServer.Configs)
    .then((configResp: ConfigCache) => {
      features = mapFeatures(configResp.features);
      settings = mapSettings(configResp.settings);
    })
    .catch(() => {
      configError = 'Configuration could not be loaded. Some features may be unavailable.';
    });
  loading = configRequest;
  return configRequest;
}
