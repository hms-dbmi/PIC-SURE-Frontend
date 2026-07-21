import type { BDCPrivileges, PicsurePrivileges } from './Privilege';

export type RoutePrivilege = PicsurePrivileges | BDCPrivileges;

export interface Route {
  path: string;
  text: string;
  privilege?: RoutePrivilege[];
  feature?: string;
  children?: Route[];
}
