import { PicsurePrivileges } from './models/Privilege';
import type { Route } from './models/Route';
import { ExportType } from './models/Variant';
import type { Indexable } from './types';

export const branding = {
  applicationName: 'PIC‑SURE',
  sitemap: [
    {
      category: 'Configuration',
      privilege: PicsurePrivileges.SUPER,
      links: [
        { title: 'Authorization', url: '/admin/authorization' },
        { title: 'Authentication', url: '/admin/authentication' },
      ],
    },
    {
      category: 'Administration',
      privilege: PicsurePrivileges.ADMIN,
      links: [{ title: 'User Management', url: '/admin/users' }],
    },
    {
      category: 'Use PIC-SURE',
      privilege: PicsurePrivileges.QUERY,
      links: [
        { title: 'Explore', url: '/explorer' },
        { title: 'Analyze', url: '/analyze' },
        { title: 'Manage Datasets', url: '/dataset' },
      ],
    },
    {
      category: 'Help',
      links: [
        { title: 'User Guide', url: 'https://pic-sure.gitbook.io/pic-sure', newTab: true },
        { title: 'Videos', url: 'https://www.youtube.com/@pic-sure446/featured', newTab: true },
        { title: 'About', url: 'http://pic-sure.org/', newTab: true },
      ],
    },
  ],
  footer: {
    showSitemap: true,
    excludeSitemapOn: ['/explorer'],
    links: [
      {
        title: 'Terms of Service',
        url: '#',
      },
      {
        title: 'Privacy Policy',
        url: 'https://pic-sure.gitbook.io/pic-sure/privacy-policy',
        newTab: true,
      },
      {
        title: 'Contact Us',
        url: 'https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5',
        newTab: true,
      },
    ],
  },
  apiPage: {
    cards: [
      {
        header: 'What is the PIC‑SURE API?',
        body: 'The PIC-SURE Application Programming Interface allows you to search, query, and export data using Python or R. \n\nClick this card to read more about the PIC-SURE API.',
        link: '/analyze/help',
      },
      {
        header: 'PIC‑SURE API Examples',
        body: 'Get started using the PIC‑SURE API with real example code and analyses from simple queries to complex real-world use cases. \n\nClick this card to check out the PIC-SURE API example code.',
        link: '/analyze/start',
      },
    ],
  },
  explorePage: {
    totalPatientsText: 'Filtered Results',
    queryErrorText:
      'There was an error with your query. If this persists, please contact you PIC-SURE admin.',
  },
  landing: {
    searchPlaceholder: 'Search terms or variables of interest…',
    explanation:
      'The <a href="https://www.cdc.gov/nchs/nhanes/index.htm" target="_blank">National Health and Nutrition Examination Survey (NHANES)</a> dataset is designed to assess the health and nutritional status of adults and children in the United States',
    actions: [
      {
        title: 'Explore',
        description: 'Explore data, apply filters, and build cohorts',
        icon: 'fa-solid fa-magnifying-glass fa-5x',
        url: '/explorer',
      },
      {
        title: 'Analyze',
        description: 'Access data and kickstart your research',
        icon: 'fa-solid fa-chart-line fa-5x',
        url: '/analyze',
      },
    ],
    stats: ['Variables', 'Participants', 'Data Sources'],
  },
  login: {
    title: undefined,
    description: undefined,
    showSiteName: false,
    openPicsureLink: '/',
    openPicsureLinkText: 'Explore without Login',
  },
  help: {
    links: [
      {
        title: 'User Guide',
        description: 'Complete user manual for seamless navigation and utilization.',
        icon: 'fa-solid fa-book fa-4x',
        url: 'https://pic-sure.gitbook.io/pic-sure',
      },
      {
        title: 'Video Library',
        description: "Example 'how-to' video demonstrations.",
        icon: 'fa-solid fa-tv fa-4x',
        url: 'https://www.youtube.com/@pic-sure446/featured',
      },
      {
        title: 'Request Assistance',
        description: 'Need help? Submit a service desk ticket, we are here to help!',
        icon: 'fa-solid fa-hands-holding-circle fa-4x',
        url: 'https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5',
      },
      {
        title: 'PIC-SURE Website',
        description: 'Check out the PIC-SURE website for information.',
        icon: 'fa-solid fa-circle-info fa-4x',
        url: 'https://pic-sure.org/',
      },
    ],
  },
};

export const routes: Route[] = [
  { path: '/explorer', text: 'Explore' },
  { path: '/analyze', text: 'Analyze', privilege: PicsurePrivileges.QUERY },
  { path: '/dataset', text: 'Manage Datasets', privilege: PicsurePrivileges.QUERY },
  { path: '/admin/users', text: 'User Management', privilege: PicsurePrivileges.ADMIN },
  {
    path: '/admin',
    text: 'Configuration',
    privilege: PicsurePrivileges.SUPER,
    children: [
      { path: '/admin/authorization', text: 'Authorization', privilege: PicsurePrivileges.SUPER },
      { path: '/admin/authentication', text: 'Authentication', privilege: PicsurePrivileges.SUPER },
    ],
  },
  { path: '/help', text: 'Help' },
];

export const features: Indexable = {
  explorer: {
    allowExport: import.meta.env?.VITE_ALLOW_EXPORT === 'true',
    exportsEnableExport: import.meta.env?.VITE_ALLOW_EXPORT_ENABLED === 'true',
    variantExplorer: import.meta.env?.VITE_VARIANT_EXPLORER === 'true',
  },
  dataRequests: import.meta.env?.VITE_DATA_REQUESTS === 'true',
  genomicFilter: import.meta.env?.VITE_GENOMIC_FILTER === 'true',
};

export const settings: Indexable = {
  variantExplorer: {
    type: (import.meta.env?.VITE_VARIANT_EXPLORER_TYPE || ExportType.Aggregate) as ExportType,
    maxCount: parseInt(import.meta.env?.VITE_VARIANT_EXPLORER_MAX_COUNT || 10000),
    excludeColumns: JSON.parse(import.meta.env?.VITE_VARIANT_EXPLORER_EXCLUDE_COLUMNS || '[]'),
  },
};

export const resources = {
  hpds: import.meta.env?.VITE_RESOURCE_HPDS || '',
};
