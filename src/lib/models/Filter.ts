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
  id: string;
  filterType: FilterType;
  displayType: DisplayType;
  searchResult?: SearchResult;
  variableName: string;
  description?: string;
  isHarmonized?: boolean;
  topmed?: boolean;
  sites?: string[];
}

export interface CategoricalFilterInterface extends FilterInterface {
  filterType: 'categorical' | 'required';
  categoryValues: string[];
}

export interface NumericFilterInterface extends FilterInterface {
  filterType: 'numeric';
  min?: string | undefined;
  max?: string | undefined;
}

export interface GenomicFilterInterface extends FilterInterface {
  filterType: 'genomic';
  //todo make types?
  Gene_with_variant?: string[];
  Variant_consequence_calculated?: string[];
  Variant_frequency_as_text?: string[];
}

export function createCategoricalFilter(searchResult: SearchResult, values?: string[]) {
  const filter: Filter = {
    uuid: uuid(),
    id: searchResult.id,
    filterType: 'categorical',
    displayType: values && values?.length > 0 ? 'restrict' : 'anyRecordOf',
    searchResult: searchResult,
    categoryValues: values || [],
    variableName: searchResult.name,
    description: searchResult.description,
  };
  return filter;
}

export function createRequiredFilter(searchResult: SearchResult) {
  const filter: Filter = {
    uuid: uuid(),
    id: searchResult.id,
    filterType: 'categorical',
    displayType: 'any',
    searchResult: searchResult,
    variableName: searchResult.name,
    description: searchResult.description,
    categoryValues: [],
  };
  return filter;
}

export function createAnyRecordOfFilter(searchResult: SearchResult, values?: string[]) {
  const filter: Filter = {
    uuid: uuid(),
    id: searchResult.id,
    filterType: 'categorical',
    displayType: 'anyRecordOf',
    searchResult: searchResult,
    categoryValues: values || [],
    variableName: searchResult.name,
    description: searchResult.description,
  };
  return filter;
}

export function createNumericFilter(searchResult: SearchResult, min?: string, max?: string) {
  const filter: Filter = {
    uuid: uuid(),
    id: searchResult.id,
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
  const filter: Filter = {
    uuid: uuid(),
    id: 'genomic',
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
