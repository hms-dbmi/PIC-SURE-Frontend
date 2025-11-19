import { x as push, z as pop } from './index-DMPVr6nO.js';
import { h as html } from './html2-FW6Ia4bL.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import './HTML-1Mhr8hI4.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { C as CollaborateSteps } from './CollaborateSteps-BrPqJBZZ.js';
import 'dompurify';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';

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
//# sourceMappingURL=_page.svelte-B85IEm1L.js.map
