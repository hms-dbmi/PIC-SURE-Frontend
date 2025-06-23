import { x as push, z as pop } from './index-BKfiikQf.js';
import { i as initializeBranding, b as branding, s as settings } from './configuration-D-fruRXg.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';

function GoogleTracking($$payload, $$props) {
  push();
  const googleTag = settings.google.tagManager;
  googleTag && branding?.privacyPolicy?.url && branding?.privacyPolicy?.title;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  initializeBranding();
  $$payload.out += `<main class="w-full h-full">`;
  children?.($$payload);
  $$payload.out += `<!----> `;
  GoogleTracking($$payload);
  $$payload.out += `<!----></main>`;
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-C_qp-r_P.js.map
