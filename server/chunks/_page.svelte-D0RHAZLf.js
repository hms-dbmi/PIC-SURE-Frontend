import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { b as branding } from './configuration-JjhNHhnG.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { C as ConnectionForm } from './ConnectionForm-BEvbSXvm.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores2-Cy1ftf_v.js';
import './index2-BVONNh3m.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './Connections-DvSl4MbM.js';
import './User-DpPjP5W7.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-lqsgf_START -->${$$result.title = `<title>${escape(branding.applicationName)} | New Connection</title>`, ""}<!-- HEAD_svelte-lqsgf_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "New Connection",
      backUrl: "/admin/configuration",
      backTitle: "Back to Configuration"
    },
    {},
    {
      default: () => {
        return `<section id="connection-new">${validate_component(ConnectionForm, "ConnectionForm").$$render($$result, {}, {}, {})}</section>`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-D0RHAZLf.js.map
