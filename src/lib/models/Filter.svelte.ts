import { genericUUID } from '$lib/utilities/UUID';
import type { SearchResult } from '$lib/models/Search';
import { GenotypeMap, type SNP } from '$lib/models/GenomeFilter';
import { type OperatorType, Operator } from '$lib/models/query/Query';
import { AnyRecordOfFilterError } from '$lib/types';

import type { TreeNode, TreeGroup } from '$lib/models/Tree.svelte';

export type FilterType =
  | 'Categorical'
  | 'AnyRecordOf'
  | 'numeric'
  | 'required'
  | 'datatable'
  | 'genomic'
  | 'snp'
  | 'auto'
  | 'FilterGroup';
type DisplayType =
  | 'any'
  | 'anyRecordOf'
  | 'restrict'
  | 'lessThan'
  | 'greaterThan'
  | 'between'
  | 'group';

export interface FilterInterface extends TreeNode<FilterInterface> {
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
  allowFiltering: boolean;
  dataset: string;
}

export interface CategoricalFilterInterface extends FilterInterface {
  filterType: 'Categorical' | 'required';
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
  min?: string;
  max?: string;
}

export interface SnpFilterInterface extends FilterInterface {
  filterType: 'snp';
  snpValues: SNP[];
}

export interface AnyRecordOfFilterInterface extends FilterInterface {
  filterType: 'AnyRecordOf';
  concepts: string[];
}

export interface FilterGroupInterface extends FilterInterface, TreeGroup<FilterInterface> {
  filterType: 'FilterGroup';
  displayType: 'group';
  variableName: 'none';
  dataset: '';
  allowFiltering: true;
  children: FilterInterface[];
  operator: OperatorType;
  setOperator: (operator: OperatorType) => void;
}

export type Filter =
  | CategoricalFilterInterface
  | NumericFilterInterface
  | GenomicFilterInterface
  | SnpFilterInterface
  | AnyRecordOfFilterInterface
  | FilterGroupInterface;

export function createFilterGroup(
  children: FilterInterface[] = [],
  operator: OperatorType = Operator.AND,
): FilterGroupInterface {
  const id = genericUUID();
  const newGroup = {
    filterType: 'FilterGroup' as const,
    displayType: 'group' as const,
    variableName: 'none' as const,
    dataset: '',
    allowFiltering: true,
    uuid: id,
    children,
    operator,
    parent: undefined as FilterGroupInterface | undefined,
    get id() {
      return `filter-group-${this.uuid}`;
    },
    setOperator(operator: OperatorType) {
      this.operator = operator;
    },
  };

  const stateGroup = $state(newGroup);

  stateGroup.children.forEach((child) => (child.parent = stateGroup));
  return stateGroup as FilterGroupInterface;
}

export function createCategoricalFilter(
  searchResult: SearchResult,
  values?: string[],
): CategoricalFilterInterface {
  const filter: Filter = {
    parent: undefined,
    uuid: genericUUID(),
    id: searchResult.conceptPath,
    filterType: 'Categorical',
    displayType: values && values?.length > 0 ? 'restrict' : 'anyRecordOf',
    searchResult: searchResult,
    categoryValues: values || [],
    variableName: searchResult.display || searchResult.name,
    description: searchResult.description,
    allowFiltering: searchResult.allowFiltering,
    dataset: searchResult.dataset,
  };
  return filter;
}

export function createRequiredFilter(searchResult: SearchResult): CategoricalFilterInterface {
  const filter: Filter = {
    parent: undefined,
    uuid: genericUUID(),
    id: searchResult.conceptPath,
    filterType: 'Categorical',
    displayType: 'any',
    searchResult: searchResult,
    variableName: searchResult.display || searchResult.name,
    description: searchResult.description,
    categoryValues: [],
    allowFiltering: searchResult.allowFiltering,
    dataset: searchResult.dataset,
  };
  return filter;
}

function getAllConceptPaths(results: SearchResult[]): string[] {
  return results.flatMap((result) => [
    result.conceptPath,
    ...(result.children || []).flatMap((child) => getAllConceptPaths([child])),
  ]);
}

export function createAnyRecordOfFilter(
  searchResult: SearchResult,
  treeResult: SearchResult,
): AnyRecordOfFilterInterface {
  const conceptPaths = getAllConceptPaths(treeResult?.children || []);
  if (conceptPaths.length === 0) {
    throw new AnyRecordOfFilterError('No concept paths found');
  } else if (conceptPaths.length > 9500) {
    throw new AnyRecordOfFilterError('Too many concept paths found');
  }
  const filter: AnyRecordOfFilterInterface = {
    parent: undefined,
    uuid: genericUUID(),
    id: searchResult.conceptPath,
    concepts: conceptPaths,
    filterType: 'AnyRecordOf',
    displayType: 'anyRecordOf',
    searchResult: searchResult,
    variableName: searchResult.name || searchResult.display || searchResult.conceptPath,
    description: searchResult.description,
    allowFiltering: searchResult.allowFiltering,
    dataset: searchResult.dataset,
  };
  return filter;
}

export function createNumericFilter(
  searchResult: SearchResult,
  min?: string,
  max?: string,
): NumericFilterInterface {
  const filter: Filter = {
    parent: undefined,
    uuid: genericUUID(),
    id: searchResult.conceptPath,
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
    min: min !== undefined ? min.toLocaleString() : undefined,
    max: max !== undefined ? max.toLocaleString() : undefined,
    variableName: searchResult.display || searchResult.name,
    description: searchResult.description,
    allowFiltering: searchResult.allowFiltering,
    dataset: searchResult.dataset,
  };
  return filter;
}

export function createGenomicFilter(geneFilter: {
  Gene_with_variant?: string[];
  Variant_consequence_calculated?: string[];
  Variant_frequency_as_text?: string[];
  min?: string;
  max?: string;
}): GenomicFilterInterface {
  const orJoin = (key: string, arr: string[] | undefined) =>
    arr && arr.length > 0 ? `${key}: ${arr.join(', ')}` : undefined;
  const descriptionParts = [
    orJoin('Gene with variant', geneFilter.Gene_with_variant),
    orJoin('Variant frequency', geneFilter.Variant_frequency_as_text),
    orJoin('Consequence Group by severity', geneFilter.Variant_consequence_calculated),
  ].filter((x) => x);

  // Add min/max description if present
  if (geneFilter.min !== undefined || geneFilter.max !== undefined) {
    const rangeParts = [];
    if (geneFilter.min !== undefined) rangeParts.push(`min: ${geneFilter.min}`);
    if (geneFilter.max !== undefined) rangeParts.push(`max: ${geneFilter.max}`);
    descriptionParts.push(`Range: ${rangeParts.join(', ')}`);
  }

  const description = descriptionParts.join('; ');

  const filter: Filter = {
    parent: undefined,
    uuid: genericUUID(),
    id: 'genomic',
    filterType: 'genomic',
    displayType: 'any',
    variableName: 'Genomic Filter',
    description,
    Gene_with_variant: geneFilter.Gene_with_variant,
    Variant_consequence_calculated: geneFilter.Variant_consequence_calculated,
    Variant_frequency_as_text: geneFilter.Variant_frequency_as_text,
    min: geneFilter.min,
    max: geneFilter.max,
    allowFiltering: true,
    dataset: '',
  };
  return filter;
}

export function createSnpsFilter(snps: SNP[]): SnpFilterInterface {
  const description = snps
    .map(
      (snp) =>
        `${snp.search}: ${snp.constraint
          .split(',')
          .map((index: string) => GenotypeMap[index])
          .join(', ')}`,
    )
    .join('; ');
  const filter: Filter = {
    parent: undefined,
    uuid: genericUUID(),
    id: 'snp-variant',
    filterType: 'snp',
    displayType: 'any',
    snpValues: snps,
    variableName: 'Variant Filter',
    description,
    allowFiltering: true,
    dataset: '',
  };
  return filter;
}
