import type { Indexable } from '$lib/types';
import { type SNP } from '$lib/models/GenomeFilter';

export type ExpectedResultType =
  | 'COUNT'
  | 'CROSS_COUNT'
  | 'OBSERVATION_CROSS_COUNT'
  | 'DATAFRAME'
  | 'DATAFRAME_PFB'
  | 'DATAFRAME_TIMESERIES'
  | 'AGGREGATE_VCF_EXCERPT'
  | 'VCF_EXCERPT'
  | 'VARIANT_COUNT_FOR_QUERY'
  | 'SECRET_ADMIN_DATAFRAME';

export type QueryInterface = QueryInterfaceV2 | QueryInterfaceV3;

export interface QueryInterfaceV2 {
  fields: string[];
  categoryFilters: object; //TODO: define type
  numericFilters: object;
  requiredFields: string[];
  anyRecordOf: string[];
  anyRecordOfMulti: string[][];
  crossCountFields?: string[];
  variantInfoFilters: VariantInfoFilters[];
  expectedResultType: ExpectedResultType | ExpectedResultType[];
}

interface CategoryVariantInfoFilterInterface {
  Gene_with_variant?: string[];
  Variant_consequence_calculated?: string[];
  Variant_frequency_as_text?: string[];
}

interface NumericVariantInfoFiltersInterface {
  Variant_frequency_as_number?: number[];
}

interface VariantInfoFilters {
  categoryVariantInfoFilters?: CategoryVariantInfoFilterInterface;
  numericVariantInfoFilters?: NumericVariantInfoFiltersInterface;
}

export class QueryV2 implements QueryInterfaceV2 {
  categoryFilters: object;
  numericFilters: object;
  requiredFields: string[];
  anyRecordOf: string[];
  anyRecordOfMulti: string[][];
  fields: string[];
  crossCountFields?: string[];
  variantInfoFilters: VariantInfoFilters[];
  expectedResultType: ExpectedResultType | ExpectedResultType[];

  constructor(newQuery?: QueryInterfaceV2) {
    this.categoryFilters = newQuery?.categoryFilters || {};
    this.numericFilters = newQuery?.numericFilters || {};
    this.requiredFields = newQuery?.requiredFields || [];
    this.anyRecordOf = newQuery?.anyRecordOf || [];
    this.anyRecordOfMulti = newQuery?.anyRecordOfMulti || [];
    this.crossCountFields = newQuery?.crossCountFields || [];
    this.fields = newQuery?.fields || [];
    const variantInfoFilter = newQuery?.variantInfoFilters?.[0] || {
      categoryVariantInfoFilters: {},
      numericVariantInfoFilters: {},
    };
    this.variantInfoFilters = [variantInfoFilter];
    this.expectedResultType = newQuery?.expectedResultType || 'COUNT';
  }

  addCategoryFilter(key: string, value: string[]) {
    (this.categoryFilters as Indexable)[key] = value;
  }

  removeCategoryFilter(key: string) {
    delete (this.categoryFilters as Indexable)[key];
  }

  addNumericFilter(key: string, min: string, max: string) {
    (this.numericFilters as Indexable)[key] = {
      min: min.toString(),
      max: max.toString(),
    };
  }

  addCategoryVariantInfoFilters(filter: {
    Gene_with_variant?: string[];
    Variant_consequence_calculated?: string[];
    Variant_frequency_as_text?: string[];
  }) {
    this.variantInfoFilters[0].categoryVariantInfoFilters = {
      Gene_with_variant: filter.Gene_with_variant,
      Variant_consequence_calculated: filter.Variant_consequence_calculated,
      Variant_frequency_as_text: filter.Variant_frequency_as_text,
    };
  }

  addAnyRecordOfMulti(field: Array<string>) {
    this.anyRecordOfMulti.push(field);
  }

  setCrossCountFields(fields: string[]) {
    this.crossCountFields = fields;
  }

  addSnpFilter(snps: SNP[]) {
    snps.forEach((snp) => {
      {
        (this.categoryFilters as Indexable)[snp.search] = snp.constraint.split(',');
      }
    });
  }

  addRequiredField(field: string) {
    if (!this.requiredFields.includes(field)) {
      this.requiredFields.push(field);
    }
  }

  addField(field: string) {
    if (!this.fields.includes(field)) {
      this.fields.push(field);
    }
  }

  addAnyRecordOf(field: string) {
    if (!this.anyRecordOf.includes(field)) {
      this.anyRecordOf.push(field);
    }
  }

  hasGenomicFilter() {
    const Gene_with_variant =
      this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Gene_with_variant?.length || 0;
    const Variant_consequence_calculated =
      this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_consequence_calculated
        ?.length || 0;
    const Variant_frequency_as_text =
      this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_frequency_as_text?.length ||
      0;
    return Gene_with_variant + Variant_consequence_calculated + Variant_frequency_as_text;
  }

  hasFilter() {
    return (
      Object.keys(this.categoryFilters).length +
      Object.keys(this.numericFilters).length +
      this.hasGenomicFilter() +
      this.requiredFields.length +
      this.anyRecordOf.length
    );
  }
}

// -------------------------------- V3 Query -------------------------------- //

type UUID = `${string}-${string}-${string}-${string}-${string}` | null;
export type PhenotypicFilterType = 'REQUIRED' | 'FILTER' | 'ANY_RECORD_OF';
export type PhenotypicClause = PhenotypicSubqueryInterface | PhenotypicFilterInterface;
export const Operator = {
  AND: 'AND',
  OR: 'OR',
} as const;
export type OperatorType = (typeof Operator)[keyof typeof Operator];

export interface QueryInterfaceV3 {
  select: string[];
  authorizationFilters: AuthorizationFilterInterface[];
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicFilterInterfacev3[];
  expectedResultType: ExpectedResultType;
  picsureId: UUID;
  id: UUID;
}

export interface PhenotypicClauseInterface {
  type: string;
}
export interface AuthorizationFilterInterface {
  conceptPath: string;
  values: string[];
}

export interface PhenotypicFilterInterface extends PhenotypicClauseInterface {
  type: 'PhenotypicFilter';
  phenotypicFilterType: PhenotypicFilterType;
  conceptPath: string;
  values?: string[];
  min?: number | undefined;
  max?: number | undefined;
  not: boolean;
}

export interface PhenotypicSubqueryInterface extends PhenotypicClauseInterface {
  type: 'PhenotypicSubquery';
  not: boolean | null;
  phenotypicClauses: PhenotypicClause[];
  operator: OperatorType;
}

export interface GenomicFilterInterfacev3 {
  key: string;
  values?: string[];
  min?: number;
  max?: number;
}

export class QueryV3 implements QueryInterfaceV3 {
  select: string[];
  authorizationFilters: AuthorizationFilterInterface[];
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicFilterInterfacev3[];
  expectedResultType: ExpectedResultType;
  picsureId: UUID;
  id: UUID;

  constructor(newQuery?: QueryInterfaceV3) {
    this.select = newQuery?.select || [];
    this.authorizationFilters = newQuery?.authorizationFilters || [];
    this.phenotypicClause = newQuery?.phenotypicClause || null;
    this.genomicFilters = newQuery?.genomicFilters || [];
    this.expectedResultType = newQuery?.expectedResultType || 'COUNT';
    this.picsureId = newQuery?.picsureId || null;
    this.id = newQuery?.id || null;
  }
}
