import { x as push, S as ensure_array_like, O as attr, U as store_get, a5 as maybe_selected, M as escape_html, X as unsubscribe_stores, z as pop } from './index-DMPVr6nO.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './client2-DxcZr6Tp.js';
import './Privileges-GMiwBHrM.js';
import { a7 as isTopAdmin } from './User-01eW3TFo.js';

function PrivilegeForm($$payload, $$props) {
  push();
  var $$store_subs;
  let { privilege = void 0, applicationList } = $$props;
  let name = privilege ? privilege.name : "";
  let description = privilege ? privilege.description : "";
  let application = privilege ? privilege.application : "";
  const each_array = ensure_array_like(applicationList);
  $$payload.out.push(`<form><fieldset data-testid="privilege-form" class="grid gap-4 my-3"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}>`);
  if (privilege?.uuid) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<label class="label svelte-1xpnd24"><span>UUID:</span> <input type="text" class="input"${attr("value", privilege?.uuid)}${attr("readonly", true, true)}/></label>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <label class="label required svelte-1xpnd24"><span>Name:</span> <input type="text"${attr("value", name)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required svelte-1xpnd24"><span>Description:</span> <input type="text"${attr("value", description)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required svelte-1xpnd24"><span>Application:</span> <select required>`);
  $$payload.select_value = application;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")} disabled>Select an application</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let [name2, uuid] = each_array[$$index];
    $$payload.out.push(`<option${attr("value", uuid)}${maybe_selected($$payload, uuid)}>${escape_html(name2)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></label> <div class="mt-2"><button type="submit" data-testid="privilege-save-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/configuration" data-testid="privilege-cancel-btn" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { PrivilegeForm as P };
//# sourceMappingURL=PrivilegeForm-CDHwtCmO.js.map
