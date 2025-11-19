import { x as push, M as escape_html, z as pop } from './index-DMPVr6nO.js';
import { p as page } from './index2-Bp7szfwE.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';

function Error($$payload, $$props) {
  push();
  $$payload.out.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  pop();
}

export { Error as default };
//# sourceMappingURL=error.svelte-BHw9lUcU.js.map
