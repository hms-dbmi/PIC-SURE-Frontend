import * as access from '#lib/api/psama/access.ts';
import { mapPrivilege, mapRole, mapUser } from '#lib/api/psama/access.ts';
import { createResource } from '#lib/admin/resource.svelte.ts';
import type { UserRequest } from '#lib/auth/model/user.ts';

// Connections have no GET by uuid, so `get` searches the loaded list.
export const connections = createResource({
  name: 'Connection',
  list: access.connections.list,
  add: access.connections.add,
  update: access.connections.update,
  remove: { key: (connection) => connection.id, send: access.connections.remove },
});

export const privileges = createResource({
  name: 'Privilege',
  list: async () => (await access.privileges.list()).map(mapPrivilege),
  get: async (uuid) => mapPrivilege(await access.privileges.get(uuid)),
  add: async (privilege) =>
    mapPrivilege(
      await access.privileges.add({ ...privilege, application: { uuid: privilege.application } }),
    ),
  // PSAMA's response isn't read: the list keeps the privilege as sent.
  update: async (privilege) => {
    await access.privileges.update(privilege);
    return privilege;
  },
  remove: { send: access.privileges.remove },
  label: (privilege) => privilege.name,
});

export const roles = createResource({
  name: 'Role',
  list: async () => (await access.roles.list()).map(mapRole),
  get: async (uuid) => mapRole(await access.roles.get(uuid)),
  add: async (role) =>
    mapRole(
      await access.roles.add({ ...role, privileges: role.privileges.map((uuid) => ({ uuid })) }),
    ),
  update: async (role) => mapRole(await access.roles.update(role)),
  remove: { send: access.roles.remove },
  label: (role) => role.name,
});

export const users = createResource({
  name: 'User',
  list: async () => (await access.users.list()).map(mapUser),
  get: async (uuid) => mapUser(await access.users.get(uuid)),
  add: async (user: UserRequest) => mapUser(await access.users.add(user)),
  update: async ({ uuid, email, active, generalMetadata, connection, roles }: UserRequest) =>
    mapUser(await access.users.update({ uuid, email, active, generalMetadata, connection, roles })),
});

// Only ever looked up in the loaded list (`find`).
export const applications = createResource({
  name: 'Application',
  list: access.applications.list,
  label: (application) => application.name,
});

/** A user, with the connections and roles their pages look up by uuid loaded. */
export async function loadUser(uuid: string) {
  const [user] = await Promise.all([users.get(uuid), connections.load(), roles.load()]);
  return user;
}

export async function findUserByEmailAndConnection(email: string, connection: string) {
  await users.load();
  return users.items.find((u) => u.email === email && u.connection === connection);
}

/**
 * The roles a user save sends: PSAMA resolves them by uuid (UserService.resolveRoles) and ignores
 * anything else nested in them.
 */
export function rolesForSave(uuids: string[]): { uuid: string }[] {
  return uuids.map((uuid) => ({ uuid }));
}
