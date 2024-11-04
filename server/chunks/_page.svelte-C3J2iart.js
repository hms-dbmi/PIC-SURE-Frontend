import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { C as Content } from './Content-BUgV6smf.js';
import { V as Visualizations } from './Visualizations-TCjZCGi_.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import './lifecycle-GVhEEkqU.js';
import './AngleButton-Cxjzo9QZ.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores2-DrFt-twL.js';
import './index2-CV6P_ZFI.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import './ProgressRadial-B9eVk9uU.js';
import './index-CvuFLVuQ.js';
import './User-BLfUZEEV.js';
import './stores3-DsZ2QG0u.js';
import './Filter-DUj0k_N3.js';

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
//# sourceMappingURL=_page.svelte-C3J2iart.js.map
