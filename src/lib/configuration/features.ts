export const defaultFeatures: {
  federated: boolean;
  explorer: {
    allowExport: boolean;
    allowDownload: boolean;
    exportsEnableExport: boolean;
    variantExplorer: boolean;
    distributionExplorer: boolean;
    enableTour: boolean;
    authTour: string;
    enableHierarchy: boolean;
    enablePfbExport: boolean;
    enableSampleIdCheckbox: boolean;
    enableCohortDetails: boolean;
  };
  login: {
    open: boolean;
  };
  analyzeApi: boolean;
  analyzeAnalysis: boolean;
  dataRequests: boolean;
  manualRole: boolean;
  enableSNPQuery: boolean;
  enableGENEQuery: boolean;
  requireConsents: boolean;
  useQueryTemplate: boolean;
  discover: boolean;
  collaborate: boolean;
  discoverFeautures: {
    enableTour: boolean;
    openTour: string;
    distributionExplorer: boolean;
  };
  dashboard: boolean;
  dashboardDrawer: boolean;
  confirmDownload: boolean;
  termsOfService: boolean;
  enforceTermsOfService: boolean;
} = {
  federated: false,
  explorer: {
    allowExport: false,
    allowDownload: true,
    exportsEnableExport: false,
    variantExplorer: false,
    distributionExplorer: false,
    enableTour: true,
    authTour: '',
    enableHierarchy: false,
    enablePfbExport: true,
    enableSampleIdCheckbox: false,
    enableCohortDetails: false,
  },
  login: {
    open: false,
  },
  analyzeApi: true,
  analyzeAnalysis: false,
  dataRequests: false,
  manualRole: false,
  enableSNPQuery: false,
  enableGENEQuery: false,
  requireConsents: false,
  useQueryTemplate: false,
  discover: false,
  collaborate: false,
  discoverFeautures: {
    enableTour: true,
    openTour: '',
    distributionExplorer: false,
  },
  dashboard: false,
  dashboardDrawer: false,
  confirmDownload: false,
  termsOfService: false,
  enforceTermsOfService: false,
};

export type FeaturesConfig = typeof defaultFeatures;

export function loadFeaturesConfig(features: Partial<FeaturesConfig>): FeaturesConfig {
  return { ...defaultFeatures, ...features };
}
