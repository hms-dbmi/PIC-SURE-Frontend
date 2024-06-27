import { writable, type Writable } from 'svelte/store';
import defaultConfigFile from '$lib/configuration/default.json';

export const branding = defaultConfigFile.branding;

const enableWritable = import.meta.env.MODE === 'local' || import.meta.env.MODE === 'test';
const configValues = {
  features: defaultConfigFile.features,
  settings: defaultConfigFile.settings,
  resources: {
    hpds: import.meta.env?.VITE_RESOURCE_HPDS || '',
  }
};

const _config: Writable<typeof configValues> = writable(configValues);
export const config: Writable<typeof configValues> = {
  subscribe: _config.subscribe,
  set: enableWritable ? _config.set : () => {},
  update: enableWritable ? _config.update : () => {},
};
