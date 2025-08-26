import { x as push, z as pop } from './index-C5NonOVO.js';
import { i as initializeBranding, b as branding, s as settings } from './configuration-CSskKBur.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';

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
//# sourceMappingURL=_layout.svelte-Dn3VGpPh.js.map
