import type { BDCPrivileges, PicsurePrivileges } from './Privilege';

export interface Route {
  path: string;
  text: string;
  privilege?: (PicsurePrivileges | BDCPrivileges)[];
  feature?: string;
  children?: Route[];
}
