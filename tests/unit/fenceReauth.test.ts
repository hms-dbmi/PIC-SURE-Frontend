import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/api', () => ({ post: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import Fence from '$lib/auth/FENCE';

const store = new Map<string, string>();

function newFence() {
  return new Fence({
    name: 'Fence',
    description: '',
    type: 'FENCE',
    enabled: true,
    alt: false,
    uri: 'https://fence.example',
    clientid: 'abc',
    idp: 'google',
  });
}

describe('Fence re-authentication after logout', () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('sessionStorage', { setItem: vi.fn(), getItem: vi.fn() });
    vi.stubGlobal('window', {
      location: { href: '', protocol: 'https:', hostname: 'h', port: '' },
    });
  });

  it('omits prompt on a login that did not follow a logout', async () => {
    await newFence().login('/', 'FENCE');
    expect(window.location.href).not.toContain('prompt=');
  });

  it('adds prompt=login on the first login after logout, then clears the flag', async () => {
    const fence = newFence();
    await fence.logout();
    await fence.login('/', 'FENCE');
    expect(window.location.href).toContain('&prompt=login');
    await fence.login('/', 'FENCE');
    expect(window.location.href).not.toContain('prompt=');
  });
});
