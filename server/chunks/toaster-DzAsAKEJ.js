import { r as raf, g as getDocument, a as getWindow, i as isShadowRoot, b as addDomEvent, c as isTouchDevice, d as getEventTarget, e as callAll, f as isFocusable, h as isContextMenuEvent, j as isHTMLElement, k as contains, l as getNearestOverflowAncestor, m as isFunction, w as warn, n as waitForElements, s as setStyle, o as createMachine, p as createAnatomy, M as MAX_Z_INDEX, q as createGuards, t as setRafTimeout, u as ensureProps, v as dataAttr, x as compact, y as runIfFn, z as uuid } from './index-BB9JrA1L.js';

// src/index.ts

// src/frame-utils.ts
function getWindowFrames(win) {
  const frames = {
    each(cb) {
      for (let i = 0; i < win.frames?.length; i += 1) {
        const frame = win.frames[i];
        if (frame) cb(frame);
      }
    },
    addEventListener(event, listener, options) {
      frames.each((frame) => {
        try {
          frame.document.addEventListener(event, listener, options);
        } catch {
        }
      });
      return () => {
        try {
          frames.removeEventListener(event, listener, options);
        } catch {
        }
      };
    },
    removeEventListener(event, listener, options) {
      frames.each((frame) => {
        try {
          frame.document.removeEventListener(event, listener, options);
        } catch {
        }
      });
    }
  };
  return frames;
}
function getParentWindow(win) {
  const parent = win.frameElement != null ? win.parent : null;
  return {
    addEventListener: (event, listener, options) => {
      try {
        parent?.addEventListener(event, listener, options);
      } catch {
      }
      return () => {
        try {
          parent?.removeEventListener(event, listener, options);
        } catch {
        }
      };
    },
    removeEventListener: (event, listener, options) => {
      try {
        parent?.removeEventListener(event, listener, options);
      } catch {
      }
    }
  };
}

// src/index.ts
var POINTER_OUTSIDE_EVENT = "pointerdown.outside";
var FOCUS_OUTSIDE_EVENT = "focus.outside";
function isComposedPathFocusable(composedPath) {
  for (const node of composedPath) {
    if (isHTMLElement(node) && isFocusable(node)) return true;
  }
  return false;
}
var isPointerEvent = (event) => "clientY" in event;
function isEventPointWithin(node, event) {
  if (!isPointerEvent(event) || !node) return false;
  const rect = node.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  return rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
}
function isPointInRect(rect, point) {
  return rect.y <= point.y && point.y <= rect.y + rect.height && rect.x <= point.x && point.x <= rect.x + rect.width;
}
function isEventWithinScrollbar(event, ancestor) {
  if (!ancestor || !isPointerEvent(event)) return false;
  const isScrollableY = ancestor.scrollHeight > ancestor.clientHeight;
  const onScrollbarY = isScrollableY && event.clientX > ancestor.offsetLeft + ancestor.clientWidth;
  const isScrollableX = ancestor.scrollWidth > ancestor.clientWidth;
  const onScrollbarX = isScrollableX && event.clientY > ancestor.offsetTop + ancestor.clientHeight;
  const rect = {
    x: ancestor.offsetLeft,
    y: ancestor.offsetTop,
    width: ancestor.clientWidth + (isScrollableY ? 16 : 0),
    height: ancestor.clientHeight + (isScrollableX ? 16 : 0)
  };
  const point = {
    x: event.clientX,
    y: event.clientY
  };
  if (!isPointInRect(rect, point)) return false;
  return onScrollbarY || onScrollbarX;
}
function trackInteractOutsideImpl(node, options) {
  const { exclude, onFocusOutside, onPointerDownOutside, onInteractOutside, defer } = options;
  if (!node) return;
  const doc = getDocument(node);
  const win = getWindow(node);
  const frames = getWindowFrames(win);
  const parentWin = getParentWindow(win);
  function isEventOutside(event, target) {
    if (!isHTMLElement(target)) return false;
    if (!target.isConnected) return false;
    if (contains(node, target)) return false;
    if (isEventPointWithin(node, event)) return false;
    const triggerEl = doc.querySelector(`[aria-controls="${node.id}"]`);
    if (triggerEl) {
      const triggerAncestor = getNearestOverflowAncestor(triggerEl);
      if (isEventWithinScrollbar(event, triggerAncestor)) return false;
    }
    const nodeAncestor = getNearestOverflowAncestor(node);
    if (isEventWithinScrollbar(event, nodeAncestor)) return false;
    return !exclude?.(target);
  }
  const pointerdownCleanups = /* @__PURE__ */ new Set();
  const isInShadowRoot = isShadowRoot(node?.getRootNode());
  function onPointerDown(event) {
    function handler(clickEvent) {
      const func = defer && !isTouchDevice() ? raf : (v) => v();
      const evt = clickEvent ?? event;
      const composedPath = evt?.composedPath?.() ?? [evt?.target];
      func(() => {
        const target = isInShadowRoot ? composedPath[0] : getEventTarget(event);
        if (!node || !isEventOutside(event, target)) return;
        if (onPointerDownOutside || onInteractOutside) {
          const handler2 = callAll(onPointerDownOutside, onInteractOutside);
          node.addEventListener(POINTER_OUTSIDE_EVENT, handler2, { once: true });
        }
        fireCustomEvent(node, POINTER_OUTSIDE_EVENT, {
          bubbles: false,
          cancelable: true,
          detail: {
            originalEvent: evt,
            contextmenu: isContextMenuEvent(evt),
            focusable: isComposedPathFocusable(composedPath),
            target
          }
        });
      });
    }
    if (event.pointerType === "touch") {
      pointerdownCleanups.forEach((fn) => fn());
      pointerdownCleanups.add(addDomEvent(doc, "click", handler, { once: true }));
      pointerdownCleanups.add(parentWin.addEventListener("click", handler, { once: true }));
      pointerdownCleanups.add(frames.addEventListener("click", handler, { once: true }));
    } else {
      handler();
    }
  }
  const cleanups = /* @__PURE__ */ new Set();
  const timer = setTimeout(() => {
    cleanups.add(addDomEvent(doc, "pointerdown", onPointerDown, true));
    cleanups.add(parentWin.addEventListener("pointerdown", onPointerDown, true));
    cleanups.add(frames.addEventListener("pointerdown", onPointerDown, true));
  }, 0);
  function onFocusin(event) {
    const func = defer ? raf : (v) => v();
    func(() => {
      const target = getEventTarget(event);
      if (!node || !isEventOutside(event, target)) return;
      if (onFocusOutside || onInteractOutside) {
        const handler = callAll(onFocusOutside, onInteractOutside);
        node.addEventListener(FOCUS_OUTSIDE_EVENT, handler, { once: true });
      }
      fireCustomEvent(node, FOCUS_OUTSIDE_EVENT, {
        bubbles: false,
        cancelable: true,
        detail: {
          originalEvent: event,
          contextmenu: false,
          focusable: isFocusable(target),
          target
        }
      });
    });
  }
  if (!isTouchDevice()) {
    cleanups.add(addDomEvent(doc, "focusin", onFocusin, true));
    cleanups.add(parentWin.addEventListener("focusin", onFocusin, true));
    cleanups.add(frames.addEventListener("focusin", onFocusin, true));
  }
  return () => {
    clearTimeout(timer);
    pointerdownCleanups.forEach((fn) => fn());
    cleanups.forEach((fn) => fn());
  };
}
function trackInteractOutside(nodeOrFn, options) {
  const { defer } = options;
  const func = defer ? raf : (v) => v();
  const cleanups = [];
  cleanups.push(
    func(() => {
      const node = typeof nodeOrFn === "function" ? nodeOrFn() : nodeOrFn;
      cleanups.push(trackInteractOutsideImpl(node, options));
    })
  );
  return () => {
    cleanups.forEach((fn) => fn?.());
  };
}
function fireCustomEvent(el, type, init) {
  const win = el.ownerDocument.defaultView || window;
  const event = new win.CustomEvent(type, init);
  return el.dispatchEvent(event);
}

// src/dismissable-layer.ts
function trackEscapeKeydown(node, fn) {
  const handleKeyDown = (event) => {
    if (event.key !== "Escape") return;
    if (event.isComposing) return;
    fn?.(event);
  };
  return addDomEvent(getDocument(node), "keydown", handleKeyDown, { capture: true });
}
var layerStack = {
  layers: [],
  branches: [],
  count() {
    return this.layers.length;
  },
  pointerBlockingLayers() {
    return this.layers.filter((layer) => layer.pointerBlocking);
  },
  topMostPointerBlockingLayer() {
    return [...this.pointerBlockingLayers()].slice(-1)[0];
  },
  hasPointerBlockingLayer() {
    return this.pointerBlockingLayers().length > 0;
  },
  isBelowPointerBlockingLayer(node) {
    const index = this.indexOf(node);
    const highestBlockingIndex = this.topMostPointerBlockingLayer() ? this.indexOf(this.topMostPointerBlockingLayer()?.node) : -1;
    return index < highestBlockingIndex;
  },
  isTopMost(node) {
    const layer = this.layers[this.count() - 1];
    return layer?.node === node;
  },
  getNestedLayers(node) {
    return Array.from(this.layers).slice(this.indexOf(node) + 1);
  },
  isInNestedLayer(node, target) {
    return this.getNestedLayers(node).some((layer) => contains(layer.node, target));
  },
  isInBranch(target) {
    return Array.from(this.branches).some((branch) => contains(branch, target));
  },
  add(layer) {
    const num = this.layers.push(layer);
    layer.node.style.setProperty("--layer-index", `${num}`);
  },
  addBranch(node) {
    this.branches.push(node);
  },
  remove(node) {
    const index = this.indexOf(node);
    if (index < 0) return;
    if (index < this.count() - 1) {
      const _layers = this.getNestedLayers(node);
      _layers.forEach((layer) => layer.dismiss());
    }
    this.layers.splice(index, 1);
    node.style.removeProperty("--layer-index");
  },
  removeBranch(node) {
    const index = this.branches.indexOf(node);
    if (index >= 0) this.branches.splice(index, 1);
  },
  indexOf(node) {
    return this.layers.findIndex((layer) => layer.node === node);
  },
  dismiss(node) {
    this.layers[this.indexOf(node)]?.dismiss();
  },
  clear() {
    this.remove(this.layers[0].node);
  }
};
var originalBodyPointerEvents;
function assignPointerEventToLayers() {
  layerStack.layers.forEach(({ node }) => {
    node.style.pointerEvents = layerStack.isBelowPointerBlockingLayer(node) ? "none" : "auto";
  });
}
function clearPointerEvent(node) {
  node.style.pointerEvents = "";
}
function disablePointerEventsOutside(node, persistentElements) {
  const doc = getDocument(node);
  const cleanups = [];
  if (layerStack.hasPointerBlockingLayer() && !doc.body.hasAttribute("data-inert")) {
    originalBodyPointerEvents = document.body.style.pointerEvents;
    queueMicrotask(() => {
      doc.body.style.pointerEvents = "none";
      doc.body.setAttribute("data-inert", "");
    });
  }
  if (persistentElements) {
    const persistedCleanup = waitForElements(persistentElements, (el) => {
      cleanups.push(setStyle(el, { pointerEvents: "auto" }));
    });
    cleanups.push(persistedCleanup);
  }
  return () => {
    if (layerStack.hasPointerBlockingLayer()) return;
    queueMicrotask(() => {
      doc.body.style.pointerEvents = originalBodyPointerEvents;
      doc.body.removeAttribute("data-inert");
      if (doc.body.style.length === 0) doc.body.removeAttribute("style");
    });
    cleanups.forEach((fn) => fn());
  };
}

// src/dismissable-layer.ts
function trackDismissableElementImpl(node, options) {
  const { warnOnMissingNode = true } = options;
  if (warnOnMissingNode && !node) {
    warn("[@zag-js/dismissable] node is `null` or `undefined`");
    return;
  }
  if (!node) {
    return;
  }
  const { onDismiss, pointerBlocking, exclude: excludeContainers, debug } = options;
  const layer = { dismiss: onDismiss, node, pointerBlocking };
  layerStack.add(layer);
  assignPointerEventToLayers();
  function onPointerDownOutside(event) {
    const target = getEventTarget(event.detail.originalEvent);
    if (layerStack.isBelowPointerBlockingLayer(node) || layerStack.isInBranch(target)) return;
    options.onPointerDownOutside?.(event);
    options.onInteractOutside?.(event);
    if (event.defaultPrevented) return;
    if (debug) {
      console.log("onPointerDownOutside:", event.detail.originalEvent);
    }
    onDismiss?.();
  }
  function onFocusOutside(event) {
    const target = getEventTarget(event.detail.originalEvent);
    if (layerStack.isInBranch(target)) return;
    options.onFocusOutside?.(event);
    options.onInteractOutside?.(event);
    if (event.defaultPrevented) return;
    if (debug) {
      console.log("onFocusOutside:", event.detail.originalEvent);
    }
    onDismiss?.();
  }
  function onEscapeKeyDown(event) {
    if (!layerStack.isTopMost(node)) return;
    options.onEscapeKeyDown?.(event);
    if (!event.defaultPrevented && onDismiss) {
      event.preventDefault();
      onDismiss();
    }
  }
  function exclude(target) {
    if (!node) return false;
    const containers = typeof excludeContainers === "function" ? excludeContainers() : excludeContainers;
    const _containers = Array.isArray(containers) ? containers : [containers];
    const persistentElements = options.persistentElements?.map((fn) => fn()).filter(isHTMLElement);
    if (persistentElements) _containers.push(...persistentElements);
    return _containers.some((node2) => contains(node2, target)) || layerStack.isInNestedLayer(node, target);
  }
  const cleanups = [
    pointerBlocking ? disablePointerEventsOutside(node, options.persistentElements) : void 0,
    trackEscapeKeydown(node, onEscapeKeyDown),
    trackInteractOutside(node, { exclude, onFocusOutside, onPointerDownOutside, defer: options.defer })
  ];
  return () => {
    layerStack.remove(node);
    assignPointerEventToLayers();
    clearPointerEvent(node);
    cleanups.forEach((fn) => fn?.());
  };
}
function trackDismissableElement(nodeOrFn, options) {
  const { defer } = options;
  const func = defer ? raf : (v) => v();
  const cleanups = [];
  cleanups.push(
    func(() => {
      const node = isFunction(nodeOrFn) ? nodeOrFn() : nodeOrFn;
      cleanups.push(trackDismissableElementImpl(node, options));
    })
  );
  return () => {
    cleanups.forEach((fn) => fn?.());
  };
}
function trackDismissableBranch(nodeOrFn, options = {}) {
  const { defer } = options;
  const func = defer ? raf : (v) => v();
  const cleanups = [];
  cleanups.push(
    func(() => {
      const node = isFunction(nodeOrFn) ? nodeOrFn() : nodeOrFn;
      if (!node) {
        warn("[@zag-js/dismissable] branch node is `null` or `undefined`");
        return;
      }
      layerStack.addBranch(node);
      cleanups.push(() => {
        layerStack.removeBranch(node);
      });
    })
  );
  return () => {
    cleanups.forEach((fn) => fn?.());
  };
}

// src/toast-group.connect.ts
var anatomy = createAnatomy("toast").parts(
  "group",
  "root",
  "title",
  "description",
  "actionTrigger",
  "closeTrigger"
);
var parts = anatomy.build();

// src/toast.dom.ts
var getRegionId = (placement) => `toast-group:${placement}`;
var getRegionEl = (ctx, placement) => ctx.getById(`toast-group:${placement}`);
var getRootId = (ctx) => `toast:${ctx.id}`;
var getRootEl = (ctx) => ctx.getById(getRootId(ctx));
var getTitleId = (ctx) => `toast:${ctx.id}:title`;
var getDescriptionId = (ctx) => `toast:${ctx.id}:description`;
var getCloseTriggerId = (ctx) => `toast${ctx.id}:close`;
var defaultTimeouts = {
  info: 5e3,
  error: 5e3,
  success: 2e3,
  loading: Infinity,
  DEFAULT: 5e3
};
function getToastDuration(duration, type) {
  return duration ?? defaultTimeouts[type] ?? defaultTimeouts.DEFAULT;
}
var getOffsets = (offsets) => typeof offsets === "string" ? { left: offsets, right: offsets, bottom: offsets, top: offsets } : offsets;
function getGroupPlacementStyle(service, placement) {
  const { prop, computed, context } = service;
  const { offsets, gap } = prop("store").attrs;
  const heights = context.get("heights");
  const computedOffset = getOffsets(offsets);
  const rtl = prop("dir") === "rtl";
  const computedPlacement = placement.replace("-start", rtl ? "-right" : "-left").replace("-end", rtl ? "-left" : "-right");
  const isRighty = computedPlacement.includes("right");
  const isLefty = computedPlacement.includes("left");
  const styles = {
    position: "fixed",
    pointerEvents: computed("count") > 0 ? void 0 : "none",
    display: "flex",
    flexDirection: "column",
    "--gap": `${gap}px`,
    "--first-height": `${heights[0]?.height || 0}px`,
    zIndex: MAX_Z_INDEX
  };
  let alignItems = "center";
  if (isRighty) alignItems = "flex-end";
  if (isLefty) alignItems = "flex-start";
  styles.alignItems = alignItems;
  if (computedPlacement.includes("top")) {
    const offset = computedOffset.top;
    styles.top = `max(env(safe-area-inset-top, 0px), ${offset})`;
  }
  if (computedPlacement.includes("bottom")) {
    const offset = computedOffset.bottom;
    styles.bottom = `max(env(safe-area-inset-bottom, 0px), ${offset})`;
  }
  if (!computedPlacement.includes("left")) {
    const offset = computedOffset.right;
    styles.insetInlineEnd = `calc(env(safe-area-inset-right, 0px) + ${offset})`;
  }
  if (!computedPlacement.includes("right")) {
    const offset = computedOffset.left;
    styles.insetInlineStart = `calc(env(safe-area-inset-left, 0px) + ${offset})`;
  }
  return styles;
}
function getPlacementStyle(service, visible) {
  const { prop, context, computed } = service;
  const parent = prop("parent");
  const placement = parent.computed("placement");
  const { gap } = parent.prop("store").attrs;
  const [side] = placement.split("-");
  const mounted = context.get("mounted");
  const remainingTime = context.get("remainingTime");
  const height = computed("height");
  const frontmost = computed("frontmost");
  const sibling = !frontmost;
  const overlap = !prop("stacked");
  const stacked = prop("stacked");
  const type = prop("type");
  const duration = type === "loading" ? Number.MAX_SAFE_INTEGER : remainingTime;
  const offset = computed("heightIndex") * gap + computed("heightBefore");
  const styles = {
    position: "absolute",
    pointerEvents: "auto",
    "--opacity": "0",
    "--remove-delay": `${prop("removeDelay")}ms`,
    "--duration": `${duration}ms`,
    "--initial-height": `${height}px`,
    "--offset": `${offset}px`,
    "--index": prop("index"),
    "--z-index": computed("zIndex"),
    "--lift-amount": "calc(var(--lift) * var(--gap))",
    "--y": "100%",
    "--x": "0"
  };
  const assign = (overrides) => Object.assign(styles, overrides);
  if (side === "top") {
    assign({
      top: "0",
      "--sign": "-1",
      "--y": "-100%",
      "--lift": "1"
    });
  } else if (side === "bottom") {
    assign({
      bottom: "0",
      "--sign": "1",
      "--y": "100%",
      "--lift": "-1"
    });
  }
  if (mounted) {
    assign({
      "--y": "0",
      "--opacity": "1"
    });
    if (stacked) {
      assign({
        "--y": "calc(var(--lift) * var(--offset))",
        "--height": "var(--initial-height)"
      });
    }
  }
  if (!visible) {
    assign({
      "--opacity": "0",
      pointerEvents: "none"
    });
  }
  if (sibling && overlap) {
    assign({
      "--base-scale": "var(--index) * 0.05 + 1",
      "--y": "calc(var(--lift-amount) * var(--index))",
      "--scale": "calc(-1 * var(--base-scale))",
      "--height": "var(--first-height)"
    });
    if (!visible) {
      assign({
        "--y": "calc(var(--sign) * 40%)"
      });
    }
  }
  if (sibling && stacked && !visible) {
    assign({
      "--y": "calc(var(--lift) * var(--offset) + var(--lift) * -100%)"
    });
  }
  if (frontmost && !visible) {
    assign({
      "--y": "calc(var(--lift) * -100%)"
    });
  }
  return styles;
}
function getGhostBeforeStyle(service, visible) {
  const { computed } = service;
  const styles = {
    position: "absolute",
    inset: "0",
    scale: "1 2",
    pointerEvents: visible ? "none" : "auto"
  };
  const assign = (overrides) => Object.assign(styles, overrides);
  if (computed("frontmost") && !visible) {
    assign({
      height: "calc(var(--initial-height) + 80%)"
    });
  }
  return styles;
}
function getGhostAfterStyle() {
  return {
    position: "absolute",
    left: "0",
    height: "calc(var(--gap) + 2px)",
    bottom: "100%",
    width: "100%"
  };
}

// src/toast-group.connect.ts
function groupConnect(service, normalize) {
  const { context, prop, send, refs, computed } = service;
  return {
    getCount() {
      return context.get("toasts").length;
    },
    getToasts() {
      return context.get("toasts");
    },
    getGroupProps(options = {}) {
      const { label = "Notifications" } = options;
      const { hotkey } = prop("store").attrs;
      const hotkeyLabel = hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, "");
      const placement = computed("placement");
      const [side, align = "center"] = placement.split("-");
      return normalize.element({
        ...parts.group.attrs,
        dir: prop("dir"),
        tabIndex: -1,
        "aria-label": `${placement} ${label} ${hotkeyLabel}`,
        id: getRegionId(placement),
        "data-placement": placement,
        "data-side": side,
        "data-align": align,
        "aria-live": "polite",
        role: "region",
        style: getGroupPlacementStyle(service, placement),
        onMouseMove() {
          send({ type: "REGION.POINTER_ENTER", placement });
        },
        onMouseLeave() {
          send({ type: "REGION.POINTER_LEAVE", placement });
        },
        onFocus(event) {
          send({ type: "REGION.FOCUS", target: event.relatedTarget });
        },
        onBlur(event) {
          if (refs.get("isFocusWithin") && !contains(event.currentTarget, event.relatedTarget)) {
            queueMicrotask(() => send({ type: "REGION.BLUR" }));
          }
        }
      });
    },
    subscribe(fn) {
      const store = prop("store");
      return store.subscribe(() => fn(context.get("toasts")));
    }
  };
}
var groupMachine = createMachine({
  props({ props }) {
    return {
      dir: "ltr",
      id: uuid(),
      ...props,
      store: props.store
    };
  },
  initialState({ prop }) {
    return prop("store").attrs.overlap ? "overlap" : "stack";
  },
  refs() {
    return {
      lastFocusedEl: null,
      isFocusWithin: false,
      dismissableCleanup: void 0
    };
  },
  context({ bindable }) {
    return {
      toasts: bindable(() => ({
        defaultValue: [],
        sync: true,
        hash: (toasts) => toasts.map((t) => t.id).join(",")
      })),
      heights: bindable(() => ({
        defaultValue: [],
        sync: true
      }))
    };
  },
  computed: {
    count: ({ context }) => context.get("toasts").length,
    overlap: ({ prop }) => prop("store").attrs.overlap,
    placement: ({ prop }) => prop("store").attrs.placement
  },
  effects: ["subscribeToStore", "trackDocumentVisibility", "trackHotKeyPress"],
  watch({ track, context, action }) {
    track([() => context.hash("toasts")], () => {
      queueMicrotask(() => {
        action(["collapsedIfEmpty", "setDismissableBranch"]);
      });
    });
  },
  exit: ["clearDismissableBranch", "clearLastFocusedEl"],
  on: {
    "DOC.HOTKEY": {
      actions: ["focusRegionEl"]
    },
    "REGION.BLUR": [
      {
        guard: "isOverlapping",
        target: "overlap",
        actions: ["collapseToasts", "resumeToasts", "restoreLastFocusedEl"]
      },
      {
        target: "stack",
        actions: ["resumeToasts", "restoreLastFocusedEl"]
      }
    ],
    "TOAST.REMOVE": {
      actions: ["removeToast", "removeHeight"]
    },
    "TOAST.PAUSE": {
      actions: ["pauseToasts"]
    }
  },
  states: {
    stack: {
      on: {
        "REGION.POINTER_LEAVE": [
          {
            guard: "isOverlapping",
            target: "overlap",
            actions: ["resumeToasts", "collapseToasts"]
          },
          {
            actions: ["resumeToasts"]
          }
        ],
        "REGION.OVERLAP": {
          target: "overlap",
          actions: ["collapseToasts"]
        },
        "REGION.FOCUS": {
          actions: ["setLastFocusedEl", "pauseToasts"]
        },
        "REGION.POINTER_ENTER": {
          actions: ["pauseToasts"]
        }
      }
    },
    overlap: {
      on: {
        "REGION.STACK": {
          target: "stack",
          actions: ["expandToasts"]
        },
        "REGION.POINTER_ENTER": {
          target: "stack",
          actions: ["pauseToasts", "expandToasts"]
        },
        "REGION.FOCUS": {
          target: "stack",
          actions: ["setLastFocusedEl", "pauseToasts", "expandToasts"]
        }
      }
    }
  },
  implementations: {
    guards: {
      isOverlapping: ({ computed }) => computed("overlap")
    },
    effects: {
      subscribeToStore({ context, prop }) {
        return prop("store").subscribe((toast) => {
          if (toast.dismiss) {
            context.set("toasts", (prev) => prev.filter((t) => t.id !== toast.id));
            return;
          }
          context.set("toasts", (prev) => {
            const index = prev.findIndex((t) => t.id === toast.id);
            if (index !== -1) {
              return [...prev.slice(0, index), { ...prev[index], ...toast }, ...prev.slice(index + 1)];
            }
            return [toast, ...prev];
          });
        });
      },
      trackHotKeyPress({ prop, send }) {
        const handleKeyDown = (event) => {
          const { hotkey } = prop("store").attrs;
          const isHotkeyPressed = hotkey.every((key) => event[key] || event.code === key);
          if (!isHotkeyPressed) return;
          send({ type: "DOC.HOTKEY" });
        };
        return addDomEvent(document, "keydown", handleKeyDown, { capture: true });
      },
      trackDocumentVisibility({ prop, send, scope }) {
        const { pauseOnPageIdle } = prop("store").attrs;
        if (!pauseOnPageIdle) return;
        const doc = scope.getDoc();
        return addDomEvent(doc, "visibilitychange", () => {
          const isHidden = doc.visibilityState === "hidden";
          send({ type: isHidden ? "PAUSE_ALL" : "RESUME_ALL" });
        });
      }
    },
    actions: {
      setDismissableBranch({ refs, context, computed, scope }) {
        const toasts = context.get("toasts");
        const placement = computed("placement");
        const hasToasts = toasts.length > 0;
        if (!hasToasts) {
          refs.get("dismissableCleanup")?.();
          return;
        }
        if (hasToasts && refs.get("dismissableCleanup")) {
          return;
        }
        const groupEl = () => getRegionEl(scope, placement);
        const cleanup = trackDismissableBranch(groupEl, { defer: true });
        refs.set("dismissableCleanup", cleanup);
      },
      clearDismissableBranch({ refs }) {
        refs.get("dismissableCleanup")?.();
      },
      focusRegionEl({ scope, computed }) {
        queueMicrotask(() => {
          getRegionEl(scope, computed("placement"))?.focus();
        });
      },
      pauseToasts({ prop }) {
        prop("store").pause();
      },
      resumeToasts({ prop }) {
        prop("store").resume();
      },
      expandToasts({ prop }) {
        prop("store").expand();
      },
      collapseToasts({ prop }) {
        prop("store").collapse();
      },
      removeToast({ prop, event }) {
        prop("store").remove(event.id);
      },
      removeHeight({ event, context }) {
        if (event?.id == null) return;
        queueMicrotask(() => {
          context.set("heights", (heights) => heights.filter((height) => height.id !== event.id));
        });
      },
      collapsedIfEmpty({ send, computed }) {
        if (!computed("overlap") || computed("count") > 1) return;
        send({ type: "REGION.OVERLAP" });
      },
      setLastFocusedEl({ refs, event }) {
        if (refs.get("isFocusWithin") || !event.target) return;
        refs.set("isFocusWithin", true);
        refs.set("lastFocusedEl", event.target);
      },
      restoreLastFocusedEl({ refs }) {
        if (!refs.get("lastFocusedEl")) return;
        refs.get("lastFocusedEl")?.focus({ preventScroll: true });
        refs.set("lastFocusedEl", null);
        refs.set("isFocusWithin", false);
      },
      clearLastFocusedEl({ refs }) {
        if (!refs.get("lastFocusedEl")) return;
        refs.get("lastFocusedEl")?.focus({ preventScroll: true });
        refs.set("lastFocusedEl", null);
        refs.set("isFocusWithin", false);
      }
    }
  }
});
function connect(service, normalize) {
  const { state, send, prop, scope, context, computed } = service;
  const visible = state.hasTag("visible");
  const paused = state.hasTag("paused");
  const mounted = context.get("mounted");
  const frontmost = computed("frontmost");
  const placement = prop("parent").computed("placement");
  const type = prop("type");
  const stacked = prop("stacked");
  const title = prop("title");
  const description = prop("description");
  const action = prop("action");
  const [side, align = "center"] = placement.split("-");
  return {
    type,
    title,
    description,
    placement,
    visible,
    paused,
    closable: !!prop("closable"),
    pause() {
      send({ type: "PAUSE" });
    },
    resume() {
      send({ type: "RESUME" });
    },
    dismiss() {
      send({ type: "DISMISS", src: "programmatic" });
    },
    getRootProps() {
      return normalize.element({
        ...parts.root.attrs,
        dir: prop("dir"),
        id: getRootId(scope),
        "data-state": visible ? "open" : "closed",
        "data-type": type,
        "data-placement": placement,
        "data-align": align,
        "data-side": side,
        "data-mounted": dataAttr(mounted),
        "data-paused": dataAttr(paused),
        "data-first": dataAttr(frontmost),
        "data-sibling": dataAttr(!frontmost),
        "data-stack": dataAttr(stacked),
        "data-overlap": dataAttr(!stacked),
        role: "status",
        "aria-atomic": "true",
        "aria-describedby": description ? getDescriptionId(scope) : void 0,
        "aria-labelledby": title ? getTitleId(scope) : void 0,
        tabIndex: 0,
        style: getPlacementStyle(service, visible),
        onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (event.key == "Escape") {
            send({ type: "DISMISS", src: "keyboard" });
            event.preventDefault();
          }
        }
      });
    },
    /* Leave a ghost div to avoid setting hover to false when transitioning out */
    getGhostBeforeProps() {
      return normalize.element({
        "data-ghost": "before",
        style: getGhostBeforeStyle(service, visible)
      });
    },
    /* Needed to avoid setting hover to false when in between toasts */
    getGhostAfterProps() {
      return normalize.element({
        "data-ghost": "after",
        style: getGhostAfterStyle()
      });
    },
    getTitleProps() {
      return normalize.element({
        ...parts.title.attrs,
        id: getTitleId(scope)
      });
    },
    getDescriptionProps() {
      return normalize.element({
        ...parts.description.attrs,
        id: getDescriptionId(scope)
      });
    },
    getActionTriggerProps() {
      return normalize.button({
        ...parts.actionTrigger.attrs,
        type: "button",
        onClick(event) {
          if (event.defaultPrevented) return;
          action?.onClick?.();
          send({ type: "DISMISS", src: "user" });
        }
      });
    },
    getCloseTriggerProps() {
      return normalize.button({
        id: getCloseTriggerId(scope),
        ...parts.closeTrigger.attrs,
        type: "button",
        "aria-label": "Dismiss notification",
        onClick(event) {
          if (event.defaultPrevented) return;
          send({ type: "DISMISS", src: "user" });
        }
      });
    }
  };
}
var { not } = createGuards();
var machine = createMachine({
  props({ props }) {
    ensureProps(props, ["id", "type", "parent", "removeDelay"], "toast");
    return {
      closable: true,
      ...props,
      duration: getToastDuration(props.duration, props.type)
    };
  },
  initialState({ prop }) {
    const persist = prop("type") === "loading" || prop("duration") === Infinity;
    return persist ? "visible:persist" : "visible";
  },
  context({ prop, bindable }) {
    return {
      remainingTime: bindable(() => ({
        defaultValue: getToastDuration(prop("duration"), prop("type"))
      })),
      createdAt: bindable(() => ({
        defaultValue: Date.now()
      })),
      mounted: bindable(() => ({
        defaultValue: false
      })),
      initialHeight: bindable(() => ({
        defaultValue: 0
      }))
    };
  },
  refs() {
    return {
      closeTimerStartTime: Date.now(),
      lastCloseStartTimerStartTime: 0
    };
  },
  computed: {
    zIndex: ({ prop }) => {
      const toasts = prop("parent").context.get("toasts");
      const index = toasts.findIndex((toast) => toast.id === prop("id"));
      return toasts.length - index;
    },
    height: ({ prop }) => {
      const heights = prop("parent").context.get("heights");
      const height = heights.find((height2) => height2.id === prop("id"));
      return height?.height ?? 0;
    },
    heightIndex: ({ prop }) => {
      const heights = prop("parent").context.get("heights");
      return heights.findIndex((height) => height.id === prop("id"));
    },
    frontmost: ({ prop }) => prop("index") === 0,
    heightBefore: ({ prop }) => {
      const heights = prop("parent").context.get("heights");
      const heightIndex = heights.findIndex((height) => height.id === prop("id"));
      return heights.reduce((prev, curr, reducerIndex) => {
        if (reducerIndex >= heightIndex) return prev;
        return prev + curr.height;
      }, 0);
    },
    shouldPersist: ({ prop }) => prop("type") === "loading" || prop("duration") === Infinity
  },
  watch({ track, prop, send }) {
    track([() => prop("message")], () => {
      const message = prop("message");
      if (message) send({ type: message, src: "programmatic" });
    });
    track([() => prop("type"), () => prop("duration")], () => {
      send({ type: "UPDATE" });
    });
  },
  on: {
    UPDATE: [
      {
        guard: "shouldPersist",
        target: "visible:persist",
        actions: ["resetCloseTimer"]
      },
      {
        target: "visible:updating",
        actions: ["resetCloseTimer"]
      }
    ],
    MEASURE: {
      actions: ["measureHeight"]
    }
  },
  entry: ["setMounted", "measureHeight", "invokeOnVisible"],
  effects: ["trackHeight"],
  states: {
    "visible:updating": {
      tags: ["visible", "updating"],
      effects: ["waitForNextTick"],
      on: {
        SHOW: {
          target: "visible"
        }
      }
    },
    "visible:persist": {
      tags: ["visible", "paused"],
      on: {
        RESUME: {
          guard: not("isLoadingType"),
          target: "visible",
          actions: ["setCloseTimer"]
        },
        DISMISS: {
          target: "dismissing"
        }
      }
    },
    visible: {
      tags: ["visible"],
      effects: ["waitForDuration"],
      on: {
        DISMISS: {
          target: "dismissing"
        },
        PAUSE: {
          target: "visible:persist",
          actions: ["syncRemainingTime"]
        }
      }
    },
    dismissing: {
      entry: ["invokeOnDismiss"],
      effects: ["waitForRemoveDelay"],
      on: {
        REMOVE: {
          target: "unmounted",
          actions: ["notifyParentToRemove"]
        }
      }
    },
    unmounted: {
      entry: ["invokeOnUnmount"]
    }
  },
  implementations: {
    effects: {
      waitForRemoveDelay({ prop, send }) {
        return setRafTimeout(() => {
          send({ type: "REMOVE", src: "timer" });
        }, prop("removeDelay"));
      },
      waitForDuration({ send, context, computed }) {
        if (computed("shouldPersist")) return;
        return setRafTimeout(() => {
          send({ type: "DISMISS", src: "timer" });
        }, context.get("remainingTime"));
      },
      waitForNextTick({ send }) {
        return setRafTimeout(() => {
          send({ type: "SHOW", src: "timer" });
        }, 0);
      },
      trackHeight({ scope, prop }) {
        let cleanup;
        raf(() => {
          const rootEl = getRootEl(scope);
          if (!rootEl) return;
          const syncHeight = () => {
            const originalHeight = rootEl.style.height;
            rootEl.style.height = "auto";
            const height = rootEl.getBoundingClientRect().height;
            rootEl.style.height = originalHeight;
            const item = { id: prop("id"), height };
            setHeight(prop("parent"), item);
          };
          const win = scope.getWin();
          const observer = new win.MutationObserver(syncHeight);
          observer.observe(rootEl, {
            childList: true,
            subtree: true,
            characterData: true
          });
          cleanup = () => observer.disconnect();
        });
        return () => cleanup?.();
      }
    },
    guards: {
      isLoadingType: ({ prop }) => prop("type") === "loading",
      shouldPersist: ({ computed }) => computed("shouldPersist")
    },
    actions: {
      setMounted({ context }) {
        raf(() => {
          context.set("mounted", true);
        });
      },
      measureHeight({ scope, prop, context }) {
        queueMicrotask(() => {
          const rootEl = getRootEl(scope);
          if (!rootEl) return;
          const originalHeight = rootEl.style.height;
          rootEl.style.height = "auto";
          const height = rootEl.getBoundingClientRect().height;
          rootEl.style.height = originalHeight;
          context.set("initialHeight", height);
          const item = { id: prop("id"), height };
          setHeight(prop("parent"), item);
        });
      },
      setCloseTimer({ refs }) {
        refs.set("closeTimerStartTime", Date.now());
      },
      resetCloseTimer({ context, refs, prop }) {
        refs.set("closeTimerStartTime", Date.now());
        context.set("remainingTime", getToastDuration(prop("duration"), prop("type")));
      },
      syncRemainingTime({ context, refs }) {
        context.set("remainingTime", (prev) => {
          const closeTimerStartTime = refs.get("closeTimerStartTime");
          const elapsedTime = Date.now() - closeTimerStartTime;
          refs.set("lastCloseStartTimerStartTime", Date.now());
          return prev - elapsedTime;
        });
      },
      notifyParentToRemove({ prop }) {
        const parent = prop("parent");
        parent.send({ type: "TOAST.REMOVE", id: prop("id") });
      },
      invokeOnDismiss({ prop, event }) {
        prop("onStatusChange")?.({ status: "dismissing", src: event.src });
      },
      invokeOnUnmount({ prop }) {
        prop("onStatusChange")?.({ status: "unmounted" });
      },
      invokeOnVisible({ prop }) {
        prop("onStatusChange")?.({ status: "visible" });
      }
    }
  }
});
function setHeight(parent, item) {
  const { id, height } = item;
  parent.context.set("heights", (prev) => {
    const alreadyExists = prev.find((i) => i.id === id);
    if (!alreadyExists) {
      return [{ id, height }, ...prev];
    } else {
      return prev.map((i) => i.id === id ? { ...i, height } : i);
    }
  });
}
var withDefaults = (options, defaults) => {
  return { ...defaults, ...compact(options) };
};
function createToastStore(props) {
  const attrs = withDefaults(props, {
    placement: "bottom",
    overlap: false,
    max: 24,
    gap: 16,
    offsets: "1rem",
    hotkey: ["altKey", "KeyT"],
    removeDelay: 200,
    pauseOnPageIdle: true
  });
  let subscribers = [];
  let toasts = [];
  let dismissedToasts = /* @__PURE__ */ new Set();
  let toastQueue = [];
  const subscribe = (subscriber) => {
    subscribers.push(subscriber);
    return () => {
      const index = subscribers.indexOf(subscriber);
      subscribers.splice(index, 1);
    };
  };
  const publish = (data) => {
    subscribers.forEach((subscriber) => subscriber(data));
    return data;
  };
  const addToast = (data) => {
    if (toasts.length >= attrs.max) {
      toastQueue.push(data);
      return;
    }
    publish(data);
    toasts.unshift(data);
  };
  const processQueue = () => {
    while (toastQueue.length > 0 && toasts.length < attrs.max) {
      const nextToast = toastQueue.shift();
      if (nextToast) {
        publish(nextToast);
        toasts.unshift(nextToast);
      }
    }
  };
  const create = (data) => {
    const id = data.id ?? `toast:${uuid()}`;
    const exists = toasts.find((toast) => toast.id === id);
    if (dismissedToasts.has(id)) dismissedToasts.delete(id);
    if (exists) {
      toasts = toasts.map((toast) => {
        if (toast.id === id) {
          return publish({ ...toast, ...data, id });
        }
        return toast;
      });
    } else {
      addToast({
        id,
        duration: attrs.duration,
        removeDelay: attrs.removeDelay,
        type: "info",
        ...data,
        stacked: !attrs.overlap,
        gap: attrs.gap
      });
    }
    return id;
  };
  const remove = (id) => {
    dismissedToasts.add(id);
    if (!id) {
      toasts.forEach((toast) => {
        subscribers.forEach((subscriber) => subscriber({ id: toast.id, dismiss: true }));
      });
      toasts = [];
      toastQueue = [];
    } else {
      subscribers.forEach((subscriber) => subscriber({ id, dismiss: true }));
      toasts = toasts.filter((toast) => toast.id !== id);
      processQueue();
    }
    return id;
  };
  const error = (data) => {
    return create({ ...data, type: "error" });
  };
  const success = (data) => {
    return create({ ...data, type: "success" });
  };
  const info = (data) => {
    return create({ ...data, type: "info" });
  };
  const warning = (data) => {
    return create({ ...data, type: "warning" });
  };
  const loading = (data) => {
    return create({ ...data, type: "loading" });
  };
  const getVisibleToasts = () => {
    return toasts.filter((toast) => !dismissedToasts.has(toast.id));
  };
  const getCount = () => {
    return toasts.length;
  };
  const promise = (promise2, options, shared = {}) => {
    if (!options) return;
    let id = void 0;
    if (options.loading !== void 0) {
      id = create({
        ...shared,
        ...options.loading,
        promise: promise2,
        type: "loading"
      });
    }
    let removable = id !== void 0;
    let result;
    const prom = runIfFn(promise2).then(async (response) => {
      result = ["resolve", response];
      if (isHttpResponse(response) && !response.ok) {
        removable = false;
        const errorOptions = runIfFn(options.error, `HTTP Error! status: ${response.status}`);
        create({ ...shared, ...errorOptions, id, type: "error" });
      } else if (options.success !== void 0) {
        removable = false;
        const successOptions = runIfFn(options.success, response);
        create({ ...shared, ...successOptions, id, type: "success" });
      }
    }).catch(async (error2) => {
      result = ["reject", error2];
      if (options.error !== void 0) {
        removable = false;
        const errorOptions = runIfFn(options.error, error2);
        create({ ...shared, ...errorOptions, id, type: "error" });
      }
    }).finally(() => {
      if (removable) {
        remove(id);
        id = void 0;
      }
      options.finally?.();
    });
    const unwrap = () => new Promise(
      (resolve, reject) => prom.then(() => result[0] === "reject" ? reject(result[1]) : resolve(result[1])).catch(reject)
    );
    return { id, unwrap };
  };
  const update = (id, data) => {
    return create({ id, ...data });
  };
  const pause = (id) => {
    if (id != null) {
      toasts = toasts.map((toast) => {
        if (toast.id === id) return publish({ ...toast, message: "PAUSE" });
        return toast;
      });
    } else {
      toasts = toasts.map((toast) => publish({ ...toast, message: "PAUSE" }));
    }
  };
  const resume = (id) => {
    if (id != null) {
      toasts = toasts.map((toast) => {
        if (toast.id === id) return publish({ ...toast, message: "RESUME" });
        return toast;
      });
    } else {
      toasts = toasts.map((toast) => publish({ ...toast, message: "RESUME" }));
    }
  };
  const dismiss = (id) => {
    if (id != null) {
      toasts = toasts.map((toast) => {
        if (toast.id === id) return publish({ ...toast, message: "DISMISS" });
        return toast;
      });
    } else {
      toasts = toasts.map((toast) => publish({ ...toast, message: "DISMISS" }));
    }
  };
  const isVisible = (id) => {
    return !dismissedToasts.has(id) && !!toasts.find((toast) => toast.id === id);
  };
  const isDismissed = (id) => {
    return dismissedToasts.has(id);
  };
  const expand = () => {
    toasts = toasts.map((toast) => publish({ ...toast, stacked: true }));
  };
  const collapse = () => {
    toasts = toasts.map((toast) => publish({ ...toast, stacked: false }));
  };
  return {
    attrs,
    subscribe,
    create,
    update,
    remove,
    dismiss,
    error,
    success,
    info,
    warning,
    loading,
    getVisibleToasts,
    getCount,
    promise,
    pause,
    resume,
    isVisible,
    isDismissed,
    expand,
    collapse
  };
}
var isHttpResponse = (data) => {
  return data && typeof data === "object" && "ok" in data && typeof data.ok === "boolean" && "status" in data && typeof data.status === "number";
};

// src/index.ts
var group = {
  connect: groupConnect,
  machine: groupMachine
};

function createToaster(options) {
  if (options === void 0) {
    options = {};
  }
  return createToastStore(options);
}
const toaster = createToaster({ placement: "top" });

export { trackDismissableElement as a, connect as c, group as g, machine as m, toaster as t };
//# sourceMappingURL=toaster-DzAsAKEJ.js.map
