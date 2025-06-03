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
    category: "Administration",
    privilege: "ADMIN",
    links: [
      {
        title: "Manage Users",
        url: "/admin/users"
      },
      {
        title: "Configuration",
        url: "/admin/configuration"
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
        url: "https://avillach-lab.hms.harvard.edu/pic-sure/",
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
  columns: [
    {
      label: "Dataset",
      dataElement: "dataset"
    },
    {
      label: "Variable Name",
      dataElement: "name"
    }
  ],
  tourSearchIntro: "PIC-SURE Search allows you to search for variable level data.",
  totalPatientsText: "Filtered Participants",
  queryErrorText: "There was an error with your query. If this persists, please contact you PIC-SURE admin.",
  filterErrorText: 'There was an error when adding the filter to the query. Please remove your most recent filter and try again. If this error persists, please contact us by filling out the form at <a class="anchor" href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank" class="underline">Avillach Lab Software Requests</a>. We will respond to your request as soon as we can.',
  analysisExportText: "To export data and start your analysis, use the following code to connect to PIC-SURE and save the dataframe or download the file. Note that you will need your personal access token to complete the connection to PIC-SURE with code.",
  confirmDownloadTitle: "Are you sure you want to download data?",
  confirmDownloadMessage: "This action will download the data to your local machine. Are you sure you want to proceed?",
  codeBlocks: {
    PythonExport: '# Requires python 3.7 or later\nimport sys\nimport pandas as pd\nimport matplotlib.pyplot as plt\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git\n\nimport PicSureHpdsLib\nimport PicSureClient\n\nPICSURE_network_URL = "{{PICSURE_NETWORK_URL}}"\n\ntoken_file = "token.txt"\nwith open(token_file, "r") as f:\n		my_token = f.read()\n\nconnection = PicSureClient.Client.connect(url = PICSURE_network_URL, token = my_token)\n\nqueryID = "{{queryId}}"\n\nresults = resource.retrieveQueryResults(queryID)\nfrom io import StringIO\ndf_UI = pd.read_csv(StringIO(results), low_memory=False)',
    RExport: '# Requires R 3.4 or later\ninstall.packages("devtools")\n\ndevtools::install_github("hms-dbmi/pic-sure-r-adapter-hpds", ref="main", force=T, quiet=FALSE)\nlibrary(dplyr)\n\nPICSURE_network_URL = "{{PICSURE_NETWORK_URL}}"\ntoken_file <- "token.txt"\ntoken <- scan(token_file, what = "character")\nsession <- picsure::bdc.initializeSession(PICSURE_network_URL, token)\nsession <- picsure::bdc.setResource(session = session)\n\nqueryID <- "{{queryId}}"\n\nresults <- picsure::getResultByQueryUUID(session, queryID)',
    PythonAPI: '# Requires python 3.7 or later\nimport sys\nimport pandas as pd\nimport matplotlib.pyplot as plt\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git\n\nimport PicSureHpdsLib\nimport PicSureClient\n\nPICSURE_network_URL = "{{PICSURE_NETWORK_URL}}"\n\ntoken_file = "token.txt"\nwith open(token_file, "r") as f:\n    my_token = f.read()\n\nconnection = PicSureClient.Client.connect(url = PICSURE_network_URL, token = my_token)',
    RAPI: '# Requires R 3.4 or later\ninstall.packages("devtools")\ndevtools::install_github("hms-dbmi/pic-sure-r-adapter-hpds", ref="main", force=T, quiet=FALSE)\nlibrary(dplyr)\n\nPICSURE_network_URL = "{{PICSURE_NETWORK_URL}}"\ntoken_file <- "token.txt"\ntoken <- scan(token_file, what = "character")\nsession <- picsure::bdc.initializeSession(PICSURE_network_URL, token)\nsession <- picsure::bdc.setResource(session = session)'
  },
  goTo: {
    instructions: 'Copy your personal access token and save as a text file called "token.txt" in the same working directory to execute the code above.',
    links: []
  },
  pfbExportUrls: []
};
const landing = {
  searchPlaceholder: "Search terms or variables of interest…",
  explanation: "Available data includes the National Health and Nutrition Examination Survey (NHANES), Synthea, and 1000 Genomes.",
  authExplanation: "Available data includes the National Health and Nutrition Examination Survey (NHANES), Synthea, and 1000 Genomes.",
  actions: [
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
    }
  ],
  stats: [
    {
      key: "query:blank",
      label: "Participants"
    },
    {
      key: "dict:concepts",
      label: "Variables"
    },
    {
      key: "dict:facets:dataset_id",
      label: "Data Sources"
    }
  ],
  statFields: {}
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
      url: "https://avillach-lab.hms.harvard.edu/pic-sure"
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
const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true, "VITE_ALLOW_EXPORT": "true", "VITE_ALLOW_EXPORT_ENABLED": "true", "VITE_API": "true", "VITE_AUTH0_TENANT": "avillachlab", "VITE_AUTH_PROVIDER_MODULE_GOOGLE": "true", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_ALT": "false", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CLIENTID": "dFvo72bRvFWuUIgaR1hLKjz4I0o8fDcK", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_CONNECTION": "google-oauth2", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_DESCRIPTION": "Login", "VITE_AUTH_PROVIDER_MODULE_GOOGLE_TYPE": "AUTH0", "VITE_AUTH_PROVIDER_MODULE_RAS": "true", "VITE_AUTH_PROVIDER_MODULE_RAS_ALT": "false", "VITE_AUTH_PROVIDER_MODULE_RAS_CLIENTID": "0oaebyndxfwuRDgXQ1d7", "VITE_AUTH_PROVIDER_MODULE_RAS_CONNECTION": "okta-ras", "VITE_AUTH_PROVIDER_MODULE_RAS_DESCRIPTION": "Login with Researcher Auth Service (RAS)", "VITE_AUTH_PROVIDER_MODULE_RAS_IMAGEALT": "NIH 2013 Logo", "VITE_AUTH_PROVIDER_MODULE_RAS_IMAGESRC": "NIH_2013_logo_vertical_text_removed.svg", "VITE_AUTH_PROVIDER_MODULE_RAS_OKTAIDPID": "0oafu2znn12Nn0tQ11d7", "VITE_AUTH_PROVIDER_MODULE_RAS_OKTALOGOUTREDIRECT": "https://hms-srce.oktapreview.com/oauth2/default/v1/logout", "VITE_AUTH_PROVIDER_MODULE_RAS_SESSIONLOGOUTURI": "https://authtest.nih.gov/siteminderagent/smlogoutredirector.asp?TARGET=", "VITE_AUTH_PROVIDER_MODULE_RAS_TYPE": "RAS", "VITE_AUTH_PROVIDER_MODULE_RAS_URI": "https://hms-srce.oktapreview.com/oauth2/default/v1/authorize", "VITE_DASHBOARD_DRAWER": "true", "VITE_DATA_REQUESTS": "true", "VITE_DISCOVER": "true", "VITE_DIST_EXPLORER": "true", "VITE_DOTS_COLORS_CLASS": '["--color-primary-500", "--color-error-500", "--color-surface-400"]', "VITE_ENABLE_GENE_QUERY": "true", "VITE_ENABLE_HIERARCHY": "true", "VITE_ENABLE_SAMPLE_ID_CHECKBOX": "true", "VITE_ENABLE_SNP_QUERY": "true", "VITE_EXPLORE_TOUR": "true", "VITE_EXPLORE_TOUR_SEARCH_TERM": "age", "VITE_OPEN": "true", "VITE_ORIGIN": "https://nhanes-dev.hms.harvard.edu/", "VITE_PROJECT_HOSTNAME": "nhanes-dev.hms.harvard.edu", "VITE_REQUIRE_CONSENTS": "true", "VITE_RESOURCE_APP": "9047203e-76c4-46c3-b5e3-4544b56718d3", "VITE_RESOURCE_HPDS": "bf638674-053b-46c4-96a1-4cd6c8395248", "VITE_RESOURCE_VIZ": "e52efd46-b722-42fd-9dff-f020a92b0dd3", "VITE_USE_QUERY_TEMPLATE": "true", "VITE_VARIANT_EXPLORER": "true" };
const PROJECT_HOSTNAME = typeof window !== "undefined" ? `${window.location.origin}/picsure` : `https://${"nhanes-dev.hms.harvard.edu"}/picsure`;
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
  const codeBlocks = { ...explorePage.codeBlocks };
  Object.keys(codeBlocks).forEach((key) => {
    if (typeof codeBlocks[key] === "string") {
      codeBlocks[key] = codeBlocks[key].replace("{{PICSURE_NETWORK_URL}}", PROJECT_HOSTNAME);
    }
  });
  branding.explorePage = {
    ...branding.explorePage,
    ...explorePage,
    codeBlocks
  };
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
    path: "/admin/configuration",
    text: "Configuration",
    privilege: [PicsurePrivileges.SUPER]
  },
  { path: "/admin/users", text: "Manage Users", privilege: [PicsurePrivileges.ADMIN] },
  { path: "/help", text: "Help" }
];
const features = {
  explorer: {
    allowExport: true,
    allowDownload: __vite_import_meta_env__?.VITE_ALLOW_DOWNLOAD !== "false",
    // default true
    exportsEnableExport: true,
    variantExplorer: true,
    distributionExplorer: true,
    enableTour: __vite_import_meta_env__?.EXPLORER_TOUR ? __vite_import_meta_env__?.EXPLORE_TOUR === "true" : true,
    // default to true unless set otherwise
    authTour: __vite_import_meta_env__?.VITE_AUTH_TOUR_NAME ?? "NHANES-Auth",
    enableHierarchy: true,
    enablePfbExport: __vite_import_meta_env__?.VITE_DOWNLOAD_AS_PFB !== "false",
    // default true
    enableSampleIdCheckbox: true
  },
  login: {
    open: true
  },
  dataRequests: true,
  enableSNPQuery: true,
  enableGENEQuery: true,
  requireConsents: true,
  useQueryTemplate: true,
  discover: true,
  discoverFeautures: {
    enableTour: __vite_import_meta_env__?.EXPLORER_TOUR !== "false",
    // default true
    openTour: __vite_import_meta_env__?.VITE_OPEN_TOUR_NAME ?? "BDC-Open",
    distributionExplorer: true
  },
  dashboard: __vite_import_meta_env__?.VITE_DASHBOARD === "true",
  dashboardDrawer: true,
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
  hpds: "bf638674-053b-46c4-96a1-4cd6c8395248",
  openHPDS: __vite_import_meta_env__?.VITE_RESOURCE_OPEN_HPDS || "",
  visualization: "e52efd46-b722-42fd-9dff-f020a92b0dd3",
  application: "9047203e-76c4-46c3-b5e3-4544b56718d3",
  aggregate: __vite_import_meta_env__?.VITE_RESOURCE_AGGREGATE || ""
};

export { BDCPrivileges as B, ExportType as E, PicsurePrivileges as P, resources as a, branding as b, features as f, initializeBranding as i, mapPrivilege as m, routes as r, settings as s };
//# sourceMappingURL=configuration-Bm4Mu1_g.js.map
