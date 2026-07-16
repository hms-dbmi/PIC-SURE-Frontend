import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFeatures = vi.hoisted(() => ({
  explorer: { open: false },
  login: { open: false },
  federated: false,
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/configuration', () => ({ features: mockFeatures }));
vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('$lib/toaster', () => ({ toaster: { add: vi.fn() } }));

import { resources, getQueryResources } from '$lib/stores/Resources';

// With path-based gateway routing the non-federated resource UUID is gone: the query PATH
// (`/hpds/auth` vs `/hpds/open`) selects the backend, so getQueryResources returns a single
// entry whose `uuid` is always empty and whose `name` (still used as a stat/result map key)
// reflects the open/auth choice. Federated still returns the discovered `queryable` list.
describe('getQueryResources', () => {
  const queryableResources = [
    { name: 'resource1', uuid: 'uuid-1' },
    { name: 'resource2', uuid: 'uuid-2' },
  ];

  beforeEach(() => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = false;
    mockFeatures.federated = false;

    resources.set({
      application: '',
      queryIdGen: '',
      queryable: queryableResources,
    });
  });

  it('returns the auth resource (empty uuid) when isOpenAccess is false', () => {
    const result = getQueryResources(false);
    expect(result).toEqual([{ name: 'hpds', uuid: '' }]);
  });

  it('returns the auth resource by default (no argument)', () => {
    const result = getQueryResources();
    expect(result).toEqual([{ name: 'hpds', uuid: '' }]);
  });

  it('returns the open resource when isOpenAccess is true and explore-without-login is disabled', () => {
    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpdsOpen', uuid: '' }]);
  });

  it('returns the auth resource when isOpenAccess is true but explore-without-login is enabled', () => {
    mockFeatures.explorer.open = true;
    mockFeatures.login.open = true;

    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpds', uuid: '' }]);
  });

  it('returns the open resource when isOpenAccess is true and only explorer.open is true', () => {
    mockFeatures.explorer.open = true;
    mockFeatures.login.open = false;

    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpdsOpen', uuid: '' }]);
  });

  it('returns the open resource when isOpenAccess is true and only login.open is true', () => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = true;

    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpdsOpen', uuid: '' }]);
  });

  it('returns queryable resources when federated is true', () => {
    mockFeatures.federated = true;

    const result = getQueryResources(false);
    expect(result).toEqual(queryableResources);
  });

  it('returns queryable resources when federated is true regardless of isOpenAccess', () => {
    mockFeatures.federated = true;

    const result = getQueryResources(true);
    expect(result).toEqual(queryableResources);
  });
});
