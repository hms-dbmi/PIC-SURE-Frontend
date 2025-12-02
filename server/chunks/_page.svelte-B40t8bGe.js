import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { g as getConnection } from './Connections-4SliUl-7.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { C as ConnectionForm } from './ConnectionForm-CoalBzKj.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-BNxDBqzK.js';

function _page($$payload, $$props) {
  push();
  let connection = { id: "", label: "", subPrefix: "", requiredFields: "" };
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
          $$payload2.out.push(`<section id="connection-edit">`);
          ConnectionForm($$payload2, { connection });
          $$payload2.out.push(`<!----></section>`);
        }
      );
      $$payload2.out.push(`<!--]-->`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B40t8bGe.js.map
