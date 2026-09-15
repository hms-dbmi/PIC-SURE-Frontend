import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// No mocks: the module under test is a leaf, and keeping it one is the point of the split.
import { autoOpenForCohort, panelOpen, resetPanel } from '$lib/stores/ResultsSummaryPanel';

/** A cohort of `size`, whose query reads as `signature`. */
const cohort = (size: number, signature: string) => autoOpenForCohort(size, signature);

// The module remembers the last cohort across tests on purpose, so every test starts clean.
beforeEach(() => resetPanel());

describe('autoOpenForCohort', () => {
  it('opens for the first cohort it sees', () => {
    cohort(1, 'one-filter');

    expect(get(panelOpen)).toBe(true);
  });

  it('does not open for an empty cohort', () => {
    cohort(0, 'nothing');

    expect(get(panelOpen)).toBe(false);
  });

  it('opens when the cohort grows', () => {
    cohort(1, 'one-filter');
    panelOpen.set(false);

    cohort(2, 'two-filters');

    expect(get(panelOpen)).toBe(true);
  });

  it('opens when the query is rewritten at the same size', () => {
    // What the Advanced Query Builder's Apply looks like: same filters, different operators.
    cohort(2, 'a-AND-b');
    panelOpen.set(false);

    cohort(2, 'a-OR-b');

    expect(get(panelOpen)).toBe(true);
  });

  it('does not open when the cohort shrinks', () => {
    cohort(2, 'a-AND-b');
    panelOpen.set(false);

    cohort(1, 'just-a');

    expect(get(panelOpen)).toBe(false);
  });

  it('does not open when the cohort empties', () => {
    cohort(1, 'one-filter');
    panelOpen.set(false);

    cohort(0, 'nothing');

    expect(get(panelOpen)).toBe(false);
  });

  it('does not open when the query has not changed', () => {
    // Both a second panel instance reading a cohort already accounted for, and a mutator in
    // stores/Filter.ts that wrote the store having changed nothing.
    cohort(2, 'a-AND-b');
    panelOpen.set(false);

    cohort(2, 'a-AND-b');

    expect(get(panelOpen)).toBe(false);
  });

  it('does not re-notify an already-open panel', () => {
    // The "nothing jarring on the second filter" criterion, at its source: a subscriber that
    // fired again would re-run every consumer of $panelOpen, re-creating the body.
    cohort(1, 'one-filter');
    const seen: boolean[] = [];
    const unsubscribe = panelOpen.subscribe((open) => seen.push(open));

    cohort(2, 'two-filters');
    cohort(3, 'three-filters');
    unsubscribe();

    expect(seen).toEqual([true]);
  });

  it('opens again for a cohort that grew since the last one it saw', () => {
    // A dataset restore: the panel is destroyed, the stores are filled, a new panel mounts.
    // Only a mounted panel records, so the new one compares against the pre-restore cohort.
    cohort(0, 'nothing');
    panelOpen.set(false);

    cohort(3, 'restored');

    expect(get(panelOpen)).toBe(true);
  });
});

describe('resetPanel', () => {
  it('collapses the panel and forgets the cohort behind it', () => {
    cohort(2, 'previous-session');
    expect(get(panelOpen)).toBe(true);

    resetPanel();

    expect(get(panelOpen)).toBe(false);
    // Forgetting matters: the same cohort must now read as new, or a panel mounted after a
    // fresh login would compare against the session that just ended.
    cohort(2, 'previous-session');
    expect(get(panelOpen)).toBe(true);
  });
});
