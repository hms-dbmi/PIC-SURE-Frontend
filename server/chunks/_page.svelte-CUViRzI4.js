import { x as push, a4 as head, z as pop, M as escape_html } from './index-BYsoXH7a.js';
import { C as Content } from './Content-D47GFKQW.js';
import { V as Visualizations } from './Visualizations-DPIm0yUg.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import '@sveltejs/kit';
import './User-CGCqDR6a.js';
import './index2-DXnmzf54.js';
import './Filter-D4fknGLB.js';
import 'uuid';
import './Export-BN3JIXjt.js';
import './Loading-D4A6B7i5.js';

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
//# sourceMappingURL=_page.svelte-CUViRzI4.js.map
