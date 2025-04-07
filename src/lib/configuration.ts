import { BDCPrivileges, PicsurePrivileges } from './models/Privilege';
import type { Route } from './models/Route';
import type { ExpectedResultType } from './models/query/Query';
import * as configJson from './assets/configuration.json' assert { type: 'json' };
import { ExportType } from './models/Variant';
import type {
  ExplorePageConfig,
  FooterConfig,
  HelpConfig,
  Indexable,
  LandingConfig,
  LoginConfig,
  SiteMapConfig,
  PrivacyConfig,
  AnalysisConfig,
} from './types';

export interface Branding {
  applicationName: string;
  logo: {
    alt: string;
    src: string;
  };
  sitemap: SiteMapConfig[];
  footer: FooterConfig;
  explorePage: ExplorePageConfig;
  landing: LandingConfig;
  login: LoginConfig;
  help: HelpConfig;
  privacyPolicy: PrivacyConfig;
  analysisConfig: AnalysisConfig;
}

export const branding: Branding = {
  applicationName: 'PIC‑SURE',
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
  login: {} as LoginConfig,
  help: {} as HelpConfig,
  privacyPolicy: {} as PrivacyConfig,
  analysisConfig: {} as AnalysisConfig,
};

export const initializeBranding = () => {
  branding.applicationName = configJson.applicationName;
  branding.explorePage = { ...branding.explorePage, ...configJson.explorePage };
  branding.landing = configJson.landing;
  branding.login = configJson.login;
  branding.help = configJson.help;
  branding.footer = configJson.footer;
  branding.sitemap = configJson.sitemap as SiteMapConfig[];
  branding.privacyPolicy = configJson.privacyPolicy;
  branding.analysisConfig = configJson.analysisPage;
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
    path: '/analyze',
    text: 'Prepare for Analysis',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
  },
  {
    path: '/dataset',
    text: 'Manage Datasets',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.NAMED_DATASET],
  },
  {
    path: '/admin/requests',
    text: 'Data Requests',
    privilege: [PicsurePrivileges.DATA_ADMIN],
    feature: 'dataRequests',
  },
  {
    path: '/admin/configuration',
    text: 'Configuration',
    privilege: [PicsurePrivileges.SUPER],
  },
  { path: '/admin/users', text: 'Manage Users', privilege: [PicsurePrivileges.ADMIN] },
  { path: '/help', text: 'Help' },
];

export const features: Indexable = {
  explorer: {
    allowExport: import.meta.env?.VITE_ALLOW_EXPORT === 'true',
    allowDownload: import.meta.env?.VITE_ALLOW_DOWNLOAD !== 'false',
    exportsEnableExport: import.meta.env?.VITE_ALLOW_EXPORT_ENABLED === 'true',
    exportResultType: (import.meta.env?.VITE_EXPORT_RESULT_TYPE ||
      'DATAFRAME') as ExpectedResultType,
    variantExplorer: import.meta.env?.VITE_VARIANT_EXPLORER === 'true',
    distributionExplorer: import.meta.env?.VITE_DIST_EXPLORER === 'true',
    enableTour: import.meta.env?.EXPLORER_TOUR ? import.meta.env?.EXPLORE_TOUR === 'true' : true, // default to true unless set otherwise
    authTour: import.meta.env?.VITE_AUTH_TOUR_NAME ?? 'NHANES-Auth',
    enableHierarchy: import.meta.env?.VITE_ENABLE_HIERARCHY === 'true',
    enableTerraExport: import.meta.env?.VITE_ENABLE_TERRA_EXPORT === 'true',
    enableSampleIdCheckbox: import.meta.env?.VITE_ENABLE_SAMPLE_ID_CHECKBOX === 'true',
  },
  login: {
    open: import.meta.env?.VITE_OPEN === 'true',
  },
  dataRequests: import.meta.env?.VITE_DATA_REQUESTS === 'true',
  enableSNPQuery: import.meta.env?.VITE_ENABLE_SNP_QUERY === 'true',
  enableGENEQuery: import.meta.env?.VITE_ENABLE_GENE_QUERY === 'true',
  requireConsents: import.meta.env?.VITE_REQUIRE_CONSENTS === 'true',
  useQueryTemplate: import.meta.env?.VITE_USE_QUERY_TEMPLATE === 'true',
  discover: import.meta.env?.VITE_DISCOVER === 'true',
  discoverFeautures: {
    enableTour: import.meta.env?.EXPLORER_TOUR !== 'false',
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

export const resources = {
  hpds: (import.meta.env?.VITE_RESOURCE_HPDS || '') as string,
  openHPDS: (import.meta.env?.VITE_RESOURCE_OPEN_HPDS || '') as string,
  visualization: (import.meta.env?.VITE_RESOURCE_VIZ || '') as string,
  application: (import.meta.env?.VITE_RESOURCE_APP || '') as string,
};

export const auth = {
  auth0Tenant: import.meta.env?.VITE_AUTH0_TENANT || 'avillachlab',
};
