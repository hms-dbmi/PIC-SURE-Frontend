import { x as push, T as store_get, W as unsubscribe_stores, z as pop, a5 as store_mutate, U as copy_payload, V as assign_payload, K as escape_html, y as setContext, M as attr_class, R as ensure_array_like, N as attr, P as stringify, J as getContext, X as await_block } from './index-C5NonOVO.js';
import { S as post, R as Picsure, b as browser, av as resources } from './User-ByrNDeqq.js';
import { T as Tabs } from './index4-8-oP3lmO.js';
import { g as goto } from './client2-CLhyDddE.js';
import { b as branding, f as features, s as settings } from './configuration-CSskKBur.js';
import { h as get, w as writable } from './exports-Cnt0TmSD.js';
import { E as ExportStore, e as exports } from './Export-CTQ_v_3l.js';
import { c as filters } from './Filter-BUwQwcV6.js';
import { t as totalParticipants } from './ResultStore-CVyEAw3c.js';
import './Dictionary-10axK71X.js';
import { o as onDestroy, L as Loading } from './Loading-Drx6gnkR.js';
import { C as Content, A as AngleButton } from './Content-DHBbMVB_.js';
import { S as StaticTable } from './StaticTable-h7VnOZfV.js';
import { U as UserToken } from './UserToken-B3RpHJ0L.js';
import { E as ErrorAlert } from './ErrorAlert-Sg5STlCJ.js';
import { C as CardButton } from './CardButton-mV7OQcpn.js';
import { M as Modal_1 } from './Modal-tsNejdoN.js';
import { T as TabItem, C as CodeBlock } from './TabItem-cYgu9Uhw.js';
import './index2-CvuFLVuQ.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import 'uuid';
import './RemoteTable-Dy4YtKgc.js';
import './AddFilter-BbVq5aRW.js';
import './OptionsSelectionList-Dlogw0gs.js';
import './Forms-DH01zSCL.js';
import './CopyButton-iVakjEWf.js';
import './Popover-D0sAJhG1.js';
import './html-FW6Ia4bL.js';

class Query {
  categoryFilters;
  numericFilters;
  requiredFields;
  anyRecordOf;
  anyRecordOfMulti;
  fields;
  crossCountFields;
  variantInfoFilters;
  expectedResultType;
  constructor(newQuery) {
    this.categoryFilters = newQuery?.categoryFilters || {};
    this.numericFilters = newQuery?.numericFilters || {};
    this.requiredFields = newQuery?.requiredFields || [];
    this.anyRecordOf = newQuery?.anyRecordOf || [];
    this.anyRecordOfMulti = newQuery?.anyRecordOfMulti || [];
    this.crossCountFields = newQuery?.crossCountFields || void 0;
    this.fields = newQuery?.fields || [];
    const variantInfoFilter = newQuery?.variantInfoFilters?.[0] || {
      categoryVariantInfoFilters: {},
      numericVariantInfoFilters: {}
    };
    this.variantInfoFilters = [variantInfoFilter];
    this.expectedResultType = newQuery?.expectedResultType || "COUNT";
  }
  addCategoryFilter(key, value) {
    this.categoryFilters[key] = value;
  }
  removeCategoryFilter(key) {
    delete this.categoryFilters[key];
  }
  addNumericFilter(key, min, max) {
    this.numericFilters[key] = {
      min: min.toString(),
      max: max.toString()
    };
  }
  addCategoryVariantInfoFilters(filter) {
    this.variantInfoFilters[0].categoryVariantInfoFilters = {
      Gene_with_variant: filter.Gene_with_variant,
      Variant_consequence_calculated: filter.Variant_consequence_calculated,
      Variant_frequency_as_text: filter.Variant_frequency_as_text
    };
  }
  addAnyRecordOfMulti(field) {
    this.anyRecordOfMulti.push(field);
  }
  setCrossCountFields(fields) {
    this.crossCountFields = fields;
  }
  addSnpFilter(snps) {
    snps.forEach((snp) => {
      {
        this.categoryFilters[snp.search] = snp.constraint.split(",");
      }
    });
  }
  addRequiredField(field) {
    this.requiredFields.push(field);
  }
  addField(field) {
    this.fields.push(field);
  }
  addAnyRecordOf(field) {
    this.anyRecordOf.push(field);
  }
  hasGenomicFilter() {
    const Gene_with_variant = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Gene_with_variant?.length || 0;
    const Variant_consequence_calculated = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_consequence_calculated?.length || 0;
    const Variant_frequency_as_text = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_frequency_as_text?.length || 0;
    return Gene_with_variant + Variant_consequence_calculated + Variant_frequency_as_text;
  }
  hasFilter() {
    return Object.keys(this.categoryFilters).length + Object.keys(this.numericFilters).length + this.hasGenomicFilter() + this.requiredFields.length + this.anyRecordOf.length;
  }
}
function getQueryRequest(addConsents = true, resourceUUID = get(resources).hpdsAuth, expectedResultType = "COUNT") {
  let query = new Query();
  get(filters).forEach((filter) => {
    if (filter.filterType === "Categorical") {
      if (filter.displayType === "restrict") {
        query.addCategoryFilter(filter.id, filter.categoryValues);
      } else {
        query.addRequiredField(filter.id);
      }
    } else if (filter.filterType === "numeric") {
      query.addNumericFilter(filter.id, filter.min || "", filter.max || "");
    } else if (filter.filterType === "genomic") {
      query.addCategoryVariantInfoFilters({
        Gene_with_variant: filter.Gene_with_variant,
        Variant_consequence_calculated: filter.Variant_consequence_calculated,
        Variant_frequency_as_text: filter.Variant_frequency_as_text
      });
    } else if (filter.filterType === "snp") {
      query.addSnpFilter(filter.snpValues);
    } else if (filter.filterType === "AnyRecordOf") {
      query.addAnyRecordOfMulti(filter.concepts);
    }
  });
  get(exports).forEach((exportedField) => {
    if (exportedField.conceptPath) {
      query.addField(exportedField.conceptPath);
    }
  });
  query.expectedResultType = expectedResultType;
  return {
    query,
    resourceUUID
  };
}
const stepperState = writable({ current: 0, total: 0, stepMap: [] });
async function createDatasetName(queryId, name) {
  if (name.trim() === "") {
    throw "Please input a Dataset ID name";
  }
  const validName = /^[\w \-\\/?+=[\].():"']+$/g;
  if (!name.match(validName)) {
    throw `Name can only contain letters, numbers, and these special symbols - ? + = [ ] . ( ) : ' "`;
  }
  return await post(Picsure.NamedDataSet, { queryId, name });
}
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
  $$payload.out += `<div${attr_class(`stepper space-y-4 ${stringify(className)}`)} data-testid="stepper">`;
  if (store_get($$store_subs ??= {}, "$stepperState", stepperState).total) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(Array.from(Array(store_get($$store_subs ??= {}, "$stepperState", stepperState).total).keys()));
    $$payload.out += `<header class="stepper-header flex items-center border-t mt-[15px] mb-7 border-surface-500 gap-4"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let step = each_array[$$index];
      $$payload.out += `<div${attr_class("stepper-header-step -mt-[15px] transition-all duration-300", void 0, { "flex-1": isActive(step) })}><span${attr("data-testid", `step-${stringify(store_get($$store_subs ??= {}, "$stepperState", stepperState).stepMap[step])}`)}${attr_class(`badge rounded-2xl text-sm ${stringify(isActive(step) ? "preset-filled-primary-500" : "preset-filled-surface-500")}`)}>${escape_html(isActive(step) ? `Step ${step + 1}` : step + 1)}</span></div>`;
    }
    $$payload.out += `<!--]--></header>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="stepper-content">`;
  children?.($$payload);
  $$payload.out += `<!----></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Step($$payload, $$props) {
  push();
  var $$store_subs;
  const {
    name,
    locked = false,
    header,
    children,
    navigation
  } = $$props;
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
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="step space-y-4"${attr("data-testid", `step-${stringify(stepIndex + 1)}`)}>`;
    if (header) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<header class="step-header text-2xl font-bold">`;
      header($$payload);
      $$payload.out += `<!----></header>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="step-content space-y-4 px-2">`;
    if (children) {
      $$payload.out += "<!--[-->";
      children($$payload);
      $$payload.out += `<!---->`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `(Step ${escape_html(stepIndex + 1)} Content)`;
    }
    $$payload.out += `<!--]--></div> `;
    if (store_get($$store_subs ??= {}, "$stepperState", stepperState2).total > 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="step-navigation flex justify-between gap-4">`;
      if (navigation) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="step-navigation-slot">`;
        navigation($$payload);
        $$payload.out += `<!----></div>`;
      } else if (stepIndex !== 0) {
        $$payload.out += "<!--[1-->";
        AngleButton($$payload, {
          onclick: onBack,
          disabled: store_get($$store_subs ??= {}, "$stepperState", stepperState2).current === 0,
          children: ($$payload2) => {
            $$payload2.out += `<!---->Back`;
          }
        });
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<div></div>`;
      }
      $$payload.out += `<!--]--> `;
      if (stepIndex < store_get($$store_subs ??= {}, "$stepperState", stepperState2).total - 1) {
        $$payload.out += "<!--[-->";
        AngleButton($$payload, {
          name: "next",
          angle: "right",
          variant: "filled",
          color: "primary-500",
          disabled: locked,
          onclick: () => onNext(locked),
          children: ($$payload2) => {
            $$payload2.out += `<!---->Next`;
          }
        });
      } else {
        $$payload.out += "<!--[!-->";
        AngleButton($$payload, {
          name: buttonCompleteLabel || "complete",
          angle: "right",
          variant: "filled",
          color: "primary-500",
          disabled: locked,
          onclick: () => onComplete(stepIndex, locked),
          children: ($$payload2) => {
            $$payload2.out += `<!---->${escape_html(buttonCompleteLabel || "Complete")}`;
          }
        });
      }
      $$payload.out += `<!--]--></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Summary($$payload, $$props) {
  push();
  var $$store_subs;
  let { exports: exports2 } = ExportStore;
  let participantsCount = store_get($$store_subs ??= {}, "$totalParticipants", totalParticipants);
  let variablesCount = store_get($$store_subs ??= {}, "$filters", filters).length + store_get($$store_subs ??= {}, "$exports", exports2).length;
  let dataPoints = typeof participantsCount === "number" ? participantsCount * variablesCount : 0;
  $$payload.out += `<div id="stats" class="w-full flex justify-evenly mb-5 pb-2 svelte-10e6ctx"><div id="summary" class="w-full grid grid-flow-col auto-cols-auto"><div class="text-xl"><label for="summary" class="mr-8 font-bold">Summary:</label></div> <div class="flex justify-left text-xl font-light"><span id="participants" class="mr-2">${escape_html(participantsCount)}</span> <label for="participants">Participants</label></div> <div class="flex justify-left text-xl font-light"><span id="variables" class="mr-2">${escape_html(variablesCount)}</span> <label for="variables">Variables</label></div> <div class="flex justify-left text-xl font-light"><span id="dataPoints" class="mr-2">${escape_html(dataPoints)}</span> <label for="dataPoints">Data Points</label></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ExportStepper($$payload, $$props) {
  push();
  var $$store_subs;
  const { query, showTreeStep = false, rows = [] } = $$props;
  let activeRows = rows;
  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1e6;
  const PROMISE_WAIT_INTERVAL = 7;
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
  let activeType = void 0;
  let statusPromise = Promise.resolve();
  let preparePromise = Promise.resolve();
  let datasetIdPromise = Promise.resolve();
  let saveDatasetPromise = Promise.resolve();
  let datasetNameInput = "";
  let picsureResultId = "";
  let lockDownload = true;
  let sampleIds = false;
  let tabSet = "Python";
  let modalOpen = false;
  let datasetId = "";
  let processingMessage = "";
  let exportLoading = false;
  async function download() {
    try {
      const res = await post(`${Picsure.Query}/${datasetId}/result`, {});
      const responseDataUrl = URL.createObjectURL(new Blob([res], { type: "octet/stream" }));
      if (browser) ;
    } catch (error) {
      console.error("Error in onCompleteHandler", error);
    }
  }
  async function onNextHandler(_step, stepName) {
    if (stepName === "review") return;
    if (stepName === "save-dataset") {
      preparePromise = submitQuery();
    }
    if (stepName === "start") {
      saveDatasetPromise = createDatasetName(datasetId, datasetNameInput).then((data) => {
        statusPromise = checkExportStatus(picsureResultId);
        return data;
      });
    }
  }
  async function submitQuery() {
    let interval;
    const statetext = {
      initial: "Creating dataset ID...",
      waiting: "Hang tight. We are still working on it...",
      retry: "Something's taking longer than usual. We are still working on it..."
    };
    function requestUpdate(method, retry = true) {
      processingMessage = retry ? statetext.initial : statetext.retry;
      if (retry) {
        interval = setInterval(
          () => {
            processingMessage = statetext.waiting;
          },
          PROMISE_WAIT_INTERVAL * 1e3
        );
      }
      datasetIdPromise = method().finally(() => clearInterval(interval)).catch((err) => {
        if (retry) {
          requestUpdate(method, false);
        } else {
          throw err;
        }
      });
    }
    try {
      query.query.fields = store_get($$store_subs ??= {}, "$exports", exports).map((exp) => exp.conceptPath);
      query.query.expectedResultType = activeType || "DATAFRAME";
      datasetId = "";
      requestUpdate(() => post(Picsure.Query, query).then((res) => {
        datasetId = res.picsureResultId || "Error";
      }));
      await datasetIdPromise;
    } catch (error) {
      store_get($$store_subs ??= {}, "$stepperState", stepperState).current--;
      console.error("Error in submitQuery", error);
      throw error;
    }
  }
  function checkExportStatus(lastPicsureResultId) {
    const statusId = lastPicsureResultId || datasetId;
    return post(`${Picsure.Query}/${statusId}/status`, query).then((res) => {
      if (res.status === "ERROR") {
        lockDownload = true;
        return Promise.reject(res.status);
      }
      picsureResultId = res.picsureResultId;
      lockDownload = false;
    });
  }
  function onComplete() {
    goto();
  }
  function dataLimitExceeded() {
    let participantCount = typeof store_get($$store_subs ??= {}, "$totalParticipants", totalParticipants) === "number" ? store_get($$store_subs ??= {}, "$totalParticipants", totalParticipants) : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints = participantCount + store_get($$store_subs ??= {}, "$filters", filters).length + store_get($$store_subs ??= {}, "$exports", exports).length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
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
        $$payload3.out += `<!---->${escape_html(branding.explorePage.confirmDownloadMessage || "This action will download the data to your local machine. Are you sure you want to proceed?")}`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> `;
    Stepper($$payload2, {
      class: "w-full h-full m-8",
      oncomplete: onComplete,
      onnext: onNextHandler,
      buttonCompleteLabel: "Done",
      children: ($$payload3) => {
        {
          let header = function($$payload4) {
            $$payload4.out += `<!---->Review Cohort Details:`;
          };
          Step($$payload3, {
            name: "review",
            locked: dataLimitExceeded(),
            header,
            children: ($$payload4) => {
              $$payload4.out += `<div id="first-step-container" class="flex flex-col w-full h-full items-center">`;
              Summary($$payload4);
              $$payload4.out += `<!----> <section class="w-full">`;
              if (dataLimitExceeded()) {
                $$payload4.out += "<!--[-->";
                ErrorAlert($$payload4, {
                  "data-testid": "landing-error",
                  title: "Warning",
                  color: "warning",
                  closeText: "Back",
                  onclose: onComplete,
                  children: ($$payload5) => {
                    $$payload5.out += `<!---->Warning: Your selected data exceeds 1,000,000 estimated data points, which is too large
            to export. Please reduce the data selection or the number of selected participants.`;
                  }
                });
              } else {
                $$payload4.out += "<!--[!-->";
                await_block(
                  $$payload4,
                  preparePromise,
                  () => {
                    Loading($$payload4, { ring: true, label: "Preparing" });
                  },
                  () => {
                  }
                );
                $$payload4.out += `<!--]--> `;
                {
                  $$payload4.out += "<!--[-->";
                  StaticTable($$payload4, {
                    tableName: "ExportSummary",
                    data: activeRows,
                    columns
                  });
                  $$payload4.out += `<!----> `;
                  if (features.explorer.enableSampleIdCheckbox) {
                    $$payload4.out += "<!--[-->";
                    $$payload4.out += `<div><label for="sample-ids-checkbox" class="flex items-center" data-testid="sample-ids-label">`;
                    {
                      $$payload4.out += "<!--[!-->";
                      $$payload4.out += `<input type="checkbox" class="mr-1 &amp;[aria-disabled=“true”]:opacity-75" data-testid="sample-ids-checkbox" id="sample-ids-checkbox"${attr("checked", sampleIds, true)}/>`;
                    }
                    $$payload4.out += `<!--]--> <span>Include sample identifiers</span></label></div>`;
                  } else {
                    $$payload4.out += "<!--[!-->";
                  }
                  $$payload4.out += `<!--]-->`;
                }
                $$payload4.out += `<!--]-->`;
              }
              $$payload4.out += `<!--]--></section></div>`;
            }
          });
        }
        $$payload3.out += `<!----> `;
        if (showTreeStep) {
          $$payload3.out += "<!--[-->";
          {
            let header = function($$payload4) {
              $$payload4.out += `<!---->Finalize Data:`;
            };
            Step($$payload3, {
              name: "select-variables",
              header,
              children: ($$payload4) => {
                $$payload4.out += `<section class="flex flex-col w-full h-full items-center">`;
                Summary($$payload4);
                $$payload4.out += `<!----> <div class="w-full h-full m-2 card p-4"><header class="card-header">Select <strong>additional variables</strong> you would like to be included in your final
            data export.</header> <hr/> <div class="card-body p-4">Tree Component Here</div></div></section>`;
              }
            });
          }
        } else {
          $$payload3.out += "<!--[!-->";
        }
        $$payload3.out += `<!--]--> `;
        if (features.explorer.enablePfbExport) {
          $$payload3.out += "<!--[-->";
          {
            let header = function($$payload4) {
              $$payload4.out += `<!---->Review and Save Dataset:`;
            };
            Step($$payload3, {
              name: "select-type",
              locked: activeType === void 0,
              header,
              children: ($$payload4) => {
                $$payload4.out += `<section class="flex flex-col w-full h-full items-center">`;
                Summary($$payload4);
                $$payload4.out += `<!----> <div class="grid gap-10 grid-cols-2">`;
                CardButton($$payload4, {
                  "data-testid": "csv-export-option",
                  title: "Export as Data Frame or CSV",
                  subtitle: "Export data as a Python or R data frame or a comma-separated values file",
                  size: "other",
                  active: activeType === "DATAFRAME",
                  onclick: () => activeType = "DATAFRAME"
                });
                $$payload4.out += `<!----> `;
                CardButton($$payload4, {
                  "data-testid": "pfb-export-option",
                  title: "Export as PFB",
                  subtitle: "Export data in Portable Format for Biomedical Data file format",
                  size: "other",
                  active: activeType === "DATAFRAME_PFB",
                  onclick: () => activeType = "DATAFRAME_PFB"
                });
                $$payload4.out += `<!----></div></section>`;
              }
            });
          }
        } else {
          $$payload3.out += "<!--[!-->";
        }
        $$payload3.out += `<!--]--> `;
        {
          let header = function($$payload4) {
            $$payload4.out += `<!---->Save Dataset ID:`;
          };
          Step($$payload3, {
            name: "save-dataset",
            locked: true,
            header,
            children: ($$payload4) => {
              $$payload4.out += `<section class="flex flex-col w-full h-full items-center">`;
              Summary($$payload4);
              $$payload4.out += `<!----> <div class="w-full h-full m-2 card p-4"><header class="card-header">Save the information in your final data export by clicking the Save Dataset ID button.
          Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or manage
          your Dataset IDs.</header> <hr/> <div class="card-body p-4 flex flex-col justify-center items-center"><div><div class="flex items-center m-2"><label for="dataset-name" class="font-bold mr-2">Dataset Name:</label> <input type="text" id="dataset-name" class="input w-80" placeholder="Enter a name"${attr("value", datasetNameInput)} required/></div> <div class="flex items-center m-2"><div class="flex items-center"><label for="dataset-id" class="font-bold mr-2">Dataset ID:</label> `;
              await_block(
                $$payload4,
                datasetIdPromise,
                () => {
                  Loading($$payload4, {
                    ring: true,
                    size: "micro",
                    label: processingMessage
                  });
                },
                () => {
                  $$payload4.out += `<div id="dataset-id" class="mr-4">${escape_html(datasetId)}</div>`;
                }
              );
              $$payload4.out += `<!--]--></div></div></div></div></div></section>`;
            }
          });
        }
        $$payload3.out += `<!----> `;
        {
          let header = function($$payload4) {
            $$payload4.out += `<!---->Start Analysis:`;
          };
          Step($$payload3, {
            name: "start",
            locked: lockDownload,
            header,
            children: ($$payload4) => {
              $$payload4.out += `<section class="flex flex-col w-full h-full items-center">`;
              await_block(
                $$payload4,
                saveDatasetPromise,
                () => {
                  Loading($$payload4, { ring: true, size: "medium", label: "Saving" });
                },
                () => {
                  $$payload4.out += `<div class="flex justify-center">`;
                  await_block(
                    $$payload4,
                    statusPromise,
                    () => {
                      Loading($$payload4, {
                        ring: true,
                        size: "medium",
                        label: "Preparing"
                      });
                    },
                    () => {
                      if (query.query.expectedResultType === "DATAFRAME") {
                        $$payload4.out += "<!--[-->";
                        $$payload4.out += `<section class="flex flex-col gap-8"><p class="mt-4">${escape_html(branding.explorePage.analysisExportText)}</p> `;
                        {
                          let list = function($$payload5) {
                            TabItem($$payload5, {
                              value: "Python",
                              get group() {
                                return tabSet;
                              },
                              set group($$value) {
                                tabSet = $$value;
                                $$settled = false;
                              },
                              children: ($$payload6) => {
                                $$payload6.out += `<!---->Python`;
                              },
                              $$slots: { default: true }
                            });
                            $$payload5.out += `<!----> `;
                            TabItem($$payload5, {
                              value: "R",
                              get group() {
                                return tabSet;
                              },
                              set group($$value) {
                                tabSet = $$value;
                                $$settled = false;
                              },
                              children: ($$payload6) => {
                                $$payload6.out += `<!---->R`;
                              },
                              $$slots: { default: true }
                            });
                            $$payload5.out += `<!----> `;
                            if (features.explorer.allowDownload) {
                              $$payload5.out += "<!--[-->";
                              TabItem($$payload5, {
                                value: "Download",
                                get group() {
                                  return tabSet;
                                },
                                set group($$value) {
                                  tabSet = $$value;
                                  $$settled = false;
                                },
                                children: ($$payload6) => {
                                  $$payload6.out += `<!---->Download`;
                                },
                                $$slots: { default: true }
                              });
                            } else {
                              $$payload5.out += "<!--[!-->";
                            }
                            $$payload5.out += `<!--]-->`;
                          }, content = function($$payload5) {
                            $$payload5.out += `<!---->`;
                            Tabs.Panel($$payload5, {
                              value: "Python",
                              children: ($$payload6) => {
                                CodeBlock($$payload6, {
                                  lang: "python",
                                  code: branding.explorePage.codeBlocks.PythonExport.replace("{{queryId}}", datasetId) || "Code not set"
                                });
                              },
                              $$slots: { default: true }
                            });
                            $$payload5.out += `<!----> <!---->`;
                            Tabs.Panel($$payload5, {
                              value: "R",
                              children: ($$payload6) => {
                                CodeBlock($$payload6, {
                                  lang: "r",
                                  code: branding.explorePage.codeBlocks.RExport.replace("{{queryId}}", datasetId) || "Code not set"
                                });
                              },
                              $$slots: { default: true }
                            });
                            $$payload5.out += `<!----> `;
                            if (features.explorer.allowDownload) {
                              $$payload5.out += "<!--[-->";
                              $$payload5.out += `<!---->`;
                              Tabs.Panel($$payload5, {
                                value: "Download",
                                children: ($$payload6) => {
                                  $$payload6.out += `<button class="btn preset-filled-primary-500"><i class="fa-solid fa-download mr-1"></i>Download as CSV</button>`;
                                },
                                $$slots: { default: true }
                              });
                              $$payload5.out += `<!---->`;
                            } else {
                              $$payload5.out += "<!--[!-->";
                            }
                            $$payload5.out += `<!--]-->`;
                          };
                          Tabs($$payload4, {
                            value: tabSet,
                            onValueChange: (e) => tabSet = e.value,
                            list,
                            content,
                            $$slots: { list: true, content: true }
                          });
                        }
                        $$payload4.out += `<!----> <p>${escape_html(branding.explorePage.goTo.instructions)}</p> <div class="flex justify-center">`;
                        UserToken($$payload4);
                        $$payload4.out += `<!----></div> `;
                        if (branding.explorePage.goTo.links.length > 0) {
                          $$payload4.out += "<!--[-->";
                          const each_array = ensure_array_like(branding.explorePage.goTo.links);
                          $$payload4.out += `<div class="flex justify-center"><!--[-->`;
                          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                            let link = each_array[$$index];
                            $$payload4.out += `<a class="btn preset-tonal-primary border border-primary-500 m-2 hover:preset-filled-primary-500"${attr("href", link.url)}${attr("target", link.newTab ? "_blank" : "_self")}>${escape_html(link.title)}</a>`;
                          }
                          $$payload4.out += `<!--]--></div>`;
                        } else {
                          $$payload4.out += "<!--[!-->";
                        }
                        $$payload4.out += `<!--]--></section>`;
                      } else if (query.query.expectedResultType === "DATAFRAME_PFB" && features.explorer.enablePfbExport) {
                        $$payload4.out += "<!--[1-->";
                        $$payload4.out += `<section class="flex flex-col gap-8 place-items-center"><div class="flex justify-center mt-4">Select an option below to export your selected data in PFB format.</div> `;
                        if (branding.explorePage?.pfbExportUrls && branding.explorePage.pfbExportUrls.length > 0) {
                          $$payload4.out += "<!--[-->";
                          const each_array_1 = ensure_array_like(branding.explorePage.pfbExportUrls);
                          $$payload4.out += `<!--[-->`;
                          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                            let exportLink = each_array_1[$$index_1];
                            $$payload4.out += `<button${attr("disabled", exportLoading, true)} class="flex-initial w-64 btn preset-filled-primary-500 disabled:preset-tonal-primary border border-primary-500"><i class="fa-solid fa-arrow-up-right-from-square"></i>Export to ${escape_html(exportLink.title)}</button>`;
                          }
                          $$payload4.out += `<!--]-->`;
                        } else {
                          $$payload4.out += "<!--[!-->";
                        }
                        $$payload4.out += `<!--]--> <button class="flex-initial w-64 btn preset-filled-primary-500"><i class="fa-solid fa-download"></i>Download as PFB</button></section>`;
                      } else {
                        $$payload4.out += "<!--[!-->";
                      }
                      $$payload4.out += `<!--]-->`;
                    }
                  );
                  $$payload4.out += `<!--]--></div>`;
                }
              );
              $$payload4.out += `<!--]--></section>`;
            }
          });
        }
        $$payload3.out += `<!---->`;
      }
    });
    $$payload2.out += `<!---->`;
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
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let { exports: exports2 } = ExportStore;
  let queryRequest = getQueryRequest(true);
  let exportRows = store_get($$store_subs ??= {}, "$exports", exports2).map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.conceptPath,
      variableName: exp.display || exp.searchResult?.display || exp.searchResult?.name,
      description: exp.searchResult?.description,
      type: exp.searchResult?.type
    };
  });
  let filterRows = store_get($$store_subs ??= {}, "$filters", filters).map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      variableName: filter.searchResult?.display || filter.variableName,
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
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<section class="flex justify-center items-center w-full h-full mt-8">`;
        ExportStepper($$payload2, {
          query: queryRequest,
          rows: [...filterRows, ...exportRows]
        });
        $$payload2.out += `<!----></section>`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `<div class="flex flex-col items-center justify-center m-8"><p>No filters or exports have been created.</p> <div class="flex gap-4"><button class="btn preset-filled-primary-500 m-4">Learn How</button></div></div>`;
      }
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DQQkkw3f.js.map
