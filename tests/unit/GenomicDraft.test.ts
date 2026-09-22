// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';

import { createGenomicFilter, createSnpsFilter } from '$lib/models/Filter.svelte';
import { Option } from '$lib/models/GenomeFilter';
import {
  clearGeneFilters,
  generateGenomicFilter,
  selectedConsequence,
  selectedFrequency,
  selectedGenes,
} from '$lib/stores/GeneFilter';
import { draftLoadedFrom, loadDraftForEditing, loadGenomicDrafts } from '$lib/stores/GenomicDraft';
import { genomicFilterMethod } from '$lib/state/genomicFilterMethod.svelte';
import {
  clearSnpFilters,
  generateSNPFilter,
  populateFromSNPFilter,
  saveSNP,
  selectedSNPs,
} from '$lib/stores/SNPFilter';

// The drafts the Genotypes tab edits, and their one hard rule: a draft loaded from an applied
// filter shares nothing with it. The filters are the cohort, and the only legitimate way to
// change one is a store write that recomputes its uuid - which is a hash of its contents, and
// which its description, the participant count, the sessionStorage copy and the tab's own
// "already loaded from" marker all trust to describe it.

const variant = { search: 'chr17,35269878,GT,A', constraint: '0/1' };
const geneFilter = () =>
  createGenomicFilter({
    Gene_with_variant: ['IL33'],
    Variant_frequency_as_text: ['Rare'],
    Variant_consequence_calculated: ['stop_lost'],
  });

describe('the genomic drafts', () => {
  beforeEach(() => {
    clearGeneFilters();
    clearSnpFilters();
    genomicFilterMethod.current = Option.None;
    draftLoadedFrom.set({ gene: null, snp: null });
  });

  describe('a draft loaded from an applied filter', () => {
    it('does not carry a variant edit back into the filter it came from', () => {
      const applied = createSnpsFilter([{ ...variant }]);
      const uuid = applied.uuid;
      const description = applied.description;

      populateFromSNPFilter(applied);
      // What the variant panel's own edit-and-save does to the draft. It replaces an existing
      // variant, which is the case that used to write through to the applied filter.
      saveSNP({ search: variant.search, constraint: '1/1' });

      expect(get(selectedSNPs)).toEqual([{ search: variant.search, constraint: '1/1' }]);
      expect(applied.snpValues).toEqual([variant]);
      expect(applied.uuid).toBe(uuid);
      // Still a hash of its own contents, which is what the tab compares drafts against
      expect(applied.uuid).toBe(createSnpsFilter([{ ...variant }]).uuid);
      expect(applied.description).toBe(description);
      expect(applied.description).toContain('Heterozygous');
    });

    it('holds its own arrays, for every value it loads', () => {
      const applied = geneFilter();
      const appliedSnp = createSnpsFilter([{ ...variant }]);

      loadGenomicDrafts({ gene: applied, snp: appliedSnp });

      expect(get(selectedGenes)).not.toBe(applied.Gene_with_variant);
      expect(get(selectedFrequency)).not.toBe(applied.Variant_frequency_as_text);
      expect(get(selectedConsequence)).not.toBe(applied.Variant_consequence_calculated);
      expect(get(selectedSNPs)).not.toBe(appliedSnp.snpValues);
      expect(get(selectedSNPs)[0]).not.toBe(appliedSnp.snpValues[0]);
      // Same values, all the same
      expect(get(selectedGenes)).toEqual(['IL33']);
      expect(get(selectedSNPs)).toEqual([variant]);
    });

    it('is loaded by the chip edit control without disturbing the other method', () => {
      const applied = geneFilter();
      const draftVariant = { search: 'chr1,1234567,A,G', constraint: '1/1' };
      selectedGenes.set(['CHD8']);
      selectedSNPs.set([draftVariant]);

      loadDraftForEditing(applied);

      expect(genomicFilterMethod.current).toBe(Option.Genomic);
      expect(get(selectedGenes)).toEqual(['IL33']);
      expect(get(selectedGenes)).not.toBe(applied.Gene_with_variant);
      expect(get(selectedSNPs)).toEqual([draftVariant]);
    });
  });

  describe('a filter generated from a draft', () => {
    it('holds its own arrays too, so the panels cannot reach into it', () => {
      selectedGenes.set(['IL33']);
      selectedFrequency.set(['Rare']);
      selectedSNPs.set([{ ...variant }]);

      const gene = generateGenomicFilter();
      const variants = generateSNPFilter();

      expect(gene.Gene_with_variant).not.toBe(get(selectedGenes));
      expect(gene.Variant_frequency_as_text).not.toBe(get(selectedFrequency));
      expect(variants.snpValues).not.toBe(get(selectedSNPs));
      expect(variants.snpValues[0]).not.toBe(get(selectedSNPs)[0]);
    });

    // Copying at the boundaries is what keeps the filters safe from the panels; not writing
    // into an array at all is what keeps anything else safe, including whatever holds one
    // next. A store whose subscribers cannot tell that it changed may as well not have.
    it('is not what a variant edit writes into, because nothing writes into an array', () => {
      selectedSNPs.set([{ ...variant }]);
      const before = get(selectedSNPs);

      saveSNP({ search: variant.search, constraint: '1/1' });

      expect(get(selectedSNPs)).not.toBe(before);
      expect(before).toEqual([variant]);
    });

    // The whole point of the marker: it is the filter's uuid, so it can only be trusted while
    // the filter's contents and its uuid agree.
    it('is not altered by the draft that generated it being edited afterwards', () => {
      selectedSNPs.set([{ ...variant }]);
      const applied = generateSNPFilter();
      const uuid = applied.uuid;

      saveSNP({ search: variant.search, constraint: '1/1' });

      expect(applied.snpValues).toEqual([variant]);
      expect(applied.uuid).toBe(uuid);
    });
  });
});
