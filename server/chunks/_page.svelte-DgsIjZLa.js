import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import { D as DataSetStore } from './Dataset-Rj8zR9NE.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import { C as Content } from './Content-BUgV6smf.js';
import './index2-CV6P_ZFI.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './User-BlJO9WgU.js';
import './index-CvuFLVuQ.js';
import './AngleButton-Cxjzo9QZ.js';

const QuerySummary = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { query = {} } = $$props;
  if ($$props.query === void 0 && $$bindings.query && query !== void 0) $$bindings.query(query);
  return `<section id="detail-filters-container" class="m-3"><p class="font-bold text-left my-1" data-svelte-h="svelte-1k1g4gb">Filters Applied</p> <ul data-testid="dataset-summary-filters" class="primary-list"><li>query.categoryFilters: ${escape(JSON.stringify(query?.categoryFilters))}</li> <li>query.numericFilters: ${escape(JSON.stringify(query?.numericFilters))}</li> <li>query.variantInfoFilters: ${escape(JSON.stringify(query?.variantInfoFilters))}</li></ul></section> <section id="detail-variables-container" class="m-3"><p class="font-bold text-left my-1" data-svelte-h="svelte-1rf9isq">Additional Variables Included in Dataset</p> <ul data-testid="dataset-summary-variables" class="primary-list"><li>query.fields: ${escape(JSON.stringify(query?.fields))}</li></ul></section>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { getDataset } = DataSetStore;
  let dataset;
  async function loadDataset() {
    dataset = await getDataset($page.params.uuid);
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-x1k5fd_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Dataset</title>`, ""}<!-- HEAD_svelte-x1k5fd_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "View Dataset",
      backUrl: "/dataset",
      backTitle: "Back to Datasets"
    },
    {},
    {
      default: () => {
        return `${function(__value) {
          if (is_promise(__value)) {
            __value.then(null, noop);
            return ` <h3 class="text-left" data-svelte-h="svelte-16fo5h6">Loading</h3> ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
          }
          return function() {
            return ` <section id="detail-summary-container" class="m-3"><h2 class="text-left my-1" data-svelte-h="svelte-19w810t">Dataset ID Summary</h2> <table class="table bg-transparent"><tr><td data-svelte-h="svelte-16h2cxw">Dataset ID Name:</td> <td data-testid="dataset-summary-name">${escape(dataset.name)}</td></tr> <tr><td data-svelte-h="svelte-17mss8h">Dataset ID:</td> <td data-testid="dataset-summary-uuid">${escape(dataset.uuid)}</td></tr></table></section> ${validate_component(QuerySummary, "QuerySummary").$$render($$result, { query: dataset.query }, {}, {})} `;
          }();
        }(loadDataset())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-DgsIjZLa.js.map
