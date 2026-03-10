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
import { getConceptDetails } from '$lib/stores/Dictionary';
import { LogicTree } from '$lib/models/LogicTree.svelte';
import { createGroup } from '$lib/stores/Filter';

// -------------------------------- V2 Query -------------------------------- //

async function pathToSearchResult(
  path: string,
  type: SearchResult['type'] = 'Categorical',
): Promise<SearchResult> {
  const dataset = path.split('\\').filter(Boolean)[0] || path;
  const raw = await getConceptDetails(path, dataset).catch((err) => {
    console.error(err);
    return {} as SearchResult;
  });
  return {
    conceptPath: path,
    dataset,
    name: raw?.name || '',
    display: raw?.display || '',
    studyAcronym: raw?.studyAcronym || '',
    description: raw?.description || '',
    allowFiltering: raw?.allowFiltering || false,
    type,
  };
}

export async function loadV2Filters(query: QueryV2): Promise<LogicTree<FilterInterface>> {
  const tree = new LogicTree<FilterInterface>(createGroup);
  // const filterList: Filter[] = [];

  for (const [path, values] of Object.entries(query.categoryFilters as Record<string, string[]>)) {
    const result = await pathToSearchResult(path);
    // filterList.push(createCategoricalFilter(result, values));
    tree.add(createCategoricalFilter(result, values));
  }

  for (const [path, range] of Object.entries(
    query.numericFilters as Record<string, { min?: string; max?: string }>,
  )) {
    const result = await pathToSearchResult(path, 'Continuous');
    // filterList.push(createNumericFilter(result, range.min, range.max));
    tree.add(createNumericFilter(result, range.min, range.max));
  }

  // tree.add(...filterList);
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

async function phenotypicFilterToFilter(pf: PhenotypicFilterInterface): Promise<Filter> {
  const dataset = pf.conceptPath.split('\\').filter(Boolean)[0] || pf.conceptPath;
  const raw = await getConceptDetails(pf.conceptPath, dataset).catch((err) => {
    console.error(err);
    return {} as SearchResult;
  });
  const searchResult: SearchResult = {
    conceptPath: pf.conceptPath,
    dataset,
    name: raw?.name || '',
    display: raw?.display || '',
    studyAcronym: raw?.studyAcronym || '',
    description: raw?.description || '',
    allowFiltering: raw?.allowFiltering || false,
    type:
      pf.min !== undefined || pf.max !== undefined
        ? 'Continuous'
        : pf.phenotypicFilterType === 'ANY_RECORD_OF'
          ? 'AnyRecordOf'
          : 'Categorical',
  };

  if (pf.phenotypicFilterType === 'ANY_RECORD_OF') {
    return createAnyRecordOfFilter(searchResult, { ...searchResult, children: [searchResult] });
  }
  if (pf.phenotypicFilterType === 'REQUIRED') {
    return createRequiredFilter(searchResult);
  }
  if (pf.min !== undefined || pf.max !== undefined) {
    return createNumericFilter(searchResult, pf.min?.toString(), pf.max?.toString());
  }
  return createCategoricalFilter(searchResult, pf.values);
}

async function clauseToFilterNode(clause: PhenotypicClause): Promise<Filter> {
  if (clause.type === 'PhenotypicSubquery') {
    const children = await Promise.all(clause.phenotypicClauses.map(clauseToFilterNode));
    return createFilterGroup(children, clause.operator);
  }
  if (clause.type === 'PhenotypicFilter') {
    return phenotypicFilterToFilter(clause);
  }
  return Promise.reject('invalid clause type ' + JSON.stringify(clause));
}

export async function queryToFilterTree(
  query: QueryInterfaceV3,
): Promise<LogicTree<FilterInterface>> {
  const tree = new LogicTree<FilterInterface>(createGroup);

  if (!query.phenotypicClause) return tree;

  const clause = query.phenotypicClause;
  if (clause.type === 'PhenotypicFilter') {
    tree.add(await phenotypicFilterToFilter(clause));
  } else {
    const nodes =
      clause.operator === Operator.AND
        ? await Promise.all(clause.phenotypicClauses.map(clauseToFilterNode))
        : [await clauseToFilterNode(clause)];
    tree.add(...nodes);
  }
  return tree;
}

export function genomicV3ToFilter(gf: GenomicFilterInterfacev3): Filter {
  const geneFilter: {
    Gene_with_variant?: string[];
    Variant_consequence_calculated?: string[];
    Variant_frequency_as_text?: string[];
    min?: string;
    max?: string;
  } = {};

  if (gf.values) {
    if (gf.key === 'Gene_with_variant') geneFilter.Gene_with_variant = gf.values;
    else if (gf.key === 'Variant_consequence_calculated')
      geneFilter.Variant_consequence_calculated = gf.values;
    else if (gf.key === 'Variant_frequency_as_text')
      geneFilter.Variant_frequency_as_text = gf.values;
  }
  if (gf.min !== undefined) geneFilter.min = gf.min.toString();
  if (gf.max !== undefined) geneFilter.max = gf.max.toString();

  return createGenomicFilter(geneFilter);
}

// ----------------------------- Unified loader ----------------------------- //

export type QuerySummaryData = {
  filterTree: LogicTree<FilterInterface>;
  genomicFilters: Filter[];
  fields: string[];
};

export async function loadQuerySummaryData(
  query: QueryV2 | QueryV3,
  version: string,
): Promise<QuerySummaryData> {
  if (version === QueryVersion.V3) {
    const q = query as QueryV3;
    const filterTree = await queryToFilterTree(q);
    return {
      filterTree,
      genomicFilters: q.genomicFilters.map(genomicV3ToFilter),
      fields: q.select,
    };
  }

  const q = query as QueryV2;
  const filterTree = await loadV2Filters(q);
  return {
    filterTree,
    genomicFilters: loadV2GenomicFilters(q),
    fields: loadV2Fields(q),
  };
}
