// httpd strips the leading `/picsure/` before the gateway sees the request, so the frontend keeps
// the `picsure/` prefix and only the suffix changes. The legacy `/proxy/{container}` relay is gone —
// each service now has a clean gateway prefix: `/dictionary`, `/uploader`, `/logging`, …
const PREFIX = 'picsure';
const DICT = `${PREFIX}/dictionary`;
const VIZ = `${PREFIX}/visualization`;
// HPDS ingress is exactly two path prefixes: the backend is chosen by the
// URL PATH — `/hpds/auth` (direct, non-obfuscated) vs `/hpds/open` (aggregate/obfuscated) — NOT by a
// resource UUID in the request body. The query-service selects HPDS_AUTH_URL/HPDS_OPEN_URL from the path.
// Every HPDS route is `/v3`: the non-versioned aliases (`/hpds/{backend}/query*`,
// `/hpds/{backend}/search[/values]`) were DELETED server-side, open access included.
const HPDS_AUTH = `${PREFIX}/hpds/auth`;
const HPDS_OPEN = `${PREFIX}/hpds/open`;
const API = '/api/v1';
const LOCAL = 'api';

export const LocalServer = {
  Configs: `${LOCAL}/config`,
};

export const Picsure = {
  Concepts: `${DICT}/concepts`,
  Concept: {
    Detail: `${DICT}/concepts/detail`,
    Tree: `${DICT}/concepts/tree`,
    Hierarchy: `${DICT}/concepts/hierarchy`,
  },
  // Configuration lives in operations-service (context-path /operations). The bare
  // /configuration path was retired when the gateway consolidated onto a single
  // /operations route — only GET /operations/configuration[/{id}] is public
  // (no-token) at the gateway; /admin and all writes stay introspected.
  Configuration: {
    Get: `${PREFIX}/operations/configuration`,
    Admin: `${PREFIX}/operations/configuration/admin`,
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
  /**
   * Open access (discover) queries hit the obfuscated open backend. These are built as V3 requests
   * (getQueryRequestV3), so they must target the V3 aggregate endpoint — the V1 open endpoint can't
   * parse a V3 body and the query-service 502s forwarding it to HPDS.
   */
  QueryOpenV3Sync: `${HPDS_OPEN}/v3/query/sync`,
  QueryV3: `${HPDS_AUTH}/v3/query`,
  QueryV3Sync: `${HPDS_AUTH}/v3/query/sync`,
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
  Role: 'psama/role',
  TOS: 'psama/tos',
  Users: USER,
  User: {
    Logout: 'psama/logout',
    Me: `${USER}/me`,
    /**
     * The caller's study authorizations. This replaces `/me/queryTemplate`, which
     * was deleted along with the rest of the v2 query machinery: the template only
     * ever existed to smuggle the consent list to the client, and this endpoint
     * hands over that list directly. Self-scoped — the subject comes from the
     * token, so there is no user id to pass and no way to read anyone else's.
     */
    Consents: `${USER}/me/consents`,
    Refresh: `${USER}/me/refresh_long_term_token`,
  },
};
