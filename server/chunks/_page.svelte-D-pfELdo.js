import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { U as UserForm } from './UserForm-CPK4bJjC.js';
import { U as UsersStore } from './Users-BK7CL9sx.js';
import { R as RoleStore } from './Roles-BM28ynMK.js';
import { C as ConnectionsStore } from './Connections-4SliUl-7.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './Switch-BaHCJXB0.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';
import './Privileges-CfGQH9Ip.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { getUser, loadUsers } = UsersStore;
  const { roleList, loadRoles } = RoleStore;
  const { connections, loadConnections } = ConnectionsStore;
  let user = {
    connection: "",
    generalMetadata: "",
    active: false,
    roles: []
  };
  async function load() {
    await loadUsers();
    user = await getUser(page.params.uuid);
    await loadRoles();
    await loadConnections();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Edit User</title>`;
  });
  Content($$payload, {
    title: "Edit User",
    backUrl: "/admin/users",
    backTitle: "Back to Users",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        load(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out.push(`<section id="user-edit">`);
          UserForm($$payload2, {
            connections: store_get($$store_subs ??= {}, "$connections", connections),
            roleList: store_get($$store_subs ??= {}, "$roleList", roleList),
            user
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
//# sourceMappingURL=_page.svelte-D-pfELdo.js.map
