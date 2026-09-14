// Joins an origin and a path with exactly one slash, regardless of how many
// slashes either side already has. Never parses `path` as a scheme-relative
// or absolute URL, so it can't resolve off-origin no matter what it contains.
// origin may be unset (e.g. VITE_ORIGIN in tests/local dev) - treated as empty
// rather than throwing, matching how the old `${origin}/${path}` template coped.
export function joinUrl(origin: string | undefined, path: string): string {
  return `${(origin ?? '').replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
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
