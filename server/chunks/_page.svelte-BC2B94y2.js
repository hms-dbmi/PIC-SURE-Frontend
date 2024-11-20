import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-D53qfAxy.js';
import { V as Visualizations } from './Visualizations-DRtPYPL4.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores2-Cy1ftf_v.js';
import './index2-BVONNh3m.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './index-CvuFLVuQ.js';
import './User-Dh89vg_C.js';
import './stores4-B2YFsTYy.js';
import './Filter-DDQi75i9.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-1ilvs5g_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Distributions</title>`, ""}<!-- HEAD_svelte-1ilvs5g_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      full: true,
      backUrl: "/discover",
      backTitle: "Back to Discover",
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
//# sourceMappingURL=_page.svelte-BC2B94y2.js.map
