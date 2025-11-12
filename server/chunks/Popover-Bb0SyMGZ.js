import { x as push, V as copy_payload, W as assign_payload, Z as bind_props, z as pop, T as spread_attributes, Q as stringify, M as escape_html, O as attr } from './index-BYsoXH7a.js';
import { computePosition, autoUpdate, offset, flip, shift, platform, arrow } from '@floating-ui/dom';
import { s as sanitizeHTML } from './HTML-1Mhr8hI4.js';
import { h as html } from './html2-FW6Ia4bL.js';

function hasWindow() {
  return typeof window !== 'undefined';
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === 'undefined') {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}

let count = 0;
function useId() {
  return Math.random().toString(36).substring(2, 9) + count++;
}
function styleObjectToString(styleObject) {
  return Object.entries(styleObject).map(([key, value]) => `${key}: ${value};`).join(" ");
}
function Floating_arrow($$payload, $$props) {
  push();
  let {
    ref = null,
    context,
    // ---
    width = 14,
    height = 7,
    tipRadius = 0,
    strokeWidth = 0,
    staticOffset,
    stroke,
    d,
    // ---
    transform,
    fill,
    $$slots,
    $$events,
    // ---
    ...rest
  } = $$props;
  const { placement, elements: { floating }, middlewareData: { arrow: arrow2 } } = context;
  const clipPathId = useId();
  const computedStrokeWidth = strokeWidth * 2;
  const halfStrokeWidth = computedStrokeWidth / 2;
  const svgX = width / 2 * (tipRadius / -8 + 1);
  const svgY = height / 2 * tipRadius / 4;
  const [side, alignment] = placement.split("-");
  const isRTL = floating && platform.isRTL(floating);
  const isCustomShape = !!d;
  const isVerticalSide = side === "top" || side === "bottom";
  const yOffsetProp = staticOffset && alignment === "end" ? "bottom" : "top";
  const xOffsetProp = (() => {
    if (!staticOffset) {
      return "left";
    }
    if (isRTL) {
      return alignment === "end" ? "right" : "left";
    }
    return alignment === "end" ? "right" : "left";
  })();
  const arrowX = arrow2?.x != null ? staticOffset || `${arrow2.x}px` : "";
  const arrowY = arrow2?.y != null ? staticOffset || `${arrow2.y}px` : "";
  const dValue = d || `M0,0 H${width} L${width - svgX},${height - svgY} Q${width / 2},${height} ${svgX},${height - svgY} Z`;
  const rotation = (() => {
    switch (side) {
      case "top":
        return isCustomShape ? "rotate(180deg)" : "";
      case "left":
        return isCustomShape ? "rotate(90deg)" : "rotate(-90deg)";
      case "bottom":
        return isCustomShape ? "" : "rotate(180deg)";
      case "right":
        return isCustomShape ? "rotate(-90deg)" : "rotate(90deg)";
    }
  })();
  $$payload.out.push(`<svg${spread_attributes(
    {
      width: isCustomShape ? width : width + computedStrokeWidth,
      height: width,
      viewBox: `0 0 ${width} ${height > width ? height : width}`,
      "aria-hidden": "true",
      style: styleObjectToString({
        position: "absolute",
        "pointer-events": "none",
        [xOffsetProp]: `${arrowX}`,
        [yOffsetProp]: `${arrowY}`,
        [side]: isVerticalSide || isCustomShape ? "100%" : `calc(100% - ${computedStrokeWidth / 2}px)`,
        transform: `${rotation} ${transform ?? ""}`,
        fill
      }),
      "data-testid": "floating-arrow",
      ...rest
    },
    null,
    void 0,
    void 0,
    3
  )}>`);
  if (computedStrokeWidth > 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<path fill="none"${attr("stroke", stroke)}${attr("clip-path", `url(#${clipPathId})`)}${attr("stroke-width", computedStrokeWidth + (d ? 0 : 1))}${attr("d", dValue)}></path>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--><path${attr("stroke", computedStrokeWidth && !d ? fill : "none")}${attr("d", dValue)}></path><clipPath${attr("id", clipPathId)}><rect${attr("x", -halfStrokeWidth)}${attr("y", halfStrokeWidth * (isCustomShape ? -1 : 1))}${attr("width", width + computedStrokeWidth)}${attr("height", width)}></rect></clipPath></svg>`);
  bind_props($$props, { ref });
  pop();
}
function getPlatform() {
  const uaData = navigator.userAgentData;
  if (uaData?.platform) {
    return uaData.platform;
  }
  return navigator.platform;
}
function getUserAgent() {
  const uaData = navigator.userAgentData;
  if (uaData && Array.isArray(uaData.brands)) {
    return uaData.brands.map(({ brand, version }) => `${brand}/${version}`).join(" ");
  }
  return navigator.userAgent;
}
function isMac() {
  return getPlatform().toLowerCase().startsWith("mac") && !navigator.maxTouchPoints;
}
function isSafari() {
  return /apple/i.test(navigator.vendor);
}
function isAndroid() {
  const re = /android/i;
  return re.test(getPlatform()) || re.test(getUserAgent());
}
function isJSDOM() {
  return getUserAgent().includes("jsdom/");
}
function getDocument(element) {
  return element?.ownerDocument ?? document;
}
function activeElement(doc) {
  let activeElement2 = doc.activeElement;
  while (activeElement2?.shadowRoot?.activeElement != null) {
    activeElement2 = activeElement2.shadowRoot.activeElement;
  }
  return activeElement2;
}
function createAttribute(name) {
  return `data-floating-ui-${name}`;
}
function contains(parent, child) {
  if (!parent || !child) {
    return false;
  }
  const rootNode = child.getRootNode?.();
  if (parent.contains(child)) {
    return true;
  }
  if (rootNode && isShadowRoot(rootNode)) {
    let next = child;
    while (next) {
      if (parent === next) {
        return true;
      }
      next = next.parentNode || next.host;
    }
  }
  return false;
}
function isVirtualPointerEvent(event) {
  if (isJSDOM()) {
    return false;
  }
  return !isAndroid() && event.width === 0 && event.height === 0 || isAndroid() && event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "mouse" || // iOS VoiceOver returns 0.333• for width/height.
  event.width < 1 && event.height < 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === "touch";
}
function getTarget(event) {
  if ("composedPath" in event) {
    return event.composedPath()[0];
  }
  return event.target;
}
function isMouseLikePointerType(pointerType, strict) {
  const values = ["mouse", "pen"];
  if (!strict) {
    values.push("", void 0);
  }
  return values.includes(pointerType);
}
const TYPEABLE_SELECTOR = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
function isTypeableElement(element) {
  return isHTMLElement(element) && element.matches(TYPEABLE_SELECTOR);
}
function isButtonTarget(event) {
  return isHTMLElement(event.target) && event.target.tagName === "BUTTON";
}
function isSpaceIgnored(element) {
  return isTypeableElement(element);
}
function useClick(context, options = {}) {
  const { open, onOpenChange, data, elements: { reference } } = context;
  const {
    enabled = true,
    event: eventOption = "click",
    toggle = true,
    ignoreMouse = false,
    keyboardHandlers = true
  } = options;
  let pointerType = void 0;
  let didKeyDown = false;
  return {
    get reference() {
      if (!enabled) {
        return {};
      }
      return {
        onpointerdown: (event) => {
          pointerType = event.pointerType;
        },
        onmousedown: (event) => {
          if (event.button !== 0) {
            return;
          }
          if (isMouseLikePointerType(pointerType, true) && ignoreMouse) {
            return;
          }
          if (eventOption === "click") {
            return;
          }
          if (open && toggle && (data.openEvent ? data.openEvent.type === "mousedown" : true)) {
            onOpenChange(false, event, "click");
          } else {
            event.preventDefault();
            onOpenChange(true, event, "click");
          }
        },
        onclick: (event) => {
          if (eventOption === "mousedown" && pointerType) {
            pointerType = void 0;
            return;
          }
          if (isMouseLikePointerType(pointerType, true) && ignoreMouse) {
            return;
          }
          if (open && toggle && (data.openEvent ? data.openEvent.type === "click" : true)) {
            onOpenChange(false, event, "click");
          } else {
            onOpenChange(true, event, "click");
          }
        },
        onkeydown: (event) => {
          pointerType = void 0;
          if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event)) {
            return;
          }
          if (event.key === " " && !isSpaceIgnored(reference)) {
            event.preventDefault();
            didKeyDown = true;
          }
          if (event.key === "Enter") {
            if (open && toggle) {
              onOpenChange(false, event, "click");
            } else {
              onOpenChange(true, event, "click");
            }
          }
        },
        onkeyup: (event) => {
          if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event) || // @ts-expect-error FIXME
          isSpaceIgnored(reference)) {
            return;
          }
          if (event.key === " " && didKeyDown) {
            didKeyDown = false;
            if (open && toggle) {
              onOpenChange(false, event, "click");
            } else {
              onOpenChange(true, event, "click");
            }
          }
        }
      };
    }
  };
}
const bubbleHandlerKeys = {
  pointerdown: "onpointerdown",
  mousedown: "onmousedown",
  click: "onclick"
};
const captureHandlerKeys = {
  pointerdown: "onpointerdowncapture",
  mousedown: "onmousedowncapture",
  click: "onclickcapture"
};
const normalizeProp = (normalizable) => {
  return {
    escapeKey: typeof normalizable === "boolean" ? normalizable : normalizable?.escapeKey ?? false,
    outsidePress: typeof normalizable === "boolean" ? normalizable : normalizable?.outsidePress ?? true
  };
};
function useDismiss(context, options = {}) {
  const {
    open,
    onOpenChange,
    // nodeId,
    elements: { reference, floating },
    data
  } = context;
  const {
    enabled = true,
    escapeKey = true,
    outsidePress: unstable_outsidePress = true,
    outsidePressEvent = "pointerdown",
    referencePress = false,
    referencePressEvent = "pointerdown",
    ancestorScroll = false,
    bubbles,
    capture
  } = options;
  const {
    escapeKey: escapeKeyBubbles
  } = normalizeProp(bubbles);
  normalizeProp(capture);
  const closeOnEscapeKeyDown = (event) => {
    if (!open || !enabled || !escapeKey || event.key !== "Escape") {
      return;
    }
    if (!escapeKeyBubbles) {
      event.stopPropagation();
    }
    onOpenChange(false, event, "escape-key");
  };
  return {
    get reference() {
      if (!enabled) {
        return {};
      }
      return {
        onKeyDown: closeOnEscapeKeyDown,
        [bubbleHandlerKeys[referencePressEvent]]: (event) => {
          if (referencePress) {
            onOpenChange(false, event, "reference-press");
          }
        }
      };
    },
    get floating() {
      if (!enabled) {
        return {};
      }
      return {
        onKeyDown: closeOnEscapeKeyDown,
        onMouseDown() {
        },
        onMouseUp() {
        },
        [captureHandlerKeys[outsidePressEvent]]: () => {
        }
      };
    }
  };
}
function createPubSub() {
  const map = /* @__PURE__ */ new Map();
  return {
    emit(event, data) {
      const handlers = map.get(event);
      if (!handlers) {
        return;
      }
      for (const handler of handlers) {
        handler(data);
      }
    },
    on(event, listener) {
      map.set(event, [...map.get(event) || [], listener]);
    },
    off(event, listener) {
      map.set(event, map.get(event)?.filter((l) => l !== listener) || []);
    }
  };
}
function getDPR(element) {
  if (typeof window === "undefined") {
    return 1;
  }
  const win = element.ownerDocument.defaultView || window;
  return win.devicePixelRatio || 1;
}
function roundByDPR(element, value) {
  const dpr = getDPR(element);
  return Math.round(value * dpr) / dpr;
}
function noop() {
}
function useFloating(options = {}) {
  const elements = options.elements ?? {};
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    transform = true,
    open = true,
    onOpenChange: unstableOnOpenChange = noop,
    whileElementsMounted,
    nodeId
  } = options;
  const floatingStyles = (() => {
    const initialStyles = { position: strategy, left: "0px", top: "0px" };
    if (!elements.floating) {
      return styleObjectToString(initialStyles);
    }
    const x = roundByDPR(elements.floating, state.x);
    const y = roundByDPR(elements.floating, state.y);
    if (transform) {
      return styleObjectToString({
        ...initialStyles,
        transform: `translate(${x}px, ${y}px)`,
        ...getDPR(elements.floating) >= 1.5 && { willChange: "transform" }
      });
    }
    return styleObjectToString({ position: strategy, left: `${x}px`, top: `${y}px` });
  })();
  const events = createPubSub();
  const data = {};
  const onOpenChange = (open2, event, reason) => {
    data.openEvent = open2 ? event : void 0;
    events.emit("openchange", { open: open2, event, reason });
    unstableOnOpenChange(open2, event, reason);
  };
  const state = {
    x: 0,
    y: 0,
    strategy,
    placement,
    middlewareData: {},
    isPositioned: false
  };
  const context = {
    data,
    events,
    elements,
    onOpenChange,
    floatingId: useId(),
    get nodeId() {
      return nodeId;
    },
    get x() {
      return state.x;
    },
    get y() {
      return state.y;
    },
    get placement() {
      return state.placement;
    },
    get strategy() {
      return state.strategy;
    },
    get middlewareData() {
      return state.middlewareData;
    },
    get isPositioned() {
      return state.isPositioned;
    },
    get open() {
      return open;
    }
  };
  const update = async () => {
    if (!elements.floating || !elements.reference) {
      return;
    }
    const config = { placement, strategy, middleware };
    const position = await computePosition(elements.reference, elements.floating, config);
    state.x = position.x;
    state.y = position.y;
    state.placement = position.placement;
    state.strategy = position.strategy;
    state.middlewareData = position.middlewareData;
    state.isPositioned = true;
  };
  return {
    update,
    context,
    elements,
    get x() {
      return state.x;
    },
    get y() {
      return state.y;
    },
    get placement() {
      return state.placement;
    },
    get strategy() {
      return state.strategy;
    },
    get middlewareData() {
      return state.middlewareData;
    },
    get isPositioned() {
      return state.isPositioned;
    },
    get open() {
      return open;
    },
    get floatingStyles() {
      return floatingStyles;
    }
  };
}
function useFocus(context, options = {}) {
  const {
    open,
    onOpenChange,
    events,
    elements: { reference, floating }
  } = context;
  const { enabled = true, visibleOnly = true } = options;
  let blockFocus = false;
  let keyboardModality = true;
  return {
    get reference() {
      if (!enabled) {
        return {};
      }
      return {
        onpointerdown: (event) => {
          if (isVirtualPointerEvent(event)) return;
          keyboardModality = false;
        },
        onmouseleave() {
          blockFocus = false;
        },
        onfocus: (event) => {
          if (blockFocus) {
            return;
          }
          const target = getTarget(event);
          if (visibleOnly && isElement(target)) {
            try {
              if (isSafari() && isMac()) throw Error();
              if (!target.matches(":focus-visible")) return;
            } catch {
              if (!keyboardModality && !isTypeableElement(target)) {
                return;
              }
            }
          }
          onOpenChange(true, event, "focus");
        },
        onblur: (event) => {
          blockFocus = false;
          const relatedTarget = event.relatedTarget;
          const movedToFocusGuard = isElement(relatedTarget) && relatedTarget.hasAttribute(createAttribute("focus-guard")) && relatedTarget.getAttribute("data-type") === "outside";
          window.setTimeout(() => {
            const activeEl = activeElement(
              // @ts-expect-error - FIXME
              reference ? reference.ownerDocument : document
            );
            if (!relatedTarget && activeEl === reference) return;
            if (contains(floating, activeEl) || // @ts-expect-error FIXME
            contains(reference, activeEl) || movedToFocusGuard) {
              return;
            }
            onOpenChange(false, event, "focus");
          });
        }
      };
    }
  };
}
function getDelay(value, prop, pointerType) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  return value?.[prop];
}
function useHover(context, options = {}) {
  const {
    open,
    onOpenChange,
    data,
    events,
    elements: { reference, floating }
  } = context;
  const {
    enabled = true,
    mouseOnly = false,
    delay = 0,
    restMs = 0,
    move = true,
    handleClose = null
  } = options;
  let pointerType = void 0;
  let timeout = -1;
  let handler = void 0;
  let restTimeout = -1;
  let blockMouseMove = true;
  let unbindMouseMove = noop;
  (() => {
    const type = data.openEvent?.type;
    return type?.includes("mouse") && type !== "mousedown";
  })();
  const isClickLikeOpenEvent = data.openEvent ? ["click", "mousedown"].includes(data.openEvent.type) : false;
  const closeWithDelay = (event, runElseBranch = true, reason = "hover") => {
    const closeDelay = getDelay(delay, "close", pointerType);
    if (closeDelay && !handler) {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => onOpenChange(false, event, reason), closeDelay);
    } else if (runElseBranch) {
      clearTimeout(timeout);
      onOpenChange(false, event, reason);
    }
  };
  const cleanupMouseMoveHandler = () => {
    unbindMouseMove();
    handler = void 0;
  };
  return {
    get reference() {
      if (!enabled) {
        return {};
      }
      const onmouseenter = (event) => {
        clearTimeout(timeout);
        blockMouseMove = false;
        if (mouseOnly && !isMouseLikePointerType(pointerType) || restMs > 0 && !getDelay(delay, "open")) {
          return;
        }
        const openDelay = getDelay(delay, "open", pointerType);
        if (openDelay) {
          timeout = window.setTimeout(
            () => {
              onOpenChange(true, event, "hover");
            },
            openDelay
          );
        } else {
          onOpenChange(true, event, "hover");
        }
      };
      return {
        onpointerdown: (event) => {
          pointerType = event.pointerType;
        },
        onpointerenter: (event) => {
          pointerType = event.pointerType;
        },
        onmouseenter,
        onmousemove: (event) => {
          if (move) {
            onmouseenter(event);
          }
          function handleMouseMove() {
            if (!blockMouseMove) {
              onOpenChange(true, event, "hover");
            }
          }
          if (mouseOnly && !isMouseLikePointerType(pointerType)) {
            return;
          }
          if (open || restMs === 0) {
            return;
          }
          clearTimeout(restTimeout);
          if (pointerType === "touch") {
            handleMouseMove();
          } else {
            restTimeout = window.setTimeout(handleMouseMove, restMs);
          }
        },
        onmouseleave: (event) => {
          if (!isClickLikeOpenEvent) {
            unbindMouseMove();
            const doc = getDocument(floating);
            clearTimeout(restTimeout);
            if (handleClose) {
              if (!open) {
                clearTimeout(timeout);
              }
              handler = handleClose({
                ...context,
                // tree,
                x: event.clientX,
                y: event.clientY,
                onClose() {
                  cleanupMouseMoveHandler();
                  closeWithDelay(event, true, "safe-polygon");
                }
              });
              const localHandler = handler;
              doc.addEventListener("mousemove", localHandler);
              unbindMouseMove = () => {
                doc.removeEventListener("mousemove", localHandler);
              };
              return;
            }
            const shouldClose = pointerType === "touch" ? !contains(floating, event.relatedTarget) : true;
            if (shouldClose) {
              closeWithDelay(event);
            }
          }
          if (open && !isClickLikeOpenEvent) {
            handleClose?.({
              ...context,
              // tree,
              x: event.clientX,
              y: event.clientY,
              onClose() {
                cleanupMouseMoveHandler();
                closeWithDelay(event);
              }
            })(event);
          }
        }
      };
    },
    get floating() {
      if (!enabled) {
        return {};
      }
      return {
        onmouseenter() {
          clearTimeout(timeout);
        },
        onmouseleave(event) {
          if (!isClickLikeOpenEvent) {
            handleClose?.({
              ...context,
              // tree,
              x: event.clientX,
              y: event.clientY,
              onClose() {
                cleanupMouseMoveHandler();
                closeWithDelay(event);
              }
            })(event);
          }
          closeWithDelay(event, false);
        }
      };
    }
  };
}
const ACTIVE_KEY = "active";
const SELECTED_KEY = "selected";
function mergeProps(userProps, propsList, elementKey) {
  const map = /* @__PURE__ */ new Map();
  const isItem = elementKey === "item";
  let domUserProps = userProps;
  if (isItem && userProps) {
    const { [ACTIVE_KEY]: _, [SELECTED_KEY]: __, ...validProps } = userProps;
    domUserProps = validProps;
  }
  return {
    ...elementKey === "floating" && { tabIndex: -1 },
    ...domUserProps,
    ...propsList.map((value) => {
      const propsOrGetProps = value ? value[elementKey] : null;
      if (typeof propsOrGetProps === "function") {
        return userProps ? propsOrGetProps(userProps) : null;
      }
      return propsOrGetProps;
    }).concat(userProps).reduce(
      (acc, props) => {
        if (!props) {
          return acc;
        }
        for (const [key, value] of Object.entries(props)) {
          if (isItem && [ACTIVE_KEY, SELECTED_KEY].includes(key)) {
            continue;
          }
          if (key.indexOf("on") === 0) {
            if (!map.has(key)) {
              map.set(key, []);
            }
            if (typeof value === "function") {
              map.get(key)?.push(value);
              acc[key] = (...args) => {
                return map.get(key)?.map((fn) => fn(...args)).find((val) => val !== void 0);
              };
            }
          } else {
            acc[key] = value;
          }
        }
        return acc;
      },
      {}
    )
  };
}
function useInteractions(propsList = []) {
  const getReferenceProps = (userProps) => {
    return mergeProps(userProps, propsList, "reference");
  };
  const getFloatingProps = (userProps) => {
    return mergeProps(userProps, propsList, "floating");
  };
  const getItemProps = (userProps) => {
    return mergeProps(userProps, propsList, "item");
  };
  return { getReferenceProps, getFloatingProps, getItemProps };
}
const componentRoleToAriaRoleMap = /* @__PURE__ */ new Map([
  ["select", "listbox"],
  ["combobox", "listbox"],
  ["label", false]
]);
function useRole(context, options = {}) {
  const { open, floatingId } = context;
  const { enabled = true, role = "dialog" } = options;
  const ariaRole = componentRoleToAriaRoleMap.get(role) ?? role;
  const referenceId = useId();
  const parentId = void 0;
  const isNested = parentId != null;
  const floatingProps = { id: floatingId, ...ariaRole && { role: ariaRole } };
  return {
    // @ts-expect-error - variable prop is not specific enough
    get reference() {
      if (!enabled) {
        return {};
      }
      if (ariaRole === "tooltip" || role === "label") {
        return {
          [`aria-${role === "label" ? "labelledby" : "describedby"}`]: open ? floatingId : void 0
        };
      }
      return {
        "aria-expanded": open ? "true" : "false",
        "aria-haspopup": ariaRole === "alertdialog" ? "dialog" : ariaRole,
        "aria-controls": open ? floatingId : void 0,
        ...ariaRole === "listbox" && { role: "combobox" },
        ...ariaRole === "menu" && { id: referenceId },
        ...ariaRole === "menu" && isNested,
        ...role === "select" && { "aria-autocomplete": "none" },
        ...role === "combobox" && { "aria-autocomplete": "list" }
      };
    },
    get floating() {
      if (!enabled) {
        return {};
      }
      if (ariaRole === "tooltip" || role === "label") {
        return floatingProps;
      }
      return {
        ...floatingProps,
        ...ariaRole === "menu" && { "aria-labelledby": referenceId }
      };
    },
    get item() {
      if (!enabled) {
        return {};
      }
      return ({ active, selected }) => {
        const commonProps = {
          role: "option",
          ...active && { id: `${context.floatingId}-option` }
        };
        switch (role) {
          case "select":
            return { ...commonProps, "aria-selected": active && selected };
          case "combobox": {
            return { ...commonProps, ...active && { "aria-selected": true } };
          }
        }
        return {};
      };
    }
  };
}
function Popover($$payload, $$props) {
  push();
  let {
    open = false,
    title,
    message,
    triggerStyle = "",
    triggerTypes = ["click"],
    placement = "top",
    color = "surface",
    size = "text-sm",
    "data-testid": testid = "",
    trigger,
    children,
    onengage = () => {
    }
  } = $$props;
  let elemArrow = null;
  const floating = useFloating({
    whileElementsMounted: autoUpdate,
    get open() {
      return open;
    },
    onOpenChange: (newOpen) => {
      if (newOpen) onengage();
      open = newOpen;
    },
    placement,
    get middleware() {
      return [
        offset(10),
        flip(),
        shift(),
        elemArrow && arrow({ element: elemArrow })
      ];
    }
  });
  const role = useRole(floating.context, { role: "tooltip" });
  const dismiss = useDismiss(floating.context);
  let interactionsToUse = [role, dismiss];
  if (triggerTypes.includes("hover")) {
    const hover = useHover(floating.context, { move: false });
    interactionsToUse.push(hover);
  }
  if (triggerTypes.includes("click")) {
    const click = useClick(floating.context);
    interactionsToUse.push(click);
  }
  if (triggerTypes.includes("focus")) {
    const focus = useFocus(floating.context);
    interactionsToUse.push(focus);
  }
  const interactions = useInteractions(interactionsToUse);
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<button${spread_attributes(
      {
        "data-testid": `${stringify(testid)}-btn`,
        class: `cursor-pointer ${stringify(triggerStyle)}`,
        ...interactions.getReferenceProps()
      },
      null
    )}>`);
    trigger?.($$payload2);
    $$payload2.out.push(`<!----></button> `);
    if (open) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div${spread_attributes(
        {
          class: `popover ${stringify(size)}`,
          "aria-label": title || "Help popover",
          style: `background-color: var(--color-${stringify(color)}-100); opacity: 0.95;${stringify(floating.floatingStyles)}`,
          ...interactions.getFloatingProps(),
          "data-testid": testid
        },
        null
      )}><div>`);
      if (title) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<header class="flex justify-between font-bold text-xl">${escape_html(title)}</header>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (message) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<article>${html(sanitizeHTML(message))}</article>`);
      } else {
        $$payload2.out.push("<!--[!-->");
        children?.($$payload2);
        $$payload2.out.push(`<!---->`);
      }
      $$payload2.out.push(`<!--]--></div> `);
      Floating_arrow($$payload2, {
        context: floating.context,
        fill: `var(--color-${stringify(color)}-200)`,
        get ref() {
          return elemArrow;
        },
        set ref($$value) {
          elemArrow = $$value;
          $$settled = false;
        }
      });
      $$payload2.out.push(`<!----></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]-->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, { open });
  pop();
}

export { Popover as P };
//# sourceMappingURL=Popover-Bb0SyMGZ.js.map
