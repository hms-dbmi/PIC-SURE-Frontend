import { a as subscribe, l as is_promise, n as noop, s as setContext, k as createEventDispatcher, f as getContext, q as set_store_value, o as onDestroy, m as compute_slots } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component, a as add_attribute, e as escape, b as each } from './ssr-BRJpAXVH.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import { T as TabGroup, C as CodeBlock, a as Tab } from './CodeBlock-D3P8-iRB.js';
import './client-BR749xJD.js';
import './index-CvuFLVuQ.js';
import './User-Clr_TyZW.js';
import { f as features, b as branding, s as settings } from './configuration-wvkhv90d.js';
import { w as writable } from './index2-BVONNh3m.js';
import { e as exports, E as ExportStore } from './Export-lg6T-LMZ.js';
import { f as filters, t as totalParticipants } from './Filter-CGcyy10g.js';
import './Dictionary-BM0RbjoK.js';
import { A as AngleButton } from './AngleButton-C6YzBYNH.js';
import { T as Table } from './Table-smaNoih1.js';
import { U as UserToken } from './UserToken-Di9tipps.js';
import { C as CardButton } from './CardButton-BunBsA3_.js';

const state = writable({ current: 0, total: 0, stepMap: [] });
const Stepper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isActive;
  let $state, $$unsubscribe_state;
  $$unsubscribe_state = subscribe(state, (value) => $state = value);
  let { buttonCompleteLabel = "" } = $$props;
  setContext("buttonCompleteLabel", buttonCompleteLabel);
  setContext("state", state);
  const dispatch = createEventDispatcher();
  async function onNext(locked) {
    await new Promise((resolve) => setTimeout(resolve));
    if (locked) return;
    const step = $state.current + 1;
    const name = $state.stepMap[step];
    dispatch("next", { step, name, state: $state });
    set_store_value(state, $state.current = step, $state);
  }
  function onBack() {
    const step = $state.current === 0 ? 0 : $state.current - 1;
    const name = $state.stepMap[step];
    dispatch("back", { step, name, state: $state });
    set_store_value(state, $state.current = step, $state);
  }
  function onComplete(stepIndex, locked) {
    if (locked) return;
    dispatch("complete", {
      step: stepIndex,
      name: $state.stepMap[stepIndex],
      state: $state
    });
  }
  setContext("onBack", onBack);
  setContext("onNext", onNext);
  setContext("onComplete", onComplete);
  if ($$props.buttonCompleteLabel === void 0 && $$bindings.buttonCompleteLabel && buttonCompleteLabel !== void 0) $$bindings.buttonCompleteLabel(buttonCompleteLabel);
  isActive = (step) => step === $state.current;
  $$unsubscribe_state();
  return `<div class="${"stepper space-y-4 " + escape($$props.class ?? "", true)}" data-testid="stepper">${$state.total ? `<header class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-400-500-token gap-4">${each(Array.from(Array($state.total).keys()), (step) => {
    return `<div class="${[
      "stepper-header-step -mt-[15px] transition-all duration-300",
      isActive(step) ? "flex-1" : ""
    ].join(" ").trim()}"><span data-testid="${"step-" + escape($state.stepMap[step], true)}" class="${"badge text-sm " + escape(
      isActive(step) ? "variant-filled-primary" : "variant-filled-surface",
      true
    )}">${escape(isActive(step) ? `Step ${step + 1}` : step + 1)}</span> </div>`;
  })}</header>` : ``} <div class="stepper-content">${slots.default ? slots.default({}) : ``}</div></div>`;
});
const Step = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$slots = compute_slots(slots);
  let $state, $$unsubscribe_state;
  let { name } = $$props;
  let { locked = false } = $$props;
  let { buttonCompleteLabel = getContext("buttonCompleteLabel") } = $$props;
  let { state: state2 = getContext("state") } = $$props;
  $$unsubscribe_state = subscribe(state2, (value) => $state = value);
  let { onNext = getContext("onNext") } = $$props;
  let { onBack = getContext("onBack") } = $$props;
  let { onComplete = getContext("onComplete") } = $$props;
  const stepIndex = $state.total;
  set_store_value(state2, $state.stepMap = [...$state.stepMap, name], $state);
  set_store_value(state2, $state.total++, $state);
  onDestroy(() => {
    set_store_value(state2, $state.total--, $state);
    set_store_value(state2, $state.stepMap = $state.stepMap.filter((item) => item !== name), $state);
  });
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.locked === void 0 && $$bindings.locked && locked !== void 0) $$bindings.locked(locked);
  if ($$props.buttonCompleteLabel === void 0 && $$bindings.buttonCompleteLabel && buttonCompleteLabel !== void 0) $$bindings.buttonCompleteLabel(buttonCompleteLabel);
  if ($$props.state === void 0 && $$bindings.state && state2 !== void 0) $$bindings.state(state2);
  if ($$props.onNext === void 0 && $$bindings.onNext && onNext !== void 0) $$bindings.onNext(onNext);
  if ($$props.onBack === void 0 && $$bindings.onBack && onBack !== void 0) $$bindings.onBack(onBack);
  if ($$props.onComplete === void 0 && $$bindings.onComplete && onComplete !== void 0) $$bindings.onComplete(onComplete);
  $$unsubscribe_state();
  return `${stepIndex === $state.current ? `<div class="step space-y-4" data-testid="${"step-" + escape(stepIndex + 1, true)}"><header class="step-header text-2xl font-bold">${slots.header ? slots.header({}) : ``}</header> <div class="step-content space-y-4 px-2">${slots.default ? slots.default({}) : `(Step ${escape(stepIndex + 1)} Content)`}</div> ${$state.total > 1 ? `<div class="step-navigation flex justify-between gap-4">${$$slots.navigation ? `<div class="step-navigation-slot">${slots.navigation ? slots.navigation({}) : ``}</div>` : `${stepIndex !== 0 ? `${validate_component(AngleButton, "AngleButton").$$render($$result, { disabled: $state.current === 0 }, {}, {
    default: () => {
      return `Back`;
    }
  })}` : `<div></div>`}`} ${stepIndex < $state.total - 1 ? `${validate_component(AngleButton, "AngleButton").$$render(
    $$result,
    {
      name: "next",
      angle: "right",
      variant: "filled",
      disabled: locked
    },
    {},
    {
      default: () => {
        return `Next`;
      }
    }
  )}` : `${validate_component(AngleButton, "AngleButton").$$render(
    $$result,
    {
      name: buttonCompleteLabel || "complete",
      angle: "right",
      variant: "filled",
      disabled: locked
    },
    {},
    {
      default: () => {
        return `${escape(buttonCompleteLabel || "Complete")}`;
      }
    }
  )}`}</div>` : ``}</div>` : ``}`;
});
const css = {
  code: "#stats.svelte-11yjabd{border-bottom:1px solid #888888}",
  map: '{"version":3,"file":"Summary.svelte","sources":["Summary.svelte"],"sourcesContent":["<script lang=\\"ts\\">import ExportStore from \\"$lib/stores/Export\\";\\nimport { filters, totalParticipants } from \\"$lib/stores/Filter\\";\\nlet { exports } = ExportStore;\\n$: participantsCount = $totalParticipants;\\n$: variablesCount = $filters.length + $exports.length;\\n$: dataPoints = typeof participantsCount === \\"number\\" ? participantsCount * variablesCount : 0;\\n<\/script>\\n\\n<div id=\\"stats\\" class=\\"w-full flex justify-evenly mb-5 pb-2\\">\\n  <div id=\\"summary\\" class=\\"w-full grid grid-flow-col auto-cols-auto\\">\\n    <div class=\\"text-xl\\">\\n      <label for=\\"summary\\" class=\\"mr-8 font-bold\\">Summary:</label>\\n    </div>\\n    <div class=\\"flex justify-left text-xl font-light\\">\\n      <span id=\\"participants\\" class=\\"mr-2\\">{participantsCount}</span>\\n      <label for=\\"participants\\">Participants</label>\\n    </div>\\n    <div class=\\"flex justify-left text-xl font-light\\">\\n      <span id=\\"variables\\" class=\\"mr-2\\">{variablesCount}</span>\\n      <label for=\\"variables\\">Variables</label>\\n    </div>\\n    <div class=\\"flex justify-left text-xl font-light\\">\\n      <span id=\\"dataPoints\\" class=\\"mr-2\\">{dataPoints}</span>\\n      <label for=\\"dataPoints\\">Data Points</label>\\n    </div>\\n  </div>\\n</div>\\n\\n<style>\\n  #stats {\\n    border-bottom: 1px solid #888888;\\n  }</style>\\n"],"names":[],"mappings":"AA6BE,qBAAO,CACL,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,OAC3B"}'
};
const Summary = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let participantsCount;
  let variablesCount;
  let dataPoints;
  let $exports, $$unsubscribe_exports;
  let $filters, $$unsubscribe_filters;
  let $totalParticipants, $$unsubscribe_totalParticipants;
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  $$unsubscribe_totalParticipants = subscribe(totalParticipants, (value) => $totalParticipants = value);
  let { exports: exports2 } = ExportStore;
  $$unsubscribe_exports = subscribe(exports2, (value) => $exports = value);
  $$result.css.add(css);
  participantsCount = $totalParticipants;
  variablesCount = $filters.length + $exports.length;
  dataPoints = typeof participantsCount === "number" ? participantsCount * variablesCount : 0;
  $$unsubscribe_exports();
  $$unsubscribe_filters();
  $$unsubscribe_totalParticipants();
  return `<div id="stats" class="w-full flex justify-evenly mb-5 pb-2 svelte-11yjabd"><div id="summary" class="w-full grid grid-flow-col auto-cols-auto"><div class="text-xl" data-svelte-h="svelte-1vd72fa"><label for="summary" class="mr-8 font-bold">Summary:</label></div> <div class="flex justify-left text-xl font-light"><span id="participants" class="mr-2">${escape(participantsCount)}</span> <label for="participants" data-svelte-h="svelte-1te5h4m">Participants</label></div> <div class="flex justify-left text-xl font-light"><span id="variables" class="mr-2">${escape(variablesCount)}</span> <label for="variables" data-svelte-h="svelte-j0nyhs">Variables</label></div> <div class="flex justify-left text-xl font-light"><span id="dataPoints" class="mr-2">${escape(dataPoints)}</span> <label for="dataPoints" data-svelte-h="svelte-kgfncs">Data Points</label></div></div> </div>`;
});
const ExportStepper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let datasetId;
  let processingMessage;
  let exportLoading;
  let $exports, $$unsubscribe_exports;
  let $filters, $$unsubscribe_filters;
  let $totalParticipants, $$unsubscribe_totalParticipants;
  let $$unsubscribe_state;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  $$unsubscribe_totalParticipants = subscribe(totalParticipants, (value) => $totalParticipants = value);
  $$unsubscribe_state = subscribe(state, (value) => value);
  let { query } = $$props;
  let { showTreeStep = false } = $$props;
  let { rows = [] } = $$props;
  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1e6;
  getModalStore();
  getToastStore();
  const columns = [
    {
      dataElement: "variableName",
      label: "Variable Name",
      sort: true
    },
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
  let activeType;
  let statusPromise;
  let preparePromise;
  let datasetIdPromise;
  let saveDatasetPromise;
  let datasetNameInput = "";
  let lockDownload = true;
  let sampleIds = false;
  let tabSet = 0;
  function dataLimitExceeded() {
    let participantCount = typeof $totalParticipants === "number" ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints = participantCount + $filters.length + $exports.length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }
  if ($$props.query === void 0 && $$bindings.query && query !== void 0) $$bindings.query(query);
  if ($$props.showTreeStep === void 0 && $$bindings.showTreeStep && showTreeStep !== void 0) $$bindings.showTreeStep(showTreeStep);
  if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0) $$bindings.rows(rows);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    datasetId = "";
    processingMessage = "";
    exportLoading = false;
    $$rendered = `${validate_component(Stepper, "Stepper").$$render(
      $$result,
      {
        class: "w-full h-full m-8",
        buttonCompleteLabel: "Done"
      },
      {},
      {
        default: () => {
          return `${validate_component(Step, "Step").$$render(
            $$result,
            {
              name: "review",
              locked: dataLimitExceeded()
            },
            {},
            {
              header: () => {
                return `Review Cohort Details:`;
              },
              default: () => {
                return `<div id="first-step-container" class="flex flex-col w-full h-full items-center">${validate_component(Summary, "Summary").$$render($$result, {}, {}, {})} <section class="w-full">${dataLimitExceeded() ? `<aside class="alert variant-filled-error"><div data-svelte-h="svelte-1dz1fc7"><i class="fa-solid fa-triangle-exclamation text-4xl"></i></div> <div class="alert-message" data-svelte-h="svelte-e8x9nn"><h3 class="h3">Warning</h3> <p>Warning: Your selected data exceeds 1,000,000 estimated data points, which is too
                large to export. Please reduce the data selection or the number of selected
                participants.</p></div> <div class="alert-actions dark"><button class="btn variant-filled" data-svelte-h="svelte-1datm77">Back</button></div></aside>` : `${function(__value) {
                  if (is_promise(__value)) {
                    __value.then(null, noop);
                    return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-4" }, {}, {})} <div data-svelte-h="svelte-1m53t1h">Preparing your dataset...</div> `;
                  }
                  return /* @__PURE__ */ function() {
                    return ``;
                  }();
                }(preparePromise)} ${`${validate_component(Table, "Datatable").$$render(
                  $$result,
                  {
                    tableName: "ExportSummary",
                    data: rows,
                    columns
                  },
                  {},
                  {}
                )} ${`<div><label for="sample-ids-checkbox" class="flex items-center" data-testid="sample-ids-label">${`<input type="checkbox" class="input mr-1 &amp;[aria-disabled=“true”]:opacity-75" data-testid="sample-ids-checkbox" id="sample-ids-checkbox"${add_attribute("checked", sampleIds, 1)}>`} <span data-svelte-h="svelte-julkv0">Include sample identifiers</span></label></div>`}`}`}</section></div>`;
              }
            }
          )} ${showTreeStep ? `${validate_component(Step, "Step").$$render($$result, { name: "select-variables" }, {}, {
            header: () => {
              return `Finalize Data:`;
            },
            default: () => {
              return `<section class="flex flex-col w-full h-full items-center">${validate_component(Summary, "Summary").$$render($$result, {}, {}, {})} <div class="w-full h-full m-2 card p-4" data-svelte-h="svelte-1l9s757"><header class="card-header">Select <strong>additional variables</strong> you would like to be included in your final
            data export.</header> <hr> <div class="card-body p-4">Tree Component Here</div></div></section>`;
            }
          })}` : ``} ${features.explorer.enablePfbExport ? `${validate_component(Step, "Step").$$render(
            $$result,
            {
              name: "select-type",
              locked: activeType === void 0
            },
            {},
            {
              header: () => {
                return `Review and Save Dataset:`;
              },
              default: () => {
                return `<section class="flex flex-col w-full h-full items-center">${validate_component(Summary, "Summary").$$render($$result, {}, {}, {})} <div class="grid gap-10 grid-cols-2">${validate_component(CardButton, "CardButton").$$render(
                  $$result,
                  {
                    "data-testid": "csv-export-option",
                    title: "Export as Data Frame or CSV",
                    subtitle: "Export data as a Python or R data frame or a comma-separated values file",
                    size: "other",
                    class: "card variant-ringed-primary",
                    active: activeType === "DATAFRAME"
                  },
                  {},
                  {}
                )} ${validate_component(CardButton, "CardButton").$$render(
                  $$result,
                  {
                    "data-testid": "pfb-export-option",
                    title: "Export as PFB",
                    subtitle: "Export data in Portable Format for Biomedical Data file format",
                    size: "other",
                    class: "card variant-ringed-primary",
                    active: activeType === "DATAFRAME_PFB"
                  },
                  {},
                  {}
                )}</div></section>`;
              }
            }
          )}` : ``} ${validate_component(Step, "Step").$$render(
            $$result,
            {
              name: "save-dataset",
              locked: !datasetNameInput
            },
            {},
            {
              header: () => {
                return `Save Dataset ID:`;
              },
              default: () => {
                return `<section class="flex flex-col w-full h-full items-center">${validate_component(Summary, "Summary").$$render($$result, {}, {}, {})} <div class="w-full h-full m-2 card p-4"><header class="card-header" data-svelte-h="svelte-1l8cwjc">Save the information in your final data export by clicking the Save Dataset ID button.
          Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or manage
          your Dataset IDs.</header> <hr> <div class="card-body p-4 flex flex-col justify-center items-center"><div><div class="flex items-center m-2"><label for="dataset-name" class="font-bold mr-2" data-svelte-h="svelte-1i4hx8x">Dataset Name:</label> <input type="text" id="dataset-name" class="input w-80" placeholder="Enter a name" required${add_attribute("value", datasetNameInput, 0)}></div> <div class="flex items-center m-2"><div class="flex items-center"><label for="dataset-id" class="font-bold mr-2" data-svelte-h="svelte-vytwml">Dataset ID:</label> ${function(__value) {
                  if (is_promise(__value)) {
                    __value.then(null, noop);
                    return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-4" }, {}, {})} <div>${escape(processingMessage)}</div> `;
                  }
                  return function() {
                    return ` <div id="dataset-id" class="mr-4">${escape(datasetId)}</div> `;
                  }();
                }(datasetIdPromise)}</div></div></div></div></div></section>`;
              }
            }
          )} ${validate_component(Step, "Step").$$render($$result, { name: "start", locked: lockDownload }, {}, {
            header: () => {
              return `Start Analysis:`;
            },
            default: () => {
              return `<section class="flex flex-col w-full h-full items-center">${function(__value) {
                if (is_promise(__value)) {
                  __value.then(null, noop);
                  return ` <div class="flex justify-center items-center">${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-4" }, {}, {})} <div data-svelte-h="svelte-76jx2r">Saving your dataset...</div></div> `;
                }
                return function() {
                  return ` <div class="flex justify-center">${function(__value2) {
                    if (is_promise(__value2)) {
                      __value2.then(null, noop);
                      return ` <div class="flex justify-center items-center">${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-4" }, {}, {})} <div data-svelte-h="svelte-1m53t1h">Preparing your dataset...</div></div> `;
                    }
                    return function() {
                      return ` ${query.query.expectedResultType === "DATAFRAME" ? `<section class="flex flex-col gap-8"><p class="mt-4">${escape(branding.explorePage.analysisExportText)}</p> ${validate_component(TabGroup, "TabGroup").$$render($$result, { class: "card p-4" }, {}, {
                        panel: () => {
                          return `${tabSet === 0 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                            $$result,
                            {
                              language: "python",
                              lineNumbers: true,
                              buttonCopied: "Copied!",
                              code: branding.explorePage.codeBlocks.PythonExport.replace("{{queryId}}", datasetId) || "Code not set"
                            },
                            {},
                            {}
                          )}` : `${tabSet === 1 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                            $$result,
                            {
                              language: "r",
                              lineNumbers: true,
                              buttonCopied: "Copied!",
                              code: branding.explorePage.codeBlocks.RExport.replace("{{queryId}}", datasetId) || "Code not set"
                            },
                            {},
                            {}
                          )}` : `${features.explorer.allowDownload && tabSet === 2 ? `<button class="btn variant-filled-primary" data-svelte-h="svelte-1hl85ea"><i class="fa-solid fa-download mr-1"></i>Download as CSV</button>` : ``}`}`} `;
                        },
                        default: () => {
                          return `${validate_component(Tab, "Tab").$$render(
                            $$result,
                            { name: "python", value: 0, group: tabSet },
                            {
                              group: ($$value) => {
                                tabSet = $$value;
                                $$settled = false;
                              }
                            },
                            {
                              default: () => {
                                return `Python`;
                              }
                            }
                          )} ${validate_component(Tab, "Tab").$$render(
                            $$result,
                            { name: "r", value: 1, group: tabSet },
                            {
                              group: ($$value) => {
                                tabSet = $$value;
                                $$settled = false;
                              }
                            },
                            {
                              default: () => {
                                return `R`;
                              }
                            }
                          )} ${features.explorer.allowDownload ? `${validate_component(Tab, "Tab").$$render(
                            $$result,
                            {
                              name: "download",
                              value: 2,
                              group: tabSet
                            },
                            {
                              group: ($$value) => {
                                tabSet = $$value;
                                $$settled = false;
                              }
                            },
                            {
                              default: () => {
                                return `Download`;
                              }
                            }
                          )}` : ``}`;
                        }
                      })} <p>${escape(branding.explorePage.goTo.instructions)}</p> <div class="flex justify-center">${validate_component(UserToken, "UserToken").$$render($$result, {}, {}, {})}</div> ${branding.explorePage.goTo.links.length > 0 ? `<div class="flex justify-center">${each(branding.explorePage.goTo.links, (link) => {
                        return `<a class="btn variant-ghost-primary m-2 hover:variant-filled-primary"${add_attribute("href", link.url, 0)}${add_attribute("target", link.newTab ? "_blank" : "_self", 0)}>${escape(link.title)}</a>`;
                      })}</div>` : ``}</section>` : `${query.query.expectedResultType === "DATAFRAME_PFB" && features.explorer.enablePfbExport ? `<section class="flex flex-col gap-8 place-items-center"><div class="flex justify-center mt-4" data-svelte-h="svelte-1e8jgjm">Select an option below to export your selected data in PFB format.</div> ${branding.explorePage?.pfbExportUrls && branding.explorePage.pfbExportUrls.length > 0 ? `${each(branding.explorePage.pfbExportUrls, (exportLink) => {
                        return `<button ${exportLoading ? "disabled" : ""} class="flex-initial w-64 btn variant-filled-primary disabled:variant-ghost-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i>Export to ${escape(exportLink.title)}</button>`;
                      })}` : ``} <button class="flex-initial w-64 btn variant-filled-primary" data-svelte-h="svelte-1aopsz6"><i class="fa-solid fa-download"></i>Download as PFB</button></section>` : ``}`} `;
                    }();
                  }(statusPromise)}</div> `;
                }();
              }(saveDatasetPromise)}</section>`;
            }
          })}`;
        }
      }
    )}`;
  } while (!$$settled);
  $$unsubscribe_exports();
  $$unsubscribe_filters();
  $$unsubscribe_totalParticipants();
  $$unsubscribe_state();
  return $$rendered;
});

export { ExportStepper as E, state as s };
//# sourceMappingURL=ExportStepper-ed31N7gT.js.map
