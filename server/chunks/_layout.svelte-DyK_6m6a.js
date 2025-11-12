import { x as push, V as copy_payload, W as assign_payload, z as pop, U as store_get, X as unsubscribe_stores, Z as bind_props, Q as stringify, a0 as store_set, M as escape_html, N as attr_class, O as attr, S as ensure_array_like, Y as await_block, R as props_id, T as spread_attributes } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import '@sveltejs/kit/internal';
import { l as get } from './utils-Dn8W3aSK.js';
import './client2-2LGcfZLB.js';
import { T as Toaster, F as Footer } from './Footer-wN4pgPuX.js';
import { t as toaster, L as isUserLoggedIn, p as createAnatomy, N as userRoutes, u as user, i as isLoggedIn, d as createMachine, O as observeAttributes, P as observeChildren } from './User-CGCqDR6a.js';
import { r as removeInvalidFilters, f as filterWarning, a as removeGenomicFilters, b as removeUnallowedFilters, c as filters, h as hasGenomicFilter, d as clearFilters } from './Filter-D4fknGLB.js';
import { f as features, b as branding } from './configuration-wjj69jIJ.js';
import { c as createProps, o as onDestroy, L as Loading, u as useMachine, n as normalizeProps } from './Loading-D4A6B7i5.js';
import { L as Logo } from './Logo-CzJKUKHy.js';
import { P as Popover } from './Popover-Bb0SyMGZ.js';
import { e as exports, c as clearExports } from './Export-BN3JIXjt.js';
import { c as countsLoading, h as hasNonZeroResult, r as resultCounts } from './ResultStore-CoMBZKfX.js';
import './GeneFilter-BMVl5JLp.js';
import '@sveltejs/kit';
import { a as Modal, M as Modal_1 } from './Modal-CHSSe0AJ.js';
import { A as AddFilter } from './AddFilter-DdRxu9jO.js';
import { C as CardButton } from './CardButton-BSvkZqlJ.js';
import { S as StatPromise, c as countResult } from './StatBuilder-CYjZEmyU.js';
import { H as HelpInfoPopup } from './HelpInfoPopup-DgfCX4zR.js';
import './HTML-1Mhr8hI4.js';
import { p as panelOpen } from './SidePanel-C0oDvhAm.js';
import { o as open, a as activeRow } from './Dashboard-Cj6KpSVW.js';
import { g as getDatasetDetails } from './Dictionary-SO9EnU4C.js';
import { E as ErrorAlert } from './ErrorAlert-BJMruCzq.js';
import './html2-FW6Ia4bL.js';
import 'uuid';
import '@floating-ui/dom';
import './OptionsSelectionList-B-cROXFf.js';
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
function AddedFilter($$payload, $$props) {
  push();
  let { filter } = $$props;
  let carot = "fa-caret-up";
  const genomicFilter = ["genomic", "snp"].includes(filter.filterType);
  const anyRecordOfFilter = filter.filterType === "AnyRecordOf";
  let filterModal = false;
  let anyRecordOfModal = false;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<div${attr("id", filter.uuid)} class="flex flex-col card bg-surface-100 p-1 m-1"${attr("data-testid", `added-filter-${stringify(filter.id)}`)}><header class="card-header p-1 flex svelte-1ukmkhn">`);
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
    $$payload2.out.push(`<!--]--></div>`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
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
    if (store_get($$store_subs ??= {}, "$filters", filters).length === 0 && store_get($$store_subs ??= {}, "$exports", exports).length === 0) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<p class="text-center">No filters added</p>`);
    } else {
      $$payload2.out.push("<!--[!-->");
      const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$filters", filters));
      $$payload2.out.push(`<div class="px-4 mb-1 w-80">`);
      if (store_get($$store_subs ??= {}, "$filters", filters).length !== 0) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<header class="text-left ml-1">Filters</header>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> <section class="py-1"><!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let filter = each_array[$$index];
        AddedFilter($$payload2, { filter });
      }
      $$payload2.out.push(`<!--]--></section></div>`);
    }
    $$payload2.out.push(`<!--]--> `);
    if (store_get($$store_subs ??= {}, "$exports", exports).length !== 0) {
      $$payload2.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$exports", exports));
      $$payload2.out.push(`<div class="px-4 mb-1 w-80"><header class="text-left ml-1" data-testid="export-header">Added Variables</header> <section class="py-1"><!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let variable = each_array_1[$$index_1];
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
        CardButton($$payload2, {
          href: "/discover/distributions",
          "data-testid": "distributions-btn",
          title: "Variable Distributions",
          icon: "fa-solid fa-chart-pie",
          size: "md"
        });
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
        $$payload3.out.push(`<div class="alert-banner svelte-1rilbx2"><p>Because of a lapse in government funding, the information on this website may not be up to date,
        transactions submitted via the website may not be processed, and the agency may not be able to
        respond to inquiries until appropriations are enacted. The NIH Clinical Center (the research
        hospital of NIH) is open. For more details about its operating status, please visit <a href="http://cc.nih.gov/" class="anchor" target="_blank" rel="noopener noreferrer">cc.nih.gov.</a> Updates regarding government operating status and resumption of normal operations can be found at <a href="http://opm.gov/" class="anchor" target="_blank" rel="noopener noreferrer">opm.gov.</a></p></div> `);
        Navigation($$payload3);
        $$payload3.out.push(`<!---->`);
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
//# sourceMappingURL=_layout.svelte-DyK_6m6a.js.map
