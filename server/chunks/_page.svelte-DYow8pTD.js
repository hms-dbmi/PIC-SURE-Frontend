import { x as push, a4 as head, z as pop, M as escape_html } from './index-BYsoXH7a.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { C as ConnectionForm } from './ConnectionForm-B-4uuB2p.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './Connections-D77ozd1n.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';
import './index2-DXnmzf54.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-BJMruCzq.js';

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
//# sourceMappingURL=_page.svelte-DYow8pTD.js.map
