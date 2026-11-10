import type { Features } from '#lib/config/index.ts';
import type { BDCPrivileges, PicsurePrivileges } from './privilege';

export type RoutePrivilege = PicsurePrivileges | BDCPrivileges;

export interface Route {
  path: string;
  text: string;
  privilege?: RoutePrivilege[];
  feature?: keyof Features;
  children?: Route[];
}
