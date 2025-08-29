export const defaultSettings: {
  tour: {
    auth: string;
    open: string;
  };
  variantExplorer: {
    type: string;
    maxCount: number;
    excludeColumns: string[];
  };
  distributionExplorer: {
    graphColors: string[];
  };
  maxDataPointsForExport: number;
} = {
  tour: {
    auth: '',
    open: '',
  },
  variantExplorer: {
    type: 'aggregate',
    maxCount: 0,
    excludeColumns: [],
  },
  distributionExplorer: {
    graphColors: [],
  },
  maxDataPointsForExport: 0,
};

export type SettingsConfig = typeof defaultSettings;

export function loadSettingsConfig(settings: Partial<SettingsConfig>): SettingsConfig {
  return { ...defaultSettings, ...settings };
}
