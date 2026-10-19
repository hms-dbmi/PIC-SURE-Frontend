import { runCount } from '#lib/api/picsure/query.ts';
import { Genotype, type SNP } from '#lib/query/genomic.ts';
import {
  createGenomicFilter,
  createSnpsFilter,
  type GenomicFilterInterface,
  type SnpFilterInterface,
} from '#lib/query/filter.svelte.ts';
import type { GenomicClause } from '#lib/query/query.ts';
import { buildRequest } from '#lib/query/build.ts';
import variantData from '#lib/explorer/genomic/variant-data.json';

const severityKeys = variantData.map((sev) => sev.key);

/** The genomic filter page's unsaved selections, before they become a filter. */
export class GenomicDraft {
  genes: string[] = $state([]);
  frequency: string[] = $state([]);
  /** Selected consequences, including the severity group keys that select them. */
  consequence: string[] = $state([]);
  snps: SNP[] = $state([]);

  #consequences = $derived(this.consequence.filter((cons) => !severityKeys.includes(cons)));

  /** The selected consequences without the severity group keys. */
  get consequences(): string[] {
    return this.#consequences;
  }

  toGeneFilter(): GenomicFilterInterface {
    const genes = $state.snapshot(this.genes);
    const frequency = $state.snapshot(this.frequency);
    const consequences = $state.snapshot(this.consequences);
    return createGenomicFilter({
      Gene_with_variant: genes.length > 0 ? genes : undefined,
      Variant_consequence_calculated: consequences.length > 0 ? consequences : undefined,
      Variant_frequency_as_text: frequency.length > 0 ? frequency : undefined,
    });
  }

  toSnpFilter(): SnpFilterInterface {
    return createSnpsFilter($state.snapshot(this.snps));
  }

  loadGeneFilter(filter: GenomicFilterInterface) {
    this.genes = [...(filter?.Gene_with_variant || [])];
    this.consequence = [...(filter?.Variant_consequence_calculated || [])];
    this.frequency = [...(filter?.Variant_frequency_as_text || [])];
  }

  loadSnpFilter(filter: SnpFilterInterface) {
    this.snps = [...filter.snpValues];
  }

  clearGenes() {
    this.genes = [];
    this.frequency = [];
    this.consequence = [];
  }

  clearSnps() {
    this.snps = [];
  }

  addConsequence(consequence: string) {
    this.consequence.push(consequence);
  }

  removeConsequence(consequence: string) {
    this.consequence = this.consequence.filter((cons) => cons !== consequence);
  }

  saveSnp(newSNP: SNP) {
    const index = this.snps.findIndex((snp) => snp.search === newSNP.search);
    if (index >= 0) this.snps[index] = newSNP;
    else this.snps.push(newSNP);
  }

  deleteSnp(trash: SNP) {
    this.snps = this.snps.filter((snp) => snp.search !== trash.search);
  }
}

export const genomicDraft = new GenomicDraft();

/** How many participants carry the variant, for checking a SNP before it's added. */
export async function getSNPCounts(check: SNP): Promise<{ count: number; errors: number }> {
  const clause: GenomicClause = {
    key: check.search,
    values: [Genotype.Heterozygous, Genotype.Homozygous],
  };
  const request = buildRequest(null);
  request.query.genomicFilters.push(clause);
  return runCount(request)
    .then((count) => ({ count: count || 0, errors: 0 }))
    .catch(() => ({ count: 0, errors: 1 }));
}
