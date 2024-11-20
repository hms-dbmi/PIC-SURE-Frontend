import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import './client-TAfaRk9z.js';
import './Filter-DDQi75i9.js';
import './index2-BVONNh3m.js';
import './exports-CTha0ECg.js';
import './User-Dh89vg_C.js';
import './index-CvuFLVuQ.js';
import './configuration-zUcJ0Kpb.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `<section class="w-full h-full flex flex-col justify-center items-center">${`<h1 class="m-10" data-svelte-h="svelte-jsohhr">Logging you in...</h1> ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-20" }, {}, {})}`}</section>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Bp0EXYjN.js.map
