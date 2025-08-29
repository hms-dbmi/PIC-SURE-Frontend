import { writable, readable, type Readable, type Writable } from 'svelte/store';

import {
  features as initFeatures,
  settings as initSettings,
  auth as initAuth,
  defaultBranding,
  type BrandingConfig,
  loadBrandingConfigs,
} from '$lib/configuration';

export const branding: Writable<BrandingConfig> = writable(defaultBranding);
export const features: Writable<typeof initFeatures> = writable(initFeatures);
export const settings: Writable<typeof initSettings> = writable(initSettings);
export const auth: Readable<typeof initAuth> = readable(initAuth);

export function initializeBranding() {
  branding.set(loadBrandingConfigs());
}
