import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import { LogicTree } from '$lib/models/LogicTree.svelte';
import { createFilterGroup, type FilterInterface } from '$lib/models/Filter.svelte';
import { buildDescriptor } from '$lib/services/counts/queryDescriptor.svelte';

describe('buildDescriptor strips Svelte $state proxies (production-shape guard)', () => {
  it('produces a phenotypicClause whose nested arrays survive structuredClone when categoryValues is $state-wrapped', () => {
    const categoryValues = $state(['male']);

    const tree = new LogicTree<FilterInterface>(createFilterGroup);
    const filter = {
      id: '\\nhanes\\sex\\',
      filterType: 'Categorical',
      categoryValues,
    } as unknown as FilterInterface;
    tree.root.children.push(filter);

    const descriptor = buildDescriptor({
      isOpenAccess: false,
      filterTree: tree,
      genomicFilters: [],
    });

    expect(() => structuredClone(descriptor.phenotypicClause)).not.toThrow();
  });

  it('produces genomicFilters that survive structuredClone when Gene_with_variant is $state-wrapped', () => {
    const geneValues = $state(['BRCA1']);
    const genomicFilter = {
      filterType: 'genomic',
      Gene_with_variant: geneValues,
      Variant_consequence_calculated: [],
      Variant_frequency_as_text: [],
    } as never;

    const descriptor = buildDescriptor({
      isOpenAccess: false,
      filterTree: new LogicTree<FilterInterface>(createFilterGroup),
      genomicFilters: [genomicFilter],
    });

    expect(() => structuredClone(descriptor.genomicFilters)).not.toThrow();
  });
});
