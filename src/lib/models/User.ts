export interface User {
  // Data from psama/authentication route
  acceptedTOS?: boolean;
  email?: string;
  expirationDate?: string;
  token?: string;
  userId?: string;

  // Additional data from psama/user/me?hasToken
  uuid?: string;
  privileges?: string[];
  apiToken?: string; // as token
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
