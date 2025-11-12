import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { g as getConnection } from './Connections-D77ozd1n.js';
import { C as Content } from './Content-D47GFKQW.js';
import { C as ConnectionForm } from './ConnectionForm-B-4uuB2p.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-BJMruCzq.js';

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
//# sourceMappingURL=_page.svelte-C1nO63aC.js.map
