import { x as push, M as escape_html, z as pop } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';

function _error($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}: ${escape_html(page?.error?.message ?? "An unkown error occured.")}</h1>`);
  pop();
}

export { _error as default };
//# sourceMappingURL=_error.svelte-CkeU3Wnn.js.map
