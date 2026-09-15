// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { get, type Writable } from 'svelte/store';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

vi.mock('$lib/configuration.svelte', () => ({
  config: { branding: { explorePage: { queryErrorText: '' } }, features: {} },
}));
vi.mock('$lib/state/resultCounts.svelte', () => ({
  resultCountsState: {
    loading: false,
    total: 0,
    hasNonZero: true,
    snapshot: { descriptorKey: 'k', count: 0, summary: { total: 0, hasError: false } },
    start: vi.fn(),
    stop: vi.fn(),
  },
}));
vi.mock('$lib/stores/Filter', async () => {
  const { writable: w } = await import('svelte/store');
  return { allFilters: w([]) };
});

// The body and the count are rendered by children with deps of their own, and neither is
// what this spec is about.
vi.mock('$lib/components/explorer/results/Counts.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/explorer/results/ResultsPanel.svelte', () => ({ default: () => {} }));

// A cohort feed this spec drives directly, wrapped so subscribe/unsubscribe can be counted.
type Cohort = { isEmpty: boolean; revision: string };
const panelStore = vi.hoisted(() => ({
  panelOpen: undefined as unknown as Writable<boolean>,
  cohort: undefined as unknown as Writable<Cohort>,
  subscribes: 0,
  unsubscribes: 0,
}));

vi.mock('$lib/stores/ResultsSummaryPanel', async () => {
  const { writable: w } = await import('svelte/store');
  panelStore.panelOpen = w(false);
  panelStore.cohort = w({ isEmpty: true, revision: 'empty' });
  return {
    panelOpen: panelStore.panelOpen,
    cohortContents: {
      subscribe: (run: (value: Cohort) => void) => {
        panelStore.subscribes += 1;
        const unsubscribe = panelStore.cohort.subscribe(run);
        return () => {
          panelStore.unsubscribes += 1;
          unsubscribe();
        };
      },
    },
  };
});

import ResultsSummaryPanel from '$lib/components/explorer/results/ResultsSummaryPanel.svelte';

const setCohort = (revision: string, isEmpty = false) =>
  panelStore.cohort.set({ isEmpty, revision });

describe('ResultsSummaryPanel auto-expand', () => {
  beforeEach(() => {
    cleanup();
    panelStore.panelOpen.set(false);
    panelStore.subscribes = 0;
    panelStore.unsubscribes = 0;
  });

  it('opens when the cohort gains something', async () => {
    render(ResultsSummaryPanel);
    expect(get(panelStore.panelOpen)).toBe(false);

    setCohort('one-filter');

    expect(get(panelStore.panelOpen)).toBe(true);
  });

  it('stops listening when it unmounts', async () => {
    render(ResultsSummaryPanel);
    setCohort('a-filter');
    expect(panelStore.subscribes).toBe(1);

    cleanup();
    panelStore.panelOpen.set(false);
    setCohort('another-filter');

    expect(panelStore.unsubscribes).toBe(1);
    expect(get(panelStore.panelOpen)).toBe(false);
  });
});
