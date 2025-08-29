export const defaultFeatures: {
  federated: boolean;
  tour: {
    explorer: boolean;
    discover: boolean;
  };
  explorer: {
    exportPage: boolean;
    exportIcon: boolean;
    allowDownload: boolean;
    variantExplorer: boolean;
    hiierarchy: boolean;
    pfbExport: boolean;
    sampleIdCheckbox: boolean;
    cohortDetails: boolean;
  };
  login: {
    open: boolean;
  };
  analyzeApi: boolean;
  analyzeAnalysis: boolean;
  dataRequests: boolean;
  manualRole: boolean;
  query: {
    SNPQuery: boolean;
    GENEQuery: boolean;
  };
  requireConsents: boolean;
  useQueryTemplate: boolean;
  discover: boolean;
  collaborate: boolean;
  distributionExplorer: {
    explorer: boolean;
    discover: boolean;
  };
  dashboard: boolean;
  dashboardDrawer: boolean;
  confirmDownload: boolean;
  termsOfService: boolean;
  enforceTermsOfService: boolean;
} = {
  federated: false,
  tour: {
    explorer: true,
    discover: false,
  },
  explorer: {
    exportPage: false,
    exportIcon: false,
    allowDownload: true,
    variantExplorer: false,
    hiierarchy: false,
    pfbExport: true,
    sampleIdCheckbox: false,
    cohortDetails: false,
  },
  login: {
    open: false,
  },
  analyzeApi: true,
  analyzeAnalysis: false,
  dataRequests: false,
  manualRole: false,
  query: {
    SNPQuery: false,
    GENEQuery: false,
  },
  requireConsents: false,
  useQueryTemplate: false,
  discover: false,
  collaborate: false,
  distributionExplorer: {
    explorer: true,
    discover: false,
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
