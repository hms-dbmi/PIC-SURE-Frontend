import type { Indexable } from '$lib/types';
type ExpectedResultType = 'COUNT' | 'CROSS_COUNT' | 'DATAFRAME';

interface QueryInterface {
  categoryFilters: object; //TODO: define type
  numericFilters: object;
  requiredFields: string[];
  anyRecordOf: string[];
  variantInfoFilters: VariantInfoFilters[];
  expectedResultType: ExpectedResultType;
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
  variantInfoFilters: VariantInfoFilters[];
  expectedResultType: ExpectedResultType;

  constructor() {
    this.categoryFilters = {};
    this.numericFilters = {};
    this.requiredFields = [];
    this.anyRecordOf = [];
    const variantInfoFilter = {
      categoryVariantInfoFilters: {},
      numericVariantInfoFilters: {},
    };
    this.variantInfoFilters = [variantInfoFilter];
    this.expectedResultType = 'COUNT';
  }

  addCategoryFilter(key: string, value: string[]) {
    (this.categoryFilters as Indexable)[key] = value;
  }

  addNumericFilter(key: string, min: string, max: string) {
    (this.numericFilters as Indexable)[key] = {
      min: min.toString(),
      max: max.toString(),
    };
  }

  addRequiredField(field: string) {
    this.requiredFields.push(field);
  }

  addAnyRecordOf(field: string) {
    this.anyRecordOf.push(field);
  }
}
