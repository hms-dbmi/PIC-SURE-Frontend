import { x as push, M as escape_html, z as pop } from './index-DMPVr6nO.js';
import { p as page } from './index2-Bp7szfwE.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';

function _error($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}: ${escape_html(page?.error?.message ?? "An unkown error occured.")}</h1>`);
  pop();
}

export { _error as default };
//# sourceMappingURL=_error.svelte-BJ9hbBHG.js.map
