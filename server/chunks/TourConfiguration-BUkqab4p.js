import { x as push, U as store_get, V as copy_payload, W as assign_payload, X as unsubscribe_stores, z as pop, O as attr, M as escape_html, Y as await_block, a0 as store_set, S as ensure_array_like, R as props_id, T as spread_attributes, Q as stringify, a6 as element, N as attr_class, a2 as attr_style } from './index-C9dy-hDW.js';
import { p as page } from './index2-CFqWCRce.js';
import { g as goto } from './client2-BVaV_p61.js';
import { b as branding, f as features } from './configuration-BAm0JRx1.js';
import { s as searchTerm, a as selectedFacets, f as error, t as tableHandler, l as loading, h as tour, o as openFacets, i as facetsPromise, j as hiddenFacets, k as searchPromise, S as SearchStore } from './Dictionary-Cym6J1qH.js';
import { p as createAnatomy, d as createMachine, Q as createGuards, w as warn, ag as prevById, ah as nextById, ai as last, aj as first, av as add, aw as remove, ao as getEventKey, X as isSafari, V as dataAttr, aq as queryAll } from './User-CeJunCPd.js';
import { l as genericUUID, d as clearFilters } from './Filter-DSKDPPqy.js';
import { c as createProps, u as useMachine, n as normalizeProps, L as Loading } from './Loading-Bei-CWQ1.js';
import { E as ExportStore, c as clearExports } from './Export-DV6CwdT5.js';
import { R as RemoteTable } from './RemoteTable-CuygI6T5.js';
import { S as Searchbox } from './Searchbox-CmXpWjCV.js';
import { c as createContext } from './create-context-D9swWN1U.js';
import { E as ErrorAlert } from './ErrorAlert-BNxDBqzK.js';
import { driver } from 'driver.js';
import { s as sanitizeHTML } from './HTML-1Mhr8hI4.js';
import { M as Modal_1 } from './Modal-C5zQSBqd.js';
import { h as html } from './html2-FW6Ia4bL.js';

var anatomy = createAnatomy("accordion").parts("root", "item", "itemTrigger", "itemContent", "itemIndicator");
var parts = anatomy.build();
var getRootId = (ctx) => ctx.ids?.root ?? `accordion:${ctx.id}`;
var getItemId = (ctx, value) => ctx.ids?.item?.(value) ?? `accordion:${ctx.id}:item:${value}`;
var getItemContentId = (ctx, value) => ctx.ids?.itemContent?.(value) ?? `accordion:${ctx.id}:content:${value}`;
var getItemTriggerId = (ctx, value) => ctx.ids?.itemTrigger?.(value) ?? `accordion:${ctx.id}:trigger:${value}`;
var getRootEl = (ctx) => ctx.getById(getRootId(ctx));
var getTriggerEls = (ctx) => {
  const ownerId = CSS.escape(getRootId(ctx));
  const selector = `[aria-controls][data-ownedby='${ownerId}']:not([disabled])`;
  return queryAll(getRootEl(ctx), selector);
};
var getFirstTriggerEl = (ctx) => first(getTriggerEls(ctx));
var getLastTriggerEl = (ctx) => last(getTriggerEls(ctx));
var getNextTriggerEl = (ctx, id) => nextById(getTriggerEls(ctx), getItemTriggerId(ctx, id));
var getPrevTriggerEl = (ctx, id) => prevById(getTriggerEls(ctx), getItemTriggerId(ctx, id));
function connect(service, normalize) {
  const { send, context, prop, scope, computed } = service;
  const focusedValue = context.get("focusedValue");
  const value = context.get("value");
  const multiple = prop("multiple");
  function setValue(value2) {
    let nextValue = value2;
    if (!multiple && nextValue.length > 1) {
      nextValue = [nextValue[0]];
    }
    send({ type: "VALUE.SET", value: nextValue });
  }
  function getItemState(props2) {
    return {
      expanded: value.includes(props2.value),
      focused: focusedValue === props2.value,
      disabled: Boolean(props2.disabled ?? prop("disabled"))
    };
  }
  return {
    focusedValue,
    value,
    setValue,
    getItemState,
    getRootProps() {
      return normalize.element({
        ...parts.root.attrs,
        dir: prop("dir"),
        id: getRootId(scope),
        "data-orientation": prop("orientation")
      });
    },
    getItemProps(props2) {
      const itemState = getItemState(props2);
      return normalize.element({
        ...parts.item.attrs,
        dir: prop("dir"),
        id: getItemId(scope, props2.value),
        "data-state": itemState.expanded ? "open" : "closed",
        "data-focus": dataAttr(itemState.focused),
        "data-disabled": dataAttr(itemState.disabled),
        "data-orientation": prop("orientation")
      });
    },
    getItemContentProps(props2) {
      const itemState = getItemState(props2);
      return normalize.element({
        ...parts.itemContent.attrs,
        dir: prop("dir"),
        role: "region",
        id: getItemContentId(scope, props2.value),
        "aria-labelledby": getItemTriggerId(scope, props2.value),
        hidden: !itemState.expanded,
        "data-state": itemState.expanded ? "open" : "closed",
        "data-disabled": dataAttr(itemState.disabled),
        "data-focus": dataAttr(itemState.focused),
        "data-orientation": prop("orientation")
      });
    },
    getItemIndicatorProps(props2) {
      const itemState = getItemState(props2);
      return normalize.element({
        ...parts.itemIndicator.attrs,
        dir: prop("dir"),
        "aria-hidden": true,
        "data-state": itemState.expanded ? "open" : "closed",
        "data-disabled": dataAttr(itemState.disabled),
        "data-focus": dataAttr(itemState.focused),
        "data-orientation": prop("orientation")
      });
    },
    getItemTriggerProps(props2) {
      const { value: value2 } = props2;
      const itemState = getItemState(props2);
      return normalize.button({
        ...parts.itemTrigger.attrs,
        type: "button",
        dir: prop("dir"),
        id: getItemTriggerId(scope, value2),
        "aria-controls": getItemContentId(scope, value2),
        "aria-expanded": itemState.expanded,
        disabled: itemState.disabled,
        "data-orientation": prop("orientation"),
        "aria-disabled": itemState.disabled,
        "data-state": itemState.expanded ? "open" : "closed",
        "data-ownedby": getRootId(scope),
        onFocus() {
          if (itemState.disabled) return;
          send({ type: "TRIGGER.FOCUS", value: value2 });
        },
        onBlur() {
          if (itemState.disabled) return;
          send({ type: "TRIGGER.BLUR" });
        },
        onClick(event) {
          if (itemState.disabled) return;
          if (isSafari()) {
            event.currentTarget.focus();
          }
          send({ type: "TRIGGER.CLICK", value: value2 });
        },
        onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (itemState.disabled) return;
          const keyMap = {
            ArrowDown() {
              if (computed("isHorizontal")) return;
              send({ type: "GOTO.NEXT", value: value2 });
            },
            ArrowUp() {
              if (computed("isHorizontal")) return;
              send({ type: "GOTO.PREV", value: value2 });
            },
            ArrowRight() {
              if (!computed("isHorizontal")) return;
              send({ type: "GOTO.NEXT", value: value2 });
            },
            ArrowLeft() {
              if (!computed("isHorizontal")) return;
              send({ type: "GOTO.PREV", value: value2 });
            },
            Home() {
              send({ type: "GOTO.FIRST", value: value2 });
            },
            End() {
              send({ type: "GOTO.LAST", value: value2 });
            }
          };
          const key = getEventKey(event, {
            dir: prop("dir"),
            orientation: prop("orientation")
          });
          const exec = keyMap[key];
          if (exec) {
            exec(event);
            event.preventDefault();
          }
        }
      });
    }
  };
}
var { and, not } = createGuards();
var machine = createMachine({
  props({ props: props2 }) {
    return {
      collapsible: false,
      multiple: false,
      orientation: "vertical",
      defaultValue: [],
      ...props2
    };
  },
  initialState() {
    return "idle";
  },
  context({ prop, bindable }) {
    return {
      focusedValue: bindable(() => ({
        defaultValue: null,
        sync: true,
        onChange(value) {
          prop("onFocusChange")?.({ value });
        }
      })),
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
    isHorizontal: ({ prop }) => prop("orientation") === "horizontal"
  },
  on: {
    "VALUE.SET": {
      actions: ["setValue"]
    }
  },
  states: {
    idle: {
      on: {
        "TRIGGER.FOCUS": {
          target: "focused",
          actions: ["setFocusedValue"]
        }
      }
    },
    focused: {
      on: {
        "GOTO.NEXT": {
          actions: ["focusNextTrigger"]
        },
        "GOTO.PREV": {
          actions: ["focusPrevTrigger"]
        },
        "TRIGGER.CLICK": [
          {
            guard: and("isExpanded", "canToggle"),
            actions: ["collapse"]
          },
          {
            guard: not("isExpanded"),
            actions: ["expand"]
          }
        ],
        "GOTO.FIRST": {
          actions: ["focusFirstTrigger"]
        },
        "GOTO.LAST": {
          actions: ["focusLastTrigger"]
        },
        "TRIGGER.BLUR": {
          target: "idle",
          actions: ["clearFocusedValue"]
        }
      }
    }
  },
  implementations: {
    guards: {
      canToggle: ({ prop }) => !!prop("collapsible") || !!prop("multiple"),
      isExpanded: ({ context, event }) => context.get("value").includes(event.value)
    },
    actions: {
      collapse({ context, prop, event }) {
        const next = prop("multiple") ? remove(context.get("value"), event.value) : [];
        context.set("value", next);
      },
      expand({ context, prop, event }) {
        const next = prop("multiple") ? add(context.get("value"), event.value) : [event.value];
        context.set("value", next);
      },
      focusFirstTrigger({ scope }) {
        getFirstTriggerEl(scope)?.focus();
      },
      focusLastTrigger({ scope }) {
        getLastTriggerEl(scope)?.focus();
      },
      focusNextTrigger({ context, scope }) {
        const focusedValue = context.get("focusedValue");
        if (!focusedValue) return;
        const triggerEl = getNextTriggerEl(scope, focusedValue);
        triggerEl?.focus();
      },
      focusPrevTrigger({ context, scope }) {
        const focusedValue = context.get("focusedValue");
        if (!focusedValue) return;
        const triggerEl = getPrevTriggerEl(scope, focusedValue);
        triggerEl?.focus();
      },
      setFocusedValue({ context, event }) {
        context.set("focusedValue", event.value);
      },
      clearFocusedValue({ context }) {
        context.set("focusedValue", null);
      },
      setValue({ context, event }) {
        context.set("value", event.value);
      },
      coarseValue({ context, prop }) {
        if (!prop("multiple") && context.get("value").length > 1) {
          warn(`The value of accordion should be a single value when multiple is false.`);
          context.set("value", [context.get("value")[0]]);
        }
      }
    }
  }
});
createProps()([
  "collapsible",
  "dir",
  "disabled",
  "getRootNode",
  "id",
  "ids",
  "multiple",
  "onFocusChange",
  "onValueChange",
  "orientation",
  "value",
  "defaultValue"
]);
createProps()(["value", "disabled"]);
const [setAccordionContext, getAccordionContext] = createContext();
function Accordion$1($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    animationConfig = { duration: 200 },
    base = "",
    padding = "",
    spaceY = "space-y-2",
    rounded = "rounded-base",
    width = "w-full",
    classes = "",
    children,
    iconOpen,
    iconClosed,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const service = useMachine(machine, () => ({ id, ...zagProps }));
  const api = connect(service, normalizeProps);
  setAccordionContext({
    get api() {
      return api;
    },
    get animationConfig() {
      return animationConfig;
    },
    get iconClosed() {
      return iconClosed;
    },
    get iconOpen() {
      return iconOpen;
    }
  });
  $$payload.out.push(`<div${spread_attributes(
    {
      class: `${stringify(base)} ${stringify(padding)} ${stringify(spaceY)} ${stringify(rounded)} ${stringify(width)} ${stringify(classes)}`,
      ...api.getRootProps(),
      "data-testid": "accordion"
    },
    null
  )}>`);
  children?.($$payload);
  $$payload.out.push(`<!----></div>`);
  pop();
}
function AccordionItem($$payload, $$props) {
  push();
  const {
    headingLevel = 3,
    // Root
    base,
    spaceY,
    classes,
    // Control
    controlBase = "flex text-start items-center space-x-4 w-full",
    controlHover = "hover:preset-tonal-primary",
    controlPadding = "py-2 px-4",
    controlRounded = "rounded-base",
    controlClasses,
    // Lead
    leadBase = "",
    leadClasses = "",
    // Content
    contentBase = "flex-1",
    contentClasses = "",
    // Indicator
    indicatorBase = "",
    indicatorClasses = "",
    // Panel
    panelBase,
    panelPadding = "py-2 px-4",
    panelRounded,
    panelClasses,
    // Snippets
    control,
    lead,
    panel,
    $$slots,
    $$events,
    ...zagProps
  } = $$props;
  const ctx = getAccordionContext();
  $$payload.out.push(`<div${spread_attributes(
    {
      class: `${stringify(base)} ${stringify(spaceY)} ${stringify(classes)}`,
      ...ctx.api.getItemProps(zagProps),
      "data-testid": "accordion-item"
    },
    null
  )}>`);
  element($$payload, `h${headingLevel}`, void 0, () => {
    $$payload.out.push(`<button${spread_attributes(
      {
        class: `${stringify(controlBase)} ${stringify(controlHover)} ${stringify(controlPadding)} ${stringify(controlRounded)} ${stringify(controlClasses)}`,
        ...ctx.api.getItemTriggerProps(zagProps),
        "data-testid": "accordion-control"
      },
      null
    )}>`);
    if (lead) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div${attr_class(`${stringify(leadBase)} ${stringify(leadClasses)}`)} data-testid="accordion-lead">`);
      lead($$payload);
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div${attr_class(`${stringify(contentBase)} ${stringify(contentClasses)}`)} data-testid="accordion-control">`);
    control($$payload);
    $$payload.out.push(`<!----></div> <div${attr_class(`${stringify(indicatorBase)} ${stringify(indicatorClasses)}`)} data-testid="accordion-indicator">`);
    if (ctx.api.value.includes(zagProps.value)) {
      $$payload.out.push("<!--[-->");
      if (ctx.iconOpen) {
        $$payload.out.push("<!--[-->");
        ctx.iconOpen($$payload);
        $$payload.out.push(`<!---->`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`−`);
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (ctx.iconClosed) {
        $$payload.out.push("<!--[-->");
        ctx.iconClosed($$payload);
        $$payload.out.push(`<!---->`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`+`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></button>`);
  });
  $$payload.out.push(` `);
  if (ctx.api.value.includes(zagProps.value)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${spread_attributes(
      {
        class: `${stringify(panelBase)} ${stringify(panelPadding)} ${stringify(panelRounded)} ${stringify(panelClasses)}`,
        ...ctx.api.getItemContentProps(zagProps),
        "data-testid": "accordion-panel"
      },
      null
    )}>`);
    panel?.($$payload);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
const Accordion = /* @__PURE__ */ Object.assign(Accordion$1, { Item: AccordionItem });
function Actions($$payload, $$props) {
  push();
  var $$store_subs;
  let { exports } = ExportStore;
  let { data = {} } = $$props;
  let exportItem = {
    id: genericUUID(),
    searchResult: data.row,
    display: data.row.display || data.row.name,
    conceptPath: data.row.conceptPath
  };
  let isOpenAccess = page.url.pathname.includes("/discover");
  let isExported = store_get($$store_subs ??= {}, "$exports", exports).map((exp) => exp.conceptPath).includes(exportItem.conceptPath);
  let shouldDisableFilter = isOpenAccess && !data.row.allowFiltering;
  $$payload.out.push(`<button type="button" title="Information" class="btn-icon-color"><i class="fa-solid fa-circle-info fa-xl"></i> <span class="sr-only">View Information</span></button> <button type="button"${attr("title", shouldDisableFilter ? "Filtering is not available for this variable" : "Filter")} class="btn-icon-color"${attr("disabled", shouldDisableFilter, true)}><i class="fa-solid fa-filter fa-xl"></i> <span class="sr-only">${escape_html(shouldDisableFilter ? "Filtering is not available for this variable" : "View Filter")}</span></button> `);
  if (features.explorer.enableHierarchy) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button" title="Data Hierarchy" class="btn-icon-color"><i class="fa-solid fa-sitemap fa-xl"></i> <span class="sr-only">View Data Hierarchy</span></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (features.explorer.exportsEnableExport && !isOpenAccess) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button"${attr("title", isExported ? "Remove from Analysis" : "Add for Analysis")} class="btn-icon-color">`);
    if (isExported) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-regular fa-square-check fa-xl"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<i class="fa-solid fa-right-from-bracket fa-xl"></i>`);
    }
    $$payload.out.push(`<!--]--></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FacetItem_1($$payload, $$props) {
  push();
  var $$store_subs;
  let { selectedFacets: selectedFacets2 } = SearchStore;
  let { facet } = $$props;
  let checkedState = (facetToCheck) => {
    const atLeastOneChildSelected = facet.children && facet.children.some((child) => store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets2).some((f) => f.name === child.name));
    let isEveryChildSelected = false;
    if (atLeastOneChildSelected) {
      isEveryChildSelected = facet.children?.every((child) => store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets2).some((f) => f.name === child.name)) ?? false;
    }
    const isIndeterminate = atLeastOneChildSelected && !isEveryChildSelected;
    const isSelected = store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets2).some((facet2) => facet2.name === facetToCheck) || isEveryChildSelected;
    if (isSelected) return "true";
    if (isIndeterminate) return "indeterminate";
    return "false";
  };
  let checked = checkedState(facet.name) === "true";
  facet.children ? [
    ...facet.children.filter((child) => {
      const matchesFilter = true;
      return matchesFilter && store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets2).some((f) => f.name === child.name);
    }).sort((a, b) => (b.count || 0) - (a.count || 0)),
    ...facet.children.filter((child) => {
      const matchesFilter = true;
      return matchesFilter && !store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets2).some((f) => f.name === child.name);
    }).sort((a, b) => (b.count || 0) - (a.count || 0))
  ] : [];
  $$payload.out.push(`<label${attr("data-testid", `facet-${facet.name}-label`)}${attr("for", facet.name)} class="flex gap-1 m-1 leading-[normal]">`);
  if (facet?.children !== void 0 && facet?.children?.length > 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button" class="arrow-button svelte-dze0eo"${attr("aria-label", `Toggle Facet ${stringify("closed")}`)}${attr("data-testid", `facet-${facet.name}-arrow`)}><i${attr_class(`fa-solid ${stringify("fa-angle-right")}`)}></i></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <input type="checkbox"${attr_class(`&[aria-disabled=“true”]:opacity-75 ${checkedState(facet.name)}`, "svelte-dze0eo")}${attr("id", facet.name)}${attr("name", facet.name)}${attr("value", facet)}${attr("checked", checked, true)}${attr("disabled", facet.count === 0 && !checked, true)}${attr("aria-checked", checked)}/> <span style="word-wrap: break-word; overflow-wrap: anywhere;"${attr_class("", void 0, { "opacity-75": facet.count === 0 })}>${escape_html(`${facet.display} (${facet.count?.toLocaleString()})`)}</span></label> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FacetCategory($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    facetCategory,
    facets = facetCategory.facets,
    numFacetsToShow = 5
  } = $$props;
  let textFilterValue = "";
  let showMore = false;
  let filteredHiddenFacets = facets.filter((f) => !(store_get($$store_subs ??= {}, "$hiddenFacets", hiddenFacets)[facetCategory.name] || []).includes(f.name));
  let overShowLimit = filteredHiddenFacets.length > numFacetsToShow;
  let facetsToDisplay = (facets || textFilterValue || showMore || store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets) || facetCategory) && getFacetsToDisplay();
  let selectedFacetsChips = store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).filter((facet) => facet?.categoryRef?.name === facetCategory?.name);
  function isIndeterminate(facet) {
    const atLeastOneChildSelected = facet.children?.some((child) => store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).some((f) => f.name === child.name)) ?? false;
    const isEveryChildSelected = facet.children?.length ? facet.children.every((child) => store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).some((f) => f.name === child.name)) : false;
    return atLeastOneChildSelected && !isEveryChildSelected;
  }
  function isParentFullySelected(facetName) {
    const result = facets.some((parent) => {
      if (!parent.children || parent?.children?.length === 0) return false;
      return parent.children.every((child) => child.name === facetName || store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).some((f) => f.name === child.name));
    });
    return result;
  }
  function getFacetsToDisplay() {
    let facetsToDisplay2 = [...filteredHiddenFacets];
    const selectedFacetsMap = new Map(store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).map((facet) => [facet.name, facet]));
    const indeterminateFacets = facetsToDisplay2.filter(isIndeterminate);
    const indeterminateMap = new Map(indeterminateFacets.map((facet) => [facet.name, facet]));
    const isChildOfIndeterminate = (facetName) => {
      return indeterminateFacets.some((parent) => parent.children?.some((child) => child.name === facetName));
    };
    facetsToDisplay2 = facetsToDisplay2.filter((f) => !selectedFacetsMap.has(f.name) && !isChildOfIndeterminate(f.name) && !indeterminateMap.has(f.name) && !isParentFullySelected(f.name));
    const selectedFacetsForCategory = store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).filter((facet) => facet.category === facetCategory.name && !isChildOfIndeterminate(facet.name) && !isParentFullySelected(facet.name));
    selectedFacetsForCategory.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });
    const parentsWithAllChildrenSelected = facets.filter((f) => f.children?.length && f.children.every((child) => store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).some((f2) => f2.name === child.name)));
    parentsWithAllChildrenSelected.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });
    const indeterminateFacetsForCategory = indeterminateFacets.filter((facet) => facet.category === facetCategory.name);
    indeterminateFacetsForCategory.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });
    facetsToDisplay2.unshift(...selectedFacetsForCategory, ...parentsWithAllChildrenSelected, ...indeterminateFacetsForCategory);
    {
      facetsToDisplay2 = facetsToDisplay2.slice(0, numFacetsToShow);
    }
    return facetsToDisplay2;
  }
  $$payload.out.push(`<!---->`);
  {
    let control = function($$payload2) {
      $$payload2.out.push(`<!---->${escape_html(facetCategory.display)}`);
    }, panel = function($$payload2) {
      const each_array = ensure_array_like(facetsToDisplay);
      $$payload2.out.push(`<div class="flex flex-col">`);
      if (overShowLimit) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<input class="text-sm" type="search"${attr("placeholder", "Filter " + facetCategory.display)} name="facet-fitler"${attr("id", facetCategory.name + "-filter")}${attr("value", textFilterValue)}/>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> <!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let facet = each_array[$$index];
        FacetItem_1($$payload2, { facet });
      }
      $$payload2.out.push(`<!--]--> `);
      if (overShowLimit && !textFilterValue) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<button data-testId="show-more-facets" class="show-more w-fit mx-auto my-1 svelte-gs9i6d">${escape_html("Show More")} <i${attr_class(`ml-1 fa-solid fa-angle-${stringify("down")}`)}></i></button>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div>`);
    };
    Accordion.Item($$payload, {
      value: facetCategory.name,
      headingLevel: 6,
      controlRounded: "rounded-t-xl aria-expanded:rounded-b-none rounded-b-xl",
      controlClasses: "h6 bg-primary-100-900 hover:bg-secondary-200-800",
      panelClasses: "bg-surface-100",
      panelRounded: "rounded-b-xl",
      control,
      panel,
      $$slots: { control: true, panel: true }
    });
  }
  $$payload.out.push(`<!----> `);
  if (!store_get($$store_subs ??= {}, "$openFacets", openFacets).includes(facetCategory.name)) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(selectedFacetsChips);
    $$payload.out.push(`<div class="mb-2 flex flex-wrap gap-2"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let facet = each_array_1[$$index_1];
      $$payload.out.push(`<span class="badge z-10 preset-outlined-surface-500 py-2 overflow-hidden"${attr("id", facet.name)}><span class="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">${escape_html(facet.display)}</span> <button class="chip-close ml-1 shrink-0" aria-label="Remove Facet"><i class="fa-solid fa-times hover:text-secondary-500"></i></button></span>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FacetPlaceholder($$payload, $$props) {
  let {
    className = "",
    numFacets = 3,
    showSearchAndButton = numFacets > 5,
    fadeEffect = false
  } = $$props;
  const visualVarietyWidths = ["w-32", "w-28", "w-36", "w-24", "w-40", "w-30"];
  const each_array = ensure_array_like(Array(showSearchAndButton ? Math.min(numFacets, 5) : numFacets));
  $$payload.out.push(`<div data-testid="facet-placeholder"${attr_class(`space-y-0 rounded-xl ${stringify(className)}`)}><div data-testid="facet-placeholder-header" class="flex items-center justify-between h6 bg-surface-100-900 p-4 rounded-t-xl border-b border-surface-200-800"><div class="placeholder h-5 w-32 animate-pulse rounded"></div> <div class="placeholder w-4 h-4 animate-pulse rounded"></div></div> <div data-testid="facet-placeholder-content"${attr_class(`p-4 rounded-b-xl ${stringify(fadeEffect ? "bg-gradient-to-b from-surface-100 via-surface-100/30 to-transparent" : "bg-surface-100")}`)}>`);
  if (showSearchAndButton) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div data-testid="facet-placeholder-search-button" class="placeholder h-8 w-full animate-pulse rounded-full mb-3"></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="space-y-3 mt-1"><!--[-->`);
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    each_array[i];
    const opacity = fadeEffect ? Math.max(0, 1 - i / (numFacets - 1) * 0.8) : 1;
    $$payload.out.push(`<div${attr("data-testid", `facet-placeholder-item-${stringify(i)}`)} class="flex items-center space-x-3"${attr_style(`opacity: ${stringify(opacity)}`)}><div class="placeholder size-4 animate-pulse rounded-sm"></div> <div${attr_class(`placeholder h-4 ${stringify(visualVarietyWidths[i % visualVarietyWidths.length])} animate-pulse rounded`)}></div></div>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  if (showSearchAndButton) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div data-testid="facet-placeholder-show-more-button" class="flex justify-center mt-3"${attr_style(`opacity: ${stringify(fadeEffect ? 0.1 : 1)}`)}><div class="placeholder h-8 w-24 animate-pulse rounded-full"></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
}
function FacetSidebarPlaceholder($$payload, $$props) {
  push();
  let {
    fadeEffect = false,
    numCategories = 2,
    previousCategories = []
  } = $$props;
  const smartMode = previousCategories?.length > 0;
  const numberOfCategories = smartMode ? previousCategories?.length || 1 : numCategories;
  const fadeLastCategory = smartMode ? false : fadeEffect;
  const numFacets = 1 + numberOfCategories;
  $$payload.out.push(`<div class="flex flex-col gap-4">`);
  if (smartMode) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(previousCategories);
    $$payload.out.push(`<!--[-->`);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let category = each_array[i];
      FacetPlaceholder($$payload, {
        numFacets: category?.numFacets || 5,
        fadeEffect: fadeLastCategory && i === previousCategories.length - 1
      });
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array_1 = ensure_array_like(Array(numberOfCategories));
    $$payload.out.push(`<!--[-->`);
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      each_array_1[i];
      FacetPlaceholder($$payload, {
        numFacets: numFacets - i > 1 ? numFacets - i : 2,
        fadeEffect: fadeLastCategory && i === numberOfCategories - 1
      });
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function FacetSideBar($$payload, $$props) {
  push();
  var $$store_subs;
  let previousCategories = [];
  function recreateFacetCategories() {
    let facetsToShow = [];
    store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).forEach((facet) => {
      let facetCategory = facetsToShow.find((category) => category.display === facet.category);
      if (facetCategory) {
        facetCategory.facets.push(facet);
      } else {
        facetsToShow.push({
          display: facet?.categoryRef?.display || facet.category,
          facets: [facet],
          description: facet?.categoryRef?.description || "",
          name: facet.category
        });
      }
    });
    return facetsToShow;
  }
  await_block(
    $$payload,
    store_get($$store_subs ??= {}, "$facetsPromise", facetsPromise),
    () => {
      FacetSidebarPlaceholder($$payload, {
        numCategories: 2,
        fadeEffect: true,
        previousCategories: previousCategories.length > 0 ? previousCategories : []
      });
    },
    (newFacets) => {
      if (newFacets?.length > 0) {
        $$payload.out.push("<!--[-->");
        {
          let iconOpen = function($$payload2) {
            $$payload2.out.push(`<i class="fa-solid fa-angle-up"></i>`);
          }, iconClosed = function($$payload2) {
            $$payload2.out.push(`<i class="fa-solid fa-angle-down"></i>`);
          };
          Accordion($$payload, {
            multiple: true,
            value: store_get($$store_subs ??= {}, "$openFacets", openFacets),
            onValueChange: (e) => store_set(openFacets, e.value),
            iconOpen,
            iconClosed,
            children: ($$payload2) => {
              const each_array = ensure_array_like(newFacets);
              $$payload2.out.push(`<!--[-->`);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let facetCategory = each_array[$$index];
                FacetCategory($$payload2, { facetCategory });
              }
              $$payload2.out.push(`<!--]-->`);
            },
            $$slots: { iconOpen: true, iconClosed: true, default: true }
          });
        }
      } else {
        $$payload.out.push("<!--[!-->");
        {
          let iconOpen = function($$payload2) {
            $$payload2.out.push(`<i class="fa-solid fa-angle-up"></i>`);
          }, iconClosed = function($$payload2) {
            $$payload2.out.push(`<i class="fa-solid fa-angle-down"></i>`);
          };
          Accordion($$payload, {
            multiple: true,
            value: store_get($$store_subs ??= {}, "$openFacets", openFacets),
            onValueChange: (e) => store_set(openFacets, e.value),
            iconOpen,
            iconClosed,
            children: ($$payload2) => {
              const each_array_1 = ensure_array_like(recreateFacetCategories());
              $$payload2.out.push(`<!--[-->`);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let facetCategory = each_array_1[$$index_1];
                FacetCategory($$payload2, { facetCategory });
              }
              $$payload2.out.push(`<!--]-->`);
            },
            $$slots: { iconOpen: true, iconClosed: true, default: true }
          });
        }
      }
      $$payload.out.push(`<!--]-->`);
    }
  );
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ExplorerTour($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    tourConfig
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } = $$props;
  let started = false;
  let openModal = false;
  const disablePrevious = () => {
  };
  const clickElement = (element2) => {
    element2?.click();
  };
  const clickElementThenNext = (element2) => {
    element2?.click();
    tourDriver.moveNext();
  };
  const addHighlightClass = (on) => {
    return (element2) => {
      if (on) {
        element2.classList.add("highlight");
      } else {
        element2.classList.remove("highlight");
      }
    };
  };
  function resetSearch() {
    searchTerm.set("");
    clearFilters();
    clearExports();
  }
  const applyNumericFilter = (activeRowSelector) => {
    const filter = document.querySelector(`#${activeRowSelector} [data-testid="add-filter"]`);
    filter.click();
    tourDriver.moveNext();
  };
  const clickFilterOption = (activeRowSelector) => {
    const allOptions = document.querySelector(`#${activeRowSelector} #select-all`);
    allOptions?.click();
    setTimeout(
      () => {
        const addFilter = document.querySelector(`#${activeRowSelector} [data-testid="add-filter"]`);
        addFilter?.click();
        tourDriver.moveNext();
      },
      200
    );
  };
  function openDrawer() {
    const sidePanel = document.querySelector("#results-panel-toggle");
    sidePanel.click();
  }
  const applyFilterThenNext = (element2) => {
    const activeRowId = element2?.id;
    const filterType = document.querySelector(`#${activeRowId} [data-testid="numerical-filter"]`) ? "numerical" : "categorical";
    if (filterType === "numerical") {
      applyNumericFilter(activeRowId);
    } else {
      clickFilterOption(activeRowId);
    }
  };
  function replacePlaceholders(text, searchTerm2) {
    return text.replace(/\{\{searchTerm\}\}/g, searchTerm2);
  }
  const findAndSetFirstNonStigmatizedAvailableFilterThenNext = () => {
    const table = document.querySelector("#ExplorerTable-table");
    const rows = table.querySelectorAll("tr");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let filter = row.querySelector('button[title="Filter"]');
      if (filter) {
        row.classList.add("non-stigmatized-row");
        break;
      }
    }
    tourDriver.moveNext();
  };
  const functionMap = {
    disablePrevious,
    clickElement,
    clickElementThenNext,
    addHighlightClass: addHighlightClass(true),
    removeHighlightClass: addHighlightClass(false),
    resetSearch,
    applyFilterThenNext,
    findAndSetFirstNonStigmatizedAvailableFilterThenNext
  };
  function mapConfigurationToSteps(steps2) {
    return steps2.map((step) => {
      const { popover, ...rest } = step;
      const serializedStep = {
        ...rest,
        popover: {
          ...popover,
          title: replacePlaceholders(popover.title, tourConfig?.searchTerm),
          description: replacePlaceholders(popover.description, tourConfig?.searchTerm)
        }
      };
      if (popover.onPrevClick) {
        serializedStep.popover.onPrevClick = functionMap[popover.onPrevClick];
      }
      if (popover.onNextClick) {
        serializedStep.popover.onNextClick = functionMap[popover.onNextClick];
      }
      if (step.onHighlightStarted) {
        serializedStep.onHighlightStarted = functionMap[step.onHighlightStarted];
      }
      if (step.removeHighlightClass) {
        serializedStep.removeHighlightClass = functionMap[step.removeHighlightClass];
      }
      return serializedStep;
    });
  }
  const steps = mapConfigurationToSteps(tourConfig.steps);
  const tourDriver = driver({
    showProgress: true,
    popoverClass: "picsure-theme",
    overlayColor: "var(--color-surface-400)",
    // Although we're not using the previous button, this would be it's custom text
    // prevBtnText: '<i class="fa-solid fa-arrow-left mr-1"></i> Previous',
    nextBtnText: 'Next <i class="fa-solid fa-arrow-right ml-1"></i>',
    // Even if previous button is disabled, navigating with the left arrow key still seems to trigger,
    // so we'll disable it in each step.
    showButtons: ["next", "close"],
    disableButtons: ["previous"],
    steps,
    onDestroyed: () => {
      resetSearch();
      selectedFacets.set([]);
      const sidePanel = document.querySelector("#side-panel");
      if (sidePanel.classList.contains("open-panel")) {
        document.querySelector("#results-panel-toggle")?.click();
      }
      const searchBox = document.querySelector("#explorer-search-box");
      searchBox.value = "";
      searchBox.focus();
    }
  });
  async function startTour() {
    started = true;
    openDrawer();
    resetSearch();
    const searchBox = document.querySelector("#explorer-search-box");
    searchBox.value = tourConfig.searchTerm;
    store_set(searchTerm, tourConfig.searchTerm);
    await store_get($$store_subs ??= {}, "$searchPromise", searchPromise).then(() => tourDriver.drive()).catch(() => console.error("API returned error during tour."));
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    Modal_1($$payload2, {
      title: tourConfig?.title,
      confirmText: "Start Tour",
      onconfirm: startTour,
      withDefault: false,
      width: "w-1/3",
      get open() {
        return openModal;
      },
      set open($$value) {
        openModal = $$value;
        $$settled = false;
      },
      children: ($$payload3) => {
        if (started) {
          $$payload3.out.push("<!--[-->");
          Loading($$payload3, { ring: true, size: "large" });
        } else {
          $$payload3.out.push("<!--[!-->");
          $$payload3.out.push(`<p>${html(sanitizeHTML(tourConfig?.description))}</p> <footer class="modal-footer flex justify-end space-x-2 mt-6"><button type="button" class="btn border preset-tonal-primary hover:preset-filled-primary-500">Cancel</button> <button type="button" class="btn preset-filled-primary-500">Start Tour</button></footer>`);
        }
        $$payload3.out.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> <button type="button" data-testid="explorer-tour-btn" id="tourBtn" class="btn preset-filled-secondary-500 text-black hover:text-white">Take a Tour</button>`);
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
function Explorer($$payload, $$props) {
  push();
  var $$store_subs;
  let { tourConfig } = $$props;
  let searchInput = page.url.searchParams.get("search") || store_get($$store_subs ??= {}, "$searchTerm", searchTerm) || "";
  const tableName = "ExplorerTable";
  const tableColumns = branding.explorePage.columns || [];
  const columns = [
    ...tableColumns,
    {
      dataElement: "id",
      label: "Actions",
      class: "w-36 text-center"
    }
  ];
  const cellOverides = { id: Actions };
  let isOpenAccess = page.url.pathname.includes("/discover");
  let path = isOpenAccess ? "/discover" : "/explorer";
  function update() {
    if (store_get($$store_subs ??= {}, "$error", error)) error.set("");
    searchTerm.set(searchInput);
    goto(searchInput ? `${path}?search=${searchInput}` : `${path}`, {});
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<section id="search-container" class="flex gap-9"><div id="facet-side-bar" class="flex-none flex-col items-center w-64">`);
    FacetSideBar($$payload2);
    $$payload2.out.push(`<!----></div> <div id="search-results-col" class="flex-auto"><div id="search-bar" class="flex gap-2 mb-6"><div class="flex-auto">`);
    Searchbox($$payload2, {
      search: update,
      get searchTerm() {
        return searchInput;
      },
      set searchTerm($$value) {
        searchInput = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----></div> <div class="flex-none">`);
    if (!isOpenAccess && (features.enableGENEQuery || features.enableSNPQuery)) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<a data-testid="genomic-filter-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500" href="/explorer/genome-filter">Genomic Filtering</a>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <button type="button" class="btn preset-tonal-error border border-error-500 hover:preset-filled-error-500" aria-label="You are on the reset button"${attr("disabled", !searchInput && store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).length === 0, true)}>Reset</button></div></div> `);
    if (store_get($$store_subs ??= {}, "$error", error)) {
      $$payload2.out.push("<!--[-->");
      ErrorAlert($$payload2, {
        title: "Sorry, we could not retrieve your search results.",
        color: "secondary",
        children: ($$payload3) => {
          $$payload3.out.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$error", error))}`);
        }
      });
    } else {
      $$payload2.out.push("<!--[!-->");
      if (store_get($$store_subs ??= {}, "$searchTerm", searchTerm) || store_get($$store_subs ??= {}, "$selectedFacets", selectedFacets).length > 0) {
        $$payload2.out.push("<!--[-->");
        RemoteTable($$payload2, {
          isClickable: true,
          tableName,
          handler: tableHandler,
          columns,
          cellOverides,
          isLoading: store_get($$store_subs ??= {}, "$isLoading", loading),
          expandable: true
        });
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]-->`);
    }
    $$payload2.out.push(`<!--]--> `);
    if (features.explorer.enableTour && store_get($$store_subs ??= {}, "$tour", tour)) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div id="explorer-tour" class="text-center mt-4">`);
      ExplorerTour($$payload2, { tourConfig });
      $$payload2.out.push(`<!----></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div></section>`);
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
const TourData = {
  "NHANES-Auth": {
    searchTerm: "Age",
    title: "Welcome to PIC-SURE",
    description: "PIC-SURE allows you to explore variables, apply filters, and prepare data for analysis. When applying filters, participants are selected that meet those criteria. <br /><br />This tour demonstrates how to search, apply filters, and interpret results using PIC-SURE. <br /><br />Once the tour starts, you can press the escape key to stop the tour at any point. You may also use the arrow keys, enter key, or the spacebar to navigate the tour.",
    steps: [
      {
        element: "#explorer-search-box",
        popover: {
          title: "Search",
          description: 'Search clinical variables of interest. Here, the term "{{searchTerm}}" was used to get all demographics-related results.',
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#facet-side-bar",
        popover: {
          title: "Refine Search",
          description: "Use the options displayed here to further refine your search results using facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table",
        popover: {
          title: "Search Results",
          description: "The search results are displayed in this area. Each row describes a different variable that matches your search term and/or facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table #row-0",
        onHighlightStarted: "clickElement",
        popover: {
          title: "Variable Details",
          description: "To learn more about a variable, click on the row or click the information icon.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table #active-row-0",
        popover: {
          title: "Variable Details",
          description: "This displays information about the variable, including dataset information and study information.",
          onPrevClick: "disablePrevious",
          onNextClick: "clickElementThenNext"
        }
      },
      {
        element: '#row-0 button[title="Filter"]',
        onHighlightStarted: "clickElement",
        popover: {
          title: "Apply Filters",
          description: "Click the filter icon to apply inclusion criteria to build your cohort.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table .expandable-row",
        popover: {
          title: "Apply Filters",
          description: "You can add filters by selecting different values or specifying a numeric range here, then clicking the “+” button.",
          onPrevClick: "disablePrevious",
          onNextClick: "applyFilterThenNext"
        }
      },
      {
        element: '#row-0 button[title="Data Hierarchy"]',
        onHighlightStarted: "clickElement",
        popover: {
          title: "Variable Hierarchy",
          description: "Click the Variable Hierarchy icon to filter at different levels of the variable path.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table .expandable-row",
        popover: {
          title: "Variable Hierarchy",
          description: "You can filter on different levels of the variable hierarchy by clicking a level here, then clicking the “+” button.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: '#row-0 button[title="Add for Analysis"]',
        popover: {
          title: "Export Variable",
          description: "Click the export icon to add a variable to your export without applying a filter.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#sidebar-right",
        popover: {
          title: "Cohort Summary",
          description: "You can view the summary of the filtered cohort based on the applied variable filters. Additionally, you can also view variable distributions and prepare your cohort for analysis.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#nav-link-help",
        popover: {
          title: "Help Resources",
          description: "To learn more about PIC-SURE, please consult the <a href='https://pic-sure.gitbook.io/pic-sure' class='anchor' target='_blank'>user guide</a> and <a href='https://www.youtube.com/@pic-sure446/featured' class='anchor' target='_blank'>video</a> demonstrations. You can also find these resources on the help page.",
          onPrevClick: "disablePrevious"
        }
      }
    ]
  },
  "BDC-Open": {
    searchTerm: "RECOVER",
    title: "Welcome to BioData Catalyst Powered by PIC-SURE",
    description: "BioData Catalyst Powered by PIC-SURE allows you to explore variables, apply filters, and prepare data for analysis. When applying filters, participants are selected that meet those criteria. <br /><br />This tour demonstrates how to search, apply filters, and interpret results using PIC-SURE. This tour uses the Researching COVID to Enhance Recovery (RECOVER) dataset as an example. The RECOVER initiative is focused on understanding, diagnosing, treating, and preventing Long COVID. <br /><br />Once the tour starts, you can click “Next” or use the arrow keys to navigate the tour. You can press any other key or click anywhere on the screen to escape the tour.",
    steps: [
      {
        element: "#explorer-search-box",
        popover: {
          title: "Search",
          description: 'Search clinical variables of interest. Here, the term "{{searchTerm}}" was used to get all {{searchTerm}}-related results.',
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#facet-side-bar",
        popover: {
          title: "Refine Search",
          description: "Use the options displayed here to further refine your search results using facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table",
        popover: {
          title: "Search Results",
          description: "The search results are displayed in this area. Each row describes a different variable that matches your search term and/or facets.",
          onPrevClick: "disablePrevious",
          onNextClick: "findAndSetFirstNonStigmatizedAvailableFilterThenNext"
        }
      },
      {
        element: "#ExplorerTable-table .non-stigmatized-row",
        onHighlightStarted: "clickElement",
        popover: {
          title: "Variable Details",
          description: "To learn more about a variable, click on the row or click the information icon.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table .expandable-row",
        popover: {
          title: "Variable Details",
          description: "This displays information about the variable, including dataset information and study information.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: '#ExplorerTable-table .non-stigmatized-row button[title="Filter"]',
        onHighlightStarted: "clickElement",
        popover: {
          title: "Apply Filters",
          description: "Click the filter icon to apply inclusion criteria to build your cohort.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table .expandable-row",
        popover: {
          title: "Apply Filters",
          description: "You can add filters by selecting different values or specifying a numeric range here, then clicking the “+” button.",
          onPrevClick: "disablePrevious",
          onNextClick: "applyFilterThenNext"
        }
      },
      {
        element: "#sidebar-right",
        popover: {
          title: "Cohort Summary",
          description: "You can view the summary of the filtered cohort based on the applied variable filters. Additionally, you can also view variable distributions and counts per study. Note that this count is obfuscated to protect participant-level data.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#nav-link-help",
        popover: {
          title: "Help Resources",
          description: "To learn more about PIC-SURE, please consult the <a href='https://pic-sure.gitbook.io/nhlbi-biodata-catalyst-powered-by-pic-sure' class='anchor' target='_blank'>user guide</a> and <a href='https://www.youtube.com/playlist?list=PLJ6YccH8TEufZ5L-ctxzFF7vuZRLVacKw' class='anchor' target='_blank'>video</a> demonstrations. You can also find these resources on the help page.",
          onPrevClick: "disablePrevious"
        }
      }
    ]
  },
  "BDC-Auth": {
    searchTerm: "cardiac surgery",
    title: "Welcome to BioData Catalyst Powered by PIC-SURE",
    description: "BioData Catalyst Powered by PIC-SURE allows you to explore variables, apply filters, and prepare data for analysis. When applying filters, participants are selected that meet those criteria. <br /><br />This tour demonstrates how to search, apply filters, and interpret results using PIC-SURE. <br /><br />Once the tour starts, you can click “Next” or use the arrow keys to navigate the tour. You can press any other key or click anywhere on the screen to escape the tour.",
    steps: [
      {
        element: "#explorer-search-box",
        popover: {
          title: "Search",
          description: 'Search clinical variables of interest. Here, the term "{{searchTerm}}" was used to get all results related to {{searchTerm}}.',
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#facet-side-bar",
        popover: {
          title: "Refine Search",
          description: "Use the options displayed here to further refine your search results using facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table",
        popover: {
          title: "Search Results",
          description: "The search results are displayed in this area. Each row describes a different variable that matches your search term and/or facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table #row-0",
        onHighlightStarted: "clickElement",
        popover: {
          title: "Variable Details",
          description: "To learn more about a variable, click on the row or click the information icon.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table #active-row-0",
        popover: {
          title: "Variable Details",
          description: "This displays information about the variable, including dataset information and study information.",
          onPrevClick: "disablePrevious",
          onNextClick: "clickElementThenNext"
        }
      },
      {
        element: '#row-0 button[title="Filter"]',
        onHighlightStarted: "clickElement",
        popover: {
          title: "Apply Filters",
          description: "Click the filter icon to apply inclusion criteria to build your cohort.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#active-row-0",
        popover: {
          title: "Apply Filters",
          description: "You can add filters by selecting different values or specifying a numeric range here, then clicking the “+” button.",
          onPrevClick: "disablePrevious",
          onNextClick: "applyFilterThenNext"
        }
      },
      {
        element: '#row-0 button[title="Add for Analysis"]',
        popover: {
          title: "Export Variable",
          description: "Click the export icon to add a variable to your export without applying a filter.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#sidebar-right",
        popover: {
          title: "Cohort Summary",
          description: "You can view the summary of the filtered cohort based on the applied variable filters. Additionally, you can also view variable distributions and prepare your cohort for analysis.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#nav-link-help",
        popover: {
          title: "Help Resources",
          description: "To learn more about PIC-SURE, please consult the <a href='https://pic-sure.gitbook.io/nhlbi-biodata-catalyst-powered-by-pic-sure' class='anchor' target='_blank'>user guide</a> and <a href='https://www.youtube.com/playlist?list=PLJ6YccH8TEufZ5L-ctxzFF7vuZRLVacKw' class='anchor' target='_blank'>video</a> demonstrations. You can also find these resources on the help page.",
          onPrevClick: "disablePrevious"
        }
      }
    ]
  },
  "GIC-Common": {
    searchTerm: "cancer",
    title: "Welcome to GIC",
    description: 'The Genomic Information Commons (GIC) Cohort Builder allows you to explore clinical, genomic, and biosample data from broadly consented cohorts across multiple sites of care. You can search variables, apply filters, and prepare to request access to patient-level data. When applying filters, patients are selected who meet those criteria. <br /><br />This tour demonstrates how to search, apply filters, and interpret results. Once the tour starts, you can click "Next" or use the arrow keys to navigate the tour. You can press any other key or click anywhere on the screen to escape the tour.',
    steps: [
      {
        element: "#explorer-search-box",
        popover: {
          title: "Search",
          description: 'Search clinical variables of interest. Here, the term "cancer" was used.',
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#facet-side-bar",
        popover: {
          title: "Refine Search",
          description: "Use the options displayed here to further refine your search results using facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table",
        popover: {
          title: "Search Results",
          description: "The search results are displayed in this area. Each row describes a different variable that matches your search term and/or facets.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table #row-0",
        onHighlightStarted: "clickElement",
        popover: {
          title: "Variable Details",
          description: "To learn more about a variable, click on the row or click the information icon.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table #active-row-0",
        popover: {
          title: "Variable Details",
          description: "This displays information about the variable, including dataset information and study information.",
          onPrevClick: "disablePrevious",
          onNextClick: "clickElementThenNext"
        }
      },
      {
        element: '#row-0 button[title="Filter"]',
        onHighlightStarted: "clickElement",
        popover: {
          title: "Apply Filters",
          description: "Click the filter icon to apply inclusion criteria to build your cohort.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table .expandable-row",
        popover: {
          title: "Apply Filters",
          description: 'You can add filters by selecting different values or specifying a numeric range here, then clicking the "+" button.',
          onPrevClick: "disablePrevious",
          onNextClick: "applyFilterThenNext"
        }
      },
      {
        element: '#row-0 button[title="Data Hierarchy"]',
        onHighlightStarted: "clickElement",
        popover: {
          title: "Variable Hierarchy",
          description: "Click the Variable Hierarchy icon to filter at different levels of the variable path.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#ExplorerTable-table .expandable-row",
        popover: {
          title: "Variable Hierarchy",
          description: 'You can filter on different levels of the variable hierarchy by clicking a level here, then clicking the "+" button.',
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: '#row-0 button[title="Add for Analysis"]',
        popover: {
          title: "Export Variable",
          description: "Click the export icon to add a variable to your export without applying a filter.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#sidebar-right",
        popover: {
          title: "Cohort Summary",
          description: "You can view the summary of the filtered cohort based on the applied variable filters. Additionally, you can also view the patient counts per site with varying biosample and genomic data types using the Cohort Details tool.",
          onPrevClick: "disablePrevious"
        }
      },
      {
        element: "#nav-link-help",
        popover: {
          title: "Help Resources",
          description: "To learn more about PIC-SURE, please consult the <a href='https://pic-sure.gitbook.io/genomic-information-commons' class='anchor' target='_blank'>user guide</a> and <a href='https://www.youtube.com/playlist?list=PLJ6YccH8TEudynChXcDUKveAvqyK-N3SN' class='anchor' target='_blank'>video</a> demonstrations. You can also find these resources on the help page.",
          onPrevClick: "disablePrevious"
        }
      }
    ]
  }
};

export { Explorer as E, TourData as T };
//# sourceMappingURL=TourConfiguration-BUkqab4p.js.map
