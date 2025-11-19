import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-DMPVr6nO.js';
import { p as page } from './index2-Bp7szfwE.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { U as UserForm } from './UserForm-DGrDRSQq.js';
import { U as UsersStore } from './Users-DX4768Wk.js';
import { R as RoleStore } from './Roles-Ddev91Of.js';
import { C as ConnectionsStore } from './Connections-Bb_icnG_.js';
import { L as Loading } from './Loading-DAyWVuL0.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './Switch-HIQp4RA5.js';
import './User-01eW3TFo.js';
import '@sveltejs/kit';
import './Privileges-GMiwBHrM.js';

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
//# sourceMappingURL=_page.svelte-UGsSIjni.js.map
