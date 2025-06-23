import { x as push, T as store_get, W as unsubscribe_stores, z as pop } from './index-BKfiikQf.js';
import './configuration-D-fruRXg.js';
import './index2-CvuFLVuQ.js';
import './User-DPh8mmLT.js';
import { p as page } from './stores-DhwnhD2d.js';
import './Filter-4LYIgLGB.js';
import './Export-cYFOztwS.js';
import './toaster-DzAsAKEJ.js';
import { L as Loading } from './Loading-DKkczq09.js';

function Visualizations($$payload, $$props) {
  push();
  var $$store_subs;
  store_get($$store_subs ??= {}, "$page", page).url.pathname.includes("/discover");
  $$payload.out += `<p class="mb-8 text-center">All visualizations display the distributions of each variable filter for the specified cohort.</p> <div id="visualizations" class="flex flex-row flex-wrap gap-6 items-center justify-center">`;
  {
    $$payload.out += "<!--[-->";
    Loading($$payload, { ring: true, size: "medium" });
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { Visualizations as V };
//# sourceMappingURL=Visualizations-CJqHd8iN.js.map
