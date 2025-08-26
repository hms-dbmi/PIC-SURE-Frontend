import { x as push, z as pop } from './index-C5NonOVO.js';
import { h as html } from './html-FW6Ia4bL.js';
import 'dompurify';
import { C as Content } from './Content-DHBbMVB_.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as CollaborateSteps } from './CollaborateSteps-DZYM0bdT.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';

function _page($$payload, $$props) {
  push();
  let introduction = "";
  let access = "";
  let examples = "";
  Content($$payload, {
    title: `Analyze with ${branding.analysisConfig.analysis.platform}`,
    children: ($$payload2) => {
      $$payload2.out += `<section class="flex flex-col items-center w-full mt-8">`;
      CollaborateSteps($$payload2, { currentStep: 3 });
      $$payload2.out += `<!----></section> <div class="flex flex-col gap-4 w-full items-center mb-8">${html(introduction)} ${html(access)} ${html(examples)}</div>`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CwnjZ9hi.js.map
