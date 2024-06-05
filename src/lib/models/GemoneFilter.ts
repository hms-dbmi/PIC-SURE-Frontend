import type { Indexable } from '$lib/types';

export enum Option {
  None,
  Genomic,
  SNP,
}

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
  '0/0': 'Excluded',
};
