import { a as subscribe } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute, b as each } from './ssr-Di-o4HBA.js';
import { g as getModalStore } from './stores-Bn6ceQfl.js';
import { g as getToastStore } from './stores2-DrFt-twL.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import { u as uuidInput } from './Validation-DXCOBx8m.js';
import { C as Content } from './Content-BUgV6smf.js';
import { w as writable } from './index2-CV6P_ZFI.js';
import './index-CvuFLVuQ.js';
import './User-BlJO9WgU.js';
import './client-TAfaRk9z.js';
import './AngleButton-Cxjzo9QZ.js';
import './stores3-DsZ2QG0u.js';
import './exports-CTha0ECg.js';

const Step = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { step } = $$props;
  let { title = "" } = $$props;
  let { collapsed = false } = $$props;
  let { show = true } = $$props;
  let { inline = false } = $$props;
  let { active = false } = $$props;
  if ($$props.step === void 0 && $$bindings.step && step !== void 0) $$bindings.step(step);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.collapsed === void 0 && $$bindings.collapsed && collapsed !== void 0) $$bindings.collapsed(collapsed);
  if ($$props.show === void 0 && $$bindings.show && show !== void 0) $$bindings.show(show);
  if ($$props.inline === void 0 && $$bindings.inline && inline !== void 0) $$bindings.inline(inline);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  return `${show ? `<div class="v-stepper mb-3 last:mb-0"><div${add_attribute("data-testid", `v-stepper-step-${step}`, 0)} class="flex gap-2 my-2"${add_attribute("aria-current", active ? "step" : false, 0)}><div class="flex-none pt-1"><span${add_attribute(
    "class",
    `avatar flex aspect-square justify-center items-center overflow-hidden isolate w-8 rounded-full text-xl ${active ? "variant-ghost-primary" : "variant-ringed-primary"}`,
    0
  )}>${escape(step)}</span></div> ${title ? `<div${add_attribute("class", `flex-${inline ? "none" : "auto"}`, 0)}><h3>${escape(title)}</h3></div>` : ``} ${inline ? `<div class="flex-auto">${slots.default ? slots.default({}) : ``}</div>` : ``}</div> ${!inline && !collapsed ? `<div class="border rounded-md border-surface-500-400-token ml-4 p-1">${slots.default ? slots.default({}) : ``}</div>` : ``}</div>` : ``}`;
});
const Grid = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { columns } = $$props;
  if ($$props.columns === void 0 && $$bindings.columns && columns !== void 0) $$bindings.columns(columns);
  return `<div${add_attribute("class", `grid grid-cols-${columns} divide-x py-4`, 0)}>${slots.default ? slots.default({}) : ``}</div>`;
});
const GridCell = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title = "" } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  return `<div class="text-center border-surface-500-400-token px-4"><div class="border-b border-primary-500-400-token text-center mb-2">${escape(title)} ${slots.help ? slots.help({}) : ``}</div> ${slots.default ? slots.default({}) : ``}</div>`;
});
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
const queryError = writable(false);
const sites = writable(null);
const metadata = writable(null);
const status = writable(null);
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let search;
  let review;
  let share;
  let sendEnabled;
  let statusInfo;
  let $$unsubscribe_metadata;
  let $status, $$unsubscribe_status;
  let $dataType, $$unsubscribe_dataType;
  let $approved, $$unsubscribe_approved;
  let $queryId, $$unsubscribe_queryId;
  let $queryError, $$unsubscribe_queryError;
  let $sites, $$unsubscribe_sites;
  let $$unsubscribe_selectedSite;
  $$unsubscribe_metadata = subscribe(metadata, (value) => value);
  $$unsubscribe_status = subscribe(status, (value) => $status = value);
  $$unsubscribe_dataType = subscribe(dataType, (value) => $dataType = value);
  $$unsubscribe_approved = subscribe(approved, (value) => $approved = value);
  $$unsubscribe_queryId = subscribe(queryId, (value) => $queryId = value);
  $$unsubscribe_queryError = subscribe(queryError, (value) => $queryError = value);
  $$unsubscribe_sites = subscribe(sites, (value) => $sites = value);
  $$unsubscribe_selectedSite = subscribe(selectedSite, (value) => value);
  getModalStore();
  getToastStore();
  function statusIcon(status2) {
    return [
      {
        progress: [UploadStatus.Uploaded],
        icon: "fa-regular fa-circle-check text-success-500-400-token",
        label: "Upload Successful"
      },
      {
        progress: [UploadStatus.Queued, UploadStatus.Querying, UploadStatus.Uploading],
        icon: "fa-regular fa-paper-plane text-tertiary-500-400-token",
        label: "Uploading..."
      },
      {
        progress: [UploadStatus.Error, UploadStatus.Unknown],
        icon: "fa-solid fa-circle-xmark text-error-500-400-token",
        label: "Upload Failed"
      }
    ].find(({ progress }) => progress.includes(status2)) || {
      icon: "fa-regular fa-circle-xmark text-primary-500-400-token",
      label: "Unsent"
    };
  }
  search = {
    show: true,
    active: $queryError || !$queryId && !$approved
  };
  review = {
    show: !$queryError && !!$queryId,
    active: !$queryError && !!$queryId && !$approved
  };
  share = {
    show: !$queryError && !!$queryId && !!$approved,
    active: !$queryError && !!$queryId && !!$approved
  };
  sendEnabled = $dataType.genomic && $status?.genomic === UploadStatus.Unsent || $dataType.phenotypic && $status?.phenotypic === UploadStatus.Unsent;
  statusInfo = {
    genomic: statusIcon($status?.genomic || UploadStatus.Unsent),
    phenotypic: statusIcon($status?.phenotypic || UploadStatus.Unsent)
  };
  $$unsubscribe_metadata();
  $$unsubscribe_status();
  $$unsubscribe_dataType();
  $$unsubscribe_approved();
  $$unsubscribe_queryId();
  $$unsubscribe_queryError();
  $$unsubscribe_sites();
  $$unsubscribe_selectedSite();
  return `${$$result.head += `<!-- HEAD_svelte-1cikpg3_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Data Requests</title>`, ""}<!-- HEAD_svelte-1cikpg3_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Data Requests" }, {}, {
    default: () => {
      return `${validate_component(Step, "Step").$$render(
        $$result,
        {
          step: 1,
          title: "Search for Dataset Request ID",
          inline: true,
          active: search.active
        },
        {},
        {
          default: () => {
            return `<label class="inline label required"><span class="sr-only" data-svelte-h="svelte-rqdy7g">Dataset Id:</span> <input class="input w-3/4" placeholder="001234567-89ab-cdef-fedc-98765432100"${add_attribute("pattern", uuidInput, 0)} ${!search.active ? "disabled" : ""}${add_attribute("value", $queryId, 0)}></label>`;
          }
        }
      )} ${validate_component(Step, "Step").$$render(
        $$result,
        {
          step: 2,
          title: "Review Dataset Request",
          show: review.show,
          active: review.active
        },
        {},
        {
          default: () => {
            return `${validate_component(Grid, "Grid").$$render($$result, { columns: 2 }, {}, {
              default: () => {
                return `${validate_component(GridCell, "GridCell").$$render($$result, { title: "View Dataset Information" }, {}, {
                  default: () => {
                    return `<div><button data-testid="data-request-btn" class="text-primary-700-200-token hover:text-secondary-700-200-token inline-block mt-4" data-svelte-h="svelte-1w1dd84"><i class="fa-regular fa-2xl fa-file-pdf"></i> <span>Data Request Summary</span></button></div>`;
                  }
                })} ${validate_component(GridCell, "GridCell").$$render($$result, { title: "Data Request Approval" }, {}, {
                  default: () => {
                    return `<label><div>Date approved by ${escape($sites?.homeDisplay)} SDAC</div> <input class="input w-48 mt-1" data-testid="data-approved-date" type="date" ${!review.active ? "disabled" : ""}${add_attribute("value", $approved, 0)}></label>`;
                  }
                })}`;
              }
            })}`;
          }
        }
      )} ${validate_component(Step, "Step").$$render(
        $$result,
        {
          step: 3,
          title: "Share Patient-Level Data",
          show: share.show,
          active: share.active
        },
        {},
        {
          default: () => {
            return `${validate_component(Grid, "Grid").$$render($$result, { columns: 3 }, {}, {
              default: () => {
                return `${validate_component(GridCell, "GridCell").$$render($$result, { title: "Data Storage Location" }, {}, {
                  help: () => {
                    return `<button data-testid="data-loc-modal-btn" data-svelte-h="svelte-1502un6"><i class="fa-regular fa-circle-question fa-sm text-primary-500"></i></button> `;
                  },
                  default: () => {
                    return `<select data-testid="selected-site" class="select" ${!!$status?.site ? "disabled" : ""}>${each($sites?.sites || [], (site) => {
                      return `<option${add_attribute("value", site, 0)}>${escape(site)}</option>`;
                    })}</select>`;
                  }
                })} ${validate_component(GridCell, "GridCell").$$render($$result, { title: "Select & Send Data" }, {}, {
                  help: () => {
                    return `<button data-testid="data-type-modal-btn" data-svelte-h="svelte-1558hwz"><i class="fa-regular fa-circle-question fa-sm text-primary-500"></i></button> `;
                  },
                  default: () => {
                    return `<label class="flex items-center space-x-2 my-2"><input type="checkbox" data-testid="data-pheno-checkbox" class="checkbox flex-none" ${$status?.phenotypic !== UploadStatus.Unsent ? "disabled" : ""}${add_attribute("checked", $dataType.phenotypic, 1)}> <p data-svelte-h="svelte-1lskvjr">Phenotypic Data</p></label> <label class="flex space-x-2 my-2 align-top"><input type="checkbox" data-testid="data-geno-checkbox" class="checkbox flex-none" ${$status?.genomic !== UploadStatus.Unsent ? "disabled" : ""}${add_attribute("checked", $dataType.genomic, 1)}> <p class="text-left flex-auto" data-svelte-h="svelte-18uhc8">Annotated variant data for selected genes</p></label> <button type="button" data-testid="send-data-btn" class="btn variant-ringed-success hover:variant-ghost-success" ${!sendEnabled ? "disabled" : ""}>Send Data</button>`;
                  }
                })} ${validate_component(GridCell, "GridCell").$$render($$result, { title: "Status" }, {}, {
                  help: () => {
                    return `<button type="button" data-testid="status-refresh-btn" title="Refresh" class="text-primary-500 disabled:text-secondary-500" data-svelte-h="svelte-hu49xl"><i class="fa-solid fa-arrows-rotate fa-sm"></i> <span class="sr-only">Refresh</span></button> `;
                  },
                  default: () => {
                    return `<div class="flex space-x-2 my-2 align-top"><i${add_attribute("class", `${statusInfo.phenotypic.icon} flex-none`, 0)}></i> <p class="text-left flex-auto">Phenotypic Data: <span data-testid="status-pheno">${escape(statusInfo.phenotypic.label)}</span></p></div> <div class="flex space-x-2 my-2 align-top"><i${add_attribute("class", `${statusInfo.genomic.icon} flex-none`, 0)}></i> <p class="text-left flex-auto">Annotated variant data for selected genes: <span data-testid="status-geno">${escape(statusInfo.genomic.label)}</span></p></div>`;
                  }
                })}`;
              }
            })}`;
          }
        }
      )} ${review.show || share.show ? `<button type="button" data-testid="reset-btn" class="btn variant-ghost-secondary float-right" data-svelte-h="svelte-1qa8mow">Reset</button>` : ``}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Bp4mkG-Y.js.map
