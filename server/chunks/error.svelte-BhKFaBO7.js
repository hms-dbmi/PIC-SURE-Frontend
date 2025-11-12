import { x as push, M as escape_html, z as pop } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';

function Error($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  pop();
}

export { Error as default };
//# sourceMappingURL=error.svelte-BhKFaBO7.js.map
