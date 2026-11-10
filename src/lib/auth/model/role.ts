export interface Role {
  uuid?: string;
  name: string;
  description: string;
  privileges: string[];
}

// TODO: Replace any type
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapRole(data: any) {
  return {
    ...data,
    privileges: data.privileges ? data.privileges.map((p: any) => p.uuid) : [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
