import { c as create_ssr_component, v as validate_component, e as escape, a as add_attribute, b as each, s as spread, g as escape_attribute_value, f as escape_object } from './ssr-BRJpAXVH.js';
import './client-BR749xJD.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { p as compute_rest_props, k as createEventDispatcher, m as compute_slots } from './lifecycle-DtuISP6h.js';
import './Users-D5L4zrbw.js';
import './Connections-CKCS-Xz7.js';
import './Roles-CnefkO98.js';
import './Privileges-BZMt1DNq.js';

const cBase = "inline-block";
const cLabel = "unstyled flex items-center";
const cTrack = "flex transition-all duration-[200ms] cursor-pointer";
const cThumb = "w-[50%] h-full scale-[0.8] transition-all duration-[200ms] shadow";
const SlideToggle = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let cTrackActive;
  let cThumbBackground;
  let cThumbPos;
  let classesDisabled;
  let classesBase;
  let classesLabel;
  let classesTrack;
  let classesThumb;
  let $$restProps = compute_rest_props($$props, ["name", "checked", "size", "background", "active", "border", "rounded", "label"]);
  let $$slots = compute_slots(slots);
  createEventDispatcher();
  let { name } = $$props;
  let { checked = false } = $$props;
  let { size = "md" } = $$props;
  let { background = "bg-surface-400 dark:bg-surface-700" } = $$props;
  let { active = "bg-surface-900 dark:bg-surface-300" } = $$props;
  let { border = "" } = $$props;
  let { rounded = "rounded-full" } = $$props;
  let { label = "" } = $$props;
  let trackSize;
  switch (size) {
    case "sm":
      trackSize = "w-12 h-6";
      break;
    case "lg":
      trackSize = "w-20 h-10";
      break;
    default:
      trackSize = "w-16 h-8";
  }
  function prunedRestProps() {
    delete $$restProps.class;
    return $$restProps;
  }
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.background === void 0 && $$bindings.background && background !== void 0) $$bindings.background(background);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  if ($$props.border === void 0 && $$bindings.border && border !== void 0) $$bindings.border(border);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0) $$bindings.label(label);
  cTrackActive = checked ? active : `${background} cursor-pointer`;
  cThumbBackground = checked ? "bg-white/75" : "bg-white";
  cThumbPos = checked ? "translate-x-full" : "";
  classesDisabled = $$props.disabled === true ? "opacity-50" : "hover:brightness-[105%] dark:hover:brightness-110 cursor-pointer";
  classesBase = `${cBase} ${rounded} ${classesDisabled} ${$$props.class ?? ""}`;
  classesLabel = `${cLabel}`;
  classesTrack = `${cTrack} ${border} ${rounded} ${trackSize} ${cTrackActive}`;
  classesThumb = `${cThumb} ${rounded} ${cThumbBackground} ${cThumbPos}`;
  return `<div${add_attribute("id", label, 0)} class="${"slide-toggle " + escape(classesBase, true)}" data-testid="slide-toggle" role="switch"${add_attribute("aria-label", label, 0)}${add_attribute("aria-checked", checked, 0)} tabindex="0"><label class="${"slide-toggle-label " + escape(classesLabel, true)}"> <input${spread(
    [
      { type: "checkbox" },
      { class: "slide-toggle-input hidden" },
      { name: escape_attribute_value(name) },
      escape_object(prunedRestProps()),
      { disabled: $$props.disabled || null }
    ],
    {}
  )}${add_attribute("checked", checked, 1)}>  <div class="${[
    "slide-toggle-track " + escape(classesTrack, true),
    $$props.disabled ? "cursor-not-allowed" : ""
  ].join(" ").trim()}"><div class="${[
    "slide-toggle-thumb " + escape(classesThumb, true),
    $$props.disabled ? "cursor-not-allowed" : ""
  ].join(" ").trim()}"></div></div>  ${$$slots.default ? `<div class="slide-toggle-text ml-3">${slots.default ? slots.default({}) : ``}</div>` : ``}</label></div>`;
});
const UserForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getToastStore();
  let { user = void 0 } = $$props;
  let { roleList } = $$props;
  let { connections } = $$props;
  let email = user && user.email ? user.email : "";
  user && user.connection ? user.connection : "";
  let active = user ? user.active : true;
  let roles = roleList.map(([_name, uuid]) => ({
    uuid,
    checked: user ? user.roles.includes(uuid) : false
  }));
  if ($$props.user === void 0 && $$bindings.user && user !== void 0) $$bindings.user(user);
  if ($$props.roleList === void 0 && $$bindings.roleList && roleList !== void 0) $$bindings.roleList(roleList);
  if ($$props.connections === void 0 && $$bindings.connections && connections !== void 0) $$bindings.connections(connections);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<form class="grid gap-4 my-3">${validate_component(SlideToggle, "SlideToggle").$$render(
      $$result,
      {
        name: "Active",
        size: "sm",
        active: "bg-success-500",
        label: "Status",
        checked: active
      },
      {
        checked: ($$value) => {
          active = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${escape(active ? "Active" : "Inactive")}`;
        }
      }
    )} ${user?.uuid ? `<label class="label"><span data-svelte-h="svelte-xruxbf">UUID:</span> <input type="text" class="input"${add_attribute("value", user?.uuid, 0)} disabled></label> <label class="label"><span data-svelte-h="svelte-1bo23h8">Subject:</span> <input type="text" class="input"${add_attribute("value", user?.subject, 0)} disabled></label>` : ``} <label class="${"label " + escape(user?.email ?? "required", true)}"><span data-svelte-h="svelte-1s4kc5o">Email:</span> <input type="email" class="input" required ${!!user?.email ? "disabled" : ""} minlength="1" maxlength="255"${add_attribute("value", email, 0)}></label> <label class="${"label " + escape(user?.email ?? "required", true)}"><span data-svelte-h="svelte-ir2yyg">Connection:</span> <select class="select" required ${!!user?.connection ? "disabled" : ""}><option ${!user || !user.connection ? "selected" : ""} disabled value>none</option>${each(connections, (connection) => {
      return `<option${add_attribute("value", connection.uuid, 0)} ${user && user.connection === connection.uuid ? "selected" : ""}>${escape(connection.label)}</option>`;
    })}</select></label> <fieldset data-testid="privilege-checkboxes"><legend class="required" data-svelte-h="svelte-12sbs1l">Roles:</legend> ${each(roleList, ([name], index) => {
      return `<label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${add_attribute("checked", roles[index].checked, 1)}> <p>${escape(name)}</p> </label>`;
    })}</fieldset> ${``} <div data-svelte-h="svelte-g6nnqz"><button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">Save</button> <a href="/admin/users" class="btn variant-ghost-secondary hover:variant-filled-secondary">Cancel</a></div></form>`;
  } while (!$$settled);
  return $$rendered;
});

export { UserForm as U };
//# sourceMappingURL=UserForm-BF8DEzct.js.map
