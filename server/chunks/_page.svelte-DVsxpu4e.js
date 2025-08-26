import { x as push, z as pop } from './index-C5NonOVO.js';
import { h as html } from './html-FW6Ia4bL.js';
import 'dompurify';
import { C as Content } from './Content-DHBbMVB_.js';
import { C as CollaborateSteps } from './CollaborateSteps-DZYM0bdT.js';
import './configuration-CSskKBur.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';

function _page($$payload, $$props) {
  push();
  let introduction = "";
  let findCollaborators = "";
  Content($$payload, {
    title: "Find Collaborators",
    children: ($$payload2) => {
      $$payload2.out += `<section class="flex flex-col items-center w-full mt-8">`;
      CollaborateSteps($$payload2, { currentStep: 1 });
      $$payload2.out += `<!----></section> <section>${html(introduction)} ${html(findCollaborators)}</section>`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DVsxpu4e.js.map
