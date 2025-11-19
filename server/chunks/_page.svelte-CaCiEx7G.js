import { x as push, U as store_get, X as unsubscribe_stores, z as pop, a4 as store_mutate, y as setContext, N as attr_class, S as ensure_array_like, O as attr, M as escape_html, Q as stringify, K as getContext, Y as await_block, V as copy_payload, W as assign_payload, P as clsx, a7 as derived } from './index-DMPVr6nO.js';
import { g as goto } from './client2-DxcZr6Tp.js';
import { a3 as post, a4 as Picsure, t as toaster, av as browser } from './User-01eW3TFo.js';
import { f as features, s as settings, b as branding } from './configuration-CBIXsjx2.js';
import { E as ExportStore, e as exports } from './Export-B3PQrADV.js';
import { Q as QueryV2, c as filters } from './Filter-Bhec34ty.js';
import { t as totalParticipants } from './ResultStore-bQgsQzg8.js';
import { f as federatedQueryMap } from './Dataset--vvV5NR5.js';
import { w as writable, l as get } from './utils-B7NzVBxP.js';
import { o as onDestroy, L as Loading } from './Loading-DAyWVuL0.js';
import { C as Content, A as AngleButton } from './Content-DMJk6TmZ.js';
import { U as UserToken } from './UserToken-rZOsbhyB.js';
import { k as getInitialTree, m as getConceptTree } from './Dictionary-GEGKzEEq.js';
import '@sveltejs/kit';
import './index2-Bp7szfwE.js';
import { E as ErrorAlert } from './ErrorAlert-BrAljl0x.js';
import { S as StaticTable } from './StaticTable-BZzBQVFt.js';
import { C as CardButton } from './CardButton-Dfic0Ypg.js';
import { T as Tabs } from './index3-BTFwLm73.js';
import { C as CodeBlock, T as TabItem } from './TabItem-DxysY_aO.js';
import { M as Modal_1 } from './Modal-dMSGxUC4.js';
import { C as CopyButton } from './CopyButton-C8qhQbgh.js';
import { b as getQueryRequestV2 } from './StatBuilder-BQA2qLEl.js';
import '@sveltejs/kit/internal';
import 'uuid';
import './Forms-DH01zSCL.js';
import './RemoteTable-Dun11TjL.js';
import './AddFilter-CZ17On64.js';
import './OptionsSelectionList-C9pb9mmD.js';
import './create-context-CgHykjw-.js';
import './html2-FW6Ia4bL.js';
import 'shiki/core';
import 'shiki/engine/javascript';
import 'shiki/themes/dark-plus.mjs';
import 'shiki/langs/console.mjs';
import 'shiki/langs/python.mjs';
import 'shiki/langs/r.mjs';
import './Popover-7q3Ft3Q-.js';
import '@floating-ui/dom';
import './HTML-1Mhr8hI4.js';
import 'dompurify';

async function createDatasetName(queryId, name, siteQueryIds) {
  if (name === "" && name.trim() === "") {
    throw "Please input a Dataset ID name";
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw `Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : ' "`;
  }
  const request = {
    queryId,
    name
  };
  if (siteQueryIds) {
    request.metadata = { saved: (/* @__PURE__ */ new Date()).valueOf(), siteQueryIds };
  }
  return await post(Picsure.NamedDataSet, request);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function getBackoffDelay(attempt, baseDelay = 1e3, maxDelay = 3e4, jitter = true) {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  if (jitter) {
    const jitterAmount = exponentialDelay * 0.25;
    return exponentialDelay + (Math.random() * 2 - 1) * jitterAmount;
  }
  return exponentialDelay;
}
async function withBackoff(fn, maxAttempts = 3, baseDelay = 1e3, maxDelay = 3e4, shouldRetry) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn("Backoff caught: ", error);
      lastError = error;
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }
      if (attempt < maxAttempts - 1) {
        const delay = getBackoffDelay(attempt, baseDelay, maxDelay);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
const stepperState = writable({ current: 0, total: 0, stepMap: [] });
function Stepper($$payload, $$props) {
  push();
  var $$store_subs;
  const defaultStep = () => {
  };
  const {
    buttonCompleteLabel = "",
    class: className = "",
    onnext = defaultStep,
    onback = defaultStep,
    oncomplete = defaultStep,
    children
  } = $$props;
  async function _onNext(locked) {
    await new Promise((resolve) => setTimeout(resolve));
    if (locked) return;
    const step = store_get($$store_subs ??= {}, "$stepperState", stepperState).current + 1;
    const name = store_get($$store_subs ??= {}, "$stepperState", stepperState).stepMap[step];
    onnext(step, name, store_get($$store_subs ??= {}, "$stepperState", stepperState));
    store_mutate($$store_subs ??= {}, "$stepperState", stepperState, store_get($$store_subs ??= {}, "$stepperState", stepperState).current = step);
  }
  function _onBack() {
    const step = store_get($$store_subs ??= {}, "$stepperState", stepperState).current === 0 ? 0 : store_get($$store_subs ??= {}, "$stepperState", stepperState).current - 1;
    const name = store_get($$store_subs ??= {}, "$stepperState", stepperState).stepMap[step];
    onback(step, name, store_get($$store_subs ??= {}, "$stepperState", stepperState));
    store_mutate($$store_subs ??= {}, "$stepperState", stepperState, store_get($$store_subs ??= {}, "$stepperState", stepperState).current = step);
  }
  function _onComplete(stepIndex, locked) {
    if (locked) return;
    oncomplete(stepIndex, store_get($$store_subs ??= {}, "$stepperState", stepperState).stepMap[stepIndex], store_get($$store_subs ??= {}, "$stepperState", stepperState));
  }
  function isActive(step) {
    return step === store_get($$store_subs ??= {}, "$stepperState", stepperState).current;
  }
  setContext("buttonCompleteLabel", buttonCompleteLabel);
  setContext("StepperState", stepperState);
  setContext("onBack", _onBack);
  setContext("onNext", _onNext);
  setContext("onComplete", _onComplete);
  $$payload.out.push(`<div${attr_class(`stepper space-y-4 ${stringify(className)}`)} data-testid="stepper">`);
  if (store_get($$store_subs ??= {}, "$stepperState", stepperState).total) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Array.from(Array(store_get($$store_subs ??= {}, "$stepperState", stepperState).total).keys()));
    $$payload.out.push(`<header class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-500 gap-4"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let step = each_array[$$index];
      $$payload.out.push(`<div${attr_class("stepper-header-step -mt-[15px] transition-all duration-300", void 0, { "flex-1": isActive(step) })}><span${attr("data-testid", `step-${stringify(store_get($$store_subs ??= {}, "$stepperState", stepperState).stepMap[step])}`)}${attr_class(`badge rounded-2xl text-sm ${stringify(isActive(step) ? "preset-filled-primary-500" : "preset-filled-surface-500")}`)}>${escape_html(isActive(step) ? `Step ${step + 1}` : step + 1)}</span></div>`);
    }
    $$payload.out.push(`<!--]--></header>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="stepper-content">`);
  children?.($$payload);
  $$payload.out.push(`<!----></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Step($$payload, $$props) {
  push();
  var $$store_subs;
  const { name, locked = false, header, children, navigation } = $$props;
  const buttonCompleteLabel = getContext("buttonCompleteLabel");
  const stepperState2 = getContext("StepperState");
  const onNext = getContext("onNext");
  const onBack = getContext("onBack");
  const onComplete = getContext("onComplete");
  const stepIndex = store_get($$store_subs ??= {}, "$stepperState", stepperState2).total;
  store_mutate($$store_subs ??= {}, "$stepperState", stepperState2, store_get($$store_subs ??= {}, "$stepperState", stepperState2).stepMap = [
    ...store_get($$store_subs ??= {}, "$stepperState", stepperState2).stepMap,
    name
  ]);
  store_get($$store_subs ??= {}, "$stepperState", stepperState2).total++;
  onDestroy(() => {
    store_get($$store_subs ??= {}, "$stepperState", stepperState2).total--;
    store_mutate($$store_subs ??= {}, "$stepperState", stepperState2, store_get($$store_subs ??= {}, "$stepperState", stepperState2).stepMap = store_get($$store_subs ??= {}, "$stepperState", stepperState2).stepMap.filter((item) => item !== name));
  });
  if (stepIndex === store_get($$store_subs ??= {}, "$stepperState", stepperState2).current) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="step space-y-4"${attr("data-testid", `step-${stringify(stepIndex + 1)}`)}>`);
    if (header) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<header class="step-header text-2xl font-bold">`);
      header($$payload);
      $$payload.out.push(`<!----></header>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="step-content space-y-4 px-2">`);
    if (children) {
      $$payload.out.push("<!--[-->");
      children($$payload);
      $$payload.out.push(`<!---->`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`(Step ${escape_html(stepIndex + 1)} Content)`);
    }
    $$payload.out.push(`<!--]--></div> `);
    if (store_get($$store_subs ??= {}, "$stepperState", stepperState2).total > 1) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="step-navigation flex justify-between gap-4">`);
      if (navigation) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="step-navigation-slot">`);
        navigation($$payload);
        $$payload.out.push(`<!----></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (stepIndex !== 0) {
          $$payload.out.push("<!--[-->");
          AngleButton($$payload, {
            onclick: onBack,
            disabled: store_get($$store_subs ??= {}, "$stepperState", stepperState2).current === 0,
            children: ($$payload2) => {
              $$payload2.out.push(`<!---->Back`);
            }
          });
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<div></div>`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--> `);
      if (stepIndex < store_get($$store_subs ??= {}, "$stepperState", stepperState2).total - 1) {
        $$payload.out.push("<!--[-->");
        AngleButton($$payload, {
          name: "next",
          angle: "right",
          variant: "filled",
          color: "primary-500",
          disabled: locked,
          onclick: () => onNext(locked),
          children: ($$payload2) => {
            $$payload2.out.push(`<!---->Next`);
          }
        });
      } else {
        $$payload.out.push("<!--[!-->");
        AngleButton($$payload, {
          name: buttonCompleteLabel || "complete",
          angle: "right",
          variant: "filled",
          color: "primary-500",
          disabled: locked,
          onclick: () => onComplete(stepIndex, locked),
          children: ($$payload2) => {
            $$payload2.out.push(`<!---->${escape_html(buttonCompleteLabel || "Complete")}`);
          }
        });
      }
      $$payload.out.push(`<!--]--></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Summary($$payload, $$props) {
  push();
  var $$store_subs;
  let { exports: exports2 } = ExportStore;
  let participantsCount = store_get($$store_subs ??= {}, "$totalParticipants", totalParticipants);
  let anyRecordsOfCount = (() => {
    const anyRecordsOfFilters = store_get($$store_subs ??= {}, "$filters", filters).filter((filter) => filter.filterType === "AnyRecordOf");
    return anyRecordsOfFilters.reduce((acc, filter) => acc + filter.concepts.length, 0) - anyRecordsOfFilters.length;
  })();
  let variablesCount = store_get($$store_subs ??= {}, "$filters", filters).length + store_get($$store_subs ??= {}, "$exports", exports2).length + anyRecordsOfCount;
  let dataPoints = typeof participantsCount === "number" ? participantsCount * variablesCount : 0;
  let resultCountMap = {};
  function getStatusIcon(info) {
    const status = info?.status !== void 0 ? info?.status : info.count ? "COMPLETE" : "ERROR";
    switch (status) {
      case "AVAILABLE":
      case "COMPLETE":
        return "fa-solid fa-circle-check text-success-500";
      case "ERROR":
        return "fa-solid fa-circle-xmark text-error-500";
      case "PENDING":
        return "fa-solid fa-clock text-warning-500";
      default:
        return "fa-solid fa-circle text-surface-500";
    }
  }
  let siteMapsCombined = (() => {
    const combined = {};
    Object.entries(store_get($$store_subs ??= {}, "$federatedQueryMap", federatedQueryMap)).forEach(([siteName, info]) => {
      combined[siteName] = { ...info };
    });
    Object.entries(resultCountMap).forEach(([siteName, count]) => {
      if (combined[siteName]) {
        combined[siteName].count = count;
      } else {
        combined[siteName] = { count };
      }
    });
    return combined;
  })();
  let siteStatusIcons = siteMapsCombined ? Object.fromEntries(Object.entries(siteMapsCombined).map(([siteName, info]) => [siteName, getStatusIcon(info)])) : {};
  $$payload.out.push(`<div id="stats" class="w-full flex justify-evenly mb-5 pb-2 svelte-jecuqt"><div id="summary" class="w-full grid grid-flow-col auto-cols-auto"><div class="text-xl"><label for="summary" class="mr-8 font-bold">Summary:</label></div> <div class="flex justify-left text-xl font-light"><span id="participants" class="mr-2">${escape_html(participantsCount)}</span> <label for="participants">Participants</label></div> <div class="flex justify-left text-xl font-light"><span id="variables" class="mr-2">${escape_html(variablesCount)}</span> <label for="variables">Variables</label></div> <div class="flex justify-left text-xl font-light"><span id="dataPoints" class="mr-2">${escape_html(dataPoints)}</span> <label for="dataPoints">Data Points</label></div></div></div> `);
  if (features.federated && siteMapsCombined && Object.keys(siteMapsCombined).length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Object.entries(siteMapsCombined));
    $$payload.out.push(`<div id="site-indicators" class="grid grid-cols-3 gap-y-2 gap-x-6"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [siteName, info] = each_array[$$index];
      $$payload.out.push(`<div id="site-indicator">`);
      if (info?.status === "PENDING") {
        $$payload.out.push("<!--[-->");
        Loading($$payload, { size: "micro", label: `${siteName}` });
      } else {
        $$payload.out.push("<!--[!-->");
        if (info?.count) {
          $$payload.out.push("<!--[-->");
          await_block(
            $$payload,
            info?.count,
            () => {
              Loading($$payload, { size: "micro", label: `${siteName}` });
            },
            (count) => {
              $$payload.out.push(`<i${attr_class(clsx(siteStatusIcons[siteName]))}></i> <span id="site-indicator-label" class="uppercase">${escape_html(siteName)}</span> <span id="site-indicator-value" class="ml-1">(${escape_html(count)})</span>`);
            }
          );
          $$payload.out.push(`<!--]-->`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<i${attr_class(clsx(siteStatusIcons[siteName]))}></i> <span id="site-indicator-label" class="uppercase">${escape_html(siteName)}</span>`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ReviewStep($$payload, $$props) {
  push();
  let { rows, dataLimitExceeded } = $$props;
  const columns = [
    { dataElement: "name", label: "Variable Name", sort: true },
    {
      dataElement: "description",
      label: "Variable Description",
      sort: true
    },
    {
      dataElement: "type",
      label: "Type",
      sort: true,
      class: "text-center"
    }
  ];
  let activeRows = rows;
  let sampleIds = false;
  $$payload.out.push(`<div id="first-step-container" class="flex flex-col w-full h-full items-center">`);
  Summary($$payload);
  $$payload.out.push(`<!----> <section class="w-full">`);
  if (dataLimitExceeded) {
    $$payload.out.push("<!--[-->");
    ErrorAlert($$payload, {
      "data-testid": "landing-error",
      title: "Warning",
      color: "warning",
      closeText: "Back",
      onclose: () => goto(),
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Warning: Your selected data exceeds 1,000,000 estimated data points, which is too large to
        export. Please reduce the data selection or the number of selected participants.`);
      }
    });
  } else {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[-->");
      StaticTable($$payload, { tableName: "ExportSummary", data: activeRows, columns });
      $$payload.out.push(`<!----> `);
      if (features.explorer.enableSampleIdCheckbox) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div><label for="sample-ids-checkbox" class="flex items-center" data-testid="sample-ids-label">`);
        {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<input type="checkbox" class="mr-1 &amp;[aria-disabled=“true”]:opacity-75" data-testid="sample-ids-checkbox" id="sample-ids-checkbox"${attr("checked", sampleIds, true)}/>`);
        }
        $$payload.out.push(`<!--]--> <span>Include sample identifiers</span></label></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></section></div>`);
  pop();
}
const selectedConcepts = writable([]);
function addConcept(conceptPath) {
  selectedConcepts.update((prev) => prev.includes(conceptPath) ? prev : [...prev, conceptPath]);
}
function removeConcept(conceptPath) {
  selectedConcepts.update((prev) => prev.filter((concept) => concept !== conceptPath));
}
({
  subscribe: selectedConcepts.subscribe
});
function RemoteTreeNode_1($$payload, $$props) {
  push();
  const { node } = $$props;
  $$payload.out.push(`<details class="tree-item"${attr("data-testid", `tree-item:${stringify(node.name)}-${stringify(node.value)}`)}${attr("aria-disabled", node.disabled)}${attr("open", node.open, true)}><summary class="tree-item-summary list-none [&amp;::-webkit-details-marker]:hidden flex items-center cursor-pointer space-x-4 rounded-container p-0 hover:preset-tonal-primary w-full" role="treeitem"${attr("aria-selected", node.allSelected)}${attr("aria-expanded", node.open)}><button${attr("id", `tree-item-btn:${stringify(node.name)}-${stringify(node.value)}`)}${attr("data-testid", `tree-item-btn:${stringify(node.name)}-${stringify(node.value)}`)}${attr("title", !node.isLeaf ? `${node.open ? "Close" : "Open"} node` : void 0)}${attr("name", node.name)} type="button" class="m-1 ml-2"${attr("tabindex", node.isLeaf ? -1 : 0)}${attr("disabled", node.loading, true)}>`);
  if (!node.isLeaf) {
    $$payload.out.push("<!--[-->");
    if (node.loading) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-solid fa-spinner fa-spin"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<i${attr_class(`fa-solid fa-angle-${stringify(node.open ? "down" : "right")}`)}></i>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<i class="fa-solid fa-minus"></i>`);
  }
  $$payload.out.push(`<!--]--></button> <input${attr("id", `checkbox:${stringify(node.name)}-${stringify(node.value)}`)}${attr("data-testid", `checkbox:${stringify(node.name)}-${stringify(node.value)}`)} class="checkbox tree-item-checkbox mr-1" type="checkbox"${attr("name", node.name)}${attr("value", node.value)}${attr("checked", node.allSelected, true)}${attr("indeterminate", node.indeterminant, true)}/> <label${attr("for", `${stringify(node.isLeaf ? "checkbox:" : "tree-item-btn:")}${stringify(node.name)}-${stringify(node.value)}`)} class="w-full">${escape_html(node.value)}</label> `);
  if (node.error) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="text-error-500 text-sm ml-2"${attr("title", node.error)}><i class="fa-solid fa-exclamation-triangle"></i></span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></summary> <div class="tree-item-children ml-4"${attr("data-testid", `tree-item-children:${stringify(node.name)}`)} role="group">`);
  if (!node.isLeaf && node.open) {
    $$payload.out.push("<!--[-->");
    if (node.error) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-error-500 text-sm p-2">Error loading children: ${escape_html(node.error)}</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array = ensure_array_like(node.children);
      $$payload.out.push(`<!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let child = each_array[$$index];
        RemoteTreeNode_1($$payload, { node: child });
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></details>`);
  pop();
}
function RemoteTree($$payload, $$props) {
  push();
  let {
    initialNodes = [],
    fetchChildren,
    onselect = () => {
    },
    onunselect = () => {
    },
    fullWidth = false
  } = $$props;
  class RemoteTreeNodeClass {
    name = "";
    value = "";
    conceptPath = "";
    open = false;
    selected = false;
    disabled = false;
    children = [];
    loading = false;
    error = null;
    isLeaf = false;
    childrenLoaded = false;
    constructor(apiNode) {
      this.name = apiNode.name;
      this.value = apiNode.name;
      this.conceptPath = apiNode.conceptPath;
      this.isLeaf = false;
      this.children = apiNode?.children?.map((child) => new RemoteTreeNodeClass(child)) ?? [];
      if (this.isLeaf) {
        this.childrenLoaded = true;
      }
    }
    #someSelected = derived(() => {
      if (this.isLeaf) return this.selected;
      return this.children.some((child) => child.someSelected || child.selected);
    });
    get someSelected() {
      return this.#someSelected();
    }
    set someSelected($$value) {
      return this.#someSelected($$value);
    }
    #allSelected = derived(() => {
      if (this.isLeaf) return this.selected;
      if (this.children.length === 0) return this.selected;
      return this.children.every((child) => child.allSelected);
    });
    get allSelected() {
      return this.#allSelected();
    }
    set allSelected($$value) {
      return this.#allSelected($$value);
    }
    #noneSelected = derived(() => {
      if (this.isLeaf) return !this.selected;
      return !this.someSelected;
    });
    get noneSelected() {
      return this.#noneSelected();
    }
    set noneSelected($$value) {
      return this.#noneSelected($$value);
    }
    #indeterminant = derived(() => {
      if (this.isLeaf) return false;
      if (this.children.length === 0) return false;
      return this.someSelected && !this.allSelected;
    });
    get indeterminant() {
      return this.#indeterminant();
    }
    set indeterminant($$value) {
      return this.#indeterminant($$value);
    }
    async select() {
      if (!this.isLeaf) {
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        if (this.children.length > 0) {
          await Promise.all(this.children.map((child) => child.select()));
        } else {
          onselect(this.conceptPath);
          this.selected = true;
        }
      } else {
        onselect(this.conceptPath);
        this.selected = true;
      }
    }
    async unselect() {
      if (!this.isLeaf) {
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        await Promise.all(this.children.map((child) => child.unselect()));
      } else {
        this.selected = false;
        onunselect(this.conceptPath);
      }
    }
    async toggleSelected() {
      if (this.allSelected) {
        await this.unselect();
      } else {
        await this.select();
      }
    }
    async toggleOpen() {
      if (this.isLeaf) return;
      if (!this.open) {
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        this.open = true;
      } else {
        this.open = false;
      }
    }
    async loadChildren() {
      if (this.loading || this.childrenLoaded || this.isLeaf) return;
      this.loading = true;
      this.error = null;
      try {
        const childrenData = await fetchChildren(this.conceptPath);
        this.children = childrenData.map((child) => new RemoteTreeNodeClass(child));
        this.childrenLoaded = true;
        this.isLeaf = this.children.length === 0;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Failed to load children";
        console.error("Error loading children for", this.conceptPath, err);
      } finally {
        this.loading = false;
      }
    }
  }
  let treeNodes = initialNodes?.map((node) => new RemoteTreeNodeClass(node)) ?? void 0;
  const each_array = ensure_array_like(treeNodes);
  $$payload.out.push(`<div${attr_class(`overflow-auto ${stringify(fullWidth ? "w-full" : "")}`)}><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let treeNode = each_array[$$index];
    RemoteTreeNode_1($$payload, { node: treeNode });
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function TreeStep($$payload, $$props) {
  push();
  var $$store_subs;
  let largestDepth = store_get($$store_subs ??= {}, "$selectedConcepts", selectedConcepts) && store_get($$store_subs ??= {}, "$selectedConcepts", selectedConcepts).length > 0 ? Math.max(...store_get($$store_subs ??= {}, "$selectedConcepts", selectedConcepts).map((concept) => concept.split("\\").filter(Boolean).length)) : 1;
  async function fetchChildren(conceptPath) {
    const dataset = conceptPath.split("\\")[1];
    const depth = conceptPath.split("\\").filter(Boolean).length;
    const treeNodes = await getConceptTree(dataset, depth, conceptPath);
    function getAllLeaves(node) {
      if (!node.children || node.children.length === 0) {
        return [node];
      }
      return node.children.flatMap(getAllLeaves);
    }
    const leaves = getAllLeaves(treeNodes);
    if (leaves.length === 1 && leaves[0].conceptPath === conceptPath) {
      return [];
    }
    return leaves;
  }
  const selectNode = (value) => {
    addConcept(value);
  };
  const unselectNode = (value) => {
    removeConcept(value);
  };
  $$payload.out.push(`<section class="flex flex-col w-full h-full items-center">`);
  Summary($$payload);
  $$payload.out.push(`<!----> <div class="w-full h-full m-2 card p-4"><header class="card-header">Select <strong>additional variables</strong> you would like to be included in your final data export.</header> <hr/> <div class="card-body p-4">`);
  await_block(
    $$payload,
    getInitialTree(largestDepth),
    () => {
      Loading($$payload, { ring: true, size: "small" });
    },
    (treeNodes) => {
      RemoteTree($$payload, {
        initialNodes: treeNodes,
        fetchChildren,
        fullWidth: true,
        onselect: selectNode,
        onunselect: unselectNode,
        previousSelectedConcepts: get(selectedConcepts)
      });
    }
  );
  $$payload.out.push(`<!--]--></div></div></section>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
let queryRequest = { resourceUUID: "", query: new QueryV2() };
let activeType = void 0;
let datasetId = void 0;
let datasetNameInput = void 0;
let lockDownload = true;
let saveable = false;
function setActiveType(type) {
  activeType = type;
}
function getActiveType() {
  return activeType;
}
function setDatasetId(id) {
  datasetId = id;
}
function getDatasetId() {
  return datasetId;
}
function setDatasetNameInput(name) {
  datasetNameInput = name;
}
function getDatasetNameInput() {
  return datasetNameInput;
}
function setLockDownload(lock) {
  lockDownload = lock;
}
function getLockDownload() {
  return lockDownload;
}
function getQueryRequest() {
  return queryRequest;
}
function setQueryRequest(q) {
  queryRequest = q;
}
function setSaveable(canSave) {
  saveable = canSave;
}
function getSaveable() {
  return saveable;
}
function resetExportStepperState() {
  setActiveType(void 0);
  setDatasetId(void 0);
  setDatasetNameInput(void 0);
  setLockDownload(true);
  setSaveable(false);
  setQueryRequest({ resourceUUID: "", query: new QueryV2() });
}
function TypeStep($$payload, $$props) {
  push();
  $$payload.out.push(`<section class="flex flex-col w-full h-full items-center">`);
  Summary($$payload);
  $$payload.out.push(`<!----> <div class="flex flex-row justify-center">`);
  CardButton($$payload, {
    "data-testid": "csv-export-option",
    title: "Export as Data Frame or CSV",
    subtitle: "Export data as a Python or R data frame or a comma-separated values file",
    size: "other",
    class: "flex-1 max-w-64",
    active: getActiveType() === "DATAFRAME",
    onclick: () => setActiveType("DATAFRAME")
  });
  $$payload.out.push(`<!----> `);
  if (features.explorer.enableExportTimeseries) {
    $$payload.out.push("<!--[-->");
    CardButton($$payload, {
      "data-testid": "timeseries-export-option",
      title: "Export as Timeseries",
      subtitle: "Export as an R or Python data frame or a comma-separated values file including timestamps",
      size: "other",
      class: "flex-1 max-w-64",
      active: getActiveType() === "DATAFRAME_TIMESERIES",
      onclick: () => setActiveType("DATAFRAME_TIMESERIES")
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  CardButton($$payload, {
    "data-testid": "pfb-export-option",
    title: "Export as PFB",
    subtitle: "Export data in Portable Format for Biomedical Data file format",
    size: "other",
    class: "flex-1 max-w-64",
    active: getActiveType() === "DATAFRAME_PFB",
    onclick: () => setActiveType("DATAFRAME_PFB")
  });
  $$payload.out.push(`<!----></div></section>`);
  pop();
}
function SaveDatasetStep($$payload, $$props) {
  push();
  let processingMessage = "";
  let datasetIdPromise = Promise.resolve();
  let preparePromise = Promise.resolve();
  let datasetNameInput2 = getDatasetNameInput();
  $$payload.out.push(`<section class="flex flex-col w-full h-full items-center">`);
  Summary($$payload);
  $$payload.out.push(`<!----> `);
  await_block(
    $$payload,
    preparePromise,
    () => {
      Loading($$payload, { ring: true });
    },
    () => {
      $$payload.out.push(`<div class="w-full h-full m-2 card p-4"><header class="card-header">Save the information in your final data export by clicking the Save Dataset ID button.
        Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or manage
        your Dataset IDs.</header> <hr/> <div class="card-body p-4 flex flex-col justify-center items-center"><div><div class="flex items-center m-2"><label for="dataset-name" class="font-bold mr-2">Dataset Name:</label> <input type="text" id="dataset-name" class="input w-80" placeholder="Enter a name"${attr("value", datasetNameInput2)} required/></div> <div class="flex items-center m-2"><div class="flex items-center">`);
      await_block(
        $$payload,
        datasetIdPromise,
        () => {
          $$payload.out.push(`<label for="dataset-id" class="font-bold mr-2">Dataset ID:</label> `);
          Loading($$payload, { ring: true, size: "micro", label: processingMessage });
          $$payload.out.push(`<!---->`);
        },
        () => {
          $$payload.out.push(`<label for="dataset-id" class="font-bold mr-2">Dataset ID:</label> <div id="dataset-id" class="mr-4">${escape_html(getDatasetId())}</div>`);
        }
      );
      $$payload.out.push(`<!--]--></div></div></div></div></div>`);
    }
  );
  $$payload.out.push(`<!--]--></section>`);
  pop();
}
function CommonAreaSaveDatasetStep($$payload, $$props) {
  push();
  $$payload.out.push(`<section class="flex flex-col w-full h-full items-center">`);
  Summary($$payload);
  $$payload.out.push(`<!----> `);
  {
    $$payload.out.push("<!--[-->");
    Loading($$payload, { ring: true, size: "small" });
    $$payload.out.push(`<!----> <span class="ml-2">Creating datasets to save...</span>`);
  }
  $$payload.out.push(`<!--]--></section>`);
  pop();
}
function DownloadButton($$payload, $$props) {
  push();
  let { query, datasetId: datasetId2 } = $$props;
  let modalOpen = false;
  let isDownloading = false;
  const downloadText = query.query.expectedResultType === "DATAFRAME" || query.query.expectedResultType === "DATAFRAME_TIMESERIES" ? "Download as CSV" : query.query.expectedResultType === "DATAFRAME_PFB" && features.explorer.enablePfbExport ? "Download as PFB" : "Download is Disabled";
  async function download() {
    if (!features.explorer.allowDownload) {
      return;
    }
    if (!datasetId2) {
      console.error("No dataset ID provided");
      toaster.error({
        title: "No dataset ID provided. Go back and save a dataset and try again.",
        closable: true
      });
      return;
    }
    try {
      isDownloading = true;
      const res = await post(`${Picsure.QueryV2}/${datasetId2}/result`, {});
      const responseDataUrl = URL.createObjectURL(new Blob([res], { type: "octet/stream" }));
      if (browser) ;
    } catch (error) {
      console.error("Error in onCompleteHandler", error);
    } finally {
      isDownloading = false;
    }
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<div class="flex items-center m-1">`);
    if (features.explorer.allowDownload) {
      $$payload2.out.push("<!--[-->");
      Modal_1($$payload2, {
        title: branding.explorePage.confirmDownloadTitle || "Are you sure you want to download data?",
        width: "w-1/2",
        withDefault: true,
        confirmText: "Download",
        cancelText: "Cancel",
        onconfirm: () => download(),
        get open() {
          return modalOpen;
        },
        set open($$value) {
          modalOpen = $$value;
          $$settled = false;
        },
        children: ($$payload3) => {
          $$payload3.out.push(`<!---->${escape_html(branding.explorePage.confirmDownloadMessage || "This action will download the data to your local machine. Are you sure you want to proceed?")}`);
        },
        $$slots: { default: true }
      });
      $$payload2.out.push(`<!----> <button class="btn preset-filled-primary-500"><i class="fa-solid fa-download mr-1"></i>${escape_html(downloadText)} `);
      if (isDownloading) {
        $$payload2.out.push("<!--[-->");
        Loading($$payload2, { ring: true, size: "micro", color: "white" });
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></button>`);
    } else {
      $$payload2.out.push("<!--[!-->");
      ErrorAlert($$payload2, {
        title: "Download is disabled!",
        color: "warning",
        solid: true,
        children: ($$payload3) => {
          $$payload3.out.push(`<p>Downloading data is disabled. Please contact the administrator to enable this feature.</p>`);
        }
      });
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
function TabbedAnalysisStep($$payload, $$props) {
  push();
  let tabSet = features.analyzeApi ? "Python" : features.explorer.allowDownload ? "Download" : "";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    {
      let list = function($$payload3) {
        if (features.analyzeApi) {
          $$payload3.out.push("<!--[-->");
          TabItem($$payload3, {
            value: "Python",
            get group() {
              return tabSet;
            },
            set group($$value) {
              tabSet = $$value;
              $$settled = false;
            },
            children: ($$payload4) => {
              $$payload4.out.push(`<!---->Python`);
            },
            $$slots: { default: true }
          });
          $$payload3.out.push(`<!----> `);
          TabItem($$payload3, {
            value: "R",
            get group() {
              return tabSet;
            },
            set group($$value) {
              tabSet = $$value;
              $$settled = false;
            },
            children: ($$payload4) => {
              $$payload4.out.push(`<!---->R`);
            },
            $$slots: { default: true }
          });
          $$payload3.out.push(`<!---->`);
        } else {
          $$payload3.out.push("<!--[!-->");
        }
        $$payload3.out.push(`<!--]--> `);
        if (features.explorer.allowDownload) {
          $$payload3.out.push("<!--[-->");
          TabItem($$payload3, {
            value: "Download",
            get group() {
              return tabSet;
            },
            set group($$value) {
              tabSet = $$value;
              $$settled = false;
            },
            children: ($$payload4) => {
              $$payload4.out.push(`<!---->Download`);
            },
            $$slots: { default: true }
          });
        } else {
          $$payload3.out.push("<!--[!-->");
        }
        $$payload3.out.push(`<!--]-->`);
      }, content = function($$payload3) {
        $$payload3.out.push(`<!---->`);
        Tabs.Panel($$payload3, {
          value: "Python",
          children: ($$payload4) => {
            CodeBlock($$payload4, {
              lang: "python",
              code: branding.explorePage.codeBlocks.PythonExport.replace("{{queryId}}", getDatasetId() ?? "DATASET_ID_MISSING") || "Code not set for Python in configuration"
            });
          },
          $$slots: { default: true }
        });
        $$payload3.out.push(`<!----> <!---->`);
        Tabs.Panel($$payload3, {
          value: "R",
          children: ($$payload4) => {
            CodeBlock($$payload4, {
              lang: "r",
              code: branding.explorePage.codeBlocks.RExport.replace("{{queryId}}", getDatasetId() ?? "DATASET_ID_MISSING") || "Code not set for R in configuration"
            });
          },
          $$slots: { default: true }
        });
        $$payload3.out.push(`<!----> `);
        if (features.explorer.allowDownload) {
          $$payload3.out.push("<!--[-->");
          $$payload3.out.push(`<!---->`);
          Tabs.Panel($$payload3, {
            value: "Download",
            children: ($$payload4) => {
              $$payload4.out.push(`<div class="flex justify-center w-full">`);
              DownloadButton($$payload4, { query: getQueryRequest(), datasetId: getDatasetId() });
              $$payload4.out.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
          $$payload3.out.push(`<!---->`);
        } else {
          $$payload3.out.push("<!--[!-->");
        }
        $$payload3.out.push(`<!--]-->`);
      };
      Tabs($$payload2, {
        value: tabSet,
        onValueChange: (e) => tabSet = e.value,
        list,
        content,
        $$slots: { list: true, content: true }
      });
    }
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
function RedcapStep($$payload, $$props) {
  push();
  $$payload.out.push(`<section class="flex flex-col w-full h-full"><p>By clicking "Request Access" you will be taken to the externally linked Request Data and
    Biosamples RedCap form where you can submit your request for data and biosamples.</p> <p class="mb-0">Before submitting the RedCap form, make sure you have:</p> <ul class="list-disc list-inside ml-8"><li>Selected all variables you would like to include in your export</li> <li><a href="/collaborate" class="anchor">Identified collaborators</a> if using data from other institutions.</li></ul> <div class="flex flex-row items-center self-center card p-4 my-4"><label for="copyable-dataset-id" class="font-bold mr-2">Dataset ID:</label> <span id="copyable-dataset-id" class="mr-2">${escape_html(getDatasetId())}</span> `);
  CopyButton($$payload, {
    itemToCopy: getDatasetId() ?? "MISSING_DATASET_ID",
    class: "preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
  });
  $$payload.out.push(`<!----></div> <p>Once the request has been submitted, the local Sample and Data Access Committee will review and
    notify you of a decision via email.</p> <p>Once approved, access to patient-level data will be provisioned in the GIC Service Workbench. To
    learn more about this, please refer to the <a href="/analyze" class="anchor">Analyze page</a>.</p></section>`);
  pop();
}
function PfbExport($$payload, $$props) {
  push();
  let exportLoading = false;
  $$payload.out.push(`<section class="flex flex-col gap-8 place-items-center"><div class="flex justify-center mt-4">Select an option below to export your selected data in PFB format.</div> `);
  if (branding.explorePage?.pfbExportUrls && branding.explorePage.pfbExportUrls.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(branding.explorePage.pfbExportUrls);
    $$payload.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let exportLink = each_array[$$index];
      $$payload.out.push(`<button${attr("disabled", exportLoading, true)} class="flex-initial w-64 btn preset-filled-primary-500 disabled:preset-tonal-primary border border-primary-500"><i class="fa-solid fa-arrow-up-right-from-square"></i> <span>Export to ${escape_html(exportLink.title)}</span> `);
      {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></button>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  DownloadButton($$payload, { query: getQueryRequest(), datasetId: getDatasetId() });
  $$payload.out.push(`<!----></section>`);
  pop();
}
function AnalysisPlatformLinks($$payload, $$props) {
  push();
  if (branding.explorePage.goTo.links.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(branding.explorePage.goTo.links);
    $$payload.out.push(`<div class="flex justify-center"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let link = each_array[$$index];
      $$payload.out.push(`<a class="btn preset-tonal-primary border border-primary-500 m-2 hover:preset-filled-primary-500"${attr("href", link.url)}${attr("target", link.newTab ? "_blank" : "_self")}>${escape_html(link.title)}</a>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function ExportStepper($$payload, $$props) {
  push();
  var $$store_subs;
  const { query, rows = [] } = $$props;
  let statusPromise = Promise.resolve();
  Promise.resolve();
  let saveDatasetPromise = Promise.resolve();
  const showTabbedAnalysisStep = (getQueryRequest().query.expectedResultType === "DATAFRAME" || getQueryRequest().query.expectedResultType === "DATAFRAME_TIMESERIES") && !features.explorer.enableRedcapExport;
  const showPfbExportStep = getQueryRequest().query.expectedResultType === "DATAFRAME_PFB" && features.explorer.enablePfbExport && !features.explorer.enableRedcapExport;
  const showUserToken = (getQueryRequest().query.expectedResultType === "DATAFRAME" || getQueryRequest().query.expectedResultType === "DATAFRAME_TIMESERIES") && features.analyzeApi && !features.explorer.enableRedcapExport;
  let prevConcepts = [];
  function updateConcepts() {
    const conceptsToRemove = prevConcepts.filter((concept) => !store_get($$store_subs ??= {}, "$selectedConcepts", selectedConcepts).includes(concept));
    conceptsToRemove.forEach((concept) => {
      const fieldIndex = getQueryRequest().query.fields.indexOf(concept);
      if (fieldIndex > -1) {
        getQueryRequest().query.fields.splice(fieldIndex, 1);
      }
    });
    prevConcepts = store_get($$store_subs ??= {}, "$selectedConcepts", selectedConcepts);
    store_get($$store_subs ??= {}, "$selectedConcepts", selectedConcepts).forEach((concept) => {
      getQueryRequest().query.addField(concept);
    });
  }
  async function onNextHandler(_step, stepName) {
    const shouldUpdateConcepts = features.explorer.showTreeStep && stepName === (features.federated ? "save-dataset" : "select-type");
    if (stepName === "select-variables") {
      getQueryRequest().query.fields.forEach(addConcept);
    }
    if (shouldUpdateConcepts) {
      updateConcepts();
    }
    if (stepName === "start") {
      if (features.explorer.enableRedcapExport) {
        setLockDownload(false);
      }
      const siteQueryIds = Object.values(store_get($$store_subs ??= {}, "$federatedQueryMap", federatedQueryMap)).map((info) => ({
        resourceId: info?.resourceId,
        name: info?.name,
        queryId: info?.queryId
      })).filter((v) => v.queryId);
      if (getDatasetId()) {
        saveDatasetPromise = createDatasetName(getDatasetId() ?? "", getDatasetNameInput() ?? "", siteQueryIds.length > 0 ? siteQueryIds : void 0).then((data) => {
          if (features.federated) {
            statusPromise = Promise.resolve();
            return data;
          } else {
            statusPromise = checkExportStatus(getDatasetId());
          }
          return data;
        });
      } else {
        throw new Error("No dataset ID provided");
      }
    }
    return;
  }
  async function checkExportStatus(lastPicsureResultId) {
    const statusId = lastPicsureResultId || getDatasetId();
    const queryFragment = `/${statusId}/status`;
    return withBackoff(
      async () => {
        const res = await post(`${Picsure.QueryV2}${queryFragment}`, query);
        if (res.status === "ERROR") {
          setLockDownload(true);
          throw new Error(`Export failed with status: ${res.status}`);
        }
        if (res.status !== "SUCCESS" && res.status !== "AVAILABLE") {
          throw new Error(`Export not ready. Status: ${res.status}`);
        }
        setLockDownload(false);
        return;
      },
      15,
      500,
      6e4,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (error, _attempt) => {
        return !(error instanceof Error && error.message.includes("Export failed with status: ERROR"));
      }
    );
  }
  function onComplete() {
    if (features.explorer.enableRedcapExport) {
      window.open("https://redcap.tch.harvard.edu/redcap_edc/surveys/?s=EWYX8X8XX77TTWFR", "_blank");
      resetExportStepperState();
      goto();
    } else {
      resetExportStepperState();
      goto();
    }
  }
  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1e6;
  function dataLimitExceeded() {
    const extraVariables = store_get($$store_subs ??= {}, "$filters", filters).filter((filter) => filter.filterType === "AnyRecordOf").reduce((acc, filter) => acc + filter.concepts.length, 0);
    let participantCount = typeof store_get($$store_subs ??= {}, "$totalParticipants", totalParticipants) === "number" ? store_get($$store_subs ??= {}, "$totalParticipants", totalParticipants) : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints = participantCount + (store_get($$store_subs ??= {}, "$filters", filters).length + extraVariables) + store_get($$store_subs ??= {}, "$exports", exports).length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }
  Stepper($$payload, {
    class: "w-full h-full m-8",
    oncomplete: onComplete,
    onnext: onNextHandler,
    buttonCompleteLabel: features.explorer.enableRedcapExport ? "Request Access" : "Done",
    children: ($$payload2) => {
      {
        let header = function($$payload3) {
          $$payload3.out.push(`<!---->Review Cohort Details:`);
        };
        Step($$payload2, {
          name: "review",
          locked: dataLimitExceeded(),
          header,
          children: ($$payload3) => {
            ReviewStep($$payload3, {
              rows,
              dataLimitExceeded: dataLimitExceeded()
            });
          }
        });
      }
      $$payload2.out.push(`<!----> `);
      if (features.explorer.showTreeStep) {
        $$payload2.out.push("<!--[-->");
        {
          let header = function($$payload3) {
            $$payload3.out.push(`<!---->Finalize Data:`);
          };
          Step($$payload2, {
            name: "select-variables",
            header,
            children: ($$payload3) => {
              TreeStep($$payload3);
            }
          });
        }
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      if (features.explorer.enablePfbExport && !features.federated) {
        $$payload2.out.push("<!--[-->");
        {
          let header = function($$payload3) {
            $$payload3.out.push(`<!---->Review and Save Dataset:`);
          };
          Step($$payload2, {
            name: "select-type",
            locked: getActiveType() === void 0,
            header,
            children: ($$payload3) => {
              TypeStep($$payload3);
            }
          });
        }
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      {
        let header = function($$payload3) {
          $$payload3.out.push(`<!---->Save Dataset ID:`);
        };
        Step($$payload2, {
          name: "save-dataset",
          locked: !getDatasetNameInput() || (getDatasetNameInput()?.length ?? 0) < 2 || !getDatasetId() || !getSaveable(),
          header,
          children: ($$payload3) => {
            if (features.federated) {
              $$payload3.out.push("<!--[-->");
              CommonAreaSaveDatasetStep($$payload3);
            } else {
              $$payload3.out.push("<!--[!-->");
              SaveDatasetStep($$payload3);
            }
            $$payload3.out.push(`<!--]-->`);
          }
        });
      }
      $$payload2.out.push(`<!----> `);
      {
        let header = function($$payload3) {
          $$payload3.out.push(`<!---->Start Analysis:`);
        };
        Step($$payload2, {
          name: "start",
          locked: getLockDownload(),
          header,
          children: ($$payload3) => {
            $$payload3.out.push(`<section class="flex flex-col w-full h-full items-center">`);
            await_block(
              $$payload3,
              saveDatasetPromise,
              () => {
                Loading($$payload3, { ring: true, size: "medium", label: "Saving" });
              },
              () => {
                await_block(
                  $$payload3,
                  statusPromise,
                  () => {
                    Loading($$payload3, { ring: true, size: "medium", label: "Preparing" });
                  },
                  () => {
                    $$payload3.out.push(`<p class="mt-4">${escape_html(branding.explorePage.analysisExportText)}</p> `);
                    if (showTabbedAnalysisStep) {
                      $$payload3.out.push("<!--[-->");
                      TabbedAnalysisStep($$payload3);
                    } else {
                      $$payload3.out.push("<!--[!-->");
                      if (showPfbExportStep) {
                        $$payload3.out.push("<!--[-->");
                        PfbExport($$payload3);
                      } else {
                        $$payload3.out.push("<!--[!-->");
                        if (features.explorer.enableRedcapExport) {
                          $$payload3.out.push("<!--[-->");
                          RedcapStep($$payload3);
                        } else {
                          $$payload3.out.push("<!--[!-->");
                        }
                        $$payload3.out.push(`<!--]-->`);
                      }
                      $$payload3.out.push(`<!--]-->`);
                    }
                    $$payload3.out.push(`<!--]--> `);
                    if (branding.explorePage.goTo.instructions && branding.explorePage.goTo.instructions.length > 0) {
                      $$payload3.out.push("<!--[-->");
                      $$payload3.out.push(`<p>${escape_html(branding.explorePage.goTo.instructions)}</p>`);
                    } else {
                      $$payload3.out.push("<!--[!-->");
                    }
                    $$payload3.out.push(`<!--]--> `);
                    if (showUserToken) {
                      $$payload3.out.push("<!--[-->");
                      $$payload3.out.push(`<div class="flex justify-center">`);
                      UserToken($$payload3);
                      $$payload3.out.push(`<!----></div>`);
                    } else {
                      $$payload3.out.push("<!--[!-->");
                    }
                    $$payload3.out.push(`<!--]--> `);
                    AnalysisPlatformLinks($$payload3);
                    $$payload3.out.push(`<!---->`);
                  }
                );
                $$payload3.out.push(`<!--]-->`);
              }
            );
            $$payload3.out.push(`<!--]--></section>`);
          }
        });
      }
      $$payload2.out.push(`<!---->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let { exports: exports2 } = ExportStore;
  let queryRequest2 = getQueryRequestV2(true);
  let exportRows = store_get($$store_subs ??= {}, "$exports", exports2).map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.conceptPath,
      name: exp.display || exp.searchResult?.display || exp.searchResult?.name,
      description: exp.searchResult?.description,
      type: exp.searchResult?.type
    };
  });
  let filterRows = store_get($$store_subs ??= {}, "$filters", filters).map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      name: filter.searchResult?.display || filter.variableName,
      description: filter.searchResult?.description,
      type: filter.searchResult?.type
    };
  });
  stepperState.set({
    ...store_get($$store_subs ??= {}, "$stepperState", stepperState),
    current: 0,
    total: 0
  });
  Content($$payload, {
    backUrl: "/explorer",
    backTitle: "Back to Explore",
    backAction: () => {
      store_mutate($$store_subs ??= {}, "$stepperState", stepperState, store_get($$store_subs ??= {}, "$stepperState", stepperState).current = 0);
    },
    title: "Export Data for Research Analysis",
    children: ($$payload2) => {
      if (store_get($$store_subs ??= {}, "$exports", exports2).length > 0 || store_get($$store_subs ??= {}, "$filters", filters).length > 0) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<section class="flex justify-center items-center w-full h-full mt-8">`);
        ExportStepper($$payload2, { query: queryRequest2, rows: [...filterRows, ...exportRows] });
        $$payload2.out.push(`<!----></section>`);
      } else {
        $$payload2.out.push("<!--[!-->");
        $$payload2.out.push(`<div class="flex flex-col items-center justify-center m-8"><p>No filters or exports have been created.</p> <div class="flex gap-4"><button class="btn preset-filled-primary-500 m-4">Learn How</button></div></div>`);
      }
      $$payload2.out.push(`<!--]-->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CaCiEx7G.js.map
