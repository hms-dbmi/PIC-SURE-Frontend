export function joinUrl(origin: string, path: string): string {
  return `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

const PREFIX = 'picsure';
const DICT = `${PREFIX}/dictionary`;
const VIZ = `${PREFIX}/visualization`;
const HPDS_AUTH = `${PREFIX}/hpds/auth`;
const HPDS_OPEN = `${PREFIX}/hpds/open`;
const API = '/api/v1';

export const LocalServer = {
  ConfigRefresh: `${API}/config/refresh`,
};

export const Picsure = {
  Concepts: `${DICT}/concepts`,
  Concept: {
    Detail: `${DICT}/concepts/detail`,
    Tree: `${DICT}/concepts/tree`,
    Hierarchy: `${DICT}/concepts/hierarchy`,
  },
  Configuration: {
    Get: `${PREFIX}/operations/configuration`,
    Admin: `${PREFIX}/operations/configuration/admin`,
  },
  Banners: {
    Active: `${PREFIX}/operations/banners/active`,
    Manage: `${PREFIX}/operations/banners`,
  },
  Dashboard: `${DICT}/dashboard`,
  DashboardDrawer: `${DICT}/dashboard-drawer`,
  NamedDataSet: `${PREFIX}/operations/dataset/named`,
  Facets: `${DICT}/facets`,
  SearchValues: `${HPDS_AUTH}/search/values`,
  QueryOpenSync: `${HPDS_OPEN}/query/sync`,
  Query: `${HPDS_AUTH}/query`,
  QuerySync: `${HPDS_AUTH}/query/sync`,
  Visualization: {
    Distributions: `${VIZ}/auth/distributions`,
    DistributionsOpen: `${VIZ}/open/distributions`,
  },
  OpenApi: `${PREFIX}/openapi`,
};

// Sub-paths of the bases above. They are e2e contracts too: dataset and uuid segments go in as
// they are, unencoded, as the call sites always sent them.
export const PicsurePaths = {
  conceptDetail: (dataset: string) => `${Picsure.Concept.Detail}/${dataset}`,
  conceptHierarchy: (dataset: string) => `${Picsure.Concept.Hierarchy}/${dataset}`,
  conceptTree: (dataset: string) => `${Picsure.Concept.Tree}/${dataset}`,
  dashboardDrawer: (datasetId: string) => `${Picsure.DashboardDrawer}/${datasetId}`,
  namedDataSet: (uuid: string) => `${Picsure.NamedDataSet}/${uuid}`,
  configurationRow: (uuid: string) => `${Picsure.Configuration.Admin}/${uuid}`,
  bannerOrder: `${Picsure.Banners.Manage}/order`,
  savedBanners: `${Picsure.Banners.Manage}/saved`,
  banner: (uuid: string, action?: 'publish' | 'disable' | 'archive' | 'restore') =>
    action ? `${Picsure.Banners.Manage}/${uuid}/${action}` : `${Picsure.Banners.Manage}/${uuid}`,
  // the open-access endpoint answers with aggregate, obfuscated counts
  syncQuery: (openEndpoint: boolean) => (openEndpoint ? Picsure.QueryOpenSync : Picsure.QuerySync),
  queryResult: (queryId: string) => `${Picsure.Query}/${queryId}/result`,
  queryStatus: (queryId: string) => `${Picsure.Query}/${queryId}/status`,
  querySignedUrl: (queryId: string) => `${Picsure.Query}/${queryId}/signed-url`,
  openApiDocument: (service: string) => `${Picsure.OpenApi}/${service}`,
};

export const Internal = {
  Log: `${API}/log`,
};

const USER = 'psama/user';

export const Psama = {
  Application: 'psama/application',
  ApiKey: {
    Admin: 'psama/apiKey',
    Platform: 'psama/apiKey/platform',
  },
  Auth: 'psama/authentication',
  Open: {
    ApiKey: 'psama/open/apiKey',
    Session: 'psama/open/session',
  },
  Connection: 'psama/connection',
  Privilege: 'psama/privilege',
  Role: 'psama/role',
  TOS: 'psama/tos',
  Users: USER,
  User: {
    Logout: 'psama/logout',
    Me: `${USER}/me`,
    Consents: `${USER}/me/consents`,
    Refresh: `${USER}/me/refresh_long_term_token`,
  },
};
