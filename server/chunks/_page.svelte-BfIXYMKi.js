import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import './client-BR749xJD.js';
import './Filter-C4oAigXk.js';
import './index2-BVONNh3m.js';
import './exports-kR70XCWV.js';
import './User-DLjB6rDR.js';
import './index-DzcLzHBX.js';
import './configuration-CJ60Yp9o.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `<section class="w-full h-full flex flex-col justify-center items-center">${`<h1 class="m-10" data-svelte-h="svelte-jsohhr">Logging you in...</h1> ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-20" }, {}, {})}`}</section>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BfIXYMKi.js.map
