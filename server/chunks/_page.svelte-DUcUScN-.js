import { a as subscribe } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, v as validate_component } from './ssr-Di-o4HBA.js';
import { s as state, E as ExportStepper } from './ExportStepper-Bogdur1X.js';
import { f as filters } from './Filter-DOu7lnJO.js';
import { E as ExportStore } from './Export-CQyK1aHM.js';
import { C as Content } from './Content-BUgV6smf.js';
import { a as getQueryRequest } from './QueryBuilder-ujQ1zYH9.js';
import './configuration-CHJZnZTS.js';
import './index-CvuFLVuQ.js';
import './User-BlJO9WgU.js';
import './index2-CV6P_ZFI.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores3-DsZ2QG0u.js';
import './AngleButton-Cxjzo9QZ.js';
import './Table-ehh7vrd4.js';
import './Row-CyujZUEb.js';
import './UserToken-Drf_tdHB.js';
import './stores-Bn6ceQfl.js';
import './stores2-DrFt-twL.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import './ProgressRadial-B9eVk9uU.js';
import './CopyButton-BuZhfqkP.js';
import './codeBlocks-BiQ1Re7M.js';
import './CardButton-nEBmTS9Q.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $filters, $$unsubscribe_filters;
  let $exports, $$unsubscribe_exports;
  let $state, $$unsubscribe_state;
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  $$unsubscribe_state = subscribe(state, (value) => $state = value);
  let { exports } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
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
  state.set({ current: 0, total: 0 });
  $$unsubscribe_filters();
  $$unsubscribe_exports();
  $$unsubscribe_state();
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
//# sourceMappingURL=_page.svelte-DUcUScN-.js.map
