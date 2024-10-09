import { s as subscribe } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';

const Error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_page();
  return `<h1>${escape($page.status)}: ${escape($page?.error?.message ?? "An unkown error occured.")}</h1>`;
});

export { Error as default };
//# sourceMappingURL=_error.svelte-w9oDXfAC.js.map
