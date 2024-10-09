import { s as subscribe } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, v as validate_component } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressRadial } from './ProgressRadial-D8-DtAvy.js';
import './client-DpIAX_q0.js';
import './Filter-DOEs1vKh.js';
import './index2-Bx7ZSImw.js';
import './exports-BGi7-Rnc.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';
import './configuration-5_HU3Jec.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `<section class="w-full h-full flex flex-col justify-center items-center">${`<h1 class="m-10" data-svelte-h="svelte-jsohhr">Logging you in...</h1> ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-20" }, {}, {})}`}</section>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-DKBXLAKJ.js.map
