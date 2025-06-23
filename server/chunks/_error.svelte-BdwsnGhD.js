import { x as push, K as escape_html, T as store_get, W as unsubscribe_stores, z as pop } from './index-BKfiikQf.js';
import { p as page } from './stores-DhwnhD2d.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';

function _error($$payload, $$props) {
  push();
  var $$store_subs;
  console.log(page);
  $$payload.out += `<h1>${escape_html(store_get($$store_subs ??= {}, "$page", page).status)}: ${escape_html(store_get($$store_subs ??= {}, "$page", page)?.error?.message ?? "An unkown error occured.")}</h1>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _error as default };
//# sourceMappingURL=_error.svelte-BdwsnGhD.js.map
