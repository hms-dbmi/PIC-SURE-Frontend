export const branding = {
  applicationName: 'PIC‑SURE',
  apiPage: {
    cards: [
      {
        header: 'What is the PIC‑SURE API?',
        body: 'The PIC-SURE Application Programming Interface allows you to search, query, and export data using Python or R. \n\nClick this card to read more about the PIC-SURE API.',
        link: '/api/help',
      },
      {
        header: 'PIC‑SURE API Examples',
        body: 'Get started using the PIC‑SURE API with real example code and analyses from simple queries to complex real-world use cases. \n\nClick this card to check out the PIC-SURE API example code.',
        link: 'https://pic-sure.org/about',
      },
    ],
  },
  landing: {
    searchPlaceholder: 'Search terms or variables of interest…',
    description:
      'PIC-SURE can be used to search phenotypic variables and genomic variants, apply filters, build cohorts, and export participant-level data.',
    actions: [
      {
        description: 'Explore data, apply filters, and build cohorts',
        icon: 'fa-solid fa-magnifying-glass fa-5x',
        url: '/explorer',
      },
      {
        description: 'Manage Previously Saved Datasets',
        icon: 'fa-solid fa-table-list fa-5x',
        url: '/dataset',
      },
      {
        description: 'Take a tour of the PIC-SURE API',
        icon: 'fa-solid fa-route fa-5x',
        url: '/explorer?tour=true',
      },
      {
        description: 'Learn more about PIC‑SURE',
        icon: 'fa-solid fa-circle-question fa-5x',
        url: 'https://pic-sure.org/about',
      },
    ],
    stats: [
      {
        title: 'Data Sources',
        value: '10',
        valueSrc: undefined,
      },
      {
        title: 'Variables',
        value: '1,000,000',
        valueSrc: undefined,
      },
      {
        title: 'Participants with Genomic Data',
        value: '1,000',
        valueSrc: undefined,
      },
    ],
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

export const domain = {
  name: 'pic-sure.org',
  url: 'https://nhanes-dev.hms.harvard.edu',
  supportEmail: '',
};
