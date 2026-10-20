// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { flushSync } from 'svelte';

const mockState = vi.hoisted(() => ({ startSpy: vi.fn(), stopSpy: vi.fn() }));

// Reactive, so the panel sees client-side navigation between the two trees.
const mockPage = $state({
  url: new URL('http://localhost/explorer'),
  data: { mode: 'explorer' } as { mode?: 'explorer' | 'discover' },
});
function navigate(path: string, mode: 'explorer' | 'discover') {
  mockPage.url = new URL(`http://localhost${path}`);
  mockPage.data = { mode };
  flushSync();
}

vi.mock('$app/state', () => ({
  get page() {
    return mockPage;
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => `/${path}` }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: { discover: true, explorer: { allowExport: true, distributionExplorer: true } },
    settings: {},
    branding: { results: {} },
  },
  resetConfig: () => {},
}));
vi.mock('#lib/query/counts/resultCounts.svelte.ts', () => ({
  resultCountsState: {
    start: mockState.startSpy,
    stop: mockState.stopSpy,
    loading: false,
    hasNonZero: false,
    total: 0,
    snapshot: { descriptorKey: '', summary: { hasError: false }, results: [] },
  },
}));

import ResultsPanel from '#lib/explorer/components/results/ResultsPanel.svelte';

/** What the most recent `start()` would ask the count endpoint for: true is the open variant. */
function lastStartIsOpenAccess(): boolean {
  const getIsOpenAccess = mockState.startSpy.mock.lastCall?.[0] as () => boolean;
  return getIsOpenAccess();
}

beforeEach(() => {
  mockState.startSpy.mockClear();
  navigate('/explorer', 'explorer');
});
afterEach(() => cleanup());

describe('ResultsPanel counts', () => {
  it('counts against the authorized endpoint in explorer', () => {
    render(ResultsPanel);
    expect(mockState.startSpy).toHaveBeenCalled();
    expect(lastStartIsOpenAccess()).toBe(false);
  });

  it('counts against the open endpoint in discover', () => {
    navigate('/discover', 'discover');
    render(ResultsPanel);
    expect(lastStartIsOpenAccess()).toBe(true);
  });

  it('restarts with the authorized endpoint when moving from discover to explorer', () => {
    navigate('/discover', 'discover');
    render(ResultsPanel);
    mockState.startSpy.mockClear();

    navigate('/explorer', 'explorer');

    expect(mockState.startSpy).toHaveBeenCalledTimes(1);
    expect(lastStartIsOpenAccess()).toBe(false);
  });

  it('restarts with the open endpoint when moving from explorer to discover', () => {
    render(ResultsPanel);
    mockState.startSpy.mockClear();

    navigate('/discover', 'discover');

    expect(mockState.startSpy).toHaveBeenCalledTimes(1);
    expect(lastStartIsOpenAccess()).toBe(true);
  });
});
