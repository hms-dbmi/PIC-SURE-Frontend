import { mapRole, type Role } from './Role';
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

// TODO: Replace metadata nad query types
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapUser(data: any) {
  return {
    ...data,
    roles: data.roles.map(mapRole),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
