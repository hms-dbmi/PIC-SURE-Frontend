import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-C9dy-hDW.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { P as PrivilegeForm } from './PrivilegeForm-IVN8aMrr.js';
import { A as ApplicationStore } from './Application-9Kgpxgs5.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './Privileges-CfGQH9Ip.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';
import './index2-CFqWCRce.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { applicationList, loadApplications } = ApplicationStore;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New Privilege</title>`;
  });
  Content($$payload, {
    title: "New Privilege",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        loadApplications(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out.push(`<section id="privilege-new">`);
          PrivilegeForm($$payload2, {
            applicationList: store_get($$store_subs ??= {}, "$applicationList", applicationList)
          });
          $$payload2.out.push(`<!----></section>`);
        }
      );
      $$payload2.out.push(`<!--]-->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BDX5AwMv.js.map
