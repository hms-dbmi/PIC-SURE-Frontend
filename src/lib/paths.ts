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
    Get: `${PREFIX}/configuration`,
    Admin: `${PREFIX}/configuration/admin`,
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
    Distributions: `${VIZ}/distributions`,
  },
};

/**
 * True for the open-access HPDS ingress. Same segment-boundary rule as the gateway's `open-path-prefixes`, so
 * `picsure/hpds/openx` is not open access. Callers use it to drop the bearer token, which these endpoints never read.
 */
export function isOpenAccessPath(path: string): boolean {
  return path === HPDS_OPEN || path.startsWith(`${HPDS_OPEN}/`);
}

export const Internal = {
  Log: `${API}/log`,
};

const USER = 'psama/user';

export const Psama = {
  Application: 'psama/application',
  Auth: 'psama/authentication',
  Connection: 'psama/connection',
  Priviege: 'psama/privilege',
  StudyAccess: 'psama/studyAccess',
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
