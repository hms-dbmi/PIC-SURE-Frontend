import { x as push, z as pop } from './index-C9dy-hDW.js';
import { h as html } from './html2-FW6Ia4bL.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import './HTML-1Mhr8hI4.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { C as CollaborateSteps } from './CollaborateSteps-cb35gx5P.js';
import 'dompurify';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';

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
//# sourceMappingURL=_page.svelte-D9hpj5Qk.js.map
