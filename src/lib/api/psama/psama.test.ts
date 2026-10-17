import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getSessionId: () => 'session-id',
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { wafCaptchaRecovery: false } },
}));
vi.mock('#lib/api/wafCaptcha.ts', () => ({
  isWafCaptchaResponse: () => false,
  handleWafCaptcha: () => true,
}));

import { registerSessionHooks } from '#lib/api/sessionHooks.ts';
import * as access from '#lib/api/psama/access.ts';
import * as apiKeys from '#lib/api/psama/apiKeys.ts';
import * as tos from '#lib/api/psama/tos.ts';
import * as user from '#lib/api/psama/user.ts';
import type { Connection } from '#lib/auth/model/connection.ts';

interface Sent {
  method?: string;
  path: string;
  body?: unknown;
  contentType?: string;
  /** Whether the signed-in user's token went with it. */
  token?: boolean;
}

const connection: Connection = {
  id: 'okta',
  label: 'Okta',
  subPrefix: 'okta|',
  requiredFields: '',
};
const privilege = { name: 'ADMIN', description: '', application: 'app-1' };
const role = { name: 'Admin', description: '', privileges: ['p-1'] };
const userRequest = { email: 'a@example.com', active: true, generalMetadata: '' };
const platformKey = { name: 'Pipeline', email: 'ops@example.org' };
const publicKey = { captchaToken: null, name: null, email: null };

// PSAMA's paths and bodies are contracts: the backend and the e2e mocks match them exactly.
const calls: [string, () => Promise<unknown>, Sent][] = [
  ['user.me', () => user.me(), { path: 'psama/user/me' }],
  ['user.me with the token', () => user.me({ hasToken: true }), { path: 'psama/user/me?hasToken' }],
  ['user.consents', () => user.consents(), { path: 'psama/user/me/consents' }],
  [
    'user.refreshLongTermToken',
    () => user.refreshLongTermToken(),
    { path: 'psama/user/me/refresh_long_term_token' },
  ],
  ['user.logout', () => user.logout(), { path: 'psama/logout' }],
  [
    'user.authenticate',
    () => user.authenticate('fence', { code: 'c' }),
    { method: 'POST', path: 'psama/authentication/fence', body: { code: 'c' } },
  ],
  ['tos.latest', () => tos.latest(), { path: 'psama/tos/latest' }],
  [
    'tos.latest without the token',
    () => tos.latest({ auth: 'none' }),
    { path: 'psama/tos/latest', token: false },
  ],
  ['tos.accept', () => tos.accept(), { method: 'POST', path: 'psama/tos/accept', body: {} }],
  [
    'tos.update',
    () => tos.update('<p>Terms</p>'),
    { method: 'POST', path: 'psama/tos/update', body: '<p>Terms</p>', contentType: 'text/html' },
  ],
  ['connections.list', () => access.connections.list(), { path: 'psama/connection' }],
  [
    'connections.add',
    () => access.connections.add(connection),
    { method: 'POST', path: 'psama/connection', body: [connection] },
  ],
  [
    'connections.update',
    () => access.connections.update(connection),
    { method: 'PATCH', path: 'psama/connection', body: [connection] },
  ],
  [
    'connections.remove',
    () => access.connections.remove('okta'),
    { method: 'DELETE', path: 'psama/connection/okta' },
  ],
  ['privileges.list', () => access.privileges.list(), { path: 'psama/privilege' }],
  ['privileges.get', () => access.privileges.get('p-1'), { path: 'psama/privilege/p-1' }],
  [
    'privileges.add',
    () => access.privileges.add({ ...privilege, application: { uuid: 'app-1' } }),
    {
      method: 'POST',
      path: 'psama/privilege',
      body: [{ ...privilege, application: { uuid: 'app-1' } }],
    },
  ],
  [
    'privileges.update',
    () => access.privileges.update(privilege),
    { method: 'PATCH', path: 'psama/privilege', body: [privilege] },
  ],
  [
    'privileges.remove',
    () => access.privileges.remove('p-1'),
    { method: 'DELETE', path: 'psama/privilege/p-1' },
  ],
  ['roles.list', () => access.roles.list(), { path: 'psama/role' }],
  ['roles.get', () => access.roles.get('r-1'), { path: 'psama/role/r-1' }],
  [
    'roles.add',
    () => access.roles.add({ ...role, privileges: [{ uuid: 'p-1' }] }),
    { method: 'POST', path: 'psama/role', body: [{ ...role, privileges: [{ uuid: 'p-1' }] }] },
  ],
  [
    'roles.update',
    () => access.roles.update(role),
    { method: 'PATCH', path: 'psama/role', body: [role] },
  ],
  ['roles.remove', () => access.roles.remove('r-1'), { method: 'DELETE', path: 'psama/role/r-1' }],
  ['applications.list', () => access.applications.list(), { path: 'psama/application' }],
  ['users.list', () => access.users.list(), { path: 'psama/user' }],
  ['users.get', () => access.users.get('u-1'), { path: 'psama/user/u-1' }],
  [
    'users.add',
    () => access.users.add(userRequest),
    { method: 'POST', path: 'psama/user', body: [userRequest] },
  ],
  [
    'users.update',
    () => access.users.update(userRequest),
    { method: 'PATCH', path: 'psama/user', body: [userRequest] },
  ],
  ['apiKeys.list', () => apiKeys.list(0, 100), { path: 'psama/apiKey?page=0&size=100' }],
  [
    'apiKeys.list by type',
    () => apiKeys.list(2, 50, 'PLATFORM'),
    { path: 'psama/apiKey?page=2&size=50&keyType=PLATFORM' },
  ],
  [
    'apiKeys.revoke',
    () => apiKeys.revoke('k-1'),
    { method: 'PUT', path: 'psama/apiKey/k-1/revoke' },
  ],
  [
    'apiKeys.mintPlatform',
    () => apiKeys.mintPlatform(platformKey),
    { method: 'POST', path: 'psama/apiKey/platform', body: platformKey },
  ],
  [
    'apiKeys.requestPublic',
    () => apiKeys.requestPublic(publicKey),
    { method: 'POST', path: 'psama/open/apiKey', body: publicKey, token: false },
  ],
];

describe('PSAMA requests', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    // one body every unwrap accepts: lists read [0], envelopes read .content[0]
    fetchMock = vi.fn(async () => new Response('{"content":[{}]}'));
    vi.stubGlobal('fetch', fetchMock);
    registerSessionHooks({
      getToken: () => 'user-token',
      onUnauthorized: vi.fn(),
      onForbidden: vi.fn(),
      onTokenRefreshed: vi.fn(),
    });
  });

  it.each(calls)('%s', async (_, call, sent) => {
    await call();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe(`https://example.com/${sent.path}`);
    expect(init.method).toBe(sent.method ?? 'GET');
    const body = typeof sent.body === 'string' ? sent.body : JSON.stringify(sent.body);
    expect(init.body).toBe(body);
    const contentType =
      sent.contentType ?? (sent.body === undefined ? undefined : 'application/json');
    expect(headers['Content-Type']).toBe(contentType);
    expect(headers['Authorization']).toBe(sent.token === false ? undefined : 'Bearer user-token');
  });
});
