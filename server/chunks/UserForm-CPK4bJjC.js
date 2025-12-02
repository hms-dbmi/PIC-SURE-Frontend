import { x as push, S as ensure_array_like, M as escape_html, O as attr, N as attr_class, Q as stringify, a5 as maybe_selected, z as pop } from './index-C9dy-hDW.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './client2-BVaV_p61.js';
import { S as Switch } from './Switch-BaHCJXB0.js';
import './User-CeJunCPd.js';
import './Users-BK7CL9sx.js';
import './Connections-4SliUl-7.js';
import './Roles-BM28ynMK.js';
import './Privileges-CfGQH9Ip.js';

function UserForm($$payload, $$props) {
  push();
  let { user = void 0, roleList, connections } = $$props;
  let email = user && user.email ? user.email : "";
  let connection = user && user.connection ? user.connection : "";
  let active = user ? user.active : true;
  let roles = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    roleList.map(([_name, uuid]) => ({ uuid, checked: user ? user.roles.includes(uuid) : false }))
  );
  const each_array = ensure_array_like(connections);
  const each_array_1 = ensure_array_like(roleList);
  $$payload.out.push(`<form><fieldset data-testid="user-form" class="grid gap-4 my-3">`);
  Switch($$payload, {
    name: "Active",
    controlActive: "bg-success-500",
    label: "Status",
    checked: active,
    onCheckedChange: () => active = !active,
    children: ($$payload2) => {
      $$payload2.out.push(`<!---->${escape_html(active ? "Active" : "Inactive")}`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> `);
  if (user?.uuid) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<label class="label"><span>UUID:</span> <input type="text" class="input"${attr("value", user?.uuid)} disabled/></label> <label class="label"><span>Subject:</span> <input type="text" class="input"${attr("value", user?.subject)} disabled/></label>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <label${attr_class(`label ${stringify(user?.email ?? "required")}`)}><span>Email:</span> <input type="email"${attr("value", email)} class="input" required${attr("disabled", !!user?.email, true)} minlength="1" maxlength="255"/></label> <label${attr_class(`label ${stringify(user?.email ?? "required")}`)}><span>Connection:</span> <select required${attr("disabled", !!user?.connection, true)}>`);
  $$payload.select_value = connection;
  $$payload.out.push(`<option${attr("selected", !user || !user.connection, true)} disabled value=""${maybe_selected($$payload, true)}>none</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let connection2 = each_array[$$index];
    $$payload.out.push(`<option${attr("value", connection2.uuid)}${maybe_selected($$payload, connection2.uuid)}${attr("selected", user && user.connection === connection2.uuid, true)}>${escape_html(connection2.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></label> <fieldset data-testid="privilege-checkboxes"><legend class="required">Roles:</legend> <!--[-->`);
  for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
    let [name] = each_array_1[index];
    $$payload.out.push(`<label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${attr("checked", roles[index].checked, true)}/> <div>${escape_html(name)}</div></label>`);
  }
  $$payload.out.push(`<!--]--></fieldset> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="mt-2"><button type="submit" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/users" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`);
  pop();
}

export { UserForm as U };
//# sourceMappingURL=UserForm-CPK4bJjC.js.map
