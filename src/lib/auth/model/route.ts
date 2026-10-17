import type { BDCPrivileges, PicsurePrivileges } from './privilege';

export type RoutePrivilege = PicsurePrivileges | BDCPrivileges;

export interface Route {
  path: string;
  text: string;
  privilege?: RoutePrivilege[];
  feature?: string;
  children?: Route[];
}
