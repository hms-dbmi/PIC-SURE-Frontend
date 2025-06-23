import { x as push, a1 as head, T as store_get, N as attr, K as escape_html, W as unsubscribe_stores, z as pop, _ as await_block } from './index-BKfiikQf.js';
import { o as onDestroy } from './machine.svelte-D_VZYMjT.js';
import './client-HRCS46UK.js';
import { s as settings, E as ExportType, b as branding } from './configuration-D-fruRXg.js';
import './toaster-DzAsAKEJ.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { E as ErrorAlert } from './ErrorAlert-MgcOEbFF.js';
import { S as StaticTable } from './StaticTable-DpzYDOnO.js';
import { w as writable } from './exports-CKriv3vT.js';
import './index2-CvuFLVuQ.js';
import './User-DPh8mmLT.js';
import './Filter-4LYIgLGB.js';
import './Export-cYFOztwS.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './index-BB9JrA1L.js';
import './Dictionary-DkgC0mju.js';
import './stores-DhwnhD2d.js';
import './RemoteTable-DsZbuyUA.js';
import './AddFilter-BMouBxmg.js';
import './OptionsSelectionList-BuyVKVAm.js';

const count = writable(0);
const columns = writable([]);
const data = writable([]);
const downloadUrl = writable("");
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let loading = Promise.resolve();
  let aggregateCheckbox = settings.variantExplorer.type === ExportType.Full;
  onDestroy(() => {
  });
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Variant Explorer</title>`;
  });
  if (store_get($$store_subs ??= {}, "$downloadUrl", downloadUrl)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div><a data-testid="variant-download-btn" class="btn preset-tonal-primary border border-primary-500 mt-8 mr-6 float-right"${attr("href", store_get($$store_subs ??= {}, "$downloadUrl", downloadUrl))} download="variantData.tsv">Download Variant${escape_html(aggregateCheckbox ? " (Aggregate)" : "")} Data</a></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  Content($$payload, {
    full: true,
    backUrl: "/explorer",
    backTitle: "Back to Explore",
    children: ($$payload2) => {
      {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<h2 class="text-center clear-both">Variant Explorer</h2> `;
        await_block(
          $$payload2,
          loading,
          () => {
            if (store_get($$store_subs ??= {}, "$count", count) > 0) {
              $$payload2.out += "<!--[-->";
              $$payload2.out += `<div data-testid="variant-count" class="flex-none w-full">${escape_html(store_get($$store_subs ??= {}, "$count", count))} variants found</div>`;
            } else {
              $$payload2.out += "<!--[!-->";
            }
            $$payload2.out += `<!--]--> `;
            Loading($$payload2, {});
            $$payload2.out += `<!---->`;
          },
          () => {
            if (store_get($$store_subs ??= {}, "$count", count) > settings.variantExplorer.maxCount) {
              $$payload2.out += "<!--[-->";
              ErrorAlert($$payload2, {
                color: "warning",
                children: ($$payload3) => {
                  $$payload3.out += `<!---->Too many variants! Found ${escape_html(store_get($$store_subs ??= {}, "$count", count))}, but cannot display more than
          ${escape_html(settings.variantExplorer.maxCount)} variants.`;
                }
              });
            } else if (store_get($$store_subs ??= {}, "$count", count) > 0 && store_get($$store_subs ??= {}, "$data", data).length > 0) {
              $$payload2.out += "<!--[1-->";
              {
                let tableActions = function($$payload3) {
                  $$payload3.out += `<div class="flex-auto flex items-end justify-between">`;
                  if (store_get($$store_subs ??= {}, "$count", count) > 0) {
                    $$payload3.out += "<!--[-->";
                    $$payload3.out += `<div data-testid="variant-count"><p>${escape_html(store_get($$store_subs ??= {}, "$count", count))} variants found</p></div>`;
                  } else {
                    $$payload3.out += "<!--[!-->";
                  }
                  $$payload3.out += `<!--]--> `;
                  if (settings.variantExplorer.type === ExportType.Full) {
                    $$payload3.out += "<!--[-->";
                    $$payload3.out += `<div><label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${attr("checked", aggregateCheckbox, true)}/> <p>Aggregate data</p></label></div>`;
                  } else {
                    $$payload3.out += "<!--[!-->";
                  }
                  $$payload3.out += `<!--]--></div>`;
                };
                StaticTable($$payload2, {
                  tableName: "variant-explorer",
                  data: store_get($$store_subs ??= {}, "$data", data),
                  columns: store_get($$store_subs ??= {}, "$columns", columns),
                  fullWidth: true,
                  searchable: true,
                  tableActions,
                  $$slots: { tableActions: true }
                });
              }
            } else {
              $$payload2.out += "<!--[!-->";
              $$payload2.out += `<div data-testid="variant-count" class="flex-none w-full">${escape_html(store_get($$store_subs ??= {}, "$count", count))} variants found</div>`;
            }
            $$payload2.out += `<!--]-->`;
          }
        );
        $$payload2.out += `<!--]-->`;
      }
      $$payload2.out += `<!--]-->`;
    }
  });
  $$payload.out += `<!---->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-ewoht45o.js.map
