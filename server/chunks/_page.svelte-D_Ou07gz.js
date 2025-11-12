import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-BYsoXH7a.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { R as RoleForm } from './RoleForm-MfZYiP_c.js';
import { P as PrivilegesStore } from './Privileges-BTHtczqR.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './Roles-BpCbQHZZ.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';
import './index2-DXnmzf54.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { privilegeList, loadPrivileges } = PrivilegesStore;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New Role</title>`;
  });
  Content($$payload, {
    title: "New Role",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        loadPrivileges(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out.push(`<section id="role-new">`);
          RoleForm($$payload2, {
            privilegeList: store_get($$store_subs ??= {}, "$privilegeList", privilegeList)
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
//# sourceMappingURL=_page.svelte-D_Ou07gz.js.map
