import { x as push, a1 as head, z as pop, K as escape_html } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { C as ConnectionForm } from './ConnectionForm-C9Og6LTI.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './Connections-DSrr5djm.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-Sg5STlCJ.js';

function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New Connection</title>`;
  });
  Content($$payload, {
    title: "New Connection",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      $$payload2.out += `<section id="connection-new">`;
      ConnectionForm($$payload2, {});
      $$payload2.out += `<!----></section>`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BBOsboXT.js.map
