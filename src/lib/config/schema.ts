import {
  parsers,
  resolveConfigMap,
  type ConfigKind,
  type ConfigMap,
  type ConfigObject,
} from './resolve.ts';

// Adding a feature flag or setting is one edit in this file: its type, its CONFIG_FIELDS
// entry and its line in mapFeatures/mapSettings.

export enum ExportType {
  Full = 'full',
  Aggregate = 'aggregate',
}

export type Features = {
  analyzeApi: boolean;
  confirmDownload: boolean;
  confirmExternalNavigation: boolean;
  dashboard: boolean;
  dashboardDrawer: boolean;
  discover: boolean;
  enableGENEQuery: boolean;
  enableSNPQuery: boolean;
  enforceTermsOfService: boolean;
  explorer: {
    allowDownload: boolean;
    allowExport: boolean;
    distributionExplorer: boolean;
    enableExportTimeseries: boolean;
    enableHierarchy: boolean;
    enablePfbExport: boolean;
    enableSampleIdCheckbox: boolean;
    enableTour: boolean;
    exportsEnableExport: boolean;
    showTreeStep: boolean;
    variantExplorer: boolean;
    open: boolean;
  };
  login: {
    open: boolean;
  };
  restoreV2queries: boolean;
  termsOfService: boolean;
  wafCaptchaRecovery: boolean;
};

export type Settings = {
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
  };
  variantExplorer: {
    excludeColumns: string[];
    maxCount: number;
    type: ExportType;
  };
  exportSystemFields: string[];
  dataset: {
    bypassConceptLookup: string[];
  };
};

// Admin UI section headers. The key is the stable id (testids use it); the value is the
// label shown to admins.
export const CONFIG_GROUPS = {
  analysis: 'Analysis',
  access: 'Access & Login',
  explorer: 'Explorer & Search',
  tour: 'Guided Tour',
  genomic: 'Genomic Search',
  export: 'Export',
  dashboard: 'Dashboard',
  navigation: 'Navigation',
  captcha: 'Captcha',
  google: 'Google',
  dataset: 'Dataset Management',
  appearance: 'Appearance',
  logo: 'Logo',
} as const;

export type ConfigGroup = keyof typeof CONFIG_GROUPS;

export type FieldType = 'boolean' | 'int' | 'json' | 'string';
export interface FieldDef {
  type: FieldType;
  default: unknown;
  description: string;
  // Groups fields by relation (e.g. all Google settings together) rather than by type,
  // for the admin UI's section headers. Order of the section headers falls out of
  // declaration order below - fields are clustered by group for that reason - so there's
  // no separate ordering list to keep in sync with this table.
  group: ConfigGroup;
}

export const CONFIG_FIELDS: Record<ConfigKind, Record<string, FieldDef>> = {
  features: {
    // --- Analysis ---
    ANALYZE_API: {
      group: 'analysis',
      type: 'boolean',
      default: true,
      description:
        "Enables the 'Prepare for Analysis' (API) page and navigation item, and defaults the export flow's code tab to Python when available.",
    },

    // --- Access & Login ---
    // OPEN feeds both explorer.open (AND'd with OPEN_EXPLORER) and login.open below.
    OPEN: {
      group: 'access',
      type: 'boolean',
      default: false,
      description:
        "Allows unauthenticated access to the app (skips the forced login redirect) and, combined with OPEN_EXPLORER, makes the Explorer page reachable without logging in. Also shows the 'Explore without Login' entry point.",
    },
    OPEN_EXPLORER: {
      group: 'access',
      type: 'boolean',
      default: false,
      description:
        'Combined with OPEN: when both are enabled, the Explorer page is reachable without logging in.',
    },
    DISCOVER: {
      group: 'access',
      type: 'boolean',
      default: false,
      description:
        'Enables the public Discover page and navigation item; when disabled, /discover redirects to /explorer and anonymous searches route to /explorer instead.',
    },
    ENFORCE_TOS_ACCEPT: {
      group: 'access',
      type: 'boolean',
      default: false,
      description:
        "Forces logged-in users who haven't accepted the Terms of Service to accept it before continuing, blocking dismissal of the TOS modal.",
    },
    ENABLE_TOS: {
      group: 'access',
      type: 'boolean',
      default: false,
      description:
        'Enables the Terms of Service feature: adds a footer link to view it, and an admin link to edit it.',
    },
    // --- Explorer & Search ---
    ALLOW_EXPORT: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description:
        "Shows or hides the 'Export' option on the Explorer results panel that starts the export/analysis flow.",
    },
    ALLOW_EXPORT_ENABLED: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description:
        'Shows a per-row action on search results to add that variable to the export, and contributes to the export button/badge visibility.',
    },
    DIST_EXPLORER: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description:
        'Enables the Variable Distributions (visualizations) view on the Explorer and Discover results panels.',
    },
    ENABLE_HIERARCHY: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description:
        "Shows a 'Data Hierarchy' action on search results, letting users view a variable's hierarchy tree and build anyRecordOf queries.",
    },
    SHOW_TREE_STEP: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description: "Adds a 'Finalize Data' step to the export stepper flow.",
    },
    ENABLE_SAMPLE_ID_CHECKBOX: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description:
        "Shows an 'Include sample identifiers' checkbox in the export review step that adds sample IDs to the export/query.",
    },
    RESTORE_V2_QUERY: {
      group: 'explorer',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Restore Filters' button for older (V2) saved queries; V3 queries always show it regardless.",
    },

    // --- Guided Tour --- (joined by AUTH_TOUR_NAME and OPEN_TOUR_NAME from settings, once
    // features+settings are merged in the admin UI)
    EXPLORE_TOUR: {
      group: 'tour',
      type: 'boolean',
      default: true,
      description: 'Shows the guided walkthrough tour button on the Explorer/Discover pages.',
    },

    // --- Genomic Search ---
    ENABLE_GENE_QUERY: {
      group: 'genomic',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Variants by gene name' genomic search option and enables gene-based variant queries.",
    },
    ENABLE_SNP_QUERY: {
      group: 'genomic',
      type: 'boolean',
      default: false,
      description:
        "Shows the 'Specific Variants' (SNP) genomic search option and enables SNP-based variant queries.",
    },
    VARIANT_EXPLORER: {
      group: 'genomic',
      type: 'boolean',
      default: false,
      description:
        "Enables the Variant Explorer feature; when disabled, the Variant Explorer page shows a 'not enabled' message instead of rendering.",
    },

    // --- Export ---
    EXPORT_TIMESERIES: {
      group: 'export',
      type: 'boolean',
      default: true,
      description: "Shows the 'Export as Timeseries' option in the export type selection step.",
    },
    DOWNLOAD_AS_PFB: {
      group: 'export',
      type: 'boolean',
      default: true,
      description:
        'Enables PFB (Avro) as an export format option alongside CSV in the export flow.',
    },
    CONFIRM_DOWNLOAD: {
      group: 'export',
      type: 'boolean',
      default: false,
      description:
        'Shows a confirmation dialog before downloading exported data, instead of downloading immediately.',
    },
    ALLOW_DOWNLOAD: {
      group: 'export',
      type: 'boolean',
      default: true,
      description:
        'Shows or hides the download button for exported CSV/PFB data in the export flow.',
    },

    // --- Dashboard ---
    DASHBOARD: {
      group: 'dashboard',
      type: 'boolean',
      default: false,
      description:
        'Shows or hides the Data Dashboard page and its navigation item. With it off, /dashboard redirects to the home page.',
    },
    DASHBOARD_DRAWER: {
      group: 'dashboard',
      type: 'boolean',
      default: false,
      description:
        'Makes Data Dashboard rows clickable, opening a drawer with more detail about the selected row.',
    },

    // --- Navigation ---
    CONFIRM_EXTERNAL_NAVIGATION: {
      group: 'navigation',
      type: 'boolean',
      default: false,
      description:
        'Shows a confirmation dialog before following links to external (off-site) destinations.',
    },

    // --- CAPTCHA ---
    WAF_CAPTCHA_RECOVERY: {
      group: 'captcha',
      type: 'boolean',
      default: false,
      description: 'Shows a CAPTCHA challenge on API and page requests.',
    },
  },
  settings: {
    // --- Google ---
    GOOGLE_ANALYTICS_ID: {
      group: 'google',
      type: 'string',
      default: '',
      description:
        'Google Analytics measurement ID; when set (with a privacy policy configured), loads Google Analytics and triggers the cookie-consent prompt.',
    },
    GOOGLE_TAG_MANAGER_ID: {
      group: 'google',
      type: 'string',
      default: '',
      description:
        'Google Tag Manager container ID; when set, loads the GTM script/iframe alongside the same consent prompt.',
    },

    // --- Explorer & Search --- (joined by DIST_EXPLORER and others from features, once
    // features+settings are merged in the admin UI)
    DIST_EXPLORER_GRAPH_COLORS: {
      group: 'explorer',
      type: 'json',
      default: ['#328FFF', '#675AFF', '#FFBC35'],
      description:
        'Color palette cycled through when rendering distribution/histogram charts in the Variable Distributions view.',
    },

    DATASET_BYPASS_CONCEPT_LOOKUP: {
      group: 'dataset',
      type: 'string',
      default: '',
      description:
        'System fields to bypass dictionary lookup on dataset view and restore. (Loads from dictionary/concepts/detail/{conceptPathDataset} otherwise.)',
    },

    // --- Export ---
    MAX_DATA_POINTS_FOR_EXPORT: {
      group: 'export',
      type: 'int',
      default: 1000000,
      description:
        'Maximum combined participant/filter/export count allowed before export; exceeding it blocks the review step with a warning.',
    },
    EXPORT_SYSTEM_FIELDS: {
      group: 'export',
      type: 'string',
      default: '',
      description:
        'Comma-separated concept paths automatically included in every export query and shown as non-removable rows in the export review table.',
    },

    // --- Guided Tour ---
    AUTH_TOUR_NAME: {
      group: 'tour',
      type: 'string',
      default: 'NHANES-Auth',
      description:
        'Name of the tour definition (from TourConfiguration.json) used for the guided tour on the authenticated Explorer page.',
    },
    OPEN_TOUR_NAME: {
      group: 'tour',
      type: 'string',
      default: 'BDC-Open',
      description:
        'Name of the tour definition (from TourConfiguration.json) used for the guided tour on the public Discover page.',
    },

    // --- Genomic Search --- (joined by ENABLE_GENE_QUERY, ENABLE_SNP_QUERY, and
    // VARIANT_EXPLORER from features, once features+settings are merged in the admin UI)
    VARIANT_EXPLORER_EXCLUDE_COLUMNS: {
      group: 'genomic',
      type: 'json',
      default: [],
      description: "Column names to strip from the Variant Explorer's result table.",
    },
    VARIANT_EXPLORER_MAX_COUNT: {
      group: 'genomic',
      type: 'int',
      default: 10000,
      description:
        "Maximum number of variants the Variant Explorer will display before showing a 'Too many variants!' warning instead.",
    },
    VARIANT_EXPLORER_TYPE: {
      group: 'genomic',
      type: 'string',
      default: ExportType.Aggregate,
      description:
        "Default Variant Explorer export mode, 'aggregate' or 'full' ('full' additionally shows an extra column/checkbox).",
    },
  },
  branding: {
    THEME: {
      group: 'appearance',
      type: 'string',
      default: 'picsure',
      description: 'The overall PIC-SURE theme colors.',
    },
    DOTS_COLORS_CLASS: {
      group: 'appearance',
      type: 'json',
      default: [],
      description:
        'Overrides the colors of the decorative dot graphic on the login page; must be an array of exactly 3 or 5 color values, otherwise the default is kept.',
    },
    // --- Logo ---
    LOGO_ALT: {
      group: 'logo',
      type: 'string',
      default: '',
      description:
        'Alt/title text for the site logo image shown in the header and login page. Defaults to the application name used in page titles.',
    },
    LOGO: {
      group: 'logo',
      type: 'string',
      default: '',
      description:
        'URL of a custom logo image to display instead of the default PIC-SURE wordmark, in the header and login page.',
    },
  },
};

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
    if (!Object.hasOwn(fields, name))
      throw new Error(`"${name}" is not registered in CONFIG_FIELDS.${kind}.`);
    return fields[name];
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
    analyzeApi: parse('ANALYZE_API'),
    confirmDownload: parse('CONFIRM_DOWNLOAD'),
    confirmExternalNavigation: parse('CONFIRM_EXTERNAL_NAVIGATION'),
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
      enableExportTimeseries: parse('EXPORT_TIMESERIES'),
      enableHierarchy: parse('ENABLE_HIERARCHY'),
      enablePfbExport: parse('DOWNLOAD_AS_PFB'),
      enableSampleIdCheckbox: parse('ENABLE_SAMPLE_ID_CHECKBOX'),
      enableTour: parse('EXPLORE_TOUR'),
      exportsEnableExport: parse('ALLOW_EXPORT_ENABLED'),
      showTreeStep: parse('SHOW_TREE_STEP'),
      variantExplorer: parse('VARIANT_EXPLORER'),
    },
    login: {
      open: parse('OPEN'),
    },
    restoreV2queries: parse('RESTORE_V2_QUERY'),
    termsOfService: parse('ENABLE_TOS'),
    wafCaptchaRecovery: parse('WAF_CAPTCHA_RECOVERY'),
  };
}

function asFieldList(list: string): string[] {
  return list
    .split(',')
    .map((f: string) => f.trim())
    .filter(Boolean)
    .map((f: string) => `\\${f}\\`);
}

export function mapSettings(apiSettings: ConfigObject[]): Settings {
  const parse = parsersFor('settings', resolveConfigMap(apiSettings));
  return {
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
    },
    variantExplorer: {
      excludeColumns: parse.asJson('VARIANT_EXPLORER_EXCLUDE_COLUMNS') as string[],
      maxCount: parse.asInt('VARIANT_EXPLORER_MAX_COUNT'),
      type:
        parse.asString('VARIANT_EXPLORER_TYPE') === ExportType.Full
          ? ExportType.Full
          : ExportType.Aggregate,
    },
    exportSystemFields: asFieldList(parse.asString('EXPORT_SYSTEM_FIELDS')),
    dataset: {
      bypassConceptLookup: asFieldList(parse.asString('DATASET_BYPASS_CONCEPT_LOOKUP')),
    },
  };
}
