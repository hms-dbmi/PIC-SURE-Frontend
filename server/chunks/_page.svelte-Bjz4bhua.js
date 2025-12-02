import { x as push, a8 as head, z as pop, M as escape_html } from './index-C9dy-hDW.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { V as Visualizations } from './Visualizations-DUzXvUnf.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import '@sveltejs/kit';
import './User-CeJunCPd.js';
import './index2-CFqWCRce.js';
import './Filter-DSKDPPqy.js';
import 'uuid';
import './Export-DV6CwdT5.js';
import './Loading-Bei-CWQ1.js';

function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Distributions</title>`;
  });
  Content($$payload, {
    full: true,
    backUrl: "/discover",
    backTitle: "Back to Discover",
    title: "Variable Distributions",
    children: ($$payload2) => {
      Visualizations($$payload2);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Bjz4bhua.js.map
