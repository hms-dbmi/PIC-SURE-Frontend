import type { Role } from './Role';
import type { Connection } from './Connection';

export interface User {
  uuid?: string;
  email?: string;
  privileges?: string[];
  token?: string;
  acceptedTOS?: boolean;
}

export interface ExtendedUser extends User {
  subject?: string;
  connection: Connection;
  active: boolean;
  roles: Role[];
}
