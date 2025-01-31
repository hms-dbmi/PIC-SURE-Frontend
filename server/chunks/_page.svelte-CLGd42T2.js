import { a as subscribe, o as onDestroy, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-BRJpAXVH.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import './client-BR749xJD.js';
import { E as ExportType, s as settings, f as features, b as branding } from './configuration-BRozmRr_.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { E as ErrorAlert } from './ErrorAlert-DgLOjAhF.js';
import { T as Table } from './Table-BH3DMZ1c.js';
import { w as writable } from './index2-BVONNh3m.js';
import './index-DzcLzHBX.js';
import './User-BiqhXRJx.js';
import './Filter-I5n8y1H4.js';
import './exports-kR70XCWV.js';
import './AngleButton-C6YzBYNH.js';
import './Row-DZ3u2TX9.js';
import './stores4-C3NPX6l0.js';

const count = writable(0);
const columns = writable([]);
const data = writable([]);
const downloadUrl = writable("");
writable(ExportType.Aggregate);
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $count, $$unsubscribe_count;
  let $downloadUrl, $$unsubscribe_downloadUrl;
  let $data, $$unsubscribe_data;
  let $columns, $$unsubscribe_columns;
  $$unsubscribe_count = subscribe(count, (value) => $count = value);
  $$unsubscribe_downloadUrl = subscribe(downloadUrl, (value) => $downloadUrl = value);
  $$unsubscribe_data = subscribe(data, (value) => $data = value);
  $$unsubscribe_columns = subscribe(columns, (value) => $columns = value);
  getToastStore();
  let loading;
  let aggregateCheckbox = settings.variantExplorer.type === ExportType.Full;
  onDestroy(() => {
  });
  $$unsubscribe_count();
  $$unsubscribe_downloadUrl();
  $$unsubscribe_data();
  $$unsubscribe_columns();
  return `${$$result.head += `<!-- HEAD_svelte-s876e9_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Variant Explorer</title>`, ""}<!-- HEAD_svelte-s876e9_END -->`, ""} ${$downloadUrl ? `<div><a data-testid="variant-download-btn" class="btn variant-ghost-primary mt-8 mr-6 float-right"${add_attribute("href", $downloadUrl, 0)} download="variantData.tsv">Download Variant${escape(aggregateCheckbox ? " (Aggregate)" : "")} Data</a></div>` : ``} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      full: true,
      backUrl: "/explorer",
      backTitle: "Back to Explore"
    },
    {},
    {
      default: () => {
        return `${features.explorer.variantExplorer ? `<h2 class="text-center clear-both" data-svelte-h="svelte-n8q177">Variant Explorer</h2> ${function(__value) {
          if (is_promise(__value)) {
            __value.then(null, noop);
            return ` ${$count > 0 ? `<div data-testid="variant-count" class="flex-none w-full">${escape($count)} variants found</div>` : ``} <h3 class="text-left" data-svelte-h="svelte-16fo5h6">Loading</h3> ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
          }
          return function() {
            return ` ${$count > settings.variantExplorer.maxCount ? `<aside class="alert variant-filled-warning"><i class="fa-solid fa-triangle-exclamation text-4xl"></i> <div class="alert-message"><p>Too many variants! Found ${escape($count)}, but cannot display more than
              ${escape(settings.variantExplorer.maxCount)} variants.</p></div></aside> <p></p>` : `${$count > 0 && $data.length > 0 ? `${validate_component(Table, "Datatable").$$render(
              $$result,
              {
                tableName: "variant-explorer",
                data: $data,
                columns: $columns,
                defaultRowsPerPage: 10,
                fullWidth: true,
                search: true
              },
              {},
              {
                tableActions: () => {
                  return `<div class="flex-auto flex items-end justify-between">${$count > 0 ? `<div data-testid="variant-count" class=""><p>${escape($count)} variants found</p></div>` : ``} ${settings.variantExplorer.type === ExportType.Full ? `<div class=""><label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${add_attribute("checked", aggregateCheckbox, 1)}> <p data-svelte-h="svelte-3s6voj">Aggregate data</p></label></div>` : ``}</div>`;
                }
              }
            )}` : `<div data-testid="variant-count" class="flex-none w-full">${escape($count)} variants found</div>`}`} `;
          }();
        }(loading)}` : `<h3 data-svelte-h="svelte-10ts0do">Variant Explorer</h3> ${validate_component(ErrorAlert, "ErrorAlert").$$render($$result, { title: "Error" }, {}, {
          default: () => {
            return `<p data-svelte-h="svelte-okrpxb">Variant explorer feature has not been enabled in this environment. Please contact an admin
        if you have any questions.</p>`;
          }
        })}`}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CLGd42T2.js.map
