import type { Column } from '$lib/components/datatable/types';
import type { StatConfig } from './models/Stat';

interface Link {
  title: string;
  url: string;
  newTab?: boolean;
  feature?: string;
}

export type Indexable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface Indexed<T> {
  [key: string]: T;
}

export interface SiteMapConfig {
  category: string;
  feature?: string;
  privilege: string;
  links: Array<Link>;
}

export interface FooterConfig {
  showSitemap: boolean;
  excludeSitemapOn: string[];
  links: Array<Link>;
}

interface CodeBlock {
  PythonExport: string;
  RExport: string;
  PythonAPI: string;
  RAPI: string;
}
export interface ExplorePageConfig {
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
    links: Array<Link>;
  };
  pfbExportUrls?: Link[];
}

export interface LandingConfig {
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
}

export interface ResultsConfig {
  totalStatKey: string;
  stats: StatConfig[];
  cohortDescription: string;
}

export interface DatasetRequestPageConfig {
  searchIntro: string;
}

export interface LoginConfig {
  description: string;
  showSiteName: boolean;
  openPicsureLink: string;
  openPicsureLinkText: string;
  contactLink: string;
}

export interface HelpConfig {
  links: Array<{
    title: string;
    description: string;
    icon: string;
    url: string;
  }>;
  popups: Indexable;
}

export interface PrivacyConfig {
  title: string;
  content: string;
  url: string;
}

export interface AnalysisConfig {
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
}

export interface Step {
  label: string;
  icon: string;
  description?: string;
  path?: string;
}

export interface CollaborateConfig {
  steps: Step[];
  introduction: string;
  findCollaborators: string;
}

export interface CodeBlockConfig extends Indexable {
  PythonExport: string;
  RExport: string;
  PythonAPI: string;
  RAPI: string;
}
