import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFeatures = vi.hoisted(() => ({
  explorer: { open: false },
  login: { open: false },
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/configuration.svelte', () => ({ config: { features: mockFeatures } }));

import { resources, getCountResource } from '$lib/stores/Resources';

describe('getCountResource', () => {
// With path-based gateway routing the non-federated resource UUID is gone: the query PATH
  // (`/hpds/auth` vs `/hpds/open`) selects the backend, so the resource UUID is always empty.

  beforeEach(() => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = false;

    resources.set({
      application: '',
    });
  });

  it('returns the auth resource (empty uuid) when isOpenAccess is false', () => {
    expect(getCountResource(false)).toEqual({ name: 'hpds', uuid: '' });
  });

  it('returns the auth resource by default (no argument)', () => {
    expect(getCountResource()).toEqual({ name: 'hpds', uuid: '' });
  });

  it('returns the open resource when isOpenAccess is true and explore-without-login is disabled', () => {
    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: '' });
  });

  it('returns the auth resource when isOpenAccess is true but explore-without-login is enabled', () => {
    mockFeatures.explorer.open = true;
    mockFeatures.login.open = true;

    expect(getCountResource(true)).toEqual({ name: 'hpds', uuid: '' });
  });

  it('returns the open resource when isOpenAccess is true and only explorer.open is true', () => {
    mockFeatures.explorer.open = true;

    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: '' });
  });

  it('returns the open resource when isOpenAccess is true and only login.open is true', () => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = true;

    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: '' });
  });
});
