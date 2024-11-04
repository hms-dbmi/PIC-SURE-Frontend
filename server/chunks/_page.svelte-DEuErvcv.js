import { a as subscribe } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, v as validate_component } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressRadial } from './ProgressRadial-B9eVk9uU.js';
import './client-TAfaRk9z.js';
import './Filter-DUj0k_N3.js';
import './index2-CV6P_ZFI.js';
import './exports-CTha0ECg.js';
import './User-BLfUZEEV.js';
import './index-CvuFLVuQ.js';
import './configuration-CHJZnZTS.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `<section class="w-full h-full flex flex-col justify-center items-center">${`<h1 class="m-10" data-svelte-h="svelte-jsohhr">Logging you in...</h1> ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-20" }, {}, {})}`}</section>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-DEuErvcv.js.map
