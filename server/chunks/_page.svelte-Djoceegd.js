import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { P as PrivilegeForm } from './PrivilegeForm-IVN8aMrr.js';
import { g as getPrivilege } from './Privileges-CfGQH9Ip.js';
import { a as applicationList, l as loadApplications } from './Application-9Kgpxgs5.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let privilege = { name: "", description: "", application: "" };
  async function load() {
    privilege = await getPrivilege(page.params.uuid);
    await loadApplications();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Edit Privilege</title>`;
  });
  Content($$payload, {
    title: "Edit Privilege",
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
          $$payload2.out.push(`<section id="privilege-edit">`);
          PrivilegeForm($$payload2, {
            applicationList: store_get($$store_subs ??= {}, "$applicationList", applicationList),
            privilege
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
//# sourceMappingURL=_page.svelte-Djoceegd.js.map
