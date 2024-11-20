import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';

const Error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  console.log(page);
  $$unsubscribe_page();
  return `<h1>${escape($page.status)}: ${escape($page?.error?.message ?? "An unkown error occured.")}</h1>`;
});

export { Error as default };
//# sourceMappingURL=_error.svelte-ZB7340lu.js.map
