import { x as push, a8 as head, z as pop, M as escape_html, U as store_get, Y as await_block, N as attr_class, Q as stringify, X as unsubscribe_stores, O as attr, S as ensure_array_like } from './index-DMPVr6nO.js';
import { g as goto } from './client2-DxcZr6Tp.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { E as ErrorAlert } from './ErrorAlert-BrAljl0x.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { S as StaticTable } from './StaticTable-BZzBQVFt.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import { a7 as isTopAdmin, t as toaster } from './User-01eW3TFo.js';
import { r as roles, l as loadRoles, d as deleteRole } from './Roles-Ddev91Of.js';
import { M as Modal_1 } from './Modal-dMSGxUC4.js';
import { p as privileges, l as loadPrivileges, d as deletePrivilege } from './Privileges-GMiwBHrM.js';
import { c as connections, l as loadConnections, d as deleteConnection } from './Connections-Bb_icnG_.js';
import { l as loadApplications, g as getApplication } from './Application-DYgV737M.js';
import { p as parseFieldsFromJSON } from './Connection-DRlqdxWD.js';
import { L as Loading } from './Loading-DAyWVuL0.js';
import './Dictionary-GEGKzEEq.js';
import './index2-Bp7szfwE.js';
import './RemoteTable-Dun11TjL.js';
import './AddFilter-CZ17On64.js';
import './Filter-Bhec34ty.js';
import 'uuid';
import './OptionsSelectionList-C9pb9mmD.js';
import '@sveltejs/kit';

function RoleActions($$payload, $$props) {
  push();
  var $$store_subs;
  const { data = { cell: "", row: { name: "" } } } = $$props;
  async function deleteRow() {
    if (!isTopAdmin) return;
    try {
      await deleteRole(data.cell);
      toaster.success({ title: `Successfully deleted role '${data.row.name}'` });
    } catch (error) {
      console.error(error);
      if (error?.status === 409) {
        toaster.error({
          title: `Cannot delete role '${data.row.name}' as it is still in use by a user`
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting role '${data.row.name}'`
        });
      }
    }
  }
  $$payload.out.push(`<div class="w-20 min-w-20"><button${attr("data-testid", `role-${data.cell}-edit-btn`)} type="button" title="Edit" class="btn-icon-color"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only">Edit</span></button> `);
  {
    let trigger = function($$payload2) {
      $$payload2.out.push(`<i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only">Delete</span>`);
    };
    Modal_1($$payload, {
      "data-testid": `role-${stringify(data.cell)}-delete`,
      title: "Delete Role?",
      confirmText: "Yes",
      cancelText: "No",
      disabled: !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin),
      onconfirm: deleteRow,
      triggerBase: "btn-icon-color",
      withDefault: true,
      trigger,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Are you sure you want to delete role '${escape_html(data.row.name)}'?`);
      },
      $$slots: { trigger: true, default: true }
    });
  }
  $$payload.out.push(`<!----></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function PrivilegeActions($$payload, $$props) {
  push();
  var $$store_subs;
  const { data = { cell: "", row: { name: "" } } } = $$props;
  async function deleteRow() {
    if (!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin)) return;
    try {
      await deletePrivilege(data.cell);
      toaster.success({ title: `Successfully deleted privilege '${data.row.name}'` });
    } catch (error) {
      console.error(error);
      if (error?.status === 409) {
        toaster.error({
          title: `Cannot delete privilege '${data.row.name}' as it is still in use by a role`
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting privilege '${data.row.name}'`
        });
      }
    }
  }
  $$payload.out.push(`<div class="w-20 min-w-20"><button${attr("data-testid", `privilege-${data.cell}-edit-btn`)} type="button" title="Edit" class="btn-icon-color"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only">Edit</span></button> `);
  {
    let trigger = function($$payload2) {
      $$payload2.out.push(`<i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only">Delete</span>`);
    };
    Modal_1($$payload, {
      "data-testid": `privilege-${stringify(data.cell)}-delete`,
      title: "Delete Privilege?",
      confirmText: "Yes",
      cancelText: "No",
      disabled: !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin),
      onconfirm: deleteRow,
      triggerBase: "btn-icon-color",
      withDefault: true,
      trigger,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Are you sure you want to delete privilege '${escape_html(data.row.name)}'?`);
      },
      $$slots: { trigger: true, default: true }
    });
  }
  $$payload.out.push(`<!----></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ConnectionActions($$payload, $$props) {
  push();
  var $$store_subs;
  const { data = { cell: "", row: { label: "" } } } = $$props;
  async function deleteRow() {
    if (!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin)) return;
    const label = data.row.label;
    try {
      await deleteConnection(data.cell);
      toaster.success({ title: `Successfully deleted connection '${label}'` });
    } catch (error) {
      console.error(error);
      if (error?.status === 409) {
        toaster.error({
          title: `Cannot delete connection '${label}' as it is still in use by an application or user`
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting connection '${label}'`
        });
      }
    }
  }
  $$payload.out.push(`<div class="w-20 min-w-20"><button${attr("data-testid", `connection-${data.cell}-edit-btn`)} type="button" title="Edit" class="btn-icon-color"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only">Edit</span></button> `);
  {
    let trigger = function($$payload2) {
      $$payload2.out.push(`<i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only">Delete</span>`);
    };
    Modal_1($$payload, {
      "data-testid": `connection-${stringify(data.cell)}-delete`,
      title: "Delete Connection?",
      confirmText: "Yes",
      cancelText: "No",
      disabled: !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin),
      onconfirm: deleteRow,
      triggerBase: "btn-icon-color",
      withDefault: true,
      trigger,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Are you sure you want to delete connection '${escape_html(data.row.label)}'?`);
      },
      $$slots: { trigger: true, default: true }
    });
  }
  $$payload.out.push(`<!----></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Application($$payload, $$props) {
  push();
  let { data } = $$props;
  $$payload.out.push(`<!---->${escape_html(data.cell ? getApplication(data.cell)?.name : "none")}`);
  pop();
}
function RequiredFields($$payload, $$props) {
  push();
  let { data = { cell: "[]" } } = $$props;
  let fields = parseFieldsFromJSON(data.cell);
  const each_array = ensure_array_like(fields);
  $$payload.out.push(`<!--[-->`);
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let field = each_array[index];
    $$payload.out.push(`<span class="badge preset-tonal-surface border border-surface-500 font-normal m-1"><span class="font-bold">${escape_html(field.label)}</span>:${escape_html(field.id)}</span>`);
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const roleTable = {
    columns: [
      { dataElement: "name", label: "Name", sort: true },
      { dataElement: "description", label: "Description", sort: true },
      { dataElement: "uuid", label: "Actions", class: "text-center" }
    ],
    overrides: { uuid: RoleActions }
  };
  const privilegesTable = {
    columns: [
      { dataElement: "name", label: "Name", sort: true },
      { dataElement: "description", label: "Description", sort: true },
      {
        dataElement: "application",
        label: "Application Name",
        sort: true
      },
      { dataElement: "uuid", label: "Actions", class: "text-center" }
    ],
    overrides: { uuid: PrivilegeActions, application: Application }
  };
  const connectionTable = {
    columns: [
      { dataElement: "label", label: "Label", sort: true },
      { dataElement: "id", label: "ID", sort: true },
      { dataElement: "subPrefix", label: "Sub prefix", sort: true },
      { dataElement: "requiredFields", label: "Required fields" },
      { dataElement: "uuid", label: "Actions", class: "text-center" }
    ],
    overrides: { uuid: ConnectionActions, requiredFields: RequiredFields }
  };
  async function loadAppsAndPriv() {
    await loadPrivileges();
    await loadApplications();
  }
  const rowClickHandler = (path) => (row) => {
    row?.uuid;
    goto();
  };
  const roleRowCLick = rowClickHandler();
  const privilegeRowClick = rowClickHandler();
  const connectionRowClick = rowClickHandler();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Configuration</title>`;
  });
  Content($$payload, {
    title: "Configuration",
    children: ($$payload2) => {
      if (!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin)) {
        $$payload2.out.push("<!--[-->");
        ErrorAlert($$payload2, {
          title: "Top Administrator Only",
          color: "warning",
          children: ($$payload3) => {
            $$payload3.out.push(`<p>Configurations are READ ONLY for admin users. Please contact your administrator to make
        changes.</p>`);
          }
        });
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> <div id="role-table" class="mb-10"><h2>Roles Management</h2> `);
      await_block(
        $$payload2,
        loadRoles(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out.push(`<div class="flex gap-4 my-6"><div class="flex-auto"><a data-testid="add-role"${attr_class(`btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 ${stringify(!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin) ? "opacity-50 pointer-events-none" : "")}`)} href="/admin/configuration/role/new">+ Add Role</a></div></div> `);
          StaticTable($$payload2, {
            tableName: "Roles",
            data: store_get($$store_subs ??= {}, "$roles", roles),
            columns: roleTable.columns,
            cellOverides: roleTable.overrides,
            rowClickHandler: roleRowCLick,
            isClickable: true
          });
          $$payload2.out.push(`<!---->`);
        }
      );
      $$payload2.out.push(`<!--]--></div> <div id="privilege-table" class="mb-10"><h2>Privileges Management</h2> `);
      await_block(
        $$payload2,
        loadAppsAndPriv(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out.push(`<div class="flex gap-4 my-6"><div class="flex-auto"><a data-testid="add-privilege"${attr_class(`btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 ${stringify(!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin) ? "opacity-50 pointer-events-none" : "")}`)} href="/admin/configuration/privilege/new">+ Add Privilege</a></div></div> `);
          StaticTable($$payload2, {
            tableName: "Privileges",
            data: store_get($$store_subs ??= {}, "$privileges", privileges),
            columns: privilegesTable.columns,
            cellOverides: privilegesTable.overrides,
            rowClickHandler: privilegeRowClick,
            isClickable: true
          });
          $$payload2.out.push(`<!---->`);
        }
      );
      $$payload2.out.push(`<!--]--></div> <div id="connection-table" class="mb-10"><h2>Connections Management</h2> `);
      await_block(
        $$payload2,
        loadConnections(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out.push(`<div class="flex gap-4 my-6"><div class="flex-auto"><a data-testid="add-connection"${attr_class(`btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 ${stringify(!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin) ? "opacity-50 pointer-events-none" : "")}`)} href="/admin/configuration/connection/new">+ Add Connection</a></div></div> `);
          StaticTable($$payload2, {
            tableName: "Connections",
            data: store_get($$store_subs ??= {}, "$connections", connections),
            columns: connectionTable.columns,
            cellOverides: connectionTable.overrides,
            rowClickHandler: connectionRowClick,
            isClickable: true
          });
          $$payload2.out.push(`<!---->`);
        }
      );
      $$payload2.out.push(`<!--]--></div> `);
      {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div id="misc-configs"><a href="/admin/configuration/terms/edit" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Update Terms of Service</a></div>`);
      }
      $$payload2.out.push(`<!--]-->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-r1si8YEO.js.map
