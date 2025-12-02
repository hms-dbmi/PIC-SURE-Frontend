import { x as push, z as pop } from './index-C9dy-hDW.js';
import '@sveltejs/kit';
import './User-CeJunCPd.js';
import { p as page } from './index2-CFqWCRce.js';
import './configuration-BAm0JRx1.js';
import './Filter-DSKDPPqy.js';
import './Export-DV6CwdT5.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';

function Visualizations($$payload, $$props) {
  push();
  page.url.pathname.includes("/discover");
  $$payload.out.push(`<p class="mb-8 text-center">All visualizations display the distributions of each variable filter for the specified cohort.</p> <div id="visualizations" class="flex flex-row flex-wrap gap-6 items-center justify-center">`);
  {
    $$payload.out.push("<!--[-->");
    Loading($$payload, { ring: true, size: "medium" });
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}

export { Visualizations as V };
//# sourceMappingURL=Visualizations-DUzXvUnf.js.map
