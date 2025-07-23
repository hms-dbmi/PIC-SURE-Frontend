import { BDCPrivileges, PicsurePrivileges } from './models/Privilege';
import type { Route } from './models/Route';
import * as configJson from './assets/configuration.json' assert { type: 'json' };
import { ExportType } from './models/Variant';
import type {
  ExplorePageConfig,
  FooterConfig,
  HelpConfig,
  Indexable,
  LandingConfig,
  ResultsConfig,
  LoginConfig,
  SiteMapConfig,
  CodeBlockConfig,
  PrivacyConfig,
  AnalysisConfig,
  CollaborateConfig,
  DatasetRequestPageConfig,
} from './types';
import type { StatField } from '$lib/models/Stat';

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

export interface Branding {
  applicationName: string;
  logo: {
    alt: string;
    src: string;
  };
  statFields: { [key: string]: StatField[] };
  sitemap: SiteMapConfig[];
  footer: FooterConfig;
  explorePage: ExplorePageConfig;
  landing: LandingConfig;
  results: ResultsConfig;
  datasetRequestPage: DatasetRequestPageConfig;
  login: LoginConfig;
  help: HelpConfig;
  privacyPolicy: PrivacyConfig;
  analysisConfig: AnalysisConfig;
  collaborateConfig: CollaborateConfig;
  genomic?: {
    defaultGenomeBuild: string;
  };
}

export const branding: Branding = {
  applicationName: 'PIC‑SURE',
  statFields: {} as { [key: string]: StatField[] },
  logo: {
    alt: import.meta.env?.VITE_LOGO_ALT || 'PIC‑SURE',
    src: import.meta.env?.VITE_LOGO || '',
  },
  sitemap: [] as SiteMapConfig[],
  footer: {} as FooterConfig,
  explorePage: {
    tourSearchTerm: import.meta.env?.EXPLORE_TOUR_SEARCH_TERM || 'age',
  } as ExplorePageConfig,
  landing: {} as LandingConfig,
  datasetRequestPage: {} as DatasetRequestPageConfig,
  results: {} as ResultsConfig,
  login: {} as LoginConfig,
  help: {} as HelpConfig,
  privacyPolicy: {} as PrivacyConfig,
  analysisConfig: {} as AnalysisConfig,
  collaborateConfig: {} as CollaborateConfig,
};

export const initializeBranding = () => {
  branding.applicationName = configJson.applicationName;

  // Replace URLs in code blocks before assigning
  const codeBlocks: CodeBlockConfig = { ...configJson.explorePage.codeBlocks };
  Object.keys(codeBlocks).forEach((key: string) => {
    if (typeof codeBlocks[key] === 'string') {
      codeBlocks[key] = codeBlocks[key].replace('{{PICSURE_NETWORK_URL}}', PROJECT_HOSTNAME);
    }
  });

  branding.explorePage = {
    ...branding.explorePage,
    ...configJson.explorePage,
    codeBlocks,
  };
  branding.statFields = configJson.statFields;
  branding.landing = configJson.landing;
  branding.results = configJson.results;
  branding.datasetRequestPage = configJson.datasetRequestPage;
  branding.login = configJson.login;
  branding.help = configJson.help;
  branding.footer = configJson.footer;
  branding.sitemap = configJson.sitemap as SiteMapConfig[];
  branding.privacyPolicy = configJson.privacyPolicy;
  branding.analysisConfig = configJson.analysisPage;
  branding.collaborateConfig = configJson.collaboratePage;
  branding.genomic = configJson.genomic;
};

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
    path: '/collaborate',
    text: 'Collaborate',
    feature: 'collaborate',
    privilege: [PicsurePrivileges.QUERY],
  },
  {
    path: '/dataset/manage',
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

export const features: Indexable = {
  federated: import.meta.env?.VITE_FEDERATED === 'true',
  explorer: {
    allowExport: import.meta.env?.VITE_ALLOW_EXPORT === 'true',
    allowDownload: import.meta.env?.VITE_ALLOW_DOWNLOAD !== 'false', // default true
    exportsEnableExport: import.meta.env?.VITE_ALLOW_EXPORT_ENABLED === 'true',
    variantExplorer: import.meta.env?.VITE_VARIANT_EXPLORER === 'true',
    distributionExplorer: import.meta.env?.VITE_DIST_EXPLORER === 'true',
    enableTour: import.meta.env?.EXPLORER_TOUR !== 'false', // default true
    authTour: import.meta.env?.VITE_AUTH_TOUR_NAME ?? 'NHANES-Auth',
    enableHierarchy: import.meta.env?.VITE_ENABLE_HIERARCHY === 'true',
    enablePfbExport: import.meta.env?.VITE_DOWNLOAD_AS_PFB !== 'false', // default true
    enableSampleIdCheckbox: import.meta.env?.VITE_ENABLE_SAMPLE_ID_CHECKBOX === 'true',
    enableCohortDetails: import.meta.env?.VITE_ENABLE_COHORT_DETAILS === 'true',
  },
  login: {
    open: import.meta.env?.VITE_OPEN === 'true',
  },
  analyzeApi: import.meta.env?.VITE_ANALYZE_API !== 'false', // default true,
  analyzeAnalysis: import.meta.env?.VITE_ANALYZE_ANALYSIS === 'true', // default false,
  dataRequests: import.meta.env?.VITE_DATA_REQUESTS === 'true',
  manualRole: import.meta.env?.VITE_MANUAL_ROLE === 'true',
  enableSNPQuery: import.meta.env?.VITE_ENABLE_SNP_QUERY === 'true',
  enableGENEQuery: import.meta.env?.VITE_ENABLE_GENE_QUERY === 'true',
  requireConsents: import.meta.env?.VITE_REQUIRE_CONSENTS === 'true',
  useQueryTemplate: import.meta.env?.VITE_USE_QUERY_TEMPLATE === 'true',
  discover: import.meta.env?.VITE_DISCOVER === 'true',
  collaborate: import.meta.env?.VITE_COLLABORATE === 'true',
  discoverFeautures: {
    enableTour: import.meta.env?.EXPLORER_TOUR !== 'false', // default true
    openTour: import.meta.env?.VITE_OPEN_TOUR_NAME ?? 'BDC-Open',
    distributionExplorer: import.meta.env?.VITE_DIST_EXPLORER === 'true',
  },
  dashboard: import.meta.env?.VITE_DASHBOARD === 'true',
  dashboardDrawer: import.meta.env?.VITE_DASHBOARD_DRAWER === 'true',
  confirmDownload: import.meta.env?.VITE_CONFIRM_DOWNLOAD === 'true',
  termsOfService: import.meta.env?.VITE_ENABLE_TOS === 'true',
};

export const settings: Indexable = {
  variantExplorer: {
    type: (import.meta.env?.VITE_VARIANT_EXPLORER_TYPE || ExportType.Aggregate) as ExportType,
    maxCount: parseInt(import.meta.env?.VITE_VARIANT_EXPLORER_MAX_COUNT || 10000),
    excludeColumns: JSON.parse(import.meta.env?.VITE_VARIANT_EXPLORER_EXCLUDE_COLUMNS || '[]'),
  },
  distributionExplorer: {
    graphColors: JSON.parse(
      import.meta.env?.VITE_DIST_EXPLORER_GRAPH_COLORS || '["#328FFF", "#675AFF", "#FFBC35"]',
    ),
  },
  google: {
    analytics: import.meta.env?.VITE_GOOGLE_ANALYTICS_ID || '',
    tagManager: import.meta.env?.VITE_GOOGLE_TAG_MANAGER_ID || '',
  },
  maxDataPointsForExport: parseInt(import.meta.env?.VITE_MAX_DATA_POINTS_FOR_EXPORT || 1000000),
};

export const auth = {
  auth0Tenant: import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab',
};
