import {
  QueryV2,
  QueryV3,
  type QueryInterfaceV3,
  type PhenotypicFilterInterface,
  type PhenotypicClause,
  type GenomicFilterInterfacev3,
  Operator,
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
import { mapSearchResultAsExport } from '$lib/stores/Export';
import type { ExportInterface } from '$lib/models/Export';

const defaultSearchResult = (conceptPath: string, type: string = 'Categorical') => {
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

export function queryV2ToV3(query: QueryV2): QueryV3 {
  const clauses: PhenotypicFilterInterface[] = [];

  for (const [conceptPath, values] of Object.entries(
    query.categoryFilters as Record<string, string[]>,
  )) {
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'FILTER',
      conceptPath,
      values,
      not: false,
    });
  }

  for (const [conceptPath, range] of Object.entries(
    query.numericFilters as Record<string, { min?: number; max?: number }>,
  )) {
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'FILTER',
      conceptPath,
      min: range.min !== undefined ? Number(range.min) : undefined,
      max: range.max !== undefined ? Number(range.max) : undefined,
      not: false,
    });
  }

  for (const conceptPath of query.requiredFields ?? []) {
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'REQUIRED',
      conceptPath,
      not: false,
    });
  }

  for (const conceptPath of [
    ...(query.anyRecordOf ?? []),
    ...(query.anyRecordOfMulti?.flat() ?? []),
  ]) {
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'ANY_RECORD_OF',
      conceptPath,
      not: false,
    });
  }

  const category = query.variantInfoFilters?.[0]?.categoryVariantInfoFilters;
  const genomicFilters: GenomicFilterInterfacev3[] = [];
  if (category) {
    if (category.Gene_with_variant?.length)
      genomicFilters.push({ key: 'Gene_with_variant', values: category.Gene_with_variant });
    if (category.Variant_consequence_calculated?.length)
      genomicFilters.push({
        key: 'Variant_consequence_calculated',
        values: category.Variant_consequence_calculated,
      });
    if (category.Variant_frequency_as_text?.length)
      genomicFilters.push({
        key: 'Variant_frequency_as_text',
        values: category.Variant_frequency_as_text,
      });
  }

  let phenotypicClause: PhenotypicClause | null = null;
  if (clauses.length === 1) {
    phenotypicClause = clauses[0];
  } else if (clauses.length > 1) {
    phenotypicClause = {
      type: 'PhenotypicSubquery',
      phenotypicClauses: clauses,
      operator: Operator.AND,
      not: false,
    };
  }

  const select = [...new Set([...(query.fields ?? []), ...(query.crossCountFields ?? [])])];

  return new QueryV3({
    select,
    authorizationFilters: [],
    phenotypicClause,
    genomicFilters,
    expectedResultType: Array.isArray(query.expectedResultType)
      ? query.expectedResultType[0]
      : query.expectedResultType,
    picsureId: null,
    id: null,
  });
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

function getExports(query: QueryV3, errors: string[]): Promise<ExportInterface[]> {
  return Promise.all(
    query.select.map(async (conceptPath) => {
      let searchResult: SearchResult;
      try {
        searchResult = await pathToSearchResult(conceptPath);
      } catch (err) {
        console.error(`Failed to retrieve results for: ${conceptPath}`, err);
        searchResult = defaultSearchResult(conceptPath);
        errors.push(conceptPath);
      }

      return mapSearchResultAsExport(searchResult);
    }),
  );
}

export type QuerySummaryData = {
  filterTree: LogicTree<FilterInterface>;
  genomicFilters: Filter[];
  exports: ExportInterface[];
  errors: string[];
};

export async function loadQuerySummaryData(
  query: QueryV2 | QueryV3,
  version: string,
): Promise<QuerySummaryData> {
  const q: QueryV3 =
    version === QueryVersion.V3 ? (query as QueryV3) : queryV2ToV3(query as QueryV2);

  const errors: string[] = [];
  const filterTree = await queryToFilterTree(q, errors);
  const genomicFilters = q.genomicFilters.length ? [genomicV3ToFilter(q.genomicFilters)] : [];
  const exports = await getExports(q, errors);

  return {
    filterTree,
    genomicFilters,
    exports,
    errors,
  };
}
