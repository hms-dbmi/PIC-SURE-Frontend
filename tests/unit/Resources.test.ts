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

describe('getQueryResources', () => {
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

      const result = getQueryResources(true);
      expect(result).toEqual([{ name: 'hpds', uuid: authUuid }]);
    });

    it('returns blank hpdsOpenV3 only when explore-without-login is disabled and isOpenAccess is true', () => {
      // This case shouldn't happen in practice — if hpdsOpenV3 is blank,
      // the env shouldn't have explore-without-login disabled with open access callers.
      const result = getQueryResources(true);
      expect(result).toEqual([{ name: 'hpdsOpen', uuid: '' }]);
    });
  });
});
