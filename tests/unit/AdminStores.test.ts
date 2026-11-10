import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get as read } from 'svelte/store';

vi.mock('#lib/api.ts', () => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() }));

import * as api from '#lib/api.ts';
import type { Connection } from '#lib/models/Connection.ts';
import type { UserRequest } from '#lib/models/User.ts';

const client = {
  get: vi.mocked(api.get),
  post: vi.mocked(api.post),
  patch: vi.mocked(api.patch),
  del: vi.mocked(api.del),
};

const calls = () => ({
  get: client.get.mock.calls,
  post: client.post.mock.calls,
  patch: client.patch.mock.calls,
  del: client.del.mock.calls,
});

// Each store keeps a module-level "loaded" flag, so every test gets fresh modules.
async function stores() {
  vi.resetModules();
  return {
    connections: await import('#lib/stores/Connections.ts'),
    privileges: await import('#lib/stores/Privileges.ts'),
    roles: await import('#lib/stores/Roles.ts'),
    users: await import('#lib/stores/Users.ts'),
    applications: await import('#lib/stores/Application.ts'),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Connections store', () => {
  const a: Connection = {
    uuid: 'c-1',
    id: 'okta',
    label: 'Okta',
    subPrefix: 'okta|',
    requiredFields: '',
  };
  const b: Connection = {
    uuid: 'c-2',
    id: 'fence',
    label: 'Fence',
    subPrefix: 'fence|',
    requiredFields: '',
  };

  it('loads once and reuses the list', async () => {
    const { connections: s } = await stores();
    client.get.mockResolvedValue([a, b]);

    await s.loadConnections();
    await s.loadConnections();

    expect(calls().get).toEqual([['psama/connection']]);
    expect(read(s.connections)).toEqual([a, b]);
  });

  it('gets by uuid, loading the list first when it is empty', async () => {
    const { connections: s } = await stores();
    client.get.mockResolvedValue([a, b]);

    expect(await s.getConnection('c-2')).toEqual(b);
    await expect(s.getConnection('missing')).rejects.toThrow('Connection not found.');
    expect(calls().get).toEqual([['psama/connection']]);
  });

  it('adds, updates and deletes against the list', async () => {
    const { connections: s } = await stores();
    client.get.mockResolvedValue([a]);
    await s.loadConnections();

    client.post.mockResolvedValue({ message: 'ok', content: [b] });
    await s.addConnection({ ...b, uuid: undefined });
    expect(read(s.connections)).toEqual([a, b]);

    const renamed = { ...a, label: 'Okta 2' };
    const unknown = { ...a, uuid: 'c-3' };
    client.patch.mockResolvedValueOnce([renamed]).mockResolvedValueOnce([unknown]);
    await s.updateConnection({ ...a, label: 'sent' });
    await s.updateConnection(unknown);

    await s.deleteConnection('c-2');

    expect(calls()).toEqual({
      get: [['psama/connection']],
      post: [['psama/connection', [{ ...b, uuid: undefined }]]],
      patch: [
        ['psama/connection', [{ ...a, label: 'sent' }]],
        ['psama/connection', [unknown]],
      ],
      // Deletes by the connection id, not the uuid.
      del: [['psama/connection/fence']],
    });
    // Updates store the response; an unknown uuid is appended.
    expect(read(s.connections)).toEqual([renamed, unknown]);
  });
});

describe('Privileges store', () => {
  const raw = { uuid: 'p-1', name: 'ADMIN', description: 'd', application: { uuid: 'app-1' } };
  const mapped = { ...raw, application: 'app-1' };

  it('loads once, maps the application to its uuid and lists name/uuid pairs', async () => {
    const { privileges: s } = await stores();
    client.get.mockResolvedValue([raw, { uuid: 'p-2', name: 'QUERY', description: '' }]);

    await s.loadPrivileges();
    await s.loadPrivileges();

    expect(calls().get).toEqual([['psama/privilege']]);
    expect(read(s.privileges)).toEqual([
      mapped,
      { uuid: 'p-2', name: 'QUERY', description: '', application: '' },
    ]);
    expect(read(s.privilegeList)).toEqual([
      ['ADMIN', 'p-1'],
      ['QUERY', 'p-2'],
    ]);
  });

  it('gets from the list, or fetches one by uuid', async () => {
    const { privileges: s } = await stores();
    client.get.mockResolvedValueOnce([raw]).mockResolvedValueOnce({ ...raw, uuid: 'p-9' });
    await s.loadPrivileges();

    expect(await s.getPrivilege('p-1')).toEqual(mapped);
    expect(await s.getPrivilege('p-9')).toEqual({ ...mapped, uuid: 'p-9' });
    expect(calls().get).toEqual([['psama/privilege'], ['psama/privilege/p-9']]);
  });

  it('adds, updates and deletes against the list', async () => {
    const { privileges: s } = await stores();
    client.get.mockResolvedValue([raw]);
    await s.loadPrivileges();

    const added = { uuid: 'p-2', name: 'NEW', description: '', application: { uuid: 'app-2' } };
    client.post.mockResolvedValue([added]);
    await s.addPrivilege({ name: 'NEW', description: '', application: 'app-2' });
    expect(read(s.privileges)).toEqual([mapped, { ...added, application: 'app-2' }]);

    const edited = { ...mapped, description: 'edited' };
    client.patch.mockResolvedValue('ignored');
    await s.updatePrivilege(edited);
    await s.updatePrivilege({ ...mapped, uuid: 'p-3' });

    await s.deletePrivilege('p-2');

    expect(calls()).toEqual({
      get: [['psama/privilege']],
      post: [
        ['psama/privilege', [{ name: 'NEW', description: '', application: { uuid: 'app-2' } }]],
      ],
      // Quirk: update sends the application as a bare uuid string, unlike add.
      patch: [
        ['psama/privilege', [edited]],
        ['psama/privilege', [{ ...mapped, uuid: 'p-3' }]],
      ],
      del: [['psama/privilege/p-2']],
    });
    // Updates store what was sent, not the response.
    expect(read(s.privileges)).toEqual([edited, { ...mapped, uuid: 'p-3' }]);
  });
});

describe('Roles store', () => {
  const raw = { uuid: 'r-1', name: 'Admin', description: 'd', privileges: [{ uuid: 'p-1' }] };
  const mapped = { ...raw, privileges: ['p-1'] };

  it('loads once, maps privileges to uuids and lists name/uuid pairs', async () => {
    const { roles: s } = await stores();
    client.get.mockResolvedValue([raw, { uuid: 'r-2', name: 'User', description: '' }]);

    await s.loadRoles();
    await s.loadRoles();

    expect(calls().get).toEqual([['psama/role']]);
    expect(read(s.roles)).toEqual([
      mapped,
      { uuid: 'r-2', name: 'User', description: '', privileges: [] },
    ]);
    expect(read(s.roleList)).toEqual([
      ['Admin', 'r-1'],
      ['User', 'r-2'],
    ]);
  });

  it('gets from the list, or fetches one by uuid', async () => {
    const { roles: s } = await stores();
    client.get.mockResolvedValueOnce([raw]).mockResolvedValueOnce({ ...raw, uuid: 'r-9' });
    await s.loadRoles();

    expect(await s.getRole('r-1')).toEqual(mapped);
    expect(await s.getRole('r-9')).toEqual({ ...mapped, uuid: 'r-9' });
    expect(calls().get).toEqual([['psama/role'], ['psama/role/r-9']]);
  });

  it('adds, updates and deletes against the list', async () => {
    const { roles: s } = await stores();
    client.get.mockResolvedValue([raw]);
    await s.loadRoles();

    const added = { uuid: 'r-2', name: 'New', description: '', privileges: [{ uuid: 'p-2' }] };
    client.post.mockResolvedValue({ content: [added] });
    await s.addRole({ name: 'New', description: '', privileges: ['p-2'] });
    expect(read(s.roles)).toEqual([mapped, { ...added, privileges: ['p-2'] }]);

    const updated = { ...raw, description: 'edited' };
    client.patch.mockResolvedValue({ content: [updated] });
    await s.updateRole({ ...mapped, description: 'sent' });

    await s.deleteRole('r-2');

    expect(calls()).toEqual({
      get: [['psama/role']],
      post: [['psama/role', [{ name: 'New', description: '', privileges: [{ uuid: 'p-2' }] }]]],
      // Quirk: update sends privileges as bare uuid strings, unlike add.
      patch: [['psama/role', [{ ...mapped, description: 'sent' }]]],
      del: [['psama/role/r-2']],
    });
    expect(read(s.roles)).toEqual([{ ...mapped, description: 'edited' }]);
  });
});

describe('Users store', () => {
  const raw = {
    uuid: 'u-1',
    email: 'a@example.com',
    active: true,
    generalMetadata: '{}',
    connection: { uuid: 'c-1' },
    roles: [{ uuid: 'r-1' }],
    subject: 'okta|1',
  };
  const mapped = { ...raw, connection: 'c-1', roles: ['r-1'] };

  it('loads once and maps connection and roles to uuids', async () => {
    const { users: s } = await stores();
    client.get.mockResolvedValue([raw, { uuid: 'u-2', email: 'b@example.com' }]);

    await s.loadUsers();
    await s.loadUsers();

    expect(calls().get).toEqual([['psama/user']]);
    expect(read(s.users)).toEqual([
      mapped,
      { uuid: 'u-2', email: 'b@example.com', connection: '', roles: [] },
    ]);
  });

  it('gets by uuid from the list or the server, and by email and connection', async () => {
    const { users: s } = await stores();
    client.get.mockResolvedValueOnce({ ...raw, uuid: 'u-9' });
    expect(await s.getUser('u-9')).toEqual({ ...mapped, uuid: 'u-9' });

    client.get.mockResolvedValueOnce([raw]);
    expect(await s.getUserByEmailAndConnection('a@example.com', 'c-1')).toEqual(mapped);
    expect(await s.getUserByEmailAndConnection('a@example.com', 'c-2')).toBeUndefined();
    expect(await s.getUser('u-1')).toEqual(mapped);

    expect(calls().get).toEqual([['psama/user/u-9'], ['psama/user']]);
  });

  it('adds and updates against the list', async () => {
    const { users: s } = await stores();
    client.get.mockResolvedValue([raw]);
    await s.loadUsers();

    const added = { ...raw, uuid: 'u-2', email: 'new@example.com' };
    client.post.mockResolvedValue([added]);
    const request: UserRequest = {
      email: 'new@example.com',
      active: true,
      generalMetadata: '{}',
      connection: {
        uuid: 'c-1',
        id: 'okta',
        label: 'Okta',
        subPrefix: 'okta|',
        requiredFields: '',
      },
      roles: [{ uuid: 'r-1', name: 'Admin', description: '', privileges: [] }],
    };
    await s.addUser(request);

    const updated = { ...raw, active: false };
    client.patch.mockResolvedValue([updated]);
    await s.updateUser({ ...request, uuid: 'u-1', active: false, privileges: ['dropped'] });

    expect(calls()).toEqual({
      get: [['psama/user']],
      post: [['psama/user', [request]]],
      patch: [['psama/user', [{ ...request, uuid: 'u-1', active: false }]]],
      del: [],
    });
    expect(read(s.users)).toEqual([
      { ...mapped, active: false },
      { ...mapped, uuid: 'u-2', email: 'new@example.com' },
    ]);
  });
});

describe('Applications store', () => {
  const app = { uuid: 'app-1', name: 'PICSURE', description: '', url: '', enable: true };

  it('loads once, lists name/uuid pairs and gets only from the list', async () => {
    const { applications: s } = await stores();
    client.get.mockResolvedValue([app]);

    expect(s.getApplication('app-1')).toBeUndefined();
    await s.loadApplications();
    await s.loadApplications();

    expect(calls().get).toEqual([['psama/application']]);
    expect(read(s.applications)).toEqual([app]);
    expect(read(s.applicationList)).toEqual([['PICSURE', 'app-1']]);
    expect(s.getApplication('app-1')).toEqual(app);
    expect(s.getApplication('missing')).toBeUndefined();
  });
});
