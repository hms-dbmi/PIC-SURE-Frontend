var PicsurePrivileges = /* @__PURE__ */ ((PicsurePrivileges2) => {
  PicsurePrivileges2["QUERY"] = "PIC_SURE_ANY_QUERY";
  PicsurePrivileges2["ADMIN"] = "ADMIN";
  PicsurePrivileges2["DATA_ADMIN"] = "DATA_ADMIN";
  PicsurePrivileges2["SUPER"] = "SUPER_ADMIN";
  return PicsurePrivileges2;
})(PicsurePrivileges || {});
var BDCPrivileges = /* @__PURE__ */ ((BDCPrivileges2) => {
  BDCPrivileges2["AUTHORIZED_ACCESS"] = "AUTHORIZED_ACCESS";
  BDCPrivileges2["OPEN"] = "MANAGED_PRIV_OPEN_ACCESS";
  BDCPrivileges2["NAMED_DATASET"] = "MANUAL_PRIV_NAMED_DATASET";
  BDCPrivileges2["PRIV_MANAGED"] = "PRIV_MANAGED_";
  BDCPrivileges2["DICTIONARY"] = "MANAGED_PRIV_DICTIONARY";
  return BDCPrivileges2;
})(BDCPrivileges || {});
function mapPrivilege(data) {
  return {
    ...data,
    application: data.application?.uuid || ""
  };
}
const applicationName = "PIC‑SURE";
const sitemap = [
  {
    category: "Configuration",
    privilege: "SUPER_ADMIN",
    links: [
      {
        title: "Authorization",
        url: "/admin/authorization"
      },
      {
        title: "Authentication",
        url: "/admin/authentication"
      }
    ]
  },
  {
    category: "Administration",
    privilege: "ADMIN",
    links: [
      {
        title: "Manage Users",
        url: "/admin/users"
      }
    ]
  },
  {
    category: "Use PIC-SURE",
    privilege: "PIC_SURE_ANY_QUERY",
    links: [
      {
        title: "Explore",
        url: "/explorer"
      },
      {
        title: "Analyze",
        url: "/analyze"
      },
      {
        title: "Manage Datasets",
        url: "/dataset"
      }
    ]
  },
  {
    category: "Help",
    links: [
      {
        title: "User Guide",
        url: "https://pic-sure.gitbook.io/pic-sure",
        newTab: true
      },
      {
        title: "Videos",
        url: "https://www.youtube.com/@pic-sure446/featured",
        newTab: true
      },
      {
        title: "About",
        url: "http://pic-sure.org/",
        newTab: true
      }
    ]
  }
];
const footer = {
  showSitemap: true,
  excludeSitemapOn: [
    "/explorer",
    "/discover"
  ],
  links: [
    {
      title: "Privacy Policy",
      url: "https://pic-sure.gitbook.io/pic-sure/privacy-policy",
      newTab: true
    },
    {
      title: "Contact Us",
      url: "https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5",
      newTab: true
    }
  ]
};
const explorePage = {
  additionalColumns: [
    {
      dataElement: "dataset",
      label: "Study",
      sort: false
    }
  ],
  tourSearchIntro: "PIC-SURE Search allows you to search for variable level data.",
  totalPatientsText: "Filtered Participants",
  queryErrorText: "There was an error with your query. If this persists, please contact you PIC-SURE admin.",
  filterErrorText: 'There was an error when adding the filter to the query. Please remove your most recent filter and try again. If this error persists, please contact us by filling out the form at <a class="anchor" href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank" class="underline">Avillach Lab Software Requests</a>. We will respond to your request as soon as we can.',
  confirmDownloadTitle: "Are you sure you want to download data?",
  confirmDownloadMessage: "This action will download the data to your local machine. Are you sure you want to proceed?"
};
const landing = {
  searchPlaceholder: "Search terms or variables of interest…",
  explanation: 'The <a class="anchor" href="https://www.cdc.gov/nchs/nhanes/index.htm" target="_blank">National Health and Nutrition Examination Survey (NHANES)</a> dataset is designed to assess the health and nutritional status of adults and children in the United States',
  authExplanation: 'The <a class="anchor" href="https://www.cdc.gov/nchs/nhanes/index.htm" target="_blank">National Health and Nutrition Examination Survey (NHANES)</a> dataset is designed to assess the health and nutritional status of adults and children in the United States',
  actions: [
    {
      title: "Discover",
      description: "Discover studies in BioData Catalyst by searching for terms, applying filters, and retrieving aggregate counts",
      icon: "fa-regular fa-compass",
      url: "/discover",
      btnText: "Start Discovering",
      isOpen: true,
      showIfLoggedIn: true
    },
    {
      title: "Explore",
      description: "Explore data, apply filters, and build cohorts",
      icon: "fa-solid fa-magnifying-glass",
      url: "/explorer",
      btnText: "Start Exploring",
      isOpen: false,
      showIfLoggedIn: true
    },
    {
      title: "Prepare for Analysis",
      description: "Use the PIC-SURE API to prepare data for analysis",
      icon: "fa-solid fa-chart-line",
      url: "/analyze",
      btnText: "Prepare for Analysis",
      isOpen: false,
      showIfLoggedIn: true
    },
    {
      title: "Login",
      description: "Log In to explore participant-level data, save datasets, and kickstart your research analysis",
      icon: "fa-solid fa-user",
      url: "/login",
      btnText: "Go to Login",
      isOpen: true,
      showIfLoggedIn: false
    }
  ],
  stats: [
    "Variables",
    "Participants",
    "Data Sources"
  ]
};
const analysisPage = {
  cards: [
    {
      header: "Setting Up the PIC-SURE API",
      body: "Step-by-step instructions to get started using the PIC-SURE API",
      link: "/analyze/example"
    }
  ],
  instructions: {
    connection: 'To connect to the PIC-SURE Application Programming Interface (API), you will need your personal access token. Copy your token and save as a text file called "token.txt" in the working directory of your chosen analysis workspace.',
    execution: "To start your analysis, copy and execute the following code in your preferred analysis environment to connect to the PIC-SURE API. Note that you will need your personal access token to complete the connection."
  }
};
const login = {
  description: "Where searching for, filtering on, and analyzing data is made simple.",
  showSiteName: false,
  openPicsureLink: "/",
  openPicsureLinkText: "Explore without Login",
  contactLink: "https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5"
};
const help = {
  links: [
    {
      title: "User Guide",
      description: "Complete user manual for seamless navigation and utilization.",
      icon: "fa-solid fa-book fa-4x",
      url: "https://pic-sure.gitbook.io/pic-sure"
    },
    {
      title: "Video Library",
      description: "Example 'how-to' video demonstrations.",
      icon: "fa-solid fa-circle-play fa-4x",
      url: "https://www.youtube.com/@pic-sure446/featured"
    },
    {
      title: "Request Help",
      description: "Need help? Submit a service desk ticket, we are here to help!",
      icon: "fa-solid fa-handshake fa-4x",
      url: "https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5"
    },
    {
      title: "PIC-SURE",
      description: "Check out the PIC-SURE website for information.",
      icon: "fa-solid fa-circle-info fa-4x",
      url: "https://pic-sure.org/"
    }
  ],
  popups: {
    genomicFilter: {
      frequency: "The variant allele frequency in gnomAD combined population as discrete text categories. Possible values: Novel (variant not in gnomAD database), Rare (variant frequency less than 1%), Common (variant frequency greater than or equal to 1%).",
      consequence: "A standardized term from the Sequence Ontology (http://www.sequenceontology.org) to describe the calculated consequence of a variant. The severity for the calculated consequence of a variant on a gene has possible values HIGH (frameshift, splice disrupting, or truncating variants), MEDIUM (non-frameshift insertions or deletions, variants altering protein sequencing without affecting its length) or LOW (other coding variants including synonymous variants)."
    }
  }
};
const privacyPolicy = {
  title: "Privacy Policy",
  content: "This is the privacy policy for the PIC-SURE application.",
  url: "https://pic-sure.gitbook.io/pic-sure/privacy-policy"
};
var ExportType = /* @__PURE__ */ ((ExportType2) => {
  ExportType2["Full"] = "full";
  ExportType2["Aggregate"] = "aggregate";
  return ExportType2;
})(ExportType || {});
const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true };
const branding = {
  applicationName: "PIC‑SURE",
  logo: {
    alt: __vite_import_meta_env__?.VITE_LOGO_ALT || "PIC‑SURE",
    src: __vite_import_meta_env__?.VITE_LOGO || ""
  },
  sitemap: [],
  footer: {},
  explorePage: {
    tourSearchTerm: __vite_import_meta_env__?.EXPLORE_TOUR_SEARCH_TERM || "age"
  },
  landing: {},
  login: {},
  help: {},
  privacyPolicy: {},
  analysisConfig: {}
};
const initializeBranding = () => {
  branding.applicationName = applicationName;
  branding.explorePage = { ...branding.explorePage, ...explorePage };
  branding.landing = landing;
  branding.login = login;
  branding.help = help;
  branding.footer = footer;
  branding.sitemap = sitemap;
  branding.privacyPolicy = privacyPolicy;
  branding.analysisConfig = analysisPage;
};
const routes = [
  {
    path: "/dashboard",
    text: "Data Dashboard",
    feature: "dashboard"
  },
  {
    path: "/discover",
    text: "Discover",
    feature: "discover"
  },
  {
    path: "/explorer",
    text: "Explore",
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS]
  },
  {
    path: "/analyze",
    text: "Prepare for Analysis",
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS]
  },
  {
    path: "/dataset",
    text: "Manage Datasets",
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.NAMED_DATASET]
  },
  {
    path: "/admin/requests",
    text: "Data Requests",
    privilege: [PicsurePrivileges.DATA_ADMIN],
    feature: "dataRequests"
  },
  {
    path: "/admin",
    text: "Configuration",
    privilege: [PicsurePrivileges.SUPER],
    children: [
      { path: "/admin/authorization", text: "Authorization", privilege: [PicsurePrivileges.SUPER] },
      {
        path: "/admin/authentication",
        text: "Authentication",
        privilege: [PicsurePrivileges.SUPER]
      }
    ]
  },
  { path: "/admin/users", text: "Manage Users", privilege: [PicsurePrivileges.ADMIN] },
  { path: "/help", text: "Help" }
];
const features = {
  explorer: {
    allowExport: __vite_import_meta_env__?.VITE_ALLOW_EXPORT === "true",
    exportsEnableExport: __vite_import_meta_env__?.VITE_ALLOW_EXPORT_ENABLED === "true",
    exportResultType: __vite_import_meta_env__?.VITE_EXPORT_RESULT_TYPE || "DATAFRAME",
    variantExplorer: __vite_import_meta_env__?.VITE_VARIANT_EXPLORER === "true",
    distributionExplorer: __vite_import_meta_env__?.VITE_DIST_EXPLORER === "true",
    enableTour: __vite_import_meta_env__?.EXPLORER_TOUR ? __vite_import_meta_env__?.EXPLORE_TOUR === "true" : true,
    // default to true unless set otherwise
    authTour: __vite_import_meta_env__?.VITE_AUTH_TOUR_NAME ?? "NHANES-Auth",
    enableHierarchy: __vite_import_meta_env__?.VITE_ENABLE_HIERARCHY === "true",
    enableTerraExport: __vite_import_meta_env__?.VITE_ENABLE_TERRA_EXPORT === "true",
    enableSampleIdCheckbox: __vite_import_meta_env__?.VITE_ENABLE_SAMPLE_ID_CHECKBOX === "true"
  },
  login: {
    open: __vite_import_meta_env__?.VITE_OPEN === "true"
  },
  dataRequests: __vite_import_meta_env__?.VITE_DATA_REQUESTS === "true",
  enableSNPQuery: __vite_import_meta_env__?.VITE_ENABLE_SNP_QUERY === "true",
  enableGENEQuery: __vite_import_meta_env__?.VITE_ENABLE_GENE_QUERY === "true",
  requireConsents: __vite_import_meta_env__?.VITE_REQUIRE_CONSENTS === "true",
  useQueryTemplate: __vite_import_meta_env__?.VITE_USE_QUERY_TEMPLATE === "true",
  discover: __vite_import_meta_env__?.VITE_DISCOVER === "true",
  discoverFeautures: {
    enableTour: __vite_import_meta_env__?.EXPLORER_TOUR !== "false",
    openTour: __vite_import_meta_env__?.VITE_OPEN_TOUR_NAME ?? "BDC-Open",
    distributionExplorer: __vite_import_meta_env__?.VITE_DIST_EXPLORER === "true"
  },
  dashboard: __vite_import_meta_env__?.VITE_DASHBOARD === "true",
  dashboardDrawer: __vite_import_meta_env__?.VITE_DASHBOARD_DRAWER === "true",
  confirmDownload: __vite_import_meta_env__?.VITE_CONFIRM_DOWNLOAD === "true",
  termsOfService: __vite_import_meta_env__?.VITE_ENABLE_TOS === "true"
};
const settings = {
  variantExplorer: {
    type: __vite_import_meta_env__?.VITE_VARIANT_EXPLORER_TYPE || ExportType.Aggregate,
    maxCount: parseInt(__vite_import_meta_env__?.VITE_VARIANT_EXPLORER_MAX_COUNT || 1e4),
    excludeColumns: JSON.parse(__vite_import_meta_env__?.VITE_VARIANT_EXPLORER_EXCLUDE_COLUMNS || "[]")
  },
  distributionExplorer: {
    graphColors: JSON.parse(
      __vite_import_meta_env__?.VITE_DIST_EXPLORER_GRAPH_COLORS || '["#328FFF", "#675AFF", "#FFBC35"]'
    )
  },
  google: {
    analytics: __vite_import_meta_env__?.VITE_GOOGLE_ANALYTICS_ID || "",
    tagManager: __vite_import_meta_env__?.VITE_GOOGLE_TAG_MANAGER_ID || ""
  },
  maxDataPointsForExport: parseInt(__vite_import_meta_env__?.VITE_MAX_DATA_POINTS_FOR_EXPORT || 1e6)
};
const resources = {
  hpds: __vite_import_meta_env__?.VITE_RESOURCE_HPDS || "",
  openHPDS: __vite_import_meta_env__?.VITE_RESOURCE_OPEN_HPDS || "",
  visualization: __vite_import_meta_env__?.VITE_RESOURCE_VIZ || "",
  application: __vite_import_meta_env__?.VITE_RESOURCE_APP || ""
};

export { BDCPrivileges as B, ExportType as E, PicsurePrivileges as P, resources as a, branding as b, features as f, initializeBranding as i, mapPrivilege as m, routes as r, settings as s };
//# sourceMappingURL=configuration-BRozmRr_.js.map
