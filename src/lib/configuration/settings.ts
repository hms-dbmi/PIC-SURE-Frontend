export const defaultSettings: {
  variantExplorer: {
    type: string;
    maxCount: number;
    excludeColumns: string[];
  };
  distributionExplorer: {
    graphColors: string[];
  };
  google: {
    analytics: string;
    tagManager: string;
  };
  maxDataPointsForExport: number;
  auth0Tenant: string;
} = {
  variantExplorer: {
    type: 'aggregate',
    maxCount: 0,
    excludeColumns: [],
  },
  distributionExplorer: {
    graphColors: [],
  },
  google: {
    analytics: '',
    tagManager: '',
  },
  maxDataPointsForExport: 0,
  auth0Tenant: '',
};

export type SettingsConfig = typeof defaultSettings;

export function loadSettingsConfig(settings: Partial<SettingsConfig>): SettingsConfig {
  return { ...defaultSettings, ...settings };
}
