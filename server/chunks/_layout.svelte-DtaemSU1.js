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
  $$payload.out += `<div class="alert-banner svelte-1vodcxz"><p>Because of a lapse in government funding, the information on this website may not be up to date,
    transactions submitted via the website may not be processed, and the agency may not be able to
    respond to inquiries until appropriations are enacted. The NIH Clinical Center (the research
    hospital of NIH) is open. For more details about its operating status, please visit <a href="http://cc.nih.gov/" class="anchor" target="_blank" rel="noopener noreferrer">cc.nih.gov.</a> Updates regarding government operating status and resumption of normal operations can be found at <a href="http://opm.gov/" class="anchor" target="_blank" rel="noopener noreferrer">opm.gov.</a></p></div> <main class="w-full h-full">`;
  children?.($$payload);
  $$payload.out += `<!----> `;
  GoogleTracking($$payload);
  $$payload.out += `<!----></main>`;
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-DtaemSU1.js.map
