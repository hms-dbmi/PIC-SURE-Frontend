import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { p as page } from './stores4-C3NPX6l0.js';
import { D as DataSetStore } from './Dataset-DkkujLLq.js';
import { b as branding } from './configuration-CJ60Yp9o.js';
import { C as Content } from './Content-DMwoUi6K.js';
import './index2-BVONNh3m.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './User-DLjB6rDR.js';
import './index-DzcLzHBX.js';
import './AngleButton-C6YzBYNH.js';

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
            return ` <section id="detail-summary-container" class="m-3"><h2 class="text-left my-1" data-svelte-h="svelte-19w810t">Dataset ID Summary</h2> <table class="table bg-transparent"><tbody><tr><td data-svelte-h="svelte-16h2cxw">Dataset ID Name:</td> <td data-testid="dataset-summary-name">${escape(dataset.name)}</td></tr> <tr><td data-svelte-h="svelte-17mss8h">Dataset ID:</td> <td data-testid="dataset-summary-uuid">${escape(dataset.uuid)}</td></tr></tbody></table></section> ${validate_component(QuerySummary, "QuerySummary").$$render($$result, { query: dataset.query }, {}, {})} `;
          }();
        }(loadDataset())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Bx99-wWq.js.map
