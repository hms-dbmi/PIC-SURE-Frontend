import { c as create_ssr_component, a as add_attribute, v as validate_component, b as each, e as escape } from './ssr-BRJpAXVH.js';
import './client-BR749xJD.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './Connections-CKCS-Xz7.js';
import { k as createEventDispatcher } from './lifecycle-DtuISP6h.js';
import { p as parseFieldsFromJSON } from './Connection-DRlqdxWD.js';

const RequiredFieldRow = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let dirtyForm;
  createEventDispatcher();
  let { field = { label: "", id: "" } } = $$props;
  let { duplicate = false } = $$props;
  let label = field.label;
  let id = field.id;
  const newField = field.label === "" || field.id === "";
  let edit = newField;
  if ($$props.field === void 0 && $$bindings.field && field !== void 0) $$bindings.field(field);
  if ($$props.duplicate === void 0 && $$bindings.duplicate && duplicate !== void 0) $$bindings.duplicate(duplicate);
  dirtyForm = field.id !== id || field.label !== label;
  return `<div class="flex gap-4 p-3 odd:bg-surface-100-800-token even:bg-surface-50-900-token"${add_attribute("data-testid", `required-field-row-${field.id ? field.id : "new"}`, 0)}><label class="label flex-1"><span data-svelte-h="svelte-3s99bi">Label:</span> <input type="text" ${!edit ? "disabled" : ""} class="input" minlength="1" maxlength="255"${add_attribute("value", label, 0)}></label> <label class="label flex-1"><span data-svelte-h="svelte-1dt9zf9">ID:</span> <input type="text" ${!edit ? "disabled" : ""} class="${"input " + escape(duplicate && "variant-ghost-warning border-warning-500-400-token focus:border-warning-700-200-token", true)}" minlength="1" maxlength="255"${add_attribute("value", id, 0)}></label> <div class="flex-none content-end py-2">${edit ? `<button type="button" title="Save" data-testid="required-field-save-btn" class="btn-icon-color" ${!label || !id || !dirtyForm ? "disabled" : ""}><i class="fa-solid fa-floppy-disk fa-xl"></i> <span class="sr-only" data-svelte-h="svelte-1958rfi">Save</span></button> ${dirtyForm ? `<button type="button" title="Reset and cancel" class="btn-icon-color" data-testid="required-field-reset-btn" data-svelte-h="svelte-1o0fjlv"><i class="fa-solid fa-arrow-rotate-right fa-xl"></i> <span class="sr-only">Reset and cancel</span></button>` : `${!newField && !dirtyForm ? `<button type="button" title="Cancel" class="btn-icon-color" data-testid="required-field-cancel-btn" data-svelte-h="svelte-1vgxcks"><i class="fa-solid fa-ban fa-xl"></i> <span class="sr-only">Cancel</span></button>` : ``}`}` : `<button type="button" title="Edit" class="btn-icon-color" data-testid="required-field-edit-btn" data-svelte-h="svelte-m763yc"><i class="fa-solid fa-pen fa-xl"></i> <span class="sr-only">Edit</span></button>`} <button type="button" title="Delete" class="btn-icon-color" data-testid="required-field-delete-btn" data-svelte-h="svelte-19una3f"><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only">Delete</span></button></div></div>`;
});
const RequiredFieldsList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let fieldList;
  let enableNewField;
  let duplicates;
  createEventDispatcher();
  let { fields = "[]" } = $$props;
  function hasDuplicate(checkField) {
    return !!duplicates.find((field) => field === checkField);
  }
  if ($$props.fields === void 0 && $$bindings.fields && fields !== void 0) $$bindings.fields(fields);
  fieldList = parseFieldsFromJSON(fields);
  enableNewField = fieldList.length === 0;
  duplicates = fieldList.filter((checkField) => {
    return fieldList.filter((field) => field !== checkField).filter((field) => field.id === checkField.id).length > 0;
  });
  return `<fieldset class="border border-surface-300-600-token"><legend class="px-2 ml-2">Required Fields:
    <button type="button" class="text-primary-600-300-token hover:text-secondary-600-300-token" title="Add New Field" data-testid="required-field-new-btn" ${enableNewField ? "disabled" : ""}><i class="fa-solid fa-square-plus fa-xl"></i></button></legend> ${enableNewField ? `${validate_component(RequiredFieldRow, "RequiredFieldRow").$$render($$result, {}, {}, {})}` : ``} ${each(fieldList, (field, index) => {
    return `${validate_component(RequiredFieldRow, "RequiredFieldRow").$$render($$result, { duplicate: hasDuplicate(field), field }, {}, {})}`;
  })} ${duplicates.length > 0 ? `<aside data-testid="validation-warn" class="alert variant-ghost-warning m-2" data-svelte-h="svelte-rdnjrw"><i class="fa-solid fa-triangle-exclamation"></i> <div class="alert-message"><p>Fields with the same ID may not function properly.</p></div></aside>` : ``}</fieldset>`;
});
const ConnectionForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getToastStore();
  let { connection = void 0 } = $$props;
  let label = connection?.label || "";
  let id = connection?.id || "";
  let subPrefix = connection?.subPrefix || "";
  let requiredFields = connection?.requiredFields || "[]";
  if ($$props.connection === void 0 && $$bindings.connection && connection !== void 0) $$bindings.connection(connection);
  return `<p class="mb-3 text-center" data-svelte-h="svelte-kaypeb">For details on how to set up a Connection, please refer to the
  <a href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure/all-in-one-authentication-configuration#additional-authentication-configuration-option-s" target="_blank" class="anchor">PIC-SURE developer guide</a>.</p> <form class="grid gap-4 my-3">${connection?.uuid ? `<label class="label"><span data-svelte-h="svelte-xruxbf">UUID:</span> <input type="text" class="input"${add_attribute("value", connection?.uuid, 0)} ${"disabled"}></label>` : ``} <label class="label required"><span data-svelte-h="svelte-3s99bi">Label:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", label, 0)}></label> <label class="label required"><span data-svelte-h="svelte-1dt9zf9">ID:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", id, 0)}></label> <label class="label required"><span data-svelte-h="svelte-hkdo9q">Sub Prefix:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", subPrefix, 0)}></label> ${validate_component(RequiredFieldsList, "RequiredFieldsList").$$render($$result, { fields: requiredFields }, {}, {})} <div data-svelte-h="svelte-1blu6n4"><button type="submit" data-testid="connection-save-btn" class="btn variant-ghost-primary hover:variant-filled-primary">Save</button> <a href="/admin/configuration" data-testid="connection-cancel-btn" class="btn variant-ghost-secondary hover:variant-filled-secondary">Cancel</a></div></form>`;
});

export { ConnectionForm as C };
//# sourceMappingURL=ConnectionForm-CO3gI7Qv.js.map
