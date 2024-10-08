import type { QueryInterface } from './query/Query';

export interface User {
  uuid?: string;
  email?: string;
  userId?: string;
  privileges?: string[];
  queryScopes?: string[];
  token?: string;
  acceptedTOS?: boolean;
  readonly queryTemplate?: QueryInterface;
  readonly oktaIdToken?: string;
}

export interface ExtendedUser extends User {
  subject?: string;
  connection: string;
  generalMetadata: string;
  active: boolean;
  roles: string[];
}

// TODO: Replace metadata nad query types
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapExtendedUser(data: any) {
  return {
    ...data,
    connection: data.connection ? data.connection.uuid : '',
    roles: data.roles ? data.roles.map((r: any) => r.uuid) : [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
