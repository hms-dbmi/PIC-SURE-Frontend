const PREFIX = 'picsure';
const DICT = `${PREFIX}/proxy/dictionary-api`;
const QUERY = `${PREFIX}/query`;
const UPLOADER = `${PREFIX}/proxy/uploader`;
const LOCAL = 'api';

export const LocalServer = {
  Configs: `${LOCAL}/config`,
};

export const Picsure = {
  Concepts: `${DICT}/concepts`,
  Concept: {
    Detail: `${DICT}/concepts/detail`,
    Tree: `${DICT}/concepts/tree`,
  },
  Configuration: {
    Get: `${PREFIX}/configuration`,
    Admin: `${PREFIX}/configuration/admin`,
  },
  Dashboard: `${DICT}/dashboard`,
  DashboardDrawer: `${DICT}/dashboard-drawer`,
  NamedDataSet: `${PREFIX}/dataset/named`,
  Dictionary: DICT,
  Facets: `${DICT}/facets`,
  Search: `${PREFIX}/search`,
  Resources: `${PREFIX}/resource`,
  QueryV2: QUERY,
  QueryV2Sync: `${QUERY}/sync`,
  QueryV3: `${PREFIX}/v3/query`,
  QueryV3Sync: `${PREFIX}/v3/query/sync`,
  Uploader: {
    Upload: `${UPLOADER}/upload`,
    Sites: `${UPLOADER}/sites`,
    Status: `${UPLOADER}/status`,
  },
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
