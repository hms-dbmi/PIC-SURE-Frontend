import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { V as Visualizations } from './Visualizations-uweXA7ow.js';
import { b as branding } from './configuration-DBHGr3VN.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores2-Cy1ftf_v.js';
import './index2-BVONNh3m.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './index-CvuFLVuQ.js';
import './User-fDnXlPjS.js';
import './stores4-C3NPX6l0.js';
import './Filter-DGDHgVxd.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-1ilvs5g_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Distributions</title>`, ""}<!-- HEAD_svelte-1ilvs5g_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      full: true,
      backUrl: "/explorer",
      backTitle: "Back to Explore",
      title: "Variable Distributions"
    },
    {},
    {
      default: () => {
        return `${validate_component(Visualizations, "Visualizations").$$render($$result, {}, {}, {})}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-uf5BgOnH.js.map
