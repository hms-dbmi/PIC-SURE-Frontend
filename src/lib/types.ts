export type Indexable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface Indexed<T> {
  [key: string]: T;
}

export interface SiteMapConfig {
  category: string;
  privilege: string;
  links: Array<{
    title: string;
    url: string;
    newTab?: boolean;
  }>;
}

export interface FooterConfig {
  showSitemap: boolean;
  showTerms: boolean;
  excludeSitemapOn: string[];
  links: Array<{
    title: string;
    url: string;
    newTab?: boolean;
  }>;
}

export interface ApiPageConfig {
  cards: Array<{
    header: string;
    body: string;
    link: string;
  }>;
}

export interface ExplorePageConfig {
  tourSearchTerm: string;
  tourSearchIntro: string;
  totalPatientsText: string;
  queryErrorText: string;
  filterErrorText: string;
}

export interface LandingConfig {
  searchPlaceholder: string;
  explanation: string;
  actions: Array<{
    title: string;
    description: string;
    icon: string;
    url: string;
    btnText: string;
  }>;
  stats: string[];
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
