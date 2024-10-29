import { a as subscribe } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
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
//# sourceMappingURL=_error.svelte-CvKt2XvA.js.map
