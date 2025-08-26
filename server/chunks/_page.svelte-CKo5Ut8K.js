import { x as push, a1 as head, z as pop, K as escape_html, X as await_block } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { g as getDataset } from './Dataset-cbZBLonT.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';

function QuerySummary($$payload, $$props) {
  push();
  let { query = {} } = $$props;
  $$payload.out += `<section id="detail-filters-container" class="m-3"><p class="font-bold text-left my-1">Filters Applied</p> <ul data-testid="dataset-summary-filters" class="primary-list"><li>query.categoryFilters: ${escape_html(JSON.stringify(query?.categoryFilters))}</li> <li>query.numericFilters: ${escape_html(JSON.stringify(query?.numericFilters))}</li> <li>query.variantInfoFilters: ${escape_html(JSON.stringify(query?.variantInfoFilters))}</li></ul></section> <section id="detail-variables-container" class="m-3"><p class="font-bold text-left my-1">Additional Variables Included in Dataset</p> <ul data-testid="dataset-summary-variables" class="primary-list"><li>query.fields: ${escape_html(JSON.stringify(query?.fields))}</li></ul></section>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  let dataset = {
    uuid: "",
    name: "",
    query: {}
  };
  async function loadDataset() {
    dataset = await getDataset(page.params.uuid);
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Dataset</title>`;
  });
  Content($$payload, {
    title: "View Dataset",
    backUrl: "/dataset",
    backTitle: "Back to Datasets",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        loadDataset(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out += `<section id="detail-summary-container" class="m-3"><h2 class="text-left my-1">Dataset ID Summary</h2> <table class="table bg-transparent"><tbody><tr><td>Dataset ID Name:</td><td data-testid="dataset-summary-name">${escape_html(dataset?.name)}</td></tr><tr><td>Dataset ID:</td><td data-testid="dataset-summary-uuid">${escape_html(dataset?.uuid)}</td></tr></tbody></table></section> `;
          QuerySummary($$payload2, { query: dataset?.query });
          $$payload2.out += `<!---->`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CKo5Ut8K.js.map
