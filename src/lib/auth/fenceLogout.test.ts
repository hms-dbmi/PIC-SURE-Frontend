import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/client.ts', () => ({ request: vi.fn() }));

import Fence from '#lib/auth/providers/FENCE.ts';

function newFence(logouturl?: string) {
  return new Fence({
    name: 'Fence',
    description: '',
    type: 'FENCE',
    enabled: true,
    alt: false,
    uri: 'https://fence.example',
    clientid: 'abc',
    idp: 'google',
    logouturl,
  });
}

describe('Fence logout', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', { setItem: vi.fn(), getItem: vi.fn() });
    vi.stubGlobal('window', {
      location: { href: '', protocol: 'https:', hostname: 'picsure.example', port: '' },
    });
  });

  it('returns the Fence logout URL, coming back to the login page', async () => {
    await expect(newFence().logout()).resolves.toBe(
      'https://fence.example/user/logout?next=https%3A%2F%2Fpicsure.example%2Flogin',
    );
  });

  it('keeps the port of a login page served on one', async () => {
    window.location.port = '8443';
    await expect(newFence().logout()).resolves.toBe(
      'https://fence.example/user/logout?next=https%3A%2F%2Fpicsure.example%3A8443%2Flogin',
    );
  });

  it('comes back to the configured logout URL when there is one', async () => {
    await expect(newFence('https://after.example/bye?x=1').logout()).resolves.toBe(
      'https://fence.example/user/logout?next=https%3A%2F%2Fafter.example%2Fbye%3Fx%3D1',
    );
  });

  it('never asks Fence to prompt on login', async () => {
    await newFence().login('/', 'FENCE');
    expect(window.location.href).not.toContain('prompt=');
  });
});
