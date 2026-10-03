// resolve() can't type-check a path built at runtime, because TypeScript gives up on a union
// as large as the app's `Path` type. It accepts this branded '' unchecked instead.
export type UncheckedPath = '' & { readonly __uncheckedPath: true };

// For runtime paths like '/explorer?search=x'. Pass literals to resolve() so they stay checked.
// Drops the leading slash kit 3 pathnames don't use.
export function appPath(path: string): UncheckedPath {
  return path.replace(/^\/+/, '') as UncheckedPath;
}

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
  Search: `${HPDS_AUTH}/search`,
  SearchValues: `${HPDS_AUTH}/search/values`,
  QueryOpenV3Sync: `${HPDS_OPEN}/v3/query/sync`,
  QueryV3: `${HPDS_AUTH}/v3/query`,
  QueryV3Sync: `${HPDS_AUTH}/v3/query/sync`,
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
