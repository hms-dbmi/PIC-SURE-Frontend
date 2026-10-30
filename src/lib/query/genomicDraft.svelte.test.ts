import { describe, it, expect } from 'vitest';

import { GenomicDraft } from '#lib/query/genomicDraft.svelte.ts';
import { createGenomicFilter } from '#lib/query/filter.svelte.ts';
import variantData from '#lib/query/variant-data.json';

describe('GenomicDraft', () => {
  it('builds a gene filter without the severity group keys', () => {
    const draft = new GenomicDraft();
    draft.genes = ['BRCA1'];
    draft.addConsequence(variantData[0].key);
    draft.addConsequence('missense_variant');

    const filter = draft.toGeneFilter();

    expect(filter.Gene_with_variant).toEqual(['BRCA1']);
    expect(filter.Variant_consequence_calculated).toEqual(['missense_variant']);
    expect(filter.Variant_frequency_as_text).toBeUndefined();
    expect(() => structuredClone(filter)).not.toThrow();
  });

  it('edits a copy of the filter it loads', () => {
    const saved = createGenomicFilter({ Gene_with_variant: ['BRCA1'] });
    const draft = new GenomicDraft();

    draft.loadGeneFilter(saved);
    draft.genes.push('TP53');

    expect(saved.Gene_with_variant).toEqual(['BRCA1']);
    expect(draft.toGeneFilter().Gene_with_variant).toEqual(['BRCA1', 'TP53']);
  });

  it('replaces a SNP with the same search and deletes by search', () => {
    const draft = new GenomicDraft();
    draft.saveSnp({ search: 'chr1,1,A,G', constraint: '0/1' });
    draft.saveSnp({ search: 'chr1,1,A,G', constraint: '1/1' });
    draft.saveSnp({ search: 'chr2,2,C,T', constraint: '0/1' });

    expect(draft.snps.map((snp) => snp.constraint)).toEqual(['1/1', '0/1']);

    draft.deleteSnp({ search: 'chr1,1,A,G', constraint: '1/1' });
    expect(draft.toSnpFilter().snpValues).toEqual([{ search: 'chr2,2,C,T', constraint: '0/1' }]);
  });
});
