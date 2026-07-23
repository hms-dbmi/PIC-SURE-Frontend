import configJson from '../assets/configuration.json' with { type: 'json' };
import { ExportType } from '../models/Variant';
import type { Column } from '../components/datatable/types';
import type { StatConfig, StatField } from '../models/Stat';
import type { Indexable, Step, Indexed } from '../types';
import { deepMerge } from '../utilities/Objects';

// Types

export type Features = Indexable & {
  analyzeAnalysis: boolean;
  analyzeApi: boolean;
  collaborate: boolean;
  confirmDownload: boolean;
  confirmExternalNavigation: boolean;
  dashboard: boolean;
  dashboardDrawer: boolean;
  dataRequests: boolean;
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
    enablePfbExport: boolean;
    enableRedcapExport: boolean;
    enableSampleIdCheckbox: boolean;
    enableTour: boolean;
    exportsEnableExport: boolean;
    showTreeStep: boolean;
    variantExplorer: boolean;
    open: boolean;
  };
  federated: boolean;
  login: {
    open: boolean;
  };
  manualRole: boolean;
  requireConsents: boolean;
  restoreV2queries: boolean;
  termsOfService: boolean;
  useQueryTemplate: boolean;
};

export type Settings = Indexable & {
  dotsColorsClass: string[];
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
  exportSystemFields: string[];
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
  logo: {
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
    resultInfo: {
      variableHeader: string;
      datasetHeader: string;
      studyHeader: string;
    };
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
    logoHeight: number;
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
      example: {
        setup: string;
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
    steps?: Step[];
    introduction: string;
    findCollaborators: string;
  };
  genomic?: {
    defaultGenomeBuild: string;
  };
  termsOfService: {
    rejectionUrl: string;
  };
  externalLinkWarning: {
    title: string;
    message: string;
    newTabMessage: string;
    okText: string;
    cancelText: string;
  };
};

export type ConfigObject = {
  uuid?: string;
  name: string;
  kind?: string;
  value: string;
  description?: string;
  markForDelete?: boolean;
};

export type ConfigMap = Indexed<ConfigObject>;

export type ConfigCache = {
  settings: ConfigObject[];
  features: ConfigObject[];
  branding: ConfigObject[];
};

// Mapping Methods

// Env variable config layer
//
// Lets a deployment pin or seed individual features/settings via VITE_<KEY> env vars,
// independent of whether the API is configured to return that config kind at all.
// VITE_CONFIG_MODE decides who wins when both an env var and an API row are set for
// the same field:
//   seed (default): defaults -> env (if set) -> API (if set) wins
//   override:       defaults -> API (if set) -> env (if set) wins
// Either way, defaults remain the floor - parsers() already falls back to `defaults[name]`
// when a key is absent from the map it's given, so this only needs to combine the sparse
// env-derived and API-derived maps in the right order before handing them to parsers().

type ConfigMode = 'seed' | 'override';
const VITE_ENV_PREFIX = 'VITE_';

export function getConfigMode(): ConfigMode {
  return import.meta.env?.VITE_CONFIG_MODE === 'override' ? 'override' : 'seed';
}

function envConfigMap(envPrefix: string = VITE_ENV_PREFIX): ConfigMap {
  const env = import.meta.env;
  return Object.keys(env).reduce((map: ConfigMap, key: string) => {
    if (!key.startsWith(envPrefix)) return map;
    const envKey = key.replaceAll(envPrefix, '');
    map[envKey] = { name: envKey, value: String(env[key]) };
    return map;
  }, {} as ConfigMap);
}

function apiConfigMap(apiRows: ConfigObject[]): ConfigMap {
  return apiRows.reduce((map: ConfigMap, row: ConfigObject) => {
    map[row.name] = row;
    return map;
  }, {} as ConfigMap);
}

export function resolveConfigMap(apiRows: ConfigObject[], envPrefix?: string): ConfigMap {
  const apiMap = apiConfigMap(apiRows);
  const envMap = envConfigMap(envPrefix);
  return getConfigMode() === 'override' ? { ...apiMap, ...envMap } : { ...envMap, ...apiMap };
}

// A blank (or whitespace-only) value is treated the same as an absent one - it
// falls back to the default rather than being coerced/parsed. asString is the
// one exception: an explicit empty string is a valid override there, so it
// only checks presence, not blankness.
// Also the single place that guards against a value transform throwing (asJson on
// invalid JSON) or otherwise failing to produce a usable value (asInt on a
// non-numeric string) - falls back to defaultValue in either case, so a bad admin-
// entered row degrades that one field instead of blowing up the whole config load.
function withNonBlank<T>(
  map: ConfigMap,
  name: string,
  defaultValue: T,
  transform: (value: string) => T,
): T {
  const value = map[name]?.value;
  if (!value || value.trim() === '') return defaultValue;
  try {
    return transform(value);
  } catch (e) {
    console.warn(`Invalid config value for "${name}" ("${value}"), falling back to default.`, e);
    return defaultValue;
  }
}

export function parsers(map: ConfigMap) {
  return {
    asBoolean: function (name: string, defaultValue: boolean): boolean {
      return withNonBlank(map, name, defaultValue, (value) => value === 'true');
    },
    asInt: function (name: string, defaultValue: number): number {
      return withNonBlank(map, name, defaultValue, (value) => {
        const parsed = parseInt(value);
        if (Number.isNaN(parsed)) throw new Error(`"${value}" is not an integer`);
        return parsed;
      });
    },
    asJson: function (name: string, defaultValue: unknown): unknown {
      return withNonBlank(map, name, defaultValue, (value) => JSON.parse(value));
    },
    asString: function (name: string, defaultValue: string): string {
      return map[name] ? map[name].value : (defaultValue as string);
    },
  };
}

export function mapFeatures(apiFeatures: ConfigObject[]): Features {
  const parse = parsers(resolveConfigMap(apiFeatures)).asBoolean;
  return {
    analyzeAnalysis: parse('ANALYZE_ANALYSIS', false),
    analyzeApi: parse('ANALYZE_API', true),
    collaborate: parse('COLLABORATE', false),
    confirmDownload: parse('CONFIRM_DOWNLOAD', false),
    confirmExternalNavigation: parse('CONFIRM_EXTERNAL_NAVIGATION', false),
    dataRequests: parse('DATA_REQUESTS', false),
    discover: parse('DISCOVER', false),
    dashboard: parse('DASHBOARD', false),
    dashboardDrawer: parse('DASHBOARD_DRAWER', false),
    enableGENEQuery: parse('ENABLE_GENE_QUERY', false),
    enableSNPQuery: parse('ENABLE_SNP_QUERY', false),
    enforceTermsOfService: parse('ENFORCE_TOS_ACCEPT', false),
    explorer: {
      open: parse('OPEN_EXPLORER', false) && parse('OPEN', false),
      allowDownload: parse('ALLOW_DOWNLOAD', true),
      allowExport: parse('ALLOW_EXPORT', false),
      distributionExplorer: parse('DIST_EXPLORER', false),
      enableCohortDetails: parse('ENABLE_COHORT_DETAILS', false),
      enableExportTimeseries: parse('EXPORT_TIMESERIES', true),
      enableHierarchy: parse('ENABLE_HIERARCHY', false),
      enablePfbExport: parse('DOWNLOAD_AS_PFB', true),
      enableRedcapExport: parse('ENABLE_REDCAP_EXPORT', false),
      enableSampleIdCheckbox: parse('ENABLE_SAMPLE_ID_CHECKBOX', false),
      enableTour: parse('EXPLORE_TOUR', true),
      exportsEnableExport: parse('ALLOW_EXPORT_ENABLED', false),
      showTreeStep: parse('SHOW_TREE_STEP', false),
      variantExplorer: parse('VARIANT_EXPLORER', false),
    },
    federated: parse('FEDERATED', false),
    login: {
      open: parse('OPEN', false),
    },
    manualRole: parse('MANUAL_ROLE', false),
    requireConsents: parse('REQUIRE_CONSENTS', false),
    restoreV2queries: parse('RESTORE_V2_QUERY', false),
    termsOfService: parse('ENABLE_TOS', false),
    useQueryTemplate: parse('USE_QUERY_TEMPLATE', false),
  };
}

export function mapSettings(apiSettings: ConfigObject[]): Settings {
  const sm: ConfigMap = resolveConfigMap(apiSettings);
  const parse = parsers(sm);
  return {
    dotsColorsClass: parse.asJson('DOTS_COLORS_CLASS', [
      '--color-primary-500',
      '--color-error-500',
      '--color-surface-400',
    ]) as string[],
    distributionExplorer: {
      graphColors: parse.asJson('DIST_EXPLORER_GRAPH_COLORS', [
        '#328FFF',
        '#675AFF',
        '#FFBC35',
      ]) as string[],
    },
    google: {
      analytics: parse.asString('GOOGLE_ANALYTICS_ID', ''),
      tagManager: parse.asString('GOOGLE_TAG_MANAGER_ID', ''),
    },
    maxDataPointsForExport: parse.asInt('MAX_DATA_POINTS_FOR_EXPORT', 1000000),
    tour: {
      auth: parse.asString('AUTH_TOUR_NAME', 'NHANES-Auth'),
      open: parse.asString('OPEN_TOUR_NAME', 'BDC-Open'),
      searchTerm: parse.asString('EXPLORE_TOUR_SEARCH_TERM', 'age'),
    },
    variantExplorer: {
      excludeColumns: parse.asJson('VARIANT_EXPLORER_EXCLUDE_COLUMNS', []) as string[],
      maxCount: parse.asInt('VARIANT_EXPLORER_MAX_COUNT', 10000),
      type:
        parse.asString('VARIANT_EXPLORER_TYPE', ExportType.Aggregate) === ExportType.Full
          ? ExportType.Full
          : ExportType.Aggregate,
    },
    exportSystemFields: parse
      .asString('EXPORT_SYSTEM_FIELDS', '')
      .split(',')
      .map((f: string) => f.trim())
      .filter(Boolean)
      .map((f: string) => `\\${f}\\`),
  };
}

export function mapBranding(hostname: string, apiBranding: ConfigObject[] = []): Branding {
  const branding = deepMerge(
    {
      analysisPage: {
        api: {
          cards: [],
          instructions: {
            connection: '',
            execution: '',
          },
          example: {
            setup: '',
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
        resultInfo: {
          variableHeader: 'Variable Information',
          datasetHeader: 'Dataset Information',
          studyHeader: 'Study Information',
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
        logoHeight: 7.5,
      },
      logo: {
        alt: 'PIC-SURE',
        src: '',
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
      externalLinkWarning: {
        title: '',
        message: '',
        newTabMessage: '',
        okText: 'OK',
        cancelText: 'Cancel',
      },
    },
    configJson,
  );

  // Replace URLs in code blocks before assigning. Operate on the already-merged
  // branding.explorePage.codeBlocks (defaults + configJson), not configJson's alone,
  // so a codeBlocks key missing from configJson still falls back to its merged
  // default instead of becoming undefined.
  const codeBlocks: CodeBlockConfig = { ...branding.explorePage.codeBlocks };
  const replaceHostname = (codeBlock: string) =>
    codeBlock.replace('{{PICSURE_NETWORK_URL}}', hostname);
  Object.keys(codeBlocks).forEach((key: string) => {
    if (typeof codeBlocks[key] === 'string') {
      codeBlocks[key] = replaceHostname(codeBlocks[key]);
    }
  });
  branding.explorePage.codeBlocks = codeBlocks;

  // ENV or API overrides
  const parser = parsers(resolveConfigMap(apiBranding));
  branding.logo.alt = parser.asString('LOGO_ALT', 'PIC-SURE');
  branding.logo.src = parser.asString('LOGO', '');

  return branding;
}
