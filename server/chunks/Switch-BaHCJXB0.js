import { x as push, R as props_id, T as spread_attributes, Q as stringify, N as attr_class, P as clsx, z as pop } from './index-C9dy-hDW.js';
import { p as createAnatomy, d as createMachine, Q as createGuards, R as dispatchInputCheckedEvent, S as setElementChecked, T as trackFormControl, U as trackPress, V as dataAttr, W as visuallyHiddenStyle, H as getEventTarget, X as isSafari, Y as getWindow, x as getDocument, Z as isVirtualClick, _ as isMac } from './User-CeJunCPd.js';
import { c as createProps, u as useMachine, n as normalizeProps } from './Loading-Bei-CWQ1.js';

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
var anatomy = createAnatomy("switch").parts("root", "label", "control", "thumb");
var parts = anatomy.build();
var getRootId = (ctx) => ctx.ids?.root ?? `switch:${ctx.id}`;
var getLabelId = (ctx) => ctx.ids?.label ?? `switch:${ctx.id}:label`;
var getThumbId = (ctx) => ctx.ids?.thumb ?? `switch:${ctx.id}:thumb`;
var getControlId = (ctx) => ctx.ids?.control ?? `switch:${ctx.id}:control`;
var getHiddenInputId = (ctx) => ctx.ids?.hiddenInput ?? `switch:${ctx.id}:input`;
var getRootEl = (ctx) => ctx.getById(getRootId(ctx));
var getHiddenInputEl = (ctx) => ctx.getById(getHiddenInputId(ctx));
function connect(service, normalize) {
  const { context, send, prop, scope } = service;
  const disabled = !!prop("disabled");
  const readOnly = !!prop("readOnly");
  const required = !!prop("required");
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
    "data-invalid": dataAttr(prop("invalid")),
    "data-required": dataAttr(required)
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
    base = "inline-flex items-center gap-4",
    classes = "",
    stateFocused = "data-[focus-visible]:focused",
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
    thumbBase = "right-0 aspect-square h-full flex justify-center items-center text-right cursor-pointer",
    thumbInactive = "preset-filled-surface-50-950",
    thumbActive = "bg-surface-50 text-surface-contrast-50",
    thumbRounded = "rounded-full",
    thumbTranslateX = "translate-x-4 rtl:-translate-x-4",
    thumbTransition = "transition",
    thumbEase = "ease-in-out",
    thumbDuration = "duration-200",
    thumbClasses = "",
    labelBase = "",
    labelClasses = "",
    iconInactiveBase = "pointer-events-none",
    iconActiveBase = "pointer-events-none",
    children,
    inactiveChild,
    activeChild,
    $$slots,
    $$events,
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
  $$payload.out.push(`<label${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(classes)}`,
      "data-testid": "switch"
    },
    null
  )}><input${spread_attributes({ ...api.getHiddenInputProps(), "data-testid": "switch-input" }, null, void 0, void 0, 4)}/> <span${spread_attributes(
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
  )}>`);
  if (!api.checked && inactiveChild) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span${attr_class(clsx(iconInactiveBase))} data-testid="switch-icon-inactive">`);
    inactiveChild($$payload);
    $$payload.out.push(`<!----></span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (api.checked && activeChild) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span${attr_class(clsx(iconActiveBase))} data-testid="switch-icon-active">`);
    activeChild($$payload);
    $$payload.out.push(`<!----></span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></span></span> `);
  if (children) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span${spread_attributes(
      {
        ...api.getLabelProps(),
        class: `${stringify(labelBase)} ${stringify(labelClasses)}`,
        "data-testid": "switch-label"
      },
      null
    )}>`);
    children($$payload);
    $$payload.out.push(`<!----></span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></label>`);
  pop();
}

export { Switch as S };
//# sourceMappingURL=Switch-BaHCJXB0.js.map
