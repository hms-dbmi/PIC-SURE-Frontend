import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { U as UsersStore } from './Users-DX_F7USy.js';
import { R as RoleStore } from './Roles-BpCbQHZZ.js';
import { C as ConnectionsStore } from './Connections-D77ozd1n.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';

function _page($$payload, $$props) {
  push();
  const { loadUsers, getUser } = UsersStore;
  const { getRole } = RoleStore;
  const { getConnection } = ConnectionsStore;
  let user = {
    connection: "",
    active: false,
    roles: []
  };
  let roles = [];
  let connection = "";
  async function load() {
    await loadUsers();
    user = await getUser(page.params.uuid);
    connection = await getConnection(user.connection) || "";
    roles = await Promise.all(user.roles.map(getRole));
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | User Summary</title>`;
  });
  Content($$payload, {
    title: "User Summary",
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
          $$payload2.out.push(`<section id="role-view"><table class="table bg-transparent"><tbody><tr><td>Id:</td><td>${escape_html(user.uuid)}</td></tr><tr><td>Email:</td><td>${escape_html(user.email)}</td></tr><tr><td>Active:</td><td>${escape_html(user.active)}</td></tr>`);
          if (user.subject) {
            $$payload2.out.push("<!--[-->");
            $$payload2.out.push(`<tr><td>Subject:</td><td>${escape_html(user.subject)}</td></tr>`);
          } else {
            $$payload2.out.push("<!--[!-->");
          }
          $$payload2.out.push(`<!--]--><tr><td>Connection:</td><td>${escape_html(typeof connection !== "string" ? connection.label : user.connection)}</td></tr><tr><td>Roles:</td><td>${escape_html(roles.map((p) => p.name).join(", "))}</td></tr></tbody></table></section>`);
        }
      );
      $$payload2.out.push(`<!--]-->`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Dkynkpx_.js.map
