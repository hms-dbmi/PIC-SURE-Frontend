import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute, b as each } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { g as goto } from './client-BR749xJD.js';
import { b as branding } from './configuration-Bm4Mu1_g.js';
import { E as ErrorAlert } from './ErrorAlert-DgLOjAhF.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { T as Table } from './Table-smaNoih1.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import { e as isTopAdmin } from './User-Cv0Sr19m.js';
import { r as roles, l as loadRoles } from './Roles-qC0hIO7F.js';
import { p as privileges, l as loadPrivileges } from './Privileges-C5IyGZZ5.js';
import { c as connections, l as loadConnections } from './Connections-CMtfWsSQ.js';
import { l as loadApplications, A as ApplicationStore } from './Application-BJYqrKL8.js';
import { p as parseFieldsFromJSON } from './Connection-DRlqdxWD.js';
import './index2-BVONNh3m.js';
import './exports-kR70XCWV.js';
import './AngleButton-C6YzBYNH.js';
import './Row-Cb2p0o0o.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';

const RoleActions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isTopAdmin, $$unsubscribe_isTopAdmin;
  $$unsubscribe_isTopAdmin = subscribe(isTopAdmin, (value) => $isTopAdmin = value);
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { name: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$unsubscribe_isTopAdmin();
  return `<div class="w-20 min-w-20"><button${add_attribute("data-testid", `role-edit-btn-${data.cell}`, 0)} type="button" title="Edit" class="btn-icon-color" ${!$isTopAdmin ? "disabled" : ""}><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1evs4en">Edit</span></button> <button${add_attribute("data-testid", `role-delete-btn-${data.cell}`, 0)} type="button" title="Delete" class="btn-icon-color" ${!$isTopAdmin ? "disabled" : ""}><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-18sehy8">Delete</span></button></div>`;
});
const PrivilegeActions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isTopAdmin, $$unsubscribe_isTopAdmin;
  $$unsubscribe_isTopAdmin = subscribe(isTopAdmin, (value) => $isTopAdmin = value);
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { name: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$unsubscribe_isTopAdmin();
  return `<div class="w-20 min-w-20"><button${add_attribute("data-testid", `privilege-edit-btn-${data.cell}`, 0)} type="button" title="Edit" class="btn-icon-color" ${!$isTopAdmin ? "disabled" : ""}><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1evs4en">Edit</span></button> <button${add_attribute("data-testid", `privilege-delete-btn-${data.cell}`, 0)} type="button" title="Delete" class="btn-icon-color" ${!$isTopAdmin ? "disabled" : ""}><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-18sehy8">Delete</span></button></div>`;
});
const ConnectionActions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isTopAdmin, $$unsubscribe_isTopAdmin;
  $$unsubscribe_isTopAdmin = subscribe(isTopAdmin, (value) => $isTopAdmin = value);
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { label: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  $$unsubscribe_isTopAdmin();
  return `<div class="w-20 min-w-20"><button${add_attribute("data-testid", `connection-edit-btn-${data.cell}`, 0)} type="button" title="Edit" class="btn-icon-color" ${!$isTopAdmin ? "disabled" : ""}><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1evs4en">Edit</span></button> <button${add_attribute("data-testid", `connection-delete-btn-${data.cell}`, 0)} type="button" title="Delete" class="btn-icon-color" ${!$isTopAdmin ? "disabled" : ""}><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-18sehy8">Delete</span></button></div>`;
});
const Application = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const { getApplication } = ApplicationStore;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${escape(data.cell ? getApplication(data.cell).name : "none")}`;
});
const RequiredFields = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let fields;
  let { data = { cell: "[]" } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  fields = parseFieldsFromJSON(data.cell);
  return `${each(fields, (field, index) => {
    return `<span class="badge variant-ghost-surface font-normal m-1"><span class="font-bold">${escape(field.label)}</span>:${escape(field.id)}</span>`;
  })}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isTopAdmin, $$unsubscribe_isTopAdmin;
  let $roles, $$unsubscribe_roles;
  let $privileges, $$unsubscribe_privileges;
  let $connections, $$unsubscribe_connections;
  $$unsubscribe_isTopAdmin = subscribe(isTopAdmin, (value) => $isTopAdmin = value);
  $$unsubscribe_roles = subscribe(roles, (value) => $roles = value);
  $$unsubscribe_privileges = subscribe(privileges, (value) => $privileges = value);
  $$unsubscribe_connections = subscribe(connections, (value) => $connections = value);
  const roleTable = {
    columns: [
      {
        dataElement: "name",
        label: "Name",
        sort: true
      },
      {
        dataElement: "description",
        label: "Description",
        sort: true
      },
      {
        dataElement: "uuid",
        label: "Actions",
        class: "text-center"
      }
    ],
    overrides: { uuid: RoleActions }
  };
  const privilegesTable = {
    columns: [
      {
        dataElement: "name",
        label: "Name",
        sort: true
      },
      {
        dataElement: "description",
        label: "Description",
        sort: true
      },
      {
        dataElement: "application",
        label: "Application Name",
        sort: true
      },
      {
        dataElement: "uuid",
        label: "Actions",
        class: "text-center"
      }
    ],
    overrides: {
      uuid: PrivilegeActions,
      application: Application
    }
  };
  const connectionTable = {
    columns: [
      {
        dataElement: "label",
        label: "Label",
        sort: true
      },
      {
        dataElement: "id",
        label: "ID",
        sort: true
      },
      {
        dataElement: "subPrefix",
        label: "Sub prefix",
        sort: true
      },
      {
        dataElement: "requiredFields",
        label: "Required fields",
        sort: true
      },
      {
        dataElement: "uuid",
        label: "Actions",
        class: "text-center"
      }
    ],
    overrides: {
      uuid: ConnectionActions,
      requiredFields: RequiredFields
    }
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
  $$unsubscribe_isTopAdmin();
  $$unsubscribe_roles();
  $$unsubscribe_privileges();
  $$unsubscribe_connections();
  return `${$$result.head += `<!-- HEAD_svelte-wij333_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Configuration</title>`, ""}<!-- HEAD_svelte-wij333_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Configuration" }, {}, {
    default: () => {
      return `${!$isTopAdmin ? `${validate_component(ErrorAlert, "ErrorAlert").$$render(
        $$result,
        {
          title: "Top Administrator Only",
          color: "warning"
        },
        {},
        {
          default: () => {
            return `<p data-svelte-h="svelte-uy0kgx">Configurations are READ ONLY for admin users. Please contact your administrator to make
        changes.</p>`;
          }
        }
      )}` : ``} <div id="role-table" class="mb-10"><h2 data-svelte-h="svelte-iva7uy">Roles Management</h2> ${function(__value) {
        if (is_promise(__value)) {
          __value.then(null, noop);
          return ` ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
        }
        return function() {
          return ` <div class="flex gap-4 my-6"><div class="flex-auto"><a data-testid="add-role" class="${"btn variant-ghost-primary hover:variant-filled-primary " + escape(!$isTopAdmin ? "opacity-50 pointer-events-none" : "", true)}" href="/admin/configuration/role/new">+ Add Role</a></div></div> ${validate_component(Table, "Datatable").$$render(
            $$result,
            {
              tableName: "Roles",
              data: $roles,
              columns: roleTable.columns,
              cellOverides: roleTable.overrides,
              defaultRowsPerPage: 10,
              rowClickHandler: roleRowCLick,
              isClickable: true
            },
            {},
            {}
          )} `;
        }();
      }(loadRoles())}</div> <div id="privilege-table" class="mb-10"><h2 data-svelte-h="svelte-1u9r2oz">Privileges Management</h2> ${function(__value) {
        if (is_promise(__value)) {
          __value.then(null, noop);
          return ` ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
        }
        return function() {
          return ` <div class="flex gap-4 my-6"><div class="flex-auto"><a data-testid="add-privilege" class="${"btn variant-ghost-primary hover:variant-filled-primary " + escape(!$isTopAdmin ? "opacity-50 pointer-events-none" : "", true)}" href="/admin/configuration/privilege/new">+ Add Privilege</a></div></div> ${validate_component(Table, "Datatable").$$render(
            $$result,
            {
              tableName: "Privileges",
              data: $privileges,
              columns: privilegesTable.columns,
              cellOverides: privilegesTable.overrides,
              defaultRowsPerPage: 10,
              rowClickHandler: privilegeRowClick,
              isClickable: true
            },
            {},
            {}
          )} `;
        }();
      }(loadAppsAndPriv())}</div> <div id="connection-table" class="mb-10"><h2 data-svelte-h="svelte-1okbge2">Connections Management</h2> ${function(__value) {
        if (is_promise(__value)) {
          __value.then(null, noop);
          return ` ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
        }
        return function() {
          return ` <div class="flex gap-4 my-6"><div class="flex-auto"><a data-testid="add-connection" class="${"btn variant-ghost-primary hover:variant-filled-primary " + escape(!$isTopAdmin ? "opacity-50 pointer-events-none" : "", true)}" href="/admin/configuration/connection/new">+ Add Connection</a></div></div> ${validate_component(Table, "Datatable").$$render(
            $$result,
            {
              tableName: "Connections",
              data: $connections,
              columns: connectionTable.columns,
              cellOverides: connectionTable.overrides,
              defaultRowsPerPage: 10,
              rowClickHandler: connectionRowClick,
              isClickable: true
            },
            {},
            {}
          )} `;
        }();
      }(loadConnections())}</div>`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Bn8VVCaM.js.map
