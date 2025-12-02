import { x as push, V as copy_payload, W as assign_payload, z as pop, U as store_get, X as unsubscribe_stores, Z as bind_props, Q as stringify, a0 as store_set, M as escape_html, N as attr_class, O as attr, S as ensure_array_like, Y as await_block, y as setContext, a1 as spread_props, a2 as attr_style, P as clsx, T as spread_attributes, a3 as hasContext, K as getContext, a4 as store_mutate, R as props_id, a5 as maybe_selected, a6 as element } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import '@sveltejs/kit/internal';
import { l as get } from './utils-D3IkxnGP.js';
import './client2-BVaV_p61.js';
import { T as Toaster, F as Footer } from './Footer-DjD3RTzj.js';
import { t as toaster, L as isUserLoggedIn, p as createAnatomy, N as userRoutes, u as user, i as isLoggedIn, d as createMachine, O as observeAttributes, P as observeChildren } from './User-CeJunCPd.js';
import { r as removeInvalidFilters, f as filterWarning, a as removeGenomicFilters, b as removeUnallowedFilters, c as filters, h as hasGenomicFilter, d as clearFilters, e as advancedFilteringEnabled, g as hasOrGroup, i as disableAdvancedFiltering, j as genomicFilters, k as filterTree, l as genericUUID, O as Operator } from './Filter-DSKDPPqy.js';
import { f as features, b as branding } from './configuration-BAm0JRx1.js';
import { c as createProps, o as onDestroy, L as Loading, u as useMachine, n as normalizeProps } from './Loading-Bei-CWQ1.js';
import { L as Logo } from './Logo-B7GbydQK.js';
import { P as Popover } from './Popover-eIX_ze36.js';
import { e as exports, c as clearExports } from './Export-DV6CwdT5.js';
import { S as Switch } from './Switch-BaHCJXB0.js';
import { c as countsLoading, h as hasNonZeroResult, l as loadPatientCount, r as resultCounts } from './ResultStore-CEb6_EKn.js';
import './GeneFilter-CBqjP8qR.js';
import '@sveltejs/kit';
import { a as Modal, M as Modal_1 } from './Modal-C5zQSBqd.js';
import { A as AddFilter } from './AddFilter-1lfQ-1wP.js';
import { C as CardButton } from './CardButton-DiZN_TIg.js';
import { S as StatPromise, c as countResult } from './StatBuilder-C-7IIq7L.js';
import { H as HelpInfoPopup } from './HelpInfoPopup-DPAVvdpu.js';
import './HTML-1Mhr8hI4.js';
import { p as panelOpen } from './SidePanel-BKc3SKwK.js';
import { o as open, a as activeRow } from './Dashboard-CRYdB654.js';
import { g as getDatasetDetails } from './Dictionary-Cym6J1qH.js';
import { E as ErrorAlert } from './ErrorAlert-BNxDBqzK.js';
import './html2-FW6Ia4bL.js';
import 'uuid';
import '@floating-ui/dom';
import './OptionsSelectionList-B6aTQUlC.js';
import 'dompurify';

function AppBar($$payload, $$props) {
  const {
    // Root
    base = "w-full flex flex-col",
    background = "bg-surface-100-900",
    spaceY = "space-y-4",
    border = "",
    padding = "p-4",
    shadow = "",
    classes = "",
    // Toolbar
    toolbarBase = "flex justify-between",
    toolbarGridCols = "grid-cols-[auto_1fr_auto]",
    toolbarGap = "gap-4",
    toolbarClasses = "",
    // Lead
    leadBase = "flex",
    leadSpaceX = "space-x-4 rtl:space-x-reverse",
    leadPadding = "",
    leadClasses = "",
    // Center
    centerBase = "grow",
    centerAlign = "text-center",
    centerPadding = "",
    centerClasses = "",
    // Trail
    trailBase = "flex",
    trailSpaceX = "space-x-4 rtl:space-x-reverse",
    trailPadding = "",
    trailClasses = "",
    // Headline
    headlineBase = "w-full",
    headlineClasses = "",
    // Snippets
    children,
    lead,
    trail,
    headline
  } = $$props;
  $$payload.out.push(`<header${attr_class(`${stringify(base)} ${stringify(background)} ${stringify(spaceY)} ${stringify(border)} ${stringify(padding)} ${stringify(shadow)} ${stringify(classes)}`)} data-testid="app-bar"><section${attr_class(`${stringify(toolbarBase)} ${stringify(toolbarGridCols)} ${stringify(toolbarGap)} ${stringify(toolbarClasses)}`)} data-testid="app-bar-toolbar">`);
  if (lead) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`${stringify(leadBase)} ${stringify(leadSpaceX)} ${stringify(leadPadding)} ${stringify(leadClasses)}`)}>`);
    lead($$payload);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (children) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`${stringify(centerBase)} ${stringify(centerAlign)} ${stringify(centerPadding)} ${stringify(centerClasses)}`)}>`);
    children($$payload);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (trail) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`${stringify(trailBase)} ${stringify(trailSpaceX)} ${stringify(trailPadding)} ${stringify(trailClasses)}`)}>`);
    trail($$payload);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></section> `);
  if (headline) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<section${attr_class(`${stringify(headlineBase)} ${stringify(headlineClasses)}`)} data-testid="app-bar-headline">`);
    headline($$payload);
    $$payload.out.push(`<!----></section>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></header>`);
}
var anatomy = createAnatomy("avatar").parts("root", "image", "fallback");
var parts = anatomy.build();
var getRootId = (ctx) => ctx.ids?.root ?? `avatar:${ctx.id}`;
var getImageId = (ctx) => ctx.ids?.image ?? `avatar:${ctx.id}:image`;
var getFallbackId = (ctx) => ctx.ids?.fallback ?? `avatar:${ctx.id}:fallback`;
var getRootEl = (ctx) => ctx.getById(getRootId(ctx));
var getImageEl = (ctx) => ctx.getById(getImageId(ctx));
function connect(service, normalize) {
  const { state, send, prop, scope } = service;
  const loaded = state.matches("loaded");
  return {
    loaded,
    setSrc(src) {
      const img = getImageEl(scope);
      img?.setAttribute("src", src);
    },
    setLoaded() {
      send({ type: "img.loaded", src: "api" });
    },
    setError() {
      send({ type: "img.error", src: "api" });
    },
    getRootProps() {
      return normalize.element({
        ...parts.root.attrs,
        dir: prop("dir"),
        id: getRootId(scope)
      });
    },
    getImageProps() {
      return normalize.img({
        ...parts.image.attrs,
        hidden: !loaded,
        dir: prop("dir"),
        id: getImageId(scope),
        "data-state": loaded ? "visible" : "hidden",
        onLoad() {
          send({ type: "img.loaded", src: "element" });
        },
        onError() {
          send({ type: "img.error", src: "element" });
        }
      });
    },
    getFallbackProps() {
      return normalize.element({
        ...parts.fallback.attrs,
        dir: prop("dir"),
        id: getFallbackId(scope),
        hidden: loaded,
        "data-state": loaded ? "hidden" : "visible"
      });
    }
  };
}
var machine = createMachine({
  initialState() {
    return "loading";
  },
  effects: ["trackImageRemoval", "trackSrcChange"],
  on: {
    "src.change": {
      target: "loading"
    },
    "img.unmount": {
      target: "error"
    }
  },
  states: {
    loading: {
      entry: ["checkImageStatus"],
      on: {
        "img.loaded": {
          target: "loaded",
          actions: ["invokeOnLoad"]
        },
        "img.error": {
          target: "error",
          actions: ["invokeOnError"]
        }
      }
    },
    error: {
      on: {
        "img.loaded": {
          target: "loaded",
          actions: ["invokeOnLoad"]
        }
      }
    },
    loaded: {
      on: {
        "img.error": {
          target: "error",
          actions: ["invokeOnError"]
        }
      }
    }
  },
  implementations: {
    actions: {
      invokeOnLoad({ prop }) {
        prop("onStatusChange")?.({ status: "loaded" });
      },
      invokeOnError({ prop }) {
        prop("onStatusChange")?.({ status: "error" });
      },
      checkImageStatus({ send, scope }) {
        const imageEl = getImageEl(scope);
        if (!imageEl?.complete) return;
        const type = hasLoaded(imageEl) ? "img.loaded" : "img.error";
        send({ type, src: "ssr" });
      }
    },
    effects: {
      trackImageRemoval({ send, scope }) {
        const rootEl = getRootEl(scope);
        return observeChildren(rootEl, {
          callback(records) {
            const removedNodes = Array.from(records[0].removedNodes);
            const removed = removedNodes.find(
              (node) => node.nodeType === Node.ELEMENT_NODE && node.matches("[data-scope=avatar][data-part=image]")
            );
            if (removed) {
              send({ type: "img.unmount" });
            }
          }
        });
      },
      trackSrcChange({ send, scope }) {
        const imageEl = getImageEl(scope);
        return observeAttributes(imageEl, {
          attributes: ["src", "srcset"],
          callback() {
            send({ type: "src.change" });
          }
        });
      }
    }
  }
});
function hasLoaded(image) {
  return image.complete && image.naturalWidth !== 0 && image.naturalHeight !== 0;
}
createProps()(["dir", "id", "ids", "onStatusChange", "getRootNode"]);
function Avatar($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    src,
    srcset,
    name,
    initials = [0, -1],
    base = "overflow-hidden isolate",
    background = "bg-surface-400-600",
    size = "size-16",
    font = "",
    border = "",
    rounded = "rounded-full",
    shadow = "",
    classes = "",
    imageBase = "w-full object-cover",
    imageClasses = "",
    style = "",
    fallbackBase = "w-full h-full flex justify-center items-center",
    fallbackClasses = "",
    children,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  function getInitials() {
    const lettersArr = initials.map((index) => name.split(" ").at(index)?.charAt(0).toUpperCase());
    return lettersArr.join("");
  }
  $$payload.out.push(`<figure${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(background)} ${stringify(size)} ${stringify(font)} ${stringify(border)} ${stringify(rounded)} ${stringify(shadow)} ${stringify(classes)}`,
      style,
      "data-testid": "avatar"
    },
    null
  )}><span${spread_attributes(
    {
      ...api.getFallbackProps(),
      class: `${stringify(fallbackBase)} ${stringify(fallbackClasses)}`,
      "data-testid": "avatar-fallback"
    },
    null
  )}>`);
  if (children) {
    $$payload.out.push("<!--[-->");
    children($$payload);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`${escape_html(getInitials())}`);
  }
  $$payload.out.push(`<!--]--></span> `);
  if (src || srcset) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<img${spread_attributes(
      {
        ...api.getImageProps(),
        src,
        srcset,
        alt: name,
        class: `${stringify(imageBase)} ${stringify(imageClasses)}`,
        "data-testid": "avatar-image"
      },
      null
    )} onload="this.__e=event" onerror="this.__e=event"/>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></figure>`);
  pop();
}
function Shell($$payload, $$props) {
  push();
  let showShell = features.login.open || !features.login.open && isUserLoggedIn();
  const { header, sidebarRight, pageFooter, children } = $$props;
  if (showShell) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div style="display: contents"><main class="w-full h-full"><div id="appShell" class="w-full h-full flex flex-col overflow-hidden" data-testid="app-shell">`);
    header?.($$payload);
    $$payload.out.push(`<!----> <div class="flex-auto w-full h-full flex overflow-hidden"><div id="page" class="flex-1 overflow-x-hidden flex flex-col"><main id="page-content" class="flex-auto">`);
    children?.($$payload);
    $$payload.out.push(`<!----></main> <footer id="page-footer" class="flex-none">`);
    pageFooter?.($$payload);
    $$payload.out.push(`<!----></footer></div> `);
    sidebarRight?.($$payload);
    $$payload.out.push(`<!----></div></div></main></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function Navigation($$payload, $$props) {
  push();
  var $$store_subs;
  function getId({ path, id }) {
    return `nav-link` + (id ? `-` + id : path.replaceAll("/", "-"));
  }
  let currentPage = (route) => {
    if (route.children) {
      for (const child of route.children) {
        if (page.url.pathname.includes(child.path)) {
          return "page";
        }
      }
      return void 0;
    }
    return page.url.pathname.includes(route.path) ? "page" : void 0;
  };
  {
    let lead = function($$payload2) {
      $$payload2.out.push(`<a href="/" aria-current="page" data-testid="logo-home-link" class="content-center">`);
      Logo($$payload2, { height: 4, class: "mx-1" });
      $$payload2.out.push(`<!----></a>`);
    }, trail = function($$payload2) {
      $$payload2.out.push(`<div id="user-session-avatar" class="content-center">`);
      if (store_get($$store_subs ??= {}, "$user", user) && store_get($$store_subs ??= {}, "$user", user).privileges && store_get($$store_subs ??= {}, "$user", user).email && store_get($$store_subs ??= {}, "$isLoggedIn", isLoggedIn)) {
        $$payload2.out.push("<!--[-->");
        {
          let trigger = function($$payload3) {
            Avatar($$payload3, {
              name: (store_get($$store_subs ??= {}, "$user", user).email || "").toUpperCase(),
              background: "preset-tonal-primary hover:preset-tonal-secondary",
              border: "border hover:border-primary-400",
              font: "text-2xl",
              size: "size-12",
              classes: "m-3"
            });
          };
          Popover($$payload2, {
            trigger,
            children: ($$payload3) => {
              $$payload3.out.push(`<div class="flex flex-col items-center"><p class="pb-6">${escape_html(store_get($$store_subs ??= {}, "$user", user).email)}</p> <button id="user-logout-btn" class="btn preset-filled-primary-500 w-fit" title="Logout">Logout</button></div>`);
            },
            $$slots: { trigger: true, default: true }
          });
        }
      } else {
        $$payload2.out.push("<!--[!-->");
        $$payload2.out.push(`<button id="user-login-btn" title="Login" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Login</button>`);
      }
      $$payload2.out.push(`<!--]--></div>`);
    };
    AppBar($$payload, {
      padding: "py-0 pl-2 pr-5",
      background: "bg-surface-50-950",
      toolbarClasses: "flex-none z-10",
      lead,
      trail,
      children: ($$payload2) => {
        const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$userRoutes", userRoutes));
        $$payload2.out.push(`<nav id="page-navigation"><ul><!--[-->`);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let route = each_array[$$index];
          $$payload2.out.push(`<li><a class="nav-link"${attr("id", getId(route))}${attr("href", route.path)}${attr("aria-current", currentPage(route))}>${escape_html(route.text)}</a></li>`);
        }
        $$payload2.out.push(`<!--]--></ul></nav>`);
      }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ViewAnyRecordOfFilter($$payload, $$props) {
  push();
  let { filter } = $$props;
  $$payload.out.push(`<div data-testid="any-record-of-filter-modal"><header><h1 class="text-lg font-normal">${escape_html(`${filter?.concepts?.length} variable(s) in ${filter.searchResult?.display || filter.searchResult?.name || filter.variableName} category`)}</h1></header> `);
  if (filter.filterType === "AnyRecordOf") {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(filter.concepts);
    $$payload.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let concept = each_array[$$index];
      $$payload.out.push(`<div>${escape_html(concept)}</div>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`No filter provided`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function useCombinedRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => ref(node));
  };
}
function useLazyMemo(fn) {
  let current = void 0;
  return {
    get current() {
      return current;
    }
  };
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
const BoxSymbol = Symbol("box");
const isWritableSymbol = Symbol("is-writable");
function isBox(value) {
  return isObject(value) && BoxSymbol in value;
}
function isWritableBox(value) {
  return box.isBox(value) && isWritableSymbol in value;
}
function box(initialValue) {
  let current = initialValue;
  return {
    [BoxSymbol]: true,
    [isWritableSymbol]: true,
    get current() {
      return current;
    },
    set current(v) {
      current = v;
    }
  };
}
function boxWith(getter, setter) {
  const derived = getter();
  if (setter) {
    return {
      [BoxSymbol]: true,
      [isWritableSymbol]: true,
      get current() {
        return derived;
      },
      set current(v) {
        setter(v);
      }
    };
  }
  return {
    [BoxSymbol]: true,
    get current() {
      return getter();
    }
  };
}
function boxFrom(value) {
  if (box.isBox(value)) return value;
  if (isFunction(value)) return box.with(value);
  return box(value);
}
function boxFlatten(boxes) {
  return Object.entries(boxes).reduce(
    (acc, [key, b]) => {
      if (!box.isBox(b)) {
        return Object.assign(acc, { [key]: b });
      }
      if (box.isWritableBox(b)) {
        Object.defineProperty(acc, key, {
          get() {
            return b.current;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set(v) {
            b.current = v;
          }
        });
      } else {
        Object.defineProperty(acc, key, {
          get() {
            return b.current;
          }
        });
      }
      return acc;
    },
    {}
  );
}
function toReadonlyBox(b) {
  if (!box.isWritableBox(b)) return b;
  return {
    [BoxSymbol]: true,
    get current() {
      return b.current;
    }
  };
}
box.from = boxFrom;
box.with = boxWith;
box.flatten = boxFlatten;
box.readonly = toReadonlyBox;
box.isBox = isBox;
box.isWritableBox = isWritableBox;
function createParser(matcher, replacer) {
  const regex = RegExp(matcher, "g");
  return (str) => {
    if (typeof str !== "string") {
      throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
    }
    if (!str.match(regex))
      return str;
    return str.replace(regex, replacer);
  };
}
const camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
  if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) {
    throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
  }
  return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
function styleToString(style = {}) {
  return styleToCSS(style).replace("\n", " ");
}
const srOnlyStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
  transform: "translateX(-100%)"
};
styleToString(srOnlyStyles);
const defaultWindow = void 0;
function getActiveElement(document2) {
  let activeElement = document2.activeElement;
  while (activeElement?.shadowRoot) {
    const node = activeElement.shadowRoot.activeElement;
    if (node === activeElement)
      break;
    else
      activeElement = node;
  }
  return activeElement;
}
function createSubscriber(_) {
  return () => {
  };
}
class ActiveElement {
  #document;
  #subscribe;
  constructor(options = {}) {
    const { window: window2 = defaultWindow, document: document2 = window2?.document } = options;
    if (window2 === void 0) return;
    this.#document = document2;
    this.#subscribe = createSubscriber();
  }
  get current() {
    this.#subscribe?.();
    if (!this.#document) return null;
    return getActiveElement(this.#document);
  }
}
new ActiveElement();
function runWatcher(sources, flush, effect, options = {}) {
  const { lazy = false } = options;
}
function watch(sources, effect, options) {
  runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
  runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
function useNodeRef(onChange) {
  let node = null;
  const setNodeRef = (element2) => {
    if (element2 !== node) {
      onChange?.(element2, node);
    }
    node = element2;
  };
  return [box.with(() => node, setNodeRef), setNodeRef];
}
const ids = {};
function useUniqueId(prefix, value) {
  if (value) {
    return value;
  }
  const id = ids[prefix] == null ? 0 : ids[prefix] + 1;
  ids[prefix] = id;
  return `${prefix}-${id}`;
}
function createAdjustmentFn(modifier) {
  return (object, ...adjustments) => {
    return adjustments.reduce((accumulator, adjustment) => {
      const entries = Object.entries(adjustment);
      for (const [key, valueAdjustment] of entries) {
        const value = accumulator[key];
        if (value != null) {
          accumulator[key] = value + modifier * valueAdjustment;
        }
      }
      return accumulator;
    }, {
      ...object
    });
  };
}
const add = createAdjustmentFn(1);
const subtract = createAdjustmentFn(-1);
function hasViewportRelativeCoordinates(event) {
  return "clientX" in event && "clientY" in event;
}
const canUseDOM = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
function isWindow(element2) {
  const elementString = Object.prototype.toString.call(element2);
  return elementString === "[object Window]" || // In Electron context the Window object serializes to [object global]
  elementString === "[object global]";
}
function isNode(node) {
  return "nodeType" in node;
}
function getWindow(target) {
  if (!target) {
    return window;
  }
  if (isWindow(target)) {
    return target;
  }
  if (!isNode(target)) {
    return window;
  }
  return target.ownerDocument?.defaultView ?? window;
}
function isDocument(node) {
  const { Document } = getWindow(node);
  return node instanceof Document;
}
function isHTMLElement(node) {
  if (isWindow(node)) {
    return false;
  }
  return node instanceof getWindow(node).HTMLElement;
}
function isSVGElement(node) {
  return node instanceof getWindow(node).SVGElement;
}
function getOwnerDocument(target) {
  if (!target) {
    return document;
  }
  if (isWindow(target)) {
    return target.document;
  }
  if (!isNode(target)) {
    return document;
  }
  if (isDocument(target)) {
    return target;
  }
  if (isHTMLElement(target) || isSVGElement(target)) {
    return target.ownerDocument;
  }
  return document;
}
function isKeyboardEvent(event) {
  if (!event) {
    return false;
  }
  const { KeyboardEvent } = getWindow(event.target);
  return KeyboardEvent && event instanceof KeyboardEvent;
}
function isTouchEvent(event) {
  if (!event) {
    return false;
  }
  const { TouchEvent } = getWindow(event.target);
  return TouchEvent && event instanceof TouchEvent;
}
function getEventCoordinates(event) {
  if (isTouchEvent(event)) {
    if (event.touches && event.touches.length) {
      const { clientX: x, clientY: y } = event.touches[0];
      return {
        x,
        y
      };
    } else if (event.changedTouches && event.changedTouches.length) {
      const { clientX: x, clientY: y } = event.changedTouches[0];
      return {
        x,
        y
      };
    }
  }
  if (hasViewportRelativeCoordinates(event)) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }
  return null;
}
const CSS = Object.freeze({
  Translate: {
    toString(transform) {
      if (!transform) {
        return;
      }
      const { x, y } = transform;
      return `translate3d(${x ? Math.round(x) : 0}px, ${y ? Math.round(y) : 0}px, 0)`;
    }
  },
  Scale: {
    toString(transform) {
      if (!transform) {
        return;
      }
      const { scaleX, scaleY } = transform;
      return `scaleX(${scaleX}) scaleY(${scaleY})`;
    }
  },
  Transform: {
    toString(transform) {
      if (!transform) {
        return;
      }
      return [CSS.Translate.toString(transform), CSS.Scale.toString(transform)].join(" ");
    }
  },
  Transition: {
    toString({ property, duration, easing }) {
      return `${property} ${duration}ms ${easing}`;
    }
  }
});
function styleObjectToString(styleObj) {
  return Object.entries(styleObj).filter(([, value]) => value !== void 0).map(([key, value]) => {
    const unitlessProps = ["opacity", "zIndex", "fontWeight", "lineHeight", "order", "flexGrow", "flexShrink"];
    const formattedValue = typeof value === "number" && !unitlessProps.includes(key) ? `${value}px` : value;
    return `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${formattedValue}`;
  }).join(";");
}
function unwrapResolvable(value) {
  return typeof value === "function" ? value() : value;
}
function unwrapResolvableObject(obj) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, unwrapResolvable(value)]));
}
function useDndMonitorProvider() {
  const listeners = /* @__PURE__ */ new Set();
  const registerListener = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const dispatch = ({ type, event }) => {
    listeners.forEach((listener) => listener[type]?.(event));
  };
  return [dispatch, registerListener];
}
const DndMonitorContextKey = Symbol("DndMonitorContext");
function useDndMonitorContext() {
  if (!hasContext(DndMonitorContextKey))
    return null;
  return getContext(DndMonitorContextKey);
}
function useDndMonitor(listener) {
  useDndMonitorContext();
}
const defaultScreenReaderInstructions = {
  draggable: `
    To pick up a draggable item, press the space bar.
    While dragging, use the arrow keys to move the item.
    Press space again to drop the item in its new position, or press escape to cancel.
  `
};
const defaultAnnouncements = {
  onDragStart({ active }) {
    return `Picked up draggable item ${active.id}.`;
  },
  onDragOver({ active, over }) {
    if (over) {
      return `Draggable item ${active.id} was moved over droppable area ${over.id}.`;
    }
    return `Draggable item ${active.id} is no longer over a droppable area.`;
  },
  onDragEnd({ active, over }) {
    if (over) {
      return `Draggable item ${active.id} was dropped over droppable area ${over.id}`;
    }
    return `Draggable item ${active.id} was dropped.`;
  },
  onDragCancel({ active }) {
    return `Dragging was cancelled. Draggable item ${active.id} was dropped.`;
  }
};
function Accessibility($$payload, $$props) {
  push();
  let {
    announcements = defaultAnnouncements,
    container,
    hiddenTextDescribedById,
    screenReaderInstructions = defaultScreenReaderInstructions
  } = $$props;
  useUniqueId(`DndLiveRegion`);
  useDndMonitor();
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function useSensor(sensor, options) {
  return {
    sensor,
    options: options ?? {}
  };
}
function useSensors(...sensors) {
  return sensors.filter((sensor) => sensor != null);
}
const defaultCoordinates = Object.freeze({
  x: 0,
  y: 0
});
function getRelativeTransformOrigin(event, rect) {
  const eventCoordinates = getEventCoordinates(event);
  if (!eventCoordinates) {
    return "0 0";
  }
  const transformOrigin = {
    x: (eventCoordinates.x - rect.left) / rect.width * 100,
    y: (eventCoordinates.y - rect.top) / rect.height * 100
  };
  return `${transformOrigin.x}% ${transformOrigin.y}%`;
}
function sortCollisionsDesc({ data: { value: a } }, { data: { value: b } }) {
  return b - a;
}
function getFirstCollision(collisions, property) {
  if (!collisions || collisions.length === 0) {
    return null;
  }
  const [firstCollision] = collisions;
  return firstCollision[property];
}
function getIntersectionRatio(entry, target) {
  const top = Math.max(target.top, entry.top);
  const left = Math.max(target.left, entry.left);
  const right = Math.min(target.left + target.width, entry.left + entry.width);
  const bottom = Math.min(target.top + target.height, entry.top + entry.height);
  const width = right - left;
  const height = bottom - top;
  if (left < right && top < bottom) {
    const targetArea = target.width * target.height;
    const entryArea = entry.width * entry.height;
    const intersectionArea = width * height;
    const intersectionRatio = intersectionArea / (targetArea + entryArea - intersectionArea);
    return Number(intersectionRatio.toFixed(4));
  }
  return 0;
}
const rectIntersection = ({ collisionRect, droppableRects, droppableContainers }) => {
  const collisions = [];
  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);
    if (rect) {
      const intersectionRatio = getIntersectionRatio(rect, collisionRect);
      if (intersectionRatio > 0) {
        collisions.push({
          id,
          data: { droppableContainer, value: intersectionRatio }
        });
      }
    }
  }
  return collisions.sort(sortCollisionsDesc);
};
function adjustScale(transform, rect1, rect2) {
  return {
    ...transform,
    scaleX: rect1 && rect2 ? rect1.width / rect2.width : 1,
    scaleY: rect1 && rect2 ? rect1.height / rect2.height : 1
  };
}
function getRectDelta(rect1, rect2) {
  return rect1 && rect2 ? {
    x: rect1.left - rect2.left,
    y: rect1.top - rect2.top
  } : defaultCoordinates;
}
function createRectAdjustmentFn(modifier) {
  return function adjustClientRect(rect, ...adjustments) {
    return adjustments.reduce((acc, adjustment) => ({
      ...acc,
      top: acc.top + modifier * adjustment.y,
      bottom: acc.bottom + modifier * adjustment.y,
      left: acc.left + modifier * adjustment.x,
      right: acc.right + modifier * adjustment.x
    }), { ...rect });
  };
}
const getAdjustedRect = createRectAdjustmentFn(1);
function parseTransform(transform) {
  if (transform.startsWith("matrix3d(")) {
    const transformArray = transform.slice(9, -1).split(/, /);
    return {
      x: +transformArray[12],
      y: +transformArray[13],
      scaleX: +transformArray[0],
      scaleY: +transformArray[5]
    };
  } else if (transform.startsWith("matrix(")) {
    const transformArray = transform.slice(7, -1).split(/, /);
    return {
      x: +transformArray[4],
      y: +transformArray[5],
      scaleX: +transformArray[0],
      scaleY: +transformArray[3]
    };
  }
  return null;
}
function inverseTransform(rect, transform, transformOrigin) {
  const parsedTransform = parseTransform(transform);
  if (!parsedTransform) {
    return rect;
  }
  const { scaleX, scaleY, x: translateX, y: translateY } = parsedTransform;
  const x = rect.left - translateX - (1 - scaleX) * parseFloat(transformOrigin);
  const y = rect.top - translateY - (1 - scaleY) * parseFloat(transformOrigin.slice(transformOrigin.indexOf(" ") + 1));
  const w = scaleX ? rect.width / scaleX : rect.width;
  const h = scaleY ? rect.height / scaleY : rect.height;
  return {
    width: w,
    height: h,
    top: y,
    right: x + w,
    bottom: y + h,
    left: x
  };
}
const defaultOptions = { ignoreTransform: false };
function getClientRect(element2, options = defaultOptions) {
  let rect = element2.getBoundingClientRect();
  if (options.ignoreTransform) {
    const { transform, transformOrigin } = getWindow(element2).getComputedStyle(element2);
    if (transform) {
      rect = inverseTransform(rect, transform, transformOrigin);
    }
  }
  const { top, left, width, height, bottom, right } = rect;
  return {
    top,
    left,
    width,
    height,
    bottom,
    right
  };
}
function getTransformAgnosticClientRect(element2) {
  return getClientRect(element2, { ignoreTransform: true });
}
function getWindowClientRect(element2) {
  const width = element2.innerWidth;
  const height = element2.innerHeight;
  return {
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height
  };
}
function isFixed(node, computedStyle = getWindow(node).getComputedStyle(node)) {
  return computedStyle.position === "fixed";
}
function isScrollable(element2, computedStyle = getWindow(element2).getComputedStyle(element2)) {
  const overflowRegex = /(auto|scroll|overlay)/;
  const properties2 = ["overflow", "overflowX", "overflowY"];
  return properties2.some((property) => {
    const value = computedStyle[property];
    return typeof value === "string" ? overflowRegex.test(value) : false;
  });
}
function getScrollableAncestors(element2, limit) {
  const scrollParents = [];
  function findScrollableAncestors(node) {
    if (limit != null && scrollParents.length >= limit) {
      return scrollParents;
    }
    if (!node) {
      return scrollParents;
    }
    if (isDocument(node) && node.scrollingElement != null && !scrollParents.includes(node.scrollingElement)) {
      scrollParents.push(node.scrollingElement);
      return scrollParents;
    }
    if (!isHTMLElement(node) || isSVGElement(node)) {
      return scrollParents;
    }
    if (scrollParents.includes(node)) {
      return scrollParents;
    }
    const computedStyle = getWindow(element2).getComputedStyle(node);
    if (node !== element2) {
      if (isScrollable(node, computedStyle)) {
        scrollParents.push(node);
      }
    }
    if (isFixed(node, computedStyle)) {
      return scrollParents;
    }
    return findScrollableAncestors(node.parentNode);
  }
  if (!element2) {
    return scrollParents;
  }
  return findScrollableAncestors(element2);
}
function getFirstScrollableAncestor(node) {
  const [firstScrollableAncestor] = getScrollableAncestors(node, 1);
  return firstScrollableAncestor ?? null;
}
function getScrollXCoordinate(element2) {
  if (isWindow(element2)) {
    return element2.scrollX;
  }
  return element2.scrollLeft;
}
function getScrollYCoordinate(element2) {
  if (isWindow(element2)) {
    return element2.scrollY;
  }
  return element2.scrollTop;
}
function getScrollCoordinates(element2) {
  return {
    x: getScrollXCoordinate(element2),
    y: getScrollYCoordinate(element2)
  };
}
var Direction;
(function(Direction2) {
  Direction2[Direction2["Forward"] = 1] = "Forward";
  Direction2[Direction2["Backward"] = -1] = "Backward";
})(Direction || (Direction = {}));
function isDocumentScrollingElement(element2) {
  if (!canUseDOM || !element2) {
    return false;
  }
  return element2 === document.scrollingElement;
}
function getScrollPosition(scrollingContainer) {
  const minScroll = {
    x: 0,
    y: 0
  };
  const dimensions = isDocumentScrollingElement(scrollingContainer) ? {
    height: window.innerHeight,
    width: window.innerWidth
  } : {
    height: scrollingContainer.clientHeight,
    width: scrollingContainer.clientWidth
  };
  const maxScroll = {
    x: scrollingContainer.scrollWidth - dimensions.width,
    y: scrollingContainer.scrollHeight - dimensions.height
  };
  const isTop = scrollingContainer.scrollTop <= minScroll.y;
  const isLeft = scrollingContainer.scrollLeft <= minScroll.x;
  const isBottom = scrollingContainer.scrollTop >= maxScroll.y;
  const isRight = scrollingContainer.scrollLeft >= maxScroll.x;
  return {
    isTop,
    isLeft,
    isBottom,
    isRight,
    maxScroll,
    minScroll
  };
}
function getScrollElementRect(element2) {
  if (element2 === document.scrollingElement) {
    const { innerWidth, innerHeight } = window;
    return {
      top: 0,
      left: 0,
      right: innerWidth,
      bottom: innerHeight,
      width: innerWidth,
      height: innerHeight
    };
  }
  const { top, left, right, bottom } = element2.getBoundingClientRect();
  return {
    top,
    left,
    right,
    bottom,
    width: element2.clientWidth,
    height: element2.clientHeight
  };
}
function getScrollOffsets(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return add(acc, getScrollCoordinates(node));
  }, defaultCoordinates);
}
function getScrollXOffset(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return acc + getScrollXCoordinate(node);
  }, 0);
}
function getScrollYOffset(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return acc + getScrollYCoordinate(node);
  }, 0);
}
function scrollIntoViewIfNeeded(element2, measure = getClientRect) {
  if (!element2) {
    return;
  }
  const { top, left, bottom, right } = measure(element2);
  const firstScrollableAncestor = getFirstScrollableAncestor(element2);
  if (!firstScrollableAncestor) {
    return;
  }
  if (bottom <= 0 || right <= 0 || top >= window.innerHeight || left >= window.innerWidth) {
    element2.scrollIntoView({
      block: "center",
      inline: "center"
    });
  }
}
const properties = [
  ["x", ["left", "right"], getScrollXOffset],
  ["y", ["top", "bottom"], getScrollYOffset]
];
class Rect {
  constructor(rect, element2) {
    const scrollableAncestors = getScrollableAncestors(element2);
    const scrollOffsets = getScrollOffsets(scrollableAncestors);
    this.rect = { ...rect };
    this.width = rect.width;
    this.height = rect.height;
    for (const [axis, keys, getScrollOffset] of properties) {
      for (const key of keys) {
        Object.defineProperty(this, key, {
          get: () => {
            const currentOffsets = getScrollOffset(scrollableAncestors);
            const scrollOffsetsDeltla = scrollOffsets[axis] - currentOffsets;
            return this.rect[key] + scrollOffsetsDeltla;
          },
          enumerable: true
        });
      }
    }
    Object.defineProperty(this, "rect", { enumerable: false });
  }
  rect;
  width;
  height;
  // The below properties are set by the `Object.defineProperty` calls in the constructor
  // @ts-expect-error Property has no initializer and is not definitely assigned in the constructor
  top;
  // @ts-expect-error Property has no initializer and is not definitely assigned in the constructor
  bottom;
  // @ts-expect-error Property has no initializer and is not definitely assigned in the constructor
  right;
  // @ts-expect-error Property has no initializer and is not definitely assigned in the constructor
  left;
}
function noop(..._args) {
}
class Listeners {
  target;
  listeners = [];
  constructor(target) {
    this.target = target;
  }
  add(eventName, handler, options) {
    this.target?.addEventListener(eventName, handler, options);
    this.listeners.push([eventName, handler, options]);
  }
  removeAll = () => {
    this.listeners.forEach((listener) => this.target?.removeEventListener(...listener));
  };
}
function getEventListenerTarget(target) {
  const { EventTarget } = getWindow(target);
  return target instanceof EventTarget ? target : getOwnerDocument(target);
}
function hasExceededDistance(delta, measurement) {
  const dx = Math.abs(delta.x);
  const dy = Math.abs(delta.y);
  if (typeof measurement === "number") {
    return Math.sqrt(dx ** 2 + dy ** 2) > measurement;
  }
  if ("x" in measurement && "y" in measurement) {
    return dx > measurement.x && dy > measurement.y;
  }
  if ("x" in measurement) {
    return dx > measurement.x;
  }
  if ("y" in measurement) {
    return dy > measurement.y;
  }
  return false;
}
var EventName;
(function(EventName2) {
  EventName2["Click"] = "click";
  EventName2["DragStart"] = "dragstart";
  EventName2["Keydown"] = "keydown";
  EventName2["ContextMenu"] = "contextmenu";
  EventName2["Resize"] = "resize";
  EventName2["SelectionChange"] = "selectionchange";
  EventName2["VisibilityChange"] = "visibilitychange";
})(EventName || (EventName = {}));
function preventDefault(event) {
  event.preventDefault();
}
function stopPropagation(event) {
  event.stopPropagation();
}
var KeyboardCode;
(function(KeyboardCode2) {
  KeyboardCode2["Space"] = "Space";
  KeyboardCode2["Down"] = "ArrowDown";
  KeyboardCode2["Right"] = "ArrowRight";
  KeyboardCode2["Left"] = "ArrowLeft";
  KeyboardCode2["Up"] = "ArrowUp";
  KeyboardCode2["Esc"] = "Escape";
  KeyboardCode2["Enter"] = "Enter";
  KeyboardCode2["Tab"] = "Tab";
})(KeyboardCode || (KeyboardCode = {}));
const defaultKeyboardCodes = {
  start: [KeyboardCode.Space, KeyboardCode.Enter],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab]
};
const defaultKeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  switch (event.code) {
    case KeyboardCode.Right:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x + 25
      };
    case KeyboardCode.Left:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x - 25
      };
    case KeyboardCode.Down:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + 25
      };
    case KeyboardCode.Up:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - 25
      };
  }
  return void 0;
};
class KeyboardSensor {
  props;
  autoScrollEnabled = false;
  referenceCoordinates;
  listeners;
  windowListeners;
  constructor(props) {
    this.props = props;
    const { event: { target } } = props;
    this.props = props;
    this.listeners = new Listeners(getOwnerDocument(target));
    this.windowListeners = new Listeners(getWindow(target));
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.attach();
  }
  attach() {
    this.handleStart();
    this.windowListeners.add(EventName.Resize, this.handleCancel);
    this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
    setTimeout(() => this.listeners.add(EventName.Keydown, this.handleKeyDown));
  }
  handleStart() {
    const { activeNode, onStart } = this.props;
    const node = activeNode.node;
    if (node) {
      scrollIntoViewIfNeeded(node);
    }
    onStart(defaultCoordinates);
  }
  handleKeyDown(event) {
    if (isKeyboardEvent(event)) {
      const { active, context, options } = this.props;
      const { keyboardCodes = defaultKeyboardCodes, coordinateGetter = defaultKeyboardCoordinateGetter, scrollBehavior = "smooth" } = options;
      const { code } = event;
      if (keyboardCodes.end.includes(code)) {
        this.handleEnd(event);
        return;
      }
      if (keyboardCodes.cancel.includes(code)) {
        this.handleCancel(event);
        return;
      }
      const { collisionRect } = context;
      const currentCoordinates = collisionRect ? { x: collisionRect.left, y: collisionRect.top } : defaultCoordinates;
      if (!this.referenceCoordinates) {
        this.referenceCoordinates = currentCoordinates;
      }
      const newCoordinates = coordinateGetter(event, {
        active,
        context,
        currentCoordinates
      });
      if (newCoordinates) {
        const coordinatesDelta = subtract(newCoordinates, currentCoordinates);
        const scrollDelta = {
          x: 0,
          y: 0
        };
        const { scrollableAncestors } = context;
        for (const scrollContainer of scrollableAncestors) {
          const direction = event.code;
          const { isTop, isRight, isLeft, isBottom, maxScroll, minScroll } = getScrollPosition(scrollContainer);
          const scrollElementRect = getScrollElementRect(scrollContainer);
          const clampedCoordinates = {
            x: Math.min(direction === KeyboardCode.Right ? scrollElementRect.right - scrollElementRect.width / 2 : scrollElementRect.right, Math.max(direction === KeyboardCode.Right ? scrollElementRect.left : scrollElementRect.left + scrollElementRect.width / 2, newCoordinates.x)),
            y: Math.min(direction === KeyboardCode.Down ? scrollElementRect.bottom - scrollElementRect.height / 2 : scrollElementRect.bottom, Math.max(direction === KeyboardCode.Down ? scrollElementRect.top : scrollElementRect.top + scrollElementRect.height / 2, newCoordinates.y))
          };
          const canScrollX = direction === KeyboardCode.Right && !isRight || direction === KeyboardCode.Left && !isLeft;
          const canScrollY = direction === KeyboardCode.Down && !isBottom || direction === KeyboardCode.Up && !isTop;
          if (canScrollX && clampedCoordinates.x !== newCoordinates.x) {
            const newScrollCoordinates = scrollContainer.scrollLeft + coordinatesDelta.x;
            const canScrollToNewCoordinates = direction === KeyboardCode.Right && newScrollCoordinates <= maxScroll.x || direction === KeyboardCode.Left && newScrollCoordinates >= minScroll.x;
            if (canScrollToNewCoordinates && !coordinatesDelta.y) {
              scrollContainer.scrollTo({
                left: newScrollCoordinates,
                behavior: scrollBehavior
              });
              return;
            }
            if (canScrollToNewCoordinates) {
              scrollDelta.x = scrollContainer.scrollLeft - newScrollCoordinates;
            } else {
              scrollDelta.x = direction === KeyboardCode.Right ? scrollContainer.scrollLeft - maxScroll.x : scrollContainer.scrollLeft - minScroll.x;
            }
            if (scrollDelta.x) {
              scrollContainer.scrollBy({
                left: -scrollDelta.x,
                behavior: scrollBehavior
              });
            }
            break;
          } else if (canScrollY && clampedCoordinates.y !== newCoordinates.y) {
            const newScrollCoordinates = scrollContainer.scrollTop + coordinatesDelta.y;
            const canScrollToNewCoordinates = direction === KeyboardCode.Down && newScrollCoordinates <= maxScroll.y || direction === KeyboardCode.Up && newScrollCoordinates >= minScroll.y;
            if (canScrollToNewCoordinates && !coordinatesDelta.x) {
              scrollContainer.scrollTo({
                top: newScrollCoordinates,
                behavior: scrollBehavior
              });
              return;
            }
            if (canScrollToNewCoordinates) {
              scrollDelta.y = scrollContainer.scrollTop - newScrollCoordinates;
            } else {
              scrollDelta.y = direction === KeyboardCode.Down ? scrollContainer.scrollTop - maxScroll.y : scrollContainer.scrollTop - minScroll.y;
            }
            if (scrollDelta.y) {
              scrollContainer.scrollBy({
                top: -scrollDelta.y,
                behavior: scrollBehavior
              });
            }
            break;
          }
        }
        this.handleMove(event, add(subtract(newCoordinates, this.referenceCoordinates), scrollDelta));
      }
    }
  }
  handleMove(event, coordinates) {
    const { onMove } = this.props;
    event.preventDefault();
    onMove(coordinates);
  }
  handleEnd(event) {
    const { onEnd } = this.props;
    event.preventDefault();
    this.detach();
    onEnd();
  }
  handleCancel(event) {
    const { onCancel } = this.props;
    event.preventDefault();
    this.detach();
    onCancel();
  }
  detach() {
    this.listeners.removeAll();
    this.windowListeners.removeAll();
  }
  static activators = [
    {
      eventName: "onkeydown",
      handler: (event, { keyboardCodes = defaultKeyboardCodes, onActivation }, { active }) => {
        const { code } = event;
        if (keyboardCodes.start.includes(code)) {
          const activator = active.activatorNode;
          if (activator && event.target !== activator) {
            return false;
          }
          event.preventDefault();
          onActivation?.({ event });
          return true;
        }
        return false;
      }
    }
  ];
}
function isDistanceConstraint(constraint) {
  return Boolean(constraint && "distance" in constraint);
}
function isDelayConstraint(constraint) {
  return Boolean(constraint && "delay" in constraint);
}
class AbstractPointerSensor {
  props;
  events;
  autoScrollEnabled = true;
  document;
  activated = false;
  initialCoordinates;
  timeoutId = null;
  listeners;
  documentListeners;
  windowListeners;
  constructor(props, events2, listenerTarget = getEventListenerTarget(props.event.target)) {
    this.props = props;
    this.events = events2;
    const { event } = props;
    const { target } = event;
    this.props = props;
    this.events = events2;
    this.document = getOwnerDocument(target);
    this.documentListeners = new Listeners(this.document);
    this.listeners = new Listeners(listenerTarget);
    this.windowListeners = new Listeners(getWindow(target));
    this.initialCoordinates = getEventCoordinates(event) ?? defaultCoordinates;
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.removeTextSelection = this.removeTextSelection.bind(this);
    this.attach();
  }
  attach() {
    const { events: events2, props: { options: { activationConstraint, bypassActivationConstraint } } } = this;
    this.listeners.add(events2.move.name, this.handleMove, { passive: false });
    this.listeners.add(events2.end.name, this.handleEnd);
    if (events2.cancel) {
      this.listeners.add(events2.cancel.name, this.handleCancel);
    }
    this.windowListeners.add(EventName.Resize, this.handleCancel);
    this.windowListeners.add(EventName.DragStart, preventDefault);
    this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
    this.windowListeners.add(EventName.ContextMenu, preventDefault);
    this.documentListeners.add(EventName.Keydown, this.handleKeydown);
    if (activationConstraint) {
      if (bypassActivationConstraint?.({
        event: this.props.event,
        activeNode: this.props.activeNode,
        options: this.props.options
      })) {
        return this.handleStart();
      }
      if (isDelayConstraint(activationConstraint)) {
        this.timeoutId = setTimeout(this.handleStart, activationConstraint.delay);
        this.handlePending(activationConstraint);
        return;
      }
      if (isDistanceConstraint(activationConstraint)) {
        this.handlePending(activationConstraint);
        return;
      }
    }
    this.handleStart();
  }
  detach() {
    this.listeners.removeAll();
    this.windowListeners.removeAll();
    setTimeout(this.documentListeners.removeAll, 50);
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  handlePending(constraint, offset) {
    const { active, onPending } = this.props;
    onPending(active, constraint, this.initialCoordinates, offset);
  }
  handleStart() {
    const { initialCoordinates } = this;
    const { onStart } = this.props;
    if (initialCoordinates) {
      this.activated = true;
      this.documentListeners.add(EventName.Click, stopPropagation, {
        capture: true
      });
      this.removeTextSelection();
      this.documentListeners.add(EventName.SelectionChange, this.removeTextSelection);
      onStart(initialCoordinates);
    }
  }
  handleMove(event) {
    const { activated, initialCoordinates, props } = this;
    const { onMove, options: { activationConstraint } } = props;
    if (!initialCoordinates) {
      return;
    }
    const coordinates = getEventCoordinates(event) ?? defaultCoordinates;
    const delta = subtract(initialCoordinates, coordinates);
    if (!activated && activationConstraint) {
      if (isDistanceConstraint(activationConstraint)) {
        if (activationConstraint.tolerance != null && hasExceededDistance(delta, activationConstraint.tolerance)) {
          return this.handleCancel();
        }
        if (hasExceededDistance(delta, activationConstraint.distance)) {
          return this.handleStart();
        }
      }
      if (isDelayConstraint(activationConstraint)) {
        if (hasExceededDistance(delta, activationConstraint.tolerance)) {
          return this.handleCancel();
        }
      }
      this.handlePending(activationConstraint, delta);
      return;
    }
    if (event.cancelable) {
      event.preventDefault();
    }
    onMove(coordinates);
  }
  handleEnd() {
    const { onAbort, onEnd } = this.props;
    this.detach();
    if (!this.activated) {
      onAbort(this.props.active);
    }
    onEnd();
  }
  handleCancel() {
    const { onAbort, onCancel } = this.props;
    this.detach();
    if (!this.activated) {
      onAbort(this.props.active);
    }
    onCancel();
  }
  handleKeydown(event) {
    if (event.code === KeyboardCode.Esc) {
      this.handleCancel();
    }
  }
  removeTextSelection() {
    this.document.getSelection()?.removeAllRanges();
  }
}
const events$2 = {
  cancel: { name: "pointercancel" },
  move: { name: "pointermove" },
  end: { name: "pointerup" }
};
class PointerSensor extends AbstractPointerSensor {
  constructor(props) {
    const { event } = props;
    const listenerTarget = getOwnerDocument(event.target);
    super(props, events$2, listenerTarget);
  }
  static activators = [
    {
      eventName: "onpointerdown",
      handler: (event, { onActivation }) => {
        if (!event.isPrimary || event.button !== 0) {
          return false;
        }
        onActivation?.({ event });
        return true;
      }
    }
  ];
}
const events$1 = {
  move: { name: "mousemove" },
  end: { name: "mouseup" }
};
var MouseButton;
(function(MouseButton2) {
  MouseButton2[MouseButton2["RightClick"] = 2] = "RightClick";
})(MouseButton || (MouseButton = {}));
class MouseSensor extends AbstractPointerSensor {
  constructor(props) {
    super(props, events$1, getOwnerDocument(props.event.target));
  }
  static activators = [
    {
      eventName: "onmousedown",
      handler: (event, { onActivation }) => {
        if (event.button === MouseButton.RightClick) {
          return false;
        }
        onActivation?.({ event });
        return true;
      }
    }
  ];
}
const events = {
  cancel: { name: "touchcancel" },
  move: { name: "touchmove" },
  end: { name: "touchend" }
};
class TouchSensor extends AbstractPointerSensor {
  constructor(props) {
    super(props, events);
  }
  static activators = [
    {
      eventName: "ontouchstart",
      handler: (event, { onActivation }) => {
        const { touches } = event;
        if (touches.length > 1) {
          return false;
        }
        onActivation?.({ event });
        return true;
      }
    }
  ];
  static setup() {
    window.addEventListener(events.move.name, noop2, {
      capture: false,
      passive: false
    });
    return function teardown() {
      window.removeEventListener(events.move.name, noop2);
    };
    function noop2() {
    }
  }
}
var MeasuringStrategy;
(function(MeasuringStrategy2) {
  MeasuringStrategy2[MeasuringStrategy2["Always"] = 0] = "Always";
  MeasuringStrategy2[MeasuringStrategy2["BeforeDragging"] = 1] = "BeforeDragging";
  MeasuringStrategy2[MeasuringStrategy2["WhileDragging"] = 2] = "WhileDragging";
})(MeasuringStrategy || (MeasuringStrategy = {}));
var MeasuringFrequency;
(function(MeasuringFrequency2) {
  MeasuringFrequency2["Optimized"] = "optimized";
})(MeasuringFrequency || (MeasuringFrequency = {}));
function useDroppableMeasuring(options) {
  const {
    containers,
    dragging,
    dependencies,
    config: { measure, strategy, frequency }
  } = options();
  let queue = null;
  const disabled = isDisabled();
  const measureDroppableContainers = (ids2 = []) => {
    if (disabled) return;
    queue = queue === null ? ids2 : queue.concat(ids2.filter((id) => !queue.includes(id)));
  };
  const droppableRects = useLazyMemo();
  return {
    droppableRects: box.with(() => droppableRects.current),
    measureDroppableContainers,
    measuringScheduled: box.with(() => queue !== null)
  };
  function isDisabled() {
    switch (strategy) {
      case MeasuringStrategy.Always:
        return false;
      case MeasuringStrategy.BeforeDragging:
        return dragging;
      default:
        return !dragging;
    }
  }
}
function useCachedNode(args) {
  const [draggableNodes, id] = args();
  const draggableNode = id != null ? draggableNodes.get(id) : void 0;
  draggableNode ? draggableNode.node : null;
  return useLazyMemo();
}
function useInitialValue(value, computeFn) {
  return useLazyMemo();
}
function useInitialRect(node, measure) {
  return useInitialValue();
}
function defaultMeasure(element2) {
  return new Rect(getClientRect(element2), element2);
}
function useRect(args) {
  let rect = null;
  const [element2, measure = defaultMeasure, fallbackRect] = args();
  function measureRect() {
    if (!element2) {
      rect = null;
      return;
    }
    if (element2.isConnected === false) {
      rect = rect ?? fallbackRect ?? null;
      return;
    }
    const newRect = measure(element2);
    if (JSON.stringify(rect) === JSON.stringify(newRect)) {
      return;
    }
    rect = newRect;
  }
  useMutationObserver(() => ({
    callback(records) {
      if (!element2) {
        return;
      }
      for (const record of records) {
        const { type, target } = record;
        if (type === "childList" && target instanceof HTMLElement && target.contains(element2)) {
          measureRect();
          break;
        }
      }
    }
  }));
  useResizeObserver(() => ({ callback: measureRect }));
  return {
    get current() {
      return rect;
    }
  };
}
function useMutationObserver(args) {
  const { callback: handleMutations, disabled } = args();
  const mutationObserver = (() => {
    if (disabled || typeof window === "undefined" || typeof window.MutationObserver === "undefined") {
      return void 0;
    }
    const { MutationObserver } = window;
    return new MutationObserver(handleMutations);
  })();
  return {
    get current() {
      return mutationObserver;
    }
  };
}
function useResizeObserver(args) {
  const { callback: handleResize, disabled } = args();
  const resizeObserver = (() => {
    if (disabled || typeof window === "undefined" || typeof window.ResizeObserver === "undefined") {
      return void 0;
    }
    const { ResizeObserver } = window;
    return new ResizeObserver(handleResize);
  })();
  return {
    get current() {
      return resizeObserver;
    }
  };
}
function getMeasurableNode(node) {
  if (!node) {
    return null;
  }
  if (node.children.length > 1) {
    return node;
  }
  const firstChild = node.children[0];
  return isHTMLElement(firstChild) ? firstChild : node;
}
function useDragOverlayMeasuring({ measureFn }) {
  const measure = measureFn();
  let rect = null;
  const handleResize = (entries) => {
    for (const { target } of entries) {
      if (isHTMLElement(target)) {
        const newRect = measure(target);
        rect = rect ? { ...rect, width: newRect.width, height: newRect.height } : newRect;
        break;
      }
    }
  };
  const resizeObserver = useResizeObserver(() => ({ callback: handleResize }));
  const handleNodeChange = (element2) => {
    const node = getMeasurableNode(element2);
    resizeObserver?.current?.disconnect();
    if (node) {
      resizeObserver?.current?.observe(node);
    }
    rect = node ? measure(node) : null;
  };
  const [nodeRef, setRef] = useNodeRef(handleNodeChange);
  return {
    get nodeRef() {
      return nodeRef.current;
    },
    get rect() {
      return rect;
    },
    setRef
  };
}
function useRectDelta(rectFn) {
  const initialRect = useInitialValue();
  return {
    get current() {
      return getRectDelta(rectFn(), initialRect.current);
    }
  };
}
function useWindowRect(elementFn) {
  const element2 = elementFn();
  return {
    get current() {
      return element2 ? getWindowClientRect(element2) : null;
    }
  };
}
function useScrollableAncestors(nodeFn) {
  const ancestors = useLazyMemo();
  return ancestors;
}
const defaultValue = [];
function useRects(args) {
  const [elements = [], measure = getClientRect] = args();
  const [firstElement] = elements;
  const windowRect = useWindowRect(() => firstElement ? getWindow(firstElement) : null);
  let rects = defaultValue;
  function measureRects() {
    if (!elements.length) {
      rects = defaultValue;
      return;
    }
    rects = elements.map((element2) => isDocumentScrollingElement(element2) ? windowRect.current : new Rect(measure(element2), element2));
  }
  useResizeObserver(() => ({ callback: measureRects }));
  return {
    get current() {
      return rects;
    }
  };
}
function useScrollOffsets(elementsFn) {
  const elements = elementsFn() ?? [];
  const scrollOffsets = (() => {
    if (elements.length) {
      return getScrollOffsets(elements);
    }
    return defaultCoordinates;
  })();
  return {
    get current() {
      return scrollOffsets;
    }
  };
}
function useScrollOffsetsDelta(args) {
  const [scrollOffsets, dependencies] = args();
  return {
    get current() {
      return defaultCoordinates;
    }
  };
}
function useSyntheticListeners(args) {
  return box.with(() => {
    const [listeners, id] = args();
    return listeners.reduce(
      (acc, { eventName, handler }) => {
        acc[eventName] = (event) => {
          handler(event, id);
        };
        return acc;
      },
      {}
    );
  });
}
function useCombineActivators(args) {
  return box.with(() => {
    const [sensors, getSyntheticHandler] = args();
    return sensors.reduce((accumulator, sensor) => {
      const { sensor: Sensor } = sensor;
      const sensorActivators = Sensor.activators.map((activator) => ({
        eventName: activator.eventName,
        handler: getSyntheticHandler(activator.handler, sensor)
      }));
      return [...accumulator, ...sensorActivators];
    }, []);
  });
}
var AutoScrollActivator;
(function(AutoScrollActivator2) {
  AutoScrollActivator2[AutoScrollActivator2["Pointer"] = 0] = "Pointer";
  AutoScrollActivator2[AutoScrollActivator2["DraggableRect"] = 1] = "DraggableRect";
})(AutoScrollActivator || (AutoScrollActivator = {}));
var TraversalOrder;
(function(TraversalOrder2) {
  TraversalOrder2[TraversalOrder2["TreeOrder"] = 0] = "TreeOrder";
  TraversalOrder2[TraversalOrder2["ReversedTreeOrder"] = 1] = "ReversedTreeOrder";
})(TraversalOrder || (TraversalOrder = {}));
function useAutoScroller(argsFn) {
  const {
    acceleration,
    activator = AutoScrollActivator.Pointer,
    canScroll,
    draggingRect,
    enabled,
    interval = 5,
    order = TraversalOrder.TreeOrder,
    pointerCoordinates,
    scrollableAncestors = [],
    scrollableAncestorRects = [],
    delta,
    threshold
  } = argsFn();
  useScrollIntent(() => [delta, !enabled]);
  (() => {
    switch (activator) {
      case AutoScrollActivator.Pointer:
        return pointerCoordinates ? {
          top: pointerCoordinates.y,
          bottom: pointerCoordinates.y,
          left: pointerCoordinates.x,
          right: pointerCoordinates.x
        } : null;
      case AutoScrollActivator.DraggableRect:
        return draggingRect;
    }
  })();
  (() => order === TraversalOrder.TreeOrder ? [...scrollableAncestors].reverse() : scrollableAncestors)();
}
({
  x: { [Direction.Backward]: false, [Direction.Forward]: false },
  y: { [Direction.Backward]: false, [Direction.Forward]: false }
});
function useScrollIntent(argsFn) {
  const [delta, disabled] = argsFn();
  const intent = useLazyMemo();
  return intent;
}
const defaultSensors = [
  { sensor: PointerSensor, options: {} },
  { sensor: KeyboardSensor, options: {} }
];
const defaultData = { current: {} };
const defaultMeasuringConfiguration = {
  draggable: {
    measure: getTransformAgnosticClientRect
  },
  droppable: {
    measure: getTransformAgnosticClientRect,
    strategy: MeasuringStrategy.WhileDragging,
    frequency: MeasuringFrequency.Optimized
  },
  dragOverlay: {
    measure: getClientRect
  }
};
class DroppableContainersMap extends Map {
  get(id) {
    return id != null ? super.get(id) ?? void 0 : void 0;
  }
  toArray() {
    return Array.from(this.values());
  }
  getEnabled() {
    return this.toArray().filter(({ disabled }) => !disabled);
  }
  getNodeFor(id) {
    return this.get(id)?.node ?? void 0;
  }
}
const defaultPublicContext = {
  activatorEvent: null,
  active: null,
  activeNode: null,
  activeNodeRect: null,
  collisions: null,
  containerNodeRect: null,
  draggableNodes: /* @__PURE__ */ new Map(),
  droppableRects: /* @__PURE__ */ new Map(),
  droppableContainers: new DroppableContainersMap(),
  over: null,
  dragOverlay: {
    nodeRef: null,
    rect: null,
    setRef: noop
  },
  scrollableAncestors: [],
  scrollableAncestorRects: [],
  measuringConfiguration: defaultMeasuringConfiguration,
  measureDroppableContainers: noop,
  windowRect: null,
  measuringScheduled: false
};
const defaultInternalContext = {
  activatorEvent: null,
  activators: [],
  active: null,
  activeNodeRect: null,
  ariaDescribedById: {
    draggable: ""
  },
  dispatch: noop,
  draggableNodes: /* @__PURE__ */ new Map(),
  over: null,
  measureDroppableContainers: noop
};
const InternalContextKey = Symbol("InternalContext");
const PublicContextKey = Symbol("PublicContext");
function getInternalContext() {
  if (!hasContext(InternalContextKey))
    return defaultInternalContext;
  return getContext(InternalContextKey)();
}
function Restore_focus($$payload, $$props) {
  push();
  const { active, activatorEvent, draggableNodes } = getInternalContext();
  active?.id;
  pop();
}
var Action;
(function(Action2) {
  Action2["DragStart"] = "dragStart";
  Action2["DragMove"] = "dragMove";
  Action2["DragEnd"] = "dragEnd";
  Action2["DragCancel"] = "dragCancel";
  Action2["DragOver"] = "dragOver";
  Action2["RegisterDroppable"] = "registerDroppable";
  Action2["SetDroppableDisabled"] = "setDroppableDisabled";
  Action2["UnregisterDroppable"] = "unregisterDroppable";
})(Action || (Action = {}));
function useReducer() {
  const state = {
    draggable: {
      active: null,
      initialCoordinates: { x: 0, y: 0 },
      nodes: /* @__PURE__ */ new Map(),
      translate: { x: 0, y: 0 }
    },
    droppable: { containers: new DroppableContainersMap() }
  };
  function dispatch(action) {
    switch (action.type) {
      case Action.DragStart:
        state.draggable.initialCoordinates = action.initialCoordinates;
        state.draggable.active = action.active;
        break;
      case Action.DragMove:
        if (state.draggable.active == null) return;
        state.draggable.translate = {
          x: action.coordinates.x - state.draggable.initialCoordinates.x,
          y: action.coordinates.y - state.draggable.initialCoordinates.y
        };
        break;
      case Action.DragEnd:
      case Action.DragCancel:
        state.draggable.active = null;
        state.draggable.initialCoordinates = { x: 0, y: 0 };
        state.draggable.translate = { x: 0, y: 0 };
        break;
      case Action.RegisterDroppable: {
        const { element: element2 } = action;
        const { id } = element2;
        const containers = new DroppableContainersMap(state.droppable.containers);
        containers.set(id, element2);
        state.droppable.containers = containers;
        break;
      }
      case Action.SetDroppableDisabled: {
        const { id, key, disabled } = action;
        const element2 = state.droppable.containers.get(id);
        if (!element2 || key !== element2.key) return;
        const containers = new DroppableContainersMap(state.droppable.containers);
        containers.set(id, { ...element2, disabled });
        state.droppable.containers = containers;
        break;
      }
      case Action.UnregisterDroppable: {
        const { id, key } = action;
        const element2 = state.droppable.containers.get(id);
        if (!element2 || key !== element2.key) return;
        const containers = new DroppableContainersMap(state.droppable.containers);
        containers.delete(id);
        state.droppable.containers = containers;
        break;
      }
    }
  }
  return [state, dispatch];
}
function applyModifiers(modifiers, { transform, ...args }) {
  return modifiers?.length ? modifiers.reduce((accumulator, modifier) => {
    return modifier({
      transform: accumulator,
      ...args
    });
  }, transform) : transform;
}
function useMeasuringConfiguration(config) {
  return {
    draggable: {
      ...defaultMeasuringConfiguration.draggable,
      ...config?.draggable
    },
    droppable: {
      ...defaultMeasuringConfiguration.droppable,
      ...config?.droppable
    },
    dragOverlay: {
      ...defaultMeasuringConfiguration.dragOverlay,
      ...config?.dragOverlay
    }
  };
}
function useLayoutShiftScrollCompensation(optionsFn) {
  const { activeNode, measure, initialRect, config = true } = optionsFn();
  const { x, y } = typeof config === "boolean" ? { x: config, y: config } : config;
}
const ActiveDraggableContextKey = Symbol("ActiveDraggableContext");
function getActiveDraggableContext() {
  return getContext(ActiveDraggableContextKey)();
}
var Status = /* @__PURE__ */ ((Status2) => {
  Status2[Status2["Uninitialized"] = 0] = "Uninitialized";
  Status2[Status2["Initializing"] = 1] = "Initializing";
  Status2[Status2["Initialized"] = 2] = "Initialized";
  return Status2;
})(Status || {});
function Dnd_context($$payload, $$props) {
  push();
  let {
    id,
    accessibility,
    autoScroll = true,
    children,
    sensors = defaultSensors,
    collisionDetection = rectIntersection,
    measuring,
    modifiers,
    $$slots,
    $$events,
    ...latestProps
  } = $$props;
  const [ctxState, dispatch] = useReducer();
  const [dispatchMonitorEvent, registerMonitorListener] = useDndMonitorProvider();
  let status = Status.Uninitialized;
  const isInitialized = status === Status.Initialized;
  const {
    draggable: { active: activeId, nodes: draggableNodes, translate },
    droppable: { containers: droppableContainers }
  } = ctxState;
  const node = activeId != null ? draggableNodes.get(activeId) : null;
  const activeRects = { initial: null, translated: null };
  const active = activeId != null ? {
    id: activeId,
    // It's possible for the active node to unmount while dragging
    data: node?.data ?? defaultData,
    rect: activeRects
  } : null;
  let activeRef = null;
  let activeSensor = null;
  let activatorEvent = null;
  const draggableDescribedById = useUniqueId(`DndDescribedBy`, id);
  const enabledDroppableContainers = droppableContainers.getEnabled();
  const measuringConfiguration = useMeasuringConfiguration(measuring);
  const {
    droppableRects,
    measureDroppableContainers,
    measuringScheduled
  } = useDroppableMeasuring(() => ({
    containers: enabledDroppableContainers,
    dragging: isInitialized,
    dependencies: () => [translate.x, translate.y],
    config: measuringConfiguration.droppable
  }));
  const activeNode = useCachedNode(() => [draggableNodes, activeId]);
  const activationCoordinates = activatorEvent ? getEventCoordinates(activatorEvent) : null;
  const autoScrollOptions = getAutoScrollerOptions();
  const initialActiveNodeRect = useInitialRect();
  useLayoutShiftScrollCompensation(() => ({
    activeNode: activeId != null ? draggableNodes.get(activeId) : null,
    config: autoScrollOptions.layoutShiftCompensation,
    initialRect: initialActiveNodeRect.current,
    measure: measuringConfiguration.draggable.measure
  }));
  const activeNodeRect = useRect(() => [
    activeNode.current,
    measuringConfiguration.draggable.measure,
    initialActiveNodeRect.current
  ]);
  const containerNodeRect = useRect(() => [null]);
  const sensorContext = {
    activatorEvent: null,
    active: null,
    activeNode: activeNode.current,
    collisionRect: null,
    collisions: null,
    droppableRects: droppableRects.current,
    // svelte-ignore state_referenced_locally
    draggableNodes,
    draggingNode: null,
    draggingNodeRect: null,
    // svelte-ignore state_referenced_locally
    droppableContainers,
    over: null,
    scrollableAncestors: [],
    scrollAdjustedTranslate: null
  };
  droppableContainers.getNodeFor(sensorContext.over?.id);
  const dragOverlay = useDragOverlayMeasuring({ measureFn: () => measuringConfiguration.dragOverlay.measure });
  const draggingNode = dragOverlay.nodeRef ? dragOverlay.nodeRef : activeNode.current;
  const draggingNodeRect = isInitialized ? dragOverlay.rect ?? activeNodeRect.current : null;
  const usesDragOverlay = Boolean(dragOverlay.nodeRef && dragOverlay.rect);
  const nodeRectDelta = useRectDelta(() => usesDragOverlay ? null : activeNodeRect.current);
  const windowRect = useWindowRect(() => draggingNode ? getWindow(draggingNode) : null);
  const scrollableAncestors = useScrollableAncestors();
  const scrollableAncestorRects = useRects(() => [scrollableAncestors.current]);
  const modifiedTranslate = applyModifiers(modifiers, {
    transform: {
      x: translate.x - nodeRectDelta.current.x,
      y: translate.y - nodeRectDelta.current.y,
      scaleX: 1,
      scaleY: 1
    },
    activatorEvent,
    active,
    activeNodeRect: activeNodeRect.current,
    containerNodeRect: containerNodeRect.current,
    draggingNodeRect,
    over: sensorContext.over,
    overlayNodeRect: dragOverlay.rect,
    scrollableAncestors: scrollableAncestors.current,
    scrollableAncestorRects: scrollableAncestorRects.current,
    windowRect: windowRect.current
  });
  const pointerCoordinates = activationCoordinates ? add(activationCoordinates, translate) : null;
  const scrollOffsets = useScrollOffsets(() => scrollableAncestors.current);
  const scrollAdjustment = useScrollOffsetsDelta(() => [scrollOffsets.current]);
  const activeNodeScrollDelta = useScrollOffsetsDelta(() => [scrollOffsets.current, [activeNodeRect.current]]);
  const scrollAdjustedTranslate = add(modifiedTranslate, scrollAdjustment.current);
  const collisionRect = draggingNodeRect ? getAdjustedRect(draggingNodeRect, modifiedTranslate) : null;
  const collisions = active && collisionRect ? collisionDetection({
    active,
    collisionRect,
    droppableRects: droppableRects.current,
    droppableContainers: enabledDroppableContainers,
    pointerCoordinates
  }) : null;
  const overId = getFirstCollision(collisions, "id");
  let over = null;
  const appliedTranslate = usesDragOverlay ? modifiedTranslate : add(modifiedTranslate, activeNodeScrollDelta.current);
  const transform = adjustScale(appliedTranslate, over?.rect ?? null, activeNodeRect.current);
  let activeSensorRef = null;
  const instantiateSensor = (event, { sensor: Sensor, options }) => {
    if (activeRef == null) {
      return;
    }
    const activeNode2 = draggableNodes.get(activeRef);
    if (!activeNode2) {
      return;
    }
    const localActivatorEvent = event;
    const sensorInstance = new Sensor({
      active: activeRef,
      activeNode: activeNode2,
      event: localActivatorEvent,
      options,
      // Sensors need to be instantiated with $state as a Proxy for arguments that change over time
      // otherwise they are frozen in time with the stale arguments
      context: sensorContext,
      onAbort(id2) {
        const draggableNode = draggableNodes.get(id2);
        if (!draggableNode) {
          return;
        }
        const { onDragAbort } = latestProps;
        const event2 = { id: id2 };
        onDragAbort?.(event2);
        dispatchMonitorEvent({ type: "onDragAbort", event: event2 });
      },
      onPending(id2, constraint, initialCoordinates, offset) {
        const draggableNode = draggableNodes.get(id2);
        if (!draggableNode) {
          return;
        }
        const { onDragPending } = latestProps;
        const event2 = { id: id2, constraint, initialCoordinates, offset };
        onDragPending?.(event2);
        dispatchMonitorEvent({ type: "onDragPending", event: event2 });
      },
      onStart(initialCoordinates) {
        const id2 = activeRef;
        if (id2 == null) {
          return;
        }
        const draggableNode = draggableNodes.get(id2);
        if (!draggableNode) {
          return;
        }
        const { onDragStart } = latestProps;
        const event2 = {
          activatorEvent: localActivatorEvent,
          active: { id: id2, data: draggableNode.data, rect: activeRects }
        };
        onDragStart?.(event2);
        status = Status.Initializing;
        dispatch({ type: Action.DragStart, initialCoordinates, active: id2 });
        dispatchMonitorEvent({ type: "onDragStart", event: event2 });
        activeSensor = activeSensorRef;
        activatorEvent = localActivatorEvent;
      },
      onMove(coordinates) {
        dispatch({ type: Action.DragMove, coordinates });
      },
      onEnd: createHandler(Action.DragEnd),
      onCancel: createHandler(Action.DragCancel)
    });
    activeSensorRef = sensorInstance;
    function createHandler(type) {
      return async function handler() {
        const {
          active: active2,
          collisions: collisions2,
          over: localOver,
          scrollAdjustedTranslate: scrollAdjustedTranslate2
        } = sensorContext;
        let event2 = null;
        if (active2 && scrollAdjustedTranslate2) {
          const { cancelDrop } = latestProps;
          event2 = {
            activatorEvent: localActivatorEvent,
            active: active2,
            collisions: collisions2,
            delta: scrollAdjustedTranslate2,
            over: localOver
          };
          if (type === Action.DragEnd && typeof cancelDrop === "function") {
            const shouldCancel = await Promise.resolve(cancelDrop(event2));
            if (shouldCancel) {
              type = Action.DragCancel;
            }
          }
        }
        activeRef = null;
        dispatch({ type });
        status = Status.Uninitialized;
        over = null;
        activeSensor = null;
        activatorEvent = null;
        activeSensorRef = null;
        const eventName = type === Action.DragEnd ? "onDragEnd" : "onDragCancel";
        if (event2) {
          const handler2 = latestProps[eventName];
          handler2?.(event2);
          dispatchMonitorEvent({ type: eventName, event: event2 });
        }
      };
    }
  };
  const bindActivatorToSensorInstantiator = (handler, sensor) => {
    return (event, active2) => {
      const nativeEvent = event;
      const activeDraggableNode = draggableNodes.get(active2);
      if (
        // Another sensor is already instantiating
        activeRef !== null || // No active draggable
        !activeDraggableNode || // Event has already been captured
        nativeEvent.dndKit || nativeEvent.defaultPrevented
      ) {
        return;
      }
      const activationContext = { active: activeDraggableNode };
      const shouldActivate = handler(event, sensor.options, activationContext);
      if (shouldActivate === true) {
        nativeEvent.dndKit = { capturedBy: sensor.sensor };
        activeRef = active2;
        instantiateSensor(event, sensor);
      }
    };
  };
  const activators = useCombineActivators(() => [sensors, bindActivatorToSensorInstantiator]);
  watch(() => scrollAdjustedTranslate, () => {
    const { onDragMove } = latestProps;
    const {
      active: active2,
      activatorEvent: activatorEvent2,
      collisions: collisions2,
      over: over2
    } = sensorContext;
    if (!active2 || !activatorEvent2) {
      return;
    }
    const event = {
      active: active2,
      activatorEvent: activatorEvent2,
      collisions: collisions2,
      delta: { x: scrollAdjustedTranslate.x, y: scrollAdjustedTranslate.y },
      over: over2
    };
    onDragMove?.(event);
    dispatchMonitorEvent({ type: "onDragMove", event });
  });
  watch(() => overId, () => {
    const {
      active: active2,
      activatorEvent: activatorEvent2,
      collisions: collisions2,
      droppableContainers: droppableContainers2,
      scrollAdjustedTranslate: scrollAdjustedTranslate2
    } = sensorContext;
    if (!active2 || activeRef == null || !activatorEvent2 || !scrollAdjustedTranslate2) {
      return;
    }
    const { onDragOver } = latestProps;
    const overContainer = droppableContainers2.get(overId);
    const localOver = overContainer && overContainer.rect ? {
      id: overContainer.id,
      rect: overContainer.rect,
      data: overContainer.data,
      disabled: overContainer.disabled
    } : null;
    const event = {
      active: active2,
      activatorEvent: activatorEvent2,
      collisions: collisions2,
      delta: { x: scrollAdjustedTranslate2.x, y: scrollAdjustedTranslate2.y },
      over: localOver
    };
    over = localOver;
    onDragOver?.(event);
    dispatchMonitorEvent({ type: "onDragOver", event });
  });
  useAutoScroller(() => ({
    ...autoScrollOptions,
    delta: translate,
    draggingRect: collisionRect,
    pointerCoordinates,
    scrollableAncestors: scrollableAncestors.current,
    scrollableAncestorRects: scrollableAncestorRects.current
  }));
  const publicContext = {
    active,
    activeNode: activeNode.current,
    activeNodeRect: activeNodeRect.current,
    activatorEvent,
    collisions,
    containerNodeRect: containerNodeRect.current,
    dragOverlay,
    draggableNodes,
    droppableContainers,
    droppableRects: droppableRects.current,
    over,
    measureDroppableContainers,
    scrollableAncestors: scrollableAncestors.current,
    scrollableAncestorRects: scrollableAncestorRects.current,
    measuringConfiguration,
    measuringScheduled: measuringScheduled.current,
    windowRect: windowRect.current
  };
  const internalContext = {
    activatorEvent,
    activators: activators.current,
    active,
    activeNodeRect: activeNodeRect.current,
    ariaDescribedById: { draggable: draggableDescribedById },
    dispatch,
    draggableNodes,
    over,
    measureDroppableContainers
  };
  function getAutoScrollerOptions() {
    const activeSensorDisablesAutoscroll = activeSensor?.autoScrollEnabled === false;
    const autoScrollGloballyDisabled = typeof autoScroll === "object" ? autoScroll.enabled === false : autoScroll === false;
    const enabled = isInitialized && !activeSensorDisablesAutoscroll && !autoScrollGloballyDisabled;
    if (typeof autoScroll === "object") {
      return { ...autoScroll, enabled };
    }
    return { enabled };
  }
  setContext(DndMonitorContextKey, registerMonitorListener);
  setContext(InternalContextKey, () => internalContext);
  setContext(PublicContextKey, () => publicContext);
  setContext(ActiveDraggableContextKey, () => transform);
  children?.($$payload);
  $$payload.out.push(`<!----> `);
  Restore_focus($$payload, { disabled: accessibility?.restoreFocus === false });
  $$payload.out.push(`<!----> `);
  Accessibility($$payload, spread_props([
    accessibility,
    { hiddenTextDescribedById: draggableDescribedById }
  ]));
  $$payload.out.push(`<!---->`);
  pop();
}
function Nullified_context_provider($$payload, $$props) {
  push();
  let { children } = $$props;
  const defaultTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  setContext(InternalContextKey, () => defaultInternalContext);
  setContext(ActiveDraggableContextKey, () => defaultTransform);
  children($$payload);
  $$payload.out.push(`<!---->`);
  pop();
}
const baseStyles = { position: "fixed", touchAction: "none" };
function defaultTransition$1(activatorEvent) {
  const isKeyboardActivator = isKeyboardEvent(activatorEvent);
  return isKeyboardActivator ? "transform 250ms ease" : void 0;
}
function Positioned_overlay($$payload, $$props) {
  push();
  let {
    as,
    activatorEvent,
    adjustScale: adjustScale2,
    children,
    className,
    rect,
    style,
    transform,
    transition = defaultTransition$1,
    handleExit,
    ref = void 0,
    onStylesUpdated
  } = $$props;
  let scaleAdjustedTransform = adjustScale2 ? transform : { ...transform, scaleX: 1, scaleY: 1 };
  let styles = (() => {
    if (!rect) {
      return {};
    }
    return {
      ...baseStyles,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      transform: CSS.Transform.toString(scaleAdjustedTransform),
      transformOrigin: adjustScale2 && activatorEvent ? getRelativeTransformOrigin(activatorEvent, rect) : void 0,
      transition: typeof transition === "function" ? transition(activatorEvent) : transition,
      ...style
    };
  })();
  const stylesString = styleObjectToString(styles);
  if (rect) {
    $$payload.out.push("<!--[-->");
    element(
      $$payload,
      as,
      () => {
        $$payload.out.push(`${attr_class(clsx(className))}${attr_style(stylesString)}`);
      },
      () => {
        children?.($$payload);
        $$payload.out.push(`<!---->`);
      }
    );
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { ref });
  pop();
}
const defaultRole = "button";
const ID_PREFIX$2 = "Draggable";
function useDraggable(args) {
  const key = useUniqueId(ID_PREFIX$2);
  const { id, disabled = false, data, attributes } = unwrapResolvableObject(args);
  const {
    activators,
    activatorEvent,
    active,
    activeNodeRect,
    ariaDescribedById,
    draggableNodes,
    over
  } = getInternalContext();
  const {
    role = defaultRole,
    roleDescription = "draggable",
    tabIndex = 0
  } = attributes ?? {};
  const isDragging = active?.id === id;
  const transform = isDragging ? getActiveDraggableContext() : null;
  const [node, setNodeRef] = useNodeRef();
  const [activatorNode, setActivatorNodeRef] = useNodeRef();
  const listeners = useSyntheticListeners(() => [activators, id]);
  watch(() => id, (id2) => {
    draggableNodes.set(id2, {
      id: id2,
      key,
      node: node.current,
      activatorNode: activatorNode.current,
      data
    });
    return () => {
      const node2 = draggableNodes.get(id2);
      if (node2 && node2.key === key) {
        draggableNodes.delete(id2);
      }
    };
  });
  const memoizedAttributes = {
    role,
    tabIndex,
    "aria-disabled": disabled,
    "aria-pressed": isDragging && role === defaultRole ? true : void 0,
    "aria-roledescription": roleDescription,
    "aria-describedby": ariaDescribedById.draggable
  };
  return {
    active: box.with(() => active),
    activatorEvent: box.with(() => activatorEvent),
    activeNodeRect: box.with(() => activeNodeRect),
    attributes: box.with(() => memoizedAttributes),
    isDragging: box.with(() => isDragging),
    listeners: box.with(() => disabled ? void 0 : listeners.current),
    node,
    over: box.with(() => over),
    setNodeRef,
    setActivatorNodeRef,
    transform: box.with(() => transform)
  };
}
function useDndContext() {
  if (!hasContext(PublicContextKey)) return defaultPublicContext;
  return getContext(PublicContextKey)();
}
const ID_PREFIX$1 = "Droppable";
const defaultResizeObserverConfig = { timeout: 25 };
function useDroppable(args) {
  const key = useUniqueId(ID_PREFIX$1);
  const { id, disabled = false, data, resizeObserverConfig } = unwrapResolvableObject(args);
  const { active, dispatch, over, measureDroppableContainers } = getInternalContext();
  let resizeObserverConnected = false;
  const rect = null;
  let callbackId = null;
  const {
    disabled: resizeObserverDisabled,
    updateMeasurementsFor,
    timeout: resizeObserverTimeout
  } = { ...defaultResizeObserverConfig, ...resizeObserverConfig };
  const ids2 = updateMeasurementsFor ?? id;
  const handleResize = () => {
    if (!resizeObserverConnected) {
      resizeObserverConnected = true;
      return;
    }
    if (callbackId != null) {
      clearTimeout(callbackId);
    }
    callbackId = setTimeout(
      () => {
        measureDroppableContainers(Array.isArray(ids2) ? ids2 : [ids2]);
        callbackId = null;
      },
      resizeObserverTimeout
    );
  };
  const resizeObserver = useResizeObserver(() => ({
    callback: handleResize,
    disabled: resizeObserverDisabled || !active
  }));
  const handleNodeChange = (newElement, previousElement) => {
    if (!resizeObserver.current) {
      return;
    }
    if (previousElement) {
      resizeObserver.current.unobserve(previousElement);
      resizeObserverConnected = false;
    }
    if (newElement) {
      resizeObserver.current.observe(newElement);
    }
  };
  const [nodeRef, setNodeRef] = useNodeRef(handleNodeChange);
  watch(() => id, () => {
    dispatch({
      type: Action.RegisterDroppable,
      element: { id, key, disabled, node: nodeRef.current, rect, data }
    });
    return () => {
      dispatch({ type: Action.UnregisterDroppable, key, id });
    };
  });
  return {
    active: box.with(() => active),
    rect: box.with(() => rect),
    isOver: box.with(() => over?.id === id),
    node: nodeRef,
    over: box.with(() => over),
    setNodeRef
  };
}
function Drag_overlay($$payload, $$props) {
  push();
  let {
    adjustScale: adjustScale2 = false,
    children,
    style,
    transition,
    modifiers,
    wrapperElement = "div",
    className,
    zIndex = 999
  } = $$props;
  const {
    activatorEvent,
    active,
    activeNodeRect,
    containerNodeRect,
    draggableNodes,
    droppableContainers,
    dragOverlay,
    over,
    measuringConfiguration,
    scrollableAncestors,
    scrollableAncestorRects,
    windowRect
  } = useDndContext();
  const transform = getActiveDraggableContext();
  const modifiedTransform = applyModifiers(modifiers, {
    activatorEvent,
    active,
    activeNodeRect,
    containerNodeRect,
    draggingNodeRect: dragOverlay.rect,
    over,
    overlayNodeRect: dragOverlay.rect,
    scrollableAncestors,
    scrollableAncestorRects,
    transform,
    windowRect
  });
  const initialRect = useInitialValue();
  let onStylesUpdated = () => {
  };
  function handleExit(overlayNode) {
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    Nullified_context_provider($$payload2, {
      children: ($$payload3) => {
        if (active) {
          $$payload3.out.push("<!--[-->");
          $$payload3.out.push(`<!---->`);
          {
            var bind_get = () => null;
            var bind_set = (el) => {
            };
            Positioned_overlay($$payload3, {
              id: active.id,
              get ref() {
                return bind_get();
              },
              set ref($$value) {
                bind_set($$value);
              },
              as: wrapperElement,
              activatorEvent,
              adjustScale: adjustScale2,
              className,
              transition,
              rect: initialRect.current,
              style: { zIndex, ...style },
              transform: modifiedTransform,
              handleExit,
              onStylesUpdated,
              children: ($$payload4) => {
                children?.($$payload4);
                $$payload4.out.push(`<!---->`);
              },
              $$slots: { default: true }
            });
          }
          $$payload3.out.push(`<!---->`);
        } else {
          $$payload3.out.push("<!--[!-->");
        }
        $$payload3.out.push(`<!--]-->`);
      }
    });
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
function arrayMove(array, from, to) {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
}
function getSortedRects(items, rects) {
  return items.reduce((accumulator, id, index) => {
    if (!rects)
      return accumulator;
    const rect = rects.get(id);
    if (rect) {
      accumulator[index] = rect;
    }
    return accumulator;
  }, Array(items.length));
}
function isValidIndex(index) {
  return index !== null && index >= 0;
}
function itemsEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function normalizeDisabled(disabled) {
  if (typeof disabled === "boolean") {
    return {
      draggable: disabled,
      droppable: disabled
    };
  }
  return disabled;
}
const rectSortingStrategy = ({ rects, activeIndex, overIndex, index }) => {
  const newRects = arrayMove(rects, overIndex, activeIndex);
  const oldRect = rects[index];
  const newRect = newRects[index];
  if (!newRect || !oldRect) {
    return null;
  }
  return {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: newRect.width / oldRect.width,
    scaleY: newRect.height / oldRect.height
  };
};
const ID_PREFIX = "Sortable";
const SortableContextKey = Symbol("SortableContext");
const defaultSortableContextValue = {
  activeIndex: -1,
  containerId: ID_PREFIX,
  disableTransforms: false,
  items: [],
  overIndex: -1,
  useDragOverlay: false,
  sortedRects: [],
  strategy: rectSortingStrategy,
  disabled: { draggable: false, droppable: false }
};
function getSortableContext() {
  if (!hasContext(SortableContextKey)) return defaultSortableContextValue;
  return getContext(SortableContextKey)();
}
function Sortable_context($$payload, $$props) {
  push();
  let {
    children,
    id,
    items: userDefinedItems = [],
    // is required
    strategy = rectSortingStrategy,
    disabled: disabledProp = false
  } = $$props;
  const {
    active,
    dragOverlay,
    droppableRects,
    over,
    measureDroppableContainers
  } = useDndContext();
  const containerId = useUniqueId(ID_PREFIX, id);
  const useDragOverlay = Boolean(dragOverlay.rect !== null);
  const items = userDefinedItems.map((item) => typeof item === "object" && "id" in item ? item.id : item);
  const isDragging = active != null;
  const activeIndex = active ? items.indexOf(active.id) : -1;
  const overIndex = over ? items.indexOf(over.id) : -1;
  let previousItemsRef = items;
  const itemsHaveChanged = !itemsEqual(items, previousItemsRef);
  const disableTransforms = overIndex !== -1 && activeIndex === -1 || itemsHaveChanged;
  const disabled = normalizeDisabled(disabledProp);
  watch(() => [itemsHaveChanged, items, isDragging], ([itemsHaveChanged2, items2, isDragging2]) => {
    if (itemsHaveChanged2 && isDragging2) {
      measureDroppableContainers(items2);
    }
  });
  const contextValue = {
    activeIndex,
    containerId,
    disabled,
    disableTransforms,
    items,
    overIndex,
    useDragOverlay,
    sortedRects: getSortedRects(items, droppableRects),
    strategy
  };
  setContext(SortableContextKey, () => contextValue);
  children($$payload);
  $$payload.out.push(`<!---->`);
  pop();
}
const defaultNewIndexGetter = ({ id, items, activeIndex, overIndex }) => arrayMove(items, activeIndex, overIndex).indexOf(id);
const defaultAnimateLayoutChanges = ({ containerId, isSorting, wasDragging, index, items, newIndex, previousItems, previousContainerId, transition }) => {
  if (!transition || !wasDragging) {
    return false;
  }
  if (previousItems !== items && index === newIndex) {
    return false;
  }
  if (isSorting) {
    return true;
  }
  return newIndex !== index && containerId === previousContainerId;
};
const defaultTransition = {
  duration: 200,
  easing: "ease"
};
const transitionProperty = "transform";
const disabledTransition = CSS.Transition.toString({
  property: transitionProperty,
  duration: 0,
  easing: "linear"
});
const defaultAttributes = {
  roleDescription: "sortable"
};
function useDerivedTransform(argsFn) {
  const { rect, disabled, index, node } = argsFn();
  let derivedTransform = null;
  return {
    get current() {
      return derivedTransform;
    }
  };
}
function useSortable(args) {
  const {
    animateLayoutChanges = defaultAnimateLayoutChanges,
    attributes: userDefinedAttributes,
    disabled: localDisabled,
    data: customData,
    getNewIndex = defaultNewIndexGetter,
    id,
    strategy: localStrategy,
    resizeObserverConfig,
    transition = defaultTransition
  } = unwrapResolvableObject(args);
  const {
    items,
    containerId,
    activeIndex,
    disabled: globalDisabled,
    disableTransforms,
    sortedRects,
    overIndex,
    useDragOverlay,
    strategy: globalStrategy
  } = getSortableContext();
  const disabled = normalizeLocalDisabled(localDisabled, globalDisabled);
  const index = items.indexOf(id);
  const data = { sortable: { containerId, index, items }, ...customData };
  const itemsAfterCurrentSortable = items.slice(items.indexOf(id));
  const { rect, node, isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: () => id,
    data: () => data,
    disabled: () => disabled.droppable,
    resizeObserverConfig: () => ({
      updateMeasurementsFor: itemsAfterCurrentSortable,
      ...resizeObserverConfig
    })
  });
  const {
    active,
    activatorEvent,
    activeNodeRect,
    attributes,
    setNodeRef: setDraggableNodeRef,
    listeners,
    isDragging,
    over,
    setActivatorNodeRef,
    transform
  } = useDraggable({
    id: () => id,
    data: () => data,
    attributes: () => ({ ...defaultAttributes, ...userDefinedAttributes }),
    disabled: () => disabled.draggable
  });
  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeRef);
  const isSorting = Boolean(active.current);
  const displaceItem = isSorting && !disableTransforms && isValidIndex(activeIndex) && isValidIndex(overIndex);
  const shouldDisplaceDragSource = !useDragOverlay && isDragging.current;
  const dragSourceDisplacement = shouldDisplaceDragSource && displaceItem ? transform.current : null;
  const strategy = localStrategy ?? globalStrategy;
  const finalTransform = displaceItem ? dragSourceDisplacement ?? strategy({
    rects: sortedRects,
    activeNodeRect: activeNodeRect.current,
    activeIndex,
    overIndex,
    index
  }) : null;
  const newIndex = isValidIndex(activeIndex) && isValidIndex(overIndex) ? getNewIndex({ id, items, activeIndex, overIndex }) : index;
  const activeId = active.current?.id;
  const previous = { activeId, items, newIndex, containerId };
  const itemsHaveChanged = items !== previous.items;
  const shouldAnimateLayoutChanges = animateLayoutChanges({
    active: active.current,
    containerId,
    isDragging: isDragging.current,
    isSorting,
    id,
    index,
    items,
    newIndex: previous.newIndex,
    previousItems: previous.items,
    previousContainerId: previous.containerId,
    transition,
    wasDragging: previous.activeId != null
  });
  useDerivedTransform(() => ({
    disabled: !shouldAnimateLayoutChanges,
    index,
    node: node.current,
    rect: rect.current
  }));
  return {
    active,
    activeIndex: box.with(() => activeIndex),
    attributes,
    data: box.with(() => data),
    rect,
    index: box.with(() => index),
    newIndex: box.with(() => newIndex),
    items: box.with(() => items),
    isOver,
    isSorting: box.with(() => isSorting),
    isDragging,
    listeners,
    node: box.with(() => node.current, setNodeRef),
    activatorNode: box.with(() => null, setActivatorNodeRef),
    // droppableNode: box.with(() => null as unknown as HTMLElement, setDroppableNodeRef),
    // draggableNode: box.with(() => null as unknown as HTMLElement, setDraggableNodeRef),
    overIndex: box.with(() => overIndex),
    over,
    setNodeRef,
    setActivatorNodeRef,
    setDroppableNodeRef,
    setDraggableNodeRef,
    transform: box.with(() => finalTransform),
    transition: box.with(getTransition)
  };
  function getTransition() {
    if (
      // Temporarily disable transitions for a single frame to set up derived transforms
      // TODO: this doesn't seem to work (not sure?), items may still jump to back to their "new" position when items change
      // Or to prevent items jumping to back to their "new" position when items change
      itemsHaveChanged && previous.newIndex === index
    ) {
      return disabledTransition;
    }
    if (shouldDisplaceDragSource && !isKeyboardEvent(activatorEvent.current) || !transition) {
      return void 0;
    }
    if (isSorting || shouldAnimateLayoutChanges) {
      return CSS.Transition.toString({ ...transition, property: transitionProperty });
    }
    return void 0;
  }
}
function normalizeLocalDisabled(localDisabled, globalDisabled) {
  if (typeof localDisabled === "boolean") {
    return {
      draggable: localDisabled,
      // Backwards compatibility
      droppable: false
    };
  }
  return {
    draggable: localDisabled?.draggable ?? globalDisabled.draggable,
    droppable: localDisabled?.droppable ?? globalDisabled.droppable
  };
}
function AddedFilter($$payload, $$props) {
  push();
  let {
    filter,
    draggable = false,
    hoverZone = null,
    hoverGroupId = null
  } = $$props;
  let carot = "fa-caret-up";
  const genomicFilter = ["genomic", "snp"].includes(filter.filterType);
  const anyRecordOfFilter = filter.filterType === "AnyRecordOf";
  let filterModal = false;
  let anyRecordOfModal = false;
  const isHovered = hoverGroupId === filter.uuid;
  const showTopZone = isHovered && hoverZone === "top";
  const showBottomZone = isHovered && hoverZone === "bottom";
  const {
    attributes,
    listeners,
    node,
    activatorNode,
    transform,
    transition,
    isDragging,
    isSorting
  } = useSortable({ id: filter.uuid, data: { type: "item" } });
  const style = (() => {
    const current = transform.current;
    if (current) {
      current.scaleY = 1;
    }
    return styleObjectToString({
      transform: CSS.Transform.toString(current),
      transition: isSorting.current ? transition.current : void 0,
      zIndex: isDragging.current ? 1 : void 0
    });
  })();
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<!---->`);
    {
      $$payload2.out.push(`<div class="relative">`);
      if (showTopZone) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div class="absolute -top-2 left-0 right-0 h-1 bg-primary-500 rounded-full z-10 shadow-lg"></div> <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">Reorder before filter</div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> <div${attr("id", filter.uuid)} class="flex flex-col card bg-surface-100 p-1 m-1"${attr("data-testid", `added-filter-${stringify(filter.id)}`)}${attr("data-sortable-id", filter.uuid)}${attr_style(style)}><header${attr_class(clsx(["card-header p-1 flex", { invisible: isDragging.current }]), "svelte-1ukmkhn")}>`);
      if (draggable && !isDragging.current) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div${spread_attributes(
          {
            class: "flex items-center justify-center bg-surface-100 rounded-l-md p-1 w-7 flex-shrink-0 self-stretch min-h-full",
            ...attributes.current,
            ...listeners.current
          },
          "svelte-1ukmkhn"
        )}><div class="cursor-grab active:cursor-grabbing text-primary-500"><i class="fa-solid fa-grip-vertical" style="color: var(--color-surface-900);"></i></div></div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (!anyRecordOfFilter) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div class="flex-auto variable svelte-1ukmkhn" tabindex="0" role="button">${escape_html(filter.variableName)}</div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
        {
          let trigger = function($$payload3) {
            $$payload3.out.push(`<div class="text-left">${escape_html(filter?.concepts?.length)} variable(s) in ${escape_html(filter.searchResult?.display || filter.searchResult?.name || filter.variableName)}
                category</div>`);
          };
          Modal_1($$payload2, {
            title: "View Variables in Filter",
            "data-testid": `any-record-of-filter-modal-${filter.id}`,
            withDefault: false,
            get open() {
              return anyRecordOfModal;
            },
            set open($$value) {
              anyRecordOfModal = $$value;
              $$settled = false;
            },
            trigger,
            children: ($$payload3) => {
              ViewAnyRecordOfFilter($$payload3, { filter });
            },
            $$slots: { trigger: true, default: true }
          });
        }
      }
      $$payload2.out.push(`<!--]--> <div class="actions svelte-1ukmkhn">`);
      if (genomicFilter) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<button type="button" title="Edit Filter" class="bg-initial text-black-500 hover:text-primary-600"><i class="fa-solid fa-pen-to-square"></i> <span class="sr-only">Edit Filter</span></button>`);
      } else {
        $$payload2.out.push("<!--[!-->");
        if (!anyRecordOfFilter) {
          $$payload2.out.push("<!--[-->");
          {
            let trigger = function($$payload3) {
              $$payload3.out.push(`<i class="fa-solid fa-pen-to-square"></i> <span class="sr-only">Edit Filter</span>`);
            };
            Modal_1($$payload2, {
              title: "Edit Filter",
              triggerBase: "bg-initial text-black-500 hover:text-primary-600",
              withDefault: false,
              get open() {
                return filterModal;
              },
              set open($$value) {
                filterModal = $$value;
                $$settled = false;
              },
              trigger,
              children: ($$payload3) => {
                AddFilter($$payload3, {
                  data: filter.searchResult,
                  existingFilter: filter,
                  onclose: () => filterModal = false
                });
              },
              $$slots: { trigger: true, default: true }
            });
          }
        } else {
          $$payload2.out.push("<!--[!-->");
        }
        $$payload2.out.push(`<!--]-->`);
      }
      $$payload2.out.push(`<!--]--> <button type="button" title="Remove Filter" class="bg-initial text-black-500 hover:text-primary-600"><i class="fa-solid fa-times-circle"></i> <span class="sr-only">Remove Filter</span></button> `);
      if (!anyRecordOfFilter) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<button type="button" title="See details" class="bg-initial text-black-500 hover:text-primary-600"><i${attr_class(`fa-solid ${stringify(carot)}`, "svelte-1ukmkhn")}></i> <span class="sr-only">See details</span></button>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div></header> `);
      {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div> `);
      if (isDragging.current) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div class="absolute inset-0 flex flex-col card pointer-events-none"><header class="card-header p-1 flex"><div class="flex-auto flex items-center justify-center"><div class="text-surface-500 text-sm opacity-50 mt-0.5">Moving filter: ${escape_html(filter.variableName)}</div></div></header></div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (showBottomZone) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div class="absolute -bottom-2 left-0 right-0 h-1 bg-primary-500 rounded-full z-10 shadow-lg"></div> <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">Reorder after filter</div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div>`);
    }
    $$payload2.out.push(`<!---->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
function OperatorDropdown($$payload, $$props) {
  push();
  let { siblingA, siblingB, operator = void 0 } = $$props;
  let id = siblingA.uuid.split("-")[0] + "-" + siblingB.uuid.split("-")[0];
  $$payload.out.push(`<select${attr("data-testid", `operator-dropdown-${id}`)} class="select operator-select">`);
  $$payload.select_value = operator;
  $$payload.out.push(`<option${attr("value", Operator.AND)}${maybe_selected($$payload, Operator.AND)}>${escape_html(Operator.AND)}</option><option${attr("value", Operator.OR)}${maybe_selected($$payload, Operator.OR)}>${escape_html(Operator.OR)}</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select>`);
  bind_props($$props, { operator });
  pop();
}
function FilterGroup_1($$payload, $$props) {
  push();
  let { group = void 0, hoverZone = null, hoverGroupId = null } = $$props;
  let id = group.uuid.split("-")[0];
  const canReorder = group.children.length > 1 && (!group.parent || group.parent.children.length > 1);
  const isRoot = group.parent === void 0 || group.parent === null;
  const isHovered = hoverGroupId === group.uuid;
  const showMiddleZone = isHovered && hoverZone === "middle" && !isRoot;
  const showTopZone = isHovered && hoverZone === "top" && !isRoot;
  const showBottomZone = isHovered && hoverZone === "bottom" && !isRoot;
  const {
    attributes,
    listeners,
    node,
    activatorNode,
    transform,
    transition,
    isDragging,
    isSorting
  } = useSortable({
    id: group.uuid,
    data: {
      type: group.parent === void 0 || group.parent === null ? "root" : "group",
      accepts: ["item"]
    }
  });
  const style = (() => {
    const current = transform.current;
    if (current) {
      current.scaleY = 1;
    }
    return styleObjectToString({
      transform: CSS.Transform.toString(current),
      transition: isSorting.current ? transition.current : void 0,
      zIndex: isDragging.current ? 1 : void 0
    });
  })();
  $$payload.out.push(`<!---->`);
  {
    const each_array = ensure_array_like(group.children);
    $$payload.out.push(`<div class="relative">`);
    if (showTopZone) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="absolute -top-2 left-0 right-0 h-1 bg-primary-500 rounded-full z-10 shadow-lg"></div> <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">Reorder before group</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div${attr("id", `filter-group-${id}`)}${attr("data-testid", `filter-group-${id}`)}${attr("data-sortable-id", group.uuid)} class="flex flex-row items-center gap-0 w-full transition-all"${attr_style(style)}>`);
    if (canReorder && !isRoot) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div${spread_attributes(
        {
          class: "flex items-center justify-center bg-surface-100 rounded-l-md p-1.5 w-7 flex-shrink-0 self-stretch min-h-full",
          ...attributes.current,
          ...listeners.current
        },
        null
      )}><div class="cursor-grab active:cursor-grabbing text-primary-500"><i class="fa-solid fa-grip-vertical" style="color: var(--color-surface-900);"></i></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div${attr_class(`filter-group-${group.operator.toLowerCase()} w-full`)}${attr("data-testid", `filter-group-${id}`)}><!--[-->`);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let child = each_array[index];
      if (index > 0) {
        $$payload.out.push("<!--[-->");
        OperatorDropdown($$payload, {
          siblingA: group.children[index - 1],
          siblingB: group.children[index],
          operator: group.operator
        });
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (child && "children" in child) {
        $$payload.out.push("<!--[-->");
        Sortable_context($$payload, {
          items: child.children.map((c) => c.uuid),
          children: ($$payload2) => {
            FilterGroup_1($$payload2, { group: child, hoverZone, hoverGroupId });
          }});
      } else {
        $$payload.out.push("<!--[!-->");
        AddedFilter($$payload, {
          filter: child,
          draggable: canReorder,
          hoverZone,
          hoverGroupId
        });
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></div> `);
    if (showMiddleZone) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-10 shadow-lg font-medium">Add to group</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (showBottomZone) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="absolute -bottom-2 left-0 right-0 h-1 bg-primary-500 rounded-full z-10 shadow-lg"></div> <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">Reorder after group</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (isDragging.current) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="absolute inset-0 flex flex-row items-center gap-0 pointer-events-none">`);
      if (canReorder && !isRoot) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="flex items-center justify-center bg-surface-200/50 rounded-l-md p-1.5 w-7 flex-shrink-0 self-stretch min-h-full border-2 border-dashed border-surface-400"></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> <div class="flex-1 h-full bg-surface-200/30 border-2 border-dashed border-surface-400 rounded-r-md flex items-center justify-center"><div class="text-surface-500 text-sm opacity-50">Moving group: ${escape_html(group.operator.toLowerCase())}</div></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!---->`);
  bind_props($$props, { group });
  pop();
}
function Filters($$payload, $$props) {
  push();
  var $$store_subs;
  let isOpenAccess = page.url.pathname.includes("/discover");
  let sensors = useSensors(useSensor(TouchSensor), useSensor(KeyboardSensor), useSensor(MouseSensor));
  let activeItem = void 0;
  let hoverZone = null;
  let hoverGroupId = null;
  let currentMouseY = 0;
  function findContainer(id) {
    const node = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === id);
    if (node && store_get($$store_subs ??= {}, "$filterTree", filterTree).isGroup(node)) {
      return node;
    }
    return node?.parent;
  }
  function getDropZone(overGroupId) {
    const elements = document.querySelectorAll("[data-sortable-id]");
    let groupElement;
    elements.forEach((el) => {
      if (el.getAttribute("data-sortable-id") === String(overGroupId)) {
        groupElement = el;
      }
    });
    if (!groupElement) {
      console.warn("Element not found, returning middle as fallback");
      return "middle";
    }
    const rect = groupElement.getBoundingClientRect();
    const relativeY = currentMouseY - rect.top;
    const height = rect.height;
    const percentage = relativeY / height;
    if (percentage < 0.2) return "top";
    if (percentage > 0.8) return "bottom";
    return "middle";
  }
  function onDragStart({ active }) {
    const node = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === active.id);
    if (store_get($$store_subs ??= {}, "$filterTree", filterTree).isGroup(node)) {
      activeItem = node ?? null;
    } else {
      activeItem = node ?? null;
    }
  }
  function onDragOver(event) {
    const { active, over } = event;
    if (!over || !active) {
      hoverZone = null;
      hoverGroupId = null;
      return;
    }
    const activeType = active.data?.type;
    const overType = over?.data?.type;
    const acceptsItem = over?.data?.accepts?.includes("item") ?? false;
    if (activeType === "item" && overType === "group") {
      const zone = getDropZone(over.id);
      hoverZone = zone;
      hoverGroupId = String(over.id);
      if (zone !== "middle") {
        return;
      }
    } else if (activeType === "group" && (overType === "group" || overType === "item" || overType === "root")) {
      if (overType === "root") {
        hoverZone = null;
        hoverGroupId = null;
        return;
      }
      if (overType === "group") {
        const zone = getDropZone(over.id);
        hoverZone = zone === "middle" ? "bottom" : zone;
        hoverGroupId = String(over.id);
      } else {
        const zone = getDropZone(over.id);
        hoverZone = zone === "middle" ? "bottom" : zone;
        hoverGroupId = String(over.id);
      }
      return;
    } else {
      hoverZone = null;
      hoverGroupId = null;
    }
    if (activeType !== "item") return;
    if (!overType && !acceptsItem) return;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;
    const item = activeContainer.children.find((child) => "uuid" in child && child.uuid === active.id);
    if (!item) return;
    activeContainer.children = activeContainer.children.filter((child) => "uuid" in child && child.uuid !== active.id);
    overContainer.children.push(item);
    item.parent = overContainer;
  }
  function onDragEnd({ active, over }) {
    if (!over) {
      activeItem = void 0;
      hoverZone = null;
      hoverGroupId = null;
      return;
    }
    const activeType = active.data?.type;
    const overType = over?.data?.type;
    if (activeType === "group" && (overType === "group" || overType === "item")) {
      const activeNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === active.id);
      const overNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === over.id);
      if (activeNode && overNode) {
        store_get($$store_subs ??= {}, "$filterTree", filterTree).reorderNodes(activeNode, overNode);
      }
    }
    if (activeType === "item" && overType === "group" && (hoverZone === "top" || hoverZone === "bottom")) {
      const activeNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === active.id);
      const overNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === over.id);
      if (activeNode && overNode && overNode.parent) {
        const targetParent = overNode.parent;
        const currentParent = activeNode.parent;
        if (currentParent) {
          currentParent.children = currentParent.children.filter((child) => child !== activeNode);
          currentParent.uuid = genericUUID();
        }
        const overIndex = targetParent.children.indexOf(overNode);
        if (hoverZone === "bottom") {
          targetParent.children.splice(overIndex + 1, 0, activeNode);
        } else {
          targetParent.children.splice(overIndex, 0, activeNode);
        }
        activeNode.parent = targetParent;
        targetParent.uuid = genericUUID();
      }
    }
    if (activeType === "item" && overType === "item") {
      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);
      if (!activeContainer || !overContainer) {
        activeItem = void 0;
        hoverZone = null;
        hoverGroupId = null;
        return;
      }
      if (activeContainer === overContainer) {
        const activeNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === active.id);
        const overNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === over.id);
        if (activeNode && overNode) {
          store_get($$store_subs ??= {}, "$filterTree", filterTree).reorderNodes(activeNode, overNode);
          activeContainer.uuid = genericUUID();
        }
      } else {
        if (activeContainer) activeContainer.uuid = genericUUID();
        if (overContainer) overContainer.uuid = genericUUID();
      }
    }
    if (activeType === "item" && overType === "group" && hoverZone === "middle") {
      const activeNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === active.id);
      const overNode = store_get($$store_subs ??= {}, "$filterTree", filterTree).find((n) => "uuid" in n && n.uuid === over.id);
      if (activeNode?.parent && overNode && store_get($$store_subs ??= {}, "$filterTree", filterTree).isGroup(overNode)) {
        activeNode.parent.uuid = genericUUID();
        overNode.uuid = genericUUID();
      }
    }
    activeItem = void 0;
    hoverZone = null;
    hoverGroupId = null;
    store_get($$store_subs ??= {}, "$filterTree", filterTree).pruneTree();
    store_mutate($$store_subs ??= {}, "$filterTree", filterTree, store_get($$store_subs ??= {}, "$filterTree", filterTree).root.uuid = genericUUID());
    filterTree.set(store_get($$store_subs ??= {}, "$filterTree", filterTree));
  }
  if (store_get($$store_subs ??= {}, "$filters", filters).length + store_get($$store_subs ??= {}, "$genomicFilters", genomicFilters).length + store_get($$store_subs ??= {}, "$exports", exports).length === 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<p class="text-center">No filters added</p>`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$genomicFilters", genomicFilters));
    $$payload.out.push(`<div class="px-4 mb-1 w-80">`);
    if (store_get($$store_subs ??= {}, "$filters", filters).length + store_get($$store_subs ??= {}, "$genomicFilters", genomicFilters).length > 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<header class="text-left ml-1">Filters</header>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <section class="py-1">`);
    if (store_get($$store_subs ??= {}, "$advancedFilteringEnabled", advancedFilteringEnabled) && features.explorer.enableOrQueries && isOpenAccess) {
      $$payload.out.push("<!--[-->");
      Dnd_context($$payload, {
        sensors,
        onDragStart,
        onDragEnd,
        onDragOver,
        children: ($$payload2) => {
          Sortable_context($$payload2, {
            items: store_get($$store_subs ??= {}, "$filterTree", filterTree).root.children.map((child) => child.uuid),
            children: ($$payload3) => {
              FilterGroup_1($$payload3, {
                group: store_get($$store_subs ??= {}, "$filterTree", filterTree).root,
                hoverZone,
                hoverGroupId
              });
            }
          });
          $$payload2.out.push(`<!----> `);
          Drag_overlay($$payload2, {
            children: ($$payload3) => {
              if (activeItem && store_get($$store_subs ??= {}, "$filterTree", filterTree).isGroup(activeItem)) {
                $$payload3.out.push("<!--[-->");
                FilterGroup_1($$payload3, { group: activeItem });
              } else {
                $$payload3.out.push("<!--[!-->");
                if (activeItem) {
                  $$payload3.out.push("<!--[-->");
                  AddedFilter($$payload3, { filter: activeItem });
                } else {
                  $$payload3.out.push("<!--[!-->");
                }
                $$payload3.out.push(`<!--]-->`);
              }
              $$payload3.out.push(`<!--]-->`);
            }
          });
          $$payload2.out.push(`<!---->`);
        },
        $$slots: { default: true }
      });
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$filters", filters));
      $$payload.out.push(`<!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let filter = each_array[$$index];
        AddedFilter($$payload, { filter });
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--> <!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let filter = each_array_1[$$index_1];
      AddedFilter($$payload, { filter });
    }
    $$payload.out.push(`<!--]--></section></div>`);
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ExportedVariable($$payload, $$props) {
  push();
  let { variable } = $$props;
  $$payload.out.push(`<div${attr("id", variable.studyId ? `${variable.studyId}-${variable.conceptPath}` : variable.conceptPath)}${attr("data-testid", `added-export-${stringify(variable.conceptPath)}`)} class="flex flex-col card bg-surface-100 p-1 m-1"><header class="card-header p-1 flex"><div class="flex-auto">${escape_html(variable.display || variable.searchResult?.display || variable.searchResult?.name)}</div> <button type="button" title="Remove Export" class="btn-icon-color" aria-label="Remove Export"><i class="fa-solid fa-times-circle"></i></button></header></div>`);
  pop();
}
function Counts($$payload, $$props) {
  push();
  var $$store_subs;
  function countSettled(counts) {
    return countResult(counts.filter(StatPromise.fullfiled).map(({ value }) => value));
  }
  function hasErrorInCounts(counts) {
    return counts.filter(StatPromise.fullfiled).length === 0 || counts.some(StatPromise.rejected);
  }
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$resultCounts", resultCounts));
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let stat = each_array[$$index];
    $$payload.out.push(`<div class="flex flex-col items-center mt-2">`);
    await_block(
      $$payload,
      Promise.allSettled(StatPromise.list(stat).map(({ promise }) => promise)),
      () => {
        Loading($$payload, { ring: true, size: "mini" });
      },
      (counts) => {
        const count = countSettled(counts);
        const hasError = hasErrorInCounts(counts);
        $$payload.out.push(`<span id="result-count">`);
        if (counts.filter(StatPromise.fullfiled).length === 0) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span class="text-4xl font-bold">N/A</span>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<div class="flex flex-row h-full"><span id="result-count-number" class="text-4xl">${escape_html(count)}</span> `);
          if (hasError) {
            $$payload.out.push("<!--[-->");
            HelpInfoPopup($$payload, {
              type: "exclamation",
              color: "warning",
              id: "result-count-error",
              text: get(filters).length !== 0 ? branding?.explorePage?.filterErrorText : branding?.explorePage?.queryErrorText
            });
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--></div>`);
        }
        $$payload.out.push(`<!--]--></span>`);
      }
    );
    $$payload.out.push(`<!--]--> <h4 class="text-center">${escape_html(stat.label)}</h4></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ResultsPanel($$payload, $$props) {
  push();
  var $$store_subs;
  page.url.pathname;
  let isOpenAccess = page.url.pathname.includes("/discover");
  let isExplorer = page.url.pathname.includes("/explorer");
  let modalOpen = false;
  let enableAdvancedFilteringModalOpen = false;
  let disableAdvancedFilteringModalOpen = false;
  let hasFilterOrExport = store_get($$store_subs ??= {}, "$filters", filters).length !== 0 || features.explorer.exportsEnableExport && store_get($$store_subs ??= {}, "$exports", exports).length !== 0;
  let showExportButton = features.explorer.allowExport && !isOpenAccess && hasFilterOrExport && (store_get($$store_subs ??= {}, "$countsLoading", countsLoading) || store_get($$store_subs ??= {}, "$hasNonZeroResult", hasNonZeroResult));
  let hasValidDistributionFilters = store_get($$store_subs ??= {}, "$filters", filters).length !== 0 && !store_get($$store_subs ??= {}, "$filters", filters).every((filter) => filter.filterType === "genomic" || filter.filterType === "snp" || filter.filterType === "AnyRecordOf");
  let showExplorerDistributions = isExplorer && features.explorer.distributionExplorer && hasValidDistributionFilters;
  let showDiscoverDistributions = isOpenAccess && features.discoverFeautures.distributionExplorer && hasValidDistributionFilters;
  let showVariantExplorer = isExplorer && features.explorer.variantExplorer && store_get($$store_subs ??= {}, "$hasGenomicFilter", hasGenomicFilter);
  let showCohortDetails = isExplorer && features.explorer.enableCohortDetails;
  let showToolSuite = showCohortDetails || (store_get($$store_subs ??= {}, "$filters", filters).length !== 0 || store_get($$store_subs ??= {}, "$exports", exports).length !== 0) && (showExplorerDistributions || showDiscoverDistributions || showVariantExplorer);
  function unsubscribe() {
  }
  onDestroy(unsubscribe);
  function handleAdvancedFilteringToggle(details) {
    if (details.checked) {
      enableAdvancedFilteringModalOpen = true;
    } else {
      if (store_get($$store_subs ??= {}, "$hasOrGroup", hasOrGroup)) {
        advancedFilteringEnabled.set(false);
        disableAdvancedFilteringModalOpen = true;
      } else {
        advancedFilteringEnabled.set(false);
        loadPatientCount(isOpenAccess);
      }
    }
  }
  function proceedEnableAdvancedFiltering() {
    advancedFilteringEnabled.set(true);
    enableAdvancedFilteringModalOpen = false;
    loadPatientCount(isOpenAccess);
  }
  function proceedDisableAdvancedFiltering() {
    disableAdvancedFiltering();
    advancedFilteringEnabled.set(false);
    disableAdvancedFilteringModalOpen = false;
    loadPatientCount(isOpenAccess);
  }
  function cancelDisableAdvancedFiltering() {
    advancedFilteringEnabled.set(true);
    disableAdvancedFilteringModalOpen = false;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    Modal_1($$payload2, {
      title: "Clear All Filters",
      withDefault: true,
      confirmText: "Yes",
      cancelText: "No",
      onconfirm: () => {
        clearFilters();
        clearExports();
      },
      get open() {
        return modalOpen;
      },
      set open($$value) {
        modalOpen = $$value;
        $$settled = false;
      },
      children: ($$payload3) => {
        $$payload3.out.push(`<!---->Are you sure you want to clear all filters?`);
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> `);
    Modal_1($$payload2, {
      title: "Advanced Filtering is now enabled",
      withDefault: true,
      confirmText: "Proceed",
      cancelText: "",
      width: "w-1/3",
      footerButtons: true,
      onconfirm: proceedEnableAdvancedFiltering,
      get open() {
        return enableAdvancedFilteringModalOpen;
      },
      set open($$value) {
        enableAdvancedFilteringModalOpen = $$value;
        $$settled = false;
      },
      children: ($$payload3) => {
        $$payload3.out.push(`<p>With Advanced Filtering, you can build more complex queries by combining filters using "and" and
    "or" with the dropdown menu. As this feature is under active development, some other features
    may not be available with this enabled.</p> <p>What do you think about Advanced Filtering? <a${attr("href", branding.login.contactLink)} target="_blank" rel="noopener noreferrer" class="anchor">Let us know</a>!</p>`);
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> `);
    Modal_1($$payload2, {
      title: "Advanced Filtering will be removed",
      withDefault: true,
      confirmText: "Proceed",
      cancelText: "Cancel",
      confirmClass: "preset-filled-primary-500",
      cancelClass: "preset-tonal-primary border hover:preset-filled-primary-500",
      footerButtons: true,
      width: "w-1/3",
      onconfirm: proceedDisableAdvancedFiltering,
      onclose: cancelDisableAdvancedFiltering,
      get open() {
        return disableAdvancedFilteringModalOpen;
      },
      set open($$value) {
        disableAdvancedFilteringModalOpen = $$value;
        $$settled = false;
      },
      children: ($$payload3) => {
        $$payload3.out.push(`<p>This will remove any "or" filters and filter groups you have added. The filters you have added
    will now be combined using "and".</p>`);
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> <section id="results-panel" class="flex flex-col items-center pt-8 pr-10 w-64">`);
    Counts($$payload2);
    $$payload2.out.push(`<!----> `);
    if (showExportButton) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div class="h-11 mt-4"><button id="export-data-button" type="button" class="btn preset-filled-primary-500"${attr("disabled", store_get($$store_subs ??= {}, "$countsLoading", countsLoading), true)}>Prepare for Analysis</button></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <div id="export-filters" class="flex flex-col items-center mt-7 w-80"><hr class="svelte-qyz27f"/> <div class="flex content-center mt-7"><h5 class="text-xl flex-auto mr-2 mb-2">Filtered Data Summary</h5> `);
    if (hasFilterOrExport) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<button data-testid="clear-all-results-btn" class="anchor text-sm flex-none">Reset</button>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div> `);
    if (store_get($$store_subs ??= {}, "$filters", filters).length > 0 && features.explorer.enableOrQueries && isOpenAccess) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div class="flex items-center justify-between w-full px-4 mt-2 mb-2"><div class="flex items-center gap-2"><span class="text-sm">Advanced Filtering</span> <span class="chip preset-tonal-primary text-xs px-2 py-0.5 rounded" data-testid="advanced-filtering-beta-chip">Beta</span></div> `);
      Switch($$payload2, {
        name: "advanced-filtering-toggle",
        controlActive: "bg-primary-500",
        checked: store_get($$store_subs ??= {}, "$advancedFilteringEnabled", advancedFilteringEnabled),
        onCheckedChange: handleAdvancedFilteringToggle
      });
      $$payload2.out.push(`<!----></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> `);
    Filters($$payload2);
    $$payload2.out.push(`<!----> `);
    if (store_get($$store_subs ??= {}, "$exports", exports).length > 0) {
      $$payload2.out.push("<!--[-->");
      const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$exports", exports));
      $$payload2.out.push(`<div class="px-4 mb-1 w-80"><header class="text-left ml-1" data-testid="export-header">Added Variables</header> <section class="py-1"><!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let variable = each_array[$$index];
        ExportedVariable($$payload2, { variable });
      }
      $$payload2.out.push(`<!--]--></section></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div> `);
    if (showToolSuite) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div class="flex flex-col items-center mt-7"><hr class="svelte-qyz27f"/> <h5 class="text-center text-xl mt-7">Tool Suite</h5> <div class="flex flex-row flex-wrap justify-items-center gap-4 w-80 justify-center">`);
      if (showCohortDetails) {
        $$payload2.out.push("<!--[-->");
        CardButton($$payload2, {
          href: "/explorer/cohort",
          "data-testid": "cohort-details-btn",
          title: "Cohort Details",
          icon: "fa-solid fa-users",
          size: "md",
          active: page.url.pathname.includes("explorer/cohort")
        });
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (showExplorerDistributions) {
        $$payload2.out.push("<!--[-->");
        CardButton($$payload2, {
          href: "/explorer/distributions",
          "data-testid": "distributions-btn",
          title: "Variable Distributions",
          icon: "fa-solid fa-chart-pie",
          size: "md"
        });
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (showDiscoverDistributions) {
        $$payload2.out.push("<!--[-->");
        if (store_get($$store_subs ??= {}, "$hasOrGroup", hasOrGroup)) {
          $$payload2.out.push("<!--[-->");
          {
            let trigger = function($$payload3) {
              CardButton($$payload3, {
                href: "/discover/distributions",
                "data-testid": "distributions-btn",
                title: "Variable Distributions",
                icon: "fa-solid fa-chart-pie",
                size: "md",
                disabled: true
              });
            };
            Popover($$payload2, {
              triggerTypes: ["hover", "focus"],
              placement: "left",
              message: "Variable distributions currently not available with 'OR' queries.",
              trigger,
              $$slots: { trigger: true }
            });
          }
        } else {
          $$payload2.out.push("<!--[!-->");
          CardButton($$payload2, {
            href: "/discover/distributions",
            "data-testid": "distributions-btn",
            title: "Variable Distributions",
            icon: "fa-solid fa-chart-pie",
            size: "md"
          });
        }
        $$payload2.out.push(`<!--]-->`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (showVariantExplorer) {
        $$payload2.out.push("<!--[-->");
        CardButton($$payload2, {
          href: "/explorer/variant",
          "data-testid": "variant-explorer-btn",
          title: "Variant Explorer",
          icon: "fa-solid fa-dna",
          size: "md",
          active: page.url.pathname.includes("explorer/variant")
        });
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></section>`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SidePanel($$payload, $$props) {
  push();
  var $$store_subs;
  onDestroy(() => {
  });
  $$payload.out.push(`<div id="side-panel"${attr_class(`flex ${stringify(store_get($$store_subs ??= {}, "$panelOpen", panelOpen) ? "open" : "closed")}-panel`)}><div id="side-panel-bar" class="svelte-19rrhxy"><button type="button" id="results-panel-toggle"${attr("title", `${stringify(store_get($$store_subs ??= {}, "$panelOpen", panelOpen) ? "Hide" : "Show")} Results`)} class="btn-icon btn-icon-sm preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 svelte-19rrhxy" aria-label="Toggle Results Panel"><i${attr_class(`fa-solid ${stringify(store_get($$store_subs ??= {}, "$panelOpen", panelOpen) ? "fa-arrow-right" : "fa-arrow-left")}`)}></i></button></div> `);
  if (store_get($$store_subs ??= {}, "$panelOpen", panelOpen)) {
    $$payload.out.push("<!--[-->");
    ResultsPanel($$payload);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Drawer($$payload, $$props) {
  var $$store_subs;
  let { position = "right", width = "w-[480px]", trigger, children } = $$props;
  const justify = position === "left" ? "justify-start" : "justify-end";
  {
    let content = function($$payload2) {
      children?.($$payload2);
      $$payload2.out.push(`<!---->`);
    };
    Modal($$payload, {
      open: store_get($$store_subs ??= {}, "$drawerState", open),
      onOpenChange: (e) => store_set(open, e.open),
      triggerBase: "btn preset-tonal",
      contentBase: `bg-surface-50-950 p-4 space-y-4 shadow-xl ${stringify(width)} h-screen overflow-auto`,
      positionerJustify: justify,
      positionerAlign: "",
      positionerPadding: "",
      transitionsPositionerIn: { x: -480, duration: 200 },
      transitionsPositionerOut: { x: -480, duration: 200 },
      ids: { content: "drawer" },
      trigger,
      content,
      $$slots: { content: true }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
}
function DashboardDrawer($$payload, $$props) {
  push();
  var $$store_subs;
  const datasetId = store_get($$store_subs ??= {}, "$activeRow", activeRow)?.dataset_id || "";
  const title = store_get($$store_subs ??= {}, "$activeRow", activeRow)?.name || "";
  const link = store_get($$store_subs ??= {}, "$activeRow", activeRow)?.additional_info_link || "";
  async function getDataset() {
    const details = await getDatasetDetails(datasetId);
    if (!details || Object.keys(details).length === 0) throw new Error("No details found");
    if (details.datasetId) {
      delete details.datasetId;
    }
    if (details.studyFullname) {
      delete details.studyFullname;
    }
    return details;
  }
  if (title) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<h2 data-testid="drawer-title" class="text-2xl font-bold ml-4">${escape_html(title)}</h2>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <hr/> `);
  await_block(
    $$payload,
    getDataset(),
    () => {
      Loading($$payload, { ring: true, size: "medium" });
    },
    (details) => {
      const each_array = ensure_array_like(Object.entries(details));
      $$payload.out.push(`<ul data-testid="drawer-details" class="m-4 p-4"><!--[-->`);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let [key, value] = each_array[$$index_1];
        if (value) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<li class="m-2"><strong class="capitalize">${escape_html(key.replace(/([A-Z])/g, " $1").toLowerCase().trim())}</strong>: `);
          if (Array.isArray(value)) {
            $$payload.out.push("<!--[-->");
            const each_array_1 = ensure_array_like(value);
            $$payload.out.push(`<ul class="list-disc"><!--[-->`);
            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
              let item = each_array_1[$$index];
              if (item) {
                $$payload.out.push("<!--[-->");
                $$payload.out.push(`<li class="ml-8">${escape_html(item)}</li>`);
              } else {
                $$payload.out.push("<!--[!-->");
              }
              $$payload.out.push(`<!--]-->`);
            }
            $$payload.out.push(`<!--]--></ul>`);
          } else {
            $$payload.out.push("<!--[!-->");
            $$payload.out.push(`${escape_html(value)}`);
          }
          $$payload.out.push(`<!--]--></li>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--></ul> `);
      if (link) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="flex justify-center items-center mb-4"><a${attr("href", link || "#")} class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500" target="_blank">More Info</a></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
  );
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FilterWarning($$payload, $$props) {
  push();
  var $$store_subs;
  let { open: open2 = false } = $$props;
  const filterWarnings = {
    stigmatizing: {
      message: "Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover",
      backTo: "Explore",
      path: "/discover",
      back: "/explorer",
      resetQuery: () => {
        removeGenomicFilters();
        removeUnallowedFilters();
      }
    },
    notAuthorized: {
      message: "You are not authorized to access the data in Explore based on your selected filters.",
      backTo: "Discover",
      path: "/explorer",
      back: "/discover",
      resetQuery: () => removeInvalidFilters()
    },
    undefined: {
      message: "",
      backTo: "",
      path: "/",
      back: "/",
      resetQuery: () => {
      }
    }
  };
  const warning = filterWarnings[store_get($$store_subs ??= {}, "$filterWarning", filterWarning) || "undefined"];
  {
    let content = function($$payload2) {
      ErrorAlert($$payload2, {
        "data-testid": "sendfilter-warning",
        color: "warning",
        children: ($$payload3) => {
          $$payload3.out.push(`<p>${escape_html(warning.message)}</p> <p>Would you like to remove the invalid filters or go back to ${escape_html(warning.backTo)}?</p> <div><button class="btn preset-outlined-warning-500 hover:preset-filled-warning-500">Remove Invalid Filters</button> <button class="btn preset-outlined-warning-500 hover:preset-filled-warning-500">Back to ${escape_html(warning.backTo)}</button></div>`);
        }
      });
    };
    Modal($$payload, {
      open: open2,
      onOpenChange: (e) => open2 = e.open,
      contentBase: "overflow-auto max-w-screen w-1/2 max-h-screen",
      backdropClasses: "backdrop-blur-sm",
      ids: { content: "modal-component" },
      content,
      $$slots: { content: true }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { open: open2 });
  pop();
}
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  let filterWarningModal = false;
  let showSidebar = (page.url.pathname.includes("/explorer") || page.url.pathname.includes("/discover")) && !page.url.pathname.includes("/export") && !page.url.pathname.includes("/distributions");
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    Toaster($$payload2, { toaster });
    $$payload2.out.push(`<!----> `);
    FilterWarning($$payload2, {
      get open() {
        return filterWarningModal;
      },
      set open($$value) {
        filterWarningModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    Drawer($$payload2, {
      position: "right",
      width: "w-1/2",
      children: ($$payload3) => {
        DashboardDrawer($$payload3);
      }
    });
    $$payload2.out.push(`<!----> `);
    {
      let header = function($$payload3) {
        Navigation($$payload3);
      }, sidebarRight = function($$payload3) {
        if (showSidebar) {
          $$payload3.out.push("<!--[-->");
          $$payload3.out.push(`<div id="sidebar-right" class="flex overflow-auto">`);
          SidePanel($$payload3);
          $$payload3.out.push(`<!----></div>`);
        } else {
          $$payload3.out.push("<!--[!-->");
        }
        $$payload3.out.push(`<!--]-->`);
      }, pageFooter = function($$payload3) {
        Footer($$payload3, {});
      };
      Shell($$payload2, {
        header,
        sidebarRight,
        pageFooter,
        children: ($$payload3) => {
          children?.($$payload3);
          $$payload3.out.push(`<!---->`);
        }
      });
    }
    $$payload2.out.push(`<!---->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-DlgR83df.js.map
