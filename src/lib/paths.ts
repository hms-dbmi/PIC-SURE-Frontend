// httpd strips the leading `/picsure/` before the gateway sees the request, so the frontend keeps
// the `picsure/` prefix and only the suffix changes. The legacy `/proxy/{container}` relay is gone —
// each service now has a clean gateway prefix (spec §3.7): `/dictionary`, `/uploader`, `/logging`, …
const PREFIX = 'picsure';
const DICT = `${PREFIX}/dictionary`;
const UPLOADER = `${PREFIX}/uploader`;
// ⚠ GATEWAY GAP: the deployed gateway application.yml does NOT yet declare a `/visualization` route
// (only logging/dictionary/uploader/hpds/configuration/dataset + the legacy catch-all). Until that
// route is wired (a separate pic-sure-gateway change), requests to `picsure/visualization` fall
// through the catch-all to WildFly, which has no such endpoint, and 404. Tracked in the PR.
const VIZ = `${PREFIX}/visualization`;
// HPDS ingress is exactly two path prefixes (spec §3.4, decision S-M1): the backend is chosen by the
// URL PATH — `/hpds/auth` (direct, non-obfuscated) vs `/hpds/open` (aggregate/obfuscated) — NOT by a
// resource UUID in the request body. The query-service selects HPDS_AUTH_URL/HPDS_OPEN_URL from the path.
const HPDS_AUTH = `${PREFIX}/hpds/auth`;
const HPDS_OPEN = `${PREFIX}/hpds/open`;
const API = '/api/v1';

// The query-service search endpoints keep a `{resourceId}` path segment for contract parity, but it is
// ignored for routing (the backend is selected by `/hpds/{auth,open}`). This nil placeholder fills that
// segment now that clients no longer look up a resource UUID from the removed registry.
export const NIL_RESOURCE_ID = '00000000-0000-0000-0000-000000000000';

export const Picsure = {
  Concepts: `${DICT}/concepts`,
  Concept: {
    Detail: `${DICT}/concepts/detail`,
    Tree: `${DICT}/concepts/tree`,
    Hierarchy: `${DICT}/concepts/hierarchy`,
  },
  Dashboard: `${DICT}/dashboard`,
  DashboardDrawer: `${DICT}/dashboard-drawer`,
  NamedDataSet: `${PREFIX}/dataset/named`,
  Dictionary: DICT,
  Facets: `${DICT}/facets`,
  Search: `${HPDS_AUTH}/search`,
  Resources: `${PREFIX}/resource`,
  QueryV2: `${HPDS_AUTH}/query`,
  QueryV2Sync: `${HPDS_AUTH}/query/sync`,
  /** Open access (discover) queries hit the obfuscated open backend. */
  QueryOpenSync: `${HPDS_OPEN}/query/sync`,
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
