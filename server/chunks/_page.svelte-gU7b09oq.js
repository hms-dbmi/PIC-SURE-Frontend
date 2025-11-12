import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block, S as ensure_array_like } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import { g as getDataset } from './Dataset-BaGv2-UL.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';

function QuerySummary($$payload, $$props) {
  push();
  let { query = {} } = $$props;
  const fieldList = Object.entries({
    fields: query?.fields,
    requiredFields: query?.requiredFields,
    anyRecordOf: query?.anyRecordOf,
    anyRecordOfMulti: query?.anyRecordOfMulti?.flat(),
    crossCountFields: query?.crossCountFields
  });
  const each_array = ensure_array_like(fieldList);
  $$payload.out.push(`<section id="detail-filters-container" class="m-3"><p class="font-bold text-left my-1">Filters Applied</p> <ul data-testid="dataset-summary-filters" class="primary-list"><li>query.categoryFilters: ${escape_html(JSON.stringify(query?.categoryFilters))}</li> <li>query.numericFilters: ${escape_html(JSON.stringify(query?.numericFilters))}</li> <li>query.variantInfoFilters: ${escape_html(JSON.stringify(query?.variantInfoFilters))}</li></ul></section> <section id="detail-variables-container" class="m-3"><p class="font-bold text-left my-1">Additional Variables Included in Dataset</p> <ul data-testid="dataset-summary-variables" class="primary-list"><!--[-->`);
  for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
    let [key, fields] = each_array[$$index_1];
    $$payload.out.push(`<li>${escape_html(key)}: `);
    if (fields) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(fields);
      $$payload.out.push(`<ul class="ml-4"><!--[-->`);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let field = each_array_1[$$index];
        $$payload.out.push(`<li>${escape_html(field.split("\\").filter(Boolean).join(" > "))}</li>`);
      }
      $$payload.out.push(`<!--]--></ul>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></li>`);
  }
  $$payload.out.push(`<!--]--></ul></section>`);
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
          $$payload2.out.push(`<section id="detail-summary-container" class="m-3"><h2 class="text-left my-1">Dataset ID Summary</h2> <table class="table bg-transparent"><tbody><tr><td>Dataset ID Name:</td><td data-testid="dataset-summary-name">${escape_html(dataset?.name)}</td></tr><tr><td>Dataset ID:</td><td data-testid="dataset-summary-uuid">${escape_html(dataset?.uuid)}</td></tr></tbody></table></section> `);
          QuerySummary($$payload2, { query: dataset?.query });
          $$payload2.out.push(`<!---->`);
        }
      );
      $$payload2.out.push(`<!--]-->`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-gU7b09oq.js.map
