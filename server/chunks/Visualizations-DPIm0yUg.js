import { x as push, z as pop } from './index-BYsoXH7a.js';
import '@sveltejs/kit';
import './User-CGCqDR6a.js';
import { p as page } from './index2-DXnmzf54.js';
import './configuration-wjj69jIJ.js';
import './Filter-D4fknGLB.js';
import './Export-BN3JIXjt.js';
import { L as Loading } from './Loading-D4A6B7i5.js';

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
//# sourceMappingURL=Visualizations-DPIm0yUg.js.map
