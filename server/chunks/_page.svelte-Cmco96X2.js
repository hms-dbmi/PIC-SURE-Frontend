import { m as is_promise, n as noop, a as subscribe } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-Di-o4HBA.js';
import { r as readable, d as derived } from './index2-CV6P_ZFI.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { g as goto } from './client-TAfaRk9z.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import { C as Content } from './Content-BUgV6smf.js';
import { T as Table } from './Table-ehh7vrd4.js';
import { g as getModalStore } from './stores-Bn6ceQfl.js';
import { g as getToastStore } from './stores2-DrFt-twL.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-DTCsV-GH.js';
import { R as RoleStore } from './Roles-DfgD0zyS.js';
import './Privileges-CHGFe2Ry.js';
import './exports-CTha0ECg.js';
import './AngleButton-Cxjzo9QZ.js';
import './Row-CyujZUEb.js';
import './User-DwYSDSFP.js';
import './index-DzcLzHBX.js';
import './stores3-DsZ2QG0u.js';

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
//# sourceMappingURL=_page.svelte-Cmco96X2.js.map
