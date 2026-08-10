import {
  QueryV2,
  QueryV3,
  type ExpectedResultType,
  type PhenotypicFilterInterface,
  type PhenotypicSubqueryInterface,
  type PhenotypicFilterType,
  type PhenotypicClause,
  type QueryInterfaceV3,
} from '$lib/models/query/Query';
import { config } from '$lib/configuration.svelte';
import type { QueryRequestInterfaceV2 } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { filters, filterTree, genomicFilters, hasGenomicFilter } from '$lib/stores/Filter';
import { exports } from '$lib/stores/Export';
import type {
  Filter,
  FilterType,
  FilterInterface,
  GenomicFilterInterface,
  SnpFilterInterface,
  AnyRecordOfFilterInterface,
} from '$lib/models/Filter.svelte';
import { LogicTree } from '$lib/models/LogicTree.svelte';
import {
  CONSENTS_PATH,
  HARMONIZED_CONSENTS_PATH,
  TOPMED_CONSENTS_PATH,
  consentValues,
} from '$lib/models/UserConsents';
import type { GenomicFilterInterfacev3, OperatorType } from '$lib/models/query/Query';
import type { ExportInterface } from '$lib/models/Export.ts';

const harmonizedPath = '\\DCC Harmonized data set';

/**
 * The consent concept paths, in the order they are emitted. Both query versions
 * read the same three keys off the user's consents map, so the paths live in the
 * model that decodes that map rather than being restated here.
 */
const consentPaths = [CONSENTS_PATH, HARMONIZED_CONSENTS_PATH, TOPMED_CONSENTS_PATH] as const;

// -------------------------------- V2 Query -------------------------------- //

export function getQueryRequestV2(
  addConsents = true,
  resourceUUID = '',
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV2) => QueryV2 = (q) => q,
): QueryRequestInterfaceV2 {
  return getBlankQueryRequestV2(
    !addConsents,
    resourceUUID,
    expectedResultType,
    (query: QueryV2) => {
      [...get(genomicFilters), ...get(filters)].forEach((filter: Filter) => {
        if (filter.filterType === 'Categorical') {
          if (filter.displayType === 'restrict') {
            query.addCategoryFilter(filter.id, filter.categoryValues);
          } else {
            query.addRequiredField(filter.id);
          }
        } else if (filter.filterType === 'numeric') {
          query.addNumericFilter(filter.id, filter.min || '', filter.max || '');
        } else if (filter.filterType === 'genomic') {
          query.addCategoryVariantInfoFilters({
            Gene_with_variant: filter.Gene_with_variant,
            Variant_consequence_calculated: filter.Variant_consequence_calculated,
            Variant_frequency_as_text: filter.Variant_frequency_as_text,
          });
        } else if (filter.filterType === 'snp') {
          query.addSnpFilter(filter.snpValues);
        } else if (filter.filterType === 'AnyRecordOf') {
          query.addAnyRecordOfMulti(filter.concepts);
        }
      });

      (get(exports) as ExportInterface[]).forEach((exportedField) => {
        if (exportedField.conceptPath) {
          query.addField(exportedField.conceptPath);
        }
      });
      return mutateMethod(query);
    },
  );
}

export function getBlankQueryRequestV2(
  isOpenAccess = false,
  resourceUUID = '',
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV2) => QueryV2 = (q) => q,
): QueryRequestInterfaceV2 {
  let query: QueryV2 = new QueryV2();

  // The v2 query template used to arrive pre-seeded with exactly these three
  // category filters — carrying them was the only reason it was fetched — so
  // seeding them from the consents map reproduces the old body.
  if (config.features.requireConsents && !isOpenAccess) {
    const consents = get(user)?.consents;
    consentPaths.forEach((conceptPath) => {
      const values = consentValues(consents, conceptPath);
      if (values && values.length > 0) {
        query.addCategoryFilter(conceptPath, values);
      }
    });
  }

  query = mutateMethod(query);

  if (config.features.requireConsents && !isOpenAccess) {
    query = updateConsentFilters(query);
  }

  query.expectedResultType = expectedResultType;

  return {
    query,
    resourceUUID,
  };
}

export const updateConsentFilters = (query: QueryV2) => {
  if (
    !hasHarmonizedPath(query.categoryFilters) &&
    !hasHarmonizedPath(query.numericFilters) &&
    !fieldsIncludeHarmonizedPath(query.fields) &&
    !fieldsIncludeHarmonizedPath(query.requiredFields)
  ) {
    query.removeCategoryFilter(HARMONIZED_CONSENTS_PATH);
  }

  if (!get(hasGenomicFilter)) {
    query.removeCategoryFilter(TOPMED_CONSENTS_PATH);
  }

  return query;
};

const hasHarmonizedPath = (obj: object): boolean => {
  return Object.keys(obj).some((concept) => concept.includes(harmonizedPath));
};

const fieldsIncludeHarmonizedPath = (arr: string[]): boolean => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};

const parseNumber = (input: string | number | null | undefined): number | undefined => {
  if (input === null || input === undefined) return undefined;
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;

  const trimmed = input.trim();
  if (trimmed === '') return undefined;

  // remove grouping separators: comma, space, NBSP, thin space, underscore
  const normalized = trimmed.replace(/[,_\s\u00A0\u202F]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

// -------------------------------- V3 Query -------------------------------- //

/**
 * Strip the client-only `type` discriminator from phenotypic clauses: the
 * server infers clause kind structurally and rejects unknown members.
 */
function serializeQueryV3(query: QueryV3): QueryInterfaceV3 {
  return JSON.parse(
    JSON.stringify(query, (key, value) => {
      if (key === 'type') return undefined;
      return value;
    }),
  );
}

export function buildPhenotypicClauseFromTree(
  tree: LogicTree<FilterInterface>,
): PhenotypicClause | null {
  if (tree.root.children.length === 0) return null;

  const groupClause = (operator: OperatorType): PhenotypicSubqueryInterface => ({
    type: 'PhenotypicSubquery',
    operator,
    phenotypicClauses: [],
    not: false,
  });
  const mapNode = (node: FilterInterface): PhenotypicClause => {
    if (tree.isGroup(node)) {
      const newGroup = groupClause(node.operator);
      newGroup.phenotypicClauses = node.children.map(mapNode);
      return newGroup;
    }
    return convertPhenotypicFilterToClause(node as Filter);
  };
  return mapNode(tree.root);
}

export function buildGenomicFiltersFromFilters(
  genomicFilters: Filter[],
): GenomicFilterInterfacev3[] {
  const out: GenomicFilterInterfacev3[] = [];
  genomicFilters.forEach((filter: Filter) => {
    if (filter.filterType === 'snp') {
      convertSnpFilterToClause(filter).forEach((g) => out.push(g));
    } else if (filter.filterType === 'genomic') {
      convertGenomicFilterToClause(filter).forEach((g) => out.push(g));
    }
  });
  return out;
}

export function buildQueryRequestV3FromDescriptor(
  descriptor: import('$lib/services/counts/queryDescriptor.svelte').QueryDescriptor,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryInterfaceV3 {
  let query: QueryV3 = new QueryV3();
  query.expectedResultType = expectedResultType;
  // Defensive clone: QueryV3.addClause reassigns `phenotypicClauses` on the
  // existing clause object, so an aliased descriptor.phenotypicClause would be
  // mutated by mutateMethod. The descriptor must remain immutable so stableHash
  // stays stable for cache lookups.
  query.phenotypicClause = descriptor.phenotypicClause
    ? structuredClone(descriptor.phenotypicClause)
    : null;
  descriptor.genomicFilters.forEach((g) => query.genomicFilters.push(structuredClone(g)));
  query = mutateMethod(query);
  // The bare query IS the body — no { query, resourceUUID } envelope.
  return serializeQueryV3(query);
}

export function getFilterConcepts(query: QueryV3): string[] {
  if (query.phenotypicClause == null) return [];

  const concepts: string[] = [];

  function mapClause(clause: PhenotypicClause): void {
    if (clause.type === 'PhenotypicSubquery' && clause.phenotypicClauses.length > 0) {
      clause.phenotypicClauses.forEach(mapClause);
      return;
    }
    const thisFilter = clause as PhenotypicFilterInterface;
    if (thisFilter.phenotypicFilterType === 'ANY_RECORD_OF') {
      const anyRecordFilter = get(filters).find(
        (filter) => filter.id === thisFilter.conceptPath,
      ) as AnyRecordOfFilterInterface | undefined;
      if (!anyRecordFilter) return;
      anyRecordFilter.concepts.forEach((concept) => concepts.push(concept));
    } else {
      concepts.push(thisFilter.conceptPath);
    }
  }
  mapClause(query.phenotypicClause);

  return concepts;
}

/**
 * Build the request body for a v3 query endpoint.
 *
 * Returns the BARE v3 `Query`. There is no `{ query, resourceUUID }` envelope
 * any more: the server binds this object directly and deserializes strictly,
 * so an envelope (or any other unknown member) is a 400. The HPDS backend is
 * chosen by URL path — `/hpds/auth` vs `/hpds/open` — which is why no
 * resource UUID is threaded through here.
 */
export function getQueryRequestV3(
  addConsents = true,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryInterfaceV3 {
  return getBlankQueryRequestV3(!addConsents, expectedResultType, (query: QueryV3) => {
    query.phenotypicClause = buildPhenotypicClauseFromTree(get(filterTree));
    get(genomicFilters).forEach((filter: Filter) => {
      if (filter.filterType === 'snp') {
        convertSnpFilterToClause(filter).forEach((genomicFilter) => {
          query.genomicFilters.push(genomicFilter);
        });
      } else if (filter.filterType === 'genomic') {
        convertGenomicFilterToClause(filter).forEach((genomicFilter) => {
          query.genomicFilters.push(genomicFilter);
        });
      }
    });
    return mutateMethod(query);
  });
}

/** As {@link getQueryRequestV3}, but without the current filter/genomic state. */
export function getBlankQueryRequestV3(
  isOpenAccess = false,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryInterfaceV3 {
  let query: QueryV3 = new QueryV3();
  query.expectedResultType = expectedResultType;

  query = mutateMethod(query);

  if (config.features.requireConsents && !isOpenAccess) {
    addAuthorizationFiltersV3(query);
  }

  return serializeQueryV3(query);
}

/**
 * Emit the user's study authorizations as v3 `authorizationFilters`.
 *
 * The wire shape is pinned by server-side tests: an ordered array of
 * `{ conceptPath, values }`, one entry per consent path, and a path with no
 * values is OMITTED rather than sent with an empty list. Malformed consents are
 * treated as no consents — `consentValues` returns null and the entry is
 * skipped — because a non-`List<String>` `values` is a 400 on the whole query.
 */
function addAuthorizationFiltersV3(query: QueryV3): void {
  const consents = get(user)?.consents;
  consentPaths.forEach((conceptPath) => {
    const values = consentValues(consents, conceptPath);
    if (values && values.length > 0) {
      query.authorizationFilters.push({ conceptPath, values });
    }
  });

  if (config.features.requireConsents) {
    const hasHarmonizedInSelect = selectIncludesHarmonizedPathV3(query.select || []);
    const hasHarmonizedInPhenotype = phenotypicClauseIncludesHarmonizedPath(query.phenotypicClause);
    const hasAnyHarmonized = hasHarmonizedInSelect || hasHarmonizedInPhenotype;

    if (!hasAnyHarmonized) {
      query.authorizationFilters = (query.authorizationFilters || []).filter(
        (af) => af.conceptPath !== HARMONIZED_CONSENTS_PATH,
      );
    }

    const hasGenomic = (query.genomicFilters || []).length > 0;
    if (!hasGenomic) {
      query.authorizationFilters = (query.authorizationFilters || []).filter(
        (af) => af.conceptPath !== TOPMED_CONSENTS_PATH,
      );
    }
  }
}

const selectIncludesHarmonizedPathV3 = (arr: string[]): boolean => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};

const phenotypicClauseIncludesHarmonizedPath = (clause: PhenotypicClause | null): boolean => {
  if (!clause) return false;
  if (clause.type === 'PhenotypicFilter') {
    const filterClause = clause as PhenotypicFilterInterface;
    return !!filterClause.conceptPath && filterClause.conceptPath.includes(harmonizedPath);
  }
  const sub = clause as PhenotypicSubqueryInterface;
  return (sub.phenotypicClauses || []).some(phenotypicClauseIncludesHarmonizedPath);
};

const convertPhenotypicFilterToClause = (filter: Filter): PhenotypicFilterInterface => {
  const newFilterClause: PhenotypicFilterInterface = {
    type: 'PhenotypicFilter',
    phenotypicFilterType: convertFilterTypeToClauseType(filter.filterType),
    conceptPath: filter.id,
    not: false,
  };
  switch (filter.filterType) {
    case 'AnyRecordOf':
      newFilterClause.phenotypicFilterType = 'ANY_RECORD_OF';
      break;

    case 'required':
      newFilterClause.phenotypicFilterType = 'REQUIRED';
      break;

    case 'numeric':
      if (filter.min === undefined && filter.max === undefined) {
        newFilterClause.phenotypicFilterType = 'REQUIRED';
      }
      if (filter.min !== undefined) {
        newFilterClause.min = parseNumber(filter.min);
      }
      if (filter.max !== undefined) {
        newFilterClause.max = parseNumber(filter.max);
      }
      break;

    case 'Categorical':
      if (!filter.categoryValues?.length) {
        newFilterClause.phenotypicFilterType = 'REQUIRED';
      } else {
        newFilterClause.values = filter.categoryValues;
      }
      break;
  }
  return newFilterClause;
};

const convertGenomicFilterToClause = (
  filter: GenomicFilterInterface,
): GenomicFilterInterfacev3[] => {
  const genomicFilters: GenomicFilterInterfacev3[] = [];

  const hasMinMax =
    (filter.min !== undefined && filter.min !== '') ||
    (filter.max !== undefined && filter.max !== '');
  const hasCategoricalValues =
    (filter.Gene_with_variant && filter.Gene_with_variant.length > 0) ||
    (filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0) ||
    (filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0);

  if (hasMinMax && !hasCategoricalValues) {
    const min = filter.min ? parseNumber(filter.min) : undefined;
    const max = filter.max ? parseNumber(filter.max) : undefined;
    return convertNumericGenomicFilterToClause('genomic_range', min, max);
  }
  if (filter.Gene_with_variant && filter.Gene_with_variant.length > 0) {
    genomicFilters.push({
      key: 'Gene_with_variant',
      values: filter.Gene_with_variant,
    });
  }

  if (filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0) {
    genomicFilters.push({
      key: 'Variant_consequence_calculated',
      values: filter.Variant_consequence_calculated,
    });
  }

  if (filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0) {
    genomicFilters.push({
      key: 'Variant_frequency_as_text',
      values: filter.Variant_frequency_as_text,
    });
  }

  return genomicFilters;
};

const convertSnpFilterToClause = (snps: SnpFilterInterface): GenomicFilterInterfacev3[] => {
  const genomicFilters: GenomicFilterInterfacev3[] = [];

  (snps.snpValues || []).forEach((snp) => {
    genomicFilters.push({
      key: snp.search,
      values: snp.constraint.split(','),
    });
  });

  return genomicFilters;
};

const convertNumericGenomicFilterToClause = (
  key: string,
  min?: number,
  max?: number,
): GenomicFilterInterfacev3[] => {
  if (min !== undefined && max !== undefined) {
    return [{ key, min, max }];
  } else if (min !== undefined) {
    return [{ key, min }];
  } else if (max !== undefined) {
    return [{ key, max }];
  }
  return [];
};

function convertFilterTypeToClauseType(filterType: FilterType): PhenotypicFilterType {
  switch (filterType) {
    case 'Categorical':
    case 'numeric':
      return 'FILTER';
    case 'AnyRecordOf':
      return 'ANY_RECORD_OF';
    case 'required':
      return 'REQUIRED';
    case 'snp':
      return 'FILTER';
  }
  return 'FILTER';
}
