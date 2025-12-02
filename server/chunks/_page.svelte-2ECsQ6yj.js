import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { U as UsersStore } from './Users-BK7CL9sx.js';
import { R as RoleStore } from './Roles-BM28ynMK.js';
import { C as ConnectionsStore } from './Connections-4SliUl-7.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './User-CeJunCPd.js';
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
//# sourceMappingURL=_page.svelte-2ECsQ6yj.js.map
