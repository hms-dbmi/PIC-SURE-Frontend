import { type Writable, writable } from 'svelte/store';

import * as configJson from '../assets/configuration.json' assert { type: 'json' };

import {
  type BrandingConfig,
  type FeaturesConfig,
  type SettingsConfig,
  defaultBranding,
  defaultFeatures,
  defaultSettings,
  loadBrandingConfigs,
  loadFeaturesConfig,
  loadSettingsConfig,
} from '$lib/configuration';

export const branding: Writable<BrandingConfig> = writable(defaultBranding);
export const features: Writable<FeaturesConfig> = writable(defaultFeatures);
export const settings: Writable<SettingsConfig> = writable(defaultSettings);

export function initializeBranding() {
  branding.set(loadBrandingConfigs(configJson.branding));
  features.set(loadFeaturesConfig(configJson.features));
  settings.set(loadSettingsConfig(configJson.settings));
}
