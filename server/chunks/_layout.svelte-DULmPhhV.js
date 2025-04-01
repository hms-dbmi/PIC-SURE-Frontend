import { c as create_ssr_component, v as validate_component } from './ssr-BRJpAXVH.js';
import { i as initializeModalStore } from './stores-CeRLSJyW.js';
import { i as initializeToastStore } from './stores2-Cy1ftf_v.js';
import { i as initializeDrawerStore } from './stores3-BYOElYDy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { i as initializeBranding } from './configuration-DBHGr3VN.js';
import { a as subscribe } from './lifecycle-DtuISP6h.js';
import 'gtagjs';
import { p as page } from './stores4-C3NPX6l0.js';
import './index2-BVONNh3m.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';

function initializeStores() {
  initializeModalStore();
  initializeToastStore();
  initializeDrawerStore();
}
const GoogleTracking = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-1wk68kl_START -->${``}${``}<!-- HEAD_svelte-1wk68kl_END -->`, ""} ${``}`;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  initializeStores();
  initializeBranding();
  return ` ${``} <main class="w-full h-full">${slots.default ? slots.default({}) : ``} ${validate_component(GoogleTracking, "GoogleTracking").$$render($$result, {}, {}, {})}</main>`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-DULmPhhV.js.map
