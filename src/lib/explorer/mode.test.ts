import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState = vi.hoisted(() => ({
  mode: undefined as 'explorer' | 'discover' | undefined,
  loggedIn: true,
  features: { explorer: { open: false }, login: { open: false } },
}));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({
  page: {
    get data() {
      return mockState.mode ? { mode: mockState.mode } : {};
    },
  },
}));
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: {
    get isLoggedIn() {
      return mockState.loggedIn;
    },
  },
}));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: { features: mockState.features } }));

import { isOpenAccess, routeMode, useOpenAccess } from '#lib/explorer/mode.ts';

beforeEach(() => {
  mockState.mode = undefined;
  mockState.loggedIn = true;
  mockState.features.explorer.open = false;
  mockState.features.login.open = false;
});

describe('isOpenAccess', () => {
  it('is authorized for a signed-in user in explorer', () => {
    mockState.mode = 'explorer';
    expect(isOpenAccess()).toBe(false);
    expect(useOpenAccess()).toBe(false);
  });

  it('is authorized for a signed-in user outside both explore trees', () => {
    expect(isOpenAccess()).toBe(false);
  });

  it('is open in discover, even for a signed-in user', () => {
    mockState.mode = 'discover';
    expect(isOpenAccess()).toBe(true);
    expect(useOpenAccess()).toBe(true);
  });

  it('is open for a signed-out visitor in explorer', () => {
    mockState.mode = 'explorer';
    mockState.loggedIn = false;
    expect(isOpenAccess()).toBe(true);
  });
});

describe('useOpenAccess', () => {
  it('uses the authorized endpoint when explore-without-login serves anonymous traffic', () => {
    mockState.mode = 'discover';
    mockState.features.explorer.open = true;
    mockState.features.login.open = true;
    expect(useOpenAccess()).toBe(false);
  });

  it('takes an explicit mode over the page', () => {
    mockState.mode = 'discover';
    expect(useOpenAccess(false)).toBe(false);
  });
});

describe('routeMode', () => {
  it.each([
    ['/(picsure)/(public)/explorer', 'explorer'],
    ['/(picsure)/(public)/explorer/export', 'explorer'],
    ['/(picsure)/(public)/discover', 'discover'],
    ['/(picsure)/(public)/discover/distributions', 'discover'],
    ['/(picsure)/(public)/api', undefined],
    [null, undefined],
  ] as const)('maps %s to %s', (routeId, mode) => {
    expect(routeMode(routeId)).toBe(mode);
  });
});
