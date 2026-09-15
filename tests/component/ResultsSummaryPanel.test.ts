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
// `stores/ResultsSummaryPanel` is deliberately NOT mocked: it is a leaf, so the real
// auto-open policy runs here and this spec covers the wiring end to end.
type Cohort = { size: number; signature: string };
const feed = vi.hoisted(() => ({
  cohort: undefined as unknown as Writable<{ size: number; signature: string }>,
  subscribes: 0,
  unsubscribes: 0,
}));

vi.mock('$lib/stores/Cohort', async () => {
  const { writable: w } = await import('svelte/store');
  feed.cohort = w({ size: 0, signature: 'empty' });
  return {
    cohortContents: {
      subscribe: (run: (value: Cohort) => void) => {
        feed.subscribes += 1;
        const unsubscribe = feed.cohort.subscribe(run);
        return () => {
          feed.unsubscribes += 1;
          unsubscribe();
        };
      },
    },
  };
});

import ResultsSummaryPanel from '$lib/components/explorer/results/ResultsSummaryPanel.svelte';
import { panelOpen, resetPanel } from '$lib/stores/ResultsSummaryPanel';

const EMPTY_COHORT: Cohort = { size: 0, signature: 'empty' };
const setCohort = (cohort: Cohort) => feed.cohort.set(cohort);

describe('ResultsSummaryPanel auto-expand', () => {
  beforeEach(() => {
    cleanup();
    // Both the panel's open state and the cohort it last saw live at module scope, so a test
    // that did not reset them would depend on which tests ran before it.
    resetPanel();
    setCohort(EMPTY_COHORT);
    feed.subscribes = 0;
    feed.unsubscribes = 0;
  });

  it('opens when the cohort gains something', () => {
    render(ResultsSummaryPanel);
    expect(get(panelOpen)).toBe(false);

    setCohort({ size: 1, signature: 'a-filter' });

    expect(get(panelOpen)).toBe(true);
  });

  it('does not open when the cohort shrinks', () => {
    setCohort({ size: 2, signature: 'two-filters' });
    render(ResultsSummaryPanel);
    expect(get(panelOpen)).toBe(true);
    panelOpen.set(false);

    setCohort({ size: 1, signature: 'one-filter' });

    expect(get(panelOpen)).toBe(false);
  });

  it('stops listening when it unmounts', () => {
    render(ResultsSummaryPanel);
    setCohort({ size: 1, signature: 'a-filter' });
    expect(feed.subscribes).toBe(1);

    cleanup();
    panelOpen.set(false);
    setCohort({ size: 2, signature: 'another-filter' });

    expect(feed.unsubscribes).toBe(1);
    expect(get(panelOpen)).toBe(false);
  });

  it('opens on a second mount for a cohort that changed while nothing was mounted', () => {
    // The dataset restore, in miniature: a panel exists, is destroyed, the stores are filled
    // while nothing is watching, and a new panel mounts. Only a mounted panel records what it
    // saw, so the new one compares against the cohort from before the restore.
    render(ResultsSummaryPanel);
    cleanup();
    setCohort({ size: 3, signature: 'restored-from-a-dataset' });
    expect(get(panelOpen)).toBe(false);

    render(ResultsSummaryPanel);

    expect(feed.subscribes).toBe(2);
    expect(get(panelOpen)).toBe(true);
  });

  it('does not open on a second mount for a cohort nothing has changed', () => {
    setCohort({ size: 2, signature: 'two-filters' });
    render(ResultsSummaryPanel);
    panelOpen.set(false);

    cleanup();
    render(ResultsSummaryPanel);

    expect(feed.subscribes).toBe(2);
    expect(get(panelOpen)).toBe(false);
  });
});
