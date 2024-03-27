export interface Privilege {
  uuid: string;
  name: string;
  description: string;
  queryScope: string;
  application?: object;
}

export interface Role {
  uuid: string;
  name: string;
  description: string;
  privileges: Privilege[];
}
