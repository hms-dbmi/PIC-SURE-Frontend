import { x as push, S as ensure_array_like, O as attr, U as store_get, M as escape_html, X as unsubscribe_stores, z as pop } from './index-BYsoXH7a.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './client2-2LGcfZLB.js';
import './Roles-BpCbQHZZ.js';
import { T as isTopAdmin } from './User-CGCqDR6a.js';

function RoleForm($$payload, $$props) {
  push();
  var $$store_subs;
  let { role = void 0, privilegeList } = $$props;
  let name = role ? role.name : "";
  let description = role ? role.description : "";
  let privileges = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    privilegeList.map(([_name, uuid]) => ({ uuid, checked: role ? role.privileges.includes(uuid) : false }))
  );
  const each_array = ensure_array_like(privilegeList);
  $$payload.out.push(`<form><fieldset data-testid="role-form" class="grid gap-4 my-3"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}>`);
  if (role?.uuid) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<label class="label"><span>UUID:</span> <input type="text" class="input"${attr("value", role?.uuid)}${attr("readonly", true, true)}/></label>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <label class="label required"><span>Name:</span> <input type="text"${attr("value", name)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required"><span>Description:</span> <input type="text"${attr("value", description)} class="input" required minlength="1" maxlength="255"/></label> <fieldset data-testid="privilege-checkboxes"><legend class="required">Privileges:</legend> <!--[-->`);
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let [name2] = each_array[index];
    $$payload.out.push(`<label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${attr("checked", privileges[index].checked, true)}/> <div>${escape_html(name2)}</div></label>`);
  }
  $$payload.out.push(`<!--]--></fieldset> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="mt-2"><button type="submit" data-testid="role-save-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/configuration" data-testid="role-cancel-btn" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { RoleForm as R };
//# sourceMappingURL=RoleForm-MfZYiP_c.js.map
