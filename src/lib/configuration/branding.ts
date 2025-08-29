import type { Step } from '$lib/types';
import type { Column } from '$lib/components/datatable/types';
import type { StatField, StatConfig } from '$lib/models/Stat';

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

export function loadBrandingConfigs(branding: Partial<BrandingConfig>): BrandingConfig {
  const codeBlocks: CodeBlock = {
    ...defaultBranding.explorePage.codeBlocks,
    ...branding.explorePage?.codeBlocks,
  };
  Object.keys(codeBlocks).forEach((key: string) => {
    codeBlocks[key as keyof CodeBlock] = codeBlocks[key as keyof CodeBlock].replace(
      '{{PICSURE_NETWORK_URL}}',
      PROJECT_HOSTNAME,
    );
  });

  return {
    ...defaultBranding,
    ...branding,
    explorePage: {
      ...defaultBranding.explorePage,
      ...branding.explorePage,
      codeBlocks,
    },
  };
}
