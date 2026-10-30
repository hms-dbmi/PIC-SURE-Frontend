import { request } from '#lib/api/client.ts';
import { Psama } from '#lib/api/paths.ts';
import type { Application } from '#lib/admin/access/model/applications.ts';
import type { Connection } from '#lib/auth/model/connection.ts';
import type { Privilege } from '#lib/auth/model/privilege.ts';
import type { Role } from '#lib/auth/model/role.ts';
import type { ExtendedUser, UserRequest } from '#lib/auth/model/user.ts';

// PSAMA nests related records whole, where the admin pages keep only their uuids. Every write
// takes a list; the admin pages send one record at a time.
interface Ref {
  uuid: string;
}

export type PrivilegeDto = Omit<Privilege, 'application'> & { application?: Ref | null };
export type RoleDto = Omit<Role, 'privileges'> & { privileges?: Ref[] | null };
export type UserDto = Omit<ExtendedUser, 'connection' | 'roles'> & {
  connection?: Ref | null;
  roles?: Ref[] | null;
};
export type UserUpdate = Pick<
  UserRequest,
  'uuid' | 'email' | 'active' | 'generalMetadata' | 'connection' | 'roles'
>;

// The admin pages keep the rest of each record as PSAMA sent it.
export const mapPrivilege = ({ application, ...privilege }: PrivilegeDto): Privilege => ({
  ...privilege,
  application: application?.uuid || '',
});

export const mapRole = ({ privileges, ...role }: RoleDto): Role => ({
  ...role,
  privileges: privileges ? privileges.map((p) => p.uuid) : [],
});

export const mapUser = ({ connection, roles, ...user }: UserDto): ExtendedUser => ({
  ...user,
  connection: connection ? connection.uuid : '',
  roles: roles ? roles.map((r) => r.uuid) : [],
});

interface Envelope<T> {
  message?: string;
  content: T[];
}

export const connections = {
  list: () => request<Connection[]>(Psama.Connection),
  add: async (connection: Connection) =>
    (await request<Envelope<Connection>>(Psama.Connection, { method: 'POST', body: [connection] }))
      .content[0],
  update: async (connection: Connection) =>
    (await request<Connection[]>(Psama.Connection, { method: 'PATCH', body: [connection] }))[0],
  /** PSAMA deletes a connection by its id, not its uuid. */
  remove: (id: string) => request<unknown>(`${Psama.Connection}/${id}`, { method: 'DELETE' }),
};

export const privileges = {
  list: () => request<PrivilegeDto[]>(Psama.Privilege),
  get: (uuid: string) => request<PrivilegeDto>(`${Psama.Privilege}/${uuid}`),
  add: async (privilege: PrivilegeDto) =>
    (await request<PrivilegeDto[]>(Psama.Privilege, { method: 'POST', body: [privilege] }))[0],
  /** Sends the application as a bare uuid, unlike `add`. */
  update: (privilege: Privilege) =>
    request<unknown>(Psama.Privilege, { method: 'PATCH', body: [privilege] }),
  remove: (uuid: string) => request<unknown>(`${Psama.Privilege}/${uuid}`, { method: 'DELETE' }),
};

export const roles = {
  list: () => request<RoleDto[]>(Psama.Role),
  get: (uuid: string) => request<RoleDto>(`${Psama.Role}/${uuid}`),
  add: async (role: RoleDto) =>
    (await request<Envelope<RoleDto>>(Psama.Role, { method: 'POST', body: [role] })).content[0],
  /** Sends the privileges as bare uuids, unlike `add`. */
  update: async (role: Role) =>
    (await request<Envelope<RoleDto>>(Psama.Role, { method: 'PATCH', body: [role] })).content[0],
  remove: (uuid: string) => request<unknown>(`${Psama.Role}/${uuid}`, { method: 'DELETE' }),
};

export const applications = {
  list: () => request<Application[]>(Psama.Application),
};

export const users = {
  list: () => request<UserDto[]>(Psama.Users),
  get: (uuid: string) => request<UserDto>(`${Psama.Users}/${uuid}`),
  add: async (user: UserRequest) =>
    (await request<UserDto[]>(Psama.Users, { method: 'POST', body: [user] }))[0],
  update: async (user: UserUpdate) =>
    (await request<UserDto[]>(Psama.Users, { method: 'PATCH', body: [user] }))[0],
};
