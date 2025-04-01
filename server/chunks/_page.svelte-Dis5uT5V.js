import { a as subscribe, o as onDestroy } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, a as add_attribute, v as validate_component } from './ssr-BRJpAXVH.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './client-BR749xJD.js';
import { s as settings, b as branding } from './configuration-DBHGr3VN.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { E as ErrorAlert } from './ErrorAlert-DgLOjAhF.js';
import { w as writable } from './index2-BVONNh3m.js';
import './index-CvuFLVuQ.js';
import './User-fDnXlPjS.js';
import './Filter-DGDHgVxd.js';
import './exports-kR70XCWV.js';
import './AngleButton-C6YzBYNH.js';
import './stores4-C3NPX6l0.js';

var ExportType = /* @__PURE__ */ ((ExportType2) => {
  ExportType2["Full"] = "full";
  ExportType2["Aggregate"] = "aggregate";
  return ExportType2;
})(ExportType || {});
const count = writable(0);
const columns = writable([]);
const data = writable([]);
const downloadUrl = writable("");
writable(ExportType.Aggregate);
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_count;
  let $downloadUrl, $$unsubscribe_downloadUrl;
  let $$unsubscribe_data;
  let $$unsubscribe_columns;
  $$unsubscribe_count = subscribe(count, (value) => value);
  $$unsubscribe_downloadUrl = subscribe(downloadUrl, (value) => $downloadUrl = value);
  $$unsubscribe_data = subscribe(data, (value) => value);
  $$unsubscribe_columns = subscribe(columns, (value) => value);
  getToastStore();
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
        return `${`<h3 data-svelte-h="svelte-10ts0do">Variant Explorer</h3> ${validate_component(ErrorAlert, "ErrorAlert").$$render($$result, { title: "Error" }, {}, {
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
//# sourceMappingURL=_page.svelte-Dis5uT5V.js.map
