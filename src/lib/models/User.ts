export interface User {
  uuid: string;
  email?: string;
  privileges?: string[];
  token?: string;
  acceptedTOS?: boolean;
}

export interface ExtendedUser extends User {
  subject?: string;
  connection: string;
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
