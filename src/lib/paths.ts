const PREFIX = 'picsure';
const DICT = `${PREFIX}/proxy/dictionary-api`;
const QUERY = `${PREFIX}/query`;
const UPLOADER = `${PREFIX}/proxy/uploader`;

export const Picsure = {
  Concepts: `${DICT}/concepts`,
  Concept: {
    Detail: `${DICT}/concepts/detail`,
    Tree: `${DICT}/concepts/tree`,
  },
  Dashboard: `${DICT}/dashboard`,
  DashboardDrawer: `${DICT}/dashboard-drawer`,
  NamedDataSet: `${PREFIX}/dataset/named`,
  Dictionary: DICT,
  Facets: `${DICT}/facets`,
  Search: `${PREFIX}/search`,
  Resources: `${PREFIX}/resource`,
  Query: QUERY,
  QuerySync: `${QUERY}/sync`,
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
