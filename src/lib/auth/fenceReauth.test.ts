import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import Fence from '#lib/auth/providers/FENCE.ts';

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

  it('still logs in and logs out when localStorage is unavailable', async () => {
    const unavailable = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', {
      getItem: unavailable,
      setItem: unavailable,
      removeItem: unavailable,
    });
    const fence = newFence();

    await expect(fence.logout()).resolves.toBeUndefined();
    await fence.login('/', 'FENCE');

    expect(window.location.href).not.toContain('prompt=');
  });
});
