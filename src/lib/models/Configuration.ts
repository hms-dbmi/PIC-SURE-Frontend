import configJson from '../assets/configuration.json' assert { type: 'json' };
import { ExportType } from '$lib/models/Variant';
import type { Column } from '$lib/components/datatable/types';
import type { StatConfig, StatField } from '$lib/models/Stat';
import type { Indexable, Step } from '$lib/types';

// Types

export type Features = Indexable & {
  analyzeAnalysis: boolean;
  analyzeApi: boolean;
  collaborate: boolean;
  confirmDownload: boolean;
  dashboard: boolean;
  dashboardDrawer: boolean;
  dataRequests: boolean;
  discoverFeatures: {
    distributionExplorer: boolean;
  };
  discover: boolean;
  enableGENEQuery: boolean;
  enableSNPQuery: boolean;
  enforceTermsOfService: boolean;
  explorer: {
    allowDownload: boolean;
    allowExport: boolean;
    distributionExplorer: boolean;
    enableCohortDetails: boolean;
    enableExportTimeseries: boolean;
    enableHierarchy: boolean;
    enableOrQueries: boolean;
    enablePfbExport: boolean;
    enableRedcapExport: boolean;
    enableSampleIdCheckbox: boolean;
    enableTour: boolean;
    exportsEnableExport: boolean;
    showTreeStep: boolean;
    variantExplorer: boolean;
  };
  federated: boolean;
  login: {
    open: boolean;
  };
  manualRole: boolean;
  requireConsents: boolean;
  termsOfService: boolean;
  useQueryTemplate: boolean;
};

export type Settings = Indexable & {
  distributionExplorer: {
    graphColors: string[];
  };
  google: {
    analytics: string;
    tagManager: string;
  };
  maxDataPointsForExport: number;
  tour: {
    auth: string;
    open: string;
    searchTerm: string;
  };
  variantExplorer: {
    excludeColumns: string[];
    maxCount: number;
    type: ExportType;
  };
};

interface Link {
  title: string;
  url: string;
  newTab?: boolean;
  feature?: string;
}

interface CodeBlockConfig extends Indexable {
  PythonExport: string;
  RExport: string;
  PythonAPI: string;
  RAPI: string;
}

export type Branding = Indexable & {
  applicationName: string;
  logo?: {
    alt: string;
    src: string;
  };
  statFields: { [key: string]: StatField[] };
  sitemap: {
    category: string;
    feature?: string;
    privilege?: string;
    links: Array<Link>;
  }[];
  footer: {
    showSitemap: boolean;
    excludeSitemapOn: string[];
    links: Array<Link>;
  };
  explorePage: {
    columns: Column[];
    tourSearchTerm?: string;
    tourSearchIntro: string;
    totalPatientsText: string;
    queryErrorText: string;
    filterErrorText: string;
    analysisExportText: string;
    confirmDownloadTitle: string;
    confirmDownloadMessage: string;
    codeBlocks: CodeBlockConfig;
    goTo: {
      instructions: string;
      links: Array<Link>;
    };
    pfbExportUrls?: Link[];
  };
  landing: {
    searchPlaceholder: string;
    explanation: string;
    authExplanation: string;
    actions: Array<{
      title: string;
      description: string;
      icon: string;
      url: string;
      btnText: string;
      isOpen: boolean;
      showIfLoggedIn: boolean;
    }>;
    stats: StatConfig[];
  };
  results: {
    totalStatKey: string;
    stats: StatConfig[];
    cohortDescription: string;
  };
  datasetRequestPage: {
    searchIntro: string;
  };
  login: {
    description: string;
    showSiteName: boolean;
    openPicsureLink: string;
    openPicsureLinkText: string;
    contactLink: string;
  };
  help: {
    links: Array<{
      title: string;
      description: string;
      icon: string;
      url: string;
    }>;
    popups: Indexable;
  };
  privacyPolicy: {
    title: string;
    content: string;
    url: string;
  };
  analysisPage: {
    api: {
      cards: Array<{
        header: string;
        body: string;
        link: string;
      }>;
      instructions: {
        connection: string;
        execution: string;
      };
    };
    analysis: {
      platform: string;
      introduction: string;
      access: string;
      examples: string;
    };
  };
  collaboratePage: {
    steps: Step[];
    introduction: string;
    findCollaborators: string;
  };
  genomic?: {
    defaultGenomeBuild: string;
  };
  termsOfService: {
    rejectionUrl: string;
  };
};

export type ConfigData = {
  features: Features;
  settings: Settings;
};

export type ConfigObject = {
  uuid?: string;
  name: string;
  kind?: string;
  value: string;
  description?: string;
  markForDelete?: boolean;
};

export type ConfigMap = {
  [key: string]: ConfigObject;
};

export type ConfigCache = { settings: ConfigObject[]; features: ConfigObject[] };

export const configKinds = {
  features: 'ui:featureFlag',
  settings: 'ui:setting',
};

// Defaults

const defaultFeatures: Indexable = {
  ALLOW_DOWNLOAD: true,
  ALLOW_EXPORT_ENABLED: false,
  ALLOW_EXPORT: false,
  ANALYZE_ANALYSIS: true,
  ANALYZE_API: true,
  COLLABORATE: false,
  CONFIRM_DOWNLOAD: false,
  DASHBOARD_DRAWER: false,
  DASHBOARD: false,
  DATA_REQUESTS: false,
  DISCOVER: false,
  DIST_EXPLORER: false,
  DOWNLOAD_AS_PFB: true,
  ENABLE_COHORT_DETAILS: false,
  ENABLE_GENE_QUERY: false,
  ENABLE_HIERARCHY: false,
  ENABLE_METRICS: false,
  ENABLE_OR_QUERIES: false,
  ENABLE_REDCAP_EXPORT: false,
  ENABLE_SAMPLE_ID_CHECKBOX: false,
  ENABLE_SNP_QUERY: false,
  ENABLE_TERRA_EXPORT: false,
  ENABLE_TOS: false,
  ENFORCE_TOS_ACCEPT: false,
  EXPLORE_TOUR: true,
  EXPLORER_TOUR: true,
  EXPORT_TIMESERIES: true,
  FEDERATED: false,
  MANUAL_ROLE: false,
  OPEN_EXPLORER: false,
  OPEN: false,
  OR_QUERIES: true,
  REQUIRE_CONSENTS: false,
  SHOW_TREE_STEP: false,
  USE_QUERY_TEMPLATE: false,
  VARIANT_EXPLORER: false,
};

const defaultSettings: Indexable = {
  AUTH_TOUR_NAME: 'NHANES-Auth',
  DIST_EXPLORER_GRAPH_COLORS: ['#328FFF', '#675AFF', '#FFBC35'],
  EXPLORE_TOUR_SEARCH_TERM: 'age',
  GOOGLE_ANALYTICS_ID: '',
  GOOGLE_TAG_MANAGER_ID: '',
  MAX_DATA_POINTS_FOR_EXPORT: 1000000,
  OPEN_TOUR_NAME: 'BDC-Open',
  VARIANT_EXPLORER_EXCLUDE_COLUMNS: [],
  VARIANT_EXPLORER_MAX_COUNT: 10000,
  VARIANT_EXPLORER_TYPE: ExportType.Aggregate,
  DOTS_COLORS_CLASS: ['--color-primary-500', '--color-error-500', '--color-surface-400'],
};

const defaultBranding: Branding = {
  analysisPage: {
    api: {
      cards: [],
      instructions: {
        connection: '',
        execution: '',
      },
    },
    analysis: {
      platform: '',
      introduction: '',
      access: '',
      examples: '',
    },
  },
  applicationName: 'PIC‑SURE',
  collaboratePage: {
    steps: [],
    introduction: '',
    findCollaborators: '',
  },
  datasetRequestPage: {
    searchIntro: '',
  },
  explorePage: {
    columns: [],
    tourSearchIntro: '',
    totalPatientsText: '',
    queryErrorText: '',
    filterErrorText: '',
    analysisExportText: '',
    confirmDownloadTitle: '',
    confirmDownloadMessage: '',
    codeBlocks: {
      PythonExport: '',
      RExport: '',
      PythonAPI: '',
      RAPI: '',
    },
    goTo: {
      instructions: '',
      links: [],
    },
  },
  footer: {
    showSitemap: false,
    excludeSitemapOn: [],
    links: [],
  },
  help: {
    links: [],
    popups: {},
  },
  landing: {
    actions: [],
    searchPlaceholder: '',
    explanation: '',
    authExplanation: '',
    stats: [],
  },
  login: {
    description: '',
    showSiteName: false,
    openPicsureLink: '',
    openPicsureLinkText: '',
    contactLink: '',
  },
  logo: {
    alt: import.meta.env?.VITE_LOGO_ALT || 'PIC-SURE',
    src: import.meta.env?.VITE_LOGO || '',
  },
  privacyPolicy: {
    title: '',
    content: '',
    url: '',
  },
  results: {
    totalStatKey: '',
    stats: [],
    cohortDescription: '',
  },
  sitemap: [],
  statFields: {},
  termsOfService: {
    rejectionUrl: '',
  },
};

export const defaults = {
  features: defaultFeatures,
  settings: defaultSettings,
  branding: defaultBranding,
};

// Mapping Methods

export function getBrandingFromJSON(hostname: string): Branding {
  const newBranding: Branding = configJson;

  // Replace URLs in code blocks before assigning
  const codeBlocks: CodeBlockConfig = { ...configJson.explorePage.codeBlocks };
  Object.keys(codeBlocks).forEach((key: string) => {
    if (typeof codeBlocks[key] === 'string') {
      codeBlocks[key] = codeBlocks[key].replace('{{PICSURE_NETWORK_URL}}', hostname);
    }
  });

  newBranding.explorePage = {
    ...newBranding.explorePage,
    codeBlocks,
  };
  newBranding.logo = {
    alt: newBranding.logo?.alt || import.meta.env?.VITE_LOGO_ALT || 'PIC-SURE',
    src: newBranding.logo?.src || import.meta.env?.VITE_LOGO || '',
  };
  return newBranding;
}

function rowMap(map: ConfigMap, row: ConfigObject) {
  map[row.name] = row;
  return map;
}

function parsers(map: ConfigMap, defaults: Indexable) {
  return {
    asBoolean: function (name: string): boolean {
      return map[name] ? map[name].value === 'true' : (defaults[name] as boolean);
    },
    asInt: function (name: string): number {
      return map[name] ? parseInt(map[name].value) : (defaults[name] as number);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    asJson: function (name: string): any {
      return map[name] ? JSON.parse(map[name].value) : defaults[name];
    },
    asString: function (name: string): string {
      return map[name] ? map[name].value : (defaults[name] as string);
    },
  };
}

export function mapFeatures(configs: ConfigObject[]): Features {
  const fm = configs.reduce(rowMap, {});
  const parse = parsers(fm, defaultFeatures).asBoolean;
  return {
    analyzeAnalysis: parse('ANALYZE_ANALYSIS'),
    analyzeApi: parse('ANALYZE_API'),
    collaborate: parse('COLLABORATE'),
    confirmDownload: parse('CONFIRM_DOWNLOAD'),
    dataRequests: parse('DATA_REQUESTS'),
    discover: parse('DISCOVER'),
    discoverFeatures: {
      distributionExplorer: parse('DIST_EXPLORER'),
    },
    dashboard: parse('DASHBOARD'),
    dashboardDrawer: parse('DASHBOARD_DRAWER'),
    enableGENEQuery: parse('ENABLE_GENE_QUERY'),
    enableSNPQuery: parse('ENABLE_SNP_QUERY'),
    enforceTermsOfService: parse('ENFORCE_TOS_ACCEPT'),
    explorer: {
      allowDownload: parse('ALLOW_DOWNLOAD'),
      allowExport: parse('ALLOW_EXPORT'),
      distributionExplorer: parse('DIST_EXPLORER'),
      enableCohortDetails: parse('ENABLE_COHORT_DETAILS'),
      enableExportTimeseries: parse('EXPORT_TIMESERIES'),
      enableHierarchy: parse('ENABLE_HIERARCHY'),
      enableOrQueries: parse('ENABLE_OR_QUERIES'),
      enablePfbExport: parse('DOWNLOAD_AS_PFB'),
      enableRedcapExport: parse('ENABLE_REDCAP_EXPORT'),
      enableSampleIdCheckbox: parse('ENABLE_SAMPLE_ID_CHECKBOX'),
      enableTour: parse('EXPLORER_TOUR'),
      exportsEnableExport: parse('ALLOW_EXPORT_ENABLED'),
      showTreeStep: parse('SHOW_TREE_STEP'),
      variantExplorer: parse('VARIANT_EXPLORER'),
    },
    federated: parse('FEDERATED'),
    login: {
      open: parse('OPEN'),
    },
    manualRole: parse('MANUAL_ROLE'),
    requireConsents: parse('REQUIRE_CONSENTS'),
    termsOfService: parse('ENABLE_TOS'),
    useQueryTemplate: parse('USE_QUERY_TEMPLATE'),
  };
}

export function mapSettings(configs: ConfigObject[]): Settings {
  const sm: ConfigMap = configs.reduce(rowMap, {});
  const parse = parsers(sm, defaultSettings);
  return {
    distributionExplorer: {
      graphColors: parse.asJson('DIST_EXPLORER_GRAPH_COLORS'),
    },
    google: {
      analytics: parse.asString('GOOGLE_ANALYTICS_ID'),
      tagManager: parse.asString('GOOGLE_TAG_MANAGER_ID'),
    },
    maxDataPointsForExport: parse.asInt('MAX_DATA_POINTS_FOR_EXPORT'),
    tour: {
      auth: parse.asString('AUTH_TOUR_NAME'),
      open: parse.asString('OPEN_TOUR_NAME'),
      searchTerm: parse.asString('EXPLORE_TOUR_SEARCH_TERM'),
    },
    variantExplorer: {
      excludeColumns: parse.asJson('VARIANT_EXPLORER_EXCLUDE_COLUMNS'),
      maxCount: parse.asInt('VARIANT_EXPLORER_MAX_COUNT'),
      type: (sm['VARIANT_EXPLORER_TYPE']?.value || ExportType.Aggregate) as ExportType,
    },
  };
}
