import { M as escape_html, _ as current_component, x as push, R as props_id, T as spread_attributes, Q as stringify, N as attr_class, O as attr, z as pop, $ as run, F as noop } from './index-DMPVr6nO.js';
import { a as createMachine, b as memo, d as isNumber, e as getValuePercent, f as createAnatomy, h as createScope, j as compact, k as ensure, M as MachineStatus, l as isFunction, n as identity, w as warn, o as toArray, p as isString, I as INIT_STATE } from './User-01eW3TFo.js';

// src/prop-types.ts
function createNormalizer(fn) {
  return new Proxy({}, {
    get(_target, key) {
      if (key === "style")
        return (props) => {
          return fn({ style: props }).style;
        };
      return fn;
    }
  });
}

// src/create-props.ts
var createProps = () => (props) => Array.from(new Set(props));

// src/progress.anatomy.ts
var anatomy = createAnatomy("progress").parts(
  "root",
  "label",
  "track",
  "range",
  "valueText",
  "view",
  "circle",
  "circleTrack",
  "circleRange"
);
var parts = anatomy.build();

// src/progress.dom.ts
var getRootId = (ctx) => ctx.ids?.root ?? `progress-${ctx.id}`;
var getTrackId = (ctx) => ctx.ids?.track ?? `progress-${ctx.id}-track`;
var getLabelId = (ctx) => ctx.ids?.label ?? `progress-${ctx.id}-label`;
var getCircleId = (ctx) => ctx.ids?.circle ?? `progress-${ctx.id}-circle`;

// src/progress.connect.ts
function connect(service, normalize) {
  const { context, computed, prop, send, scope } = service;
  const percent = computed("percent");
  const percentAsString = computed("isIndeterminate") ? "" : computed("formatter").format(computed("percent") / 100);
  const max = prop("max");
  const min = prop("min");
  const orientation = prop("orientation");
  const translations = prop("translations");
  const indeterminate = computed("isIndeterminate");
  const value = context.get("value");
  const valueAsString = translations?.value({ value, max, percent, min }) ?? "";
  const progressState = getProgressState(value, max);
  const progressbarProps = {
    role: "progressbar",
    "aria-label": valueAsString,
    "data-max": max,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value ?? void 0,
    "data-orientation": orientation,
    "data-state": progressState
  };
  const circleProps2 = getCircleProps(service);
  return {
    value,
    valueAsString,
    min,
    max,
    percent,
    percentAsString,
    indeterminate,
    setValue(value2) {
      send({ type: "VALUE.SET", value: value2 });
    },
    setToMax() {
      send({ type: "VALUE.SET", value: max });
    },
    setToMin() {
      send({ type: "VALUE.SET", value: min });
    },
    getRootProps() {
      return normalize.element({
        dir: prop("dir"),
        ...parts.root.attrs,
        id: getRootId(scope),
        "data-max": max,
        "data-value": value ?? void 0,
        "data-state": progressState,
        "data-orientation": orientation,
        style: {
          "--percent": indeterminate ? void 0 : percent
        }
      });
    },
    getLabelProps() {
      return normalize.element({
        dir: prop("dir"),
        id: getLabelId(scope),
        ...parts.label.attrs,
        "data-orientation": orientation
      });
    },
    getValueTextProps() {
      return normalize.element({
        dir: prop("dir"),
        "aria-live": "polite",
        ...parts.valueText.attrs
      });
    },
    getTrackProps() {
      return normalize.element({
        dir: prop("dir"),
        id: getTrackId(scope),
        ...parts.track.attrs,
        ...progressbarProps
      });
    },
    getRangeProps() {
      return normalize.element({
        dir: prop("dir"),
        ...parts.range.attrs,
        "data-orientation": orientation,
        "data-state": progressState,
        style: {
          [computed("isHorizontal") ? "width" : "height"]: indeterminate ? void 0 : `${percent}%`
        }
      });
    },
    getCircleProps() {
      return normalize.element({
        dir: prop("dir"),
        id: getCircleId(scope),
        ...parts.circle.attrs,
        ...progressbarProps,
        ...circleProps2.root
      });
    },
    getCircleTrackProps() {
      return normalize.element({
        dir: prop("dir"),
        "data-orientation": orientation,
        ...parts.circleTrack.attrs,
        ...circleProps2.track
      });
    },
    getCircleRangeProps() {
      return normalize.element({
        dir: prop("dir"),
        ...parts.circleRange.attrs,
        ...circleProps2.range,
        "data-state": progressState
      });
    },
    getViewProps(props2) {
      return normalize.element({
        dir: prop("dir"),
        ...parts.view.attrs,
        "data-state": props2.state,
        hidden: props2.state !== progressState
      });
    }
  };
}
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
var circleProps = {
  style: {
    "--radius": "calc(var(--size) / 2 - var(--thickness) / 2)",
    cx: "calc(var(--size) / 2)",
    cy: "calc(var(--size) / 2)",
    r: "var(--radius)",
    fill: "transparent",
    strokeWidth: "var(--thickness)"
  }
};
var rootProps = {
  style: {
    width: "var(--size)",
    height: "var(--size)"
  }
};
function getCircleProps(service) {
  const { context, computed } = service;
  return {
    root: rootProps,
    track: circleProps,
    range: {
      opacity: context.get("value") === 0 ? 0 : void 0,
      style: {
        ...circleProps.style,
        "--percent": computed("percent"),
        "--circumference": `calc(2 * 3.14159 * var(--radius))`,
        "--offset": `calc(var(--circumference) * (100 - var(--percent)) / 100)`,
        strokeDashoffset: `calc(var(--circumference) * ((100 - var(--percent)) / 100))`,
        strokeDasharray: computed("isIndeterminate") ? void 0 : `var(--circumference)`,
        transformOrigin: "center",
        transform: "rotate(-90deg)"
      }
    }
  };
}
var machine = createMachine({
  props({ props: props2 }) {
    const min = props2.min ?? 0;
    const max = props2.max ?? 100;
    return {
      ...props2,
      max,
      min,
      defaultValue: props2.defaultValue ?? midValue(min, max),
      orientation: "horizontal",
      formatOptions: {
        style: "percent",
        ...props2.formatOptions
      },
      translations: {
        value: ({ percent }) => percent === -1 ? "loading..." : `${percent} percent`,
        ...props2.translations
      }
    };
  },
  initialState() {
    return "idle";
  },
  entry: ["validateContext"],
  context({ bindable, prop }) {
    return {
      value: bindable(() => ({
        defaultValue: prop("defaultValue"),
        value: prop("value"),
        onChange(value) {
          prop("onValueChange")?.({ value });
        }
      }))
    };
  },
  computed: {
    isIndeterminate: ({ context }) => context.get("value") === null,
    percent({ context, prop }) {
      const value = context.get("value");
      if (!isNumber(value)) return -1;
      return getValuePercent(value, prop("min"), prop("max")) * 100;
    },
    formatter: memo(
      ({ prop }) => [prop("locale"), prop("formatOptions")],
      (locale, formatOptions) => new Intl.NumberFormat(locale, formatOptions)
    ),
    isHorizontal: ({ prop }) => prop("orientation") === "horizontal"
  },
  states: {
    idle: {
      on: {
        "VALUE.SET": {
          actions: ["setValue"]
        }
      }
    }
  },
  implementations: {
    actions: {
      setValue: ({ context, event, prop }) => {
        const value = event.value === null ? null : Math.max(0, Math.min(event.value, prop("max")));
        context.set("value", value);
      },
      validateContext: ({ context, prop }) => {
        const max = prop("max");
        const min = prop("min");
        const value = context.get("value");
        if (value == null) return;
        if (!isValidNumber(max)) {
          throw new Error(`[progress] The max value passed \`${max}\` is not a valid number`);
        }
        if (!isValidMax(value, max)) {
          throw new Error(`[progress] The value passed \`${value}\` exceeds the max value \`${max}\``);
        }
        if (!isValidMin(value, min)) {
          throw new Error(`[progress] The value passed \`${value}\` exceeds the min value \`${min}\``);
        }
      }
    }
  }
});
var isValidNumber = (max) => isNumber(max) && !isNaN(max);
var isValidMax = (value, max) => isValidNumber(value) && value <= max;
var isValidMin = (value, min) => isValidNumber(value) && value >= min;
var midValue = (min, max) => min + (max - min) / 2;
createProps()([
  "dir",
  "getRootNode",
  "id",
  "ids",
  "max",
  "min",
  "orientation",
  "translations",
  "value",
  "onValueChange",
  "defaultValue",
  "formatOptions",
  "locale"
]);

function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
const propMap = {
  className: "class",
  defaultChecked: "checked",
  defaultValue: "value",
  htmlFor: "for",
  onBlur: "onfocusout",
  onChange: "oninput",
  onFocus: "onfocusin",
  onDoubleClick: "ondblclick"
};
function toStyleString(style) {
  let string = "";
  for (let key in style) {
    const value = style[key];
    if (value === null || value === void 0)
      continue;
    if (!key.startsWith("--"))
      key = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    string += `${key}:${value};`;
  }
  return string;
}
const preserveKeys = new Set("viewBox,className,preserveAspectRatio,fillRule,clipPath,clipRule,strokeWidth,strokeLinecap,strokeLinejoin,strokeDasharray,strokeDashoffset,strokeMiterlimit".split(","));
function toSvelteProp(key) {
  if (key in propMap)
    return propMap[key];
  if (preserveKeys.has(key))
    return key;
  return key.toLowerCase();
}
function toSveltePropValue(key, value) {
  if (key === "style" && typeof value === "object")
    return toStyleString(value);
  return value;
}
const normalizeProps = createNormalizer((props) => {
  const normalized = {};
  for (const key in props) {
    normalized[toSvelteProp(key)] = toSveltePropValue(key, props[key]);
  }
  return normalized;
});
function bindable(props) {
  const initial = props().defaultValue ?? props().value;
  const eq = props().isEqual ?? Object.is;
  let value = initial;
  const controlled = props().value !== void 0;
  let valueRef = { current: run(() => value) };
  let prevValue = { current: void 0 };
  const setValueFn = (v) => {
    const next = isFunction(v) ? v(valueRef.current) : v;
    const prev = prevValue.current;
    if (props().debug) {
      console.log(`[bindable > ${props().debug}] setValue`, { next, prev });
    }
    if (!controlled) value = next;
    if (!eq(next, prev)) {
      props().onChange?.(next, prev);
    }
  };
  function get() {
    return controlled ? props().value : value;
  }
  return {
    initial,
    ref: valueRef,
    get,
    set(val) {
      const exec = props().sync ? noop : identity;
      exec(() => setValueFn(val));
    },
    invoke(nextValue, prevValue2) {
      props().onChange?.(nextValue, prevValue2);
    },
    hash(value2) {
      return props().hash?.(value2) ?? String(value2);
    }
  };
}
bindable.cleanup = (fn) => {
  onDestroy(() => fn());
};
bindable.ref = (defaultValue) => {
  let value = defaultValue;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    }
  };
};
function useRefs(refs) {
  const ref = { current: refs };
  return {
    get(key) {
      return ref.current[key];
    },
    set(key, value) {
      ref.current[key] = value;
    }
  };
}
const track = (deps, effect) => {
};
function access(userProps) {
  if (isFunction(userProps)) return userProps();
  return userProps;
}
function useMachine(machine, userProps) {
  const scope = (() => {
    const { id, ids, getRootNode } = access(userProps);
    return createScope({ id, ids, getRootNode });
  })();
  const debug = (...args) => {
    if (machine.debug) console.log(...args);
  };
  const props = machine.props?.({ props: compact(access(userProps)), scope }) ?? access(userProps);
  const prop = useProp(() => props);
  const context = machine.context?.({
    prop,
    bindable,
    get scope() {
      return scope;
    },
    flush,
    getContext() {
      return ctx;
    },
    getComputed() {
      return computed;
    },
    getRefs() {
      return refs;
    },
    getEvent() {
      return getEvent();
    }
  });
  const ctx = {
    get(key) {
      return context?.[key].get();
    },
    set(key, value) {
      context?.[key].set(value);
    },
    initial(key) {
      return context?.[key].initial;
    },
    hash(key) {
      const current = context?.[key].get();
      return context?.[key].hash(current);
    }
  };
  let effects = /* @__PURE__ */ new Map();
  let transitionRef = { current: null };
  let previousEventRef = { current: null };
  let eventRef = { current: { type: "" } };
  const getEvent = () => ({
    ...eventRef.current,
    current() {
      return eventRef.current;
    },
    previous() {
      return previousEventRef.current;
    }
  });
  const getState = () => ({
    ...state,
    hasTag(tag) {
      const currentState = state.get();
      return !!machine.states[currentState]?.tags?.includes(tag);
    },
    matches(...values) {
      const currentState = state.get();
      return values.includes(currentState);
    }
  });
  const refs = useRefs(machine.refs?.({ prop, context: ctx }) ?? {});
  const getParams = () => ({
    state: getState(),
    context: ctx,
    event: getEvent(),
    prop,
    send,
    action,
    guard,
    track,
    refs,
    computed,
    flush,
    scope,
    choose
  });
  const action = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine.implementations?.actions?.[s];
      if (!fn) warn(`[zag-js] No implementation found for action "${JSON.stringify(s)}"`);
      return fn;
    });
    for (const fn of fns) {
      fn?.(getParams());
    }
  };
  const guard = (str) => {
    if (isFunction(str)) return str(getParams());
    return machine.implementations?.guards?.[str](getParams());
  };
  const effect = (keys) => {
    const strs = isFunction(keys) ? keys(getParams()) : keys;
    if (!strs) return;
    const fns = strs.map((s) => {
      const fn = machine.implementations?.effects?.[s];
      if (!fn) warn(`[zag-js] No implementation found for effect "${JSON.stringify(s)}"`);
      return fn;
    });
    const cleanups = [];
    for (const fn of fns) {
      const cleanup = fn?.(getParams());
      if (cleanup) cleanups.push(cleanup);
    }
    return () => cleanups.forEach((fn) => fn?.());
  };
  const choose = (transitions) => {
    return toArray(transitions).find((t) => {
      let result = !t.guard;
      if (isString(t.guard)) result = !!guard(t.guard);
      else if (isFunction(t.guard)) result = t.guard(getParams());
      return result;
    });
  };
  const computed = (key) => {
    ensure(machine.computed, () => `[zag-js] No computed object found on machine`);
    const fn = machine.computed[key];
    return fn({ context: ctx, event: getEvent(), prop, refs, scope, computed });
  };
  const state = bindable(() => ({
    defaultValue: machine.initialState({ prop }),
    onChange(nextState, prevState) {
      if (prevState) {
        const exitEffects = effects.get(prevState);
        exitEffects?.();
        effects.delete(prevState);
      }
      if (prevState) {
        action(machine.states[prevState]?.exit);
      }
      action(transitionRef.current?.actions);
      const cleanup = effect(machine.states[nextState]?.effects);
      if (cleanup) effects.set(nextState, cleanup);
      if (prevState === INIT_STATE) {
        action(machine.entry);
        const cleanup2 = effect(machine.effects);
        if (cleanup2) effects.set(INIT_STATE, cleanup2);
      }
      action(machine.states[nextState]?.entry);
    }
  }));
  let status = MachineStatus.NotStarted;
  onDestroy(() => {
    debug("unmounting...");
    status = MachineStatus.Stopped;
    effects.forEach((fn) => fn?.());
    effects = /* @__PURE__ */ new Map();
    transitionRef.current = null;
    action(machine.exit);
  });
  const send = (event) => {
    if (status !== MachineStatus.Started) return;
    previousEventRef.current = eventRef.current;
    eventRef.current = event;
    let currentState = state.get();
    const transitions = machine.states[currentState].on?.[event.type] ?? machine.on?.[event.type];
    const transition = choose(transitions);
    if (!transition) return;
    transitionRef.current = transition;
    const target = transition.target ?? currentState;
    debug("transition", event.type, transition.target || currentState, `(${transition.actions})`);
    const changed = target !== currentState;
    if (changed) {
      state.set(target);
    } else if (transition.reenter && !changed) {
      state.invoke(currentState, currentState);
    } else {
      action(transition.actions);
    }
  };
  machine.watch?.(getParams());
  return {
    get state() {
      return getState();
    },
    send,
    context: ctx,
    prop,
    get scope() {
      return scope;
    },
    refs,
    computed,
    get event() {
      return getEvent();
    },
    getStatus: () => status
  };
}
function useProp(value) {
  return function get(key) {
    return value()[key];
  };
}
function flush(fn) {
}
function Progress($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    base = "flex items-center gap-4",
    height = "h-2",
    width = "w-full",
    classes = "",
    labelBase = "whitespace-nowrap",
    labelText = "text-xs",
    labelClasses = "",
    trackBase = "h-full w-full overflow-x-hidden",
    trackBg = "bg-surface-200-800",
    trackRounded = "rounded-base",
    trackClasses = "",
    meterBase = "h-full w-full",
    meterBg = "bg-surface-950-50",
    meterRounded = "rounded-base",
    meterTransition = "transition-[width]",
    meterAnimate = "animate-progress-indeterminate",
    meterClasses = "",
    children,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  const rxIndeterminate = api.indeterminate ? meterAnimate : "";
  $$payload.out.push(`<figure${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(height)} ${stringify(width)} ${stringify(classes)}`,
      "data-testid": "progress"
    },
    null
  )}>`);
  if (children) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${spread_attributes(
      {
        ...api.getLabelProps(),
        class: `${stringify(labelBase)} ${stringify(labelText)} ${stringify(labelClasses)}`,
        "data-testid": "progress-label"
      },
      null
    )}>`);
    children($$payload);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div${spread_attributes(
    {
      ...api.getTrackProps(),
      class: `${stringify(trackBase)} ${stringify(trackBg)} ${stringify(trackRounded)} ${stringify(trackClasses)}`,
      "data-testid": "progress-track"
    },
    null
  )}><div${spread_attributes(
    {
      ...api.getRangeProps(),
      class: `${stringify(meterBase)} ${stringify(meterBg)} ${stringify(meterRounded)} ${stringify(meterTransition)} ${stringify(rxIndeterminate)} ${stringify(meterClasses)}`,
      "data-testid": "progress-meter"
    },
    null
  )}></div></div></figure>`);
  pop();
}
function ProgressRing($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    label,
    showLabel = false,
    strokeWidth = "10px",
    strokeLinecap = "round",
    base = "relative",
    size = "size-32",
    classes = "",
    childrenBase = "absolute top-0 left-0 z-[1] flex justify-center items-center",
    childrenClasses = "",
    svgBase = "absolute top-0 left-0 size-full rounded-full",
    svgClasses = "",
    trackBase = "fill-none",
    trackStroke = "stroke-surface-200-800",
    trackClasses = "",
    meterBase = "fill-none",
    meterStroke = "stroke-primary-500",
    meterTransition = "transition-[stroke-dashoffset] transition-[stroke-dashoffset]",
    meterAnimate = "animate-ring-indeterminate",
    meterDuration = "duration-200",
    meterClasses = "",
    labelBase = "",
    labelFill = "fill-surface-950-50",
    labelFontSize = 24,
    labelFontWeight = "bold",
    labelClasses = "",
    children,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  const rxAnimCircle = api.indeterminate ? "animate-spin" : "";
  const rxAnimMeter = api.indeterminate ? meterAnimate : "";
  $$payload.out.push(`<figure${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(size)} ${stringify(classes)}`,
      "data-testid": "progress-ring"
    },
    null
  )}><div${spread_attributes(
    {
      ...api.getLabelProps(),
      class: `${stringify(childrenBase)} ${stringify(size)} ${stringify(childrenClasses)}`,
      "data-testid": "progress-ring-children"
    },
    null
  )}>`);
  children?.($$payload);
  $$payload.out.push(`<!----></div> <svg${spread_attributes(
    {
      ...api.getCircleProps(),
      viewBox: "0 0 100 100",
      class: `${stringify(svgBase)} ${stringify(svgClasses)} ${stringify(rxAnimCircle)}`,
      style: `--size:100px;--thickness:${stringify(strokeWidth)};`,
      "data-testid": "progress-ring-svg"
    },
    null,
    void 0,
    void 0,
    3
  )}><circle${spread_attributes(
    {
      ...api.getCircleTrackProps(),
      class: `${stringify(trackBase)} ${stringify(trackStroke)} ${stringify(trackClasses)}`,
      "data-testid": "progress-ring-track"
    },
    null,
    void 0,
    void 0,
    3
  )}></circle><circle${spread_attributes(
    {
      ...api.getCircleRangeProps(),
      class: `${stringify(meterBase)} ${stringify(meterStroke)} ${stringify(meterTransition)} ${stringify(meterDuration)} ${stringify(meterClasses)} ${stringify(rxAnimMeter)}`,
      "stroke-linecap": strokeLinecap,
      "data-testid": "progress-ring-meter"
    },
    null,
    void 0,
    void 0,
    3
  )}></circle>`);
  if (api.value !== null && !children && showLabel) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<text${attr_class(`${stringify(labelBase)} ${stringify(labelFill)} ${stringify(labelClasses)}`)} x="50%" y="50%"${attr("font-size", labelFontSize)}${attr("font-weight", labelFontWeight)} text-anchor="middle" dominant-baseline="central" data-testid="progress-label">${escape_html(label ?? api.value)}%</text>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></svg></figure>`);
  pop();
}
function Loading($$payload, $$props) {
  const { size = "small", ring = true, label = "", color = "primary" } = $$props;
  const sizes = {
    micro: "size-4",
    mini: "size-8",
    small: "size-16",
    medium: "size-32",
    large: "size-64"
  };
  const variants = {
    primary: {
      meter: "stroke-primary-500",
      track: "stroke-primary-500/30",
      bg: "bg-primary-500"
    },
    secondary: {
      meter: "stroke-secondary-500",
      track: "stroke-secondary-500/30",
      bg: "bg-secondary-500"
    },
    tertiary: {
      meter: "stroke-tertiary-500",
      track: "stroke-tertiary-500/30",
      bg: "bg-tertiary-500"
    },
    info: {
      meter: "stroke-info-500",
      track: "stroke-info-500/30",
      bg: "bg-info-500"
    },
    error: {
      meter: "stroke-error-500",
      track: "stroke-error-500/30",
      bg: "bg-error-500"
    },
    success: {
      meter: "stroke-success-500",
      track: "stroke-success-500/30",
      bg: "bg-success-500"
    },
    warning: {
      meter: "stroke-warning-500",
      track: "stroke-warning-500/30",
      bg: "bg-warning-500"
    },
    white: {
      meter: "stroke-white",
      track: "stroke-white/30",
      bg: "bg-white"
    },
    black: {
      meter: "stroke-black",
      track: "stroke-black/30",
      bg: "bg-black"
    }
  };
  if (ring) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex justify-center">`);
    ProgressRing($$payload, {
      value: null,
      meterStroke: variants[color].meter,
      trackStroke: variants[color].track,
      size: sizes[size],
      classes: size === "micro" ? "m-1" : "",
      children: ($$payload2) => {
        if (label && size !== "micro") {
          $$payload2.out.push("<!--[-->");
          $$payload2.out.push(`<span class="h4">${escape_html(label)}</span>`);
        } else {
          $$payload2.out.push("<!--[!-->");
        }
        $$payload2.out.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$payload.out.push(`<!----> `);
    if (label && size === "micro") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="bold">${escape_html(label)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    Progress($$payload, {
      value: null,
      meterBg: variants[color].bg,
      meterAnimate: "anim-progress-bar",
      labelText: "h3",
      children: ($$payload2) => {
        if (label) {
          $$payload2.out.push("<!--[-->");
          $$payload2.out.push(`${escape_html(label)}`);
        } else {
          $$payload2.out.push("<!--[!-->");
        }
        $$payload2.out.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
  }
  $$payload.out.push(`<!--]-->`);
}

export { Loading as L, createProps as c, normalizeProps as n, onDestroy as o, toStyleString as t, useMachine as u };
//# sourceMappingURL=Loading-DAyWVuL0.js.map
