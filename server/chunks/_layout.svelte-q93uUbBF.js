import { x as push, z as pop } from './index-BYsoXH7a.js';
import { i as initializeBranding, b as branding, s as settings } from './configuration-wjj69jIJ.js';
import './HTML-1Mhr8hI4.js';
import './index2-DXnmzf54.js';
import 'dompurify';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';

function GoogleTracking($$payload, $$props) {
  push();
  const googleTag = settings.google.tagManager;
  googleTag && branding?.privacyPolicy?.url && branding?.privacyPolicy?.title;
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
//# sourceMappingURL=_layout.svelte-q93uUbBF.js.map
