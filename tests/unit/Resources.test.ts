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

import {
  resources,
  getQueryResources,
  getCountResource,
  getApiConnectionResource,
} from '$lib/stores/Resources';

describe('Resources', () => {
  const authUuid = 'auth-uuid-123';
  const openV3Uuid = 'open-v3-uuid-456';
  const queryableResources = [
    { name: 'resource1', uuid: 'uuid-1' },
    { name: 'resource2', uuid: 'uuid-2' },
  ];

  beforeEach(() => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = false;
    mockFeatures.federated = false;

    resources.set({
      visualization: '',
      application: '',
      aggregate: '',
      search: '',
      hpdsOpen: '',
      hpdsOpenV3: openV3Uuid,
      hpdsAuth: authUuid,
      queryIdGen: '',
      queryable: queryableResources,
    });
  });

  it('returns hpdsAuth when isOpenAccess is false', () => {
    const result = getQueryResources(false);
    expect(result).toEqual([{ name: 'hpds', uuid: authUuid }]);
  });

  it('returns hpdsAuth by default (no argument)', () => {
    const result = getQueryResources();
    expect(result).toEqual([{ name: 'hpds', uuid: authUuid }]);
  });

  it('returns hpdsOpenV3 when isOpenAccess is true and explore-without-login is disabled', () => {
    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpdsOpen', uuid: openV3Uuid }]);
  });

  it('returns hpdsAuth when isOpenAccess is true but explore-without-login is enabled', () => {
    mockFeatures.explorer.open = true;
    mockFeatures.login.open = true;

    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpds', uuid: authUuid }]);
  });

  it('returns hpdsAuth when isOpenAccess is true and only explorer.open is true', () => {
    mockFeatures.explorer.open = true;
    mockFeatures.login.open = false;

    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpdsOpen', uuid: openV3Uuid }]);
  });

  it('returns hpdsAuth when isOpenAccess is true and only login.open is true', () => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = true;

    const result = getQueryResources(true);
    expect(result).toEqual([{ name: 'hpdsOpen', uuid: openV3Uuid }]);
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

  describe('getCountResource (single-resource by design)', () => {
    it('returns hpdsAuth when isOpenAccess is false', () => {
      expect(getCountResource(false)).toEqual({ name: 'hpds', uuid: authUuid });
    });

    it('returns hpdsAuth by default (no argument)', () => {
      expect(getCountResource()).toEqual({ name: 'hpds', uuid: authUuid });
    });

    it('returns hpdsOpenV3 when isOpenAccess is true and explore-without-login is disabled', () => {
      expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: openV3Uuid });
    });

    it('returns hpdsAuth when explore-without-login is enabled even if isOpenAccess is true', () => {
      mockFeatures.explorer.open = true;
      mockFeatures.login.open = true;

      expect(getCountResource(true)).toEqual({ name: 'hpds', uuid: authUuid });
    });

    it('ignores the federated flag: still returns the single HPDS resource', () => {
      mockFeatures.federated = true;

      expect(getCountResource(false)).toEqual({ name: 'hpds', uuid: authUuid });
      expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: openV3Uuid });
    });
  });

  describe('getApiConnectionResource', () => {
    it('uses the authorized resource for authenticated users', () => {
      expect(getApiConnectionResource(true)).toEqual({
        name: 'hpds',
        uuid: authUuid,
        requiresAuth: true,
        usesDistinctOpenResource: false,
      });
    });

    it('uses a configured distinct open resource for anonymous users', () => {
      expect(getApiConnectionResource(false)).toEqual({
        name: 'hpdsOpen',
        uuid: openV3Uuid,
        requiresAuth: false,
        usesDistinctOpenResource: true,
      });
    });

    it('uses the authorized resource anonymously for explore-without-login', () => {
      mockFeatures.explorer.open = true;
      mockFeatures.login.open = true;

      expect(getApiConnectionResource(false)).toEqual({
        name: 'hpds',
        uuid: authUuid,
        requiresAuth: false,
        usesDistinctOpenResource: false,
      });
    });

    it('falls back to an authenticated resource when no open resource is configured', () => {
      resources.update(($resources) => ({ ...$resources, hpdsOpenV3: '' }));

      expect(getApiConnectionResource(false)).toEqual({
        name: 'hpds',
        uuid: authUuid,
        requiresAuth: true,
        usesDistinctOpenResource: false,
      });
    });
  });

  describe('env without open HPDS resource (hpdsOpenV3 is blank)', () => {
    beforeEach(() => {
      resources.set({
        visualization: '',
        application: '',
        aggregate: '',
        search: '',
        hpdsOpen: '',
        hpdsOpenV3: '',
        hpdsAuth: authUuid,
        queryIdGen: '',
        queryable: [],
      });
    });

    it('returns hpdsAuth when explore-without-login is enabled even if isOpenAccess is true', () => {
      mockFeatures.explorer.open = true;
      mockFeatures.login.open = true;

      expect(getCountResource(true)).toEqual({ name: 'hpds', uuid: authUuid });
    });

    it('returns blank hpdsOpenV3 when open access is requested without a configured resource', () => {
      expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: '' });
    });
  });
});
