import { a as resources } from './configuration-JjhNHhnG.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';
import './User-DpPjP5W7.js';
import { f as filters } from './Filter-DQ4J7bUR.js';

class Query {
  categoryFilters;
  numericFilters;
  requiredFields;
  anyRecordOf;
  fields;
  crossCountFields;
  variantInfoFilters;
  expectedResultType;
  constructor(newQuery) {
    this.categoryFilters = newQuery?.categoryFilters || {};
    this.numericFilters = newQuery?.numericFilters || {};
    this.requiredFields = newQuery?.requiredFields || [];
    this.anyRecordOf = newQuery?.anyRecordOf || [];
    this.crossCountFields = newQuery?.crossCountFields || void 0;
    this.fields = newQuery?.fields || [];
    const variantInfoFilter = newQuery?.variantInfoFilters?.[0] || {
      categoryVariantInfoFilters: {},
      numericVariantInfoFilters: {}
    };
    this.variantInfoFilters = [variantInfoFilter];
    this.expectedResultType = newQuery?.expectedResultType || "COUNT";
  }
  addCategoryFilter(key, value) {
    this.categoryFilters[key] = value;
  }
  removeCategoryFilter(key) {
    delete this.categoryFilters[key];
  }
  addNumericFilter(key, min, max) {
    this.numericFilters[key] = {
      min: min.toString(),
      max: max.toString()
    };
  }
  addCategoryVariantInfoFilters(filter) {
    this.variantInfoFilters[0].categoryVariantInfoFilters = {
      Gene_with_variant: filter.Gene_with_variant,
      Variant_consequence_calculated: filter.Variant_consequence_calculated,
      Variant_frequency_as_text: filter.Variant_frequency_as_text
    };
  }
  setCrossCountFields(fields) {
    this.crossCountFields = fields;
  }
  addSnpFilter(snps) {
    snps.forEach((snp) => {
      {
        this.categoryFilters[snp.search] = snp.constraint.split(",");
      }
    });
  }
  addRequiredField(field) {
    this.requiredFields.push(field);
  }
  addAnyRecordOf(field) {
    this.anyRecordOf.push(field);
  }
  hasFilter() {
    const Gene_with_variant = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Gene_with_variant?.length || 0;
    const Variant_consequence_calculated = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_consequence_calculated?.length || 0;
    const Variant_frequency_as_text = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_frequency_as_text?.length || 0;
    return Object.keys(this.categoryFilters).length + Object.keys(this.numericFilters).length + Gene_with_variant + Variant_consequence_calculated + Variant_frequency_as_text + this.requiredFields.length + this.anyRecordOf.length;
  }
}
function getQueryRequest(addConsents = true, resourceUUID = resources.hpds, expectedResultType = "COUNT") {
  let query = new Query();
  get_store_value(filters).forEach((filter) => {
    if (filter.filterType === "Categorical") {
      if (filter.displayType === "restrict") {
        query.addCategoryFilter(filter.id, filter.categoryValues);
      } else {
        query.addRequiredField(filter.id);
      }
    } else if (filter.filterType === "numeric") {
      query.addNumericFilter(filter.id, filter.min || "", filter.max || "");
    } else if (filter.filterType === "genomic") {
      query.addCategoryVariantInfoFilters({
        Gene_with_variant: filter.Gene_with_variant,
        Variant_consequence_calculated: filter.Variant_consequence_calculated,
        Variant_frequency_as_text: filter.Variant_frequency_as_text
      });
    } else if (filter.filterType === "snp") {
      query.addSnpFilter(filter.snpValues);
    }
  });
  query.expectedResultType = expectedResultType;
  return {
    query,
    resourceUUID
  };
}
function getBlankQueryRequest(addConsents = true, resourceUUID = resources.hpds, expectedResultType = "COUNT") {
  let query = new Query();
  query.expectedResultType = expectedResultType;
  return {
    query,
    resourceUUID
  };
}

export { getQueryRequest as a, getBlankQueryRequest as g };
//# sourceMappingURL=QueryBuilder-LFC29XqS.js.map
