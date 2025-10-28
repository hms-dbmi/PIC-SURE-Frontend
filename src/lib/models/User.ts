import type { Role } from '$lib/models/Role';
import type { Connection } from '$lib/models/Connection';

import type { QueryInterfaceV2 } from './query/Query';

export interface User {
  uuid?: string;
  email?: string;
  userId?: string;
  privileges?: string[];
  queryScopes?: string[];
  token?: string;
  acceptedTOS?: boolean;
  readonly queryTemplate?: QueryInterfaceV2;
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

// TODO: Replace metadata and query types
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapExtendedUser(data: any) {
  return {
    ...data,
    connection: data.connection ? data.connection.uuid : '',
    roles: data.roles ? data.roles.map((r: any) => r.uuid) : [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
