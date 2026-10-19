import type { Role } from '#lib/auth/model/role.ts';
import type { Connection } from '#lib/auth/model/connection.ts';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';

/** Consent concept path (e.g. `\_consents\`) to the study identifiers granted under it. */
export type ConsentsMap = Record<string, string[]>;

export interface User {
  uuid?: string;
  email?: string;
  userId?: string;
  privileges?: string[];
  queryScopes?: string[];
  token?: string;
  acceptedTOS?: boolean;
  readonly consents?: ConsentsMap;
}

export function isTopAdmin(user: User): boolean {
  return user.privileges?.includes(PicsurePrivileges.SUPER) ?? false;
}

export interface ExtendedUser extends User {
  subject?: string;
  connection: string;
  generalMetadata: string;
  active: boolean;
  roles: string[];
}

export interface OktaUser extends User {
  readonly oktaIdToken: string;
}

export interface UserRequest extends User {
  connection?: Connection;
  generalMetadata: string;
  active: boolean;
  roles?: Role[];
}
