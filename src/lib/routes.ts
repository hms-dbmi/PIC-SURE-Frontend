import { BDCPrivileges, PicsurePrivileges } from './models/Privilege';

export interface Route {
  path: string;
  text: string;
  privilege?: (PicsurePrivileges | BDCPrivileges)[];
  feature?: string;
  children?: Route[];
}

export const routes: Route[] = [
  {
    path: '/dashboard',
    text: 'Data Dashboard',
    feature: 'dashboard',
  },
  {
    path: '/discover',
    text: 'Discover',
    feature: 'discover',
  },
  {
    path: '/explorer',
    text: 'Explore',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
  },
  {
    path: '/collaborate',
    text: 'Collaborate',
    feature: 'collaborate',
    privilege: [PicsurePrivileges.QUERY],
  },
  {
    path: '/analyze/api',
    text: 'Prepare for Analysis',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
    feature: 'analyzeApi',
  },
  {
    path: '/analyze/analysis',
    text: 'Analyze',
    privilege: [PicsurePrivileges.QUERY],
    feature: 'analyzeAnalysis',
  },
  {
    path: '/dataset',
    text: 'Manage Datasets',
    privilege: [PicsurePrivileges.QUERY, BDCPrivileges.NAMED_DATASET],
  },
  {
    path: '/dataset/request',
    text: 'Data Request',
    privilege: [PicsurePrivileges.DATA_ADMIN],
    feature: 'dataRequests',
  },
  {
    path: '/admin/configuration',
    text: 'Configuration',
    privilege: [PicsurePrivileges.SUPER],
  },
  {
    path: '/admin/manual-role',
    text: 'Manual Role',
    privilege: [PicsurePrivileges.ADMIN],
    feature: 'manualRole',
  },
  { path: '/admin/users', text: 'Manage Users', privilege: [PicsurePrivileges.ADMIN] },
  { path: '/help', text: 'Help' },
];
