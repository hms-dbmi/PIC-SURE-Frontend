import {
  queryLeaves,
  type Query,
  type PhenotypicFilter,
  type PhenotypicClause,
  type GenomicClause,
} from '#lib/query/query.ts';
import {
  type Filter,
  type FilterInterface,
  createCategoricalFilter,
  createNumericFilter,
  createGenomicFilter,
  createSnpsFilter,
  createFilterGroup,
  createRequiredFilter,
  createAnyRecordOfFilter,
} from '#lib/query/filter.svelte.ts';
import {
  GENE_FILTER_KEYS,
  GENOMIC_RANGE_KEY,
  type GeneFilterKey,
  type GeneFilterValues,
  type SNP,
} from '#lib/query/genomic.ts';
import type { SearchResult } from '#lib/explorer/types.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { mapSearchResultAsExport } from '#lib/explorer/export/Export.ts';
import type { ExportInterface } from '#lib/explorer/export/types.ts';

/** The dictionary lookups a restore needs, injected so restoring does no I/O of its own. */
export interface ConceptLookup {
  getConceptDetails(conceptPath: string, dataset: string): Promise<SearchResult>;
  /** The concept with all its descendants. */
  getConceptTree(dataset: string, conceptPath: string): Promise<SearchResult>;
  /** Concept paths to restore without a dictionary lookup (`settings.dataset.bypassConceptLookup`). */
  bypassConceptLookup: readonly string[];
}

const defaultSearchResult = (conceptPath: string, type: string = 'Categorical') => {
  const paths: string[] = conceptPath.split('\\').filter(Boolean);
  const name = paths[paths.length - 1];
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
  lookup: ConceptLookup,
  conceptPath: string,
  type: SearchResult['type'] = 'Categorical',
): Promise<SearchResult> {
  const dataset = conceptPath.split('\\').filter(Boolean)[0] || conceptPath;
  const defaultData = defaultSearchResult(conceptPath, type);

  return lookup.bypassConceptLookup.includes(conceptPath)
    ? defaultData
    : {
        ...defaultData,
        ...(await lookup.getConceptDetails(conceptPath, dataset)),
      };
}

export interface QueryEstimate {
  filters: number;
  exports: number;
}

export function estimateQuery(query: Query): QueryEstimate {
  return {
    filters: queryLeaves(query).length + genomicClausesToFilters(query.genomicFilters).length,
    exports: query.select.length,
  };
}

async function phenotypicFilterToFilter(
  lookup: ConceptLookup,
  pf: PhenotypicFilter,
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
    searchResult = await pathToSearchResult(lookup, pf.conceptPath, type);
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
      treeResult = await lookup.getConceptTree(searchResult.dataset, pf.conceptPath);
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

async function clauseToFilterNode(
  lookup: ConceptLookup,
  clause: PhenotypicClause,
  errors: string[],
): Promise<Filter> {
  if (clause.type === 'PhenotypicSubquery') {
    const children = await Promise.all(
      clause.phenotypicClauses.map((clause) => clauseToFilterNode(lookup, clause, errors)),
    );
    return createFilterGroup(
      children.filter((child) => child !== null),
      clause.operator,
    );
  }
  if (clause.type === 'PhenotypicFilter') {
    return phenotypicFilterToFilter(lookup, clause, errors);
  }
  return Promise.reject('invalid clause type ' + JSON.stringify(clause));
}

export async function queryToFilterTree(
  lookup: ConceptLookup,
  query: Query,
  errors: string[],
): Promise<LogicTree<FilterInterface>> {
  const tree = new LogicTree<FilterInterface>(createFilterGroup);

  if (!query.phenotypicClause) return tree;

  const clause = query.phenotypicClause;
  if (clause.type === 'PhenotypicFilter') {
    tree.add(await phenotypicFilterToFilter(lookup, clause, errors));
  } else {
    const nodes = await Promise.all(
      clause.phenotypicClauses.map((clause) => clauseToFilterNode(lookup, clause, errors)),
    );
    tree.add(...nodes);
    tree.root.operator = clause.operator;
  }
  return tree;
}

const isGeneFilterKey = (key: string): key is GeneFilterKey =>
  (GENE_FILTER_KEYS as readonly string[]).includes(key);

// A SNP clause is keyed by the variant itself (`chr17,35269878,GT,A`), so any other key with
// values is one; the gene keys and the range key make up the gene filter.
const isSnpClause = ({ key, values }: GenomicClause) =>
  !isGeneFilterKey(key) && key !== GENOMIC_RANGE_KEY && values !== undefined;

/** The genomic filters a saved query's clauses came from: a gene filter, a SNP filter, or both. */
export function genomicClausesToFilters(gfs: GenomicClause[]): Filter[] {
  const snps: SNP[] = gfs
    .filter(isSnpClause)
    .map(({ key, values = [] }) => ({ search: key, constraint: values.join(',') }));
  const geneClauses = gfs.filter((clause) => !isSnpClause(clause));
  const filters = [
    ...(geneClauses.length ? [genomicClausesToFilter(geneClauses)] : []),
    ...(snps.length ? [createSnpsFilter(snps)] : []),
  ];
  // Each filter's clauses are saved together, so the first clause says which filter came first.
  return gfs.length && isSnpClause(gfs[0]) ? filters.reverse() : filters;
}

export function genomicClausesToFilter(gfs: GenomicClause[]): Filter {
  const geneFilter: GeneFilterValues & { min?: string; max?: string } = {};

  gfs.forEach(({ key, values, min, max }) => {
    if (values && isGeneFilterKey(key)) geneFilter[key] = values;
    if (min !== undefined && min !== null) geneFilter.min = min.toString();
    if (max !== undefined && max !== null) geneFilter.max = max.toString();
  });

  return createGenomicFilter(geneFilter);
}

// ----------------------------- Unified loader ----------------------------- //

function getExports(
  lookup: ConceptLookup,
  query: Query,
  errors: string[],
): Promise<ExportInterface[]> {
  return Promise.all(
    query.select.map(async (conceptPath) => {
      let searchResult: SearchResult;
      try {
        searchResult = await pathToSearchResult(lookup, conceptPath);
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

export function loadQuerySummaryData(query: Query, lookup: ConceptLookup): QuerySummaryData {
  const errorsList: string[] = [];
  const filterTree = queryToFilterTree(lookup, query, errorsList);
  const genomicFilters = Promise.resolve(genomicClausesToFilters(query.genomicFilters));
  const exports = getExports(lookup, query, errorsList);
  const errors = Promise.all([filterTree, exports]).then(() => errorsList);

  return {
    filterTree,
    genomicFilters,
    exports,
    errors,
  };
}
