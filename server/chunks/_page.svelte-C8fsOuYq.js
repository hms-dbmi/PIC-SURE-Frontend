import { x as push, a1 as head, z as pop, K as escape_html, X as await_block } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { U as UsersStore } from './Users-oDxNfFYa.js';
import { R as RoleStore } from './Roles-CWZH5hrE.js';
import { C as ConnectionsStore } from './Connections-DSrr5djm.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';

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
          $$payload2.out += `<section id="role-view"><table class="table bg-transparent"><tbody><tr><td>Id:</td><td>${escape_html(user.uuid)}</td></tr><tr><td>Email:</td><td>${escape_html(user.email)}</td></tr><tr><td>Active:</td><td>${escape_html(user.active)}</td></tr>`;
          if (user.subject) {
            $$payload2.out += "<!--[-->";
            $$payload2.out += `<tr><td>Subject:</td><td>${escape_html(user.subject)}</td></tr>`;
          } else {
            $$payload2.out += "<!--[!-->";
          }
          $$payload2.out += `<!--]--><tr><td>Connection:</td><td>${escape_html(typeof connection !== "string" ? connection.label : user.connection)}</td></tr><tr><td>Roles:</td><td>${escape_html(roles.map((p) => p.name).join(", "))}</td></tr></tbody></table></section>`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-C8fsOuYq.js.map
