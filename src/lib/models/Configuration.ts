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

export function envConfigMap(envPrefix: string = VITE_ENV_PREFIX): ConfigMap {
  const env = import.meta.env;
  return Object.keys(env).reduce((map: ConfigMap, key: string) => {
    if (!key.startsWith(envPrefix)) return map;
    const envKey = key.replaceAll(envPrefix, '');
    map[envKey] = { name: envKey, value: String(env[key]) };
    return map;
  }, {} as ConfigMap);
}

export function apiConfigMap(apiRows: ConfigObject[]): ConfigMap {
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

export type ConfigKind = 'features' | 'settings' | 'branding';

// Which VITE_<KIND> env var controls whether the API is queried at all for a config
// kind - used both server-side (configCache.ts's SSR bootstrap) and client-side
// (AdminConfiguration.ts's admin CRUD store, ConfigKindTab.svelte's "unavailable"
// messaging). Centralized so the env var naming convention has exactly one place to
// change; previously this Record was declared independently in two files, with a third
// place rebuilding the var *name* via a string template.
const CONFIG_API_ENV_VAR_NAME: Record<ConfigKind, string> = {
  features: 'VITE_API_CONFIG_FEATURES',
  settings: 'VITE_API_CONFIG_SETTINGS',
  branding: 'VITE_API_CONFIG_BRANDING',
};

export function configApiEnvVarName(kind: ConfigKind): string {
  return CONFIG_API_ENV_VAR_NAME[kind];
}

// The "kind" value sent as ?kind=<value> to the backend and used to gate whether API
// overrides are available at all for a config kind - empty means the deployment
// hasn't wired up the API for that kind. Vite exposes VITE_-prefixed vars as real
// properties on import.meta.env (see envConfigMap's Object.keys(env) above), so a
// dynamic lookup by env var name works the same as a literal `import.meta.env.FOO`.
export const CONFIG_API_KIND: Record<ConfigKind, string> = {
  features: import.meta.env[CONFIG_API_ENV_VAR_NAME.features] || '',
  settings: import.meta.env[CONFIG_API_ENV_VAR_NAME.settings] || '',
  branding: import.meta.env[CONFIG_API_ENV_VAR_NAME.branding] || '',
};

type FieldType = 'boolean' | 'int' | 'json' | 'string';
export interface ConfigFieldSchema {
  name: string;
  type: FieldType;
  default: unknown;
}
interface FieldDef {
  type: FieldType;
  default: unknown;
}

// Single source of truth for every field mapFeatures/mapSettings/mapBranding can
// resolve. parsersFor() (below) looks up each field's type/default from here instead
// of taking them as call-site arguments, so there is exactly one place a field's
// default is declared - previously OPEN's default was written twice, once at each of
// its two call sites, with nothing stopping them from drifting apart. This table also
// *is* the admin UI's schema (see CONFIG_FIELD_SCHEMA below): no separate list, and no
// need to run any mapper to introspect it.
const CONFIG_FIELDS: Record<ConfigKind, Record<string, FieldDef>> = {
  features: {
    ANALYZE_ANALYSIS: { type: 'boolean', default: false },
    ANALYZE_API: { type: 'boolean', default: true },
    COLLABORATE: { type: 'boolean', default: false },
    CONFIRM_DOWNLOAD: { type: 'boolean', default: false },
    DATA_REQUESTS: { type: 'boolean', default: false },
    DISCOVER: { type: 'boolean', default: false },
    DASHBOARD: { type: 'boolean', default: false },
    DASHBOARD_DRAWER: { type: 'boolean', default: false },
    ENABLE_GENE_QUERY: { type: 'boolean', default: false },
    ENABLE_SNP_QUERY: { type: 'boolean', default: false },
    ENFORCE_TOS_ACCEPT: { type: 'boolean', default: false },
    // OPEN feeds both explorer.open (AND'd with OPEN_EXPLORER) and login.open below.
    OPEN_EXPLORER: { type: 'boolean', default: false },
    OPEN: { type: 'boolean', default: false },
    ALLOW_DOWNLOAD: { type: 'boolean', default: true },
    ALLOW_EXPORT: { type: 'boolean', default: false },
    DIST_EXPLORER: { type: 'boolean', default: false },
    ENABLE_COHORT_DETAILS: { type: 'boolean', default: false },
    EXPORT_TIMESERIES: { type: 'boolean', default: true },
    ENABLE_HIERARCHY: { type: 'boolean', default: false },
    DOWNLOAD_AS_PFB: { type: 'boolean', default: true },
    ENABLE_REDCAP_EXPORT: { type: 'boolean', default: false },
    ENABLE_SAMPLE_ID_CHECKBOX: { type: 'boolean', default: false },
    EXPLORE_TOUR: { type: 'boolean', default: true },
    ALLOW_EXPORT_ENABLED: { type: 'boolean', default: false },
    SHOW_TREE_STEP: { type: 'boolean', default: false },
    VARIANT_EXPLORER: { type: 'boolean', default: false },
    FEDERATED: { type: 'boolean', default: false },
    MANUAL_ROLE: { type: 'boolean', default: false },
    REQUIRE_CONSENTS: { type: 'boolean', default: false },
    RESTORE_V2_QUERY: { type: 'boolean', default: false },
    ENABLE_TOS: { type: 'boolean', default: false },
    USE_QUERY_TEMPLATE: { type: 'boolean', default: false },
  },
  settings: {
    DOTS_COLORS_CLASS: {
      type: 'json',
      default: ['--color-primary-500', '--color-error-500', '--color-surface-400'],
    },
    DIST_EXPLORER_GRAPH_COLORS: { type: 'json', default: ['#328FFF', '#675AFF', '#FFBC35'] },
    GOOGLE_ANALYTICS_ID: { type: 'string', default: '' },
    GOOGLE_TAG_MANAGER_ID: { type: 'string', default: '' },
    MAX_DATA_POINTS_FOR_EXPORT: { type: 'int', default: 1000000 },
    AUTH_TOUR_NAME: { type: 'string', default: 'NHANES-Auth' },
    OPEN_TOUR_NAME: { type: 'string', default: 'BDC-Open' },
    EXPLORE_TOUR_SEARCH_TERM: { type: 'string', default: 'age' },
    VARIANT_EXPLORER_EXCLUDE_COLUMNS: { type: 'json', default: [] },
    VARIANT_EXPLORER_MAX_COUNT: { type: 'int', default: 10000 },
    VARIANT_EXPLORER_TYPE: { type: 'string', default: ExportType.Aggregate },
    EXPORT_SYSTEM_FIELDS: { type: 'string', default: '' },
  },
  branding: {
    LOGO_ALT: { type: 'string', default: 'PIC-SURE' },
    LOGO: { type: 'string', default: '' },
  },
};

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

// Schema-driven convenience layer over parsers(): looks up each field's type/default
// from CONFIG_FIELDS by name instead of taking them as call-site arguments, so
// mapFeatures/mapSettings/mapBranding physically can't declare a default that isn't
// also the one CONFIG_FIELD_SCHEMA shows the admin UI. Throws if a name isn't
// registered - a forgotten CONFIG_FIELDS entry fails loudly the moment it's parsed,
// instead of silently missing from the admin UI with no error anywhere.
export function parsersFor(kind: ConfigKind, map: ConfigMap) {
  const base = parsers(map);
  const fields = CONFIG_FIELDS[kind];
  function fieldDef(name: string): FieldDef {
    const found = fields[name];
    if (!found) throw new Error(`"${name}" is not registered in CONFIG_FIELDS.${kind}.`);
    return found;
  }
  return {
    asBoolean: (name: string): boolean => base.asBoolean(name, fieldDef(name).default as boolean),
    asInt: (name: string): number => base.asInt(name, fieldDef(name).default as number),
    asJson: (name: string): unknown => base.asJson(name, fieldDef(name).default),
    asString: (name: string): string => base.asString(name, fieldDef(name).default as string),
  };
}

export function mapFeatures(apiFeatures: ConfigObject[]): Features {
  const parse = parsersFor('features', resolveConfigMap(apiFeatures)).asBoolean;
  return {
    analyzeAnalysis: parse('ANALYZE_ANALYSIS'),
    analyzeApi: parse('ANALYZE_API'),
    collaborate: parse('COLLABORATE'),
    confirmDownload: parse('CONFIRM_DOWNLOAD'),
    dataRequests: parse('DATA_REQUESTS'),
    discover: parse('DISCOVER'),
    dashboard: parse('DASHBOARD'),
    dashboardDrawer: parse('DASHBOARD_DRAWER'),
    enableGENEQuery: parse('ENABLE_GENE_QUERY'),
    enableSNPQuery: parse('ENABLE_SNP_QUERY'),
    enforceTermsOfService: parse('ENFORCE_TOS_ACCEPT'),
    explorer: {
      open: parse('OPEN_EXPLORER') && parse('OPEN'),
      allowDownload: parse('ALLOW_DOWNLOAD'),
      allowExport: parse('ALLOW_EXPORT'),
      distributionExplorer: parse('DIST_EXPLORER'),
      enableCohortDetails: parse('ENABLE_COHORT_DETAILS'),
      enableExportTimeseries: parse('EXPORT_TIMESERIES'),
      enableHierarchy: parse('ENABLE_HIERARCHY'),
      enablePfbExport: parse('DOWNLOAD_AS_PFB'),
      enableRedcapExport: parse('ENABLE_REDCAP_EXPORT'),
      enableSampleIdCheckbox: parse('ENABLE_SAMPLE_ID_CHECKBOX'),
      enableTour: parse('EXPLORE_TOUR'),
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
    restoreV2queries: parse('RESTORE_V2_QUERY'),
    termsOfService: parse('ENABLE_TOS'),
    useQueryTemplate: parse('USE_QUERY_TEMPLATE'),
  };
}

export function mapSettings(apiSettings: ConfigObject[]): Settings {
  const parse = parsersFor('settings', resolveConfigMap(apiSettings));
  return {
    dotsColorsClass: parse.asJson('DOTS_COLORS_CLASS') as string[],
    distributionExplorer: {
      graphColors: parse.asJson('DIST_EXPLORER_GRAPH_COLORS') as string[],
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
      excludeColumns: parse.asJson('VARIANT_EXPLORER_EXCLUDE_COLUMNS') as string[],
      maxCount: parse.asInt('VARIANT_EXPLORER_MAX_COUNT'),
      type:
        parse.asString('VARIANT_EXPLORER_TYPE') === ExportType.Full
          ? ExportType.Full
          : ExportType.Aggregate,
    },
    exportSystemFields: parse
      .asString('EXPORT_SYSTEM_FIELDS')
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
  const parser = parsersFor('branding', resolveConfigMap(apiBranding));
  branding.logo.alt = parser.asString('LOGO_ALT');
  branding.logo.src = parser.asString('LOGO');

  return branding;
}

// The admin UI's schema: a flat view over CONFIG_FIELDS, grouped by kind. Pure data -
// no execution of the mappers involved, so this can never drift from what
// mapFeatures/mapSettings/mapBranding actually resolve (they read the same table).
export const CONFIG_FIELD_SCHEMA: Record<ConfigKind, ConfigFieldSchema[]> = (
  Object.keys(CONFIG_FIELDS) as ConfigKind[]
).reduce(
  (acc, kind) => {
    acc[kind] = Object.entries(CONFIG_FIELDS[kind]).map(([name, def]) => ({
      name,
      type: def.type,
      default: def.default,
    }));
    return acc;
  },
  {} as Record<ConfigKind, ConfigFieldSchema[]>,
);
