import { x as push, a4 as head, z as pop, M as escape_html, O as attr, N as attr_class, Q as stringify, U as store_get, S as ensure_array_like, a3 as maybe_selected, Y as await_block, X as unsubscribe_stores } from './index-BYsoXH7a.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { u as uuidInput } from './Forms-DH01zSCL.js';
import { w as writable } from './utils-Dn8W3aSK.js';
import '@sveltejs/kit';
import './User-CGCqDR6a.js';
import './index2-DXnmzf54.js';
import { C as Content } from './Content-D47GFKQW.js';
import { H as HelpInfoPopup } from './HelpInfoPopup-DgfCX4zR.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import { M as Modal_1 } from './Modal-CHSSe0AJ.js';
import { h as html } from './html2-FW6Ia4bL.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './Popover-Bb0SyMGZ.js';
import '@floating-ui/dom';
import './HTML-1Mhr8hI4.js';
import 'dompurify';

var UploadStatus = /* @__PURE__ */ ((UploadStatus2) => {
  UploadStatus2["Uploading"] = "Uploading";
  UploadStatus2["Querying"] = "Querying";
  UploadStatus2["Uploaded"] = "Uploaded";
  UploadStatus2["Error"] = "Error";
  UploadStatus2["Unsent"] = "Unsent";
  UploadStatus2["Unknown"] = "Unknown";
  UploadStatus2["Queued"] = "Queued";
  return UploadStatus2;
})(UploadStatus || {});
const sites = writable(null);
function DataSummary($$payload, $$props) {
  push();
  $$payload.out.push(`<section id="detail-summary-container" class="m-3"><table class="table bg-transparent"><tbody><tr><td>Dataset ID:</td><td data-testid="dataset-summary-uuid">${escape_html("Error")}</td></tr></tbody></table></section> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function DataLocModal($$payload) {
  $$payload.out.push(`<ul class="list-disc ml-4"><li>Select the <em class="font-bold">lead PI's home institution</em> from the drop-down menu. <ul class="list-none ml-4"><li><em>The lead PI is indicated on the RedCap form under the "Lead Principal Investigator's
          Institutional Affiliation"</em></li></ul></li> <li>The "Host Site," refers to the lead PI's home institution. The patient-level data will be stored
    in this institutional AWS-linked account.</li> <li>All collaborators listed on the RedCap form approved by the local SDAC will have access to the
    data within SWB.</li></ul>`);
}
function DataTypeModal($$payload) {
  $$payload.out.push(`<ul class="list-disc ml-4"><li><em class="font-bold">Phenotypic Data:</em> Clinical data, electronic health record information.</li> <li><em class="font-bold">Annotated variant data for selected genes:</em> The annotated variant data
    is sourced from the combined, annotated VCF and represents the patient cohort selected by the applied
    genomic and clinical filters. The original sample VCFs have been annotated using the Ensembl Variant
    Effect Predictor (VEP) to provide additional annotations and determine the effects of each variant.
    Modifier variants have been removed. To learn more visit the User Guide.</li></ul>`);
}
function Grid($$payload, $$props) {
  let { columns, children } = $$props;
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12"
  };
  const gridClass = gridClasses[columns] || "grid-cols-1";
  $$payload.out.push(`<div${attr_class(`grid ${gridClass} divide-x py-4`)}>`);
  children?.($$payload);
  $$payload.out.push(`<!----></div>`);
}
function GridCell($$payload, $$props) {
  let { title = "", help, children } = $$props;
  $$payload.out.push(`<div class="text-center p-4"><div class="border-b border-surface-200 text-center mb-2 flex flex-row gap-2">${escape_html(title)} `);
  help?.($$payload);
  $$payload.out.push(`<!----></div> `);
  children?.($$payload);
  $$payload.out.push(`<!----></div>`);
}
function StatusIndicator($$payload, $$props) {
  push();
  let { status = UploadStatus.Unsent, label } = $$props;
  function getStatusIcon() {
    switch (status) {
      case UploadStatus.Uploaded:
        return "fa-solid fa-circle-check text-success-600-400";
      case UploadStatus.Error:
        return "fa-solid fa-xmark text-error-600-400";
      case UploadStatus.Unknown:
        return "fa-solid fa-circle-question text-warning-600-400";
      case UploadStatus.Uploading:
      case UploadStatus.Queued:
      case UploadStatus.Querying:
        return "fa-regular fa-paper-plane text-tertiary-600-400";
      case UploadStatus.Unsent:
      default:
        return "fa-regular fa-paper-plane text-gray-500";
    }
  }
  $$payload.out.push(`<div class="flex flex-row items-center gap-2"${attr("data-testid", `status-indicator-${label?.replaceAll(" ", "-")?.toLowerCase()}`)}><i${attr_class(`${getStatusIcon()} flex-none`, "svelte-12nvqgl")}${attr("title", status)}${attr("data-testid", `status-indicator-icon`)}></i> <span>${escape_html(label)}</span></div>`);
  pop();
}
function SendDataModal($$payload, $$props) {
  push();
  let disablePrompt = false;
  let modalOpen = false;
  let { onConfirm } = $$props;
  function handleConfirm() {
    modalOpen = false;
    onConfirm?.();
  }
  $$payload.out.push(`<button type="button" data-testid="send-data-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"${attr("disabled", true, true)}>Send Data</button> `);
  Modal_1($$payload, {
    "data-testid": "send-data",
    open: modalOpen,
    disabled: true,
    withDefault: false,
    onconfirm: handleConfirm,
    children: ($$payload2) => {
      $$payload2.out.push(`<p class="font-bold text-center mb-4">Sending data from PIC-SURE to Service Workbench could take several minutes.</p> <p class="font-bold text-center mb-4">To update the status of your data upload, click the refresh button <i class="fa-solid fa-arrows-rotate fa-sm text-primary-500"></i> next to "Status".</p> <div class="flex gap-2"><div class="flex-auto"><label><input data-testid="send-data-remember-checkbox" type="checkbox" class="checkbox flex-none"${attr("checked", disablePrompt, true)}/> I understand, don't show this again</label></div> <div class="flex-none test-right"><button type="button" data-testid="send-data-modal-confirm-btn" class="btn preset-filled-primary-500">Okay, got it!</button></div></div>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!---->`);
  pop();
}
function Step($$payload, $$props) {
  let {
    step,
    title = "",
    collapsed = false,
    show = true,
    active = false,
    showLine = true,
    isFinal = false,
    complete = false,
    children
  } = $$props;
  if (show) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="v-stepper mb-3 last:mb-0"><div${attr("data-testid", `v-stepper-step-${step}`)} class="flex flex-row gap-2 my-2"${attr("aria-current", active ? "step" : false)}><div class="flex flex-col gap-2 items-center"><button><span class="badge rounded-2xl text-sm preset-filled-primary-500 h-fit mb-2">Step ${escape_html(step)}</span></button> `);
    if (showLine && !collapsed) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="border border-surface-200 h-[72%]"></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (showLine && isFinal) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span${attr_class(`badge rounded-2xl text-sm preset-filled-${stringify(complete ? "primary" : "surface")}-500 h-fit mb-2`)}>Done</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="flex-auto">`);
    if (title) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<h3 style="line-height: normal">${escape_html(title)}</h3>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (!collapsed) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="h-full">`);
      children?.($$payload);
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let datasetId = "";
  let approved = null;
  let requesterEmail = void 0;
  let datasetStorageLocation = void 0;
  let selectedSite = void 0;
  let isDataSent = false;
  let isRefreshing = false;
  let isComplete = false;
  let statusPromise = null;
  let dataType = { genomic: false, phenotypic: false, patient: false };
  const summaryModalOpen = false;
  let isSearchActive = true;
  let isReviewActive = approved === null;
  let showStep2 = false;
  async function handleSendData() {
    {
      console.error("No query available for sending data");
      return;
    }
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Data Requests</title>`;
  });
  Content($$payload, {
    title: "Data Requests",
    children: ($$payload2) => {
      Step($$payload2, {
        step: 1,
        title: "Search for Dataset ID",
        active: isSearchActive,
        showLine: true,
        children: ($$payload3) => {
          $$payload3.out.push(`<div class="flex flex-col items-center gap-3 mt-2 p-4 rounded bg-surface-100"><p>${html(branding.datasetRequestPage.searchIntro || "Search for a dataset request ID to continue.")}</p> <div class="flex flex-row items-start gap-3"><label class="label required flex flex-row items-center w-fit" for="dataset-id"><span class="mr-2 font-bold">Dataset ID:</span> <input id="dataset-id" class="input bg-surface-50 w-[375px]" placeholder="001234567-89ab-cdef-fedc-98765432100"${attr("value", datasetId)}${attr("pattern", uuidInput)}${attr("disabled", !isSearchActive, true)} required/></label> <button type="button" class="btn preset-filled-primary-500"${attr("disabled", !datasetId.trim(), true)} data-testid="search-dataset-btn"><span>Search</span></button></div> `);
          {
            $$payload3.out.push("<!--[!-->");
          }
          $$payload3.out.push(`<!--]--></div>`);
        }
      });
      $$payload2.out.push(`<!----> `);
      Step($$payload2, {
        step: 2,
        title: "Review Dataset Request",
        show: showStep2,
        active: isReviewActive,
        children: ($$payload3) => {
          $$payload3.out.push(`<div class="p-4 rounded bg-surface-100">`);
          Grid($$payload3, {
            columns: 2,
            children: ($$payload4) => {
              GridCell($$payload4, {
                title: "View Dataset Information",
                children: ($$payload5) => {
                  $$payload5.out.push(`<div class="flex flex-row gap-2 mb-2"><label class="label flex flex-row items-center gap-2" for="requester"><span class="font-bold">Requester:</span> <span>${escape_html(requesterEmail)}</span></label></div> <div class="flex flex-row gap-2 mb-2"><label class="label" for="storage-location"><span class="font-bold">Storage Location:</span> <span>${escape_html(datasetStorageLocation)}</span></label></div> `);
                  {
                    let trigger = function($$payload6) {
                      $$payload6.out.push(`<button type="button" data-testid="data-request-summary-btn" class="btn preset-filled-primary-500"><span>View Data Request Summary</span></button>`);
                    };
                    Modal_1($$payload5, {
                      title: "Data Request Summary",
                      "data-testid": "data-request",
                      open: summaryModalOpen,
                      withDefault: false,
                      trigger,
                      children: ($$payload6) => {
                        DataSummary($$payload6);
                      },
                      $$slots: { trigger: true, default: true }
                    });
                  }
                  $$payload5.out.push(`<!---->`);
                }
              });
              $$payload4.out.push(`<!----> `);
              GridCell($$payload4, {
                title: "Data Request Approval",
                children: ($$payload5) => {
                  $$payload5.out.push(`<label class="flex flex-col items-center gap-2"><div>Date approved by ${escape_html(store_get($$store_subs ??= {}, "$sites", sites)?.homeDisplay)} SDAC</div> <input class="input bg-surface-50 w-48 mt-1" data-testid="data-approved-date" type="date"${attr("value", approved)}/></label>`);
                }
              });
              $$payload4.out.push(`<!---->`);
            }
          });
          $$payload3.out.push(`<!----> `);
          {
            $$payload3.out.push("<!--[!-->");
          }
          $$payload3.out.push(`<!--]--></div>`);
        }
      });
      $$payload2.out.push(`<!----> `);
      Step($$payload2, {
        step: 3,
        title: "Share Patient-Level Data",
        show: showStep2,
        active: true,
        complete: isComplete,
        isFinal: true,
        children: ($$payload3) => {
          $$payload3.out.push(`<div class="p-4 rounded bg-surface-100">`);
          Grid($$payload3, {
            columns: 3,
            children: ($$payload4) => {
              {
                let help = function($$payload5) {
                  HelpInfoPopup($$payload5, {
                    text: "Data Storage Location",
                    id: "data-loc-modal",
                    children: ($$payload6) => {
                      DataLocModal($$payload6);
                    }
                  });
                };
                GridCell($$payload4, {
                  title: "Data Storage Location",
                  help,
                  children: ($$payload5) => {
                    const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$sites", sites)?.sites || []);
                    $$payload5.out.push(`<select id="selected-site" data-testid="selected-site" style="background-color: white;" aria-label="Select a site"${attr("disabled", isDataSent, true)} required class="svelte-1jxncjh">`);
                    $$payload5.select_value = selectedSite;
                    $$payload5.out.push(`<option value=""${maybe_selected($$payload5, "")} disabled selected class="svelte-1jxncjh">Select a site</option><!--[-->`);
                    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                      let site = each_array[$$index];
                      $$payload5.out.push(`<option${attr("value", site)}${maybe_selected($$payload5, site)} class="svelte-1jxncjh">${escape_html(site)}</option>`);
                    }
                    $$payload5.out.push(`<!--]-->`);
                    $$payload5.select_value = void 0;
                    $$payload5.out.push(`</select>`);
                  }
                });
              }
              $$payload4.out.push(`<!----> `);
              {
                let help = function($$payload5) {
                  HelpInfoPopup($$payload5, {
                    text: "Data Types",
                    id: "data-type-modal",
                    children: ($$payload6) => {
                      DataTypeModal($$payload6);
                    }
                  });
                };
                GridCell($$payload4, {
                  title: "Select & Send Data",
                  help,
                  children: ($$payload5) => {
                    $$payload5.out.push(`<label class="flex items-center space-x-2 my-2"><input type="checkbox" data-testid="data-pheno-checkbox" class="checkbox flex-none"${attr("disabled", true, true)}${attr("checked", dataType.phenotypic, true)}/> <div>Phenotypic Data</div></label> <label class="flex space-x-2 my-2 align-top"><input type="checkbox" data-testid="data-geno-checkbox" class="checkbox flex-none"${attr("disabled", true, true)}${attr("checked", dataType.genomic, true)}/> <div class="text-left flex-auto">Annotated variant data for selected genes</div></label> <label class="flex space-x-2 my-2 align-top"><input type="checkbox" data-testid="data-patient-checkbox" class="checkbox flex-none"${attr("disabled", true, true)}${attr("checked", dataType.patient, true)}/> <div class="text-left flex-auto">List of involved patients</div></label> `);
                    SendDataModal($$payload5, { onConfirm: handleSendData });
                    $$payload5.out.push(`<!---->`);
                  }
                });
              }
              $$payload4.out.push(`<!----> `);
              {
                let help = function($$payload5) {
                  $$payload5.out.push(`<button type="button" data-testid="status-refresh-btn" title="Refresh" class="text-primary-500 disabled:text-secondary-500"><i${attr_class("fa-solid fa-arrows-rotate fa-sm svelte-1jxncjh", void 0, { "spinning": isRefreshing })}></i> <span class="sr-only">Refresh</span></button>`);
                };
                GridCell($$payload4, {
                  title: "Status",
                  help,
                  children: ($$payload5) => {
                    await_block(
                      $$payload5,
                      statusPromise,
                      () => {
                        Loading($$payload5, { ring: true });
                      },
                      (statusInfo) => {
                        $$payload5.out.push(`<div class="flex flex-col gap-2 text-left">`);
                        StatusIndicator($$payload5, { status: statusInfo?.phenotypic, label: "Phenotypic Data" });
                        $$payload5.out.push(`<!----> `);
                        StatusIndicator($$payload5, {
                          status: statusInfo?.genomic,
                          label: "Annotated variant data for selected genes"
                        });
                        $$payload5.out.push(`<!----> `);
                        StatusIndicator($$payload5, {
                          status: statusInfo?.patient,
                          label: "List of involved patients"
                        });
                        $$payload5.out.push(`<!----></div>`);
                      }
                    );
                    $$payload5.out.push(`<!--]-->`);
                  }
                });
              }
              $$payload4.out.push(`<!---->`);
            }
          });
          $$payload3.out.push(`<!----></div>`);
        }
      });
      $$payload2.out.push(`<!----> <div class="flex justify-end mt-4"><button type="button" data-testid="reset-btn" class="btn preset-tonal-secondary border border-secondary-500 mx-4"${attr("disabled", !datasetId?.trim(), true)}>Reset</button></div>`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-7lj8XAW9.js.map
