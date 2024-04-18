export interface Privilege {
  uuid?: string;
  name: string;
  description: string;
  queryScope?: string;
  application: string;
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
