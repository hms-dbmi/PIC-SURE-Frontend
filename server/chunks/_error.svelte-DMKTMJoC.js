import { x as push, M as escape_html, z as pop } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';

function _error($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}: ${escape_html(page?.error?.message ?? "An unkown error occured.")}</h1>`);
  pop();
}

export { _error as default };
//# sourceMappingURL=_error.svelte-DMKTMJoC.js.map
