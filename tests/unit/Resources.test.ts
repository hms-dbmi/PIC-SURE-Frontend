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
  const authUuid = 'auth-uuid-123';
  const openV3Uuid = 'open-v3-uuid-456';

  beforeEach(() => {
    mockFeatures.explorer.open = false;
    mockFeatures.login.open = false;

    resources.set({
      visualization: '',
      application: '',
      aggregate: '',
      search: '',
      hpdsOpen: 'legacy-open-uuid',
      hpdsOpenV3: openV3Uuid,
      hpdsAuth: authUuid,
    });
  });

  it('returns hpdsAuth when isOpenAccess is false', () => {
    expect(getCountResource(false)).toEqual({ name: 'hpds', uuid: authUuid });
  });

  it('returns hpdsAuth by default', () => {
    expect(getCountResource()).toEqual({ name: 'hpds', uuid: authUuid });
  });

  it('returns hpdsOpenV3 when isOpenAccess is true', () => {
    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: openV3Uuid });
  });

  it('returns hpdsAuth for explore without login', () => {
    mockFeatures.explorer.open = true;
    mockFeatures.login.open = true;

    expect(getCountResource(true)).toEqual({ name: 'hpds', uuid: authUuid });
  });

  it('uses hpdsOpenV3 when only explorer.open is true', () => {
    mockFeatures.explorer.open = true;

    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: openV3Uuid });
  });

  it('uses hpdsOpenV3 when only login.open is true', () => {
    mockFeatures.login.open = true;

    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: openV3Uuid });
  });

  it('returns a blank hpdsOpenV3 when open access is enabled without a configured resource', () => {
    resources.update((resourceMap) => ({ ...resourceMap, hpdsOpenV3: '' }));

    expect(getCountResource(true)).toEqual({ name: 'hpdsOpen', uuid: '' });
  });
});
