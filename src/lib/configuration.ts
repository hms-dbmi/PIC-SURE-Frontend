import type { Step } from '$lib/types';
import type { Column } from '$lib/components/datatable/types';
import { ExportType } from '$lib/models/Variant';
import type { StatField, StatConfig } from '$lib/models/Stat';

import * as configJson from './assets/configuration.json' assert { type: 'json' };

const ENV_PREFIX = 'VITE_';

export const PROJECT_HOSTNAME =
  typeof window !== 'undefined'
    ? `${window.location.origin}/picsure`
    : import.meta.env?.VITE_PROJECT_HOSTNAME
      ? `https://${import.meta.env?.VITE_PROJECT_HOSTNAME}/picsure`
      : 'https://nhanes.hms.harvard.edu/picsure';

interface Link {
  title: string;
  url: string;
  newTab?: boolean;
  feature?: string;
}

interface CodeBlock {
  PythonExport: string;
  RExport: string;
  PythonAPI: string;
  RAPI: string;
}

export const defaultBranding: {
  applicationName: string;
  logo: {
    alt: string;
    src: string;
  };
  statFields: Record<string, StatField[]>;
  explorePage: {
    columns: Column[];
    tourSearchTerm: string;
    tourSearchIntro: string;
    totalPatientsText: string;
    queryErrorText: string;
    filterErrorText: string;
    analysisExportText: string;
    confirmDownloadTitle: string;
    confirmDownloadMessage: string;
    codeBlocks: CodeBlock;
    goTo: {
      instructions: string;
      links: Link[];
    };
    pfbExportUrls: Link[];
  };
  landing: {
    searchPlaceholder: string;
    explanation: string;
    authExplanation: string;
    actions: {
      title: string;
      description: string;
      icon: string;
      url: string;
      btnText: string;
      isOpen: boolean;
      showIfLoggedIn: boolean;
    }[];
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
    links: {
      title: string;
      description: string;
      icon: string;
      url: string;
    }[];
    popups: Record<
      string,
      {
        consequence: string;
        frequency: string;
      }
    >;
  };
  footer: {
    showSitemap: boolean;
    excludeSitemapOn: string[];
    links: Link[];
  };
  sitemap: {
    category: string;
    feature?: string;
    privilege?: string;
    links: Link[];
  }[];
  privacyPolicy: {
    title: string;
    content: string;
    url: string;
  };
  analysisPage: {
    api: {
      cards: {
        header: string;
        body: string;
        link: string;
      }[];
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
  genomic: {
    defaultGenomeBuild: string;
  };
  termsOfService: {
    rejectionUrl: string;
  };
} = {
  applicationName: 'PIC‑SURE',
  logo: {
    alt: (import.meta.env?.VITE_LOGO_ALT as string) || 'PIC‑SURE',
    src: (import.meta.env?.VITE_LOGO as string) || '',
  },
  statFields: {},
  explorePage: {
    columns: [],
    tourSearchTerm: '',
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
    pfbExportUrls: [],
  },
  landing: {
    searchPlaceholder: '',
    explanation: '',
    authExplanation: '',
    actions: [],
    stats: [],
  },
  results: {
    totalStatKey: '',
    stats: [],
    cohortDescription: '',
  },
  datasetRequestPage: {
    searchIntro: '',
  },
  login: {
    description: '',
    showSiteName: true,
    openPicsureLink: '',
    openPicsureLinkText: '',
    contactLink: '',
  },
  help: {
    links: [],
    popups: {},
  },
  footer: {
    showSitemap: false,
    excludeSitemapOn: [],
    links: [],
  },
  sitemap: [],
  privacyPolicy: {
    title: '',
    content: '',
    url: '',
  },
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
  collaboratePage: {
    steps: [],
    introduction: '',
    findCollaborators: '',
  },
  genomic: {
    defaultGenomeBuild: '',
  },
  termsOfService: {
    rejectionUrl: '',
  },
};

export type BrandingConfig = typeof defaultBranding;

export function loadBrandingConfigs(): BrandingConfig {
  const branding: BrandingConfig = {
    ...defaultBranding,
    ...configJson,
  };

  const codeBlocks: CodeBlock = { ...configJson.explorePage.codeBlocks };
  Object.keys(codeBlocks).forEach((key: string) => {
    codeBlocks[key as keyof CodeBlock] = codeBlocks[key as keyof CodeBlock].replace(
      '{{PICSURE_NETWORK_URL}}',
      PROJECT_HOSTNAME,
    );
  });
  branding.explorePage.codeBlocks = codeBlocks;

  return branding as BrandingConfig;
}

function orDefault(
  key: string,
  defaultValue: boolean | string | number | ExportType,
  json: boolean = false,
) {
  const value = import.meta.env[ENV_PREFIX + key];
  if (value === undefined) return defaultValue;
  else if (json) return JSON.parse(value);
  else if (value === 'true' || value === 'false') return value === 'true' || defaultValue;
  else {
    try {
      return parseInt(value);
    } catch {
      return value;
    }
  }
}

export const features = {
  federated: orDefault('FEDERATED', false),
  explorer: {
    allowExport: orDefault('ALLOW_EXPORT', false),
    allowDownload: orDefault('ALLOW_DOWNLOAD', true),
    exportsEnableExport: orDefault('ALLOW_EXPORT_ENABLED', false),
    variantExplorer: orDefault('VARIANT_EXPLORER', false),
    distributionExplorer: orDefault('DIST_EXPLORER', false),
    enableTour: orDefault('EXPLORER_TOUR', true),
    authTour: orDefault('AUTH_TOUR_NAME', 'NHANES-Auth'),
    enableHierarchy: orDefault('ENABLE_HIERARCHY', false),
    enablePfbExport: orDefault('DOWNLOAD_AS_PFB', true),
    enableSampleIdCheckbox: orDefault('ENABLE_SAMPLE_ID_CHECKBOX', false),
    enableCohortDetails: orDefault('ENABLE_COHORT_DETAILS', false),
  },
  login: {
    open: orDefault('OPEN', false),
  },
  analyzeApi: orDefault('ANALYZE_API', true),
  analyzeAnalysis: orDefault('ANALYZE_ANALYSIS', false),
  dataRequests: orDefault('DATA_REQUESTS', false),
  manualRole: orDefault('MANUAL_ROLE', false),
  enableSNPQuery: orDefault('ENABLE_SNP_QUERY', false),
  enableGENEQuery: orDefault('ENABLE_GENE_QUERY', false),
  requireConsents: orDefault('REQUIRE_CONSENTS', false),
  useQueryTemplate: orDefault('USE_QUERY_TEMPLATE', false),
  discover: orDefault('DISCOVER', false),
  collaborate: orDefault('COLLABORATE', false),
  discoverFeautures: {
    enableTour: orDefault('EXPLORER_TOUR', true),
    openTour: orDefault('OPEN_TOUR_NAME', 'BDC-Open'),
    distributionExplorer: orDefault('DIST_EXPLORER', false),
  },
  dashboard: orDefault('DASHBOARD', false),
  dashboardDrawer: orDefault('DASHBOARD_DRAWER', false),
  confirmDownload: orDefault('CONFIRM_DOWNLOAD', false),
  termsOfService: orDefault('ENABLE_TOS', false),
  enforceTermsOfService: orDefault('ENFORCE_TOS_ACCEPT', false),
};

export const settings = {
  variantExplorer: {
    type: orDefault('VARIANT_EXPLORER_TYPE', ExportType.Aggregate) as ExportType,
    maxCount: orDefault('VARIANT_EXPLORER_MAX_COUNT', 10000),
    excludeColumns: orDefault('VARIANT_EXPLORER_EXCLUDE_COLUMNS', '[]', true),
  },
  distributionExplorer: {
    graphColors: orDefault('DIST_EXPLORER_GRAPH_COLORS', '["#328FFF", "#675AFF", "#FFBC35"]', true),
  },
  google: {
    analytics: orDefault('GOOGLE_ANALYTICS_ID', ''),
    tagManager: orDefault('GOOGLE_TAG_MANAGER_ID', ''),
  },
  maxDataPointsForExport: orDefault('MAX_DATA_POINTS_FOR_EXPORT', 1000000),
};

export const auth = {
  auth0Tenant: orDefault('AUTH0_TENANT', 'avillachlab'),
};
