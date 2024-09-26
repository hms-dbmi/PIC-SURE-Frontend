import { BDCPrivileges, PicsurePrivileges } from './models/Privilege';
import type { Route } from './models/Route';
import type { ExpectedResultType } from './models/query/Query';
import * as configJson from './assets/configuration.json' assert { type: 'json' };
import { ExportType } from './models/Variant';
import type {
  ApiPageConfig,
  ExplorePageConfig,
  FooterConfig,
  HelpConfig,
  Indexable,
  LandingConfig,
  LoginConfig,
  SiteMapConfig,
  PrivacyConfig,
} from './types';

export interface Branding {
  applicationName: string;
  logo: {
    alt: string;
    src: string;
  };
  sitemap: SiteMapConfig[];
  footer: FooterConfig;
  apiPage: ApiPageConfig;
  explorePage: ExplorePageConfig;
  landing: LandingConfig;
  login: LoginConfig;
  help: HelpConfig;
  privacyPolicy: PrivacyConfig;
}

export const branding: Branding = {
  applicationName: 'PIC‑SURE',
  logo: {
    alt: import.meta.env?.VITE_LOGO_ALT || 'PIC‑SURE',
    src: import.meta.env?.VITE_LOGO || '',
  },
  sitemap: [] as SiteMapConfig[],
  footer: {} as FooterConfig,
  apiPage: {} as ApiPageConfig,
  explorePage: {
    tourSearchTerm: import.meta.env?.EXPLORE_TOUR_SEARCH_TERM || 'age',
  } as ExplorePageConfig,
  landing: {} as LandingConfig,
  login: {} as LoginConfig,
  help: {} as HelpConfig,
  privacyPolicy: {} as PrivacyConfig,
};

export const initializeBranding = () => {
  branding.applicationName = configJson.applicationName;
  branding.apiPage = configJson.apiPage;
  branding.explorePage = { ...branding.explorePage, ...configJson.explorePage };
  branding.landing = configJson.landing;
  branding.login = configJson.login;
  branding.help = configJson.help;
  branding.footer = configJson.footer;
  branding.sitemap = configJson.sitemap as SiteMapConfig[];
  branding.privacyPolicy = configJson.privacyPolicy;
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
    path: '/admin',
    text: 'Configuration',
    privilege: [PicsurePrivileges.SUPER],
    children: [
      { path: '/admin/authorization', text: 'Authorization', privilege: [PicsurePrivileges.SUPER] },
      {
        path: '/admin/authentication',
        text: 'Authentication',
        privilege: [PicsurePrivileges.SUPER],
      },
    ],
  },
  { path: '/admin/users', text: 'Manage Users', privilege: [PicsurePrivileges.ADMIN] },
  { path: '/help', text: 'Help' },
];

export const features: Indexable = {
  explorer: {
    allowExport: import.meta.env?.VITE_ALLOW_EXPORT === 'true',
    exportsEnableExport: import.meta.env?.VITE_ALLOW_EXPORT_ENABLED === 'true',
    exportResultType: (import.meta.env?.VITE_EXPORT_RESULT_TYPE ||
      'DATAFRAME') as ExpectedResultType,
    variantExplorer: import.meta.env?.VITE_VARIANT_EXPLORER === 'true',
    distributionExplorer: import.meta.env?.VITE_DIST_EXPLORER === 'true',
    enableTour: import.meta.env?.EXPLORER_TOUR ? import.meta.env?.EXPLORE_TOUR === 'true' : true, // default to true unless set otherwise
    enableSNPQuery: import.meta.env?.VITE_ENABLE_SNP_QUERY === 'true',
    enableGENEQuery: import.meta.env?.VITE_ENABLE_GENE_QUERY === 'true',
  },
  login: {
    open: import.meta.env?.VITE_OPEN === 'true',
  },
  dataRequests: import.meta.env?.VITE_DATA_REQUESTS === 'true',
  genomicFilter: import.meta.env?.VITE_GENOMIC_FILTER === 'true',
  requireConsents: import.meta.env?.VITE_REQUIRE_CONSENTS === 'true',
  useQueryTemplate: import.meta.env?.VITE_USE_QUERY_TEMPLATE === 'true',
  discover: import.meta.env?.VITE_DISCOVER === 'true',
  discoverFeautures: {
    enableTour: import.meta.env?.EXPLORER_TOUR !== 'false',
    distributionExplorer: import.meta.env?.VITE_DIST_EXPLORER === 'true',
  },
  dashboard: import.meta.env?.VITE_DASHBOARD === 'true',
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
