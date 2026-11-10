import type { Indexable } from '#lib/utils/objects.ts';

export enum Option {
  None = 'none',
  Genomic = 'genomic',
  SNP = 'snp',
}

/** Variant-info keys a gene filter can set, in the order requests list them. */
export const GENE_FILTER_KEYS = [
  'Gene_with_variant',
  'Variant_consequence_calculated',
  'Variant_frequency_as_text',
] as const;
export type GeneFilterKey = (typeof GENE_FILTER_KEYS)[number];
export type GeneFilterValues = { [K in GeneFilterKey]?: string[] };

/** The genomic filter key a gene filter's min/max range is sent under. */
export const GENOMIC_RANGE_KEY = 'genomic_range';

export type SNP = { search: string; constraint: string };

export enum Genotype {
  Heterozygous = '0/1',
  Homozygous = '1/1',
  HeterozygousOrHomozygous = '1/1,0/1',
  Neither = '0/0',
}

export const GenotypeMap: Indexable = {
  '0/1': 'Heterozygous',
  '1/1': 'Homozygous',
  '1/1,0/1': 'Heterozygous or Homozygous',
  '0/1,1/1': 'Heterozygous or Homozygous',
  // '0/0': 'Excluded', add back once HPDS accepts it
};
