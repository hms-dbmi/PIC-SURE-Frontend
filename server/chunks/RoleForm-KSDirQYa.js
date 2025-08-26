import { x as push, R as ensure_array_like, N as attr, T as store_get, K as escape_html, W as unsubscribe_stores, z as pop } from './index-C5NonOVO.js';
import './client2-CLhyDddE.js';
import './Roles-CWZH5hrE.js';
import { T as isTopAdmin } from './User-ByrNDeqq.js';

function RoleForm($$payload, $$props) {
  push();
  var $$store_subs;
  let { role = void 0, privilegeList } = $$props;
  let name = role ? role.name : "";
  let description = role ? role.description : "";
  let privileges = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    privilegeList.map(([_name, uuid]) => ({
      uuid,
      checked: role ? role.privileges.includes(uuid) : false
    }))
  );
  const each_array = ensure_array_like(privilegeList);
  $$payload.out += `<form><fieldset data-testid="role-form" class="grid gap-4 my-3"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}>`;
  if (role?.uuid) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<label class="label"><span>UUID:</span> <input type="text" class="input"${attr("value", role?.uuid)}${attr("readonly", true, true)}/></label>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <label class="label required"><span>Name:</span> <input type="text"${attr("value", name)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required"><span>Description:</span> <input type="text"${attr("value", description)} class="input" required minlength="1" maxlength="255"/></label> <fieldset data-testid="privilege-checkboxes"><legend class="required">Privileges:</legend> <!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let [name2] = each_array[index];
    $$payload.out += `<label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${attr("checked", privileges[index].checked, true)}/> <div>${escape_html(name2)}</div></label>`;
  }
  $$payload.out += `<!--]--></fieldset> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mt-2"><button type="submit" data-testid="role-save-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/configuration" data-testid="role-cancel-btn" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { RoleForm as R };
//# sourceMappingURL=RoleForm-KSDirQYa.js.map
