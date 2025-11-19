import * as api from './api';
import { LocalServer } from './paths';

import { BDCPrivileges, PicsurePrivileges } from './models/Privilege';
import type { Route } from './models/Route';
import type { ConfigCache } from './models/Configuration';
import { mapFeatures, mapSettings, getBrandingFromJSON, defaults } from './models/Configuration';

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

export const routes: Route[] = [
  {
    path: '/dashboard',
    text: 'Data Dashboard',
    feature: 'dashboard',
  },
  {
    path: '/discover',
    text: 'Discover',
    feature: 'discover',
  },
  {
    path: '/explorer',
    text: 'Explore',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
  },
  {
    path: '/collaborate',
    text: 'Collaborate',
    feature: 'collaborate',
    privilege: [PicsurePrivileges.QUERY],
  },
  {
    path: '/analyze/api',
    text: 'Prepare for Analysis',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
    feature: 'analyzeApi',
  },
  {
    path: '/analyze/analysis',
    text: 'Analyze',
    privilege: [PicsurePrivileges.QUERY],
    feature: 'analyzeAnalysis',
  },
  {
    path: '/dataset',
    text: 'Manage Datasets',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.NAMED_DATASET],
  },
  {
    path: '/dataset/request',
    text: 'Data Request',
    privilege: [PicsurePrivileges.DATA_ADMIN],
    feature: 'dataRequests',
  },
  {
    path: '/admin/configuration',
    text: 'Configuration',
    privilege: [PicsurePrivileges.SUPER],
  },
  {
    path: '/admin/manual-role',
    text: 'Manual Role',
    privilege: [PicsurePrivileges.ADMIN],
    feature: 'manualRole',
  },
  { path: '/admin/users', text: 'Manage Users', privilege: [PicsurePrivileges.ADMIN] },
  { path: '/help', text: 'Help' },
];

export const auth = {
  auth0Tenant: import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab',
};

let loading = $state(Promise.resolve());
let features = $state(mapFeatures([]));
let settings = $state(mapSettings([]));
let branding = $state(defaults.branding);

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
};

export async function getConfigs(): Promise<void> {
  branding = getBrandingFromJSON(PROJECT_HOSTNAME);
  loading = api.get(LocalServer.Configs).then((configResp: ConfigCache) => {
    features = mapFeatures(configResp.features);
    settings = mapSettings(configResp.settings);
    console.log('New config data from server', {
      features: { ...config.features },
      settings: { ...config.settings },
      branding: { ...config.branding },
    });
  });
  return loading;
}
