import { x as push, a8 as head, z as pop, M as escape_html } from './index-C9dy-hDW.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { C as ConnectionForm } from './ConnectionForm-CoalBzKj.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './Connections-4SliUl-7.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';
import './index2-CFqWCRce.js';
import './Connection-DRlqdxWD.js';
import './ErrorAlert-BNxDBqzK.js';

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
//# sourceMappingURL=_page.svelte-Czj3AJJy.js.map
