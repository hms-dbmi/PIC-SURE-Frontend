import { x as push, a1 as head, z as pop, K as escape_html, X as await_block } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding } from './configuration-CSskKBur.js';
import { g as getConnection } from './Connections-DSrr5djm.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { C as ConnectionForm } from './ConnectionForm-C9Og6LTI.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-Sg5STlCJ.js';

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
//# sourceMappingURL=_page.svelte-BUtCCu1I.js.map
