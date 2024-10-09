import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-C099ZcAV.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { g as goto } from './client-DpIAX_q0.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { T as Table } from './Table-0D_aobLH.js';
import { g as getModalStore } from './stores-BqdKqnkB.js';
import { g as getToastStore } from './stores2-DM9tzbse.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import { P as PrivilegesStore } from './Privileges-CP-P0XVS.js';
import { A as ApplicationStore } from './Application-fGEUROsL.js';
import './index2-Bx7ZSImw.js';
import './exports-BGi7-Rnc.js';
import './AngleButton-C0svtr3S.js';
import './Row-DCE9feR7.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

const RoleActions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { name: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="w-20 min-w-20"><button${add_attribute("data-testid", `role-view-btn-${data.cell}`, 0)} type="button" title="View" class="btn-icon-color"><i class="fa-solid fa-circle-info fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-14wft3a">View Role</span></button> <button${add_attribute("data-testid", `role-edit-btn-${data.cell}`, 0)} type="button" title="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1evs4en">Edit</span></button> <button${add_attribute("data-testid", `role-delete-btn-${data.cell}`, 0)} type="button" title="Delete" class="btn-icon-color"><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-18sehy8">Delete</span></button></div>`;
});
const PrivilegeActions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getModalStore();
  getToastStore();
  let { data = { cell: "", row: { name: "" } } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="w-20 min-w-20"><button${add_attribute("data-testid", `privilege-view-btn-${data.cell}`, 0)} type="button" title="View" class="btn-icon-color"><i class="fa-solid fa-circle-info fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1gf6b6d">View Privilege</span></button> <button${add_attribute("data-testid", `privilege-edit-btn-${data.cell}`, 0)} type="button" title="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1evs4en">Edit</span></button> <button${add_attribute("data-testid", `privilege-delete-btn-${data.cell}`, 0)} type="button" title="Delete" class="btn-icon-color"><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-18sehy8">Delete</span></button></div>`;
});
const Application = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const { getApplication } = ApplicationStore;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${escape(data.cell ? getApplication(data.cell).name : "none")}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $roles, $$unsubscribe_roles;
  let $privileges, $$unsubscribe_privileges;
  const { roles, loadRoles } = RoleStore;
  $$unsubscribe_roles = subscribe(roles, (value) => $roles = value);
  const { privileges, loadPrivileges } = PrivilegesStore;
  $$unsubscribe_privileges = subscribe(privileges, (value) => $privileges = value);
  const { loadApplications } = ApplicationStore;
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
      { dataElement: "uuid", label: "Actions" }
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
      { dataElement: "uuid", label: "Actions" }
    ],
    overrides: {
      uuid: PrivilegeActions,
      application: Application
    }
  };
  async function load() {
    await loadRoles();
    await loadPrivileges();
    await loadApplications();
  }
  const rowClickHandler = (path) => (row) => {
    row?.uuid;
    goto();
  };
  const roleRowCLick = rowClickHandler();
  const privilegeRowClick = rowClickHandler();
  $$unsubscribe_roles();
  $$unsubscribe_privileges();
  return `${$$result.head += `<!-- HEAD_svelte-1m7g26a_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Authorization</title>`, ""}<!-- HEAD_svelte-1m7g26a_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Authorization" }, {}, {
    default: () => {
      return `${function(__value) {
        if (is_promise(__value)) {
          __value.then(null, noop);
          return ` <h3 class="text-left" data-svelte-h="svelte-16fo5h6">Loading</h3> ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
        }
        return function() {
          return ` <div id="authorization-role-table" class="mb-10"><h2 data-svelte-h="svelte-iva7uy">Roles Management</h2> <div class="flex gap-4 my-6" data-svelte-h="svelte-1ktr2it"><div class="flex-auto"><a data-testid="add-role" class="btn variant-ghost-primary hover:variant-filled-primary" href="/admin/authorization/role/new">+ Add Role</a></div></div> ${validate_component(Table, "Datatable").$$render(
            $$result,
            {
              tableName: "Roles",
              data: $roles,
              columns: roleTable.columns,
              cellOverides: roleTable.overrides,
              defaultRowsPerPage: 10,
              rowClickHandler: roleRowCLick
            },
            {},
            {}
          )}</div> <div id="authorization-privilege-table" class="mb-10"><h2 data-svelte-h="svelte-1u9r2oz">Privileges Management</h2> <div class="flex gap-4 my-6" data-svelte-h="svelte-1nztzi8"><div class="flex-auto"><a data-testid="add-privilege" class="btn variant-ghost-primary hover:variant-filled-primary" href="/admin/authorization/privilege/new">+ Add Privilege</a></div></div> ${validate_component(Table, "Datatable").$$render(
            $$result,
            {
              tableName: "Privileges",
              data: $privileges,
              columns: privilegesTable.columns,
              cellOverides: privilegesTable.overrides,
              defaultRowsPerPage: 10,
              rowClickHandler: privilegeRowClick
            },
            {},
            {}
          )}</div> `;
        }();
      }(load())}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-KR42HryU.js.map
