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
  description: string;
  group: string;
}
interface FieldDef {
  type: FieldType;
  default: unknown;
  description: string;
  // Groups fields by relation (e.g. all Google settings together) rather than by type,
  // for the admin UI's section headers. Order of the section headers falls out of
  // declaration order below - fields are clustered by group for that reason - so there's
  // no separate ordering list to keep in sync with this table.
  group: string;
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
    // --- Analysis ---
    ANALYZE_ANALYSIS: {
      group: 'Analysis',
      type: 'boolean',
      default: false,
      description:
        'Enables the Analyze page and its navigation item, and (together with ANALYZE_API) decides which /analyze view opens by default.',
    },
    ANALYZE_API: {
      group: 'Analysis',
      type: 'boolean',
      default: true,
      description:
        "Enables the 'Prepare for Analysis' (API) page and navigation item, and defaults the export flow's code tab to Python when available.",
    },

    // --- Access & Login ---
    // OPEN feeds both explorer.open (AND'd with OPEN_EXPLORER) and login.open below.
    OPEN: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        "Allows unauthenticated access to the app (skips the forced login redirect) and, combined with OPEN_EXPLORER, makes the Explorer page reachable without logging in. Also shows the 'Explore without Login' entry point.",
    },
    OPEN_EXPLORER: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        'Combined with OPEN: when both are enabled, the Explorer page is reachable without logging in.',
    },
    DISCOVER: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        'Enables the public Discover page and navigation item; when disabled, /discover redirects to /explorer and anonymous searches route to /explorer instead.',
    },
    REQUIRE_CONSENTS: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        "Attaches the user's data-use consents as authorization filters on outgoing queries.",
    },
    ENFORCE_TOS_ACCEPT: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        "Forces logged-in users who haven't accepted the Terms of Service to accept it before continuing, blocking dismissal of the TOS modal.",
    },
    ENABLE_TOS: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        'Enables the Terms of Service feature: adds a footer link to view it, and an admin link to edit it.',
    },
    FEDERATED: {
      group: 'Access & Login',
      type: 'boolean',
      default: false,
      description:
        "Enables federated (multi-site) behavior: queries across all connected sites' resources, swaps in per-site dataset save/export steps, and shows per-site status instead of one combined result.",
    },

    // --- Explorer & Search ---
    ALLOW_EXPORT: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        "Shows or hides the 'Export' option on the Explorer results panel that starts the export/analysis flow.",
    },
    ALLOW_EXPORT_ENABLED: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        'Shows a per-row action on search results to add that variable to the export, and contributes to the export button/badge visibility.',
    },
    DIST_EXPLORER: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        'Enables the Variable Distributions (visualizations) view on the Explorer and Discover results panels.',
    },
    ENABLE_COHORT_DETAILS: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Cohort Details' link/section on the Explorer results panel (not shown on the Discover page).",
    },
    ENABLE_HIERARCHY: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        "Shows a 'Data Hierarchy' action on search results, letting users view a variable's hierarchy tree and build anyRecordOf queries.",
    },
    SHOW_TREE_STEP: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description: "Adds a 'Finalize Data' step to the export stepper flow.",
    },
    EXPLORE_TOUR: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: true,
      description: 'Shows the guided walkthrough tour button on the Explorer/Discover pages.',
    },
    ENABLE_SAMPLE_ID_CHECKBOX: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        "Shows an 'Include sample identifiers' checkbox in the export review step that adds sample IDs to the export/query.",
    },
    USE_QUERY_TEMPLATE: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        "Applies the logged-in user's saved query template (and its consent categories) as the base of new queries and dashboard filtering.",
    },
    RESTORE_V2_QUERY: {
      group: 'Explorer & Search',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Restore Filters' button for older (V2) saved queries; V3 queries always show it regardless.",
    },

    // --- Genomic Search ---
    ENABLE_GENE_QUERY: {
      group: 'Genomic Search',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Variants by gene name' genomic search option and enables gene-based variant queries.",
    },
    ENABLE_SNP_QUERY: {
      group: 'Genomic Search',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Specific Variants' (SNP) genomic search option and enables SNP-based variant queries.",
    },
    VARIANT_EXPLORER: {
      group: 'Genomic Search',
      type: 'boolean',
      default: false,
      description:
        "Enables the Variant Explorer feature; when disabled, the Variant Explorer page shows a 'not enabled' message instead of rendering.",
    },

    // --- Export ---
    EXPORT_TIMESERIES: {
      group: 'Export',
      type: 'boolean',
      default: true,
      description: "Shows the 'Export as Timeseries' option in the export type selection step.",
    },
    DOWNLOAD_AS_PFB: {
      group: 'Export',
      type: 'boolean',
      default: true,
      description:
        'Enables PFB (Avro) as an export format option alongside CSV in the export flow.',
    },
    ENABLE_REDCAP_EXPORT: {
      group: 'Export',
      type: 'boolean',
      default: false,
      description:
        'Redirects the final export step to an external REDCap survey/access-request link instead of the normal analysis or PFB export steps.',
    },
    CONFIRM_DOWNLOAD: {
      group: 'Export',
      type: 'boolean',
      default: false,
      description:
        'Shows a confirmation dialog before downloading exported data, instead of downloading immediately.',
    },
    ALLOW_DOWNLOAD: {
      group: 'Export',
      type: 'boolean',
      default: true,
      description:
        'Shows or hides the download button for exported CSV/PFB data in the export flow.',
    },

    // --- Dashboard ---
    DASHBOARD: {
      group: 'Dashboard',
      type: 'boolean',
      default: false,
      description:
        'Shows or hides the Data Dashboard navigation item (the /dashboard page itself is not currently guarded by this flag).',
    },
    DASHBOARD_DRAWER: {
      group: 'Dashboard',
      type: 'boolean',
      default: false,
      description:
        'Makes Data Dashboard rows clickable, opening a drawer with more detail about the selected row.',
    },

    // --- Collaboration ---
    COLLABORATE: {
      group: 'Collaboration',
      type: 'boolean',
      default: false,
      description:
        'Enables the Collaborate page and its navigation item; when disabled, /collaborate redirects to the home page.',
    },
    DATA_REQUESTS: {
      group: 'Collaboration',
      type: 'boolean',
      default: false,
      description:
        'Enables the Data Requests page and navigation item, and a related step in the Collaborate flow.',
    },
    MANUAL_ROLE: {
      group: 'Collaboration',
      type: 'boolean',
      default: false,
      description: "Enables the 'Manual Role' admin page and its navigation item (BDC-specific).",
    },
  },
  settings: {
    // --- Google ---
    GOOGLE_ANALYTICS_ID: {
      group: 'Google',
      type: 'string',
      default: '',
      description:
        'Google Analytics measurement ID; when set (with a privacy policy configured), loads Google Analytics and triggers the cookie-consent prompt.',
    },
    GOOGLE_TAG_MANAGER_ID: {
      group: 'Google',
      type: 'string',
      default: '',
      description:
        'Google Tag Manager container ID; when set, loads the GTM script/iframe alongside the same consent prompt.',
    },

    // --- Appearance ---
    DOTS_COLORS_CLASS: {
      group: 'Appearance',
      type: 'json',
      default: ['--color-primary-500', '--color-error-500', '--color-surface-400'],
      description:
        'Overrides the colors of the decorative dot graphic on the login page; must be an array of exactly 3 or 5 color values, otherwise the default is kept.',
    },
    DIST_EXPLORER_GRAPH_COLORS: {
      group: 'Appearance',
      type: 'json',
      default: ['#328FFF', '#675AFF', '#FFBC35'],
      description:
        'Color palette cycled through when rendering distribution/histogram charts in the Variable Distributions view.',
    },

    // --- Export ---
    MAX_DATA_POINTS_FOR_EXPORT: {
      group: 'Export',
      type: 'int',
      default: 1000000,
      description:
        'Maximum combined participant/filter/export count allowed before export; exceeding it blocks the review step with a warning.',
    },
    EXPORT_SYSTEM_FIELDS: {
      group: 'Export',
      type: 'string',
      default: '',
      description:
        'Comma-separated concept paths automatically included in every export query and shown as non-removable rows in the export review table.',
    },

    // --- Guided Tour ---
    AUTH_TOUR_NAME: {
      group: 'Guided Tour',
      type: 'string',
      default: 'NHANES-Auth',
      description:
        'Name of the tour definition (from TourConfiguration.json) used for the guided tour on the authenticated Explorer page.',
    },
    OPEN_TOUR_NAME: {
      group: 'Guided Tour',
      type: 'string',
      default: 'BDC-Open',
      description:
        'Name of the tour definition (from TourConfiguration.json) used for the guided tour on the public Discover page.',
    },
    EXPLORE_TOUR_SEARCH_TERM: {
      group: 'Guided Tour',
      type: 'string',
      default: 'age',
      description: 'Default search term the guided tour pre-fills/highlights in the search box.',
    },

    // --- Variant Explorer ---
    VARIANT_EXPLORER_EXCLUDE_COLUMNS: {
      group: 'Variant Explorer',
      type: 'json',
      default: [],
      description: "Column names to strip from the Variant Explorer's result table.",
    },
    VARIANT_EXPLORER_MAX_COUNT: {
      group: 'Variant Explorer',
      type: 'int',
      default: 10000,
      description:
        "Maximum number of variants the Variant Explorer will display before showing a 'Too many variants!' warning instead.",
    },
    VARIANT_EXPLORER_TYPE: {
      group: 'Variant Explorer',
      type: 'string',
      default: ExportType.Aggregate,
      description:
        "Default Variant Explorer export mode, 'aggregate' or 'full' ('full' additionally shows an extra column/checkbox).",
    },
  },
  branding: {
    // --- Logo ---
    LOGO_ALT: {
      group: 'Logo',
      type: 'string',
      default: 'PIC-SURE',
      description: 'Alt/title text for the site logo image shown in the header and login page.',
    },
    LOGO: {
      group: 'Logo',
      type: 'string',
      default: '',
      description:
        'URL of a custom logo image to display instead of the default PIC-SURE wordmark, in the header and login page.',
    },
  },
};

// API rows whose name isn't (or is no longer) a key in CONFIG_FIELDS[kind] - e.g. a
// feature flag that was removed from the app but whose row was never cleaned up in the
// backend. These have no effect on anything mapFeatures/mapSettings/mapBranding
// resolve (parsersFor only ever looks up registered names), so they're safe to delete;
// the admin UI surfaces them precisely because there's no other way to notice they're
// inert. Exact by construction: apiRows here is already the result of fetching
// ?kind=<that kind's value>, so every row already belongs to `kind` - no guessing.
export function deprecatedApiRows(kind: ConfigKind, apiRows: ConfigObject[]): ConfigObject[] {
  const known = CONFIG_FIELDS[kind];
  return apiRows.filter((row) => !(row.name in known));
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
      description: def.description,
      group: def.group,
    }));
    return acc;
  },
  {} as Record<ConfigKind, ConfigFieldSchema[]>,
);

export interface ConfigFieldGroup {
  group: string;
  fields: ConfigFieldSchema[];
}

// Buckets a schema list by relation (Google settings together, Analysis features
// together, etc.) instead of by type, for the admin UI's section headers. Section order
// follows each group's first appearance in the given list, so CONFIG_FIELDS'
// declaration order is the only place that ordering is controlled - no separate list.
// Takes the field list rather than a ConfigKind so it stays a pure function of its
// input - callers (and tests) pass whatever schema they have, mocked or not.
export function groupedConfigFieldSchema(schema: ConfigFieldSchema[]): ConfigFieldGroup[] {
  const groups: ConfigFieldGroup[] = [];
  const byName = new Map<string, ConfigFieldGroup>();
  for (const field of schema) {
    let bucket = byName.get(field.group);
    if (!bucket) {
      bucket = { group: field.group, fields: [] };
      byName.set(field.group, bucket);
      groups.push(bucket);
    }
    bucket.fields.push(field);
  }
  return groups;
}
