import { e as is_promise, n as noop, s as subscribe } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-C099ZcAV.js';
import { r as readable, d as derived } from './index2-Bx7ZSImw.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { g as goto } from './client-DpIAX_q0.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { T as Table } from './Table-0D_aobLH.js';
import { g as getModalStore } from './stores-BqdKqnkB.js';
import { g as getToastStore } from './stores2-DM9tzbse.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-DJIq0v4i.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import './Privileges-CP-P0XVS.js';
import './exports-BGi7-Rnc.js';
import './AngleButton-C0svtr3S.js';
import './Row-DCE9feR7.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

const Actions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { status: "", email: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<button${add_attribute("data-testid", `user-view-btn-${data.cell}`, 0)} type="button" title="View" class="btn-icon-color"><i class="fa-solid fa-circle-info fa-xl"></i></button> ${data.row.status === "Active" ? `<button${add_attribute("data-testid", `user-edit-btn-${data.cell}`, 0)} type="button" title="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square fa-xl"></i></button> <button${add_attribute("data-testid", `user-deactivate-btn-${data.cell}`, 0)} type="button" title="Deactivate user" class="btn-icon-color"><i class="fa-solid fa-trash fa-xl"></i></button>` : `<button${add_attribute("data-testid", `user-activate-btn-${data.cell}`, 0)} type="button" title="Reactivate user" class="btn-icon-color"><i class="fa-solid fa-trash-arrow-up fa-xl"></i></button>`}`;
});
const Status = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data = { cell: "", row: {} } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<span${add_attribute("class", `badge last:p-1 rounded variant-filled-${data.cell === "Active" ? "success" : "error"}`, 0)}>${escape(data.cell)}</span>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $usersByConnection, $$unsubscribe_usersByConnection = noop, $$subscribe_usersByConnection = () => ($$unsubscribe_usersByConnection(), $$unsubscribe_usersByConnection = subscribe(usersByConnection, ($$value) => $usersByConnection = $$value), usersByConnection);
  let { users, loadUsers } = UsersStore;
  let { connections, loadConnections } = ConnectionsStore;
  let { roles, loadRoles } = RoleStore;
  let usersByConnection = readable([]);
  $$subscribe_usersByConnection();
  const columns = [
    {
      dataElement: "email",
      label: "Username",
      sort: true
    },
    {
      dataElement: "roles",
      label: "Role(s)",
      sort: true,
      class: "!normal-case"
    },
    {
      dataElement: "status",
      label: "Status",
      sort: true
    },
    {
      dataElement: "uuid",
      label: "Actions",
      sort: false
    }
  ];
  const cellOverides = { status: Status, uuid: Actions };
  async function load() {
    await loadConnections();
    await loadRoles();
    await loadUsers();
    $$subscribe_usersByConnection(usersByConnection = derived([users, connections, roles], ([$u, $c, $r]) => {
      return $c.map((connection) => ({
        label: connection.label,
        users: $u.filter((user) => connection.uuid === user.connection).map((row) => ({
          uuid: row.uuid || "",
          email: row.email || "uuid:" + row.uuid,
          roles: row.roles.length === 0 ? "none" : row.roles.map((role) => $r.find((r) => r.uuid === role)?.name).sort().join(", "),
          status: row.active ? "Active" : "Inactive"
        })).sort((uA, uB) => uA.status.localeCompare(uB.status))
      }));
    }));
  }
  const rowClickHandler = (row) => {
    row?.uuid;
    goto();
  };
  $$unsubscribe_usersByConnection();
  return `${$$result.head += `<!-- HEAD_svelte-zefh4i_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Manage Users</title>`, ""}<!-- HEAD_svelte-zefh4i_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Manage Users" }, {}, {
    default: () => {
      return `${function(__value) {
        if (is_promise(__value)) {
          __value.then(null, noop);
          return ` <h3 class="text-left" data-svelte-h="svelte-16fo5h6">Loading</h3> ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
        }
        return function() {
          return ` <div class="flex gap-4 mb-6" data-svelte-h="svelte-3ryyp1"><div class="flex-auto"><a data-testid="add-user-btn" class="btn variant-ghost-primary hover:variant-filled-primary" href="/admin/users/new">+ Add User</a></div></div> ${each($usersByConnection, (connection) => {
            return `<div${add_attribute("id", `user-table-${connection.label.replaceAll(" ", "_")}`, 0)} class="mb-10">${validate_component(Table, "Datatable").$$render(
              $$result,
              {
                tableName: "Users",
                data: connection.users,
                columns,
                cellOverides,
                search: true,
                defaultRowsPerPage: 10,
                title: connection.label,
                rowClickHandler
              },
              {},
              {}
            )} </div>`;
          })} `;
        }();
      }(load())}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BKdH5E0Q.js.map
