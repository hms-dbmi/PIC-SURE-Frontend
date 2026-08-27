import {
  QueryV3,
  type QueryInterfaceV3,
  type PhenotypicFilterInterface,
  type PhenotypicClause,
  type GenomicFilterInterfacev3,
} from '$lib/models/query/Query';
import {
  type Filter,
  type FilterInterface,
  createCategoricalFilter,
  createNumericFilter,
  createGenomicFilter,
  createFilterGroup,
  createRequiredFilter,
  createAnyRecordOfFilter,
} from '$lib/models/Filter.svelte';
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

export interface QueryEstimate {
  filters: number;
  exports: number;
}

// -------------------------------- V3 Query -------------------------------- //

export function estimateV3(query: QueryV3): QueryEstimate {
  return {
    filters: query.leaves.length + (query.genomicFilters.length > 1 ? 1 : 0),
    exports: query.select.length,
  };
}

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
    if (min !== undefined && min !== null) geneFilter.min = min.toString();
    if (max !== undefined && max !== null) geneFilter.max = max.toString();
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
  filterTree: Promise<LogicTree<FilterInterface>>;
  genomicFilters: Promise<Filter[]>;
  exports: Promise<ExportInterface[]>;
  errors: Promise<string[]>;
};

export function loadQuerySummaryData(query: QueryV3): QuerySummaryData {
  const errorsList: string[] = [];
  const filterTree = queryToFilterTree(query, errorsList);
  const genomicFilters = Promise.resolve(
    query.genomicFilters.length ? [genomicV3ToFilter(query.genomicFilters)] : [],
  );
  const exports = getExports(query, errorsList);
  const errors = Promise.all([filterTree, exports]).then(() => errorsList);

  return {
    filterTree,
    genomicFilters,
    exports,
    errors,
  };
}
