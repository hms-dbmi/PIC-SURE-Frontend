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
  | 'VARIANT_COUNT_FOR_QUERY';

export interface QueryInterface {
  fields: string[];
  categoryFilters: object; //TODO: define type
  numericFilters: object;
  requiredFields: string[];
  anyRecordOf: string[];
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

export class Query implements QueryInterface {
  categoryFilters: object;
  numericFilters: object;
  requiredFields: string[];
  anyRecordOf: string[];
  fields: string[];
  crossCountFields?: string[];
  variantInfoFilters: VariantInfoFilters[];
  expectedResultType: ExpectedResultType | ExpectedResultType[];

  constructor(newQuery?: QueryInterface) {
    this.categoryFilters = newQuery?.categoryFilters || {};
    this.numericFilters = newQuery?.numericFilters || {};
    this.requiredFields = newQuery?.requiredFields || [];
    this.anyRecordOf = newQuery?.anyRecordOf || [];
    this.crossCountFields = newQuery?.crossCountFields || undefined;
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
    this.requiredFields.push(field);
  }

  addField(field: string) {
    this.fields.push(field);
  }

  addAnyRecordOf(field: string) {
    this.anyRecordOf.push(field);
  }

  hasFilter() {
    const Gene_with_variant =
      this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Gene_with_variant?.length || 0;
    const Variant_consequence_calculated =
      this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_consequence_calculated
        ?.length || 0;
    const Variant_frequency_as_text =
      this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_frequency_as_text?.length ||
      0;

    return (
      Object.keys(this.categoryFilters).length +
      Object.keys(this.numericFilters).length +
      Gene_with_variant +
      Variant_consequence_calculated +
      Variant_frequency_as_text +
      this.requiredFields.length +
      this.anyRecordOf.length
    );
  }
}
