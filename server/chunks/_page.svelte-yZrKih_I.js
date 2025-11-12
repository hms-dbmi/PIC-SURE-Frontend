import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { R as RoleForm } from './RoleForm-MfZYiP_c.js';
import { g as getRole } from './Roles-BpCbQHZZ.js';
import { a as privilegeList, l as loadPrivileges } from './Privileges-BTHtczqR.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let role = { name: "", description: "", privileges: [] };
  async function load() {
    role = await getRole(page.params.uuid);
    await loadPrivileges();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Edit Role</title>`;
  });
  Content($$payload, {
    title: "Edit Role",
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
          $$payload2.out.push(`<section id="role-edit">`);
          RoleForm($$payload2, {
            privilegeList: store_get($$store_subs ??= {}, "$privilegeList", privilegeList),
            role
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
//# sourceMappingURL=_page.svelte-yZrKih_I.js.map
