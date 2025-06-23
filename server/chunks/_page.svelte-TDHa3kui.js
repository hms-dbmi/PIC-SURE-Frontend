import { x as push, a1 as head, z as pop, K as escape_html } from './index-BKfiikQf.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { C as ConnectionForm } from './ConnectionForm-B29y2k9c.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './Connections-D53FXc8x.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './toaster-DzAsAKEJ.js';
import './index-BB9JrA1L.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-MgcOEbFF.js';

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
//# sourceMappingURL=_page.svelte-TDHa3kui.js.map
