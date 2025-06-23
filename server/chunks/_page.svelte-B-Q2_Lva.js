import { x as push, a1 as head, z as pop, K as escape_html } from './index-BKfiikQf.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { V as Visualizations } from './Visualizations-CJqHd8iN.js';
import { b as branding } from './configuration-D-fruRXg.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './index2-CvuFLVuQ.js';
import './User-DPh8mmLT.js';
import './stores-DhwnhD2d.js';
import './Filter-4LYIgLGB.js';
import './Export-cYFOztwS.js';
import './toaster-DzAsAKEJ.js';
import './index-BB9JrA1L.js';
import './Loading-DKkczq09.js';
import './machine.svelte-D_VZYMjT.js';

function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Distributions</title>`;
  });
  Content($$payload, {
    full: true,
    backUrl: "/explorer",
    backTitle: "Back to Explore",
    title: "Variable Distributions",
    children: ($$payload2) => {
      Visualizations($$payload2);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B-Q2_Lva.js.map
