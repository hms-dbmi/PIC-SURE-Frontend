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
  Configs: `${API}/config`,
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
  Dictionary: DICT,
  Facets: `${DICT}/facets`,
  SearchValues: `${HPDS_AUTH}/search/values`,
  QueryOpenSync: `${HPDS_OPEN}/query/sync`,
  Query: `${HPDS_AUTH}/query`,
  QuerySync: `${HPDS_AUTH}/query/sync`,
  Visualization: {
    Distributions: `${VIZ}/auth/distributions`,
    DistributionsOpen: `${VIZ}/open/distributions`,
  },
};

export const Internal = {
  Log: `${API}/log`,
  OpenProxy: `${API}/open`,
};

const USER = 'psama/user';

export const Psama = {
  Application: 'psama/application',
  ApiKey: {
    Admin: 'psama/apiKey',
    Platform: 'psama/apiKey/platform',
    Open: 'psama/open/apiKey',
  },
  Auth: 'psama/authentication',
  Open: {
    ApiKey: 'psama/open/apiKey',
  },
  Connection: 'psama/connection',
  Priviege: 'psama/privilege',
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
