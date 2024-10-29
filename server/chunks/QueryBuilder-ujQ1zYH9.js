import { a as resources } from './configuration-CHJZnZTS.js';
import { g as get_store_value } from './lifecycle-GVhEEkqU.js';
import { u as user } from './User-BlJO9WgU.js';
import { f as filters, a as hasGenomicFilter } from './Filter-DOu7lnJO.js';

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
const harmonizedPath = "\\DCC Harmonized data set";
const harmonizedConsentPath = "\\_harmonized_consent\\";
const topmedConsentPath = "\\_topmed_consents\\";
function getQueryRequest(addConsents = true, resourceUUID = resources.hpds, expectedResultType = "COUNT") {
  let query = new Query();
  if (addConsents) {
    const queryTemplate = get_store_value(user).queryTemplate;
    if (queryTemplate) {
      query = new Query(structuredClone(queryTemplate));
    }
  }
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
  if (addConsents) {
    query = updateConsentFilters(query);
  }
  query.expectedResultType = expectedResultType;
  return {
    query,
    resourceUUID
  };
}
function getBlankQueryRequest(addConsents = true, resourceUUID = resources.hpds, expectedResultType = "COUNT") {
  let query = new Query();
  if (addConsents) {
    const queryTemplate = get_store_value(user).queryTemplate;
    if (queryTemplate) {
      query = new Query(structuredClone(queryTemplate));
    }
  }
  if (addConsents) {
    query = updateConsentFilters(query);
  }
  query.expectedResultType = expectedResultType;
  return {
    query,
    resourceUUID
  };
}
const updateConsentFilters = (query) => {
  if (!hasHarmonizedPath(query.categoryFilters) && !hasHarmonizedPath(query.numericFilters) && !fieldsIncludeHarmonizedPath(query.fields) && !fieldsIncludeHarmonizedPath(query.requiredFields)) {
    query.removeCategoryFilter(harmonizedConsentPath);
  }
  if (!get_store_value(hasGenomicFilter)) {
    query.removeCategoryFilter(topmedConsentPath);
  }
  return query;
};
const hasHarmonizedPath = (obj) => {
  return Object.keys(obj).some((concept) => concept.includes(harmonizedPath));
};
const fieldsIncludeHarmonizedPath = (arr) => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};

export { getQueryRequest as a, getBlankQueryRequest as g };
//# sourceMappingURL=QueryBuilder-ujQ1zYH9.js.map
