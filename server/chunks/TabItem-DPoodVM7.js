import { x as push, N as attr, M as attr_class, P as stringify$3, Y as bind_props, z as pop, Q as props_id, S as spread_attributes, $ as attr_style } from './index-BKfiikQf.js';
import { o as createMachine, q as createGuards, a3 as isAnchorElement, a4 as trackElementRect, a5 as nextTick, r as raf, H as getFocusables, a6 as prevById, a7 as nextById, a8 as last, a9 as first, aa as clickIfLink, p as createAnatomy, v as dataAttr, a2 as isSafari, ab as isSelfTarget, ac as isComposingEvent, ad as getEventKey, ae as itemById, af as queryAll, ag as setTabContext, ah as getTabContext } from './index-BB9JrA1L.js';
import { c as createProps, u as useMachine, n as normalizeProps } from './machine.svelte-D_VZYMjT.js';
import { h as html$4 } from './html-FW6Ia4bL.js';

// src/tabs.anatomy.ts
var anatomy = createAnatomy("tabs").parts("root", "list", "trigger", "content", "indicator");
var parts = anatomy.build();
var getRootId = (ctx) => ctx.ids?.root ?? `tabs:${ctx.id}`;
var getListId = (ctx) => ctx.ids?.list ?? `tabs:${ctx.id}:list`;
var getContentId = (ctx, id) => ctx.ids?.content ?? `tabs:${ctx.id}:content-${id}`;
var getTriggerId = (ctx, id) => ctx.ids?.trigger ?? `tabs:${ctx.id}:trigger-${id}`;
var getIndicatorId = (ctx) => ctx.ids?.indicator ?? `tabs:${ctx.id}:indicator`;
var getListEl = (ctx) => ctx.getById(getListId(ctx));
var getContentEl = (ctx, id) => ctx.getById(getContentId(ctx, id));
var getTriggerEl = (ctx, id) => ctx.getById(getTriggerId(ctx, id));
var getIndicatorEl = (ctx) => ctx.getById(getIndicatorId(ctx));
var getElements = (ctx) => {
  const ownerId = CSS.escape(getListId(ctx));
  const selector = `[role=tab][data-ownedby='${ownerId}']:not([disabled])`;
  return queryAll(getListEl(ctx), selector);
};
var getFirstTriggerEl = (ctx) => first(getElements(ctx));
var getLastTriggerEl = (ctx) => last(getElements(ctx));
var getNextTriggerEl = (ctx, opts) => nextById(getElements(ctx), getTriggerId(ctx, opts.value), opts.loopFocus);
var getPrevTriggerEl = (ctx, opts) => prevById(getElements(ctx), getTriggerId(ctx, opts.value), opts.loopFocus);
var getOffsetRect = (el) => {
  return {
    left: el?.offsetLeft ?? 0,
    top: el?.offsetTop ?? 0,
    width: el?.offsetWidth ?? 0,
    height: el?.offsetHeight ?? 0
  };
};
var getRectById = (ctx, id) => {
  const tab = itemById(getElements(ctx), getTriggerId(ctx, id));
  return resolveRect(getOffsetRect(tab));
};
var resolveRect = (rect) => ({
  width: `${rect.width}px`,
  height: `${rect.height}px`,
  left: `${rect.left}px`,
  top: `${rect.top}px`
});

// src/tabs.connect.ts
function connect(service, normalize) {
  const { state, send, context, prop, scope } = service;
  const translations = prop("translations");
  const focused = state.matches("focused");
  const isVertical = prop("orientation") === "vertical";
  const isHorizontal = prop("orientation") === "horizontal";
  const composite = prop("composite");
  function getTriggerState(props2) {
    return {
      selected: context.get("value") === props2.value,
      focused: context.get("focusedValue") === props2.value,
      disabled: !!props2.disabled
    };
  }
  return {
    value: context.get("value"),
    focusedValue: context.get("focusedValue"),
    setValue(value) {
      send({ type: "SET_VALUE", value });
    },
    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },
    setIndicatorRect(value) {
      const id = getTriggerId(scope, value);
      send({ type: "SET_INDICATOR_RECT", id });
    },
    syncTabIndex() {
      send({ type: "SYNC_TAB_INDEX" });
    },
    selectNext(fromValue) {
      send({ type: "TAB_FOCUS", value: fromValue, src: "selectNext" });
      send({ type: "ARROW_NEXT", src: "selectNext" });
    },
    selectPrev(fromValue) {
      send({ type: "TAB_FOCUS", value: fromValue, src: "selectPrev" });
      send({ type: "ARROW_PREV", src: "selectPrev" });
    },
    focus() {
      const value = context.get("value");
      if (!value) return;
      getTriggerEl(scope, value)?.focus();
    },
    getRootProps() {
      return normalize.element({
        ...parts.root.attrs,
        id: getRootId(scope),
        "data-orientation": prop("orientation"),
        "data-focus": dataAttr(focused),
        dir: prop("dir")
      });
    },
    getListProps() {
      return normalize.element({
        ...parts.list.attrs,
        id: getListId(scope),
        role: "tablist",
        dir: prop("dir"),
        "data-focus": dataAttr(focused),
        "aria-orientation": prop("orientation"),
        "data-orientation": prop("orientation"),
        "aria-label": translations?.listLabel,
        onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (!isSelfTarget(event)) return;
          if (isComposingEvent(event)) return;
          const keyMap = {
            ArrowDown() {
              if (isHorizontal) return;
              send({ type: "ARROW_NEXT", key: "ArrowDown" });
            },
            ArrowUp() {
              if (isHorizontal) return;
              send({ type: "ARROW_PREV", key: "ArrowUp" });
            },
            ArrowLeft() {
              if (isVertical) return;
              send({ type: "ARROW_PREV", key: "ArrowLeft" });
            },
            ArrowRight() {
              if (isVertical) return;
              send({ type: "ARROW_NEXT", key: "ArrowRight" });
            },
            Home() {
              send({ type: "HOME" });
            },
            End() {
              send({ type: "END" });
            },
            Enter() {
              send({ type: "ENTER" });
            }
          };
          let key = getEventKey(event, {
            dir: prop("dir"),
            orientation: prop("orientation")
          });
          const exec = keyMap[key];
          if (exec) {
            event.preventDefault();
            exec(event);
          }
        }
      });
    },
    getTriggerState,
    getTriggerProps(props2) {
      const { value, disabled } = props2;
      const triggerState = getTriggerState(props2);
      return normalize.button({
        ...parts.trigger.attrs,
        role: "tab",
        type: "button",
        disabled,
        dir: prop("dir"),
        "data-orientation": prop("orientation"),
        "data-disabled": dataAttr(disabled),
        "aria-disabled": disabled,
        "data-value": value,
        "aria-selected": triggerState.selected,
        "data-selected": dataAttr(triggerState.selected),
        "data-focus": dataAttr(triggerState.focused),
        "aria-controls": triggerState.selected ? getContentId(scope, value) : void 0,
        "data-ownedby": getListId(scope),
        "data-ssr": dataAttr(context.get("ssr")),
        id: getTriggerId(scope, value),
        tabIndex: triggerState.selected && composite ? 0 : -1,
        onFocus() {
          send({ type: "TAB_FOCUS", value });
        },
        onBlur(event) {
          const target = event.relatedTarget;
          if (target?.getAttribute("role") !== "tab") {
            send({ type: "TAB_BLUR" });
          }
        },
        onClick(event) {
          if (event.defaultPrevented) return;
          if (disabled) return;
          if (isSafari()) {
            event.currentTarget.focus();
          }
          send({ type: "TAB_CLICK", value });
        }
      });
    },
    getContentProps(props2) {
      const { value } = props2;
      const selected = context.get("value") === value;
      return normalize.element({
        ...parts.content.attrs,
        dir: prop("dir"),
        id: getContentId(scope, value),
        tabIndex: composite ? 0 : -1,
        "aria-labelledby": getTriggerId(scope, value),
        role: "tabpanel",
        "data-ownedby": getListId(scope),
        "data-selected": dataAttr(selected),
        "data-orientation": prop("orientation"),
        hidden: !selected
      });
    },
    getIndicatorProps() {
      const indicatorRect = context.get("indicatorRect");
      const indicatorTransition = context.get("indicatorTransition");
      return normalize.element({
        id: getIndicatorId(scope),
        ...parts.indicator.attrs,
        dir: prop("dir"),
        "data-orientation": prop("orientation"),
        style: {
          "--transition-property": "left, right, top, bottom, width, height",
          "--left": indicatorRect.left,
          "--top": indicatorRect.top,
          "--width": indicatorRect.width,
          "--height": indicatorRect.height,
          position: "absolute",
          willChange: "var(--transition-property)",
          transitionProperty: "var(--transition-property)",
          transitionDuration: indicatorTransition ? "var(--transition-duration, 150ms)" : "0ms",
          transitionTimingFunction: "var(--transition-timing-function)",
          [isHorizontal ? "left" : "top"]: isHorizontal ? "var(--left)" : "var(--top)"
        }
      });
    }
  };
}
var { not } = createGuards();
var machine = createMachine({
  props({ props: props2 }) {
    return {
      dir: "ltr",
      orientation: "horizontal",
      activationMode: "automatic",
      loopFocus: true,
      composite: true,
      navigate(details) {
        clickIfLink(details.node);
      },
      defaultValue: null,
      ...props2
    };
  },
  initialState() {
    return "idle";
  },
  context({ prop, bindable }) {
    return {
      value: bindable(() => ({
        defaultValue: prop("defaultValue"),
        value: prop("value"),
        onChange(value) {
          prop("onValueChange")?.({ value });
        }
      })),
      focusedValue: bindable(() => ({
        defaultValue: prop("value") || prop("defaultValue"),
        sync: true,
        onChange(value) {
          prop("onFocusChange")?.({ focusedValue: value });
        }
      })),
      ssr: bindable(() => ({ defaultValue: true })),
      indicatorTransition: bindable(() => ({ defaultValue: false })),
      indicatorRect: bindable(() => ({
        defaultValue: { left: "0px", top: "0px", width: "0px", height: "0px" }
      }))
    };
  },
  watch({ context, prop, track, action }) {
    track([() => context.get("value")], () => {
      action(["allowIndicatorTransition", "syncIndicatorRect", "syncTabIndex", "navigateIfNeeded"]);
    });
    track([() => prop("dir"), () => prop("orientation")], () => {
      action(["syncIndicatorRect"]);
    });
  },
  on: {
    SET_VALUE: {
      actions: ["setValue"]
    },
    CLEAR_VALUE: {
      actions: ["clearValue"]
    },
    SET_INDICATOR_RECT: {
      actions: ["setIndicatorRect"]
    },
    SYNC_TAB_INDEX: {
      actions: ["syncTabIndex"]
    }
  },
  entry: ["syncIndicatorRect", "syncTabIndex", "syncSsr"],
  exit: ["cleanupObserver"],
  states: {
    idle: {
      on: {
        TAB_FOCUS: {
          target: "focused",
          actions: ["setFocusedValue"]
        },
        TAB_CLICK: {
          target: "focused",
          actions: ["setFocusedValue", "setValue"]
        }
      }
    },
    focused: {
      on: {
        TAB_CLICK: {
          target: "focused",
          actions: ["setFocusedValue", "setValue"]
        },
        ARROW_PREV: [
          {
            guard: "selectOnFocus",
            actions: ["focusPrevTab", "selectFocusedTab"]
          },
          {
            actions: ["focusPrevTab"]
          }
        ],
        ARROW_NEXT: [
          {
            guard: "selectOnFocus",
            actions: ["focusNextTab", "selectFocusedTab"]
          },
          {
            actions: ["focusNextTab"]
          }
        ],
        HOME: [
          {
            guard: "selectOnFocus",
            actions: ["focusFirstTab", "selectFocusedTab"]
          },
          {
            actions: ["focusFirstTab"]
          }
        ],
        END: [
          {
            guard: "selectOnFocus",
            actions: ["focusLastTab", "selectFocusedTab"]
          },
          {
            actions: ["focusLastTab"]
          }
        ],
        ENTER: {
          guard: not("selectOnFocus"),
          actions: ["selectFocusedTab"]
        },
        TAB_FOCUS: {
          actions: ["setFocusedValue"]
        },
        TAB_BLUR: {
          target: "idle",
          actions: ["clearFocusedValue"]
        }
      }
    }
  },
  implementations: {
    guards: {
      selectOnFocus: ({ prop }) => prop("activationMode") === "automatic"
    },
    actions: {
      selectFocusedTab({ context, prop }) {
        raf(() => {
          const focusedValue = context.get("focusedValue");
          if (!focusedValue) return;
          const nullable = prop("deselectable") && context.get("value") === focusedValue;
          const value = nullable ? null : focusedValue;
          context.set("value", value);
        });
      },
      setFocusedValue({ context, event, flush }) {
        if (event.value == null) return;
        flush(() => {
          context.set("focusedValue", event.value);
        });
      },
      clearFocusedValue({ context }) {
        context.set("focusedValue", null);
      },
      setValue({ context, event, prop }) {
        const nullable = prop("deselectable") && context.get("value") === context.get("focusedValue");
        context.set("value", nullable ? null : event.value);
      },
      clearValue({ context }) {
        context.set("value", null);
      },
      focusFirstTab({ scope }) {
        raf(() => {
          getFirstTriggerEl(scope)?.focus();
        });
      },
      focusLastTab({ scope }) {
        raf(() => {
          getLastTriggerEl(scope)?.focus();
        });
      },
      focusNextTab({ context, prop, scope, event }) {
        const focusedValue = event.value ?? context.get("focusedValue");
        if (!focusedValue) return;
        const triggerEl = getNextTriggerEl(scope, {
          value: focusedValue,
          loopFocus: prop("loopFocus")
        });
        raf(() => {
          if (prop("composite")) {
            triggerEl?.focus();
          } else if (triggerEl?.dataset.value != null) {
            context.set("focusedValue", triggerEl.dataset.value);
          }
        });
      },
      focusPrevTab({ context, prop, scope, event }) {
        const focusedValue = event.value ?? context.get("focusedValue");
        if (!focusedValue) return;
        const triggerEl = getPrevTriggerEl(scope, {
          value: focusedValue,
          loopFocus: prop("loopFocus")
        });
        raf(() => {
          if (prop("composite")) {
            triggerEl?.focus();
          } else if (triggerEl?.dataset.value != null) {
            context.set("focusedValue", triggerEl.dataset.value);
          }
        });
      },
      syncTabIndex({ context, scope }) {
        raf(() => {
          const value = context.get("value");
          if (!value) return;
          const contentEl = getContentEl(scope, value);
          if (!contentEl) return;
          const focusables = getFocusables(contentEl);
          if (focusables.length > 0) {
            contentEl.removeAttribute("tabindex");
          } else {
            contentEl.setAttribute("tabindex", "0");
          }
        });
      },
      cleanupObserver({ refs }) {
        const cleanup = refs.get("indicatorCleanup");
        if (cleanup) cleanup();
      },
      allowIndicatorTransition({ context }) {
        context.set("indicatorTransition", true);
      },
      setIndicatorRect({ context, event, scope }) {
        const value = event.id ?? context.get("value");
        const indicatorEl = getIndicatorEl(scope);
        if (!indicatorEl) return;
        if (!value) {
          context.set("indicatorTransition", false);
          return;
        }
        const triggerEl = getTriggerEl(scope, value);
        if (!triggerEl) return;
        context.set("indicatorRect", getRectById(scope, value));
        nextTick(() => {
          context.set("indicatorTransition", false);
        });
      },
      syncSsr({ context }) {
        context.set("ssr", false);
      },
      syncIndicatorRect({ context, refs, scope }) {
        const cleanup = refs.get("indicatorCleanup");
        if (cleanup) cleanup();
        const value = context.get("value");
        if (!value) {
          context.set("indicatorTransition", false);
          return;
        }
        const triggerEl = getTriggerEl(scope, value);
        const indicatorEl = getIndicatorEl(scope);
        if (!triggerEl || !indicatorEl) return;
        const indicatorCleanup = trackElementRect([triggerEl], {
          measure(el) {
            return getOffsetRect(el);
          },
          onEntry({ rects }) {
            const [rect] = rects;
            context.set("indicatorRect", resolveRect(rect));
          }
        });
        refs.set("indicatorCleanup", indicatorCleanup);
      },
      navigateIfNeeded({ context, prop, scope }) {
        const value = context.get("value");
        if (!value) return;
        const triggerEl = getTriggerEl(scope, value);
        if (isAnchorElement(triggerEl)) {
          prop("navigate")?.({ value, node: triggerEl, href: triggerEl.href });
        }
      }
    }
  }
});
createProps()([
  "activationMode",
  "composite",
  "deselectable",
  "dir",
  "getRootNode",
  "id",
  "ids",
  "loopFocus",
  "navigate",
  "onFocusChange",
  "onValueChange",
  "orientation",
  "translations",
  "value",
  "defaultValue"
]);
createProps()(["disabled", "value"]);
createProps()(["value"]);

let ShikiError$1 = class ShikiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ShikiError";
  }
};

// src/utils.ts
function clone(something) {
  return doClone(something);
}
function doClone(something) {
  if (Array.isArray(something)) {
    return cloneArray(something);
  }
  if (something instanceof RegExp) {
    return something;
  }
  if (typeof something === "object") {
    return cloneObj(something);
  }
  return something;
}
function cloneArray(arr) {
  let r = [];
  for (let i = 0, len = arr.length; i < len; i++) {
    r[i] = doClone(arr[i]);
  }
  return r;
}
function cloneObj(obj) {
  let r = {};
  for (let key in obj) {
    r[key] = doClone(obj[key]);
  }
  return r;
}
function mergeObjects(target, ...sources) {
  sources.forEach((source) => {
    for (let key in source) {
      target[key] = source[key];
    }
  });
  return target;
}
function basename(path) {
  const idx = ~path.lastIndexOf("/") || ~path.lastIndexOf("\\");
  if (idx === 0) {
    return path;
  } else if (~idx === path.length - 1) {
    return basename(path.substring(0, path.length - 1));
  } else {
    return path.substr(~idx + 1);
  }
}
var CAPTURING_REGEX_SOURCE = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g;
var RegexSource = class {
  static hasCaptures(regexSource) {
    if (regexSource === null) {
      return false;
    }
    CAPTURING_REGEX_SOURCE.lastIndex = 0;
    return CAPTURING_REGEX_SOURCE.test(regexSource);
  }
  static replaceCaptures(regexSource, captureSource, captureIndices) {
    return regexSource.replace(CAPTURING_REGEX_SOURCE, (match, index, commandIndex, command) => {
      let capture = captureIndices[parseInt(index || commandIndex, 10)];
      if (capture) {
        let result = captureSource.substring(capture.start, capture.end);
        while (result[0] === ".") {
          result = result.substring(1);
        }
        switch (command) {
          case "downcase":
            return result.toLowerCase();
          case "upcase":
            return result.toUpperCase();
          default:
            return result;
        }
      } else {
        return match;
      }
    });
  }
};
function strcmp(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
function strArrCmp(a, b) {
  if (a === null && b === null) {
    return 0;
  }
  if (!a) {
    return -1;
  }
  if (!b) {
    return 1;
  }
  let len1 = a.length;
  let len2 = b.length;
  if (len1 === len2) {
    for (let i = 0; i < len1; i++) {
      let res = strcmp(a[i], b[i]);
      if (res !== 0) {
        return res;
      }
    }
    return 0;
  }
  return len1 - len2;
}
function isValidHexColor(hex) {
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return true;
  }
  if (/^#[0-9a-f]{8}$/i.test(hex)) {
    return true;
  }
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return true;
  }
  if (/^#[0-9a-f]{4}$/i.test(hex)) {
    return true;
  }
  return false;
}
function escapeRegExpCharacters(value) {
  return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, "\\$&");
}
var CachedFn = class {
  constructor(fn) {
    this.fn = fn;
  }
  cache = /* @__PURE__ */ new Map();
  get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const value = this.fn(key);
    this.cache.set(key, value);
    return value;
  }
};

// src/theme.ts
var Theme = class {
  constructor(_colorMap, _defaults, _root) {
    this._colorMap = _colorMap;
    this._defaults = _defaults;
    this._root = _root;
  }
  static createFromRawTheme(source, colorMap) {
    return this.createFromParsedTheme(parseTheme(source), colorMap);
  }
  static createFromParsedTheme(source, colorMap) {
    return resolveParsedThemeRules(source, colorMap);
  }
  _cachedMatchRoot = new CachedFn(
    (scopeName) => this._root.match(scopeName)
  );
  getColorMap() {
    return this._colorMap.getColorMap();
  }
  getDefaults() {
    return this._defaults;
  }
  match(scopePath) {
    if (scopePath === null) {
      return this._defaults;
    }
    const scopeName = scopePath.scopeName;
    const matchingTrieElements = this._cachedMatchRoot.get(scopeName);
    const effectiveRule = matchingTrieElements.find(
      (v) => _scopePathMatchesParentScopes(scopePath.parent, v.parentScopes)
    );
    if (!effectiveRule) {
      return null;
    }
    return new StyleAttributes(
      effectiveRule.fontStyle,
      effectiveRule.foreground,
      effectiveRule.background
    );
  }
};
var ScopeStack = class _ScopeStack {
  constructor(parent, scopeName) {
    this.parent = parent;
    this.scopeName = scopeName;
  }
  static push(path, scopeNames) {
    for (const name of scopeNames) {
      path = new _ScopeStack(path, name);
    }
    return path;
  }
  static from(...segments) {
    let result = null;
    for (let i = 0; i < segments.length; i++) {
      result = new _ScopeStack(result, segments[i]);
    }
    return result;
  }
  push(scopeName) {
    return new _ScopeStack(this, scopeName);
  }
  getSegments() {
    let item = this;
    const result = [];
    while (item) {
      result.push(item.scopeName);
      item = item.parent;
    }
    result.reverse();
    return result;
  }
  toString() {
    return this.getSegments().join(" ");
  }
  extends(other) {
    if (this === other) {
      return true;
    }
    if (this.parent === null) {
      return false;
    }
    return this.parent.extends(other);
  }
  getExtensionIfDefined(base) {
    const result = [];
    let item = this;
    while (item && item !== base) {
      result.push(item.scopeName);
      item = item.parent;
    }
    return item === base ? result.reverse() : void 0;
  }
};
function _scopePathMatchesParentScopes(scopePath, parentScopes) {
  if (parentScopes.length === 0) {
    return true;
  }
  for (let index = 0; index < parentScopes.length; index++) {
    let scopePattern = parentScopes[index];
    let scopeMustMatch = false;
    if (scopePattern === ">") {
      if (index === parentScopes.length - 1) {
        return false;
      }
      scopePattern = parentScopes[++index];
      scopeMustMatch = true;
    }
    while (scopePath) {
      if (_matchesScope(scopePath.scopeName, scopePattern)) {
        break;
      }
      if (scopeMustMatch) {
        return false;
      }
      scopePath = scopePath.parent;
    }
    if (!scopePath) {
      return false;
    }
    scopePath = scopePath.parent;
  }
  return true;
}
function _matchesScope(scopeName, scopePattern) {
  return scopePattern === scopeName || scopeName.startsWith(scopePattern) && scopeName[scopePattern.length] === ".";
}
var StyleAttributes = class {
  constructor(fontStyle, foregroundId, backgroundId) {
    this.fontStyle = fontStyle;
    this.foregroundId = foregroundId;
    this.backgroundId = backgroundId;
  }
};
function parseTheme(source) {
  if (!source) {
    return [];
  }
  if (!source.settings || !Array.isArray(source.settings)) {
    return [];
  }
  let settings = source.settings;
  let result = [], resultLen = 0;
  for (let i = 0, len = settings.length; i < len; i++) {
    let entry = settings[i];
    if (!entry.settings) {
      continue;
    }
    let scopes;
    if (typeof entry.scope === "string") {
      let _scope = entry.scope;
      _scope = _scope.replace(/^[,]+/, "");
      _scope = _scope.replace(/[,]+$/, "");
      scopes = _scope.split(",");
    } else if (Array.isArray(entry.scope)) {
      scopes = entry.scope;
    } else {
      scopes = [""];
    }
    let fontStyle = -1 /* NotSet */;
    if (typeof entry.settings.fontStyle === "string") {
      fontStyle = 0 /* None */;
      let segments = entry.settings.fontStyle.split(" ");
      for (let j = 0, lenJ = segments.length; j < lenJ; j++) {
        let segment = segments[j];
        switch (segment) {
          case "italic":
            fontStyle = fontStyle | 1 /* Italic */;
            break;
          case "bold":
            fontStyle = fontStyle | 2 /* Bold */;
            break;
          case "underline":
            fontStyle = fontStyle | 4 /* Underline */;
            break;
          case "strikethrough":
            fontStyle = fontStyle | 8 /* Strikethrough */;
            break;
        }
      }
    }
    let foreground = null;
    if (typeof entry.settings.foreground === "string" && isValidHexColor(entry.settings.foreground)) {
      foreground = entry.settings.foreground;
    }
    let background = null;
    if (typeof entry.settings.background === "string" && isValidHexColor(entry.settings.background)) {
      background = entry.settings.background;
    }
    for (let j = 0, lenJ = scopes.length; j < lenJ; j++) {
      let _scope = scopes[j].trim();
      let segments = _scope.split(" ");
      let scope = segments[segments.length - 1];
      let parentScopes = null;
      if (segments.length > 1) {
        parentScopes = segments.slice(0, segments.length - 1);
        parentScopes.reverse();
      }
      result[resultLen++] = new ParsedThemeRule(
        scope,
        parentScopes,
        i,
        fontStyle,
        foreground,
        background
      );
    }
  }
  return result;
}
var ParsedThemeRule = class {
  constructor(scope, parentScopes, index, fontStyle, foreground, background) {
    this.scope = scope;
    this.parentScopes = parentScopes;
    this.index = index;
    this.fontStyle = fontStyle;
    this.foreground = foreground;
    this.background = background;
  }
};
var FontStyle = /* @__PURE__ */ ((FontStyle2) => {
  FontStyle2[FontStyle2["NotSet"] = -1] = "NotSet";
  FontStyle2[FontStyle2["None"] = 0] = "None";
  FontStyle2[FontStyle2["Italic"] = 1] = "Italic";
  FontStyle2[FontStyle2["Bold"] = 2] = "Bold";
  FontStyle2[FontStyle2["Underline"] = 4] = "Underline";
  FontStyle2[FontStyle2["Strikethrough"] = 8] = "Strikethrough";
  return FontStyle2;
})(FontStyle || {});
function resolveParsedThemeRules(parsedThemeRules, _colorMap) {
  parsedThemeRules.sort((a, b) => {
    let r = strcmp(a.scope, b.scope);
    if (r !== 0) {
      return r;
    }
    r = strArrCmp(a.parentScopes, b.parentScopes);
    if (r !== 0) {
      return r;
    }
    return a.index - b.index;
  });
  let defaultFontStyle = 0 /* None */;
  let defaultForeground = "#000000";
  let defaultBackground = "#ffffff";
  while (parsedThemeRules.length >= 1 && parsedThemeRules[0].scope === "") {
    let incomingDefaults = parsedThemeRules.shift();
    if (incomingDefaults.fontStyle !== -1 /* NotSet */) {
      defaultFontStyle = incomingDefaults.fontStyle;
    }
    if (incomingDefaults.foreground !== null) {
      defaultForeground = incomingDefaults.foreground;
    }
    if (incomingDefaults.background !== null) {
      defaultBackground = incomingDefaults.background;
    }
  }
  let colorMap = new ColorMap(_colorMap);
  let defaults = new StyleAttributes(defaultFontStyle, colorMap.getId(defaultForeground), colorMap.getId(defaultBackground));
  let root = new ThemeTrieElement(new ThemeTrieElementRule(0, null, -1 /* NotSet */, 0, 0), []);
  for (let i = 0, len = parsedThemeRules.length; i < len; i++) {
    let rule = parsedThemeRules[i];
    root.insert(0, rule.scope, rule.parentScopes, rule.fontStyle, colorMap.getId(rule.foreground), colorMap.getId(rule.background));
  }
  return new Theme(colorMap, defaults, root);
}
var ColorMap = class {
  _isFrozen;
  _lastColorId;
  _id2color;
  _color2id;
  constructor(_colorMap) {
    this._lastColorId = 0;
    this._id2color = [];
    this._color2id = /* @__PURE__ */ Object.create(null);
    if (Array.isArray(_colorMap)) {
      this._isFrozen = true;
      for (let i = 0, len = _colorMap.length; i < len; i++) {
        this._color2id[_colorMap[i]] = i;
        this._id2color[i] = _colorMap[i];
      }
    } else {
      this._isFrozen = false;
    }
  }
  getId(color) {
    if (color === null) {
      return 0;
    }
    color = color.toUpperCase();
    let value = this._color2id[color];
    if (value) {
      return value;
    }
    if (this._isFrozen) {
      throw new Error(`Missing color in color map - ${color}`);
    }
    value = ++this._lastColorId;
    this._color2id[color] = value;
    this._id2color[value] = color;
    return value;
  }
  getColorMap() {
    return this._id2color.slice(0);
  }
};
var emptyParentScopes = Object.freeze([]);
var ThemeTrieElementRule = class _ThemeTrieElementRule {
  scopeDepth;
  parentScopes;
  fontStyle;
  foreground;
  background;
  constructor(scopeDepth, parentScopes, fontStyle, foreground, background) {
    this.scopeDepth = scopeDepth;
    this.parentScopes = parentScopes || emptyParentScopes;
    this.fontStyle = fontStyle;
    this.foreground = foreground;
    this.background = background;
  }
  clone() {
    return new _ThemeTrieElementRule(this.scopeDepth, this.parentScopes, this.fontStyle, this.foreground, this.background);
  }
  static cloneArr(arr) {
    let r = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      r[i] = arr[i].clone();
    }
    return r;
  }
  acceptOverwrite(scopeDepth, fontStyle, foreground, background) {
    if (this.scopeDepth > scopeDepth) {
      console.log("how did this happen?");
    } else {
      this.scopeDepth = scopeDepth;
    }
    if (fontStyle !== -1 /* NotSet */) {
      this.fontStyle = fontStyle;
    }
    if (foreground !== 0) {
      this.foreground = foreground;
    }
    if (background !== 0) {
      this.background = background;
    }
  }
};
var ThemeTrieElement = class _ThemeTrieElement {
  constructor(_mainRule, rulesWithParentScopes = [], _children = {}) {
    this._mainRule = _mainRule;
    this._children = _children;
    this._rulesWithParentScopes = rulesWithParentScopes;
  }
  _rulesWithParentScopes;
  static _cmpBySpecificity(a, b) {
    if (a.scopeDepth !== b.scopeDepth) {
      return b.scopeDepth - a.scopeDepth;
    }
    let aParentIndex = 0;
    let bParentIndex = 0;
    while (true) {
      if (a.parentScopes[aParentIndex] === ">") {
        aParentIndex++;
      }
      if (b.parentScopes[bParentIndex] === ">") {
        bParentIndex++;
      }
      if (aParentIndex >= a.parentScopes.length || bParentIndex >= b.parentScopes.length) {
        break;
      }
      const parentScopeLengthDiff = b.parentScopes[bParentIndex].length - a.parentScopes[aParentIndex].length;
      if (parentScopeLengthDiff !== 0) {
        return parentScopeLengthDiff;
      }
      aParentIndex++;
      bParentIndex++;
    }
    return b.parentScopes.length - a.parentScopes.length;
  }
  match(scope) {
    if (scope !== "") {
      let dotIndex = scope.indexOf(".");
      let head;
      let tail;
      if (dotIndex === -1) {
        head = scope;
        tail = "";
      } else {
        head = scope.substring(0, dotIndex);
        tail = scope.substring(dotIndex + 1);
      }
      if (this._children.hasOwnProperty(head)) {
        return this._children[head].match(tail);
      }
    }
    const rules = this._rulesWithParentScopes.concat(this._mainRule);
    rules.sort(_ThemeTrieElement._cmpBySpecificity);
    return rules;
  }
  insert(scopeDepth, scope, parentScopes, fontStyle, foreground, background) {
    if (scope === "") {
      this._doInsertHere(scopeDepth, parentScopes, fontStyle, foreground, background);
      return;
    }
    let dotIndex = scope.indexOf(".");
    let head;
    let tail;
    if (dotIndex === -1) {
      head = scope;
      tail = "";
    } else {
      head = scope.substring(0, dotIndex);
      tail = scope.substring(dotIndex + 1);
    }
    let child;
    if (this._children.hasOwnProperty(head)) {
      child = this._children[head];
    } else {
      child = new _ThemeTrieElement(this._mainRule.clone(), ThemeTrieElementRule.cloneArr(this._rulesWithParentScopes));
      this._children[head] = child;
    }
    child.insert(scopeDepth + 1, tail, parentScopes, fontStyle, foreground, background);
  }
  _doInsertHere(scopeDepth, parentScopes, fontStyle, foreground, background) {
    if (parentScopes === null) {
      this._mainRule.acceptOverwrite(scopeDepth, fontStyle, foreground, background);
      return;
    }
    for (let i = 0, len = this._rulesWithParentScopes.length; i < len; i++) {
      let rule = this._rulesWithParentScopes[i];
      if (strArrCmp(rule.parentScopes, parentScopes) === 0) {
        rule.acceptOverwrite(scopeDepth, fontStyle, foreground, background);
        return;
      }
    }
    if (fontStyle === -1 /* NotSet */) {
      fontStyle = this._mainRule.fontStyle;
    }
    if (foreground === 0) {
      foreground = this._mainRule.foreground;
    }
    if (background === 0) {
      background = this._mainRule.background;
    }
    this._rulesWithParentScopes.push(new ThemeTrieElementRule(scopeDepth, parentScopes, fontStyle, foreground, background));
  }
};

// src/encodedTokenAttributes.ts
var EncodedTokenMetadata = class _EncodedTokenMetadata {
  static toBinaryStr(encodedTokenAttributes) {
    return encodedTokenAttributes.toString(2).padStart(32, "0");
  }
  static print(encodedTokenAttributes) {
    const languageId = _EncodedTokenMetadata.getLanguageId(encodedTokenAttributes);
    const tokenType = _EncodedTokenMetadata.getTokenType(encodedTokenAttributes);
    const fontStyle = _EncodedTokenMetadata.getFontStyle(encodedTokenAttributes);
    const foreground = _EncodedTokenMetadata.getForeground(encodedTokenAttributes);
    const background = _EncodedTokenMetadata.getBackground(encodedTokenAttributes);
    console.log({
      languageId,
      tokenType,
      fontStyle,
      foreground,
      background
    });
  }
  static getLanguageId(encodedTokenAttributes) {
    return (encodedTokenAttributes & 255 /* LANGUAGEID_MASK */) >>> 0 /* LANGUAGEID_OFFSET */;
  }
  static getTokenType(encodedTokenAttributes) {
    return (encodedTokenAttributes & 768 /* TOKEN_TYPE_MASK */) >>> 8 /* TOKEN_TYPE_OFFSET */;
  }
  static containsBalancedBrackets(encodedTokenAttributes) {
    return (encodedTokenAttributes & 1024 /* BALANCED_BRACKETS_MASK */) !== 0;
  }
  static getFontStyle(encodedTokenAttributes) {
    return (encodedTokenAttributes & 30720 /* FONT_STYLE_MASK */) >>> 11 /* FONT_STYLE_OFFSET */;
  }
  static getForeground(encodedTokenAttributes) {
    return (encodedTokenAttributes & 16744448 /* FOREGROUND_MASK */) >>> 15 /* FOREGROUND_OFFSET */;
  }
  static getBackground(encodedTokenAttributes) {
    return (encodedTokenAttributes & 4278190080 /* BACKGROUND_MASK */) >>> 24 /* BACKGROUND_OFFSET */;
  }
  /**
   * Updates the fields in `metadata`.
   * A value of `0`, `NotSet` or `null` indicates that the corresponding field should be left as is.
   */
  static set(encodedTokenAttributes, languageId, tokenType, containsBalancedBrackets, fontStyle, foreground, background) {
    let _languageId = _EncodedTokenMetadata.getLanguageId(encodedTokenAttributes);
    let _tokenType = _EncodedTokenMetadata.getTokenType(encodedTokenAttributes);
    let _containsBalancedBracketsBit = _EncodedTokenMetadata.containsBalancedBrackets(encodedTokenAttributes) ? 1 : 0;
    let _fontStyle = _EncodedTokenMetadata.getFontStyle(encodedTokenAttributes);
    let _foreground = _EncodedTokenMetadata.getForeground(encodedTokenAttributes);
    let _background = _EncodedTokenMetadata.getBackground(encodedTokenAttributes);
    if (languageId !== 0) {
      _languageId = languageId;
    }
    if (tokenType !== 8 /* NotSet */) {
      _tokenType = fromOptionalTokenType(tokenType);
    }
    if (containsBalancedBrackets !== null) {
      _containsBalancedBracketsBit = containsBalancedBrackets ? 1 : 0;
    }
    if (fontStyle !== -1 /* NotSet */) {
      _fontStyle = fontStyle;
    }
    if (foreground !== 0) {
      _foreground = foreground;
    }
    if (background !== 0) {
      _background = background;
    }
    return (_languageId << 0 /* LANGUAGEID_OFFSET */ | _tokenType << 8 /* TOKEN_TYPE_OFFSET */ | _containsBalancedBracketsBit << 10 /* BALANCED_BRACKETS_OFFSET */ | _fontStyle << 11 /* FONT_STYLE_OFFSET */ | _foreground << 15 /* FOREGROUND_OFFSET */ | _background << 24 /* BACKGROUND_OFFSET */) >>> 0;
  }
};
function toOptionalTokenType(standardType) {
  return standardType;
}
function fromOptionalTokenType(standardType) {
  return standardType;
}

// src/matcher.ts
function createMatchers(selector, matchesName) {
  const results = [];
  const tokenizer = newTokenizer(selector);
  let token = tokenizer.next();
  while (token !== null) {
    let priority = 0;
    if (token.length === 2 && token.charAt(1) === ":") {
      switch (token.charAt(0)) {
        case "R":
          priority = 1;
          break;
        case "L":
          priority = -1;
          break;
        default:
          console.log(`Unknown priority ${token} in scope selector`);
      }
      token = tokenizer.next();
    }
    let matcher = parseConjunction();
    results.push({ matcher, priority });
    if (token !== ",") {
      break;
    }
    token = tokenizer.next();
  }
  return results;
  function parseOperand() {
    if (token === "-") {
      token = tokenizer.next();
      const expressionToNegate = parseOperand();
      return (matcherInput) => !!expressionToNegate && !expressionToNegate(matcherInput);
    }
    if (token === "(") {
      token = tokenizer.next();
      const expressionInParents = parseInnerExpression();
      if (token === ")") {
        token = tokenizer.next();
      }
      return expressionInParents;
    }
    if (isIdentifier(token)) {
      const identifiers = [];
      do {
        identifiers.push(token);
        token = tokenizer.next();
      } while (isIdentifier(token));
      return (matcherInput) => matchesName(identifiers, matcherInput);
    }
    return null;
  }
  function parseConjunction() {
    const matchers = [];
    let matcher = parseOperand();
    while (matcher) {
      matchers.push(matcher);
      matcher = parseOperand();
    }
    return (matcherInput) => matchers.every((matcher2) => matcher2(matcherInput));
  }
  function parseInnerExpression() {
    const matchers = [];
    let matcher = parseConjunction();
    while (matcher) {
      matchers.push(matcher);
      if (token === "|" || token === ",") {
        do {
          token = tokenizer.next();
        } while (token === "|" || token === ",");
      } else {
        break;
      }
      matcher = parseConjunction();
    }
    return (matcherInput) => matchers.some((matcher2) => matcher2(matcherInput));
  }
}
function isIdentifier(token) {
  return !!token && !!token.match(/[\w\.:]+/);
}
function newTokenizer(input) {
  let regex = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g;
  let match = regex.exec(input);
  return {
    next: () => {
      if (!match) {
        return null;
      }
      const res = match[0];
      match = regex.exec(input);
      return res;
    }
  };
}
function disposeOnigString(str) {
  if (typeof str.dispose === "function") {
    str.dispose();
  }
}

// src/grammar/grammarDependencies.ts
var TopLevelRuleReference = class {
  constructor(scopeName) {
    this.scopeName = scopeName;
  }
  toKey() {
    return this.scopeName;
  }
};
var TopLevelRepositoryRuleReference = class {
  constructor(scopeName, ruleName) {
    this.scopeName = scopeName;
    this.ruleName = ruleName;
  }
  toKey() {
    return `${this.scopeName}#${this.ruleName}`;
  }
};
var ExternalReferenceCollector = class {
  _references = [];
  _seenReferenceKeys = /* @__PURE__ */ new Set();
  get references() {
    return this._references;
  }
  visitedRule = /* @__PURE__ */ new Set();
  add(reference) {
    const key = reference.toKey();
    if (this._seenReferenceKeys.has(key)) {
      return;
    }
    this._seenReferenceKeys.add(key);
    this._references.push(reference);
  }
};
var ScopeDependencyProcessor = class {
  constructor(repo, initialScopeName) {
    this.repo = repo;
    this.initialScopeName = initialScopeName;
    this.seenFullScopeRequests.add(this.initialScopeName);
    this.Q = [new TopLevelRuleReference(this.initialScopeName)];
  }
  seenFullScopeRequests = /* @__PURE__ */ new Set();
  seenPartialScopeRequests = /* @__PURE__ */ new Set();
  Q;
  processQueue() {
    const q = this.Q;
    this.Q = [];
    const deps = new ExternalReferenceCollector();
    for (const dep of q) {
      collectReferencesOfReference(dep, this.initialScopeName, this.repo, deps);
    }
    for (const dep of deps.references) {
      if (dep instanceof TopLevelRuleReference) {
        if (this.seenFullScopeRequests.has(dep.scopeName)) {
          continue;
        }
        this.seenFullScopeRequests.add(dep.scopeName);
        this.Q.push(dep);
      } else {
        if (this.seenFullScopeRequests.has(dep.scopeName)) {
          continue;
        }
        if (this.seenPartialScopeRequests.has(dep.toKey())) {
          continue;
        }
        this.seenPartialScopeRequests.add(dep.toKey());
        this.Q.push(dep);
      }
    }
  }
};
function collectReferencesOfReference(reference, baseGrammarScopeName, repo, result) {
  const selfGrammar = repo.lookup(reference.scopeName);
  if (!selfGrammar) {
    if (reference.scopeName === baseGrammarScopeName) {
      throw new Error(`No grammar provided for <${baseGrammarScopeName}>`);
    }
    return;
  }
  const baseGrammar = repo.lookup(baseGrammarScopeName);
  if (reference instanceof TopLevelRuleReference) {
    collectExternalReferencesInTopLevelRule({ baseGrammar, selfGrammar }, result);
  } else {
    collectExternalReferencesInTopLevelRepositoryRule(
      reference.ruleName,
      { baseGrammar, selfGrammar, repository: selfGrammar.repository },
      result
    );
  }
  const injections = repo.injections(reference.scopeName);
  if (injections) {
    for (const injection of injections) {
      result.add(new TopLevelRuleReference(injection));
    }
  }
}
function collectExternalReferencesInTopLevelRepositoryRule(ruleName, context, result) {
  if (context.repository && context.repository[ruleName]) {
    const rule = context.repository[ruleName];
    collectExternalReferencesInRules([rule], context, result);
  }
}
function collectExternalReferencesInTopLevelRule(context, result) {
  if (context.selfGrammar.patterns && Array.isArray(context.selfGrammar.patterns)) {
    collectExternalReferencesInRules(
      context.selfGrammar.patterns,
      { ...context, repository: context.selfGrammar.repository },
      result
    );
  }
  if (context.selfGrammar.injections) {
    collectExternalReferencesInRules(
      Object.values(context.selfGrammar.injections),
      { ...context, repository: context.selfGrammar.repository },
      result
    );
  }
}
function collectExternalReferencesInRules(rules, context, result) {
  for (const rule of rules) {
    if (result.visitedRule.has(rule)) {
      continue;
    }
    result.visitedRule.add(rule);
    const patternRepository = rule.repository ? mergeObjects({}, context.repository, rule.repository) : context.repository;
    if (Array.isArray(rule.patterns)) {
      collectExternalReferencesInRules(rule.patterns, { ...context, repository: patternRepository }, result);
    }
    const include = rule.include;
    if (!include) {
      continue;
    }
    const reference = parseInclude(include);
    switch (reference.kind) {
      case 0 /* Base */:
        collectExternalReferencesInTopLevelRule({ ...context, selfGrammar: context.baseGrammar }, result);
        break;
      case 1 /* Self */:
        collectExternalReferencesInTopLevelRule(context, result);
        break;
      case 2 /* RelativeReference */:
        collectExternalReferencesInTopLevelRepositoryRule(reference.ruleName, { ...context, repository: patternRepository }, result);
        break;
      case 3 /* TopLevelReference */:
      case 4 /* TopLevelRepositoryReference */:
        const selfGrammar = reference.scopeName === context.selfGrammar.scopeName ? context.selfGrammar : reference.scopeName === context.baseGrammar.scopeName ? context.baseGrammar : void 0;
        if (selfGrammar) {
          const newContext = { baseGrammar: context.baseGrammar, selfGrammar, repository: patternRepository };
          if (reference.kind === 4 /* TopLevelRepositoryReference */) {
            collectExternalReferencesInTopLevelRepositoryRule(reference.ruleName, newContext, result);
          } else {
            collectExternalReferencesInTopLevelRule(newContext, result);
          }
        } else {
          if (reference.kind === 4 /* TopLevelRepositoryReference */) {
            result.add(new TopLevelRepositoryRuleReference(reference.scopeName, reference.ruleName));
          } else {
            result.add(new TopLevelRuleReference(reference.scopeName));
          }
        }
        break;
    }
  }
}
var BaseReference = class {
  kind = 0 /* Base */;
};
var SelfReference = class {
  kind = 1 /* Self */;
};
var RelativeReference = class {
  constructor(ruleName) {
    this.ruleName = ruleName;
  }
  kind = 2 /* RelativeReference */;
};
var TopLevelReference = class {
  constructor(scopeName) {
    this.scopeName = scopeName;
  }
  kind = 3 /* TopLevelReference */;
};
var TopLevelRepositoryReference = class {
  constructor(scopeName, ruleName) {
    this.scopeName = scopeName;
    this.ruleName = ruleName;
  }
  kind = 4 /* TopLevelRepositoryReference */;
};
function parseInclude(include) {
  if (include === "$base") {
    return new BaseReference();
  } else if (include === "$self") {
    return new SelfReference();
  }
  const indexOfSharp = include.indexOf("#");
  if (indexOfSharp === -1) {
    return new TopLevelReference(include);
  } else if (indexOfSharp === 0) {
    return new RelativeReference(include.substring(1));
  } else {
    const scopeName = include.substring(0, indexOfSharp);
    const ruleName = include.substring(indexOfSharp + 1);
    return new TopLevelRepositoryReference(scopeName, ruleName);
  }
}

// src/rule.ts
var HAS_BACK_REFERENCES = /\\(\d+)/;
var BACK_REFERENCING_END = /\\(\d+)/g;
var endRuleId = -1;
var whileRuleId = -2;
function ruleIdFromNumber(id) {
  return id;
}
function ruleIdToNumber(id) {
  return id;
}
var Rule = class {
  $location;
  id;
  _nameIsCapturing;
  _name;
  _contentNameIsCapturing;
  _contentName;
  constructor($location, id, name, contentName) {
    this.$location = $location;
    this.id = id;
    this._name = name || null;
    this._nameIsCapturing = RegexSource.hasCaptures(this._name);
    this._contentName = contentName || null;
    this._contentNameIsCapturing = RegexSource.hasCaptures(this._contentName);
  }
  get debugName() {
    const location = this.$location ? `${basename(this.$location.filename)}:${this.$location.line}` : "unknown";
    return `${this.constructor.name}#${this.id} @ ${location}`;
  }
  getName(lineText, captureIndices) {
    if (!this._nameIsCapturing || this._name === null || lineText === null || captureIndices === null) {
      return this._name;
    }
    return RegexSource.replaceCaptures(this._name, lineText, captureIndices);
  }
  getContentName(lineText, captureIndices) {
    if (!this._contentNameIsCapturing || this._contentName === null) {
      return this._contentName;
    }
    return RegexSource.replaceCaptures(this._contentName, lineText, captureIndices);
  }
};
var CaptureRule = class extends Rule {
  retokenizeCapturedWithRuleId;
  constructor($location, id, name, contentName, retokenizeCapturedWithRuleId) {
    super($location, id, name, contentName);
    this.retokenizeCapturedWithRuleId = retokenizeCapturedWithRuleId;
  }
  dispose() {
  }
  collectPatterns(grammar, out) {
    throw new Error("Not supported!");
  }
  compile(grammar, endRegexSource) {
    throw new Error("Not supported!");
  }
  compileAG(grammar, endRegexSource, allowA, allowG) {
    throw new Error("Not supported!");
  }
};
var MatchRule = class extends Rule {
  _match;
  captures;
  _cachedCompiledPatterns;
  constructor($location, id, name, match, captures) {
    super($location, id, name, null);
    this._match = new RegExpSource(match, this.id);
    this.captures = captures;
    this._cachedCompiledPatterns = null;
  }
  dispose() {
    if (this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns.dispose();
      this._cachedCompiledPatterns = null;
    }
  }
  get debugMatchRegExp() {
    return `${this._match.source}`;
  }
  collectPatterns(grammar, out) {
    out.push(this._match);
  }
  compile(grammar, endRegexSource) {
    return this._getCachedCompiledPatterns(grammar).compile(grammar);
  }
  compileAG(grammar, endRegexSource, allowA, allowG) {
    return this._getCachedCompiledPatterns(grammar).compileAG(grammar, allowA, allowG);
  }
  _getCachedCompiledPatterns(grammar) {
    if (!this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns = new RegExpSourceList();
      this.collectPatterns(grammar, this._cachedCompiledPatterns);
    }
    return this._cachedCompiledPatterns;
  }
};
var IncludeOnlyRule = class extends Rule {
  hasMissingPatterns;
  patterns;
  _cachedCompiledPatterns;
  constructor($location, id, name, contentName, patterns) {
    super($location, id, name, contentName);
    this.patterns = patterns.patterns;
    this.hasMissingPatterns = patterns.hasMissingPatterns;
    this._cachedCompiledPatterns = null;
  }
  dispose() {
    if (this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns.dispose();
      this._cachedCompiledPatterns = null;
    }
  }
  collectPatterns(grammar, out) {
    for (const pattern of this.patterns) {
      const rule = grammar.getRule(pattern);
      rule.collectPatterns(grammar, out);
    }
  }
  compile(grammar, endRegexSource) {
    return this._getCachedCompiledPatterns(grammar).compile(grammar);
  }
  compileAG(grammar, endRegexSource, allowA, allowG) {
    return this._getCachedCompiledPatterns(grammar).compileAG(grammar, allowA, allowG);
  }
  _getCachedCompiledPatterns(grammar) {
    if (!this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns = new RegExpSourceList();
      this.collectPatterns(grammar, this._cachedCompiledPatterns);
    }
    return this._cachedCompiledPatterns;
  }
};
var BeginEndRule = class extends Rule {
  _begin;
  beginCaptures;
  _end;
  endHasBackReferences;
  endCaptures;
  applyEndPatternLast;
  hasMissingPatterns;
  patterns;
  _cachedCompiledPatterns;
  constructor($location, id, name, contentName, begin, beginCaptures, end, endCaptures, applyEndPatternLast, patterns) {
    super($location, id, name, contentName);
    this._begin = new RegExpSource(begin, this.id);
    this.beginCaptures = beginCaptures;
    this._end = new RegExpSource(end ? end : "\uFFFF", -1);
    this.endHasBackReferences = this._end.hasBackReferences;
    this.endCaptures = endCaptures;
    this.applyEndPatternLast = applyEndPatternLast || false;
    this.patterns = patterns.patterns;
    this.hasMissingPatterns = patterns.hasMissingPatterns;
    this._cachedCompiledPatterns = null;
  }
  dispose() {
    if (this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns.dispose();
      this._cachedCompiledPatterns = null;
    }
  }
  get debugBeginRegExp() {
    return `${this._begin.source}`;
  }
  get debugEndRegExp() {
    return `${this._end.source}`;
  }
  getEndWithResolvedBackReferences(lineText, captureIndices) {
    return this._end.resolveBackReferences(lineText, captureIndices);
  }
  collectPatterns(grammar, out) {
    out.push(this._begin);
  }
  compile(grammar, endRegexSource) {
    return this._getCachedCompiledPatterns(grammar, endRegexSource).compile(grammar);
  }
  compileAG(grammar, endRegexSource, allowA, allowG) {
    return this._getCachedCompiledPatterns(grammar, endRegexSource).compileAG(grammar, allowA, allowG);
  }
  _getCachedCompiledPatterns(grammar, endRegexSource) {
    if (!this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns = new RegExpSourceList();
      for (const pattern of this.patterns) {
        const rule = grammar.getRule(pattern);
        rule.collectPatterns(grammar, this._cachedCompiledPatterns);
      }
      if (this.applyEndPatternLast) {
        this._cachedCompiledPatterns.push(this._end.hasBackReferences ? this._end.clone() : this._end);
      } else {
        this._cachedCompiledPatterns.unshift(this._end.hasBackReferences ? this._end.clone() : this._end);
      }
    }
    if (this._end.hasBackReferences) {
      if (this.applyEndPatternLast) {
        this._cachedCompiledPatterns.setSource(this._cachedCompiledPatterns.length() - 1, endRegexSource);
      } else {
        this._cachedCompiledPatterns.setSource(0, endRegexSource);
      }
    }
    return this._cachedCompiledPatterns;
  }
};
var BeginWhileRule = class extends Rule {
  _begin;
  beginCaptures;
  whileCaptures;
  _while;
  whileHasBackReferences;
  hasMissingPatterns;
  patterns;
  _cachedCompiledPatterns;
  _cachedCompiledWhilePatterns;
  constructor($location, id, name, contentName, begin, beginCaptures, _while, whileCaptures, patterns) {
    super($location, id, name, contentName);
    this._begin = new RegExpSource(begin, this.id);
    this.beginCaptures = beginCaptures;
    this.whileCaptures = whileCaptures;
    this._while = new RegExpSource(_while, whileRuleId);
    this.whileHasBackReferences = this._while.hasBackReferences;
    this.patterns = patterns.patterns;
    this.hasMissingPatterns = patterns.hasMissingPatterns;
    this._cachedCompiledPatterns = null;
    this._cachedCompiledWhilePatterns = null;
  }
  dispose() {
    if (this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns.dispose();
      this._cachedCompiledPatterns = null;
    }
    if (this._cachedCompiledWhilePatterns) {
      this._cachedCompiledWhilePatterns.dispose();
      this._cachedCompiledWhilePatterns = null;
    }
  }
  get debugBeginRegExp() {
    return `${this._begin.source}`;
  }
  get debugWhileRegExp() {
    return `${this._while.source}`;
  }
  getWhileWithResolvedBackReferences(lineText, captureIndices) {
    return this._while.resolveBackReferences(lineText, captureIndices);
  }
  collectPatterns(grammar, out) {
    out.push(this._begin);
  }
  compile(grammar, endRegexSource) {
    return this._getCachedCompiledPatterns(grammar).compile(grammar);
  }
  compileAG(grammar, endRegexSource, allowA, allowG) {
    return this._getCachedCompiledPatterns(grammar).compileAG(grammar, allowA, allowG);
  }
  _getCachedCompiledPatterns(grammar) {
    if (!this._cachedCompiledPatterns) {
      this._cachedCompiledPatterns = new RegExpSourceList();
      for (const pattern of this.patterns) {
        const rule = grammar.getRule(pattern);
        rule.collectPatterns(grammar, this._cachedCompiledPatterns);
      }
    }
    return this._cachedCompiledPatterns;
  }
  compileWhile(grammar, endRegexSource) {
    return this._getCachedCompiledWhilePatterns(grammar, endRegexSource).compile(grammar);
  }
  compileWhileAG(grammar, endRegexSource, allowA, allowG) {
    return this._getCachedCompiledWhilePatterns(grammar, endRegexSource).compileAG(grammar, allowA, allowG);
  }
  _getCachedCompiledWhilePatterns(grammar, endRegexSource) {
    if (!this._cachedCompiledWhilePatterns) {
      this._cachedCompiledWhilePatterns = new RegExpSourceList();
      this._cachedCompiledWhilePatterns.push(this._while.hasBackReferences ? this._while.clone() : this._while);
    }
    if (this._while.hasBackReferences) {
      this._cachedCompiledWhilePatterns.setSource(0, endRegexSource ? endRegexSource : "\uFFFF");
    }
    return this._cachedCompiledWhilePatterns;
  }
};
var RuleFactory = class _RuleFactory {
  static createCaptureRule(helper, $location, name, contentName, retokenizeCapturedWithRuleId) {
    return helper.registerRule((id) => {
      return new CaptureRule($location, id, name, contentName, retokenizeCapturedWithRuleId);
    });
  }
  static getCompiledRuleId(desc, helper, repository) {
    if (!desc.id) {
      helper.registerRule((id) => {
        desc.id = id;
        if (desc.match) {
          return new MatchRule(
            desc.$vscodeTextmateLocation,
            desc.id,
            desc.name,
            desc.match,
            _RuleFactory._compileCaptures(desc.captures, helper, repository)
          );
        }
        if (typeof desc.begin === "undefined") {
          if (desc.repository) {
            repository = mergeObjects({}, repository, desc.repository);
          }
          let patterns = desc.patterns;
          if (typeof patterns === "undefined" && desc.include) {
            patterns = [{ include: desc.include }];
          }
          return new IncludeOnlyRule(
            desc.$vscodeTextmateLocation,
            desc.id,
            desc.name,
            desc.contentName,
            _RuleFactory._compilePatterns(patterns, helper, repository)
          );
        }
        if (desc.while) {
          return new BeginWhileRule(
            desc.$vscodeTextmateLocation,
            desc.id,
            desc.name,
            desc.contentName,
            desc.begin,
            _RuleFactory._compileCaptures(desc.beginCaptures || desc.captures, helper, repository),
            desc.while,
            _RuleFactory._compileCaptures(desc.whileCaptures || desc.captures, helper, repository),
            _RuleFactory._compilePatterns(desc.patterns, helper, repository)
          );
        }
        return new BeginEndRule(
          desc.$vscodeTextmateLocation,
          desc.id,
          desc.name,
          desc.contentName,
          desc.begin,
          _RuleFactory._compileCaptures(desc.beginCaptures || desc.captures, helper, repository),
          desc.end,
          _RuleFactory._compileCaptures(desc.endCaptures || desc.captures, helper, repository),
          desc.applyEndPatternLast,
          _RuleFactory._compilePatterns(desc.patterns, helper, repository)
        );
      });
    }
    return desc.id;
  }
  static _compileCaptures(captures, helper, repository) {
    let r = [];
    if (captures) {
      let maximumCaptureId = 0;
      for (const captureId in captures) {
        if (captureId === "$vscodeTextmateLocation") {
          continue;
        }
        const numericCaptureId = parseInt(captureId, 10);
        if (numericCaptureId > maximumCaptureId) {
          maximumCaptureId = numericCaptureId;
        }
      }
      for (let i = 0; i <= maximumCaptureId; i++) {
        r[i] = null;
      }
      for (const captureId in captures) {
        if (captureId === "$vscodeTextmateLocation") {
          continue;
        }
        const numericCaptureId = parseInt(captureId, 10);
        let retokenizeCapturedWithRuleId = 0;
        if (captures[captureId].patterns) {
          retokenizeCapturedWithRuleId = _RuleFactory.getCompiledRuleId(captures[captureId], helper, repository);
        }
        r[numericCaptureId] = _RuleFactory.createCaptureRule(helper, captures[captureId].$vscodeTextmateLocation, captures[captureId].name, captures[captureId].contentName, retokenizeCapturedWithRuleId);
      }
    }
    return r;
  }
  static _compilePatterns(patterns, helper, repository) {
    let r = [];
    if (patterns) {
      for (let i = 0, len = patterns.length; i < len; i++) {
        const pattern = patterns[i];
        let ruleId = -1;
        if (pattern.include) {
          const reference = parseInclude(pattern.include);
          switch (reference.kind) {
            case 0 /* Base */:
            case 1 /* Self */:
              ruleId = _RuleFactory.getCompiledRuleId(repository[pattern.include], helper, repository);
              break;
            case 2 /* RelativeReference */:
              let localIncludedRule = repository[reference.ruleName];
              if (localIncludedRule) {
                ruleId = _RuleFactory.getCompiledRuleId(localIncludedRule, helper, repository);
              }
              break;
            case 3 /* TopLevelReference */:
            case 4 /* TopLevelRepositoryReference */:
              const externalGrammarName = reference.scopeName;
              const externalGrammarInclude = reference.kind === 4 /* TopLevelRepositoryReference */ ? reference.ruleName : null;
              const externalGrammar = helper.getExternalGrammar(externalGrammarName, repository);
              if (externalGrammar) {
                if (externalGrammarInclude) {
                  let externalIncludedRule = externalGrammar.repository[externalGrammarInclude];
                  if (externalIncludedRule) {
                    ruleId = _RuleFactory.getCompiledRuleId(externalIncludedRule, helper, externalGrammar.repository);
                  }
                } else {
                  ruleId = _RuleFactory.getCompiledRuleId(externalGrammar.repository.$self, helper, externalGrammar.repository);
                }
              }
              break;
          }
        } else {
          ruleId = _RuleFactory.getCompiledRuleId(pattern, helper, repository);
        }
        if (ruleId !== -1) {
          const rule = helper.getRule(ruleId);
          let skipRule = false;
          if (rule instanceof IncludeOnlyRule || rule instanceof BeginEndRule || rule instanceof BeginWhileRule) {
            if (rule.hasMissingPatterns && rule.patterns.length === 0) {
              skipRule = true;
            }
          }
          if (skipRule) {
            continue;
          }
          r.push(ruleId);
        }
      }
    }
    return {
      patterns: r,
      hasMissingPatterns: (patterns ? patterns.length : 0) !== r.length
    };
  }
};
var RegExpSource = class _RegExpSource {
  source;
  ruleId;
  hasAnchor;
  hasBackReferences;
  _anchorCache;
  constructor(regExpSource, ruleId) {
    if (regExpSource && typeof regExpSource === "string") {
      const len = regExpSource.length;
      let lastPushedPos = 0;
      let output = [];
      let hasAnchor = false;
      for (let pos = 0; pos < len; pos++) {
        const ch = regExpSource.charAt(pos);
        if (ch === "\\") {
          if (pos + 1 < len) {
            const nextCh = regExpSource.charAt(pos + 1);
            if (nextCh === "z") {
              output.push(regExpSource.substring(lastPushedPos, pos));
              output.push("$(?!\\n)(?<!\\n)");
              lastPushedPos = pos + 2;
            } else if (nextCh === "A" || nextCh === "G") {
              hasAnchor = true;
            }
            pos++;
          }
        }
      }
      this.hasAnchor = hasAnchor;
      if (lastPushedPos === 0) {
        this.source = regExpSource;
      } else {
        output.push(regExpSource.substring(lastPushedPos, len));
        this.source = output.join("");
      }
    } else {
      this.hasAnchor = false;
      this.source = regExpSource;
    }
    if (this.hasAnchor) {
      this._anchorCache = this._buildAnchorCache();
    } else {
      this._anchorCache = null;
    }
    this.ruleId = ruleId;
    if (typeof this.source === "string") {
      this.hasBackReferences = HAS_BACK_REFERENCES.test(this.source);
    } else {
      this.hasBackReferences = false;
    }
  }
  clone() {
    return new _RegExpSource(this.source, this.ruleId);
  }
  setSource(newSource) {
    if (this.source === newSource) {
      return;
    }
    this.source = newSource;
    if (this.hasAnchor) {
      this._anchorCache = this._buildAnchorCache();
    }
  }
  resolveBackReferences(lineText, captureIndices) {
    if (typeof this.source !== "string") {
      throw new Error("This method should only be called if the source is a string");
    }
    let capturedValues = captureIndices.map((capture) => {
      return lineText.substring(capture.start, capture.end);
    });
    BACK_REFERENCING_END.lastIndex = 0;
    return this.source.replace(BACK_REFERENCING_END, (match, g1) => {
      return escapeRegExpCharacters(capturedValues[parseInt(g1, 10)] || "");
    });
  }
  _buildAnchorCache() {
    if (typeof this.source !== "string") {
      throw new Error("This method should only be called if the source is a string");
    }
    let A0_G0_result = [];
    let A0_G1_result = [];
    let A1_G0_result = [];
    let A1_G1_result = [];
    let pos, len, ch, nextCh;
    for (pos = 0, len = this.source.length; pos < len; pos++) {
      ch = this.source.charAt(pos);
      A0_G0_result[pos] = ch;
      A0_G1_result[pos] = ch;
      A1_G0_result[pos] = ch;
      A1_G1_result[pos] = ch;
      if (ch === "\\") {
        if (pos + 1 < len) {
          nextCh = this.source.charAt(pos + 1);
          if (nextCh === "A") {
            A0_G0_result[pos + 1] = "\uFFFF";
            A0_G1_result[pos + 1] = "\uFFFF";
            A1_G0_result[pos + 1] = "A";
            A1_G1_result[pos + 1] = "A";
          } else if (nextCh === "G") {
            A0_G0_result[pos + 1] = "\uFFFF";
            A0_G1_result[pos + 1] = "G";
            A1_G0_result[pos + 1] = "\uFFFF";
            A1_G1_result[pos + 1] = "G";
          } else {
            A0_G0_result[pos + 1] = nextCh;
            A0_G1_result[pos + 1] = nextCh;
            A1_G0_result[pos + 1] = nextCh;
            A1_G1_result[pos + 1] = nextCh;
          }
          pos++;
        }
      }
    }
    return {
      A0_G0: A0_G0_result.join(""),
      A0_G1: A0_G1_result.join(""),
      A1_G0: A1_G0_result.join(""),
      A1_G1: A1_G1_result.join("")
    };
  }
  resolveAnchors(allowA, allowG) {
    if (!this.hasAnchor || !this._anchorCache || typeof this.source !== "string") {
      return this.source;
    }
    if (allowA) {
      if (allowG) {
        return this._anchorCache.A1_G1;
      } else {
        return this._anchorCache.A1_G0;
      }
    } else {
      if (allowG) {
        return this._anchorCache.A0_G1;
      } else {
        return this._anchorCache.A0_G0;
      }
    }
  }
};
var RegExpSourceList = class {
  _items;
  _hasAnchors;
  _cached;
  _anchorCache;
  constructor() {
    this._items = [];
    this._hasAnchors = false;
    this._cached = null;
    this._anchorCache = {
      A0_G0: null,
      A0_G1: null,
      A1_G0: null,
      A1_G1: null
    };
  }
  dispose() {
    this._disposeCaches();
  }
  _disposeCaches() {
    if (this._cached) {
      this._cached.dispose();
      this._cached = null;
    }
    if (this._anchorCache.A0_G0) {
      this._anchorCache.A0_G0.dispose();
      this._anchorCache.A0_G0 = null;
    }
    if (this._anchorCache.A0_G1) {
      this._anchorCache.A0_G1.dispose();
      this._anchorCache.A0_G1 = null;
    }
    if (this._anchorCache.A1_G0) {
      this._anchorCache.A1_G0.dispose();
      this._anchorCache.A1_G0 = null;
    }
    if (this._anchorCache.A1_G1) {
      this._anchorCache.A1_G1.dispose();
      this._anchorCache.A1_G1 = null;
    }
  }
  push(item) {
    this._items.push(item);
    this._hasAnchors = this._hasAnchors || item.hasAnchor;
  }
  unshift(item) {
    this._items.unshift(item);
    this._hasAnchors = this._hasAnchors || item.hasAnchor;
  }
  length() {
    return this._items.length;
  }
  setSource(index, newSource) {
    if (this._items[index].source !== newSource) {
      this._disposeCaches();
      this._items[index].setSource(newSource);
    }
  }
  compile(onigLib) {
    if (!this._cached) {
      let regExps = this._items.map((e) => e.source);
      this._cached = new CompiledRule(onigLib, regExps, this._items.map((e) => e.ruleId));
    }
    return this._cached;
  }
  compileAG(onigLib, allowA, allowG) {
    if (!this._hasAnchors) {
      return this.compile(onigLib);
    } else {
      if (allowA) {
        if (allowG) {
          if (!this._anchorCache.A1_G1) {
            this._anchorCache.A1_G1 = this._resolveAnchors(onigLib, allowA, allowG);
          }
          return this._anchorCache.A1_G1;
        } else {
          if (!this._anchorCache.A1_G0) {
            this._anchorCache.A1_G0 = this._resolveAnchors(onigLib, allowA, allowG);
          }
          return this._anchorCache.A1_G0;
        }
      } else {
        if (allowG) {
          if (!this._anchorCache.A0_G1) {
            this._anchorCache.A0_G1 = this._resolveAnchors(onigLib, allowA, allowG);
          }
          return this._anchorCache.A0_G1;
        } else {
          if (!this._anchorCache.A0_G0) {
            this._anchorCache.A0_G0 = this._resolveAnchors(onigLib, allowA, allowG);
          }
          return this._anchorCache.A0_G0;
        }
      }
    }
  }
  _resolveAnchors(onigLib, allowA, allowG) {
    let regExps = this._items.map((e) => e.resolveAnchors(allowA, allowG));
    return new CompiledRule(onigLib, regExps, this._items.map((e) => e.ruleId));
  }
};
var CompiledRule = class {
  constructor(onigLib, regExps, rules) {
    this.regExps = regExps;
    this.rules = rules;
    this.scanner = onigLib.createOnigScanner(regExps);
  }
  scanner;
  dispose() {
    if (typeof this.scanner.dispose === "function") {
      this.scanner.dispose();
    }
  }
  toString() {
    const r = [];
    for (let i = 0, len = this.rules.length; i < len; i++) {
      r.push("   - " + this.rules[i] + ": " + this.regExps[i]);
    }
    return r.join("\n");
  }
  findNextMatchSync(string, startPosition, options) {
    const result = this.scanner.findNextMatchSync(string, startPosition, options);
    if (!result) {
      return null;
    }
    return {
      ruleId: this.rules[result.index],
      captureIndices: result.captureIndices
    };
  }
};

// src/grammar/basicScopesAttributeProvider.ts
var BasicScopeAttributes = class {
  constructor(languageId, tokenType) {
    this.languageId = languageId;
    this.tokenType = tokenType;
  }
};
var BasicScopeAttributesProvider = class _BasicScopeAttributesProvider {
  _defaultAttributes;
  _embeddedLanguagesMatcher;
  constructor(initialLanguageId, embeddedLanguages) {
    this._defaultAttributes = new BasicScopeAttributes(initialLanguageId, 8 /* NotSet */);
    this._embeddedLanguagesMatcher = new ScopeMatcher(Object.entries(embeddedLanguages || {}));
  }
  getDefaultAttributes() {
    return this._defaultAttributes;
  }
  getBasicScopeAttributes(scopeName) {
    if (scopeName === null) {
      return _BasicScopeAttributesProvider._NULL_SCOPE_METADATA;
    }
    return this._getBasicScopeAttributes.get(scopeName);
  }
  static _NULL_SCOPE_METADATA = new BasicScopeAttributes(0, 0);
  _getBasicScopeAttributes = new CachedFn((scopeName) => {
    const languageId = this._scopeToLanguage(scopeName);
    const standardTokenType = this._toStandardTokenType(scopeName);
    return new BasicScopeAttributes(languageId, standardTokenType);
  });
  /**
   * Given a produced TM scope, return the language that token describes or null if unknown.
   * e.g. source.html => html, source.css.embedded.html => css, punctuation.definition.tag.html => null
   */
  _scopeToLanguage(scope) {
    return this._embeddedLanguagesMatcher.match(scope) || 0;
  }
  _toStandardTokenType(scopeName) {
    const m = scopeName.match(_BasicScopeAttributesProvider.STANDARD_TOKEN_TYPE_REGEXP);
    if (!m) {
      return 8 /* NotSet */;
    }
    switch (m[1]) {
      case "comment":
        return 1 /* Comment */;
      case "string":
        return 2 /* String */;
      case "regex":
        return 3 /* RegEx */;
      case "meta.embedded":
        return 0 /* Other */;
    }
    throw new Error("Unexpected match for standard token type!");
  }
  static STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|meta\.embedded)\b/;
};
var ScopeMatcher = class {
  values;
  scopesRegExp;
  constructor(values) {
    if (values.length === 0) {
      this.values = null;
      this.scopesRegExp = null;
    } else {
      this.values = new Map(values);
      const escapedScopes = values.map(
        ([scopeName, value]) => escapeRegExpCharacters(scopeName)
      );
      escapedScopes.sort();
      escapedScopes.reverse();
      this.scopesRegExp = new RegExp(
        `^((${escapedScopes.join(")|(")}))($|\\.)`,
        ""
      );
    }
  }
  match(scope) {
    if (!this.scopesRegExp) {
      return void 0;
    }
    const m = scope.match(this.scopesRegExp);
    if (!m) {
      return void 0;
    }
    return this.values.get(m[1]);
  }
};

// src/debug.ts
({
  InDebugMode: typeof process !== "undefined" && !!process.env["VSCODE_TEXTMATE_DEBUG"]
});

// src/grammar/tokenizeString.ts
var TokenizeStringResult = class {
  constructor(stack, stoppedEarly) {
    this.stack = stack;
    this.stoppedEarly = stoppedEarly;
  }
};
function _tokenizeString(grammar, lineText, isFirstLine, linePos, stack, lineTokens, checkWhileConditions, timeLimit) {
  const lineLength = lineText.content.length;
  let STOP = false;
  let anchorPosition = -1;
  if (checkWhileConditions) {
    const whileCheckResult = _checkWhileConditions(
      grammar,
      lineText,
      isFirstLine,
      linePos,
      stack,
      lineTokens
    );
    stack = whileCheckResult.stack;
    linePos = whileCheckResult.linePos;
    isFirstLine = whileCheckResult.isFirstLine;
    anchorPosition = whileCheckResult.anchorPosition;
  }
  const startTime = Date.now();
  while (!STOP) {
    if (timeLimit !== 0) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > timeLimit) {
        return new TokenizeStringResult(stack, true);
      }
    }
    scanNext();
  }
  return new TokenizeStringResult(stack, false);
  function scanNext() {
    const r = matchRuleOrInjections(
      grammar,
      lineText,
      isFirstLine,
      linePos,
      stack,
      anchorPosition
    );
    if (!r) {
      lineTokens.produce(stack, lineLength);
      STOP = true;
      return;
    }
    const captureIndices = r.captureIndices;
    const matchedRuleId = r.matchedRuleId;
    const hasAdvanced = captureIndices && captureIndices.length > 0 ? captureIndices[0].end > linePos : false;
    if (matchedRuleId === endRuleId) {
      const poppedRule = stack.getRule(grammar);
      lineTokens.produce(stack, captureIndices[0].start);
      stack = stack.withContentNameScopesList(stack.nameScopesList);
      handleCaptures(
        grammar,
        lineText,
        isFirstLine,
        stack,
        lineTokens,
        poppedRule.endCaptures,
        captureIndices
      );
      lineTokens.produce(stack, captureIndices[0].end);
      const popped = stack;
      stack = stack.parent;
      anchorPosition = popped.getAnchorPos();
      if (!hasAdvanced && popped.getEnterPos() === linePos) {
        stack = popped;
        lineTokens.produce(stack, lineLength);
        STOP = true;
        return;
      }
    } else {
      const _rule = grammar.getRule(matchedRuleId);
      lineTokens.produce(stack, captureIndices[0].start);
      const beforePush = stack;
      const scopeName = _rule.getName(lineText.content, captureIndices);
      const nameScopesList = stack.contentNameScopesList.pushAttributed(
        scopeName,
        grammar
      );
      stack = stack.push(
        matchedRuleId,
        linePos,
        anchorPosition,
        captureIndices[0].end === lineLength,
        null,
        nameScopesList,
        nameScopesList
      );
      if (_rule instanceof BeginEndRule) {
        const pushedRule = _rule;
        handleCaptures(
          grammar,
          lineText,
          isFirstLine,
          stack,
          lineTokens,
          pushedRule.beginCaptures,
          captureIndices
        );
        lineTokens.produce(stack, captureIndices[0].end);
        anchorPosition = captureIndices[0].end;
        const contentName = pushedRule.getContentName(
          lineText.content,
          captureIndices
        );
        const contentNameScopesList = nameScopesList.pushAttributed(
          contentName,
          grammar
        );
        stack = stack.withContentNameScopesList(contentNameScopesList);
        if (pushedRule.endHasBackReferences) {
          stack = stack.withEndRule(
            pushedRule.getEndWithResolvedBackReferences(
              lineText.content,
              captureIndices
            )
          );
        }
        if (!hasAdvanced && beforePush.hasSameRuleAs(stack)) {
          stack = stack.pop();
          lineTokens.produce(stack, lineLength);
          STOP = true;
          return;
        }
      } else if (_rule instanceof BeginWhileRule) {
        const pushedRule = _rule;
        handleCaptures(
          grammar,
          lineText,
          isFirstLine,
          stack,
          lineTokens,
          pushedRule.beginCaptures,
          captureIndices
        );
        lineTokens.produce(stack, captureIndices[0].end);
        anchorPosition = captureIndices[0].end;
        const contentName = pushedRule.getContentName(
          lineText.content,
          captureIndices
        );
        const contentNameScopesList = nameScopesList.pushAttributed(
          contentName,
          grammar
        );
        stack = stack.withContentNameScopesList(contentNameScopesList);
        if (pushedRule.whileHasBackReferences) {
          stack = stack.withEndRule(
            pushedRule.getWhileWithResolvedBackReferences(
              lineText.content,
              captureIndices
            )
          );
        }
        if (!hasAdvanced && beforePush.hasSameRuleAs(stack)) {
          stack = stack.pop();
          lineTokens.produce(stack, lineLength);
          STOP = true;
          return;
        }
      } else {
        const matchingRule = _rule;
        handleCaptures(
          grammar,
          lineText,
          isFirstLine,
          stack,
          lineTokens,
          matchingRule.captures,
          captureIndices
        );
        lineTokens.produce(stack, captureIndices[0].end);
        stack = stack.pop();
        if (!hasAdvanced) {
          stack = stack.safePop();
          lineTokens.produce(stack, lineLength);
          STOP = true;
          return;
        }
      }
    }
    if (captureIndices[0].end > linePos) {
      linePos = captureIndices[0].end;
      isFirstLine = false;
    }
  }
}
function _checkWhileConditions(grammar, lineText, isFirstLine, linePos, stack, lineTokens) {
  let anchorPosition = stack.beginRuleCapturedEOL ? 0 : -1;
  const whileRules = [];
  for (let node = stack; node; node = node.pop()) {
    const nodeRule = node.getRule(grammar);
    if (nodeRule instanceof BeginWhileRule) {
      whileRules.push({
        rule: nodeRule,
        stack: node
      });
    }
  }
  for (let whileRule = whileRules.pop(); whileRule; whileRule = whileRules.pop()) {
    const { ruleScanner, findOptions } = prepareRuleWhileSearch(whileRule.rule, grammar, whileRule.stack.endRule, isFirstLine, linePos === anchorPosition);
    const r = ruleScanner.findNextMatchSync(lineText, linePos, findOptions);
    if (r) {
      const matchedRuleId = r.ruleId;
      if (matchedRuleId !== whileRuleId) {
        stack = whileRule.stack.pop();
        break;
      }
      if (r.captureIndices && r.captureIndices.length) {
        lineTokens.produce(whileRule.stack, r.captureIndices[0].start);
        handleCaptures(grammar, lineText, isFirstLine, whileRule.stack, lineTokens, whileRule.rule.whileCaptures, r.captureIndices);
        lineTokens.produce(whileRule.stack, r.captureIndices[0].end);
        anchorPosition = r.captureIndices[0].end;
        if (r.captureIndices[0].end > linePos) {
          linePos = r.captureIndices[0].end;
          isFirstLine = false;
        }
      }
    } else {
      stack = whileRule.stack.pop();
      break;
    }
  }
  return { stack, linePos, anchorPosition, isFirstLine };
}
function matchRuleOrInjections(grammar, lineText, isFirstLine, linePos, stack, anchorPosition) {
  const matchResult = matchRule(grammar, lineText, isFirstLine, linePos, stack, anchorPosition);
  const injections = grammar.getInjections();
  if (injections.length === 0) {
    return matchResult;
  }
  const injectionResult = matchInjections(injections, grammar, lineText, isFirstLine, linePos, stack, anchorPosition);
  if (!injectionResult) {
    return matchResult;
  }
  if (!matchResult) {
    return injectionResult;
  }
  const matchResultScore = matchResult.captureIndices[0].start;
  const injectionResultScore = injectionResult.captureIndices[0].start;
  if (injectionResultScore < matchResultScore || injectionResult.priorityMatch && injectionResultScore === matchResultScore) {
    return injectionResult;
  }
  return matchResult;
}
function matchRule(grammar, lineText, isFirstLine, linePos, stack, anchorPosition) {
  const rule = stack.getRule(grammar);
  const { ruleScanner, findOptions } = prepareRuleSearch(rule, grammar, stack.endRule, isFirstLine, linePos === anchorPosition);
  const r = ruleScanner.findNextMatchSync(lineText, linePos, findOptions);
  if (r) {
    return {
      captureIndices: r.captureIndices,
      matchedRuleId: r.ruleId
    };
  }
  return null;
}
function matchInjections(injections, grammar, lineText, isFirstLine, linePos, stack, anchorPosition) {
  let bestMatchRating = Number.MAX_VALUE;
  let bestMatchCaptureIndices = null;
  let bestMatchRuleId;
  let bestMatchResultPriority = 0;
  const scopes = stack.contentNameScopesList.getScopeNames();
  for (let i = 0, len = injections.length; i < len; i++) {
    const injection = injections[i];
    if (!injection.matcher(scopes)) {
      continue;
    }
    const rule = grammar.getRule(injection.ruleId);
    const { ruleScanner, findOptions } = prepareRuleSearch(rule, grammar, null, isFirstLine, linePos === anchorPosition);
    const matchResult = ruleScanner.findNextMatchSync(lineText, linePos, findOptions);
    if (!matchResult) {
      continue;
    }
    const matchRating = matchResult.captureIndices[0].start;
    if (matchRating >= bestMatchRating) {
      continue;
    }
    bestMatchRating = matchRating;
    bestMatchCaptureIndices = matchResult.captureIndices;
    bestMatchRuleId = matchResult.ruleId;
    bestMatchResultPriority = injection.priority;
    if (bestMatchRating === linePos) {
      break;
    }
  }
  if (bestMatchCaptureIndices) {
    return {
      priorityMatch: bestMatchResultPriority === -1,
      captureIndices: bestMatchCaptureIndices,
      matchedRuleId: bestMatchRuleId
    };
  }
  return null;
}
function prepareRuleSearch(rule, grammar, endRegexSource, allowA, allowG) {
  const ruleScanner = rule.compileAG(grammar, endRegexSource, allowA, allowG);
  return { ruleScanner, findOptions: 0 /* None */ };
}
function prepareRuleWhileSearch(rule, grammar, endRegexSource, allowA, allowG) {
  const ruleScanner = rule.compileWhileAG(grammar, endRegexSource, allowA, allowG);
  return { ruleScanner, findOptions: 0 /* None */ };
}
function handleCaptures(grammar, lineText, isFirstLine, stack, lineTokens, captures, captureIndices) {
  if (captures.length === 0) {
    return;
  }
  const lineTextContent = lineText.content;
  const len = Math.min(captures.length, captureIndices.length);
  const localStack = [];
  const maxEnd = captureIndices[0].end;
  for (let i = 0; i < len; i++) {
    const captureRule = captures[i];
    if (captureRule === null) {
      continue;
    }
    const captureIndex = captureIndices[i];
    if (captureIndex.length === 0) {
      continue;
    }
    if (captureIndex.start > maxEnd) {
      break;
    }
    while (localStack.length > 0 && localStack[localStack.length - 1].endPos <= captureIndex.start) {
      lineTokens.produceFromScopes(localStack[localStack.length - 1].scopes, localStack[localStack.length - 1].endPos);
      localStack.pop();
    }
    if (localStack.length > 0) {
      lineTokens.produceFromScopes(localStack[localStack.length - 1].scopes, captureIndex.start);
    } else {
      lineTokens.produce(stack, captureIndex.start);
    }
    if (captureRule.retokenizeCapturedWithRuleId) {
      const scopeName = captureRule.getName(lineTextContent, captureIndices);
      const nameScopesList = stack.contentNameScopesList.pushAttributed(scopeName, grammar);
      const contentName = captureRule.getContentName(lineTextContent, captureIndices);
      const contentNameScopesList = nameScopesList.pushAttributed(contentName, grammar);
      const stackClone = stack.push(captureRule.retokenizeCapturedWithRuleId, captureIndex.start, -1, false, null, nameScopesList, contentNameScopesList);
      const onigSubStr = grammar.createOnigString(lineTextContent.substring(0, captureIndex.end));
      _tokenizeString(
        grammar,
        onigSubStr,
        isFirstLine && captureIndex.start === 0,
        captureIndex.start,
        stackClone,
        lineTokens,
        false,
        /* no time limit */
        0
      );
      disposeOnigString(onigSubStr);
      continue;
    }
    const captureRuleScopeName = captureRule.getName(lineTextContent, captureIndices);
    if (captureRuleScopeName !== null) {
      const base = localStack.length > 0 ? localStack[localStack.length - 1].scopes : stack.contentNameScopesList;
      const captureRuleScopesList = base.pushAttributed(captureRuleScopeName, grammar);
      localStack.push(new LocalStackElement(captureRuleScopesList, captureIndex.end));
    }
  }
  while (localStack.length > 0) {
    lineTokens.produceFromScopes(localStack[localStack.length - 1].scopes, localStack[localStack.length - 1].endPos);
    localStack.pop();
  }
}
var LocalStackElement = class {
  scopes;
  endPos;
  constructor(scopes, endPos) {
    this.scopes = scopes;
    this.endPos = endPos;
  }
};

// src/grammar/grammar.ts
function createGrammar(scopeName, grammar, initialLanguage, embeddedLanguages, tokenTypes, balancedBracketSelectors, grammarRepository, onigLib) {
  return new Grammar(
    scopeName,
    grammar,
    initialLanguage,
    embeddedLanguages,
    tokenTypes,
    balancedBracketSelectors,
    grammarRepository,
    onigLib
  );
}
function collectInjections(result, selector, rule, ruleFactoryHelper, grammar) {
  const matchers = createMatchers(selector, nameMatcher);
  const ruleId = RuleFactory.getCompiledRuleId(rule, ruleFactoryHelper, grammar.repository);
  for (const matcher of matchers) {
    result.push({
      debugSelector: selector,
      matcher: matcher.matcher,
      ruleId,
      grammar,
      priority: matcher.priority
    });
  }
}
function nameMatcher(identifers, scopes) {
  if (scopes.length < identifers.length) {
    return false;
  }
  let lastIndex = 0;
  return identifers.every((identifier) => {
    for (let i = lastIndex; i < scopes.length; i++) {
      if (scopesAreMatching(scopes[i], identifier)) {
        lastIndex = i + 1;
        return true;
      }
    }
    return false;
  });
}
function scopesAreMatching(thisScopeName, scopeName) {
  if (!thisScopeName) {
    return false;
  }
  if (thisScopeName === scopeName) {
    return true;
  }
  const len = scopeName.length;
  return thisScopeName.length > len && thisScopeName.substr(0, len) === scopeName && thisScopeName[len] === ".";
}
var Grammar = class {
  constructor(_rootScopeName, grammar, initialLanguage, embeddedLanguages, tokenTypes, balancedBracketSelectors, grammarRepository, _onigLib) {
    this._rootScopeName = _rootScopeName;
    this.balancedBracketSelectors = balancedBracketSelectors;
    this._onigLib = _onigLib;
    this._basicScopeAttributesProvider = new BasicScopeAttributesProvider(
      initialLanguage,
      embeddedLanguages
    );
    this._rootId = -1;
    this._lastRuleId = 0;
    this._ruleId2desc = [null];
    this._includedGrammars = {};
    this._grammarRepository = grammarRepository;
    this._grammar = initGrammar(grammar, null);
    this._injections = null;
    this._tokenTypeMatchers = [];
    if (tokenTypes) {
      for (const selector of Object.keys(tokenTypes)) {
        const matchers = createMatchers(selector, nameMatcher);
        for (const matcher of matchers) {
          this._tokenTypeMatchers.push({
            matcher: matcher.matcher,
            type: tokenTypes[selector]
          });
        }
      }
    }
  }
  _rootId;
  _lastRuleId;
  _ruleId2desc;
  _includedGrammars;
  _grammarRepository;
  _grammar;
  _injections;
  _basicScopeAttributesProvider;
  _tokenTypeMatchers;
  get themeProvider() {
    return this._grammarRepository;
  }
  dispose() {
    for (const rule of this._ruleId2desc) {
      if (rule) {
        rule.dispose();
      }
    }
  }
  createOnigScanner(sources) {
    return this._onigLib.createOnigScanner(sources);
  }
  createOnigString(sources) {
    return this._onigLib.createOnigString(sources);
  }
  getMetadataForScope(scope) {
    return this._basicScopeAttributesProvider.getBasicScopeAttributes(scope);
  }
  _collectInjections() {
    const grammarRepository = {
      lookup: (scopeName2) => {
        if (scopeName2 === this._rootScopeName) {
          return this._grammar;
        }
        return this.getExternalGrammar(scopeName2);
      },
      injections: (scopeName2) => {
        return this._grammarRepository.injections(scopeName2);
      }
    };
    const result = [];
    const scopeName = this._rootScopeName;
    const grammar = grammarRepository.lookup(scopeName);
    if (grammar) {
      const rawInjections = grammar.injections;
      if (rawInjections) {
        for (let expression in rawInjections) {
          collectInjections(
            result,
            expression,
            rawInjections[expression],
            this,
            grammar
          );
        }
      }
      const injectionScopeNames = this._grammarRepository.injections(scopeName);
      if (injectionScopeNames) {
        injectionScopeNames.forEach((injectionScopeName) => {
          const injectionGrammar = this.getExternalGrammar(injectionScopeName);
          if (injectionGrammar) {
            const selector = injectionGrammar.injectionSelector;
            if (selector) {
              collectInjections(
                result,
                selector,
                injectionGrammar,
                this,
                injectionGrammar
              );
            }
          }
        });
      }
    }
    result.sort((i1, i2) => i1.priority - i2.priority);
    return result;
  }
  getInjections() {
    if (this._injections === null) {
      this._injections = this._collectInjections();
    }
    return this._injections;
  }
  registerRule(factory) {
    const id = ++this._lastRuleId;
    const result = factory(ruleIdFromNumber(id));
    this._ruleId2desc[id] = result;
    return result;
  }
  getRule(ruleId) {
    return this._ruleId2desc[ruleIdToNumber(ruleId)];
  }
  getExternalGrammar(scopeName, repository) {
    if (this._includedGrammars[scopeName]) {
      return this._includedGrammars[scopeName];
    } else if (this._grammarRepository) {
      const rawIncludedGrammar = this._grammarRepository.lookup(scopeName);
      if (rawIncludedGrammar) {
        this._includedGrammars[scopeName] = initGrammar(
          rawIncludedGrammar,
          repository && repository.$base
        );
        return this._includedGrammars[scopeName];
      }
    }
    return void 0;
  }
  tokenizeLine(lineText, prevState, timeLimit = 0) {
    const r = this._tokenize(lineText, prevState, false, timeLimit);
    return {
      tokens: r.lineTokens.getResult(r.ruleStack, r.lineLength),
      ruleStack: r.ruleStack,
      stoppedEarly: r.stoppedEarly
    };
  }
  tokenizeLine2(lineText, prevState, timeLimit = 0) {
    const r = this._tokenize(lineText, prevState, true, timeLimit);
    return {
      tokens: r.lineTokens.getBinaryResult(r.ruleStack, r.lineLength),
      ruleStack: r.ruleStack,
      stoppedEarly: r.stoppedEarly
    };
  }
  _tokenize(lineText, prevState, emitBinaryTokens, timeLimit) {
    if (this._rootId === -1) {
      this._rootId = RuleFactory.getCompiledRuleId(
        this._grammar.repository.$self,
        this,
        this._grammar.repository
      );
      this.getInjections();
    }
    let isFirstLine;
    if (!prevState || prevState === StateStackImpl.NULL) {
      isFirstLine = true;
      const rawDefaultMetadata = this._basicScopeAttributesProvider.getDefaultAttributes();
      const defaultStyle = this.themeProvider.getDefaults();
      const defaultMetadata = EncodedTokenMetadata.set(
        0,
        rawDefaultMetadata.languageId,
        rawDefaultMetadata.tokenType,
        null,
        defaultStyle.fontStyle,
        defaultStyle.foregroundId,
        defaultStyle.backgroundId
      );
      const rootScopeName = this.getRule(this._rootId).getName(
        null,
        null
      );
      let scopeList;
      if (rootScopeName) {
        scopeList = AttributedScopeStack.createRootAndLookUpScopeName(
          rootScopeName,
          defaultMetadata,
          this
        );
      } else {
        scopeList = AttributedScopeStack.createRoot(
          "unknown",
          defaultMetadata
        );
      }
      prevState = new StateStackImpl(
        null,
        this._rootId,
        -1,
        -1,
        false,
        null,
        scopeList,
        scopeList
      );
    } else {
      isFirstLine = false;
      prevState.reset();
    }
    lineText = lineText + "\n";
    const onigLineText = this.createOnigString(lineText);
    const lineLength = onigLineText.content.length;
    const lineTokens = new LineTokens(
      emitBinaryTokens,
      lineText,
      this._tokenTypeMatchers,
      this.balancedBracketSelectors
    );
    const r = _tokenizeString(
      this,
      onigLineText,
      isFirstLine,
      0,
      prevState,
      lineTokens,
      true,
      timeLimit
    );
    disposeOnigString(onigLineText);
    return {
      lineLength,
      lineTokens,
      ruleStack: r.stack,
      stoppedEarly: r.stoppedEarly
    };
  }
};
function initGrammar(grammar, base) {
  grammar = clone(grammar);
  grammar.repository = grammar.repository || {};
  grammar.repository.$self = {
    $vscodeTextmateLocation: grammar.$vscodeTextmateLocation,
    patterns: grammar.patterns,
    name: grammar.scopeName
  };
  grammar.repository.$base = base || grammar.repository.$self;
  return grammar;
}
var AttributedScopeStack = class _AttributedScopeStack {
  /**
   * Invariant:
   * ```
   * if (parent && !scopePath.extends(parent.scopePath)) {
   * 	throw new Error();
   * }
   * ```
   */
  constructor(parent, scopePath, tokenAttributes) {
    this.parent = parent;
    this.scopePath = scopePath;
    this.tokenAttributes = tokenAttributes;
  }
  static fromExtension(namesScopeList, contentNameScopesList) {
    let current = namesScopeList;
    let scopeNames = namesScopeList?.scopePath ?? null;
    for (const frame of contentNameScopesList) {
      scopeNames = ScopeStack.push(scopeNames, frame.scopeNames);
      current = new _AttributedScopeStack(current, scopeNames, frame.encodedTokenAttributes);
    }
    return current;
  }
  static createRoot(scopeName, tokenAttributes) {
    return new _AttributedScopeStack(null, new ScopeStack(null, scopeName), tokenAttributes);
  }
  static createRootAndLookUpScopeName(scopeName, tokenAttributes, grammar) {
    const rawRootMetadata = grammar.getMetadataForScope(scopeName);
    const scopePath = new ScopeStack(null, scopeName);
    const rootStyle = grammar.themeProvider.themeMatch(scopePath);
    const resolvedTokenAttributes = _AttributedScopeStack.mergeAttributes(
      tokenAttributes,
      rawRootMetadata,
      rootStyle
    );
    return new _AttributedScopeStack(null, scopePath, resolvedTokenAttributes);
  }
  get scopeName() {
    return this.scopePath.scopeName;
  }
  toString() {
    return this.getScopeNames().join(" ");
  }
  equals(other) {
    return _AttributedScopeStack.equals(this, other);
  }
  static equals(a, b) {
    do {
      if (a === b) {
        return true;
      }
      if (!a && !b) {
        return true;
      }
      if (!a || !b) {
        return false;
      }
      if (a.scopeName !== b.scopeName || a.tokenAttributes !== b.tokenAttributes) {
        return false;
      }
      a = a.parent;
      b = b.parent;
    } while (true);
  }
  static mergeAttributes(existingTokenAttributes, basicScopeAttributes, styleAttributes) {
    let fontStyle = -1 /* NotSet */;
    let foreground = 0;
    let background = 0;
    if (styleAttributes !== null) {
      fontStyle = styleAttributes.fontStyle;
      foreground = styleAttributes.foregroundId;
      background = styleAttributes.backgroundId;
    }
    return EncodedTokenMetadata.set(
      existingTokenAttributes,
      basicScopeAttributes.languageId,
      basicScopeAttributes.tokenType,
      null,
      fontStyle,
      foreground,
      background
    );
  }
  pushAttributed(scopePath, grammar) {
    if (scopePath === null) {
      return this;
    }
    if (scopePath.indexOf(" ") === -1) {
      return _AttributedScopeStack._pushAttributed(this, scopePath, grammar);
    }
    const scopes = scopePath.split(/ /g);
    let result = this;
    for (const scope of scopes) {
      result = _AttributedScopeStack._pushAttributed(result, scope, grammar);
    }
    return result;
  }
  static _pushAttributed(target, scopeName, grammar) {
    const rawMetadata = grammar.getMetadataForScope(scopeName);
    const newPath = target.scopePath.push(scopeName);
    const scopeThemeMatchResult = grammar.themeProvider.themeMatch(newPath);
    const metadata = _AttributedScopeStack.mergeAttributes(
      target.tokenAttributes,
      rawMetadata,
      scopeThemeMatchResult
    );
    return new _AttributedScopeStack(target, newPath, metadata);
  }
  getScopeNames() {
    return this.scopePath.getSegments();
  }
  getExtensionIfDefined(base) {
    const result = [];
    let self = this;
    while (self && self !== base) {
      result.push({
        encodedTokenAttributes: self.tokenAttributes,
        scopeNames: self.scopePath.getExtensionIfDefined(self.parent?.scopePath ?? null)
      });
      self = self.parent;
    }
    return self === base ? result.reverse() : void 0;
  }
};
var StateStackImpl = class _StateStackImpl {
  /**
   * Invariant:
   * ```
   * if (contentNameScopesList !== nameScopesList && contentNameScopesList?.parent !== nameScopesList) {
   * 	throw new Error();
   * }
   * if (this.parent && !nameScopesList.extends(this.parent.contentNameScopesList)) {
   * 	throw new Error();
   * }
   * ```
   */
  constructor(parent, ruleId, enterPos, anchorPos, beginRuleCapturedEOL, endRule, nameScopesList, contentNameScopesList) {
    this.parent = parent;
    this.ruleId = ruleId;
    this.beginRuleCapturedEOL = beginRuleCapturedEOL;
    this.endRule = endRule;
    this.nameScopesList = nameScopesList;
    this.contentNameScopesList = contentNameScopesList;
    this.depth = this.parent ? this.parent.depth + 1 : 1;
    this._enterPos = enterPos;
    this._anchorPos = anchorPos;
  }
  _stackElementBrand = void 0;
  // TODO remove me
  static NULL = new _StateStackImpl(
    null,
    0,
    0,
    0,
    false,
    null,
    null,
    null
  );
  /**
   * The position on the current line where this state was pushed.
   * This is relevant only while tokenizing a line, to detect endless loops.
   * Its value is meaningless across lines.
   */
  _enterPos;
  /**
   * The captured anchor position when this stack element was pushed.
   * This is relevant only while tokenizing a line, to restore the anchor position when popping.
   * Its value is meaningless across lines.
   */
  _anchorPos;
  /**
   * The depth of the stack.
   */
  depth;
  equals(other) {
    if (other === null) {
      return false;
    }
    return _StateStackImpl._equals(this, other);
  }
  static _equals(a, b) {
    if (a === b) {
      return true;
    }
    if (!this._structuralEquals(a, b)) {
      return false;
    }
    return AttributedScopeStack.equals(a.contentNameScopesList, b.contentNameScopesList);
  }
  /**
   * A structural equals check. Does not take into account `scopes`.
   */
  static _structuralEquals(a, b) {
    do {
      if (a === b) {
        return true;
      }
      if (!a && !b) {
        return true;
      }
      if (!a || !b) {
        return false;
      }
      if (a.depth !== b.depth || a.ruleId !== b.ruleId || a.endRule !== b.endRule) {
        return false;
      }
      a = a.parent;
      b = b.parent;
    } while (true);
  }
  clone() {
    return this;
  }
  static _reset(el) {
    while (el) {
      el._enterPos = -1;
      el._anchorPos = -1;
      el = el.parent;
    }
  }
  reset() {
    _StateStackImpl._reset(this);
  }
  pop() {
    return this.parent;
  }
  safePop() {
    if (this.parent) {
      return this.parent;
    }
    return this;
  }
  push(ruleId, enterPos, anchorPos, beginRuleCapturedEOL, endRule, nameScopesList, contentNameScopesList) {
    return new _StateStackImpl(
      this,
      ruleId,
      enterPos,
      anchorPos,
      beginRuleCapturedEOL,
      endRule,
      nameScopesList,
      contentNameScopesList
    );
  }
  getEnterPos() {
    return this._enterPos;
  }
  getAnchorPos() {
    return this._anchorPos;
  }
  getRule(grammar) {
    return grammar.getRule(this.ruleId);
  }
  toString() {
    const r = [];
    this._writeString(r, 0);
    return "[" + r.join(",") + "]";
  }
  _writeString(res, outIndex) {
    if (this.parent) {
      outIndex = this.parent._writeString(res, outIndex);
    }
    res[outIndex++] = `(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`;
    return outIndex;
  }
  withContentNameScopesList(contentNameScopeStack) {
    if (this.contentNameScopesList === contentNameScopeStack) {
      return this;
    }
    return this.parent.push(
      this.ruleId,
      this._enterPos,
      this._anchorPos,
      this.beginRuleCapturedEOL,
      this.endRule,
      this.nameScopesList,
      contentNameScopeStack
    );
  }
  withEndRule(endRule) {
    if (this.endRule === endRule) {
      return this;
    }
    return new _StateStackImpl(
      this.parent,
      this.ruleId,
      this._enterPos,
      this._anchorPos,
      this.beginRuleCapturedEOL,
      endRule,
      this.nameScopesList,
      this.contentNameScopesList
    );
  }
  // Used to warn of endless loops
  hasSameRuleAs(other) {
    let el = this;
    while (el && el._enterPos === other._enterPos) {
      if (el.ruleId === other.ruleId) {
        return true;
      }
      el = el.parent;
    }
    return false;
  }
  toStateStackFrame() {
    return {
      ruleId: ruleIdToNumber(this.ruleId),
      beginRuleCapturedEOL: this.beginRuleCapturedEOL,
      endRule: this.endRule,
      nameScopesList: this.nameScopesList?.getExtensionIfDefined(this.parent?.nameScopesList ?? null) ?? [],
      contentNameScopesList: this.contentNameScopesList?.getExtensionIfDefined(this.nameScopesList) ?? []
    };
  }
  static pushFrame(self, frame) {
    const namesScopeList = AttributedScopeStack.fromExtension(self?.nameScopesList ?? null, frame.nameScopesList);
    return new _StateStackImpl(
      self,
      ruleIdFromNumber(frame.ruleId),
      frame.enterPos ?? -1,
      frame.anchorPos ?? -1,
      frame.beginRuleCapturedEOL,
      frame.endRule,
      namesScopeList,
      AttributedScopeStack.fromExtension(namesScopeList, frame.contentNameScopesList)
    );
  }
};
var BalancedBracketSelectors = class {
  balancedBracketScopes;
  unbalancedBracketScopes;
  allowAny = false;
  constructor(balancedBracketScopes, unbalancedBracketScopes) {
    this.balancedBracketScopes = balancedBracketScopes.flatMap(
      (selector) => {
        if (selector === "*") {
          this.allowAny = true;
          return [];
        }
        return createMatchers(selector, nameMatcher).map((m) => m.matcher);
      }
    );
    this.unbalancedBracketScopes = unbalancedBracketScopes.flatMap(
      (selector) => createMatchers(selector, nameMatcher).map((m) => m.matcher)
    );
  }
  get matchesAlways() {
    return this.allowAny && this.unbalancedBracketScopes.length === 0;
  }
  get matchesNever() {
    return this.balancedBracketScopes.length === 0 && !this.allowAny;
  }
  match(scopes) {
    for (const excluder of this.unbalancedBracketScopes) {
      if (excluder(scopes)) {
        return false;
      }
    }
    for (const includer of this.balancedBracketScopes) {
      if (includer(scopes)) {
        return true;
      }
    }
    return this.allowAny;
  }
};
var LineTokens = class {
  constructor(emitBinaryTokens, lineText, tokenTypeOverrides, balancedBracketSelectors) {
    this.balancedBracketSelectors = balancedBracketSelectors;
    this._emitBinaryTokens = emitBinaryTokens;
    this._tokenTypeOverrides = tokenTypeOverrides;
    {
      this._lineText = null;
    }
    this._tokens = [];
    this._binaryTokens = [];
    this._lastTokenEndIndex = 0;
  }
  _emitBinaryTokens;
  /**
   * defined only if `false`.
   */
  _lineText;
  /**
   * used only if `_emitBinaryTokens` is false.
   */
  _tokens;
  /**
   * used only if `_emitBinaryTokens` is true.
   */
  _binaryTokens;
  _lastTokenEndIndex;
  _tokenTypeOverrides;
  produce(stack, endIndex) {
    this.produceFromScopes(stack.contentNameScopesList, endIndex);
  }
  produceFromScopes(scopesList, endIndex) {
    if (this._lastTokenEndIndex >= endIndex) {
      return;
    }
    if (this._emitBinaryTokens) {
      let metadata = scopesList?.tokenAttributes ?? 0;
      let containsBalancedBrackets = false;
      if (this.balancedBracketSelectors?.matchesAlways) {
        containsBalancedBrackets = true;
      }
      if (this._tokenTypeOverrides.length > 0 || this.balancedBracketSelectors && !this.balancedBracketSelectors.matchesAlways && !this.balancedBracketSelectors.matchesNever) {
        const scopes2 = scopesList?.getScopeNames() ?? [];
        for (const tokenType of this._tokenTypeOverrides) {
          if (tokenType.matcher(scopes2)) {
            metadata = EncodedTokenMetadata.set(
              metadata,
              0,
              toOptionalTokenType(tokenType.type),
              null,
              -1 /* NotSet */,
              0,
              0
            );
          }
        }
        if (this.balancedBracketSelectors) {
          containsBalancedBrackets = this.balancedBracketSelectors.match(scopes2);
        }
      }
      if (containsBalancedBrackets) {
        metadata = EncodedTokenMetadata.set(
          metadata,
          0,
          8 /* NotSet */,
          containsBalancedBrackets,
          -1 /* NotSet */,
          0,
          0
        );
      }
      if (this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 1] === metadata) {
        this._lastTokenEndIndex = endIndex;
        return;
      }
      this._binaryTokens.push(this._lastTokenEndIndex);
      this._binaryTokens.push(metadata);
      this._lastTokenEndIndex = endIndex;
      return;
    }
    const scopes = scopesList?.getScopeNames() ?? [];
    this._tokens.push({
      startIndex: this._lastTokenEndIndex,
      endIndex,
      // value: lineText.substring(lastTokenEndIndex, endIndex),
      scopes
    });
    this._lastTokenEndIndex = endIndex;
  }
  getResult(stack, lineLength) {
    if (this._tokens.length > 0 && this._tokens[this._tokens.length - 1].startIndex === lineLength - 1) {
      this._tokens.pop();
    }
    if (this._tokens.length === 0) {
      this._lastTokenEndIndex = -1;
      this.produce(stack, lineLength);
      this._tokens[this._tokens.length - 1].startIndex = 0;
    }
    return this._tokens;
  }
  getBinaryResult(stack, lineLength) {
    if (this._binaryTokens.length > 0 && this._binaryTokens[this._binaryTokens.length - 2] === lineLength - 1) {
      this._binaryTokens.pop();
      this._binaryTokens.pop();
    }
    if (this._binaryTokens.length === 0) {
      this._lastTokenEndIndex = -1;
      this.produce(stack, lineLength);
      this._binaryTokens[this._binaryTokens.length - 2] = 0;
    }
    const result = new Uint32Array(this._binaryTokens.length);
    for (let i = 0, len = this._binaryTokens.length; i < len; i++) {
      result[i] = this._binaryTokens[i];
    }
    return result;
  }
};

// src/registry.ts
var SyncRegistry = class {
  constructor(theme, _onigLib) {
    this._onigLib = _onigLib;
    this._theme = theme;
  }
  _grammars = /* @__PURE__ */ new Map();
  _rawGrammars = /* @__PURE__ */ new Map();
  _injectionGrammars = /* @__PURE__ */ new Map();
  _theme;
  dispose() {
    for (const grammar of this._grammars.values()) {
      grammar.dispose();
    }
  }
  setTheme(theme) {
    this._theme = theme;
  }
  getColorMap() {
    return this._theme.getColorMap();
  }
  /**
   * Add `grammar` to registry and return a list of referenced scope names
   */
  addGrammar(grammar, injectionScopeNames) {
    this._rawGrammars.set(grammar.scopeName, grammar);
    if (injectionScopeNames) {
      this._injectionGrammars.set(grammar.scopeName, injectionScopeNames);
    }
  }
  /**
   * Lookup a raw grammar.
   */
  lookup(scopeName) {
    return this._rawGrammars.get(scopeName);
  }
  /**
   * Returns the injections for the given grammar
   */
  injections(targetScope) {
    return this._injectionGrammars.get(targetScope);
  }
  /**
   * Get the default theme settings
   */
  getDefaults() {
    return this._theme.getDefaults();
  }
  /**
   * Match a scope in the theme.
   */
  themeMatch(scopePath) {
    return this._theme.match(scopePath);
  }
  /**
   * Lookup a grammar.
   */
  grammarForScopeName(scopeName, initialLanguage, embeddedLanguages, tokenTypes, balancedBracketSelectors) {
    if (!this._grammars.has(scopeName)) {
      let rawGrammar = this._rawGrammars.get(scopeName);
      if (!rawGrammar) {
        return null;
      }
      this._grammars.set(scopeName, createGrammar(
        scopeName,
        rawGrammar,
        initialLanguage,
        embeddedLanguages,
        tokenTypes,
        balancedBracketSelectors,
        this,
        this._onigLib
      ));
    }
    return this._grammars.get(scopeName);
  }
};

// src/index.ts
var Registry$1 = class Registry {
  _options;
  _syncRegistry;
  _ensureGrammarCache;
  constructor(options) {
    this._options = options;
    this._syncRegistry = new SyncRegistry(
      Theme.createFromRawTheme(options.theme, options.colorMap),
      options.onigLib
    );
    this._ensureGrammarCache = /* @__PURE__ */ new Map();
  }
  dispose() {
    this._syncRegistry.dispose();
  }
  /**
   * Change the theme. Once called, no previous `ruleStack` should be used anymore.
   */
  setTheme(theme, colorMap) {
    this._syncRegistry.setTheme(Theme.createFromRawTheme(theme, colorMap));
  }
  /**
   * Returns a lookup array for color ids.
   */
  getColorMap() {
    return this._syncRegistry.getColorMap();
  }
  /**
   * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
   * Please do not use language id 0.
   */
  loadGrammarWithEmbeddedLanguages(initialScopeName, initialLanguage, embeddedLanguages) {
    return this.loadGrammarWithConfiguration(initialScopeName, initialLanguage, { embeddedLanguages });
  }
  /**
   * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
   * Please do not use language id 0.
   */
  loadGrammarWithConfiguration(initialScopeName, initialLanguage, configuration) {
    return this._loadGrammar(
      initialScopeName,
      initialLanguage,
      configuration.embeddedLanguages,
      configuration.tokenTypes,
      new BalancedBracketSelectors(
        configuration.balancedBracketSelectors || [],
        configuration.unbalancedBracketSelectors || []
      )
    );
  }
  /**
   * Load the grammar for `scopeName` and all referenced included grammars asynchronously.
   */
  loadGrammar(initialScopeName) {
    return this._loadGrammar(initialScopeName, 0, null, null, null);
  }
  _loadGrammar(initialScopeName, initialLanguage, embeddedLanguages, tokenTypes, balancedBracketSelectors) {
    const dependencyProcessor = new ScopeDependencyProcessor(this._syncRegistry, initialScopeName);
    while (dependencyProcessor.Q.length > 0) {
      dependencyProcessor.Q.map((request) => this._loadSingleGrammar(request.scopeName));
      dependencyProcessor.processQueue();
    }
    return this._grammarForScopeName(
      initialScopeName,
      initialLanguage,
      embeddedLanguages,
      tokenTypes,
      balancedBracketSelectors
    );
  }
  _loadSingleGrammar(scopeName) {
    if (!this._ensureGrammarCache.has(scopeName)) {
      this._doLoadSingleGrammar(scopeName);
      this._ensureGrammarCache.set(scopeName, true);
    }
  }
  _doLoadSingleGrammar(scopeName) {
    const grammar = this._options.loadGrammar(scopeName);
    if (grammar) {
      const injections = typeof this._options.getInjections === "function" ? this._options.getInjections(scopeName) : void 0;
      this._syncRegistry.addGrammar(grammar, injections);
    }
  }
  /**
   * Adds a rawGrammar.
   */
  addGrammar(rawGrammar, injections = [], initialLanguage = 0, embeddedLanguages = null) {
    this._syncRegistry.addGrammar(rawGrammar, injections);
    return this._grammarForScopeName(rawGrammar.scopeName, initialLanguage, embeddedLanguages);
  }
  /**
   * Get the grammar for `scopeName`. The grammar must first be created via `loadGrammar` or `addGrammar`.
   */
  _grammarForScopeName(scopeName, initialLanguage = 0, embeddedLanguages = null, tokenTypes = null, balancedBracketSelectors = null) {
    return this._syncRegistry.grammarForScopeName(
      scopeName,
      initialLanguage,
      embeddedLanguages,
      tokenTypes,
      balancedBracketSelectors
    );
  }
};
var INITIAL = StateStackImpl.NULL;

/**
 * List of HTML void tag names.
 *
 * @type {Array<string>}
 */
const htmlVoidElements = [
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'command',
  'embed',
  'frame',
  'hr',
  'image',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
];

/**
 * @import {Schema as SchemaType, Space} from 'property-information'
 */

/** @type {SchemaType} */
class Schema {
  /**
   * @param {SchemaType['property']} property
   *   Property.
   * @param {SchemaType['normal']} normal
   *   Normal.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Schema.
   */
  constructor(property, normal, space) {
    this.normal = normal;
    this.property = property;

    if (space) {
      this.space = space;
    }
  }
}

Schema.prototype.normal = {};
Schema.prototype.property = {};
Schema.prototype.space = undefined;

/**
 * @import {Info, Space} from 'property-information'
 */


/**
 * @param {ReadonlyArray<Schema>} definitions
 *   Definitions.
 * @param {Space | undefined} [space]
 *   Space.
 * @returns {Schema}
 *   Schema.
 */
function merge(definitions, space) {
  /** @type {Record<string, Info>} */
  const property = {};
  /** @type {Record<string, string>} */
  const normal = {};

  for (const definition of definitions) {
    Object.assign(property, definition.property);
    Object.assign(normal, definition.normal);
  }

  return new Schema(property, normal, space)
}

/**
 * Get the cleaned case insensitive form of an attribute or property.
 *
 * @param {string} value
 *   An attribute-like or property-like name.
 * @returns {string}
 *   Value that can be used to look up the properly cased property on a
 *   `Schema`.
 */
function normalize(value) {
  return value.toLowerCase()
}

/**
 * @import {Info as InfoType} from 'property-information'
 */

/** @type {InfoType} */
class Info {
  /**
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @returns
   *   Info.
   */
  constructor(property, attribute) {
    this.attribute = attribute;
    this.property = property;
  }
}

Info.prototype.attribute = '';
Info.prototype.booleanish = false;
Info.prototype.boolean = false;
Info.prototype.commaOrSpaceSeparated = false;
Info.prototype.commaSeparated = false;
Info.prototype.defined = false;
Info.prototype.mustUseProperty = false;
Info.prototype.number = false;
Info.prototype.overloadedBoolean = false;
Info.prototype.property = '';
Info.prototype.spaceSeparated = false;
Info.prototype.space = undefined;

let powers = 0;

const boolean = increment();
const booleanish = increment();
const overloadedBoolean = increment();
const number = increment();
const spaceSeparated = increment();
const commaSeparated = increment();
const commaOrSpaceSeparated = increment();

function increment() {
  return 2 ** ++powers
}

var types = /*#__PURE__*/Object.freeze({
  __proto__: null,
  boolean: boolean,
  booleanish: booleanish,
  commaOrSpaceSeparated: commaOrSpaceSeparated,
  commaSeparated: commaSeparated,
  number: number,
  overloadedBoolean: overloadedBoolean,
  spaceSeparated: spaceSeparated
});

/**
 * @import {Space} from 'property-information'
 */


const checks = /** @type {ReadonlyArray<keyof typeof types>} */ (
  Object.keys(types)
);

class DefinedInfo extends Info {
  /**
   * @constructor
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @param {number | null | undefined} [mask]
   *   Mask.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Info.
   */
  constructor(property, attribute, mask, space) {
    let index = -1;

    super(property, attribute);

    mark(this, 'space', space);

    if (typeof mask === 'number') {
      while (++index < checks.length) {
        const check = checks[index];
        mark(this, checks[index], (mask & types[check]) === types[check]);
      }
    }
  }
}

DefinedInfo.prototype.defined = true;

/**
 * @template {keyof DefinedInfo} Key
 *   Key type.
 * @param {DefinedInfo} values
 *   Info.
 * @param {Key} key
 *   Key.
 * @param {DefinedInfo[Key]} value
 *   Value.
 * @returns {undefined}
 *   Nothing.
 */
function mark(values, key, value) {
  if (value) {
    values[key] = value;
  }
}

/**
 * @import {Info, Space} from 'property-information'
 */


/**
 * @param {Definition} definition
 *   Definition.
 * @returns {Schema}
 *   Schema.
 */
function create(definition) {
  /** @type {Record<string, Info>} */
  const properties = {};
  /** @type {Record<string, string>} */
  const normals = {};

  for (const [property, value] of Object.entries(definition.properties)) {
    const info = new DefinedInfo(
      property,
      definition.transform(definition.attributes || {}, property),
      value,
      definition.space
    );

    if (
      definition.mustUseProperty &&
      definition.mustUseProperty.includes(property)
    ) {
      info.mustUseProperty = true;
    }

    properties[property] = info;

    normals[normalize(property)] = property;
    normals[normalize(info.attribute)] = property;
  }

  return new Schema(properties, normals, definition.space)
}

const aria = create({
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  },
  transform(_, property) {
    return property === 'role'
      ? property
      : 'aria-' + property.slice(4).toLowerCase()
  }
});

/**
 * @param {Record<string, string>} attributes
 *   Attributes.
 * @param {string} attribute
 *   Attribute.
 * @returns {string}
 *   Transformed attribute.
 */
function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute
}

/**
 * @param {Record<string, string>} attributes
 *   Attributes.
 * @param {string} property
 *   Property.
 * @returns {string}
 *   Transformed property.
 */
function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase())
}

const html$3 = create({
  attributes: {
    acceptcharset: 'accept-charset',
    classname: 'class',
    htmlfor: 'for',
    httpequiv: 'http-equiv'
  },
  mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allow: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    blocking: spaceSeparated,
    capture: null,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    cols: number,
    colSpan: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    enterKeyHint: null,
    fetchPriority: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: overloadedBoolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    imageSizes: null,
    imageSrcSet: null,
    inert: boolean,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loading: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    onAbort: null,
    onAfterPrint: null,
    onAuxClick: null,
    onBeforeMatch: null,
    onBeforePrint: null,
    onBeforeToggle: null,
    onBeforeUnload: null,
    onBlur: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onContextLost: null,
    onContextMenu: null,
    onContextRestored: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFormData: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLanguageChange: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadEnd: null,
    onLoadStart: null,
    onMessage: null,
    onMessageError: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRejectionHandled: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onScrollEnd: null,
    onSecurityPolicyViolation: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onSlotChange: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnhandledRejection: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onWheel: null,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    popover: null,
    popoverTarget: null,
    popoverTargetAction: null,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shadowRootClonable: boolean,
    shadowRootDelegatesFocus: boolean,
    shadowRootMode: null,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: null,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,
    writingSuggestions: null,

    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null, // Several. Use CSS `text-align` instead,
    aLink: null, // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated, // `<object>`. List of URIs to archives
    axis: null, // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null, // `<body>`. Use CSS `background-image` instead
    bgColor: null, // `<body>` and table elements. Use CSS `background-color` instead
    border: number, // `<table>`. Use CSS `border-width` instead,
    borderColor: null, // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number, // `<body>`
    cellPadding: null, // `<table>`
    cellSpacing: null, // `<table>`
    char: null, // Several table elements. When `align=char`, sets the character to align on
    charOff: null, // Several table elements. When `char`, offsets the alignment
    classId: null, // `<object>`
    clear: null, // `<br>`. Use CSS `clear` instead
    code: null, // `<object>`
    codeBase: null, // `<object>`
    codeType: null, // `<object>`
    color: null, // `<font>` and `<hr>`. Use CSS instead
    compact: boolean, // Lists. Use CSS to reduce space between items instead
    declare: boolean, // `<object>`
    event: null, // `<script>`
    face: null, // `<font>`. Use CSS instead
    frame: null, // `<table>`
    frameBorder: null, // `<iframe>`. Use CSS `border` instead
    hSpace: number, // `<img>` and `<object>`
    leftMargin: number, // `<body>`
    link: null, // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null, // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null, // `<img>`. Use a `<picture>`
    marginHeight: number, // `<body>`
    marginWidth: number, // `<body>`
    noResize: boolean, // `<frame>`
    noHref: boolean, // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean, // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean, // `<td>` and `<th>`
    object: null, // `<applet>`
    profile: null, // `<head>`
    prompt: null, // `<isindex>`
    rev: null, // `<link>`
    rightMargin: number, // `<body>`
    rules: null, // `<table>`
    scheme: null, // `<meta>`
    scrolling: booleanish, // `<frame>`. Use overflow in the child context
    standby: null, // `<object>`
    summary: null, // `<table>`
    text: null, // `<body>`. Use CSS `color` instead
    topMargin: number, // `<body>`
    valueType: null, // `<param>`
    version: null, // `<html>`. Use a doctype.
    vAlign: null, // Several. Use CSS `vertical-align` instead
    vLink: null, // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number, // `<img>` and `<object>`

    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    disablePictureInPicture: boolean,
    disableRemotePlayback: boolean,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  },
  space: 'html',
  transform: caseInsensitiveTransform
});

const svg$1 = create({
  attributes: {
    accentHeight: 'accent-height',
    alignmentBaseline: 'alignment-baseline',
    arabicForm: 'arabic-form',
    baselineShift: 'baseline-shift',
    capHeight: 'cap-height',
    className: 'class',
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    crossOrigin: 'crossorigin',
    dataType: 'datatype',
    dominantBaseline: 'dominant-baseline',
    enableBackground: 'enable-background',
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    hrefLang: 'hreflang',
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    horizOriginY: 'horiz-origin-y',
    imageRendering: 'image-rendering',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    navDown: 'nav-down',
    navDownLeft: 'nav-down-left',
    navDownRight: 'nav-down-right',
    navLeft: 'nav-left',
    navNext: 'nav-next',
    navPrev: 'nav-prev',
    navRight: 'nav-right',
    navUp: 'nav-up',
    navUpLeft: 'nav-up-left',
    navUpRight: 'nav-up-right',
    onAbort: 'onabort',
    onActivate: 'onactivate',
    onAfterPrint: 'onafterprint',
    onBeforePrint: 'onbeforeprint',
    onBegin: 'onbegin',
    onCancel: 'oncancel',
    onCanPlay: 'oncanplay',
    onCanPlayThrough: 'oncanplaythrough',
    onChange: 'onchange',
    onClick: 'onclick',
    onClose: 'onclose',
    onCopy: 'oncopy',
    onCueChange: 'oncuechange',
    onCut: 'oncut',
    onDblClick: 'ondblclick',
    onDrag: 'ondrag',
    onDragEnd: 'ondragend',
    onDragEnter: 'ondragenter',
    onDragExit: 'ondragexit',
    onDragLeave: 'ondragleave',
    onDragOver: 'ondragover',
    onDragStart: 'ondragstart',
    onDrop: 'ondrop',
    onDurationChange: 'ondurationchange',
    onEmptied: 'onemptied',
    onEnd: 'onend',
    onEnded: 'onended',
    onError: 'onerror',
    onFocus: 'onfocus',
    onFocusIn: 'onfocusin',
    onFocusOut: 'onfocusout',
    onHashChange: 'onhashchange',
    onInput: 'oninput',
    onInvalid: 'oninvalid',
    onKeyDown: 'onkeydown',
    onKeyPress: 'onkeypress',
    onKeyUp: 'onkeyup',
    onLoad: 'onload',
    onLoadedData: 'onloadeddata',
    onLoadedMetadata: 'onloadedmetadata',
    onLoadStart: 'onloadstart',
    onMessage: 'onmessage',
    onMouseDown: 'onmousedown',
    onMouseEnter: 'onmouseenter',
    onMouseLeave: 'onmouseleave',
    onMouseMove: 'onmousemove',
    onMouseOut: 'onmouseout',
    onMouseOver: 'onmouseover',
    onMouseUp: 'onmouseup',
    onMouseWheel: 'onmousewheel',
    onOffline: 'onoffline',
    onOnline: 'ononline',
    onPageHide: 'onpagehide',
    onPageShow: 'onpageshow',
    onPaste: 'onpaste',
    onPause: 'onpause',
    onPlay: 'onplay',
    onPlaying: 'onplaying',
    onPopState: 'onpopstate',
    onProgress: 'onprogress',
    onRateChange: 'onratechange',
    onRepeat: 'onrepeat',
    onReset: 'onreset',
    onResize: 'onresize',
    onScroll: 'onscroll',
    onSeeked: 'onseeked',
    onSeeking: 'onseeking',
    onSelect: 'onselect',
    onShow: 'onshow',
    onStalled: 'onstalled',
    onStorage: 'onstorage',
    onSubmit: 'onsubmit',
    onSuspend: 'onsuspend',
    onTimeUpdate: 'ontimeupdate',
    onToggle: 'ontoggle',
    onUnload: 'onunload',
    onVolumeChange: 'onvolumechange',
    onWaiting: 'onwaiting',
    onZoom: 'onzoom',
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pointerEvents: 'pointer-events',
    referrerPolicy: 'referrerpolicy',
    renderingIntent: 'rendering-intent',
    shapeRendering: 'shape-rendering',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    strokeDashArray: 'stroke-dasharray',
    strokeDashOffset: 'stroke-dashoffset',
    strokeLineCap: 'stroke-linecap',
    strokeLineJoin: 'stroke-linejoin',
    strokeMiterLimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    tabIndex: 'tabindex',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    transformOrigin: 'transform-origin',
    typeOf: 'typeof',
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    vectorEffect: 'vector-effect',
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    xHeight: 'x-height',
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: 'playbackorder',
    timelineBegin: 'timelinebegin'
  },
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null, // SEMI_COLON_SEPARATED
    keySplines: null, // SEMI_COLON_SEPARATED
    keyTimes: null, // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    onAbort: null,
    onActivate: null,
    onAfterPrint: null,
    onBeforePrint: null,
    onBegin: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnd: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFocusIn: null,
    onFocusOut: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadStart: null,
    onMessage: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onMouseWheel: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRepeat: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onShow: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onZoom: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    ping: spaceSeparated,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    referrerPolicy: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    transformOrigin: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  },
  space: 'svg',
  transform: caseSensitiveTransform
});

const xlink = create({
  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  },
  space: 'xlink',
  transform(_, property) {
    return 'xlink:' + property.slice(5).toLowerCase()
  }
});

const xmlns = create({
  attributes: {xmlnsxlink: 'xmlns:xlink'},
  properties: {xmlnsXLink: null, xmlns: null},
  space: 'xmlns',
  transform: caseInsensitiveTransform
});

const xml = create({
  properties: {xmlBase: null, xmlLang: null, xmlSpace: null},
  space: 'xml',
  transform(_, property) {
    return 'xml:' + property.slice(3).toLowerCase()
  }
});

/**
 * @import {Schema} from 'property-information'
 */


const cap = /[A-Z]/g;
const dash = /-[a-z]/g;
const valid = /^data[-\w.:]+$/i;

/**
 * Look up info on a property.
 *
 * In most cases the given `schema` contains info on the property.
 * All standard,
 * most legacy,
 * and some non-standard properties are supported.
 * For these cases,
 * the returned `Info` has hints about the value of the property.
 *
 * `name` can also be a valid data attribute or property,
 * in which case an `Info` object with the correctly cased `attribute` and
 * `property` is returned.
 *
 * `name` can be an unknown attribute,
 * in which case an `Info` object with `attribute` and `property` set to the
 * given name is returned.
 * It is not recommended to provide unsupported legacy or recently specced
 * properties.
 *
 *
 * @param {Schema} schema
 *   Schema;
 *   either the `html` or `svg` export.
 * @param {string} value
 *   An attribute-like or property-like name;
 *   it will be passed through `normalize` to hopefully find the correct info.
 * @returns {Info}
 *   Info.
 */
function find(schema, value) {
  const normal = normalize(value);
  let property = value;
  let Type = Info;

  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]]
  }

  if (normal.length > 4 && normal.slice(0, 4) === 'data' && valid.test(value)) {
    // Attribute or property.
    if (value.charAt(4) === '-') {
      // Turn it into a property.
      const rest = value.slice(5).replace(dash, camelcase);
      property = 'data' + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      // Turn it into an attribute.
      const rest = value.slice(4);

      if (!dash.test(rest)) {
        let dashes = rest.replace(cap, kebab);

        if (dashes.charAt(0) !== '-') {
          dashes = '-' + dashes;
        }

        value = 'data' + dashes;
      }
    }

    Type = DefinedInfo;
  }

  return new Type(property, value)
}

/**
 * @param {string} $0
 *   Value.
 * @returns {string}
 *   Kebab.
 */
function kebab($0) {
  return '-' + $0.toLowerCase()
}

/**
 * @param {string} $0
 *   Value.
 * @returns {string}
 *   Camel.
 */
function camelcase($0) {
  return $0.charAt(1).toUpperCase()
}

// Note: types exposed from `index.d.ts`.

const html$2 = merge([aria, html$3, xlink, xmlns, xml], 'html');

const svg = merge([aria, svg$1, xlink, xmlns, xml], 'svg');

/**
 * @callback Handler
 *   Handle a value, with a certain ID field set to a certain value.
 *   The ID field is passed to `zwitch`, and it’s value is this function’s
 *   place on the `handlers` record.
 * @param {...any} parameters
 *   Arbitrary parameters passed to the zwitch.
 *   The first will be an object with a certain ID field set to a certain value.
 * @returns {any}
 *   Anything!
 */

/**
 * @callback UnknownHandler
 *   Handle values that do have a certain ID field, but it’s set to a value
 *   that is not listed in the `handlers` record.
 * @param {unknown} value
 *   An object with a certain ID field set to an unknown value.
 * @param {...any} rest
 *   Arbitrary parameters passed to the zwitch.
 * @returns {any}
 *   Anything!
 */

/**
 * @callback InvalidHandler
 *   Handle values that do not have a certain ID field.
 * @param {unknown} value
 *   Any unknown value.
 * @param {...any} rest
 *   Arbitrary parameters passed to the zwitch.
 * @returns {void|null|undefined|never}
 *   This should crash or return nothing.
 */

/**
 * @template {InvalidHandler} [Invalid=InvalidHandler]
 * @template {UnknownHandler} [Unknown=UnknownHandler]
 * @template {Record<string, Handler>} [Handlers=Record<string, Handler>]
 * @typedef Options
 *   Configuration (required).
 * @property {Invalid} [invalid]
 *   Handler to use for invalid values.
 * @property {Unknown} [unknown]
 *   Handler to use for unknown values.
 * @property {Handlers} [handlers]
 *   Handlers to use.
 */

const own$2 = {}.hasOwnProperty;

/**
 * Handle values based on a field.
 *
 * @template {InvalidHandler} [Invalid=InvalidHandler]
 * @template {UnknownHandler} [Unknown=UnknownHandler]
 * @template {Record<string, Handler>} [Handlers=Record<string, Handler>]
 * @param {string} key
 *   Field to switch on.
 * @param {Options<Invalid, Unknown, Handlers>} [options]
 *   Configuration (required).
 * @returns {{unknown: Unknown, invalid: Invalid, handlers: Handlers, (...parameters: Parameters<Handlers[keyof Handlers]>): ReturnType<Handlers[keyof Handlers]>, (...parameters: Parameters<Unknown>): ReturnType<Unknown>}}
 */
function zwitch(key, options) {
  const settings = options || {};

  /**
   * Handle one value.
   *
   * Based on the bound `key`, a respective handler will be called.
   * If `value` is not an object, or doesn’t have a `key` property, the special
   * “invalid” handler will be called.
   * If `value` has an unknown `key`, the special “unknown” handler will be
   * called.
   *
   * All arguments, and the context object, are passed through to the handler,
   * and it’s result is returned.
   *
   * @this {unknown}
   *   Any context object.
   * @param {unknown} [value]
   *   Any value.
   * @param {...unknown} parameters
   *   Arbitrary parameters passed to the zwitch.
   * @property {Handler} invalid
   *   Handle for values that do not have a certain ID field.
   * @property {Handler} unknown
   *   Handle values that do have a certain ID field, but it’s set to a value
   *   that is not listed in the `handlers` record.
   * @property {Handlers} handlers
   *   Record of handlers.
   * @returns {unknown}
   *   Anything.
   */
  function one(value, ...parameters) {
    /** @type {Handler|undefined} */
    let fn = one.invalid;
    const handlers = one.handlers;

    if (value && own$2.call(value, key)) {
      // @ts-expect-error Indexable.
      const id = String(value[key]);
      // @ts-expect-error Indexable.
      fn = own$2.call(handlers, id) ? handlers[id] : one.unknown;
    }

    if (fn) {
      return fn.call(this, value, ...parameters)
    }
  }

  one.handlers = settings.handlers || {};
  one.invalid = settings.invalid;
  one.unknown = settings.unknown;

  // @ts-expect-error: matches!
  return one
}

/**
 * @typedef CoreOptions
 * @property {ReadonlyArray<string>} [subset=[]]
 *   Whether to only escape the given subset of characters.
 * @property {boolean} [escapeOnly=false]
 *   Whether to only escape possibly dangerous characters.
 *   Those characters are `"`, `&`, `'`, `<`, `>`, and `` ` ``.
 *
 * @typedef FormatOptions
 * @property {(code: number, next: number, options: CoreWithFormatOptions) => string} format
 *   Format strategy.
 *
 * @typedef {CoreOptions & FormatOptions & import('./util/format-smart.js').FormatSmartOptions} CoreWithFormatOptions
 */

const defaultSubsetRegex = /["&'<>`]/g;
const surrogatePairsRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
const controlCharactersRegex =
  // eslint-disable-next-line no-control-regex, unicorn/no-hex-escape
  /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
const regexEscapeRegex = /[|\\{}()[\]^$+*?.]/g;

/** @type {WeakMap<ReadonlyArray<string>, RegExp>} */
const subsetToRegexCache = new WeakMap();

/**
 * Encode certain characters in `value`.
 *
 * @param {string} value
 * @param {CoreWithFormatOptions} options
 * @returns {string}
 */
function core(value, options) {
  value = value.replace(
    options.subset
      ? charactersToExpressionCached(options.subset)
      : defaultSubsetRegex,
    basic
  );

  if (options.subset || options.escapeOnly) {
    return value
  }

  return (
    value
      // Surrogate pairs.
      .replace(surrogatePairsRegex, surrogate)
      // BMP control characters (C0 except for LF, CR, SP; DEL; and some more
      // non-ASCII ones).
      .replace(controlCharactersRegex, basic)
  )

  /**
   * @param {string} pair
   * @param {number} index
   * @param {string} all
   */
  function surrogate(pair, index, all) {
    return options.format(
      (pair.charCodeAt(0) - 0xd800) * 0x400 +
        pair.charCodeAt(1) -
        0xdc00 +
        0x10000,
      all.charCodeAt(index + 2),
      options
    )
  }

  /**
   * @param {string} character
   * @param {number} index
   * @param {string} all
   */
  function basic(character, index, all) {
    return options.format(
      character.charCodeAt(0),
      all.charCodeAt(index + 1),
      options
    )
  }
}

/**
 * A wrapper function that caches the result of `charactersToExpression` with a WeakMap.
 * This can improve performance when tooling calls `charactersToExpression` repeatedly
 * with the same subset.
 *
 * @param {ReadonlyArray<string>} subset
 * @returns {RegExp}
 */
function charactersToExpressionCached(subset) {
  let cached = subsetToRegexCache.get(subset);

  if (!cached) {
    cached = charactersToExpression(subset);
    subsetToRegexCache.set(subset, cached);
  }

  return cached
}

/**
 * @param {ReadonlyArray<string>} subset
 * @returns {RegExp}
 */
function charactersToExpression(subset) {
  /** @type {Array<string>} */
  const groups = [];
  let index = -1;

  while (++index < subset.length) {
    groups.push(subset[index].replace(regexEscapeRegex, '\\$&'));
  }

  return new RegExp('(?:' + groups.join('|') + ')', 'g')
}

const hexadecimalRegex = /[\dA-Fa-f]/;

/**
 * Configurable ways to encode characters as hexadecimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toHexadecimal(code, next, omit) {
  const value = '&#x' + code.toString(16).toUpperCase();
  return omit && next && !hexadecimalRegex.test(String.fromCharCode(next))
    ? value
    : value + ';'
}

const decimalRegex = /\d/;

/**
 * Configurable ways to encode characters as decimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toDecimal(code, next, omit) {
  const value = '&#' + String(code);
  return omit && next && !decimalRegex.test(String.fromCharCode(next))
    ? value
    : value + ';'
}

/**
 * List of legacy HTML named character references that don’t need a trailing semicolon.
 *
 * @type {Array<string>}
 */
const characterEntitiesLegacy = [
  'AElig',
  'AMP',
  'Aacute',
  'Acirc',
  'Agrave',
  'Aring',
  'Atilde',
  'Auml',
  'COPY',
  'Ccedil',
  'ETH',
  'Eacute',
  'Ecirc',
  'Egrave',
  'Euml',
  'GT',
  'Iacute',
  'Icirc',
  'Igrave',
  'Iuml',
  'LT',
  'Ntilde',
  'Oacute',
  'Ocirc',
  'Ograve',
  'Oslash',
  'Otilde',
  'Ouml',
  'QUOT',
  'REG',
  'THORN',
  'Uacute',
  'Ucirc',
  'Ugrave',
  'Uuml',
  'Yacute',
  'aacute',
  'acirc',
  'acute',
  'aelig',
  'agrave',
  'amp',
  'aring',
  'atilde',
  'auml',
  'brvbar',
  'ccedil',
  'cedil',
  'cent',
  'copy',
  'curren',
  'deg',
  'divide',
  'eacute',
  'ecirc',
  'egrave',
  'eth',
  'euml',
  'frac12',
  'frac14',
  'frac34',
  'gt',
  'iacute',
  'icirc',
  'iexcl',
  'igrave',
  'iquest',
  'iuml',
  'laquo',
  'lt',
  'macr',
  'micro',
  'middot',
  'nbsp',
  'not',
  'ntilde',
  'oacute',
  'ocirc',
  'ograve',
  'ordf',
  'ordm',
  'oslash',
  'otilde',
  'ouml',
  'para',
  'plusmn',
  'pound',
  'quot',
  'raquo',
  'reg',
  'sect',
  'shy',
  'sup1',
  'sup2',
  'sup3',
  'szlig',
  'thorn',
  'times',
  'uacute',
  'ucirc',
  'ugrave',
  'uml',
  'uuml',
  'yacute',
  'yen',
  'yuml'
];

/**
 * Map of named character references from HTML 4.
 *
 * @type {Record<string, string>}
 */
const characterEntitiesHtml4 = {
  nbsp: ' ',
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '­',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  sup1: '¹',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  ETH: 'Ð',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  times: '×',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
  THORN: 'Þ',
  szlig: 'ß',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  eth: 'ð',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  divide: '÷',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  thorn: 'þ',
  yuml: 'ÿ',
  fnof: 'ƒ',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigmaf: 'ς',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  thetasym: 'ϑ',
  upsih: 'ϒ',
  piv: 'ϖ',
  bull: '•',
  hellip: '…',
  prime: '′',
  Prime: '″',
  oline: '‾',
  frasl: '⁄',
  weierp: '℘',
  image: 'ℑ',
  real: 'ℜ',
  trade: '™',
  alefsym: 'ℵ',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  crarr: '↵',
  lArr: '⇐',
  uArr: '⇑',
  rArr: '⇒',
  dArr: '⇓',
  hArr: '⇔',
  forall: '∀',
  part: '∂',
  exist: '∃',
  empty: '∅',
  nabla: '∇',
  isin: '∈',
  notin: '∉',
  ni: '∋',
  prod: '∏',
  sum: '∑',
  minus: '−',
  lowast: '∗',
  radic: '√',
  prop: '∝',
  infin: '∞',
  ang: '∠',
  and: '∧',
  or: '∨',
  cap: '∩',
  cup: '∪',
  int: '∫',
  there4: '∴',
  sim: '∼',
  cong: '≅',
  asymp: '≈',
  ne: '≠',
  equiv: '≡',
  le: '≤',
  ge: '≥',
  sub: '⊂',
  sup: '⊃',
  nsub: '⊄',
  sube: '⊆',
  supe: '⊇',
  oplus: '⊕',
  otimes: '⊗',
  perp: '⊥',
  sdot: '⋅',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',
  lang: '〈',
  rang: '〉',
  loz: '◊',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  OElig: 'Œ',
  oelig: 'œ',
  Scaron: 'Š',
  scaron: 'š',
  Yuml: 'Ÿ',
  circ: 'ˆ',
  tilde: '˜',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  zwnj: '‌',
  zwj: '‍',
  lrm: '‎',
  rlm: '‏',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  dagger: '†',
  Dagger: '‡',
  permil: '‰',
  lsaquo: '‹',
  rsaquo: '›',
  euro: '€'
};

/**
 * List of legacy (that don’t need a trailing `;`) named references which could,
 * depending on what follows them, turn into a different meaning
 *
 * @type {Array<string>}
 */
const dangerous = [
  'cent',
  'copy',
  'divide',
  'gt',
  'lt',
  'not',
  'para',
  'times'
];

const own$1 = {}.hasOwnProperty;

/**
 * `characterEntitiesHtml4` but inverted.
 *
 * @type {Record<string, string>}
 */
const characters = {};

/** @type {string} */
let key;

for (key in characterEntitiesHtml4) {
  if (own$1.call(characterEntitiesHtml4, key)) {
    characters[characterEntitiesHtml4[key]] = key;
  }
}

const notAlphanumericRegex = /[^\dA-Za-z]/;

/**
 * Configurable ways to encode characters as named references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @param {boolean|undefined} attribute
 * @returns {string}
 */
function toNamed(code, next, omit, attribute) {
  const character = String.fromCharCode(code);

  if (own$1.call(characters, character)) {
    const name = characters[character];
    const value = '&' + name;

    if (
      omit &&
      characterEntitiesLegacy.includes(name) &&
      !dangerous.includes(name) &&
      (!attribute ||
        (next &&
          next !== 61 /* `=` */ &&
          notAlphanumericRegex.test(String.fromCharCode(next))))
    ) {
      return value
    }

    return value + ';'
  }

  return ''
}

/**
 * @typedef FormatSmartOptions
 * @property {boolean} [useNamedReferences=false]
 *   Prefer named character references (`&amp;`) where possible.
 * @property {boolean} [useShortestReferences=false]
 *   Prefer the shortest possible reference, if that results in less bytes.
 *   **Note**: `useNamedReferences` can be omitted when using `useShortestReferences`.
 * @property {boolean} [omitOptionalSemicolons=false]
 *   Whether to omit semicolons when possible.
 *   **Note**: This creates what HTML calls “parse errors” but is otherwise still valid HTML — don’t use this except when building a minifier.
 *   Omitting semicolons is possible for certain named and numeric references in some cases.
 * @property {boolean} [attribute=false]
 *   Create character references which don’t fail in attributes.
 *   **Note**: `attribute` only applies when operating dangerously with
 *   `omitOptionalSemicolons: true`.
 */


/**
 * Configurable ways to encode a character yielding pretty or small results.
 *
 * @param {number} code
 * @param {number} next
 * @param {FormatSmartOptions} options
 * @returns {string}
 */
function formatSmart(code, next, options) {
  let numeric = toHexadecimal(code, next, options.omitOptionalSemicolons);
  /** @type {string|undefined} */
  let named;

  if (options.useNamedReferences || options.useShortestReferences) {
    named = toNamed(
      code,
      next,
      options.omitOptionalSemicolons,
      options.attribute
    );
  }

  // Use the shortest numeric reference when requested.
  // A simple algorithm would use decimal for all code points under 100, as
  // those are shorter than hexadecimal:
  //
  // * `&#99;` vs `&#x63;` (decimal shorter)
  // * `&#100;` vs `&#x64;` (equal)
  //
  // However, because we take `next` into consideration when `omit` is used,
  // And it would be possible that decimals are shorter on bigger values as
  // well if `next` is hexadecimal but not decimal, we instead compare both.
  if (
    (options.useShortestReferences || !named) &&
    options.useShortestReferences
  ) {
    const decimal = toDecimal(code, next, options.omitOptionalSemicolons);

    if (decimal.length < numeric.length) {
      numeric = decimal;
    }
  }

  return named &&
    (!options.useShortestReferences || named.length < numeric.length)
    ? named
    : numeric
}

/**
 * @typedef {import('./core.js').CoreOptions & import('./util/format-smart.js').FormatSmartOptions} Options
 * @typedef {import('./core.js').CoreOptions} LightOptions
 */


/**
 * Encode special characters in `value`.
 *
 * @param {string} value
 *   Value to encode.
 * @param {Options} [options]
 *   Configuration.
 * @returns {string}
 *   Encoded value.
 */
function stringifyEntities(value, options) {
  return core(value, Object.assign({format: formatSmart}, options))
}

/**
 * @import {Comment, Parents} from 'hast'
 * @import {State} from '../index.js'
 */


const htmlCommentRegex = /^>|^->|<!--|-->|--!>|<!-$/g;

// Declare arrays as variables so it can be cached by `stringifyEntities`
const bogusCommentEntitySubset = ['>'];
const commentEntitySubset = ['<', '>'];

/**
 * Serialize a comment.
 *
 * @param {Comment} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function comment(node, _1, _2, state) {
  // See: <https://html.spec.whatwg.org/multipage/syntax.html#comments>
  return state.settings.bogusComments
    ? '<?' +
        stringifyEntities(
          node.value,
          Object.assign({}, state.settings.characterReferences, {
            subset: bogusCommentEntitySubset
          })
        ) +
        '>'
    : '<!--' + node.value.replace(htmlCommentRegex, encode) + '-->'

  /**
   * @param {string} $0
   */
  function encode($0) {
    return stringifyEntities(
      $0,
      Object.assign({}, state.settings.characterReferences, {
        subset: commentEntitySubset
      })
    )
  }
}

/**
 * @import {Doctype, Parents} from 'hast'
 * @import {State} from '../index.js'
 */

/**
 * Serialize a doctype.
 *
 * @param {Doctype} _1
 *   Node to handle.
 * @param {number | undefined} _2
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _3
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function doctype(_1, _2, _3, state) {
  return (
    '<!' +
    (state.settings.upperDoctype ? 'DOCTYPE' : 'doctype') +
    (state.settings.tightDoctype ? '' : ' ') +
    'html>'
  )
}

/**
 * Count how often a character (or substring) is used in a string.
 *
 * @param {string} value
 *   Value to search in.
 * @param {string} character
 *   Character (or substring) to look for.
 * @return {number}
 *   Number of times `character` occurred in `value`.
 */
function ccount(value, character) {
  const source = String(value);

  if (typeof character !== 'string') {
    throw new TypeError('Expected character')
  }

  let count = 0;
  let index = source.indexOf(character);

  while (index !== -1) {
    count++;
    index = source.indexOf(character, index + character.length);
  }

  return count
}

/**
 * @typedef Options
 *   Configuration for `stringify`.
 * @property {boolean} [padLeft=true]
 *   Whether to pad a space before a token.
 * @property {boolean} [padRight=false]
 *   Whether to pad a space after a token.
 */


/**
 * Serialize an array of strings or numbers to comma-separated tokens.
 *
 * @param {Array<string|number>} values
 *   List of tokens.
 * @param {Options} [options]
 *   Configuration for `stringify` (optional).
 * @returns {string}
 *   Comma-separated tokens.
 */
function stringify$2(values, options) {
  const settings = options || {};

  // Ensure the last empty entry is seen.
  const input = values[values.length - 1] === '' ? [...values, ''] : values;

  return input
    .join(
      (settings.padRight ? ' ' : '') +
        ',' +
        (settings.padLeft === false ? '' : ' ')
    )
    .trim()
}

/**
 * Parse space-separated tokens to an array of strings.
 *
 * @param {string} value
 *   Space-separated tokens.
 * @returns {Array<string>}
 *   List of tokens.
 */

/**
 * Serialize an array of strings as space separated-tokens.
 *
 * @param {Array<string|number>} values
 *   List of tokens.
 * @returns {string}
 *   Space-separated tokens.
 */
function stringify$1(values) {
  return values.join(' ').trim()
}

/**
 * @typedef {import('hast').Nodes} Nodes
 */

// HTML whitespace expression.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const re$1 = /[ \t\n\f\r]/g;

/**
 * Check if the given value is *inter-element whitespace*.
 *
 * @param {Nodes | string} thing
 *   Thing to check (`Node` or `string`).
 * @returns {boolean}
 *   Whether the `value` is inter-element whitespace (`boolean`): consisting of
 *   zero or more of space, tab (`\t`), line feed (`\n`), carriage return
 *   (`\r`), or form feed (`\f`); if a node is passed it must be a `Text` node,
 *   whose `value` field is checked.
 */
function whitespace(thing) {
  return typeof thing === 'object'
    ? thing.type === 'text'
      ? empty(thing.value)
      : false
    : empty(thing)
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function empty(value) {
  return value.replace(re$1, '') === ''
}

/**
 * @import {Parents, RootContent} from 'hast'
 */


const siblingAfter = siblings(1);
const siblingBefore = siblings(-1);

/** @type {Array<RootContent>} */
const emptyChildren$1 = [];

/**
 * Factory to check siblings in a direction.
 *
 * @param {number} increment
 */
function siblings(increment) {
  return sibling

  /**
   * Find applicable siblings in a direction.
   *
   * @template {Parents} Parent
   *   Parent type.
   * @param {Parent | undefined} parent
   *   Parent.
   * @param {number | undefined} index
   *   Index of child in `parent`.
   * @param {boolean | undefined} [includeWhitespace=false]
   *   Whether to include whitespace (default: `false`).
   * @returns {Parent extends {children: Array<infer Child>} ? Child | undefined : never}
   *   Child of parent.
   */
  function sibling(parent, index, includeWhitespace) {
    const siblings = parent ? parent.children : emptyChildren$1;
    let offset = (index || 0) + increment;
    let next = siblings[offset];

    if (!includeWhitespace) {
      while (next && whitespace(next)) {
        offset += increment;
        next = siblings[offset];
      }
    }

    // @ts-expect-error: it’s a correct child.
    return next
  }
}

/**
 * @import {Element, Parents} from 'hast'
 */

/**
 * @callback OmitHandle
 *   Check if a tag can be omitted.
 * @param {Element} element
 *   Element to check.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether to omit a tag.
 *
 */

const own = {}.hasOwnProperty;

/**
 * Factory to check if a given node can have a tag omitted.
 *
 * @param {Record<string, OmitHandle>} handlers
 *   Omission handlers, where each key is a tag name, and each value is the
 *   corresponding handler.
 * @returns {OmitHandle}
 *   Whether to omit a tag of an element.
 */
function omission(handlers) {
  return omit

  /**
   * Check if a given node can have a tag omitted.
   *
   * @type {OmitHandle}
   */
  function omit(node, index, parent) {
    return (
      own.call(handlers, node.tagName) &&
      handlers[node.tagName](node, index, parent)
    )
  }
}

/**
 * @import {Element, Parents} from 'hast'
 */


const closing = omission({
  body: body$1,
  caption: headOrColgroupOrCaption,
  colgroup: headOrColgroupOrCaption,
  dd,
  dt,
  head: headOrColgroupOrCaption,
  html: html$1,
  li,
  optgroup,
  option,
  p,
  rp: rubyElement,
  rt: rubyElement,
  tbody: tbody$1,
  td: cells,
  tfoot,
  th: cells,
  thead,
  tr
});

/**
 * Macro for `</head>`, `</colgroup>`, and `</caption>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function headOrColgroupOrCaption(_, index, parent) {
  const next = siblingAfter(parent, index, true);
  return (
    !next ||
    (next.type !== 'comment' &&
      !(next.type === 'text' && whitespace(next.value.charAt(0))))
  )
}

/**
 * Whether to omit `</html>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function html$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || next.type !== 'comment'
}

/**
 * Whether to omit `</body>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function body$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || next.type !== 'comment'
}

/**
 * Whether to omit `</p>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function p(_, index, parent) {
  const next = siblingAfter(parent, index);
  return next
    ? next.type === 'element' &&
        (next.tagName === 'address' ||
          next.tagName === 'article' ||
          next.tagName === 'aside' ||
          next.tagName === 'blockquote' ||
          next.tagName === 'details' ||
          next.tagName === 'div' ||
          next.tagName === 'dl' ||
          next.tagName === 'fieldset' ||
          next.tagName === 'figcaption' ||
          next.tagName === 'figure' ||
          next.tagName === 'footer' ||
          next.tagName === 'form' ||
          next.tagName === 'h1' ||
          next.tagName === 'h2' ||
          next.tagName === 'h3' ||
          next.tagName === 'h4' ||
          next.tagName === 'h5' ||
          next.tagName === 'h6' ||
          next.tagName === 'header' ||
          next.tagName === 'hgroup' ||
          next.tagName === 'hr' ||
          next.tagName === 'main' ||
          next.tagName === 'menu' ||
          next.tagName === 'nav' ||
          next.tagName === 'ol' ||
          next.tagName === 'p' ||
          next.tagName === 'pre' ||
          next.tagName === 'section' ||
          next.tagName === 'table' ||
          next.tagName === 'ul')
    : !parent ||
        // Confusing parent.
        !(
          parent.type === 'element' &&
          (parent.tagName === 'a' ||
            parent.tagName === 'audio' ||
            parent.tagName === 'del' ||
            parent.tagName === 'ins' ||
            parent.tagName === 'map' ||
            parent.tagName === 'noscript' ||
            parent.tagName === 'video')
        )
}

/**
 * Whether to omit `</li>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function li(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'li')
}

/**
 * Whether to omit `</dt>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function dt(_, index, parent) {
  const next = siblingAfter(parent, index);
  return Boolean(
    next &&
      next.type === 'element' &&
      (next.tagName === 'dt' || next.tagName === 'dd')
  )
}

/**
 * Whether to omit `</dd>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function dd(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'dt' || next.tagName === 'dd'))
  )
}

/**
 * Whether to omit `</rt>` or `</rp>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function rubyElement(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'rp' || next.tagName === 'rt'))
  )
}

/**
 * Whether to omit `</optgroup>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function optgroup(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'optgroup')
}

/**
 * Whether to omit `</option>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function option(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'option' || next.tagName === 'optgroup'))
  )
}

/**
 * Whether to omit `</thead>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function thead(_, index, parent) {
  const next = siblingAfter(parent, index);
  return Boolean(
    next &&
      next.type === 'element' &&
      (next.tagName === 'tbody' || next.tagName === 'tfoot')
  )
}

/**
 * Whether to omit `</tbody>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tbody$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'tbody' || next.tagName === 'tfoot'))
  )
}

/**
 * Whether to omit `</tfoot>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tfoot(_, index, parent) {
  return !siblingAfter(parent, index)
}

/**
 * Whether to omit `</tr>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tr(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'tr')
}

/**
 * Whether to omit `</td>` or `</th>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function cells(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'td' || next.tagName === 'th'))
  )
}

/**
 * @import {Element, Parents} from 'hast'
 */


const opening = omission({
  body,
  colgroup,
  head,
  html,
  tbody
});

/**
 * Whether to omit `<html>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function html(node) {
  const head = siblingAfter(node, -1);
  return !head || head.type !== 'comment'
}

/**
 * Whether to omit `<head>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function head(node) {
  /** @type {Set<string>} */
  const seen = new Set();

  // Whether `srcdoc` or not,
  // make sure the content model at least doesn’t have too many `base`s/`title`s.
  for (const child of node.children) {
    if (
      child.type === 'element' &&
      (child.tagName === 'base' || child.tagName === 'title')
    ) {
      if (seen.has(child.tagName)) return false
      seen.add(child.tagName);
    }
  }

  // “May be omitted if the element is empty,
  // or if the first thing inside the head element is an element.”
  const child = node.children[0];
  return !child || child.type === 'element'
}

/**
 * Whether to omit `<body>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function body(node) {
  const head = siblingAfter(node, -1, true);

  return (
    !head ||
    (head.type !== 'comment' &&
      !(head.type === 'text' && whitespace(head.value.charAt(0))) &&
      !(
        head.type === 'element' &&
        (head.tagName === 'meta' ||
          head.tagName === 'link' ||
          head.tagName === 'script' ||
          head.tagName === 'style' ||
          head.tagName === 'template')
      ))
  )
}

/**
 * Whether to omit `<colgroup>`.
 * The spec describes some logic for the opening tag, but it’s easier to
 * implement in the closing tag, to the same effect, so we handle it there
 * instead.
 *
 * @param {Element} node
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function colgroup(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1, true);

  // Previous colgroup was already omitted.
  if (
    parent &&
    previous &&
    previous.type === 'element' &&
    previous.tagName === 'colgroup' &&
    closing(previous, parent.children.indexOf(previous), parent)
  ) {
    return false
  }

  return Boolean(head && head.type === 'element' && head.tagName === 'col')
}

/**
 * Whether to omit `<tbody>`.
 *
 * @param {Element} node
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function tbody(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1);

  // Previous table section was already omitted.
  if (
    parent &&
    previous &&
    previous.type === 'element' &&
    (previous.tagName === 'thead' || previous.tagName === 'tbody') &&
    closing(previous, parent.children.indexOf(previous), parent)
  ) {
    return false
  }

  return Boolean(head && head.type === 'element' && head.tagName === 'tr')
}

/**
 * @import {Element, Parents, Properties} from 'hast'
 * @import {State} from '../index.js'
 */


/**
 * Maps of subsets.
 *
 * Each value is a matrix of tuples.
 * The value at `0` causes parse errors, the value at `1` is valid.
 * Of both, the value at `0` is unsafe, and the value at `1` is safe.
 *
 * @type {Record<'double' | 'name' | 'single' | 'unquoted', Array<[Array<string>, Array<string>]>>}
 */
const constants = {
  // See: <https://html.spec.whatwg.org/#attribute-name-state>.
  name: [
    ['\t\n\f\r &/=>'.split(''), '\t\n\f\r "&\'/=>`'.split('')],
    ['\0\t\n\f\r "&\'/<=>'.split(''), '\0\t\n\f\r "&\'/<=>`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(unquoted)-state>.
  unquoted: [
    ['\t\n\f\r &>'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')],
    ['\0\t\n\f\r "&\'<=>`'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(single-quoted)-state>.
  single: [
    ["&'".split(''), '"&\'`'.split('')],
    ["\0&'".split(''), '\0"&\'`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(double-quoted)-state>.
  double: [
    ['"&'.split(''), '"&\'`'.split('')],
    ['\0"&'.split(''), '\0"&\'`'.split('')]
  ]
};

/**
 * Serialize an element node.
 *
 * @param {Element} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function element(node, index, parent, state) {
  const schema = state.schema;
  const omit = schema.space === 'svg' ? false : state.settings.omitOptionalTags;
  let selfClosing =
    schema.space === 'svg'
      ? state.settings.closeEmptyElements
      : state.settings.voids.includes(node.tagName.toLowerCase());
  /** @type {Array<string>} */
  const parts = [];
  /** @type {string} */
  let last;

  if (schema.space === 'html' && node.tagName === 'svg') {
    state.schema = svg;
  }

  const attributes = serializeAttributes(state, node.properties);

  const content = state.all(
    schema.space === 'html' && node.tagName === 'template' ? node.content : node
  );

  state.schema = schema;

  // If the node is categorised as void, but it has children, remove the
  // categorisation.
  // This enables for example `menuitem`s, which are void in W3C HTML but not
  // void in WHATWG HTML, to be stringified properly.
  // Note: `menuitem` has since been removed from the HTML spec, and so is no
  // longer void.
  if (content) selfClosing = false;

  if (attributes || !omit || !opening(node, index, parent)) {
    parts.push('<', node.tagName, attributes ? ' ' + attributes : '');

    if (
      selfClosing &&
      (schema.space === 'svg' || state.settings.closeSelfClosing)
    ) {
      last = attributes.charAt(attributes.length - 1);
      if (
        !state.settings.tightSelfClosing ||
        last === '/' ||
        (last && last !== '"' && last !== "'")
      ) {
        parts.push(' ');
      }

      parts.push('/');
    }

    parts.push('>');
  }

  parts.push(content);

  if (!selfClosing && (!omit || !closing(node, index, parent))) {
    parts.push('</' + node.tagName + '>');
  }

  return parts.join('')
}

/**
 * @param {State} state
 * @param {Properties | null | undefined} properties
 * @returns {string}
 */
function serializeAttributes(state, properties) {
  /** @type {Array<string>} */
  const values = [];
  let index = -1;
  /** @type {string} */
  let key;

  if (properties) {
    for (key in properties) {
      if (properties[key] !== null && properties[key] !== undefined) {
        const value = serializeAttribute(state, key, properties[key]);
        if (value) values.push(value);
      }
    }
  }

  while (++index < values.length) {
    const last = state.settings.tightAttributes
      ? values[index].charAt(values[index].length - 1)
      : undefined;

    // In tight mode, don’t add a space after quoted attributes.
    if (index !== values.length - 1 && last !== '"' && last !== "'") {
      values[index] += ' ';
    }
  }

  return values.join('')
}

/**
 * @param {State} state
 * @param {string} key
 * @param {Properties[keyof Properties]} value
 * @returns {string}
 */
function serializeAttribute(state, key, value) {
  const info = find(state.schema, key);
  const x =
    state.settings.allowParseErrors && state.schema.space === 'html' ? 0 : 1;
  const y = state.settings.allowDangerousCharacters ? 0 : 1;
  let quote = state.quote;
  /** @type {string | undefined} */
  let result;

  if (info.overloadedBoolean && (value === info.attribute || value === '')) {
    value = true;
  } else if (
    (info.boolean || info.overloadedBoolean) &&
    (typeof value !== 'string' || value === info.attribute || value === '')
  ) {
    value = Boolean(value);
  }

  if (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'number' && Number.isNaN(value))
  ) {
    return ''
  }

  const name = stringifyEntities(
    info.attribute,
    Object.assign({}, state.settings.characterReferences, {
      // Always encode without parse errors in non-HTML.
      subset: constants.name[x][y]
    })
  );

  // No value.
  // There is currently only one boolean property in SVG: `[download]` on
  // `<a>`.
  // This property does not seem to work in browsers (Firefox, Safari, Chrome),
  // so I can’t test if dropping the value works.
  // But I assume that it should:
  //
  // ```html
  // <!doctype html>
  // <svg viewBox="0 0 100 100">
  //   <a href=https://example.com download>
  //     <circle cx=50 cy=40 r=35 />
  //   </a>
  // </svg>
  // ```
  //
  // See: <https://github.com/wooorm/property-information/blob/main/lib/svg.js>
  if (value === true) return name

  // `spaces` doesn’t accept a second argument, but it’s given here just to
  // keep the code cleaner.
  value = Array.isArray(value)
    ? (info.commaSeparated ? stringify$2 : stringify$1)(value, {
        padLeft: !state.settings.tightCommaSeparatedLists
      })
    : String(value);

  if (state.settings.collapseEmptyAttributes && !value) return name

  // Check unquoted value.
  if (state.settings.preferUnquoted) {
    result = stringifyEntities(
      value,
      Object.assign({}, state.settings.characterReferences, {
        attribute: true,
        subset: constants.unquoted[x][y]
      })
    );
  }

  // If we don’t want unquoted, or if `value` contains character references when
  // unquoted…
  if (result !== value) {
    // If the alternative is less common than `quote`, switch.
    if (
      state.settings.quoteSmart &&
      ccount(value, quote) > ccount(value, state.alternative)
    ) {
      quote = state.alternative;
    }

    result =
      quote +
      stringifyEntities(
        value,
        Object.assign({}, state.settings.characterReferences, {
          // Always encode without parse errors in non-HTML.
          subset: (quote === "'" ? constants.single : constants.double)[x][y],
          attribute: true
        })
      ) +
      quote;
  }

  // Don’t add a `=` for unquoted empties.
  return name + (result ? '=' + result : result)
}

/**
 * @import {Parents, Text} from 'hast'
 * @import {Raw} from 'mdast-util-to-hast'
 * @import {State} from '../index.js'
 */


// Declare array as variable so it can be cached by `stringifyEntities`
const textEntitySubset = ['<', '&'];

/**
 * Serialize a text node.
 *
 * @param {Raw | Text} node
 *   Node to handle.
 * @param {number | undefined} _
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function text(node, _, parent, state) {
  // Check if content of `node` should be escaped.
  return parent &&
    parent.type === 'element' &&
    (parent.tagName === 'script' || parent.tagName === 'style')
    ? node.value
    : stringifyEntities(
        node.value,
        Object.assign({}, state.settings.characterReferences, {
          subset: textEntitySubset
        })
      )
}

/**
 * @import {Parents} from 'hast'
 * @import {Raw} from 'mdast-util-to-hast'
 * @import {State} from '../index.js'
 */


/**
 * Serialize a raw node.
 *
 * @param {Raw} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function raw(node, index, parent, state) {
  return state.settings.allowDangerousHtml
    ? node.value
    : text(node, index, parent, state)
}

/**
 * @import {Parents, Root} from 'hast'
 * @import {State} from '../index.js'
 */

/**
 * Serialize a root.
 *
 * @param {Root} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function root(node, _1, _2, state) {
  return state.all(node)
}

/**
 * @import {Nodes, Parents} from 'hast'
 * @import {State} from '../index.js'
 */


/**
 * @type {(node: Nodes, index: number | undefined, parent: Parents | undefined, state: State) => string}
 */
const handle = zwitch('type', {
  invalid,
  unknown,
  handlers: {comment, doctype, element, raw, root, text}
});

/**
 * Fail when a non-node is found in the tree.
 *
 * @param {unknown} node
 *   Unknown value.
 * @returns {never}
 *   Never.
 */
function invalid(node) {
  throw new Error('Expected node, not `' + node + '`')
}

/**
 * Fail when a node with an unknown type is found in the tree.
 *
 * @param {unknown} node_
 *  Unknown node.
 * @returns {never}
 *   Never.
 */
function unknown(node_) {
  // `type` is guaranteed by runtime JS.
  const node = /** @type {Nodes} */ (node_);
  throw new Error('Cannot compile unknown node `' + node.type + '`')
}

/**
 * @import {Nodes, Parents, RootContent} from 'hast'
 * @import {Schema} from 'property-information'
 * @import {Options as StringifyEntitiesOptions} from 'stringify-entities'
 */


/** @type {Options} */
const emptyOptions = {};

/** @type {CharacterReferences} */
const emptyCharacterReferences = {};

/** @type {Array<never>} */
const emptyChildren = [];

/**
 * Serialize hast as HTML.
 *
 * @param {Array<RootContent> | Nodes} tree
 *   Tree to serialize.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Serialized HTML.
 */
function toHtml(tree, options) {
  const options_ = options || emptyOptions;
  const quote = options_.quote || '"';
  const alternative = quote === '"' ? "'" : '"';

  if (quote !== '"' && quote !== "'") {
    throw new Error('Invalid quote `' + quote + '`, expected `\'` or `"`')
  }

  /** @type {State} */
  const state = {
    one,
    all,
    settings: {
      omitOptionalTags: options_.omitOptionalTags || false,
      allowParseErrors: options_.allowParseErrors || false,
      allowDangerousCharacters: options_.allowDangerousCharacters || false,
      quoteSmart: options_.quoteSmart || false,
      preferUnquoted: options_.preferUnquoted || false,
      tightAttributes: options_.tightAttributes || false,
      upperDoctype: options_.upperDoctype || false,
      tightDoctype: options_.tightDoctype || false,
      bogusComments: options_.bogusComments || false,
      tightCommaSeparatedLists: options_.tightCommaSeparatedLists || false,
      tightSelfClosing: options_.tightSelfClosing || false,
      collapseEmptyAttributes: options_.collapseEmptyAttributes || false,
      allowDangerousHtml: options_.allowDangerousHtml || false,
      voids: options_.voids || htmlVoidElements,
      characterReferences:
        options_.characterReferences || emptyCharacterReferences,
      closeSelfClosing: options_.closeSelfClosing || false,
      closeEmptyElements: options_.closeEmptyElements || false
    },
    schema: options_.space === 'svg' ? svg : html$2,
    quote,
    alternative
  };

  return state.one(
    Array.isArray(tree) ? {type: 'root', children: tree} : tree,
    undefined,
    undefined
  )
}

/**
 * Serialize a node.
 *
 * @this {State}
 *   Info passed around about the current state.
 * @param {Nodes} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {string}
 *   Serialized node.
 */
function one(node, index, parent) {
  return handle(node, index, parent, this)
}

/**
 * Serialize all children of `parent`.
 *
 * @this {State}
 *   Info passed around about the current state.
 * @param {Parents | undefined} parent
 *   Parent whose children to serialize.
 * @returns {string}
 */
function all(parent) {
  /** @type {Array<string>} */
  const results = [];
  const children = (parent && parent.children) || emptyChildren;
  let index = -1;

  while (++index < children.length) {
    results[index] = this.one(children[index], index, parent);
  }

  return results.join('')
}

function resolveColorReplacements(theme, options) {
  const replacements = typeof theme === "string" ? {} : { ...theme.colorReplacements };
  const themeName = typeof theme === "string" ? theme : theme.name;
  for (const [key, value] of Object.entries(options?.colorReplacements || {})) {
    if (typeof value === "string")
      replacements[key] = value;
    else if (key === themeName)
      Object.assign(replacements, value);
  }
  return replacements;
}
function applyColorReplacements(color, replacements) {
  if (!color)
    return color;
  return replacements?.[color?.toLowerCase()] || color;
}

function toArray(x) {
  return Array.isArray(x) ? x : [x];
}
async function normalizeGetter(p) {
  return Promise.resolve(typeof p === "function" ? p() : p).then((r) => r.default || r);
}
function isPlainLang(lang) {
  return !lang || ["plaintext", "txt", "text", "plain"].includes(lang);
}
function isSpecialLang(lang) {
  return lang === "ansi" || isPlainLang(lang);
}
function isNoneTheme(theme) {
  return theme === "none";
}
function isSpecialTheme(theme) {
  return isNoneTheme(theme);
}

function addClassToHast(node, className) {
  if (!className)
    return node;
  node.properties ||= {};
  node.properties.class ||= [];
  if (typeof node.properties.class === "string")
    node.properties.class = node.properties.class.split(/\s+/g);
  if (!Array.isArray(node.properties.class))
    node.properties.class = [];
  const targets = Array.isArray(className) ? className : className.split(/\s+/g);
  for (const c of targets) {
    if (c && !node.properties.class.includes(c))
      node.properties.class.push(c);
  }
  return node;
}

function splitLines(code, preserveEnding = false) {
  const parts = code.split(/(\r?\n)/g);
  let index = 0;
  const lines = [];
  for (let i = 0; i < parts.length; i += 2) {
    const line = preserveEnding ? parts[i] + (parts[i + 1] || "") : parts[i];
    lines.push([line, index]);
    index += parts[i].length;
    index += parts[i + 1]?.length || 0;
  }
  return lines;
}
function createPositionConverter(code) {
  const lines = splitLines(code, true).map(([line]) => line);
  function indexToPos(index) {
    if (index === code.length) {
      return {
        line: lines.length - 1,
        character: lines[lines.length - 1].length
      };
    }
    let character = index;
    let line = 0;
    for (const lineText of lines) {
      if (character < lineText.length)
        break;
      character -= lineText.length;
      line++;
    }
    return { line, character };
  }
  function posToIndex(line, character) {
    let index = 0;
    for (let i = 0; i < line; i++)
      index += lines[i].length;
    index += character;
    return index;
  }
  return {
    lines,
    indexToPos,
    posToIndex
  };
}

function splitToken(token, offsets) {
  let lastOffset = 0;
  const tokens = [];
  for (const offset of offsets) {
    if (offset > lastOffset) {
      tokens.push({
        ...token,
        content: token.content.slice(lastOffset, offset),
        offset: token.offset + lastOffset
      });
    }
    lastOffset = offset;
  }
  if (lastOffset < token.content.length) {
    tokens.push({
      ...token,
      content: token.content.slice(lastOffset),
      offset: token.offset + lastOffset
    });
  }
  return tokens;
}
function splitTokens(tokens, breakpoints) {
  const sorted = Array.from(breakpoints instanceof Set ? breakpoints : new Set(breakpoints)).sort((a, b) => a - b);
  if (!sorted.length)
    return tokens;
  return tokens.map((line) => {
    return line.flatMap((token) => {
      const breakpointsInToken = sorted.filter((i) => token.offset < i && i < token.offset + token.content.length).map((i) => i - token.offset).sort((a, b) => a - b);
      if (!breakpointsInToken.length)
        return token;
      return splitToken(token, breakpointsInToken);
    });
  });
}
function flatTokenVariants(merged, variantsOrder, cssVariablePrefix, defaultColor) {
  const token = {
    content: merged.content,
    explanation: merged.explanation,
    offset: merged.offset
  };
  const styles = variantsOrder.map((t) => getTokenStyleObject(merged.variants[t]));
  const styleKeys = new Set(styles.flatMap((t) => Object.keys(t)));
  const mergedStyles = {};
  styles.forEach((cur, idx) => {
    for (const key of styleKeys) {
      const value = cur[key] || "inherit";
      if (idx === 0 && defaultColor) {
        mergedStyles[key] = value;
      } else {
        const keyName = key === "color" ? "" : key === "background-color" ? "-bg" : `-${key}`;
        const varKey = cssVariablePrefix + variantsOrder[idx] + (key === "color" ? "" : keyName);
        mergedStyles[varKey] = value;
      }
    }
  });
  token.htmlStyle = mergedStyles;
  return token;
}
function getTokenStyleObject(token) {
  const styles = {};
  if (token.color)
    styles.color = token.color;
  if (token.bgColor)
    styles["background-color"] = token.bgColor;
  if (token.fontStyle) {
    if (token.fontStyle & FontStyle.Italic)
      styles["font-style"] = "italic";
    if (token.fontStyle & FontStyle.Bold)
      styles["font-weight"] = "bold";
    const decorations = [];
    if (token.fontStyle & FontStyle.Underline)
      decorations.push("underline");
    if (token.fontStyle & FontStyle.Strikethrough)
      decorations.push("line-through");
    if (decorations.length)
      styles["text-decoration"] = decorations.join(" ");
  }
  return styles;
}
function stringifyTokenStyle(token) {
  if (typeof token === "string")
    return token;
  return Object.entries(token).map(([key, value]) => `${key}:${value}`).join(";");
}

const _grammarStateMap = /* @__PURE__ */ new WeakMap();
function setLastGrammarStateToMap(keys, state) {
  _grammarStateMap.set(keys, state);
}
function getLastGrammarStateFromMap(keys) {
  return _grammarStateMap.get(keys);
}
class GrammarState {
  /**
   * Theme to Stack mapping
   */
  _stacks = {};
  lang;
  get themes() {
    return Object.keys(this._stacks);
  }
  get theme() {
    return this.themes[0];
  }
  get _stack() {
    return this._stacks[this.theme];
  }
  /**
   * Static method to create a initial grammar state.
   */
  static initial(lang, themes) {
    return new GrammarState(
      Object.fromEntries(toArray(themes).map((theme) => [theme, INITIAL])),
      lang
    );
  }
  constructor(...args) {
    if (args.length === 2) {
      const [stacksMap, lang] = args;
      this.lang = lang;
      this._stacks = stacksMap;
    } else {
      const [stack, lang, theme] = args;
      this.lang = lang;
      this._stacks = { [theme]: stack };
    }
  }
  /**
   * Get the internal stack object.
   * @internal
   */
  getInternalStack(theme = this.theme) {
    return this._stacks[theme];
  }
  getScopes(theme = this.theme) {
    return getScopes(this._stacks[theme]);
  }
  toJSON() {
    return {
      lang: this.lang,
      theme: this.theme,
      themes: this.themes,
      scopes: this.getScopes()
    };
  }
}
function getScopes(stack) {
  const scopes = [];
  const visited = /* @__PURE__ */ new Set();
  function pushScope(stack2) {
    if (visited.has(stack2))
      return;
    visited.add(stack2);
    const name = stack2?.nameScopesList?.scopeName;
    if (name)
      scopes.push(name);
    if (stack2.parent)
      pushScope(stack2.parent);
  }
  pushScope(stack);
  return scopes;
}
function getGrammarStack(state, theme) {
  if (!(state instanceof GrammarState))
    throw new ShikiError$1("Invalid grammar state");
  return state.getInternalStack(theme);
}

function transformerDecorations() {
  const map = /* @__PURE__ */ new WeakMap();
  function getContext(shiki) {
    if (!map.has(shiki.meta)) {
      let normalizePosition = function(p) {
        if (typeof p === "number") {
          if (p < 0 || p > shiki.source.length)
            throw new ShikiError$1(`Invalid decoration offset: ${p}. Code length: ${shiki.source.length}`);
          return {
            ...converter.indexToPos(p),
            offset: p
          };
        } else {
          const line = converter.lines[p.line];
          if (line === void 0)
            throw new ShikiError$1(`Invalid decoration position ${JSON.stringify(p)}. Lines length: ${converter.lines.length}`);
          if (p.character < 0 || p.character > line.length)
            throw new ShikiError$1(`Invalid decoration position ${JSON.stringify(p)}. Line ${p.line} length: ${line.length}`);
          return {
            ...p,
            offset: converter.posToIndex(p.line, p.character)
          };
        }
      };
      const converter = createPositionConverter(shiki.source);
      const decorations = (shiki.options.decorations || []).map((d) => ({
        ...d,
        start: normalizePosition(d.start),
        end: normalizePosition(d.end)
      }));
      verifyIntersections(decorations);
      map.set(shiki.meta, {
        decorations,
        converter,
        source: shiki.source
      });
    }
    return map.get(shiki.meta);
  }
  return {
    name: "shiki:decorations",
    tokens(tokens) {
      if (!this.options.decorations?.length)
        return;
      const ctx = getContext(this);
      const breakpoints = ctx.decorations.flatMap((d) => [d.start.offset, d.end.offset]);
      const splitted = splitTokens(tokens, breakpoints);
      return splitted;
    },
    code(codeEl) {
      if (!this.options.decorations?.length)
        return;
      const ctx = getContext(this);
      const lines = Array.from(codeEl.children).filter((i) => i.type === "element" && i.tagName === "span");
      if (lines.length !== ctx.converter.lines.length)
        throw new ShikiError$1(`Number of lines in code element (${lines.length}) does not match the number of lines in the source (${ctx.converter.lines.length}). Failed to apply decorations.`);
      function applyLineSection(line, start, end, decoration) {
        const lineEl = lines[line];
        let text = "";
        let startIndex = -1;
        let endIndex = -1;
        if (start === 0)
          startIndex = 0;
        if (end === 0)
          endIndex = 0;
        if (end === Number.POSITIVE_INFINITY)
          endIndex = lineEl.children.length;
        if (startIndex === -1 || endIndex === -1) {
          for (let i = 0; i < lineEl.children.length; i++) {
            text += stringify(lineEl.children[i]);
            if (startIndex === -1 && text.length === start)
              startIndex = i + 1;
            if (endIndex === -1 && text.length === end)
              endIndex = i + 1;
          }
        }
        if (startIndex === -1)
          throw new ShikiError$1(`Failed to find start index for decoration ${JSON.stringify(decoration.start)}`);
        if (endIndex === -1)
          throw new ShikiError$1(`Failed to find end index for decoration ${JSON.stringify(decoration.end)}`);
        const children = lineEl.children.slice(startIndex, endIndex);
        if (!decoration.alwaysWrap && children.length === lineEl.children.length) {
          applyDecoration(lineEl, decoration, "line");
        } else if (!decoration.alwaysWrap && children.length === 1 && children[0].type === "element") {
          applyDecoration(children[0], decoration, "token");
        } else {
          const wrapper = {
            type: "element",
            tagName: "span",
            properties: {},
            children
          };
          applyDecoration(wrapper, decoration, "wrapper");
          lineEl.children.splice(startIndex, children.length, wrapper);
        }
      }
      function applyLine(line, decoration) {
        lines[line] = applyDecoration(lines[line], decoration, "line");
      }
      function applyDecoration(el, decoration, type) {
        const properties = decoration.properties || {};
        const transform = decoration.transform || ((i) => i);
        el.tagName = decoration.tagName || "span";
        el.properties = {
          ...el.properties,
          ...properties,
          class: el.properties.class
        };
        if (decoration.properties?.class)
          addClassToHast(el, decoration.properties.class);
        el = transform(el, type) || el;
        return el;
      }
      const lineApplies = [];
      const sorted = ctx.decorations.sort((a, b) => b.start.offset - a.start.offset || a.end.offset - b.end.offset);
      for (const decoration of sorted) {
        const { start, end } = decoration;
        if (start.line === end.line) {
          applyLineSection(start.line, start.character, end.character, decoration);
        } else if (start.line < end.line) {
          applyLineSection(start.line, start.character, Number.POSITIVE_INFINITY, decoration);
          for (let i = start.line + 1; i < end.line; i++)
            lineApplies.unshift(() => applyLine(i, decoration));
          applyLineSection(end.line, 0, end.character, decoration);
        }
      }
      lineApplies.forEach((i) => i());
    }
  };
}
function verifyIntersections(items) {
  for (let i = 0; i < items.length; i++) {
    const foo = items[i];
    if (foo.start.offset > foo.end.offset)
      throw new ShikiError$1(`Invalid decoration range: ${JSON.stringify(foo.start)} - ${JSON.stringify(foo.end)}`);
    for (let j = i + 1; j < items.length; j++) {
      const bar = items[j];
      const isFooHasBarStart = foo.start.offset <= bar.start.offset && bar.start.offset < foo.end.offset;
      const isFooHasBarEnd = foo.start.offset < bar.end.offset && bar.end.offset <= foo.end.offset;
      const isBarHasFooStart = bar.start.offset <= foo.start.offset && foo.start.offset < bar.end.offset;
      const isBarHasFooEnd = bar.start.offset < foo.end.offset && foo.end.offset <= bar.end.offset;
      if (isFooHasBarStart || isFooHasBarEnd || isBarHasFooStart || isBarHasFooEnd) {
        if (isFooHasBarStart && isFooHasBarEnd)
          continue;
        if (isBarHasFooStart && isBarHasFooEnd)
          continue;
        throw new ShikiError$1(`Decorations ${JSON.stringify(foo.start)} and ${JSON.stringify(bar.start)} intersect.`);
      }
    }
  }
}
function stringify(el) {
  if (el.type === "text")
    return el.value;
  if (el.type === "element")
    return el.children.map(stringify).join("");
  return "";
}

const builtInTransformers = [
  /* @__PURE__ */ transformerDecorations()
];
function getTransformers(options) {
  return [
    ...options.transformers || [],
    ...builtInTransformers
  ];
}

// src/colors.ts
var namedColors = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite"
];

// src/decorations.ts
var decorations = {
  1: "bold",
  2: "dim",
  3: "italic",
  4: "underline",
  7: "reverse",
  8: "hidden",
  9: "strikethrough"
};

// src/parser.ts
function findSequence(value, position) {
  const nextEscape = value.indexOf("\x1B", position);
  if (nextEscape !== -1) {
    if (value[nextEscape + 1] === "[") {
      const nextClose = value.indexOf("m", nextEscape);
      if (nextClose !== -1) {
        return {
          sequence: value.substring(nextEscape + 2, nextClose).split(";"),
          startPosition: nextEscape,
          position: nextClose + 1
        };
      }
    }
  }
  return {
    position: value.length
  };
}
function parseColor(sequence) {
  const colorMode = sequence.shift();
  if (colorMode === "2") {
    const rgb = sequence.splice(0, 3).map((x) => Number.parseInt(x));
    if (rgb.length !== 3 || rgb.some((x) => Number.isNaN(x)))
      return;
    return {
      type: "rgb",
      rgb
    };
  } else if (colorMode === "5") {
    const index = sequence.shift();
    if (index) {
      return { type: "table", index: Number(index) };
    }
  }
}
function parseSequence(sequence) {
  const commands = [];
  while (sequence.length > 0) {
    const code = sequence.shift();
    if (!code)
      continue;
    const codeInt = Number.parseInt(code);
    if (Number.isNaN(codeInt))
      continue;
    if (codeInt === 0) {
      commands.push({ type: "resetAll" });
    } else if (codeInt <= 9) {
      const decoration = decorations[codeInt];
      if (decoration) {
        commands.push({
          type: "setDecoration",
          value: decorations[codeInt]
        });
      }
    } else if (codeInt <= 29) {
      const decoration = decorations[codeInt - 20];
      if (decoration) {
        commands.push({
          type: "resetDecoration",
          value: decoration
        });
        if (decoration === "dim") {
          commands.push({
            type: "resetDecoration",
            value: "bold"
          });
        }
      }
    } else if (codeInt <= 37) {
      commands.push({
        type: "setForegroundColor",
        value: { type: "named", name: namedColors[codeInt - 30] }
      });
    } else if (codeInt === 38) {
      const color = parseColor(sequence);
      if (color) {
        commands.push({
          type: "setForegroundColor",
          value: color
        });
      }
    } else if (codeInt === 39) {
      commands.push({
        type: "resetForegroundColor"
      });
    } else if (codeInt <= 47) {
      commands.push({
        type: "setBackgroundColor",
        value: { type: "named", name: namedColors[codeInt - 40] }
      });
    } else if (codeInt === 48) {
      const color = parseColor(sequence);
      if (color) {
        commands.push({
          type: "setBackgroundColor",
          value: color
        });
      }
    } else if (codeInt === 49) {
      commands.push({
        type: "resetBackgroundColor"
      });
    } else if (codeInt === 53) {
      commands.push({
        type: "setDecoration",
        value: "overline"
      });
    } else if (codeInt === 55) {
      commands.push({
        type: "resetDecoration",
        value: "overline"
      });
    } else if (codeInt >= 90 && codeInt <= 97) {
      commands.push({
        type: "setForegroundColor",
        value: { type: "named", name: namedColors[codeInt - 90 + 8] }
      });
    } else if (codeInt >= 100 && codeInt <= 107) {
      commands.push({
        type: "setBackgroundColor",
        value: { type: "named", name: namedColors[codeInt - 100 + 8] }
      });
    }
  }
  return commands;
}
function createAnsiSequenceParser() {
  let foreground = null;
  let background = null;
  let decorations2 = /* @__PURE__ */ new Set();
  return {
    parse(value) {
      const tokens = [];
      let position = 0;
      do {
        const findResult = findSequence(value, position);
        const text = findResult.sequence ? value.substring(position, findResult.startPosition) : value.substring(position);
        if (text.length > 0) {
          tokens.push({
            value: text,
            foreground,
            background,
            decorations: new Set(decorations2)
          });
        }
        if (findResult.sequence) {
          const commands = parseSequence(findResult.sequence);
          for (const styleToken of commands) {
            if (styleToken.type === "resetAll") {
              foreground = null;
              background = null;
              decorations2.clear();
            } else if (styleToken.type === "resetForegroundColor") {
              foreground = null;
            } else if (styleToken.type === "resetBackgroundColor") {
              background = null;
            } else if (styleToken.type === "resetDecoration") {
              decorations2.delete(styleToken.value);
            }
          }
          for (const styleToken of commands) {
            if (styleToken.type === "setForegroundColor") {
              foreground = styleToken.value;
            } else if (styleToken.type === "setBackgroundColor") {
              background = styleToken.value;
            } else if (styleToken.type === "setDecoration") {
              decorations2.add(styleToken.value);
            }
          }
        }
        position = findResult.position;
      } while (position < value.length);
      return tokens;
    }
  };
}

// src/palette.ts
var defaultNamedColorsMap = {
  black: "#000000",
  red: "#bb0000",
  green: "#00bb00",
  yellow: "#bbbb00",
  blue: "#0000bb",
  magenta: "#ff00ff",
  cyan: "#00bbbb",
  white: "#eeeeee",
  brightBlack: "#555555",
  brightRed: "#ff5555",
  brightGreen: "#00ff00",
  brightYellow: "#ffff55",
  brightBlue: "#5555ff",
  brightMagenta: "#ff55ff",
  brightCyan: "#55ffff",
  brightWhite: "#ffffff"
};
function createColorPalette(namedColorsMap = defaultNamedColorsMap) {
  function namedColor(name) {
    return namedColorsMap[name];
  }
  function rgbColor(rgb) {
    return `#${rgb.map((x) => Math.max(0, Math.min(x, 255)).toString(16).padStart(2, "0")).join("")}`;
  }
  let colorTable;
  function getColorTable() {
    if (colorTable) {
      return colorTable;
    }
    colorTable = [];
    for (let i = 0; i < namedColors.length; i++) {
      colorTable.push(namedColor(namedColors[i]));
    }
    let levels = [0, 95, 135, 175, 215, 255];
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          colorTable.push(rgbColor([levels[r], levels[g], levels[b]]));
        }
      }
    }
    let level = 8;
    for (let i = 0; i < 24; i++, level += 10) {
      colorTable.push(rgbColor([level, level, level]));
    }
    return colorTable;
  }
  function tableColor(index) {
    return getColorTable()[index];
  }
  function value(color) {
    switch (color.type) {
      case "named":
        return namedColor(color.name);
      case "rgb":
        return rgbColor(color.rgb);
      case "table":
        return tableColor(color.index);
    }
  }
  return {
    value
  };
}

function tokenizeAnsiWithTheme(theme, fileContents, options) {
  const colorReplacements = resolveColorReplacements(theme, options);
  const lines = splitLines(fileContents);
  const colorPalette = createColorPalette(
    Object.fromEntries(
      namedColors.map((name) => [
        name,
        theme.colors?.[`terminal.ansi${name[0].toUpperCase()}${name.substring(1)}`]
      ])
    )
  );
  const parser = createAnsiSequenceParser();
  return lines.map(
    (line) => parser.parse(line[0]).map((token) => {
      let color;
      let bgColor;
      if (token.decorations.has("reverse")) {
        color = token.background ? colorPalette.value(token.background) : theme.bg;
        bgColor = token.foreground ? colorPalette.value(token.foreground) : theme.fg;
      } else {
        color = token.foreground ? colorPalette.value(token.foreground) : theme.fg;
        bgColor = token.background ? colorPalette.value(token.background) : void 0;
      }
      color = applyColorReplacements(color, colorReplacements);
      bgColor = applyColorReplacements(bgColor, colorReplacements);
      if (token.decorations.has("dim"))
        color = dimColor(color);
      let fontStyle = FontStyle.None;
      if (token.decorations.has("bold"))
        fontStyle |= FontStyle.Bold;
      if (token.decorations.has("italic"))
        fontStyle |= FontStyle.Italic;
      if (token.decorations.has("underline"))
        fontStyle |= FontStyle.Underline;
      if (token.decorations.has("strikethrough"))
        fontStyle |= FontStyle.Strikethrough;
      return {
        content: token.value,
        offset: line[1],
        // TODO: more accurate offset? might need to fork ansi-sequence-parser
        color,
        bgColor,
        fontStyle
      };
    })
  );
}
function dimColor(color) {
  const hexMatch = color.match(/#([0-9a-f]{3})([0-9a-f]{3})?([0-9a-f]{2})?/);
  if (hexMatch) {
    if (hexMatch[3]) {
      const alpha = Math.round(Number.parseInt(hexMatch[3], 16) / 2).toString(16).padStart(2, "0");
      return `#${hexMatch[1]}${hexMatch[2]}${alpha}`;
    } else if (hexMatch[2]) {
      return `#${hexMatch[1]}${hexMatch[2]}80`;
    } else {
      return `#${Array.from(hexMatch[1]).map((x) => `${x}${x}`).join("")}80`;
    }
  }
  const cssVarMatch = color.match(/var\((--[\w-]+-ansi-[\w-]+)\)/);
  if (cssVarMatch)
    return `var(${cssVarMatch[1]}-dim)`;
  return color;
}

function codeToTokensBase(internal, code, options = {}) {
  const {
    lang = "text",
    theme: themeName = internal.getLoadedThemes()[0]
  } = options;
  if (isPlainLang(lang) || isNoneTheme(themeName))
    return splitLines(code).map((line) => [{ content: line[0], offset: line[1] }]);
  const { theme, colorMap } = internal.setTheme(themeName);
  if (lang === "ansi")
    return tokenizeAnsiWithTheme(theme, code, options);
  const _grammar = internal.getLanguage(lang);
  if (options.grammarState) {
    if (options.grammarState.lang !== _grammar.name) {
      throw new ShikiError$1(`Grammar state language "${options.grammarState.lang}" does not match highlight language "${_grammar.name}"`);
    }
    if (!options.grammarState.themes.includes(theme.name)) {
      throw new ShikiError$1(`Grammar state themes "${options.grammarState.themes}" do not contain highlight theme "${theme.name}"`);
    }
  }
  return tokenizeWithTheme(code, _grammar, theme, colorMap, options);
}
function getLastGrammarState(...args) {
  if (args.length === 2) {
    return getLastGrammarStateFromMap(args[1]);
  }
  const [internal, code, options = {}] = args;
  const {
    lang = "text",
    theme: themeName = internal.getLoadedThemes()[0]
  } = options;
  if (isPlainLang(lang) || isNoneTheme(themeName))
    throw new ShikiError$1("Plain language does not have grammar state");
  if (lang === "ansi")
    throw new ShikiError$1("ANSI language does not have grammar state");
  const { theme, colorMap } = internal.setTheme(themeName);
  const _grammar = internal.getLanguage(lang);
  return new GrammarState(
    _tokenizeWithTheme(code, _grammar, theme, colorMap, options).stateStack,
    _grammar.name,
    theme.name
  );
}
function tokenizeWithTheme(code, grammar, theme, colorMap, options) {
  const result = _tokenizeWithTheme(code, grammar, theme, colorMap, options);
  const grammarState = new GrammarState(
    _tokenizeWithTheme(code, grammar, theme, colorMap, options).stateStack,
    grammar.name,
    theme.name
  );
  setLastGrammarStateToMap(result.tokens, grammarState);
  return result.tokens;
}
function _tokenizeWithTheme(code, grammar, theme, colorMap, options) {
  const colorReplacements = resolveColorReplacements(theme, options);
  const {
    tokenizeMaxLineLength = 0,
    tokenizeTimeLimit = 500
  } = options;
  const lines = splitLines(code);
  let stateStack = options.grammarState ? getGrammarStack(options.grammarState, theme.name) ?? INITIAL : options.grammarContextCode != null ? _tokenizeWithTheme(
    options.grammarContextCode,
    grammar,
    theme,
    colorMap,
    {
      ...options,
      grammarState: void 0,
      grammarContextCode: void 0
    }
  ).stateStack : INITIAL;
  let actual = [];
  const final = [];
  for (let i = 0, len = lines.length; i < len; i++) {
    const [line, lineOffset] = lines[i];
    if (line === "") {
      actual = [];
      final.push([]);
      continue;
    }
    if (tokenizeMaxLineLength > 0 && line.length >= tokenizeMaxLineLength) {
      actual = [];
      final.push([{
        content: line,
        offset: lineOffset,
        color: "",
        fontStyle: 0
      }]);
      continue;
    }
    let resultWithScopes;
    let tokensWithScopes;
    let tokensWithScopesIndex;
    if (options.includeExplanation) {
      resultWithScopes = grammar.tokenizeLine(line, stateStack, tokenizeTimeLimit);
      tokensWithScopes = resultWithScopes.tokens;
      tokensWithScopesIndex = 0;
    }
    const result = grammar.tokenizeLine2(line, stateStack, tokenizeTimeLimit);
    const tokensLength = result.tokens.length / 2;
    for (let j = 0; j < tokensLength; j++) {
      const startIndex = result.tokens[2 * j];
      const nextStartIndex = j + 1 < tokensLength ? result.tokens[2 * j + 2] : line.length;
      if (startIndex === nextStartIndex)
        continue;
      const metadata = result.tokens[2 * j + 1];
      const color = applyColorReplacements(
        colorMap[EncodedTokenMetadata.getForeground(metadata)],
        colorReplacements
      );
      const fontStyle = EncodedTokenMetadata.getFontStyle(metadata);
      const token = {
        content: line.substring(startIndex, nextStartIndex),
        offset: lineOffset + startIndex,
        color,
        fontStyle
      };
      if (options.includeExplanation) {
        const themeSettingsSelectors = [];
        if (options.includeExplanation !== "scopeName") {
          for (const setting of theme.settings) {
            let selectors;
            switch (typeof setting.scope) {
              case "string":
                selectors = setting.scope.split(/,/).map((scope) => scope.trim());
                break;
              case "object":
                selectors = setting.scope;
                break;
              default:
                continue;
            }
            themeSettingsSelectors.push({
              settings: setting,
              selectors: selectors.map((selector) => selector.split(/ /))
            });
          }
        }
        token.explanation = [];
        let offset = 0;
        while (startIndex + offset < nextStartIndex) {
          const tokenWithScopes = tokensWithScopes[tokensWithScopesIndex];
          const tokenWithScopesText = line.substring(
            tokenWithScopes.startIndex,
            tokenWithScopes.endIndex
          );
          offset += tokenWithScopesText.length;
          token.explanation.push({
            content: tokenWithScopesText,
            scopes: options.includeExplanation === "scopeName" ? explainThemeScopesNameOnly(
              tokenWithScopes.scopes
            ) : explainThemeScopesFull(
              themeSettingsSelectors,
              tokenWithScopes.scopes
            )
          });
          tokensWithScopesIndex += 1;
        }
      }
      actual.push(token);
    }
    final.push(actual);
    actual = [];
    stateStack = result.ruleStack;
  }
  return {
    tokens: final,
    stateStack
  };
}
function explainThemeScopesNameOnly(scopes) {
  return scopes.map((scope) => ({ scopeName: scope }));
}
function explainThemeScopesFull(themeSelectors, scopes) {
  const result = [];
  for (let i = 0, len = scopes.length; i < len; i++) {
    const scope = scopes[i];
    result[i] = {
      scopeName: scope,
      themeMatches: explainThemeScope(themeSelectors, scope, scopes.slice(0, i))
    };
  }
  return result;
}
function matchesOne(selector, scope) {
  return selector === scope || scope.substring(0, selector.length) === selector && scope[selector.length] === ".";
}
function matches(selectors, scope, parentScopes) {
  if (!matchesOne(selectors[selectors.length - 1], scope))
    return false;
  let selectorParentIndex = selectors.length - 2;
  let parentIndex = parentScopes.length - 1;
  while (selectorParentIndex >= 0 && parentIndex >= 0) {
    if (matchesOne(selectors[selectorParentIndex], parentScopes[parentIndex]))
      selectorParentIndex -= 1;
    parentIndex -= 1;
  }
  if (selectorParentIndex === -1)
    return true;
  return false;
}
function explainThemeScope(themeSettingsSelectors, scope, parentScopes) {
  const result = [];
  for (const { selectors, settings } of themeSettingsSelectors) {
    for (const selectorPieces of selectors) {
      if (matches(selectorPieces, scope, parentScopes)) {
        result.push(settings);
        break;
      }
    }
  }
  return result;
}

function codeToTokensWithThemes(internal, code, options) {
  const themes = Object.entries(options.themes).filter((i) => i[1]).map((i) => ({ color: i[0], theme: i[1] }));
  const themedTokens = themes.map((t) => {
    const tokens2 = codeToTokensBase(internal, code, {
      ...options,
      theme: t.theme
    });
    const state = getLastGrammarStateFromMap(tokens2);
    const theme = typeof t.theme === "string" ? t.theme : t.theme.name;
    return {
      tokens: tokens2,
      state,
      theme
    };
  });
  const tokens = syncThemesTokenization(
    ...themedTokens.map((i) => i.tokens)
  );
  const mergedTokens = tokens[0].map(
    (line, lineIdx) => line.map((_token, tokenIdx) => {
      const mergedToken = {
        content: _token.content,
        variants: {},
        offset: _token.offset
      };
      if ("includeExplanation" in options && options.includeExplanation) {
        mergedToken.explanation = _token.explanation;
      }
      tokens.forEach((t, themeIdx) => {
        const {
          content: _,
          explanation: __,
          offset: ___,
          ...styles
        } = t[lineIdx][tokenIdx];
        mergedToken.variants[themes[themeIdx].color] = styles;
      });
      return mergedToken;
    })
  );
  const mergedGrammarState = themedTokens[0].state ? new GrammarState(
    Object.fromEntries(themedTokens.map((s) => [s.theme, s.state?.getInternalStack(s.theme)])),
    themedTokens[0].state.lang
  ) : void 0;
  if (mergedGrammarState)
    setLastGrammarStateToMap(mergedTokens, mergedGrammarState);
  return mergedTokens;
}
function syncThemesTokenization(...themes) {
  const outThemes = themes.map(() => []);
  const count = themes.length;
  for (let i = 0; i < themes[0].length; i++) {
    const lines = themes.map((t) => t[i]);
    const outLines = outThemes.map(() => []);
    outThemes.forEach((t, i2) => t.push(outLines[i2]));
    const indexes = lines.map(() => 0);
    const current = lines.map((l) => l[0]);
    while (current.every((t) => t)) {
      const minLength = Math.min(...current.map((t) => t.content.length));
      for (let n = 0; n < count; n++) {
        const token = current[n];
        if (token.content.length === minLength) {
          outLines[n].push(token);
          indexes[n] += 1;
          current[n] = lines[n][indexes[n]];
        } else {
          outLines[n].push({
            ...token,
            content: token.content.slice(0, minLength)
          });
          current[n] = {
            ...token,
            content: token.content.slice(minLength),
            offset: token.offset + minLength
          };
        }
      }
    }
  }
  return outThemes;
}

function codeToTokens(internal, code, options) {
  let bg;
  let fg;
  let tokens;
  let themeName;
  let rootStyle;
  let grammarState;
  if ("themes" in options) {
    const {
      defaultColor = "light",
      cssVariablePrefix = "--shiki-"
    } = options;
    const themes = Object.entries(options.themes).filter((i) => i[1]).map((i) => ({ color: i[0], theme: i[1] })).sort((a, b) => a.color === defaultColor ? -1 : b.color === defaultColor ? 1 : 0);
    if (themes.length === 0)
      throw new ShikiError$1("`themes` option must not be empty");
    const themeTokens = codeToTokensWithThemes(
      internal,
      code,
      options
    );
    grammarState = getLastGrammarStateFromMap(themeTokens);
    if (defaultColor && !themes.find((t) => t.color === defaultColor))
      throw new ShikiError$1(`\`themes\` option must contain the defaultColor key \`${defaultColor}\``);
    const themeRegs = themes.map((t) => internal.getTheme(t.theme));
    const themesOrder = themes.map((t) => t.color);
    tokens = themeTokens.map((line) => line.map((token) => flatTokenVariants(token, themesOrder, cssVariablePrefix, defaultColor)));
    if (grammarState)
      setLastGrammarStateToMap(tokens, grammarState);
    const themeColorReplacements = themes.map((t) => resolveColorReplacements(t.theme, options));
    fg = themes.map((t, idx) => (idx === 0 && defaultColor ? "" : `${cssVariablePrefix + t.color}:`) + (applyColorReplacements(themeRegs[idx].fg, themeColorReplacements[idx]) || "inherit")).join(";");
    bg = themes.map((t, idx) => (idx === 0 && defaultColor ? "" : `${cssVariablePrefix + t.color}-bg:`) + (applyColorReplacements(themeRegs[idx].bg, themeColorReplacements[idx]) || "inherit")).join(";");
    themeName = `shiki-themes ${themeRegs.map((t) => t.name).join(" ")}`;
    rootStyle = defaultColor ? void 0 : [fg, bg].join(";");
  } else if ("theme" in options) {
    const colorReplacements = resolveColorReplacements(options.theme, options);
    tokens = codeToTokensBase(
      internal,
      code,
      options
    );
    const _theme = internal.getTheme(options.theme);
    bg = applyColorReplacements(_theme.bg, colorReplacements);
    fg = applyColorReplacements(_theme.fg, colorReplacements);
    themeName = _theme.name;
    grammarState = getLastGrammarStateFromMap(tokens);
  } else {
    throw new ShikiError$1("Invalid options, either `theme` or `themes` must be provided");
  }
  return {
    tokens,
    fg,
    bg,
    themeName,
    rootStyle,
    grammarState
  };
}

function codeToHast(internal, code, options, transformerContext = {
  meta: {},
  options,
  codeToHast: (_code, _options) => codeToHast(internal, _code, _options),
  codeToTokens: (_code, _options) => codeToTokens(internal, _code, _options)
}) {
  let input = code;
  for (const transformer of getTransformers(options))
    input = transformer.preprocess?.call(transformerContext, input, options) || input;
  let {
    tokens,
    fg,
    bg,
    themeName,
    rootStyle,
    grammarState
  } = codeToTokens(internal, input, options);
  const {
    mergeWhitespaces = true,
    mergeSameStyleTokens = false
  } = options;
  if (mergeWhitespaces === true)
    tokens = mergeWhitespaceTokens(tokens);
  else if (mergeWhitespaces === "never")
    tokens = splitWhitespaceTokens(tokens);
  if (mergeSameStyleTokens) {
    tokens = mergeAdjacentStyledTokens(tokens);
  }
  const contextSource = {
    ...transformerContext,
    get source() {
      return input;
    }
  };
  for (const transformer of getTransformers(options))
    tokens = transformer.tokens?.call(contextSource, tokens) || tokens;
  return tokensToHast(
    tokens,
    {
      ...options,
      fg,
      bg,
      themeName,
      rootStyle
    },
    contextSource,
    grammarState
  );
}
function tokensToHast(tokens, options, transformerContext, grammarState = getLastGrammarStateFromMap(tokens)) {
  const transformers = getTransformers(options);
  const lines = [];
  const root = {
    type: "root",
    children: []
  };
  const {
    structure = "classic",
    tabindex = "0"
  } = options;
  let preNode = {
    type: "element",
    tagName: "pre",
    properties: {
      class: `shiki ${options.themeName || ""}`,
      style: options.rootStyle || `background-color:${options.bg};color:${options.fg}`,
      ...tabindex !== false && tabindex != null ? {
        tabindex: tabindex.toString()
      } : {},
      ...Object.fromEntries(
        Array.from(
          Object.entries(options.meta || {})
        ).filter(([key]) => !key.startsWith("_"))
      )
    },
    children: []
  };
  let codeNode = {
    type: "element",
    tagName: "code",
    properties: {},
    children: lines
  };
  const lineNodes = [];
  const context = {
    ...transformerContext,
    structure,
    addClassToHast,
    get source() {
      return transformerContext.source;
    },
    get tokens() {
      return tokens;
    },
    get options() {
      return options;
    },
    get root() {
      return root;
    },
    get pre() {
      return preNode;
    },
    get code() {
      return codeNode;
    },
    get lines() {
      return lineNodes;
    }
  };
  tokens.forEach((line, idx) => {
    if (idx) {
      if (structure === "inline")
        root.children.push({ type: "element", tagName: "br", properties: {}, children: [] });
      else if (structure === "classic")
        lines.push({ type: "text", value: "\n" });
    }
    let lineNode = {
      type: "element",
      tagName: "span",
      properties: { class: "line" },
      children: []
    };
    let col = 0;
    for (const token of line) {
      let tokenNode = {
        type: "element",
        tagName: "span",
        properties: {
          ...token.htmlAttrs
        },
        children: [{ type: "text", value: token.content }]
      };
      const style = stringifyTokenStyle(token.htmlStyle || getTokenStyleObject(token));
      if (style)
        tokenNode.properties.style = style;
      for (const transformer of transformers)
        tokenNode = transformer?.span?.call(context, tokenNode, idx + 1, col, lineNode, token) || tokenNode;
      if (structure === "inline")
        root.children.push(tokenNode);
      else if (structure === "classic")
        lineNode.children.push(tokenNode);
      col += token.content.length;
    }
    if (structure === "classic") {
      for (const transformer of transformers)
        lineNode = transformer?.line?.call(context, lineNode, idx + 1) || lineNode;
      lineNodes.push(lineNode);
      lines.push(lineNode);
    }
  });
  if (structure === "classic") {
    for (const transformer of transformers)
      codeNode = transformer?.code?.call(context, codeNode) || codeNode;
    preNode.children.push(codeNode);
    for (const transformer of transformers)
      preNode = transformer?.pre?.call(context, preNode) || preNode;
    root.children.push(preNode);
  }
  let result = root;
  for (const transformer of transformers)
    result = transformer?.root?.call(context, result) || result;
  if (grammarState)
    setLastGrammarStateToMap(result, grammarState);
  return result;
}
function mergeWhitespaceTokens(tokens) {
  return tokens.map((line) => {
    const newLine = [];
    let carryOnContent = "";
    let firstOffset = 0;
    line.forEach((token, idx) => {
      const isDecorated = token.fontStyle && (token.fontStyle & FontStyle.Underline || token.fontStyle & FontStyle.Strikethrough);
      const couldMerge = !isDecorated;
      if (couldMerge && token.content.match(/^\s+$/) && line[idx + 1]) {
        if (!firstOffset)
          firstOffset = token.offset;
        carryOnContent += token.content;
      } else {
        if (carryOnContent) {
          if (couldMerge) {
            newLine.push({
              ...token,
              offset: firstOffset,
              content: carryOnContent + token.content
            });
          } else {
            newLine.push(
              {
                content: carryOnContent,
                offset: firstOffset
              },
              token
            );
          }
          firstOffset = 0;
          carryOnContent = "";
        } else {
          newLine.push(token);
        }
      }
    });
    return newLine;
  });
}
function splitWhitespaceTokens(tokens) {
  return tokens.map((line) => {
    return line.flatMap((token) => {
      if (token.content.match(/^\s+$/))
        return token;
      const match = token.content.match(/^(\s*)(.*?)(\s*)$/);
      if (!match)
        return token;
      const [, leading, content, trailing] = match;
      if (!leading && !trailing)
        return token;
      const expanded = [{
        ...token,
        offset: token.offset + leading.length,
        content
      }];
      if (leading) {
        expanded.unshift({
          content: leading,
          offset: token.offset
        });
      }
      if (trailing) {
        expanded.push({
          content: trailing,
          offset: token.offset + leading.length + content.length
        });
      }
      return expanded;
    });
  });
}
function mergeAdjacentStyledTokens(tokens) {
  return tokens.map((line) => {
    const newLine = [];
    for (const token of line) {
      if (newLine.length === 0) {
        newLine.push({ ...token });
        continue;
      }
      const prevToken = newLine[newLine.length - 1];
      const prevStyle = prevToken.htmlStyle || stringifyTokenStyle(getTokenStyleObject(prevToken));
      const currentStyle = token.htmlStyle || stringifyTokenStyle(getTokenStyleObject(token));
      const isPrevDecorated = prevToken.fontStyle && (prevToken.fontStyle & FontStyle.Underline || prevToken.fontStyle & FontStyle.Strikethrough);
      const isDecorated = token.fontStyle && (token.fontStyle & FontStyle.Underline || token.fontStyle & FontStyle.Strikethrough);
      if (!isPrevDecorated && !isDecorated && prevStyle === currentStyle) {
        prevToken.content += token.content;
      } else {
        newLine.push({ ...token });
      }
    }
    return newLine;
  });
}

const hastToHtml = toHtml;
function codeToHtml(internal, code, options) {
  const context = {
    meta: {},
    options,
    codeToHast: (_code, _options) => codeToHast(internal, _code, _options),
    codeToTokens: (_code, _options) => codeToTokens(internal, _code, _options)
  };
  let result = hastToHtml(codeToHast(internal, code, options, context));
  for (const transformer of getTransformers(options))
    result = transformer.postprocess?.call(context, result, options) || result;
  return result;
}

const VSCODE_FALLBACK_EDITOR_FG = { light: "#333333", dark: "#bbbbbb" };
const VSCODE_FALLBACK_EDITOR_BG = { light: "#fffffe", dark: "#1e1e1e" };
const RESOLVED_KEY = "__shiki_resolved";
function normalizeTheme(rawTheme) {
  if (rawTheme?.[RESOLVED_KEY])
    return rawTheme;
  const theme = {
    ...rawTheme
  };
  if (theme.tokenColors && !theme.settings) {
    theme.settings = theme.tokenColors;
    delete theme.tokenColors;
  }
  theme.type ||= "dark";
  theme.colorReplacements = { ...theme.colorReplacements };
  theme.settings ||= [];
  let { bg, fg } = theme;
  if (!bg || !fg) {
    const globalSetting = theme.settings ? theme.settings.find((s) => !s.name && !s.scope) : void 0;
    if (globalSetting?.settings?.foreground)
      fg = globalSetting.settings.foreground;
    if (globalSetting?.settings?.background)
      bg = globalSetting.settings.background;
    if (!fg && theme?.colors?.["editor.foreground"])
      fg = theme.colors["editor.foreground"];
    if (!bg && theme?.colors?.["editor.background"])
      bg = theme.colors["editor.background"];
    if (!fg)
      fg = theme.type === "light" ? VSCODE_FALLBACK_EDITOR_FG.light : VSCODE_FALLBACK_EDITOR_FG.dark;
    if (!bg)
      bg = theme.type === "light" ? VSCODE_FALLBACK_EDITOR_BG.light : VSCODE_FALLBACK_EDITOR_BG.dark;
    theme.fg = fg;
    theme.bg = bg;
  }
  if (!(theme.settings[0] && theme.settings[0].settings && !theme.settings[0].scope)) {
    theme.settings.unshift({
      settings: {
        foreground: theme.fg,
        background: theme.bg
      }
    });
  }
  let replacementCount = 0;
  const replacementMap = /* @__PURE__ */ new Map();
  function getReplacementColor(value) {
    if (replacementMap.has(value))
      return replacementMap.get(value);
    replacementCount += 1;
    const hex = `#${replacementCount.toString(16).padStart(8, "0").toLowerCase()}`;
    if (theme.colorReplacements?.[`#${hex}`])
      return getReplacementColor(value);
    replacementMap.set(value, hex);
    return hex;
  }
  theme.settings = theme.settings.map((setting) => {
    const replaceFg = setting.settings?.foreground && !setting.settings.foreground.startsWith("#");
    const replaceBg = setting.settings?.background && !setting.settings.background.startsWith("#");
    if (!replaceFg && !replaceBg)
      return setting;
    const clone = {
      ...setting,
      settings: {
        ...setting.settings
      }
    };
    if (replaceFg) {
      const replacement = getReplacementColor(setting.settings.foreground);
      theme.colorReplacements[replacement] = setting.settings.foreground;
      clone.settings.foreground = replacement;
    }
    if (replaceBg) {
      const replacement = getReplacementColor(setting.settings.background);
      theme.colorReplacements[replacement] = setting.settings.background;
      clone.settings.background = replacement;
    }
    return clone;
  });
  for (const key of Object.keys(theme.colors || {})) {
    if (key === "editor.foreground" || key === "editor.background" || key.startsWith("terminal.ansi")) {
      if (!theme.colors[key]?.startsWith("#")) {
        const replacement = getReplacementColor(theme.colors[key]);
        theme.colorReplacements[replacement] = theme.colors[key];
        theme.colors[key] = replacement;
      }
    }
  }
  Object.defineProperty(theme, RESOLVED_KEY, {
    enumerable: false,
    writable: false,
    value: true
  });
  return theme;
}

async function resolveLangs(langs) {
  return Array.from(new Set((await Promise.all(
    langs.filter((l) => !isSpecialLang(l)).map(async (lang) => await normalizeGetter(lang).then((r) => Array.isArray(r) ? r : [r]))
  )).flat()));
}
async function resolveThemes(themes) {
  const resolved = await Promise.all(
    themes.map(
      async (theme) => isSpecialTheme(theme) ? null : normalizeTheme(await normalizeGetter(theme))
    )
  );
  return resolved.filter((i) => !!i);
}

class ShikiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ShikiError";
  }
}

class Registry extends Registry$1 {
  constructor(_resolver, _themes, _langs, _alias = {}) {
    super(_resolver);
    this._resolver = _resolver;
    this._themes = _themes;
    this._langs = _langs;
    this._alias = _alias;
    this._themes.map((t) => this.loadTheme(t));
    this.loadLanguages(this._langs);
  }
  _resolvedThemes = /* @__PURE__ */ new Map();
  _resolvedGrammars = /* @__PURE__ */ new Map();
  _langMap = /* @__PURE__ */ new Map();
  _langGraph = /* @__PURE__ */ new Map();
  _textmateThemeCache = /* @__PURE__ */ new WeakMap();
  _loadedThemesCache = null;
  _loadedLanguagesCache = null;
  getTheme(theme) {
    if (typeof theme === "string")
      return this._resolvedThemes.get(theme);
    else
      return this.loadTheme(theme);
  }
  loadTheme(theme) {
    const _theme = normalizeTheme(theme);
    if (_theme.name) {
      this._resolvedThemes.set(_theme.name, _theme);
      this._loadedThemesCache = null;
    }
    return _theme;
  }
  getLoadedThemes() {
    if (!this._loadedThemesCache)
      this._loadedThemesCache = [...this._resolvedThemes.keys()];
    return this._loadedThemesCache;
  }
  // Override and re-implement this method to cache the textmate themes as `TextMateTheme.createFromRawTheme`
  // is expensive. Themes can switch often especially for dual-theme support.
  //
  // The parent class also accepts `colorMap` as the second parameter, but since we don't use that,
  // we omit here so it's easier to cache the themes.
  setTheme(theme) {
    let textmateTheme = this._textmateThemeCache.get(theme);
    if (!textmateTheme) {
      textmateTheme = Theme.createFromRawTheme(theme);
      this._textmateThemeCache.set(theme, textmateTheme);
    }
    this._syncRegistry.setTheme(textmateTheme);
  }
  getGrammar(name) {
    if (this._alias[name]) {
      const resolved = /* @__PURE__ */ new Set([name]);
      while (this._alias[name]) {
        name = this._alias[name];
        if (resolved.has(name))
          throw new ShikiError(`Circular alias \`${Array.from(resolved).join(" -> ")} -> ${name}\``);
        resolved.add(name);
      }
    }
    return this._resolvedGrammars.get(name);
  }
  loadLanguage(lang) {
    if (this.getGrammar(lang.name))
      return;
    const embeddedLazilyBy = new Set(
      [...this._langMap.values()].filter((i) => i.embeddedLangsLazy?.includes(lang.name))
    );
    this._resolver.addLanguage(lang);
    const grammarConfig = {
      balancedBracketSelectors: lang.balancedBracketSelectors || ["*"],
      unbalancedBracketSelectors: lang.unbalancedBracketSelectors || []
    };
    this._syncRegistry._rawGrammars.set(lang.scopeName, lang);
    const g = this.loadGrammarWithConfiguration(lang.scopeName, 1, grammarConfig);
    g.name = lang.name;
    this._resolvedGrammars.set(lang.name, g);
    if (lang.aliases) {
      lang.aliases.forEach((alias) => {
        this._alias[alias] = lang.name;
      });
    }
    this._loadedLanguagesCache = null;
    if (embeddedLazilyBy.size) {
      for (const e of embeddedLazilyBy) {
        this._resolvedGrammars.delete(e.name);
        this._loadedLanguagesCache = null;
        this._syncRegistry?._injectionGrammars?.delete(e.scopeName);
        this._syncRegistry?._grammars?.delete(e.scopeName);
        this.loadLanguage(this._langMap.get(e.name));
      }
    }
  }
  dispose() {
    super.dispose();
    this._resolvedThemes.clear();
    this._resolvedGrammars.clear();
    this._langMap.clear();
    this._langGraph.clear();
    this._loadedThemesCache = null;
  }
  loadLanguages(langs) {
    for (const lang of langs)
      this.resolveEmbeddedLanguages(lang);
    const langsGraphArray = Array.from(this._langGraph.entries());
    const missingLangs = langsGraphArray.filter(([_, lang]) => !lang);
    if (missingLangs.length) {
      const dependents = langsGraphArray.filter(([_, lang]) => lang && lang.embeddedLangs?.some((l) => missingLangs.map(([name]) => name).includes(l))).filter((lang) => !missingLangs.includes(lang));
      throw new ShikiError(`Missing languages ${missingLangs.map(([name]) => `\`${name}\``).join(", ")}, required by ${dependents.map(([name]) => `\`${name}\``).join(", ")}`);
    }
    for (const [_, lang] of langsGraphArray)
      this._resolver.addLanguage(lang);
    for (const [_, lang] of langsGraphArray)
      this.loadLanguage(lang);
  }
  getLoadedLanguages() {
    if (!this._loadedLanguagesCache) {
      this._loadedLanguagesCache = [
        .../* @__PURE__ */ new Set([...this._resolvedGrammars.keys(), ...Object.keys(this._alias)])
      ];
    }
    return this._loadedLanguagesCache;
  }
  resolveEmbeddedLanguages(lang) {
    this._langMap.set(lang.name, lang);
    this._langGraph.set(lang.name, lang);
    if (lang.embeddedLangs) {
      for (const embeddedLang of lang.embeddedLangs)
        this._langGraph.set(embeddedLang, this._langMap.get(embeddedLang));
    }
  }
}

class Resolver {
  _langs = /* @__PURE__ */ new Map();
  _scopeToLang = /* @__PURE__ */ new Map();
  _injections = /* @__PURE__ */ new Map();
  _onigLib;
  constructor(engine, langs) {
    this._onigLib = {
      createOnigScanner: (patterns) => engine.createScanner(patterns),
      createOnigString: (s) => engine.createString(s)
    };
    langs.forEach((i) => this.addLanguage(i));
  }
  get onigLib() {
    return this._onigLib;
  }
  getLangRegistration(langIdOrAlias) {
    return this._langs.get(langIdOrAlias);
  }
  loadGrammar(scopeName) {
    return this._scopeToLang.get(scopeName);
  }
  addLanguage(l) {
    this._langs.set(l.name, l);
    if (l.aliases) {
      l.aliases.forEach((a) => {
        this._langs.set(a, l);
      });
    }
    this._scopeToLang.set(l.scopeName, l);
    if (l.injectTo) {
      l.injectTo.forEach((i) => {
        if (!this._injections.get(i))
          this._injections.set(i, []);
        this._injections.get(i).push(l.scopeName);
      });
    }
  }
  getInjections(scopeName) {
    const scopeParts = scopeName.split(".");
    let injections = [];
    for (let i = 1; i <= scopeParts.length; i++) {
      const subScopeName = scopeParts.slice(0, i).join(".");
      injections = [...injections, ...this._injections.get(subScopeName) || []];
    }
    return injections;
  }
}

let instancesCount = 0;
function createShikiInternalSync(options) {
  instancesCount += 1;
  if (options.warnings !== false && instancesCount >= 10 && instancesCount % 10 === 0)
    console.warn(`[Shiki] ${instancesCount} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`);
  let isDisposed = false;
  if (!options.engine)
    throw new ShikiError("`engine` option is required for synchronous mode");
  const langs = (options.langs || []).flat(1);
  const themes = (options.themes || []).flat(1).map(normalizeTheme);
  const resolver = new Resolver(options.engine, langs);
  const _registry = new Registry(resolver, themes, langs, options.langAlias);
  let _lastTheme;
  function getLanguage(name) {
    ensureNotDisposed();
    const _lang = _registry.getGrammar(typeof name === "string" ? name : name.name);
    if (!_lang)
      throw new ShikiError(`Language \`${name}\` not found, you may need to load it first`);
    return _lang;
  }
  function getTheme(name) {
    if (name === "none")
      return { bg: "", fg: "", name: "none", settings: [], type: "dark" };
    ensureNotDisposed();
    const _theme = _registry.getTheme(name);
    if (!_theme)
      throw new ShikiError(`Theme \`${name}\` not found, you may need to load it first`);
    return _theme;
  }
  function setTheme(name) {
    ensureNotDisposed();
    const theme = getTheme(name);
    if (_lastTheme !== name) {
      _registry.setTheme(theme);
      _lastTheme = name;
    }
    const colorMap = _registry.getColorMap();
    return {
      theme,
      colorMap
    };
  }
  function getLoadedThemes() {
    ensureNotDisposed();
    return _registry.getLoadedThemes();
  }
  function getLoadedLanguages() {
    ensureNotDisposed();
    return _registry.getLoadedLanguages();
  }
  function loadLanguageSync(...langs2) {
    ensureNotDisposed();
    _registry.loadLanguages(langs2.flat(1));
  }
  async function loadLanguage(...langs2) {
    return loadLanguageSync(await resolveLangs(langs2));
  }
  function loadThemeSync(...themes2) {
    ensureNotDisposed();
    for (const theme of themes2.flat(1)) {
      _registry.loadTheme(theme);
    }
  }
  async function loadTheme(...themes2) {
    ensureNotDisposed();
    return loadThemeSync(await resolveThemes(themes2));
  }
  function ensureNotDisposed() {
    if (isDisposed)
      throw new ShikiError("Shiki instance has been disposed");
  }
  function dispose() {
    if (isDisposed)
      return;
    isDisposed = true;
    _registry.dispose();
    instancesCount -= 1;
  }
  return {
    setTheme,
    getTheme,
    getLanguage,
    getLoadedThemes,
    getLoadedLanguages,
    loadLanguage,
    loadLanguageSync,
    loadTheme,
    loadThemeSync,
    dispose,
    [Symbol.dispose]: dispose
  };
}
function createHighlighterCoreSync(options) {
  const internal = createShikiInternalSync(options);
  return {
    getLastGrammarState: (...args) => getLastGrammarState(internal, ...args),
    codeToTokensBase: (code, options2) => codeToTokensBase(internal, code, options2),
    codeToTokensWithThemes: (code, options2) => codeToTokensWithThemes(internal, code, options2),
    codeToTokens: (code, options2) => codeToTokens(internal, code, options2),
    codeToHast: (code, options2) => codeToHast(internal, code, options2),
    codeToHtml: (code, options2) => codeToHtml(internal, code, options2),
    getBundledLanguages: () => ({}),
    getBundledThemes: () => ({}),
    ...internal,
    getInternalContext: () => internal
  };
}

function r$3(e){if([...e].length!==1)throw new Error(`Expected "${e}" to be a single code point`);return e.codePointAt(0)}function l$1(e,t,n){return e.has(t)||e.set(t,n),e.get(t)}const i=new Set(["alnum","alpha","ascii","blank","cntrl","digit","graph","lower","print","punct","space","upper","word","xdigit"]),o$1=String.raw;function u(e,t){if(e==null)throw new Error(t??"Value expected");return e}

const m$1=o$1`\[\^?`,b$1=`c.? | C(?:-.?)?|${o$1`[pP]\{(?:\^?[-\x20_]*[A-Za-z][-\x20\w]*\})?`}|${o$1`x[89A-Fa-f]\p{AHex}(?:\\x[89A-Fa-f]\p{AHex})*`}|${o$1`u(?:\p{AHex}{4})? | x\{[^\}]*\}? | x\p{AHex}{0,2}`}|${o$1`o\{[^\}]*\}?`}|${o$1`\d{1,3}`}`,y$1=/[?*+][?+]?|\{(?:\d+(?:,\d*)?|,\d+)\}\??/,C$1=new RegExp(o$1`
  \\ (?:
    ${b$1}
    | [gk]<[^>]*>?
    | [gk]'[^']*'?
    | .
  )
  | \( (?:
    \? (?:
      [:=!>({]
      | <[=!]
      | <[^>]*>
      | '[^']*'
      | ~\|?
      | #(?:[^)\\]|\\.?)*
      | [^:)]*[:)]
    )?
    | \*[^\)]*\)?
  )?
  | (?:${y$1.source})+
  | ${m$1}
  | .
`.replace(/\s+/g,""),"gsu"),T$1=new RegExp(o$1`
  \\ (?:
    ${b$1}
    | .
  )
  | \[:(?:\^?\p{Alpha}+|\^):\]
  | ${m$1}
  | &&
  | .
`.replace(/\s+/g,""),"gsu");function M$1(e,n={}){const t={flags:"",...n,rules:{captureGroup:false,singleline:false,...n.rules}};if(typeof e!="string")throw new Error("String expected as pattern");const o=Y(t.flags),s=[o.extended],a={captureGroup:t.rules.captureGroup,getCurrentModX(){return s.at(-1)},numOpenGroups:0,popModX(){s.pop();},pushModX(u){s.push(u);},replaceCurrentModX(u){s[s.length-1]=u;},singleline:t.rules.singleline};let r=[],i;for(C$1.lastIndex=0;i=C$1.exec(e);){const u=F$1(a,e,i[0],C$1.lastIndex);u.tokens?r.push(...u.tokens):u.token&&r.push(u.token),u.lastIndex!==void 0&&(C$1.lastIndex=u.lastIndex);}const l=[];let c=0;r.filter(u=>u.type==="GroupOpen").forEach(u=>{u.kind==="capturing"?u.number=++c:u.raw==="("&&l.push(u);}),c||l.forEach((u,S)=>{u.kind="capturing",u.number=S+1;});const g=c||l.length;return {tokens:r.map(u=>u.type==="EscapedNumber"?ee$1(u,g):u).flat(),flags:o}}function F$1(e,n,t,o){const[s,a]=t;if(t==="["||t==="[^"){const r=K$1(n,t,o);return {tokens:r.tokens,lastIndex:r.lastIndex}}if(s==="\\"){if("AbBGyYzZ".includes(a))return {token:w$1(t,t)};if(/^\\g[<']/.test(t)){if(!/^\\g(?:<[^>]+>|'[^']+')$/.test(t))throw new Error(`Invalid group name "${t}"`);return {token:R$1(t)}}if(/^\\k[<']/.test(t)){if(!/^\\k(?:<[^>]+>|'[^']+')$/.test(t))throw new Error(`Invalid group name "${t}"`);return {token:A$1(t)}}if(a==="K")return {token:I$1("keep",t)};if(a==="N"||a==="R")return {token:k$1("newline",t,{negate:a==="N"})};if(a==="O")return {token:k$1("any",t)};if(a==="X")return {token:k$1("text_segment",t)};const r=x(t,{inCharClass:false});return Array.isArray(r)?{tokens:r}:{token:r}}if(s==="("){if(a==="*")return {token:j(t)};if(t==="(?{")throw new Error(`Unsupported callout "${t}"`);if(t.startsWith("(?#")){if(n[o]!==")")throw new Error('Unclosed comment group "(?#"');return {lastIndex:o+1}}if(/^\(\?[-imx]+[:)]$/.test(t))return {token:L$1(t,e)};if(e.pushModX(e.getCurrentModX()),e.numOpenGroups++,t==="("&&!e.captureGroup||t==="(?:")return {token:f$1("group",t)};if(t==="(?>")return {token:f$1("atomic",t)};if(t==="(?="||t==="(?!"||t==="(?<="||t==="(?<!")return {token:f$1(t[2]==="<"?"lookbehind":"lookahead",t,{negate:t.endsWith("!")})};if(t==="("&&e.captureGroup||t.startsWith("(?<")&&t.endsWith(">")||t.startsWith("(?'")&&t.endsWith("'"))return {token:f$1("capturing",t,{...t!=="("&&{name:t.slice(3,-1)}})};if(t.startsWith("(?~")){if(t==="(?~|")throw new Error(`Unsupported absence function kind "${t}"`);return {token:f$1("absence_repeater",t)}}throw t==="(?("?new Error(`Unsupported conditional "${t}"`):new Error(`Invalid or unsupported group option "${t}"`)}if(t===")"){if(e.popModX(),e.numOpenGroups--,e.numOpenGroups<0)throw new Error('Unmatched ")"');return {token:Q$1(t)}}if(e.getCurrentModX()){if(t==="#"){const r=n.indexOf(`
`,o);return {lastIndex:r===-1?n.length:r}}if(/^\s$/.test(t)){const r=/\s+/y;return r.lastIndex=o,{lastIndex:r.exec(n)?r.lastIndex:o}}}if(t===".")return {token:k$1("dot",t)};if(t==="^"||t==="$"){const r=e.singleline?{"^":o$1`\A`,$:o$1`\Z`}[t]:t;return {token:w$1(r,t)}}return t==="|"?{token:P$1(t)}:y$1.test(t)?{tokens:te$1(t)}:{token:d(r$3(t),t)}}function K$1(e,n,t){const o=[E$1(n[1]==="^",n)];let s=1,a;for(T$1.lastIndex=t;a=T$1.exec(e);){const r=a[0];if(r[0]==="["&&r[1]!==":")s++,o.push(E$1(r[1]==="^",r));else if(r==="]"){if(o.at(-1).type==="CharacterClassOpen")o.push(d(93,r));else if(s--,o.push(z$1(r)),!s)break}else {const i=X$1(r);Array.isArray(i)?o.push(...i):o.push(i);}}return {tokens:o,lastIndex:T$1.lastIndex||e.length}}function X$1(e){if(e[0]==="\\")return x(e,{inCharClass:true});if(e[0]==="["){const n=/\[:(?<negate>\^?)(?<name>[a-z]+):\]/.exec(e);if(!n||!i.has(n.groups.name))throw new Error(`Invalid POSIX class "${e}"`);return k$1("posix",e,{value:n.groups.name,negate:!!n.groups.negate})}return e==="-"?U$1(e):e==="&&"?H(e):d(r$3(e),e)}function x(e,{inCharClass:n}){const t=e[1];if(t==="c"||t==="C")return Z(e);if("dDhHsSwW".includes(t))return q(e);if(e.startsWith(o$1`\o{`))throw new Error(`Incomplete, invalid, or unsupported octal code point "${e}"`);if(/^\\[pP]\{/.test(e)){if(e.length===3)throw new Error(`Incomplete or invalid Unicode property "${e}"`);return V$1(e)}if(/^\\x[89A-Fa-f]\p{AHex}/u.test(e))try{const o=e.split(/\\x/).slice(1).map(i=>parseInt(i,16)),s=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}).decode(new Uint8Array(o)),a=new TextEncoder;return [...s].map(i=>{const l=[...a.encode(i)].map(c=>`\\x${c.toString(16)}`).join("");return d(r$3(i),l)})}catch{throw new Error(`Multibyte code "${e}" incomplete or invalid in Oniguruma`)}if(t==="u"||t==="x")return d(J$1(e),e);if($$1.has(t))return d($$1.get(t),e);if(/\d/.test(t))return W$1(n,e);if(e==="\\")throw new Error(o$1`Incomplete escape "\"`);if(t==="M")throw new Error(`Unsupported meta "${e}"`);if([...e].length===2)return d(e.codePointAt(1),e);throw new Error(`Unexpected escape "${e}"`)}function P$1(e){return {type:"Alternator",raw:e}}function w$1(e,n){return {type:"Assertion",kind:e,raw:n}}function A$1(e){return {type:"Backreference",raw:e}}function d(e,n){return {type:"Character",value:e,raw:n}}function z$1(e){return {type:"CharacterClassClose",raw:e}}function U$1(e){return {type:"CharacterClassHyphen",raw:e}}function H(e){return {type:"CharacterClassIntersector",raw:e}}function E$1(e,n){return {type:"CharacterClassOpen",negate:e,raw:n}}function k$1(e,n,t={}){return {type:"CharacterSet",kind:e,...t,raw:n}}function I$1(e,n,t={}){return e==="keep"?{type:"Directive",kind:e,raw:n}:{type:"Directive",kind:e,flags:u(t.flags),raw:n}}function W$1(e,n){return {type:"EscapedNumber",inCharClass:e,raw:n}}function Q$1(e){return {type:"GroupClose",raw:e}}function f$1(e,n,t={}){return {type:"GroupOpen",kind:e,...t,raw:n}}function D$1(e,n,t,o){return {type:"NamedCallout",kind:e,tag:n,arguments:t,raw:o}}function _$1(e,n,t,o){return {type:"Quantifier",kind:e,min:n,max:t,raw:o}}function R$1(e){return {type:"Subroutine",raw:e}}const B$1=new Set(["COUNT","CMP","ERROR","FAIL","MAX","MISMATCH","SKIP","TOTAL_COUNT"]),$$1=new Map([["a",7],["b",8],["e",27],["f",12],["n",10],["r",13],["t",9],["v",11]]);function Z(e){const n=e[1]==="c"?e[2]:e[3];if(!n||!/[A-Za-z]/.test(n))throw new Error(`Unsupported control character "${e}"`);return d(r$3(n.toUpperCase())-64,e)}function L$1(e,n){let{on:t,off:o}=/^\(\?(?<on>[imx]*)(?:-(?<off>[-imx]*))?/.exec(e).groups;o??="";const s=(n.getCurrentModX()||t.includes("x"))&&!o.includes("x"),a=v(t),r=v(o),i={};if(a&&(i.enable=a),r&&(i.disable=r),e.endsWith(")"))return n.replaceCurrentModX(s),I$1("flags",e,{flags:i});if(e.endsWith(":"))return n.pushModX(s),n.numOpenGroups++,f$1("group",e,{...(a||r)&&{flags:i}});throw new Error(`Unexpected flag modifier "${e}"`)}function j(e){const n=/\(\*(?<name>[A-Za-z_]\w*)?(?:\[(?<tag>(?:[A-Za-z_]\w*)?)\])?(?:\{(?<args>[^}]*)\})?\)/.exec(e);if(!n)throw new Error(`Incomplete or invalid named callout "${e}"`);const{name:t,tag:o,args:s}=n.groups;if(!t)throw new Error(`Invalid named callout "${e}"`);if(o==="")throw new Error(`Named callout tag with empty value not allowed "${e}"`);const a=s?s.split(",").filter(g=>g!=="").map(g=>/^[+-]?\d+$/.test(g)?+g:g):[],[r,i,l]=a,c=B$1.has(t)?t.toLowerCase():"custom";switch(c){case "fail":case "mismatch":case "skip":if(a.length>0)throw new Error(`Named callout arguments not allowed "${a}"`);break;case "error":if(a.length>1)throw new Error(`Named callout allows only one argument "${a}"`);if(typeof r=="string")throw new Error(`Named callout argument must be a number "${r}"`);break;case "max":if(!a.length||a.length>2)throw new Error(`Named callout must have one or two arguments "${a}"`);if(typeof r=="string"&&!/^[A-Za-z_]\w*$/.test(r))throw new Error(`Named callout argument one must be a tag or number "${r}"`);if(a.length===2&&(typeof i=="number"||!/^[<>X]$/.test(i)))throw new Error(`Named callout optional argument two must be '<', '>', or 'X' "${i}"`);break;case "count":case "total_count":if(a.length>1)throw new Error(`Named callout allows only one argument "${a}"`);if(a.length===1&&(typeof r=="number"||!/^[<>X]$/.test(r)))throw new Error(`Named callout optional argument must be '<', '>', or 'X' "${r}"`);break;case "cmp":if(a.length!==3)throw new Error(`Named callout must have three arguments "${a}"`);if(typeof r=="string"&&!/^[A-Za-z_]\w*$/.test(r))throw new Error(`Named callout argument one must be a tag or number "${r}"`);if(typeof i=="number"||!/^(?:[<>!=]=|[<>])$/.test(i))throw new Error(`Named callout argument two must be '==', '!=', '>', '<', '>=', or '<=' "${i}"`);if(typeof l=="string"&&!/^[A-Za-z_]\w*$/.test(l))throw new Error(`Named callout argument three must be a tag or number "${l}"`);break;case "custom":throw new Error(`Undefined callout name "${t}"`);default:throw new Error(`Unexpected named callout kind "${c}"`)}return D$1(c,o??null,s?.split(",")??null,e)}function O$1(e){let n=null,t,o;if(e[0]==="{"){const{minStr:s,maxStr:a}=/^\{(?<minStr>\d*)(?:,(?<maxStr>\d*))?/.exec(e).groups,r=1e5;if(+s>r||a&&+a>r)throw new Error("Quantifier value unsupported in Oniguruma");if(t=+s,o=a===void 0?+s:a===""?1/0:+a,t>o&&(n="possessive",[t,o]=[o,t]),e.endsWith("?")){if(n==="possessive")throw new Error('Unsupported possessive interval quantifier chain with "?"');n="lazy";}else n||(n="greedy");}else t=e[0]==="+"?1:0,o=e[0]==="?"?1:1/0,n=e[1]==="+"?"possessive":e[1]==="?"?"lazy":"greedy";return _$1(n,t,o,e)}function q(e){const n=e[1].toLowerCase();return k$1({d:"digit",h:"hex",s:"space",w:"word"}[n],e,{negate:e[1]!==n})}function V$1(e){const{p:n,neg:t,value:o}=/^\\(?<p>[pP])\{(?<neg>\^?)(?<value>[^}]+)/.exec(e).groups;return k$1("property",e,{value:o,negate:n==="P"&&!t||n==="p"&&!!t})}function v(e){const n={};return e.includes("i")&&(n.ignoreCase=true),e.includes("m")&&(n.dotAll=true),e.includes("x")&&(n.extended=true),Object.keys(n).length?n:null}function Y(e){const n={ignoreCase:false,dotAll:false,extended:false,digitIsAscii:false,posixIsAscii:false,spaceIsAscii:false,wordIsAscii:false,textSegmentMode:null};for(let t=0;t<e.length;t++){const o=e[t];if(!"imxDPSWy".includes(o))throw new Error(`Invalid flag "${o}"`);if(o==="y"){if(!/^y{[gw]}/.test(e.slice(t)))throw new Error('Invalid or unspecified flag "y" mode');n.textSegmentMode=e[t+2]==="g"?"grapheme":"word",t+=3;continue}n[{i:"ignoreCase",m:"dotAll",x:"extended",D:"digitIsAscii",P:"posixIsAscii",S:"spaceIsAscii",W:"wordIsAscii"}[o]]=true;}return n}function J$1(e){if(/^(?:\\u(?!\p{AHex}{4})|\\x(?!\p{AHex}{1,2}|\{\p{AHex}{1,8}\}))/u.test(e))throw new Error(`Incomplete or invalid escape "${e}"`);const n=e[2]==="{"?/^\\x\{\s*(?<hex>\p{AHex}+)/u.exec(e).groups.hex:e.slice(2);return parseInt(n,16)}function ee$1(e,n){const{raw:t,inCharClass:o}=e,s=t.slice(1);if(!o&&(s!=="0"&&s.length===1||s[0]!=="0"&&+s<=n))return [A$1(t)];const a=[],r=s.match(/^[0-7]+|\d/g);for(let i=0;i<r.length;i++){const l=r[i];let c;if(i===0&&l!=="8"&&l!=="9"){if(c=parseInt(l,8),c>127)throw new Error(o$1`Octal encoded byte above 177 unsupported "${t}"`)}else c=r$3(l);a.push(d(c,(i===0?"\\":"")+l));}return a}function te$1(e){const n=[],t=new RegExp(y$1,"gy");let o;for(;o=t.exec(e);){const s=o[0];if(s[0]==="{"){const a=/^\{(?<min>\d+),(?<max>\d+)\}\??$/.exec(s);if(a){const{min:r,max:i}=a.groups;if(+r>+i&&s.endsWith("?")){t.lastIndex--,n.push(O$1(s.slice(0,-1)));continue}}}n.push(O$1(s));}return n}

function o(e,t){if(!Array.isArray(e.body))throw new Error("Expected node with body array");if(e.body.length!==1)return  false;const r=e.body[0];return !t||Object.keys(t).every(n=>t[n]===r[n])}function s(e){return y.has(e.type)}const y=new Set(["AbsenceFunction","Backreference","CapturingGroup","Character","CharacterClass","CharacterSet","Group","Quantifier","Subroutine"]);

function J(e,r={}){const n={flags:"",normalizeUnknownPropertyNames:false,skipBackrefValidation:false,skipLookbehindValidation:false,skipPropertyNameValidation:false,unicodePropertyMap:null,...r,rules:{captureGroup:false,singleline:false,...r.rules}},t=M$1(e,{flags:n.flags,rules:{captureGroup:n.rules.captureGroup,singleline:n.rules.singleline}}),s=(p,N)=>{const u=t.tokens[o.nextIndex];switch(o.parent=p,o.nextIndex++,u.type){case "Alternator":return b();case "Assertion":return W(u);case "Backreference":return X(u,o);case "Character":return m(u.value,{useLastValid:!!N.isCheckingRangeEnd});case "CharacterClassHyphen":return ee(u,o,N);case "CharacterClassOpen":return re(u,o,N);case "CharacterSet":return ne(u,o);case "Directive":return I(u.kind,{flags:u.flags});case "GroupOpen":return te(u,o,N);case "NamedCallout":return U(u.kind,u.tag,u.arguments);case "Quantifier":return oe(u,o);case "Subroutine":return ae(u,o);default:throw new Error(`Unexpected token type "${u.type}"`)}},o={capturingGroups:[],hasNumberedRef:false,namedGroupsByName:new Map,nextIndex:0,normalizeUnknownPropertyNames:n.normalizeUnknownPropertyNames,parent:null,skipBackrefValidation:n.skipBackrefValidation,skipLookbehindValidation:n.skipLookbehindValidation,skipPropertyNameValidation:n.skipPropertyNameValidation,subroutines:[],tokens:t.tokens,unicodePropertyMap:n.unicodePropertyMap,walk:s},i=B(T(t.flags));let d=i.body[0];for(;o.nextIndex<t.tokens.length;){const p=s(d,{});p.type==="Alternative"?(i.body.push(p),d=p):d.body.push(p);}const{capturingGroups:a,hasNumberedRef:l,namedGroupsByName:c,subroutines:f}=o;if(l&&c.size&&!n.rules.captureGroup)throw new Error("Numbered backref/subroutine not allowed when using named capture");for(const{ref:p}of f)if(typeof p=="number"){if(p>a.length)throw new Error("Subroutine uses a group number that's not defined");p&&(a[p-1].isSubroutined=true);}else if(c.has(p)){if(c.get(p).length>1)throw new Error(o$1`Subroutine uses a duplicate group name "\g<${p}>"`);c.get(p)[0].isSubroutined=true;}else throw new Error(o$1`Subroutine uses a group name that's not defined "\g<${p}>"`);return i}function W({kind:e}){return F(u({"^":"line_start",$:"line_end","\\A":"string_start","\\b":"word_boundary","\\B":"word_boundary","\\G":"search_start","\\y":"text_segment_boundary","\\Y":"text_segment_boundary","\\z":"string_end","\\Z":"string_end_newline"}[e],`Unexpected assertion kind "${e}"`),{negate:e===o$1`\B`||e===o$1`\Y`})}function X({raw:e},r){const n=/^\\k[<']/.test(e),t=n?e.slice(3,-1):e.slice(1),s=(o,i=false)=>{const d=r.capturingGroups.length;let a=false;if(o>d)if(r.skipBackrefValidation)a=true;else throw new Error(`Not enough capturing groups defined to the left "${e}"`);return r.hasNumberedRef=true,k(i?d+1-o:o,{orphan:a})};if(n){const o=/^(?<sign>-?)0*(?<num>[1-9]\d*)$/.exec(t);if(o)return s(+o.groups.num,!!o.groups.sign);if(/[-+]/.test(t))throw new Error(`Invalid backref name "${e}"`);if(!r.namedGroupsByName.has(t))throw new Error(`Group name not defined to the left "${e}"`);return k(t)}return s(+t)}function ee(e,r,n){const{tokens:t,walk:s}=r,o=r.parent,i=o.body.at(-1),d=t[r.nextIndex];if(!n.isCheckingRangeEnd&&i&&i.type!=="CharacterClass"&&i.type!=="CharacterClassRange"&&d&&d.type!=="CharacterClassOpen"&&d.type!=="CharacterClassClose"&&d.type!=="CharacterClassIntersector"){const a=s(o,{...n,isCheckingRangeEnd:true});if(i.type==="Character"&&a.type==="Character")return o.body.pop(),L(i,a);throw new Error("Invalid character class range")}return m(r$3("-"))}function re({negate:e},r,n){const{tokens:t,walk:s}=r,o=t[r.nextIndex],i=[C()];let d=z(o);for(;d.type!=="CharacterClassClose";){if(d.type==="CharacterClassIntersector")i.push(C()),r.nextIndex++;else {const l=i.at(-1);l.body.push(s(l,n));}d=z(t[r.nextIndex],o);}const a=C({negate:e});return i.length===1?a.body=i[0].body:(a.kind="intersection",a.body=i.map(l=>l.body.length===1?l.body[0]:l)),r.nextIndex++,a}function ne({kind:e,negate:r,value:n},t){const{normalizeUnknownPropertyNames:s,skipPropertyNameValidation:o,unicodePropertyMap:i$1}=t;if(e==="property"){const d=w(n);if(i.has(d)&&!i$1?.has(d))e="posix",n=d;else return Q(n,{negate:r,normalizeUnknownPropertyNames:s,skipPropertyNameValidation:o,unicodePropertyMap:i$1})}return e==="posix"?R(n,{negate:r}):E(e,{negate:r})}function te(e,r,n){const{tokens:t,capturingGroups:s,namedGroupsByName:o,skipLookbehindValidation:i,walk:d}=r,a=ie(e),l=a.type==="AbsenceFunction",c=$(a),f=c&&a.negate;if(a.type==="CapturingGroup"&&(s.push(a),a.name&&l$1(o,a.name,[]).push(a)),l&&n.isInAbsenceFunction)throw new Error("Nested absence function not supported by Oniguruma");let p=D(t[r.nextIndex]);for(;p.type!=="GroupClose";){if(p.type==="Alternator")a.body.push(b()),r.nextIndex++;else {const N=a.body.at(-1),u=d(N,{...n,isInAbsenceFunction:n.isInAbsenceFunction||l,isInLookbehind:n.isInLookbehind||c,isInNegLookbehind:n.isInNegLookbehind||f});if(N.body.push(u),(c||n.isInLookbehind)&&!i){const v="Lookbehind includes a pattern not allowed by Oniguruma";if(f||n.isInNegLookbehind){if(M(u)||u.type==="CapturingGroup")throw new Error(v)}else if(M(u)||$(u)&&u.negate)throw new Error(v)}}p=D(t[r.nextIndex]);}return r.nextIndex++,a}function oe({kind:e,min:r,max:n},t){const s$1=t.parent,o=s$1.body.at(-1);if(!o||!s(o))throw new Error("Quantifier requires a repeatable token");const i=_(e,r,n,o);return s$1.body.pop(),i}function ae({raw:e},r){const{capturingGroups:n,subroutines:t}=r;let s=e.slice(3,-1);const o=/^(?<sign>[-+]?)0*(?<num>[1-9]\d*)$/.exec(s);if(o){const d=+o.groups.num,a=n.length;if(r.hasNumberedRef=true,s={"":d,"+":a+d,"-":a+1-d}[o.groups.sign],s<1)throw new Error("Invalid subroutine number")}else s==="0"&&(s=0);const i=O(s);return t.push(i),i}function G(e,r){return {type:"AbsenceFunction",kind:e,body:h(r?.body)}}function b(e){return {type:"Alternative",body:V(e?.body)}}function F(e,r){const n={type:"Assertion",kind:e};return (e==="word_boundary"||e==="text_segment_boundary")&&(n.negate=!!r?.negate),n}function k(e,r){const n=!!r?.orphan;return {type:"Backreference",ref:e,...n&&{orphan:n}}}function P(e,r){const n={name:void 0,isSubroutined:false,...r};if(n.name!==void 0&&!se(n.name))throw new Error(`Group name "${n.name}" invalid in Oniguruma`);return {type:"CapturingGroup",number:e,...n.name&&{name:n.name},...n.isSubroutined&&{isSubroutined:n.isSubroutined},body:h(r?.body)}}function m(e,r){const n={useLastValid:false,...r};if(e>1114111){const t=e.toString(16);if(n.useLastValid)e=1114111;else throw e>1310719?new Error(`Invalid code point out of range "\\x{${t}}"`):new Error(`Invalid code point out of range in JS "\\x{${t}}"`)}return {type:"Character",value:e}}function C(e){const r={kind:"union",negate:false,...e};return {type:"CharacterClass",kind:r.kind,negate:r.negate,body:V(e?.body)}}function L(e,r){if(r.value<e.value)throw new Error("Character class range out of order");return {type:"CharacterClassRange",min:e,max:r}}function E(e,r){const n=!!r?.negate,t={type:"CharacterSet",kind:e};return (e==="digit"||e==="hex"||e==="newline"||e==="space"||e==="word")&&(t.negate=n),(e==="text_segment"||e==="newline"&&!n)&&(t.variableLength=true),t}function I(e,r={}){if(e==="keep")return {type:"Directive",kind:e};if(e==="flags")return {type:"Directive",kind:e,flags:u(r.flags)};throw new Error(`Unexpected directive kind "${e}"`)}function T(e){return {type:"Flags",...e}}function A(e){const r=e?.atomic,n=e?.flags;if(r&&n)throw new Error("Atomic group cannot have flags");return {type:"Group",...r&&{atomic:r},...n&&{flags:n},body:h(e?.body)}}function K(e){const r={behind:false,negate:false,...e};return {type:"LookaroundAssertion",kind:r.behind?"lookbehind":"lookahead",negate:r.negate,body:h(e?.body)}}function U(e,r,n){return {type:"NamedCallout",kind:e,tag:r,arguments:n}}function R(e,r){const n=!!r?.negate;if(!i.has(e))throw new Error(`Invalid POSIX class "${e}"`);return {type:"CharacterSet",kind:"posix",value:e,negate:n}}function _(e,r,n,t){if(r>n)throw new Error("Invalid reversed quantifier range");return {type:"Quantifier",kind:e,min:r,max:n,body:t}}function B(e,r){return {type:"Regex",body:h(r?.body),flags:e}}function O(e){return {type:"Subroutine",ref:e}}function Q(e,r){const n={negate:false,normalizeUnknownPropertyNames:false,skipPropertyNameValidation:false,unicodePropertyMap:null,...r};let t=n.unicodePropertyMap?.get(w(e));if(!t){if(n.normalizeUnknownPropertyNames)t=de(e);else if(n.unicodePropertyMap&&!n.skipPropertyNameValidation)throw new Error(o$1`Invalid Unicode property "\p{${e}}"`)}return {type:"CharacterSet",kind:"property",value:t??e,negate:n.negate}}function ie({flags:e,kind:r,name:n,negate:t,number:s}){switch(r){case "absence_repeater":return G("repeater");case "atomic":return A({atomic:true});case "capturing":return P(s,{name:n});case "group":return A({flags:e});case "lookahead":case "lookbehind":return K({behind:r==="lookbehind",negate:t});default:throw new Error(`Unexpected group kind "${r}"`)}}function h(e){if(e===void 0)e=[b()];else if(!Array.isArray(e)||!e.length||!e.every(r=>r.type==="Alternative"))throw new Error("Invalid body; expected array of one or more Alternative nodes");return e}function V(e){if(e===void 0)e=[];else if(!Array.isArray(e)||!e.every(r=>!!r.type))throw new Error("Invalid body; expected array of nodes");return e}function M(e){return e.type==="LookaroundAssertion"&&e.kind==="lookahead"}function $(e){return e.type==="LookaroundAssertion"&&e.kind==="lookbehind"}function se(e){return /^[\p{Alpha}\p{Pc}][^)]*$/u.test(e)}function de(e){return e.trim().replace(/[- _]+/g,"_").replace(/[A-Z][a-z]+(?=[A-Z])/g,"$&_").replace(/[A-Za-z]+/g,r=>r[0].toUpperCase()+r.slice(1).toLowerCase())}function w(e){return e.replace(/[- _]+/g,"").toLowerCase()}function z(e,r){return u(e,`${r?.type==="Character"&&r.value===93?"Empty":"Unclosed"} character class`)}function D(e){return u(e,"Unclosed group")}

function S(a,v,N=null){function u$1(e,s){for(let t=0;t<e.length;t++){const r=n(e[t],s,t,e);t=Math.max(-1,t+r);}}function n(e,s=null,t=null,r=null){let i=0,c=false;const d={node:e,parent:s,key:t,container:r,root:a,remove(){f(r).splice(Math.max(0,l(t)+i),1),i--,c=true;},removeAllNextSiblings(){return f(r).splice(l(t)+1)},removeAllPrevSiblings(){const o=l(t)+i;return i-=o,f(r).splice(0,Math.max(0,o))},replaceWith(o,y={}){const b=!!y.traverse;r?r[Math.max(0,l(t)+i)]=o:u(s,"Can't replace root node")[t]=o,b&&n(o,s,t,r),c=true;},replaceWithMultiple(o,y={}){const b=!!y.traverse;if(f(r).splice(Math.max(0,l(t)+i),1,...o),i+=o.length-1,b){let g=0;for(let x=0;x<o.length;x++)g+=n(o[x],s,l(t)+x+g,r);}c=true;},skip(){c=true;}},{type:m}=e,h=v["*"],p=v[m],R=typeof h=="function"?h:h?.enter,P=typeof p=="function"?p:p?.enter;if(R?.(d,N),P?.(d,N),!c)switch(m){case "AbsenceFunction":case "CapturingGroup":case "Group":u$1(e.body,e);break;case "Alternative":case "CharacterClass":u$1(e.body,e);break;case "Assertion":case "Backreference":case "Character":case "CharacterSet":case "Directive":case "Flags":case "NamedCallout":case "Subroutine":break;case "CharacterClassRange":n(e.min,e,"min"),n(e.max,e,"max");break;case "LookaroundAssertion":u$1(e.body,e);break;case "Quantifier":n(e.body,e,"body");break;case "Regex":u$1(e.body,e),n(e.flags,e,"flags");break;default:throw new Error(`Unexpected node type "${m}"`)}return p?.exit?.(d,N),h?.exit?.(d,N),i}return n(a),a}function f(a){if(!Array.isArray(a))throw new Error("Container expected");return a}function l(a){if(typeof a!="number")throw new Error("Numeric key expected");return a}

// Separating some utils for improved tree shaking of the `./internals` export

const noncapturingDelim = String.raw`\(\?(?:[:=!>A-Za-z\-]|<[=!]|\(DEFINE\))`;

/**
Updates the array in place by incrementing each value greater than or equal to the threshold.
@param {Array<number>} arr
@param {number} threshold
*/
function incrementIfAtLeast$1(arr, threshold) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] >= threshold) {
      arr[i]++;
    }
  }
}

/**
@param {string} str
@param {number} pos
@param {string} oldValue
@param {string} newValue
@returns {string}
*/
function spliceStr(str, pos, oldValue, newValue) {
  return str.slice(0, pos) + newValue + str.slice(pos + oldValue.length);
}

// Constant properties for tracking regex syntax context
const Context = Object.freeze({
  DEFAULT: 'DEFAULT',
  CHAR_CLASS: 'CHAR_CLASS',
});

/**
Replaces all unescaped instances of a regex pattern in the given context, using a replacement
string or callback.

Doesn't skip over complete multicharacter tokens (only `\` plus its folowing char) so must be used
with knowledge of what's safe to do given regex syntax. Assumes UnicodeSets-mode syntax.
@param {string} expression Search target
@param {string} needle Search as a regex pattern, with flags `su` applied
@param {string | (match: RegExpExecArray, details: {
  context: 'DEFAULT' | 'CHAR_CLASS';
  negated: boolean;
}) => string} replacement
@param {'DEFAULT' | 'CHAR_CLASS'} [context] All contexts if not specified
@returns {string} Updated expression
@example
const str = '.\\.\\\\.[[\\.].].';
replaceUnescaped(str, '\\.', '@');
// → '@\\.\\\\@[[\\.]@]@'
replaceUnescaped(str, '\\.', '@', Context.DEFAULT);
// → '@\\.\\\\@[[\\.].]@'
replaceUnescaped(str, '\\.', '@', Context.CHAR_CLASS);
// → '.\\.\\\\.[[\\.]@].'
*/
function replaceUnescaped(expression, needle, replacement, context) {
  const re = new RegExp(String.raw`${needle}|(?<$skip>\[\^?|\\?.)`, 'gsu');
  const negated = [false];
  let numCharClassesOpen = 0;
  let result = '';
  for (const match of expression.matchAll(re)) {
    const {0: m, groups: {$skip}} = match;
    if (!$skip && (!context || (context === Context.DEFAULT) === !numCharClassesOpen)) {
      if (replacement instanceof Function) {
        result += replacement(match, {
          context: numCharClassesOpen ? Context.CHAR_CLASS : Context.DEFAULT,
          negated: negated[negated.length - 1],
        });
      } else {
        result += replacement;
      }
      continue;
    }
    if (m[0] === '[') {
      numCharClassesOpen++;
      negated.push(m[1] === '^');
    } else if (m === ']' && numCharClassesOpen) {
      numCharClassesOpen--;
      negated.pop();
    }
    result += m;
  }
  return result;
}

/**
Runs a callback for each unescaped instance of a regex pattern in the given context.

Doesn't skip over complete multicharacter tokens (only `\` plus its folowing char) so must be used
with knowledge of what's safe to do given regex syntax. Assumes UnicodeSets-mode syntax.
@param {string} expression Search target
@param {string} needle Search as a regex pattern, with flags `su` applied
@param {(match: RegExpExecArray, details: {
  context: 'DEFAULT' | 'CHAR_CLASS';
  negated: boolean;
}) => void} callback
@param {'DEFAULT' | 'CHAR_CLASS'} [context] All contexts if not specified
*/
function forEachUnescaped(expression, needle, callback, context) {
  // Do this the easy way
  replaceUnescaped(expression, needle, callback, context);
}

/**
Returns a match object for the first unescaped instance of a regex pattern in the given context, or
`null`.

Doesn't skip over complete multicharacter tokens (only `\` plus its folowing char) so must be used
with knowledge of what's safe to do given regex syntax. Assumes UnicodeSets-mode syntax.
@param {string} expression Search target
@param {string} needle Search as a regex pattern, with flags `su` applied
@param {number} [pos] Offset to start the search
@param {'DEFAULT' | 'CHAR_CLASS'} [context] All contexts if not specified
@returns {RegExpExecArray | null}
*/
function execUnescaped(expression, needle, pos = 0, context) {
  // Quick partial test; avoid the loop if not needed
  if (!(new RegExp(needle, 'su').test(expression))) {
    return null;
  }
  const re = new RegExp(`${needle}|(?<$skip>\\\\?.)`, 'gsu');
  re.lastIndex = pos;
  let numCharClassesOpen = 0;
  let match;
  while (match = re.exec(expression)) {
    const {0: m, groups: {$skip}} = match;
    if (!$skip && (!context || (context === Context.DEFAULT) === !numCharClassesOpen)) {
      return match;
    }
    if (m === '[') {
      numCharClassesOpen++;
    } else if (m === ']' && numCharClassesOpen) {
      numCharClassesOpen--;
    }
    // Avoid an infinite loop on zero-length matches
    if (re.lastIndex == match.index) {
      re.lastIndex++;
    }
  }
  return null;
}

/**
Checks whether an unescaped instance of a regex pattern appears in the given context.

Doesn't skip over complete multicharacter tokens (only `\` plus its folowing char) so must be used
with knowledge of what's safe to do given regex syntax. Assumes UnicodeSets-mode syntax.
@param {string} expression Search target
@param {string} needle Search as a regex pattern, with flags `su` applied
@param {'DEFAULT' | 'CHAR_CLASS'} [context] All contexts if not specified
@returns {boolean} Whether the pattern was found
*/
function hasUnescaped(expression, needle, context) {
  // Do this the easy way
  return !!execUnescaped(expression, needle, 0, context);
}

/**
Extracts the full contents of a group (subpattern) from the given expression, accounting for
escaped characters, nested groups, and character classes. The group is identified by the position
where its contents start (the string index just after the group's opening delimiter). Returns the
rest of the string if the group is unclosed.

Assumes UnicodeSets-mode syntax.
@param {string} expression Search target
@param {number} contentsStartPos
@returns {string}
*/
function getGroupContents(expression, contentsStartPos) {
  const token = /\\?./gsu;
  token.lastIndex = contentsStartPos;
  let contentsEndPos = expression.length;
  let numCharClassesOpen = 0;
  // Starting search within an open group, after the group's opening
  let numGroupsOpen = 1;
  let match;
  while (match = token.exec(expression)) {
    const [m] = match;
    if (m === '[') {
      numCharClassesOpen++;
    } else if (!numCharClassesOpen) {
      if (m === '(') {
        numGroupsOpen++;
      } else if (m === ')') {
        numGroupsOpen--;
        if (!numGroupsOpen) {
          contentsEndPos = match.index;
          break;
        }
      }
    } else if (m === ']') {
      numCharClassesOpen--;
    }
  }
  return expression.slice(contentsStartPos, contentsEndPos);
}

const atomicPluginToken = new RegExp(String.raw`(?<noncapturingStart>${noncapturingDelim})|(?<capturingStart>\((?:\?<[^>]+>)?)|\\?.`, 'gsu');

/**
Apply transformations for atomic groups: `(?>…)`.
@param {string} expression
@param {import('./regex.js').PluginData} [data]
@returns {Required<import('./regex.js').PluginResult>}
*/
function atomic(expression, data) {
  const hiddenCaptures = data?.hiddenCaptures ?? [];
  // Capture transfer is used by <github.com/slevithan/oniguruma-to-es>
  let captureTransfers = data?.captureTransfers ?? new Map();
  if (!/\(\?>/.test(expression)) {
    return {
      pattern: expression,
      captureTransfers,
      hiddenCaptures,
    };
  }

  const aGDelim = '(?>';
  const emulatedAGDelim = '(?:(?=(';
  const captureNumMap = [0];
  const addedHiddenCaptures = [];
  let numCapturesBeforeAG = 0;
  let numAGs = 0;
  let aGPos = NaN;
  let hasProcessedAG;
  do {
    hasProcessedAG = false;
    let numCharClassesOpen = 0;
    let numGroupsOpenInAG = 0;
    let inAG = false;
    let match;
    atomicPluginToken.lastIndex = Number.isNaN(aGPos) ? 0 : aGPos + emulatedAGDelim.length;
    while (match = atomicPluginToken.exec(expression)) {
      const {0: m, index, groups: {capturingStart, noncapturingStart}} = match;
      if (m === '[') {
        numCharClassesOpen++;
      } else if (!numCharClassesOpen) {

        if (m === aGDelim && !inAG) {
          aGPos = index;
          inAG = true;
        } else if (inAG && noncapturingStart) {
          numGroupsOpenInAG++;
        } else if (capturingStart) {
          if (inAG) {
            numGroupsOpenInAG++;
          } else {
            numCapturesBeforeAG++;
            captureNumMap.push(numCapturesBeforeAG + numAGs);
          }
        } else if (m === ')' && inAG) {
          if (!numGroupsOpenInAG) {
            numAGs++;
            const addedCaptureNum = numCapturesBeforeAG + numAGs;
            // Replace `expression` and use `<$$N>` as a temporary wrapper for the backref so it
            // can avoid backref renumbering afterward. Wrap the whole substitution (including the
            // lookahead and following backref) in a noncapturing group to handle following
            // quantifiers and literal digits
            expression = `${expression.slice(0, aGPos)}${emulatedAGDelim}${
                expression.slice(aGPos + aGDelim.length, index)
              }))<$$${addedCaptureNum}>)${expression.slice(index + 1)}`;
            hasProcessedAG = true;
            addedHiddenCaptures.push(addedCaptureNum);
            incrementIfAtLeast$1(hiddenCaptures, addedCaptureNum);
            if (captureTransfers.size) {
              const newCaptureTransfers = new Map();
              captureTransfers.forEach((from, to) => {
                newCaptureTransfers.set(
                  to >= addedCaptureNum ? to + 1 : to,
                  from.map(f => f >= addedCaptureNum ? f + 1 : f)
                );
              });
              captureTransfers = newCaptureTransfers;
            }
            break;
          }
          numGroupsOpenInAG--;
        }

      } else if (m === ']') {
        numCharClassesOpen--;
      }
    }
  // Start over from the beginning of the atomic group's contents, in case the processed group
  // contains additional atomic groups
  } while (hasProcessedAG);

  hiddenCaptures.push(...addedHiddenCaptures);

  // Second pass to adjust numbered backrefs
  expression = replaceUnescaped(
    expression,
    String.raw`\\(?<backrefNum>[1-9]\d*)|<\$\$(?<wrappedBackrefNum>\d+)>`,
    ({0: m, groups: {backrefNum, wrappedBackrefNum}}) => {
      if (backrefNum) {
        const bNum = +backrefNum;
        if (bNum > captureNumMap.length - 1) {
          throw new Error(`Backref "${m}" greater than number of captures`);
        }
        return `\\${captureNumMap[bNum]}`;
      }
      return `\\${wrappedBackrefNum}`;
    },
    Context.DEFAULT
  );

  return {
    pattern: expression,
    captureTransfers,
    hiddenCaptures,
  };
}

const baseQuantifier = String.raw`(?:[?*+]|\{\d+(?:,\d*)?\})`;
// Complete tokenizer for base syntax; doesn't (need to) know about character-class-only syntax
const possessivePluginToken = new RegExp(String.raw`
\\(?: \d+
  | c[A-Za-z]
  | [gk]<[^>]+>
  | [pPu]\{[^\}]+\}
  | u[A-Fa-f\d]{4}
  | x[A-Fa-f\d]{2}
  )
| \((?: \? (?: [:=!>]
  | <(?:[=!]|[^>]+>)
  | [A-Za-z\-]+:
  | \(DEFINE\)
  ))?
| (?<qBase>${baseQuantifier})(?<qMod>[?+]?)(?<invalidQ>[?*+\{]?)
| \\?.
`.replace(/\s+/g, ''), 'gsu');

/**
Transform posessive quantifiers into atomic groups. The posessessive quantifiers are:
`?+`, `*+`, `++`, `{N}+`, `{N,}+`, `{N,N}+`.
This follows Java, PCRE, Perl, and Python.
Possessive quantifiers in Oniguruma and Onigmo are only: `?+`, `*+`, `++`.
@param {string} expression
@returns {import('./regex.js').PluginResult}
*/
function possessive(expression) {
  if (!(new RegExp(`${baseQuantifier}\\+`).test(expression))) {
    return {
      pattern: expression,
    };
  }

  const openGroupIndices = [];
  let lastGroupIndex = null;
  let lastCharClassIndex = null;
  let lastToken = '';
  let numCharClassesOpen = 0;
  let match;
  possessivePluginToken.lastIndex = 0;
  while (match = possessivePluginToken.exec(expression)) {
    const {0: m, index, groups: {qBase, qMod, invalidQ}} = match;
    if (m === '[') {
      if (!numCharClassesOpen) {
        lastCharClassIndex = index;
      }
      numCharClassesOpen++;
    } else if (m === ']') {
      if (numCharClassesOpen) {
        numCharClassesOpen--;
      // Unmatched `]`
      } else {
        lastCharClassIndex = null;
      }
    } else if (!numCharClassesOpen) {

      if (qMod === '+' && lastToken && !lastToken.startsWith('(')) {
        // Invalid following quantifier would become valid via the wrapping group
        if (invalidQ) {
          throw new Error(`Invalid quantifier "${m}"`);
        }
        let charsAdded = -1; // -1 for removed trailing `+`
        // Possessivizing fixed repetition quantifiers like `{2}` does't change their behavior, so
        // avoid doing so (convert them to greedy)
        if (/^\{\d+\}$/.test(qBase)) {
          expression = spliceStr(expression, index + qBase.length, qMod, '');
        } else {
          if (lastToken === ')' || lastToken === ']') {
            const nodeIndex = lastToken === ')' ? lastGroupIndex : lastCharClassIndex;
            // Unmatched `)` would break out of the wrapping group and mess with handling.
            // Unmatched `]` wouldn't be a problem, but it's unnecessary to have dedicated support
            // for unescaped `]++` since this won't work with flag u or v anyway
            if (nodeIndex === null) {
              throw new Error(`Invalid unmatched "${lastToken}"`);
            }
            expression = `${expression.slice(0, nodeIndex)}(?>${expression.slice(nodeIndex, index)}${qBase})${expression.slice(index + m.length)}`;
          } else {
            expression = `${expression.slice(0, index - lastToken.length)}(?>${lastToken}${qBase})${expression.slice(index + m.length)}`;
          }
          charsAdded += 4; // `(?>)`
        }
        possessivePluginToken.lastIndex += charsAdded;
      } else if (m[0] === '(') {
        openGroupIndices.push(index);
      } else if (m === ')') {
        lastGroupIndex = openGroupIndices.length ? openGroupIndices.pop() : null;
      }

    }
    lastToken = m;
  }

  return {
    pattern: expression,
  };
}

const r$2 = String.raw;
const gRToken = r$2`\\g<(?<gRNameOrNum>[^>&]+)&R=(?<gRDepth>[^>]+)>`;
const recursiveToken = r$2`\(\?R=(?<rDepth>[^\)]+)\)|${gRToken}`;
const namedCaptureDelim = r$2`\(\?<(?![=!])(?<captureName>[^>]+)>`;
const captureDelim = r$2`${namedCaptureDelim}|(?<unnamed>\()(?!\?)`;
const token = new RegExp(r$2`${namedCaptureDelim}|${recursiveToken}|\(\?|\\?.`, 'gsu');
const overlappingRecursionMsg = 'Cannot use multiple overlapping recursions';

/**
@param {string} pattern
@param {{
  flags?: string;
  captureTransfers?: Map<number, Array<number>>;
  hiddenCaptures?: Array<number>;
  mode?: 'plugin' | 'external';
}} [data]
@returns {{
  pattern: string;
  captureTransfers: Map<number, Array<number>>;
  hiddenCaptures: Array<number>;
}}
*/
function recursion(pattern, data) {
  const {hiddenCaptures, mode} = {
    hiddenCaptures: [],
    mode: 'plugin',
    ...data,
  };
  // Capture transfer is used by <github.com/slevithan/oniguruma-to-es>
  let captureTransfers = data?.captureTransfers ?? new Map();
  // Keep the initial fail-check (which avoids unneeded processing) as fast as possible by testing
  // without the accuracy improvement of using `hasUnescaped` with `Context.DEFAULT`
  if (!(new RegExp(recursiveToken, 'su').test(pattern))) {
    return {
      pattern,
      captureTransfers,
      hiddenCaptures,
    };
  }
  if (mode === 'plugin' && hasUnescaped(pattern, r$2`\(\?\(DEFINE\)`, Context.DEFAULT)) {
    throw new Error('DEFINE groups cannot be used with recursion');
  }

  const addedHiddenCaptures = [];
  const hasNumberedBackref = hasUnescaped(pattern, r$2`\\[1-9]`, Context.DEFAULT);
  const groupContentsStartPos = new Map();
  const openGroups = [];
  let hasRecursed = false;
  let numCharClassesOpen = 0;
  let numCapturesPassed = 0;
  let match;
  token.lastIndex = 0;
  while ((match = token.exec(pattern))) {
    const {0: m, groups: {captureName, rDepth, gRNameOrNum, gRDepth}} = match;
    if (m === '[') {
      numCharClassesOpen++;
    } else if (!numCharClassesOpen) {

      // `(?R=N)`
      if (rDepth) {
        assertMaxInBounds(rDepth);
        if (hasRecursed) {
          throw new Error(overlappingRecursionMsg);
        }
        if (hasNumberedBackref) {
          // Could add support for numbered backrefs with extra effort, but it's probably not worth
          // it. To trigger this error, the regex must include recursion and one of the following:
          // - An interpolated regex that contains a numbered backref (since other numbered
          //   backrefs are prevented by implicit flag n).
          // - A numbered backref, when flag n is explicitly disabled.
          // Note that Regex+'s extended syntax (atomic groups and sometimes subroutines) can also
          // add numbered backrefs, but those work fine because external plugins like this one run
          // *before* the transformation of built-in syntax extensions
          throw new Error(
            // When used in `external` mode by transpilers other than Regex+, backrefs might have
            // gone through conversion from named to numbered, so avoid a misleading error
            `${mode === 'external' ? 'Backrefs' : 'Numbered backrefs'} cannot be used with global recursion`
          );
        }
        const left = pattern.slice(0, match.index);
        const right = pattern.slice(token.lastIndex);
        if (hasUnescaped(right, recursiveToken, Context.DEFAULT)) {
          throw new Error(overlappingRecursionMsg);
        }
        const reps = +rDepth - 1;
        pattern = makeRecursive(
          left,
          right,
          reps,
          false,
          hiddenCaptures,
          addedHiddenCaptures,
          numCapturesPassed
        );
        captureTransfers = mapCaptureTransfers(
          captureTransfers,
          left,
          reps,
          addedHiddenCaptures.length,
          0,
          numCapturesPassed
        );
        // No need to parse further
        break;
      // `\g<name&R=N>`, `\g<number&R=N>`
      } else if (gRNameOrNum) {
        assertMaxInBounds(gRDepth);
        let isWithinReffedGroup = false;
        for (const g of openGroups) {
          if (g.name === gRNameOrNum || g.num === +gRNameOrNum) {
            isWithinReffedGroup = true;
            if (g.hasRecursedWithin) {
              throw new Error(overlappingRecursionMsg);
            }
            break;
          }
        }
        if (!isWithinReffedGroup) {
          throw new Error(r$2`Recursive \g cannot be used outside the referenced group "${
            mode === 'external' ? gRNameOrNum : r$2`\g<${gRNameOrNum}&R=${gRDepth}>`
          }"`);
        }
        const startPos = groupContentsStartPos.get(gRNameOrNum);
        const groupContents = getGroupContents(pattern, startPos);
        if (
          hasNumberedBackref &&
          hasUnescaped(groupContents, r$2`${namedCaptureDelim}|\((?!\?)`, Context.DEFAULT)
        ) {
          throw new Error(
            // When used in `external` mode by transpilers other than Regex+, backrefs might have
            // gone through conversion from named to numbered, so avoid a misleading error
            `${mode === 'external' ? 'Backrefs' : 'Numbered backrefs'} cannot be used with recursion of capturing groups`
          );
        }
        const groupContentsLeft = pattern.slice(startPos, match.index);
        const groupContentsRight = groupContents.slice(groupContentsLeft.length + m.length);
        const numAddedHiddenCapturesPreExpansion = addedHiddenCaptures.length;
        const reps = +gRDepth - 1;
        const expansion = makeRecursive(
          groupContentsLeft,
          groupContentsRight,
          reps,
          true,
          hiddenCaptures,
          addedHiddenCaptures,
          numCapturesPassed
        );
        captureTransfers = mapCaptureTransfers(
          captureTransfers,
          groupContentsLeft,
          reps,
          addedHiddenCaptures.length - numAddedHiddenCapturesPreExpansion,
          numAddedHiddenCapturesPreExpansion,
          numCapturesPassed
        );
        const pre = pattern.slice(0, startPos);
        const post = pattern.slice(startPos + groupContents.length);
        // Modify the string we're looping over
        pattern = `${pre}${expansion}${post}`;
        // Step forward for the next loop iteration
        token.lastIndex += expansion.length - m.length - groupContentsLeft.length - groupContentsRight.length;
        openGroups.forEach(g => g.hasRecursedWithin = true);
        hasRecursed = true;
      } else if (captureName) {
        numCapturesPassed++;
        groupContentsStartPos.set(String(numCapturesPassed), token.lastIndex);
        groupContentsStartPos.set(captureName, token.lastIndex);
        openGroups.push({
          num: numCapturesPassed,
          name: captureName,
        });
      } else if (m[0] === '(') {
        const isUnnamedCapture = m === '(';
        if (isUnnamedCapture) {
          numCapturesPassed++;
          groupContentsStartPos.set(String(numCapturesPassed), token.lastIndex);
        }
        openGroups.push(isUnnamedCapture ? {num: numCapturesPassed} : {});
      } else if (m === ')') {
        openGroups.pop();
      }

    } else if (m === ']') {
      numCharClassesOpen--;
    }
  }

  hiddenCaptures.push(...addedHiddenCaptures);

  return {
    pattern,
    captureTransfers,
    hiddenCaptures,
  };
}

/**
@param {string} max
*/
function assertMaxInBounds(max) {
  const errMsg = `Max depth must be integer between 2 and 100; used ${max}`;
  if (!/^[1-9]\d*$/.test(max)) {
    throw new Error(errMsg);
  }
  max = +max;
  if (max < 2 || max > 100) {
    throw new Error(errMsg);
  }
}

/**
@param {string} left
@param {string} right
@param {number} reps
@param {boolean} isSubpattern
@param {Array<number>} hiddenCaptures
@param {Array<number>} addedHiddenCaptures
@param {number} numCapturesPassed
@returns {string}
*/
function makeRecursive(
  left,
  right,
  reps,
  isSubpattern,
  hiddenCaptures,
  addedHiddenCaptures,
  numCapturesPassed
) {
  const namesInRecursed = new Set();
  // Can skip this work if not needed
  if (isSubpattern) {
    forEachUnescaped(left + right, namedCaptureDelim, ({groups: {captureName}}) => {
      namesInRecursed.add(captureName);
    }, Context.DEFAULT);
  }
  const rest = [
    reps,
    isSubpattern ? namesInRecursed : null,
    hiddenCaptures,
    addedHiddenCaptures,
    numCapturesPassed,
  ];
  // Depth 2: 'left(?:left(?:)right)right'
  // Depth 3: 'left(?:left(?:left(?:)right)right)right'
  // Empty group in the middle separates tokens and absorbs a following quantifier if present
  return `${left}${
    repeatWithDepth(`(?:${left}`, 'forward', ...rest)
  }(?:)${
    repeatWithDepth(`${right})`, 'backward', ...rest)
  }${right}`;
}

/**
@param {string} pattern
@param {'forward' | 'backward'} direction
@param {number} reps
@param {Set<string> | null} namesInRecursed
@param {Array<number>} hiddenCaptures
@param {Array<number>} addedHiddenCaptures
@param {number} numCapturesPassed
@returns {string}
*/
function repeatWithDepth(
  pattern,
  direction,
  reps,
  namesInRecursed,
  hiddenCaptures,
  addedHiddenCaptures,
  numCapturesPassed
) {
  const startNum = 2;
  const getDepthNum = i => direction === 'forward' ? (i + startNum) : (reps - i + startNum - 1);
  let result = '';
  for (let i = 0; i < reps; i++) {
    const depthNum = getDepthNum(i);
    result += replaceUnescaped(
      pattern,
      r$2`${captureDelim}|\\k<(?<backref>[^>]+)>`,
      ({0: m, groups: {captureName, unnamed, backref}}) => {
        if (backref && namesInRecursed && !namesInRecursed.has(backref)) {
          // Don't alter backrefs to groups outside the recursed subpattern
          return m;
        }
        const suffix = `_$${depthNum}`;
        if (unnamed || captureName) {
          const addedCaptureNum = numCapturesPassed + addedHiddenCaptures.length + 1;
          addedHiddenCaptures.push(addedCaptureNum);
          incrementIfAtLeast(hiddenCaptures, addedCaptureNum);
          return unnamed ? m : `(?<${captureName}${suffix}>`;
        }
        return r$2`\k<${backref}${suffix}>`;
      },
      Context.DEFAULT
    );
  }
  return result;
}

/**
Updates the array in place by incrementing each value greater than or equal to the threshold.
@param {Array<number>} arr
@param {number} threshold
*/
function incrementIfAtLeast(arr, threshold) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] >= threshold) {
      arr[i]++;
    }
  }
}

/**
@param {Map<number, Array<number>>} captureTransfers
@param {string} left
@param {number} reps
@param {number} numCapturesAddedInExpansion
@param {number} numAddedHiddenCapturesPreExpansion
@param {number} numCapturesPassed
@returns {Map<number, Array<number>>}
*/
function mapCaptureTransfers(captureTransfers, left, reps, numCapturesAddedInExpansion, numAddedHiddenCapturesPreExpansion, numCapturesPassed) {
  if (captureTransfers.size && numCapturesAddedInExpansion) {
    let numCapturesInLeft = 0;
    forEachUnescaped(left, captureDelim, () => numCapturesInLeft++, Context.DEFAULT);
    // Is 0 for global recursion
    const recursionDelimCaptureNum = numCapturesPassed - numCapturesInLeft + numAddedHiddenCapturesPreExpansion;
    const newCaptureTransfers = new Map();
    captureTransfers.forEach((from, to) => {
      const numCapturesInRight = (numCapturesAddedInExpansion - (numCapturesInLeft * reps)) / reps;
      const numCapturesAddedInLeft = numCapturesInLeft * reps;
      const newTo = to > (recursionDelimCaptureNum + numCapturesInLeft) ? to + numCapturesAddedInExpansion : to;
      const newFrom = [];
      for (const f of from) {
        // Before the recursed subpattern
        if (f <= recursionDelimCaptureNum) {
          newFrom.push(f);
        // After the recursed subpattern
        } else if (f > (recursionDelimCaptureNum + numCapturesInLeft + numCapturesInRight)) {
          newFrom.push(f + numCapturesAddedInExpansion);
        // Within the recursed subpattern, on the left of the recursion token
        } else if (f <= (recursionDelimCaptureNum + numCapturesInLeft)) {
          for (let i = 0; i <= reps; i++) {
            newFrom.push(f + (numCapturesInLeft * i));
          }
        // Within the recursed subpattern, on the right of the recursion token
        } else {
          for (let i = 0; i <= reps; i++) {
            newFrom.push(f + numCapturesAddedInLeft + (numCapturesInRight * i));
          }
        }
      }
      newCaptureTransfers.set(newTo, newFrom);
    });
    return newCaptureTransfers;
  }
  return captureTransfers;
}

// src/utils.js
var cp = String.fromCodePoint;
var r$1 = String.raw;
var envFlags = {
  flagGroups: (() => {
    try {
      new RegExp("(?i:)");
    } catch {
      return false;
    }
    return true;
  })(),
  unicodeSets: (() => {
    try {
      new RegExp("", "v");
    } catch {
      return false;
    }
    return true;
  })()
};
envFlags.bugFlagVLiteralHyphenIsRange = envFlags.unicodeSets ? (() => {
  try {
    new RegExp(r$1`[\d\-a]`, "v");
  } catch {
    return true;
  }
  return false;
})() : false;
envFlags.bugNestedClassIgnoresNegation = envFlags.unicodeSets && new RegExp("[[^a]]", "v").test("a");
function getNewCurrentFlags(current, { enable, disable }) {
  return {
    dotAll: !disable?.dotAll && !!(enable?.dotAll || current.dotAll),
    ignoreCase: !disable?.ignoreCase && !!(enable?.ignoreCase || current.ignoreCase)
  };
}
function getOrInsert(map, key, defaultValue) {
  if (!map.has(key)) {
    map.set(key, defaultValue);
  }
  return map.get(key);
}
function isMinTarget(target, min) {
  return EsVersion[target] >= EsVersion[min];
}
function throwIfNullish(value, msg) {
  if (value == null) {
    throw new Error(msg ?? "Value expected");
  }
  return value;
}

// src/options.js
var EsVersion = {
  ES2025: 2025,
  ES2024: 2024,
  ES2018: 2018
};
var Target = (
  /** @type {const} */
  {
    auto: "auto",
    ES2025: "ES2025",
    ES2024: "ES2024",
    ES2018: "ES2018"
  }
);
function getOptions(options = {}) {
  if ({}.toString.call(options) !== "[object Object]") {
    throw new Error("Unexpected options");
  }
  if (options.target !== void 0 && !Target[options.target]) {
    throw new Error(`Unexpected target "${options.target}"`);
  }
  const opts = {
    // Sets the level of emulation rigor/strictness.
    accuracy: "default",
    // Disables advanced emulation that relies on returning a `RegExp` subclass, resulting in
    // certain patterns not being emulatable.
    avoidSubclass: false,
    // Oniguruma flags; a string with `i`, `m`, `x`, `D`, `S`, `W`, `y{g}` in any order (all
    // optional). Oniguruma's `m` is equivalent to JavaScript's `s` (`dotAll`).
    flags: "",
    // Include JavaScript flag `g` (`global`) in the result.
    global: false,
    // Include JavaScript flag `d` (`hasIndices`) in the result.
    hasIndices: false,
    // Delay regex construction until first use if the transpiled pattern is at least this length.
    lazyCompileLength: Infinity,
    // JavaScript version used for generated regexes. Using `auto` detects the best value based on
    // your environment. Later targets allow faster processing, simpler generated source, and
    // support for additional features.
    target: "auto",
    // Disables minifications that simplify the pattern without changing the meaning.
    verbose: false,
    ...options,
    // Advanced options that override standard behavior, error checking, and flags when enabled.
    rules: {
      // Useful with TextMate grammars that merge backreferences across patterns.
      allowOrphanBackrefs: false,
      // Use ASCII `\b` and `\B`, which increases search performance of generated regexes.
      asciiWordBoundaries: false,
      // Allow unnamed captures and numbered calls (backreferences and subroutines) when using
      // named capture. This is Oniguruma option `ONIG_OPTION_CAPTURE_GROUP`; on by default in
      // `vscode-oniguruma`.
      captureGroup: false,
      // Change the recursion depth limit from Oniguruma's `20` to an integer `2`–`20`.
      recursionLimit: 20,
      // `^` as `\A`; `$` as`\Z`. Improves search performance of generated regexes without changing
      // the meaning if searching line by line. This is Oniguruma option `ONIG_OPTION_SINGLELINE`.
      singleline: false,
      ...options.rules
    }
  };
  if (opts.target === "auto") {
    opts.target = envFlags.flagGroups ? "ES2025" : envFlags.unicodeSets ? "ES2024" : "ES2018";
  }
  return opts;
}
var asciiSpaceChar = "[	-\r ]";
var CharsWithoutIgnoreCaseExpansion = /* @__PURE__ */ new Set([
  cp(304),
  // İ
  cp(305)
  // ı
]);
var defaultWordChar = r$1`[\p{L}\p{M}\p{N}\p{Pc}]`;
function getIgnoreCaseMatchChars(char) {
  if (CharsWithoutIgnoreCaseExpansion.has(char)) {
    return [char];
  }
  const set = /* @__PURE__ */ new Set();
  const lower = char.toLowerCase();
  const upper = lower.toUpperCase();
  const title = LowerToTitleCaseMap.get(lower);
  const altLower = LowerToAlternativeLowerCaseMap.get(lower);
  const altUpper = LowerToAlternativeUpperCaseMap.get(lower);
  if ([...upper].length === 1) {
    set.add(upper);
  }
  altUpper && set.add(altUpper);
  title && set.add(title);
  set.add(lower);
  altLower && set.add(altLower);
  return [...set];
}
var JsUnicodePropertyMap = /* @__PURE__ */ new Map(
  `C Other
Cc Control cntrl
Cf Format
Cn Unassigned
Co Private_Use
Cs Surrogate
L Letter
LC Cased_Letter
Ll Lowercase_Letter
Lm Modifier_Letter
Lo Other_Letter
Lt Titlecase_Letter
Lu Uppercase_Letter
M Mark Combining_Mark
Mc Spacing_Mark
Me Enclosing_Mark
Mn Nonspacing_Mark
N Number
Nd Decimal_Number digit
Nl Letter_Number
No Other_Number
P Punctuation punct
Pc Connector_Punctuation
Pd Dash_Punctuation
Pe Close_Punctuation
Pf Final_Punctuation
Pi Initial_Punctuation
Po Other_Punctuation
Ps Open_Punctuation
S Symbol
Sc Currency_Symbol
Sk Modifier_Symbol
Sm Math_Symbol
So Other_Symbol
Z Separator
Zl Line_Separator
Zp Paragraph_Separator
Zs Space_Separator
ASCII
ASCII_Hex_Digit AHex
Alphabetic Alpha
Any
Assigned
Bidi_Control Bidi_C
Bidi_Mirrored Bidi_M
Case_Ignorable CI
Cased
Changes_When_Casefolded CWCF
Changes_When_Casemapped CWCM
Changes_When_Lowercased CWL
Changes_When_NFKC_Casefolded CWKCF
Changes_When_Titlecased CWT
Changes_When_Uppercased CWU
Dash
Default_Ignorable_Code_Point DI
Deprecated Dep
Diacritic Dia
Emoji
Emoji_Component EComp
Emoji_Modifier EMod
Emoji_Modifier_Base EBase
Emoji_Presentation EPres
Extended_Pictographic ExtPict
Extender Ext
Grapheme_Base Gr_Base
Grapheme_Extend Gr_Ext
Hex_Digit Hex
IDS_Binary_Operator IDSB
IDS_Trinary_Operator IDST
ID_Continue IDC
ID_Start IDS
Ideographic Ideo
Join_Control Join_C
Logical_Order_Exception LOE
Lowercase Lower
Math
Noncharacter_Code_Point NChar
Pattern_Syntax Pat_Syn
Pattern_White_Space Pat_WS
Quotation_Mark QMark
Radical
Regional_Indicator RI
Sentence_Terminal STerm
Soft_Dotted SD
Terminal_Punctuation Term
Unified_Ideograph UIdeo
Uppercase Upper
Variation_Selector VS
White_Space space
XID_Continue XIDC
XID_Start XIDS`.split(/\s/).map((p) => [w(p), p])
);
var LowerToAlternativeLowerCaseMap = /* @__PURE__ */ new Map([
  ["s", cp(383)],
  // s, ſ
  [cp(383), "s"]
  // ſ, s
]);
var LowerToAlternativeUpperCaseMap = /* @__PURE__ */ new Map([
  [cp(223), cp(7838)],
  // ß, ẞ
  [cp(107), cp(8490)],
  // k, K (Kelvin)
  [cp(229), cp(8491)],
  // å, Å (Angstrom)
  [cp(969), cp(8486)]
  // ω, Ω (Ohm)
]);
var LowerToTitleCaseMap = new Map([
  titleEntry(453),
  titleEntry(456),
  titleEntry(459),
  titleEntry(498),
  ...titleRange(8072, 8079),
  ...titleRange(8088, 8095),
  ...titleRange(8104, 8111),
  titleEntry(8124),
  titleEntry(8140),
  titleEntry(8188)
]);
var PosixClassMap = /* @__PURE__ */ new Map([
  ["alnum", r$1`[\p{Alpha}\p{Nd}]`],
  ["alpha", r$1`\p{Alpha}`],
  ["ascii", r$1`\p{ASCII}`],
  ["blank", r$1`[\p{Zs}\t]`],
  ["cntrl", r$1`\p{Cc}`],
  ["digit", r$1`\p{Nd}`],
  ["graph", r$1`[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]`],
  ["lower", r$1`\p{Lower}`],
  ["print", r$1`[[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]\p{Zs}]`],
  ["punct", r$1`[\p{P}\p{S}]`],
  // Updated value from Onig 6.9.9; changed from Unicode `\p{punct}`
  ["space", r$1`\p{space}`],
  ["upper", r$1`\p{Upper}`],
  ["word", r$1`[\p{Alpha}\p{M}\p{Nd}\p{Pc}]`],
  ["xdigit", r$1`\p{AHex}`]
]);
function range(start, end) {
  const range2 = [];
  for (let i = start; i <= end; i++) {
    range2.push(i);
  }
  return range2;
}
function titleEntry(codePoint) {
  const char = cp(codePoint);
  return [char.toLowerCase(), char];
}
function titleRange(start, end) {
  return range(start, end).map((codePoint) => titleEntry(codePoint));
}
var UnicodePropertiesWithSpecificCase = /* @__PURE__ */ new Set([
  "Lower",
  "Lowercase",
  "Upper",
  "Uppercase",
  "Ll",
  "Lowercase_Letter",
  "Lt",
  "Titlecase_Letter",
  "Lu",
  "Uppercase_Letter"
  // The `Changes_When_*` properties (and their aliases) could be included, but they're very rare.
  // Some other properties include a handful of chars with specific cases only, but these chars are
  // generally extreme edge cases and using such properties case insensitively generally produces
  // undesired behavior anyway
]);
function transform(ast, options) {
  const opts = {
    // A couple edge cases exist where options `accuracy` and `bestEffortTarget` are used:
    // - `CharacterSet` kind `text_segment` (`\X`): An exact representation would require heavy
    //   Unicode data; a best-effort approximation requires knowing the target.
    // - `CharacterSet` kind `posix` with values `graph` and `print`: Their complex Unicode
    //   representations would be hard to change to ASCII versions after the fact in the generator
    //   based on `target`/`accuracy`, so produce the appropriate structure here.
    accuracy: "default",
    asciiWordBoundaries: false,
    avoidSubclass: false,
    bestEffortTarget: "ES2025",
    ...options
  };
  addParentProperties(ast);
  const firstPassState = {
    accuracy: opts.accuracy,
    asciiWordBoundaries: opts.asciiWordBoundaries,
    avoidSubclass: opts.avoidSubclass,
    flagDirectivesByAlt: /* @__PURE__ */ new Map(),
    jsGroupNameMap: /* @__PURE__ */ new Map(),
    minTargetEs2024: isMinTarget(opts.bestEffortTarget, "ES2024"),
    passedLookbehind: false,
    strategy: null,
    // Subroutines can appear before the groups they ref, so collect reffed nodes for a second pass 
    subroutineRefMap: /* @__PURE__ */ new Map(),
    supportedGNodes: /* @__PURE__ */ new Set(),
    digitIsAscii: ast.flags.digitIsAscii,
    spaceIsAscii: ast.flags.spaceIsAscii,
    wordIsAscii: ast.flags.wordIsAscii
  };
  S(ast, FirstPassVisitor, firstPassState);
  const globalFlags = {
    dotAll: ast.flags.dotAll,
    ignoreCase: ast.flags.ignoreCase
  };
  const secondPassState = {
    currentFlags: globalFlags,
    prevFlags: null,
    globalFlags,
    groupOriginByCopy: /* @__PURE__ */ new Map(),
    groupsByName: /* @__PURE__ */ new Map(),
    multiplexCapturesToLeftByRef: /* @__PURE__ */ new Map(),
    openRefs: /* @__PURE__ */ new Map(),
    reffedNodesByReferencer: /* @__PURE__ */ new Map(),
    subroutineRefMap: firstPassState.subroutineRefMap
  };
  S(ast, SecondPassVisitor, secondPassState);
  const thirdPassState = {
    groupsByName: secondPassState.groupsByName,
    highestOrphanBackref: 0,
    numCapturesToLeft: 0,
    reffedNodesByReferencer: secondPassState.reffedNodesByReferencer
  };
  S(ast, ThirdPassVisitor, thirdPassState);
  ast._originMap = secondPassState.groupOriginByCopy;
  ast._strategy = firstPassState.strategy;
  return ast;
}
var FirstPassVisitor = {
  AbsenceFunction({ node, parent, replaceWith }) {
    const { body, kind } = node;
    if (kind === "repeater") {
      const innerGroup = A();
      innerGroup.body[0].body.push(
        // Insert own alts as `body`
        K({ negate: true, body }),
        Q("Any")
      );
      const outerGroup = A();
      outerGroup.body[0].body.push(
        _("greedy", 0, Infinity, innerGroup)
      );
      replaceWith(setParentDeep(outerGroup, parent), { traverse: true });
    } else {
      throw new Error(`Unsupported absence function "(?~|"`);
    }
  },
  Alternative: {
    enter({ node, parent, key }, { flagDirectivesByAlt }) {
      const flagDirectives = node.body.filter((el) => el.kind === "flags");
      for (let i = key + 1; i < parent.body.length; i++) {
        const forwardSiblingAlt = parent.body[i];
        getOrInsert(flagDirectivesByAlt, forwardSiblingAlt, []).push(...flagDirectives);
      }
    },
    exit({ node }, { flagDirectivesByAlt }) {
      if (flagDirectivesByAlt.get(node)?.length) {
        const flags = getCombinedFlagModsFromFlagNodes(flagDirectivesByAlt.get(node));
        if (flags) {
          const flagGroup = A({ flags });
          flagGroup.body[0].body = node.body;
          node.body = [setParentDeep(flagGroup, node)];
        }
      }
    }
  },
  Assertion({ node, parent, key, container, root, remove, replaceWith }, state) {
    const { kind, negate } = node;
    const { asciiWordBoundaries, avoidSubclass, supportedGNodes, wordIsAscii } = state;
    if (kind === "text_segment_boundary") {
      throw new Error(`Unsupported text segment boundary "\\${negate ? "Y" : "y"}"`);
    } else if (kind === "line_end") {
      replaceWith(setParentDeep(K({ body: [
        b({ body: [F("string_end")] }),
        b({ body: [m(10)] })
        // `\n`
      ] }), parent));
    } else if (kind === "line_start") {
      replaceWith(setParentDeep(parseFragment(r$1`(?<=\A|\n(?!\z))`, { skipLookbehindValidation: true }), parent));
    } else if (kind === "search_start") {
      if (supportedGNodes.has(node)) {
        root.flags.sticky = true;
        remove();
      } else {
        const prev = container[key - 1];
        if (prev && isAlwaysNonZeroLength(prev)) {
          replaceWith(setParentDeep(K({ negate: true }), parent));
        } else if (avoidSubclass) {
          throw new Error(r$1`Uses "\G" in a way that requires a subclass`);
        } else {
          replaceWith(setParent(F("string_start"), parent));
          state.strategy = "clip_search";
        }
      }
    } else if (kind === "string_end" || kind === "string_start") ; else if (kind === "string_end_newline") {
      replaceWith(setParentDeep(parseFragment(r$1`(?=\n?\z)`), parent));
    } else if (kind === "word_boundary") {
      if (!wordIsAscii && !asciiWordBoundaries) {
        const b = `(?:(?<=${defaultWordChar})(?!${defaultWordChar})|(?<!${defaultWordChar})(?=${defaultWordChar}))`;
        const B = `(?:(?<=${defaultWordChar})(?=${defaultWordChar})|(?<!${defaultWordChar})(?!${defaultWordChar}))`;
        replaceWith(setParentDeep(parseFragment(negate ? B : b), parent));
      }
    } else {
      throw new Error(`Unexpected assertion kind "${kind}"`);
    }
  },
  Backreference({ node }, { jsGroupNameMap }) {
    let { ref } = node;
    if (typeof ref === "string" && !isValidJsGroupName(ref)) {
      ref = getAndStoreJsGroupName(ref, jsGroupNameMap);
      node.ref = ref;
    }
  },
  CapturingGroup({ node }, { jsGroupNameMap, subroutineRefMap }) {
    let { name } = node;
    if (name && !isValidJsGroupName(name)) {
      name = getAndStoreJsGroupName(name, jsGroupNameMap);
      node.name = name;
    }
    subroutineRefMap.set(node.number, node);
    if (name) {
      subroutineRefMap.set(name, node);
    }
  },
  CharacterClassRange({ node, parent, replaceWith }) {
    if (parent.kind === "intersection") {
      const cc = C({ body: [node] });
      replaceWith(setParentDeep(cc, parent), { traverse: true });
    }
  },
  CharacterSet({ node, parent, replaceWith }, { accuracy, minTargetEs2024, digitIsAscii, spaceIsAscii, wordIsAscii }) {
    const { kind, negate, value } = node;
    if (digitIsAscii && (kind === "digit" || value === "digit")) {
      replaceWith(setParent(E("digit", { negate }), parent));
      return;
    }
    if (spaceIsAscii && (kind === "space" || value === "space")) {
      replaceWith(setParentDeep(setNegate(parseFragment(asciiSpaceChar), negate), parent));
      return;
    }
    if (wordIsAscii && (kind === "word" || value === "word")) {
      replaceWith(setParent(E("word", { negate }), parent));
      return;
    }
    if (kind === "any") {
      replaceWith(setParent(Q("Any"), parent));
    } else if (kind === "digit") {
      replaceWith(setParent(Q("Nd", { negate }), parent));
    } else if (kind === "dot") ; else if (kind === "text_segment") {
      if (accuracy === "strict") {
        throw new Error(r$1`Use of "\X" requires non-strict accuracy`);
      }
      const eBase = "\\p{Emoji}(?:\\p{EMod}|\\uFE0F\\u20E3?|[\\x{E0020}-\\x{E007E}]+\\x{E007F})?";
      const emoji = r$1`\p{RI}{2}|${eBase}(?:\u200D${eBase})*`;
      replaceWith(setParentDeep(parseFragment(
        // Close approximation of an extended grapheme cluster; see: <unicode.org/reports/tr29/>
        r$1`(?>\r\n|${minTargetEs2024 ? r$1`\p{RGI_Emoji}` : emoji}|\P{M}\p{M}*)`,
        // Allow JS property `RGI_Emoji` through
        { skipPropertyNameValidation: true }
      ), parent));
    } else if (kind === "hex") {
      replaceWith(setParent(Q("AHex", { negate }), parent));
    } else if (kind === "newline") {
      replaceWith(setParentDeep(parseFragment(negate ? "[^\n]" : "(?>\r\n?|[\n\v\f\x85\u2028\u2029])"), parent));
    } else if (kind === "posix") {
      if (!minTargetEs2024 && (value === "graph" || value === "print")) {
        if (accuracy === "strict") {
          throw new Error(`POSIX class "${value}" requires min target ES2024 or non-strict accuracy`);
        }
        let ascii = {
          graph: "!-~",
          print: " -~"
        }[value];
        if (negate) {
          ascii = `\0-${cp(ascii.codePointAt(0) - 1)}${cp(ascii.codePointAt(2) + 1)}-\u{10FFFF}`;
        }
        replaceWith(setParentDeep(parseFragment(`[${ascii}]`), parent));
      } else {
        replaceWith(setParentDeep(setNegate(parseFragment(PosixClassMap.get(value)), negate), parent));
      }
    } else if (kind === "property") {
      if (!JsUnicodePropertyMap.has(w(value))) {
        node.key = "sc";
      }
    } else if (kind === "space") {
      replaceWith(setParent(Q("space", { negate }), parent));
    } else if (kind === "word") {
      replaceWith(setParentDeep(setNegate(parseFragment(defaultWordChar), negate), parent));
    } else {
      throw new Error(`Unexpected character set kind "${kind}"`);
    }
  },
  Directive({ node, parent, root, remove, replaceWith, removeAllPrevSiblings, removeAllNextSiblings }) {
    const { kind, flags } = node;
    if (kind === "flags") {
      if (!flags.enable && !flags.disable) {
        remove();
      } else {
        const flagGroup = A({ flags });
        flagGroup.body[0].body = removeAllNextSiblings();
        replaceWith(setParentDeep(flagGroup, parent), { traverse: true });
      }
    } else if (kind === "keep") {
      const firstAlt = root.body[0];
      const hasWrapperGroup = root.body.length === 1 && // Not emulatable if within a `CapturingGroup`
      o(firstAlt, { type: "Group" }) && firstAlt.body[0].body.length === 1;
      const topLevel = hasWrapperGroup ? firstAlt.body[0] : root;
      if (parent.parent !== topLevel || topLevel.body.length > 1) {
        throw new Error(r$1`Uses "\K" in a way that's unsupported`);
      }
      const lookbehind = K({ behind: true });
      lookbehind.body[0].body = removeAllPrevSiblings();
      replaceWith(setParentDeep(lookbehind, parent));
    } else {
      throw new Error(`Unexpected directive kind "${kind}"`);
    }
  },
  Flags({ node, parent }) {
    if (node.posixIsAscii) {
      throw new Error('Unsupported flag "P"');
    }
    if (node.textSegmentMode === "word") {
      throw new Error('Unsupported flag "y{w}"');
    }
    [
      "digitIsAscii",
      // Flag D
      "extended",
      // Flag x
      "posixIsAscii",
      // Flag P
      "spaceIsAscii",
      // Flag S
      "wordIsAscii",
      // Flag W
      "textSegmentMode"
      // Flag y{g} or y{w}
    ].forEach((f) => delete node[f]);
    Object.assign(node, {
      // JS flag g; no Onig equiv
      global: false,
      // JS flag d; no Onig equiv
      hasIndices: false,
      // JS flag m; no Onig equiv but its behavior is always on in Onig. Onig's only line break
      // char is line feed, unlike JS, so this flag isn't used since it would produce inaccurate
      // results (also allows `^` and `$` to be used in the generator for string start and end)
      multiline: false,
      // JS flag y; no Onig equiv, but used for `\G` emulation
      sticky: node.sticky ?? false
      // Note: Regex+ doesn't allow explicitly adding flags it handles implicitly, so leave out
      // properties `unicode` (JS flag u) and `unicodeSets` (JS flag v). Keep the existing values
      // for `ignoreCase` (flag i) and `dotAll` (JS flag s, but Onig flag m)
    });
    parent.options = {
      disable: {
        // Onig uses different rules for flag x than Regex+, so disable the implicit flag
        x: true,
        // Onig has no flag to control "named capture only" mode but contextually applies its
        // behavior when named capturing is used, so disable Regex+'s implicit flag for it
        n: true
      },
      force: {
        // Always add flag v because we're generating an AST that relies on it (it enables JS
        // support for Onig features nested classes, intersection, Unicode properties, etc.).
        // However, the generator might disable flag v based on its `target` option
        v: true
      }
    };
  },
  Group({ node }) {
    if (!node.flags) {
      return;
    }
    const { enable, disable } = node.flags;
    enable?.extended && delete enable.extended;
    disable?.extended && delete disable.extended;
    enable?.dotAll && disable?.dotAll && delete enable.dotAll;
    enable?.ignoreCase && disable?.ignoreCase && delete enable.ignoreCase;
    enable && !Object.keys(enable).length && delete node.flags.enable;
    disable && !Object.keys(disable).length && delete node.flags.disable;
    !node.flags.enable && !node.flags.disable && delete node.flags;
  },
  LookaroundAssertion({ node }, state) {
    const { kind } = node;
    if (kind === "lookbehind") {
      state.passedLookbehind = true;
    }
  },
  NamedCallout({ node, parent, replaceWith }) {
    const { kind } = node;
    if (kind === "fail") {
      replaceWith(setParentDeep(K({ negate: true }), parent));
    } else {
      throw new Error(`Unsupported named callout "(*${kind.toUpperCase()}"`);
    }
  },
  Quantifier({ node }) {
    if (node.body.type === "Quantifier") {
      const group = A();
      group.body[0].body.push(node.body);
      node.body = setParentDeep(group, node);
    }
  },
  Regex: {
    enter({ node }, { supportedGNodes }) {
      const leadingGs = [];
      let hasAltWithLeadG = false;
      let hasAltWithoutLeadG = false;
      for (const alt of node.body) {
        if (alt.body.length === 1 && alt.body[0].kind === "search_start") {
          alt.body.pop();
        } else {
          const leadingG = getLeadingG(alt.body);
          if (leadingG) {
            hasAltWithLeadG = true;
            Array.isArray(leadingG) ? leadingGs.push(...leadingG) : leadingGs.push(leadingG);
          } else {
            hasAltWithoutLeadG = true;
          }
        }
      }
      if (hasAltWithLeadG && !hasAltWithoutLeadG) {
        leadingGs.forEach((g) => supportedGNodes.add(g));
      }
    },
    exit(_, { accuracy, passedLookbehind, strategy }) {
      if (accuracy === "strict" && passedLookbehind && strategy) {
        throw new Error(r$1`Uses "\G" in a way that requires non-strict accuracy`);
      }
    }
  },
  Subroutine({ node }, { jsGroupNameMap }) {
    let { ref } = node;
    if (typeof ref === "string" && !isValidJsGroupName(ref)) {
      ref = getAndStoreJsGroupName(ref, jsGroupNameMap);
      node.ref = ref;
    }
  }
};
var SecondPassVisitor = {
  Backreference({ node }, { multiplexCapturesToLeftByRef, reffedNodesByReferencer }) {
    const { orphan, ref } = node;
    if (!orphan) {
      reffedNodesByReferencer.set(node, [...multiplexCapturesToLeftByRef.get(ref).map(({ node: node2 }) => node2)]);
    }
  },
  CapturingGroup: {
    enter({
      node,
      parent,
      replaceWith,
      skip
    }, {
      groupOriginByCopy,
      groupsByName,
      multiplexCapturesToLeftByRef,
      openRefs,
      reffedNodesByReferencer
    }) {
      const origin = groupOriginByCopy.get(node);
      if (origin && openRefs.has(node.number)) {
        const recursion2 = setParent(createRecursion(node.number), parent);
        reffedNodesByReferencer.set(recursion2, openRefs.get(node.number));
        replaceWith(recursion2);
        return;
      }
      openRefs.set(node.number, node);
      multiplexCapturesToLeftByRef.set(node.number, []);
      if (node.name) {
        getOrInsert(multiplexCapturesToLeftByRef, node.name, []);
      }
      const multiplexNodes = multiplexCapturesToLeftByRef.get(node.name ?? node.number);
      for (let i = 0; i < multiplexNodes.length; i++) {
        const multiplex = multiplexNodes[i];
        if (
          // This group is from subroutine expansion, and there's a multiplex value from either the
          // origin node or a prior subroutine expansion group with the same origin
          origin === multiplex.node || origin && origin === multiplex.origin || // This group is not from subroutine expansion, and it comes after a subroutine expansion
          // group that refers to this group
          node === multiplex.origin
        ) {
          multiplexNodes.splice(i, 1);
          break;
        }
      }
      multiplexCapturesToLeftByRef.get(node.number).push({ node, origin });
      if (node.name) {
        multiplexCapturesToLeftByRef.get(node.name).push({ node, origin });
      }
      if (node.name) {
        const groupsWithSameName = getOrInsert(groupsByName, node.name, /* @__PURE__ */ new Map());
        let hasDuplicateNameToRemove = false;
        if (origin) {
          hasDuplicateNameToRemove = true;
        } else {
          for (const groupInfo of groupsWithSameName.values()) {
            if (!groupInfo.hasDuplicateNameToRemove) {
              hasDuplicateNameToRemove = true;
              break;
            }
          }
        }
        groupsByName.get(node.name).set(node, { node, hasDuplicateNameToRemove });
      }
    },
    exit({ node }, { openRefs }) {
      openRefs.delete(node.number);
    }
  },
  Group: {
    enter({ node }, state) {
      state.prevFlags = state.currentFlags;
      if (node.flags) {
        state.currentFlags = getNewCurrentFlags(state.currentFlags, node.flags);
      }
    },
    exit(_, state) {
      state.currentFlags = state.prevFlags;
    }
  },
  Subroutine({ node, parent, replaceWith }, state) {
    const { isRecursive, ref } = node;
    if (isRecursive) {
      let reffed = parent;
      while (reffed = reffed.parent) {
        if (reffed.type === "CapturingGroup" && (reffed.name === ref || reffed.number === ref)) {
          break;
        }
      }
      state.reffedNodesByReferencer.set(node, reffed);
      return;
    }
    const reffedGroupNode = state.subroutineRefMap.get(ref);
    const isGlobalRecursion = ref === 0;
    const expandedSubroutine = isGlobalRecursion ? createRecursion(0) : (
      // The reffed group might itself contain subroutines, which are expanded during sub-traversal
      cloneCapturingGroup(reffedGroupNode, state.groupOriginByCopy, null)
    );
    let replacement = expandedSubroutine;
    if (!isGlobalRecursion) {
      const reffedGroupFlagMods = getCombinedFlagModsFromFlagNodes(getAllParents(
        reffedGroupNode,
        (p) => p.type === "Group" && !!p.flags
      ));
      const reffedGroupFlags = reffedGroupFlagMods ? getNewCurrentFlags(state.globalFlags, reffedGroupFlagMods) : state.globalFlags;
      if (!areFlagsEqual(reffedGroupFlags, state.currentFlags)) {
        replacement = A({
          flags: getFlagModsFromFlags(reffedGroupFlags)
        });
        replacement.body[0].body.push(expandedSubroutine);
      }
    }
    replaceWith(setParentDeep(replacement, parent), { traverse: !isGlobalRecursion });
  }
};
var ThirdPassVisitor = {
  Backreference({ node, parent, replaceWith }, state) {
    if (node.orphan) {
      state.highestOrphanBackref = Math.max(state.highestOrphanBackref, node.ref);
      return;
    }
    const reffedNodes = state.reffedNodesByReferencer.get(node);
    const participants = reffedNodes.filter((reffed) => canParticipateWithNode(reffed, node));
    if (!participants.length) {
      replaceWith(setParentDeep(K({ negate: true }), parent));
    } else if (participants.length > 1) {
      const group = A({
        atomic: true,
        body: participants.reverse().map((reffed) => b({
          body: [k(reffed.number)]
        }))
      });
      replaceWith(setParentDeep(group, parent));
    } else {
      node.ref = participants[0].number;
    }
  },
  CapturingGroup({ node }, state) {
    node.number = ++state.numCapturesToLeft;
    if (node.name) {
      if (state.groupsByName.get(node.name).get(node).hasDuplicateNameToRemove) {
        delete node.name;
      }
    }
  },
  Regex: {
    exit({ node }, state) {
      const numCapsNeeded = Math.max(state.highestOrphanBackref - state.numCapturesToLeft, 0);
      for (let i = 0; i < numCapsNeeded; i++) {
        const emptyCapture = P();
        node.body.at(-1).body.push(emptyCapture);
      }
    }
  },
  Subroutine({ node }, state) {
    if (!node.isRecursive || node.ref === 0) {
      return;
    }
    node.ref = state.reffedNodesByReferencer.get(node).number;
  }
};
function addParentProperties(root) {
  S(root, {
    "*"({ node, parent }) {
      node.parent = parent;
    }
  });
}
function areFlagsEqual(a, b) {
  return a.dotAll === b.dotAll && a.ignoreCase === b.ignoreCase;
}
function canParticipateWithNode(capture, node) {
  let rightmostPoint = node;
  do {
    if (rightmostPoint.type === "Regex") {
      return false;
    }
    if (rightmostPoint.type === "Alternative") {
      continue;
    }
    if (rightmostPoint === capture) {
      return false;
    }
    const kidsOfParent = getKids(rightmostPoint.parent);
    for (const kid of kidsOfParent) {
      if (kid === rightmostPoint) {
        break;
      }
      if (kid === capture || isAncestorOf(kid, capture)) {
        return true;
      }
    }
  } while (rightmostPoint = rightmostPoint.parent);
  throw new Error("Unexpected path");
}
function cloneCapturingGroup(obj, originMap, up, up2) {
  const store = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "parent") {
      store.parent = Array.isArray(up) ? up2 : up;
    } else if (value && typeof value === "object") {
      store[key] = cloneCapturingGroup(value, originMap, store, up);
    } else {
      if (key === "type" && value === "CapturingGroup") {
        originMap.set(store, originMap.get(obj) ?? obj);
      }
      store[key] = value;
    }
  }
  return store;
}
function createRecursion(ref) {
  const node = O(ref);
  node.isRecursive = true;
  return node;
}
function getAllParents(node, filterFn) {
  const results = [];
  while (node = node.parent) {
    if (!filterFn || filterFn(node)) {
      results.push(node);
    }
  }
  return results;
}
function getAndStoreJsGroupName(name, map) {
  if (map.has(name)) {
    return map.get(name);
  }
  const jsName = `$${map.size}_${name.replace(/^[^$_\p{IDS}]|[^$\u200C\u200D\p{IDC}]/ug, "_")}`;
  map.set(name, jsName);
  return jsName;
}
function getCombinedFlagModsFromFlagNodes(flagNodes) {
  const flagProps = ["dotAll", "ignoreCase"];
  const combinedFlags = { enable: {}, disable: {} };
  flagNodes.forEach(({ flags }) => {
    flagProps.forEach((prop) => {
      if (flags.enable?.[prop]) {
        delete combinedFlags.disable[prop];
        combinedFlags.enable[prop] = true;
      }
      if (flags.disable?.[prop]) {
        combinedFlags.disable[prop] = true;
      }
    });
  });
  if (!Object.keys(combinedFlags.enable).length) {
    delete combinedFlags.enable;
  }
  if (!Object.keys(combinedFlags.disable).length) {
    delete combinedFlags.disable;
  }
  if (combinedFlags.enable || combinedFlags.disable) {
    return combinedFlags;
  }
  return null;
}
function getFlagModsFromFlags({ dotAll, ignoreCase }) {
  const mods = {};
  if (dotAll || ignoreCase) {
    mods.enable = {};
    dotAll && (mods.enable.dotAll = true);
    ignoreCase && (mods.enable.ignoreCase = true);
  }
  if (!dotAll || !ignoreCase) {
    mods.disable = {};
    !dotAll && (mods.disable.dotAll = true);
    !ignoreCase && (mods.disable.ignoreCase = true);
  }
  return mods;
}
function getKids(node) {
  if (!node) {
    throw new Error("Node expected");
  }
  const { body } = node;
  return Array.isArray(body) ? body : body ? [body] : null;
}
function getLeadingG(els) {
  const firstToConsider = els.find((el) => el.kind === "search_start" || isLoneGLookaround(el, { negate: false }) || !isAlwaysZeroLength(el));
  if (!firstToConsider) {
    return null;
  }
  if (firstToConsider.kind === "search_start") {
    return firstToConsider;
  }
  if (firstToConsider.type === "LookaroundAssertion") {
    return firstToConsider.body[0].body[0];
  }
  if (firstToConsider.type === "CapturingGroup" || firstToConsider.type === "Group") {
    const gNodesForGroup = [];
    for (const alt of firstToConsider.body) {
      const leadingG = getLeadingG(alt.body);
      if (!leadingG) {
        return null;
      }
      Array.isArray(leadingG) ? gNodesForGroup.push(...leadingG) : gNodesForGroup.push(leadingG);
    }
    return gNodesForGroup;
  }
  return null;
}
function isAncestorOf(node, descendant) {
  const kids = getKids(node) ?? [];
  for (const kid of kids) {
    if (kid === descendant || isAncestorOf(kid, descendant)) {
      return true;
    }
  }
  return false;
}
function isAlwaysZeroLength({ type }) {
  return type === "Assertion" || type === "Directive" || type === "LookaroundAssertion";
}
function isAlwaysNonZeroLength(node) {
  const types = [
    "Character",
    "CharacterClass",
    "CharacterSet"
  ];
  return types.includes(node.type) || node.type === "Quantifier" && node.min && types.includes(node.body.type);
}
function isLoneGLookaround(node, options) {
  const opts = {
    negate: null,
    ...options
  };
  return node.type === "LookaroundAssertion" && (opts.negate === null || node.negate === opts.negate) && node.body.length === 1 && o(node.body[0], {
    type: "Assertion",
    kind: "search_start"
  });
}
function isValidJsGroupName(name) {
  return /^[$_\p{IDS}][$\u200C\u200D\p{IDC}]*$/u.test(name);
}
function parseFragment(pattern, options) {
  const ast = J(pattern, {
    ...options,
    // Providing a custom set of Unicode property names avoids converting some JS Unicode
    // properties (ex: `\p{Alpha}`) to Onig POSIX classes
    unicodePropertyMap: JsUnicodePropertyMap
  });
  const alts = ast.body;
  if (alts.length > 1 || alts[0].body.length > 1) {
    return A({ body: alts });
  }
  return alts[0].body[0];
}
function setNegate(node, negate) {
  node.negate = negate;
  return node;
}
function setParent(node, parent) {
  node.parent = parent;
  return node;
}
function setParentDeep(node, parent) {
  addParentProperties(node);
  node.parent = parent;
  return node;
}
function generate(ast, options) {
  const opts = getOptions(options);
  const minTargetEs2024 = isMinTarget(opts.target, "ES2024");
  const minTargetEs2025 = isMinTarget(opts.target, "ES2025");
  const recursionLimit = opts.rules.recursionLimit;
  if (!Number.isInteger(recursionLimit) || recursionLimit < 2 || recursionLimit > 20) {
    throw new Error("Invalid recursionLimit; use 2-20");
  }
  let hasCaseInsensitiveNode = null;
  let hasCaseSensitiveNode = null;
  if (!minTargetEs2025) {
    const iStack = [ast.flags.ignoreCase];
    S(ast, FlagModifierVisitor, {
      getCurrentModI: () => iStack.at(-1),
      popModI() {
        iStack.pop();
      },
      pushModI(isIOn) {
        iStack.push(isIOn);
      },
      setHasCasedChar() {
        if (iStack.at(-1)) {
          hasCaseInsensitiveNode = true;
        } else {
          hasCaseSensitiveNode = true;
        }
      }
    });
  }
  const appliedGlobalFlags = {
    dotAll: ast.flags.dotAll,
    // - Turn global flag i on if a case insensitive node was used and no case sensitive nodes were
    //   used (to avoid unnecessary node expansion).
    // - Turn global flag i off if a case sensitive node was used (since case sensitivity can't be
    //   forced without the use of ES2025 flag groups)
    ignoreCase: !!((ast.flags.ignoreCase || hasCaseInsensitiveNode) && !hasCaseSensitiveNode)
  };
  let lastNode = ast;
  const state = {
    accuracy: opts.accuracy,
    appliedGlobalFlags,
    captureMap: /* @__PURE__ */ new Map(),
    currentFlags: {
      dotAll: ast.flags.dotAll,
      ignoreCase: ast.flags.ignoreCase
    },
    inCharClass: false,
    lastNode,
    originMap: ast._originMap,
    recursionLimit,
    useAppliedIgnoreCase: !!(!minTargetEs2025 && hasCaseInsensitiveNode && hasCaseSensitiveNode),
    useFlagMods: minTargetEs2025,
    useFlagV: minTargetEs2024,
    verbose: opts.verbose
  };
  function gen(node) {
    state.lastNode = lastNode;
    lastNode = node;
    const fn = throwIfNullish(generator[node.type], `Unexpected node type "${node.type}"`);
    return fn(node, state, gen);
  }
  const result = {
    pattern: ast.body.map(gen).join("|"),
    // Could reset `lastNode` at this point via `lastNode = ast`, but it isn't needed by flags
    flags: gen(ast.flags),
    options: { ...ast.options }
  };
  if (!minTargetEs2024) {
    delete result.options.force.v;
    result.options.disable.v = true;
    result.options.unicodeSetsPlugin = null;
  }
  result._captureTransfers = /* @__PURE__ */ new Map();
  result._hiddenCaptures = [];
  state.captureMap.forEach((value, key) => {
    if (value.hidden) {
      result._hiddenCaptures.push(key);
    }
    if (value.transferTo) {
      getOrInsert(result._captureTransfers, value.transferTo, []).push(key);
    }
  });
  return result;
}
var FlagModifierVisitor = {
  "*": {
    enter({ node }, state) {
      if (isAnyGroup(node)) {
        const currentModI = state.getCurrentModI();
        state.pushModI(
          node.flags ? getNewCurrentFlags({ ignoreCase: currentModI }, node.flags).ignoreCase : currentModI
        );
      }
    },
    exit({ node }, state) {
      if (isAnyGroup(node)) {
        state.popModI();
      }
    }
  },
  Backreference(_, state) {
    state.setHasCasedChar();
  },
  Character({ node }, state) {
    if (charHasCase(cp(node.value))) {
      state.setHasCasedChar();
    }
  },
  CharacterClassRange({ node, skip }, state) {
    skip();
    if (getCasesOutsideCharClassRange(node, { firstOnly: true }).length) {
      state.setHasCasedChar();
    }
  },
  CharacterSet({ node }, state) {
    if (node.kind === "property" && UnicodePropertiesWithSpecificCase.has(node.value)) {
      state.setHasCasedChar();
    }
  }
};
var generator = {
  /**
  @param {AlternativeNode} node
  */
  Alternative({ body }, _, gen) {
    return body.map(gen).join("");
  },
  /**
  @param {AssertionNode} node
  */
  Assertion({ kind, negate }) {
    if (kind === "string_end") {
      return "$";
    }
    if (kind === "string_start") {
      return "^";
    }
    if (kind === "word_boundary") {
      return negate ? r$1`\B` : r$1`\b`;
    }
    throw new Error(`Unexpected assertion kind "${kind}"`);
  },
  /**
  @param {BackreferenceNode} node
  */
  Backreference({ ref }, state) {
    if (typeof ref !== "number") {
      throw new Error("Unexpected named backref in transformed AST");
    }
    if (!state.useFlagMods && state.accuracy === "strict" && state.currentFlags.ignoreCase && !state.captureMap.get(ref).ignoreCase) {
      throw new Error("Use of case-insensitive backref to case-sensitive group requires target ES2025 or non-strict accuracy");
    }
    return "\\" + ref;
  },
  /**
  @param {CapturingGroupNode} node
  */
  CapturingGroup(node, state, gen) {
    const { body, name, number } = node;
    const data = { ignoreCase: state.currentFlags.ignoreCase };
    const origin = state.originMap.get(node);
    if (origin) {
      data.hidden = true;
      if (number > origin.number) {
        data.transferTo = origin.number;
      }
    }
    state.captureMap.set(number, data);
    return `(${name ? `?<${name}>` : ""}${body.map(gen).join("|")})`;
  },
  /**
  @param {CharacterNode} node
  */
  Character({ value }, state) {
    const char = cp(value);
    const escaped = getCharEscape(value, {
      escDigit: state.lastNode.type === "Backreference",
      inCharClass: state.inCharClass,
      useFlagV: state.useFlagV
    });
    if (escaped !== char) {
      return escaped;
    }
    if (state.useAppliedIgnoreCase && state.currentFlags.ignoreCase && charHasCase(char)) {
      const cases = getIgnoreCaseMatchChars(char);
      return state.inCharClass ? cases.join("") : cases.length > 1 ? `[${cases.join("")}]` : cases[0];
    }
    return char;
  },
  /**
  @param {CharacterClassNode} node
  */
  CharacterClass(node, state, gen) {
    const { kind, negate, parent } = node;
    let { body } = node;
    if (kind === "intersection" && !state.useFlagV) {
      throw new Error("Use of class intersection requires min target ES2024");
    }
    if (envFlags.bugFlagVLiteralHyphenIsRange && state.useFlagV && body.some(isLiteralHyphen)) {
      body = [m(45), ...body.filter((kid) => !isLiteralHyphen(kid))];
    }
    const genClass = () => `[${negate ? "^" : ""}${body.map(gen).join(kind === "intersection" ? "&&" : "")}]`;
    if (!state.inCharClass) {
      if (
        // Already established `kind !== 'intersection'` if `!state.useFlagV`; don't check again
        (!state.useFlagV || envFlags.bugNestedClassIgnoresNegation) && !negate
      ) {
        const negatedChildClasses = body.filter(
          (kid) => kid.type === "CharacterClass" && kid.kind === "union" && kid.negate
        );
        if (negatedChildClasses.length) {
          const group = A();
          const groupFirstAlt = group.body[0];
          group.parent = parent;
          groupFirstAlt.parent = group;
          body = body.filter((kid) => !negatedChildClasses.includes(kid));
          node.body = body;
          if (body.length) {
            node.parent = groupFirstAlt;
            groupFirstAlt.body.push(node);
          } else {
            group.body.pop();
          }
          negatedChildClasses.forEach((cc) => {
            const newAlt = b({ body: [cc] });
            cc.parent = newAlt;
            newAlt.parent = group;
            group.body.push(newAlt);
          });
          return gen(group);
        }
      }
      state.inCharClass = true;
      const result = genClass();
      state.inCharClass = false;
      return result;
    }
    const firstEl = body[0];
    if (
      // Already established that the parent is a char class via `inCharClass`; don't check again
      kind === "union" && !negate && firstEl && // Allows many nested classes to work with `target` ES2018 which doesn't support nesting
      ((!state.useFlagV || !state.verbose) && parent.kind === "union" && !(envFlags.bugFlagVLiteralHyphenIsRange && state.useFlagV) || !state.verbose && parent.kind === "intersection" && // JS doesn't allow intersection with union or ranges
      body.length === 1 && firstEl.type !== "CharacterClassRange")
    ) {
      return body.map(gen).join("");
    }
    if (!state.useFlagV && parent.type === "CharacterClass") {
      throw new Error("Use of nested character class requires min target ES2024");
    }
    return genClass();
  },
  /**
  @param {CharacterClassRangeNode} node
  */
  CharacterClassRange(node, state) {
    const min = node.min.value;
    const max = node.max.value;
    const escOpts = {
      escDigit: false,
      inCharClass: true,
      useFlagV: state.useFlagV
    };
    const minStr = getCharEscape(min, escOpts);
    const maxStr = getCharEscape(max, escOpts);
    const extraChars = /* @__PURE__ */ new Set();
    if (state.useAppliedIgnoreCase && state.currentFlags.ignoreCase) {
      const charsOutsideRange = getCasesOutsideCharClassRange(node);
      const ranges = getCodePointRangesFromChars(charsOutsideRange);
      ranges.forEach((value) => {
        extraChars.add(
          Array.isArray(value) ? `${getCharEscape(value[0], escOpts)}-${getCharEscape(value[1], escOpts)}` : getCharEscape(value, escOpts)
        );
      });
    }
    return `${minStr}-${maxStr}${[...extraChars].join("")}`;
  },
  /**
  @param {CharacterSetNode} node
  */
  CharacterSet({ kind, negate, value, key }, state) {
    if (kind === "dot") {
      return state.currentFlags.dotAll ? state.appliedGlobalFlags.dotAll || state.useFlagMods ? "." : "[^]" : (
        // Onig's only line break char is line feed, unlike JS
        r$1`[^\n]`
      );
    }
    if (kind === "digit") {
      return negate ? r$1`\D` : r$1`\d`;
    }
    if (kind === "property") {
      if (state.useAppliedIgnoreCase && state.currentFlags.ignoreCase && UnicodePropertiesWithSpecificCase.has(value)) {
        throw new Error(`Unicode property "${value}" can't be case-insensitive when other chars have specific case`);
      }
      return `${negate ? r$1`\P` : r$1`\p`}{${key ? `${key}=` : ""}${value}}`;
    }
    if (kind === "word") {
      return negate ? r$1`\W` : r$1`\w`;
    }
    throw new Error(`Unexpected character set kind "${kind}"`);
  },
  /**
  @param {FlagsNode} node
  */
  Flags(node, state) {
    return (
      // The transformer should never turn on the properties for flags d, g, m since Onig doesn't
      // have equivs. Flag m is never used since Onig uses different line break chars than JS
      // (node.hasIndices ? 'd' : '') +
      // (node.global ? 'g' : '') +
      // (node.multiline ? 'm' : '') +
      (state.appliedGlobalFlags.ignoreCase ? "i" : "") + (node.dotAll ? "s" : "") + (node.sticky ? "y" : "")
    );
  },
  /**
  @param {GroupNode} node
  */
  Group({ atomic: atomic2, body, flags, parent }, state, gen) {
    const currentFlags = state.currentFlags;
    if (flags) {
      state.currentFlags = getNewCurrentFlags(currentFlags, flags);
    }
    const contents = body.map(gen).join("|");
    const result = !state.verbose && body.length === 1 && // Single alt
    parent.type !== "Quantifier" && !atomic2 && (!state.useFlagMods || !flags) ? contents : `(?${getGroupPrefix(atomic2, flags, state.useFlagMods)}${contents})`;
    state.currentFlags = currentFlags;
    return result;
  },
  /**
  @param {LookaroundAssertionNode} node
  */
  LookaroundAssertion({ body, kind, negate }, _, gen) {
    const prefix = `${kind === "lookahead" ? "" : "<"}${negate ? "!" : "="}`;
    return `(?${prefix}${body.map(gen).join("|")})`;
  },
  /**
  @param {QuantifierNode} node
  */
  Quantifier(node, _, gen) {
    return gen(node.body) + getQuantifierStr(node);
  },
  /**
  @param {SubroutineNode & {isRecursive: true}} node
  */
  Subroutine({ isRecursive, ref }, state) {
    if (!isRecursive) {
      throw new Error("Unexpected non-recursive subroutine in transformed AST");
    }
    const limit = state.recursionLimit;
    return ref === 0 ? `(?R=${limit})` : r$1`\g<${ref}&R=${limit}>`;
  }
};
var BaseEscapeChars = /* @__PURE__ */ new Set([
  "$",
  "(",
  ")",
  "*",
  "+",
  ".",
  "?",
  "[",
  "\\",
  "]",
  "^",
  "{",
  "|",
  "}"
]);
var CharClassEscapeChars = /* @__PURE__ */ new Set([
  "-",
  "\\",
  "]",
  "^",
  // Literal `[` doesn't require escaping with flag u, but this can help work around regex source
  // linters and regex syntax processors that expect unescaped `[` to create a nested class
  "["
]);
var CharClassEscapeCharsFlagV = /* @__PURE__ */ new Set([
  "(",
  ")",
  "-",
  "/",
  "[",
  "\\",
  "]",
  "^",
  "{",
  "|",
  "}",
  // Double punctuators; also includes already-listed `-` and `^`
  "!",
  "#",
  "$",
  "%",
  "&",
  "*",
  "+",
  ",",
  ".",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "`",
  "~"
]);
var CharCodeEscapeMap = /* @__PURE__ */ new Map([
  [9, r$1`\t`],
  // horizontal tab
  [10, r$1`\n`],
  // line feed
  [11, r$1`\v`],
  // vertical tab
  [12, r$1`\f`],
  // form feed
  [13, r$1`\r`],
  // carriage return
  [8232, r$1`\u2028`],
  // line separator
  [8233, r$1`\u2029`],
  // paragraph separator
  [65279, r$1`\uFEFF`]
  // ZWNBSP/BOM
]);
var casedRe = /^\p{Cased}$/u;
function charHasCase(char) {
  return casedRe.test(char);
}
function getCasesOutsideCharClassRange(node, options) {
  const firstOnly = !!options?.firstOnly;
  const min = node.min.value;
  const max = node.max.value;
  const found = [];
  if (min < 65 && (max === 65535 || max >= 131071) || min === 65536 && max >= 131071) {
    return found;
  }
  for (let i = min; i <= max; i++) {
    const char = cp(i);
    if (!charHasCase(char)) {
      continue;
    }
    const charsOutsideRange = getIgnoreCaseMatchChars(char).filter((caseOfChar) => {
      const num = caseOfChar.codePointAt(0);
      return num < min || num > max;
    });
    if (charsOutsideRange.length) {
      found.push(...charsOutsideRange);
      if (firstOnly) {
        break;
      }
    }
  }
  return found;
}
function getCharEscape(codePoint, { escDigit, inCharClass, useFlagV }) {
  if (CharCodeEscapeMap.has(codePoint)) {
    return CharCodeEscapeMap.get(codePoint);
  }
  if (
    // Control chars, etc.; condition modeled on the Chrome developer console's display for strings
    codePoint < 32 || codePoint > 126 && codePoint < 160 || // Unicode planes 4-16; unassigned, special purpose, and private use area
    codePoint > 262143 || // Avoid corrupting a preceding backref by immediately following it with a literal digit
    escDigit && isDigitCharCode(codePoint)
  ) {
    return codePoint > 255 ? `\\u{${codePoint.toString(16).toUpperCase()}}` : `\\x${codePoint.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  const escapeChars = inCharClass ? useFlagV ? CharClassEscapeCharsFlagV : CharClassEscapeChars : BaseEscapeChars;
  const char = cp(codePoint);
  return (escapeChars.has(char) ? "\\" : "") + char;
}
function getCodePointRangesFromChars(chars) {
  const codePoints = chars.map((char) => char.codePointAt(0)).sort((a, b) => a - b);
  const values = [];
  let start = null;
  for (let i = 0; i < codePoints.length; i++) {
    if (codePoints[i + 1] === codePoints[i] + 1) {
      start ??= codePoints[i];
    } else if (start === null) {
      values.push(codePoints[i]);
    } else {
      values.push([start, codePoints[i]]);
      start = null;
    }
  }
  return values;
}
function getGroupPrefix(atomic2, flagMods, useFlagMods) {
  if (atomic2) {
    return ">";
  }
  let mods = "";
  if (flagMods && useFlagMods) {
    const { enable, disable } = flagMods;
    mods = (enable?.ignoreCase ? "i" : "") + (enable?.dotAll ? "s" : "") + (disable ? "-" : "") + (disable?.ignoreCase ? "i" : "") + (disable?.dotAll ? "s" : "");
  }
  return `${mods}:`;
}
function getQuantifierStr({ kind, max, min }) {
  let base;
  if (!min && max === 1) {
    base = "?";
  } else if (!min && max === Infinity) {
    base = "*";
  } else if (min === 1 && max === Infinity) {
    base = "+";
  } else if (min === max) {
    base = `{${min}}`;
  } else {
    base = `{${min},${max === Infinity ? "" : max}}`;
  }
  return base + {
    greedy: "",
    lazy: "?",
    possessive: "+"
  }[kind];
}
function isAnyGroup({ type }) {
  return type === "CapturingGroup" || type === "Group" || type === "LookaroundAssertion";
}
function isDigitCharCode(value) {
  return value > 47 && value < 58;
}
function isLiteralHyphen({ type, value }) {
  return type === "Character" && value === 45;
}

// src/subclass.js
var EmulatedRegExp = class _EmulatedRegExp extends RegExp {
  /**
  @type {Map<number, {
    hidden?: true;
    transferTo?: number;
  }>}
  */
  #captureMap = /* @__PURE__ */ new Map();
  /**
  @type {RegExp | EmulatedRegExp | null}
  */
  #compiled = null;
  /**
  @type {string}
  */
  #pattern;
  /**
  @type {Map<number, string>?}
  */
  #nameMap = null;
  /**
  @type {string?}
  */
  #strategy = null;
  /**
  Can be used to serialize the instance.
  @type {EmulatedRegExpOptions}
  */
  rawOptions = {};
  // Override the getter with one that works with lazy-compiled regexes
  get source() {
    return this.#pattern || "(?:)";
  }
  /**
  @overload
  @param {string} pattern
  @param {string} [flags]
  @param {EmulatedRegExpOptions} [options]
  */
  /**
  @overload
  @param {EmulatedRegExp} pattern
  @param {string} [flags]
  */
  constructor(pattern, flags, options) {
    const lazyCompile = !!options?.lazyCompile;
    if (pattern instanceof RegExp) {
      if (options) {
        throw new Error("Cannot provide options when copying a regexp");
      }
      const re = pattern;
      super(re, flags);
      this.#pattern = re.source;
      if (re instanceof _EmulatedRegExp) {
        this.#captureMap = re.#captureMap;
        this.#nameMap = re.#nameMap;
        this.#strategy = re.#strategy;
        this.rawOptions = re.rawOptions;
      }
    } else {
      const opts = {
        hiddenCaptures: [],
        strategy: null,
        transfers: [],
        ...options
      };
      super(lazyCompile ? "" : pattern, flags);
      this.#pattern = pattern;
      this.#captureMap = createCaptureMap(opts.hiddenCaptures, opts.transfers);
      this.#strategy = opts.strategy;
      this.rawOptions = options ?? {};
    }
    if (!lazyCompile) {
      this.#compiled = this;
    }
  }
  /**
  Called internally by all String/RegExp methods that use regexes.
  @override
  @param {string} str
  @returns {RegExpExecArray?}
  */
  exec(str) {
    if (!this.#compiled) {
      const { lazyCompile, ...rest } = this.rawOptions;
      this.#compiled = new _EmulatedRegExp(this.#pattern, this.flags, rest);
    }
    const useLastIndex = this.global || this.sticky;
    const pos = this.lastIndex;
    if (this.#strategy === "clip_search" && useLastIndex && pos) {
      this.lastIndex = 0;
      const match = this.#execCore(str.slice(pos));
      if (match) {
        adjustMatchDetailsForOffset(match, pos, str, this.hasIndices);
        this.lastIndex += pos;
      }
      return match;
    }
    return this.#execCore(str);
  }
  /**
  Adds support for hidden and transfer captures.
  @param {string} str
  @returns
  */
  #execCore(str) {
    this.#compiled.lastIndex = this.lastIndex;
    const match = super.exec.call(this.#compiled, str);
    this.lastIndex = this.#compiled.lastIndex;
    if (!match || !this.#captureMap.size) {
      return match;
    }
    const matchCopy = [...match];
    match.length = 1;
    let indicesCopy;
    if (this.hasIndices) {
      indicesCopy = [...match.indices];
      match.indices.length = 1;
    }
    const mappedNums = [0];
    for (let i = 1; i < matchCopy.length; i++) {
      const { hidden, transferTo } = this.#captureMap.get(i) ?? {};
      if (hidden) {
        mappedNums.push(null);
      } else {
        mappedNums.push(match.length);
        match.push(matchCopy[i]);
        if (this.hasIndices) {
          match.indices.push(indicesCopy[i]);
        }
      }
      if (transferTo && matchCopy[i] !== void 0) {
        const to = mappedNums[transferTo];
        if (!to) {
          throw new Error(`Invalid capture transfer to "${to}"`);
        }
        match[to] = matchCopy[i];
        if (this.hasIndices) {
          match.indices[to] = indicesCopy[i];
        }
        if (match.groups) {
          if (!this.#nameMap) {
            this.#nameMap = createNameMap(this.source);
          }
          const name = this.#nameMap.get(transferTo);
          if (name) {
            match.groups[name] = matchCopy[i];
            if (this.hasIndices) {
              match.indices.groups[name] = indicesCopy[i];
            }
          }
        }
      }
    }
    return match;
  }
};
function adjustMatchDetailsForOffset(match, offset, input, hasIndices) {
  match.index += offset;
  match.input = input;
  if (hasIndices) {
    const indices = match.indices;
    for (let i = 0; i < indices.length; i++) {
      const arr = indices[i];
      if (arr) {
        indices[i] = [arr[0] + offset, arr[1] + offset];
      }
    }
    const groupIndices = indices.groups;
    if (groupIndices) {
      Object.keys(groupIndices).forEach((key) => {
        const arr = groupIndices[key];
        if (arr) {
          groupIndices[key] = [arr[0] + offset, arr[1] + offset];
        }
      });
    }
  }
}
function createCaptureMap(hiddenCaptures, transfers) {
  const captureMap = /* @__PURE__ */ new Map();
  for (const num of hiddenCaptures) {
    captureMap.set(num, {
      hidden: true
    });
  }
  for (const [to, from] of transfers) {
    for (const num of from) {
      getOrInsert(captureMap, num, {}).transferTo = to;
    }
  }
  return captureMap;
}
function createNameMap(pattern) {
  const re = /(?<capture>\((?:\?<(?![=!])(?<name>[^>]+)>|(?!\?)))|\\?./gsu;
  const map = /* @__PURE__ */ new Map();
  let numCharClassesOpen = 0;
  let numCaptures = 0;
  let match;
  while (match = re.exec(pattern)) {
    const { 0: m, groups: { capture, name } } = match;
    if (m === "[") {
      numCharClassesOpen++;
    } else if (!numCharClassesOpen) {
      if (capture) {
        numCaptures++;
        if (name) {
          map.set(numCaptures, name);
        }
      }
    } else if (m === "]") {
      numCharClassesOpen--;
    }
  }
  return map;
}
function toRegExp(pattern, options) {
  const d = toRegExpDetails(pattern, options);
  if (d.options) {
    return new EmulatedRegExp(d.pattern, d.flags, d.options);
  }
  return new RegExp(d.pattern, d.flags);
}
function toRegExpDetails(pattern, options) {
  const opts = getOptions(options);
  const onigurumaAst = J(pattern, {
    flags: opts.flags,
    normalizeUnknownPropertyNames: true,
    rules: {
      captureGroup: opts.rules.captureGroup,
      singleline: opts.rules.singleline
    },
    skipBackrefValidation: opts.rules.allowOrphanBackrefs,
    unicodePropertyMap: JsUnicodePropertyMap
  });
  const regexPlusAst = transform(onigurumaAst, {
    accuracy: opts.accuracy,
    asciiWordBoundaries: opts.rules.asciiWordBoundaries,
    avoidSubclass: opts.avoidSubclass,
    bestEffortTarget: opts.target
  });
  const generated = generate(regexPlusAst, opts);
  const recursionResult = recursion(generated.pattern, {
    captureTransfers: generated._captureTransfers,
    hiddenCaptures: generated._hiddenCaptures,
    mode: "external"
  });
  const possessiveResult = possessive(recursionResult.pattern);
  const atomicResult = atomic(possessiveResult.pattern, {
    captureTransfers: recursionResult.captureTransfers,
    hiddenCaptures: recursionResult.hiddenCaptures
  });
  const details = {
    pattern: atomicResult.pattern,
    flags: `${opts.hasIndices ? "d" : ""}${opts.global ? "g" : ""}${generated.flags}${generated.options.disable.v ? "u" : "v"}`
  };
  if (opts.avoidSubclass) {
    if (opts.lazyCompileLength !== Infinity) {
      throw new Error("Lazy compilation requires subclass");
    }
  } else {
    const hiddenCaptures = atomicResult.hiddenCaptures.sort((a, b) => a - b);
    const transfers = Array.from(atomicResult.captureTransfers);
    const strategy = regexPlusAst._strategy;
    const lazyCompile = details.pattern.length >= opts.lazyCompileLength;
    if (hiddenCaptures.length || transfers.length || strategy || lazyCompile) {
      details.options = {
        ...hiddenCaptures.length && { hiddenCaptures },
        ...transfers.length && { transfers },
        ...strategy && { strategy },
        ...lazyCompile && { lazyCompile }
      };
    }
  }
  return details;
}

const MAX = 4294967295;
class JavaScriptScanner {
  constructor(patterns, options = {}) {
    this.patterns = patterns;
    this.options = options;
    const {
      forgiving = false,
      cache,
      regexConstructor
    } = options;
    if (!regexConstructor) {
      throw new Error("Option `regexConstructor` is not provided");
    }
    this.regexps = patterns.map((p) => {
      if (typeof p !== "string") {
        return p;
      }
      const cached = cache?.get(p);
      if (cached) {
        if (cached instanceof RegExp) {
          return cached;
        }
        if (forgiving)
          return null;
        throw cached;
      }
      try {
        const regex = regexConstructor(p);
        cache?.set(p, regex);
        return regex;
      } catch (e) {
        cache?.set(p, e);
        if (forgiving)
          return null;
        throw e;
      }
    });
  }
  regexps;
  findNextMatchSync(string, startPosition, _options) {
    const str = typeof string === "string" ? string : string.content;
    const pending = [];
    function toResult(index, match, offset = 0) {
      return {
        index,
        captureIndices: match.indices.map((indice) => {
          if (indice == null) {
            return {
              start: MAX,
              end: MAX,
              length: 0
            };
          }
          return {
            start: indice[0] + offset,
            end: indice[1] + offset,
            length: indice[1] - indice[0]
          };
        })
      };
    }
    for (let i = 0; i < this.regexps.length; i++) {
      const regexp = this.regexps[i];
      if (!regexp)
        continue;
      try {
        regexp.lastIndex = startPosition;
        const match = regexp.exec(str);
        if (!match)
          continue;
        if (match.index === startPosition) {
          return toResult(i, match, 0);
        }
        pending.push([i, match, 0]);
      } catch (e) {
        if (this.options.forgiving)
          continue;
        throw e;
      }
    }
    if (pending.length) {
      const minIndex = Math.min(...pending.map((m) => m[1].index));
      for (const [i, match, offset] of pending) {
        if (match.index === minIndex) {
          return toResult(i, match, offset);
        }
      }
    }
    return null;
  }
}

function defaultJavaScriptRegexConstructor(pattern, options) {
  return toRegExp(
    pattern,
    {
      global: true,
      hasIndices: true,
      // This has no benefit for the standard JS engine, but it avoids a perf penalty for
      // precompiled grammars when constructing extremely long patterns that aren't always used
      lazyCompileLength: 3e3,
      rules: {
        // Needed since TextMate grammars merge backrefs across patterns
        allowOrphanBackrefs: true,
        // Improves search performance for generated regexes
        asciiWordBoundaries: true,
        // Follow `vscode-oniguruma` which enables this Oniguruma option by default
        captureGroup: true,
        // Oniguruma uses depth limit `20`; lowered here to keep regexes shorter and maybe
        // sometimes faster, but can be increased if issues reported due to low limit
        recursionLimit: 5,
        // Oniguruma option for `^`->`\A`, `$`->`\Z`; improves search performance without any
        // change in meaning since TM grammars search line by line
        singleline: true
      },
      ...options
    }
  );
}
function createJavaScriptRegexEngine(options = {}) {
  const _options = Object.assign(
    {
      target: "auto",
      cache: /* @__PURE__ */ new Map()
    },
    options
  );
  _options.regexConstructor ||= (pattern) => defaultJavaScriptRegexConstructor(pattern, { target: _options.target });
  return {
    createScanner(patterns) {
      return new JavaScriptScanner(patterns, _options);
    },
    createString(s) {
      return {
        content: s
      };
    }
  };
}

/* Theme: dark-plus */
var themeDarkPlus = Object.freeze(JSON.parse("{\"colors\":{\"actionBar.toggledBackground\":\"#383a49\",\"activityBarBadge.background\":\"#007ACC\",\"checkbox.border\":\"#6B6B6B\",\"editor.background\":\"#1E1E1E\",\"editor.foreground\":\"#D4D4D4\",\"editor.inactiveSelectionBackground\":\"#3A3D41\",\"editor.selectionHighlightBackground\":\"#ADD6FF26\",\"editorIndentGuide.activeBackground1\":\"#707070\",\"editorIndentGuide.background1\":\"#404040\",\"input.placeholderForeground\":\"#A6A6A6\",\"list.activeSelectionIconForeground\":\"#FFF\",\"list.dropBackground\":\"#383B3D\",\"menu.background\":\"#252526\",\"menu.border\":\"#454545\",\"menu.foreground\":\"#CCCCCC\",\"menu.selectionBackground\":\"#0078d4\",\"menu.separatorBackground\":\"#454545\",\"ports.iconRunningProcessForeground\":\"#369432\",\"sideBarSectionHeader.background\":\"#0000\",\"sideBarSectionHeader.border\":\"#ccc3\",\"sideBarTitle.foreground\":\"#BBBBBB\",\"statusBarItem.remoteBackground\":\"#16825D\",\"statusBarItem.remoteForeground\":\"#FFF\",\"tab.lastPinnedBorder\":\"#ccc3\",\"tab.selectedBackground\":\"#222222\",\"tab.selectedForeground\":\"#ffffffa0\",\"terminal.inactiveSelectionBackground\":\"#3A3D41\",\"widget.border\":\"#303031\"},\"displayName\":\"Dark Plus\",\"name\":\"dark-plus\",\"semanticHighlighting\":true,\"semanticTokenColors\":{\"customLiteral\":\"#DCDCAA\",\"newOperator\":\"#C586C0\",\"numberLiteral\":\"#b5cea8\",\"stringLiteral\":\"#ce9178\"},\"tokenColors\":[{\"scope\":[\"meta.embedded\",\"source.groovy.embedded\",\"string meta.image.inline.markdown\",\"variable.legacy.builtin.python\"],\"settings\":{\"foreground\":\"#D4D4D4\"}},{\"scope\":\"emphasis\",\"settings\":{\"fontStyle\":\"italic\"}},{\"scope\":\"strong\",\"settings\":{\"fontStyle\":\"bold\"}},{\"scope\":\"header\",\"settings\":{\"foreground\":\"#000080\"}},{\"scope\":\"comment\",\"settings\":{\"foreground\":\"#6A9955\"}},{\"scope\":\"constant.language\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":[\"constant.numeric\",\"variable.other.enummember\",\"keyword.operator.plus.exponent\",\"keyword.operator.minus.exponent\"],\"settings\":{\"foreground\":\"#b5cea8\"}},{\"scope\":\"constant.regexp\",\"settings\":{\"foreground\":\"#646695\"}},{\"scope\":\"entity.name.tag\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":[\"entity.name.tag.css\",\"entity.name.tag.less\"],\"settings\":{\"foreground\":\"#d7ba7d\"}},{\"scope\":\"entity.other.attribute-name\",\"settings\":{\"foreground\":\"#9cdcfe\"}},{\"scope\":[\"entity.other.attribute-name.class.css\",\"source.css entity.other.attribute-name.class\",\"entity.other.attribute-name.id.css\",\"entity.other.attribute-name.parent-selector.css\",\"entity.other.attribute-name.parent.less\",\"source.css entity.other.attribute-name.pseudo-class\",\"entity.other.attribute-name.pseudo-element.css\",\"source.css.less entity.other.attribute-name.id\",\"entity.other.attribute-name.scss\"],\"settings\":{\"foreground\":\"#d7ba7d\"}},{\"scope\":\"invalid\",\"settings\":{\"foreground\":\"#f44747\"}},{\"scope\":\"markup.underline\",\"settings\":{\"fontStyle\":\"underline\"}},{\"scope\":\"markup.bold\",\"settings\":{\"fontStyle\":\"bold\",\"foreground\":\"#569cd6\"}},{\"scope\":\"markup.heading\",\"settings\":{\"fontStyle\":\"bold\",\"foreground\":\"#569cd6\"}},{\"scope\":\"markup.italic\",\"settings\":{\"fontStyle\":\"italic\"}},{\"scope\":\"markup.strikethrough\",\"settings\":{\"fontStyle\":\"strikethrough\"}},{\"scope\":\"markup.inserted\",\"settings\":{\"foreground\":\"#b5cea8\"}},{\"scope\":\"markup.deleted\",\"settings\":{\"foreground\":\"#ce9178\"}},{\"scope\":\"markup.changed\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"punctuation.definition.quote.begin.markdown\",\"settings\":{\"foreground\":\"#6A9955\"}},{\"scope\":\"punctuation.definition.list.begin.markdown\",\"settings\":{\"foreground\":\"#6796e6\"}},{\"scope\":\"markup.inline.raw\",\"settings\":{\"foreground\":\"#ce9178\"}},{\"scope\":\"punctuation.definition.tag\",\"settings\":{\"foreground\":\"#808080\"}},{\"scope\":[\"meta.preprocessor\",\"entity.name.function.preprocessor\"],\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"meta.preprocessor.string\",\"settings\":{\"foreground\":\"#ce9178\"}},{\"scope\":\"meta.preprocessor.numeric\",\"settings\":{\"foreground\":\"#b5cea8\"}},{\"scope\":\"meta.structure.dictionary.key.python\",\"settings\":{\"foreground\":\"#9cdcfe\"}},{\"scope\":\"meta.diff.header\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"storage\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"storage.type\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":[\"storage.modifier\",\"keyword.operator.noexcept\"],\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":[\"string\",\"meta.embedded.assembly\"],\"settings\":{\"foreground\":\"#ce9178\"}},{\"scope\":\"string.tag\",\"settings\":{\"foreground\":\"#ce9178\"}},{\"scope\":\"string.value\",\"settings\":{\"foreground\":\"#ce9178\"}},{\"scope\":\"string.regexp\",\"settings\":{\"foreground\":\"#d16969\"}},{\"scope\":[\"punctuation.definition.template-expression.begin\",\"punctuation.definition.template-expression.end\",\"punctuation.section.embedded\"],\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":[\"meta.template.expression\"],\"settings\":{\"foreground\":\"#d4d4d4\"}},{\"scope\":[\"support.type.vendored.property-name\",\"support.type.property-name\",\"source.css variable\",\"source.coffee.embedded\"],\"settings\":{\"foreground\":\"#9cdcfe\"}},{\"scope\":\"keyword\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"keyword.control\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"keyword.operator\",\"settings\":{\"foreground\":\"#d4d4d4\"}},{\"scope\":[\"keyword.operator.new\",\"keyword.operator.expression\",\"keyword.operator.cast\",\"keyword.operator.sizeof\",\"keyword.operator.alignof\",\"keyword.operator.typeid\",\"keyword.operator.alignas\",\"keyword.operator.instanceof\",\"keyword.operator.logical.python\",\"keyword.operator.wordlike\"],\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"keyword.other.unit\",\"settings\":{\"foreground\":\"#b5cea8\"}},{\"scope\":[\"punctuation.section.embedded.begin.php\",\"punctuation.section.embedded.end.php\"],\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"support.function.git-rebase\",\"settings\":{\"foreground\":\"#9cdcfe\"}},{\"scope\":\"constant.sha.git-rebase\",\"settings\":{\"foreground\":\"#b5cea8\"}},{\"scope\":[\"storage.modifier.import.java\",\"variable.language.wildcard.java\",\"storage.modifier.package.java\"],\"settings\":{\"foreground\":\"#d4d4d4\"}},{\"scope\":\"variable.language\",\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":[\"entity.name.function\",\"support.function\",\"support.constant.handlebars\",\"source.powershell variable.other.member\",\"entity.name.operator.custom-literal\"],\"settings\":{\"foreground\":\"#DCDCAA\"}},{\"scope\":[\"support.class\",\"support.type\",\"entity.name.type\",\"entity.name.namespace\",\"entity.other.attribute\",\"entity.name.scope-resolution\",\"entity.name.class\",\"storage.type.numeric.go\",\"storage.type.byte.go\",\"storage.type.boolean.go\",\"storage.type.string.go\",\"storage.type.uintptr.go\",\"storage.type.error.go\",\"storage.type.rune.go\",\"storage.type.cs\",\"storage.type.generic.cs\",\"storage.type.modifier.cs\",\"storage.type.variable.cs\",\"storage.type.annotation.java\",\"storage.type.generic.java\",\"storage.type.java\",\"storage.type.object.array.java\",\"storage.type.primitive.array.java\",\"storage.type.primitive.java\",\"storage.type.token.java\",\"storage.type.groovy\",\"storage.type.annotation.groovy\",\"storage.type.parameters.groovy\",\"storage.type.generic.groovy\",\"storage.type.object.array.groovy\",\"storage.type.primitive.array.groovy\",\"storage.type.primitive.groovy\"],\"settings\":{\"foreground\":\"#4EC9B0\"}},{\"scope\":[\"meta.type.cast.expr\",\"meta.type.new.expr\",\"support.constant.math\",\"support.constant.dom\",\"support.constant.json\",\"entity.other.inherited-class\",\"punctuation.separator.namespace.ruby\"],\"settings\":{\"foreground\":\"#4EC9B0\"}},{\"scope\":[\"keyword.control\",\"source.cpp keyword.operator.new\",\"keyword.operator.delete\",\"keyword.other.using\",\"keyword.other.directive.using\",\"keyword.other.operator\",\"entity.name.operator\"],\"settings\":{\"foreground\":\"#C586C0\"}},{\"scope\":[\"variable\",\"meta.definition.variable.name\",\"support.variable\",\"entity.name.variable\",\"constant.other.placeholder\"],\"settings\":{\"foreground\":\"#9CDCFE\"}},{\"scope\":[\"variable.other.constant\",\"variable.other.enummember\"],\"settings\":{\"foreground\":\"#4FC1FF\"}},{\"scope\":[\"meta.object-literal.key\"],\"settings\":{\"foreground\":\"#9CDCFE\"}},{\"scope\":[\"support.constant.property-value\",\"support.constant.font-name\",\"support.constant.media-type\",\"support.constant.media\",\"constant.other.color.rgb-value\",\"constant.other.rgb-value\",\"support.constant.color\"],\"settings\":{\"foreground\":\"#CE9178\"}},{\"scope\":[\"punctuation.definition.group.regexp\",\"punctuation.definition.group.assertion.regexp\",\"punctuation.definition.character-class.regexp\",\"punctuation.character.set.begin.regexp\",\"punctuation.character.set.end.regexp\",\"keyword.operator.negation.regexp\",\"support.other.parenthesis.regexp\"],\"settings\":{\"foreground\":\"#CE9178\"}},{\"scope\":[\"constant.character.character-class.regexp\",\"constant.other.character-class.set.regexp\",\"constant.other.character-class.regexp\",\"constant.character.set.regexp\"],\"settings\":{\"foreground\":\"#d16969\"}},{\"scope\":[\"keyword.operator.or.regexp\",\"keyword.control.anchor.regexp\"],\"settings\":{\"foreground\":\"#DCDCAA\"}},{\"scope\":\"keyword.operator.quantifier.regexp\",\"settings\":{\"foreground\":\"#d7ba7d\"}},{\"scope\":[\"constant.character\",\"constant.other.option\"],\"settings\":{\"foreground\":\"#569cd6\"}},{\"scope\":\"constant.character.escape\",\"settings\":{\"foreground\":\"#d7ba7d\"}},{\"scope\":\"entity.name.label\",\"settings\":{\"foreground\":\"#C8C8C8\"}}],\"type\":\"dark\"}"));

const lang$3 = Object.freeze(JSON.parse("{\"displayName\":\"Shell\",\"name\":\"shellscript\",\"patterns\":[{\"include\":\"#initial_context\"}],\"repository\":{\"alias_statement\":{\"begin\":\"[\\\\t ]*+(alias)[\\\\t ]*+((?:((?<!\\\\w)-\\\\w+)\\\\b[\\\\t ]*+)*)[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.alias.shell\"},\"2\":{\"patterns\":[{\"match\":\"(?<!\\\\w)-\\\\w+\\\\b\",\"name\":\"string.unquoted.argument.shell constant.other.option.shell\"}]},\"3\":{\"name\":\"string.unquoted.argument.shell constant.other.option.shell\"},\"4\":{\"name\":\"variable.other.assignment.shell\"},\"5\":{\"name\":\"punctuation.definition.array.access.shell\"},\"6\":{\"name\":\"variable.other.assignment.shell\"},\"7\":{\"name\":\"constant.numeric.shell constant.numeric.integer.shell\"},\"8\":{\"name\":\"punctuation.definition.array.access.shell\"},\"9\":{\"name\":\"keyword.operator.assignment.shell\"},\"10\":{\"name\":\"keyword.operator.assignment.compound.shell\"},\"11\":{\"name\":\"keyword.operator.assignment.compound.shell\"}},\"end\":\"(?=[\\\\t ]|$)|(?:(?:(?:(;)|(&&))|(\\\\|\\\\|))|(&))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.terminator.statement.semicolon.shell\"},\"2\":{\"name\":\"punctuation.separator.statement.and.shell\"},\"3\":{\"name\":\"punctuation.separator.statement.or.shell\"},\"4\":{\"name\":\"punctuation.separator.statement.background.shell\"}},\"name\":\"meta.expression.assignment.alias.shell\",\"patterns\":[{\"include\":\"#normal_context\"}]},\"argument\":{\"begin\":\"[\\\\t ]++(?![\\\\n#\\\\&(\\\\[|]|$|;)\",\"beginCaptures\":{},\"end\":\"(?=[\\\\t \\\\&;|]|$|[\\\\n)`])\",\"endCaptures\":{},\"name\":\"meta.argument.shell\",\"patterns\":[{\"include\":\"#argument_context\"},{\"include\":\"#line_continuation\"}]},\"argument_context\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"string.unquoted.argument.shell\",\"patterns\":[{\"match\":\"\\\\*\",\"name\":\"variable.language.special.wildcard.shell\"},{\"include\":\"#variable\"},{\"include\":\"#numeric_literal\"},{\"captures\":{\"1\":{\"name\":\"constant.language.$1.shell\"}},\"match\":\"(?<!\\\\w)\\\\b(true|false)\\\\b(?!\\\\w)\"}]}},\"match\":\"[\\\\t ]*+([^\\\\t\\\\n \\\"$\\\\&-);<>\\\\\\\\`|]+(?!>))\"},{\"include\":\"#normal_context\"}]},\"arithmetic_double\":{\"patterns\":[{\"begin\":\"\\\\(\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.arithmetic.double.shell\"}},\"end\":\"\\\\)\\\\s*\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.arithmetic.double.shell\"}},\"name\":\"meta.arithmetic.shell\",\"patterns\":[{\"include\":\"#math\"},{\"include\":\"#string\"}]}]},\"arithmetic_no_dollar\":{\"patterns\":[{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.arithmetic.single.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.arithmetic.single.shell\"}},\"name\":\"meta.arithmetic.shell\",\"patterns\":[{\"include\":\"#math\"},{\"include\":\"#string\"}]}]},\"array_access_inline\":{\"captures\":{\"1\":{\"name\":\"punctuation.section.array.shell\"},\"2\":{\"patterns\":[{\"include\":\"#special_expansion\"},{\"include\":\"#string\"},{\"include\":\"#variable\"}]},\"3\":{\"name\":\"punctuation.section.array.shell\"}},\"match\":\"(\\\\[)([^]\\\\[]+)(])\"},\"array_value\":{\"begin\":\"[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))[\\\\t ]*+(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"variable.other.assignment.shell\"},\"2\":{\"name\":\"punctuation.definition.array.access.shell\"},\"3\":{\"name\":\"variable.other.assignment.shell\"},\"4\":{\"name\":\"constant.numeric.shell constant.numeric.integer.shell\"},\"5\":{\"name\":\"punctuation.definition.array.access.shell\"},\"6\":{\"name\":\"keyword.operator.assignment.shell\"},\"7\":{\"name\":\"keyword.operator.assignment.compound.shell\"},\"8\":{\"name\":\"keyword.operator.assignment.compound.shell\"},\"9\":{\"name\":\"punctuation.definition.array.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.array.shell\"}},\"patterns\":[{\"include\":\"#comment\"},{\"captures\":{\"1\":{\"name\":\"variable.other.assignment.array.shell entity.other.attribute-name.shell\"},\"2\":{\"name\":\"keyword.operator.assignment.shell punctuation.definition.assignment.shell\"}},\"match\":\"((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(=)\"},{\"captures\":{\"1\":{\"name\":\"punctuation.definition.bracket.named-array.shell\"},\"2\":{\"name\":\"string.unquoted.shell entity.other.attribute-name.bracket.shell\"},\"3\":{\"name\":\"punctuation.definition.bracket.named-array.shell\"},\"4\":{\"name\":\"punctuation.definition.assignment.shell\"}},\"match\":\"(\\\\[)(.+?)(])(=)\"},{\"include\":\"#normal_context\"},{\"include\":\"#simple_unquoted\"}]},\"assignment_statement\":{\"patterns\":[{\"include\":\"#array_value\"},{\"include\":\"#modified_assignment_statement\"},{\"include\":\"#normal_assignment_statement\"}]},\"basic_command_name\":{\"captures\":{\"1\":{\"name\":\"storage.modifier.$1.shell\"},\"2\":{\"name\":\"entity.name.function.call.shell entity.name.command.shell\",\"patterns\":[{\"match\":\"(?<!\\\\w)(?:continue|return|break)(?!\\\\w)\",\"name\":\"keyword.control.$0.shell\"},{\"match\":\"(?<!\\\\w)(?:unfunction|continue|autoload|unsetopt|bindkey|builtin|getopts|command|declare|unalias|history|unlimit|typeset|suspend|source|printf|unhash|disown|ulimit|return|which|alias|break|false|print|shift|times|umask|unset|read|type|exec|eval|wait|echo|dirs|jobs|kill|hash|stat|exit|test|trap|true|let|set|pwd|cd|fg|bg|fc|[.:])(?!/)(?!\\\\w)(?!-)\",\"name\":\"support.function.builtin.shell\"},{\"include\":\"#variable\"}]}},\"match\":\"(?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;])(?!nocorrect |nocorrect\\\\t|nocorrect$|readonly |readonly\\\\t|readonly$|function |function\\\\t|function$|foreach |foreach\\\\t|foreach$|coproc |coproc\\\\t|coproc$|logout |logout\\\\t|logout$|export |export\\\\t|export$|select |select\\\\t|select$|repeat |repeat\\\\t|repeat$|pushd |pushd\\\\t|pushd$|until |until\\\\t|until$|while |while\\\\t|while$|local |local\\\\t|local$|case |case\\\\t|case$|done |done\\\\t|done$|elif |elif\\\\t|elif$|else |else\\\\t|else$|esac |esac\\\\t|esac$|popd |popd\\\\t|popd$|then |then\\\\t|then$|time |time\\\\t|time$|for |for\\\\t|for$|end |end\\\\t|end$|fi |fi\\\\t|fi$|do |do\\\\t|do$|in |in\\\\t|in$|if |if\\\\t|if$)(?:((?<=^|[\\\\t \\\\&;])(?:readonly|declare|typeset|export|local)(?=[\\\\t \\\\&;]|$))|((?![\\\"']|\\\\\\\\\\\\n?$)[^\\\\t\\\\n\\\\r !\\\"'<>]+?))(?:(?=[\\\\t ])|(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\))\",\"name\":\"meta.statement.command.name.basic.shell\"},\"block_comment\":{\"begin\":\"\\\\s*+(/\\\\*)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.comment.begin.shell\"}},\"end\":\"\\\\*/\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.comment.end.shell\"}},\"name\":\"comment.block.shell\"},\"boolean\":{\"match\":\"\\\\b(?:true|false)\\\\b\",\"name\":\"constant.language.$0.shell\"},\"case_statement\":{\"begin\":\"\\\\b(case)\\\\b[\\\\t ]*+(.+?)[\\\\t ]*+\\\\b(in)\\\\b\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.case.shell\"},\"2\":{\"patterns\":[{\"include\":\"#initial_context\"}]},\"3\":{\"name\":\"keyword.control.in.shell\"}},\"end\":\"\\\\besac\\\\b\",\"endCaptures\":{\"0\":{\"name\":\"keyword.control.esac.shell\"}},\"name\":\"meta.case.shell\",\"patterns\":[{\"include\":\"#comment\"},{\"captures\":{\"1\":{\"name\":\"keyword.operator.pattern.case.default.shell\"}},\"match\":\"[\\\\t ]*+(\\\\* *\\\\))\"},{\"begin\":\"(?<!\\\\))(?![\\\\t ]*+(?:esac\\\\b|$))\",\"beginCaptures\":{},\"end\":\"(?=\\\\besac\\\\b)|(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.pattern.case.shell\"}},\"name\":\"meta.case.entry.pattern.shell\",\"patterns\":[{\"include\":\"#case_statement_context\"}]},{\"begin\":\"(?<=\\\\))\",\"beginCaptures\":{},\"end\":\"(;;)|(?=\\\\besac\\\\b)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.terminator.statement.case.shell\"}},\"name\":\"meta.case.entry.body.shell\",\"patterns\":[{\"include\":\"#typical_statements\"},{\"include\":\"#initial_context\"}]}]},\"case_statement_context\":{\"patterns\":[{\"match\":\"\\\\*\",\"name\":\"variable.language.special.quantifier.star.shell keyword.operator.quantifier.star.shell punctuation.definition.arbitrary-repetition.shell punctuation.definition.regex.arbitrary-repetition.shell\"},{\"match\":\"\\\\+\",\"name\":\"variable.language.special.quantifier.plus.shell keyword.operator.quantifier.plus.shell punctuation.definition.arbitrary-repetition.shell punctuation.definition.regex.arbitrary-repetition.shell\"},{\"match\":\"\\\\?\",\"name\":\"variable.language.special.quantifier.question.shell keyword.operator.quantifier.question.shell punctuation.definition.arbitrary-repetition.shell punctuation.definition.regex.arbitrary-repetition.shell\"},{\"match\":\"@\",\"name\":\"variable.language.special.at.shell keyword.operator.at.shell punctuation.definition.regex.at.shell\"},{\"match\":\"\\\\|\",\"name\":\"keyword.operator.orvariable.language.special.or.shell keyword.operator.alternation.ruby.shell punctuation.definition.regex.alternation.shell punctuation.separator.regex.alternation.shell\"},{\"match\":\"\\\\\\\\.\",\"name\":\"constant.character.escape.shell\"},{\"match\":\"(?<=\\\\tin| in|[\\\\t ]|;;)\\\\(\",\"name\":\"keyword.operator.pattern.case.shell\"},{\"begin\":\"(?<=\\\\S)(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.group.shell punctuation.definition.regex.group.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell punctuation.definition.regex.group.shell\"}},\"name\":\"meta.parenthese.shell\",\"patterns\":[{\"include\":\"#case_statement_context\"}]},{\"begin\":\"\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.character-class.shell\"}},\"end\":\"]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.character-class.shell\"}},\"name\":\"string.regexp.character-class.shell\",\"patterns\":[{\"match\":\"\\\\\\\\.\",\"name\":\"constant.character.escape.shell\"}]},{\"include\":\"#string\"},{\"match\":\"[^\\\\t\\\\n )*?@\\\\[|]\",\"name\":\"string.unquoted.pattern.shell string.regexp.unquoted.shell\"}]},\"command_name_range\":{\"begin\":\"\\\\G\",\"beginCaptures\":{},\"end\":\"(?=[\\\\t \\\\&;|]|$|[\\\\n)`])|(?=<)\",\"endCaptures\":{},\"name\":\"meta.statement.command.name.shell\",\"patterns\":[{\"match\":\"(?<!\\\\w)(?:continue|return|break)(?!\\\\w)\",\"name\":\"entity.name.function.call.shell entity.name.command.shell keyword.control.$0.shell\"},{\"match\":\"(?<!\\\\w)(?:unfunction|continue|autoload|unsetopt|bindkey|builtin|getopts|command|declare|unalias|history|unlimit|typeset|suspend|source|printf|unhash|disown|ulimit|return|which|alias|break|false|print|shift|times|umask|unset|read|type|exec|eval|wait|echo|dirs|jobs|kill|hash|stat|exit|test|trap|true|let|set|pwd|cd|fg|bg|fc|[.:])(?!/)(?!\\\\w)(?!-)\",\"name\":\"entity.name.function.call.shell entity.name.command.shell support.function.builtin.shell\"},{\"include\":\"#variable\"},{\"captures\":{\"1\":{\"name\":\"entity.name.function.call.shell entity.name.command.shell\"}},\"match\":\"(?<!\\\\w)(?<=\\\\G|[\\\"')}])([^\\\\t\\\\n\\\\r \\\"\\\\&');->`{|]+)\"},{\"begin\":\"(?:\\\\G|(?<![\\\\t\\\\n #\\\\&;{|]))(\\\\$?)((\\\")|('))\",\"beginCaptures\":{\"1\":{\"name\":\"meta.statement.command.name.quoted.shell punctuation.definition.string.shell entity.name.function.call.shell entity.name.command.shell\"},\"2\":{},\"3\":{\"name\":\"meta.statement.command.name.quoted.shell string.quoted.double.shell punctuation.definition.string.begin.shell entity.name.function.call.shell entity.name.command.shell\"},\"4\":{\"name\":\"meta.statement.command.name.quoted.shell string.quoted.single.shell punctuation.definition.string.begin.shell entity.name.function.call.shell entity.name.command.shell\"}},\"end\":\"(?<!\\\\G)(?<=\\\\2)\",\"endCaptures\":{},\"patterns\":[{\"include\":\"#continuation_of_single_quoted_command_name\"},{\"include\":\"#continuation_of_double_quoted_command_name\"}]},{\"include\":\"#line_continuation\"},{\"include\":\"#simple_unquoted\"}]},\"command_statement\":{\"begin\":\"[\\\\t ]*+(?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;])(?!nocorrect |nocorrect\\\\t|nocorrect$|readonly |readonly\\\\t|readonly$|function |function\\\\t|function$|foreach |foreach\\\\t|foreach$|coproc |coproc\\\\t|coproc$|logout |logout\\\\t|logout$|export |export\\\\t|export$|select |select\\\\t|select$|repeat |repeat\\\\t|repeat$|pushd |pushd\\\\t|pushd$|until |until\\\\t|until$|while |while\\\\t|while$|local |local\\\\t|local$|case |case\\\\t|case$|done |done\\\\t|done$|elif |elif\\\\t|elif$|else |else\\\\t|else$|esac |esac\\\\t|esac$|popd |popd\\\\t|popd$|then |then\\\\t|then$|time |time\\\\t|time$|for |for\\\\t|for$|end |end\\\\t|end$|fi |fi\\\\t|fi$|do |do\\\\t|do$|in |in\\\\t|in$|if |if\\\\t|if$)(?!\\\\\\\\\\\\n?$)\",\"beginCaptures\":{},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.statement.command.shell\",\"patterns\":[{\"include\":\"#command_name_range\"},{\"include\":\"#line_continuation\"},{\"include\":\"#option\"},{\"include\":\"#argument\"},{\"include\":\"#string\"},{\"include\":\"#heredoc\"}]},\"comment\":{\"captures\":{\"1\":{\"name\":\"comment.line.number-sign.shell meta.shebang.shell\"},\"2\":{\"name\":\"punctuation.definition.comment.shebang.shell\"},\"3\":{\"name\":\"comment.line.number-sign.shell\"},\"4\":{\"name\":\"punctuation.definition.comment.shell\"}},\"match\":\"(?:^|[\\\\t ]++)(?:((#!).*)|((#).*))\"},\"comments\":{\"patterns\":[{\"include\":\"#block_comment\"},{\"include\":\"#line_comment\"}]},\"compound-command\":{\"patterns\":[{\"begin\":\"\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.logical-expression.shell\"}},\"end\":\"]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.logical-expression.shell\"}},\"name\":\"meta.scope.logical-expression.shell\",\"patterns\":[{\"include\":\"#logical-expression\"},{\"include\":\"#initial_context\"}]},{\"begin\":\"(?<=\\\\s|^)\\\\{(?=\\\\s|$)\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell\"}},\"end\":\"(?<=^|;)\\\\s*(})\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.group.shell\"}},\"name\":\"meta.scope.group.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]}]},\"continuation_of_double_quoted_command_name\":{\"begin\":\"\\\\G(?<=\\\")\",\"beginCaptures\":{},\"contentName\":\"meta.statement.command.name.continuation string.quoted.double entity.name.function.call entity.name.command\",\"end\":\"\\\"\",\"endCaptures\":{\"0\":{\"name\":\"string.quoted.double.shell punctuation.definition.string.end.shell entity.name.function.call.shell entity.name.command.shell\"}},\"patterns\":[{\"match\":\"\\\\\\\\[\\\\n\\\"$\\\\\\\\`]\",\"name\":\"constant.character.escape.shell\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"}]},\"continuation_of_single_quoted_command_name\":{\"begin\":\"\\\\G(?<=')\",\"beginCaptures\":{},\"contentName\":\"meta.statement.command.name.continuation string.quoted.single entity.name.function.call entity.name.command\",\"end\":\"'\",\"endCaptures\":{\"0\":{\"name\":\"string.quoted.single.shell punctuation.definition.string.end.shell entity.name.function.call.shell entity.name.command.shell\"}}},\"custom_command_names\":{\"patterns\":[]},\"custom_commands\":{\"patterns\":[]},\"double_quote_context\":{\"patterns\":[{\"match\":\"\\\\\\\\[\\\\n\\\"$\\\\\\\\`]\",\"name\":\"constant.character.escape.shell\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"}]},\"double_quote_escape_char\":{\"match\":\"\\\\\\\\[\\\\n\\\"$\\\\\\\\`]\",\"name\":\"constant.character.escape.shell\"},\"floating_keyword\":{\"patterns\":[{\"match\":\"(?<=^|[\\\\t \\\\&;])(?:then|elif|else|done|end|do|if|fi)(?=[\\\\t \\\\&;]|$)\",\"name\":\"keyword.control.$0.shell\"}]},\"for_statement\":{\"patterns\":[{\"begin\":\"\\\\b(for)\\\\b[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))[\\\\t ]*+\\\\b(in)\\\\b\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.for.shell\"},\"2\":{\"name\":\"variable.other.for.shell\"},\"3\":{\"name\":\"keyword.control.in.shell\"}},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.for.in.shell\",\"patterns\":[{\"include\":\"#string\"},{\"include\":\"#simple_unquoted\"},{\"include\":\"#normal_context\"}]},{\"begin\":\"\\\\b(for)\\\\b\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.for.shell\"}},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.for.shell\",\"patterns\":[{\"include\":\"#arithmetic_double\"},{\"include\":\"#normal_context\"}]}]},\"function_definition\":{\"applyEndPatternLast\":1,\"begin\":\"[\\\\t ]*+(?:\\\\b(function)\\\\b[\\\\t ]*+([^\\\\t\\\\n\\\\r \\\"'()=]+)(?:(\\\\()[\\\\t ]*+(\\\\)))?|([^\\\\t\\\\n\\\\r \\\"'()=]+)[\\\\t ]*+(\\\\()[\\\\t ]*+(\\\\)))\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.function.shell\"},\"2\":{\"name\":\"entity.name.function.shell\"},\"3\":{\"name\":\"punctuation.definition.arguments.shell\"},\"4\":{\"name\":\"punctuation.definition.arguments.shell\"},\"5\":{\"name\":\"entity.name.function.shell\"},\"6\":{\"name\":\"punctuation.definition.arguments.shell\"},\"7\":{\"name\":\"punctuation.definition.arguments.shell\"}},\"end\":\"(?<=[)}])\",\"endCaptures\":{},\"name\":\"meta.function.shell\",\"patterns\":[{\"match\":\"\\\\G[\\\\t\\\\n ]\"},{\"begin\":\"\\\\{\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell punctuation.section.function.definition.shell\"}},\"end\":\"}\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell punctuation.section.function.definition.shell\"}},\"name\":\"meta.function.body.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]},{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell punctuation.section.function.definition.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell punctuation.section.function.definition.shell\"}},\"name\":\"meta.function.body.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]},{\"include\":\"#initial_context\"}]},\"heredoc\":{\"patterns\":[{\"begin\":\"((?<!<)<<-)[\\\\t ]*+([\\\"'])[\\\\t ]*+([^\\\"']+?)(?=[\\\"\\\\&';<\\\\s])(\\\\2)(.*)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.heredoc.shell\"},\"2\":{\"name\":\"punctuation.definition.string.heredoc.quote.shell\"},\"3\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"},\"4\":{\"name\":\"punctuation.definition.string.heredoc.quote.shell\"},\"5\":{\"patterns\":[{\"include\":\"#redirect_fix\"},{\"include\":\"#typical_statements\"}]}},\"contentName\":\"string.quoted.heredoc.indent.$3\",\"end\":\"^\\\\t*\\\\3(?=[\\\\&;\\\\s]|$)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.heredoc.$0.shell\"}},\"patterns\":[]},{\"begin\":\"((?<!<)<<(?!<))[\\\\t ]*+([\\\"'])[\\\\t ]*+([^\\\"']+?)(?=[\\\"\\\\&';<\\\\s])(\\\\2)(.*)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.heredoc.shell\"},\"2\":{\"name\":\"punctuation.definition.string.heredoc.quote.shell\"},\"3\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"},\"4\":{\"name\":\"punctuation.definition.string.heredoc.quote.shell\"},\"5\":{\"patterns\":[{\"include\":\"#redirect_fix\"},{\"include\":\"#typical_statements\"}]}},\"contentName\":\"string.quoted.heredoc.no-indent.$3\",\"end\":\"^\\\\3(?=[\\\\&;\\\\s]|$)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"}},\"patterns\":[]},{\"begin\":\"((?<!<)<<-)[\\\\t ]*+([^\\\\t \\\"']+)(?=[\\\"\\\\&';<\\\\s])(.*)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.heredoc.shell\"},\"2\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"},\"3\":{\"patterns\":[{\"include\":\"#redirect_fix\"},{\"include\":\"#typical_statements\"}]}},\"contentName\":\"string.unquoted.heredoc.indent.$2\",\"end\":\"^\\\\t*\\\\2(?=[\\\\&;\\\\s]|$)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"}},\"patterns\":[{\"include\":\"#double_quote_escape_char\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"}]},{\"begin\":\"((?<!<)<<(?!<))[\\\\t ]*+([^\\\\t \\\"']+)(?=[\\\"\\\\&';<\\\\s])(.*)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.heredoc.shell\"},\"2\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"},\"3\":{\"patterns\":[{\"include\":\"#redirect_fix\"},{\"include\":\"#typical_statements\"}]}},\"contentName\":\"string.unquoted.heredoc.no-indent.$2\",\"end\":\"^\\\\2(?=[\\\\&;\\\\s]|$)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.heredoc.delimiter.shell\"}},\"patterns\":[{\"include\":\"#double_quote_escape_char\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"}]}]},\"herestring\":{\"patterns\":[{\"begin\":\"(<<<)\\\\s*(('))\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.herestring.shell\"},\"2\":{\"name\":\"string.quoted.single.shell\"},\"3\":{\"name\":\"punctuation.definition.string.begin.shell\"}},\"contentName\":\"string.quoted.single.shell\",\"end\":\"(')\",\"endCaptures\":{\"0\":{\"name\":\"string.quoted.single.shell\"},\"1\":{\"name\":\"punctuation.definition.string.end.shell\"}},\"name\":\"meta.herestring.shell\"},{\"begin\":\"(<<<)\\\\s*((\\\"))\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.herestring.shell\"},\"2\":{\"name\":\"string.quoted.double.shell\"},\"3\":{\"name\":\"punctuation.definition.string.begin.shell\"}},\"contentName\":\"string.quoted.double.shell\",\"end\":\"(\\\")\",\"endCaptures\":{\"0\":{\"name\":\"string.quoted.double.shell\"},\"1\":{\"name\":\"punctuation.definition.string.end.shell\"}},\"name\":\"meta.herestring.shell\",\"patterns\":[{\"include\":\"#double_quote_context\"}]},{\"captures\":{\"1\":{\"name\":\"keyword.operator.herestring.shell\"},\"2\":{\"name\":\"string.unquoted.herestring.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]}},\"match\":\"(<<<)\\\\s*(([^)\\\\\\\\\\\\s]|\\\\\\\\.)+)\",\"name\":\"meta.herestring.shell\"}]},\"initial_context\":{\"patterns\":[{\"include\":\"#comment\"},{\"include\":\"#pipeline\"},{\"include\":\"#normal_statement_seperator\"},{\"include\":\"#logical_expression_double\"},{\"include\":\"#logical_expression_single\"},{\"include\":\"#assignment_statement\"},{\"include\":\"#case_statement\"},{\"include\":\"#for_statement\"},{\"include\":\"#loop\"},{\"include\":\"#function_definition\"},{\"include\":\"#line_continuation\"},{\"include\":\"#arithmetic_double\"},{\"include\":\"#misc_ranges\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"},{\"include\":\"#heredoc\"},{\"include\":\"#herestring\"},{\"include\":\"#redirection\"},{\"include\":\"#pathname\"},{\"include\":\"#floating_keyword\"},{\"include\":\"#alias_statement\"},{\"include\":\"#normal_statement\"},{\"include\":\"#string\"},{\"include\":\"#support\"}]},\"inline_comment\":{\"captures\":{\"1\":{\"name\":\"comment.block.shell punctuation.definition.comment.begin.shell\"},\"2\":{\"name\":\"comment.block.shell\"},\"3\":{\"patterns\":[{\"match\":\"\\\\*/\",\"name\":\"comment.block.shell punctuation.definition.comment.end.shell\"},{\"match\":\"\\\\*\",\"name\":\"comment.block.shell\"}]}},\"match\":\"(/\\\\*)((?:[^*]|\\\\*++[^/])*+(\\\\*++/))\"},\"interpolation\":{\"patterns\":[{\"include\":\"#arithmetic_dollar\"},{\"include\":\"#subshell_dollar\"},{\"begin\":\"`\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.evaluation.backticks.shell\"}},\"end\":\"`\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.evaluation.backticks.shell\"}},\"name\":\"string.interpolated.backtick.shell\",\"patterns\":[{\"match\":\"\\\\\\\\[$\\\\\\\\`]\",\"name\":\"constant.character.escape.shell\"},{\"begin\":\"(?<=\\\\W)(?=#)(?!#\\\\{)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.whitespace.comment.leading.shell\"}},\"end\":\"(?!\\\\G)\",\"patterns\":[{\"begin\":\"#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.comment.shell\"}},\"end\":\"(?=`)\",\"name\":\"comment.line.number-sign.shell\"}]},{\"include\":\"#initial_context\"}]}]},\"keyword\":{\"patterns\":[{\"match\":\"(?<=^|[\\\\&;\\\\s])(then|else|elif|fi|for|in|do|done|select|continue|esac|while|until|return)(?=[\\\\&;\\\\s]|$)\",\"name\":\"keyword.control.shell\"},{\"match\":\"(?<=^|[\\\\&;\\\\s])(?:export|declare|typeset|local|readonly)(?=[\\\\&;\\\\s]|$)\",\"name\":\"storage.modifier.shell\"}]},\"line_comment\":{\"begin\":\"\\\\s*+(//)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.comment.shell\"}},\"end\":\"(?<=\\\\n)(?<!\\\\\\\\\\\\n)\",\"endCaptures\":{},\"name\":\"comment.line.double-slash.shell\",\"patterns\":[{\"include\":\"#line_continuation_character\"}]},\"line_continuation\":{\"match\":\"\\\\\\\\(?=\\\\n)\",\"name\":\"constant.character.escape.line-continuation.shell\"},\"logical-expression\":{\"patterns\":[{\"include\":\"#arithmetic_no_dollar\"},{\"match\":\"=[=~]?|!=?|[<>]|&&|\\\\|\\\\|\",\"name\":\"keyword.operator.logical.shell\"},{\"match\":\"(?<!\\\\S)-(nt|ot|ef|eq|ne|l[et]|g[et]|[GLNOSa-hknopr-uwxz])\\\\b\",\"name\":\"keyword.operator.logical.shell\"}]},\"logical_expression_context\":{\"patterns\":[{\"include\":\"#regex_comparison\"},{\"include\":\"#arithmetic_no_dollar\"},{\"include\":\"#logical-expression\"},{\"include\":\"#logical_expression_single\"},{\"include\":\"#logical_expression_double\"},{\"include\":\"#comment\"},{\"include\":\"#boolean\"},{\"include\":\"#redirect_number\"},{\"include\":\"#numeric_literal\"},{\"include\":\"#pipeline\"},{\"include\":\"#normal_statement_seperator\"},{\"include\":\"#string\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"},{\"include\":\"#heredoc\"},{\"include\":\"#herestring\"},{\"include\":\"#pathname\"},{\"include\":\"#floating_keyword\"},{\"include\":\"#support\"}]},\"logical_expression_double\":{\"begin\":\"\\\\[\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.logical-expression.shell\"}},\"end\":\"]]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.logical-expression.shell\"}},\"name\":\"meta.scope.logical-expression.shell\",\"patterns\":[{\"include\":\"#logical_expression_context\"}]},\"logical_expression_single\":{\"begin\":\"\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.logical-expression.shell\"}},\"end\":\"]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.logical-expression.shell\"}},\"name\":\"meta.scope.logical-expression.shell\",\"patterns\":[{\"include\":\"#logical_expression_context\"}]},\"loop\":{\"patterns\":[{\"begin\":\"(?<=^|[\\\\&;\\\\s])(for)\\\\s+(.+?)\\\\s+(in)(?=[\\\\&;\\\\s]|$)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.shell\"},\"2\":{\"name\":\"variable.other.loop.shell\",\"patterns\":[{\"include\":\"#string\"}]},\"3\":{\"name\":\"keyword.control.shell\"}},\"end\":\"(?<=^|[\\\\&;\\\\s])done(?=[\\\\&;\\\\s]|$|\\\\))\",\"endCaptures\":{\"0\":{\"name\":\"keyword.control.shell\"}},\"name\":\"meta.scope.for-in-loop.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]},{\"begin\":\"(?<=^|[\\\\&;\\\\s])(while|until)(?=[\\\\&;\\\\s]|$)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.shell\"}},\"end\":\"(?<=^|[\\\\&;\\\\s])done(?=[\\\\&;\\\\s]|$|\\\\))\",\"endCaptures\":{\"0\":{\"name\":\"keyword.control.shell\"}},\"name\":\"meta.scope.while-loop.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]},{\"begin\":\"(?<=^|[\\\\&;\\\\s])(select)\\\\s+((?:[^\\\\\\\\\\\\s]|\\\\\\\\.)+)(?=[\\\\&;\\\\s]|$)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.shell\"},\"2\":{\"name\":\"variable.other.loop.shell\"}},\"end\":\"(?<=^|[\\\\&;\\\\s])(done)(?=[\\\\&;\\\\s]|$|\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.control.shell\"}},\"name\":\"meta.scope.select-block.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]},{\"begin\":\"(?<=^|[\\\\&;\\\\s])if(?=[\\\\&;\\\\s]|$)\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.control.if.shell\"}},\"end\":\"(?<=^|[\\\\&;\\\\s])fi(?=[\\\\&;\\\\s]|$)\",\"endCaptures\":{\"0\":{\"name\":\"keyword.control.fi.shell\"}},\"name\":\"meta.scope.if-block.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]}]},\"math\":{\"patterns\":[{\"include\":\"#variable\"},{\"match\":\"\\\\+{1,2}|-{1,2}|[!~]|\\\\*{1,2}|[%/]|<[<=]?|>[=>]?|==|!=|^|\\\\|{1,2}|&{1,2}|[,:=?]|[-%\\\\&*+/^|]=|<<=|>>=\",\"name\":\"keyword.operator.arithmetic.shell\"},{\"match\":\"0[Xx]\\\\h+\",\"name\":\"constant.numeric.hex.shell\"},{\"match\":\";\",\"name\":\"punctuation.separator.semicolon.range\"},{\"match\":\"0\\\\d+\",\"name\":\"constant.numeric.octal.shell\"},{\"match\":\"\\\\d{1,2}#[0-9@-Z_a-z]+\",\"name\":\"constant.numeric.other.shell\"},{\"match\":\"\\\\d+\",\"name\":\"constant.numeric.integer.shell\"},{\"match\":\"(?<!\\\\w)[0-9A-Z_a-z]+(?!\\\\w)\",\"name\":\"variable.other.normal.shell\"}]},\"math_operators\":{\"patterns\":[{\"match\":\"\\\\+{1,2}|-{1,2}|[!~]|\\\\*{1,2}|[%/]|<[<=]?|>[=>]?|==|!=|^|\\\\|{1,2}|&{1,2}|[,:=?]|[-%\\\\&*+/^|]=|<<=|>>=\",\"name\":\"keyword.operator.arithmetic.shell\"},{\"match\":\"0[Xx]\\\\h+\",\"name\":\"constant.numeric.hex.shell\"},{\"match\":\"0\\\\d+\",\"name\":\"constant.numeric.octal.shell\"},{\"match\":\"\\\\d{1,2}#[0-9@-Z_a-z]+\",\"name\":\"constant.numeric.other.shell\"},{\"match\":\"\\\\d+\",\"name\":\"constant.numeric.integer.shell\"}]},\"misc_ranges\":{\"patterns\":[{\"include\":\"#logical_expression_single\"},{\"include\":\"#logical_expression_double\"},{\"include\":\"#subshell_dollar\"},{\"begin\":\"(?<![^\\\\t ])(\\\\{)(?![$\\\\w])\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.group.shell\"}},\"end\":\"}\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.group.shell\"}},\"name\":\"meta.scope.group.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]}]},\"modified_assignment_statement\":{\"begin\":\"(?<=^|[\\\\t \\\\&;])(?:readonly|declare|typeset|export|local)(?=[\\\\t \\\\&;]|$)\",\"beginCaptures\":{\"0\":{\"name\":\"storage.modifier.$0.shell\"}},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.statement.shell meta.expression.assignment.modified.shell\",\"patterns\":[{\"match\":\"(?<!\\\\w)-\\\\w+\\\\b\",\"name\":\"string.unquoted.argument.shell constant.other.option.shell\"},{\"include\":\"#array_value\"},{\"captures\":{\"1\":{\"name\":\"variable.other.assignment.shell\"},\"2\":{\"name\":\"punctuation.definition.array.access.shell\"},\"3\":{\"name\":\"variable.other.assignment.shell\"},\"4\":{\"name\":\"constant.numeric.shell constant.numeric.integer.shell\"},\"5\":{\"name\":\"punctuation.definition.array.access.shell\"},\"6\":{\"name\":\"keyword.operator.assignment.shell\"},\"7\":{\"name\":\"keyword.operator.assignment.compound.shell\"},\"8\":{\"name\":\"keyword.operator.assignment.compound.shell\"},\"9\":{\"name\":\"constant.numeric.shell constant.numeric.hex.shell\"},\"10\":{\"name\":\"constant.numeric.shell constant.numeric.octal.shell\"},\"11\":{\"name\":\"constant.numeric.shell constant.numeric.other.shell\"},\"12\":{\"name\":\"constant.numeric.shell constant.numeric.decimal.shell\"},\"13\":{\"name\":\"constant.numeric.shell constant.numeric.version.shell\"},\"14\":{\"name\":\"constant.numeric.shell constant.numeric.integer.shell\"}},\"match\":\"((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))?(?:(?<=[\\\\t =]|^|[(\\\\[{])(?:(?:(?:(?:(?:(0[Xx]\\\\h+)|(0\\\\d+))|(\\\\d{1,2}#[0-9@-Z_a-z]+))|(-?\\\\d+\\\\.\\\\d+))|(-?\\\\d+(?:\\\\.\\\\d+)+))|(-?\\\\d+))(?=[\\\\t ]|$|[);}]))?\"},{\"include\":\"#normal_context\"}]},\"modifiers\":{\"match\":\"(?<=^|[\\\\t \\\\&;])(?:readonly|declare|typeset|export|local)(?=[\\\\t \\\\&;]|$)\",\"name\":\"storage.modifier.$0.shell\"},\"normal_assignment_statement\":{\"begin\":\"[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))\",\"beginCaptures\":{\"1\":{\"name\":\"variable.other.assignment.shell\"},\"2\":{\"name\":\"punctuation.definition.array.access.shell\"},\"3\":{\"name\":\"variable.other.assignment.shell\"},\"4\":{\"name\":\"constant.numeric.shell constant.numeric.integer.shell\"},\"5\":{\"name\":\"punctuation.definition.array.access.shell\"},\"6\":{\"name\":\"keyword.operator.assignment.shell\"},\"7\":{\"name\":\"keyword.operator.assignment.compound.shell\"},\"8\":{\"name\":\"keyword.operator.assignment.compound.shell\"}},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.expression.assignment.shell\",\"patterns\":[{\"include\":\"#comment\"},{\"include\":\"#string\"},{\"include\":\"#normal_assignment_statement\"},{\"begin\":\"(?<=[\\\\t ])(?![\\\\t ]|\\\\w+=)\",\"beginCaptures\":{},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.statement.command.env.shell\",\"patterns\":[{\"include\":\"#command_name_range\"},{\"include\":\"#line_continuation\"},{\"include\":\"#option\"},{\"include\":\"#argument\"},{\"include\":\"#string\"}]},{\"include\":\"#simple_unquoted\"},{\"include\":\"#normal_context\"}]},\"normal_context\":{\"patterns\":[{\"include\":\"#comment\"},{\"include\":\"#pipeline\"},{\"include\":\"#normal_statement_seperator\"},{\"include\":\"#misc_ranges\"},{\"include\":\"#boolean\"},{\"include\":\"#redirect_number\"},{\"include\":\"#numeric_literal\"},{\"include\":\"#string\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"},{\"include\":\"#heredoc\"},{\"include\":\"#herestring\"},{\"include\":\"#redirection\"},{\"include\":\"#pathname\"},{\"include\":\"#floating_keyword\"},{\"include\":\"#support\"},{\"include\":\"#parenthese\"}]},\"normal_statement\":{\"begin\":\"(?!^[\\\\t ]*+$)(?:(?<=(?:^until| until|\\\\tuntil|^while| while|\\\\twhile|^elif| elif|\\\\telif|^else| else|\\\\telse|^then| then|\\\\tthen|^do| do|\\\\tdo|^if| if|\\\\tif) )|(?<=^|[!\\\\&(;`{|]))[\\\\t ]*+(?!nocorrect\\\\W|nocorrect\\\\$|function\\\\W|function\\\\$|foreach\\\\W|foreach\\\\$|repeat\\\\W|repeat\\\\$|logout\\\\W|logout\\\\$|coproc\\\\W|coproc\\\\$|select\\\\W|select\\\\$|while\\\\W|while\\\\$|pushd\\\\W|pushd\\\\$|until\\\\W|until\\\\$|case\\\\W|case\\\\$|done\\\\W|done\\\\$|elif\\\\W|elif\\\\$|else\\\\W|else\\\\$|esac\\\\W|esac\\\\$|popd\\\\W|popd\\\\$|then\\\\W|then\\\\$|time\\\\W|time\\\\$|for\\\\W|for\\\\$|end\\\\W|end\\\\$|fi\\\\W|fi\\\\$|do\\\\W|do\\\\$|in\\\\W|in\\\\$|if\\\\W|if\\\\$)\",\"beginCaptures\":{},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.statement.shell\",\"patterns\":[{\"include\":\"#typical_statements\"}]},\"normal_statement_seperator\":{\"captures\":{\"1\":{\"name\":\"punctuation.terminator.statement.semicolon.shell\"},\"2\":{\"name\":\"punctuation.separator.statement.and.shell\"},\"3\":{\"name\":\"punctuation.separator.statement.or.shell\"},\"4\":{\"name\":\"punctuation.separator.statement.background.shell\"}},\"match\":\"(?:(?:(;)|(&&))|(\\\\|\\\\|))|(&)\"},\"numeric_literal\":{\"captures\":{\"1\":{\"name\":\"constant.numeric.shell constant.numeric.hex.shell\"},\"2\":{\"name\":\"constant.numeric.shell constant.numeric.octal.shell\"},\"3\":{\"name\":\"constant.numeric.shell constant.numeric.other.shell\"},\"4\":{\"name\":\"constant.numeric.shell constant.numeric.decimal.shell\"},\"5\":{\"name\":\"constant.numeric.shell constant.numeric.version.shell\"},\"6\":{\"name\":\"constant.numeric.shell constant.numeric.integer.shell\"}},\"match\":\"(?<=[\\\\t =]|^|[(\\\\[{])(?:(?:(?:(?:(?:(0[Xx]\\\\h+)|(0\\\\d+))|(\\\\d{1,2}#[0-9@-Z_a-z]+))|(-?\\\\d+\\\\.\\\\d+))|(-?\\\\d+(?:\\\\.\\\\d+)+))|(-?\\\\d+))(?=[\\\\t ]|$|[);}])\"},\"option\":{\"begin\":\"[\\\\t ]++(-)((?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;]))\",\"beginCaptures\":{\"1\":{\"name\":\"string.unquoted.argument.shell constant.other.option.dash.shell\"},\"2\":{\"name\":\"string.unquoted.argument.shell constant.other.option.shell\"}},\"contentName\":\"string.unquoted.argument constant.other.option\",\"end\":\"(?=[\\\\t ])|(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"patterns\":[{\"include\":\"#option_context\"}]},\"option_context\":{\"patterns\":[{\"include\":\"#misc_ranges\"},{\"include\":\"#string\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"},{\"include\":\"#heredoc\"},{\"include\":\"#herestring\"},{\"include\":\"#redirection\"},{\"include\":\"#pathname\"},{\"include\":\"#floating_keyword\"},{\"include\":\"#support\"}]},\"parenthese\":{\"patterns\":[{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.parenthese.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.parenthese.shell\"}},\"name\":\"meta.parenthese.group.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]}]},\"pathname\":{\"patterns\":[{\"match\":\"(?<=[:=\\\\s]|^)~\",\"name\":\"keyword.operator.tilde.shell\"},{\"match\":\"[*?]\",\"name\":\"keyword.operator.glob.shell\"},{\"begin\":\"([!*+?@])(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.extglob.shell\"},\"2\":{\"name\":\"punctuation.definition.extglob.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.extglob.shell\"}},\"name\":\"meta.structure.extglob.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]}]},\"pipeline\":{\"patterns\":[{\"match\":\"(?<=^|[\\\\&;\\\\s])(time)(?=[\\\\&;\\\\s]|$)\",\"name\":\"keyword.other.shell\"},{\"match\":\"[!|]\",\"name\":\"keyword.operator.pipe.shell\"}]},\"redirect_fix\":{\"captures\":{\"1\":{\"name\":\"keyword.operator.redirect.shell\"},\"2\":{\"name\":\"string.unquoted.argument.shell\"}},\"match\":\"(>>?)[\\\\t ]*+([^\\\\t\\\\n \\\"$\\\\&-);<>\\\\\\\\`|]+)\"},\"redirect_number\":{\"captures\":{\"1\":{\"name\":\"keyword.operator.redirect.stdout.shell\"},\"2\":{\"name\":\"keyword.operator.redirect.stderr.shell\"},\"3\":{\"name\":\"keyword.operator.redirect.$3.shell\"}},\"match\":\"(?<=[\\\\t ])(?:(1)|(2)|(\\\\d+))(?=>)\"},\"redirection\":{\"patterns\":[{\"begin\":\"[<>]\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.shell\"}},\"name\":\"string.interpolated.process-substitution.shell\",\"patterns\":[{\"include\":\"#initial_context\"}]},{\"match\":\"(?<![<>])(&>|\\\\d*>&\\\\d*|\\\\d*(>>|[<>])|\\\\d*<&|\\\\d*<>)(?![<>])\",\"name\":\"keyword.operator.redirect.shell\"}]},\"regex_comparison\":{\"match\":\"=~\",\"name\":\"keyword.operator.logical.regex.shell\"},\"regexp\":{\"patterns\":[{\"match\":\".+\"}]},\"simple_options\":{\"captures\":{\"0\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"string.unquoted.argument.shell constant.other.option.dash.shell\"},\"2\":{\"name\":\"string.unquoted.argument.shell constant.other.option.shell\"}},\"match\":\"[\\\\t ]++(-)(\\\\w+)\"}]}},\"match\":\"(?:[\\\\t ]++-\\\\w+)*\"},\"simple_unquoted\":{\"match\":\"[^\\\\t\\\\n \\\"$\\\\&-);<>\\\\\\\\`|]\",\"name\":\"string.unquoted.shell\"},\"special_expansion\":{\"match\":\"!|:[-=?]?|[*@]|##?|%%|[%/]\",\"name\":\"keyword.operator.expansion.shell\"},\"start_of_command\":{\"match\":\"[\\\\t ]*+(?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;])(?!nocorrect |nocorrect\\\\t|nocorrect$|readonly |readonly\\\\t|readonly$|function |function\\\\t|function$|foreach |foreach\\\\t|foreach$|coproc |coproc\\\\t|coproc$|logout |logout\\\\t|logout$|export |export\\\\t|export$|select |select\\\\t|select$|repeat |repeat\\\\t|repeat$|pushd |pushd\\\\t|pushd$|until |until\\\\t|until$|while |while\\\\t|while$|local |local\\\\t|local$|case |case\\\\t|case$|done |done\\\\t|done$|elif |elif\\\\t|elif$|else |else\\\\t|else$|esac |esac\\\\t|esac$|popd |popd\\\\t|popd$|then |then\\\\t|then$|time |time\\\\t|time$|for |for\\\\t|for$|end |end\\\\t|end$|fi |fi\\\\t|fi$|do |do\\\\t|do$|in |in\\\\t|in$|if |if\\\\t|if$)(?!\\\\\\\\\\\\n?$)\"},\"string\":{\"patterns\":[{\"match\":\"\\\\\\\\.\",\"name\":\"constant.character.escape.shell\"},{\"begin\":\"'\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.shell\"}},\"end\":\"'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.shell\"}},\"name\":\"string.quoted.single.shell\"},{\"begin\":\"\\\\$?\\\"\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.shell\"}},\"end\":\"\\\"\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.shell\"}},\"name\":\"string.quoted.double.shell\",\"patterns\":[{\"match\":\"\\\\\\\\[\\\\n\\\"$\\\\\\\\`]\",\"name\":\"constant.character.escape.shell\"},{\"include\":\"#variable\"},{\"include\":\"#interpolation\"}]},{\"begin\":\"\\\\$'\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.shell\"}},\"end\":\"'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.shell\"}},\"name\":\"string.quoted.single.dollar.shell\",\"patterns\":[{\"match\":\"\\\\\\\\['\\\\\\\\abefnrtv]\",\"name\":\"constant.character.escape.ansi-c.shell\"},{\"match\":\"\\\\\\\\[0-9]{3}\\\"\",\"name\":\"constant.character.escape.octal.shell\"},{\"match\":\"\\\\\\\\x\\\\h{2}\\\"\",\"name\":\"constant.character.escape.hex.shell\"},{\"match\":\"\\\\\\\\c.\\\"\",\"name\":\"constant.character.escape.control-char.shell\"}]}]},\"subshell_dollar\":{\"patterns\":[{\"begin\":\"\\\\$\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.subshell.single.shell\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.subshell.single.shell\"}},\"name\":\"meta.scope.subshell\",\"patterns\":[{\"include\":\"#parenthese\"},{\"include\":\"#initial_context\"}]}]},\"support\":{\"patterns\":[{\"match\":\"(?<=^|[\\\\&;\\\\s])[.:](?=[\\\\&;\\\\s]|$)\",\"name\":\"support.function.builtin.shell\"}]},\"typical_statements\":{\"patterns\":[{\"include\":\"#assignment_statement\"},{\"include\":\"#case_statement\"},{\"include\":\"#for_statement\"},{\"include\":\"#while_statement\"},{\"include\":\"#function_definition\"},{\"include\":\"#command_statement\"},{\"include\":\"#line_continuation\"},{\"include\":\"#arithmetic_double\"},{\"include\":\"#normal_context\"}]},\"variable\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"punctuation.definition.variable.shell variable.parameter.positional.all.shell\"},\"2\":{\"name\":\"variable.parameter.positional.all.shell\"}},\"match\":\"(\\\\$)(@(?!\\\\w))\"},{\"captures\":{\"1\":{\"name\":\"punctuation.definition.variable.shell variable.parameter.positional.shell\"},\"2\":{\"name\":\"variable.parameter.positional.shell\"}},\"match\":\"(\\\\$)([0-9](?!\\\\w))\"},{\"captures\":{\"1\":{\"name\":\"punctuation.definition.variable.shell variable.language.special.shell\"},\"2\":{\"name\":\"variable.language.special.shell\"}},\"match\":\"(\\\\$)([-!#$*0?_](?!\\\\w))\"},{\"begin\":\"(\\\\$)(\\\\{)[\\\\t ]*+(?=\\\\d)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.variable.shell variable.parameter.positional.shell\"},\"2\":{\"name\":\"punctuation.section.bracket.curly.variable.begin.shell punctuation.definition.variable.shell variable.parameter.positional.shell\"}},\"contentName\":\"meta.parameter-expansion\",\"end\":\"}\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.bracket.curly.variable.end.shell punctuation.definition.variable.shell variable.parameter.positional.shell\"}},\"patterns\":[{\"include\":\"#special_expansion\"},{\"include\":\"#array_access_inline\"},{\"match\":\"[0-9]+\",\"name\":\"variable.parameter.positional.shell\"},{\"match\":\"(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)\",\"name\":\"variable.other.normal.shell\"},{\"include\":\"#variable\"},{\"include\":\"#string\"}]},{\"begin\":\"(\\\\$)(\\\\{)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.variable.shell\"},\"2\":{\"name\":\"punctuation.section.bracket.curly.variable.begin.shell punctuation.definition.variable.shell\"}},\"contentName\":\"meta.parameter-expansion\",\"end\":\"}\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.bracket.curly.variable.end.shell punctuation.definition.variable.shell\"}},\"patterns\":[{\"include\":\"#special_expansion\"},{\"include\":\"#array_access_inline\"},{\"match\":\"(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)\",\"name\":\"variable.other.normal.shell\"},{\"include\":\"#variable\"},{\"include\":\"#string\"}]},{\"captures\":{\"1\":{\"name\":\"punctuation.definition.variable.shell variable.other.normal.shell\"},\"2\":{\"name\":\"variable.other.normal.shell\"}},\"match\":\"(\\\\$)(\\\\w+(?!\\\\w))\"}]},\"while_statement\":{\"patterns\":[{\"begin\":\"\\\\b(while)\\\\b\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.while.shell\"}},\"end\":\"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)\",\"endCaptures\":{},\"name\":\"meta.while.shell\",\"patterns\":[{\"include\":\"#line_continuation\"},{\"include\":\"#math_operators\"},{\"include\":\"#option\"},{\"include\":\"#simple_unquoted\"},{\"include\":\"#normal_context\"},{\"include\":\"#string\"}]}]}},\"scopeName\":\"source.shell\",\"aliases\":[\"bash\",\"sh\",\"shell\",\"zsh\"]}"));

var shellscript = [
lang$3
];

const lang$2 = Object.freeze(JSON.parse("{\"displayName\":\"Shell Session\",\"fileTypes\":[\"sh-session\"],\"name\":\"shellsession\",\"patterns\":[{\"captures\":{\"1\":{\"name\":\"entity.other.prompt-prefix.shell-session\"},\"2\":{\"name\":\"punctuation.separator.prompt.shell-session\"},\"3\":{\"name\":\"source.shell\",\"patterns\":[{\"include\":\"source.shell\"}]}},\"match\":\"^(?:((?:\\\\(\\\\S+\\\\)\\\\s*)?(?:sh\\\\S*?|\\\\w+\\\\S+[:@]\\\\S+(?:\\\\s+\\\\S+)?|\\\\[\\\\S+?[:@]\\\\N+?].*?))\\\\s*)?([#$%>❯➜\\\\p{Greek}])\\\\s+(.*)$\"},{\"match\":\"^.+$\",\"name\":\"meta.output.shell-session\"}],\"scopeName\":\"text.shell-session\",\"embeddedLangs\":[\"shellscript\"],\"aliases\":[\"console\"]}"));

var console$1 = [
...shellscript,
lang$2
];

const lang$1 = Object.freeze(JSON.parse("{\"displayName\":\"Python\",\"name\":\"python\",\"patterns\":[{\"include\":\"#statement\"},{\"include\":\"#expression\"}],\"repository\":{\"annotated-parameter\":{\"begin\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\s*(:)\",\"beginCaptures\":{\"1\":{\"name\":\"variable.parameter.function.language.python\"},\"2\":{\"name\":\"punctuation.separator.annotation.python\"}},\"end\":\"(,)|(?=\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.separator.parameters.python\"}},\"patterns\":[{\"include\":\"#expression\"},{\"match\":\"=(?!=)\",\"name\":\"keyword.operator.assignment.python\"}]},\"assignment-operator\":{\"match\":\"<<=|>>=|//=|\\\\*\\\\*=|\\\\+=|-=|/=|@=|\\\\*=|%=|~=|\\\\^=|&=|\\\\|=|=(?!=)\",\"name\":\"keyword.operator.assignment.python\"},\"backticks\":{\"begin\":\"`\",\"end\":\"`|(?<!\\\\\\\\)(\\\\n)\",\"name\":\"invalid.deprecated.backtick.python\",\"patterns\":[{\"include\":\"#expression\"}]},\"builtin-callables\":{\"patterns\":[{\"include\":\"#illegal-names\"},{\"include\":\"#illegal-object-name\"},{\"include\":\"#builtin-exceptions\"},{\"include\":\"#builtin-functions\"},{\"include\":\"#builtin-types\"}]},\"builtin-exceptions\":{\"match\":\"(?<!\\\\.)\\\\b((Arithmetic|Assertion|Attribute|Buffer|BlockingIO|BrokenPipe|ChildProcess|(Connection(Aborted|Refused|Reset)?)|EOF|Environment|FileExists|FileNotFound|FloatingPoint|IO|Import|Indentation|Index|Interrupted|IsADirectory|NotADirectory|Permission|ProcessLookup|Timeout|Key|Lookup|Memory|Name|NotImplemented|OS|Overflow|Reference|Runtime|Recursion|Syntax|System|Tab|Type|UnboundLocal|Unicode(Encode|Decode|Translate)?|Value|Windows|ZeroDivision|ModuleNotFound)Error|((Pending)?Deprecation|Runtime|Syntax|User|Future|Import|Unicode|Bytes|Resource)?Warning|SystemExit|Stop(Async)?Iteration|KeyboardInterrupt|GeneratorExit|(Base)?Exception)\\\\b\",\"name\":\"support.type.exception.python\"},\"builtin-functions\":{\"patterns\":[{\"match\":\"(?<!\\\\.)\\\\b(__import__|abs|aiter|all|any|anext|ascii|bin|breakpoint|callable|chr|compile|copyright|credits|delattr|dir|divmod|enumerate|eval|exec|exit|filter|format|getattr|globals|hasattr|hash|help|hex|id|input|isinstance|issubclass|iter|len|license|locals|map|max|memoryview|min|next|oct|open|ord|pow|print|quit|range|reload|repr|reversed|round|setattr|sorted|sum|vars|zip)\\\\b\",\"name\":\"support.function.builtin.python\"},{\"match\":\"(?<!\\\\.)\\\\b(file|reduce|intern|raw_input|unicode|cmp|basestring|execfile|long|xrange)\\\\b\",\"name\":\"variable.legacy.builtin.python\"}]},\"builtin-possible-callables\":{\"patterns\":[{\"include\":\"#builtin-callables\"},{\"include\":\"#magic-names\"}]},\"builtin-types\":{\"match\":\"(?<!\\\\.)\\\\b(bool|bytearray|bytes|classmethod|complex|dict|float|frozenset|int|list|object|property|set|slice|staticmethod|str|tuple|type|super)\\\\b\",\"name\":\"support.type.python\"},\"call-wrapper-inheritance\":{\"begin\":\"\\\\b(?=([_[:alpha:]]\\\\w*)\\\\s*(\\\\())\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.python\"}},\"name\":\"meta.function-call.python\",\"patterns\":[{\"include\":\"#inheritance-name\"},{\"include\":\"#function-arguments\"}]},\"class-declaration\":{\"patterns\":[{\"begin\":\"\\\\s*(class)\\\\s+(?=[_[:alpha:]]\\\\w*\\\\s*([(:]))\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.class.python\"}},\"end\":\"(:)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.section.class.begin.python\"}},\"name\":\"meta.class.python\",\"patterns\":[{\"include\":\"#class-name\"},{\"include\":\"#class-inheritance\"}]}]},\"class-inheritance\":{\"begin\":\"(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.inheritance.begin.python\"}},\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.inheritance.end.python\"}},\"name\":\"meta.class.inheritance.python\",\"patterns\":[{\"match\":\"(\\\\*\\\\*?)\",\"name\":\"keyword.operator.unpacking.arguments.python\"},{\"match\":\",\",\"name\":\"punctuation.separator.inheritance.python\"},{\"match\":\"=(?!=)\",\"name\":\"keyword.operator.assignment.python\"},{\"match\":\"\\\\bmetaclass\\\\b\",\"name\":\"support.type.metaclass.python\"},{\"include\":\"#illegal-names\"},{\"include\":\"#class-kwarg\"},{\"include\":\"#call-wrapper-inheritance\"},{\"include\":\"#expression-base\"},{\"include\":\"#member-access-class\"},{\"include\":\"#inheritance-identifier\"}]},\"class-kwarg\":{\"captures\":{\"1\":{\"name\":\"entity.other.inherited-class.python variable.parameter.class.python\"},\"2\":{\"name\":\"keyword.operator.assignment.python\"}},\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\s*(=)(?!=)\"},\"class-name\":{\"patterns\":[{\"include\":\"#illegal-object-name\"},{\"include\":\"#builtin-possible-callables\"},{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\",\"name\":\"entity.name.type.class.python\"}]},\"codetags\":{\"captures\":{\"1\":{\"name\":\"keyword.codetag.notation.python\"}},\"match\":\"\\\\b(NOTE|XXX|HACK|FIXME|BUG|TODO)\\\\b\"},\"comments\":{\"patterns\":[{\"begin\":\"#\\\\s*(type:)\\\\s*+(?!$|#)\",\"beginCaptures\":{\"0\":{\"name\":\"meta.typehint.comment.python\"},\"1\":{\"name\":\"comment.typehint.directive.notation.python\"}},\"contentName\":\"meta.typehint.comment.python\",\"end\":\"$|(?=#)\",\"name\":\"comment.line.number-sign.python\",\"patterns\":[{\"match\":\"\\\\Gignore(?=\\\\s*(?:$|#))\",\"name\":\"comment.typehint.ignore.notation.python\"},{\"match\":\"(?<!\\\\.)\\\\b(bool|bytes|float|int|object|str|List|Dict|Iterable|Sequence|Set|FrozenSet|Callable|Union|Tuple|Any|None)\\\\b\",\"name\":\"comment.typehint.type.notation.python\"},{\"match\":\"([]()*,.=\\\\[]|(->))\",\"name\":\"comment.typehint.punctuation.notation.python\"},{\"match\":\"([_[:alpha:]]\\\\w*)\",\"name\":\"comment.typehint.variable.notation.python\"}]},{\"include\":\"#comments-base\"}]},\"comments-base\":{\"begin\":\"(#)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.comment.python\"}},\"end\":\"$()\",\"name\":\"comment.line.number-sign.python\",\"patterns\":[{\"include\":\"#codetags\"}]},\"comments-string-double-three\":{\"begin\":\"(#)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.comment.python\"}},\"end\":\"($|(?=\\\"\\\"\\\"))\",\"name\":\"comment.line.number-sign.python\",\"patterns\":[{\"include\":\"#codetags\"}]},\"comments-string-single-three\":{\"begin\":\"(#)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.comment.python\"}},\"end\":\"($|(?='''))\",\"name\":\"comment.line.number-sign.python\",\"patterns\":[{\"include\":\"#codetags\"}]},\"curly-braces\":{\"begin\":\"\\\\{\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.dict.begin.python\"}},\"end\":\"}\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.dict.end.python\"}},\"patterns\":[{\"match\":\":\",\"name\":\"punctuation.separator.dict.python\"},{\"include\":\"#expression\"}]},\"decorator\":{\"begin\":\"^\\\\s*((@))\\\\s*(?=[_[:alpha:]]\\\\w*)\",\"beginCaptures\":{\"1\":{\"name\":\"entity.name.function.decorator.python\"},\"2\":{\"name\":\"punctuation.definition.decorator.python\"}},\"end\":\"(\\\\))(.*?)(?=\\\\s*(?:#|$))|(?=[\\\\n#])\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.python\"},\"2\":{\"name\":\"invalid.illegal.decorator.python\"}},\"name\":\"meta.function.decorator.python\",\"patterns\":[{\"include\":\"#decorator-name\"},{\"include\":\"#function-arguments\"}]},\"decorator-name\":{\"patterns\":[{\"include\":\"#builtin-callables\"},{\"include\":\"#illegal-object-name\"},{\"captures\":{\"2\":{\"name\":\"punctuation.separator.period.python\"}},\"match\":\"([_[:alpha:]]\\\\w*)|(\\\\.)\",\"name\":\"entity.name.function.decorator.python\"},{\"include\":\"#line-continuation\"},{\"captures\":{\"1\":{\"name\":\"invalid.illegal.decorator.python\"}},\"match\":\"\\\\s*([^#(.\\\\\\\\_[:alpha:]\\\\s].*?)(?=#|$)\",\"name\":\"invalid.illegal.decorator.python\"}]},\"docstring\":{\"patterns\":[{\"begin\":\"('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\1)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"}},\"name\":\"string.quoted.docstring.multi.python\",\"patterns\":[{\"include\":\"#docstring-prompt\"},{\"include\":\"#codetags\"},{\"include\":\"#docstring-guts-unicode\"}]},{\"begin\":\"([Rr])('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\2)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"}},\"name\":\"string.quoted.docstring.raw.multi.python\",\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#docstring-prompt\"},{\"include\":\"#codetags\"}]},{\"begin\":\"([\\\"'])\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\1)|(\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.docstring.single.python\",\"patterns\":[{\"include\":\"#codetags\"},{\"include\":\"#docstring-guts-unicode\"}]},{\"begin\":\"([Rr])([\\\"'])\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\2)|(\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.docstring.raw.single.python\",\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#codetags\"}]}]},\"docstring-guts-unicode\":{\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#escape-sequence\"},{\"include\":\"#string-line-continuation\"}]},\"docstring-prompt\":{\"captures\":{\"1\":{\"name\":\"keyword.control.flow.python\"}},\"match\":\"(?:^|\\\\G)\\\\s*((?:>>>|\\\\.\\\\.\\\\.)\\\\s)(?=\\\\s*\\\\S)\"},\"docstring-statement\":{\"begin\":\"^(?=\\\\s*[Rr]?('''|\\\"\\\"\\\"|[\\\"']))\",\"end\":\"((?<=\\\\1)|^)(?!\\\\s*[Rr]?('''|\\\"\\\"\\\"|[\\\"']))\",\"patterns\":[{\"include\":\"#docstring\"}]},\"double-one-regexp-character-set\":{\"patterns\":[{\"match\":\"\\\\[\\\\^?](?!.*?])\"},{\"begin\":\"(\\\\[)(\\\\^)?(])?\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.character.set.begin.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"keyword.operator.negation.regexp\"},\"3\":{\"name\":\"constant.character.set.regexp\"}},\"end\":\"(]|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.character.set.end.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.character.set.regexp\",\"patterns\":[{\"include\":\"#regexp-charecter-set-escapes\"},{\"match\":\"\\\\N\",\"name\":\"constant.character.set.regexp\"}]}]},\"double-one-regexp-comments\":{\"begin\":\"\\\\(\\\\?#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.comment.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.comment.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"comment.regexp\",\"patterns\":[{\"include\":\"#codetags\"}]},\"double-one-regexp-conditional\":{\"begin\":\"(\\\\()\\\\?\\\\((\\\\w+(?:\\\\s+\\\\p{alnum}+)?|\\\\d+)\\\\)\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.conditional.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.conditional.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.conditional.negative.regexp punctuation.parenthesis.conditional.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-expression\":{\"patterns\":[{\"include\":\"#regexp-base-expression\"},{\"include\":\"#double-one-regexp-character-set\"},{\"include\":\"#double-one-regexp-comments\"},{\"include\":\"#regexp-flags\"},{\"include\":\"#double-one-regexp-named-group\"},{\"include\":\"#regexp-backreference\"},{\"include\":\"#double-one-regexp-lookahead\"},{\"include\":\"#double-one-regexp-lookahead-negative\"},{\"include\":\"#double-one-regexp-lookbehind\"},{\"include\":\"#double-one-regexp-lookbehind-negative\"},{\"include\":\"#double-one-regexp-conditional\"},{\"include\":\"#double-one-regexp-parentheses-non-capturing\"},{\"include\":\"#double-one-regexp-parentheses\"}]},\"double-one-regexp-lookahead\":{\"begin\":\"(\\\\()\\\\?=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-lookahead-negative\":{\"begin\":\"(\\\\()\\\\?!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.negative.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-lookbehind\":{\"begin\":\"(\\\\()\\\\?<=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-lookbehind-negative\":{\"begin\":\"(\\\\()\\\\?<!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.negative.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-named-group\":{\"begin\":\"(\\\\()(\\\\?P<\\\\w+(?:\\\\s+\\\\p{alnum}+)?>)\",\"beginCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.begin.regexp\"},\"2\":{\"name\":\"entity.name.tag.named.group.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.named.regexp\",\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-parentheses\":{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-one-regexp-parentheses-non-capturing\":{\"begin\":\"\\\\(\\\\?:\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"double-three-regexp-character-set\":{\"patterns\":[{\"match\":\"\\\\[\\\\^?](?!.*?])\"},{\"begin\":\"(\\\\[)(\\\\^)?(])?\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.character.set.begin.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"keyword.operator.negation.regexp\"},\"3\":{\"name\":\"constant.character.set.regexp\"}},\"end\":\"(]|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.character.set.end.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.character.set.regexp\",\"patterns\":[{\"include\":\"#regexp-charecter-set-escapes\"},{\"match\":\"\\\\N\",\"name\":\"constant.character.set.regexp\"}]}]},\"double-three-regexp-comments\":{\"begin\":\"\\\\(\\\\?#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.comment.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.comment.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"comment.regexp\",\"patterns\":[{\"include\":\"#codetags\"}]},\"double-three-regexp-conditional\":{\"begin\":\"(\\\\()\\\\?\\\\((\\\\w+(?:\\\\s+\\\\p{alnum}+)?|\\\\d+)\\\\)\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.conditional.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.conditional.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.conditional.negative.regexp punctuation.parenthesis.conditional.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-expression\":{\"patterns\":[{\"include\":\"#regexp-base-expression\"},{\"include\":\"#double-three-regexp-character-set\"},{\"include\":\"#double-three-regexp-comments\"},{\"include\":\"#regexp-flags\"},{\"include\":\"#double-three-regexp-named-group\"},{\"include\":\"#regexp-backreference\"},{\"include\":\"#double-three-regexp-lookahead\"},{\"include\":\"#double-three-regexp-lookahead-negative\"},{\"include\":\"#double-three-regexp-lookbehind\"},{\"include\":\"#double-three-regexp-lookbehind-negative\"},{\"include\":\"#double-three-regexp-conditional\"},{\"include\":\"#double-three-regexp-parentheses-non-capturing\"},{\"include\":\"#double-three-regexp-parentheses\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-lookahead\":{\"begin\":\"(\\\\()\\\\?=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-lookahead-negative\":{\"begin\":\"(\\\\()\\\\?!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.negative.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-lookbehind\":{\"begin\":\"(\\\\()\\\\?<=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-lookbehind-negative\":{\"begin\":\"(\\\\()\\\\?<!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.negative.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-named-group\":{\"begin\":\"(\\\\()(\\\\?P<\\\\w+(?:\\\\s+\\\\p{alnum}+)?>)\",\"beginCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.begin.regexp\"},\"2\":{\"name\":\"entity.name.tag.named.group.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.named.regexp\",\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-parentheses\":{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"double-three-regexp-parentheses-non-capturing\":{\"begin\":\"\\\\(\\\\?:\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.begin.regexp\"}},\"end\":\"(\\\\)|(?=\\\"\\\"\\\"))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#double-three-regexp-expression\"},{\"include\":\"#comments-string-double-three\"}]},\"ellipsis\":{\"match\":\"\\\\.\\\\.\\\\.\",\"name\":\"constant.other.ellipsis.python\"},\"escape-sequence\":{\"match\":\"\\\\\\\\(x\\\\h{2}|[0-7]{1,3}|[\\\"'\\\\\\\\abfnrtv])\",\"name\":\"constant.character.escape.python\"},\"escape-sequence-unicode\":{\"patterns\":[{\"match\":\"\\\\\\\\(u\\\\h{4}|U\\\\h{8}|N\\\\{[\\\\w\\\\s]+?})\",\"name\":\"constant.character.escape.python\"}]},\"expression\":{\"patterns\":[{\"include\":\"#expression-base\"},{\"include\":\"#member-access\"},{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\"}]},\"expression-bare\":{\"patterns\":[{\"include\":\"#backticks\"},{\"include\":\"#illegal-anno\"},{\"include\":\"#literal\"},{\"include\":\"#regexp\"},{\"include\":\"#string\"},{\"include\":\"#lambda\"},{\"include\":\"#generator\"},{\"include\":\"#illegal-operator\"},{\"include\":\"#operator\"},{\"include\":\"#curly-braces\"},{\"include\":\"#item-access\"},{\"include\":\"#list\"},{\"include\":\"#odd-function-call\"},{\"include\":\"#round-braces\"},{\"include\":\"#function-call\"},{\"include\":\"#builtin-functions\"},{\"include\":\"#builtin-types\"},{\"include\":\"#builtin-exceptions\"},{\"include\":\"#magic-names\"},{\"include\":\"#special-names\"},{\"include\":\"#illegal-names\"},{\"include\":\"#special-variables\"},{\"include\":\"#ellipsis\"},{\"include\":\"#punctuation\"},{\"include\":\"#line-continuation\"}]},\"expression-base\":{\"patterns\":[{\"include\":\"#comments\"},{\"include\":\"#expression-bare\"},{\"include\":\"#line-continuation\"}]},\"f-expression\":{\"patterns\":[{\"include\":\"#expression-bare\"},{\"include\":\"#member-access\"},{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\"}]},\"fregexp-base-expression\":{\"patterns\":[{\"include\":\"#fregexp-quantifier\"},{\"include\":\"#fstring-formatting-braces\"},{\"match\":\"\\\\{.*?}\"},{\"include\":\"#regexp-base-common\"}]},\"fregexp-quantifier\":{\"match\":\"\\\\{\\\\{(\\\\d+|\\\\d+,(\\\\d+)?|,\\\\d+)}}\",\"name\":\"keyword.operator.quantifier.regexp\"},\"fstring-fnorm-quoted-multi-line\":{\"begin\":\"\\\\b([Ff])([BUbu])?('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"string.interpolated.python string.quoted.multi.python storage.type.string.python\"},\"2\":{\"name\":\"invalid.illegal.prefix.python\"},\"3\":{\"name\":\"punctuation.definition.string.begin.python string.interpolated.python string.quoted.multi.python\"}},\"end\":\"(\\\\3)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python string.interpolated.python string.quoted.multi.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.fstring.python\",\"patterns\":[{\"include\":\"#fstring-guts\"},{\"include\":\"#fstring-illegal-multi-brace\"},{\"include\":\"#fstring-multi-brace\"},{\"include\":\"#fstring-multi-core\"}]},\"fstring-fnorm-quoted-single-line\":{\"begin\":\"\\\\b([Ff])([BUbu])?(([\\\"']))\",\"beginCaptures\":{\"1\":{\"name\":\"string.interpolated.python string.quoted.single.python storage.type.string.python\"},\"2\":{\"name\":\"invalid.illegal.prefix.python\"},\"3\":{\"name\":\"punctuation.definition.string.begin.python string.interpolated.python string.quoted.single.python\"}},\"end\":\"(\\\\3)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python string.interpolated.python string.quoted.single.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.fstring.python\",\"patterns\":[{\"include\":\"#fstring-guts\"},{\"include\":\"#fstring-illegal-single-brace\"},{\"include\":\"#fstring-single-brace\"},{\"include\":\"#fstring-single-core\"}]},\"fstring-formatting\":{\"patterns\":[{\"include\":\"#fstring-formatting-braces\"},{\"include\":\"#fstring-formatting-singe-brace\"}]},\"fstring-formatting-braces\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"},\"2\":{\"name\":\"invalid.illegal.brace.python\"},\"3\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"match\":\"(\\\\{)(\\\\s*?)(})\"},{\"match\":\"(\\\\{\\\\{|}})\",\"name\":\"constant.character.escape.python\"}]},\"fstring-formatting-singe-brace\":{\"match\":\"(}(?!}))\",\"name\":\"invalid.illegal.brace.python\"},\"fstring-guts\":{\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#escape-sequence\"},{\"include\":\"#string-line-continuation\"},{\"include\":\"#fstring-formatting\"}]},\"fstring-illegal-multi-brace\":{\"patterns\":[{\"include\":\"#impossible\"}]},\"fstring-illegal-single-brace\":{\"begin\":\"(\\\\{)(?=[^\\\\n}]*$\\\\n?)\",\"beginCaptures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"end\":\"(})|(?=\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"patterns\":[{\"include\":\"#fstring-terminator-single\"},{\"include\":\"#f-expression\"}]},\"fstring-multi-brace\":{\"begin\":\"(\\\\{)\",\"beginCaptures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"end\":\"(})\",\"endCaptures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"patterns\":[{\"include\":\"#fstring-terminator-multi\"},{\"include\":\"#f-expression\"}]},\"fstring-multi-core\":{\"match\":\"(.+?)($(\\\\n?)|(?=[\\\\\\\\{}]|'''|\\\"\\\"\\\"))|\\\\n\",\"name\":\"string.interpolated.python string.quoted.multi.python\"},\"fstring-normf-quoted-multi-line\":{\"begin\":\"\\\\b([BUbu])([Ff])('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"invalid.illegal.prefix.python\"},\"2\":{\"name\":\"string.interpolated.python string.quoted.multi.python storage.type.string.python\"},\"3\":{\"name\":\"punctuation.definition.string.begin.python string.quoted.multi.python\"}},\"end\":\"(\\\\3)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python string.interpolated.python string.quoted.multi.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.fstring.python\",\"patterns\":[{\"include\":\"#fstring-guts\"},{\"include\":\"#fstring-illegal-multi-brace\"},{\"include\":\"#fstring-multi-brace\"},{\"include\":\"#fstring-multi-core\"}]},\"fstring-normf-quoted-single-line\":{\"begin\":\"\\\\b([BUbu])([Ff])(([\\\"']))\",\"beginCaptures\":{\"1\":{\"name\":\"invalid.illegal.prefix.python\"},\"2\":{\"name\":\"string.interpolated.python string.quoted.single.python storage.type.string.python\"},\"3\":{\"name\":\"punctuation.definition.string.begin.python string.quoted.single.python\"}},\"end\":\"(\\\\3)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python string.interpolated.python string.quoted.single.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.fstring.python\",\"patterns\":[{\"include\":\"#fstring-guts\"},{\"include\":\"#fstring-illegal-single-brace\"},{\"include\":\"#fstring-single-brace\"},{\"include\":\"#fstring-single-core\"}]},\"fstring-raw-guts\":{\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#fstring-formatting\"}]},\"fstring-raw-multi-core\":{\"match\":\"(.+?)($(\\\\n?)|(?=[\\\\\\\\{}]|'''|\\\"\\\"\\\"))|\\\\n\",\"name\":\"string.interpolated.python string.quoted.raw.multi.python\"},\"fstring-raw-quoted-multi-line\":{\"begin\":\"\\\\b([Rr][Ff]|[Ff][Rr])('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"string.interpolated.python string.quoted.raw.multi.python storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python string.quoted.raw.multi.python\"}},\"end\":\"(\\\\2)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python string.interpolated.python string.quoted.raw.multi.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.fstring.python\",\"patterns\":[{\"include\":\"#fstring-raw-guts\"},{\"include\":\"#fstring-illegal-multi-brace\"},{\"include\":\"#fstring-multi-brace\"},{\"include\":\"#fstring-raw-multi-core\"}]},\"fstring-raw-quoted-single-line\":{\"begin\":\"\\\\b([Rr][Ff]|[Ff][Rr])(([\\\"']))\",\"beginCaptures\":{\"1\":{\"name\":\"string.interpolated.python string.quoted.raw.single.python storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python string.quoted.raw.single.python\"}},\"end\":\"(\\\\2)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python string.interpolated.python string.quoted.raw.single.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.fstring.python\",\"patterns\":[{\"include\":\"#fstring-raw-guts\"},{\"include\":\"#fstring-illegal-single-brace\"},{\"include\":\"#fstring-single-brace\"},{\"include\":\"#fstring-raw-single-core\"}]},\"fstring-raw-single-core\":{\"match\":\"(.+?)($(\\\\n?)|(?=[\\\\\\\\{}]|([\\\"'])|((?<!\\\\\\\\)\\\\n)))|\\\\n\",\"name\":\"string.interpolated.python string.quoted.raw.single.python\"},\"fstring-single-brace\":{\"begin\":\"(\\\\{)\",\"beginCaptures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"end\":\"(})|(?=\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"patterns\":[{\"include\":\"#fstring-terminator-single\"},{\"include\":\"#f-expression\"}]},\"fstring-single-core\":{\"match\":\"(.+?)($(\\\\n?)|(?=[\\\\\\\\{}]|([\\\"'])|((?<!\\\\\\\\)\\\\n)))|\\\\n\",\"name\":\"string.interpolated.python string.quoted.single.python\"},\"fstring-terminator-multi\":{\"patterns\":[{\"match\":\"(=(![ars])?)(?=})\",\"name\":\"storage.type.format.python\"},{\"match\":\"(=?![ars])(?=})\",\"name\":\"storage.type.format.python\"},{\"captures\":{\"1\":{\"name\":\"storage.type.format.python\"},\"2\":{\"name\":\"storage.type.format.python\"}},\"match\":\"(=?(?:![ars])?)(:\\\\w?[<=>^]?[- +]?#?\\\\d*,?(\\\\.\\\\d+)?[%EFGXb-gnosx]?)(?=})\"},{\"include\":\"#fstring-terminator-multi-tail\"}]},\"fstring-terminator-multi-tail\":{\"begin\":\"(=?(?:![ars])?)(:)(?=.*?\\\\{)\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.format.python\"},\"2\":{\"name\":\"storage.type.format.python\"}},\"end\":\"(?=})\",\"patterns\":[{\"include\":\"#fstring-illegal-multi-brace\"},{\"include\":\"#fstring-multi-brace\"},{\"match\":\"([%EFGXb-gnosx])(?=})\",\"name\":\"storage.type.format.python\"},{\"match\":\"(\\\\.\\\\d+)\",\"name\":\"storage.type.format.python\"},{\"match\":\"(,)\",\"name\":\"storage.type.format.python\"},{\"match\":\"(\\\\d+)\",\"name\":\"storage.type.format.python\"},{\"match\":\"(#)\",\"name\":\"storage.type.format.python\"},{\"match\":\"([- +])\",\"name\":\"storage.type.format.python\"},{\"match\":\"([<=>^])\",\"name\":\"storage.type.format.python\"},{\"match\":\"(\\\\w)\",\"name\":\"storage.type.format.python\"}]},\"fstring-terminator-single\":{\"patterns\":[{\"match\":\"(=(![ars])?)(?=})\",\"name\":\"storage.type.format.python\"},{\"match\":\"(=?![ars])(?=})\",\"name\":\"storage.type.format.python\"},{\"captures\":{\"1\":{\"name\":\"storage.type.format.python\"},\"2\":{\"name\":\"storage.type.format.python\"}},\"match\":\"(=?(?:![ars])?)(:\\\\w?[<=>^]?[- +]?#?\\\\d*,?(\\\\.\\\\d+)?[%EFGXb-gnosx]?)(?=})\"},{\"include\":\"#fstring-terminator-single-tail\"}]},\"fstring-terminator-single-tail\":{\"begin\":\"(=?(?:![ars])?)(:)(?=.*?\\\\{)\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.format.python\"},\"2\":{\"name\":\"storage.type.format.python\"}},\"end\":\"(?=})|(?=\\\\n)\",\"patterns\":[{\"include\":\"#fstring-illegal-single-brace\"},{\"include\":\"#fstring-single-brace\"},{\"match\":\"([%EFGXb-gnosx])(?=})\",\"name\":\"storage.type.format.python\"},{\"match\":\"(\\\\.\\\\d+)\",\"name\":\"storage.type.format.python\"},{\"match\":\"(,)\",\"name\":\"storage.type.format.python\"},{\"match\":\"(\\\\d+)\",\"name\":\"storage.type.format.python\"},{\"match\":\"(#)\",\"name\":\"storage.type.format.python\"},{\"match\":\"([- +])\",\"name\":\"storage.type.format.python\"},{\"match\":\"([<=>^])\",\"name\":\"storage.type.format.python\"},{\"match\":\"(\\\\w)\",\"name\":\"storage.type.format.python\"}]},\"function-arguments\":{\"begin\":\"(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.begin.python\"}},\"contentName\":\"meta.function-call.arguments.python\",\"end\":\"(?=\\\\))(?!\\\\)\\\\s*\\\\()\",\"patterns\":[{\"match\":\"(,)\",\"name\":\"punctuation.separator.arguments.python\"},{\"captures\":{\"1\":{\"name\":\"keyword.operator.unpacking.arguments.python\"}},\"match\":\"(?:(?<=[(,])|^)\\\\s*(\\\\*{1,2})\"},{\"include\":\"#lambda-incomplete\"},{\"include\":\"#illegal-names\"},{\"captures\":{\"1\":{\"name\":\"variable.parameter.function-call.python\"},\"2\":{\"name\":\"keyword.operator.assignment.python\"}},\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\s*(=)(?!=)\"},{\"match\":\"=(?!=)\",\"name\":\"keyword.operator.assignment.python\"},{\"include\":\"#expression\"},{\"captures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.python\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.python\"}},\"match\":\"\\\\s*(\\\\))\\\\s*(\\\\()\"}]},\"function-call\":{\"begin\":\"\\\\b(?=([_[:alpha:]]\\\\w*)\\\\s*(\\\\())\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.python\"}},\"name\":\"meta.function-call.python\",\"patterns\":[{\"include\":\"#special-variables\"},{\"include\":\"#function-name\"},{\"include\":\"#function-arguments\"}]},\"function-declaration\":{\"begin\":\"\\\\s*(?:\\\\b(async)\\\\s+)?\\\\b(def)\\\\s+(?=[_[:alpha:]]\\\\p{word}*\\\\s*\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.function.async.python\"},\"2\":{\"name\":\"storage.type.function.python\"}},\"end\":\"(:|(?=[\\\\n\\\"#']))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.section.function.begin.python\"}},\"name\":\"meta.function.python\",\"patterns\":[{\"include\":\"#function-def-name\"},{\"include\":\"#parameters\"},{\"include\":\"#line-continuation\"},{\"include\":\"#return-annotation\"}]},\"function-def-name\":{\"patterns\":[{\"include\":\"#illegal-object-name\"},{\"include\":\"#builtin-possible-callables\"},{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\",\"name\":\"entity.name.function.python\"}]},\"function-name\":{\"patterns\":[{\"include\":\"#builtin-possible-callables\"},{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\",\"name\":\"meta.function-call.generic.python\"}]},\"generator\":{\"begin\":\"\\\\bfor\\\\b\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.control.flow.python\"}},\"end\":\"\\\\bin\\\\b\",\"endCaptures\":{\"0\":{\"name\":\"keyword.control.flow.python\"}},\"patterns\":[{\"include\":\"#expression\"}]},\"illegal-anno\":{\"match\":\"->\",\"name\":\"invalid.illegal.annotation.python\"},\"illegal-names\":{\"captures\":{\"1\":{\"name\":\"keyword.control.flow.python\"},\"2\":{\"name\":\"keyword.control.import.python\"}},\"match\":\"\\\\b(?:(and|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|in|is|(?<=\\\\.)lambda|lambda(?=\\\\s*[.=])|nonlocal|not|or|pass|raise|return|try|while|with|yield)|(as|import))\\\\b\"},\"illegal-object-name\":{\"match\":\"\\\\b(True|False|None)\\\\b\",\"name\":\"keyword.illegal.name.python\"},\"illegal-operator\":{\"patterns\":[{\"match\":\"&&|\\\\|\\\\||--|\\\\+\\\\+\",\"name\":\"invalid.illegal.operator.python\"},{\"match\":\"[$?]\",\"name\":\"invalid.illegal.operator.python\"},{\"match\":\"!\\\\b\",\"name\":\"invalid.illegal.operator.python\"}]},\"import\":{\"patterns\":[{\"begin\":\"\\\\b(?<!\\\\.)(from)\\\\b(?=.+import)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.import.python\"}},\"end\":\"$|(?=import)\",\"patterns\":[{\"match\":\"\\\\.+\",\"name\":\"punctuation.separator.period.python\"},{\"include\":\"#expression\"}]},{\"begin\":\"\\\\b(?<!\\\\.)(import)\\\\b\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.import.python\"}},\"end\":\"$\",\"patterns\":[{\"match\":\"\\\\b(?<!\\\\.)as\\\\b\",\"name\":\"keyword.control.import.python\"},{\"include\":\"#expression\"}]}]},\"impossible\":{\"match\":\"$.^\"},\"inheritance-identifier\":{\"captures\":{\"1\":{\"name\":\"entity.other.inherited-class.python\"}},\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\"},\"inheritance-name\":{\"patterns\":[{\"include\":\"#lambda-incomplete\"},{\"include\":\"#builtin-possible-callables\"},{\"include\":\"#inheritance-identifier\"}]},\"item-access\":{\"patterns\":[{\"begin\":\"\\\\b(?=[_[:alpha:]]\\\\w*\\\\s*\\\\[)\",\"end\":\"(])\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.python\"}},\"name\":\"meta.item-access.python\",\"patterns\":[{\"include\":\"#item-name\"},{\"include\":\"#item-index\"},{\"include\":\"#expression\"}]}]},\"item-index\":{\"begin\":\"(\\\\[)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.begin.python\"}},\"contentName\":\"meta.item-access.arguments.python\",\"end\":\"(?=])\",\"patterns\":[{\"match\":\":\",\"name\":\"punctuation.separator.slice.python\"},{\"include\":\"#expression\"}]},\"item-name\":{\"patterns\":[{\"include\":\"#special-variables\"},{\"include\":\"#builtin-functions\"},{\"include\":\"#special-names\"},{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\",\"name\":\"meta.indexed-name.python\"}]},\"lambda\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"keyword.control.flow.python\"}},\"match\":\"((?<=\\\\.)lambda|lambda(?=\\\\s*[.=]))\"},{\"captures\":{\"1\":{\"name\":\"storage.type.function.lambda.python\"}},\"match\":\"\\\\b(lambda)\\\\s*?(?=[\\\\n,]|$)\"},{\"begin\":\"\\\\b(lambda)\\\\b\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.function.lambda.python\"}},\"contentName\":\"meta.function.lambda.parameters.python\",\"end\":\"(:)|(\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.section.function.lambda.begin.python\"}},\"name\":\"meta.lambda-function.python\",\"patterns\":[{\"match\":\"/\",\"name\":\"keyword.operator.positional.parameter.python\"},{\"match\":\"(\\\\*\\\\*?)\",\"name\":\"keyword.operator.unpacking.parameter.python\"},{\"include\":\"#lambda-nested-incomplete\"},{\"include\":\"#illegal-names\"},{\"captures\":{\"1\":{\"name\":\"variable.parameter.function.language.python\"},\"2\":{\"name\":\"punctuation.separator.parameters.python\"}},\"match\":\"([_[:alpha:]]\\\\w*)\\\\s*(?:(,)|(?=:|$))\"},{\"include\":\"#comments\"},{\"include\":\"#backticks\"},{\"include\":\"#illegal-anno\"},{\"include\":\"#lambda-parameter-with-default\"},{\"include\":\"#line-continuation\"},{\"include\":\"#illegal-operator\"}]}]},\"lambda-incomplete\":{\"match\":\"\\\\blambda(?=\\\\s*[),])\",\"name\":\"storage.type.function.lambda.python\"},\"lambda-nested-incomplete\":{\"match\":\"\\\\blambda(?=\\\\s*[),:])\",\"name\":\"storage.type.function.lambda.python\"},\"lambda-parameter-with-default\":{\"begin\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\s*(=)\",\"beginCaptures\":{\"1\":{\"name\":\"variable.parameter.function.language.python\"},\"2\":{\"name\":\"keyword.operator.python\"}},\"end\":\"(,)|(?=:|$)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.separator.parameters.python\"}},\"patterns\":[{\"include\":\"#expression\"}]},\"line-continuation\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"punctuation.separator.continuation.line.python\"},\"2\":{\"name\":\"invalid.illegal.line.continuation.python\"}},\"match\":\"(\\\\\\\\)\\\\s*(\\\\S.*$\\\\n?)\"},{\"begin\":\"(\\\\\\\\)\\\\s*$\\\\n?\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.separator.continuation.line.python\"}},\"end\":\"(?=^\\\\s*$)|(?!(\\\\s*[Rr]?('''|\\\"\\\"\\\"|[\\\"']))|\\\\G()$)\",\"patterns\":[{\"include\":\"#regexp\"},{\"include\":\"#string\"}]}]},\"list\":{\"begin\":\"\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.list.begin.python\"}},\"end\":\"]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.list.end.python\"}},\"patterns\":[{\"include\":\"#expression\"}]},\"literal\":{\"patterns\":[{\"match\":\"\\\\b(True|False|None|NotImplemented|Ellipsis)\\\\b\",\"name\":\"constant.language.python\"},{\"include\":\"#number\"}]},\"loose-default\":{\"begin\":\"(=)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.operator.python\"}},\"end\":\"(,)|(?=\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.separator.parameters.python\"}},\"patterns\":[{\"include\":\"#expression\"}]},\"magic-function-names\":{\"captures\":{\"1\":{\"name\":\"support.function.magic.python\"}},\"match\":\"\\\\b(__(?:abs|add|aenter|aexit|aiter|and|anext|await|bool|call|ceil|class_getitem|cmp|coerce|complex|contains|copy|deepcopy|del|delattr|delete|delitem|delslice|dir|div|divmod|enter|eq|exit|float|floor|floordiv|format|get??|getattr|getattribute|getinitargs|getitem|getnewargs|getslice|getstate|gt|hash|hex|iadd|iand|idiv|ifloordiv||ilshift|imod|imul|index|init|instancecheck|int|invert|ior|ipow|irshift|isub|iter|itruediv|ixor|len??|long|lshift|lt|missing|mod|mul|neg??|new|next|nonzero|oct|or|pos|pow|radd|rand|rdiv|rdivmod|reduce|reduce_ex|repr|reversed|rfloordiv||rlshift|rmod|rmul|ror|round|rpow|rrshift|rshift|rsub|rtruediv|rxor|set|setattr|setitem|set_name|setslice|setstate|sizeof|str|sub|subclasscheck|truediv|trunc|unicode|xor|matmul|rmatmul|imatmul|init_subclass|set_name|fspath|bytes|prepare|length_hint)__)\\\\b\"},\"magic-names\":{\"patterns\":[{\"include\":\"#magic-function-names\"},{\"include\":\"#magic-variable-names\"}]},\"magic-variable-names\":{\"captures\":{\"1\":{\"name\":\"support.variable.magic.python\"}},\"match\":\"\\\\b(__(?:all|annotations|bases|builtins|class|closure|code|debug|defaults|dict|doc|file|func|globals|kwdefaults|match_args|members|metaclass|methods|module|mro|mro_entries|name|qualname|post_init|self|signature|slots|subclasses|version|weakref|wrapped|classcell|spec|path|package|future|traceback)__)\\\\b\"},\"member-access\":{\"begin\":\"(\\\\.)\\\\s*(?!\\\\.)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.separator.period.python\"}},\"end\":\"(?<=\\\\S)(?=\\\\W)|(^|(?<=\\\\s))(?=[^\\\\\\\\\\\\w\\\\s])|$\",\"name\":\"meta.member.access.python\",\"patterns\":[{\"include\":\"#function-call\"},{\"include\":\"#member-access-base\"},{\"include\":\"#member-access-attribute\"}]},\"member-access-attribute\":{\"match\":\"\\\\b([_[:alpha:]]\\\\w*)\\\\b\",\"name\":\"meta.attribute.python\"},\"member-access-base\":{\"patterns\":[{\"include\":\"#magic-names\"},{\"include\":\"#illegal-names\"},{\"include\":\"#illegal-object-name\"},{\"include\":\"#special-names\"},{\"include\":\"#line-continuation\"},{\"include\":\"#item-access\"}]},\"member-access-class\":{\"begin\":\"(\\\\.)\\\\s*(?!\\\\.)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.separator.period.python\"}},\"end\":\"(?<=\\\\S)(?=\\\\W)|$\",\"name\":\"meta.member.access.python\",\"patterns\":[{\"include\":\"#call-wrapper-inheritance\"},{\"include\":\"#member-access-base\"},{\"include\":\"#inheritance-identifier\"}]},\"number\":{\"name\":\"constant.numeric.python\",\"patterns\":[{\"include\":\"#number-float\"},{\"include\":\"#number-dec\"},{\"include\":\"#number-hex\"},{\"include\":\"#number-oct\"},{\"include\":\"#number-bin\"},{\"include\":\"#number-long\"},{\"match\":\"\\\\b[0-9]+\\\\w+\",\"name\":\"invalid.illegal.name.python\"}]},\"number-bin\":{\"captures\":{\"1\":{\"name\":\"storage.type.number.python\"}},\"match\":\"(?<![.\\\\w])(0[Bb])(_?[01])+\\\\b\",\"name\":\"constant.numeric.bin.python\"},\"number-dec\":{\"captures\":{\"1\":{\"name\":\"storage.type.imaginary.number.python\"},\"2\":{\"name\":\"invalid.illegal.dec.python\"}},\"match\":\"(?<![.\\\\w])(?:[1-9](?:_?[0-9])*|0+|[0-9](?:_?[0-9])*([Jj])|0([0-9]+)(?![.Ee]))\\\\b\",\"name\":\"constant.numeric.dec.python\"},\"number-float\":{\"captures\":{\"1\":{\"name\":\"storage.type.imaginary.number.python\"}},\"match\":\"(?<!\\\\w)(?:(?:\\\\.[0-9](?:_?[0-9])*|[0-9](?:_?[0-9])*\\\\.[0-9](?:_?[0-9])*|[0-9](?:_?[0-9])*\\\\.)(?:[Ee][-+]?[0-9](?:_?[0-9])*)?|[0-9](?:_?[0-9])*[Ee][-+]?[0-9](?:_?[0-9])*)([Jj])?\\\\b\",\"name\":\"constant.numeric.float.python\"},\"number-hex\":{\"captures\":{\"1\":{\"name\":\"storage.type.number.python\"}},\"match\":\"(?<![.\\\\w])(0[Xx])(_?\\\\h)+\\\\b\",\"name\":\"constant.numeric.hex.python\"},\"number-long\":{\"captures\":{\"2\":{\"name\":\"storage.type.number.python\"}},\"match\":\"(?<![.\\\\w])([1-9][0-9]*|0)([Ll])\\\\b\",\"name\":\"constant.numeric.bin.python\"},\"number-oct\":{\"captures\":{\"1\":{\"name\":\"storage.type.number.python\"}},\"match\":\"(?<![.\\\\w])(0[Oo])(_?[0-7])+\\\\b\",\"name\":\"constant.numeric.oct.python\"},\"odd-function-call\":{\"begin\":\"(?<=[])])\\\\s*(?=\\\\()\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.python\"}},\"patterns\":[{\"include\":\"#function-arguments\"}]},\"operator\":{\"captures\":{\"1\":{\"name\":\"keyword.operator.logical.python\"},\"2\":{\"name\":\"keyword.control.flow.python\"},\"3\":{\"name\":\"keyword.operator.bitwise.python\"},\"4\":{\"name\":\"keyword.operator.arithmetic.python\"},\"5\":{\"name\":\"keyword.operator.comparison.python\"},\"6\":{\"name\":\"keyword.operator.assignment.python\"}},\"match\":\"\\\\b(?<!\\\\.)(?:(and|or|not|in|is)|(for|if|else|await|yield(?:\\\\s+from)?))(?!\\\\s*:)\\\\b|(<<|>>|[\\\\&^|~])|(\\\\*\\\\*|[-%*+]|//|[/@])|(!=|==|>=|<=|[<>])|(:=)\"},\"parameter-special\":{\"captures\":{\"1\":{\"name\":\"variable.parameter.function.language.python\"},\"2\":{\"name\":\"variable.parameter.function.language.special.self.python\"},\"3\":{\"name\":\"variable.parameter.function.language.special.cls.python\"},\"4\":{\"name\":\"punctuation.separator.parameters.python\"}},\"match\":\"\\\\b((self)|(cls))\\\\b\\\\s*(?:(,)|(?=\\\\)))\"},\"parameters\":{\"begin\":\"(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.parameters.begin.python\"}},\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.parameters.end.python\"}},\"name\":\"meta.function.parameters.python\",\"patterns\":[{\"match\":\"/\",\"name\":\"keyword.operator.positional.parameter.python\"},{\"match\":\"(\\\\*\\\\*?)\",\"name\":\"keyword.operator.unpacking.parameter.python\"},{\"include\":\"#lambda-incomplete\"},{\"include\":\"#illegal-names\"},{\"include\":\"#illegal-object-name\"},{\"include\":\"#parameter-special\"},{\"captures\":{\"1\":{\"name\":\"variable.parameter.function.language.python\"},\"2\":{\"name\":\"punctuation.separator.parameters.python\"}},\"match\":\"([_[:alpha:]]\\\\w*)\\\\s*(?:(,)|(?=[\\\\n#)=]))\"},{\"include\":\"#comments\"},{\"include\":\"#loose-default\"},{\"include\":\"#annotated-parameter\"}]},\"punctuation\":{\"patterns\":[{\"match\":\":\",\"name\":\"punctuation.separator.colon.python\"},{\"match\":\",\",\"name\":\"punctuation.separator.element.python\"}]},\"regexp\":{\"patterns\":[{\"include\":\"#regexp-single-three-line\"},{\"include\":\"#regexp-double-three-line\"},{\"include\":\"#regexp-single-one-line\"},{\"include\":\"#regexp-double-one-line\"}]},\"regexp-backreference\":{\"captures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.backreference.named.begin.regexp\"},\"2\":{\"name\":\"entity.name.tag.named.backreference.regexp\"},\"3\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.backreference.named.end.regexp\"}},\"match\":\"(\\\\()(\\\\?P=\\\\w+(?:\\\\s+\\\\p{alnum}+)?)(\\\\))\",\"name\":\"meta.backreference.named.regexp\"},\"regexp-backreference-number\":{\"captures\":{\"1\":{\"name\":\"entity.name.tag.backreference.regexp\"}},\"match\":\"(\\\\\\\\[1-9]\\\\d?)\",\"name\":\"meta.backreference.regexp\"},\"regexp-base-common\":{\"patterns\":[{\"match\":\"\\\\.\",\"name\":\"support.other.match.any.regexp\"},{\"match\":\"\\\\^\",\"name\":\"support.other.match.begin.regexp\"},{\"match\":\"\\\\$\",\"name\":\"support.other.match.end.regexp\"},{\"match\":\"[*+?]\\\\??\",\"name\":\"keyword.operator.quantifier.regexp\"},{\"match\":\"\\\\|\",\"name\":\"keyword.operator.disjunction.regexp\"},{\"include\":\"#regexp-escape-sequence\"}]},\"regexp-base-expression\":{\"patterns\":[{\"include\":\"#regexp-quantifier\"},{\"include\":\"#regexp-base-common\"}]},\"regexp-charecter-set-escapes\":{\"patterns\":[{\"match\":\"\\\\\\\\[\\\\\\\\abfnrtv]\",\"name\":\"constant.character.escape.regexp\"},{\"include\":\"#regexp-escape-special\"},{\"match\":\"\\\\\\\\([0-7]{1,3})\",\"name\":\"constant.character.escape.regexp\"},{\"include\":\"#regexp-escape-character\"},{\"include\":\"#regexp-escape-unicode\"},{\"include\":\"#regexp-escape-catchall\"}]},\"regexp-double-one-line\":{\"begin\":\"\\\\b(([Uu]r)|([Bb]r)|(r[Bb]?))(\\\")\",\"beginCaptures\":{\"2\":{\"name\":\"invalid.deprecated.prefix.python\"},\"3\":{\"name\":\"storage.type.string.python\"},\"4\":{\"name\":\"storage.type.string.python\"},\"5\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\")|(?<!\\\\\\\\)(\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.regexp.quoted.single.python\",\"patterns\":[{\"include\":\"#double-one-regexp-expression\"}]},\"regexp-double-three-line\":{\"begin\":\"\\\\b(([Uu]r)|([Bb]r)|(r[Bb]?))(\\\"\\\"\\\")\",\"beginCaptures\":{\"2\":{\"name\":\"invalid.deprecated.prefix.python\"},\"3\":{\"name\":\"storage.type.string.python\"},\"4\":{\"name\":\"storage.type.string.python\"},\"5\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\"\\\"\\\")\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.regexp.quoted.multi.python\",\"patterns\":[{\"include\":\"#double-three-regexp-expression\"}]},\"regexp-escape-catchall\":{\"match\":\"\\\\\\\\(.|\\\\n)\",\"name\":\"constant.character.escape.regexp\"},\"regexp-escape-character\":{\"match\":\"\\\\\\\\(x\\\\h{2}|0[0-7]{1,2}|[0-7]{3})\",\"name\":\"constant.character.escape.regexp\"},\"regexp-escape-sequence\":{\"patterns\":[{\"include\":\"#regexp-escape-special\"},{\"include\":\"#regexp-escape-character\"},{\"include\":\"#regexp-escape-unicode\"},{\"include\":\"#regexp-backreference-number\"},{\"include\":\"#regexp-escape-catchall\"}]},\"regexp-escape-special\":{\"match\":\"\\\\\\\\([ABDSWZbdsw])\",\"name\":\"support.other.escape.special.regexp\"},\"regexp-escape-unicode\":{\"match\":\"\\\\\\\\(u\\\\h{4}|U\\\\h{8})\",\"name\":\"constant.character.unicode.regexp\"},\"regexp-flags\":{\"match\":\"\\\\(\\\\?[Laimsux]+\\\\)\",\"name\":\"storage.modifier.flag.regexp\"},\"regexp-quantifier\":{\"match\":\"\\\\{(\\\\d+|\\\\d+,(\\\\d+)?|,\\\\d+)}\",\"name\":\"keyword.operator.quantifier.regexp\"},\"regexp-single-one-line\":{\"begin\":\"\\\\b(([Uu]r)|([Bb]r)|(r[Bb]?))(')\",\"beginCaptures\":{\"2\":{\"name\":\"invalid.deprecated.prefix.python\"},\"3\":{\"name\":\"storage.type.string.python\"},\"4\":{\"name\":\"storage.type.string.python\"},\"5\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(')|(?<!\\\\\\\\)(\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.regexp.quoted.single.python\",\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"regexp-single-three-line\":{\"begin\":\"\\\\b(([Uu]r)|([Bb]r)|(r[Bb]?))(''')\",\"beginCaptures\":{\"2\":{\"name\":\"invalid.deprecated.prefix.python\"},\"3\":{\"name\":\"storage.type.string.python\"},\"4\":{\"name\":\"storage.type.string.python\"},\"5\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(''')\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.regexp.quoted.multi.python\",\"patterns\":[{\"include\":\"#single-three-regexp-expression\"}]},\"return-annotation\":{\"begin\":\"(->)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.separator.annotation.result.python\"}},\"end\":\"(?=:)\",\"patterns\":[{\"include\":\"#expression\"}]},\"round-braces\":{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.parenthesis.begin.python\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.parenthesis.end.python\"}},\"patterns\":[{\"include\":\"#expression\"}]},\"semicolon\":{\"patterns\":[{\"match\":\";$\",\"name\":\"invalid.deprecated.semicolon.python\"}]},\"single-one-regexp-character-set\":{\"patterns\":[{\"match\":\"\\\\[\\\\^?](?!.*?])\"},{\"begin\":\"(\\\\[)(\\\\^)?(])?\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.character.set.begin.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"keyword.operator.negation.regexp\"},\"3\":{\"name\":\"constant.character.set.regexp\"}},\"end\":\"(]|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.character.set.end.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.character.set.regexp\",\"patterns\":[{\"include\":\"#regexp-charecter-set-escapes\"},{\"match\":\"\\\\N\",\"name\":\"constant.character.set.regexp\"}]}]},\"single-one-regexp-comments\":{\"begin\":\"\\\\(\\\\?#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.comment.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.comment.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"comment.regexp\",\"patterns\":[{\"include\":\"#codetags\"}]},\"single-one-regexp-conditional\":{\"begin\":\"(\\\\()\\\\?\\\\((\\\\w+(?:\\\\s+\\\\p{alnum}+)?|\\\\d+)\\\\)\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.conditional.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.conditional.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.conditional.negative.regexp punctuation.parenthesis.conditional.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-expression\":{\"patterns\":[{\"include\":\"#regexp-base-expression\"},{\"include\":\"#single-one-regexp-character-set\"},{\"include\":\"#single-one-regexp-comments\"},{\"include\":\"#regexp-flags\"},{\"include\":\"#single-one-regexp-named-group\"},{\"include\":\"#regexp-backreference\"},{\"include\":\"#single-one-regexp-lookahead\"},{\"include\":\"#single-one-regexp-lookahead-negative\"},{\"include\":\"#single-one-regexp-lookbehind\"},{\"include\":\"#single-one-regexp-lookbehind-negative\"},{\"include\":\"#single-one-regexp-conditional\"},{\"include\":\"#single-one-regexp-parentheses-non-capturing\"},{\"include\":\"#single-one-regexp-parentheses\"}]},\"single-one-regexp-lookahead\":{\"begin\":\"(\\\\()\\\\?=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-lookahead-negative\":{\"begin\":\"(\\\\()\\\\?!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.negative.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-lookbehind\":{\"begin\":\"(\\\\()\\\\?<=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-lookbehind-negative\":{\"begin\":\"(\\\\()\\\\?<!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.negative.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-named-group\":{\"begin\":\"(\\\\()(\\\\?P<\\\\w+(?:\\\\s+\\\\p{alnum}+)?>)\",\"beginCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.begin.regexp\"},\"2\":{\"name\":\"entity.name.tag.named.group.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.named.regexp\",\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-parentheses\":{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-one-regexp-parentheses-non-capturing\":{\"begin\":\"\\\\(\\\\?:\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.begin.regexp\"}},\"end\":\"(\\\\)|(?='))|((?=(?<!\\\\\\\\)\\\\n))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-one-regexp-expression\"}]},\"single-three-regexp-character-set\":{\"patterns\":[{\"match\":\"\\\\[\\\\^?](?!.*?])\"},{\"begin\":\"(\\\\[)(\\\\^)?(])?\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.character.set.begin.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"keyword.operator.negation.regexp\"},\"3\":{\"name\":\"constant.character.set.regexp\"}},\"end\":\"(]|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.character.set.end.regexp constant.other.set.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.character.set.regexp\",\"patterns\":[{\"include\":\"#regexp-charecter-set-escapes\"},{\"match\":\"\\\\N\",\"name\":\"constant.character.set.regexp\"}]}]},\"single-three-regexp-comments\":{\"begin\":\"\\\\(\\\\?#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.comment.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.comment.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"comment.regexp\",\"patterns\":[{\"include\":\"#codetags\"}]},\"single-three-regexp-conditional\":{\"begin\":\"(\\\\()\\\\?\\\\((\\\\w+(?:\\\\s+\\\\p{alnum}+)?|\\\\d+)\\\\)\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.conditional.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.conditional.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.conditional.negative.regexp punctuation.parenthesis.conditional.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-expression\":{\"patterns\":[{\"include\":\"#regexp-base-expression\"},{\"include\":\"#single-three-regexp-character-set\"},{\"include\":\"#single-three-regexp-comments\"},{\"include\":\"#regexp-flags\"},{\"include\":\"#single-three-regexp-named-group\"},{\"include\":\"#regexp-backreference\"},{\"include\":\"#single-three-regexp-lookahead\"},{\"include\":\"#single-three-regexp-lookahead-negative\"},{\"include\":\"#single-three-regexp-lookbehind\"},{\"include\":\"#single-three-regexp-lookbehind-negative\"},{\"include\":\"#single-three-regexp-conditional\"},{\"include\":\"#single-three-regexp-parentheses-non-capturing\"},{\"include\":\"#single-three-regexp-parentheses\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-lookahead\":{\"begin\":\"(\\\\()\\\\?=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-lookahead-negative\":{\"begin\":\"(\\\\()\\\\?!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookahead.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookahead.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookahead.negative.regexp punctuation.parenthesis.lookahead.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-lookbehind\":{\"begin\":\"(\\\\()\\\\?<=\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-lookbehind-negative\":{\"begin\":\"(\\\\()\\\\?<!\",\"beginCaptures\":{\"0\":{\"name\":\"keyword.operator.lookbehind.negative.regexp\"},\"1\":{\"name\":\"punctuation.parenthesis.lookbehind.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"keyword.operator.lookbehind.negative.regexp punctuation.parenthesis.lookbehind.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-named-group\":{\"begin\":\"(\\\\()(\\\\?P<\\\\w+(?:\\\\s+\\\\p{alnum}+)?>)\",\"beginCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.begin.regexp\"},\"2\":{\"name\":\"entity.name.tag.named.group.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.named.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"meta.named.regexp\",\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-parentheses\":{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"single-three-regexp-parentheses-non-capturing\":{\"begin\":\"\\\\(\\\\?:\",\"beginCaptures\":{\"0\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.begin.regexp\"}},\"end\":\"(\\\\)|(?='''))\",\"endCaptures\":{\"1\":{\"name\":\"support.other.parenthesis.regexp punctuation.parenthesis.non-capturing.end.regexp\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"patterns\":[{\"include\":\"#single-three-regexp-expression\"},{\"include\":\"#comments-string-single-three\"}]},\"special-names\":{\"match\":\"\\\\b(_*\\\\p{upper}[_\\\\d]*\\\\p{upper})[[:upper:]\\\\d]*(_\\\\w*)?\\\\b\",\"name\":\"constant.other.caps.python\"},\"special-variables\":{\"captures\":{\"1\":{\"name\":\"variable.language.special.self.python\"},\"2\":{\"name\":\"variable.language.special.cls.python\"}},\"match\":\"\\\\b(?<!\\\\.)(?:(self)|(cls))\\\\b\"},\"statement\":{\"patterns\":[{\"include\":\"#import\"},{\"include\":\"#class-declaration\"},{\"include\":\"#function-declaration\"},{\"include\":\"#generator\"},{\"include\":\"#statement-keyword\"},{\"include\":\"#assignment-operator\"},{\"include\":\"#decorator\"},{\"include\":\"#docstring-statement\"},{\"include\":\"#semicolon\"}]},\"statement-keyword\":{\"patterns\":[{\"match\":\"\\\\b((async\\\\s+)?\\\\s*def)\\\\b\",\"name\":\"storage.type.function.python\"},{\"match\":\"\\\\b(?<!\\\\.)as\\\\b(?=.*[:\\\\\\\\])\",\"name\":\"keyword.control.flow.python\"},{\"match\":\"\\\\b(?<!\\\\.)as\\\\b\",\"name\":\"keyword.control.import.python\"},{\"match\":\"\\\\b(?<!\\\\.)(async|continue|del|assert|break|finally|for|from|elif|else|if|except|pass|raise|return|try|while|with)\\\\b\",\"name\":\"keyword.control.flow.python\"},{\"match\":\"\\\\b(?<!\\\\.)(global|nonlocal)\\\\b\",\"name\":\"storage.modifier.declaration.python\"},{\"match\":\"\\\\b(?<!\\\\.)(class)\\\\b\",\"name\":\"storage.type.class.python\"},{\"captures\":{\"1\":{\"name\":\"keyword.control.flow.python\"}},\"match\":\"^\\\\s*(case|match)(?=\\\\s*([-\\\"#'(+:\\\\[{\\\\w\\\\d]|$))\\\\b\"}]},\"string\":{\"patterns\":[{\"include\":\"#string-quoted-multi-line\"},{\"include\":\"#string-quoted-single-line\"},{\"include\":\"#string-bin-quoted-multi-line\"},{\"include\":\"#string-bin-quoted-single-line\"},{\"include\":\"#string-raw-quoted-multi-line\"},{\"include\":\"#string-raw-quoted-single-line\"},{\"include\":\"#string-raw-bin-quoted-multi-line\"},{\"include\":\"#string-raw-bin-quoted-single-line\"},{\"include\":\"#fstring-fnorm-quoted-multi-line\"},{\"include\":\"#fstring-fnorm-quoted-single-line\"},{\"include\":\"#fstring-normf-quoted-multi-line\"},{\"include\":\"#fstring-normf-quoted-single-line\"},{\"include\":\"#fstring-raw-quoted-multi-line\"},{\"include\":\"#fstring-raw-quoted-single-line\"}]},\"string-bin-quoted-multi-line\":{\"begin\":\"\\\\b([Bb])('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\2)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.binary.multi.python\",\"patterns\":[{\"include\":\"#string-entity\"}]},\"string-bin-quoted-single-line\":{\"begin\":\"\\\\b([Bb])(([\\\"']))\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\2)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.binary.single.python\",\"patterns\":[{\"include\":\"#string-entity\"}]},\"string-brace-formatting\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"},\"3\":{\"name\":\"storage.type.format.python\"},\"4\":{\"name\":\"storage.type.format.python\"}},\"match\":\"(\\\\{\\\\{|}}|\\\\{\\\\w*(\\\\.[_[:alpha:]]\\\\w*|\\\\[[^]\\\"']+])*(![ars])?(:\\\\w?[<=>^]?[- +]?#?\\\\d*,?(\\\\.\\\\d+)?[%EFGXb-gnosx]?)?})\",\"name\":\"meta.format.brace.python\"},{\"captures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"},\"3\":{\"name\":\"storage.type.format.python\"},\"4\":{\"name\":\"storage.type.format.python\"}},\"match\":\"(\\\\{\\\\w*(\\\\.[_[:alpha:]]\\\\w*|\\\\[[^]\\\"']+])*(![ars])?(:)[^\\\\n\\\"'{}]*(?:\\\\{[^\\\\n\\\"'}]*?}[^\\\\n\\\"'{}]*)*})\",\"name\":\"meta.format.brace.python\"}]},\"string-consume-escape\":{\"match\":\"\\\\\\\\[\\\\n\\\"'\\\\\\\\]\"},\"string-entity\":{\"patterns\":[{\"include\":\"#escape-sequence\"},{\"include\":\"#string-line-continuation\"},{\"include\":\"#string-formatting\"}]},\"string-formatting\":{\"captures\":{\"1\":{\"name\":\"constant.character.format.placeholder.other.python\"}},\"match\":\"(%(\\\\([\\\\w\\\\s]*\\\\))?[- #+0]*(\\\\d+|\\\\*)?(\\\\.(\\\\d+|\\\\*))?([Lhl])?[%EFGXa-giorsux])\",\"name\":\"meta.format.percent.python\"},\"string-line-continuation\":{\"match\":\"\\\\\\\\$\",\"name\":\"constant.language.python\"},\"string-multi-bad-brace1-formatting-raw\":{\"begin\":\"(?=\\\\{%(.*?(?!'''|\\\"\\\"\\\"))%})\",\"end\":\"(?='''|\\\"\\\"\\\")\",\"patterns\":[{\"include\":\"#string-consume-escape\"}]},\"string-multi-bad-brace1-formatting-unicode\":{\"begin\":\"(?=\\\\{%(.*?(?!'''|\\\"\\\"\\\"))%})\",\"end\":\"(?='''|\\\"\\\"\\\")\",\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#escape-sequence\"},{\"include\":\"#string-line-continuation\"}]},\"string-multi-bad-brace2-formatting-raw\":{\"begin\":\"(?!\\\\{\\\\{)(?=\\\\{(\\\\w*?(?!'''|\\\"\\\"\\\")[^!.:\\\\[}\\\\w]).*?(?!'''|\\\"\\\"\\\")})\",\"end\":\"(?='''|\\\"\\\"\\\")\",\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#string-formatting\"}]},\"string-multi-bad-brace2-formatting-unicode\":{\"begin\":\"(?!\\\\{\\\\{)(?=\\\\{(\\\\w*?(?!'''|\\\"\\\"\\\")[^!.:\\\\[}\\\\w]).*?(?!'''|\\\"\\\"\\\")})\",\"end\":\"(?='''|\\\"\\\"\\\")\",\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#string-entity\"}]},\"string-quoted-multi-line\":{\"begin\":\"(?:\\\\b([Rr])(?=[Uu]))?([Uu])?('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"invalid.illegal.prefix.python\"},\"2\":{\"name\":\"storage.type.string.python\"},\"3\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\3)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.multi.python\",\"patterns\":[{\"include\":\"#string-multi-bad-brace1-formatting-unicode\"},{\"include\":\"#string-multi-bad-brace2-formatting-unicode\"},{\"include\":\"#string-unicode-guts\"}]},\"string-quoted-single-line\":{\"begin\":\"(?:\\\\b([Rr])(?=[Uu]))?([Uu])?(([\\\"']))\",\"beginCaptures\":{\"1\":{\"name\":\"invalid.illegal.prefix.python\"},\"2\":{\"name\":\"storage.type.string.python\"},\"3\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\3)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.single.python\",\"patterns\":[{\"include\":\"#string-single-bad-brace1-formatting-unicode\"},{\"include\":\"#string-single-bad-brace2-formatting-unicode\"},{\"include\":\"#string-unicode-guts\"}]},\"string-raw-bin-guts\":{\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#string-formatting\"}]},\"string-raw-bin-quoted-multi-line\":{\"begin\":\"\\\\b(R[Bb]|[Bb]R)('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\2)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.raw.binary.multi.python\",\"patterns\":[{\"include\":\"#string-raw-bin-guts\"}]},\"string-raw-bin-quoted-single-line\":{\"begin\":\"\\\\b(R[Bb]|[Bb]R)(([\\\"']))\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.string.python\"},\"2\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\2)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.raw.binary.single.python\",\"patterns\":[{\"include\":\"#string-raw-bin-guts\"}]},\"string-raw-guts\":{\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#string-formatting\"},{\"include\":\"#string-brace-formatting\"}]},\"string-raw-quoted-multi-line\":{\"begin\":\"\\\\b(([Uu]R)|(R))('''|\\\"\\\"\\\")\",\"beginCaptures\":{\"2\":{\"name\":\"invalid.deprecated.prefix.python\"},\"3\":{\"name\":\"storage.type.string.python\"},\"4\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\4)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.raw.multi.python\",\"patterns\":[{\"include\":\"#string-multi-bad-brace1-formatting-raw\"},{\"include\":\"#string-multi-bad-brace2-formatting-raw\"},{\"include\":\"#string-raw-guts\"}]},\"string-raw-quoted-single-line\":{\"begin\":\"\\\\b(([Uu]R)|(R))(([\\\"']))\",\"beginCaptures\":{\"2\":{\"name\":\"invalid.deprecated.prefix.python\"},\"3\":{\"name\":\"storage.type.string.python\"},\"4\":{\"name\":\"punctuation.definition.string.begin.python\"}},\"end\":\"(\\\\4)|((?<!\\\\\\\\)\\\\n)\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.string.end.python\"},\"2\":{\"name\":\"invalid.illegal.newline.python\"}},\"name\":\"string.quoted.raw.single.python\",\"patterns\":[{\"include\":\"#string-single-bad-brace1-formatting-raw\"},{\"include\":\"#string-single-bad-brace2-formatting-raw\"},{\"include\":\"#string-raw-guts\"}]},\"string-single-bad-brace1-formatting-raw\":{\"begin\":\"(?=\\\\{%(.*?(?!([\\\"'])|((?<!\\\\\\\\)\\\\n)))%})\",\"end\":\"(?=([\\\"'])|((?<!\\\\\\\\)\\\\n))\",\"patterns\":[{\"include\":\"#string-consume-escape\"}]},\"string-single-bad-brace1-formatting-unicode\":{\"begin\":\"(?=\\\\{%(.*?(?!([\\\"'])|((?<!\\\\\\\\)\\\\n)))%})\",\"end\":\"(?=([\\\"'])|((?<!\\\\\\\\)\\\\n))\",\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#escape-sequence\"},{\"include\":\"#string-line-continuation\"}]},\"string-single-bad-brace2-formatting-raw\":{\"begin\":\"(?!\\\\{\\\\{)(?=\\\\{(\\\\w*?(?!([\\\"'])|((?<!\\\\\\\\)\\\\n))[^!.:\\\\[}\\\\w]).*?(?!([\\\"'])|((?<!\\\\\\\\)\\\\n))})\",\"end\":\"(?=([\\\"'])|((?<!\\\\\\\\)\\\\n))\",\"patterns\":[{\"include\":\"#string-consume-escape\"},{\"include\":\"#string-formatting\"}]},\"string-single-bad-brace2-formatting-unicode\":{\"begin\":\"(?!\\\\{\\\\{)(?=\\\\{(\\\\w*?(?!([\\\"'])|((?<!\\\\\\\\)\\\\n))[^!.:\\\\[}\\\\w]).*?(?!([\\\"'])|((?<!\\\\\\\\)\\\\n))})\",\"end\":\"(?=([\\\"'])|((?<!\\\\\\\\)\\\\n))\",\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#string-entity\"}]},\"string-unicode-guts\":{\"patterns\":[{\"include\":\"#escape-sequence-unicode\"},{\"include\":\"#string-entity\"},{\"include\":\"#string-brace-formatting\"}]}},\"scopeName\":\"source.python\",\"aliases\":[\"py\"]}"));

var python = [
lang$1
];

const lang = Object.freeze(JSON.parse("{\"displayName\":\"R\",\"name\":\"r\",\"patterns\":[{\"include\":\"#roxygen\"},{\"include\":\"#comments\"},{\"include\":\"#constants\"},{\"include\":\"#accessor\"},{\"include\":\"#operators\"},{\"include\":\"#keywords\"},{\"include\":\"#storage-type\"},{\"include\":\"#strings\"},{\"include\":\"#brackets\"},{\"include\":\"#function-declarations\"},{\"include\":\"#lambda-functions\"},{\"include\":\"#builtin-functions\"},{\"include\":\"#function-calls\"}],\"repository\":{\"accessor\":{\"patterns\":[{\"begin\":\"(\\\\$)(?=[.A-Z_a-z][.\\\\w]*|`[^`]+`)\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.accessor.dollar.r\"}},\"end\":\"(?!\\\\G)\",\"endCaptures\":{},\"patterns\":[{\"include\":\"#function-calls\"}]}]},\"brackets\":{\"patterns\":[{\"begin\":\"\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.parens.begin.r\"}},\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.parens.end.r\"}},\"patterns\":[{\"include\":\"source.r\"}]},{\"begin\":\"\\\\[(?!\\\\[)\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.brackets.single.begin.r\"}},\"end\":\"]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.brackets.single.end.r\"}},\"patterns\":[{\"include\":\"source.r\"}]},{\"begin\":\"\\\\[\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.brackets.double.begin.r\"}},\"contentName\":\"meta.item-access.arguments.r\",\"end\":\"]]\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.brackets.double.end.r\"}},\"patterns\":[{\"include\":\"source.r\"}]},{\"begin\":\"\\\\{\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.section.braces.begin.r\"}},\"end\":\"}\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.section.braces.end.r\"}},\"patterns\":[{\"include\":\"source.r\"}]}]},\"builtin-functions\":{\"patterns\":[{\"begin\":\"\\\\b(abbreviate|abs|acosh??|activeBindingFunction|addNA|addTaskCallback|agrepl??|alist|all|all\\\\.equal|all\\\\.equal\\\\.character|all\\\\.equal\\\\.default|all\\\\.equal\\\\.environment|all\\\\.equal\\\\.envRefClass|all\\\\.equal\\\\.factor|all\\\\.equal\\\\.formula|all\\\\.equal\\\\.function|all\\\\.equal\\\\.language|all\\\\.equal\\\\.list|all\\\\.equal\\\\.numeric|all\\\\.equal\\\\.POSIXt|all\\\\.equal\\\\.raw|all\\\\.names|allowInterrupts|all\\\\.vars|any|anyDuplicated|anyDuplicated\\\\.array|anyDuplicated\\\\.data\\\\.frame|anyDuplicated\\\\.default|anyDuplicated\\\\.matrix|anyNA|anyNA\\\\.data\\\\.frame|anyNA\\\\.numeric_version|anyNA\\\\.POSIXlt|aperm|aperm\\\\.default|aperm\\\\.table|append|apply|Arg|args|array|arrayInd|as\\\\.array|as\\\\.array\\\\.default|as\\\\.call|as\\\\.character|as\\\\.character\\\\.condition|as\\\\.character\\\\.Date|as\\\\.character\\\\.default|as\\\\.character\\\\.error|as\\\\.character\\\\.factor|as\\\\.character\\\\.hexmode|as\\\\.character\\\\.numeric_version|as\\\\.character\\\\.octmode|as\\\\.character\\\\.POSIXt|as\\\\.character\\\\.srcref|as\\\\.complex|as\\\\.data\\\\.frame|as\\\\.data\\\\.frame\\\\.array|as\\\\.data\\\\.frame\\\\.AsIs|as\\\\.data\\\\.frame\\\\.character|as\\\\.data\\\\.frame\\\\.complex|as\\\\.data\\\\.frame\\\\.data\\\\.frame|as\\\\.data\\\\.frame\\\\.Date|as\\\\.data\\\\.frame\\\\.default|as\\\\.data\\\\.frame\\\\.difftime|as\\\\.data\\\\.frame\\\\.factor|as\\\\.data\\\\.frame\\\\.integer|as\\\\.data\\\\.frame\\\\.list|as\\\\.data\\\\.frame\\\\.logical|as\\\\.data\\\\.frame\\\\.matrix|as\\\\.data\\\\.frame\\\\.model\\\\.matrix|as\\\\.data\\\\.frame\\\\.noquote|as\\\\.data\\\\.frame\\\\.numeric|as\\\\.data\\\\.frame\\\\.numeric_version|as\\\\.data\\\\.frame\\\\.ordered|as\\\\.data\\\\.frame\\\\.POSIXct|as\\\\.data\\\\.frame\\\\.POSIXlt|as\\\\.data\\\\.frame\\\\.raw|as\\\\.data\\\\.frame\\\\.table|as\\\\.data\\\\.frame\\\\.ts|as\\\\.data\\\\.frame\\\\.vector|as\\\\.Date|as\\\\.Date\\\\.character|as\\\\.Date\\\\.default|as\\\\.Date\\\\.factor|as\\\\.Date\\\\.numeric|as\\\\.Date\\\\.POSIXct|as\\\\.Date\\\\.POSIXlt|as\\\\.difftime|as\\\\.double|as\\\\.double\\\\.difftime|as\\\\.double\\\\.POSIXlt|as\\\\.environment|as\\\\.expression|as\\\\.expression\\\\.default|as\\\\.factor|as\\\\.function|as\\\\.function\\\\.default|as\\\\.hexmode|asinh??|as\\\\.integer|as\\\\.list|as\\\\.list\\\\.data\\\\.frame|as\\\\.list\\\\.Date|as\\\\.list\\\\.default|as\\\\.list\\\\.difftime|as\\\\.list\\\\.environment|as\\\\.list\\\\.factor|as\\\\.list\\\\.function|as\\\\.list\\\\.numeric_version|as\\\\.list\\\\.POSIXct|as\\\\.list\\\\.POSIXlt|as\\\\.logical|as\\\\.logical\\\\.factor|as\\\\.matrix|as\\\\.matrix\\\\.data\\\\.frame|as\\\\.matrix\\\\.default|as\\\\.matrix\\\\.noquote|as\\\\.matrix\\\\.POSIXlt|as\\\\.name|asNamespace|as\\\\.null|as\\\\.null\\\\.default|as\\\\.numeric|as\\\\.numeric_version|as\\\\.octmode|as\\\\.ordered|as\\\\.package_version|as\\\\.pairlist|asplit|as\\\\.POSIXct|as\\\\.POSIXct\\\\.Date|as\\\\.POSIXct\\\\.default|as\\\\.POSIXct\\\\.numeric|as\\\\.POSIXct\\\\.POSIXlt|as\\\\.POSIXlt|as\\\\.POSIXlt\\\\.character|as\\\\.POSIXlt\\\\.Date|as\\\\.POSIXlt\\\\.default|as\\\\.POSIXlt\\\\.factor|as\\\\.POSIXlt\\\\.numeric|as\\\\.POSIXlt\\\\.POSIXct|as\\\\.qr|as\\\\.raw|asS3|asS4|assign|as\\\\.single|as\\\\.single\\\\.default|as\\\\.symbol|as\\\\.table|as\\\\.table\\\\.default|as\\\\.vector|as\\\\.vector\\\\.factor|atan2??|atanh|attach|attachNamespace|attr|attr\\\\.all\\\\.equal|attributes|autoload|autoloader|backsolve|baseenv|basename|besselI|besselJ|besselK|besselY|beta|bindingIsActive|bindingIsLocked|bindtextdomain|bitwAnd|bitwNot|bitwOr|bitwShiftL|bitwShiftR|bitwXor|body|bquote|break|browser|browserCondition|browserSetDebug|browserText|builtins|by|by\\\\.data\\\\.frame|by\\\\.default|bzfile|c|call|callCC|capabilities|casefold|cat|cbind|cbind\\\\.data\\\\.frame|c\\\\.Date|c\\\\.difftime|ceiling|c\\\\.factor|character|char\\\\.expand|charmatch|charToRaw|chartr|check_tzones|chkDots|chol|chol2inv|chol\\\\.default|choose|class|clearPushBack|close|closeAllConnections|close\\\\.connection|close\\\\.srcfile|close\\\\.srcfilealias|c\\\\.noquote|c\\\\.numeric_version|col|colMeans|colnames|colSums|commandArgs|comment|complex|computeRestarts|conditionCall|conditionCall\\\\.condition|conditionMessage|conditionMessage\\\\.condition|conflictRules|conflicts|Conj|contributors|cosh??|cospi|c\\\\.POSIXct|c\\\\.POSIXlt|crossprod|Cstack_info|cummax|cummin|cumprod|cumsum|curlGetHeaders|cut|cut\\\\.Date|cut\\\\.default|cut\\\\.POSIXt|c\\\\.warnings|data\\\\.class|data\\\\.frame|data\\\\.matrix|date|debug|debuggingState|debugonce|default\\\\.stringsAsFactors|delayedAssign|deparse1??|det|detach|determinant|determinant\\\\.matrix|dget|diag|diff|diff\\\\.Date|diff\\\\.default|diff\\\\.difftime|diff\\\\.POSIXt|difftime|digamma|dim|dim\\\\.data\\\\.frame|dimnames|dimnames\\\\.data\\\\.frame|dir|dir\\\\.create|dir\\\\.exists|dirname|do\\\\.call|dontCheck|double|dput|dQuote|drop|droplevels|droplevels\\\\.data\\\\.frame|droplevels\\\\.factor|dump|duplicated|duplicated\\\\.array|duplicated\\\\.data\\\\.frame|duplicated\\\\.default|duplicated\\\\.matrix|duplicated\\\\.numeric_version|duplicated\\\\.POSIXlt|duplicated\\\\.warnings|dynGet|dyn\\\\.load|dyn\\\\.unload|eapply|eigen|emptyenv|enc2native|enc2utf8|encodeString|Encoding|endsWith|enquote|environment|environmentIsLocked|environmentName|env\\\\.profile|errorCondition|eval|eval\\\\.parent|evalq|exists|exp|expand\\\\.grid|expm1|expression|extSoftVersion|factor|factorial|fifo|file|file\\\\.access|file\\\\.append|file\\\\.choose|file\\\\.copy|file\\\\.create|file\\\\.exists|file\\\\.info|file\\\\.link|file\\\\.mode|file\\\\.mtime|file\\\\.path|file\\\\.remove|file\\\\.rename|file\\\\.show|file\\\\.size|file\\\\.symlink|Filter|Find|findInterval|find\\\\.package|findPackageEnv|findRestart|floor|flush|flush\\\\.connection|for|force|forceAndCall|formals|format|format\\\\.AsIs|formatC|format\\\\.data\\\\.frame|format\\\\.Date|format\\\\.default|format\\\\.difftime|formatDL|format\\\\.factor|format\\\\.hexmode|format\\\\.info|format\\\\.libraryIQR|format\\\\.numeric_version|format\\\\.octmode|format\\\\.packageInfo|format\\\\.POSIXct|format\\\\.POSIXlt|format\\\\.pval|format\\\\.summaryDefault|forwardsolve|function|gamma|gc|gcinfo|gc\\\\.time|gctorture2??|get0??|getAllConnections|getCallingDLLe??|getConnection|getDLLRegisteredRoutines|getDLLRegisteredRoutines\\\\.character|getDLLRegisteredRoutines\\\\.DLLInfo|getElement|geterrmessage|getExportedValue|getHook|getLoadedDLLs|getNamespace|getNamespaceExports|getNamespaceImports|getNamespaceInfo|getNamespaceName|getNamespaceUsers|getNamespaceVersion|getNativeSymbolInfo|getOption|getRversion|getSrcLines|getTaskCallbackNames|gettextf??|getwd|gl|globalCallingHandlers|globalenv|gregexec|gregexpr|grepl??|grepRaw|grouping|gsub|gzcon|gzfile|I|iconv|iconvlist|icuGetCollate|icuSetCollate|identical|identity|if|ifelse|Im|importIntoEnv|infoRDS|inherits|integer|interaction|interactive|intersect|intToBits|intToUtf8|inverse\\\\.rle|invisible|invokeRestart|invokeRestartInteractively|isa|is\\\\.array|is\\\\.atomic|isatty|isBaseNamespace|is\\\\.call|is\\\\.character|is\\\\.complex|is\\\\.data\\\\.frame|isdebugged|is\\\\.double|is\\\\.element|is\\\\.environment|is\\\\.expression|is\\\\.factor|isFALSE|is\\\\.finite|is\\\\.function|isIncomplete|is\\\\.infinite|is\\\\.integer|is\\\\.language|is\\\\.list|is\\\\.loaded|is\\\\.logical|is\\\\.matrix|is\\\\.na|is\\\\.na\\\\.data\\\\.frame|is\\\\.name|isNamespace|isNamespaceLoaded|is\\\\.nan|is\\\\.na\\\\.numeric_version|is\\\\.na\\\\.POSIXlt|is\\\\.null|is\\\\.numeric|is\\\\.numeric\\\\.Date|is\\\\.numeric\\\\.difftime|is\\\\.numeric\\\\.POSIXt|is\\\\.numeric_version|is\\\\.object|ISOdate|ISOdatetime|isOpen|is\\\\.ordered|is\\\\.package_version|is\\\\.pairlist|is\\\\.primitive|is\\\\.qr|is\\\\.R|is\\\\.raw|is\\\\.recursive|isRestart|isS4|isSeekable|is\\\\.single|is\\\\.symbol|isSymmetric|isSymmetric\\\\.matrix|is\\\\.table|isTRUE|is\\\\.unsorted|is\\\\.vector|jitter|julian|julian\\\\.Date|julian\\\\.POSIXt|kappa|kappa\\\\.default|kappa\\\\.lm|kappa\\\\.qr|kronecker|l10n_info|labels|labels\\\\.default|La_library|lapply|La\\\\.svd|La_version|lazyLoad|lazyLoadDBexec|lazyLoadDBfetch|lbeta|lchoose|length|length\\\\.POSIXlt|lengths|levels|levels\\\\.default|lfactorial|lgamma|libcurlVersion|library|library\\\\.dynam|library\\\\.dynam\\\\.unload|licence|license|list|list2DF|list2env|list\\\\.dirs|list\\\\.files|load|loadedNamespaces|loadingNamespaceInfo|loadNamespace|local|lockBinding|lockEnvironment|log|log10|log1p|log2|logb|logical|lower\\\\.tri|ls|makeActiveBinding|make\\\\.names|make\\\\.unique|Map|mapply|marginSums|margin\\\\.table|match|match\\\\.arg|match\\\\.call|match\\\\.fun|Math\\\\.data\\\\.frame|Math\\\\.Date|Math\\\\.difftime|Math\\\\.factor|Math\\\\.POSIXt|mat\\\\.or\\\\.vec|matrix|max|max\\\\.col|mean|mean\\\\.Date|mean\\\\.default|mean\\\\.difftime|mean\\\\.POSIXct|mean\\\\.POSIXlt|memCompress|memDecompress|mem\\\\.maxNSize|mem\\\\.maxVSize|memory\\\\.profile|merge|merge\\\\.data\\\\.frame|merge\\\\.default|message|mget|min|missing|Mod|mode|months|months\\\\.Date|months\\\\.POSIXt|names|namespaceExport|namespaceImport|namespaceImportClasses|namespaceImportFrom|namespaceImportMethods|names\\\\.POSIXlt|nargs|nchar|ncol|NCOL|Negate|new\\\\.env|next|NextMethod|ngettext|nlevels|noquote|norm|normalizePath|nrow|NROW|nullfile|numeric|numeric_version|numToBits|numToInts|nzchar|objects|oldClass|OlsonNames|on\\\\.exit|open|open\\\\.connection|open\\\\.srcfile|open\\\\.srcfilealias|open\\\\.srcfilecopy|Ops\\\\.data\\\\.frame|Ops\\\\.Date|Ops\\\\.difftime|Ops\\\\.factor|Ops\\\\.numeric_version|Ops\\\\.ordered|Ops\\\\.POSIXt|options|order|ordered|outer|packageEvent|packageHasNamespace|packageNotFoundError|packageStartupMessage|package_version|packBits|pairlist|parent\\\\.env|parent\\\\.frame|parse|parseNamespaceFile|paste0??|path\\\\.expand|path\\\\.package|pcre_config|pi|pipe|plot|pmatch|pmax|pmax\\\\.int|pmin|pmin\\\\.int|polyroot|Position|pos\\\\.to\\\\.env|pretty|pretty\\\\.default|prettyNum|print|print\\\\.AsIs|print\\\\.by|print\\\\.condition|print\\\\.connection|print\\\\.data\\\\.frame|print\\\\.Date|print\\\\.default|print\\\\.difftime|print\\\\.Dlist|print\\\\.DLLInfo|print\\\\.DLLInfoList|print\\\\.DLLRegisteredRoutines|print\\\\.eigen|print\\\\.factor|print\\\\.function|print\\\\.hexmode|print\\\\.libraryIQR|print\\\\.listof|print\\\\.NativeRoutineList|print\\\\.noquote|print\\\\.numeric_version|print\\\\.octmode|print\\\\.packageInfo|print\\\\.POSIXct|print\\\\.POSIXlt|print\\\\.proc_time|print\\\\.restart|print\\\\.rle|print\\\\.simple\\\\.list|print\\\\.srcfile|print\\\\.srcref|print\\\\.summaryDefault|print\\\\.summary\\\\.table|print\\\\.summary\\\\.warnings|print\\\\.table|print\\\\.warnings|prmatrix|proc\\\\.time|prod|proportions|prop\\\\.table|provideDimnames|psigamma|pushBack|pushBackLength|qr??|qr\\\\.coef|qr\\\\.default|qr\\\\.fitted|qr\\\\.Q|qr\\\\.qty|qr\\\\.qy|qr\\\\.R|qr\\\\.resid|qr\\\\.solve|qr\\\\.X|quarters|quarters\\\\.Date|quarters\\\\.POSIXt|quit|quote|range|range\\\\.default|rank|rapply|raw|rawConnection|rawConnectionValue|rawShift|rawToBits|rawToChar|rbind|rbind\\\\.data\\\\.frame|rcond|Re|readBin|readChar|read\\\\.dcf|readline|readLines|readRDS|readRenviron|Recall|Reduce|regexec|regexpr|reg\\\\.finalizer|registerS3methods??|regmatches|remove|removeTaskCallback|rep|rep\\\\.Date|rep\\\\.difftime|repeat|rep\\\\.factor|rep\\\\.int|replace|rep_len|replicate|rep\\\\.numeric_version|rep\\\\.POSIXct|rep\\\\.POSIXlt|require|requireNamespace|restartDescription|restartFormals|retracemem|return|returnValue|rev|rev\\\\.default|R\\\\.home|rle|rm|RNGkind|RNGversion|round|round\\\\.Date|round\\\\.POSIXt|row|rowMeans|rownames|row\\\\.names|row\\\\.names\\\\.data\\\\.frame|row\\\\.names\\\\.default|rowsum|rowsum\\\\.data\\\\.frame|rowsum\\\\.default|rowSums|R_system_version|R\\\\.version|R\\\\.Version|R\\\\.version\\\\.string|sample|sample\\\\.int|sapply|save|save\\\\.image|saveRDS|scale|scale\\\\.default|scan|search|searchpaths|seek|seek\\\\.connection|seq|seq_along|seq\\\\.Date|seq\\\\.default|seq\\\\.int|seq_len|seq\\\\.POSIXt|sequence|sequence\\\\.default|serialize|serverSocket|setdiff|setequal|setHook|setNamespaceInfo|set\\\\.seed|setSessionTimeLimit|setTimeLimit|setwd|showConnections|shQuote|sign|signalCondition|signif|simpleCondition|simpleError|simpleMessage|simpleWarning|simplify2array|sin|single|sinh|sink|sink\\\\.number|sinpi|slice\\\\.index|socketAccept|socketConnection|socketSelect|socketTimeout|solve|solve\\\\.default|solve\\\\.qr|sort|sort\\\\.default|sort\\\\.int|sort\\\\.list|sort\\\\.POSIXlt|source|split|split\\\\.data\\\\.frame|split\\\\.Date|split\\\\.default|split\\\\.POSIXct|sprintf|sqrt|sQuote|srcfile|srcfilealias|srcfilecopy|srcref|standardGeneric|startsWith|stderr|stdin|stdout|stop|stopifnot|storage\\\\.mode|str2expression|str2lang|strftime|strptime|strrep|strsplit|strtoi|strtrim|structure|strwrap|sub|subset|subset\\\\.data\\\\.frame|subset\\\\.default|subset\\\\.matrix|substitute|substr|substring|sum|summary|summary\\\\.connection|summary\\\\.data\\\\.frame|Summary\\\\.data\\\\.frame|summary\\\\.Date|Summary\\\\.Date|summary\\\\.default|Summary\\\\.difftime|summary\\\\.factor|Summary\\\\.factor|summary\\\\.matrix|Summary\\\\.numeric_version|Summary\\\\.ordered|summary\\\\.POSIXct|Summary\\\\.POSIXct|summary\\\\.POSIXlt|Summary\\\\.POSIXlt|summary\\\\.proc_time|summary\\\\.srcfile|summary\\\\.srcref|summary\\\\.table|summary\\\\.warnings|suppressMessages|suppressPackageStartupMessages|suppressWarnings|suspendInterrupts|svd|sweep|switch|sys\\\\.calls??|Sys\\\\.chmod|Sys\\\\.Date|sys\\\\.frames??|sys\\\\.function|Sys\\\\.getenv|Sys\\\\.getlocale|Sys\\\\.getpid|Sys\\\\.glob|Sys\\\\.info|sys\\\\.load\\\\.image|Sys\\\\.localeconv|sys\\\\.nframe|sys\\\\.on\\\\.exit|sys\\\\.parents??|Sys\\\\.readlink|sys\\\\.save\\\\.image|Sys\\\\.setenv|Sys\\\\.setFileTime|Sys\\\\.setlocale|Sys\\\\.sleep|sys\\\\.source|sys\\\\.status|system2??|system\\\\.file|system\\\\.time|Sys\\\\.time|Sys\\\\.timezone|Sys\\\\.umask|Sys\\\\.unsetenv|Sys\\\\.which|t|table|tabulate|tanh??|tanpi|tapply|taskCallbackManager|tcrossprod|t\\\\.data\\\\.frame|t\\\\.default|tempdir|tempfile|textConnection|textConnectionValue|tolower|topenv|toString|toString\\\\.default|toupper|trace|traceback|tracemem|tracingState|transform|transform\\\\.data\\\\.frame|transform\\\\.default|trigamma|trimws|trunc|truncate|truncate\\\\.connection|trunc\\\\.Date|trunc\\\\.POSIXt|try|tryCatch|tryInvokeRestart|typeof|unclass|undebug|union|unique|unique\\\\.array|unique\\\\.data\\\\.frame|unique\\\\.default|unique\\\\.matrix|unique\\\\.numeric_version|unique\\\\.POSIXlt|unique\\\\.warnings|units|units\\\\.difftime|unix\\\\.time|unlink|unlist|unloadNamespace|unlockBinding|unname|unserialize|unsplit|untrace|untracemem|unz|upper\\\\.tri|url|UseMethod|utf8ToInt|validEnc|validUTF8|vapply|vector|Vectorize|version|warning|warningCondition|warnings|weekdays|weekdays\\\\.Date|weekdays\\\\.POSIXt|which|which\\\\.max|which\\\\.min|while|with|withAutoprint|withCallingHandlers|with\\\\.default|within|within\\\\.data\\\\.frame|within\\\\.list|withRestarts|withVisible|write|writeBin|writeChar|write\\\\.dcf|writeLines|xor|xpdrows\\\\.data\\\\.frame|xtfrm|xtfrm\\\\.AsIs|xtfrm\\\\.data\\\\.frame|xtfrm\\\\.Date|xtfrm\\\\.default|xtfrm\\\\.difftime|xtfrm\\\\.factor|xtfrm\\\\.numeric_version|xtfrm\\\\.POSIXct|xtfrm\\\\.POSIXlt|xzfile|zapsmall)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"support.function.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]},{\"begin\":\"\\\\b(abline|arrows|assocplot|axis|Axis|axis\\\\.Date|axis\\\\.POSIXct|axTicks|barplot|barplot\\\\.default|box|boxplot|boxplot\\\\.default|boxplot\\\\.matrix|bxp|cdplot|clip|close\\\\.screen|co\\\\.intervals|contour|contour\\\\.default|coplot|curve|dotchart|erase\\\\.screen|filled\\\\.contour|fourfoldplot|frame|grconvertX|grconvertY|grid|hist|hist\\\\.default|identify|image|image\\\\.default|layout|layout\\\\.show|lcm|legend|lines|lines\\\\.default|locator|matlines|matplot|matpoints|mosaicplot|mtext|pairs|pairs\\\\.default|panel\\\\.smooth|par|persp|pie|plot|plot\\\\.default|plot\\\\.design|plot\\\\.function|plot\\\\.new|plot\\\\.window|plot\\\\.xy|points|points\\\\.default|polygon|polypath|rasterImage|rect|rug|screen|segments|smoothScatter|spineplot|split\\\\.screen|stars|stem|strheight|stripchart|strwidth|sunflowerplot|symbols|text|text\\\\.default|title|xinch|xspline|xyinch|yinch)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"support.function.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]},{\"begin\":\"\\\\b(adjustcolor|as\\\\.graphicsAnnot|as\\\\.raster|axisTicks|bitmap|blues9|bmp|boxplot\\\\.stats|cairo_pdf|cairo_ps|cairoSymbolFont|check\\\\.options|chull|CIDFont|cm|cm\\\\.colors|col2rgb|colorConverter|colorRamp|colorRampPalette|colors|colorspaces|colours|contourLines|convertColor|densCols|dev2bitmap|devAskNewPage|dev\\\\.capabilities|dev\\\\.capture|dev\\\\.control|dev\\\\.copy|dev\\\\.copy2eps|dev\\\\.copy2pdf|dev\\\\.cur|dev\\\\.flush|dev\\\\.hold|deviceIsInteractive|dev\\\\.interactive|dev\\\\.list|dev\\\\.new|dev\\\\.next|dev\\\\.off|dev\\\\.prev|dev\\\\.print|dev\\\\.set|dev\\\\.size|embedFonts|extendrange|getGraphicsEvent|getGraphicsEventEnv|graphics\\\\.off|gray|gray\\\\.colors|grey|grey\\\\.colors|grSoftVersion|hcl|hcl\\\\.colors|hcl\\\\.pals|heat\\\\.colors|Hershey|hsv|is\\\\.raster|jpeg|make\\\\.rgb|n2mfrow|nclass\\\\.FD|nclass\\\\.scott|nclass\\\\.Sturges|palette|palette\\\\.colors|palette\\\\.pals|pdf|pdfFonts|pdf\\\\.options|pictex|png|postscript|postscriptFonts|ps\\\\.options|quartz|quartzFonts??|quartz\\\\.options|quartz\\\\.save|rainbow|recordGraphics|recordPlot|replayPlot|rgb|rgb2hsv|savePlot|setEPS|setGraphicsEventEnv|setGraphicsEventHandlers|setPS|svg|terrain\\\\.colors|tiff|topo\\\\.colors|trans3d|Type1Font|x11|X11|X11Fonts??|X11\\\\.options|xfig|xy\\\\.coords|xyTable|xyz\\\\.coords)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"support.function.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]},{\"begin\":\"\\\\b(addNextMethod|allNames|Arith|as|asMethodDefinition|assignClassDef|assignMethodsMetaData|balanceMethodsList|cacheGenericsMetaData|cacheMetaData|cacheMethod|callGeneric|callNextMethod|canCoerce|cbind2|checkAtAssignment|checkSlotAssignment|classesToAM|classLabel|classMetaName|className|coerce|Compare|completeClassDefinition|completeExtends|completeSubclasses|Complex|conformMethod|defaultDumpName|defaultPrototype|doPrimitiveMethod|dumpMethods??|el|elNamed|empty\\\\.dump|emptyMethodsList|evalOnLoad|evalqOnLoad|evalSource|existsFunction|existsMethod|extends|externalRefMethod|finalDefaultMethod|findClass|findFunction|findMethods??|findMethodSignatures|findUnique|fixPre1\\\\.8|formalArgs|functionBody|generic\\\\.skeleton|getAllSuperClasses|getClass|getClassDef|getClasses|getDataPart|getFunction|getGenerics??|getGroup|getGroupMembers|getLoadActions|getMethods??|getMethodsForDispatch|getMethodsMetaData|getPackageName|getRefClass|getSlots|getValidity|hasArg|hasLoadAction|hasMethods??|implicitGeneric|inheritedSlotNames|initFieldArgs|initialize|initRefFields|insertClassMethods|insertMethod|insertSource|is|isClass|isClassDef|isClassUnion|isGeneric|isGrammarSymbol|isGroup|isRematched|isSealedClass|isSealedMethod|isVirtualClass|isXS3Class|kronecker|languageEl|linearizeMlist|listFromMethods|listFromMlist|loadMethod|Logic|makeClassRepresentation|makeExtends|makeGeneric|makeMethodsList|makePrototypeFromClassDef|makeStandardGeneric|matchSignature|Math2??|mergeMethods|metaNameUndo|MethodAddCoerce|methodSignatureMatrix|method\\\\.skeleton|MethodsList|MethodsListSelect|methodsPackageMetaName|missingArg|multipleClasses|new|newBasic|newClassRepresentation|newEmptyObject|Ops|packageSlot|possibleExtends|prohibitGeneric|promptClass|promptMethods|prototype|Quote|rbind2|reconcilePropertiesAndPrototype|registerImplicitGenerics|rematchDefinition|removeClass|removeGeneric|removeMethods??|representation|requireMethods|resetClass|resetGeneric|S3Class|S3Part|sealClass|selectMethod|selectSuperClasses|setAs|setClass|setClassUnion|setDataPart|setGeneric|setGenericImplicit|setGroupGeneric|setIs|setLoadActions??|setMethod|setOldClass|setPackageName|setPrimitiveMethods|setRefClass|setReplaceMethod|setValidity|show|showClass|showDefault|showExtends|showMethods|showMlist|signature|SignatureMethod|sigToEnv|slot|slotNames|slotsFromS3|substituteDirect|substituteFunctionArgs|Summary|superClassDepth|testInheritedMethods|testVirtual|tryNew|unRematchDefinition|validObject|validSlotNames)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"support.function.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]},{\"begin\":\"\\\\b(acf|acf2AR|add1|addmargins|add\\\\.scope|aggregate|aggregate\\\\.data\\\\.frame|aggregate\\\\.ts|AIC|alias|anova|ansari\\\\.test|aov|approx|approxfun|ar|ar\\\\.burg|arima0??|arima0\\\\.diag|arima\\\\.sim|ARMAacf|ARMAtoMA|ar\\\\.mle|ar\\\\.ols|ar\\\\.yw|as\\\\.dendrogram|as\\\\.dist|as\\\\.formula|as\\\\.hclust|asOneSidedFormula|as\\\\.stepfun|as\\\\.ts|ave|bandwidth\\\\.kernel|bartlett\\\\.test|BIC|binomial|binom\\\\.test|biplot|Box\\\\.test|bw\\\\.bcv|bw\\\\.nrd0??|bw\\\\.SJ|bw\\\\.ucv|C|cancor|case\\\\.names|ccf|chisq\\\\.test|cmdscale|coef|coefficients|complete\\\\.cases|confint|confint\\\\.default|confint\\\\.lm|constrOptim|contrasts|contr\\\\.helmert|contr\\\\.poly|contr\\\\.SAS|contr\\\\.sum|contr\\\\.treatment|convolve|cooks\\\\.distance|cophenetic|cor|cor\\\\.test|cov|cov2cor|covratio|cov\\\\.wt|cpgram|cutree|cycle|D|dbeta|dbinom|dcauchy|dchisq|decompose|delete\\\\.response|deltat|dendrapply|density|density\\\\.default|deriv3??|deviance|dexp|df|DF2formula|dfbetas??|dffits|df\\\\.kernel|df\\\\.residual|dgamma|dgeom|dhyper|diffinv|dist|dlnorm|dlogis|dmultinom|dnbinom|dnorm|dpois|drop1|drop\\\\.scope|drop\\\\.terms|dsignrank|dt|dummy\\\\.coef|dummy\\\\.coef\\\\.lm|dunif|dweibull|dwilcox|ecdf|eff\\\\.aovlist|effects|embed|end|estVar|expand\\\\.model\\\\.frame|extractAIC|factanal|factor\\\\.scope|family|fft|filter|fisher\\\\.test|fitted|fitted\\\\.values|fivenum|fligner\\\\.test|formula|frequency|friedman\\\\.test|ftable|Gamma|gaussian|get_all_vars|getCall|getInitial|glm|glm\\\\.control|glm\\\\.fit|hasTsp|hat|hatvalues|hclust|heatmap|HoltWinters|influence|influence\\\\.measures|integrate|interaction\\\\.plot|inverse\\\\.gaussian|IQR|is\\\\.empty\\\\.model|is\\\\.leaf|is\\\\.mts|isoreg|is\\\\.stepfun|is\\\\.ts|is\\\\.tskernel|KalmanForecast|KalmanLike|KalmanRun|KalmanSmooth|kernapply|kernel|kmeans|knots|kruskal\\\\.test|ksmooth|ks\\\\.test|lag|lag\\\\.plot|line|lm|lm\\\\.fit|lm\\\\.influence|lm\\\\.wfit|loadings|loess|loess\\\\.control|loess\\\\.smooth|logLik|loglin|lowess|ls\\\\.diag|lsfit|ls\\\\.print|mad|mahalanobis|makeARIMA|make\\\\.link|makepredictcall|manova|mantelhaen\\\\.test|mauchly\\\\.test|mcnemar\\\\.test|median|median\\\\.default|medpolish|model\\\\.extract|model\\\\.frame|model\\\\.frame\\\\.default|model\\\\.matrix|model\\\\.matrix\\\\.default|model\\\\.matrix\\\\.lm|model\\\\.offset|model\\\\.response|model\\\\.tables|model\\\\.weights|monthplot|mood\\\\.test|mvfft|na\\\\.action|na\\\\.contiguous|na\\\\.exclude|na\\\\.fail|na\\\\.omit|na\\\\.pass|napredict|naprint|naresid|nextn|nlm|nlminb|nls|nls\\\\.control|NLSstAsymptotic|NLSstClosestX|NLSstLfAsymptote|NLSstRtAsymptote|nobs|numericDeriv|offset|oneway\\\\.test|optim|optimHess|optimise|optimize|order\\\\.dendrogram|pacf|p\\\\.adjust|p\\\\.adjust\\\\.methods|Pair|pairwise\\\\.prop\\\\.test|pairwise\\\\.table|pairwise\\\\.t\\\\.test|pairwise\\\\.wilcox\\\\.test|pbeta|pbinom|pbirthday|pcauchy|pchisq|pexp|pf|pgamma|pgeom|phyper|plclust|plnorm|plogis|plot\\\\.ecdf|plot\\\\.spec\\\\.coherency|plot\\\\.spec\\\\.phase|plot\\\\.stepfun|plot\\\\.ts|pnbinom|pnorm|poisson|poisson\\\\.test|polym??|power|power\\\\.anova\\\\.test|power\\\\.prop\\\\.test|power\\\\.t\\\\.test|ppoints|ppois|ppr|PP\\\\.test|prcomp|predict|predict\\\\.glm|predict\\\\.lm|preplot|princomp|printCoefmat|profile|proj|promax|prop\\\\.test|prop\\\\.trend\\\\.test|psignrank|pt|ptukey|punif|pweibull|pwilcox|qbeta|qbinom|qbirthday|qcauchy|qchisq|qexp|qf|qgamma|qgeom|qhyper|qlnorm|qlogis|qnbinom|qnorm|qpois|qqline|qqnorm|qqplot|qsignrank|qt|qtukey|quade\\\\.test|quantile|quasi|quasibinomial|quasipoisson|qunif|qweibull|qwilcox|r2dtable|rbeta|rbinom|rcauchy|rchisq|read\\\\.ftable|rect\\\\.hclust|reformulate|relevel|reorder|replications|reshape|resid|residuals|residuals\\\\.glm|residuals\\\\.lm|rexp|rf|rgamma|rgeom|rhyper|rlnorm|rlogis|rmultinom|rnbinom|rnorm|rpois|rsignrank|rstandard|rstudent|rt|runif|runmed|rweibull|rwilcox|rWishart|scatter\\\\.smooth|screeplot|sd|se\\\\.contrast|selfStart|setNames|shapiro\\\\.test|sigma|simulate|smooth|smoothEnds|smooth\\\\.spline|sortedXyData|spec\\\\.ar|spec\\\\.pgram|spec\\\\.taper|spectrum|spline|splinefunH??|SSasymp|SSasympOff|SSasympOrig|SSbiexp|SSD|SSfol|SSfpl|SSgompertz|SSlogis|SSmicmen|SSweibull|start|stat\\\\.anova|step|stepfun|stl|StructTS|summary\\\\.aov|summary\\\\.glm|summary\\\\.lm|summary\\\\.manova|summary\\\\.stepfun|supsmu|symnum|termplot|terms|terms\\\\.formula|time|toeplitz|ts|tsdiag|ts\\\\.intersect|tsp|ts\\\\.plot|tsSmooth|ts\\\\.union|t\\\\.test|TukeyHSD|uniroot|update|update\\\\.default|update\\\\.formula|var|variable\\\\.names|varimax|var\\\\.test|vcov|weighted\\\\.mean|weighted\\\\.residuals|weights|wilcox\\\\.test|window|write\\\\.ftable|xtabs)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"support.function.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]},{\"begin\":\"\\\\b(adist|alarm|apropos|aregexec|argsAnywhere|asDateBuilt|askYesNo|aspell|aspell_package_C_files|aspell_package_Rd_files|aspell_package_R_files|aspell_package_vignettes|aspell_write_personal_dictionary_file|as\\\\.person|as\\\\.personList|as\\\\.relistable|as\\\\.roman|assignInMyNamespace|assignInNamespace|available\\\\.packages|bibentry|browseEnv|browseURL|browseVignettes|bug\\\\.report|capture\\\\.output|changedFiles|charClass|checkCRAN|chooseBioCmirror|chooseCRANmirror|citation|cite|citeNatbib|citEntry|citFooter|citHeader|close\\\\.socket|combn|compareVersion|contrib\\\\.url|count\\\\.fields|create\\\\.post|data|dataentry|data\\\\.entry|de|debugcall|debugger|demo|de\\\\.ncols|de\\\\.restore|de\\\\.setup|download\\\\.file|download\\\\.packages|dump\\\\.frames|edit|emacs|example|file\\\\.edit|fileSnapshot|file_test|find|findLineNum|fix|fixInNamespace|flush\\\\.console|formatOL|formatUL|getAnywhere|getCRANmirrors|getFromNamespace|getParseData|getParseText|getS3method|getSrcDirectory|getSrcFilename|getSrcLocation|getSrcref|getTxtProgressBar|glob2rx|globalVariables|hasName|head|head\\\\.matrix|help|help\\\\.request|help\\\\.search|help\\\\.start|history|hsearch_db|hsearch_db_concepts|hsearch_db_keywords|installed\\\\.packages|install\\\\.packages|is\\\\.relistable|isS3method|isS3stdGeneric|limitedLabels|loadhistory|localeToCharset|lsf\\\\.str|ls\\\\.str|maintainer|make\\\\.packages\\\\.html|makeRweaveLatexCodeRunner|make\\\\.socket|memory\\\\.limit|memory\\\\.size|menu|methods|mirror2html|modifyList|new\\\\.packages|news|nsl|object\\\\.size|old\\\\.packages|osVersion|packageDate|packageDescription|packageName|package\\\\.skeleton|packageStatus|packageVersion|page|person|personList|pico|process\\\\.events|prompt|promptData|promptImport|promptPackage|rc\\\\.getOption|rc\\\\.options|rc\\\\.settings|rc\\\\.status|readCitationFile|read\\\\.csv2??|read\\\\.delim2??|read\\\\.DIF|read\\\\.fortran|read\\\\.fwf|read\\\\.socket|read\\\\.table|recover|relist|remove\\\\.packages|removeSource|Rprof|Rprofmem|RShowDoc|RSiteSearch|rtags|Rtangle|RtangleFinish|RtangleRuncode|RtangleSetup|RtangleWritedoc|RweaveChunkPrefix|RweaveEvalWithOpt|RweaveLatex|RweaveLatexFinish|RweaveLatexOptions|RweaveLatexSetup|RweaveLatexWritedoc|RweaveTryStop|savehistory|select\\\\.list|sessionInfo|setBreakpoint|setRepositories|setTxtProgressBar|stack|Stangle|str|strcapture|strOptions|summaryRprof|suppressForeignCheck|Sweave|SweaveHooks|SweaveSyntaxLatex|SweaveSyntaxNoweb|SweaveSyntConv|tail|tail\\\\.matrix|tar|timestamp|toBibtex|toLatex|txtProgressBar|type\\\\.convert|undebugcall|unstack|untar|unzip|update\\\\.packages|upgrade|URLdecode|URLencode|url\\\\.show|vi|View|vignette|warnErrList|write\\\\.csv2??|write\\\\.socket|write\\\\.table|xedit|xemacs|zip)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"support.function.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]}]},\"comments\":{\"patterns\":[{\"captures\":{\"1\":{\"name\":\"comment.line.pragma.r\"},\"2\":{\"name\":\"entity.name.pragma.name.r\"}},\"match\":\"^(#pragma[\\\\t ]+mark)[\\\\t ](.*)\",\"name\":\"comment.line.pragma-mark.r\"},{\"begin\":\"(^[\\\\t ]+)?(?=#)\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.whitespace.comment.leading.r\"}},\"end\":\"(?!\\\\G)\",\"patterns\":[{\"begin\":\"#\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.comment.r\"}},\"end\":\"\\\\n\",\"name\":\"comment.line.number-sign.r\"}]}]},\"constants\":{\"patterns\":[{\"match\":\"\\\\b(pi|letters|LETTERS|month\\\\.abb|month\\\\.name)\\\\b\",\"name\":\"support.constant.misc.r\"},{\"match\":\"\\\\b(TRUE|FALSE|NULL|NA|NA_integer_|NA_real_|NA_complex_|NA_character_|Inf|NaN)\\\\b\",\"name\":\"constant.language.r\"},{\"match\":\"\\\\b0([Xx])\\\\h+i\\\\b\",\"name\":\"constant.numeric.imaginary.hexadecimal.r\"},{\"match\":\"\\\\b[0-9]+\\\\.?[0-9]*(?:([Ee])([-+])?[0-9]+)?i\\\\b\",\"name\":\"constant.numeric.imaginary.decimal.r\"},{\"match\":\"\\\\.[0-9]+(?:([Ee])([-+])?[0-9]+)?i\\\\b\",\"name\":\"constant.numeric.imaginary.decimal.r\"},{\"match\":\"\\\\b0([Xx])\\\\h+L\\\\b\",\"name\":\"constant.numeric.integer.hexadecimal.r\"},{\"match\":\"\\\\b[0-9]+\\\\.?[0-9]*(?:([Ee])([-+])?[0-9]+)?L\\\\b\",\"name\":\"constant.numeric.integer.decimal.r\"},{\"match\":\"\\\\b0([Xx])\\\\h+\\\\b\",\"name\":\"constant.numeric.float.hexadecimal.r\"},{\"match\":\"\\\\b[0-9]+\\\\.?[0-9]*(?:([Ee])([-+])?[0-9]+)?\\\\b\",\"name\":\"constant.numeric.float.decimal.r\"},{\"match\":\"\\\\.[0-9]+(?:([Ee])([-+])?[0-9]+)?\\\\b\",\"name\":\"constant.numeric.float.decimal.r\"}]},\"function-call-arguments\":{\"patterns\":[{\"match\":\"(?:[.A-Z_a-z][.\\\\w]*|`[^`]+`)(?=\\\\s*=[^=])\",\"name\":\"variable.parameter.function-call.r\"},{\"begin\":\"(?==)\",\"end\":\"(?=[),])\",\"patterns\":[{\"include\":\"source.r\"}]},{\"match\":\",\",\"name\":\"punctuation.separator.parameters.r\"},{\"include\":\"source.r\"}]},\"function-calls\":{\"begin\":\"(?:[.A-Z_a-z][.\\\\w]*|`[^`]+`)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]},\"function-declarations\":{\"patterns\":[{\"begin\":\"([.A-Z_a-z][.\\\\w]*|`[^`]+`)\\\\s*(<?<-|=(?!=))\\\\s*\\\\b(function)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"entity.name.function.r\"},\"2\":{\"name\":\"keyword.operator.assignment.r\"},\"3\":{\"name\":\"keyword.control.r\"},\"4\":{\"name\":\"punctuation.definition.parameters.begin.r\"}},\"contentName\":\"meta.function.parameters.r\",\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.parameters.end.r\"}},\"name\":\"meta.function.r\",\"patterns\":[{\"include\":\"#comments\"},{\"match\":\"[.A-Z_a-z][.\\\\w]*|`[^`]+`\",\"name\":\"variable.parameter.function.language.r\"},{\"begin\":\"(?==)\",\"end\":\"(?=[),])\",\"patterns\":[{\"include\":\"source.r\"}]},{\"match\":\",\",\"name\":\"punctuation.separator.parameters.r\"}]}]},\"keywords\":{\"patterns\":[{\"match\":\"\\\\bif\\\\b(?=\\\\s*\\\\()\",\"name\":\"keyword.control.conditional.if.r\"},{\"match\":\"\\\\belse\\\\b\",\"name\":\"keyword.control.conditional.else.r\"},{\"match\":\"\\\\bbreak\\\\b\",\"name\":\"keyword.control.flow.break.r\"},{\"match\":\"\\\\bnext\\\\b\",\"name\":\"keyword.control.flow.continue.r\"},{\"match\":\"\\\\breturn(?=\\\\s*\\\\()\",\"name\":\"keyword.control.flow.return.r\"},{\"match\":\"\\\\brepeat\\\\b\",\"name\":\"keyword.control.loop.repeat.r\"},{\"match\":\"\\\\bfor\\\\b(?=\\\\s*\\\\()\",\"name\":\"keyword.control.loop.for.r\"},{\"match\":\"\\\\bwhile\\\\b(?=\\\\s*\\\\()\",\"name\":\"keyword.control.loop.while.r\"},{\"match\":\"\\\\bin\\\\b\",\"name\":\"keyword.operator.word.r\"}]},\"lambda-functions\":{\"patterns\":[{\"begin\":\"\\\\b(function)\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"keyword.control.r\"},\"2\":{\"name\":\"punctuation.definition.parameters.begin.r\"}},\"contentName\":\"meta.function.parameters.r\",\"end\":\"\\\\)\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.parameters.end.r\"}},\"name\":\"meta.function.r\",\"patterns\":[{\"include\":\"#comments\"},{\"match\":\"[.A-Z_a-z][.\\\\w]*|`[^`]+`\",\"name\":\"variable.parameter.function.language.r\"},{\"begin\":\"(?==)\",\"end\":\"(?=[),])\",\"patterns\":[{\"include\":\"source.r\"}]},{\"match\":\",\",\"name\":\"punctuation.separator.parameters.r\"}]}]},\"operators\":{\"patterns\":[{\"match\":\"%[*/ox]%\",\"name\":\"keyword.operator.arithmetic.r\"},{\"match\":\"(<<-|->>)\",\"name\":\"keyword.operator.assignment.r\"},{\"match\":\"%(between|chin|do|dopar|in|like|\\\\+replace|[+:]|T>|<>|[$>])%\",\"name\":\"keyword.operator.other.r\"},{\"match\":\"\\\\.\\\\.\\\\.\",\"name\":\"keyword.other.r\"},{\"match\":\":::?\",\"name\":\"punctuation.accessor.colons.r\"},{\"match\":\"(%%|\\\\*\\\\*)\",\"name\":\"keyword.operator.arithmetic.r\"},{\"match\":\"(<-|->)\",\"name\":\"keyword.operator.assignment.r\"},{\"match\":\"\\\\|>\",\"name\":\"keyword.operator.assignment.redirection.r\"},{\"match\":\"(==|!=|<>|<=?|>=?)\",\"name\":\"keyword.operator.comparison.r\"},{\"match\":\"(&&?|\\\\|\\\\|?)\",\"name\":\"keyword.operator.logical.r\"},{\"match\":\":=\",\"name\":\"keyword.operator.other.r\"},{\"match\":\"[-*+/^]\",\"name\":\"keyword.operator.arithmetic.r\"},{\"match\":\"=\",\"name\":\"keyword.operator.assignment.r\"},{\"match\":\"!\",\"name\":\"keyword.operator.logical.r\"},{\"match\":\"[:@~]\",\"name\":\"keyword.other.r\"},{\"match\":\";\",\"name\":\"punctuation.terminator.semicolon.r\"}]},\"roxygen\":{\"patterns\":[{\"begin\":\"^\\\\s*(#')\\\\s*\",\"beginCaptures\":{\"1\":{\"name\":\"punctuation.definition.comment.r\"}},\"end\":\"$\\\\n?\",\"name\":\"comment.line.roxygen.r\",\"patterns\":[{\"captures\":{\"1\":{\"name\":\"keyword.other.r\"},\"2\":{\"name\":\"variable.parameter.r\"}},\"match\":\"(@param)\\\\s*([.A-Z_a-z][.\\\\w]*|`[^`]+`)\"},{\"match\":\"@[0-9A-Za-z]+\",\"name\":\"keyword.other.r\"}]}]},\"storage-type\":{\"patterns\":[{\"begin\":\"\\\\b(character|complex|double|expression|integer|list|logical|numeric|single|raw|pairlist)\\\\b\\\\s*(\\\\()\",\"beginCaptures\":{\"1\":{\"name\":\"storage.type.r\"},\"2\":{\"name\":\"punctuation.definition.arguments.begin.r\"}},\"contentName\":\"meta.function-call.arguments.r\",\"end\":\"(\\\\))\",\"endCaptures\":{\"1\":{\"name\":\"punctuation.definition.arguments.end.r\"}},\"name\":\"meta.function-call.r\",\"patterns\":[{\"include\":\"#function-call-arguments\"}]}]},\"strings\":{\"patterns\":[{\"begin\":\"[Rr]\\\"(-*)\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.begin.r\"}},\"end\":\"]\\\\1\\\"\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.end.r\"}},\"name\":\"string.quoted.double.raw.r\"},{\"begin\":\"[Rr]'(-*)\\\\[\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.begin.r\"}},\"end\":\"]\\\\1'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.end.r\"}},\"name\":\"string.quoted.single.raw.r\"},{\"begin\":\"[Rr]\\\"(-*)\\\\{\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.begin.r\"}},\"end\":\"}\\\\1\\\"\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.end.r\"}},\"name\":\"string.quoted.double.raw.r\"},{\"begin\":\"[Rr]'(-*)\\\\{\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.begin.r\"}},\"end\":\"}\\\\1'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.end.r\"}},\"name\":\"string.quoted.single.raw.r\"},{\"begin\":\"[Rr]\\\"(-*)\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.begin.r\"}},\"end\":\"\\\\)\\\\1\\\"\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.end.r\"}},\"name\":\"string.quoted.double.raw.r\"},{\"begin\":\"[Rr]'(-*)\\\\(\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.begin.r\"}},\"end\":\"\\\\)\\\\1'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.raw.end.r\"}},\"name\":\"string.quoted.single.raw.r\"},{\"begin\":\"\\\"\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.r\"}},\"end\":\"\\\"\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.r\"}},\"name\":\"string.quoted.double.r\",\"patterns\":[{\"match\":\"\\\\\\\\.\",\"name\":\"constant.character.escape.r\"}]},{\"begin\":\"'\",\"beginCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.begin.r\"}},\"end\":\"'\",\"endCaptures\":{\"0\":{\"name\":\"punctuation.definition.string.end.r\"}},\"name\":\"string.quoted.single.r\",\"patterns\":[{\"match\":\"\\\\\\\\.\",\"name\":\"constant.character.escape.r\"}]}]}},\"scopeName\":\"source.r\"}"));

var r = [
lang
];

function Tabs$1($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    fluid = false,
    // Root
    base = "w-full",
    classes = "",
    // List
    listBase = "flex",
    listJustify = "justify-start",
    listBorder = "border-b-[1px] border-surface-200-800",
    listMargin = "mb-4",
    listGap = "gap-2",
    listClasses = "",
    // Content
    contentBase = "",
    contentClasses = "",
    // Snippets
    list,
    content,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  setTabContext({
    get api() {
      return api;
    },
    get fluid() {
      return fluid;
    }
  });
  $$payload.out += `<div${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify$3(base)} ${stringify$3(classes)}`,
      "data-testid": "tabs"
    },
    null
  )}><div${spread_attributes(
    {
      ...api.getListProps(),
      class: `${stringify$3(listBase)} ${stringify$3(listJustify)} ${stringify$3(listBorder)} ${stringify$3(listMargin)} ${stringify$3(listGap)} ${stringify$3(listClasses)}`,
      "data-testid": "tabs-list"
    },
    null
  )}>`;
  list?.($$payload);
  $$payload.out += `<!----></div> <div${attr_class(`${stringify$3(contentBase)} ${stringify$3(contentClasses)}`)} data-testid="tabs-content">`;
  content?.($$payload);
  $$payload.out += `<!----></div></div>`;
  pop();
}
function TabsControl($$payload, $$props) {
  push();
  const {
    // Root
    base = "border-b-[1px] border-transparent",
    padding = "pb-2",
    translateX = "translate-y-[1px]",
    classes = "",
    // Label
    labelBase = "btn hover:preset-tonal-primary",
    labelClasses = "",
    // State
    stateInactive = "[&:not(:hover)]:opacity-50",
    stateActive = "border-b-surface-950-50 opacity-100",
    stateLabelInactive = "",
    stateLabelActive = "",
    // Snippets
    lead,
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getTabContext();
  const state = ctx.api.getTriggerState(zagProps);
  const rxActive = state.selected ? stateActive : stateInactive;
  const rxLabelActive = state.selected ? stateLabelActive : stateLabelInactive;
  const commonWidth = ctx.fluid ? "100%" : "";
  $$payload.out += `<button${spread_attributes(
    {
      ...ctx.api.getTriggerProps(zagProps),
      class: `${stringify$3(base)} ${stringify$3(padding)} ${stringify$3(translateX)} ${stringify$3(rxActive)} ${stringify$3(classes)}`,
      "data-testid": "tabs-control"
    },
    null,
    void 0,
    { width: commonWidth }
  )}><div${attr_class(`${stringify$3(labelBase)} ${stringify$3(rxLabelActive)} ${stringify$3(labelClasses)}`)} data-testid="tabs-control-label"${attr_style("", { width: commonWidth })}>`;
  if (lead) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span>`;
    lead($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <span>`;
  children?.($$payload);
  $$payload.out += `<!----></span></div></button>`;
  pop();
}
function TabsPanel($$payload, $$props) {
  push();
  const {
    // Root
    base = "",
    classes = "",
    // Children
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getTabContext();
  $$payload.out += `<div${spread_attributes(
    {
      ...ctx.api.getContentProps(zagProps),
      class: `${stringify$3(base)} ${stringify$3(classes)}`,
      "data-testid": "tabs-panel"
    },
    null
  )}>`;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
  pop();
}
const Tabs = /* @__PURE__ */ Object.assign(Tabs$1, { Control: TabsControl, Panel: TabsPanel });
const shiki = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  themes: [themeDarkPlus],
  langs: [console$1, python, r]
});
function CodeBlock($$payload, $$props) {
  push();
  let {
    code = "",
    lang = "console",
    theme = "dark-plus"
  } = $$props;
  const generatedHtml = shiki.codeToHtml(code, { lang, theme });
  $$payload.out += `<div class="code-block">${html$4(generatedHtml)}</div>`;
  pop();
}
function TabItem($$payload, $$props) {
  push();
  let { group = "", value = "", children } = $$props;
  let active = group === value;
  $$payload.out += `<button data-scope="tabs" data-part="trigger" role="tab" type="button" dir="ltr" data-orientation="horizontal" data-value="Python" aria-selected="true" data-selected=""${attr("aria-controls", `tabs:s5:content-${stringify$3(value)}`)} data-ownedby="tabs:s5:list"${attr("id", `tabs:s5:trigger-${stringify$3(value)}`)}${attr_class(`border-b-[1px] border-transparent pb-2 translate-y-[1px] ${stringify$3(active ? "border-b-surface-950-50 opacity-100" : "[&amp;:not(:hover)]:opacity-50")}`)} data-testid="tabs-control"><div class="btn hover:preset-tonal-primary" data-testid="tabs-control-label"><span>`;
  children?.($$payload);
  $$payload.out += `<!----></span></div></button>`;
  bind_props($$props, { group });
  pop();
}

export { CodeBlock as C, Tabs as T, TabItem as a };
//# sourceMappingURL=TabItem-DPoodVM7.js.map
