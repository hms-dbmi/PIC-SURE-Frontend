import { x as push, T as store_get, a1 as head, W as unsubscribe_stores, z as pop, K as escape_html, N as attr, M as attr_class, R as ensure_array_like } from './index-BKfiikQf.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { u as uuidInput } from './Forms-DH01zSCL.js';
import './toaster-DzAsAKEJ.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { w as writable, h as get } from './exports-CKriv3vT.js';
import { p as post } from './User-DPh8mmLT.js';
import { Q as QuerySummary } from './QuerySummary-0JeRqrJn.js';
import { M as Modal_1 } from './Modal-DVSOHq6m.js';
import './index-BB9JrA1L.js';
import './client-HRCS46UK.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './machine.svelte-D_VZYMjT.js';

function Step($$payload, $$props) {
  let {
    step,
    title = "",
    collapsed = false,
    show = true,
    inline = false,
    active = false,
    children
  } = $$props;
  if (show) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="v-stepper mb-3 last:mb-0"><div${attr("data-testid", `v-stepper-step-${step}`)} class="flex gap-2 my-2"${attr("aria-current", active ? "step" : false)}><div class="flex-none pt-1"><span${attr_class(`avatar flex aspect-square justify-center items-center overflow-hidden isolate w-8 rounded-full text-xl ${active ? "preset-tonal-primary border border-primary-500" : "preset-outlined-primary-500"}`)}>${escape_html(step)}</span></div> `;
    if (title) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div${attr_class(`flex-${inline ? "none" : "auto"}`)}><h3>${escape_html(title)}</h3></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (inline) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex-auto">`;
      children?.($$payload);
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> `;
    if (!inline && !collapsed) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="border rounded-md border-surface-600-400 ml-4 p-1">`;
      children?.($$payload);
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
}
function Grid($$payload, $$props) {
  let { columns, children } = $$props;
  $$payload.out += `<div${attr_class(`grid grid-cols-${columns} divide-x py-4`)}>`;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
}
function GridCell($$payload, $$props) {
  let { title = "", help, children } = $$props;
  $$payload.out += `<div class="text-center border-surface-600-400 px-4 my-3"><div class="border-b border-primary-600-400 text-center mb-2">${escape_html(title)} `;
  help?.($$payload);
  $$payload.out += `<!----></div> `;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
}
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
const UPLOAD_URL = "picsure/proxy/uploader/upload";
const valid = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  date: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/
};
const selectedSite = writable("");
const dataType = writable({ genomic: false, phenotypic: false });
const _queryId = writable("");
const _approved = writable("");
const queryId = {
  ..._queryId,
  set: (value) => {
    if (valid.uuid.test(value)) {
      _queryId.set(value);
    }
  }
};
const approved = {
  ..._approved,
  set: (value) => {
    if (valid.date.test(value)) {
      _approved.set(value);
    }
  }
};
const error = writable("");
const queryError = writable(false);
const sites = writable(null);
const metadata = writable(null);
const status = writable(null);
function setError(message, query = false) {
  return function(e) {
    if (query) {
      queryError.set(true);
    }
    console.error(e);
    error.set(message);
  };
}
function throwOnErrorValue(value) {
  if (value?.error) {
    return Promise.reject(value.error);
  }
  return value;
}
async function sendData() {
  const query = get(queryId);
  const meta = get(metadata);
  const site = get(selectedSite);
  if (!query || !meta || !site) return;
  const type = get(dataType);
  const stat = get(status);
  const req = (type2) => post(`${UPLOAD_URL}/${site}?` + new URLSearchParams({ dataType: type2 }), {
    ...meta.resultMetadata.queryJson.query,
    picSureId: query
  }).then(throwOnErrorValue).then(status.set).catch(setError(`Error sending ${type2} data request`));
  if (type.phenotypic && stat?.phenotypic === UploadStatus.Unsent) {
    await req("Phenotypic");
  }
  if (type.genomic && stat?.genomic === UploadStatus.Unsent) {
    await req("Genomic");
  }
}
function DataSummary($$payload, $$props) {
  push();
  var $$store_subs;
  let queryId2 = store_get($$store_subs ??= {}, "$metadata", metadata)?.picsureResultId || "";
  let query = store_get($$store_subs ??= {}, "$metadata", metadata)?.resultMetadata.queryJson.query || {};
  $$payload.out += `<section id="detail-summary-container" class="m-3"><table class="table bg-transparent"><tbody><tr><td>Dataset ID:</td><td data-testid="dataset-summary-uuid">${escape_html(queryId2)}</td></tr></tbody></table></section> `;
  if (query) {
    $$payload.out += "<!--[-->";
    QuerySummary($$payload, { query });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function DataLocModal($$payload) {
  $$payload.out += `<ul class="list-disc ml-4"><li>Select the <em class="font-bold">lead PI's home institution</em> from the drop-down menu. <ul class="list-none ml-4"><li><em>The lead PI is indicated on the RedCap form under the "Lead Principal Investigator's
          Institutional Affiliation"</em></li></ul></li> <li>The "Host Site," refers to the lead PI's home institution. The patient-level data will be stored
    in this institutional AWS-linked account.</li> <li>All collaborators listed on the RedCap form approved by the local SDAC will have access to the
    data within SWB.</li></ul>`;
}
function DataTypeModal($$payload) {
  $$payload.out += `<ul class="list-disc ml-4"><li><em class="font-bold">Phenotypic Data:</em> Clinical data, electronic health record information.</li> <li><em class="font-bold">Annotated variant data for selected genes:</em> The annotated variant data
    is sourced from the combined, annotated VCF and represents the patient cohort selected by the applied
    genomic and clinical filters. The original sample VCFs have been annotated using the Ensembl Variant
    Effect Predictor (VEP) to provide additional annotations and determine the effects of each variant.
    Modifier variants have been removed. To learn more visit the User Guide.</li></ul>`;
}
function SendDataModal($$payload, $$props) {
  push();
  let disablePrompt = false;
  let modalOpen = false;
  const { sendEnabled = false } = $$props;
  $$payload.out += `<button type="button" data-testid="send-data-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"${attr("disabled", !sendEnabled, true)}>Send Data</button> `;
  Modal_1($$payload, {
    "data-testid": "send-data",
    open: modalOpen,
    disabled: !sendEnabled,
    withDefault: false,
    onconfirm: sendData,
    children: ($$payload2) => {
      $$payload2.out += `<p class="font-bold text-center mb-4">Sending data from PIC-SURE to Service Workbench could take several minutes.</p> <p class="font-bold text-center mb-4">To update the status of your data upload, click the refresh button <i class="fa-solid fa-arrows-rotate fa-sm text-primary-500"></i> next to "Status".</p> <div class="flex gap-2"><div class="flex-auto"><label><input data-testid="send-data-remember-checkbox" type="checkbox" class="checkbox flex-none"${attr("checked", disablePrompt, true)}/> I understand, don't show this again</label></div> <div class="flex-none test-right"><button type="button" data-testid="send-data-modal-confirm-btn" class="btn preset-filled-primary-500">Okay, got it!</button></div></div>`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!---->`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let search = {
    active: store_get($$store_subs ??= {}, "$queryError", queryError) || !store_get($$store_subs ??= {}, "$queryId", queryId) && !store_get($$store_subs ??= {}, "$approved", approved)
  };
  let review = {
    show: !store_get($$store_subs ??= {}, "$queryError", queryError) && !!store_get($$store_subs ??= {}, "$queryId", queryId),
    active: !store_get($$store_subs ??= {}, "$queryError", queryError) && !!store_get($$store_subs ??= {}, "$queryId", queryId) && !store_get($$store_subs ??= {}, "$approved", approved)
  };
  let share = {
    show: !store_get($$store_subs ??= {}, "$queryError", queryError) && !!store_get($$store_subs ??= {}, "$queryId", queryId) && !!store_get($$store_subs ??= {}, "$approved", approved),
    active: !store_get($$store_subs ??= {}, "$queryError", queryError) && !!store_get($$store_subs ??= {}, "$queryId", queryId) && !!store_get($$store_subs ??= {}, "$approved", approved)
  };
  let sendEnabled = store_get($$store_subs ??= {}, "$dataType", dataType).genomic && store_get($$store_subs ??= {}, "$status", status)?.genomic === UploadStatus.Unsent || store_get($$store_subs ??= {}, "$dataType", dataType).phenotypic && store_get($$store_subs ??= {}, "$status", status)?.phenotypic === UploadStatus.Unsent;
  let modalOpen = { summary: false, location: false, type: false };
  function statusIcon(status2) {
    return [
      {
        progress: [UploadStatus.Uploaded],
        icon: "fa-regular fa-circle-check text-success-600-400",
        label: "Upload Successful"
      },
      {
        progress: [
          UploadStatus.Queued,
          UploadStatus.Querying,
          UploadStatus.Uploading
        ],
        icon: "fa-regular fa-paper-plane text-tertiary-600-400",
        label: "Uploading..."
      },
      {
        progress: [UploadStatus.Error, UploadStatus.Unknown],
        icon: "fa-solid fa-circle-xmark text-error-600-400",
        label: "Upload Failed"
      }
    ].find(({ progress }) => progress.includes(status2)) || {
      icon: "fa-regular fa-circle-xmark text-primary-600-400",
      label: "Unsent"
    };
  }
  let statusInfo = {
    genomic: statusIcon(store_get($$store_subs ??= {}, "$status", status)?.genomic || UploadStatus.Unsent),
    phenotypic: statusIcon(store_get($$store_subs ??= {}, "$status", status)?.phenotypic || UploadStatus.Unsent)
  };
  let datasetId = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Data Requests</title>`;
  });
  Content($$payload, {
    title: "Data Requests",
    children: ($$payload2) => {
      Step($$payload2, {
        step: 1,
        title: "Search for Dataset Request ID",
        inline: true,
        active: search.active,
        children: ($$payload3) => {
          $$payload3.out += `<label class="inline label required"><span class="sr-only">Dataset Id:</span> <input class="input w-3/4" placeholder="001234567-89ab-cdef-fedc-98765432100"${attr("value", datasetId)}${attr("pattern", uuidInput)}${attr("disabled", !search.active, true)}/></label>`;
        }
      });
      $$payload2.out += `<!----> `;
      Step($$payload2, {
        step: 2,
        title: "Review Dataset Request",
        show: review.show,
        active: review.active,
        children: ($$payload3) => {
          Grid($$payload3, {
            columns: 2,
            children: ($$payload4) => {
              GridCell($$payload4, {
                title: "View Dataset Information",
                children: ($$payload5) => {
                  $$payload5.out += `<div>`;
                  {
                    let trigger = function($$payload6) {
                      $$payload6.out += `<i class="fa-regular fa-2xl fa-file-pdf"></i> <span>Data Request Summary</span>`;
                    };
                    Modal_1($$payload5, {
                      title: "Data Request Summary",
                      "data-testid": "data-request",
                      open: modalOpen.summary,
                      withDefault: false,
                      trigger,
                      children: ($$payload6) => {
                        DataSummary($$payload6);
                      },
                      $$slots: { trigger: true, default: true }
                    });
                  }
                  $$payload5.out += `<!----></div>`;
                }
              });
              $$payload4.out += `<!----> `;
              GridCell($$payload4, {
                title: "Data Request Approval",
                children: ($$payload5) => {
                  $$payload5.out += `<label><div>Date approved by ${escape_html(store_get($$store_subs ??= {}, "$sites", sites)?.homeDisplay)} SDAC</div> <input class="input w-48 mt-1" data-testid="data-approved-date" type="date"${attr("value", store_get($$store_subs ??= {}, "$approved", approved))}${attr("disabled", !review.active, true)}/></label>`;
                }
              });
              $$payload4.out += `<!---->`;
            }
          });
        }
      });
      $$payload2.out += `<!----> `;
      Step($$payload2, {
        step: 3,
        title: "Share Patient-Level Data",
        show: share.show,
        active: share.active,
        children: ($$payload3) => {
          Grid($$payload3, {
            columns: 3,
            children: ($$payload4) => {
              {
                let help = function($$payload5) {
                  {
                    let trigger = function($$payload6) {
                      $$payload6.out += `<i class="fa-regular fa-circle-question fa-sm text-primary-500"></i>`;
                    };
                    Modal_1($$payload5, {
                      title: "Data Storage Location",
                      "data-testid": "data-loc-modal",
                      open: modalOpen.location,
                      withDefault: false,
                      trigger,
                      children: ($$payload6) => {
                        DataLocModal($$payload6);
                      },
                      $$slots: { trigger: true, default: true }
                    });
                  }
                };
                GridCell($$payload4, {
                  title: "Data Storage Location",
                  help,
                  children: ($$payload5) => {
                    const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$sites", sites)?.sites || []);
                    $$payload5.out += `<select data-testid="selected-site" class="select"${attr("disabled", !!store_get($$store_subs ??= {}, "$status", status)?.site, true)}><!--[-->`;
                    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                      let site = each_array[$$index];
                      $$payload5.out += `<option${attr("value", site)}>${escape_html(site)}</option>`;
                    }
                    $$payload5.out += `<!--]--></select>`;
                  }
                });
              }
              $$payload4.out += `<!----> `;
              {
                let help = function($$payload5) {
                  {
                    let trigger = function($$payload6) {
                      $$payload6.out += `<i class="fa-regular fa-circle-question fa-sm text-primary-500"></i>`;
                    };
                    Modal_1($$payload5, {
                      title: "Data Types",
                      "data-testid": "data-type-modal",
                      open: modalOpen.type,
                      withDefault: false,
                      trigger,
                      children: ($$payload6) => {
                        DataTypeModal($$payload6);
                      },
                      $$slots: { trigger: true, default: true }
                    });
                  }
                };
                GridCell($$payload4, {
                  title: "Select & Send Data",
                  help,
                  children: ($$payload5) => {
                    $$payload5.out += `<label class="flex items-center space-x-2 my-2"><input type="checkbox" data-testid="data-pheno-checkbox" class="checkbox flex-none"${attr("disabled", store_get($$store_subs ??= {}, "$status", status)?.phenotypic !== UploadStatus.Unsent, true)}${attr("checked", store_get($$store_subs ??= {}, "$dataType", dataType).phenotypic, true)}/> <div>Phenotypic Data</div></label> <label class="flex space-x-2 my-2 align-top"><input type="checkbox" data-testid="data-geno-checkbox" class="checkbox flex-none"${attr("disabled", store_get($$store_subs ??= {}, "$status", status)?.genomic !== UploadStatus.Unsent, true)}${attr("checked", store_get($$store_subs ??= {}, "$dataType", dataType).genomic, true)}/> <div class="text-left flex-auto">Annotated variant data for selected genes</div></label> `;
                    SendDataModal($$payload5, { sendEnabled });
                    $$payload5.out += `<!---->`;
                  }
                });
              }
              $$payload4.out += `<!----> `;
              {
                let help = function($$payload5) {
                  $$payload5.out += `<button type="button" data-testid="status-refresh-btn" title="Refresh" class="text-primary-500 disabled:text-secondary-500"><i class="fa-solid fa-arrows-rotate fa-sm"></i> <span class="sr-only">Refresh</span></button>`;
                };
                GridCell($$payload4, {
                  title: "Status",
                  help,
                  children: ($$payload5) => {
                    $$payload5.out += `<div class="flex space-x-2 my-2 align-top"><i${attr_class(`${statusInfo.phenotypic.icon} flex-none`)}></i> <div class="text-left flex-auto">Phenotypic Data: <span data-testid="status-pheno">${escape_html(statusInfo.phenotypic.label)}</span></div></div> <div class="flex space-x-2 my-2 align-top"><i${attr_class(`${statusInfo.genomic.icon} flex-none`)}></i> <div class="text-left flex-auto">Annotated variant data for selected genes: <span data-testid="status-geno">${escape_html(statusInfo.genomic.label)}</span></div></div>`;
                  }
                });
              }
              $$payload4.out += `<!---->`;
            }
          });
        }
      });
      $$payload2.out += `<!----> `;
      if (review.show || share.show) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<button type="button" data-testid="reset-btn" class="btn preset-tonal-secondary border border-secondary-500 float-right">Reset</button>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Is_P9F6n.js.map
