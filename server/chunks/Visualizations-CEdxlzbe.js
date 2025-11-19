import { x as push, z as pop } from './index-DMPVr6nO.js';
import '@sveltejs/kit';
import './User-01eW3TFo.js';
import { p as page } from './index2-Bp7szfwE.js';
import './configuration-CBIXsjx2.js';
import './Filter-Bhec34ty.js';
import './Export-B3PQrADV.js';
import { L as Loading } from './Loading-DAyWVuL0.js';

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
//# sourceMappingURL=Visualizations-CEdxlzbe.js.map
