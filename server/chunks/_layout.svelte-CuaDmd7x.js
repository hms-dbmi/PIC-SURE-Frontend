import { x as push, z as pop } from './index-DMPVr6nO.js';
import { i as initializeBranding } from './configuration-CBIXsjx2.js';
import './HTML-1Mhr8hI4.js';
import './index2-Bp7szfwE.js';
import 'dompurify';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';

function GoogleTracking($$payload, $$props) {
  push();
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  initializeBranding();
  $$payload.out.push(`<main class="w-full h-full">`);
  children?.($$payload);
  $$payload.out.push(`<!----> `);
  GoogleTracking($$payload);
  $$payload.out.push(`<!----></main>`);
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-CuaDmd7x.js.map
