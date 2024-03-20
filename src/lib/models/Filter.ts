import type { SearchResult } from './Search';
import { v4 as uuid } from 'uuid';

type FilterType = 'categorical' | 'numeric' | 'required' | 'datatable' | 'genomic' | 'auto';
type DisplayType =
  | 'any'
  | 'anyRecordOf'
  | 'restrict'
  | 'genomic'
  | 'lessThan'
  | 'greaterThan'
  | 'between';

export interface FilterInterface {
  uuid: string;
  filterType: FilterType;
  displayType: DisplayType;
  searchResult?: SearchResult;
  variableName?: string;
  description?: string;
  isHarmonized?: boolean;
  topmed?: boolean;
  sites?: string[];
}

export interface CategoricalFilterInterface extends FilterInterface {
  filterType: 'categorical';
  values: string[];
}

export interface NumericFilterInterface extends FilterInterface {
  filterType: 'numeric';
  min: number | undefined;
  max: number | undefined;
}

export interface GenomicFilterInterface extends FilterInterface {
  filterType: 'genomic';
  //todo make types?
  Gene_with_variant?: string[];
  Variant_consequence_calculated?: string[];
  Variant_frequency_as_text?: string[];
}

export function createCategoocialFilter(searchResult: SearchResult, values?: string[]) {
  let filter: Filter = {
    uuid: uuid(),
    filterType: 'categorical',
    displayType: values && values?.length > 0 ? 'restrict' : 'anyRecordOf',
    searchResult: searchResult,
    values: values || [],
    variableName: searchResult.name,
    description: searchResult.description,
  };
  return filter;
}

export function createNumericFilter(searchResult: SearchResult, min?: number, max?: number) {
  let filter: Filter = {
    uuid: uuid(),
    filterType: 'numeric',
    displayType:
      min !== undefined && max !== undefined
        ? 'between'
        : min !== undefined
          ? 'greaterThan'
          : max !== undefined
            ? 'lessThan'
            : 'any',
    searchResult: searchResult,
    min: min !== undefined ? min : undefined,
    max: max !== undefined ? max : undefined,
    variableName: searchResult.name,
    description: searchResult.description,
  };
  return filter;
}

export function createGenomicFilter(
  Gene_with_variant?: string[],
  Variant_consequence_calculated?: string[],
  Variant_frequency_as_text?: string[],
) {
  let filter: Filter = {
    uuid: uuid(),
    filterType: 'genomic',
    displayType: 'genomic',
    variableName: 'Genomic Filter',
    description: 'Filter for genomic data',
    Gene_with_variant: Gene_with_variant,
    Variant_consequence_calculated: Variant_consequence_calculated,
    Variant_frequency_as_text: Variant_frequency_as_text,
  };
  return filter;
}

export type Filter = CategoricalFilterInterface | NumericFilterInterface | GenomicFilterInterface;
