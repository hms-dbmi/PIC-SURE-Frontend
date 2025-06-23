import { K as escape_html, x as push, Q as props_id, S as spread_attributes, P as stringify, M as attr_class, N as attr, z as pop } from './index-BKfiikQf.js';
import { o as createMachine, U as memo, V as isNumber, W as getValuePercent, p as createAnatomy } from './index-BB9JrA1L.js';
import { c as createProps, u as useMachine, n as normalizeProps } from './machine.svelte-D_VZYMjT.js';

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

function Progress($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    // Root
    base = "flex items-center gap-4",
    height = "h-2",
    width = "w-full",
    classes = "",
    // Label
    labelBase = "whitespace-nowrap",
    labelText = "text-xs",
    labelClasses = "",
    // Track
    trackBase = "h-full w-full overflow-x-hidden",
    trackBg = "bg-surface-200-800",
    trackRounded = "rounded-base",
    trackClasses = "",
    // Meter
    meterBase = "h-full w-full",
    meterBg = "bg-surface-950-50",
    meterRounded = "rounded-base",
    meterTransition = "transition-[width]",
    meterAnimate = "animate-progress-indeterminate",
    meterClasses = "",
    // Snippets
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  const rxIndeterminate = api.indeterminate ? meterAnimate : "";
  $$payload.out += `<figure${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(height)} ${stringify(width)} ${stringify(classes)}`,
      "data-testid": "progress"
    },
    null
  )}>`;
  if (children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${spread_attributes(
      {
        ...api.getLabelProps(),
        class: `${stringify(labelBase)} ${stringify(labelText)} ${stringify(labelClasses)}`,
        "data-testid": "progress-label"
      },
      null
    )}>`;
    children($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div${spread_attributes(
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
  )}></div></div></figure>`;
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
    // Root
    base = "relative",
    size = "size-32",
    classes = "",
    // Slot
    childrenBase = "absolute top-0 left-0 z-[1] flex justify-center items-center",
    childrenClasses = "",
    // SVG
    svgBase = "absolute top-0 left-0 size-full rounded-full",
    svgClasses = "",
    // Track
    trackBase = "fill-none",
    trackStroke = "stroke-surface-200-800",
    trackClasses = "",
    // Meter
    meterBase = "fill-none",
    meterStroke = "stroke-primary-500",
    meterTransition = "transition-[stroke-dashoffset] transition-[stroke-dashoffset]",
    meterAnimate = "animate-ring-indeterminate",
    meterDuration = "duration-200",
    meterClasses = "",
    // Label
    labelBase = "",
    labelFill = "fill-surface-950-50",
    labelFontSize = 24,
    // px
    labelFontWeight = "bold",
    labelClasses = "",
    // Snippets
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  const rxAnimCircle = api.indeterminate ? "animate-spin" : "";
  const rxAnimMeter = api.indeterminate ? meterAnimate : "";
  $$payload.out += `<figure${spread_attributes(
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
  )}>`;
  children?.($$payload);
  $$payload.out += `<!----></div> <svg${spread_attributes(
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
  )}></circle>`;
  if (api.value !== null && !children && showLabel) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<text${attr_class(`${stringify(labelBase)} ${stringify(labelFill)} ${stringify(labelClasses)}`)} x="50%" y="50%"${attr("font-size", labelFontSize)}${attr("font-weight", labelFontWeight)} text-anchor="middle" dominant-baseline="central" data-testid="progress-label">${escape_html(label ?? api.value)}%</text>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></svg></figure>`;
  pop();
}
function Loading($$payload, $$props) {
  const {
    size = "small",
    ring = false,
    label = "",
    color = "primary"
  } = $$props;
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
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center">`;
    ProgressRing($$payload, {
      value: null,
      meterStroke: variants[color].meter,
      trackStroke: variants[color].track,
      size: sizes[size],
      classes: size === "micro" ? "m-1" : "",
      children: ($$payload2) => {
        if (label && size !== "micro") {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<span class="h4">${escape_html(label)}</span>`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]-->`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----> `;
    if (label && size === "micro") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="bold">${escape_html(label)}</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    Progress($$payload, {
      value: null,
      meterBg: variants[color].bg,
      meterAnimate: "anim-progress-bar",
      labelText: "h3",
      children: ($$payload2) => {
        if (label) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `${escape_html(label)}`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]-->`;
      },
      $$slots: { default: true }
    });
  }
  $$payload.out += `<!--]-->`;
}

export { Loading as L };
//# sourceMappingURL=Loading-DKkczq09.js.map
