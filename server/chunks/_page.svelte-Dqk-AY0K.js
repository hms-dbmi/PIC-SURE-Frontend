import { x as push, a1 as head, z as pop, K as escape_html, _ as await_block, T as store_get, W as unsubscribe_stores } from './index-BKfiikQf.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { U as UserForm } from './UserForm-V1t2UVg0.js';
import { R as RoleStore } from './Roles-CHsR1lsS.js';
import { C as ConnectionsStore } from './Connections-D53FXc8x.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './index-BB9JrA1L.js';
import './machine.svelte-D_VZYMjT.js';
import './Users-Rh2LFPC7.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './Privileges-BTeK4lJj.js';
import './toaster-DzAsAKEJ.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { roleList, loadRoles } = RoleStore;
  const { connections, loadConnections } = ConnectionsStore;
  async function load() {
    await loadConnections();
    await loadRoles();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New User</title>`;
  });
  Content($$payload, {
    title: "New User",
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
          $$payload2.out += `<section id="user-new">`;
          UserForm($$payload2, {
            connections: store_get($$store_subs ??= {}, "$connections", connections),
            roleList: store_get($$store_subs ??= {}, "$roleList", roleList)
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
//# sourceMappingURL=_page.svelte-Dqk-AY0K.js.map
