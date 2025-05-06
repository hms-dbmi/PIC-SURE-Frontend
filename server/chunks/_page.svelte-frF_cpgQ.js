import { a as subscribe, g as get_store_value } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component } from './ssr-BRJpAXVH.js';
import { s as state, E as ExportStepper } from './ExportStepper-ed31N7gT.js';
import { f as filters, a as hasGenomicFilter } from './Filter-CGcyy10g.js';
import { e as exports, E as ExportStore } from './Export-lg6T-LMZ.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { a as resources } from './configuration-wvkhv90d.js';
import { u as user } from './User-Clr_TyZW.js';
import './stores-CeRLSJyW.js';
import './index2-BVONNh3m.js';
import './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './CodeBlock-D3P8-iRB.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index-CvuFLVuQ.js';
import './Dictionary-BM0RbjoK.js';
import './stores4-C3NPX6l0.js';
import './AngleButton-C6YzBYNH.js';
import './Table-smaNoih1.js';
import './Row-Cb2p0o0o.js';
import './UserToken-Di9tipps.js';
import './CopyButton-BtLZ49Iw.js';
import './CardButton-BunBsA3_.js';

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
  addField(field) {
    this.fields.push(field);
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
  get_store_value(exports).forEach((exportedField) => {
    if (exportedField.conceptPath) {
      query.addField(exportedField.conceptPath);
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
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $state, $$unsubscribe_state;
  let $filters, $$unsubscribe_filters;
  let $exports, $$unsubscribe_exports;
  $$unsubscribe_state = subscribe(state, (value) => $state = value);
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  let { exports: exports2 } = ExportStore;
  $$unsubscribe_exports = subscribe(exports2, (value) => $exports = value);
  let queryRequest = getQueryRequest(true);
  let exportRows = $exports.map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.conceptPath,
      variableName: exp.display || exp.searchResult?.display,
      description: exp.searchResult?.description,
      type: exp.searchResult?.type
    };
  });
  let filterRows = $filters.map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      variableName: filter.searchResult?.display || filter.variableName,
      description: filter.searchResult?.description,
      type: filter.searchResult?.type
    };
  });
  {
    const patientIdExport = {
      id: "\\_Patient ID\\",
      conceptPath: "\\_Patient ID\\",
      display: "Patient ID",
      searchResult: {
        conceptPath: "\\_Patient ID\\",
        name: "_Patient ID",
        dataset: "",
        display: "Patient ID",
        studyAcronym: "",
        description: "Patient identifier.",
        type: "Categorical",
        allowFiltering: true
      }
    };
    let patientIdRow = {
      ref: patientIdExport,
      selected: true,
      variableId: patientIdExport.conceptPath,
      variableName: patientIdExport.display || patientIdExport.searchResult?.name,
      description: patientIdExport.searchResult?.description,
      type: patientIdExport.searchResult?.type
    };
    exportRows.push(patientIdRow);
    {
      const topmedExport = {
        id: "\\_Topmed Study Accession with Subject ID\\",
        conceptPath: "\\_Topmed Study Accession with Subject ID\\",
        display: "TOPMed Study Accession with Subject ID",
        searchResult: {
          conceptPath: "\\_Topmed Study Accession with Subject ID\\",
          name: "_TOPMed Study Accession with Subject ID",
          dataset: "TOPMed",
          display: "TOPMed Study Accession with Subject ID",
          studyAcronym: "TOPMed",
          description: "TOPMed study accession number and subject identifier.",
          type: "Categorical",
          allowFiltering: true
        }
      };
      let topMedRow = {
        ref: topmedExport,
        selected: true,
        variableId: topmedExport.conceptPath,
        variableName: topmedExport.display || topmedExport.searchResult?.name,
        description: topmedExport.searchResult?.description,
        type: topmedExport.searchResult?.type
      };
      exportRows.push(topMedRow);
      const parentStudyExport = {
        id: "\\_Parent Study Accession with Subject ID\\",
        conceptPath: "\\_Parent Study Accession with Subject ID\\",
        display: "Parent Study Accession with Subject ID",
        searchResult: {
          conceptPath: "\\_Parent Study Accession with Subject ID\\",
          name: "_Parent Study Accession with Subject ID",
          dataset: "",
          display: "Parent Study Accession with Subject ID",
          studyAcronym: "",
          description: "Parent study accession number and subject identifier.",
          type: "Categorical",
          allowFiltering: true
        }
      };
      let parentStudyRow = {
        ref: parentStudyExport,
        selected: true,
        variableId: parentStudyExport.conceptPath,
        variableName: parentStudyExport.display || parentStudyExport.searchResult?.name,
        description: parentStudyExport.searchResult?.description,
        type: parentStudyExport.searchResult?.type
      };
      exportRows.push(parentStudyRow);
    }
  }
  state.set({ ...$state, current: 0, total: 0 });
  $$unsubscribe_state();
  $$unsubscribe_filters();
  $$unsubscribe_exports();
  return `${validate_component(Content, "Content").$$render(
    $$result,
    {
      backUrl: "/explorer",
      backTitle: "Back to Explore",
      backAction: () => {
        $state.current = 0;
      },
      title: "Export Data for Research Analysis"
    },
    {},
    {
      default: () => {
        return `${$exports.length > 0 || $filters.length > 0 ? `<section class="flex justify-center items-center w-full h-full mt-8">${validate_component(ExportStepper, "ExportStepper").$$render(
          $$result,
          {
            query: queryRequest,
            rows: [...filterRows, ...exportRows]
          },
          {},
          {}
        )}</section>` : `<div class="flex flex-col items-center justify-center m-8"><p data-svelte-h="svelte-1xd42eg">No filters or exports have been created.</p> <div class="flex gap-4"><button class="btn variant-filled-primary m-4" data-svelte-h="svelte-1yq884x">Learn How</button></div></div>`}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-frF_cpgQ.js.map
