import { x as push, M as escape_html, z as pop } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';

function Error($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  pop();
}

export { Error as default };
//# sourceMappingURL=error.svelte-DFUu7Ovr.js.map
