import { x as push, R as ensure_array_like, N as attr, M as attr_class, P as stringify, K as escape_html, z as pop, Q as props_id, S as spread_attributes, O as clsx } from './index-BKfiikQf.js';
import './client-HRCS46UK.js';
import { a as getWindow, g as getDocument, X as isVirtualClick, d as getEventTarget, Y as isMac, o as createMachine, q as createGuards, Z as dispatchInputCheckedEvent, _ as setElementChecked, $ as trackFormControl, a0 as trackPress, v as dataAttr, a1 as visuallyHiddenStyle, p as createAnatomy, a2 as isSafari } from './index-BB9JrA1L.js';
import { c as createProps, u as useMachine, n as normalizeProps } from './machine.svelte-D_VZYMjT.js';
import './Users-Rh2LFPC7.js';
import './Connections-D53FXc8x.js';
import './Roles-CHsR1lsS.js';
import './Privileges-BTeK4lJj.js';
import './toaster-DzAsAKEJ.js';

// src/index.ts
function isValidKey(e) {
  return !(e.metaKey || !isMac() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
var nonTextInputTypes = /* @__PURE__ */ new Set(["checkbox", "radio", "range", "color", "file", "image", "button", "submit", "reset"]);
function isKeyboardFocusEvent(isTextInput, modality, e) {
  const target = e ? getEventTarget(e) : null;
  const win = getWindow(target);
  isTextInput = isTextInput || target instanceof win.HTMLInputElement && !nonTextInputTypes.has(target?.type) || target instanceof win.HTMLTextAreaElement || target instanceof win.HTMLElement && target.isContentEditable;
  return !(isTextInput && modality === "keyboard" && e instanceof win.KeyboardEvent && !Reflect.has(FOCUS_VISIBLE_INPUT_KEYS, e.key));
}
var currentModality = null;
var changeHandlers = /* @__PURE__ */ new Set();
var listenerMap = /* @__PURE__ */ new Map();
var hasEventBeforeFocus = false;
var hasBlurredWindowRecently = false;
var FOCUS_VISIBLE_INPUT_KEYS = {
  Tab: true,
  Escape: true
};
function triggerChangeHandlers(modality, e) {
  for (let handler of changeHandlers) {
    handler(modality, e);
  }
}
function handleKeyboardEvent(e) {
  hasEventBeforeFocus = true;
  if (isValidKey(e)) {
    currentModality = "keyboard";
    triggerChangeHandlers("keyboard", e);
  }
}
function handlePointerEvent(e) {
  currentModality = "pointer";
  if (e.type === "mousedown" || e.type === "pointerdown") {
    hasEventBeforeFocus = true;
    triggerChangeHandlers("pointer", e);
  }
}
function handleClickEvent(e) {
  if (isVirtualClick(e)) {
    hasEventBeforeFocus = true;
    currentModality = "virtual";
  }
}
function handleFocusEvent(e) {
  const target = getEventTarget(e);
  if (target === getWindow(target) || target === getDocument(target)) {
    return;
  }
  if (!hasEventBeforeFocus && !hasBlurredWindowRecently) {
    currentModality = "virtual";
    triggerChangeHandlers("virtual", e);
  }
  hasEventBeforeFocus = false;
  hasBlurredWindowRecently = false;
}
function handleWindowBlur() {
  hasEventBeforeFocus = false;
  hasBlurredWindowRecently = true;
}
function setupGlobalFocusEvents(root) {
  if (typeof window === "undefined" || listenerMap.get(getWindow(root))) {
    return;
  }
  const win = getWindow(root);
  const doc = getDocument(root);
  let focus = win.HTMLElement.prototype.focus;
  function patchedFocus() {
    currentModality = "virtual";
    triggerChangeHandlers("virtual", null);
    hasEventBeforeFocus = true;
    focus.apply(this, arguments);
  }
  Object.defineProperty(win.HTMLElement.prototype, "focus", {
    configurable: true,
    value: patchedFocus
  });
  doc.addEventListener("keydown", handleKeyboardEvent, true);
  doc.addEventListener("keyup", handleKeyboardEvent, true);
  doc.addEventListener("click", handleClickEvent, true);
  win.addEventListener("focus", handleFocusEvent, true);
  win.addEventListener("blur", handleWindowBlur, false);
  if (typeof win.PointerEvent !== "undefined") {
    doc.addEventListener("pointerdown", handlePointerEvent, true);
    doc.addEventListener("pointermove", handlePointerEvent, true);
    doc.addEventListener("pointerup", handlePointerEvent, true);
  } else {
    doc.addEventListener("mousedown", handlePointerEvent, true);
    doc.addEventListener("mousemove", handlePointerEvent, true);
    doc.addEventListener("mouseup", handlePointerEvent, true);
  }
  win.addEventListener(
    "beforeunload",
    () => {
      tearDownWindowFocusTracking(root);
    },
    { once: true }
  );
  listenerMap.set(win, { focus });
}
var tearDownWindowFocusTracking = (root, loadListener) => {
  const win = getWindow(root);
  const doc = getDocument(root);
  if (!listenerMap.has(win)) {
    return;
  }
  win.HTMLElement.prototype.focus = listenerMap.get(win).focus;
  doc.removeEventListener("keydown", handleKeyboardEvent, true);
  doc.removeEventListener("keyup", handleKeyboardEvent, true);
  doc.removeEventListener("click", handleClickEvent, true);
  win.removeEventListener("focus", handleFocusEvent, true);
  win.removeEventListener("blur", handleWindowBlur, false);
  if (typeof win.PointerEvent !== "undefined") {
    doc.removeEventListener("pointerdown", handlePointerEvent, true);
    doc.removeEventListener("pointermove", handlePointerEvent, true);
    doc.removeEventListener("pointerup", handlePointerEvent, true);
  } else {
    doc.removeEventListener("mousedown", handlePointerEvent, true);
    doc.removeEventListener("mousemove", handlePointerEvent, true);
    doc.removeEventListener("mouseup", handlePointerEvent, true);
  }
  listenerMap.delete(win);
};
function isFocusVisible() {
  return currentModality === "keyboard";
}
function trackFocusVisible(props = {}) {
  const { isTextInput, autoFocus, onChange, root } = props;
  setupGlobalFocusEvents(root);
  onChange?.({ isFocusVisible: autoFocus || isFocusVisible(), modality: currentModality });
  const handler = (modality, e) => {
    if (!isKeyboardFocusEvent(!!isTextInput, modality, e)) return;
    onChange?.({ isFocusVisible: isFocusVisible(), modality });
  };
  changeHandlers.add(handler);
  return () => {
    changeHandlers.delete(handler);
  };
}

// src/switch.anatomy.ts
var anatomy = createAnatomy("switch").parts("root", "label", "control", "thumb");
var parts = anatomy.build();

// src/switch.dom.ts
var getRootId = (ctx) => ctx.ids?.root ?? `switch:${ctx.id}`;
var getLabelId = (ctx) => ctx.ids?.label ?? `switch:${ctx.id}:label`;
var getThumbId = (ctx) => ctx.ids?.thumb ?? `switch:${ctx.id}:thumb`;
var getControlId = (ctx) => ctx.ids?.control ?? `switch:${ctx.id}:control`;
var getHiddenInputId = (ctx) => ctx.ids?.hiddenInput ?? `switch:${ctx.id}:input`;
var getRootEl = (ctx) => ctx.getById(getRootId(ctx));
var getHiddenInputEl = (ctx) => ctx.getById(getHiddenInputId(ctx));

// src/switch.connect.ts
function connect(service, normalize) {
  const { context, send, prop, scope } = service;
  const disabled = prop("disabled");
  const readOnly = prop("readOnly");
  const checked = !!context.get("checked");
  const focused = !disabled && context.get("focused");
  const focusVisible = !disabled && context.get("focusVisible");
  const dataAttrs = {
    "data-active": dataAttr(context.get("active")),
    "data-focus": dataAttr(focused),
    "data-focus-visible": dataAttr(focusVisible),
    "data-readonly": dataAttr(readOnly),
    "data-hover": dataAttr(context.get("hovered")),
    "data-disabled": dataAttr(disabled),
    "data-state": checked ? "checked" : "unchecked",
    "data-invalid": dataAttr(prop("invalid"))
  };
  return {
    checked,
    disabled,
    focused,
    setChecked(checked2) {
      send({ type: "CHECKED.SET", checked: checked2, isTrusted: false });
    },
    toggleChecked() {
      send({ type: "CHECKED.TOGGLE", checked, isTrusted: false });
    },
    getRootProps() {
      return normalize.label({
        ...parts.root.attrs,
        ...dataAttrs,
        dir: prop("dir"),
        id: getRootId(scope),
        htmlFor: getHiddenInputId(scope),
        onPointerMove() {
          if (disabled) return;
          send({ type: "CONTEXT.SET", context: { hovered: true } });
        },
        onPointerLeave() {
          if (disabled) return;
          send({ type: "CONTEXT.SET", context: { hovered: false } });
        },
        onClick(event) {
          if (disabled) return;
          const target = getEventTarget(event);
          if (target === getHiddenInputEl(scope)) {
            event.stopPropagation();
          }
          if (isSafari()) {
            getHiddenInputEl(scope)?.focus();
          }
        }
      });
    },
    getLabelProps() {
      return normalize.element({
        ...parts.label.attrs,
        ...dataAttrs,
        dir: prop("dir"),
        id: getLabelId(scope)
      });
    },
    getThumbProps() {
      return normalize.element({
        ...parts.thumb.attrs,
        ...dataAttrs,
        dir: prop("dir"),
        id: getThumbId(scope),
        "aria-hidden": true
      });
    },
    getControlProps() {
      return normalize.element({
        ...parts.control.attrs,
        ...dataAttrs,
        dir: prop("dir"),
        id: getControlId(scope),
        "aria-hidden": true
      });
    },
    getHiddenInputProps() {
      return normalize.input({
        id: getHiddenInputId(scope),
        type: "checkbox",
        required: prop("required"),
        defaultChecked: checked,
        disabled,
        "aria-labelledby": getLabelId(scope),
        "aria-invalid": prop("invalid"),
        name: prop("name"),
        form: prop("form"),
        value: prop("value"),
        style: visuallyHiddenStyle,
        onFocus() {
          const focusVisible2 = isFocusVisible();
          send({ type: "CONTEXT.SET", context: { focused: true, focusVisible: focusVisible2 } });
        },
        onBlur() {
          send({ type: "CONTEXT.SET", context: { focused: false, focusVisible: false } });
        },
        onClick(event) {
          if (readOnly) {
            event.preventDefault();
            return;
          }
          const checked2 = event.currentTarget.checked;
          send({ type: "CHECKED.SET", checked: checked2, isTrusted: true });
        }
      });
    }
  };
}
var { not } = createGuards();
var machine = createMachine({
  props({ props: props2 }) {
    return {
      defaultChecked: false,
      label: "switch",
      value: "on",
      ...props2
    };
  },
  initialState() {
    return "ready";
  },
  context({ prop, bindable }) {
    return {
      checked: bindable(() => ({
        defaultValue: prop("defaultChecked"),
        value: prop("checked"),
        onChange(value) {
          prop("onCheckedChange")?.({ checked: value });
        }
      })),
      fieldsetDisabled: bindable(() => ({
        defaultValue: false
      })),
      focusVisible: bindable(() => ({
        defaultValue: false
      })),
      active: bindable(() => ({
        defaultValue: false
      })),
      focused: bindable(() => ({
        defaultValue: false
      })),
      hovered: bindable(() => ({
        defaultValue: false
      }))
    };
  },
  computed: {
    isDisabled: ({ context, prop }) => prop("disabled") || context.get("fieldsetDisabled")
  },
  watch({ track, prop, context, action }) {
    track([() => prop("disabled")], () => {
      action(["removeFocusIfNeeded"]);
    });
    track([() => context.get("checked")], () => {
      action(["syncInputElement"]);
    });
  },
  effects: ["trackFormControlState", "trackPressEvent", "trackFocusVisible"],
  on: {
    "CHECKED.TOGGLE": [
      {
        guard: not("isTrusted"),
        actions: ["toggleChecked", "dispatchChangeEvent"]
      },
      {
        actions: ["toggleChecked"]
      }
    ],
    "CHECKED.SET": [
      {
        guard: not("isTrusted"),
        actions: ["setChecked", "dispatchChangeEvent"]
      },
      {
        actions: ["setChecked"]
      }
    ],
    "CONTEXT.SET": {
      actions: ["setContext"]
    }
  },
  states: {
    ready: {}
  },
  implementations: {
    guards: {
      isTrusted: ({ event }) => !!event.isTrusted
    },
    effects: {
      trackPressEvent({ computed, scope, context }) {
        if (computed("isDisabled")) return;
        return trackPress({
          pointerNode: getRootEl(scope),
          keyboardNode: getHiddenInputEl(scope),
          isValidKey: (event) => event.key === " ",
          onPress: () => context.set("active", false),
          onPressStart: () => context.set("active", true),
          onPressEnd: () => context.set("active", false)
        });
      },
      trackFocusVisible({ computed, scope }) {
        if (computed("isDisabled")) return;
        return trackFocusVisible({ root: scope.getRootNode() });
      },
      trackFormControlState({ context, send, scope }) {
        return trackFormControl(getHiddenInputEl(scope), {
          onFieldsetDisabledChange(disabled) {
            context.set("fieldsetDisabled", disabled);
          },
          onFormReset() {
            const checked = context.initial("checked");
            send({ type: "CHECKED.SET", checked: !!checked, src: "form-reset" });
          }
        });
      }
    },
    actions: {
      setContext({ context, event }) {
        for (const key in event.context) {
          context.set(key, event.context[key]);
        }
      },
      syncInputElement({ context, scope }) {
        const inputEl = getHiddenInputEl(scope);
        if (!inputEl) return;
        setElementChecked(inputEl, !!context.get("checked"));
      },
      removeFocusIfNeeded({ context, prop }) {
        if (prop("disabled")) {
          context.set("focused", false);
        }
      },
      setChecked({ context, event }) {
        context.set("checked", event.checked);
      },
      toggleChecked({ context }) {
        context.set("checked", !context.get("checked"));
      },
      dispatchChangeEvent({ context, scope }) {
        const inputEl = getHiddenInputEl(scope);
        dispatchInputCheckedEvent(inputEl, { checked: context.get("checked") });
      }
    }
  }
});
createProps()([
  "checked",
  "defaultChecked",
  "dir",
  "disabled",
  "form",
  "getRootNode",
  "id",
  "ids",
  "invalid",
  "label",
  "name",
  "onCheckedChange",
  "readOnly",
  "required",
  "value"
]);

function Switch($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    compact = false,
    // Root (Track)
    base = "inline-flex items-center gap-4",
    classes = "",
    // State
    stateFocused = "data-[focus-visible]:focused",
    // Control
    controlBase = "cursor-pointer transition duration-200",
    controlInactive = "preset-filled-surface-200-800",
    controlActive = "preset-filled-primary-500",
    controlDisabled = "opacity-50 cursor-not-allowed",
    controlWidth = "w-10",
    controlHeight = "h-6",
    controlPadding = "p-0.5",
    controlRounded = "rounded-full",
    controlHover = "hover:brightness-90 dark:hover:brightness-110",
    controlClasses = "",
    // Thumb
    thumbBase = "right-0 aspect-square h-full flex justify-center items-center text-right cursor-pointer",
    thumbInactive = "preset-filled-surface-50-950",
    thumbActive = "bg-surface-50 text-surface-contrast-50",
    thumbRounded = "rounded-full",
    thumbTranslateX = "translate-x-4 rtl:-translate-x-4",
    thumbTransition = "transition",
    thumbEase = "ease-in-out",
    thumbDuration = "duration-200",
    thumbClasses = "",
    // Label
    labelBase = "",
    labelClasses = "",
    // Icons
    iconInactiveBase = "pointer-events-none",
    iconActiveBase = "pointer-events-none",
    // Snippets
    children,
    inactiveChild,
    activeChild,
    $$slots,
    $$events,
    // ZagProps
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  const rxControlBase = compact ? thumbBase : controlBase;
  const rxControlHeight = compact ? "" : controlHeight;
  const rxControlPadding = compact ? "" : controlPadding;
  const rxThumbInactive = compact ? controlInactive : thumbInactive;
  const rxThumbActive = compact ? controlActive : thumbActive;
  const rxThumbTranslateX = compact ? "" : thumbTranslateX;
  const rxTrackState = api.checked ? controlActive : controlInactive;
  const rxThumbState = api.checked ? `${rxThumbActive} ${rxThumbTranslateX}` : rxThumbInactive;
  const rxDisabled = api.disabled ? controlDisabled : "";
  const rxFocused = api.focused ? stateFocused : "";
  $$payload.out += `<label${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(classes)}`,
      "data-testid": "switch"
    },
    null
  )}><input${spread_attributes(
    {
      ...api.getHiddenInputProps(),
      "data-testid": "switch-input"
    },
    null
  )}/> <span${spread_attributes(
    {
      ...api.getControlProps(),
      class: `${stringify(rxControlBase)} ${stringify(rxTrackState)} ${stringify(rxFocused)} ${stringify(controlWidth)} ${stringify(rxControlHeight)} ${stringify(rxControlPadding)} ${stringify(controlRounded)} ${stringify(controlHover)} ${stringify(rxDisabled)} ${stringify(controlClasses)}`,
      "data-testid": "switch-control"
    },
    null
  )}><span${spread_attributes(
    {
      ...api.getThumbProps(),
      class: `${stringify(thumbBase)} ${stringify(rxThumbState)} ${stringify(thumbRounded)} ${stringify(thumbTransition)} ${stringify(thumbEase)} ${stringify(thumbDuration)} ${stringify(thumbClasses)}`,
      "data-testid": "switch-thumb"
    },
    null
  )}>`;
  if (!api.checked && inactiveChild) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span${attr_class(clsx(iconInactiveBase))} data-testid="switch-icon-inactive">`;
    inactiveChild($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (api.checked && activeChild) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span${attr_class(clsx(iconActiveBase))} data-testid="switch-icon-active">`;
    activeChild($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></span></span> `;
  if (children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span${spread_attributes(
      {
        ...api.getLabelProps(),
        class: `${stringify(labelBase)} ${stringify(labelClasses)}`,
        "data-testid": "switch-label"
      },
      null
    )}>`;
    children($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></label>`;
  pop();
}
function UserForm($$payload, $$props) {
  push();
  let { user = void 0, roleList, connections } = $$props;
  let email = user && user.email ? user.email : "";
  user && user.connection ? user.connection : "";
  let active = user ? user.active : true;
  let roles = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    roleList.map(([_name, uuid]) => ({
      uuid,
      checked: user ? user.roles.includes(uuid) : false
    }))
  );
  const each_array = ensure_array_like(connections);
  const each_array_1 = ensure_array_like(roleList);
  $$payload.out += `<form><fieldset data-testid="user-form" class="grid gap-4 my-3">`;
  Switch($$payload, {
    name: "Active",
    controlActive: "bg-success-500",
    label: "Status",
    checked: active,
    onCheckedChange: () => active = !active,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html(active ? "Active" : "Inactive")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  if (user?.uuid) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<label class="label"><span>UUID:</span> <input type="text" class="input"${attr("value", user?.uuid)} disabled/></label> <label class="label"><span>Subject:</span> <input type="text" class="input"${attr("value", user?.subject)} disabled/></label>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <label${attr_class(`label ${stringify(user?.email ?? "required")}`)}><span>Email:</span> <input type="email"${attr("value", email)} class="input" required${attr("disabled", !!user?.email, true)} minlength="1" maxlength="255"/></label> <label${attr_class(`label ${stringify(user?.email ?? "required")}`)}><span>Connection:</span> <select class="select" required${attr("disabled", !!user?.connection, true)}><option${attr("selected", !user || !user.connection, true)} disabled value="">none</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let connection = each_array[$$index];
    $$payload.out += `<option${attr("value", connection.uuid)}${attr("selected", user && user.connection === connection.uuid, true)}>${escape_html(connection.label)}</option>`;
  }
  $$payload.out += `<!--]--></select></label> <fieldset data-testid="privilege-checkboxes"><legend class="required">Roles:</legend> <!--[-->`;
  for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
    let [name] = each_array_1[index];
    $$payload.out += `<label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${attr("checked", roles[index].checked, true)}/> <div>${escape_html(name)}</div></label>`;
  }
  $$payload.out += `<!--]--></fieldset> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mt-2"><button type="submit" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/users" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`;
  pop();
}

export { UserForm as U };
//# sourceMappingURL=UserForm-V1t2UVg0.js.map
