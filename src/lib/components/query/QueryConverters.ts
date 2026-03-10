import {
  QueryV2,
  QueryV3,
  type QueryInterfaceV3,
  type PhenotypicFilterInterface,
  type PhenotypicClause,
  type GenomicFilterInterfacev3,
} from '$lib/models/query/Query';
import { QueryVersion } from '$lib/models/Dataset';
import {
  type Filter,
  type FilterInterface,
  createCategoricalFilter,
  createNumericFilter,
  createGenomicFilter,
  createFilterGroup,
  createRequiredFilter,
  createAnyRecordOfFilter,
} from '$lib/models/Filter';
import type { SearchResult } from '$lib/models/Search';
import { getConceptDetails, getConceptTree, ENSURE_MAX_DEPTH } from '$lib/stores/Dictionary';
import { LogicTree } from '$lib/models/LogicTree.svelte';
import { createGroup } from '$lib/stores/Filter';

const defaultSearchResult = (conceptPath: string, type: string) => {
  const paths: string[] = conceptPath.split('\\').filter(Boolean);
  const name = paths.pop();
  return {
    conceptPath,
    dataset: paths[0],
    name: name,
    display: name,
    studyAcronym: '',
    description: '',
    allowFiltering: false,
    type,
  } as SearchResult;
};

export async function pathToSearchResult(
  conceptPath: string,
  type: SearchResult['type'] = 'Categorical',
): Promise<SearchResult> {
  const dataset = conceptPath.split('\\').filter(Boolean)[0] || conceptPath;

  const raw = await getConceptDetails(conceptPath, dataset);
  return {
    ...defaultSearchResult(conceptPath, type),
    ...raw,
  };
}

// -------------------------------- V2 Query -------------------------------- //

export async function loadV2Filters(
  query: QueryV2,
  errors: string[],
): Promise<LogicTree<FilterInterface>> {
  const tree = new LogicTree<FilterInterface>(createGroup);

  for (const [path, values] of Object.entries(query.categoryFilters as Record<string, string[]>)) {
    let result: SearchResult;
    try {
      result = await pathToSearchResult(path);
    } catch (err) {
      console.error(`Failed to restore filter for path: ${path}`, err);
      result = defaultSearchResult(path, 'Categorical');
      errors.push(path);
    }
    tree.add(createCategoricalFilter(result, values));
  }

  for (const [path, range] of Object.entries(
    query.numericFilters as Record<string, { min?: string; max?: string }>,
  )) {
    let result: SearchResult;
    try {
      result = await pathToSearchResult(path, 'Continuous');
    } catch (err) {
      console.error(`Failed to restore filter for path: ${path}`, err);
      result = defaultSearchResult(path, 'Continuous');
      errors.push(path);
    }
    tree.add(createNumericFilter(result, range.min, range.max));
  }

  return tree;
}

export function loadV2GenomicFilters(query: QueryV2): Filter[] {
  const category = query.variantInfoFilters?.[0]?.categoryVariantInfoFilters;
  if (category && Object.values(category).some((cat) => cat?.length)) {
    return [
      createGenomicFilter({
        Gene_with_variant: category.Gene_with_variant,
        Variant_consequence_calculated: category.Variant_consequence_calculated,
        Variant_frequency_as_text: category.Variant_frequency_as_text,
      }),
    ];
  }
  return [];
}

export function loadV2Fields(query: QueryV2): string[] {
  return [
    ...(query?.fields || []),
    ...(query?.requiredFields || []),
    ...(query?.anyRecordOf || []),
    ...(query?.anyRecordOfMulti?.flat() || []),
    ...(query?.crossCountFields || []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
}

// -------------------------------- V3 Query -------------------------------- //

async function phenotypicFilterToFilter(
  pf: PhenotypicFilterInterface,
  errors: string[],
): Promise<Filter> {
  let searchResult: SearchResult;

  const type =
    pf.min !== undefined || pf.max !== undefined
      ? 'Continuous'
      : pf.phenotypicFilterType === 'ANY_RECORD_OF'
        ? 'AnyRecordOf'
        : 'Categorical';

  try {
    searchResult = await pathToSearchResult(pf.conceptPath, type);
  } catch (err) {
    console.error(`Failed to restore phenotypic filter: ${pf.conceptPath}`, err);
    searchResult = defaultSearchResult(pf.conceptPath, type);
    errors.push(pf.conceptPath);
  }

  if (pf.phenotypicFilterType === 'ANY_RECORD_OF') {
    let treeResult: SearchResult = { ...searchResult, children: [searchResult] };
    // Re-fetch the full concept tree to recover all descendant concept paths.
    // pathToSearchResult only returns concept details (no children), so using
    // it here would produce a filter with only the root concept path instead of
    // all the paths the user originally selected.
    try {
      treeResult = await getConceptTree(searchResult.dataset, ENSURE_MAX_DEPTH, pf.conceptPath);
    } catch (err) {
      console.error(`Failed to restore AnyRecordOf filter tree: ${pf.conceptPath}`, err);
      errors.push(pf.conceptPath);
    }
    return createAnyRecordOfFilter(searchResult, treeResult);
  }
  if (pf.phenotypicFilterType === 'REQUIRED') {
    return createRequiredFilter(searchResult);
  }
  if (pf.min !== undefined || pf.max !== undefined) {
    return createNumericFilter(searchResult, pf.min?.toString(), pf.max?.toString());
  }
  return createCategoricalFilter(searchResult, pf.values);
}

async function clauseToFilterNode(clause: PhenotypicClause, errors: string[]): Promise<Filter> {
  if (clause.type === 'PhenotypicSubquery') {
    const children = await Promise.all(
      clause.phenotypicClauses.map((clause) => clauseToFilterNode(clause, errors)),
    );
    return createFilterGroup(
      children.filter((child) => child !== null),
      clause.operator,
    );
  }
  if (clause.type === 'PhenotypicFilter') {
    return phenotypicFilterToFilter(clause, errors);
  }
  return Promise.reject('invalid clause type ' + JSON.stringify(clause));
}

export async function queryToFilterTree(
  query: QueryInterfaceV3,
  errors: string[],
): Promise<LogicTree<FilterInterface>> {
  const tree = new LogicTree<FilterInterface>(createGroup);

  if (!query.phenotypicClause) return tree;

  const clause = query.phenotypicClause;
  if (clause.type === 'PhenotypicFilter') {
    tree.add(await phenotypicFilterToFilter(clause, errors));
  } else {
    const nodes = await Promise.all(
      clause.phenotypicClauses.map((clause) => clauseToFilterNode(clause, errors)),
    );
    tree.root.children = nodes;
    tree.root.operator = clause.operator;
  }
  return tree;
}

export function genomicV3ToFilter(gfs: GenomicFilterInterfacev3[]): Filter {
  const geneFilter: {
    Gene_with_variant?: string[];
    Variant_consequence_calculated?: string[];
    Variant_frequency_as_text?: string[];
    min?: string;
    max?: string;
  } = {};

  gfs.forEach(({ key, values, min, max }) => {
    if (values) {
      if (key === 'Gene_with_variant') geneFilter.Gene_with_variant = values;
      else if (key === 'Variant_consequence_calculated')
        geneFilter.Variant_consequence_calculated = values;
      else if (key === 'Variant_frequency_as_text') geneFilter.Variant_frequency_as_text = values;
    }
    if (min !== undefined) geneFilter.min = min.toString();
    if (max !== undefined) geneFilter.max = max.toString();
  });

  return createGenomicFilter(geneFilter);
}

// ----------------------------- Unified loader ----------------------------- //

export type QuerySummaryData = {
  filterTree: LogicTree<FilterInterface>;
  genomicFilters: Filter[];
  fields: string[];
  errors: string[];
};

export async function loadQuerySummaryData(
  query: QueryV2 | QueryV3,
  version: string,
): Promise<QuerySummaryData> {
  const errors: string[] = [];

  if (version === QueryVersion.V3) {
    const q = query as QueryV3;
    const filterTree = await queryToFilterTree(q, errors);
    return {
      filterTree,
      genomicFilters: q.genomicFilters.length ? [genomicV3ToFilter(q.genomicFilters)] : [],
      fields: q.select,
      errors,
    };
  }

  const q = query as QueryV2;
  const filterTree = await loadV2Filters(q, errors);
  return {
    filterTree,
    genomicFilters: loadV2GenomicFilters(q),
    fields: loadV2Fields(q),
    errors,
  };
}
