import { BDCPrivileges, PicsurePrivileges } from './models/Privilege';
import type { Route } from './models/Route';

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
    path: '/api',
    text: 'API',
    feature: 'analyzeApi',
  },
  {
    path: '/dataset',
    text: 'Manage Datasets',
    privilege: [PicsurePrivileges.NAMED_DATASET, BDCPrivileges.NAMED_DATASET],
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
  { path: '/admin/api-keys', text: 'API Keys', privilege: [PicsurePrivileges.ADMIN] },
  { path: '/help', text: 'Help' },
];
