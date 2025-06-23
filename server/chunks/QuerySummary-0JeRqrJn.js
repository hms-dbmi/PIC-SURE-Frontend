import { x as push, K as escape_html, z as pop } from './index-BKfiikQf.js';

function QuerySummary($$payload, $$props) {
  push();
  let { query = {} } = $$props;
  $$payload.out += `<section id="detail-filters-container" class="m-3"><p class="font-bold text-left my-1">Filters Applied</p> <ul data-testid="dataset-summary-filters" class="primary-list"><li>query.categoryFilters: ${escape_html(JSON.stringify(query?.categoryFilters))}</li> <li>query.numericFilters: ${escape_html(JSON.stringify(query?.numericFilters))}</li> <li>query.variantInfoFilters: ${escape_html(JSON.stringify(query?.variantInfoFilters))}</li></ul></section> <section id="detail-variables-container" class="m-3"><p class="font-bold text-left my-1">Additional Variables Included in Dataset</p> <ul data-testid="dataset-summary-variables" class="primary-list"><li>query.fields: ${escape_html(JSON.stringify(query?.fields))}</li></ul></section>`;
  pop();
}

export { QuerySummary as Q };
//# sourceMappingURL=QuerySummary-0JeRqrJn.js.map
