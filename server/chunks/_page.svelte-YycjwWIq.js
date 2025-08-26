import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, T as store_get, W as unsubscribe_stores } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { U as UserForm } from './UserForm-kkshcWRy.js';
import { U as UsersStore } from './Users-oDxNfFYa.js';
import { R as RoleStore } from './Roles-CWZH5hrE.js';
import { C as ConnectionsStore } from './Connections-DSrr5djm.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';
import './Privileges-B908xk15.js';

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
          $$payload2.out += `<section id="user-edit">`;
          UserForm($$payload2, {
            connections: store_get($$store_subs ??= {}, "$connections", connections),
            roleList: store_get($$store_subs ??= {}, "$roleList", roleList),
            user
          });
          $$payload2.out += `<!----></section>`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-YycjwWIq.js.map
