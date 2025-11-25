export interface Privilege {
  uuid?: string;
  name: string;
  description: string;
  queryScope?: string;
  application: string;
}

// PIC-SURE & BDCPrivileges Privileges are used for authorization of functionalty rather than data access
export enum PicsurePrivileges {
  QUERY = 'PIC_SURE_ANY_QUERY',
  API_ACCESS = 'API_ACCESS',
  NAMED_DATASET = 'NAMED_DATASET',
  ADMIN = 'ADMIN',
  DATA_ADMIN = 'DATA_ADMIN',
  SUPER = 'SUPER_ADMIN',
}

export enum BDCPrivileges {
  AUTHORIZED_ACCESS = 'AUTHORIZED_ACCESS',
  OPEN = 'MANAGED_PRIV_OPEN_ACCESS',
  NAMED_DATASET = 'MANUAL_PRIV_NAMED_DATASET',
  PRIV_MANAGED = 'PRIV_MANAGED_',
  DICTIONARY = 'MANAGED_PRIV_DICTIONARY',
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
