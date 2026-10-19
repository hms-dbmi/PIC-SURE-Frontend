import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() }));

// Routes each request() to a mock per method, so the assertions read like the PSAMA calls.
vi.mock('#lib/api/client.ts', () => ({
  request: (path: string, { method = 'GET', body, ...rest }: RequestOptions = {}) => {
    if (Object.keys(rest).length) throw new Error(`unexpected options ${JSON.stringify(rest)}`);
    if (method === 'GET') return client.get(path);
    if (method === 'DELETE') return client.del(path);
    if (method === 'POST') return client.post(path, body);
    if (method === 'PATCH') return client.patch(path, body);
    throw new Error(`unexpected method ${method}`);
  },
}));

vi.mock('#lib/auth/session.svelte.ts', () => ({ session: { onEnd: vi.fn() } }));

import type { RequestOptions } from '#lib/api/client.ts';
import type { Connection } from '#lib/auth/model/connection.ts';
import type { UserRequest } from '#lib/auth/model/user.ts';

const calls = () => ({
  get: client.get.mock.calls,
  post: client.post.mock.calls,
  patch: client.patch.mock.calls,
  del: client.del.mock.calls,
});

// Each resource keeps a module-level "loaded" flag, so every test gets fresh modules.
async function stores() {
  vi.resetModules();
  return await import('#lib/admin/resources.ts');
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

    await s.load();
    await s.load();

    expect(calls().get).toEqual([['psama/connection']]);
    expect(s.items).toEqual([a, b]);
  });

  it('gets by uuid, loading the list first when it is empty', async () => {
    const { connections: s } = await stores();
    client.get.mockResolvedValue([a, b]);

    expect(await s.get('c-2')).toEqual(b);
    await expect(s.get('missing')).rejects.toThrow('Connection not found.');
    expect(calls().get).toEqual([['psama/connection']]);
  });

  it('adds, updates and deletes against the list', async () => {
    const { connections: s } = await stores();
    client.get.mockResolvedValue([a]);
    await s.load();

    client.post.mockResolvedValue({ message: 'ok', content: [b] });
    await s.add({ ...b, uuid: undefined });
    expect(s.items).toEqual([a, b]);

    const renamed = { ...a, label: 'Okta 2' };
    const unknown = { ...a, uuid: 'c-3' };
    client.patch.mockResolvedValueOnce([renamed]).mockResolvedValueOnce([unknown]);
    await s.update({ ...a, label: 'sent' });
    await s.update(unknown);

    await s.remove('c-2');

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
    expect(s.items).toEqual([renamed, unknown]);
  });
});

describe('Privileges store', () => {
  const raw = { uuid: 'p-1', name: 'ADMIN', description: 'd', application: { uuid: 'app-1' } };
  const mapped = { ...raw, application: 'app-1' };

  it('loads once, maps the application to its uuid and lists name/uuid pairs', async () => {
    const { privileges: s } = await stores();
    client.get.mockResolvedValue([raw, { uuid: 'p-2', name: 'QUERY', description: '' }]);

    await s.load();
    await s.load();

    expect(calls().get).toEqual([['psama/privilege']]);
    expect(s.items).toEqual([
      mapped,
      { uuid: 'p-2', name: 'QUERY', description: '', application: '' },
    ]);
    expect(s.options).toEqual([
      ['ADMIN', 'p-1'],
      ['QUERY', 'p-2'],
    ]);
  });

  it('gets from the list, or fetches one by uuid', async () => {
    const { privileges: s } = await stores();
    client.get.mockResolvedValueOnce([raw]).mockResolvedValueOnce({ ...raw, uuid: 'p-9' });
    await s.load();

    expect(await s.get('p-1')).toEqual(mapped);
    expect(await s.get('p-9')).toEqual({ ...mapped, uuid: 'p-9' });
    expect(calls().get).toEqual([['psama/privilege'], ['psama/privilege/p-9']]);
  });

  it('adds, updates and deletes against the list', async () => {
    const { privileges: s } = await stores();
    client.get.mockResolvedValue([raw]);
    await s.load();

    const added = { uuid: 'p-2', name: 'NEW', description: '', application: { uuid: 'app-2' } };
    client.post.mockResolvedValue([added]);
    await s.add({ name: 'NEW', description: '', application: 'app-2' });
    expect(s.items).toEqual([mapped, { ...added, application: 'app-2' }]);

    const edited = { ...mapped, description: 'edited' };
    client.patch.mockResolvedValue('ignored');
    await s.update(edited);
    await s.update({ ...mapped, uuid: 'p-3' });

    await s.remove('p-2');

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
    expect(s.items).toEqual([edited, { ...mapped, uuid: 'p-3' }]);
  });
});

describe('Roles store', () => {
  const raw = { uuid: 'r-1', name: 'Admin', description: 'd', privileges: [{ uuid: 'p-1' }] };
  const mapped = { ...raw, privileges: ['p-1'] };

  it('loads once, maps privileges to uuids and lists name/uuid pairs', async () => {
    const { roles: s } = await stores();
    client.get.mockResolvedValue([raw, { uuid: 'r-2', name: 'User', description: '' }]);

    await s.load();
    await s.load();

    expect(calls().get).toEqual([['psama/role']]);
    expect(s.items).toEqual([
      mapped,
      { uuid: 'r-2', name: 'User', description: '', privileges: [] },
    ]);
    expect(s.options).toEqual([
      ['Admin', 'r-1'],
      ['User', 'r-2'],
    ]);
  });

  it('gets from the list, or fetches one by uuid', async () => {
    const { roles: s } = await stores();
    client.get.mockResolvedValueOnce([raw]).mockResolvedValueOnce({ ...raw, uuid: 'r-9' });
    await s.load();

    expect(await s.get('r-1')).toEqual(mapped);
    expect(await s.get('r-9')).toEqual({ ...mapped, uuid: 'r-9' });
    expect(calls().get).toEqual([['psama/role'], ['psama/role/r-9']]);
  });

  it('adds, updates and deletes against the list', async () => {
    const { roles: s } = await stores();
    client.get.mockResolvedValue([raw]);
    await s.load();

    const added = { uuid: 'r-2', name: 'New', description: '', privileges: [{ uuid: 'p-2' }] };
    client.post.mockResolvedValue({ content: [added] });
    await s.add({ name: 'New', description: '', privileges: ['p-2'] });
    expect(s.items).toEqual([mapped, { ...added, privileges: ['p-2'] }]);

    const updated = { ...raw, description: 'edited' };
    client.patch.mockResolvedValue({ content: [updated] });
    await s.update({ ...mapped, description: 'sent' });

    await s.remove('r-2');

    expect(calls()).toEqual({
      get: [['psama/role']],
      post: [['psama/role', [{ name: 'New', description: '', privileges: [{ uuid: 'p-2' }] }]]],
      // Quirk: update sends privileges as bare uuid strings, unlike add.
      patch: [['psama/role', [{ ...mapped, description: 'sent' }]]],
      del: [['psama/role/r-2']],
    });
    expect(s.items).toEqual([{ ...mapped, description: 'edited' }]);
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

    await s.load();
    await s.load();

    expect(calls().get).toEqual([['psama/user']]);
    expect(s.items).toEqual([
      mapped,
      { uuid: 'u-2', email: 'b@example.com', connection: '', roles: [] },
    ]);
  });

  it('gets by uuid from the list or the server, and by email and connection', async () => {
    const { users: s, findUserByEmailAndConnection } = await stores();
    client.get.mockResolvedValueOnce({ ...raw, uuid: 'u-9' });
    expect(await s.get('u-9')).toEqual({ ...mapped, uuid: 'u-9' });

    client.get.mockResolvedValueOnce([raw]);
    expect(await findUserByEmailAndConnection('a@example.com', 'c-1')).toEqual(mapped);
    expect(await findUserByEmailAndConnection('a@example.com', 'c-2')).toBeUndefined();
    expect(await s.get('u-1')).toEqual(mapped);

    expect(calls().get).toEqual([['psama/user/u-9'], ['psama/user']]);
  });

  it('adds and updates against the list', async () => {
    const { users: s } = await stores();
    client.get.mockResolvedValue([raw]);
    await s.load();

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
    await s.add(request);

    const updated = { ...raw, active: false };
    client.patch.mockResolvedValue([updated]);
    await s.update({ ...request, uuid: 'u-1', active: false, privileges: ['dropped'] });

    expect(calls()).toEqual({
      get: [['psama/user']],
      post: [['psama/user', [request]]],
      patch: [['psama/user', [{ ...request, uuid: 'u-1', active: false }]]],
      del: [],
    });
    expect(s.items).toEqual([
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

    expect(s.find('app-1')).toBeUndefined();
    await s.load();
    await s.load();

    expect(calls().get).toEqual([['psama/application']]);
    expect(s.items).toEqual([app]);
    expect(s.options).toEqual([['PICSURE', 'app-1']]);
    expect(s.find('app-1')).toEqual(app);
    expect(s.find('missing')).toBeUndefined();
  });
});
