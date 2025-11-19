import { x as push, a8 as head, z as pop, M as escape_html } from './index-DMPVr6nO.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { C as ConnectionForm } from './ConnectionForm-BaK8bqMG.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './Connections-Bb_icnG_.js';
import './User-01eW3TFo.js';
import '@sveltejs/kit';
import './index2-Bp7szfwE.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-BrAljl0x.js';

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
      $$payload2.out.push(`<section id="connection-new">`);
      ConnectionForm($$payload2, {});
      $$payload2.out.push(`<!----></section>`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-C3ya3u9X.js.map
