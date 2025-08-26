import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, R as ensure_array_like, T as store_get, N as attr, P as stringify, W as unsubscribe_stores, M as attr_class } from './index-C5NonOVO.js';
import { g as readable, i as derived } from './exports-Cnt0TmSD.js';
import { g as goto } from './client2-CLhyDddE.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { S as StaticTable } from './StaticTable-h7VnOZfV.js';
import { t as toaster } from './User-ByrNDeqq.js';
import { U as UsersStore, g as getUser, u as updateUser } from './Users-oDxNfFYa.js';
import { C as ConnectionsStore, g as getConnection } from './Connections-DSrr5djm.js';
import { R as RoleStore, g as getRole } from './Roles-CWZH5hrE.js';
import { g as getPrivilege } from './Privileges-B908xk15.js';
import { M as Modal_1 } from './Modal-tsNejdoN.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './Dictionary-10axK71X.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import './RemoteTable-Dy4YtKgc.js';
import './AddFilter-BbVq5aRW.js';
import './Filter-BUwQwcV6.js';
import 'uuid';
import './OptionsSelectionList-Dlogw0gs.js';
import './index2-CvuFLVuQ.js';

function Actions($$payload, $$props) {
  push();
  let {
    data = { cell: "", row: { status: "", email: "" } }
  } = $$props;
  const active = data.row.status === "Active";
  async function toggleActivate(active2) {
    const user = await getUser(data.cell);
    if (!user) return;
    const connection = await getConnection(user.connection);
    const roles = await Promise.all(user.roles.map((uuid) => getRole(uuid).then((role) => ({
      ...role,
      privileges: role.privileges.map((uuid2) => getPrivilege(uuid2))
    }))));
    if (!(user && connection && roles.length > 0)) return;
    let newUser = { ...user, active: active2, connection, roles };
    try {
      await updateUser(newUser);
      toaster.success({
        title: `Successfully ${active2 ? "r" : "d"}eactivated user '${newUser.email}'`
      });
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occured while ${active2 ? "r" : "d"}eactivating user '${user.email}'`
      });
    }
  }
  if (active) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button${attr("data-testid", `user-${stringify(data.cell)}-edit-btn`)} type="button" title="Edit" aria-label="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square fa-xl"></i></button>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    let trigger = function($$payload2) {
      $$payload2.out += `<button${attr("data-testid", `user-${stringify(active ? "d" : "r")}eactivate-btn-${stringify(data.cell)}`)} type="button"${attr("title", `${stringify(active ? "D" : "R")}eactivate user`)}${attr("aria-label", `${stringify(active ? "D" : "R")}eactivate user`)} class="btn-icon-color"><i${attr_class(`fa-solid fa-trash${stringify(active ? "" : "-arrow-up")} fa-xl`)}></i></button>`;
    };
    Modal_1($$payload, {
      "data-testid": `user-${stringify(data.cell)}-${stringify(active ? "D" : "R")}eactivate-btn`,
      title: `${stringify(active ? "D" : "R")}eactivate User?`,
      confirmText: `${stringify(active ? "D" : "R")}eactivate`,
      onconfirm: () => toggleActivate(!active),
      withDefault: true,
      trigger,
      children: ($$payload2) => {
        $$payload2.out += `<!---->Are you sure you want to ${escape_html(active ? "d" : "r")}eactiveate user '${escape_html(data.row.email)}'?`;
      },
      $$slots: { trigger: true, default: true }
    });
  }
  $$payload.out += `<!---->`;
  pop();
}
function Status($$payload, $$props) {
  push();
  let { data = { cell: "", row: {} } } = $$props;
  $$payload.out += `<span${attr_class(`badge last:p-1 rounded-sm preset-filled-${data.cell === "Active" ? "success" : "error"}-500`)}>${escape_html(data.cell)}</span>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let { users, loadUsers } = UsersStore;
  let { connections, loadConnections } = ConnectionsStore;
  let { roles, loadRoles } = RoleStore;
  let usersByConnection = readable([]);
  const columns = [
    {
      dataElement: "email",
      label: "Username",
      sort: true,
      class: "w-1/3"
    },
    {
      dataElement: "roles",
      label: "Role(s)",
      sort: true,
      class: "normal-case!"
    },
    {
      dataElement: "status",
      label: "Status",
      sort: true,
      class: "w-24 text-center"
    },
    {
      dataElement: "uuid",
      label: "Actions",
      sort: false,
      class: "w-24 text-center"
    }
  ];
  const cellOverides = { status: Status, uuid: Actions };
  async function load() {
    await loadConnections();
    await loadRoles();
    await loadUsers();
    usersByConnection = derived([users, connections, roles], ([$u, $c, $r]) => {
      return $c.map((connection) => ({
        label: connection.label,
        users: $u.filter((user) => connection.uuid === user.connection).map((row) => ({
          uuid: row.uuid || "",
          email: row.email || "uuid:" + row.uuid,
          roles: row.roles.length === 0 ? "none" : row.roles.map((role) => $r.find((r) => r.uuid === role)?.name).sort().join(", "),
          status: row.active ? "Active" : "Inactive"
        })).sort((uA, uB) => uA.status.localeCompare(uB.status))
      }));
    });
  }
  const rowClickHandler = (row) => {
    row?.uuid;
    goto();
  };
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Manage Users</title>`;
  });
  Content($$payload, {
    title: "Manage Users",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        load(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$usersByConnection", usersByConnection));
          $$payload2.out += `<div class="flex gap-4 mb-6"><div class="flex-auto"><a data-testid="add-user-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500" href="/admin/users/new">+ Add User</a></div></div> <!--[-->`;
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let connection = each_array[$$index];
            $$payload2.out += `<div${attr("id", `user-table-${connection.label.replaceAll(" ", "_")}`)} class="mb-10">`;
            StaticTable($$payload2, {
              tableName: `Users-${stringify(connection.label)}`,
              data: connection.users,
              columns,
              cellOverides,
              title: connection.label,
              rowClickHandler,
              isClickable: true,
              searchable: true,
              tableAuto: false
            });
            $$payload2.out += `<!----></div>`;
          }
          $$payload2.out += `<!--]-->`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D3TjR2AH.js.map
