import { x as push, a1 as head, z as pop, K as escape_html, _ as await_block } from './index-BKfiikQf.js';
import { p as page } from './index3-BXxOVXV0.js';
import { g as getDataset } from './Dataset-97Skq8nn.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { Q as QuerySummary } from './QuerySummary-0JeRqrJn.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './client2-B5hsHc_n.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './index-BB9JrA1L.js';
import './machine.svelte-D_VZYMjT.js';

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
//# sourceMappingURL=_page.svelte-m6wf7Ucq.js.map
