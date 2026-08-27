// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));

const mockState = vi.hoisted(() => ({
  ensureLoadedSpy: vi.fn(),
  features: {} as Record<string, unknown>,
}));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    get features() {
      return mockState.features;
    },
    get settings() {
      return {};
    },
    get branding() {
      return {};
    },
  },
  resetConfig: () => {},
}));

vi.mock('$lib/state/resultCounts.svelte', () => ({
  resultCountsState: {
    get total() {
      return 100;
    },
    ensureLoaded: mockState.ensureLoadedSpy,
  },
}));

import Summary from '$lib/components/explorer/export/Summary.svelte';

/** The `getIsOpenAccess` thunk that Summary handed to `ensureLoaded`. */
function capturedIsOpenAccess(): boolean {
  expect(mockState.ensureLoadedSpy).toHaveBeenCalledTimes(1);
  const getIsOpenAccess = mockState.ensureLoadedSpy.mock.calls[0][0] as () => boolean;
  return getIsOpenAccess();
}

describe('export Summary.svelte access selection', () => {
  beforeEach(() => {
    cleanup();
    mockState.ensureLoadedSpy.mockClear();
  });

  it('requests an authorized count when DISCOVER is on and the open explorer is off', async () => {
    mockState.features = { discover: true, explorer: { open: false } };
    render(Summary);
    expect(capturedIsOpenAccess()).toBe(false);
  });

  it('requests an authorized count on an open-explorer deployment', async () => {
    mockState.features = { discover: true, explorer: { open: true } };
    render(Summary);
    expect(capturedIsOpenAccess()).toBe(false);
  });

  it('requests an authorized count when discover is disabled entirely', async () => {
    mockState.features = { discover: false, explorer: { open: false } };
    render(Summary);
    expect(capturedIsOpenAccess()).toBe(false);
  });
});
