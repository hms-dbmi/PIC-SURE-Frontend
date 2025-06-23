import { x as push, R as ensure_array_like, N as attr, T as store_get, K as escape_html, W as unsubscribe_stores, z as pop } from './index-BKfiikQf.js';
import './client-HRCS46UK.js';
import './Privileges-BTeK4lJj.js';
import { b as isTopAdmin } from './User-DPh8mmLT.js';
import './toaster-DzAsAKEJ.js';

function PrivilegeForm($$payload, $$props) {
  push();
  var $$store_subs;
  let { privilege = void 0, applicationList } = $$props;
  let name = privilege ? privilege.name : "";
  let description = privilege ? privilege.description : "";
  privilege ? privilege.application : "";
  const each_array = ensure_array_like(applicationList);
  $$payload.out += `<form><fieldset data-testid="privilege-form" class="grid gap-4 my-3"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}>`;
  if (privilege?.uuid) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<label class="label svelte-1s684wv"><span>UUID:</span> <input type="text" class="input"${attr("value", privilege?.uuid)}${attr("readonly", true, true)}/></label>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <label class="label required svelte-1s684wv"><span>Name:</span> <input type="text"${attr("value", name)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required svelte-1s684wv"><span>Description:</span> <input type="text"${attr("value", description)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required svelte-1s684wv"><span>Application:</span> <select class="select" required><option value="" disabled>Select an application</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let [name2, uuid] = each_array[$$index];
    $$payload.out += `<option${attr("value", uuid)}>${escape_html(name2)}</option>`;
  }
  $$payload.out += `<!--]--></select></label> <div class="mt-2"><button type="submit" data-testid="privilege-save-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/configuration" data-testid="privilege-cancel-btn" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { PrivilegeForm as P };
//# sourceMappingURL=PrivilegeForm-DP5HGDAx.js.map
