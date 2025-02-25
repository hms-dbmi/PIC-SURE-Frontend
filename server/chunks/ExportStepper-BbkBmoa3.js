import { a as subscribe, l as is_promise, n as noop, s as setContext, k as createEventDispatcher, f as getContext, q as set_store_value, o as onDestroy, m as compute_slots } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component, a as add_attribute, e as escape, b as each } from './ssr-BRJpAXVH.js';
import './index-CvuFLVuQ.js';
import './User-DpPjP5W7.js';
import './client-BR749xJD.js';
import { w as writable } from './index2-BVONNh3m.js';
import { A as AngleButton } from './AngleButton-C6YzBYNH.js';
import { T as Table } from './Table-BKmcVPFT.js';
import { E as ExportStore } from './Export-Bnz6Pnjy.js';
import { f as filters, t as totalParticipants } from './Filter-DQ4J7bUR.js';
import { U as UserToken } from './UserToken-C1wwCOoa.js';
import { C as CopyButton } from './CopyButton-BtLZ49Iw.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import { T as TabGroup, C as CodeBlock, c as codeBlocks, a as Tab } from './codeBlocks-D7Bb9quT.js';
import { C as CardButton } from './CardButton-BunBsA3_.js';
import { f as features, s as settings } from './configuration-JjhNHhnG.js';

const state = writable({ current: 0, total: 0 });
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
    dispatch("next", { step: $state.current, state: $state });
    set_store_value(state, $state.current++, $state);
  }
  function onBack() {
    dispatch("back", { step: $state.current, state: $state });
    set_store_value(state, $state.current = $state.current === 1 ? 0 : $state.current - 1, $state);
  }
  function onComplete(stepIndex, locked) {
    if (locked) return;
    dispatch("complete", { step: stepIndex, state: $state });
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
    ].join(" ").trim()}"><span class="${"badge text-sm " + escape(
      isActive(step) ? "variant-filled-primary" : "variant-filled-surface",
      true
    )}">${escape(isActive(step) ? `Step ${step + 1}` : step + 1)}</span> </div>`;
  })}</header>` : ``} <div class="stepper-content">${slots.default ? slots.default({}) : ``}</div></div>`;
});
const Step = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$slots = compute_slots(slots);
  let $state, $$unsubscribe_state;
  let { locked = false } = $$props;
  let { buttonCompleteLabel = getContext("buttonCompleteLabel") } = $$props;
  let { state: state2 = getContext("state") } = $$props;
  $$unsubscribe_state = subscribe(state2, (value) => $state = value);
  let { onNext = getContext("onNext") } = $$props;
  let { onBack = getContext("onBack") } = $$props;
  let { onComplete = getContext("onComplete") } = $$props;
  const stepIndex = $state.total;
  set_store_value(state2, $state.total++, $state);
  onDestroy(() => {
    set_store_value(state2, $state.total--, $state);
  });
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
const css$1 = {
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
  let { exports } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
  $$result.css.add(css$1);
  participantsCount = $totalParticipants;
  variablesCount = $filters.length + $exports.length;
  dataPoints = typeof participantsCount === "number" ? participantsCount * variablesCount : 0;
  $$unsubscribe_exports();
  $$unsubscribe_filters();
  $$unsubscribe_totalParticipants();
  return `<div id="stats" class="w-full flex justify-evenly mb-5 pb-2 svelte-11yjabd"><div id="summary" class="w-full grid grid-flow-col auto-cols-auto"><div class="text-xl" data-svelte-h="svelte-1vd72fa"><label for="summary" class="mr-8 font-bold">Summary:</label></div> <div class="flex justify-left text-xl font-light"><span id="participants" class="mr-2">${escape(participantsCount)}</span> <label for="participants" data-svelte-h="svelte-1te5h4m">Participants</label></div> <div class="flex justify-left text-xl font-light"><span id="variables" class="mr-2">${escape(variablesCount)}</span> <label for="variables" data-svelte-h="svelte-j0nyhs">Variables</label></div> <div class="flex justify-left text-xl font-light"><span id="dataPoints" class="mr-2">${escape(dataPoints)}</span> <label for="dataPoints" data-svelte-h="svelte-kgfncs">Data Points</label></div></div> </div>`;
});
const css = {
  code: "input[type='text'].svelte-1jplhoe{border-radius:var(--theme-rounded-base)}",
  map: `{"version":3,"file":"ExportStepper.svelte","sources":["ExportStepper.svelte"],"sourcesContent":["<script lang=\\"ts\\">import * as api from \\"$lib/api\\";\\nimport { v4 as uuidv4 } from \\"uuid\\";\\nimport { browser } from \\"$app/environment\\";\\nimport Stepper from \\"$lib/components/steppers/horizontal/Stepper.svelte\\";\\nimport Step from \\"$lib/components/steppers/horizontal/Step.svelte\\";\\nimport Datatable from \\"$lib/components/datatable/Table.svelte\\";\\nimport Summary from \\"./Summary.svelte\\";\\nimport UserToken from \\"$lib/components/UserToken.svelte\\";\\nimport CopyButton from \\"$lib/components/buttons/CopyButton.svelte\\";\\nimport { CodeBlock, ProgressRadial, Tab, TabGroup } from \\"@skeletonlabs/skeleton\\";\\nimport ErrorAlert from \\"$lib/components/ErrorAlert.svelte\\";\\nimport ExportStore from \\"$lib/stores/Export\\";\\nimport { filters, totalParticipants } from \\"$lib/stores/Filter\\";\\nlet { exports, addExports, removeExports } = ExportStore;\\nimport { state } from \\"$lib/stores/Stepper\\";\\nimport { goto } from \\"$app/navigation\\";\\nimport {} from \\"$lib/models/Dataset\\";\\nimport { createDatasetName } from \\"$lib/services/datasets\\";\\nimport CardButton from \\"$lib/components/buttons/CardButton.svelte\\";\\nimport { Query } from \\"$lib/models/query/Query.ts\\";\\nimport codeBlocks from \\"$lib/assets/codeBlocks.json\\";\\nimport { getModalStore, getToastStore } from \\"@skeletonlabs/skeleton\\";\\nimport Confirmation from \\"$lib/components/modals/Confirmation.svelte\\";\\nimport { branding, features, settings, resources } from \\"$lib/configuration\\";\\nimport { searchDictionary } from \\"$lib/services/dictionary\\";\\nimport { onMount } from \\"svelte\\";\\nexport let query;\\nexport let showTreeStep = false;\\nexport let rows = [];\\nconst modalStore = getModalStore();\\nconst toastStore = getToastStore();\\nlet statusPromise;\\nlet preparePromise;\\nlet datasetNameInput = \\"\\";\\nlet picsureResultId = \\"\\";\\nlet lockDownload = true;\\nlet error = \\"\\";\\nlet sampleIds = false;\\nlet lastExports = [];\\nlet loadingSampleIds = false;\\nlet checkingSampleIds = false;\\n$: datasetId = \\"\\";\\n$: canDownload = true;\\n$: apiExport = false;\\nconst columns = [\\n  { dataElement: \\"variableName\\", label: \\"Variable Name\\", sort: true },\\n  { dataElement: \\"description\\", label: \\"Variable Description\\", sort: true },\\n  { dataElement: \\"type\\", label: \\"Type\\", sort: true }\\n];\\nonMount(async () => {\\n  const exportedSampleIds = $exports.filter((e) => e.conceptPath.includes(\\"SAMPLE_ID\\"));\\n  if (exportedSampleIds.length > 0) {\\n    checkingSampleIds = true;\\n    const genomicConcepts = await getGenomicConcepts();\\n    if (genomicConcepts.length > 0) {\\n      const matchingSampleIds = exportedSampleIds.filter((sampleId) => genomicConcepts.some((concept) => concept.conceptPath === sampleId.conceptPath));\\n      sampleIds = matchingSampleIds.length === genomicConcepts.length;\\n      checkingSampleIds = false;\\n      if (sampleIds) {\\n        lastExports = matchingSampleIds.map((item) => ({\\n          ref: item,\\n          variableId: item.conceptPath,\\n          variableName: item.display,\\n          description: item.searchResult?.description,\\n          type: item.searchResult?.type,\\n          selected: true\\n        }));\\n      }\\n    } else {\\n      sampleIds = false;\\n      checkingSampleIds = false;\\n    }\\n  } else {\\n    sampleIds = false;\\n  }\\n});\\nconst MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1e6;\\nfunction openConfirmationModal() {\\n  const onConfirm = async () => {\\n    await download();\\n    modalStore.close();\\n  };\\n  const onCancel = () => {\\n    modalStore.close();\\n  };\\n  const modal = {\\n    type: \\"component\\",\\n    title: branding.explorePage.confirmDownloadTitle || \\"Are you sure you want to download data?\\",\\n    component: \\"modalWrapper\\",\\n    modalClasses: \\"bg-surface-100-800-token p-4 block\\",\\n    meta: {\\n      component: Confirmation,\\n      message: branding.explorePage.confirmDownloadMessage || \\"This action will download the data to your local machine. Are you sure you want to proceed?\\",\\n      onConfirm,\\n      onCancel,\\n      confirmText: \\"Download\\"\\n    },\\n    response: (r) => {\\n      console.log(r);\\n    }\\n  };\\n  modalStore.trigger(modal);\\n}\\nasync function download() {\\n  try {\\n    const res = await api.post(\`picsure/query/\${datasetId}/result\`, {});\\n    const responseDataUrl = URL.createObjectURL(new Blob([res], { type: \\"octet/stream\\" }));\\n    if (browser) {\\n      const link = document.createElement(\\"a\\");\\n      link.href = responseDataUrl;\\n      if (query.query.expectedResultType === \\"DATAFRAME\\") {\\n        link.download = \\"pic-sure-data.csv\\";\\n      } else if (query.query.expectedResultType === \\"DATAFRAME_PFB\\") {\\n        link.download = \\"pic-sure-data.avro\\";\\n      }\\n      document.body.appendChild(link);\\n      link.click();\\n      document.body.removeChild(link);\\n    }\\n  } catch (error2) {\\n    console.error(\\"Error in onCompleteHandler\\", error2);\\n  }\\n}\\nfunction onNextHandler(e) {\\n  if (e.detail.step === 0 && !showTreeStep) {\\n    return;\\n  }\\n  if (e.detail.step === 1 && showTreeStep) {\\n  } else if (e.detail.step === 1 && !showTreeStep || showTreeStep && e.detail.step === 2) {\\n    preparePromise = submitQuery();\\n  } else if (e.detail.step === 2 && !showTreeStep || showTreeStep && e.detail.step === 3) {\\n    createNamedDataset();\\n  }\\n  if (e.detail.state.total - 1 === e.detail.step + 1) {\\n    statusPromise = new Promise((resolve, reject) => {\\n      const interval = setInterval(async () => {\\n        const status = await checkExportStatus(picsureResultId);\\n        if (status === \\"ERROR\\") {\\n          lockDownload = true;\\n          clearInterval(interval);\\n          reject(status);\\n        } else if (![\\"PENDING\\", \\"RUNNING\\", \\"QUEUED\\"].includes(status)) {\\n          lockDownload = false;\\n          clearInterval(interval);\\n          resolve(status);\\n        }\\n      }, 2e3);\\n    });\\n  }\\n}\\nfunction onStepHandler(e) {\\n  console.log(\\"event:next\\", e);\\n}\\nfunction onBackHandler(e) {\\n  error = \\"\\";\\n  console.log(\\"event:next\\", e);\\n}\\nasync function submitQuery() {\\n  try {\\n    query.query.fields = $exports.map((exp) => exp.conceptPath);\\n    const res = await api.post(\\"picsure/query\\", query);\\n    datasetId = res.picsureResultId;\\n  } catch (error2) {\\n    $state.current--;\\n    console.error(\\"Error in handleFirstStep\\", error2);\\n    throw error2;\\n  }\\n}\\nasync function createNamedDataset() {\\n  try {\\n    await createDatasetName(datasetId, datasetNameInput);\\n  } catch (err) {\\n    if (err instanceof Object) {\\n      const errObj = err;\\n      error = errObj?.message?.message || \\"Error Creating Named Dataset\\";\\n    } else {\\n      error = String(err) || \\"Error Creating Named Dataset\\";\\n    }\\n    $state.current--;\\n    console.error(\\"Error in createNamedDataset\\", err);\\n  }\\n}\\nasync function checkExportStatus(lastPicsureResultId) {\\n  let statusId = lastPicsureResultId ? lastPicsureResultId : datasetId;\\n  const path = \\"picsure/query/\\" + statusId + \\"/status\\";\\n  try {\\n    const res = await api.post(path, query);\\n    picsureResultId = res.picsureResultId;\\n    return res.status;\\n  } catch (error2) {\\n    console.error(\\"Error in checkExportStatus\\", error2);\\n  }\\n  return \\"ERROR\\";\\n}\\nasync function getSignedUrl() {\\n  const path = \\"picsure/query/\\" + datasetId + \\"/signed-url\\";\\n  try {\\n    const res = await api.post(path, query);\\n    return res.signedUrl;\\n  } catch (error2) {\\n    console.error(\\"Error in getSignedUrl\\", error2);\\n  }\\n}\\nexport let activeType;\\nfunction selectExportType(exportType) {\\n  query.query.expectedResultType = exportType;\\n  activeType = exportType;\\n}\\nfunction onComplete() {\\n  goto(\\"/explorer\\");\\n}\\nlet tabSet = 0;\\n$: exportLoading = false;\\nfunction dataLimitExceeded() {\\n  let participantCount = typeof $totalParticipants === \\"number\\" ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;\\n  let totalDataPoints = participantCount + $filters.length + $exports.length;\\n  return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;\\n}\\nasync function getGenomicConcepts() {\\n  const concepts = await searchDictionary(\\"\\", [\\n    {\\n      name: \\"data_source_genomic\\",\\n      category: \\"data_source\\",\\n      display: \\"Genomic\\",\\n      description: \\"Associated with genomic data\\",\\n      count: 0\\n    }\\n  ], { pageNumber: 0, pageSize: 1e4 });\\n  if (concepts.content.length === 0) {\\n    return [];\\n  }\\n  const crossCountQuery = new Query(structuredClone(query.query));\\n  crossCountQuery.expectedResultType = \\"CROSS_COUNT\\";\\n  const crossCountFields = concepts.content.map((concept) => concept.conceptPath);\\n  crossCountQuery.setCrossCountFields(crossCountFields);\\n  const crossCountResponse = await api.post(\\"picsure/query/sync\\", {\\n    query: crossCountQuery,\\n    resourceUUID: resources.hpds\\n  });\\n  return concepts.content.filter((concept) => crossCountResponse[concept.conceptPath] > 0);\\n}\\nasync function toggleSampleIds() {\\n  try {\\n    loadingSampleIds = true;\\n    if (!sampleIds) {\\n      const exportsToRemove = lastExports?.map((e) => e.ref);\\n      removeExports(exportsToRemove || []);\\n      rows = rows.filter((r) => !lastExports.some((le) => le.variableId === r.variableId));\\n      return;\\n    }\\n    const genomicConcepts = await getGenomicConcepts();\\n    const newExports = genomicConcepts.map((concept) => ({\\n      id: uuidv4(),\\n      searchResult: concept,\\n      display: concept?.display || \\"\\",\\n      conceptPath: concept?.conceptPath || \\"\\"\\n    }));\\n    addExports(newExports);\\n    const newRows = newExports.map((e) => ({\\n      ref: e,\\n      variableId: e?.searchResult?.conceptPath,\\n      variableName: e?.display,\\n      description: e?.searchResult?.description,\\n      type: e?.searchResult?.type,\\n      selected: true\\n    }));\\n    rows = Array.from([...rows, ...newRows].reduce((map, row) => map.set(row.variableId, row), /* @__PURE__ */ new Map()).values());\\n    lastExports = newRows;\\n  } catch (error2) {\\n    console.error(\\"Error in toggleSampleIds\\", error2);\\n    toastStore.trigger({\\n      message: \\"We were unable to fetch the sample IDs for your selected data. Please try again later.\\",\\n      background: \\"variant-ghost-error\\"\\n    });\\n    sampleIds = false;\\n  } finally {\\n    loadingSampleIds = false;\\n  }\\n}\\nasync function exportToTerra() {\\n  exportLoading = true;\\n  let signedUrl = await getSignedUrl();\\n  window.open(\\"https://terra.biodatacatalyst.nhlbi.nih.gov/#import-data?format=pfb&url=\\" + encodeURIComponent(signedUrl));\\n  exportLoading = false;\\n}\\n<\/script>\\n\\n<Stepper\\n  class=\\"w-full h-full m-8\\"\\n  on:complete={onComplete}\\n  on:next={onNextHandler}\\n  on:step={onStepHandler}\\n  on:back={onBackHandler}\\n  buttonCompleteLabel=\\"Done\\"\\n>\\n  <Step locked={dataLimitExceeded()}>\\n    <svelte:fragment slot=\\"header\\">Review Cohort Details:</svelte:fragment>\\n    <div id=\\"first-step-container\\" class=\\"flex flex-col w-full h-full items-center\\">\\n      <Summary />\\n      <section class=\\"w-full\\">\\n        {#if dataLimitExceeded()}\\n          <aside class=\\"alert variant-filled-error\\">\\n            <div><i class=\\"fa-solid fa-triangle-exclamation text-4xl\\"></i></div>\\n            <div class=\\"alert-message\\">\\n              <h3 class=\\"h3\\">Warning</h3>\\n              <p>\\n                Warning: Your selected data exceeds 1,000,000 estimated data points, which is too\\n                large to export. Please reduce the data selection or the number of selected\\n                participants.\\n              </p>\\n            </div>\\n            <div class=\\"alert-actions dark\\">\\n              <button class=\\"btn variant-filled\\" on:click={() => onComplete()}>Back</button>\\n            </div>\\n          </aside>\\n        {:else}\\n          {#await preparePromise}\\n            <ProgressRadial width=\\"w-4\\" />\\n            <div>Preparing your dataset...</div>\\n          {:catch}\\n            <div class=\\"flex justify-center mb-4\\">\\n              <ErrorAlert\\n                title=\\"An error occurred while preparing your dataset. Please try again. If this problem persists, please\\n                  contact an administrator.\\"\\n              />\\n            </div>\\n          {/await}\\n          {#if !loadingSampleIds}\\n            <Datatable tableName=\\"ExportSummary\\" data={rows} {columns} />\\n            {#if features.explorer.enableSampleIdCheckbox}\\n              <div>\\n                <label\\n                  for=\\"sample-ids-checkbox\\"\\n                  class=\\"flex items-center\\"\\n                  data-testid=\\"sample-ids-label\\"\\n                >\\n                  {#if checkingSampleIds}\\n                    <ProgressRadial width=\\"w-4\\" />\\n                  {:else}\\n                    <input\\n                      type=\\"checkbox\\"\\n                      class=\\"mr-1 &[aria-disabled=“true”]:opacity-75\\"\\n                      data-testid=\\"sample-ids-checkbox\\"\\n                      id=\\"sample-ids-checkbox\\"\\n                      bind:checked={sampleIds}\\n                      on:change={toggleSampleIds}\\n                    />\\n                  {/if}\\n                  <span>Include sample identifiers</span>\\n                </label>\\n              </div>\\n            {/if}\\n          {:else}\\n            <div class=\\"flex justify-center items-center\\">\\n              <ProgressRadial width=\\"w-4\\" />\\n              <div>Loading sample IDs...</div>\\n            </div>\\n          {/if}\\n        {/if}\\n      </section>\\n    </div>\\n  </Step>\\n  {#if showTreeStep}\\n    <Step>\\n      <svelte:fragment slot=\\"header\\">Finalize Data:</svelte:fragment>\\n      <section class=\\"flex flex-col w-full h-full items-center\\">\\n        <Summary />\\n        <div class=\\"w-full h-full m-2 card p-4\\">\\n          <header class=\\"card-header\\">\\n            Select <strong>additional variables</strong> you would like to be included in your final\\n            data export.\\n          </header>\\n          <hr />\\n          <div class=\\"card-body p-4\\">Tree Component Here</div>\\n        </div>\\n      </section>\\n    </Step>\\n  {/if}\\n  <Step locked={activeType === undefined}>\\n    <svelte:fragment slot=\\"header\\">Review and Save Dataset:</svelte:fragment>\\n    <section class=\\"flex flex-col w-full h-full items-center\\">\\n      <Summary />\\n      <div class=\\"grid gap-10 grid-cols-2\\">\\n        <CardButton\\n          data-testid=\\"csv-export-option\\"\\n          title=\\"Export as Data Frame or CSV\\"\\n          subtitle=\\"Export data as a Python or R data frame or a comma-separated values file\\"\\n          size=\\"other\\"\\n          class=\\"card variant-ringed-primary\\"\\n          active={activeType === 'DATAFRAME'}\\n          on:click={() => selectExportType('DATAFRAME')}\\n        ></CardButton>\\n        <CardButton\\n          data-testid=\\"csv-export-option\\"\\n          title=\\"Export as PFB\\"\\n          subtitle=\\"Export data in Portable Format for Biomedical Data file format\\"\\n          size=\\"other\\"\\n          class=\\"card variant-ringed-primary\\"\\n          active={activeType === 'DATAFRAME_PFB'}\\n          on:click={() => selectExportType('DATAFRAME_PFB')}\\n        ></CardButton>\\n      </div>\\n    </section>\\n  </Step>\\n  <Step locked={!datasetNameInput || datasetNameInput.length < 2}>\\n    <svelte:fragment slot=\\"header\\">Save Dataset ID:</svelte:fragment>\\n    <section class=\\"flex flex-col w-full h-full items-center\\">\\n      <Summary />\\n      <div class=\\"w-full h-full m-2 card p-4\\">\\n        <header class=\\"card-header\\">\\n          Save the information in your final data export by clicking the Save Dataset ID button.\\n          Navigate to the <a class=\\"anchor\\" href=\\"/dataset\\">Manage Datasets page</a> to view or manage\\n          your Dataset IDs.\\n        </header>\\n        <hr />\\n        {#if error}\\n          <div class=\\"w-full h-full m-2\\">\\n            <ErrorAlert title=\\"Error\\">\\n              {error}\\n            </ErrorAlert>\\n          </div>\\n        {/if}\\n        <div class=\\"card-body p-4 flex flex-col justify-center items-center\\">\\n          <div>\\n            <div class=\\"flex items-center m-2\\">\\n              <label for=\\"dataset-name\\" class=\\"font-bold mr-2\\">Dataset Name:</label>\\n              <input\\n                type=\\"text\\"\\n                id=\\"dataset-name\\"\\n                class=\\"w-80\\"\\n                placeholder=\\"Enter a name\\"\\n                bind:value={datasetNameInput}\\n                required\\n              />\\n            </div>\\n            <div class=\\"flex items-center m-2\\">\\n              <div class=\\"flex items-center\\">\\n                <label for=\\"dataset-id\\" class=\\"font-bold mr-2\\">Dataset ID:</label>\\n                <div id=\\"dataset-id\\">{datasetId}</div>\\n              </div>\\n            </div>\\n          </div>\\n        </div>\\n      </div>\\n    </section>\\n  </Step>\\n  <Step locked={lockDownload}>\\n    <svelte:fragment slot=\\"header\\">Start Analysis:</svelte:fragment>\\n    <section class=\\"flex flex-col w-full h-full items-center\\">\\n      <div class=\\"flex justify-center\\">\\n        {#if canDownload}\\n          {#await statusPromise}\\n            <div class=\\"flex justify-center items-center\\">\\n              <ProgressRadial width=\\"w-4\\" />\\n              <div>Preparing your dataset...</div>\\n            </div>\\n          {:then}\\n            {#if query.query.expectedResultType === 'DATAFRAME'}\\n              <section class=\\"flex flex-col gap-8\\">\\n                <p class=\\"mt-4\\">\\n                  To export data and start your analysis, copy and paste the following code in an\\n                  analysis workspace, such as BioData Catalyst Powered by Seven Bridges or BioData\\n                  Catalyst Powered by Terra, to connect to PIC-SURE and save the data frame or\\n                  download the file. Note that you will need your personal access token to complete\\n                  the connection to PIC-SURE with code.\\n                </p>\\n                <TabGroup class=\\"card p-4\\">\\n                  <Tab bind:group={tabSet} name=\\"python\\" value={0}>Python</Tab>\\n                  <Tab bind:group={tabSet} name=\\"r\\" value={1}>R</Tab>\\n                  <Tab bind:group={tabSet} name=\\"download\\" value={2}>Download</Tab>\\n                  <svelte:fragment slot=\\"panel\\">\\n                    {#if tabSet === 0}\\n                      <CodeBlock\\n                        language=\\"python\\"\\n                        lineNumbers={true}\\n                        buttonCopied=\\"Copied!\\"\\n                        code={codeBlocks?.bdcPythonExport?.replace('{{queryId}}', datasetId) ||\\n                          'Code not set'}\\n                      ></CodeBlock>\\n                    {:else if tabSet === 1}\\n                      <CodeBlock\\n                        language=\\"r\\"\\n                        lineNumbers={true}\\n                        code={codeBlocks?.bdcRExport?.replace('{{queryId}}', datasetId) ||\\n                          'Code not set'}\\n                      ></CodeBlock>\\n                    {:else if tabSet === 2}\\n                      <div>\\n                        <button\\n                          class=\\"btn variant-filled-primary\\"\\n                          on:click={() =>\\n                            features.confirmDownload ? openConfirmationModal() : download()}\\n                          ><i class=\\"fa-solid fa-download mr-1\\"></i>Download as CSV</button\\n                        >\\n                      </div>\\n                    {/if}\\n                  </svelte:fragment>\\n                </TabGroup>\\n                <p>\\n                  Copy your personal access token and save as a text file called “token.txt” in the\\n                  same working directory to execute the code above.\\n                </p>\\n                <div class=\\"flex justify-center\\">\\n                  <UserToken />\\n                </div>\\n                <div class=\\"flex justify-center\\">\\n                  <a\\n                    class=\\"btn variant-ghost-primary m-2 hover:variant-filled-primary\\"\\n                    href=\\"https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui\\"\\n                    target=\\"_blank\\">Go to Seven Bridges</a\\n                  >\\n                  <a\\n                    class=\\"btn variant-ghost-primary m-2 hover:variant-filled-primary\\"\\n                    href=\\"https://terra.biodatacatalyst.nhlbi.nih.gov/\\"\\n                    target=\\"_blank\\">Go to Terra</a\\n                  >\\n                </div>\\n              </section>\\n            {:else if query.query.expectedResultType === 'DATAFRAME_PFB'}\\n              <section class=\\"flex flex-col gap-8\\">\\n                <div class=\\"flex justify-center mt-4\\">\\n                  Select an option below to export your selected data in PFB format.\\n                </div>\\n                {#if features.explorer.enableTerraExport}\\n                  <div class=\\"grid grid-cols-3\\">\\n                    <div></div>\\n                    <div>\\n                      <button\\n                        disabled={exportLoading}\\n                        class=\\"flex-initial w-64 btn variant-filled-primary disabled:variant-ghost-primary\\"\\n                        on:click={() => exportToTerra()}\\n                        ><i class=\\"fa-solid fa-arrow-up-right-from-square\\"></i>Export to Terra</button\\n                      >\\n                    </div>\\n                  </div>\\n                {/if}\\n                <div class=\\"grid grid-cols-3\\">\\n                  <div></div>\\n                  <div>\\n                    <button\\n                      class=\\"flex-initial w-64 btn variant-filled-primary\\"\\n                      on:click={() =>\\n                        features.confirmDownload ? openConfirmationModal() : download()}\\n                      ><i class=\\"fa-solid fa-download\\"></i>Download as PFB</button\\n                    >\\n                  </div>\\n                </div>\\n              </section>\\n            {/if}\\n          {:catch e}\\n            <div class=\\"flex justify-center\\">\\n              <ErrorAlert\\n                title=\\"An error occurred while preparing your dataset. Please try again. If this problem persists, please\\n                contact an administrator.\\"\\n              />\\n              <div class=\\"hidden\\">{e}</div>\\n            </div>\\n          {/await}\\n        {/if}\\n      </div>\\n      {#if apiExport}\\n        <div class=\\"flex flex-col justify-center items-center\\">\\n          <div class=\\"flex justify-center\\">\\n            Use your personal access token and the dataset ID to export your participant-level\\n            cohort data using the PIC-SURE API.\\n          </div>\\n          <UserToken />\\n          <div class=\\"flex items-center m-4\\">\\n            <div class=\\"flex items-center\\">\\n              <label for=\\"dataset-id\\" class=\\"font-bold ml-4 mr-2\\">Dataset ID:</label>\\n              <div id=\\"dataset-id\\" class=\\"mr-4\\">{datasetId}</div>\\n              <CopyButton itemToCopy={datasetId} />\\n            </div>\\n          </div>\\n          <p>\\n            Navigate to the <a class=\\"anchor\\" href=\\"/api\\">API page</a> to view examples and learn more\\n            about the PIC-SURE API.\\n          </p>\\n        </div>\\n      {/if}\\n    </section>\\n  </Step>\\n</Stepper>\\n\\n<style>\\n  input[type='text'] {\\n    border-radius: var(--theme-rounded-base);\\n  }</style>\\n"],"names":[],"mappings":"AAykBE,KAAK,CAAC,IAAI,CAAC,MAAM,gBAAE,CACjB,aAAa,CAAE,IAAI,oBAAoB,CACzC"}`
};
const ExportStepper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let datasetId;
  let canDownload;
  let apiExport;
  let exportLoading;
  let $exports, $$unsubscribe_exports;
  let $filters, $$unsubscribe_filters;
  let $totalParticipants, $$unsubscribe_totalParticipants;
  let $$unsubscribe_state;
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  $$unsubscribe_totalParticipants = subscribe(totalParticipants, (value) => $totalParticipants = value);
  $$unsubscribe_state = subscribe(state, (value) => value);
  let { exports, addExports, removeExports } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
  let { query } = $$props;
  let { showTreeStep = false } = $$props;
  let { rows = [] } = $$props;
  getModalStore();
  getToastStore();
  let statusPromise;
  let preparePromise;
  let datasetNameInput = "";
  let lockDownload = true;
  let sampleIds = false;
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
      sort: true
    }
  ];
  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1e6;
  let { activeType } = $$props;
  let tabSet = 0;
  function dataLimitExceeded() {
    let participantCount = typeof $totalParticipants === "number" ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints = participantCount + $filters.length + $exports.length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }
  if ($$props.query === void 0 && $$bindings.query && query !== void 0) $$bindings.query(query);
  if ($$props.showTreeStep === void 0 && $$bindings.showTreeStep && showTreeStep !== void 0) $$bindings.showTreeStep(showTreeStep);
  if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0) $$bindings.rows(rows);
  if ($$props.activeType === void 0 && $$bindings.activeType && activeType !== void 0) $$bindings.activeType(activeType);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    datasetId = "";
    canDownload = true;
    apiExport = false;
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
          return `${validate_component(Step, "Step").$$render($$result, { locked: dataLimitExceeded() }, {}, {
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
              )} ${features.explorer.enableSampleIdCheckbox ? `<div><label for="sample-ids-checkbox" class="flex items-center" data-testid="sample-ids-label">${`<input type="checkbox" class="mr-1 &amp;[aria-disabled=“true”]:opacity-75" data-testid="sample-ids-checkbox" id="sample-ids-checkbox"${add_attribute("checked", sampleIds, 1)}>`} <span data-svelte-h="svelte-julkv0">Include sample identifiers</span></label></div>` : ``}`}`}</section></div>`;
            }
          })} ${showTreeStep ? `${validate_component(Step, "Step").$$render($$result, {}, {}, {
            header: () => {
              return `Finalize Data:`;
            },
            default: () => {
              return `<section class="flex flex-col w-full h-full items-center">${validate_component(Summary, "Summary").$$render($$result, {}, {}, {})} <div class="w-full h-full m-2 card p-4" data-svelte-h="svelte-1l9s757"><header class="card-header">Select <strong>additional variables</strong> you would like to be included in your final
            data export.</header> <hr> <div class="card-body p-4">Tree Component Here</div></div></section>`;
            }
          })}` : ``} ${validate_component(Step, "Step").$$render($$result, { locked: activeType === void 0 }, {}, {
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
                  "data-testid": "csv-export-option",
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
          })} ${validate_component(Step, "Step").$$render(
            $$result,
            {
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
          your Dataset IDs.</header> <hr> ${``} <div class="card-body p-4 flex flex-col justify-center items-center"><div><div class="flex items-center m-2"><label for="dataset-name" class="font-bold mr-2" data-svelte-h="svelte-1i4hx8x">Dataset Name:</label> <input type="text" id="dataset-name" class="w-80 svelte-1jplhoe" placeholder="Enter a name" required${add_attribute("value", datasetNameInput, 0)}></div> <div class="flex items-center m-2"><div class="flex items-center"><label for="dataset-id" class="font-bold mr-2" data-svelte-h="svelte-vytwml">Dataset ID:</label> <div id="dataset-id">${escape(datasetId)}</div></div></div></div></div></div></section>`;
              }
            }
          )} ${validate_component(Step, "Step").$$render($$result, { locked: lockDownload }, {}, {
            header: () => {
              return `Start Analysis:`;
            },
            default: () => {
              return `<section class="flex flex-col w-full h-full items-center"><div class="flex justify-center">${canDownload ? `${function(__value) {
                if (is_promise(__value)) {
                  __value.then(null, noop);
                  return ` <div class="flex justify-center items-center">${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-4" }, {}, {})} <div data-svelte-h="svelte-1m53t1h">Preparing your dataset...</div></div> `;
                }
                return function() {
                  return ` ${query.query.expectedResultType === "DATAFRAME" ? `<section class="flex flex-col gap-8"><p class="mt-4" data-svelte-h="svelte-hpr0ix">To export data and start your analysis, copy and paste the following code in an
                  analysis workspace, such as BioData Catalyst Powered by Seven Bridges or BioData
                  Catalyst Powered by Terra, to connect to PIC-SURE and save the data frame or
                  download the file. Note that you will need your personal access token to complete
                  the connection to PIC-SURE with code.</p> ${validate_component(TabGroup, "TabGroup").$$render($$result, { class: "card p-4" }, {}, {
                    panel: () => {
                      return `${tabSet === 0 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                        $$result,
                        {
                          language: "python",
                          lineNumbers: true,
                          buttonCopied: "Copied!",
                          code: codeBlocks?.bdcPythonExport?.replace("{{queryId}}", datasetId) || "Code not set"
                        },
                        {},
                        {}
                      )}` : `${tabSet === 1 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                        $$result,
                        {
                          language: "r",
                          lineNumbers: true,
                          code: codeBlocks?.bdcRExport?.replace("{{queryId}}", datasetId) || "Code not set"
                        },
                        {},
                        {}
                      )}` : `${tabSet === 2 ? `<div><button class="btn variant-filled-primary" data-svelte-h="svelte-1t3f70y"><i class="fa-solid fa-download mr-1"></i>Download as CSV</button></div>` : ``}`}`} `;
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
                      )} ${validate_component(Tab, "Tab").$$render(
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
                      )}`;
                    }
                  })} <p data-svelte-h="svelte-104z5lh">Copy your personal access token and save as a text file called “token.txt” in the
                  same working directory to execute the code above.</p> <div class="flex justify-center">${validate_component(UserToken, "UserToken").$$render($$result, {}, {}, {})}</div> <div class="flex justify-center" data-svelte-h="svelte-h1oinp"><a class="btn variant-ghost-primary m-2 hover:variant-filled-primary" href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui" target="_blank">Go to Seven Bridges</a> <a class="btn variant-ghost-primary m-2 hover:variant-filled-primary" href="https://terra.biodatacatalyst.nhlbi.nih.gov/" target="_blank">Go to Terra</a></div></section>` : `${query.query.expectedResultType === "DATAFRAME_PFB" ? `<section class="flex flex-col gap-8"><div class="flex justify-center mt-4" data-svelte-h="svelte-1e8jgjm">Select an option below to export your selected data in PFB format.</div> ${features.explorer.enableTerraExport ? `<div class="grid grid-cols-3"><div></div> <div><button ${exportLoading ? "disabled" : ""} class="flex-initial w-64 btn variant-filled-primary disabled:variant-ghost-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i>Export to Terra</button></div></div>` : ``} <div class="grid grid-cols-3"><div></div> <div><button class="flex-initial w-64 btn variant-filled-primary" data-svelte-h="svelte-1o3nllj"><i class="fa-solid fa-download"></i>Download as PFB</button></div></div></section>` : ``}`} `;
                }();
              }(statusPromise)}` : ``}</div> ${apiExport ? `<div class="flex flex-col justify-center items-center"><div class="flex justify-center" data-svelte-h="svelte-1d55zu0">Use your personal access token and the dataset ID to export your participant-level
            cohort data using the PIC-SURE API.</div> ${validate_component(UserToken, "UserToken").$$render($$result, {}, {}, {})} <div class="flex items-center m-4"><div class="flex items-center"><label for="dataset-id" class="font-bold ml-4 mr-2" data-svelte-h="svelte-10o6xpf">Dataset ID:</label> <div id="dataset-id" class="mr-4">${escape(datasetId)}</div> ${validate_component(CopyButton, "CopyButton").$$render($$result, { itemToCopy: datasetId }, {}, {})}</div></div> <p data-svelte-h="svelte-188gcj5">Navigate to the <a class="anchor" href="/api">API page</a> to view examples and learn more
            about the PIC-SURE API.</p></div>` : ``}</section>`;
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
//# sourceMappingURL=ExportStepper-BbkBmoa3.js.map
