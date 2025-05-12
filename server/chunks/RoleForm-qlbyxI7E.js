import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, a as add_attribute, b as each, e as escape } from './ssr-BRJpAXVH.js';
import './client-BR749xJD.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './Roles-vkUyDBMO.js';
import { f as isTopAdmin } from './User-DLjB6rDR.js';

const RoleForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isTopAdmin, $$unsubscribe_isTopAdmin;
  $$unsubscribe_isTopAdmin = subscribe(isTopAdmin, (value) => $isTopAdmin = value);
  getToastStore();
  let { role = void 0 } = $$props;
  let { privilegeList } = $$props;
  let name = role ? role.name : "";
  let description = role ? role.description : "";
  let privileges = privilegeList.map(([_name, uuid]) => ({
    uuid,
    checked: role ? role.privileges.includes(uuid) : false
  }));
  if ($$props.role === void 0 && $$bindings.role && role !== void 0) $$bindings.role(role);
  if ($$props.privilegeList === void 0 && $$bindings.privilegeList && privilegeList !== void 0) $$bindings.privilegeList(privilegeList);
  $$unsubscribe_isTopAdmin();
  return `<form class="grid gap-4 my-3"><fieldset data-testid="role-form" ${!$isTopAdmin ? "disabled" : ""}>${role?.uuid ? `<label class="label"><span data-svelte-h="svelte-xruxbf">UUID:</span> <input type="text" class="input"${add_attribute("value", role?.uuid, 0)} ${"readonly"}></label>` : ``} <label class="label required"><span data-svelte-h="svelte-m2peuz">Name:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", name, 0)}></label> <label class="label required"><span data-svelte-h="svelte-n5lbfe">Description:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", description, 0)}></label> <fieldset data-testid="privilege-checkboxes"><legend class="required" data-svelte-h="svelte-1nmthtq">Privileges:</legend> ${each(privilegeList, ([name2], index) => {
    return `<label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${add_attribute("checked", privileges[index].checked, 1)}> <p>${escape(name2)}</p> </label>`;
  })}</fieldset> ${``} <div data-svelte-h="svelte-56gg4g"><button type="submit" data-testid="role-save-btn" class="btn variant-ghost-primary hover:variant-filled-primary">Save</button> <a href="/admin/configuration" data-testid="role-cancel-btn" class="btn variant-ghost-secondary hover:variant-filled-secondary">Cancel</a></div></fieldset></form>`;
});

export { RoleForm as R };
//# sourceMappingURL=RoleForm-qlbyxI7E.js.map
