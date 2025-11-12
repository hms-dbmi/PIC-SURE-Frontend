import { x as push, z as pop } from './index-BYsoXH7a.js';
import { h as html } from './html2-FW6Ia4bL.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import './HTML-1Mhr8hI4.js';
import { C as Content } from './Content-D47GFKQW.js';
import { C as CollaborateSteps } from './CollaborateSteps-BYwgtoGb.js';
import 'dompurify';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';

function _page($$payload, $$props) {
  push();
  let introduction = "";
  let access = "";
  let examples = "";
  Content($$payload, {
    title: `Analyze with ${branding.analysisConfig.analysis.platform}`,
    children: ($$payload2) => {
      $$payload2.out.push(`<section class="flex flex-col items-center w-full mt-8">`);
      CollaborateSteps($$payload2, { currentStep: 3 });
      $$payload2.out.push(`<!----></section> <div class="flex flex-col gap-4 w-full items-center mb-8">${html(introduction)} ${html(access)} ${html(examples)}</div>`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CADFyZZ5.js.map
