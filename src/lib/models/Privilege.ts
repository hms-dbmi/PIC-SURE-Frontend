export interface Privilege {
  uuid?: string;
  name: string;
  description: string;
  queryScope?: string;
  application: string;
}

// PIC-SURE Privileges are used for authorization of functionalty rather than data access
export enum PicsurePrivileges {
  QUERY = 'PIC_SURE_ANY_QUERY',
  ADMIN = 'ADMIN',
  SUPER = 'SUPER_ADMIN',
}

// TODO: Replace any type
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapPrivilege(data: any) {
  return {
    ...data,
    application: data.application?.uuid || '',
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
