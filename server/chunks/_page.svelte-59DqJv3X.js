import { l as is_promise, n as noop, a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-BRJpAXVH.js';
import { r as readable, d as derived } from './index2-BVONNh3m.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { g as goto } from './client-BR749xJD.js';
import { b as branding } from './configuration-DBHGr3VN.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { T as Table } from './Table-smaNoih1.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import { U as UsersStore } from './Users-DJu_b0OH.js';
import { C as ConnectionsStore } from './Connections-BC0TES_t.js';
import { R as RoleStore } from './Roles-D04Ein2f.js';
import './Privileges-C7v5nbfw.js';
import './exports-kR70XCWV.js';
import './AngleButton-C6YzBYNH.js';
import './Row-Cb2p0o0o.js';
import './User-fDnXlPjS.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';

const Actions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { status: "", email: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${data.row.status === "Active" ? `<button${add_attribute("data-testid", `user-edit-btn-${data.cell}`, 0)} type="button" title="Edit" aria-label="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square fa-xl"></i></button> <button${add_attribute("data-testid", `user-deactivate-btn-${data.cell}`, 0)} type="button" title="Deactivate user" aria-label="Deactivate user" class="btn-icon-color"><i class="fa-solid fa-trash fa-xl"></i></button>` : `<button${add_attribute("data-testid", `user-activate-btn-${data.cell}`, 0)} type="button" title="Reactivate user" aria-label="Reactivate user" class="btn-icon-color"><i class="fa-solid fa-trash-arrow-up fa-xl"></i></button>`}`;
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
      sort: true,
      class: "w-1/3"
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
                rowClickHandler,
                isClickable: true,
                tableAuto: false
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
//# sourceMappingURL=_page.svelte-59DqJv3X.js.map
