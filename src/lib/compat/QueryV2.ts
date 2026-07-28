import {
  Operator,
  QueryV3,
  type ExpectedResultType,
  type GenomicFilterInterfacev3,
  type PhenotypicClause,
  type PhenotypicFilterInterface,
} from '$lib/models/query/Query';

type NumericRange = {
  min?: number;
  max?: number;
};

type CategoryVariantInfoFilters = {
  Gene_with_variant?: string[];
  Variant_consequence_calculated?: string[];
  Variant_frequency_as_text?: string[];
};

type VariantInfoFilters = {
  categoryVariantInfoFilters?: CategoryVariantInfoFilters;
  numericVariantInfoFilters?: {
    Variant_frequency_as_number?: number[];
  };
};

export interface QueryV2 {
  fields: string[];
  categoryFilters: Record<string, string[]>;
  numericFilters: Record<string, NumericRange>;
  requiredFields: string[];
  anyRecordOf: string[];
  anyRecordOfMulti: string[][];
  crossCountFields: string[];
  variantInfoFilters: VariantInfoFilters[];
  expectedResultType: ExpectedResultType | ExpectedResultType[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] | null {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return null;
  return value;
}

function normalizeCategoryFilters(value: unknown): Record<string, string[]> | null {
  if (value === null) return {};
  if (!isRecord(value)) return null;

  const filters: Record<string, string[]> = {};
  for (const [conceptPath, rawValues] of Object.entries(value)) {
    if (!Array.isArray(rawValues) || rawValues.some((item) => typeof item !== 'string'))
      return null;
    filters[conceptPath] = rawValues;
  }
  return filters;
}

function normalizeNumericBound(value: unknown): number | undefined | null {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  if (typeof value !== 'number' && typeof value !== 'string') return null;

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNumericFilters(value: unknown): Record<string, NumericRange> | null {
  if (value === null || value === undefined) return {};
  if (!isRecord(value)) return null;

  const filters: Record<string, NumericRange> = {};
  for (const [conceptPath, range] of Object.entries(value)) {
    if (!isRecord(range)) return null;
    const min = normalizeNumericBound(range.min);
    const max = normalizeNumericBound(range.max);
    if (min === null || max === null || (min === undefined && max === undefined)) return null;
    filters[conceptPath] = { min, max };
  }
  return filters;
}

function normalizeAnyRecordOfMulti(value: unknown): string[][] | null {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return null;

  const groups = value.map(normalizeStringArray);
  return groups.some((group) => group === null) ? null : (groups as string[][]);
}

function containsFilterData(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.values(value).some(containsFilterData);
  return value !== null && value !== undefined;
}

function normalizeVariantInfoFilters(value: unknown): VariantInfoFilters[] | null {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return [];
  if (!isRecord(value[0])) return null;
  if (value.slice(1).some(containsFilterData)) return null;
  const supportedTopLevelKeys = new Set([
    'categoryVariantInfoFilters',
    'numericVariantInfoFilters',
  ]);
  const hasUnsupportedTopLevelFilter = Object.entries(value[0]).some(
    ([key, filter]) => !supportedTopLevelKeys.has(key) && containsFilterData(filter),
  );
  if (hasUnsupportedTopLevelFilter) return null;

  const category = value[0].categoryVariantInfoFilters;
  const numeric = value[0].numericVariantInfoFilters;
  if (numeric !== null && numeric !== undefined) {
    if (!isRecord(numeric) || containsFilterData(numeric)) return null;
  }
  if (category === null || category === undefined) return [];
  if (!isRecord(category)) return null;

  const supportedKeys = new Set([
    'Gene_with_variant',
    'Variant_consequence_calculated',
    'Variant_frequency_as_text',
  ]);
  const hasUnsupportedFilter = Object.entries(category).some(
    ([key, filter]) => !supportedKeys.has(key) && containsFilterData(filter),
  );
  if (hasUnsupportedFilter) return null;

  const gene = normalizeStringArray(category.Gene_with_variant);
  const consequence = normalizeStringArray(category.Variant_consequence_calculated);
  const frequency = normalizeStringArray(category.Variant_frequency_as_text);
  if (gene === null || consequence === null || frequency === null) return null;

  return [
    {
      categoryVariantInfoFilters: {
        Gene_with_variant: gene,
        Variant_consequence_calculated: consequence,
        Variant_frequency_as_text: frequency,
      },
      numericVariantInfoFilters: {},
    },
  ];
}

const expectedResultTypes = new Set<ExpectedResultType>([
  'COUNT',
  'CROSS_COUNT',
  'OBSERVATION_CROSS_COUNT',
  'DATAFRAME',
  'DATAFRAME_PFB',
  'DATAFRAME_TIMESERIES',
  'AGGREGATE_VCF_EXCERPT',
  'VCF_EXCERPT',
  'VARIANT_COUNT_FOR_QUERY',
  'SECRET_ADMIN_DATAFRAME',
]);

function normalizeExpectedResultType(
  value: unknown,
): ExpectedResultType | ExpectedResultType[] | null {
  if (value === null || value === undefined) return 'COUNT';
  if (typeof value === 'string') {
    return expectedResultTypes.has(value as ExpectedResultType)
      ? (value as ExpectedResultType)
      : null;
  }
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return 'COUNT';
  if (
    value.some(
      (item) => typeof item !== 'string' || !expectedResultTypes.has(item as ExpectedResultType),
    )
  ) {
    return null;
  }
  return value as ExpectedResultType[];
}

export function parseQueryV2(value: unknown): QueryV2 | null {
  if (!isRecord(value) || !('categoryFilters' in value)) return null;

  const fields = normalizeStringArray(value.fields);
  const categoryFilters = normalizeCategoryFilters(value.categoryFilters);
  const numericFilters = normalizeNumericFilters(value.numericFilters);
  const requiredFields = normalizeStringArray(value.requiredFields);
  const anyRecordOf = normalizeStringArray(value.anyRecordOf);
  const anyRecordOfMulti = normalizeAnyRecordOfMulti(value.anyRecordOfMulti);
  const crossCountFields = normalizeStringArray(value.crossCountFields);
  const variantInfoFilters = normalizeVariantInfoFilters(value.variantInfoFilters);
  if (
    fields === null ||
    categoryFilters === null ||
    numericFilters === null ||
    requiredFields === null ||
    anyRecordOf === null ||
    anyRecordOfMulti === null ||
    crossCountFields === null ||
    variantInfoFilters === null
  ) {
    return null;
  }

  const expectedResultType = normalizeExpectedResultType(value.expectedResultType);
  if (expectedResultType === null) return null;

  return {
    fields,
    categoryFilters,
    numericFilters,
    requiredFields,
    anyRecordOf,
    anyRecordOfMulti,
    crossCountFields,
    variantInfoFilters,
    expectedResultType,
  };
}

function anyRecordOfGroup(conceptPaths: string[]): PhenotypicClause | null {
  const requiredFilters: PhenotypicFilterInterface[] = conceptPaths.map((conceptPath) => ({
    type: 'PhenotypicFilter',
    phenotypicFilterType: 'REQUIRED',
    conceptPath,
    not: false,
  }));

  if (requiredFilters.length === 0) return null;
  if (requiredFilters.length === 1) return requiredFilters[0];
  return {
    type: 'PhenotypicSubquery',
    phenotypicClauses: requiredFilters,
    operator: Operator.OR,
    not: false,
  };
}

export function queryV2ToV3(query: QueryV2, excludedConceptPaths: string[] = []): QueryV3 {
  const clauses: PhenotypicClause[] = [];

  for (const [conceptPath, values] of Object.entries(query.categoryFilters)) {
    if (excludedConceptPaths.includes(conceptPath)) continue;
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'FILTER',
      conceptPath,
      values,
      not: false,
    });
  }

  for (const [conceptPath, range] of Object.entries(query.numericFilters)) {
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'FILTER',
      conceptPath,
      min: range.min,
      max: range.max,
      not: false,
    });
  }

  for (const conceptPath of query.requiredFields) {
    clauses.push({
      type: 'PhenotypicFilter',
      phenotypicFilterType: 'REQUIRED',
      conceptPath,
      not: false,
    });
  }

  const legacyAnyRecordOfGroups = [query.anyRecordOf, ...query.anyRecordOfMulti];
  for (const group of legacyAnyRecordOfGroups) {
    const convertedGroup = anyRecordOfGroup(group);
    if (convertedGroup) clauses.push(convertedGroup);
  }

  const category = query.variantInfoFilters[0]?.categoryVariantInfoFilters;
  const genomicFilters: GenomicFilterInterfacev3[] = [];
  if (category?.Gene_with_variant?.length) {
    genomicFilters.push({ key: 'Gene_with_variant', values: category.Gene_with_variant });
  }
  if (category?.Variant_consequence_calculated?.length) {
    genomicFilters.push({
      key: 'Variant_consequence_calculated',
      values: category.Variant_consequence_calculated,
    });
  }
  if (category?.Variant_frequency_as_text?.length) {
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

  const select = [...new Set([...query.fields, ...query.crossCountFields])].filter(
    (conceptPath) => !excludedConceptPaths.includes(conceptPath),
  );

  return new QueryV3({
    select,
    authorizationFilters: [],
    phenotypicClause,
    genomicFilters,
    expectedResultType: Array.isArray(query.expectedResultType)
      ? query.expectedResultType[0] || 'COUNT'
      : query.expectedResultType,
    picsureId: null,
    id: null,
  });
}
