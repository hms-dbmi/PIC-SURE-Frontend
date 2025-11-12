import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { U as UserForm } from './UserForm-B1zttry1.js';
import { U as UsersStore } from './Users-DX_F7USy.js';
import { R as RoleStore } from './Roles-BpCbQHZZ.js';
import { C as ConnectionsStore } from './Connections-D77ozd1n.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';
import './Privileges-BTHtczqR.js';

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
//# sourceMappingURL=_page.svelte-bwLdDQCf.js.map
