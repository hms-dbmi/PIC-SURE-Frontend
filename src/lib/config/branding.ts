import configJson from '#lib/assets/configuration.json' with { type: 'json' };
import type { Column } from '#lib/ui/datatable/types.ts';
import { deepMerge } from '#lib/utils/objects.ts';
import { resolveConfigMap, type ConfigObject } from './resolve.ts';
import { parsersFor, type Features } from './schema.ts';

interface Link {
  title: string;
  url: string;
  newTab?: boolean;
  feature?: keyof Features;
}

interface CodeBlockConfig {
  PythonExport: string;
  RExport: string;
  PythonAPI: string;
  RAPI: string;
  PythonAPIOpen: string;
  RAPIOpen: string;
  CurlAPI: string;
}

export interface StatConfig {
  key: string;
  label: string;
  // A fixed count shown instead of querying for one; same shape as query/counts' StatValue.
  value?: string | number | { [key: string]: string | number | undefined };
  auth?: boolean;
}

export interface StatField {
  label: string;
  id: string;
  conceptPath: string;
}

export interface ApiCapability {
  text: string;
  requiresLogin?: boolean;
}

export interface ApiPageConfig {
  capabilities: ApiCapability[];
  publicKeyEnabled?: boolean;
}

export type Branding = {
  applicationName: string;
  theme: string;
  dotsColorsClass: string[];
  logo: {
    alt: string;
    src: string;
  };
  statFields: { [key: string]: StatField[] };
  sitemap: {
    category: string;
    feature?: keyof Features;
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
    popups: Record<string, Record<string, string>>;
  };
  privacyPolicy: {
    title: string;
    content: string;
    url: string;
  };
  analysisPage: {
    analysis: {
      platform: string;
      introduction: string;
      access: string;
      examples: string;
    };
  };
  apiPage: ApiPageConfig;
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

export function mapBranding(hostname: string, apiBranding: ConfigObject[] = []): Branding {
  const branding = deepMerge<Branding>(
    {
      analysisPage: {
        analysis: {
          platform: '',
          introduction: '',
          access: '',
          examples: '',
        },
      },
      apiPage: { capabilities: [] },
      applicationName: 'PIC‑SURE',
      theme: 'picsure',
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
          PythonAPIOpen: '',
          RAPIOpen: '',
          CurlAPI: '',
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
      dotsColorsClass: [],
      logo: {
        alt: '',
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
  // The Python client takes the deployment root and adds /picsure and /psama itself.
  const origin = hostname.replace(/\/picsure\/?$/, '');
  const replaceHostname = (codeBlock: string) =>
    codeBlock
      .replaceAll('{{PICSURE_NETWORK_URL}}', hostname)
      .replaceAll('{{PICSURE_ORIGIN}}', origin);
  for (const key of Object.keys(codeBlocks) as (keyof CodeBlockConfig)[]) {
    if (typeof codeBlocks[key] === 'string') {
      codeBlocks[key] = replaceHostname(codeBlocks[key]);
    }
  }
  branding.explorePage.codeBlocks = codeBlocks;

  // ENV or API overrides
  const parser = parsersFor('branding', resolveConfigMap(apiBranding));
  branding.theme = parser.asString('THEME');
  branding.logo.alt = parser.asString('LOGO_ALT') || branding.logo.alt || branding.applicationName;
  branding.logo.src = parser.asString('LOGO');
  branding.dotsColorsClass = parser.asJson('DOTS_COLORS_CLASS') as string[];

  return branding;
}
