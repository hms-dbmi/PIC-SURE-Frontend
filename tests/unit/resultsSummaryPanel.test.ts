import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// No mocks: the module under test is a leaf, and keeping it one is the point of the split.
import { autoOpenForCohort, panelOpen, resetPanel } from '$lib/stores/ResultsSummaryPanel';

/** A cohort holding `items`, combined as `structure`. */
const cohort = (items: string[], structure = 'AND') => autoOpenForCohort(items, structure);

// The module remembers the last cohort across tests on purpose, so every test starts clean.
beforeEach(() => resetPanel());

describe('autoOpenForCohort', () => {
  it('opens for the first cohort it sees', () => {
    cohort(['filter:a']);

    expect(get(panelOpen)).toBe(true);
  });

  it('does not open for an empty cohort', () => {
    cohort([]);

    expect(get(panelOpen)).toBe(false);
  });

  it('opens when the cohort gains an item', () => {
    cohort(['filter:a']);
    panelOpen.set(false);

    cohort(['filter:a', 'filter:b']);

    expect(get(panelOpen)).toBe(true);
  });

  it('opens when a smaller cohort replaces a larger one', () => {
    // A dataset restored over filters the user already had: three go, one arrives, and the
    // one that arrived is the thing they asked to see. Counting would read this as a removal.
    cohort(['filter:a', 'filter:b', 'filter:c']);
    panelOpen.set(false);

    cohort(['filter:d']);

    expect(get(panelOpen)).toBe(true);
  });

  it('opens when the same items are combined differently', () => {
    // What the Advanced Query Builder's Apply looks like: same filters, new operator.
    cohort(['filter:a', 'filter:b'], 'AND');
    panelOpen.set(false);

    cohort(['filter:a', 'filter:b'], 'OR');

    expect(get(panelOpen)).toBe(true);
  });

  it('does not open when an item is removed', () => {
    cohort(['filter:a', 'filter:b']);
    panelOpen.set(false);

    cohort(['filter:a']);

    expect(get(panelOpen)).toBe(false);
  });

  it('does not open when a removal also restructures what is left', () => {
    // An Apply that only deletes filters. Pruning changes the grouping, but nothing arrived.
    cohort(['filter:a', 'filter:b', 'filter:c'], 'a-AND-(b-OR-c)');
    panelOpen.set(false);

    cohort(['filter:a', 'filter:b'], 'a-AND-b');

    expect(get(panelOpen)).toBe(false);
  });

  it('opens when a filter is replaced by a second copy of one already there', () => {
    // Nothing dedupes phenotypic filters, so a cohort can hold two with the same content and
    // therefore the same identity. Counting identities into a set loses that: the arriving
    // copy of `a` looks like no gain because `a` is already there, the departing `b` looks
    // like a loss, and the panel stays collapsed over a filter that just arrived - which is
    // the failure this whole mechanism exists to prevent.
    cohort(['filter:a', 'filter:b'], 'a-AND-b');
    panelOpen.set(false);

    cohort(['filter:a', 'filter:a'], 'a-AND-a');

    expect(get(panelOpen)).toBe(true);
  });

  it('does not open when one of two identical filters is removed', () => {
    // The same blind spot from the other side: as sets these are both {a}, so nothing reads
    // as gained or lost, and the differing structure would open the panel on a removal.
    cohort(['filter:a', 'filter:a'], 'a-AND-a');
    panelOpen.set(false);

    cohort(['filter:a'], 'a');

    expect(get(panelOpen)).toBe(false);
  });

  it('does not open when the cohort empties', () => {
    cohort(['filter:a']);
    panelOpen.set(false);

    cohort([]);

    expect(get(panelOpen)).toBe(false);
  });

  it('does not open when nothing changed', () => {
    // Both a second panel instance reading a cohort already accounted for, and a mutator in
    // stores/Filter.ts that wrote the store having changed nothing.
    cohort(['filter:a', 'filter:b'], 'AND');
    panelOpen.set(false);

    cohort(['filter:a', 'filter:b'], 'AND');

    expect(get(panelOpen)).toBe(false);
  });

  it('does not notify an already-open panel a second time', () => {
    // The "nothing jarring when a second filter is added" criterion, and the only place it
    // can be checked: the body sits inside `{#if $panelOpen}`, so a DOM assertion cannot see
    // a collapse-then-open - Svelte flushes both writes together and the node never leaves
    // the document.
    //
    // Two reachable regressions fail this. An auto-open that collapsed before opening would
    // report [true, false, true] - verified by making it do exactly that. And a `panelOpen`
    // that stopped suppressing a write of the value it already holds, which is what a switch
    // to a custom store or to an unconditional `update` would do, would report [true, true,
    // true].
    cohort(['filter:a']);
    const seen: boolean[] = [];
    const unsubscribe = panelOpen.subscribe((open) => seen.push(open));

    cohort(['filter:a', 'filter:b']);
    cohort(['filter:a', 'filter:b', 'filter:c']);
    unsubscribe();

    expect(seen).toEqual([true]);
  });

  it('opens again for a cohort that gained something since the last one it saw', () => {
    // A dataset restore: the panel is destroyed, the stores are filled, a new panel mounts.
    // Only a mounted panel records, so the new one compares against the pre-restore cohort.
    cohort([]);
    panelOpen.set(false);

    cohort(['filter:a', 'variable:b', 'genomic:c']);

    expect(get(panelOpen)).toBe(true);
  });
});

describe('resetPanel', () => {
  it('collapses the panel and forgets the cohort behind it', () => {
    cohort(['filter:a', 'filter:b']);
    expect(get(panelOpen)).toBe(true);

    resetPanel();

    expect(get(panelOpen)).toBe(false);
    // Forgetting matters: the same cohort must now read as new, or a panel mounted after a
    // fresh login would compare against the session that just ended.
    cohort(['filter:a', 'filter:b']);
    expect(get(panelOpen)).toBe(true);
  });
});
