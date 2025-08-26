import { x as push, a1 as head, z as pop, K as escape_html } from './index-C5NonOVO.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { V as Visualizations } from './Visualizations-tbXJOOem.js';
import { b as branding } from './configuration-CSskKBur.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './index2-CvuFLVuQ.js';
import './User-ByrNDeqq.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import './Filter-BUwQwcV6.js';
import 'uuid';
import './Export-CTQ_v_3l.js';
import './Loading-Drx6gnkR.js';

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
//# sourceMappingURL=_page.svelte-DvDmD9-T.js.map
