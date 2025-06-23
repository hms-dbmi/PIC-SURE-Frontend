import { x as push, a1 as head, z as pop, K as escape_html, _ as await_block } from './index-BKfiikQf.js';
import { p as page } from './index3-BXxOVXV0.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { g as getConnection } from './Connections-D53FXc8x.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { C as ConnectionForm } from './ConnectionForm-B29y2k9c.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './client2-B5hsHc_n.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './toaster-DzAsAKEJ.js';
import './index-BB9JrA1L.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-MgcOEbFF.js';
import './machine.svelte-D_VZYMjT.js';

function _page($$payload, $$props) {
  push();
  let connection = {
    id: "",
    label: "",
    subPrefix: "",
    requiredFields: ""
  };
  async function load() {
    connection = await getConnection(page.params.uuid);
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Edit Connection Configuration</title>`;
  });
  Content($$payload, {
    title: "Edit Connection",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        load(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out += `<section id="connection-edit">`;
          ConnectionForm($$payload2, { connection });
          $$payload2.out += `<!----></section>`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Bkb9Vjz_.js.map
