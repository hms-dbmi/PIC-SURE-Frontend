import type { PicsurePrivileges } from './Privilege';

export type Route = {
  path: string;
  text: string;
  privilege?: PicsurePrivileges;
  children?: Route[];
};
