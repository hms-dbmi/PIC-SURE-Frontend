import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { V as Visualizations } from './Visualizations-9iTTLEzJ.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import './utils-EiTRXYbg.js';
import './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './stores2-DM9tzbse.js';
import './index2-Bx7ZSImw.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import './ProgressRadial-D8-DtAvy.js';
import './index-DzcLzHBX.js';
import './User-D2U6RL_p.js';
import './stores3-BdNELvYD.js';
import './Filter-DOEs1vKh.js';

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
//# sourceMappingURL=_page.svelte-Dlru6Y1O.js.map
