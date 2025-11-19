import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-DMPVr6nO.js';
import { p as page } from './index2-Bp7szfwE.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { R as RoleForm } from './RoleForm-Cm9hYOeN.js';
import { g as getRole } from './Roles-Ddev91Of.js';
import { a as privilegeList, l as loadPrivileges } from './Privileges-GMiwBHrM.js';
import { L as Loading } from './Loading-DAyWVuL0.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './User-01eW3TFo.js';
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
//# sourceMappingURL=_page.svelte-VyN_jErX.js.map
