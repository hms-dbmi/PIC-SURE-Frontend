import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-JjhNHhnG.js';
import { g as getConnection } from './Connections-DvSl4MbM.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { C as ConnectionForm } from './ConnectionForm-BEvbSXvm.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index2-BVONNh3m.js';
import './User-DpPjP5W7.js';
import './index-CvuFLVuQ.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let connection;
  async function load() {
    connection = await getConnection($page.params.uuid);
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-vyk77n_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Edit Connection Configuration</title>`, ""}<!-- HEAD_svelte-vyk77n_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Edit Connection",
      backUrl: "/admin/configuration",
      backTitle: "Back to Configuration"
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
            return ` <section id="connection-edit">${validate_component(ConnectionForm, "ConnectionForm").$$render($$result, { connection }, {}, {})}</section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-ro31JqFQ.js.map
