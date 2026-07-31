// httpd strips the leading `/picsure/` before the gateway sees the request, so the frontend keeps
// the `picsure/` prefix and only the suffix changes. The legacy `/proxy/{container}` relay is gone —
// each service now has a clean gateway prefix: `/dictionary`, `/uploader`, `/logging`, …
const PREFIX = 'picsure';
const DICT = `${PREFIX}/dictionary`;
const UPLOADER = `${PREFIX}/uploader`;
const VIZ = `${PREFIX}/visualization`;
// HPDS ingress is exactly two path prefixes: the backend is chosen by the
// URL PATH — `/hpds/auth` (direct, non-obfuscated) vs `/hpds/open` (aggregate/obfuscated) — NOT by a
// resource UUID in the request body. The query-service selects HPDS_AUTH_URL/HPDS_OPEN_URL from the path.
// Every HPDS route is `/v3`: the non-versioned aliases (`/hpds/{backend}/query*`,
// `/hpds/{backend}/search[/values]`) were DELETED server-side, open access included.
const HPDS_AUTH = `${PREFIX}/hpds/auth`;
const HPDS_OPEN = `${PREFIX}/hpds/open`;
const API = '/api/v1';

export const Picsure = {
  Concepts: `${DICT}/concepts`,
  Concept: {
    Detail: `${DICT}/concepts/detail`,
    Tree: `${DICT}/concepts/tree`,
    Hierarchy: `${DICT}/concepts/hierarchy`,
  },
  Dashboard: `${DICT}/dashboard`,
  DashboardDrawer: `${DICT}/dashboard-drawer`,
  NamedDataSet: `${PREFIX}/operations/dataset/named`,
  Dictionary: DICT,
  Facets: `${DICT}/facets`,
  /**
   * Genomic value search: GET with pure query params
   * (`genomicConceptPath`, `query`, `page`, `size`) answering a
   * `PaginatedResponse`. `page` is ONE-BASED here — unlike the dictionary's
   * `/concepts`, which is zero-based. The legacy `{resourceId}` placeholder
   * segment is gone.
   */
  SearchValues: `${HPDS_AUTH}/v3/search/values`,
  Resources: `${PREFIX}/resource`,
  /** Open access (discover) queries hit the obfuscated open backend. */
  QueryOpenSync: `${HPDS_OPEN}/v3/query/sync`,
  QueryV3: `${HPDS_AUTH}/v3/query`,
  QueryV3Sync: `${HPDS_AUTH}/v3/query/sync`,
  Uploader: {
    Upload: `${UPLOADER}/upload`,
    Sites: `${UPLOADER}/sites`,
    Status: `${UPLOADER}/status`,
  },
  Visualization: {
    Distributions: `${VIZ}/distributions`,
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
    Template: `${USER}/me/queryTemplate`,
    Refresh: `${USER}/me/refresh_long_term_token`,
  },
};
