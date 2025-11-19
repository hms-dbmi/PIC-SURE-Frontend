import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block } from './index-DMPVr6nO.js';
import { p as page } from './index2-Bp7szfwE.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { g as getConnection } from './Connections-Bb_icnG_.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { C as ConnectionForm } from './ConnectionForm-BaK8bqMG.js';
import { L as Loading } from './Loading-DAyWVuL0.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './User-01eW3TFo.js';
import '@sveltejs/kit';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-BrAljl0x.js';

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
//# sourceMappingURL=_page.svelte-CflLjsV_.js.map
