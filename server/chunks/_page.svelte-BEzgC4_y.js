import { x as push, z as pop } from './index-BYsoXH7a.js';
import { h as html } from './html2-FW6Ia4bL.js';
import './configuration-wjj69jIJ.js';
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
  let findCollaborators = "";
  Content($$payload, {
    title: "Find Collaborators",
    children: ($$payload2) => {
      $$payload2.out.push(`<section class="flex flex-col items-center w-full mt-8">`);
      CollaborateSteps($$payload2, { currentStep: 1 });
      $$payload2.out.push(`<!----></section> <section>${html(introduction)} ${html(findCollaborators)}</section>`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BEzgC4_y.js.map
